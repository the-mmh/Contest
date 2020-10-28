const schedule = require('node-schedule');
const Contest = require('../models/contest');
const User = require('../models/user');

async function rankallot(code) {
    console.log("Check 1", code);
    var contest = {},
        scores = [],
        pC = [],
        cpC = {},
        partusers = {},
        condate;

    contest = await Contest.find({ 'code': code });

    console.log("Check 2");

    condate = contest[0].date;

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
        console.log("Check 3");
        Object.keys(contest).forEach((k) => {
            var arr = {};
            arr.rank = (contest[k]["rank"]);

            arr.username = (k);

            User.findOne({ 'username': k }, 'allrating rating', (err, res) => {
                if (err) throw err;


                partusers[k] = res;


            });

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
        });

    }

    console.log("Check 4");


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
            var cuser;

            cuser = await User.findOne({ 'username': scores[i]['username'] }, 'allrating rating');

            var newrating, oldrating = cuser.rating,
                s = 0,
                n = scores.length,
                x = 400;
            var obtrank = Number(i + 1);

            Object.keys(partusers).forEach((user) => {
                if (scores[i]['username'] !== user) {

                    var po = Math.pow(10, (-cuser.rating + partusers[user]['rating']) / x);
                    po += 1;
                    po = 1 / po;
                    var p = po;
                    s += p;
                }


            })


            var exprank = n - s;

            newrating = Math.floor(oldrating + (x / n) * (exprank - obtrank));


            cuser['allrating'][condate] = {
                'code': code,
                'rank': obtrank,
                'oldrating': cuser.rating,
                'newrating': newrating
            }

            await User.updateOne({ 'username': scores[i]['username'] }, { $set: { rating: newrating, allrating: cuser.allrating } }, (err) => {
                if (err) throw err;
                console.log(scores[i]['username'], cuser);
            });
        }
    }
}

module.exports.rankallot = rankallot;