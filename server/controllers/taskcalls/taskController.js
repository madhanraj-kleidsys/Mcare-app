const { QueryTypes } = require('sequelize');
const sequelize = require('../../config/db');
const { getUserHierarchy, getUserZoneID, getUserTime } = require('../../utils/userCommon');

exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id; 

    // 1. Fetch User Context
    const userContext = await sequelize.query(
      `SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id`,
      { replacements: { id: userId }, type: QueryTypes.SELECT }
    );

    if (!userContext.length) return res.status(404).json({ message: "User not found" });

    const currentUser = userContext[0];
    const fullname = currentUser.Name || '';
    const safeFullname = fullname ? `'${fullname.replace(/'/g, "''")}'` : "''";
    const isAdmin = currentUser.IsAdmin === 1 || currentUser.IsAdmin === true;

    // 2. Query Params
    const {
      TSK_Source = 'Normal',              
      TSK_Filter_Dash_Open,
      TSK_Filter_Dash_Closed,
      TSK_Filter_Dash_Completed,
      TSK_Filter_Dash_Assigned,
      TSK_Filter_Dash_Cancelled,
      TSK_Srch_Category = '',
      FilterQuery = '',                    
      TSK_Srch_FromTime,
      TSK_Srch_ToTime,
      TSK_Srch_Assigned,                 
      TSK_Srch_Close,                     
      TSK_Srch_New                        
    } = req.query;

    // 3. Hierarchy & Zones
    const hierarchyList = await getUserHierarchy(userId);   
    const zoneList      = await getUserZoneID(userId);      

    // 4. Status Logic
    let statusList = [];
    if (req.query.DocStatus) {
      const statuses = req.query.DocStatus.split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => ['REGISTERED','ASSIGNED','COMPLETED','CLOSED','CANCELLED'].includes(s));
      if (statuses.length > 0) statusList = statuses.map(s => `'${s}'`);
    }

    if (statusList.length === 0) {
      if (TSK_Filter_Dash_Open === 'true' || TSK_Filter_Dash_Open === '1') statusList.push("'REGISTERED'");
      if (TSK_Filter_Dash_Assigned === 'true' || TSK_Filter_Dash_Assigned === '1') statusList.push("'ASSIGNED'");
      if (TSK_Filter_Dash_Completed === 'true' || TSK_Filter_Dash_Completed === '1') statusList.push("'COMPLETED'");
      if (TSK_Filter_Dash_Closed === 'true' || TSK_Filter_Dash_Closed === '1') statusList.push("'CLOSED'");
      if (TSK_Filter_Dash_Cancelled === 'true' || TSK_Filter_Dash_Cancelled === '1') statusList.push("'CANCELLED'");
    }

    if (statusList.length === 0) statusList.push("'REGISTERED'");
    const statusCSV = statusList.join(',');

    // 5. Build WHERE conditions
    const whereConditions = [];

    // ── A. Date range ────────────────────────────────────────
    const fromDate = TSK_Srch_FromTime || '2000-01-01';
    const toDate   = TSK_Srch_ToTime   || (await getUserTime()); 

    // Use TRY_CAST for safety
    whereConditions.push(`TRY_CAST(A.DocDate AS DATE) >= '${fromDate}'`);
    whereConditions.push(`TRY_CAST(A.DocDate AS DATE) <= '${toDate}'`);

    // ── B. Category ──────────────────────────────────────────
    if (TSK_Srch_Category.trim()) {
      whereConditions.push(`A.CategoryName LIKE '%${TSK_Srch_Category.replace(/'/g, "''")}%'`);
    }

    // ── C. Role Security ─────────────────────────────────────
    if (!isAdmin) {
      whereConditions.push(`A.BFuncSeq IN (${hierarchyList})`);
      whereConditions.push(`A.ZoneID IN (${zoneList})`);

      if (TSK_Srch_Assigned === 'on' || TSK_Srch_Close === 'on') {
        whereConditions.push(`A.AssignedUserID = ${userId}`);
      } else if (TSK_Srch_New === 'on') {
        whereConditions.push(`A.CreatedBy = ${safeFullname}`);
      } else {
        whereConditions.push(`(A.CreatedBy = ${safeFullname} OR A.AssignedUserID = ${userId})`);
      }
    }

    // ── D. Search ────────────────────────────────────────────
    let replacements = {}; 
    if (TSK_Source === 'Filter' && FilterQuery.trim()) {
      replacements.search = `%${FilterQuery}%`;
      whereConditions.push(`(
          ISNULL(A.DocNo, '')           LIKE :search OR
          ISNULL(A.CategoryName, '')    LIKE :search OR
          ISNULL(A.CreatedBy, '')       LIKE :search OR
          ISNULL(A.AssignedUserName, '') LIKE :search OR
          ISNULL(A.DocStatus, '')       LIKE :search 
      )`);
    }

    // 6. Final SQL Construction
    const finalWhere = whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : '';

    // FIX: Removed 'A.ReqDescription' and 'A.TaskID'
    // Added 'A.Comments' which is valid for Tasks
    const columns = `
        A.ID, 
        A.DocNo, 
        A.DocDate, 
        A.DocStatus, 
        A.CategoryName, 
        A.Comments, 
        A.CreatedBy, 
        A.AssignedUserID, 
        A.AssignedUserName,
        A.ScheduleDateTime, 
        A.TargetDateTime
    `;

    const sql = `
      SELECT TOP 150 ${columns} 
      FROM VuCRMTaskList A
      WHERE A.DocStatus IN (${statusCSV})
      ${finalWhere}
      ORDER BY A.ID DESC
    `;

    // 7. Execute
    const results = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT
    });

    res.json({
      StreamType: "TABULAR",
      StreamName: "Tasks",
      FreshOrAged: "FRESH",
      Data: results
    });

  } catch (err) {
    console.error("Get Tasks Error:", err);
    res.status(500).json({ message: "Error fetching tasks" });
  }
};