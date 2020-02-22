const path = require('path')  // in core node module
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()  ///generate a new application
const server = http.createServer(app) // this allow us to create new webserver
const io = socketio(server)
// when make requiry we get a function back, and we call to get it configure socket to work with a given server which we passed in
// when we set up io to work with a given server, it also sets up a file to be served up that the clients can access

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


// get clients to connect
io.on('connection', (socket) => {
    console.log('New websocket connection')
    // socket is an objeckt and it contains information about that new connection, we can use methods on socket to communicate with that specific client. One time for each new connection
    
    socket.on('join', (options, callback) => {
        // Option => { username, room }
        const { error, user } = addUser({ id: socket.id, ...options})
        
        if (error) {
            return callback(error)
        }
        
        socket.join(user.room) // emit events to just a specific room
        socket.emit('message', generateMessage('Admin', 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `Yay! ${user.username} has joined!`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        
        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit - emit to everybody in a specific room
        // socket.broadcast.to.emit - limit to a chat room

        callback()
        
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter

        if (filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
            // chat.js will have access to this argument
        }

        io.to(user.room).emit('message', generateMessage(user.username, message)) 
        callback() 
    })

    socket.on('sendLocation', ({ latitude, longitude } , callback) => {
        const user = getUser(socket.id)
        
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username, `https://google.com/maps?q=${latitude},${longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {

            io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left :'(`))
            io.to(use.room).emit('romData', {
                room: user.room,
                users: getUsersInRoom(user.room)
                
            })

        }
    })


}) 


// we need to load in the client side of socket.io library
// when  appear means it got set up correctly and our client is able to connect to it which facilitat real time communication

server.listen(port, () => {
    console.log(`Server is up on port ${port}`)
}) // with these we can easily set up socket.io

