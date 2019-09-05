let mongoose = require('mongoose');
let Product = mongoose.model('Product');
let Request = mongoose.model('Request');
let Fact_Request = mongoose.model('Fact_request');
let Fact_Sold_Product = mongoose.model('Fact_sold_product');
let Fact_ComplaintsAndClaims = mongoose.model('Fact_complaints_and_claims');
let ComplaintsAndClaims = mongoose.model('ComplaintsAndClaims');
let utils = require('./utils'); 
// import moment from 'moment';
let moment = require('moment');
let finances = require('./finances');
let Fact_Finances = mongoose.model('Fact_finance');
let Location = mongoose.model('Location');


// Function to send the response in an JSON object
var sendJSONresponse = function(res, status, content) {
  try {
    res.set('Access-Control-Allow-Origin', '*');  
    console.log('Displaying content in JSON response:')
    console.log(content);
    res.status(status).json(content); 
  } catch (errors) {
    console.log(errors);
  }
 
  };

/* Function to get the summary of the opened order
  @param idOfOrder. The id of the order
  @param products. The ids of the products from the order
  @param origin. The origin of the order
*/
let getSummaryOfOpenedOrder = async function (idOfOrder, products, origin) {
  try {
    Fact_Request
  .findById(idOfOrder)
  .exec( async function(err, order) {
    if (err) {
      console.log('An error occurred at getSummaryOfOpenedOrder.!!!!!!');
    } else {
      const descriptionOfProductsAndAmount =  await getAmountAndDescriptionsOfProducts(products);
      const result = {_id: idOfOrder, origin: origin, amount: descriptionOfProductsAndAmount.amount, products: descriptionOfProductsAndAmount.products};
      return result;
    }
  }
  );
  } catch (errors) {
    console.log(errors);
  }
}

/* Function to get the amount of prices and the products.
  @param products. An array of ids of product
  @param idOfOrder. The id of the order
  @param originOfOrder: The origin of the order
*/ 
let getAmountAndDescriptionsOfProducts = async function (products, idOfOrder, originOfOrder) {
 console.log('Method getAmountAndDescriptionsOfProducts: >>>');
 console.log('_____products:');
 console.log(products);
 console.log('______id:');
 console.log(idOfOrder);
 console.log('________origin:');
 console.log(originOfOrder);
 let amountValue = 0;
 let productsArray = new Array();
 let promises = new Array();
 let result = {amount: amountValue, products: productsArray, _id: idOfOrder, origin: originOfOrder};
 for (let i = 0; i < products.length; i++) {
   try {
    const currentProduct = await Product.findById(products[i]).exec();
    result.amount += currentProduct.price;
    productsArray.push(currentProduct);
   } catch (errors) {
     console.log('Error occurred at getAmonuntAndDescriptionsOfProducts!!!');
     console.log(errors);
   }
 }
return result;
}

let readProducts = async function(req, res) {
   Product 
    .find({})
    .exec(function (err, products) {
      if (err) {
        sendJSONresponse(res, 500, {err: err})
      } else {
        sendJSONresponse(res, 200, products);
      }
    }
  );
}

let waitForProcess = async function () {
  setTimeout(function(){
    console.log('Processing...');
  }, 1000);
}

/* Function to check if a product exists in a list of products 
   @param idOfProduct The id of the product to find
   @param products the list of products
*/
let existsProduct = async function (idOfProduct, products) {
  try {
    console.log('Method existsProduct:');
  console.log('idOfProduct: ' + idOfProduct);
  console.log('products:');
  console.log(products);
  let result = {exists: false, product: {}};
  let i = 0;
  while (i < products.length && result.exists === false) {
    let currentIdOfProduct = products[i]._id.toString();
    console.log("i: " + i.toString() + " _id: " +  currentIdOfProduct);
    let isTheProductSearched = (currentIdOfProduct == idOfProduct);
    console.log('Product searched: ' + idOfProduct + ' Current Product: ' + currentIdOfProduct + ' Are the same: ' + isTheProductSearched);
    if (isTheProductSearched) {
      result.exists = true;
      const dataOfProduct = {_id: products[i]._id.toString(), name: products[i].name, price: products[i].price, description: products[i].description, type: products[i].type};
      result.product = dataOfProduct;
    } else {
      i++;
    }
  }
  console.log('result:');
  console.log(result);
  console.log('End of method existsProduct>>>');
  return result;
  } catch (errors) {
    console.log(errors);
  }
}

// Function to update all the products from a closed request
var updateProductsFromClosedRequest = async function(requestId, res) {
  console.log('Measuring time of updateProductsFromClosedRequest ->:');
  console.time('Time of updateProductsFromClosedRequest: ');
   await Request
   .findById(requestId)
   .exec(function (err, requestFounded) {
    if (err) 
    {
      console.log('An error occurred at updateProductsFromClosedRequest.');
     //  throw new Error('An error occurred at updateProductsFromClosedRequest');
     sendJSONresponse(res, 500, err);
    } else {
      console.log('Array of products related to requestId: ' + requestId);
      console.log(requestFounded.products);
      // Get the date
       Fact_Request
      .find({request_id: requestId})
      .exec(function(err, factRequestFounded){
        if (err) {
          // throw new Error('An error occurred at getting the date of the request!');
          console.log('An error occurred at getting the date of the request!');
          sendJSONresponse(res, 500, err);
        } else {
          if (factRequestFounded.length != 1) {
           // throw new Error('Zero or more than one request_id related to FactRequest. Error at getting the date of the request.');
           console.log('Zero or more than one request_id related to FactRequest. Error at getting the date of the request.');
           sendJSONresponse(res, 500, 'Zero or more than one request_id related to FactRequest. Error at getting the date of the request.');
          } else {
            const date = factRequestFounded[0].date;
            const products = requestFounded.products;
            let i = 0;
            for (i = 0; i < products.length; i++){
              addSoldProduct(date, products[i]);
            }
            finances.updateFinances(date, products, requestId, res);
          }
        }
      });
      
      
    }
  });
  
  console.timeEnd('Time of updateProductsFromClosedRequest: ');
} 

// Function to set the state to close in the request specified
var updateStateToCloseInRequest = async function(requestId, res) {
  Request
  .findById(requestId)
  .exec(function(err, requestFounded){
    if (err){
      // throw new Error('An error occurred at updateStateToCloseInRequest');
      sendJSONresponse(res, 500, err);
    } else {
      requestFounded.state='closed';
      requestFounded.save();
      sendJSONresponse(res, 200, requestFounded);
    }
  });
}

// Function to set the state to close in the FactRequest with request_id specified 
 module.exports.updateStateToCloseInFactRequest = async function(requestId, res) {
   console.log('Method: updateStateToCloseInFactRequest --> param requestId: ' + requestId);
  Fact_Request
  .find({request_id: requestId})
  .exec(function(err, factsFounded){
    if (err){
      sendJSONresponse(res, 500, err);
    } else {
      if (factsFounded.length != 1){
       sendJSONresponse(res, 500, 'Zero or more than one facts associated to the same request_id in updateStateToCloseInFactRequest');
      } else {
        factsFounded[0].state = 'closed';
        factsFounded[0].save();
       updateStateToCloseInRequest(requestId, res);
        console.log('End of method: updateStateToCloseInFactRequest-->');
      }
    }
  });
}

// Function to add a sold product
var addSoldProduct = async function(date, productId) {
  Fact_Sold_Product
  .find({date: date, product_id: productId })
  .exec(async function(err, factSoldProductFounded){
    if (err) {
      throw new Error('An error occurred at addSoldProduct');
    } else {
      if (factSoldProductFounded.length > 1) {
        throw new Error('More than one product_id and date pair founded. Error at addSoldProduct');
      } else {
        if (factSoldProductFounded.length == 0) {
          createFactSoldProduct(date, productId);
        }else{
          factSoldProductFounded[0].count += 1;
          await factSoldProductFounded[0].save();
        }
      }
    }
  });
}

let addRecordOfSoldProductInFinances = async function(date, productId) {
  try {
    Product
    .findById(productId)
    .exec(function (err, product) {
      Fact_Finances
      .find({date: date})
      .exec(async function (errInFinances, currentFinances){
         await Fact_Finances.create({
            date: date,
            income: product.price,
            cost: product.cost,
            balance: (product.price - product.cost)
          }, function(errCreationOfFactOfFinance, financeFactCreated) {
            if (errCreationOfFactOfFinance) {
              console.log('An error occurred at creation of fact of finance:');
              console.log(errCreationOfFactOfFinance);
            } else {
              console.log('A finance fact was created:');
              console.log(financeFactCreated);
            }
          });
      });
    });
  } catch (errors) {
    console.log(errors);
  }
}

// Function to create a new fact of sold product
var createFactSoldProduct = async function(dateP, productId){
  console.log('Method createFactSoldProduct -> Param date: ' + dateP + ' Param productId: ' + productId);
 await Fact_Sold_Product.create({
    date: dateP,
    product_id: productId,
    count: 1
  }, function(err, factCreated){
    if (err){
      throw new Error('An error occurred at createFactSoldProduct');
    } else {
      console.log('A new fact of sold product was created.');
      console.log(factCreated);
    }
  });
}



// Function to determine is currentDate is inside the range between bieginDate and endDate
// The date format is YYYY-MM-DD
var isDateInRange = function(beginDate, endDate, currentDate){
  var objBeginDate = new Date(parseInt(beginDate.substr(0,4)), parseInt(beginDate.substr(5,2)), parseInt(beginDate.substr(8)));
  var objEndDate = new Date(parseInt(endDate.substr(0,4)), parseInt(endDate.substr(5,2)), parseInt(endDate.substr(8)));
  var objCurrentDate = new Date(parseInt(currentDate.substr(0,4)), parseInt(currentDate.substr(5,2)), parseInt(currentDate.substr(8)));
  return ((objCurrentDate >= objBeginDate) && (objCurrentDate <= objEndDate)) ? true : false;
}

// Function to read all the products
module.exports.readProducts = async function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
     readProducts(req, res);
  };

  //Function to read the count of products
  module.exports.countOfProducts =  function (req, res) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
     Product
    .countDocuments({isDeleted: false}, function (err, count) {
      if (err) {
        sendJSONresponse(res, 500, {message: 'An error occurred at countOfProducts', error: err});
      } else {
        sendJSONresponse(res, 200, {countOfProducts: count});
      }
    });
  };

  //Function to read all the requests
  module.exports.readAllRequests =  function(req, res){
    Request
     .find({})
     .exec(function (err, requests){
       if(err){
         sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
       }else{
         sendJSONresponse(res, 200, requests);
       }
     });
 };

 //Function to read an specific request
 module.exports.readARequest = async function(req, res){
  Request
   .findById(req.params.requestId)
   .exec(function (err, request){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       sendJSONresponse(res, 200, request);
     }
   });
};

 //Function to read all the facts of requests
 module.exports.readAllFactsOfRequests =  function(req, res){
  Fact_Request
   .find({})
   .exec(function (err, requests){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       sendJSONresponse(res, 200, requests);
     }
   });
};

//Function to read an specific fact of request
module.exports.readAFactRequest = async function(req, res){
  Fact_Request
   .findById(req.params.requestId)
   .exec(function (err, request){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       sendJSONresponse(res, 200, request);
     }
   });
};

// Function to read all the facts of sold products
module.exports.readFactsOfSoldProducts = async function(req, res){
  Fact_Sold_Product //Mongoose model
   .find({})
   .exec(function (err, products){
    if(!products){
      sendJSONresponse(res, 404, {"message" : "products not found"});
    }else if(err){
      sendJSONresponse(res, 404, err);
    }else{
      sendJSONresponse(res, 200, products);
    }
   });
};

//Function to read an specific fact of sold product
module.exports.readAFactOfSoldProducts = async function(req, res){
  Fact_Sold_Product
   .findById(req.params.factId)
   .exec(function (err, fact){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       sendJSONresponse(res, 200, fact);
     }
   });
};

//Function to read all the facts of requests between two dates
module.exports.readAllFactsOfRequestsInADateRange =  function(req, res){
  Fact_Request
   .find({})
   .exec(function (err, requests){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       var beginDate = req.body.beginDate;
       var endDate = req.body.endDate;
       var arrayOfFactsOfRequestsInDateRange = new Array();
       var indexOfRequest = 0;
       var indexOfArrayOfFactsOfRequestsInDateRange = 0;
       var currentDate = "";
       for(indexOfRequest = 0; indexOfRequest < requests.length; indexOfRequest++){
         currentDate = requests[indexOfRequest].date;
         if(isDateInRange(beginDate, endDate, currentDate)){
           arrayOfFactsOfRequestsInDateRange[indexOfArrayOfFactsOfRequestsInDateRange] = requests[indexOfRequest];
           indexOfArrayOfFactsOfRequestsInDateRange++;
         }
       }
       sendJSONresponse(res, 201, arrayOfFactsOfRequestsInDateRange);
     }
   });
};
// Function to count the facts of requests between two dates
module.exports.readCountOfFactsOfRequestsInADateRange =  function(req, res){
  Fact_Request
   .find({})
   .exec(function (err, requests){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       var beginDate = req.body.beginDate;
       var endDate = req.body.endDate;
       var indexOfRequest = 0;
       var count = 0;
       var currentDate = "";
       for(indexOfRequest = 0; indexOfRequest < requests.length; indexOfRequest++){
         currentDate = requests[indexOfRequest].date;
         if(isDateInRange(beginDate, endDate, currentDate)){
           count++;
         }
       }
       sendJSONresponse(res, 201, count);
     }
   });
};

// Function to get statistics of facts in a date range
module.exports.statisticsOfFactsOfRequestsInADateRange =  function(req, res){
  Fact_Request
   .find({})
   .exec(function (err, requests){
     if(err){
       const errorResponse = {
         message: 'An connection error had occurred. Try connect to the database later.',
         code_error: 500
        };
       sendJSONresponse(res, 500, errorResponse);
     }else{
       const beginDate = req.body.beginDate;
       const endDate = req.body.endDate;
       let indexOfRequest = 0;
       let countOfOpenedOrders = 0;
       let countOfClosedOrders = 0;
       let countOfCanceledOrders = 0;
       let dateOfCurrentOrder = '';
       let stateOfCurrentOrder = '';
  
       for(indexOfRequest = 0; indexOfRequest < requests.length; indexOfRequest++){
         dateOfCurrentOrder = requests[indexOfRequest].date;
        if (moment(dateOfCurrentOrder).isBetween(beginDate, endDate, null,'[]')){
          stateOfCurrentOrder = requests[indexOfRequest].state;
          switch (stateOfCurrentOrder){
            case 'canceled': {
              countOfCanceledOrders++;
              break;
            }
            case 'closed': {
              countOfClosedOrders++;
              break;
            }
            default: {
              countOfOpenedOrders++;
              break;
            }
          }
        }
       }
       const statisticsOfOrders = {
         beginDate: beginDate,
         endDate: endDate,
         openedOrders: countOfOpenedOrders,
         closedOrders: countOfClosedOrders,
         canceledOrders: countOfCanceledOrders
       };
       sendJSONresponse(res, 200, statisticsOfOrders);
     }
   });
};

// Function to count the facts of requests between two dates
module.exports.readCountOfOpenedRequests =  function(req, res){
  Fact_Request.count({state:'open'}, function(err, count){
    if (err){
      let errResponse = {message: 'An error at count the opened requests occurred.'};
      sendJSONresponse(res, 500, errResponse);
    } else {
      let countOfOpenedRequests = {countOfOpenedOrders: count};
      sendJSONresponse(res, 200, countOfOpenedRequests);
    }
  });
   
};

//Function to count the number of served clients in a period
module.exports.countServedClientsInAperiod = async function(req, res){
  Fact_Request
   .find({})
   .exec(function (err, requests){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       var beginDate = req.body.beginDate;
       var endDate = req.body.endDate;
       var currentDate = "";
       var servedClients = new Array();
       var countOfServedClients = 0;
       var indexOfRequests = 0;
       var currentClientID = "";
       for(indexOfRequests = 0; indexOfRequests < requests.length; indexOfRequests++){
         currentDate = requests[indexOfRequests].date;
         if(utils.isDateInRange(beginDate, endDate, currentDate)){
           currentClientID = requests[indexOfRequests].client_id.toString();
           if(servedClients.indexOf(currentClientID)==-1){
             servedClients.push(currentClientID);
             countOfServedClients++;
           }
         }
       }
       sendJSONresponse(res, 201, countOfServedClients);
     }
   });
};

let getSoldProductsInDateRange = async function (beginDate, endDate) {
  try {
    const factsOfSoldProducts = await Fact_Sold_Product.find({}).exec();
    let idsOfProductsSoldInDateRange = [];
    let countsOfProductsSoldInDateRange = [];
    for (let i = 0; i < factsOfSoldProducts.length; i++) {
      if (moment(factsOfSoldProducts[i].date).isBetween(beginDate, endDate, null, '[]')) {
        const posOfProduct = await idsOfProductsSoldInDateRange.indexOf(factsOfSoldProducts[i].product_id.toString());
        if (posOfProduct < 0) {
          idsOfProductsSoldInDateRange.push(factsOfSoldProducts[i].product_id.toString());
          countsOfProductsSoldInDateRange.push(factsOfSoldProducts[i].count);
        } else {
          countsOfProductsSoldInDateRange[posOfProduct] += factsOfSoldProducts[i].count;
        }
      }
    }
    let productsSoldInDateRange = [];
      let result = [];
      for (let j = 0; j < idsOfProductsSoldInDateRange.length; j++) {
        const currentProduct = await Product.findById(idsOfProductsSoldInDateRange[j]).exec();
        productsSoldInDateRange.push(currentProduct);
        result.push({productId: currentProduct._id, productName: currentProduct.name, sales: countsOfProductsSoldInDateRange[j]});
      }
      return result;
  } catch ( errors) {
    console.log('An error occurred at getSoldProductsInDateRange');
    console.log(errors);
    return null;
  }
}

//Function to get all sold products in a date range
module.exports.moreSoldProducts = async function(req, res){
   try {
     const result = await getSoldProductsInDateRange(req.body.beginDate, req.body.endDate);
     if (result != null) {
       sendJSONresponse(res, 200, result);
     } else {
       sendJSONresponse(res, 500, {message: 'An error occurred at moreSoldProducts'});
     }
   } catch (errors) {
     console.log('An error occurred at moreSoldProducts');
     sendJSONresponse(res, 500, errors);
   }
};

let getNameOfProduct = async function (idOfProduct) {
  console.log('method getNameOfProduct:  (idOfProduct - )' + idOfProduct.toString() + '>>>>')
  try {
   Product
    .findById(idOfProduct)
    .exec(function (err, product) {
      if (!err) { 
        console.log('Displaying result of method getNameOfProduct:');
        console.log(product);
        return product.name;
      }
    });
  } catch (errors) {
    console.log (errors);
  }
}

//Function to get less sold products in a date range
module.exports.lessSoldProducts = async function(req, res){
  Fact_Sold_Product
   .find()
   .exec(function (err, fact){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       var beginDate = req.body.beginDate;
       var endDate = req.body.endDate;
       var arrayOfSoldProducts = new Array();
       var arrayOfCountsOfSoldsProducts = new Array();
       var arrayOfResult = new Array();
       var indexOfFact = 0;
       var currentProductId = "";
       var currentDate = "";
       var indexOfSearch = -1;
       for(indexOfFact = 0; indexOfFact < fact.length; indexOfFact++){
         currentDate = fact[indexOfFact].date;
         if(utils.isDateInRange(beginDate, endDate, currentDate)){
           currentProductId = fact[indexOfFact].product_id.toString();
           indexOfSearch = arrayOfSoldProducts.indexOf(currentProductId);
           if(indexOfSearch==-1){
             arrayOfSoldProducts.push(currentProductId);
             arrayOfCountsOfSoldsProducts.push(parseInt(fact[indexOfFact].count));
           }else{
             arrayOfCountsOfSoldsProducts[indexOfSearch]+= parseInt(fact[indexOfFact].count);
           }
         }
       }
       var min = utils.minValueOfTheArrayOfInt(arrayOfCountsOfSoldsProducts);
       var j = 0;
       for(j = 0; j < arrayOfCountsOfSoldsProducts.length; j++){
         if(arrayOfCountsOfSoldsProducts[j] == min){
           arrayOfResult.push(arrayOfSoldProducts[j]);
         }
       }
       sendJSONresponse(res, 201, arrayOfResult);
     }
   });
};

//Function to create a new product
module.exports.createProduct = async function(req, res){
res.header('Access-Control-Allow-Origin', '*');
res.set('Access-Control-Allow-Origin', 'http://localhost:8100');
res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
res.header('Access-Control-Allow-Headers', 'Content-Type');
  Product.create({
    name: req.body.name,
    price: req.body.price,
    description: req.body.description,
    type: req.body.type,
    cost: req.body.cost
  }, function(err, product) {
    if (err) {
      console.log("API Message: An error ocurred.");
      sendJSONresponse(res, 400, err);
    } else {
      console.log("API Message: A product was inserted.");
      sendJSONresponse(res, 201, product);
    }
  });

};

// Function to create a new request
module.exports.createRequest = async function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods','GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH');
  await Request.create({
    products: req.body.products,
    origin: req.body.origin,
    state: 'open'
  }, function(errRequest, requestCreated) {
    if (errRequest){
      console.log('An error occurred at creation of order');
      const errCreationOfOrder = {message: 'An error occurred at creation of order.', err: errRequest};
      sendJSONresponse(res, 500, errCreationOfOrder);
    }else {
      let currentDateTime = moment();
      let dateOfRequest = currentDateTime.format('YYYY-MM-DD');
      let timeOfRequest = currentDateTime.format('HH:mm:ss');
      Fact_Request.create({
        date: dateOfRequest,
        time: timeOfRequest,
        request_id: requestCreated._id,
        state: 'open'
      }, function(errFactRequest, factRequestCreated){
        if (errFactRequest){
          console.log('An error occurred at creation of order');
          const errCreationOfOrder = {message: 'An error occurred at creation of order.', err: errFactRequest};
          sendJSONresponse(res, 500, errCreationOfOrder);
        }else {
          console.log('A new order was created');
          sendJSONresponse(res, 201, factRequestCreated);
        }
      });
    }

  });

}

// Function to read all the facts of requests opened
module.exports.readAllFactsOfRequestsOpened =  function(req, res){
  Fact_Request
   .find({state:"open"})
   .exec(function (err, requests){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       sendJSONresponse(res, 200, requests);
     }
   });
};

// Function to read all the requests opened
module.exports.readAllDataOfRequestsOpened =  function(req, res){
  Request
   .find({state:"open"})
   .exec(function (err, requests){
     if(err){
       sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
     }else{
       sendJSONresponse(res, 200, requests);
     }
   });
};

// Function to read all the data of fact requests including clients and requests
module.exports.readAllDataOfFactRequests = function(req, res){
 Fact_Request
 .find({})
 .populate('client_id')
 .populate('request_id')
 .exec(function(err, fact_requests){
   if (err) {
    sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
   } else {
     sendJSONresponse(res, 200, fact_requests);
   }
 });
}; 

let dataOftOpenedOrders = async function () {
  try {
  await Fact_Request
  .find({state: "open"})
  .populate("request_id")
  .exec(function (err, openedRequests) {
    if (!err) {
      return openedRequests;
    }
  });
  } catch(e) {

  }
}

let getSummariesOfSelectedRequests = async function (openedOrders) {
   let result = new Array();
   try{
   for (let i = 0; i < openedOrders.length; i++) {
     const item = await getAmountAndDescriptionsOfProducts(openedOrders[i].request_id.products, openedOrders[i]._id, openedOrders[i].request_id.origin);
     result.push(item);
   }
  } catch(e) {}
   return result;
}

let getSummariesOfOpenedOrders = async function (req, res) {
  console.log('Method getSummariesOfOpenedOrders:>>>');
  try {
  const openedOrders = await dataOftOpenedOrders(req, res);
  console.log('Opened');
  console.log(openedOrders);
  } catch(e) {

  }
  return null;
}

module.exports.getSummaryOfOpenedOrders = async function (req, res) {
  try{
        const openedOrders = await Fact_Request.find({state:"open"}).populate("request_id").exec();
        console.log(openedOrders);
        const summaries = await getSummariesOfSelectedRequests(openedOrders);
        console.log(summaries);
        sendJSONresponse(res, 200, summaries);
      } catch (err) {
        // return 'error occured';
      }  
}; 





// Function to read all the data of fact requests including clients and requests
module.exports.readAllDataOfOpenedFactRequests =  function(req, res){
  Fact_Request
  .find({state:"open"})
  .populate('client_id')
  .populate('request_id')
  .exec(function(err, fact_requests){
    if (err) {
     sendJSONresponse(res, 500, 'An connection error had occurred. Try connect to the database later.');
    } else {
      sendJSONresponse(res, 200, fact_requests);
    }
  });
 }; 

 let updateFinancesOfDate = async function (date, income, cost) {
  try {
    const financesOfDate = await Fact_Finances.find({date: date}).exec();
    console.log('Finances of date: ' + date + ' :>>>>');
    if (financesOfDate != null && financesOfDate.length > 0) {
      let newIncome = financesOfDate[0].income;
      let newCost = financesOfDate[0].cost;
      newIncome += income;
      newCost += cost;
      let newBalance = newIncome - newCost;
      financesOfDate[0].income = newIncome;
      financesOfDate[0].cost = newCost;
      financesOfDate[0].balance = newBalance;
      await financesOfDate[0].save();
      return true;
    } else {
     const created = await Fact_Finances.create({date: date, income: income, cost: cost, balance: (income - cost)});
     console.log('A new fact of finance was created');
     console.log(created);
     if (created != null) {
      return true;
     } else {
       console.log('error at updateFinancesOfDate. The created fact is null.')
       return false;
      }
    }
  } catch (errors) {
    console.log('An error occurred at updateFinancesOfDate');
    console.log(errors);
    return false;
  }
}


 let closeOrder = async function (idOfOrder) {
   try {
     const productsFromOrder = await getProductsFromOrder(idOfOrder);
     const financesFromOrder = await getFinancesFromOrder(idOfOrder);
     const order = await Fact_Request.findById(idOfOrder).exec();
     let productsIds = [];
     for (let i = 0; i < productsFromOrder.length; i++) {
       productsIds.push(productsFromOrder[i]._id);
     }
    await addSoldProductsInDate(productsIds, order.date);
    await updateFinancesOfDate(order.date, financesFromOrder.amount, financesFromOrder.cost);
    order.state = 'closed';
    await order.save();
    return true;
   } catch (errors) {
     console.log('An error occurred at closeOrder');
     console.log(errors);
     return false;
   }
 }

//  Function to close a request
module.exports.closeRequest = async function(req, res){
 try {
   const closed = await closeOrder(req.body.request_id);
   if (closed == true) {
     sendJSONresponse(res, 204, null);
   } else {
     sendJSONresponse(res, 500, {message: 'An error occurred at closeRequest'});
   }
 } catch (errors) {
   console.log('An error occurred at closeRequest');
   sendJSONresponse(res, 500, errors);
 }
}

// Function to cancel a request
module.exports.cancelRequest = async function(req, res){
  try {
    await Fact_Request
    .findById(req.body.request_id)
    .populate('request_id')
    .exec(async function(err, factRequest) {
      if (!err) {
        factRequest.request_id.state = 'canceled';
        await factRequest.request_id.save();
        factRequest.state = 'canceled';
        await factRequest.save();
        sendJSONresponse(res, 201, factRequest);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, errors);
  }
}

//  Function to add a new type of complaints to a request
module.exports.addNewTypeOfComplaintsToRequest = function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods','GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH');
  let currentDateTime = moment();
  let dateOfRequest = currentDateTime.format('YYYY-MM-DD');
  let timeOfRequest = currentDateTime.format('HH:mm:ss');
  let objectOfResponse = null;
  ComplaintsAndClaims.create({
    category: req.body.category,
    type: req.body.type,
    text: req.body.text
  },
    function(err, complaintsAndClaimsCreated){
      if (err) {
        console.log('An error occurred at creation of a new type of complaints/claims');
        sendJSONresponse(res, 500, err);
      } else {
        Fact_ComplaintsAndClaims.create({
          date: dateOfRequest,
          time: timeOfRequest,
          worker_id: req.body.worker_id,
          complaints_and_claims_id: complaintsAndClaimsCreated._id,
          request_id: req.body.request_id
        }, function(errFact, factCreated){
          if (errFact) {
            console.log('An error occurred at creation of a new type of complaints/claims');
            sendJSONresponse(res, 500, errFact);
          } else { 
            console.log('A new fact about complaints/claims was created');
            objectOfResponse = factCreated;
            sendJSONresponse(res, 201, objectOfResponse);
          }
        });
      }
  });
 
}

// Function to add a complaint/claim to a request
module.exports.addComplaintToRequest = function(req, res){
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
  res.header('Access-Control-Allow-Methods','GET, HEAD, POST, PUT, DELETE, CONNECT, OPTIONS, TRACE, PATCH');
  let currentDateTime = moment();
  let dateOfRequest = currentDateTime.format('YYYY-MM-DD');
  let timeOfRequest = currentDateTime.format('HH:mm:ss');
  Fact_ComplaintsAndClaims.create({
    date: dateOfRequest,
    time: timeOfRequest,
    worker_id: req.body.worker_id, /* // FIXME eliminar el campo worker_id del modelo de la colección Fact_Complaints_and_Claims, estoy inyectando uno por defecto */
    complaints_and_claims_id: req.body.complaints_and_claims_id,
    request_id: req.body.request_id   
  }, function( err, complaintsAndClaimsCreated){
    if (err) {
      console.log('An error had occurred at creation of fact request');
      sendJSONresponse(res, 404, err);
    } else { 
      console.log('A new fact of complaints/claims was created');
      sendJSONresponse(res, 201, complaintsAndClaimsCreated);
    }
  });
}

// Function to get the weekly summary of orders
module.exports.getWeeklySummaryOfOrders = async function(req, res) {
  Fact_Request
  .find({})
  .exec(function (err, facts){
    if (err) {
      const errResponse = {
        message: 'An error occurred at get the weekly summary of orders.'
      };
      sendJSONresponse(res, 500, errResponse);
    } else {
      let response = [
        {date: moment().subtract(6, 'day').format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0},
        {date: moment().subtract(5, 'day').format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0},
        {date: moment().subtract(4, 'day').format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0},
        {date: moment().subtract(3, 'day').format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0},
        {date: moment().subtract(2, 'day').format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0},
        {date: moment().subtract(1, 'day').format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0},
        {date: moment().format('YYYY-MM-DD'), closedOrders: 0,  openedOrders: 0, canceledOrders: 0}
      ];
      let dateOfCurrentItem = '';
      for (let i = 0; i < facts.length; i++) {
        dateOfCurrentItem = facts[i].date;
        if (moment(dateOfCurrentItem).isBetween(response[0].date, response[6].date, null, '[]')) {
          switch (dateOfCurrentItem) {
            case response[0].date : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[0].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[0].closedOrders +=1;
                  break;
                }
                default: {
                  response[0].openedOrders +=1;
                  break;
                }
              }
              break;
            }
            case response[1].date : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[1].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[1].closedOrders +=1;
                  break;
                }
                default: {
                  response[1].openedOrders +=1;
                  break;
                }
              }
              break;
            }
            case response[2].date : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[2].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[2].closedOrders +=1;
                  break;
                }
                default: {
                  response[2].openedOrders +=1;
                  break;
                }
              }
              break;
            }
            case response[3].date : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[3].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[3].closedOrders +=1;
                  break;
                }
                default: {
                  response[3].openedOrders +=1;
                  break;
                }
              }
              break;
            }
            case response[4].date : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[4].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[4].closedOrders +=1;
                  break;
                }
                default: {
                  response[4].openedOrders +=1;
                  break;
                }
              }
              break;
            }
            case response[5].date : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[5].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[5].closedOrders +=1;
                  break;
                }
                default: {
                  response[5].openedOrders +=1;
                  break;
                }
              }
              break;
            }
            default : {
              switch(facts[i].state){ 
                case 'canceled':  {
                  response[6].canceledOrders +=1;
                  break;
                }
                case 'closed' : {
                  response[6].closedOrders +=1;
                  break;
                }
                default: {
                  response[6].openedOrders +=1;
                  break;
                }
              }
              break;
            }
          }
        }
      }
      sendJSONresponse(res, 200, response);
    }
  });
}

// Function to get the monthly summary of orders
module.exports.getMonthlySummaryOfOrders = async function(req, res) {
  Fact_Request
  .find({})
  .exec( function(err, facts) {
    if (err) {
      const errResponse = {
        message: 'An error occurred at get the monthly summary of orders.'
      };
      sendJSONresponse(res, 500, errResponse);
    } else {
      let response = {beginDate: moment().startOf('M').format('YYYY-MM-DD'), endDate: moment().format('YYYY-MM-DD'), openedOrders: 0, closedOrders: 0, canceledOrders: 0};
      let dateOfCurrentItem = '';
      for (let i = 0; i < facts.length; i++) {
        dateOfCurrentItem = facts[i].date;
        if (moment(dateOfCurrentItem).isBetween(response.beginDate, response.endDate, null, '[]')) {
          switch (facts[i].state) {
            case 'open' : {
              response.openedOrders += 1;
              break;
            }
            case 'closed' : {
              response.closedOrders += 1;
              break;
            }
            default : {
              response.canceledOrders += 1;
              break;
            }
          }
        }
      }
      sendJSONresponse(res, 200, response);
    }
  });
}

let isToday = function (date) {
  return (moment().format('YYYY-MM-DD').toString() == date) ? true : false;
}

let isDateFromCurrentMonth = function (date) {
  const beginOfMonth = moment().startOf('M').format('YYYY-MM-DD');
  const endOfMonth = moment().endOf('M').format('YYYY-MM-DD');
  let response = false;
  if (moment(date).isBetween(beginOfMonth, endOfMonth, null, '[]')) {
    response = true;
  }
  return response;
}

let isDateFromPreviousWeek = function (date) {
  const endOfPreviousWeek = moment().format('YYYY-MM-DD');
  const startOfPreviousWeek = moment().subtract(6,'days').format('YYYY-MM-DD');
  let response = false;
  if (moment(date).isBetween(startOfPreviousWeek, endOfPreviousWeek, null, '[]')) {
    response = true;
  }
  return response;
}



module.exports.getSummaryOfSoldProducts = async function (req, res) {
  Fact_Sold_Product
  .find({})
  .populate('product_id')
  .exec( function(err, facts) { 
    if (err) {
      const errResponse = {
        message: 'An error occurred at get the summary of sold products.'
      };
      sendJSONresponse(res, 500, errResponse);
    } else {
      let products = [];
      let soldProductsToday = [];
      let soldProductsInPreviousWeek = [];
      let soldProductsInCurrentMonth = [];
      let namesOfProducts = [];
      let indexOfProduct = -1;
      let dateOfCurrentItem = '';
      let response = {soldProducts: [], countOfSellsToday: [], countOfSellsInPreviousWeek: [], countOfSellsInCurrentMonth: [], namesOfProducts: []};
      for (let i = 0; i < facts.length; i++) {
        dateOfCurrentItem = facts[i].date;
        indexOfProduct = products.indexOf(facts[i].product_id.id);
        if (indexOfProduct == -1){
          products.push(facts[i].product_id.id);
          soldProductsToday.push(0);
          soldProductsInPreviousWeek.push(0);
          soldProductsInCurrentMonth.push(0);
          indexOfProduct = products.length - 1;
          namesOfProducts.push(facts[i].product_id.name);
        }
        if (isToday(dateOfCurrentItem)) {
          soldProductsToday[indexOfProduct] += facts[i].count;
        }

        if (isDateFromPreviousWeek(dateOfCurrentItem)) {
          soldProductsInPreviousWeek[indexOfProduct] += facts[i].count;
        }

        if (isDateFromCurrentMonth(dateOfCurrentItem)) {
          soldProductsInCurrentMonth[indexOfProduct] += facts[i].count;
        }
      }
      response.soldProducts = products;
      response.countOfSellsToday = soldProductsToday;
      response.countOfSellsInPreviousWeek = soldProductsInPreviousWeek;
      response.countOfSellsInCurrentMonth = soldProductsInCurrentMonth;
      response.namesOfProducts = namesOfProducts;
      sendJSONresponse(res, 200, response);
    }
  }
  );
}

module.exports.addLocation = async function (req, res) {
  try {
    Location
    .create({
      name: req.body.name
    }, function( errCreation, newLocation) {
      if (errCreation) {
        sendJSONresponse(res, 500, {message: 'An error occurred at addLocation', error: errCreation});
      } else {
        sendJSONresponse(res, 201, newLocation);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at addLocation', error: errors});
  }
};

module.exports.removeLocation = async function (req, res) {
  try {
    Location
    .findByIdAndRemove(req.params.id)
    .exec(function (errDeletion, removed) {
      if (errDeletion) {
        sendJSONresponse(res, 500, {message: 'An error occurred at removeLocation', error: errDeletion});
      } else {
        sendJSONresponse(res, 204, null);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at removeLocation', error: errors});
  }
};

module.exports.locations = async function (req, res) {
  try {
    Location
    .find({})
    .exec(function (errGettingLocations, locations) {
      if (errGettingLocations) {
        sendJSONresponse(res, 500, {message: 'An error occurred at getting locations', error: errGettingLocations});
      } else {
        sendJSONresponse(res, 200, locations);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at getting locations', error: errors});
  }
};

module.exports.updateProduct = async function (req, res) {
  try {
    Product
    .findById(req.params.id)
    .exec(function (err, product) {
      if (err) {
        sendJSONresponse(res, 500, {message: 'An error occurred at updateProduct', error: err});
      } else {
        product.price = req.body.price;
        product.cost = req.body.cost;
        product.save();
        sendJSONresponse(res, 204, null);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at updateProduct', error: errors});
  }
};

// Function to perform a logical deletion of a product
module.exports.removeProduct = async function (req, res) {
  try {
    Product
    .findById(req.params.id)
    .exec(function (err, product) {
      if (err) {
        sendJSONresponse(res, 500, {message: 'An error occurred at removeProduct', error: err});
      } else {
        product.isDeleted = true;
        product.save();
        sendJSONresponse(res, 204, null);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at removeProduct', error: errors});
  }
};

let testingFunction = async function () {
  try { 
    Product
    .find({isDeleted: false})
    .exec(function (err, products) {
      if (err) {
        //sendJSONresponse(res, 500, {message: 'An error occurred at loadAllProductsNotDeleted', error: err})
      } else {
        //sendJSONresponse(res, 200, products);
        console.log('Displaying products:');
        return products;
      }
    });
  } catch (errors) {
    //sendJSONresponse(res, 500, {message: 'An error occurred at loadAllProductsNotDeleted', error: errors});
  }
}

module.exports.loadAllProductsNotDeleted = async function (req, res) {
  try { 
    Product
    .find({isDeleted: false})
    .exec(function (err, products) {
      if (err) {
        sendJSONresponse(res, 500, {message: 'An error occurred at loadAllProductsNotDeleted', error: err})
      } else {
        sendJSONresponse(res, 200, products);
      }
    });
  } catch (errors) {
    sendJSONresponse(res, 500, {message: 'An error occurred at loadAllProductsNotDeleted', error: errors});
  }
};

let getProductsFromOrder = async function(idOfOrder) {
  try {
    let result = [];
    const order = await Fact_Request.findById(idOfOrder).populate('request_id').exec();
    const productsIds = await order.request_id.products;
    for (let i = 0; i < productsIds.length; i++) {
      const currentProduct = await Product.findById(productsIds[i]).exec();
      result.push(currentProduct);
    }
    return result;
  } catch (errors) {
    console.log(errors);
    return null;
  }
}

module.exports.getProductsFromOrder = async function (req, res) {
  try {
    const result = await getProductsFromOrder(req.body.id);
    if (result == null) {
      sendJSONresponse(res, 500, {message: 'An error occurred at getProductsFromOrder'});
    } else {
      sendJSONresponse(res, 201, result);
    }
  } catch(errors) {
    console.log('An error occurred at getProductsFromOrder');
    sendJSONresponse(res, 500, errors);
  }
}

let getFinancesFromOrder = async function (idOfOrder) {
  try {
    let result = {amount: 0, cost: 0, balance: 0};
    const products = await getProductsFromOrder(idOfOrder);
    for (let i = 0; i < products.length; i++) {
      result.amount += products[i].price;
      result.cost += products[i].cost;
    }
    result.balance = result.amount - result.cost;
    return result;
  } catch (error) {
    console.log('An error occurred at getFinancesFromOrder');
    return null;
  }
}

module.exports.getFinancesFromOrder = async function(req, res) {
  try {
    const result = await getFinancesFromOrder(req.body.id);
    if (result == null) {
      sendJSONresponse(res, 500, {message: 'An error occurred at getFinancesFromOrder'});
    } else {
      sendJSONresponse(res, 201, result);
    }
  } catch (errors) {
    console.log('An error occurred at getFinancesFromOrder');
    sendJSONresponse(res, 500, errors);
  }
}

let addSoldProductInDate = async function (date, productId, countOfProductSold) {
  try {
    const fact = await Fact_Sold_Product.find({date: date, product_id: productId}).exec();
    if (fact != null && fact.length > 0) {
      fact[0].count += countOfProductSold;
      await fact[0].save();
      return true;
    } else {
      const created = await Fact_Sold_Product.create({date: date, product_id: productId, count: countOfProductSold});
      console.log('A new fact of solf product was created');
      console.log(created);
      return true;
    }
  } catch (errors) {
    console.log('An error occurred at addSoldProduct');
    console.log(errors);
    return false;
  }
}

module.exports.addSoldProduct = async function (req, res) {
  try {
    const added = await addSoldProductInDate(req.body.date, req.body.product_id, req.body.countOfSoldProduct);
    if (added == true) {
      sendJSONresponse(res, 204, null);
    }
    else {
      sendJSONresponse(res, 500, {message: 'An error occurred at addSoldProduct'});
    }
  } catch(errors) {
    console.log('An error occurred at addSoldProduct');
    sendJSONresponse(res, 500, errors);
  }
};

let addSoldProductsInDate = async function (productsIds, date) {
  try {
    const products = await getNotRepeated(productsIds);
    const countsOfProducts = await getCountsOfItems(products, productsIds);
    console.log('Displaying non repeated products:');
    console.log(products);
    console.log('Displaying counts of this products:');
    console.log(countsOfProducts);
    for (let i = 0; i < products.length; i++) {
      const productAdded = await addSoldProductInDate(date, products[i], countsOfProducts[i]);
    }
    return true;
  } catch (errors) {
    console.log('An error occurred at addSoldProductsInDate');
    console.log(errors);
    return false;
  }
}

module.exports.addSoldProductsInDate = async function(req, res) {
  try { 
    const result = await addSoldProductsInDate(req.body.products, req.body.date);
    if (result == true) {
      sendJSONresponse(res, 204, null);
    } else {
      sendJSONresponse(res, 500, {message: 'An error occurred at addSoldProductsInDate'});
    }
  } catch (errors) {
    console.log('An error occurred at addSoldProductsInDate');
    sendJSONresponse(res, 500, errors);
  }
};

let getProductById = async function (id) {
  try {
    const product = await Product.findById(id).exec();
    return product;
  } catch (error) {
    console.log('An error occurred at getProductById');
    console.log(error);
    return null;
  }
}

module.exports.getProduct = async function (req, res) {
 try {
   const product = await getProductById(req.params.id);
   if (product == null) {
     sendJSONresponse(res, 500, {message: 'An error occurred at getProduct. Product found is null.'});
   } else {
     sendJSONresponse(res, 200, product);
   }
 } catch (errors) {
   console.log('An error occurred at getProduct');
   sendJSONresponse(res, 500, errors);
 }
};

// this function returns an array with the non repeated items from arrayOfString
let getNotRepeated = async function (arrayOfString) {
  let result = [];
  for (let i = 0; i < arrayOfString.length; i++) {
    if (result.indexOf(arrayOfString[i]) < 0) {
      result.push(arrayOfString[i]);
    }
  }
  return result;
}

// this function retunrs an array with the counts of each item in arrayOfItemsToCount in the array source
let getCountsOfItems = async function (arrayOfItemsToCount, source) {
  let counts = new Array(arrayOfItemsToCount.length);
  for (let i = 0; i < counts.length; i++) {
    counts[i] = 0;
    for (let j = 0; j < source.length; j++) {
      if (arrayOfItemsToCount[i] == source[j]) {
        counts[i] += 1;
      }
    }
  }
  return counts;
}
