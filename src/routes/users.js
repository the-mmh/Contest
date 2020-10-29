const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const joi = require('joi');
const passport = require('passport');
const path = require('path');
const User = require('../models/user');
const Submission = require('../models/submission');
const Contest = require('../models/contest');
const Ques = require('../models/ques');
const randomstring = require('randomstring');
const request = require('request');
var nodemailer = require('nodemailer');
var emailconname = "iiitbloog@gmail.com";
var emailconpass = "Gaurav@63";
var userupdate = "https://iiitp-blog.herokuapp.com/updateUser";

const stream = require('stream');

var azure = require('../services/connectazure');


const userschema = joi.object().keys({
    email: joi.string().email().required(),
    username: joi.string().required(),
    password: joi.string().regex(/^([a-zA-Z0-9]+){3,30}$/).required(),
    role: joi.string().required(),
    confirmationPassword: joi.any().valid(joi.ref('password')).required(),
    flang: joi.string().required(),
    template: joi.string().required(),
    mis: joi.string().required(),
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




router.route('/register')
    .get(isNotAuthenticated, (req, res) => {
        res.render('register');
    })
    .post(async(req, res, next) => {
        try {
            request(userupdate);
            const result = joi.validate(req.body, userschema);

            if (result.error) {
                req.flash('error', 'invalid data!');
                res.redirect('/users/register');
                return;
            }

            var checkemail = '',
                bodyemail = result.value.email,
                f = 0;
            for (let i = 0; i < bodyemail.length; i++) {
                if (f === 1) {
                    checkemail += bodyemail[i];
                }
                if (bodyemail[i] === '@') {
                    f = 1;
                }

            }
            console.log('checkemail -- ', checkemail);
            if (checkemail === 'cse.iiitp.ac.in' || checkemail === 'ece.iiitp.ac.in' || checkemail === 'iiitp.ac.in') {




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
                // console.log('new vlaues - ', result.value);

                const newuser = new User(result.value);
                try {
                    var transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: emailconname,
                            pass: emailconpass
                        }
                    });
                    var mailOptions = {
                        from: emailconname,
                        to: req.body.email,
                        subject: 'Confirmation mail for Bit Legion',
                        text: "Hello " + req.body.username + "\n Here is Secret token for confirmation gmail on IIITBLOOG: \n " + newuser.secretToken
                    };
                    await transporter.sendMail(mailOptions, function(error, info) {
                        if (error) {
                            console.log(error);
                        } else {
                            console.log('Email sent: ' + info.response);
                        }
                    });
                } catch (error) {
                    req.flash('error', 'Looks like mail doesn"t exist, contact administrator for queries');
                    res.redirect('/users/register');
                    return;
                }

                
                // console.log('newuser - ', newuser)
                await newuser.save();

                req.flash('success', 'successfully registered');
                request(userupdate);

                // if (result.value.role === "admin") {
                //     res.redirect('/users/adminverify');
                //     return;
                // } else {
                res.redirect('/users/verify');
                // }
            } else {
                req.flash('error', 'Register using IIITP provided email id');
                res.redirect('/users/register');
                return;
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
    .get(isAuthenticated, async(req, res) => {
        if (req.user.role === "admin") {
            admin = true;
        } else {
            admin = false;
        }

        var allrating = await User.findOne({ 'username': req.user.username }, 'allrating');


        var dates = Object.keys(allrating['allrating']);

        dates.sort((a, b) => {
            if (a < b) return 1;
            else return 0;
        });


        var tosend = [];
        allrating = allrating['allrating'];
        for (let i = 0; i < Math.min(dates.length, 5); i++) {
            tosend.push(allrating[dates[i]]);
        }


        var participation = false;

        if (tosend.length > 0) {
            participation = true;
        }

        res.render('dashboard', {
            username: req.user.username,
            email: req.user.email,
            contact: req.user.contact,
            admin: admin,
            flang: req.user.flang,
            code: req.user.template,
            crating: req.user.rating,
            ratingdata: tosend,
            mis: req.user.mis,
            participation: participation
        });
    });




router.route('/verify')
    .get(isNotAuthenticated, (req, res) => {
        res.render('verify');
    })
    .post(async(req, res, next) => {

        try {
            request(userupdate);
            const { secretToken } = req.body;
            const user = await User.findOne({ 'secretToken': secretToken });
            if (!user) {
                req.flash('error', 'no user found');
                res.redirect('/users/verify');
                return;
            }

            user.active = true;
            user.rating = 1500;
            user.allrating = {};
            user.noofcontests = 0;
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


router.route('/')
    .post(async(req, res) => {
        var data = await JSON.parse(JSON.stringify(req.body));
        res.redirect('/users/user/' + data.username);
    })

router.route('/user/:user')
    .get(async(req, res) => {

        var user = req.params.user;

        if (req.user !== undefined) {

            if (req.user.username === user) {
                res.redirect('/users/dashboard');
                return;
            }
        }
        var userdata = await User.findOne({ 'username': user });

        if (userdata === null) {
            res.render('usernotfound');
        } else {


            var tosend = [];

            var allrating = userdata.allrating;

            var dates = Object.keys(allrating);

            dates.sort((a, b) => {
                if (a < b) return 1;
                else return 0;
            });


            for (let i = 0; i < Math.min(dates.length, 5); i++) {
                tosend.push(allrating[dates[i]]);
            }

            var participation = false;

            if (tosend.length > 0) {
                participation = true;
            }
            res.render('profile', {
                username: userdata.username,
                mis: userdata.mis,
                rating: userdata.rating,
                userdata: tosend,
                participation: participation
            })
        }
    })

// template edit
router.route('/edittemp')
    .post(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'You must be registered to see this');
            res.redirect('/users/login');
            return;
        }
        var data = req.body;
        data = await JSON.parse(JSON.stringify(data));
        var flang = req.body.flang;
        var template = req.body.template;


        await User.updateOne({ "username": req.user.username }, { $set: { "flang": flang } });
        await User.updateOne({ "username": req.user.username }, { $set: { "template": template } });
    });
// added close

//
router.route('/report')
    .get((req, res) => {
        res.render("report");
    })
    .post(async(req, res) => {
        var transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: emailconname,
                pass: emailconpass
            }
        });
        var mailOptions = {
            from: emailconname,
            to: "sarthak.igupta7379@gmail.com",
            subject: 'plag Report for Bit Legion',
            text: "Submission: " + req.body.suba + "\nMatched Submission: \n " + req.body.subb
        };
        await transporter.sendMail(mailOptions, function(error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
            0
        });
        res.redirect("/");
    })


//

router.route('/edit')
    .post(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'You must be registered to see this');
            res.redirect('/users/login');
            return;
        }
        var data = req.body;
        data = await JSON.parse(JSON.stringify(data));
        var newcontact = data.newcontact || req.user.contact;


        await User.updateOne({ "username": req.user.username }, { $set: { "contact": newcontact } });
    });

router.route('/submissions/:user/submissions/:page')
    .get(isAuthenticated, async(req, res) => {
        res.render('submissions', {
            user: req.params.user
        })
    });

router.route('/submissions/:user/getsub/:page')
    .get(async(req, res) => {

        var subs = [],
            res1, user = req.params.user;
        res1 = await Submission.find({ 'who': user }, 's_id who when which verdict time memory language');

        var temp = {};

        for (let i = 0; i < res1.length; i++) {
            var x = res1[i]["when"];
            x = x.toString();
            x = x.split(" ");
            x.pop();
            x.pop();
            x.pop();
            x.pop();

        }

        for (let i = res1.length - 1; i >= 0; i--) {
            var obj = [];
            obj.push(res1[i].s_id);
            obj.push(res1[i].who);
            obj.push(res1[i].which);
            obj.push(res1[i].when);
            obj.push(res1[i].verdict);
            obj.push(res1[i].time);
            obj.push(res1[i].memory);
            obj.push(res1[i].language);
            temp[res1[i].when] = obj;
        }

        var temp1 = Object.keys(temp);

        for (let i = 0; i < temp1.length; i++) {

            subs.push(temp[temp1[i]]);
        }


        var page = Number(req.params.page) || 1;
        var numofsubspage = 25;

        var last = Math.ceil(subs.length / (numofsubspage));
        var prev = Math.max(page - 1, 1);
        var next = Math.min(page + 1, last);
        var mid = Math.floor((page + last) / 2);
        var midp = Math.floor((page + 1) / 2);

        var f = 1;
        var i1, i2;
        i1 = (Math.max((page - 1), 0) * (numofsubspage));
        i2 = i1 + numofsubspage;

        var checkm = true,
            checkp = true;

        if (midp === page) checkp = false;
        if (mid === page) checkm = false;

        res.send({
            user: user,
            subs: subs.slice(i1, i2),
            prev: prev,
            mid: mid,
            midp: midp,
            next: next,
            first: f,
            checkp: checkp,
            checkm: checkm,
            last: last,
            page: page,
            nos: numofsubspage,
        });
    });


router.route('/usersubmission/:user/:s_id')
    .get(async(req, res) => {
        try {
            var s_id = req.params.s_id,
                user = req.params.user;
            var userdata;


            var code, codea = [];
            userdata = await Submission.findOne({ 's_id': s_id }, 'language ccode who when which verdict time memory');

            var allcontest = await Contest.find({ 'code': userdata.ccode }, 'date duration');


            var now = Date.now(),
                date = allcontest[0].date,

                dur = allcontest[0].duration;

            var ext, lang = userdata.language;
            console.log(lang);
            switch (lang) {
                case 'C++':
                    ext = ".cpp";
                    break;
                case 'Python':
                    ext = ".py";
                    break;
                case 'C':
                    ext = ".c";
                    break;
                case 'Java':
                    ext = ".java";
                    break;
            }


            if ((date.getTime() + dur * 60 * 60 * 1000) < now || (req.user || {}).username === userdata.who) {
                code = `${(await azure.azurefilesread('submissions', s_id + ext)).toString()}`;
                // console.log(code);
                console.log("code");
                res.render('usersubmission', {
                    code: code,
                    who: userdata.who,
                    which: userdata.which,
                    language: userdata.language,
                    verdict: userdata.verdict,
                    memory: userdata.memory,
                    time: userdata.time,
                    when: userdata.when,
                })
            } else {
                res.render('usersubmission', {
                    code: "Access Denied",
                    who: "NaN",
                    which: "NaN",
                    language: "NaN",
                    verdict: "NaN",
                    memory: "NaN",
                    time: "NaN",
                    when: "NaN",
                })
            }
        } catch (error) {
            req.flash('error', 'Some error (Possibly, submission with this id not present in cloud)');
            res.redirect('/contests');
        }

    })


router.route('/leaderboard/:page')
    .get(async(req, res) => {
        res.render('leaderboard');
    })

router.route('/getleaderboard/:page')
    .get(async(req, res) => {

        var userdata1 = await User.find({}, 'username rating allrating');

        var userdata = [];
        for (let i = 0; i < userdata1.length; i++) {
            var keys = Object.keys(userdata1[i].allrating);
            if (keys.length !== 0) {
                userdata.push(userdata1[i]);
            }

        }


        userdata.sort((a, b) => {
            if (a['rating'] < b['rating']) return 1;
            else if (a['rating'] > b['rating']) return -1;
            else if (a['username'] > b['username']) return 1;
            else return -1;
        });

        var z = 1;
        var rankarray = [];
        rankarray.push(z);

        for (let i = 1; i < userdata.length; i++) {
            z++;
            if (userdata[i - 1]['rating'] === userdata[i]['rating']) {
                rankarray.push(rankarray[i - 1]);
            } else {
                rankarray.push(z);
            }
        }

        var page = Number(req.params.page) || 1;
        var numofrespage = Math.min(userdata.length, 25);

        var last = Math.ceil(userdata.length / (numofrespage));
        var prev = Math.max(page - 1, 1);
        var next = Math.min(page + 1, last);
        var mid = Math.floor((page + last) / 2);
        var midp = Math.floor((page + 1) / 2);

        var f = 1;
        var i1, i2;
        i1 = (Math.max((page - 1), 0) * (numofrespage));
        i2 = i1 + numofrespage;

        var checkm = true,
            checkp = true;

        if (midp === page) checkp = false;
        if (mid === page) checkm = false;

        res.send({
            userdata: userdata.slice(i1, i2),
            rankarray: rankarray.slice(i1, i2),
            prev: prev,
            mid: mid,
            midp: midp,
            next: next,
            first: f,
            checkp: checkp,
            checkm: checkm,
            last: last,
            page: page,
            nos: numofrespage,
        })

    })


module.exports = router, isAuthenticated, isNotAuthenticated;
