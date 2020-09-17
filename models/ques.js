const mongoose = require('mongoose');
const schema = mongoose.Schema;



const question = new schema({

    probCode: String,
    probSetter: String,
    probTester: String,
    statement: String,
    input: String,
    output: String,
    score: Number,
    tl: { // Time Limit in sec
        type: Number,
        min: 0,
    },
    ml: { // Memory Limit in MB
        type: Number,
        min: 0,
    },
    numofinputfiles: Number,
    asked: Boolean,
    dateAdded: String,
});

const Ques = mongoose.model('ques', question);
module.exports = Ques;