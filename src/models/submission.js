const mongoose = require('mongoose');
const schema = mongoose.Schema;



const submission = new schema({
    s_id: String,
    contest: String,
    ccode: String,
    code: String,
    which: String,
    who: String,
    when: Date,
    verdict: String,
    language: String,
    time: String,
    memory: String,
    compilation: String,
});

module.exports = mongoose.model('submission', submission);