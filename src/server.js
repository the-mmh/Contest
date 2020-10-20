const express = require('express');
const app = express();
const flash = require('connect-flash');
const mongoose = require('mongoose');
const amqp = require('./services/recieveamqp');

require('dotenv').config();

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
mongoose.Promise = global.Promise;

const uri = process.env.MONGO_URI;
mongoose.connect(uri, () => console.log("App Db success"))
    .catch(err => console.log(err));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_messages = req.flash('success');
    res.locals.error_messages = req.flash('error');
    res.locals.isAuthenticated = req.user ? true : false;

    next();

});

app.listen(process.env.PORT || 5010, function() {
    amqp.recieveamqp();
    console.log("server is running on port 5010");
});