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

router.post('/add-payment', (req, res) => {
  const data = req.body
  var filteredMedicines = []

  data.medicines.forEach(med => {
    filteredMedicines.push(med)
  })

  Schedule.updateOne({_id: data.schedID}, 
      {
        medicine: filteredMedicines,
        medicine_total: data.mTotal,
        service_total: data.sTotal,
        grand_total: data.gTotal,
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
          patient: data.patientID
        }
      )
      .then(createdPayment => {
        console.log(createdPayment)
        console.log('Successful creating payment')
      })
    })
})

router.post('/add-schedule', (req, res) => {
  const data = req.body

  Schedule.create(
    {
      patient: data.patientID,
      month: data.month,
      year: data.year,
      day: data.day,
      ampm: data.ampm,
      service: data.serviceSimple
    },
    (err, createdSchedule) => {
      if(err) {
        throw (err)
      } else {
        Patient.updateOne({_id: data.patientID}, {$set: {is_scheduled: true}})
          .then(scheduledPatient => {
            console.log(scheduledPatient)
          })
          .catch(err => console.log(err))
      }
    }
  )

})

router.post('/edit-schedule', (req, res) => {
  const data = req.body
  console.log(data)
  Schedule.updateOne({_id: data.schedID}, 
      {
        month: data.month,
        day: data.day,
        ampm: data.ampm,
        service: data.serviceSimple
      },
    )
    .then(updatedSchedule => {
      console.log(updatedSchedule)
    })
    .catch(err => console.log(err))
})

router.post('/cancel-schedule', (req, res) => {
  const data = req.body;
  console.log(data)

  Schedule.updateOne({_id: data.id}, {$set: {cancelled: true}})
    .then(updatedSchedule => {
      Schedule.findById(data.id)
        .then(foundSched => {
          Patient.updateOne({_id: foundSched.patient}, {$set: {is_scheduled: false}})
          .then(updatedPatient => {
            res.send(updatedSchedule)
          })
          .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

router.get('/get-schedule-day/:year/:month/:day', (req, res) => {
  const year = req.params.year;
  const month = req.params.month;
  const day = req.params.day;
  Schedule.find({year, month, day})
    .populate('patient')
    .then(scheduleData => {
      res.send(scheduleData)
    })
    .catch(err => console.log(err))
})

router.get('/get-schedule-month/:year/:month', (req, res) => {
  
})

module.exports = router;