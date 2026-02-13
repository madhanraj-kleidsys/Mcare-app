// controllers/claimsController.js
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const { getUserHierarchy, getUserZoneID } = require('../utils/userCommon');

exports.getClaims = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user context
    const userContext = await sequelize.query(
      `SELECT Name, IsAdmin FROM CrmUsers WHERE ID = :id`,
      { replacements: { id: userId }, type: QueryTypes.SELECT }
    );

    if (!userContext.length) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentUser = userContext[0];
    const username = currentUser.Name || '';
    const safeUsername = username ? `'${username.replace(/'/g, "''")}'` : "''";
    const isAdmin = currentUser.IsAdmin === 1 || currentUser.IsAdmin === true;

    // 2. Query parameters
    const {
      CLM_Source = 'Normal',
      CLM_Filter_Dash_Booked,
      CLM_Filter_Dash_Waiting,
      CLM_Filter_Dash_Cancelled,
      CLM_Filter_Dash_Approved,
      DocStatus,
      FilterQuery = '',
      CLM_Srch_DocNo,
      CLM_Srch_Comments,
      CLM_Srch_ClaimType,
      CLM_Srch_RefType,
      CLM_Srch_CustName,
      CLM_Srch_CreatedByName,
      CLM_Srch_FromTime,
      CLM_Srch_ToTime,
    } = req.query;

    // 3. Hierarchy & zones
    const hierarchyList = await getUserHierarchy(userId);
    const zoneList = await getUserZoneID(userId);

    // 4. Status logic (same pattern as tasks)
    let statusList = [];

    if (DocStatus) {
      const statuses = DocStatus.split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => ['BOOKED', 'WAITING', 'CANCELLED', 'APPROVED'].includes(s));
      if (statuses.length > 0) {
        statusList = statuses.map(s => `'${s}'`);
      }
    }

    if (statusList.length === 0) {
      if (CLM_Filter_Dash_Booked === 'true' || CLM_Filter_Dash_Booked === '1') {
        statusList.push("'BOOKED'");
      }
      if (CLM_Filter_Dash_Waiting === 'true' || CLM_Filter_Dash_Waiting === '1') {
        statusList.push("'WAITING'");
      }
      if (CLM_Filter_Dash_Cancelled === 'true' || CLM_Filter_Dash_Cancelled === '1') {
        statusList.push("'CANCELLED'");
      }
      if (CLM_Filter_Dash_Approved === 'true' || CLM_Filter_Dash_Approved === '1') {
        statusList.push("'APPROVED'");
      }
    }

    if (statusList.length === 0) {
      statusList.push("'BOOKED'");
    }

    const statusCSV = statusList.join(',');

    // 5. Build WHERE conditions
    const whereConditions = [];

    // Date range – use TRY_CAST / CAST for safety
    const fromDate = CLM_Srch_FromTime || '2000-01-01';
    const toDate   = CLM_Srch_ToTime   || 'GETDATE()'; // current date

    whereConditions.push(`TRY_CAST(A.Date AS DATE) >= '${fromDate}'`);
    whereConditions.push(`TRY_CAST(A.Date AS DATE) <= ${toDate}`);

    // Additional filters (LIKE or =)
    if (CLM_Srch_DocNo?.trim()) {
      whereConditions.push(`A.DocNo = '${CLM_Srch_DocNo.replace(/'/g, "''")}'`);
    }
    if (CLM_Srch_ClaimType?.trim()) {
      whereConditions.push(`A.ClaimTypeID = '${CLM_Srch_ClaimType.replace(/'/g, "''")}'`);
    }
    if (CLM_Srch_RefType?.trim()) {
      whereConditions.push(`A.RefType = '${CLM_Srch_RefType.replace(/'/g, "''")}'`);
    }
    if (CLM_Srch_CustName?.trim()) {
      whereConditions.push(`A.CustName LIKE '%${CLM_Srch_CustName.replace(/'/g, "''")}%'`);
    }
    if (CLM_Srch_CreatedByName?.trim()) {
      whereConditions.push(`A.CreatedByName LIKE '%${CLM_Srch_CreatedByName.replace(/'/g, "''")}%'`);
    }
    if (CLM_Srch_Comments?.trim()) {
      whereConditions.push(`A.Comments LIKE '%${CLM_Srch_Comments.replace(/'/g, "''")}%'`);
    }

    // 6. Hierarchy / Zone security (mainly for WAITING & APPROVED)
    if (!isAdmin && (statusList.includes("'WAITING'") || statusList.includes("'APPROVED'"))) {
      whereConditions.push(`(A.BFuncSeq IN (${hierarchyList}) OR A.BFuncSeq IS NULL)`);
      whereConditions.push(`A.ZoneID IN (${zoneList})`);
    }

    // 7. Free text search (Filter mode)
    let replacements = {};
    if (CLM_Source === 'Filter' && FilterQuery.trim()) {
      replacements.search = `%${FilterQuery.replace(/'/g, "''")}%`;
      whereConditions.push(`
        (
          ISNULL(A.DocNo, '')           LIKE :search OR
          ISNULL(A.Comments, '')        LIKE :search OR
          ISNULL(A.ClaimTypeID, '')     LIKE :search OR
          ISNULL(A.RefType, '')         LIKE :search OR
          ISNULL(A.CustName, '')        LIKE :search OR
          ISNULL(A.CreatedByName, '')   LIKE :search
        )
      `);
    }

    // 8. Ownership rules (BOOKED, WAITING, APPROVED)
    let ownershipWhere = '';
    if (!isAdmin) {
      if (statusCSV === "'BOOKED'") {
        ownershipWhere = ` AND A.CreatedBy = ${safeUsername}`;
      } else if (statusCSV === "'APPROVED'") {
        ownershipWhere = ` AND (A.ApproverUserID = ${userId} OR A.CreatedBy = ${safeUsername})`;
      } else if (statusCSV === "'WAITING'") {
        ownershipWhere = ` AND (A.ApproverUserID = ${userId} OR A.CreatedBy = ${safeUsername})`;
      } else if (statusCSV === "'CANCELLED'") {
        ownershipWhere = ` AND A.CreatedBy = ${safeUsername}`;
      }
    }

    // 9. Combine WHERE
    const finalWhere = whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : '';

    // 10. Final SQL (using TRY_CAST for date safety)
    const sql = `
      SELECT TOP 200 *
      FROM VuCrmClaimsList A
      WHERE A.DocStatus IN (${statusCSV})
      ${finalWhere}
      ${ownershipWhere}
      ORDER BY A.ID DESC
    `;

    // 11. Execute
    const results = await sequelize.query(sql, {
      replacements,
      type: QueryTypes.SELECT,
    });

    // 12. Response
    res.json({
      StreamType: "TABULAR",
      StreamName: "Claims",
      FreshOrAged: "FRESH",
      Data: results,
    });

  } catch (err) {
    console.error("Get Claims Error:", err);
    res.status(500).json({
      message: "Error fetching claims",
      error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
  }
};