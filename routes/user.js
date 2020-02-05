// Import all dependencies needed
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcryptjs'); 
const auth = require('../config/auth'); 

// Import models
const User = require('../models/users')

// Shows home page 
router.get('/', auth.isUser, (req, res) => {
  res.render('index', {
    user: req.user,
    title: 'L.A. TAN Dental Clinic'
  });
})

// Shows login page
router.get('/login', (req, res) => {

  if (res.locals.user) {
    res.redirect('/');
  } else {
    res.render('login', {
      tite: 'Login'
    });
  }
})

// Login user
router.post('/login', (req, res, next) => {

  passport.authenticate('local', {
      successRedirect: '/',
      failureRedirect: '/login',
      failureFlash: true
  })(req, res, next); 
  
});

// Register admin
router.post('/register', (req, res) => {
 
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

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

// Shows admin list
router.get('/admin-list', auth.isUser, (req, res) => {
  User.find({})
    .then(users => {
      res.render('admin-list', {
        title: 'Admin List',
        users
      })
    })
})

// Update admin based on id
router.post('/update-admin/:id', auth.isUser, (req, res) => {
  const id = req.params.id
  const name = req.body.name;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;

  if(name == '' || username == '' || password == '' || password2 == '') {
    req.flash('danger', 'All Field is required')
    res.redirect('back')
  } else {
    if(password != password2) {
      req.flash('danger', 'Password does not match')
      res.redirect('back')
    } else {

      if(username == 'adminone') {
        req.flash('danger', 'You can\'t edit this admin')
        res.redirect('back');
      } else {
        User.findOne({username: username}, function (err, user) {
          if (err)
              console.log(err);
      
          if (user) {
              req.flash('danger', 'Username exists, choose another!');
              res.redirect('back');
          } else {
    
            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(password, salt, function (err, hash) {
                    if (err)
                        console.log(err);
                    password = hash;
    
                    User.updateOne({_id: id}, {$set: {name, username, password}})
                      .then(updatedUser => {
                        req.flash('success', 'Admin is updated')
                      })
                });
            });
          }
        });
      }
    }
  }
})

// Deletes admin based on id
router.get('/delete-admin/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  User.findById(id)
    .then(foundUser => {
      if(foundUser.username == 'adminone') {
        req.flash('danger', 'Your can\'t delete that admin')
        res.redirect('back');
      } else {
        User.findByIdAndDelete(id)
          .then(() => {
            req.flash('success', 'Admin is deleted')
            res.redirect('back');
          })
      }
    })
    .catch(err => console.log(err))
})

// Logout user
router.get('/logout', auth.isUser, function (req, res) {

  req.logout();
  req.flash('success', 'You are logged out!');
  res.redirect('/login');

});


module.exports = router;