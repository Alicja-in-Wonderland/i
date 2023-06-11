const express = require('express'),
   bodyParser = require('body-parser'),
   uuid = require('uuid'),
   morgan = require('morgan'),
   fs = require('fs'),
   path = require('path'),
   mongoose = require('mongoose'),
   Models = require('./models.js'),
   Movies = Models.Movie,
   Users = Models.User;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const cors = require('cors');
app.use(cors());

let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport.js');

mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });

//create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined',{stream: accessLogStream}));

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', {root: __dirname});
});

//Return a list of all movies to the user
app.get('/movies', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.find()
    .then((movies) => {
        res.status(201).json(movies);
    })
    .catch((error) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Return data about a single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
    .then((movie) => {
        res.json(movie);
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Return data about a genre by name
app.get('/movies/genre/:Genre', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ 'Genre.Name': req.params.Genre })
    .then((movie) => {
        if (!movie) {
            return res.status(404).send('Error: ' + req.params.Genre + ' was not found.');
        } else {
            res.json(movie.Genre.Description);
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Return data about a director by name
app.get('/movies/directors/:Director', passport.authenticate('jwt', {session: false}), (req, res) => {
    Movies.findOne({ 'Director.Name': req.params.Director })
    .then((movie) => {
        if (!movie) {
            return res.status(404).send('Error: ' + req.params.Director + ' was not found.');
        } else {
            res.json(movie.Director);
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//Add a new user
app.post('/users', (req, res) => {
    let hashedPassword = Users.hashPassword(req.body.Password);
    Users.findOne({ Username: req.body.Username })
    .then((user) => {
        if (user) {
            return res.status(400).send(req.body.Username + 'already exists');
        } else {
            Users
            .create({
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            })
            .then((user) => {res.status(201).json(user) })
            .catch((error) => {
                console.error(error);
                res.status(500).send('Error: ' + error);
            })
        }
    })
    .catch((error) => {
        console.error(error);
        res.status.apply(500).send('Error: ' + error);
    });
});

//Allow users to update their user info
app.put('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, { $set:
        {
            Username: req.body.Username,
            Password: req.body.Password,
            Email: req.body.Email,
            Birthday: req.body.Birthday
        }
    },
    { new: true }).then(
        (updatedUser) => {res.json(updatedUser);},
        (err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        }
    );
});

//Allow users to add a movie to their list of favourites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { Favourites: req.params.MovieID }
    },
    { new: true }).then(
        (updatedUser) => {res.json(updatedUser);},
        (err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        }
    );
});

//Allow users to remove a movie from their list of favourites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { Favourites: req.params.MovieID }
    },
    { new: true }).then(
        (updatedUser) => {res.json(updatedUser);},
        (err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        }
    );
});

//Allow existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', {session: false}), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
    .then((user) => {
        if (!user) {
            res.status(400).send(req.params.Username + ' was not found.');
        } else {
            res.status(200).send(req.params.Username + ' was deleted.');
        }
    })
    .catch((err) => {
        console.error(err);
        res.status(500).send('Error: ' + err);
    });
});

//error-handling function
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

//listen for requests
app.listen(8080, () => {
    console.log('Your app is listening on port 8080.');
});