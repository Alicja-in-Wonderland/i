const express = require('express'),
   morgan = require('morgan'),
   fs = require('fs'),
   path = require('path');

const app = express();

//create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined',{stream: accessLogStream}));

let topMovies = [];

app.use(express.static('public'));

//GET requests
app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', {root: __dirname});
});

app.get('/movies', (req, res) => {
    res.json(topMovies);
});

//listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});