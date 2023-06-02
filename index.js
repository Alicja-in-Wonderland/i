const express = require('express'),
   morgan = require('morgan'),
   fs = require('fs'),
   path = require('path');

const app = express();

//create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), {flags: 'a'})

//set up the logger
app.use(morgan('combined',{stream: accessLogStream}));

let movies = [
    {
        title: 'The Godfather',
        genre: {
            name: 'Crime',
            description: 'Crime films, in the broadest sense, are a cinematic genre inspired by and analogous to the crime fiction literary genre.'
        },
        description: 'The aging patriarch of an organized crime dynasty in postwar New York City transfers control of his clandestine empire to his reluctant youngest son.',
        director: {
            name: 'Francis Ford Coppola',
            born: 'April 7th, 1939',
            bio: 'Francis Ford Coppola is an American film director, producer, and screenwriter.'
        }
    },

    {
        title: 'The Shawshank Redemption',
        genre: {
            name: 'Drama',
            description: 'In film and television, drama is a category or genre of narrative fiction (or semi-fiction) intended to be more serious than humorous in tone.'
        },
        description: 'Over the course of several years, two convicts form a friendship, seeking consolation and, eventually, redemption through basic compassion.',
        director: {
            name: 'Frank Darabont',
            born: 'January 28, 1959',
            bio: 'Frank Árpád Darabont is a French-born American film director, screenwriter and producer.'
        }
    },

    {
        title: 'The Dark Knight',
        genre: {
            name: 'Action',
            description: 'Action movies usually involve high-energy, physical stunts and chases, and may or may not have a lot of dialogue.'
        },
        description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.',
        director: {
            name: 'Christopher Nolan',
            born: 'July 30, 1970',
            bio: 'Acclaimed writer-director best known for his cerebral, often nonlinear, storytelling.'
        }
    },

    {
        title: 'Interstellar',
        genre: {
            name:'Sci-Fi',
            description: 'Science fiction (or sci-fi) is a genre that uses speculative, fictional science-based depictions of phenomena that are not fully accepted by mainstream science, such as extraterrestrial lifeforms, spacecraft, robots, cyborgs, dinosaurs, interstellar travel, time travel, or other technologies.'
        },
        description: 'When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot, Joseph Cooper, is tasked to pilot a spacecraft, along with a team of researchers, to find a new planet for humans.',
        director: {
            name: 'Christopher Nolan',
            born: 'July 30, 1970',
            bio: 'Acclaimed writer-director best known for his cerebral, often nonlinear, storytelling.'
        }
    },

    {
        title: 'Schindler\'s List ',
        genre: {
            name: 'History',
            description: 'A historical film is a fiction film showing past events or set within a historical period.',
        },
        description: 'In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.',
        director: {
            name: 'Steven Spielberg',
            born: 'December 18, 1946',
            bio: 'Hollywood\'s best known director and one of the wealthiest filmmakers in the world.'
        }
    }
];

app.use(express.static('public'));

//GET requests
app.get('/', (req, res) => {
    res.send('Welcome to myFlix!');
});

app.get('/documentation', (req, res) => {
    res.sendFile('public/documentation.html', {root: __dirname});
});

app.get('/movies', (req, res) => {
    res.json(movies);
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