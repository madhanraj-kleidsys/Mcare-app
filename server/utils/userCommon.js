const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const moment = require('moment');

// Helper 1: Get User Hierarchy
const getUserHierarchy = async (userId) => {
  try {
    // 1. Get User Hierarchy Level and BFunc
    const userHierarchy = await sequelize.query(
      `SELECT A.HierarchyLevel, R.BFunc, R.Sequence as UserSeq, S.ISAllowed 
       FROM CrmUsers A 
       LEFT JOIN CRMUserRole R ON R.ID = A.HierarchyLevel
       LEFT JOIN CrmUserRights S ON S.ID = A.ID
       WHERE A.ID = :userId`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    if (!userHierarchy.length) return '0';

    const { BFunc, UserSeq } = userHierarchy[0];

    // 2. Get Max Sequence for this BFunc
    const maxSeqResult = await sequelize.query(
      `SELECT MAX(Sequence) AS MaxSeq FROM CRMUserRole WHERE BFunc = :BFunc`,
      { replacements: { BFunc }, type: QueryTypes.SELECT }
    );

    const startSeq = parseInt(UserSeq) || 0;
    const maxSeq = parseInt(maxSeqResult[0]?.MaxSeq) || startSeq;
    
    // 3. Build Array and join (Safe math loop)
    let hierarchyArray = [];
    for (let i = startSeq; i <= maxSeq; i++) {
      hierarchyArray.push(i);
    }

    return hierarchyArray.length > 0 ? hierarchyArray.join(',') : '0';
  } catch (error) {
    console.error("getUserHierarchy Error:", error);
    return '0';
  }
};

// Helper 2: Fetches Zone IDs
const getUserZoneID = async (userId) => {
  try {
    const zoneResults = await sequelize.query(
      `SELECT DISTINCT ZoneID 
       FROM CrmUserRightTeamMap 
       WHERE UserID = :userId AND ZoneID IS NOT NULL`,
      { replacements: { userId }, type: QueryTypes.SELECT }
    );

    if (!zoneResults.length) return '0';

    return zoneResults.map(z => z.ZoneID).join(',');
  } catch (error) {
    console.error("getUserZoneID Error:", error);
    return '0';
  }
};

// Helper 3: Get Reporting Team
const getAssignedUserNames = async (userId) => {
    try {
        const teamQry = await sequelize.query(`
            SELECT Name FROM CrmUsers WHERE ReportToUserID = :UserID AND IsActive = 1
        `, { replacements: { UserID: userId }, type: QueryTypes.SELECT });
        
        return teamQry.map(row => `'${row.Name.replace(/'/g, "''")}'`);
    } catch (err) {
        return [];
    }
};

// Helper 4: Get User Time
const getUserTime = (offsetMinutes = 0) => {
    if (offsetMinutes !== 0) {
        return moment().utc().add(offsetMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    }
    return moment().format('YYYY-MM-DD HH:mm:ss');
};

module.exports = { getUserHierarchy, getUserZoneID, getAssignedUserNames, getUserTime };