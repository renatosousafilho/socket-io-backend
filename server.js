const express = require('express');
const app = express();
const httpServer = require('http').createServer(app);

const io = require('socket.io')(httpServer, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

const users = require('./data');

app.set('view engine', 'ejs');

app.use('/', express.static(__dirname + '/assets'));

const currentUsers = [];

io.on('connect', (socket) => {
  console.log(`Novo usuário conectado: ${socket.id}`);

  io.emit('chat.updateUsers', currentUsers);

  socket.on('chat.addUser', ({ username, origin}) => {
    const data = users.find((u) => u.username === username);

    if (data) {
      const newUser = { socketId: socket.id, ...data };
      currentUsers.push(newUser);

      io.to(origin).emit('chat.currentUser', newUser);

      io.emit('chat.updateUsers', currentUsers);
    }
  })

  socket.on('message', (data) => {
    io.emit('message', data);
  })

  socket.on('private.message', ({ message, receiver, origin}) => {
    console.log(`${receiver} - ${origin}`);
    io.to(receiver).emit('private.message', { body: message, author: origin });
  });

  socket.on('disconnect', () => {
    const index = currentUsers.findIndex((user) => user.socketId === socket.id);
    if (index > 0) {
      console.log(`Desconectando usuário: ${socket.id}, ${currentUsers[index].username}`);
      currentUsers.splice(index, 1);
      io.emit('chat.updateUsers', currentUsers);
    }
    
  })

  socket.emit('pong', 'hello!')
});

app.get('/', (req, res) => {
  res.render('home/index', { users })
});

app.get('/chat/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find((u) => u.id == id);

  res.render('home/chat', { user });
});

httpServer.listen(3001, () =>  console.log('Lister in port 3001'));