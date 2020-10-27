const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const User = require('../models/user');
const Ques = require('../models/ques');
const Submission = require('../models/submission');
const Contest = require('../models/contest');
const { exec } = require("child_process");
const isAuthenticated = require('./users');
const notifier = require('node-notifier');
const url = require('url');
const amqp = require('../services/sendamqp');
var fs = require('fs');
const main = require('../app');
const stream = require('stream');

var azure = require('../services/connectazure');


var app = express();
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());



var contestSchema = new Contest;
var allcontest;
contestSchema.score = {};

let probs = {};



router.route('/')
    .get(async(req, res) => {

        res.render('contests');
    })
    .post(async(req, res) => {
        try {
            var obj = req.body;

            var contestname = Object.keys(obj)[0];
            await Contest.find({ 'name': contestname }, (err, res) => {
                if (err) throw err;
                contestSchema = res[0];
            })
            res.redirect('/contests/quespage');
        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/contests');
        }
    });

router.route('/contestdetails')
    .get(async(req, res) => {

        try {

            allcontest = await Contest.find({ 'done': false }, 'name code problems date duration done');

            var crname = [],
                crcode = [],
                crdate = [],
                crdur = [],
                cename = [],
                cecode = [],
                cedate = [],
                cedur = [],
                cuname = [],
                cucode = [],
                cudate = [],
                cudur = [],
                now = Date.now();

            for (let i = 0; i < allcontest.length; i++) {
                var date = allcontest[i].date.getTime(),
                    dur = allcontest[i].duration;
                if (now >= date && (date + (dur * 60 * 60 * 1000)) >= now) {
                    crname.push(allcontest[i].name);
                    crcode.push(allcontest[i].code);
                    crdate.push(allcontest[i].date);
                    crdur.push(dur);
                } else if ((date + dur * 60 * 60 * 1000) < now) {
                    cename.push(allcontest[i].name);
                    cecode.push(allcontest[i].code);
                    cedate.push(allcontest[i].date);
                    cedur.push(dur);
                } else {
                    cuname.push(allcontest[i].name);
                    cucode.push(allcontest[i].code);
                    cudate.push(allcontest[i].date);
                    cudur.push(dur);
                }
            }

            res.send({
                CRName: crname,
                CRCode: crcode,
                CRDate: crdate,
                crdur: crdur,
                CPName: cename,
                CPCode: cecode,
                CPDate: cedate,
                cpdur: cedur,
                CUName: cuname,
                CUCode: cucode,
                CUDate: cudate,
                cudur: cudur,
            });
        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/contests');
        }
    });

router.route('/queslist')

.get(async(req, res) => {
    var date;
    var dur = contestSchema.duration;
    var pC = [],
        ccode = contestSchema.code;

    var data = await Contest.findOne({ 'code': ccode }, 'date duration problems');
    date = data.date.getTime();
    dur = data.duration;
    pC = data.problems;

    var PC = [];
    for (let i = 0; i < pC.length; i++) {
        data = await Ques.findOne({ 'probCode': pC[i] }, 'score tl ml');
        var ar = [];
        ar.push(pC[i]);
        ar.push(data["tl"]);
        ar.push(data["ml"]);
        ar.push(data["score"]);
        PC.push(ar);
    }
    pC = PC;


    var now = Date.now();
    // console.log("pc -- ", pC);
    // console.log("cont date, now -- ", date, now);
    if (now >= date && (date + (dur * 60 * 60 * 1000)) >= now) {
        res.send({

            CProblems: pC,
            pt: "Problems",
            CStatus: "Contest is running",
        });
    } else if ((date + dur * 60 * 60 * 1000) < now) {

        res.send({

            CProblems: pC,
            pt: "Problems",
            CStatus: "Contest ended",
        });
    } else {
        res.send({

            CProblems: [],
            pt: "Problems will be available soon",
            CStatus: "Contest is not yet started",
        });
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


router.route('/quespage')

.get(async(req, res) => {
    // try {
    if (req.user !== undefined) {
        res.render('quespage', {
            CName: contestSchema.name,
            CCode: contestSchema.code,
            user: req.user.username
        });
    } else {
        res.render('quespage', {
            CName: contestSchema.name,
            CCode: contestSchema.code
        });
    }

})


router.route('/quespage/prob/:probCode')

.get(async(req, res) => {

    try {

        var final1 = {},
            code = req.params.probCode;
        res.render('prob', {


            CPCode: code,

        })


    } catch (error) {
        req.flash('error', 'Some error occurred');
        res.redirect('/contests');
    }
})

.post(async(req, res, next) => {
    try {
        res.redirect('/contests/submit/' + req.params.probCode);
    } catch (error) {
        next(error);
    }

});

router.route('/getprobmain/:probCode')
    .get(async(req, res) => {
        try {

            var final1 = {},
                code = req.params.probCode;

            const shareName = "questions";

            const fileName = code + '/' + code;
            final1.statement = `${(await azure.azurefilesread(shareName, fileName+ "s.txt")).toString()}`;
            final1.input = `${(await azure.azurefilesread(shareName, fileName+ "i.txt")).toString()}`;
            final1.output = `${(await azure.azurefilesread(shareName, fileName+ "o.txt")).toString()}`;
            final1 = JSON.stringify(final1);

            console.log(final1);
            res.send({
                obj: final1,
            });

        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/contests');
        }
    })



router.route('/getprobdetails/:probCode')
    .get(async(req, res) => {
        try {

            var final1 = {},
                code = req.params.probCode;


            final1 = await Ques.findOne({ 'probCode': code }, 'probCode probSetter asked probTester dateAdded tl ml numofinputfiles score');

            res.send({
                obj: JSON.stringify(final1),
            });

        } catch (error) {
            req.flash('error', 'Some error occurred');
            res.redirect('/contests');
        }
    })




router.route('/submit/:probCode')

.get((req, res) => {
    if (req.user === undefined) {
        req.flash('error', 'You are not logged in');
        res.redirect('/contests');
        return;
    }
    if (req.user) {

        res.render('editor', {
            who: req.user.username,
            which: req.params.probCode,
            flang: req.user.flang,
            code: req.user.template
        });
    }


})

.post(async(req, res) => {

    try {
        if (req.user === undefined) {
            req.flash('error', 'Some error occurred');
            res.redirect('/contests');
            return;
        }

        subdate = Date().split("GMT")[0];
        subdatestring = Date.now().toString();
        // console.log("Date -- ", subdatestring);

        req["submitTime"] = new Date().getTime();

        var reqbody = {};

        reqbody = req.body;

        Object.setPrototypeOf(reqbody, Object);
        // console.log(reqbody);
        if (req.user == undefined) {
            req.user = {};
            req.user.username = "none";
        }

        var sub = new Submission();
        const uCode = ((reqbody.code).toString());
        var prC = req.params.probCode;
        sub.s_id = prC + req.user.username + subdatestring.trim();
        sub.ccode = contestSchema.code;
        sub.code = uCode;
        sub.language = reqbody.Language;
        sub.who = req.user.username;
        sub.when = req.submitTime;
        sub.which = prC;
        sub.time = 0;
        sub.memory = 0;
        sub.verdict = "Compiling";

        // console.log("sub -- ", sub);

        await sub.save();

        var date, now = Date.now();
        var dur = contestSchema.duration;
        var gett;
        gett = await Contest.findOne({ 'code': contestSchema.code }, 'date duration');

        date = gett.date.getTime();
        dur = gett.duration;


        if (now >= date && (date + (dur * 60 * 60 * 1000)) >= now) {

            var lang = sub.language;
            var command;
            var ext;
            switch (lang) {
                case 'C++':
                    command = "g++";
                    ext = ".cpp";
                    break;
                case 'Python':
                    command = "python -m py_compile";
                    ext = ".py";
                    break;
                case 'C':
                    command = "gcc";
                    ext = ".c";
                    break;
                case 'Java':
                    command = "javac";
                    ext = ".java";
                    break;
            }

            await azure.azurefilescreate('submissions', sub.s_id + ext, sub.code);
            let bufst = new stream.PassThrough();

            path = __dirname + "/submissions/" + sub.s_id + ext;
            await azure.azuresubmissionread('submissions', sub.s_id + ext, path);
            compilecommand = command + " " + path;
            console.log("compile command -- ", compilecommand);

            exec(compilecommand, async(err, stdout, stderr) => {
                if (err) {
                    console.log("Compile Error");
                    main.io.emit('change', {
                        verdict: "Compilation Error",
                        time: 0,
                        memory: 0
                    })
                    Submission.updateOne(sub, { $set: { 'verdict': "CE", 'time': 0, 'memory': 0 } }, (err, res) => {
                        if (err) throw err;
                    });
                } else {
                    console.log("Compile Success");
                    Submission.updateOne(sub, { $set: { 'verdict': "In queue", "time": 0, "memory": 0 } }, (err, res) => {
                        if (err) throw err;
                    });

                    var topush = sub.s_id;
                    amqp.sendamqp(topush);
                    console.log("Queued");

                }

                fs.unlinkSync(path, (err) => {
                    if (err) throw err;
                });
            })
            res.redirect("/users/submissions/" + req.user.username + "/submissions/1");
        } else if ((date + (dur * 60 * 60 * 1000)) < now) {
            res.redirect("/contests/quespage");
            notifier.notify('Contest is ended');
            req.flash('error', "Contest is ended");

        } else {
            req.flash('error', "Contest is not yet started");
            res.redirect("/contests/quespage");

        }

    } catch (error) {
        req.flash('error', "Sorry, Some error ocurred");
        res.redirect("/contests");
    }

});


router.route('/status/:page')
    .get(async(req, res) => {
        // try {
        // var subs = [],
        //     res1;
        // res1 = await Submission.find({}, 's_id who when which verdict time memory');

        // var temp = {};


        // for (let i = res1.length - 1; i >= 0; i--) {
        //     var obj = [];
        //     obj.push(res1[i].s_id);
        //     obj.push(res1[i].who);
        //     obj.push(res1[i].which);
        //     obj.push(res1[i].when);

        //     obj.push(res1[i].verdict);
        //     obj.push(res1[i].time);
        //     obj.push(res1[i].memory);
        //     temp[res1[i].when] = obj;
        // }
        // var temp1 = Object.keys(temp);

        // for (let i = 0; i < temp1.length; i++) {

        //     subs.push(temp[temp1[i]]);
        // }





        // var page = Number(req.params.page) || 1;
        // var numofsubspage = 5;

        // var last = Math.ceil(subs.length / (numofsubspage));
        // var prev = Math.max(page - 1, 1);
        // var next = Math.min(page + 1, last);
        // var mid = Math.floor((page + last) / 2);
        // var midp = Math.floor((page + 1) / 2);

        // var f = 1;
        // var i1, i2;
        // i1 = (Math.max((page - 1), 0) * (numofsubspage));
        // i2 = i1 + numofsubspage;

        // var checkm = true,
        //     checkp = true;

        // if (midp === page) checkp = false;
        // if (mid === page) checkm = false;

        // res.render('status', {
        //         subs: subs.slice(i1, i2),
        //         prev: prev,
        //         mid: mid,
        //         midp: midp,
        //         next: next,
        //         first: f,
        //         checkp: checkp,
        //         checkm: checkm,
        //         last: last,
        //         page: page,
        //         nos: numofsubspage,
        //     })
        if (req.user !== undefined) {
            res.render("status", {
                user: req.user.username
            });
        } else {
            res.render("status");
        }

        // } catch (error) {
        //     req.flash('error', "Sorry, Some error ocurred");
        //     res.redirect("/contests");
        // }
    });



router.route('/statusdetails/:page')
    .get(async(req, res) => {

        var subs = [],
            res1;
        res1 = await Submission.find({}, 's_id who when which verdict time memory language');

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
        var numofsubspage = 50;

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




router.route('/ranklist/:code')
    .get(async(req, res) => {
        var user = undefined;
        if (req.user !== undefined) {
            user = req.user.username;
        }
        res.render('ranklist', { ccode: req.params.code, user: user });
    });



var ranksort = {};
ranksort["rank"] = -1;
ranksort["username"] = -1;
ranksort["score"] = -1;
ranksort["penalty"] = -1;


router.route('/getranklist/:code')

.get(async(req, res) => {

    // try {
    var q = url.parse(req.url, true).query,
        qd;

    if (q !== null) {
        qd = (await JSON.parse(JSON.stringify(q)))["sortby"];
    }

    if (qd !== undefined) {

        if (ranksort[qd] === undefined) {
            ranksort[qd] = -1;
        }
        ranksort[qd] *= -1;
    } else {
        qd = "rank";
        ranksort[qd] = 1;
    }

    var currentuser = [],
        contest = {},
        code = req.params.code,
        scores = [],
        pC = [],
        cpC = {};

    contest = await Contest.find({ 'code': code });

    if (contest[0].score) {

        pC = contest[0].problems;
        for (let i = 0; i < pC.length; i++) {
            if (cpC[pC[i]] === undefined) {
                cpC[pC[i]] = 1;
            } else {
                cpC[pC[i]]++;
            }
        }
        contest = contest[0].score;

        if (req.isAuthenticated()) {
            if (contest[req.user.username] !== undefined) {
                currentuser.push(req.user.username);

                currentuser.push(contest[req.user.username]["score"]);
            }
        }

        Object.keys(contest).forEach(k => {
            var arr = {};
            arr.rank = (contest[k]["rank"]);

            arr.username = (k);

            arr.score = (contest[k]["score"]);

            arr.penalty = (contest[k]["penalty"]);


            for (let it = 0; it < pC.length; it++) {
                if (contest[k][pC[it]] !== undefined) {
                    if (contest[k][pC[it]]["score"] === undefined) {
                        arr[pC[it]] = 0;
                    } else {
                        arr[pC[it]] = (contest[k][pC[it]]["score"]);
                    }

                } else {
                    arr[pC[it]] = 0;
                }
            }

            scores.push(arr);
        })

    }



    var show = {};


    if (scores.length > 0) {

        scores.sort((a, b) => {
            if (a["score"] < b["score"]) return 1;
            else if (a["score"] > b["score"]) return -1;
            if (a["penalty"] < b["penalty"]) return -1;
            else if (a["penalty"] > b["penalty"]) return 1;
            if (a["username"] < b["username"]) return 1;
            else if (a["username"] > b["username"]) return -1;
        });

        for (let i = 0; i < scores.length; i++) {
            scores[i]["rank"] = i + 1;
        }

        scores.sort((a, b) => {
            if (a[qd] > b[qd]) return ranksort[qd];
            else if (a[qd] < b[qd]) return -ranksort[qd];
            else if (a["rank"] < b["rank"]) return -1;
            else if (a["rank"] > b["rank"]) return 1;
        });

        for (let i = 0; i < scores.length; i++) {

            show[scores[i]["username"]] = contest[scores[i]["username"]];
            show[scores[i]["username"]]["problem"] = {};
            var pcodes = {};
            for (let j = 0; j < pC.length; j++) {
                pcodes[pC[j]] = '-';
            }
            Object.keys(contest[scores[i]["username"]]).forEach(k => {

                if (pcodes[k] === '-') {
                    if (contest[scores[i]["username"]][k]["p"] === undefined) {
                        contest[scores[i]["username"]][k]["p"] = 0;
                    }
                    pcodes[k] = {
                        "score": (contest[scores[i]["username"]][k]["score"] || 0),
                        "p": contest[scores[i]["username"]][k]["p"]
                    }
                }

            })

            show[scores[i]["username"]]["problem"] = pcodes;
            show[scores[i]["username"]]["rank"] = scores[i]["rank"];

        }

    }




    var users = Object.keys(show),
        data = "";

    for (let i = 0; i < users.length; i++) {
        var k = users[i];
        data += '<tr>';

        data += '<td>' + show[k]['rank'] + '</td>';

        data += '<td><a href="/users/user/' + k + '">' + k + '</a></td>';
        data += '<td>' + (show[k].score || 0).toString() + '</td>';
        data += '<td>' + (show[k].penalty || 0).toString() + '</td>';

        pC.forEach((key) => {
            data += '<td>' + (show[k]['problem'][key]['score'] || 0).toString() + "-" + (show[k]['problem'][key]['p'] || 0).toString() + '</td>';
        });
        data += '</tr>';
    }

    // console.log(show);

    res.send({
            pC: pC,
            data: show,
            cuser: currentuser,
            det: data
        })
        // }
        //  catch (error) {
        //     req.flash('error', 'Some error occurred');
        //     res.redirect('/contests');
        // }
});



module.exports = router;