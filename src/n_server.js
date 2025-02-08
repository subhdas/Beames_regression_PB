const express = require('express')
const bodyParser = require('body-parser')
const socket = require('socket.io')
const cors = require('cors')
const fs = require('fs');

// const {
//     BackendPython
// } = require("./n_pythoncalls");
// import './n_pythoncalls.js' 

const app = new express()
app.use(bodyParser.json())
app.use(cors())

PORT = 6600

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
});


var server = app.listen(PORT, () => {
    console.log("Yes, I am running at PORT ", PORT)
})


// Setting up Socket.io
let io = socket(server);
let PATH = './../'
io.on("connection", function(socket) {
    console.log("Socket is running with ID :" + socket.id)

    // test socket function ++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    socket.on('sendingdata', function(msg1) {
        console.log('msg recieved ', msg1);
        socket.emit('rightbackclient', {
            'name': 'great',
            'value': 100
        })
    });
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
})