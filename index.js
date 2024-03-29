// Setup basic express server
var express = require('express');
var cookieParser = require('socket.io-cookie');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
io.use(cookieParser);
users = [];

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

app.get('/send_message', function (req, res) {
    var username = req.query.username;
    var message = req.query.message;
    // 给广播发送
    io.of('/flask_socket').emit('my response', {data: message});
  //给某个房间发
	io.of('/flask_socket').in(username).emit('my response', {data: message});
	res.json({ status: 200, message: 'success'})
});

app.get('/get_users', function (req, res) {
  res.send(users)

});
io.of('/flask_socket').on('connection', function (socket) {
  var username = socket.request.headers.cookie.username;
  var role_id = socket.request.headers.cookie.role_id;
  socket.join(username);

  if(users.indexOf(username) == -1) {
            socket.user = username;
            users.push(socket.user);
        }

  if (role_id == '2' || role_id == '1'){
    socket.join('operator');
  }

  socket.on('my event', function (data) {
    socket.broadcast.emit('my response', {
      data: data.data
    })
  });

  socket.on('my broadcast event', function (data) {
    // 发送个人
    // socket.emit('my response', {
    //   data: data.data
    // });
    // 发送全部
    console.log(data);
    io.of('/flask_socket').emit('my response', {data: data.data});
    // socket.broadcast.emit('my response', {
    //   data: data.data
    // })
    
  });

  socket.on('join', function (data) {

    socket.join(data.room);    // 加入房间
    // 通知房间内人员
    socket.emit('my response', {
      data : 'In rooms' + data.room
    })
  });

  socket.on('leave', function (data) {
    socket.leave(data.room);
    socket.emit('my response', {
      data: 'leave room'
    })
  });

  socket.on('close room', function (data) {
    socket.emit('my response', {
      data: 'close room'
    });
    socket.close(data.room)
    
  });
  
  socket.on('my room event', function (data) {
    socket.broadcast.to(data.room).emit('my response', data);

  });
  
  socket.on('disconnect request', function (data) {
    if(!socket.user) return;
        users.splice(users.indexOf(socket), 1);
    socket.emit('my response', {
      data: 'Disconnected!'
    });
    socket.disconnect()
  });
});
