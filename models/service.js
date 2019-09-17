const mongoose = require('mongoose');

// User Schema
const ServiceSchema = mongoose.Schema({
   
    name: {
        type: String,
        required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number
    },
    per_piece: {
      type: Boolean
    }
    
});

module.exports = mongoose.model('Service', ServiceSchema);


