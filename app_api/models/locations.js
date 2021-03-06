var mongoose = require( 'mongoose' );

// Schema of the collection of clients
var clientSchema = new mongoose.Schema({
    name: {type: String, required: true, maxlength: 30},
    sex: {type: String, required: true, maxlength: 1}, 
    birthdate: {type: Date, required: true},
    registration_date: {type: String, required: true}, 
    telephone: {type: String, required: false},
    email: {type: String, required: false}
});

// Schema of the fact of the registered clients on a day
// FIXME Arreglar el tipo de dato del campo date, he puesto String para poder realizar las búsquedas con find 
var factRegisteredClientSchema = new mongoose.Schema({
   date: {type: String, required: true},
   registeredClients: [mongoose.Schema.Types.ObjectId],
   count: {type: Number, required: true, min: 0}
});

// Schema of the collection of products
var productSchema = new mongoose.Schema({
    name: {type: String, required: true, maxlength: 30},
    price: {type: Number, required: true, default:0}, 
    description: {type: String, maxlength: 50},
    cost: {type: Number, default:0, required: true},
    type: {type: String, required: true, maxlength: 30},
    isDeleted: {type: Boolean, default: false}
});

// Schema of the collection of requests
var requestSchema = new mongoose.Schema({
    products: {type: [mongoose.Schema.Types.ObjectId], required: true},
    description: {type: String, maxlength: 200},
    origin: {type: String, maxlength: 200},
    state: {type: String, maxlength: 200}
});

// Schema of the collection of workers
var workerSchema = new mongoose.Schema({
    name: {type: String, required: true, maxlength: 30},
    sex: {type: String, required: true, maxlength: 1}, 
    identification: {type: String, required: true, maxlength: 20},
    job_title: {type: String, required: true, maxlength: 20}
});

// Schema of the collection of complaints and claims
var complaintsAndClaimsSchema = new mongoose.Schema({
   category: {type: String, required: true, maxlength: 15},
   type: {type: String, required: true, maxlength: 30},
   text: {type: String, required: true, maxlength: 70}
});

// Schema of the collection of users
var usersSchema = new mongoose.Schema({
   user: {type: String, required: true, unique: true},
   password: {type: String, required: true},
   type: {type: String, required: true}
});

// Schema of the collection of facts of clients 
var factNewClientsSchema = new mongoose.Schema({
    date: {type: Date, required: true, unique: true},
    count: {type: Number, required: true, min: 0, default: 0}
});

// Schema of the collection of facts of complaints and claims 
var factComplaintsAndClaimsSchema = new mongoose.Schema({
  date: {type: String, required: true},
  time: {type: String, required: true},
  worker_id: {type: mongoose.Schema.Types.ObjectId, required: true},
  complaints_and_claims_id: {type: mongoose.Schema.Types.ObjectId, required: true},
  request_id: {type: mongoose.Schema.Types.ObjectId, required: true}
});

// Schema of the collection of facts of requests
var factRequestSchema = new mongoose.Schema({
   date: {type: String, required: true},
   time: {type: String, required: true},
   // client_id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Client'},
   request_id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Request'},
   state: {type: String}
});

// Schema of the collection of facts of sold products
var factSoldProductSchema = new mongoose.Schema({
   date: {type: String, required: true}, 
   product_id: {type: mongoose.Schema.Types.ObjectId, required: true, ref: 'Product'},
   count: {type: Number, required: true, default: 0}
});

// Schema of the collection of facts of finances
var factFinanceSchema = new mongoose.Schema({
   date: {type: String, required: true},
   income: {type: Number, required: true, min: 0},
   balance: {type: Number, required: true, min: 0},
   cost: {type: Number, required: true, min: 0}
});

// Schema of the collection of locations
let locationsSchema = new mongoose.Schema({
   name: {type: String, required: true, unique: true},
});



// Compiling schemas

mongoose.model('Client', clientSchema); 
mongoose.model('Worker', workerSchema);
mongoose.model('Product', productSchema);
mongoose.model('Fact_new_client', factNewClientsSchema);
mongoose.model('Fact_registered_client', factRegisteredClientSchema, 'fact_registered_clients');
mongoose.model('ComplaintsAndClaims', complaintsAndClaimsSchema, 'complaints_and_claims');
mongoose.model('Fact_complaints_and_claims', factComplaintsAndClaimsSchema, 'fact_complaints_and_claims');
mongoose.model('Request', requestSchema);
mongoose.model('Fact_request', factRequestSchema, 'fact_requests');
mongoose.model('Fact_sold_product', factSoldProductSchema, 'fact_sold_products');
mongoose.model('Fact_finance', factFinanceSchema, 'fact_finances');
mongoose.model('User', usersSchema);
mongoose.model('Location', locationsSchema);
