const jwt = require('jsonwebtoken');
const { QueryTypes } = require('sequelize');
const sequelize = require('../config/db');
require('dotenv').config();

// Load secrets from env
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

// ----------------------- LOGIN -----------------------
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Username/Code and password are required" });
        }

        // Use sequelize.query with replacements for security
        const users = await sequelize.query(`
            SELECT TOP 1 
                [ID], [Code], [Name], [Department], [Designation], [DOB], [DOJ], 
                [ReportToUserID], [ZoneID], [TeamID], [BG], [Password], 
                [ProfilePicName], [EmailID], [MobNo], [UserName], [UserType], 
                [EmployeePic], [IsActive], [HierarchyLevel], [CustomerName], 
                [CustLocID], [CustResetPwd], [IsAdmin], [EulaAccepted], 
                [CompanyID], [BUID]
            FROM [GAMD].[dbo].[CrmUsers]
            WHERE (Code = :LoginId OR UserName = :LoginId) 
            AND Password = :Password
        `, {
            replacements: { LoginId: email, Password: password },
            type: QueryTypes.SELECT
        });

        // QueryTypes.SELECT returns an array. Check if it's empty.
        if (users.length === 0) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = users[0]; // Get the first user from the array

        if (!user.IsActive) {
            return res.status(403).json({ message: "Account is inactive" });
        }

        // Generate Tokens
        const payload = {
            id: user.ID,
            username: user.UserName,
            role: user.UserType,
            company_id: user.CompanyID
        };

        const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: "30m" });
        const refreshToken = jwt.sign({ id: user.ID }, REFRESH_SECRET, { expiresIn: "7d" });

        res.json({ 
            message: "Login successful", 
            accessToken, 
            refreshToken, 
            user 
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ message: "Server error" });
    }
};


// ----------------------- REFRESH (Stateless Rotation) -----------------------
exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({ error: 'Missing refresh token' });
        }

        // 1. Verify the old Refresh Token
        jwt.verify(refreshToken, REFRESH_SECRET, (err, decoded) => {
            if (err) {
                // If expired or invalid signature
                return res.status(403).json({ error: 'Invalid or expired refresh token' });
            }

            // 2. Generate NEW Tokens (Rotation)
            // Ideally, you query the DB here to ensure user still exists/is active
            // For speed/statelessness, we re-sign using the decoded ID.
            
            const newPayload = { 
                id: decoded.id, 
                // Note: If you need roles/username in access token, 
                // you might need to query DB again here to get fresh data.
            };

            // Re-issue Access Token
            const newAccessToken = jwt.sign(newPayload, ACCESS_SECRET, { expiresIn: '30m' });
            
            // Re-issue Refresh Token (Rotation)
            const newRefreshToken = jwt.sign({ id: decoded.id }, REFRESH_SECRET, { expiresIn: '7d' });

            // Send back new pair
            res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
        });

    } catch (err) {
        console.error('Refresh error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};