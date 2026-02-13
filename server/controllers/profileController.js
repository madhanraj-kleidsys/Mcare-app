const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

// ==================================================
// API 1: GET PROFILE DATA
// ==================================================
exports.getProfileData = async (req, res) => {
    try {
        // 1. Get ID from the logged-in token
        const userId = req.user.id; 

        // 2. Fetch only the data needed for the profile screen
        const profileSql = `
            SELECT
                A.Name AS Prof_Name,
                CONVERT(VARCHAR(50), A.DOB, 106) AS Prof_DOB,
                A.ProfilePicName AS myImage,
                A.ProfilePicName AS side_panel_userprof,
                A.Designation AS Prof_Desg,
                C.Name AS Prof_Team,
                D.Name AS Prof_Zone,
                NULL AS Prof_Loc,
                E.Name AS Prof_Reporting
            FROM CrmUsers A
            LEFT JOIN CrmTeams C ON C.ID = A.TeamID
            LEFT JOIN CRMZones D ON D.ID = A.ZoneID
            LEFT JOIN CrmUsers E ON E.ID = A.ReportToUserID
            WHERE A.ID = :id
        `;

        const result = await sequelize.query(profileSql, {
            replacements: { id: userId },
            type: QueryTypes.SELECT
        });

        // 3. Format exactly like PHP output for the App
        let output = [];
        if (result.length > 0) {
            output = [{
                ...result[0],
                StreamType: "LINEAR",
                StreamName: "crm_profile_OutputData",
                FreshOrAged: "FRESH"
            }];
        }

        res.json(output);

    } catch (err) {
        console.error("Profile API Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};

// ==================================================
// API 2: RESET PASSWORD
// ==================================================
exports.resetPassword = async (req, res) => {
    try {
        // 1. Get ID from token
        const userId = req.user.id;
        
        // 2. Get passwords from Body (Since we switched to POST)
        const { PrevPwdVal, NewPwdVal } = req.body;

        if (!PrevPwdVal || !NewPwdVal) {
            return res.status(400).json({ status: "ERROR", message: "Missing passwords" });
        }

        // 3. Check Old Password
        const checkPwdSql = `SELECT Password FROM CrmUsers WHERE ID = :id`;
        const userRes = await sequelize.query(checkPwdSql, {
            replacements: { id: userId },
            type: QueryTypes.SELECT
        });

        if (!userRes.length) {
            return res.status(404).json({ error: "User not found" });
        }

        const currentDbPassword = String(userRes[0].Password);

        // Simple string comparison (As per your request)
        if (currentDbPassword !== String(PrevPwdVal)) {
            return res.json({ status: 'OLD_PW_WRONG' });
        }

        // 4. Update Password
        const updateSql = `UPDATE CrmUsers SET Password = :newPass WHERE ID = :id`;
        await sequelize.query(updateSql, {
            replacements: { newPass: NewPwdVal, id: userId },
            type: QueryTypes.UPDATE
        });

        res.json({ status: 'SUCCESS' });

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(500).json({ error: "Server Error" });
    }
};