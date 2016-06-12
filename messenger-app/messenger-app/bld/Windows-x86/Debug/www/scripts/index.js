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

        //Set bottom padding body
        $("body").css("padding-bottom", ($(".navbar-fixed-bottom").height() + 'px'));

        //Scroll to bottom on input field focus
        document.addEventListener("showkeyboard", function () { $("html, body").animate({ scrollTop: $(document).height() }, "fast"); }, false);

        //Get date
        var date = new Date();

        //Date to xx:xx
        function timeNow(i) {
            var d = new Date(parseFloat(i)),
                y = d.getFullYear(),
                month = d.getMonth(),
                day = d.getDate(),
                h = (d.getHours() < 10 ? '0' : '') + d.getHours(),
                m = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
            var firstDayOfYear = Math.floor((new Date().setFullYear(new Date().getFullYear(), 0, 1)) / 86400000);
            var today = Math.ceil((new Date().getTime()) / 86400000);
            var then = Math.ceil((d.getTime()) / 86400000);
            var dayOfYearToday = today - firstDayOfYear;
            var dayOfYearThen = then - firstDayOfYear;
            if (dayOfYearThen != dayOfYearToday) {
                if ((new Date().getFullYear()) > (d.getFullYear())) {
                    return (day + ' ' + month + ' ' + year);
                } else {
                    if (dayOfYearToday - 1 == dayOfYearThen) {
                        return ('Yesterday ' + h + ':' + m);
                    } else {
                        return (day + ' ' + month);
                    }
                }
            } else {
                return (h + ':' + m);
            }
        }

        //Check if username is own name
        function ownNameCheck(name) {
            if(name == window.localStorage.getItem('user')) {
                return('You')
            } else {
                return(name);
            }
        }

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
            db.transaction(function (transaction) {
                transaction.executeSql('SELECT * FROM messages', [], function (tx, results) {
                    var len = results.rows.length, i;
                    $("#outputMessages").html('');
                    for (i = 0; i < len; i++) {
                        $("#outputMessages").append('<div class="panel panel-default"><div class="panel-heading"><p>' + timeNow(results.rows.item(i).time) + ' ' + ownNameCheck(results.rows.item(i).usr) + '</p></div><div class="panel-body"><p>' + results.rows.item(i).msg + '</p></div></div>');
                    }
                }, null);
            });
            //$("#mid").animate({ scrollTop: $("#mid").prop("scrollHeight") }, 1000);
            $("html, body").animate({ scrollTop: $(document).height() }, "slow");
        }

        if (window.localStorage.getItem('user') != null) {
            $('.overlay-login').hide();
            $('body').removeClass('noscroll');
            connectSocket();
        }

        $('#login').click(function () {
            window.localStorage.setItem('user', $('#username').val());
            window.localStorage.setItem('pwd', $('#password').val());
            connectSocket();
        });

        function connectSocket() {
            //Connect to socket
            var socket = io.connect('http://77.162.231.112:80');

            socket.on('connect', function () {
                socket.emit('authentication', { username: window.localStorage.getItem('user'), password: window.localStorage.getItem('pwd') });
                socket.on('unauthorized', function (err) {
                    $('.overlay-login').show();
                    $('body').addClass('noscroll');
                    $('.login-error-box').html("There was an error with the authentication: ", err.message);
                });
                socket.on('authenticated', function () {
                    //Update all messages on login 
                    updateAllMessages();

                    //Send last message time
                    db.transaction(function (transaction) {
                        transaction.executeSql('SELECT MAX("time") AS time FROM messages', [], function (tx, results) {
                            socket.emit('timeSinceUpdate', parseFloat(results.rows.item(0).time));
                        }, null);
                    });

                    //Hide login overlay
                    $('.overlay-login').hide();
                    $('body').removeClass('noscroll');

                    //Add all received messages to database
                    socket.on('messagesUpdate', function (messages) {
                        db.transaction(function (tx) {
                            var query = 'INSERT INTO messages (time, msg, usr) VALUES (?, ?, ?)';
                            messages.forEach(function (row) {
                                tx.executeSql(query, [row.time, row.msg, row.usr]);
                            })
                        });
                        updateAllMessages();
                    });

                    socket.on('msg', function (message) {
                        db.transaction(function (transaction) {
                            var executeQuery = "INSERT INTO messages (time, msg, usr) VALUES (?,?,?)";
                            transaction.executeSql(executeQuery, [message.time, message.msg, message.username],
                            function (error) { if (error) { console.log(error); } });
                        });
                        console.log(message.msg);
                        updateAllMessages();
                    });

                    $("#sendButton").click(function () {
                        if ($('#message').val() != '') {
                            date = new Date();
                            socket.emit('msg', { msg: $('#message').val(), username: window.localStorage.getItem('user'), time: date.getTime() });
                            $("#message").val('');
                        }
                    });

                    //On enter
                    $("#message").keypress(function (e) {
                        if (e.which == 13) {
                            $("#sendButton").click();
                        }
                    });
                });
            });

        }

        $('#clearStorage').click(function () {
            localStorage.clear();
            window.scrollTo(0, 0);
            document.location.href = 'index.html';
        });

        $("#clearDatabase").click(function () {
            db.transaction(function(transaction) {
                var executeQuery = "DELETE FROM messages";
                transaction.executeSql(executeQuery, [],
                //On Success
                function (tx, result) { console.log('Delete successful'); },
                //On Error
                function (error) { if (error) { console.log(error); }});
            });
        });

    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.

    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
})();