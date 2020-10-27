const schedule = require('node-schedule');
const Contest = require('../models/contest');
const User = require('../models/user');

var rankallot = async(code) => {

    var contest = {},
        scores = [],
        pC = [],
        cpC = {},
        partusers = {};

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

        Object.keys(contest).forEach(async(k) => {
            var arr = {};
            arr.rank = (contest[k]["rank"]);

            arr.username = (k);

            partusers.k = await User.findOne({ 'username': scores[i]['username'] }, 'noofcontests allrating rating');

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
            var cuser = await User.findOne({ 'username': scores[i]['username'] }, 'noofcontests allrating rating');

            var newrating, oldrating = cuser.rating,
                s = 0,
                n = scores.length;
            var obtrank = Number(i + 1);
            Object.keys(partusers).forEach(async(user) => {
                if (scores[i]['username'] !== user) {
                    var p = 1 / (1 + Math.pow(cuser.rating - partusers.user['rating']));
                    s += p;
                }
            })

            var exprank = n - s;

            newrating = oldrating + (x / n) * (exprank - obtrank);

            cuser.noofcontests += 1;
            cuser.allrating[code] = {
                'rank': obtrank,
                'oldrating': cuser.rating,
                'newrating': newrating
            }
            await User.updateOne({ 'username': scores[i]['username'] }, { $set: { rating: cuser.allrating[code]['newrating'], noofcontests: cuser.noofcontests, allrating: cuser.allrating } }, (err, res) => {
                if (err) throw err;
            });
        }
    }
}

module.exports.rankallot = rankallot;