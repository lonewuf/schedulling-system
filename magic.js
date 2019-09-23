// for(let i = 11; i < 19; i++) {
//   console.log(`$("#t-${i}").val(patient.teeth.t_${i})`)
// }

// for(let i = 21; i < 29; i++) {
//   console.log(`$("#t-${i}").val(patient.teeth.t_${i})`)
// }

// for(let i = 31; i < 39; i++) {
//   console.log(`$("#t-${i}").val(patient.teeth.t_${i})`)
// }

// for(let i = 41; i < 49; i++) {
//   console.log(`$("#t-${i}").val(patient.teeth.t_${i})`)
// }

var medicalHistory = [
  "hypertension",
  "epilepsy",
  "diabetes",
  "kidney_disease",
  "heart_disease",
  "liver_disease",
  "allergy",
  "asthma",
  "others"
]

// $(`input[name='gender'][value="${patient.gender}"]`).prop("checked", true)
// for(let i = 0; i < medicalHistory.length; i++) {
//   console.log(`$(\`input[name='${medicalHistory[i]}'][value="\${patient.${medicalHistory[i]} ? "yes" : "no"}"]\`).prop("checked", true)`)
// }

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

for(let i = 0; i < months.length; i++) {
  console.log(`.append('<option value="${i+1}">${months[i]}</option>')`)
}

var myDate = new Date()
  var numOfDays = new Date(myDate.getFullYear(), 8, 0).getDate()
  console.log(numOfDays)
