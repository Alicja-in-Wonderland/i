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

const { check, validationResult } = require('express-validator');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//App uses CORS, set to allow requests from all origins
const cors = require('cors');
app.use(cors());

//Only allows a specific set of origins to access the API
/*let allowedOrigins = ['http://localhost:8080', 'http://localhost:1234', 'https://my-f1ix.netlify.app'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) { // If a specific origin isn’t found on the list of allowed origins
            let message = 'The CORS policy for this application doesn’t allow access from origin ' + origin;
            return callback(new Error(message), false);
        }
        return callback(null, true);
    }
})); */

//Authentication (auth.js is handling login endpoint and generating JWT tokens)
let auth = require('./auth.js')(app);
const passport = require('passport');
require('./passport.js');
/**
 * Mongoose is a MongoDB object modeling tool designed to work in an asynchronous environment.
 * https://www.npmjs.com/package/mongoose
 * https://mongoosejs.com/
 * https://mongoosejs.com/docs/guide.html
 * https://mongoosejs.com/docs/api.html
 */
// Integrating Mongoose and connecting to MongoDB
//mongoose.connect('mongodb://localhost:27017/myFlixDB', { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(process.env.CONNECTION_URI, { useNewUrlParser: true, useUnifiedTopology: true });

//Creates a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), { flags: 'a' })

/**
 * Morgan is a HTTP request logger middleware for Node.js.
 * https://www.npmjs.com/package/morgan
 */
//Sets up the morgan logger
app.use(morgan('combined', { stream: accessLogStream }));

//Routing of static files (e.g. documentation.html)
app.use(express.static('public'));

//----------------------- Endpoint handlers ------------------------//

app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', { root: __dirname });
});

/**
 * Returns a list of all movies
 * @method GET
 * @param {string} endpoint - /movies
 * @param {function} callback - function(req, res)
 * @returns {Object} - JSON object containing all movies
 */
//Returns a list of all movies
app.get('/movies', (req, res) => {
    Movies.find()
        .then((movies) => {
            res.status(201).json(movies);
        })
        .catch((error) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Returns info about a movie by title
 * @method GET
 * @param {string} endpoint - /movies/:Title
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON object containing a movie's description
 */
//Returns data about a single movie by title
app.get('/movies/:Title', passport.authenticate('jwt', { session: false }), (req, res) => {
    Movies.findOne({ Title: req.params.Title })
        .then((movie) => {
            res.json(movie);
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

/**
 * Returns info about a genre
 * @method GET
 * @param {string} endpoint - /genre/:Genre
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON object containing a genre's description
 */
//Returns data about a genre by name
app.get('/movies/genre/:Genre', passport.authenticate('jwt', { session: false }), (req, res) => {
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

/**
 * Returns info about a director by name
 * @method GET
 * @param {string} endpoint - /movies/directors/:Director
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON object containing a director's bio
 */
//Returns data about a director by name
app.get('/movies/directors/:Director', passport.authenticate('jwt', { session: false }), (req, res) => {
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

/**
 * Creates a new user
 * @method POST
 * @param {string} endpoint - /users
 * @param {function} callback - function(req, res)
 * @returns {object} - creates a JSON object with new user's info
 */
//Adds a new user
app.post('/users',
    //Validation added
    [
        check('Username', 'Username requires min. 5 characters.').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required.').not().isEmpty(),
        check('Email', 'Email does not appear to be valid.').isEmail()
    ], (req, res) => {

        //Checks the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

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
                        .then((user) => { res.status(201).json(user) })
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

/**
 * Updates user's info
 * @method PUT
 * @param {string} endpoint - /users/:Username
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON response with the updated user information.
 */
//Allows users to update their user info
app.put('/users/:Username',
    //Validation added
    [
        check('Username', 'Username is required').isLength({ min: 5 }),
        check('Username', 'Username contains non alphanumeric characters - not allowed.').isAlphanumeric(),
        check('Password', 'Password is required.').not().isEmpty(),
        check('Email', 'Email does not appear to be valid.').isEmail()
    ],
    passport.authenticate('jwt', { session: false }), (req, res) => {
        //Checks the validation object for errors
        let errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }
        let hashedPassword = Users.hashPassword(req.body.Password);
        Users.findOneAndUpdate({ Username: req.params.Username }, {
            $set:
            {
                Username: req.body.Username,
                Password: hashedPassword,
                Email: req.body.Email,
                Birthday: req.body.Birthday
            }
        },
            { new: true }).then(
                (updatedUser) => { res.json(updatedUser); },
                (err) => {
                    console.error(err);
                    res.status(500).send('Error: ' + err);
                }
            );
    });

/**
 * Add a movie to a user's list of favourites.
 * @method POST
 * @param {string} endpoint - /users/:Username/movies/:MovieID
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON response with the updated list of favourites.
 */
//Allows users to add a movie to their list of favourites
app.post('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $push: { Favourites: req.params.MovieID }
    },
        { new: true }).then(
            (updatedUser) => { res.json(updatedUser); },
            (err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            }
        );
});

/**
 * Remove a movie from a user's list of favourites.
 * @method DELETE
 * @param {string} endpoint - /users/:Username/movies/:MovieID
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON response with the updated list of favourites.
 */
//Allows users to remove a movie from their list of favourites
app.delete('/users/:Username/movies/:MovieID', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndUpdate({ Username: req.params.Username }, {
        $pull: { Favourites: req.params.MovieID }
    },
        { new: true }).then(
            (updatedUser) => { res.json(updatedUser); },
            (err) => {
                console.error(err);
                res.status(500).send('Error: ' + err);
            }
        );
});

/**
 * Delete a user by username.
 * @method DELETE
 * @param {string} endpoint - /users/:Username
 * @param {function} callback - function(req, res)
 * @returns {object} - JSON response indicating the success or failure of user deletion.
 */
//Allows existing users to deregister
app.delete('/users/:Username', passport.authenticate('jwt', { session: false }), (req, res) => {
    Users.findOneAndRemove({ Username: req.params.Username })
        .then((user) => {
            if (!user) {
                res.status(400).send(req.params.Username + ' was not found.');
            } else {
                res.json(req.params.Username);
            }
        })
        .catch((err) => {
            console.error(err);
            res.status(500).send('Error: ' + err);
        });
});

//Error-handling function
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

/**
 * Start the server and listen on the specified port.
 * @param {number} port - The port on which the server should listen.
 * @param {string} host - The host address on which the server should listen.
 * @param {Function} callback - A callback function to be executed when the server starts.
 */
//Listens for requests
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
    console.log('Listening on Port ' + port);
});