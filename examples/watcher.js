(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _watcher = require('./src/watcher');

_watcher.learningElement$.tap(console.log).drain();

///////////////////////////////
// Test addition and removal //
///////////////////////////////

setTimeout(function () {

  var el = document.querySelector('[learning-element-ref="poll-1-version-1"]');
  el.outerHTML = "";
  //delete el;

  document.body.insertAdjacentHTML('afterbegin', '<div learning-element="poll" learning-element-ref="poll-1-version-1" learning-element-options="{}" second-load></div>');
}, 2000);

},{"./src/watcher":77}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = LinkedList;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Doubly linked list
 * @constructor
 */
function LinkedList() {
  this.head = null;
  this.length = 0;
}

/**
 * Add a node to the end of the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to add
 */
LinkedList.prototype.add = function (x) {
  if (this.head !== null) {
    this.head.prev = x;
    x.next = this.head;
  }
  this.head = x;
  ++this.length;
};

/**
 * Remove the provided node from the list
 * @param {{prev:Object|null, next:Object|null, dispose:function}} x node to remove
 */
LinkedList.prototype.remove = function (x) {
  // eslint-disable-line  complexity
  --this.length;
  if (x === this.head) {
    this.head = this.head.next;
  }
  if (x.next !== null) {
    x.next.prev = x.prev;
    x.next = null;
  }
  if (x.prev !== null) {
    x.prev.next = x.next;
    x.prev = null;
  }
};

/**
 * @returns {boolean} true iff there are no nodes in the list
 */
LinkedList.prototype.isEmpty = function () {
  return this.length === 0;
};

/**
 * Dispose all nodes
 * @returns {Promise} promise that fulfills when all nodes have been disposed,
 *  or rejects if an error occurs while disposing
 */
LinkedList.prototype.dispose = function () {
  if (this.isEmpty()) {
    return Promise.resolve();
  }

  var promises = [];
  var x = this.head;
  this.head = null;
  this.length = 0;

  while (x !== null) {
    promises.push(x.dispose());
    x = x.next;
  }

  return Promise.all(promises);
};
},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isPromise = isPromise;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function isPromise(p) {
  return p !== null && typeof p === 'object' && typeof p.then === 'function';
}
},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Queue;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

// Based on https://github.com/petkaantonov/deque

function Queue(capPow2) {
  this._capacity = capPow2 || 32;
  this._length = 0;
  this._head = 0;
}

Queue.prototype.push = function (x) {
  var len = this._length;
  this._checkCapacity(len + 1);

  var i = this._head + len & this._capacity - 1;
  this[i] = x;
  this._length = len + 1;
};

Queue.prototype.shift = function () {
  var head = this._head;
  var x = this[head];

  this[head] = void 0;
  this._head = head + 1 & this._capacity - 1;
  this._length--;
  return x;
};

Queue.prototype.isEmpty = function () {
  return this._length === 0;
};

Queue.prototype.length = function () {
  return this._length;
};

Queue.prototype._checkCapacity = function (size) {
  if (this._capacity < size) {
    this._ensureCapacity(this._capacity << 1);
  }
};

Queue.prototype._ensureCapacity = function (capacity) {
  var oldCapacity = this._capacity;
  this._capacity = capacity;

  var last = this._head + this._length;

  if (last > oldCapacity) {
    copy(this, 0, this, oldCapacity, last & oldCapacity - 1);
  }
};

function copy(src, srcIndex, dst, dstIndex, len) {
  for (var j = 0; j < len; ++j) {
    dst[j + dstIndex] = src[j + srcIndex];
    src[j + srcIndex] = void 0;
  }
}
},{}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Stream;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Stream(source) {
  this.source = source;
}
},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.scan = scan;
exports.reduce = reduce;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _runSource = require('../runSource');

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @param {Stream} stream stream to scan
 * @returns {Stream} new stream containing successive reduce results
 */
function scan(f, initial, stream) {
  return new _Stream2.default(new Scan(f, initial, stream.source));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Scan(f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
}

Scan.prototype.run = function (sink, scheduler) {
  var d1 = scheduler.asap(_PropagateTask2.default.event(this.value, sink));
  var d2 = this.source.run(new ScanSink(this.f, this.value, sink), scheduler);
  return dispose.all([d1, d2]);
};

function ScanSink(f, z, sink) {
  this.f = f;
  this.value = z;
  this.sink = sink;
}

ScanSink.prototype.event = function (t, x) {
  var f = this.f;
  this.value = f(this.value, x);
  this.sink.event(t, this.value);
};

ScanSink.prototype.error = _Pipe2.default.prototype.error;
ScanSink.prototype.end = _Pipe2.default.prototype.end;

/**
* Reduce a stream to produce a single result.  Note that reducing an infinite
* stream will return a Promise that never fulfills, but that may reject if an error
* occurs.
* @param {function(result:*, x:*):*} f reducer function
* @param {*} initial initial value
* @param {Stream} stream to reduce
* @returns {Promise} promise for the file result of the reduce
*/
function reduce(f, initial, stream) {
  return (0, _runSource.withDefaultScheduler)(new Reduce(f, initial, stream.source));
}

function Reduce(f, z, source) {
  this.source = source;
  this.f = f;
  this.value = z;
}

Reduce.prototype.run = function (sink, scheduler) {
  return this.source.run(new ReduceSink(this.f, this.value, sink), scheduler);
};

function ReduceSink(f, z, sink) {
  this.f = f;
  this.value = z;
  this.sink = sink;
}

ReduceSink.prototype.event = function (t, x) {
  var f = this.f;
  this.value = f(this.value, x);
  this.sink.event(t, this.value);
};

ReduceSink.prototype.error = _Pipe2.default.prototype.error;

ReduceSink.prototype.end = function (t) {
  this.sink.end(t, this.value);
};
},{"../Stream":6,"../disposable/dispose":34,"../runSource":45,"../scheduler/PropagateTask":47,"../sink/Pipe":54}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ap = ap;

var _combine = require('./combine');

var _prelude = require('@most/prelude');

/**
 * Assume fs is a stream containing functions, and apply the latest function
 * in fs to the latest value in xs.
 * fs:         --f---------g--------h------>
 * xs:         -a-------b-------c-------d-->
 * ap(fs, xs): --fa-----fb-gb---gc--hc--hd->
 * @param {Stream} fs stream of functions to apply to the latest x
 * @param {Stream} xs stream of values to which to apply all the latest f
 * @returns {Stream} stream containing all the applications of fs to xs
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function ap(fs, xs) {
  return (0, _combine.combine)(_prelude.apply, fs, xs);
}
},{"./combine":10,"@most/prelude":70}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.cons = cons;
exports.concat = concat;

var _core = require('../source/core');

var _continueWith = require('./continueWith');

/**
 * @param {*} x value to prepend
 * @param {Stream} stream
 * @returns {Stream} new stream with x prepended
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function cons(x, stream) {
  return concat((0, _core.of)(x), stream);
}

/**
* @param {Stream} left
* @param {Stream} right
* @returns {Stream} new stream containing all events in left followed by all
*  events in right.  This *timeshifts* right to the end of left.
*/
function concat(left, right) {
  return (0, _continueWith.continueWith)(function () {
    return right;
  }, left);
}
},{"../source/core":58,"./continueWith":12}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.combine = combine;
exports.combineArray = combineArray;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _transform = require('./transform');

var transform = _interopRequireWildcard(_transform);

var _core = require('../source/core');

var core = _interopRequireWildcard(_core);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _IndexSink = require('../sink/IndexSink');

var _IndexSink2 = _interopRequireDefault(_IndexSink);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

var _invoke = require('../invoke');

var _invoke2 = _interopRequireDefault(_invoke);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var map = base.map;
var tail = base.tail;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */
function combine(f /*, ...streams */) {
  return combineArray(f, tail(arguments));
}

/**
* Combine latest events from all input streams
* @param {function(...events):*} f function to combine most recent events
* @param {[Stream]} streams most recent events
* @returns {Stream} stream containing the result of applying f to the most recent
*  event of each input stream, whenever a new event arrives on any stream.
*/
function combineArray(f, streams) {
  var l = streams.length;
  return l === 0 ? core.empty() : l === 1 ? transform.map(f, streams[0]) : new _Stream2.default(combineSources(f, streams));
}

function combineSources(f, streams) {
  return new Combine(f, map(getSource, streams));
}

function getSource(stream) {
  return stream.source;
}

function Combine(f, sources) {
  this.f = f;
  this.sources = sources;
}

Combine.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new CombineSink(disposables, sinks, sink, this.f);

  for (var indexSink, i = 0; i < l; ++i) {
    indexSink = sinks[i] = new _IndexSink2.default(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return dispose.all(disposables);
};

function CombineSink(disposables, sinks, sink, f) {
  var this$1 = this;

  this.sink = sink;
  this.disposables = disposables;
  this.sinks = sinks;
  this.f = f;

  var l = sinks.length;
  this.awaiting = l;
  this.values = new Array(l);
  this.hasValue = new Array(l);
  for (var i = 0; i < l; ++i) {
    this$1.hasValue[i] = false;
  }

  this.activeCount = sinks.length;
}

CombineSink.prototype.error = _Pipe2.default.prototype.error;

CombineSink.prototype.event = function (t, indexedValue) {
  var i = indexedValue.index;
  var awaiting = this._updateReady(i);

  this.values[i] = indexedValue.value;
  if (awaiting === 0) {
    this.sink.event(t, (0, _invoke2.default)(this.f, this.values));
  }
};

CombineSink.prototype._updateReady = function (index) {
  if (this.awaiting > 0) {
    if (!this.hasValue[index]) {
      this.hasValue[index] = true;
      this.awaiting -= 1;
    }
  }
  return this.awaiting;
};

CombineSink.prototype.end = function (t, indexedValue) {
  dispose.tryDispose(t, this.disposables[indexedValue.index], this.sink);
  if (--this.activeCount === 0) {
    this.sink.end(t, indexedValue.value);
  }
};
},{"../Stream":6,"../disposable/dispose":34,"../invoke":40,"../sink/IndexSink":53,"../sink/Pipe":54,"../source/core":58,"./transform":30,"@most/prelude":70}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.concatMap = concatMap;

var _mergeConcurrently = require('./mergeConcurrently');

/**
 * Map each value in stream to a new stream, and concatenate them all
 * stream:              -a---b---cX
 * f(a):                 1-1-1-1X
 * f(b):                        -2-2-2-2X
 * f(c):                                -3-3-3-3X
 * stream.concatMap(f): -1-1-1-1-2-2-2-2-3-3-3-3X
 * @param {function(x:*):Stream} f function to map each value to a stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function concatMap(f, stream) {
  return (0, _mergeConcurrently.mergeMapConcurrently)(f, 1, stream);
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
},{"./mergeConcurrently":20}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.continueWith = continueWith;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function continueWith(f, stream) {
  return new _Stream2.default(new ContinueWith(f, stream.source));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function ContinueWith(f, source) {
  this.f = f;
  this.source = source;
}

ContinueWith.prototype.run = function (sink, scheduler) {
  return new ContinueWithSink(this.f, this.source, sink, scheduler);
};

function ContinueWithSink(f, source, sink, scheduler) {
  this.f = f;
  this.sink = sink;
  this.scheduler = scheduler;
  this.active = true;
  this.disposable = dispose.once(source.run(this, scheduler));
}

ContinueWithSink.prototype.error = _Pipe2.default.prototype.error;

ContinueWithSink.prototype.event = function (t, x) {
  if (!this.active) {
    return;
  }
  this.sink.event(t, x);
};

ContinueWithSink.prototype.end = function (t, x) {
  if (!this.active) {
    return;
  }

  dispose.tryDispose(t, this.disposable, this.sink);
  this._startNext(t, x, this.sink);
};

ContinueWithSink.prototype._startNext = function (t, x, sink) {
  try {
    this.disposable = this._continue(this.f, x, sink);
  } catch (e) {
    sink.error(t, e);
  }
};

ContinueWithSink.prototype._continue = function (f, x, sink) {
  return f(x).source.run(sink, this.scheduler);
};

ContinueWithSink.prototype.dispose = function () {
  this.active = false;
  return this.disposable.dispose();
};
},{"../Stream":6,"../disposable/dispose":34,"../sink/Pipe":54}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.delay = delay;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @param {Stream} stream
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function delay(delayTime, stream) {
  return delayTime <= 0 ? stream : new _Stream2.default(new Delay(delayTime, stream.source));
}

function Delay(dt, source) {
  this.dt = dt;
  this.source = source;
}

Delay.prototype.run = function (sink, scheduler) {
  var delaySink = new DelaySink(this.dt, sink, scheduler);
  return dispose.all([delaySink, this.source.run(delaySink, scheduler)]);
};

function DelaySink(dt, sink, scheduler) {
  this.dt = dt;
  this.sink = sink;
  this.scheduler = scheduler;
}

DelaySink.prototype.dispose = function () {
  var self = this;
  this.scheduler.cancelAll(function (task) {
    return task.sink === self.sink;
  });
};

DelaySink.prototype.event = function (t, x) {
  this.scheduler.delay(this.dt, _PropagateTask2.default.event(x, this.sink));
};

DelaySink.prototype.end = function (t, x) {
  this.scheduler.delay(this.dt, _PropagateTask2.default.end(x, this.sink));
};

DelaySink.prototype.error = _Pipe2.default.prototype.error;
},{"../Stream":6,"../disposable/dispose":34,"../scheduler/PropagateTask":47,"../sink/Pipe":54}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flatMapError = undefined;
exports.recoverWith = recoverWith;
exports.throwError = throwError;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _SafeSink = require('../sink/SafeSink');

var _SafeSink2 = _interopRequireDefault(_SafeSink);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _tryEvent = require('../source/tryEvent');

var tryEvent = _interopRequireWildcard(_tryEvent);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * If stream encounters an error, recover and continue with items from stream
 * returned by f.
 * @param {function(error:*):Stream} f function which returns a new stream
 * @param {Stream} stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */
function recoverWith(f, stream) {
  return new _Stream2.default(new RecoverWith(f, stream.source));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var flatMapError = exports.flatMapError = recoverWith;

/**
 * Create a stream containing only an error
 * @param {*} e error value, preferably an Error or Error subtype
 * @returns {Stream} new stream containing only an error
 */
function throwError(e) {
  return new _Stream2.default(new ErrorSource(e));
}

function ErrorSource(e) {
  this.value = e;
}

ErrorSource.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new _PropagateTask2.default(runError, this.value, sink));
};

function runError(t, e, sink) {
  sink.error(t, e);
}

function RecoverWith(f, source) {
  this.f = f;
  this.source = source;
}

RecoverWith.prototype.run = function (sink, scheduler) {
  return new RecoverWithSink(this.f, this.source, sink, scheduler);
};

function RecoverWithSink(f, source, sink, scheduler) {
  this.f = f;
  this.sink = new _SafeSink2.default(sink);
  this.scheduler = scheduler;
  this.disposable = source.run(this, scheduler);
}

RecoverWithSink.prototype.event = function (t, x) {
  tryEvent.tryEvent(t, x, this.sink);
};

RecoverWithSink.prototype.end = function (t, x) {
  tryEvent.tryEnd(t, x, this.sink);
};

RecoverWithSink.prototype.error = function (t, e) {
  var nextSink = this.sink.disable();

  dispose.tryDispose(t, this.disposable, this.sink);
  this._startNext(t, e, nextSink);
};

RecoverWithSink.prototype._startNext = function (t, x, sink) {
  try {
    this.disposable = this._continue(this.f, x, sink);
  } catch (e) {
    sink.error(t, e);
  }
};

RecoverWithSink.prototype._continue = function (f, x, sink) {
  var stream = f(x);
  return stream.source.run(sink, this.scheduler);
};

RecoverWithSink.prototype.dispose = function () {
  return this.disposable.dispose();
};
},{"../Stream":6,"../disposable/dispose":34,"../scheduler/PropagateTask":47,"../sink/SafeSink":55,"../source/tryEvent":66}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.filter = filter;
exports.skipRepeats = skipRepeats;
exports.skipRepeatsWith = skipRepeatsWith;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _Filter = require('../fusion/Filter');

var _Filter2 = _interopRequireDefault(_Filter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Retain only items matching a predicate
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @param {Stream} stream stream to filter
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */
function filter(p, stream) {
  return new _Stream2.default(_Filter2.default.create(p, stream.source));
}

/**
 * Skip repeated events, using === to detect duplicates
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function skipRepeats(stream) {
  return skipRepeatsWith(same, stream);
}

/**
 * Skip repeated events using the provided equals function to detect duplicates
 * @param {function(a:*, b:*):boolean} equals optional function to compare items
 * @param {Stream} stream stream from which to omit repeated events
 * @returns {Stream} stream without repeated events
 */
function skipRepeatsWith(equals, stream) {
  return new _Stream2.default(new SkipRepeats(equals, stream.source));
}

function SkipRepeats(equals, source) {
  this.equals = equals;
  this.source = source;
}

SkipRepeats.prototype.run = function (sink, scheduler) {
  return this.source.run(new SkipRepeatsSink(this.equals, sink), scheduler);
};

function SkipRepeatsSink(equals, sink) {
  this.equals = equals;
  this.sink = sink;
  this.value = void 0;
  this.init = true;
}

SkipRepeatsSink.prototype.end = _Pipe2.default.prototype.end;
SkipRepeatsSink.prototype.error = _Pipe2.default.prototype.error;

SkipRepeatsSink.prototype.event = function (t, x) {
  if (this.init) {
    this.init = false;
    this.value = x;
    this.sink.event(t, x);
  } else if (!this.equals(this.value, x)) {
    this.value = x;
    this.sink.event(t, x);
  }
};

function same(a, b) {
  return a === b;
}
},{"../Stream":6,"../fusion/Filter":36,"../sink/Pipe":54}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flatMap = flatMap;
exports.join = join;

var _mergeConcurrently = require('./mergeConcurrently');

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @param {Stream} stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */
function flatMap(f, stream) {
  return (0, _mergeConcurrently.mergeMapConcurrently)(f, Infinity, stream);
}

/**
 * Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer. Event arrival times are preserved.
 * @param {Stream<Stream<X>>} stream stream of streams
 * @returns {Stream<X>} new stream containing all events of all inner streams
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function join(stream) {
  return (0, _mergeConcurrently.mergeConcurrently)(Infinity, stream);
}
},{"./mergeConcurrently":20}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.throttle = throttle;
exports.debounce = debounce;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

var _Map = require('../fusion/Map');

var _Map2 = _interopRequireDefault(_Map);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Limit the rate of events by suppressing events that occur too often
 * @param {Number} period time to suppress events
 * @param {Stream} stream
 * @returns {Stream}
 */
function throttle(period, stream) {
  return new _Stream2.default(throttleSource(period, stream.source));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function throttleSource(period, source) {
  return source instanceof _Map2.default ? commuteMapThrottle(period, source) : source instanceof Throttle ? fuseThrottle(period, source) : new Throttle(period, source);
}

function commuteMapThrottle(period, source) {
  return _Map2.default.create(source.f, throttleSource(period, source.source));
}

function fuseThrottle(period, source) {
  return new Throttle(Math.max(period, source.period), source.source);
}

function Throttle(period, source) {
  this.period = period;
  this.source = source;
}

Throttle.prototype.run = function (sink, scheduler) {
  return this.source.run(new ThrottleSink(this.period, sink), scheduler);
};

function ThrottleSink(period, sink) {
  this.time = 0;
  this.period = period;
  this.sink = sink;
}

ThrottleSink.prototype.event = function (t, x) {
  if (t >= this.time) {
    this.time = t + this.period;
    this.sink.event(t, x);
  }
};

ThrottleSink.prototype.end = _Pipe2.default.prototype.end;

ThrottleSink.prototype.error = _Pipe2.default.prototype.error;

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * @param {Number} period events occuring more frequently than this
 *  will be suppressed
 * @param {Stream} stream stream to debounce
 * @returns {Stream} new debounced stream
 */
function debounce(period, stream) {
  return new _Stream2.default(new Debounce(period, stream.source));
}

function Debounce(dt, source) {
  this.dt = dt;
  this.source = source;
}

Debounce.prototype.run = function (sink, scheduler) {
  return new DebounceSink(this.dt, this.source, sink, scheduler);
};

function DebounceSink(dt, source, sink, scheduler) {
  this.dt = dt;
  this.sink = sink;
  this.scheduler = scheduler;
  this.value = void 0;
  this.timer = null;

  var sourceDisposable = source.run(this, scheduler);
  this.disposable = dispose.all([this, sourceDisposable]);
}

DebounceSink.prototype.event = function (t, x) {
  this._clearTimer();
  this.value = x;
  this.timer = this.scheduler.delay(this.dt, _PropagateTask2.default.event(x, this.sink));
};

DebounceSink.prototype.end = function (t, x) {
  if (this._clearTimer()) {
    this.sink.event(t, this.value);
    this.value = void 0;
  }
  this.sink.end(t, x);
};

DebounceSink.prototype.error = function (t, x) {
  this._clearTimer();
  this.sink.error(t, x);
};

DebounceSink.prototype.dispose = function () {
  this._clearTimer();
};

DebounceSink.prototype._clearTimer = function () {
  if (this.timer === null) {
    return false;
  }
  this.timer.dispose();
  this.timer = null;
  return true;
};
},{"../Stream":6,"../disposable/dispose":34,"../fusion/Map":38,"../scheduler/PropagateTask":47,"../sink/Pipe":54}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loop = loop;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @param {Stream} stream event stream
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function loop(stepper, seed, stream) {
  return new _Stream2.default(new Loop(stepper, seed, stream.source));
}

function Loop(stepper, seed, source) {
  this.step = stepper;
  this.seed = seed;
  this.source = source;
}

Loop.prototype.run = function (sink, scheduler) {
  return this.source.run(new LoopSink(this.step, this.seed, sink), scheduler);
};

function LoopSink(stepper, seed, sink) {
  this.step = stepper;
  this.seed = seed;
  this.sink = sink;
}

LoopSink.prototype.error = _Pipe2.default.prototype.error;

LoopSink.prototype.event = function (t, x) {
  var result = this.step(this.seed, x);
  this.seed = result.seed;
  this.sink.event(t, result.value);
};

LoopSink.prototype.end = function (t) {
  this.sink.end(t, this.seed);
};
},{"../Stream":6,"../sink/Pipe":54}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.merge = merge;
exports.mergeArray = mergeArray;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _IndexSink = require('../sink/IndexSink');

var _IndexSink2 = _interopRequireDefault(_IndexSink);

var _core = require('../source/core');

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var copy = base.copy;
var reduce = base.reduce;

/**
 * @returns {Stream} stream containing events from all streams in the argument
 * list in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function merge() /* ...streams*/{
  return mergeArray(copy(arguments));
}

/**
 * @param {Array} streams array of stream to merge
 * @returns {Stream} stream containing events from all input observables
 * in time order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */
function mergeArray(streams) {
  var l = streams.length;
  return l === 0 ? (0, _core.empty)() : l === 1 ? streams[0] : new _Stream2.default(mergeSources(streams));
}

/**
 * This implements fusion/flattening for merge.  It will
 * fuse adjacent merge operations.  For example:
 * - a.merge(b).merge(c) effectively becomes merge(a, b, c)
 * - merge(a, merge(b, c)) effectively becomes merge(a, b, c)
 * It does this by concatenating the sources arrays of
 * any nested Merge sources, in effect "flattening" nested
 * merge operations into a single merge.
 */
function mergeSources(streams) {
  return new Merge(reduce(appendSources, [], streams));
}

function appendSources(sources, stream) {
  var source = stream.source;
  return source instanceof Merge ? sources.concat(source.sources) : sources.concat(source);
}

function Merge(sources) {
  this.sources = sources;
}

Merge.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);

  var mergeSink = new MergeSink(disposables, sinks, sink);

  for (var indexSink, i = 0; i < l; ++i) {
    indexSink = sinks[i] = new _IndexSink2.default(i, mergeSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return dispose.all(disposables);
};

function MergeSink(disposables, sinks, sink) {
  this.sink = sink;
  this.disposables = disposables;
  this.activeCount = sinks.length;
}

MergeSink.prototype.error = _Pipe2.default.prototype.error;

MergeSink.prototype.event = function (t, indexValue) {
  this.sink.event(t, indexValue.value);
};

MergeSink.prototype.end = function (t, indexedValue) {
  dispose.tryDispose(t, this.disposables[indexedValue.index], this.sink);
  if (--this.activeCount === 0) {
    this.sink.end(t, indexedValue.value);
  }
};
},{"../Stream":6,"../disposable/dispose":34,"../sink/IndexSink":53,"../sink/Pipe":54,"../source/core":58,"@most/prelude":70}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mergeConcurrently = mergeConcurrently;
exports.mergeMapConcurrently = mergeMapConcurrently;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _LinkedList = require('../LinkedList');

var _LinkedList2 = _interopRequireDefault(_LinkedList);

var _prelude = require('@most/prelude');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function mergeConcurrently(concurrency, stream) {
  return mergeMapConcurrently(_prelude.id, concurrency, stream);
}

function mergeMapConcurrently(f, concurrency, stream) {
  return new _Stream2.default(new MergeConcurrently(f, concurrency, stream.source));
}

function MergeConcurrently(f, concurrency, source) {
  this.f = f;
  this.concurrency = concurrency;
  this.source = source;
}

MergeConcurrently.prototype.run = function (sink, scheduler) {
  return new Outer(this.f, this.concurrency, this.source, sink, scheduler);
};

function Outer(f, concurrency, source, sink, scheduler) {
  this.f = f;
  this.concurrency = concurrency;
  this.sink = sink;
  this.scheduler = scheduler;
  this.pending = [];
  this.current = new _LinkedList2.default();
  this.disposable = dispose.once(source.run(this, scheduler));
  this.active = true;
}

Outer.prototype.event = function (t, x) {
  this._addInner(t, x);
};

Outer.prototype._addInner = function (t, x) {
  if (this.current.length < this.concurrency) {
    this._startInner(t, x);
  } else {
    this.pending.push(x);
  }
};

Outer.prototype._startInner = function (t, x) {
  try {
    this._initInner(t, x);
  } catch (e) {
    this.error(t, e);
  }
};

Outer.prototype._initInner = function (t, x) {
  var innerSink = new Inner(t, this, this.sink);
  innerSink.disposable = mapAndRun(this.f, x, innerSink, this.scheduler);
  this.current.add(innerSink);
};

function mapAndRun(f, x, sink, scheduler) {
  return f(x).source.run(sink, scheduler);
}

Outer.prototype.end = function (t, x) {
  this.active = false;
  dispose.tryDispose(t, this.disposable, this.sink);
  this._checkEnd(t, x);
};

Outer.prototype.error = function (t, e) {
  this.active = false;
  this.sink.error(t, e);
};

Outer.prototype.dispose = function () {
  this.active = false;
  this.pending.length = 0;
  return Promise.all([this.disposable.dispose(), this.current.dispose()]);
};

Outer.prototype._endInner = function (t, x, inner) {
  this.current.remove(inner);
  dispose.tryDispose(t, inner, this);

  if (this.pending.length === 0) {
    this._checkEnd(t, x);
  } else {
    this._startInner(t, this.pending.shift());
  }
};

Outer.prototype._checkEnd = function (t, x) {
  if (!this.active && this.current.isEmpty()) {
    this.sink.end(t, x);
  }
};

function Inner(time, outer, sink) {
  this.prev = this.next = null;
  this.time = time;
  this.outer = outer;
  this.sink = sink;
  this.disposable = void 0;
}

Inner.prototype.event = function (t, x) {
  this.sink.event(Math.max(t, this.time), x);
};

Inner.prototype.end = function (t, x) {
  this.outer._endInner(Math.max(t, this.time), x, this);
};

Inner.prototype.error = function (t, e) {
  this.outer.error(Math.max(t, this.time), e);
};

Inner.prototype.dispose = function () {
  return this.disposable.dispose();
};
},{"../LinkedList":3,"../Stream":6,"../disposable/dispose":34,"@most/prelude":70}],21:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.observe = observe;
exports.drain = drain;

var _runSource = require('../runSource');

var _transform = require('./transform');

/**
 * Observe all the event values in the stream in time order. The
 * provided function `f` will be called for each event value
 * @param {function(x:T):*} f function to call with each event value
 * @param {Stream<T>} stream stream to observe
 * @return {Promise} promise that fulfills after the stream ends without
 *  an error, or rejects if the stream ends with an error.
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function observe(f, stream) {
  return drain((0, _transform.tap)(f, stream));
}

/**
 * "Run" a stream by creating demand and consuming all events
 * @param {Stream<T>} stream stream to drain
 * @return {Promise} promise that fulfills after the stream ends without
 *  an error, or rejects if the stream ends with an error.
 */
function drain(stream) {
  return (0, _runSource.withDefaultScheduler)(stream.source);
}
},{"../runSource":45,"./transform":30}],22:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromPromise = fromPromise;
exports.awaitPromises = awaitPromises;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _fatalError = require('../fatalError');

var _fatalError2 = _interopRequireDefault(_fatalError);

var _core = require('../source/core');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a stream containing only the promise's fulfillment
 * value at the time it fulfills.
 * @param {Promise<T>} p promise
 * @return {Stream<T>} stream containing promise's fulfillment value.
 *  If the promise rejects, the stream will error
 */
function fromPromise(p) {
  return awaitPromises((0, _core.of)(p));
}

/**
 * Turn a Stream<Promise<T>> into Stream<T> by awaiting each promise.
 * Event order is preserved.
 * @param {Stream<Promise<T>>} stream
 * @return {Stream<T>} stream of fulfillment values.  The stream will
 * error if any promise rejects.
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function awaitPromises(stream) {
  return new _Stream2.default(new Await(stream.source));
}

function Await(source) {
  this.source = source;
}

Await.prototype.run = function (sink, scheduler) {
  return this.source.run(new AwaitSink(sink, scheduler), scheduler);
};

function AwaitSink(sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
  this.queue = Promise.resolve();
  var self = this;

  // Pre-create closures, to avoid creating them per event
  this._eventBound = function (x) {
    self.sink.event(self.scheduler.now(), x);
  };

  this._endBound = function (x) {
    self.sink.end(self.scheduler.now(), x);
  };

  this._errorBound = function (e) {
    self.sink.error(self.scheduler.now(), e);
  };
}

AwaitSink.prototype.event = function (t, promise) {
  var self = this;
  this.queue = this.queue.then(function () {
    return self._event(promise);
  }).catch(this._errorBound);
};

AwaitSink.prototype.end = function (t, x) {
  var self = this;
  this.queue = this.queue.then(function () {
    return self._end(x);
  }).catch(this._errorBound);
};

AwaitSink.prototype.error = function (t, e) {
  var self = this;
  // Don't resolve error values, propagate directly
  this.queue = this.queue.then(function () {
    return self._errorBound(e);
  }).catch(_fatalError2.default);
};

AwaitSink.prototype._event = function (promise) {
  return promise.then(this._eventBound);
};

AwaitSink.prototype._end = function (x) {
  return Promise.resolve(x).then(this._endBound);
};
},{"../Stream":6,"../fatalError":35,"../source/core":58}],23:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.sample = sample;
exports.sampleWith = sampleWith;
exports.sampleArray = sampleArray;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

var _invoke = require('../invoke');

var _invoke2 = _interopRequireDefault(_invoke);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * When an event arrives on sampler, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @param {Stream} sampler streams will be sampled whenever an event arrives
 *  on sampler
 * @returns {Stream} stream of sampled and transformed values
 */
function sample(f, sampler /*, ...streams */) {
  return sampleArray(f, sampler, base.drop(2, arguments));
}

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  stream's latest value will be propagated
 * @param {Stream} stream stream of values
 * @returns {Stream} sampled stream of values
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function sampleWith(sampler, stream) {
  return new _Stream2.default(new Sampler(base.id, sampler.source, [stream.source]));
}

function sampleArray(f, sampler, streams) {
  return new _Stream2.default(new Sampler(f, sampler.source, base.map(getSource, streams)));
}

function getSource(stream) {
  return stream.source;
}

function Sampler(f, sampler, sources) {
  this.f = f;
  this.sampler = sampler;
  this.sources = sources;
}

Sampler.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l + 1);
  var sinks = new Array(l);

  var sampleSink = new SampleSink(this.f, sinks, sink);

  for (var hold, i = 0; i < l; ++i) {
    hold = sinks[i] = new Hold(sampleSink);
    disposables[i] = this$1.sources[i].run(hold, scheduler);
  }

  disposables[i] = this.sampler.run(sampleSink, scheduler);

  return dispose.all(disposables);
};

function Hold(sink) {
  this.sink = sink;
  this.hasValue = false;
}

Hold.prototype.event = function (t, x) {
  this.value = x;
  this.hasValue = true;
  this.sink._notify(this);
};

Hold.prototype.end = function () {};
Hold.prototype.error = _Pipe2.default.prototype.error;

function SampleSink(f, sinks, sink) {
  this.f = f;
  this.sinks = sinks;
  this.sink = sink;
  this.active = false;
}

SampleSink.prototype._notify = function () {
  if (!this.active) {
    this.active = this.sinks.every(hasValue);
  }
};

SampleSink.prototype.event = function (t) {
  if (this.active) {
    this.sink.event(t, (0, _invoke2.default)(this.f, base.map(getValue, this.sinks)));
  }
};

SampleSink.prototype.end = _Pipe2.default.prototype.end;
SampleSink.prototype.error = _Pipe2.default.prototype.error;

function hasValue(hold) {
  return hold.hasValue;
}

function getValue(hold) {
  return hold.value;
}
},{"../Stream":6,"../disposable/dispose":34,"../invoke":40,"../sink/Pipe":54,"@most/prelude":70}],24:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.take = take;
exports.skip = skip;
exports.slice = slice;
exports.takeWhile = takeWhile;
exports.skipWhile = skipWhile;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _core = require('../source/core');

var core = _interopRequireWildcard(_core);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _Map = require('../fusion/Map');

var _Map2 = _interopRequireDefault(_Map);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream containing only up to the first n items from stream
 */
function take(n, stream) {
  return slice(0, n, stream);
}

/**
 * @param {number} n
 * @param {Stream} stream
 * @returns {Stream} new stream with the first n items removed
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function skip(n, stream) {
  return slice(n, Infinity, stream);
}

/**
 * Slice a stream by index. Negative start/end indexes are not supported
 * @param {number} start
 * @param {number} end
 * @param {Stream} stream
 * @returns {Stream} stream containing items where start <= index < end
 */
function slice(start, end, stream) {
  return end <= start ? core.empty() : new _Stream2.default(sliceSource(start, end, stream.source));
}

function sliceSource(start, end, source) {
  return source instanceof _Map2.default ? commuteMapSlice(start, end, source) : source instanceof Slice ? fuseSlice(start, end, source) : new Slice(start, end, source);
}

function commuteMapSlice(start, end, source) {
  return _Map2.default.create(source.f, sliceSource(start, end, source.source));
}

function fuseSlice(start, end, source) {
  start += source.min;
  end = Math.min(end + source.min, source.max);
  return new Slice(start, end, source.source);
}

function Slice(min, max, source) {
  this.source = source;
  this.min = min;
  this.max = max;
}

Slice.prototype.run = function (sink, scheduler) {
  return new SliceSink(this.min, this.max - this.min, this.source, sink, scheduler);
};

function SliceSink(skip, take, source, sink, scheduler) {
  this.sink = sink;
  this.skip = skip;
  this.take = take;
  this.disposable = dispose.once(source.run(this, scheduler));
}

SliceSink.prototype.end = _Pipe2.default.prototype.end;
SliceSink.prototype.error = _Pipe2.default.prototype.error;

SliceSink.prototype.event = function (t, x) {
  // eslint-disable-line complexity
  if (this.skip > 0) {
    this.skip -= 1;
    return;
  }

  if (this.take === 0) {
    return;
  }

  this.take -= 1;
  this.sink.event(t, x);
  if (this.take === 0) {
    this.dispose();
    this.sink.end(t, x);
  }
};

SliceSink.prototype.dispose = function () {
  return this.disposable.dispose();
};

function takeWhile(p, stream) {
  return new _Stream2.default(new TakeWhile(p, stream.source));
}

function TakeWhile(p, source) {
  this.p = p;
  this.source = source;
}

TakeWhile.prototype.run = function (sink, scheduler) {
  return new TakeWhileSink(this.p, this.source, sink, scheduler);
};

function TakeWhileSink(p, source, sink, scheduler) {
  this.p = p;
  this.sink = sink;
  this.active = true;
  this.disposable = dispose.once(source.run(this, scheduler));
}

TakeWhileSink.prototype.end = _Pipe2.default.prototype.end;
TakeWhileSink.prototype.error = _Pipe2.default.prototype.error;

TakeWhileSink.prototype.event = function (t, x) {
  if (!this.active) {
    return;
  }

  var p = this.p;
  this.active = p(x);
  if (this.active) {
    this.sink.event(t, x);
  } else {
    this.dispose();
    this.sink.end(t, x);
  }
};

TakeWhileSink.prototype.dispose = function () {
  return this.disposable.dispose();
};

function skipWhile(p, stream) {
  return new _Stream2.default(new SkipWhile(p, stream.source));
}

function SkipWhile(p, source) {
  this.p = p;
  this.source = source;
}

SkipWhile.prototype.run = function (sink, scheduler) {
  return this.source.run(new SkipWhileSink(this.p, sink), scheduler);
};

function SkipWhileSink(p, sink) {
  this.p = p;
  this.sink = sink;
  this.skipping = true;
}

SkipWhileSink.prototype.end = _Pipe2.default.prototype.end;
SkipWhileSink.prototype.error = _Pipe2.default.prototype.error;

SkipWhileSink.prototype.event = function (t, x) {
  if (this.skipping) {
    var p = this.p;
    this.skipping = p(x);
    if (this.skipping) {
      return;
    }
  }

  this.sink.event(t, x);
};
},{"../Stream":6,"../disposable/dispose":34,"../fusion/Map":38,"../sink/Pipe":54,"../source/core":58}],25:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.switch = undefined;
exports.switchLatest = switchLatest;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @param {Stream} stream of streams on which to switch
 * @returns {Stream} switching stream
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function switchLatest(stream) {
  return new _Stream2.default(new Switch(stream.source));
}

exports.switch = switchLatest;


function Switch(source) {
  this.source = source;
}

Switch.prototype.run = function (sink, scheduler) {
  var switchSink = new SwitchSink(sink, scheduler);
  return dispose.all([switchSink, this.source.run(switchSink, scheduler)]);
};

function SwitchSink(sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
  this.current = null;
  this.ended = false;
}

SwitchSink.prototype.event = function (t, stream) {
  this._disposeCurrent(t); // TODO: capture the result of this dispose
  this.current = new Segment(t, Infinity, this, this.sink);
  this.current.disposable = stream.source.run(this.current, this.scheduler);
};

SwitchSink.prototype.end = function (t, x) {
  this.ended = true;
  this._checkEnd(t, x);
};

SwitchSink.prototype.error = function (t, e) {
  this.ended = true;
  this.sink.error(t, e);
};

SwitchSink.prototype.dispose = function () {
  return this._disposeCurrent(this.scheduler.now());
};

SwitchSink.prototype._disposeCurrent = function (t) {
  if (this.current !== null) {
    return this.current._dispose(t);
  }
};

SwitchSink.prototype._disposeInner = function (t, inner) {
  inner._dispose(t); // TODO: capture the result of this dispose
  if (inner === this.current) {
    this.current = null;
  }
};

SwitchSink.prototype._checkEnd = function (t, x) {
  if (this.ended && this.current === null) {
    this.sink.end(t, x);
  }
};

SwitchSink.prototype._endInner = function (t, x, inner) {
  this._disposeInner(t, inner);
  this._checkEnd(t, x);
};

SwitchSink.prototype._errorInner = function (t, e, inner) {
  this._disposeInner(t, inner);
  this.sink.error(t, e);
};

function Segment(min, max, outer, sink) {
  this.min = min;
  this.max = max;
  this.outer = outer;
  this.sink = sink;
  this.disposable = dispose.empty();
}

Segment.prototype.event = function (t, x) {
  if (t < this.max) {
    this.sink.event(Math.max(t, this.min), x);
  }
};

Segment.prototype.end = function (t, x) {
  this.outer._endInner(Math.max(t, this.min), x, this);
};

Segment.prototype.error = function (t, e) {
  this.outer._errorInner(Math.max(t, this.min), e, this);
};

Segment.prototype._dispose = function (t) {
  this.max = t;
  dispose.tryDispose(t, this.disposable, this.sink);
};
},{"../Stream":6,"../disposable/dispose":34}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.thru = thru;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function thru(f, stream) {
  return f(stream);
}
},{}],27:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.takeUntil = takeUntil;
exports.skipUntil = skipUntil;
exports.during = during;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _flatMap = require('../combinator/flatMap');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function takeUntil(signal, stream) {
  return new _Stream2.default(new Until(signal.source, stream.source));
}

function skipUntil(signal, stream) {
  return new _Stream2.default(new Since(signal.source, stream.source));
}

function during(timeWindow, stream) {
  return takeUntil((0, _flatMap.join)(timeWindow), skipUntil(timeWindow, stream));
}

function Until(maxSignal, source) {
  this.maxSignal = maxSignal;
  this.source = source;
}

Until.prototype.run = function (sink, scheduler) {
  var min = new Bound(-Infinity, sink);
  var max = new UpperBound(this.maxSignal, sink, scheduler);
  var disposable = this.source.run(new TimeWindowSink(min, max, sink), scheduler);

  return dispose.all([min, max, disposable]);
};

function Since(minSignal, source) {
  this.minSignal = minSignal;
  this.source = source;
}

Since.prototype.run = function (sink, scheduler) {
  var min = new LowerBound(this.minSignal, sink, scheduler);
  var max = new Bound(Infinity, sink);
  var disposable = this.source.run(new TimeWindowSink(min, max, sink), scheduler);

  return dispose.all([min, max, disposable]);
};

function Bound(value, sink) {
  this.value = value;
  this.sink = sink;
}

Bound.prototype.error = _Pipe2.default.prototype.error;
Bound.prototype.event = noop;
Bound.prototype.end = noop;
Bound.prototype.dispose = noop;

function TimeWindowSink(min, max, sink) {
  this.min = min;
  this.max = max;
  this.sink = sink;
}

TimeWindowSink.prototype.event = function (t, x) {
  if (t >= this.min.value && t < this.max.value) {
    this.sink.event(t, x);
  }
};

TimeWindowSink.prototype.error = _Pipe2.default.prototype.error;
TimeWindowSink.prototype.end = _Pipe2.default.prototype.end;

function LowerBound(signal, sink, scheduler) {
  this.value = Infinity;
  this.sink = sink;
  this.disposable = signal.run(this, scheduler);
}

LowerBound.prototype.event = function (t /*, x */) {
  if (t < this.value) {
    this.value = t;
  }
};

LowerBound.prototype.end = noop;
LowerBound.prototype.error = _Pipe2.default.prototype.error;

LowerBound.prototype.dispose = function () {
  return this.disposable.dispose();
};

function UpperBound(signal, sink, scheduler) {
  this.value = Infinity;
  this.sink = sink;
  this.disposable = signal.run(this, scheduler);
}

UpperBound.prototype.event = function (t, x) {
  if (t < this.value) {
    this.value = t;
    this.sink.end(t, x);
  }
};

UpperBound.prototype.end = noop;
UpperBound.prototype.error = _Pipe2.default.prototype.error;

UpperBound.prototype.dispose = function () {
  return this.disposable.dispose();
};

function noop() {}
},{"../Stream":6,"../combinator/flatMap":16,"../disposable/dispose":34,"../sink/Pipe":54}],28:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.timestamp = timestamp;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function timestamp(stream) {
  return new _Stream2.default(new Timestamp(stream.source));
}

function Timestamp(source) {
  this.source = source;
}

Timestamp.prototype.run = function (sink, scheduler) {
  return this.source.run(new TimestampSink(sink), scheduler);
};

function TimestampSink(sink) {
  this.sink = sink;
}

TimestampSink.prototype.end = _Pipe2.default.prototype.end;
TimestampSink.prototype.error = _Pipe2.default.prototype.error;

TimestampSink.prototype.event = function (t, x) {
  this.sink.event(t, { time: t, value: x });
};
},{"../Stream":6,"../sink/Pipe":54}],29:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transduce = transduce;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Transform a stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @param  {Stream} stream stream whose events will be passed through the
 *  transducer
 * @return {Stream} stream of events transformed by the transducer
 */
function transduce(transducer, stream) {
  return new _Stream2.default(new Transduce(transducer, stream.source));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Transduce(transducer, source) {
  this.transducer = transducer;
  this.source = source;
}

Transduce.prototype.run = function (sink, scheduler) {
  var xf = this.transducer(new Transformer(sink));
  return this.source.run(new TransduceSink(getTxHandler(xf), sink), scheduler);
};

function TransduceSink(adapter, sink) {
  this.xf = adapter;
  this.sink = sink;
}

TransduceSink.prototype.event = function (t, x) {
  var next = this.xf.step(t, x);

  return this.xf.isReduced(next) ? this.sink.end(t, this.xf.getResult(next)) : next;
};

TransduceSink.prototype.end = function (t, x) {
  return this.xf.result(x);
};

TransduceSink.prototype.error = function (t, e) {
  return this.sink.error(t, e);
};

function Transformer(sink) {
  this.time = -Infinity;
  this.sink = sink;
}

Transformer.prototype['@@transducer/init'] = Transformer.prototype.init = function () {};

Transformer.prototype['@@transducer/step'] = Transformer.prototype.step = function (t, x) {
  if (!isNaN(t)) {
    this.time = Math.max(t, this.time);
  }
  return this.sink.event(this.time, x);
};

Transformer.prototype['@@transducer/result'] = Transformer.prototype.result = function (x) {
  return this.sink.end(this.time, x);
};

/**
* Given an object supporting the new or legacy transducer protocol,
* create an adapter for it.
* @param {object} tx transform
* @returns {TxAdapter|LegacyTxAdapter}
*/
function getTxHandler(tx) {
  return typeof tx['@@transducer/step'] === 'function' ? new TxAdapter(tx) : new LegacyTxAdapter(tx);
}

/**
* Adapter for new official transducer protocol
* @param {object} tx transform
* @constructor
*/
function TxAdapter(tx) {
  this.tx = tx;
}

TxAdapter.prototype.step = function (t, x) {
  return this.tx['@@transducer/step'](t, x);
};
TxAdapter.prototype.result = function (x) {
  return this.tx['@@transducer/result'](x);
};
TxAdapter.prototype.isReduced = function (x) {
  return x != null && x['@@transducer/reduced'];
};
TxAdapter.prototype.getResult = function (x) {
  return x['@@transducer/value'];
};

/**
* Adapter for older transducer protocol
* @param {object} tx transform
* @constructor
*/
function LegacyTxAdapter(tx) {
  this.tx = tx;
}

LegacyTxAdapter.prototype.step = function (t, x) {
  return this.tx.step(t, x);
};
LegacyTxAdapter.prototype.result = function (x) {
  return this.tx.result(x);
};
LegacyTxAdapter.prototype.isReduced = function (x) {
  return x != null && x.__transducers_reduced__;
};
LegacyTxAdapter.prototype.getResult = function (x) {
  return x.value;
};
},{"../Stream":6}],30:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.map = map;
exports.constant = constant;
exports.tap = tap;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _Map = require('../fusion/Map');

var _Map2 = _interopRequireDefault(_Map);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @param {Stream} stream stream to map
 * @returns {Stream} stream containing items transformed by f
 */
function map(f, stream) {
  return new _Stream2.default(_Map2.default.create(f, stream.source));
}

/**
* Replace each value in the stream with x
* @param {*} x
* @param {Stream} stream
* @returns {Stream} stream containing items replaced with x
*/
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function constant(x, stream) {
  return map(function () {
    return x;
  }, stream);
}

/**
* Perform a side effect for each item in the stream
* @param {function(x:*):*} f side effect to execute for each item. The
*  return value will be discarded.
* @param {Stream} stream stream to tap
* @returns {Stream} new stream containing the same items as this stream
*/
function tap(f, stream) {
  return new _Stream2.default(new Tap(f, stream.source));
}

function Tap(f, source) {
  this.source = source;
  this.f = f;
}

Tap.prototype.run = function (sink, scheduler) {
  return this.source.run(new TapSink(this.f, sink), scheduler);
};

function TapSink(f, sink) {
  this.sink = sink;
  this.f = f;
}

TapSink.prototype.end = _Pipe2.default.prototype.end;
TapSink.prototype.error = _Pipe2.default.prototype.error;

TapSink.prototype.event = function (t, x) {
  var f = this.f;
  f(x);
  this.sink.event(t, x);
};
},{"../Stream":6,"../fusion/Map":38,"../sink/Pipe":54}],31:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.zip = zip;
exports.zipArray = zipArray;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _transform = require('./transform');

var transform = _interopRequireWildcard(_transform);

var _core = require('../source/core');

var core = _interopRequireWildcard(_core);

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _IndexSink = require('../sink/IndexSink');

var _IndexSink2 = _interopRequireDefault(_IndexSink);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

var _invoke = require('../invoke');

var _invoke2 = _interopRequireDefault(_invoke);

var _Queue = require('../Queue');

var _Queue2 = _interopRequireDefault(_Queue);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var map = base.map; /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

var tail = base.tail;

/**
 * Combine streams pairwise (or tuple-wise) by index by applying f to values
 * at corresponding indices.  The returned stream ends when any of the input
 * streams ends.
 * @param {function} f function to combine values
 * @returns {Stream} new stream with items at corresponding indices combined
 *  using f
 */
function zip(f /*, ...streams */) {
  return zipArray(f, tail(arguments));
}

/**
* Combine streams pairwise (or tuple-wise) by index by applying f to values
* at corresponding indices.  The returned stream ends when any of the input
* streams ends.
* @param {function} f function to combine values
* @param {[Stream]} streams streams to zip using f
* @returns {Stream} new stream with items at corresponding indices combined
*  using f
*/
function zipArray(f, streams) {
  return streams.length === 0 ? core.empty() : streams.length === 1 ? transform.map(f, streams[0]) : new _Stream2.default(new Zip(f, map(getSource, streams)));
}

function getSource(stream) {
  return stream.source;
}

function Zip(f, sources) {
  this.f = f;
  this.sources = sources;
}

Zip.prototype.run = function (sink, scheduler) {
  var this$1 = this;

  var l = this.sources.length;
  var disposables = new Array(l);
  var sinks = new Array(l);
  var buffers = new Array(l);

  var zipSink = new ZipSink(this.f, buffers, sinks, sink);

  for (var indexSink, i = 0; i < l; ++i) {
    buffers[i] = new _Queue2.default();
    indexSink = sinks[i] = new _IndexSink2.default(i, zipSink);
    disposables[i] = this$1.sources[i].run(indexSink, scheduler);
  }

  return dispose.all(disposables);
};

function ZipSink(f, buffers, sinks, sink) {
  this.f = f;
  this.sinks = sinks;
  this.sink = sink;
  this.buffers = buffers;
}

ZipSink.prototype.event = function (t, indexedValue) {
  // eslint-disable-line complexity
  var buffers = this.buffers;
  var buffer = buffers[indexedValue.index];

  buffer.push(indexedValue.value);

  if (buffer.length() === 1) {
    if (!ready(this.buffers)) {
      return;
    }

    emitZipped(this.f, t, buffers, this.sink);

    if (ended(this.buffers, this.sinks)) {
      this.sink.end(t, void 0);
    }
  }
};

ZipSink.prototype.end = function (t, indexedValue) {
  var buffer = this.buffers[indexedValue.index];
  if (buffer.isEmpty()) {
    this.sink.end(t, indexedValue.value);
  }
};

ZipSink.prototype.error = _Pipe2.default.prototype.error;

function emitZipped(f, t, buffers, sink) {
  sink.event(t, (0, _invoke2.default)(f, map(head, buffers)));
}

function head(buffer) {
  return buffer.shift();
}

function ended(buffers, sinks) {
  for (var i = 0, l = buffers.length; i < l; ++i) {
    if (buffers[i].isEmpty() && !sinks[i].active) {
      return true;
    }
  }
  return false;
}

function ready(buffers) {
  for (var i = 0, l = buffers.length; i < l; ++i) {
    if (buffers[i].isEmpty()) {
      return false;
    }
  }
  return true;
}
},{"../Queue":5,"../Stream":6,"../disposable/dispose":34,"../invoke":40,"../sink/IndexSink":53,"../sink/Pipe":54,"../source/core":58,"./transform":30,"@most/prelude":70}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Disposable;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * Create a new Disposable which will dispose its underlying resource.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @constructor
 */
function Disposable(dispose, data) {
  this._dispose = dispose;
  this._data = data;
}

Disposable.prototype.dispose = function () {
  return this._dispose(this._data);
};
},{}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SettableDisposable;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function SettableDisposable() {
  this.disposable = void 0;
  this.disposed = false;
  this._resolve = void 0;

  var self = this;
  this.result = new Promise(function (resolve) {
    self._resolve = resolve;
  });
}

SettableDisposable.prototype.setDisposable = function (disposable) {
  if (this.disposable !== void 0) {
    throw new Error('setDisposable called more than once');
  }

  this.disposable = disposable;

  if (this.disposed) {
    this._resolve(disposable.dispose());
  }
};

SettableDisposable.prototype.dispose = function () {
  if (this.disposed) {
    return this.result;
  }

  this.disposed = true;

  if (this.disposable !== void 0) {
    this.result = this.disposable.dispose();
  }

  return this.result;
};
},{}],34:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryDispose = tryDispose;
exports.create = create;
exports.empty = empty;
exports.all = all;
exports.promised = promised;
exports.settable = settable;
exports.once = once;

var _Disposable = require('./Disposable');

var _Disposable2 = _interopRequireDefault(_Disposable);

var _SettableDisposable = require('./SettableDisposable');

var _SettableDisposable2 = _interopRequireDefault(_SettableDisposable);

var _Promise = require('../Promise');

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
var map = base.map;
var identity = base.id;

/**
 * Call disposable.dispose.  If it returns a promise, catch promise
 * error and forward it through the provided sink.
 * @param {number} t time
 * @param {{dispose: function}} disposable
 * @param {{error: function}} sink
 * @return {*} result of disposable.dispose
 */
function tryDispose(t, disposable, sink) {
  var result = disposeSafely(disposable);
  return (0, _Promise.isPromise)(result) ? result.catch(function (e) {
    sink.error(t, e);
  }) : result;
}

/**
 * Create a new Disposable which will dispose its underlying resource
 * at most once.
 * @param {function} dispose function
 * @param {*?} data any data to be passed to disposer function
 * @return {Disposable}
 */
function create(dispose, data) {
  return once(new _Disposable2.default(dispose, data));
}

/**
 * Create a noop disposable. Can be used to satisfy a Disposable
 * requirement when no actual resource needs to be disposed.
 * @return {Disposable|exports|module.exports}
 */
function empty() {
  return new _Disposable2.default(identity, void 0);
}

/**
 * Create a disposable that will dispose all input disposables in parallel.
 * @param {Array<Disposable>} disposables
 * @return {Disposable}
 */
function all(disposables) {
  return create(disposeAll, disposables);
}

function disposeAll(disposables) {
  return Promise.all(map(disposeSafely, disposables));
}

function disposeSafely(disposable) {
  try {
    return disposable.dispose();
  } catch (e) {
    return Promise.reject(e);
  }
}

/**
 * Create a disposable from a promise for another disposable
 * @param {Promise<Disposable>} disposablePromise
 * @return {Disposable}
 */
function promised(disposablePromise) {
  return create(disposePromise, disposablePromise);
}

function disposePromise(disposablePromise) {
  return disposablePromise.then(disposeOne);
}

function disposeOne(disposable) {
  return disposable.dispose();
}

/**
 * Create a disposable proxy that allows its underlying disposable to
 * be set later.
 * @return {SettableDisposable}
 */
function settable() {
  return new _SettableDisposable2.default();
}

/**
 * Wrap an existing disposable (which may not already have been once()d)
 * so that it will only dispose its underlying resource at most once.
 * @param {{ dispose: function() }} disposable
 * @return {Disposable} wrapped disposable
 */
function once(disposable) {
  return new _Disposable2.default(disposeMemoized, memoized(disposable));
}

function disposeMemoized(memoized) {
  if (!memoized.disposed) {
    memoized.disposed = true;
    memoized.value = disposeSafely(memoized.disposable);
    memoized.disposable = void 0;
  }

  return memoized.value;
}

function memoized(disposable) {
  return { disposed: false, disposable: disposable, value: void 0 };
}
},{"../Promise":4,"./Disposable":32,"./SettableDisposable":33,"@most/prelude":70}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fatalError;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fatalError(e) {
  setTimeout(function () {
    throw e;
  }, 0);
}
},{}],36:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Filter;

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Filter(p, source) {
  this.p = p;
  this.source = source;
}

/**
 * Create a filtered source, fusing adjacent filter.filter if possible
 * @param {function(x:*):boolean} p filtering predicate
 * @param {{run:function}} source source to filter
 * @returns {Filter} filtered source
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

Filter.create = function createFilter(p, source) {
  if (source instanceof Filter) {
    return new Filter(and(source.p, p), source.source);
  }

  return new Filter(p, source);
};

Filter.prototype.run = function (sink, scheduler) {
  return this.source.run(new FilterSink(this.p, sink), scheduler);
};

function FilterSink(p, sink) {
  this.p = p;
  this.sink = sink;
}

FilterSink.prototype.end = _Pipe2.default.prototype.end;
FilterSink.prototype.error = _Pipe2.default.prototype.error;

FilterSink.prototype.event = function (t, x) {
  var p = this.p;
  p(x) && this.sink.event(t, x);
};

function and(p, q) {
  return function (x) {
    return p(x) && q(x);
  };
}
},{"../sink/Pipe":54}],37:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = FilterMap;

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function FilterMap(p, f, source) {
  this.p = p;
  this.f = f;
  this.source = source;
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

FilterMap.prototype.run = function (sink, scheduler) {
  return this.source.run(new FilterMapSink(this.p, this.f, sink), scheduler);
};

function FilterMapSink(p, f, sink) {
  this.p = p;
  this.f = f;
  this.sink = sink;
}

FilterMapSink.prototype.event = function (t, x) {
  var f = this.f;
  var p = this.p;
  p(x) && this.sink.event(t, f(x));
};

FilterMapSink.prototype.end = _Pipe2.default.prototype.end;
FilterMapSink.prototype.error = _Pipe2.default.prototype.error;
},{"../sink/Pipe":54}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Map;

var _Pipe = require('../sink/Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

var _Filter = require('./Filter');

var _Filter2 = _interopRequireDefault(_Filter);

var _FilterMap = require('./FilterMap');

var _FilterMap2 = _interopRequireDefault(_FilterMap);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Map(f, source) {
  this.f = f;
  this.source = source;
}

/**
 * Create a mapped source, fusing adjacent map.map, filter.map,
 * and filter.map.map if possible
 * @param {function(*):*} f mapping function
 * @param {{run:function}} source source to map
 * @returns {Map|FilterMap} mapped source, possibly fused
 */
Map.create = function createMap(f, source) {
  if (source instanceof Map) {
    return new Map(base.compose(f, source.f), source.source);
  }

  if (source instanceof _Filter2.default) {
    return new _FilterMap2.default(source.p, f, source.source);
  }

  return new Map(f, source);
};

Map.prototype.run = function (sink, scheduler) {
  // eslint-disable-line no-extend-native
  return this.source.run(new MapSink(this.f, sink), scheduler);
};

function MapSink(f, sink) {
  this.f = f;
  this.sink = sink;
}

MapSink.prototype.end = _Pipe2.default.prototype.end;
MapSink.prototype.error = _Pipe2.default.prototype.error;

MapSink.prototype.event = function (t, x) {
  var f = this.f;
  this.sink.event(t, f(x));
};
},{"../sink/Pipe":54,"./Filter":36,"./FilterMap":37,"@most/prelude":70}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.PropagateTask = exports.defaultScheduler = exports.multicast = exports.throwError = exports.flatMapError = exports.recoverWith = exports.await = exports.awaitPromises = exports.fromPromise = exports.debounce = exports.throttle = exports.timestamp = exports.delay = exports.during = exports.since = exports.skipUntil = exports.until = exports.takeUntil = exports.skipWhile = exports.takeWhile = exports.slice = exports.skip = exports.take = exports.distinctBy = exports.skipRepeatsWith = exports.distinct = exports.skipRepeats = exports.filter = exports.switch = exports.switchLatest = exports.zipArray = exports.zip = exports.sampleWith = exports.sampleArray = exports.sample = exports.combineArray = exports.combine = exports.mergeArray = exports.merge = exports.mergeConcurrently = exports.concatMap = exports.flatMapEnd = exports.continueWith = exports.join = exports.chain = exports.flatMap = exports.transduce = exports.ap = exports.tap = exports.constant = exports.map = exports.startWith = exports.concat = exports.generate = exports.iterate = exports.unfold = exports.reduce = exports.scan = exports.loop = exports.drain = exports.forEach = exports.observe = exports.fromEvent = exports.periodic = exports.from = exports.never = exports.empty = exports.just = exports.of = exports.Stream = undefined;

var _fromEvent = require('./source/fromEvent');

Object.defineProperty(exports, 'fromEvent', {
  enumerable: true,
  get: function () {
    return _fromEvent.fromEvent;
  }
});

var _unfold = require('./source/unfold');

Object.defineProperty(exports, 'unfold', {
  enumerable: true,
  get: function () {
    return _unfold.unfold;
  }
});

var _iterate = require('./source/iterate');

Object.defineProperty(exports, 'iterate', {
  enumerable: true,
  get: function () {
    return _iterate.iterate;
  }
});

var _generate = require('./source/generate');

Object.defineProperty(exports, 'generate', {
  enumerable: true,
  get: function () {
    return _generate.generate;
  }
});

var _Stream = require('./Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

var _core = require('./source/core');

var _from = require('./source/from');

var _periodic = require('./source/periodic');

var _symbolObservable = require('symbol-observable');

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

var _subscribe = require('./observable/subscribe');

var _thru = require('./combinator/thru');

var _observe = require('./combinator/observe');

var _loop = require('./combinator/loop');

var _accumulate = require('./combinator/accumulate');

var _build = require('./combinator/build');

var _transform = require('./combinator/transform');

var _applicative = require('./combinator/applicative');

var _transduce = require('./combinator/transduce');

var _flatMap = require('./combinator/flatMap');

var _continueWith = require('./combinator/continueWith');

var _concatMap = require('./combinator/concatMap');

var _mergeConcurrently = require('./combinator/mergeConcurrently');

var _merge = require('./combinator/merge');

var _combine = require('./combinator/combine');

var _sample = require('./combinator/sample');

var _zip = require('./combinator/zip');

var _switch = require('./combinator/switch');

var _filter = require('./combinator/filter');

var _slice = require('./combinator/slice');

var _timeslice = require('./combinator/timeslice');

var _delay = require('./combinator/delay');

var _timestamp = require('./combinator/timestamp');

var _limit = require('./combinator/limit');

var _promises = require('./combinator/promises');

var _errors = require('./combinator/errors');

var _multicast = require('@most/multicast');

var _multicast2 = _interopRequireDefault(_multicast);

var _defaultScheduler = require('./scheduler/defaultScheduler');

var _defaultScheduler2 = _interopRequireDefault(_defaultScheduler);

var _PropagateTask = require('./scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Core stream type
 * @type {Stream}
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.Stream = _Stream2.default;

// Add of and empty to constructor for fantasy-land compat

_Stream2.default.of = _core.of;
_Stream2.default.empty = _core.empty;
// Add from to constructor for ES Observable compat
_Stream2.default.from = _from.from;
exports.of = _core.of;
exports.just = _core.of;
exports.empty = _core.empty;
exports.never = _core.never;
exports.from = _from.from;
exports.periodic = _periodic.periodic;

// -----------------------------------------------------------------------
// Draft ES Observable proposal interop
// https://github.com/zenparsing/es-observable

_Stream2.default.prototype.subscribe = function (subscriber) {
  return (0, _subscribe.subscribe)(subscriber, this);
};

_Stream2.default.prototype[_symbolObservable2.default] = function () {
  return this;
};

// -----------------------------------------------------------------------
// Fluent adapter

/**
 * Adapt a functional stream transform to fluent style.
 * It applies f to the this stream object
 * @param  {function(s: Stream): Stream} f function that
 * receives the stream itself and must return a new stream
 * @return {Stream}
 */
_Stream2.default.prototype.thru = function (f) {
  return (0, _thru.thru)(f, this);
};

// -----------------------------------------------------------------------
// Adapting other sources

/**
 * Create a stream of events from the supplied EventTarget or EventEmitter
 * @param {String} event event name
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter. The source
 *  must support either addEventListener/removeEventListener (w3c EventTarget:
 *  http://www.w3.org/TR/DOM-Level-2-Events/events.html#Events-EventTarget),
 *  or addListener/removeListener (node EventEmitter: http://nodejs.org/api/events.html)
 * @returns {Stream} stream of events of the specified type from the source
 */


// -----------------------------------------------------------------------
// Observing

exports.observe = _observe.observe;
exports.forEach = _observe.observe;
exports.drain = _observe.drain;

/**
 * Process all the events in the stream
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */

_Stream2.default.prototype.observe = _Stream2.default.prototype.forEach = function (f) {
  return (0, _observe.observe)(f, this);
};

/**
 * Consume all events in the stream, without providing a function to process each.
 * This causes a stream to become active and begin emitting events, and is useful
 * in cases where all processing has been setup upstream via other combinators, and
 * there is no need to process the terminal events.
 * @returns {Promise} promise that fulfills when the stream ends, or rejects
 *  if the stream fails with an unhandled error.
 */
_Stream2.default.prototype.drain = function () {
  return (0, _observe.drain)(this);
};

// -------------------------------------------------------

exports.loop = _loop.loop;

/**
 * Generalized feedback loop. Call a stepper function for each event. The stepper
 * will be called with 2 params: the current seed and the an event value.  It must
 * return a new { seed, value } pair. The `seed` will be fed back into the next
 * invocation of stepper, and the `value` will be propagated as the event value.
 * @param {function(seed:*, value:*):{seed:*, value:*}} stepper loop step function
 * @param {*} seed initial seed value passed to first stepper call
 * @returns {Stream} new stream whose values are the `value` field of the objects
 * returned by the stepper
 */

_Stream2.default.prototype.loop = function (stepper, seed) {
  return (0, _loop.loop)(stepper, seed, this);
};

// -------------------------------------------------------

exports.scan = _accumulate.scan;
exports.reduce = _accumulate.reduce;

/**
 * Create a stream containing successive reduce results of applying f to
 * the previous reduce result and the current stream item.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial initial value
 * @returns {Stream} new stream containing successive reduce results
 */

_Stream2.default.prototype.scan = function (f, initial) {
  return (0, _accumulate.scan)(f, initial, this);
};

/**
 * Reduce the stream to produce a single result.  Note that reducing an infinite
 * stream will return a Promise that never fulfills, but that may reject if an error
 * occurs.
 * @param {function(result:*, x:*):*} f reducer function
 * @param {*} initial optional initial value
 * @returns {Promise} promise for the file result of the reduce
 */
_Stream2.default.prototype.reduce = function (f, initial) {
  return (0, _accumulate.reduce)(f, initial, this);
};

// -----------------------------------------------------------------------
// Building and extending

exports.concat = _build.concat;
exports.startWith = _build.cons;

/**
 * @param {Stream} tail
 * @returns {Stream} new stream containing all items in this followed by
 *  all items in tail
 */

_Stream2.default.prototype.concat = function (tail) {
  return (0, _build.concat)(this, tail);
};

/**
 * @param {*} x value to prepend
 * @returns {Stream} a new stream with x prepended
 */
_Stream2.default.prototype.startWith = function (x) {
  return (0, _build.cons)(x, this);
};

// -----------------------------------------------------------------------
// Transforming

exports.map = _transform.map;
exports.constant = _transform.constant;
exports.tap = _transform.tap;
exports.ap = _applicative.ap;

/**
 * Transform each value in the stream by applying f to each
 * @param {function(*):*} f mapping function
 * @returns {Stream} stream containing items transformed by f
 */

_Stream2.default.prototype.map = function (f) {
  return (0, _transform.map)(f, this);
};

/**
 * Assume this stream contains functions, and apply each function to each item
 * in the provided stream.  This generates, in effect, a cross product.
 * @param {Stream} xs stream of items to which
 * @returns {Stream} stream containing the cross product of items
 */
_Stream2.default.prototype.ap = function (xs) {
  return (0, _applicative.ap)(this, xs);
};

/**
 * Replace each value in the stream with x
 * @param {*} x
 * @returns {Stream} stream containing items replaced with x
 */
_Stream2.default.prototype.constant = function (x) {
  return (0, _transform.constant)(x, this);
};

/**
 * Perform a side effect for each item in the stream
 * @param {function(x:*):*} f side effect to execute for each item. The
 *  return value will be discarded.
 * @returns {Stream} new stream containing the same items as this stream
 */
_Stream2.default.prototype.tap = function (f) {
  return (0, _transform.tap)(f, this);
};

// -----------------------------------------------------------------------
// Transducer support

exports.transduce = _transduce.transduce;

/**
 * Transform this stream by passing its events through a transducer.
 * @param  {function} transducer transducer function
 * @return {Stream} stream of events transformed by the transducer
 */

_Stream2.default.prototype.transduce = function (transducer) {
  return (0, _transduce.transduce)(transducer, this);
};

// -----------------------------------------------------------------------
// FlatMapping

// @deprecated flatMap, use chain instead
exports.flatMap = _flatMap.flatMap;
exports.chain = _flatMap.flatMap;
exports.join = _flatMap.join;

/**
 * Map each value in the stream to a new stream, and merge it into the
 * returned outer stream. Event arrival times are preserved.
 * @param {function(x:*):Stream} f chaining function, must return a Stream
 * @returns {Stream} new stream containing all events from each stream returned by f
 */

_Stream2.default.prototype.chain = function (f) {
  return (0, _flatMap.flatMap)(f, this);
};

// @deprecated use chain instead
_Stream2.default.prototype.flatMap = _Stream2.default.prototype.chain;

/**
* Monadic join. Flatten a Stream<Stream<X>> to Stream<X> by merging inner
* streams to the outer. Event arrival times are preserved.
* @returns {Stream<X>} new stream containing all events of all inner streams
*/
_Stream2.default.prototype.join = function () {
  return (0, _flatMap.join)(this);
};

// @deprecated flatMapEnd, use continueWith instead
exports.continueWith = _continueWith.continueWith;
exports.flatMapEnd = _continueWith.continueWith;

/**
 * Map the end event to a new stream, and begin emitting its values.
 * @param {function(x:*):Stream} f function that receives the end event value,
 * and *must* return a new Stream to continue with.
 * @returns {Stream} new stream that emits all events from the original stream,
 * followed by all events from the stream returned by f.
 */

_Stream2.default.prototype.continueWith = function (f) {
  return (0, _continueWith.continueWith)(f, this);
};

// @deprecated use continueWith instead
_Stream2.default.prototype.flatMapEnd = _Stream2.default.prototype.continueWith;

exports.concatMap = _concatMap.concatMap;


_Stream2.default.prototype.concatMap = function (f) {
  return (0, _concatMap.concatMap)(f, this);
};

// -----------------------------------------------------------------------
// Concurrent merging

exports.mergeConcurrently = _mergeConcurrently.mergeConcurrently;

/**
 * Flatten a Stream<Stream<X>> to Stream<X> by merging inner
 * streams to the outer, limiting the number of inner streams that may
 * be active concurrently.
 * @param {number} concurrency at most this many inner streams will be
 *  allowed to be active concurrently.
 * @return {Stream<X>} new stream containing all events of all inner
 *  streams, with limited concurrency.
 */

_Stream2.default.prototype.mergeConcurrently = function (concurrency) {
  return (0, _mergeConcurrently.mergeConcurrently)(concurrency, this);
};

// -----------------------------------------------------------------------
// Merging

exports.merge = _merge.merge;
exports.mergeArray = _merge.mergeArray;

/**
 * Merge this stream and all the provided streams
 * @returns {Stream} stream containing items from this stream and s in time
 * order.  If two events are simultaneous they will be merged in
 * arbitrary order.
 */

_Stream2.default.prototype.merge = function () /* ...streams*/{
  return (0, _merge.mergeArray)(base.cons(this, arguments));
};

// -----------------------------------------------------------------------
// Combining

exports.combine = _combine.combine;
exports.combineArray = _combine.combineArray;

/**
 * Combine latest events from all input streams
 * @param {function(...events):*} f function to combine most recent events
 * @returns {Stream} stream containing the result of applying f to the most recent
 *  event of each input stream, whenever a new event arrives on any stream.
 */

_Stream2.default.prototype.combine = function (f /*, ...streams*/) {
  return (0, _combine.combineArray)(f, base.replace(this, 0, arguments));
};

// -----------------------------------------------------------------------
// Sampling

exports.sample = _sample.sample;
exports.sampleArray = _sample.sampleArray;
exports.sampleWith = _sample.sampleWith;

/**
 * When an event arrives on sampler, emit the latest event value from stream.
 * @param {Stream} sampler stream of events at whose arrival time
 *  signal's latest value will be propagated
 * @returns {Stream} sampled stream of values
 */

_Stream2.default.prototype.sampleWith = function (sampler) {
  return (0, _sample.sampleWith)(sampler, this);
};

/**
 * When an event arrives on this stream, emit the result of calling f with the latest
 * values of all streams being sampled
 * @param {function(...values):*} f function to apply to each set of sampled values
 * @returns {Stream} stream of sampled and transformed values
 */
_Stream2.default.prototype.sample = function (f /* ...streams */) {
  return (0, _sample.sampleArray)(f, this, base.tail(arguments));
};

// -----------------------------------------------------------------------
// Zipping

exports.zip = _zip.zip;
exports.zipArray = _zip.zipArray;

/**
 * Pair-wise combine items with those in s. Given 2 streams:
 * [1,2,3] zipWith f [4,5,6] -> [f(1,4),f(2,5),f(3,6)]
 * Note: zip causes fast streams to buffer and wait for slow streams.
 * @param {function(a:Stream, b:Stream, ...):*} f function to combine items
 * @returns {Stream} new stream containing pairs
 */

_Stream2.default.prototype.zip = function (f /*, ...streams*/) {
  return (0, _zip.zipArray)(f, base.replace(this, 0, arguments));
};

// -----------------------------------------------------------------------
// Switching

// @deprecated switch, use switchLatest instead
exports.switchLatest = _switch.switchLatest;
exports.switch = _switch.switchLatest;

/**
 * Given a stream of streams, return a new stream that adopts the behavior
 * of the most recent inner stream.
 * @returns {Stream} switching stream
 */

_Stream2.default.prototype.switchLatest = function () {
  return (0, _switch.switchLatest)(this);
};

// @deprecated use switchLatest instead
_Stream2.default.prototype.switch = _Stream2.default.prototype.switchLatest;

// -----------------------------------------------------------------------
// Filtering

// @deprecated distinct, use skipRepeats instead
// @deprecated distinctBy, use skipRepeatsWith instead
exports.filter = _filter.filter;
exports.skipRepeats = _filter.skipRepeats;
exports.distinct = _filter.skipRepeats;
exports.skipRepeatsWith = _filter.skipRepeatsWith;
exports.distinctBy = _filter.skipRepeatsWith;

/**
 * Retain only items matching a predicate
 * stream:                           -12345678-
 * filter(x => x % 2 === 0, stream): --2-4-6-8-
 * @param {function(x:*):boolean} p filtering predicate called for each item
 * @returns {Stream} stream containing only items for which predicate returns truthy
 */

_Stream2.default.prototype.filter = function (p) {
  return (0, _filter.filter)(p, this);
};

/**
 * Skip repeated events, using === to compare items
 * stream:           -abbcd-
 * distinct(stream): -ab-cd-
 * @returns {Stream} stream with no repeated events
 */
_Stream2.default.prototype.skipRepeats = function () {
  return (0, _filter.skipRepeats)(this);
};

/**
 * Skip repeated events, using supplied equals function to compare items
 * @param {function(a:*, b:*):boolean} equals function to compare items
 * @returns {Stream} stream with no repeated events
 */
_Stream2.default.prototype.skipRepeatsWith = function (equals) {
  return (0, _filter.skipRepeatsWith)(equals, this);
};

// -----------------------------------------------------------------------
// Slicing

exports.take = _slice.take;
exports.skip = _slice.skip;
exports.slice = _slice.slice;
exports.takeWhile = _slice.takeWhile;
exports.skipWhile = _slice.skipWhile;

/**
 * stream:          -abcd-
 * take(2, stream): -ab|
 * @param {Number} n take up to this many events
 * @returns {Stream} stream containing at most the first n items from this stream
 */

_Stream2.default.prototype.take = function (n) {
  return (0, _slice.take)(n, this);
};

/**
 * stream:          -abcd->
 * skip(2, stream): ---cd->
 * @param {Number} n skip this many events
 * @returns {Stream} stream not containing the first n events
 */
_Stream2.default.prototype.skip = function (n) {
  return (0, _slice.skip)(n, this);
};

/**
 * Slice a stream by event index. Equivalent to, but more efficient than
 * stream.take(end).skip(start);
 * NOTE: Negative start and end are not supported
 * @param {Number} start skip all events before the start index
 * @param {Number} end allow all events from the start index to the end index
 * @returns {Stream} stream containing items where start <= index < end
 */
_Stream2.default.prototype.slice = function (start, end) {
  return (0, _slice.slice)(start, end, this);
};

/**
 * stream:                        -123451234->
 * takeWhile(x => x < 5, stream): -1234|
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items up to, but not including, the
 * first item for which p returns falsy.
 */
_Stream2.default.prototype.takeWhile = function (p) {
  return (0, _slice.takeWhile)(p, this);
};

/**
 * stream:                        -123451234->
 * skipWhile(x => x < 5, stream): -----51234->
 * @param {function(x:*):boolean} p predicate
 * @returns {Stream} stream containing items following *and including* the
 * first item for which p returns falsy.
 */
_Stream2.default.prototype.skipWhile = function (p) {
  return (0, _slice.skipWhile)(p, this);
};

// -----------------------------------------------------------------------
// Time slicing

// @deprecated takeUntil, use until instead
// @deprecated skipUntil, use since instead
exports.takeUntil = _timeslice.takeUntil;
exports.until = _timeslice.takeUntil;
exports.skipUntil = _timeslice.skipUntil;
exports.since = _timeslice.skipUntil;
exports.during = _timeslice.during;

/**
 * stream:                    -a-b-c-d-e-f-g->
 * signal:                    -------x
 * takeUntil(signal, stream): -a-b-c-|
 * @param {Stream} signal retain only events in stream before the first
 * event in signal
 * @returns {Stream} new stream containing only events that occur before
 * the first event in signal.
 */

_Stream2.default.prototype.until = function (signal) {
  return (0, _timeslice.takeUntil)(signal, this);
};

// @deprecated use until instead
_Stream2.default.prototype.takeUntil = _Stream2.default.prototype.until;

/**
* stream:                    -a-b-c-d-e-f-g->
* signal:                    -------x
* takeUntil(signal, stream): -------d-e-f-g->
* @param {Stream} signal retain only events in stream at or after the first
* event in signal
* @returns {Stream} new stream containing only events that occur after
* the first event in signal.
*/
_Stream2.default.prototype.since = function (signal) {
  return (0, _timeslice.skipUntil)(signal, this);
};

// @deprecated use since instead
_Stream2.default.prototype.skipUntil = _Stream2.default.prototype.since;

/**
* stream:                    -a-b-c-d-e-f-g->
* timeWindow:                -----s
* s:                               -----t
* stream.during(timeWindow): -----c-d-e-|
* @param {Stream<Stream>} timeWindow a stream whose first event (s) represents
*  the window start time.  That event (s) is itself a stream whose first event (t)
*  represents the window end time
* @returns {Stream} new stream containing only events within the provided timespan
*/
_Stream2.default.prototype.during = function (timeWindow) {
  return (0, _timeslice.during)(timeWindow, this);
};

// -----------------------------------------------------------------------
// Delaying

exports.delay = _delay.delay;

/**
 * @param {Number} delayTime milliseconds to delay each item
 * @returns {Stream} new stream containing the same items, but delayed by ms
 */

_Stream2.default.prototype.delay = function (delayTime) {
  return (0, _delay.delay)(delayTime, this);
};

// -----------------------------------------------------------------------
// Getting event timestamp

exports.timestamp = _timestamp.timestamp;

/**
 * Expose event timestamps into the stream. Turns a Stream<X> into
 * Stream<{time:t, value:X}>
 * @returns {Stream<{time:number, value:*}>}
 */

_Stream2.default.prototype.timestamp = function () {
  return (0, _timestamp.timestamp)(this);
};

// -----------------------------------------------------------------------
// Rate limiting

exports.throttle = _limit.throttle;
exports.debounce = _limit.debounce;

/**
 * Limit the rate of events
 * stream:              abcd----abcd----
 * throttle(2, stream): a-c-----a-c-----
 * @param {Number} period time to suppress events
 * @returns {Stream} new stream that skips events for throttle period
 */

_Stream2.default.prototype.throttle = function (period) {
  return (0, _limit.throttle)(period, this);
};

/**
 * Wait for a burst of events to subside and emit only the last event in the burst
 * stream:              abcd----abcd----
 * debounce(2, stream): -----d-------d--
 * @param {Number} period events occuring more frequently than this
 *  on the provided scheduler will be suppressed
 * @returns {Stream} new debounced stream
 */
_Stream2.default.prototype.debounce = function (period) {
  return (0, _limit.debounce)(period, this);
};

// -----------------------------------------------------------------------
// Awaiting Promises

// @deprecated await, use awaitPromises instead
exports.fromPromise = _promises.fromPromise;
exports.awaitPromises = _promises.awaitPromises;
exports.await = _promises.awaitPromises;

/**
 * Await promises, turning a Stream<Promise<X>> into Stream<X>.  Preserves
 * event order, but timeshifts events based on promise resolution time.
 * @returns {Stream<X>} stream containing non-promise values
 */

_Stream2.default.prototype.awaitPromises = function () {
  return (0, _promises.awaitPromises)(this);
};

// @deprecated use awaitPromises instead
_Stream2.default.prototype.await = _Stream2.default.prototype.awaitPromises;

// -----------------------------------------------------------------------
// Error handling

// @deprecated flatMapError, use recoverWith instead
exports.recoverWith = _errors.recoverWith;
exports.flatMapError = _errors.flatMapError;
exports.throwError = _errors.throwError;

/**
 * If this stream encounters an error, recover and continue with items from stream
 * returned by f.
 * stream:                  -a-b-c-X-
 * f(X):                           d-e-f-g-
 * flatMapError(f, stream): -a-b-c-d-e-f-g-
 * @param {function(error:*):Stream} f function which returns a new stream
 * @returns {Stream} new stream which will recover from an error by calling f
 */

_Stream2.default.prototype.recoverWith = function (f) {
  return (0, _errors.flatMapError)(f, this);
};

// @deprecated use recoverWith instead
_Stream2.default.prototype.flatMapError = _Stream2.default.prototype.recoverWith;

// -----------------------------------------------------------------------
// Multicasting

exports.multicast = _multicast2.default;

/**
 * Transform the stream into multicast stream.  That means that many subscribers
 * to the stream will not cause multiple invocations of the internal machinery.
 * @returns {Stream} new stream which will multicast events to all observers.
 */

_Stream2.default.prototype.multicast = function () {
  return (0, _multicast2.default)(this);
};

// export the instance of the defaultScheduler for third-party libraries
exports.defaultScheduler = _defaultScheduler2.default;

// export an implementation of Task used internally for third-party libraries

exports.PropagateTask = _PropagateTask2.default;
},{"./Stream":6,"./combinator/accumulate":7,"./combinator/applicative":8,"./combinator/build":9,"./combinator/combine":10,"./combinator/concatMap":11,"./combinator/continueWith":12,"./combinator/delay":13,"./combinator/errors":14,"./combinator/filter":15,"./combinator/flatMap":16,"./combinator/limit":17,"./combinator/loop":18,"./combinator/merge":19,"./combinator/mergeConcurrently":20,"./combinator/observe":21,"./combinator/promises":22,"./combinator/sample":23,"./combinator/slice":24,"./combinator/switch":25,"./combinator/thru":26,"./combinator/timeslice":27,"./combinator/timestamp":28,"./combinator/transduce":29,"./combinator/transform":30,"./combinator/zip":31,"./observable/subscribe":44,"./scheduler/PropagateTask":47,"./scheduler/defaultScheduler":51,"./source/core":58,"./source/from":59,"./source/fromEvent":61,"./source/generate":63,"./source/iterate":64,"./source/periodic":65,"./source/unfold":67,"@most/multicast":69,"@most/prelude":70,"symbol-observable":71}],40:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = invoke;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function invoke(f, args) {
  /*eslint complexity: [2,7]*/
  switch (args.length) {
    case 0:
      return f();
    case 1:
      return f(args[0]);
    case 2:
      return f(args[0], args[1]);
    case 3:
      return f(args[0], args[1], args[2]);
    case 4:
      return f(args[0], args[1], args[2], args[3]);
    case 5:
      return f(args[0], args[1], args[2], args[3], args[4]);
    default:
      return f.apply(void 0, args);
  }
}
},{}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isIterable = isIterable;
exports.getIterator = getIterator;
exports.makeIterable = makeIterable;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/*global Set, Symbol*/
var iteratorSymbol;
// Firefox ships a partial implementation using the name @@iterator.
// https://bugzilla.mozilla.org/show_bug.cgi?id=907077#c14
if (typeof Set === 'function' && typeof new Set()['@@iterator'] === 'function') {
  iteratorSymbol = '@@iterator';
} else {
  iteratorSymbol = typeof Symbol === 'function' && Symbol.iterator || '_es6shim_iterator_';
}

function isIterable(o) {
  return typeof o[iteratorSymbol] === 'function';
}

function getIterator(o) {
  return o[iteratorSymbol]();
}

function makeIterable(f, o) {
  o[iteratorSymbol] = f;
  return o;
}
},{}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromObservable = fromObservable;
exports.ObservableSource = ObservableSource;
exports.SubscriberSink = SubscriberSink;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromObservable(observable) {
  return new _Stream2.default(new ObservableSource(observable));
}

function ObservableSource(observable) {
  this.observable = observable;
}

ObservableSource.prototype.run = function (sink, scheduler) {
  var sub = this.observable.subscribe(new SubscriberSink(sink, scheduler));
  if (typeof sub === 'function') {
    return dispose.create(sub);
  } else if (sub && typeof sub.unsubscribe === 'function') {
    return dispose.create(unsubscribe, sub);
  }

  throw new TypeError('Observable returned invalid subscription ' + String(sub));
};

function SubscriberSink(sink, scheduler) {
  this.sink = sink;
  this.scheduler = scheduler;
}

SubscriberSink.prototype.next = function (x) {
  this.sink.event(this.scheduler.now(), x);
};

SubscriberSink.prototype.complete = function (x) {
  this.sink.end(this.scheduler.now(), x);
};

SubscriberSink.prototype.error = function (e) {
  this.sink.error(this.scheduler.now(), e);
};

function unsubscribe(subscription) {
  return subscription.unsubscribe();
}
},{"../Stream":6,"../disposable/dispose":34}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getObservable;

var _symbolObservable = require('symbol-observable');

var _symbolObservable2 = _interopRequireDefault(_symbolObservable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getObservable(o) {
  // eslint-disable-line complexity
  var obs = null;
  if (o) {
    // Access foreign method only once
    var method = o[_symbolObservable2.default];
    if (typeof method === 'function') {
      obs = method.call(o);
      if (!(obs && typeof obs.subscribe === 'function')) {
        throw new TypeError('invalid observable ' + obs);
      }
    }
  }

  return obs;
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
},{"symbol-observable":71}],44:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subscribe = subscribe;
exports.SubscribeObserver = SubscribeObserver;
exports.Subscription = Subscription;

var _defaultScheduler = require('../scheduler/defaultScheduler');

var _defaultScheduler2 = _interopRequireDefault(_defaultScheduler);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _fatalError = require('../fatalError');

var _fatalError2 = _interopRequireDefault(_fatalError);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function subscribe(subscriber, stream) {
  if (subscriber == null || typeof subscriber !== 'object') {
    throw new TypeError('subscriber must be an object');
  }

  var disposable = dispose.settable();
  var observer = new SubscribeObserver(_fatalError2.default, subscriber, disposable);

  disposable.setDisposable(stream.source.run(observer, _defaultScheduler2.default));

  return new Subscription(disposable);
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function SubscribeObserver(fatalError, subscriber, disposable) {
  this.fatalError = fatalError;
  this.subscriber = subscriber;
  this.disposable = disposable;
}

SubscribeObserver.prototype.event = function (t, x) {
  if (!this.disposable.disposed && typeof this.subscriber.next === 'function') {
    this.subscriber.next(x);
  }
};

SubscribeObserver.prototype.end = function (t, x) {
  if (!this.disposable.disposed) {
    var s = this.subscriber;
    doDispose(this.fatalError, s, s.complete, s.error, this.disposable, x);
  }
};

SubscribeObserver.prototype.error = function (t, e) {
  var s = this.subscriber;
  doDispose(this.fatalError, s, s.error, s.error, this.disposable, e);
};

function Subscription(disposable) {
  this.disposable = disposable;
}

Subscription.prototype.unsubscribe = function () {
  this.disposable.dispose();
};

function doDispose(fatal, subscriber, complete, error, disposable, x) {
  Promise.resolve(disposable.dispose()).then(function () {
    if (typeof complete === 'function') {
      complete.call(subscriber, x);
    }
  }).catch(function (e) {
    if (typeof error === 'function') {
      error.call(subscriber, e);
    }
  }).catch(fatal);
}
},{"../disposable/dispose":34,"../fatalError":35,"../scheduler/defaultScheduler":51}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withDefaultScheduler = withDefaultScheduler;
exports.withScheduler = withScheduler;

var _dispose = require('./disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _defaultScheduler = require('./scheduler/defaultScheduler');

var _defaultScheduler2 = _interopRequireDefault(_defaultScheduler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function withDefaultScheduler(source) {
  return withScheduler(source, _defaultScheduler2.default);
}

function withScheduler(source, scheduler) {
  return new Promise(function (resolve, reject) {
    runSource(source, scheduler, resolve, reject);
  });
}

function runSource(source, scheduler, resolve, reject) {
  var disposable = dispose.settable();
  var observer = new Drain(resolve, reject, disposable);

  disposable.setDisposable(source.run(observer, scheduler));
}

function Drain(end, error, disposable) {
  this._end = end;
  this._error = error;
  this._disposable = disposable;
  this.active = true;
}

Drain.prototype.event = function (t, x) {};

Drain.prototype.end = function (t, x) {
  if (!this.active) {
    return;
  }
  this.active = false;
  disposeThen(this._end, this._error, this._disposable, x);
};

Drain.prototype.error = function (t, e) {
  this.active = false;
  disposeThen(this._error, this._error, this._disposable, e);
};

function disposeThen(end, error, disposable, x) {
  Promise.resolve(disposable.dispose()).then(function () {
    end(x);
  }, error);
}
},{"./disposable/dispose":34,"./scheduler/defaultScheduler":51}],46:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ClockTimer;

var _task = require('../task');

/*global setTimeout, clearTimeout*/

function ClockTimer() {} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

ClockTimer.prototype.now = Date.now;

ClockTimer.prototype.setTimer = function (f, dt) {
  return dt <= 0 ? runAsap(f) : setTimeout(f, dt);
};

ClockTimer.prototype.clearTimer = function (t) {
  return t instanceof Asap ? t.cancel() : clearTimeout(t);
};

function Asap(f) {
  this.f = f;
  this.active = true;
}

Asap.prototype.run = function () {
  return this.active && this.f();
};

Asap.prototype.error = function (e) {
  throw e;
};

Asap.prototype.cancel = function () {
  this.active = false;
};

function runAsap(f) {
  var task = new Asap(f);
  (0, _task.defer)(task);
  return task;
}
},{"../task":68}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = PropagateTask;

var _fatalError = require('../fatalError');

var _fatalError2 = _interopRequireDefault(_fatalError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function PropagateTask(run, value, sink) {
  this._run = run;
  this.value = value;
  this.sink = sink;
  this.active = true;
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

PropagateTask.event = function (value, sink) {
  return new PropagateTask(emit, value, sink);
};

PropagateTask.end = function (value, sink) {
  return new PropagateTask(end, value, sink);
};

PropagateTask.error = function (value, sink) {
  return new PropagateTask(error, value, sink);
};

PropagateTask.prototype.dispose = function () {
  this.active = false;
};

PropagateTask.prototype.run = function (t) {
  if (!this.active) {
    return;
  }
  this._run(t, this.value, this.sink);
};

PropagateTask.prototype.error = function (t, e) {
  if (!this.active) {
    return (0, _fatalError2.default)(e);
  }
  this.sink.error(t, e);
};

function error(t, e, sink) {
  sink.error(t, e);
}

function emit(t, x, sink) {
  sink.event(t, x);
}

function end(t, x, sink) {
  sink.end(t, x);
}
},{"../fatalError":35}],48:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ScheduledTask;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function ScheduledTask(delay, period, task, scheduler) {
  this.time = delay;
  this.period = period;
  this.task = task;
  this.scheduler = scheduler;
  this.active = true;
}

ScheduledTask.prototype.run = function () {
  return this.task.run(this.time);
};

ScheduledTask.prototype.error = function (e) {
  return this.task.error(this.time, e);
};

ScheduledTask.prototype.dispose = function () {
  this.scheduler.cancel(this);
  return this.task.dispose();
};
},{}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Scheduler;

var _ScheduledTask = require('./ScheduledTask');

var _ScheduledTask2 = _interopRequireDefault(_ScheduledTask);

var _task = require('../task');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Scheduler(timer, timeline) {
  this.timer = timer;
  this.timeline = timeline;

  this._timer = null;
  this._nextArrival = Infinity;

  var self = this;
  this._runReadyTasksBound = function () {
    self._runReadyTasks(self.now());
  };
}

Scheduler.prototype.now = function () {
  return this.timer.now();
};

Scheduler.prototype.asap = function (task) {
  return this.schedule(0, -1, task);
};

Scheduler.prototype.delay = function (delay, task) {
  return this.schedule(delay, -1, task);
};

Scheduler.prototype.periodic = function (period, task) {
  return this.schedule(0, period, task);
};

Scheduler.prototype.schedule = function (delay, period, task) {
  var now = this.now();
  var st = new _ScheduledTask2.default(now + Math.max(0, delay), period, task, this);

  this.timeline.add(st);
  this._scheduleNextRun(now);
  return st;
};

Scheduler.prototype.cancel = function (task) {
  task.active = false;
  if (this.timeline.remove(task)) {
    this._reschedule();
  }
};

Scheduler.prototype.cancelAll = function (f) {
  this.timeline.removeAll(f);
  this._reschedule();
};

Scheduler.prototype._reschedule = function () {
  if (this.timeline.isEmpty()) {
    this._unschedule();
  } else {
    this._scheduleNextRun(this.now());
  }
};

Scheduler.prototype._unschedule = function () {
  this.timer.clearTimer(this._timer);
  this._timer = null;
};

Scheduler.prototype._scheduleNextRun = function (now) {
  // eslint-disable-line complexity
  if (this.timeline.isEmpty()) {
    return;
  }

  var nextArrival = this.timeline.nextArrival();

  if (this._timer === null) {
    this._scheduleNextArrival(nextArrival, now);
  } else if (nextArrival < this._nextArrival) {
    this._unschedule();
    this._scheduleNextArrival(nextArrival, now);
  }
};

Scheduler.prototype._scheduleNextArrival = function (nextArrival, now) {
  this._nextArrival = nextArrival;
  var delay = Math.max(0, nextArrival - now);
  this._timer = this.timer.setTimer(this._runReadyTasksBound, delay);
};

Scheduler.prototype._runReadyTasks = function (now) {
  this._timer = null;
  this.timeline.runTasks(now, _task.runTask);
  this._scheduleNextRun(this.now());
};
},{"../task":68,"./ScheduledTask":48}],50:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Timeline;

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function Timeline() {
  this.tasks = [];
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

Timeline.prototype.nextArrival = function () {
  return this.isEmpty() ? Infinity : this.tasks[0].time;
};

Timeline.prototype.isEmpty = function () {
  return this.tasks.length === 0;
};

Timeline.prototype.add = function (st) {
  insertByTime(st, this.tasks);
};

Timeline.prototype.remove = function (st) {
  var i = binarySearch(st.time, this.tasks);

  if (i >= 0 && i < this.tasks.length) {
    var at = base.findIndex(st, this.tasks[i].events);
    if (at >= 0) {
      this.tasks[i].events.splice(at, 1);
      return true;
    }
  }

  return false;
};

Timeline.prototype.removeAll = function (f) {
  var this$1 = this;

  for (var i = 0, l = this.tasks.length; i < l; ++i) {
    removeAllFrom(f, this$1.tasks[i]);
  }
};

Timeline.prototype.runTasks = function (t, runTask) {
  var this$1 = this;

  var tasks = this.tasks;
  var l = tasks.length;
  var i = 0;

  while (i < l && tasks[i].time <= t) {
    ++i;
  }

  this.tasks = tasks.slice(i);

  // Run all ready tasks
  for (var j = 0; j < i; ++j) {
    this$1.tasks = runTasks(runTask, tasks[j], this$1.tasks);
  }
};

function runTasks(runTask, timeslot, tasks) {
  // eslint-disable-line complexity
  var events = timeslot.events;
  for (var i = 0; i < events.length; ++i) {
    var task = events[i];

    if (task.active) {
      runTask(task);

      // Reschedule periodic repeating tasks
      // Check active again, since a task may have canceled itself
      if (task.period >= 0 && task.active) {
        task.time = task.time + task.period;
        insertByTime(task, tasks);
      }
    }
  }

  return tasks;
}

function insertByTime(task, timeslots) {
  // eslint-disable-line complexity
  var l = timeslots.length;

  if (l === 0) {
    timeslots.push(newTimeslot(task.time, [task]));
    return;
  }

  var i = binarySearch(task.time, timeslots);

  if (i >= l) {
    timeslots.push(newTimeslot(task.time, [task]));
  } else if (task.time === timeslots[i].time) {
    timeslots[i].events.push(task);
  } else {
    timeslots.splice(i, 0, newTimeslot(task.time, [task]));
  }
}

function removeAllFrom(f, timeslot) {
  timeslot.events = base.removeAll(f, timeslot.events);
}

function binarySearch(t, sortedArray) {
  // eslint-disable-line complexity
  var lo = 0;
  var hi = sortedArray.length;
  var mid, y;

  while (lo < hi) {
    mid = Math.floor((lo + hi) / 2);
    y = sortedArray[mid];

    if (t === y.time) {
      return mid;
    } else if (t < y.time) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return hi;
}

function newTimeslot(t, events) {
  return { time: t, events: events };
}
},{"@most/prelude":70}],51:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _Scheduler = require('./Scheduler');

var _Scheduler2 = _interopRequireDefault(_Scheduler);

var _ClockTimer = require('./ClockTimer');

var _ClockTimer2 = _interopRequireDefault(_ClockTimer);

var _Timeline = require('./Timeline');

var _Timeline2 = _interopRequireDefault(_Timeline);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var defaultScheduler = new _Scheduler2.default(new _ClockTimer2.default(), new _Timeline2.default()); /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

exports.default = defaultScheduler;
},{"./ClockTimer":46,"./Scheduler":49,"./Timeline":50}],52:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = DeferredSink;

var _task = require('../task');

function DeferredSink(sink) {
  this.sink = sink;
  this.events = [];
  this.active = true;
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

DeferredSink.prototype.event = function (t, x) {
  if (!this.active) {
    return;
  }

  if (this.events.length === 0) {
    (0, _task.defer)(new PropagateAllTask(this.sink, t, this.events));
  }

  this.events.push({ time: t, value: x });
};

DeferredSink.prototype.end = function (t, x) {
  if (!this.active) {
    return;
  }

  this._end(new EndTask(t, x, this.sink));
};

DeferredSink.prototype.error = function (t, e) {
  this._end(new ErrorTask(t, e, this.sink));
};

DeferredSink.prototype._end = function (task) {
  this.active = false;
  (0, _task.defer)(task);
};

function PropagateAllTask(sink, time, events) {
  this.sink = sink;
  this.events = events;
  this.time = time;
}

PropagateAllTask.prototype.run = function () {
  var this$1 = this;

  var events = this.events;
  var sink = this.sink;
  var event;

  for (var i = 0, l = events.length; i < l; ++i) {
    event = events[i];
    this$1.time = event.time;
    sink.event(event.time, event.value);
  }

  events.length = 0;
};

PropagateAllTask.prototype.error = function (e) {
  this.sink.error(this.time, e);
};

function EndTask(t, x, sink) {
  this.time = t;
  this.value = x;
  this.sink = sink;
}

EndTask.prototype.run = function () {
  this.sink.end(this.time, this.value);
};

EndTask.prototype.error = function (e) {
  this.sink.error(this.time, e);
};

function ErrorTask(t, e, sink) {
  this.time = t;
  this.value = e;
  this.sink = sink;
}

ErrorTask.prototype.run = function () {
  this.sink.error(this.time, this.value);
};

ErrorTask.prototype.error = function (e) {
  throw e;
};
},{"../task":68}],53:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = IndexSink;

var _Pipe = require('./Pipe');

var _Pipe2 = _interopRequireDefault(_Pipe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function IndexSink(i, sink) {
  this.sink = sink;
  this.index = i;
  this.active = true;
  this.value = void 0;
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

IndexSink.prototype.event = function (t, x) {
  if (!this.active) {
    return;
  }
  this.value = x;
  this.sink.event(t, this);
};

IndexSink.prototype.end = function (t, x) {
  if (!this.active) {
    return;
  }
  this.active = false;
  this.sink.end(t, { index: this.index, value: x });
};

IndexSink.prototype.error = _Pipe2.default.prototype.error;
},{"./Pipe":54}],54:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = Pipe;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

/**
 * A sink mixin that simply forwards event, end, and error to
 * another sink.
 * @param sink
 * @constructor
 */
function Pipe(sink) {
  this.sink = sink;
}

Pipe.prototype.event = function (t, x) {
  return this.sink.event(t, x);
};

Pipe.prototype.end = function (t, x) {
  return this.sink.end(t, x);
};

Pipe.prototype.error = function (t, e) {
  return this.sink.error(t, e);
};
},{}],55:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SafeSink;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function SafeSink(sink) {
  this.sink = sink;
  this.active = true;
}

SafeSink.prototype.event = function (t, x) {
  if (!this.active) {
    return;
  }
  this.sink.event(t, x);
};

SafeSink.prototype.end = function (t, x) {
  if (!this.active) {
    return;
  }
  this.disable();
  this.sink.end(t, x);
};

SafeSink.prototype.error = function (t, e) {
  this.disable();
  this.sink.error(t, e);
};

SafeSink.prototype.disable = function () {
  this.active = false;
  return this.sink;
};
},{}],56:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = EventEmitterSource;

var _DeferredSink = require('../sink/DeferredSink');

var _DeferredSink2 = _interopRequireDefault(_DeferredSink);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _tryEvent = require('./tryEvent');

var tryEvent = _interopRequireWildcard(_tryEvent);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function EventEmitterSource(event, source) {
  this.event = event;
  this.source = source;
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

EventEmitterSource.prototype.run = function (sink, scheduler) {
  // NOTE: Because EventEmitter allows events in the same call stack as
  // a listener is added, use a DeferredSink to buffer events
  // until the stack clears, then propagate.  This maintains most.js's
  // invariant that no event will be delivered in the same call stack
  // as an observer begins observing.
  var dsink = new _DeferredSink2.default(sink);

  function addEventVariadic(a) {
    var arguments$1 = arguments;

    var l = arguments.length;
    if (l > 1) {
      var arr = new Array(l);
      for (var i = 0; i < l; ++i) {
        arr[i] = arguments$1[i];
      }
      tryEvent.tryEvent(scheduler.now(), arr, dsink);
    } else {
      tryEvent.tryEvent(scheduler.now(), a, dsink);
    }
  }

  this.source.addListener(this.event, addEventVariadic);

  return dispose.create(disposeEventEmitter, { target: this, addEvent: addEventVariadic });
};

function disposeEventEmitter(info) {
  var target = info.target;
  target.source.removeListener(target.event, info.addEvent);
}
},{"../disposable/dispose":34,"../sink/DeferredSink":52,"./tryEvent":66}],57:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = EventTargetSource;

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _tryEvent = require('./tryEvent');

var tryEvent = _interopRequireWildcard(_tryEvent);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function EventTargetSource(event, source, capture) {
  this.event = event;
  this.source = source;
  this.capture = capture;
}

EventTargetSource.prototype.run = function (sink, scheduler) {
  function addEvent(e) {
    tryEvent.tryEvent(scheduler.now(), e, sink);
  }

  this.source.addEventListener(this.event, addEvent, this.capture);

  return dispose.create(disposeEventTarget, { target: this, addEvent: addEvent });
};

function disposeEventTarget(info) {
  var target = info.target;
  target.source.removeEventListener(target.event, info.addEvent, target.capture);
}
},{"../disposable/dispose":34,"./tryEvent":66}],58:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.of = of;
exports.empty = empty;
exports.never = never;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _dispose = require('../disposable/dispose');

var dispose = _interopRequireWildcard(_dispose);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Stream containing only x
 * @param {*} x
 * @returns {Stream}
 */
function of(x) {
  return new _Stream2.default(new Just(x));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function Just(x) {
  this.value = x;
}

Just.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new _PropagateTask2.default(runJust, this.value, sink));
};

function runJust(t, x, sink) {
  sink.event(t, x);
  sink.end(t, void 0);
}

/**
 * Stream containing no events and ends immediately
 * @returns {Stream}
 */
function empty() {
  return EMPTY;
}

function EmptySource() {}

EmptySource.prototype.run = function (sink, scheduler) {
  var task = _PropagateTask2.default.end(void 0, sink);
  scheduler.asap(task);

  return dispose.create(disposeEmpty, task);
};

function disposeEmpty(task) {
  return task.dispose();
}

var EMPTY = new _Stream2.default(new EmptySource());

/**
 * Stream containing no events and never ends
 * @returns {Stream}
 */
function never() {
  return NEVER;
}

function NeverSource() {}

NeverSource.prototype.run = function () {
  return dispose.empty();
};

var NEVER = new _Stream2.default(new NeverSource());
},{"../Stream":6,"../disposable/dispose":34,"../scheduler/PropagateTask":47}],59:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.from = from;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _fromArray = require('./fromArray');

var _iterable = require('../iterable');

var _fromIterable = require('./fromIterable');

var _getObservable = require('../observable/getObservable');

var _getObservable2 = _interopRequireDefault(_getObservable);

var _fromObservable = require('../observable/fromObservable');

var _prelude = require('@most/prelude');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function from(a) {
  // eslint-disable-line complexity
  if (a instanceof _Stream2.default) {
    return a;
  }

  var observable = (0, _getObservable2.default)(a);
  if (observable != null) {
    return (0, _fromObservable.fromObservable)(observable);
  }

  if (Array.isArray(a) || (0, _prelude.isArrayLike)(a)) {
    return (0, _fromArray.fromArray)(a);
  }

  if ((0, _iterable.isIterable)(a)) {
    return (0, _fromIterable.fromIterable)(a);
  }

  throw new TypeError('from(x) must be observable, iterable, or array-like: ' + a);
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
},{"../Stream":6,"../iterable":41,"../observable/fromObservable":42,"../observable/getObservable":43,"./fromArray":60,"./fromIterable":62,"@most/prelude":70}],60:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromArray = fromArray;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function fromArray(a) {
  return new _Stream2.default(new ArraySource(a));
}

function ArraySource(a) {
  this.array = a;
}

ArraySource.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new _PropagateTask2.default(runProducer, this.array, sink));
};

function runProducer(t, array, sink) {
  for (var i = 0, l = array.length; i < l && this.active; ++i) {
    sink.event(t, array[i]);
  }

  this.active && end(t);

  function end(t) {
    sink.end(t);
  }
}
},{"../Stream":6,"../scheduler/PropagateTask":47}],61:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromEvent = fromEvent;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _EventTargetSource = require('./EventTargetSource');

var _EventTargetSource2 = _interopRequireDefault(_EventTargetSource);

var _EventEmitterSource = require('./EventEmitterSource');

var _EventEmitterSource2 = _interopRequireDefault(_EventEmitterSource);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a stream from an EventTarget, such as a DOM Node, or EventEmitter.
 * @param {String} event event type name, e.g. 'click'
 * @param {EventTarget|EventEmitter} source EventTarget or EventEmitter
 * @param {*?} capture for DOM events, whether to use
 *  capturing--passed as 3rd parameter to addEventListener.
 * @returns {Stream} stream containing all events of the specified type
 * from the source.
 */
function fromEvent(event, source, capture) {
  // eslint-disable-line complexity
  var s;

  if (typeof source.addEventListener === 'function' && typeof source.removeEventListener === 'function') {
    if (arguments.length < 3) {
      capture = false;
    }

    s = new _EventTargetSource2.default(event, source, capture);
  } else if (typeof source.addListener === 'function' && typeof source.removeListener === 'function') {
    s = new _EventEmitterSource2.default(event, source);
  } else {
    throw new Error('source must support addEventListener/removeEventListener or addListener/removeListener');
  }

  return new _Stream2.default(s);
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */
},{"../Stream":6,"./EventEmitterSource":56,"./EventTargetSource":57}],62:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fromIterable = fromIterable;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _iterable = require('../iterable');

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function fromIterable(iterable) {
  return new _Stream2.default(new IterableSource(iterable));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function IterableSource(iterable) {
  this.iterable = iterable;
}

IterableSource.prototype.run = function (sink, scheduler) {
  return scheduler.asap(new _PropagateTask2.default(runProducer, (0, _iterable.getIterator)(this.iterable), sink));
};

function runProducer(t, iterator, sink) {
  var r = iterator.next();

  while (!r.done && this.active) {
    sink.event(t, r.value);
    r = iterator.next();
  }

  sink.end(t, r.value);
}
},{"../Stream":6,"../iterable":41,"../scheduler/PropagateTask":47}],63:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generate = generate;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _prelude = require('@most/prelude');

var base = _interopRequireWildcard(_prelude);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { newObj[key] = obj[key]; } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Compute a stream using an *async* generator, which yields promises
 * to control event times.
 * @param f
 * @returns {Stream}
 */
/** @license MIT License (c) copyright 2010-2014 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function generate(f /*, ...args */) {
  return new _Stream2.default(new GenerateSource(f, base.tail(arguments)));
}

function GenerateSource(f, args) {
  this.f = f;
  this.args = args;
}

GenerateSource.prototype.run = function (sink, scheduler) {
  return new Generate(this.f.apply(void 0, this.args), sink, scheduler);
};

function Generate(iterator, sink, scheduler) {
  this.iterator = iterator;
  this.sink = sink;
  this.scheduler = scheduler;
  this.active = true;

  var self = this;
  function err(e) {
    self.sink.error(self.scheduler.now(), e);
  }

  Promise.resolve(this).then(next).catch(err);
}

function next(generate, x) {
  return generate.active ? handle(generate, generate.iterator.next(x)) : x;
}

function handle(generate, result) {
  if (result.done) {
    return generate.sink.end(generate.scheduler.now(), result.value);
  }

  return Promise.resolve(result.value).then(function (x) {
    return emit(generate, x);
  }, function (e) {
    return error(generate, e);
  });
}

function emit(generate, x) {
  generate.sink.event(generate.scheduler.now(), x);
  return next(generate, x);
}

function error(generate, e) {
  return handle(generate, generate.iterator.throw(e));
}

Generate.prototype.dispose = function () {
  this.active = false;
};
},{"../Stream":6,"@most/prelude":70}],64:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iterate = iterate;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Compute a stream by iteratively calling f to produce values
 * Event times may be controlled by returning a Promise from f
 * @param {function(x:*):*|Promise<*>} f
 * @param {*} x initial value
 * @returns {Stream}
 */
function iterate(f, x) {
  return new _Stream2.default(new IterateSource(f, x));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function IterateSource(f, x) {
  this.f = f;
  this.value = x;
}

IterateSource.prototype.run = function (sink, scheduler) {
  return new Iterate(this.f, this.value, sink, scheduler);
};

function Iterate(f, initial, sink, scheduler) {
  this.f = f;
  this.sink = sink;
  this.scheduler = scheduler;
  this.active = true;

  var x = initial;

  var self = this;
  function err(e) {
    self.sink.error(self.scheduler.now(), e);
  }

  function start(iterate) {
    return stepIterate(iterate, x);
  }

  Promise.resolve(this).then(start).catch(err);
}

Iterate.prototype.dispose = function () {
  this.active = false;
};

function stepIterate(iterate, x) {
  iterate.sink.event(iterate.scheduler.now(), x);

  if (!iterate.active) {
    return x;
  }

  var f = iterate.f;
  return Promise.resolve(f(x)).then(function (y) {
    return continueIterate(iterate, y);
  });
}

function continueIterate(iterate, x) {
  return !iterate.active ? iterate.value : stepIterate(iterate, x);
}
},{"../Stream":6}],65:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.periodic = periodic;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

var _PropagateTask = require('../scheduler/PropagateTask');

var _PropagateTask2 = _interopRequireDefault(_PropagateTask);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Create a stream that emits the current time periodically
 * @param {Number} period periodicity of events in millis
 * @param {*} deprecatedValue @deprecated value to emit each period
 * @returns {Stream} new stream that emits the current time every period
 */
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function periodic(period, deprecatedValue) {
  return new _Stream2.default(new Periodic(period, deprecatedValue));
}

function Periodic(period, value) {
  this.period = period;
  this.value = value;
}

Periodic.prototype.run = function (sink, scheduler) {
  return scheduler.periodic(this.period, _PropagateTask2.default.event(this.value, sink));
};
},{"../Stream":6,"../scheduler/PropagateTask":47}],66:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.tryEvent = tryEvent;
exports.tryEnd = tryEnd;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function tryEvent(t, x, sink) {
  try {
    sink.event(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}

function tryEnd(t, x, sink) {
  try {
    sink.end(t, x);
  } catch (e) {
    sink.error(t, e);
  }
}
},{}],67:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.unfold = unfold;

var _Stream = require('../Stream');

var _Stream2 = _interopRequireDefault(_Stream);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Compute a stream by unfolding tuples of future values from a seed value
 * Event times may be controlled by returning a Promise from f
 * @param {function(seed:*):{value:*, seed:*, done:boolean}|Promise<{value:*, seed:*, done:boolean}>} f unfolding function accepts
 *  a seed and returns a new tuple with a value, new seed, and boolean done flag.
 *  If tuple.done is true, the stream will end.
 * @param {*} seed seed value
 * @returns {Stream} stream containing all value of all tuples produced by the
 *  unfolding function.
 */
function unfold(f, seed) {
  return new _Stream2.default(new UnfoldSource(f, seed));
} /** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function UnfoldSource(f, seed) {
  this.f = f;
  this.value = seed;
}

UnfoldSource.prototype.run = function (sink, scheduler) {
  return new Unfold(this.f, this.value, sink, scheduler);
};

function Unfold(f, x, sink, scheduler) {
  this.f = f;
  this.sink = sink;
  this.scheduler = scheduler;
  this.active = true;

  var self = this;
  function err(e) {
    self.sink.error(self.scheduler.now(), e);
  }

  function start(unfold) {
    return stepUnfold(unfold, x);
  }

  Promise.resolve(this).then(start).catch(err);
}

Unfold.prototype.dispose = function () {
  this.active = false;
};

function stepUnfold(unfold, x) {
  var f = unfold.f;
  return Promise.resolve(f(x)).then(function (tuple) {
    return continueUnfold(unfold, tuple);
  });
}

function continueUnfold(unfold, tuple) {
  if (tuple.done) {
    unfold.sink.end(unfold.scheduler.now(), tuple.value);
    return tuple.value;
  }

  unfold.sink.event(unfold.scheduler.now(), tuple.value);

  if (!unfold.active) {
    return tuple.value;
  }
  return stepUnfold(unfold, tuple.seed);
}
},{"../Stream":6}],68:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.defer = defer;
exports.runTask = runTask;
/** @license MIT License (c) copyright 2010-2016 original author or authors */
/** @author Brian Cavalier */
/** @author John Hann */

function defer(task) {
  return Promise.resolve(task).then(runTask);
}

function runTask(task) {
  try {
    return task.run();
  } catch (e) {
    return task.error(e);
  }
}
},{}],69:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@most/prelude')) :
  typeof define === 'function' && define.amd ? define(['exports', '@most/prelude'], factory) :
  (factory((global.mostMulticast = global.mostMulticast || {}),global.mostPrelude));
}(this, (function (exports,_most_prelude) { 'use strict';

var MulticastDisposable = function MulticastDisposable (source, sink) {
  this.source = source
  this.sink = sink
  this.disposed = false
};

MulticastDisposable.prototype.dispose = function dispose () {
  if (this.disposed) {
    return
  }
  this.disposed = true
  var remaining = this.source.remove(this.sink)
  return remaining === 0 && this.source._dispose()
};

function tryEvent (t, x, sink) {
  try {
    sink.event(t, x)
  } catch (e) {
    sink.error(t, e)
  }
}

function tryEnd (t, x, sink) {
  try {
    sink.end(t, x)
  } catch (e) {
    sink.error(t, e)
  }
}

var dispose = function (disposable) { return disposable.dispose(); }

var emptyDisposable = {
  dispose: function dispose$1 () {}
}

var MulticastSource = function MulticastSource (source) {
  this.source = source
  this.sinks = []
  this._disposable = emptyDisposable
};

MulticastSource.prototype.run = function run (sink, scheduler) {
  var n = this.add(sink)
  if (n === 1) {
    this._disposable = this.source.run(this, scheduler)
  }
  return new MulticastDisposable(this, sink)
};

MulticastSource.prototype._dispose = function _dispose () {
  var disposable = this._disposable
  this._disposable = emptyDisposable
  return Promise.resolve(disposable).then(dispose)
};

MulticastSource.prototype.add = function add (sink) {
  this.sinks = _most_prelude.append(sink, this.sinks)
  return this.sinks.length
};

MulticastSource.prototype.remove = function remove$1 (sink) {
  var i = _most_prelude.findIndex(sink, this.sinks)
  // istanbul ignore next
  if (i >= 0) {
    this.sinks = _most_prelude.remove(i, this.sinks)
  }

  return this.sinks.length
};

MulticastSource.prototype.event = function event (time, value) {
  var s = this.sinks
  if (s.length === 1) {
    return s[0].event(time, value)
  }
  for (var i = 0; i < s.length; ++i) {
    tryEvent(time, value, s[i])
  }
};

MulticastSource.prototype.end = function end (time, value) {
  var s = this.sinks
  for (var i = 0; i < s.length; ++i) {
    tryEnd(time, value, s[i])
  }
};

MulticastSource.prototype.error = function error (time, err) {
  var s = this.sinks
  for (var i = 0; i < s.length; ++i) {
    s[i].error(time, err)
  }
};

function multicast (stream) {
  var source = stream.source
  return source instanceof MulticastSource
    ? stream
    : new stream.constructor(new MulticastSource(source))
}

exports['default'] = multicast;
exports.MulticastSource = MulticastSource;

Object.defineProperty(exports, '__esModule', { value: true });

})));


},{"@most/prelude":70}],70:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.mostPrelude = global.mostPrelude || {})));
}(this, (function (exports) { 'use strict';

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// Non-mutating array operations

// cons :: a -> [a] -> [a]
// a with x prepended
function cons (x, a) {
  var l = a.length
  var b = new Array(l + 1)
  b[0] = x
  for (var i = 0; i < l; ++i) {
    b[i + 1] = a[i]
  }
  return b
}

// append :: a -> [a] -> [a]
// a with x appended
function append (x, a) {
  var l = a.length
  var b = new Array(l + 1)
  for (var i = 0; i < l; ++i) {
    b[i] = a[i]
  }

  b[l] = x
  return b
}

// drop :: Int -> [a] -> [a]
// drop first n elements
function drop (n, a) { // eslint-disable-line complexity
  if (n < 0) {
    throw new TypeError('n must be >= 0')
  }

  var l = a.length
  if (n === 0 || l === 0) {
    return a
  }

  if (n >= l) {
    return []
  }

  return unsafeDrop(n, a, l - n)
}

// unsafeDrop :: Int -> [a] -> Int -> [a]
// Internal helper for drop
function unsafeDrop (n, a, l) {
  var b = new Array(l)
  for (var i = 0; i < l; ++i) {
    b[i] = a[n + i]
  }
  return b
}

// tail :: [a] -> [a]
// drop head element
function tail (a) {
  return drop(1, a)
}

// copy :: [a] -> [a]
// duplicate a (shallow duplication)
function copy (a) {
  var l = a.length
  var b = new Array(l)
  for (var i = 0; i < l; ++i) {
    b[i] = a[i]
  }
  return b
}

// map :: (a -> b) -> [a] -> [b]
// transform each element with f
function map (f, a) {
  var l = a.length
  var b = new Array(l)
  for (var i = 0; i < l; ++i) {
    b[i] = f(a[i])
  }
  return b
}

// reduce :: (a -> b -> a) -> a -> [b] -> a
// accumulate via left-fold
function reduce (f, z, a) {
  var r = z
  for (var i = 0, l = a.length; i < l; ++i) {
    r = f(r, a[i], i)
  }
  return r
}

// replace :: a -> Int -> [a]
// replace element at index
function replace (x, i, a) { // eslint-disable-line complexity
  if (i < 0) {
    throw new TypeError('i must be >= 0')
  }

  var l = a.length
  var b = new Array(l)
  for (var j = 0; j < l; ++j) {
    b[j] = i === j ? x : a[j]
  }
  return b
}

// remove :: Int -> [a] -> [a]
// remove element at index
function remove (i, a) {  // eslint-disable-line complexity
  if (i < 0) {
    throw new TypeError('i must be >= 0')
  }

  var l = a.length
  if (l === 0 || i >= l) { // exit early if index beyond end of array
    return a
  }

  if (l === 1) { // exit early if index in bounds and length === 1
    return []
  }

  return unsafeRemove(i, a, l - 1)
}

// unsafeRemove :: Int -> [a] -> Int -> [a]
// Internal helper to remove element at index
function unsafeRemove (i, a, l) {
  var b = new Array(l)
  var j
  for (j = 0; j < i; ++j) {
    b[j] = a[j]
  }
  for (j = i; j < l; ++j) {
    b[j] = a[j + 1]
  }

  return b
}

// removeAll :: (a -> boolean) -> [a] -> [a]
// remove all elements matching a predicate
function removeAll (f, a) {
  var l = a.length
  var b = new Array(l)
  var j = 0
  for (var x, i = 0; i < l; ++i) {
    x = a[i]
    if (!f(x)) {
      b[j] = x
      ++j
    }
  }

  b.length = j
  return b
}

// findIndex :: a -> [a] -> Int
// find index of x in a, from the left
function findIndex (x, a) {
  for (var i = 0, l = a.length; i < l; ++i) {
    if (x === a[i]) {
      return i
    }
  }
  return -1
}

// isArrayLike :: * -> boolean
// Return true iff x is array-like
function isArrayLike (x) {
  return x != null && typeof x.length === 'number' && typeof x !== 'function'
}

/** @license MIT License (c) copyright 2010-2016 original author or authors */

// id :: a -> a
var id = function (x) { return x; }

// compose :: (b -> c) -> (a -> b) -> (a -> c)
var compose = function (f, g) { return function (x) { return f(g(x)); }; }

// apply :: (a -> b) -> a -> b
var apply = function (f, x) { return f(x); }

// curry2 :: ((a, b) -> c) -> (a -> b -> c)
function curry2 (f) {
  function curried (a, b) {
    switch (arguments.length) {
      case 0: return curried
      case 1: return function (b) { return f(a, b); }
      default: return f(a, b)
    }
  }
  return curried
}

// curry3 :: ((a, b, c) -> d) -> (a -> b -> c -> d)
function curry3 (f) {
  function curried (a, b, c) { // eslint-disable-line complexity
    switch (arguments.length) {
      case 0: return curried
      case 1: return curry2(function (b, c) { return f(a, b, c); })
      case 2: return function (c) { return f(a, b, c); }
      default:return f(a, b, c)
    }
  }
  return curried
}

exports.cons = cons;
exports.append = append;
exports.drop = drop;
exports.tail = tail;
exports.copy = copy;
exports.map = map;
exports.reduce = reduce;
exports.replace = replace;
exports.remove = remove;
exports.removeAll = removeAll;
exports.findIndex = findIndex;
exports.isArrayLike = isArrayLike;
exports.id = id;
exports.compose = compose;
exports.apply = apply;
exports.curry2 = curry2;
exports.curry3 = curry3;

Object.defineProperty(exports, '__esModule', { value: true });

})));


},{}],71:[function(require,module,exports){
module.exports = require('./lib/index');

},{"./lib/index":72}],72:[function(require,module,exports){
(function (global){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _ponyfill = require('./ponyfill');

var _ponyfill2 = _interopRequireDefault(_ponyfill);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var root; /* global window */


if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else if (typeof module !== 'undefined') {
  root = module;
} else {
  root = Function('return this')();
}

var result = (0, _ponyfill2['default'])(root);
exports['default'] = result;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./ponyfill":73}],73:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports['default'] = symbolObservablePonyfill;
function symbolObservablePonyfill(root) {
	var result;
	var _Symbol = root.Symbol;

	if (typeof _Symbol === 'function') {
		if (_Symbol.observable) {
			result = _Symbol.observable;
		} else {
			result = _Symbol('observable');
			_Symbol.observable = result;
		}
	} else {
		result = '@@observable';
	}

	return result;
};
},{}],74:[function(require,module,exports){
(function (global){
const EventEmitter = require('events');

global.bus = global.bus || new EventEmitter();

module.exports = {
  bus: global.bus,
  makeEmitter: function() {
    return new EventEmitter();
  }
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"events":2}],75:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.learningElement$ = undefined;

var _partybus = require('partybus');

var _mutationobserver = require('./mutationobserver');

var _most = require('most');

var most = _interopRequireWildcard(_most);

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  } else {
    var newObj = {};if (obj != null) {
      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
      }
    }newObj.default = obj;return newObj;
  }
}

(0, _mutationobserver.mutationWatch)('[learning-element]:not([transformed])', 'learningElements::found');

var cache = {};

most.fromEvent('watcher::transformComplete', _partybus.bus).tap(function () {
  cache = {};
}).drain();

var learningElement$ = most.fromEvent('learningElements::found', _partybus.bus).flatMap(function (els) {
  return most.from(els);
}).filter(function (el) {
  return cache[el.getAttribute('learning-element-ref')] !== true;
}).tap(function (el) {
  return cache[el.getAttribute('learning-element-ref')] = true;
}).tap(function (el) {
  return el.setAttribute('transformed', true);
});

exports.learningElement$ = learningElement$;

// el contract attrs:
// learning-element="poll"
// learning-element-ref="identifier" //TODO: discuss uniqueness of identifier, how is this managed?
// transformed (when element is sent for transformation)

// EXAMPLE IMPLEMENTATION:
//learningElements$
//  .filter(el => el.getAttribute('learning-element') === 'poll')
//  .tap(el => el.append('<div class="mount"></div>') )
//.drain()

},{"./mutationobserver":76,"most":39,"partybus":74}],76:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.mutationWatch = undefined;

var _partybus = require('partybus');

var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

var mutationListeners = [];

var observer = new MutationObserver(function (mutations) {
  mutationListeners.forEach(function (_ref) {
    var selector = _ref.selector,
        emitMessage = _ref.emitMessage;

    //selector: '[learning-element]:not([transformed])'
    //emitMessage: `learningElement::found`
    var transformables = document.querySelectorAll(selector);
    if (transformables.length > 0) {
      _partybus.bus.emit(emitMessage, transformables);
    } else {
      _partybus.bus.emit('watcher::transformComplete');
    }
  });
});

observer.observe(document, { attributes: true, childList: true, characterData: true, subtree: true });

var mutationWatch = function mutationWatch(selector, emitMessage) {
  mutationListeners.push({ selector: selector, emitMessage: emitMessage });
};

exports.mutationWatch = mutationWatch;

},{"partybus":74}],77:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.learningElement$ = exports.mutationWatch = undefined;

var _mutationobserver = require('./mutationobserver');

var _learningElementWatch = require('./learningElementWatch');

exports.mutationWatch = _mutationobserver.mutationWatch;
exports.learningElement$ = _learningElementWatch.learningElement$;

},{"./learningElementWatch":75,"./mutationobserver":76}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvTGlua2VkTGlzdC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9Qcm9taXNlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL1F1ZXVlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL1N0cmVhbS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2FjY3VtdWxhdGUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9hcHBsaWNhdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2J1aWxkLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvY29tYmluZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2NvbmNhdE1hcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2NvbnRpbnVlV2l0aC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2RlbGF5LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvZXJyb3JzLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvZmxhdE1hcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2xpbWl0LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvbG9vcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL21lcmdlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvbWVyZ2VDb25jdXJyZW50bHkuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9vYnNlcnZlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvcHJvbWlzZXMuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9zYW1wbGUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9zbGljZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL3N3aXRjaC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL3RocnUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90aW1lc2xpY2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90cmFuc2R1Y2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90cmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci96aXAuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvZGlzcG9zYWJsZS9EaXNwb3NhYmxlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2Rpc3Bvc2FibGUvU2V0dGFibGVEaXNwb3NhYmxlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2Rpc3Bvc2FibGUvZGlzcG9zZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9mYXRhbEVycm9yLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2Z1c2lvbi9GaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvZnVzaW9uL0ZpbHRlck1hcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9mdXNpb24vTWFwLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2ludm9rZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9pdGVyYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9vYnNlcnZhYmxlL2Zyb21PYnNlcnZhYmxlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL29ic2VydmFibGUvZ2V0T2JzZXJ2YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9vYnNlcnZhYmxlL3N1YnNjcmliZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9ydW5Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL0Nsb2NrVGltZXIuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL1Byb3BhZ2F0ZVRhc2suanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL1NjaGVkdWxlZFRhc2suanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL1NjaGVkdWxlci5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zY2hlZHVsZXIvVGltZWxpbmUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL2RlZmF1bHRTY2hlZHVsZXIuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2luay9EZWZlcnJlZFNpbmsuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2luay9JbmRleFNpbmsuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2luay9QaXBlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NpbmsvU2FmZVNpbmsuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL0V2ZW50RW1pdHRlclNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zb3VyY2UvRXZlbnRUYXJnZXRTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2NvcmUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2Zyb20uanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2Zyb21BcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zb3VyY2UvZnJvbUV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NvdXJjZS9mcm9tSXRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2dlbmVyYXRlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NvdXJjZS9pdGVyYXRlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NvdXJjZS9wZXJpb2RpYy5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zb3VyY2UvdHJ5RXZlbnQuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL3VuZm9sZC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi90YXNrLmpzIiwibm9kZV9tb2R1bGVzL21vc3Qvbm9kZV9tb2R1bGVzL0Btb3N0L211bHRpY2FzdC9kaXN0L211bHRpY2FzdC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L25vZGVfbW9kdWxlcy9AbW9zdC9wcmVsdWRlL2Rpc3QvcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L25vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L25vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbW9zdC9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL3BvbnlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL3BhcnR5YnVzL3NyYy9wYXJ0eWJ1cy5qcyIsInNyYy9sZWFybmluZ0VsZW1lbnRXYXRjaC5qcyIsInNyYy9tdXRhdGlvbm9ic2VydmVyLmpzIiwic3JjL3dhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUVBLDBCQUFBLEFBQ0csSUFBSSxRQURQLEFBQ2UsS0FEZixBQUVHOztBQUVIO0FBQ0E7QUFDQTs7QUFFQSxXQUFXLFlBQVUsQUFFbkI7O01BQUksS0FBSyxTQUFBLEFBQVMsY0FBbEIsQUFBUyxBQUF1QixBQUNoQztLQUFBLEFBQUcsWUFBSCxBQUFlLEFBQ2Y7QUFFQTs7V0FBQSxBQUFTLEtBQVQsQUFBYyxtQkFBZCxBQUFrQyxjQUFsQyxBQUFnRCxBQUVqRDtBQVJELEdBQUEsQUFRRzs7O0FDbEJIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcHpCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BQQTtBQUNBOzs7QUNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQ1ZBOztBQUNBOztBQUNBOztJLEFBQVk7Ozs7Ozs7Ozs7Ozs7O0FBRVoscUNBQUEsQUFBYyx5Q0FBZCxBQUF1RDs7QUFFdkQsSUFBSSxRQUFKLEFBQVk7O0FBRVosS0FBQSxBQUFLLFVBQUwsQUFBZSw2Q0FBZixBQUNHLElBQUksWUFBTSxBQUFFO1VBQUEsQUFBUSxBQUFJO0FBRDNCLEdBQUEsQUFFRzs7QUFFSCxJQUFNLHdCQUFtQixBQUFLLFVBQUwsQUFBZSwwQ0FBZixBQUN0QixRQUFRLGVBQUE7U0FBTyxLQUFBLEFBQUssS0FBWixBQUFPLEFBQVU7QUFESCxDQUFBLEVBQUEsQUFFdEIsT0FBTyxjQUFBO1NBQU0sTUFBTSxHQUFBLEFBQUcsYUFBVCxBQUFNLEFBQWdCLDZCQUE1QixBQUF5RDtBQUYxQyxHQUFBLEFBR3RCLElBQUksY0FBQTtTQUFNLE1BQU0sR0FBQSxBQUFHLGFBQVQsQUFBTSxBQUFnQiwyQkFBNUIsQUFBdUQ7QUFIckMsR0FBQSxBQUl0QixJQUFJLGNBQUE7U0FBTSxHQUFBLEFBQUcsYUFBSCxBQUFnQixlQUF0QixBQUFNLEFBQStCO0FBSjVDLEFBQXlCOztRLEFBTWhCLG1CLEFBQUE7O0FBRVQ7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7OztBQzdCQTs7QUFFQSxJQUFNLG1CQUFtQixPQUFBLEFBQU8sb0JBQW9CLE9BQTNCLEFBQWtDLDBCQUEwQixPQUFyRixBQUE0Rjs7QUFFNUYsSUFBSSxvQkFBSixBQUF3Qjs7QUFFeEIsSUFBTSxlQUFXLEFBQUksaUJBQWlCLFVBQUEsQUFBUyxXQUFXLEFBQ3hEO29CQUFBLEFBQWtCLFFBQVEsZ0JBQW1DO1FBQXhCLEFBQXdCLGdCQUF4QixBQUF3QjtRQUFkLEFBQWMsbUJBQWQsQUFBYyxBQUMzRDs7QUFDQTtBQUNBO1FBQU0saUJBQWlCLFNBQUEsQUFBUyxpQkFBaEMsQUFBdUIsQUFBMEIsQUFDakQ7UUFBRyxlQUFBLEFBQWUsU0FBbEIsQUFBMkIsR0FBRSxBQUMzQjtvQkFBQSxBQUFJLEtBQUosQUFBUyxhQUFULEFBQXNCLEFBQ3ZCO0FBRkQsV0FFTyxBQUNMO29CQUFBLEFBQUksS0FBSixBQUFTLEFBQ1Y7QUFDRjtBQVRELEFBVUQ7QUFYRCxBQUFpQixDQUFBOztBQWFqQixTQUFBLEFBQVMsUUFBVCxBQUFpQixVQUFVLEVBQUUsWUFBRixBQUFjLE1BQU0sV0FBcEIsQUFBK0IsTUFBTSxlQUFyQyxBQUFvRCxNQUFNLFNBQXJGLEFBQTJCLEFBQW1FOztBQUU5RixJQUFNLGdCQUFnQixTQUFoQixBQUFnQixjQUFBLEFBQUMsVUFBRCxBQUFXLGFBQWdCLEFBQy9DO29CQUFBLEFBQWtCLEtBQUssRUFBQyxVQUFELFVBQVcsYUFBbEMsQUFBdUIsQUFDeEI7QUFGRDs7USxBQUlTLGdCLEFBQUE7Ozs7Ozs7Ozs7QUN6QlQ7O0FBQ0E7O1EsQUFHRTtRLEFBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiaW1wb3J0IHsgbXV0YXRpb25XYXRjaCwgbGVhcm5pbmdFbGVtZW50JCB9IGZyb20gJy4vc3JjL3dhdGNoZXInO1xuXG5sZWFybmluZ0VsZW1lbnQkXG4gIC50YXAoY29uc29sZS5sb2cpXG4gIC5kcmFpbigpO1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBUZXN0IGFkZGl0aW9uIGFuZCByZW1vdmFsIC8vXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbnNldFRpbWVvdXQoZnVuY3Rpb24oKXtcblxuICB2YXIgZWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdbbGVhcm5pbmctZWxlbWVudC1yZWY9XCJwb2xsLTEtdmVyc2lvbi0xXCJdJyk7XG4gIGVsLm91dGVySFRNTCA9IFwiXCI7XG4gIC8vZGVsZXRlIGVsO1xuXG4gIGRvY3VtZW50LmJvZHkuaW5zZXJ0QWRqYWNlbnRIVE1MKCAnYWZ0ZXJiZWdpbicsICc8ZGl2IGxlYXJuaW5nLWVsZW1lbnQ9XCJwb2xsXCIgbGVhcm5pbmctZWxlbWVudC1yZWY9XCJwb2xsLTEtdmVyc2lvbi0xXCIgbGVhcm5pbmctZWxlbWVudC1vcHRpb25zPVwie31cIiBzZWNvbmQtbG9hZD48L2Rpdj4nICk7XG5cbn0sIDIwMDApOyIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gTGlua2VkTGlzdDtcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4vKipcbiAqIERvdWJseSBsaW5rZWQgbGlzdFxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIExpbmtlZExpc3QoKSB7XG4gIHRoaXMuaGVhZCA9IG51bGw7XG4gIHRoaXMubGVuZ3RoID0gMDtcbn1cblxuLyoqXG4gKiBBZGQgYSBub2RlIHRvIHRoZSBlbmQgb2YgdGhlIGxpc3RcbiAqIEBwYXJhbSB7e3ByZXY6T2JqZWN0fG51bGwsIG5leHQ6T2JqZWN0fG51bGwsIGRpc3Bvc2U6ZnVuY3Rpb259fSB4IG5vZGUgdG8gYWRkXG4gKi9cbkxpbmtlZExpc3QucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh4KSB7XG4gIGlmICh0aGlzLmhlYWQgIT09IG51bGwpIHtcbiAgICB0aGlzLmhlYWQucHJldiA9IHg7XG4gICAgeC5uZXh0ID0gdGhpcy5oZWFkO1xuICB9XG4gIHRoaXMuaGVhZCA9IHg7XG4gICsrdGhpcy5sZW5ndGg7XG59O1xuXG4vKipcbiAqIFJlbW92ZSB0aGUgcHJvdmlkZWQgbm9kZSBmcm9tIHRoZSBsaXN0XG4gKiBAcGFyYW0ge3twcmV2Ok9iamVjdHxudWxsLCBuZXh0Ok9iamVjdHxudWxsLCBkaXNwb3NlOmZ1bmN0aW9ufX0geCBub2RlIHRvIHJlbW92ZVxuICovXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiAoeCkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lICBjb21wbGV4aXR5XG4gIC0tdGhpcy5sZW5ndGg7XG4gIGlmICh4ID09PSB0aGlzLmhlYWQpIHtcbiAgICB0aGlzLmhlYWQgPSB0aGlzLmhlYWQubmV4dDtcbiAgfVxuICBpZiAoeC5uZXh0ICE9PSBudWxsKSB7XG4gICAgeC5uZXh0LnByZXYgPSB4LnByZXY7XG4gICAgeC5uZXh0ID0gbnVsbDtcbiAgfVxuICBpZiAoeC5wcmV2ICE9PSBudWxsKSB7XG4gICAgeC5wcmV2Lm5leHQgPSB4Lm5leHQ7XG4gICAgeC5wcmV2ID0gbnVsbDtcbiAgfVxufTtcblxuLyoqXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn0gdHJ1ZSBpZmYgdGhlcmUgYXJlIG5vIG5vZGVzIGluIHRoZSBsaXN0XG4gKi9cbkxpbmtlZExpc3QucHJvdG90eXBlLmlzRW1wdHkgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmxlbmd0aCA9PT0gMDtcbn07XG5cbi8qKlxuICogRGlzcG9zZSBhbGwgbm9kZXNcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2hlbiBhbGwgbm9kZXMgaGF2ZSBiZWVuIGRpc3Bvc2VkLFxuICogIG9yIHJlamVjdHMgaWYgYW4gZXJyb3Igb2NjdXJzIHdoaWxlIGRpc3Bvc2luZ1xuICovXG5MaW5rZWRMaXN0LnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5pc0VtcHR5KCkpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICB2YXIgcHJvbWlzZXMgPSBbXTtcbiAgdmFyIHggPSB0aGlzLmhlYWQ7XG4gIHRoaXMuaGVhZCA9IG51bGw7XG4gIHRoaXMubGVuZ3RoID0gMDtcblxuICB3aGlsZSAoeCAhPT0gbnVsbCkge1xuICAgIHByb21pc2VzLnB1c2goeC5kaXNwb3NlKCkpO1xuICAgIHggPSB4Lm5leHQ7XG4gIH1cblxuICByZXR1cm4gUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmlzUHJvbWlzZSA9IGlzUHJvbWlzZTtcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBpc1Byb21pc2UocCkge1xuICByZXR1cm4gcCAhPT0gbnVsbCAmJiB0eXBlb2YgcCA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIHAudGhlbiA9PT0gJ2Z1bmN0aW9uJztcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFF1ZXVlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbi8vIEJhc2VkIG9uIGh0dHBzOi8vZ2l0aHViLmNvbS9wZXRrYWFudG9ub3YvZGVxdWVcblxuZnVuY3Rpb24gUXVldWUoY2FwUG93Mikge1xuICB0aGlzLl9jYXBhY2l0eSA9IGNhcFBvdzIgfHwgMzI7XG4gIHRoaXMuX2xlbmd0aCA9IDA7XG4gIHRoaXMuX2hlYWQgPSAwO1xufVxuXG5RdWV1ZS5wcm90b3R5cGUucHVzaCA9IGZ1bmN0aW9uICh4KSB7XG4gIHZhciBsZW4gPSB0aGlzLl9sZW5ndGg7XG4gIHRoaXMuX2NoZWNrQ2FwYWNpdHkobGVuICsgMSk7XG5cbiAgdmFyIGkgPSB0aGlzLl9oZWFkICsgbGVuICYgdGhpcy5fY2FwYWNpdHkgLSAxO1xuICB0aGlzW2ldID0geDtcbiAgdGhpcy5fbGVuZ3RoID0gbGVuICsgMTtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5zaGlmdCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGhlYWQgPSB0aGlzLl9oZWFkO1xuICB2YXIgeCA9IHRoaXNbaGVhZF07XG5cbiAgdGhpc1toZWFkXSA9IHZvaWQgMDtcbiAgdGhpcy5faGVhZCA9IGhlYWQgKyAxICYgdGhpcy5fY2FwYWNpdHkgLSAxO1xuICB0aGlzLl9sZW5ndGgtLTtcbiAgcmV0dXJuIHg7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xlbmd0aCA9PT0gMDtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9sZW5ndGg7XG59O1xuXG5RdWV1ZS5wcm90b3R5cGUuX2NoZWNrQ2FwYWNpdHkgPSBmdW5jdGlvbiAoc2l6ZSkge1xuICBpZiAodGhpcy5fY2FwYWNpdHkgPCBzaXplKSB7XG4gICAgdGhpcy5fZW5zdXJlQ2FwYWNpdHkodGhpcy5fY2FwYWNpdHkgPDwgMSk7XG4gIH1cbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fZW5zdXJlQ2FwYWNpdHkgPSBmdW5jdGlvbiAoY2FwYWNpdHkpIHtcbiAgdmFyIG9sZENhcGFjaXR5ID0gdGhpcy5fY2FwYWNpdHk7XG4gIHRoaXMuX2NhcGFjaXR5ID0gY2FwYWNpdHk7XG5cbiAgdmFyIGxhc3QgPSB0aGlzLl9oZWFkICsgdGhpcy5fbGVuZ3RoO1xuXG4gIGlmIChsYXN0ID4gb2xkQ2FwYWNpdHkpIHtcbiAgICBjb3B5KHRoaXMsIDAsIHRoaXMsIG9sZENhcGFjaXR5LCBsYXN0ICYgb2xkQ2FwYWNpdHkgLSAxKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gY29weShzcmMsIHNyY0luZGV4LCBkc3QsIGRzdEluZGV4LCBsZW4pIHtcbiAgZm9yICh2YXIgaiA9IDA7IGogPCBsZW47ICsraikge1xuICAgIGRzdFtqICsgZHN0SW5kZXhdID0gc3JjW2ogKyBzcmNJbmRleF07XG4gICAgc3JjW2ogKyBzcmNJbmRleF0gPSB2b2lkIDA7XG4gIH1cbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFN0cmVhbTtcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBTdHJlYW0oc291cmNlKSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuc2NhbiA9IHNjYW47XG5leHBvcnRzLnJlZHVjZSA9IHJlZHVjZTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9ydW5Tb3VyY2UgPSByZXF1aXJlKCcuLi9ydW5Tb3VyY2UnKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmVhbSBjb250YWluaW5nIHN1Y2Nlc3NpdmUgcmVkdWNlIHJlc3VsdHMgb2YgYXBwbHlpbmcgZiB0b1xuICogdGhlIHByZXZpb3VzIHJlZHVjZSByZXN1bHQgYW5kIHRoZSBjdXJyZW50IHN0cmVhbSBpdGVtLlxuICogQHBhcmFtIHtmdW5jdGlvbihyZXN1bHQ6KiwgeDoqKToqfSBmIHJlZHVjZXIgZnVuY3Rpb25cbiAqIEBwYXJhbSB7Kn0gaW5pdGlhbCBpbml0aWFsIHZhbHVlXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIHN0cmVhbSB0byBzY2FuXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgc3VjY2Vzc2l2ZSByZWR1Y2UgcmVzdWx0c1xuICovXG5mdW5jdGlvbiBzY2FuKGYsIGluaXRpYWwsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFNjYW4oZiwgaW5pdGlhbCwgc3RyZWFtLnNvdXJjZSkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gU2NhbihmLCB6LCBzb3VyY2UpIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMudmFsdWUgPSB6O1xufVxuXG5TY2FuLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciBkMSA9IHNjaGVkdWxlci5hc2FwKF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0LmV2ZW50KHRoaXMudmFsdWUsIHNpbmspKTtcbiAgdmFyIGQyID0gdGhpcy5zb3VyY2UucnVuKG5ldyBTY2FuU2luayh0aGlzLmYsIHRoaXMudmFsdWUsIHNpbmspLCBzY2hlZHVsZXIpO1xuICByZXR1cm4gZGlzcG9zZS5hbGwoW2QxLCBkMl0pO1xufTtcblxuZnVuY3Rpb24gU2NhblNpbmsoZiwgeiwgc2luaykge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnZhbHVlID0gejtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuU2NhblNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIGYgPSB0aGlzLmY7XG4gIHRoaXMudmFsdWUgPSBmKHRoaXMudmFsdWUsIHgpO1xuICB0aGlzLnNpbmsuZXZlbnQodCwgdGhpcy52YWx1ZSk7XG59O1xuXG5TY2FuU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5TY2FuU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcblxuLyoqXG4qIFJlZHVjZSBhIHN0cmVhbSB0byBwcm9kdWNlIGEgc2luZ2xlIHJlc3VsdC4gIE5vdGUgdGhhdCByZWR1Y2luZyBhbiBpbmZpbml0ZVxuKiBzdHJlYW0gd2lsbCByZXR1cm4gYSBQcm9taXNlIHRoYXQgbmV2ZXIgZnVsZmlsbHMsIGJ1dCB0aGF0IG1heSByZWplY3QgaWYgYW4gZXJyb3Jcbiogb2NjdXJzLlxuKiBAcGFyYW0ge2Z1bmN0aW9uKHJlc3VsdDoqLCB4OiopOip9IGYgcmVkdWNlciBmdW5jdGlvblxuKiBAcGFyYW0geyp9IGluaXRpYWwgaW5pdGlhbCB2YWx1ZVxuKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIHRvIHJlZHVjZVxuKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSBmb3IgdGhlIGZpbGUgcmVzdWx0IG9mIHRoZSByZWR1Y2VcbiovXG5mdW5jdGlvbiByZWR1Y2UoZiwgaW5pdGlhbCwgc3RyZWFtKSB7XG4gIHJldHVybiAoMCwgX3J1blNvdXJjZS53aXRoRGVmYXVsdFNjaGVkdWxlcikobmV3IFJlZHVjZShmLCBpbml0aWFsLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIFJlZHVjZShmLCB6LCBzb3VyY2UpIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMudmFsdWUgPSB6O1xufVxuXG5SZWR1Y2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgUmVkdWNlU2luayh0aGlzLmYsIHRoaXMudmFsdWUsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gUmVkdWNlU2luayhmLCB6LCBzaW5rKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMudmFsdWUgPSB6O1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5SZWR1Y2VTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHZhciBmID0gdGhpcy5mO1xuICB0aGlzLnZhbHVlID0gZih0aGlzLnZhbHVlLCB4KTtcbiAgdGhpcy5zaW5rLmV2ZW50KHQsIHRoaXMudmFsdWUpO1xufTtcblxuUmVkdWNlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cblJlZHVjZVNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0KSB7XG4gIHRoaXMuc2luay5lbmQodCwgdGhpcy52YWx1ZSk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuYXAgPSBhcDtcblxudmFyIF9jb21iaW5lID0gcmVxdWlyZSgnLi9jb21iaW5lJyk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxuLyoqXG4gKiBBc3N1bWUgZnMgaXMgYSBzdHJlYW0gY29udGFpbmluZyBmdW5jdGlvbnMsIGFuZCBhcHBseSB0aGUgbGF0ZXN0IGZ1bmN0aW9uXG4gKiBpbiBmcyB0byB0aGUgbGF0ZXN0IHZhbHVlIGluIHhzLlxuICogZnM6ICAgICAgICAgLS1mLS0tLS0tLS0tZy0tLS0tLS0taC0tLS0tLT5cbiAqIHhzOiAgICAgICAgIC1hLS0tLS0tLWItLS0tLS0tYy0tLS0tLS1kLS0+XG4gKiBhcChmcywgeHMpOiAtLWZhLS0tLS1mYi1nYi0tLWdjLS1oYy0taGQtPlxuICogQHBhcmFtIHtTdHJlYW19IGZzIHN0cmVhbSBvZiBmdW5jdGlvbnMgdG8gYXBwbHkgdG8gdGhlIGxhdGVzdCB4XG4gKiBAcGFyYW0ge1N0cmVhbX0geHMgc3RyZWFtIG9mIHZhbHVlcyB0byB3aGljaCB0byBhcHBseSBhbGwgdGhlIGxhdGVzdCBmXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBhbGwgdGhlIGFwcGxpY2F0aW9ucyBvZiBmcyB0byB4c1xuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gYXAoZnMsIHhzKSB7XG4gIHJldHVybiAoMCwgX2NvbWJpbmUuY29tYmluZSkoX3ByZWx1ZGUuYXBwbHksIGZzLCB4cyk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5jb25zID0gY29ucztcbmV4cG9ydHMuY29uY2F0ID0gY29uY2F0O1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKCcuLi9zb3VyY2UvY29yZScpO1xuXG52YXIgX2NvbnRpbnVlV2l0aCA9IHJlcXVpcmUoJy4vY29udGludWVXaXRoJyk7XG5cbi8qKlxuICogQHBhcmFtIHsqfSB4IHZhbHVlIHRvIHByZXBlbmRcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gd2l0aCB4IHByZXBlbmRlZFxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gY29ucyh4LCBzdHJlYW0pIHtcbiAgcmV0dXJuIGNvbmNhdCgoMCwgX2NvcmUub2YpKHgpLCBzdHJlYW0pO1xufVxuXG4vKipcbiogQHBhcmFtIHtTdHJlYW19IGxlZnRcbiogQHBhcmFtIHtTdHJlYW19IHJpZ2h0XG4qIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBhbGwgZXZlbnRzIGluIGxlZnQgZm9sbG93ZWQgYnkgYWxsXG4qICBldmVudHMgaW4gcmlnaHQuICBUaGlzICp0aW1lc2hpZnRzKiByaWdodCB0byB0aGUgZW5kIG9mIGxlZnQuXG4qL1xuZnVuY3Rpb24gY29uY2F0KGxlZnQsIHJpZ2h0KSB7XG4gIHJldHVybiAoMCwgX2NvbnRpbnVlV2l0aC5jb250aW51ZVdpdGgpKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gcmlnaHQ7XG4gIH0sIGxlZnQpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuY29tYmluZSA9IGNvbWJpbmU7XG5leHBvcnRzLmNvbWJpbmVBcnJheSA9IGNvbWJpbmVBcnJheTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF90cmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybScpO1xuXG52YXIgdHJhbnNmb3JtID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3RyYW5zZm9ybSk7XG5cbnZhciBfY29yZSA9IHJlcXVpcmUoJy4uL3NvdXJjZS9jb3JlJyk7XG5cbnZhciBjb3JlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2NvcmUpO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX0luZGV4U2luayA9IHJlcXVpcmUoJy4uL3NpbmsvSW5kZXhTaW5rJyk7XG5cbnZhciBfSW5kZXhTaW5rMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0luZGV4U2luayk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxudmFyIF9pbnZva2UgPSByZXF1aXJlKCcuLi9pbnZva2UnKTtcblxudmFyIF9pbnZva2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW52b2tlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG52YXIgbWFwID0gYmFzZS5tYXA7XG52YXIgdGFpbCA9IGJhc2UudGFpbDtcblxuLyoqXG4gKiBDb21iaW5lIGxhdGVzdCBldmVudHMgZnJvbSBhbGwgaW5wdXQgc3RyZWFtc1xuICogQHBhcmFtIHtmdW5jdGlvbiguLi5ldmVudHMpOip9IGYgZnVuY3Rpb24gdG8gY29tYmluZSBtb3N0IHJlY2VudCBldmVudHNcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIHRoZSByZXN1bHQgb2YgYXBwbHlpbmcgZiB0byB0aGUgbW9zdCByZWNlbnRcbiAqICBldmVudCBvZiBlYWNoIGlucHV0IHN0cmVhbSwgd2hlbmV2ZXIgYSBuZXcgZXZlbnQgYXJyaXZlcyBvbiBhbnkgc3RyZWFtLlxuICovXG5mdW5jdGlvbiBjb21iaW5lKGYgLyosIC4uLnN0cmVhbXMgKi8pIHtcbiAgcmV0dXJuIGNvbWJpbmVBcnJheShmLCB0YWlsKGFyZ3VtZW50cykpO1xufVxuXG4vKipcbiogQ29tYmluZSBsYXRlc3QgZXZlbnRzIGZyb20gYWxsIGlucHV0IHN0cmVhbXNcbiogQHBhcmFtIHtmdW5jdGlvbiguLi5ldmVudHMpOip9IGYgZnVuY3Rpb24gdG8gY29tYmluZSBtb3N0IHJlY2VudCBldmVudHNcbiogQHBhcmFtIHtbU3RyZWFtXX0gc3RyZWFtcyBtb3N0IHJlY2VudCBldmVudHNcbiogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBmIHRvIHRoZSBtb3N0IHJlY2VudFxuKiAgZXZlbnQgb2YgZWFjaCBpbnB1dCBzdHJlYW0sIHdoZW5ldmVyIGEgbmV3IGV2ZW50IGFycml2ZXMgb24gYW55IHN0cmVhbS5cbiovXG5mdW5jdGlvbiBjb21iaW5lQXJyYXkoZiwgc3RyZWFtcykge1xuICB2YXIgbCA9IHN0cmVhbXMubGVuZ3RoO1xuICByZXR1cm4gbCA9PT0gMCA/IGNvcmUuZW1wdHkoKSA6IGwgPT09IDEgPyB0cmFuc2Zvcm0ubWFwKGYsIHN0cmVhbXNbMF0pIDogbmV3IF9TdHJlYW0yLmRlZmF1bHQoY29tYmluZVNvdXJjZXMoZiwgc3RyZWFtcykpO1xufVxuXG5mdW5jdGlvbiBjb21iaW5lU291cmNlcyhmLCBzdHJlYW1zKSB7XG4gIHJldHVybiBuZXcgQ29tYmluZShmLCBtYXAoZ2V0U291cmNlLCBzdHJlYW1zKSk7XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZShzdHJlYW0pIHtcbiAgcmV0dXJuIHN0cmVhbS5zb3VyY2U7XG59XG5cbmZ1bmN0aW9uIENvbWJpbmUoZiwgc291cmNlcykge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNvdXJjZXMgPSBzb3VyY2VzO1xufVxuXG5Db21iaW5lLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIHZhciBsID0gdGhpcy5zb3VyY2VzLmxlbmd0aDtcbiAgdmFyIGRpc3Bvc2FibGVzID0gbmV3IEFycmF5KGwpO1xuICB2YXIgc2lua3MgPSBuZXcgQXJyYXkobCk7XG5cbiAgdmFyIG1lcmdlU2luayA9IG5ldyBDb21iaW5lU2luayhkaXNwb3NhYmxlcywgc2lua3MsIHNpbmssIHRoaXMuZik7XG5cbiAgZm9yICh2YXIgaW5kZXhTaW5rLCBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGluZGV4U2luayA9IHNpbmtzW2ldID0gbmV3IF9JbmRleFNpbmsyLmRlZmF1bHQoaSwgbWVyZ2VTaW5rKTtcbiAgICBkaXNwb3NhYmxlc1tpXSA9IHRoaXMkMS5zb3VyY2VzW2ldLnJ1bihpbmRleFNpbmssIHNjaGVkdWxlcik7XG4gIH1cblxuICByZXR1cm4gZGlzcG9zZS5hbGwoZGlzcG9zYWJsZXMpO1xufTtcblxuZnVuY3Rpb24gQ29tYmluZVNpbmsoZGlzcG9zYWJsZXMsIHNpbmtzLCBzaW5rLCBmKSB7XG4gIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZGlzcG9zYWJsZXMgPSBkaXNwb3NhYmxlcztcbiAgdGhpcy5zaW5rcyA9IHNpbmtzO1xuICB0aGlzLmYgPSBmO1xuXG4gIHZhciBsID0gc2lua3MubGVuZ3RoO1xuICB0aGlzLmF3YWl0aW5nID0gbDtcbiAgdGhpcy52YWx1ZXMgPSBuZXcgQXJyYXkobCk7XG4gIHRoaXMuaGFzVmFsdWUgPSBuZXcgQXJyYXkobCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgdGhpcyQxLmhhc1ZhbHVlW2ldID0gZmFsc2U7XG4gIH1cblxuICB0aGlzLmFjdGl2ZUNvdW50ID0gc2lua3MubGVuZ3RoO1xufVxuXG5Db21iaW5lU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbkNvbWJpbmVTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCBpbmRleGVkVmFsdWUpIHtcbiAgdmFyIGkgPSBpbmRleGVkVmFsdWUuaW5kZXg7XG4gIHZhciBhd2FpdGluZyA9IHRoaXMuX3VwZGF0ZVJlYWR5KGkpO1xuXG4gIHRoaXMudmFsdWVzW2ldID0gaW5kZXhlZFZhbHVlLnZhbHVlO1xuICBpZiAoYXdhaXRpbmcgPT09IDApIHtcbiAgICB0aGlzLnNpbmsuZXZlbnQodCwgKDAsIF9pbnZva2UyLmRlZmF1bHQpKHRoaXMuZiwgdGhpcy52YWx1ZXMpKTtcbiAgfVxufTtcblxuQ29tYmluZVNpbmsucHJvdG90eXBlLl91cGRhdGVSZWFkeSA9IGZ1bmN0aW9uIChpbmRleCkge1xuICBpZiAodGhpcy5hd2FpdGluZyA+IDApIHtcbiAgICBpZiAoIXRoaXMuaGFzVmFsdWVbaW5kZXhdKSB7XG4gICAgICB0aGlzLmhhc1ZhbHVlW2luZGV4XSA9IHRydWU7XG4gICAgICB0aGlzLmF3YWl0aW5nIC09IDE7XG4gICAgfVxuICB9XG4gIHJldHVybiB0aGlzLmF3YWl0aW5nO1xufTtcblxuQ29tYmluZVNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCBpbmRleGVkVmFsdWUpIHtcbiAgZGlzcG9zZS50cnlEaXNwb3NlKHQsIHRoaXMuZGlzcG9zYWJsZXNbaW5kZXhlZFZhbHVlLmluZGV4XSwgdGhpcy5zaW5rKTtcbiAgaWYgKC0tdGhpcy5hY3RpdmVDb3VudCA9PT0gMCkge1xuICAgIHRoaXMuc2luay5lbmQodCwgaW5kZXhlZFZhbHVlLnZhbHVlKTtcbiAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmNvbmNhdE1hcCA9IGNvbmNhdE1hcDtcblxudmFyIF9tZXJnZUNvbmN1cnJlbnRseSA9IHJlcXVpcmUoJy4vbWVyZ2VDb25jdXJyZW50bHknKTtcblxuLyoqXG4gKiBNYXAgZWFjaCB2YWx1ZSBpbiBzdHJlYW0gdG8gYSBuZXcgc3RyZWFtLCBhbmQgY29uY2F0ZW5hdGUgdGhlbSBhbGxcbiAqIHN0cmVhbTogICAgICAgICAgICAgIC1hLS0tYi0tLWNYXG4gKiBmKGEpOiAgICAgICAgICAgICAgICAgMS0xLTEtMVhcbiAqIGYoYik6ICAgICAgICAgICAgICAgICAgICAgICAgLTItMi0yLTJYXG4gKiBmKGMpOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLTMtMy0zLTNYXG4gKiBzdHJlYW0uY29uY2F0TWFwKGYpOiAtMS0xLTEtMS0yLTItMi0yLTMtMy0zLTNYXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6U3RyZWFtfSBmIGZ1bmN0aW9uIHRvIG1hcCBlYWNoIHZhbHVlIHRvIGEgc3RyZWFtXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBmcm9tIGVhY2ggc3RyZWFtIHJldHVybmVkIGJ5IGZcbiAqL1xuZnVuY3Rpb24gY29uY2F0TWFwKGYsIHN0cmVhbSkge1xuICByZXR1cm4gKDAsIF9tZXJnZUNvbmN1cnJlbnRseS5tZXJnZU1hcENvbmN1cnJlbnRseSkoZiwgMSwgc3RyZWFtKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5jb250aW51ZVdpdGggPSBjb250aW51ZVdpdGg7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIGNvbnRpbnVlV2l0aChmLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBDb250aW51ZVdpdGgoZiwgc3RyZWFtLnNvdXJjZSkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gQ29udGludWVXaXRoKGYsIHNvdXJjZSkge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuQ29udGludWVXaXRoLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgQ29udGludWVXaXRoU2luayh0aGlzLmYsIHRoaXMuc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gQ29udGludWVXaXRoU2luayhmLCBzb3VyY2UsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICB0aGlzLmRpc3Bvc2FibGUgPSBkaXNwb3NlLm9uY2Uoc291cmNlLnJ1bih0aGlzLCBzY2hlZHVsZXIpKTtcbn1cblxuQ29udGludWVXaXRoU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbkNvbnRpbnVlV2l0aFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG59O1xuXG5Db250aW51ZVdpdGhTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgZGlzcG9zZS50cnlEaXNwb3NlKHQsIHRoaXMuZGlzcG9zYWJsZSwgdGhpcy5zaW5rKTtcbiAgdGhpcy5fc3RhcnROZXh0KHQsIHgsIHRoaXMuc2luayk7XG59O1xuXG5Db250aW51ZVdpdGhTaW5rLnByb3RvdHlwZS5fc3RhcnROZXh0ID0gZnVuY3Rpb24gKHQsIHgsIHNpbmspIHtcbiAgdHJ5IHtcbiAgICB0aGlzLmRpc3Bvc2FibGUgPSB0aGlzLl9jb250aW51ZSh0aGlzLmYsIHgsIHNpbmspO1xuICB9IGNhdGNoIChlKSB7XG4gICAgc2luay5lcnJvcih0LCBlKTtcbiAgfVxufTtcblxuQ29udGludWVXaXRoU2luay5wcm90b3R5cGUuX2NvbnRpbnVlID0gZnVuY3Rpb24gKGYsIHgsIHNpbmspIHtcbiAgcmV0dXJuIGYoeCkuc291cmNlLnJ1bihzaW5rLCB0aGlzLnNjaGVkdWxlcik7XG59O1xuXG5Db250aW51ZVdpdGhTaW5rLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICByZXR1cm4gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWxheSA9IGRlbGF5O1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfUHJvcGFnYXRlVGFzayA9IHJlcXVpcmUoJy4uL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5VGltZSBtaWxsaXNlY29uZHMgdG8gZGVsYXkgZWFjaCBpdGVtXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHNhbWUgaXRlbXMsIGJ1dCBkZWxheWVkIGJ5IG1zXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBkZWxheShkZWxheVRpbWUsIHN0cmVhbSkge1xuICByZXR1cm4gZGVsYXlUaW1lIDw9IDAgPyBzdHJlYW0gOiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgRGVsYXkoZGVsYXlUaW1lLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIERlbGF5KGR0LCBzb3VyY2UpIHtcbiAgdGhpcy5kdCA9IGR0O1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuRGVsYXkucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIGRlbGF5U2luayA9IG5ldyBEZWxheVNpbmsodGhpcy5kdCwgc2luaywgc2NoZWR1bGVyKTtcbiAgcmV0dXJuIGRpc3Bvc2UuYWxsKFtkZWxheVNpbmssIHRoaXMuc291cmNlLnJ1bihkZWxheVNpbmssIHNjaGVkdWxlcildKTtcbn07XG5cbmZ1bmN0aW9uIERlbGF5U2luayhkdCwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZHQgPSBkdDtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG59XG5cbkRlbGF5U2luay5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnNjaGVkdWxlci5jYW5jZWxBbGwoZnVuY3Rpb24gKHRhc2spIHtcbiAgICByZXR1cm4gdGFzay5zaW5rID09PSBzZWxmLnNpbms7XG4gIH0pO1xufTtcblxuRGVsYXlTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMuc2NoZWR1bGVyLmRlbGF5KHRoaXMuZHQsIF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0LmV2ZW50KHgsIHRoaXMuc2luaykpO1xufTtcblxuRGVsYXlTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0aGlzLnNjaGVkdWxlci5kZWxheSh0aGlzLmR0LCBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdC5lbmQoeCwgdGhpcy5zaW5rKSk7XG59O1xuXG5EZWxheVNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZmxhdE1hcEVycm9yID0gdW5kZWZpbmVkO1xuZXhwb3J0cy5yZWNvdmVyV2l0aCA9IHJlY292ZXJXaXRoO1xuZXhwb3J0cy50aHJvd0Vycm9yID0gdGhyb3dFcnJvcjtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9TYWZlU2luayA9IHJlcXVpcmUoJy4uL3NpbmsvU2FmZVNpbmsnKTtcblxudmFyIF9TYWZlU2luazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TYWZlU2luayk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF90cnlFdmVudCA9IHJlcXVpcmUoJy4uL3NvdXJjZS90cnlFdmVudCcpO1xuXG52YXIgdHJ5RXZlbnQgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdHJ5RXZlbnQpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIElmIHN0cmVhbSBlbmNvdW50ZXJzIGFuIGVycm9yLCByZWNvdmVyIGFuZCBjb250aW51ZSB3aXRoIGl0ZW1zIGZyb20gc3RyZWFtXG4gKiByZXR1cm5lZCBieSBmLlxuICogQHBhcmFtIHtmdW5jdGlvbihlcnJvcjoqKTpTdHJlYW19IGYgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIG5ldyBzdHJlYW1cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gd2hpY2ggd2lsbCByZWNvdmVyIGZyb20gYW4gZXJyb3IgYnkgY2FsbGluZyBmXG4gKi9cbmZ1bmN0aW9uIHJlY292ZXJXaXRoKGYsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFJlY292ZXJXaXRoKGYsIHN0cmVhbS5zb3VyY2UpKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbnZhciBmbGF0TWFwRXJyb3IgPSBleHBvcnRzLmZsYXRNYXBFcnJvciA9IHJlY292ZXJXaXRoO1xuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmVhbSBjb250YWluaW5nIG9ubHkgYW4gZXJyb3JcbiAqIEBwYXJhbSB7Kn0gZSBlcnJvciB2YWx1ZSwgcHJlZmVyYWJseSBhbiBFcnJvciBvciBFcnJvciBzdWJ0eXBlXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgb25seSBhbiBlcnJvclxuICovXG5mdW5jdGlvbiB0aHJvd0Vycm9yKGUpIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBFcnJvclNvdXJjZShlKSk7XG59XG5cbmZ1bmN0aW9uIEVycm9yU291cmNlKGUpIHtcbiAgdGhpcy52YWx1ZSA9IGU7XG59XG5cbkVycm9yU291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBzY2hlZHVsZXIuYXNhcChuZXcgX1Byb3BhZ2F0ZVRhc2syLmRlZmF1bHQocnVuRXJyb3IsIHRoaXMudmFsdWUsIHNpbmspKTtcbn07XG5cbmZ1bmN0aW9uIHJ1bkVycm9yKHQsIGUsIHNpbmspIHtcbiAgc2luay5lcnJvcih0LCBlKTtcbn1cblxuZnVuY3Rpb24gUmVjb3ZlcldpdGgoZiwgc291cmNlKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5SZWNvdmVyV2l0aC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gbmV3IFJlY292ZXJXaXRoU2luayh0aGlzLmYsIHRoaXMuc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gUmVjb3ZlcldpdGhTaW5rKGYsIHNvdXJjZSwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2luayA9IG5ldyBfU2FmZVNpbmsyLmRlZmF1bHQoc2luayk7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLmRpc3Bvc2FibGUgPSBzb3VyY2UucnVuKHRoaXMsIHNjaGVkdWxlcik7XG59XG5cblJlY292ZXJXaXRoU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0cnlFdmVudC50cnlFdmVudCh0LCB4LCB0aGlzLnNpbmspO1xufTtcblxuUmVjb3ZlcldpdGhTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0cnlFdmVudC50cnlFbmQodCwgeCwgdGhpcy5zaW5rKTtcbn07XG5cblJlY292ZXJXaXRoU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICB2YXIgbmV4dFNpbmsgPSB0aGlzLnNpbmsuZGlzYWJsZSgpO1xuXG4gIGRpc3Bvc2UudHJ5RGlzcG9zZSh0LCB0aGlzLmRpc3Bvc2FibGUsIHRoaXMuc2luayk7XG4gIHRoaXMuX3N0YXJ0TmV4dCh0LCBlLCBuZXh0U2luayk7XG59O1xuXG5SZWNvdmVyV2l0aFNpbmsucHJvdG90eXBlLl9zdGFydE5leHQgPSBmdW5jdGlvbiAodCwgeCwgc2luaykge1xuICB0cnkge1xuICAgIHRoaXMuZGlzcG9zYWJsZSA9IHRoaXMuX2NvbnRpbnVlKHRoaXMuZiwgeCwgc2luayk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzaW5rLmVycm9yKHQsIGUpO1xuICB9XG59O1xuXG5SZWNvdmVyV2l0aFNpbmsucHJvdG90eXBlLl9jb250aW51ZSA9IGZ1bmN0aW9uIChmLCB4LCBzaW5rKSB7XG4gIHZhciBzdHJlYW0gPSBmKHgpO1xuICByZXR1cm4gc3RyZWFtLnNvdXJjZS5ydW4oc2luaywgdGhpcy5zY2hlZHVsZXIpO1xufTtcblxuUmVjb3ZlcldpdGhTaW5rLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5maWx0ZXIgPSBmaWx0ZXI7XG5leHBvcnRzLnNraXBSZXBlYXRzID0gc2tpcFJlcGVhdHM7XG5leHBvcnRzLnNraXBSZXBlYXRzV2l0aCA9IHNraXBSZXBlYXRzV2l0aDtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9GaWx0ZXIgPSByZXF1aXJlKCcuLi9mdXNpb24vRmlsdGVyJyk7XG5cbnZhciBfRmlsdGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0ZpbHRlcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogUmV0YWluIG9ubHkgaXRlbXMgbWF0Y2hpbmcgYSBwcmVkaWNhdGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKTpib29sZWFufSBwIGZpbHRlcmluZyBwcmVkaWNhdGUgY2FsbGVkIGZvciBlYWNoIGl0ZW1cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIHRvIGZpbHRlclxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgb25seSBpdGVtcyBmb3Igd2hpY2ggcHJlZGljYXRlIHJldHVybnMgdHJ1dGh5XG4gKi9cbmZ1bmN0aW9uIGZpbHRlcihwLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KF9GaWx0ZXIyLmRlZmF1bHQuY3JlYXRlKHAsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuLyoqXG4gKiBTa2lwIHJlcGVhdGVkIGV2ZW50cywgdXNpbmcgPT09IHRvIGRldGVjdCBkdXBsaWNhdGVzXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIHN0cmVhbSBmcm9tIHdoaWNoIHRvIG9taXQgcmVwZWF0ZWQgZXZlbnRzXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gd2l0aG91dCByZXBlYXRlZCBldmVudHNcbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIHNraXBSZXBlYXRzKHN0cmVhbSkge1xuICByZXR1cm4gc2tpcFJlcGVhdHNXaXRoKHNhbWUsIHN0cmVhbSk7XG59XG5cbi8qKlxuICogU2tpcCByZXBlYXRlZCBldmVudHMgdXNpbmcgdGhlIHByb3ZpZGVkIGVxdWFscyBmdW5jdGlvbiB0byBkZXRlY3QgZHVwbGljYXRlc1xuICogQHBhcmFtIHtmdW5jdGlvbihhOiosIGI6Kik6Ym9vbGVhbn0gZXF1YWxzIG9wdGlvbmFsIGZ1bmN0aW9uIHRvIGNvbXBhcmUgaXRlbXNcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIGZyb20gd2hpY2ggdG8gb21pdCByZXBlYXRlZCBldmVudHNcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSB3aXRob3V0IHJlcGVhdGVkIGV2ZW50c1xuICovXG5mdW5jdGlvbiBza2lwUmVwZWF0c1dpdGgoZXF1YWxzLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBTa2lwUmVwZWF0cyhlcXVhbHMsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gU2tpcFJlcGVhdHMoZXF1YWxzLCBzb3VyY2UpIHtcbiAgdGhpcy5lcXVhbHMgPSBlcXVhbHM7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5Ta2lwUmVwZWF0cy5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gdGhpcy5zb3VyY2UucnVuKG5ldyBTa2lwUmVwZWF0c1NpbmsodGhpcy5lcXVhbHMsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gU2tpcFJlcGVhdHNTaW5rKGVxdWFscywgc2luaykge1xuICB0aGlzLmVxdWFscyA9IGVxdWFscztcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy52YWx1ZSA9IHZvaWQgMDtcbiAgdGhpcy5pbml0ID0gdHJ1ZTtcbn1cblxuU2tpcFJlcGVhdHNTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuU2tpcFJlcGVhdHNTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuU2tpcFJlcGVhdHNTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICh0aGlzLmluaXQpIHtcbiAgICB0aGlzLmluaXQgPSBmYWxzZTtcbiAgICB0aGlzLnZhbHVlID0geDtcbiAgICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG4gIH0gZWxzZSBpZiAoIXRoaXMuZXF1YWxzKHRoaXMudmFsdWUsIHgpKSB7XG4gICAgdGhpcy52YWx1ZSA9IHg7XG4gICAgdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBzYW1lKGEsIGIpIHtcbiAgcmV0dXJuIGEgPT09IGI7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5mbGF0TWFwID0gZmxhdE1hcDtcbmV4cG9ydHMuam9pbiA9IGpvaW47XG5cbnZhciBfbWVyZ2VDb25jdXJyZW50bHkgPSByZXF1aXJlKCcuL21lcmdlQ29uY3VycmVudGx5Jyk7XG5cbi8qKlxuICogTWFwIGVhY2ggdmFsdWUgaW4gdGhlIHN0cmVhbSB0byBhIG5ldyBzdHJlYW0sIGFuZCBtZXJnZSBpdCBpbnRvIHRoZVxuICogcmV0dXJuZWQgb3V0ZXIgc3RyZWFtLiBFdmVudCBhcnJpdmFsIHRpbWVzIGFyZSBwcmVzZXJ2ZWQuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6U3RyZWFtfSBmIGNoYWluaW5nIGZ1bmN0aW9uLCBtdXN0IHJldHVybiBhIFN0cmVhbVxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIGFsbCBldmVudHMgZnJvbSBlYWNoIHN0cmVhbSByZXR1cm5lZCBieSBmXG4gKi9cbmZ1bmN0aW9uIGZsYXRNYXAoZiwgc3RyZWFtKSB7XG4gIHJldHVybiAoMCwgX21lcmdlQ29uY3VycmVudGx5Lm1lcmdlTWFwQ29uY3VycmVudGx5KShmLCBJbmZpbml0eSwgc3RyZWFtKTtcbn1cblxuLyoqXG4gKiBNb25hZGljIGpvaW4uIEZsYXR0ZW4gYSBTdHJlYW08U3RyZWFtPFg+PiB0byBTdHJlYW08WD4gYnkgbWVyZ2luZyBpbm5lclxuICogc3RyZWFtcyB0byB0aGUgb3V0ZXIuIEV2ZW50IGFycml2YWwgdGltZXMgYXJlIHByZXNlcnZlZC5cbiAqIEBwYXJhbSB7U3RyZWFtPFN0cmVhbTxYPj59IHN0cmVhbSBzdHJlYW0gb2Ygc3RyZWFtc1xuICogQHJldHVybnMge1N0cmVhbTxYPn0gbmV3IHN0cmVhbSBjb250YWluaW5nIGFsbCBldmVudHMgb2YgYWxsIGlubmVyIHN0cmVhbXNcbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGpvaW4oc3RyZWFtKSB7XG4gIHJldHVybiAoMCwgX21lcmdlQ29uY3VycmVudGx5Lm1lcmdlQ29uY3VycmVudGx5KShJbmZpbml0eSwgc3RyZWFtKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnRocm90dGxlID0gdGhyb3R0bGU7XG5leHBvcnRzLmRlYm91bmNlID0gZGVib3VuY2U7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrID0gcmVxdWlyZSgnLi4vc2NoZWR1bGVyL1Byb3BhZ2F0ZVRhc2snKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1Byb3BhZ2F0ZVRhc2spO1xuXG52YXIgX01hcCA9IHJlcXVpcmUoJy4uL2Z1c2lvbi9NYXAnKTtcblxudmFyIF9NYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTWFwKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogTGltaXQgdGhlIHJhdGUgb2YgZXZlbnRzIGJ5IHN1cHByZXNzaW5nIGV2ZW50cyB0aGF0IG9jY3VyIHRvbyBvZnRlblxuICogQHBhcmFtIHtOdW1iZXJ9IHBlcmlvZCB0aW1lIHRvIHN1cHByZXNzIGV2ZW50c1xuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX1cbiAqL1xuZnVuY3Rpb24gdGhyb3R0bGUocGVyaW9kLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KHRocm90dGxlU291cmNlKHBlcmlvZCwgc3RyZWFtLnNvdXJjZSkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gdGhyb3R0bGVTb3VyY2UocGVyaW9kLCBzb3VyY2UpIHtcbiAgcmV0dXJuIHNvdXJjZSBpbnN0YW5jZW9mIF9NYXAyLmRlZmF1bHQgPyBjb21tdXRlTWFwVGhyb3R0bGUocGVyaW9kLCBzb3VyY2UpIDogc291cmNlIGluc3RhbmNlb2YgVGhyb3R0bGUgPyBmdXNlVGhyb3R0bGUocGVyaW9kLCBzb3VyY2UpIDogbmV3IFRocm90dGxlKHBlcmlvZCwgc291cmNlKTtcbn1cblxuZnVuY3Rpb24gY29tbXV0ZU1hcFRocm90dGxlKHBlcmlvZCwgc291cmNlKSB7XG4gIHJldHVybiBfTWFwMi5kZWZhdWx0LmNyZWF0ZShzb3VyY2UuZiwgdGhyb3R0bGVTb3VyY2UocGVyaW9kLCBzb3VyY2Uuc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIGZ1c2VUaHJvdHRsZShwZXJpb2QsIHNvdXJjZSkge1xuICByZXR1cm4gbmV3IFRocm90dGxlKE1hdGgubWF4KHBlcmlvZCwgc291cmNlLnBlcmlvZCksIHNvdXJjZS5zb3VyY2UpO1xufVxuXG5mdW5jdGlvbiBUaHJvdHRsZShwZXJpb2QsIHNvdXJjZSkge1xuICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblRocm90dGxlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IFRocm90dGxlU2luayh0aGlzLnBlcmlvZCwgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBUaHJvdHRsZVNpbmsocGVyaW9kLCBzaW5rKSB7XG4gIHRoaXMudGltZSA9IDA7XG4gIHRoaXMucGVyaW9kID0gcGVyaW9kO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5UaHJvdHRsZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHQgPj0gdGhpcy50aW1lKSB7XG4gICAgdGhpcy50aW1lID0gdCArIHRoaXMucGVyaW9kO1xuICAgIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbiAgfVxufTtcblxuVGhyb3R0bGVTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuXG5UaHJvdHRsZVNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG4vKipcbiAqIFdhaXQgZm9yIGEgYnVyc3Qgb2YgZXZlbnRzIHRvIHN1YnNpZGUgYW5kIGVtaXQgb25seSB0aGUgbGFzdCBldmVudCBpbiB0aGUgYnVyc3RcbiAqIEBwYXJhbSB7TnVtYmVyfSBwZXJpb2QgZXZlbnRzIG9jY3VyaW5nIG1vcmUgZnJlcXVlbnRseSB0aGFuIHRoaXNcbiAqICB3aWxsIGJlIHN1cHByZXNzZWRcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIHRvIGRlYm91bmNlXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgZGVib3VuY2VkIHN0cmVhbVxuICovXG5mdW5jdGlvbiBkZWJvdW5jZShwZXJpb2QsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IERlYm91bmNlKHBlcmlvZCwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBEZWJvdW5jZShkdCwgc291cmNlKSB7XG4gIHRoaXMuZHQgPSBkdDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cbkRlYm91bmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgRGVib3VuY2VTaW5rKHRoaXMuZHQsIHRoaXMuc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gRGVib3VuY2VTaW5rKGR0LCBzb3VyY2UsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLmR0ID0gZHQ7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLnZhbHVlID0gdm9pZCAwO1xuICB0aGlzLnRpbWVyID0gbnVsbDtcblxuICB2YXIgc291cmNlRGlzcG9zYWJsZSA9IHNvdXJjZS5ydW4odGhpcywgc2NoZWR1bGVyKTtcbiAgdGhpcy5kaXNwb3NhYmxlID0gZGlzcG9zZS5hbGwoW3RoaXMsIHNvdXJjZURpc3Bvc2FibGVdKTtcbn1cblxuRGVib3VuY2VTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMuX2NsZWFyVGltZXIoKTtcbiAgdGhpcy52YWx1ZSA9IHg7XG4gIHRoaXMudGltZXIgPSB0aGlzLnNjaGVkdWxlci5kZWxheSh0aGlzLmR0LCBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdC5ldmVudCh4LCB0aGlzLnNpbmspKTtcbn07XG5cbkRlYm91bmNlU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHRoaXMuX2NsZWFyVGltZXIoKSkge1xuICAgIHRoaXMuc2luay5ldmVudCh0LCB0aGlzLnZhbHVlKTtcbiAgICB0aGlzLnZhbHVlID0gdm9pZCAwO1xuICB9XG4gIHRoaXMuc2luay5lbmQodCwgeCk7XG59O1xuXG5EZWJvdW5jZVNpbmsucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5fY2xlYXJUaW1lcigpO1xuICB0aGlzLnNpbmsuZXJyb3IodCwgeCk7XG59O1xuXG5EZWJvdW5jZVNpbmsucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuX2NsZWFyVGltZXIoKTtcbn07XG5cbkRlYm91bmNlU2luay5wcm90b3R5cGUuX2NsZWFyVGltZXIgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLnRpbWVyID09PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHRoaXMudGltZXIuZGlzcG9zZSgpO1xuICB0aGlzLnRpbWVyID0gbnVsbDtcbiAgcmV0dXJuIHRydWU7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMubG9vcCA9IGxvb3A7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogR2VuZXJhbGl6ZWQgZmVlZGJhY2sgbG9vcC4gQ2FsbCBhIHN0ZXBwZXIgZnVuY3Rpb24gZm9yIGVhY2ggZXZlbnQuIFRoZSBzdGVwcGVyXG4gKiB3aWxsIGJlIGNhbGxlZCB3aXRoIDIgcGFyYW1zOiB0aGUgY3VycmVudCBzZWVkIGFuZCB0aGUgYW4gZXZlbnQgdmFsdWUuICBJdCBtdXN0XG4gKiByZXR1cm4gYSBuZXcgeyBzZWVkLCB2YWx1ZSB9IHBhaXIuIFRoZSBgc2VlZGAgd2lsbCBiZSBmZWQgYmFjayBpbnRvIHRoZSBuZXh0XG4gKiBpbnZvY2F0aW9uIG9mIHN0ZXBwZXIsIGFuZCB0aGUgYHZhbHVlYCB3aWxsIGJlIHByb3BhZ2F0ZWQgYXMgdGhlIGV2ZW50IHZhbHVlLlxuICogQHBhcmFtIHtmdW5jdGlvbihzZWVkOiosIHZhbHVlOiopOntzZWVkOiosIHZhbHVlOip9fSBzdGVwcGVyIGxvb3Agc3RlcCBmdW5jdGlvblxuICogQHBhcmFtIHsqfSBzZWVkIGluaXRpYWwgc2VlZCB2YWx1ZSBwYXNzZWQgdG8gZmlyc3Qgc3RlcHBlciBjYWxsXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIGV2ZW50IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aG9zZSB2YWx1ZXMgYXJlIHRoZSBgdmFsdWVgIGZpZWxkIG9mIHRoZSBvYmplY3RzXG4gKiByZXR1cm5lZCBieSB0aGUgc3RlcHBlclxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gbG9vcChzdGVwcGVyLCBzZWVkLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBMb29wKHN0ZXBwZXIsIHNlZWQsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gTG9vcChzdGVwcGVyLCBzZWVkLCBzb3VyY2UpIHtcbiAgdGhpcy5zdGVwID0gc3RlcHBlcjtcbiAgdGhpcy5zZWVkID0gc2VlZDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cbkxvb3AucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgTG9vcFNpbmsodGhpcy5zdGVwLCB0aGlzLnNlZWQsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gTG9vcFNpbmsoc3RlcHBlciwgc2VlZCwgc2luaykge1xuICB0aGlzLnN0ZXAgPSBzdGVwcGVyO1xuICB0aGlzLnNlZWQgPSBzZWVkO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5Mb29wU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbkxvb3BTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHZhciByZXN1bHQgPSB0aGlzLnN0ZXAodGhpcy5zZWVkLCB4KTtcbiAgdGhpcy5zZWVkID0gcmVzdWx0LnNlZWQ7XG4gIHRoaXMuc2luay5ldmVudCh0LCByZXN1bHQudmFsdWUpO1xufTtcblxuTG9vcFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0KSB7XG4gIHRoaXMuc2luay5lbmQodCwgdGhpcy5zZWVkKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5tZXJnZSA9IG1lcmdlO1xuZXhwb3J0cy5tZXJnZUFycmF5ID0gbWVyZ2VBcnJheTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9JbmRleFNpbmsgPSByZXF1aXJlKCcuLi9zaW5rL0luZGV4U2luaycpO1xuXG52YXIgX0luZGV4U2luazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9JbmRleFNpbmspO1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKCcuLi9zb3VyY2UvY29yZScpO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxudmFyIGNvcHkgPSBiYXNlLmNvcHk7XG52YXIgcmVkdWNlID0gYmFzZS5yZWR1Y2U7XG5cbi8qKlxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgZXZlbnRzIGZyb20gYWxsIHN0cmVhbXMgaW4gdGhlIGFyZ3VtZW50XG4gKiBsaXN0IGluIHRpbWUgb3JkZXIuICBJZiB0d28gZXZlbnRzIGFyZSBzaW11bHRhbmVvdXMgdGhleSB3aWxsIGJlIG1lcmdlZCBpblxuICogYXJiaXRyYXJ5IG9yZGVyLlxuICovXG5mdW5jdGlvbiBtZXJnZSgpIC8qIC4uLnN0cmVhbXMqL3tcbiAgcmV0dXJuIG1lcmdlQXJyYXkoY29weShhcmd1bWVudHMpKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge0FycmF5fSBzdHJlYW1zIGFycmF5IG9mIHN0cmVhbSB0byBtZXJnZVxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgZXZlbnRzIGZyb20gYWxsIGlucHV0IG9ic2VydmFibGVzXG4gKiBpbiB0aW1lIG9yZGVyLiAgSWYgdHdvIGV2ZW50cyBhcmUgc2ltdWx0YW5lb3VzIHRoZXkgd2lsbCBiZSBtZXJnZWQgaW5cbiAqIGFyYml0cmFyeSBvcmRlci5cbiAqL1xuZnVuY3Rpb24gbWVyZ2VBcnJheShzdHJlYW1zKSB7XG4gIHZhciBsID0gc3RyZWFtcy5sZW5ndGg7XG4gIHJldHVybiBsID09PSAwID8gKDAsIF9jb3JlLmVtcHR5KSgpIDogbCA9PT0gMSA/IHN0cmVhbXNbMF0gOiBuZXcgX1N0cmVhbTIuZGVmYXVsdChtZXJnZVNvdXJjZXMoc3RyZWFtcykpO1xufVxuXG4vKipcbiAqIFRoaXMgaW1wbGVtZW50cyBmdXNpb24vZmxhdHRlbmluZyBmb3IgbWVyZ2UuICBJdCB3aWxsXG4gKiBmdXNlIGFkamFjZW50IG1lcmdlIG9wZXJhdGlvbnMuICBGb3IgZXhhbXBsZTpcbiAqIC0gYS5tZXJnZShiKS5tZXJnZShjKSBlZmZlY3RpdmVseSBiZWNvbWVzIG1lcmdlKGEsIGIsIGMpXG4gKiAtIG1lcmdlKGEsIG1lcmdlKGIsIGMpKSBlZmZlY3RpdmVseSBiZWNvbWVzIG1lcmdlKGEsIGIsIGMpXG4gKiBJdCBkb2VzIHRoaXMgYnkgY29uY2F0ZW5hdGluZyB0aGUgc291cmNlcyBhcnJheXMgb2ZcbiAqIGFueSBuZXN0ZWQgTWVyZ2Ugc291cmNlcywgaW4gZWZmZWN0IFwiZmxhdHRlbmluZ1wiIG5lc3RlZFxuICogbWVyZ2Ugb3BlcmF0aW9ucyBpbnRvIGEgc2luZ2xlIG1lcmdlLlxuICovXG5mdW5jdGlvbiBtZXJnZVNvdXJjZXMoc3RyZWFtcykge1xuICByZXR1cm4gbmV3IE1lcmdlKHJlZHVjZShhcHBlbmRTb3VyY2VzLCBbXSwgc3RyZWFtcykpO1xufVxuXG5mdW5jdGlvbiBhcHBlbmRTb3VyY2VzKHNvdXJjZXMsIHN0cmVhbSkge1xuICB2YXIgc291cmNlID0gc3RyZWFtLnNvdXJjZTtcbiAgcmV0dXJuIHNvdXJjZSBpbnN0YW5jZW9mIE1lcmdlID8gc291cmNlcy5jb25jYXQoc291cmNlLnNvdXJjZXMpIDogc291cmNlcy5jb25jYXQoc291cmNlKTtcbn1cblxuZnVuY3Rpb24gTWVyZ2Uoc291cmNlcykge1xuICB0aGlzLnNvdXJjZXMgPSBzb3VyY2VzO1xufVxuXG5NZXJnZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgbCA9IHRoaXMuc291cmNlcy5sZW5ndGg7XG4gIHZhciBkaXNwb3NhYmxlcyA9IG5ldyBBcnJheShsKTtcbiAgdmFyIHNpbmtzID0gbmV3IEFycmF5KGwpO1xuXG4gIHZhciBtZXJnZVNpbmsgPSBuZXcgTWVyZ2VTaW5rKGRpc3Bvc2FibGVzLCBzaW5rcywgc2luayk7XG5cbiAgZm9yICh2YXIgaW5kZXhTaW5rLCBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGluZGV4U2luayA9IHNpbmtzW2ldID0gbmV3IF9JbmRleFNpbmsyLmRlZmF1bHQoaSwgbWVyZ2VTaW5rKTtcbiAgICBkaXNwb3NhYmxlc1tpXSA9IHRoaXMkMS5zb3VyY2VzW2ldLnJ1bihpbmRleFNpbmssIHNjaGVkdWxlcik7XG4gIH1cblxuICByZXR1cm4gZGlzcG9zZS5hbGwoZGlzcG9zYWJsZXMpO1xufTtcblxuZnVuY3Rpb24gTWVyZ2VTaW5rKGRpc3Bvc2FibGVzLCBzaW5rcywgc2luaykge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmRpc3Bvc2FibGVzID0gZGlzcG9zYWJsZXM7XG4gIHRoaXMuYWN0aXZlQ291bnQgPSBzaW5rcy5sZW5ndGg7XG59XG5cbk1lcmdlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbk1lcmdlU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgaW5kZXhWYWx1ZSkge1xuICB0aGlzLnNpbmsuZXZlbnQodCwgaW5kZXhWYWx1ZS52YWx1ZSk7XG59O1xuXG5NZXJnZVNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCBpbmRleGVkVmFsdWUpIHtcbiAgZGlzcG9zZS50cnlEaXNwb3NlKHQsIHRoaXMuZGlzcG9zYWJsZXNbaW5kZXhlZFZhbHVlLmluZGV4XSwgdGhpcy5zaW5rKTtcbiAgaWYgKC0tdGhpcy5hY3RpdmVDb3VudCA9PT0gMCkge1xuICAgIHRoaXMuc2luay5lbmQodCwgaW5kZXhlZFZhbHVlLnZhbHVlKTtcbiAgfVxufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLm1lcmdlQ29uY3VycmVudGx5ID0gbWVyZ2VDb25jdXJyZW50bHk7XG5leHBvcnRzLm1lcmdlTWFwQ29uY3VycmVudGx5ID0gbWVyZ2VNYXBDb25jdXJyZW50bHk7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9MaW5rZWRMaXN0ID0gcmVxdWlyZSgnLi4vTGlua2VkTGlzdCcpO1xuXG52YXIgX0xpbmtlZExpc3QyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTGlua2VkTGlzdCk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBtZXJnZUNvbmN1cnJlbnRseShjb25jdXJyZW5jeSwgc3RyZWFtKSB7XG4gIHJldHVybiBtZXJnZU1hcENvbmN1cnJlbnRseShfcHJlbHVkZS5pZCwgY29uY3VycmVuY3ksIHN0cmVhbSk7XG59XG5cbmZ1bmN0aW9uIG1lcmdlTWFwQ29uY3VycmVudGx5KGYsIGNvbmN1cnJlbmN5LCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBNZXJnZUNvbmN1cnJlbnRseShmLCBjb25jdXJyZW5jeSwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBNZXJnZUNvbmN1cnJlbnRseShmLCBjb25jdXJyZW5jeSwgc291cmNlKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuY29uY3VycmVuY3kgPSBjb25jdXJyZW5jeTtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cbk1lcmdlQ29uY3VycmVudGx5LnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgT3V0ZXIodGhpcy5mLCB0aGlzLmNvbmN1cnJlbmN5LCB0aGlzLnNvdXJjZSwgc2luaywgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIE91dGVyKGYsIGNvbmN1cnJlbmN5LCBzb3VyY2UsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLmNvbmN1cnJlbmN5ID0gY29uY3VycmVuY3k7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLnBlbmRpbmcgPSBbXTtcbiAgdGhpcy5jdXJyZW50ID0gbmV3IF9MaW5rZWRMaXN0Mi5kZWZhdWx0KCk7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IGRpc3Bvc2Uub25jZShzb3VyY2UucnVuKHRoaXMsIHNjaGVkdWxlcikpO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG59XG5cbk91dGVyLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMuX2FkZElubmVyKHQsIHgpO1xufTtcblxuT3V0ZXIucHJvdG90eXBlLl9hZGRJbm5lciA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICh0aGlzLmN1cnJlbnQubGVuZ3RoIDwgdGhpcy5jb25jdXJyZW5jeSkge1xuICAgIHRoaXMuX3N0YXJ0SW5uZXIodCwgeCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5wZW5kaW5nLnB1c2goeCk7XG4gIH1cbn07XG5cbk91dGVyLnByb3RvdHlwZS5fc3RhcnRJbm5lciA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRyeSB7XG4gICAgdGhpcy5faW5pdElubmVyKHQsIHgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgdGhpcy5lcnJvcih0LCBlKTtcbiAgfVxufTtcblxuT3V0ZXIucHJvdG90eXBlLl9pbml0SW5uZXIgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgaW5uZXJTaW5rID0gbmV3IElubmVyKHQsIHRoaXMsIHRoaXMuc2luayk7XG4gIGlubmVyU2luay5kaXNwb3NhYmxlID0gbWFwQW5kUnVuKHRoaXMuZiwgeCwgaW5uZXJTaW5rLCB0aGlzLnNjaGVkdWxlcik7XG4gIHRoaXMuY3VycmVudC5hZGQoaW5uZXJTaW5rKTtcbn07XG5cbmZ1bmN0aW9uIG1hcEFuZFJ1bihmLCB4LCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIGYoeCkuc291cmNlLnJ1bihzaW5rLCBzY2hlZHVsZXIpO1xufVxuXG5PdXRlci5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgZGlzcG9zZS50cnlEaXNwb3NlKHQsIHRoaXMuZGlzcG9zYWJsZSwgdGhpcy5zaW5rKTtcbiAgdGhpcy5fY2hlY2tFbmQodCwgeCk7XG59O1xuXG5PdXRlci5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB0aGlzLnNpbmsuZXJyb3IodCwgZSk7XG59O1xuXG5PdXRlci5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgdGhpcy5wZW5kaW5nLmxlbmd0aCA9IDA7XG4gIHJldHVybiBQcm9taXNlLmFsbChbdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKSwgdGhpcy5jdXJyZW50LmRpc3Bvc2UoKV0pO1xufTtcblxuT3V0ZXIucHJvdG90eXBlLl9lbmRJbm5lciA9IGZ1bmN0aW9uICh0LCB4LCBpbm5lcikge1xuICB0aGlzLmN1cnJlbnQucmVtb3ZlKGlubmVyKTtcbiAgZGlzcG9zZS50cnlEaXNwb3NlKHQsIGlubmVyLCB0aGlzKTtcblxuICBpZiAodGhpcy5wZW5kaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgIHRoaXMuX2NoZWNrRW5kKHQsIHgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuX3N0YXJ0SW5uZXIodCwgdGhpcy5wZW5kaW5nLnNoaWZ0KCkpO1xuICB9XG59O1xuXG5PdXRlci5wcm90b3R5cGUuX2NoZWNrRW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSAmJiB0aGlzLmN1cnJlbnQuaXNFbXB0eSgpKSB7XG4gICAgdGhpcy5zaW5rLmVuZCh0LCB4KTtcbiAgfVxufTtcblxuZnVuY3Rpb24gSW5uZXIodGltZSwgb3V0ZXIsIHNpbmspIHtcbiAgdGhpcy5wcmV2ID0gdGhpcy5uZXh0ID0gbnVsbDtcbiAgdGhpcy50aW1lID0gdGltZTtcbiAgdGhpcy5vdXRlciA9IG91dGVyO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmRpc3Bvc2FibGUgPSB2b2lkIDA7XG59XG5cbklubmVyLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMuc2luay5ldmVudChNYXRoLm1heCh0LCB0aGlzLnRpbWUpLCB4KTtcbn07XG5cbklubmVyLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0aGlzLm91dGVyLl9lbmRJbm5lcihNYXRoLm1heCh0LCB0aGlzLnRpbWUpLCB4LCB0aGlzKTtcbn07XG5cbklubmVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHRoaXMub3V0ZXIuZXJyb3IoTWF0aC5tYXgodCwgdGhpcy50aW1lKSwgZSk7XG59O1xuXG5Jbm5lci5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMub2JzZXJ2ZSA9IG9ic2VydmU7XG5leHBvcnRzLmRyYWluID0gZHJhaW47XG5cbnZhciBfcnVuU291cmNlID0gcmVxdWlyZSgnLi4vcnVuU291cmNlJyk7XG5cbnZhciBfdHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0nKTtcblxuLyoqXG4gKiBPYnNlcnZlIGFsbCB0aGUgZXZlbnQgdmFsdWVzIGluIHRoZSBzdHJlYW0gaW4gdGltZSBvcmRlci4gVGhlXG4gKiBwcm92aWRlZCBmdW5jdGlvbiBgZmAgd2lsbCBiZSBjYWxsZWQgZm9yIGVhY2ggZXZlbnQgdmFsdWVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDpUKToqfSBmIGZ1bmN0aW9uIHRvIGNhbGwgd2l0aCBlYWNoIGV2ZW50IHZhbHVlXG4gKiBAcGFyYW0ge1N0cmVhbTxUPn0gc3RyZWFtIHN0cmVhbSB0byBvYnNlcnZlXG4gKiBAcmV0dXJuIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgYWZ0ZXIgdGhlIHN0cmVhbSBlbmRzIHdpdGhvdXRcbiAqICBhbiBlcnJvciwgb3IgcmVqZWN0cyBpZiB0aGUgc3RyZWFtIGVuZHMgd2l0aCBhbiBlcnJvci5cbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIG9ic2VydmUoZiwgc3RyZWFtKSB7XG4gIHJldHVybiBkcmFpbigoMCwgX3RyYW5zZm9ybS50YXApKGYsIHN0cmVhbSkpO1xufVxuXG4vKipcbiAqIFwiUnVuXCIgYSBzdHJlYW0gYnkgY3JlYXRpbmcgZGVtYW5kIGFuZCBjb25zdW1pbmcgYWxsIGV2ZW50c1xuICogQHBhcmFtIHtTdHJlYW08VD59IHN0cmVhbSBzdHJlYW0gdG8gZHJhaW5cbiAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBmdWxmaWxscyBhZnRlciB0aGUgc3RyZWFtIGVuZHMgd2l0aG91dFxuICogIGFuIGVycm9yLCBvciByZWplY3RzIGlmIHRoZSBzdHJlYW0gZW5kcyB3aXRoIGFuIGVycm9yLlxuICovXG5mdW5jdGlvbiBkcmFpbihzdHJlYW0pIHtcbiAgcmV0dXJuICgwLCBfcnVuU291cmNlLndpdGhEZWZhdWx0U2NoZWR1bGVyKShzdHJlYW0uc291cmNlKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZyb21Qcm9taXNlID0gZnJvbVByb21pc2U7XG5leHBvcnRzLmF3YWl0UHJvbWlzZXMgPSBhd2FpdFByb21pc2VzO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX2ZhdGFsRXJyb3IgPSByZXF1aXJlKCcuLi9mYXRhbEVycm9yJyk7XG5cbnZhciBfZmF0YWxFcnJvcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9mYXRhbEVycm9yKTtcblxudmFyIF9jb3JlID0gcmVxdWlyZSgnLi4vc291cmNlL2NvcmUnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBDcmVhdGUgYSBzdHJlYW0gY29udGFpbmluZyBvbmx5IHRoZSBwcm9taXNlJ3MgZnVsZmlsbG1lbnRcbiAqIHZhbHVlIGF0IHRoZSB0aW1lIGl0IGZ1bGZpbGxzLlxuICogQHBhcmFtIHtQcm9taXNlPFQ+fSBwIHByb21pc2VcbiAqIEByZXR1cm4ge1N0cmVhbTxUPn0gc3RyZWFtIGNvbnRhaW5pbmcgcHJvbWlzZSdzIGZ1bGZpbGxtZW50IHZhbHVlLlxuICogIElmIHRoZSBwcm9taXNlIHJlamVjdHMsIHRoZSBzdHJlYW0gd2lsbCBlcnJvclxuICovXG5mdW5jdGlvbiBmcm9tUHJvbWlzZShwKSB7XG4gIHJldHVybiBhd2FpdFByb21pc2VzKCgwLCBfY29yZS5vZikocCkpO1xufVxuXG4vKipcbiAqIFR1cm4gYSBTdHJlYW08UHJvbWlzZTxUPj4gaW50byBTdHJlYW08VD4gYnkgYXdhaXRpbmcgZWFjaCBwcm9taXNlLlxuICogRXZlbnQgb3JkZXIgaXMgcHJlc2VydmVkLlxuICogQHBhcmFtIHtTdHJlYW08UHJvbWlzZTxUPj59IHN0cmVhbVxuICogQHJldHVybiB7U3RyZWFtPFQ+fSBzdHJlYW0gb2YgZnVsZmlsbG1lbnQgdmFsdWVzLiAgVGhlIHN0cmVhbSB3aWxsXG4gKiBlcnJvciBpZiBhbnkgcHJvbWlzZSByZWplY3RzLlxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gYXdhaXRQcm9taXNlcyhzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBBd2FpdChzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIEF3YWl0KHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuQXdhaXQucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgQXdhaXRTaW5rKHNpbmssIHNjaGVkdWxlciksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBBd2FpdFNpbmsoc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLnF1ZXVlID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIHZhciBzZWxmID0gdGhpcztcblxuICAvLyBQcmUtY3JlYXRlIGNsb3N1cmVzLCB0byBhdm9pZCBjcmVhdGluZyB0aGVtIHBlciBldmVudFxuICB0aGlzLl9ldmVudEJvdW5kID0gZnVuY3Rpb24gKHgpIHtcbiAgICBzZWxmLnNpbmsuZXZlbnQoc2VsZi5zY2hlZHVsZXIubm93KCksIHgpO1xuICB9O1xuXG4gIHRoaXMuX2VuZEJvdW5kID0gZnVuY3Rpb24gKHgpIHtcbiAgICBzZWxmLnNpbmsuZW5kKHNlbGYuc2NoZWR1bGVyLm5vdygpLCB4KTtcbiAgfTtcblxuICB0aGlzLl9lcnJvckJvdW5kID0gZnVuY3Rpb24gKGUpIHtcbiAgICBzZWxmLnNpbmsuZXJyb3Ioc2VsZi5zY2hlZHVsZXIubm93KCksIGUpO1xuICB9O1xufVxuXG5Bd2FpdFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHByb21pc2UpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc2VsZi5fZXZlbnQocHJvbWlzZSk7XG4gIH0pLmNhdGNoKHRoaXMuX2Vycm9yQm91bmQpO1xufTtcblxuQXdhaXRTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzZWxmLl9lbmQoeCk7XG4gIH0pLmNhdGNoKHRoaXMuX2Vycm9yQm91bmQpO1xufTtcblxuQXdhaXRTaW5rLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgLy8gRG9uJ3QgcmVzb2x2ZSBlcnJvciB2YWx1ZXMsIHByb3BhZ2F0ZSBkaXJlY3RseVxuICB0aGlzLnF1ZXVlID0gdGhpcy5xdWV1ZS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gc2VsZi5fZXJyb3JCb3VuZChlKTtcbiAgfSkuY2F0Y2goX2ZhdGFsRXJyb3IyLmRlZmF1bHQpO1xufTtcblxuQXdhaXRTaW5rLnByb3RvdHlwZS5fZXZlbnQgPSBmdW5jdGlvbiAocHJvbWlzZSkge1xuICByZXR1cm4gcHJvbWlzZS50aGVuKHRoaXMuX2V2ZW50Qm91bmQpO1xufTtcblxuQXdhaXRTaW5rLnByb3RvdHlwZS5fZW5kID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh4KS50aGVuKHRoaXMuX2VuZEJvdW5kKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5zYW1wbGUgPSBzYW1wbGU7XG5leHBvcnRzLnNhbXBsZVdpdGggPSBzYW1wbGVXaXRoO1xuZXhwb3J0cy5zYW1wbGVBcnJheSA9IHNhbXBsZUFycmF5O1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbnZhciBfaW52b2tlID0gcmVxdWlyZSgnLi4vaW52b2tlJyk7XG5cbnZhciBfaW52b2tlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ludm9rZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIFdoZW4gYW4gZXZlbnQgYXJyaXZlcyBvbiBzYW1wbGVyLCBlbWl0IHRoZSByZXN1bHQgb2YgY2FsbGluZyBmIHdpdGggdGhlIGxhdGVzdFxuICogdmFsdWVzIG9mIGFsbCBzdHJlYW1zIGJlaW5nIHNhbXBsZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oLi4udmFsdWVzKToqfSBmIGZ1bmN0aW9uIHRvIGFwcGx5IHRvIGVhY2ggc2V0IG9mIHNhbXBsZWQgdmFsdWVzXG4gKiBAcGFyYW0ge1N0cmVhbX0gc2FtcGxlciBzdHJlYW1zIHdpbGwgYmUgc2FtcGxlZCB3aGVuZXZlciBhbiBldmVudCBhcnJpdmVzXG4gKiAgb24gc2FtcGxlclxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIG9mIHNhbXBsZWQgYW5kIHRyYW5zZm9ybWVkIHZhbHVlc1xuICovXG5mdW5jdGlvbiBzYW1wbGUoZiwgc2FtcGxlciAvKiwgLi4uc3RyZWFtcyAqLykge1xuICByZXR1cm4gc2FtcGxlQXJyYXkoZiwgc2FtcGxlciwgYmFzZS5kcm9wKDIsIGFyZ3VtZW50cykpO1xufVxuXG4vKipcbiAqIFdoZW4gYW4gZXZlbnQgYXJyaXZlcyBvbiBzYW1wbGVyLCBlbWl0IHRoZSBsYXRlc3QgZXZlbnQgdmFsdWUgZnJvbSBzdHJlYW0uXG4gKiBAcGFyYW0ge1N0cmVhbX0gc2FtcGxlciBzdHJlYW0gb2YgZXZlbnRzIGF0IHdob3NlIGFycml2YWwgdGltZVxuICogIHN0cmVhbSdzIGxhdGVzdCB2YWx1ZSB3aWxsIGJlIHByb3BhZ2F0ZWRcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIG9mIHZhbHVlc1xuICogQHJldHVybnMge1N0cmVhbX0gc2FtcGxlZCBzdHJlYW0gb2YgdmFsdWVzXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBzYW1wbGVXaXRoKHNhbXBsZXIsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFNhbXBsZXIoYmFzZS5pZCwgc2FtcGxlci5zb3VyY2UsIFtzdHJlYW0uc291cmNlXSkpO1xufVxuXG5mdW5jdGlvbiBzYW1wbGVBcnJheShmLCBzYW1wbGVyLCBzdHJlYW1zKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgU2FtcGxlcihmLCBzYW1wbGVyLnNvdXJjZSwgYmFzZS5tYXAoZ2V0U291cmNlLCBzdHJlYW1zKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRTb3VyY2Uoc3RyZWFtKSB7XG4gIHJldHVybiBzdHJlYW0uc291cmNlO1xufVxuXG5mdW5jdGlvbiBTYW1wbGVyKGYsIHNhbXBsZXIsIHNvdXJjZXMpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zYW1wbGVyID0gc2FtcGxlcjtcbiAgdGhpcy5zb3VyY2VzID0gc291cmNlcztcbn1cblxuU2FtcGxlci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgbCA9IHRoaXMuc291cmNlcy5sZW5ndGg7XG4gIHZhciBkaXNwb3NhYmxlcyA9IG5ldyBBcnJheShsICsgMSk7XG4gIHZhciBzaW5rcyA9IG5ldyBBcnJheShsKTtcblxuICB2YXIgc2FtcGxlU2luayA9IG5ldyBTYW1wbGVTaW5rKHRoaXMuZiwgc2lua3MsIHNpbmspO1xuXG4gIGZvciAodmFyIGhvbGQsIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgaG9sZCA9IHNpbmtzW2ldID0gbmV3IEhvbGQoc2FtcGxlU2luayk7XG4gICAgZGlzcG9zYWJsZXNbaV0gPSB0aGlzJDEuc291cmNlc1tpXS5ydW4oaG9sZCwgc2NoZWR1bGVyKTtcbiAgfVxuXG4gIGRpc3Bvc2FibGVzW2ldID0gdGhpcy5zYW1wbGVyLnJ1bihzYW1wbGVTaW5rLCBzY2hlZHVsZXIpO1xuXG4gIHJldHVybiBkaXNwb3NlLmFsbChkaXNwb3NhYmxlcyk7XG59O1xuXG5mdW5jdGlvbiBIb2xkKHNpbmspIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5oYXNWYWx1ZSA9IGZhbHNlO1xufVxuXG5Ib2xkLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMudmFsdWUgPSB4O1xuICB0aGlzLmhhc1ZhbHVlID0gdHJ1ZTtcbiAgdGhpcy5zaW5rLl9ub3RpZnkodGhpcyk7XG59O1xuXG5Ib2xkLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAoKSB7fTtcbkhvbGQucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5mdW5jdGlvbiBTYW1wbGVTaW5rKGYsIHNpbmtzLCBzaW5rKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2lua3MgPSBzaW5rcztcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbn1cblxuU2FtcGxlU2luay5wcm90b3R5cGUuX25vdGlmeSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHRoaXMuYWN0aXZlID0gdGhpcy5zaW5rcy5ldmVyeShoYXNWYWx1ZSk7XG4gIH1cbn07XG5cblNhbXBsZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQpIHtcbiAgaWYgKHRoaXMuYWN0aXZlKSB7XG4gICAgdGhpcy5zaW5rLmV2ZW50KHQsICgwLCBfaW52b2tlMi5kZWZhdWx0KSh0aGlzLmYsIGJhc2UubWFwKGdldFZhbHVlLCB0aGlzLnNpbmtzKSkpO1xuICB9XG59O1xuXG5TYW1wbGVTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuU2FtcGxlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbmZ1bmN0aW9uIGhhc1ZhbHVlKGhvbGQpIHtcbiAgcmV0dXJuIGhvbGQuaGFzVmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlKGhvbGQpIHtcbiAgcmV0dXJuIGhvbGQudmFsdWU7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50YWtlID0gdGFrZTtcbmV4cG9ydHMuc2tpcCA9IHNraXA7XG5leHBvcnRzLnNsaWNlID0gc2xpY2U7XG5leHBvcnRzLnRha2VXaGlsZSA9IHRha2VXaGlsZTtcbmV4cG9ydHMuc2tpcFdoaWxlID0gc2tpcFdoaWxlO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKCcuLi9zb3VyY2UvY29yZScpO1xuXG52YXIgY29yZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9jb3JlKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX01hcCA9IHJlcXVpcmUoJy4uL2Z1c2lvbi9NYXAnKTtcblxudmFyIF9NYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTWFwKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBvbmx5IHVwIHRvIHRoZSBmaXJzdCBuIGl0ZW1zIGZyb20gc3RyZWFtXG4gKi9cbmZ1bmN0aW9uIHRha2Uobiwgc3RyZWFtKSB7XG4gIHJldHVybiBzbGljZSgwLCBuLCBzdHJlYW0pO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7bnVtYmVyfSBuXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHdpdGggdGhlIGZpcnN0IG4gaXRlbXMgcmVtb3ZlZFxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gc2tpcChuLCBzdHJlYW0pIHtcbiAgcmV0dXJuIHNsaWNlKG4sIEluZmluaXR5LCBzdHJlYW0pO1xufVxuXG4vKipcbiAqIFNsaWNlIGEgc3RyZWFtIGJ5IGluZGV4LiBOZWdhdGl2ZSBzdGFydC9lbmQgaW5kZXhlcyBhcmUgbm90IHN1cHBvcnRlZFxuICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0XG4gKiBAcGFyYW0ge251bWJlcn0gZW5kXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBpdGVtcyB3aGVyZSBzdGFydCA8PSBpbmRleCA8IGVuZFxuICovXG5mdW5jdGlvbiBzbGljZShzdGFydCwgZW5kLCBzdHJlYW0pIHtcbiAgcmV0dXJuIGVuZCA8PSBzdGFydCA/IGNvcmUuZW1wdHkoKSA6IG5ldyBfU3RyZWFtMi5kZWZhdWx0KHNsaWNlU291cmNlKHN0YXJ0LCBlbmQsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gc2xpY2VTb3VyY2Uoc3RhcnQsIGVuZCwgc291cmNlKSB7XG4gIHJldHVybiBzb3VyY2UgaW5zdGFuY2VvZiBfTWFwMi5kZWZhdWx0ID8gY29tbXV0ZU1hcFNsaWNlKHN0YXJ0LCBlbmQsIHNvdXJjZSkgOiBzb3VyY2UgaW5zdGFuY2VvZiBTbGljZSA/IGZ1c2VTbGljZShzdGFydCwgZW5kLCBzb3VyY2UpIDogbmV3IFNsaWNlKHN0YXJ0LCBlbmQsIHNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIGNvbW11dGVNYXBTbGljZShzdGFydCwgZW5kLCBzb3VyY2UpIHtcbiAgcmV0dXJuIF9NYXAyLmRlZmF1bHQuY3JlYXRlKHNvdXJjZS5mLCBzbGljZVNvdXJjZShzdGFydCwgZW5kLCBzb3VyY2Uuc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIGZ1c2VTbGljZShzdGFydCwgZW5kLCBzb3VyY2UpIHtcbiAgc3RhcnQgKz0gc291cmNlLm1pbjtcbiAgZW5kID0gTWF0aC5taW4oZW5kICsgc291cmNlLm1pbiwgc291cmNlLm1heCk7XG4gIHJldHVybiBuZXcgU2xpY2Uoc3RhcnQsIGVuZCwgc291cmNlLnNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIFNsaWNlKG1pbiwgbWF4LCBzb3VyY2UpIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXMubWluID0gbWluO1xuICB0aGlzLm1heCA9IG1heDtcbn1cblxuU2xpY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBTbGljZVNpbmsodGhpcy5taW4sIHRoaXMubWF4IC0gdGhpcy5taW4sIHRoaXMuc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gU2xpY2VTaW5rKHNraXAsIHRha2UsIHNvdXJjZSwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2tpcCA9IHNraXA7XG4gIHRoaXMudGFrZSA9IHRha2U7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IGRpc3Bvc2Uub25jZShzb3VyY2UucnVuKHRoaXMsIHNjaGVkdWxlcikpO1xufVxuXG5TbGljZVNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5TbGljZVNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5TbGljZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIGlmICh0aGlzLnNraXAgPiAwKSB7XG4gICAgdGhpcy5za2lwIC09IDE7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHRoaXMudGFrZSA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMudGFrZSAtPSAxO1xuICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG4gIGlmICh0aGlzLnRha2UgPT09IDApIHtcbiAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICB0aGlzLnNpbmsuZW5kKHQsIHgpO1xuICB9XG59O1xuXG5TbGljZVNpbmsucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufTtcblxuZnVuY3Rpb24gdGFrZVdoaWxlKHAsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFRha2VXaGlsZShwLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIFRha2VXaGlsZShwLCBzb3VyY2UpIHtcbiAgdGhpcy5wID0gcDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblRha2VXaGlsZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gbmV3IFRha2VXaGlsZVNpbmsodGhpcy5wLCB0aGlzLnNvdXJjZSwgc2luaywgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIFRha2VXaGlsZVNpbmsocCwgc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5wID0gcDtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuICB0aGlzLmRpc3Bvc2FibGUgPSBkaXNwb3NlLm9uY2Uoc291cmNlLnJ1bih0aGlzLCBzY2hlZHVsZXIpKTtcbn1cblxuVGFrZVdoaWxlU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcblRha2VXaGlsZVNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5UYWtlV2hpbGVTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgcCA9IHRoaXMucDtcbiAgdGhpcy5hY3RpdmUgPSBwKHgpO1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5kaXNwb3NlKCk7XG4gICAgdGhpcy5zaW5rLmVuZCh0LCB4KTtcbiAgfVxufTtcblxuVGFrZVdoaWxlU2luay5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG59O1xuXG5mdW5jdGlvbiBza2lwV2hpbGUocCwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgU2tpcFdoaWxlKHAsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gU2tpcFdoaWxlKHAsIHNvdXJjZSkge1xuICB0aGlzLnAgPSBwO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuU2tpcFdoaWxlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IFNraXBXaGlsZVNpbmsodGhpcy5wLCBzaW5rKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIFNraXBXaGlsZVNpbmsocCwgc2luaykge1xuICB0aGlzLnAgPSBwO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnNraXBwaW5nID0gdHJ1ZTtcbn1cblxuU2tpcFdoaWxlU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcblNraXBXaGlsZVNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5Ta2lwV2hpbGVTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICh0aGlzLnNraXBwaW5nKSB7XG4gICAgdmFyIHAgPSB0aGlzLnA7XG4gICAgdGhpcy5za2lwcGluZyA9IHAoeCk7XG4gICAgaWYgKHRoaXMuc2tpcHBpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH1cblxuICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuc3dpdGNoID0gdW5kZWZpbmVkO1xuZXhwb3J0cy5zd2l0Y2hMYXRlc3QgPSBzd2l0Y2hMYXRlc3Q7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogR2l2ZW4gYSBzdHJlYW0gb2Ygc3RyZWFtcywgcmV0dXJuIGEgbmV3IHN0cmVhbSB0aGF0IGFkb3B0cyB0aGUgYmVoYXZpb3JcbiAqIG9mIHRoZSBtb3N0IHJlY2VudCBpbm5lciBzdHJlYW0uXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIG9mIHN0cmVhbXMgb24gd2hpY2ggdG8gc3dpdGNoXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzd2l0Y2hpbmcgc3RyZWFtXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBzd2l0Y2hMYXRlc3Qoc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgU3dpdGNoKHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZXhwb3J0cy5zd2l0Y2ggPSBzd2l0Y2hMYXRlc3Q7XG5cblxuZnVuY3Rpb24gU3dpdGNoKHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuU3dpdGNoLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciBzd2l0Y2hTaW5rID0gbmV3IFN3aXRjaFNpbmsoc2luaywgc2NoZWR1bGVyKTtcbiAgcmV0dXJuIGRpc3Bvc2UuYWxsKFtzd2l0Y2hTaW5rLCB0aGlzLnNvdXJjZS5ydW4oc3dpdGNoU2luaywgc2NoZWR1bGVyKV0pO1xufTtcblxuZnVuY3Rpb24gU3dpdGNoU2luayhzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMuY3VycmVudCA9IG51bGw7XG4gIHRoaXMuZW5kZWQgPSBmYWxzZTtcbn1cblxuU3dpdGNoU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgc3RyZWFtKSB7XG4gIHRoaXMuX2Rpc3Bvc2VDdXJyZW50KHQpOyAvLyBUT0RPOiBjYXB0dXJlIHRoZSByZXN1bHQgb2YgdGhpcyBkaXNwb3NlXG4gIHRoaXMuY3VycmVudCA9IG5ldyBTZWdtZW50KHQsIEluZmluaXR5LCB0aGlzLCB0aGlzLnNpbmspO1xuICB0aGlzLmN1cnJlbnQuZGlzcG9zYWJsZSA9IHN0cmVhbS5zb3VyY2UucnVuKHRoaXMuY3VycmVudCwgdGhpcy5zY2hlZHVsZXIpO1xufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5lbmRlZCA9IHRydWU7XG4gIHRoaXMuX2NoZWNrRW5kKHQsIHgpO1xufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgdGhpcy5zaW5rLmVycm9yKHQsIGUpO1xufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2Rpc3Bvc2VDdXJyZW50KHRoaXMuc2NoZWR1bGVyLm5vdygpKTtcbn07XG5cblN3aXRjaFNpbmsucHJvdG90eXBlLl9kaXNwb3NlQ3VycmVudCA9IGZ1bmN0aW9uICh0KSB7XG4gIGlmICh0aGlzLmN1cnJlbnQgIT09IG51bGwpIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyZW50Ll9kaXNwb3NlKHQpO1xuICB9XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5fZGlzcG9zZUlubmVyID0gZnVuY3Rpb24gKHQsIGlubmVyKSB7XG4gIGlubmVyLl9kaXNwb3NlKHQpOyAvLyBUT0RPOiBjYXB0dXJlIHRoZSByZXN1bHQgb2YgdGhpcyBkaXNwb3NlXG4gIGlmIChpbm5lciA9PT0gdGhpcy5jdXJyZW50KSB7XG4gICAgdGhpcy5jdXJyZW50ID0gbnVsbDtcbiAgfVxufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuX2NoZWNrRW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHRoaXMuZW5kZWQgJiYgdGhpcy5jdXJyZW50ID09PSBudWxsKSB7XG4gICAgdGhpcy5zaW5rLmVuZCh0LCB4KTtcbiAgfVxufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuX2VuZElubmVyID0gZnVuY3Rpb24gKHQsIHgsIGlubmVyKSB7XG4gIHRoaXMuX2Rpc3Bvc2VJbm5lcih0LCBpbm5lcik7XG4gIHRoaXMuX2NoZWNrRW5kKHQsIHgpO1xufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuX2Vycm9ySW5uZXIgPSBmdW5jdGlvbiAodCwgZSwgaW5uZXIpIHtcbiAgdGhpcy5fZGlzcG9zZUlubmVyKHQsIGlubmVyKTtcbiAgdGhpcy5zaW5rLmVycm9yKHQsIGUpO1xufTtcblxuZnVuY3Rpb24gU2VnbWVudChtaW4sIG1heCwgb3V0ZXIsIHNpbmspIHtcbiAgdGhpcy5taW4gPSBtaW47XG4gIHRoaXMubWF4ID0gbWF4O1xuICB0aGlzLm91dGVyID0gb3V0ZXI7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IGRpc3Bvc2UuZW1wdHkoKTtcbn1cblxuU2VnbWVudC5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAodCA8IHRoaXMubWF4KSB7XG4gICAgdGhpcy5zaW5rLmV2ZW50KE1hdGgubWF4KHQsIHRoaXMubWluKSwgeCk7XG4gIH1cbn07XG5cblNlZ21lbnQucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMub3V0ZXIuX2VuZElubmVyKE1hdGgubWF4KHQsIHRoaXMubWluKSwgeCwgdGhpcyk7XG59O1xuXG5TZWdtZW50LnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHRoaXMub3V0ZXIuX2Vycm9ySW5uZXIoTWF0aC5tYXgodCwgdGhpcy5taW4pLCBlLCB0aGlzKTtcbn07XG5cblNlZ21lbnQucHJvdG90eXBlLl9kaXNwb3NlID0gZnVuY3Rpb24gKHQpIHtcbiAgdGhpcy5tYXggPSB0O1xuICBkaXNwb3NlLnRyeURpc3Bvc2UodCwgdGhpcy5kaXNwb3NhYmxlLCB0aGlzLnNpbmspO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudGhydSA9IHRocnU7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gdGhydShmLCBzdHJlYW0pIHtcbiAgcmV0dXJuIGYoc3RyZWFtKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnRha2VVbnRpbCA9IHRha2VVbnRpbDtcbmV4cG9ydHMuc2tpcFVudGlsID0gc2tpcFVudGlsO1xuZXhwb3J0cy5kdXJpbmcgPSBkdXJpbmc7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9mbGF0TWFwID0gcmVxdWlyZSgnLi4vY29tYmluYXRvci9mbGF0TWFwJyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gdGFrZVVudGlsKHNpZ25hbCwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgVW50aWwoc2lnbmFsLnNvdXJjZSwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBza2lwVW50aWwoc2lnbmFsLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBTaW5jZShzaWduYWwuc291cmNlLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIGR1cmluZyh0aW1lV2luZG93LCBzdHJlYW0pIHtcbiAgcmV0dXJuIHRha2VVbnRpbCgoMCwgX2ZsYXRNYXAuam9pbikodGltZVdpbmRvdyksIHNraXBVbnRpbCh0aW1lV2luZG93LCBzdHJlYW0pKTtcbn1cblxuZnVuY3Rpb24gVW50aWwobWF4U2lnbmFsLCBzb3VyY2UpIHtcbiAgdGhpcy5tYXhTaWduYWwgPSBtYXhTaWduYWw7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5VbnRpbC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgbWluID0gbmV3IEJvdW5kKC1JbmZpbml0eSwgc2luayk7XG4gIHZhciBtYXggPSBuZXcgVXBwZXJCb3VuZCh0aGlzLm1heFNpZ25hbCwgc2luaywgc2NoZWR1bGVyKTtcbiAgdmFyIGRpc3Bvc2FibGUgPSB0aGlzLnNvdXJjZS5ydW4obmV3IFRpbWVXaW5kb3dTaW5rKG1pbiwgbWF4LCBzaW5rKSwgc2NoZWR1bGVyKTtcblxuICByZXR1cm4gZGlzcG9zZS5hbGwoW21pbiwgbWF4LCBkaXNwb3NhYmxlXSk7XG59O1xuXG5mdW5jdGlvbiBTaW5jZShtaW5TaWduYWwsIHNvdXJjZSkge1xuICB0aGlzLm1pblNpZ25hbCA9IG1pblNpZ25hbDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblNpbmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciBtaW4gPSBuZXcgTG93ZXJCb3VuZCh0aGlzLm1pblNpZ25hbCwgc2luaywgc2NoZWR1bGVyKTtcbiAgdmFyIG1heCA9IG5ldyBCb3VuZChJbmZpbml0eSwgc2luayk7XG4gIHZhciBkaXNwb3NhYmxlID0gdGhpcy5zb3VyY2UucnVuKG5ldyBUaW1lV2luZG93U2luayhtaW4sIG1heCwgc2luayksIHNjaGVkdWxlcik7XG5cbiAgcmV0dXJuIGRpc3Bvc2UuYWxsKFttaW4sIG1heCwgZGlzcG9zYWJsZV0pO1xufTtcblxuZnVuY3Rpb24gQm91bmQodmFsdWUsIHNpbmspIHtcbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5Cb3VuZC5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5Cb3VuZC5wcm90b3R5cGUuZXZlbnQgPSBub29wO1xuQm91bmQucHJvdG90eXBlLmVuZCA9IG5vb3A7XG5Cb3VuZC5wcm90b3R5cGUuZGlzcG9zZSA9IG5vb3A7XG5cbmZ1bmN0aW9uIFRpbWVXaW5kb3dTaW5rKG1pbiwgbWF4LCBzaW5rKSB7XG4gIHRoaXMubWluID0gbWluO1xuICB0aGlzLm1heCA9IG1heDtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuVGltZVdpbmRvd1NpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHQgPj0gdGhpcy5taW4udmFsdWUgJiYgdCA8IHRoaXMubWF4LnZhbHVlKSB7XG4gICAgdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xuICB9XG59O1xuXG5UaW1lV2luZG93U2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5UaW1lV2luZG93U2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcblxuZnVuY3Rpb24gTG93ZXJCb3VuZChzaWduYWwsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLnZhbHVlID0gSW5maW5pdHk7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IHNpZ25hbC5ydW4odGhpcywgc2NoZWR1bGVyKTtcbn1cblxuTG93ZXJCb3VuZC5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCAvKiwgeCAqLykge1xuICBpZiAodCA8IHRoaXMudmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdDtcbiAgfVxufTtcblxuTG93ZXJCb3VuZC5wcm90b3R5cGUuZW5kID0gbm9vcDtcbkxvd2VyQm91bmQucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5Mb3dlckJvdW5kLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07XG5cbmZ1bmN0aW9uIFVwcGVyQm91bmQoc2lnbmFsLCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy52YWx1ZSA9IEluZmluaXR5O1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmRpc3Bvc2FibGUgPSBzaWduYWwucnVuKHRoaXMsIHNjaGVkdWxlcik7XG59XG5cblVwcGVyQm91bmQucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHQgPCB0aGlzLnZhbHVlKSB7XG4gICAgdGhpcy52YWx1ZSA9IHQ7XG4gICAgdGhpcy5zaW5rLmVuZCh0LCB4KTtcbiAgfVxufTtcblxuVXBwZXJCb3VuZC5wcm90b3R5cGUuZW5kID0gbm9vcDtcblVwcGVyQm91bmQucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5VcHBlckJvdW5kLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudGltZXN0YW1wID0gdGltZXN0YW1wO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gdGltZXN0YW1wKHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFRpbWVzdGFtcChzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIFRpbWVzdGFtcChzb3VyY2UpIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblRpbWVzdGFtcC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gdGhpcy5zb3VyY2UucnVuKG5ldyBUaW1lc3RhbXBTaW5rKHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gVGltZXN0YW1wU2luayhzaW5rKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cblRpbWVzdGFtcFNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5UaW1lc3RhbXBTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuVGltZXN0YW1wU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0aGlzLnNpbmsuZXZlbnQodCwgeyB0aW1lOiB0LCB2YWx1ZTogeCB9KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50cmFuc2R1Y2UgPSB0cmFuc2R1Y2U7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogVHJhbnNmb3JtIGEgc3RyZWFtIGJ5IHBhc3NpbmcgaXRzIGV2ZW50cyB0aHJvdWdoIGEgdHJhbnNkdWNlci5cbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSB0cmFuc2R1Y2VyIHRyYW5zZHVjZXIgZnVuY3Rpb25cbiAqIEBwYXJhbSAge1N0cmVhbX0gc3RyZWFtIHN0cmVhbSB3aG9zZSBldmVudHMgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCB0aGVcbiAqICB0cmFuc2R1Y2VyXG4gKiBAcmV0dXJuIHtTdHJlYW19IHN0cmVhbSBvZiBldmVudHMgdHJhbnNmb3JtZWQgYnkgdGhlIHRyYW5zZHVjZXJcbiAqL1xuZnVuY3Rpb24gdHJhbnNkdWNlKHRyYW5zZHVjZXIsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFRyYW5zZHVjZSh0cmFuc2R1Y2VyLCBzdHJlYW0uc291cmNlKSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBUcmFuc2R1Y2UodHJhbnNkdWNlciwgc291cmNlKSB7XG4gIHRoaXMudHJhbnNkdWNlciA9IHRyYW5zZHVjZXI7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5UcmFuc2R1Y2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIHhmID0gdGhpcy50cmFuc2R1Y2VyKG5ldyBUcmFuc2Zvcm1lcihzaW5rKSk7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IFRyYW5zZHVjZVNpbmsoZ2V0VHhIYW5kbGVyKHhmKSwgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBUcmFuc2R1Y2VTaW5rKGFkYXB0ZXIsIHNpbmspIHtcbiAgdGhpcy54ZiA9IGFkYXB0ZXI7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cblRyYW5zZHVjZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIG5leHQgPSB0aGlzLnhmLnN0ZXAodCwgeCk7XG5cbiAgcmV0dXJuIHRoaXMueGYuaXNSZWR1Y2VkKG5leHQpID8gdGhpcy5zaW5rLmVuZCh0LCB0aGlzLnhmLmdldFJlc3VsdChuZXh0KSkgOiBuZXh0O1xufTtcblxuVHJhbnNkdWNlU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgcmV0dXJuIHRoaXMueGYucmVzdWx0KHgpO1xufTtcblxuVHJhbnNkdWNlU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICByZXR1cm4gdGhpcy5zaW5rLmVycm9yKHQsIGUpO1xufTtcblxuZnVuY3Rpb24gVHJhbnNmb3JtZXIoc2luaykge1xuICB0aGlzLnRpbWUgPSAtSW5maW5pdHk7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cblRyYW5zZm9ybWVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL2luaXQnXSA9IFRyYW5zZm9ybWVyLnByb3RvdHlwZS5pbml0ID0gZnVuY3Rpb24gKCkge307XG5cblRyYW5zZm9ybWVyLnByb3RvdHlwZVsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9IFRyYW5zZm9ybWVyLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCFpc05hTih0KSkge1xuICAgIHRoaXMudGltZSA9IE1hdGgubWF4KHQsIHRoaXMudGltZSk7XG4gIH1cbiAgcmV0dXJuIHRoaXMuc2luay5ldmVudCh0aGlzLnRpbWUsIHgpO1xufTtcblxuVHJhbnNmb3JtZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvcmVzdWx0J10gPSBUcmFuc2Zvcm1lci5wcm90b3R5cGUucmVzdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIHRoaXMuc2luay5lbmQodGhpcy50aW1lLCB4KTtcbn07XG5cbi8qKlxuKiBHaXZlbiBhbiBvYmplY3Qgc3VwcG9ydGluZyB0aGUgbmV3IG9yIGxlZ2FjeSB0cmFuc2R1Y2VyIHByb3RvY29sLFxuKiBjcmVhdGUgYW4gYWRhcHRlciBmb3IgaXQuXG4qIEBwYXJhbSB7b2JqZWN0fSB0eCB0cmFuc2Zvcm1cbiogQHJldHVybnMge1R4QWRhcHRlcnxMZWdhY3lUeEFkYXB0ZXJ9XG4qL1xuZnVuY3Rpb24gZ2V0VHhIYW5kbGVyKHR4KSB7XG4gIHJldHVybiB0eXBlb2YgdHhbJ0BAdHJhbnNkdWNlci9zdGVwJ10gPT09ICdmdW5jdGlvbicgPyBuZXcgVHhBZGFwdGVyKHR4KSA6IG5ldyBMZWdhY3lUeEFkYXB0ZXIodHgpO1xufVxuXG4vKipcbiogQWRhcHRlciBmb3IgbmV3IG9mZmljaWFsIHRyYW5zZHVjZXIgcHJvdG9jb2xcbiogQHBhcmFtIHtvYmplY3R9IHR4IHRyYW5zZm9ybVxuKiBAY29uc3RydWN0b3JcbiovXG5mdW5jdGlvbiBUeEFkYXB0ZXIodHgpIHtcbiAgdGhpcy50eCA9IHR4O1xufVxuXG5UeEFkYXB0ZXIucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiAodCwgeCkge1xuICByZXR1cm4gdGhpcy50eFsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSh0LCB4KTtcbn07XG5UeEFkYXB0ZXIucHJvdG90eXBlLnJlc3VsdCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiB0aGlzLnR4WydAQHRyYW5zZHVjZXIvcmVzdWx0J10oeCk7XG59O1xuVHhBZGFwdGVyLnByb3RvdHlwZS5pc1JlZHVjZWQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4geCAhPSBudWxsICYmIHhbJ0BAdHJhbnNkdWNlci9yZWR1Y2VkJ107XG59O1xuVHhBZGFwdGVyLnByb3RvdHlwZS5nZXRSZXN1bHQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4geFsnQEB0cmFuc2R1Y2VyL3ZhbHVlJ107XG59O1xuXG4vKipcbiogQWRhcHRlciBmb3Igb2xkZXIgdHJhbnNkdWNlciBwcm90b2NvbFxuKiBAcGFyYW0ge29iamVjdH0gdHggdHJhbnNmb3JtXG4qIEBjb25zdHJ1Y3RvclxuKi9cbmZ1bmN0aW9uIExlZ2FjeVR4QWRhcHRlcih0eCkge1xuICB0aGlzLnR4ID0gdHg7XG59XG5cbkxlZ2FjeVR4QWRhcHRlci5wcm90b3R5cGUuc3RlcCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHJldHVybiB0aGlzLnR4LnN0ZXAodCwgeCk7XG59O1xuTGVnYWN5VHhBZGFwdGVyLnByb3RvdHlwZS5yZXN1bHQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gdGhpcy50eC5yZXN1bHQoeCk7XG59O1xuTGVnYWN5VHhBZGFwdGVyLnByb3RvdHlwZS5pc1JlZHVjZWQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4geCAhPSBudWxsICYmIHguX190cmFuc2R1Y2Vyc19yZWR1Y2VkX187XG59O1xuTGVnYWN5VHhBZGFwdGVyLnByb3RvdHlwZS5nZXRSZXN1bHQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4geC52YWx1ZTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5tYXAgPSBtYXA7XG5leHBvcnRzLmNvbnN0YW50ID0gY29uc3RhbnQ7XG5leHBvcnRzLnRhcCA9IHRhcDtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9NYXAgPSByZXF1aXJlKCcuLi9mdXNpb24vTWFwJyk7XG5cbnZhciBfTWFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX01hcCk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogVHJhbnNmb3JtIGVhY2ggdmFsdWUgaW4gdGhlIHN0cmVhbSBieSBhcHBseWluZyBmIHRvIGVhY2hcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKik6Kn0gZiBtYXBwaW5nIGZ1bmN0aW9uXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtIHN0cmVhbSB0byBtYXBcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGl0ZW1zIHRyYW5zZm9ybWVkIGJ5IGZcbiAqL1xuZnVuY3Rpb24gbWFwKGYsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQoX01hcDIuZGVmYXVsdC5jcmVhdGUoZiwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG4vKipcbiogUmVwbGFjZSBlYWNoIHZhbHVlIGluIHRoZSBzdHJlYW0gd2l0aCB4XG4qIEBwYXJhbSB7Kn0geFxuKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4qIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGl0ZW1zIHJlcGxhY2VkIHdpdGggeFxuKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBjb25zdGFudCh4LCBzdHJlYW0pIHtcbiAgcmV0dXJuIG1hcChmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHg7XG4gIH0sIHN0cmVhbSk7XG59XG5cbi8qKlxuKiBQZXJmb3JtIGEgc2lkZSBlZmZlY3QgZm9yIGVhY2ggaXRlbSBpbiB0aGUgc3RyZWFtXG4qIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKToqfSBmIHNpZGUgZWZmZWN0IHRvIGV4ZWN1dGUgZm9yIGVhY2ggaXRlbS4gVGhlXG4qICByZXR1cm4gdmFsdWUgd2lsbCBiZSBkaXNjYXJkZWQuXG4qIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIHRvIHRhcFxuKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHNhbWUgaXRlbXMgYXMgdGhpcyBzdHJlYW1cbiovXG5mdW5jdGlvbiB0YXAoZiwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgVGFwKGYsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gVGFwKGYsIHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgdGhpcy5mID0gZjtcbn1cblxuVGFwLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IFRhcFNpbmsodGhpcy5mLCBzaW5rKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIFRhcFNpbmsoZiwgc2luaykge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmYgPSBmO1xufVxuXG5UYXBTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuVGFwU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cblRhcFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIGYgPSB0aGlzLmY7XG4gIGYoeCk7XG4gIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy56aXAgPSB6aXA7XG5leHBvcnRzLnppcEFycmF5ID0gemlwQXJyYXk7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfdHJhbnNmb3JtID0gcmVxdWlyZSgnLi90cmFuc2Zvcm0nKTtcblxudmFyIHRyYW5zZm9ybSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF90cmFuc2Zvcm0pO1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKCcuLi9zb3VyY2UvY29yZScpO1xuXG52YXIgY29yZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9jb3JlKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9JbmRleFNpbmsgPSByZXF1aXJlKCcuLi9zaW5rL0luZGV4U2luaycpO1xuXG52YXIgX0luZGV4U2luazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9JbmRleFNpbmspO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbnZhciBfaW52b2tlID0gcmVxdWlyZSgnLi4vaW52b2tlJyk7XG5cbnZhciBfaW52b2tlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ludm9rZSk7XG5cbnZhciBfUXVldWUgPSByZXF1aXJlKCcuLi9RdWV1ZScpO1xuXG52YXIgX1F1ZXVlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1F1ZXVlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciBtYXAgPSBiYXNlLm1hcDsgLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbnZhciB0YWlsID0gYmFzZS50YWlsO1xuXG4vKipcbiAqIENvbWJpbmUgc3RyZWFtcyBwYWlyd2lzZSAob3IgdHVwbGUtd2lzZSkgYnkgaW5kZXggYnkgYXBwbHlpbmcgZiB0byB2YWx1ZXNcbiAqIGF0IGNvcnJlc3BvbmRpbmcgaW5kaWNlcy4gIFRoZSByZXR1cm5lZCBzdHJlYW0gZW5kcyB3aGVuIGFueSBvZiB0aGUgaW5wdXRcbiAqIHN0cmVhbXMgZW5kcy5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGYgZnVuY3Rpb24gdG8gY29tYmluZSB2YWx1ZXNcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gd2l0aCBpdGVtcyBhdCBjb3JyZXNwb25kaW5nIGluZGljZXMgY29tYmluZWRcbiAqICB1c2luZyBmXG4gKi9cbmZ1bmN0aW9uIHppcChmIC8qLCAuLi5zdHJlYW1zICovKSB7XG4gIHJldHVybiB6aXBBcnJheShmLCB0YWlsKGFyZ3VtZW50cykpO1xufVxuXG4vKipcbiogQ29tYmluZSBzdHJlYW1zIHBhaXJ3aXNlIChvciB0dXBsZS13aXNlKSBieSBpbmRleCBieSBhcHBseWluZyBmIHRvIHZhbHVlc1xuKiBhdCBjb3JyZXNwb25kaW5nIGluZGljZXMuICBUaGUgcmV0dXJuZWQgc3RyZWFtIGVuZHMgd2hlbiBhbnkgb2YgdGhlIGlucHV0XG4qIHN0cmVhbXMgZW5kcy5cbiogQHBhcmFtIHtmdW5jdGlvbn0gZiBmdW5jdGlvbiB0byBjb21iaW5lIHZhbHVlc1xuKiBAcGFyYW0ge1tTdHJlYW1dfSBzdHJlYW1zIHN0cmVhbXMgdG8gemlwIHVzaW5nIGZcbiogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aXRoIGl0ZW1zIGF0IGNvcnJlc3BvbmRpbmcgaW5kaWNlcyBjb21iaW5lZFxuKiAgdXNpbmcgZlxuKi9cbmZ1bmN0aW9uIHppcEFycmF5KGYsIHN0cmVhbXMpIHtcbiAgcmV0dXJuIHN0cmVhbXMubGVuZ3RoID09PSAwID8gY29yZS5lbXB0eSgpIDogc3RyZWFtcy5sZW5ndGggPT09IDEgPyB0cmFuc2Zvcm0ubWFwKGYsIHN0cmVhbXNbMF0pIDogbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFppcChmLCBtYXAoZ2V0U291cmNlLCBzdHJlYW1zKSkpO1xufVxuXG5mdW5jdGlvbiBnZXRTb3VyY2Uoc3RyZWFtKSB7XG4gIHJldHVybiBzdHJlYW0uc291cmNlO1xufVxuXG5mdW5jdGlvbiBaaXAoZiwgc291cmNlcykge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNvdXJjZXMgPSBzb3VyY2VzO1xufVxuXG5aaXAucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgdmFyIGwgPSB0aGlzLnNvdXJjZXMubGVuZ3RoO1xuICB2YXIgZGlzcG9zYWJsZXMgPSBuZXcgQXJyYXkobCk7XG4gIHZhciBzaW5rcyA9IG5ldyBBcnJheShsKTtcbiAgdmFyIGJ1ZmZlcnMgPSBuZXcgQXJyYXkobCk7XG5cbiAgdmFyIHppcFNpbmsgPSBuZXcgWmlwU2luayh0aGlzLmYsIGJ1ZmZlcnMsIHNpbmtzLCBzaW5rKTtcblxuICBmb3IgKHZhciBpbmRleFNpbmssIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgYnVmZmVyc1tpXSA9IG5ldyBfUXVldWUyLmRlZmF1bHQoKTtcbiAgICBpbmRleFNpbmsgPSBzaW5rc1tpXSA9IG5ldyBfSW5kZXhTaW5rMi5kZWZhdWx0KGksIHppcFNpbmspO1xuICAgIGRpc3Bvc2FibGVzW2ldID0gdGhpcyQxLnNvdXJjZXNbaV0ucnVuKGluZGV4U2luaywgc2NoZWR1bGVyKTtcbiAgfVxuXG4gIHJldHVybiBkaXNwb3NlLmFsbChkaXNwb3NhYmxlcyk7XG59O1xuXG5mdW5jdGlvbiBaaXBTaW5rKGYsIGJ1ZmZlcnMsIHNpbmtzLCBzaW5rKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2lua3MgPSBzaW5rcztcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5idWZmZXJzID0gYnVmZmVycztcbn1cblxuWmlwU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgaW5kZXhlZFZhbHVlKSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICB2YXIgYnVmZmVycyA9IHRoaXMuYnVmZmVycztcbiAgdmFyIGJ1ZmZlciA9IGJ1ZmZlcnNbaW5kZXhlZFZhbHVlLmluZGV4XTtcblxuICBidWZmZXIucHVzaChpbmRleGVkVmFsdWUudmFsdWUpO1xuXG4gIGlmIChidWZmZXIubGVuZ3RoKCkgPT09IDEpIHtcbiAgICBpZiAoIXJlYWR5KHRoaXMuYnVmZmVycykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBlbWl0WmlwcGVkKHRoaXMuZiwgdCwgYnVmZmVycywgdGhpcy5zaW5rKTtcblxuICAgIGlmIChlbmRlZCh0aGlzLmJ1ZmZlcnMsIHRoaXMuc2lua3MpKSB7XG4gICAgICB0aGlzLnNpbmsuZW5kKHQsIHZvaWQgMCk7XG4gICAgfVxuICB9XG59O1xuXG5aaXBTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgaW5kZXhlZFZhbHVlKSB7XG4gIHZhciBidWZmZXIgPSB0aGlzLmJ1ZmZlcnNbaW5kZXhlZFZhbHVlLmluZGV4XTtcbiAgaWYgKGJ1ZmZlci5pc0VtcHR5KCkpIHtcbiAgICB0aGlzLnNpbmsuZW5kKHQsIGluZGV4ZWRWYWx1ZS52YWx1ZSk7XG4gIH1cbn07XG5cblppcFNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5mdW5jdGlvbiBlbWl0WmlwcGVkKGYsIHQsIGJ1ZmZlcnMsIHNpbmspIHtcbiAgc2luay5ldmVudCh0LCAoMCwgX2ludm9rZTIuZGVmYXVsdCkoZiwgbWFwKGhlYWQsIGJ1ZmZlcnMpKSk7XG59XG5cbmZ1bmN0aW9uIGhlYWQoYnVmZmVyKSB7XG4gIHJldHVybiBidWZmZXIuc2hpZnQoKTtcbn1cblxuZnVuY3Rpb24gZW5kZWQoYnVmZmVycywgc2lua3MpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBidWZmZXJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChidWZmZXJzW2ldLmlzRW1wdHkoKSAmJiAhc2lua3NbaV0uYWN0aXZlKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZWFkeShidWZmZXJzKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gYnVmZmVycy5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoYnVmZmVyc1tpXS5pc0VtcHR5KCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBEaXNwb3NhYmxlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IERpc3Bvc2FibGUgd2hpY2ggd2lsbCBkaXNwb3NlIGl0cyB1bmRlcmx5aW5nIHJlc291cmNlLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZGlzcG9zZSBmdW5jdGlvblxuICogQHBhcmFtIHsqP30gZGF0YSBhbnkgZGF0YSB0byBiZSBwYXNzZWQgdG8gZGlzcG9zZXIgZnVuY3Rpb25cbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBEaXNwb3NhYmxlKGRpc3Bvc2UsIGRhdGEpIHtcbiAgdGhpcy5fZGlzcG9zZSA9IGRpc3Bvc2U7XG4gIHRoaXMuX2RhdGEgPSBkYXRhO1xufVxuXG5EaXNwb3NhYmxlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fZGlzcG9zZSh0aGlzLl9kYXRhKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU2V0dGFibGVEaXNwb3NhYmxlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFNldHRhYmxlRGlzcG9zYWJsZSgpIHtcbiAgdGhpcy5kaXNwb3NhYmxlID0gdm9pZCAwO1xuICB0aGlzLmRpc3Bvc2VkID0gZmFsc2U7XG4gIHRoaXMuX3Jlc29sdmUgPSB2b2lkIDA7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICB0aGlzLnJlc3VsdCA9IG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlKSB7XG4gICAgc2VsZi5fcmVzb2x2ZSA9IHJlc29sdmU7XG4gIH0pO1xufVxuXG5TZXR0YWJsZURpc3Bvc2FibGUucHJvdG90eXBlLnNldERpc3Bvc2FibGUgPSBmdW5jdGlvbiAoZGlzcG9zYWJsZSkge1xuICBpZiAodGhpcy5kaXNwb3NhYmxlICE9PSB2b2lkIDApIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldERpc3Bvc2FibGUgY2FsbGVkIG1vcmUgdGhhbiBvbmNlJyk7XG4gIH1cblxuICB0aGlzLmRpc3Bvc2FibGUgPSBkaXNwb3NhYmxlO1xuXG4gIGlmICh0aGlzLmRpc3Bvc2VkKSB7XG4gICAgdGhpcy5fcmVzb2x2ZShkaXNwb3NhYmxlLmRpc3Bvc2UoKSk7XG4gIH1cbn07XG5cblNldHRhYmxlRGlzcG9zYWJsZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMuZGlzcG9zZWQpIHtcbiAgICByZXR1cm4gdGhpcy5yZXN1bHQ7XG4gIH1cblxuICB0aGlzLmRpc3Bvc2VkID0gdHJ1ZTtcblxuICBpZiAodGhpcy5kaXNwb3NhYmxlICE9PSB2b2lkIDApIHtcbiAgICB0aGlzLnJlc3VsdCA9IHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gIH1cblxuICByZXR1cm4gdGhpcy5yZXN1bHQ7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudHJ5RGlzcG9zZSA9IHRyeURpc3Bvc2U7XG5leHBvcnRzLmNyZWF0ZSA9IGNyZWF0ZTtcbmV4cG9ydHMuZW1wdHkgPSBlbXB0eTtcbmV4cG9ydHMuYWxsID0gYWxsO1xuZXhwb3J0cy5wcm9taXNlZCA9IHByb21pc2VkO1xuZXhwb3J0cy5zZXR0YWJsZSA9IHNldHRhYmxlO1xuZXhwb3J0cy5vbmNlID0gb25jZTtcblxudmFyIF9EaXNwb3NhYmxlID0gcmVxdWlyZSgnLi9EaXNwb3NhYmxlJyk7XG5cbnZhciBfRGlzcG9zYWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9EaXNwb3NhYmxlKTtcblxudmFyIF9TZXR0YWJsZURpc3Bvc2FibGUgPSByZXF1aXJlKCcuL1NldHRhYmxlRGlzcG9zYWJsZScpO1xuXG52YXIgX1NldHRhYmxlRGlzcG9zYWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TZXR0YWJsZURpc3Bvc2FibGUpO1xuXG52YXIgX1Byb21pc2UgPSByZXF1aXJlKCcuLi9Qcm9taXNlJyk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cbnZhciBtYXAgPSBiYXNlLm1hcDtcbnZhciBpZGVudGl0eSA9IGJhc2UuaWQ7XG5cbi8qKlxuICogQ2FsbCBkaXNwb3NhYmxlLmRpc3Bvc2UuICBJZiBpdCByZXR1cm5zIGEgcHJvbWlzZSwgY2F0Y2ggcHJvbWlzZVxuICogZXJyb3IgYW5kIGZvcndhcmQgaXQgdGhyb3VnaCB0aGUgcHJvdmlkZWQgc2luay5cbiAqIEBwYXJhbSB7bnVtYmVyfSB0IHRpbWVcbiAqIEBwYXJhbSB7e2Rpc3Bvc2U6IGZ1bmN0aW9ufX0gZGlzcG9zYWJsZVxuICogQHBhcmFtIHt7ZXJyb3I6IGZ1bmN0aW9ufX0gc2lua1xuICogQHJldHVybiB7Kn0gcmVzdWx0IG9mIGRpc3Bvc2FibGUuZGlzcG9zZVxuICovXG5mdW5jdGlvbiB0cnlEaXNwb3NlKHQsIGRpc3Bvc2FibGUsIHNpbmspIHtcbiAgdmFyIHJlc3VsdCA9IGRpc3Bvc2VTYWZlbHkoZGlzcG9zYWJsZSk7XG4gIHJldHVybiAoMCwgX1Byb21pc2UuaXNQcm9taXNlKShyZXN1bHQpID8gcmVzdWx0LmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgc2luay5lcnJvcih0LCBlKTtcbiAgfSkgOiByZXN1bHQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IERpc3Bvc2FibGUgd2hpY2ggd2lsbCBkaXNwb3NlIGl0cyB1bmRlcmx5aW5nIHJlc291cmNlXG4gKiBhdCBtb3N0IG9uY2UuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBkaXNwb3NlIGZ1bmN0aW9uXG4gKiBAcGFyYW0geyo/fSBkYXRhIGFueSBkYXRhIHRvIGJlIHBhc3NlZCB0byBkaXNwb3NlciBmdW5jdGlvblxuICogQHJldHVybiB7RGlzcG9zYWJsZX1cbiAqL1xuZnVuY3Rpb24gY3JlYXRlKGRpc3Bvc2UsIGRhdGEpIHtcbiAgcmV0dXJuIG9uY2UobmV3IF9EaXNwb3NhYmxlMi5kZWZhdWx0KGRpc3Bvc2UsIGRhdGEpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBub29wIGRpc3Bvc2FibGUuIENhbiBiZSB1c2VkIHRvIHNhdGlzZnkgYSBEaXNwb3NhYmxlXG4gKiByZXF1aXJlbWVudCB3aGVuIG5vIGFjdHVhbCByZXNvdXJjZSBuZWVkcyB0byBiZSBkaXNwb3NlZC5cbiAqIEByZXR1cm4ge0Rpc3Bvc2FibGV8ZXhwb3J0c3xtb2R1bGUuZXhwb3J0c31cbiAqL1xuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBuZXcgX0Rpc3Bvc2FibGUyLmRlZmF1bHQoaWRlbnRpdHksIHZvaWQgMCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGlzcG9zYWJsZSB0aGF0IHdpbGwgZGlzcG9zZSBhbGwgaW5wdXQgZGlzcG9zYWJsZXMgaW4gcGFyYWxsZWwuXG4gKiBAcGFyYW0ge0FycmF5PERpc3Bvc2FibGU+fSBkaXNwb3NhYmxlc1xuICogQHJldHVybiB7RGlzcG9zYWJsZX1cbiAqL1xuZnVuY3Rpb24gYWxsKGRpc3Bvc2FibGVzKSB7XG4gIHJldHVybiBjcmVhdGUoZGlzcG9zZUFsbCwgZGlzcG9zYWJsZXMpO1xufVxuXG5mdW5jdGlvbiBkaXNwb3NlQWxsKGRpc3Bvc2FibGVzKSB7XG4gIHJldHVybiBQcm9taXNlLmFsbChtYXAoZGlzcG9zZVNhZmVseSwgZGlzcG9zYWJsZXMpKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZVNhZmVseShkaXNwb3NhYmxlKSB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGUpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGlzcG9zYWJsZSBmcm9tIGEgcHJvbWlzZSBmb3IgYW5vdGhlciBkaXNwb3NhYmxlXG4gKiBAcGFyYW0ge1Byb21pc2U8RGlzcG9zYWJsZT59IGRpc3Bvc2FibGVQcm9taXNlXG4gKiBAcmV0dXJuIHtEaXNwb3NhYmxlfVxuICovXG5mdW5jdGlvbiBwcm9taXNlZChkaXNwb3NhYmxlUHJvbWlzZSkge1xuICByZXR1cm4gY3JlYXRlKGRpc3Bvc2VQcm9taXNlLCBkaXNwb3NhYmxlUHJvbWlzZSk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VQcm9taXNlKGRpc3Bvc2FibGVQcm9taXNlKSB7XG4gIHJldHVybiBkaXNwb3NhYmxlUHJvbWlzZS50aGVuKGRpc3Bvc2VPbmUpO1xufVxuXG5mdW5jdGlvbiBkaXNwb3NlT25lKGRpc3Bvc2FibGUpIHtcbiAgcmV0dXJuIGRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGRpc3Bvc2FibGUgcHJveHkgdGhhdCBhbGxvd3MgaXRzIHVuZGVybHlpbmcgZGlzcG9zYWJsZSB0b1xuICogYmUgc2V0IGxhdGVyLlxuICogQHJldHVybiB7U2V0dGFibGVEaXNwb3NhYmxlfVxuICovXG5mdW5jdGlvbiBzZXR0YWJsZSgpIHtcbiAgcmV0dXJuIG5ldyBfU2V0dGFibGVEaXNwb3NhYmxlMi5kZWZhdWx0KCk7XG59XG5cbi8qKlxuICogV3JhcCBhbiBleGlzdGluZyBkaXNwb3NhYmxlICh3aGljaCBtYXkgbm90IGFscmVhZHkgaGF2ZSBiZWVuIG9uY2UoKWQpXG4gKiBzbyB0aGF0IGl0IHdpbGwgb25seSBkaXNwb3NlIGl0cyB1bmRlcmx5aW5nIHJlc291cmNlIGF0IG1vc3Qgb25jZS5cbiAqIEBwYXJhbSB7eyBkaXNwb3NlOiBmdW5jdGlvbigpIH19IGRpc3Bvc2FibGVcbiAqIEByZXR1cm4ge0Rpc3Bvc2FibGV9IHdyYXBwZWQgZGlzcG9zYWJsZVxuICovXG5mdW5jdGlvbiBvbmNlKGRpc3Bvc2FibGUpIHtcbiAgcmV0dXJuIG5ldyBfRGlzcG9zYWJsZTIuZGVmYXVsdChkaXNwb3NlTWVtb2l6ZWQsIG1lbW9pemVkKGRpc3Bvc2FibGUpKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZU1lbW9pemVkKG1lbW9pemVkKSB7XG4gIGlmICghbWVtb2l6ZWQuZGlzcG9zZWQpIHtcbiAgICBtZW1vaXplZC5kaXNwb3NlZCA9IHRydWU7XG4gICAgbWVtb2l6ZWQudmFsdWUgPSBkaXNwb3NlU2FmZWx5KG1lbW9pemVkLmRpc3Bvc2FibGUpO1xuICAgIG1lbW9pemVkLmRpc3Bvc2FibGUgPSB2b2lkIDA7XG4gIH1cblxuICByZXR1cm4gbWVtb2l6ZWQudmFsdWU7XG59XG5cbmZ1bmN0aW9uIG1lbW9pemVkKGRpc3Bvc2FibGUpIHtcbiAgcmV0dXJuIHsgZGlzcG9zZWQ6IGZhbHNlLCBkaXNwb3NhYmxlOiBkaXNwb3NhYmxlLCB2YWx1ZTogdm9pZCAwIH07XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBmYXRhbEVycm9yO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGZhdGFsRXJyb3IoZSkge1xuICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICB0aHJvdyBlO1xuICB9LCAwKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBGaWx0ZXI7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIEZpbHRlcihwLCBzb3VyY2UpIHtcbiAgdGhpcy5wID0gcDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZmlsdGVyZWQgc291cmNlLCBmdXNpbmcgYWRqYWNlbnQgZmlsdGVyLmZpbHRlciBpZiBwb3NzaWJsZVxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOmJvb2xlYW59IHAgZmlsdGVyaW5nIHByZWRpY2F0ZVxuICogQHBhcmFtIHt7cnVuOmZ1bmN0aW9ufX0gc291cmNlIHNvdXJjZSB0byBmaWx0ZXJcbiAqIEByZXR1cm5zIHtGaWx0ZXJ9IGZpbHRlcmVkIHNvdXJjZVxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuRmlsdGVyLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZUZpbHRlcihwLCBzb3VyY2UpIHtcbiAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIEZpbHRlcikge1xuICAgIHJldHVybiBuZXcgRmlsdGVyKGFuZChzb3VyY2UucCwgcCksIHNvdXJjZS5zb3VyY2UpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBGaWx0ZXIocCwgc291cmNlKTtcbn07XG5cbkZpbHRlci5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gdGhpcy5zb3VyY2UucnVuKG5ldyBGaWx0ZXJTaW5rKHRoaXMucCwgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBGaWx0ZXJTaW5rKHAsIHNpbmspIHtcbiAgdGhpcy5wID0gcDtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuRmlsdGVyU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcbkZpbHRlclNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5GaWx0ZXJTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHZhciBwID0gdGhpcy5wO1xuICBwKHgpICYmIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbn07XG5cbmZ1bmN0aW9uIGFuZChwLCBxKSB7XG4gIHJldHVybiBmdW5jdGlvbiAoeCkge1xuICAgIHJldHVybiBwKHgpICYmIHEoeCk7XG4gIH07XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRmlsdGVyTWFwO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBGaWx0ZXJNYXAocCwgZiwgc291cmNlKSB7XG4gIHRoaXMucCA9IHA7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuRmlsdGVyTWFwLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IEZpbHRlck1hcFNpbmsodGhpcy5wLCB0aGlzLmYsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gRmlsdGVyTWFwU2luayhwLCBmLCBzaW5rKSB7XG4gIHRoaXMucCA9IHA7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cbkZpbHRlck1hcFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIGYgPSB0aGlzLmY7XG4gIHZhciBwID0gdGhpcy5wO1xuICBwKHgpICYmIHRoaXMuc2luay5ldmVudCh0LCBmKHgpKTtcbn07XG5cbkZpbHRlck1hcFNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5GaWx0ZXJNYXBTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBNYXA7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfRmlsdGVyID0gcmVxdWlyZSgnLi9GaWx0ZXInKTtcblxudmFyIF9GaWx0ZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfRmlsdGVyKTtcblxudmFyIF9GaWx0ZXJNYXAgPSByZXF1aXJlKCcuL0ZpbHRlck1hcCcpO1xuXG52YXIgX0ZpbHRlck1hcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9GaWx0ZXJNYXApO1xuXG52YXIgX3ByZWx1ZGUgPSByZXF1aXJlKCdAbW9zdC9wcmVsdWRlJyk7XG5cbnZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3ByZWx1ZGUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIE1hcChmLCBzb3VyY2UpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbWFwcGVkIHNvdXJjZSwgZnVzaW5nIGFkamFjZW50IG1hcC5tYXAsIGZpbHRlci5tYXAsXG4gKiBhbmQgZmlsdGVyLm1hcC5tYXAgaWYgcG9zc2libGVcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKik6Kn0gZiBtYXBwaW5nIGZ1bmN0aW9uXG4gKiBAcGFyYW0ge3tydW46ZnVuY3Rpb259fSBzb3VyY2Ugc291cmNlIHRvIG1hcFxuICogQHJldHVybnMge01hcHxGaWx0ZXJNYXB9IG1hcHBlZCBzb3VyY2UsIHBvc3NpYmx5IGZ1c2VkXG4gKi9cbk1hcC5jcmVhdGUgPSBmdW5jdGlvbiBjcmVhdGVNYXAoZiwgc291cmNlKSB7XG4gIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBNYXApIHtcbiAgICByZXR1cm4gbmV3IE1hcChiYXNlLmNvbXBvc2UoZiwgc291cmNlLmYpLCBzb3VyY2Uuc291cmNlKTtcbiAgfVxuXG4gIGlmIChzb3VyY2UgaW5zdGFuY2VvZiBfRmlsdGVyMi5kZWZhdWx0KSB7XG4gICAgcmV0dXJuIG5ldyBfRmlsdGVyTWFwMi5kZWZhdWx0KHNvdXJjZS5wLCBmLCBzb3VyY2Uuc291cmNlKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgTWFwKGYsIHNvdXJjZSk7XG59O1xuXG5NYXAucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby1leHRlbmQtbmF0aXZlXG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IE1hcFNpbmsodGhpcy5mLCBzaW5rKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIE1hcFNpbmsoZiwgc2luaykge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5NYXBTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuTWFwU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbk1hcFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIGYgPSB0aGlzLmY7XG4gIHRoaXMuc2luay5ldmVudCh0LCBmKHgpKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5Qcm9wYWdhdGVUYXNrID0gZXhwb3J0cy5kZWZhdWx0U2NoZWR1bGVyID0gZXhwb3J0cy5tdWx0aWNhc3QgPSBleHBvcnRzLnRocm93RXJyb3IgPSBleHBvcnRzLmZsYXRNYXBFcnJvciA9IGV4cG9ydHMucmVjb3ZlcldpdGggPSBleHBvcnRzLmF3YWl0ID0gZXhwb3J0cy5hd2FpdFByb21pc2VzID0gZXhwb3J0cy5mcm9tUHJvbWlzZSA9IGV4cG9ydHMuZGVib3VuY2UgPSBleHBvcnRzLnRocm90dGxlID0gZXhwb3J0cy50aW1lc3RhbXAgPSBleHBvcnRzLmRlbGF5ID0gZXhwb3J0cy5kdXJpbmcgPSBleHBvcnRzLnNpbmNlID0gZXhwb3J0cy5za2lwVW50aWwgPSBleHBvcnRzLnVudGlsID0gZXhwb3J0cy50YWtlVW50aWwgPSBleHBvcnRzLnNraXBXaGlsZSA9IGV4cG9ydHMudGFrZVdoaWxlID0gZXhwb3J0cy5zbGljZSA9IGV4cG9ydHMuc2tpcCA9IGV4cG9ydHMudGFrZSA9IGV4cG9ydHMuZGlzdGluY3RCeSA9IGV4cG9ydHMuc2tpcFJlcGVhdHNXaXRoID0gZXhwb3J0cy5kaXN0aW5jdCA9IGV4cG9ydHMuc2tpcFJlcGVhdHMgPSBleHBvcnRzLmZpbHRlciA9IGV4cG9ydHMuc3dpdGNoID0gZXhwb3J0cy5zd2l0Y2hMYXRlc3QgPSBleHBvcnRzLnppcEFycmF5ID0gZXhwb3J0cy56aXAgPSBleHBvcnRzLnNhbXBsZVdpdGggPSBleHBvcnRzLnNhbXBsZUFycmF5ID0gZXhwb3J0cy5zYW1wbGUgPSBleHBvcnRzLmNvbWJpbmVBcnJheSA9IGV4cG9ydHMuY29tYmluZSA9IGV4cG9ydHMubWVyZ2VBcnJheSA9IGV4cG9ydHMubWVyZ2UgPSBleHBvcnRzLm1lcmdlQ29uY3VycmVudGx5ID0gZXhwb3J0cy5jb25jYXRNYXAgPSBleHBvcnRzLmZsYXRNYXBFbmQgPSBleHBvcnRzLmNvbnRpbnVlV2l0aCA9IGV4cG9ydHMuam9pbiA9IGV4cG9ydHMuY2hhaW4gPSBleHBvcnRzLmZsYXRNYXAgPSBleHBvcnRzLnRyYW5zZHVjZSA9IGV4cG9ydHMuYXAgPSBleHBvcnRzLnRhcCA9IGV4cG9ydHMuY29uc3RhbnQgPSBleHBvcnRzLm1hcCA9IGV4cG9ydHMuc3RhcnRXaXRoID0gZXhwb3J0cy5jb25jYXQgPSBleHBvcnRzLmdlbmVyYXRlID0gZXhwb3J0cy5pdGVyYXRlID0gZXhwb3J0cy51bmZvbGQgPSBleHBvcnRzLnJlZHVjZSA9IGV4cG9ydHMuc2NhbiA9IGV4cG9ydHMubG9vcCA9IGV4cG9ydHMuZHJhaW4gPSBleHBvcnRzLmZvckVhY2ggPSBleHBvcnRzLm9ic2VydmUgPSBleHBvcnRzLmZyb21FdmVudCA9IGV4cG9ydHMucGVyaW9kaWMgPSBleHBvcnRzLmZyb20gPSBleHBvcnRzLm5ldmVyID0gZXhwb3J0cy5lbXB0eSA9IGV4cG9ydHMuanVzdCA9IGV4cG9ydHMub2YgPSBleHBvcnRzLlN0cmVhbSA9IHVuZGVmaW5lZDtcblxudmFyIF9mcm9tRXZlbnQgPSByZXF1aXJlKCcuL3NvdXJjZS9mcm9tRXZlbnQnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdmcm9tRXZlbnQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfZnJvbUV2ZW50LmZyb21FdmVudDtcbiAgfVxufSk7XG5cbnZhciBfdW5mb2xkID0gcmVxdWlyZSgnLi9zb3VyY2UvdW5mb2xkJyk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAndW5mb2xkJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX3VuZm9sZC51bmZvbGQ7XG4gIH1cbn0pO1xuXG52YXIgX2l0ZXJhdGUgPSByZXF1aXJlKCcuL3NvdXJjZS9pdGVyYXRlJyk7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnaXRlcmF0ZScsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9pdGVyYXRlLml0ZXJhdGU7XG4gIH1cbn0pO1xuXG52YXIgX2dlbmVyYXRlID0gcmVxdWlyZSgnLi9zb3VyY2UvZ2VuZXJhdGUnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdnZW5lcmF0ZScsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9nZW5lcmF0ZS5nZW5lcmF0ZTtcbiAgfVxufSk7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxudmFyIF9jb3JlID0gcmVxdWlyZSgnLi9zb3VyY2UvY29yZScpO1xuXG52YXIgX2Zyb20gPSByZXF1aXJlKCcuL3NvdXJjZS9mcm9tJyk7XG5cbnZhciBfcGVyaW9kaWMgPSByZXF1aXJlKCcuL3NvdXJjZS9wZXJpb2RpYycpO1xuXG52YXIgX3N5bWJvbE9ic2VydmFibGUgPSByZXF1aXJlKCdzeW1ib2wtb2JzZXJ2YWJsZScpO1xuXG52YXIgX3N5bWJvbE9ic2VydmFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc3ltYm9sT2JzZXJ2YWJsZSk7XG5cbnZhciBfc3Vic2NyaWJlID0gcmVxdWlyZSgnLi9vYnNlcnZhYmxlL3N1YnNjcmliZScpO1xuXG52YXIgX3RocnUgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvdGhydScpO1xuXG52YXIgX29ic2VydmUgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3Ivb2JzZXJ2ZScpO1xuXG52YXIgX2xvb3AgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvbG9vcCcpO1xuXG52YXIgX2FjY3VtdWxhdGUgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvYWNjdW11bGF0ZScpO1xuXG52YXIgX2J1aWxkID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2J1aWxkJyk7XG5cbnZhciBfdHJhbnNmb3JtID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3RyYW5zZm9ybScpO1xuXG52YXIgX2FwcGxpY2F0aXZlID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2FwcGxpY2F0aXZlJyk7XG5cbnZhciBfdHJhbnNkdWNlID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3RyYW5zZHVjZScpO1xuXG52YXIgX2ZsYXRNYXAgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvZmxhdE1hcCcpO1xuXG52YXIgX2NvbnRpbnVlV2l0aCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9jb250aW51ZVdpdGgnKTtcblxudmFyIF9jb25jYXRNYXAgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvY29uY2F0TWFwJyk7XG5cbnZhciBfbWVyZ2VDb25jdXJyZW50bHkgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvbWVyZ2VDb25jdXJyZW50bHknKTtcblxudmFyIF9tZXJnZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9tZXJnZScpO1xuXG52YXIgX2NvbWJpbmUgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvY29tYmluZScpO1xuXG52YXIgX3NhbXBsZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9zYW1wbGUnKTtcblxudmFyIF96aXAgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvemlwJyk7XG5cbnZhciBfc3dpdGNoID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3N3aXRjaCcpO1xuXG52YXIgX2ZpbHRlciA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9maWx0ZXInKTtcblxudmFyIF9zbGljZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9zbGljZScpO1xuXG52YXIgX3RpbWVzbGljZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci90aW1lc2xpY2UnKTtcblxudmFyIF9kZWxheSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9kZWxheScpO1xuXG52YXIgX3RpbWVzdGFtcCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci90aW1lc3RhbXAnKTtcblxudmFyIF9saW1pdCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9saW1pdCcpO1xuXG52YXIgX3Byb21pc2VzID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3Byb21pc2VzJyk7XG5cbnZhciBfZXJyb3JzID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2Vycm9ycycpO1xuXG52YXIgX211bHRpY2FzdCA9IHJlcXVpcmUoJ0Btb3N0L211bHRpY2FzdCcpO1xuXG52YXIgX211bHRpY2FzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9tdWx0aWNhc3QpO1xuXG52YXIgX2RlZmF1bHRTY2hlZHVsZXIgPSByZXF1aXJlKCcuL3NjaGVkdWxlci9kZWZhdWx0U2NoZWR1bGVyJyk7XG5cbnZhciBfZGVmYXVsdFNjaGVkdWxlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kZWZhdWx0U2NoZWR1bGVyKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrID0gcmVxdWlyZSgnLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENvcmUgc3RyZWFtIHR5cGVcbiAqIEB0eXBlIHtTdHJlYW19XG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5leHBvcnRzLlN0cmVhbSA9IF9TdHJlYW0yLmRlZmF1bHQ7XG5cbi8vIEFkZCBvZiBhbmQgZW1wdHkgdG8gY29uc3RydWN0b3IgZm9yIGZhbnRhc3ktbGFuZCBjb21wYXRcblxuX1N0cmVhbTIuZGVmYXVsdC5vZiA9IF9jb3JlLm9mO1xuX1N0cmVhbTIuZGVmYXVsdC5lbXB0eSA9IF9jb3JlLmVtcHR5O1xuLy8gQWRkIGZyb20gdG8gY29uc3RydWN0b3IgZm9yIEVTIE9ic2VydmFibGUgY29tcGF0XG5fU3RyZWFtMi5kZWZhdWx0LmZyb20gPSBfZnJvbS5mcm9tO1xuZXhwb3J0cy5vZiA9IF9jb3JlLm9mO1xuZXhwb3J0cy5qdXN0ID0gX2NvcmUub2Y7XG5leHBvcnRzLmVtcHR5ID0gX2NvcmUuZW1wdHk7XG5leHBvcnRzLm5ldmVyID0gX2NvcmUubmV2ZXI7XG5leHBvcnRzLmZyb20gPSBfZnJvbS5mcm9tO1xuZXhwb3J0cy5wZXJpb2RpYyA9IF9wZXJpb2RpYy5wZXJpb2RpYztcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERyYWZ0IEVTIE9ic2VydmFibGUgcHJvcG9zYWwgaW50ZXJvcFxuLy8gaHR0cHM6Ly9naXRodWIuY29tL3plbnBhcnNpbmcvZXMtb2JzZXJ2YWJsZVxuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoc3Vic2NyaWJlcikge1xuICByZXR1cm4gKDAsIF9zdWJzY3JpYmUuc3Vic2NyaWJlKShzdWJzY3JpYmVyLCB0aGlzKTtcbn07XG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlW19zeW1ib2xPYnNlcnZhYmxlMi5kZWZhdWx0XSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRmx1ZW50IGFkYXB0ZXJcblxuLyoqXG4gKiBBZGFwdCBhIGZ1bmN0aW9uYWwgc3RyZWFtIHRyYW5zZm9ybSB0byBmbHVlbnQgc3R5bGUuXG4gKiBJdCBhcHBsaWVzIGYgdG8gdGhlIHRoaXMgc3RyZWFtIG9iamVjdFxuICogQHBhcmFtICB7ZnVuY3Rpb24oczogU3RyZWFtKTogU3RyZWFtfSBmIGZ1bmN0aW9uIHRoYXRcbiAqIHJlY2VpdmVzIHRoZSBzdHJlYW0gaXRzZWxmIGFuZCBtdXN0IHJldHVybiBhIG5ldyBzdHJlYW1cbiAqIEByZXR1cm4ge1N0cmVhbX1cbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGhydSA9IGZ1bmN0aW9uIChmKSB7XG4gIHJldHVybiAoMCwgX3RocnUudGhydSkoZiwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQWRhcHRpbmcgb3RoZXIgc291cmNlc1xuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmVhbSBvZiBldmVudHMgZnJvbSB0aGUgc3VwcGxpZWQgRXZlbnRUYXJnZXQgb3IgRXZlbnRFbWl0dGVyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgbmFtZVxuICogQHBhcmFtIHtFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJ9IHNvdXJjZSBFdmVudFRhcmdldCBvciBFdmVudEVtaXR0ZXIuIFRoZSBzb3VyY2VcbiAqICBtdXN0IHN1cHBvcnQgZWl0aGVyIGFkZEV2ZW50TGlzdGVuZXIvcmVtb3ZlRXZlbnRMaXN0ZW5lciAodzNjIEV2ZW50VGFyZ2V0OlxuICogIGh0dHA6Ly93d3cudzMub3JnL1RSL0RPTS1MZXZlbC0yLUV2ZW50cy9ldmVudHMuaHRtbCNFdmVudHMtRXZlbnRUYXJnZXQpLFxuICogIG9yIGFkZExpc3RlbmVyL3JlbW92ZUxpc3RlbmVyIChub2RlIEV2ZW50RW1pdHRlcjogaHR0cDovL25vZGVqcy5vcmcvYXBpL2V2ZW50cy5odG1sKVxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIG9mIGV2ZW50cyBvZiB0aGUgc3BlY2lmaWVkIHR5cGUgZnJvbSB0aGUgc291cmNlXG4gKi9cblxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gT2JzZXJ2aW5nXG5cbmV4cG9ydHMub2JzZXJ2ZSA9IF9vYnNlcnZlLm9ic2VydmU7XG5leHBvcnRzLmZvckVhY2ggPSBfb2JzZXJ2ZS5vYnNlcnZlO1xuZXhwb3J0cy5kcmFpbiA9IF9vYnNlcnZlLmRyYWluO1xuXG4vKipcbiAqIFByb2Nlc3MgYWxsIHRoZSBldmVudHMgaW4gdGhlIHN0cmVhbVxuICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdGhhdCBmdWxmaWxscyB3aGVuIHRoZSBzdHJlYW0gZW5kcywgb3IgcmVqZWN0c1xuICogIGlmIHRoZSBzdHJlYW0gZmFpbHMgd2l0aCBhbiB1bmhhbmRsZWQgZXJyb3IuXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUub2JzZXJ2ZSA9IF9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmZvckVhY2ggPSBmdW5jdGlvbiAoZikge1xuICByZXR1cm4gKDAsIF9vYnNlcnZlLm9ic2VydmUpKGYsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBDb25zdW1lIGFsbCBldmVudHMgaW4gdGhlIHN0cmVhbSwgd2l0aG91dCBwcm92aWRpbmcgYSBmdW5jdGlvbiB0byBwcm9jZXNzIGVhY2guXG4gKiBUaGlzIGNhdXNlcyBhIHN0cmVhbSB0byBiZWNvbWUgYWN0aXZlIGFuZCBiZWdpbiBlbWl0dGluZyBldmVudHMsIGFuZCBpcyB1c2VmdWxcbiAqIGluIGNhc2VzIHdoZXJlIGFsbCBwcm9jZXNzaW5nIGhhcyBiZWVuIHNldHVwIHVwc3RyZWFtIHZpYSBvdGhlciBjb21iaW5hdG9ycywgYW5kXG4gKiB0aGVyZSBpcyBubyBuZWVkIHRvIHByb2Nlc3MgdGhlIHRlcm1pbmFsIGV2ZW50cy5cbiAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIHRoYXQgZnVsZmlsbHMgd2hlbiB0aGUgc3RyZWFtIGVuZHMsIG9yIHJlamVjdHNcbiAqICBpZiB0aGUgc3RyZWFtIGZhaWxzIHdpdGggYW4gdW5oYW5kbGVkIGVycm9yLlxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5kcmFpbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICgwLCBfb2JzZXJ2ZS5kcmFpbikodGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydHMubG9vcCA9IF9sb29wLmxvb3A7XG5cbi8qKlxuICogR2VuZXJhbGl6ZWQgZmVlZGJhY2sgbG9vcC4gQ2FsbCBhIHN0ZXBwZXIgZnVuY3Rpb24gZm9yIGVhY2ggZXZlbnQuIFRoZSBzdGVwcGVyXG4gKiB3aWxsIGJlIGNhbGxlZCB3aXRoIDIgcGFyYW1zOiB0aGUgY3VycmVudCBzZWVkIGFuZCB0aGUgYW4gZXZlbnQgdmFsdWUuICBJdCBtdXN0XG4gKiByZXR1cm4gYSBuZXcgeyBzZWVkLCB2YWx1ZSB9IHBhaXIuIFRoZSBgc2VlZGAgd2lsbCBiZSBmZWQgYmFjayBpbnRvIHRoZSBuZXh0XG4gKiBpbnZvY2F0aW9uIG9mIHN0ZXBwZXIsIGFuZCB0aGUgYHZhbHVlYCB3aWxsIGJlIHByb3BhZ2F0ZWQgYXMgdGhlIGV2ZW50IHZhbHVlLlxuICogQHBhcmFtIHtmdW5jdGlvbihzZWVkOiosIHZhbHVlOiopOntzZWVkOiosIHZhbHVlOip9fSBzdGVwcGVyIGxvb3Agc3RlcCBmdW5jdGlvblxuICogQHBhcmFtIHsqfSBzZWVkIGluaXRpYWwgc2VlZCB2YWx1ZSBwYXNzZWQgdG8gZmlyc3Qgc3RlcHBlciBjYWxsXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHdob3NlIHZhbHVlcyBhcmUgdGhlIGB2YWx1ZWAgZmllbGQgb2YgdGhlIG9iamVjdHNcbiAqIHJldHVybmVkIGJ5IHRoZSBzdGVwcGVyXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUubG9vcCA9IGZ1bmN0aW9uIChzdGVwcGVyLCBzZWVkKSB7XG4gIHJldHVybiAoMCwgX2xvb3AubG9vcCkoc3RlcHBlciwgc2VlZCwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbmV4cG9ydHMuc2NhbiA9IF9hY2N1bXVsYXRlLnNjYW47XG5leHBvcnRzLnJlZHVjZSA9IF9hY2N1bXVsYXRlLnJlZHVjZTtcblxuLyoqXG4gKiBDcmVhdGUgYSBzdHJlYW0gY29udGFpbmluZyBzdWNjZXNzaXZlIHJlZHVjZSByZXN1bHRzIG9mIGFwcGx5aW5nIGYgdG9cbiAqIHRoZSBwcmV2aW91cyByZWR1Y2UgcmVzdWx0IGFuZCB0aGUgY3VycmVudCBzdHJlYW0gaXRlbS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24ocmVzdWx0OiosIHg6Kik6Kn0gZiByZWR1Y2VyIGZ1bmN0aW9uXG4gKiBAcGFyYW0geyp9IGluaXRpYWwgaW5pdGlhbCB2YWx1ZVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIHN1Y2Nlc3NpdmUgcmVkdWNlIHJlc3VsdHNcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zY2FuID0gZnVuY3Rpb24gKGYsIGluaXRpYWwpIHtcbiAgcmV0dXJuICgwLCBfYWNjdW11bGF0ZS5zY2FuKShmLCBpbml0aWFsLCB0aGlzKTtcbn07XG5cbi8qKlxuICogUmVkdWNlIHRoZSBzdHJlYW0gdG8gcHJvZHVjZSBhIHNpbmdsZSByZXN1bHQuICBOb3RlIHRoYXQgcmVkdWNpbmcgYW4gaW5maW5pdGVcbiAqIHN0cmVhbSB3aWxsIHJldHVybiBhIFByb21pc2UgdGhhdCBuZXZlciBmdWxmaWxscywgYnV0IHRoYXQgbWF5IHJlamVjdCBpZiBhbiBlcnJvclxuICogb2NjdXJzLlxuICogQHBhcmFtIHtmdW5jdGlvbihyZXN1bHQ6KiwgeDoqKToqfSBmIHJlZHVjZXIgZnVuY3Rpb25cbiAqIEBwYXJhbSB7Kn0gaW5pdGlhbCBvcHRpb25hbCBpbml0aWFsIHZhbHVlXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSBmb3IgdGhlIGZpbGUgcmVzdWx0IG9mIHRoZSByZWR1Y2VcbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUucmVkdWNlID0gZnVuY3Rpb24gKGYsIGluaXRpYWwpIHtcbiAgcmV0dXJuICgwLCBfYWNjdW11bGF0ZS5yZWR1Y2UpKGYsIGluaXRpYWwsIHRoaXMpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEJ1aWxkaW5nIGFuZCBleHRlbmRpbmdcblxuZXhwb3J0cy5jb25jYXQgPSBfYnVpbGQuY29uY2F0O1xuZXhwb3J0cy5zdGFydFdpdGggPSBfYnVpbGQuY29ucztcblxuLyoqXG4gKiBAcGFyYW0ge1N0cmVhbX0gdGFpbFxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIGFsbCBpdGVtcyBpbiB0aGlzIGZvbGxvd2VkIGJ5XG4gKiAgYWxsIGl0ZW1zIGluIHRhaWxcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5jb25jYXQgPSBmdW5jdGlvbiAodGFpbCkge1xuICByZXR1cm4gKDAsIF9idWlsZC5jb25jYXQpKHRoaXMsIHRhaWwpO1xufTtcblxuLyoqXG4gKiBAcGFyYW0geyp9IHggdmFsdWUgdG8gcHJlcGVuZFxuICogQHJldHVybnMge1N0cmVhbX0gYSBuZXcgc3RyZWFtIHdpdGggeCBwcmVwZW5kZWRcbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc3RhcnRXaXRoID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuICgwLCBfYnVpbGQuY29ucykoeCwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gVHJhbnNmb3JtaW5nXG5cbmV4cG9ydHMubWFwID0gX3RyYW5zZm9ybS5tYXA7XG5leHBvcnRzLmNvbnN0YW50ID0gX3RyYW5zZm9ybS5jb25zdGFudDtcbmV4cG9ydHMudGFwID0gX3RyYW5zZm9ybS50YXA7XG5leHBvcnRzLmFwID0gX2FwcGxpY2F0aXZlLmFwO1xuXG4vKipcbiAqIFRyYW5zZm9ybSBlYWNoIHZhbHVlIGluIHRoZSBzdHJlYW0gYnkgYXBwbHlpbmcgZiB0byBlYWNoXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKCopOip9IGYgbWFwcGluZyBmdW5jdGlvblxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgdHJhbnNmb3JtZWQgYnkgZlxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLm1hcCA9IGZ1bmN0aW9uIChmKSB7XG4gIHJldHVybiAoMCwgX3RyYW5zZm9ybS5tYXApKGYsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBBc3N1bWUgdGhpcyBzdHJlYW0gY29udGFpbnMgZnVuY3Rpb25zLCBhbmQgYXBwbHkgZWFjaCBmdW5jdGlvbiB0byBlYWNoIGl0ZW1cbiAqIGluIHRoZSBwcm92aWRlZCBzdHJlYW0uICBUaGlzIGdlbmVyYXRlcywgaW4gZWZmZWN0LCBhIGNyb3NzIHByb2R1Y3QuXG4gKiBAcGFyYW0ge1N0cmVhbX0geHMgc3RyZWFtIG9mIGl0ZW1zIHRvIHdoaWNoXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyB0aGUgY3Jvc3MgcHJvZHVjdCBvZiBpdGVtc1xuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5hcCA9IGZ1bmN0aW9uICh4cykge1xuICByZXR1cm4gKDAsIF9hcHBsaWNhdGl2ZS5hcCkodGhpcywgeHMpO1xufTtcblxuLyoqXG4gKiBSZXBsYWNlIGVhY2ggdmFsdWUgaW4gdGhlIHN0cmVhbSB3aXRoIHhcbiAqIEBwYXJhbSB7Kn0geFxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgcmVwbGFjZWQgd2l0aCB4XG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmNvbnN0YW50ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuICgwLCBfdHJhbnNmb3JtLmNvbnN0YW50KSh4LCB0aGlzKTtcbn07XG5cbi8qKlxuICogUGVyZm9ybSBhIHNpZGUgZWZmZWN0IGZvciBlYWNoIGl0ZW0gaW4gdGhlIHN0cmVhbVxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOip9IGYgc2lkZSBlZmZlY3QgdG8gZXhlY3V0ZSBmb3IgZWFjaCBpdGVtLiBUaGVcbiAqICByZXR1cm4gdmFsdWUgd2lsbCBiZSBkaXNjYXJkZWQuXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHNhbWUgaXRlbXMgYXMgdGhpcyBzdHJlYW1cbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGFwID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfdHJhbnNmb3JtLnRhcCkoZiwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gVHJhbnNkdWNlciBzdXBwb3J0XG5cbmV4cG9ydHMudHJhbnNkdWNlID0gX3RyYW5zZHVjZS50cmFuc2R1Y2U7XG5cbi8qKlxuICogVHJhbnNmb3JtIHRoaXMgc3RyZWFtIGJ5IHBhc3NpbmcgaXRzIGV2ZW50cyB0aHJvdWdoIGEgdHJhbnNkdWNlci5cbiAqIEBwYXJhbSAge2Z1bmN0aW9ufSB0cmFuc2R1Y2VyIHRyYW5zZHVjZXIgZnVuY3Rpb25cbiAqIEByZXR1cm4ge1N0cmVhbX0gc3RyZWFtIG9mIGV2ZW50cyB0cmFuc2Zvcm1lZCBieSB0aGUgdHJhbnNkdWNlclxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnRyYW5zZHVjZSA9IGZ1bmN0aW9uICh0cmFuc2R1Y2VyKSB7XG4gIHJldHVybiAoMCwgX3RyYW5zZHVjZS50cmFuc2R1Y2UpKHRyYW5zZHVjZXIsIHRoaXMpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEZsYXRNYXBwaW5nXG5cbi8vIEBkZXByZWNhdGVkIGZsYXRNYXAsIHVzZSBjaGFpbiBpbnN0ZWFkXG5leHBvcnRzLmZsYXRNYXAgPSBfZmxhdE1hcC5mbGF0TWFwO1xuZXhwb3J0cy5jaGFpbiA9IF9mbGF0TWFwLmZsYXRNYXA7XG5leHBvcnRzLmpvaW4gPSBfZmxhdE1hcC5qb2luO1xuXG4vKipcbiAqIE1hcCBlYWNoIHZhbHVlIGluIHRoZSBzdHJlYW0gdG8gYSBuZXcgc3RyZWFtLCBhbmQgbWVyZ2UgaXQgaW50byB0aGVcbiAqIHJldHVybmVkIG91dGVyIHN0cmVhbS4gRXZlbnQgYXJyaXZhbCB0aW1lcyBhcmUgcHJlc2VydmVkLlxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOlN0cmVhbX0gZiBjaGFpbmluZyBmdW5jdGlvbiwgbXVzdCByZXR1cm4gYSBTdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBhbGwgZXZlbnRzIGZyb20gZWFjaCBzdHJlYW0gcmV0dXJuZWQgYnkgZlxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmNoYWluID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfZmxhdE1hcC5mbGF0TWFwKShmLCB0aGlzKTtcbn07XG5cbi8vIEBkZXByZWNhdGVkIHVzZSBjaGFpbiBpbnN0ZWFkXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5mbGF0TWFwID0gX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuY2hhaW47XG5cbi8qKlxuKiBNb25hZGljIGpvaW4uIEZsYXR0ZW4gYSBTdHJlYW08U3RyZWFtPFg+PiB0byBTdHJlYW08WD4gYnkgbWVyZ2luZyBpbm5lclxuKiBzdHJlYW1zIHRvIHRoZSBvdXRlci4gRXZlbnQgYXJyaXZhbCB0aW1lcyBhcmUgcHJlc2VydmVkLlxuKiBAcmV0dXJucyB7U3RyZWFtPFg+fSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBvZiBhbGwgaW5uZXIgc3RyZWFtc1xuKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmpvaW4gPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoMCwgX2ZsYXRNYXAuam9pbikodGhpcyk7XG59O1xuXG4vLyBAZGVwcmVjYXRlZCBmbGF0TWFwRW5kLCB1c2UgY29udGludWVXaXRoIGluc3RlYWRcbmV4cG9ydHMuY29udGludWVXaXRoID0gX2NvbnRpbnVlV2l0aC5jb250aW51ZVdpdGg7XG5leHBvcnRzLmZsYXRNYXBFbmQgPSBfY29udGludWVXaXRoLmNvbnRpbnVlV2l0aDtcblxuLyoqXG4gKiBNYXAgdGhlIGVuZCBldmVudCB0byBhIG5ldyBzdHJlYW0sIGFuZCBiZWdpbiBlbWl0dGluZyBpdHMgdmFsdWVzLlxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOlN0cmVhbX0gZiBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIHRoZSBlbmQgZXZlbnQgdmFsdWUsXG4gKiBhbmQgKm11c3QqIHJldHVybiBhIG5ldyBTdHJlYW0gdG8gY29udGludWUgd2l0aC5cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gdGhhdCBlbWl0cyBhbGwgZXZlbnRzIGZyb20gdGhlIG9yaWdpbmFsIHN0cmVhbSxcbiAqIGZvbGxvd2VkIGJ5IGFsbCBldmVudHMgZnJvbSB0aGUgc3RyZWFtIHJldHVybmVkIGJ5IGYuXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuY29udGludWVXaXRoID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfY29udGludWVXaXRoLmNvbnRpbnVlV2l0aCkoZiwgdGhpcyk7XG59O1xuXG4vLyBAZGVwcmVjYXRlZCB1c2UgY29udGludWVXaXRoIGluc3RlYWRcbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmZsYXRNYXBFbmQgPSBfU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5jb250aW51ZVdpdGg7XG5cbmV4cG9ydHMuY29uY2F0TWFwID0gX2NvbmNhdE1hcC5jb25jYXRNYXA7XG5cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuY29uY2F0TWFwID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfY29uY2F0TWFwLmNvbmNhdE1hcCkoZiwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQ29uY3VycmVudCBtZXJnaW5nXG5cbmV4cG9ydHMubWVyZ2VDb25jdXJyZW50bHkgPSBfbWVyZ2VDb25jdXJyZW50bHkubWVyZ2VDb25jdXJyZW50bHk7XG5cbi8qKlxuICogRmxhdHRlbiBhIFN0cmVhbTxTdHJlYW08WD4+IHRvIFN0cmVhbTxYPiBieSBtZXJnaW5nIGlubmVyXG4gKiBzdHJlYW1zIHRvIHRoZSBvdXRlciwgbGltaXRpbmcgdGhlIG51bWJlciBvZiBpbm5lciBzdHJlYW1zIHRoYXQgbWF5XG4gKiBiZSBhY3RpdmUgY29uY3VycmVudGx5LlxuICogQHBhcmFtIHtudW1iZXJ9IGNvbmN1cnJlbmN5IGF0IG1vc3QgdGhpcyBtYW55IGlubmVyIHN0cmVhbXMgd2lsbCBiZVxuICogIGFsbG93ZWQgdG8gYmUgYWN0aXZlIGNvbmN1cnJlbnRseS5cbiAqIEByZXR1cm4ge1N0cmVhbTxYPn0gbmV3IHN0cmVhbSBjb250YWluaW5nIGFsbCBldmVudHMgb2YgYWxsIGlubmVyXG4gKiAgc3RyZWFtcywgd2l0aCBsaW1pdGVkIGNvbmN1cnJlbmN5LlxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLm1lcmdlQ29uY3VycmVudGx5ID0gZnVuY3Rpb24gKGNvbmN1cnJlbmN5KSB7XG4gIHJldHVybiAoMCwgX21lcmdlQ29uY3VycmVudGx5Lm1lcmdlQ29uY3VycmVudGx5KShjb25jdXJyZW5jeSwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gTWVyZ2luZ1xuXG5leHBvcnRzLm1lcmdlID0gX21lcmdlLm1lcmdlO1xuZXhwb3J0cy5tZXJnZUFycmF5ID0gX21lcmdlLm1lcmdlQXJyYXk7XG5cbi8qKlxuICogTWVyZ2UgdGhpcyBzdHJlYW0gYW5kIGFsbCB0aGUgcHJvdmlkZWQgc3RyZWFtc1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgZnJvbSB0aGlzIHN0cmVhbSBhbmQgcyBpbiB0aW1lXG4gKiBvcmRlci4gIElmIHR3byBldmVudHMgYXJlIHNpbXVsdGFuZW91cyB0aGV5IHdpbGwgYmUgbWVyZ2VkIGluXG4gKiBhcmJpdHJhcnkgb3JkZXIuXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUubWVyZ2UgPSBmdW5jdGlvbiAoKSAvKiAuLi5zdHJlYW1zKi97XG4gIHJldHVybiAoMCwgX21lcmdlLm1lcmdlQXJyYXkpKGJhc2UuY29ucyh0aGlzLCBhcmd1bWVudHMpKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDb21iaW5pbmdcblxuZXhwb3J0cy5jb21iaW5lID0gX2NvbWJpbmUuY29tYmluZTtcbmV4cG9ydHMuY29tYmluZUFycmF5ID0gX2NvbWJpbmUuY29tYmluZUFycmF5O1xuXG4vKipcbiAqIENvbWJpbmUgbGF0ZXN0IGV2ZW50cyBmcm9tIGFsbCBpbnB1dCBzdHJlYW1zXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKC4uLmV2ZW50cyk6Kn0gZiBmdW5jdGlvbiB0byBjb21iaW5lIG1vc3QgcmVjZW50IGV2ZW50c1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBmIHRvIHRoZSBtb3N0IHJlY2VudFxuICogIGV2ZW50IG9mIGVhY2ggaW5wdXQgc3RyZWFtLCB3aGVuZXZlciBhIG5ldyBldmVudCBhcnJpdmVzIG9uIGFueSBzdHJlYW0uXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuY29tYmluZSA9IGZ1bmN0aW9uIChmIC8qLCAuLi5zdHJlYW1zKi8pIHtcbiAgcmV0dXJuICgwLCBfY29tYmluZS5jb21iaW5lQXJyYXkpKGYsIGJhc2UucmVwbGFjZSh0aGlzLCAwLCBhcmd1bWVudHMpKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBTYW1wbGluZ1xuXG5leHBvcnRzLnNhbXBsZSA9IF9zYW1wbGUuc2FtcGxlO1xuZXhwb3J0cy5zYW1wbGVBcnJheSA9IF9zYW1wbGUuc2FtcGxlQXJyYXk7XG5leHBvcnRzLnNhbXBsZVdpdGggPSBfc2FtcGxlLnNhbXBsZVdpdGg7XG5cbi8qKlxuICogV2hlbiBhbiBldmVudCBhcnJpdmVzIG9uIHNhbXBsZXIsIGVtaXQgdGhlIGxhdGVzdCBldmVudCB2YWx1ZSBmcm9tIHN0cmVhbS5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzYW1wbGVyIHN0cmVhbSBvZiBldmVudHMgYXQgd2hvc2UgYXJyaXZhbCB0aW1lXG4gKiAgc2lnbmFsJ3MgbGF0ZXN0IHZhbHVlIHdpbGwgYmUgcHJvcGFnYXRlZFxuICogQHJldHVybnMge1N0cmVhbX0gc2FtcGxlZCBzdHJlYW0gb2YgdmFsdWVzXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2FtcGxlV2l0aCA9IGZ1bmN0aW9uIChzYW1wbGVyKSB7XG4gIHJldHVybiAoMCwgX3NhbXBsZS5zYW1wbGVXaXRoKShzYW1wbGVyLCB0aGlzKTtcbn07XG5cbi8qKlxuICogV2hlbiBhbiBldmVudCBhcnJpdmVzIG9uIHRoaXMgc3RyZWFtLCBlbWl0IHRoZSByZXN1bHQgb2YgY2FsbGluZyBmIHdpdGggdGhlIGxhdGVzdFxuICogdmFsdWVzIG9mIGFsbCBzdHJlYW1zIGJlaW5nIHNhbXBsZWRcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oLi4udmFsdWVzKToqfSBmIGZ1bmN0aW9uIHRvIGFwcGx5IHRvIGVhY2ggc2V0IG9mIHNhbXBsZWQgdmFsdWVzXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gb2Ygc2FtcGxlZCBhbmQgdHJhbnNmb3JtZWQgdmFsdWVzXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnNhbXBsZSA9IGZ1bmN0aW9uIChmIC8qIC4uLnN0cmVhbXMgKi8pIHtcbiAgcmV0dXJuICgwLCBfc2FtcGxlLnNhbXBsZUFycmF5KShmLCB0aGlzLCBiYXNlLnRhaWwoYXJndW1lbnRzKSk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gWmlwcGluZ1xuXG5leHBvcnRzLnppcCA9IF96aXAuemlwO1xuZXhwb3J0cy56aXBBcnJheSA9IF96aXAuemlwQXJyYXk7XG5cbi8qKlxuICogUGFpci13aXNlIGNvbWJpbmUgaXRlbXMgd2l0aCB0aG9zZSBpbiBzLiBHaXZlbiAyIHN0cmVhbXM6XG4gKiBbMSwyLDNdIHppcFdpdGggZiBbNCw1LDZdIC0+IFtmKDEsNCksZigyLDUpLGYoMyw2KV1cbiAqIE5vdGU6IHppcCBjYXVzZXMgZmFzdCBzdHJlYW1zIHRvIGJ1ZmZlciBhbmQgd2FpdCBmb3Igc2xvdyBzdHJlYW1zLlxuICogQHBhcmFtIHtmdW5jdGlvbihhOlN0cmVhbSwgYjpTdHJlYW0sIC4uLik6Kn0gZiBmdW5jdGlvbiB0byBjb21iaW5lIGl0ZW1zXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgcGFpcnNcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS56aXAgPSBmdW5jdGlvbiAoZiAvKiwgLi4uc3RyZWFtcyovKSB7XG4gIHJldHVybiAoMCwgX3ppcC56aXBBcnJheSkoZiwgYmFzZS5yZXBsYWNlKHRoaXMsIDAsIGFyZ3VtZW50cykpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFN3aXRjaGluZ1xuXG4vLyBAZGVwcmVjYXRlZCBzd2l0Y2gsIHVzZSBzd2l0Y2hMYXRlc3QgaW5zdGVhZFxuZXhwb3J0cy5zd2l0Y2hMYXRlc3QgPSBfc3dpdGNoLnN3aXRjaExhdGVzdDtcbmV4cG9ydHMuc3dpdGNoID0gX3N3aXRjaC5zd2l0Y2hMYXRlc3Q7XG5cbi8qKlxuICogR2l2ZW4gYSBzdHJlYW0gb2Ygc3RyZWFtcywgcmV0dXJuIGEgbmV3IHN0cmVhbSB0aGF0IGFkb3B0cyB0aGUgYmVoYXZpb3JcbiAqIG9mIHRoZSBtb3N0IHJlY2VudCBpbm5lciBzdHJlYW0uXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzd2l0Y2hpbmcgc3RyZWFtXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc3dpdGNoTGF0ZXN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gKDAsIF9zd2l0Y2guc3dpdGNoTGF0ZXN0KSh0aGlzKTtcbn07XG5cbi8vIEBkZXByZWNhdGVkIHVzZSBzd2l0Y2hMYXRlc3QgaW5zdGVhZFxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc3dpdGNoID0gX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc3dpdGNoTGF0ZXN0O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRmlsdGVyaW5nXG5cbi8vIEBkZXByZWNhdGVkIGRpc3RpbmN0LCB1c2Ugc2tpcFJlcGVhdHMgaW5zdGVhZFxuLy8gQGRlcHJlY2F0ZWQgZGlzdGluY3RCeSwgdXNlIHNraXBSZXBlYXRzV2l0aCBpbnN0ZWFkXG5leHBvcnRzLmZpbHRlciA9IF9maWx0ZXIuZmlsdGVyO1xuZXhwb3J0cy5za2lwUmVwZWF0cyA9IF9maWx0ZXIuc2tpcFJlcGVhdHM7XG5leHBvcnRzLmRpc3RpbmN0ID0gX2ZpbHRlci5za2lwUmVwZWF0cztcbmV4cG9ydHMuc2tpcFJlcGVhdHNXaXRoID0gX2ZpbHRlci5za2lwUmVwZWF0c1dpdGg7XG5leHBvcnRzLmRpc3RpbmN0QnkgPSBfZmlsdGVyLnNraXBSZXBlYXRzV2l0aDtcblxuLyoqXG4gKiBSZXRhaW4gb25seSBpdGVtcyBtYXRjaGluZyBhIHByZWRpY2F0ZVxuICogc3RyZWFtOiAgICAgICAgICAgICAgICAgICAgICAgICAgIC0xMjM0NTY3OC1cbiAqIGZpbHRlcih4ID0+IHggJSAyID09PSAwLCBzdHJlYW0pOiAtLTItNC02LTgtXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6Ym9vbGVhbn0gcCBmaWx0ZXJpbmcgcHJlZGljYXRlIGNhbGxlZCBmb3IgZWFjaCBpdGVtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBvbmx5IGl0ZW1zIGZvciB3aGljaCBwcmVkaWNhdGUgcmV0dXJucyB0cnV0aHlcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5maWx0ZXIgPSBmdW5jdGlvbiAocCkge1xuICByZXR1cm4gKDAsIF9maWx0ZXIuZmlsdGVyKShwLCB0aGlzKTtcbn07XG5cbi8qKlxuICogU2tpcCByZXBlYXRlZCBldmVudHMsIHVzaW5nID09PSB0byBjb21wYXJlIGl0ZW1zXG4gKiBzdHJlYW06ICAgICAgICAgICAtYWJiY2QtXG4gKiBkaXN0aW5jdChzdHJlYW0pOiAtYWItY2QtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gd2l0aCBubyByZXBlYXRlZCBldmVudHNcbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2tpcFJlcGVhdHMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoMCwgX2ZpbHRlci5za2lwUmVwZWF0cykodGhpcyk7XG59O1xuXG4vKipcbiAqIFNraXAgcmVwZWF0ZWQgZXZlbnRzLCB1c2luZyBzdXBwbGllZCBlcXVhbHMgZnVuY3Rpb24gdG8gY29tcGFyZSBpdGVtc1xuICogQHBhcmFtIHtmdW5jdGlvbihhOiosIGI6Kik6Ym9vbGVhbn0gZXF1YWxzIGZ1bmN0aW9uIHRvIGNvbXBhcmUgaXRlbXNcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSB3aXRoIG5vIHJlcGVhdGVkIGV2ZW50c1xuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5za2lwUmVwZWF0c1dpdGggPSBmdW5jdGlvbiAoZXF1YWxzKSB7XG4gIHJldHVybiAoMCwgX2ZpbHRlci5za2lwUmVwZWF0c1dpdGgpKGVxdWFscywgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gU2xpY2luZ1xuXG5leHBvcnRzLnRha2UgPSBfc2xpY2UudGFrZTtcbmV4cG9ydHMuc2tpcCA9IF9zbGljZS5za2lwO1xuZXhwb3J0cy5zbGljZSA9IF9zbGljZS5zbGljZTtcbmV4cG9ydHMudGFrZVdoaWxlID0gX3NsaWNlLnRha2VXaGlsZTtcbmV4cG9ydHMuc2tpcFdoaWxlID0gX3NsaWNlLnNraXBXaGlsZTtcblxuLyoqXG4gKiBzdHJlYW06ICAgICAgICAgIC1hYmNkLVxuICogdGFrZSgyLCBzdHJlYW0pOiAtYWJ8XG4gKiBAcGFyYW0ge051bWJlcn0gbiB0YWtlIHVwIHRvIHRoaXMgbWFueSBldmVudHNcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGF0IG1vc3QgdGhlIGZpcnN0IG4gaXRlbXMgZnJvbSB0aGlzIHN0cmVhbVxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnRha2UgPSBmdW5jdGlvbiAobikge1xuICByZXR1cm4gKDAsIF9zbGljZS50YWtlKShuLCB0aGlzKTtcbn07XG5cbi8qKlxuICogc3RyZWFtOiAgICAgICAgICAtYWJjZC0+XG4gKiBza2lwKDIsIHN0cmVhbSk6IC0tLWNkLT5cbiAqIEBwYXJhbSB7TnVtYmVyfSBuIHNraXAgdGhpcyBtYW55IGV2ZW50c1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIG5vdCBjb250YWluaW5nIHRoZSBmaXJzdCBuIGV2ZW50c1xuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5za2lwID0gZnVuY3Rpb24gKG4pIHtcbiAgcmV0dXJuICgwLCBfc2xpY2Uuc2tpcCkobiwgdGhpcyk7XG59O1xuXG4vKipcbiAqIFNsaWNlIGEgc3RyZWFtIGJ5IGV2ZW50IGluZGV4LiBFcXVpdmFsZW50IHRvLCBidXQgbW9yZSBlZmZpY2llbnQgdGhhblxuICogc3RyZWFtLnRha2UoZW5kKS5za2lwKHN0YXJ0KTtcbiAqIE5PVEU6IE5lZ2F0aXZlIHN0YXJ0IGFuZCBlbmQgYXJlIG5vdCBzdXBwb3J0ZWRcbiAqIEBwYXJhbSB7TnVtYmVyfSBzdGFydCBza2lwIGFsbCBldmVudHMgYmVmb3JlIHRoZSBzdGFydCBpbmRleFxuICogQHBhcmFtIHtOdW1iZXJ9IGVuZCBhbGxvdyBhbGwgZXZlbnRzIGZyb20gdGhlIHN0YXJ0IGluZGV4IHRvIHRoZSBlbmQgaW5kZXhcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGl0ZW1zIHdoZXJlIHN0YXJ0IDw9IGluZGV4IDwgZW5kXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnNsaWNlID0gZnVuY3Rpb24gKHN0YXJ0LCBlbmQpIHtcbiAgcmV0dXJuICgwLCBfc2xpY2Uuc2xpY2UpKHN0YXJ0LCBlbmQsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBzdHJlYW06ICAgICAgICAgICAgICAgICAgICAgICAgLTEyMzQ1MTIzNC0+XG4gKiB0YWtlV2hpbGUoeCA9PiB4IDwgNSwgc3RyZWFtKTogLTEyMzR8XG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6Ym9vbGVhbn0gcCBwcmVkaWNhdGVcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGl0ZW1zIHVwIHRvLCBidXQgbm90IGluY2x1ZGluZywgdGhlXG4gKiBmaXJzdCBpdGVtIGZvciB3aGljaCBwIHJldHVybnMgZmFsc3kuXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnRha2VXaGlsZSA9IGZ1bmN0aW9uIChwKSB7XG4gIHJldHVybiAoMCwgX3NsaWNlLnRha2VXaGlsZSkocCwgdGhpcyk7XG59O1xuXG4vKipcbiAqIHN0cmVhbTogICAgICAgICAgICAgICAgICAgICAgICAtMTIzNDUxMjM0LT5cbiAqIHNraXBXaGlsZSh4ID0+IHggPCA1LCBzdHJlYW0pOiAtLS0tLTUxMjM0LT5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKTpib29sZWFufSBwIHByZWRpY2F0ZVxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgZm9sbG93aW5nICphbmQgaW5jbHVkaW5nKiB0aGVcbiAqIGZpcnN0IGl0ZW0gZm9yIHdoaWNoIHAgcmV0dXJucyBmYWxzeS5cbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2tpcFdoaWxlID0gZnVuY3Rpb24gKHApIHtcbiAgcmV0dXJuICgwLCBfc2xpY2Uuc2tpcFdoaWxlKShwLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBUaW1lIHNsaWNpbmdcblxuLy8gQGRlcHJlY2F0ZWQgdGFrZVVudGlsLCB1c2UgdW50aWwgaW5zdGVhZFxuLy8gQGRlcHJlY2F0ZWQgc2tpcFVudGlsLCB1c2Ugc2luY2UgaW5zdGVhZFxuZXhwb3J0cy50YWtlVW50aWwgPSBfdGltZXNsaWNlLnRha2VVbnRpbDtcbmV4cG9ydHMudW50aWwgPSBfdGltZXNsaWNlLnRha2VVbnRpbDtcbmV4cG9ydHMuc2tpcFVudGlsID0gX3RpbWVzbGljZS5za2lwVW50aWw7XG5leHBvcnRzLnNpbmNlID0gX3RpbWVzbGljZS5za2lwVW50aWw7XG5leHBvcnRzLmR1cmluZyA9IF90aW1lc2xpY2UuZHVyaW5nO1xuXG4vKipcbiAqIHN0cmVhbTogICAgICAgICAgICAgICAgICAgIC1hLWItYy1kLWUtZi1nLT5cbiAqIHNpZ25hbDogICAgICAgICAgICAgICAgICAgIC0tLS0tLS14XG4gKiB0YWtlVW50aWwoc2lnbmFsLCBzdHJlYW0pOiAtYS1iLWMtfFxuICogQHBhcmFtIHtTdHJlYW19IHNpZ25hbCByZXRhaW4gb25seSBldmVudHMgaW4gc3RyZWFtIGJlZm9yZSB0aGUgZmlyc3RcbiAqIGV2ZW50IGluIHNpZ25hbFxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIG9ubHkgZXZlbnRzIHRoYXQgb2NjdXIgYmVmb3JlXG4gKiB0aGUgZmlyc3QgZXZlbnQgaW4gc2lnbmFsLlxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnVudGlsID0gZnVuY3Rpb24gKHNpZ25hbCkge1xuICByZXR1cm4gKDAsIF90aW1lc2xpY2UudGFrZVVudGlsKShzaWduYWwsIHRoaXMpO1xufTtcblxuLy8gQGRlcHJlY2F0ZWQgdXNlIHVudGlsIGluc3RlYWRcbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnRha2VVbnRpbCA9IF9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnVudGlsO1xuXG4vKipcbiogc3RyZWFtOiAgICAgICAgICAgICAgICAgICAgLWEtYi1jLWQtZS1mLWctPlxuKiBzaWduYWw6ICAgICAgICAgICAgICAgICAgICAtLS0tLS0teFxuKiB0YWtlVW50aWwoc2lnbmFsLCBzdHJlYW0pOiAtLS0tLS0tZC1lLWYtZy0+XG4qIEBwYXJhbSB7U3RyZWFtfSBzaWduYWwgcmV0YWluIG9ubHkgZXZlbnRzIGluIHN0cmVhbSBhdCBvciBhZnRlciB0aGUgZmlyc3RcbiogZXZlbnQgaW4gc2lnbmFsXG4qIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBvbmx5IGV2ZW50cyB0aGF0IG9jY3VyIGFmdGVyXG4qIHRoZSBmaXJzdCBldmVudCBpbiBzaWduYWwuXG4qL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2luY2UgPSBmdW5jdGlvbiAoc2lnbmFsKSB7XG4gIHJldHVybiAoMCwgX3RpbWVzbGljZS5za2lwVW50aWwpKHNpZ25hbCwgdGhpcyk7XG59O1xuXG4vLyBAZGVwcmVjYXRlZCB1c2Ugc2luY2UgaW5zdGVhZFxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2tpcFVudGlsID0gX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2luY2U7XG5cbi8qKlxuKiBzdHJlYW06ICAgICAgICAgICAgICAgICAgICAtYS1iLWMtZC1lLWYtZy0+XG4qIHRpbWVXaW5kb3c6ICAgICAgICAgICAgICAgIC0tLS0tc1xuKiBzOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtLS0tLXRcbiogc3RyZWFtLmR1cmluZyh0aW1lV2luZG93KTogLS0tLS1jLWQtZS18XG4qIEBwYXJhbSB7U3RyZWFtPFN0cmVhbT59IHRpbWVXaW5kb3cgYSBzdHJlYW0gd2hvc2UgZmlyc3QgZXZlbnQgKHMpIHJlcHJlc2VudHNcbiogIHRoZSB3aW5kb3cgc3RhcnQgdGltZS4gIFRoYXQgZXZlbnQgKHMpIGlzIGl0c2VsZiBhIHN0cmVhbSB3aG9zZSBmaXJzdCBldmVudCAodClcbiogIHJlcHJlc2VudHMgdGhlIHdpbmRvdyBlbmQgdGltZVxuKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgb25seSBldmVudHMgd2l0aGluIHRoZSBwcm92aWRlZCB0aW1lc3BhblxuKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmR1cmluZyA9IGZ1bmN0aW9uICh0aW1lV2luZG93KSB7XG4gIHJldHVybiAoMCwgX3RpbWVzbGljZS5kdXJpbmcpKHRpbWVXaW5kb3csIHRoaXMpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIERlbGF5aW5nXG5cbmV4cG9ydHMuZGVsYXkgPSBfZGVsYXkuZGVsYXk7XG5cbi8qKlxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5VGltZSBtaWxsaXNlY29uZHMgdG8gZGVsYXkgZWFjaCBpdGVtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHNhbWUgaXRlbXMsIGJ1dCBkZWxheWVkIGJ5IG1zXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAoZGVsYXlUaW1lKSB7XG4gIHJldHVybiAoMCwgX2RlbGF5LmRlbGF5KShkZWxheVRpbWUsIHRoaXMpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIEdldHRpbmcgZXZlbnQgdGltZXN0YW1wXG5cbmV4cG9ydHMudGltZXN0YW1wID0gX3RpbWVzdGFtcC50aW1lc3RhbXA7XG5cbi8qKlxuICogRXhwb3NlIGV2ZW50IHRpbWVzdGFtcHMgaW50byB0aGUgc3RyZWFtLiBUdXJucyBhIFN0cmVhbTxYPiBpbnRvXG4gKiBTdHJlYW08e3RpbWU6dCwgdmFsdWU6WH0+XG4gKiBAcmV0dXJucyB7U3RyZWFtPHt0aW1lOm51bWJlciwgdmFsdWU6Kn0+fVxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnRpbWVzdGFtcCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICgwLCBfdGltZXN0YW1wLnRpbWVzdGFtcCkodGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gUmF0ZSBsaW1pdGluZ1xuXG5leHBvcnRzLnRocm90dGxlID0gX2xpbWl0LnRocm90dGxlO1xuZXhwb3J0cy5kZWJvdW5jZSA9IF9saW1pdC5kZWJvdW5jZTtcblxuLyoqXG4gKiBMaW1pdCB0aGUgcmF0ZSBvZiBldmVudHNcbiAqIHN0cmVhbTogICAgICAgICAgICAgIGFiY2QtLS0tYWJjZC0tLS1cbiAqIHRocm90dGxlKDIsIHN0cmVhbSk6IGEtYy0tLS0tYS1jLS0tLS1cbiAqIEBwYXJhbSB7TnVtYmVyfSBwZXJpb2QgdGltZSB0byBzdXBwcmVzcyBldmVudHNcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gdGhhdCBza2lwcyBldmVudHMgZm9yIHRocm90dGxlIHBlcmlvZFxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnRocm90dGxlID0gZnVuY3Rpb24gKHBlcmlvZCkge1xuICByZXR1cm4gKDAsIF9saW1pdC50aHJvdHRsZSkocGVyaW9kLCB0aGlzKTtcbn07XG5cbi8qKlxuICogV2FpdCBmb3IgYSBidXJzdCBvZiBldmVudHMgdG8gc3Vic2lkZSBhbmQgZW1pdCBvbmx5IHRoZSBsYXN0IGV2ZW50IGluIHRoZSBidXJzdFxuICogc3RyZWFtOiAgICAgICAgICAgICAgYWJjZC0tLS1hYmNkLS0tLVxuICogZGVib3VuY2UoMiwgc3RyZWFtKTogLS0tLS1kLS0tLS0tLWQtLVxuICogQHBhcmFtIHtOdW1iZXJ9IHBlcmlvZCBldmVudHMgb2NjdXJpbmcgbW9yZSBmcmVxdWVudGx5IHRoYW4gdGhpc1xuICogIG9uIHRoZSBwcm92aWRlZCBzY2hlZHVsZXIgd2lsbCBiZSBzdXBwcmVzc2VkXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgZGVib3VuY2VkIHN0cmVhbVxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5kZWJvdW5jZSA9IGZ1bmN0aW9uIChwZXJpb2QpIHtcbiAgcmV0dXJuICgwLCBfbGltaXQuZGVib3VuY2UpKHBlcmlvZCwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQXdhaXRpbmcgUHJvbWlzZXNcblxuLy8gQGRlcHJlY2F0ZWQgYXdhaXQsIHVzZSBhd2FpdFByb21pc2VzIGluc3RlYWRcbmV4cG9ydHMuZnJvbVByb21pc2UgPSBfcHJvbWlzZXMuZnJvbVByb21pc2U7XG5leHBvcnRzLmF3YWl0UHJvbWlzZXMgPSBfcHJvbWlzZXMuYXdhaXRQcm9taXNlcztcbmV4cG9ydHMuYXdhaXQgPSBfcHJvbWlzZXMuYXdhaXRQcm9taXNlcztcblxuLyoqXG4gKiBBd2FpdCBwcm9taXNlcywgdHVybmluZyBhIFN0cmVhbTxQcm9taXNlPFg+PiBpbnRvIFN0cmVhbTxYPi4gIFByZXNlcnZlc1xuICogZXZlbnQgb3JkZXIsIGJ1dCB0aW1lc2hpZnRzIGV2ZW50cyBiYXNlZCBvbiBwcm9taXNlIHJlc29sdXRpb24gdGltZS5cbiAqIEByZXR1cm5zIHtTdHJlYW08WD59IHN0cmVhbSBjb250YWluaW5nIG5vbi1wcm9taXNlIHZhbHVlc1xuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmF3YWl0UHJvbWlzZXMgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoMCwgX3Byb21pc2VzLmF3YWl0UHJvbWlzZXMpKHRoaXMpO1xufTtcblxuLy8gQGRlcHJlY2F0ZWQgdXNlIGF3YWl0UHJvbWlzZXMgaW5zdGVhZFxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuYXdhaXQgPSBfU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5hd2FpdFByb21pc2VzO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRXJyb3IgaGFuZGxpbmdcblxuLy8gQGRlcHJlY2F0ZWQgZmxhdE1hcEVycm9yLCB1c2UgcmVjb3ZlcldpdGggaW5zdGVhZFxuZXhwb3J0cy5yZWNvdmVyV2l0aCA9IF9lcnJvcnMucmVjb3ZlcldpdGg7XG5leHBvcnRzLmZsYXRNYXBFcnJvciA9IF9lcnJvcnMuZmxhdE1hcEVycm9yO1xuZXhwb3J0cy50aHJvd0Vycm9yID0gX2Vycm9ycy50aHJvd0Vycm9yO1xuXG4vKipcbiAqIElmIHRoaXMgc3RyZWFtIGVuY291bnRlcnMgYW4gZXJyb3IsIHJlY292ZXIgYW5kIGNvbnRpbnVlIHdpdGggaXRlbXMgZnJvbSBzdHJlYW1cbiAqIHJldHVybmVkIGJ5IGYuXG4gKiBzdHJlYW06ICAgICAgICAgICAgICAgICAgLWEtYi1jLVgtXG4gKiBmKFgpOiAgICAgICAgICAgICAgICAgICAgICAgICAgIGQtZS1mLWctXG4gKiBmbGF0TWFwRXJyb3IoZiwgc3RyZWFtKTogLWEtYi1jLWQtZS1mLWctXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGVycm9yOiopOlN0cmVhbX0gZiBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGEgbmV3IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aGljaCB3aWxsIHJlY292ZXIgZnJvbSBhbiBlcnJvciBieSBjYWxsaW5nIGZcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5yZWNvdmVyV2l0aCA9IGZ1bmN0aW9uIChmKSB7XG4gIHJldHVybiAoMCwgX2Vycm9ycy5mbGF0TWFwRXJyb3IpKGYsIHRoaXMpO1xufTtcblxuLy8gQGRlcHJlY2F0ZWQgdXNlIHJlY292ZXJXaXRoIGluc3RlYWRcbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmZsYXRNYXBFcnJvciA9IF9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnJlY292ZXJXaXRoO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gTXVsdGljYXN0aW5nXG5cbmV4cG9ydHMubXVsdGljYXN0ID0gX211bHRpY2FzdDIuZGVmYXVsdDtcblxuLyoqXG4gKiBUcmFuc2Zvcm0gdGhlIHN0cmVhbSBpbnRvIG11bHRpY2FzdCBzdHJlYW0uICBUaGF0IG1lYW5zIHRoYXQgbWFueSBzdWJzY3JpYmVyc1xuICogdG8gdGhlIHN0cmVhbSB3aWxsIG5vdCBjYXVzZSBtdWx0aXBsZSBpbnZvY2F0aW9ucyBvZiB0aGUgaW50ZXJuYWwgbWFjaGluZXJ5LlxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aGljaCB3aWxsIG11bHRpY2FzdCBldmVudHMgdG8gYWxsIG9ic2VydmVycy5cbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5tdWx0aWNhc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoMCwgX211bHRpY2FzdDIuZGVmYXVsdCkodGhpcyk7XG59O1xuXG4vLyBleHBvcnQgdGhlIGluc3RhbmNlIG9mIHRoZSBkZWZhdWx0U2NoZWR1bGVyIGZvciB0aGlyZC1wYXJ0eSBsaWJyYXJpZXNcbmV4cG9ydHMuZGVmYXVsdFNjaGVkdWxlciA9IF9kZWZhdWx0U2NoZWR1bGVyMi5kZWZhdWx0O1xuXG4vLyBleHBvcnQgYW4gaW1wbGVtZW50YXRpb24gb2YgVGFzayB1c2VkIGludGVybmFsbHkgZm9yIHRoaXJkLXBhcnR5IGxpYnJhcmllc1xuXG5leHBvcnRzLlByb3BhZ2F0ZVRhc2sgPSBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdDsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGludm9rZTtcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBpbnZva2UoZiwgYXJncykge1xuICAvKmVzbGludCBjb21wbGV4aXR5OiBbMiw3XSovXG4gIHN3aXRjaCAoYXJncy5sZW5ndGgpIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gZigpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBmKGFyZ3NbMF0pO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBmKGFyZ3NbMF0sIGFyZ3NbMV0pO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBmKGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0pO1xuICAgIGNhc2UgNDpcbiAgICAgIHJldHVybiBmKGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0sIGFyZ3NbM10pO1xuICAgIGNhc2UgNTpcbiAgICAgIHJldHVybiBmKGFyZ3NbMF0sIGFyZ3NbMV0sIGFyZ3NbMl0sIGFyZ3NbM10sIGFyZ3NbNF0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gZi5hcHBseSh2b2lkIDAsIGFyZ3MpO1xuICB9XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5pc0l0ZXJhYmxlID0gaXNJdGVyYWJsZTtcbmV4cG9ydHMuZ2V0SXRlcmF0b3IgPSBnZXRJdGVyYXRvcjtcbmV4cG9ydHMubWFrZUl0ZXJhYmxlID0gbWFrZUl0ZXJhYmxlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbi8qZ2xvYmFsIFNldCwgU3ltYm9sKi9cbnZhciBpdGVyYXRvclN5bWJvbDtcbi8vIEZpcmVmb3ggc2hpcHMgYSBwYXJ0aWFsIGltcGxlbWVudGF0aW9uIHVzaW5nIHRoZSBuYW1lIEBAaXRlcmF0b3IuXG4vLyBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD05MDcwNzcjYzE0XG5pZiAodHlwZW9mIFNldCA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgbmV3IFNldCgpWydAQGl0ZXJhdG9yJ10gPT09ICdmdW5jdGlvbicpIHtcbiAgaXRlcmF0b3JTeW1ib2wgPSAnQEBpdGVyYXRvcic7XG59IGVsc2Uge1xuICBpdGVyYXRvclN5bWJvbCA9IHR5cGVvZiBTeW1ib2wgPT09ICdmdW5jdGlvbicgJiYgU3ltYm9sLml0ZXJhdG9yIHx8ICdfZXM2c2hpbV9pdGVyYXRvcl8nO1xufVxuXG5mdW5jdGlvbiBpc0l0ZXJhYmxlKG8pIHtcbiAgcmV0dXJuIHR5cGVvZiBvW2l0ZXJhdG9yU3ltYm9sXSA9PT0gJ2Z1bmN0aW9uJztcbn1cblxuZnVuY3Rpb24gZ2V0SXRlcmF0b3Iobykge1xuICByZXR1cm4gb1tpdGVyYXRvclN5bWJvbF0oKTtcbn1cblxuZnVuY3Rpb24gbWFrZUl0ZXJhYmxlKGYsIG8pIHtcbiAgb1tpdGVyYXRvclN5bWJvbF0gPSBmO1xuICByZXR1cm4gbztcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZyb21PYnNlcnZhYmxlID0gZnJvbU9ic2VydmFibGU7XG5leHBvcnRzLk9ic2VydmFibGVTb3VyY2UgPSBPYnNlcnZhYmxlU291cmNlO1xuZXhwb3J0cy5TdWJzY3JpYmVyU2luayA9IFN1YnNjcmliZXJTaW5rO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gZnJvbU9ic2VydmFibGUob2JzZXJ2YWJsZSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IE9ic2VydmFibGVTb3VyY2Uob2JzZXJ2YWJsZSkpO1xufVxuXG5mdW5jdGlvbiBPYnNlcnZhYmxlU291cmNlKG9ic2VydmFibGUpIHtcbiAgdGhpcy5vYnNlcnZhYmxlID0gb2JzZXJ2YWJsZTtcbn1cblxuT2JzZXJ2YWJsZVNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgc3ViID0gdGhpcy5vYnNlcnZhYmxlLnN1YnNjcmliZShuZXcgU3Vic2NyaWJlclNpbmsoc2luaywgc2NoZWR1bGVyKSk7XG4gIGlmICh0eXBlb2Ygc3ViID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcmV0dXJuIGRpc3Bvc2UuY3JlYXRlKHN1Yik7XG4gIH0gZWxzZSBpZiAoc3ViICYmIHR5cGVvZiBzdWIudW5zdWJzY3JpYmUgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZGlzcG9zZS5jcmVhdGUodW5zdWJzY3JpYmUsIHN1Yik7XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdPYnNlcnZhYmxlIHJldHVybmVkIGludmFsaWQgc3Vic2NyaXB0aW9uICcgKyBTdHJpbmcoc3ViKSk7XG59O1xuXG5mdW5jdGlvbiBTdWJzY3JpYmVyU2luayhzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG59XG5cblN1YnNjcmliZXJTaW5rLnByb3RvdHlwZS5uZXh0ID0gZnVuY3Rpb24gKHgpIHtcbiAgdGhpcy5zaW5rLmV2ZW50KHRoaXMuc2NoZWR1bGVyLm5vdygpLCB4KTtcbn07XG5cblN1YnNjcmliZXJTaW5rLnByb3RvdHlwZS5jb21wbGV0ZSA9IGZ1bmN0aW9uICh4KSB7XG4gIHRoaXMuc2luay5lbmQodGhpcy5zY2hlZHVsZXIubm93KCksIHgpO1xufTtcblxuU3Vic2NyaWJlclNpbmsucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgdGhpcy5zaW5rLmVycm9yKHRoaXMuc2NoZWR1bGVyLm5vdygpLCBlKTtcbn07XG5cbmZ1bmN0aW9uIHVuc3Vic2NyaWJlKHN1YnNjcmlwdGlvbikge1xuICByZXR1cm4gc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKCk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gZ2V0T2JzZXJ2YWJsZTtcblxudmFyIF9zeW1ib2xPYnNlcnZhYmxlID0gcmVxdWlyZSgnc3ltYm9sLW9ic2VydmFibGUnKTtcblxudmFyIF9zeW1ib2xPYnNlcnZhYmxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3N5bWJvbE9ic2VydmFibGUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBnZXRPYnNlcnZhYmxlKG8pIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIHZhciBvYnMgPSBudWxsO1xuICBpZiAobykge1xuICAgIC8vIEFjY2VzcyBmb3JlaWduIG1ldGhvZCBvbmx5IG9uY2VcbiAgICB2YXIgbWV0aG9kID0gb1tfc3ltYm9sT2JzZXJ2YWJsZTIuZGVmYXVsdF07XG4gICAgaWYgKHR5cGVvZiBtZXRob2QgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIG9icyA9IG1ldGhvZC5jYWxsKG8pO1xuICAgICAgaWYgKCEob2JzICYmIHR5cGVvZiBvYnMuc3Vic2NyaWJlID09PSAnZnVuY3Rpb24nKSkge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpbnZhbGlkIG9ic2VydmFibGUgJyArIG9icyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG9icztcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5zdWJzY3JpYmUgPSBzdWJzY3JpYmU7XG5leHBvcnRzLlN1YnNjcmliZU9ic2VydmVyID0gU3Vic2NyaWJlT2JzZXJ2ZXI7XG5leHBvcnRzLlN1YnNjcmlwdGlvbiA9IFN1YnNjcmlwdGlvbjtcblxudmFyIF9kZWZhdWx0U2NoZWR1bGVyID0gcmVxdWlyZSgnLi4vc2NoZWR1bGVyL2RlZmF1bHRTY2hlZHVsZXInKTtcblxudmFyIF9kZWZhdWx0U2NoZWR1bGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2RlZmF1bHRTY2hlZHVsZXIpO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfZmF0YWxFcnJvciA9IHJlcXVpcmUoJy4uL2ZhdGFsRXJyb3InKTtcblxudmFyIF9mYXRhbEVycm9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZhdGFsRXJyb3IpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gc3Vic2NyaWJlKHN1YnNjcmliZXIsIHN0cmVhbSkge1xuICBpZiAoc3Vic2NyaWJlciA9PSBudWxsIHx8IHR5cGVvZiBzdWJzY3JpYmVyICE9PSAnb2JqZWN0Jykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3N1YnNjcmliZXIgbXVzdCBiZSBhbiBvYmplY3QnKTtcbiAgfVxuXG4gIHZhciBkaXNwb3NhYmxlID0gZGlzcG9zZS5zZXR0YWJsZSgpO1xuICB2YXIgb2JzZXJ2ZXIgPSBuZXcgU3Vic2NyaWJlT2JzZXJ2ZXIoX2ZhdGFsRXJyb3IyLmRlZmF1bHQsIHN1YnNjcmliZXIsIGRpc3Bvc2FibGUpO1xuXG4gIGRpc3Bvc2FibGUuc2V0RGlzcG9zYWJsZShzdHJlYW0uc291cmNlLnJ1bihvYnNlcnZlciwgX2RlZmF1bHRTY2hlZHVsZXIyLmRlZmF1bHQpKTtcblxuICByZXR1cm4gbmV3IFN1YnNjcmlwdGlvbihkaXNwb3NhYmxlKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFN1YnNjcmliZU9ic2VydmVyKGZhdGFsRXJyb3IsIHN1YnNjcmliZXIsIGRpc3Bvc2FibGUpIHtcbiAgdGhpcy5mYXRhbEVycm9yID0gZmF0YWxFcnJvcjtcbiAgdGhpcy5zdWJzY3JpYmVyID0gc3Vic2NyaWJlcjtcbiAgdGhpcy5kaXNwb3NhYmxlID0gZGlzcG9zYWJsZTtcbn1cblxuU3Vic2NyaWJlT2JzZXJ2ZXIucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZWQgJiYgdHlwZW9mIHRoaXMuc3Vic2NyaWJlci5uZXh0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhpcy5zdWJzY3JpYmVyLm5leHQoeCk7XG4gIH1cbn07XG5cblN1YnNjcmliZU9ic2VydmVyLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlZCkge1xuICAgIHZhciBzID0gdGhpcy5zdWJzY3JpYmVyO1xuICAgIGRvRGlzcG9zZSh0aGlzLmZhdGFsRXJyb3IsIHMsIHMuY29tcGxldGUsIHMuZXJyb3IsIHRoaXMuZGlzcG9zYWJsZSwgeCk7XG4gIH1cbn07XG5cblN1YnNjcmliZU9ic2VydmVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHZhciBzID0gdGhpcy5zdWJzY3JpYmVyO1xuICBkb0Rpc3Bvc2UodGhpcy5mYXRhbEVycm9yLCBzLCBzLmVycm9yLCBzLmVycm9yLCB0aGlzLmRpc3Bvc2FibGUsIGUpO1xufTtcblxuZnVuY3Rpb24gU3Vic2NyaXB0aW9uKGRpc3Bvc2FibGUpIHtcbiAgdGhpcy5kaXNwb3NhYmxlID0gZGlzcG9zYWJsZTtcbn1cblxuU3Vic2NyaXB0aW9uLnByb3RvdHlwZS51bnN1YnNjcmliZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07XG5cbmZ1bmN0aW9uIGRvRGlzcG9zZShmYXRhbCwgc3Vic2NyaWJlciwgY29tcGxldGUsIGVycm9yLCBkaXNwb3NhYmxlLCB4KSB7XG4gIFByb21pc2UucmVzb2x2ZShkaXNwb3NhYmxlLmRpc3Bvc2UoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgaWYgKHR5cGVvZiBjb21wbGV0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29tcGxldGUuY2FsbChzdWJzY3JpYmVyLCB4KTtcbiAgICB9XG4gIH0pLmNhdGNoKGZ1bmN0aW9uIChlKSB7XG4gICAgaWYgKHR5cGVvZiBlcnJvciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgZXJyb3IuY2FsbChzdWJzY3JpYmVyLCBlKTtcbiAgICB9XG4gIH0pLmNhdGNoKGZhdGFsKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLndpdGhEZWZhdWx0U2NoZWR1bGVyID0gd2l0aERlZmF1bHRTY2hlZHVsZXI7XG5leHBvcnRzLndpdGhTY2hlZHVsZXIgPSB3aXRoU2NoZWR1bGVyO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9kZWZhdWx0U2NoZWR1bGVyID0gcmVxdWlyZSgnLi9zY2hlZHVsZXIvZGVmYXVsdFNjaGVkdWxlcicpO1xuXG52YXIgX2RlZmF1bHRTY2hlZHVsZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZGVmYXVsdFNjaGVkdWxlcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gd2l0aERlZmF1bHRTY2hlZHVsZXIoc291cmNlKSB7XG4gIHJldHVybiB3aXRoU2NoZWR1bGVyKHNvdXJjZSwgX2RlZmF1bHRTY2hlZHVsZXIyLmRlZmF1bHQpO1xufVxuXG5mdW5jdGlvbiB3aXRoU2NoZWR1bGVyKHNvdXJjZSwgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgcnVuU291cmNlKHNvdXJjZSwgc2NoZWR1bGVyLCByZXNvbHZlLCByZWplY3QpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gcnVuU291cmNlKHNvdXJjZSwgc2NoZWR1bGVyLCByZXNvbHZlLCByZWplY3QpIHtcbiAgdmFyIGRpc3Bvc2FibGUgPSBkaXNwb3NlLnNldHRhYmxlKCk7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBEcmFpbihyZXNvbHZlLCByZWplY3QsIGRpc3Bvc2FibGUpO1xuXG4gIGRpc3Bvc2FibGUuc2V0RGlzcG9zYWJsZShzb3VyY2UucnVuKG9ic2VydmVyLCBzY2hlZHVsZXIpKTtcbn1cblxuZnVuY3Rpb24gRHJhaW4oZW5kLCBlcnJvciwgZGlzcG9zYWJsZSkge1xuICB0aGlzLl9lbmQgPSBlbmQ7XG4gIHRoaXMuX2Vycm9yID0gZXJyb3I7XG4gIHRoaXMuX2Rpc3Bvc2FibGUgPSBkaXNwb3NhYmxlO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG59XG5cbkRyYWluLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7fTtcblxuRHJhaW4ucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgZGlzcG9zZVRoZW4odGhpcy5fZW5kLCB0aGlzLl9lcnJvciwgdGhpcy5fZGlzcG9zYWJsZSwgeCk7XG59O1xuXG5EcmFpbi5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICBkaXNwb3NlVGhlbih0aGlzLl9lcnJvciwgdGhpcy5fZXJyb3IsIHRoaXMuX2Rpc3Bvc2FibGUsIGUpO1xufTtcblxuZnVuY3Rpb24gZGlzcG9zZVRoZW4oZW5kLCBlcnJvciwgZGlzcG9zYWJsZSwgeCkge1xuICBQcm9taXNlLnJlc29sdmUoZGlzcG9zYWJsZS5kaXNwb3NlKCkpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIGVuZCh4KTtcbiAgfSwgZXJyb3IpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IENsb2NrVGltZXI7XG5cbnZhciBfdGFzayA9IHJlcXVpcmUoJy4uL3Rhc2snKTtcblxuLypnbG9iYWwgc2V0VGltZW91dCwgY2xlYXJUaW1lb3V0Ki9cblxuZnVuY3Rpb24gQ2xvY2tUaW1lcigpIHt9IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5DbG9ja1RpbWVyLnByb3RvdHlwZS5ub3cgPSBEYXRlLm5vdztcblxuQ2xvY2tUaW1lci5wcm90b3R5cGUuc2V0VGltZXIgPSBmdW5jdGlvbiAoZiwgZHQpIHtcbiAgcmV0dXJuIGR0IDw9IDAgPyBydW5Bc2FwKGYpIDogc2V0VGltZW91dChmLCBkdCk7XG59O1xuXG5DbG9ja1RpbWVyLnByb3RvdHlwZS5jbGVhclRpbWVyID0gZnVuY3Rpb24gKHQpIHtcbiAgcmV0dXJuIHQgaW5zdGFuY2VvZiBBc2FwID8gdC5jYW5jZWwoKSA6IGNsZWFyVGltZW91dCh0KTtcbn07XG5cbmZ1bmN0aW9uIEFzYXAoZikge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG59XG5cbkFzYXAucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuYWN0aXZlICYmIHRoaXMuZigpO1xufTtcblxuQXNhcC5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICB0aHJvdyBlO1xufTtcblxuQXNhcC5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTtcblxuZnVuY3Rpb24gcnVuQXNhcChmKSB7XG4gIHZhciB0YXNrID0gbmV3IEFzYXAoZik7XG4gICgwLCBfdGFzay5kZWZlcikodGFzayk7XG4gIHJldHVybiB0YXNrO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFByb3BhZ2F0ZVRhc2s7XG5cbnZhciBfZmF0YWxFcnJvciA9IHJlcXVpcmUoJy4uL2ZhdGFsRXJyb3InKTtcblxudmFyIF9mYXRhbEVycm9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZhdGFsRXJyb3IpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBQcm9wYWdhdGVUYXNrKHJ1biwgdmFsdWUsIHNpbmspIHtcbiAgdGhpcy5fcnVuID0gcnVuO1xuICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cblByb3BhZ2F0ZVRhc2suZXZlbnQgPSBmdW5jdGlvbiAodmFsdWUsIHNpbmspIHtcbiAgcmV0dXJuIG5ldyBQcm9wYWdhdGVUYXNrKGVtaXQsIHZhbHVlLCBzaW5rKTtcbn07XG5cblByb3BhZ2F0ZVRhc2suZW5kID0gZnVuY3Rpb24gKHZhbHVlLCBzaW5rKSB7XG4gIHJldHVybiBuZXcgUHJvcGFnYXRlVGFzayhlbmQsIHZhbHVlLCBzaW5rKTtcbn07XG5cblByb3BhZ2F0ZVRhc2suZXJyb3IgPSBmdW5jdGlvbiAodmFsdWUsIHNpbmspIHtcbiAgcmV0dXJuIG5ldyBQcm9wYWdhdGVUYXNrKGVycm9yLCB2YWx1ZSwgc2luayk7XG59O1xuXG5Qcm9wYWdhdGVUYXNrLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTtcblxuUHJvcGFnYXRlVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHQpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLl9ydW4odCwgdGhpcy52YWx1ZSwgdGhpcy5zaW5rKTtcbn07XG5cblByb3BhZ2F0ZVRhc2sucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybiAoMCwgX2ZhdGFsRXJyb3IyLmRlZmF1bHQpKGUpO1xuICB9XG4gIHRoaXMuc2luay5lcnJvcih0LCBlKTtcbn07XG5cbmZ1bmN0aW9uIGVycm9yKHQsIGUsIHNpbmspIHtcbiAgc2luay5lcnJvcih0LCBlKTtcbn1cblxuZnVuY3Rpb24gZW1pdCh0LCB4LCBzaW5rKSB7XG4gIHNpbmsuZXZlbnQodCwgeCk7XG59XG5cbmZ1bmN0aW9uIGVuZCh0LCB4LCBzaW5rKSB7XG4gIHNpbmsuZW5kKHQsIHgpO1xufSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU2NoZWR1bGVkVGFzaztcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBTY2hlZHVsZWRUYXNrKGRlbGF5LCBwZXJpb2QsIHRhc2ssIHNjaGVkdWxlcikge1xuICB0aGlzLnRpbWUgPSBkZWxheTtcbiAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gIHRoaXMudGFzayA9IHRhc2s7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG59XG5cblNjaGVkdWxlZFRhc2sucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudGFzay5ydW4odGhpcy50aW1lKTtcbn07XG5cblNjaGVkdWxlZFRhc2sucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgcmV0dXJuIHRoaXMudGFzay5lcnJvcih0aGlzLnRpbWUsIGUpO1xufTtcblxuU2NoZWR1bGVkVGFzay5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5zY2hlZHVsZXIuY2FuY2VsKHRoaXMpO1xuICByZXR1cm4gdGhpcy50YXNrLmRpc3Bvc2UoKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU2NoZWR1bGVyO1xuXG52YXIgX1NjaGVkdWxlZFRhc2sgPSByZXF1aXJlKCcuL1NjaGVkdWxlZFRhc2snKTtcblxudmFyIF9TY2hlZHVsZWRUYXNrMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1NjaGVkdWxlZFRhc2spO1xuXG52YXIgX3Rhc2sgPSByZXF1aXJlKCcuLi90YXNrJyk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBTY2hlZHVsZXIodGltZXIsIHRpbWVsaW5lKSB7XG4gIHRoaXMudGltZXIgPSB0aW1lcjtcbiAgdGhpcy50aW1lbGluZSA9IHRpbWVsaW5lO1xuXG4gIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgdGhpcy5fbmV4dEFycml2YWwgPSBJbmZpbml0eTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuX3J1blJlYWR5VGFza3NCb3VuZCA9IGZ1bmN0aW9uICgpIHtcbiAgICBzZWxmLl9ydW5SZWFkeVRhc2tzKHNlbGYubm93KCkpO1xuICB9O1xufVxuXG5TY2hlZHVsZXIucHJvdG90eXBlLm5vdyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudGltZXIubm93KCk7XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLmFzYXAgPSBmdW5jdGlvbiAodGFzaykge1xuICByZXR1cm4gdGhpcy5zY2hlZHVsZSgwLCAtMSwgdGFzayk7XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLmRlbGF5ID0gZnVuY3Rpb24gKGRlbGF5LCB0YXNrKSB7XG4gIHJldHVybiB0aGlzLnNjaGVkdWxlKGRlbGF5LCAtMSwgdGFzayk7XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLnBlcmlvZGljID0gZnVuY3Rpb24gKHBlcmlvZCwgdGFzaykge1xuICByZXR1cm4gdGhpcy5zY2hlZHVsZSgwLCBwZXJpb2QsIHRhc2spO1xufTtcblxuU2NoZWR1bGVyLnByb3RvdHlwZS5zY2hlZHVsZSA9IGZ1bmN0aW9uIChkZWxheSwgcGVyaW9kLCB0YXNrKSB7XG4gIHZhciBub3cgPSB0aGlzLm5vdygpO1xuICB2YXIgc3QgPSBuZXcgX1NjaGVkdWxlZFRhc2syLmRlZmF1bHQobm93ICsgTWF0aC5tYXgoMCwgZGVsYXkpLCBwZXJpb2QsIHRhc2ssIHRoaXMpO1xuXG4gIHRoaXMudGltZWxpbmUuYWRkKHN0KTtcbiAgdGhpcy5fc2NoZWR1bGVOZXh0UnVuKG5vdyk7XG4gIHJldHVybiBzdDtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuY2FuY2VsID0gZnVuY3Rpb24gKHRhc2spIHtcbiAgdGFzay5hY3RpdmUgPSBmYWxzZTtcbiAgaWYgKHRoaXMudGltZWxpbmUucmVtb3ZlKHRhc2spKSB7XG4gICAgdGhpcy5fcmVzY2hlZHVsZSgpO1xuICB9XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLmNhbmNlbEFsbCA9IGZ1bmN0aW9uIChmKSB7XG4gIHRoaXMudGltZWxpbmUucmVtb3ZlQWxsKGYpO1xuICB0aGlzLl9yZXNjaGVkdWxlKCk7XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLl9yZXNjaGVkdWxlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy50aW1lbGluZS5pc0VtcHR5KCkpIHtcbiAgICB0aGlzLl91bnNjaGVkdWxlKCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fc2NoZWR1bGVOZXh0UnVuKHRoaXMubm93KCkpO1xuICB9XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLl91bnNjaGVkdWxlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnRpbWVyLmNsZWFyVGltZXIodGhpcy5fdGltZXIpO1xuICB0aGlzLl90aW1lciA9IG51bGw7XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLl9zY2hlZHVsZU5leHRSdW4gPSBmdW5jdGlvbiAobm93KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICBpZiAodGhpcy50aW1lbGluZS5pc0VtcHR5KCkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbmV4dEFycml2YWwgPSB0aGlzLnRpbWVsaW5lLm5leHRBcnJpdmFsKCk7XG5cbiAgaWYgKHRoaXMuX3RpbWVyID09PSBudWxsKSB7XG4gICAgdGhpcy5fc2NoZWR1bGVOZXh0QXJyaXZhbChuZXh0QXJyaXZhbCwgbm93KTtcbiAgfSBlbHNlIGlmIChuZXh0QXJyaXZhbCA8IHRoaXMuX25leHRBcnJpdmFsKSB7XG4gICAgdGhpcy5fdW5zY2hlZHVsZSgpO1xuICAgIHRoaXMuX3NjaGVkdWxlTmV4dEFycml2YWwobmV4dEFycml2YWwsIG5vdyk7XG4gIH1cbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuX3NjaGVkdWxlTmV4dEFycml2YWwgPSBmdW5jdGlvbiAobmV4dEFycml2YWwsIG5vdykge1xuICB0aGlzLl9uZXh0QXJyaXZhbCA9IG5leHRBcnJpdmFsO1xuICB2YXIgZGVsYXkgPSBNYXRoLm1heCgwLCBuZXh0QXJyaXZhbCAtIG5vdyk7XG4gIHRoaXMuX3RpbWVyID0gdGhpcy50aW1lci5zZXRUaW1lcih0aGlzLl9ydW5SZWFkeVRhc2tzQm91bmQsIGRlbGF5KTtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuX3J1blJlYWR5VGFza3MgPSBmdW5jdGlvbiAobm93KSB7XG4gIHRoaXMuX3RpbWVyID0gbnVsbDtcbiAgdGhpcy50aW1lbGluZS5ydW5UYXNrcyhub3csIF90YXNrLnJ1blRhc2spO1xuICB0aGlzLl9zY2hlZHVsZU5leHRSdW4odGhpcy5ub3coKSk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFRpbWVsaW5lO1xuXG52YXIgX3ByZWx1ZGUgPSByZXF1aXJlKCdAbW9zdC9wcmVsdWRlJyk7XG5cbnZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3ByZWx1ZGUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gVGltZWxpbmUoKSB7XG4gIHRoaXMudGFza3MgPSBbXTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cblRpbWVsaW5lLnByb3RvdHlwZS5uZXh0QXJyaXZhbCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuaXNFbXB0eSgpID8gSW5maW5pdHkgOiB0aGlzLnRhc2tzWzBdLnRpbWU7XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMudGFza3MubGVuZ3RoID09PSAwO1xufTtcblxuVGltZWxpbmUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChzdCkge1xuICBpbnNlcnRCeVRpbWUoc3QsIHRoaXMudGFza3MpO1xufTtcblxuVGltZWxpbmUucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIChzdCkge1xuICB2YXIgaSA9IGJpbmFyeVNlYXJjaChzdC50aW1lLCB0aGlzLnRhc2tzKTtcblxuICBpZiAoaSA+PSAwICYmIGkgPCB0aGlzLnRhc2tzLmxlbmd0aCkge1xuICAgIHZhciBhdCA9IGJhc2UuZmluZEluZGV4KHN0LCB0aGlzLnRhc2tzW2ldLmV2ZW50cyk7XG4gICAgaWYgKGF0ID49IDApIHtcbiAgICAgIHRoaXMudGFza3NbaV0uZXZlbnRzLnNwbGljZShhdCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucmVtb3ZlQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSB0aGlzLnRhc2tzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIHJlbW92ZUFsbEZyb20oZiwgdGhpcyQxLnRhc2tzW2ldKTtcbiAgfVxufTtcblxuVGltZWxpbmUucHJvdG90eXBlLnJ1blRhc2tzID0gZnVuY3Rpb24gKHQsIHJ1blRhc2spIHtcbiAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgdmFyIHRhc2tzID0gdGhpcy50YXNrcztcbiAgdmFyIGwgPSB0YXNrcy5sZW5ndGg7XG4gIHZhciBpID0gMDtcblxuICB3aGlsZSAoaSA8IGwgJiYgdGFza3NbaV0udGltZSA8PSB0KSB7XG4gICAgKytpO1xuICB9XG5cbiAgdGhpcy50YXNrcyA9IHRhc2tzLnNsaWNlKGkpO1xuXG4gIC8vIFJ1biBhbGwgcmVhZHkgdGFza3NcbiAgZm9yICh2YXIgaiA9IDA7IGogPCBpOyArK2opIHtcbiAgICB0aGlzJDEudGFza3MgPSBydW5UYXNrcyhydW5UYXNrLCB0YXNrc1tqXSwgdGhpcyQxLnRhc2tzKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gcnVuVGFza3MocnVuVGFzaywgdGltZXNsb3QsIHRhc2tzKSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICB2YXIgZXZlbnRzID0gdGltZXNsb3QuZXZlbnRzO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGV2ZW50cy5sZW5ndGg7ICsraSkge1xuICAgIHZhciB0YXNrID0gZXZlbnRzW2ldO1xuXG4gICAgaWYgKHRhc2suYWN0aXZlKSB7XG4gICAgICBydW5UYXNrKHRhc2spO1xuXG4gICAgICAvLyBSZXNjaGVkdWxlIHBlcmlvZGljIHJlcGVhdGluZyB0YXNrc1xuICAgICAgLy8gQ2hlY2sgYWN0aXZlIGFnYWluLCBzaW5jZSBhIHRhc2sgbWF5IGhhdmUgY2FuY2VsZWQgaXRzZWxmXG4gICAgICBpZiAodGFzay5wZXJpb2QgPj0gMCAmJiB0YXNrLmFjdGl2ZSkge1xuICAgICAgICB0YXNrLnRpbWUgPSB0YXNrLnRpbWUgKyB0YXNrLnBlcmlvZDtcbiAgICAgICAgaW5zZXJ0QnlUaW1lKHRhc2ssIHRhc2tzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGFza3M7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJ5VGltZSh0YXNrLCB0aW1lc2xvdHMpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIHZhciBsID0gdGltZXNsb3RzLmxlbmd0aDtcblxuICBpZiAobCA9PT0gMCkge1xuICAgIHRpbWVzbG90cy5wdXNoKG5ld1RpbWVzbG90KHRhc2sudGltZSwgW3Rhc2tdKSk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIGkgPSBiaW5hcnlTZWFyY2godGFzay50aW1lLCB0aW1lc2xvdHMpO1xuXG4gIGlmIChpID49IGwpIHtcbiAgICB0aW1lc2xvdHMucHVzaChuZXdUaW1lc2xvdCh0YXNrLnRpbWUsIFt0YXNrXSkpO1xuICB9IGVsc2UgaWYgKHRhc2sudGltZSA9PT0gdGltZXNsb3RzW2ldLnRpbWUpIHtcbiAgICB0aW1lc2xvdHNbaV0uZXZlbnRzLnB1c2godGFzayk7XG4gIH0gZWxzZSB7XG4gICAgdGltZXNsb3RzLnNwbGljZShpLCAwLCBuZXdUaW1lc2xvdCh0YXNrLnRpbWUsIFt0YXNrXSkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbW92ZUFsbEZyb20oZiwgdGltZXNsb3QpIHtcbiAgdGltZXNsb3QuZXZlbnRzID0gYmFzZS5yZW1vdmVBbGwoZiwgdGltZXNsb3QuZXZlbnRzKTtcbn1cblxuZnVuY3Rpb24gYmluYXJ5U2VhcmNoKHQsIHNvcnRlZEFycmF5KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICB2YXIgbG8gPSAwO1xuICB2YXIgaGkgPSBzb3J0ZWRBcnJheS5sZW5ndGg7XG4gIHZhciBtaWQsIHk7XG5cbiAgd2hpbGUgKGxvIDwgaGkpIHtcbiAgICBtaWQgPSBNYXRoLmZsb29yKChsbyArIGhpKSAvIDIpO1xuICAgIHkgPSBzb3J0ZWRBcnJheVttaWRdO1xuXG4gICAgaWYgKHQgPT09IHkudGltZSkge1xuICAgICAgcmV0dXJuIG1pZDtcbiAgICB9IGVsc2UgaWYgKHQgPCB5LnRpbWUpIHtcbiAgICAgIGhpID0gbWlkO1xuICAgIH0gZWxzZSB7XG4gICAgICBsbyA9IG1pZCArIDE7XG4gICAgfVxuICB9XG4gIHJldHVybiBoaTtcbn1cblxuZnVuY3Rpb24gbmV3VGltZXNsb3QodCwgZXZlbnRzKSB7XG4gIHJldHVybiB7IHRpbWU6IHQsIGV2ZW50czogZXZlbnRzIH07XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX1NjaGVkdWxlciA9IHJlcXVpcmUoJy4vU2NoZWR1bGVyJyk7XG5cbnZhciBfU2NoZWR1bGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1NjaGVkdWxlcik7XG5cbnZhciBfQ2xvY2tUaW1lciA9IHJlcXVpcmUoJy4vQ2xvY2tUaW1lcicpO1xuXG52YXIgX0Nsb2NrVGltZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfQ2xvY2tUaW1lcik7XG5cbnZhciBfVGltZWxpbmUgPSByZXF1aXJlKCcuL1RpbWVsaW5lJyk7XG5cbnZhciBfVGltZWxpbmUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfVGltZWxpbmUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG52YXIgZGVmYXVsdFNjaGVkdWxlciA9IG5ldyBfU2NoZWR1bGVyMi5kZWZhdWx0KG5ldyBfQ2xvY2tUaW1lcjIuZGVmYXVsdCgpLCBuZXcgX1RpbWVsaW5lMi5kZWZhdWx0KCkpOyAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZXhwb3J0cy5kZWZhdWx0ID0gZGVmYXVsdFNjaGVkdWxlcjsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBEZWZlcnJlZFNpbms7XG5cbnZhciBfdGFzayA9IHJlcXVpcmUoJy4uL3Rhc2snKTtcblxuZnVuY3Rpb24gRGVmZXJyZWRTaW5rKHNpbmspIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5ldmVudHMgPSBbXTtcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuRGVmZXJyZWRTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy5ldmVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgKDAsIF90YXNrLmRlZmVyKShuZXcgUHJvcGFnYXRlQWxsVGFzayh0aGlzLnNpbmssIHQsIHRoaXMuZXZlbnRzKSk7XG4gIH1cblxuICB0aGlzLmV2ZW50cy5wdXNoKHsgdGltZTogdCwgdmFsdWU6IHggfSk7XG59O1xuXG5EZWZlcnJlZFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aGlzLl9lbmQobmV3IEVuZFRhc2sodCwgeCwgdGhpcy5zaW5rKSk7XG59O1xuXG5EZWZlcnJlZFNpbmsucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgdGhpcy5fZW5kKG5ldyBFcnJvclRhc2sodCwgZSwgdGhpcy5zaW5rKSk7XG59O1xuXG5EZWZlcnJlZFNpbmsucHJvdG90eXBlLl9lbmQgPSBmdW5jdGlvbiAodGFzaykge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICAoMCwgX3Rhc2suZGVmZXIpKHRhc2spO1xufTtcblxuZnVuY3Rpb24gUHJvcGFnYXRlQWxsVGFzayhzaW5rLCB0aW1lLCBldmVudHMpIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5ldmVudHMgPSBldmVudHM7XG4gIHRoaXMudGltZSA9IHRpbWU7XG59XG5cblByb3BhZ2F0ZUFsbFRhc2sucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgdmFyIGV2ZW50cyA9IHRoaXMuZXZlbnRzO1xuICB2YXIgc2luayA9IHRoaXMuc2luaztcbiAgdmFyIGV2ZW50O1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gZXZlbnRzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGV2ZW50ID0gZXZlbnRzW2ldO1xuICAgIHRoaXMkMS50aW1lID0gZXZlbnQudGltZTtcbiAgICBzaW5rLmV2ZW50KGV2ZW50LnRpbWUsIGV2ZW50LnZhbHVlKTtcbiAgfVxuXG4gIGV2ZW50cy5sZW5ndGggPSAwO1xufTtcblxuUHJvcGFnYXRlQWxsVGFzay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICB0aGlzLnNpbmsuZXJyb3IodGhpcy50aW1lLCBlKTtcbn07XG5cbmZ1bmN0aW9uIEVuZFRhc2sodCwgeCwgc2luaykge1xuICB0aGlzLnRpbWUgPSB0O1xuICB0aGlzLnZhbHVlID0geDtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuRW5kVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNpbmsuZW5kKHRoaXMudGltZSwgdGhpcy52YWx1ZSk7XG59O1xuXG5FbmRUYXNrLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gIHRoaXMuc2luay5lcnJvcih0aGlzLnRpbWUsIGUpO1xufTtcblxuZnVuY3Rpb24gRXJyb3JUYXNrKHQsIGUsIHNpbmspIHtcbiAgdGhpcy50aW1lID0gdDtcbiAgdGhpcy52YWx1ZSA9IGU7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cbkVycm9yVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNpbmsuZXJyb3IodGhpcy50aW1lLCB0aGlzLnZhbHVlKTtcbn07XG5cbkVycm9yVGFzay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICB0aHJvdyBlO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBJbmRleFNpbms7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4vUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIEluZGV4U2luayhpLCBzaW5rKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuaW5kZXggPSBpO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gIHRoaXMudmFsdWUgPSB2b2lkIDA7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5JbmRleFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnZhbHVlID0geDtcbiAgdGhpcy5zaW5rLmV2ZW50KHQsIHRoaXMpO1xufTtcblxuSW5kZXhTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIHRoaXMuc2luay5lbmQodCwgeyBpbmRleDogdGhpcy5pbmRleCwgdmFsdWU6IHggfSk7XG59O1xuXG5JbmRleFNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yOyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gUGlwZTtcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG4vKipcbiAqIEEgc2luayBtaXhpbiB0aGF0IHNpbXBseSBmb3J3YXJkcyBldmVudCwgZW5kLCBhbmQgZXJyb3IgdG9cbiAqIGFub3RoZXIgc2luay5cbiAqIEBwYXJhbSBzaW5rXG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gUGlwZShzaW5rKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cblBpcGUucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgcmV0dXJuIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbn07XG5cblBpcGUucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHJldHVybiB0aGlzLnNpbmsuZW5kKHQsIHgpO1xufTtcblxuUGlwZS5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICByZXR1cm4gdGhpcy5zaW5rLmVycm9yKHQsIGUpO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IFNhZmVTaW5rO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFNhZmVTaW5rKHNpbmspIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xufVxuXG5TYWZlU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbn07XG5cblNhZmVTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuZGlzYWJsZSgpO1xuICB0aGlzLnNpbmsuZW5kKHQsIHgpO1xufTtcblxuU2FmZVNpbmsucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgdGhpcy5kaXNhYmxlKCk7XG4gIHRoaXMuc2luay5lcnJvcih0LCBlKTtcbn07XG5cblNhZmVTaW5rLnByb3RvdHlwZS5kaXNhYmxlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICByZXR1cm4gdGhpcy5zaW5rO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBFdmVudEVtaXR0ZXJTb3VyY2U7XG5cbnZhciBfRGVmZXJyZWRTaW5rID0gcmVxdWlyZSgnLi4vc2luay9EZWZlcnJlZFNpbmsnKTtcblxudmFyIF9EZWZlcnJlZFNpbmsyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfRGVmZXJyZWRTaW5rKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX3RyeUV2ZW50ID0gcmVxdWlyZSgnLi90cnlFdmVudCcpO1xuXG52YXIgdHJ5RXZlbnQgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdHJ5RXZlbnQpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gRXZlbnRFbWl0dGVyU291cmNlKGV2ZW50LCBzb3VyY2UpIHtcbiAgdGhpcy5ldmVudCA9IGV2ZW50O1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbkV2ZW50RW1pdHRlclNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICAvLyBOT1RFOiBCZWNhdXNlIEV2ZW50RW1pdHRlciBhbGxvd3MgZXZlbnRzIGluIHRoZSBzYW1lIGNhbGwgc3RhY2sgYXNcbiAgLy8gYSBsaXN0ZW5lciBpcyBhZGRlZCwgdXNlIGEgRGVmZXJyZWRTaW5rIHRvIGJ1ZmZlciBldmVudHNcbiAgLy8gdW50aWwgdGhlIHN0YWNrIGNsZWFycywgdGhlbiBwcm9wYWdhdGUuICBUaGlzIG1haW50YWlucyBtb3N0LmpzJ3NcbiAgLy8gaW52YXJpYW50IHRoYXQgbm8gZXZlbnQgd2lsbCBiZSBkZWxpdmVyZWQgaW4gdGhlIHNhbWUgY2FsbCBzdGFja1xuICAvLyBhcyBhbiBvYnNlcnZlciBiZWdpbnMgb2JzZXJ2aW5nLlxuICB2YXIgZHNpbmsgPSBuZXcgX0RlZmVycmVkU2luazIuZGVmYXVsdChzaW5rKTtcblxuICBmdW5jdGlvbiBhZGRFdmVudFZhcmlhZGljKGEpIHtcbiAgICB2YXIgYXJndW1lbnRzJDEgPSBhcmd1bWVudHM7XG5cbiAgICB2YXIgbCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgaWYgKGwgPiAxKSB7XG4gICAgICB2YXIgYXJyID0gbmV3IEFycmF5KGwpO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICAgICAgYXJyW2ldID0gYXJndW1lbnRzJDFbaV07XG4gICAgICB9XG4gICAgICB0cnlFdmVudC50cnlFdmVudChzY2hlZHVsZXIubm93KCksIGFyciwgZHNpbmspO1xuICAgIH0gZWxzZSB7XG4gICAgICB0cnlFdmVudC50cnlFdmVudChzY2hlZHVsZXIubm93KCksIGEsIGRzaW5rKTtcbiAgICB9XG4gIH1cblxuICB0aGlzLnNvdXJjZS5hZGRMaXN0ZW5lcih0aGlzLmV2ZW50LCBhZGRFdmVudFZhcmlhZGljKTtcblxuICByZXR1cm4gZGlzcG9zZS5jcmVhdGUoZGlzcG9zZUV2ZW50RW1pdHRlciwgeyB0YXJnZXQ6IHRoaXMsIGFkZEV2ZW50OiBhZGRFdmVudFZhcmlhZGljIH0pO1xufTtcblxuZnVuY3Rpb24gZGlzcG9zZUV2ZW50RW1pdHRlcihpbmZvKSB7XG4gIHZhciB0YXJnZXQgPSBpbmZvLnRhcmdldDtcbiAgdGFyZ2V0LnNvdXJjZS5yZW1vdmVMaXN0ZW5lcih0YXJnZXQuZXZlbnQsIGluZm8uYWRkRXZlbnQpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEV2ZW50VGFyZ2V0U291cmNlO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfdHJ5RXZlbnQgPSByZXF1aXJlKCcuL3RyeUV2ZW50Jyk7XG5cbnZhciB0cnlFdmVudCA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF90cnlFdmVudCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gRXZlbnRUYXJnZXRTb3VyY2UoZXZlbnQsIHNvdXJjZSwgY2FwdHVyZSkge1xuICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xuICB0aGlzLmNhcHR1cmUgPSBjYXB0dXJlO1xufVxuXG5FdmVudFRhcmdldFNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICBmdW5jdGlvbiBhZGRFdmVudChlKSB7XG4gICAgdHJ5RXZlbnQudHJ5RXZlbnQoc2NoZWR1bGVyLm5vdygpLCBlLCBzaW5rKTtcbiAgfVxuXG4gIHRoaXMuc291cmNlLmFkZEV2ZW50TGlzdGVuZXIodGhpcy5ldmVudCwgYWRkRXZlbnQsIHRoaXMuY2FwdHVyZSk7XG5cbiAgcmV0dXJuIGRpc3Bvc2UuY3JlYXRlKGRpc3Bvc2VFdmVudFRhcmdldCwgeyB0YXJnZXQ6IHRoaXMsIGFkZEV2ZW50OiBhZGRFdmVudCB9KTtcbn07XG5cbmZ1bmN0aW9uIGRpc3Bvc2VFdmVudFRhcmdldChpbmZvKSB7XG4gIHZhciB0YXJnZXQgPSBpbmZvLnRhcmdldDtcbiAgdGFyZ2V0LnNvdXJjZS5yZW1vdmVFdmVudExpc3RlbmVyKHRhcmdldC5ldmVudCwgaW5mby5hZGRFdmVudCwgdGFyZ2V0LmNhcHR1cmUpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMub2YgPSBvZjtcbmV4cG9ydHMuZW1wdHkgPSBlbXB0eTtcbmV4cG9ydHMubmV2ZXIgPSBuZXZlcjtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIFN0cmVhbSBjb250YWluaW5nIG9ubHkgeFxuICogQHBhcmFtIHsqfSB4XG4gKiBAcmV0dXJucyB7U3RyZWFtfVxuICovXG5mdW5jdGlvbiBvZih4KSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgSnVzdCh4KSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBKdXN0KHgpIHtcbiAgdGhpcy52YWx1ZSA9IHg7XG59XG5cbkp1c3QucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHNjaGVkdWxlci5hc2FwKG5ldyBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdChydW5KdXN0LCB0aGlzLnZhbHVlLCBzaW5rKSk7XG59O1xuXG5mdW5jdGlvbiBydW5KdXN0KHQsIHgsIHNpbmspIHtcbiAgc2luay5ldmVudCh0LCB4KTtcbiAgc2luay5lbmQodCwgdm9pZCAwKTtcbn1cblxuLyoqXG4gKiBTdHJlYW0gY29udGFpbmluZyBubyBldmVudHMgYW5kIGVuZHMgaW1tZWRpYXRlbHlcbiAqIEByZXR1cm5zIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIGVtcHR5KCkge1xuICByZXR1cm4gRU1QVFk7XG59XG5cbmZ1bmN0aW9uIEVtcHR5U291cmNlKCkge31cblxuRW1wdHlTb3VyY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIHRhc2sgPSBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdC5lbmQodm9pZCAwLCBzaW5rKTtcbiAgc2NoZWR1bGVyLmFzYXAodGFzayk7XG5cbiAgcmV0dXJuIGRpc3Bvc2UuY3JlYXRlKGRpc3Bvc2VFbXB0eSwgdGFzayk7XG59O1xuXG5mdW5jdGlvbiBkaXNwb3NlRW1wdHkodGFzaykge1xuICByZXR1cm4gdGFzay5kaXNwb3NlKCk7XG59XG5cbnZhciBFTVBUWSA9IG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBFbXB0eVNvdXJjZSgpKTtcblxuLyoqXG4gKiBTdHJlYW0gY29udGFpbmluZyBubyBldmVudHMgYW5kIG5ldmVyIGVuZHNcbiAqIEByZXR1cm5zIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIG5ldmVyKCkge1xuICByZXR1cm4gTkVWRVI7XG59XG5cbmZ1bmN0aW9uIE5ldmVyU291cmNlKCkge31cblxuTmV2ZXJTb3VyY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGRpc3Bvc2UuZW1wdHkoKTtcbn07XG5cbnZhciBORVZFUiA9IG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBOZXZlclNvdXJjZSgpKTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZyb20gPSBmcm9tO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX2Zyb21BcnJheSA9IHJlcXVpcmUoJy4vZnJvbUFycmF5Jyk7XG5cbnZhciBfaXRlcmFibGUgPSByZXF1aXJlKCcuLi9pdGVyYWJsZScpO1xuXG52YXIgX2Zyb21JdGVyYWJsZSA9IHJlcXVpcmUoJy4vZnJvbUl0ZXJhYmxlJyk7XG5cbnZhciBfZ2V0T2JzZXJ2YWJsZSA9IHJlcXVpcmUoJy4uL29ic2VydmFibGUvZ2V0T2JzZXJ2YWJsZScpO1xuXG52YXIgX2dldE9ic2VydmFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZ2V0T2JzZXJ2YWJsZSk7XG5cbnZhciBfZnJvbU9ic2VydmFibGUgPSByZXF1aXJlKCcuLi9vYnNlcnZhYmxlL2Zyb21PYnNlcnZhYmxlJyk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gZnJvbShhKSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICBpZiAoYSBpbnN0YW5jZW9mIF9TdHJlYW0yLmRlZmF1bHQpIHtcbiAgICByZXR1cm4gYTtcbiAgfVxuXG4gIHZhciBvYnNlcnZhYmxlID0gKDAsIF9nZXRPYnNlcnZhYmxlMi5kZWZhdWx0KShhKTtcbiAgaWYgKG9ic2VydmFibGUgIT0gbnVsbCkge1xuICAgIHJldHVybiAoMCwgX2Zyb21PYnNlcnZhYmxlLmZyb21PYnNlcnZhYmxlKShvYnNlcnZhYmxlKTtcbiAgfVxuXG4gIGlmIChBcnJheS5pc0FycmF5KGEpIHx8ICgwLCBfcHJlbHVkZS5pc0FycmF5TGlrZSkoYSkpIHtcbiAgICByZXR1cm4gKDAsIF9mcm9tQXJyYXkuZnJvbUFycmF5KShhKTtcbiAgfVxuXG4gIGlmICgoMCwgX2l0ZXJhYmxlLmlzSXRlcmFibGUpKGEpKSB7XG4gICAgcmV0dXJuICgwLCBfZnJvbUl0ZXJhYmxlLmZyb21JdGVyYWJsZSkoYSk7XG4gIH1cblxuICB0aHJvdyBuZXcgVHlwZUVycm9yKCdmcm9tKHgpIG11c3QgYmUgb2JzZXJ2YWJsZSwgaXRlcmFibGUsIG9yIGFycmF5LWxpa2U6ICcgKyBhKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5mcm9tQXJyYXkgPSBmcm9tQXJyYXk7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUHJvcGFnYXRlVGFzayA9IHJlcXVpcmUoJy4uL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGZyb21BcnJheShhKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgQXJyYXlTb3VyY2UoYSkpO1xufVxuXG5mdW5jdGlvbiBBcnJheVNvdXJjZShhKSB7XG4gIHRoaXMuYXJyYXkgPSBhO1xufVxuXG5BcnJheVNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gc2NoZWR1bGVyLmFzYXAobmV3IF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0KHJ1blByb2R1Y2VyLCB0aGlzLmFycmF5LCBzaW5rKSk7XG59O1xuXG5mdW5jdGlvbiBydW5Qcm9kdWNlcih0LCBhcnJheSwgc2luaykge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGFycmF5Lmxlbmd0aDsgaSA8IGwgJiYgdGhpcy5hY3RpdmU7ICsraSkge1xuICAgIHNpbmsuZXZlbnQodCwgYXJyYXlbaV0pO1xuICB9XG5cbiAgdGhpcy5hY3RpdmUgJiYgZW5kKHQpO1xuXG4gIGZ1bmN0aW9uIGVuZCh0KSB7XG4gICAgc2luay5lbmQodCk7XG4gIH1cbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZyb21FdmVudCA9IGZyb21FdmVudDtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9FdmVudFRhcmdldFNvdXJjZSA9IHJlcXVpcmUoJy4vRXZlbnRUYXJnZXRTb3VyY2UnKTtcblxudmFyIF9FdmVudFRhcmdldFNvdXJjZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9FdmVudFRhcmdldFNvdXJjZSk7XG5cbnZhciBfRXZlbnRFbWl0dGVyU291cmNlID0gcmVxdWlyZSgnLi9FdmVudEVtaXR0ZXJTb3VyY2UnKTtcblxudmFyIF9FdmVudEVtaXR0ZXJTb3VyY2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfRXZlbnRFbWl0dGVyU291cmNlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBDcmVhdGUgYSBzdHJlYW0gZnJvbSBhbiBFdmVudFRhcmdldCwgc3VjaCBhcyBhIERPTSBOb2RlLCBvciBFdmVudEVtaXR0ZXIuXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnQgZXZlbnQgdHlwZSBuYW1lLCBlLmcuICdjbGljaydcbiAqIEBwYXJhbSB7RXZlbnRUYXJnZXR8RXZlbnRFbWl0dGVyfSBzb3VyY2UgRXZlbnRUYXJnZXQgb3IgRXZlbnRFbWl0dGVyXG4gKiBAcGFyYW0geyo/fSBjYXB0dXJlIGZvciBET00gZXZlbnRzLCB3aGV0aGVyIHRvIHVzZVxuICogIGNhcHR1cmluZy0tcGFzc2VkIGFzIDNyZCBwYXJhbWV0ZXIgdG8gYWRkRXZlbnRMaXN0ZW5lci5cbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGFsbCBldmVudHMgb2YgdGhlIHNwZWNpZmllZCB0eXBlXG4gKiBmcm9tIHRoZSBzb3VyY2UuXG4gKi9cbmZ1bmN0aW9uIGZyb21FdmVudChldmVudCwgc291cmNlLCBjYXB0dXJlKSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICB2YXIgcztcblxuICBpZiAodHlwZW9mIHNvdXJjZS5hZGRFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBzb3VyY2UucmVtb3ZlRXZlbnRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoIDwgMykge1xuICAgICAgY2FwdHVyZSA9IGZhbHNlO1xuICAgIH1cblxuICAgIHMgPSBuZXcgX0V2ZW50VGFyZ2V0U291cmNlMi5kZWZhdWx0KGV2ZW50LCBzb3VyY2UsIGNhcHR1cmUpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzb3VyY2UuYWRkTGlzdGVuZXIgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIHNvdXJjZS5yZW1vdmVMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHMgPSBuZXcgX0V2ZW50RW1pdHRlclNvdXJjZTIuZGVmYXVsdChldmVudCwgc291cmNlKTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NvdXJjZSBtdXN0IHN1cHBvcnQgYWRkRXZlbnRMaXN0ZW5lci9yZW1vdmVFdmVudExpc3RlbmVyIG9yIGFkZExpc3RlbmVyL3JlbW92ZUxpc3RlbmVyJyk7XG4gIH1cblxuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQocyk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqLyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZnJvbUl0ZXJhYmxlID0gZnJvbUl0ZXJhYmxlO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX2l0ZXJhYmxlID0gcmVxdWlyZSgnLi4vaXRlcmFibGUnKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrID0gcmVxdWlyZSgnLi4vc2NoZWR1bGVyL1Byb3BhZ2F0ZVRhc2snKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1Byb3BhZ2F0ZVRhc2spO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBmcm9tSXRlcmFibGUoaXRlcmFibGUpIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBJdGVyYWJsZVNvdXJjZShpdGVyYWJsZSkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gSXRlcmFibGVTb3VyY2UoaXRlcmFibGUpIHtcbiAgdGhpcy5pdGVyYWJsZSA9IGl0ZXJhYmxlO1xufVxuXG5JdGVyYWJsZVNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gc2NoZWR1bGVyLmFzYXAobmV3IF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0KHJ1blByb2R1Y2VyLCAoMCwgX2l0ZXJhYmxlLmdldEl0ZXJhdG9yKSh0aGlzLml0ZXJhYmxlKSwgc2luaykpO1xufTtcblxuZnVuY3Rpb24gcnVuUHJvZHVjZXIodCwgaXRlcmF0b3IsIHNpbmspIHtcbiAgdmFyIHIgPSBpdGVyYXRvci5uZXh0KCk7XG5cbiAgd2hpbGUgKCFyLmRvbmUgJiYgdGhpcy5hY3RpdmUpIHtcbiAgICBzaW5rLmV2ZW50KHQsIHIudmFsdWUpO1xuICAgIHIgPSBpdGVyYXRvci5uZXh0KCk7XG4gIH1cblxuICBzaW5rLmVuZCh0LCByLnZhbHVlKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmdlbmVyYXRlID0gZ2VuZXJhdGU7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENvbXB1dGUgYSBzdHJlYW0gdXNpbmcgYW4gKmFzeW5jKiBnZW5lcmF0b3IsIHdoaWNoIHlpZWxkcyBwcm9taXNlc1xuICogdG8gY29udHJvbCBldmVudCB0aW1lcy5cbiAqIEBwYXJhbSBmXG4gKiBAcmV0dXJucyB7U3RyZWFtfVxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTQgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gZ2VuZXJhdGUoZiAvKiwgLi4uYXJncyAqLykge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IEdlbmVyYXRlU291cmNlKGYsIGJhc2UudGFpbChhcmd1bWVudHMpKSk7XG59XG5cbmZ1bmN0aW9uIEdlbmVyYXRlU291cmNlKGYsIGFyZ3MpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5hcmdzID0gYXJncztcbn1cblxuR2VuZXJhdGVTb3VyY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBHZW5lcmF0ZSh0aGlzLmYuYXBwbHkodm9pZCAwLCB0aGlzLmFyZ3MpLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gR2VuZXJhdGUoaXRlcmF0b3IsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLml0ZXJhdG9yID0gaXRlcmF0b3I7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBmdW5jdGlvbiBlcnIoZSkge1xuICAgIHNlbGYuc2luay5lcnJvcihzZWxmLnNjaGVkdWxlci5ub3coKSwgZSk7XG4gIH1cblxuICBQcm9taXNlLnJlc29sdmUodGhpcykudGhlbihuZXh0KS5jYXRjaChlcnIpO1xufVxuXG5mdW5jdGlvbiBuZXh0KGdlbmVyYXRlLCB4KSB7XG4gIHJldHVybiBnZW5lcmF0ZS5hY3RpdmUgPyBoYW5kbGUoZ2VuZXJhdGUsIGdlbmVyYXRlLml0ZXJhdG9yLm5leHQoeCkpIDogeDtcbn1cblxuZnVuY3Rpb24gaGFuZGxlKGdlbmVyYXRlLCByZXN1bHQpIHtcbiAgaWYgKHJlc3VsdC5kb25lKSB7XG4gICAgcmV0dXJuIGdlbmVyYXRlLnNpbmsuZW5kKGdlbmVyYXRlLnNjaGVkdWxlci5ub3coKSwgcmVzdWx0LnZhbHVlKTtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUocmVzdWx0LnZhbHVlKS50aGVuKGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIGVtaXQoZ2VuZXJhdGUsIHgpO1xuICB9LCBmdW5jdGlvbiAoZSkge1xuICAgIHJldHVybiBlcnJvcihnZW5lcmF0ZSwgZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBlbWl0KGdlbmVyYXRlLCB4KSB7XG4gIGdlbmVyYXRlLnNpbmsuZXZlbnQoZ2VuZXJhdGUuc2NoZWR1bGVyLm5vdygpLCB4KTtcbiAgcmV0dXJuIG5leHQoZ2VuZXJhdGUsIHgpO1xufVxuXG5mdW5jdGlvbiBlcnJvcihnZW5lcmF0ZSwgZSkge1xuICByZXR1cm4gaGFuZGxlKGdlbmVyYXRlLCBnZW5lcmF0ZS5pdGVyYXRvci50aHJvdyhlKSk7XG59XG5cbkdlbmVyYXRlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLml0ZXJhdGUgPSBpdGVyYXRlO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENvbXB1dGUgYSBzdHJlYW0gYnkgaXRlcmF0aXZlbHkgY2FsbGluZyBmIHRvIHByb2R1Y2UgdmFsdWVzXG4gKiBFdmVudCB0aW1lcyBtYXkgYmUgY29udHJvbGxlZCBieSByZXR1cm5pbmcgYSBQcm9taXNlIGZyb20gZlxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOip8UHJvbWlzZTwqPn0gZlxuICogQHBhcmFtIHsqfSB4IGluaXRpYWwgdmFsdWVcbiAqIEByZXR1cm5zIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIGl0ZXJhdGUoZiwgeCkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IEl0ZXJhdGVTb3VyY2UoZiwgeCkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gSXRlcmF0ZVNvdXJjZShmLCB4KSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMudmFsdWUgPSB4O1xufVxuXG5JdGVyYXRlU291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgSXRlcmF0ZSh0aGlzLmYsIHRoaXMudmFsdWUsIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBJdGVyYXRlKGYsIGluaXRpYWwsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xuXG4gIHZhciB4ID0gaW5pdGlhbDtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGZ1bmN0aW9uIGVycihlKSB7XG4gICAgc2VsZi5zaW5rLmVycm9yKHNlbGYuc2NoZWR1bGVyLm5vdygpLCBlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0YXJ0KGl0ZXJhdGUpIHtcbiAgICByZXR1cm4gc3RlcEl0ZXJhdGUoaXRlcmF0ZSwgeCk7XG4gIH1cblxuICBQcm9taXNlLnJlc29sdmUodGhpcykudGhlbihzdGFydCkuY2F0Y2goZXJyKTtcbn1cblxuSXRlcmF0ZS5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIHN0ZXBJdGVyYXRlKGl0ZXJhdGUsIHgpIHtcbiAgaXRlcmF0ZS5zaW5rLmV2ZW50KGl0ZXJhdGUuc2NoZWR1bGVyLm5vdygpLCB4KTtcblxuICBpZiAoIWl0ZXJhdGUuYWN0aXZlKSB7XG4gICAgcmV0dXJuIHg7XG4gIH1cblxuICB2YXIgZiA9IGl0ZXJhdGUuZjtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmKHgpKS50aGVuKGZ1bmN0aW9uICh5KSB7XG4gICAgcmV0dXJuIGNvbnRpbnVlSXRlcmF0ZShpdGVyYXRlLCB5KTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRpbnVlSXRlcmF0ZShpdGVyYXRlLCB4KSB7XG4gIHJldHVybiAhaXRlcmF0ZS5hY3RpdmUgPyBpdGVyYXRlLnZhbHVlIDogc3RlcEl0ZXJhdGUoaXRlcmF0ZSwgeCk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5wZXJpb2RpYyA9IHBlcmlvZGljO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQ3JlYXRlIGEgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGN1cnJlbnQgdGltZSBwZXJpb2RpY2FsbHlcbiAqIEBwYXJhbSB7TnVtYmVyfSBwZXJpb2QgcGVyaW9kaWNpdHkgb2YgZXZlbnRzIGluIG1pbGxpc1xuICogQHBhcmFtIHsqfSBkZXByZWNhdGVkVmFsdWUgQGRlcHJlY2F0ZWQgdmFsdWUgdG8gZW1pdCBlYWNoIHBlcmlvZFxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB0aGF0IGVtaXRzIHRoZSBjdXJyZW50IHRpbWUgZXZlcnkgcGVyaW9kXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBwZXJpb2RpYyhwZXJpb2QsIGRlcHJlY2F0ZWRWYWx1ZSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFBlcmlvZGljKHBlcmlvZCwgZGVwcmVjYXRlZFZhbHVlKSk7XG59XG5cbmZ1bmN0aW9uIFBlcmlvZGljKHBlcmlvZCwgdmFsdWUpIHtcbiAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gIHRoaXMudmFsdWUgPSB2YWx1ZTtcbn1cblxuUGVyaW9kaWMucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHNjaGVkdWxlci5wZXJpb2RpYyh0aGlzLnBlcmlvZCwgX1Byb3BhZ2F0ZVRhc2syLmRlZmF1bHQuZXZlbnQodGhpcy52YWx1ZSwgc2luaykpO1xufTsiLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudHJ5RXZlbnQgPSB0cnlFdmVudDtcbmV4cG9ydHMudHJ5RW5kID0gdHJ5RW5kO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIHRyeUV2ZW50KHQsIHgsIHNpbmspIHtcbiAgdHJ5IHtcbiAgICBzaW5rLmV2ZW50KHQsIHgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgc2luay5lcnJvcih0LCBlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlFbmQodCwgeCwgc2luaykge1xuICB0cnkge1xuICAgIHNpbmsuZW5kKHQsIHgpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgc2luay5lcnJvcih0LCBlKTtcbiAgfVxufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudW5mb2xkID0gdW5mb2xkO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENvbXB1dGUgYSBzdHJlYW0gYnkgdW5mb2xkaW5nIHR1cGxlcyBvZiBmdXR1cmUgdmFsdWVzIGZyb20gYSBzZWVkIHZhbHVlXG4gKiBFdmVudCB0aW1lcyBtYXkgYmUgY29udHJvbGxlZCBieSByZXR1cm5pbmcgYSBQcm9taXNlIGZyb20gZlxuICogQHBhcmFtIHtmdW5jdGlvbihzZWVkOiopOnt2YWx1ZToqLCBzZWVkOiosIGRvbmU6Ym9vbGVhbn18UHJvbWlzZTx7dmFsdWU6Kiwgc2VlZDoqLCBkb25lOmJvb2xlYW59Pn0gZiB1bmZvbGRpbmcgZnVuY3Rpb24gYWNjZXB0c1xuICogIGEgc2VlZCBhbmQgcmV0dXJucyBhIG5ldyB0dXBsZSB3aXRoIGEgdmFsdWUsIG5ldyBzZWVkLCBhbmQgYm9vbGVhbiBkb25lIGZsYWcuXG4gKiAgSWYgdHVwbGUuZG9uZSBpcyB0cnVlLCB0aGUgc3RyZWFtIHdpbGwgZW5kLlxuICogQHBhcmFtIHsqfSBzZWVkIHNlZWQgdmFsdWVcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGFsbCB2YWx1ZSBvZiBhbGwgdHVwbGVzIHByb2R1Y2VkIGJ5IHRoZVxuICogIHVuZm9sZGluZyBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gdW5mb2xkKGYsIHNlZWQpIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBVbmZvbGRTb3VyY2UoZiwgc2VlZCkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gVW5mb2xkU291cmNlKGYsIHNlZWQpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy52YWx1ZSA9IHNlZWQ7XG59XG5cblVuZm9sZFNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gbmV3IFVuZm9sZCh0aGlzLmYsIHRoaXMudmFsdWUsIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBVbmZvbGQoZiwgeCwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG5cbiAgdmFyIHNlbGYgPSB0aGlzO1xuICBmdW5jdGlvbiBlcnIoZSkge1xuICAgIHNlbGYuc2luay5lcnJvcihzZWxmLnNjaGVkdWxlci5ub3coKSwgZSk7XG4gIH1cblxuICBmdW5jdGlvbiBzdGFydCh1bmZvbGQpIHtcbiAgICByZXR1cm4gc3RlcFVuZm9sZCh1bmZvbGQsIHgpO1xuICB9XG5cbiAgUHJvbWlzZS5yZXNvbHZlKHRoaXMpLnRoZW4oc3RhcnQpLmNhdGNoKGVycik7XG59XG5cblVuZm9sZC5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbn07XG5cbmZ1bmN0aW9uIHN0ZXBVbmZvbGQodW5mb2xkLCB4KSB7XG4gIHZhciBmID0gdW5mb2xkLmY7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZih4KSkudGhlbihmdW5jdGlvbiAodHVwbGUpIHtcbiAgICByZXR1cm4gY29udGludWVVbmZvbGQodW5mb2xkLCB0dXBsZSk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBjb250aW51ZVVuZm9sZCh1bmZvbGQsIHR1cGxlKSB7XG4gIGlmICh0dXBsZS5kb25lKSB7XG4gICAgdW5mb2xkLnNpbmsuZW5kKHVuZm9sZC5zY2hlZHVsZXIubm93KCksIHR1cGxlLnZhbHVlKTtcbiAgICByZXR1cm4gdHVwbGUudmFsdWU7XG4gIH1cblxuICB1bmZvbGQuc2luay5ldmVudCh1bmZvbGQuc2NoZWR1bGVyLm5vdygpLCB0dXBsZS52YWx1ZSk7XG5cbiAgaWYgKCF1bmZvbGQuYWN0aXZlKSB7XG4gICAgcmV0dXJuIHR1cGxlLnZhbHVlO1xuICB9XG4gIHJldHVybiBzdGVwVW5mb2xkKHVuZm9sZCwgdHVwbGUuc2VlZCk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmVyID0gZGVmZXI7XG5leHBvcnRzLnJ1blRhc2sgPSBydW5UYXNrO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGRlZmVyKHRhc2spIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0YXNrKS50aGVuKHJ1blRhc2spO1xufVxuXG5mdW5jdGlvbiBydW5UYXNrKHRhc2spIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gdGFzay5ydW4oKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHJldHVybiB0YXNrLmVycm9yKGUpO1xuICB9XG59IiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzLCByZXF1aXJlKCdAbW9zdC9wcmVsdWRlJykpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cycsICdAbW9zdC9wcmVsdWRlJ10sIGZhY3RvcnkpIDpcbiAgKGZhY3RvcnkoKGdsb2JhbC5tb3N0TXVsdGljYXN0ID0gZ2xvYmFsLm1vc3RNdWx0aWNhc3QgfHwge30pLGdsb2JhbC5tb3N0UHJlbHVkZSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMsX21vc3RfcHJlbHVkZSkgeyAndXNlIHN0cmljdCc7XG5cbnZhciBNdWx0aWNhc3REaXNwb3NhYmxlID0gZnVuY3Rpb24gTXVsdGljYXN0RGlzcG9zYWJsZSAoc291cmNlLCBzaW5rKSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlXG4gIHRoaXMuc2luayA9IHNpbmtcbiAgdGhpcy5kaXNwb3NlZCA9IGZhbHNlXG59O1xuXG5NdWx0aWNhc3REaXNwb3NhYmxlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gZGlzcG9zZSAoKSB7XG4gIGlmICh0aGlzLmRpc3Bvc2VkKSB7XG4gICAgcmV0dXJuXG4gIH1cbiAgdGhpcy5kaXNwb3NlZCA9IHRydWVcbiAgdmFyIHJlbWFpbmluZyA9IHRoaXMuc291cmNlLnJlbW92ZSh0aGlzLnNpbmspXG4gIHJldHVybiByZW1haW5pbmcgPT09IDAgJiYgdGhpcy5zb3VyY2UuX2Rpc3Bvc2UoKVxufTtcblxuZnVuY3Rpb24gdHJ5RXZlbnQgKHQsIHgsIHNpbmspIHtcbiAgdHJ5IHtcbiAgICBzaW5rLmV2ZW50KHQsIHgpXG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzaW5rLmVycm9yKHQsIGUpXG4gIH1cbn1cblxuZnVuY3Rpb24gdHJ5RW5kICh0LCB4LCBzaW5rKSB7XG4gIHRyeSB7XG4gICAgc2luay5lbmQodCwgeClcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNpbmsuZXJyb3IodCwgZSlcbiAgfVxufVxuXG52YXIgZGlzcG9zZSA9IGZ1bmN0aW9uIChkaXNwb3NhYmxlKSB7IHJldHVybiBkaXNwb3NhYmxlLmRpc3Bvc2UoKTsgfVxuXG52YXIgZW1wdHlEaXNwb3NhYmxlID0ge1xuICBkaXNwb3NlOiBmdW5jdGlvbiBkaXNwb3NlJDEgKCkge31cbn1cblxudmFyIE11bHRpY2FzdFNvdXJjZSA9IGZ1bmN0aW9uIE11bHRpY2FzdFNvdXJjZSAoc291cmNlKSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlXG4gIHRoaXMuc2lua3MgPSBbXVxuICB0aGlzLl9kaXNwb3NhYmxlID0gZW1wdHlEaXNwb3NhYmxlXG59O1xuXG5NdWx0aWNhc3RTb3VyY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIHJ1biAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciBuID0gdGhpcy5hZGQoc2luaylcbiAgaWYgKG4gPT09IDEpIHtcbiAgICB0aGlzLl9kaXNwb3NhYmxlID0gdGhpcy5zb3VyY2UucnVuKHRoaXMsIHNjaGVkdWxlcilcbiAgfVxuICByZXR1cm4gbmV3IE11bHRpY2FzdERpc3Bvc2FibGUodGhpcywgc2luaylcbn07XG5cbk11bHRpY2FzdFNvdXJjZS5wcm90b3R5cGUuX2Rpc3Bvc2UgPSBmdW5jdGlvbiBfZGlzcG9zZSAoKSB7XG4gIHZhciBkaXNwb3NhYmxlID0gdGhpcy5fZGlzcG9zYWJsZVxuICB0aGlzLl9kaXNwb3NhYmxlID0gZW1wdHlEaXNwb3NhYmxlXG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoZGlzcG9zYWJsZSkudGhlbihkaXNwb3NlKVxufTtcblxuTXVsdGljYXN0U291cmNlLnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiBhZGQgKHNpbmspIHtcbiAgdGhpcy5zaW5rcyA9IF9tb3N0X3ByZWx1ZGUuYXBwZW5kKHNpbmssIHRoaXMuc2lua3MpXG4gIHJldHVybiB0aGlzLnNpbmtzLmxlbmd0aFxufTtcblxuTXVsdGljYXN0U291cmNlLnByb3RvdHlwZS5yZW1vdmUgPSBmdW5jdGlvbiByZW1vdmUkMSAoc2luaykge1xuICB2YXIgaSA9IF9tb3N0X3ByZWx1ZGUuZmluZEluZGV4KHNpbmssIHRoaXMuc2lua3MpXG4gIC8vIGlzdGFuYnVsIGlnbm9yZSBuZXh0XG4gIGlmIChpID49IDApIHtcbiAgICB0aGlzLnNpbmtzID0gX21vc3RfcHJlbHVkZS5yZW1vdmUoaSwgdGhpcy5zaW5rcylcbiAgfVxuXG4gIHJldHVybiB0aGlzLnNpbmtzLmxlbmd0aFxufTtcblxuTXVsdGljYXN0U291cmNlLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uIGV2ZW50ICh0aW1lLCB2YWx1ZSkge1xuICB2YXIgcyA9IHRoaXMuc2lua3NcbiAgaWYgKHMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIHNbMF0uZXZlbnQodGltZSwgdmFsdWUpXG4gIH1cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgKytpKSB7XG4gICAgdHJ5RXZlbnQodGltZSwgdmFsdWUsIHNbaV0pXG4gIH1cbn07XG5cbk11bHRpY2FzdFNvdXJjZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gZW5kICh0aW1lLCB2YWx1ZSkge1xuICB2YXIgcyA9IHRoaXMuc2lua3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgKytpKSB7XG4gICAgdHJ5RW5kKHRpbWUsIHZhbHVlLCBzW2ldKVxuICB9XG59O1xuXG5NdWx0aWNhc3RTb3VyY2UucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gZXJyb3IgKHRpbWUsIGVycikge1xuICB2YXIgcyA9IHRoaXMuc2lua3NcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgKytpKSB7XG4gICAgc1tpXS5lcnJvcih0aW1lLCBlcnIpXG4gIH1cbn07XG5cbmZ1bmN0aW9uIG11bHRpY2FzdCAoc3RyZWFtKSB7XG4gIHZhciBzb3VyY2UgPSBzdHJlYW0uc291cmNlXG4gIHJldHVybiBzb3VyY2UgaW5zdGFuY2VvZiBNdWx0aWNhc3RTb3VyY2VcbiAgICA/IHN0cmVhbVxuICAgIDogbmV3IHN0cmVhbS5jb25zdHJ1Y3RvcihuZXcgTXVsdGljYXN0U291cmNlKHNvdXJjZSkpXG59XG5cbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IG11bHRpY2FzdDtcbmV4cG9ydHMuTXVsdGljYXN0U291cmNlID0gTXVsdGljYXN0U291cmNlO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuXG59KSkpO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9bXVsdGljYXN0LmpzLm1hcFxuIiwiKGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHtcbiAgdHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnID8gZmFjdG9yeShleHBvcnRzKSA6XG4gIHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCA/IGRlZmluZShbJ2V4cG9ydHMnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLm1vc3RQcmVsdWRlID0gZ2xvYmFsLm1vc3RQcmVsdWRlIHx8IHt9KSkpO1xufSh0aGlzLCAoZnVuY3Rpb24gKGV4cG9ydHMpIHsgJ3VzZSBzdHJpY3QnO1xuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cblxuLy8gTm9uLW11dGF0aW5nIGFycmF5IG9wZXJhdGlvbnNcblxuLy8gY29ucyA6OiBhIC0+IFthXSAtPiBbYV1cbi8vIGEgd2l0aCB4IHByZXBlbmRlZFxuZnVuY3Rpb24gY29ucyAoeCwgYSkge1xuICB2YXIgbCA9IGEubGVuZ3RoXG4gIHZhciBiID0gbmV3IEFycmF5KGwgKyAxKVxuICBiWzBdID0geFxuICBmb3IgKHZhciBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGJbaSArIDFdID0gYVtpXVxuICB9XG4gIHJldHVybiBiXG59XG5cbi8vIGFwcGVuZCA6OiBhIC0+IFthXSAtPiBbYV1cbi8vIGEgd2l0aCB4IGFwcGVuZGVkXG5mdW5jdGlvbiBhcHBlbmQgKHgsIGEpIHtcbiAgdmFyIGwgPSBhLmxlbmd0aFxuICB2YXIgYiA9IG5ldyBBcnJheShsICsgMSlcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICBiW2ldID0gYVtpXVxuICB9XG5cbiAgYltsXSA9IHhcbiAgcmV0dXJuIGJcbn1cblxuLy8gZHJvcCA6OiBJbnQgLT4gW2FdIC0+IFthXVxuLy8gZHJvcCBmaXJzdCBuIGVsZW1lbnRzXG5mdW5jdGlvbiBkcm9wIChuLCBhKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICBpZiAobiA8IDApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCduIG11c3QgYmUgPj0gMCcpXG4gIH1cblxuICB2YXIgbCA9IGEubGVuZ3RoXG4gIGlmIChuID09PSAwIHx8IGwgPT09IDApIHtcbiAgICByZXR1cm4gYVxuICB9XG5cbiAgaWYgKG4gPj0gbCkge1xuICAgIHJldHVybiBbXVxuICB9XG5cbiAgcmV0dXJuIHVuc2FmZURyb3AobiwgYSwgbCAtIG4pXG59XG5cbi8vIHVuc2FmZURyb3AgOjogSW50IC0+IFthXSAtPiBJbnQgLT4gW2FdXG4vLyBJbnRlcm5hbCBoZWxwZXIgZm9yIGRyb3BcbmZ1bmN0aW9uIHVuc2FmZURyb3AgKG4sIGEsIGwpIHtcbiAgdmFyIGIgPSBuZXcgQXJyYXkobClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICBiW2ldID0gYVtuICsgaV1cbiAgfVxuICByZXR1cm4gYlxufVxuXG4vLyB0YWlsIDo6IFthXSAtPiBbYV1cbi8vIGRyb3AgaGVhZCBlbGVtZW50XG5mdW5jdGlvbiB0YWlsIChhKSB7XG4gIHJldHVybiBkcm9wKDEsIGEpXG59XG5cbi8vIGNvcHkgOjogW2FdIC0+IFthXVxuLy8gZHVwbGljYXRlIGEgKHNoYWxsb3cgZHVwbGljYXRpb24pXG5mdW5jdGlvbiBjb3B5IChhKSB7XG4gIHZhciBsID0gYS5sZW5ndGhcbiAgdmFyIGIgPSBuZXcgQXJyYXkobClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICBiW2ldID0gYVtpXVxuICB9XG4gIHJldHVybiBiXG59XG5cbi8vIG1hcCA6OiAoYSAtPiBiKSAtPiBbYV0gLT4gW2JdXG4vLyB0cmFuc2Zvcm0gZWFjaCBlbGVtZW50IHdpdGggZlxuZnVuY3Rpb24gbWFwIChmLCBhKSB7XG4gIHZhciBsID0gYS5sZW5ndGhcbiAgdmFyIGIgPSBuZXcgQXJyYXkobClcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICBiW2ldID0gZihhW2ldKVxuICB9XG4gIHJldHVybiBiXG59XG5cbi8vIHJlZHVjZSA6OiAoYSAtPiBiIC0+IGEpIC0+IGEgLT4gW2JdIC0+IGFcbi8vIGFjY3VtdWxhdGUgdmlhIGxlZnQtZm9sZFxuZnVuY3Rpb24gcmVkdWNlIChmLCB6LCBhKSB7XG4gIHZhciByID0gelxuICBmb3IgKHZhciBpID0gMCwgbCA9IGEubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgciA9IGYociwgYVtpXSwgaSlcbiAgfVxuICByZXR1cm4gclxufVxuXG4vLyByZXBsYWNlIDo6IGEgLT4gSW50IC0+IFthXVxuLy8gcmVwbGFjZSBlbGVtZW50IGF0IGluZGV4XG5mdW5jdGlvbiByZXBsYWNlICh4LCBpLCBhKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICBpZiAoaSA8IDApIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdpIG11c3QgYmUgPj0gMCcpXG4gIH1cblxuICB2YXIgbCA9IGEubGVuZ3RoXG4gIHZhciBiID0gbmV3IEFycmF5KGwpXG4gIGZvciAodmFyIGogPSAwOyBqIDwgbDsgKytqKSB7XG4gICAgYltqXSA9IGkgPT09IGogPyB4IDogYVtqXVxuICB9XG4gIHJldHVybiBiXG59XG5cbi8vIHJlbW92ZSA6OiBJbnQgLT4gW2FdIC0+IFthXVxuLy8gcmVtb3ZlIGVsZW1lbnQgYXQgaW5kZXhcbmZ1bmN0aW9uIHJlbW92ZSAoaSwgYSkgeyAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIGlmIChpIDwgMCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2kgbXVzdCBiZSA+PSAwJylcbiAgfVxuXG4gIHZhciBsID0gYS5sZW5ndGhcbiAgaWYgKGwgPT09IDAgfHwgaSA+PSBsKSB7IC8vIGV4aXQgZWFybHkgaWYgaW5kZXggYmV5b25kIGVuZCBvZiBhcnJheVxuICAgIHJldHVybiBhXG4gIH1cblxuICBpZiAobCA9PT0gMSkgeyAvLyBleGl0IGVhcmx5IGlmIGluZGV4IGluIGJvdW5kcyBhbmQgbGVuZ3RoID09PSAxXG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICByZXR1cm4gdW5zYWZlUmVtb3ZlKGksIGEsIGwgLSAxKVxufVxuXG4vLyB1bnNhZmVSZW1vdmUgOjogSW50IC0+IFthXSAtPiBJbnQgLT4gW2FdXG4vLyBJbnRlcm5hbCBoZWxwZXIgdG8gcmVtb3ZlIGVsZW1lbnQgYXQgaW5kZXhcbmZ1bmN0aW9uIHVuc2FmZVJlbW92ZSAoaSwgYSwgbCkge1xuICB2YXIgYiA9IG5ldyBBcnJheShsKVxuICB2YXIgalxuICBmb3IgKGogPSAwOyBqIDwgaTsgKytqKSB7XG4gICAgYltqXSA9IGFbal1cbiAgfVxuICBmb3IgKGogPSBpOyBqIDwgbDsgKytqKSB7XG4gICAgYltqXSA9IGFbaiArIDFdXG4gIH1cblxuICByZXR1cm4gYlxufVxuXG4vLyByZW1vdmVBbGwgOjogKGEgLT4gYm9vbGVhbikgLT4gW2FdIC0+IFthXVxuLy8gcmVtb3ZlIGFsbCBlbGVtZW50cyBtYXRjaGluZyBhIHByZWRpY2F0ZVxuZnVuY3Rpb24gcmVtb3ZlQWxsIChmLCBhKSB7XG4gIHZhciBsID0gYS5sZW5ndGhcbiAgdmFyIGIgPSBuZXcgQXJyYXkobClcbiAgdmFyIGogPSAwXG4gIGZvciAodmFyIHgsIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgeCA9IGFbaV1cbiAgICBpZiAoIWYoeCkpIHtcbiAgICAgIGJbal0gPSB4XG4gICAgICArK2pcbiAgICB9XG4gIH1cblxuICBiLmxlbmd0aCA9IGpcbiAgcmV0dXJuIGJcbn1cblxuLy8gZmluZEluZGV4IDo6IGEgLT4gW2FdIC0+IEludFxuLy8gZmluZCBpbmRleCBvZiB4IGluIGEsIGZyb20gdGhlIGxlZnRcbmZ1bmN0aW9uIGZpbmRJbmRleCAoeCwgYSkge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGEubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKHggPT09IGFbaV0pIHtcbiAgICAgIHJldHVybiBpXG4gICAgfVxuICB9XG4gIHJldHVybiAtMVxufVxuXG4vLyBpc0FycmF5TGlrZSA6OiAqIC0+IGJvb2xlYW5cbi8vIFJldHVybiB0cnVlIGlmZiB4IGlzIGFycmF5LWxpa2VcbmZ1bmN0aW9uIGlzQXJyYXlMaWtlICh4KSB7XG4gIHJldHVybiB4ICE9IG51bGwgJiYgdHlwZW9mIHgubGVuZ3RoID09PSAnbnVtYmVyJyAmJiB0eXBlb2YgeCAhPT0gJ2Z1bmN0aW9uJ1xufVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cblxuLy8gaWQgOjogYSAtPiBhXG52YXIgaWQgPSBmdW5jdGlvbiAoeCkgeyByZXR1cm4geDsgfVxuXG4vLyBjb21wb3NlIDo6IChiIC0+IGMpIC0+IChhIC0+IGIpIC0+IChhIC0+IGMpXG52YXIgY29tcG9zZSA9IGZ1bmN0aW9uIChmLCBnKSB7IHJldHVybiBmdW5jdGlvbiAoeCkgeyByZXR1cm4gZihnKHgpKTsgfTsgfVxuXG4vLyBhcHBseSA6OiAoYSAtPiBiKSAtPiBhIC0+IGJcbnZhciBhcHBseSA9IGZ1bmN0aW9uIChmLCB4KSB7IHJldHVybiBmKHgpOyB9XG5cbi8vIGN1cnJ5MiA6OiAoKGEsIGIpIC0+IGMpIC0+IChhIC0+IGIgLT4gYylcbmZ1bmN0aW9uIGN1cnJ5MiAoZikge1xuICBmdW5jdGlvbiBjdXJyaWVkIChhLCBiKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICBjYXNlIDA6IHJldHVybiBjdXJyaWVkXG4gICAgICBjYXNlIDE6IHJldHVybiBmdW5jdGlvbiAoYikgeyByZXR1cm4gZihhLCBiKTsgfVxuICAgICAgZGVmYXVsdDogcmV0dXJuIGYoYSwgYilcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGN1cnJpZWRcbn1cblxuLy8gY3VycnkzIDo6ICgoYSwgYiwgYykgLT4gZCkgLT4gKGEgLT4gYiAtPiBjIC0+IGQpXG5mdW5jdGlvbiBjdXJyeTMgKGYpIHtcbiAgZnVuY3Rpb24gY3VycmllZCAoYSwgYiwgYykgeyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbXBsZXhpdHlcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogcmV0dXJuIGN1cnJpZWRcbiAgICAgIGNhc2UgMTogcmV0dXJuIGN1cnJ5MihmdW5jdGlvbiAoYiwgYykgeyByZXR1cm4gZihhLCBiLCBjKTsgfSlcbiAgICAgIGNhc2UgMjogcmV0dXJuIGZ1bmN0aW9uIChjKSB7IHJldHVybiBmKGEsIGIsIGMpOyB9XG4gICAgICBkZWZhdWx0OnJldHVybiBmKGEsIGIsIGMpXG4gICAgfVxuICB9XG4gIHJldHVybiBjdXJyaWVkXG59XG5cbmV4cG9ydHMuY29ucyA9IGNvbnM7XG5leHBvcnRzLmFwcGVuZCA9IGFwcGVuZDtcbmV4cG9ydHMuZHJvcCA9IGRyb3A7XG5leHBvcnRzLnRhaWwgPSB0YWlsO1xuZXhwb3J0cy5jb3B5ID0gY29weTtcbmV4cG9ydHMubWFwID0gbWFwO1xuZXhwb3J0cy5yZWR1Y2UgPSByZWR1Y2U7XG5leHBvcnRzLnJlcGxhY2UgPSByZXBsYWNlO1xuZXhwb3J0cy5yZW1vdmUgPSByZW1vdmU7XG5leHBvcnRzLnJlbW92ZUFsbCA9IHJlbW92ZUFsbDtcbmV4cG9ydHMuZmluZEluZGV4ID0gZmluZEluZGV4O1xuZXhwb3J0cy5pc0FycmF5TGlrZSA9IGlzQXJyYXlMaWtlO1xuZXhwb3J0cy5pZCA9IGlkO1xuZXhwb3J0cy5jb21wb3NlID0gY29tcG9zZTtcbmV4cG9ydHMuYXBwbHkgPSBhcHBseTtcbmV4cG9ydHMuY3VycnkyID0gY3VycnkyO1xuZXhwb3J0cy5jdXJyeTMgPSBjdXJyeTM7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1wcmVsdWRlLmpzLm1hcFxuIiwibW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL2xpYi9pbmRleCcpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuXG52YXIgX3BvbnlmaWxsID0gcmVxdWlyZSgnLi9wb255ZmlsbCcpO1xuXG52YXIgX3BvbnlmaWxsMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX3BvbnlmaWxsKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgJ2RlZmF1bHQnOiBvYmogfTsgfVxuXG52YXIgcm9vdDsgLyogZ2xvYmFsIHdpbmRvdyAqL1xuXG5cbmlmICh0eXBlb2Ygc2VsZiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHNlbGY7XG59IGVsc2UgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSB3aW5kb3c7XG59IGVsc2UgaWYgKHR5cGVvZiBnbG9iYWwgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBnbG9iYWw7XG59IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnKSB7XG4gIHJvb3QgPSBtb2R1bGU7XG59IGVsc2Uge1xuICByb290ID0gRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcbn1cblxudmFyIHJlc3VsdCA9ICgwLCBfcG9ueWZpbGwyWydkZWZhdWx0J10pKHJvb3QpO1xuZXhwb3J0c1snZGVmYXVsdCddID0gcmVzdWx0OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG5cdHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHNbJ2RlZmF1bHQnXSA9IHN5bWJvbE9ic2VydmFibGVQb255ZmlsbDtcbmZ1bmN0aW9uIHN5bWJvbE9ic2VydmFibGVQb255ZmlsbChyb290KSB7XG5cdHZhciByZXN1bHQ7XG5cdHZhciBfU3ltYm9sID0gcm9vdC5TeW1ib2w7XG5cblx0aWYgKHR5cGVvZiBfU3ltYm9sID09PSAnZnVuY3Rpb24nKSB7XG5cdFx0aWYgKF9TeW1ib2wub2JzZXJ2YWJsZSkge1xuXHRcdFx0cmVzdWx0ID0gX1N5bWJvbC5vYnNlcnZhYmxlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sKCdvYnNlcnZhYmxlJyk7XG5cdFx0XHRfU3ltYm9sLm9ic2VydmFibGUgPSByZXN1bHQ7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdHJlc3VsdCA9ICdAQG9ic2VydmFibGUnO1xuXHR9XG5cblx0cmV0dXJuIHJlc3VsdDtcbn07IiwiY29uc3QgRXZlbnRFbWl0dGVyID0gcmVxdWlyZSgnZXZlbnRzJyk7XG5cbmdsb2JhbC5idXMgPSBnbG9iYWwuYnVzIHx8IG5ldyBFdmVudEVtaXR0ZXIoKTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIGJ1czogZ2xvYmFsLmJ1cyxcbiAgbWFrZUVtaXR0ZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gIH1cbn07XG4iLCJpbXBvcnQgeyBidXMgfSBmcm9tICdwYXJ0eWJ1cyc7XG5pbXBvcnQgeyBtdXRhdGlvbldhdGNoIH0gZnJvbSAnLi9tdXRhdGlvbm9ic2VydmVyJztcbmltcG9ydCAqIGFzIG1vc3QgZnJvbSAnbW9zdCc7XG5cbm11dGF0aW9uV2F0Y2goJ1tsZWFybmluZy1lbGVtZW50XTpub3QoW3RyYW5zZm9ybWVkXSknLCAnbGVhcm5pbmdFbGVtZW50czo6Zm91bmQnKTtcblxubGV0IGNhY2hlID0ge307XG5cbm1vc3QuZnJvbUV2ZW50KCd3YXRjaGVyOjp0cmFuc2Zvcm1Db21wbGV0ZScsIGJ1cylcbiAgLnRhcCgoKSA9PiB7IGNhY2hlID0ge30gfSlcbiAgLmRyYWluKCk7XG5cbmNvbnN0IGxlYXJuaW5nRWxlbWVudCQgPSBtb3N0LmZyb21FdmVudCgnbGVhcm5pbmdFbGVtZW50czo6Zm91bmQnLCBidXMpXG4gIC5mbGF0TWFwKGVscyA9PiBtb3N0LmZyb20oZWxzKSApXG4gIC5maWx0ZXIoZWwgPT4gY2FjaGVbZWwuZ2V0QXR0cmlidXRlKCdsZWFybmluZy1lbGVtZW50LXJlZicpXSAhPT0gdHJ1ZSApXG4gIC50YXAoZWwgPT4gY2FjaGVbZWwuZ2V0QXR0cmlidXRlKCdsZWFybmluZy1lbGVtZW50LXJlZicpXSA9IHRydWUgKVxuICAudGFwKGVsID0+IGVsLnNldEF0dHJpYnV0ZSgndHJhbnNmb3JtZWQnLCB0cnVlKSApO1xuXG5leHBvcnQgeyBsZWFybmluZ0VsZW1lbnQkIH07XG5cbi8vIGVsIGNvbnRyYWN0IGF0dHJzOlxuLy8gbGVhcm5pbmctZWxlbWVudD1cInBvbGxcIlxuLy8gbGVhcm5pbmctZWxlbWVudC1yZWY9XCJpZGVudGlmaWVyXCIgLy9UT0RPOiBkaXNjdXNzIHVuaXF1ZW5lc3Mgb2YgaWRlbnRpZmllciwgaG93IGlzIHRoaXMgbWFuYWdlZD9cbi8vIHRyYW5zZm9ybWVkICh3aGVuIGVsZW1lbnQgaXMgc2VudCBmb3IgdHJhbnNmb3JtYXRpb24pXG5cbi8vIEVYQU1QTEUgSU1QTEVNRU5UQVRJT046XG4vL2xlYXJuaW5nRWxlbWVudHMkXG4vLyAgLmZpbHRlcihlbCA9PiBlbC5nZXRBdHRyaWJ1dGUoJ2xlYXJuaW5nLWVsZW1lbnQnKSA9PT0gJ3BvbGwnKVxuLy8gIC50YXAoZWwgPT4gZWwuYXBwZW5kKCc8ZGl2IGNsYXNzPVwibW91bnRcIj48L2Rpdj4nKSApXG4vLy5kcmFpbigpIiwiaW1wb3J0IHsgYnVzIH0gZnJvbSAncGFydHlidXMnO1xuXG5jb25zdCBNdXRhdGlvbk9ic2VydmVyID0gd2luZG93Lk11dGF0aW9uT2JzZXJ2ZXIgfHwgd2luZG93LldlYktpdE11dGF0aW9uT2JzZXJ2ZXIgfHwgd2luZG93Lk1vek11dGF0aW9uT2JzZXJ2ZXI7XG5cbmxldCBtdXRhdGlvbkxpc3RlbmVycyA9IFtdO1xuXG5jb25zdCBvYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGZ1bmN0aW9uKG11dGF0aW9ucykge1xuICBtdXRhdGlvbkxpc3RlbmVycy5mb3JFYWNoKGZ1bmN0aW9uKHsgc2VsZWN0b3IsIGVtaXRNZXNzYWdlIH0pe1xuICAgIC8vc2VsZWN0b3I6ICdbbGVhcm5pbmctZWxlbWVudF06bm90KFt0cmFuc2Zvcm1lZF0pJ1xuICAgIC8vZW1pdE1lc3NhZ2U6IGBsZWFybmluZ0VsZW1lbnQ6OmZvdW5kYFxuICAgIGNvbnN0IHRyYW5zZm9ybWFibGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcik7XG4gICAgaWYodHJhbnNmb3JtYWJsZXMubGVuZ3RoID4gMCl7XG4gICAgICBidXMuZW1pdChlbWl0TWVzc2FnZSwgdHJhbnNmb3JtYWJsZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICBidXMuZW1pdCgnd2F0Y2hlcjo6dHJhbnNmb3JtQ29tcGxldGUnKTtcbiAgICB9XG4gIH0pXG59KTtcblxub2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudCwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbmNvbnN0IG11dGF0aW9uV2F0Y2ggPSAoc2VsZWN0b3IsIGVtaXRNZXNzYWdlKSA9PiB7XG4gIG11dGF0aW9uTGlzdGVuZXJzLnB1c2goe3NlbGVjdG9yLCBlbWl0TWVzc2FnZX0pXG59O1xuXG5leHBvcnQgeyBtdXRhdGlvbldhdGNoIH07XG4iLCJpbXBvcnQgeyBtdXRhdGlvbldhdGNoIH0gZnJvbSAnLi9tdXRhdGlvbm9ic2VydmVyJztcbmltcG9ydCB7IGxlYXJuaW5nRWxlbWVudCQgfSBmcm9tICcuL2xlYXJuaW5nRWxlbWVudFdhdGNoJztcblxuZXhwb3J0IHtcbiAgbXV0YXRpb25XYXRjaCxcbiAgbGVhcm5pbmdFbGVtZW50JFxufTsiXX0=
