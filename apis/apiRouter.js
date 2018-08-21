const express = require('express');
const app = express();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const apiRouter = require('./apis/apiRouter');

const pp = x => JSON.stringify(x, null, 2);
const PORT = process.env.PORT || 4000;

app.use(bodyParser.json());
app.use(cors());
app.use(errorhandler());

app.listen(PORT);

app.use('/api', apiRouter);





module.exports = app;