// Import all packages needed
const router = require('express').Router({mergeParams: true});
const auth = require('../config/auth')

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Inventory = require('../models/inventory')
const r = /^\d+(\.\d{1,2})?$/
const rQuantity = /^[0-9]*$/

// Display Inventory (Products List)
router.get('/', auth.isUser, (req, res) => {

  Inventory.find({}, (err, products) => {
    if(err) {
      throw(err)
    } else {
      res.render('inventory', {products})
    }
  })
  
})

// Adding product in Inventory
router.post('/add-product', auth.isUser, (req, res) => {
  // Get all data needed from req.body
  const name = req.body.name
  var price = req.body.price
  const quantity = req.body.quantity
  const is_med = req.body.is_med

  // Validation for name, quantity, is_med and price
  if(name == "") {
    req.flash('danger', 'Name is required') 
    res.redirect('/inventory'); 
  } else {
    if(quantity == "") {
      req.flash('danger', 'Quantity is required')
      res.redirect('/inventory');
    } else {
      if(is_med == undefined || is_med === null || is_med === '') {
        req.flash('danger', 'Please specify if medicine or not')
        res.redirect('/inventory');
      } else {
        if((r.test(price) && rQuantity.test(quantity)) || price === "") {
          if(rQuantity.test(quantity)) {
            price = price == '' ? 0 : price;
            // Create product in Inventory and save it to Database
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
          req.flash('danger', 'Price and Quantity must be numeric')
          res.redirect('/inventory');
        }
      }
    }
    
  }
  
})

// Updating product
router.post('/edit-product/:id', auth.isUser, (req, res) => {
  // Get all data needed from req.body
  const name = req.body.name
  var price = req.body.price
  const quantity = req.body.quantity
  const id = req.params.id
  const is_med = req.body.is_med

  // Validation for name, quantity, is_med and price
  if(name == "") {
    req.flash('danger', 'Name is required') 
    res.redirect('/inventory'); 
  } else {
    if(quantity == "") {
      req.flash('danger', 'Quantity is required')
      res.redirect('/inventory');
    } else {
      if(is_med == undefined || is_med === null || is_med === '') {
        req.flash('danger', 'Please specify if medicine or not')
        res.redirect('/inventory');
      } else {
        if((r.test(price) && rQuantity.test(quantity)) || price === "") {
          if(rQuantity.test(quantity)) {
            // If price is equal to '', set it to 0. If not set it to the value of price
            price = price == '' ? 0 : price;
            // Find the product by id then update it
            Inventory.updateOne({_id: id}, {name, price, quantity, is_med}, (err, updatedProduct) => {
              if(err) {
                throw(err)
              } else {
                req.flash('success', 'Product is updated')
                res.redirect('/inventory');
              }
            })
          } else {
            req.flash('danger', 'Quantity must be numeric')
            res.redirect('/inventory');
          }
          
        } else {
          req.flash('danger', 'Price and Quantity must be numeric')
          res.redirect('/inventory');
        }
      }
    }
    
  }

})

// Adding quantity to the product
router.post('/add-quantity/:id', auth.isUser, (req, res) => {
  const quantity = req.body.quantity
  const id = req.params.id
  // Check if the quantity is numeric
  if(rQuantity.test(quantity)) {
    // Add the quantity entered by user to the quantity in database
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

// Decrease quantity of the product
router.post('/minus-quantity/:id', auth.isUser, (req, res) => {
  const quantity = req.body.quantity
  const id = req.params.id
  // Test if quantity is numeric
  if(rQuantity.test(quantity)) {
    Inventory.findOne({_id: id}, (err, foundProduct) => {
      if(err) {
        throw(err)
      } else { 
        // Check if the quantity entered by the user is less than the quantity in database
        if((parseInt(foundProduct.quantity) - parseInt(quantity)) < 0) {
          req.flash('danger', "Quantity limit is only zero")
          res.redirect('/inventory');
        } else {
          // Decrease the quantity in the database based on the quantity entered by the user
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

// Delete product
router.get('/delete-product/:id', auth.isUser, (req, res) => {

  const id = req.params.id

  // Delete the product in the Inventory based on id
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