const User = require('../server/models/user_model');
let serviceOnline = false;
const onlineUsers = [];
let service = { id: 0 };

const initChatRoom = (server) => {
  const io = require('socket.io')(server);
  io.on('connection', (socket) => {
    let localUser = null;
    socket.on('server connect', async ({ serverToken }) => {
      const socketId = socket.id;
      if (serviceOnline) {
        io.to(socketId).emit('server connect', { msg:'其他客服已上線' });
      } else {
        serviceOnline = true;
        service.socketId = socket.id;
        io.to(socketId).emit('server connect', { service, onlineUsers, msg:'已成功上線' });
      }
    });

    socket.on('user connect', async ({ userToken }) => {
      if (userToken) {
        const result = await User.getUserProfileWithChatHistory(userToken);
        if (!result.error) {
          localUser = result.data;
        } else {
          localUser = {};
          localUser.history = [];
          localUser.name = '顧客';
          localUser.id = 'Random' + Math.floor(Math.random() * 1000);
        }
      } else {
        localUser = {};
        localUser.history = [];
        localUser.name = '顧客';
        localUser.id = 'Random' + Math.floor(Math.random() * 1000);
      }
      localUser.socketId = socket.id;
      let exist = false;
      for (let u of onlineUsers) {
        if (u !== null) {
          if (u.id === localUser.id) {
            u = localUser;
            exist = true;
            return ;
          }
        }
      }
      if (!exist) {
        onlineUsers.push(localUser);
      }
      io.to(localUser.socketId).emit('user connect', { user: localUser, service });
      io.to(localUser.socketId).emit('chat message', {
      send: service, receive: localUser, msg: localUser.name + ' 你好'});
      io.to(localUser.socketId).emit('chat message', {
        send: service, receive: localUser, msg: '客服正在趕來的路上請稍候...'
      });
      if (localUser.name == '顧客') {
        io.to(localUser.socketId).emit('chat message', {
          send: service, receive: localUser, msg: '登入後能儲存聊天訊息喔！！'
        });
      }

      if (serviceOnline) {
        io.to(service.socketId).emit('user connect', { onlineUsers });
      }
    });

    socket.on('chat message', ({ send, receive , msg }) => {
      //傳送用戶自己的訊息給他
      if (serviceOnline){
        if (socket.id === service.socketId) {
          onlineUsers.map((u) => {
            if ( u !== null) {
              if (u.id === receive.id) {
                u.history.push({ send: send.id, receive: receive.id, msg });
              }
            }
          });
          io.to(receive.socketId).emit('chat message', { send, receive, msg });
          io.to(send.socketId).emit('chat message', { send, receive, msg });
        }
      }
      if (localUser !== null) {
        if (socket.id === localUser.socketId) {
          localUser.history.push({ send: send.id, receive: receive.id, msg });
          io.to(localUser.socketId).emit('chat message', { send, receive, msg });
          //傳送訊息給Service
          if (serviceOnline) {
            io.to(service.socketId).emit('chat message', { send, receive, msg });
          }
        }
      }
    });

    socket.on('disconnect', async () => {
      if (localUser !== null) {
        if (localUser.provider) {
          await User.storeUserChatHistory(localUser);
        }
        for (let key in onlineUsers) {
          if (onlineUsers[key] !== null) {
            if (onlineUsers[key].id === localUser.id) {
              onlineUsers[key] = null;
              break;
            }
          }
        }
        io.to(service.socketId).emit('user disconnect', { onlineUsers });
      }
      if (service.socketId === socket.id) {
        service.socketId = null;
        serviceOnline = false;
      }
    });
  });
};

module.exports = {
  initChatRoom
};