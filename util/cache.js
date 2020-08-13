require('dotenv').config();
const {promisify} = require('util'); // util from native nodejs library
const redis = require('redis');
const { LOCAL_REDIS_HOST, REDIS_HOST, REDIS_PORT, REDIS_ENV, NODE_ENV } = process.env;
const host = REDIS_ENV === 'local' ? LOCAL_REDIS_HOST : REDIS_HOST;
const redisClient = redis.createClient({host, port : REDIS_PORT});

redisClient.on('ready',function() {
    console.log('Redis is ready');
});

redisClient.on('error',function() {
    if (process.env.NODE_ENV == 'production') {
        console.log('Error in Redis');
    }
});

const get = promisify(redisClient.get).bind(redisClient);
const set = promisify(redisClient.set).bind(redisClient);
const del = promisify(redisClient.del).bind(redisClient);

module.exports = {
    client: redisClient,
    get,
    set,
    del
};

