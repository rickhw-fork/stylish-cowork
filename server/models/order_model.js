const {query, transaction, commit, rollback} = require('../../util/mysqlcon.js');
const got = require('got');
const Product = require('../models/product_model');

const createOrder = async (order, productList) => {
    try {
        await transaction();
        const result = await query('INSERT INTO order_table SET ?', order);
        const data = [];
        for (const p of productList) {
            const variantID = await Product.updateVariantStock(p.id, p.size, p.color.code, parseInt(p.qty));
            data.push([result.insertId, p.id, variantID, parseInt(p.qty)]);
        }
        await query('INSERT INTO order_product (order_id, product_id, variant_id, quantity) VALUES ?', [data]);
        await commit();
        return result.insertId;
    } catch (error) {
        console.log(error);
        await rollback();
        return { error };
    }
};

const createPayment = async function (payment) {
    try {
        await transaction();
        await query('INSERT INTO payment SET ?', payment);
        if (payment.status === 0) {
            await query('UPDATE order_table SET status = ? WHERE id = ?', [2, payment.order_id]);
        }
        await commit();
        return true;
    } catch (error) {
        await rollback();
        return {error};
    }
};

const payOrderByPrime = async function(tappayKey, prime, order){
    let res = await got.post('https://sandbox.tappaysdk.com/tpc/payment/pay-by-prime', {
        headers: {
            'Content-Type':'application/json',
            'x-api-key': tappayKey
        },
        json: {
            'prime': prime,
            'partner_key': tappayKey,
            'merchant_id': 'AppWorksSchool_CTBC',
            'details': 'Stylish Payment',
            'amount': order.total,
            'cardholder': {
                'phone_number': order.recipient.phone,
                'name': order.recipient.name,
                'email': order.recipient.email
            },
            'remember': false
        },
        responseType: 'json'
    });
    return res.body;
};

const getUserPayments = async () => {
    const orders = await query('SELECT * FROM order_table');
    return orders;
};

const getUserOrders = async (userID, status) => {
    let queryStr = `SELECT o.* , s.status FROM order_table AS o
                        INNER JOIN order_status AS s ON s.id = o.status
                        WHERE o.user_id = ? `;
    if (status !== 'all') {
        queryStr += 'AND s.status = ?';
    }
    const result = await query(queryStr, [userID, status]);
    return result;
};

const getOrdersProducts = async (orderIds) => {
    const queryStr = `SELECT op.*, p.title, p.price, p.main_image, v.color_code, v.color_name, v.size FROM order_product AS op
                        INNER JOIN product AS p ON op.product_id = p.id
                        INNER JOIN variant AS v ON op.variant_id = v.id
                        WHERE order_id IN (?)`;
    const bindings = [orderIds];
    return await query(queryStr, bindings);
};

const updateProductComment = async (userId, id, rating, comment, time) => {
    try {
        await transaction();
        const sql = `SELECT * FROM order_product AS op
                    INNER JOIN  order_table AS o ON op.order_id = o.id
                    WHERE op.id = ? AND o.user_id = ? FOR UPDATE`;
        const result = await query(sql, [id, userId]);
        if (result.length === 0) {
            return { error: 'User order history not found' };
        }
        await query('UPDATE order_product SET rating = ? ,comment =  ?, comment_time = ? WHERE id = ?', [rating, comment, time, id]);
        const productId = result[0].product_id;
        const op = await query('SELECT rating FROM order_product WHERE product_id = ?', [productId]);
        const opCount = op.reduce((acc, r) => {
            if (r.rating !== null) {
                return acc + 1;
            } else {
                return acc;
            }
        },0);
        const productRating = (op.reduce((sum, op) => sum + op.rating, 0) / opCount).toFixed(1);
        await query('UPDATE product SET rating = ? WHERE id = ?', [productRating, productId]);
        await commit();
        return result;
    } catch (error) {
        console.log(error);
        await rollback();
        return { error: error };
    }
};
// discount region
const discountCheck = async (token) => {
    const result =
        await query('SELECT * FROM discount WHERE token = ?', [token]);
    if (result.length === 0){
        return {error: 'Not correct discount token!', status: -1};
    } else {
        if (Date.now() - result[0].create_at <= result[0].token_expired) {
            return { discount: parseFloat(result[0].discount) ,
                status: 0, stock: result[0].stock, expired_at: (result[0].create_at + result[0].token_expired)};
        } else {
            return {error: 'The discount is expired!', status: -2};
        }
    }
};

const getDiscount = async () => {
    return await query('SELECT * FROM discount');
};

const getDaily = async () => {
    const result = await query('SELECT * FROM discount WHERE user = "system"');
    result[0].expired_at = result[0].create_at + result[0].token_expired;
    return result[0];
};

const updateDaily = async () => {
    const sql = 'UPDATE discount SET ? WHERE user = "system"';
    const post = {
        token: Math.random().toString(36).substr(2,6),
        discount: (Math.floor(Math.random() * (90 - 70)) + 70) / 100, // 0.7~0.9
        token_expired: 86400 * 1000,
        stock: 10,
        create_at: Date.now(),
    };
    let result = await query(sql, [post]);
    return post;
};

const createDiscount = async () => {  // not used
    const sql = 'INSERT INTO discount SET ? ';
    const post = {
        token: Math.random().toString(36).substr(2,6),
        discount: (Math.floor(Math.random() * (100 - 60)) + 60) / 100, // 1~0.6
        token_expired: 86400 * 1000,
        stock: 10,
        create_at: Date.now(),
    };
    let result = await query(sql, [post]);
    post.expired_at = post.create_at + post.token_expired;
    return post;
};

const getUserDiscount = async (user) => {
    if(!user) {
        return {error:'Please sign in to view this page'};
    }
    const search = await query(`SELECT * FROM discount WHERE user = ${user}`);
    if (search.length === 0) {
        const sql = 'INSERT INTO discount SET ?';
        const post = {
            token: Math.random().toString(36).substr(2,6),
            discount: (Math.floor(Math.random() * (100 - 60)) + 60) / 100, // 1~0.6
            token_expired: 86400 * 1000,
            stock: 1,
            user: user,
            create_at: Date.now(),
        };
        const result = await query(sql, post);
        post.expired_at = post.create_at + post.token_expired;
        post.next = post.create_at + 86400 * 3 * 1000;
        return post;
    } else {
        if (Date.now() - search[0].create_at <= search[0].token_expired * 3) {
            // user only update discount per 3 days
            search[0].expired_at = search[0].create_at + search[0].token_expired;
            search[0].next = search[0].create_at + 86400 * 3 * 1000;
            return search[0];
        } else {
            const sql = 'UPDATE discount SET ? WHERE user = ?';
            const post = {
                token: Math.random().toString(36).substr(2,6),
                discount: (Math.floor(Math.random() * (100 - 60)) + 60) / 100, // 1~0.6
                token_expired: 86400 * 1000,
                stock: 1,
                create_at: Date.now(),
            };
            const result = await query(sql, [post, user]);
            post.expired_at = post.create_at + post.token_expired;
            post.next = post.create_at + 86400 * 3 * 1000;
            return post;
        }
    }
};
const useDiscount = async (token) => {
    return await query('UPDATE discount SET stock = stock - 1 WHERE token = ?', [token]);
};


const delDiscount = async () => {
    const time = Date.now();
    const result = await query(`DELETE FROM discount WHERE (create_at + token_expired) < ${time}`);
    return result;
};

module.exports = {
    createOrder,
    createPayment,
    payOrderByPrime,
    getUserPayments,
    getUserOrders,
    getOrdersProducts,
    updateProductComment,
    discountCheck,
    getDiscount,
    createDiscount,
    getDaily,
    updateDaily,
    getUserDiscount,
    useDiscount,
    delDiscount
};