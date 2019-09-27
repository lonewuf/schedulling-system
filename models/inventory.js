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
    },
    is_med: {
      type: String
    }
    
});

module.exports = mongoose.model('Inventory', InventorySchema);


