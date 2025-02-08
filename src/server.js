// const express  = require('express')
// const bodyParser = require('body-parser')
// const socket = require('socket.io')
// // const cors = require('cors')
//
// var spawn = require("child_process").spawn;
//
// const app = new express()
// app.use(bodyParser.json())
// // app.use(cors())
//
// const PORT = 6000
// var server = app.listen(PORT,()=>{
//   console.log("Howdy, I am running at PORT ", PORT)
// })


var http = require('http');
var fs = require('fs');
var index = fs.readFileSync('index.html');

const PORT = 11500
http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(index);
}).listen(PORT);

console.log(' LISTENING AT PORT ', PORT)


// // Setting up Socket.io
// let io =  socket(server);
// let PATH = './../'
// io.on("connection", function(socket){
//   console.log("Socket is running with ID :"+ socket.id)
//
//   var PYC = 'python'
//
// })
