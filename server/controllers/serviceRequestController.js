const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID, getAssignedUserNames,getUserTime } = require('../utils/userCommon');

exports.getServiceRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // --- FIX START: Fetch User Details from DB instead of relying on Token ---
        const userContext = await sequelize.query(`
            SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id
        `, { replacements: { id: userId }, type: QueryTypes.SELECT });

        if (!userContext.length) return res.status(404).json({ message: "User not found" });

        const currentUser = userContext[0];
        const username = currentUser.Name || ''; // Default to empty string if null
        const isAdmin = (currentUser.IsAdmin === 1 || currentUser.IsAdmin === true);
        // --- FIX END ---

        // Debugging: See what filters are coming from Postman
        console.log("Incoming Filters:", req.query); 

        // 1. Get Query Parameters
        const {
            SR_Source = 'Normal', 
            SR_Filter_Dash_Open,
            SR_Filter_Dash_Closed,
            SR_Filter_Dash_Completed,
            SR_Filter_Dash_Assigned,
            DocStatus, 
            SR_Srch_Assigned, 
            SR_Srch_Close, 
            FilterQuery = '',
            SR_Srch_FromTime,
            SR_Srch_ToTime
        } = req.query;

        // 2. Fetch User Context
        const hierarchyList = await getUserHierarchy(userId);
        const zoneList = await getUserZoneID(userId);
        const reportingUsers = await getAssignedUserNames(userId);
        
        // Safe string replacement
        const safeUsername = username ? `'${username.replace(/'/g, "''")}'` : "''";
        const teamNames = [safeUsername, ...reportingUsers];
        const teamList = teamNames.join(',');

        // 3. Build DocStatus List
        let statusList = [];
        if (SR_Filter_Dash_Open === 'true' || SR_Filter_Dash_Open === '1' || DocStatus === 'Registered') statusList.push("'REGISTERED'");
        if (SR_Filter_Dash_Closed === 'true' || SR_Filter_Dash_Closed === '1' || DocStatus === 'Closed') statusList.push("'CLOSED'");
        if (SR_Filter_Dash_Completed === 'true' || SR_Filter_Dash_Completed === '1' || DocStatus === 'Completed') statusList.push("'COMPLETED'", "'VERIFIED'");
        if (SR_Filter_Dash_Assigned === 'true' || SR_Filter_Dash_Assigned === '1' || DocStatus === 'Assigned') statusList.push("'ASSIGNED'");
        
        if (statusList.length === 0) statusList.push("'REGISTERED'");
        const statusCSV = statusList.join(',');

        // 4. Build Where Clauses
        let whereConditions = [];

        // A. Role Security
        if (!isAdmin) {
            whereConditions.push(`(A.BFuncSeq IN (${hierarchyList}) OR A.BFuncSeq IS NULL)`);
            whereConditions.push(`A.ZoneID IN (${zoneList})`);

            // B. Ownership Logic
            if (SR_Srch_Assigned === 'on' || SR_Srch_Close === 'on') {
                whereConditions.push(`A.AssignedUserID = ${userId}`);
            } else {
                whereConditions.push(`(A.CreatedBy IN (${teamList}) OR C.Name IN (${teamList}))`);
            }
        }

        // C. Text Filter
        if (SR_Source === 'Filter' && FilterQuery) {
            const searchClause = `
                (
                    ISNULL(A.CustomerName, '') LIKE :search OR
                    ISNULL(A.MachineName, '') LIKE :search OR
                    ISNULL(A.LocationName, '') LIKE :search OR
                    ISNULL(A.ServiceTypeDesc, '') LIKE :search OR
                    ISNULL(A.AssignedUserName, '') LIKE :search OR
                    ISNULL(A.CreatedBy, '') LIKE :search OR
                    ISNULL(A.ModelName, '') LIKE :search OR
                    ISNULL(A.DocNo, '') LIKE :search OR
                    ISNULL(A.ScheduleDateTime, '') LIKE :search OR
                    ISNULL(A.NeedApproval, '') LIKE :search
                )
            `;
            whereConditions.push(searchClause);
        }

        // D. Date Filter
        if (SR_Srch_FromTime || SR_Srch_ToTime) {
            const fromDate = SR_Srch_FromTime || '2000-01-01'; 
            const toDate = SR_Srch_ToTime || getUserTime(); 
            whereConditions.push(`A.ScheduleDateTime BETWEEN '${fromDate}' AND '${toDate}'`);
        }

        // 5. Construct Final SQL
        const finalWhere = whereConditions.length > 0 
            ? 'AND ' + whereConditions.join(' AND ') 
            : '';

        const sql = `
            SELECT TOP 100 A.*, B.Name as CustomerNameReal 
            FROM VuCRMServiceReqList A
            LEFT JOIN CrmUsers C ON C.ID = A.AssignedUserID 
            LEFT JOIN MasParty B ON B.ID = A.CustomerID
            WHERE A.DocStatus IN (${statusCSV})
            ${finalWhere}
            ORDER BY A.ID DESC
        `;

        // 6. Execute
        const replacements = { id: userId };
        if (SR_Source === 'Filter' && FilterQuery) {
            replacements.search = `%${FilterQuery}%`;
        }

        const results = await sequelize.query(sql, { 
            replacements: replacements, 
            type: QueryTypes.SELECT 
        });

        // 7. Send Response
        res.json({
            StreamType: "TABULAR",
            StreamName: "ServiceRequests",
            FreshOrAged: "FRESH",
            Data: results
        });

    } catch (err) {
        console.error("Service Request Error:", err);
        res.status(500).json({ message: "Error fetching service requests" });
    }
};