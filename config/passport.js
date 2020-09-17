const passport=require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

passport.serializeUser((user, done) => {
	done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
	try{
		const user = await User.findById(id);
		done(null, user);
	} catch(error){
		done(error, null);
	}
});

passport.use('local', new LocalStrategy({
	usernameField: 'email',
	passwordField:  'password',
	passReqToCallback: false
}, async (email,password, done) => {
	try{
		const user = await User.findOne({'email':email});
		if(!user){
			return done(null, false, {message:"Unknown user"});
		}
		const isValid = User.comparePasswords(password, user.password);
		if(!isValid){
			return done(null, false, {message: "unknown password"});

		}

		if(!user.active){
			return done(null, false, {message: "You haven't verified email yet"});
		}

		return done(null, user);
	} catch(error){
		return done(error, false);
	}
}));