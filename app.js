
//All requires
const Hapi = require('hapi');
const fs = require('fs');
const request = require('request');
const async = require('async');

//Globals :(, ideally in separate model/products and model/productData
const METADATA_API_URL = 'http://api.walmartlabs.com/v1/items/__productId__?format=json&apiKey=kjybrqfdgp3u4yv2qzcnjndj';
var ids = []; //an array of ids we are handling
var productData = {}; //associative array of id : meta data

//Hapi boilerplate code taken from http://hapijs.com/tutorials

// Create a server with a host and port
const server = new Hapi.Server();
server.connection({ 
    host: 'localhost', 
    port: 8000 
});


// Add the route handlers
// Plan to create a REST api /products which will be searched with 
// query param keyword, like http://localhost:8000/products?keyword=men

server.route({
    method: 'GET',
    path:'/products', 
    handler: function (request, reply) {
        //If it has a query param keyword try to search
        if (request.query.keyword) { 
            console.log("Searching for " + request.query.keyword);
            var matchedIds = Object.keys(productData).filter(function(id, callback) {
                //console.log("ID : " + id + " desc -" + productData[id].shortDescription);
                return productData[id].shortDescription.search(request.query.keyword) >= 0;
            })
            if(matchedIds.length > 0) {
                return reply("These product ids matched :" + matchedIds.toString());
            } else {
                return reply("No ids matched");
            }
        }

        //For all else just return all ids
        return reply("All ids : " + ids.toString()); //preferrably json
    }
});

//function to make api requests
const makeApiRequest = function(id, callback) {
  request(METADATA_API_URL.replace("__productId__", id), function (err, res, body) {
    if (err) {
      console.log("Error when calling the api for the product id : " + id);
    }
    else if (200 == res.statusCode) {
      productData[id] = JSON.parse(body);
      console.log("Parsed response for id : " + id);
      //console.log("Description for id : " + id + " is - " + productData[id].shortDescription)
      callback();
    }
  });
}

//Get the item ids from the file and spwan a series of meta data requests asynchronously
fs.readFile(__dirname + '/data/items.csv', 'utf8', function (err, data) {
    if (err) {
        console.log("Somethig went wrong while reading the data. Aborting!");
        throw err;
    }
    ids = data.split(',\n');
    var last = ids.length - 1;
    ids[last] = ids[last].replace(/,/g, '');

    //Since the API requires to be called in series
    async.eachSeries(ids,
          makeApiRequest,
          function(err) {
                if(err) {
                    console.log("Could not complete all the requests for meta data");
                } else {
                    console.log("All meta data requests complete!!!! Yay!");
                }
                
          });
    
});

// Start the server
server.start((err) => {

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});



