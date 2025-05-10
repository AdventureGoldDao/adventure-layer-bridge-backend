const mysql = require('mysql2');
const { dbConfig } = require('./env');

class DBUtils {
    constructor() {
        this.pool = mysql.createPool(dbConfig); // Create connection pool
    }

    // Method to execute queries
    query(sql, params) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err); // Failed to get connection
                }
                connection.query(sql, params, (error, results) => {
                    connection.release(); // Release connection
                    if (error) {
                        return reject(error); // Query failed
                    }
                    resolve(results); // Return query results
                });
            });
        });
    }
}

module.exports = new DBUtils(); // Export singleton 