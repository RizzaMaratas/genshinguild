module.exports = function(app, forumData) {
    // handle our routes
    app.get('/', function(req, res) {
        res.render('index.ejs', forumData)
    });
    app.get('/about', function(req, res) {
        res.render('about.ejs', forumData);
    });
}