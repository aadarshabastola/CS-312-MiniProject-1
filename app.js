const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg'); // PostgreSQL module
const app = express();

// PostgreSQL database connection setup
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'BlogDB',
  password: 'toor',
  port: 5432, // default PostgreSQL port
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

// Middleware for user authentication
let currentUser = null;

// Routes for sign-up and sign-in
app.get('/signup', (req, res) => {
  res.render('signup');
});

app.get('/signin', (req, res) => {
  res.render('signin');
});

app.post('/signin', async (req, res) => {
  const { username, password } = req.body;
  console.log('Sign-in form data:', req.body); // Debug statement to log the form data

  try {
    // Query the database for the user credentials
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      currentUser = result.rows[0];
      res.redirect('/');
    } else {
      res.send('Invalid username or password, please try again.');
    }
  } catch (err) {
    console.error(err);
    res.send('Error signing in, please try again.');
  }
});

app.get('/signout', (req, res) => {
    currentUser = null;
    res.redirect('/');
  });

// Route for signing up a new user

app.post('/signup', async (req, res) => {
    const { username, password, name } = req.body; // Use 'username' instead of 'user_id'
    console.log('Sign-up form data:', req.body); // Debug statement to log the form data
  
    try {
      // Check if the username already exists
      const userCheck = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      if (userCheck.rows.length > 0) {
        res.send('Username already taken, please choose another.');
      } else {
        // Insert the new user into the database without specifying 'user_id'
        await pool.query('INSERT INTO users (username, password, name) VALUES ($1, $2, $3)', [username, password, name]);
        res.redirect('/signin');
      }
    } catch (err) {
      console.error(err);
      res.send('Error signing up, please try again.');
    }
  });

let posts = [];

// Load initial posts from the database
const loadPosts = async () => {
  try {
    const result = await pool.query('SELECT * FROM blogs ORDER BY date_created DESC');
    posts = result.rows;
  } catch (err) {
    console.error(err);
  }
};

// Routes for displaying and creating blog posts
app.get('/', async (req, res) => {
  await loadPosts();
  res.render('index', { posts, currentUser });
});

app.get('/create', (req, res) => {
  if (currentUser) {
    res.render('create');
  } else {
    res.redirect('/signin');
  }
});

app.post('/create', async (req, res) => {
  const { title, content, category } = req.body;
  try {
    await pool.query(
      'INSERT INTO blogs (creator_name, title, body, date_created, category, creator_username) VALUES ($1, $2, $3, NOW(), $4, $5)',
      [currentUser.name, title, content, category, currentUser.username]
    );
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.send('Error creating post, please try again.');
  }
});

// Routes for editing and deleting blog posts
app.get('/edit/:id', async (req, res) => {
    if (!currentUser) {
    res.redirect('/signin');
    }
  const postId = req.params.id;
  try {
    const result = await pool.query('SELECT * FROM blogs WHERE blog_id = $1', [postId]);
    const post = result.rows[0];
      res.render('edit', { post });

  } catch (err) {
    console.error(err);
    res.send('Error loading the edit page.');
  }
});

app.post('/edit/:id', async (req, res) => {
  const postId = req.params.id;
  const { title, content, category } = req.body;
  try {
    // Check if the current user is the creator of the post
    const result = await pool.query('SELECT creator_username FROM blogs WHERE blog_id = $1', [postId]);
    const post = result.rows[0];

    if (post.creator_username === currentUser.username) {
      await pool.query(
        'UPDATE blogs SET title = $1, body = $2, category = $3 WHERE blog_id = $4',
        [title, content, category, postId]
      );
      res.redirect('/');
    } else {
      res.send('You do not have permission to edit this post.');
    }
  } catch (err) {
    console.error(err);
    res.send('Error updating the post.');
  }
});


app.post('/delete/:id', async (req, res) => {

    if (!currentUser) {
        res.redirect('/signin');
        return;
    }

  const postId = req.params.id;
  try {
    // Check if the current user is the creator of the post
    const result = await pool.query('SELECT creator_username FROM blogs WHERE blog_id = $1', [postId]);
    const post = result.rows[0];

    if (post.creator_username === currentUser.username) {
      await pool.query('DELETE FROM blogs WHERE blog_id = $1', [postId]);
      res.redirect('/');
    } else {
      res.send('You do not have permission to delete this post.');
    }
  } catch (err) {
    console.error(err);
    res.send('Error deleting the post.');
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
