var server = require('webserver');
var fs = require('fs');
var webpage = require('webpage')

//TODO: put this in arg[] to this script .. see https://github.com/ariya/phantomjs/blob/master/examples/arguments.js
//TODO: or loading it from a file (and creating if doesnot exist) driveby.json
var numberOfBrowsers = 1;
var nextPort = 9000;
var suppressPageErrors = true;
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
  console.log(JSON.stringify(request));

  var page = pages[0]
  var result = page.evaluateJavaScript(request.js)

  var response = { js:request.js, successful:false }
  app.ports.responses.send(response);
});
