const _ = require('lodash');
//const util = require('../../util/util');
const Product = require('../models/product_model');
const pageSize = 6;
const {AUTHENTICATION_CODE, CLOUDFRONT} = process.env;

const createProduct = async (req, res) => {
    const body = req.body;

    if (body.authentication_code != AUTHENTICATION_CODE) {
        res.status(401).send('Authentication code is wrong');
        return;
    }

    const product = {
        id: body.product_id,
        category: body.category,
        title: body.title,
        description: body.description,
        price: body.price,
        texture: body.texture,
        wash: body.wash,
        place: body.place,
        note: body.note,
        story: body.story,
        create_at: Date.now(),
        tag: body.tag,
        popularity_weight: body.popularity_weight
    };
    product.main_image = req.files.main_image[0].filename;
    product.images = req.files.other_images.map(img => img.filename).join(',');

    const colorCodes = body.color_codes.split(',');
    const colorNames = body.color_names.split(',');
    const sizes = body.sizes.split(',');

    let variants = sizes.flatMap((size) => {
        return colorCodes.map((color_code, i) => {
            return [
                color_code,
                colorNames[i],
                size,
                Math.round(Math.random()*10),
                product.id
            ];
        });
    });

    const productId = await Product.createProduct(product, variants);
    res.status(200).send({productId});
};

const getProducts = async (req, res) => {
    const category = req.params.category;
    const paging = parseInt(req.query.paging) || 0;

    // chris make =====
    const sort = req.query.sort;
    const order = req.query.order;
    // chris end=====
    async function findProduct(category) {
        switch (category) {
            case 'all':
                return await Product.getProducts(pageSize, paging, {sort, order});
            case 'men': case 'women': case 'accessories':
                return await Product.getProducts(pageSize, paging, {category, sort, order});
            case 'search': {
                const keyword = req.query.keyword;
                if (keyword) {
                    return await Product.getProducts(pageSize, paging, {keyword,sort, order});
                }
                break;
            }
            case 'hot': {
                return await Product.getProducts(null, null, {category});
            }
            case 'details': {
                const id = parseInt(req.query.id);
                if (Number.isInteger(id)) {
                    return await Product.getProducts(pageSize, paging, {id});
                }
            }
        }
        return Promise.resolve({});
    }

    const {products, productCount} = await findProduct(category);
    // console.log({products, productCount});
    if (!products) {
        res.status(400).send({error:'Wrong Request'});
        return;
    }

    if (products.length == 0) {
        if (category === 'details') {
            res.status(200).json({data: null});
        } else {
            res.status(200).json({data: []});
        }
        return;
    }

    let productsWithDetail = await getProductsWithDetail(products);

    if (category == 'details') {
        productsWithDetail = productsWithDetail[0];
        const id = productsWithDetail.id;
        const comments = await Product.getProductsComments(id);
        if (comments.length > 0) {
            productsWithDetail.comments = comments.filter( c => c.comment || c.rating ).map(c => ({
                user: c.name,
                variant: {
                    color_name: c.color_name,
                    color_code: c.color_code,
                    size: c.size,
                },
                quantity: c.quantity,
                rating: c.rating,
                comment: c.comment,
                comment_time: c.comment_time
            }));
        } else {
            productsWithDetail.comments = [];
        }
        if (productsWithDetail.tag) {
            const tag = productsWithDetail.tag;
            const similarProducts = await Product.getProducts(pageSize, paging, { id, tag });
            if (similarProducts.products.length > 0) {
                const similarProductsWithDetails = await getProductsWithDetail(similarProducts.products);
                productsWithDetail.similar_products = similarProductsWithDetails;
            } else {
                productsWithDetail.similar_products = [];
            }
        }
    }

    const result = (productCount > (paging + 1) * pageSize) ? {
        data: productsWithDetail,
        next_paging: paging + 1
    } : {
        data: productsWithDetail,
    };
    res.status(200).json(result);
};

const getProductsWithDetail = async (products) => {
    const productIds = products.map(p => p.id);
    const variants = await Product.getProductsVariants(productIds);
    const variantsMap = _.groupBy(variants, v => v.product_id); //use lodash transform variants

    return products.map((p) => {
        p.main_image = p.main_image ? CLOUDFRONT + '/api-assets/' + p.id + '/' + p.main_image : null;
        p.images = p.images ? p.images.split(',').map(img => CLOUDFRONT + '/api-assets/' + p.id + '/' + img) : null;

        const productVariants = variantsMap[p.id];
        if (productVariants) {
            // console.log('productVariants: ', productVariants);
            p.variants = productVariants.map(v => ({
                color_code: v.color_code,
                size: v.size,
                stock: v.stock,
            }));
            // console.log('p.variants: ', p.variants);
            const allColors = productVariants.map(v => ({
                code: v.color_code,
                name: v.color_name,
            }));
            p.colors = _.uniqBy(allColors, c => c.code);

            const allSizes = productVariants.map(v => v.size);
            p.sizes = _.uniq(allSizes);
        }
        return p;
    });
};

module.exports = {
    createProduct,
    getProductsWithDetail,
    getProducts,
};