// MySQL 5.7 Database Configuration
const mysql = require('mysql');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'concept_tree_db',
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10,
    charset: 'utf8mb4'
});

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to MySQL database:', err.message);
        return;
    }
    console.log('✓ MySQL 5.7 database connected successfully');
    connection.release();
});

// Promisify query function for async/await usage
const query = (sql, params) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

module.exports = {
    pool,
    query
};
