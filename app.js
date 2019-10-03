// Import all packages needed from node_modules
const express           = require('express'),
      bodyParser        = require('body-parser'),
      mongoose          = require('mongoose'),
      path              = require('path'),
      session           = require('express-session'),
      expressValidator  = require('express-validator'),
      fileUpload        = require('express-fileupload'),
      passport          = require('passport')
      ;
 
const app = express();

const auth = require('./config/auth');

// Setup Database
const myDb = require('./config/database');
mongoose.connect(myDb.databaseDev, { useNewUrlParser: true,  useUnifiedTopology: true});
mongoose.connection
  .on('error', console.error.bind(console, 'Connection error: '))
  .once('open', () => console.log('Connected to MongoDB'))

// Setup Middlewares and other settings
app.use(express.static(path.join(__dirname, 'public')));
// app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


app.use(session({
  secret: auth.secret,
  resave: true,
  saveUninitialized: true
//  cookie: { secure: true }
}));

// Set global variable errors to null
app.locals.errors = null;

// For flash message
app.use(require('connect-flash')());
app.use(function (req, res, next) {
    res.locals.messages = require('express-messages')(req, res);
    next();
});

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Set user if available. If not, set it to null
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Imported routes
const scheduleRoutes = require('./routes/schedule')
const patientRoutes = require('./routes/patient')
const userRoutes = require('./routes/user')
const serviceRoutes = require('./routes/service')
const inventoryRoutes = require('./routes/inventory') 
const paymentRoutes = require('./routes/payment')

// Include routes in server
app.use('/schedule', scheduleRoutes);
app.use('/patient', patientRoutes);
app.use('/services', serviceRoutes);
app.use('/inventory', inventoryRoutes);
app.use('/payment', paymentRoutes);
app.use('/', userRoutes)

app.get('*', function(req, res){
  res.status(404).render('error');
});

// Server Host
const server_host = process.env.YOUR_HOST || '0.0.0.0';

// Choose Port
const port = process.env.PORT || 3000 ;

// Start Server
app.listen(port, server_host,() => {
  console.log(`Server started on ${server_host} ${port}`);
});