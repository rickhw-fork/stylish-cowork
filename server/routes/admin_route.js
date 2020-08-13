const router = require('express').Router();
const {upload} = require('../../util/util');

const cpUpload = upload.fields([
    { name: 'main_image', maxCount: 1 },
    { name: 'other_images', maxCount: 3 }
]);

const {
    createProduct,
} = require('../controllers/product_controller');

const {
    createCampaign,
    createHot
} = require('../controllers/marketing_controller');

router.route('/admin/product')
    .post(cpUpload, createProduct);

router.route('/admin/campaign')
    .post(cpUpload, createCampaign);

router.route('/admin/hot')
    .post(createHot);

module.exports = router;