require('dotenv').config();
const validator = require('validator');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const got = require('got');
const {query, transaction, commit, rollback} = require('../../util/mysqlcon.js');
const salt = parseInt(process.env.BCRYPT_SALT);

const signUp = async (name, email, password, expire) => {
    try {
        await transaction();

        const emails = await query('SELECT email FROM user WHERE email = ? FOR UPDATE', [email]);
        if (emails.length > 0){
            await commit();
            return {error: 'Email Already Exists'};
        }

        const loginAt = new Date();
        const sha = crypto.createHash('sha256');
        sha.update(email + password + loginAt);
        const accessToken = sha.digest('hex');
        const user = {
            provider: 'native',
            email: email,
            password: bcrypt.hashSync(password, salt),
            name: name,
            picture: null,
            access_token: accessToken,
            access_expired: expire,
            login_at: loginAt
        };
        const queryStr = 'INSERT INTO user SET ?';

        const result = await query(queryStr, user);
        user.id = result.insertId;

        await commit();
        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};

const nativeSignIn = async (email, password, expire) => {
    try {
        await transaction();

        const users = await query('SELECT * FROM user WHERE email = ?', [email]);
        const user = users[0];
        if (!user) {
            await commit();
            return { error: 'Email not exsit, Try to sugn up.' };
        }

        if (!bcrypt.compareSync(password, user.password)){
            await commit();
            return {error: 'Password is wrong'};
        }

        const loginAt = new Date();
        const sha = crypto.createHash('sha256');
        sha.update(email + password + loginAt);
        const accessToken = sha.digest('hex');

        const queryStr = 'UPDATE user SET access_token = ?, access_expired = ?, login_at = ? WHERE id = ?';
        await query(queryStr, [accessToken, expire, loginAt, user.id]);

        await commit();

        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};

const facebookSignIn = async (id, name, email, accessToken, expire) => {
    try {
        await transaction();

        const loginAt = new Date();
        let user = {
            provider: 'facebook',
            email: email,
            name: name,
            picture:'https://graph.facebook.com/' + id + '/picture?type=large',
            access_token: accessToken,
            access_expired: expire,
            login_at: loginAt
        };

        const users = await query('SELECT id FROM user WHERE email = ? AND provider = \'facebook\' FOR UPDATE', [email]);
        let userId;
        if (users.length === 0) { // Insert new user
            const queryStr = 'insert into user set ?';
            const result = await query(queryStr, user);
            userId = result.insertId;
        } else { // Update existed user
            userId = users[0].id;
            const queryStr = 'UPDATE user SET access_token = ?, access_expired = ?, login_at = ?  WHERE id = ?';
            await query(queryStr, [accessToken, expire, loginAt, userId]);
        }
        user.id = userId;

        await commit();

        return {accessToken, loginAt, user};
    } catch (error) {
        await rollback();
        return {error};
    }
};

const getUserProfile = async (accessToken) => {
    const results = await query('SELECT * FROM user WHERE access_token = ?', [accessToken]);
    if (results.length === 0) {
        return {error: 'Invalid Access Token'};
    } else {
        return {
            data:{
                id: results[0].id,
                provider: results[0].provider,
                name: results[0].name,
                email: results[0].email,
                picture: results[0].picture
            }
        };
    }
};

const getUserProfileWithChatHistory = async (accessToken) => {
    const results = await query('SELECT * FROM user WHERE access_token = ?', [accessToken]);
    if (results.length === 0) {
        return { error: 'Invalid Access Token' };
    } else {
        const history = results[0].chat_history ? JSON.parse(results[0].chat_history).history : [];
        return {
            data: {
                id: results[0].id,
                provider: results[0].provider,
                name: results[0].name,
                email: results[0].email,
                picture: results[0].picture,
                history
            }
        };
    }
};

const storeUserChatHistory = async (user) => {
    const sql = 'UPDATE user SET chat_history = ? WHERE id = ?';
    const history = validator.blacklist(JSON.stringify({ history: user.history }), '<>');
    await query(sql, [history, user.id]);
};

const getFacebookProfile = async function(accessToken){
    try {
        let res = await got('https://graph.facebook.com/me?fields=id,name,email&access_token=' + accessToken, {
            responseType: 'json'
        });
        return res.body;
    } catch (e) {
        console.log(e);
        throw('Permissions Error: facebook access token is wrong');
    }
};

const addUserFavorite = async function (userId, productId) {
    try {
        const create_at = Date.now();
        const sql = `INSERT INTO user_favorite (user_id, product_id, create_at) VALUES ? 
                    ON DUPLICATE KEY UPDATE create_at = VALUES(create_at)`;
        const bindings = [userId, productId, create_at];
        await query(sql, [[bindings]]);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};

const deleteUserFavorite = async function (userId, productId) {
    try {
        const sql = 'DELETE FROM user_favorite WHERE user_id = ? AND product_id = ?';
        const bindings = [userId, productId];
        await query(sql, bindings);
        return true;
    } catch (e) {
        console.log(e);
        return false;
    }
};

const getUserFavorites = async function (userId) {
    const sql = `SELECT p.*,  uf.create_at AS add_favorite_at
                    FROM user_favorite AS uf
                    INNER JOIN product AS p ON uf.product_id = p.id
                    WHERE uf.user_id = ? ORDER BY add_favorite_at DESC`;
    const bindings = [userId];
    const results = await query(sql, bindings);
    return results;
};

module.exports = {
    signUp,
    nativeSignIn,
    facebookSignIn,
    getUserProfile,
    getFacebookProfile,
    addUserFavorite,
    deleteUserFavorite,
    getUserFavorites,
    getUserProfileWithChatHistory,
    storeUserChatHistory
};