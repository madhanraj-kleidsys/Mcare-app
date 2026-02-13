// console.log("Hello via Bun!");
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const { connectDB } = require('./config/db');


const loginRoutes = require('./routes/authRoutes');
const homeRoutes = require('./routes/homeRoutes');
const serviceRoutes = require('./routes/serviceRoutes.js');
const marketingCallsRoutes = require('./routes/marketingCallsRoutes');
const taskRoutes = require('./routes/taskRoutes');
const claimRoutes = require('./routes/claimsRoutes');


const calendarRoutes = require('./routes/calenderRoutes');
const profileRoutes = require('./routes/profileRoutes');
// const { default: api } = require('../ClientApp/api/axiosClient.js');

const app = express();
app.use(cors());
app.use(express.json());
// connectDB();


app.use('/api/auth', loginRoutes);
app.use('/api/home', homeRoutes);

// 4 boxes supremacy 😂😂
app.use('/api/service', serviceRoutes);
app.use('/api/marketing', marketingCallsRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/calendar', calendarRoutes);


app.use('/api/profile', profileRoutes);

app.get('/', (req, res) => {
    res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} , HOST : ${HOST}`);
});

module.exports = app;