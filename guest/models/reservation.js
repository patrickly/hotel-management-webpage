let mongoose = require('mongoose');
let moment = require('moment');

var Schema = mongoose.Schema;

// Reservation Schema
let reservationSchema = mongoose.Schema({
  roomstyle: {
    type: String,
    required: true
  },
  guest: {
    type: Schema.ObjectId, ref: 'User',
    required: true
  },
  startDate: {
    type: String,
    required: true
  },
  endDate: {
    type: String,
    required: true
  },
  roomNum: {
    type: Number,
    required: false
  },
  processed: {
    type: String,
    required: false
  },
  checkInOutStatus: {
    type: String,
    required: false
  }

});



let Reservation = module.exports = mongoose.model('Reservation', reservationSchema);
