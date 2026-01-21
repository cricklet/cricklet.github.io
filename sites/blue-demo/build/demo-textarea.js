/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	var _regenerator = __webpack_require__(1);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _asyncToGenerator2 = __webpack_require__(5);
	
	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	var _wu = __webpack_require__(127);
	
	var _applier = __webpack_require__(129);
	
	var _inferrer = __webpack_require__(131);
	
	var Inferrer = _interopRequireWildcard(_inferrer);
	
	var _transformer = __webpack_require__(132);
	
	var Transformer = _interopRequireWildcard(_transformer);
	
	var _ot_client_model = __webpack_require__(133);
	
	var _ot_server_model = __webpack_require__(141);
	
	var _simulated_controller = __webpack_require__(153);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function getValuesFromDOMTextbox($text) {
	  return [$text.val(), $text.prop("selectionStart"), $text.prop("selectionEnd")];
	}
	
	function updateDOMTextbox($text, state) {
	  // cursorStart: number, cursorEnd: number
	  $text.val(state.text);
	  $text.prop("selectionStart", state.cursor.start), $text.prop("selectionEnd", state.cursor.end);
	}
	
	function setupClient(client, $text, emit) {
	  var lock = { ignoreEvents: false };
	
	  var update = function update() {
	    // update the dom
	    lock.ignoreEvents = true;
	    updateDOMTextbox($text, client.state);
	    lock.ignoreEvents = false;
	  };
	
	  client.addChangeListener(function () {
	    return update();
	  });
	
	  $text.on('keyup mousedown mouseup', function () {
	    var _getValuesFromDOMText = getValuesFromDOMTextbox($text),
	        _getValuesFromDOMText2 = (0, _slicedToArray3.default)(_getValuesFromDOMText, 3),
	        newText = _getValuesFromDOMText2[0],
	        newCursorStart = _getValuesFromDOMText2[1],
	        newCursorEnd = _getValuesFromDOMText2[2];
	
	    // handle new cursor
	
	
	    client.state.cursor.start = newCursorStart;
	    client.state.cursor.end = newCursorEnd;
	
	    update();
	  });
	  $text.on('input propertychange change onpaste', function () {
	    if (lock.ignoreEvents) {
	      return;
	    }
	
	    var _getValuesFromDOMText3 = getValuesFromDOMTextbox($text),
	        _getValuesFromDOMText4 = (0, _slicedToArray3.default)(_getValuesFromDOMText3, 3),
	        newText = _getValuesFromDOMText4[0],
	        newCursorStart = _getValuesFromDOMText4[1],
	        newCursorEnd = _getValuesFromDOMText4[2];
	
	    // handle new text
	
	
	    var editOps = Inferrer.inferOperation(client.state.text, newText);
	    if (editOps != null) {
	      var _update = client.performEdit(editOps);
	      if (_update != null) {
	        emit(_update);
	      }
	    }
	
	    // handle new cursor
	    client.state.cursor.start = newCursorStart;
	    client.state.cursor.end = newCursorEnd;
	
	    update();
	  });
	}
	
	function createServerDOM(title) {
	  var $server = $('<div class="computer">\n    <h4>' + title + '</h4>\n    <textarea readonly class="text" rows="4" cols="50"></textarea>\n    <div>~ <input type="number" class="delay" value="500"> ms latency</div>\n  </div>');
	
	  var $text = $server.find('.text');
	  var $delay = $server.find('.delay');
	  var $drop = $server.find('.drop');
	
	  return [$server, $text, $delay];
	}
	
	function createClientDOM(title, randomizeChecked) {
	  randomizeChecked = randomizeChecked ? 'checked' : '';
	
	  var $client = $('<div class="computer">\n    <h4>' + title + ' <span class="converging ellipses"></span></h4>\n  \t<textarea class="text" rows="4" cols="50"></textarea>\n  \t<div><input type="checkbox" ' + randomizeChecked + ' class="randomize"> randomly edit</div>\n  \t<div><input type="checkbox" checked class="online"> online</div>\n  </div>');
	  var $text = $client.find('.text');
	  var $randomize = $client.find('.randomize');
	  var $online = $client.find('.online');
	
	  animateEllipses($client);
	
	  return [$client, $text, $online, $randomize];
	}
	
	var WORDS = ["lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "nullam", "sit", "amet", "nulla", "non", "est", "finibus", "mollis", "nulla", "in", "felis", "eu", "felis", "vehicula", "viverra", "id", "lobortis", "massa", "aliquam", "mi", "dolor", "aliquet", "a", "volutpat", "vitae", "porta", "tempor", "eros", "vestibulum", "sit", "amet", "commodo", "ex", "vestibulum", "ante", "ipsum", "primis", "in", "faucibus", "orci", "luctus", "et", "ultrices", "posuere", "cubilia", "curae", "in", "dapibus", "sollicitudin", "est", "vel", "convallis", "class", "aptent", "taciti", "sociosqu", "ad", "litora", "torquent", "per", "conubia", "nostra", "per", "inceptos", "himenaeos"];
	
	function pickRandom(arr) {
	  var i = Math.floor(Math.random() * arr.length);
	  return arr[i];
	}
	
	function addWord(text) {
	  var words = text.split(' ');
	  var word = pickRandom(WORDS);
	  var i = Math.floor(Math.random() * words.length);
	  return (0, _utils.insert)(words, word, i).join(' ');
	}
	
	function deletePortion(text) {
	  var words = text.split(' ');
	  var i = Math.floor(Math.random() * words.length);
	  return (0, _utils.remove)(words, i).join(' ');
	}
	
	function randomlyAdjustText($text, shouldRandomize, randomizeDelay) {
	  var _this = this;
	
	  ;(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
	    return _regenerator2.default.wrap(function _callee$(_context) {
	      while (1) {
	        switch (_context.prev = _context.next) {
	          case 0:
	            if (false) {
	              _context.next = 11;
	              break;
	            }
	
	            if (!shouldRandomize.enabled) {
	              _context.next = 7;
	              break;
	            }
	
	            if (Math.random() > 0.4) {
	              $text.val(addWord($text.val()));
	              $text.trigger("change");
	            } else {
	              $text.val(deletePortion($text.val()));
	              $text.trigger("change");
	            }
	            _context.next = 5;
	            return (0, _utils.asyncWait)(randomizeDelay);
	
	          case 5:
	            _context.next = 9;
	            break;
	
	          case 7:
	            _context.next = 9;
	            return (0, _utils.asyncWait)(1000);
	
	          case 9:
	            _context.next = 0;
	            break;
	
	          case 11:
	          case 'end':
	            return _context.stop();
	        }
	      }
	    }, _callee, _this);
	  }))();
	}
	
	function animateEllipses($el) {
	  var _this2 = this;
	
	  var $ellipses = $el.find('.ellipses');
	
	  ;(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
	    return _regenerator2.default.wrap(function _callee2$(_context2) {
	      while (1) {
	        switch (_context2.prev = _context2.next) {
	          case 0:
	            if (false) {
	              _context2.next = 12;
	              break;
	            }
	
	            _context2.next = 3;
	            return (0, _utils.asyncWait)(400);
	
	          case 3:
	            $ellipses.text('.');
	            _context2.next = 6;
	            return (0, _utils.asyncWait)(400);
	
	          case 6:
	            $ellipses.text('..');
	            _context2.next = 9;
	            return (0, _utils.asyncWait)(400);
	
	          case 9:
	            $ellipses.text('...');
	            _context2.next = 0;
	            break;
	
	          case 12:
	          case 'end':
	            return _context2.stop();
	        }
	      }
	    }, _callee2, _this2);
	  }))();
	}
	
	function generateLogger($log) {
	  return function (s) {
	    var $entry = $('<div>' + s + '</div>');
	    $log.prepend($entry);
	    setTimeout(function () {
	      $entry.remove();
	    }, 1000);
	  };
	}
	
	$(document).ready(function () {
	  var DOC_ID = 'asdf1234';
	
	  var clients = [];
	  var server = new _ot_server_model.OTServerModel();
	
	  var $serverContainer = $('#server');
	  var $clientContainer = $('#clients');
	
	  var _createServerDOM = createServerDOM("Server"),
	      _createServerDOM2 = (0, _slicedToArray3.default)(_createServerDOM, 3),
	      $server = _createServerDOM2[0],
	      $serverText = _createServerDOM2[1],
	      $delay = _createServerDOM2[2];
	
	  var serverLogger = generateLogger($('#server-log'));
	  $serverContainer.append($server);
	
	  // update the dom w/ server state
	  server.addChangeListener(function () {
	    return $serverText.val(server.state());
	  });
	
	  // the network
	  var networkDelay = {
	    minDelay: Math.max(0, parseInt($delay.val()) - 500),
	    maxDelay: parseInt($delay.val())
	  };
	  $delay.change(function () {
	    networkDelay.minDelay = Math.max(0, parseInt($delay.val()) - 500);
	    networkDelay.maxDelay = parseInt($delay.val());
	  });
	
	  var controller = new _simulated_controller.SimulatedController(networkDelay);
	  controller.connectServer(server);
	  controller.loop();
	
	  var $clientPlaceholder = $('#client-placeholder');
	
	  var clientId = 1;
	  function addClient() {
	    var _this3 = this;
	
	    var _createClientDOM = createClientDOM('Client ' + clientId, false, false),
	        _createClientDOM2 = (0, _slicedToArray3.default)(_createClientDOM, 4),
	        $client = _createClientDOM2[0],
	        $text = _createClientDOM2[1],
	        $online = _createClientDOM2[2],
	        $randomize = _createClientDOM2[3];
	
	    $client.insertBefore($clientPlaceholder);
	    clientId++;
	
	    var client = new _ot_client_model.OTClientModel(_applier.DocumentApplier);
	    controller.connectClient(client);
	
	    $online.change(function () {
	      if ($online[0].checked) {
	        controller.connectClient(client);
	      } else {
	        controller.disconnectClient(client);
	      }
	    });
	
	    var shouldRandomize = { enabled: $randomize[0].checked };
	    $randomize.change(function () {
	      shouldRandomize.enabled = $randomize[0].checked;
	    });
	
	    setupClient(client, $text, function (update) {
	      return controller.send(client, update);
	    });
	    randomlyAdjustText($text, shouldRandomize, 500);
	
	    clients.push(client);
	
	    ;(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
	      return _regenerator2.default.wrap(function _callee3$(_context3) {
	        while (1) {
	          switch (_context3.prev = _context3.next) {
	            case 0:
	              if (false) {
	                _context3.next = 6;
	                break;
	              }
	
	              _context3.next = 3;
	              return (0, _utils.asyncWait)(500);
	
	            case 3:
	              if (client.state.text === server.state(DOC_ID)) {
	                $client.find('.converging').hide();
	              } else {
	                $client.find('.converging').show();
	              }
	              _context3.next = 0;
	              break;
	
	            case 6:
	            case 'end':
	              return _context3.stop();
	          }
	        }
	      }, _callee3, _this3);
	    }))();
	  }
	
	  addClient();
	  addClient();
	
	  var $randomizeEverything = $('.randomize-everything');(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4() {
	    var $checkboxes, i;
	    return _regenerator2.default.wrap(function _callee4$(_context4) {
	      while (1) {
	        switch (_context4.prev = _context4.next) {
	          case 0:
	            if (false) {
	              _context4.next = 10;
	              break;
	            }
	
	            _context4.next = 3;
	            return (0, _utils.asyncWait)(1000);
	
	          case 3:
	            if (!($randomizeEverything[0].checked === false)) {
	              _context4.next = 5;
	              break;
	            }
	
	            return _context4.abrupt('continue', 0);
	
	          case 5:
	            $checkboxes = $('input[type=checkbox]').not('.randomize-everything');
	            i = Math.floor(Math.random() * $checkboxes.length) + 1;
	
	            $checkboxes.eq(i).click();
	            _context4.next = 0;
	            break;
	
	          case 10:
	          case 'end':
	            return _context4.stop();
	        }
	      }
	    }, _callee4, undefined);
	  }))();
	
	  $('.all-online').click(function () {
	    $('input[type=checkbox].online').prop('checked', true).change();
	  });
	
	  $('.all-offline').click(function () {
	    $('input[type=checkbox].online').prop('checked', false).change();
	  });
	
	  $('.no-random').click(function () {
	    $('input[type=checkbox].randomize-everything').prop('checked', false).change();
	    $('input[type=checkbox].randomize').prop('checked', false).change();
	  });
	
	  var $clientButton = $('#add-client');
	  $clientButton.click(function () {
	    return addClient();
	  });
	
	  window.clients = clients;
	  window.server = server;
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(2);


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {// This method of obtaining a reference to the global object needs to be
	// kept identical to the way it is obtained in runtime.js
	var g =
	  typeof global === "object" ? global :
	  typeof window === "object" ? window :
	  typeof self === "object" ? self : this;
	
	// Use `getOwnPropertyNames` because not all browsers support calling
	// `hasOwnProperty` on the global `self` object in a worker. See #183.
	var hadRuntime = g.regeneratorRuntime &&
	  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;
	
	// Save the old regeneratorRuntime in case it needs to be restored later.
	var oldRuntime = hadRuntime && g.regeneratorRuntime;
	
	// Force reevalutation of runtime.js.
	g.regeneratorRuntime = undefined;
	
	module.exports = __webpack_require__(3);
	
	if (hadRuntime) {
	  // Restore the original runtime.
	  g.regeneratorRuntime = oldRuntime;
	} else {
	  // Remove the global property added by runtime.js.
	  try {
	    delete g.regeneratorRuntime;
	  } catch(e) {
	    g.regeneratorRuntime = undefined;
	  }
	}
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global, process) {/**
	 * Copyright (c) 2014, Facebook, Inc.
	 * All rights reserved.
	 *
	 * This source code is licensed under the BSD-style license found in the
	 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
	 * additional grant of patent rights can be found in the PATENTS file in
	 * the same directory.
	 */
	
	!(function(global) {
	  "use strict";
	
	  var Op = Object.prototype;
	  var hasOwn = Op.hasOwnProperty;
	  var undefined; // More compressible than void 0.
	  var $Symbol = typeof Symbol === "function" ? Symbol : {};
	  var iteratorSymbol = $Symbol.iterator || "@@iterator";
	  var toStringTagSymbol = $Symbol.toStringTag || "@@toStringTag";
	
	  var inModule = typeof module === "object";
	  var runtime = global.regeneratorRuntime;
	  if (runtime) {
	    if (inModule) {
	      // If regeneratorRuntime is defined globally and we're in a module,
	      // make the exports object identical to regeneratorRuntime.
	      module.exports = runtime;
	    }
	    // Don't bother evaluating the rest of this file if the runtime was
	    // already defined globally.
	    return;
	  }
	
	  // Define the runtime globally (as expected by generated code) as either
	  // module.exports (if we're in a module) or a new, empty object.
	  runtime = global.regeneratorRuntime = inModule ? module.exports : {};
	
	  function wrap(innerFn, outerFn, self, tryLocsList) {
	    // If outerFn provided and outerFn.prototype is a Generator, then outerFn.prototype instanceof Generator.
	    var protoGenerator = outerFn && outerFn.prototype instanceof Generator ? outerFn : Generator;
	    var generator = Object.create(protoGenerator.prototype);
	    var context = new Context(tryLocsList || []);
	
	    // The ._invoke method unifies the implementations of the .next,
	    // .throw, and .return methods.
	    generator._invoke = makeInvokeMethod(innerFn, self, context);
	
	    return generator;
	  }
	  runtime.wrap = wrap;
	
	  // Try/catch helper to minimize deoptimizations. Returns a completion
	  // record like context.tryEntries[i].completion. This interface could
	  // have been (and was previously) designed to take a closure to be
	  // invoked without arguments, but in all the cases we care about we
	  // already have an existing method we want to call, so there's no need
	  // to create a new function object. We can even get away with assuming
	  // the method takes exactly one argument, since that happens to be true
	  // in every case, so we don't have to touch the arguments object. The
	  // only additional allocation required is the completion record, which
	  // has a stable shape and so hopefully should be cheap to allocate.
	  function tryCatch(fn, obj, arg) {
	    try {
	      return { type: "normal", arg: fn.call(obj, arg) };
	    } catch (err) {
	      return { type: "throw", arg: err };
	    }
	  }
	
	  var GenStateSuspendedStart = "suspendedStart";
	  var GenStateSuspendedYield = "suspendedYield";
	  var GenStateExecuting = "executing";
	  var GenStateCompleted = "completed";
	
	  // Returning this object from the innerFn has the same effect as
	  // breaking out of the dispatch switch statement.
	  var ContinueSentinel = {};
	
	  // Dummy constructor functions that we use as the .constructor and
	  // .constructor.prototype properties for functions that return Generator
	  // objects. For full spec compliance, you may wish to configure your
	  // minifier not to mangle the names of these two functions.
	  function Generator() {}
	  function GeneratorFunction() {}
	  function GeneratorFunctionPrototype() {}
	
	  // This is a polyfill for %IteratorPrototype% for environments that
	  // don't natively support it.
	  var IteratorPrototype = {};
	  IteratorPrototype[iteratorSymbol] = function () {
	    return this;
	  };
	
	  var getProto = Object.getPrototypeOf;
	  var NativeIteratorPrototype = getProto && getProto(getProto(values([])));
	  if (NativeIteratorPrototype &&
	      NativeIteratorPrototype !== Op &&
	      hasOwn.call(NativeIteratorPrototype, iteratorSymbol)) {
	    // This environment has a native %IteratorPrototype%; use it instead
	    // of the polyfill.
	    IteratorPrototype = NativeIteratorPrototype;
	  }
	
	  var Gp = GeneratorFunctionPrototype.prototype =
	    Generator.prototype = Object.create(IteratorPrototype);
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunctionPrototype[toStringTagSymbol] =
	    GeneratorFunction.displayName = "GeneratorFunction";
	
	  // Helper for defining the .next, .throw, and .return methods of the
	  // Iterator interface in terms of a single ._invoke method.
	  function defineIteratorMethods(prototype) {
	    ["next", "throw", "return"].forEach(function(method) {
	      prototype[method] = function(arg) {
	        return this._invoke(method, arg);
	      };
	    });
	  }
	
	  runtime.isGeneratorFunction = function(genFun) {
	    var ctor = typeof genFun === "function" && genFun.constructor;
	    return ctor
	      ? ctor === GeneratorFunction ||
	        // For the native GeneratorFunction constructor, the best we can
	        // do is to check its .name property.
	        (ctor.displayName || ctor.name) === "GeneratorFunction"
	      : false;
	  };
	
	  runtime.mark = function(genFun) {
	    if (Object.setPrototypeOf) {
	      Object.setPrototypeOf(genFun, GeneratorFunctionPrototype);
	    } else {
	      genFun.__proto__ = GeneratorFunctionPrototype;
	      if (!(toStringTagSymbol in genFun)) {
	        genFun[toStringTagSymbol] = "GeneratorFunction";
	      }
	    }
	    genFun.prototype = Object.create(Gp);
	    return genFun;
	  };
	
	  // Within the body of any async function, `await x` is transformed to
	  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
	  // `hasOwn.call(value, "__await")` to determine if the yielded value is
	  // meant to be awaited.
	  runtime.awrap = function(arg) {
	    return { __await: arg };
	  };
	
	  function AsyncIterator(generator) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value &&
	            typeof value === "object" &&
	            hasOwn.call(value, "__await")) {
	          return Promise.resolve(value.__await).then(function(value) {
	            invoke("next", value, resolve, reject);
	          }, function(err) {
	            invoke("throw", err, resolve, reject);
	          });
	        }
	
	        return Promise.resolve(value).then(function(unwrapped) {
	          // When a yielded Promise is resolved, its final value becomes
	          // the .value of the Promise<{value,done}> result for the
	          // current iteration. If the Promise is rejected, however, the
	          // result for this iteration will be rejected with the same
	          // reason. Note that rejections of yielded Promises are not
	          // thrown back into the generator function, as is the case
	          // when an awaited Promise is rejected. This difference in
	          // behavior between yield and await is important, because it
	          // allows the consumer to decide what to do with the yielded
	          // rejection (swallow it and continue, manually .throw it back
	          // into the generator, abandon iteration, whatever). With
	          // await, by contrast, there is no opportunity to examine the
	          // rejection reason outside the generator function, so the
	          // only option is to throw it from the await expression, and
	          // let the generator function handle the exception.
	          result.value = unwrapped;
	          resolve(result);
	        }, reject);
	      }
	    }
	
	    if (typeof process === "object" && process.domain) {
	      invoke = process.domain.bind(invoke);
	    }
	
	    var previousPromise;
	
	    function enqueue(method, arg) {
	      function callInvokeWithMethodAndArg() {
	        return new Promise(function(resolve, reject) {
	          invoke(method, arg, resolve, reject);
	        });
	      }
	
	      return previousPromise =
	        // If enqueue has been called before, then we want to wait until
	        // all previous Promises have been resolved before calling invoke,
	        // so that results are always delivered in the correct order. If
	        // enqueue has not been called before, then it is important to
	        // call invoke immediately, without waiting on a callback to fire,
	        // so that the async generator function has the opportunity to do
	        // any necessary setup in a predictable way. This predictability
	        // is why the Promise constructor synchronously invokes its
	        // executor callback, and why async functions synchronously
	        // execute code before the first await. Since we implement simple
	        // async functions in terms of async generators, it is especially
	        // important to get this right, even though it requires care.
	        previousPromise ? previousPromise.then(
	          callInvokeWithMethodAndArg,
	          // Avoid propagating failures to Promises returned by later
	          // invocations of the iterator.
	          callInvokeWithMethodAndArg
	        ) : callInvokeWithMethodAndArg();
	    }
	
	    // Define the unified helper method that is used to implement .next,
	    // .throw, and .return (see defineIteratorMethods).
	    this._invoke = enqueue;
	  }
	
	  defineIteratorMethods(AsyncIterator.prototype);
	  runtime.AsyncIterator = AsyncIterator;
	
	  // Note that simple async functions are implemented on top of
	  // AsyncIterator objects; they just return a Promise for the value of
	  // the final result produced by the iterator.
	  runtime.async = function(innerFn, outerFn, self, tryLocsList) {
	    var iter = new AsyncIterator(
	      wrap(innerFn, outerFn, self, tryLocsList)
	    );
	
	    return runtime.isGeneratorFunction(outerFn)
	      ? iter // If outerFn is a generator, return the full iterator.
	      : iter.next().then(function(result) {
	          return result.done ? result.value : iter.next();
	        });
	  };
	
	  function makeInvokeMethod(innerFn, self, context) {
	    var state = GenStateSuspendedStart;
	
	    return function invoke(method, arg) {
	      if (state === GenStateExecuting) {
	        throw new Error("Generator is already running");
	      }
	
	      if (state === GenStateCompleted) {
	        if (method === "throw") {
	          throw arg;
	        }
	
	        // Be forgiving, per 25.3.3.3.3 of the spec:
	        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
	        return doneResult();
	      }
	
	      while (true) {
	        var delegate = context.delegate;
	        if (delegate) {
	          if (method === "return" ||
	              (method === "throw" && delegate.iterator[method] === undefined)) {
	            // A return or throw (when the delegate iterator has no throw
	            // method) always terminates the yield* loop.
	            context.delegate = null;
	
	            // If the delegate iterator has a return method, give it a
	            // chance to clean up.
	            var returnMethod = delegate.iterator["return"];
	            if (returnMethod) {
	              var record = tryCatch(returnMethod, delegate.iterator, arg);
	              if (record.type === "throw") {
	                // If the return method threw an exception, let that
	                // exception prevail over the original return or throw.
	                method = "throw";
	                arg = record.arg;
	                continue;
	              }
	            }
	
	            if (method === "return") {
	              // Continue with the outer return, now that the delegate
	              // iterator has been terminated.
	              continue;
	            }
	          }
	
	          var record = tryCatch(
	            delegate.iterator[method],
	            delegate.iterator,
	            arg
	          );
	
	          if (record.type === "throw") {
	            context.delegate = null;
	
	            // Like returning generator.throw(uncaught), but without the
	            // overhead of an extra function call.
	            method = "throw";
	            arg = record.arg;
	            continue;
	          }
	
	          // Delegate generator ran and handled its own exceptions so
	          // regardless of what the method was, we continue as if it is
	          // "next" with an undefined arg.
	          method = "next";
	          arg = undefined;
	
	          var info = record.arg;
	          if (info.done) {
	            context[delegate.resultName] = info.value;
	            context.next = delegate.nextLoc;
	          } else {
	            state = GenStateSuspendedYield;
	            return info;
	          }
	
	          context.delegate = null;
	        }
	
	        if (method === "next") {
	          // Setting context._sent for legacy support of Babel's
	          // function.sent implementation.
	          context.sent = context._sent = arg;
	
	        } else if (method === "throw") {
	          if (state === GenStateSuspendedStart) {
	            state = GenStateCompleted;
	            throw arg;
	          }
	
	          if (context.dispatchException(arg)) {
	            // If the dispatched exception was caught by a catch block,
	            // then let that catch block handle the exception normally.
	            method = "next";
	            arg = undefined;
	          }
	
	        } else if (method === "return") {
	          context.abrupt("return", arg);
	        }
	
	        state = GenStateExecuting;
	
	        var record = tryCatch(innerFn, self, context);
	        if (record.type === "normal") {
	          // If an exception is thrown from innerFn, we leave state ===
	          // GenStateExecuting and loop back for another invocation.
	          state = context.done
	            ? GenStateCompleted
	            : GenStateSuspendedYield;
	
	          var info = {
	            value: record.arg,
	            done: context.done
	          };
	
	          if (record.arg === ContinueSentinel) {
	            if (context.delegate && method === "next") {
	              // Deliberately forget the last sent value so that we don't
	              // accidentally pass it on to the delegate.
	              arg = undefined;
	            }
	          } else {
	            return info;
	          }
	
	        } else if (record.type === "throw") {
	          state = GenStateCompleted;
	          // Dispatch the exception by looping back around to the
	          // context.dispatchException(arg) call above.
	          method = "throw";
	          arg = record.arg;
	        }
	      }
	    };
	  }
	
	  // Define Generator.prototype.{next,throw,return} in terms of the
	  // unified ._invoke helper method.
	  defineIteratorMethods(Gp);
	
	  Gp[toStringTagSymbol] = "Generator";
	
	  Gp.toString = function() {
	    return "[object Generator]";
	  };
	
	  function pushTryEntry(locs) {
	    var entry = { tryLoc: locs[0] };
	
	    if (1 in locs) {
	      entry.catchLoc = locs[1];
	    }
	
	    if (2 in locs) {
	      entry.finallyLoc = locs[2];
	      entry.afterLoc = locs[3];
	    }
	
	    this.tryEntries.push(entry);
	  }
	
	  function resetTryEntry(entry) {
	    var record = entry.completion || {};
	    record.type = "normal";
	    delete record.arg;
	    entry.completion = record;
	  }
	
	  function Context(tryLocsList) {
	    // The root entry object (effectively a try statement without a catch
	    // or a finally block) gives us a place to store values thrown from
	    // locations where there is no enclosing try statement.
	    this.tryEntries = [{ tryLoc: "root" }];
	    tryLocsList.forEach(pushTryEntry, this);
	    this.reset(true);
	  }
	
	  runtime.keys = function(object) {
	    var keys = [];
	    for (var key in object) {
	      keys.push(key);
	    }
	    keys.reverse();
	
	    // Rather than returning an object with a next method, we keep
	    // things simple and return the next function itself.
	    return function next() {
	      while (keys.length) {
	        var key = keys.pop();
	        if (key in object) {
	          next.value = key;
	          next.done = false;
	          return next;
	        }
	      }
	
	      // To avoid creating an additional object, we just hang the .value
	      // and .done properties off the next function object itself. This
	      // also ensures that the minifier will not anonymize the function.
	      next.done = true;
	      return next;
	    };
	  };
	
	  function values(iterable) {
	    if (iterable) {
	      var iteratorMethod = iterable[iteratorSymbol];
	      if (iteratorMethod) {
	        return iteratorMethod.call(iterable);
	      }
	
	      if (typeof iterable.next === "function") {
	        return iterable;
	      }
	
	      if (!isNaN(iterable.length)) {
	        var i = -1, next = function next() {
	          while (++i < iterable.length) {
	            if (hasOwn.call(iterable, i)) {
	              next.value = iterable[i];
	              next.done = false;
	              return next;
	            }
	          }
	
	          next.value = undefined;
	          next.done = true;
	
	          return next;
	        };
	
	        return next.next = next;
	      }
	    }
	
	    // Return an iterator with no values.
	    return { next: doneResult };
	  }
	  runtime.values = values;
	
	  function doneResult() {
	    return { value: undefined, done: true };
	  }
	
	  Context.prototype = {
	    constructor: Context,
	
	    reset: function(skipTempReset) {
	      this.prev = 0;
	      this.next = 0;
	      // Resetting context._sent for legacy support of Babel's
	      // function.sent implementation.
	      this.sent = this._sent = undefined;
	      this.done = false;
	      this.delegate = null;
	
	      this.tryEntries.forEach(resetTryEntry);
	
	      if (!skipTempReset) {
	        for (var name in this) {
	          // Not sure about the optimal order of these conditions:
	          if (name.charAt(0) === "t" &&
	              hasOwn.call(this, name) &&
	              !isNaN(+name.slice(1))) {
	            this[name] = undefined;
	          }
	        }
	      }
	    },
	
	    stop: function() {
	      this.done = true;
	
	      var rootEntry = this.tryEntries[0];
	      var rootRecord = rootEntry.completion;
	      if (rootRecord.type === "throw") {
	        throw rootRecord.arg;
	      }
	
	      return this.rval;
	    },
	
	    dispatchException: function(exception) {
	      if (this.done) {
	        throw exception;
	      }
	
	      var context = this;
	      function handle(loc, caught) {
	        record.type = "throw";
	        record.arg = exception;
	        context.next = loc;
	        return !!caught;
	      }
	
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        var record = entry.completion;
	
	        if (entry.tryLoc === "root") {
	          // Exception thrown outside of any try block that could handle
	          // it, so set the completion value of the entire function to
	          // throw the exception.
	          return handle("end");
	        }
	
	        if (entry.tryLoc <= this.prev) {
	          var hasCatch = hasOwn.call(entry, "catchLoc");
	          var hasFinally = hasOwn.call(entry, "finallyLoc");
	
	          if (hasCatch && hasFinally) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            } else if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	
	          } else if (hasCatch) {
	            if (this.prev < entry.catchLoc) {
	              return handle(entry.catchLoc, true);
	            }
	
	          } else if (hasFinally) {
	            if (this.prev < entry.finallyLoc) {
	              return handle(entry.finallyLoc);
	            }
	
	          } else {
	            throw new Error("try statement without catch or finally");
	          }
	        }
	      }
	    },
	
	    abrupt: function(type, arg) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc <= this.prev &&
	            hasOwn.call(entry, "finallyLoc") &&
	            this.prev < entry.finallyLoc) {
	          var finallyEntry = entry;
	          break;
	        }
	      }
	
	      if (finallyEntry &&
	          (type === "break" ||
	           type === "continue") &&
	          finallyEntry.tryLoc <= arg &&
	          arg <= finallyEntry.finallyLoc) {
	        // Ignore the finally entry if control is not jumping to a
	        // location outside the try/catch block.
	        finallyEntry = null;
	      }
	
	      var record = finallyEntry ? finallyEntry.completion : {};
	      record.type = type;
	      record.arg = arg;
	
	      if (finallyEntry) {
	        this.next = finallyEntry.finallyLoc;
	      } else {
	        this.complete(record);
	      }
	
	      return ContinueSentinel;
	    },
	
	    complete: function(record, afterLoc) {
	      if (record.type === "throw") {
	        throw record.arg;
	      }
	
	      if (record.type === "break" ||
	          record.type === "continue") {
	        this.next = record.arg;
	      } else if (record.type === "return") {
	        this.rval = record.arg;
	        this.next = "end";
	      } else if (record.type === "normal" && afterLoc) {
	        this.next = afterLoc;
	      }
	    },
	
	    finish: function(finallyLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.finallyLoc === finallyLoc) {
	          this.complete(entry.completion, entry.afterLoc);
	          resetTryEntry(entry);
	          return ContinueSentinel;
	        }
	      }
	    },
	
	    "catch": function(tryLoc) {
	      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
	        var entry = this.tryEntries[i];
	        if (entry.tryLoc === tryLoc) {
	          var record = entry.completion;
	          if (record.type === "throw") {
	            var thrown = record.arg;
	            resetTryEntry(entry);
	          }
	          return thrown;
	        }
	      }
	
	      // The context.catch method must only be called with a location
	      // argument that corresponds to a known catch block.
	      throw new Error("illegal catch attempt");
	    },
	
	    delegateYield: function(iterable, resultName, nextLoc) {
	      this.delegate = {
	        iterator: values(iterable),
	        resultName: resultName,
	        nextLoc: nextLoc
	      };
	
	      return ContinueSentinel;
	    }
	  };
	})(
	  // Among the various tricks for obtaining a reference to the global
	  // object, this seems to be the most reliable technique that does not
	  // use indirect eval (which violates Content Security Policy).
	  typeof global === "object" ? global :
	  typeof window === "object" ? window :
	  typeof self === "object" ? self : this
	);
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(4)))

/***/ },
/* 4 */
/***/ function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _promise = __webpack_require__(6);
	
	var _promise2 = _interopRequireDefault(_promise);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (fn) {
	  return function () {
	    var gen = fn.apply(this, arguments);
	    return new _promise2.default(function (resolve, reject) {
	      function step(key, arg) {
	        try {
	          var info = gen[key](arg);
	          var value = info.value;
	        } catch (error) {
	          reject(error);
	          return;
	        }
	
	        if (info.done) {
	          resolve(value);
	        } else {
	          return _promise2.default.resolve(value).then(function (value) {
	            step("next", value);
	          }, function (err) {
	            step("throw", err);
	          });
	        }
	      }
	
	      return step("next");
	    });
	  };
	};

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(7), __esModule: true };

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(8);
	__webpack_require__(9);
	__webpack_require__(53);
	__webpack_require__(57);
	module.exports = __webpack_require__(17).Promise;

/***/ },
/* 8 */
/***/ function(module, exports) {



/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $at  = __webpack_require__(10)(true);
	
	// 21.1.3.27 String.prototype[@@iterator]()
	__webpack_require__(13)(String, 'String', function(iterated){
	  this._t = String(iterated); // target
	  this._i = 0;                // next index
	// 21.1.5.2.1 %StringIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , index = this._i
	    , point;
	  if(index >= O.length)return {value: undefined, done: true};
	  point = $at(O, index);
	  this._i += point.length;
	  return {value: point, done: false};
	});

/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(11)
	  , defined   = __webpack_require__(12);
	// true  -> String#at
	// false -> String#codePointAt
	module.exports = function(TO_STRING){
	  return function(that, pos){
	    var s = String(defined(that))
	      , i = toInteger(pos)
	      , l = s.length
	      , a, b;
	    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
	    a = s.charCodeAt(i);
	    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
	      ? TO_STRING ? s.charAt(i) : a
	      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
	  };
	};

/***/ },
/* 11 */
/***/ function(module, exports) {

	// 7.1.4 ToInteger
	var ceil  = Math.ceil
	  , floor = Math.floor;
	module.exports = function(it){
	  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
	};

/***/ },
/* 12 */
/***/ function(module, exports) {

	// 7.2.1 RequireObjectCoercible(argument)
	module.exports = function(it){
	  if(it == undefined)throw TypeError("Can't call method on  " + it);
	  return it;
	};

/***/ },
/* 13 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY        = __webpack_require__(14)
	  , $export        = __webpack_require__(15)
	  , redefine       = __webpack_require__(30)
	  , hide           = __webpack_require__(20)
	  , has            = __webpack_require__(31)
	  , Iterators      = __webpack_require__(32)
	  , $iterCreate    = __webpack_require__(33)
	  , setToStringTag = __webpack_require__(49)
	  , getPrototypeOf = __webpack_require__(51)
	  , ITERATOR       = __webpack_require__(50)('iterator')
	  , BUGGY          = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
	  , FF_ITERATOR    = '@@iterator'
	  , KEYS           = 'keys'
	  , VALUES         = 'values';
	
	var returnThis = function(){ return this; };
	
	module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED){
	  $iterCreate(Constructor, NAME, next);
	  var getMethod = function(kind){
	    if(!BUGGY && kind in proto)return proto[kind];
	    switch(kind){
	      case KEYS: return function keys(){ return new Constructor(this, kind); };
	      case VALUES: return function values(){ return new Constructor(this, kind); };
	    } return function entries(){ return new Constructor(this, kind); };
	  };
	  var TAG        = NAME + ' Iterator'
	    , DEF_VALUES = DEFAULT == VALUES
	    , VALUES_BUG = false
	    , proto      = Base.prototype
	    , $native    = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
	    , $default   = $native || getMethod(DEFAULT)
	    , $entries   = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined
	    , $anyNative = NAME == 'Array' ? proto.entries || $native : $native
	    , methods, key, IteratorPrototype;
	  // Fix native
	  if($anyNative){
	    IteratorPrototype = getPrototypeOf($anyNative.call(new Base));
	    if(IteratorPrototype !== Object.prototype){
	      // Set @@toStringTag to native iterators
	      setToStringTag(IteratorPrototype, TAG, true);
	      // fix for some old engines
	      if(!LIBRARY && !has(IteratorPrototype, ITERATOR))hide(IteratorPrototype, ITERATOR, returnThis);
	    }
	  }
	  // fix Array#{values, @@iterator}.name in V8 / FF
	  if(DEF_VALUES && $native && $native.name !== VALUES){
	    VALUES_BUG = true;
	    $default = function values(){ return $native.call(this); };
	  }
	  // Define iterator
	  if((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])){
	    hide(proto, ITERATOR, $default);
	  }
	  // Plug for library
	  Iterators[NAME] = $default;
	  Iterators[TAG]  = returnThis;
	  if(DEFAULT){
	    methods = {
	      values:  DEF_VALUES ? $default : getMethod(VALUES),
	      keys:    IS_SET     ? $default : getMethod(KEYS),
	      entries: $entries
	    };
	    if(FORCED)for(key in methods){
	      if(!(key in proto))redefine(proto, key, methods[key]);
	    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
	  }
	  return methods;
	};

/***/ },
/* 14 */
/***/ function(module, exports) {

	module.exports = true;

/***/ },
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(16)
	  , core      = __webpack_require__(17)
	  , ctx       = __webpack_require__(18)
	  , hide      = __webpack_require__(20)
	  , PROTOTYPE = 'prototype';
	
	var $export = function(type, name, source){
	  var IS_FORCED = type & $export.F
	    , IS_GLOBAL = type & $export.G
	    , IS_STATIC = type & $export.S
	    , IS_PROTO  = type & $export.P
	    , IS_BIND   = type & $export.B
	    , IS_WRAP   = type & $export.W
	    , exports   = IS_GLOBAL ? core : core[name] || (core[name] = {})
	    , expProto  = exports[PROTOTYPE]
	    , target    = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE]
	    , key, own, out;
	  if(IS_GLOBAL)source = name;
	  for(key in source){
	    // contains in native
	    own = !IS_FORCED && target && target[key] !== undefined;
	    if(own && key in exports)continue;
	    // export native or passed
	    out = own ? target[key] : source[key];
	    // prevent global pollution for namespaces
	    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
	    // bind timers to global for call from export context
	    : IS_BIND && own ? ctx(out, global)
	    // wrap global constructors for prevent change them in library
	    : IS_WRAP && target[key] == out ? (function(C){
	      var F = function(a, b, c){
	        if(this instanceof C){
	          switch(arguments.length){
	            case 0: return new C;
	            case 1: return new C(a);
	            case 2: return new C(a, b);
	          } return new C(a, b, c);
	        } return C.apply(this, arguments);
	      };
	      F[PROTOTYPE] = C[PROTOTYPE];
	      return F;
	    // make static versions for prototype methods
	    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
	    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
	    if(IS_PROTO){
	      (exports.virtual || (exports.virtual = {}))[key] = out;
	      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
	      if(type & $export.R && expProto && !expProto[key])hide(expProto, key, out);
	    }
	  }
	};
	// type bitmap
	$export.F = 1;   // forced
	$export.G = 2;   // global
	$export.S = 4;   // static
	$export.P = 8;   // proto
	$export.B = 16;  // bind
	$export.W = 32;  // wrap
	$export.U = 64;  // safe
	$export.R = 128; // real proto method for `library` 
	module.exports = $export;

/***/ },
/* 16 */
/***/ function(module, exports) {

	// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
	var global = module.exports = typeof window != 'undefined' && window.Math == Math
	  ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
	if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef

/***/ },
/* 17 */
/***/ function(module, exports) {

	var core = module.exports = {version: '2.4.0'};
	if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

	// optional / simple context binding
	var aFunction = __webpack_require__(19);
	module.exports = function(fn, that, length){
	  aFunction(fn);
	  if(that === undefined)return fn;
	  switch(length){
	    case 1: return function(a){
	      return fn.call(that, a);
	    };
	    case 2: return function(a, b){
	      return fn.call(that, a, b);
	    };
	    case 3: return function(a, b, c){
	      return fn.call(that, a, b, c);
	    };
	  }
	  return function(/* ...args */){
	    return fn.apply(that, arguments);
	  };
	};

/***/ },
/* 19 */
/***/ function(module, exports) {

	module.exports = function(it){
	  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
	  return it;
	};

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

	var dP         = __webpack_require__(21)
	  , createDesc = __webpack_require__(29);
	module.exports = __webpack_require__(25) ? function(object, key, value){
	  return dP.f(object, key, createDesc(1, value));
	} : function(object, key, value){
	  object[key] = value;
	  return object;
	};

/***/ },
/* 21 */
/***/ function(module, exports, __webpack_require__) {

	var anObject       = __webpack_require__(22)
	  , IE8_DOM_DEFINE = __webpack_require__(24)
	  , toPrimitive    = __webpack_require__(28)
	  , dP             = Object.defineProperty;
	
	exports.f = __webpack_require__(25) ? Object.defineProperty : function defineProperty(O, P, Attributes){
	  anObject(O);
	  P = toPrimitive(P, true);
	  anObject(Attributes);
	  if(IE8_DOM_DEFINE)try {
	    return dP(O, P, Attributes);
	  } catch(e){ /* empty */ }
	  if('get' in Attributes || 'set' in Attributes)throw TypeError('Accessors not supported!');
	  if('value' in Attributes)O[P] = Attributes.value;
	  return O;
	};

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(23);
	module.exports = function(it){
	  if(!isObject(it))throw TypeError(it + ' is not an object!');
	  return it;
	};

/***/ },
/* 23 */
/***/ function(module, exports) {

	module.exports = function(it){
	  return typeof it === 'object' ? it !== null : typeof it === 'function';
	};

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = !__webpack_require__(25) && !__webpack_require__(26)(function(){
	  return Object.defineProperty(__webpack_require__(27)('div'), 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 25 */
/***/ function(module, exports, __webpack_require__) {

	// Thank's IE8 for his funny defineProperty
	module.exports = !__webpack_require__(26)(function(){
	  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
	});

/***/ },
/* 26 */
/***/ function(module, exports) {

	module.exports = function(exec){
	  try {
	    return !!exec();
	  } catch(e){
	    return true;
	  }
	};

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(23)
	  , document = __webpack_require__(16).document
	  // in old IE typeof document.createElement is 'object'
	  , is = isObject(document) && isObject(document.createElement);
	module.exports = function(it){
	  return is ? document.createElement(it) : {};
	};

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.1 ToPrimitive(input [, PreferredType])
	var isObject = __webpack_require__(23);
	// instead of the ES6 spec version, we didn't implement @@toPrimitive case
	// and the second argument - flag - preferred type is a string
	module.exports = function(it, S){
	  if(!isObject(it))return it;
	  var fn, val;
	  if(S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it)))return val;
	  if(!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it)))return val;
	  throw TypeError("Can't convert object to primitive value");
	};

/***/ },
/* 29 */
/***/ function(module, exports) {

	module.exports = function(bitmap, value){
	  return {
	    enumerable  : !(bitmap & 1),
	    configurable: !(bitmap & 2),
	    writable    : !(bitmap & 4),
	    value       : value
	  };
	};

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(20);

/***/ },
/* 31 */
/***/ function(module, exports) {

	var hasOwnProperty = {}.hasOwnProperty;
	module.exports = function(it, key){
	  return hasOwnProperty.call(it, key);
	};

/***/ },
/* 32 */
/***/ function(module, exports) {

	module.exports = {};

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var create         = __webpack_require__(34)
	  , descriptor     = __webpack_require__(29)
	  , setToStringTag = __webpack_require__(49)
	  , IteratorPrototype = {};
	
	// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
	__webpack_require__(20)(IteratorPrototype, __webpack_require__(50)('iterator'), function(){ return this; });
	
	module.exports = function(Constructor, NAME, next){
	  Constructor.prototype = create(IteratorPrototype, {next: descriptor(1, next)});
	  setToStringTag(Constructor, NAME + ' Iterator');
	};

/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	var anObject    = __webpack_require__(22)
	  , dPs         = __webpack_require__(35)
	  , enumBugKeys = __webpack_require__(47)
	  , IE_PROTO    = __webpack_require__(44)('IE_PROTO')
	  , Empty       = function(){ /* empty */ }
	  , PROTOTYPE   = 'prototype';
	
	// Create object with fake `null` prototype: use iframe Object with cleared prototype
	var createDict = function(){
	  // Thrash, waste and sodomy: IE GC bug
	  var iframe = __webpack_require__(27)('iframe')
	    , i      = enumBugKeys.length
	    , lt     = '<'
	    , gt     = '>'
	    , iframeDocument;
	  iframe.style.display = 'none';
	  __webpack_require__(48).appendChild(iframe);
	  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
	  // createDict = iframe.contentWindow.Object;
	  // html.removeChild(iframe);
	  iframeDocument = iframe.contentWindow.document;
	  iframeDocument.open();
	  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
	  iframeDocument.close();
	  createDict = iframeDocument.F;
	  while(i--)delete createDict[PROTOTYPE][enumBugKeys[i]];
	  return createDict();
	};
	
	module.exports = Object.create || function create(O, Properties){
	  var result;
	  if(O !== null){
	    Empty[PROTOTYPE] = anObject(O);
	    result = new Empty;
	    Empty[PROTOTYPE] = null;
	    // add "__proto__" for Object.getPrototypeOf polyfill
	    result[IE_PROTO] = O;
	  } else result = createDict();
	  return Properties === undefined ? result : dPs(result, Properties);
	};


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	var dP       = __webpack_require__(21)
	  , anObject = __webpack_require__(22)
	  , getKeys  = __webpack_require__(36);
	
	module.exports = __webpack_require__(25) ? Object.defineProperties : function defineProperties(O, Properties){
	  anObject(O);
	  var keys   = getKeys(Properties)
	    , length = keys.length
	    , i = 0
	    , P;
	  while(length > i)dP.f(O, P = keys[i++], Properties[P]);
	  return O;
	};

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 / 15.2.3.14 Object.keys(O)
	var $keys       = __webpack_require__(37)
	  , enumBugKeys = __webpack_require__(47);
	
	module.exports = Object.keys || function keys(O){
	  return $keys(O, enumBugKeys);
	};

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	var has          = __webpack_require__(31)
	  , toIObject    = __webpack_require__(38)
	  , arrayIndexOf = __webpack_require__(41)(false)
	  , IE_PROTO     = __webpack_require__(44)('IE_PROTO');
	
	module.exports = function(object, names){
	  var O      = toIObject(object)
	    , i      = 0
	    , result = []
	    , key;
	  for(key in O)if(key != IE_PROTO)has(O, key) && result.push(key);
	  // Don't enum bug & hidden keys
	  while(names.length > i)if(has(O, key = names[i++])){
	    ~arrayIndexOf(result, key) || result.push(key);
	  }
	  return result;
	};

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

	// to indexed object, toObject with fallback for non-array-like ES3 strings
	var IObject = __webpack_require__(39)
	  , defined = __webpack_require__(12);
	module.exports = function(it){
	  return IObject(defined(it));
	};

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for non-array-like ES3 and non-enumerable old V8 strings
	var cof = __webpack_require__(40);
	module.exports = Object('z').propertyIsEnumerable(0) ? Object : function(it){
	  return cof(it) == 'String' ? it.split('') : Object(it);
	};

/***/ },
/* 40 */
/***/ function(module, exports) {

	var toString = {}.toString;
	
	module.exports = function(it){
	  return toString.call(it).slice(8, -1);
	};

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	// false -> Array#indexOf
	// true  -> Array#includes
	var toIObject = __webpack_require__(38)
	  , toLength  = __webpack_require__(42)
	  , toIndex   = __webpack_require__(43);
	module.exports = function(IS_INCLUDES){
	  return function($this, el, fromIndex){
	    var O      = toIObject($this)
	      , length = toLength(O.length)
	      , index  = toIndex(fromIndex, length)
	      , value;
	    // Array#includes uses SameValueZero equality algorithm
	    if(IS_INCLUDES && el != el)while(length > index){
	      value = O[index++];
	      if(value != value)return true;
	    // Array#toIndex ignores holes, Array#includes - not
	    } else for(;length > index; index++)if(IS_INCLUDES || index in O){
	      if(O[index] === el)return IS_INCLUDES || index || 0;
	    } return !IS_INCLUDES && -1;
	  };
	};

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.15 ToLength
	var toInteger = __webpack_require__(11)
	  , min       = Math.min;
	module.exports = function(it){
	  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
	};

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var toInteger = __webpack_require__(11)
	  , max       = Math.max
	  , min       = Math.min;
	module.exports = function(index, length){
	  index = toInteger(index);
	  return index < 0 ? max(index + length, 0) : min(index, length);
	};

/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var shared = __webpack_require__(45)('keys')
	  , uid    = __webpack_require__(46);
	module.exports = function(key){
	  return shared[key] || (shared[key] = uid(key));
	};

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	var global = __webpack_require__(16)
	  , SHARED = '__core-js_shared__'
	  , store  = global[SHARED] || (global[SHARED] = {});
	module.exports = function(key){
	  return store[key] || (store[key] = {});
	};

/***/ },
/* 46 */
/***/ function(module, exports) {

	var id = 0
	  , px = Math.random();
	module.exports = function(key){
	  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
	};

/***/ },
/* 47 */
/***/ function(module, exports) {

	// IE 8- don't enum bug keys
	module.exports = (
	  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
	).split(',');

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(16).document && document.documentElement;

/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	var def = __webpack_require__(21).f
	  , has = __webpack_require__(31)
	  , TAG = __webpack_require__(50)('toStringTag');
	
	module.exports = function(it, tag, stat){
	  if(it && !has(it = stat ? it : it.prototype, TAG))def(it, TAG, {configurable: true, value: tag});
	};

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var store      = __webpack_require__(45)('wks')
	  , uid        = __webpack_require__(46)
	  , Symbol     = __webpack_require__(16).Symbol
	  , USE_SYMBOL = typeof Symbol == 'function';
	
	var $exports = module.exports = function(name){
	  return store[name] || (store[name] =
	    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
	};
	
	$exports.store = store;

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
	var has         = __webpack_require__(31)
	  , toObject    = __webpack_require__(52)
	  , IE_PROTO    = __webpack_require__(44)('IE_PROTO')
	  , ObjectProto = Object.prototype;
	
	module.exports = Object.getPrototypeOf || function(O){
	  O = toObject(O);
	  if(has(O, IE_PROTO))return O[IE_PROTO];
	  if(typeof O.constructor == 'function' && O instanceof O.constructor){
	    return O.constructor.prototype;
	  } return O instanceof Object ? ObjectProto : null;
	};

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

	// 7.1.13 ToObject(argument)
	var defined = __webpack_require__(12);
	module.exports = function(it){
	  return Object(defined(it));
	};

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(54);
	var global        = __webpack_require__(16)
	  , hide          = __webpack_require__(20)
	  , Iterators     = __webpack_require__(32)
	  , TO_STRING_TAG = __webpack_require__(50)('toStringTag');
	
	for(var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++){
	  var NAME       = collections[i]
	    , Collection = global[NAME]
	    , proto      = Collection && Collection.prototype;
	  if(proto && !proto[TO_STRING_TAG])hide(proto, TO_STRING_TAG, NAME);
	  Iterators[NAME] = Iterators.Array;
	}

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var addToUnscopables = __webpack_require__(55)
	  , step             = __webpack_require__(56)
	  , Iterators        = __webpack_require__(32)
	  , toIObject        = __webpack_require__(38);
	
	// 22.1.3.4 Array.prototype.entries()
	// 22.1.3.13 Array.prototype.keys()
	// 22.1.3.29 Array.prototype.values()
	// 22.1.3.30 Array.prototype[@@iterator]()
	module.exports = __webpack_require__(13)(Array, 'Array', function(iterated, kind){
	  this._t = toIObject(iterated); // target
	  this._i = 0;                   // next index
	  this._k = kind;                // kind
	// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
	}, function(){
	  var O     = this._t
	    , kind  = this._k
	    , index = this._i++;
	  if(!O || index >= O.length){
	    this._t = undefined;
	    return step(1);
	  }
	  if(kind == 'keys'  )return step(0, index);
	  if(kind == 'values')return step(0, O[index]);
	  return step(0, [index, O[index]]);
	}, 'values');
	
	// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
	Iterators.Arguments = Iterators.Array;
	
	addToUnscopables('keys');
	addToUnscopables('values');
	addToUnscopables('entries');

/***/ },
/* 55 */
/***/ function(module, exports) {

	module.exports = function(){ /* empty */ };

/***/ },
/* 56 */
/***/ function(module, exports) {

	module.exports = function(done, value){
	  return {value: value, done: !!done};
	};

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var LIBRARY            = __webpack_require__(14)
	  , global             = __webpack_require__(16)
	  , ctx                = __webpack_require__(18)
	  , classof            = __webpack_require__(58)
	  , $export            = __webpack_require__(15)
	  , isObject           = __webpack_require__(23)
	  , aFunction          = __webpack_require__(19)
	  , anInstance         = __webpack_require__(59)
	  , forOf              = __webpack_require__(60)
	  , speciesConstructor = __webpack_require__(64)
	  , task               = __webpack_require__(65).set
	  , microtask          = __webpack_require__(67)()
	  , PROMISE            = 'Promise'
	  , TypeError          = global.TypeError
	  , process            = global.process
	  , $Promise           = global[PROMISE]
	  , process            = global.process
	  , isNode             = classof(process) == 'process'
	  , empty              = function(){ /* empty */ }
	  , Internal, GenericPromiseCapability, Wrapper;
	
	var USE_NATIVE = !!function(){
	  try {
	    // correct subclassing with @@species support
	    var promise     = $Promise.resolve(1)
	      , FakePromise = (promise.constructor = {})[__webpack_require__(50)('species')] = function(exec){ exec(empty, empty); };
	    // unhandled rejections tracking support, NodeJS Promise without it fails @@species test
	    return (isNode || typeof PromiseRejectionEvent == 'function') && promise.then(empty) instanceof FakePromise;
	  } catch(e){ /* empty */ }
	}();
	
	// helpers
	var sameConstructor = function(a, b){
	  // with library wrapper special case
	  return a === b || a === $Promise && b === Wrapper;
	};
	var isThenable = function(it){
	  var then;
	  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
	};
	var newPromiseCapability = function(C){
	  return sameConstructor($Promise, C)
	    ? new PromiseCapability(C)
	    : new GenericPromiseCapability(C);
	};
	var PromiseCapability = GenericPromiseCapability = function(C){
	  var resolve, reject;
	  this.promise = new C(function($$resolve, $$reject){
	    if(resolve !== undefined || reject !== undefined)throw TypeError('Bad Promise constructor');
	    resolve = $$resolve;
	    reject  = $$reject;
	  });
	  this.resolve = aFunction(resolve);
	  this.reject  = aFunction(reject);
	};
	var perform = function(exec){
	  try {
	    exec();
	  } catch(e){
	    return {error: e};
	  }
	};
	var notify = function(promise, isReject){
	  if(promise._n)return;
	  promise._n = true;
	  var chain = promise._c;
	  microtask(function(){
	    var value = promise._v
	      , ok    = promise._s == 1
	      , i     = 0;
	    var run = function(reaction){
	      var handler = ok ? reaction.ok : reaction.fail
	        , resolve = reaction.resolve
	        , reject  = reaction.reject
	        , domain  = reaction.domain
	        , result, then;
	      try {
	        if(handler){
	          if(!ok){
	            if(promise._h == 2)onHandleUnhandled(promise);
	            promise._h = 1;
	          }
	          if(handler === true)result = value;
	          else {
	            if(domain)domain.enter();
	            result = handler(value);
	            if(domain)domain.exit();
	          }
	          if(result === reaction.promise){
	            reject(TypeError('Promise-chain cycle'));
	          } else if(then = isThenable(result)){
	            then.call(result, resolve, reject);
	          } else resolve(result);
	        } else reject(value);
	      } catch(e){
	        reject(e);
	      }
	    };
	    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
	    promise._c = [];
	    promise._n = false;
	    if(isReject && !promise._h)onUnhandled(promise);
	  });
	};
	var onUnhandled = function(promise){
	  task.call(global, function(){
	    var value = promise._v
	      , abrupt, handler, console;
	    if(isUnhandled(promise)){
	      abrupt = perform(function(){
	        if(isNode){
	          process.emit('unhandledRejection', value, promise);
	        } else if(handler = global.onunhandledrejection){
	          handler({promise: promise, reason: value});
	        } else if((console = global.console) && console.error){
	          console.error('Unhandled promise rejection', value);
	        }
	      });
	      // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
	      promise._h = isNode || isUnhandled(promise) ? 2 : 1;
	    } promise._a = undefined;
	    if(abrupt)throw abrupt.error;
	  });
	};
	var isUnhandled = function(promise){
	  if(promise._h == 1)return false;
	  var chain = promise._a || promise._c
	    , i     = 0
	    , reaction;
	  while(chain.length > i){
	    reaction = chain[i++];
	    if(reaction.fail || !isUnhandled(reaction.promise))return false;
	  } return true;
	};
	var onHandleUnhandled = function(promise){
	  task.call(global, function(){
	    var handler;
	    if(isNode){
	      process.emit('rejectionHandled', promise);
	    } else if(handler = global.onrejectionhandled){
	      handler({promise: promise, reason: promise._v});
	    }
	  });
	};
	var $reject = function(value){
	  var promise = this;
	  if(promise._d)return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  promise._v = value;
	  promise._s = 2;
	  if(!promise._a)promise._a = promise._c.slice();
	  notify(promise, true);
	};
	var $resolve = function(value){
	  var promise = this
	    , then;
	  if(promise._d)return;
	  promise._d = true;
	  promise = promise._w || promise; // unwrap
	  try {
	    if(promise === value)throw TypeError("Promise can't be resolved itself");
	    if(then = isThenable(value)){
	      microtask(function(){
	        var wrapper = {_w: promise, _d: false}; // wrap
	        try {
	          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
	        } catch(e){
	          $reject.call(wrapper, e);
	        }
	      });
	    } else {
	      promise._v = value;
	      promise._s = 1;
	      notify(promise, false);
	    }
	  } catch(e){
	    $reject.call({_w: promise, _d: false}, e); // wrap
	  }
	};
	
	// constructor polyfill
	if(!USE_NATIVE){
	  // 25.4.3.1 Promise(executor)
	  $Promise = function Promise(executor){
	    anInstance(this, $Promise, PROMISE, '_h');
	    aFunction(executor);
	    Internal.call(this);
	    try {
	      executor(ctx($resolve, this, 1), ctx($reject, this, 1));
	    } catch(err){
	      $reject.call(this, err);
	    }
	  };
	  Internal = function Promise(executor){
	    this._c = [];             // <- awaiting reactions
	    this._a = undefined;      // <- checked in isUnhandled reactions
	    this._s = 0;              // <- state
	    this._d = false;          // <- done
	    this._v = undefined;      // <- value
	    this._h = 0;              // <- rejection state, 0 - default, 1 - handled, 2 - unhandled
	    this._n = false;          // <- notify
	  };
	  Internal.prototype = __webpack_require__(68)($Promise.prototype, {
	    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
	    then: function then(onFulfilled, onRejected){
	      var reaction    = newPromiseCapability(speciesConstructor(this, $Promise));
	      reaction.ok     = typeof onFulfilled == 'function' ? onFulfilled : true;
	      reaction.fail   = typeof onRejected == 'function' && onRejected;
	      reaction.domain = isNode ? process.domain : undefined;
	      this._c.push(reaction);
	      if(this._a)this._a.push(reaction);
	      if(this._s)notify(this, false);
	      return reaction.promise;
	    },
	    // 25.4.5.1 Promise.prototype.catch(onRejected)
	    'catch': function(onRejected){
	      return this.then(undefined, onRejected);
	    }
	  });
	  PromiseCapability = function(){
	    var promise  = new Internal;
	    this.promise = promise;
	    this.resolve = ctx($resolve, promise, 1);
	    this.reject  = ctx($reject, promise, 1);
	  };
	}
	
	$export($export.G + $export.W + $export.F * !USE_NATIVE, {Promise: $Promise});
	__webpack_require__(49)($Promise, PROMISE);
	__webpack_require__(69)(PROMISE);
	Wrapper = __webpack_require__(17)[PROMISE];
	
	// statics
	$export($export.S + $export.F * !USE_NATIVE, PROMISE, {
	  // 25.4.4.5 Promise.reject(r)
	  reject: function reject(r){
	    var capability = newPromiseCapability(this)
	      , $$reject   = capability.reject;
	    $$reject(r);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * (LIBRARY || !USE_NATIVE), PROMISE, {
	  // 25.4.4.6 Promise.resolve(x)
	  resolve: function resolve(x){
	    // instanceof instead of internal slot check because we should fix it without replacement native Promise core
	    if(x instanceof $Promise && sameConstructor(x.constructor, this))return x;
	    var capability = newPromiseCapability(this)
	      , $$resolve  = capability.resolve;
	    $$resolve(x);
	    return capability.promise;
	  }
	});
	$export($export.S + $export.F * !(USE_NATIVE && __webpack_require__(70)(function(iter){
	  $Promise.all(iter)['catch'](empty);
	})), PROMISE, {
	  // 25.4.4.1 Promise.all(iterable)
	  all: function all(iterable){
	    var C          = this
	      , capability = newPromiseCapability(C)
	      , resolve    = capability.resolve
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      var values    = []
	        , index     = 0
	        , remaining = 1;
	      forOf(iterable, false, function(promise){
	        var $index        = index++
	          , alreadyCalled = false;
	        values.push(undefined);
	        remaining++;
	        C.resolve(promise).then(function(value){
	          if(alreadyCalled)return;
	          alreadyCalled  = true;
	          values[$index] = value;
	          --remaining || resolve(values);
	        }, reject);
	      });
	      --remaining || resolve(values);
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  },
	  // 25.4.4.4 Promise.race(iterable)
	  race: function race(iterable){
	    var C          = this
	      , capability = newPromiseCapability(C)
	      , reject     = capability.reject;
	    var abrupt = perform(function(){
	      forOf(iterable, false, function(promise){
	        C.resolve(promise).then(capability.resolve, reject);
	      });
	    });
	    if(abrupt)reject(abrupt.error);
	    return capability.promise;
	  }
	});

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	// getting tag from 19.1.3.6 Object.prototype.toString()
	var cof = __webpack_require__(40)
	  , TAG = __webpack_require__(50)('toStringTag')
	  // ES3 wrong here
	  , ARG = cof(function(){ return arguments; }()) == 'Arguments';
	
	// fallback for IE11 Script Access Denied error
	var tryGet = function(it, key){
	  try {
	    return it[key];
	  } catch(e){ /* empty */ }
	};
	
	module.exports = function(it){
	  var O, T, B;
	  return it === undefined ? 'Undefined' : it === null ? 'Null'
	    // @@toStringTag case
	    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
	    // builtinTag case
	    : ARG ? cof(O)
	    // ES3 arguments fallback
	    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
	};

/***/ },
/* 59 */
/***/ function(module, exports) {

	module.exports = function(it, Constructor, name, forbiddenField){
	  if(!(it instanceof Constructor) || (forbiddenField !== undefined && forbiddenField in it)){
	    throw TypeError(name + ': incorrect invocation!');
	  } return it;
	};

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

	var ctx         = __webpack_require__(18)
	  , call        = __webpack_require__(61)
	  , isArrayIter = __webpack_require__(62)
	  , anObject    = __webpack_require__(22)
	  , toLength    = __webpack_require__(42)
	  , getIterFn   = __webpack_require__(63)
	  , BREAK       = {}
	  , RETURN      = {};
	var exports = module.exports = function(iterable, entries, fn, that, ITERATOR){
	  var iterFn = ITERATOR ? function(){ return iterable; } : getIterFn(iterable)
	    , f      = ctx(fn, that, entries ? 2 : 1)
	    , index  = 0
	    , length, step, iterator, result;
	  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
	  // fast case for arrays with default iterator
	  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
	    result = entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
	    if(result === BREAK || result === RETURN)return result;
	  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
	    result = call(iterator, f, step.value, entries);
	    if(result === BREAK || result === RETURN)return result;
	  }
	};
	exports.BREAK  = BREAK;
	exports.RETURN = RETURN;

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

	// call something on iterator step with safe closing on error
	var anObject = __webpack_require__(22);
	module.exports = function(iterator, fn, value, entries){
	  try {
	    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
	  // 7.4.6 IteratorClose(iterator, completion)
	  } catch(e){
	    var ret = iterator['return'];
	    if(ret !== undefined)anObject(ret.call(iterator));
	    throw e;
	  }
	};

/***/ },
/* 62 */
/***/ function(module, exports, __webpack_require__) {

	// check on default Array iterator
	var Iterators  = __webpack_require__(32)
	  , ITERATOR   = __webpack_require__(50)('iterator')
	  , ArrayProto = Array.prototype;
	
	module.exports = function(it){
	  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
	};

/***/ },
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(58)
	  , ITERATOR  = __webpack_require__(50)('iterator')
	  , Iterators = __webpack_require__(32);
	module.exports = __webpack_require__(17).getIteratorMethod = function(it){
	  if(it != undefined)return it[ITERATOR]
	    || it['@@iterator']
	    || Iterators[classof(it)];
	};

/***/ },
/* 64 */
/***/ function(module, exports, __webpack_require__) {

	// 7.3.20 SpeciesConstructor(O, defaultConstructor)
	var anObject  = __webpack_require__(22)
	  , aFunction = __webpack_require__(19)
	  , SPECIES   = __webpack_require__(50)('species');
	module.exports = function(O, D){
	  var C = anObject(O).constructor, S;
	  return C === undefined || (S = anObject(C)[SPECIES]) == undefined ? D : aFunction(S);
	};

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

	var ctx                = __webpack_require__(18)
	  , invoke             = __webpack_require__(66)
	  , html               = __webpack_require__(48)
	  , cel                = __webpack_require__(27)
	  , global             = __webpack_require__(16)
	  , process            = global.process
	  , setTask            = global.setImmediate
	  , clearTask          = global.clearImmediate
	  , MessageChannel     = global.MessageChannel
	  , counter            = 0
	  , queue              = {}
	  , ONREADYSTATECHANGE = 'onreadystatechange'
	  , defer, channel, port;
	var run = function(){
	  var id = +this;
	  if(queue.hasOwnProperty(id)){
	    var fn = queue[id];
	    delete queue[id];
	    fn();
	  }
	};
	var listener = function(event){
	  run.call(event.data);
	};
	// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
	if(!setTask || !clearTask){
	  setTask = function setImmediate(fn){
	    var args = [], i = 1;
	    while(arguments.length > i)args.push(arguments[i++]);
	    queue[++counter] = function(){
	      invoke(typeof fn == 'function' ? fn : Function(fn), args);
	    };
	    defer(counter);
	    return counter;
	  };
	  clearTask = function clearImmediate(id){
	    delete queue[id];
	  };
	  // Node.js 0.8-
	  if(__webpack_require__(40)(process) == 'process'){
	    defer = function(id){
	      process.nextTick(ctx(run, id, 1));
	    };
	  // Browsers with MessageChannel, includes WebWorkers
	  } else if(MessageChannel){
	    channel = new MessageChannel;
	    port    = channel.port2;
	    channel.port1.onmessage = listener;
	    defer = ctx(port.postMessage, port, 1);
	  // Browsers with postMessage, skip WebWorkers
	  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
	  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScripts){
	    defer = function(id){
	      global.postMessage(id + '', '*');
	    };
	    global.addEventListener('message', listener, false);
	  // IE8-
	  } else if(ONREADYSTATECHANGE in cel('script')){
	    defer = function(id){
	      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
	        html.removeChild(this);
	        run.call(id);
	      };
	    };
	  // Rest old browsers
	  } else {
	    defer = function(id){
	      setTimeout(ctx(run, id, 1), 0);
	    };
	  }
	}
	module.exports = {
	  set:   setTask,
	  clear: clearTask
	};

/***/ },
/* 66 */
/***/ function(module, exports) {

	// fast apply, http://jsperf.lnkit.com/fast-apply/5
	module.exports = function(fn, args, that){
	  var un = that === undefined;
	  switch(args.length){
	    case 0: return un ? fn()
	                      : fn.call(that);
	    case 1: return un ? fn(args[0])
	                      : fn.call(that, args[0]);
	    case 2: return un ? fn(args[0], args[1])
	                      : fn.call(that, args[0], args[1]);
	    case 3: return un ? fn(args[0], args[1], args[2])
	                      : fn.call(that, args[0], args[1], args[2]);
	    case 4: return un ? fn(args[0], args[1], args[2], args[3])
	                      : fn.call(that, args[0], args[1], args[2], args[3]);
	  } return              fn.apply(that, args);
	};

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

	var global    = __webpack_require__(16)
	  , macrotask = __webpack_require__(65).set
	  , Observer  = global.MutationObserver || global.WebKitMutationObserver
	  , process   = global.process
	  , Promise   = global.Promise
	  , isNode    = __webpack_require__(40)(process) == 'process';
	
	module.exports = function(){
	  var head, last, notify;
	
	  var flush = function(){
	    var parent, fn;
	    if(isNode && (parent = process.domain))parent.exit();
	    while(head){
	      fn   = head.fn;
	      head = head.next;
	      try {
	        fn();
	      } catch(e){
	        if(head)notify();
	        else last = undefined;
	        throw e;
	      }
	    } last = undefined;
	    if(parent)parent.enter();
	  };
	
	  // Node.js
	  if(isNode){
	    notify = function(){
	      process.nextTick(flush);
	    };
	  // browsers with MutationObserver
	  } else if(Observer){
	    var toggle = true
	      , node   = document.createTextNode('');
	    new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
	    notify = function(){
	      node.data = toggle = !toggle;
	    };
	  // environments with maybe non-completely correct, but existent Promise
	  } else if(Promise && Promise.resolve){
	    var promise = Promise.resolve();
	    notify = function(){
	      promise.then(flush);
	    };
	  // for other environments - macrotask based on:
	  // - setImmediate
	  // - MessageChannel
	  // - window.postMessag
	  // - onreadystatechange
	  // - setTimeout
	  } else {
	    notify = function(){
	      // strange IE + webpack dev server bug - use .call(global)
	      macrotask.call(global, flush);
	    };
	  }
	
	  return function(fn){
	    var task = {fn: fn, next: undefined};
	    if(last)last.next = task;
	    if(!head){
	      head = task;
	      notify();
	    } last = task;
	  };
	};

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	var hide = __webpack_require__(20);
	module.exports = function(target, src, safe){
	  for(var key in src){
	    if(safe && target[key])target[key] = src[key];
	    else hide(target, key, src[key]);
	  } return target;
	};

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global      = __webpack_require__(16)
	  , core        = __webpack_require__(17)
	  , dP          = __webpack_require__(21)
	  , DESCRIPTORS = __webpack_require__(25)
	  , SPECIES     = __webpack_require__(50)('species');
	
	module.exports = function(KEY){
	  var C = typeof core[KEY] == 'function' ? core[KEY] : global[KEY];
	  if(DESCRIPTORS && C && !C[SPECIES])dP.f(C, SPECIES, {
	    configurable: true,
	    get: function(){ return this; }
	  });
	};

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	var ITERATOR     = __webpack_require__(50)('iterator')
	  , SAFE_CLOSING = false;
	
	try {
	  var riter = [7][ITERATOR]();
	  riter['return'] = function(){ SAFE_CLOSING = true; };
	  Array.from(riter, function(){ throw 2; });
	} catch(e){ /* empty */ }
	
	module.exports = function(exec, skipClosing){
	  if(!skipClosing && !SAFE_CLOSING)return false;
	  var safe = false;
	  try {
	    var arr  = [7]
	      , iter = arr[ITERATOR]();
	    iter.next = function(){ return {done: safe = true}; };
	    arr[ITERATOR] = function(){ return iter; };
	    exec(arr);
	  } catch(e){ /* empty */ }
	  return safe;
	};

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _isIterable2 = __webpack_require__(72);
	
	var _isIterable3 = _interopRequireDefault(_isIterable2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];
	    var _n = true;
	    var _d = false;
	    var _e = undefined;
	
	    try {
	      for (var _i = (0, _getIterator3.default)(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);
	
	        if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;
	      _e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }
	
	    return _arr;
	  }
	
	  return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if ((0, _isIterable3.default)(Object(arr))) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(73), __esModule: true };

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(53);
	__webpack_require__(9);
	module.exports = __webpack_require__(74);

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	var classof   = __webpack_require__(58)
	  , ITERATOR  = __webpack_require__(50)('iterator')
	  , Iterators = __webpack_require__(32);
	module.exports = __webpack_require__(17).isIterable = function(it){
	  var O = Object(it);
	  return O[ITERATOR] !== undefined
	    || '@@iterator' in O
	    || Iterators.hasOwnProperty(classof(O));
	};

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(76), __esModule: true };

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(53);
	__webpack_require__(9);
	module.exports = __webpack_require__(77);

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(22)
	  , get      = __webpack_require__(63);
	module.exports = __webpack_require__(17).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.NotifyOnce = exports.NotifyAfter = exports.Notify = exports.asyncWait = exports.SafeIterable = exports.Less = exports.Equal = exports.Greater = undefined;
	
	var _promise = __webpack_require__(6);
	
	var _promise2 = _interopRequireDefault(_promise);
	
	var _asyncToGenerator2 = __webpack_require__(5);
	
	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);
	
	var _keys = __webpack_require__(79);
	
	var _keys2 = _interopRequireDefault(_keys);
	
	var _from = __webpack_require__(83);
	
	var _from2 = _interopRequireDefault(_from);
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _regenerator = __webpack_require__(1);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _assign = __webpack_require__(87);
	
	var _assign2 = _interopRequireDefault(_assign);
	
	var _getPrototypeOf = __webpack_require__(93);
	
	var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	var _possibleConstructorReturn2 = __webpack_require__(101);
	
	var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);
	
	var _inherits2 = __webpack_require__(119);
	
	var _inherits3 = _interopRequireDefault(_inherits2);
	
	var asyncWait = exports.asyncWait = function () {
	  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee8(ms) {
	    return _regenerator2.default.wrap(function _callee8$(_context10) {
	      while (1) {
	        switch (_context10.prev = _context10.next) {
	          case 0:
	            return _context10.abrupt('return', new _promise2.default(function (resolve, reject) {
	              setTimeout(function () {
	                resolve();
	              }, ms);
	            }));
	
	          case 1:
	          case 'end':
	            return _context10.stop();
	        }
	      }
	    }, _callee8, this);
	  }));
	
	  return function asyncWait(_x) {
	    return _ref.apply(this, arguments);
	  };
	}();
	
	exports.genUid = genUid;
	exports.clone = clone;
	exports.merge = merge;
	exports.specificRange = specificRange;
	exports.map = map;
	exports.objectFrom = objectFrom;
	exports.array = array;
	exports.string = string;
	exports.range = range;
	exports.reverseRange = reverseRange;
	exports.reverseSpecificRange = reverseSpecificRange;
	exports.reverseString = reverseString;
	exports.counter = counter;
	exports.length = length;
	exports.calculatePrefixLength = calculatePrefixLength;
	exports.calculatePostfixLength = calculatePostfixLength;
	exports.repeat = repeat;
	exports.maxOfIterable = maxOfIterable;
	exports.allKeys = allKeys;
	exports.concat = concat;
	exports.push = push;
	exports.insert = insert;
	exports.remove = remove;
	exports.removeInPlace = removeInPlace;
	exports.removeLastInPlace = removeLastInPlace;
	exports.popRandom = popRandom;
	exports.allEqual = allEqual;
	exports.characters = characters;
	exports.filter = filter;
	exports.skipNulls = skipNulls;
	exports.defaultFallback = defaultFallback;
	exports.fillDefaults = fillDefaults;
	exports.substring = substring;
	exports.subarray = subarray;
	exports.removeTail = removeTail;
	exports.reverse = reverse;
	exports.findIndex = findIndex;
	exports.find = find;
	exports.findLastIndex = findLastIndex;
	exports.hashCode = hashCode;
	exports.hash = hash;
	exports.last = last;
	exports.first = first;
	exports.maybeLast = maybeLast;
	exports.maybeFirst = maybeFirst;
	exports.maybePush = maybePush;
	exports.flatten = flatten;
	exports.zipPairs = zipPairs;
	exports.zipLongest = zipLongest;
	exports.zip = zip;
	exports.all = all;
	exports.filterInPlace = filterInPlace;
	exports.pop = pop;
	exports.contains = contains;
	exports.asyncSleep = asyncSleep;
	
	var _wu = __webpack_require__(127);
	
	var Wu = _interopRequireWildcard(_wu);
	
	var _iterable_base = __webpack_require__(128);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var _marked = [counter, allKeys].map(_regenerator2.default.mark);
	
	var Greater = exports.Greater = 1;
	var Equal = exports.Equal = 0;
	var Less = exports.Less = -1;
	
	// returns Greater if a  >  b
	//         Less    if a  <  b
	//         Equal   if a === b
	
	var SafeIterable = exports.SafeIterable = function (_IterableBase) {
	  (0, _inherits3.default)(SafeIterable, _IterableBase);
	
	  function SafeIterable(ts) {
	    (0, _classCallCheck3.default)(this, SafeIterable);
	
	    var _this = (0, _possibleConstructorReturn3.default)(this, (SafeIterable.__proto__ || (0, _getPrototypeOf2.default)(SafeIterable)).call(this));
	
	    _this.ts = ts;
	    return _this;
	  }
	
	  (0, _createClass3.default)(SafeIterable, [{
	    key: 'iterator',
	    value: function iterator() {
	      return this.ts();
	    }
	  }]);
	  return SafeIterable;
	}(_iterable_base.IterableBase);
	
	function genUid() {
	  return Math.random().toString().substring(2, 6);
	}
	
	function clone(object) {
	  // -ignore
	  return (0, _assign2.default)({}, object);
	}
	
	function merge(a, b) {
	  // -ignore
	  return (0, _assign2.default)(clone(a), b);
	}
	
	function specificRange(start, stop, step) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee() {
	    var _i;
	
	    return _regenerator2.default.wrap(function _callee$(_context) {
	      while (1) {
	        switch (_context.prev = _context.next) {
	          case 0:
	            _i = start;
	
	          case 1:
	            if (!(_i < stop)) {
	              _context.next = 7;
	              break;
	            }
	
	            _context.next = 4;
	            return _i;
	
	          case 4:
	            _i += step;
	            _context.next = 1;
	            break;
	
	          case 7:
	          case 'end':
	            return _context.stop();
	        }
	      }
	    }, _callee, this);
	  }));
	}
	
	function map(t1s, f) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee2() {
	    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _t;
	
	    return _regenerator2.default.wrap(function _callee2$(_context2) {
	      while (1) {
	        switch (_context2.prev = _context2.next) {
	          case 0:
	            _iteratorNormalCompletion = true;
	            _didIteratorError = false;
	            _iteratorError = undefined;
	            _context2.prev = 3;
	            _iterator = (0, _getIterator3.default)(t1s);
	
	          case 5:
	            if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
	              _context2.next = 12;
	              break;
	            }
	
	            _t = _step.value;
	            _context2.next = 9;
	            return f(_t);
	
	          case 9:
	            _iteratorNormalCompletion = true;
	            _context2.next = 5;
	            break;
	
	          case 12:
	            _context2.next = 18;
	            break;
	
	          case 14:
	            _context2.prev = 14;
	            _context2.t0 = _context2['catch'](3);
	            _didIteratorError = true;
	            _iteratorError = _context2.t0;
	
	          case 18:
	            _context2.prev = 18;
	            _context2.prev = 19;
	
	            if (!_iteratorNormalCompletion && _iterator.return) {
	              _iterator.return();
	            }
	
	          case 21:
	            _context2.prev = 21;
	
	            if (!_didIteratorError) {
	              _context2.next = 24;
	              break;
	            }
	
	            throw _iteratorError;
	
	          case 24:
	            return _context2.finish(21);
	
	          case 25:
	            return _context2.finish(18);
	
	          case 26:
	          case 'end':
	            return _context2.stop();
	        }
	      }
	    }, _callee2, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	  }));
	}
	
	function objectFrom(tuples) {
	  var obj = {};
	  var _iteratorNormalCompletion2 = true;
	  var _didIteratorError2 = false;
	  var _iteratorError2 = undefined;
	
	  try {
	    for (var _iterator2 = (0, _getIterator3.default)(tuples), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	      var _step2$value = (0, _slicedToArray3.default)(_step2.value, 2),
	          _key = _step2$value[0],
	          _t2 = _step2$value[1];
	
	      obj[_key] = _t2;
	    }
	  } catch (err) {
	    _didIteratorError2 = true;
	    _iteratorError2 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion2 && _iterator2.return) {
	        _iterator2.return();
	      }
	    } finally {
	      if (_didIteratorError2) {
	        throw _iteratorError2;
	      }
	    }
	  }
	
	  return obj;
	}
	
	function array(is) {
	  return (0, _from2.default)(is);
	}
	
	function string(is) {
	  return (0, _from2.default)(is).join('');
	}
	
	function range(stop) {
	  return specificRange(0, stop, 1);
	}
	
	function reverseRange(stop) {
	  return reverseSpecificRange(0, stop, 1);
	}
	
	function reverseSpecificRange(start, stop, step) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee3() {
	    var actualStop, _i2;
	
	    return _regenerator2.default.wrap(function _callee3$(_context3) {
	      while (1) {
	        switch (_context3.prev = _context3.next) {
	          case 0:
	            actualStop = start + (Math.ceil((stop - start) / step) - 1) * step; // this is tested ;)
	
	            _i2 = actualStop;
	
	          case 2:
	            if (!(_i2 >= start)) {
	              _context3.next = 8;
	              break;
	            }
	
	            _context3.next = 5;
	            return _i2;
	
	          case 5:
	            _i2 -= step;
	            _context3.next = 2;
	            break;
	
	          case 8:
	          case 'end':
	            return _context3.stop();
	        }
	      }
	    }, _callee3, this);
	  }));
	}
	
	function reverseString(s) {
	  return map(reverseRange(s.length), function (i) {
	    return s[i];
	  });
	}
	
	function counter() {
	  var i;
	  return _regenerator2.default.wrap(function counter$(_context4) {
	    while (1) {
	      switch (_context4.prev = _context4.next) {
	        case 0:
	          i = 0;
	
	        case 1:
	          if (false) {
	            _context4.next = 7;
	            break;
	          }
	
	          _context4.next = 4;
	          return i;
	
	        case 4:
	          i += 1;
	          _context4.next = 1;
	          break;
	
	        case 7:
	        case 'end':
	          return _context4.stop();
	      }
	    }
	  }, _marked[0], this);
	}
	
	function length(s) {
	  var length = 0;
	  var _iteratorNormalCompletion3 = true;
	  var _didIteratorError3 = false;
	  var _iteratorError3 = undefined;
	
	  try {
	    for (var _iterator3 = (0, _getIterator3.default)(s), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	      var c = _step3.value;
	
	      length += 1;
	    }
	  } catch (err) {
	    _didIteratorError3 = true;
	    _iteratorError3 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion3 && _iterator3.return) {
	        _iterator3.return();
	      }
	    } finally {
	      if (_didIteratorError3) {
	        throw _iteratorError3;
	      }
	    }
	  }
	
	  return length;
	}
	
	function calculatePrefixLength(text0, text1) {
	  var _iteratorNormalCompletion4 = true;
	  var _didIteratorError4 = false;
	  var _iteratorError4 = undefined;
	
	  try {
	    for (var _iterator4 = (0, _getIterator3.default)(zip(zipLongest(text0, text1), counter())), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	      var _step4$value = (0, _slicedToArray3.default)(_step4.value, 2),
	          _step4$value$ = (0, _slicedToArray3.default)(_step4$value[0], 2),
	          c0 = _step4$value$[0],
	          c1 = _step4$value$[1],
	          _i3 = _step4$value[1];
	
	      if (c0 != c1) {
	        return _i3;
	      }
	    }
	  } catch (err) {
	    _didIteratorError4 = true;
	    _iteratorError4 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion4 && _iterator4.return) {
	        _iterator4.return();
	      }
	    } finally {
	      if (_didIteratorError4) {
	        throw _iteratorError4;
	      }
	    }
	  }
	
	  return Math.max(length(text0), length(text1));
	}
	
	function calculatePostfixLength(text0, text1) {
	  return calculatePrefixLength(reverseString(text0), reverseString(text1));
	}
	
	function repeat(num, f) {
	  return map(range(num), f);
	}
	
	function maxOfIterable(ts, comparitor) {
	  var maxT = undefined;
	  var _iteratorNormalCompletion5 = true;
	  var _didIteratorError5 = false;
	  var _iteratorError5 = undefined;
	
	  try {
	    for (var _iterator5 = (0, _getIterator3.default)(ts), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	      var _t3 = _step5.value;
	
	      if (maxT === undefined || comparitor(_t3, maxT) === Greater) {
	        maxT = _t3;
	      }
	    }
	  } catch (err) {
	    _didIteratorError5 = true;
	    _iteratorError5 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion5 && _iterator5.return) {
	        _iterator5.return();
	      }
	    } finally {
	      if (_didIteratorError5) {
	        throw _iteratorError5;
	      }
	    }
	  }
	
	  if (maxT === undefined) {
	    throw "Couldn't find largest element of sequence";
	  }
	
	  return maxT;
	}
	
	function allKeys(a, b) {
	  var seenKeys, _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, _key2;
	
	  return _regenerator2.default.wrap(function allKeys$(_context5) {
	    while (1) {
	      switch (_context5.prev = _context5.next) {
	        case 0:
	          seenKeys = {};
	          _iteratorNormalCompletion6 = true;
	          _didIteratorError6 = false;
	          _iteratorError6 = undefined;
	          _context5.prev = 4;
	          _iterator6 = (0, _getIterator3.default)((0, _keys2.default)(a).concat((0, _keys2.default)(b)));
	
	        case 6:
	          if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
	            _context5.next = 16;
	            break;
	          }
	
	          _key2 = _step6.value;
	
	          if (!(_key2 in seenKeys)) {
	            _context5.next = 10;
	            break;
	          }
	
	          return _context5.abrupt('continue', 13);
	
	        case 10:
	          _context5.next = 12;
	          return _key2;
	
	        case 12:
	          seenKeys[_key2] = true;
	
	        case 13:
	          _iteratorNormalCompletion6 = true;
	          _context5.next = 6;
	          break;
	
	        case 16:
	          _context5.next = 22;
	          break;
	
	        case 18:
	          _context5.prev = 18;
	          _context5.t0 = _context5['catch'](4);
	          _didIteratorError6 = true;
	          _iteratorError6 = _context5.t0;
	
	        case 22:
	          _context5.prev = 22;
	          _context5.prev = 23;
	
	          if (!_iteratorNormalCompletion6 && _iterator6.return) {
	            _iterator6.return();
	          }
	
	        case 25:
	          _context5.prev = 25;
	
	          if (!_didIteratorError6) {
	            _context5.next = 28;
	            break;
	          }
	
	          throw _iteratorError6;
	
	        case 28:
	          return _context5.finish(25);
	
	        case 29:
	          return _context5.finish(22);
	
	        case 30:
	        case 'end':
	          return _context5.stop();
	      }
	    }
	  }, _marked[1], this, [[4, 18, 22, 30], [23,, 25, 29]]);
	}
	
	function concat(a, t) {
	  return a.concat(t); // not mutating :)
	}
	
	function push(a, t) {
	  return a.concat(t); // not mutating :)
	}
	
	function insert(a, t, i) {
	  return a.slice(0, i).concat([t]).concat(a.slice(i));
	}
	
	function remove(a, i) {
	  return a.slice(0, Math.max(0, i - 1)).concat(a.slice(i));
	}
	
	function removeInPlace(a, i) {
	  a.splice(i, 1);
	}
	
	function removeLastInPlace(a, i) {
	  a.pop();
	}
	
	function popRandom(a) {
	  var i = Math.floor(Math.random() * a.length);
	  var result = a[i];
	  remove(a, i);
	  return result;
	}
	
	function allEqual(as) {
	  var val = as[0];
	  var _iteratorNormalCompletion7 = true;
	  var _didIteratorError7 = false;
	  var _iteratorError7 = undefined;
	
	  try {
	    for (var _iterator7 = (0, _getIterator3.default)(as), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
	      var _a = _step7.value;
	
	      if (val !== _a) {
	        return false;
	      }
	    }
	  } catch (err) {
	    _didIteratorError7 = true;
	    _iteratorError7 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion7 && _iterator7.return) {
	        _iterator7.return();
	      }
	    } finally {
	      if (_didIteratorError7) {
	        throw _iteratorError7;
	      }
	    }
	  }
	
	  return true;
	}
	
	function characters(s, indices) {
	  if (!indices) {
	    indices = range(s.length);
	  }
	
	  return map(indices, function (i) {
	    return s[i];
	  });
	}
	
	function filter(ts, f) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee4() {
	    var _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, _t4;
	
	    return _regenerator2.default.wrap(function _callee4$(_context6) {
	      while (1) {
	        switch (_context6.prev = _context6.next) {
	          case 0:
	            _iteratorNormalCompletion8 = true;
	            _didIteratorError8 = false;
	            _iteratorError8 = undefined;
	            _context6.prev = 3;
	            _iterator8 = (0, _getIterator3.default)(ts);
	
	          case 5:
	            if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
	              _context6.next = 13;
	              break;
	            }
	
	            _t4 = _step8.value;
	
	            if (!f(_t4)) {
	              _context6.next = 10;
	              break;
	            }
	
	            _context6.next = 10;
	            return _t4;
	
	          case 10:
	            _iteratorNormalCompletion8 = true;
	            _context6.next = 5;
	            break;
	
	          case 13:
	            _context6.next = 19;
	            break;
	
	          case 15:
	            _context6.prev = 15;
	            _context6.t0 = _context6['catch'](3);
	            _didIteratorError8 = true;
	            _iteratorError8 = _context6.t0;
	
	          case 19:
	            _context6.prev = 19;
	            _context6.prev = 20;
	
	            if (!_iteratorNormalCompletion8 && _iterator8.return) {
	              _iterator8.return();
	            }
	
	          case 22:
	            _context6.prev = 22;
	
	            if (!_didIteratorError8) {
	              _context6.next = 25;
	              break;
	            }
	
	            throw _iteratorError8;
	
	          case 25:
	            return _context6.finish(22);
	
	          case 26:
	            return _context6.finish(19);
	
	          case 27:
	          case 'end':
	            return _context6.stop();
	        }
	      }
	    }, _callee4, this, [[3, 15, 19, 27], [20,, 22, 26]]);
	  }));
	}
	
	/* -ignore */
	function skipNulls(ts) {
	  return filter(ts, function (t) {
	    return t != null;
	  });
	}
	
	function defaultFallback(t, def) {
	  if (t === undefined || t === null) {
	    return def;
	  }
	
	  return t;
	}
	
	function fillDefaults(t, defaults) {
	  return merge(defaults, t || {});
	}
	
	function substring(s, opt) {
	  var start = defaultFallback(opt.start, 0);
	  var stop = defaultFallback(opt.stop, s.length);
	  var step = defaultFallback(opt.step, 1);
	
	  return characters(s, specificRange(start, stop, step));
	}
	
	function subarray(arr, opt) {
	  var start = defaultFallback(opt.start, 0);
	  var stop = defaultFallback(opt.stop, arr.length);
	  var step = defaultFallback(opt.step, 1);
	
	  return map(specificRange(start, stop, step), function (i) {
	    return arr[i];
	  });
	}
	
	function removeTail(s, n) {
	  return substring(s, { stop: s.length - n });
	}
	
	function reverse(arr) {
	  return map(reverseRange(arr.length), function (i) {
	    return arr[i];
	  });
	}
	
	function findIndex(f, arr) {
	  var _iteratorNormalCompletion9 = true;
	  var _didIteratorError9 = false;
	  var _iteratorError9 = undefined;
	
	  try {
	    for (var _iterator9 = (0, _getIterator3.default)(zip(arr, counter())), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
	      var _step9$value = (0, _slicedToArray3.default)(_step9.value, 2),
	          _t5 = _step9$value[0],
	          _i4 = _step9$value[1];
	
	      if (f(_t5)) {
	        return _i4;
	      }
	    }
	  } catch (err) {
	    _didIteratorError9 = true;
	    _iteratorError9 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion9 && _iterator9.return) {
	        _iterator9.return();
	      }
	    } finally {
	      if (_didIteratorError9) {
	        throw _iteratorError9;
	      }
	    }
	  }
	
	  return undefined;
	}
	
	function find(f, arr) {
	  var i = findIndex(f, arr);
	  if (i == null) {
	    return undefined;
	  }
	
	  return arr[i];
	}
	
	function findLastIndex(f, arr) {
	  for (var _i5 = arr.length - 1; _i5 >= 0; _i5--) {
	    if (f(arr[_i5])) {
	      return _i5;
	    }
	  }
	
	  return undefined;
	}
	
	function hashCode(str) {
	  // taken from stack overflow
	  var hash = 0;
	  if (str.length == 0) return hash;
	
	  for (var _i6 = 0; _i6 < str.length; _i6++) {
	    var char = str.charCodeAt(_i6);
	    hash = (hash << 5) - hash + char;
	    hash = hash & hash;
	  }
	  return hash;
	}
	
	function hash(str) {
	  return '' + hashCode(str) % 10000;
	}
	
	function last(arr) {
	  if (arr.length === 0) {
	    throw new Error('wat no last');
	  }
	  return arr[arr.length - 1];
	}
	
	function first(arr) {
	  if (arr.length === 0) {
	    throw new Error('wat no first');
	  }
	  return arr[0];
	}
	
	function maybeLast(arr) {
	  return arr[arr.length - 1];
	}
	
	function maybeFirst(arr) {
	  return arr[0];
	}
	
	function maybePush(arr, a) {
	  if (a == null) {
	    return arr;
	  } else {
	    return push(arr, a);
	  }
	}
	
	function flatten(tree) {
	  var as = [];
	
	  var f = function f(subtree) {
	    var _iteratorNormalCompletion10 = true;
	    var _didIteratorError10 = false;
	    var _iteratorError10 = undefined;
	
	    try {
	      for (var _iterator10 = (0, _getIterator3.default)(subtree), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
	        var _a2 = _step10.value;
	
	        if (Array.isArray(_a2)) {
	          f(_a2);
	        } else {
	          as.push(_a2);
	        }
	      }
	    } catch (err) {
	      _didIteratorError10 = true;
	      _iteratorError10 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion10 && _iterator10.return) {
	          _iterator10.return();
	        }
	      } finally {
	        if (_didIteratorError10) {
	          throw _iteratorError10;
	        }
	      }
	    }
	  };
	
	  f(tree);
	
	  return as;
	}
	
	function zipPairs(arr) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee5() {
	    var _i7;
	
	    return _regenerator2.default.wrap(function _callee5$(_context7) {
	      while (1) {
	        switch (_context7.prev = _context7.next) {
	          case 0:
	            _i7 = 0;
	
	          case 1:
	            if (!(_i7 < arr.length - 1)) {
	              _context7.next = 7;
	              break;
	            }
	
	            _context7.next = 4;
	            return [arr[_i7], arr[_i7 + 1]];
	
	          case 4:
	            _i7++;
	            _context7.next = 1;
	            break;
	
	          case 7:
	          case 'end':
	            return _context7.stop();
	        }
	      }
	    }, _callee5, this);
	  }));
	}
	
	function zipLongest(t1s, t2s) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee6() {
	    var _iteratorNormalCompletion11, _didIteratorError11, _iteratorError11, _iterator11, _step11, _step11$value, _t6, t2;
	
	    return _regenerator2.default.wrap(function _callee6$(_context8) {
	      while (1) {
	        switch (_context8.prev = _context8.next) {
	          case 0:
	            _iteratorNormalCompletion11 = true;
	            _didIteratorError11 = false;
	            _iteratorError11 = undefined;
	            _context8.prev = 3;
	            _iterator11 = (0, _getIterator3.default)(Wu.zipLongest(t1s, t2s));
	
	          case 5:
	            if (_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done) {
	              _context8.next = 12;
	              break;
	            }
	
	            _step11$value = (0, _slicedToArray3.default)(_step11.value, 2), _t6 = _step11$value[0], t2 = _step11$value[1];
	            _context8.next = 9;
	            return [_t6, t2];
	
	          case 9:
	            _iteratorNormalCompletion11 = true;
	            _context8.next = 5;
	            break;
	
	          case 12:
	            _context8.next = 18;
	            break;
	
	          case 14:
	            _context8.prev = 14;
	            _context8.t0 = _context8['catch'](3);
	            _didIteratorError11 = true;
	            _iteratorError11 = _context8.t0;
	
	          case 18:
	            _context8.prev = 18;
	            _context8.prev = 19;
	
	            if (!_iteratorNormalCompletion11 && _iterator11.return) {
	              _iterator11.return();
	            }
	
	          case 21:
	            _context8.prev = 21;
	
	            if (!_didIteratorError11) {
	              _context8.next = 24;
	              break;
	            }
	
	            throw _iteratorError11;
	
	          case 24:
	            return _context8.finish(21);
	
	          case 25:
	            return _context8.finish(18);
	
	          case 26:
	          case 'end':
	            return _context8.stop();
	        }
	      }
	    }, _callee6, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	  }));
	}
	
	function zip(t1s, t2s) {
	  return new SafeIterable(_regenerator2.default.mark(function _callee7() {
	    var _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, _step12$value, _t7, t2;
	
	    return _regenerator2.default.wrap(function _callee7$(_context9) {
	      while (1) {
	        switch (_context9.prev = _context9.next) {
	          case 0:
	            _iteratorNormalCompletion12 = true;
	            _didIteratorError12 = false;
	            _iteratorError12 = undefined;
	            _context9.prev = 3;
	            _iterator12 = (0, _getIterator3.default)(Wu.zip(t1s, t2s));
	
	          case 5:
	            if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
	              _context9.next = 12;
	              break;
	            }
	
	            _step12$value = (0, _slicedToArray3.default)(_step12.value, 2), _t7 = _step12$value[0], t2 = _step12$value[1];
	            _context9.next = 9;
	            return [_t7, t2];
	
	          case 9:
	            _iteratorNormalCompletion12 = true;
	            _context9.next = 5;
	            break;
	
	          case 12:
	            _context9.next = 18;
	            break;
	
	          case 14:
	            _context9.prev = 14;
	            _context9.t0 = _context9['catch'](3);
	            _didIteratorError12 = true;
	            _iteratorError12 = _context9.t0;
	
	          case 18:
	            _context9.prev = 18;
	            _context9.prev = 19;
	
	            if (!_iteratorNormalCompletion12 && _iterator12.return) {
	              _iterator12.return();
	            }
	
	          case 21:
	            _context9.prev = 21;
	
	            if (!_didIteratorError12) {
	              _context9.next = 24;
	              break;
	            }
	
	            throw _iteratorError12;
	
	          case 24:
	            return _context9.finish(21);
	
	          case 25:
	            return _context9.finish(18);
	
	          case 26:
	          case 'end':
	            return _context9.stop();
	        }
	      }
	    }, _callee7, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	  }));
	}
	
	function all(arr, f) {
	  var _iteratorNormalCompletion13 = true;
	  var _didIteratorError13 = false;
	  var _iteratorError13 = undefined;
	
	  try {
	    for (var _iterator13 = (0, _getIterator3.default)(arr), _step13; !(_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done); _iteratorNormalCompletion13 = true) {
	      var _a3 = _step13.value;
	
	      if (f(_a3) === false) return false;
	    }
	  } catch (err) {
	    _didIteratorError13 = true;
	    _iteratorError13 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion13 && _iterator13.return) {
	        _iterator13.return();
	      }
	    } finally {
	      if (_didIteratorError13) {
	        throw _iteratorError13;
	      }
	    }
	  }
	
	  return true;
	}
	
	function filterInPlace(arr, f) {
	  for (var _i8 = 0; _i8 < arr.length; _i8++) {
	    if (f(arr[_i8]) === false) {
	      arr.splice(_i8, 1);
	      _i8--;
	    }
	  }
	}
	
	function pop(arr, f) {
	  for (var _i9 = 0; _i9 < arr.length; _i9++) {
	    if (f(arr[_i9])) {
	      var _t8 = arr[_i9];
	      arr.splice(_i9, 1);
	      return _t8;
	    }
	  }
	  return undefined;
	}
	
	function contains(arr, t) {
	  for (var _i10 = 0; _i10 < arr.length; _i10++) {
	    if (t === arr[_i10]) {
	      return true;
	    }
	  }
	  return false;
	}
	
	var Notify = exports.Notify = function () {
	  function Notify() {
	    (0, _classCallCheck3.default)(this, Notify);
	
	    this._unlock = function () {};
	    this.setup();
	  }
	
	  (0, _createClass3.default)(Notify, [{
	    key: 'setup',
	    value: function setup() {
	      var _this2 = this;
	
	      this._lock = new _promise2.default(function (resolve) {
	        _this2._unlock = resolve;
	      });
	    }
	  }, {
	    key: 'wait',
	    value: function () {
	      var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee9() {
	        return _regenerator2.default.wrap(function _callee9$(_context11) {
	          while (1) {
	            switch (_context11.prev = _context11.next) {
	              case 0:
	                _context11.next = 2;
	                return this._lock;
	
	              case 2:
	              case 'end':
	                return _context11.stop();
	            }
	          }
	        }, _callee9, this);
	      }));
	
	      function wait() {
	        return _ref2.apply(this, arguments);
	      }
	
	      return wait;
	    }()
	  }, {
	    key: 'notify',
	    value: function () {
	      var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee10() {
	        return _regenerator2.default.wrap(function _callee10$(_context12) {
	          while (1) {
	            switch (_context12.prev = _context12.next) {
	              case 0:
	                this._unlock();
	                this.setup();
	
	              case 2:
	              case 'end':
	                return _context12.stop();
	            }
	          }
	        }, _callee10, this);
	      }));
	
	      function notify() {
	        return _ref3.apply(this, arguments);
	      }
	
	      return notify;
	    }()
	  }]);
	  return Notify;
	}();
	
	var NotifyAfter = exports.NotifyAfter = function () {
	  function NotifyAfter(num) {
	    var _this3 = this;
	
	    (0, _classCallCheck3.default)(this, NotifyAfter);
	
	    this._num = num;
	    this._unlock = function () {};
	    this._lock = new _promise2.default(function (resolve) {
	      _this3._unlock = resolve;
	    });
	  }
	
	  (0, _createClass3.default)(NotifyAfter, [{
	    key: 'wait',
	    value: function () {
	      var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee11() {
	        return _regenerator2.default.wrap(function _callee11$(_context13) {
	          while (1) {
	            switch (_context13.prev = _context13.next) {
	              case 0:
	                if (!(this._num === 0)) {
	                  _context13.next = 4;
	                  break;
	                }
	
	                return _context13.abrupt('return');
	
	              case 4:
	                _context13.next = 6;
	                return this._lock;
	
	              case 6:
	              case 'end':
	                return _context13.stop();
	            }
	          }
	        }, _callee11, this);
	      }));
	
	      function wait() {
	        return _ref4.apply(this, arguments);
	      }
	
	      return wait;
	    }()
	  }, {
	    key: 'notify',
	    value: function () {
	      var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee12() {
	        return _regenerator2.default.wrap(function _callee12$(_context14) {
	          while (1) {
	            switch (_context14.prev = _context14.next) {
	              case 0:
	                this._num -= 1;
	
	                if (!(this._num < 0)) {
	                  _context14.next = 3;
	                  break;
	                }
	
	                throw new Error('received too many notifies');
	
	              case 3:
	                if (this._num === 0) {
	                  this._unlock();
	                }
	
	              case 4:
	              case 'end':
	                return _context14.stop();
	            }
	          }
	        }, _callee12, this);
	      }));
	
	      function notify() {
	        return _ref5.apply(this, arguments);
	      }
	
	      return notify;
	    }()
	  }]);
	  return NotifyAfter;
	}();
	
	var NotifyOnce = exports.NotifyOnce = function (_NotifyAfter) {
	  (0, _inherits3.default)(NotifyOnce, _NotifyAfter);
	
	  function NotifyOnce() {
	    (0, _classCallCheck3.default)(this, NotifyOnce);
	    return (0, _possibleConstructorReturn3.default)(this, (NotifyOnce.__proto__ || (0, _getPrototypeOf2.default)(NotifyOnce)).call(this, 1));
	  }
	
	  return NotifyOnce;
	}(NotifyAfter);
	
	function asyncSleep(time) {
	  return new _promise2.default(function (resolve, reject) {
	    return setTimeout(resolve, time);
	  });
	}

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(80), __esModule: true };

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(81);
	module.exports = __webpack_require__(17).Object.keys;

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(52)
	  , $keys    = __webpack_require__(36);
	
	__webpack_require__(82)('keys', function(){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	// most Object methods by ES6 should accept primitives
	var $export = __webpack_require__(15)
	  , core    = __webpack_require__(17)
	  , fails   = __webpack_require__(26);
	module.exports = function(KEY, exec){
	  var fn  = (core.Object || {})[KEY] || Object[KEY]
	    , exp = {};
	  exp[KEY] = exec(fn);
	  $export($export.S + $export.F * fails(function(){ fn(1); }), 'Object', exp);
	};

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(84), __esModule: true };

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(9);
	__webpack_require__(85);
	module.exports = __webpack_require__(17).Array.from;

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx            = __webpack_require__(18)
	  , $export        = __webpack_require__(15)
	  , toObject       = __webpack_require__(52)
	  , call           = __webpack_require__(61)
	  , isArrayIter    = __webpack_require__(62)
	  , toLength       = __webpack_require__(42)
	  , createProperty = __webpack_require__(86)
	  , getIterFn      = __webpack_require__(63);
	
	$export($export.S + $export.F * !__webpack_require__(70)(function(iter){ Array.from(iter); }), 'Array', {
	  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
	  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
	    var O       = toObject(arrayLike)
	      , C       = typeof this == 'function' ? this : Array
	      , aLen    = arguments.length
	      , mapfn   = aLen > 1 ? arguments[1] : undefined
	      , mapping = mapfn !== undefined
	      , index   = 0
	      , iterFn  = getIterFn(O)
	      , length, result, step, iterator;
	    if(mapping)mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
	    // if object isn't iterable or it's array with default iterator - use simple case
	    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
	      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
	        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
	      }
	    } else {
	      length = toLength(O.length);
	      for(result = new C(length); length > index; index++){
	        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
	      }
	    }
	    result.length = index;
	    return result;
	  }
	});


/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $defineProperty = __webpack_require__(21)
	  , createDesc      = __webpack_require__(29);
	
	module.exports = function(object, index, value){
	  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
	  else object[index] = value;
	};

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(88), __esModule: true };

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(89);
	module.exports = __webpack_require__(17).Object.assign;

/***/ },
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(15);
	
	$export($export.S + $export.F, 'Object', {assign: __webpack_require__(90)});

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	var getKeys  = __webpack_require__(36)
	  , gOPS     = __webpack_require__(91)
	  , pIE      = __webpack_require__(92)
	  , toObject = __webpack_require__(52)
	  , IObject  = __webpack_require__(39)
	  , $assign  = Object.assign;
	
	// should work with symbols and should have deterministic property order (V8 bug)
	module.exports = !$assign || __webpack_require__(26)(function(){
	  var A = {}
	    , B = {}
	    , S = Symbol()
	    , K = 'abcdefghijklmnopqrst';
	  A[S] = 7;
	  K.split('').forEach(function(k){ B[k] = k; });
	  return $assign({}, A)[S] != 7 || Object.keys($assign({}, B)).join('') != K;
	}) ? function assign(target, source){ // eslint-disable-line no-unused-vars
	  var T     = toObject(target)
	    , aLen  = arguments.length
	    , index = 1
	    , getSymbols = gOPS.f
	    , isEnum     = pIE.f;
	  while(aLen > index){
	    var S      = IObject(arguments[index++])
	      , keys   = getSymbols ? getKeys(S).concat(getSymbols(S)) : getKeys(S)
	      , length = keys.length
	      , j      = 0
	      , key;
	    while(length > j)if(isEnum.call(S, key = keys[j++]))T[key] = S[key];
	  } return T;
	} : $assign;

/***/ },
/* 91 */
/***/ function(module, exports) {

	exports.f = Object.getOwnPropertySymbols;

/***/ },
/* 92 */
/***/ function(module, exports) {

	exports.f = {}.propertyIsEnumerable;

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(94), __esModule: true };

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(95);
	module.exports = __webpack_require__(17).Object.getPrototypeOf;

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.9 Object.getPrototypeOf(O)
	var toObject        = __webpack_require__(52)
	  , $getPrototypeOf = __webpack_require__(51);
	
	__webpack_require__(82)('getPrototypeOf', function(){
	  return function getPrototypeOf(it){
	    return $getPrototypeOf(toObject(it));
	  };
	});

/***/ },
/* 96 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	
	exports.default = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _defineProperty = __webpack_require__(98);
	
	var _defineProperty2 = _interopRequireDefault(_defineProperty);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      (0, _defineProperty2.default)(target, descriptor.key, descriptor);
	    }
	  }
	
	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

/***/ },
/* 98 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(99), __esModule: true };

/***/ },
/* 99 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(100);
	var $Object = __webpack_require__(17).Object;
	module.exports = function defineProperty(it, key, desc){
	  return $Object.defineProperty(it, key, desc);
	};

/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

	var $export = __webpack_require__(15);
	// 19.1.2.4 / 15.2.3.6 Object.defineProperty(O, P, Attributes)
	$export($export.S + $export.F * !__webpack_require__(25), 'Object', {defineProperty: __webpack_require__(21).f});

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _typeof2 = __webpack_require__(102);
	
	var _typeof3 = _interopRequireDefault(_typeof2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (self, call) {
	  if (!self) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }
	
	  return call && ((typeof call === "undefined" ? "undefined" : (0, _typeof3.default)(call)) === "object" || typeof call === "function") ? call : self;
	};

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _iterator = __webpack_require__(103);
	
	var _iterator2 = _interopRequireDefault(_iterator);
	
	var _symbol = __webpack_require__(106);
	
	var _symbol2 = _interopRequireDefault(_symbol);
	
	var _typeof = typeof _symbol2.default === "function" && typeof _iterator2.default === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj; };
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
	  return typeof obj === "undefined" ? "undefined" : _typeof(obj);
	} : function (obj) {
	  return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default && obj !== _symbol2.default.prototype ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
	};

/***/ },
/* 103 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(104), __esModule: true };

/***/ },
/* 104 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(9);
	__webpack_require__(53);
	module.exports = __webpack_require__(105).f('iterator');

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

	exports.f = __webpack_require__(50);

/***/ },
/* 106 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(107), __esModule: true };

/***/ },
/* 107 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(108);
	__webpack_require__(8);
	__webpack_require__(117);
	__webpack_require__(118);
	module.exports = __webpack_require__(17).Symbol;

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// ECMAScript 6 symbols shim
	var global         = __webpack_require__(16)
	  , has            = __webpack_require__(31)
	  , DESCRIPTORS    = __webpack_require__(25)
	  , $export        = __webpack_require__(15)
	  , redefine       = __webpack_require__(30)
	  , META           = __webpack_require__(109).KEY
	  , $fails         = __webpack_require__(26)
	  , shared         = __webpack_require__(45)
	  , setToStringTag = __webpack_require__(49)
	  , uid            = __webpack_require__(46)
	  , wks            = __webpack_require__(50)
	  , wksExt         = __webpack_require__(105)
	  , wksDefine      = __webpack_require__(110)
	  , keyOf          = __webpack_require__(111)
	  , enumKeys       = __webpack_require__(112)
	  , isArray        = __webpack_require__(113)
	  , anObject       = __webpack_require__(22)
	  , toIObject      = __webpack_require__(38)
	  , toPrimitive    = __webpack_require__(28)
	  , createDesc     = __webpack_require__(29)
	  , _create        = __webpack_require__(34)
	  , gOPNExt        = __webpack_require__(114)
	  , $GOPD          = __webpack_require__(116)
	  , $DP            = __webpack_require__(21)
	  , $keys          = __webpack_require__(36)
	  , gOPD           = $GOPD.f
	  , dP             = $DP.f
	  , gOPN           = gOPNExt.f
	  , $Symbol        = global.Symbol
	  , $JSON          = global.JSON
	  , _stringify     = $JSON && $JSON.stringify
	  , PROTOTYPE      = 'prototype'
	  , HIDDEN         = wks('_hidden')
	  , TO_PRIMITIVE   = wks('toPrimitive')
	  , isEnum         = {}.propertyIsEnumerable
	  , SymbolRegistry = shared('symbol-registry')
	  , AllSymbols     = shared('symbols')
	  , OPSymbols      = shared('op-symbols')
	  , ObjectProto    = Object[PROTOTYPE]
	  , USE_NATIVE     = typeof $Symbol == 'function'
	  , QObject        = global.QObject;
	// Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
	var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;
	
	// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
	var setSymbolDesc = DESCRIPTORS && $fails(function(){
	  return _create(dP({}, 'a', {
	    get: function(){ return dP(this, 'a', {value: 7}).a; }
	  })).a != 7;
	}) ? function(it, key, D){
	  var protoDesc = gOPD(ObjectProto, key);
	  if(protoDesc)delete ObjectProto[key];
	  dP(it, key, D);
	  if(protoDesc && it !== ObjectProto)dP(ObjectProto, key, protoDesc);
	} : dP;
	
	var wrap = function(tag){
	  var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
	  sym._k = tag;
	  return sym;
	};
	
	var isSymbol = USE_NATIVE && typeof $Symbol.iterator == 'symbol' ? function(it){
	  return typeof it == 'symbol';
	} : function(it){
	  return it instanceof $Symbol;
	};
	
	var $defineProperty = function defineProperty(it, key, D){
	  if(it === ObjectProto)$defineProperty(OPSymbols, key, D);
	  anObject(it);
	  key = toPrimitive(key, true);
	  anObject(D);
	  if(has(AllSymbols, key)){
	    if(!D.enumerable){
	      if(!has(it, HIDDEN))dP(it, HIDDEN, createDesc(1, {}));
	      it[HIDDEN][key] = true;
	    } else {
	      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
	      D = _create(D, {enumerable: createDesc(0, false)});
	    } return setSymbolDesc(it, key, D);
	  } return dP(it, key, D);
	};
	var $defineProperties = function defineProperties(it, P){
	  anObject(it);
	  var keys = enumKeys(P = toIObject(P))
	    , i    = 0
	    , l = keys.length
	    , key;
	  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
	  return it;
	};
	var $create = function create(it, P){
	  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
	};
	var $propertyIsEnumerable = function propertyIsEnumerable(key){
	  var E = isEnum.call(this, key = toPrimitive(key, true));
	  if(this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return false;
	  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
	};
	var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
	  it  = toIObject(it);
	  key = toPrimitive(key, true);
	  if(it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key))return;
	  var D = gOPD(it, key);
	  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
	  return D;
	};
	var $getOwnPropertyNames = function getOwnPropertyNames(it){
	  var names  = gOPN(toIObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i){
	    if(!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META)result.push(key);
	  } return result;
	};
	var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
	  var IS_OP  = it === ObjectProto
	    , names  = gOPN(IS_OP ? OPSymbols : toIObject(it))
	    , result = []
	    , i      = 0
	    , key;
	  while(names.length > i){
	    if(has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true))result.push(AllSymbols[key]);
	  } return result;
	};
	
	// 19.4.1.1 Symbol([description])
	if(!USE_NATIVE){
	  $Symbol = function Symbol(){
	    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor!');
	    var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
	    var $set = function(value){
	      if(this === ObjectProto)$set.call(OPSymbols, value);
	      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
	      setSymbolDesc(this, tag, createDesc(1, value));
	    };
	    if(DESCRIPTORS && setter)setSymbolDesc(ObjectProto, tag, {configurable: true, set: $set});
	    return wrap(tag);
	  };
	  redefine($Symbol[PROTOTYPE], 'toString', function toString(){
	    return this._k;
	  });
	
	  $GOPD.f = $getOwnPropertyDescriptor;
	  $DP.f   = $defineProperty;
	  __webpack_require__(115).f = gOPNExt.f = $getOwnPropertyNames;
	  __webpack_require__(92).f  = $propertyIsEnumerable;
	  __webpack_require__(91).f = $getOwnPropertySymbols;
	
	  if(DESCRIPTORS && !__webpack_require__(14)){
	    redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
	  }
	
	  wksExt.f = function(name){
	    return wrap(wks(name));
	  }
	}
	
	$export($export.G + $export.W + $export.F * !USE_NATIVE, {Symbol: $Symbol});
	
	for(var symbols = (
	  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
	  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'
	).split(','), i = 0; symbols.length > i; )wks(symbols[i++]);
	
	for(var symbols = $keys(wks.store), i = 0; symbols.length > i; )wksDefine(symbols[i++]);
	
	$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
	  // 19.4.2.1 Symbol.for(key)
	  'for': function(key){
	    return has(SymbolRegistry, key += '')
	      ? SymbolRegistry[key]
	      : SymbolRegistry[key] = $Symbol(key);
	  },
	  // 19.4.2.5 Symbol.keyFor(sym)
	  keyFor: function keyFor(key){
	    if(isSymbol(key))return keyOf(SymbolRegistry, key);
	    throw TypeError(key + ' is not a symbol!');
	  },
	  useSetter: function(){ setter = true; },
	  useSimple: function(){ setter = false; }
	});
	
	$export($export.S + $export.F * !USE_NATIVE, 'Object', {
	  // 19.1.2.2 Object.create(O [, Properties])
	  create: $create,
	  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
	  defineProperty: $defineProperty,
	  // 19.1.2.3 Object.defineProperties(O, Properties)
	  defineProperties: $defineProperties,
	  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
	  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
	  // 19.1.2.7 Object.getOwnPropertyNames(O)
	  getOwnPropertyNames: $getOwnPropertyNames,
	  // 19.1.2.8 Object.getOwnPropertySymbols(O)
	  getOwnPropertySymbols: $getOwnPropertySymbols
	});
	
	// 24.3.2 JSON.stringify(value [, replacer [, space]])
	$JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function(){
	  var S = $Symbol();
	  // MS Edge converts symbol values to JSON as {}
	  // WebKit converts symbol values to JSON as null
	  // V8 throws on boxed symbols
	  return _stringify([S]) != '[null]' || _stringify({a: S}) != '{}' || _stringify(Object(S)) != '{}';
	})), 'JSON', {
	  stringify: function stringify(it){
	    if(it === undefined || isSymbol(it))return; // IE8 returns string on undefined
	    var args = [it]
	      , i    = 1
	      , replacer, $replacer;
	    while(arguments.length > i)args.push(arguments[i++]);
	    replacer = args[1];
	    if(typeof replacer == 'function')$replacer = replacer;
	    if($replacer || !isArray(replacer))replacer = function(key, value){
	      if($replacer)value = $replacer.call(this, key, value);
	      if(!isSymbol(value))return value;
	    };
	    args[1] = replacer;
	    return _stringify.apply($JSON, args);
	  }
	});
	
	// 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
	$Symbol[PROTOTYPE][TO_PRIMITIVE] || __webpack_require__(20)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
	// 19.4.3.5 Symbol.prototype[@@toStringTag]
	setToStringTag($Symbol, 'Symbol');
	// 20.2.1.9 Math[@@toStringTag]
	setToStringTag(Math, 'Math', true);
	// 24.3.3 JSON[@@toStringTag]
	setToStringTag(global.JSON, 'JSON', true);

/***/ },
/* 109 */
/***/ function(module, exports, __webpack_require__) {

	var META     = __webpack_require__(46)('meta')
	  , isObject = __webpack_require__(23)
	  , has      = __webpack_require__(31)
	  , setDesc  = __webpack_require__(21).f
	  , id       = 0;
	var isExtensible = Object.isExtensible || function(){
	  return true;
	};
	var FREEZE = !__webpack_require__(26)(function(){
	  return isExtensible(Object.preventExtensions({}));
	});
	var setMeta = function(it){
	  setDesc(it, META, {value: {
	    i: 'O' + ++id, // object ID
	    w: {}          // weak collections IDs
	  }});
	};
	var fastKey = function(it, create){
	  // return primitive with prefix
	  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
	  if(!has(it, META)){
	    // can't set metadata to uncaught frozen object
	    if(!isExtensible(it))return 'F';
	    // not necessary to add metadata
	    if(!create)return 'E';
	    // add missing metadata
	    setMeta(it);
	  // return object ID
	  } return it[META].i;
	};
	var getWeak = function(it, create){
	  if(!has(it, META)){
	    // can't set metadata to uncaught frozen object
	    if(!isExtensible(it))return true;
	    // not necessary to add metadata
	    if(!create)return false;
	    // add missing metadata
	    setMeta(it);
	  // return hash weak collections IDs
	  } return it[META].w;
	};
	// add metadata on freeze-family methods calling
	var onFreeze = function(it){
	  if(FREEZE && meta.NEED && isExtensible(it) && !has(it, META))setMeta(it);
	  return it;
	};
	var meta = module.exports = {
	  KEY:      META,
	  NEED:     false,
	  fastKey:  fastKey,
	  getWeak:  getWeak,
	  onFreeze: onFreeze
	};

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

	var global         = __webpack_require__(16)
	  , core           = __webpack_require__(17)
	  , LIBRARY        = __webpack_require__(14)
	  , wksExt         = __webpack_require__(105)
	  , defineProperty = __webpack_require__(21).f;
	module.exports = function(name){
	  var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
	  if(name.charAt(0) != '_' && !(name in $Symbol))defineProperty($Symbol, name, {value: wksExt.f(name)});
	};

/***/ },
/* 111 */
/***/ function(module, exports, __webpack_require__) {

	var getKeys   = __webpack_require__(36)
	  , toIObject = __webpack_require__(38);
	module.exports = function(object, el){
	  var O      = toIObject(object)
	    , keys   = getKeys(O)
	    , length = keys.length
	    , index  = 0
	    , key;
	  while(length > index)if(O[key = keys[index++]] === el)return key;
	};

/***/ },
/* 112 */
/***/ function(module, exports, __webpack_require__) {

	// all enumerable object keys, includes symbols
	var getKeys = __webpack_require__(36)
	  , gOPS    = __webpack_require__(91)
	  , pIE     = __webpack_require__(92);
	module.exports = function(it){
	  var result     = getKeys(it)
	    , getSymbols = gOPS.f;
	  if(getSymbols){
	    var symbols = getSymbols(it)
	      , isEnum  = pIE.f
	      , i       = 0
	      , key;
	    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))result.push(key);
	  } return result;
	};

/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

	// 7.2.2 IsArray(argument)
	var cof = __webpack_require__(40);
	module.exports = Array.isArray || function isArray(arg){
	  return cof(arg) == 'Array';
	};

/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

	// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
	var toIObject = __webpack_require__(38)
	  , gOPN      = __webpack_require__(115).f
	  , toString  = {}.toString;
	
	var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
	  ? Object.getOwnPropertyNames(window) : [];
	
	var getWindowNames = function(it){
	  try {
	    return gOPN(it);
	  } catch(e){
	    return windowNames.slice();
	  }
	};
	
	module.exports.f = function getOwnPropertyNames(it){
	  return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
	};


/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
	var $keys      = __webpack_require__(37)
	  , hiddenKeys = __webpack_require__(47).concat('length', 'prototype');
	
	exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O){
	  return $keys(O, hiddenKeys);
	};

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

	var pIE            = __webpack_require__(92)
	  , createDesc     = __webpack_require__(29)
	  , toIObject      = __webpack_require__(38)
	  , toPrimitive    = __webpack_require__(28)
	  , has            = __webpack_require__(31)
	  , IE8_DOM_DEFINE = __webpack_require__(24)
	  , gOPD           = Object.getOwnPropertyDescriptor;
	
	exports.f = __webpack_require__(25) ? gOPD : function getOwnPropertyDescriptor(O, P){
	  O = toIObject(O);
	  P = toPrimitive(P, true);
	  if(IE8_DOM_DEFINE)try {
	    return gOPD(O, P);
	  } catch(e){ /* empty */ }
	  if(has(O, P))return createDesc(!pIE.f.call(O, P), O[P]);
	};

/***/ },
/* 117 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(110)('asyncIterator');

/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(110)('observable');

/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _setPrototypeOf = __webpack_require__(120);
	
	var _setPrototypeOf2 = _interopRequireDefault(_setPrototypeOf);
	
	var _create = __webpack_require__(124);
	
	var _create2 = _interopRequireDefault(_create);
	
	var _typeof2 = __webpack_require__(102);
	
	var _typeof3 = _interopRequireDefault(_typeof2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	exports.default = function (subClass, superClass) {
	  if (typeof superClass !== "function" && superClass !== null) {
	    throw new TypeError("Super expression must either be null or a function, not " + (typeof superClass === "undefined" ? "undefined" : (0, _typeof3.default)(superClass)));
	  }
	
	  subClass.prototype = (0, _create2.default)(superClass && superClass.prototype, {
	    constructor: {
	      value: subClass,
	      enumerable: false,
	      writable: true,
	      configurable: true
	    }
	  });
	  if (superClass) _setPrototypeOf2.default ? (0, _setPrototypeOf2.default)(subClass, superClass) : subClass.__proto__ = superClass;
	};

/***/ },
/* 120 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(121), __esModule: true };

/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(122);
	module.exports = __webpack_require__(17).Object.setPrototypeOf;

/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.19 Object.setPrototypeOf(O, proto)
	var $export = __webpack_require__(15);
	$export($export.S, 'Object', {setPrototypeOf: __webpack_require__(123).set});

/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

	// Works with __proto__ only. Old v8 can't work with null proto objects.
	/* eslint-disable no-proto */
	var isObject = __webpack_require__(23)
	  , anObject = __webpack_require__(22);
	var check = function(O, proto){
	  anObject(O);
	  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
	};
	module.exports = {
	  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line
	    function(test, buggy, set){
	      try {
	        set = __webpack_require__(18)(Function.call, __webpack_require__(116).f(Object.prototype, '__proto__').set, 2);
	        set(test, []);
	        buggy = !(test instanceof Array);
	      } catch(e){ buggy = true; }
	      return function setPrototypeOf(O, proto){
	        check(O, proto);
	        if(buggy)O.__proto__ = proto;
	        else set(O, proto);
	        return O;
	      };
	    }({}, false) : undefined),
	  check: check
	};

/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(125), __esModule: true };

/***/ },
/* 125 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(126);
	var $Object = __webpack_require__(17).Object;
	module.exports = function create(P, D){
	  return $Object.create(P, D);
	};

/***/ },
/* 126 */
/***/ function(module, exports, __webpack_require__) {

	var $export = __webpack_require__(15)
	// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
	$export($export.S, 'Object', {create: __webpack_require__(34)});

/***/ },
/* 127 */
/***/ function(module, exports, __webpack_require__) {

	(function webpackUniversalModuleDefinition(root, factory) {
		if(true)
			module.exports = factory();
		else if(typeof define === 'function' && define.amd)
			define([], factory);
		else if(typeof exports === 'object')
			exports["wu"] = factory();
		else
			root["wu"] = factory();
	})(this, function() {
	return /******/ (function(modules) { // webpackBootstrap
	/******/ 	// The module cache
	/******/ 	var installedModules = {};
	
	/******/ 	// The require function
	/******/ 	function __webpack_require__(moduleId) {
	
	/******/ 		// Check if module is in cache
	/******/ 		if(installedModules[moduleId])
	/******/ 			return installedModules[moduleId].exports;
	
	/******/ 		// Create a new module (and put it into the cache)
	/******/ 		var module = installedModules[moduleId] = {
	/******/ 			exports: {},
	/******/ 			id: moduleId,
	/******/ 			loaded: false
	/******/ 		};
	
	/******/ 		// Execute the module function
	/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
	
	/******/ 		// Flag the module as loaded
	/******/ 		module.loaded = true;
	
	/******/ 		// Return the exports of the module
	/******/ 		return module.exports;
	/******/ 	}
	
	
	/******/ 	// expose the modules object (__webpack_modules__)
	/******/ 	__webpack_require__.m = modules;
	
	/******/ 	// expose the module cache
	/******/ 	__webpack_require__.c = installedModules;
	
	/******/ 	// __webpack_public_path__
	/******/ 	__webpack_require__.p = "";
	
	/******/ 	// Load entry module and return exports
	/******/ 	return __webpack_require__(0);
	/******/ })
	/************************************************************************/
	/******/ ([
	/* 0 */
	/***/ function(module, exports, __webpack_require__) {
	
		"use strict";
	
		var _toConsumableArray = __webpack_require__(1)["default"];
	
		var _slicedToArray = __webpack_require__(39)["default"];
	
		var _Symbol$iterator = __webpack_require__(52)["default"];
	
		var _getIterator = __webpack_require__(40)["default"];
	
		var _regeneratorRuntime = __webpack_require__(54)["default"];
	
		var _Object$keys = __webpack_require__(80)["default"];
	
		var _Set = __webpack_require__(84)["default"];
	
		var _Promise = __webpack_require__(65)["default"];
	
		var wu = module.exports = function wu(iterable) {
		  if (!isIterable(iterable)) {
		    throw new Error("wu: `" + iterable + "` is not iterable!");
		  }
		  return new Wu(iterable);
		};
	
		function Wu(iterable) {
		  var iterator = getIterator(iterable);
		  this.next = iterator.next.bind(iterator);
		}
		wu.prototype = Wu.prototype;
	
		wu.prototype[_Symbol$iterator] = function () {
		  return this;
		};
	
		/*
		 * Internal utilities
		 */
	
		// An internal placeholder value.
		var MISSING = {};
	
		// Return whether a thing is iterable.
		var isIterable = function isIterable(thing) {
		  return thing && typeof thing[_Symbol$iterator] === "function";
		};
	
		// Get the iterator for the thing or throw an error.
		var getIterator = function getIterator(thing) {
		  if (isIterable(thing)) {
		    return _getIterator(thing);
		  }
		  throw new TypeError("Not iterable: " + thing);
		};
	
		// Define a static method on `wu` and set its prototype to the shared
		// `Wu.prototype`.
		var staticMethod = function staticMethod(name, fn) {
		  fn.prototype = Wu.prototype;
		  wu[name] = fn;
		};
	
		// Define a function that is attached as both a `Wu.prototype` method and a
		// curryable static method on `wu` directly that takes an iterable as its last
		// parameter.
		var prototypeAndStatic = function prototypeAndStatic(name, fn) {
		  var expectedArgs = arguments.length <= 2 || arguments[2] === undefined ? fn.length : arguments[2];
		  return (function () {
		    fn.prototype = Wu.prototype;
		    Wu.prototype[name] = fn;
	
		    // +1 for the iterable, which is the `this` value of the function so it
		    // isn't reflected by the length property.
		    expectedArgs += 1;
	
		    wu[name] = wu.curryable(function () {
		      var _wu;
	
		      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
		        args[_key] = arguments[_key];
		      }
	
		      var iterable = args.pop();
		      return (_wu = wu(iterable))[name].apply(_wu, args);
		    }, expectedArgs);
		  })();
		};
	
		// A decorator for rewrapping a method's returned iterable in wu to maintain
		// chainability.
		var rewrap = function rewrap(fn) {
		  return function () {
		    for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
		      args[_key2] = arguments[_key2];
		    }
	
		    return wu(fn.call.apply(fn, [this].concat(args)));
		  };
		};
	
		var rewrapStaticMethod = function rewrapStaticMethod(name, fn) {
		  return staticMethod(name, rewrap(fn));
		};
		var rewrapPrototypeAndStatic = function rewrapPrototypeAndStatic(name, fn, expectedArgs) {
		  return prototypeAndStatic(name, rewrap(fn), expectedArgs);
		};
	
		// Return a wrapped version of `fn` bound with the initial arguments
		// `...args`.
		function curry(fn, args) {
		  return function () {
		    for (var _len3 = arguments.length, moreArgs = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
		      moreArgs[_key3] = arguments[_key3];
		    }
	
		    return fn.call.apply(fn, [this].concat(_toConsumableArray(args), moreArgs));
		  };
		}
	
		/*
		 * Public utilities
		 */
	
		staticMethod("curryable", function (fn) {
		  var expected = arguments.length <= 1 || arguments[1] === undefined ? fn.length : arguments[1];
		  return (function () {
		    return function f() {
		      for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
		        args[_key4] = arguments[_key4];
		      }
	
		      return args.length >= expected ? fn.apply(this, args) : curry(f, args);
		    };
		  })();
		});
	
		rewrapStaticMethod("entries", _regeneratorRuntime.mark(function callee$0$0(obj) {
		  var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, k;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion = true;
		        _didIteratorError = false;
		        _iteratorError = undefined;
		        context$1$0.prev = 3;
		        _iterator = _getIterator(_Object$keys(obj));
	
		      case 5:
		        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        k = _step.value;
		        context$1$0.next = 9;
		        return [k, obj[k]];
	
		      case 9:
		        _iteratorNormalCompletion = true;
		        context$1$0.next = 5;
		        break;
	
		      case 12:
		        context$1$0.next = 18;
		        break;
	
		      case 14:
		        context$1$0.prev = 14;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError = true;
		        _iteratorError = context$1$0.t0;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.prev = 19;
	
		        if (!_iteratorNormalCompletion && _iterator["return"]) {
		          _iterator["return"]();
		        }
	
		      case 21:
		        context$1$0.prev = 21;
	
		        if (!_didIteratorError) {
		          context$1$0.next = 24;
		          break;
		        }
	
		        throw _iteratorError;
	
		      case 24:
		        return context$1$0.finish(21);
	
		      case 25:
		        return context$1$0.finish(18);
	
		      case 26:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
		}));
	
		rewrapStaticMethod("keys", _regeneratorRuntime.mark(function callee$0$0(obj) {
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        return context$1$0.delegateYield(_Object$keys(obj), "t0", 1);
	
		      case 1:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		rewrapStaticMethod("values", _regeneratorRuntime.mark(function callee$0$0(obj) {
		  var _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, k;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion2 = true;
		        _didIteratorError2 = false;
		        _iteratorError2 = undefined;
		        context$1$0.prev = 3;
		        _iterator2 = _getIterator(_Object$keys(obj));
	
		      case 5:
		        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        k = _step2.value;
		        context$1$0.next = 9;
		        return obj[k];
	
		      case 9:
		        _iteratorNormalCompletion2 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 12:
		        context$1$0.next = 18;
		        break;
	
		      case 14:
		        context$1$0.prev = 14;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError2 = true;
		        _iteratorError2 = context$1$0.t0;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.prev = 19;
	
		        if (!_iteratorNormalCompletion2 && _iterator2["return"]) {
		          _iterator2["return"]();
		        }
	
		      case 21:
		        context$1$0.prev = 21;
	
		        if (!_didIteratorError2) {
		          context$1$0.next = 24;
		          break;
		        }
	
		        throw _iteratorError2;
	
		      case 24:
		        return context$1$0.finish(21);
	
		      case 25:
		        return context$1$0.finish(18);
	
		      case 26:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
		}));
	
		/*
		 * Infinite iterators
		 */
	
		rewrapPrototypeAndStatic("cycle", _regeneratorRuntime.mark(function callee$0$0() {
		  var saved, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        saved = [];
		        _iteratorNormalCompletion3 = true;
		        _didIteratorError3 = false;
		        _iteratorError3 = undefined;
		        context$1$0.prev = 4;
		        _iterator3 = _getIterator(this);
	
		      case 6:
		        if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
		          context$1$0.next = 14;
		          break;
		        }
	
		        x = _step3.value;
		        context$1$0.next = 10;
		        return x;
	
		      case 10:
		        saved.push(x);
	
		      case 11:
		        _iteratorNormalCompletion3 = true;
		        context$1$0.next = 6;
		        break;
	
		      case 14:
		        context$1$0.next = 20;
		        break;
	
		      case 16:
		        context$1$0.prev = 16;
		        context$1$0.t0 = context$1$0["catch"](4);
		        _didIteratorError3 = true;
		        _iteratorError3 = context$1$0.t0;
	
		      case 20:
		        context$1$0.prev = 20;
		        context$1$0.prev = 21;
	
		        if (!_iteratorNormalCompletion3 && _iterator3["return"]) {
		          _iterator3["return"]();
		        }
	
		      case 23:
		        context$1$0.prev = 23;
	
		        if (!_didIteratorError3) {
		          context$1$0.next = 26;
		          break;
		        }
	
		        throw _iteratorError3;
	
		      case 26:
		        return context$1$0.finish(23);
	
		      case 27:
		        return context$1$0.finish(20);
	
		      case 28:
		        if (!saved) {
		          context$1$0.next = 32;
		          break;
		        }
	
		        return context$1$0.delegateYield(saved, "t1", 30);
	
		      case 30:
		        context$1$0.next = 28;
		        break;
	
		      case 32:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[4, 16, 20, 28], [21,, 23, 27]]);
		}));
	
		rewrapStaticMethod("count", _regeneratorRuntime.mark(function callee$0$0() {
		  var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		  var step = arguments.length <= 1 || arguments[1] === undefined ? 1 : arguments[1];
		  var n;
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        n = start;
	
		      case 1:
		        if (false) {
		          context$1$0.next = 7;
		          break;
		        }
	
		        context$1$0.next = 4;
		        return n;
	
		      case 4:
		        n += step;
		        context$1$0.next = 1;
		        break;
	
		      case 7:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		rewrapStaticMethod("repeat", _regeneratorRuntime.mark(function callee$0$0(thing) {
		  var times = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];
		  var i;
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        if (!(times === Infinity)) {
		          context$1$0.next = 8;
		          break;
		        }
	
		      case 1:
		        if (false) {
		          context$1$0.next = 6;
		          break;
		        }
	
		        context$1$0.next = 4;
		        return thing;
	
		      case 4:
		        context$1$0.next = 1;
		        break;
	
		      case 6:
		        context$1$0.next = 15;
		        break;
	
		      case 8:
		        i = 0;
	
		      case 9:
		        if (!(i < times)) {
		          context$1$0.next = 15;
		          break;
		        }
	
		        context$1$0.next = 12;
		        return thing;
	
		      case 12:
		        i++;
		        context$1$0.next = 9;
		        break;
	
		      case 15:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		/*
		 * Iterators that terminate once the input sequence has been exhausted
		 */
	
		rewrapStaticMethod("chain", _regeneratorRuntime.mark(function callee$0$0() {
		  var _iteratorNormalCompletion4,
		      _didIteratorError4,
		      _iteratorError4,
		      _len5,
		      iterables,
		      _key5,
		      _iterator4,
		      _step4,
		      it,
		      args$1$0 = arguments;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion4 = true;
		        _didIteratorError4 = false;
		        _iteratorError4 = undefined;
		        context$1$0.prev = 3;
	
		        for (_len5 = args$1$0.length, iterables = Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
		          iterables[_key5] = args$1$0[_key5];
		        }
	
		        _iterator4 = _getIterator(iterables);
	
		      case 6:
		        if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        it = _step4.value;
		        return context$1$0.delegateYield(it, "t0", 9);
	
		      case 9:
		        _iteratorNormalCompletion4 = true;
		        context$1$0.next = 6;
		        break;
	
		      case 12:
		        context$1$0.next = 18;
		        break;
	
		      case 14:
		        context$1$0.prev = 14;
		        context$1$0.t1 = context$1$0["catch"](3);
		        _didIteratorError4 = true;
		        _iteratorError4 = context$1$0.t1;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.prev = 19;
	
		        if (!_iteratorNormalCompletion4 && _iterator4["return"]) {
		          _iterator4["return"]();
		        }
	
		      case 21:
		        context$1$0.prev = 21;
	
		        if (!_didIteratorError4) {
		          context$1$0.next = 24;
		          break;
		        }
	
		        throw _iteratorError4;
	
		      case 24:
		        return context$1$0.finish(21);
	
		      case 25:
		        return context$1$0.finish(18);
	
		      case 26:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
		}));
	
		rewrapPrototypeAndStatic("chunk", _regeneratorRuntime.mark(function callee$0$0() {
		  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];
	
		  var items, index, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, item;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        items = [];
		        index = 0;
		        _iteratorNormalCompletion5 = true;
		        _didIteratorError5 = false;
		        _iteratorError5 = undefined;
		        context$1$0.prev = 5;
		        _iterator5 = _getIterator(this);
	
		      case 7:
		        if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
		          context$1$0.next = 18;
		          break;
		        }
	
		        item = _step5.value;
	
		        items[index++] = item;
	
		        if (!(index === n)) {
		          context$1$0.next = 15;
		          break;
		        }
	
		        context$1$0.next = 13;
		        return items;
	
		      case 13:
		        items = [];
		        index = 0;
	
		      case 15:
		        _iteratorNormalCompletion5 = true;
		        context$1$0.next = 7;
		        break;
	
		      case 18:
		        context$1$0.next = 24;
		        break;
	
		      case 20:
		        context$1$0.prev = 20;
		        context$1$0.t0 = context$1$0["catch"](5);
		        _didIteratorError5 = true;
		        _iteratorError5 = context$1$0.t0;
	
		      case 24:
		        context$1$0.prev = 24;
		        context$1$0.prev = 25;
	
		        if (!_iteratorNormalCompletion5 && _iterator5["return"]) {
		          _iterator5["return"]();
		        }
	
		      case 27:
		        context$1$0.prev = 27;
	
		        if (!_didIteratorError5) {
		          context$1$0.next = 30;
		          break;
		        }
	
		        throw _iteratorError5;
	
		      case 30:
		        return context$1$0.finish(27);
	
		      case 31:
		        return context$1$0.finish(24);
	
		      case 32:
		        if (!index) {
		          context$1$0.next = 35;
		          break;
		        }
	
		        context$1$0.next = 35;
		        return items;
	
		      case 35:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[5, 20, 24, 32], [25,, 27, 31]]);
		}), 1);
	
		rewrapPrototypeAndStatic("concatMap", _regeneratorRuntime.mark(function callee$0$0(fn) {
		  var _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion6 = true;
		        _didIteratorError6 = false;
		        _iteratorError6 = undefined;
		        context$1$0.prev = 3;
		        _iterator6 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
		          context$1$0.next = 11;
		          break;
		        }
	
		        x = _step6.value;
		        return context$1$0.delegateYield(fn(x), "t0", 8);
	
		      case 8:
		        _iteratorNormalCompletion6 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 11:
		        context$1$0.next = 17;
		        break;
	
		      case 13:
		        context$1$0.prev = 13;
		        context$1$0.t1 = context$1$0["catch"](3);
		        _didIteratorError6 = true;
		        _iteratorError6 = context$1$0.t1;
	
		      case 17:
		        context$1$0.prev = 17;
		        context$1$0.prev = 18;
	
		        if (!_iteratorNormalCompletion6 && _iterator6["return"]) {
		          _iterator6["return"]();
		        }
	
		      case 20:
		        context$1$0.prev = 20;
	
		        if (!_didIteratorError6) {
		          context$1$0.next = 23;
		          break;
		        }
	
		        throw _iteratorError6;
	
		      case 23:
		        return context$1$0.finish(20);
	
		      case 24:
		        return context$1$0.finish(17);
	
		      case 25:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 13, 17, 25], [18,, 20, 24]]);
		}));
	
		rewrapPrototypeAndStatic("drop", _regeneratorRuntime.mark(function callee$0$0(n) {
		  var i, _iteratorNormalCompletion7, _didIteratorError7, _iteratorError7, _iterator7, _step7, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        i = 0;
		        _iteratorNormalCompletion7 = true;
		        _didIteratorError7 = false;
		        _iteratorError7 = undefined;
		        context$1$0.prev = 4;
		        _iterator7 = _getIterator(this);
	
		      case 6:
		        if (_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done) {
		          context$1$0.next = 16;
		          break;
		        }
	
		        x = _step7.value;
	
		        if (!(i++ < n)) {
		          context$1$0.next = 10;
		          break;
		        }
	
		        return context$1$0.abrupt("continue", 13);
	
		      case 10:
		        context$1$0.next = 12;
		        return x;
	
		      case 12:
		        return context$1$0.abrupt("break", 16);
	
		      case 13:
		        _iteratorNormalCompletion7 = true;
		        context$1$0.next = 6;
		        break;
	
		      case 16:
		        context$1$0.next = 22;
		        break;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.t0 = context$1$0["catch"](4);
		        _didIteratorError7 = true;
		        _iteratorError7 = context$1$0.t0;
	
		      case 22:
		        context$1$0.prev = 22;
		        context$1$0.prev = 23;
	
		        if (!_iteratorNormalCompletion7 && _iterator7["return"]) {
		          _iterator7["return"]();
		        }
	
		      case 25:
		        context$1$0.prev = 25;
	
		        if (!_didIteratorError7) {
		          context$1$0.next = 28;
		          break;
		        }
	
		        throw _iteratorError7;
	
		      case 28:
		        return context$1$0.finish(25);
	
		      case 29:
		        return context$1$0.finish(22);
	
		      case 30:
		        return context$1$0.delegateYield(this, "t1", 31);
	
		      case 31:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[4, 18, 22, 30], [23,, 25, 29]]);
		}));
	
		rewrapPrototypeAndStatic("dropWhile", _regeneratorRuntime.mark(function callee$0$0() {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	
		  var _iteratorNormalCompletion8, _didIteratorError8, _iteratorError8, _iterator8, _step8, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion8 = true;
		        _didIteratorError8 = false;
		        _iteratorError8 = undefined;
		        context$1$0.prev = 3;
		        _iterator8 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done) {
		          context$1$0.next = 15;
		          break;
		        }
	
		        x = _step8.value;
	
		        if (!fn(x)) {
		          context$1$0.next = 9;
		          break;
		        }
	
		        return context$1$0.abrupt("continue", 12);
	
		      case 9:
		        context$1$0.next = 11;
		        return x;
	
		      case 11:
		        return context$1$0.abrupt("break", 15);
	
		      case 12:
		        _iteratorNormalCompletion8 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 15:
		        context$1$0.next = 21;
		        break;
	
		      case 17:
		        context$1$0.prev = 17;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError8 = true;
		        _iteratorError8 = context$1$0.t0;
	
		      case 21:
		        context$1$0.prev = 21;
		        context$1$0.prev = 22;
	
		        if (!_iteratorNormalCompletion8 && _iterator8["return"]) {
		          _iterator8["return"]();
		        }
	
		      case 24:
		        context$1$0.prev = 24;
	
		        if (!_didIteratorError8) {
		          context$1$0.next = 27;
		          break;
		        }
	
		        throw _iteratorError8;
	
		      case 27:
		        return context$1$0.finish(24);
	
		      case 28:
		        return context$1$0.finish(21);
	
		      case 29:
		        return context$1$0.delegateYield(this, "t1", 30);
	
		      case 30:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 17, 21, 29], [22,, 24, 28]]);
		}), 1);
	
		rewrapPrototypeAndStatic("enumerate", _regeneratorRuntime.mark(function callee$0$0() {
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        return context$1$0.delegateYield(_zip([this, wu.count()]), "t0", 1);
	
		      case 1:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		rewrapPrototypeAndStatic("filter", _regeneratorRuntime.mark(function callee$0$0() {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	
		  var _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion9 = true;
		        _didIteratorError9 = false;
		        _iteratorError9 = undefined;
		        context$1$0.prev = 3;
		        _iterator9 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
		          context$1$0.next = 13;
		          break;
		        }
	
		        x = _step9.value;
	
		        if (!fn(x)) {
		          context$1$0.next = 10;
		          break;
		        }
	
		        context$1$0.next = 10;
		        return x;
	
		      case 10:
		        _iteratorNormalCompletion9 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 13:
		        context$1$0.next = 19;
		        break;
	
		      case 15:
		        context$1$0.prev = 15;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError9 = true;
		        _iteratorError9 = context$1$0.t0;
	
		      case 19:
		        context$1$0.prev = 19;
		        context$1$0.prev = 20;
	
		        if (!_iteratorNormalCompletion9 && _iterator9["return"]) {
		          _iterator9["return"]();
		        }
	
		      case 22:
		        context$1$0.prev = 22;
	
		        if (!_didIteratorError9) {
		          context$1$0.next = 25;
		          break;
		        }
	
		        throw _iteratorError9;
	
		      case 25:
		        return context$1$0.finish(22);
	
		      case 26:
		        return context$1$0.finish(19);
	
		      case 27:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
		}), 1);
	
		rewrapPrototypeAndStatic("flatten", _regeneratorRuntime.mark(function callee$0$0() {
		  var shallow = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
	
		  var _iteratorNormalCompletion10, _didIteratorError10, _iteratorError10, _iterator10, _step10, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion10 = true;
		        _didIteratorError10 = false;
		        _iteratorError10 = undefined;
		        context$1$0.prev = 3;
		        _iterator10 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done) {
		          context$1$0.next = 16;
		          break;
		        }
	
		        x = _step10.value;
	
		        if (!(typeof x !== "string" && isIterable(x))) {
		          context$1$0.next = 11;
		          break;
		        }
	
		        return context$1$0.delegateYield(shallow ? x : wu(x).flatten(), "t0", 9);
	
		      case 9:
		        context$1$0.next = 13;
		        break;
	
		      case 11:
		        context$1$0.next = 13;
		        return x;
	
		      case 13:
		        _iteratorNormalCompletion10 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 16:
		        context$1$0.next = 22;
		        break;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.t1 = context$1$0["catch"](3);
		        _didIteratorError10 = true;
		        _iteratorError10 = context$1$0.t1;
	
		      case 22:
		        context$1$0.prev = 22;
		        context$1$0.prev = 23;
	
		        if (!_iteratorNormalCompletion10 && _iterator10["return"]) {
		          _iterator10["return"]();
		        }
	
		      case 25:
		        context$1$0.prev = 25;
	
		        if (!_didIteratorError10) {
		          context$1$0.next = 28;
		          break;
		        }
	
		        throw _iteratorError10;
	
		      case 28:
		        return context$1$0.finish(25);
	
		      case 29:
		        return context$1$0.finish(22);
	
		      case 30:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 18, 22, 30], [23,, 25, 29]]);
		}), 1);
	
		rewrapPrototypeAndStatic("invoke", _regeneratorRuntime.mark(function callee$0$0(name) {
		  var _iteratorNormalCompletion11,
		      _didIteratorError11,
		      _iteratorError11,
		      _len6,
		      args,
		      _key6,
		      _iterator11,
		      _step11,
		      x,
		      args$1$0 = arguments;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion11 = true;
		        _didIteratorError11 = false;
		        _iteratorError11 = undefined;
		        context$1$0.prev = 3;
	
		        for (_len6 = args$1$0.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
		          args[_key6 - 1] = args$1$0[_key6];
		        }
	
		        _iterator11 = _getIterator(this);
	
		      case 6:
		        if (_iteratorNormalCompletion11 = (_step11 = _iterator11.next()).done) {
		          context$1$0.next = 13;
		          break;
		        }
	
		        x = _step11.value;
		        context$1$0.next = 10;
		        return x[name].apply(x, args);
	
		      case 10:
		        _iteratorNormalCompletion11 = true;
		        context$1$0.next = 6;
		        break;
	
		      case 13:
		        context$1$0.next = 19;
		        break;
	
		      case 15:
		        context$1$0.prev = 15;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError11 = true;
		        _iteratorError11 = context$1$0.t0;
	
		      case 19:
		        context$1$0.prev = 19;
		        context$1$0.prev = 20;
	
		        if (!_iteratorNormalCompletion11 && _iterator11["return"]) {
		          _iterator11["return"]();
		        }
	
		      case 22:
		        context$1$0.prev = 22;
	
		        if (!_didIteratorError11) {
		          context$1$0.next = 25;
		          break;
		        }
	
		        throw _iteratorError11;
	
		      case 25:
		        return context$1$0.finish(22);
	
		      case 26:
		        return context$1$0.finish(19);
	
		      case 27:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
		}));
	
		rewrapPrototypeAndStatic("map", _regeneratorRuntime.mark(function callee$0$0(fn) {
		  var _iteratorNormalCompletion12, _didIteratorError12, _iteratorError12, _iterator12, _step12, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion12 = true;
		        _didIteratorError12 = false;
		        _iteratorError12 = undefined;
		        context$1$0.prev = 3;
		        _iterator12 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion12 = (_step12 = _iterator12.next()).done) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        x = _step12.value;
		        context$1$0.next = 9;
		        return fn(x);
	
		      case 9:
		        _iteratorNormalCompletion12 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 12:
		        context$1$0.next = 18;
		        break;
	
		      case 14:
		        context$1$0.prev = 14;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError12 = true;
		        _iteratorError12 = context$1$0.t0;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.prev = 19;
	
		        if (!_iteratorNormalCompletion12 && _iterator12["return"]) {
		          _iterator12["return"]();
		        }
	
		      case 21:
		        context$1$0.prev = 21;
	
		        if (!_didIteratorError12) {
		          context$1$0.next = 24;
		          break;
		        }
	
		        throw _iteratorError12;
	
		      case 24:
		        return context$1$0.finish(21);
	
		      case 25:
		        return context$1$0.finish(18);
	
		      case 26:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
		}));
	
		rewrapPrototypeAndStatic("pluck", _regeneratorRuntime.mark(function callee$0$0(name) {
		  var _iteratorNormalCompletion13, _didIteratorError13, _iteratorError13, _iterator13, _step13, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion13 = true;
		        _didIteratorError13 = false;
		        _iteratorError13 = undefined;
		        context$1$0.prev = 3;
		        _iterator13 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion13 = (_step13 = _iterator13.next()).done) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        x = _step13.value;
		        context$1$0.next = 9;
		        return x[name];
	
		      case 9:
		        _iteratorNormalCompletion13 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 12:
		        context$1$0.next = 18;
		        break;
	
		      case 14:
		        context$1$0.prev = 14;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError13 = true;
		        _iteratorError13 = context$1$0.t0;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.prev = 19;
	
		        if (!_iteratorNormalCompletion13 && _iterator13["return"]) {
		          _iterator13["return"]();
		        }
	
		      case 21:
		        context$1$0.prev = 21;
	
		        if (!_didIteratorError13) {
		          context$1$0.next = 24;
		          break;
		        }
	
		        throw _iteratorError13;
	
		      case 24:
		        return context$1$0.finish(21);
	
		      case 25:
		        return context$1$0.finish(18);
	
		      case 26:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
		}));
	
		rewrapPrototypeAndStatic("reductions", _regeneratorRuntime.mark(function callee$0$0(fn) {
		  var initial = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
	
		  var val, _iteratorNormalCompletion14, _didIteratorError14, _iteratorError14, _iterator14, _step14, x, _iteratorNormalCompletion15, _didIteratorError15, _iteratorError15, _iterator15, _step15;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        val = initial;
	
		        if (!(val === undefined)) {
		          context$1$0.next = 28;
		          break;
		        }
	
		        _iteratorNormalCompletion14 = true;
		        _didIteratorError14 = false;
		        _iteratorError14 = undefined;
		        context$1$0.prev = 5;
		        _iterator14 = _getIterator(this);
	
		      case 7:
		        if (_iteratorNormalCompletion14 = (_step14 = _iterator14.next()).done) {
		          context$1$0.next = 14;
		          break;
		        }
	
		        x = _step14.value;
	
		        val = x;
		        return context$1$0.abrupt("break", 14);
	
		      case 11:
		        _iteratorNormalCompletion14 = true;
		        context$1$0.next = 7;
		        break;
	
		      case 14:
		        context$1$0.next = 20;
		        break;
	
		      case 16:
		        context$1$0.prev = 16;
		        context$1$0.t0 = context$1$0["catch"](5);
		        _didIteratorError14 = true;
		        _iteratorError14 = context$1$0.t0;
	
		      case 20:
		        context$1$0.prev = 20;
		        context$1$0.prev = 21;
	
		        if (!_iteratorNormalCompletion14 && _iterator14["return"]) {
		          _iterator14["return"]();
		        }
	
		      case 23:
		        context$1$0.prev = 23;
	
		        if (!_didIteratorError14) {
		          context$1$0.next = 26;
		          break;
		        }
	
		        throw _iteratorError14;
	
		      case 26:
		        return context$1$0.finish(23);
	
		      case 27:
		        return context$1$0.finish(20);
	
		      case 28:
		        context$1$0.next = 30;
		        return val;
	
		      case 30:
		        _iteratorNormalCompletion15 = true;
		        _didIteratorError15 = false;
		        _iteratorError15 = undefined;
		        context$1$0.prev = 33;
		        _iterator15 = _getIterator(this);
	
		      case 35:
		        if (_iteratorNormalCompletion15 = (_step15 = _iterator15.next()).done) {
		          context$1$0.next = 42;
		          break;
		        }
	
		        x = _step15.value;
		        context$1$0.next = 39;
		        return val = fn(val, x);
	
		      case 39:
		        _iteratorNormalCompletion15 = true;
		        context$1$0.next = 35;
		        break;
	
		      case 42:
		        context$1$0.next = 48;
		        break;
	
		      case 44:
		        context$1$0.prev = 44;
		        context$1$0.t1 = context$1$0["catch"](33);
		        _didIteratorError15 = true;
		        _iteratorError15 = context$1$0.t1;
	
		      case 48:
		        context$1$0.prev = 48;
		        context$1$0.prev = 49;
	
		        if (!_iteratorNormalCompletion15 && _iterator15["return"]) {
		          _iterator15["return"]();
		        }
	
		      case 51:
		        context$1$0.prev = 51;
	
		        if (!_didIteratorError15) {
		          context$1$0.next = 54;
		          break;
		        }
	
		        throw _iteratorError15;
	
		      case 54:
		        return context$1$0.finish(51);
	
		      case 55:
		        return context$1$0.finish(48);
	
		      case 56:
		        return context$1$0.abrupt("return", val);
	
		      case 57:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[5, 16, 20, 28], [21,, 23, 27], [33, 44, 48, 56], [49,, 51, 55]]);
		}), 2);
	
		rewrapPrototypeAndStatic("reject", _regeneratorRuntime.mark(function callee$0$0() {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	
		  var _iteratorNormalCompletion16, _didIteratorError16, _iteratorError16, _iterator16, _step16, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion16 = true;
		        _didIteratorError16 = false;
		        _iteratorError16 = undefined;
		        context$1$0.prev = 3;
		        _iterator16 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion16 = (_step16 = _iterator16.next()).done) {
		          context$1$0.next = 13;
		          break;
		        }
	
		        x = _step16.value;
	
		        if (fn(x)) {
		          context$1$0.next = 10;
		          break;
		        }
	
		        context$1$0.next = 10;
		        return x;
	
		      case 10:
		        _iteratorNormalCompletion16 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 13:
		        context$1$0.next = 19;
		        break;
	
		      case 15:
		        context$1$0.prev = 15;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError16 = true;
		        _iteratorError16 = context$1$0.t0;
	
		      case 19:
		        context$1$0.prev = 19;
		        context$1$0.prev = 20;
	
		        if (!_iteratorNormalCompletion16 && _iterator16["return"]) {
		          _iterator16["return"]();
		        }
	
		      case 22:
		        context$1$0.prev = 22;
	
		        if (!_didIteratorError16) {
		          context$1$0.next = 25;
		          break;
		        }
	
		        throw _iteratorError16;
	
		      case 25:
		        return context$1$0.finish(22);
	
		      case 26:
		        return context$1$0.finish(19);
	
		      case 27:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
		}), 1);
	
		rewrapPrototypeAndStatic("slice", _regeneratorRuntime.mark(function callee$0$0() {
		  var start = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
		  var stop = arguments.length <= 1 || arguments[1] === undefined ? Infinity : arguments[1];
	
		  var _iteratorNormalCompletion17, _didIteratorError17, _iteratorError17, _iterator17, _step17, _step17$value, x, i;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        if (!(stop < start)) {
		          context$1$0.next = 2;
		          break;
		        }
	
		        throw new RangeError("parameter `stop` (= " + stop + ") must be >= `start` (= " + start + ")");
	
		      case 2:
		        _iteratorNormalCompletion17 = true;
		        _didIteratorError17 = false;
		        _iteratorError17 = undefined;
		        context$1$0.prev = 5;
		        _iterator17 = _getIterator(this.enumerate());
	
		      case 7:
		        if (_iteratorNormalCompletion17 = (_step17 = _iterator17.next()).done) {
		          context$1$0.next = 20;
		          break;
		        }
	
		        _step17$value = _slicedToArray(_step17.value, 2);
		        x = _step17$value[0];
		        i = _step17$value[1];
	
		        if (!(i < start)) {
		          context$1$0.next = 13;
		          break;
		        }
	
		        return context$1$0.abrupt("continue", 17);
	
		      case 13:
		        if (!(i >= stop)) {
		          context$1$0.next = 15;
		          break;
		        }
	
		        return context$1$0.abrupt("break", 20);
	
		      case 15:
		        context$1$0.next = 17;
		        return x;
	
		      case 17:
		        _iteratorNormalCompletion17 = true;
		        context$1$0.next = 7;
		        break;
	
		      case 20:
		        context$1$0.next = 26;
		        break;
	
		      case 22:
		        context$1$0.prev = 22;
		        context$1$0.t0 = context$1$0["catch"](5);
		        _didIteratorError17 = true;
		        _iteratorError17 = context$1$0.t0;
	
		      case 26:
		        context$1$0.prev = 26;
		        context$1$0.prev = 27;
	
		        if (!_iteratorNormalCompletion17 && _iterator17["return"]) {
		          _iterator17["return"]();
		        }
	
		      case 29:
		        context$1$0.prev = 29;
	
		        if (!_didIteratorError17) {
		          context$1$0.next = 32;
		          break;
		        }
	
		        throw _iteratorError17;
	
		      case 32:
		        return context$1$0.finish(29);
	
		      case 33:
		        return context$1$0.finish(26);
	
		      case 34:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[5, 22, 26, 34], [27,, 29, 33]]);
		}), 2);
	
		rewrapPrototypeAndStatic("spreadMap", _regeneratorRuntime.mark(function callee$0$0(fn) {
		  var _iteratorNormalCompletion18, _didIteratorError18, _iteratorError18, _iterator18, _step18, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion18 = true;
		        _didIteratorError18 = false;
		        _iteratorError18 = undefined;
		        context$1$0.prev = 3;
		        _iterator18 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion18 = (_step18 = _iterator18.next()).done) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        x = _step18.value;
		        context$1$0.next = 9;
		        return fn.apply(undefined, _toConsumableArray(x));
	
		      case 9:
		        _iteratorNormalCompletion18 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 12:
		        context$1$0.next = 18;
		        break;
	
		      case 14:
		        context$1$0.prev = 14;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError18 = true;
		        _iteratorError18 = context$1$0.t0;
	
		      case 18:
		        context$1$0.prev = 18;
		        context$1$0.prev = 19;
	
		        if (!_iteratorNormalCompletion18 && _iterator18["return"]) {
		          _iterator18["return"]();
		        }
	
		      case 21:
		        context$1$0.prev = 21;
	
		        if (!_didIteratorError18) {
		          context$1$0.next = 24;
		          break;
		        }
	
		        throw _iteratorError18;
	
		      case 24:
		        return context$1$0.finish(21);
	
		      case 25:
		        return context$1$0.finish(18);
	
		      case 26:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 14, 18, 26], [19,, 21, 25]]);
		}));
	
		rewrapPrototypeAndStatic("take", _regeneratorRuntime.mark(function callee$0$0(n) {
		  var i, _iteratorNormalCompletion19, _didIteratorError19, _iteratorError19, _iterator19, _step19, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        if (!(n < 1)) {
		          context$1$0.next = 2;
		          break;
		        }
	
		        return context$1$0.abrupt("return");
	
		      case 2:
		        i = 0;
		        _iteratorNormalCompletion19 = true;
		        _didIteratorError19 = false;
		        _iteratorError19 = undefined;
		        context$1$0.prev = 6;
		        _iterator19 = _getIterator(this);
	
		      case 8:
		        if (_iteratorNormalCompletion19 = (_step19 = _iterator19.next()).done) {
		          context$1$0.next = 17;
		          break;
		        }
	
		        x = _step19.value;
		        context$1$0.next = 12;
		        return x;
	
		      case 12:
		        if (!(++i >= n)) {
		          context$1$0.next = 14;
		          break;
		        }
	
		        return context$1$0.abrupt("break", 17);
	
		      case 14:
		        _iteratorNormalCompletion19 = true;
		        context$1$0.next = 8;
		        break;
	
		      case 17:
		        context$1$0.next = 23;
		        break;
	
		      case 19:
		        context$1$0.prev = 19;
		        context$1$0.t0 = context$1$0["catch"](6);
		        _didIteratorError19 = true;
		        _iteratorError19 = context$1$0.t0;
	
		      case 23:
		        context$1$0.prev = 23;
		        context$1$0.prev = 24;
	
		        if (!_iteratorNormalCompletion19 && _iterator19["return"]) {
		          _iterator19["return"]();
		        }
	
		      case 26:
		        context$1$0.prev = 26;
	
		        if (!_didIteratorError19) {
		          context$1$0.next = 29;
		          break;
		        }
	
		        throw _iteratorError19;
	
		      case 29:
		        return context$1$0.finish(26);
	
		      case 30:
		        return context$1$0.finish(23);
	
		      case 31:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[6, 19, 23, 31], [24,, 26, 30]]);
		}));
	
		rewrapPrototypeAndStatic("takeWhile", _regeneratorRuntime.mark(function callee$0$0() {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
	
		  var _iteratorNormalCompletion20, _didIteratorError20, _iteratorError20, _iterator20, _step20, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion20 = true;
		        _didIteratorError20 = false;
		        _iteratorError20 = undefined;
		        context$1$0.prev = 3;
		        _iterator20 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion20 = (_step20 = _iterator20.next()).done) {
		          context$1$0.next = 14;
		          break;
		        }
	
		        x = _step20.value;
	
		        if (fn(x)) {
		          context$1$0.next = 9;
		          break;
		        }
	
		        return context$1$0.abrupt("break", 14);
	
		      case 9:
		        context$1$0.next = 11;
		        return x;
	
		      case 11:
		        _iteratorNormalCompletion20 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 14:
		        context$1$0.next = 20;
		        break;
	
		      case 16:
		        context$1$0.prev = 16;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError20 = true;
		        _iteratorError20 = context$1$0.t0;
	
		      case 20:
		        context$1$0.prev = 20;
		        context$1$0.prev = 21;
	
		        if (!_iteratorNormalCompletion20 && _iterator20["return"]) {
		          _iterator20["return"]();
		        }
	
		      case 23:
		        context$1$0.prev = 23;
	
		        if (!_didIteratorError20) {
		          context$1$0.next = 26;
		          break;
		        }
	
		        throw _iteratorError20;
	
		      case 26:
		        return context$1$0.finish(23);
	
		      case 27:
		        return context$1$0.finish(20);
	
		      case 28:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 16, 20, 28], [21,, 23, 27]]);
		}), 1);
	
		rewrapPrototypeAndStatic("tap", _regeneratorRuntime.mark(function callee$0$0() {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? console.log.bind(console) : arguments[0];
	
		  var _iteratorNormalCompletion21, _didIteratorError21, _iteratorError21, _iterator21, _step21, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        _iteratorNormalCompletion21 = true;
		        _didIteratorError21 = false;
		        _iteratorError21 = undefined;
		        context$1$0.prev = 3;
		        _iterator21 = _getIterator(this);
	
		      case 5:
		        if (_iteratorNormalCompletion21 = (_step21 = _iterator21.next()).done) {
		          context$1$0.next = 13;
		          break;
		        }
	
		        x = _step21.value;
	
		        fn(x);
		        context$1$0.next = 10;
		        return x;
	
		      case 10:
		        _iteratorNormalCompletion21 = true;
		        context$1$0.next = 5;
		        break;
	
		      case 13:
		        context$1$0.next = 19;
		        break;
	
		      case 15:
		        context$1$0.prev = 15;
		        context$1$0.t0 = context$1$0["catch"](3);
		        _didIteratorError21 = true;
		        _iteratorError21 = context$1$0.t0;
	
		      case 19:
		        context$1$0.prev = 19;
		        context$1$0.prev = 20;
	
		        if (!_iteratorNormalCompletion21 && _iterator21["return"]) {
		          _iterator21["return"]();
		        }
	
		      case 22:
		        context$1$0.prev = 22;
	
		        if (!_didIteratorError21) {
		          context$1$0.next = 25;
		          break;
		        }
	
		        throw _iteratorError21;
	
		      case 25:
		        return context$1$0.finish(22);
	
		      case 26:
		        return context$1$0.finish(19);
	
		      case 27:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[3, 15, 19, 27], [20,, 22, 26]]);
		}), 1);
	
		rewrapPrototypeAndStatic("unique", _regeneratorRuntime.mark(function callee$0$0() {
		  var seen, _iteratorNormalCompletion22, _didIteratorError22, _iteratorError22, _iterator22, _step22, x;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        seen = new _Set();
		        _iteratorNormalCompletion22 = true;
		        _didIteratorError22 = false;
		        _iteratorError22 = undefined;
		        context$1$0.prev = 4;
		        _iterator22 = _getIterator(this);
	
		      case 6:
		        if (_iteratorNormalCompletion22 = (_step22 = _iterator22.next()).done) {
		          context$1$0.next = 15;
		          break;
		        }
	
		        x = _step22.value;
	
		        if (seen.has(x)) {
		          context$1$0.next = 12;
		          break;
		        }
	
		        context$1$0.next = 11;
		        return x;
	
		      case 11:
		        seen.add(x);
	
		      case 12:
		        _iteratorNormalCompletion22 = true;
		        context$1$0.next = 6;
		        break;
	
		      case 15:
		        context$1$0.next = 21;
		        break;
	
		      case 17:
		        context$1$0.prev = 17;
		        context$1$0.t0 = context$1$0["catch"](4);
		        _didIteratorError22 = true;
		        _iteratorError22 = context$1$0.t0;
	
		      case 21:
		        context$1$0.prev = 21;
		        context$1$0.prev = 22;
	
		        if (!_iteratorNormalCompletion22 && _iterator22["return"]) {
		          _iterator22["return"]();
		        }
	
		      case 24:
		        context$1$0.prev = 24;
	
		        if (!_didIteratorError22) {
		          context$1$0.next = 27;
		          break;
		        }
	
		        throw _iteratorError22;
	
		      case 27:
		        return context$1$0.finish(24);
	
		      case 28:
		        return context$1$0.finish(21);
	
		      case 29:
		        seen.clear();
	
		      case 30:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[4, 17, 21, 29], [22,, 24, 28]]);
		}));
	
		var _zip = rewrap(_regeneratorRuntime.mark(function callee$0$0(iterables) {
		  var longest = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];
	
		  var iters, numIters, numFinished, finished, zipped, _iteratorNormalCompletion23, _didIteratorError23, _iteratorError23, _iterator23, _step23, it, _it$next, value, done;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        if (iterables.length) {
		          context$1$0.next = 2;
		          break;
		        }
	
		        return context$1$0.abrupt("return");
	
		      case 2:
		        iters = iterables.map(getIterator);
		        numIters = iterables.length;
		        numFinished = 0;
		        finished = false;
	
		      case 6:
		        if (finished) {
		          context$1$0.next = 44;
		          break;
		        }
	
		        zipped = [];
		        _iteratorNormalCompletion23 = true;
		        _didIteratorError23 = false;
		        _iteratorError23 = undefined;
		        context$1$0.prev = 11;
		        _iterator23 = _getIterator(iters);
	
		      case 13:
		        if (_iteratorNormalCompletion23 = (_step23 = _iterator23.next()).done) {
		          context$1$0.next = 26;
		          break;
		        }
	
		        it = _step23.value;
		        _it$next = it.next();
		        value = _it$next.value;
		        done = _it$next.done;
	
		        if (!done) {
		          context$1$0.next = 22;
		          break;
		        }
	
		        if (longest) {
		          context$1$0.next = 21;
		          break;
		        }
	
		        return context$1$0.abrupt("return");
	
		      case 21:
		        if (++numFinished == numIters) {
		          finished = true;
		        }
	
		      case 22:
		        if (value === undefined) {
		          // Leave a hole in the array so that you can distinguish an iterable
		          // that's done (via `index in array == false`) from an iterable
		          // yielding `undefined`.
		          zipped.length++;
		        } else {
		          zipped.push(value);
		        }
	
		      case 23:
		        _iteratorNormalCompletion23 = true;
		        context$1$0.next = 13;
		        break;
	
		      case 26:
		        context$1$0.next = 32;
		        break;
	
		      case 28:
		        context$1$0.prev = 28;
		        context$1$0.t0 = context$1$0["catch"](11);
		        _didIteratorError23 = true;
		        _iteratorError23 = context$1$0.t0;
	
		      case 32:
		        context$1$0.prev = 32;
		        context$1$0.prev = 33;
	
		        if (!_iteratorNormalCompletion23 && _iterator23["return"]) {
		          _iterator23["return"]();
		        }
	
		      case 35:
		        context$1$0.prev = 35;
	
		        if (!_didIteratorError23) {
		          context$1$0.next = 38;
		          break;
		        }
	
		        throw _iteratorError23;
	
		      case 38:
		        return context$1$0.finish(35);
	
		      case 39:
		        return context$1$0.finish(32);
	
		      case 40:
		        context$1$0.next = 42;
		        return zipped;
	
		      case 42:
		        context$1$0.next = 6;
		        break;
	
		      case 44:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this, [[11, 28, 32, 40], [33,, 35, 39]]);
		}));
	
		rewrapStaticMethod("zip", _regeneratorRuntime.mark(function callee$0$0() {
		  for (var _len7 = arguments.length, iterables = Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
		    iterables[_key7] = arguments[_key7];
		  }
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        return context$1$0.delegateYield(_zip(iterables), "t0", 1);
	
		      case 1:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		rewrapStaticMethod("zipLongest", _regeneratorRuntime.mark(function callee$0$0() {
		  for (var _len8 = arguments.length, iterables = Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
		    iterables[_key8] = arguments[_key8];
		  }
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        return context$1$0.delegateYield(_zip(iterables, true), "t0", 1);
	
		      case 1:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		rewrapStaticMethod("zipWith", _regeneratorRuntime.mark(function callee$0$0(fn) {
		  for (var _len9 = arguments.length, iterables = Array(_len9 > 1 ? _len9 - 1 : 0), _key9 = 1; _key9 < _len9; _key9++) {
		    iterables[_key9 - 1] = arguments[_key9];
		  }
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        return context$1$0.delegateYield(_zip(iterables).spreadMap(fn), "t0", 1);
	
		      case 1:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
	
		/*
		 * Functions that force iteration to completion and return a value.
		 */
	
		// The maximum number of milliseconds we will block the main thread at a time
		// while in `asyncEach`.
		wu.MAX_BLOCK = 15;
		// The number of milliseconds to yield to the main thread between bursts of
		// work.
		wu.TIMEOUT = 1;
	
		prototypeAndStatic("asyncEach", function (fn) {
		  var maxBlock = arguments.length <= 1 || arguments[1] === undefined ? wu.MAX_BLOCK : arguments[1];
		  var timeout = arguments.length <= 2 || arguments[2] === undefined ? wu.TIMEOUT : arguments[2];
	
		  var iter = getIterator(this);
	
		  return new _Promise(function (resolve, reject) {
		    (function loop() {
		      var start = Date.now();
	
		      var _iteratorNormalCompletion24 = true;
		      var _didIteratorError24 = false;
		      var _iteratorError24 = undefined;
	
		      try {
		        for (var _iterator24 = _getIterator(iter), _step24; !(_iteratorNormalCompletion24 = (_step24 = _iterator24.next()).done); _iteratorNormalCompletion24 = true) {
		          var x = _step24.value;
	
		          try {
		            fn(x);
		          } catch (e) {
		            reject(e);
		            return;
		          }
	
		          if (Date.now() - start > maxBlock) {
		            setTimeout(loop, timeout);
		            return;
		          }
		        }
		      } catch (err) {
		        _didIteratorError24 = true;
		        _iteratorError24 = err;
		      } finally {
		        try {
		          if (!_iteratorNormalCompletion24 && _iterator24["return"]) {
		            _iterator24["return"]();
		          }
		        } finally {
		          if (_didIteratorError24) {
		            throw _iteratorError24;
		          }
		        }
		      }
	
		      resolve();
		    })();
		  });
		}, 3);
	
		prototypeAndStatic("every", function () {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
		  var _iteratorNormalCompletion25 = true;
		  var _didIteratorError25 = false;
		  var _iteratorError25 = undefined;
	
		  try {
		    for (var _iterator25 = _getIterator(this), _step25; !(_iteratorNormalCompletion25 = (_step25 = _iterator25.next()).done); _iteratorNormalCompletion25 = true) {
		      var x = _step25.value;
	
		      if (!fn(x)) {
		        return false;
		      }
		    }
		  } catch (err) {
		    _didIteratorError25 = true;
		    _iteratorError25 = err;
		  } finally {
		    try {
		      if (!_iteratorNormalCompletion25 && _iterator25["return"]) {
		        _iterator25["return"]();
		      }
		    } finally {
		      if (_didIteratorError25) {
		        throw _iteratorError25;
		      }
		    }
		  }
	
		  return true;
		}, 1);
	
		prototypeAndStatic("find", function (fn) {
		  var _iteratorNormalCompletion26 = true;
		  var _didIteratorError26 = false;
		  var _iteratorError26 = undefined;
	
		  try {
		    for (var _iterator26 = _getIterator(this), _step26; !(_iteratorNormalCompletion26 = (_step26 = _iterator26.next()).done); _iteratorNormalCompletion26 = true) {
		      var x = _step26.value;
	
		      if (fn(x)) {
		        return x;
		      }
		    }
		  } catch (err) {
		    _didIteratorError26 = true;
		    _iteratorError26 = err;
		  } finally {
		    try {
		      if (!_iteratorNormalCompletion26 && _iterator26["return"]) {
		        _iterator26["return"]();
		      }
		    } finally {
		      if (_didIteratorError26) {
		        throw _iteratorError26;
		      }
		    }
		  }
		});
	
		prototypeAndStatic("forEach", function (fn) {
		  var _iteratorNormalCompletion27 = true;
		  var _didIteratorError27 = false;
		  var _iteratorError27 = undefined;
	
		  try {
		    for (var _iterator27 = _getIterator(this), _step27; !(_iteratorNormalCompletion27 = (_step27 = _iterator27.next()).done); _iteratorNormalCompletion27 = true) {
		      var x = _step27.value;
	
		      fn(x);
		    }
		  } catch (err) {
		    _didIteratorError27 = true;
		    _iteratorError27 = err;
		  } finally {
		    try {
		      if (!_iteratorNormalCompletion27 && _iterator27["return"]) {
		        _iterator27["return"]();
		      }
		    } finally {
		      if (_didIteratorError27) {
		        throw _iteratorError27;
		      }
		    }
		  }
		});
	
		prototypeAndStatic("has", function (thing) {
		  return this.some(function (x) {
		    return x === thing;
		  });
		});
	
		prototypeAndStatic("reduce", function (fn) {
		  var initial = arguments.length <= 1 || arguments[1] === undefined ? undefined : arguments[1];
	
		  var val = initial;
		  if (val === undefined) {
		    var _iteratorNormalCompletion28 = true;
		    var _didIteratorError28 = false;
		    var _iteratorError28 = undefined;
	
		    try {
		      for (var _iterator28 = _getIterator(this), _step28; !(_iteratorNormalCompletion28 = (_step28 = _iterator28.next()).done); _iteratorNormalCompletion28 = true) {
		        var x = _step28.value;
	
		        val = x;
		        break;
		      }
		    } catch (err) {
		      _didIteratorError28 = true;
		      _iteratorError28 = err;
		    } finally {
		      try {
		        if (!_iteratorNormalCompletion28 && _iterator28["return"]) {
		          _iterator28["return"]();
		        }
		      } finally {
		        if (_didIteratorError28) {
		          throw _iteratorError28;
		        }
		      }
		    }
		  }
	
		  var _iteratorNormalCompletion29 = true;
		  var _didIteratorError29 = false;
		  var _iteratorError29 = undefined;
	
		  try {
		    for (var _iterator29 = _getIterator(this), _step29; !(_iteratorNormalCompletion29 = (_step29 = _iterator29.next()).done); _iteratorNormalCompletion29 = true) {
		      var x = _step29.value;
	
		      val = fn(val, x);
		    }
		  } catch (err) {
		    _didIteratorError29 = true;
		    _iteratorError29 = err;
		  } finally {
		    try {
		      if (!_iteratorNormalCompletion29 && _iterator29["return"]) {
		        _iterator29["return"]();
		      }
		    } finally {
		      if (_didIteratorError29) {
		        throw _iteratorError29;
		      }
		    }
		  }
	
		  return val;
		}, 2);
	
		prototypeAndStatic("some", function () {
		  var fn = arguments.length <= 0 || arguments[0] === undefined ? Boolean : arguments[0];
		  var _iteratorNormalCompletion30 = true;
		  var _didIteratorError30 = false;
		  var _iteratorError30 = undefined;
	
		  try {
		    for (var _iterator30 = _getIterator(this), _step30; !(_iteratorNormalCompletion30 = (_step30 = _iterator30.next()).done); _iteratorNormalCompletion30 = true) {
		      var x = _step30.value;
	
		      if (fn(x)) {
		        return true;
		      }
		    }
		  } catch (err) {
		    _didIteratorError30 = true;
		    _iteratorError30 = err;
		  } finally {
		    try {
		      if (!_iteratorNormalCompletion30 && _iterator30["return"]) {
		        _iterator30["return"]();
		      }
		    } finally {
		      if (_didIteratorError30) {
		        throw _iteratorError30;
		      }
		    }
		  }
	
		  return false;
		}, 1);
	
		prototypeAndStatic("toArray", function () {
		  return [].concat(_toConsumableArray(this));
		});
	
		/*
		 * Methods that return an array of iterables.
		 */
	
		var MAX_CACHE = 500;
	
		var _tee = rewrap(_regeneratorRuntime.mark(function callee$0$0(iterator, cache) {
		  var items, index, _iterator$next, done, value;
	
		  return _regeneratorRuntime.wrap(function callee$0$0$(context$1$0) {
		    while (1) switch (context$1$0.prev = context$1$0.next) {
		      case 0:
		        items = cache.items;
		        index = 0;
	
		      case 2:
		        if (false) {
		          context$1$0.next = 25;
		          break;
		        }
	
		        if (!(index === items.length)) {
		          context$1$0.next = 14;
		          break;
		        }
	
		        _iterator$next = iterator.next();
		        done = _iterator$next.done;
		        value = _iterator$next.value;
	
		        if (!done) {
		          context$1$0.next = 10;
		          break;
		        }
	
		        if (cache.returned === MISSING) {
		          cache.returned = value;
		        }
		        return context$1$0.abrupt("break", 25);
	
		      case 10:
		        context$1$0.next = 12;
		        return items[index++] = value;
	
		      case 12:
		        context$1$0.next = 23;
		        break;
	
		      case 14:
		        if (!(index === cache.tail)) {
		          context$1$0.next = 21;
		          break;
		        }
	
		        value = items[index];
	
		        if (index === MAX_CACHE) {
		          items = cache.items = items.slice(index);
		          index = 0;
		          cache.tail = 0;
		        } else {
		          items[index] = undefined;
		          cache.tail = ++index;
		        }
		        context$1$0.next = 19;
		        return value;
	
		      case 19:
		        context$1$0.next = 23;
		        break;
	
		      case 21:
		        context$1$0.next = 23;
		        return items[index++];
	
		      case 23:
		        context$1$0.next = 2;
		        break;
	
		      case 25:
	
		        if (cache.tail === index) {
		          items.length = 0;
		        }
	
		        return context$1$0.abrupt("return", cache.returned);
	
		      case 27:
		      case "end":
		        return context$1$0.stop();
		    }
		  }, callee$0$0, this);
		}));
		_tee.prototype = Wu.prototype;
	
		prototypeAndStatic("tee", function () {
		  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];
	
		  var iterables = new Array(n);
		  var cache = { tail: 0, items: [], returned: MISSING };
	
		  while (n--) {
		    iterables[n] = _tee(this, cache);
		  }
	
		  return iterables;
		}, 1);
	
		prototypeAndStatic("unzip", function () {
		  var n = arguments.length <= 0 || arguments[0] === undefined ? 2 : arguments[0];
	
		  return this.tee(n).map(function (iter, i) {
		    return iter.pluck(i);
		  });
		}, 1);
	
		/*
		 * Number of chambers.
		 */
	
		wu.tang = { clan: 36 };
	
		// We don't have a cached item for this index, we need to force its
		// evaluation.
	
		// If we are the last iterator to use a cached value, clean up after
		// ourselves.
	
		// We have an item in the cache for this index, so yield it.
	
	/***/ },
	/* 1 */
	/***/ function(module, exports, __webpack_require__) {
	
		"use strict";
	
		var _Array$from = __webpack_require__(2)["default"];
	
		exports["default"] = function (arr) {
		  if (Array.isArray(arr)) {
		    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];
	
		    return arr2;
		  } else {
		    return _Array$from(arr);
		  }
		};
	
		exports.__esModule = true;
	
	/***/ },
	/* 2 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(3), __esModule: true };
	
	/***/ },
	/* 3 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(4);
		__webpack_require__(26);
		module.exports = __webpack_require__(12).Array.from;
	
	/***/ },
	/* 4 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var $at  = __webpack_require__(5)(true);
	
		// 21.1.3.27 String.prototype[@@iterator]()
		__webpack_require__(8)(String, 'String', function(iterated){
		  this._t = String(iterated); // target
		  this._i = 0;                // next index
		// 21.1.5.2.1 %StringIteratorPrototype%.next()
		}, function(){
		  var O     = this._t
		    , index = this._i
		    , point;
		  if(index >= O.length)return {value: undefined, done: true};
		  point = $at(O, index);
		  this._i += point.length;
		  return {value: point, done: false};
		});
	
	/***/ },
	/* 5 */
	/***/ function(module, exports, __webpack_require__) {
	
		// true  -> String#at
		// false -> String#codePointAt
		var toInteger = __webpack_require__(6)
		  , defined   = __webpack_require__(7);
		module.exports = function(TO_STRING){
		  return function(that, pos){
		    var s = String(defined(that))
		      , i = toInteger(pos)
		      , l = s.length
		      , a, b;
		    if(i < 0 || i >= l)return TO_STRING ? '' : undefined;
		    a = s.charCodeAt(i);
		    return a < 0xd800 || a > 0xdbff || i + 1 === l
		      || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
		        ? TO_STRING ? s.charAt(i) : a
		        : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
		  };
		};
	
	/***/ },
	/* 6 */
	/***/ function(module, exports) {
	
		// 7.1.4 ToInteger
		var ceil  = Math.ceil
		  , floor = Math.floor;
		module.exports = function(it){
		  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
		};
	
	/***/ },
	/* 7 */
	/***/ function(module, exports) {
	
		// 7.2.1 RequireObjectCoercible(argument)
		module.exports = function(it){
		  if(it == undefined)throw TypeError("Can't call method on  " + it);
		  return it;
		};
	
	/***/ },
	/* 8 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var LIBRARY         = __webpack_require__(9)
		  , $def            = __webpack_require__(10)
		  , $redef          = __webpack_require__(13)
		  , hide            = __webpack_require__(14)
		  , has             = __webpack_require__(19)
		  , SYMBOL_ITERATOR = __webpack_require__(20)('iterator')
		  , Iterators       = __webpack_require__(23)
		  , BUGGY           = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
		  , FF_ITERATOR     = '@@iterator'
		  , KEYS            = 'keys'
		  , VALUES          = 'values';
		var returnThis = function(){ return this; };
		module.exports = function(Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCE){
		  __webpack_require__(24)(Constructor, NAME, next);
		  var createMethod = function(kind){
		    switch(kind){
		      case KEYS: return function keys(){ return new Constructor(this, kind); };
		      case VALUES: return function values(){ return new Constructor(this, kind); };
		    } return function entries(){ return new Constructor(this, kind); };
		  };
		  var TAG      = NAME + ' Iterator'
		    , proto    = Base.prototype
		    , _native  = proto[SYMBOL_ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT]
		    , _default = _native || createMethod(DEFAULT)
		    , methods, key;
		  // Fix native
		  if(_native){
		    var IteratorPrototype = __webpack_require__(15).getProto(_default.call(new Base));
		    // Set @@toStringTag to native iterators
		    __webpack_require__(25)(IteratorPrototype, TAG, true);
		    // FF fix
		    if(!LIBRARY && has(proto, FF_ITERATOR))hide(IteratorPrototype, SYMBOL_ITERATOR, returnThis);
		  }
		  // Define iterator
		  if(!LIBRARY || FORCE)hide(proto, SYMBOL_ITERATOR, _default);
		  // Plug for library
		  Iterators[NAME] = _default;
		  Iterators[TAG]  = returnThis;
		  if(DEFAULT){
		    methods = {
		      keys:    IS_SET            ? _default : createMethod(KEYS),
		      values:  DEFAULT == VALUES ? _default : createMethod(VALUES),
		      entries: DEFAULT != VALUES ? _default : createMethod('entries')
		    };
		    if(FORCE)for(key in methods){
		      if(!(key in proto))$redef(proto, key, methods[key]);
		    } else $def($def.P + $def.F * BUGGY, NAME, methods);
		  }
		};
	
	/***/ },
	/* 9 */
	/***/ function(module, exports) {
	
		module.exports = true;
	
	/***/ },
	/* 10 */
	/***/ function(module, exports, __webpack_require__) {
	
		var global    = __webpack_require__(11)
		  , core      = __webpack_require__(12)
		  , PROTOTYPE = 'prototype';
		var ctx = function(fn, that){
		  return function(){
		    return fn.apply(that, arguments);
		  };
		};
		var $def = function(type, name, source){
		  var key, own, out, exp
		    , isGlobal = type & $def.G
		    , isProto  = type & $def.P
		    , target   = isGlobal ? global : type & $def.S
		        ? global[name] : (global[name] || {})[PROTOTYPE]
		    , exports  = isGlobal ? core : core[name] || (core[name] = {});
		  if(isGlobal)source = name;
		  for(key in source){
		    // contains in native
		    own = !(type & $def.F) && target && key in target;
		    if(own && key in exports)continue;
		    // export native or passed
		    out = own ? target[key] : source[key];
		    // prevent global pollution for namespaces
		    if(isGlobal && typeof target[key] != 'function')exp = source[key];
		    // bind timers to global for call from export context
		    else if(type & $def.B && own)exp = ctx(out, global);
		    // wrap global constructors for prevent change them in library
		    else if(type & $def.W && target[key] == out)!function(C){
		      exp = function(param){
		        return this instanceof C ? new C(param) : C(param);
		      };
		      exp[PROTOTYPE] = C[PROTOTYPE];
		    }(out);
		    else exp = isProto && typeof out == 'function' ? ctx(Function.call, out) : out;
		    // export
		    exports[key] = exp;
		    if(isProto)(exports[PROTOTYPE] || (exports[PROTOTYPE] = {}))[key] = out;
		  }
		};
		// type bitmap
		$def.F = 1;  // forced
		$def.G = 2;  // global
		$def.S = 4;  // static
		$def.P = 8;  // proto
		$def.B = 16; // bind
		$def.W = 32; // wrap
		module.exports = $def;
	
	/***/ },
	/* 11 */
	/***/ function(module, exports) {
	
		// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
		var UNDEFINED = 'undefined';
		var global = module.exports = typeof window != UNDEFINED && window.Math == Math
		  ? window : typeof self != UNDEFINED && self.Math == Math ? self : Function('return this')();
		if(typeof __g == 'number')__g = global; // eslint-disable-line no-undef
	
	/***/ },
	/* 12 */
	/***/ function(module, exports) {
	
		var core = module.exports = {version: '1.2.0'};
		if(typeof __e == 'number')__e = core; // eslint-disable-line no-undef
	
	/***/ },
	/* 13 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = __webpack_require__(14);
	
	/***/ },
	/* 14 */
	/***/ function(module, exports, __webpack_require__) {
	
		var $          = __webpack_require__(15)
		  , createDesc = __webpack_require__(16);
		module.exports = __webpack_require__(17) ? function(object, key, value){
		  return $.setDesc(object, key, createDesc(1, value));
		} : function(object, key, value){
		  object[key] = value;
		  return object;
		};
	
	/***/ },
	/* 15 */
	/***/ function(module, exports) {
	
		var $Object = Object;
		module.exports = {
		  create:     $Object.create,
		  getProto:   $Object.getPrototypeOf,
		  isEnum:     {}.propertyIsEnumerable,
		  getDesc:    $Object.getOwnPropertyDescriptor,
		  setDesc:    $Object.defineProperty,
		  setDescs:   $Object.defineProperties,
		  getKeys:    $Object.keys,
		  getNames:   $Object.getOwnPropertyNames,
		  getSymbols: $Object.getOwnPropertySymbols,
		  each:       [].forEach
		};
	
	/***/ },
	/* 16 */
	/***/ function(module, exports) {
	
		module.exports = function(bitmap, value){
		  return {
		    enumerable  : !(bitmap & 1),
		    configurable: !(bitmap & 2),
		    writable    : !(bitmap & 4),
		    value       : value
		  };
		};
	
	/***/ },
	/* 17 */
	/***/ function(module, exports, __webpack_require__) {
	
		// Thank's IE8 for his funny defineProperty
		module.exports = !__webpack_require__(18)(function(){
		  return Object.defineProperty({}, 'a', {get: function(){ return 7; }}).a != 7;
		});
	
	/***/ },
	/* 18 */
	/***/ function(module, exports) {
	
		module.exports = function(exec){
		  try {
		    return !!exec();
		  } catch(e){
		    return true;
		  }
		};
	
	/***/ },
	/* 19 */
	/***/ function(module, exports) {
	
		var hasOwnProperty = {}.hasOwnProperty;
		module.exports = function(it, key){
		  return hasOwnProperty.call(it, key);
		};
	
	/***/ },
	/* 20 */
	/***/ function(module, exports, __webpack_require__) {
	
		var store  = __webpack_require__(21)('wks')
		  , Symbol = __webpack_require__(11).Symbol;
		module.exports = function(name){
		  return store[name] || (store[name] =
		    Symbol && Symbol[name] || (Symbol || __webpack_require__(22))('Symbol.' + name));
		};
	
	/***/ },
	/* 21 */
	/***/ function(module, exports, __webpack_require__) {
	
		var global = __webpack_require__(11)
		  , SHARED = '__core-js_shared__'
		  , store  = global[SHARED] || (global[SHARED] = {});
		module.exports = function(key){
		  return store[key] || (store[key] = {});
		};
	
	/***/ },
	/* 22 */
	/***/ function(module, exports) {
	
		var id = 0
		  , px = Math.random();
		module.exports = function(key){
		  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
		};
	
	/***/ },
	/* 23 */
	/***/ function(module, exports) {
	
		module.exports = {};
	
	/***/ },
	/* 24 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var $ = __webpack_require__(15)
		  , IteratorPrototype = {};
	
		// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
		__webpack_require__(14)(IteratorPrototype, __webpack_require__(20)('iterator'), function(){ return this; });
	
		module.exports = function(Constructor, NAME, next){
		  Constructor.prototype = $.create(IteratorPrototype, {next: __webpack_require__(16)(1,next)});
		  __webpack_require__(25)(Constructor, NAME + ' Iterator');
		};
	
	/***/ },
	/* 25 */
	/***/ function(module, exports, __webpack_require__) {
	
		var has  = __webpack_require__(19)
		  , hide = __webpack_require__(14)
		  , TAG  = __webpack_require__(20)('toStringTag');
	
		module.exports = function(it, tag, stat){
		  if(it && !has(it = stat ? it : it.prototype, TAG))hide(it, TAG, tag);
		};
	
	/***/ },
	/* 26 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var ctx         = __webpack_require__(27)
		  , $def        = __webpack_require__(10)
		  , toObject    = __webpack_require__(29)
		  , call        = __webpack_require__(30)
		  , isArrayIter = __webpack_require__(33)
		  , toLength    = __webpack_require__(34)
		  , getIterFn   = __webpack_require__(35);
		$def($def.S + $def.F * !__webpack_require__(38)(function(iter){ Array.from(iter); }), 'Array', {
		  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
		  from: function from(arrayLike/*, mapfn = undefined, thisArg = undefined*/){
		    var O       = toObject(arrayLike)
		      , C       = typeof this == 'function' ? this : Array
		      , mapfn   = arguments[1]
		      , mapping = mapfn !== undefined
		      , index   = 0
		      , iterFn  = getIterFn(O)
		      , length, result, step, iterator;
		    if(mapping)mapfn = ctx(mapfn, arguments[2], 2);
		    // if object isn't iterable or it's array with default iterator - use simple case
		    if(iterFn != undefined && !(C == Array && isArrayIter(iterFn))){
		      for(iterator = iterFn.call(O), result = new C; !(step = iterator.next()).done; index++){
		        result[index] = mapping ? call(iterator, mapfn, [step.value, index], true) : step.value;
		      }
		    } else {
		      length = toLength(O.length);
		      for(result = new C(length); length > index; index++){
		        result[index] = mapping ? mapfn(O[index], index) : O[index];
		      }
		    }
		    result.length = index;
		    return result;
		  }
		});
	
	
	/***/ },
	/* 27 */
	/***/ function(module, exports, __webpack_require__) {
	
		// optional / simple context binding
		var aFunction = __webpack_require__(28);
		module.exports = function(fn, that, length){
		  aFunction(fn);
		  if(that === undefined)return fn;
		  switch(length){
		    case 1: return function(a){
		      return fn.call(that, a);
		    };
		    case 2: return function(a, b){
		      return fn.call(that, a, b);
		    };
		    case 3: return function(a, b, c){
		      return fn.call(that, a, b, c);
		    };
		  }
		  return function(/* ...args */){
		    return fn.apply(that, arguments);
		  };
		};
	
	/***/ },
	/* 28 */
	/***/ function(module, exports) {
	
		module.exports = function(it){
		  if(typeof it != 'function')throw TypeError(it + ' is not a function!');
		  return it;
		};
	
	/***/ },
	/* 29 */
	/***/ function(module, exports, __webpack_require__) {
	
		// 7.1.13 ToObject(argument)
		var defined = __webpack_require__(7);
		module.exports = function(it){
		  return Object(defined(it));
		};
	
	/***/ },
	/* 30 */
	/***/ function(module, exports, __webpack_require__) {
	
		// call something on iterator step with safe closing on error
		var anObject = __webpack_require__(31);
		module.exports = function(iterator, fn, value, entries){
		  try {
		    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
		  // 7.4.6 IteratorClose(iterator, completion)
		  } catch(e){
		    var ret = iterator['return'];
		    if(ret !== undefined)anObject(ret.call(iterator));
		    throw e;
		  }
		};
	
	/***/ },
	/* 31 */
	/***/ function(module, exports, __webpack_require__) {
	
		var isObject = __webpack_require__(32);
		module.exports = function(it){
		  if(!isObject(it))throw TypeError(it + ' is not an object!');
		  return it;
		};
	
	/***/ },
	/* 32 */
	/***/ function(module, exports) {
	
		module.exports = function(it){
		  return typeof it === 'object' ? it !== null : typeof it === 'function';
		};
	
	/***/ },
	/* 33 */
	/***/ function(module, exports, __webpack_require__) {
	
		// check on default Array iterator
		var Iterators = __webpack_require__(23)
		  , ITERATOR  = __webpack_require__(20)('iterator');
		module.exports = function(it){
		  return (Iterators.Array || Array.prototype[ITERATOR]) === it;
		};
	
	/***/ },
	/* 34 */
	/***/ function(module, exports, __webpack_require__) {
	
		// 7.1.15 ToLength
		var toInteger = __webpack_require__(6)
		  , min       = Math.min;
		module.exports = function(it){
		  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
		};
	
	/***/ },
	/* 35 */
	/***/ function(module, exports, __webpack_require__) {
	
		var classof   = __webpack_require__(36)
		  , ITERATOR  = __webpack_require__(20)('iterator')
		  , Iterators = __webpack_require__(23);
		module.exports = __webpack_require__(12).getIteratorMethod = function(it){
		  if(it != undefined)return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
		};
	
	/***/ },
	/* 36 */
	/***/ function(module, exports, __webpack_require__) {
	
		// getting tag from 19.1.3.6 Object.prototype.toString()
		var cof = __webpack_require__(37)
		  , TAG = __webpack_require__(20)('toStringTag')
		  // ES3 wrong here
		  , ARG = cof(function(){ return arguments; }()) == 'Arguments';
	
		module.exports = function(it){
		  var O, T, B;
		  return it === undefined ? 'Undefined' : it === null ? 'Null'
		    // @@toStringTag case
		    : typeof (T = (O = Object(it))[TAG]) == 'string' ? T
		    // builtinTag case
		    : ARG ? cof(O)
		    // ES3 arguments fallback
		    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
		};
	
	/***/ },
	/* 37 */
	/***/ function(module, exports) {
	
		var toString = {}.toString;
	
		module.exports = function(it){
		  return toString.call(it).slice(8, -1);
		};
	
	/***/ },
	/* 38 */
	/***/ function(module, exports, __webpack_require__) {
	
		var SYMBOL_ITERATOR = __webpack_require__(20)('iterator')
		  , SAFE_CLOSING    = false;
		try {
		  var riter = [7][SYMBOL_ITERATOR]();
		  riter['return'] = function(){ SAFE_CLOSING = true; };
		  Array.from(riter, function(){ throw 2; });
		} catch(e){ /* empty */ }
		module.exports = function(exec){
		  if(!SAFE_CLOSING)return false;
		  var safe = false;
		  try {
		    var arr  = [7]
		      , iter = arr[SYMBOL_ITERATOR]();
		    iter.next = function(){ safe = true; };
		    arr[SYMBOL_ITERATOR] = function(){ return iter; };
		    exec(arr);
		  } catch(e){ /* empty */ }
		  return safe;
		};
	
	/***/ },
	/* 39 */
	/***/ function(module, exports, __webpack_require__) {
	
		"use strict";
	
		var _getIterator = __webpack_require__(40)["default"];
	
		var _isIterable = __webpack_require__(49)["default"];
	
		exports["default"] = (function () {
		  function sliceIterator(arr, i) {
		    var _arr = [];
		    var _n = true;
		    var _d = false;
		    var _e = undefined;
	
		    try {
		      for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
		        _arr.push(_s.value);
	
		        if (i && _arr.length === i) break;
		      }
		    } catch (err) {
		      _d = true;
		      _e = err;
		    } finally {
		      try {
		        if (!_n && _i["return"]) _i["return"]();
		      } finally {
		        if (_d) throw _e;
		      }
		    }
	
		    return _arr;
		  }
	
		  return function (arr, i) {
		    if (Array.isArray(arr)) {
		      return arr;
		    } else if (_isIterable(Object(arr))) {
		      return sliceIterator(arr, i);
		    } else {
		      throw new TypeError("Invalid attempt to destructure non-iterable instance");
		    }
		  };
		})();
	
		exports.__esModule = true;
	
	/***/ },
	/* 40 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(41), __esModule: true };
	
	/***/ },
	/* 41 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(42);
		__webpack_require__(4);
		module.exports = __webpack_require__(48);
	
	/***/ },
	/* 42 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(43);
		var Iterators = __webpack_require__(23);
		Iterators.NodeList = Iterators.HTMLCollection = Iterators.Array;
	
	/***/ },
	/* 43 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var setUnscope = __webpack_require__(44)
		  , step       = __webpack_require__(45)
		  , Iterators  = __webpack_require__(23)
		  , toIObject  = __webpack_require__(46);
	
		// 22.1.3.4 Array.prototype.entries()
		// 22.1.3.13 Array.prototype.keys()
		// 22.1.3.29 Array.prototype.values()
		// 22.1.3.30 Array.prototype[@@iterator]()
		__webpack_require__(8)(Array, 'Array', function(iterated, kind){
		  this._t = toIObject(iterated); // target
		  this._i = 0;                   // next index
		  this._k = kind;                // kind
		// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
		}, function(){
		  var O     = this._t
		    , kind  = this._k
		    , index = this._i++;
		  if(!O || index >= O.length){
		    this._t = undefined;
		    return step(1);
		  }
		  if(kind == 'keys'  )return step(0, index);
		  if(kind == 'values')return step(0, O[index]);
		  return step(0, [index, O[index]]);
		}, 'values');
	
		// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
		Iterators.Arguments = Iterators.Array;
	
		setUnscope('keys');
		setUnscope('values');
		setUnscope('entries');
	
	/***/ },
	/* 44 */
	/***/ function(module, exports) {
	
		module.exports = function(){ /* empty */ };
	
	/***/ },
	/* 45 */
	/***/ function(module, exports) {
	
		module.exports = function(done, value){
		  return {value: value, done: !!done};
		};
	
	/***/ },
	/* 46 */
	/***/ function(module, exports, __webpack_require__) {
	
		// to indexed object, toObject with fallback for non-array-like ES3 strings
		var IObject = __webpack_require__(47)
		  , defined = __webpack_require__(7);
		module.exports = function(it){
		  return IObject(defined(it));
		};
	
	/***/ },
	/* 47 */
	/***/ function(module, exports, __webpack_require__) {
	
		// indexed object, fallback for non-array-like ES3 strings
		var cof = __webpack_require__(37);
		module.exports = 0 in Object('z') ? Object : function(it){
		  return cof(it) == 'String' ? it.split('') : Object(it);
		};
	
	/***/ },
	/* 48 */
	/***/ function(module, exports, __webpack_require__) {
	
		var anObject = __webpack_require__(31)
		  , get      = __webpack_require__(35);
		module.exports = __webpack_require__(12).getIterator = function(it){
		  var iterFn = get(it);
		  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
		  return anObject(iterFn.call(it));
		};
	
	/***/ },
	/* 49 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(50), __esModule: true };
	
	/***/ },
	/* 50 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(42);
		__webpack_require__(4);
		module.exports = __webpack_require__(51);
	
	/***/ },
	/* 51 */
	/***/ function(module, exports, __webpack_require__) {
	
		var classof   = __webpack_require__(36)
		  , ITERATOR  = __webpack_require__(20)('iterator')
		  , Iterators = __webpack_require__(23);
		module.exports = __webpack_require__(12).isIterable = function(it){
		  var O = Object(it);
		  return ITERATOR in O || '@@iterator' in O || Iterators.hasOwnProperty(classof(O));
		};
	
	/***/ },
	/* 52 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(53), __esModule: true };
	
	/***/ },
	/* 53 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(4);
		__webpack_require__(42);
		module.exports = __webpack_require__(20)('iterator');
	
	/***/ },
	/* 54 */
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(global) {// This method of obtaining a reference to the global object needs to be
		// kept identical to the way it is obtained in runtime.js
		var g =
		  typeof global === "object" ? global :
		  typeof window === "object" ? window :
		  typeof self === "object" ? self : this;
	
		// Use `getOwnPropertyNames` because not all browsers support calling
		// `hasOwnProperty` on the global `self` object in a worker. See #183.
		var hadRuntime = g.regeneratorRuntime &&
		  Object.getOwnPropertyNames(g).indexOf("regeneratorRuntime") >= 0;
	
		// Save the old regeneratorRuntime in case it needs to be restored later.
		var oldRuntime = hadRuntime && g.regeneratorRuntime;
	
		// Force reevalutation of runtime.js.
		g.regeneratorRuntime = undefined;
	
		module.exports = __webpack_require__(55);
	
		if (hadRuntime) {
		  // Restore the original runtime.
		  g.regeneratorRuntime = oldRuntime;
		} else {
		  // Remove the global property added by runtime.js.
		  try {
		    delete g.regeneratorRuntime;
		  } catch(e) {
		    g.regeneratorRuntime = undefined;
		  }
		}
	
		module.exports = { "default": module.exports, __esModule: true };
	
		/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))
	
	/***/ },
	/* 55 */
	/***/ function(module, exports, __webpack_require__) {
	
		/* WEBPACK VAR INJECTION */(function(global, process) {/**
		 * Copyright (c) 2014, Facebook, Inc.
		 * All rights reserved.
		 *
		 * This source code is licensed under the BSD-style license found in the
		 * https://raw.github.com/facebook/regenerator/master/LICENSE file. An
		 * additional grant of patent rights can be found in the PATENTS file in
		 * the same directory.
		 */
	
		"use strict";
	
		var _Symbol = __webpack_require__(57)["default"];
	
		var _Symbol$iterator = __webpack_require__(52)["default"];
	
		var _Object$create = __webpack_require__(63)["default"];
	
		var _Promise = __webpack_require__(65)["default"];
	
		!(function (global) {
		  "use strict";
	
		  var hasOwn = Object.prototype.hasOwnProperty;
		  var undefined; // More compressible than void 0.
		  var iteratorSymbol = typeof _Symbol === "function" && _Symbol$iterator || "@@iterator";
	
		  var inModule = typeof module === "object";
		  var runtime = global.regeneratorRuntime;
		  if (runtime) {
		    if (inModule) {
		      // If regeneratorRuntime is defined globally and we're in a module,
		      // make the exports object identical to regeneratorRuntime.
		      module.exports = runtime;
		    }
		    // Don't bother evaluating the rest of this file if the runtime was
		    // already defined globally.
		    return;
		  }
	
		  // Define the runtime globally (as expected by generated code) as either
		  // module.exports (if we're in a module) or a new, empty object.
		  runtime = global.regeneratorRuntime = inModule ? module.exports : {};
	
		  function wrap(innerFn, outerFn, self, tryLocsList) {
		    // If outerFn provided, then outerFn.prototype instanceof Generator.
		    var generator = _Object$create((outerFn || Generator).prototype);
	
		    generator._invoke = makeInvokeMethod(innerFn, self || null, new Context(tryLocsList || []));
	
		    return generator;
		  }
		  runtime.wrap = wrap;
	
		  // Try/catch helper to minimize deoptimizations. Returns a completion
		  // record like context.tryEntries[i].completion. This interface could
		  // have been (and was previously) designed to take a closure to be
		  // invoked without arguments, but in all the cases we care about we
		  // already have an existing method we want to call, so there's no need
		  // to create a new function object. We can even get away with assuming
		  // the method takes exactly one argument, since that happens to be true
		  // in every case, so we don't have to touch the arguments object. The
		  // only additional allocation required is the completion record, which
		  // has a stable shape and so hopefully should be cheap to allocate.
		  function tryCatch(fn, obj, arg) {
		    try {
		      return { type: "normal", arg: fn.call(obj, arg) };
		    } catch (err) {
		      return { type: "throw", arg: err };
		    }
		  }
	
		  var GenStateSuspendedStart = "suspendedStart";
		  var GenStateSuspendedYield = "suspendedYield";
		  var GenStateExecuting = "executing";
		  var GenStateCompleted = "completed";
	
		  // Returning this object from the innerFn has the same effect as
		  // breaking out of the dispatch switch statement.
		  var ContinueSentinel = {};
	
		  // Dummy constructor functions that we use as the .constructor and
		  // .constructor.prototype properties for functions that return Generator
		  // objects. For full spec compliance, you may wish to configure your
		  // minifier not to mangle the names of these two functions.
		  function Generator() {}
		  function GeneratorFunction() {}
		  function GeneratorFunctionPrototype() {}
	
		  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
		  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
		  GeneratorFunctionPrototype.constructor = GeneratorFunction;
		  GeneratorFunction.displayName = "GeneratorFunction";
	
		  // Helper for defining the .next, .throw, and .return methods of the
		  // Iterator interface in terms of a single ._invoke method.
		  function defineIteratorMethods(prototype) {
		    ["next", "throw", "return"].forEach(function (method) {
		      prototype[method] = function (arg) {
		        return this._invoke(method, arg);
		      };
		    });
		  }
	
		  runtime.isGeneratorFunction = function (genFun) {
		    var ctor = typeof genFun === "function" && genFun.constructor;
		    return ctor ? ctor === GeneratorFunction ||
		    // For the native GeneratorFunction constructor, the best we can
		    // do is to check its .name property.
		    (ctor.displayName || ctor.name) === "GeneratorFunction" : false;
		  };
	
		  runtime.mark = function (genFun) {
		    genFun.__proto__ = GeneratorFunctionPrototype;
		    genFun.prototype = _Object$create(Gp);
		    return genFun;
		  };
	
		  // Within the body of any async function, `await x` is transformed to
		  // `yield regeneratorRuntime.awrap(x)`, so that the runtime can test
		  // `value instanceof AwaitArgument` to determine if the yielded value is
		  // meant to be awaited. Some may consider the name of this method too
		  // cutesy, but they are curmudgeons.
		  runtime.awrap = function (arg) {
		    return new AwaitArgument(arg);
		  };
	
		  function AwaitArgument(arg) {
		    this.arg = arg;
		  }
	
		  function AsyncIterator(generator) {
		    // This invoke function is written in a style that assumes some
		    // calling function (or Promise) will handle exceptions.
		    function invoke(method, arg) {
		      var result = generator[method](arg);
		      var value = result.value;
		      return value instanceof AwaitArgument ? _Promise.resolve(value.arg).then(invokeNext, invokeThrow) : _Promise.resolve(value).then(function (unwrapped) {
		        // When a yielded Promise is resolved, its final value becomes
		        // the .value of the Promise<{value,done}> result for the
		        // current iteration. If the Promise is rejected, however, the
		        // result for this iteration will be rejected with the same
		        // reason. Note that rejections of yielded Promises are not
		        // thrown back into the generator function, as is the case
		        // when an awaited Promise is rejected. This difference in
		        // behavior between yield and await is important, because it
		        // allows the consumer to decide what to do with the yielded
		        // rejection (swallow it and continue, manually .throw it back
		        // into the generator, abandon iteration, whatever). With
		        // await, by contrast, there is no opportunity to examine the
		        // rejection reason outside the generator function, so the
		        // only option is to throw it from the await expression, and
		        // let the generator function handle the exception.
		        result.value = unwrapped;
		        return result;
		      });
		    }
	
		    if (typeof process === "object" && process.domain) {
		      invoke = process.domain.bind(invoke);
		    }
	
		    var invokeNext = invoke.bind(generator, "next");
		    var invokeThrow = invoke.bind(generator, "throw");
		    var invokeReturn = invoke.bind(generator, "return");
		    var previousPromise;
	
		    function enqueue(method, arg) {
		      var enqueueResult =
		      // If enqueue has been called before, then we want to wait until
		      // all previous Promises have been resolved before calling invoke,
		      // so that results are always delivered in the correct order. If
		      // enqueue has not been called before, then it is important to
		      // call invoke immediately, without waiting on a callback to fire,
		      // so that the async generator function has the opportunity to do
		      // any necessary setup in a predictable way. This predictability
		      // is why the Promise constructor synchronously invokes its
		      // executor callback, and why async functions synchronously
		      // execute code before the first await. Since we implement simple
		      // async functions in terms of async generators, it is especially
		      // important to get this right, even though it requires care.
		      previousPromise ? previousPromise.then(function () {
		        return invoke(method, arg);
		      }) : new _Promise(function (resolve) {
		        resolve(invoke(method, arg));
		      });
	
		      // Avoid propagating enqueueResult failures to Promises returned by
		      // later invocations of the iterator.
		      previousPromise = enqueueResult["catch"](function (ignored) {});
	
		      return enqueueResult;
		    }
	
		    // Define the unified helper method that is used to implement .next,
		    // .throw, and .return (see defineIteratorMethods).
		    this._invoke = enqueue;
		  }
	
		  defineIteratorMethods(AsyncIterator.prototype);
	
		  // Note that simple async functions are implemented on top of
		  // AsyncIterator objects; they just return a Promise for the value of
		  // the final result produced by the iterator.
		  runtime.async = function (innerFn, outerFn, self, tryLocsList) {
		    var iter = new AsyncIterator(wrap(innerFn, outerFn, self, tryLocsList));
	
		    return runtime.isGeneratorFunction(outerFn) ? iter // If outerFn is a generator, return the full iterator.
		    : iter.next().then(function (result) {
		      return result.done ? result.value : iter.next();
		    });
		  };
	
		  function makeInvokeMethod(innerFn, self, context) {
		    var state = GenStateSuspendedStart;
	
		    return function invoke(method, arg) {
		      if (state === GenStateExecuting) {
		        throw new Error("Generator is already running");
		      }
	
		      if (state === GenStateCompleted) {
		        if (method === "throw") {
		          throw arg;
		        }
	
		        // Be forgiving, per 25.3.3.3.3 of the spec:
		        // https://people.mozilla.org/~jorendorff/es6-draft.html#sec-generatorresume
		        return doneResult();
		      }
	
		      while (true) {
		        var delegate = context.delegate;
		        if (delegate) {
		          if (method === "return" || method === "throw" && delegate.iterator[method] === undefined) {
		            // A return or throw (when the delegate iterator has no throw
		            // method) always terminates the yield* loop.
		            context.delegate = null;
	
		            // If the delegate iterator has a return method, give it a
		            // chance to clean up.
		            var returnMethod = delegate.iterator["return"];
		            if (returnMethod) {
		              var record = tryCatch(returnMethod, delegate.iterator, arg);
		              if (record.type === "throw") {
		                // If the return method threw an exception, let that
		                // exception prevail over the original return or throw.
		                method = "throw";
		                arg = record.arg;
		                continue;
		              }
		            }
	
		            if (method === "return") {
		              // Continue with the outer return, now that the delegate
		              // iterator has been terminated.
		              continue;
		            }
		          }
	
		          var record = tryCatch(delegate.iterator[method], delegate.iterator, arg);
	
		          if (record.type === "throw") {
		            context.delegate = null;
	
		            // Like returning generator.throw(uncaught), but without the
		            // overhead of an extra function call.
		            method = "throw";
		            arg = record.arg;
		            continue;
		          }
	
		          // Delegate generator ran and handled its own exceptions so
		          // regardless of what the method was, we continue as if it is
		          // "next" with an undefined arg.
		          method = "next";
		          arg = undefined;
	
		          var info = record.arg;
		          if (info.done) {
		            context[delegate.resultName] = info.value;
		            context.next = delegate.nextLoc;
		          } else {
		            state = GenStateSuspendedYield;
		            return info;
		          }
	
		          context.delegate = null;
		        }
	
		        if (method === "next") {
		          if (state === GenStateSuspendedYield) {
		            context.sent = arg;
		          } else {
		            context.sent = undefined;
		          }
		        } else if (method === "throw") {
		          if (state === GenStateSuspendedStart) {
		            state = GenStateCompleted;
		            throw arg;
		          }
	
		          if (context.dispatchException(arg)) {
		            // If the dispatched exception was caught by a catch block,
		            // then let that catch block handle the exception normally.
		            method = "next";
		            arg = undefined;
		          }
		        } else if (method === "return") {
		          context.abrupt("return", arg);
		        }
	
		        state = GenStateExecuting;
	
		        var record = tryCatch(innerFn, self, context);
		        if (record.type === "normal") {
		          // If an exception is thrown from innerFn, we leave state ===
		          // GenStateExecuting and loop back for another invocation.
		          state = context.done ? GenStateCompleted : GenStateSuspendedYield;
	
		          var info = {
		            value: record.arg,
		            done: context.done
		          };
	
		          if (record.arg === ContinueSentinel) {
		            if (context.delegate && method === "next") {
		              // Deliberately forget the last sent value so that we don't
		              // accidentally pass it on to the delegate.
		              arg = undefined;
		            }
		          } else {
		            return info;
		          }
		        } else if (record.type === "throw") {
		          state = GenStateCompleted;
		          // Dispatch the exception by looping back around to the
		          // context.dispatchException(arg) call above.
		          method = "throw";
		          arg = record.arg;
		        }
		      }
		    };
		  }
	
		  // Define Generator.prototype.{next,throw,return} in terms of the
		  // unified ._invoke helper method.
		  defineIteratorMethods(Gp);
	
		  Gp[iteratorSymbol] = function () {
		    return this;
		  };
	
		  Gp.toString = function () {
		    return "[object Generator]";
		  };
	
		  function pushTryEntry(locs) {
		    var entry = { tryLoc: locs[0] };
	
		    if (1 in locs) {
		      entry.catchLoc = locs[1];
		    }
	
		    if (2 in locs) {
		      entry.finallyLoc = locs[2];
		      entry.afterLoc = locs[3];
		    }
	
		    this.tryEntries.push(entry);
		  }
	
		  function resetTryEntry(entry) {
		    var record = entry.completion || {};
		    record.type = "normal";
		    delete record.arg;
		    entry.completion = record;
		  }
	
		  function Context(tryLocsList) {
		    // The root entry object (effectively a try statement without a catch
		    // or a finally block) gives us a place to store values thrown from
		    // locations where there is no enclosing try statement.
		    this.tryEntries = [{ tryLoc: "root" }];
		    tryLocsList.forEach(pushTryEntry, this);
		    this.reset(true);
		  }
	
		  runtime.keys = function (object) {
		    var keys = [];
		    for (var key in object) {
		      keys.push(key);
		    }
		    keys.reverse();
	
		    // Rather than returning an object with a next method, we keep
		    // things simple and return the next function itself.
		    return function next() {
		      while (keys.length) {
		        var key = keys.pop();
		        if (key in object) {
		          next.value = key;
		          next.done = false;
		          return next;
		        }
		      }
	
		      // To avoid creating an additional object, we just hang the .value
		      // and .done properties off the next function object itself. This
		      // also ensures that the minifier will not anonymize the function.
		      next.done = true;
		      return next;
		    };
		  };
	
		  function values(iterable) {
		    if (iterable) {
		      var iteratorMethod = iterable[iteratorSymbol];
		      if (iteratorMethod) {
		        return iteratorMethod.call(iterable);
		      }
	
		      if (typeof iterable.next === "function") {
		        return iterable;
		      }
	
		      if (!isNaN(iterable.length)) {
		        var i = -1,
		            next = function next() {
		          while (++i < iterable.length) {
		            if (hasOwn.call(iterable, i)) {
		              next.value = iterable[i];
		              next.done = false;
		              return next;
		            }
		          }
	
		          next.value = undefined;
		          next.done = true;
	
		          return next;
		        };
	
		        return next.next = next;
		      }
		    }
	
		    // Return an iterator with no values.
		    return { next: doneResult };
		  }
		  runtime.values = values;
	
		  function doneResult() {
		    return { value: undefined, done: true };
		  }
	
		  Context.prototype = {
		    constructor: Context,
	
		    reset: function reset(skipTempReset) {
		      this.prev = 0;
		      this.next = 0;
		      this.sent = undefined;
		      this.done = false;
		      this.delegate = null;
	
		      this.tryEntries.forEach(resetTryEntry);
	
		      if (!skipTempReset) {
		        for (var name in this) {
		          // Not sure about the optimal order of these conditions:
		          if (name.charAt(0) === "t" && hasOwn.call(this, name) && !isNaN(+name.slice(1))) {
		            this[name] = undefined;
		          }
		        }
		      }
		    },
	
		    stop: function stop() {
		      this.done = true;
	
		      var rootEntry = this.tryEntries[0];
		      var rootRecord = rootEntry.completion;
		      if (rootRecord.type === "throw") {
		        throw rootRecord.arg;
		      }
	
		      return this.rval;
		    },
	
		    dispatchException: function dispatchException(exception) {
		      if (this.done) {
		        throw exception;
		      }
	
		      var context = this;
		      function handle(loc, caught) {
		        record.type = "throw";
		        record.arg = exception;
		        context.next = loc;
		        return !!caught;
		      }
	
		      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
		        var entry = this.tryEntries[i];
		        var record = entry.completion;
	
		        if (entry.tryLoc === "root") {
		          // Exception thrown outside of any try block that could handle
		          // it, so set the completion value of the entire function to
		          // throw the exception.
		          return handle("end");
		        }
	
		        if (entry.tryLoc <= this.prev) {
		          var hasCatch = hasOwn.call(entry, "catchLoc");
		          var hasFinally = hasOwn.call(entry, "finallyLoc");
	
		          if (hasCatch && hasFinally) {
		            if (this.prev < entry.catchLoc) {
		              return handle(entry.catchLoc, true);
		            } else if (this.prev < entry.finallyLoc) {
		              return handle(entry.finallyLoc);
		            }
		          } else if (hasCatch) {
		            if (this.prev < entry.catchLoc) {
		              return handle(entry.catchLoc, true);
		            }
		          } else if (hasFinally) {
		            if (this.prev < entry.finallyLoc) {
		              return handle(entry.finallyLoc);
		            }
		          } else {
		            throw new Error("try statement without catch or finally");
		          }
		        }
		      }
		    },
	
		    abrupt: function abrupt(type, arg) {
		      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
		        var entry = this.tryEntries[i];
		        if (entry.tryLoc <= this.prev && hasOwn.call(entry, "finallyLoc") && this.prev < entry.finallyLoc) {
		          var finallyEntry = entry;
		          break;
		        }
		      }
	
		      if (finallyEntry && (type === "break" || type === "continue") && finallyEntry.tryLoc <= arg && arg <= finallyEntry.finallyLoc) {
		        // Ignore the finally entry if control is not jumping to a
		        // location outside the try/catch block.
		        finallyEntry = null;
		      }
	
		      var record = finallyEntry ? finallyEntry.completion : {};
		      record.type = type;
		      record.arg = arg;
	
		      if (finallyEntry) {
		        this.next = finallyEntry.finallyLoc;
		      } else {
		        this.complete(record);
		      }
	
		      return ContinueSentinel;
		    },
	
		    complete: function complete(record, afterLoc) {
		      if (record.type === "throw") {
		        throw record.arg;
		      }
	
		      if (record.type === "break" || record.type === "continue") {
		        this.next = record.arg;
		      } else if (record.type === "return") {
		        this.rval = record.arg;
		        this.next = "end";
		      } else if (record.type === "normal" && afterLoc) {
		        this.next = afterLoc;
		      }
		    },
	
		    finish: function finish(finallyLoc) {
		      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
		        var entry = this.tryEntries[i];
		        if (entry.finallyLoc === finallyLoc) {
		          this.complete(entry.completion, entry.afterLoc);
		          resetTryEntry(entry);
		          return ContinueSentinel;
		        }
		      }
		    },
	
		    "catch": function _catch(tryLoc) {
		      for (var i = this.tryEntries.length - 1; i >= 0; --i) {
		        var entry = this.tryEntries[i];
		        if (entry.tryLoc === tryLoc) {
		          var record = entry.completion;
		          if (record.type === "throw") {
		            var thrown = record.arg;
		            resetTryEntry(entry);
		          }
		          return thrown;
		        }
		      }
	
		      // The context.catch method must only be called with a location
		      // argument that corresponds to a known catch block.
		      throw new Error("illegal catch attempt");
		    },
	
		    delegateYield: function delegateYield(iterable, resultName, nextLoc) {
		      this.delegate = {
		        iterator: values(iterable),
		        resultName: resultName,
		        nextLoc: nextLoc
		      };
	
		      return ContinueSentinel;
		    }
		  };
		})(
		// Among the various tricks for obtaining a reference to the global
		// object, this seems to be the most reliable technique that does not
		// use indirect eval (which violates Content Security Policy).
		typeof global === "object" ? global : typeof window === "object" ? window : typeof self === "object" ? self : undefined);
		/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(56)))
	
	/***/ },
	/* 56 */
	/***/ function(module, exports) {
	
		// shim for using process in browser
	
		var process = module.exports = {};
		var queue = [];
		var draining = false;
		var currentQueue;
		var queueIndex = -1;
	
		function cleanUpNextTick() {
		    draining = false;
		    if (currentQueue.length) {
		        queue = currentQueue.concat(queue);
		    } else {
		        queueIndex = -1;
		    }
		    if (queue.length) {
		        drainQueue();
		    }
		}
	
		function drainQueue() {
		    if (draining) {
		        return;
		    }
		    var timeout = setTimeout(cleanUpNextTick);
		    draining = true;
	
		    var len = queue.length;
		    while(len) {
		        currentQueue = queue;
		        queue = [];
		        while (++queueIndex < len) {
		            if (currentQueue) {
		                currentQueue[queueIndex].run();
		            }
		        }
		        queueIndex = -1;
		        len = queue.length;
		    }
		    currentQueue = null;
		    draining = false;
		    clearTimeout(timeout);
		}
	
		process.nextTick = function (fun) {
		    var args = new Array(arguments.length - 1);
		    if (arguments.length > 1) {
		        for (var i = 1; i < arguments.length; i++) {
		            args[i - 1] = arguments[i];
		        }
		    }
		    queue.push(new Item(fun, args));
		    if (queue.length === 1 && !draining) {
		        setTimeout(drainQueue, 0);
		    }
		};
	
		// v8 likes predictible objects
		function Item(fun, array) {
		    this.fun = fun;
		    this.array = array;
		}
		Item.prototype.run = function () {
		    this.fun.apply(null, this.array);
		};
		process.title = 'browser';
		process.browser = true;
		process.env = {};
		process.argv = [];
		process.version = ''; // empty string to avoid regexp issues
		process.versions = {};
	
		function noop() {}
	
		process.on = noop;
		process.addListener = noop;
		process.once = noop;
		process.off = noop;
		process.removeListener = noop;
		process.removeAllListeners = noop;
		process.emit = noop;
	
		process.binding = function (name) {
		    throw new Error('process.binding is not supported');
		};
	
		process.cwd = function () { return '/' };
		process.chdir = function (dir) {
		    throw new Error('process.chdir is not supported');
		};
		process.umask = function() { return 0; };
	
	
	/***/ },
	/* 57 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(58), __esModule: true };
	
	/***/ },
	/* 58 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(59);
		module.exports = __webpack_require__(12).Symbol;
	
	/***/ },
	/* 59 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		// ECMAScript 6 symbols shim
		var $              = __webpack_require__(15)
		  , global         = __webpack_require__(11)
		  , has            = __webpack_require__(19)
		  , SUPPORT_DESC   = __webpack_require__(17)
		  , $def           = __webpack_require__(10)
		  , $redef         = __webpack_require__(13)
		  , $fails         = __webpack_require__(18)
		  , shared         = __webpack_require__(21)
		  , setTag         = __webpack_require__(25)
		  , uid            = __webpack_require__(22)
		  , wks            = __webpack_require__(20)
		  , keyOf          = __webpack_require__(60)
		  , $names         = __webpack_require__(61)
		  , enumKeys       = __webpack_require__(62)
		  , isObject       = __webpack_require__(32)
		  , anObject       = __webpack_require__(31)
		  , toIObject      = __webpack_require__(46)
		  , createDesc     = __webpack_require__(16)
		  , getDesc        = $.getDesc
		  , setDesc        = $.setDesc
		  , _create        = $.create
		  , getNames       = $names.get
		  , $Symbol        = global.Symbol
		  , setter         = false
		  , HIDDEN         = wks('_hidden')
		  , isEnum         = $.isEnum
		  , SymbolRegistry = shared('symbol-registry')
		  , AllSymbols     = shared('symbols')
		  , useNative      = typeof $Symbol == 'function'
		  , ObjectProto    = Object.prototype;
	
		// fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
		var setSymbolDesc = SUPPORT_DESC && $fails(function(){
		  return _create(setDesc({}, 'a', {
		    get: function(){ return setDesc(this, 'a', {value: 7}).a; }
		  })).a != 7;
		}) ? function(it, key, D){
		  var protoDesc = getDesc(ObjectProto, key);
		  if(protoDesc)delete ObjectProto[key];
		  setDesc(it, key, D);
		  if(protoDesc && it !== ObjectProto)setDesc(ObjectProto, key, protoDesc);
		} : setDesc;
	
		var wrap = function(tag){
		  var sym = AllSymbols[tag] = _create($Symbol.prototype);
		  sym._k = tag;
		  SUPPORT_DESC && setter && setSymbolDesc(ObjectProto, tag, {
		    configurable: true,
		    set: function(value){
		      if(has(this, HIDDEN) && has(this[HIDDEN], tag))this[HIDDEN][tag] = false;
		      setSymbolDesc(this, tag, createDesc(1, value));
		    }
		  });
		  return sym;
		};
	
		var $defineProperty = function defineProperty(it, key, D){
		  if(D && has(AllSymbols, key)){
		    if(!D.enumerable){
		      if(!has(it, HIDDEN))setDesc(it, HIDDEN, createDesc(1, {}));
		      it[HIDDEN][key] = true;
		    } else {
		      if(has(it, HIDDEN) && it[HIDDEN][key])it[HIDDEN][key] = false;
		      D = _create(D, {enumerable: createDesc(0, false)});
		    } return setSymbolDesc(it, key, D);
		  } return setDesc(it, key, D);
		};
		var $defineProperties = function defineProperties(it, P){
		  anObject(it);
		  var keys = enumKeys(P = toIObject(P))
		    , i    = 0
		    , l = keys.length
		    , key;
		  while(l > i)$defineProperty(it, key = keys[i++], P[key]);
		  return it;
		};
		var $create = function create(it, P){
		  return P === undefined ? _create(it) : $defineProperties(_create(it), P);
		};
		var $propertyIsEnumerable = function propertyIsEnumerable(key){
		  var E = isEnum.call(this, key);
		  return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key]
		    ? E : true;
		};
		var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key){
		  var D = getDesc(it = toIObject(it), key);
		  if(D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key]))D.enumerable = true;
		  return D;
		};
		var $getOwnPropertyNames = function getOwnPropertyNames(it){
		  var names  = getNames(toIObject(it))
		    , result = []
		    , i      = 0
		    , key;
		  while(names.length > i)if(!has(AllSymbols, key = names[i++]) && key != HIDDEN)result.push(key);
		  return result;
		};
		var $getOwnPropertySymbols = function getOwnPropertySymbols(it){
		  var names  = getNames(toIObject(it))
		    , result = []
		    , i      = 0
		    , key;
		  while(names.length > i)if(has(AllSymbols, key = names[i++]))result.push(AllSymbols[key]);
		  return result;
		};
	
		// 19.4.1.1 Symbol([description])
		if(!useNative){
		  $Symbol = function Symbol(){
		    if(this instanceof $Symbol)throw TypeError('Symbol is not a constructor');
		    return wrap(uid(arguments[0]));
		  };
		  $redef($Symbol.prototype, 'toString', function toString(){
		    return this._k;
		  });
	
		  $.create     = $create;
		  $.isEnum     = $propertyIsEnumerable;
		  $.getDesc    = $getOwnPropertyDescriptor;
		  $.setDesc    = $defineProperty;
		  $.setDescs   = $defineProperties;
		  $.getNames   = $names.get = $getOwnPropertyNames;
		  $.getSymbols = $getOwnPropertySymbols;
	
		  if(SUPPORT_DESC && !__webpack_require__(9)){
		    $redef(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
		  }
		}
	
		// MS Edge converts symbol values to JSON as {}
		if(!useNative || $fails(function(){
		  return JSON.stringify([$Symbol()]) != '[null]';
		}))$redef($Symbol.prototype, 'toJSON', function toJSON(){
		  if(useNative && isObject(this))return this;
		});
	
		var symbolStatics = {
		  // 19.4.2.1 Symbol.for(key)
		  'for': function(key){
		    return has(SymbolRegistry, key += '')
		      ? SymbolRegistry[key]
		      : SymbolRegistry[key] = $Symbol(key);
		  },
		  // 19.4.2.5 Symbol.keyFor(sym)
		  keyFor: function keyFor(key){
		    return keyOf(SymbolRegistry, key);
		  },
		  useSetter: function(){ setter = true; },
		  useSimple: function(){ setter = false; }
		};
		// 19.4.2.2 Symbol.hasInstance
		// 19.4.2.3 Symbol.isConcatSpreadable
		// 19.4.2.4 Symbol.iterator
		// 19.4.2.6 Symbol.match
		// 19.4.2.8 Symbol.replace
		// 19.4.2.9 Symbol.search
		// 19.4.2.10 Symbol.species
		// 19.4.2.11 Symbol.split
		// 19.4.2.12 Symbol.toPrimitive
		// 19.4.2.13 Symbol.toStringTag
		// 19.4.2.14 Symbol.unscopables
		$.each.call((
		    'hasInstance,isConcatSpreadable,iterator,match,replace,search,' +
		    'species,split,toPrimitive,toStringTag,unscopables'
		  ).split(','), function(it){
		    var sym = wks(it);
		    symbolStatics[it] = useNative ? sym : wrap(sym);
		  }
		);
	
		setter = true;
	
		$def($def.G + $def.W, {Symbol: $Symbol});
	
		$def($def.S, 'Symbol', symbolStatics);
	
		$def($def.S + $def.F * !useNative, 'Object', {
		  // 19.1.2.2 Object.create(O [, Properties])
		  create: $create,
		  // 19.1.2.4 Object.defineProperty(O, P, Attributes)
		  defineProperty: $defineProperty,
		  // 19.1.2.3 Object.defineProperties(O, Properties)
		  defineProperties: $defineProperties,
		  // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
		  getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
		  // 19.1.2.7 Object.getOwnPropertyNames(O)
		  getOwnPropertyNames: $getOwnPropertyNames,
		  // 19.1.2.8 Object.getOwnPropertySymbols(O)
		  getOwnPropertySymbols: $getOwnPropertySymbols
		});
	
		// 19.4.3.5 Symbol.prototype[@@toStringTag]
		setTag($Symbol, 'Symbol');
		// 20.2.1.9 Math[@@toStringTag]
		setTag(Math, 'Math', true);
		// 24.3.3 JSON[@@toStringTag]
		setTag(global.JSON, 'JSON', true);
	
	/***/ },
	/* 60 */
	/***/ function(module, exports, __webpack_require__) {
	
		var $         = __webpack_require__(15)
		  , toIObject = __webpack_require__(46);
		module.exports = function(object, el){
		  var O      = toIObject(object)
		    , keys   = $.getKeys(O)
		    , length = keys.length
		    , index  = 0
		    , key;
		  while(length > index)if(O[key = keys[index++]] === el)return key;
		};
	
	/***/ },
	/* 61 */
	/***/ function(module, exports, __webpack_require__) {
	
		// fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
		var toString  = {}.toString
		  , toIObject = __webpack_require__(46)
		  , getNames  = __webpack_require__(15).getNames;
	
		var windowNames = typeof window == 'object' && Object.getOwnPropertyNames
		  ? Object.getOwnPropertyNames(window) : [];
	
		var getWindowNames = function(it){
		  try {
		    return getNames(it);
		  } catch(e){
		    return windowNames.slice();
		  }
		};
	
		module.exports.get = function getOwnPropertyNames(it){
		  if(windowNames && toString.call(it) == '[object Window]')return getWindowNames(it);
		  return getNames(toIObject(it));
		};
	
	/***/ },
	/* 62 */
	/***/ function(module, exports, __webpack_require__) {
	
		// all enumerable object keys, includes symbols
		var $ = __webpack_require__(15);
		module.exports = function(it){
		  var keys       = $.getKeys(it)
		    , getSymbols = $.getSymbols;
		  if(getSymbols){
		    var symbols = getSymbols(it)
		      , isEnum  = $.isEnum
		      , i       = 0
		      , key;
		    while(symbols.length > i)if(isEnum.call(it, key = symbols[i++]))keys.push(key);
		  }
		  return keys;
		};
	
	/***/ },
	/* 63 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(64), __esModule: true };
	
	/***/ },
	/* 64 */
	/***/ function(module, exports, __webpack_require__) {
	
		var $ = __webpack_require__(15);
		module.exports = function create(P, D){
		  return $.create(P, D);
		};
	
	/***/ },
	/* 65 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(66), __esModule: true };
	
	/***/ },
	/* 66 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(67);
		__webpack_require__(4);
		__webpack_require__(42);
		__webpack_require__(68);
		module.exports = __webpack_require__(12).Promise;
	
	/***/ },
	/* 67 */
	/***/ function(module, exports) {
	
		
	
	/***/ },
	/* 68 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var $          = __webpack_require__(15)
		  , LIBRARY    = __webpack_require__(9)
		  , global     = __webpack_require__(11)
		  , ctx        = __webpack_require__(27)
		  , classof    = __webpack_require__(36)
		  , $def       = __webpack_require__(10)
		  , isObject   = __webpack_require__(32)
		  , anObject   = __webpack_require__(31)
		  , aFunction  = __webpack_require__(28)
		  , strictNew  = __webpack_require__(69)
		  , forOf      = __webpack_require__(70)
		  , setProto   = __webpack_require__(71).set
		  , same       = __webpack_require__(72)
		  , species    = __webpack_require__(73)
		  , SPECIES    = __webpack_require__(20)('species')
		  , RECORD     = __webpack_require__(22)('record')
		  , asap       = __webpack_require__(74)
		  , PROMISE    = 'Promise'
		  , process    = global.process
		  , isNode     = classof(process) == 'process'
		  , P          = global[PROMISE]
		  , Wrapper;
	
		var testResolve = function(sub){
		  var test = new P(function(){});
		  if(sub)test.constructor = Object;
		  return P.resolve(test) === test;
		};
	
		var useNative = function(){
		  var works = false;
		  function P2(x){
		    var self = new P(x);
		    setProto(self, P2.prototype);
		    return self;
		  }
		  try {
		    works = P && P.resolve && testResolve();
		    setProto(P2, P);
		    P2.prototype = $.create(P.prototype, {constructor: {value: P2}});
		    // actual Firefox has broken subclass support, test that
		    if(!(P2.resolve(5).then(function(){}) instanceof P2)){
		      works = false;
		    }
		    // actual V8 bug, https://code.google.com/p/v8/issues/detail?id=4162
		    if(works && __webpack_require__(17)){
		      var thenableThenGotten = false;
		      P.resolve($.setDesc({}, 'then', {
		        get: function(){ thenableThenGotten = true; }
		      }));
		      works = thenableThenGotten;
		    }
		  } catch(e){ works = false; }
		  return works;
		}();
	
		// helpers
		var isPromise = function(it){
		  return isObject(it) && (useNative ? classof(it) == 'Promise' : RECORD in it);
		};
		var sameConstructor = function(a, b){
		  // library wrapper special case
		  if(LIBRARY && a === P && b === Wrapper)return true;
		  return same(a, b);
		};
		var getConstructor = function(C){
		  var S = anObject(C)[SPECIES];
		  return S != undefined ? S : C;
		};
		var isThenable = function(it){
		  var then;
		  return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
		};
		var notify = function(record, isReject){
		  if(record.n)return;
		  record.n = true;
		  var chain = record.c;
		  asap(function(){
		    var value = record.v
		      , ok    = record.s == 1
		      , i     = 0;
		    var run = function(react){
		      var cb = ok ? react.ok : react.fail
		        , ret, then;
		      try {
		        if(cb){
		          if(!ok)record.h = true;
		          ret = cb === true ? value : cb(value);
		          if(ret === react.P){
		            react.rej(TypeError('Promise-chain cycle'));
		          } else if(then = isThenable(ret)){
		            then.call(ret, react.res, react.rej);
		          } else react.res(ret);
		        } else react.rej(value);
		      } catch(err){
		        react.rej(err);
		      }
		    };
		    while(chain.length > i)run(chain[i++]); // variable length - can't use forEach
		    chain.length = 0;
		    record.n = false;
		    if(isReject)setTimeout(function(){
		      var promise = record.p
		        , handler, console;
		      if(isUnhandled(promise)){
		        if(isNode){
		          process.emit('unhandledRejection', value, promise);
		        } else if(handler = global.onunhandledrejection){
		          handler({promise: promise, reason: value});
		        } else if((console = global.console) && console.error){
		          console.error('Unhandled promise rejection', value);
		        }
		      } record.a = undefined;
		    }, 1);
		  });
		};
		var isUnhandled = function(promise){
		  var record = promise[RECORD]
		    , chain  = record.a || record.c
		    , i      = 0
		    , react;
		  if(record.h)return false;
		  while(chain.length > i){
		    react = chain[i++];
		    if(react.fail || !isUnhandled(react.P))return false;
		  } return true;
		};
		var $reject = function(value){
		  var record = this;
		  if(record.d)return;
		  record.d = true;
		  record = record.r || record; // unwrap
		  record.v = value;
		  record.s = 2;
		  record.a = record.c.slice();
		  notify(record, true);
		};
		var $resolve = function(value){
		  var record = this
		    , then;
		  if(record.d)return;
		  record.d = true;
		  record = record.r || record; // unwrap
		  try {
		    if(then = isThenable(value)){
		      asap(function(){
		        var wrapper = {r: record, d: false}; // wrap
		        try {
		          then.call(value, ctx($resolve, wrapper, 1), ctx($reject, wrapper, 1));
		        } catch(e){
		          $reject.call(wrapper, e);
		        }
		      });
		    } else {
		      record.v = value;
		      record.s = 1;
		      notify(record, false);
		    }
		  } catch(e){
		    $reject.call({r: record, d: false}, e); // wrap
		  }
		};
	
		// constructor polyfill
		if(!useNative){
		  // 25.4.3.1 Promise(executor)
		  P = function Promise(executor){
		    aFunction(executor);
		    var record = {
		      p: strictNew(this, P, PROMISE),         // <- promise
		      c: [],                                  // <- awaiting reactions
		      a: undefined,                           // <- checked in isUnhandled reactions
		      s: 0,                                   // <- state
		      d: false,                               // <- done
		      v: undefined,                           // <- value
		      h: false,                               // <- handled rejection
		      n: false                                // <- notify
		    };
		    this[RECORD] = record;
		    try {
		      executor(ctx($resolve, record, 1), ctx($reject, record, 1));
		    } catch(err){
		      $reject.call(record, err);
		    }
		  };
		  __webpack_require__(79)(P.prototype, {
		    // 25.4.5.3 Promise.prototype.then(onFulfilled, onRejected)
		    then: function then(onFulfilled, onRejected){
		      var S = anObject(anObject(this).constructor)[SPECIES];
		      var react = {
		        ok:   typeof onFulfilled == 'function' ? onFulfilled : true,
		        fail: typeof onRejected == 'function'  ? onRejected  : false
		      };
		      var promise = react.P = new (S != undefined ? S : P)(function(res, rej){
		        react.res = res;
		        react.rej = rej;
		      });
		      aFunction(react.res);
		      aFunction(react.rej);
		      var record = this[RECORD];
		      record.c.push(react);
		      if(record.a)record.a.push(react);
		      if(record.s)notify(record, false);
		      return promise;
		    },
		    // 25.4.5.1 Promise.prototype.catch(onRejected)
		    'catch': function(onRejected){
		      return this.then(undefined, onRejected);
		    }
		  });
		}
	
		// export
		$def($def.G + $def.W + $def.F * !useNative, {Promise: P});
		__webpack_require__(25)(P, PROMISE);
		species(P);
		species(Wrapper = __webpack_require__(12)[PROMISE]);
	
		// statics
		$def($def.S + $def.F * !useNative, PROMISE, {
		  // 25.4.4.5 Promise.reject(r)
		  reject: function reject(r){
		    return new this(function(res, rej){ rej(r); });
		  }
		});
		$def($def.S + $def.F * (!useNative || testResolve(true)), PROMISE, {
		  // 25.4.4.6 Promise.resolve(x)
		  resolve: function resolve(x){
		    return isPromise(x) && sameConstructor(x.constructor, this)
		      ? x : new this(function(res){ res(x); });
		  }
		});
		$def($def.S + $def.F * !(useNative && __webpack_require__(38)(function(iter){
		  P.all(iter)['catch'](function(){});
		})), PROMISE, {
		  // 25.4.4.1 Promise.all(iterable)
		  all: function all(iterable){
		    var C      = getConstructor(this)
		      , values = [];
		    return new C(function(res, rej){
		      forOf(iterable, false, values.push, values);
		      var remaining = values.length
		        , results   = Array(remaining);
		      if(remaining)$.each.call(values, function(promise, index){
		        C.resolve(promise).then(function(value){
		          results[index] = value;
		          --remaining || res(results);
		        }, rej);
		      });
		      else res(results);
		    });
		  },
		  // 25.4.4.4 Promise.race(iterable)
		  race: function race(iterable){
		    var C = getConstructor(this);
		    return new C(function(res, rej){
		      forOf(iterable, false, function(promise){
		        C.resolve(promise).then(res, rej);
		      });
		    });
		  }
		});
	
	/***/ },
	/* 69 */
	/***/ function(module, exports) {
	
		module.exports = function(it, Constructor, name){
		  if(!(it instanceof Constructor))throw TypeError(name + ": use the 'new' operator!");
		  return it;
		};
	
	/***/ },
	/* 70 */
	/***/ function(module, exports, __webpack_require__) {
	
		var ctx         = __webpack_require__(27)
		  , call        = __webpack_require__(30)
		  , isArrayIter = __webpack_require__(33)
		  , anObject    = __webpack_require__(31)
		  , toLength    = __webpack_require__(34)
		  , getIterFn   = __webpack_require__(35);
		module.exports = function(iterable, entries, fn, that){
		  var iterFn = getIterFn(iterable)
		    , f      = ctx(fn, that, entries ? 2 : 1)
		    , index  = 0
		    , length, step, iterator;
		  if(typeof iterFn != 'function')throw TypeError(iterable + ' is not iterable!');
		  // fast case for arrays with default iterator
		  if(isArrayIter(iterFn))for(length = toLength(iterable.length); length > index; index++){
		    entries ? f(anObject(step = iterable[index])[0], step[1]) : f(iterable[index]);
		  } else for(iterator = iterFn.call(iterable); !(step = iterator.next()).done; ){
		    call(iterator, f, step.value, entries);
		  }
		};
	
	/***/ },
	/* 71 */
	/***/ function(module, exports, __webpack_require__) {
	
		// Works with __proto__ only. Old v8 can't work with null proto objects.
		/* eslint-disable no-proto */
		var getDesc  = __webpack_require__(15).getDesc
		  , isObject = __webpack_require__(32)
		  , anObject = __webpack_require__(31);
		var check = function(O, proto){
		  anObject(O);
		  if(!isObject(proto) && proto !== null)throw TypeError(proto + ": can't set as prototype!");
		};
		module.exports = {
		  set: Object.setPrototypeOf || ('__proto__' in {} ? // eslint-disable-line no-proto
		    function(test, buggy, set){
		      try {
		        set = __webpack_require__(27)(Function.call, getDesc(Object.prototype, '__proto__').set, 2);
		        set(test, []);
		        buggy = !(test instanceof Array);
		      } catch(e){ buggy = true; }
		      return function setPrototypeOf(O, proto){
		        check(O, proto);
		        if(buggy)O.__proto__ = proto;
		        else set(O, proto);
		        return O;
		      };
		    }({}, false) : undefined),
		  check: check
		};
	
	/***/ },
	/* 72 */
	/***/ function(module, exports) {
	
		module.exports = Object.is || function is(x, y){
		  return x === y ? x !== 0 || 1 / x === 1 / y : x != x && y != y;
		};
	
	/***/ },
	/* 73 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var $       = __webpack_require__(15)
		  , SPECIES = __webpack_require__(20)('species');
		module.exports = function(C){
		  if(__webpack_require__(17) && !(SPECIES in C))$.setDesc(C, SPECIES, {
		    configurable: true,
		    get: function(){ return this; }
		  });
		};
	
	/***/ },
	/* 74 */
	/***/ function(module, exports, __webpack_require__) {
	
		var global    = __webpack_require__(11)
		  , macrotask = __webpack_require__(75).set
		  , Observer  = global.MutationObserver || global.WebKitMutationObserver
		  , process   = global.process
		  , isNode    = __webpack_require__(37)(process) == 'process'
		  , head, last, notify;
	
		var flush = function(){
		  var parent, domain;
		  if(isNode && (parent = process.domain)){
		    process.domain = null;
		    parent.exit();
		  }
		  while(head){
		    domain = head.domain;
		    if(domain)domain.enter();
		    head.fn.call(); // <- currently we use it only for Promise - try / catch not required
		    if(domain)domain.exit();
		    head = head.next;
		  } last = undefined;
		  if(parent)parent.enter();
		}
	
		// Node.js
		if(isNode){
		  notify = function(){
		    process.nextTick(flush);
		  };
		// browsers with MutationObserver
		} else if(Observer){
		  var toggle = 1
		    , node   = document.createTextNode('');
		  new Observer(flush).observe(node, {characterData: true}); // eslint-disable-line no-new
		  notify = function(){
		    node.data = toggle = -toggle;
		  };
		// for other environments - macrotask based on:
		// - setImmediate
		// - MessageChannel
		// - window.postMessag
		// - onreadystatechange
		// - setTimeout
		} else {
		  notify = function(){
		    // strange IE + webpack dev server bug - use .call(global)
		    macrotask.call(global, flush);
		  };
		}
	
		module.exports = function asap(fn){
		  var task = {fn: fn, next: undefined, domain: isNode && process.domain};
		  if(last)last.next = task;
		  if(!head){
		    head = task;
		    notify();
		  } last = task;
		};
	
	/***/ },
	/* 75 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var ctx                = __webpack_require__(27)
		  , invoke             = __webpack_require__(76)
		  , html               = __webpack_require__(77)
		  , cel                = __webpack_require__(78)
		  , global             = __webpack_require__(11)
		  , process            = global.process
		  , setTask            = global.setImmediate
		  , clearTask          = global.clearImmediate
		  , MessageChannel     = global.MessageChannel
		  , counter            = 0
		  , queue              = {}
		  , ONREADYSTATECHANGE = 'onreadystatechange'
		  , defer, channel, port;
		var run = function(){
		  var id = +this;
		  if(queue.hasOwnProperty(id)){
		    var fn = queue[id];
		    delete queue[id];
		    fn();
		  }
		};
		var listner = function(event){
		  run.call(event.data);
		};
		// Node.js 0.9+ & IE10+ has setImmediate, otherwise:
		if(!setTask || !clearTask){
		  setTask = function setImmediate(fn){
		    var args = [], i = 1;
		    while(arguments.length > i)args.push(arguments[i++]);
		    queue[++counter] = function(){
		      invoke(typeof fn == 'function' ? fn : Function(fn), args);
		    };
		    defer(counter);
		    return counter;
		  };
		  clearTask = function clearImmediate(id){
		    delete queue[id];
		  };
		  // Node.js 0.8-
		  if(__webpack_require__(37)(process) == 'process'){
		    defer = function(id){
		      process.nextTick(ctx(run, id, 1));
		    };
		  // Browsers with MessageChannel, includes WebWorkers
		  } else if(MessageChannel){
		    channel = new MessageChannel;
		    port    = channel.port2;
		    channel.port1.onmessage = listner;
		    defer = ctx(port.postMessage, port, 1);
		  // Browsers with postMessage, skip WebWorkers
		  // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
		  } else if(global.addEventListener && typeof postMessage == 'function' && !global.importScript){
		    defer = function(id){
		      global.postMessage(id + '', '*');
		    };
		    global.addEventListener('message', listner, false);
		  // IE8-
		  } else if(ONREADYSTATECHANGE in cel('script')){
		    defer = function(id){
		      html.appendChild(cel('script'))[ONREADYSTATECHANGE] = function(){
		        html.removeChild(this);
		        run.call(id);
		      };
		    };
		  // Rest old browsers
		  } else {
		    defer = function(id){
		      setTimeout(ctx(run, id, 1), 0);
		    };
		  }
		}
		module.exports = {
		  set:   setTask,
		  clear: clearTask
		};
	
	/***/ },
	/* 76 */
	/***/ function(module, exports) {
	
		// fast apply, http://jsperf.lnkit.com/fast-apply/5
		module.exports = function(fn, args, that){
		  var un = that === undefined;
		  switch(args.length){
		    case 0: return un ? fn()
		                      : fn.call(that);
		    case 1: return un ? fn(args[0])
		                      : fn.call(that, args[0]);
		    case 2: return un ? fn(args[0], args[1])
		                      : fn.call(that, args[0], args[1]);
		    case 3: return un ? fn(args[0], args[1], args[2])
		                      : fn.call(that, args[0], args[1], args[2]);
		    case 4: return un ? fn(args[0], args[1], args[2], args[3])
		                      : fn.call(that, args[0], args[1], args[2], args[3]);
		  } return              fn.apply(that, args);
		};
	
	/***/ },
	/* 77 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = __webpack_require__(11).document && document.documentElement;
	
	/***/ },
	/* 78 */
	/***/ function(module, exports, __webpack_require__) {
	
		var isObject = __webpack_require__(32)
		  , document = __webpack_require__(11).document
		  // in old IE typeof document.createElement is 'object'
		  , is = isObject(document) && isObject(document.createElement);
		module.exports = function(it){
		  return is ? document.createElement(it) : {};
		};
	
	/***/ },
	/* 79 */
	/***/ function(module, exports, __webpack_require__) {
	
		var $redef = __webpack_require__(13);
		module.exports = function(target, src){
		  for(var key in src)$redef(target, key, src[key]);
		  return target;
		};
	
	/***/ },
	/* 80 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(81), __esModule: true };
	
	/***/ },
	/* 81 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(82);
		module.exports = __webpack_require__(12).Object.keys;
	
	/***/ },
	/* 82 */
	/***/ function(module, exports, __webpack_require__) {
	
		// 19.1.2.14 Object.keys(O)
		var toObject = __webpack_require__(29);
	
		__webpack_require__(83)('keys', function($keys){
		  return function keys(it){
		    return $keys(toObject(it));
		  };
		});
	
	/***/ },
	/* 83 */
	/***/ function(module, exports, __webpack_require__) {
	
		// most Object methods by ES6 should accept primitives
		module.exports = function(KEY, exec){
		  var $def = __webpack_require__(10)
		    , fn   = (__webpack_require__(12).Object || {})[KEY] || Object[KEY]
		    , exp  = {};
		  exp[KEY] = exec(fn);
		  $def($def.S + $def.F * __webpack_require__(18)(function(){ fn(1); }), 'Object', exp);
		};
	
	/***/ },
	/* 84 */
	/***/ function(module, exports, __webpack_require__) {
	
		module.exports = { "default": __webpack_require__(85), __esModule: true };
	
	/***/ },
	/* 85 */
	/***/ function(module, exports, __webpack_require__) {
	
		__webpack_require__(67);
		__webpack_require__(4);
		__webpack_require__(42);
		__webpack_require__(86);
		__webpack_require__(89);
		module.exports = __webpack_require__(12).Set;
	
	/***/ },
	/* 86 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var strong = __webpack_require__(87);
	
		// 23.2 Set Objects
		__webpack_require__(88)('Set', function(get){
		  return function Set(){ return get(this, arguments[0]); };
		}, {
		  // 23.2.3.1 Set.prototype.add(value)
		  add: function add(value){
		    return strong.def(this, value = value === 0 ? 0 : value, value);
		  }
		}, strong);
	
	/***/ },
	/* 87 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var $            = __webpack_require__(15)
		  , hide         = __webpack_require__(14)
		  , ctx          = __webpack_require__(27)
		  , species      = __webpack_require__(73)
		  , strictNew    = __webpack_require__(69)
		  , defined      = __webpack_require__(7)
		  , forOf        = __webpack_require__(70)
		  , step         = __webpack_require__(45)
		  , ID           = __webpack_require__(22)('id')
		  , $has         = __webpack_require__(19)
		  , isObject     = __webpack_require__(32)
		  , isExtensible = Object.isExtensible || isObject
		  , SUPPORT_DESC = __webpack_require__(17)
		  , SIZE         = SUPPORT_DESC ? '_s' : 'size'
		  , id           = 0;
	
		var fastKey = function(it, create){
		  // return primitive with prefix
		  if(!isObject(it))return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
		  if(!$has(it, ID)){
		    // can't set id to frozen object
		    if(!isExtensible(it))return 'F';
		    // not necessary to add id
		    if(!create)return 'E';
		    // add missing object id
		    hide(it, ID, ++id);
		  // return object id with prefix
		  } return 'O' + it[ID];
		};
	
		var getEntry = function(that, key){
		  // fast case
		  var index = fastKey(key), entry;
		  if(index !== 'F')return that._i[index];
		  // frozen object case
		  for(entry = that._f; entry; entry = entry.n){
		    if(entry.k == key)return entry;
		  }
		};
	
		module.exports = {
		  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
		    var C = wrapper(function(that, iterable){
		      strictNew(that, C, NAME);
		      that._i = $.create(null); // index
		      that._f = undefined;      // first entry
		      that._l = undefined;      // last entry
		      that[SIZE] = 0;           // size
		      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
		    });
		    __webpack_require__(79)(C.prototype, {
		      // 23.1.3.1 Map.prototype.clear()
		      // 23.2.3.2 Set.prototype.clear()
		      clear: function clear(){
		        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
		          entry.r = true;
		          if(entry.p)entry.p = entry.p.n = undefined;
		          delete data[entry.i];
		        }
		        that._f = that._l = undefined;
		        that[SIZE] = 0;
		      },
		      // 23.1.3.3 Map.prototype.delete(key)
		      // 23.2.3.4 Set.prototype.delete(value)
		      'delete': function(key){
		        var that  = this
		          , entry = getEntry(that, key);
		        if(entry){
		          var next = entry.n
		            , prev = entry.p;
		          delete that._i[entry.i];
		          entry.r = true;
		          if(prev)prev.n = next;
		          if(next)next.p = prev;
		          if(that._f == entry)that._f = next;
		          if(that._l == entry)that._l = prev;
		          that[SIZE]--;
		        } return !!entry;
		      },
		      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
		      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
		      forEach: function forEach(callbackfn /*, that = undefined */){
		        var f = ctx(callbackfn, arguments[1], 3)
		          , entry;
		        while(entry = entry ? entry.n : this._f){
		          f(entry.v, entry.k, this);
		          // revert to the last existing entry
		          while(entry && entry.r)entry = entry.p;
		        }
		      },
		      // 23.1.3.7 Map.prototype.has(key)
		      // 23.2.3.7 Set.prototype.has(value)
		      has: function has(key){
		        return !!getEntry(this, key);
		      }
		    });
		    if(SUPPORT_DESC)$.setDesc(C.prototype, 'size', {
		      get: function(){
		        return defined(this[SIZE]);
		      }
		    });
		    return C;
		  },
		  def: function(that, key, value){
		    var entry = getEntry(that, key)
		      , prev, index;
		    // change existing entry
		    if(entry){
		      entry.v = value;
		    // create new entry
		    } else {
		      that._l = entry = {
		        i: index = fastKey(key, true), // <- index
		        k: key,                        // <- key
		        v: value,                      // <- value
		        p: prev = that._l,             // <- previous entry
		        n: undefined,                  // <- next entry
		        r: false                       // <- removed
		      };
		      if(!that._f)that._f = entry;
		      if(prev)prev.n = entry;
		      that[SIZE]++;
		      // add to index
		      if(index !== 'F')that._i[index] = entry;
		    } return that;
		  },
		  getEntry: getEntry,
		  setStrong: function(C, NAME, IS_MAP){
		    // add .keys, .values, .entries, [@@iterator]
		    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
		    __webpack_require__(8)(C, NAME, function(iterated, kind){
		      this._t = iterated;  // target
		      this._k = kind;      // kind
		      this._l = undefined; // previous
		    }, function(){
		      var that  = this
		        , kind  = that._k
		        , entry = that._l;
		      // revert to the last existing entry
		      while(entry && entry.r)entry = entry.p;
		      // get next entry
		      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
		        // or finish the iteration
		        that._t = undefined;
		        return step(1);
		      }
		      // return step by kind
		      if(kind == 'keys'  )return step(0, entry.k);
		      if(kind == 'values')return step(0, entry.v);
		      return step(0, [entry.k, entry.v]);
		    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);
	
		    // add [@@species], 23.1.2.2, 23.2.2.2
		    species(C);
		    species(__webpack_require__(12)[NAME]); // for wrapper
		  }
		};
	
	/***/ },
	/* 88 */
	/***/ function(module, exports, __webpack_require__) {
	
		'use strict';
		var $          = __webpack_require__(15)
		  , $def       = __webpack_require__(10)
		  , hide       = __webpack_require__(14)
		  , forOf      = __webpack_require__(70)
		  , strictNew  = __webpack_require__(69);
	
		module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
		  var Base  = __webpack_require__(11)[NAME]
		    , C     = Base
		    , ADDER = IS_MAP ? 'set' : 'add'
		    , proto = C && C.prototype
		    , O     = {};
		  if(!__webpack_require__(17) || typeof C != 'function'
		    || !(IS_WEAK || proto.forEach && !__webpack_require__(18)(function(){ new C().entries().next(); }))
		  ){
		    // create collection constructor
		    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
		    __webpack_require__(79)(C.prototype, methods);
		  } else {
		    C = wrapper(function(target, iterable){
		      strictNew(target, C, NAME);
		      target._c = new Base;
		      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
		    });
		    $.each.call('add,clear,delete,forEach,get,has,set,keys,values,entries'.split(','),function(KEY){
		      var chain = KEY == 'add' || KEY == 'set';
		      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
		        var result = this._c[KEY](a === 0 ? 0 : a, b);
		        return chain ? this : result;
		      });
		    });
		    if('size' in proto)$.setDesc(C.prototype, 'size', {
		      get: function(){
		        return this._c.size;
		      }
		    });
		  }
	
		  __webpack_require__(25)(C, NAME);
	
		  O[NAME] = C;
		  $def($def.G + $def.W + $def.F, O);
	
		  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);
	
		  return C;
		};
	
	/***/ },
	/* 89 */
	/***/ function(module, exports, __webpack_require__) {
	
		// https://github.com/DavidBruant/Map-Set.prototype.toJSON
		var $def  = __webpack_require__(10);
	
		$def($def.P, 'Set', {toJSON: __webpack_require__(90)('Set')});
	
	/***/ },
	/* 90 */
	/***/ function(module, exports, __webpack_require__) {
	
		// https://github.com/DavidBruant/Map-Set.prototype.toJSON
		var forOf   = __webpack_require__(70)
		  , classof = __webpack_require__(36);
		module.exports = function(NAME){
		  return function toJSON(){
		    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
		    var arr = [];
		    forOf(this, false, arr.push, arr);
		    return arr;
		  };
		};
	
	/***/ }
	/******/ ])
	});
	;

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.IterableBase = undefined;
	
	var _iterator = __webpack_require__(103);
	
	var _iterator2 = _interopRequireDefault(_iterator);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var IterableBase = exports.IterableBase = function () {
	  function IterableBase() {
	    (0, _classCallCheck3.default)(this, IterableBase);
	  }
	
	  (0, _createClass3.default)(IterableBase, [{
	    key: _iterator2.default,
	    // http://stackoverflow.com/questions/31942617/how-to-implement-symbol-iterator
	    value: function value() {
	      return this.iterator();
	    }
	  }]);
	  return IterableBase;
	}();

/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.DocumentApplier = exports.CursorApplier = exports.TextApplier = undefined;
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _components = __webpack_require__(130);
	
	var Components = _interopRequireWildcard(_components);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var TextApplier = exports.TextApplier = {
	  initial: function initial() {
	    return '';
	  },
	  stateHash: function stateHash(text) {
	    return text;
	  },
	  apply: function apply(text, operation) {
	    // returns [state, undo]
	    var i = 0;
	    var undo = [];
	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;
	
	    try {
	      for (var _iterator = (0, _getIterator3.default)(operation), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	        var c = _step.value;
	
	        Components.handleComponent(c, {
	          insert: function insert(_insert) {
	            undo.push(-_insert.length);
	            text = text.slice(0, i) + _insert + text.slice(i);
	            i += Components.length(_insert);
	          },
	          remove: function remove(_remove) {
	            var num = Components.length(_remove);
	            if (i + num > text.length) {
	              throw new Error('wat, trying to delete too much');
	            }
	            undo.push(text.slice(i, i + num));
	            text = text.slice(0, i) + text.slice(i + num);
	          },
	          retain: function retain(_retain) {
	            undo.push(_retain);
	            i += Components.length(_retain);
	          }
	        });
	
	        // make sure we didn't accidentally overshoot
	        if (i > text.length) {
	          throw new Error('wat, overshot');
	        }
	      }
	    } catch (err) {
	      _didIteratorError = true;
	      _iteratorError = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion && _iterator.return) {
	          _iterator.return();
	        }
	      } finally {
	        if (_didIteratorError) {
	          throw _iteratorError;
	        }
	      }
	    }
	
	    return [text, Components.simplify(undo)];
	  }
	};
	
	//
	
	var CursorApplier = exports.CursorApplier = {
	  initial: function initial() {
	    return { start: 0, end: 0 };
	  },
	  stateHash: function stateHash(state) {
	    throw new Error('not implemented');
	  },
	  _adjustPosition: function _adjustPosition(pos, operation) {
	    var i = 0;
	    var _iteratorNormalCompletion2 = true;
	    var _didIteratorError2 = false;
	    var _iteratorError2 = undefined;
	
	    try {
	      for (var _iterator2 = (0, _getIterator3.default)(operation), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	        var c = _step2.value;
	
	        if (i > pos) {
	          break;
	        }
	
	        Components.handleComponent(c, {
	          insert: function insert(_insert2) {
	            i += Components.length(_insert2);
	            pos += Components.length(_insert2);
	          },
	          remove: function remove(_remove2) {
	            pos -= Components.length(_remove2);
	          },
	          retain: function retain(_retain2) {
	            i += Components.length(_retain2);
	          }
	        });
	      }
	    } catch (err) {
	      _didIteratorError2 = true;
	      _iteratorError2 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion2 && _iterator2.return) {
	          _iterator2.return();
	        }
	      } finally {
	        if (_didIteratorError2) {
	          throw _iteratorError2;
	        }
	      }
	    }
	
	    return pos;
	  },
	  apply: function apply(state, operation) {
	    return {
	      start: this._adjustPosition(state.start, operation),
	      end: this._adjustPosition(state.end, operation)
	    };
	  }
	};
	
	//
	
	var DocumentApplier = exports.DocumentApplier = {
	  initial: function initial() {
	    return { cursor: CursorApplier.initial(), text: TextApplier.initial() };
	  },
	  stateHash: function stateHash(state) {
	    return TextApplier.stateHash(state.text);
	  },
	  apply: function apply(state, operation) {
	    var _TextApplier$apply = TextApplier.apply(state.text, operation),
	        _TextApplier$apply2 = (0, _slicedToArray3.default)(_TextApplier$apply, 2),
	        text = _TextApplier$apply2[0],
	        undo = _TextApplier$apply2[1];
	
	    var cursor = CursorApplier.apply(state.cursor, operation);
	    return [{ cursor: cursor, text: text }, undo];
	  }
	};

/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.generateInsertion = generateInsertion;
	exports.generateDeletion = generateDeletion;
	exports.createRemove = createRemove;
	exports.createRetain = createRetain;
	exports.createInsert = createInsert;
	exports.isRetain = isRetain;
	exports.isInsert = isInsert;
	exports.isRemove = isRemove;
	exports.handleComponent = handleComponent;
	exports.split = split;
	exports.length = length;
	exports.joinInsert = joinInsert;
	exports.joinRetain = joinRetain;
	exports.joinRemove = joinRemove;
	exports.join = join;
	exports.simplify = simplify;
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function generateInsertion(pos, text) {
	  return [createRetain(pos), createInsert(text)];
	}
	
	function generateDeletion(pos, n) {
	  return [createRetain(pos), createRemove(n)];
	}
	
	//
	
	
	function createRemove(num) {
	  return -Math.abs(num);
	}
	
	function createRetain(o) {
	  if (typeof o === 'string') {
	    return o.length;
	  } else {
	    var num = o;
	    if (num < 0) {
	      throw new Error('wat retains should be positive');
	    }
	    return num;
	  }
	}
	
	function createInsert(text) {
	  return text;
	}
	
	function isRetain(c) {
	  return typeof c === 'number' && c >= 0;
	}
	
	function isInsert(c) {
	  return typeof c === 'string';
	}
	
	function isRemove(c) {
	  return typeof c === 'number' && c < 0;
	}
	
	function handleComponent(c, f) {
	  if (typeof c === 'string') {
	    // insert
	    var _insert = c;
	    return f.insert(_insert);
	  } else if (typeof c === 'number' && c < 0) {
	    // remove
	    var _remove = c;
	    return f.remove(_remove);
	  } else if (typeof c === 'number' && c >= 0) {
	    // retain
	    var _retain = c;
	    return f.retain(_retain);
	  }
	
	  throw new Error('wat unknown c', c);
	}
	
	function split(c, offset) {
	  return handleComponent(c, {
	    insert: function (_insert2) {
	      function insert(_x) {
	        return _insert2.apply(this, arguments);
	      }
	
	      insert.toString = function () {
	        return _insert2.toString();
	      };
	
	      return insert;
	    }(function (insert) {
	      if (offset < 0 || offset > insert.length) {
	        throw new Error();
	      }
	      return [createInsert(insert.substring(0, offset)), createInsert(insert.substring(offset))];
	    }),
	    remove: function (_remove2) {
	      function remove(_x2) {
	        return _remove2.apply(this, arguments);
	      }
	
	      remove.toString = function () {
	        return _remove2.toString();
	      };
	
	      return remove;
	    }(function (remove) {
	      var num = length(remove);
	      if (offset < 0 || offset > num) {
	        throw new Error();
	      }
	      return [createRemove(offset), createRemove(num - offset)];
	    }),
	    retain: function (_retain2) {
	      function retain(_x3) {
	        return _retain2.apply(this, arguments);
	      }
	
	      retain.toString = function () {
	        return _retain2.toString();
	      };
	
	      return retain;
	    }(function (retain) {
	      if (offset < 0 || offset > retain) {
	        throw new Error();
	      }
	      return [createRetain(offset), createRetain(retain - offset)];
	    })
	  });
	}
	
	function length(c) {
	  var l = handleComponent(c, {
	    insert: function (_insert3) {
	      function insert(_x4) {
	        return _insert3.apply(this, arguments);
	      }
	
	      insert.toString = function () {
	        return _insert3.toString();
	      };
	
	      return insert;
	    }(function (insert) {
	      return insert.length;
	    }),
	    remove: function (_remove3) {
	      function remove(_x5) {
	        return _remove3.apply(this, arguments);
	      }
	
	      remove.toString = function () {
	        return _remove3.toString();
	      };
	
	      return remove;
	    }(function (remove) {
	      return -remove;
	    }),
	    retain: function (_retain3) {
	      function retain(_x6) {
	        return _retain3.apply(this, arguments);
	      }
	
	      retain.toString = function () {
	        return _retain3.toString();
	      };
	
	      return retain;
	    }(function (retain) {
	      return retain;
	    })
	  });
	  if (l < 0) {
	    throw new Error('wat c has negative length', c);
	  }
	  return l;
	}
	
	function joinInsert(insert0, c1) {
	  return handleComponent(c1, {
	    insert: function insert(insert1) {
	      return createInsert(insert0 + insert1);
	    },
	    remove: function remove() {
	      return undefined;
	    },
	    retain: function retain() {
	      return undefined;
	    }
	  });
	}
	
	function joinRetain(retain0, c1) {
	  return handleComponent(c1, {
	    insert: function insert() {
	      return undefined;
	    },
	    retain: function retain(retain1) {
	      return createRetain(retain0 + retain1);
	    },
	    remove: function remove() {
	      return undefined;
	    }
	  });
	}
	
	function joinRemove(remove0, c1) {
	  return handleComponent(c1, {
	    insert: function insert() {
	      return undefined;
	    },
	    retain: function retain() {
	      return undefined;
	    },
	    remove: function remove(remove1) {
	      return createRemove(remove0 + remove1);
	    }
	  });
	}
	
	function join(c0, c1) {
	  return handleComponent(c0, {
	    insert: function (_insert4) {
	      function insert(_x7) {
	        return _insert4.apply(this, arguments);
	      }
	
	      insert.toString = function () {
	        return _insert4.toString();
	      };
	
	      return insert;
	    }(function (insert) {
	      return joinInsert(insert, c1);
	    }),
	    remove: function (_remove4) {
	      function remove(_x8) {
	        return _remove4.apply(this, arguments);
	      }
	
	      remove.toString = function () {
	        return _remove4.toString();
	      };
	
	      return remove;
	    }(function (remove) {
	      return joinRemove(remove, c1);
	    }),
	    retain: function (_retain4) {
	      function retain(_x9) {
	        return _retain4.apply(this, arguments);
	      }
	
	      retain.toString = function () {
	        return _retain4.toString();
	      };
	
	      return retain;
	    }(function (retain) {
	      return joinRetain(retain, c1);
	    })
	  });
	}
	
	function simplify(operation) {
	  for (var _i = 0; _i < operation.length; _i++) {
	    if (length(operation[_i]) === 0) {
	      U.removeInPlace(operation, _i);
	      _i--;
	    }
	  }
	
	  for (var _i2 = 1; _i2 < operation.length; _i2++) {
	    var c = join(operation[_i2 - 1], operation[_i2]);
	    if (c != null) {
	      operation[_i2 - 1] = c;
	      U.removeInPlace(operation, _i2); // remove extra c
	      _i2--;
	    }
	  }
	
	  if (operation.length > 0 && isRetain(U.last(operation))) {
	    operation.pop(); // remove trailing retain
	  }
	
	  return operation;
	}

/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.inferOperation = undefined;
	
	var _components = __webpack_require__(130);
	
	var Components = _interopRequireWildcard(_components);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	var inferOperation = exports.inferOperation = function inferOperation(oldText, newText) {
	  if (oldText.length === newText.length) {
	    // we have a no-op
	    if (oldText === newText) {
	      return [];
	    }
	  }
	
	  if (newText.length === 0) {
	    return [-oldText.length];
	  }
	
	  if (oldText.length === 0) {
	    return [newText];
	  }
	
	  // or we have a selection being overwritten.
	  var postfixLength = U.calculatePostfixLength(oldText, newText);
	  var newTextLeftover = U.removeTail(newText, postfixLength);
	  var oldTextLeftover = U.removeTail(oldText, postfixLength);
	  var prefixLength = U.calculatePrefixLength(oldTextLeftover, newTextLeftover);
	
	  var start = prefixLength;
	  var endOld = oldText.length - postfixLength;
	  var endNew = newText.length - postfixLength;
	
	  return [// update
	  Components.createRetain(start), Components.createRemove(endOld - start), Components.createInsert(U.string(U.substring(newText, { start: start, stop: endNew })))];
	};

/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	exports.transformNullable = transformNullable;
	exports.transform = transform;
	exports.composeNullable = composeNullable;
	exports.compose = compose;
	exports.composeMany = composeMany;
	
	var _components = __webpack_require__(130);
	
	var Components = _interopRequireWildcard(_components);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _transformConsumeOps(a, b) {
	  // returns [[aP, bP], [a, b]]
	
	  if (a != null && Components.isInsert(a)) {
	    return [[a, Components.createRetain(a)], [undefined, b]];
	  }
	
	  if (b != null && Components.isInsert(b)) {
	    return [[Components.createRetain(b), b], [a, undefined]];
	  }
	
	  // neither is null
	  if (a != null && b != null) {
	    var minLength = Math.min(Components.length(a), Components.length(b));
	
	    var _Components$split = Components.split(a, minLength),
	        _Components$split2 = (0, _slicedToArray3.default)(_Components$split, 2),
	        aHead = _Components$split2[0],
	        aTail = _Components$split2[1];
	
	    var _Components$split3 = Components.split(b, minLength),
	        _Components$split4 = (0, _slicedToArray3.default)(_Components$split3, 2),
	        bHead = _Components$split4[0],
	        bTail = _Components$split4[1];
	
	    if (Components.length(aHead) === 0) {
	      aHead = undefined;
	    }
	    if (Components.length(aTail) === 0) {
	      aTail = undefined;
	    }
	    if (Components.length(bHead) === 0) {
	      bHead = undefined;
	    }
	    if (Components.length(bTail) === 0) {
	      bTail = undefined;
	    }
	
	    if (Components.isRetain(a) && Components.isRetain(b)) {
	      return [[aHead, bHead], [aTail, bTail]];
	    }
	    if (Components.isRemove(a) && Components.isRetain(b)) {
	      return [[aHead, undefined], [aTail, bTail]];
	    }
	    if (Components.isRetain(a) && Components.isRemove(b)) {
	      return [[undefined, bHead], [aTail, bTail]];
	    }
	    if (Components.isRemove(a) || Components.isRemove(b)) {
	      return [[undefined, undefined], [aTail, bTail]]; // both do the same thing
	    }
	    if (Components.isInsert(a) || Components.isInsert(b)) {
	      throw new Error('wat, should be handled already');
	    }
	    throw new Error('wat');
	  }
	
	  // one is null
	  if (a != null) {
	    return [[a, undefined], [undefined, b]];
	  }
	  if (b != null) {
	    return [[undefined, b], [a, undefined]];
	  }
	
	  throw new Error('wat');
	}
	
	function transformNullable(clientOp, serverOp) {
	  if (clientOp != null && serverOp != null) {
	    var _transform = transform(clientOp, serverOp),
	        _transform2 = (0, _slicedToArray3.default)(_transform, 2),
	        newClientOps = _transform2[0],
	        newServerOps = _transform2[1];
	
	    return [newClientOps, newServerOps];
	  } else {
	    return [clientOp, serverOp];
	  }
	}
	
	function transform(clientOp, serverOp) {
	  var op1 = clientOp;
	  var op2 = serverOp;
	
	  var op1P = [];
	  var op2P = [];
	
	  var i1 = 0;
	  var i2 = 0;
	
	  var c1 = undefined;
	  var c2 = undefined;
	
	  while (true) {
	    if (c1 == null) {
	      c1 = op1[i1];i1++;
	    }
	    if (c2 == null) {
	      c2 = op2[i2];i2++;
	    }
	
	    if (c1 == null && c2 == null) {
	      break;
	    }
	
	    if (c1 != null && Components.length(c1) <= 0) {
	      c1 = null;
	      continue;
	    }
	
	    if (c2 != null && Components.length(c2) <= 0) {
	      c2 = null;
	      continue;
	    }
	
	    var _transformConsumeOps2 = _transformConsumeOps(c1, c2),
	        _transformConsumeOps3 = (0, _slicedToArray3.default)(_transformConsumeOps2, 2),
	        _transformConsumeOps4 = (0, _slicedToArray3.default)(_transformConsumeOps3[0], 2),
	        c1P = _transformConsumeOps4[0],
	        c2P = _transformConsumeOps4[1],
	        _transformConsumeOps5 = (0, _slicedToArray3.default)(_transformConsumeOps3[1], 2),
	        newC1 = _transformConsumeOps5[0],
	        newC2 = _transformConsumeOps5[1];
	
	    if (c1P != null) {
	      op1P.push(c1P);
	    }
	    if (c2P != null) {
	      op2P.push(c2P);
	    }
	
	    c1 = newC1;
	    c2 = newC2;
	  }
	
	  return [Components.simplify(op1P), Components.simplify(op2P)];
	}
	function composeNullable(op1, op2) {
	  if (op1 != null && op2 != null) {
	    return compose(op1, op2);
	  } else if (op1 != null) {
	    return op1;
	  } else if (op2 != null) {
	    return op2;
	  } else {
	    return undefined;
	  }
	}
	function _composeConsumeOps(a, b) {
	  // returns [newOp, [a, b]]
	
	  if (a != null && Components.isRemove(a)) {
	    return [a, [undefined, b]];
	  }
	
	  if (b != null && Components.isInsert(b)) {
	    return [b, [a, undefined]];
	  }
	
	  // neither op is null!
	  if (a != null && b != null) {
	    var minLength = Math.min(Components.length(a), Components.length(b));
	
	    var _Components$split5 = Components.split(a, minLength),
	        _Components$split6 = (0, _slicedToArray3.default)(_Components$split5, 2),
	        aHead = _Components$split6[0],
	        aTail = _Components$split6[1];
	
	    var _Components$split7 = Components.split(b, minLength),
	        _Components$split8 = (0, _slicedToArray3.default)(_Components$split7, 2),
	        bHead = _Components$split8[0],
	        bTail = _Components$split8[1];
	
	    if (Components.length(aHead) === 0) {
	      aHead = undefined;
	    }
	    if (Components.length(aTail) === 0) {
	      aTail = undefined;
	    }
	    if (Components.length(bHead) === 0) {
	      bHead = undefined;
	    }
	    if (Components.length(bTail) === 0) {
	      bTail = undefined;
	    }
	
	    if (Components.isRetain(a) && Components.isRetain(b)) {
	      return [aHead, [aTail, bTail]];
	    }
	    if (Components.isInsert(a) && Components.isRetain(b)) {
	      return [aHead, [aTail, bTail]];
	    }
	    if (Components.isRetain(a) && Components.isRemove(b)) {
	      return [bHead, [aTail, bTail]];
	    }
	    if (Components.isInsert(a) && Components.isRemove(b)) {
	      return [undefined, [aTail, bTail]]; // delete the inserted portion
	    }
	    if (Components.isRemove(a) && Components.isInsert(b)) {
	      throw new Error('wat, should be handled already');
	    }
	    if (Components.isRemove(a) && Components.isRemove(b)) {
	      throw new Error('wat, should be handled already');
	    }
	    if (Components.isInsert(a) && Components.isInsert(b)) {
	      throw new Error('wat, should be handled already');
	    }
	    throw new Error('wat');
	  }
	
	  // one of the two operations is null!
	  if (a != null) {
	    return [a, [undefined, b]];
	  }
	  if (b != null) {
	    return [b, [a, undefined]];
	  }
	
	  throw new Error('wat');
	}
	function compose(op1, op2) {
	  // compose (op1, op2) to composed s.t.
	  // apply(apply(text, op1), op2) === apply(text, composed)
	
	  // code borrowed from https://github.com/Operational-Transformation/ot.py/blob/master/ot/text_operation.py#L219
	
	  var composed = [];
	
	  var i1 = 0;
	  var i2 = 0;
	
	  var c1 = undefined;
	  var c2 = undefined;
	
	  while (true) {
	    if (c1 == null) {
	      c1 = op1[i1];i1++;
	    }
	    if (c2 == null) {
	      c2 = op2[i2];i2++;
	    }
	
	    if (c1 == null && c2 == null) {
	      break;
	    }
	
	    if (c1 != null && Components.length(c1) <= 0) {
	      c1 = null;
	      continue;
	    }
	
	    if (c2 != null && Components.length(c2) <= 0) {
	      c2 = null;
	      continue;
	    }
	
	    var _composeConsumeOps2 = _composeConsumeOps(c1, c2),
	        _composeConsumeOps3 = (0, _slicedToArray3.default)(_composeConsumeOps2, 2),
	        composedOp = _composeConsumeOps3[0],
	        _composeConsumeOps3$ = (0, _slicedToArray3.default)(_composeConsumeOps3[1], 2),
	        newC1 = _composeConsumeOps3$[0],
	        newC2 = _composeConsumeOps3$[1];
	
	    if (composedOp != null) {
	      composed.push(composedOp);
	    }
	    c1 = newC1;
	    c2 = newC2;
	  }
	
	  return Components.simplify(composed);
	}
	
	function composeMany(operations) {
	  var composed = [];
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;
	
	  try {
	    for (var _iterator = (0, _getIterator3.default)(operations), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var operation = _step.value;
	
	      composed = compose(composed, operation);
	    }
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator.return) {
	        _iterator.return();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	
	  return composed;
	}

/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.OTClientModel = exports.OutOfOrderError = undefined;
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _stringify = __webpack_require__(134);
	
	var _stringify2 = _interopRequireDefault(_stringify);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _v = __webpack_require__(136);
	
	var _v2 = _interopRequireDefault(_v);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	var _edit_types = __webpack_require__(139);
	
	var _ot_helper = __webpack_require__(140);
	
	var OTHelper = _interopRequireWildcard(_ot_helper);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var OutOfOrderError = exports.OutOfOrderError = function OutOfOrderError() {
	  (0, _classCallCheck3.default)(this, OutOfOrderError);
	};
	
	var OTClientModel = exports.OTClientModel = function () {
	  // the client op that has been sent to the server (but not yet ACKd by the server)
	
	  // This class maintains the state of the client, computes what updates
	  // should be sent to the server (i.e. ClientEditMessage), and applies
	  // remote updates (i.e. ServerEditMessage) to the local state.
	
	  // OTClientModel {
	  //   performEdit(edit: Operation): ?ClientEditMessage
	  //   handleClientEdit(serverMessage: ServerEditMessage): ?ServerEditMessage
	  // }
	
	  // USAGE:
	
	  // let client = new OTClientModel(...)
	  //
	  // connection.on('update', (serverMessage) => { // LISTEN for remote changes
	  //   let clientUpdate = client.handleClientEdit(serverMessage)
	  //   connection.send(clientUpdate)
	  // })
	  //
	  // let clientUpdate = client.performEdit(['hello']) // SEND local changes
	  // connection.send(clientUpdate)
	
	  function OTClientModel(applier) {
	    (0, _classCallCheck3.default)(this, OTClientModel);
	
	    this.applier = applier;
	
	    this.uid = U.genUid();
	    this.state = this.applier.initial();
	
	    var hash = this.applier.stateHash(this.state);
	
	    this.bufferEdit = {
	      operation: undefined,
	      childHash: hash
	    };
	    this.outstandingEdit = {
	      startIndex: 0,
	      parentHash: hash,
	      operation: undefined,
	      id: this._generateEditId()
	    };
	    this.undos = {
	      operationsStack: [],
	      parentHash: hash
	    };
	    this.redos = {
	      operationsStack: [],
	      parentHash: hash
	    };
	
	    this.changeListeners = [];
	  }
	  // the client ops not yet sent to the server.
	
	  (0, _createClass3.default)(OTClientModel, [{
	    key: '_generateEditId',
	    value: function _generateEditId() {
	      return (0, _v2.default)();
	    }
	  }, {
	    key: '_checkInvariants',
	    value: function _checkInvariants() {
	      var hash = this.applier.stateHash(this.state);
	
	      if (this.bufferEdit.childHash !== hash) {
	        throw new Error('buffer should point to current state');
	      }
	
	      if (this.undos.parentHash !== this.redos.parentHash) {
	        throw new Error("wat, undos and redos should start at the same place");
	      }
	
	      if (this.undos.parentHash !== this.bufferEdit.childHash) {
	        throw new Error("wat, undo should start on buffer end state.");
	      }
	    }
	  }, {
	    key: 'getNextIndex',
	    value: function getNextIndex() {
	      // because neither the outstanding nor buffer exist on the
	      // server yet, they don't increment the index at all!
	
	      // thus, the next index we expect from the server is
	      // exactly the index we think the outstanding exists at.
	      return this.outstandingEdit.startIndex;
	    }
	  }, {
	    key: '_generateMessageForOutstandingEdit',
	    value: function _generateMessageForOutstandingEdit() {
	      var updateEdit = (0, _edit_types.castUpdateEdit)(this.outstandingEdit);
	      if (updateEdit == null) {
	        return undefined;
	      }
	
	      return {
	        kind: 'ClientEditMessage',
	        edit: updateEdit,
	        sourceUid: this.uid
	      };
	    }
	  }, {
	    key: '_flushBuffer',
	    value: function _flushBuffer() {
	      // if there's no buffer, skip
	      if (this.bufferEdit.operation == null) {
	        return undefined;
	      }
	
	      // if there is a outstanding, skip
	      if (this.outstandingEdit.operation != null) {
	        return undefined;
	      }
	
	      // outstanding is now the buffer
	      this.outstandingEdit = {
	        operation: this.bufferEdit.operation,
	        id: this._generateEditId(),
	        parentHash: this.outstandingEdit.parentHash,
	        startIndex: this.outstandingEdit.startIndex
	      };
	
	      // buffer is now empty
	      this.bufferEdit = {
	        operation: undefined,
	        childHash: this.bufferEdit.childHash
	      };
	
	      this._checkInvariants();
	
	      // send the newly outstanding buffer!
	      var outstandingUpdate = this._generateMessageForOutstandingEdit();
	      if (outstandingUpdate == null) {
	        throw new Error('wat, there should be outstanding edits: ' + (0, _stringify2.default)(this) + ', ' + (0, _stringify2.default)(outstandingUpdate));
	      }
	
	      return outstandingUpdate;
	    }
	  }, {
	    key: 'addChangeListener',
	    value: function addChangeListener(listener) {
	      this.changeListeners.push(listener);
	    }
	  }, {
	    key: '_notifyChangeListeners',
	    value: function _notifyChangeListeners() {
	      var _this = this;
	
	      setTimeout(function () {
	        var _iteratorNormalCompletion = true;
	        var _didIteratorError = false;
	        var _iteratorError = undefined;
	
	        try {
	          for (var _iterator = (0, _getIterator3.default)(_this.changeListeners), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var listener = _step.value;
	
	            listener();
	          }
	        } catch (err) {
	          _didIteratorError = true;
	          _iteratorError = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion && _iterator.return) {
	              _iterator.return();
	            }
	          } finally {
	            if (_didIteratorError) {
	              throw _iteratorError;
	            }
	          }
	        }
	      }, 0);
	    }
	  }, {
	    key: 'getOutstandingRequest',
	    value: function getOutstandingRequest() {
	      return this._generateMessageForOutstandingEdit();
	    }
	  }, {
	    key: 'generateHistoryRequest',
	    value: function generateHistoryRequest() {
	      // we need to send our outstanding update
	      var editMessage = this._generateMessageForOutstandingEdit();
	
	      // first request history so we're up to date with the server
	      var requestHistory = {
	        kind: 'ClientRequestHistory',
	        nextIndex: this.getNextIndex(),
	        sourceUid: this.uid
	      };
	
	      return [requestHistory, editMessage];
	    }
	  }, {
	    key: 'handle',
	    value: function handle(serverMessage) {
	      var serverEdit = serverMessage.edit;
	
	      if (serverEdit.startIndex < this.getNextIndex()) {
	        // ignore old updates
	        return undefined;
	      }
	
	      if (serverEdit.startIndex > this.getNextIndex()) {
	        // raise on future updates
	        throw new OutOfOrderError();
	      }
	
	      if (this.outstandingEdit != null && serverEdit.id === this.outstandingEdit.id) {
	        // clear the outstanding out
	        this.outstandingEdit = {
	          operation: undefined,
	          id: this._generateEditId(),
	          parentHash: serverEdit.childHash,
	          startIndex: serverEdit.nextIndex
	        };
	
	        // undo & redo are already after the buffer
	        return this._flushBuffer();
	      } else {
	        // transform the outstanding & buffer & op
	        var _OTHelper$transformAn = OTHelper.transformAndApplyBuffers(this.applier, this.outstandingEdit, this.bufferEdit, serverEdit, this.state),
	            _OTHelper$transformAn2 = (0, _slicedToArray3.default)(_OTHelper$transformAn, 4),
	            newOutstandingEdit = _OTHelper$transformAn2[0],
	            newBufferEdit = _OTHelper$transformAn2[1],
	            appliedEdit = _OTHelper$transformAn2[2],
	            newState = _OTHelper$transformAn2[3];
	
	        // update undo
	
	
	        this.undos = OTHelper.transformEditsStack(appliedEdit, this.undos);
	        this.redos = OTHelper.transformEditsStack(appliedEdit, this.redos);
	
	        // apply the operation
	        this.state = newState;
	        this._notifyChangeListeners();
	
	        // update outstanding & buffer
	        this.outstandingEdit = newOutstandingEdit;
	        this.bufferEdit = newBufferEdit;
	
	        return undefined;
	      }
	    }
	  }, {
	    key: 'performUndo',
	    value: function performUndo() {
	      var currentHash = this.applier.stateHash(this.state);
	      var undoHash = this.undos.parentHash;
	
	      if (undoHash !== currentHash) {
	        throw new Error('undo must refer to current state');
	      }
	
	      while (this.undos.operationsStack.length > 0) {
	        // get the most recent undo
	        var undo = this.undos.operationsStack.pop();
	
	        if (undo == null) {
	          // this undo is empty
	          continue;
	        }
	
	        // apply the operation
	
	        var _applier$apply = this.applier.apply(this.state, undo),
	            _applier$apply2 = (0, _slicedToArray3.default)(_applier$apply, 2),
	            newState = _applier$apply2[0],
	            redo = _applier$apply2[1];
	
	        var newHash = this.applier.stateHash(newState);
	
	        this.state = newState;
	        this._notifyChangeListeners();
	
	        // append applied undo to buffer
	        this.bufferEdit = (0, _edit_types.castBufferEdit)(OTHelper.compose([this.bufferEdit, { operation: undo, childHash: newHash }]));
	
	        // update undos
	        this.undos.parentHash = newHash;
	
	        // update redos
	        this.redos.operationsStack.push(redo);
	        this.redos.parentHash = newHash;
	
	        return this._flushBuffer();
	      }
	    }
	  }, {
	    key: 'performRedo',
	    value: function performRedo() {
	      var currentHash = this.applier.stateHash(this.state);
	      var redoHash = this.redos.parentHash;
	
	      if (redoHash !== currentHash) {
	        throw new Error('redo must refer to current state');
	      }
	
	      while (this.redos.operationsStack.length > 0) {
	        // get the most recent redo
	        var redo = this.redos.operationsStack.pop();
	
	        if (redo == null) {
	          // this redo is empty
	          continue;
	        }
	
	        // apply the operation
	
	        var _applier$apply3 = this.applier.apply(this.state, redo),
	            _applier$apply4 = (0, _slicedToArray3.default)(_applier$apply3, 2),
	            newState = _applier$apply4[0],
	            undo = _applier$apply4[1];
	
	        var newHash = this.applier.stateHash(newState);
	
	        this.state = newState;
	        this._notifyChangeListeners();
	
	        // append applied redo to buffer
	        this.bufferEdit = (0, _edit_types.castBufferEdit)(OTHelper.compose([this.bufferEdit, { operation: redo, childHash: newHash }]));
	
	        // update undos
	        this.undos.operationsStack.push(undo);
	        this.undos.parentHash = newHash;
	
	        // update redos
	        this.redos.parentHash = newHash;
	
	        return this._flushBuffer();
	      }
	    }
	  }, {
	    key: 'performEdit',
	    value: function performEdit(edit) {
	      if (edit.length === 0) {
	        return undefined;
	      }
	
	      // apply the operation
	
	      var _applier$apply5 = this.applier.apply(this.state, edit),
	          _applier$apply6 = (0, _slicedToArray3.default)(_applier$apply5, 2),
	          newState = _applier$apply6[0],
	          undo = _applier$apply6[1];
	
	      this.state = newState;
	      this._notifyChangeListeners();
	
	      var newHash = this.applier.stateHash(this.state);
	
	      // the op we just applied!
	      var newEdit = {
	        operation: edit,
	        childHash: newHash
	      };
	
	      // append operation to buffer (& thus bridge)
	      this.bufferEdit = (0, _edit_types.castBufferEdit)(OTHelper.compose([this.bufferEdit, newEdit]));
	
	      // append operation to undo stack
	      this.undos.operationsStack.push(undo);
	      this.undos.parentHash = newHash;
	
	      // clear the redo stack
	      this.redos.operationsStack = [];
	      this.redos.parentHash = newHash;
	
	      return this._flushBuffer();
	    }
	  }]);
	  return OTClientModel;
	}();

/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(135), __esModule: true };

/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

	var core  = __webpack_require__(17)
	  , $JSON = core.JSON || (core.JSON = {stringify: JSON.stringify});
	module.exports = function stringify(it){ // eslint-disable-line no-unused-vars
	  return $JSON.stringify.apply($JSON, arguments);
	};

/***/ },
/* 136 */
/***/ function(module, exports, __webpack_require__) {

	var rng = __webpack_require__(137);
	var bytesToUuid = __webpack_require__(138);
	
	function v4(options, buf, offset) {
	  var i = buf && offset || 0;
	
	  if (typeof(options) == 'string') {
	    buf = options == 'binary' ? new Array(16) : null;
	    options = null;
	  }
	  options = options || {};
	
	  var rnds = options.random || (options.rng || rng)();
	
	  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
	  rnds[6] = (rnds[6] & 0x0f) | 0x40;
	  rnds[8] = (rnds[8] & 0x3f) | 0x80;
	
	  // Copy bytes to buffer, if provided
	  if (buf) {
	    for (var ii = 0; ii < 16; ++ii) {
	      buf[i + ii] = rnds[ii];
	    }
	  }
	
	  return buf || bytesToUuid(rnds);
	}
	
	module.exports = v4;


/***/ },
/* 137 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {// Unique ID creation requires a high quality random # generator.  In the
	// browser this is a little complicated due to unknown quality of Math.random()
	// and inconsistent support for the `crypto` API.  We do the best we can via
	// feature-detection
	var rng;
	
	var crypto = global.crypto || global.msCrypto; // for IE 11
	if (crypto && crypto.getRandomValues) {
	  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
	  var rnds8 = new Uint8Array(16);
	  rng = function whatwgRNG() {
	    crypto.getRandomValues(rnds8);
	    return rnds8;
	  };
	}
	
	if (!rng) {
	  // Math.random()-based (RNG)
	  //
	  // If all else fails, use Math.random().  It's fast, but is of unspecified
	  // quality.
	  var  rnds = new Array(16);
	  rng = function() {
	    for (var i = 0, r; i < 16; i++) {
	      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
	      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
	    }
	
	    return rnds;
	  };
	}
	
	module.exports = rng;
	
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 138 */
/***/ function(module, exports) {

	/**
	 * Convert array of 16 byte values to UUID string format of the form:
	 * XXXXXXXX-XXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
	 */
	var byteToHex = [];
	for (var i = 0; i < 256; ++i) {
	  byteToHex[i] = (i + 0x100).toString(16).substr(1);
	}
	
	function bytesToUuid(buf, offset) {
	  var i = offset || 0;
	  var bth = byteToHex;
	  return  bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] + '-' +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]] +
	          bth[buf[i++]] + bth[buf[i++]];
	}
	
	module.exports = bytesToUuid;


/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _keys = __webpack_require__(79);
	
	var _keys2 = _interopRequireDefault(_keys);
	
	exports.castServerEdit = castServerEdit;
	exports.castBufferEdit = castBufferEdit;
	exports.castOutstandingEdit = castOutstandingEdit;
	exports.castUpdateEdit = castUpdateEdit;
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// The official edits on the server
	
	
	// Unsent operations on the client
	
	
	// Sent but unacknowledged operations on the client
	
	
	// Changes on the client that are sent to the server
	function castServerEdit(op, opts) {
	  op = U.merge(op, opts);
	
	  if (op.parentHash == null || op.childHash == null || op.startIndex == null || op.nextIndex == null) {
	    throw new Error('server op contains keys: ' + (0, _keys2.default)(op).join(', '));
	  }
	  return op;
	}
	
	function castBufferEdit(op, opts) {
	  op = U.merge(op, opts);
	  if (!('operation' in op) || op.childHash == null) {
	    throw new Error('buffer op contains keys: ' + (0, _keys2.default)(op).join(', '));
	  }
	  return op;
	}
	
	function castOutstandingEdit(op, opts) {
	  op = U.merge(op, opts);
	  if (!('operation' in op) || op.id == null || op.parentHash == null || op.startIndex == null) {
	    throw new Error('outstanding op contains keys: ' + (0, _keys2.default)(op).join(', '));
	  }
	  return op;
	}
	
	function castUpdateEdit(op, opts) {
	  op = U.merge(op, opts);
	  if (op.operation == null || op.id == null || op.parentHash == null || op.startIndex == null) {
	    return undefined;
	  }
	  return op;
	}

/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _keys = __webpack_require__(79);
	
	var _keys2 = _interopRequireDefault(_keys);
	
	exports.castAppliedEdit = castAppliedEdit;
	exports.compose = compose;
	exports.transformEditsStack = transformEditsStack;
	exports.transformAndApplyToClient = transformAndApplyToClient;
	exports.transformAndApplyToServer = transformAndApplyToServer;
	exports.transformAndApplyBuffers = transformAndApplyBuffers;
	exports.transform = transform;
	exports.isEmpty = isEmpty;
	
	var _transformer = __webpack_require__(132);
	
	var Transformer = _interopRequireWildcard(_transformer);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	var _edit_types = __webpack_require__(139);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function castAppliedEdit(op, opts) {
	  op = U.merge(op, opts);
	  if (!('operation' in op) || op.childHash == null || op.parentHash == null) {
	    throw new Error('applied contains keys: ' + (0, _keys2.default)(op).join(', '));
	  }
	  return op;
	}
	
	// This class helps the models with the nitty-gritty of
	// transforming operations.
	
	// It's tightly coupled to the logic and expectations of the models!
	// For example, it knows about how the client manages & stores outstandings
	// and buffers.
	
	function _createEdit(operation, optional) {
	  var edit = { operation: operation };
	
	  if (optional.parent != null) {
	    if (optional.parent.childHash != null) {
	      edit.parentHash = optional.parent.childHash;
	    }
	  }
	  if (optional.source != null) {
	    if (optional.source.id != null) {
	      edit.id = optional.source.id;
	    }
	  }
	  if (optional.resultHash != null) {
	    edit.childHash = optional.resultHash;
	  }
	
	  return edit;
	}
	
	function compose(edits) {
	  if (edits.length === 0) {
	    throw new Error('wat can\'t compose empty list');
	  }
	
	  var composed = Transformer.composeMany(U.skipNulls(U.map(edits, function (o) {
	    return o.operation;
	  })));
	
	  var edit = {
	    operation: composed
	  };
	
	  var firstEdit = U.first(edits);
	  if (firstEdit.parentHash != null) {
	    edit.parentHash = firstEdit.parentHash;
	  }
	  if (firstEdit.startIndex != null) {
	    edit.startIndex = firstEdit.startIndex;
	  }
	
	  var lastEdit = U.last(edits);
	  if (lastEdit.childHash != null) {
	    edit.childHash = lastEdit.childHash;
	  }
	  if (lastEdit.nextIndex != null) {
	    edit.nextIndex = lastEdit.nextIndex;
	  }
	
	  return edit;
	}
	
	function transformEditsStack(appliedEdit, editsStack) {
	  // a: stack op
	  // b: applied op
	
	  // aP: new stack op
	  // bP: new applied op
	
	  // p: b.parentHash
	  // c: b.childHash
	
	  //   a /p b
	  //    /  \
	  // bP \  c aP
	  //     \/
	
	  var parentHash = appliedEdit.parentHash;
	  var childHash = appliedEdit.childHash;
	
	  if (editsStack.parentHash !== parentHash) {
	    throw new Error('stack ops must have the same parent as the applied op');
	  }
	
	  var transformedOps = [];
	
	  // iterate through the stack in reverse order
	  // thus, the most recent ops are transformed first
	
	  var b = appliedEdit.operation;
	  var _iteratorNormalCompletion = true;
	  var _didIteratorError = false;
	  var _iteratorError = undefined;
	
	  try {
	    for (var _iterator = (0, _getIterator3.default)(U.reverse(editsStack.operationsStack)), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	      var a = _step.value;
	
	      var _Transformer$transfor = Transformer.transformNullable(a, b),
	          _Transformer$transfor2 = (0, _slicedToArray3.default)(_Transformer$transfor, 2),
	          aP = _Transformer$transfor2[0],
	          bP = _Transformer$transfor2[1];
	
	      transformedOps.push(aP);
	      b = bP;
	    }
	
	    // because we iterated in reverse order, we have to reverse again
	  } catch (err) {
	    _didIteratorError = true;
	    _iteratorError = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion && _iterator.return) {
	        _iterator.return();
	      }
	    } finally {
	      if (_didIteratorError) {
	        throw _iteratorError;
	      }
	    }
	  }
	
	  transformedOps.reverse();
	
	  return { operationsStack: transformedOps, parentHash: childHash };
	}
	
	function _applyNullable(applier, state, o) {
	  if (o == null) {
	    return [state, undefined];
	  } else {
	    var _applier$apply = applier.apply(state, o),
	        _applier$apply2 = (0, _slicedToArray3.default)(_applier$apply, 2),
	        newState = _applier$apply2[0],
	        undo = _applier$apply2[1];
	
	    return [newState, undo];
	  }
	}
	
	function transformAndApplyToClient(applier, clientEdit, serverEdit, clientState) {
	  // returns [aP, bP, undo, newState]
	
	  //   a /\ b
	  //    /  \
	  // bP \  / aP
	  var a = clientEdit,
	      b = serverEdit;
	
	  var _transform = transform(a, b),
	      _transform2 = (0, _slicedToArray3.default)(_transform, 2),
	      aT = _transform2[0],
	      bT = _transform2[1];
	
	  var _applyNullable2 = _applyNullable(applier, clientState, bT.operation),
	      _applyNullable3 = (0, _slicedToArray3.default)(_applyNullable2, 2),
	      newState = _applyNullable3[0],
	      newUndo = _applyNullable3[1];
	
	  var newHash = applier.stateHash(newState);
	
	  aT.childHash = newHash;
	  bT.childHash = newHash;
	
	  return [aT, bT, { operation: newUndo }, newState];
	}
	
	function transformAndApplyToServer(applier, clientEdit, serverEdit, serverState) {
	  // returns [aP, bP, undo, newState]
	
	  //   a /\ b
	  //    /  \
	  // bP \  / aP
	  var a = clientEdit,
	      b = serverEdit;
	
	  var _transform3 = transform(a, b),
	      _transform4 = (0, _slicedToArray3.default)(_transform3, 2),
	      aT = _transform4[0],
	      bT = _transform4[1];
	
	  var _applyNullable4 = _applyNullable(applier, serverState, aT.operation),
	      _applyNullable5 = (0, _slicedToArray3.default)(_applyNullable4, 2),
	      newState = _applyNullable5[0],
	      newUndo = _applyNullable5[1];
	
	  var newHash = applier.stateHash(newState);
	
	  aT.childHash = newHash;
	  bT.childHash = newHash;
	
	  return [aT, bT, { operation: newUndo }, newState];
	}
	
	function transformAndApplyBuffers(applier, outstandingEdit, bufferEdit, serverEdit, clientState) {
	  // returns [newOutstanding, newBuffer, appliedEdit, newState]
	
	  if (outstandingEdit.parentHash !== serverEdit.parentHash || outstandingEdit.startIndex !== serverEdit.startIndex) {
	    throw new Error('wat, to transform outstanding there must be the same parent');
	  }
	
	  // a: outstanding
	  // c: buffer
	  // b: server operation
	
	  // s: client state
	
	  //         /\
	  //      a /  \ b
	  //       /    \
	  //      /\bP  /
	  //   c /  \  / aP
	  //    /    \/
	  //    s    /
	  // bPP \  / cP
	  //      \/
	
	  var a = outstandingEdit,
	      c = bufferEdit,
	      b = serverEdit;
	
	  var _transform5 = transform(a, b),
	      _transform6 = (0, _slicedToArray3.default)(_transform5, 2),
	      aP = _transform6[0],
	      bP = _transform6[1];
	
	  var _transformAndApplyToC = transformAndApplyToClient(applier, c, bP, clientState),
	      _transformAndApplyToC2 = (0, _slicedToArray3.default)(_transformAndApplyToC, 4),
	      cP = _transformAndApplyToC2[0],
	      bPP = _transformAndApplyToC2[1],
	      undo = _transformAndApplyToC2[2],
	      newState = _transformAndApplyToC2[3];
	
	  var newHash = applier.stateHash(newState);
	  cP.childHash = newHash;
	  bPP.childHash = newHash;
	
	  var _ref = [(0, _edit_types.castOutstandingEdit)(aP, { startIndex: serverEdit.nextIndex }), (0, _edit_types.castBufferEdit)(cP), castAppliedEdit(bPP)],
	      newOutstandingEdit = _ref[0],
	      newBufferEdit = _ref[1],
	      appliedEdit = _ref[2];
	
	
	  return [newOutstandingEdit, newBufferEdit, appliedEdit, newState];
	}
	function transform(clientEdit, serverEdit) {
	  //   a /\ b
	  //    /  \
	  // bP \  / aP
	  //     \/
	
	  if (clientEdit.parentHash != null && serverEdit.parentHash != null && clientEdit.parentHash !== serverEdit.parentHash) {
	    throw new Error('wat, to transform, they must have the same parent');
	  }
	
	  var aEdit = clientEdit,
	      bEdit = serverEdit;
	  var _ref2 = [aEdit.operation, bEdit.operation],
	      a = _ref2[0],
	      b = _ref2[1];
	
	  var _Transformer$transfor3 = Transformer.transformNullable(a, b),
	      _Transformer$transfor4 = (0, _slicedToArray3.default)(_Transformer$transfor3, 2),
	      aP = _Transformer$transfor4[0],
	      bP = _Transformer$transfor4[1];
	
	  var aEditP = _createEdit(aP, { parent: bEdit, source: aEdit });
	  var bEditP = _createEdit(bP, { parent: aEdit, source: bEdit });
	
	  if (aEdit.id != null) {
	    aEditP.id = aEdit.id;
	  }
	  if (bEdit.id != null) {
	    bEditP.id = bEdit.id;
	  }
	
	  return [aEditP, bEditP];
	}
	
	function isEmpty(edit) {
	  return edit.startIndex === edit.nextIndex;
	}

/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.OTServerModel = exports.InMemoryDocument = undefined;
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _stringify = __webpack_require__(134);
	
	var _stringify2 = _interopRequireDefault(_stringify);
	
	var _set = __webpack_require__(142);
	
	var _set2 = _interopRequireDefault(_set);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	var _ot_helper = __webpack_require__(140);
	
	var OTHelper = _interopRequireWildcard(_ot_helper);
	
	var _applier = __webpack_require__(129);
	
	var _edit_types = __webpack_require__(139);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var InMemoryDocument = exports.InMemoryDocument = function () {
	  function InMemoryDocument() {
	    (0, _classCallCheck3.default)(this, InMemoryDocument);
	
	    this;
	
	    this.text = '';
	    this.editLog = [];
	    this.editIds = new _set2.default();
	  }
	
	  (0, _createClass3.default)(InMemoryDocument, [{
	    key: 'update',
	    value: function update(newText, newEdit) {
	      this.text = newText;
	      this.editLog.push(newEdit);
	      if (newEdit.id == null) {
	        throw new Error('wat, id is null');
	      }
	      this.editIds.add(newEdit.id);
	    }
	  }, {
	    key: 'hasEdit',
	    value: function hasEdit(editId) {
	      return this.editIds.has(editId);
	    }
	  }, {
	    key: 'getEditAt',
	    value: function getEditAt(index) {
	      if (index > this.editLog.length) {
	        throw new Error('can\'t find edit at ' + index + ' in log w/ ' + this.editLog.length + ' edits');
	      }
	      return this.editLog[index];
	    }
	  }, {
	    key: 'getNumEdits',
	    value: function getNumEdits() {
	      return this.editLog.length;
	    }
	  }, {
	    key: 'getNextIndex',
	    value: function getNextIndex() {
	      return this.editLog.length;
	    }
	  }, {
	    key: 'getLastIndex',
	    value: function getLastIndex() {
	      return this.editLog.length - 1;
	    }
	  }, {
	    key: 'getEditRange',
	    value: function getEditRange(start, stop) {
	      var range = {
	        start: start == null ? 0 : start,
	        stop: stop == null ? this.editLog.length : stop
	      };
	
	      if (range.start === range.stop) {
	        return {
	          operation: [],
	          parentHash: this.text,
	          childHash: this.text,
	          startIndex: range.start,
	          nextIndex: range.stop
	        };
	      }
	
	      var edits = U.array(U.subarray(this.editLog, range));
	      if (edits.length === 0) {
	        throw new Error('no edits found for range: ' + (0, _stringify2.default)(range));
	      }
	
	      var composedEdit = OTHelper.compose(edits);
	      return (0, _edit_types.castServerEdit)(composedEdit);
	    }
	  }, {
	    key: 'getEdit',
	    value: function getEdit(editId) {
	      var editIndex = this.indexOfEdit(editId);
	      if (editIndex == null) {
	        throw new Error('edit not found ' + editId);
	      } else {
	        return this.editLog[editIndex];
	      }
	    }
	  }, {
	    key: 'indexOfEdit',
	    value: function indexOfEdit(editId) {
	      // find the index within the history of the outstanding edit
	      return U.findIndex(function (edit) {
	        return edit.id === editId;
	      }, this.editLog);
	    }
	  }]);
	  return InMemoryDocument;
	}();
	
	var OTServerModel = exports.OTServerModel = function () {
	  // This class maintains the state of the server, computes what updates
	  // should be sent to the client (i.e. ServerEditMessage), and applies
	  // remote updates (i.e. ClientEditMessage) to the server state.
	
	  // class OTServerModel {
	  //   handle(clientMessage): ServerEditMessage[]
	  // }
	
	  // USAGE: (w/ an imaginary 'connection' object)
	
	  // let server = new OTServerModel(...)
	  // let serverDocs = {...}
	  //
	  // connection.on('update', (clientMessage) => { // LISTEN for remote changes
	  //   let serverMessages = server.handle(clientMessage)
	  //
	  //   for (let serverMessage of serverMessages)
	  //     connection.broadcast(serverMessage) // SEND applied changes
	  // })
	
	  function OTServerModel(doc) {
	    (0, _classCallCheck3.default)(this, OTServerModel);
	
	    if (doc) {
	      this.doc = doc;
	    } else {
	      this.doc = new InMemoryDocument();
	    }
	
	    this.changeListeners = [];
	  }
	
	  (0, _createClass3.default)(OTServerModel, [{
	    key: 'state',
	    value: function state() {
	      return this.doc.text;
	    }
	  }, {
	    key: 'addChangeListener',
	    value: function addChangeListener(listener) {
	      this.changeListeners.push(listener);
	    }
	  }, {
	    key: '_notifyChangeListeners',
	    value: function _notifyChangeListeners() {
	      var _this = this;
	
	      setTimeout(function () {
	        var _iteratorNormalCompletion = true;
	        var _didIteratorError = false;
	        var _iteratorError = undefined;
	
	        try {
	          for (var _iterator = (0, _getIterator3.default)(_this.changeListeners), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var listener = _step.value;
	
	            listener();
	          }
	        } catch (err) {
	          _didIteratorError = true;
	          _iteratorError = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion && _iterator.return) {
	              _iterator.return();
	            }
	          } finally {
	            if (_didIteratorError) {
	              throw _iteratorError;
	            }
	          }
	        }
	      }, 0);
	    }
	  }, {
	    key: '_handleClientEdit',
	    value: function _handleClientEdit(clientMessage) {
	      // update the server state & return the update to broadcast to the clients
	
	      // a = clientMessage
	      // b = historyEdit
	
	      // aP = serverUpdate to broadcast to the clients
	
	      //   a /\ b
	      //    /  \
	      // bP \  / aP
	      var clientEdit = clientMessage.edit;
	      var sourceUid = clientMessage.sourceUid;
	
	      var editId = clientEdit.id;
	
	      // this was already applied!
	      if (this.doc.hasEdit(editId)) {
	        var _serverEdit = this.doc.getEdit(editId);
	        if (_serverEdit == null) {
	          throw new Error('wat, server edit should exist: ' + editId);
	        }
	        return {
	          kind: 'ServerEditMessage',
	          edit: _serverEdit
	        };
	      }
	
	      // apply the new update now
	      var historyEdit = this.doc.getEditRange(clientEdit.startIndex);
	
	      var a = clientEdit,
	          b = historyEdit;
	
	      var _OTHelper$transformAn = OTHelper.transformAndApplyToServer(_applier.TextApplier, a, b, this.doc.text),
	          _OTHelper$transformAn2 = (0, _slicedToArray3.default)(_OTHelper$transformAn, 4),
	          aP = _OTHelper$transformAn2[0],
	          bP = _OTHelper$transformAn2[1],
	          undo = _OTHelper$transformAn2[2],
	          newState = _OTHelper$transformAn2[3];
	
	      aP.startIndex = this.doc.getNextIndex();
	      aP.nextIndex = aP.startIndex + 1;
	
	      var serverEdit = (0, _edit_types.castServerEdit)(aP);
	
	      this.doc.update(newState, serverEdit);
	      this._notifyChangeListeners();
	
	      return {
	        kind: 'ServerEditMessage',
	        edit: serverEdit
	      };
	    }
	  }, {
	    key: '_handleClientHistoryRequest',
	    value: function _handleClientHistoryRequest(clientHistoryRequest) {
	      var sourceUid = clientHistoryRequest.sourceUid;
	
	      // get the history starting at this index
	      var startIndex = clientHistoryRequest.nextIndex;
	      var responses = [];
	
	      for (var i = startIndex; i < this.doc.getNumEdits(); i++) {
	        responses.push({
	          kind: 'ServerEditMessage',
	          edit: this.doc.getEditAt(i)
	        });
	      }
	
	      return responses;
	    }
	  }, {
	    key: 'handle',
	    value: function handle(clientMessage) {
	      if (clientMessage.kind === 'ClientEditMessage') {
	        return [this._handleClientEdit(clientMessage)];
	      }
	
	      if (clientMessage.kind === 'ClientRequestHistory') {
	        return this._handleClientHistoryRequest(clientMessage);
	      }
	
	      throw new Error('wat');
	    }
	  }]);
	  return OTServerModel;
	}();

/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(143), __esModule: true };

/***/ },
/* 143 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(8);
	__webpack_require__(9);
	__webpack_require__(53);
	__webpack_require__(144);
	__webpack_require__(150);
	module.exports = __webpack_require__(17).Set;

/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var strong = __webpack_require__(145);
	
	// 23.2 Set Objects
	module.exports = __webpack_require__(146)('Set', function(get){
	  return function Set(){ return get(this, arguments.length > 0 ? arguments[0] : undefined); };
	}, {
	  // 23.2.3.1 Set.prototype.add(value)
	  add: function add(value){
	    return strong.def(this, value = value === 0 ? 0 : value, value);
	  }
	}, strong);

/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var dP          = __webpack_require__(21).f
	  , create      = __webpack_require__(34)
	  , redefineAll = __webpack_require__(68)
	  , ctx         = __webpack_require__(18)
	  , anInstance  = __webpack_require__(59)
	  , defined     = __webpack_require__(12)
	  , forOf       = __webpack_require__(60)
	  , $iterDefine = __webpack_require__(13)
	  , step        = __webpack_require__(56)
	  , setSpecies  = __webpack_require__(69)
	  , DESCRIPTORS = __webpack_require__(25)
	  , fastKey     = __webpack_require__(109).fastKey
	  , SIZE        = DESCRIPTORS ? '_s' : 'size';
	
	var getEntry = function(that, key){
	  // fast case
	  var index = fastKey(key), entry;
	  if(index !== 'F')return that._i[index];
	  // frozen object case
	  for(entry = that._f; entry; entry = entry.n){
	    if(entry.k == key)return entry;
	  }
	};
	
	module.exports = {
	  getConstructor: function(wrapper, NAME, IS_MAP, ADDER){
	    var C = wrapper(function(that, iterable){
	      anInstance(that, C, NAME, '_i');
	      that._i = create(null); // index
	      that._f = undefined;    // first entry
	      that._l = undefined;    // last entry
	      that[SIZE] = 0;         // size
	      if(iterable != undefined)forOf(iterable, IS_MAP, that[ADDER], that);
	    });
	    redefineAll(C.prototype, {
	      // 23.1.3.1 Map.prototype.clear()
	      // 23.2.3.2 Set.prototype.clear()
	      clear: function clear(){
	        for(var that = this, data = that._i, entry = that._f; entry; entry = entry.n){
	          entry.r = true;
	          if(entry.p)entry.p = entry.p.n = undefined;
	          delete data[entry.i];
	        }
	        that._f = that._l = undefined;
	        that[SIZE] = 0;
	      },
	      // 23.1.3.3 Map.prototype.delete(key)
	      // 23.2.3.4 Set.prototype.delete(value)
	      'delete': function(key){
	        var that  = this
	          , entry = getEntry(that, key);
	        if(entry){
	          var next = entry.n
	            , prev = entry.p;
	          delete that._i[entry.i];
	          entry.r = true;
	          if(prev)prev.n = next;
	          if(next)next.p = prev;
	          if(that._f == entry)that._f = next;
	          if(that._l == entry)that._l = prev;
	          that[SIZE]--;
	        } return !!entry;
	      },
	      // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
	      // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
	      forEach: function forEach(callbackfn /*, that = undefined */){
	        anInstance(this, C, 'forEach');
	        var f = ctx(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3)
	          , entry;
	        while(entry = entry ? entry.n : this._f){
	          f(entry.v, entry.k, this);
	          // revert to the last existing entry
	          while(entry && entry.r)entry = entry.p;
	        }
	      },
	      // 23.1.3.7 Map.prototype.has(key)
	      // 23.2.3.7 Set.prototype.has(value)
	      has: function has(key){
	        return !!getEntry(this, key);
	      }
	    });
	    if(DESCRIPTORS)dP(C.prototype, 'size', {
	      get: function(){
	        return defined(this[SIZE]);
	      }
	    });
	    return C;
	  },
	  def: function(that, key, value){
	    var entry = getEntry(that, key)
	      , prev, index;
	    // change existing entry
	    if(entry){
	      entry.v = value;
	    // create new entry
	    } else {
	      that._l = entry = {
	        i: index = fastKey(key, true), // <- index
	        k: key,                        // <- key
	        v: value,                      // <- value
	        p: prev = that._l,             // <- previous entry
	        n: undefined,                  // <- next entry
	        r: false                       // <- removed
	      };
	      if(!that._f)that._f = entry;
	      if(prev)prev.n = entry;
	      that[SIZE]++;
	      // add to index
	      if(index !== 'F')that._i[index] = entry;
	    } return that;
	  },
	  getEntry: getEntry,
	  setStrong: function(C, NAME, IS_MAP){
	    // add .keys, .values, .entries, [@@iterator]
	    // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
	    $iterDefine(C, NAME, function(iterated, kind){
	      this._t = iterated;  // target
	      this._k = kind;      // kind
	      this._l = undefined; // previous
	    }, function(){
	      var that  = this
	        , kind  = that._k
	        , entry = that._l;
	      // revert to the last existing entry
	      while(entry && entry.r)entry = entry.p;
	      // get next entry
	      if(!that._t || !(that._l = entry = entry ? entry.n : that._t._f)){
	        // or finish the iteration
	        that._t = undefined;
	        return step(1);
	      }
	      // return step by kind
	      if(kind == 'keys'  )return step(0, entry.k);
	      if(kind == 'values')return step(0, entry.v);
	      return step(0, [entry.k, entry.v]);
	    }, IS_MAP ? 'entries' : 'values' , !IS_MAP, true);
	
	    // add [@@species], 23.1.2.2, 23.2.2.2
	    setSpecies(NAME);
	  }
	};

/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var global         = __webpack_require__(16)
	  , $export        = __webpack_require__(15)
	  , meta           = __webpack_require__(109)
	  , fails          = __webpack_require__(26)
	  , hide           = __webpack_require__(20)
	  , redefineAll    = __webpack_require__(68)
	  , forOf          = __webpack_require__(60)
	  , anInstance     = __webpack_require__(59)
	  , isObject       = __webpack_require__(23)
	  , setToStringTag = __webpack_require__(49)
	  , dP             = __webpack_require__(21).f
	  , each           = __webpack_require__(147)(0)
	  , DESCRIPTORS    = __webpack_require__(25);
	
	module.exports = function(NAME, wrapper, methods, common, IS_MAP, IS_WEAK){
	  var Base  = global[NAME]
	    , C     = Base
	    , ADDER = IS_MAP ? 'set' : 'add'
	    , proto = C && C.prototype
	    , O     = {};
	  if(!DESCRIPTORS || typeof C != 'function' || !(IS_WEAK || proto.forEach && !fails(function(){
	    new C().entries().next();
	  }))){
	    // create collection constructor
	    C = common.getConstructor(wrapper, NAME, IS_MAP, ADDER);
	    redefineAll(C.prototype, methods);
	    meta.NEED = true;
	  } else {
	    C = wrapper(function(target, iterable){
	      anInstance(target, C, NAME, '_c');
	      target._c = new Base;
	      if(iterable != undefined)forOf(iterable, IS_MAP, target[ADDER], target);
	    });
	    each('add,clear,delete,forEach,get,has,set,keys,values,entries,toJSON'.split(','),function(KEY){
	      var IS_ADDER = KEY == 'add' || KEY == 'set';
	      if(KEY in proto && !(IS_WEAK && KEY == 'clear'))hide(C.prototype, KEY, function(a, b){
	        anInstance(this, C, KEY);
	        if(!IS_ADDER && IS_WEAK && !isObject(a))return KEY == 'get' ? undefined : false;
	        var result = this._c[KEY](a === 0 ? 0 : a, b);
	        return IS_ADDER ? this : result;
	      });
	    });
	    if('size' in proto)dP(C.prototype, 'size', {
	      get: function(){
	        return this._c.size;
	      }
	    });
	  }
	
	  setToStringTag(C, NAME);
	
	  O[NAME] = C;
	  $export($export.G + $export.W + $export.F, O);
	
	  if(!IS_WEAK)common.setStrong(C, NAME, IS_MAP);
	
	  return C;
	};

/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

	// 0 -> Array#forEach
	// 1 -> Array#map
	// 2 -> Array#filter
	// 3 -> Array#some
	// 4 -> Array#every
	// 5 -> Array#find
	// 6 -> Array#findIndex
	var ctx      = __webpack_require__(18)
	  , IObject  = __webpack_require__(39)
	  , toObject = __webpack_require__(52)
	  , toLength = __webpack_require__(42)
	  , asc      = __webpack_require__(148);
	module.exports = function(TYPE, $create){
	  var IS_MAP        = TYPE == 1
	    , IS_FILTER     = TYPE == 2
	    , IS_SOME       = TYPE == 3
	    , IS_EVERY      = TYPE == 4
	    , IS_FIND_INDEX = TYPE == 6
	    , NO_HOLES      = TYPE == 5 || IS_FIND_INDEX
	    , create        = $create || asc;
	  return function($this, callbackfn, that){
	    var O      = toObject($this)
	      , self   = IObject(O)
	      , f      = ctx(callbackfn, that, 3)
	      , length = toLength(self.length)
	      , index  = 0
	      , result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined
	      , val, res;
	    for(;length > index; index++)if(NO_HOLES || index in self){
	      val = self[index];
	      res = f(val, index, O);
	      if(TYPE){
	        if(IS_MAP)result[index] = res;            // map
	        else if(res)switch(TYPE){
	          case 3: return true;                    // some
	          case 5: return val;                     // find
	          case 6: return index;                   // findIndex
	          case 2: result.push(val);               // filter
	        } else if(IS_EVERY)return false;          // every
	      }
	    }
	    return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
	  };
	};

/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

	// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
	var speciesConstructor = __webpack_require__(149);
	
	module.exports = function(original, length){
	  return new (speciesConstructor(original))(length);
	};

/***/ },
/* 149 */
/***/ function(module, exports, __webpack_require__) {

	var isObject = __webpack_require__(23)
	  , isArray  = __webpack_require__(113)
	  , SPECIES  = __webpack_require__(50)('species');
	
	module.exports = function(original){
	  var C;
	  if(isArray(original)){
	    C = original.constructor;
	    // cross-realm fallback
	    if(typeof C == 'function' && (C === Array || isArray(C.prototype)))C = undefined;
	    if(isObject(C)){
	      C = C[SPECIES];
	      if(C === null)C = undefined;
	    }
	  } return C === undefined ? Array : C;
	};

/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var $export  = __webpack_require__(15);
	
	$export($export.P + $export.R, 'Set', {toJSON: __webpack_require__(151)('Set')});

/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

	// https://github.com/DavidBruant/Map-Set.prototype.toJSON
	var classof = __webpack_require__(58)
	  , from    = __webpack_require__(152);
	module.exports = function(NAME){
	  return function toJSON(){
	    if(classof(this) != NAME)throw TypeError(NAME + "#toJSON isn't generic");
	    return from(this);
	  };
	};

/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

	var forOf = __webpack_require__(60);
	
	module.exports = function(iter, ITERATOR){
	  var result = [];
	  forOf(iter, false, result.push, result, ITERATOR);
	  return result;
	};


/***/ },
/* 153 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.SimulatedController = undefined;
	
	var _regenerator = __webpack_require__(1);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _asyncToGenerator2 = __webpack_require__(5);
	
	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);
	
	var _slicedToArray2 = __webpack_require__(71);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _getIterator2 = __webpack_require__(75);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	var _utils = __webpack_require__(78);
	
	var U = _interopRequireWildcard(_utils);
	
	var _ot_client_model = __webpack_require__(133);
	
	var _ot_server_model = __webpack_require__(141);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var SimulatedController = exports.SimulatedController = function () {
	
	  // whether this client needs to reconnect
	
	  // queues for the server
	  function SimulatedController(delay) {
	    (0, _classCallCheck3.default)(this, SimulatedController);
	
	    this.server = undefined;
	    this.clients = {};
	
	    this.serverQueue = [];
	    this.clientQueues = {};
	
	    this.clientNeedsHistory = {};
	
	    this.delay = delay;
	  }
	
	  // messages being sent to the clients
	
	
	  (0, _createClass3.default)(SimulatedController, [{
	    key: '_serverThink',
	    value: function _serverThink() {
	      var clientMessage = this.serverQueue.shift();
	      if (this.server == null || clientMessage == null) {
	        return;
	      }
	
	      var responses = this.server.handle(clientMessage);
	
	      if (clientMessage.kind === 'ClientRequestHistory') {
	        var _iteratorNormalCompletion = true;
	        var _didIteratorError = false;
	        var _iteratorError = undefined;
	
	        try {
	          for (var _iterator = (0, _getIterator3.default)(responses), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	            var response = _step.value;
	
	            var queue = this.clientQueues[clientMessage.sourceUid];
	            if (queue != null) {
	              queue.push(response);
	            }
	          }
	        } catch (err) {
	          _didIteratorError = true;
	          _iteratorError = err;
	        } finally {
	          try {
	            if (!_iteratorNormalCompletion && _iterator.return) {
	              _iterator.return();
	            }
	          } finally {
	            if (_didIteratorError) {
	              throw _iteratorError;
	            }
	          }
	        }
	      } else if (clientMessage.kind === 'ClientEditMessage') {
	        for (var _clientUid in this.clientQueues) {
	          var _iteratorNormalCompletion2 = true;
	          var _didIteratorError2 = false;
	          var _iteratorError2 = undefined;
	
	          try {
	            for (var _iterator2 = (0, _getIterator3.default)(responses), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	              var _response = _step2.value;
	
	              this.clientQueues[_clientUid].push(_response);
	            }
	          } catch (err) {
	            _didIteratorError2 = true;
	            _iteratorError2 = err;
	          } finally {
	            try {
	              if (!_iteratorNormalCompletion2 && _iterator2.return) {
	                _iterator2.return();
	              }
	            } finally {
	              if (_didIteratorError2) {
	                throw _iteratorError2;
	              }
	            }
	          }
	        }
	      } else {
	        throw new Error('wat');
	      }
	    }
	  }, {
	    key: '_clientThink',
	    value: function _clientThink(clientUid) {
	      var client = this.clients[clientUid];
	
	      // reconnect if necessary
	      if (this.clientNeedsHistory[clientUid] == true) {
	        this.clientNeedsHistory[clientUid] = false;
	
	        var _client$generateHisto = client.generateHistoryRequest(),
	            _client$generateHisto2 = (0, _slicedToArray3.default)(_client$generateHisto, 2),
	            request = _client$generateHisto2[0],
	            message = _client$generateHisto2[1];
	
	        this.send(client, request);
	        if (message != null) {
	          this.send(client, message);
	        }
	        return;
	      }
	
	      var serverMessage = this.clientQueues[clientUid].shift();
	      if (client == null || serverMessage == null) {
	        return;
	      }
	
	      try {
	        // apply the edit
	        var response = client.handle(serverMessage);
	        if (response != null) {
	          this.serverQueue.push(response);
	        }
	
	        // successful edit applied! we're synced :)
	        this.clientNeedsHistory[clientUid] = false;
	      } catch (e) {
	        if (!(e instanceof _ot_client_model.OutOfOrderError)) {
	          throw e;
	        }
	
	        // failed to apply edit! we're out of sync
	        this.clientNeedsHistory[clientUid] = true;
	      }
	    }
	  }, {
	    key: 'loop',
	    value: function loop() {
	      var _this = this;
	
	      ;(0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
	        var _clientUid2;
	
	        return _regenerator2.default.wrap(function _callee$(_context) {
	          while (1) {
	            switch (_context.prev = _context.next) {
	              case 0:
	                if (false) {
	                  _context.next = 9;
	                  break;
	                }
	
	                _context.next = 3;
	                return U.asyncSleep(Math.random() * (_this.delay.maxDelay - _this.delay.minDelay) + _this.delay.minDelay);
	
	              case 3:
	                for (_clientUid2 in _this.clientQueues) {
	                  _this._clientThink(_clientUid2);
	                }
	
	                _context.next = 6;
	                return U.asyncSleep(Math.random() * (_this.delay.maxDelay - _this.delay.minDelay) + _this.delay.minDelay);
	
	              case 6:
	                _this._serverThink();
	                _context.next = 0;
	                break;
	
	              case 9:
	              case 'end':
	                return _context.stop();
	            }
	          }
	        }, _callee, _this);
	      }))();
	    }
	  }, {
	    key: 'connectClient',
	    value: function connectClient(client) {
	      this.clients[client.uid] = client;
	      this.clientNeedsHistory[client.uid] = true;
	      this.clientQueues[client.uid] = [];
	    }
	  }, {
	    key: 'disconnectClient',
	    value: function disconnectClient(client) {
	      delete this.clients[client.uid];
	      delete this.clientQueues[client.uid];
	      delete this.clientNeedsHistory[client.uid];
	    }
	  }, {
	    key: 'connectServer',
	    value: function connectServer(server) {
	      this.server = server;
	      this.serverQueue = [];
	    }
	  }, {
	    key: 'disconnectServer',
	    value: function disconnectServer(server) {
	      this.server = undefined;
	      this.serverQueue = [];
	    }
	  }, {
	    key: 'send',
	    value: function send(client, message) {
	      this.serverQueue.push(message);
	    }
	  }]);
	  return SimulatedController;
	}();

/***/ }
/******/ ]);
//# sourceMappingURL=demo-textarea.js.map