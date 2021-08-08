const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const socketio = require('socket.io');
const pool = require('./db');
const Users = require('./queries/users');
const Games = require('./queries/games');
const formatMessage = require('./utils/message');
const connections = new Set();

// Create instance of express
const app = express();

// Allow CORS and json request
app.use(cors({ origin: '*' }));
app.use(express.json());

// Use http with instance of express
const server = http.createServer(app);

// Create socket instance with http
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Listener for new client connection
io.on('connection', socket => {
  // Store connection for later reference
  connections.add(socket.id);

  // New user listener
  socket.on('new_user', async (data) => {
    // Format user
    const user = { id: socket.id, username: data };

    try {
      // Create new user in database
      const newUser = await pool.query('INSERT INTO users (socket_id, username, deleted) VALUES ($1, $2, $3) RETURNING *', [user.id, user.username, false]);

      // Get all users except current
      const allUsers = await Users.allUsers({ include: { deleted: 'false' }, exclude: { socket_id: newUser.rows[0].socket_id } });

      // Send all users available and currently created user
      io.emit('user_in_db', {
        users: allUsers,
        newUser: newUser.rows[0]
      });
    } catch (error) {
      console.log(error);
      // Send error to front
      io.emit('user_in_db_error', error);
    }
  });

  // Listen for new game
  socket.on('new_game', async (game) => {
    try {
      // Create new game in database
      const newGame = await pool.query('INSERT INTO games (finished, deleted, game) VALUES ($1, $2, $3) RETURNING *', [false, false, game]);

      // Emit even to creator (rather than broadcast) to have the id of the game 
      io.emit('new_game_in_db', newGame.rows[0]);
    } catch (error) {
      console.log(error);
      // Send error to all front clients
      io.emit('new_game_in_db_error', error);
    }
  });

  // Listen for game deletion
  socket.on('delete_game', async (game) => {
    try {
      // Assign delete column to true in database
      const deletedGame = await pool.query('UPDATE games SET deleted = true WHERE id = $1 RETURNING *', [game.id]);

      // Emit successful game deletion 
      socket.broadcast.emit('game_db_delete', deletedGame.rows[0]);
    } catch (error) {
      console.log(error);
      // Send error to all front clients
      io.emit('game_db_delete_error', error);
    }
  });

  // Listen for game completion
  socket.on('finished_game', async (game) => {
    try {
      // Assign finished column to true in database
      const finishedGame = await pool.query('UPDATE games SET finished = true WHERE id = $1 RETURNING *', [game.id]);

      // Emit successful game update 
      socket.broadcast.emit('game_db_finished', finishedGame.rows[0]);
    } catch (error) {
      console.log(error);
      // Send error to all front clients for later treatement
      io.emit('game_db_finished_error', error);
    }
  });

  // Listen for intial chat message
  socket.on('initial_message', (data) => {
    // Send expeditor id and formated message to contacted user
    socket.to(data.to_socket_id).emit("initial_message", {
      socket_id: data.senderUser.socket_id,
      message: formatMessage(data.senderUser.username, 'initial_message')
    });
  });

  // Listen for chat message
  socket.on('chatMessage', (data) =>
    // Send formatted message only to concerned parties
    io.to(data.to_socket_id)
      .to(data.senderUser.socket_id)
      .emit('new_message', formatMessage(data.senderUser.username, data.msg)));

  // Runs when a user disconnects
  socket.once('disconnect', async () => {
    // Remove disconnected user from data set
    connections.delete(socket.id);

    // If empty data set delete users and games created in current session
    if (!connections.size) {
      try {
        // Delete games and users in current session 
        // (store them for later reference, maybe add a date of creation/modification on both 'games' and 'users' tables)
        await pool.query("UPDATE users SET deleted = true where deleted = false");
        await pool.query("UPDATE games SET deleted = true where deleted = false");
      } catch (error) {
        console.log(error);
      }
    }
  });

  // Runs when a user disconnects
  socket.on('disconnect', async () => {
    try {
      // Assign delete column to true in database
      const deletedUser = await pool.query('UPDATE users SET deleted = true WHERE socket_id = $1 RETURNING *', [socket.id]);

      // Emit successful user removal 
      io.emit('user_leave', deletedUser.rows[0]);
    } catch (error) {
      console.log(error);
      // Send error to all front clients for later treatement
      io.emit('user_leave_error', error);
    }
  });
});

// API to get all users from DB
app.get('/get_users', async (req, res) => {
  try {
    // Get all users
    const allUsers = await Users.allUsers(req.query);
    // Send all users as response with a 200 server status
    res.status(200).json(allUsers);
  } catch (error) {
    console.log(error);
    // Send 500 server status and server message
    res.status(500).send('Error getting users');
  }
});

// API to get all games from DB
app.get('/get_games', async (req, res) => {
  try {
    // Get all games
    const allGames = await Games.allGames(req.query);
    // Send all games as response with a 200 server status
    res.status(200).json(allGames);
  } catch (error) {
    console.log(error);
    // Send 500 server status and server message
    res.status(500).send('Error getting games');
  }
});

// Start server
const PORT = 4000 || process.env.PORT;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));