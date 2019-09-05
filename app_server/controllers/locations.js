let request = require('request'); 

let apiOptions = {
    server : "http://localhost:3000"
  };

   // Function to load all locations
module.exports.locations = function(req, res) {
    var requestOption, path;
    path = '/api/locations' ;
    requestOption = {
          url : apiOptions.server + path,
          method : 'GET',
          json : {},
      };
 
    request (requestOption, function (err,response,body) {
      var data;
      data = body;
      renderLocationsPage (req, res, data);
    } );
 };

 // Function to create a location
 module.exports.createLocation = function(req, res){
   var requestOption, path, postData;
   path = '/api/addLocation';
   postData = {
     name: req.body.name
   };
   requestOption = {
         url : apiOptions.server + path,
         method:'POST',
         json: postData
     };
 
   request (requestOption, function (err, response, body) {
     try {
       if (!err) { 
         let data;
         data = body;
         if (response.statusCode == 201) {
           res.redirect('/locations');
         } else {
            res.render('generic_error', body);
         }
       } else {
           res.render('generic_error', response);
       }  
     } catch (errors) {
       console.log( errors);
       res.render('generic_error', errors);
     }
   });
 };
 
 // Delete a location
 module.exports.removeLocation = function(req, res){
   let requestOption, path;
   path = '/api/removeLocation' ;
   let locationid ='/' + req.params.id;
   let mylocationid = req.params.id
   requestOption = {
         url : apiOptions.server + path + locationid,
         method : 'DELETE',
         json : {},
         qs:{ mylocationid }
     };
 
   request(requestOption, function(err,response,body){
     let data;
     data = body;
     if(response.statusCode == 204){
       res.redirect('/locations');
     }else{
        console.log("An error occured at removing a location");
        res.render('generic_error', response);
     }
   });
 };

 module.exports.loadAddLocation = function (req, res) {
     res.render('add_location', {});
 }

 let renderLocationsPage = function (req, res, responseBody) {
    let message = '';
    if (!(responseBody instanceof Array)) {
      message = 'Ha ocurrido un error.';
      responseBody = [];
    } else {
      if (responseBody.length == 0) {
        message = 'No existen sitios';
      } else {
        message = responseBody.length.toString() + ' sitios encontrados';
      }
    }
    res.render('locations', {
      locations: responseBody,
      message: message
    });
  };