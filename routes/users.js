const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const joi = require('joi');
const passport = require('passport');
const path = require('path');
const User = require('../models/user');
const Contest = require('../models/contest');
const Ques = require('../models/ques');
const randomstring = require('randomstring');


const userschema = joi.object().keys({
    email: joi.string().email().required(),
    username: joi.string().required(),
    password: joi.string().regex(/^([a-zA-Z0-9]+){3,30}$/).required(),
    role: joi.string().required(),
    confirmationPassword: joi.any().valid(joi.ref('password')).required(),
    contact: joi.string().required()

});




const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    } else {
        req.flash('error', 'you must be registred to see this');
        res.redirect('/');
    }
}

const isNotAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        req.flash('error', 'you are already logged in');
        res.redirect('/');
    } else {
        return next();
    }
}

let cUser = "NULL";

router.route('/register')
    .get(isNotAuthenticated, (req, res) => {
        res.render('register');
    })
    .post(async(req, res, next) => {
        try {

            const result = joi.validate(req.body, userschema);
            // console.log(result);
            if (result.error) {
                req.flash('error', 'invalid data!');
                res.redirect('/users/register');
                return;
            }

            const user = await User.findOne({ 'email': result.value.email }, (err, res) => {
                if (err) throw err;
            });
            if (user) {

                req.flash('error', 'email already exist!');
                res.redirect('/users/register');
                return;
            }

            const usern = await User.findOne({ 'username': result.value.username });

            if (usern) {
                req.flash('error', 'username already exist!');
                res.redirect('/users/register');
                return;
            }

            const hash = await User.hashPassword(result.value.password)
                //console.log('hash', hash);

            const secretToken = randomstring.generate()
            result.value.secretToken = secretToken;
            result.value.active = false;

            delete result.value.confirmationPassword;
            result.value.password = hash;
            //console.log('new vlaues - ',result.value);

            const newuser = new User(result.value);
            //console.log('newuser - ', newuser)
            await newuser.save();
            req.flash('success', 'successfully registered');

            if (result.value.role === "admin") {
                res.redirect('/users/adminverify');
                return;
            } else {
                res.redirect('/users/verify');
            }

        } catch (error) {
            next(error);
        }

    });


router.route('/login')
    .get(isNotAuthenticated, (req, res) => {
        res.render('login');

    })
    .post(passport.authenticate('local', {
        successRedirect: '/users/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    }));
admin = false;
router.route('/dashboard')
    .get(isAuthenticated, (req, res) => {


        if (req.user.role === "admin") {
            admin = true;
        }

        res.render('dashboard', {
            username: req.user.username,
            admin: admin
        });
    });




router.route('/verify')
    .get(isNotAuthenticated, (req, res) => {
        res.render('verify');
    })
    .post(async(req, res, next) => {
        try {

            const { secretToken } = req.body;
            const user = await User.findOne({ 'secretToken': secretToken });
            if (!user) {
                req.flash('error', 'no user found');
                res.redirect('/users/verify');
                return;
            }

            user.active = true;
            user.secretToken = '';
            await user.save();
            req.flash('success', 'Thank you for registering!');
            res.redirect('/users/login');
        } catch (error) {
            next(error);
        }

    });


router.route('/adminverify')
    .get(isNotAuthenticated, (req, res) => {
        res.render('adminverify');
    })
    .post(async(req, res, next) => {
        try {

            const { adminToken } = req.body;

            if (adminToken === "adminToken") {
                req.flash('success', 'Admin User Verified!');
                res.redirect('/users/verify');
            } else {
                req.flash('error', 'Wrong Admin Code');
                res.redirect('/users/adminverify');
            }



        } catch (error) {
            next(error);
        }

    });



router.route('/logout')
    .get((req, res) => {
        req.logout();
        req.flash('success', 'logged out');
        res.redirect('/users/login');
    });



module.exports = router, isAuthenticated, isNotAuthenticated, admin;