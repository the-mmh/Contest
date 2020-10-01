const mongoose = require('mongoose');
const schema = mongoose.Schema;



const contestSchema = new schema({
    name: String,
    code: String,
    date: Date,
    duration: Number,
    problems: Object,
    done: Boolean,
    score: Object,
});

const Contest = mongoose.model('contest', contestSchema);
module.exports = Contest;