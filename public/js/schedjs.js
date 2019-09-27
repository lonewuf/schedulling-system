// Dev host
// const host = 'http://localhost:3000';

// Showcase Host
const host = 'https://stormy-savannah-61307.herokuapp.com'
 
// Global Variables
const numOfHours = 2
const regexAge = /^[0-9]*$/
var validationErrors = []

var schedule_data = {
  "schedules": [], 
  "patients": [],
  "services": [],
  "inventory": []
};

var allPatients = []

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
  init_events()
  // init_patients()
  console.log(schedule_data["schedules"])
  console.log(schedule_data["inventory"])
  console.log(schedule_data)
  init_calendar(date)
  setTimeout(function(){
    $(".right-button").click();
  },2000);
  setTimeout(function(){
    $(".left-button").click();
  },3000);
  var events = check_events(today, date.getMonth()+1, date.getFullYear());
  show_events(events, months[date.getMonth()], today);
});

function pause(milliseconds) {
	var dt = new Date();
	while ((new Date()) - dt <= milliseconds) { /* Do nothing */ }
}

function init_events() {
  $.ajax({
    url: `${host}/schedule/initial-load`,
    type: "GET",
    dataType: "json",
    success: function (data) {
        schedule_data.schedules = data.scheduleData
        schedule_data.patients = data.patientData
        schedule_data.services = data.serviceData
        schedule_data.inventory = data.inventoryData
        allPatients = schedule_data.patients;
        console.log(schedule_data)
    },
    error: function (error) {
        console.log(`Error ${error}`);
    }
  })
}

// Initialize the calendar by appending the HTML dates
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
          console.log('-------')
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

// Get the number of days in a given month/year
function days_in_month(month, year) {
  var monthStart = new Date(year, month, 1);
  var monthEnd = new Date(year, month + 1, 1);
  return (monthEnd - monthStart) / (1000 * 60 * 60 * 24);    
}

// Event handler for when a date is clicked
function date_click(event) {
  $(".events-container").show(400);
  $("#dialog").hide(250);
  $("#dialog-2").hide(250);
  $(".active-date").removeClass("active-date");
  $(this).addClass("active-date");
  show_events(event.data.events, event.data.month, event.data.day);
};

// Event handler for when a month is clicked
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

// Event handler for when the year right-button is clicked
function next_year(event) {
  $("#dialog").hide(250);
  $("#dialog-2").hide(250);
  var date = event.data.date;
  var new_year = date.getFullYear()+1;
  $("year").html(new_year);
  date.setFullYear(new_year);
  init_calendar(date);
}

// Event handler for when the year left-button is clicked
function prev_year(event) {
  $("#dialog").hide(250);
  var date = event.data.date;
  var new_year = date.getFullYear()-1;
  $("year").html(new_year);
  date.setFullYear(new_year);
  init_calendar(date);
}

function new_schedule(event) {

  $(".patients-container").empty()
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
      return;
  // empty inputs and hide events
  
  $("#dialog-2 input[type=text]").val('');
  //   $("#dialog input[type=number]").val('');
  $(".events-container").hide(250);
  $("#dialog").hide(250);
  $("#dialog-2").show(500);
  allPatients = schedule_data.patients;
  console.log(schedule_data.patients)
  var availablePatients = schedule_data.patients.filter(patient => patient.is_scheduled === false)
  if(availablePatients.length > 0){
    availablePatients.forEach(patient => {
      var myContainer = $("<div class='container'></div>");
      var event_card = $("<div class='card text-white bg-primary m-4'></div>");
      var event_card_header = $(`<div class='card-header'>Name: ${patient.name}</div>`);
      //handle time
      // var a = event.ampm.split('-')
      // var to_hours;
      // var to_minutes = a[1];
      // var to_ampm;
      // to_ampm = (parseInt(a[0]) + 2 ) >= 12 ? 'PM' : 'AM'
      // if((parseInt(a[0]) + 2 ) == 13) {
      //   to_hours = '1'
      // } else if ((parseInt(a[0]) + 2 ) == 14) {
      //   to_hours = '2'
      // } else {
      //   to_hours = parseInt(a[0]) + 2
      // }
      // Handle services
      // var services = event.serviceSimple.join(',')
      // var event_name = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
      // var event_contact_number = $("<div class='event-count'><strong>Contact Number: </strong>"+ event.patient.contact_number +"</div>");
      // var event_time = $("<div class='event-name'><strong>Time: </strong>"+ event.time +":</div>");
      // var event_name1 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
      // var event_name2 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
      // var event_name3 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
      // var event_name4 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
      // var cancel_button = $(`<div class='event-name'><strong><a id=${event._id} href="#">Cancel</strong></div>`);
      // var event_name4 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
      var event_card_body = $("<div class='card-body'></div>");

      // var event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm}</h4>`);
      var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${patient.contact_number}</p>`);
      var event_card_time = $(`<p class='card-text'>Age: ${patient.age}</p>`);
      var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id=${patient._id}-edit-patient href="#">Edit Patient</strong></div>`);
      var event_card_sched = $(`<div class='card-text '><strong><a class="btn btn-sm btn-success" id=${patient._id}-schedule-patient href="#">Schedule Patient</strong></div>`);



    // if(event.cancelled != true) {
      
    
      // $(event_card).append(event_name).append(event_contact_number).append(event_time).append(event_name1).append(event_name2).append(event_name3).append(event_name4).append(cancel_button);
      $(event_card_body).append(event_card_contact_number).append(event_card_time).append(event_card_edit).append(event_card_sched);

        $(event_card).append(event_card_header);
        $(event_card).append(event_card_body);
        $(myContainer).append(event_card);
        $(".patients-container").append(myContainer)
        // $(`#${event._id}-cancel`).click({id: event._id}, cancel_schedule);
      // } else {
      //   event_card = $("<div class='card text-white bg-danger m-4'></div>");
      //   event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm} <strong>Cancelled</strong></h4>`);
      //   $(event_card_body).append(event_card_title).append(event_card_time).append(event_card_services);

      //   $(event_card).append(event_card_header);
      //   $(event_card).append(event_card_body);
      //   $(myContainer).append(event_card);
      //   $(".events-container").append(myContainer)
      //   $(`#${event._id}-cancel`).click({id: event._id}, cancel_schedule);

      // }
      $(`#${patient._id}-edit-patient`).click({id: patient._id, date: event.data.date}, edit_patient);
      $(`#${patient._id}-schedule-patient`).click({id: patient._id, date: event.data.date}, schedule_patient);
    
    })
  } else {
    var myContainer = $("<div class='container'></div>");
    var noPatientAvailable = $("<h4 class='display-4 text-center'>No Patient Available</h4>")
    $(myContainer).append(noPatientAvailable);
    $(".patients-container").append(myContainer)
    console.log('213123')
  }
}

function search_patient(event) {
  var searchName = $("#search-patient").val()
  // Filter patient that is not scheduled
  allPatients = schedule_data.patients.filter(patient => patient.is_scheduled === false)

  // Filter name based on input value()
  allPatients = allPatients.filter(patient => patient.name.includes(searchName))
  
  $(".patients-container").empty()
  
  console.log(allPatients)
  allPatients.forEach(patient => {
    var myContainer = $("<div class='container'></div>");
    var event_card = $("<div class='card text-white bg-primary m-4'></div>");
    var event_card_header = $(`<div class='card-header'>Name: ${patient.name}</div>`);
    //handle time
    // var a = event.ampm.split('-')
    // var to_hours;
    // var to_minutes = a[1];
    // var to_ampm;
    // to_ampm = (parseInt(a[0]) + 2 ) >= 12 ? 'PM' : 'AM'
    // if((parseInt(a[0]) + 2 ) == 13) {
    //   to_hours = '1'
    // } else if ((parseInt(a[0]) + 2 ) == 14) {
    //   to_hours = '2'
    // } else {
    //   to_hours = parseInt(a[0]) + 2
    // }
    // Handle services
    // var services = event.serviceSimple.join(',')
    // var event_name = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
    // var event_contact_number = $("<div class='event-count'><strong>Contact Number: </strong>"+ event.patient.contact_number +"</div>");
    // var event_time = $("<div class='event-name'><strong>Time: </strong>"+ event.time +":</div>");
    // var event_name1 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
    // var event_name2 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
    // var event_name3 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
    // var event_name4 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
    // var cancel_button = $(`<div class='event-name'><strong><a id=${event._id} href="#">Cancel</strong></div>`);
    // var event_name4 = $("<div class='event-name'><strong>Name: </strong>"+ event.patient.name +":</div>");
    var event_card_body = $("<div class='card-body'></div>");

    // var event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm}</h4>`);
    var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${patient.contact_number}</p>`);
    var event_card_time = $(`<p class='card-text'>Age: ${patient.age}</p>`);
    var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id=${patient._id}-edit-patient href="#">Edit Patient</strong></div>`);
    var event_card_sched = $(`<div class='card-text '><strong><a class="btn btn-sm btn-success" id=${patient._id}-schedule-patient href="#">Schedule Patient</strong></div>`);



    // if(event.cancelled != true) {
      
    
      // $(event_card).append(event_name).append(event_contact_number).append(event_time).append(event_name1).append(event_name2).append(event_name3).append(event_name4).append(cancel_button);
      $(event_card_body).append(event_card_contact_number).append(event_card_time).append(event_card_edit).append(event_card_sched);

      $(event_card).append(event_card_header);
      $(event_card).append(event_card_body);
      $(myContainer).append(event_card);
      $(".patients-container").append(myContainer)
      // $(`#${event._id}-cancel`).click({id: event._id}, cancel_schedule);
    // } else {
    //   event_card = $("<div class='card text-white bg-danger m-4'></div>");
    //   event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm} <strong>Cancelled</strong></h4>`);
    //   $(event_card_body).append(event_card_title).append(event_card_time).append(event_card_services);

    //   $(event_card).append(event_card_header);
    //   $(event_card).append(event_card_body);
    //   $(myContainer).append(event_card);
    //   $(".events-container").append(myContainer)
      $(`#${patient._id}-edit-patient`).click({id: patient._id, date: event.data.date}, edit_patient);
      $(`#${patient._id}-schedule-patient`).click({id: patient._id, date: event.data.date}, schedule_patient);

    // }
  })

}

function removeTextInForms() {
  $("input").prop("checked", false)
  $("textarea").val("")

  validationErrors = []
  // Remove text in validations
  $('.all-validations').text("")
  $('input').removeClass("is-invalid");
  // remove red error input on click
  $("#name").click(function(){
    $("#name").removeClass("is-invalid");
    $("#name-invalid").text("");
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
  
  // Teeth
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



// Edit patient
function edit_patient(event) {

  $(".for-schedule").empty()
  enableForms()
  removeTextInForms()
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
  
  $(".for-schedule").empty()
  // Event handler for cancel button
  $("#cancel-button").click(function() {
    $("#name").removeClass("error-input");
    $("#count").removeClass("error-input");
    $("#dialog").hide(300);
    $(".events-container").show(300);
  });

  console.log(schedule_data.patients)

  var editThisPatient = schedule_data.patients.filter(patient => patient._id == event.data.id)
  editThisPatient = editThisPatient[0]
  $("#flexible-text").text(`Update ${editThisPatient.name}`)
  fillupForm(editThisPatient)

  

  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
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

    console.log(name + "  " + age)
    checkValidationsForPatient(name, age)

    if(validationErrors.length === 0) {
      var patientID = event.data.id
      var day = parseInt($(".active-date").html());

      $("#dialog").hide(250);
      console.log("update patient");
      update_patient_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions, patientID);
      date.setDate(day);
      init_calendar(date);
    } else {
      alert(`Please check your inputs in ${validationErrors}`)
    }
  });

}


function update_patient_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions, patientID) {

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

    // Patient ID
    "patientID": patientID
  };

  $.ajax({
    type: 'POST',
    data: JSON.stringify(newPatient),
    url: `${host}/patient/update-patient`,
    contentType: 'application/json',
    success: function(data) {
      console.log('success');
      console.log(JSON.stringify(data));
      location.reload(true)
    }
  })
  .then(data => {
    console.log(data)
    // location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)

}

function disableForms() {
  $("input").prop("disabled", true)
  $("textarea").prop("disabled", true)
  $("#ok-button").prop("disabled", false)
  $("#cancel-button").prop("disabled", false)
  $("#search-patient").prop("disabled", false)
}

function enableForms() {
  $("textarea").prop("disabled", false)
  $("input").prop("disabled", false)
}

function schedule_patient(event) {

  $(".for-schedule").empty()
  removeTextInForms()
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
  
  appendScheduleForms()

  var editThisPatient = schedule_data.patients.filter(patient => patient._id == event.data.id)
  editThisPatient = editThisPatient[0]
  $("#flexible-text").text(`Schedule ${editThisPatient.name}`)
  fillupForm(editThisPatient)

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
    console.log('click me')
    // Time
    var ampm = $("#ampm").val();
    var service = $("#service").val();
    var service2 = $("#service2").val();
    var services = [service, service2]
    var patientID = event.data.id
    var date = new Date()
    var day = parseInt($(".active-date").html());

    checkValidationsForSchedule(ampm, service, service2)

    if(validationErrors.length == 0) {

      var filteredTime = check_time_of_events(day, date.getMonth()+1, date.getFullYear(), ampm)
      if(filteredTime.length != 0) {
        $("#ampm").addClass("is-invalid");
        $("#ampm-invalid").addClass("invalid-feedback");
        $("#ampm-invalid").text("Time is already occupied")
        validationErrors.push('Time')
      }
      
      if(validationErrors.length == 0) {
        var servicesFiltered = []
        services.forEach(serv => {
          if(serv != 'none'){
            servicesFiltered.push(serv)
          }
        })

        $("#dialog").hide(250);
        console.log("new event");
        schedule_patient_json(date, day, ampm, servicesFiltered, patientID);
        date.setDate(day);
        init_calendar(date);
      } else {
        alert(`Time is already occupied`)
      }
    } else {
      alert(`Please check your inputs in : ${validationErrors}`)
    }
  });

}

function schedule_patient_json(date, day, ampm, services, patientID) {
  var myServices = []
  console.log("===============")
  services.forEach(service => {
    myServices.push(service)
  })

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
    contentType: 'application/json',
    success: function(data) {
      console.log('success');
      console.log(JSON.stringify(data));
      location.reload(true)
    }
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}


// Event handler for clicking the new event button
function new_event(event) {
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
  $("#dialog").show(400);
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
      var name = $("#name").val().trim();
      var address = $("#address").val().trim();
      var contact_number = $("#contact_number").val().trim();
      var company = $("#company").val().trim();
      var time = $("#time").val().trim();
      var ampm = $("#ampm").val();
      var time = $("#service").val().trim();
      var day = parseInt($(".active-date").html());
      // Basic form validation
      console.log(name,  date, day, address, contact_number, company, time, ampm, service)
      if(name.length === 0) {
          $("#name").addClass("error-input");
      }
    //   else if(isNaN(count)) {
    //       $("#count").addClass("error-input");
    //   }
      else {
          $("#dialog").hide(250);
          console.log("new event");
          new_event_json(name, date, day, address, contact_number, company, time, ampm, service);
          date.setDate(day);
          init_calendar(date);
      }
  });
}

function appendScheduleFormsWithVal(event) {
  // Bring back schedulling related tags
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

  // select2.append(`<option value="none">Select Service</option>`)
  //       .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
  //       .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
  //       .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
  //       .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
  //       .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
  //       .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
  //       .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
  //       .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
  //       .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
  //       .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
  //       .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  // Appending all option tag for service2

  select3.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select3.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })
  // select3.append(`<option value="none">Select Service</option>`)
  //       .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
  //       .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
  //       .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
  //       .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
  //       .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
  //       .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
  //       .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
  //       .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
  //       .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
  //       .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
  //       .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  // Append month
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

        

  var myDate = new Date()
  var numOfDays = new Date(myDate.getFullYear(), event.month, 0).getDate()
  for(let i = 1; i <= numOfDays; i++) {
    select5.append(`<option value="${i}">${i}</option>`)
  }

  var validationTime = $(`<div id="ampm-invalid" class="all-validations"></div>`)
  var validationService = $(`<div id="service-invalid" class="all-validations"></div>`)
  var validationService2 = $(`<div id="service2-invalid" class="all-validations"></div>`)

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

  var servicesMap = event.service.map(serv => serv._id)
  $("#ampm").val(event.ampm) 
  if(event.service.length == 1)
  console.log(event.service.length)
    $("#service").val(servicesMap[0])
  if(event.service.length == 2) {
    console.log(event.service.length)
    $("#service").val(servicesMap[0])
    $("#service2").val(servicesMap[1])
  }
  console.log(event.service.length)
  console.log(event.service[0])
  console.log(event.service[1])
  $("#month").val(event.month)
  $("#day").val(event.day)

}

function appendScheduleForms() {
  // Bring back schedulling related tags
  var row = $(`<div class="row"></div>`)

  var col1 = $(`<div class="col-lg-4"></div>`)
  var col2 = $(`<div class="col-lg-4"></div>`)
  var col3 = $(`<div class="col-lg-4"></div>`)

  var form1 = $(`<div class="form-group"></div>`)
  var form2 = $(`<div class="form-group"></div>`)
  var form3 = $(`<div class="form-group"></div>`)

  var label1 = $(`<label for="ampm">Time: </label>`)
  var label2 = $(`<label for="service">Service: </label>`)
  var label3 = $(`<label for="service2">Service2: </label>`)

  var select1 = $(`<select id="ampm" name="ampm" class="form-control form-control-sm"></select>`)
  var select2 = $(`<select id="service" name="service" class="form-control form-control-sm">`)
  var select3 = $(`<select id="service2" name="service2" class="form-control form-control-sm">`)

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
  // select2.append(`<option value="none">Select Service</option>`)
  //       .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
  //       .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
  //       .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
  //       .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
  //       .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
  //       .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
  //       .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
  //       .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
  //       .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
  //       .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
  //       .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  // Appending all option tag for service2
  select3.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select3.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })
  // select3.append(`<option value="none">Select Service</option>`)
  //       .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
  //       .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
  //       .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
  //       .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
  //       .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
  //       .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
  //       .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
  //       .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
  //       .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
  //       .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
  //       .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  var validationTime = $(`<div id="ampm-invalid" class="all-validations"></div>`)
  var validationService = $(`<div id="service-invalid" class="all-validations"></div>`)
  var validationService2 = $(`<div id="service2-invalid" class="all-validations"></div>`)

  form1.append(label1).append(select1).append(validationTime)
  form2.append(label2).append(select2).append(validationService)
  form3.append(label3).append(select3).append(validationService2)

  col1.append(form1)
  col2.append(form2)
  col3.append(form3)

  row.append(col1).append(col2).append(col3)

  $(".for-schedule").append(row)
}

function appendPayment(event) {
  // Bring back schedulling related tags
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
  

  var select1 = $(`<select id="ampm" name="ampm" class="form-control form-control-sm"></select>`)
  var select2 = $(`<select id="service" name="service" class="form-control form-control-sm">`)
  var select3 = $(`<select id="service2" name="service2" class="form-control form-control-sm">`)

  var medSelectLabel1 = $('<label for="med1">Medicine: </label>')
  var medQuantityLabel1 = $('<label for="medQuantity1">Quantity: </label>')
  var medPriceLabel1 = $('<label for="medPrice1">Price: </label>')
  var medSelect1 = $('<select id="med1" name="med1" class="form-control form-control-sm"></select>')
  var medQuantity1 = $('<input type="text" id="medQuantity1" name="medQuantity1" class="form-control form-control-sm" placeholder="Enter quantity">')
  var medPrice1 = $('<input type="text" id="medPrice1" name="medPrice1" class="form-control form-control-sm"  readonly>')


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

  // select2.append(`<option value="none">Select Service</option>`)
  //       .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
  //       .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
  //       .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
  //       .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
  //       .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
  //       .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
  //       .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
  //       .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
  //       .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
  //       .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
  //       .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  // Appending all option tag for service2

  select3.append(`<option value="none">Select Service</option>`)
  schedule_data["services"].forEach(service => {
    select3.append(`<option value="${service._id}">${service.name} - &#8369 ${service.price}</option>`)
  })
  // select3.append(`<option value="none">Select Service</option>`)
  //       .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
  //       .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
  //       .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
  //       .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
  //       .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
  //       .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
  //       .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
  //       .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
  //       .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
  //       .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
  //       .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

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

  var validationTime = $(`<div id="ampm-invalid" class="all-validations"></div>`)
  var validationService = $(`<div id="service-invalid" class="all-validations"></div>`)
  var validationService2 = $(`<div id="service2-invalid" class="all-validations"></div>`)


  var validationQ1 = $(`<div id="q1-invalid" class="all-validations"></div>`)
  var validationQ2 = $(`<div id="q2-invalid" class="all-validations"></div>`)
  var validationQ3 = $(`<div id="q3-invalid" class="all-validations"></div>`)
  var validationQ4 = $(`<div id="q4-invalid" class="all-validations"></div>`)
  var validationQ5 = $(`<div id="q5-invalid" class="all-validations"></div>`)
  var validationQ6 = $(`<div id="q6-invalid" class="all-validations"></div>`)

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
    

  var servicesMap = event.service.map(serv => serv._id)
  var sTotal = event.service.reduce((acc, serv) => acc + parseInt(serv.price), 0)
  console.log(sTotal)
  $("#ampm").val(event.ampm) 
  if(event.service.length == 1)
  console.log(event.service.length)
    $("#service").val(servicesMap[0])
    $("#serviceTotal").val(sTotal)
    $("#grandTotal").val(sTotal)
  if(event.service.length == 2) {
    console.log(event.service.length)
    $("#service").val(servicesMap[0])
    $("#service2").val(servicesMap[1])
  }
  // $("#month").val(event.month)
  // $("#day").val(event.day)
}

function new_patient_with_schedule(event) {

  $(".for-schedule").empty()
  appendScheduleForms()
  enableForms()
  removeTextInForms()
  
  // if a date isn't selected then do nothing
  if($(".active-date").length===0)
  return;
  
  // empty inputs and hide events
  $("#dialog input[type=text]").val('');
//   $("#dialog input[type=number]").val('');
  $(".events-container").hide(250);
  $("#dialog-2").hide(250);
  $("#dialog").hide(250);
  $("#dialog").show(400);
  $("#flexible-text").text("Register and Schedule Patient")

  
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

      // var patientDetails = [
      //   'name',
      //   'gender',
      //   'address',
      //   'contact_number',
      //   'age',
      //   'nationality',
      //   'occupation',
      //   'reffered_by',
      //   'chief_complainant',
      //   'diagnosis'
      // ]

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

      // Time
      var ampm = $("#ampm").val();
      var service = $("#service").val();
      var service2 = $("#service2").val();
      var services = [service, service2]
      var servicesFiltered = []
      var date = new Date()

      var day = parseInt($(".active-date").html());
      // Basic form validation
      console.log(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions)
      validationErrors = []

      // Validations
      checkValidationsWithSched(name, age, ampm, service, service2)

      
      
      // If no errors proceed
      if(validationErrors.length === 0) {

        var filteredTime = check_time_of_events(day, date.getMonth()+1, date.getFullYear(), ampm)
        if(filteredTime.length != 0) {
          $("#ampm").addClass("is-invalid");
          $("#ampm-invalid").addClass("invalid-feedback");
          $("#ampm-invalid").text("Time is already occupied")
          validationErrors.push('Time')
        }

        if(validationErrors.length === 0) {

          // Filter services
          services.forEach(serv => {
            if(serv != 'none'){
              servicesFiltered.push(serv)
            }
          })

          $("#dialog").hide(250);
          console.log("new event");
          new_register_and_schedule_json(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions,servicesFiltered);
          date.setDate(day);
          init_calendar(date);
        } else {
          alert(`Time is already occupied`)
        }
      } else {
        // Alert user if there are errors
        alert(`Please check your inputs in ${validationErrors}`)
      }
  });
}

function checkValidationsForPatient(name, age) {
  validationErrors = []

  if(name.length == 0) {
    $("#name").addClass("is-invalid");
    $("#name-invalid").addClass("invalid-feedback");
    $("#name-invalid").text("Name is required")
    validationErrors.push('Name')
  } 
  if(age.length == 0) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age is required")
    validationErrors.push('Age')
  } else if (!regexAge.test(age)) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age must be numeric")
    validationErrors.push('Age')
  }
}

function checkValidationsWithSched(name, age, ampm, service, service2) {
  validationErrors = []
  if(name.length === 0) {
    $("#name").addClass("is-invalid");
    $("#name-invalid").addClass("invalid-feedback");
    $("#name-invalid").text("Name is required")
    validationErrors.push('Name')
  } 
  if(age.length == 0) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age is required")
    validationErrors.push('Age')
  } else if (!regexAge.test(age)) {
    $("#age").addClass("is-invalid");
    $("#age-invalid").addClass("invalid-feedback");
    $("#age-invalid").text("Age must be numeric")
    validationErrors.push('Age')
  }
  if(ampm === 'none') {
    $("#ampm").addClass("is-invalid");
    $("#ampm-invalid").addClass("invalid-feedback");
    $("#ampm-invalid").text("Please choose time")
    validationErrors.push('Time')
  }
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

// Adds a json event to schedule_data
function new_register_and_schedule_json(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions,services) {

  var myServices = []

  services.forEach(service => {
    myServices.push(service)
  })

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

  
// > for(let i = 0; i < patientDetails.length; i++){console.log(`${patientDetails[i]}: patientDetails.${patientDetails[i]},`)}

  $.ajax({
    type: 'POST',
    data: JSON.stringify(newSchedule),
    url: `${host}/schedule/add-schedule-with-patient`,
    contentType: 'application/json',
    success: function(data) {
      console.log('success');
      console.log(JSON.stringify(data));
      location.reload(true)
    }
  })

//   .done(function( response ) {

//     // Check for successful (blank) response
//     if (response.msg === '') {

//       // Clear the form inputs
//       $('#addUser fieldset input').val('');

//       // Update the table
//       populateTable();

//     }
//     else {

//       // If something goes wrong, alert the error message that our service returned
//       alert('Error: ' + response.msg);

//     }
//   });
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}

// Display all events of the selected date in card views 
function show_events(events, month, day) {
  // Clear the dates container
  $(".events-container").empty();
  $(".events-container").show(400);
  console.log(schedule_data["schedules"], "saddd");
  console.log(schedule_data["patients"], "raaaaa");
  
  

  // If there are no events for this date, notify the user
  if(events.length===0) {
      var event_card = $("<div class='event-card'></div>");
      var event_name = $("<div class='event-name'>There are no schedule for "+month+" "+day+".</div>");
      $(event_card).css({ "border-left": "10px solid #FF1744" });
      $(event_card).append(event_name); 
      $(".events-container").append(event_card);
  }
  else {
      // Go through and add each event as a card to the events container
      events.forEach(event => {
        var myContainer = $("<div class='container'></div>");
        var event_card = $("<div class='card text-white bg-primary m-4'></div>");
        var event_card_header = $(`<div class='card-header'>Name: ${event.patient.name}</div>`);
        //handle time
        var a = event.ampm.split('-')
        var to_hours;
        var to_minutes = a[1];
        var to_ampm;
        to_ampm = ((parseInt(a[0]) + numOfHours ) >= 12) ? 'PM' : 'AM'
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

        var event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm}</h4>`);
        var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${event.patient.contact_number}</p>`);
        var event_card_time = $(`<p class='card-text'>Age: ${event.patient.age}</p>`);
        var event_card_services = $(`<p class='card-text'>Services: ${services}</p>`);
        var event_card_payment =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-success" id="${event._id}-payment-schedule" href="#">Payment</strong></div>`);
        var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id="${event._id}-edit-schedule" href="#">Edit Schedule</strong></div>`);
        var event_card_cancel = $(`<div class='card-text'><strong><a class="btn btn-sm btn-danger" id="${event._id}-cancel" href="#">Cancel</strong></div>`);

        var medTotal = event.medicine_total != null ? event.medicine_total : 0;

        if(event.cancelled != true && event.done == true){
          event_card = $("<div class='card text-white bg-success m-4'></div>");
          event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm} <strong>Done</strong></h4>`);
          var serviceTotal = $(`<p class='card-text'>Service Total: &#8369 ${event.service_total}</p>`);
          var medicineTotal = $(`<p class='card-text'>Medicine Total: &#8369 ${medTotal}</p>`);
          var grandTotal = $(`<p class='card-text'>Grand Total: &#8369 ${event.grand_total}</p>`);
          var moreInfo =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-secondary" href="/payment/search-by-schedule/${event._id}">More info</strong></div>`);

          $(event_card_body).append(event_card_title).append(event_card_contact_number).append(serviceTotal).append(medicineTotal).append(grandTotal).append(moreInfo);
          $(event_card).append(event_card_header);
          $(event_card).append(event_card_body);
          $(myContainer).append(event_card);
          $(".events-container").append(myContainer)
        }else if(event.cancelled != true) {
          $(event_card_body).append(event_card_title).append(event_card_contact_number).append(event_card_time).append(event_card_services).append(event_card_payment).append(event_card_edit).append(event_card_cancel);
          $(event_card).append(event_card_header);
          $(event_card).append(event_card_body);
          $(myContainer).append(event_card);
          $(".events-container").append(myContainer)
          $(`#${event._id}-payment-schedule`).click({id: event._id, patient: event.patient}, payment_schedule);
          $(`#${event._id}-edit-schedule`).click({id: event._id, patient: event.patient}, edit_schedule);
          $(`#${event._id}-cancel`).click({id: event._id}, cancel_schedule);
        } else {
          event_card = $("<div class='card text-white bg-danger m-4'></div>");
          event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm} <strong>Cancelled</strong></h4>`);

          $(event_card_body).append(event_card_title).append(event_card_time).append(event_card_services);
          $(event_card).append(event_card_header);
          $(event_card).append(event_card_body);
          $(myContainer).append(event_card);
          $(".events-container").append(myContainer)

        }
      })
      // for(var i=0; i<events.length; i++) {
      //     var event_card = $("<div class='event-card'></div>");
      //     var event_name = $("<div class='event-name'><strong>Name: </strong>"+events[i]["name"]+":</div>");
      //     var event_contact_number = $("<div class='event-count'><strong>Contact Number: </strong>"+events[i]["contact_number"]+"</div>");
      //     if(events[i]["cancelled"]===true) {
      //         $(event_card).css({
      //             "border-left": "10px solid #FF1744"
      //         });
      //         event_count = $("<div class='event-cancelled'>Cancelled</div>");
      //     }
      //     $(event_card).append(event_name).append(event_count);
      //     $(".events-container").append(event_card);
      // }
  }
}

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

function paymentValidations() {

  $("#med1").change(function() {
    var s = $("#med1").val()
    console.log(s)
    if(s != 'none') {
      var selectedMed = schedule_data.inventory.filter(med => med._id == s)
      selectedMed = selectedMed[0]
      var q = $("#medQuantity1").val()
      if(q != '') {
        var price = parseInt(selectedMed.price) * parseInt(q);
        $("#medPrice1").val(price)
        computeGrandTotal()
      } else {
        $("#medPrice1").val('')
        computeGrandTotal()
      }
    } else {
      computeGrandTotal()
    }
  })

  $("#medQuantity1").keyup(function () {
    var q = $("#medQuantity1").val()
    var rN = /[0-9]/
    console.log(q)
    console.log(rN.test(q[q.length-1]))
    if(q != '') {
      if(rN.test(q[q.length-1])) {
        q = $("#medQuantity1").val()
        if(q != '') {
          var s = $("#med1").val()
          if(s != 'none') {
            var selectedMed = schedule_data.inventory.filter(med => med._id == s)
            selectedMed = selectedMed[0]
            var price = parseInt(selectedMed.price) * parseInt(q);
            $("#medPrice1").val(price)
            computeGrandTotal()
          }
        } else {
          $("#medPrice1").val('')
          computeGrandTotal()
        }
      } else {
        $("#medQuantity1").val(q.slice(0, q.length - 1))
      }
    } else {
      $("#medPrice1").val('')
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

function payment_schedule(event) {
  $(".for-schedule").empty()
  removeTextInForms()
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

  var editThisSchedule = schedule_data.schedules.filter(schedule => schedule._id === event.data.id)
  editThisSchedule = editThisSchedule[0]
  console.log(editThisSchedule)
  appendPayment(editThisSchedule)

  var editThisPatient = schedule_data.patients.filter(patient => patient._id == event.data.patient._id)
  editThisPatient = editThisPatient[0]
  $("#flexible-text").text(`Payment for ${editThisPatient.name}`)
  fillupForm(editThisPatient)

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

  paymentValidations()

  // Event handler for cancel button
  $("#cancel-button").click(function() {
    $("#name").removeClass("error-input");
    $("#count").removeClass("error-input");
    $("#dialog").hide(300);
    $(".events-container").show(300);
  });
  // Event handler for ok button
  $("#ok-button").unbind().click({date: event.data.date}, function() {
    var date = new Date()
    console.log('click me')
    // Time
    var ampm = $("#ampm").val();
    var month = $("#month").val();
    var dayChoose = $("#day").val();
    var service = $("#service").val();
    var service2 = $("#service2").val();
    var services = [service, service2]
    var schedID = editThisSchedule._id
    var patientID = event.data.patient._id
    var servicesFiltered = []
    var medicineFiltered = []
    var day = parseInt($(".active-date").html());
    var sTotal = parseInt($('#serviceTotal').val())
    var mTotal = parseInt($('#medicineTotal').val())
    var gTotal = parseInt($('#grandTotal').val())

    checkValidationsForSchedule(ampm, service, service2)
 
    if(validationErrors.length === 0) {

      // Filter services
      services.forEach(serv => {
        if(serv.value != 'none')
        servicesFiltered.push(serv)
      })

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
      console.log(medicineFiltered)
      $("#dialog").hide(300);
      new_payment_json(date.getFullYear(), date.getMonth() + 1, day, ampm, servicesFiltered, medicineFiltered, patientID, schedID, sTotal, mTotal, gTotal);
      
    } else {
      alert(`Please check your inputs in ${validationErrors}`)
    }
  });
}

function new_payment_json(year, month, day,  ampm, servicesFiltered, medicineFiltered, patientID, schedID, sTotal, mTotal, gTotal) {
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
    contentType: 'application/json',
    success: function(data) {
      console.log('success');
      console.log(JSON.stringify(data));
      location.reload(true)
    }
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}

function checkValidationsForSchedule(ampm, service, service2) {
  validationErrors = []
  if(ampm === 'none') {
    $("#ampm").addClass("is-invalid");
    $("#ampm-invalid").addClass("invalid-feedback");
    $("#ampm-invalid").text("Please choose time")
    validationErrors.push('Time')
  }
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

function edit_schedule(event) {

  $(".for-schedule").empty()
  removeTextInForms()
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

  var editThisSchedule = schedule_data.schedules.filter(schedule => schedule._id === event.data.id)
  editThisSchedule = editThisSchedule[0]
  console.log(editThisSchedule)
  appendScheduleFormsWithVal(editThisSchedule)

  var editThisPatient = schedule_data.patients.filter(patient => patient._id == event.data.patient._id)
  editThisPatient = editThisPatient[0]
  $("#flexible-text").text(`Reschedule ${editThisPatient.name}`)
  fillupForm(editThisPatient)

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
    // Time
    var ampm = $("#ampm").val();
    var month = parseInt($("#month").val());
    var dayChoose = parseInt($("#day").val());
    var service = $("#service").val();
    var service2 = $("#service2").val();
    var services = [service, service2]
    var schedID = editThisSchedule._id
    var patientID = event.data.patient._id
    var day = parseInt($(".active-date").html());
    var date = new Date()
    var servicesFiltered = []

    checkValidationsForSchedule(ampm, service, service2)
 
    if(validationErrors.length == 0) {
      console.log(ampm)
      var filteredTime = check_time_of_events_from_edit(dayChoose, month, date.getFullYear(), ampm, schedID)
      if(filteredTime.length != 0) {
        $("#ampm").addClass("is-invalid");
        $("#ampm-invalid").addClass("invalid-feedback");
        $("#ampm-invalid").text("Time is already occupied")
        validationErrors.push('Time')
      }

      console.log(filteredTime)
      
      if(validationErrors.length == 0) {

        // Filter services
        services.forEach(serv => {
          if(serv != 'none'){
            servicesFiltered.push(serv)
          }
        })

        // $("#dialog").hide(250);
        // console.log("new event");
        // update_schedule_json(month, dayChoose, ampm, servicesFiltered, patientID, schedID);
        // date.setDate(day);
        // init_calendar(date);
      } else {
        alert(`Time is already occupied`)
      }
    } else {
      alert(`Please check your inputs in ${validationErrors}`)
    }
  });
}

// Update Schedule
function update_schedule_json(month, day, ampm, services, patientID, schedID){
  var myServices = []
  services.forEach(service => {
    myServices.push(service)
  })

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
    contentType: 'application/json',
    success: function(data) {
      console.log('success');
      console.log(JSON.stringify(data));
      location.reload(true)
    }
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}

// Cancel schedule
function cancel_schedule(event) { 
  const id = event.data.id
  var data = {}
  data.id = id
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

// Checks if a specific date has any events
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

// check if time is already occupied
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

// check if time is already occupied in edit
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



function retrieve_events(day, month, year) {
  $.ajax({
    url: `${host}/schedule/get-schedule-day/${year}/${month}/${day}`,
    type: "GET",
    dataType: "json",
    success: function (data) {
        data.forEach(oneData => {
          schedule_data["schedules"].push(oneData)
        })
    },
    error: function (error) {
        console.log(`Error ${error}`);
    }
  })
}

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



// Register Patient
function new_patient(event) {

  $(".for-schedule").empty()
  enableForms()
  removeTextInForms()

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

      // var patientDetails = [
      //   'name',
      //   'gender',
      //   'address',
      //   'contact_number',
      //   'age',
      //   'nationality',
      //   'occupation',
      //   'reffered_by',
      //   'chief_complainant',
      //   'diagnosis'
      // ]

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

      checkValidationsForPatient(name, age)

      if(validationErrors.length == 0) {
        $("#dialog").hide(250);
        console.log("new event");
        new_register_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions);
        date.setDate(day);
        init_calendar(date);
      } else {
        alert(`Please check your inputs in ${validationErrors}`)
      }
      
  });
}

// Adds a json event to schedule_data
function new_register_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions) {

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
    contentType: 'application/json',
    success: function(data) {
      console.log('success');
      console.log(JSON.stringify(data));
      location.reload(true)
    }
  })
  .then(data => {
    location.reload(true)      
  })
  .catch(err => console.log(err))

  location.reload(true)
}