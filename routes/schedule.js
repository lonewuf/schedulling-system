const router = require('express').Router();
const auth = require('../config/auth')

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Service = require('../models/service')
const Inventory = require('../models/inventory')

// Render the schedule page
// Get /schedule
router.get('/', /*auth.isUser,*/ (req, res) => {
  res.render('schedule', {user: req.user});
});

// Load all the data needed in schedule page
// Get /schedule/initial-load
router.get('/initial-load', /*auth.isUser,*/ (req, res) => { 
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  var allData = {}

  const tryThis = async () => {

    var thisData = {}

    const s = await Schedule.find({})
      .populate('patient')
      .populate('service')
      .then(data => {
        return data
      })
      .catch(err => console.log(err))

    const p = await Patient.find({})
      .populate('teeth')
      .then(data => { 
        return data
      })
      .catch(err => console.log(err))

    const serv = await Service.find({})
      .then(data => { 
        return data
      })
      .catch(err => console.log(err))

    const i = await Inventory.find({is_med:'yes'})
      .then(data => {
        return data
      })
      .catch(err => console.log(err))
    
    thisData.patientData = p
    thisData.scheduleData = s
    thisData.serviceData = serv
    thisData.inventoryData = i

    return thisData
  }

  tryThis().then(data => res.send(data))
  
  

})

// Route for creating patient with schedule
// POST /schedule/add-schedule-with-patient
router.post('/add-schedule-with-patient', auth.isUser, async (req, res) => {
  const data = req.body
  var sample = data.serviceSimple
  // Craete teeth document in database
  Teeth.create({
    t_11: data.t_11,
    t_12: data.t_12,
    t_13: data.t_13,
    t_14: data.t_14,
    t_15: data.t_15,
    t_16: data.t_16,
    t_17: data.t_17,
    t_18: data.t_18,
    t_21: data.t_21,
    t_22: data.t_22,
    t_23: data.t_23,
    t_24: data.t_24,
    t_25: data.t_25,
    t_26: data.t_26,
    t_27: data.t_27,
    t_28: data.t_28,
    t_31: data.t_31,
    t_32: data.t_32,
    t_33: data.t_33,
    t_34: data.t_34,
    t_35: data.t_35,
    t_36: data.t_36,
    t_37: data.t_37,
    t_38: data.t_38,
    t_41: data.t_41,
    t_42: data.t_42,
    t_43: data.t_43,
    t_44: data.t_44,
    t_45: data.t_45,
    t_46: data.t_46,
    t_47: data.t_47,
    t_48: data.t_48,
  }, (err, createdTeeth) => {
    // Create patient document in database
    if(err) {
      throw (err)
    }

    Patient.create({
      // User details
      name: data.name,
      gender: data.gender,
      address: data.address,
      contact_number: data.contact_number,
      age: data.age,
      nationality: data.nationality,
      occupation: data.occupation,
      reffered_by: data.reffered_by,
      chief_complainant: data.chief_complainant,
      diagnosis: data.diagnosis,

      // Medical History
      hypertension: data.hypertension,
      epilepsy: data.epilepsy,
      diabetes: data.diabetes,
      kidney_disease: data.kidney_disease,
      heart_disease: data.heart_disease,
      liver_disease: data.liver_disease,
      allergy: data.allergy,
      asthma: data.asthma,
      others: data.others,

      // Oral conditons
      deposit_stains: data.deposit_stains,
      oral_hygiene: data.oral_hygiene,

      treatment_planning: data.treatment_planning,

      // Teeth
      teeth: createdTeeth._id,

      // Schedule patient
      is_scheduled: true
    },
    (err, createdPatient) => {
      if(err) {
        throw err
      } else {
 
        // Create Schedule document in database
        Schedule.create(
          {
            patient: createdPatient._id,
            month: data.month,
            year: data.year,
            day: data.day,
            time: data.time,
            ampm: data.ampm,
            service: data.serviceSimple
          },
          async (err, createdSchedule) => {
            if(err) {
              throw (err)
            } else {
              // console.log(createdSchedule, "----");
              const showCreatedSchedule = await Schedule.findById(createdSchedule._id).populate('patient').populate('service');
              console.log(showCreatedSchedule); 

              createdPatient.schedules.push(createdSchedule._id)
              createdPatient.save()
                .then(updatedPatient => {
                }) 
                .catch(err => console.log(err))
            }
          }
        )

      }
    } 
  )  

  })
})

// Add schedule to patient
router.post('/add-schedule', /*auth.isUser,*/ (req, res) => {
  const data = req.body

  // Create schedule
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
        // Update patient to be scheduled
        Patient.updateOne({_id: data.patientID}, {$set: {is_scheduled: true}})
          .then(scheduledPatient => {
          })
          .catch(err => console.log(err))
      }
    }
  )

})

// Updating schedule
router.post('/edit-schedule', /*auth.isUser,*/ (req, res) => {
  const data = req.body
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

// Cancel Schedule
router.post('/cancel-schedule', /*auth.isUser,*/ (req, res) => {
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




module.exports = router;