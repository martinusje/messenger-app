var server = require('http').createServer();
var io = require('socket.io')(server);
//var redis = require("redis"),
//    client = redis.createClient();
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./MAPP.db');

server.listen(3000);
console.log('listening on port 3000');

require('socketio-auth')(io, {
  authenticate: function (socket, data, callback) {
    //get credentials sent by the client 
    var username = data.username;
    var password = data.password;
    
    db.all("SELECT * FROM userInfo WHERE usr='"+username+"'", function(err,rows){
	if(rows.length == 0) {
	    return callback(new Error("User not found"));
	} else {
      	    return callback(null, rows[0].pwd == password);
	}
    });
  },
  postAuthenticate: function (socket, data) {
    var username = data.username;
    db.all("SELECT * FROM userInfo WHERE usr='"+username+"'", function(err,rows){
      socket.client.user = rows[0].usr;
      console.log(socket.client.user + ' is connected!');

    });
  }
});

io.sockets.on('connection', function (socket) {
    console.log('socket connected');

    socket.on('timeSinceUpdate', function(data) {
	
	if (data != db.all("SELECT time FROM messages WHERE msg = 'timeSinceUpdate'", [], function(err, row) {row[0].time})) {
	    if (data) {
	        db.all("SELECT * FROM messages WHERE msg IS NOT 'timeSinceUpdate' AND time > " + data + ".0 AND time != " + data, function (err, row) {
		    socket.emit('messagesUpdate', row);
	        });
	        //send messages since data/time
	    } else {
	        db.all("SELECT * FROM messages WHERE msg IS NOT 'timeSinceUpdate'", function (err, row) {
		if(err) {console.log(err)}
		    socket.emit('messagesUpdate', row);
	        });
		
	    }
	} 
    });

    socket.on('disconnect', function () {
        console.log('socket disconnected');
    });

    socket.on('msg', function(message) {
        console.log(message);
	db.serialize(function() {
		var stmt = db.prepare("INSERT INTO messages (time, msg, usr) VALUES (?,?,?)");
		stmt.run(message.time, message.msg, message.username);
		stmt.finalize();
		
	});
	db.run("UPDATE messages SET time = ? WHERE msg = 'timeSinceUpdate'", [message.time], function(err, row) {
		if (err) {
			console.log(err);
		}
	});
	io.sockets.emit('msg', {msg : message.msg, username: message.username, time : message.time});
    });
});
