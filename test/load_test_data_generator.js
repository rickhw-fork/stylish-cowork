require('dotenv').config();
const {query, end} = require('../util/mysqlcon.js');
const ORDER_QUANTITY = 5000;

function _createFakeOrder(orders) {
    return query('INSERT INTO order_table (number, time, status, details, user_id) VALUES ?', [orders.map(x => Object.values(x))]);
}

async function createFakeData() {
    let i = 0;
    while (i < ORDER_QUANTITY) {
        let j = 0;
        let orders = [];
        while (j < Math.min(10000, ORDER_QUANTITY)){
            let order = {
                number: i,
                time: Date.now(),
                status: 0,
                details: JSON.stringify({
                    total: Math.floor(Math.random() * 1000)
                }),
                user_id: 1 + Math.floor(Math.random() * 5)
            };
            orders.push(order);
            j += 1;
        }
        i += j;
        await _createFakeOrder(orders);
    }
}

function truncateFakeData() {
    console.log('truncate fake data');
    const setForeignKey = (status) => {
        return query('SET FOREIGN_KEY_CHECKS = ?', status);
    };

    const truncateTable = (table) => {
        return query(`TRUNCATE TABLE ${table}`);
    };

    return setForeignKey(0)
        .then(truncateTable('order_table'))
        .catch(console.log);
}

function closeConnection() {
    return end();
}

// execute when called directly.
if (require.main === module) {
    console.log('main');
    truncateFakeData()
            .then(createFakeData)
        .then(closeConnection);
}

module.exports = {
    createFakeData,
    truncateFakeData,
    closeConnection,
};
