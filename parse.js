/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.l = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };

/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};

/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};

/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(0);
var patts = __webpack_require__(5);
var https = __webpack_require__(8);

module.exports = function () {

	this.isDir = function (file) {
		return fs.statSync(file).isDirectory() ? true : false;
	};

	this.disectArrayAndPush = function (path, deeperDir, arr) {
		deeperDir.map(function (item) {
			return arr.push(path + item);
		});
		return arr;
	};

	/* file => get Season and episode pattern and if movies, get it's name */
	this.isMatch = function (files) {
		var keys = Object.keys(patts);
		for (var i = 0; i < keys.length; i += 1) {
			var objFunc = patts[keys[i]](files);
			if (!objFunc) continue;
			return objFunc;
		}
		return { response: false };
	};

	/*
 	Helps getShows to figure out if this show is already found but this file is of different season.
 */
	this.sameShow = function (shows, title, season) {
		for (var prop in shows) {
			if (!new RegExp(title + "$", "i").test(prop)) continue;
			if (shows[prop].season.indexOf(season) === -1) return { newSeason: true };
			return { newSeason: null }; //If not same season but same shows
		}
		return false;
	};

	/* Saves poster */
	this.saveImage = function (url, name) {
		return new Promise(function (resolve) {
			var file = fs.createWriteStream(name);
			https.get(url, function (response) {
				response.pipe(file);resolve();
			});
		}).catch(function (e) {
			return console.log(e);
		});
	};

	/* Gets shows and posters from omdbapi */
	this.getData = function (reqPath) {
		return new Promise(function (resolve) {
			var options = {
				host: "www.omdbapi.com",
				path: reqPath,
				method: "GET",
				headers: { "Content-Type": "application/json" }
			};
			https.request(options).on("response", function (res) {
				var output = "";
				res.setEncoding("utf8");
				res.on("data", function (chunk) {
					return output += chunk;
				});
				res.on("end", function () {
					return resolve(JSON.parse(output));
				});
			}).end();
		}).catch(function (e) {
			return console.log(e);
		});
	};

	this.getEpisodeTitle = function (_ref, showsData) {
		var name = _ref.name,
		    season = _ref.season,
		    episode = _ref.episode;

		var title = void 0;
		showsData.forEach(function (show) {
			if (name !== show.Title && show.Season === season) return;
			episode < 10 ? episode = parseInt(episode) : episode;
			show.Episodes.forEach(function (_ref2) {
				var Episode = _ref2.Episode,
				    Title = _ref2.Title;
				return episode == Episode ? title = Title : "";
			});
		});
		return title ? title.replace(/[^\w\s-\.$]/gi, "") : null; //Repalce is for weird titles like - Horseback Riding\Man Zone
	};

	/* Outputs season, Show name and episode number*/
	this.getFileStats = function (_ref3) {
		var file = _ref3.file,
		    episode = _ref3.episode;

		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " "); // "path/New Girl HDTV.LOL S02E01.mp4" -> "/New Girl HDTV LOL S02E01 mp4"
		var indexE = episode.indexOf("E");
		return {
			season: parseInt(episode.slice(1, indexE)), // S02E01 -> 02
			name: file.indexOf(episode) === 0 ? null : file.slice(0, file.indexOf(episode) - 1), // "/Shameless S02E02" -> "Shameless"
			episode: episode.slice(indexE + 1, episode.length) //S01E02 -> 02
		};
	};

	/* Generated random folder name to organize the shows */
	this.generateRandomFolderName = function () {
		var letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
		var randomString = [];
		for (var i = 0; i < 6; i += 1) {
			var ran = letters[Math.floor(Math.random() * letters.length)];
			if (Math.random() < 0.699) ran = ran.toLowerCase(); //So that it gives equal change to Upper case and lower case alphabets maybe (I'll check it later)
			randomString.push(ran);
		}
		return randomString.join("");
	};
};

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var fs = __webpack_require__(0);

module.exports = function () {

	//Rename .srt with .txt, read .txt file, modify it, delete .txt, write .srt with new data
	this.fixSubs = function (file) {
		var fileTxtName = file.replace(/\.srt/g, ".txt");
		fs.renameSync(file, fileTxtName);
		var subData = fs.readFileSync(fileTxtName, "utf-8").replace(/[^A-Za-z\d\s!?,''><.:-]/gi, "").replace(/\(\s*[^)]*\)/g, "").replace(/\[\s*[^\]]*\]/g, "");
		fs.unlinkSync(fileTxtName);
		fs.writeFileSync(file, subData, "utf-8");
	};
};

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var fs = __webpack_require__(0);
var HelperFuncs = __webpack_require__(1);

var Helper = new HelperFuncs();

module.exports = function () {

	/*Get all the files in the provided path */
	this.readFiles = function (basePath) {
		var files = [];
		fs.readdirSync(basePath).map(function (file) {
			files.push(basePath + file);
			if (!Helper.isDir(basePath + file)) return;
			files = [].concat(_toConsumableArray(files), _toConsumableArray(toTheDeepestFile({ basePath: basePath, deeperDir: file, arr: [] })));
		});
		return files;
	};

	/* Gets all the files inside the folder */
	function toTheDeepestFile(_ref) {
		var basePath = _ref.basePath,
		    deeperDir = _ref.deeperDir,
		    arr = _ref.arr;

		basePath += deeperDir + "/";
		deeperDir = fs.readdirSync(basePath);
		arr = Helper.disectArrayAndPush(basePath, deeperDir, arr); //Concat was not working for some reason. Ugh!!
		for (var i = 0; i < deeperDir.length; i += 1) {
			if (!Helper.isDir(basePath + deeperDir[i])) continue;
			toTheDeepestFile({ basePath: basePath, "deeperDir": deeperDir[i], arr: arr });
		}
		return arr;
	}
};

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(6);


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
	seasonPatt: function seasonPatt(file) {
		//For instance -> S02E05
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " ");
		var episode = /(S|s)\d+(E|e)+\d\d/g.exec(file);
		if (!episode) return false;
		episode = episode[0].toUpperCase();
		return { episode: episode, type: "tv" };
	},
	seasonXEpiNamePatt: function seasonXEpiNamePatt(file) {
		// For instance -> 1x02
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " ");
		var episode = /\d+x\d\d/gi.exec(file);
		if (!episode) return false;
		episode = episode[0];
		episode.indexOf("x") === 1 ? episode += "S0" : episode += "S"; //1x10 -> S01x10 or 19x09 -> S19x09
		episode = episode.replace(/x/gi, "E");
		return { episode: episode, type: "tv" };
	},
	ifMovie: function ifMovie(file) {
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " ");
		var name = /20\d+|19\d+/gi.exec(file);
		if (!name) return false;
		name = file.slice(0, name["index"]).replace(/\./g, " ").trim();
		return { name: name, type: "movie" };
	}
};

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

// This method of obtaining a reference to the global object needs to be
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

module.exports = __webpack_require__(7);

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


/***/ }),
/* 7 */
/***/ (function(module, exports) {

/**
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

      context.method = method;
      context.arg = arg;

      while (true) {
        var delegate = context.delegate;
        if (delegate) {
          var delegateResult = maybeInvokeDelegate(delegate, context);
          if (delegateResult) {
            if (delegateResult === ContinueSentinel) continue;
            return delegateResult;
          }
        }

        if (context.method === "next") {
          // Setting context._sent for legacy support of Babel's
          // function.sent implementation.
          context.sent = context._sent = context.arg;

        } else if (context.method === "throw") {
          if (state === GenStateSuspendedStart) {
            state = GenStateCompleted;
            throw context.arg;
          }

          context.dispatchException(context.arg);

        } else if (context.method === "return") {
          context.abrupt("return", context.arg);
        }

        state = GenStateExecuting;

        var record = tryCatch(innerFn, self, context);
        if (record.type === "normal") {
          // If an exception is thrown from innerFn, we leave state ===
          // GenStateExecuting and loop back for another invocation.
          state = context.done
            ? GenStateCompleted
            : GenStateSuspendedYield;

          if (record.arg === ContinueSentinel) {
            continue;
          }

          return {
            value: record.arg,
            done: context.done
          };

        } else if (record.type === "throw") {
          state = GenStateCompleted;
          // Dispatch the exception by looping back around to the
          // context.dispatchException(context.arg) call above.
          context.method = "throw";
          context.arg = record.arg;
        }
      }
    };
  }

  // Call delegate.iterator[context.method](context.arg) and handle the
  // result, either by returning a { value, done } result from the
  // delegate iterator, or by modifying context.method and context.arg,
  // setting context.delegate to null, and returning the ContinueSentinel.
  function maybeInvokeDelegate(delegate, context) {
    var method = delegate.iterator[context.method];
    if (method === undefined) {
      // A .throw or .return when the delegate iterator has no .throw
      // method always terminates the yield* loop.
      context.delegate = null;

      if (context.method === "throw") {
        if (delegate.iterator.return) {
          // If the delegate iterator has a return method, give it a
          // chance to clean up.
          context.method = "return";
          context.arg = undefined;
          maybeInvokeDelegate(delegate, context);

          if (context.method === "throw") {
            // If maybeInvokeDelegate(context) changed context.method from
            // "return" to "throw", let that override the TypeError below.
            return ContinueSentinel;
          }
        }

        context.method = "throw";
        context.arg = new TypeError(
          "The iterator does not provide a 'throw' method");
      }

      return ContinueSentinel;
    }

    var record = tryCatch(method, delegate.iterator, context.arg);

    if (record.type === "throw") {
      context.method = "throw";
      context.arg = record.arg;
      context.delegate = null;
      return ContinueSentinel;
    }

    var info = record.arg;

    if (! info) {
      context.method = "throw";
      context.arg = new TypeError("iterator result is not an object");
      context.delegate = null;
      return ContinueSentinel;
    }

    if (info.done) {
      // Assign the result of the finished delegate to the temporary
      // variable specified by delegate.resultName (see delegateYield).
      context[delegate.resultName] = info.value;

      // Resume execution at the desired location (see delegateYield).
      context.next = delegate.nextLoc;

      // If context.method was "throw" but the delegate handled the
      // exception, let the outer generator proceed normally. If
      // context.method was "next", forget context.arg since it has been
      // "consumed" by the delegate iterator. If context.method was
      // "return", allow the original .return call to continue in the
      // outer generator.
      if (context.method !== "return") {
        context.method = "next";
        context.arg = undefined;
      }

    } else {
      // Re-yield the result returned by the delegate method.
      return info;
    }

    // The delegate iterator is finished, so forget it and continue with
    // the outer generator.
    context.delegate = null;
    return ContinueSentinel;
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

      this.method = "next";
      this.arg = undefined;

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

        if (caught) {
          // If the dispatched exception was caught by a catch block,
          // then let that catch block handle the exception normally.
          context.method = "next";
          context.arg = undefined;
        }

        return !! caught;
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
        this.method = "next";
        this.next = finallyEntry.finallyLoc;
        return ContinueSentinel;
      }

      return this.complete(record);
    },

    complete: function(record, afterLoc) {
      if (record.type === "throw") {
        throw record.arg;
      }

      if (record.type === "break" ||
          record.type === "continue") {
        this.next = record.arg;
      } else if (record.type === "return") {
        this.rval = this.arg = record.arg;
        this.method = "return";
        this.next = "end";
      } else if (record.type === "normal" && afterLoc) {
        this.next = afterLoc;
      }

      return ContinueSentinel;
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

      if (this.method === "next") {
        // Deliberately forget the last sent value so that we don't
        // accidentally pass it on to the delegate.
        this.arg = undefined;
      }

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


/***/ }),
/* 8 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


///basePath = basePath + "/"; //Adding "/" instead of "\" because I can use find the first one in an array and second is a escape char (Decrepted, I guess)
//basePath = basePath.replace(/\\/g, "/"); //Oct 29 2016, Changed this

var _regenerator = __webpack_require__(4);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* Gets movies Data form api */
var apiMovies = function () {
	var _ref11 = _asyncToGenerator(_regenerator2.default.mark(function _callee4(movies) {
		var _this2 = this;

		return _regenerator2.default.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						_context4.prev = 0;
						return _context4.abrupt("return", new Promise(function () {
							var _ref12 = _asyncToGenerator(_regenerator2.default.mark(function _callee3(resolve) {
								var apiData, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, movie, _ref14, Title, Year, Poster, Runtime, imdbRating, Response;

								return _regenerator2.default.wrap(function _callee3$(_context3) {
									while (1) {
										switch (_context3.prev = _context3.next) {
											case 0:
												apiData = [];
												_iteratorNormalCompletion = true;
												_didIteratorError = false;
												_iteratorError = undefined;
												_context3.prev = 4;
												_iterator = movies[Symbol.iterator]();

											case 6:
												if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
													_context3.next = 22;
													break;
												}

												movie = _step.value;

												movie = movie.split(" ").join("%20");
												_context3.next = 11;
												return Helper.getData("/?t=" + movie);

											case 11:
												_ref14 = _context3.sent;
												Title = _ref14.Title;
												Year = _ref14.Year;
												Poster = _ref14.Poster;
												Runtime = _ref14.Runtime;
												imdbRating = _ref14.imdbRating;
												Response = _ref14.Response;

												apiData.push({ Title: Title, Year: Year, Poster: Poster, Runtime: Runtime, Rating: imdbRating, Response: Response });

											case 19:
												_iteratorNormalCompletion = true;
												_context3.next = 6;
												break;

											case 22:
												_context3.next = 28;
												break;

											case 24:
												_context3.prev = 24;
												_context3.t0 = _context3["catch"](4);
												_didIteratorError = true;
												_iteratorError = _context3.t0;

											case 28:
												_context3.prev = 28;
												_context3.prev = 29;

												if (!_iteratorNormalCompletion && _iterator.return) {
													_iterator.return();
												}

											case 31:
												_context3.prev = 31;

												if (!_didIteratorError) {
													_context3.next = 34;
													break;
												}

												throw _iteratorError;

											case 34:
												return _context3.finish(31);

											case 35:
												return _context3.finish(28);

											case 36:
												resolve(apiData.filter(function (_ref13) {
													var Response = _ref13.Response;
													return Response === "True";
												}));

											case 37:
											case "end":
												return _context3.stop();
										}
									}
								}, _callee3, _this2, [[4, 24, 28, 36], [29,, 31, 35]]);
							}));

							return function (_x3) {
								return _ref12.apply(this, arguments);
							};
						}()));

					case 4:
						_context4.prev = 4;
						_context4.t0 = _context4["catch"](0);
						console.log("apiMovies Error");console.log(new Error(_context4.t0));
					case 8:
					case "end":
						return _context4.stop();
				}
			}
		}, _callee4, this, [[0, 4]]);
	}));

	return function apiMovies(_x2) {
		return _ref11.apply(this, arguments);
	};
}();

/* Gets shows data from api */


var apiShows = function () {
	var _ref15 = _asyncToGenerator(_regenerator2.default.mark(function _callee6(shows) {
		var _this3 = this;

		return _regenerator2.default.wrap(function _callee6$(_context6) {
			while (1) {
				switch (_context6.prev = _context6.next) {
					case 0:
						_context6.prev = 0;
						return _context6.abrupt("return", new Promise(function () {
							var _ref16 = _asyncToGenerator(_regenerator2.default.mark(function _callee5(resolve) {
								var apiData, posters, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, showName, season, baseUrl, _ref19, Poster, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, item;

								return _regenerator2.default.wrap(function _callee5$(_context5) {
									while (1) {
										switch (_context5.prev = _context5.next) {
											case 0:
												apiData = [], posters = [];
												_iteratorNormalCompletion2 = true;
												_didIteratorError2 = false;
												_iteratorError2 = undefined;
												_context5.prev = 4;
												_iterator2 = Object.keys(shows)[Symbol.iterator]();

											case 6:
												if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
													_context5.next = 48;
													break;
												}

												showName = _step2.value;
												season = shows[showName].season;

												showName = showName.split(" ").join("%20"); //For api
												baseUrl = "/?t=" + showName;
												_context5.next = 13;
												return Helper.getData(baseUrl);

											case 13:
												_ref19 = _context5.sent;
												Poster = _ref19.Poster;

												posters.push({ title: showName, url: Poster });
												_iteratorNormalCompletion3 = true;
												_didIteratorError3 = false;
												_iteratorError3 = undefined;
												_context5.prev = 19;
												_iterator3 = season[Symbol.iterator]();

											case 21:
												if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
													_context5.next = 31;
													break;
												}

												item = _step3.value;
												_context5.t0 = apiData;
												_context5.next = 26;
												return Helper.getData(baseUrl + "&Season=" + item);

											case 26:
												_context5.t1 = _context5.sent;

												_context5.t0.push.call(_context5.t0, _context5.t1);

											case 28:
												_iteratorNormalCompletion3 = true;
												_context5.next = 21;
												break;

											case 31:
												_context5.next = 37;
												break;

											case 33:
												_context5.prev = 33;
												_context5.t2 = _context5["catch"](19);
												_didIteratorError3 = true;
												_iteratorError3 = _context5.t2;

											case 37:
												_context5.prev = 37;
												_context5.prev = 38;

												if (!_iteratorNormalCompletion3 && _iterator3.return) {
													_iterator3.return();
												}

											case 40:
												_context5.prev = 40;

												if (!_didIteratorError3) {
													_context5.next = 43;
													break;
												}

												throw _iteratorError3;

											case 43:
												return _context5.finish(40);

											case 44:
												return _context5.finish(37);

											case 45:
												_iteratorNormalCompletion2 = true;
												_context5.next = 6;
												break;

											case 48:
												_context5.next = 54;
												break;

											case 50:
												_context5.prev = 50;
												_context5.t3 = _context5["catch"](4);
												_didIteratorError2 = true;
												_iteratorError2 = _context5.t3;

											case 54:
												_context5.prev = 54;
												_context5.prev = 55;

												if (!_iteratorNormalCompletion2 && _iterator2.return) {
													_iterator2.return();
												}

											case 57:
												_context5.prev = 57;

												if (!_didIteratorError2) {
													_context5.next = 60;
													break;
												}

												throw _iteratorError2;

											case 60:
												return _context5.finish(57);

											case 61:
												return _context5.finish(54);

											case 62:
												resolve([apiData.filter(function (_ref17) {
													var Response = _ref17.Response;
													return Response === "True";
												}), posters.filter(function (_ref18) {
													var url = _ref18.url,
													    title = _ref18.title;
													return url && title;
												})]);

											case 63:
											case "end":
												return _context5.stop();
										}
									}
								}, _callee5, _this3, [[4, 50, 54, 62], [19, 33, 37, 45], [38,, 40, 44], [55,, 57, 61]]);
							}));

							return function (_x5) {
								return _ref16.apply(this, arguments);
							};
						}()));

					case 4:
						_context6.prev = 4;
						_context6.t0 = _context6["catch"](0);
						console.log("apiMovies Error");console.log(new Error(_context6.t0));
					case 8:
					case "end":
						return _context6.stop();
				}
			}
		}, _callee6, this, [[0, 4]]);
	}));

	return function apiShows(_x4) {
		return _ref15.apply(this, arguments);
	};
}();

/* Gets show names with their respective season numbers */


/* Downloads and save posters */
var savePosters = function () {
	var _ref26 = _asyncToGenerator(_regenerator2.default.mark(function _callee10(_ref27) {
		var basePath = _ref27.basePath,
		    posters = _ref27.posters,
		    showName = _ref27.showName;

		var _iteratorNormalCompletion6, _didIteratorError6, _iteratorError6, _iterator6, _step6, _ref29, title, url;

		return _regenerator2.default.wrap(function _callee10$(_context12) {
			while (1) {
				switch (_context12.prev = _context12.next) {
					case 0:
						_context12.prev = 0;
						_iteratorNormalCompletion6 = true;
						_didIteratorError6 = false;
						_iteratorError6 = undefined;
						_context12.prev = 4;
						_iterator6 = posters[Symbol.iterator]();

					case 6:
						if (_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done) {
							_context12.next = 19;
							break;
						}

						_ref29 = _step6.value;
						title = _ref29.title, url = _ref29.url;

						title = title.replace(/%20/g, "").toLowerCase();

						if (!(title === showName.replace(/\s/gi, "").toLowerCase())) {
							_context12.next = 15;
							break;
						}

						_context12.next = 13;
						return Helper.saveImage(url, basePath + "/Tv Shows/" + showName + "/" + showName + ".jpg");

					case 13:
						_context12.next = 16;
						break;

					case 15:
						"";

					case 16:
						_iteratorNormalCompletion6 = true;
						_context12.next = 6;
						break;

					case 19:
						_context12.next = 25;
						break;

					case 21:
						_context12.prev = 21;
						_context12.t0 = _context12["catch"](4);
						_didIteratorError6 = true;
						_iteratorError6 = _context12.t0;

					case 25:
						_context12.prev = 25;
						_context12.prev = 26;

						if (!_iteratorNormalCompletion6 && _iterator6.return) {
							_iterator6.return();
						}

					case 28:
						_context12.prev = 28;

						if (!_didIteratorError6) {
							_context12.next = 31;
							break;
						}

						throw _iteratorError6;

					case 31:
						return _context12.finish(28);

					case 32:
						return _context12.finish(25);

					case 33:
						_context12.next = 38;
						break;

					case 35:
						_context12.prev = 35;
						_context12.t1 = _context12["catch"](0);
						console.log(_context12.t1);
					case 38:
					case "end":
						return _context12.stop();
				}
			}
		}, _callee10, this, [[0, 35], [4, 21, 25, 33], [26,, 28, 32]]);
	}));

	return function savePosters(_x9) {
		return _ref26.apply(this, arguments);
	};
}();

/*
	Filters files into video files, directories and other files. Sorts the directories from deepest to outmost.
*/


function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var fs = __webpack_require__(0);
var HelperFuncs = __webpack_require__(1);
var SubsFuncs = __webpack_require__(2);
var GetFilesFuncs = __webpack_require__(3);

var Helper = new HelperFuncs();
var Subs = new SubsFuncs();
var GetFiles = new GetFilesFuncs();

/* Start of the Function */
_asyncToGenerator(_regenerator2.default.mark(function _callee() {
	var basePath, files, _filterFiles, dirs, video, other, _filterShowsAndMovies, _filterShowsAndMovies2, shows, movies, _ref2, _ref3, showsData, posters, moviesData, newNames;

	return _regenerator2.default.wrap(function _callee$(_context) {
		while (1) {
			switch (_context.prev = _context.next) {
				case 0:
					_context.prev = 0;

					if (!process.argv[2]) console.log("Invalid Path");
					basePath = process.argv[2].replace(/\\/g, "/");

					if (basePath[basePath.length - 1] !== "/") basePath += "/";
					console.time("It took");
					console.log("Organizing " + basePath);
					console.log("Reading Files");
					files = GetFiles.readFiles(basePath);

					console.log("Filtering Files into video, directories and other files");
					_filterFiles = filterFiles(files), dirs = _filterFiles.dirs, video = _filterFiles.video, other = _filterFiles.other;

					console.log("Filtering movies and tv shows files");
					_filterShowsAndMovies = filterShowsAndMovies(video), _filterShowsAndMovies2 = _slicedToArray(_filterShowsAndMovies, 2), shows = _filterShowsAndMovies2[0], movies = _filterShowsAndMovies2[1];

					console.log("Getting shows and movies data from OmdbAPI.com");
					_context.next = 15;
					return apiShowsAndMovies(shows, movies);

				case 15:
					_ref2 = _context.sent;
					_ref3 = _slicedToArray(_ref2, 3);
					showsData = _ref3[0];
					posters = _ref3[1];
					moviesData = _ref3[2];

					console.log("Making new folders for movies and tv shows");
					basePath += Helper.generateRandomFolderName();
					_context.next = 24;
					return makeShowAndMoviesFolders({ basePath: basePath, shows: shows, posters: posters, "movies": moviesData });

				case 24:
					console.log("Finding new names for movies and tv shows");
					newNames = findNewNamesForFiles({ video: video, showsData: showsData, moviesData: moviesData });

					console.log("Renaming files");
					newNames.map(function (_ref4) {
						var oldFile = _ref4.oldFile,
						    newFile = _ref4.newFile;
						return fs.renameSync(oldFile, basePath + newFile);
					});
					other.map(function (file) {
						return whatToDoWithFile(file, basePath);
					});
					console.log("Deleting uneccesary files");
					removeDirs(dirs);
					console.log("Your organized files are in - " + basePath);
					console.timeEnd("It took");
					_context.next = 39;
					break;

				case 35:
					_context.prev = 35;
					_context.t0 = _context["catch"](0);

					console.log("Organize error");
					console.log(new Error(_context.t0));

				case 39:
				case "end":
					return _context.stop();
			}
		}
	}, _callee, this, [[0, 35]]);
}))();

function findNewNamesForFiles(_ref5) {
	var video = _ref5.video,
	    showsData = _ref5.showsData,
	    moviesData = _ref5.moviesData;

	var names = [];
	video.map(function (file) {
		file.type === "movie" ? names.push(findNewNameForMovie(file, moviesData)) : names.push(findNewNameForShow(file, showsData));
	});
	return names.filter(function (_ref6) {
		var newFile = _ref6.newFile;
		return newFile;
	}); //No API Match but pattern match
}

function findNewNameForShow(fileData, showsData) {
	var newFile = { oldFile: fileData.file };
	var ext = fileData.file.slice(fileData.file.length - 4, fileData.file.length);
	var showStats = Helper.getFileStats({ file: fileData.file, episode: fileData.episode });
	var title = Helper.getEpisodeTitle(showStats, showsData);
	var name = showStats.name,
	    season = showStats.season,
	    episode = showStats.episode;

	var baseName = "/Tv Shows/" + name + "/Season " + season + "/" + name + " S" + (season < 10 ? "0" + season : season) + "E" + episode;
	title ? newFile["newFile"] = baseName + " - " + title + ext : newFile["newFile"] = baseName + ext;
	return newFile;
}

function findNewNameForMovie(_ref7, moviesData) {
	var file = _ref7.file,
	    name = _ref7.name;

	var newFile = { oldFile: file };
	file = file.slice(file.lastIndexOf("/") + 1, file.length);
	var ext = file.slice(file.length - 4, file.length);
	moviesData.map(function (item) {
		if (name !== item.Title) return;
		var Title = item.Title,
		    Year = item.Year,
		    Runtime = item.Runtime,
		    Rating = item.Rating;

		newFile["newFile"] = "/Movies/" + Title + " " + Year + " (" + Runtime + ") (" + Rating + ")/" + Title + " " + Year + ext;
	});
	return newFile;
}

/* Renames video and sub files, removes hearing aid from subs and delete files other than video files */
function whatToDoWithFile(file, basePath) {
	var fileName = file.slice(file.lastIndexOf("/") + 1, file.length);
	var ext = file.slice(file.length - 4, file.length);
	if (ext === ".srt") Subs.fixSubs(file);
	/\.mkv|\.mp4|\.srt|\.avi/g.test(ext) ? fs.rename(file, basePath + "/No Match Found/" + fileName, function () {
		return "";
	}) : fs.unlinkSync(file);
}

/* Gets shows data through OmdbAPI with their poster url's */
function apiShowsAndMovies(shows, movies) {
	var _this = this;

	try {
		return new Promise(function () {
			var _ref8 = _asyncToGenerator(_regenerator2.default.mark(function _callee2(resolve) {
				var _ref9, _ref10, showsData, posters, moviesData;

				return _regenerator2.default.wrap(function _callee2$(_context2) {
					while (1) {
						switch (_context2.prev = _context2.next) {
							case 0:
								_context2.next = 2;
								return apiShows(shows);

							case 2:
								_ref9 = _context2.sent;
								_ref10 = _slicedToArray(_ref9, 2);
								showsData = _ref10[0];
								posters = _ref10[1];
								_context2.next = 8;
								return apiMovies(movies);

							case 8:
								moviesData = _context2.sent;

								resolve([showsData, posters, moviesData]);

							case 10:
							case "end":
								return _context2.stop();
						}
					}
				}, _callee2, _this);
			}));

			return function (_x) {
				return _ref8.apply(this, arguments);
			};
		}());
	} catch (e) {
		console.log("Execute API error");
		console.log(new Error(e));
	}
}function filterShowsAndMovies(video) {
	var shows = {},
	    movies = [];

	video.map(function (_ref20) {
		var file = _ref20.file,
		    type = _ref20.type,
		    episode = _ref20.episode,
		    name = _ref20.name;

		if (type === "movie") return movies.length ? movies.indexOf(name) === -1 ? movies.push(name) : "" : movies.push(name);
		{
			var _Helper$getFileStats = Helper.getFileStats({ file: file, episode: episode, type: type }),
			    _name = _Helper$getFileStats.name,
			    season = _Helper$getFileStats.season;

			if (!_name) return;
			var sameShow = Helper.sameShow(shows, _name, season);
			if (!sameShow) {
				shows[_name] = { season: [season], length: 1 };return;
			} //New show detected
			if (!sameShow.newSeason) return; //Same show detected
			shows[_name].season.push(season); //Same show but different season
			shows[_name].length += 1;
		}
	});
	return [shows, movies];
}

/* Removes empty dirs after the rename of the files */
function removeDirs(files) {
	files.map(function (file) {
		return fs.rmdirSync(file);
	}); //This just does not throw any errors
}

/* Makes folder for shows and movies */
function makeShowAndMoviesFolders(_ref21) {
	var _this4 = this;

	var basePath = _ref21.basePath,
	    shows = _ref21.shows,
	    posters = _ref21.posters,
	    movies = _ref21.movies;

	try {
		return new Promise(function () {
			var _ref22 = _asyncToGenerator(_regenerator2.default.mark(function _callee7(resolve) {
				return _regenerator2.default.wrap(function _callee7$(_context7) {
					while (1) {
						switch (_context7.prev = _context7.next) {
							case 0:
								fs.mkdirSync(basePath);
								["Tv Shows", "Movies", "No Match Found"].map(function (str) {
									return fs.mkdirSync(basePath + "/" + str);
								}); //Initial Folders
								_context7.next = 4;
								return Promise.all([makeShowsFolders({ shows: shows, basePath: basePath, posters: posters }), makeMoviesFolders(movies, basePath)]);

							case 4:
								resolve();

							case 5:
							case "end":
								return _context7.stop();
						}
					}
				}, _callee7, _this4);
			}));

			return function (_x6) {
				return _ref22.apply(this, arguments);
			};
		}());
	} catch (e) {
		console.log("Make Show Folders Error");
		console.log(new Error(e));
	}
}

/* Makes folder for the shows with; Season and showName */
function makeShowsFolders(_ref23) {
	var _this5 = this;

	var shows = _ref23.shows,
	    posters = _ref23.posters,
	    basePath = _ref23.basePath;

	try {
		return new Promise(function () {
			var _ref24 = _asyncToGenerator(_regenerator2.default.mark(function _callee8(resolve) {
				var _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _loop, _iterator4, _step4;

				return _regenerator2.default.wrap(function _callee8$(_context9) {
					while (1) {
						switch (_context9.prev = _context9.next) {
							case 0:
								_iteratorNormalCompletion4 = true;
								_didIteratorError4 = false;
								_iteratorError4 = undefined;
								_context9.prev = 3;
								_loop = _regenerator2.default.mark(function _loop() {
									var showName, season;
									return _regenerator2.default.wrap(function _loop$(_context8) {
										while (1) {
											switch (_context8.prev = _context8.next) {
												case 0:
													showName = _step4.value;
													season = shows[showName].season;

													fs.mkdirSync(basePath + "/Tv Shows/" + showName);
													_context8.next = 5;
													return savePosters({ basePath: basePath, showName: showName, posters: posters });

												case 5:
													season.map(function (season) {
														return fs.mkdirSync(basePath + "/Tv Shows/" + showName + "/Season " + season);
													});

												case 6:
												case "end":
													return _context8.stop();
											}
										}
									}, _loop, _this5);
								});
								_iterator4 = Object.keys(shows)[Symbol.iterator]();

							case 6:
								if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
									_context9.next = 11;
									break;
								}

								return _context9.delegateYield(_loop(), "t0", 8);

							case 8:
								_iteratorNormalCompletion4 = true;
								_context9.next = 6;
								break;

							case 11:
								_context9.next = 17;
								break;

							case 13:
								_context9.prev = 13;
								_context9.t1 = _context9["catch"](3);
								_didIteratorError4 = true;
								_iteratorError4 = _context9.t1;

							case 17:
								_context9.prev = 17;
								_context9.prev = 18;

								if (!_iteratorNormalCompletion4 && _iterator4.return) {
									_iterator4.return();
								}

							case 20:
								_context9.prev = 20;

								if (!_didIteratorError4) {
									_context9.next = 23;
									break;
								}

								throw _iteratorError4;

							case 23:
								return _context9.finish(20);

							case 24:
								return _context9.finish(17);

							case 25:
								resolve();

							case 26:
							case "end":
								return _context9.stop();
						}
					}
				}, _callee8, _this5, [[3, 13, 17, 25], [18,, 20, 24]]);
			}));

			return function (_x7) {
				return _ref24.apply(this, arguments);
			};
		}());
	} catch (e) {
		console.log("makeShowsFolders error");console.log(new Error(e));
	}
}

/* Makes folder for the movies with name, year, rating and runtime */
function makeMoviesFolders(movies, basePath) {
	var _this6 = this;

	try {
		return new Promise(function () {
			var _ref25 = _asyncToGenerator(_regenerator2.default.mark(function _callee9(resolve) {
				var _iteratorNormalCompletion5, _didIteratorError5, _iteratorError5, _loop2, _iterator5, _step5;

				return _regenerator2.default.wrap(function _callee9$(_context11) {
					while (1) {
						switch (_context11.prev = _context11.next) {
							case 0:
								_iteratorNormalCompletion5 = true;
								_didIteratorError5 = false;
								_iteratorError5 = undefined;
								_context11.prev = 3;
								_loop2 = _regenerator2.default.mark(function _loop2() {
									var movie, keys, Title, Rating, Poster, Runtime, Year, folder;
									return _regenerator2.default.wrap(function _loop2$(_context10) {
										while (1) {
											switch (_context10.prev = _context10.next) {
												case 0:
													movie = _step5.value;
													keys = Object.keys(movie);

													keys.splice(2, 1); //Remove Poster
													keys.forEach(function (item) {
														return movie[item] = movie[item].replace(/[\|><\*:\?\"/\/]/g, "");
													});
													Title = movie.Title, Rating = movie.Rating, Poster = movie.Poster, Runtime = movie.Runtime, Year = movie.Year;
													folder = Title + " " + Year + " (" + Runtime + ") (" + Rating + ")";

													fs.mkdirSync(basePath + "/Movies/" + folder);

													if (!(Poster !== "N/A")) {
														_context10.next = 10;
														break;
													}

													_context10.next = 10;
													return Helper.saveImage(Poster, basePath + "/Movies/" + folder + "/" + Title + ".jpg");

												case 10:
												case "end":
													return _context10.stop();
											}
										}
									}, _loop2, _this6);
								});
								_iterator5 = movies[Symbol.iterator]();

							case 6:
								if (_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done) {
									_context11.next = 11;
									break;
								}

								return _context11.delegateYield(_loop2(), "t0", 8);

							case 8:
								_iteratorNormalCompletion5 = true;
								_context11.next = 6;
								break;

							case 11:
								_context11.next = 17;
								break;

							case 13:
								_context11.prev = 13;
								_context11.t1 = _context11["catch"](3);
								_didIteratorError5 = true;
								_iteratorError5 = _context11.t1;

							case 17:
								_context11.prev = 17;
								_context11.prev = 18;

								if (!_iteratorNormalCompletion5 && _iterator5.return) {
									_iterator5.return();
								}

							case 20:
								_context11.prev = 20;

								if (!_didIteratorError5) {
									_context11.next = 23;
									break;
								}

								throw _iteratorError5;

							case 23:
								return _context11.finish(20);

							case 24:
								return _context11.finish(17);

							case 25:
								resolve();

							case 26:
							case "end":
								return _context11.stop();
						}
					}
				}, _callee9, _this6, [[3, 13, 17, 25], [18,, 20, 24]]);
			}));

			return function (_x8) {
				return _ref25.apply(this, arguments);
			};
		}());
	} catch (e) {
		console.log("makeMoviesFolders error");console.log(new Error(e));
	}
}function filterFiles(files) {
	var dirs = [],
	    video = [],
	    other = [];

	files.map(function (file) {
		if (Helper.isDir(file)) {
			dirs.push(file);return;
		}

		var _Helper$isMatch = Helper.isMatch(file),
		    _Helper$isMatch$episo = _Helper$isMatch.episode,
		    episode = _Helper$isMatch$episo === undefined ? null : _Helper$isMatch$episo,
		    type = _Helper$isMatch.type,
		    _Helper$isMatch$name = _Helper$isMatch.name,
		    name = _Helper$isMatch$name === undefined ? null : _Helper$isMatch$name;

		if (/Sample/gi.test(file)) {
			other.push(file);return;
		}
		if (type && /\.mkv|\.mp4|\.srt|\.avi/gi.test(file)) video.push({ file: file, type: type, episode: episode, name: name });
		other.push(file);
	});
	return { dirs: dirs.sort(function (a, b) {
			return b.length - a.length;
		}), video: video, other: other };
}

/***/ })
/******/ ]);