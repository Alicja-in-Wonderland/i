/**
 * Movie and User schemas for the MongoDB database.
 * @module Models
 */
const mongoose = require('mongoose'),
    bcrypt = require('bcrypt');

/**
 * Schema for Movie objects.
 * @typedef {Object} Movie
 * @property {string} Title - The title of the movie.
 * @property {string} Description - The description of the movie.
 * @property {Object} Genre - The genre information of the movie.
 * @property {string} Genre.Name - The name of the genre.
 * @property {string} Genre.Description - The description of the genre.
 * @property {Object} Director - The director information of the movie.
 * @property {string} Director.Name - The name of the director.
 * @property {string} Director.Bio - The biography of the director.
 * @property {string} ImagePath - The URL of the movie's image.
 * @property {boolean} Featured - Indicates if the movie is featured.
 */
let movieSchema = mongoose.Schema({
    Title: { type: String, required: true },
    Description: { type: String, required: true },
    Genre: {
        Name: String,
        Description: String
    },
    Director: {
        Name: String,
        Bio: String
    },
    ImagePath: String,
    Featured: Boolean
});

/**
 * Schema for User objects.
 * @typedef {Object} User
 * @property {string} Username - The username of the user.
 * @property {string} Password - The hashed password of the user.
 * @property {string} Email - The email address of the user.
 * @property {Date} Birthday - The birthdate of the user.
 * @property {Array} Favourites - An array of movie IDs that the user has added to favorites.
 */
let userSchema = mongoose.Schema({
    Username: { type: String, required: true },
    Password: { type: String, required: true },
    Email: { type: String, required: true },
    Birthday: Date,
    Favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
});

/**
 * Hashes a given password using bcrypt.
 *
 * @function
 * @name hashPassword
 * @param {string} password - The password to hash.
 * @returns {string} - The hashed password.
 */
userSchema.statics.hashPassword = (password) => {
    return bcrypt.hashSync(password, 10);
};

/**
 * Validates a password by comparing it with the stored hashed password.
 *
 * @function
 * @name validatePassword
 * @param {string} password - The password to validate.
 * @returns {boolean} - True if the password is valid, false otherwise.
 */
userSchema.methods.validatePassword = function (password) {
    return bcrypt.compareSync(password, this.Password);
};

let Movie = mongoose.model('Movie', movieSchema);
let User = mongoose.model('User', userSchema);

module.exports.Movie = Movie;
module.exports.User = User;