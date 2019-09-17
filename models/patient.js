const mongoose = require('mongoose');

// User Schema
const PatientSchema = mongoose.Schema({
   
    name: {
        type: String,
        required: true
    },
    age: {
      type: String,
    },
    sex: {
      type: String,
    },
    nationality: {
      type: String,
    },
    occupation: {
      type: String,
    },
    contact_number: {
        type: String,
        // required: true
    }, 
    chief_compliant: {
      type: String
    },
    reffered_by: {
      type: String
    },
    diagnosis: {
      type: String
    },
    address: {
      type: String
    },
    company: {
      type: String
    },
    service: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],
    medicine: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
      }
    ],
    teeth: 
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teeth'
      }
    ,

    // Medical History

    hypertension: {
      type: Boolean
    },
    
   
    epilepsy: {
      type: Boolean
    },
    
   
    diabetes: {
      type: Boolean
    },
    
   
    kidney_disease: {
      type: Boolean
    },
    
   
    heart_disease: {
      type: Boolean
    },
    
   
    liver_disease: {
      type: Boolean
    },
    
   
    allergy: {
      type: Boolean
    },
    
   
    asthma: {
      type: Boolean
    },
    
   
    others: {
      type: Boolean
    },

    // Oral conditions
    deposit_stains: {
      type: String
    },
    oral_hygiene: {
      type: String
    },
    treatment_planning: {
      type: String
    }
    
});

module.exports = mongoose.model('Patient', PatientSchema);


