const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID } = require('../utils/userCommon');

// --- 1. GET EMPLOYEE LIST (For Dropdown) ---
exports.getEmployeeList = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Fetch User info to check Admin status
        const [user] = await sequelize.query(
            `SELECT IsAdmin FROM CrmUsers WHERE ID = :userId`,
            { replacements: { userId }, type: QueryTypes.SELECT }
        );

        let sql = "";
        if (user && user.IsAdmin === true) { // Adjust boolean check based on your DB (1 or true)
            sql = `SELECT ID, Name FROM CrmUsers WHERE UserType = 'I' AND IsActive = 1 ORDER BY Name ASC`;
        } else {
            sql = `SELECT ID, Name FROM CrmUsers WHERE UserType = 'I' AND IsActive = 1 AND ID = :userId ORDER BY Name ASC`;
        }

        const employees = await sequelize.query(sql, { 
            replacements: { userId }, 
            type: QueryTypes.SELECT 
        });

        res.json({
            StreamType: "TABULAR",
            StreamName: "AttnEmpList",
            Data: employees,
            IsAdmin: user ? user.IsAdmin : false
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 2. FETCH ATTENDANCE RECORDS ---
exports.getAttendanceRecords = async (req, res) => {
    try {
        let { AttnFromDate, AttnToDate, AttnEmpID, AttnEmpName } = req.query;

        if (AttnEmpID === "ALL") AttnEmpID = "";

        // Build the UDF Call String dynamically
        let udfFunction = "";
        let whereClause = "WHERE B.AttnDate IS NOT NULL";
        const replacements = {};

        if (AttnFromDate && !AttnToDate) {
            udfFunction = `[dbo].[udf-Range-Date]('${AttnFromDate}', GETDATE(), 'DD', 1) A`;
        } else if (!AttnFromDate && AttnToDate) {
            udfFunction = `[dbo].[udf-Range-Date](GETDATE(), '${AttnToDate}', 'DD', 1) A`;
        } else if (AttnFromDate && AttnToDate) {
            udfFunction = `[dbo].[udf-Range-Date]('${AttnFromDate}', '${AttnToDate}', 'DD', 1) A`;
        } else {
            udfFunction = `[dbo].[udf-Range-Date](GETDATE(), GETDATE(), 'DD', 1) A`;
        }

        if (AttnEmpID) {
            whereClause += ` AND B.UserID = :empId`;
            replacements.empId = AttnEmpID;
        }

        const sql = `
            SELECT * FROM ${udfFunction}
            LEFT JOIN (
                SELECT 
                    REPLACE(CONVERT(VARCHAR(50), A.AttnDate, 106), ' ', '-') AS AttnDate,
                    CONVERT(CHAR(5), A.PunchTime, 108) AS PunchTime,
                    A.Device,
                    B.Name,
                    A.PunchType,
                    A.PunchLat + ' , ' + A.PunchLong AS PunchLatLong,
                    B.ID AS UserID,
                    NULL AS Attn,
                    ISNULL(D.WeeklyOffDefCSV, 0) AS WeeklyOffDefCSV,
                    DATEPART(WEEKDAY, A.AttnDate) AS WeekDayNo
                FROM HCAttnDailyPunches2 A
                LEFT JOIN CrmUsers B ON B.ID = A.EmpID
                LEFT JOIN MasShifts D ON D.ID = B.ID
            ) B ON B.AttnDate = A.RetVal
            ${whereClause}
            ORDER BY A.RetSeq DESC
        `;

        const rawRecords = await sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

        // JavaScript Grouping Logic (Replaces PHP foreach loops)
        const groupedData = {};
        const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');

        rawRecords.forEach(row => {
            const key = `${row.AttnDate}__${row.UserID}`;
            
            if (!groupedData[key]) {
                groupedData[key] = {
                    AttnDate: row.AttnDate,
                    Device: row.Device || 'M',
                    Name: row.Name || AttnEmpName,
                    PI: " - ",
                    PO: " - ",
                    PunchLatLong: row.PunchLatLong || " - ",
                    Attn: ""
                };
            }

            if (row.PunchType === "PI") groupedData[key].PI = row.PunchTime;
            if (row.PunchType === "PO") groupedData[key].PO = row.PunchTime;

            // Attendance Logic
            const record = groupedData[key];
            if (today === record.AttnDate) {
                if (record.PI !== " - ") record.Attn = "PR";
                if (record.PI === " - " && record.PO === " - ") record.Attn = "AB";
            } else {
                if (record.PO === " - " && record.PI !== " - ") record.Attn = "EX";
                if (record.PI !== " - " && record.PO !== " - ") record.Attn = "PR";
                if (record.PI === " - " && record.PO === " - " && row.WeekDayNo > 1) record.Attn = "AB";
            }
        });

        // Convert grouped object to array
        const finalOutput = Object.values(groupedData);

        res.json({
            StreamType: "TABULAR",
            StreamName: "ViewAttnRecord",
            Data: finalOutput
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};