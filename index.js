/* Entrypoint for node module. Not used for Web IDE */
var fs = require("fs");

/* load all files in EspruinoTools... we do this so we can still
use these files normally in the Web IDE */
function loadJS(filePath) {
  console.log("Found "+filePath);
  var contents = fs.readFileSync(filePath, {encoding:"utf8"});
  return eval(contents);
  /* the code below would be better, but it doesn't seem to work when running
   CLI - works fine when running as a module. */ 
  //return require("vm").runInThisContext(contents, filePath );
}
function loadDir(dir) {
  var files = fs.readdirSync(dir);
  for (var i in files) {
    if (files[i].substr(-3)==".js")
      loadJS(dir+"/"+files[i]);
  }
}

// ---------------

function init(callback) {
  global.navigator = { userAgent : "node" };
  global.document = {};
  global.env = require('node-jsdom').env;
  global.$ = undefined;
  global.document = undefined;
  global.Espruino = undefined;

  try {
    global.acorn = require("acorn");
    acorn.walk = require("acorn/util/walk");
  } catch(e) {
    console.log("Acorn library not found - you'll need it for compiled code");
  }
  
  env("<html></html>", function (errors, window) {
    // Fixing up with fake web browser
    $ = require('jquery')(window);        
    global.XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
    $.support.cors = true;
    $.ajaxSettings.xhr = function() {
        return new XMLHttpRequest();
    };
    document = window.document;
  
    // Load each JS file...
    // libraries needed by the tools
    loadDir(__dirname+"/libs");
    // the 'main' file
    Espruino = loadJS(__dirname+"/espruino.js");
    // Core features
    loadDir(__dirname+"/core");
    // Various plugins
    loadDir(__dirname+"/plugins");
  
    // Bodge up notifications
    Espruino.Core.Notifications = {
      success : function(e) { log(e); },
      error : function(e) { console.error(e); },
      warning : function(e) { console.warn(e); },
      info : function(e) { console.log(e); }, 
    };
  
    // Finally init jQuery, which will init espruino.js
    $(callback);
  });
};

/** Initialise EspruinoTools and call the callback.
 When the callback is called, the global variable 'Espruino'
 will then contain everything that's needed to use EspruinoTools */
exports.init = init;

/** Send a file to an Espruino on the given port, call the callback when done */
exports.sendFile = function(port, filename, callback) {
  var code = fs.readFileSync(filename, {encoding:"utf8"});
  init(function() {
    Espruino.Core.Serial.startListening(function(data) { });
    Espruino.Core.Serial.open(port, function(status) {
      if (status === undefined) {
        console.error("Unable to connect!");
        return callback();
      }
      Espruino.callProcessor("transformForEspruino", code, function(code) {
        Espruino.Core.CodeWriter.writeToEspruino(code, function() {
          setTimeout(function() {
            Espruino.Core.Serial.close();
          }, 500);
        }); 
      });
    }, function() { // disconnected
      if (callback) callback();
    });
  });
};

/** Execute an expression on Espruino, call the callback with the result */
exports.expr = function(port, expr, callback) {
  var exprResult = undefined;
  init(function() {
    Espruino.Core.Serial.startListening(function(data) { });
    Espruino.Core.Serial.open(port, function(status) {
      if (status === undefined) {
        console.error("Unable to connect!");
        return callback();
      }
      Espruino.Core.Utils.executeExpression(expr, function(result) { 
        setTimeout(function() {
          Espruino.Core.Serial.close();
        }, 500);
        exprResult = result;
      });
    }, function() { // disconnected
      if (callback) callback(exprResult);
    });
  });
};


/** Flash the given firmware file to an Espruino board. */
exports.flash = function(port, filename, callback) {
  var code = fs.readFileSync(filename, {encoding:"utf8"});
  init(function() {
    Espruino.Core.Serial.startListening(function(data) { });
    Espruino.Core.Serial.open(port, function(status) {
      if (status === undefined) {
        console.error("Unable to connect!");
        return callback();
      }
      Espruino.Core.Flasher.flashBinaryToDevice(fs.readFileSync(filename, {encoding:"binary"}), function(err) {
        console.log(err ? "Error!" : "Success!");
        setTimeout(function() {
          Espruino.Core.Serial.close();
        }, 500);
      });
    }, function() { // disconnected
      if (callback) callback();
    });
  });
};