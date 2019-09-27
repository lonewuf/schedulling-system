const router = require('express').Router();

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Service = require('../models/service')
const Inventory = require('../models/inventory')
const Payment = require('../models/payment') 

router.get('/', (req, res) => { 
  Payment.find({}) 
    .populate('schedule')
    .populate('patient')
    .then(payments => { 
      res.render('payments', {payments})
    })
    .catch()
}) 
 
router.get('/search-by-payment/:id', (req, res) => {
  const id = req.params.id

  Payment.findById(id)
    .populate('schedule')
    .then(payment => {
      Patient.findById(payment.patient)
        .then(patient => {
          Schedule.findById(payment.schedule)
            .populate('service')
            .then(schedule => {
              console.log(schedule)
              res.render('payment', {payment, patient, schedule})
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

router.get('/search-by-schedule/:id', (req, res) => {
  const id = req.params.id

  Payment.findOne({schedule: id})
    .populate('schedule')
    .then(payment => {
      Patient.findById(payment.patient) 
        .then(patient => {
          Schedule.findById(payment.schedule)
            .populate('service')
            .then(schedule => {
              console.log(schedule)
              res.render('payment', {payment, patient, schedule})
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  
})

router.post('/add-payment', (req, res) => {
  const data = req.body
  var filteredService = []
  var filteredMedicines = []
  var testQ = false;
  console.log(data.medicines)
  data.medicines.forEach(med => {
    Inventory.findById(med._id)
      .then(foundMed => {
        console.log(foundMed.quantity + " <" +  med.quantity)
        console.log(foundMed.quantity < med.quantity)
        if(foundMed.quantity < med.quantity) {
          testQ = true
        }
      })
  }) 

  console.log(testQ, "testq before")
  if(testQ) {
    console.log('1111111111')
    req.flash('danger', `The quantity of ${foundMed} is not enough`)
    res.redirect('/schedule');
  } else {
    console.log('22222222')

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
        Payment.create(
          {
            schedule: data.schedID,
            month: data.month,
            day: data.day,
            year: data.year,
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
              console.log(testQ, "testq after")

              console.log('updated')
            })
        })
      })
  }
})

module.exports = router;