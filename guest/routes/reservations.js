const express = require('express');
const router = express.Router();
const moment = require('moment');

let ReservationFromModel = require('../models/reservation');

let UserFromModel = require('../models/user');


let RoomFromModel = require('../models/room');



// Add Route
// Add ensureAuthenticated as a 2nd parameter to protect the add route for logged in users only
router.get('/add', ensureAuthenticated, function(req, res){
  res.render('add_reservation', {
    title: 'Add Reservation'
  });
});

router.get('/users/logout', ensureAuthenticated, function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});


router.get('/amenities', function(req, res){

  res.redirect('/amenities');
});

// Add Sumbit POST route
router.post('/add', function(req, res){
  //req.checkBody('roomNum', 'Room Number is required').notEmpty();
  req.checkBody('roomstyle', 'roomstyle is required').notEmpty();
  //req.checkBody('guest', 'Guest is required').notEmpty();
  req.checkBody('startDate', 'Start Date is required').notEmpty();
  req.checkBody('endDate', 'End Date is required').notEmpty();



  // Get Errors
    let errors = req.validationErrors();

    if(errors){
       res.render('add_reservation', {
       title: 'Add Reservation',
       errors: errors
       });
     } else {

       let reservation = ReservationFromModel();
       reservation.roomstyle = req.body.roomstyle;
       reservation.guest = req.user._id;
      // reservation.guest = req.user.name;
       reservation.startDate = req.body.startDate;
       reservation.endDate = req.body.endDate;
       reservation.checkInOutStatus = "Awaiting Check In";


         RoomFromModel.findOneAndUpdate({
               roomstyle: req.body.roomstyle,
               reserved: {
                   //Check if any of the dates the room has been reserved for overlap with the requsted dates
                   $not: {
                   //  $elemMatch: {from: {$lt: "2017-04-22"}, to: {$gt: "2017-04-20"}}

                 $elemMatch: {from: {$lt: req.body.endDate}, to: {$gt: req.body.startDate}}
                 } // not
               } //reserved

           }, {$push : {"reserved" : {from: req.body.startDate, to: req.body.endDate}}}, function(err, room){
               if(err){
                   res.send(err);
               } else {

                 if(room == null){
                   req.flash('danger', 'Your specified room and reservation dates are not available.');
                   res.redirect('/reservations/add');
                 } else{

                   //console.log(room._id);
                   console.log('Room Num: ' + room.room_number);



                   reservation.roomNum = room.room_number;

                   reservation.save(function(err){
                     if(err){
                       console.log(err);
                       return;
                     } else {



                       req.flash('success', 'Reservation added');
                  //   res.redirect('/');
                   //res.render('checkYourRsvp');
                   res.redirect('/reservations/checkYourReservation');
                 } // else
               }); // reservation.save(func..)

           } // else


     }

    }); // end of find
  }
});



// Room route
router.get('/checkYourReservation', ensureAuthenticated, function(req,res){


  //console.log('777');
  //console.log(req.user.name);
   ReservationFromModel.
   find({guest: req.user}).
   sort([['startDate', 'ascending']]).
   populate('user').exec(function(err, reservationsVar){ //
      if(err){
        console.log(err);
      } else {

      //  console.log(req.user.username);

        res.render('checkYourRsvp', {
          title: 'Your Rooms Reserved',
          reservations: reservationsVar,
          guestName: req.user.username
        });
    }
  });

});



// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, function(req, res){ // colon is placeholder of anything. anything in this case, is the id.
    ReservationFromModel.findById(req.params.id, function(err, reservationResponse){

        if(reservationResponse.guest != req.user._id){ // put one underscore, not two underscores
          req.flash('danger', 'Not Authorized');
          res.redirect('/');
        }

        res.render('edit_reservation', {
        reservation: reservationResponse,
        // edit_reservation.pug from view has a title, so we need to pass in a title
        title: 'Edit Reservation'
      });
    });
});


// Update Sumbit POST route
router.post('/edit/:id', function(req, res){
  // Not creating a new reservation, so set reservation to an empty object
  let reservation = {};

  reservation.roomstyle = req.body.roomstyle;
  reservation.guest = req.body.guest;
  reservation.startDate = req.body.startDate;
  reservation.endDate = req.body.endDate;

  // create a query to specify which reservation we would like to update
  let query =  {_id: req.params.id}

  // instead of using the reservation variable a few lines above, we're gonna use the model
  ReservationFromModel.update(query, reservation, function(err){  // pass in the query, and the data, which is the object in the reservation variable
    if(err){
      console.log(err);
      return;
    } else {
      req.flash('success', 'Reservation updated');
      res.redirect('/');
    }
  });
});

// We want to delete a reservation. We want to make a delete request, we can't do that with a single link nor submitting a single form.
// We can only do get and post. So we need to do an AJAX. Use jquery then make simple delete request with AJAX to the delete route
// First, we will create out delete button in reservation.pug. Grab the delete reservation class with jquery. Then we can make our request.
// The file we're gonna use is gonna be in the public folder. Create new folder js in public folder. Then create a new file called main.js, this is basically the client-side javascript file.


router.delete('/:id', function(req, res){
  // AJAX for delete
  if(!req.user._id){
     res.status(500).send();
  }

  let query = {_id: req.params.id}

   ReservationFromModel.findById(req.params.id, function(err, reservation){
       if(reservation.guest != req.user._id){
           res.status(500).send();
       } else {
           ReservationFromModel.remove(query, function(err){
             if(err){
               console.log(err);
             } else {
               // Since we made a request that main.js script, we need to send back a response.
               // So do res.send(), which sends 200 by default, meaning everything is okay.
               res.send('Success');
             }
           });
      }
  });
});


router.post('/deleteRSVP', function(req, res){
  console.log("77d9");


ReservationFromModel.findById(req.body, function(e, docs){

  RoomFromModel.findOneAndUpdate(

    {
    room_number: docs.roomNum,
    reserved: {
      $elemMatch: {from: docs.startDate, to: docs.endDate}
    }
  }, {$pull: {"reserved" : {from: docs.startDate, to: docs.endDate}}}, function(e, room){
    //console.log(docs);
  //  res.json(room);
  ReservationFromModel.deleteOne(req.body, function(e, docs){
  });


  });


});


res.redirect('/reservations/delete_RSVP_Helper');

});

router.get('reservations/delete_RSVP_Helper', function(req, res){
  req.flash('success', 'Reservation cancelled');
  res.redirect('/reservations/checkYourReservation');
});

router.get('/delete_RSVP_Helper', function(req, res){
  req.flash('success', 'Reservation cancelled');
  res.redirect('/reservations/checkYourReservation');
});


/*
// Get Single Reservation
router.get('/:id', function(req, res){ // colon is placeholder of anything. anything in this case, is the id.
    ReservationFromModel.findById(req.params.id, function(err, reservationResponse){
      UserFromModel.findById(reservationResponse.guest, function(err, user){
         res.render('reservation', {
              reservation: reservationResponse,
               guest: user.name,
         });
      });
    });
});

*/






// access control

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){ // we can call req.isAuthenticated() because of passport middleware
    return next();
  } else{
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}


module.exports = router;
