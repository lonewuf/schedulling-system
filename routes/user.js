const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs'); 
const auth = require('../config/auth'); 


// Import models
const User = require('../models/users')

router.get('/', auth.isUser, (req, res) => {
  res.render('index');
})

router.get('/login', (req, res) => {

  if (res.locals.user) {
    res.redirect('/');
  } else {
    res.render('login');
  }
})

router.post('/login', (req, res, next) => {

  passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
  })(req, res, next);
  
});

router.get('/register',  (req, res) => {

  res.render('register', {
      title: 'Register'
  });

});

// Register Customer
router.post('/register', (req, res) => {
 
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  console.log(`${name} ${username} ${password} ${password2}  =====`)
  console.log(`${name == ''} ${username == ''} ${password} ${password2}  =====`)


  if(name == '' || username == '' || password == '' || password2 == '') {
    req.flash('danger', 'All Field is required')
    res.redirect('back')
  } else {
    if(password != password2) {
      req.flash('danger', 'Password does not match')
      res.redirect('back')
    } else {

      User.findOne({username: username}, function (err, user) {
        if (err)
            console.log(err);
    
        if (user) {
            req.flash('danger', 'Username exists, choose another!');
            res.redirect('back');
        } else {
          var user = new User({
              name: name,
              username: username,
              password: password,
          });
  
          bcrypt.genSalt(10, function (err, salt) {
              bcrypt.hash(user.password, salt, function (err, hash) {
                  if (err)
                      console.log(err);
  

                  user.password = hash;
  
                  user.save(function (err) {
                      if (err) {
                          console.log(err);
                      } else {
                          req.flash('success', 'New Admin is created');
                          res.redirect('back')
                      }
                  });
              });
          });
        }
      });

    }
  }
});

router.get('/logout', function (req, res) {

  req.logout();
  req.flash('success', 'You are logged out!');
  res.redirect('/login');

});


module.exports = router;