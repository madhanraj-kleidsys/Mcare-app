const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID } = require('../utils/userCommon');

// --- 1. GET ATTENDANCE LOGS ---
exports.getAttendanceLogs = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Replicating GetUserTime.php logic (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];

        // Using your utilities to check permissions
        const hierarchy = await getUserHierarchy(userId);
        const zones = await getUserZoneID(userId);

        // 1. Fetch Punch History
        const logs = await sequelize.query(`
            SELECT 
                CONVERT(char(5), PunchTime, 108) as PunchTime,
                Device, PunchType, PunchLat, PunchLong
            FROM HCAttnDailyPunches2
            WHERE EmpID = :userId 
            AND AttnDate = :today
        `, { 
            replacements: { userId, today }, 
            type: QueryTypes.SELECT 
        });

        // 2. Fetch the latest image for today
        const imageResult = await sequelize.query(`
            SELECT TOP 1 PicURL as myImage
            FROM HCAttnDailyPunches2
            WHERE EmpID = :userId 
            AND PicURL IS NOT NULL 
            AND AttnDate = :today
            ORDER BY ID DESC
        `, { 
            replacements: { userId, today }, 
            type: QueryTypes.SELECT 
        });

        // Match your required PHP structure
        res.json({
            JSONResponse: {
                Response: [
                    {
                        Type: "TABULAR",
                        Name: "AttnRecordLog",
                        Age: "FRESH",
                        Data: {
                            PunchTime: logs.map(l => l.PunchTime),
                            Device: logs.map(l => l.Device),
                            PunchType: logs.map(l => l.PunchType),
                            PunchLat: logs.map(l => l.PunchLat),
                            PunchLong: logs.map(l => l.PunchLong)
                        }
                    },
                    {
                        Type: "LINEAR",
                        Name: "",
                        Age: "FRESH",
                        Data: {
                            myImage: [imageResult[0]?.myImage || ""]
                        }
                    }
                ]
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// --- 2. PUNCH ATTENDANCE (With Multer Image) ---
// exports.punchAttendance = async (req, res) => {
//     try {
//         const userId = req.user.id;
//         const { PunchLat, PunchLong, IsPunchValue } = req.body;
        
//         // req.file comes from multer. It contains the new filename.
//         const fileName = req.file ? req.file.filename : null;

//         const sql = `
//             INSERT INTO HCAttnDailyPunches2 
//             (EmpID, AttnDate, PunchTime, PunchLat, PunchLong, PunchType, Device, PicURL)
//             VALUES 
//             (:userId, CAST(GETDATE() AS DATE), GETDATE(), :PunchLat, :PunchLong, :IsPunchValue, 'M', :fileName)
//         `;

//         await sequelize.query(sql, {
//             replacements: { userId, PunchLat, PunchLong, IsPunchValue, fileName }
//         });

//         res.json({ status: "SUCCESS", message: "Attendance recorded" });
//     } catch (error) {
//         res.status(500).json({ error: error.message });
//     }
// };

exports.punchAttendance = async (req, res) => {
    try {
        const userId = req.user.id;
        const { PunchLat, PunchLong, IsPunchValue } = req.body;
        const fileName = req.file ? req.file.filename : null;

        // Ensure variables aren't undefined
        const lat = PunchLat || '0';
        const long = PunchLong || '0';

        const sql = `
            INSERT INTO HCAttnDailyPunches2 
            (EmpID, AttnDate, PunchTime, PunchLat, PunchLong, PunchType, Device, PicURL)
            VALUES 
            (:userId, CAST(GETDATE() AS DATE), GETDATE(), :lat, :long, :IsPunchValue, 'M', :fileName)
        `;

        await sequelize.query(sql, {
            replacements: { userId, lat, long, IsPunchValue, fileName }
        });

        res.json({ status: "SUCCESS" });
    } catch (error) {
        console.error("Punch SQL Error:", error);
        res.status(500).json({ status: "ERROR", message: error.message });
    }
};