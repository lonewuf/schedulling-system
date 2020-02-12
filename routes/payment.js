const router = require('express').Router();
const fs = require('fs'); 
const https = require('https');
const auth = require('../config/auth'); 
const open = require('open');

// Import models
const Patient = require('../models/patient')
const Schedule = require('../models/schedule')
const Teeth = require('../models/teeth')
const Service = require('../models/service')
const Inventory = require('../models/inventory')
const Payment = require('../models/payment') 

// HOST
const host = require('../config/utils').hostProd;

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December']

// Show page of payment list
router.get('/', auth.isUser, (req, res) => { 
  Payment.find({}) 
    .sort({month: -1, day: -1})
    .populate('schedule')
    .populate('patient')
    .then(payments => { 
      res.render('payments', {payments})
    })
    .catch()
})  


// Show the page of payment
router.get('/search-by-payment/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  Payment.findById(id)
    .populate('schedule')
    .then(payment => {
      Patient.findById(payment.patient)
        .then(patient => {
          Schedule.findById(payment.schedule)
            .populate('service')
            .then(schedule => {
              // Render the page of payment
              res.render('payment', {payment, patient, schedule})
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
})

// Show the page of payment
router.get('/search-by-schedule/:id', auth.isUser, (req, res) => {
  const id = req.params.id

  Payment.findOne({schedule: id})
    .populate('schedule')
    .then(payment => {
      Patient.findById(payment.patient) 
        .then(patient => {
          Schedule.findById(payment.schedule)
            .populate('service')
            .then(schedule => {
              // Render the page of payment
              res.render('payment', {payment, patient, schedule})
            })
            .catch(err => console.log(err))
        })
        .catch(err => console.log(err))
    })
    .catch(err => console.log(err))
  
})

// Add Payment
router.post('/add-payment-two', auth.isUser, async (req, res) => {
  const data = req.body
  var filteredService = []
  var filteredMedicines = []
  var testQ = false;
  data.medicines.forEach(med => {
    Inventory.findById(med._id)
      .then(foundMed => {
        if(foundMed.quantity < med.quantity) {
          testQ = true
        }
      })
  }) 

  if(testQ) {
    req.flash('danger', `The quantity of ${foundMed} is not enough`)
    res.redirect('/schedule');
  } else {

    data.serviceSimple.forEach(serv => {
      if(serv != 'none') {
        filteredService.push(serv) 
      }
    })

    data.medicines.forEach(med => {
      Inventory.updateOne({_id: med._id}, {$inc: {quantity: -parseInt(med.quantity)}})
        .then(updatedMed => {
          console.log("updated") 
        })
    })

    data.medicines.forEach(med => {
      filteredMedicines.push(med)
    })
    Schedule.updateOne({_id: data.schedID}, 
        {
          medicine: filteredMedicines,
          medicine_total: data.mTotal,
          service_total: data.sTotal,
          grand_total: data.gTotal,
          medicine: filteredMedicines,
          done: true,
          paid: true
        }
      )
      .then(updatedSchedule => {
        Schedule.findById(data.schedID)
          .then(sched => {
            Payment.create(
              {
                schedule: data.schedID, 
                month: sched.month,
                day: sched.day, 
                year: sched.year,
                ampm: data.ampm,
                medicine_total: data.mTotal,
                service_total: data.sTotal,
                grand_total: data.gTotal,
                paid: true,
                patient: data.patientID,
                medicine: filteredMedicines,
                service: filteredService
              }
            )
            .then(createdPayment => {
              Patient.updateOne({_id: data.patientID}, {$set: {is_scheduled: false}})
                .then(updatedPatient => {
    
                  console.log('updated')
                })
            })
          })
          .catch(err => console.log(err))
       
      })
  }
})

// Add Payment
router.post('/add-payment', auth.isUser, async (req, res) => {
  const data = req.body
  var filteredService = []
  var filteredMedicines = []
  var testQ = false;
  data.medicines.forEach(med => {
    Inventory.findById(med._id)
      .then(foundMed => {
        if(foundMed.quantity < med.quantity) {
          testQ = true
        }
      })
  }) 

  if(testQ) {
    req.flash('danger', `The quantity of ${foundMed} is not enough`)
    res.redirect('/schedule');
  } else {

    data.serviceSimple.forEach(serv => {
      if(serv != 'none') {
        filteredService.push(serv) 
      }
    })

    data.medicines.forEach(med => {
      Inventory.updateOne({_id: med._id}, {$inc: {quantity: -parseInt(med.quantity)}})
        .then(updatedMed => {
          console.log("updated") 
        })
    })

    data.medicines.forEach(med => {
      filteredMedicines.push(med)
    })

    try {
      const updatedSchedule = await Schedule.updateOne({_id: data.schedID}, 
        {
          medicine: filteredMedicines,
          medicine_total: data.mTotal,
          service_total: data.sTotal,
          grand_total: data.gTotal,
          medicine: filteredMedicines,
          done: true,
          paid: true
        }
      )
         
      const sched = await Schedule.findById(data.schedID)
      const createdPayment = await Payment.create(
        {
          schedule: data.schedID, 
          month: sched.month,
          day: sched.day, 
          year: sched.year,
          ampm: data.ampm,
          medicine_total: data.mTotal,
          service_total: data.sTotal,
          grand_total: data.gTotal,
          paid: true,
          patient: data.patientID,
          medicine: filteredMedicines, 
          service: filteredService
        }
      )
      const updatedPatient = await Patient.updateOne({_id: data.patientID}, {$set: {is_scheduled: false}})
      
      open(`${host}/payment/show-invoice/${createdPayment._id}`)
        .then(() => console.log("Success"))
        .catch(err => console.log(err));

    } catch(err) {
      console.log(err);
    }

  }
})
 
router.get('/sad', async(req, res) => {
  open(`${host}/payment/test-pdf`)
    .then(() => {
      console.log("Success");
      res.redirect('/schedule');
      // res.status(204).send();
    })
    .catch(err => console.log(err));
})  

router.get('/test-pdf', async(req, res )=> {
  const invoice = {
    header: "L.A. Dental Clinic",
    logo: null,
    from: null,
    to: 'payment.patient.name',
    currency: "php",
    number: null,
    payment_terms: 'Cash - Paid',
    items: 'invoiceItems', 
    shipping: null,  
    amount_paid: 10, 
    balance: 0,
    notes: "Thanks for being an awesome customer!",
    terms: null

  }; 
  
  // const fileName = `${payment.patient.name} - ${payment.month}/${payment.day}/${payment.year}`

  try {
    console.log("aa")
    const generatePDF = await generateInvoice(invoice, __dirname + `/files/1.pdf`);
    console.log("bb")
    setTimeout(() => {
      console.log("cc")
      
      fs.readFile(__dirname + `/files/1.pdf` , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
      })
    }, 8000)  
  } catch(err) {
    console.log(err);
  }
})

router.get('/show-invoice/:id', async(req, res) => {

  const id = req.params.id;  
 
  const payment = await Payment.findById(id).populate('service').populate('patient').populate('schedule');
  
  console.log(payment) 
 
  var invoiceItems = []
      
  payment.service.forEach(product => {
    invoiceItems.push({
      name: product.name,
      quantity: 1,
      unit_cost: parseFloat(product.price).toFixed(2)
    })
  })  

  payment.medicine.forEach(product => {
    invoiceItems.push({
      name: product.text,
      quantity: product.quantity,
      unit_cost: parseFloat(product.price).toFixed(2) / parseFloat(product.quantity).toFixed(2)
    })
  }) 
  
  var invoice;

  invoice = {
    header: "L.A. Dental Clinic",
    logo: null,
    from: null,
    number: payment._id,
    date: `${months[parseInt(payment.month) - 1]} ${payment.day}, ${payment.year}`,
    to: payment.patient.name,
    currency: "php",
    payment_terms: 'Cash - Paid',
    items: invoiceItems, 
    shipping: null,  
    amount_paid: parseFloat(payment.grand_total).toFixed(2), 
    balance: null,
    notes: "Thanks for being an awesome customer!",
    terms: null

  };
 
  const fileName = `${payment.patient.name} ${payment.month}-${payment.day}-${payment.year}`

  try { 
    console.log("aa")
    const generatePDF = await generateInvoice(invoice, __dirname + `/files/${fileName}.pdf`);
    console.log("bb")
    setTimeout(() => {
      console.log("cc")      
      fs.readFile(__dirname + `/files/${fileName}.pdf` , function (err,data){
        res.contentType("application/pdf");
        res.send(data);
      })
    }, 15000)  
  } catch(err) {
    console.log(err);
  }
  
})

function generateInvoice(invoice, filename, success, error) {
  var postData = JSON.stringify(invoice);
  var options = {
      hostname  : "invoice-generator.com",
      port      : 443,
      path      : "/",
      method    : "POST",
      headers   : {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData)
      }
  };

  var file = fs.createWriteStream(filename);

  var req = https.request(options, function(res) {
    res.on('data', function(chunk) {
        file.write(chunk);
    })
    .on('end', function() {
        file.end();

        if (typeof success === 'function') {
            success();
        }
    });
  });
  req.write(postData);
  req.end();

  if (typeof error === 'function') {
      req.on('error', error);
  }
}

module.exports = router;