// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=397704
// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";

    document.addEventListener( 'deviceready', onDeviceReady.bind( this ), false );

    function onDeviceReady() {
        // Handle the Cordova pause and resume events
        document.addEventListener( 'pause', onPause.bind( this ), false );
        document.addEventListener( 'resume', onResume.bind( this ), false );
        
        // TODO: Cordova has been loaded. Perform any initialization that requires Cordova here.
        StatusBar.show();

        //Check if registerd
        if (window.localStorage.getItem('user') == null || window.localStorage.getItem('pwd') == null) {
            window.location = 'login.html';
            return;
        }

        //Connect to socket
        var socket = io.connect('http://83.87.9.108:80');

        //First connect and register segment
        socket.on('hello', function () {
            socket.emit('id', window.localStorage.getItem('user') + ' ' + window.localStorage.getItem('pwd'));
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + 'Login sent';
        });

        socket.on('text', function (data) {
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + data;
        });

        socket.on('msg', function (message) {
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + message;
        });
        
        $("#clickDiv").click(function () {
            socket.emit('clicked', 'clicked!');
        });

        $("#clearStorage").click(function () {
            localStorage.clear();
            document.getElementById("outputDiv").innerHTML = document.getElementById("outputDiv").innerHTML + '<br>' + 'LocalStorage cleared';
        });

        $("#sendButton").click(function () {
            socket.emit('msg', $('#message').val());
        });
        
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
        
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
} )();