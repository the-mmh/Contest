const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    var name = "";
    var password = "xxxxxxxx";
    var email = "xxxxxxxx";
    if (req.user) {
        name = req.user.username;
        password = req.user.password;
        email = req.user.email;
    }
    res.render('index', {
        name: name,
        password: password,
        email: email
    });
});





module.exports = router;