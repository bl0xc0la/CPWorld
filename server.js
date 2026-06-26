const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Serve files from the current directory
app.use(express.static(__dirname));

// Keep track of all connected penguins
const players = {};

io.on('connection', (socket) => {
    console.log('A penguin connected:', socket.id);

    // Create a new player profile
    players[socket.id] = {
        x: 0,
        z: 0,
        yRot: 0,
        username: 'Penguin'
    };

    // 1. Send the new player all existing players
    socket.emit('currentPlayers', players);
    
    // 2. Tell all OTHER players that someone new joined
    socket.broadcast.emit('newPlayer', { id: socket.id, playerInfo: players[socket.id] });

    // Handle Movement
    socket.on('playerMovement', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].z = data.z;
            players[socket.id].yRot = data.yRot;
            
            // Broadcast the new position to everyone else
            socket.broadcast.emit('playerMoved', { id: socket.id, ...data });
        }
    });

    // Handle Chat
    socket.on('chatMessage', (data) => {
        if (players[socket.id]) {
            players[socket.id].username = data.username;
            // Send message and the sender's ID to everyone
            io.emit('newChatMessage', { id: socket.id, username: data.username, msg: data.msg });
        }
    });

    // Handle Disconnects
    socket.on('disconnect', () => {
        console.log('A penguin left:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`Server running! Open http://localhost:${PORT} in your browser.`);
});
