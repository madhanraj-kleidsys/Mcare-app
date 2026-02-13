const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');

const { getUserHierarchy, getUserZoneID, getAssignedUserNames } = require('../utils/userCommon');

// --- MAIN CONTROLLER ---

const getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Fetch User Context
        const userContext = await sequelize.query(`
            SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id
        `, { replacements: { id: userId }, type: QueryTypes.SELECT });

        if (!userContext.length) return res.status(404).json({ message: "User not found" });

        const currentUser = userContext[0];
        const isAdmin = currentUser.IsAdmin === 1 || currentUser.IsAdmin === true;
        const username = currentUser.Name;

        // 2. Get Helper Data
        const hierarchyList = await getUserHierarchy(userId);
        const zoneList = await getUserZoneID(userId);
        const reportingUsers = await getAssignedUserNames(userId);

        const teamNames = [`'${username.replace(/'/g, "''")}'`, ...reportingUsers];
        const teamList = teamNames.join(',');

        // 3. Dynamic WHERE Clause
        let whereCondition = "";
        
        // We use TRY_CAST in the WHERE clause too to prevent crashes during filtering
        if (!isAdmin) {
            whereCondition = `
                AND (
                    (CHARINDEX('T', A.ScheduleDateTime) > 0 AND 
                     TRY_CAST(SUBSTRING(A.ScheduleDateTime, 1, CHARINDEX('T', A.ScheduleDateTime) - 1) AS DATE) IS NOT NULL AND
                     MONTH(TRY_CAST(SUBSTRING(A.ScheduleDateTime, 1, CHARINDEX('T', A.ScheduleDateTime) - 1) AS DATE)) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND 
                     YEAR(TRY_CAST(SUBSTRING(A.ScheduleDateTime, 1, CHARINDEX('T', A.ScheduleDateTime) - 1) AS DATE)) = YEAR(DATEADD(MONTH, -1, GETDATE()))
                    )
                    OR 
                    (CHARINDEX('T', A.ScheduleDateTime) = 0 AND 
                     TRY_CAST(A.ScheduleDateTime AS DATE) IS NOT NULL AND
                     MONTH(TRY_CAST(A.ScheduleDateTime AS DATE)) = MONTH(DATEADD(MONTH, -1, GETDATE())) AND 
                     YEAR(TRY_CAST(A.ScheduleDateTime AS DATE)) = YEAR(DATEADD(MONTH, -1, GETDATE()))
                    )
                )
                AND (C.Name IN (${teamList}) OR A.CreatedBy IN (${teamList}))
                AND A.BFuncSeq IN (${hierarchyList})
                AND A.ZoneID IN (${zoneList})
            `;
        }

        // --- ULTRA SAFE DATE PARSING LOGIC ---
        // Using TRY_CAST prevents the crash. If data is bad, it returns NULL (which we handle as empty string)
        const safeDateSQL = `
            CASE 
                WHEN A.ScheduleDateTime IS NULL OR A.ScheduleDateTime = '' THEN ''
                
                -- Case 1: Format with 'T' (e.g., 2023-10-20T10:00)
                WHEN CHARINDEX('T', A.ScheduleDateTime) > 0 THEN 
                    ISNULL(CONVERT(VARCHAR(50), TRY_CAST(SUBSTRING(A.ScheduleDateTime, 1, CHARINDEX('T', A.ScheduleDateTime)-1) AS DATE), 106), '')

                -- Case 2: Standard Date Format
                ELSE 
                    ISNULL(CONVERT(VARCHAR(50), TRY_CAST(A.ScheduleDateTime AS DATE), 106), '')
            END
        `;

        // 4. PREPARE QUERIES
        
        // --- SERVICE REQUESTS (SR) ---
        const srSQL = `
            SELECT TOP 50 
                A.ID, A.DocNo AS Title, 
                B.Name AS Subtitle,
                A.DocStatus AS Status,
                ${safeDateSQL} AS Time
            FROM VuCRMServiceReqList A
            LEFT JOIN MasParty B ON B.ID = A.CustomerID
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID
            WHERE A.ScheduleDateTime != '0' AND A.ScheduleDateTime != ''
            AND A.DocStatus IN ('ASSIGNED')
            ${whereCondition}
            ORDER BY A.ScheduleDateTime DESC
        `;

        // --- MARKETING CALLS (MC) ---
        const mcSQL = `
            SELECT TOP 50
                A.ID, A.DocNo AS Title,
                CASE WHEN IsExistingCust = 0 THEN NewCustomerName ELSE B.Name END AS Subtitle,
                A.DocStatus AS Status,
                ${safeDateSQL} AS Time
            FROM VuCRMMarketingCallsList A
            LEFT JOIN MasParty B ON B.ID = A.ExistingCustomerID 
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID
            WHERE A.ScheduleDateTime != '0' AND A.ScheduleDateTime != ''
            AND A.DocStatus IN ('ASSIGNED')
            ${whereCondition}
            ORDER BY A.ScheduleDateTime DESC
        `;

        // --- TASKS (TSK) ---
        const tskSQL = `
            SELECT TOP 50
                A.ID, A.DocNo AS Title,
                T.Comments AS Subtitle,
                A.DocStatus AS Status,
                ${safeDateSQL} AS Time
            FROM VuCRMTaskList A
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID
            LEFT JOIN CrmTask T ON T.ID = A.ID
            WHERE A.ScheduleDateTime != '0' AND A.ScheduleDateTime != ''
            AND A.DocStatus IN ('ASSIGNED')
            ${whereCondition}
            ORDER BY A.ScheduleDateTime DESC
        `;

        // 5. EXECUTE QUERIES PARALLEL
        const [srRes, mcRes, tskRes] = await Promise.all([
            sequelize.query(srSQL, { type: QueryTypes.SELECT }),
            sequelize.query(mcSQL, { type: QueryTypes.SELECT }),
            sequelize.query(tskSQL, { type: QueryTypes.SELECT })
        ]);

        // 6. FORMAT RESPONSE
        const responseData = {
            service: srRes.map(item => ({
                id: item.ID,
                title: item.Title,
                desc: item.Subtitle,
                time: item.Time,
                status: item.Status
            })),
            marketing: mcRes.map(item => ({
                id: item.ID,
                title: item.Title,
                desc: item.Subtitle,
                time: item.Time,
                status: item.Status
            })),
            tasks: tskRes.map(item => ({
                id: item.ID,
                title: item.Title,
                desc: item.Subtitle || "No comments",
                time: item.Time,
                status: item.Status
            })),
            counts: {
                sr: srRes.length,
                mc: mcRes.length,
                tsk: tskRes.length
            }
        };

        res.json(responseData);

    } catch (err) {
        console.error("Dashboard Data Error:", err);
        res.status(500).json({ message: "Server error fetching notifications data" });
    }
};

module.exports = { getNotifications };