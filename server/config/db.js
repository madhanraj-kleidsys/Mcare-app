const { Sequelize } = require('sequelize');
require('dotenv').config();

const [host, instanceName] = process.env.DB_HOST.split('\\');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host,
    dialect: 'mssql',
    port: Number(process.env.DB_PORT) || 1433,
    logging:false,
    dialectOptions: {
      options: {
        encrypt: false,
        requestTimeout: 60000,
        // connectionTimeout: 60000,
        // keepAlive: true,
        // enableArithAbort: true,
        trustServerCertificate: true,
        instanceName: instanceName || undefined,
      },
    },
  }
);

const connectDB = async () => {
    try{
        await sequelize.authenticate();
        console.log('✅ DATABASE CONNECTED');
    }
    catch(err){
        console.error('⚠️ err is db connection:', err);
    }
};

connectDB();

module.exports = sequelize;