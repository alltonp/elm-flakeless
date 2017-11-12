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
//TODO: rename app to flakeless etc
//TODO: optional pass in a contains filter to run e.g "01"
phantom.injectJs("tests.js") ? "... done injecting tests.js!" : "... failed injecting tests.js!";

var flags = { numberOfBrowsers: pages.length };
var app = Elm.DrivebyTest.embed(document.createElement('div'), flags);

//TODO: create/destroy browser should probably be commands too (just be sure not in use)
app.ports.requests.subscribe(function(request) {
  console.log("\n> " + JSON.stringify(request));

  var context = null;
  var page = pages[0];

  eval(request.js);
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
