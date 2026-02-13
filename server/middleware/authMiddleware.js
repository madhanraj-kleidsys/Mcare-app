const jwt = require('jsonwebtoken');
require('dotenv').config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;

const authenticateToken = (req, res, next) => {
    // 1. Get the auth header value
    const authHeader = req.headers['authorization'];
    
    // 2. Extract the token (Format: "Bearer <token>")
    const token = authHeader && authHeader.split(' ')[1];

    // 3. If there is no token, return 401 (Unauthorized)
    if (!token) {
        return res.status(401).json({ message: "Access token required" });
    }

    // 4. Verify the token
    jwt.verify(token, ACCESS_SECRET, (err, user) => {
        if (err) {
            // If token is expired or invalid, return 403 (Forbidden)
            return res.status(403).json({ message: "Invalid or expired token" , $error: {err }});
        }

        // 5. Attach the decoded user payload to the request object
        // This allows your controller to access req.user.id, req.user.role, etc.
        req.user = user;
        
        // 6. Proceed to the next middleware or controller
        next();
    });
};

module.exports = { authenticateToken };