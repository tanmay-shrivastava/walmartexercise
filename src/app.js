const fs = require('fs');
const express = require('express');
const request = require('request');
const Promise = require('promise');
const API_URL = 'http://api.walmartlabs.com/v1/items/{productId}?format=json&apiKey=kjybrqfdgp3u4yv2qzcnjndj';

var getProductIds = function () {
  return new Promise(function (resolve, reject) {
    fs.readFile('data/productIds.csv', 'utf8', function (err, data) {
      if (err) {
        reject(err);
      }
      else {
        var ids = data.split(',\n');
        ids[ids.length - 1] = ids[ids.length - 1].replace(/,/g, '');
        resolve(ids);
      }
    });
  });
};

var getProductDescriptions = function (productIds) {
  return new Promise(function (resolve, reject) {
    var products = {};
    var getNextDescription = function (i) {
      if (i >= productIds.length) {
        resolve(products);
      }
      else {
        request(API_URL.replace(/\{productId}/, productIds[i]), function (err, res, body) {
          if (err) {
            reject(err);
          }
          else if (200 == res.statusCode) {
            var product = JSON.parse(body);
            products[productIds[i]] = {
              shortDescription: product['shortDescription'].toLowerCase(),
              longDescription: product['longDescription'].toLowerCase(),
              categoryPath: product['categoryPath'].toLowerCase()
            };
            setTimeout(function () {getNextDescription(i + 1)}, 100);
          }
          else {
            reject(res.statusCode);
          }
        });
      }
    };

    getNextDescription(0);
  });
};

var productIdsWithKeyword = function (products, keyword) {
  var productIds = [];

  keyword = keyword.toLowerCase();
  for (var id in products) {
    if (products.hasOwnProperty(id) &&
       (0 <= products[id].shortDescription.indexOf(keyword) ||
        0 <= products[id].longDescription.indexOf(keyword) ||
        0 <= products[id].categoryPath.indexOf(keyword))) {
      productIds.push(id);
    }
  }

  return productIds;
};

(function () {
  console.log('Getting data for products in csv...');
  getProductIds()
    .then(getProductDescriptions, function (err) {
      console.log(err);
    })
    .then(function (products) {
      var app = express();
      app.get('/search/:keyword', function (req, res) {
        res.send(JSON.stringify(productIdsWithKeyword(products, req.params.keyword)));
      });
      app.listen(3000, function () {
        console.log('Done... Listening on port 3000...');
        console.log('Client URL: http://localhost:3000/search/{keyword}');
      });
    }, function (err) {
      console.log(err);
    });
}());
