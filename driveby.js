var server = require('webserver');
var fs = require('fs');
var webpage = require('webpage')

//TODO: put this in arg[] to this script .. see https://github.com/ariya/phantomjs/blob/master/examples/arguments.js
//TODO: or loading it from a file (and creating if doesnot exist) driveby.json
var numberOfBrowsers = 1;
var nextPort = 9000;
var surpressPageErrors = true;
var screenshotAllSteps = true;
var screenshotFailures = true;

var started = new Date().getTime();
var pages = [];
var stubs = {};

for (var i = 0; i < numberOfBrowsers; i+=1) {
  var p = webpage.create();

  //TODO: make this a config option - surpressCommandLogging
  p.onConsoleMessage = function(msg, lineNum, sourceId) {
    console.log('CONSOLE: [' + msg + '] (from line #' + lineNum + ' in "' + sourceId + '")');
  };

  if (surpressPageErrors) { p.onError = function(msg, trace) {}; }

  pages.push(p);
}

"use strict";

//TODO: make this an argv ... maybe support multiple file inputs .... run if successful ... good for autotesting
phantom.injectJs("tests.js") ? "... done injecting tests.js!" : "... failed injecting tests.js!";

var flags = { numberOfBrowsers: pages.length };
var app = Elm.DrivebyTest.embed(document.createElement('div'), flags);

app.ports.requests.subscribe(function(request) {
//  var command = request.step.command
//  var name = command.name
//  var context = request.context
//  var page = pages[context.browserId]

  console.log(JSON.stringify(request) + "\n");

  var page = pages[0]
  var result = page.evaluateJavaScript(request.js)

  var response = { js:request.js, successful:false }
  app.ports.responses.send(response);
});

function respond(page, context, failures, result) {
  var y = Date.now()
  var x = y.toString()
//  console.log(x)
  var response = { context:context, failures:failures, updated:x, successful:result }
  //TODO: we could continue to serve locally on context.localPort, it might be interesting for debugging test failures ...
  //TODO: just need a stayOpenOnFailure
  var screenshot = page != null && (screenshotAllSteps || (screenshotFailures && failures.length > 0) )
  if (screenshot) page.render(started + '/' + context.scriptId + '/' + context.stepId + '.png')
//  if (screenshot) console.log(page.plainText)
  app.ports.responses.send(response);
}
