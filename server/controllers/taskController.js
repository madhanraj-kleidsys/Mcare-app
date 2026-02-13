// // controllers/taskController.js
// const { QueryTypes } = require('sequelize');
// const sequelize = require('../config/db');
// const { getUserHierarchy, getUserZoneID, getUserTime } = require('../utils/userCommon');

// exports.getTasks = async (req, res) => {
//   try {
//     const userId = req.user.id; // assuming JWT / auth middleware sets req.user

//     // 1. Fetch current user context (name + admin flag)
//     const userContext = await sequelize.query(
//       `SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id`,
//       { replacements: { id: userId }, type: QueryTypes.SELECT }
//     );

//     if (!userContext.length) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     const currentUser = userContext[0];
//     const fullname = currentUser.Name || '';
//     // Escape single quotes properly for SQL string literals
//     const safeFullname = fullname ? `'${fullname.replace(/'/g, "''")}'` : "''";
//     const isAdmin = currentUser.IsAdmin === 1 || currentUser.IsAdmin === true;

//     // 2. Read all relevant query parameters
//     const {
//       TSK_Source = 'Normal',               // Dash | Normal | Filter
//       TSK_Filter_Dash_Open,
//       TSK_Filter_Dash_Closed,
//       TSK_Filter_Dash_Completed,
//       TSK_Filter_Dash_Assigned,
//       TSK_Srch_Category = '',
//       FilterQuery = '',                    // common search field when source=Filter
//       TSK_Srch_FromTime,
//       TSK_Srch_ToTime,
//       TSK_Srch_Schedule,
//       TSK_Srch_DocStatus,
//       TSK_Srch_AssignType,
//       TSK_Srch_Assigned,                   // usually 'on'
//       TSK_Srch_Close,                      // usually 'on'
//       TSK_Srch_New                         // usually 'on'
//     } = req.query;

//     // 3. Get hierarchy & zone restrictions (strings ready for IN (...))
//     const hierarchyList = await getUserHierarchy(userId);   // e.g. "'M-0-3','M-0-4','G-1-1'"
//     const zoneList      = await getUserZoneID(userId);      // e.g. "45,46,128"

//     // 4. Build DocStatus CSV
//     let statusList = [];

//     if (req.query.DocStatus) {
//   const statuses = req.query.DocStatus.split(',')
//     .map(s => s.trim().toUpperCase())
//     .filter(s => ['REGISTERED','ASSIGNED','COMPLETED','CLOSED'].includes(s));

//   if (statuses.length > 0) {
//     statusList = statuses.map(s => `'${s}'`);
//   }
// }

//     // Dashboard quick filters take precedence

//     if (statusList.length === 0) {
//   if (TSK_Filter_Dash_Open === 'true' || TSK_Filter_Dash_Open === '1') {
//     statusList.push("'REGISTERED'");
//   }
//   if (TSK_Filter_Dash_Assigned === 'true' || TSK_Filter_Dash_Assigned === '1') {
//     statusList.push("'ASSIGNED'");
//   }
//   if (TSK_Filter_Dash_Completed === 'true' || TSK_Filter_Dash_Completed === '1') {
//     statusList.push("'COMPLETED'");
//   }
//   if (TSK_Filter_Dash_Closed === 'true' || TSK_Filter_Dash_Closed === '1') {
//     statusList.push("'CLOSED'");
//   }
// }

//     // if (TSK_Filter_Dash_Open === 'true' || TSK_Filter_Dash_Open === '1') {
//     //   statusList.push("'REGISTERED'");
//     // }
//     // if (TSK_Filter_Dash_Completed === 'true' || TSK_Filter_Dash_Completed === '1') {
//     //   statusList.push("'COMPLETED'");
//     // }
//     // if (TSK_Filter_Dash_Closed === 'true' || TSK_Filter_Dash_Closed === '1') {
//     //   statusList.push("'CLOSED'");
//     // }
//     // if (TSK_Filter_Dash_Assigned === 'true' || TSK_Filter_Dash_Assigned === '1') {
//     //   statusList.push("'ASSIGNED'");
//     // }

//     // Fallback / default
//     if (statusList.length === 0) {
//       statusList.push("'REGISTERED'");
//     }

//     // // Extra overrides from specific buttons (TSK_Srch_XXX)
//     // if (TSK_Srch_Assigned === 'on') {
//     //   statusList = ["'ASSIGNED'"];
//     // } else if (TSK_Srch_Close === 'on') {
//     //   statusList = ["'COMPLETED'"]; // PHP uses 'COMPLETED' for close
//     // } else if (TSK_Srch_New === 'on') {
//     //   statusList = ["'REGISTERED'"];
//     // }

//     const statusCSV = statusList.join(',');

//     // 5. Build WHERE conditions array
//     const whereConditions = [];

//     // ── A. Date range ────────────────────────────────────────
//     const fromDate = TSK_Srch_FromTime || '2000-01-01';
//     const toDate   = TSK_Srch_ToTime   || (await getUserTime()); // dynamic today

//     whereConditions.push(`CONVERT(date, A.DocDate) >= '${fromDate}'`);
//     whereConditions.push(`CONVERT(date, A.DocDate) <= '${toDate}'`);

//     // ── B. Category filter ───────────────────────────────────
//     if (TSK_Srch_Category.trim()) {
//       whereConditions.push(`A.CategoryName LIKE '%${TSK_Srch_Category.replace(/'/g, "''")}%'`);
//     }

//     // ── C. Role / Hierarchy security (non-admins) ────────────
//     if (!isAdmin) {
//       whereConditions.push(`A.BFuncSeq IN (${hierarchyList})`);
//       whereConditions.push(`A.ZoneID IN (${zoneList})`);

//       // Ownership logic depending on which button was pressed
//       if (TSK_Srch_Assigned === 'on' || TSK_Srch_Close === 'on') {
//         whereConditions.push(`A.AssignedUserID = ${userId}`);
//       } else if (TSK_Srch_New === 'on') {
//         whereConditions.push(`A.CreatedBy = ${safeFullname}`);
//       } else {
//         // default: see own created + assigned tasks
//         whereConditions.push(`(A.CreatedBy = ${safeFullname} OR A.AssignedUserID = ${userId})`);
//       }
//     }

//     // ── D. Free text search (when source = Filter) ───────────
//     if (TSK_Source === 'Filter' && FilterQuery.trim()) {
//       const escapedSearch = `%${FilterQuery.replace(/'/g, "''")}%`;
//       whereConditions.push(`
//         (
//           ISNULL(A.TaskID, '')            LIKE :search OR
//           ISNULL(A.CategoryName, '')      LIKE :search OR
//           ISNULL(A.CreatedBy, '')         LIKE :search OR
//           ISNULL(A.AssignedUserName, '')  LIKE :search OR
//           ISNULL(A.DocStatus, '')         LIKE :search OR
//           CONVERT(VARCHAR, A.ScheduleDateTime, 120) LIKE :search
//         )
//       `);
//     }

//     // 6. Build final WHERE clause
//     const finalWhere = whereConditions.length > 0
//       ? 'AND ' + whereConditions.join(' AND ')
//       : '';

//     // 7. Main query
//     const sql = `
//       SELECT TOP 150 * 
//       FROM VuCRMTaskList A
//       WHERE A.DocStatus IN (${statusCSV})
//       ${finalWhere}
//       ORDER BY A.ID DESC
//     `;

//     // 8. Execute
//     const replacements = {};
//     if (TSK_Source === 'Filter' && FilterQuery.trim()) {
//       replacements.search = escapedSearch;
//     }

//     const results = await sequelize.query(sql, {
//       replacements,
//       type: QueryTypes.SELECT
//     });

//     // 9. Response format (matching PHP output style)
//     res.json({
//       StreamType: "TABULAR",
//       StreamName: " ",
//       FreshOrAged: "FRESH",
//       Data: results
//     });

//   } catch (err) {
//     console.error("Get Tasks Error:", err);
//     res.status(500).json({
//       message: "Error fetching tasks",
//       error: process.env.NODE_ENV === 'development' ? err.message : undefined
//     });
//   }
// };



const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID, getUserTime } = require('../utils/userCommon');

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
        .filter(s => ['REGISTERED','ASSIGNED','COMPLETED','CLOSED'].includes(s));
      if (statuses.length > 0) statusList = statuses.map(s => `'${s}'`);
    }

    if (statusList.length === 0) {
      if (TSK_Filter_Dash_Open === 'true' || TSK_Filter_Dash_Open === '1') statusList.push("'REGISTERED'");
      if (TSK_Filter_Dash_Assigned === 'true' || TSK_Filter_Dash_Assigned === '1') statusList.push("'ASSIGNED'");
      if (TSK_Filter_Dash_Completed === 'true' || TSK_Filter_Dash_Completed === '1') statusList.push("'COMPLETED'");
      if (TSK_Filter_Dash_Closed === 'true' || TSK_Filter_Dash_Closed === '1') statusList.push("'CLOSED'");
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