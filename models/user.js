const mongoose = require('mongoose');
const schema = mongoose.Schema;
const bcrypt = require('bcryptjs');
const { string } = require('joi');


const userschema = new schema({
    email: String,
    username: String,
    password: String,
    secretToken: String,
    contact: String,
    role: String,
    active: Boolean,
    flang: String,
    template: String,
    rating: Number,
    allrating: Object


}, {
    timestamp: {
        createdAt: 'createdAt',
        upadateAt: 'upadateAt'
    }
});

const User = mongoose.model('user', userschema);
module.exports = User;

module.exports.hashPassword = async(password) => {
    try {
        const salt = await bcrypt.genSalt(10);
        return await bcrypt.hash(password, salt);
    } catch (error) {
        throw new Error('hashing failed', error);
    }
};

module.exports.comparePasswords = async(inputPassword, hashedPassword) => {
    try {
        return await bcrypt.compare(inputPassword, hashedPassword);
    } catch (error) {
        throw new Error('comparing failed', error);
    }
};