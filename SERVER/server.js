require('dotenv').config();
const path = require('path')
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const tourRoutes = require('./src/routes/tourRoutes.js')
const authRoutes = require('./src/routes/authRoutes.js')
const bookingRoutes = require('./src/routes/bookingRoutes.js')
const cartRoutes = require('./src/routes/cartRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const startCronJobs = require('./src/utils/cronJobs'); 
const userRoutes = require('./src/routes/userRoutes'); 
const http = require('http');           
const { Server } = require('socket.io');
const app = express();

startCronJobs();
const port = process.env.PORT || 3000;

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:5173", "http://127.0.0.1:5173"], 
        methods: ["GET", "POST"]
    }
});

global.onlineUsers = new Map(); 

io.on('connection', (socket) => {
    console.log("Một user vừa kết nối WebSockets:", socket.id);

    socket.on('add-user', (userId) => {
        global.onlineUsers.set(userId, socket.id);
    });

    socket.on('send-msg', (data) => {
        const sendUserSocket = global.onlineUsers.get(data.to);
        if (sendUserSocket) {
            socket.to(sendUserSocket).emit('msg-receive', data.msg);
        }
    });

    socket.on('disconnect', () => {
    for (let [userId, socketId] of global.onlineUsers.entries()) {
        if (socketId === socket.id) {
            global.onlineUsers.delete(userId);
            console.log(`User ${userId} dis.`);
            break;
        }
    }
});
});

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true
}));

app.use(express.json())
app.use('/api/tours', tourRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/cart', cartRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/users', userRoutes);
app.use('/api/reviews', require('./src/routes/reviewRoutes'));
app.use('/api/notifications', require('./src/routes/notificationRoutes'));
app.use('/api/messages', require('./src/routes/messageRoutes'));
app.use('/api/chat', chatRoutes);

require('./src/models/Booking.js')
require('./src/models/Users.js')
require('./src/models/Tours.js')
require('./src/models/Locations.js')
require('./src/models/Categorys.js')
require('./src/models/Reviews.js')
require('./src/models/Cart.js')

console.log('link db', process.env.MONGO_URI)
console.log('port', process.env.PORT)

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Đã kết nối với mongoDB'))
    .catch((err) => console.log('Lỗi kết nối DB: ', err))

server.listen(port, () => {
    console.log(`Server & Socket.io đang chạy trên cổng ${port}`);
});