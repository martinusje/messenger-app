// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
        StatusBar.show();

        //Get date
        var date = new Date();

        //Open DB
        var db = window.sqlitePlugin.openDatabase({ name: 'MAPP.db', location: 'default' });

        //Init DB
        db.transaction(function (tx) {
            //create table
            tx.executeSql("CREATE TABLE IF NOT EXISTS messages (id integer primary key, time text, msg text, usr text, usrid integer, rx integer)", [], function (tx, res) { })
            , function (err) {
                console.log('Open database ERROR: ' + JSON.stringify(err));
            };
        });

        //Temporary allMessages string
        var allMessages;

        //Update allMesages
        function updateAllMessages() {
            db.transaction(function (tx) {
                tx.executeSql("SELECT * FROM messages", [], function (tx, res) {
                    for (var i = 0; i < res.rows.length; i++) {
                        row = res.rows.item(i)['msg'];
                        allMesages = allMessages + JSON.stringify(row);
                    }
                });
            });
            document.getElementById("allMessages").innerHTML = allMessages;
        }

        //Check if registerd
        if (window.localStorage.getItem('user') == null || window.localStorage.getItem('pwd') == null) {
            window.location = 'login.html';
            return;
        }

        //Connect to socket
        var socket = io.connect('http://77.162.231.112:80');

        //First connect and register segment
        socket.on('hello', function () {
            socket.emit('id', window.localStorage.getItem('user') + ' ' + window.localStorage.getItem('pwd'));
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + 'Login sent';
        });

        socket.on('text', function (data) {
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + data;
        });

        socket.on('msg', function (message) {
            db.executeSql('INSERT INTO messages (time, msg, usr, usrid) VALUES (?,?,?,?)', [message.time, message.msg, message.usr, message.usrid], function (resultSet) {
                console.log('resultSet.insertId: ' + resultSet.insertId);
                console.log('resultSet.rowsAffected: ' + resultSet.rowsAffected);
            }, function (err) {
                //errors for all transactions are reported here
                console.log("Error: " + err.message);
            });
            db.executeSql('SELECT * FROM messages WHERE time = ?', [message.time], function (resultSet) {
                document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + resultSet.rows.item(0)['msg'];
            }, function (err) {
                //errors for all transactions are reported here
                console.log("Error: " + err.message);
            });
            updateAllMessages();
        });

        $("#clickDiv").click(function () {
            socket.emit('clicked', 'clicked!');
        });

        $("#clearStorage").click(function () {
            localStorage.clear();
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + 'LocalStorage cleared';
        });

        $("#sendButton").click(function () {
            date = new Date();
            socket.emit('msg', { msg: $('#message').val(), usrid: 'usrid', time: date.getTime() });
        });

    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.

    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
})();