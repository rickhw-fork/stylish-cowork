const users = [
    {
        provider: 'native',
        email: 'test1@gmail.com',
        password: 'test1password',
        name: 'test1',
        picture: null,
        access_token: 'test1accesstoken',
        access_expired: (60*60), // 1hr by second
        login_at: new Date('2020-01-01')
    },
    {
        provider: 'facebook',
        email: 'test2@gmail.com',
        password: null,
        name: 'test2',
        picture: 'https://graph.facebook.com/1/picture?type=large',
        access_token: 'test2accesstoken',
        access_expired: (60*60), // 1hr by second
        login_at: new Date('2020-01-01')
    },
    {
        provider: 'native',
        email: 'test3@gmail.com',
        password: 'test3passwod',
        name: 'test3',
        picture: null,
        access_token: 'test3accesstoken',
        access_expired: 0,
        login_at: new Date('2020-01-01')
    },
];

const products = [
    {
        category: 'men',
        title: 'product1',
        description: 'Product 1',
        price: 100,
        texture: 'pt1',
        wash: 'pw1',
        place: 'pp1',
        note: 'pn1',
        story: 'ps1',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'women',
        title: 'product2',
        description: 'Product 2',
        price: 200,
        texture: 'pt2',
        wash: 'pw2',
        place: 'pp2',
        note: 'pn2',
        story: 'ps2',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'product3',
        description: 'Product 3',
        price: 300,
        texture: 'pt3',
        wash: 'pw3',
        place: 'pp3',
        note: 'pn3',
        story: 'ps3',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'accessories',
        title: 'product4',
        description: 'Product 4',
        price: 400,
        texture: 'pt4',
        wash: 'pw4',
        place: 'pp4',
        note: 'pn4',
        story: 'ps4',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'accessories',
        title: 'product5',
        description: 'Product 5',
        price: 500,
        texture: 'pt5',
        wash: 'pw5',
        place: 'pp5',
        note: 'pn5',
        story: 'ps5',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'accessories',
        title: 'product6',
        description: 'Product 6',
        price: 600,
        texture: 'pt6',
        wash: 'pw6',
        place: 'pp6',
        note: 'pn6',
        story: 'ps6',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'women',
        title: 'product7',
        description: 'Product 7',
        price: 700,
        texture: 'pt7',
        wash: 'pw7',
        place: 'pp7',
        note: 'pn7',
        story: 'ps7',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'product8',
        description: 'Product 8',
        price: 800,
        texture: 'pt8',
        wash: 'pw8',
        place: 'pp8',
        note: 'pn8',
        story: 'ps8xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'product9',
        description: 'Product 9',
        price: 900,
        texture: 'pt9',
        wash: 'pw9',
        place: 'pp9',
        note: 'pn9',
        story: 'ps9xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'test searchkey product10',
        description: 'Product 10',
        price: 1000,
        texture: 'pt10',
        wash: 'pw10',
        place: 'pp10',
        note: 'pn10',
        story: 'ps10xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'test searchkey product11',
        description: 'Product 11',
        price: 1100,
        texture: 'pt11',
        wash: 'pw11',
        place: 'pp11',
        note: 'pn11',
        story: 'ps11xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'test searchkey product12',
        description: 'Product 12',
        price: 1200,
        texture: 'pt12',
        wash: 'pw12',
        place: 'pp12',
        note: 'pn12',
        story: 'ps12xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'test searchkey product13',
        description: 'Product 13',
        price: 1300,
        texture: 'pt13',
        wash: 'pw13',
        place: 'pp13',
        note: 'pn13',
        story: 'ps13xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
    {
        category: 'men',
        title: 'test searchkey product14',
        description: 'Product 14',
        price: 1400,
        texture: 'pt14',
        wash: 'pw14',
        place: 'pp14',
        note: 'pn14',
        story: 'ps14xwxw',
        main_image: 'main.jpg',
        images: '0.jpg,1.jpg,0.jpg,1.jpg'
    },
];

const variants = [
    {
        color_code: 'FFFFFF',
        color_name: '白色',
        size: 'S',
        stock: 2,
        product_id: 1,
    },
    {
        color_code: 'FFFFFF',
        color_name: '白色',
        size: 'M',
        stock: 5,
        product_id: 1,
    },
    {
        color_code: 'DDFFBB',
        color_name: '亮綠',
        size: 'S',
        stock: 2,
        product_id: 1,
    },
    {
        color_code: 'FFFFFF',
        color_name: '白色',
        size: 'S',
        stock: 2,
        product_id: 2,
    },
    {
        color_code: 'DDFFBB',
        color_name: '亮綠',
        size: 'L',
        stock: 2,
        product_id: 2,
    },
];

const hots = [
    {
        title: 'hot1'
    },
    {
        title: 'hot2'
    }
];

const hot_products = [
    {
        hot_id: 1,
        product_id: 1
    },
    {
        hot_id: 1,
        product_id: 2
    },
    {
        hot_id: 1,
        product_id: 3
    },
    {
        hot_id: 2,
        product_id: 1
    },
    {
        hot_id: 2,
        product_id: 4
    },
];

const campaigns = [
    {
        product_id: 1,
        picture: 'keyvisual.jpg',
        story: '測試1'
    },
    {
        product_id: 2,
        picture: 'keyvisual.jpg',
        story: '測試2'
    },
    {
        product_id: 3,
        picture: 'keyvisual.jpg',
        story: '測試3'
    }
];

module.exports = {
    users,
    products,
    variants,
    hots,
    hot_products,
    campaigns,
};