const path= require('path')
const http = require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage, generateLocationMessage}= require('./utils/messages')
const {addUser, removeUser, getUser, getUsersInRoom}= require('./utils/users')

const app=express()
const server= http.createServer(app)
const io=socketio(server)

const port=process.env.PORT || 8080;
const publicDirectory= path.join(__dirname, '../public')

app.use(express.static(publicDirectory))

io.on('connection',(socket)=>{
    console.log('new websocket connection')

    socket.on('join',(options, callback)=>{
        const {error, user} = addUser({id: socket.id, ...options})

        if(error){
            return callback(error)
        }
        socket.join(user.room)
        socket.emit('message',generateMessage('Admin','welcome!'))
        socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user.username} has joined!`))

        io.to(user.room).emit('roomData',{
            room:user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(mess, callback)=>{
        const user=getUser(socket.id)
        const filter= new Filter()
        if(filter.isProfane(mess)){
            return callback('profanity not allowed')
        }
        //socket.emit('countUpdated',count)
        io.to(user.room).emit('message',generateMessage(user.username,mess))
        callback()
    })
    socket.on('sendPosition',(pos, callback)=>{
        const user=getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username, `https://google.com/maps?q=${pos.latitude},${pos.longitude}`))
        callback()
    })

    socket.on('disconnect',()=>{
        const user=removeUser(socket.id)
        if(user){
        io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users: getUsersInRoom(user.room)
        })
        }
    })

    
})

server.listen(port,()=>{
    console.log(`server is running on port ${port}`);
})
