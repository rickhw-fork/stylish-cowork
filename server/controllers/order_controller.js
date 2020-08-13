require('dotenv').config();
const _ = require('lodash');
const validator = require('validator');
const {TAPPAY_PARTNER_KEY, CLOUDFRONT} = process.env;
const User = require('../models/user_model');
const Order = require('../models/order_model');

const checkout = async (req, res) => {
    const data = req.body;
	if (!data.order || !data.order.total || !data.order.list || !data.prime) {
        res.status(400).send({error:'Create Order Error: Wrong Data Format'});
		return;
	}
    const token = req.get('Authorization');
    const accessToken = token ? token.replace('Bearer ', '') : token;

    const result = await User.getUserProfile(accessToken);
    const user = result.data;

    const now = new Date();
    const number = '' + now.getMonth() + now.getDate() + (now.getTime()%(24*60*60*1000)) + Math.floor(Math.random()*10);
    const orderRecord = {
        number: number,
        time: now.getTime(),
        status: 0, // -1 for init (not pay yet)
        subtotal: data.order.subtotal,
        freight: data.order.freight,
        total: data.order.total,
        payment: data.order.payment,
        shipping: data.order.shipping,
        recipient: validator.blacklist(JSON.stringify(data.order.recipient), '<>')
    };
    orderRecord.user_id = (user && user.id) ? user.id : null;
    orderRecord.discount = data.order.discount ? parseFloat(data.order.discount) : 0;
    orderRecord.discount_token = data.order.discount_token? data.order.discount_token : 0;
    if (orderRecord.discount_token !== 0) {
        await Order.useDiscount(orderRecord.discount_token);
    }
    let orderId;
    let paymentResult;
    try {
        orderId = await Order.createOrder(orderRecord, data.order.list);
        paymentResult = await Order.payOrderByPrime(TAPPAY_PARTNER_KEY, data.prime, data.order);
    } catch (error) {
        res.status(400).send({error});
        return;
    }
    const payment = {
        order_id: orderId,
        details: validator.blacklist(JSON.stringify(paymentResult), '<>'),
        status: parseInt(paymentResult.status),
        amount: parseFloat(paymentResult.amount)
    };
    await Order.createPayment(payment);
    res.send({data: {number}});
};

// For Load Test
const getUserPayments = async (req, res) => {
    const orders = await Order.getUserPayments();
    const user_payments = orders.map(order => {
        let details = JSON.parse(order.details);
        return {user_id: order.user_id, total: details.total};
    }).reduce((obj, order) => {
        let user_id = order.user_id;
        if (!(user_id in obj)) {
            obj[user_id] = 0;
        }
        obj[user_id] += order.total;
        return obj;
    }, {});
    const user_payments_data = Object.keys(user_payments).map(user_id => {
        return {
            user_id,
            total_payment: user_payments[user_id]
        };
    });
    res.status(200).send({data: user_payments_data});
};

const getUserOrders = async (req, res) => {
    const userID = req.profile.data.id;
    const status = req.params.status;
    const orders = await Order.getUserOrders(userID, status);
    if (!orders) {
        res.status(400).send({error:'Wrong Request'});
        return;
    }
    if (orders.length == 0) {
        res.status(200).json({data: []});
        return;
    }
    const ordersWithDetail = await getOrdersWithDetail(orders);

    res.status(200).json({ data: ordersWithDetail });
};

const getOrdersWithDetail = async (orders) => {
    const orderIds = orders.map(o => o.id);
    const products = await Order.getOrdersProducts(orderIds);
    const productsRefactor = products.map((p) => {
        const product = {
            id: p.id,
            order_id: p.order_id,
            product_id: p.product_id,
            title: p.title,
            price: p.price,
            variant_id: p.variant_id,
            quantity: p.quantity,
            variant: {
                color_code: p.color_code,
                color_name: p.color_name,
                size_: p.size
            }
        };
        product.main_image = p.main_image ? CLOUDFRONT + '/api-assets/' + p.product_id + '/' + p.main_image : null;
        product.rating = (p.rating) ? p.rating : null;
        product.comment = (p.comment) ? p.comment : null;
        product.comment_time = (p.comment_time) ? p.comment_time : null;
        return product;
    });
    const productsMap = _.groupBy(productsRefactor, p => p.order_id);
    return orders.map((o) => {
        o.recipient = JSON.parse(o.recipient);
        if (!productsMap[o.id]) { return o; }
        o.products = productsMap[o.id];
        return o;
    });
};

const updateProductComment = async (req, res) => {
    const userId = req.profile.data.id;
    const { id, rating, comment } = req.body;
    if (!id) {
        res.status(403).send({ error: 'Please provide order product id' });
        return;
    }
    try {
        const time = new Date();
        const result = await Order.updateProductComment(userId, id, rating, comment, time.getTime());
        if (result.error) {
            res.status(403).send({ error: result.error });
            return;
        }
        res.status(200).send({ msg: 'Comment Updated' });
    } catch (error) {
        console.log(error);
        res.status(500).send({error: 'Internal Server Error'});
    }
};
// ======= discount by chris =====================

const discount = async (req,res) => {
    const category = req.params.category ? req.params.category : 'getuserdiscount';
    const { token } = req.query;
    async function discountResult(category) {
        switch(category) {
            case 'check':
                return await Order.discountCheck(token);
            case 'get':
                return await Order.getDiscount();
            case 'getdaily':
                return await Order.getDaily();
            case 'updatedaily':
                return await Order.updateDaily();
            case 'create':
                return await Order.createDiscount();
            case 'getuserdiscount': {
                const userId = req.profile.data.id;
                return await Order.getUserDiscount(userId);
            }
            case 'delexpired':
                return await Order.delDiscount();
            case 'usediscount':
                return await Order.useDiscount(token);
        }
        return Promise.resolve({});
    }
    try {
        const result = await discountResult(category);
        res.send(result);
    } catch (error) {
        console.log(error);
        res.status(500).send({error: 'Internal Server Error'});
    }
};

// =======================================================
module.exports = {
    checkout,
    getUserPayments,
    getUserOrders,
    updateProductComment,
    discount,
};