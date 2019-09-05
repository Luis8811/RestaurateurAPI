let express = require('express');
let router = express.Router();

let productsController = require('../controllers/products');
let mainController = require('../controllers/main');
let staffController = require('../controllers/staff');
let locationsController = require('../controllers/locations');

router.get('/', mainController.load);
router.post('/', mainController.login);
router.get('/products', productsController.products);
router.get('/administration',mainController.administration);
router.get('/contact_us', mainController.contactUs); 
router.get('/add_product', mainController.addProduct);
router.post('/add_product/', productsController.createProduct);
router.get('/staff', staffController.staff);
router.post('/add_user', staffController.createUser);
router.get('/add_user', staffController.loadPageOfAddingUser);
router.get('/delete_user/:id', staffController.deleteUser);
router.get('/change_password/:id', staffController.loadPageOfChangePassword);
router.post('/change_password/:id', staffController.changePassword);
router.get('/generic_error', mainController.loadPageOfError);
router.get('/add_location', locationsController.loadAddLocation);
router.post('/add_location', locationsController.createLocation);
router.get('/locations', locationsController.locations);
router.get('/remove_location/:id', locationsController.removeLocation);
router.get('/remove_product/:id', productsController.deleteProduct);
router.get('/update_product/:id', productsController.loadUpdateProduct);
router.post('/update_product/:id', productsController.updateProduct);
router.get('/index', mainController.loadIndex);

// Stats from perspectives
router.get('/processes_stats', mainController.processesStats);
router.get('/finances_stats', mainController.financesStats);
router.get('/staff_stats', mainController.staffStats);
router.get('/clients_stats', mainController.clientsStats);
module.exports = router;
