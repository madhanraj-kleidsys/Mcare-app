const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID, getUserTime } = require('../utils/userCommon');

exports.getMarketingCalls = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch User Context (Safety Check)
        const userContext = await sequelize.query(`
            SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id
        `, { replacements: { id: userId }, type: QueryTypes.SELECT });

        if (!userContext.length) return res.status(404).json({ message: "User not found" });

        const currentUser = userContext[0];
        const username = currentUser.Name || '';
        // Safe username for SQL IN clauses
        const safeUsername = username ? `'${username.replace(/'/g, "''")}'` : "''";
        const isAdmin = (currentUser.IsAdmin === 1 || currentUser.IsAdmin === true);

        // 2. Get Query Parameters
        const {
            MC_Source = 'Normal', // 'Dash', 'Normal', 'Filter'
            MC_Filter_Dash_Open,
            MC_Filter_Dash_Closed,
            MC_Filter_Dash_Completed,
            MC_Filter_Dash_Assigned,
            DocStatus,
            MC_Srch_Assigned,
            MC_Srch_Close,
            FilterQuery = '',
            MC_Srch_FromTime,
            MC_Srch_ToTime
        } = req.query;

        // 3. Get Hierarchy & Zones (Reuse your common utils!)
        const hierarchyList = await getUserHierarchy(userId);
        const zoneList = await getUserZoneID(userId);

        // 4. Build DocStatus List
        let statusList = [];
        if (MC_Filter_Dash_Open === 'true' || MC_Filter_Dash_Open === '1' || DocStatus === 'Registered') statusList.push("'REGISTERED'");
        if (MC_Filter_Dash_Closed === 'true' || MC_Filter_Dash_Closed === '1' || DocStatus === 'Closed') statusList.push("'CLOSED'");
        if (MC_Filter_Dash_Completed === 'true' || MC_Filter_Dash_Completed === '1' || DocStatus === 'Completed') statusList.push("'COMPLETED'");
        if (MC_Filter_Dash_Assigned === 'true' || MC_Filter_Dash_Assigned === '1' || DocStatus === 'Assigned') statusList.push("'ASSIGNED'");

        // Default if empty
        if (statusList.length === 0) statusList.push("'REGISTERED'");
        const statusCSV = statusList.join(',');

        // 5. Build Where Clauses
        let whereConditions = [];

        // --- A. Role Security (Non-Admins) ---
        // Matches PHP: Checks Hierarchy, Zone, AND (CreatedBy OR AssignedTo)
        if (!isAdmin) {
            whereConditions.push(`(A.BFuncSeq IN (${hierarchyList}) OR A.BFuncSeq IS NULL)`);
            whereConditions.push(`A.ZoneID IN (${zoneList})`);

            // Ownership Check
            if (MC_Srch_Assigned === 'on' || MC_Srch_Close === 'on') {
                whereConditions.push(`A.AssignedUserID = ${userId}`);
            } else {
                // PHP Logic: CreatedBy = Me OR AssignedUserName = Me
                whereConditions.push(`(A.CreatedBy = ${safeUsername} OR A.AssignedUserName = ${safeUsername})`);
            }
        }

        // --- B. Text Filter (Search Bar) ---
        if (MC_Source === 'Filter' && FilterQuery) {
            const searchClause = `
                (
                    ISNULL(A.CustName, '') LIKE :search OR
                    ISNULL(A.NewCustomerName, '') LIKE :search OR
                    ISNULL(A.LocationName, '') LIKE :search OR
                    ISNULL(A.NewAddress, '') LIKE :search OR
                    ISNULL(A.DocStatus, '') LIKE :search OR
                    -- ISNULL(A.IsSelfTask, '') LIKE :search OR  -- Bit fields can cause conversion errors in LIKE
                    -- ISNULL(A.IsExistingCust, '') LIKE :search OR 
                    ISNULL(A.CreatedBy, '') LIKE :search OR
                    ISNULL(A.DocNo, '') LIKE :search OR
                    ISNULL(A.AssignedUserName, '') LIKE :search
                )
            `;
            whereConditions.push(searchClause);
        }

        // --- C. Date Filter ---
        if (MC_Srch_FromTime || MC_Srch_ToTime) {
            const fromDate = MC_Srch_FromTime || '2000-01-01';
            const toDate = MC_Srch_ToTime || getUserTime(); // Defaults to NOW if empty
            whereConditions.push(`A.ScheduleDateTime BETWEEN '${fromDate}' AND '${toDate}'`);
        }

        // 6. Construct Final SQL
        const finalWhere = whereConditions.length > 0 
            ? 'AND ' + whereConditions.join(' AND ') 
            : '';

        const sql = `
            SELECT TOP 100 A.* FROM VuCRMMarketingCallsList A
            WHERE A.DocStatus IN (${statusCSV})
            ${finalWhere}
            ORDER BY A.ID DESC
        `;

        // 7. Execute
        const replacements = {};
        if (MC_Source === 'Filter' && FilterQuery) {
            replacements.search = `%${FilterQuery}%`;
        }

        const results = await sequelize.query(sql, { 
            replacements: replacements, 
            type: QueryTypes.SELECT 
        });

        // 8. Send Response
        res.json({
            StreamType: "TABULAR",
            StreamName: "MarketingCalls",
            FreshOrAged: "FRESH",
            Data: results
        });

    } catch (err) {
        console.error("Marketing Calls Error:", err);
        res.status(500).json({ message: "Error fetching marketing calls" });
    }
};