module.exports = function(app, forumData) {
    // redirect to login if user is not authenticated
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('./login')
        } else {
            next();
        }
    }

    // import bcrypt for password hashing
    const bcrypt = require('bcrypt');

    // render the index page
    app.get('/', function(req, res) {
        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';
        res.render('index.ejs', {
            forumName: forumData.forumName,
            userLoggedIn: userLoggedIn,
            username: username
        });
    });

    // fetch threads from the database and render the forum page
    app.get('/forum', function(req, res) {
        db.query('SELECT * FROM threads', (err, threads) => {
            if (err) {
                console.error('Error fetching threads from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            console.log('Fetched Threads:', threads);

            res.render('forum.ejs', {
                forumName: forumData.forumName,
                threads
            });
        });
    });

    // handle requests for a specific thread
    app.get('/forum/:threadId', function(req, res) {
        const threadId = req.params.threadId;
        console.log('Requested Thread ID:', threadId);

        // fetch the selected thread from the database
        db.query('SELECT * FROM threads WHERE id = ?', [threadId], (err, selectedThread) => {
            if (err) {
                console.error('Error fetching thread from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (selectedThread.length === 0) {
                // handle the case where the thread is not found
                return res.status(404).send('Thread not found');
            }

            console.log('Fetched Thread:', selectedThread);

            // render the fullThread.ejs with forum name and the selected thread
            res.render('fullThread.ejs', {
                forumName: forumData.forumName,
                thread: selectedThread[0]
            });
        });
    });

    // render the createThread page
    app.get('/createthread', function(req, res) {
        res.render('createThread.ejs', forumData);
    });

    // process submitted thread data and save to the database
    app.post('/createthread', function(req, res) {
        const threadTitle = req.body.title;
        const threadContent = req.body.content;

        // save to the database
        const sql = 'INSERT INTO threads (title, content) VALUES (?, ?)';
        db.query(sql, [threadTitle, threadContent], (err, result) => {
            if (err) {
                console.error('Error saving thread to the database:', err);
                // redirect on error
                return res.redirect('/createthread');
            }

            // redirect to the forum page after successfully creating the thread
            res.redirect('/forum');
        });
    });

    // render the login page
    app.get('/login', function(req, res) {
        res.render('login.ejs', {
            forumName: forumData.forumName,
            errorMessage: ''
        });
    });

    app.post('/login', function(req, res) {
        const username = req.body.username;
        const password = req.body.password;

        // select the hashed password for the user from the database
        let sqlQuery = "SELECT username, hashedPassword FROM userDetails WHERE username = ?";
        db.query(sqlQuery, [username], (err, result) => {
            if (err) {
                // handle other errors (e.g., database connection issues)
                console.error(err);
                return res.status(500).send("Error accessing the database. Please try again later.");
            }

            // check if the user was found in the database
            if (result.length > 0) {
                const storedUsername = result[0].username;
                const hashedPassword = result[0].hashedPassword;

                // compare the username and password supplied with the database values
                if (username === storedUsername) {
                    bcrypt.compare(password, hashedPassword, function(err, result) {
                        if (err) {
                            // handle bcrypt compare error
                            console.error(err);
                            return res.status(500).send("Error. Please try again later.");
                        } else if (result == true) {
                            // save user session here, when login is successful
                            req.session.userId = storedUsername;

                            // redirect to the homepage
                            res.redirect('/');
                        } else {
                            // passwords do not match, show error on login page
                            res.render('login.ejs', {
                                forumName: forumData.forumName,
                                errorMessage: 'Incorrect username or password.'
                            });
                        }
                    });
                } else {
                    // username does not match, show error on login page
                    res.render('login.ejs', {
                        forumName: forumData.forumName,
                        errorMessage: 'Incorrect username or password.'
                    });
                }
            } else {
                // user not found in the database, show error on login page
                res.render('login.ejs', {
                    forumName: forumData.forumName,
                    errorMessage: 'User not found.'
                });
            }
        });
    });

    app.get('/logout', (req, res) => {
        req.session.destroy(err => {
            if (err) {
                // handle errors
                console.error(err);
            }
            // redirect to the homepage
            res.redirect('/');
        });
    });

    // render the register page
    app.get('/register', function(req, res) {
        res.render('register.ejs', {
            forumName: forumData.forumName,
            errorMessage: '',
            successMessage: ''
        });
    });

    app.post('/register', function(req, res) {
        const saltRounds = 10;
        const plainPassword = req.body.password;

        bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
            if (err) {
                return console.error(err.message);
            }

            // convert the provided username to lowercase
            const lowercaseUsername = req.body.username.toLowerCase();

            // check if the email or username already exists (case-insensitive)
            let checkExistingQuery = "SELECT * FROM userDetails WHERE email = ? OR LOWER(username) = ?";
            let checkExistingValues = [req.body.email, lowercaseUsername];

            db.query(checkExistingQuery, checkExistingValues, (err, results) => {
                if (err) {
                    return console.error(err.message);
                }

                if (results.length > 0) {
                    // email or username already exists
                    let emailExists = results.some(result => result.email === req.body.email);
                    let usernameExists = results.some(result => result.username.toLowerCase() === lowercaseUsername);
                    let errorMessage = '';
                    if (emailExists && usernameExists) {
                        errorMessage = 'Both email and username already exist.';
                    } else if (emailExists) {
                        errorMessage = 'Email already exists.';
                    } else if (usernameExists) {
                        errorMessage = 'Username already exists.';
                    }

                    // send the appropriate error message
                    res.render('register.ejs', {
                        forumName: forumData.forumName,
                        errorMessage: errorMessage,
                        successMessage: ''
                    });
                } else {
                    // insert the new user if email and username are unique (store username in lowercase)
                    let insertQuery = "INSERT INTO userDetails (username, first, last, email, hashedPassword) VALUES (?, ?, ?, ?, ?)";
                    let newUser = [lowercaseUsername, req.body.first, req.body.last, req.body.email, hashedPassword];

                    db.query(insertQuery, newUser, (err, result) => {
                        if (err) {
                            return console.error(err.message);
                        } else {
                            let successMessage = 'Hello ' + req.body.first + ' ' + req.body.last + ', you are now registered! We will send an email to you at ' + req.body.email + '.';
                            res.render('register.ejs', {
                                forumName: forumData.forumName,
                                errorMessage: '',
                                successMessage: successMessage
                            });
                        }
                    });
                }
            });
        });
    });
}