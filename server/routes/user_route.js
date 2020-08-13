const router = require('express').Router();
const {wrapAsync} = require('../../util/util');

const {
    signUp,
    signIn,
    validateUser,
    getUserProfile,
    addUserFavorite,
    deleteUserFavorite,
    getUserFavorites
} = require('../controllers/user_controller');

const {
    getUserOrders,
    updateProductComment
}= require('../controllers/order_controller');

router.route('/user/signup')
    .post(wrapAsync(signUp));

router.route('/user/signin')
    .post(wrapAsync(signIn));

router.route('/user/profile')
    .get(wrapAsync(validateUser), wrapAsync(getUserProfile));

router.route('/user/profile/orders/:status')
    .get(wrapAsync(validateUser), wrapAsync(getUserOrders));

router.route('/user/profile/orders/comment')
    .post(wrapAsync(validateUser), wrapAsync(updateProductComment));

router.route('/user/profile/favorites')
    .get(wrapAsync(validateUser), wrapAsync(getUserFavorites));

router.route('/user/favorite')
    .post(wrapAsync(validateUser), wrapAsync(addUserFavorite));

router.route('/user/favorite')
    .delete(wrapAsync(validateUser), wrapAsync(deleteUserFavorite));

module.exports = router;