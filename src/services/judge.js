const Ques = require('../models/ques');
const Submission = require('../models/submission');
const Contest = require('../models/contest');
const { c, cpp, node, python, java } = require('compile-run');
var azure = require('./connectazure');
var fs = require('fs');
//const notifier = require('node-notifier');
const amqp = require('../services/sendverdict');
const qrate = require('qrate');

const worker = async(pushed, done) => {

    var contestSchema;
    var sub;
    console.log('worker started');

    sub = await Submission.findOne({ 's_id': pushed });

    contestSchema = await Contest.findOne({ 'code': sub.ccode });

    if (contestSchema.score === undefined) {
        contestSchema.score = {};
    }
    var score = contestSchema.score;

    if (score[sub.who] === undefined) {
        score[sub.who] = {};
    }

    await Ques.findOne({ 'probCode': sub.which }, 'numofinputfiles', (err, res) => {
        if (err) throw err;
        numofinputfiles = res.numofinputfiles;
    })

    var flag = 1;
    var qno;
    var useroutput, error;
    var verd = {},
        ut = {};

    await Ques.findOne({ 'probCode': sub.which }, 'tl ml score', (err, res) => {
        if (err) throw err;
        ut = res;
    });

    function run_test(err, res) {

        if (err) {
            console.log(err);
            verd.time = 0;
            verd.memory = 0;
        } else {


            useroutput = res.stdout;
            if (verd.time === undefined) {
                verd.time = 0;
            }
            if (verd.memory === undefined) {
                verd.memory = 0;
            }

            verd.time = Math.max(Number(verd.time), Number(res.cpuUsage / 1000));
            verd.memory = Math.max(Number(verd.memory), Number(Math.floor(res.memoryUsage / 1024)));
            if (res.errorType) {

                error = res.errorType;
                flag = 0;
            } else if (Number(verd.time) > Number(ut.tl * 1000)) {
                error = "tle";
                verd.time = (ut.tl * 1000) + 1;
                flag = 0;
            } else if (verd.memory > ut.ml * 1024) {
                error = "mle";
                verd.memory = (ut.ml * 1024) + 1;
                flag = 0;
            }
        }

    }


    var lang = sub.language;
    var ext;
    switch (lang) {
        case 'C++':
            ext = '.cpp';
            break;
        case 'Python':
            ext = '.py';
            break;
        case 'C':
            ext = '.c';
            break;
        case 'Java':
            ext = '.java';
            break;
    }

    for (let i = 0; i < numofinputfiles; i++) {

        const input = `${(await azure.azurefilesread("questions", sub.which + "/" + sub.which + "i_" + (i + 1).toString() + ".txt")).toString()}`;
        const output = `${(await azure.azurefilesread("questions", sub.which + "/" + sub.which + "o_" + (i + 1).toString() + ".txt")).toString()}`;

        const path = __dirname + '/submissions/' + sub.s_id + ext;
        console.log(input, output);
        await azure.azuresubmissionread('submissions', sub.s_id + ext, path);

        var sendver = "Running on test case-" + (i + 1).toString();

        var topush = (sendver + ',0,0,' + sub.s_id).toString();
        amqp.sendverdict(topush);

        Submission.updateOne({ "s_id": sub.s_id }, { $set: { "verdict": "Running on test case-" + (i + 1).toString() } }, (err, res) => {
            if (err) throw err;
        });

        switch (lang) {
            case 'C++':
                await cpp.runFile(path, { stdin: input, timeout: 0 }, (err, res) => {
                    run_test(err, res);
                });
                break;
            case 'Python':
                await python.runFile(path, { stdin: input, timeout: 0 }, (err, res) => {
                    run_test(err, res);
                });
                break;
            case 'C':
                await c.runFile(path, { stdin: input, timeout: 0 }, (err, res) => {
                    run_test(err, res);
                });
                break;
            case 'Java':
                await java.runFile(path, { stdin: input, timeout: 0 }, (err, res) => {
                    run_test(err, res);
                });
                break;
        }

        fs.unlinkSync(path, (err) => {
            if (err) throw err;
        });

        if (useroutput.toString().trim() !== output || flag === 0) {
            flag = 0;
            qno = i + 1;
            break;
        }

    }
    console.log("checked");

    if (score[sub.who][sub.which] === undefined) {
        score[sub.who][sub.which] = {};

    }
    if (score[sub.who]["score"] === undefined) {
        score[sub.who]["score"] = 0;
    }

    var verdi;

    if (flag === 0) {
        if (error === undefined) {
            error = "wrong";
        }
        verdi = error + " in test - " + qno;
        if (score[sub.who][sub.which]["p"] === undefined) {
            score[sub.who][sub.which]["p"] = 0;
        }
        score[sub.who][sub.which]["p"] += 1;
    } else {
        score[sub.who]["score"] -= ((score[sub.who][sub.which]["score"] === undefined) ? 0 : score[sub.who][sub.which]["score"]);
        score[sub.who][sub.which]["score"] = ut.score;
        if (score[sub.who]["penalty"] === undefined) {
            score[sub.who]["penalty"] = 0;
        }
        score[sub.who]["penalty"] = Math.floor((sub.when.getTime() - contestSchema.date.getTime()) / (1000 * 60) + (5 * ((score[sub.who][sub.which]["p"] === undefined) ? 0 : score[sub.who][sub.which]["p"])));
        // console.log(score[sub.who]["penalty"]);
        score[sub.who]["score"] += score[sub.who][sub.which]["score"];
        // console.log(score[sub.who]["penalty"], score[sub.who]["score"]);

        verdi = "Accepted";
    }

    // console.log("score --- ", score[sub.who]["score"], score[sub.who][sub.which]["p"], score[sub.which]["score"]);

    await Contest.updateMany({ "code": sub.ccode }, {
        $set: {
            "score": score
        }
    }, (err, res) => {
        if (err) throw err;
    })

    verd.verdi = verdi;
    var topush = (verdi + ',' + verd.time + ',' + verd.memory + ',' + sub.s_id).toString();
    amqp.sendverdict(topush);

    await Submission.updateMany({ "s_id": sub.s_id }, { $set: { "verdict": verd.verdi, 'time': verd.time, 'memory': verd.memory } }, (err, res) => {
        if (err) throw err;
        console.log("Done");
    })

    //setTimeout(done, Number(sub.tl) * 1000);
}

const q = qrate(worker, 4);

function queue(msg) {
    q.push(msg);
}

module.exports.queue = queue