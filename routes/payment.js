const router = require('express').Router();
const auth = require('../config/auth'); 

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Service = require('../models/service')
const Inventory = require('../models/inventory')
const Payment = require('../models/payment') 

// Show page of payment list
router.get('/', auth.isUser, (req, res) => { 
  Payment.find({}) 
    .sort({month: -1, day: -1})
    .populate('schedule')
    .populate('patient')
    .then(payments => { 
      res.render('payments', {payments})
    })
    .catch()
})  

// Show the page of payment
router.get('/search-by-payment/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  Payment.findById(id)
    .populate('schedule')
    .then(payment => {
      Patient.findById(payment.patient)
        .then(patient => {
          Schedule.findById(payment.schedule)
            .populate('service')
            .then(schedule => {
              // Render the page of payment
              res.render('payment', {payment, patient, schedule})
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

// Show the page of payment
router.get('/search-by-schedule/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  Payment.findOne({schedule: id})
    .populate('schedule')
    .then(payment => {
      Patient.findById(payment.patient) 
        .then(patient => {
          Schedule.findById(payment.schedule)
            .populate('service')
            .then(schedule => {
              // Render the page of payment
              res.render('payment', {payment, patient, schedule})
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  
})

// Add Payment
router.post('/add-payment', auth.isUser, (req, res) => {
  const data = req.body
  var filteredService = []
  var filteredMedicines = []
  var testQ = false;
  data.medicines.forEach(med => {
    Inventory.findById(med._id)
      .then(foundMed => {
        if(foundMed.quantity < med.quantity) {
          testQ = true
        }
      })
  }) 

  if(testQ) {
    req.flash('danger', `The quantity of ${foundMed} is not enough`)
    res.redirect('/schedule');
  } else {

    data.serviceSimple.forEach(serv => {
      if(serv != 'none') {
        filteredService.push(serv) 
      }
    })

    data.medicines.forEach(med => {
      Inventory.updateOne({_id: med._id}, {$inc: {quantity: -parseInt(med.quantity)}})
        .then(updatedMed => {
          console.log("updated") 
        })
    })

    data.medicines.forEach(med => {
      filteredMedicines.push(med)
    })
    Schedule.updateOne({_id: data.schedID}, 
        {
          medicine: filteredMedicines,
          medicine_total: data.mTotal,
          service_total: data.sTotal,
          grand_total: data.gTotal,
          medicine: filteredMedicines,
          done: true,
          paid: true
        }
      )
      .then(updatedSchedule => {
        Schedule.findById(data.schedID)
          .then(sched => {
            Payment.create(
              {
                schedule: data.schedID, 
                month: sched.month,
                day: sched.day, 
                year: sched.year,
                ampm: data.ampm,
                medicine_total: data.mTotal,
                service_total: data.sTotal,
                grand_total: data.gTotal,
                paid: true,
                patient: data.patientID,
                medicine: filteredMedicines,
                service: filteredService
              }
            )
            .then(createdPayment => {
              Patient.updateOne({_id: data.patientID}, {$set: {is_scheduled: false}})
                .then(updatedPatient => {
    
                  console.log('updated')
                })
            })
          })
          .catch(err => console.log(err))
       
      })
  }
})

module.exports = router;