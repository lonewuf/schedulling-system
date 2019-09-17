const mongoose = require('mongoose');
 
// User Schema
const ScheduleSchema = mongoose.Schema({
   
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient'
    },
    // month: {
    //   type: String,
    // },
    // day: {
    //   type: String,
    // },
    // year: {
    //   type: String
    // },
    service: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service'
      }
    ],
    serviceSimple: [],
    medicine: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine'
      }
    ],
    month: {
      type: Number,
    },
    day: {
      type: Number,
    },
    year: {
      type: Number
    },
    time: {
      type: String
    },
    ampm: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now()
    },
    medicine_total: {
      type: Number
    },
    service_total: {
      type: Number
    },
    grand_total: {
      type: Number
    },
    resched: {
      last_time: {
        type: String
      },
      is_resched: {
        type: Boolean,
        default: false  
      }
    },
    cancelled: {
      type: Boolean,
      default: false
    },
    done: {
      type: Boolean,
      default: false
    }
    
});

module.exports = mongoose.model('Schedule', ScheduleSchema);


