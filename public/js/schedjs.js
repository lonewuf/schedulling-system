// Setup the calendar with the current date
const host = 'http://localhost:3000';

var schedule_data = {
  "schedules": [], 
  "patients": []
};

var allPatients = []

$(document).ready(function(){ 
  var date = new Date();
  var today = date.getDate();
  
  // Set click handlers for DOM elements
  $(".right-button").click({date: date}, next_year);
  $(".left-button").click({date: date}, prev_year);
  $(".month").click({date: date}, month_click);
  $("#add-patientWithSched").click({date: date}, new_regis);
  $("#add-schedule").click({date: date}, new_schedule);
  $("#add-patient").click({date: date}, new_patient);
  $("#search-patient").keyup({date: date}, search_patient)
  // Set current month as active
  $(".months-row").children().eq(date.getMonth()).addClass("active-month");
  
  // pause(5000)
  init_events()
  // init_patients()
  console.log(schedule_data["schedules"])
  console.log(schedule_data["patients"])
  init_calendar(date)
  setTimeout(function(){

    $(".right-button").click();


  },1000);
  setTimeout(function(){

    $(".left-button").click();


  },500);

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
        // data.scheduleData.forEach(oneData => {
        //   schedule_data["schedules"].push(oneData)
        // })
        console.log(data)
        schedule_data["schedules"] = data.scheduleData
        // data.patientData.forEach(oneData => {
        //   schedule_data["patients"].push(oneData)
        // })
        schedule_data["patients"] = data.patientData
        allPatients = schedule_data["patients"];
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
    // Basic form validation
  //   if(name.length === 0) {
  //       $("#name").addClass("error-input");
  //   }
  // //   else if(isNaN(count)) {
  // //       $("#count").addClass("error-input");
  // //   }
    // else {
        var patientID = event.data.id
        var day = parseInt($(".active-date").html());

        $("#dialog").hide(250);
        console.log("update patient");
        update_patient_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions, patientID);
        date.setDate(day);
        init_calendar(date);
  //   }
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
    var day = parseInt($(".active-date").html());
    // Basic form validation

  //   if(name.length === 0) {
  //       $("#name").addClass("error-input");
  //   }
  // //   else if(isNaN(count)) {
  // //       $("#count").addClass("error-input");
  // //   }
    // else {
    $("#dialog").hide(250);
    console.log("new event");
    schedule_patient_json(date, day, ampm, services, patientID);
    date.setDate(day);
    init_calendar(date);
//   }
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
  var select5 = $(`<select id="day" name="ampm" class="form-control form-control-sm"></select>`)
  var select4 = $(`<select id="month" name="service" class="form-control form-control-sm">`)

  

  // Appending option tag for time
  select1.append(`<option value="none">Choose Time<option>`)             
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
          .append(`<option value="12-00-AM">12:00 PM</option>`)
          .append(`<option value="12-15-AM">12:15 PM</option>`)
          .append(`<option value="12-45-AM">12:45 PM</option>`)
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
        .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
        .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
        .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
        .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
        .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
        .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
        .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
        .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
        .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
        .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
        .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  // Appending all option tag for service2
  select3.append(`<option value="none">Select Service</option>`)
        .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
        .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
        .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
        .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
        .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
        .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
        .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
        .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
        .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
        .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
        .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

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

  form1.append(label1).append(select1)
  form2.append(label2).append(select2)
  form3.append(label3).append(select3)
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

  $("#ampm").val(event.ampm)
  $("#service").val(event.serviceSimple[0])
  $("#service2").val(event.serviceSimple[1])
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
  select1.append(`<option value="none">Choose Time<option>`)             
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
          .append(`<option value="12-00-AM">12:00 PM</option>`)
          .append(`<option value="12-15-AM">12:15 PM</option>`)
          .append(`<option value="12-45-AM">12:45 PM</option>`)
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
        .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
        .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
        .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
        .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
        .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
        .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
        .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
        .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
        .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
        .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
        .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  // Appending all option tag for service2
  select3.append(`<option value="none">Select Service</option>`)
        .append(`<option value="bunot_regular">Bunot(Regular) &#8369;500</option>`)
        .append(`<option value="bunot_odontectomy">Bunot(Odontectomy) &#8369;6000 - &#8369;8000</option>`)
        .append(`<option value="pasta">Pasta(Restoration) &#8369;800</option>`)
        .append(`<option value="linis">Linis(Oral Propelaxis) &#8369;800</option>`)
        .append(`<option value="brace">Brace(Taas Baba) &#8369;45000</option>`)
        .append(`<option value="brace_adjustment">Brace Adjustment &#8369;1000</option>`)
        .append(`<option value="denture_simple">Denture(Simple "3 teeth") &#8369;3500</option>`)
        .append(`<option value="denture_all">Denture(Taas Baba) &#8369;10000</option>`)
        .append(`<option value="root_canal_treatment">Root Canal Treatment &#8369;4000</option>`)
        .append(`<option value="tooth_whitening">Tooth Whitening(7 Sessions "1 week") &#8369;15000</option>`)
        .append(`<option value="retainer_simple">Retainer(Simple "3 teeth") &#8369;3500</option>`)

  form1.append(label1).append(select1)
  form2.append(label2).append(select2)
  form3.append(label3).append(select3)

  col1.append(form1)
  col2.append(form2)
  col3.append(form3)

  row.append(col1).append(col2).append(col3)

  $(".for-schedule").append(row)
}

function new_regis(event) {

  $(".for-schedule").empty()
  appendScheduleForms()
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

      var day = parseInt($(".active-date").html());
      // Basic form validation
      console.log(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions)
    //   if(name.length === 0) {
    //       $("#name").addClass("error-input");
    //   }
    // //   else if(isNaN(count)) {
    // //       $("#count").addClass("error-input");
    // //   }
      // else {
          $("#dialog").hide(250);
          console.log("new event");
          new_register_and_schedule_json(date, day, ampm, patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions,services);
          date.setDate(day);
          init_calendar(date);
    //   }
  });
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
        to_ampm = (parseInt(a[0]) + 2 ) >= 12 ? 'PM' : 'AM'
        if((parseInt(a[0]) + 2 ) == 13) {
          to_hours = '1'
        } else if ((parseInt(a[0]) + 2 ) == 14) {
          to_hours = '2'
        } else {
          to_hours = parseInt(a[0]) + 2
        }
        // Handle services
        var services = event.serviceSimple.join(',')
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

        var event_card_title = $(`<h4 class='card-title'>Time: ${a[0]}:${a[1]} ${a[2]} - ${to_hours}:${to_minutes} ${to_ampm}</h4>`);
        var event_card_contact_number = $(`<p class='card-text'>Contact Number: ${event.patient.contact_number}</p>`);
        var event_card_time = $(`<p class='card-text'>Age: ${event.patient.age}</p>`);
        var event_card_services = $(`<p class='card-text'>Services: ${services}</p>`);
        var event_card_payment =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-success" id="${event._id}-payment-schedule" href="#">Payment</strong></div>`);
        var event_card_edit =  $(`<div class='card-text mb-3'><strong><a class="btn btn-sm btn-warning" id="${event._id}-edit-schedule" href="#">Edit Schedule</strong></div>`);
        var event_card_cancel = $(`<div class='card-text'><strong><a class="btn btn-sm btn-danger" id="${event._id}-cancel" href="#">Cancel</strong></div>`);



        if(event.cancelled != true) {
          
        
          // $(event_card).append(event_name).append(event_contact_number).append(event_time).append(event_name1).append(event_name2).append(event_name3).append(event_name4).append(cancel_button);
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

function payment_schedule() {

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
    console.log('click me')
    // Time
    var ampm = $("#ampm").val();
    var month = $("#month").val();
    var dayChoose = $("#day").val();
    var service = $("#service").val();
    var service2 = $("#service2").val();
    var services = [service, service2]
    console.log(services)
    var schedID = editThisSchedule._id
    var patientID = event.data.patient._id
    var day = parseInt($(".active-date").html());
    // Basic form validation

  //   if(name.length === 0) {
  //       $("#name").addClass("error-input");
  //   }
  // //   else if(isNaN(count)) {
  // //       $("#count").addClass("error-input");
  // //   }
    // else {
    $("#dialog").hide(250);
    console.log("new event");
    update_schedule_json(month, dayChoose, ampm, services, patientID, schedID);
    date.setDate(day);
    init_calendar(date);
//   }
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
      if(event["day"]===day &&
          event["month"]===month &&
          event["year"]===year) {
            console.log()
              events.push(event);
          }
  }
  return events;
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
      // Basic form validation
    //   if(name.length === 0) {
    //       $("#name").addClass("error-input");
    //   }
    // //   else if(isNaN(count)) {
    // //       $("#count").addClass("error-input");
    // //   }
      // else {
          $("#dialog").hide(250);
          console.log("new event");
          new_register_json(patientDetails, teethComments, medicalHistory, treatment_planning, oralConditions);
          date.setDate(day);
          init_calendar(date);
    //   }
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