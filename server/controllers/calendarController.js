const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID } = require('../utils/userCommon');

// ==========================================
// 1. MONTH EVENTS (Dots)
// ==========================================
exports.calendarEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const { MonthVal } = req.query; // e.g., '2025-02'

        if (!MonthVal) return res.status(400).json({ error: "Missing MonthVal" });

        // 1. Get Hierarchy & Zones using your Utils
        const hierarchy = await getUserHierarchy(userId);
        const zones = await getUserZoneID(userId);

        if (!hierarchy || !zones) {
            return res.json({ StreamType: "TABULAR", Data: [] });
        }

        const sql = `
            SELECT 
                CAST(X.ScheduleDateTime AS VARCHAR(10)) AS EventDate,
                SUM(X.EventCount) AS EventsCount
            FROM (
                -- Service Requests
                SELECT ScheduleDateTime, COUNT(ID) AS EventCount
                FROM VuCRMServiceReqList
                WHERE ISNULL(ScheduleDateTime,'') NOT IN ('0','') 
                  AND ScheduleDateTime LIKE :monthPattern
                  AND DocStatus = 'ASSIGNED'
                  AND BFuncSeq IN (${hierarchy})
                  AND ZoneID IN (${zones})
                GROUP BY ScheduleDateTime

                UNION ALL

                -- Marketing Calls
                SELECT ScheduleDateTime, COUNT(ID)
                FROM VuCRMMarketingCallsList
                WHERE ISNULL(ScheduleDateTime,'') NOT IN ('0','') 
                  AND ScheduleDateTime LIKE :monthPattern
                  AND DocStatus = 'ASSIGNED'
                  AND BFuncSeq IN (${hierarchy})
                  AND ZoneID IN (${zones})
                GROUP BY ScheduleDateTime

                UNION ALL

                -- Tasks
                SELECT ScheduleDateTime, COUNT(ID)
                FROM VuCRMTaskList
                WHERE ISNULL(ScheduleDateTime,'') NOT IN ('0','') 
                  AND ScheduleDateTime LIKE :monthPattern
                  AND DocStatus = 'ASSIGNED'
                  AND BFuncSeq IN (${hierarchy})
                  AND ZoneID IN (${zones})
                GROUP BY ScheduleDateTime
            ) X
            GROUP BY CAST(X.ScheduleDateTime AS VARCHAR(10))
        `;

        const results = await sequelize.query(sql, {
            replacements: { monthPattern: `%${MonthVal}%` },
            type: QueryTypes.SELECT
        });

        res.json({
            StreamType: "TABULAR",
            StreamName: "MonthEvents",
            FreshOrAged: "FRESH",
            Data: results
        });

    } catch (err) {
        console.error("Month Events Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

// ==========================================
// 2. DAY HIGHLIGHTS (Details)
// ==========================================
exports.calendarHighlights = async (req, res) => {
    try {
        const userId = req.user.id;
        const { DateVal } = req.query; // e.g., '2025-08-16'

        if (!DateVal) return res.status(400).json({ error: "Missing DateVal" });

        // 1. Get Permissions
        const hierarchy = await getUserHierarchy(userId);
        const zones = await getUserZoneID(userId);

        // 2. Get User Info for Admin Check
        // We do a quick manual query here since userCommon doesn't return IsAdmin/Name
        const [userInfo] = await sequelize.query(
            `SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id`,
            { replacements: { id: userId }, type: QueryTypes.SELECT }
        );

        // 3. SAFE WHERE CLAUSE
        let whereClause = `
            A.ScheduleDateTime IS NOT NULL 
            AND A.ScheduleDateTime != '' 
            AND A.ScheduleDateTime != '0'
            AND A.ScheduleDateTime LIKE :datePattern
            AND A.DocStatus = 'ASSIGNED'
            AND A.BFuncSeq IN (${hierarchy})
            AND A.ZoneID IN (${zones})
        `;

        // If not admin, restrict to own name
        if (userInfo && !userInfo.IsAdmin) {
            whereClause += ` AND C.Name = :fullname`;
        }

        const replacements = { 
            datePattern: `%${DateVal}%`,
            fullname: userInfo ? userInfo.Name : ''
        };

        // 4. SAFE DATE PARSING (Handles 'T' split safely)
        const safeDateLogic = `
            CASE 
                WHEN CHARINDEX('T', A.ScheduleDateTime) > 0 THEN 
                     CONVERT(VARCHAR(50), CAST(SUBSTRING(A.ScheduleDateTime, 1, CHARINDEX('T', A.ScheduleDateTime)-1) AS DATE), 106) 
                     + ' - ' + SUBSTRING(A.ScheduleDateTime, CHARINDEX('T', A.ScheduleDateTime) + 1, 1000)
                ELSE A.ScheduleDateTime 
            END
        `;

        // --- A. Service Requests ---
        const srSql = `
            SELECT 
                A.DocNo AS SRNo,
                ${safeDateLogic} AS Sch,
                B.Name AS CustName,
                A.DocStatus AS Status,
                A.ID,
                C.Name AS AssignedUserName
            FROM VuCRMServiceReqList A
            LEFT JOIN MasParty B ON B.ID = A.CustomerID
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID
            WHERE ${whereClause}
            ORDER BY A.ID ASC
        `;
        const srData = await sequelize.query(srSql, { replacements, type: QueryTypes.SELECT });

        // --- B. Marketing Calls ---
        // FIX: Removed 'A.CompletedOn' because we only fetch 'ASSIGNED' status anyway.
        const mcSql = `
            SELECT 
                A.DocNo AS MCNo,
                ${safeDateLogic} AS Sch,
                CASE 
                    WHEN A.IsExistingCust = 0 THEN A.NewCustomerName 
                    ELSE B.Name 
                END AS CustName,
                A.DocStatus AS Status,
                A.ID,
                C.Name AS AssignedUserName
            FROM VuCRMMarketingCallsList A
            LEFT JOIN MasParty B ON B.ID = A.ExistingCustomerID 
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID
            WHERE ${whereClause}
            ORDER BY A.ID ASC
        `;
        const mcData = await sequelize.query(mcSql, { replacements, type: QueryTypes.SELECT });

        // --- C. Tasks ---
        // FIX: Removed 'T.CompletedOn' to stay consistent and safe.
        const tskSql = `
            SELECT 
                A.DocNo AS TSKNo,
                ${safeDateLogic} AS Sch,
                A.DocStatus AS Status,
                A.ID,
                C.Name AS AssignedUserName,
                T.Comments
            FROM VuCRMTaskList A
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID
            LEFT JOIN CrmTask T ON T.ID = A.ID
            WHERE ${whereClause}
            ORDER BY A.ID ASC
        `;
        const tskData = await sequelize.query(tskSql, { replacements, type: QueryTypes.SELECT });

        res.json({
            SRData: { StreamType: "TABULAR", StreamName: "SRData", FreshOrAged: "FRESH", Data: srData },
            MCData: { StreamType: "TABULAR", StreamName: "MCData", FreshOrAged: "FRESH", Data: mcData },
            TSKData: { StreamType: "TABULAR", StreamName: "TSKData", FreshOrAged: "FRESH", Data: tskData }
        });

    } catch (err) {
        console.error("Day Highlights Error:", err);
        res.status(500).json({ error: "Server Error", details: err.message });
    }
};

// ==========================================
// 3. DEBUG AVAILABLE DATES
// ==========================================
exports.debugAvailableDates = async (req, res) => {
    try {
        const userId = req.user.id;
        const hierarchy = await getUserHierarchy(userId);
        const zones = await getUserZoneID(userId);

        const sql = `
            SELECT DISTINCT LEFT(ScheduleDateTime, 10) AS EventDate
            FROM (
                SELECT ScheduleDateTime FROM VuCRMServiceReqList
                WHERE DocStatus = 'ASSIGNED' AND BFuncSeq IN (${hierarchy}) AND ZoneID IN (${zones})
                UNION ALL
                SELECT ScheduleDateTime FROM VuCRMMarketingCallsList
                WHERE DocStatus = 'ASSIGNED' AND BFuncSeq IN (${hierarchy}) AND ZoneID IN (${zones})
                UNION ALL
                SELECT ScheduleDateTime FROM VuCRMTaskList
                WHERE DocStatus = 'ASSIGNED' AND BFuncSeq IN (${hierarchy}) AND ZoneID IN (${zones})
            ) AS AllData
            WHERE ScheduleDateTime IS NOT NULL 
            AND LEN(ScheduleDateTime) >= 10
            ORDER BY EventDate DESC
        `;

        const dates = await sequelize.query(sql, { type: QueryTypes.SELECT });

        res.json({
            count: dates.length,
            dates: dates.map(r => r.EventDate)
        });
    } catch (err) {
        console.error("Debug Error:", err);
        res.status(500).json({ error: err.message });
    }
};

