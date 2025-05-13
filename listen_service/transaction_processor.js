const DBUtils = require('./db_utils');
const logger = require('./log_utils');

async function processTransactions(doTransactionFunc, getRouteFunc) {
    try {
        // Get all transactions with status INIT or PENDING
        const pendingTransactions = await DBUtils.query(
            `SELECT * FROM transactions 
             WHERE status in ('INIT', 'PENDING') 
             ORDER BY id ASC 
             LIMIT 10`
        );

        if (pendingTransactions.length === 0) {
            logger.info(`no transactions need to process `)
            return;
        }

        logger.info(`Found ${pendingTransactions.length} init transactions to process`);

        for (const tx of pendingTransactions) {
            try {
                // Get contract configuration
                const contractConfig = await getRouteFunc(tx.name);
                if (!contractConfig) {
                    logger.error(`No contract config found for ${tx.name}`);
                    continue;
                }

                // Execute transaction
                const result = await doTransactionFunc(
                    tx.name,
                    contractConfig,
                    tx.address,
                    tx.amount,
                    tx.id
                );

                // Update transaction status
                if (result === 'SUCCESS') {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'SUCCESS' WHERE id = ?`,
                        [tx.id]
                    );
                    logger.info(`Transaction ${tx.id} status updated to SUCCESS`);
                } else if(result === "PENDING") {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'PENDING' WHERE id = ?`,
                        [tx.id]
                    );
                    logger.info(`Transaction ${tx.id} status updated to PENDING`);
                } else if(result === 'FAIL') {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'FAIL' WHERE id = ?`,
                        [tx.id]
                    );
                    logger.error(`Transaction ${tx.id} status updated to FAIL`);
                }else{
                    logger.error(`Transaction ${tx.id} status updated to UNKNOWN`);
                }

            } catch (error) {
                logger.error(`Error processing transaction ${tx.id}:`, error);
                await DBUtils.query(
                    `UPDATE transactions SET status = 'FAIL', error_message = ? WHERE id = ?`,
                    [error.message, tx.id]
                );
            }
        }
    } catch (error) {
        logger.error('Error in processPendingTransactions:', error);
    }
}

module.exports = {
    processTransactions
}; 