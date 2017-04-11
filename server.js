var express = require('express');
var request = require('request');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var flash = require('express-flash');
var handlebars = require('express-handlebars')
var bodyParser = require('body-parser');
var app = express();
var port = process.env.PORT || 8080;

// set the view engine to ejs
app.set('view engine', 'ejs');

var sessionStore = new session.MemoryStore;

app.use(bodyParser.urlencoded({extended: true}))
// use res.render to load up an ejs view file

app.use( express.static( "public" ) );

app.use(cookieParser('secret'));
app.use(session({
    cookie: { maxAge: 60000 },
    store: sessionStore,
    saveUninitialized: true,
    resave: 'true',
    secret: 'secret'
}));
app.use(flash());


app.use(function(req, res, next){
    // if there's a flash message in the session request, make it available in the response, then delete it
    res.locals.sessionFlash = req.session.sessionFlash;
    delete req.session.sessionFlash;
    next();
});

// index page 
app.get('/', function(req, res) {
	var url  =  "https://petshelternew.herokuapp.com/pets";
	request.get(url, function(err, response, data) {
        if (!err && response.statusCode == 200) {
			console.log(data);
			res.render('pages/index', {
               petsAll: JSON.parse(data) 
            });
        }
    });
});

// view page 
/*res.render('pages/petview', {
						petInfo: JSON.parse(data) 
				  });
				  */
app.get('/petview/:id', function(req, res) { 
       if (!req.params.id) { 
           res.status(500); 
           res.send({"Error": "Looks like you are not sending the  id to get the pet details."}); 
           console.log("Looks like you are not sending the  id to get the pet details."); 
       }
	  request.get({ url: "https://petshelternew.herokuapp.com/pets/"+ req.params.id },      function(error, response, data) { 
              if (!error && response.statusCode == 200) { 
					petInfo = JSON.parse(data) 
				    console.log(petInfo.latitude);
					console.log(petInfo.longitude);
					forecastUrl = 'https://api.darksky.net/forecast/6c459a88a6094fb2bd46d7e8678171fc/'+petInfo.latitude+','+petInfo.longitude;
					 request.get({uri:forecastUrl, timeout:2500}, function (err, resp, forecastData) {
							if (err) {
							  //callback(err);
							} else {
							  weatherInfo = JSON.parse(forecastData);
							  var weatherCondition = weatherInfo.currently.summary;
							  //callback(null, res, data);
							res.render('pages/petview', {
									petInfo: JSON.parse(data),
									weatherCondition : weatherCondition	
							  });	
							}
						  });
						
                 } 
             }); 
     }); 
// Add page 
app.get('/addPet', function(req, res) {
    res.render('pages/addpet',{ expressFlash: req.flash('error'), sessionFlash: res.locals.sessionFlash });
});

app.post('/savePet', function(req, res) {
    //var jsonObj = JSON.parse(req.body);
	console.log(req.body);
	errorInfo:'';
	request.post({
        headers: {'content-type':'application/json'},
        url:'https://petshelternew.herokuapp.com/pets/',
        form:req.body
    },function(error, response, html){
		
		if (!error && response.statusCode == 200) { 
			//res.redirect("/");
			req.session.sessionFlash = {
					type: 'sucess',
					message: 'Successfully Added Pet'
			}
			return res.redirect("/");
		}
		if (response.statusCode == 500) { 
			
			req.session.sessionFlash = {
					type: 'error',
					message: html
			}
			return res.redirect('/addPet');
		}
		else {
			req.session.sessionFlash = {
					type: 'error',
					message: error
			}
			return res.redirect("/");
		}
		
  });
});

app.listen(port);
console.log('Pet Weather is connected');