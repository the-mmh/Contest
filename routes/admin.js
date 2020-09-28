const express = require('express');
const router = express.Router();
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const User = require('../models/user');
const Ques = require('../models/ques');
const Submission = require('../models/submission');
const Contest = require('../models/contest');

app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());



router.route('/')
    .get(async(req, res) => {
        res.render('admin');
    })


router.route('/addquestion')
    .get(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'you must be registered and admin');
            res.redirect('/users/login');
            return;
        }
        res.render('addquestion');
    })
    .post(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'you must be registered and admin');
            res.redirect('/users/login');
            return;
        }
        const data = JSON.parse(JSON.stringify(req.body));
        f = false;
        await Ques.find({ 'probCode': data.probCode }, (err, res) => {
            console.log("found -- ", res);
            if (res.length) {
                req.flash('error', 'problem already in use');

                f = true;

            }
        });

        if (f) {
            res.redirect('/admin/addquestion');
        }
        var arr = Object.keys(data);
        for (var i = 0; i < arr.length; i++) {
            var key = arr[i];
            if (data[key].length === 0) {
                req.flash('error', 'All fields are mandatory!');
                f = true;
                break;
            }
        }
        if (f) {
            res.redirect('/admin/addquestion');
        }

        console.log("data -- ", data);
        var ques = new Ques(data);
        ques.asked = false;
        ques.dateAdded = new Date();
        f = true;
        await ques.save(async(err) => {
            if (err) {
                req.flash('error', 'error in saving question');
                f = false;
            }
        });
        if (f) {
            req.flash('success', 'question saved');
        }
        res.redirect('/admin/addquestion');
    });

router.route('/addcontest')
    .get(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'you must be registered and admin');
            res.redirect('/users/login');
            return;
        }
        res.render('addcontest');
    })
    .post(async(req, res) => {

        // Start Contest Data validation
        if (req.user === undefined) {
            req.flash('error', 'you must be registered and admin');
            res.redirect('/users/login');
            return;
        }

        var data = JSON.parse(JSON.stringify(req.body));

        var f = true;
        await Contest.findOne({ 'code': data.code }, (err, res) => {

            if (res) {
                req.flash('error', 'Code already exist!')
                f = false;
            }
        })

        if (!f) {
            res.redirect('/admin/addcontest');
            return;
        }

        if (data.code.length < 1) {
            req.flash('error', 'code length too short');
            res.redirect('/admin/addcontest');
            return;
        }

        if (data.name.length < 1) {
            req.flash('error', 'name length too short');
            res.redirect('/admin/addcontest');
            return;
        }

        f = true;
        var probs = data.problems.split(','),
            problems = [];

        for (var i = 0; i < probs.length; i++) {
            probs[i] = probs[i].trim();
            if (probs[i].length > 0) {
                problems.push(probs[i]);
            }
        }

        console.log("problems -- ", problems);

        if (!f) {
            res.redirect('/admin/addcontest');
            return;
        }

        if (data.duration <= 0) {
            req.flash('error', 'Contest duration must be positive');
            res.redirect('/admin/addcontest');
            return;
        }

        var curr = new Date;
        var cd = new Date(data.date);

        curr = new Date(curr.getTime() + (2 * 60 * 60 * 1000));


        if (cd.getTime() < curr.getTime()) {
            req.flash('error', 'Contest should be 2 hours later atleast!');
            res.redirect('/admin/addcontest');
            return;
        }

        f = true;
        for (var i = 0; i < problems.length; i++) {
            var que = problems[i];
            await Ques.findOne({ 'probCode': que }, (err, res) => {

                if (res === null) {
                    f = false;
                } else {
                    if (res.asked === true) {
                        f = false;
                    } else {
                        Ques.updateOne({ 'probCode': que }, { $set: { 'asked': true } }, (err) => {
                            if (err) throw err;
                        })
                    }
                }
            })
            if (!f) {
                req.flash('error', 'Invalid Problem Codes, check valid ploblems list from below given link!');
                res.redirect('/admin/addcontest');
                return;
            }
        }
        if (!f) {
            req.flash('error', 'Invalid Problem Codes, check valid ploblems list from below given link!');
            res.redirect('/admin/addcontest');
            return;
        }

        data.problems = problems;

        //  Done with Contest Data Validation



        data.done = false;
        data.score = {};
        await new Contest(data).save();
        console.log("Saved");
        req.flash('success', 'Contest Saved Successfully');
        res.redirect('/admin');
    });


router.route('/allprob')
    .get(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'you must be registered and admin');
            res.redirect('/users/login');
            return;
        }
        var all = [];
        await Ques.find({ 'asked': false }, "probCode probSetter probTester score tl ml dateAdded", (err, res) => {
            if (err) throw err;
            all = res;

        })
        var obj = [];
        for (var i = 0; i < all.length; i++) {
            var d = all[i];
            var a = [];
            a.push(d['probCode']);
            a.push(d['probSetter']);
            a.push(d['probTester']);
            a.push(d['score']);
            a.push(d['tl']);
            a.push(d['ml']);
            a.push(d['dateAdded']);
            obj.push(a);
        }
        res.render('allprob', {
            obj: obj,
            all: all
        });
    })


module.exports = router;