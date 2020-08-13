require('dotenv');
const {assert, requester} = require('./set_up');
const {PORT} = process.env;

describe('products', async () => {
    it('select all products without setting page', async () => {
        const res = await requester
            .get('/api/1.0/products/all');

        const next_paging = res.body.next_paging;
        const data = res.body.data;

        assert.equal(next_paging, 1);
        assert.equal(data.length, 6);

        const product2Expect = {
            id: 2,
            category: 'women',
            title: 'product2',
            description: 'Product 2',
            price: 200,
            texture: 'pt2',
            wash: 'pw2',
            place: 'pp2',
            note: 'pn2',
            story: 'ps2',
            colors: [ { code: 'FFFFFF', name: '白色' }, { code: 'DDFFBB', name: '亮綠' } ],
            sizes: [ 'S', 'L' ],
            variants: [
                { color_code: 'FFFFFF', size: 'S', stock: 2 },
                { color_code: 'DDFFBB', size: 'L', stock: 2 }
            ],
            main_image: `http://127.0.0.1:${PORT}/assets/2/main.jpg`,
            images: [
                `http://127.0.0.1:${PORT}/assets/2/0.jpg`,
                `http://127.0.0.1:${PORT}/assets/2/1.jpg`,
                `http://127.0.0.1:${PORT}/assets/2/0.jpg`,
                `http://127.0.0.1:${PORT}/assets/2/1.jpg`
            ]
        };

        assert.deepStrictEqual(data[1], product2Expect);
    });

    it('select all products at page 2', async () => {
        const res = await requester
            .get('/api/1.0/products/all?paging=2');

        const next_paging = res.body.next_paging;
        const data = res.body.data;

        assert.equal(next_paging, null);
        assert.equal(data.length, 2);
        assert.equal(data[0].id, 13);
        assert.equal(data[0].title, 'test searchkey product13');
    });

    it('select products with wrong parameter', async () => {
        // men
        const res = await requester
            .get('/api/1.0/products/wrong_parameter');

        assert.equal(res.status, 400);
        assert.deepEqual(JSON.parse(res.text), { error: 'Wrong Request' });
    });

    it('select products with category', async () => {
        // men
        const res1 = await requester
            .get('/api/1.0/products/men');

        const data1 = res1.body.data;
        assert.equal(data1.length, 6);
        assert.equal(data1[0].category, 'men');

        // men page 1
        const res2 = await requester
            .get('/api/1.0/products/men?paging=1');

        const data2 = res2.body.data;
        assert.equal(data2.length, 3);
        assert.equal(data2[0].category, 'men');

        // women
        const res3 = await requester
            .get('/api/1.0/products/women');

        const data3 = res3.body.data;
        assert.equal(data3.length, 2);
        assert.equal(data3[0].category, 'women');

        // accessories
        const res4 = await requester
            .get('/api/1.0/products/accessories');

        const data4 = res4.body.data;
        assert.equal(data4.length, 3);
        assert.equal(data4[0].category, 'accessories');
    });

    it('select products with search key', async () => {
        const res = await requester
            .get('/api/1.0/products/search?keyword=searchkey');

        const data = res.body.data;

        assert.equal(data.length, 5);
        assert.equal(data[0].id, 10);
        assert.equal(data[0].title, 'test searchkey product10');
    });

    it('select products with search key which have no data', async () => {
        const res = await requester
            .get('/api/1.0/products/search?keyword=nodatakey');

        const data = res.body.data;

        assert.equal(data.length, 0);
    });

    it('select product detail', async () => {
        const res = await requester
            .get('/api/1.0/products/details?id=1');

        const data = res.body.data;

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

        assert.deepStrictEqual(data, expect);
    });

    it('select product detail with id which can not find data', async () => {
        const res = await requester
            .get('/api/1.0/products/details?id=0');

        assert.equal(res.status, 200);

        const body = res.body;
        assert.deepEqual(body, {data: null});
    });

    it('select product detail with id which is not integer', async () => {
        const res = await requester
        .get('/api/1.0/products/details?id=aaa');

        assert.equal(res.status, 400);

        const error = res.body.error;
        assert.equal(error, 'Wrong Request');
    });
});
