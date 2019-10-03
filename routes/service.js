const router = require('express').Router({mergeParams: true});
const auth = require('../config/auth')

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Service = require('../models/service')
const r = /^\d+(\.\d{1,2})?$/

// Show page of services
router.get('/', auth.isUser, (req, res) => {

  Service.find({}, (err, services) => {
    if(err) {
      throw(err)
    } else {
      res.render('services', {services})
    }
  })
  
})

// Add service
router.post('/add-service', auth.isUser, (req, res) => {
  const name = req.body.name
  const price = req.body.price
  if(name != '') {
    
    if(r.test(price)) {
    
      Service.create({name, price}, (err, createdService) => {
        if(err) {
          throw(err)
        } else {
          req.flash('success', 'Service is created')
          res.redirect('/services');
        }
      })
    } else {
      req.flash('danger', 'Price must be numeric')
      res.redirect('/services');
    }
  }  else {
    req.flash('danger', 'Name is required')
    res.redirect('/services')
  }
  
})

// Update Service
router.post('/edit-service/:id', auth.isUser, (req, res) => {
  const name = req.body.name
  const price = req.body.price
  const id = req.params.id

  // Validation for name and price
  if(name != '') {
    if(r.test(price)) {
      Service.updateOne({_id: id}, {name, price}, (err, updatedService) => {
        if(err) {
          throw(err)
        } else {
          req.flash('success', 'Service is updated')
          res.redirect('/services');
        }
      })
    } else {
      req.flash('danger', 'Price must be numeric')
      res.redirect('/services');
    }
  } else {
    req.flash('danger', 'Name is required')
    res.redirect('/services');
  }
  
})

// Delete service in database
router.get('/delete-service/:id', auth.isUser,  (req, res) => {

  const id = req.params.id

  Service.findByIdAndDelete(id, err => {
    if(err) {
      throw(err)
    } else {
      console.log("Deleted successfully")
      req.flash('success', 'Deleted Successfully')
      res.redirect('/services');
    }
  })
})



module.exports = router;