const express = require('express');
const path = require('path');
// require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '/public')));

// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
var mysql = require('mysql2/promise');

// var app = express();

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());

let db;

(async () => {
  try {
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'DogWalkService'
    });

  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();
app.get('/', (req, res) => {
  res.send('Success');
});

// Route to return Dogs as JSON
app.get('/api/dogs', async (req, res) => {
  try {
    const [dogs] = await db.execute('SELECT dog.name AS dog_name, dog.size, user.username AS owner_username FROM Dogs dog JOIN Users user ON dog.owner_id = user.user_id');
    res.json(dogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Dogs' });
  }
});
// Route to return open walkrequests as JSON
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [requests] = await db.execute("SELECT request.request_id, dog.name AS dog_name, request.requested_time, request.duration_minutes, request.location, user.username AS owner_username FROM WalkRequests request JOIN Dogs dog ON request.dog_id = dog.dog_id JOIN Users user ON dog.owner_id = user.user_id WHERE request.status = 'open'");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});
// Route to return summary of walks as JSON
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [summary] = await db.execute("SELECT user.username AS walker_username, COUNT(rating.rating_id) AS total_ratings, ROUND(AVG(rating.rating), 1) AS average_rating, COUNT(DISTINCT request.request_id) AS completed_walks FROM Users user LEFT JOIN WalkRatings rating ON user.user_id = rating.walker_id LEFT JOIN WalkRequests request ON rating.request_id = request.request_id AND request.status = 'completed' WHERE user.role = 'walker' GROUP BY user.user_id, user.username");
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;
