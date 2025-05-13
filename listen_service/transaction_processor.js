const DBUtils = require('./db_utils');
const logger = require('./log_utils');
const { do_transaction } = require('./listen');

async function processTransactions() {
    try {
        // 获取所有状态为 INIT 的交易
        const pendingTransactions = await DBUtils.query(
            `SELECT * FROM transactions 
             WHERE status = 'INIT' 
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
                // 获取合约配置
                const contractConfig = await getContractConfig(tx.name);
                if (!contractConfig) {
                    logger.error(`No contract config found for ${tx.name}`);
                    continue;
                }

                // 执行交易
                const result = await do_transaction(
                    tx.name,
                    contractConfig,
                    tx.address,
                    tx.amount,
                    tx.id
                );

                // 更新交易状态
                if (result) {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'SUCCESS' WHERE id = ?`,
                        [tx.id]
                    );
                    logger.info(`Transaction ${tx.id} status updated to SUCCESS`);
                } else {
                    await DBUtils.query(
                        `UPDATE transactions SET status = 'FAIL' WHERE id = ?`,
                        [tx.id]
                    );
                    logger.error(`Transaction ${tx.id} status updated to FAIL`);
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

async function getContractConfig(name) {
    //  from  listen.js get
    const { routes } = require('./listen');
    const route = routes.get(name);
    return route ? route.to : null;
}

module.exports = {
    processTransactions
}; 