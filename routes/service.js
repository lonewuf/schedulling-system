const router = require('express').Router({mergeParams: true});

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Service = require('../models/service')
const r = /^\d+(\.\d{1,2})?$/

router.get('/', (req, res) => {

  Service.find({}, (err, services) => {
    if(err) {
      throw(err)
    } else {
      res.render('services', {services})
    }
  })
  
})

router.post('/add-service', (req, res) => {
  const name = req.body.name
  const price = req.body.price
  

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
    console.log('sadasd')
    req.flash('danger', 'Price must be numberic')
    res.redirect('/services');
  }
})

router.post('/edit-service/:id', (req, res) => {
  const name = req.body.name
  const price = req.body.price
  const id = req.params.id

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
    req.flash('danger', 'Price must be numberic')
    res.redirect('/services');
  }
})

router.get('/delete-service/:id', (req, res) => {

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