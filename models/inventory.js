const mongoose = require('mongoose');

// User Schema
const InventorySchema = mongoose.Schema({
   
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
    }
    
});

module.exports = mongoose.model('Inventory', InventorySchema);


