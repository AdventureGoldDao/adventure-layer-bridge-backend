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

    // Method to execute multiple queries in a transaction
    async transaction(queries) {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((err, connection) => {
                if (err) {
                    return reject(err);
                }

                connection.beginTransaction(err => {
                    if (err) {
                        connection.release();
                        return reject(err);
                    }

                    const results = [];
                    let completed = 0;

                    // Execute each query in sequence
                    queries.forEach(({ sql, params }, index) => {
                        connection.query(sql, params, (error, result) => {
                            if (error) {
                                return connection.rollback(() => {
                                    connection.release();
                                    reject(error);
                                });
                            }

                            results[index] = result;
                            completed++;

                            // If all queries are completed, commit the transaction
                            if (completed === queries.length) {
                                connection.commit(err => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            connection.release();
                                            reject(err);
                                        });
                                    }
                                    connection.release();
                                    resolve(results);
                                });
                            }
                        });
                    });
                });
            });
        });
    }
}

module.exports = new DBUtils(); // Export singleton 