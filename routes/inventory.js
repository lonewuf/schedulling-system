const router = require('express').Router({mergeParams: true});

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Inventory = require('../models/inventory')
const r = /^\d+(\.\d{1,2})?$/
const rQuantity = /^[0-9]*$/

router.get('/', (req, res) => {

  Inventory.find({}, (err, products) => {
    if(err) {
      throw(err)
    } else {
      res.render('inventory', {products})
    }
  })
  
})

router.post('/add-product', (req, res) => {
  const name = req.body.name
  const price = req.body.price
  const quantity = req.body.quantity
  const is_med = req.body.is_med
  console.log(req.body)

  
  if(name === "") {
    req.flash('danger', 'Name is required')
    res.redirect('/inventory'); 
  }
  if(quantity === "") {
    req.flash('danger', 'Quantity is required')
    res.redirect('/inventory');
  }
  if(is_med === undefined) {
    req.flash('danger', 'Please specify if medicine or not')
    res.redirect('/inventory');
  }

  if((r.test(price) && rQuantity.test(quantity)) || price === "") {
    if(rQuantity.test(quantity)) {
      Inventory.create({name, price, quantity, is_med}, (err, createdProduct) => {
        if(err) {
          throw(err)
        } else {
          req.flash('success', 'Product is created')
          res.redirect('/inventory');
        }
      })
    } else {
      req.flash('danger', 'Quantity must be numeric')
      res.redirect('/inventory');
    }
    
  } else {
    console.log('sadasd')
    req.flash('danger', 'Price and Quantity must be numeric')
    res.redirect('/inventory');
  }
})

router.post('/edit-product/:id', (req, res) => {
  const name = req.body.name
  const price = req.body.price
  const id = req.params.id
  const is_med = req.body.is_med

  if(name === "") {
    req.flash('danger', 'Name is required')
    res.redirect('/inventory'); 
  }
  if(quantity === "") {
    req.flash('danger', 'Quantity is required')
    res.redirect('/inventory');
  }
  if(is_med === undefined) {
    req.flash('danger', 'Please specify if medicine or not')
    res.redirect('/inventory');
  }

  if(r.test(price)) {
    Inventory.updateOne({_id: id}, {name, price}, (err, updatedProduct) => {
      if(err) {
        throw(err)
      } else {
        req.flash('success', 'Product is updated')
        res.redirect('/inventory');
      }
    })
  } else {
    req.flash('danger', 'Price must be numberic')
    res.redirect('/inventory');
  }
})

router.post('/add-quantity/:id', (req, res) => {
  const quantity = req.body.quantity
  const id = req.params.id

  if(rQuantity.test(quantity)) {
    Inventory.updateOne({_id: id}, {$inc: {quantity: parseInt(quantity)}}, (err, updatedProduct) => {
      if(err) {
        throw(err)
      } else {
        req.flash('success', 'Product is updated')
        res.redirect('/inventory');
      }
    })
  } else {
    req.flash('danger', 'Quantity must be numberic')
    res.redirect('/inventory');
  }
})

router.post('/minus-quantity/:id', (req, res) => {
  const quantity = req.body.quantity
  const id = req.params.id
  
  if(rQuantity.test(quantity)) {
    Inventory.findOne({_id: id}, (err, foundProduct) => {
      if(err) {
        throw(err)
      } else { 
        if((parseInt(foundProduct.quantity) - parseInt(quantity)) < 0) {
          req.flash('danger', "Quantity limit is only zero")
          res.redirect('/inventory');
        } else {
          console.log(foundProduct.quantity + " - " + parseInt(quantity))
          Inventory.updateOne({_id: id}, {$inc: {quantity: -parseInt(quantity)}}, (err, updatedProduct) => {
            if(err) {
              throw(err)
            } else {
              req.flash('success', 'Product is updated')
              res.redirect('/inventory');
            }
          })
        }
      }
    })
  } else {
    req.flash('danger', 'Quantity must be numberic')
    res.redirect('/inventory');
  }
})


router.get('/delete-product/:id', (req, res) => {

  const id = req.params.id

  Inventory.findByIdAndDelete(id, err => {
    if(err) {
      throw(err)
    } else {
      console.log("Deleted successfully")
      req.flash('success', 'Deleted Successfully')
      res.redirect('/inventory');
    }
  })
})



module.exports = router;