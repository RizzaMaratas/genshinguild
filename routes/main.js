module.exports = function(app, forumData) {
    // handle our routes
    // render the index page
    app.get('/', function(req, res) {
        res.render('index.ejs', forumData);
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
    app.get('/forum/:threadId', function (req, res) {
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
}