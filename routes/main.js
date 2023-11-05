module.exports = function(app, forumData) {
    // handle our routes
    app.get('/', function(req, res) {
        res.render('index.ejs', forumData)
    });

    app.get('/forum', function(req, res) {
        // fetch threads from the database
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

    app.get('/forum/:threadId', function (req, res) {
        const threadId = req.params.threadId;
        console.log('Requested Thread ID:', threadId);
    
        // Fetch the selected thread from the database
        db.query('SELECT * FROM threads WHERE id = ?', [threadId], (err, selectedThread) => {
            if (err) {
                console.error('Error fetching thread from the database:', err);
                return res.status(500).send('Internal Server Error');
            }
    
            if (selectedThread.length === 0) {
                // Handle the case where the thread is not found
                return res.status(404).send('Thread not found');
            }
    
            console.log('Fetched Thread:', selectedThread);
    
            // Render the fullThread.ejs template with the thread data
            res.render('fullThread.ejs', {
                forumName: forumData.forumName,
                thread: selectedThread[0] // Assuming the thread data is an object
            });
        });
    });
   
    app.get('/createthread', function(req, res) {
        res.render('createThread.ejs', forumData);
    });

    app.post('/createthread', function(req, res) {
        // process the submitted thread data here
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