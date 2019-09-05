var mongoose = require('mongoose');
var Fact_finance  = mongoose.model('Fact_finance');
var utils = require('./utils'); 
var Product = mongoose.model('Product');
var processes = require('./processes');
var moment = require('moment');

var sendJSONresponse = function(res, status, content) {
    console.log(content);
    res.status(status).json(content); 
  };

let isADateFromThisMonth = function(date) {
  let response = false;
  console.log('Method: isAdateFromThisMonth>>');
  console.log('Param date: ' + date);
  const startOfThisMonth = moment().startOf('M').format("YYYY-MM-DD");
  console.log('Start of this month: ' + startOfThisMonth);
  const now = moment().format("YYYY-MM-DD");
  console.log('Today: ' + now);
  if (moment(date).isBetween(startOfThisMonth, now, null, '[]')) {
    response = true;
  }
  console.log('Response: ' + response);
  console.log('>>>>>');
  return response;
};

let isADateFromPreviousMonth = function(date) {
  let response = false;
  console.log('Method: isAdateFromPreviousMonth>>');
  console.log('Param date: ' + date);
  const previousMonth = moment().subtract(1,'M');
  const startOfPreviousMonth = previousMonth.startOf('M').format('YYYY-MM-DD');
  const endOfPreviousMonth = previousMonth.endOf('M').format('YYYY-MM-DD');
  if (moment(date).isBetween(startOfPreviousMonth, endOfPreviousMonth, null, '[]')) {
    response = true;
  }
  console.log('Response: ' + response);
  console.log('>>>>>');
  return response;
};

// Update finances
module.exports.updateFinancesAtCloseRequest = async function(arrayOfProductsIds, date, requestId, res){
   await Product.find({_id: {$in: arrayOfProductsIds}})
  .exec(function(err, products){
    if (err){
      throw new Error('An error occurred at getSumOfPricesOfSelectedProducts');
    }else {
      let sum = 0;
      let costs = 0;
      for (let i = 0; i < products.length; i++){
        console.log('Product: ' + products[i]._id + ' Price: ' + products[i].price + ' Cost: ' + products[i].cost);
        sum += products[i].price;
        costs += products[i].cost;
      }
      console.log('Sum of prices: ' + sum);
      console.log('Sum of Costs:' + costs);   
      Fact_finance
  .find({date: date})
  .exec(function(err, factFinancesFounded){
    if (err) {
      throw new Error('An error occurred at updateFinances with date:' + date + ' -> income: ' + income + ' -> cost: ' + cost);
    } else {
      if (factFinancesFounded.length > 1) {
        throw new Error('More than 1 row was founded at date given in updateFinances');
      } else {
        if (factFinancesFounded.length == 0) {
         createFactFinance(date, sum, costs, res, requestId);
        } else {
          let currentIncome = factFinancesFounded[0].income;
          let currentCost = factFinancesFounded[0].cost;
          currentIncome += sum;
          currentCost += costs;
          let newBalance = currentIncome - currentCost;
          factFinancesFounded[0].income = currentIncome;
          factFinancesFounded[0].cost = currentCost;
          factFinancesFounded[0].balance = newBalance;
          factFinancesFounded[0].save();
          processes.updateStateToCloseInFactRequest(requestId, res);
        }
      }
    }
  });

    }
  });
}




// FIXME Function to get the sum of prices of the specified products
module.exports.sumOfPricesAndCostsOfProductsAndCreateNewFactFinance =  async function(arrayOfProductsIds){
  console.log('Method getSumOfPricesOfProducts ->')
  let sum = 0;
  let i = 0; 
  for (i = 0; i < arrayOfProductsIds.length; i++) {
   await Product
  .findById(arrayOfProductsIds[i])
  .exec(function(err, productFound){
    if (err){
     throw new Error('An error occurred at getSumOfPricesOfProducts');
    }else {
      console.log('Product price ' +' : ' + productFound.price);
     sum += productFound.price;
    }
  });
   
  }
  const result =  sum;
  console.log('Sum of prices of products: ' + result);
  return result; 
}

// Function to get the sum of costs of the specified products
module.exports.getSumOfCostsOfProducts = async function(arrayOfProductsIds){
  let sum = 0;
  let i = 0; 
  for (i = 0; i < arrayOfProductsIds.length; i++) {
    await Product
  .findById(arrayOfProductsIds[i])
  .exec(function(err, productFound){
    if (err){
     throw new Error('An error occurred at getSumOfCostsOfProducts');
    }else {
     sum += productFound.cost;
    }
  });
  }
  return sum; 
}

  // Function to update the finances in a date
module.exports.updateFinances = async function(date, products, requestId, res) {
  console.log('Method updateFinances -> Param date: ' + date + ' Param products: ' + products);
  await this.updateFinancesAtCloseRequest(products, date, requestId, res);
}

let updateFinancesOfDate = async function (date, income, cost) {
  try {
    const financesOfDate = await Fact_finance.find({date: date}).exec();
    console.log('Finances of date: ' + date + ' :>>>>');
    // console.log(financesOfDate);
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
     const created = await Fact_finance.create({date: date, income: income, cost: cost, balance: (income - cost)});
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

module.exports.updateFinancesOfDate = async function (req, res) {
  try {
    const updated = await updateFinancesOfDate(req.body.date, req.body.income, req.body.cost);
    if (updated == true) {
      sendJSONresponse(res, 204, null);
    } else {
      sendJSONresponse(res, 500, {message: 'An error occurred at updateFinancesOfDate'});
    }
  } catch (errors) {
    console.log('An error occurred at updateFinancesOfDate');
    sendJSONresponse(res, 500, errors);
  }
}

// Function to create a new Fact of finance
var createFactFinance =  function(date, income, cost, res, requestId){
  console.log('Method createFactFinance -> param date: ' + date + ' param income: ' + income + ' param cost: ' + cost);
  Fact_finance.create({
    date: date,
    income: income, 
    cost: cost,
    balance: (income - cost)
  }, function(err, factFinanceCreated){
    if (err){
      // throw new Error('An error occurred at creation of new fact of finance in createFactFinance with date: ' + date + ' -> income: ' + income + ' -> cost: ' + cost);
      sendJSONresponse(res, 500, err);
    }else {
      console.log('A new fact of finance was created');
      console.log( factFinanceCreated);
      // sendJSONresponse(res, 201, factFinanceCreated);
      processes.updateStateToCloseInFactRequest(requestId, res);
    }
  });

}

// Function to read all the finances
module.exports.readFinances = async function(req, res){
    Fact_finance //Mongoose model
     .find({})
     .exec(function (err, finances){
      if(!finances){
        sendJSONresponse(res, 404, {"message" : "finances not found"});
      }else if(err){
        sendJSONresponse(res, 404, err);
      }else{
        sendJSONresponse(res, 200, finances);
      }
     });
  };

  // Function to get all the finances in a period
module.exports.readFinancesInDateRange = async function(req, res){
  Fact_finance //Mongoose model
   .find({})
   .exec(function (err, finances){
    if(!finances){
      sendJSONresponse(res, 404, {"message" : "finances not found"});
    }else if(err){
      sendJSONresponse(res, 404, err);
    }else{
      var beginDate = req.body.beginDate;
      var endDate = req.body.endDate;
      var currentDate = "";
      var sumOfBalances = 0;
      var sumOfIncomes = 0;
      var sumOfCosts = 0;
      var index = 0;
      for(index = 0; index < finances.length; index++){
        currentDate = finances[index].date;
        if(utils.isDateInRange(beginDate, endDate,currentDate)){
          sumOfBalances += finances[index].balance;
          sumOfCosts += finances[index].cost;
          sumOfIncomes += finances[index].income;
        }
      }
      // Creating an object result
      var financesInPeriod = new Object();
      financesInPeriod.balance = sumOfBalances;
      financesInPeriod.cost = sumOfCosts;
      financesInPeriod.income = sumOfIncomes;
      financesInPeriod.date = endDate;
      sendJSONresponse(res, 201, financesInPeriod);
    }
   });
};

// Function to get the weekly summary of finances
module.exports.getWeeklySummary = async function(req, res) {
  Fact_finance
  .find({})
  .exec(function (err, finances) {
    if (err) {
      const errResponse = {
        message: 'An error occurred at get the weekly summary of finances.'
      };
      sendJSONresponse(res, 500, errResponse);
    } else {
      const now = moment();
      let dateOfCurrentItem = '';
      let i = 0;
      let duration = moment.duration(6, 'd');
      const beginDate = now.subtract(duration).format("YYYY-MM-DD");
      console.log('beginDate: ' + beginDate);
      
      const endDate = moment().format("YYYY-MM-DD");
      console.log('endDate: ' + endDate);
      let dates = [];
      let aDateInWeek = '';
      let weeklySummary = [
        {date:'', income: 0, cost: 0, balance: 0},
        {date:'', income: 0, cost: 0, balance: 0},
        {date:'', income: 0, cost: 0, balance: 0},
        {date:'', income: 0, cost: 0, balance: 0},
        {date:'', income: 0, cost: 0, balance: 0},
        {date:'', income: 0, cost: 0, balance: 0},
        {date:'', income: 0, cost: 0, balance: 0}
      ];
      dates.push(beginDate);
      weeklySummary[0].date = beginDate;
      for(let j = 5; j >=1; j--) {
        duration = moment.duration(j, 'd');
        aDateInWeek = moment().subtract(duration).format("YYYY-MM-DD");
        dates.push(aDateInWeek);
        weeklySummary[dates.length-1].date = aDateInWeek;
      }
      dates.push(endDate);
      weeklySummary[6].date = endDate;
      for (i = 0; i < finances.length; i++) {
        dateOfCurrentItem = finances[i].date;
        if (moment(dateOfCurrentItem).isBetween(beginDate, endDate, null, '[]')) {
          switch (dateOfCurrentItem) { 
            case beginDate : {
              weeklySummary[0].income = finances[i].income;
              weeklySummary[0].cost = finances[i].cost;
              weeklySummary[0].balance = finances[i].balance;
              break;
            }
            case dates[1] : {
              weeklySummary[1].income = finances[i].income;
              weeklySummary[1].cost = finances[i].cost;
              weeklySummary[1].balance = finances[i].balance;
              break;
            }
            case dates[2] : {
              weeklySummary[2].income = finances[i].income;
              weeklySummary[2].cost = finances[i].cost;
              weeklySummary[2].balance = finances[i].balance;
              break;
            }
            case dates[3] : {
              weeklySummary[3].income = finances[i].income;
              weeklySummary[3].cost = finances[i].cost;
              weeklySummary[3].balance = finances[i].balance;
              break;
            }
            case dates[4] : {
              weeklySummary[4].income = finances[i].income;
              weeklySummary[4].cost = finances[i].cost;
              weeklySummary[4].balance = finances[i].balance;
              break;
            }
            case dates[5] : {
              weeklySummary[5].income = finances[i].income;
              weeklySummary[5].cost = finances[i].cost;
              weeklySummary[5].balance = finances[i].balance;
              break;
            }
            default: {
              weeklySummary[6].income = finances[i].income;
              weeklySummary[6].cost = finances[i].cost;
              weeklySummary[6].balance = finances[i].balance;
              break;
            }
          }
        }
      }
      sendJSONresponse(res, 200, weeklySummary);
    }
  });
}; 

// Function to get the monthly summary of finances
module.exports.getMonthlySummary = async function(req, res) {
  Fact_finance
  .find({})
  .exec( function(err, facts) {
    if (err) {
      const errResponse = {
        message: 'An error occurred at get the monthly summary of finances.'
      };
      sendJSONresponse(res, 500, errResponse);
    } else {
      const now = moment();
      let dateOfCurrentItem = '';
      const dateOfToday = now.format("YYYY-MM-DD");
      const dateOfPreviousMonth = moment().subtract(1,'M').endOf('M').format('YYYY-MM-DD'); // the last day from the previous month
      let response = [{date: dateOfToday, income: 0, cost: 0, balance: 0}, {date: dateOfPreviousMonth, income: 0, cost: 0, balance: 0}]; // response[0] is the current month, response[1] is the previous month
      /*
       dates in the objects from response are referred to the last day from the month
      */
     for (let i = 0; i < facts.length; i++) {
       dateOfCurrentItem = facts[i].date;
       if (isADateFromThisMonth (dateOfCurrentItem)) {
         response[0].income += facts[i].income;
         response[0].cost += facts[i].cost;
         response[0].balance = (response[0].income - response[0].cost);
       } else {
         if (isADateFromPreviousMonth(dateOfCurrentItem)) {
          response[1].income += facts[i].income;
          response[1].cost += facts[i].cost;
          response[1].balance = (response[1].income - response[1].cost);
         }
       }
     }
     sendJSONresponse(res, 200, response);
    }
  });
};



