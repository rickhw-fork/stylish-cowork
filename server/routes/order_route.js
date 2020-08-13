const router = require('express').Router();
const {wrapAsync} = require('../../util/util');

const {
    checkout,
    getUserPayments,
    discount
} = require('../controllers/order_controller');

const {
    validateUser,
} = require('../controllers/user_controller');

router.route('/order/checkout')
    .post(wrapAsync(checkout));

// For load testing (Not in API Docs)
router.route('/order/payments')
    .get(wrapAsync(getUserPayments));

// discount
router.route('/order/discount/getuserdiscount')
    .get(wrapAsync(validateUser),wrapAsync(discount));

router.route('/order/discount/:category')
    .get(wrapAsync(discount));


module.exports = router;