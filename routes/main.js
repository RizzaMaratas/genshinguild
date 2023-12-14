const bcrypt = require('bcrypt');
const {
    check,
    validationResult
} = require('express-validator');

module.exports = function(app, forumData) {
    // redirect to login if user is not authenticated
    const redirectLogin = (req, res, next) => {
        if (!req.session.userId) {
            res.redirect('/login')
        } else {
            next();
        }
    }

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
        db.query('SELECT *, thumbs_up, thumbs_down FROM threads WHERE id = ?', [threadId], (err, selectedThread) => {
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
        // check if user is logged in
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
        const selectedTag = req.body.tag;

        // check if user is logged in before allowing them to create a thread
        if (!username) {
            return res.redirect('/login');
        }

        // get the user_id from the userdetails table
        const userQuery = 'SELECT id FROM userdetails WHERE username = ?';
        db.query(userQuery, [username], (userErr, userResult) => {
            if (userErr) {
                console.error('Error finding user in the database:', userErr);
                return res.redirect('/createthread');
            }

            if (userResult.length > 0) {
                const userId = userResult[0].id;

                // insert the new thread including the user_id and selected tag
                const sql = 'INSERT INTO threads (title, content, username, user_id, tag) VALUES (?, ?, ?, ?, ?)';
                db.query(sql, [threadTitle, threadContent, username, userId, selectedTag], (threadErr, threadResult) => {
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

    // delete thread
    app.post('/delete-thread/:threadId', redirectLogin, function(req, res) {
        const threadId = req.params.threadId;
        const userId = req.session.userDbId;

        // check if the user is the author of the thread
        db.query('SELECT user_id FROM threads WHERE id = ?', [threadId], (err, result) => {
            if (err) {
                console.error('Error fetching thread from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (result.length === 0 || result[0].user_id !== userId) {
                // show message if the user is not the author
                return res.status(403).send('You are not authorized to delete this thread.');
            }

            // if the user is the author, delete the thread and its associated post
            db.query('DELETE FROM threads WHERE id = ?', [threadId], (deleteErr, deleteResult) => {
                if (deleteErr) {
                    console.error('Error deleting thread from the database:', deleteErr);
                    return res.status(500).send('Internal Server Error');
                }
                res.redirect('/forum');
            });
        });
    });

    // edit thread
    app.get('/edit-thread/:threadId', redirectLogin, function(req, res) {
        const threadId = req.params.threadId;
        const username = req.session.userId;

        // check if the user is logged in and set userLoggedIn accordingly
        const userLoggedIn = req.session.userId ? true : false;

        // fetch the selected thread from the database
        db.query('SELECT * FROM threads WHERE id = ? AND username = ?', [threadId, username], (err, selectedThread) => {
            if (err) {
                console.error('Error fetching thread from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (selectedThread.length === 0) {
                return res.status(404).send('Thread not found or you are not authorized to edit this thread.');
            }

            // render the editThread.ejs with forum name, the selected thread, and userLoggedIn
            res.render('editThread.ejs', {
                forumName: forumData.forumName,
                thread: selectedThread[0],
                userLoggedIn: userLoggedIn,
                username: username
            });
        });
    });

    app.post('/edit-thread/:threadId', redirectLogin, function(req, res) {
        const threadId = req.params.threadId;
        const username = req.session.userId;
        const updatedTitle = req.sanitize(req.body.title);
        const updatedContent = req.sanitize(req.body.content);
        const updatedTag = req.body.tag;
        const edited = true;

        // update the thread in the database if the user is the author
        db.query('UPDATE threads SET title = ?, content = ?, tag = ?, edited = ? WHERE id = ? AND username = ?',
            [updatedTitle, updatedContent, updatedTag, edited, threadId, username],
            (err, result) => {
                if (err) {
                    console.error('Error updating thread in the database:', err);
                    return res.status(500).send('Internal Server Error');
                }

                if (result.affectedRows === 0) {
                    return res.status(404).send('Thread not found or you are not authorized to edit this thread.');
                }

                // redirect to the fullThread page after successfully editing the thread
                res.redirect('/forum/' + threadId);
            }
        );
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
                // handle errors
                console.error(err);
                return res.status(500).send("Error accessing the database. Please try again later.");
            }

            // check if the user was found in the database
            if (result.length > 0) {
                const userDbId = result[0].id;
                const storedUsername = result[0].username;
                const hashedPassword = result[0].hashedPassword;

                // compare the username and password
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
                            // show error on login page if passwords do not match
                            res.render('login.ejs', {
                                forumName: forumData.forumName,
                                errorMessage: 'Incorrect username or password.'
                            });
                        }
                    });
                } else {
                    // show error on login page if username does not match
                    res.render('login.ejs', {
                        forumName: forumData.forumName,
                        errorMessage: 'Incorrect username or password.'
                    });
                }
            } else {
                // show error on login page if user is not found in the database
                res.render('login.ejs', {
                    forumName: forumData.forumName,
                    errorMessage: 'User not found.'
                });
            }
        });
    });

    // logout route
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

    // render the characters page
    app.get('/characters', function(req, res) {
        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';

        let sqlquery = "SELECT * FROM characters"; // query database to get all the characters

        // execute sql query to fetch character data
        db.query(sqlquery, (err, characters) => {
            if (err) {
                res.redirect('./');
            }

            // pass the character data to the characters.ejs template
            res.render('characters.ejs', {
                forumName: forumData.forumName,
                userLoggedIn: userLoggedIn,
                username: username,
                characters: characters
            });
        });
    });

    // search route
    app.get('/search', function(req, res) {
        res.render("search.ejs", {
            forumName: forumData.forumName,
            userLoggedIn: req.session.userId ? true : false,
            username: req.session.userId || ''
        });
    });

    // search result
    app.get('/search-result', function(req, res) {
        // get the search keyword from the query parameters
        let keyword = req.query.keyword;

        // if the keyword is a single letter, search for names starting with that letter
        if (keyword.length === 1) {
            let sqlquery = "SELECT * FROM characters WHERE name LIKE ?";

            // execute the SQL query
            db.query(sqlquery, [keyword + '%'], (err, result) => {
                if (err) {
                    res.redirect('./');
                }

                // pass the search results to search-result.ejs
                res.render("characters.ejs", {
                    forumName: forumData.forumName,
                    userLoggedIn: req.session.userId ? true : false,
                    username: req.session.userId || '',
                    characters: result
                });
            });
        } else {
            let sqlquery = "SELECT * FROM characters WHERE name LIKE '%" + keyword + "%'";

            // execute the SQL query
            db.query(sqlquery, (err, result) => {
                if (err) {
                    res.redirect('./');
                }

                // pass the search results to search-result.ejs
                res.render("characters.ejs", {
                    forumName: forumData.forumName,
                    userLoggedIn: req.session.userId ? true : false,
                    username: req.session.userId || '',
                    characters: result
                });
            });
        }
    });

    // fetch the list of users
    app.get('/users', function(req, res) {
        db.query('SELECT id, username, email FROM userDetails', (err, users) => {
            if (err) {
                console.error('Error fetching users from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            // check if user is logged in
            const userLoggedIn = req.session.userId ? true : false;
            const username = userLoggedIn ? req.session.userId : '';

            res.render('users.ejs', {
                forumName: forumData.forumName,
                users,
                userLoggedIn,
                username,
                session: req.session
            });
        });
    });

    // deleting a user route
    app.post('/delete-account', redirectLogin, function(req, res) {
        const userId = req.session.userDbId;

        // delete the user's account based on their ID
        db.query('DELETE FROM userDetails WHERE id = ?', [userId], (err, result) => {
            if (err) {
                console.error('Error deleting user account from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            // destroy the user's session and redirect to the homepage
            req.session.destroy(err => {
                if (err) {
                    console.error(err);
                }
                res.redirect('/');
            });
        });
    });

    // forum api
    app.get('/api', function(req, res) {
        let keyword = req.query.keyword;
        let sqlQuery = "SELECT * FROM threads";
        let queryParams = [];

        if (keyword) {
            sqlQuery += " WHERE title LIKE ? OR content LIKE ?";
            keyword = '%' + keyword + '%';
            queryParams = [keyword, keyword];
        }

        db.query(sqlQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error fetching threads:', err);
                return res.status(500).json({
                    error: 'Internal server error'
                });
            }

            if (!result || result.length === 0) {
                return res.status(404).json({
                    error: 'No threads found'
                });
            }

            res.json(result);
        });
    });

    // weather route
    app.get('/weather', function(req, res) {
        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';

        res.render('weather.ejs', {
            weather: null,
            error: null,
            forumName: forumData.forumName,
            userLoggedIn: userLoggedIn,
            username: username
        });
    });

    app.post('/weather', function(req, res) {
        const apiKey = 'ccb0fdc793b7a5f3b411408006c49d5d';
        const city = req.body.city;
        const url = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

        const request = require('request');

        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';

        request(url, function(err, response, body) {
            if (err) {
                res.render('weather.ejs', {
                    weather: null,
                    error: 'An error occurred; please attempt the action again.',
                    forumName: forumData.forumName,
                    userLoggedIn: userLoggedIn,
                    username: username
                });
            } else {
                try {
                    const weatherData = JSON.parse(body);
                    if (response.statusCode === 200 && weatherData.main) {
                        const weatherMessage = {
                            city: weatherData.name,
                            description: weatherData.weather[0].description,
                            temperature: `Temperature: ${weatherData.main.temp}°C`,
                            humidity: `Humidity: ${weatherData.main.humidity}%`,
                            clouds: `Cloudiness: ${weatherData.clouds.all}%`,
                            feels_like: `Feels Like: ${weatherData.main.feels_like}°C`,
                            temp_min: `Lowest Temperature: ${weatherData.main.temp_min}°C`,
                            temp_max: `Highest Temperature: ${weatherData.main.temp_max}°C`,
                            wind: `Wind Speed: ${weatherData.wind.speed} m/s, Direction: ${weatherData.wind.deg}°`,
                            rain: weatherData.rain ? `Rain: ${weatherData.rain['1h']} mm/h` : 'Rain: None',
                        };
                        res.render('weather.ejs', {
                            weather: weatherMessage,
                            error: null,
                            forumName: forumData.forumName,
                            userLoggedIn: userLoggedIn,
                            username: username
                        });
                    } else {
                        // handle specific status codes or other errors
                        if (response.statusCode === 404) {
                            res.render('weather.ejs', {
                                weather: null,
                                error: 'City not found.',
                                forumName: forumData.forumName,
                                userLoggedIn: userLoggedIn,
                                username: username
                            });
                        } else {
                            res.render('weather.ejs', {
                                weather: null,
                                error: 'Unable to locate the weather for the city you specified.',
                                forumName: forumData.forumName,
                                userLoggedIn: userLoggedIn,
                                username: username
                            });
                        }
                    }
                } catch (parseError) {
                    res.render('weather.ejs', {
                        weather: null,
                        error: 'There was a problem processing the weather information.',
                        forumName: forumData.forumName,
                        userLoggedIn: userLoggedIn,
                        username: username
                    });
                }
            }
        });
    });

    // tv show route
    app.get('/tvShows', function(req, res) {
        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';

        res.render('tvShows.ejs', {
            shows: null,
            error: null,
            forumName: forumData.forumName,
            userLoggedIn: userLoggedIn,
            username: username
        });
    });

    const request = require('request');

    async function fetchEpisodeCount(showId) {
        return new Promise((resolve, reject) => {
            request(`https://api.tvmaze.com/shows/${showId}/episodes`, {
                json: true
            }, (err, response, body) => {
                if (err || response.statusCode !== 200) {
                    reject('Error fetching episodes');
                    return;
                }
                resolve(body.length);
            });
        });
    }

    // tv show route search
    app.get('/search-shows', function(req, res) {
        const request = require('request');
        const query = req.query.search;

        // check if user is logged in
        const userLoggedIn = req.session.userId ? true : false;
        const username = userLoggedIn ? req.session.userId : '';

        if (!query) {
            return res.render('tvShows.ejs', {
                shows: null,
                error: 'Type in a term for searching.',
                forumName: forumData.forumName,
                userLoggedIn: userLoggedIn,
                username: username
            });
        }

        const url = `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`;

        request(url, {
            json: true
        }, async (err, response, body) => {
            if (err || response.statusCode !== 200) {
                console.error('API error:', err || response.statusCode);
                return res.render('tvShows.ejs', {
                    shows: null,
                    error: 'There was a problem while fetching information from the TVMaze API.',
                    forumName: forumData.forumName,
                    userLoggedIn: userLoggedIn,
                    username: username
                });
            }

            if (!body || body.length === 0) {
                return res.render('tvShows.ejs', {
                    shows: null,
                    error: 'There were no TV series that matched your search query.',
                    forumName: forumData.forumName,
                    userLoggedIn: userLoggedIn,
                    username: username
                });
            }

            const showsWithEpisodes = await Promise.all(body.map(async (showItem) => {
                try {
                    const episodeCount = await fetchEpisodeCount(showItem.show.id);
                    return {
                        ...showItem,
                        show: {
                            ...showItem.show,
                            episodeCount
                        }
                    };
                } catch (error) {
                    console.error('Unable to retrieve the number of episodes for the show:', showItem.show.name, error);
                    return showItem;
                }
            }));

            res.render('tvShows.ejs', {
                shows: showsWithEpisodes,
                error: null,
                forumName: forumData.forumName,
                userLoggedIn: userLoggedIn,
                username: username
            });
        });
    });

    // render a page showing all posts with a specific tag
    app.get('/tag/:tag', function(req, res) {
        const tag = req.params.tag;

        // fetch all threads with the same tag from the database
        db.query('SELECT id, title, content, username FROM threads WHERE tag = ?', [tag], (err, threads) => {
            if (err) {
                console.error('Error fetching threads by tag from the database:', err);
                return res.status(500).send('Internal Server Error');
            }

            // check if user is logged in
            const userLoggedIn = req.session.userId ? true : false;
            const username = userLoggedIn ? req.session.userId : '';

            res.render('tagPage.ejs', {
                forumName: forumData.forumName,
                tag,
                threads,
                userLoggedIn,
                username
            });
        });
    });

    // post thumbs up
    app.post('/forum/:threadId/thumbsUp', redirectLogin, (req, res) => {
        const threadId = req.params.threadId;
        const userId = req.session.userDbId;

        // check if the user has already voted (up or down) for this thread
        db.query('SELECT * FROM user_votes WHERE user_id = ? AND thread_id = ?', [userId, threadId], (err, results) => {
            if (err) {
                console.error('Error checking user vote:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length > 0) {
                // user has already voted, don't allow another vote
                return res.status(400).send('You have already voted for this thread.');
            }

            // if the user hasn't voted before, increment the thumbs up count in the database
            db.query('UPDATE threads SET thumbs_up = thumbs_up + 1 WHERE id = ?', [threadId], (err) => {
                if (err) {
                    console.error('Error updating thumbs up count:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // record the user's upvote in the user_votes table
                db.query('INSERT INTO user_votes (user_id, thread_id, vote_type) VALUES (?, ?, ?)', [userId, threadId, 'up'], (err) => {
                    if (err) {
                        console.error('Error recording user vote:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    res.redirect('/forum/' + threadId);
                });
            });
        });
    });

    // post thumbs down
    app.post('/forum/:threadId/thumbsDown', redirectLogin, (req, res) => {
        const threadId = req.params.threadId;
        const userId = req.session.userDbId;

        // check if the user has already voted (up or down) for this thread
        db.query('SELECT * FROM user_votes WHERE user_id = ? AND thread_id = ?', [userId, threadId], (err, results) => {
            if (err) {
                console.error('Error checking user vote:', err);
                return res.status(500).send('Internal Server Error');
            }

            if (results.length > 0) {
                // user has already voted, don't allow another vote
                return res.status(400).send('You have already voted for this thread.');
            }

            // if the user hasn't voted before, increment the thumbs down count in the database
            db.query('UPDATE threads SET thumbs_down = thumbs_down + 1 WHERE id = ?', [threadId], (err) => {
                if (err) {
                    console.error('Error updating thumbs down count:', err);
                    return res.status(500).send('Internal Server Error');
                }

                // record the user's downvote in the user_votes table
                db.query('INSERT INTO user_votes (user_id, thread_id, vote_type) VALUES (?, ?, ?)', [userId, threadId, 'down'], (err) => {
                    if (err) {
                        console.error('Error recording user vote:', err);
                        return res.status(500).send('Internal Server Error');
                    }

                    res.redirect('/forum/' + threadId);
                });
            });
        });
    });
}