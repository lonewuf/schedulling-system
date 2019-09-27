// // for(let i = ${i}${i}; i < ${i}9; i++) {
// //   console.log('$("#t-${i}").val(patient.teeth.t_${i})')
// // }

// // for(let i = 2${i}; i < 29; i++) {
// //   console.log('$("#t-${i}").val(patient.teeth.t_${i})')
// // }

// // for(let i = 3${i}; i < 39; i++) {
// //   console.log('$("#t-${i}").val(patient.teeth.t_${i})')
// // }

// // for(let i = 4${i}; i < 49; i++) {
// //   console.log('$("#t-${i}").val(patient.teeth.t_${i})')
// // }

// var medicalHistory = [
//   "hypertension",
//   "epilepsy",
//   "diabetes",
//   "kidney_disease",
//   "heart_disease",
//   "liver_disease",
//   "allergy",
//   "asthma",
//   "others"
// ]

// // $('input[name='gender'][value="${patient.gender}"]').prop("checked", true)
// // for(let i = 0; i < medicalHistory.length; i++) {
// //   console.log('$(\'input[name='${medicalHistory[i]}'][value="\${patient.${medicalHistory[i]} ? "yes" : "no"}"]\').prop("checked", true)')
// // }

// const months = [ 
//   "January", 
//   "February", 
//   "March", 
//   "April", 
//   "May", 
//   "June", 
//   "July", 
//   "August", 
//   "September", 
//   "October", 
//   "November", 
//   "December" 
// ]; 

// // for(let i = 0; i < months.length; i++) {
// //   console.log('.append('<option value="${i+${i}}">${months[i]}</option>')')
// // }

// // var myDate = new Date()
// //   var numOfDays = new Date(myDate.getFullYear(), 8, 0).getDate()
// //   console.log(numOfDays)

// var currTime = '${i}${i}00'

// var schedTime = '${i}300'

// var numOfHours = 2


// var currTimeTo = parseInt(currTime) + (parseInt(numOfHours) * ${i}00)
// var schedTimeTo = parseInt(schedTime) + (parseInt(numOfHours) * ${i}00)

// if((currTime >= schedTime && currTime <= schedTimeTo) || (currTimeTo >= schedTime && currTimeTo <= schedTimeTo)) {
//   console.log(schedTime)
// } else {
//   console.log('No Overlap')
// }

// if(currTime >= schedTime && currTime <= (parseInt(schedTime) + (parseInt(numOfHours) * ${i}00))) {
//   console.log(schedTime, "sss")
// }
// else {
//   console.log('No Overlap', "sss")
// }
// console.log(parseInt(schedTime) + (parseInt(numOfHours) * ${i}00))

// for(let i = 1; i < 7; i++) {
//   console.log(
//     `
//       var medSelectLabel${i} = $('<label for="med${i}">Medicine: </label>')
//       var medQuantityLabel${i} = $('<label for="medQuantity${i}">Quantity: </label>')
//       var medPriceLabel${i} = $('<label for="medPrice${i}">Price: </label>')
//       var medSelect${i} = $('<select id="med${i}" name="med${i}" class="form-control form-control-sm"></select>')
//       var medQuantity${i} = $('<input type="text" id="medQuantity${i}" name="medQuantity${i}" class="form-control form-control-sm" placeholder="Enter quantity">')
//       var medPrice${i} = $('<input type="text" id="medPrice${i}" name="medPrice${i}" class="form-control form-control-sm"  readonly>')
//     `
//   )
// }

// for(let i = 7; i <= 18; i++) {
//   console.log(`var col${i} = $('<div class="col-lg-4"></div>')`
//   )
// }

// for(let i = 6; i <= 18; i++) {
//   console.log(`var form${i} = $('<div class="form-group"></div>')`)
// }

// var counter = 4;
// for(let i = 1; i <= 6; i++) {
//   console.log(`
//     form${counter}.append(medSelectLabel${i}).append(medSelect${i})
//     form${counter+1}.append(medQuantityLabel${i}).append(medQuantity${i})
//     form${counter+2}.append(medPriceLabel${i}).append(medPrice${i})`)
//   counter += 3;
// }

// for(let i = 1; i <= 21; i++) {
//   console.log(`col${i}.append(form${i})`)
// }

// var counter = 4;
// for(let i = 2; i <= 7; i++) {
//   console.log(`row${i}.append(col${counter}).append(col${counter+1}).append(col${counter+2})`)
//   counter += 3;
// }

// var medSelectLabel${i} = $('<label for="med${i}">Medicine: </label>')
//   var medQuantityLabel${i} = $('<label for="medQuantity${i}">Quantity: </label>')
//   var medPriceLabel${i} = $('<label for="medPrice${i}">Price: </label>')
//   var medSelect${i} = $('<select id="med${i}" name="med${i}" class="form-control form-control-sm"></select>')
//   var medQuantity${i} = $('<input type="text" id="medQuantity${i}" name="medQuantity${i}" class="form-control form-control-sm" placeholder="Enter quantity">')
//   var medPrice${i} = $('<input type="text" id="medPrice${i}" name="medPrice${i}" class="form-control form-control-sm"  readonly>')

// for(let i= 1; i <= 6; i++) {
//   console.log(`
//   $("#med${i}").change(function() {
//     var s = $("#med${i}").val()
//     console.log(s)
//     if(s != 'none') {
//       var selectedMed = schedule_data.inventory.filter(med => med._id == s)
//       selectedMed = selectedMed[0]
//       var q = $("#medQuantity${i}").val()
//       if(q != '') {
//         var price = parseInt(selectedMed.price) * parseInt(q);
//         $("#medPrice${i}").val(price)
//       } else {
//         $("#medPrice${i}").val('')
//       }
//     }
//   })
  
//   $("#medQuantity${i}").keyup(function () {
//     var q = $("#medQuantity${i}").val()
//     var rN = /[0-9]/
//     console.log(q)
//     console.log(rN.test(q[q.length-1]))
//     if(q != '') {
//       if(rN.test(q[q.length-1])) {
//         q = $("#medQuantity${i}").val()
//         if(q != '') {
//           var s = $("#med${i}").val()
//           if(s != 'none') {
//             var selectedMed = schedule_data.inventory.filter(med => med._id == s)
//             selectedMed = selectedMed[0]
//             var price = parseInt(selectedMed.price) * parseInt(q);
//             $("#medPrice${i}").val(price)
//           }
//         } else {
//           $("#medPrice${i}").val('')
//         }
//       } else {
//         $("#medQuantity${i}").val(q.slice(0, q.length - 1))
//       } 
//     } else {
//       $("#medPrice${i}").val('')
//     }
//   })
//   `)
// }

for(let i = 38; i >= 31; i--) {
  console.log(`
  <tr>
    <td class="t-${i+10}">${i+10}</td>
    <td class="t-${i+10}"><input type="text" id="t-${i+10}" name="t-${i+10}" class="form-control form-control-sm" value="<%= patient.teeth.t_${i} %>" readonly></td>
    <td class="t-${i}">${i}</td>
    <td class="t-${i}"><input type="text" id="t-${i}" name="t-${i}" class="form-control form-control-sm" value="<%= patient.teeth.t_${i} %>" readonly></td>
  </tr>
  `)
}