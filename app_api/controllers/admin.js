let mongoose = require('mongoose');
let User = mongoose.model('User');
const bcrypt = require('bcrypt');

// Function to send the response in an JSON object
let sendJSONresponse = function(res, status, content) {
    console.log(content);
    res.status(status).json(content); 
    };

// Function to read all users
module.exports.readAllUsers = async function(req, res) {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
      User
       .find({})
       .exec( function (err, users) {
        if (!err) {
          sendJSONresponse(res, 200, users);
        }
       });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at readAllUsers', error: errors});
  }
};

let getUserById = async function (id) {
try {
  const user = await User.findById(id).exec();
  return user;
} catch (errors) {
  console.log('An error occurred at getUserById');
  console.log(errors);
  return null;
}
}

module.exports.getUser = async function (req, res) {
 try {
   const user = await getUserById(req.params.id);
   if (user == null) {
     sendJSONresponse(res, 500, {message: 'An error ocurred at getUser. The user obtained is null.'});
   } else {
     sendJSONresponse(res, 200, user);
   }
 } catch (errors) {
   console.log('An error occurred at getUser');
   sendJSONresponse(res, 500, errors);
 }
};

// Function to create a new user
module.exports.createUser = async function(req, res) {
  try {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods','GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH');
    User
    .find({user: req.body.user})
    .exec( function (err, matches) {
      if (!err) {
        if (matches.length == 0) {
          bcrypt.hash(req.body.password, 10, function (errBcrypt, hash) {
            if (errBcrypt) {
              sendJSONresponse(res, 500, {message: 'An error happened at trying to encrypt the password at createUser'});
            }else {
              User.create({
                user: req.body.user,
                password: hash, 
                type: req.body.type
              }, function(errCreatingUser, userCreated) {
                if (errCreatingUser) {
                  sendJSONresponse(res, 500, {message: 'An error occurred at createUser'});
                } else {
                  sendJSONresponse(res, 201, userCreated);
                }
              });
            }
          });
        } else {
          sendJSONresponse(res, 404, {message: 'User already exists!'});
        }
      } else {
        sendJSONresponse(res, 500, {error: errors, message: 'An error occurred at createUser'});
      }
    });
  } catch (errors) {
    console.log ('An error occurred at createUser');
    sendJSONresponse(res, 500, {error: errors, message: 'An error occurred at createUser'});
  }
}

// Function to login a user
module.exports.login = async function(req, res) {
  User
  .find({user: req.body.user})
  .exec(function(errFindUser, users){
    if (errFindUser){
      console.log('An error occurred at login');
      const errAtFindUser = {responseCode: 500, message: 'An error occurred at login', loginSuccessful: false};
      sendJSONresponse(res, 500, errAtFindUser);
    } else {
      if (users.length == 0){
        const invalidUser = {responseCode: 401, message: 'Check username!', loginSuccessful: false};
        sendJSONresponse(res, 401, invalidUser);
      } else {
        const hashedPassword = users[0].password;
        const match = bcrypt.compareSync(req.body.password, hashedPassword);
        if (match) {
          // const loginSuccessful = {responseCode: 201, message: 'Login successful', loginSuccessful: true};
          sendJSONresponse(res, 204, null);
        } else {
          const invalidPassword = {responseCode: 401, message: 'Check your password!', loginSuccessful: false};
          sendJSONresponse(res, 401, invalidPassword);
        }
      }
    }
  });
}

module.exports.loginAsAdmin = async function(req, res) {
  User
  .find({user: req.body.user, type: "m"})
  .exec(function(errFindUser, users){
    if (errFindUser){
      console.log('An error occurred at login');
      const errAtFindUser = {responseCode: 500, message: 'An error occurred at login', loginSuccessful: false};
      sendJSONresponse(res, 500, errAtFindUser);
    } else {
      if (users.length == 0){
        const invalidUser = {responseCode: 401, message: 'Check username!', loginSuccessful: false};
        sendJSONresponse(res, 401, invalidUser);
      } else {
        const hashedPassword = users[0].password;
        const match = bcrypt.compareSync(req.body.password, hashedPassword);
        if (match) {
          // const loginSuccessful = {responseCode: 201, message: 'Login successful', loginSuccessful: true};
          sendJSONresponse(res, 204, null);
        } else {
          const invalidPassword = {responseCode: 401, message: 'Check your password!', loginSuccessful: false};
          sendJSONresponse(res, 401, invalidPassword);
        }
      }
    }
  });
}

let deleteUserById = async function (id) {
  await User
       .findByIdAndRemove(id)
       .exec( async function(err, user) {
            if (err) {
              return  err;
            } else {
            console.log("User: " + id + " deleted");
            return user;
            }
          });
}

// Function to delete an user
 module.exports.deleteUser = async function(req, res) {
   try {
    let id = req.params.id;
    if (id != undefined) {
      await User
       .findByIdAndRemove(id)
       .exec( async function(err, user) {
            if (err) {
              sendJSONresponse(res, 500, err);
            } else {
            const deleted = await user;
            sendJSONresponse(res, 204, {message: 'User ' + id + '  deleted.', user: deleted});
            }
          });        
    } else {
      sendJSONresponse(res, 404, {
      "message": "No id"
      });
    }
   } catch (errors) {
     sendJSONresponse(res, 500, {message: 'An error occurred at deleteUser', error: errors})
   }
 };

 // Function to change the password of an user
 module.exports.changePassword = async function (req, res) {
   try {
     User
     .findById(req.body.id)
     .exec( function (err, userFound) {
       if (!err) {
         let passwordEntered = req.body.password;
         console.log('Method change password in the API:');
         console.log('password enttered: ' + passwordEntered);
         bcrypt.compare(passwordEntered, userFound.password, function (errAtComparingPasswords, validPasswordEntered) {
           if (! errAtComparingPasswords) {
             if (validPasswordEntered) {
               let newPassword = req.body.newPassword;
               if (newPassword.length > 0) {
                 bcrypt.hash(newPassword, 10, function (errCreatingHash, hash) {
                   if (errCreatingHash) {
                     sendJSONresponse(res, 500, {message: 'An error ocurred at changePassword', error: errCreatingHash});
                   } else {
                     userFound.password = hash;
                     userFound.save();
                     sendJSONresponse(res, 202, {message: 'Change of password performed'});
                   }
                 });
               } else {
                 sendJSONresponse(res, 404, {message: 'The  new password can not be empty'});
               }
             } else {
               sendJSONresponse(res, 404, {message: 'Invalid old password entered!'});
             }
           } else {
             sendJSONresponse(res, 500, {message: 'An error occurred at change password.', error: errAtComparingPasswords});
           }
         });
       } else {
         sendJSONresponse(res, 500, {message: 'An error occurred at changePassword', error: err});
       }
     });
   } catch (errors) {
     sendJSONresponse(res, 500, {message: 'An error occurred at changePassword', error: errors});
   }
 };