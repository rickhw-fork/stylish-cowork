require('dotenv').config();
const {PORT_TEST, PORT, NODE_ENV, API_VERSION} = process.env;
const port = NODE_ENV == 'test' ? PORT_TEST : PORT;
const schedule = require('node-schedule');
const { popularityAutoUpdate } = require('./util/popularity_generator');
const discount = require('./server/models/order_model.js');

// Scheduled Task
schedule.scheduleJob('0 0 2 * * *', popularityAutoUpdate);
schedule.scheduleJob('0 0 0 * * *', discount.updateDaily);
schedule.scheduleJob('0 0 1 * * *', discount.delDiscount);

// Express Initialization
const express = require('express');
const bodyparser = require('body-parser');
const app = express();

// Socket.io Server Initialization
const server = require('http').createServer(app);
require('./util/socket').initChatRoom(server);

app.get('/chat', (req, res) => {
    res.redirect('/chatroom.html');
});

app.get('/server', (req, res) => {
    res.redirect('/admin/chatserver.html');
});

app.set('trust proxy', 'loopback');
app.set('json spaces', 2);

app.use(express.static('public'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended:true}));

// CORS Control
app.use('/api/', function(req, res, next){
	res.set('Access-Control-Allow-Origin', '*');
	res.set('Access-Control-Allow-Headers', 'Origin, Content-Type, Accept, Authorization');
	res.set('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
	res.set('Access-Control-Allow-Credentials', 'true');
	next();
});

// API routes
app.use('/api/' + API_VERSION,
    [
        require('./server/routes/admin_route'),
        require('./server/routes/product_route'),
        require('./server/routes/marketing_route'),
        require('./server/routes/user_route'),
        require('./server/routes/order_route'),
    ]
);

// Page not found
app.use(function(req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

// Error handling
app.use(function(err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

if (NODE_ENV != 'production'){
    //app.listen(port, () => { console.log(`Listening on port: ${port}`); });
    server.listen(port, () => {console.log(`Listening on port: ${port}`);});
}

module.exports = app;
