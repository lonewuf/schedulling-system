const mongoose = require('mongoose');

// User Schema
const MedicineSchema = mongoose.Schema({
   
    name: {
        type: String,
        required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
    
});

module.exports = mongoose.model('Medicine', MedicineSchema);


