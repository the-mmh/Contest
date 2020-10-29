const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');
const bcrypt = require('bcryptjs');

passport.serializeUser((user, done) => {
    // console.log("user -- ", user);
    done(null, user.id);
});

passport.deserializeUser(async(id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

passport.use('local', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: false
}, async(emailousername, password, done) => {
    try {
        var user = await User.findOne({ 'email': emailousername });
        if (!user) {

            user = await User.findOne({ 'username': emailousername });
            if (!user) {
                return done(null, false, { message: "Unknown user" });
            }
        }

        if (!user.active) {
            return done(null, false, { message: "You haven't verified email yet" });
        }

        var res = await bcrypt.compare(password, user.password);


        if (!res) {
            return done(null, false, { message: "incorrect password" });
        } else {
            return done(null, user);
        }


        // if (!isValid) {


        // }






    } catch (error) {
        return done(error, false);
    }
}));