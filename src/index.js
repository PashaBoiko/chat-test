const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");

const { generateMessage, generateLocationMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000 || env.port;

const publicFolderPath = path.join(__dirname, '../public');

app.use(express.static(publicFolderPath));

app.get("/", (req, res) => {
   res.send("Hello word");
});

io.on('connection', (socket) => {
   console.log('new Websocket connection');

   socket.on('join', ({ username, room }, callback) => {
      const { error, user } = addUser({id: socket.id, username, room});

      if (error) {
         return callback(error);
      }

      socket.join(user.room);

      socket.emit('message', generateMessage('Admin','Welcome!'));
      socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`));
      io.to(user.room).emit('roomData', {
         room: user.room,
         users: getUsersInRoom(user.room),
      });
      callback();
   });

   socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id);

      if (user) {
         io.to(user.room).emit('message', generateMessage(user.username, message));
         callback('Delivered');
      }
   });

   socket.on('sendLocation', (message, callBack) => {
      const user = getUser(socket.id);

      if (user) {
         io.to(user.room).emit(
             'locationMessage',
             generateLocationMessage(user.username, `https://google.com/maps?q=${message.lat},${message.long}`)
         );
         callBack('Location shared!');
      }
   });

   socket.on('disconnect', () => {
      const user = removeUser(socket.id);

      if (user) {
         io.to(user.room).emit('message', generateMessage('Admin',`The ${user.username} has left`));
         io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
         });
      }
   })
});

server.listen(PORT, () => {
   console.log("Server is listened by port ", PORT);
});