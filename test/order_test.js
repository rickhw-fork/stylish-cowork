const _ = require('lodash');
const {assert, requester} = require('./set_up');
const {users} = require('./fake_data');
const {query} = require('../util/mysqlcon');
const sinon = require('sinon');
let stub;

const user1 = users[0];
const user = {
    provider: user1.provider,
    email: user1.email,
    password: user1.password
};
let accessToken;
let userId;

const VALID_PRIME = 'valid prime';
const INVALID_PRIME = 'invalid prime';
const INVALID_PRIME_ERROR = 'invalid prime error';
const orderData = {
    prime: VALID_PRIME,
    order: {
        shipping: 'delivery',
        payment: 'credit_card',
        recipient: {
            name: 'test',
            phone: '0912345678',
            email: 'test@gmail.com',
            address: 'testaddress',
            time: 'anytime'
        },
        list:  [{
            id: 1,
            qty: 1,
            name: '前開衩扭結洋裝',
            size: 'S',
            color: {code: 'FFFFFF', name: '白色'},
            price: 1000,
            stock: 2,
            main_image: 'https://test/1/main.jpg'
        }],
        subtotal: 1000,
        freight: 60,
        total: 1060
    }
};

const fakeTappayResponse = {
    status: 0,
    msg: 'Success',
    amount: 8056,
    acquirer: 'TW_CTBC',
    currency: 'TWD',
    rec_trade_id: 'D20200210eKvZyv',
    bank_transaction_id: 'TP20200210eKvZyv',
    order_number: '',
    auth_code: '132481',
    card_info: {
        issuer: '',
        funding: 0,
        type: 1,
        level: '',
        country: 'UNITED KINGDOM',
        last_four: '4242',
        bin_code: '424242',
        issuer_zh_tw: '',
        bank_id: '',
        country_code: 'GB'
    },
    transaction_time_millis: 1581325720207,
    bank_transaction_time: {
        start_time_millis: '1581325720251',
        end_time_millis: '1581325720251'
    },
    bank_result_code: '',
    bank_result_msg: '',
    card_identifier: 'dee921560b074be7a860a6b44a80c21b',
    merchant_id: 'AppWorksSchool_CTBC'
};

describe('order', () => {

    before(async () => {
        const res = await requester
            .post('/api/1.0/user/signin')
            .send(user);

        const data = res.body.data;
        userId = data.user.id;
        accessToken = data.access_token;

        const orderModel = require('../server/models/order_model');
        const fakePayOrderByPrime = (tappayKey, prime, order) => {
            return new Promise((resolve, reject) => {
                if (prime === VALID_PRIME) {
                    resolve(fakeTappayResponse);
                } else {
                    reject(INVALID_PRIME_ERROR);
                }
            });
        };
        stub = sinon.stub(orderModel, 'payOrderByPrime').callsFake(fakePayOrderByPrime);
    });

    it('checkout order with invalid data', async () => {
        const res = await requester
            .post('/api/1.0/order/checkout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({});

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, 'Create Order Error: Wrong Data Format');
    });

    it('checkout order with invalid prime', async () => {
        const invalidOrderData = _.cloneDeep(orderData);
        invalidOrderData.prime = INVALID_PRIME;
        const res = await requester
            .post('/api/1.0/order/checkout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(invalidOrderData);

        assert.equal(res.statusCode, 400);
        assert.equal(res.body.error, INVALID_PRIME_ERROR);
    });

    it('checkout order with valid data and user', async () => {
        const res = await requester
            .post('/api/1.0/order/checkout')
            .set('Authorization', `Bearer ${accessToken}`)
            .send(orderData);

        const orderNumber = res.body.data.number;

        const insertedOrders = await query('SELECT * FROM order_table WHERE number = ?', [orderNumber]);
        const insertedOrder = insertedOrders[0];

        assert.equal(insertedOrder.number, orderNumber);
        assert.equal(insertedOrder.status, 0);
        assert.equal(insertedOrder.user_id, userId);
        assert.deepEqual(JSON.parse(insertedOrder.details), orderData.order);
        assert.closeTo(insertedOrder.time, Date.now(), 1000);

        const insertedPayments = await query('SELECT * FROM payment WHERE order_id = ?', [insertedOrder.id]);
        const insertedPayment = insertedPayments[0];

        assert.deepEqual(JSON.parse(insertedPayment.details), fakeTappayResponse);
    });

    it('checkout order without login should be ok', async () => {
        const res = await requester
            .post('/api/1.0/order/checkout')
            .send(orderData);

        const orderNumber = res.body.data.number;
        const insertedOrders = await query('SELECT * FROM order_table WHERE number = ?', [orderNumber]);
        const insertedOrder = insertedOrders[0];

        assert.equal(insertedOrder.number, orderNumber);
        assert.isNull(insertedOrder.user_id);
    });

    after(() => {
        stub.restore();
    });
});