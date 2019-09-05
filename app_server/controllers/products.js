let request = require('request'); 

let apiOptions = {
    server : "http://localhost:3000"
  };

  // Function to load all products
module.exports.products = function(req, res) {
   var requestOption, path;
   path = '/api/productsNotDeleted' ;
   requestOption = {
         url : apiOptions.server + path,
         method : 'GET',
         json : {},
     };

   request (requestOption, function (err,response,body) {
     var data;
     data = body;
     renderProductsPage (req, res, data);
   } );
 
};
// Function to create a product
module.exports.createProduct = function(req, res){
  var requestOption, path, postData;
  path = '/api/products' ;
  postData ={
    description: req.body.description,
    price: parseFloat(req.body.price),
    cost: parseFloat(req.body.cost),
    type: req.body.type,
    name: req.body.name
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
          res.redirect('/products');
        }
      } 
    } catch (errors) {
      console.log( errors);
    }
  });

};

// Delete a product
module.exports.deleteProduct = function (req, res){
  let requestOption, path;
  path = '/api/removeProduct' ;
  let productid ='/' + req.params.id;
  requestOption = {
        url : apiOptions.server + path + productid,
        method : 'PUT',
        json : {}
    };
  request(requestOption, function(err,response,body){
    var data;
    data = body;
    if(response.statusCode == 204){
      res.redirect('/products');
    }else{
       res.render('generic_error', body)
    }
  });
};

let renderProductsPage = function (req, res, responseBody) {
    let message = '';
    if (!(responseBody instanceof Array)) {
      message = 'An error occurred at getting products.';
      responseBody = [];
    } else {
      if (responseBody.length == 0) {
        message = 'No products found';
      } else {
        message = responseBody.length.toString() + ' products found';
      }
    }
    res.render('products', {
      products: responseBody,
      message: message
    });
  };

  module.exports.loadUpdateProduct = function (req, res) {
    let requestOption, path;
    path = '/api/products';
    let productId ='/' + req.params.id;
    requestOption = {
          url : apiOptions.server + path + productId,
          method : 'GET',
          json : {}
      };
  
    request(requestOption, function (err, response, body) {
      let data;
      data = body;
      if (response.statusCode == 200) {
        res.render('update_product', {id: req.params.id, product: data});
      } else {
         res.render('generic_error', {message: body});
      }
    });
  };

  module.exports.updateProduct = function (req, res) {
    let requestOption, path;
  path = '/api/updateProduct';
  let userId ='/' + req.params.id;
  let myuserId = req.params.id;
  requestOption = {
        url : apiOptions.server + path + userId,
        method : 'PUT',
        json : {id: myuserId, price: req.body.price, cost: req.body.cost}
    };

  request(requestOption, function (err, response, body) {
    let data;
    data = body;
    if (response.statusCode == 204) {
      res.render('info', {message: 'Successful update of product'});
    } else {
       res.render('generic_error', {message: body});
    }
  });
  };
