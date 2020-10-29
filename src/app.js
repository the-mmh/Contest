const express = require('express');
const morgan = require('morgan')
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const expressHandlebars = require('express-handlebars');
const flash = require('connect-flash');
var busboy = require('connect-busboy');

const session = require('express-session');

const app = express();
app.use(busboy());
const mongoose = require('mongoose');
const passport = require('passport');
// const socketio = require('socket.io');


require('./config/passport');

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;

const uri = "mongodb+srv://piyushg9794:passwordnahi@123@contest.j9ls1.mongodb.net/logsn";
const uri1 = "mongodb://localhost:27017/logsn";
mongoose.connect(uri, () => console.log("App Db success"))
    .catch(err => console.log(err));

app.use(morgan('dev'));

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', expressHandlebars({
    defaultLayout: 'layout',
    helpers: {
        ifnoteq: (a, b, options) => {
            if (a == b) { return options.fn(this); }
            return options.inverse(this);
        },
        ifeq: (a, b, options) => {
            if (a == b) { return options.fn(this); }
            return options.inverse(this);
        }
    }
}));
app.set('view engine', 'handlebars');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var age = 7 * 24 * 60 * 60 * 1000;


app.use(session({
    cookie: {
        maxAge: age
    },
    secret: 'btpsecret',
    saveUninitialized: false,
    resave: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    res.locals.isAuthenticated = req.user ? true : false;

    next();

});


app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/contests', require('./routes/contests'));
app.use('/admin', require('./routes/admin'));



const amqp = require('./services/recieveverdict');

app.use((req, res, next) => {
    req.flash('error', 'Page not found');
    res.redirect('/');
    
})

const server = app.listen(process.env.PORT || 5000, () => {
    console.log('Server started on 5000!');
    amqp.recieveverdict();
});

var io = require('socket.io').listen(server);



module.exports.io = io;
