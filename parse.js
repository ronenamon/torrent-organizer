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
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
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
var patts = __webpack_require__(6);
var https = __webpack_require__(9);

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

	/* file => get Season and episode pattern */
	function getSeasonAndEpisode(files) {
		var keys = Object.keys(patts);
		for (var i = 0; i < keys.length; i += 1) {
			var objFunc = patts[keys[i]];
			if (!objFunc(files)) continue;
			return objFunc(files);
		}
	}

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

	/* Outputs season, Show name and episode number */
	this.getFileStats = function (file) {
		file = file.slice(file.lastIndexOf("/") + 1, file.length).replace(/[.]/g, " "); // "path/New Girl HDTV.LOL S02E01.mp4" -> "/New Girl HDTV LOL S02E01 mp4"

		var _getSeasonAndEpisode = getSeasonAndEpisode(file),
		    response = _getSeasonAndEpisode.response,
		    episode = _getSeasonAndEpisode.episode;

		if (!response) return false;
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
			if (Math.random() < 0.699) ran = ran.toLowerCase(); //So that it gives equal change to Upper case and lower case alphabets
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

"use strict";


var fs = __webpack_require__(0);
var HelperFuncs = __webpack_require__(1);

var Helper = new HelperFuncs();

module.exports = function () {

	/*
 	Renames file with their matched names ->
 		if !match found -> renames with same name to "No match Found"
 		if match found with a title -> renames it to it's respective season folder
 		if match found without a title -> renames it to it's respective season folder without adding title
 */
	this.renameFile = function (_ref) {
		var basePath = _ref.basePath,
		    randomFolder = _ref.randomFolder,
		    file = _ref.file,
		    apiData = _ref.apiData,
		    ext = _ref.ext;

		return new Promise(function (resolve) {
			var fileName = file.slice(file.lastIndexOf("/"), file.length);

			var _findCorrectNames = findCorrectNames(fileName, apiData),
			    res = _findCorrectNames.res,
			    name = _findCorrectNames.name,
			    season = _findCorrectNames.season,
			    episode = _findCorrectNames.episode,
			    title = _findCorrectNames.title;

			if (res === null) {
				fs.renameSync(file, "" + basePath + randomFolder + "/No Match Found" + fileName);resolve();
			} //Return null -> Just move it to new folder
			basePath = "" + basePath + randomFolder + "/" + name + "/Season " + season;
			var baseName = basePath + "/" + name + " S" + (season < 10 ? "0" + season : season) + "E" + episode; //For instance - Broad City S01E02
			res ? fs.renameSync(file, baseName + " - " + title + ext) : fs.renameSync(file, "" + baseName + ext);
			resolve();
		}).catch(function (e) {
			return console.log(e);
		});
	};

	/*
 	Gets all the files video and the others. Finds title for each of them, if found returns title, if not return name
 	if name not found - returns null
 */
	function findCorrectNames(file, apiData) {
		var _Helper$getFileStats = Helper.getFileStats(file),
		    name = _Helper$getFileStats.name,
		    season = _Helper$getFileStats.season,
		    episode = _Helper$getFileStats.episode;

		if (!name) return { res: null };
		var title = getEpisodeTitle({ name: name, season: season, episode: episode }, apiData);
		return title ? { episode: episode, title: title, name: name, season: season, res: true } : { res: false, name: name, season: season, episode: episode };
	}

	/*Finds title by matching Episode number with apiData's Episode Number */
	function getEpisodeTitle(_ref2, apiData) {
		var name = _ref2.name,
		    season = _ref2.season,
		    episode = _ref2.episode;

		var title = void 0;
		apiData.forEach(function (currShow) {
			if (name !== currShow.Title) return;
			episode < 10 ? episode = parseInt(episode) : episode;
			currShow.Episodes.forEach(function (_ref3) {
				var Episode = _ref3.Episode,
				    Title = _ref3.Title;
				return episode == Episode ? title = Title : "";
			});
		});
		return title ? title.replace(/[^\w\s-\.]/gi, "") : null; //Repalce is for weird titles like - Horseback Riding\Man Zone
	}
};

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

module.exports = __webpack_require__(7);


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


module.exports = {
	seasonPatt: function seasonPatt(file) {
		//For instance -> S02E05
		var episode = /(S|s)\d+(E|e)+\d\d/g.exec(file);
		if (!episode) return { response: false };
		episode = episode[0].toUpperCase();
		return { episode: episode, response: true };
	},
	seasonXEpiNamePatt: function seasonXEpiNamePatt(file) {
		// For instance -> 1x02
		var episode = /\d+x\d\d/gi.exec(file);
		if (!episode) return { response: false };
		episode = episode[0];
		episode.indexOf("x") === 1 ? episode += "S0" : episode += "S"; //1x10 -> S01x10 or 19x09 -> S19x09
		episode = episode.replace(/x/gi, "E");
		return { episode: episode, response: true };
	}
};

/***/ }),
/* 7 */
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

module.exports = __webpack_require__(8);

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
/* 8 */
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
/* 9 */
/***/ (function(module, exports) {

module.exports = require("https");

/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


///basePath = basePath + "/"; //Adding "/" instead of "\" because I can use find the first one in an array and second is a escape char (Decrepted, I guess)
//basePath = basePath.replace(/\\/g, "/"); //Oct 29 2016, Changed this

var _regenerator = __webpack_require__(5);

var _regenerator2 = _interopRequireDefault(_regenerator);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* Renames video and sub files, removes hearing aid from subs and delete files other than video files */
var whatToDoWithFile = function () {
	var _ref9 = _asyncToGenerator(_regenerator2.default.mark(function _callee4(info) {
		var ext;
		return _regenerator2.default.wrap(function _callee4$(_context4) {
			while (1) {
				switch (_context4.prev = _context4.next) {
					case 0:
						_context4.prev = 0;
						ext = info.file.slice(info.file.length - 4, info.file.length);

						if (ext === ".srt") Subs.fixSubs(info.file);

						if (!/\.mkv|\.mp4|\.srt|\.avi/g.test(ext)) {
							_context4.next = 8;
							break;
						}

						_context4.next = 6;
						return Rename.renameFile(_extends({}, info, { ext: ext }));

					case 6:
						_context4.next = 9;
						break;

					case 8:
						fs.unlinkSync(info.file);

					case 9:
						_context4.next = 14;
						break;

					case 11:
						_context4.prev = 11;
						_context4.t0 = _context4["catch"](0);
						console.log(_context4.t0);
					case 14:
					case "end":
						return _context4.stop();
				}
			}
		}, _callee4, this, [[0, 11]]);
	}));

	return function whatToDoWithFile(_x3) {
		return _ref9.apply(this, arguments);
	};
}();

/* Gets show names with their respective season numbers */


/* Downloads and save posters */
var savePosters = function () {
	var _ref13 = _asyncToGenerator(_regenerator2.default.mark(function _callee6(_ref14) {
		var basePath = _ref14.basePath,
		    posters = _ref14.posters,
		    showName = _ref14.showName;

		var _iteratorNormalCompletion4, _didIteratorError4, _iteratorError4, _iterator4, _step4, _ref16, title, url;

		return _regenerator2.default.wrap(function _callee6$(_context7) {
			while (1) {
				switch (_context7.prev = _context7.next) {
					case 0:
						_context7.prev = 0;
						_iteratorNormalCompletion4 = true;
						_didIteratorError4 = false;
						_iteratorError4 = undefined;
						_context7.prev = 4;
						_iterator4 = posters[Symbol.iterator]();

					case 6:
						if (_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done) {
							_context7.next = 19;
							break;
						}

						_ref16 = _step4.value;
						title = _ref16.title, url = _ref16.url;

						title = title.replace(/%20/g, "").toLowerCase();

						if (!(title === showName.replace(/\s/gi, "").toLowerCase())) {
							_context7.next = 15;
							break;
						}

						_context7.next = 13;
						return Helper.saveImage(url, "" + basePath + showName + "/" + showName + ".jpg");

					case 13:
						_context7.next = 16;
						break;

					case 15:
						"";

					case 16:
						_iteratorNormalCompletion4 = true;
						_context7.next = 6;
						break;

					case 19:
						_context7.next = 25;
						break;

					case 21:
						_context7.prev = 21;
						_context7.t0 = _context7["catch"](4);
						_didIteratorError4 = true;
						_iteratorError4 = _context7.t0;

					case 25:
						_context7.prev = 25;
						_context7.prev = 26;

						if (!_iteratorNormalCompletion4 && _iterator4.return) {
							_iterator4.return();
						}

					case 28:
						_context7.prev = 28;

						if (!_didIteratorError4) {
							_context7.next = 31;
							break;
						}

						throw _iteratorError4;

					case 31:
						return _context7.finish(28);

					case 32:
						return _context7.finish(25);

					case 33:
						_context7.next = 38;
						break;

					case 35:
						_context7.prev = 35;
						_context7.t1 = _context7["catch"](0);
						console.log(_context7.t1);
					case 38:
					case "end":
						return _context7.stop();
				}
			}
		}, _callee6, this, [[0, 35], [4, 21, 25, 33], [26,, 28, 32]]);
	}));

	return function savePosters(_x5) {
		return _ref13.apply(this, arguments);
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
var RenameFuncs = __webpack_require__(4);

var Helper = new HelperFuncs();
var Subs = new SubsFuncs();
var GetFiles = new GetFilesFuncs();
var Rename = new RenameFuncs();

/* Start of the Function */
_asyncToGenerator(_regenerator2.default.mark(function _callee2() {
	var _this = this;

	var basePath, files, _filterFiles, dirs, video, other, shows, _ref2, _ref3, apiData, posters, randomFolder;

	return _regenerator2.default.wrap(function _callee2$(_context2) {
		while (1) {
			switch (_context2.prev = _context2.next) {
				case 0:
					_context2.prev = 0;
					basePath = "H:/Tv Shows".replace(/\\/g, "/");

					if (basePath) {
						_context2.next = 4;
						break;
					}

					return _context2.abrupt("return");

				case 4:
					if (basePath[basePath.length - 1] !== "/") basePath += "/";
					files = GetFiles.readFiles(basePath);
					_filterFiles = filterFiles(files), dirs = _filterFiles.dirs, video = _filterFiles.video, other = _filterFiles.other;
					shows = getShows(video);
					_context2.next = 10;
					return getApiData(shows);

				case 10:
					_ref2 = _context2.sent;
					_ref3 = _slicedToArray(_ref2, 2);
					apiData = _ref3[0];
					posters = _ref3[1];
					randomFolder = Helper.generateRandomFolderName();
					_context2.next = 17;
					return makeShowFolders({ basePath: basePath, randomFolder: randomFolder, shows: shows, posters: posters });

				case 17:
					_context2.next = 19;
					return Promise.all(other.map(function () {
						var _ref4 = _asyncToGenerator(_regenerator2.default.mark(function _callee(file) {
							return _regenerator2.default.wrap(function _callee$(_context) {
								while (1) {
									switch (_context.prev = _context.next) {
										case 0:
											_context.next = 2;
											return whatToDoWithFile({ basePath: basePath, randomFolder: randomFolder, file: file, apiData: apiData });

										case 2:
											return _context.abrupt("return", _context.sent);

										case 3:
										case "end":
											return _context.stop();
									}
								}
							}, _callee, _this);
						}));

						return function (_x) {
							return _ref4.apply(this, arguments);
						};
					}()));

				case 19:
					console.log("Removing dirs");
					removeDirs(dirs);
					_context2.next = 27;
					break;

				case 23:
					_context2.prev = 23;
					_context2.t0 = _context2["catch"](0);

					console.log("Organize error");
					console.log(new Error(_context2.t0));

				case 27:
				case "end":
					return _context2.stop();
			}
		}
	}, _callee2, this, [[0, 23]]);
}))();

/* Gets shows data through OmdbAPI with their poster url's */
function getApiData(shows) {
	var _this2 = this;

	try {
		return new Promise(function () {
			var _ref5 = _asyncToGenerator(_regenerator2.default.mark(function _callee3(resolve) {
				var apiData, posters, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, showName, season, _ref8, Poster, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, item;

				return _regenerator2.default.wrap(function _callee3$(_context3) {
					while (1) {
						switch (_context3.prev = _context3.next) {
							case 0:
								apiData = [], posters = [];
								_iteratorNormalCompletion = true;
								_didIteratorError = false;
								_iteratorError = undefined;
								_context3.prev = 4;
								_iterator = Object.keys(shows)[Symbol.iterator]();

							case 6:
								if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
									_context3.next = 47;
									break;
								}

								showName = _step.value;
								season = shows[showName].season;

								showName = showName.split(" ").join("%20"); //For api
								_context3.next = 12;
								return Helper.getData("/?t=" + showName);

							case 12:
								_ref8 = _context3.sent;
								Poster = _ref8.Poster;

								posters.push({ title: showName, url: Poster });
								_iteratorNormalCompletion2 = true;
								_didIteratorError2 = false;
								_iteratorError2 = undefined;
								_context3.prev = 18;
								_iterator2 = season[Symbol.iterator]();

							case 20:
								if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
									_context3.next = 30;
									break;
								}

								item = _step2.value;
								_context3.t0 = apiData;
								_context3.next = 25;
								return Helper.getData("/?t=" + showName + "&Season=" + item);

							case 25:
								_context3.t1 = _context3.sent;

								_context3.t0.push.call(_context3.t0, _context3.t1);

							case 27:
								_iteratorNormalCompletion2 = true;
								_context3.next = 20;
								break;

							case 30:
								_context3.next = 36;
								break;

							case 32:
								_context3.prev = 32;
								_context3.t2 = _context3["catch"](18);
								_didIteratorError2 = true;
								_iteratorError2 = _context3.t2;

							case 36:
								_context3.prev = 36;
								_context3.prev = 37;

								if (!_iteratorNormalCompletion2 && _iterator2.return) {
									_iterator2.return();
								}

							case 39:
								_context3.prev = 39;

								if (!_didIteratorError2) {
									_context3.next = 42;
									break;
								}

								throw _iteratorError2;

							case 42:
								return _context3.finish(39);

							case 43:
								return _context3.finish(36);

							case 44:
								_iteratorNormalCompletion = true;
								_context3.next = 6;
								break;

							case 47:
								_context3.next = 53;
								break;

							case 49:
								_context3.prev = 49;
								_context3.t3 = _context3["catch"](4);
								_didIteratorError = true;
								_iteratorError = _context3.t3;

							case 53:
								_context3.prev = 53;
								_context3.prev = 54;

								if (!_iteratorNormalCompletion && _iterator.return) {
									_iterator.return();
								}

							case 56:
								_context3.prev = 56;

								if (!_didIteratorError) {
									_context3.next = 59;
									break;
								}

								throw _iteratorError;

							case 59:
								return _context3.finish(56);

							case 60:
								return _context3.finish(53);

							case 61:
								apiData = apiData.filter(function (_ref6) {
									var Response = _ref6.Response;
									return Response === "True";
								});
								posters = posters.filter(function (_ref7) {
									var url = _ref7.url,
									    title = _ref7.title;
									return url && title;
								});
								resolve([apiData, posters]);

							case 64:
							case "end":
								return _context3.stop();
						}
					}
				}, _callee3, _this2, [[4, 49, 53, 61], [18, 32, 36, 44], [37,, 39, 43], [54,, 56, 60]]);
			}));

			return function (_x2) {
				return _ref5.apply(this, arguments);
			};
		}());
	} catch (e) {
		console.log("Execute API error");
		console.log(new Error(e));
	}
}function getShows(files) {
	var shows = {};
	files.map(function (file) {
		var _Helper$getFileStats = Helper.getFileStats(file),
		    name = _Helper$getFileStats.name,
		    season = _Helper$getFileStats.season;

		if (!name) return;
		var sameShow = Helper.sameShow(shows, name, season);
		if (!sameShow) {
			shows[name] = { season: [season], length: 1 };return;
		} //New show detected
		if (!sameShow.newSeason) return; //Same show detected
		shows[name].season.push(season); //Same show but different season
		shows[name].length += 1;
	});
	return shows;
}

/* Removes empty dirs after the rename of the files */
function removeDirs(files) {
	files.map(function (file) {
		return fs.rmdirSync(file);
	}); //This just does not throw any errors
}

/* Makes folder for the shows with; Season and showName */
function makeShowFolders(_ref10) {
	var _this3 = this;

	var basePath = _ref10.basePath,
	    randomFolder = _ref10.randomFolder,
	    shows = _ref10.shows,
	    posters = _ref10.posters;

	try {
		return new Promise(function () {
			var _ref11 = _asyncToGenerator(_regenerator2.default.mark(function _callee5(resolve) {
				var _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _loop, _iterator3, _step3;

				return _regenerator2.default.wrap(function _callee5$(_context6) {
					while (1) {
						switch (_context6.prev = _context6.next) {
							case 0:
								makeInitialFolders({ basePath: basePath, randomFolder: randomFolder });
								basePath += randomFolder + "/";
								_iteratorNormalCompletion3 = true;
								_didIteratorError3 = false;
								_iteratorError3 = undefined;
								_context6.prev = 5;
								_loop = _regenerator2.default.mark(function _loop() {
									var showName, season;
									return _regenerator2.default.wrap(function _loop$(_context5) {
										while (1) {
											switch (_context5.prev = _context5.next) {
												case 0:
													showName = _step3.value;
													season = shows[showName].season;

													fs.mkdirSync("" + basePath + showName);
													_context5.next = 5;
													return savePosters({ basePath: basePath, showName: showName, posters: posters });

												case 5:
													season.map(function (season) {
														return fs.mkdirSync("" + basePath + showName + "/Season " + season);
													});

												case 6:
												case "end":
													return _context5.stop();
											}
										}
									}, _loop, _this3);
								});
								_iterator3 = Object.keys(shows)[Symbol.iterator]();

							case 8:
								if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
									_context6.next = 13;
									break;
								}

								return _context6.delegateYield(_loop(), "t0", 10);

							case 10:
								_iteratorNormalCompletion3 = true;
								_context6.next = 8;
								break;

							case 13:
								_context6.next = 19;
								break;

							case 15:
								_context6.prev = 15;
								_context6.t1 = _context6["catch"](5);
								_didIteratorError3 = true;
								_iteratorError3 = _context6.t1;

							case 19:
								_context6.prev = 19;
								_context6.prev = 20;

								if (!_iteratorNormalCompletion3 && _iterator3.return) {
									_iterator3.return();
								}

							case 22:
								_context6.prev = 22;

								if (!_didIteratorError3) {
									_context6.next = 25;
									break;
								}

								throw _iteratorError3;

							case 25:
								return _context6.finish(22);

							case 26:
								return _context6.finish(19);

							case 27:
								console.log("Done!");
								resolve();

							case 29:
							case "end":
								return _context6.stop();
						}
					}
				}, _callee5, _this3, [[5, 15, 19, 27], [20,, 22, 26]]);
			}));

			return function (_x4) {
				return _ref11.apply(this, arguments);
			};
		}());
	} catch (e) {
		console.log("Make Show Folders Error");
		console.log(new Error(e));
	}
}

/*Makes the random folder and the no match folder */
function makeInitialFolders(_ref12) {
	var basePath = _ref12.basePath,
	    randomFolder = _ref12.randomFolder;

	fs.mkdirSync("" + basePath + randomFolder);
	fs.mkdirSync("" + basePath + randomFolder + "/No Match Found");
}function filterFiles(files) {
	var dirs = [],
	    video = [],
	    other = [];

	files.map(function (file) {
		var response = Helper.getFileStats(file);
		if (Helper.isDir(file)) {
			dirs.push(file);return;
		}
		if (response && /\.mkv|\.mp4|\.avi|/.test(file)) video.push(file);
		other.push(file);
	});
	return { dirs: dirs.sort(function (a, b) {
			return b.length - a.length;
		}), video: video, other: other };
}

/***/ })
/******/ ]);