#walmart

init with : 
npm install

To run the file use :
node app.js

To access the app on localhost :
http://localhost:8000/products

To search for a keyword and get a list of products :
http://localhost:8000/products?keyword=men

Some observations about the code, in retrospective - (Upon reading up a little more on async lib)
- The code incorrectly uses async.series which just makes each call and waits for the result to move on to the next. Ideally async.forEachLimit would have suited the problem much better.
- Model classes should be declared and used for product ids as well as product data
