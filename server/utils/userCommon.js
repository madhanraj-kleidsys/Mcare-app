// server/utils/userCommon.js
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
const moment = require('moment');


// Helper 1: Get User Hierarchy (Replacing MobileAppHierarchy.php)
const getUserHierarchy = async (userId) => {
    try {
        const userQry = await sequelize.query(`
            SELECT R.BFunc, R.Sequence AS UserSeq
            FROM CrmUsers A
            LEFT JOIN CRMUserRole R ON R.ID = A.HierarchyLevel
            WHERE A.ID = :UserID
        `, { replacements: { UserID: userId }, type: QueryTypes.SELECT });

        if (!userQry.length) return '0';
        
        const { BFunc, UserSeq } = userQry[0];

        const maxSeqQry = await sequelize.query(`
            SELECT MAX(Sequence) AS MaxSeq FROM CRMUserRole WHERE BFunc = :BFunc
        `, { replacements: { BFunc }, type: QueryTypes.SELECT });
        
        const MaxSeq = maxSeqQry[0].MaxSeq || UserSeq;

        let hierarchy = [];
        for (let i = UserSeq; i <= MaxSeq; i++) {
            hierarchy.push(i);
        }
        return hierarchy.length > 0 ? hierarchy.join(',') : '0';
    } catch (err) {
        console.error('Hierarchy Error:', err);
        return '0';
    }
};

// Helper 2: Get User Zones (Replacing MobileAppHierarchy.php)
const getUserZoneID = async (userId) => {
    try {
        const zoneQry = await sequelize.query(`
            SELECT ZoneID FROM CrmUserRightTeamMap WHERE UserID = :UserID
        `, { replacements: { UserID: userId }, type: QueryTypes.SELECT });
            
        return zoneQry.length > 0 ? zoneQry.map(row => row.ZoneID).join(',') : '0';
    } catch (err) {
        console.error('Zone Error:', err);
        return '0';
    }
};

// Helper 3: Get Reporting Team (Replacing AssignedUserNames.php)
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

// Helper 4: Get User Time(Replacing include_once '../CRMCommons/GetUserTime.php'; )

const getUserTime = (offsetMinutes = 0) => {
    // If you have a specific time offset (in minutes) from the frontend user
    if (offsetMinutes !== 0) {
        return moment().utc().add(offsetMinutes, 'minutes').format('YYYY-MM-DD HH:mm:ss');
    }
    // Default to Server Time
    return moment().format('YYYY-MM-DD HH:mm:ss');
};


module.exports = { getUserHierarchy, getUserZoneID, getAssignedUserNames, getUserTime };