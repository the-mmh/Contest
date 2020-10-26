const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    var mess = "no";
    var name = "";
    var password = "";
    var email = "";
    if (req.user) {
        mess = "yes";
        name = req.user.username;
        password = req.user.password;
        email = req.user.email;
    }
    res.render('index', { mess: mess, name: name, password: password, email: email });
});





module.exports = router;