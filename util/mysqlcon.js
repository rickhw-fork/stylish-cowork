require('dotenv').config();
const mysql = require('mysql');
const {promisify} = require('util'); // util from native nodejs library
const env = process.env.NODE_ENV || 'production';
const multipleStatements = (process.env.NODE_ENV === 'test');
const {LOCAL_DB_HOST,LOCAL_DB_USERNAME,LOCAL_DB_PASSWORD, DB_HOST, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_DATABASE_TEST} = process.env;

const mysqlConfig = {
    production: { // for EC2 machine
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE
    },
    development: { // for localhost development
        host: DB_HOST,
        user: DB_USERNAME,
        password: DB_PASSWORD,
        database: DB_DATABASE
    },
    test: { // for automation testing (command: npm run test)
        host: LOCAL_DB_HOST,
        user: LOCAL_DB_USERNAME,
        password: LOCAL_DB_PASSWORD,
        database: DB_DATABASE_TEST
    }
};

const mysqlCon = mysql.createConnection(mysqlConfig[env], {multipleStatements});

const promiseQuery = (query, bindings) => {
    return promisify(mysqlCon.query).bind(mysqlCon)(query, bindings);
};

const promiseTransaction = promisify(mysqlCon.beginTransaction).bind(mysqlCon);
const promiseCommit = promisify(mysqlCon.commit).bind(mysqlCon);
const promiseRollback = promisify(mysqlCon.rollback).bind(mysqlCon);
const promiseEnd = promisify(mysqlCon.end).bind(mysqlCon);

module.exports={
	core: mysql,
    query: promiseQuery,
    transaction: promiseTransaction,
    commit: promiseCommit,
    rollback: promiseRollback,
    end: promiseEnd,
};