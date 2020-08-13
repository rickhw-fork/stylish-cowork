require('dotenv');
const {assert, requester} = require('./set_up');
const {AUTHENTICATION_CODE} = process.env;
const {PORT} = process.env;
const {query} = require('../util/mysqlcon');
const sinon = require('sinon');

let stub1;
let stub2;

describe('marketing', () => {

    before(() => {
        const cache = require('../util/cache');

        // let cache do nothing
        stub1 = sinon.stub(cache, 'get').callsFake(() => {});
        stub2 = sinon.stub(cache, 'set').callsFake(() => {});
        stub2 = sinon.stub(cache, 'del').callsFake(() => {});
    });

    it('get campaign data', async () => {
        const res = await requester
            .get('/api/1.0/marketing/campaigns');

        const data = res.body.data;
        const expect =  [
            {
                'id': 1,
                'product_id': 1,
                'picture': '/assets/1/keyvisual.jpg',
                'story': '測試1'
            },
            {
                'id': 2,
                'product_id': 2,
                'picture': '/assets/2/keyvisual.jpg',
                'story': '測試2'
            },
            {
                'id': 3,
                'product_id': 3,
                'picture': '/assets/3/keyvisual.jpg',
                'story': '測試3'
            }
        ];
        assert.deepEqual(data, expect);
    });

    it('get hot data', async () => {
        const res = await requester
            .get('/api/1.0/marketing/hots');

        const data = res.body.data;
        assert.equal(data.length, 2);

        const hot1 = data[0];
        assert.equal(hot1.title, 'hot1');
        assert.equal(hot1.products.length, 3);

        const product1 = hot1.products[0];
        const expect = {
            id: 1,
            category: 'men',
            title: 'product1',
            description: 'Product 1',
            price: 100,
            texture: 'pt1',
            wash: 'pw1',
            place: 'pp1',
            note: 'pn1',
            story: 'ps1',
            colors: [ { code: 'FFFFFF', name: '白色' }, { code: 'DDFFBB', name: '亮綠' } ],
            sizes: [ 'S', 'M' ],
            variants: [
                { color_code: 'FFFFFF', size: 'S', stock: 2 },
                { color_code: 'FFFFFF', size: 'M', stock: 5 },
                { color_code: 'DDFFBB', size: 'S', stock: 2 }
            ],
            main_image: `http://127.0.0.1:${PORT}/assets/1/main.jpg`,
            images: [
                `http://127.0.0.1:${PORT}/assets/1/0.jpg`,
                `http://127.0.0.1:${PORT}/assets/1/1.jpg`,
                `http://127.0.0.1:${PORT}/assets/1/0.jpg`,
                `http://127.0.0.1:${PORT}/assets/1/1.jpg`
            ]
        };
        assert.deepEqual(product1, expect);
    });


    it('create hot data', async () => {
        await requester
            .post('/api/1.0/admin/hot')
            .send({
                title: 'new hots',
                product_ids: '1,2,3',
                authentication_code: AUTHENTICATION_CODE
            });

        const hots = await query('SELECT * FROM hot ORDER BY id DESC LIMIT 1');
        const products = await query('SELECT * FROM hot_product WHERE hot_id = ?', hots[0].id);
        assert.deepEqual(products.map(x => x.product_id), [1,2,3]);
    });

    it('create campaign', async () => {
        await requester
            .post('/api/1.0/admin/hot')
            .send({
                title: 'new hots',
                product_ids: '1,2,3',
                authentication_code: AUTHENTICATION_CODE
            });

        const hots = await query('SELECT * FROM hot ORDER BY id DESC LIMIT 1');
        const products = await query('SELECT * FROM hot_product WHERE hot_id = ?', hots[0].id);
        assert.deepEqual(products.map(x => x.product_id), [1,2,3]);
    });

    after(() => {
        stub1.restore();
        stub2.restore();
    });
});