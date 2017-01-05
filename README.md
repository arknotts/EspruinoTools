Espruino Tools
==============

This repository contains a set of tools for the [Espruino JavaScript Interpreter](http://www.espruino.com).

While it is used directly by the [Espruino Web IDE](http://www.github.com/espruino/EspruinoWebIDE), there are also simple command-line and `node.js` interfaces.


Command-line
------------

When installed as a Node module with `npm install -g espruino` you get a command-line tool called `espruino`:

```
USAGE: espruino ...options... [file_to_upload.js]

  -h,--help                : Show this message
  -j [job.json]            : Make or load options from JSON 'job file' section
  -c,--color               : Color mode,
  -v,--verbose             : Verbose
  -q,--quiet               : Quiet - apart from Espruino output
  -m,--minify              : Minify the code before sending it
  -w,--watch               : If uploading a JS file, continue to watch it for
                               changes and upload again if it does.
  -p,--port /dev/ttyX      
  -p,--port aa:bb:cc:dd:ee : Specify port(s) or device addresses to connect to
  -b baudRate              : Set the baud rate of the serial connection
                               No effect when using USB, default: 9600
  --no-ble                 : Disable Bluetooth Low Energy (used by default if the 'bleat' module exists)
  --list                   : List all available devices and exit
  -t,--time                : Set Espruino's time when uploading code
  -o out.js                : Write the actual JS code sent to Espruino to a file
  -f firmware.bin          : Update Espruino's firmware to the given file
                               Espruino must be in bootloader mode
                               Optionally skip N first bytes of the bin file,
  -e command               : Evaluate the given expression on Espruino
                               If no file to upload is specified but you use -e,
                               Espruino will not be reset
#
If no file, command, or firmware update is specified, this will act
as a terminal for communicating directly with Espruino. Press Ctrl-C
twice to exit.
```

For instance:

```
# Connect to Espruno and act as a terminal app  (IF Espruino is the only serial port reported)
espruino

# Connect to Espruino on the specified port, act as a terminal
espruino -p /dev/ttyACM0

# Write a program to Espruino (IF Espruino is the only serial port reported)
espruino myprogram.js

# Otherwise you'll want to specify the exact port first
espruino -p /dev/ttyACM0 myprogram.js

# Write a program to Espruino and drop into a terminal, but then monitor
# myprogram.js for changes and upload it again
espruino --watch myprogram.js

# Load a file into two Espruino boards
espruino -p /dev/ttyACM1 /dev/ttyACM2 mycode.js

# Load a file into Espruino and save
espruino -p /dev/ttyACM0 mycode.js -e "save()"

# Execute a single command on the default serial device
espruino -e "digitalWrite(LED1,1);"
```


Bluetooth
----------

If the NPM module `noble` is installed, it'll be used to scan for Bluetooth LE UART devices like [Puck.js](http://puck-js.com). It's an optional dependency, so will be installed if possible - but if not you just won't get BLE support.

If it is installed and you don't want it, you can use `./espruino --no-ble` to disable it for the one command, or can remove the module with `npm remove noble`.

On linux, you'll need to run as superuser to access Bluetooth Low Energy. To avoid this you need to give node.js the relevant privileges with:

```
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```


NPM Module
----------

This is the NPM module [`espruino`](https://www.npmjs.com/package/espruino).

Once installed with `npm install -g espruino` it contains the following functions:

```
var esp = require("espruino");

/** Initialise EspruinoTools and call the callback.
 When the callback is called, the global variable 'Espruino'
 will then contain everything that's needed to use EspruinoTools */
esp.init(callback);

/** Send a file to an Espruino on the given port, call the callback when done (calls 'init' automatically) */
esp.sendFile (port, filename, callback);

/** Execute an expression on Espruino, call the callback with the result (calls 'init' automatically) */
esp.expr(port, expr, callback(result));

/** Flash the given firmware file to an Espruino board (calls 'init' automatically) */
esp.flash(port, filename, callback);
```

For example, to get the current temperature of the board you can do:

```
require('espruino').expr('/dev/ttyACM0', 'E.getTemperature()', function(temp) {
        console.log('Current temperature is '+temp);
});
```

**Note:** this module is currently prints a lot of debug
information to `console.log` when working.

If you want to set specific options, for example Baud rate, initialise everything explicitly with `init`, set the options, and then call the function you need:

```
var esp = require("espruino");
esp.init(function() {
  Espruino.Config.BAUD_RATE = "115200";
  esp.sendFile(port, filename, function() {
    console.log('Done!');
  })
});
```

Job File
--------
A job file simplifies specifying the command-line and provides a future record of the run setup. Specifying the -j option without a job file name will generate a job file automatically using the given JS code file as the base name and any commandline arguments specified.

For example,
  espruino -j -t -w test.js; // will create test.json

The following table provides a guide for setting configuration fields, but consult the code for certainty. Module/pluggin values generally override other keys. It is not necessary to include any fields except the ones you want.

| Commandline Argument | JSON Key *1,2*         | Module/Pluggin *2,3*                               |        
| -------------------- | --------------         | --------------------                               |
| file_to_upload.js    | file ("")              |                                                    |
| -b baudrate          | baudRate (0)           | BAUD_RATE (9600)                                   |
| -c                   | color (false)          |                                                    |
| -e command           | expr ("")              |                                                    |
| -f firmware.bin      | updateFirmware ("")    |                                                    |
|                      | firmwareFlashOffset(0) |                                                    |
| --list               | showDevices (false)    |                                                    |
| -m,-minify           | minify (false)         | MINIFICATION_LEVEL ("")                            |
|                      |                        | MINIFICATION_Mangle (true) *4*                     |
|                      |                        | MINIFICATION_Unreachable (true) *4*                |
|                      |                        | MINIFICATION_Unused (true) *4*                     |
|                      |                        | MINIFICATION_Literal (true) *4*                    |
|                      |                        | MINIFICATION_DeadCode (true) *4*                   |
| -no-ble              | no-ble (false)         | BLUETOOTH_LOW_ENERGY (true)                        |
| -o out.js            | outputJS ("")          |                                                    |
| -p,--port /dev/ttyX  | ports ([""])           |                                                    |
| -q,--quiet           | quiet (false)          |                                                    |
| -t,--time            | setTime (false)        | SET_TIME_ON_WRITE (false)                          |
| -v,--verbose         | verbose (false)        |                                                    |
| -w,--watch           | watchFile (false)      |                                                    |
|                      |                        | BOARD_JSON_URL ("http://www.espruino.com/json")    |
|                      |                        | COMPILATION (true)                                 |
|                      |                        | COMPILATION_URL ("http://www.espruino.com:32766")  |
|                      |                        | ENV_ON_CONNECT (true)                              |
|                      |                        | MODULE_AS_FUNCTION (false)                         |
|                      |                        | MODULE_EXTENSIONS (".min.js|.js")                  |
|                      |                        | MODULE_MINIFICATION_LEVEL ("")                     |
|                      |                        | MODULE_URL ("http://www.espruino.com/modules") *5* |
|                      |                        | NPM_MODULES (false)                                |
|                      |                        | RESET_BEFORE_SEND (true)                           |
|                      |                        | SAVE_ON_SEND (0)                                   |
|                      |                        | SERIAL_AUDIO (0)                                   |
|                      |                        | SERIAL_TCPIP ("")                                  |
|                      |                        | SERIAL_THROTTLE_SEND (false)                       |
|                      |                        | STORE_LINE_NUMBERS (true)                          |
|                      |                        | UI_MODE ("Normal")                                 |
|                      |                        | WEB_BLUETOOTH (true)                               |

Notes:
  1. JSON keys equate to internal *args* variable keys.
  2. Default values shown in parentheses or see configDefaults.json file under node_modules/espruino folder. Check code directly for issues.
  3. Recommended for advanced users only. Module and plugin keys equate to internal *Espruino.Config* variable keys stored in job file as subkeys under *espruino* key. Consult code for possible values.
  4. Minification parameters only work if level set, e.g. MINIFICATION_LEVEL: "ESPRIMA".
  5. MODULE_URL accepts a pipe delimited (|) list of URLS, including local servers and absolute or relative paths based on the code file. For example, "../../modules|http://localhost:8080/modules|http://www.espruino.com/modules" will first look in the module folder located two folders up from the code, then query the localhost server, and then look in the Espruino repository.

Internals
---------

This isn't well documented right now, but basically:

* You have a bunch of source files that are automatically loaded by `index.js`
* These add things to `Espruino.Core` or `Espruino.Plugins`
* They also register themselves as `processors` with `Espruino.addProcessor`. For instance you might register for `"transformForEspruino"` in which case you can do something to the JS code before it's finally sent to Espruino.
* You then call into `Espruino.Core.X` or `Espruino.Plugins.Y` to do what you want

It's not ideal for node.js, but was designed to run in the Web browser for the [Espruino Web IDE](http://www.github.com/espruino/EspruinoWebIDE)


Contributing
------------

Contributions would he hugely appreciated - sadly I'm stretched a bit thin with Espruino, Espruino's modules, the Web IDE and forum, so this isn't getting the love it deserves.

Please be aware that the Espruino Web IDE (and even [a truly online version of the Web IDE](http://espruino.github.io/EspruinoWebIDE/) depend heavily this code - so try not to do anything that will break them).

### Code Style

 * Please stick to a [K&R style](http://en.wikipedia.org/wiki/1_true_brace_style#K.26R_style) with no tabs and 2 spaces per indent
 * Filenames should start with a lowerCase letter, and different words should be capitalised, not split with underscores

### Code Outline

 * Core functionality goes in `core`, Plugins go in `plugins`. See `plugins/_examplePlugin.js` for an example layout
 * Serial port handlers are a special case - they just add themselves to the `Espruino.Core.Serial.devices` array when loaded.
 * Plugins/core need to implement in init function, which is called when the document (and settings) have loaded.
 * Plugins can respond to specific events using `Espruino.addProcessor`. For instance you can use `Espruino.addProcessor("transformForEspruino", function (data,callback) { .. })` and can modify code before it is sent to Espruino. Events types are documented at the top of `espruino.js`
 * Config is stored in `Espruino.Config.FOO` and is changed with `Espruino.Config.set("FOO", value)`. `Espruino.Core.Config.add` can be used to add an option to the Settings menu.


RELATED
-------

There are other tools available to program Espruino:

* (Recommended) The [Espruino Web IDE](http://www.github.com/espruino/EspruinoWebIDE) (Google Chrome)
* [Online version of the Web IDE](http://espruino.github.io/EspruinoWebIDE/) (any browser - limited to serial over audio or Web Bluetooth)
* [espruino-cli](https://www.npmjs.org/package/espruino-cli) (node.js)
* [node-espruino](https://www.npmjs.com/package/node-espruino) (node.js)
* [grunt-espruino](https://www.npmjs.com/package/grunt-espruino) (node.js)
* [espruino](https://github.com/olliephillips/espruingo) (Go)

*Note:* while other tools exist, this EspruinoTools module and the Web IDE which uses it are maintained alongside the Espruino firmware, and tend to have support for various features and edge cases that other tools might not.
