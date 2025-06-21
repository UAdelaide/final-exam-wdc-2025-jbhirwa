// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');

// var indexRouter = require('./routes/index');
// var usersRouter = require('./routes/users');

// var app = express();
// const pool = require('./db');
// app.get('/users', async (req, res) => {
//   try {
//     const [rows] = await pool.query('SELECT * FROM Users');
//     res.json(rows);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
// app.use('/users', usersRouter);

// module.exports = app;
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

let db;

(async () => {
  try {
    // // Connect to MySQL without specifying a database
    // const connection = await mysql.createConnection({
    //   host: 'localhost',
    //   user: 'root',
    //   password: '' // Set your MySQL root password
    // });

    // // Create the database if it doesn't exist
    // await connection.query('CREATE DATABASE IF NOT EXISTS testdb');
    // await connection.end();

    // Now connect to the created database
    db = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'password',
      database: 'DogWalkService'
    });

    // // Create a table if it doesn't exist
    // await db.execute(`
    //   CREATE TABLE IF NOT EXISTS books (
    //     id INT AUTO_INCREMENT PRIMARY KEY,
    //     title VARCHAR(255),
    //     author VARCHAR(255)
    //   )
    // `);

    // // Insert data if table is empty
    // const [rows] = await db.execute('SELECT COUNT(*) AS count FROM books');
    // if (rows[0].count === 0) {
    //   await db.execute(`
    //     INSERT INTO books (title, author) VALUES
    //     ('1984', 'George Orwell'),
    //     ('To Kill a Mockingbird', 'Harper Lee'),
    //     ('Brave New World', 'Aldous Huxley')
    //   `);
    // }
  } catch (err) {
    console.error('Error setting up database. Ensure Mysql is running: service mysql start', err);
  }
})();

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
    const [summary] = await db.execute("SELECT user.username AS walker_username, COUNT(rating.rating_id) AS total_ratings, ROUND(AVG(rating.rating), 1) AS average_rating, COUNT(DISTINCT request.request_id) AS completed_walks FROM Users user LEFT JOIN WalkRatings rating ON user.user_id = rating.walker_id
LEFT JOIN WalkRequests request ON rating.request_id = request.request_id AND request.status = 'completed'
WHERE user.role = 'walker'
GROUP BY user.user_id, user.username");
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});
app.use(express.static(path.join(__dirname, 'public')));

module.exports = app;