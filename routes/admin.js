const express = require('express');
const router = express.Router();

const bodyParser = require('body-parser');

const Ques = require('../models/ques');
const Contest = require('../models/contest');

const fs = require('fs');
const url = require('url');
var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



router.route('/')
    .get(async(req, res) => {
        if (req.user === undefined) {
            req.flash('error', 'you must be registered and admin');
            res.redirect('/users/login');
            return;
        }
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
            return;
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
            return;
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

var f1 = -1,
    f2 = -1,
    f = 1,
    qd = "score";

router.route('/allprob')

.get(async(req, res) => {
        try {

            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/users/login');
                return;
            }

            var q = url.parse(req.url, true).query;

            if (q != null) {
                qd = (await JSON.parse(JSON.stringify(q)))["sortby"];
            }

            var all = [],
                ch = null;

            await Ques.find({ 'asked': false }, "probCode score", async(err, res) => {
                if (err) throw err;
                all = await JSON.parse(JSON.stringify(res));
            })

            all.sort((a, b) => {
                var x = a[qd],
                    y = b[qd];

                if (x > y) return f;
                else if (x < y) return -f;

            })

            res.render('allprob', {
                obj: all
            });
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }
    })
    .post(async(req, res) => {
        var data = JSON.parse(JSON.stringify(req.body));
        var key = data["sort"];
        if (key === "score") {
            f1 *= -1;
            f = f1;
        } else {
            f2 *= -1;
            f = f2;
        }
        console.log(key, f);
        res.redirect(`/admin/allprob?sortby=${key}`);

    })



router.route('/statement/:code')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/users/login');
                return;
            }
            var code = req.params.code,
                path = __dirname + "/" + code + "/" + code;

            var statement = fs.readFileSync(path + "s.txt", 'utf-8');
            var input = fs.readFileSync(path + "i.txt", 'utf-8');
            var output = fs.readFileSync(path + "o.txt", 'utf-8');


            var all = [];
            await Ques.findOne({ 'probCode': code }, "probCode score probSetter probTester tl ml dateAdded", (err, res) => {
                if (err) throw err;
                all = res;

            })

            res.render('statement', {
                statement: statement,
                code: code,
                input: input,
                output: output,
                tester: all.probTester,
                setter: all.probSetter,
                tl: all.tl,
                ml: all.ml,
                date: all.dateAdded
            })
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }

    })


module.exports = router;