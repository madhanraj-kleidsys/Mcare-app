const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID, getAssignedUserNames } = require('../utils/userCommon');

const getDashboardData = async (req, res) => {
    try {
    const userId = req.user.id;
        
        // FETCH CURRENT USER CONTEXT
        const userContext = await sequelize.query(`
            SELECT Name, Code, ZoneID, HierarchyLevel, IsAdmin 
            FROM CrmUsers WHERE ID = :id
        `, { replacements: { id: userId }, type: QueryTypes.SELECT });

        if (!userContext.length) return res.status(404).json({ message: "User not found" });
        
        const currentUser = userContext[0];
        const isAdmin = currentUser.IsAdmin === 1 || currentUser.IsAdmin === true;
        const userHierarchyLevel = parseInt(currentUser.HierarchyLevel, 10);
        const zoneID = currentUser.ZoneID;
        const fullname = currentUser.Name;
        // =================================================================================
        // REPLICATE PHP LOGIC FOR HIERARCHY, ZONES, REPORTING USERS
        // =================================================================================        
        // const userHierarchyLevel = currentUser.HierarchyLevel; // 👈 DEFINING THE MISSING VARIABLE
        // // 1. REPLICATE: getUserHierarchy()
        // // Get user's BFunc and Seq from their role
        // const roleData = await sequelize.query(`
        //     SELECT BFunc, Sequence FROM CRMUserRole WHERE ID = :roleId
        // `, { replacements: { roleId: currentUser.HierarchyLevel }, type: QueryTypes.SELECT });

        // let hierarchyString = '0';
        // if (roleData.length) {
        //     const { BFunc, Sequence } = roleData[0];
        //     const maxSeqRes = await sequelize.query(`
        //         SELECT MAX(Sequence) AS MaxSeq FROM CRMUserRole WHERE BFunc = :BFunc
        //     `, { replacements: { BFunc }, type: QueryTypes.SELECT });
            
        //     let seqs = [];
        //     for (let i = Sequence; i <= (maxSeqRes[0].MaxSeq || Sequence); i++) {
        //         seqs.push(i);
        //     }
        //     hierarchyString = seqs.join(',');
        // }

        // // 2. REPLICATE: getUserZoneID()
        // const zones = await sequelize.query(`
        //     SELECT ZoneID FROM CrmUserRightTeamMap WHERE UserID = :id
        // `, { replacements: { id: userId }, type: QueryTypes.SELECT });
        // const zoneIDString = zones.length > 0 ? zones.map(z => z.ZoneID).join(',') : '0';

        // // 3. REPLICATE: getAssignedUserNames()
        // const reports = await sequelize.query(`
        //     SELECT Name FROM CrmUsers WHERE ReportToUserID = :id
        // `, { replacements: { id: userId }, type: QueryTypes.SELECT });
        // const reportingUserNames = reports.map(r => `'${r.Name.replace(/'/g, "''")}'`);
        // const reportingListString = reportingUserNames.length > 0 ? reportingUserNames.join(',') : `'${currentUser.Name}'`;

        // 1. Get Hierarchy (Returns string like "4,5,6")
        const hierarchyString = await getUserHierarchy(userId);

        // 2. Get Zones (Returns string like "1,2")
        const zoneIDString = await getUserZoneID(userId);

        // 3. Get Reporting Team
        // Note: The helper returns an ARRAY [''UserA'', ''UserB''], but your dashboard query expects a STRING CSV.
        const reportingArray = await getAssignedUserNames(userId);
        
        // Convert the array to a string. If empty, default to current user only.
        const reportingListString = reportingArray.length > 0 ? reportingArray.join(',') : `'${currentUser.Name}'`;

        
        // HELPERS
        const buildWhereClause = (tableAlias) => {
            if (isAdmin) return ""; 
            return ` AND (${tableAlias}.BFuncSeq IN (${hierarchyString}) OR ${tableAlias}.BFuncSeq IS NULL) 
                     AND ${tableAlias}.ZoneID IN (${zoneIDString}) 
                     AND (${tableAlias}.CreatedBy = '${currentUser.Name}' OR ${tableAlias}.CreatedBy IN (${reportingListString}))`;
        };
        
        // Specific Helper for Assigned Tasks/Calls (Checks CreatedBy OR AssignedTo)
        const buildAssignedWhere = (tableAlias) => {
            if (isAdmin) return "";
            
            let condition = ` AND (${tableAlias}.BFuncSeq IN (${hierarchyString}) OR ${tableAlias}.BFuncSeq IS NULL) `;
            condition += ` AND ${tableAlias}.ZoneID IN (${zoneID}) `;

            if (reportingListString) {
                condition += ` AND (${tableAlias}.CreatedBy = '${fullname}' OR ${tableAlias}.AssignedUserName = '${fullname}' OR ${tableAlias}.CreatedBy IN (${reportingListString})) `;
            } else {
                condition += ` AND (${tableAlias}.CreatedBy = '${fullname}' OR ${tableAlias}.AssignedUserName = '${fullname}') `;
            }
            return condition;
        };

        // =================================================================================
        // EXECUTE QUERIES (Using Promise.all for performance)
        // =================================================================================
        
        const queries = {
            // --- SERVICE REQUESTS ---
            SR_Closed: `SELECT COUNT(DocStatus) AS SR_Closed FROM VuCRMServiceReqList A WHERE A.DocStatus = 'CLOSED' ${buildWhereClause('A')}`,
            SR_Open: `SELECT COUNT(DocStatus) AS SR_Open FROM VuCRMServiceReqList A WHERE A.DocStatus = 'REGISTERED' ${buildWhereClause('A')}`,
            SR_Completed: `SELECT COUNT(DocStatus) AS SR_Completed FROM VuCRMServiceReqList A WHERE A.DocStatus IN ('COMPLETED', 'VERIFIED') ${buildWhereClause('A')}`,
            SR_Assigned: `SELECT COUNT(DocStatus) AS SR_Assigned FROM VuCRMServiceReqList A WHERE A.DocStatus = 'ASSIGNED' ${buildAssignedWhere('A')}`,

            // --- MARKETING CALLS ---
            MC_Completed: `SELECT COUNT(DocStatus) AS MC_Completed FROM VuCRMMarketingCallsList A WHERE A.DocStatus = 'COMPLETED' ${buildWhereClause('A', false)}`, // PHP Logic seemed to not use reporting users for MC? Check logic.
            MC_Closed: `SELECT COUNT(DocStatus) AS MC_Closed FROM VuCRMMarketingCallsList A WHERE A.DocStatus = 'CLOSED' ${buildWhereClause('A', false)}`,
            MC_Open: `SELECT COUNT(DocStatus) AS MC_Open FROM VuCRMMarketingCallsList A WHERE A.DocStatus = 'REGISTERED' ${buildWhereClause('A', false)}`,
            MC_Assigned: `SELECT COUNT(DocStatus) AS MC_Assigned FROM VuCRMMarketingCallsList A WHERE DocStatus = 'ASSIGNED' ${buildAssignedWhere('A')}`,

            // --- TASKS (Special Logic for Hierarchy 1,2,3) ---
            TSK_Completed: `SELECT COUNT(DocStatus) AS TSK_Completed FROM VuCRMTaskList A WHERE DocStatus = 'COMPLETED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false)}`,
            TSK_Closed: `SELECT COUNT(DocStatus) AS TSK_Closed FROM VuCRMTaskList A WHERE DocStatus = 'CLOSED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false)}`,
            TSK_Open: `SELECT COUNT(DocStatus) AS TSK_Open FROM VuCRMTaskList A WHERE DocStatus = 'REGISTERED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false)}`,
            TSK_Assigned: `SELECT COUNT(DocStatus) AS TSK_Assigned FROM VuCRMTaskList A WHERE DocStatus = 'ASSIGNED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildAssignedWhere('A')}`,

            // --- CLAIMS ---
            CLM_Closed: `SELECT COUNT(DocStatus) AS CLM_Closed FROM VuCrmClaimsList A WHERE DocStatus = 'CLOSED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false).replace("CreatedBy", "CreatedByName")}`, // Note: PHP used CreatedByName for claims
            CLM_Booked: `SELECT COUNT(DocStatus) AS CLM_Booked FROM VuCrmClaimsList A WHERE DocStatus = 'BOOKED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false).replace("CreatedBy", "CreatedByName")}`,
            CLM_Waiting: `SELECT COUNT(DocStatus) AS CLM_Waiting FROM VuCrmClaimsList A WHERE DocStatus = 'WAITING' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false).replace("CreatedBy", "CreatedByName")}`,
            CLM_Approved: `SELECT COUNT(DocStatus) AS CLM_Approved FROM VuCrmClaimsList A WHERE DocStatus = 'APPROVED' ${[1,2,3].includes(userHierarchyLevel) ? '' : buildWhereClause('A', false).replace("CreatedBy", "CreatedByName")}`,

            // --- PROFILE ---
            Profile: `SELECT A.Name AS side_panel_username, A.Designation AS side_panel_userdesg, A.ProfilePicName AS side_panel_userprof, C.Name AS HID_Team 
                      FROM CrmUsers A LEFT JOIN CrmTeams C ON C.ID = A.TeamID WHERE A.ID = ${userId}`,

            // --- USER RIGHTS / BUTTONS ---
            UserRights: `SELECT A.ScreenID AS HID_ScreenID, A.ISAllowed AS HID_ISAllowed, B.ScreenCode 
                         FROM CrmUserRights A LEFT JOIN AdmScreenMaster B ON B.ID = A.ScreenID 
                         WHERE ScreenID IN (10,41,42,40) AND UserID = ${userId}`,
            
            // Note: Simplification of the massive Button Query for brevity
            ButtonRights: `SELECT A.ScreenID, A.ISAllowed, A.CanCreate AS CR, A.CanEdit AS E, A.CanView AS V, 
                           CASE B.ScreenCode WHEN 'serv_req' THEN 'SR' WHEN 'mar_call' THEN 'MC' WHEN 'Task' THEN 'TSK' WHEN 'Claims' THEN 'CLM' ELSE B.ScreenCode END AS ScreenCode
                           FROM CrmUserRights A LEFT JOIN AdmScreenMaster B ON B.ID = A.SCREENID 
                           WHERE UserID = ${userId} AND A.ScreenID IN (10,41,42,40)`
        };

        // Execution
        const results = {};
        const keys = Object.keys(queries);
        
        // Run all queries in parallel
        await Promise.all(keys.map(async (key) => {
            const result = await sequelize.query(queries[key], { type: QueryTypes.SELECT });
            results[key] = result;
        }));

        // =================================================================================
        // FORMAT OUTPUT (Matching PHP "Stream" format)
        // =================================================================================
        const output = [];

        const addToOutput = (key, data) => {
            // PHP format was flat array of objects, usually with one row per query for counts
            if(data.length > 0) {
                const row = data[0]; // For counts, get the first row
                const resultObj = { ...row, StreamType: "LINEAR", StreamName: "", FreshOrAged: "FRESH" };
                output.push(resultObj);
            }
        };

        // Add Counts
        keys.forEach(key => {
            if(key !== 'Profile' && key !== 'UserRights' && key !== 'ButtonRights') {
                addToOutput(key, results[key]);
            }
        });

        // Add Arrays (Profile, Rights) - PHP code appended these differently, usually loop through result
        if(results.Profile.length) output.push({...results.Profile[0], StreamType: "LINEAR", StreamName: "", FreshOrAged: "FRESH"});
        
        results.UserRights.forEach(r => output.push({...r, StreamType: "LINEAR", StreamName: "", FreshOrAged: "FRESH"}));
        results.ButtonRights.forEach(r => output.push({...r, StreamType: "LINEAR", StreamName: "", FreshOrAged: "FRESH"}));

        // Add User Data (Code, IsAdmin)
        output.push({ Code: currentUser.Code, IsAdmin: currentUser.IsAdmin, ID: currentUser.ID, StreamType: "LINEAR", StreamName: "", FreshOrAged: "FRESH" });

        res.json(output);

    } catch (err) {
        console.error('Dashboard Error:', err);
        res.status(500).json({ message: "Server error fetching dashboard data" });
    }
};

module.exports = { getDashboardData };