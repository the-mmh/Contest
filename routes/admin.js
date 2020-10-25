const express = require('express');
const router = express.Router();

const Ques = require('../models/ques');
const Contest = require('../models/contest');
const amqp = require('../services/sendamqp');
const Window = require('window');
var azure = require('../services/connectazure');
const url = require('url');
var app = express();
var fs = require('fs');
var busboy = require('connect-busboy');
app.use(busboy);


router.route('/')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }

            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }
            res.render('admin');
        } catch (error) {
            req.flash('error', 'Sorry, some error occurred');
            res.redirect('/');
        }
    })


router.route('/addquestion')
    .get(async(req, res) => {
        try {
            // if (req.user === undefined) {
            //     req.flash('error', 'you must be registered and admin');
            //     res.redirect('/');
            //     return;
            // }
            // if (req.user.role !== "admin") {
            //     req.flash('error', 'you must be admin');
            //     res.redirect('/');
            //     return;
            // }
            res.render('addquestion');
        } catch (error) {
            req.flash('error', 'Sorry, Some error occurred');
            res.redirect('/');
        }
    })
    .post(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }

            const data = await JSON.parse(JSON.stringify(req.body));

            // if ((Object.keys(await JSON.parse(JSON.stringify(req.body)))).length === 0) {
            //     req.flash('error', "All fields are mandatory");
            //     res.redirect("/admin/addquestion");
            //     return;
            // }

            // console.log("addcontest -- ", data);

            f = false;


            await Ques.find({ 'probCode': data.probCode }, (err, res) => {

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

            // console.log("data -- ", data);
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
            res.redirect('/admin/uploadstatement');
        } catch (error) {
            req.flash('error', 'Sorry, Some error occured');
            res.redirect('/');
            throw error;
        }
    });

router.route('/admin/validatecode')
    .post(async(req, res) => {

        var data = await JSON.parse(JSON.stringify(req.body));
        var ch = await Ques.findOne({ 'probCode': data.code });
        var val = true;
        if (ch === null) {
            val = false;
        }

        res.send({
            value: val
        });
    })

router.route('/uploadstatement')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }
            res.render('uploadstatement1');
        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/');
        }
    })

router.route('/uploadstatement/:code')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }

            var code = req.params.code;

            var ch = await Ques.findOne({ 'probCode': code });

            if (ch === null) {
                req.flash('error', "No problem code found");
                res.redirect('/admin/uploadstatement');
                return;
            }

            await azure.createdirectory('questions', req.params.code);
            res.render('uploadstatement2', {
                code: req.params.code
            });
        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/admin/uploadstatement');
            return;
        }
    })
    .post(busboy({ immediate: true }), async(req, res) => {
        try {


            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }
            var code = req.params.code;

            var ch = await Ques.findOne({ 'probCode': code });

            if (ch === null) {
                req.flash('error', "No problem code found");
                res.redirect('/admin/uploadstatement');
                return;
            }

            req.pipe(req.busboy);

            var sharename = 'questions';


            console.log("DOne!");

            req.busboy.on('file', (fieldname, file, filename) => {
                console.log('fieldname -- ', fieldname);
                if (fieldname === 'statement') {
                    var content = '';
                    file.on('data', (data) => {
                        content += data;

                    }).on('end', async() => {

                        console.log("Checked -- ", filename);
                        await azure.createdirectoryfile(sharename, code, filename, content);
                    })
                } else if (fieldname === 'eitcs') {
                    var content = '';
                    file.on('data', (data) => {
                        content += data;
                    }).on('end', async() => {

                        console.log("Checked -- ", filename);
                        await azure.createdirectoryfile(sharename, code, filename, content);
                    })
                } else if (fieldname === 'eotcs') {
                    var content = '';
                    file.on('data', (data) => {
                        content += data;
                    }).on('end', async() => {

                        console.log("Checked -- ", filename);
                        await azure.createdirectoryfile(sharename, code, filename, content);
                    })
                } else if (fieldname === 'itcs') {
                    var content = '';

                    file.on('data', (data) => {
                        content += data;
                    }).on('end', async() => {

                        console.log("Checked -- ", filename);
                        await azure.createdirectoryfile(sharename, code, filename, content);
                    })
                } else if (fieldname === 'otcs') {

                    var content = '';
                    file.on('data', (data) => {
                        content += data;
                    }).on('end', async() => {

                        console.log("Checked -- ", filename);
                        await azure.createdirectoryfile(sharename, code, filename, content);
                    })
                }
            });
            req.busboy.on('finish', () => {
                req.flash('success', "Your files will be uploaded");
                res.redirect('/admin/uploadstatement');
            });


        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/admin/uploadstatement');
            return;
        }
    })



router.route('/addcontest')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }

            res.render('addcontest');
        } catch (error) {
            req.flash('error', 'Sorry, Some error occured');
            res.redirect('/');
        }
    })
    .post(async(req, res) => {
        try {

            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must admin');
                res.redirect('/');
                return;
            }


            // Start Contest Data validation

            var data = await JSON.parse(JSON.stringify(req.body));

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
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }
    });

var fl = {
    'score': -1,
    'code': -1
}
f = 1,
    qd = "score";

router.route('/allprob')
    .get(async(req, res) => {
        try {

            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }

            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }

            res.render('allprob');
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }
    })
    .post(async(req, res) => {
        try {

            if (req.user === undefined) {
                req.flash('error', 'you must be registered and admin');
                res.redirect('/');
                return;
            }

            if (req.user.role !== "admin") {
                req.flash('error', 'you must admin');
                res.redirect('/');
                return;
            }

            var data = JSON.parse(JSON.stringify(req.body));
            var key = data["sort"];
            res.write(key);
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }

    })



router.route('/allprob/query')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }
            var q = url.parse(req.url, true).query;

            if (q !== null) {
                qd = (await JSON.parse(JSON.stringify(q)))["sortby"];
            } else {
                qd = "code";
            }

            var all = [];

            await Ques.find({ 'asked': false }, "probCode score", async(err, res) => {
                if (err) throw err;
                all = await JSON.parse(JSON.stringify(res));
            })

            if (qd === undefined) {
                qd = "code";
                fl[qd] = 1;
            } else {
                fl[qd] *= -1;
                f = fl[qd];
            }


            if (qd === "code") qd = "probCode";
            all.sort((a, b) => {
                var x = a[qd],
                    y = b[qd];

                if (x > y) return f;
                else if (x < y) return -f;

            })

            res.send({
                obj: all
            });
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }
    })



router.route('/statement/:code')
    .get(async(req, res) => {
        try {
            if (req.user === undefined) {
                req.flash('error', 'you must be registered');
                res.redirect('/');
                return;
            }
            if (req.user.role !== "admin") {
                req.flash('error', 'you must be admin');
                res.redirect('/');
                return;
            }

            var code = req.params.code;


            res.render('statement', {

                code: code,

            })
        } catch (error) {
            req.flash('error', 'Some error ocurred');
            res.redirect('/admin');
        }

    })


module.exports = router;