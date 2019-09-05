let request = require('request'); 

let apiOptions = {
    server : "http://localhost:3000"
  };

  // Function to load staff
module.exports.staff = function (req, res) {
   let requestOption, path;
   path = '/api/allUsers' ;
   requestOption = {
         url : apiOptions.server + path,
         method : 'GET',
         json : {},
     };

   request (requestOption, function (err, response, body) {
     let data;
     data = body;
     renderAllUsersPage (req, res, data);
   } );
 
};
// Function to create a new user
module.exports.createUser = function(req, res) {
  var requestOption, path, postData;
  path = '/api/createUser';
  postData = {
    user: req.body.user,
    password: req.body.password,
    type: req.body.type,
  };
  console.log(req.params.description);
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
        if (response.statusCode === 201) {
          res.redirect('/staff');
        } else {
          res.render('generic_error', {message: data.message});
        }
      } 
    } catch (errors) {
      console.log( errors);
      res.render('generic_error', {message: errors});
    }
  });
};

// Delete an user
module.exports.deleteUser = function (req, res) {
  let requestOption, path;
  path = '/api/allUsers' ;
  let userId ='/' + req.params.id;
  let myuserId = req.params.id;
  console.log('Method delete user from server:');
  console.log('PATH and userId' + path + userId);
  requestOption = {
        url : apiOptions.server + path + userId,
        method : 'DELETE',
        json : {},
        qs:{ myuserId }
    };

  request(requestOption, function (err, response, body) {
    let data;
    data = body;
    if (response.statusCode == 204) {
      res.redirect('/staff');
    } else {
       console.log('An error occurred at deleteUser');
    }
  });
};

let renderAllUsersPage = function (req, res, responseBody) {
  let message = '';
  if (!(responseBody instanceof Array)) {
    message = 'An error occurred at getting users.';
    responseBody = [];
  } else {
    if (responseBody.length == 0) {
      message = 'No users found';
    } else {
      message = responseBody.length.toString() + ' users found';
    }
  }
  res.render('users', {
    users: responseBody,
    message: message
  });
};

module.exports.loadPageOfAddingUser = function(req, res) {
  res.render('add_user', {});
};

module.exports.loadPageOfChangePassword = function (req, res) {
  let requestOption, path;
  path = '/api/allUsers' ;
  let userId ='/' + req.params.id;
  requestOption = {
        url : apiOptions.server + path + userId,
        method : 'GET',
        json : {}
    };

  request(requestOption, function (err, response, body) {
    let data;
    data = body;
    if (response.statusCode == 200) {
      res.render('change_password', {id: req.params.id, user: data});
    } else {
      res.render('generic_error', {message: body});
    }
  });
};

// Function to change the password of an user
module.exports.changePassword = function (req, res) {
  let requestOption, path;
  path = '/api/changePassword';
  let userId ='/' + req.params.id;
  let myuserId = req.params.id;
  console.log('Method changePassword at staff controller in the server:');
  console.log('id:' + req.params.id);
  console.log('pass:' + req.body.password);
  console.log('new passw:' + req.body.newPassword);
  requestOption = {
        url : apiOptions.server + path,
        method : 'PUT',
        json : {id: myuserId, password: req.body.password, newPassword: req.body.newPassword}
    };

  request(requestOption, function (err, response, body) {
    let data;
    data = body;
    if (response.statusCode == 202) {
      res.render('info', {message: 'Successful change of password'});
    } else {
       console.log('An error occurred at changePassword');
       res.render('generic_error', {message: body});
    }
  });
}
