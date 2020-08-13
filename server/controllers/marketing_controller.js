const Cache = require('../../util/cache');
const {getProductsWithDetail} = require('./product_controller');
const Marketing = require('../models/marketing_model');
const Product = require('../models/product_model');
const CACHE_CAMPAIGN_KEY = 'cacheCampaigns';
const CACHE_HOT_KEY = 'cacheHots';
const {AUTHENTICATION_CODE, CLOUDFRONT} = process.env;

const createCampaign = async (req, res) => {
    const body = req.body;
    if (body.authentication_code != AUTHENTICATION_CODE) {
        res.status(401).send('Authentication code is wrong');
        return;
    }
    const image = req.files.main_image[0].filename;
    const campaign = {
        product_id: parseInt(body.product_id),
        picture: image,
        story: body.story
    };
    console.log(campaign);
    const campaignId = await Marketing.createCampaign(campaign);
    try {
        if (Cache.client.ready) {
            await Cache.del(CACHE_CAMPAIGN_KEY);
        }
    } catch (error) {
        console.error(`Delete campaign cache error: ${error}`);
    }
    res.send({campaignId});
};

const createHot = async (req, res) => {
    const body = req.body;
    if (body.authentication_code != AUTHENTICATION_CODE) {
        res.status(401).send('Authentication code is wrong');
        return;
    }
    const title = body.title;
    const productIds = body.product_ids.split(',');
    await Marketing.createHot(title, productIds);
    try {
        if (Cache.client.ready) {
            await Cache.del(CACHE_HOT_KEY);
        }
    } catch (error) {
        console.error(`Delete hot cache error: ${error}`);
    }
    res.status(200).send({status: 'OK'});
};

const getCampaigns = async (req, res) => {
    let cacheCampaigns;
    try {
        if (Cache.client.ready) {
            cacheCampaigns = await Cache.get(CACHE_CAMPAIGN_KEY);
        }
    } catch (e) {
        console.error(`Get campaign cache error: ${e}`);
    }

    if (cacheCampaigns) {
        console.log('Get campaign from cache');
        res.status(200).json({data: JSON.parse(cacheCampaigns)});
        return;
    }

    const campaigns = await Marketing.getCampaigns();
    campaigns.map(campaign => {
        return campaign.picture = `${CLOUDFRONT}/api-assets/${campaign.product_id}/${campaign.picture}`;
    });

    try {
        if (Cache.client.ready) {
            await Cache.set(CACHE_CAMPAIGN_KEY, JSON.stringify(campaigns));
        }
    } catch (e) {
        console.error(`Set campaign cache error: ${e}`);
    }

    res.status(200).json({data: campaigns});
};

const getHots = async (req, res) => {
    let cacheHots;
    try {
        if (Cache.client.ready) {
            cacheHots = await Cache.get(CACHE_HOT_KEY);
        }
    } catch (e) {
        console.error(`Get hot cache error: ${e}`);
    }

    if (cacheHots) {
        console.log('Get hot from cache');
        res.status(200).json({data: JSON.parse(cacheHots)});
        return;
    }

    const hots = await Marketing.getHots();
    const hots_with_detail = await Promise.all(hots.map(async (hot) => {
        const products = await Product.getHotProducts(hot.id);
        const products_with_detail = await getProductsWithDetail(products);
        return {
            title: hot.title,
            products: products_with_detail
        };
    }));

    try {
        if (Cache.client.ready) {
            await Cache.set(CACHE_HOT_KEY, JSON.stringify(hots_with_detail));
        }
    } catch (e) {
        console.error(`Set hot cache error: ${e}`);
    }

    res.status(200).json({data: hots_with_detail});
};

module.exports = {
    createCampaign,
    createHot,
    getCampaigns,
    getHots
};