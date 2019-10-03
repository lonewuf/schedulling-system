const router = require('express').Router();
const auth = require('../config/auth')

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Payment = require('../models/payment')
const r = /^[0-9]*$/

// Show the Patient List page
router.get('/', auth.isUser, (req, res) => {
  // Get all the patients in database
  Patient.find({})
    .sort('name')
    .then(patients => {
      // Render the Patient list page
      res.render('patients', {patients})
    })
    .catch(err => console.log(err))
}) 

// Add patient in database
router.post('/add-patient', auth.isUser, (req, res) => {
  const data = req.body

  // Create teeth document in database
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
 
    },
    (err, createdPatient) => {
      if(err) {
        throw err
      } else { 

        console.log(`Patient ${createdPatient.name} is registered`)

      }
    }
  )

  })
})

// Updating Patient
router.post('/update-patient', auth.isUser, (req, res) => {
  const data = req.body
  // Update patient details
  Patient.updateOne({_id: data.patientID},
    {$set: {
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
    }}
    )
    .then(updatedPatient => {
      Patient.findById(data.patientID)
        .then(foundPatient => {
          // Update Patient's Teeth information
          Teeth.updateOne({_id: foundPatient.teeth}, 
              {$set: {
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
              }}
            )
            .then(updatedTeeth => {
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

// Show the profile page of patient
router.get('/search/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  // Find the patient by id
  Patient.findById(id)
    .populate('teeth')
    .then(patient => {
      Payment.find({patient: id})
        .populate('service')
        .then(paymentList => {
          // Render the profile page of patient
          res.render('patient', {patient, paymentList})
        })
    })
    .catch(err => console.log(err))
})

// Show the update page of patient
router.get('/update-this-patient/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  // Find the patient by id
  Patient.findById(id)
    .populate('teeth')
    .then(patient => {
      // Render the profile page of patient for updating
      res.render('edit-patient', {patient})
    })
    .catch(err => console.log(err)) 
})

// Update patient based on id
router.post('/update-this-patient/:id', auth.isUser, (req, res) => {
  const id = req.params.id
  const data = req.body
  // Validations for name, age and contact number
  if(data.name != '') {
    if(data.age != '') {
      if(r.test(data.age)) {
        if(r.test(data.contact_number) || data.contact_number == '') {
          Patient.updateOne({_id: id},
            {$set: {
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
            }}
            )
            .then(updatedPatient => {
              Patient.findById(id)
                .then(foundPatient => {
                  Teeth.updateOne({_id: foundPatient.teeth}, 
                      {$set: {
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
                      }}
                    )
                    .then(updatedTeeth => {
                      req.flash('success', 'Patient updated')
                      res.redirect(`/patient`);
                    })
                    .catch(err => console.log(err))
                })
                .catch(err => console.log(err))
            })
            .catch(err => console.log(err))
        } else {
          req.flash('danger', 'Contact number must be numeric')
          res.redirect('back');
        }
      } else {
        req.flash('danger', 'Age is required and it must be numeric')
        res.redirect('back');
      }
    } else {
      req.flash('danger', 'Age is required')
      res.redirect('back');
    }
  } else {
    req.flash('danger', 'Name is required')
    res.redirect('back');
  }

  
})


module.exports = router;