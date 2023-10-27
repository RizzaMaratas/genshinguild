// import the modules we need
var express = require('express')
var ejs = require('ejs')
var bodyParser = require('body-parser')
const mysql = require('mysql')
var session = require('express-session');

// create the express application object
const app = express()
const port = 8080
app.use(bodyParser.urlencoded({
    extended: true
}))

// create a session
app.use(session({
    secret: 'somerandomstuff',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000
    }
}));

// set up css
app.use(express.static(__dirname + '/public'));

// define the database connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'appuser',
    password: 'app2023',
    database: 'myForum'
});

// connect to the database with error handling
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err.stack);
        return;
    }
    console.log('Connected to database');
});
global.db = db;


// set the directory where express will pick up HTML files
// __dirname will get the current directory
app.set('views', __dirname + '/views');

// tell express that we want to use EJS as the templating engine
app.set('view engine', 'ejs');

// tells express how we should process html files
// we want to use EJS's rendering engine
app.engine('html', ejs.renderFile);

// define our data
var forumData = {
    forumName: "Genshin Guild"
}

// requires the main.js file inside the routes folder passing in the Express app and data as arguments.  all the routes will go in this file
require("./routes/main")(app, forumData);

// start the web app listening
app.listen(port, () => console.log(`Example app listening on port ${port}!`))