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
	
	var _assign = __webpack_require__(71);
	
	var _assign2 = _interopRequireDefault(_assign);
	
	var _slicedToArray2 = __webpack_require__(77);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _utils = __webpack_require__(84);
	
	var _wu = __webpack_require__(93);
	
	var _observe = __webpack_require__(94);
	
	var _orchestrator = __webpack_require__(95);
	
	var _text_operations = __webpack_require__(101);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function generateLock() {
	  return { ignoreEvents: false };
	}
	
	function getValuesFromDOMTextbox($text) {
	  return [$text.val(), $text.prop("selectionStart"), $text.prop("selectionEnd")];
	}
	
	function updateDOMTextbox($text, state) {
	  // cursorStart: number, cursorEnd: number
	  $text.val(state.text);
	  $text.prop("selectionStart", state.cursor.start), $text.prop("selectionEnd", state.cursor.end);
	}
	
	function setupClient(applier, inferrer, orchestrator, client, propogate, $text, delay) {
	  var lock = generateLock();
	
	  var update = function update() {
	    // update the dom
	    lock.ignoreEvents = true;
	    updateDOMTextbox($text, client.state);
	    lock.ignoreEvents = false;
	  };
	
	  (0, _observe.observeObject)(client, function (_, key) {// added
	  }, function (_, key) {// deleted
	  }, function (_, key) {
	    // changed
	    update();
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
	
	
	    var op = inferrer.inferOps(client.state.text, newText);
	    if (op != null) {
	      (function () {
	        var request = orchestrator.clientLocalOperation(client, op);
	        setTimeout(function () {
	          return propogate(request);
	        }, delay.minDelay + (delay.maxDelay - delay.minDelay) * Math.random());
	      })();
	    }
	
	    // handle new cursor
	    client.state.cursor.start = newCursorStart;
	    client.state.cursor.end = newCursorEnd;
	
	    update();
	  });
	}
	
	function createServerDOM(title) {
	  var $server = $('<div class="computer">\n    <h4>' + title + '</h4>\n    <textarea readonly class="text" rows="4" cols="50"></textarea>\n    <div>~ <input type="number" class="delay" value="1000"> ms latency</div>\n  </div>');
	
	  var $text = $server.find('.text');
	  var $delay = $server.find('.delay');
	  var delay = createBoundDelay($delay);
	
	  return [$server, $text, delay];
	}
	
	function createClientDOM(title, randomizeChecked) {
	  randomizeChecked = randomizeChecked ? 'checked' : '';
	
	  var $client = $('<div class="computer">\n    <h4>' + title + ' <span class="converging ellipses"></span></h4>\n  \t<textarea class="text" rows="4" cols="50"></textarea>\n  \t<div><input type="checkbox" ' + randomizeChecked + ' class="randomize"> randomly edit</div>\n  </div>');
	  var $text = $client.find('.text');
	  var $randomize = $client.find('.randomize');
	
	  ellipsize($client);
	
	  var shouldRandomize = createBoundObject(function () {
	    return {
	      enabled: $randomize[0].checked
	    };
	  }, function (f) {
	    return $randomize.change(f);
	  });
	
	  return [$client, $text, shouldRandomize];
	}
	
	function createBoundDelay($delay) {
	  var delay = createBoundObject(function () {
	    return {
	      minDelay: Math.max(0, parseInt($delay.val()) - 500),
	      maxDelay: parseInt($delay.val())
	    };
	  }, function (f) {
	    return $delay.change(f);
	  }, {
	    validate: function validate(obj) {
	      return obj.minDelay <= obj.maxDelay;
	    },
	    reset: function reset(obj) {
	      return $delay.val(obj.maxDelay);
	    }
	  });
	  return delay;
	}
	
	function createBoundObject(generate, listener, validator) {
	  var object = generate();
	  listener(function () {
	    var newObject = generate();
	    if (validator === undefined || validator.validate(newObject)) {
	      (0, _assign2.default)(object, newObject);
	    } else {
	      validator.reset(object);
	    }
	  });
	
	  return object;
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
	
	  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
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
	
	function ellipsize($el) {
	  var _this2 = this;
	
	  var $ellipses = $el.find('.ellipses');
	
	  (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2() {
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
	
	$(document).ready(function () {
	  // stuff to dependency inject
	  var transformer = new _text_operations.SuboperationsTransformer(_text_operations.retainFactory);
	  var applier = new _text_operations.TextApplier();
	  var inferrer = new _text_operations.SimpleTextInferrer();
	  var orchestrator = new _orchestrator.Orchestrator(transformer, applier);
	
	  // client containers
	  var $computers = $('#computers');
	  var clients = [];
	
	  // server
	
	  var _createServerDOM = createServerDOM("Server"),
	      _createServerDOM2 = (0, _slicedToArray3.default)(_createServerDOM, 3),
	      $server = _createServerDOM2[0],
	      $serverText = _createServerDOM2[1],
	      delay = _createServerDOM2[2];
	
	  $computers.prepend($server);
	
	  var server = (0, _orchestrator.generateServer)({ cursor: { start: 0, end: 0 }, text: '' });
	  (0, _observe.observeObject)(server, function (_, key) {// added
	  }, function (_, key) {// deleted
	  }, function (_, key) {
	    // changed
	    $serverText.val(server.state.text);
	  });
	
	  // propogator between server & clients
	  var propogator = (0, _orchestrator.generateAsyncPropogator)(orchestrator, server, clients, console.log, delay);
	
	  var clientId = 1;
	  function addClient() {
	    var _this3 = this;
	
	    var _createClientDOM = createClientDOM('Client ' + clientId, clientId === 1, false),
	        _createClientDOM2 = (0, _slicedToArray3.default)(_createClientDOM, 3),
	        $client = _createClientDOM2[0],
	        $text = _createClientDOM2[1],
	        shouldRandomize = _createClientDOM2[2];
	
	    $client.insertBefore($server);
	    clientId++;
	
	    var client = (0, _orchestrator.generateClient)({ cursor: { start: 0, end: 0 }, text: '' });
	    setupClient(applier, inferrer, orchestrator, client, propogator, $text, delay);
	    randomlyAdjustText($text, shouldRandomize, 500);
	
	    clients.push(client);
	
	    (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3() {
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
	              if (client.state.text === server.state.text) {
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
	
	  var $clientButton = $('#add-client');
	  $clientButton.click(function () {
	    return addClient();
	  });
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
	
	  var hasOwn = Object.prototype.hasOwnProperty;
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
	
	  var Gp = GeneratorFunctionPrototype.prototype = Generator.prototype;
	  GeneratorFunction.prototype = Gp.constructor = GeneratorFunctionPrototype;
	  GeneratorFunctionPrototype.constructor = GeneratorFunction;
	  GeneratorFunctionPrototype[toStringTagSymbol] = GeneratorFunction.displayName = "GeneratorFunction";
	
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
	  // `value instanceof AwaitArgument` to determine if the yielded value is
	  // meant to be awaited. Some may consider the name of this method too
	  // cutesy, but they are curmudgeons.
	  runtime.awrap = function(arg) {
	    return new AwaitArgument(arg);
	  };
	
	  function AwaitArgument(arg) {
	    this.arg = arg;
	  }
	
	  function AsyncIterator(generator) {
	    function invoke(method, arg, resolve, reject) {
	      var record = tryCatch(generator[method], generator, arg);
	      if (record.type === "throw") {
	        reject(record.arg);
	      } else {
	        var result = record.arg;
	        var value = result.value;
	        if (value instanceof AwaitArgument) {
	          return Promise.resolve(value.arg).then(function(value) {
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
	
	  Gp[iteratorSymbol] = function() {
	    return this;
	  };
	
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

	module.exports = { "default": __webpack_require__(72), __esModule: true };

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(73);
	module.exports = __webpack_require__(17).Object.assign;

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.3.1 Object.assign(target, source)
	var $export = __webpack_require__(15);
	
	$export($export.S + $export.F, 'Object', {assign: __webpack_require__(74)});

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	// 19.1.2.1 Object.assign(target, source, ...)
	var getKeys  = __webpack_require__(36)
	  , gOPS     = __webpack_require__(75)
	  , pIE      = __webpack_require__(76)
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
/* 75 */
/***/ function(module, exports) {

	exports.f = Object.getOwnPropertySymbols;

/***/ },
/* 76 */
/***/ function(module, exports) {

	exports.f = {}.propertyIsEnumerable;

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _isIterable2 = __webpack_require__(78);
	
	var _isIterable3 = _interopRequireDefault(_isIterable2);
	
	var _getIterator2 = __webpack_require__(81);
	
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
/* 78 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(79), __esModule: true };

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(53);
	__webpack_require__(9);
	module.exports = __webpack_require__(80);

/***/ },
/* 80 */
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
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(82), __esModule: true };

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(53);
	__webpack_require__(9);
	module.exports = __webpack_require__(83);

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

	var anObject = __webpack_require__(22)
	  , get      = __webpack_require__(63);
	module.exports = __webpack_require__(17).getIterator = function(it){
	  var iterFn = get(it);
	  if(typeof iterFn != 'function')throw TypeError(it + ' is not iterable!');
	  return anObject(iterFn.call(it));
	};

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.asyncWait = exports.Less = exports.Equal = exports.Greater = undefined;
	
	var _promise = __webpack_require__(6);
	
	var _promise2 = _interopRequireDefault(_promise);
	
	var _asyncToGenerator2 = __webpack_require__(5);
	
	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);
	
	var _keys = __webpack_require__(85);
	
	var _keys2 = _interopRequireDefault(_keys);
	
	var _slicedToArray2 = __webpack_require__(77);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _from = __webpack_require__(89);
	
	var _from2 = _interopRequireDefault(_from);
	
	var _getIterator2 = __webpack_require__(81);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _regenerator = __webpack_require__(1);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _assign = __webpack_require__(71);
	
	var _assign2 = _interopRequireDefault(_assign);
	
	var asyncWait = exports.asyncWait = function () {
	  var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(ms) {
	    return _regenerator2.default.wrap(function _callee6$(_context8) {
	      while (1) {
	        switch (_context8.prev = _context8.next) {
	          case 0:
	            return _context8.abrupt('return', new _promise2.default(function (resolve, reject) {
	              setTimeout(function () {
	                resolve();
	              }, ms);
	            }));
	
	          case 1:
	          case 'end':
	            return _context8.stop();
	        }
	      }
	    }, _callee6, this);
	  }));
	
	  return function asyncWait(_x) {
	    return _ref.apply(this, arguments);
	  };
	}();
	
	exports.reiterable = reiterable;
	exports.iterable = iterable;
	exports.genUid = genUid;
	exports.clone = clone;
	exports.merge = merge;
	exports.specificRange = specificRange;
	exports.map = map;
	exports.rearray = rearray;
	exports.restring = restring;
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
	exports.allEqual = allEqual;
	exports.characters = characters;
	exports.defaults = defaults;
	exports.substring = substring;
	exports.subarray = subarray;
	exports.removeTail = removeTail;
	exports.reverse = reverse;
	exports.findIndex = findIndex;
	exports.findLastIndex = findLastIndex;
	exports.hashCode = hashCode;
	exports.hash = hash;
	exports.last = last;
	exports.first = first;
	exports.maybeLast = maybeLast;
	exports.maybeFirst = maybeFirst;
	exports.maybePush = maybePush;
	exports.flatten = flatten;
	exports.shuffle = shuffle;
	exports.zipPairs = zipPairs;
	exports.pop = pop;
	exports.contains = contains;
	
	var _wu = __webpack_require__(93);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var _marked = [counter, allKeys].map(_regenerator2.default.mark);
	
	var Greater = exports.Greater = 1;
	var Equal = exports.Equal = 0;
	var Less = exports.Less = -1;
	
	// returns Greater if a  >  b
	//         Less    if a  <  b
	//         Equal   if a === b
	
	function reiterable(it) {
	  return function () {
	    return it;
	  };
	}
	
	function iterable(it) {
	  return it();
	}
	
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
	  return _regenerator2.default.mark(function _callee() {
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
	  });
	}
	
	function map(t1s, f) {
	  return _regenerator2.default.mark(function _callee2() {
	    var _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, _t;
	
	    return _regenerator2.default.wrap(function _callee2$(_context2) {
	      while (1) {
	        switch (_context2.prev = _context2.next) {
	          case 0:
	            _iteratorNormalCompletion = true;
	            _didIteratorError = false;
	            _iteratorError = undefined;
	            _context2.prev = 3;
	            _iterator = (0, _getIterator3.default)(t1s());
	
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
	  });
	}
	
	function rearray(is) {
	  return (0, _from2.default)(is());
	}
	
	function restring(is) {
	  return (0, _from2.default)(is()).join('');
	}
	
	function range(stop) {
	  return specificRange(0, stop, 1);
	}
	
	function reverseRange(stop) {
	  return reverseSpecificRange(0, stop, 1);
	}
	
	function reverseSpecificRange(start, stop, step) {
	  return _regenerator2.default.mark(function _callee3() {
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
	  });
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
	  var _iteratorNormalCompletion2 = true;
	  var _didIteratorError2 = false;
	  var _iteratorError2 = undefined;
	
	  try {
	    for (var _iterator2 = (0, _getIterator3.default)(s()), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	      var c = _step2.value;
	
	      length += 1;
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
	
	  return length;
	}
	
	function calculatePrefixLength(text0, text1) {
	  var _iteratorNormalCompletion3 = true;
	  var _didIteratorError3 = false;
	  var _iteratorError3 = undefined;
	
	  try {
	    for (var _iterator3 = (0, _getIterator3.default)((0, _wu.zip)((0, _wu.zipLongest)(text0(), text1()), counter())), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	      var _step3$value = (0, _slicedToArray3.default)(_step3.value, 2),
	          _step3$value$ = (0, _slicedToArray3.default)(_step3$value[0], 2),
	          c0 = _step3$value$[0],
	          c1 = _step3$value$[1],
	          _i3 = _step3$value[1];
	
	      if (c0 != c1) {
	        return _i3;
	      }
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
	  var _iteratorNormalCompletion4 = true;
	  var _didIteratorError4 = false;
	  var _iteratorError4 = undefined;
	
	  try {
	    for (var _iterator4 = (0, _getIterator3.default)(ts()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	      var _t2 = _step4.value;
	
	      if (maxT === undefined || comparitor(_t2, maxT) === Greater) {
	        maxT = _t2;
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
	
	  if (maxT === undefined) {
	    throw "Couldn't find largest element of sequence";
	  }
	
	  return maxT;
	}
	
	function allKeys(a, b) {
	  var seenKeys, _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _iterator5, _step5, key;
	
	  return _regenerator2.default.wrap(function allKeys$(_context5) {
	    while (1) {
	      switch (_context5.prev = _context5.next) {
	        case 0:
	          seenKeys = {};
	          _iteratorNormalCompletion5 = true;
	          _didIteratorError5 = false;
	          _iteratorError5 = undefined;
	          _context5.prev = 4;
	          _iterator5 = (0, _getIterator3.default)((0, _keys2.default)(a).concat((0, _keys2.default)(b)));
	
	        case 6:
	          if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
	            _context5.next = 16;
	            break;
	          }
	
	          key = _step5.value;
	
	          if (!(key in seenKeys)) {
	            _context5.next = 10;
	            break;
	          }
	
	          return _context5.abrupt('continue', 13);
	
	        case 10:
	          _context5.next = 12;
	          return key;
	
	        case 12:
	          seenKeys[key] = true;
	
	        case 13:
	          _iteratorNormalCompletion5 = true;
	          _context5.next = 6;
	          break;
	
	        case 16:
	          _context5.next = 22;
	          break;
	
	        case 18:
	          _context5.prev = 18;
	          _context5.t0 = _context5['catch'](4);
	          _didIteratorError5 = true;
	          _iteratorError5 = _context5.t0;
	
	        case 22:
	          _context5.prev = 22;
	          _context5.prev = 23;
	
	          if (!_iteratorNormalCompletion5 && _iterator5.return) {
	            _iterator5.return();
	          }
	
	        case 25:
	          _context5.prev = 25;
	
	          if (!_didIteratorError5) {
	            _context5.next = 28;
	            break;
	          }
	
	          throw _iteratorError5;
	
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
	
	function allEqual(as) {
	  var val = as[0];
	  var _iteratorNormalCompletion6 = true;
	  var _didIteratorError6 = false;
	  var _iteratorError6 = undefined;
	
	  try {
	    for (var _iterator6 = (0, _getIterator3.default)(as), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
	      var _a = _step6.value;
	
	      if (val !== _a) {
	        return false;
	      }
	    }
	  } catch (err) {
	    _didIteratorError6 = true;
	    _iteratorError6 = err;
	  } finally {
	    try {
	      if (!_iteratorNormalCompletion6 && _iterator6.return) {
	        _iterator6.return();
	      }
	    } finally {
	      if (_didIteratorError6) {
	        throw _iteratorError6;
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
	
	function defaults(t, def) {
	  if (t === undefined || t === null) {
	    return def;
	  }
	
	  return t;
	}
	
	function substring(s, opt) {
	  var start = defaults(opt.start, 0);
	  var stop = defaults(opt.stop, s.length);
	  var step = defaults(opt.step, 1);
	
	  return characters(s, specificRange(start, stop, step));
	}
	
	function subarray(arr, opt) {
	  var start = defaults(opt.start, 0);
	  var stop = defaults(opt.stop, arr.length);
	  var step = defaults(opt.step, 1);
	
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
	  var _iteratorNormalCompletion7 = true;
	  var _didIteratorError7 = false;
	  var _iteratorError7 = undefined;
	
	  try {
	    for (var _iterator7 = (0, _getIterator3.default)((0, _wu.zip)(arr, counter())), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
	      var _step7$value = (0, _slicedToArray3.default)(_step7.value, 2),
	          _t3 = _step7$value[0],
	          _i4 = _step7$value[1];
	
	      if (f(_t3)) {
	        return _i4;
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
	
	  return undefined;
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
	    var _iteratorNormalCompletion8 = true;
	    var _didIteratorError8 = false;
	    var _iteratorError8 = undefined;
	
	    try {
	      for (var _iterator8 = (0, _getIterator3.default)(subtree), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
	        var _a2 = _step8.value;
	
	        if (Array.isArray(_a2)) {
	          f(_a2);
	        } else {
	          as.push(_a2);
	        }
	      }
	    } catch (err) {
	      _didIteratorError8 = true;
	      _iteratorError8 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion8 && _iterator8.return) {
	          _iterator8.return();
	        }
	      } finally {
	        if (_didIteratorError8) {
	          throw _iteratorError8;
	        }
	      }
	    }
	  };
	
	  f(tree);
	
	  return as;
	}
	
	function shuffle(arr) {
	  var indices = (0, _from2.default)((0, _wu.take)(arr.length, counter()));
	  var i = indices.length;
	
	  while (0 !== i) {
	    var randomI = Math.floor(Math.random() * i);
	    i--;
	
	    // And swap it with the current element.
	    var value = indices[i];
	    indices[i] = indices[randomI];
	    indices[randomI] = value;
	  }
	
	  return _regenerator2.default.mark(function _callee4() {
	    var _iteratorNormalCompletion9, _didIteratorError9, _iteratorError9, _iterator9, _step9, index;
	
	    return _regenerator2.default.wrap(function _callee4$(_context6) {
	      while (1) {
	        switch (_context6.prev = _context6.next) {
	          case 0:
	            _iteratorNormalCompletion9 = true;
	            _didIteratorError9 = false;
	            _iteratorError9 = undefined;
	            _context6.prev = 3;
	            _iterator9 = (0, _getIterator3.default)(indices);
	
	          case 5:
	            if (_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done) {
	              _context6.next = 12;
	              break;
	            }
	
	            index = _step9.value;
	            _context6.next = 9;
	            return arr[index];
	
	          case 9:
	            _iteratorNormalCompletion9 = true;
	            _context6.next = 5;
	            break;
	
	          case 12:
	            _context6.next = 18;
	            break;
	
	          case 14:
	            _context6.prev = 14;
	            _context6.t0 = _context6['catch'](3);
	            _didIteratorError9 = true;
	            _iteratorError9 = _context6.t0;
	
	          case 18:
	            _context6.prev = 18;
	            _context6.prev = 19;
	
	            if (!_iteratorNormalCompletion9 && _iterator9.return) {
	              _iterator9.return();
	            }
	
	          case 21:
	            _context6.prev = 21;
	
	            if (!_didIteratorError9) {
	              _context6.next = 24;
	              break;
	            }
	
	            throw _iteratorError9;
	
	          case 24:
	            return _context6.finish(21);
	
	          case 25:
	            return _context6.finish(18);
	
	          case 26:
	          case 'end':
	            return _context6.stop();
	        }
	      }
	    }, _callee4, this, [[3, 14, 18, 26], [19,, 21, 25]]);
	  });
	}
	
	function zipPairs(arr) {
	  return _regenerator2.default.mark(function _callee5() {
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
	  });
	}
	
	function pop(arr, f) {
	  for (var _i8 = 0; _i8 < arr.length; _i8++) {
	    if (f(arr[_i8])) {
	      var _t4 = arr[_i8];
	      arr.splice(_i8, 1);
	      return _t4;
	    }
	  }
	  return undefined;
	}
	
	function contains(arr, t) {
	  for (var _i9 = 0; _i9 < arr.length; _i9++) {
	    if (t === arr[_i9]) {
	      return true;
	    }
	  }
	  return false;
	}

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(86), __esModule: true };

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(87);
	module.exports = __webpack_require__(17).Object.keys;

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

	// 19.1.2.14 Object.keys(O)
	var toObject = __webpack_require__(52)
	  , $keys    = __webpack_require__(36);
	
	__webpack_require__(88)('keys', function(){
	  return function keys(it){
	    return $keys(toObject(it));
	  };
	});

/***/ },
/* 88 */
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
/* 89 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = { "default": __webpack_require__(90), __esModule: true };

/***/ },
/* 90 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(9);
	__webpack_require__(91);
	module.exports = __webpack_require__(17).Array.from;

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var ctx            = __webpack_require__(18)
	  , $export        = __webpack_require__(15)
	  , toObject       = __webpack_require__(52)
	  , call           = __webpack_require__(61)
	  , isArrayIter    = __webpack_require__(62)
	  , toLength       = __webpack_require__(42)
	  , createProperty = __webpack_require__(92)
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
/* 92 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	var $defineProperty = __webpack_require__(21)
	  , createDesc      = __webpack_require__(29);
	
	module.exports = function(object, index, value){
	  if(index in object)$defineProperty.f(object, index, createDesc(0, value));
	  else object[index] = value;
	};

/***/ },
/* 93 */
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
/* 94 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	
	var _getIterator2 = __webpack_require__(81);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	exports.unobserveArray = unobserveArray;
	exports.unobserveObject = unobserveObject;
	exports.observeArray = observeArray;
	exports.observeEach = observeEach;
	exports.observeObject = observeObject;
	exports.autoFill = autoFill;
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function unobserveArray(array, observer) {
	  Array.unobserve(array, observer);
	}
	
	function unobserveObject(object, observer) {
	  Object.unobserve(object, observer);
	}
	
	function observeArray(objects, onAdd, onRemove) {
	  var observer = function observer(changes) {
	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;
	
	    try {
	      for (var _iterator = (0, _getIterator3.default)(changes), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	        var change = _step.value;
	
	        if (change.type === 'splice') {
	          var _iteratorNormalCompletion2 = true;
	          var _didIteratorError2 = false;
	          var _iteratorError2 = undefined;
	
	          try {
	            for (var _iterator2 = (0, _getIterator3.default)(change.removed), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	              var removed = _step2.value;
	
	              onRemove(removed);
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
	
	          for (var i = 0; i < change.addedCount; i++) {
	            onAdd(objects[change.index + i]);
	          }
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
	  };
	  Array.observe(objects, observer);
	  return observer;
	}
	
	function observeEach(objects, map) {
	  observeArray(objects, function (o) {
	    return map(o);
	  }, function (o) {});
	  var _iteratorNormalCompletion3 = true;
	  var _didIteratorError3 = false;
	  var _iteratorError3 = undefined;
	
	  try {
	    for (var _iterator3 = (0, _getIterator3.default)(objects), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	      var o = _step3.value;
	
	      map(o);
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
	}
	
	function observeObject(object, onKeyAdded, onKeyRemoved, onKeyChanged) {
	  var observer = function observer(changes) {
	    var _iteratorNormalCompletion4 = true;
	    var _didIteratorError4 = false;
	    var _iteratorError4 = undefined;
	
	    try {
	      for (var _iterator4 = (0, _getIterator3.default)(changes), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	        var change = _step4.value;
	
	        if (change.type === 'add') {
	          onKeyAdded(object, change.name);
	        }
	        if (change.type === 'update') {
	          onKeyChanged(object, change.name);
	        }
	        if (change.type === 'delete') {
	          onKeyRemoved(object, change.name);
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
	  };
	  Object.observe(object, observer);
	  return observer;
	}
	
	function autoFill(source, destination, key, val) {
	  if (val === undefined) {
	    val = function val(t) {
	      return t;
	    };
	  }
	  var _iteratorNormalCompletion5 = true;
	  var _didIteratorError5 = false;
	  var _iteratorError5 = undefined;
	
	  try {
	    for (var _iterator5 = (0, _getIterator3.default)(source), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	      var _t = _step5.value;
	
	      destination[key(_t)] = val(_t);
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
	
	  observeArray(source, function (t) {
	    return destination[key(t)] = val(t);
	  }, function (t) {
	    return delete destination[key(t)];
	  });
	}

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.Orchestrator = undefined;
	
	var _promise = __webpack_require__(6);
	
	var _promise2 = _interopRequireDefault(_promise);
	
	var _getIterator2 = __webpack_require__(81);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _regenerator = __webpack_require__(1);
	
	var _regenerator2 = _interopRequireDefault(_regenerator);
	
	var _asyncToGenerator2 = __webpack_require__(5);
	
	var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);
	
	var _from = __webpack_require__(89);
	
	var _from2 = _interopRequireDefault(_from);
	
	var _slicedToArray2 = __webpack_require__(77);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	exports.generateServer = generateServer;
	exports.generateClient = generateClient;
	exports.generateAsyncPropogator = generateAsyncPropogator;
	exports.generatePropogator = generatePropogator;
	
	var _observe = __webpack_require__(94);
	
	var _utils = __webpack_require__(84);
	
	var _wu = __webpack_require__(93);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var Orchestrator = exports.Orchestrator = function () {
	  function Orchestrator(transformer, applier) {
	    (0, _classCallCheck3.default)(this, Orchestrator);
	
	    this.transformer = transformer;
	    this.applier = applier;
	  }
	
	  (0, _createClass3.default)(Orchestrator, [{
	    key: '_currentStateString',
	    value: function _currentStateString(site) {
	      return this.applier.stateString(site.state);
	    }
	  }, {
	    key: '_serverTransform',
	    value: function _serverTransform(clientOp, serverOp) {
	      // returns new op
	      if (clientOp.parentState !== serverOp.parentState) {
	        throw new Error('wat, to transform, they must have the same parent');
	      }
	
	      var _transformer$transfor = this.transformer.transform(clientOp.operation, serverOp.operation),
	          _transformer$transfor2 = (0, _slicedToArray3.default)(_transformer$transfor, 2),
	          newO = _transformer$transfor2[0],
	          _ = _transformer$transfor2[1];
	
	      return { // new operation to apply
	        operationId: clientOp.operationId,
	        parentState: serverOp.childState,
	        operation: newO
	      };
	    }
	  }, {
	    key: '_clientTransformWithBuffers',
	    value: function _clientTransformWithBuffers(prebufferOp, bufferOp, serverOp) {
	      // returns [newPrebuffer, newBuffer, newOp]
	      if (prebufferOp && serverOp && prebufferOp.parentState !== serverOp.parentState) {
	        throw new Error('wat, to transform prebuffer there must be the same parent');
	      }
	
	      var prebufferO = (prebufferOp || {}).operation;
	      var bufferO = (bufferOp || {}).operation;
	      var bridgeO = this.transformer.composeNullable(prebufferO, bufferO);
	      var serverO = serverOp.operation;
	
	      var _transformer$transfor3 = this.transformer.transformNullable(bridgeO, serverO),
	          _transformer$transfor4 = (0, _slicedToArray3.default)(_transformer$transfor3, 2),
	          newBridgeO = _transformer$transfor4[0],
	          newO = _transformer$transfor4[1];
	
	      var _transformer$transfor5 = this.transformer.transformNullable(prebufferO, serverO),
	          _transformer$transfor6 = (0, _slicedToArray3.default)(_transformer$transfor5, 2),
	          newPrebufferO = _transformer$transfor6[0],
	          newPartialO = _transformer$transfor6[1];
	
	      var _transformer$transfor7 = this.transformer.transformNullable(bufferO, newPartialO),
	          _transformer$transfor8 = (0, _slicedToArray3.default)(_transformer$transfor7, 2),
	          newBufferO = _transformer$transfor8[0],
	          __ = _transformer$transfor8[1];
	
	      // prebuffer begets prebuffer, buffer begets buffer, op always exists
	
	
	      if (newPrebufferO == null !== (prebufferOp == null)) {
	        throw new Error('wat');
	      }
	      if (newBufferO == null !== (bufferOp == null)) {
	        throw new Error('wat');
	      }
	      if (newO == null) {
	        throw new Error('wat');
	      }
	
	      var newPrebufferOp = void 0,
	          newBufferOp = void 0,
	          newOp = void 0;
	
	      if (prebufferOp) {
	        newPrebufferOp = (0, _utils.merge)(prebufferOp, {
	          operation: newPrebufferO,
	          parentState: serverOp.childState
	        });
	      }
	
	      if (bufferOp) {
	        newBufferOp = (0, _utils.merge)(bufferOp, {
	          operation: newBufferO
	        });
	      }
	
	      newOp = {
	        operation: newO,
	        operationId: serverOp.operationId
	      };
	
	      return [newPrebufferOp, newBufferOp, newOp];
	    }
	  }, {
	    key: '_historySince',
	    value: function _historySince(server, startState) {
	      var endState = this._currentStateString(server);
	      if (endState === startState) {
	        return [];
	      }
	
	      var i = (0, _utils.findLastIndex)(function (o) {
	        return o.parentState === startState;
	      }, server.log);
	      if (i == null) {
	        throw new Error('wat');
	      }
	
	      var ops = (0, _from2.default)((0, _utils.subarray)(server.log, { start: i })());
	      if (ops.length === 0) {
	        throw new Error('wat');
	      }
	
	      if ((0, _utils.first)(ops).parentState !== startState) {
	        throw new Error('wat');
	      }
	      if ((0, _utils.last)(ops).childState !== endState) {
	        throw new Error('wat');
	      }
	
	      return ops;
	    }
	  }, {
	    key: '_compose',
	    value: function _compose(operations) {
	      if (operations.length === 0) {
	        throw new Error('wat can\'t compose empty list');
	      }
	
	      var composedOs = this.transformer.composeMany((0, _wu.map)(function (o) {
	        return o.operation;
	      }, operations));
	      return {
	        operation: composedOs,
	        operationId: (0, _utils.genUid)()
	      };
	    }
	  }, {
	    key: '_composeChilded',
	    value: function _composeChilded(operations) {
	      var composed = this._compose(operations);
	      return (0, _utils.merge)(composed, {
	        childState: (0, _utils.last)(operations).childState
	      });
	    }
	  }, {
	    key: '_composeParented',
	    value: function _composeParented(operations) {
	      var composed = this._compose(operations);
	      return (0, _utils.merge)(composed, {
	        parentState: (0, _utils.first)(operations).parentState
	      });
	    }
	  }, {
	    key: '_composeFull',
	    value: function _composeFull(operations) {
	      var composed = this._compose(operations);
	      return (0, _utils.merge)(composed, {
	        parentState: (0, _utils.first)(operations).parentState,
	        childState: (0, _utils.last)(operations).childState
	      });
	    }
	  }, {
	    key: 'serverRemoteOperation',
	    value: function serverRemoteOperation(server, request) {
	      // return server op to broadcast
	      // grab the requested operation
	      var clientOp = request.operation;
	
	      // transform
	      var history = this._historySince(server, clientOp.parentState);
	      var transformedOp = clientOp;
	      if (history.length > 0) {
	        var historyOp = this._composeFull(history);
	        transformedOp = this._serverTransform(clientOp, historyOp);
	      }
	
	      // apply
	      var parentState = this._currentStateString(server);
	      if (transformedOp.parentState !== parentState) {
	        throw new Error();
	      }
	      server.state = this.applier.apply(server.state, transformedOp.operation);
	      var childState = this._currentStateString(server);
	
	      // save op
	      var serverOp = {
	        parentState: parentState,
	        childState: childState,
	        operation: transformedOp.operation,
	        operationId: transformedOp.operationId
	      };
	      server.log.push(serverOp);
	
	      // broadcast!
	      return {
	        kind: 'ServerRequest',
	        index: server.log.length - 1,
	        operation: serverOp
	      };
	    }
	  }, {
	    key: '_flushBuffer',
	    value: function _flushBuffer(bufferOp, bufferParent) {
	      // new request, new prebuffer
	      if (bufferOp == null) {
	        return [undefined, undefined];
	      }
	
	      var fullBufferOp = (0, _utils.merge)(bufferOp, { parentState: bufferParent });
	
	      return [{
	        kind: 'ClientRequest',
	        operation: fullBufferOp
	      }, fullBufferOp];
	    }
	  }, {
	    key: '_clientHandleRequest',
	    value: function _clientHandleRequest(client, serverRequest) {
	      var op = serverRequest.operation;
	
	      if (client.prebuffer != null && op.operationId === client.prebuffer.operationId) {
	        // this is the pre-buffer!
	        var remotePrebuffer = op;
	
	        // flush the buffer!
	
	        var _flushBuffer2 = this._flushBuffer(client.buffer, remotePrebuffer.childState),
	            _flushBuffer3 = (0, _slicedToArray3.default)(_flushBuffer2, 2),
	            _request = _flushBuffer3[0],
	            fullBuffer = _flushBuffer3[1];
	
	        // prebuffer is now the buffer
	
	
	        client.prebuffer = fullBuffer;
	        client.buffer = undefined;
	
	        return _request;
	      } else {
	        // transform the prebuffer & buffer & op
	        var _clientTransformWithB = this._clientTransformWithBuffers(client.prebuffer, client.buffer, op),
	            _clientTransformWithB2 = (0, _slicedToArray3.default)(_clientTransformWithB, 3),
	            newPrebufferOp = _clientTransformWithB2[0],
	            newBufferOp = _clientTransformWithB2[1],
	            newOp = _clientTransformWithB2[2];
	
	        // apply the operation
	
	
	        var _parentState = this._currentStateString(client);
	        client.state = this.applier.apply(client.state, newOp.operation);
	        var _childState = this._currentStateString(client);
	
	        // update prebuffer & buffer
	        client.prebuffer = newPrebufferOp;
	        client.buffer = newBufferOp;
	
	        return undefined;
	      }
	    }
	  }, {
	    key: '_clientHandleRequests',
	    value: function _clientHandleRequests(client) {
	      var clientRequests = [];
	
	      while (true) {
	        var nextServerRequest = (0, _utils.pop)(client.requestQueue, function (r) {
	          return r.index === client.nextIndex;
	        });
	
	        if (nextServerRequest == null) {
	          break;
	        }
	
	        if (client.nextIndex !== nextServerRequest.index) {
	          throw new Error('wat out of order');
	        } else {
	          // record that we're handling this request
	          client.nextIndex++;
	        }
	
	        var clientRequest = this._clientHandleRequest(client, nextServerRequest);
	        if (clientRequest != null) {
	          clientRequests.push(clientRequest);
	        }
	      }
	
	      return clientRequests;
	    }
	  }, {
	    key: 'serverGenerateSetup',
	    value: function serverGenerateSetup(server) {
	      if (server.log.length > 0) {
	        return {
	          kind: 'SetupRequest',
	          nextIndex: server.log.length - 1,
	          request: {
	            kind: 'ServerRequest',
	            operation: this._composeFull(server.log),
	            index: server.log.length - 1
	          }
	        };
	      } else {
	        return {
	          kind: 'SetupRequest',
	          nextIndex: 0,
	          request: undefined
	        };
	      }
	    }
	  }, {
	    key: 'clientApplySetup',
	    value: function clientApplySetup(client, setupRequest) {
	      // this client has already been updated, ignore
	      if (client.nextIndex !== -1) return [];
	
	      // we're about to fast-forward the client
	      client.nextIndex = setupRequest.nextIndex;
	
	      // only keep requests that happen after this fast-forwarded point
	      client.requestQueue = (0, _from2.default)((0, _wu.filter)(function (r) {
	        return r.index > client.nextIndex;
	      }, client.requestQueue));
	
	      // run the fast-forwarded request!
	      if (setupRequest.request) {
	        return this.clientRemoteOperation(client, setupRequest.request);
	      } else {
	        return this._clientHandleRequests(client);
	      }
	    }
	  }, {
	    key: 'clientRemoteOperation',
	    value: function clientRemoteOperation(client, serverRequest) {
	      // request to send to server
	      // queue request
	      client.requestQueue.push(serverRequest);
	
	      // handle all requests
	      return this._clientHandleRequests(client);
	    }
	  }, {
	    key: 'clientLocalOperation',
	    value: function clientLocalOperation(client, o) {
	      // return client op to broadcast
	      // apply the operation
	      var parentState = this._currentStateString(client);
	      client.state = this.applier.apply(client.state, o);
	      var childState = this._currentStateString(client);
	
	      // the op we just applied!
	      var op = {
	        operation: o,
	        operationId: (0, _utils.genUid)(),
	        parentState: parentState,
	        childState: childState
	      };
	
	      // append operation to buffer (& thus bridge)
	      if (client.buffer == null) {
	        client.buffer = op;
	      } else {
	        client.buffer = this._composeChilded([client.buffer, op]);
	      }
	
	      // if no prebuffer, then broadcast the buffer!
	      if (client.prebuffer == null) {
	        // flush the buffer!
	        var _flushBuffer4 = this._flushBuffer(client.buffer, parentState),
	            _flushBuffer5 = (0, _slicedToArray3.default)(_flushBuffer4, 2),
	            _request2 = _flushBuffer5[0],
	            fullBuffer = _flushBuffer5[1];
	
	        // prebuffer is now the buffer
	
	
	        client.prebuffer = fullBuffer;
	        client.buffer = undefined;
	
	        return _request2;
	      }
	
	      return undefined;
	    }
	  }]);
	  return Orchestrator;
	}();
	
	function generateServer(initialState) {
	  return {
	    uid: (0, _utils.genUid)(),
	    state: initialState,
	    log: []
	  };
	}
	
	function generateClient(initialState) {
	  return {
	    uid: (0, _utils.genUid)(),
	    state: initialState,
	
	    buffer: undefined, // the client ops not yet sent to the server
	    prebuffer: undefined, // the client op that has been sent to the server (but not yet ACKd by the server)
	    bridge: undefined, // server ops are transformed against this
	
	    requestQueue: [],
	    nextIndex: -1
	  };
	}
	
	function generateAsyncPropogator(orchestrator, server, clients, logger, opts) {
	  var _this2 = this;
	
	  // This setups a fake network between a server & multiple clients.
	  // Most of what it's doing is manually moving requests between the
	  // client and the server.
	
	  var asyncDelay = function () {
	    var _ref = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee() {
	      return _regenerator2.default.wrap(function _callee$(_context) {
	        while (1) {
	          switch (_context.prev = _context.next) {
	            case 0:
	              _context.next = 2;
	              return (0, _utils.asyncWait)(opts.minDelay + Math.random() * (opts.maxDelay - opts.minDelay));
	
	            case 2:
	            case 'end':
	              return _context.stop();
	          }
	        }
	      }, _callee, this);
	    }));
	
	    return function asyncDelay() {
	      return _ref.apply(this, arguments);
	    };
	  }();
	
	  var asyncPropogateFromServer = function () {
	    var _ref2 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee3(serverRequest) {
	      var _this = this;
	
	      var clientPromises;
	      return _regenerator2.default.wrap(function _callee3$(_context3) {
	        while (1) {
	          switch (_context3.prev = _context3.next) {
	            case 0:
	              logger('\n\nPROPOGATING SERVER REQUEST', serverRequest.operation.operationId, serverRequest.operation, '\n');
	
	              clientPromises = clients.map(function () {
	                var _ref3 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee2(client) {
	                  var clientRequests, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, clientRequest;
	
	                  return _regenerator2.default.wrap(function _callee2$(_context2) {
	                    while (1) {
	                      switch (_context2.prev = _context2.next) {
	                        case 0:
	                          _context2.next = 2;
	                          return asyncDelay();
	
	                        case 2:
	                          clientRequests = orchestrator.clientRemoteOperation(client, serverRequest);
	                          _iteratorNormalCompletion = true;
	                          _didIteratorError = false;
	                          _iteratorError = undefined;
	                          _context2.prev = 6;
	                          _iterator = (0, _getIterator3.default)(clientRequests);
	
	                        case 8:
	                          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
	                            _context2.next = 17;
	                            break;
	                          }
	
	                          clientRequest = _step.value;
	                          _context2.next = 12;
	                          return asyncDelay();
	
	                        case 12:
	                          _context2.next = 14;
	                          return asyncPropogateFromClient(clientRequest);
	
	                        case 14:
	                          _iteratorNormalCompletion = true;
	                          _context2.next = 8;
	                          break;
	
	                        case 17:
	                          _context2.next = 23;
	                          break;
	
	                        case 19:
	                          _context2.prev = 19;
	                          _context2.t0 = _context2['catch'](6);
	                          _didIteratorError = true;
	                          _iteratorError = _context2.t0;
	
	                        case 23:
	                          _context2.prev = 23;
	                          _context2.prev = 24;
	
	                          if (!_iteratorNormalCompletion && _iterator.return) {
	                            _iterator.return();
	                          }
	
	                        case 26:
	                          _context2.prev = 26;
	
	                          if (!_didIteratorError) {
	                            _context2.next = 29;
	                            break;
	                          }
	
	                          throw _iteratorError;
	
	                        case 29:
	                          return _context2.finish(26);
	
	                        case 30:
	                          return _context2.finish(23);
	
	                        case 31:
	                        case 'end':
	                          return _context2.stop();
	                      }
	                    }
	                  }, _callee2, _this, [[6, 19, 23, 31], [24,, 26, 30]]);
	                }));
	
	                return function (_x2) {
	                  return _ref3.apply(this, arguments);
	                };
	              }());
	              _context3.next = 4;
	              return _promise2.default.all(clientPromises);
	
	            case 4:
	            case 'end':
	              return _context3.stop();
	          }
	        }
	      }, _callee3, this);
	    }));
	
	    return function asyncPropogateFromServer(_x) {
	      return _ref2.apply(this, arguments);
	    };
	  }();
	
	  var asyncPropogateFromClient = function () {
	    var _ref4 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee4(clientRequest) {
	      var serverRequest;
	      return _regenerator2.default.wrap(function _callee4$(_context4) {
	        while (1) {
	          switch (_context4.prev = _context4.next) {
	            case 0:
	              logger('\n\nPROPOGATING CLIENT REQUEST', clientRequest.operation.operationId, clientRequest.operation, '\n');
	
	              serverRequest = orchestrator.serverRemoteOperation(server, clientRequest);
	              _context4.next = 4;
	              return asyncDelay();
	
	            case 4:
	              _context4.next = 6;
	              return asyncPropogateFromServer(serverRequest);
	
	            case 6:
	            case 'end':
	              return _context4.stop();
	          }
	        }
	      }, _callee4, this);
	    }));
	
	    return function asyncPropogateFromClient(_x3) {
	      return _ref4.apply(this, arguments);
	    };
	  }();
	
	  var asyncSetupClient = function () {
	    var _ref5 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee5(client) {
	      var setup, clientRequests, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, clientRequest;
	
	      return _regenerator2.default.wrap(function _callee5$(_context5) {
	        while (1) {
	          switch (_context5.prev = _context5.next) {
	            case 0:
	              setup = orchestrator.serverGenerateSetup(server);
	              _context5.next = 3;
	              return asyncDelay();
	
	            case 3:
	              clientRequests = orchestrator.clientApplySetup(client, setup);
	              _iteratorNormalCompletion2 = true;
	              _didIteratorError2 = false;
	              _iteratorError2 = undefined;
	              _context5.prev = 7;
	              _iterator2 = (0, _getIterator3.default)(clientRequests);
	
	            case 9:
	              if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
	                _context5.next = 18;
	                break;
	              }
	
	              clientRequest = _step2.value;
	              _context5.next = 13;
	              return asyncDelay();
	
	            case 13:
	              _context5.next = 15;
	              return asyncPropogateFromClient(clientRequest);
	
	            case 15:
	              _iteratorNormalCompletion2 = true;
	              _context5.next = 9;
	              break;
	
	            case 18:
	              _context5.next = 24;
	              break;
	
	            case 20:
	              _context5.prev = 20;
	              _context5.t0 = _context5['catch'](7);
	              _didIteratorError2 = true;
	              _iteratorError2 = _context5.t0;
	
	            case 24:
	              _context5.prev = 24;
	              _context5.prev = 25;
	
	              if (!_iteratorNormalCompletion2 && _iterator2.return) {
	                _iterator2.return();
	              }
	
	            case 27:
	              _context5.prev = 27;
	
	              if (!_didIteratorError2) {
	                _context5.next = 30;
	                break;
	              }
	
	              throw _iteratorError2;
	
	            case 30:
	              return _context5.finish(27);
	
	            case 31:
	              return _context5.finish(24);
	
	            case 32:
	            case 'end':
	              return _context5.stop();
	          }
	        }
	      }, _callee5, this, [[7, 20, 24, 32], [25,, 27, 31]]);
	    }));
	
	    return function asyncSetupClient(_x4) {
	      return _ref5.apply(this, arguments);
	    };
	  }();
	
	  (0, _observe.observeEach)(clients, function (client) {
	    return asyncSetupClient(client);
	  });
	
	  return function () {
	    var _ref6 = (0, _asyncToGenerator3.default)(_regenerator2.default.mark(function _callee6(clientRequest) {
	      var printClients, printServer;
	      return _regenerator2.default.wrap(function _callee6$(_context6) {
	        while (1) {
	          switch (_context6.prev = _context6.next) {
	            case 0:
	              if (!(clientRequest == null)) {
	                _context6.next = 2;
	                break;
	              }
	
	              return _context6.abrupt('return');
	
	            case 2:
	              printClients = function printClients() {
	                var _iteratorNormalCompletion3 = true;
	                var _didIteratorError3 = false;
	                var _iteratorError3 = undefined;
	
	                try {
	                  for (var _iterator3 = (0, _getIterator3.default)(clients), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	                    var c = _step3.value;
	
	                    logger("CLIENT", c.uid);
	                    logger('   prebuffer', c.prebuffer);
	                    logger('   buffer', c.buffer);
	                    logger('   state', c.state.text);
	                    logger('   next index', c.nextIndex);
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
	              };
	
	              printServer = function printServer() {
	                logger("SERVER");
	                logger('   next index', server.log.length);
	              };
	
	              printClients();
	              printServer();
	
	              _context6.next = 8;
	              return asyncPropogateFromClient(clientRequest);
	
	            case 8:
	
	              printClients();
	              printServer();
	
	            case 10:
	            case 'end':
	              return _context6.stop();
	          }
	        }
	      }, _callee6, _this2);
	    }));
	
	    return function (_x5) {
	      return _ref6.apply(this, arguments);
	    };
	  }();
	}
	
	function generatePropogator(orchestrator, server, clients) {
	  function propogateFromServer(serverRequest) {
	    if (serverRequest == null) {
	      return;
	    }
	
	    var clientRequests = [];
	
	    var _iteratorNormalCompletion4 = true;
	    var _didIteratorError4 = false;
	    var _iteratorError4 = undefined;
	
	    try {
	      for (var _iterator4 = (0, _getIterator3.default)(clients), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
	        var client = _step4.value;
	
	        clientRequests = (0, _utils.concat)(clientRequests, orchestrator.clientRemoteOperation(client, serverRequest));
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
	
	    var _iteratorNormalCompletion5 = true;
	    var _didIteratorError5 = false;
	    var _iteratorError5 = undefined;
	
	    try {
	      for (var _iterator5 = (0, _getIterator3.default)(clientRequests), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
	        var clientRequest = _step5.value;
	
	        propogateFromClient(clientRequest);
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
	  }
	
	  function propogateFromClient(request) {
	    if (request == null) {
	      return;
	    }
	    propogateFromServer(orchestrator.serverRemoteOperation(server, request));
	  }
	
	  return propogateFromClient;
	}

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

	'use strict';
	
	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.TextApplier = exports.SimpleCursorApplier = exports.SimpleTextInferrer = exports.SimpleTextApplier = exports.SuboperationsTransformer = undefined;
	
	var _getIterator2 = __webpack_require__(81);
	
	var _getIterator3 = _interopRequireDefault(_getIterator2);
	
	var _slicedToArray2 = __webpack_require__(77);
	
	var _slicedToArray3 = _interopRequireDefault(_slicedToArray2);
	
	var _classCallCheck2 = __webpack_require__(96);
	
	var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);
	
	var _createClass2 = __webpack_require__(97);
	
	var _createClass3 = _interopRequireDefault(_createClass2);
	
	exports.generateInsertion = generateInsertion;
	exports.generateDeletion = generateDeletion;
	exports.retainFactory = retainFactory;
	
	var _utils = __webpack_require__(84);
	
	var _wu = __webpack_require__(93);
	
	var _operations = __webpack_require__(102);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	//
	
	//
	
	function generateInsertion(pos, text) {
	  return [new Retain(pos), new InsertText(text)];
	}
	
	function generateDeletion(pos, n) {
	  return [new Retain(pos), new Delete(n)];
	}
	
	function retainFactory(n) {
	  return new Retain(n);
	}
	
	var InsertText = function () {
	  function InsertText(text) {
	    (0, _classCallCheck3.default)(this, InsertText);
	
	    this;
	    this.text = text;
	  }
	
	  (0, _createClass3.default)(InsertText, [{
	    key: 'toString',
	    value: function toString() {
	      return 'insert "' + this.text + '"';
	    }
	  }, {
	    key: 'kind',
	    value: function kind() {
	      return 'Insert';
	    }
	  }, {
	    key: 'split',
	    value: function split(offset) {
	      if (offset < 0 || offset > this.text.length) {
	        throw new Error();
	      }
	      return [new InsertText(this.text.substring(0, offset)), new InsertText(this.text.substring(offset))];
	    }
	  }, {
	    key: 'length',
	    value: function length() {
	      return this.text.length;
	    }
	  }]);
	  return InsertText;
	}();
	
	var Delete = function () {
	  function Delete(num) {
	    (0, _classCallCheck3.default)(this, Delete);
	
	    this;
	    this.num = num;
	  }
	
	  (0, _createClass3.default)(Delete, [{
	    key: 'toString',
	    value: function toString() {
	      return 'delete #' + this.num;
	    }
	  }, {
	    key: 'kind',
	    value: function kind() {
	      return 'Delete';
	    }
	  }, {
	    key: 'split',
	    value: function split(offset) {
	      if (offset < 0 || offset > this.num) {
	        throw new Error();
	      }
	      return [new Delete(offset), new Delete(this.num - offset)];
	    }
	  }, {
	    key: 'length',
	    value: function length() {
	      return this.num;
	    }
	  }]);
	  return Delete;
	}();
	
	var Retain = function () {
	  function Retain(num) {
	    (0, _classCallCheck3.default)(this, Retain);
	
	    this;
	    this.num = num;
	  }
	
	  (0, _createClass3.default)(Retain, [{
	    key: 'toString',
	    value: function toString() {
	      return 'retain #' + this.num;
	    }
	  }, {
	    key: 'kind',
	    value: function kind() {
	      return 'Retain';
	    }
	  }, {
	    key: 'split',
	    value: function split(offset) {
	      if (offset < 0 || offset > this.num) {
	        throw new Error();
	      }
	      return [new Retain(offset), new Retain(this.num - offset)];
	    }
	  }, {
	    key: 'length',
	    value: function length() {
	      return this.num;
	    }
	  }]);
	  return Retain;
	}();
	
	//
	
	
	var SuboperationsTransformer = exports.SuboperationsTransformer = function () {
	  function SuboperationsTransformer(retainFactory) {
	    (0, _classCallCheck3.default)(this, SuboperationsTransformer);
	
	    this;
	    this._retainFactory = retainFactory;
	  }
	
	  (0, _createClass3.default)(SuboperationsTransformer, [{
	    key: '_transformConsumeOps',
	    value: function _transformConsumeOps(a, b) {
	      // returns [[aP, bP], [a, b]]
	
	      if (a != null && a.kind() === 'Insert') {
	        return [[a, this._retainFactory(a.length())], [undefined, b]];
	      }
	
	      if (b != null && b.kind() === 'Insert') {
	        return [[this._retainFactory(b.length()), b], [a, undefined]];
	      }
	
	      // neither is null
	      if (a != null && b != null) {
	        var minLength = Math.min(a.length(), b.length());
	
	        var _a$split = a.split(minLength),
	            _a$split2 = (0, _slicedToArray3.default)(_a$split, 2),
	            aHead = _a$split2[0],
	            aTail = _a$split2[1];
	
	        var _b$split = b.split(minLength),
	            _b$split2 = (0, _slicedToArray3.default)(_b$split, 2),
	            bHead = _b$split2[0],
	            bTail = _b$split2[1];
	
	        if (aHead.length() === 0) {
	          aHead = undefined;
	        }
	        if (aTail.length() === 0) {
	          aTail = undefined;
	        }
	        if (bHead.length() === 0) {
	          bHead = undefined;
	        }
	        if (bTail.length() === 0) {
	          bTail = undefined;
	        }
	
	        if (a.kind() === 'Retain' && b.kind() === 'Retain') {
	          return [[aHead, bHead], [aTail, bTail]];
	        }
	        if (a.kind() === 'Delete' && b.kind() === 'Retain') {
	          return [[aHead, undefined], [aTail, bTail]];
	        }
	        if (a.kind() === 'Retain' && b.kind() === 'Delete') {
	          return [[undefined, bHead], [aTail, bTail]];
	        }
	        if (a.kind() === 'Delete' || b.kind() === 'Delete') {
	          return [[undefined, undefined], [aTail, bTail]]; // both do the same thing
	        }
	        if (a.kind() === 'Insert' || b.kind() === 'Insert') {
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
	  }, {
	    key: 'transformNullable',
	    value: function transformNullable(clientOps, serverOps) {
	      if (clientOps != null && serverOps != null) {
	        var _transform = this.transform(clientOps, serverOps),
	            _transform2 = (0, _slicedToArray3.default)(_transform, 2),
	            newClientOps = _transform2[0],
	            newServerOps = _transform2[1];
	
	        return [newClientOps, newServerOps];
	      } else {
	        return [clientOps, serverOps];
	      }
	    }
	  }, {
	    key: 'transform',
	    value: function transform(clientOps, serverOps) {
	      var ops1 = clientOps;
	      var ops2 = serverOps;
	
	      var ops1P = [];
	      var ops2P = [];
	
	      var i1 = 0;
	      var i2 = 0;
	
	      var op1 = undefined;
	      var op2 = undefined;
	
	      while (true) {
	        if (op1 == null) {
	          op1 = ops1[i1];i1++;
	        }
	        if (op2 == null) {
	          op2 = ops2[i2];i2++;
	        }
	
	        if (op1 == null && op2 == null) {
	          break;
	        }
	
	        if (op1 != null && op1.length() <= 0) {
	          op1 = null;
	          continue;
	        }
	
	        if (op2 != null && op2.length() <= 0) {
	          op2 = null;
	          continue;
	        }
	
	        var _transformConsumeOps2 = this._transformConsumeOps(op1, op2),
	            _transformConsumeOps3 = (0, _slicedToArray3.default)(_transformConsumeOps2, 2),
	            _transformConsumeOps4 = (0, _slicedToArray3.default)(_transformConsumeOps3[0], 2),
	            op1P = _transformConsumeOps4[0],
	            op2P = _transformConsumeOps4[1],
	            _transformConsumeOps5 = (0, _slicedToArray3.default)(_transformConsumeOps3[1], 2),
	            newOp1 = _transformConsumeOps5[0],
	            newOp2 = _transformConsumeOps5[1];
	
	        if (op1P != null) {
	          ops1P.push(op1P);
	        }
	        if (op2P != null) {
	          ops2P.push(op2P);
	        }
	
	        op1 = newOp1;
	        op2 = newOp2;
	      }
	
	      return [ops1P, ops2P];
	    }
	  }, {
	    key: 'composeNullable',
	    value: function composeNullable(ops1, ops2) {
	      if (ops1 != null && ops2 != null) {
	        return this.compose(ops1, ops2);
	      } else if (ops1 != null) {
	        return ops1;
	      } else if (ops2 != null) {
	        return ops2;
	      } else {
	        return undefined;
	      }
	    }
	  }, {
	    key: '_composeConsumeOps',
	    value: function _composeConsumeOps(a, b) {
	      // returns [newOp, [a, b]]
	
	      if (a != null && a.kind() === 'Delete') {
	        return [a, [undefined, b]];
	      }
	
	      if (b != null && b.kind() === 'Insert') {
	        return [b, [a, undefined]];
	      }
	
	      // neither op is null!
	      if (a != null && b != null) {
	        var minLength = Math.min(a.length(), b.length());
	
	        var _a$split3 = a.split(minLength),
	            _a$split4 = (0, _slicedToArray3.default)(_a$split3, 2),
	            aHead = _a$split4[0],
	            aTail = _a$split4[1];
	
	        var _b$split3 = b.split(minLength),
	            _b$split4 = (0, _slicedToArray3.default)(_b$split3, 2),
	            bHead = _b$split4[0],
	            bTail = _b$split4[1];
	
	        if (aHead.length() === 0) {
	          aHead = undefined;
	        }
	        if (aTail.length() === 0) {
	          aTail = undefined;
	        }
	        if (bHead.length() === 0) {
	          bHead = undefined;
	        }
	        if (bTail.length() === 0) {
	          bTail = undefined;
	        }
	
	        if (a.kind() === 'Retain' && b.kind() === 'Retain') {
	          return [aHead, [aTail, bTail]];
	        }
	        if (a.kind() === 'Insert' && b.kind() === 'Retain') {
	          return [aHead, [aTail, bTail]];
	        }
	        if (a.kind() === 'Retain' && b.kind() === 'Delete') {
	          return [bHead, [aTail, bTail]];
	        }
	        if (a.kind() === 'Insert' && b.kind() === 'Delete') {
	          return [undefined, [aTail, bTail]]; // delete the inserted portion
	        }
	        if (a.kind() === 'Delete' && b.kind() === 'Insert') {
	          throw new Error('wat, should be handled already');
	        }
	        if (a.kind() === 'Delete' && b.kind() === 'Delete') {
	          throw new Error('wat, should be handled already');
	        }
	        if (a.kind() === 'Insert' && b.kind() === 'Insert') {
	          throw new Error('wat, should be handled already');
	        }
	        throw new Error('wat');
	      }
	
	      // one of the two ops is null!
	      if (a != null) {
	        return [a, [undefined, b]];
	      }
	      if (b != null) {
	        return [b, [a, undefined]];
	      }
	
	      throw new Error('wat');
	    }
	  }, {
	    key: 'compose',
	    value: function compose(ops1, ops2) {
	      // compose (ops1, ops2) to composed s.t.
	      // apply(apply(text, ops1), ops2) === apply(text, composed)
	
	      // code borrowed from https://github.com/Operational-Transformation/ot.py/blob/master/ot/text_operation.py#L219
	
	      var composed = [];
	
	      var i1 = 0;
	      var i2 = 0;
	
	      var op1 = undefined;
	      var op2 = undefined;
	
	      while (true) {
	        if (op1 == null) {
	          op1 = ops1[i1];i1++;
	        }
	        if (op2 == null) {
	          op2 = ops2[i2];i2++;
	        }
	
	        if (op1 == null && op2 == null) {
	          break;
	        }
	
	        if (op1 != null && op1.length() <= 0) {
	          op1 = null;
	          continue;
	        }
	
	        if (op2 != null && op2.length() <= 0) {
	          op2 = null;
	          continue;
	        }
	
	        var _composeConsumeOps2 = this._composeConsumeOps(op1, op2),
	            _composeConsumeOps3 = (0, _slicedToArray3.default)(_composeConsumeOps2, 2),
	            composedOp = _composeConsumeOps3[0],
	            _composeConsumeOps3$ = (0, _slicedToArray3.default)(_composeConsumeOps3[1], 2),
	            newOp1 = _composeConsumeOps3$[0],
	            newOp2 = _composeConsumeOps3$[1];
	
	        if (composedOp != null) {
	          composed.push(composedOp);
	        }
	        op1 = newOp1;
	        op2 = newOp2;
	      }
	
	      return composed;
	    }
	  }, {
	    key: 'composeMany',
	    value: function composeMany(ops) {
	      var composed = [];
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;
	
	      try {
	        for (var _iterator = (0, _getIterator3.default)(ops), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var op = _step.value;
	
	          composed = this.compose(composed, op);
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
	  }]);
	  return SuboperationsTransformer;
	}();
	
	//
	
	var SimpleTextApplier = exports.SimpleTextApplier = function () {
	  function SimpleTextApplier() {
	    (0, _classCallCheck3.default)(this, SimpleTextApplier);
	
	    this;
	  }
	
	  (0, _createClass3.default)(SimpleTextApplier, [{
	    key: 'stateString',
	    value: function stateString(text) {
	      return text;
	    }
	  }, {
	    key: 'apply',
	    value: function apply(text, op) {
	      var i = 0;
	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;
	
	      try {
	        for (var _iterator2 = (0, _getIterator3.default)(op), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var subop = _step2.value;
	
	          if (subop instanceof InsertText) {
	            text = text.slice(0, i) + subop.text + text.slice(i);
	            i += subop.text.length;
	          }
	
	          if (subop instanceof Retain) {
	            if (subop.num < 0) {
	              throw new Error('wat, failed to retain');
	            }
	            i += subop.num;
	          }
	
	          if (subop instanceof Delete) {
	            if (subop.num < 0) {
	              throw new Error('wat, failed to delete');
	            }
	            if (i + subop.num > text.length) {
	              throw new Error('wat, trying to delete too much');
	            }
	            text = text.slice(0, i) + text.slice(i + subop.num);
	          }
	
	          // make sure we didn't accidentally overshoot
	          if (i > text.length) {
	            throw new Error('wat, overshot');
	          }
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
	
	      return text;
	    }
	  }]);
	  return SimpleTextApplier;
	}();
	
	var SimpleTextInferrer = exports.SimpleTextInferrer = function () {
	  function SimpleTextInferrer() {
	    (0, _classCallCheck3.default)(this, SimpleTextInferrer);
	
	    this;
	  }
	
	  (0, _createClass3.default)(SimpleTextInferrer, [{
	    key: 'inferOps',
	    value: function inferOps(oldText, newText) {
	      // TODO: untested
	      if (oldText.length === newText.length) {
	        // we have a no-op
	        if (oldText === newText) {
	          return undefined;
	        }
	      }
	
	      if (newText.length === 0) {
	        return [new Delete(oldText.length)];
	      }
	
	      if (oldText.length === 0) {
	        return [new InsertText(newText)];
	      }
	
	      // or we have a selection being overwritten.
	      var postfixLength = (0, _utils.calculatePostfixLength)(oldText, newText);
	      var newTextLeftover = (0, _utils.removeTail)(newText, postfixLength);
	      var oldTextLeftover = (0, _utils.removeTail)(oldText, postfixLength);
	      var prefixLength = (0, _utils.calculatePrefixLength)(oldTextLeftover, newTextLeftover);
	
	      var start = prefixLength;
	      var endOld = oldText.length - postfixLength;
	      var endNew = newText.length - postfixLength;
	
	      return [new Retain(start), new Delete(endOld - start), new InsertText((0, _utils.restring)((0, _utils.substring)(newText, { start: start, stop: endNew })))];
	    }
	  }]);
	  return SimpleTextInferrer;
	}();
	
	//
	
	var SimpleCursorApplier = exports.SimpleCursorApplier = function () {
	  function SimpleCursorApplier() {
	    (0, _classCallCheck3.default)(this, SimpleCursorApplier);
	
	    this;
	  }
	
	  (0, _createClass3.default)(SimpleCursorApplier, [{
	    key: 'stateString',
	    value: function stateString(state) {
	      throw new Error('not implemented');
	    }
	  }, {
	    key: '_adjustPosition',
	    value: function _adjustPosition(pos, op) {
	      var i = 0;
	      var _iteratorNormalCompletion3 = true;
	      var _didIteratorError3 = false;
	      var _iteratorError3 = undefined;
	
	      try {
	        for (var _iterator3 = (0, _getIterator3.default)(op), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	          var subop = _step3.value;
	
	          if (i >= pos) {
	            break;
	          }
	
	          if (subop instanceof InsertText) {
	            i += subop.length();
	            pos += subop.length();
	          }
	
	          if (subop instanceof Retain) {
	            i += subop.num;
	          }
	
	          if (subop instanceof Delete) {
	            pos -= subop.length();
	          }
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
	
	      return pos;
	    }
	  }, {
	    key: 'apply',
	    value: function apply(state, op) {
	      return {
	        start: this._adjustPosition(state.start, op),
	        end: this._adjustPosition(state.end, op)
	      };
	    }
	  }]);
	  return SimpleCursorApplier;
	}();
	
	//
	
	var TextApplier = exports.TextApplier = function () {
	  function TextApplier() {
	    (0, _classCallCheck3.default)(this, TextApplier);
	
	    this;
	    this.cursorApplier = new SimpleCursorApplier(); // no DI :()
	    this.textApplier = new SimpleTextApplier();
	  }
	
	  (0, _createClass3.default)(TextApplier, [{
	    key: 'stateString',
	    value: function stateString(state) {
	      return this.textApplier.stateString(state.text);
	    }
	  }, {
	    key: 'apply',
	    value: function apply(state, op) {
	      return {
	        cursor: this.cursorApplier.apply(state.cursor, op),
	        text: this.textApplier.apply(state.text, op)
	      };
	    }
	  }]);
	  return TextApplier;
	}();

/***/ },
/* 102 */
/***/ function(module, exports) {

	"use strict";

/***/ }
/******/ ]);
//# sourceMappingURL=bundle.js.map