var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const compression = require('compression');
const session = require('express-session');
const bodyParser = require('body-parser');
const chalk = require('chalk');
const errorHandler = require('errorhandler');
const lusca = require('lusca');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const mongoose = require('mongoose');
const passport = require('passport');
const expressValidator = require('express-validator');
const expressStatusMonitor = require('express-status-monitor');
const sass = require('node-sass-middleware');
const multer = require('multer');
const mongodb = require('mongodb');
const MONGO_URL = process.env.MONGODB_URI || 'mongodb://localhost:27017';

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var mapRouter = require('./routes/map');
var mongoClient = mongodb.MongoClient;


var app = express();
var database = 1;
mongoClient.connect(MONGO_URL, function(err, db) {
    if (err) throw err;
    console.log('connected to: ' + MONGO_URL);
    database = db.db('vehicle-db');
});
mongoose.connect(MONGO_URL);
mongoose.connection.on('error', (err) => {
    console.error(err);
    console.log('%s MongoDB connection error. Please make sure MongoDB is running.', chalk.red('✗'));
    process.exit();
});

app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(expressStatusMonitor());
app.use(compression());
app.use(sass({
    src: path.join(__dirname, 'public'),
    dest: path.join(__dirname, 'public')
}));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressValidator());
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: '123123',
    cookie: {maxAge: 1209600000}, // two weeks in milliseconds
    store: new MongoStore({
        url: MONGO_URL,
        autoReconnect: true,
    })
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req, res, next) => {
    if (req.path === '/api/upload') {
        next();
    } else {
        lusca.csrf()(req, res, next);
    }
});
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('x-powered-by');
app.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});
app.use((req, res, next) => {
    // After successful login, redirect back to the intended page
    if (!req.user &&
        req.path !== '/login' &&
        req.path !== '/signup' &&
        !req.path.match(/^\/auth/) &&
        !req.path.match(/\./)) {
        req.session.returnTo = req.originalUrl;
    } else if (req.user &&
        (req.path === '/account' || req.path.match(/^\/api/))) {
        req.session.returnTo = req.originalUrl;
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public'), {maxAge: 31557600000}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/map', mapRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
