const { check, validationResult } = require('express-validator');

module.exports = function(app, forumData) {
    // redirect to login if user is not authenticated
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('/login')
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

    // render the about page
    app.get('/about', function(req, res) {
        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';
        res.render('about.ejs', {
            forumName: forumData.forumName,
            userLoggedIn: userLoggedIn,
            username: username
        });
    });

    // fetch threads from the database and render the forum page
    app.get('/forum', function(req, res) {
        db.query('SELECT id, title, content, username FROM threads', (err, threads) => {
            if (err) {
                console.error('Error fetching threads from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            // check if user is logged in
            const userLoggedIn = req.session.userId ? true : false;
            const username = userLoggedIn ? req.session.userId : '';

            res.render('forum.ejs', {
                forumName: forumData.forumName,
                threads,
                userLoggedIn,
                username
            });
        });
    });

    // handle requests for a specific thread
    app.get('/forum/:threadId', function(req, res) {
        const threadId = req.params.threadId;

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

            // check if user is logged in
            const userLoggedIn = req.session.userId ? true : false;
            const username = userLoggedIn ? req.session.userId : '';

            // render the fullThread.ejs with forum name, the selected thread, and user information
            res.render('fullThread.ejs', {
                forumName: forumData.forumName,
                thread: selectedThread[0],
                userLoggedIn,
                username
            });
        });
    });

    // render the createThread page
    app.get('/createthread', redirectLogin, function(req, res) {
        // Check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';

        res.render('createThread.ejs', {
            forumName: forumData.forumName,
            userLoggedIn: userLoggedIn,
            username: username
        });
    });

    app.post('/createthread', function(req, res) {
        // sanitize thread title and content
        const threadTitle = req.sanitize(req.body.title);
        const threadContent = req.sanitize(req.body.content);
        const username = req.session.userId;

        // make sure the user is logged in before allowing them to create a thread
        if (!username) {
            return res.redirect('/login');
        }

        // first, get the user_id from the userdetails table
        const userQuery = 'SELECT id FROM userdetails WHERE username = ?';
        db.query(userQuery, [username], (userErr, userResult) => {
            if (userErr) {
                console.error('Error finding user in the database:', userErr);
                return res.redirect('/createthread');
            }

            if (userResult.length > 0) {
                const userId = userResult[0].id;

                // now insert the new thread, including the user_id
                const sql = 'INSERT INTO threads (title, content, username, user_id) VALUES (?, ?, ?, ?)';
                db.query(sql, [threadTitle, threadContent, username, userId], (threadErr, threadResult) => {
                    if (threadErr) {
                        console.error('Error saving thread to the database:', threadErr);
                        return res.redirect('/createthread');
                    }
                    // redirect to the forum page after successfully creating the thread
                    res.redirect('/forum');
                });
            } else {
                // handle the case where the user does not exist in the database
                res.redirect('/login');
            }
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
        const username = req.sanitize(req.body.username.toLowerCase());
        const password = req.body.password;

        // select the hashed password and user id for the user from the database
        let sqlQuery = "SELECT id, username, hashedPassword FROM userDetails WHERE username = ?";
        db.query(sqlQuery, [username], (err, result) => {
            if (err) {
                // handle other errors (e.g., database connection issues)
                console.error(err);
                return res.status(500).send("Error accessing the database. Please try again later.");
            }

            // check if the user was found in the database
            if (result.length > 0) {
                const userDbId = result[0].id; // get the user's ID from the database
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
                            req.session.userDbId = userDbId;

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

    app.post('/register', [
        check('email').isEmail().withMessage('Please enter a valid email address'),
    ], function(req, res) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(error => error.msg);
            return res.render('register.ejs', {
                forumName: forumData.forumName,
                errorMessage: errorMessages.join('<br>'),
                successMessage: ''
            });
        } else {
            const saltRounds = 10;
            const plainPassword = req.body.password;

            bcrypt.hash(plainPassword, saltRounds, function(err, hashedPassword) {
                if (err) {
                    return res.render('register.ejs', {
                        forumName: forumData.forumName,
                        errorMessage: 'An error occurred during password encryption.',
                        successMessage: ''
                    });
                }

                // sanitize input fields
                const firstName = req.sanitize(req.body.first);
                const lastName = req.sanitize(req.body.last);
                const email = req.sanitize(req.body.email);
                const username = req.sanitize(req.body.username.toLowerCase());

                // check if the email or username already exists
                let checkExistingQuery = "SELECT * FROM userDetails WHERE email = ? OR LOWER(username) = ?";
                let checkExistingValues = [req.body.email, username];

                db.query(checkExistingQuery, checkExistingValues, (err, results) => {
                    if (err) {
                        return res.render('register.ejs', {
                            forumName: forumData.forumName,
                            errorMessage: 'Database error while checking existing user details.',
                            successMessage: ''
                        });
                    }

                    if (results.length > 0) {
                        // email or username already exists
                        let emailExists = results.some(result => result.email === req.body.email);
                        let usernameExists = results.some(result => result.username.toLowerCase() === username);
                        let errorMessage = '';
                        if (emailExists && usernameExists) {
                            errorMessage = 'The provided email and/or username is already in use.';
                        } else if (emailExists) {
                            errorMessage = 'Email is already in use..';
                        } else if (usernameExists) {
                            errorMessage = 'Username is already in use.';
                        }

                        res.render('register.ejs', {
                            forumName: forumData.forumName,
                            errorMessage: errorMessage,
                            successMessage: ''
                        });
                    } else {
                        let insertQuery = "INSERT INTO userDetails (username, first, last, email, hashedPassword) VALUES (?, ?, ?, ?, ?)";
                        let newUser = [username, req.body.first, req.body.last, req.body.email, hashedPassword];

                        db.query(insertQuery, newUser, (err, result) => {
                            if (err) {
                                return res.render('register.ejs', {
                                    forumName: forumData.forumName,
                                    errorMessage: 'Database error while registering new user.',
                                    successMessage: ''
                                });
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
        }
    });
}