const router = require('express').Router();

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')

router.get('/', (req, res) => {
  res.render('index');
})

module.exports = router;