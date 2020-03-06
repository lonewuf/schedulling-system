// Dev host
const host = 'http://localhost:3000';

// Showcase Host 
// const host = 'https://la-dental-clinic.herokuapp.com'

// Global Variables
const numOfHours = 1
const regexAge = /^[0-9]*$/
var validationErrors = []
const months = [
  "January", 
  "February", 
  "March", 
  "April", 
  "May", 
  "June", 
  "July", 
  "August", 
  "September", 
  "October", 
  "November", 
  "December" 
];  


// All data loaded here
var schedule_data = {
  "schedules": [], 
  "patients": [],
  "services": [],
  "inventory": []
};

// All patient's data loaded here
var allPatients = []

// Initialize all components needed
$(document).ready(function(){ 
  var date = new Date();
  var today = date.getDate();
  
  // Set click handlers for DOM elements
  $(".right-button").click({date: date}, next_year);
  $(".left-button").click({date: date}, prev_year);
  $(".month").click({date: date}, month_click);
  $("#add-patientWithSched").click({date: date}, new_patient_with_schedule);
  $("#add-schedule").click({date: date}, new_schedule);
  $("#add-patient").click({date: date}, new_patient);
  $("#search-patient").keyup({date: date}, search_patient)

  // Set current month as active
  $(".months-row").children().eq(date.getMonth()).addClass("active-month");

  // Load all data for this page
  init_events()

  init_calendar(date)

  // Catch bug for not displaying schedules on load
  setTimeout(function(){
    $(".right-button").click();
  },2000);
  setTimeout(function(){
    $(".left-button").click();
  },6000);

  // Check and show all events
  var events = check_events(today, date.getMonth()+1, date.getFullYear());
  show_events(events, months[date.getMonth()], today);
  
  
});


//------------------------------------------------------
// Get all data needed and load it in "schedule_data"   |
//------------------------------------------------------

function  init_events() {
  $.ajax({
    url: `${host}/schedule/initial-load`, 
    type: "GET",
    dataType: "json"
  })
  .then(data => {
        schedule_data.schedules = data.scheduleData
        schedule_data.patients = data.patientData
        schedule_data.services = data.serviceData
        schedule_data.inventory = data.inventoryData
        allPatients = schedule_data.patients;
  })
  .catch(err => console.log(err))
}

//------------------------------------------------------
// Initialize the calendar by appending the HTML dates  |
//------------------------------------------------------
function init_calendar(date) {
  $(".tbody").empty();
  $(".events-container").empty();
  var calendar_days = $(".tbody");
  var month = date.getMonth();
  var year = date.getFullYear();
  var day_count = days_in_month(month, year);
  var row = $("<tr class='table-row'></tr>");
  var today = date.getDate();
  // Set date to 1 to find the first day of the month
  date.setDate(1);
  var first_day = date.getDay();
  // 35+firstDay is the number of date elements to be added to the dates table
  // 35 is from (7 days in a week) * (up to 5 rows of dates in a month)
  for(var i=0; i<35+first_day; i++) {
      // Since some of the elements will be blank, 
      // need to calculate actual date from index
      var day = i-first_day+1;
      // If it is a sunday, make a new row
      if(i%7===0) {
          calendar_days.append(row);
          row = $("<tr class='table-row'></tr>");
      }
      // if current index isn't a day in this month, make it blank
      if(i < first_day || day > day_count) {
          var curr_date = $("<td class='table-date nil'>"+"</td>");
          row.append(curr_date);
      }   
      else {
          var curr_date = $("<td class='table-date'>"+day+"</td>");
          var events = check_events(day, month+1, year);
          if(today===day && $(".active-date").length===0) {
              curr_date.addClass("active-date");
              show_events(events, months[month], day);
          }
          // If this date has any events, style it with .event-date
          if(events.length!==0) {
              curr_date.addClass("event-date");
          }
          // Set onClick handler for clicking a date
          curr_date.click({events: events, month: months[month], day:day}, date_click);
          row.append(curr_date);
      }
  }
  // Append the last row and set the current year
  calendar_days.append(row);
  $(".year").text(year);
}


//------------------------------------------------------
// Get the number of days in a given month/year         |
//------------------------------------------------------
function days_in_month(month, year) {
  var monthStart = new Date(year, month, 1);
  var monthEnd = new Date(year, month + 1, 1);
  return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);    
}

//------------------------------------------------------
// Event handler for when a date is clicked             |
//------------------------------------------------------
function date_click(event) {
  $(".events-container").show(400);
  $("#dialog").hide(250);
  $("#dialog-2").hide(250);
  $(".active-date").removeClass("active-date");
  $(this).addClass("active-date");
  show_events(event.data.events, event.data.month, event.data.day);
};

//------------------------------------------------------
// Event handler for when a month is clicked            |
//------------------------------------------------------
function month_click(event) {
  $(".events-container").show(400);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  var date = event.data.date;
  $(".active-month").removeClass("active-month");
  $(this).addClass("active-month");
  var new_month = $(".month").index(this);
  date.setMonth(new_month);
  init_calendar(date);
}

//----------------------------------------------------------
// Event handler for when the year right-button is clicked  |
//----------------------------------------------------------
function next_year(event) {
  $("#dialog").hide(250);
  $("#dialog-2").hide(250);
  var date = event.data.date;
  var new_year = date.getFullYear()+1;
  $("year").html(new_year);
  date.setFullYear(new_year);
  init_calendar(date);
}

//---------------------------------------------------------
// Event handler for when the year left-button is clicked  |
//---------------------------------------------------------
function prev_year(event) {
  $("#dialog").hide(250);
  var date = event.data.date;
  var new_year = date.getFullYear()-1;
  $("year").html(new_year);
  date.setFullYear(new_year);
  init_calendar(date);
}

//------------------------------------------------------
// Display Patient list to schedule them                |
//------------------------------------------------------
function new_schedule(event) {

  // Empty .patients-container
  $(".patients-container").empty()
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
      return;

  $("#dialog-2 input[type=text]").val('');
  $(".events-container").hide(250);
  $("#dialog").hide(250);
  $("#dialog-2").show(500);

  // Get all patients data then sotre it
  allPatients = schedule_data.patients;
  // Filter patient list that is not scheduled
  var availablePatients = schedule_data.patients.filter(patient => patient.is_scheduled === false)

  // If filtered patient has value
  if(availablePatients.length > 0){
    availablePatients.forEach(patient => {

      // Setup all tags
      var myContainer = $("<div class='container'></div>");
      var event_card = $("<div class='card text-white bg-primary m-4'></div>");
      var event_card_header = $(`<div class='card-header'>Name: ${patient.name}</div>`);
      var event_card_body = $("<div class='card-body'></div>");
      var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${patient.contact_number}</p>`);
      var event_card_time = $(`<p class='card-text'>Age: ${patient.age}</p>`);
      var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id=${patient._id}-edit-patient href="#">Edit Patient</strong></div>`);
      var event_card_sched = $(`<div class='card-text '><strong><a class="btn btn-sm btn-success" id=${patient._id}-schedule-patient href="#">Schedule Patient</strong></div>`);

      // Append all tags in .patients-container
      $(event_card_body).append(event_card_contact_number).append(event_card_time).append(event_card_edit).append(event_card_sched);
      $(event_card).append(event_card_header);
      $(event_card).append(event_card_body);
      $(myContainer).append(event_card);
      $(".patients-container").append(myContainer)

      // Add click events on buttons
      $(`#${patient._id}-edit-patient`).click({id: patient._id, date: event.data.date}, update_patient);
      $(`#${patient._id}-schedule-patient`).click({id: patient._id, date: event.data.date}, schedule_patient);
    
    })
  
  // If no patient or all patient are scheduled
  } else {
    var myContainer = $("<div class='container'></div>");
    var noPatientAvailable = $("<h4 class='display-4 text-center'>No Patient Available</h4>")
    $(myContainer).append(noPatientAvailable);
    $(".patients-container").append(myContainer)
    console.log('213123')
  }
}

//------------------------------------------------------
// Handles action on searching patient                  |
//------------------------------------------------------
function search_patient(event) {

  // Get the value of input#search-patient
  var searchName = $("#search-patient").val()
  // Filter patient that is not scheduled
  allPatients = schedule_data.patients.filter(patient => patient.is_scheduled === false)
  // Filter name based on input value()
  allPatients = allPatients.filter(patient => patient.name.includes(searchName))

  // empty .patients container
  $(".patients-container").empty()
  
  allPatients.forEach(patient => {
    // Setup all tags
    var myContainer = $("<div class='container'></div>");
    var event_card = $("<div class='card text-white bg-primary m-4'></div>");
    var event_card_header = $(`<div class='card-header'>Name: ${patient.name}</div>`);
    var event_card_body = $("<div class='card-body'></div>");
    var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${patient.contact_number}</p>`);
    var event_card_time = $(`<p class='card-text'>Age: ${patient.age}</p>`);
    var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id=${patient._id}-edit-patient href="#">Edit Patient</strong></div>`);
    var event_card_sched = $(`<div class='card-text '><strong><a class="btn btn-sm btn-success" id=${patient._id}-schedule-patient href="#">Schedule Patient</strong></div>`);

    // Append all tags in patients-container
    $(event_card_body).append(event_card_contact_number).append(event_card_time).append(event_card_edit).append(event_card_sched);
    $(event_card).append(event_card_header);
    $(event_card).append(event_card_body);
    $(myContainer).append(event_card);
    $(".patients-container").append(myContainer)
    
    // Add click events in buttons
    $(`#${patient._id}-edit-patient`).click({id: patient._id, date: event.data.date}, update_patient);
    $(`#${patient._id}-schedule-patient`).click({id: patient._id, date: event.data.date}, schedule_patient);
  })

}

//------------------------------------------------------
// Remove texts and classes in inputs                   |
//------------------------------------------------------
function removeTextAndClassinInputs() {
  $("input").prop("checked", false)
  $("textarea").val("")

  // Empty array of validationErrors
  validationErrors = []

  // Remove text in validations
  $('.all-validations').text("")
  $('input').removeClass("is-invalid");

  // Remove all classes in forms and set text to blank
  $("#name").click(function(){
    $("#name").removeClass("is-invalid");
    $("#name-invalid").text("");
  })
  $("#contact_number").click(function(){
    $("#contact_number").removeClass("is-invalid");
    $("#contact_number-invalid").text("");
  })
  $("#age").click(function(){
    $("#age").removeClass("is-invalid");
    $("#age-invalid").text("");
  })
  $("#ampm").click(function(){
    $("#ampm").removeClass("is-invalid");
    $("#ampm-invalid").text("");
  })
  $("#service").click(function(){
    $("#service").removeClass("is-invalid");
    $("#service-invalid").text("");
    $("#service2").removeClass("is-invalid");
    $("#service2-invalid").text("");
  })
  $("#service2").click(function(){
    $("#service2").removeClass("is-invalid");
    $("#service2-invalid").text("");
    $("#service").removeClass("is-invalid");
    $("#service-invalid").text("");
  })
}

//------------------------------------------------------
// Fillups forms of specific patient                    |
//------------------------------------------------------
function fillupForm(patient) {
  
  // Patient info
  $("#name").val(patient.name)
  $(`input[name='gender'][value="${patient.gender}"]`).prop("checked", true)
  $("#age").val(patient.age)
  $("#nationality").val(patient.nationality)
  $("#occupation").val(patient.occupation)
  $("#contact_number").val(patient.contact_number)
  $("#chief_complainant").val(patient.chief_compliant)
  $("#referred_by").val(patient.reffered_by)
  $("#diagnosis").val(patient.diagnosis)
  $("#address").val(patient.address)
  
  // Teeth info
  $("#t-11").val(patient.teeth.t_11)
  $("#t-12").val(patient.teeth.t_12)
  $("#t-13").val(patient.teeth.t_13)
  $("#t-14").val(patient.teeth.t_14)
  $("#t-15").val(patient.teeth.t_15)
  $("#t-16").val(patient.teeth.t_16)
  $("#t-17").val(patient.teeth.t_17)
  $("#t-18").val(patient.teeth.t_18)
  $("#t-21").val(patient.teeth.t_21)
  $("#t-22").val(patient.teeth.t_22)
  $("#t-23").val(patient.teeth.t_23)
  $("#t-24").val(patient.teeth.t_24)
  $("#t-25").val(patient.teeth.t_25)
  $("#t-26").val(patient.teeth.t_26)
  $("#t-27").val(patient.teeth.t_27)
  $("#t-28").val(patient.teeth.t_28)
  $("#t-31").val(patient.teeth.t_31)
  $("#t-32").val(patient.teeth.t_32)
  $("#t-33").val(patient.teeth.t_33)
  $("#t-34").val(patient.teeth.t_34)
  $("#t-35").val(patient.teeth.t_35)
  $("#t-36").val(patient.teeth.t_36)
  $("#t-37").val(patient.teeth.t_37)
  $("#t-38").val(patient.teeth.t_38)
  $("#t-41").val(patient.teeth.t_41)
  $("#t-42").val(patient.teeth.t_42)
  $("#t-43").val(patient.teeth.t_43)
  $("#t-44").val(patient.teeth.t_44)
  $("#t-45").val(patient.teeth.t_45)
  $("#t-46").val(patient.teeth.t_46)
  $("#t-47").val(patient.teeth.t_47)
  $("#t-48").val(patient.teeth.t_48)

  // Medical History
  $(`input[name='hypertension'][value="${patient.hypertension ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='epilepsy'][value="${patient.epilepsy ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='diabetes'][value="${patient.diabetes ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='kidney_disease'][value="${patient.kidney_disease ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='heart_disease'][value="${patient.heart_disease ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='liver_disease'][value="${patient.liver_disease ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='allergy'][value="${patient.allergy ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='asthma'][value="${patient.asthma ? "yes" : "no"}"]`).prop("checked", true)
  $(`input[name='others'][value="${patient.others ? "yes" : "no"}"]`).prop("checked", true)

  // Oral Conditions
  $(`input[name='deposit_stains'][value="${patient.deposit_stains}"]`).prop("checked", true)
  $(`input[name='oral_hygiene'][value="${patient.oral_hygiene}"]`).prop("checked", true)
  $("#treatment_planning").val(patient.treatment_planning)

}



//------------------------------------------------------
// Handles actions when updating patient               |
//------------------------------------------------------
function update_patient(event) {

  $(".for-schedule").empty()

  // Enabling forms
  enableForms()
  removeTextAndClassinInputs()
  // if a date isn't selected then do nothing
  if($(".active-date").length===0) 
    return;
  // remove red error input on click
  $("input").click(function(){
    $(this).removeClass("error-input");
  })

  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  $("#dialog").show(400);
  
  $(".for-schedule").empty()
  // Event handler for cancel button
  $("#cancel-button").click(function() {
    $("#name").removeClass("error-input");
    $("#count").removeClass("error-input");
    $("#dialog").hide(300);
    $(".events-container").show(300);
  });

  // Filter patients array to select specific patient then sotre it
  var editThisPatient = schedule_data.patients.filter(patient => patient._id == event.data.id)
  editThisPatient = editThisPatient[0]

  // Display the name of patient "Update (patient name)" 
  $("#flexible-text").text(`Update ${editThisPatient.name}`)

  // Fill up forms based on what stored in "editThisPatient"
  fillupForm(editThisPatient)

  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {

    // Store all data needed for updating patient
    var date = event.data.date;
    var name = $("#name").val().trim();
    // Radio button get
    var genderCheck = $("input[type='radio'][name='gender']:checked")
    var gender = genderCheck.length > 0 ? genderCheck.val() : '';
    var address = $("#address").val().trim();
    var contact_number = $("#contact_number").val().trim();
    // var company = $("#company").val().trim();
    var age = $("#age").val().trim();
    var nationality = $("#nationality").val().trim();
    var occupation = $("#occupation").val().trim();
    var reffered_by = $("#referred_by").val().trim();

    var chief_complainant = $("#chief_complainant").val().trim();
    var diagnosis = $("#diagnosis").val();

    var patientDetails = {
      name,
      gender,
      address,
      contact_number,
      age,
      nationality,
      occupation,
      reffered_by,
      chief_complainant,
      diagnosis
    }

    // Teeth comment
    var t_11 = $("#t-11").val().trim()
    var t_12 = $("#t-12").val().trim()
    var t_13 = $("#t-13").val().trim()
    var t_14 = $("#t-14").val().trim()
    var t_15 = $("#t-15").val().trim()
    var t_16 = $("#t-16").val().trim()
    var t_17 = $("#t-17").val().trim()
    var t_18 = $("#t-18").val().trim()
    var t_21 = $("#t-21").val().trim()
    var t_22 = $("#t-22").val().trim()
    var t_23 = $("#t-23").val().trim()
    var t_24 = $("#t-24").val().trim()
    var t_25 = $("#t-25").val().trim()
    var t_26 = $("#t-26").val().trim()
    var t_27 = $("#t-27").val().trim()
    var t_28 = $("#t-28").val().trim()
    var t_31 = $("#t-31").val().trim()
    var t_32 = $("#t-32").val().trim()
    var t_33 = $("#t-33").val().trim()
    var t_34 = $("#t-34").val().trim()
    var t_35 = $("#t-35").val().trim()
    var t_36 = $("#t-36").val().trim()
    var t_37 = $("#t-37").val().trim()
    var t_38 = $("#t-38").val().trim()
    var t_41 = $("#t-41").val().trim()
    var t_42 = $("#t-42").val().trim()
    var t_43 = $("#t-43").val().trim()
    var t_44 = $("#t-44").val().trim()
    var t_45 = $("#t-45").val().trim()
    var t_46 = $("#t-46").val().trim()
    var t_47 = $("#t-47").val().trim()
    var t_48 = $("#t-48").val().trim() 

    // Medical history
    var hypertensionCheck = $("input[type='radio'][name='hypertension']:checked")
    var epilepsyCheck = $("input[type='radio'][name='epilepsy']:checked")
    var diabetesCheck = $("input[type='radio'][name='diabetes']:checked")
    var kidney_diseaseCheck = $("input[type='radio'][name='kidney_disease']:checked")
    var heart_diseaseCheck = $("input[type='radio'][name='heart_disease']:checked")
    var liver_diseaseCheck = $("input[type='radio'][name='liver_disease']:checked")
    var allergyCheck = $("input[type='radio'][name='allergy']:checked")
    var asthmaCheck = $("input[type='radio'][name='asthma']:checked")
    var othersCheck = $("input[type='radio'][name='others']:checked")

    var hypertension = hypertensionCheck.length > 0 && hypertensionCheck.val() == 'yes' ? true : false;
    var epilepsy = epilepsyCheck.length > 0 && epilepsyCheck.val() == 'yes' ? true : false;
    var diabetes = diabetesCheck.length > 0 && diabetesCheck.val() == 'yes' ? true : false;
    var kidney_disease = kidney_diseaseCheck.length > 0 && kidney_diseaseCheck.val() == 'yes' ? true : false;
    var heart_disease = heart_diseaseCheck.length > 0 && heart_diseaseCheck.val() == 'yes' ? true : false;
    var liver_disease = liver_diseaseCheck.length > 0 && liver_diseaseCheck.val() == 'yes' ? true : false;
    var allergy = allergyCheck.length > 0 && allergyCheck.val() == 'yes' ? true : false;
    var asthma = asthmaCheck.length > 0 && asthmaCheck.val() == 'yes' ? true : false;
    var others = othersCheck.length > 0 && othersCheck.val() == 'yes' ? true : false;

    var treatment_planning = $("#treatment_planning").val();

    // Oral conditions
    var depositStainsCheck = $("input[type='radio'][name='deposit_stains']:checked")
    var deposit_stains = depositStainsCheck.length > 0 ? depositStainsCheck.val() : '';
    var oralHygieneCheck = $("input[type='radio'][name='oral_hygiene']:checked")
    var oral_hygiene = oralHygieneCheck.length > 0 ? oralHygieneCheck.val() : '';
  
    var oralConditions = {
      deposit_stains,
      oral_hygiene
    }

    var medicalHistory = {hypertension,
      epilepsy,
      diabetes,
      kidney_disease,
      heart_disease,
      liver_disease,
      allergy,
      asthma,
      others
    }

    
    var teethComments = {
      t_11,
      t_12,
      t_13, 
      t_14,
      t_15,
      t_16,
      t_17,
      t_18,
      t_21, 
      t_22,
      t_23,
      t_24,
      t_25,
      t_26,
      t_27,
      t_28,
      t_31,
      t_32,
      t_33,
      t_34,
      t_35,
      t_36,
      t_37,
      t_38,
      t_41,
      t_42,
      t_43,
      t_44,
      t_45,
      t_46,
      t_47,
      t_48,
    }

    // Check validations
    checkValidationsForPatient(name, age, contact_number)

    // If no error
    if(validationErrors.length === 0) {
      var patientID = event.data.id
      var day = parseInt($(".active-date").html());
      $("#dialog").hide(250);

      // Call another function to store it on database
      update_patient_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions, patientID);
      date.setDate(day);
      init_calendar(date);

    // If error arise, alert user
    } else {
      alert(`Please check your inputs in ${validationErrors}`)
    }
  });

}

//------------------------------------------------------
// Call route to update Patient                         |
//------------------------------------------------------
function update_patient_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions, patientID) {

  // Create an object for updated patient
  var updatePatient = {
    // Patient details
    "name": patientDetails.name,
    "gender": patientDetails.gender,
    "address": patientDetails.address,
    "contact_number": patientDetails.contact_number,
    "age": patientDetails.age,
    "nationality": patientDetails.nationality,
    "occupation": patientDetails.occupation,
    "reffered_by": patientDetails.reffered_by,
    "chief_complainant": patientDetails.chief_complainant,
    "diagnosis": patientDetails.diagnosis,
    // Teeth comments
    "t_11": teethComments.t_11,
    "t_12": teethComments.t_12,
    "t_13": teethComments.t_13,
    "t_14": teethComments.t_14,
    "t_15": teethComments.t_15,
    "t_16": teethComments.t_16,
    "t_17": teethComments.t_17,
    "t_18": teethComments.t_18,
    "t_21": teethComments.t_21,
    "t_22": teethComments.t_22,
    "t_23": teethComments.t_23,
    "t_24": teethComments.t_24,
    "t_25": teethComments.t_25,
    "t_26": teethComments.t_26,
    "t_27": teethComments.t_27,
    "t_28": teethComments.t_28,
    "t_31": teethComments.t_31,
    "t_32": teethComments.t_32,
    "t_33": teethComments.t_33,
    "t_34": teethComments.t_34,
    "t_35": teethComments.t_35,
    "t_36": teethComments.t_36,
    "t_37": teethComments.t_37,
    "t_38": teethComments.t_38,
    "t_41": teethComments.t_41,
    "t_42": teethComments.t_42,
    "t_43": teethComments.t_43,
    "t_44": teethComments.t_44,
    "t_45": teethComments.t_45,
    "t_46": teethComments.t_46,
    "t_47": teethComments.t_47,
    "t_48": teethComments.t_48,
    // Medical History
    "hypertension": medicalHistory.hypertension,
    "epilepsy": medicalHistory.epilepsy,
    "diabetes": medicalHistory.diabetes,
    "kidney_disease": medicalHistory.kidney_disease,
    "heart_disease": medicalHistory.heart_disease,
    "liver_disease": medicalHistory.liver_disease,
    "allergy": medicalHistory.allergy,
    "asthma": medicalHistory.asthma,
    "others": medicalHistory.others,
    "treatment_planning": treatment_planning,
    // Oral conditions
    "deposit_stains": oralConditions.deposit_stains,
    "oral_hygiene": oralConditions.oral_hygiene,

    // Patient ID
    "patientID": patientID
  };

  $.ajax({
    type: 'POST',
    data: JSON.stringify(updatePatient),
    url: `${host}/patient/update-patient`,
    contentType: 'application/json'
  })
  .then(data => {
    console.log(data)
    // location.reload(true) 
  })
  .catch(err => console.log(err))
  location.reload(true)
}

//------------------------------------------------------
// Disabling forms                                      |
//------------------------------------------------------
function disableForms() {
  $("input").prop("disabled", true)
  $("textarea").prop("disabled", true)
  $("#ok-button").prop("disabled", false)
  $("#cancel-button").prop("disabled", false)
  $("#search-patient").prop("disabled", false)
}

//------------------------------------------------------
// Enable forms                                         |
//------------------------------------------------------
function enableForms() {
  $("textarea").prop("disabled", false)
  $("input").prop("disabled", false)
}

//------------------------------------------------------
// Handles on scheduling patient                       |
//------------------------------------------------------
function schedule_patient(event) {

  // Empty for-schedule
  $(".for-schedule").empty()
  // Remove text and classes
  removeTextAndClassinInputs()
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
    return;
  // remove red error input on click
  $("input").click(function(){
    $(this).removeClass("error-input");
  })

  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  $("#dialog").show(400);
  
  // Append forms for scheduling
  appendScheduleForms()

  // Filter and store patient to be scheduled
  var scheduleThisPatient = schedule_data.patients.filter(patient => patient._id == event.data.id)
  scheduleThisPatient = scheduleThisPatient[0]
  $("#flexible-text").text(`Schedule ${scheduleThisPatient.name}`)

  // Fillup forms based on "scheduleThisPatient"
  fillupForm(scheduleThisPatient)

  // Disable forms
  disableForms()
  
  // Event handler for cancel button
  $("#cancel-button").click(function() {
    $("#name").removeClass("error-input");
    $("#count").removeClass("error-input");
    $("#dialog").hide(300);
    $(".events-container").show(300);
  });
  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
    var date = event.data.date;
    // Get all forms needed for scheduling this patient
    var ampm = $("#ampm").val();
    // var duration = $("#duration").val();
    var service = $("#service").val();
    var service2 = $("#service2").val();
    // var service3 = $("#service3").val();
    // var service4 = $("#service4").val();
    var services = [service, service2]
    var patientID = event.data.id
    var day = parseInt($(".active-date").html());

    // Validate data for scheduling
    // checkValidationsForSchedule(ampm, duration, service, service2, service3, service4)
    checkValidationsForSchedule(ampm, service, service2)

    // If no error
    if (validationErrors.length == 0) {

      // Check if time is occupied
      var filteredTime = check_time_of_events(day, date.getMonth()+1, date.getFullYear(), ampm)
      // if chosen time is occupied, inform user
      if(filteredTime.length != 0) {
        $("#ampm").addClass("is-invalid");
        $("#ampm-invalid").addClass("invalid-feedback");
        $("#ampm-invalid").text("Time is already occupied")
        validationErrors.push('Time')
      }
      
      // If time is available
      if(validationErrors.length == 0) {

        // Filter services that is value is not "none"
        var servicesFiltered = []
        services.forEach(serv => {
          if(serv != 'none'){
            servicesFiltered.push(serv)
          }
        })
        $("#dialog").hide(250);
        
        // Call function to schedule patient
        schedule_patient_json(date, day, ampm, servicesFiltered, patientID);
        date.setDate(day);
        init_calendar(date);

      // If time is not available, alert user
      } else {
        alert(`Time is already occupied`)
      }

    // If error(s) arise, Inform user
    } else {
      alert(`Please check your inputs in : ${validationErrors}`)
    }
  });

}

//------------------------------------------------------
// Call route to schedule patient                       |
//------------------------------------------------------
function schedule_patient_json(date, day, ampm, services, patientID) {

  var myServices = []
  services.forEach(service => {
    myServices.push(service)
  })
  // Create new schedule
  var newSchedule = {
    "year": date.getFullYear(),
    "month": date.getMonth()+1,
    "day": day,
    "ampm": ampm,
    "patientID": patientID,
    "serviceSimple": myServices
  };
  $.ajax({
    type: 'POST',
    data: JSON.stringify(newSchedule),
    url: `${host}/schedule/add-schedule`,
    contentType: 'application/json'
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  // Reload page to set all changes
  location.reload(true)
}

//------------------------------------------------------
// Append all select tags with corresponding value      |
//------------------------------------------------------
function appendScheduleFormsWithVal(event) {
  // Bring back scheduling related tags
  var row = $(`<div class="row"></div>`)
  var row2 = $(`<div class="row"></div>`)

  var col1 = $(`<div class="col-lg-4"></div>`)
  var col2 = $(`<div class="col-lg-4"></div>`)
  var col3 = $(`<div class="col-lg-4"></div>`)
  var col4 = $(`<div class="col-lg-4"></div>`)
  var col5 = $(`<div class="col-lg-4"></div>`)
  var col6 = $(`<div class="col-lg-4"></div>`)

  var form1 = $(`<div class="form-group"></div>`)
  var form2 = $(`<div class="form-group"></div>`)
  var form3 = $(`<div class="form-group"></div>`)
  var form4 = $(`<div class="form-group"></div>`)
  var form5 = $(`<div class="form-group"></div>`)

  var label1 = $(`<label for="ampm">Time: </label>`)
  var label2 = $(`<label for="service">Service: </label>`)
  var label3 = $(`<label for="service2">Service2: </label>`)
  var label5 = $(`<label for="day">Day: </label>`)
  var label4 = $(`<label for="month">Month: </label>`)

  var select1 = $(`<select id="ampm" name="ampm" class="form-control form-control-sm"></select>`)
  var select2 = $(`<select id="service" name="service" class="form-control form-control-sm">`)
  var select3 = $(`<select id="service2" name="service2" class="form-control form-control-sm">`)
  var select5 = $(`<select id="day" name="day" class="form-control form-control-sm"></select>`)
  var select4 = $(`<select id="month" name="month" class="form-control form-control-sm">`)

  

  // Appending option tag for time
  select1.append(`<option value="none">Choose Time</option>`)             
          .append(`<option value="7-00-AM">7:00 AM</option>`)
          .append(`<option value="7-15-AM">7:15 AM</option>`)
          .append(`<option value="7-30-AM">7:30 AM</option>`)
          .append(`<option value="7-45-AM">7:45 AM</option>`)
          .append(`<option value="8-00-AM">8:00 AM</option>`)
          .append(`<option value="8-15-AM">8:15 AM</option>`)
          .append(`<option value="8-30-AM">8:30 AM</option>`)
          .append(`<option value="8-45-AM">8:45 AM</option>`)
          .append(`<option value="9-00-AM">9:00 AM</option>`)
          .append(`<option value="9-15-AM">9:15 AM</option>`)
          .append(`<option value="9-30-AM">9:30 AM</option>`)
          .append(`<option value="9-45-AM">9:45 AM</option>`)
          .append(`<option value="10-00-AM">10:00 AM</option>`)
          .append(`<option value="10-15-AM">10:15 AM</option>`)
          .append(`<option value="10-30-AM">10:30 AM</option>`)
          .append(`<option value="10-45-AM">10:45 AM</option>`)
          .append(`<option value="11-00-AM">11:00 AM</option>`)
          .append(`<option value="11-15-AM">11:15 AM</option>`)
          .append(`<option value="11-30-AM">11:30 AM</option>`)
          .append(`<option value="11-45-AM">11:45 AM</option>`)
          .append(`<option value="12-00-PM">12:00 PM</option>`)
          .append(`<option value="12-15-PM">12:15 PM</option>`)
          .append(`<option value="12-30-PM">12:30 PM</option>`)
          .append(`<option value="12-45-PM">12:45 PM</option>`)
          .append(`<option value="1-00-PM">1:00 PM</option>`)
          .append(`<option value="1-15-PM">1:15 PM</option>`)
          .append(`<option value="1-30-PM">1:30 PM</option>`)
          .append(`<option value="1-45-PM">1:45 PM</option>`)
          .append(`<option value="2-00-PM">2:00 PM</option>`)
          .append(`<option value="2-15-PM">2:15 PM</option>`)
          .append(`<option value="2-30-PM">2:30 PM</option>`)
          .append(`<option value="2-45-PM">2:45 PM</option>`)
          .append(`<option value="3-00-PM">3:00 PM</option>`)
          .append(`<option value="3-15-PM">3:15 PM</option>`)
          .append(`<option value="3-30-PM">3:30 PM</option>`)
          .append(`<option value="3-45-PM">3:45 PM</option>`)
          .append(`<option value="4-00-PM">4:00 PM</option>`)
          .append(`<option value="4-15-PM">4:15 PM</option>`)
          .append(`<option value="4-30-PM">4:30 PM</option>`)
          .append(`<option value="4-45-PM">4:45 PM</option>`)
          .append(`<option value="5-00-PM">5:00 PM</option>`)
          .append(`<option value="5-15-PM">5:15 PM</option>`)
          .append(`<option value="5-30-PM">5:30 PM</option>`)
          .append(`<option value="5-45-PM">5:45 PM</option>`)
          .append(`<option value="6-00-PM">6:00 PM</option>`)
         

  // Appending all option tag for service
  select2.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select2.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Appending all option tag for service2
  select3.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select3.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Append months
  select4.append('<option value="1">January</option>')
        .append('<option value="2">February</option>')
        .append('<option value="3">March</option>')
        .append('<option value="4">April</option>')
        .append('<option value="5">May</option>')
        .append('<option value="6">June</option>')
        .append('<option value="7">July</option>')
        .append('<option value="8">August</option>')
        .append('<option value="9">September</option>')
        .append('<option value="10">October</option>')
        .append('<option value="11">November</option>')
        .append('<option value="12">December</option>')
  
  // Code for dynamic days depending on selected month
  var myDate = new Date()
  var numOfDays = new Date(myDate.getFullYear(), event.month, 0).getDate()
  for(let i = 1; i <= numOfDays; i++) {
    select5.append(`<option value="${i}">${i}</option>`)
  }

  // For validation display
  var validationTime = $(`<div id="ampm-invalid" class="all-validations"></div>`)
  var validationService = $(`<div id="service-invalid" class="all-validations"></div>`)
  var validationService2 = $(`<div id="service2-invalid" class="all-validations"></div>`)

  // Appending tags
  form1.append(label1).append(select1).append(validationTime)
  form2.append(label2).append(select2).append(validationService)
  form3.append(label3).append(select3).append(validationService2)
  form4.append(label4).append(select4)
  form5.append(label5).append(select5)
  col1.append(form1)
  col2.append(form2)
  col3.append(form3)
  col4.append(form4)
  col5.append(form5)
  row.append(col1).append(col2).append(col3)
  row2.append(col4).append(col5).append(col6)
  $(".for-schedule").append(row).append(row2)

  // Select all value depending on the patient's schedule and service(s)
  var servicesMap = event.service.map(serv => serv._id)
  $("#ampm").val(event.ampm) 
  if(event.service.length == 1)
    $("#service").val(servicesMap[0])
  if(event.service.length == 2) {
    $("#service").val(servicesMap[0])
    $("#service2").val(servicesMap[1])
  }
  $("#month").val(event.month)
  $("#day").val(event.day)

}

//------------------------------------------------------
// Append all select tags for scheduling               |
//------------------------------------------------------
function appendScheduleForms() {
  // Bring back scheduling related tags
  var row = $(`<div class="row"></div>`)

  var col1 = $(`<div class="col-lg-4"></div>`)
  var col2 = $(`<div class="col-lg-4"></div>`)
  var col3 = $(`<div class="col-lg-4"></div>`)
  var col4 = $(`<div class="col-lg-4"></div>`)
  var col5 = $(`<div class="col-lg-4"></div>`)
  var col6 = $(`<div class="col-lg-4"></div>`)

  var form1 = $(`<div class="form-group"></div>`)
  var form2 = $(`<div class="form-group"></div>`)
  var form3 = $(`<div class="form-group"></div>`)
  var form4 = $(`<div class="form-group"></div>`)
  var form5 = $(`<div class="form-group"></div>`)
  var form6 = $(`<div class="form-group"></div>`)

  var label1 = $(`<label for="ampm">Time: </label>`)
  var label2 = $(`<label for="service">Service: </label>`)
  var label3 = $(`<label for="service2">Service 2: </label>`)
  var label5 = $(`<label for="service3">Service 3: </label>`)
  var label6 = $(`<label for="service4">Service 4: </label>`)
  var label4 = $(`<label for="duration">Duration: </label>`)

  var select1 = $(`<select id="ampm" name="ampm" class="form-control form-control-sm"></select>`)
  var select2 = $(`<select id="service" name="service" class="form-control form-control-sm">`)
  var select3 = $(`<select id="service2" name="service2" class="form-control form-control-sm">`)
  var select5 = $(`<select id="service3" name="service3" class="form-control form-control-sm">`)
  var select6 = $(`<select id="service4" name="service4" class="form-control form-control-sm">`)
  var select4 = $(`<select id="duration" name="duration" class="form-control form-control-sm">`)

  // Appending option tag for time
  select1.append(`<option value="none">Choose Time</option>`)        
          .append(`<option value="7-00-AM">7:00 AM</option>`)
          .append(`<option value="7-15-AM">7:15 AM</option>`)
          .append(`<option value="7-30-AM">7:30 AM</option>`)
          .append(`<option value="7-45-AM">7:45 AM</option>`)
          .append(`<option value="8-00-AM">8:00 AM</option>`)
          .append(`<option value="8-15-AM">8:15 AM</option>`)
          .append(`<option value="8-30-AM">8:30 AM</option>`)
          .append(`<option value="8-45-AM">8:45 AM</option>`)
          .append(`<option value="9-00-AM">9:00 AM</option>`)
          .append(`<option value="9-15-AM">9:15 AM</option>`)
          .append(`<option value="9-30-AM">9:30 AM</option>`)
          .append(`<option value="9-45-AM">9:45 AM</option>`)
          .append(`<option value="10-00-AM">10:00 AM</option>`)
          .append(`<option value="10-15-AM">10:15 AM</option>`)
          .append(`<option value="10-30-AM">10:30 AM</option>`)
          .append(`<option value="10-45-AM">10:45 AM</option>`)
          .append(`<option value="11-00-AM">11:00 AM</option>`)
          .append(`<option value="11-15-AM">11:15 AM</option>`)
          .append(`<option value="11-30-AM">11:30 AM</option>`)
          .append(`<option value="11-45-AM">11:45 AM</option>`)
          .append(`<option value="12-00-PM">12:00 PM</option>`)
          .append(`<option value="12-15-PM">12:15 PM</option>`)
          .append(`<option value="12-30-PM">12:30 PM</option>`)
          .append(`<option value="12-45-PM">12:45 PM</option>`)
          .append(`<option value="1-00-PM">1:00 PM</option>`)
          .append(`<option value="1-15-PM">1:15 PM</option>`)
          .append(`<option value="1-30-PM">1:30 PM</option>`)
          .append(`<option value="1-45-PM">1:45 PM</option>`)
          .append(`<option value="2-00-PM">2:00 PM</option>`)
          .append(`<option value="2-15-PM">2:15 PM</option>`)
          .append(`<option value="2-30-PM">2:30 PM</option>`)
          .append(`<option value="2-45-PM">2:45 PM</option>`)
          .append(`<option value="3-00-PM">3:00 PM</option>`)
          .append(`<option value="3-15-PM">3:15 PM</option>`)
          .append(`<option value="3-30-PM">3:30 PM</option>`)
          .append(`<option value="3-45-PM">3:45 PM</option>`)
          .append(`<option value="4-00-PM">4:00 PM</option>`)
          .append(`<option value="4-15-PM">4:15 PM</option>`)
          .append(`<option value="4-30-PM">4:30 PM</option>`)
          .append(`<option value="4-45-PM">4:45 PM</option>`)
          .append(`<option value="5-00-PM">5:00 PM</option>`)
          .append(`<option value="5-15-PM">5:15 PM</option>`)
          .append(`<option value="5-30-PM">5:30 PM</option>`)
          .append(`<option value="5-45-PM">5:45 PM</option>`)
          .append(`<option value="6-00-PM">6:00 PM</option>`)
          

  // Appending all option tag for service
  select2.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select2.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Appending all option tag for service2
  select3.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select3.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Appending all option tag for service2
  select5.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select5.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Appending all option tag for service2
  select6.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select6.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  select4.append(`<option value="none">Select duration</option>`)        
          .append(`<option value="30">30 minutes</option>`)
          .append(`<option value="60">1 hour</option>`)
          .append(`<option value="90">1 hour and 30 minutes</option>`)
          .append(`<option value="120">2 hours</option>`)

  

  // For validation display
  var validationTime = $(`<div id="ampm-invalid" class="all-validations"></div>`)
  var validationDuration = $(`<div id="duration-invalid" class="all-validations"></div>`)
  var validationService = $(`<div id="service-invalid" class="all-validations"></div>`)
  var validationService2 = $(`<div id="service2-invalid" class="all-validations"></div>`)
  var validationService3 = $(`<div id="service3-invalid" class="all-validations"></div>`)
  var validationService4 = $(`<div id="service4-invalid" class="all-validations"></div>`)

  // Append all tags
  form1.append(label1).append(select1).append(validationTime)
  form2.append(label2).append(select2).append(validationService)
  form3.append(label3).append(select3).append(validationService2)
  // form4.append(label4).append(select4).append(duration)
  // form5.append(label5).append(select5).append(validationService3)
  // form6.append(label6).append(select6).append(validationService4)
  col1.append(form1)
  col2.append(form2)
  col3.append(form3)
  col4.append(form4)
  col5.append(form5)
  col6.append(form6)
  row.append(col1).append(col2).append(col3)
  // .append(col4).append(col5).append(col6)
  $(".for-schedule").append(row)
}

//------------------------------------------------------
// Append all select tags for payment of patient        |
//------------------------------------------------------
function appendPayment(event) {
  // Bring back scheduling related tags
  var row = $(`<div class="row"></div>`)
  var row2 = $(`<div class="row"></div>`)
  var row3 = $(`<div class="row"></div>`)
  var row4 = $(`<div class="row"></div>`)
  var row5 = $(`<div class="row"></div>`)
  var row6 = $(`<div class="row"></div>`)
  var row7 = $(`<div class="row"></div>`)

  var col1 = $(`<div class="col-lg-4"></div>`)
  var col2 = $(`<div class="col-lg-4"></div>`)
  var col3 = $(`<div class="col-lg-4"></div>`)
  var col4 = $(`<div class="col-lg-4"></div>`)
  var col5 = $(`<div class="col-lg-4"></div>`)
  var col6 = $(`<div class="col-lg-4"></div>`)
  var col7 = $('<div class="col-lg-4"></div>')
  var col8 = $('<div class="col-lg-4"></div>')
  var col9 = $('<div class="col-lg-4"></div>')
  var col10 = $('<div class="col-lg-4"></div>')
  var col11 = $('<div class="col-lg-4"></div>')
  var col12 = $('<div class="col-lg-4"></div>')
  var col13 = $('<div class="col-lg-4"></div>')
  var col14 = $('<div class="col-lg-4"></div>')
  var col15 = $('<div class="col-lg-4"></div>')
  var col16 = $('<div class="col-lg-4"></div>')
  var col17 = $('<div class="col-lg-4"></div>')
  var col18 = $('<div class="col-lg-4"></div>')
  var col19 = $('<div class="col-lg-4"></div>')
  var col20 = $('<div class="col-lg-4"></div>')
  var col21 = $('<div class="col-lg-4"></div>')

  var rowServiceTotal = $(`<div class="row"></div>`)
  var rowMedicineTotal = $(`<div class="row"></div>`)
  var rowGrandTotal = $(`<div class="row"></div>`)


  var colServiceTotal1 = $('<div class="col-lg-4"></div>')
  var colServiceTotal2 = $('<div class="col-lg-4"></div>')
  var colServiceTotal3 = $('<div class="col-lg-4"></div>')

  var colMedicineTotal1 = $('<div class="col-lg-4"></div>')
  var colMedicineTotal2 = $('<div class="col-lg-4"></div>')
  var colMedicineTotal3 = $('<div class="col-lg-4"></div>')

  var colGrandTotal1 = $('<div class="col-lg-4"></div>')
  var colGrandTotal2 = $('<div class="col-lg-4"></div>')
  var colGrandTotal3 = $('<div class="col-lg-4"></div>')

  var formServiceTotal = $(`<div class="form-group"></div>`)
  var formMedicineTotal = $(`<div class="form-group"></div>`)
  var formGrandTotal = $(`<div class="form-group"></div>`)

  var labelServiceTotal = $(`<label for="serviceTotal">Service Total: </label>`)
  var labelMedicineTotal = $(`<label for="medicineTotal">Medicine Total: </label>`)
  var labelGrandTotal = $(`<label for="grandTotal">Grand Total: </label>`)

  var serviceTotal = $('<input type="text" id="serviceTotal" name="serviceTotal" class="form-control form-control-sm">')
  var medicineTotal = $('<input type="text" id="medicineTotal" name="medicineTotal" class="form-control form-control-sm">')
  var grandTotal = $('<input type="text" id="grandTotal" name="grandTotal" class="form-control form-control-sm">')

  var form1 = $(`<div class="form-group"></div>`)
  var form2 = $(`<div class="form-group"></div>`)
  var form3 = $(`<div class="form-group"></div>`)
  var form4 = $(`<div class="form-group"></div>`)
  var form5 = $(`<div class="form-group"></div>`)
  var form6 = $('<div class="form-group"></div>')
  var form7 = $('<div class="form-group"></div>')
  var form8 = $('<div class="form-group"></div>')
  var form9 = $('<div class="form-group"></div>')
  var form10 = $('<div class="form-group"></div>')
  var form11 = $('<div class="form-group"></div>')
  var form12 = $('<div class="form-group"></div>')
  var form13 = $('<div class="form-group"></div>')
  var form14 = $('<div class="form-group"></div>')
  var form15 = $('<div class="form-group"></div>')
  var form16 = $('<div class="form-group"></div>')
  var form17 = $('<div class="form-group"></div>')
  var form18 = $('<div class="form-group"></div>')
  var form19 = $('<div class="form-group"></div>')
  var form20 = $('<div class="form-group"></div>')
  var form21 = $('<div class="form-group"></div>')

  var label1 = $(`<label for="ampm">Time: </label>`)
  var label2 = $(`<label for="service">Service: </label>`)
  var label3 = $(`<label for="service2">Service2: </label>`)
  
  // For time and service
  var select1 = $(`<select id="ampm" name="ampm" class="form-control form-control-sm"></select>`)
  var select2 = $(`<select id="service" name="service" class="form-control form-control-sm">`)
  var select3 = $(`<select id="service2" name="service2" class="form-control form-control-sm">`)

  var medSelectLabel1 = $('<label for="med1">Medicine: </label>')
  var medQuantityLabel1 = $('<label for="medQuantity1">Quantity: </label>')
  var medPriceLabel1 = $('<label for="medPrice1">Price: </label>')
  var medSelect1 = $('<select id="med1" name="med1" class="form-control form-control-sm"></select>')
  var medQuantity1 = $('<input type="text" id="medQuantity1" name="medQuantity1" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice1 = $('<input type="text" id="medPrice1" name="medPrice1" class="form-control form-control-sm"  readonly>')

  // For medicines
  var medSelectLabel2 = $('<label for="med2">Medicine: </label>')
  var medQuantityLabel2 = $('<label for="medQuantity2">Quantity: </label>')
  var medPriceLabel2 = $('<label for="medPrice2">Price: </label>')
  var medSelect2 = $('<select id="med2" name="med2" class="form-control form-control-sm"></select>')
  var medQuantity2 = $('<input type="text" id="medQuantity2" name="medQuantity2" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice2 = $('<input type="text" id="medPrice2" name="medPrice2" class="form-control form-control-sm"  readonly>')

  var medSelectLabel3 = $('<label for="med3">Medicine: </label>')
  var medQuantityLabel3 = $('<label for="medQuantity3">Quantity: </label>')
  var medPriceLabel3 = $('<label for="medPrice3">Price: </label>')
  var medSelect3 = $('<select id="med3" name="med3" class="form-control form-control-sm"></select>')
  var medQuantity3 = $('<input type="text" id="medQuantity3" name="medQuantity3" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice3 = $('<input type="text" id="medPrice3" name="medPrice3" class="form-control form-control-sm"  readonly>')

  var medSelectLabel4 = $('<label for="med4">Medicine: </label>')
  var medQuantityLabel4 = $('<label for="medQuantity4">Quantity: </label>')
  var medPriceLabel4 = $('<label for="medPrice4">Price: </label>')
  var medSelect4 = $('<select id="med4" name="med4" class="form-control form-control-sm"></select>')
  var medQuantity4 = $('<input type="text" id="medQuantity4" name="medQuantity4" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice4 = $('<input type="text" id="medPrice4" name="medPrice4" class="form-control form-control-sm"  readonly>')

  var medSelectLabel5 = $('<label for="med5">Medicine: </label>')
  var medQuantityLabel5 = $('<label for="medQuantity5">Quantity: </label>')
  var medPriceLabel5 = $('<label for="medPrice5">Price: </label>')
  var medSelect5 = $('<select id="med5" name="med5" class="form-control form-control-sm"></select>')
  var medQuantity5 = $('<input type="text" id="medQuantity5" name="medQuantity5" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice5 = $('<input type="text" id="medPrice5" name="medPrice5" class="form-control form-control-sm"  readonly>')

  var medSelectLabel6 = $('<label for="med6">Medicine: </label>')
  var medQuantityLabel6 = $('<label for="medQuantity6">Quantity: </label>')
  var medPriceLabel6 = $('<label for="medPrice6">Price: </label>')
  var medSelect6 = $('<select id="med6" name="med6" class="form-control form-control-sm"></select>')
  var medQuantity6 = $('<input type="text" id="medQuantity6" name="medQuantity6" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice6 = $('<input type="text" id="medPrice6" name="medPrice6" class="form-control form-control-sm"  readonly>')
  

  // Appending option tag for time
  select1.append(`<option value="none">Choose Time</option>`)             
          .append(`<option value="7-00-AM">7:00 AM</option>`)
          .append(`<option value="7-15-AM">7:15 AM</option>`)
          .append(`<option value="7-30-AM">7:30 AM</option>`)
          .append(`<option value="7-45-AM">7:45 AM</option>`)
          .append(`<option value="8-00-AM">8:00 AM</option>`)
          .append(`<option value="8-15-AM">8:15 AM</option>`)
          .append(`<option value="8-30-AM">8:30 AM</option>`)
          .append(`<option value="8-45-AM">8:45 AM</option>`)
          .append(`<option value="9-00-AM">9:00 AM</option>`)
          .append(`<option value="9-15-AM">9:15 AM</option>`)
          .append(`<option value="9-30-AM">9:30 AM</option>`)
          .append(`<option value="9-45-AM">9:45 AM</option>`)
          .append(`<option value="10-00-AM">10:00 AM</option>`)
          .append(`<option value="10-15-AM">10:15 AM</option>`)
          .append(`<option value="10-30-AM">10:30 AM</option>`)
          .append(`<option value="10-45-AM">10:45 AM</option>`)
          .append(`<option value="11-00-AM">11:00 AM</option>`)
          .append(`<option value="11-15-AM">11:15 AM</option>`)
          .append(`<option value="11-30-AM">11:30 AM</option>`)
          .append(`<option value="11-45-AM">11:45 AM</option>`)
          .append(`<option value="12-00-PM">12:00 PM</option>`)
          .append(`<option value="12-15-PM">12:15 PM</option>`)
          .append(`<option value="12-30-PM">12:30 PM</option>`)
          .append(`<option value="12-45-PM">12:45 PM</option>`)
          .append(`<option value="1-00-PM">1:00 PM</option>`)
          .append(`<option value="1-15-PM">1:15 PM</option>`)
          .append(`<option value="1-30-PM">1:30 PM</option>`)
          .append(`<option value="1-45-PM">1:45 PM</option>`)
          .append(`<option value="2-00-PM">2:00 PM</option>`)
          .append(`<option value="2-15-PM">2:15 PM</option>`)
          .append(`<option value="2-30-PM">2:30 PM</option>`)
          .append(`<option value="2-45-PM">2:45 PM</option>`)
          .append(`<option value="3-00-PM">3:00 PM</option>`)
          .append(`<option value="3-15-PM">3:15 PM</option>`)
          .append(`<option value="3-30-PM">3:30 PM</option>`)
          .append(`<option value="3-45-PM">3:45 PM</option>`)
          .append(`<option value="4-00-PM">4:00 PM</option>`)
          .append(`<option value="4-15-PM">4:15 PM</option>`)
          .append(`<option value="4-30-PM">4:30 PM</option>`)
          .append(`<option value="4-45-PM">4:45 PM</option>`)
          .append(`<option value="5-00-PM">5:00 PM</option>`)
          .append(`<option value="5-15-PM">5:15 PM</option>`)
          .append(`<option value="5-30-PM">5:30 PM</option>`)
          .append(`<option value="5-45-PM">5:45 PM</option>`)
          .append(`<option value="6-00-PM">6:00 PM</option>`)
          .append(`<option value="6-15-PM">6:15 PM</option>`)
          .append(`<option value="6-30-PM">6:30 PM</option>`)
          .append(`<option value="6-45-PM">6:45 PM</option>`)
          .append(`<option value="7-00-PM">7:00 PM</option>`)
          .append(`<option value="7-15-PM">7:15 PM</option>`)
          .append(`<option value="7-30-PM">7:30 PM</option>`)
          .append(`<option value="7-45-PM">7:45 PM</option>`)
          .append(`<option value="8-00-PM">8:00 PM</option>`)
          .append(`<option value="8-15-PM">8:15 PM</option>`)
          .append(`<option value="8-30-PM">8:30 PM</option>`)
          .append(`<option value="8-45-PM">8:45 PM</option>`)
          .append(`<option value="9-00-PM">9:00 PM</option>`)

  // Appending all option tag for service
  select2.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select2.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Appending all option tag for service2
  select3.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select3.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })

  // Append all medicines
  medSelect1.append(`<option value="none">Select Service</option>`)
  schedule_data.inventory.forEach(med => {
    if(med.is_med == 'yes') {
      medSelect1.append(`<option value="${med._id}">${med.name} - &#8369 ${med.price}</option>`)
    }
  })

  medSelect2.append(`<option value="none">Select Service</option>`)
  schedule_data.inventory.forEach(med => {
    if(med.is_med == 'yes') {
      medSelect2.append(`<option value="${med._id}">${med.name} - &#8369 ${med.price}</option>`)
    }
  })

  medSelect3.append(`<option value="none">Select Service</option>`)
  schedule_data.inventory.forEach(med => {
    if(med.is_med == 'yes') {
      medSelect3.append(`<option value="${med._id}">${med.name} - &#8369 ${med.price}</option>`)
    }
  })

  medSelect4.append(`<option value="none">Select Service</option>`)
  schedule_data.inventory.forEach(med => {
    if(med.is_med == 'yes') {
      medSelect4.append(`<option value="${med._id}">${med.name} - &#8369 ${med.price}</option>`)
    }
  })

  medSelect5.append(`<option value="none">Select Service</option>`)
  schedule_data.inventory.forEach(med => {
    if(med.is_med == 'yes') {
      medSelect5.append(`<option value="${med._id}">${med.name} - &#8369 ${med.price}</option>`)
    }
  })

  medSelect6.append(`<option value="none">Select Service</option>`)
  schedule_data.inventory.forEach(med => {
    if(med.is_med == 'yes') {
      medSelect6.append(`<option value="${med._id}">${med.name} - &#8369 ${med.price}</option>`)
    } 
  })

  // display validations
  var validationTime = $(`<div id="ampm-invalid" class="all-validations"></div>`)
  var validationService = $(`<div id="service-invalid" class="all-validations"></div>`)
  var validationService2 = $(`<div id="service2-invalid" class="all-validations"></div>`)
  var validationQ1 = $(`<div id="q1-invalid" class="all-validations"></div>`)
  var validationQ2 = $(`<div id="q2-invalid" class="all-validations"></div>`)
  var validationQ3 = $(`<div id="q3-invalid" class="all-validations"></div>`)
  var validationQ4 = $(`<div id="q4-invalid" class="all-validations"></div>`)
  var validationQ5 = $(`<div id="q5-invalid" class="all-validations"></div>`)
  var validationQ6 = $(`<div id="q6-invalid" class="all-validations"></div>`)

  // Append all tags
  form1.append(label1).append(select1).append(validationTime)
  form2.append(label2).append(select2).append(validationService)
  form3.append(label3).append(select3).append(validationService2)
  form4.append(medSelectLabel1).append(medSelect1)
  form5.append(medQuantityLabel1).append(medQuantity1).append(validationQ1)
  form6.append(medPriceLabel1).append(medPrice1)
  form7.append(medSelectLabel2).append(medSelect2)
  form8.append(medQuantityLabel2).append(medQuantity2).append(validationQ2)
  form9.append(medPriceLabel2).append(medPrice2)
  form10.append(medSelectLabel3).append(medSelect3)
  form11.append(medQuantityLabel3).append(medQuantity3).append(validationQ3)
  form12.append(medPriceLabel3).append(medPrice3)
  form13.append(medSelectLabel4).append(medSelect4)
  form14.append(medQuantityLabel4).append(medQuantity4).append(validationQ4)
  form15.append(medPriceLabel4).append(medPrice4)
  form16.append(medSelectLabel5).append(medSelect5)
  form17.append(medQuantityLabel5).append(medQuantity5).append(validationQ5)
  form18.append(medPriceLabel5).append(medPrice5)
  form19.append(medSelectLabel6).append(medSelect6)
  form20.append(medQuantityLabel6).append(medQuantity6).append(validationQ6)
  form21.append(medPriceLabel6).append(medPrice6)
  col1.append(form1)
  col2.append(form2)
  col3.append(form3)
  col4.append(form4)
  col5.append(form5)
  col6.append(form6)
  col7.append(form7)
  col8.append(form8)
  col9.append(form9)
  col10.append(form10)
  col11.append(form11)
  col12.append(form12)
  col13.append(form13)
  col14.append(form14)
  col15.append(form15)
  col16.append(form16)
  col17.append(form17)
  col18.append(form18)
  col19.append(form19)
  col20.append(form20)
  col21.append(form21)
  row.append(col1).append(col2).append(col3)
  row2.append(col4).append(col5).append(col6)
  row3.append(col7).append(col8).append(col9)
  row4.append(col10).append(col11).append(col12)
  row5.append(col13).append(col14).append(col15)
  row6.append(col16).append(col17).append(col18)
  row7.append(col19).append(col20).append(col21)
  formServiceTotal.append(labelServiceTotal).append(serviceTotal)
  formMedicineTotal.append(labelMedicineTotal).append(medicineTotal)
  formGrandTotal.append(labelGrandTotal).append(grandTotal)
  colServiceTotal3.append(formServiceTotal)
  colMedicineTotal3.append(formMedicineTotal)
  colGrandTotal3.append(formGrandTotal)
  rowServiceTotal.append(colServiceTotal1).append(colServiceTotal2).append(colServiceTotal3)
  rowMedicineTotal.append(colMedicineTotal1).append(colMedicineTotal2).append(colMedicineTotal3)
  rowGrandTotal.append(colGrandTotal1).append(colGrandTotal2).append(colGrandTotal3)
  $(".for-schedule").append(row)
        .append(rowServiceTotal)
        .append(row2)
        .append(row3)
        .append(row4)
        .append(row5)
        .append(row6)
        .append(row7)
        .append(rowMedicineTotal)
        .append(rowGrandTotal)
    
  // Total all services
  var servicesMap = event.service.map(serv => serv._id)
  var sTotal = event.service.reduce((acc, serv) => acc + parseInt(serv.price), 0)

  // Set all values based of patient's schedule and services
  $("#ampm").val(event.ampm) 
  if(event.service.length == 1)
    $("#service").val(servicesMap[0])
    $("#serviceTotal").val(sTotal)
    $("#grandTotal").val(sTotal)
  if(event.service.length == 2) {
    $("#service").val(servicesMap[0])
    $("#service2").val(servicesMap[1])
  }

}

//------------------------------------------------------
// Create new patient with schedule                     |
//------------------------------------------------------
function new_patient_with_schedule(event) {

  $(".for-schedule").empty()

  // Append all select tags for schedule
  appendScheduleForms()
  // enable forms
  enableForms()
  // Remove texts and classes on inputs
  removeTextAndClassinInputs()
  
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
  return;
  
  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  $("#dialog").show(400);
  $("#flexible-text").text("Add Schedule")
  
  // Event handler for cancel button
  $("#cancel-button").click(function() {
      $("#name").removeClass("error-input");
      $("#count").removeClass("error-input");
      $("#dialog").hide(300);
      $(".events-container").show(300);
  });
  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
      // Get all data needed for register and scheduling patient
      var date = event.data.date;
      var name = $("#name").val().trim();
      // Radio button get
      var genderCheck = $("input[type='radio'][name='gender']:checked")
      var gender = genderCheck.length > 0 ? genderCheck.val() : '';
      var address = $("#address").val().trim();
      var contact_number = $("#contact_number").val().trim();
      var age = $("#age").val().trim();
      var nationality = $("#nationality").val().trim();
      var occupation = $("#occupation").val().trim();
      var reffered_by = $("#referred_by").val().trim();
      var chief_complainant = $("#chief_complainant").val().trim();
      var diagnosis = $("#diagnosis").val();
      
      // Patient details
      var patientDetails = {
        name,
        gender,
        address,
        contact_number,
        age,
        nationality,
        occupation,
        reffered_by,
        chief_complainant,
        diagnosis
      }


      // Teeth comment
      var t_11 = $("#t-11").val().trim()
      var t_12 = $("#t-12").val().trim()
      var t_13 = $("#t-13").val().trim()
      var t_14 = $("#t-14").val().trim()
      var t_15 = $("#t-15").val().trim()
      var t_16 = $("#t-16").val().trim()
      var t_17 = $("#t-17").val().trim()
      var t_18 = $("#t-18").val().trim()
      var t_21 = $("#t-21").val().trim()
      var t_22 = $("#t-22").val().trim()
      var t_23 = $("#t-23").val().trim()
      var t_24 = $("#t-24").val().trim()
      var t_25 = $("#t-25").val().trim()
      var t_26 = $("#t-26").val().trim()
      var t_27 = $("#t-27").val().trim()
      var t_28 = $("#t-28").val().trim()
      var t_31 = $("#t-31").val().trim()
      var t_32 = $("#t-32").val().trim()
      var t_33 = $("#t-33").val().trim()
      var t_34 = $("#t-34").val().trim()
      var t_35 = $("#t-35").val().trim()
      var t_36 = $("#t-36").val().trim()
      var t_37 = $("#t-37").val().trim()
      var t_38 = $("#t-38").val().trim()
      var t_41 = $("#t-41").val().trim()
      var t_42 = $("#t-42").val().trim()
      var t_43 = $("#t-43").val().trim()
      var t_44 = $("#t-44").val().trim()
      var t_45 = $("#t-45").val().trim()
      var t_46 = $("#t-46").val().trim()
      var t_47 = $("#t-47").val().trim()
      var t_48 = $("#t-48").val().trim() 

      // Medical history
      var hypertensionCheck = $("input[type='radio'][name='hypertension']:checked")
      var epilepsyCheck = $("input[type='radio'][name='epilepsy']:checked")
      var diabetesCheck = $("input[type='radio'][name='diabetes']:checked")
      var kidney_diseaseCheck = $("input[type='radio'][name='kidney_disease']:checked")
      var heart_diseaseCheck = $("input[type='radio'][name='heart_disease']:checked")
      var liver_diseaseCheck = $("input[type='radio'][name='liver_disease']:checked")
      var allergyCheck = $("input[type='radio'][name='allergy']:checked")
      var asthmaCheck = $("input[type='radio'][name='asthma']:checked")
      var othersCheck = $("input[type='radio'][name='others']:checked")

      var hypertension = hypertensionCheck.length > 0 && hypertensionCheck.val() == 'yes' ? true : false;
      var epilepsy = epilepsyCheck.length > 0 && epilepsyCheck.val() == 'yes' ? true : false;
      var diabetes = diabetesCheck.length > 0 && diabetesCheck.val() == 'yes' ? true : false;
      var kidney_disease = kidney_diseaseCheck.length > 0 && kidney_diseaseCheck.val() == 'yes' ? true : false;
      var heart_disease = heart_diseaseCheck.length > 0 && heart_diseaseCheck.val() == 'yes' ? true : false;
      var liver_disease = liver_diseaseCheck.length > 0 && liver_diseaseCheck.val() == 'yes' ? true : false;
      var allergy = allergyCheck.length > 0 && allergyCheck.val() == 'yes' ? true : false;
      var asthma = asthmaCheck.length > 0 && asthmaCheck.val() == 'yes' ? true : false;
      var others = othersCheck.length > 0 && othersCheck.val() == 'yes' ? true : false;

      var treatment_planning = $("#treatment_planning").val();

      // Oral conditions
      var depositStainsCheck = $("input[type='radio'][name='deposit_stains']:checked")
      var deposit_stains = depositStainsCheck.length > 0 ? depositStainsCheck.val() : '';
      var oralHygieneCheck = $("input[type='radio'][name='oral_hygiene']:checked")
      var oral_hygiene = oralHygieneCheck.length > 0 ? oralHygieneCheck.val() : '';
    
      var oralConditions = {
        deposit_stains,
        oral_hygiene
      }

      var medicalHistory = {hypertension,
        epilepsy,
        diabetes,
        kidney_disease,
        heart_disease,
        liver_disease,
        allergy,
        asthma,
        others
      }

      
      var teethComments = {
        t_11,
        t_12,
        t_13, 
        t_14,
        t_15,
        t_16,
        t_17,
        t_18,
        t_21, 
        t_22,
        t_23,
        t_24,
        t_25,
        t_26,
        t_27,
        t_28,
        t_31,
        t_32,
        t_33,
        t_34,
        t_35,
        t_36,
        t_37,
        t_38,
        t_41,
        t_42,
        t_43,
        t_44,
        t_45,
        t_46,
        t_47,
        t_48,
      }

      // Time, date and services
      var ampm = $("#ampm").val();
      var service = $("#service").val();
      var service2 = $("#service2").val();
      var services = [service, service2]
      var servicesFiltered = []
      var day = parseInt($(".active-date").html());

      // Validations
      checkValidationsWithSched(name, age, ampm, contact_number, service, service2)

      // If no errors
      if(validationErrors.length === 0) {

        // Check if time is occupied
        var filteredTime = check_time_of_events(day, date.getMonth()+1, date.getFullYear(), ampm)
        // If time is occupied, alert user
        if(filteredTime.length != 0) {
          $("#ampm").addClass("is-invalid");
          $("#ampm-invalid").addClass("invalid-feedback");
          $("#ampm-invalid").text("Time is already occupied")
          validationErrors.push('Time')
        }

        // if time is not occupied
        if(validationErrors.length === 0) {

          // Filter services
          services.forEach(serv => {
            if(serv != 'none'){
              servicesFiltered.push(serv)
            }
          })

          $("#dialog").hide(250);
          console.log(date)
          // Call function to register and schedule patient
          new_register_and_schedule_json(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions,servicesFiltered);
          date.setDate(day);
          init_calendar(date);

        // If time is occupied
        } else {
          alert(`Time is already occupied`)
        }
      } else {
        // Alert user if there are errors
        alert(`Please check your inputs in ${validationErrors}`)
      }
  });
}

//------------------------------------------------------
// Validate forms for registering and updating patient  |
//------------------------------------------------------
function checkValidationsForPatient(name, age, contact_number) {
  validationErrors = []

  // if no name, alert user 
  if(name.length == 0) {
    $("#name").addClass("is-invalid");
    $("#name-invalid").addClass("invalid-feedback");
    $("#name-invalid").text("Name is required")
    validationErrors.push('Name') 
  } 
  // if no age, alert user
  if(age.length == 0) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age is required")
    validationErrors.push('Age')
  // if age is not a number
  } else if (!regexAge.test(age)) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age must be numeric")
    validationErrors.push('Age')
  }
  if(contact_number == 0) {
    $("#contact_number").addClass("is-invalid");
    $("#contact_number-invalid").addClass("invalid-feedback");
    $("#contact_number-invalid").text("Contact Number is required")
    validationErrors.push('Contact Number')
  // if contact number is not a number
  } else if (!regexAge.test(contact_number)) {
    $("#contact_number").addClass("is-invalid");
    $("#contact_number-invalid").addClass("invalid-feedback");
    $("#contact_number-invalid").text("Contact Number must be numeric")
    validationErrors.push('Contact Number')
  }
}

//-------------------------------------------------------------
// Validate form for registering with scheduling of patient    |
//-------------------------------------------------------------
function checkValidationsWithSched(name, age, ampm, contact_number, service, service2) {
  validationErrors = []

  // if no name, alert user
  if(name.length == 0) {
    $("#name").addClass("is-invalid");
    $("#name-invalid").addClass("invalid-feedback");
    $("#name-invalid").text("Name is required")
    validationErrors.push('Name')
  } 
  // if no age, alert user
  if(age.length == 0) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age is required")
    validationErrors.push('Age')

  if(contact_number == 0) {
    $("#contact_number").addClass("is-invalid");
    $("#contact_number-invalid").addClass("invalid-feedback");
    $("#contact_number-invalid").text("Contact Number is required")
    validationErrors.push('Contact Number')
  // if contact number is not a number
  } else if (!regexAge.test(contact_number)) {
    $("#contact_number").addClass("is-invalid");
    $("#contact_number-invalid").addClass("invalid-feedback");
    $("#contact_number-invalid").text("Contact Number must be numeric")
    validationErrors.push('Contact Number')
  }

  // if age is not a number, alert user
  } else if (!regexAge.test(age)) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age must be numeric")
    validationErrors.push('Age')
  }
  // if time is none, alert user
  if(ampm === 'none') {
    $("#ampm").addClass("is-invalid");
    $("#ampm-invalid").addClass("invalid-feedback");
    $("#ampm-invalid").text("Please choose time")
    validationErrors.push('Time')
  }
  // if no service, alert user
  if(service === 'none' && service2 === 'none') {
    $("#service").addClass("is-invalid");
    $("#service-invalid").addClass("invalid-feedback");
    $("#service-invalid").text("Please choose at least 1 service")
    $("#service2").addClass("is-invalid");
    $("#service2-invalid").addClass("invalid-feedback");
    $("#service2-invalid").text("Please choose at least 1 service")
    validationErrors.push('Service')
  }
}

//--------------------------------------------------------
// Call route for registering with schedule of patient    |
//--------------------------------------------------------
function new_register_and_schedule_json(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions,services) {

  var myServices = []

  services.forEach(service => {
    myServices.push(service)
  })

  // Store all data needed in object
  var newSchedule = {
    "year": date.getFullYear(),
    "month": date.getMonth()+1,
    "day": day,
    "ampm": ampm,
    // Patient details
    "name": patientDetails.name,
    "gender": patientDetails.gender,
    "address": patientDetails.address,
    "contact_number": patientDetails.contact_number,
    "age": patientDetails.age,
    "nationality": patientDetails.nationality,
    "occupation": patientDetails.occupation,
    "reffered_by": patientDetails.reffered_by,
    "chief_complainant": patientDetails.chief_complainant,
    "diagnosis": patientDetails.diagnosis,
    // Teeth comments
    "t_11": teethComments.t_11,
    "t_12": teethComments.t_12,
    "t_13": teethComments.t_13,
    "t_14": teethComments.t_14,
    "t_15": teethComments.t_15,
    "t_16": teethComments.t_16,
    "t_17": teethComments.t_17,
    "t_18": teethComments.t_18,
    "t_21": teethComments.t_21,
    "t_22": teethComments.t_22,
    "t_23": teethComments.t_23,
    "t_24": teethComments.t_24,
    "t_25": teethComments.t_25,
    "t_26": teethComments.t_26,
    "t_27": teethComments.t_27,
    "t_28": teethComments.t_28,
    "t_31": teethComments.t_31,
    "t_32": teethComments.t_32,
    "t_33": teethComments.t_33,
    "t_34": teethComments.t_34,
    "t_35": teethComments.t_35,
    "t_36": teethComments.t_36,
    "t_37": teethComments.t_37,
    "t_38": teethComments.t_38,
    "t_41": teethComments.t_41,
    "t_42": teethComments.t_42,
    "t_43": teethComments.t_43,
    "t_44": teethComments.t_44,
    "t_45": teethComments.t_45,
    "t_46": teethComments.t_46,
    "t_47": teethComments.t_47,
    "t_48": teethComments.t_48,
    // Medical History
    "hypertension": medicalHistory.hypertension,
    "epilepsy": medicalHistory.epilepsy,
    "diabetes": medicalHistory.diabetes,
    "kidney_disease": medicalHistory.kidney_disease,
    "heart_disease": medicalHistory.heart_disease,
    "liver_disease": medicalHistory.liver_disease,
    "allergy": medicalHistory.allergy,
    "asthma": medicalHistory.asthma,
    "others": medicalHistory.others,
    "treatment_planning": treatment_planning,
    // Oral conditions
    "deposit_stains": oralConditions.deposit_stains,
    "oral_hygiene": oralConditions.oral_hygiene,
    "serviceSimple": myServices
  };

  $.ajax({
    type: 'POST',
    data: JSON.stringify(newSchedule),
    url: `${host}/schedule/add-schedule-with-patient`,
    contentType: 'application/json'
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}

//------------------------------------------
// Display all events on specific day       |
//------------------------------------------
function show_events(events, month, day) {
  // Clear the dates container
  $(".events-container").empty();
  $(".events-container").show(400);  

  // If there are no events for this date, Display it
  if(events.length===0) {
      var event_card = $("<div class='event-card'></div>");
      var event_name = $("<div class='event-name'>There are no schedule for "+month+" "+day+".</div>");
      $(event_card).css({ "border-left": "10px solid #FF1744" });
      $(event_card).append(event_name); 
      $(".events-container").append(event_card);
  }
  // If there are events
  else {

    // objs.sort((a,b) => (a.last_nom > b.last_nom) ? 1 : ((b.last_nom > a.last_nom) ? -1 : 0)); 

    var eventsAM = events.filter(event => event.ampm.includes("AM") && !(event.ampm.includes('10') || event.ampm.includes('11') || event.ampm.includes('12')))
    var eventsAMTens = events.filter(event => event.ampm.includes("AM") && (event.ampm.includes('10') || event.ampm.includes('11') || event.ampm.includes('12')))
    var eventsPMTens = events.filter(event => event.ampm.includes("PM") && (event.ampm.includes('12')))
    var eventsPM = events.filter(event => event.ampm.includes("PM") && !(event.ampm.includes('12')))
    eventsAM.sort((a,b) => (a.ampm > b.ampm) ? 1 : ((b.ampm > a.ampm) ? -1 : 0)); 
    eventsAMTens.sort((a,b) => (a.ampm > b.ampm) ? 1 : ((b.ampm > a.ampm) ? -1 : 0)); 
    eventsPMTens.sort((a,b) => (a.ampm > b.ampm) ? 1 : ((b.ampm > a.ampm) ? -1 : 0)); 
    eventsPM.sort((a,b) => (a.ampm > b.ampm) ? 1 : ((b.ampm > a.ampm) ? -1 : 0)); 
    var sortedEvents = []
    
    eventsAM.forEach(event => sortedEvents.push(event))
    eventsAMTens.forEach(event => sortedEvents.push(event))
    eventsPMTens.forEach(event => sortedEvents.push(event))
    eventsPM.forEach(event => sortedEvents.push(event))
    
    // Go through and add each event as a card to the events container
    sortedEvents.forEach(event => {
      // Set all tags needed
      var myContainer = $("<div class='container'></div>");
      // Setup card color blue
      var event_card = $("<div class='card text-white bg-primary m-4'></div>");
      // Setup the name of patient
      var event_card_header = $(`<div class='card-header'>Name: ${event.patient.name}</div>`);
      //handle time
      var a = event.ampm.split('-')
      var to_hours;
      var to_minutes = a[1];
      var to_ampm;
      // Identify if AM or PM depending in "numOfHours"
      to_ampm = ((parseInt(a[0]) + numOfHours ) >= 12) ? 'PM' : 'AM'
      // Hours depending on "numOfHours"
      if((parseInt(a[0]) + numOfHours ) == 13) {
        to_hours = '1'
      } else if ((parseInt(a[0]) + numOfHours ) == 14) {
        to_hours = '2'
      } else {
        to_hours = parseInt(a[0]) + numOfHours
      }
      // Handle services
      var services = event.service.map(serv => `${serv.name}`)
      var event_card_body = $("<div class='card-body'></div>");
      // Setup time of schedule
      var event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm}</h4>`);
      // Setup the contact number of patient
      var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${event.patient.contact_number}</p>`);
      // Setup the age of patient
      var event_card_time = $(`<p class='card-text'>Age: ${event.patient.age}</p>`);
      // Setup all services 
      var event_card_services = $(`<p class='card-text'>Services: ${services}</p>`);

      // Setup buttons
      var event_card_payment =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-success" id="${event._id}-payment-schedule" href="#">Payment</strong></div>`);
      var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id="${event._id}-edit-schedule" href="#">Edit Schedule</strong></div>`);
      var event_card_cancel = $(`<div class='card-text'><strong><a class="btn btn-sm btn-danger" id="${event._id}-cancel" href="#">Cancel</strong></div>`);

      // Set the total cost of medicine based on payment
      var medTotal = event.medicine_total != null ? event.medicine_total : 0;

      // Append this schedule if its done
      if(event.cancelled != true && event.done == true){
        // Setup all tags needed
        // Setup color green card
        event_card = $("<div class='card text-white bg-success m-4'></div>");
        // Display time
        event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm} <strong>Done</strong></h4>`);
        // Setup total cost of services
        var serviceTotal = $(`<p class='card-text'>Service Total: &#8369 ${event.service_total}</p>`);
        // Setup total of medicine
        var medicineTotal = $(`<p class='card-text'>Medicine Total: &#8369 ${medTotal}</p>`);
        // Setup the grand total
        var grandTotal = $(`<p class='card-text'>Grand Total: &#8369 ${event.grand_total}</p>`);
        var moreInfo =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-secondary" target="_blank" href="/payment/search-by-schedule/${event._id}">More info</strong></div>`);

        // Append all tags
        $(event_card_body).append(event_card_title).append(event_card_contact_number).append(serviceTotal).append(medicineTotal).append(grandTotal).append(moreInfo);
        $(event_card).append(event_card_header);
        $(event_card).append(event_card_body);
        $(myContainer).append(event_card);
        $(".events-container").append(myContainer)

      // Append this schedule if not yet done
      }else if(event.cancelled != true) {
        // Append all tags
        $(event_card_body).append(event_card_title).append(event_card_contact_number).append(event_card_time).append(event_card_services).append(event_card_payment).append(event_card_edit).append(event_card_cancel);
        $(event_card).append(event_card_header);
        $(event_card).append(event_card_body);
        $(myContainer).append(event_card);
        $(".events-container").append(myContainer)

        // Setup button for click events
        $(`#${event._id}-payment-schedule`).click({id: event._id, patient: event.patient}, payment_schedule);
        $(`#${event._id}-edit-schedule`).click({id: event._id, patient: event.patient}, update_schedule);
        $(`#${event._id}-cancel`).click({id: event._id}, cancel_schedule);

      // Append this schedule if cancelled
      } else {
        // Setup all tags
        event_card = $("<div class='card text-white bg-danger m-4'></div>");
        event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm} <strong>Cancelled</strong></h4>`);

        // Append all tags
        $(event_card_body).append(event_card_title).append(event_card_time).append(event_card_services);
        $(event_card).append(event_card_header);
        $(event_card).append(event_card_body);
        $(myContainer).append(event_card);
        $(".events-container").append(myContainer)

      }
    })
  }
}

//--------------------------------
// Computes grand total           |
//--------------------------------
function computeGrandTotal() {
  
  var gTotal = parseInt($("#serviceTotal").val())
  var computedGTotal = gTotal
  var mTotal = 0

  computedGTotal = parseInt($("#serviceTotal").val()) 
  if($("#medPrice1").val() != '') {
    computedGTotal += parseInt($("#medPrice1").val())
    mTotal += parseInt($("#medPrice1").val())
  }
  if($("#medPrice2").val() != '') {
    computedGTotal += parseInt($("#medPrice2").val())
    mTotal += parseInt($("#medPrice2").val())
  }
  if($("#medPrice3").val() != '') {
    computedGTotal += parseInt($("#medPrice3").val())
    mTotal += parseInt($("#medPrice3").val())
  }
  if($("#medPrice4").val() != '') {
    computedGTotal += parseInt($("#medPrice4").val())
    mTotal += parseInt($("#medPrice4").val())
  }
  if($("#medPrice5").val() != '') {
    computedGTotal += parseInt($("#medPrice5").val())
    mTotal += parseInt($("#medPrice5").val())
  }
  if($("#medPrice6").val() != '') {
    computedGTotal += parseInt($("#medPrice6").val())
    mTotal += parseInt($("#medPrice6").val())
  }
  console.log(mTotal)
  $('#grandTotal').val(computedGTotal)
  $('#medicineTotal').val(mTotal)
}

//--------------------------------
// Handles actions in payment     |
//--------------------------------
function paymentActions() {

  // Set function on #med when changed
  $("#med1").change(function() {
    // Get value of #med
    var s = $("#med1").val()
    // if #med is not equal to 'none'
    if(s != 'none') {
      // Select and store the medicine based on id 
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      // Get the value of #medQuantity
      var q = $("#medQuantity1").val()
      // if #medQuantity is not equal to ''
      if(q != '') {
        // Compute for the price medicine (Price of medicine * quantity of medicine entered)
        var price = parseInt(selectedMed.price) * parseInt(q);
        // Display the price
        $("#medPrice1").val(price)
        // Compute grand total with the price of medicine
        computeGrandTotal()
      } else {
        // Set the price of medicine to ''
        $("#medPrice1").val('')
        // Compute for grand total
        computeGrandTotal()
      }
    // if #med is equal to 'none'
    } else {
      computeGrandTotal()
    }
  })

  // Set function when #medQuantity is filled by user
  $("#medQuantity1").keyup(function () {
    // Get the quantity of #medQuantity
    var q = $("#medQuantity1").val()
    // Initialize regex to detect numbers only
    var rN = /[0-9]/
    // if #medQuantity is not empty
    if(q != '') {
      // Test the character input of the user if number
      // if it is number
      if(rN.test(q[q.length-1])) {
        // Get the #medQuantity value
        q = $("#medQuantity1").val()
        // Check #medQuantity again if not empty
        if(q != '') {
          // Get the value of #med
          var s = $("#med1").val()
          // if the value of #med is 'none'
          if(s != 'none') {
            // Select the medicine based on id
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            // Compute for the price of medicine (Price of each medicine * Quantity of medicine entered my user)
            var price = parseInt(selectedMed.price) * parseInt(q);
            // Display the the computed price of medicine
            $("#medPrice1").val(price)
            // Compute the grand total with computed price of medicine
            computeGrandTotal()
          }

        // if #medQuantity is empty
        } else {
          // Set #medprice to ''
          $("#medPrice1").val('')
          // Compute Grand total
          computeGrandTotal()
        }

      // if not number
      } else {
        // Remove the characters that are not number
        $("#medQuantity1").val(q.slice(0, q.length - 1))
      }

    // if #medQuantity is empty
    } else {
      // Set #medPrice to ''
      $("#medPrice1").val('')
      // Compute grand total
      computeGrandTotal()
    }
  })


  $("#med2").change(function() {
    var s = $("#med2").val()
    console.log(s)
    if(s != 'none') {
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      var q = $("#medQuantity2").val()
      if(q != '') {
        var price = parseInt(selectedMed.price) * parseInt(q);
        $("#medPrice2").val(price)
        computeGrandTotal()
      } else {
        $("#medPrice2").val('')
        computeGrandTotal()
      }
    } else {
      computeGrandTotal()
    }
  })

  $("#medQuantity2").keyup(function () {
    var q = $("#medQuantity2").val()
    var rN = /[0-9]/
    console.log(q)
    console.log(rN.test(q[q.length-1]))
    if(q != '') {
      if(rN.test(q[q.length-1])) {
        q = $("#medQuantity2").val()
        if(q != '') {
          var s = $("#med2").val()
          if(s != 'none') {
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            var price = parseInt(selectedMed.price) * parseInt(q);
            $("#medPrice2").val(price)
            computeGrandTotal()
          }
        } else {
          $("#medPrice2").val('')
          computeGrandTotal()
        }
      } else {
        $("#medQuantity2").val(q.slice(0, q.length - 1))
      }
    } else {
      $("#medPrice2").val('')
      computeGrandTotal()
    }
  })


  $("#med3").change(function() {
    var s = $("#med3").val()
    console.log(s)
    if(s != 'none') {
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      var q = $("#medQuantity3").val()
      if(q != '') {
        var price = parseInt(selectedMed.price) * parseInt(q);
        $("#medPrice3").val(price)
        computeGrandTotal()
      } else {
        $("#medPrice3").val('')
        computeGrandTotal()
      }
    } else {
      computeGrandTotal()
    }
  })

  $("#medQuantity3").keyup(function () {
    var q = $("#medQuantity3").val()
    var rN = /[0-9]/
    console.log(q)
    console.log(rN.test(q[q.length-1]))
    if(q != '') {
      if(rN.test(q[q.length-1])) {
        q = $("#medQuantity3").val()
        if(q != '') {
          var s = $("#med3").val()
          if(s != 'none') {
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            var price = parseInt(selectedMed.price) * parseInt(q);
            $("#medPrice3").val(price)
            computeGrandTotal()
          }
        } else {
          $("#medPrice3").val('')
          computeGrandTotal()
        }
      } else {
        $("#medQuantity3").val(q.slice(0, q.length - 1))
      }
    } else {
      $("#medPrice3").val('')
      computeGrandTotal()
    }
  })


  $("#med4").change(function() {
    var s = $("#med4").val()
    console.log(s)
    if(s != 'none') {
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      var q = $("#medQuantity4").val()
      if(q != '') {
        var price = parseInt(selectedMed.price) * parseInt(q);
        $("#medPrice4").val(price)
        computeGrandTotal()
      } else {
        $("#medPrice4").val('')
        computeGrandTotal()
      }
    } else {
      computeGrandTotal()
    }
  })

  $("#medQuantity4").keyup(function () {
    var q = $("#medQuantity4").val()
    var rN = /[0-9]/
    console.log(q)
    console.log(rN.test(q[q.length-1]))
    if(q != '') {
      if(rN.test(q[q.length-1])) {
        q = $("#medQuantity4").val()
        if(q != '') {
          var s = $("#med4").val()
          if(s != 'none') {
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            var price = parseInt(selectedMed.price) * parseInt(q);
            $("#medPrice4").val(price)
            computeGrandTotal()
          }
        } else {
          $("#medPrice4").val('')
          computeGrandTotal()
        }
      } else {
        $("#medQuantity4").val(q.slice(0, q.length - 1))
      }
    } else {
      $("#medPrice4").val('')
      computeGrandTotal()
    }
  })


  $("#med5").change(function() {
    var s = $("#med5").val()
    console.log(s)
    if(s != 'none') {
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      var q = $("#medQuantity5").val()
      if(q != '') {
        var price = parseInt(selectedMed.price) * parseInt(q);
        $("#medPrice5").val(price)
        computeGrandTotal()
      } else {
        $("#medPrice5").val('')
        computeGrandTotal()
      }
    } else {
      computeGrandTotal()
    }
  })

  $("#medQuantity5").keyup(function () {
    var q = $("#medQuantity5").val()
    var rN = /[0-9]/
    console.log(q)
    console.log(rN.test(q[q.length-1]))
    if(q != '') {
      if(rN.test(q[q.length-1])) {
        q = $("#medQuantity5").val()
        if(q != '') {
          var s = $("#med5").val()
          if(s != 'none') {
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            var price = parseInt(selectedMed.price) * parseInt(q);
            $("#medPrice5").val(price)
            computeGrandTotal()
          }
        } else {
          $("#medPrice5").val('')
          computeGrandTotal()
        }
      } else {
        $("#medQuantity5").val(q.slice(0, q.length - 1))
      }
    } else {
      $("#medPrice5").val('')
      computeGrandTotal()
    }
  })


  $("#med6").change(function() {
    var s = $("#med6").val()
    console.log(s)
    if(s != 'none') {
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      var q = $("#medQuantity6").val()
      if(q != '') {
        var price = parseInt(selectedMed.price) * parseInt(q);
        $("#medPrice6").val(price)
        computeGrandTotal()
      } else {
        $("#medPrice6").val('')
        computeGrandTotal()
      }
    } else {
      computeGrandTotal()
    }
  })

  $("#medQuantity6").keyup(function () {
    var q = $("#medQuantity6").val()
    var rN = /[0-9]/ 
    console.log(q)
    console.log(rN.test(q[q.length-1]))
    if(q != '') {
      if(rN.test(q[q.length-1])) {
        q = $("#medQuantity6").val()
        if(q != '') {
          var s = $("#med6").val()
          if(s != 'none') {
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            var price = parseInt(selectedMed.price) * parseInt(q);
            $("#medPrice6").val(price)
            computeGrandTotal()
          }
        } else {
          $("#medPrice6").val('')
          computeGrandTotal()
        }
      } else {
        $("#medQuantity6").val(q.slice(0, q.length - 1))
      }
    } else {
      $("#medPrice6").val('')
      computeGrandTotal()
    }
  })
}

//--------------------------------
// Handles payment of patient     |
//--------------------------------
function payment_schedule(event) {

  // Empty the .for-schedule
  $(".for-schedule").empty()
  
  // Remove text and classes in inputs
  removeTextAndClassinInputs()
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
    return;
  // remove red error input on click
  $("input").click(function(){
    $(this).removeClass("error-input");
  })
  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
  //   $("#dialog input[type=number]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250); 
  $("#dialog").show(400);

  // Choose schedule based on id
  var filterSched = schedule_data.schedules.filter(schedule => schedule._id === event.data.id)
  filterSched = filterSched[0]
  // Append Select tags depending on 'filterSched'
  appendPayment(filterSched)

  // Choose patient based on id
  var thisPatient = schedule_data.patients.filter(patient => patient._id == event.data.patient._id)
  thisPatient = thisPatient[0]
  $("#flexible-text").text(`Payment for ${thisPatient.name}`)

  // Fill up forms depending on 'thisPatient'
  fillupForm(thisPatient)

  // Disable forms
  disableForms()
  $("#ampm").prop("disabled", true)
  $("#service").prop("disabled", true)
  $("#service2").prop("disabled", true)
  
  // Enabling forms
  $("#medQuantity1").prop("disabled", false)
  $("#medQuantity2").prop("disabled", false)
  $("#medQuantity3").prop("disabled", false)
  $("#medQuantity4").prop("disabled", false)
  $("#medQuantity5").prop("disabled", false)
  $("#medQuantity6").prop("disabled", false)
  $("#medPrice1").prop("disabled", false)
  $("#medPrice2").prop("disabled", false)
  $("#medPrice3").prop("disabled", false)
  $("#medPrice4").prop("disabled", false)
  $("#medPrice5").prop("disabled", false)
  $("#medPrice6").prop("disabled", false)

  // Handles all actions in payment
  paymentActions()

  // Event handler for cancel button
  $("#cancel-button").click(function() {
    $("#name").removeClass("error-input");
    $("#count").removeClass("error-input");
    $("#dialog").hide(300);
    $(".events-container").show(300);
  });
  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
    // Get all data needed  for payment
    var date = new Date()
    var ampm = $("#ampm").val();
    var month = $("#month").val();
    var dayChoose = $("#day").val();
    var service = $("#service").val();
    var service2 = $("#service2").val();
    var services = [service, service2]
    var schedID = filterSched._id 
    var patientID = event.data.patient._id
    var servicesFiltered = []
    var medicineFiltered = []
    var day = parseInt($(".active-date").html());
    var sTotal = parseInt($('#serviceTotal').val())
    var mTotal = parseInt($('#medicineTotal').val())
    var gTotal = parseInt($('#grandTotal').val())

    // Validate services and schedule
    checkValidationsForSchedule(ampm, service, service2)
 
    // Remove classes in #medQuantity and set the text to ""
    for(let i = 1; i <= 6; i++) {
      $(`#medQuantity${i}`).click(function(){
        $(`#medQuantity${i}`).removeClass("is-invalid");
        $(`#q${i}-invalid`).text("");
      })
    }

    // If no errors
    if(validationErrors.length === 0) {

      // Validate if quantity entered is less than actual quantity of product
      for(let i = 1; i <=6; i++) {
        var p = $(`#medPrice${i}`).val()
        if(p != '') {
          var q = $(`#medQuantity${i}`).val()
          var m = $(`#med${i}`).val()
          schedule_data.inventory.forEach(med => {
            if(med._id == m) {
              if(med.quantity < parseInt(q)) {
                $(`#medQuantity${i}`).addClass("is-invalid")
                $(`#q${i}-invalid`).addClass("invalid-feedback");
                $(`#q${i}-invalid`).text(`${med.name} has only ${med.quantity} pc(s)`);
                validationErrors.push(`${med.name} is not enough `)
              }
              return;
            }
          })
        }
      }

      // if no errors
      if(validationErrors.length === 0) {
        // Filter services
        services.forEach(serv => { 
          if(serv.value != 'none')
          servicesFiltered.push(serv)
        })

        // Store in 'medicineFiltered' all the valid select tags of medicines
        for(let i = 1; i <= 6; i++) {
          if($(`#medPrice${i}`).val() != '') {
            let medObj = {}
            console.log($(`#medPrice${i}`).val())
            medObj._id = $(`#med${i}`).val()
            medObj.text = $(`#med${i} option:selected`).text()
            medObj.price = parseInt($(`#medPrice${i}`).val())
            medObj.quantity = parseInt($(`#medQuantity${i}`).val())
            medicineFiltered.push(medObj)
          }
        }

        $("#dialog").hide(300);
        // Call a function to handle payment
        new_payment_json(date.getFullYear(), date.getMonth() + 1, day, ampm, servicesFiltered, medicineFiltered, patientID, schedID, sTotal, mTotal, gTotal);

      // Alert user for errors
      } else {
        alert(`${validationErrors}`)
      }

    // Alert users for errors
    } else {
      alert(`Please check your inputs in ${validationErrors}`)
    }
  });
}

//----------------------------------
// Call route to handle payment     |
//----------------------------------
function new_payment_json(year, month, day,  ampm, servicesFiltered, medicineFiltered, patientID, schedID, sTotal, mTotal, gTotal) {

  // Store all data needed on a single object
  var newPayment = {
    "year": year,
    "month": month,
    "day": day,
    "ampm": ampm,
    "patientID": patientID,
    "schedID": schedID,
    "serviceSimple": servicesFiltered,
    "medicines" : medicineFiltered,
    "sTotal" : sTotal,
    "mTotal" : mTotal,
    "gTotal" : gTotal
  };
  
  $.ajax({
    type: 'POST',
    data: JSON.stringify(newPayment),
    url: `${host}/payment/add-payment`,
    contentType: 'application/json'
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}

//-----------------------------------------------------
// Validates forms of adding and updating schedule     |
//-----------------------------------------------------
function checkValidationsForSchedule(ampm, service, service2) {
  validationErrors = []
  // if time is 'none', alert user
  if(ampm === 'none') {
    $("#ampm").addClass("is-invalid");
    $("#ampm-invalid").addClass("invalid-feedback");
    $("#ampm-invalid").text("Please choose time")
    validationErrors.push('Time')
  }
  // if no services, alert user
  if(service === 'none' && service2 === 'none') {
    $("#service").addClass("is-invalid");
    $("#service-invalid").addClass("invalid-feedback");
    $("#service-invalid").text("Please choose at least 1 service")
    $("#service2").addClass("is-invalid");
    $("#service2-invalid").addClass("invalid-feedback");
    $("#service2-invalid").text("Please choose at least 1 service")
    validationErrors.push('Service')
  }
}

//----------------------------------
// Handles on updating schedule     |
//----------------------------------
function update_schedule(event) {

  // Clear for-schedule
  $(".for-schedule").empty()
  // Remove text and classes of inputs
  removeTextAndClassinInputs()
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
    return;
  // remove red error input on click
  $("input").click(function(){
    $(this).removeClass("error-input");
  })
  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  $("#dialog").show(400);

  // Filter Schedule based on id
  var filterSched = schedule_data.schedules.filter(schedule => schedule._id === event.data.id)
  filterSched = filterSched[0]
  appendScheduleFormsWithVal(filterSched)

  // Filter Patient based on id
  var thisPatient = schedule_data.patients.filter(patient => patient._id == event.data.patient._id)
  thisPatient = thisPatient[0]
  $("#flexible-text").text(`Reschedule ${thisPatient.name}`)
  fillupForm(thisPatient)

  // Disable forms
  disableForms()
  
  // Event handler for month option
   $("#month").change(function() {
    $("#day").empty()
    var myDate = new Date()
    var numOfDays = new Date(myDate.getFullYear(), $("#month").val(), 0).getDate()
    for(let i = 1; i <= numOfDays; i++) {
      $("#day").append(`<option value="${i}">${i}</option>`)
    }
  })
  // Event handler for cancel button
  $("#cancel-button").click(function() {
    $("#name").removeClass("error-input");
    $("#count").removeClass("error-input");
    $("#dialog").hide(300);
    $(".events-container").show(300);
  });
  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
    var date = event.data.date;
    // Get all data needed for updating schedule
    var ampm = $("#ampm").val();
    var month = parseInt($("#month").val());
    var dayChoose = parseInt($("#day").val());
    var service = $("#service").val();
    var service2 = $("#service2").val();
    var services = [service, service2]
    var schedID = filterSched._id
    var patientID = event.data.patient._id
    var day = parseInt($(".active-date").html());
    var date = new Date()
    var servicesFiltered = []

    // Validate inputs in time and services
    checkValidationsForSchedule(ampm, service, service2)
 
    // If no error
    if(validationErrors.length == 0) {
      
      // Check if time is occupied
      var filteredTime = check_time_of_events_from_edit(dayChoose, month, date.getFullYear(), ampm, schedID)
      if(filteredTime.length != 0) {
        $("#ampm").addClass("is-invalid");
        $("#ampm-invalid").addClass("invalid-feedback");
        $("#ampm-invalid").text("Time is already occupied")
        validationErrors.push('Time')
      }
      // If time is not occupied      
      if(validationErrors.length == 0) {

        // Filter services
        services.forEach(serv => {
          if(serv != 'none'){
            servicesFiltered.push(serv)
          }
        })

        $("#dialog").hide(250);
        // Call function that handles updating schedule
        update_schedule_json(month, dayChoose, ampm, servicesFiltered, patientID, schedID);
        date.setDate(day);
        init_calendar(date);
      
      // Alert user if time is occupied
      } else {
        alert(`Time is already occupied`)
      }

    // Alert user for erros
    } else {
      alert(`Please check your inputs in ${validationErrors}`)
    }
  });
}

//----------------------------------
// Call route to update schedule    |
//----------------------------------
function update_schedule_json(month, day, ampm, services, patientID, schedID){
  var myServices = []
  services.forEach(service => {
    myServices.push(service)
  })

  // Store all data needed in 1 object
  var updateSchedule = {
    // "year": date.getFullYear(),
    "month": month,
    "day": day,
    "ampm": ampm,
    "patientID": patientID,
    "schedID": schedID,
    "serviceSimple": myServices
  };



  $.ajax({
    type: 'POST',
    data: JSON.stringify(updateSchedule),
    url: `${host}/schedule/edit-schedule`,
    contentType: 'application/json'
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}

//----------------------------------
// Call route to cancel schedule    |
//----------------------------------
function cancel_schedule(event) { 
  const id = event.data.id
  var data = {}
  data.id = id
  // Prompt user for confirmation of cancelling schedule
  if(confirm('Do you really want to cancel this schedule ?')){
    $.ajax({
      type: 'POST',
      data: JSON.stringify(data),
      url: `${host}/schedule/cancel-schedule`,
      contentType: 'application/json',
      success: function(data) {
        console.log('success');
        console.log(JSON.stringify(data));
        location.reload(true)
      }
    })
  }
}

///-----------------------------------------
// Check if specific date have schedule     |
//------------------------------------------
function check_events(day, month, year) {
  var events = [];
  for(var i=0; i<schedule_data["schedules"].length; i++) {
      var event = schedule_data["schedules"][i];
      if(event["day"]===day && event["month"]===month && event["year"]===year) {
            console.log()
              events.push(event);
      }
  }
  return events;
}

//----------------------------------
// Check if time is occupied        |
//----------------------------------
function check_time_of_events(day, month, year, ampm) {

  var currArr = ampm.split('-')
  var currTime = `${currArr[0]}${currArr[1]}`
  var currAmpm = currArr[2]
  currTime = currAmpm === 'PM'  && currTime != '1200' && currTime != '1215' && currTime != '1230' && currTime != '1245' ? parseInt(currTime) + 1200 : parseInt(currTime);
  var currTimeTo = parseInt(currTime) + (parseInt(numOfHours) * 100)
  var filteredTime = []
  filteredTime = schedule_data.schedules.filter(schedule => {
    if(schedule.day===day && schedule.month===month && schedule.year===year && schedule.cancelled === false && schedule.done === false) {
      console.log(schedule.ampm)
      var schedArr = schedule.ampm.split('-')
      var schedTime = `${schedArr[0]}${schedArr[1]}`
      var schedAmpm = schedArr[2]
      schedTime = schedAmpm === 'PM' && schedTime != '1200' && schedTime != '1215' && schedTime != '1230' && schedTime != '1245' ? parseInt(schedTime) + 1200 : parseInt(schedTime);
      var schedTimeTo = parseInt(schedTime) + (parseInt(numOfHours) * 100)

      // if((currTime >= schedTime && currTime <= schedTimeTo) || (currTimeTo >= schedTime && currTimeTo <= schedTimeTo)) {
      //   console.log(currTime,schedTime, currTime, schedTimeTo)
      //   console.log(currTimeTo,schedTime, currTimeTo, schedTimeTo)
      //   return schedTime
      // }

      if(currTime >= schedTime && currTime <= schedTimeTo) {
        console.log(currTime,schedTime, currTime, schedTimeTo)
        return schedTime
      }
      if (currTimeTo >= schedTime && currTimeTo <= schedTimeTo) {
        console.log(currTimeTo,schedTime, currTimeTo, schedTimeTo)
        return schedTime
      }
    }
  })

  return filteredTime
}

//------------------------------------------------------
// Check if time is occupied when updating schedule     |
//------------------------------------------------------
function check_time_of_events_from_edit(day, month, year, ampm, schedID) {

  var currArr = ampm.split('-')
  var currTime = `${currArr[0]}${currArr[1]}`
  var currAmpm = currArr[2]
  currTime = currAmpm === 'PM'  && currTime != '1200' && currTime != '1215' && currTime != '1230' && currTime != '1245' ? parseInt(currTime) + 1200 : parseInt(currTime);
  var currTimeTo = parseInt(currTime) + (parseInt(numOfHours) * 100)
  var filteredTime = []
  filteredTime = schedule_data.schedules.filter(schedule => {
    console.log(schedule._id != schedID)
    console.log(schedule._id +"  " + schedID)
    if(schedule.day===day && schedule.month===month && schedule.year===year && schedule.cancelled === false && schedule.done === false && schedule._id != schedID) {
      console.log(schedule.ampm)
      var schedArr = schedule.ampm.split('-')
      var schedTime = `${schedArr[0]}${schedArr[1]}`
      var schedAmpm = schedArr[2]
      schedTime = schedAmpm === 'PM' && schedTime != '1200' && schedTime != '1215' && schedTime != '1230' && schedTime != '1245' ? parseInt(schedTime) + 1200 : parseInt(schedTime);
      var schedTimeTo = parseInt(schedTime) + (parseInt(numOfHours) * 100)

      // if((currTime >= schedTime && currTime <= schedTimeTo) || (currTimeTo >= schedTime && currTimeTo <= schedTimeTo)) {
      //   console.log(currTime,schedTime, currTime, schedTimeTo)
      //   console.log(currTimeTo,schedTime, currTimeTo, schedTimeTo)
      //   return schedTime
      // }

      if(currTime >= schedTime && currTime <= schedTimeTo) {
        console.log(currTime,schedTime, currTime, schedTimeTo)
        console.log('aaa')
        return schedTime
      }
      if (currTimeTo >= schedTime && currTimeTo <= schedTimeTo) {
        console.log(currTimeTo,schedTime, currTimeTo, schedTimeTo)
        console.log('bbb')
        return schedTime
      }
    }
  })

  return filteredTime
}

//----------------------------------
// Register new patient             |
//----------------------------------
function new_patient(event) {

  $(".for-schedule").empty()
  enableForms()
  removeTextAndClassinInputs()

  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
      return;
  // remove red error input on click
  $("input").click(function(){
      $(this).removeClass("error-input");
  })
  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
//   $("#dialog input[type=number]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  $("#dialog").show(400);
  $("#flexible-text").text("Register Patient")
 
  // Event handler for cancel button
  $("#cancel-button").click(function() {
      $("#name").removeClass("error-input");
      $("#count").removeClass("error-input");
      $("#dialog").hide(300);
      $(".events-container").show(300);
  });
  
  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
      // Get all data needed for registration of patient
      var date = event.data.date;
      var name = $("#name").val().trim();
      // Radio button get
      var genderCheck = $("input[type='radio'][name='gender']:checked")
      var gender = genderCheck.length > 0 ? genderCheck.val() : '';
      var address = $("#address").val().trim();
      var contact_number = $("#contact_number").val().trim();
      var age = $("#age").val().trim();
      var nationality = $("#nationality").val().trim();
      var occupation = $("#occupation").val().trim();
      var reffered_by = $("#referred_by").val().trim();

      var chief_complainant = $("#chief_complainant").val().trim();
      var diagnosis = $("#diagnosis").val();

      var patientDetails = {
        name,
        gender,
        address,
        contact_number,
        age,
        nationality,
        occupation,
        reffered_by,
        chief_complainant,
        diagnosis
      }

      // Teeth comment
      var t_11 = $("#t-11").val().trim()
      var t_12 = $("#t-12").val().trim()
      var t_13 = $("#t-13").val().trim()
      var t_14 = $("#t-14").val().trim()
      var t_15 = $("#t-15").val().trim()
      var t_16 = $("#t-16").val().trim()
      var t_17 = $("#t-17").val().trim()
      var t_18 = $("#t-18").val().trim()
      var t_21 = $("#t-21").val().trim()
      var t_22 = $("#t-22").val().trim()
      var t_23 = $("#t-23").val().trim()
      var t_24 = $("#t-24").val().trim()
      var t_25 = $("#t-25").val().trim()
      var t_26 = $("#t-26").val().trim()
      var t_27 = $("#t-27").val().trim()
      var t_28 = $("#t-28").val().trim()
      var t_31 = $("#t-31").val().trim()
      var t_32 = $("#t-32").val().trim()
      var t_33 = $("#t-33").val().trim()
      var t_34 = $("#t-34").val().trim()
      var t_35 = $("#t-35").val().trim()
      var t_36 = $("#t-36").val().trim()
      var t_37 = $("#t-37").val().trim()
      var t_38 = $("#t-38").val().trim()
      var t_41 = $("#t-41").val().trim()
      var t_42 = $("#t-42").val().trim()
      var t_43 = $("#t-43").val().trim()
      var t_44 = $("#t-44").val().trim()
      var t_45 = $("#t-45").val().trim()
      var t_46 = $("#t-46").val().trim()
      var t_47 = $("#t-47").val().trim()
      var t_48 = $("#t-48").val().trim() 

      // Medical history
      var hypertensionCheck = $("input[type='radio'][name='hypertension']:checked")
      var epilepsyCheck = $("input[type='radio'][name='epilepsy']:checked")
      var diabetesCheck = $("input[type='radio'][name='diabetes']:checked")
      var kidney_diseaseCheck = $("input[type='radio'][name='kidney_disease']:checked")
      var heart_diseaseCheck = $("input[type='radio'][name='heart_disease']:checked")
      var liver_diseaseCheck = $("input[type='radio'][name='liver_disease']:checked")
      var allergyCheck = $("input[type='radio'][name='allergy']:checked")
      var asthmaCheck = $("input[type='radio'][name='asthma']:checked")
      var othersCheck = $("input[type='radio'][name='others']:checked")

      var hypertension = hypertensionCheck.length > 0 && hypertensionCheck.val() == 'yes' ? true : false;
      var epilepsy = epilepsyCheck.length > 0 && epilepsyCheck.val() == 'yes' ? true : false;
      var diabetes = diabetesCheck.length > 0 && diabetesCheck.val() == 'yes' ? true : false;
      var kidney_disease = kidney_diseaseCheck.length > 0 && kidney_diseaseCheck.val() == 'yes' ? true : false;
      var heart_disease = heart_diseaseCheck.length > 0 && heart_diseaseCheck.val() == 'yes' ? true : false;
      var liver_disease = liver_diseaseCheck.length > 0 && liver_diseaseCheck.val() == 'yes' ? true : false;
      var allergy = allergyCheck.length > 0 && allergyCheck.val() == 'yes' ? true : false;
      var asthma = asthmaCheck.length > 0 && asthmaCheck.val() == 'yes' ? true : false;
      var others = othersCheck.length > 0 && othersCheck.val() == 'yes' ? true : false;

      var treatment_planning = $("#treatment_planning").val();

      // Oral conditions
      var depositStainsCheck = $("input[type='radio'][name='deposit_stains']:checked")
      var deposit_stains = depositStainsCheck.length > 0 ? depositStainsCheck.val() : '';
      var oralHygieneCheck = $("input[type='radio'][name='oral_hygiene']:checked")
      var oral_hygiene = oralHygieneCheck.length > 0 ? oralHygieneCheck.val() : '';
    
      var oralConditions = {
        deposit_stains,
        oral_hygiene
      }

      var medicalHistory = {hypertension,
        epilepsy,
        diabetes,
        kidney_disease,
        heart_disease,
        liver_disease,
        allergy,
        asthma,
        others
      }

      
      var teethComments = {
        t_11,
        t_12,
        t_13, 
        t_14,
        t_15,
        t_16,
        t_17,
        t_18,
        t_21, 
        t_22,
        t_23,
        t_24,
        t_25,
        t_26,
        t_27,
        t_28,
        t_31,
        t_32,
        t_33,
        t_34,
        t_35,
        t_36,
        t_37,
        t_38,
        t_41,
        t_42,
        t_43,
        t_44,
        t_45,
        t_46,
        t_47,
        t_48,
      }

      // Check validations for patient form
      checkValidationsForPatient(name, age, contact_number)

      // if no errors
      if(validationErrors.length == 0) {
        $("#dialog").hide(250);
        // Call a function to register patient
        new_register_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions);
        date.setDate(day);
        init_calendar(date);

      // Alert user for errors
      } else {
        alert(`Please check your inputs in ${validationErrors}`)
      }
      
  });
}

//----------------------------------
// Call route to add patient        |
//----------------------------------
function new_register_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions) {

  // Store all data in one object
  var newPatient = {
    // Patient details
    "name": patientDetails.name,
    "gender": patientDetails.gender,
    "address": patientDetails.address,
    "contact_number": patientDetails.contact_number,
    "age": patientDetails.age,
    "nationality": patientDetails.nationality,
    "occupation": patientDetails.occupation,
    "reffered_by": patientDetails.reffered_by,
    "chief_complainant": patientDetails.chief_complainant,
    "diagnosis": patientDetails.diagnosis,
    // Teeth comments
    "t_11": teethComments.t_11,
    "t_12": teethComments.t_12,
    "t_13": teethComments.t_13,
    "t_14": teethComments.t_14,
    "t_15": teethComments.t_15,
    "t_16": teethComments.t_16,
    "t_17": teethComments.t_17,
    "t_18": teethComments.t_18,
    "t_21": teethComments.t_21,
    "t_22": teethComments.t_22,
    "t_23": teethComments.t_23,
    "t_24": teethComments.t_24,
    "t_25": teethComments.t_25,
    "t_26": teethComments.t_26,
    "t_27": teethComments.t_27,
    "t_28": teethComments.t_28,
    "t_31": teethComments.t_31,
    "t_32": teethComments.t_32,
    "t_33": teethComments.t_33,
    "t_34": teethComments.t_34,
    "t_35": teethComments.t_35,
    "t_36": teethComments.t_36,
    "t_37": teethComments.t_37,
    "t_38": teethComments.t_38,
    "t_41": teethComments.t_41,
    "t_42": teethComments.t_42,
    "t_43": teethComments.t_43,
    "t_44": teethComments.t_44,
    "t_45": teethComments.t_45,
    "t_46": teethComments.t_46,
    "t_47": teethComments.t_47,
    "t_48": teethComments.t_48,
    // Medical History
    "hypertension": medicalHistory.hypertension,
    "epilepsy": medicalHistory.epilepsy,
    "diabetes": medicalHistory.diabetes,
    "kidney_disease": medicalHistory.kidney_disease,
    "heart_disease": medicalHistory.heart_disease,
    "liver_disease": medicalHistory.liver_disease,
    "allergy": medicalHistory.allergy,
    "asthma": medicalHistory.asthma,
    "others": medicalHistory.others,
    "treatment_planning": treatment_planning,
    // Oral conditions
    "deposit_stains": oralConditions.deposit_stains,
    "oral_hygiene": oralConditions.oral_hygiene,
  };

  $.ajax({
    type: 'POST',
    data: JSON.stringify(newPatient),
    url: `${host}/patient/add-patient`,
    contentType: 'application/json'
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}