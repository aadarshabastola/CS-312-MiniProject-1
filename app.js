const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.set('view engine', 'ejs');

let posts = [];

app.get('/', (req, res) => {
    res.render('index', { posts: posts });
});

app.get('/new', (req, res) => {
    res.render('new');
});

app.post('/create', (req, res) => {
    const post = {
        title: req.body.title,
        content: req.body.content
    };
    posts.push(post);
    res.redirect('/');
});

app.get('/edit/:id', (req, res) => {
    const post = posts[req.params.id];
    res.render('edit', { post, id: req.params.id });
});

app.post('edit/:id', (req, res) => {
    const id = req.params.id;
    posts[id].title = req.body.title;
    posts[id].content = req.body.content;
    res.redirect('/');
});

app.post('/delete/:id', (req, res) => {
    posts.splice(req.params.id, 1);
    res.redirect('/');
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});



