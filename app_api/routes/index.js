
let express = require('express');
let router = express.Router();

var ctrlStaff = require('../controllers/staff');
var ctrlClients = require('../controllers/clients');
let ctrlProcesses = require('../controllers/processes');
var ctrlFinances = require('../controllers/finances');
var ctrlAdmin = require('../controllers/admin');


// Finances
router.get('/finances', ctrlFinances.readFinances); // read all the finances
router.post('/financesInDateRange',ctrlFinances.readFinancesInDateRange); // get finances in a period of time
router.get('/weeklySummaryOfFinances', ctrlFinances.getWeeklySummary); // get a weekly summary of finances
router.get('/monthlySummaryOfFinances', ctrlFinances.getMonthlySummary); // get a monthly summary of finances
router.post('/updateFinancesOfDate', ctrlFinances.updateFinancesOfDate);


// Staff
router.get('/workers', ctrlStaff.readStaff); // leer todos los trabajadores
router.get('/complaints_and_claims', ctrlStaff.readAllComplaintsAndClaims); // read all complaints and claims
router.get('/facts_complaints_and_claims', ctrlStaff.readAllFactsOfComplaintsAndClaims); // read all facts of complaints and claims
router.post('/count_complaintsAndClaimsInADateRange',ctrlStaff.countOfComplaintsAndClaimsInAPeriod); // returns the count of complaints and claims in a period
router.post('/complaintsAndClaimsOfAWorker',ctrlStaff.complaintsAndClaimsOfAWorker); // read all the facts of complaints and claims of a worker
router.post('/countOfComplaintsAndClaimsOfAWorkerInADateRange',ctrlStaff.countOfComplaintsAndClaimsInAPeriodToAWorker); // returns the count of complaints and claims in a period to a worker

router.get('/clients', ctrlClients.readClients); // read all the clients
router.get('/numberOfRegisteredClientsOnADay/:date', ctrlClients.readNumberOfRegisteredClientsOnADay); // read the number of the registered clients in a date
router.get('/factsRegisteredClients',ctrlClients.readAllFactsOfRegisteredClients); // read all the facts of the registered clients
router.get('/factsRegisteredClients/:date',ctrlClients.readAFactOfRegisteredClients); // read an specific fact from the collection fact_registered_clients
router.post('/numberOfRegisteredClientsInAPeriod', ctrlClients.readNumberOfRegisteredClientsInAPeriod); // read the number of the clients registered in a period
router.post('/createClient', ctrlClients.createClient); // Create a new client
router.post('/findClientByEmail', ctrlClients.findClientByEmail); // Finds a client


//FIXME Me falta poner los nombres de los productos y la fecha de los pedidos pero el resto de los datos están OK
router.post('/requestsOfClient/',ctrlClients.readRequestsOfClient); // read all the requests of a client

// Processes
router.get('/products', ctrlProcesses.loadAllProductsNotDeleted); // read all the products
router.get('/products/:id', ctrlProcesses.getProduct); // read one product
router.post('/products', ctrlProcesses.createProduct); // create a product
router.get('/countOfProducts', ctrlProcesses.countOfProducts); // read the count of products 
router.get('/requests', ctrlProcesses.readAllRequests); // read all the requests
router.get('/requests/:requestId', ctrlProcesses.readARequest); // read an specific request
router.get('/facts_requests', ctrlProcesses.readAllFactsOfRequests); // read all facts of the requests
router.get('/facts_requests/:requestId', ctrlProcesses.readAFactRequest); // read an specific fact of request
router.get('/facts_sold_products',ctrlProcesses.readFactsOfSoldProducts); // read all the facts of sold products
router.get('/facts_sold_products/:factId',ctrlProcesses.readAFactOfSoldProducts); // read an specific fact of sold products
router.post('/requests_in_date_range', ctrlProcesses.readAllFactsOfRequestsInADateRange); // read all the facts of requests in a date range
router.post('/count_requests_in_date_range',ctrlProcesses.readCountOfFactsOfRequestsInADateRange); // counts the number of the facts of requests in a date range
router.post('/countServedClientsInDateRange',ctrlProcesses.countServedClientsInAperiod); // count the number of served clients in a period
router.post('/moreSoldProductsInDateRange',ctrlProcesses.moreSoldProducts); // obtiene los productos más vendidos en un período
router.post('/lessSoldProductsInDateRange', ctrlProcesses.lessSoldProducts); // obtiene los prouctos menos vendidos en un período
router.post('/newRequest', ctrlProcesses.createRequest); // creates a new request
router.get('/openedRequests', ctrlProcesses.readAllFactsOfRequestsOpened); // It reads all the opened requests
router.get('/countOpenedOrders', ctrlProcesses.readCountOfOpenedRequests); // It reads the count of the opened requests
router.get('/dataOfOpenedRequests', ctrlProcesses.readAllDataOfRequestsOpened); // It reads all the opened requests
router.get('/allDataOfFactRequests', ctrlProcesses.readAllDataOfFactRequests); // It reads all the data of the fact requests and use populate to get the client and request associated
router.get('/allDataOfOpenedFactRequests', ctrlProcesses.readAllDataOfOpenedFactRequests); // It reads all the data of the fact requests with state open and use populate to get the client and request associated
router.put('/cancelRequest', ctrlProcesses.cancelRequest); // Function to cancel a request
router.put('/closeRequest', ctrlProcesses.closeRequest); // Function to close a request
router.post('/addNewTypeOfComplaintsToRequest', ctrlProcesses.addNewTypeOfComplaintsToRequest); // Function to add a new type of complaints to a request
router.post('/addComplaintToRequest', ctrlProcesses.addComplaintToRequest); // Function to add a complaint to a request
router.post('/statisticsOfOrders', ctrlProcesses.statisticsOfFactsOfRequestsInADateRange); // Function to get statistics of requests in a date range
router.get('/getWeeklySummaryOfOrders', ctrlProcesses.getWeeklySummaryOfOrders); // Function to get the weekly summary of orders
router.get('/getMonthlySummaryOfOrders', ctrlProcesses.getMonthlySummaryOfOrders); // Function to get the monthly summary of orders
router.get('/getSummaryOfSoldProducts', ctrlProcesses.getSummaryOfSoldProducts); // Function to get the summary of sold products in the current day, month and the previous week
router.get('/getSummaryOfOpenedOrders', ctrlProcesses.getSummaryOfOpenedOrders); // Get a summary of opened orders
router.post('/addLocation', ctrlProcesses.addLocation);
router.delete('/removeLocation/:id', ctrlProcesses.removeLocation);
router.get('/locations', ctrlProcesses.locations);
router.get('/productsNotDeleted', ctrlProcesses.loadAllProductsNotDeleted);
router.put('/removeProduct/:id', ctrlProcesses.removeProduct);
router.put('/updateProduct/:id', ctrlProcesses.updateProduct);
router.post('/productsFromOrder', ctrlProcesses.getProductsFromOrder);
router.post('/financesFromOrder', ctrlProcesses.getFinancesFromOrder);
router.post('/addSoldProduct', ctrlProcesses.addSoldProduct);
router.post('/addSoldProducts', ctrlProcesses.addSoldProductsInDate);
// Administration
router.get('/allUsers', ctrlAdmin.readAllUsers); // read all the users
router.get('/allUsers/:id', ctrlAdmin.getUser); // reading one user
router.post('/createUser', ctrlAdmin.createUser); // Creating a new user
router.post('/login', ctrlAdmin.login); // Log in an user
router.post('/loginAsAdmin', ctrlAdmin.loginAsAdmin); // Log in an user as admin
router.delete('/allUsers/:id', ctrlAdmin.deleteUser);  // Deleting an user
router.put('/changePassword', ctrlAdmin.changePassword); // Changing the password of an user
module.exports = router;
