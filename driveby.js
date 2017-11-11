var server = require('webserver');
var fs = require('fs');
var webpage = require('webpage')

//TODO: put this in arg[] to this script .. see https://github.com/ariya/phantomjs/blob/master/examples/arguments.js
//TODO: or loading it from a file (and creating if doesnot exist) driveby.json
var numberOfBrowsers = 1;
var nextPort = 9000;
var suppressPageErrors = false;
var screenshotAllSteps = true;
var screenshotFailures = true;

var started = new Date().getTime();
var pages = [];
var stubs = {};

for (var i = 0; i < numberOfBrowsers; i+=1) {
  var p = webpage.create();

  //TODO: make this a config option - suppressCommandLogging
  p.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: [' + msg + '] (from line #' + lineNum + ' in "' + sourceId + '")');
  };

  if (suppressPageErrors) { p.onError = function(msg, trace) {}; }

  pages.push(p);
}

"use strict";

//TODO: make this an argv ... maybe support multiple file inputs .... run if successful ... good for autotesting
phantom.injectJs("tests.js") ? "... done injecting tests.js!" : "... failed injecting tests.js!";

var flags = { numberOfBrowsers: pages.length };
var app = Elm.DrivebyTest.embed(document.createElement('div'), flags);

//TODO: create/destroy browser should probably be commands too (just be sure not in use)
app.ports.requests.subscribe(function(request) {
  console.log("\n> " + JSON.stringify(request));

  var page = pages[0];

//  var x = "function(){ page." + request.js + "; }"
//  console.log("eval:" + x);
//  var result = eval(x)

// var x = 'function(){ this.open(\"http://www.google.com\", function(status) { console.log(status); }); }'
//  var result = page.evaluateJavaScript('"' + request.js + '"');

 //TIP: so things work on document, console etc ... but not on page
// var result = page.evaluateJavaScript(request.js);

 //try raw eval
// var result = eval("function(){ page.open('http://www.google.com', function(status) { console.log(status); }) }");
// var result = eval("page.open('http://www.google.com', function(status) { console.log(status); })");


//                             if (status !== 'success') { respond(page, context, [status + ' for ' + url]) } \
//                             else { respond(page, context, []) } \

       //this works ... could we bend all of these in on init?
       //the \ are very important for some reason
       //could code all the scripts up ...
//       var gotoScript = "function goto(page, context, url) { \
//                           page.open(url, function(status) { \
//                             if (status !== 'success') { respond(page, context, [status + ' for ' + url]) } \
//                             else { respond(page, context, []) } \
//                           }); \
//                         }"
       var gotoScript = "function goto(page, context, url) { page.open(url, function(status) { if (status !== 'success') { respond(page, context, [status + ' for ' + url]) } else { respond(page, context, []) } }); }"

//       eval(gotoScript);
//       eval('goto(page, null, "http://www.google.com");');


    console.log("\njs :[" + gotoScript + "]");
    console.log("\nelm:[" + request.js + "]");

    var result = "N/A"


 eval(request.js);

 console.log("eval done!")

 page.render(started + '/' + 999 + '/' + 1 + '.png')

  console.log("< " + JSON.stringify(result) + "\n");

  var response = { js:request.js, successful:true };
  app.ports.responses.send(response);
});

function respond(page, context, failures) {
  console.log("responding ... ");

  var y = Date.now()
  var x = y.toString()
//  console.log(x)
  var response = { context:context, failures:failures, updated:x, successful:true, js:"js" }
  //TODO: we could continue to serve locally on context.localPort, it might be interesting for debugging test failures ...
  //TODO: just need a stayOpenOnFailure
  var screenshot = page != null && (screenshotAllSteps || (screenshotFailures && failures.length > 0) )
  if (screenshot) page.render(started + '/' + 999 + '/' + 1 + '.png')
//  if (screenshot) console.log(page.plainText)
  app.ports.responses.send(response);
}
