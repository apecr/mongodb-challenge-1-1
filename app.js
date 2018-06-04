const express = require('express');
const engines = require('consolidate');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const app = express();

app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(bodyParser.urlencoded({ extended: true }));

// Handler for internal server errors
function errorHandler(err, req, res, next) {
  console.error(err.message);
  console.error(err.stack);
  res.status(500).render('error_template', { error: err });
}

const getClient = () => {
  let client = { db: undefined };
  const insideGetClient = async() => {
    if (client.db === undefined) {
      console.log('Calculating client');
      client.db = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
    }
    return client.db;
  };
  return insideGetClient;
};

const getCachedClient = getClient();


app.get('/', function(req, res, next) {
  res.render('add_movie', {});
});

app.post('/add_movie', async(req, res, next) => {
  var title = req.body.title;
  var year = req.body.year;
  var imdb = req.body.imdb;

  if ((title === '') || (year === '') || (imdb === '')) {
    next('Please provide an entry for all fields.');
  } else {
    try {
      const client = await getCachedClient();
      const result = await client.db('video').collection('movies').insertOne(
        { 'title': title, 'year': year, 'imdb': imdb });
      res.send('Document inserted with _id: ' + result.insertedId);
    } catch (e) {
      next(e);
    }
  }
});

app.use(errorHandler);

var server = app.listen(3000, function() {
  var port = server.address().port;
  console.log('Express server listening on port %s.', port);
});

