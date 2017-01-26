(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _watcher = require('./src/watcher');

_watcher.learningElement$.tap(console.log).drain();

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

var learningElement$ = most.fromEvent('learningElements::found', _partybus.bus).tap(function (els) {
  if (els.length === 0) {
    _partybus.bus.emit('watcher::transformComplete');cache = {};
  }
}).flatMap(function (els) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlLmpzIiwibm9kZV9tb2R1bGVzL2Jyb3dzZXJpZnkvbm9kZV9tb2R1bGVzL2V2ZW50cy9ldmVudHMuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvTGlua2VkTGlzdC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9Qcm9taXNlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL1F1ZXVlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL1N0cmVhbS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2FjY3VtdWxhdGUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9hcHBsaWNhdGl2ZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2J1aWxkLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvY29tYmluZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2NvbmNhdE1hcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2NvbnRpbnVlV2l0aC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2RlbGF5LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvZXJyb3JzLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvZmlsdGVyLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvZmxhdE1hcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL2xpbWl0LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvbG9vcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL21lcmdlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvbWVyZ2VDb25jdXJyZW50bHkuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9vYnNlcnZlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2NvbWJpbmF0b3IvcHJvbWlzZXMuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9zYW1wbGUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci9zbGljZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL3N3aXRjaC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9jb21iaW5hdG9yL3RocnUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90aW1lc2xpY2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90aW1lc3RhbXAuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90cmFuc2R1Y2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci90cmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvY29tYmluYXRvci96aXAuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvZGlzcG9zYWJsZS9EaXNwb3NhYmxlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2Rpc3Bvc2FibGUvU2V0dGFibGVEaXNwb3NhYmxlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2Rpc3Bvc2FibGUvZGlzcG9zZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9mYXRhbEVycm9yLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2Z1c2lvbi9GaWx0ZXIuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvZnVzaW9uL0ZpbHRlck1hcC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9mdXNpb24vTWFwLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL2ludm9rZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9pdGVyYWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9vYnNlcnZhYmxlL2Zyb21PYnNlcnZhYmxlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL29ic2VydmFibGUvZ2V0T2JzZXJ2YWJsZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9vYnNlcnZhYmxlL3N1YnNjcmliZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9ydW5Tb3VyY2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL0Nsb2NrVGltZXIuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL1Byb3BhZ2F0ZVRhc2suanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL1NjaGVkdWxlZFRhc2suanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL1NjaGVkdWxlci5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zY2hlZHVsZXIvVGltZWxpbmUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2NoZWR1bGVyL2RlZmF1bHRTY2hlZHVsZXIuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2luay9EZWZlcnJlZFNpbmsuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2luay9JbmRleFNpbmsuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc2luay9QaXBlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NpbmsvU2FmZVNpbmsuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL0V2ZW50RW1pdHRlclNvdXJjZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zb3VyY2UvRXZlbnRUYXJnZXRTb3VyY2UuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2NvcmUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2Zyb20uanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2Zyb21BcnJheS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zb3VyY2UvZnJvbUV2ZW50LmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NvdXJjZS9mcm9tSXRlcmFibGUuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL2dlbmVyYXRlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NvdXJjZS9pdGVyYXRlLmpzIiwibm9kZV9tb2R1bGVzL21vc3QvbGliL3NvdXJjZS9wZXJpb2RpYy5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi9zb3VyY2UvdHJ5RXZlbnQuanMiLCJub2RlX21vZHVsZXMvbW9zdC9saWIvc291cmNlL3VuZm9sZC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L2xpYi90YXNrLmpzIiwibm9kZV9tb2R1bGVzL21vc3Qvbm9kZV9tb2R1bGVzL0Btb3N0L211bHRpY2FzdC9kaXN0L211bHRpY2FzdC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L25vZGVfbW9kdWxlcy9AbW9zdC9wcmVsdWRlL2Rpc3QvcHJlbHVkZS5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L25vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tb3N0L25vZGVfbW9kdWxlcy9zeW1ib2wtb2JzZXJ2YWJsZS9saWIvaW5kZXguanMiLCJub2RlX21vZHVsZXMvbW9zdC9ub2RlX21vZHVsZXMvc3ltYm9sLW9ic2VydmFibGUvbGliL3BvbnlmaWxsLmpzIiwibm9kZV9tb2R1bGVzL3BhcnR5YnVzL3NyYy9wYXJ0eWJ1cy5qcyIsInNyYy9sZWFybmluZ0VsZW1lbnRXYXRjaC5qcyIsInNyYy9tdXRhdGlvbm9ic2VydmVyLmpzIiwic3JjL3dhdGNoZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7OztBQ0FBOztBQUVBLDBCQUFBLEFBQ0csSUFBSSxRQURQLEFBQ2UsS0FEZixBQUVHOzs7QUNKSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0lBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3B6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwUEE7QUFDQTs7O0FDREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzVCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7QUNWQTs7QUFDQTs7QUFDQTs7SSxBQUFZOzs7Ozs7Ozs7Ozs7OztBQUVaLHFDQUFBLEFBQWMseUNBQWQsQUFBdUQ7O0FBRXZELElBQUksUUFBSixBQUFZOztBQUVaLElBQU0sd0JBQW1CLEFBQUssVUFBTCxBQUFlLDBDQUFmLEFBQ3RCLElBQUksZUFBTyxBQUFFO01BQUcsSUFBQSxBQUFJLFdBQVAsQUFBa0IsR0FBRSxBQUFFO2tCQUFBLEFBQUksS0FBSixBQUFTLDhCQUErQixRQUFBLEFBQVEsQUFBSTtBQUFFO0FBRG5FLENBQUEsRUFBQSxBQUV0QixRQUFRLGVBQUE7U0FBTyxLQUFBLEFBQUssS0FBWixBQUFPLEFBQVU7QUFGSCxHQUFBLEFBR3RCLE9BQU8sY0FBQTtTQUFNLE1BQU0sR0FBQSxBQUFHLGFBQVQsQUFBTSxBQUFnQiw2QkFBNUIsQUFBeUQ7QUFIMUMsR0FBQSxBQUl0QixJQUFJLGNBQUE7U0FBTSxNQUFNLEdBQUEsQUFBRyxhQUFULEFBQU0sQUFBZ0IsMkJBQTVCLEFBQXVEO0FBSnJDLEdBQUEsQUFLdEIsSUFBSSxjQUFBO1NBQU0sR0FBQSxBQUFHLGFBQUgsQUFBZ0IsZUFBdEIsQUFBTSxBQUErQjtBQUw1QyxBQUF5Qjs7USxBQU9oQixtQixBQUFBOztBQUVUO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7QUMxQkE7O0FBRUEsSUFBTSxtQkFBbUIsT0FBQSxBQUFPLG9CQUFvQixPQUEzQixBQUFrQywwQkFBMEIsT0FBckYsQUFBNEY7O0FBRTVGLElBQUksb0JBQUosQUFBd0I7O0FBRXhCLElBQU0sZUFBVyxBQUFJLGlCQUFpQixVQUFBLEFBQVMsV0FBVyxBQUN4RDtvQkFBQSxBQUFrQixRQUFRLGdCQUFtQztRQUF4QixBQUF3QixnQkFBeEIsQUFBd0I7UUFBZCxBQUFjLG1CQUFkLEFBQWMsQUFDM0Q7O0FBQ0E7QUFDQTtRQUFNLGlCQUFpQixTQUFBLEFBQVMsaUJBQWhDLEFBQXVCLEFBQTBCLEFBQ2pEO1FBQUcsZUFBQSxBQUFlLFNBQWxCLEFBQTJCLEdBQUUsQUFBRTtvQkFBQSxBQUFJLEtBQUosQUFBUyxhQUFULEFBQXNCLEFBQWtCO0FBQ3hFO0FBTEQsQUFNRDtBQVBELEFBQWlCLENBQUE7O0FBU2pCLFNBQUEsQUFBUyxRQUFULEFBQWlCLFVBQVUsRUFBRSxZQUFGLEFBQWMsTUFBTSxXQUFwQixBQUErQixNQUFNLGVBQXJDLEFBQW9ELE1BQU0sU0FBckYsQUFBMkIsQUFBbUU7O0FBRTlGLElBQU0sZ0JBQWdCLFNBQWhCLEFBQWdCLGNBQUEsQUFBQyxVQUFELEFBQVcsYUFBZ0IsQUFDL0M7b0JBQUEsQUFBa0IsS0FBSyxFQUFDLFVBQUQsVUFBVyxhQUFsQyxBQUF1QixBQUN4QjtBQUZEOztRLEFBSVMsZ0IsQUFBQTs7Ozs7Ozs7OztBQ3JCVDs7QUFDQTs7USxBQUdFO1EsQUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQgeyBtdXRhdGlvbldhdGNoLCBsZWFybmluZ0VsZW1lbnQkIH0gZnJvbSAnLi9zcmMvd2F0Y2hlcic7XG5cbmxlYXJuaW5nRWxlbWVudCRcbiAgLnRhcChjb25zb2xlLmxvZylcbiAgLmRyYWluKCk7IiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEF0IGxlYXN0IGdpdmUgc29tZSBraW5kIG9mIGNvbnRleHQgdG8gdGhlIHVzZXJcbiAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4gKCcgKyBlciArICcpJyk7XG4gICAgICAgIGVyci5jb250ZXh0ID0gZXI7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBMaW5rZWRMaXN0O1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbi8qKlxuICogRG91Ymx5IGxpbmtlZCBsaXN0XG4gKiBAY29uc3RydWN0b3JcbiAqL1xuZnVuY3Rpb24gTGlua2VkTGlzdCgpIHtcbiAgdGhpcy5oZWFkID0gbnVsbDtcbiAgdGhpcy5sZW5ndGggPSAwO1xufVxuXG4vKipcbiAqIEFkZCBhIG5vZGUgdG8gdGhlIGVuZCBvZiB0aGUgbGlzdFxuICogQHBhcmFtIHt7cHJldjpPYmplY3R8bnVsbCwgbmV4dDpPYmplY3R8bnVsbCwgZGlzcG9zZTpmdW5jdGlvbn19IHggbm9kZSB0byBhZGRcbiAqL1xuTGlua2VkTGlzdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHgpIHtcbiAgaWYgKHRoaXMuaGVhZCAhPT0gbnVsbCkge1xuICAgIHRoaXMuaGVhZC5wcmV2ID0geDtcbiAgICB4Lm5leHQgPSB0aGlzLmhlYWQ7XG4gIH1cbiAgdGhpcy5oZWFkID0geDtcbiAgKyt0aGlzLmxlbmd0aDtcbn07XG5cbi8qKlxuICogUmVtb3ZlIHRoZSBwcm92aWRlZCBub2RlIGZyb20gdGhlIGxpc3RcbiAqIEBwYXJhbSB7e3ByZXY6T2JqZWN0fG51bGwsIG5leHQ6T2JqZWN0fG51bGwsIGRpc3Bvc2U6ZnVuY3Rpb259fSB4IG5vZGUgdG8gcmVtb3ZlXG4gKi9cbkxpbmtlZExpc3QucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uICh4KSB7XG4gIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgIGNvbXBsZXhpdHlcbiAgLS10aGlzLmxlbmd0aDtcbiAgaWYgKHggPT09IHRoaXMuaGVhZCkge1xuICAgIHRoaXMuaGVhZCA9IHRoaXMuaGVhZC5uZXh0O1xuICB9XG4gIGlmICh4Lm5leHQgIT09IG51bGwpIHtcbiAgICB4Lm5leHQucHJldiA9IHgucHJldjtcbiAgICB4Lm5leHQgPSBudWxsO1xuICB9XG4gIGlmICh4LnByZXYgIT09IG51bGwpIHtcbiAgICB4LnByZXYubmV4dCA9IHgubmV4dDtcbiAgICB4LnByZXYgPSBudWxsO1xuICB9XG59O1xuXG4vKipcbiAqIEByZXR1cm5zIHtib29sZWFufSB0cnVlIGlmZiB0aGVyZSBhcmUgbm8gbm9kZXMgaW4gdGhlIGxpc3RcbiAqL1xuTGlua2VkTGlzdC5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMubGVuZ3RoID09PSAwO1xufTtcblxuLyoqXG4gKiBEaXNwb3NlIGFsbCBub2Rlc1xuICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdGhhdCBmdWxmaWxscyB3aGVuIGFsbCBub2RlcyBoYXZlIGJlZW4gZGlzcG9zZWQsXG4gKiAgb3IgcmVqZWN0cyBpZiBhbiBlcnJvciBvY2N1cnMgd2hpbGUgZGlzcG9zaW5nXG4gKi9cbkxpbmtlZExpc3QucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLmlzRW1wdHkoKSkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHZhciBwcm9taXNlcyA9IFtdO1xuICB2YXIgeCA9IHRoaXMuaGVhZDtcbiAgdGhpcy5oZWFkID0gbnVsbDtcbiAgdGhpcy5sZW5ndGggPSAwO1xuXG4gIHdoaWxlICh4ICE9PSBudWxsKSB7XG4gICAgcHJvbWlzZXMucHVzaCh4LmRpc3Bvc2UoKSk7XG4gICAgeCA9IHgubmV4dDtcbiAgfVxuXG4gIHJldHVybiBQcm9taXNlLmFsbChwcm9taXNlcyk7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuaXNQcm9taXNlID0gaXNQcm9taXNlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGlzUHJvbWlzZShwKSB7XG4gIHJldHVybiBwICE9PSBudWxsICYmIHR5cGVvZiBwID09PSAnb2JqZWN0JyAmJiB0eXBlb2YgcC50aGVuID09PSAnZnVuY3Rpb24nO1xufSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gUXVldWU7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuLy8gQmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL3BldGthYW50b25vdi9kZXF1ZVxuXG5mdW5jdGlvbiBRdWV1ZShjYXBQb3cyKSB7XG4gIHRoaXMuX2NhcGFjaXR5ID0gY2FwUG93MiB8fCAzMjtcbiAgdGhpcy5fbGVuZ3RoID0gMDtcbiAgdGhpcy5faGVhZCA9IDA7XG59XG5cblF1ZXVlLnByb3RvdHlwZS5wdXNoID0gZnVuY3Rpb24gKHgpIHtcbiAgdmFyIGxlbiA9IHRoaXMuX2xlbmd0aDtcbiAgdGhpcy5fY2hlY2tDYXBhY2l0eShsZW4gKyAxKTtcblxuICB2YXIgaSA9IHRoaXMuX2hlYWQgKyBsZW4gJiB0aGlzLl9jYXBhY2l0eSAtIDE7XG4gIHRoaXNbaV0gPSB4O1xuICB0aGlzLl9sZW5ndGggPSBsZW4gKyAxO1xufTtcblxuUXVldWUucHJvdG90eXBlLnNoaWZ0ID0gZnVuY3Rpb24gKCkge1xuICB2YXIgaGVhZCA9IHRoaXMuX2hlYWQ7XG4gIHZhciB4ID0gdGhpc1toZWFkXTtcblxuICB0aGlzW2hlYWRdID0gdm9pZCAwO1xuICB0aGlzLl9oZWFkID0gaGVhZCArIDEgJiB0aGlzLl9jYXBhY2l0eSAtIDE7XG4gIHRoaXMuX2xlbmd0aC0tO1xuICByZXR1cm4geDtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fbGVuZ3RoID09PSAwO1xufTtcblxuUXVldWUucHJvdG90eXBlLmxlbmd0aCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuX2xlbmd0aDtcbn07XG5cblF1ZXVlLnByb3RvdHlwZS5fY2hlY2tDYXBhY2l0eSA9IGZ1bmN0aW9uIChzaXplKSB7XG4gIGlmICh0aGlzLl9jYXBhY2l0eSA8IHNpemUpIHtcbiAgICB0aGlzLl9lbnN1cmVDYXBhY2l0eSh0aGlzLl9jYXBhY2l0eSA8PCAxKTtcbiAgfVxufTtcblxuUXVldWUucHJvdG90eXBlLl9lbnN1cmVDYXBhY2l0eSA9IGZ1bmN0aW9uIChjYXBhY2l0eSkge1xuICB2YXIgb2xkQ2FwYWNpdHkgPSB0aGlzLl9jYXBhY2l0eTtcbiAgdGhpcy5fY2FwYWNpdHkgPSBjYXBhY2l0eTtcblxuICB2YXIgbGFzdCA9IHRoaXMuX2hlYWQgKyB0aGlzLl9sZW5ndGg7XG5cbiAgaWYgKGxhc3QgPiBvbGRDYXBhY2l0eSkge1xuICAgIGNvcHkodGhpcywgMCwgdGhpcywgb2xkQ2FwYWNpdHksIGxhc3QgJiBvbGRDYXBhY2l0eSAtIDEpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBjb3B5KHNyYywgc3JjSW5kZXgsIGRzdCwgZHN0SW5kZXgsIGxlbikge1xuICBmb3IgKHZhciBqID0gMDsgaiA8IGxlbjsgKytqKSB7XG4gICAgZHN0W2ogKyBkc3RJbmRleF0gPSBzcmNbaiArIHNyY0luZGV4XTtcbiAgICBzcmNbaiArIHNyY0luZGV4XSA9IHZvaWQgMDtcbiAgfVxufSIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU3RyZWFtO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFN0cmVhbShzb3VyY2UpIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5zY2FuID0gc2NhbjtcbmV4cG9ydHMucmVkdWNlID0gcmVkdWNlO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX3J1blNvdXJjZSA9IHJlcXVpcmUoJy4uL3J1blNvdXJjZScpO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfUHJvcGFnYXRlVGFzayA9IHJlcXVpcmUoJy4uL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQ3JlYXRlIGEgc3RyZWFtIGNvbnRhaW5pbmcgc3VjY2Vzc2l2ZSByZWR1Y2UgcmVzdWx0cyBvZiBhcHBseWluZyBmIHRvXG4gKiB0aGUgcHJldmlvdXMgcmVkdWNlIHJlc3VsdCBhbmQgdGhlIGN1cnJlbnQgc3RyZWFtIGl0ZW0uXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHJlc3VsdDoqLCB4OiopOip9IGYgcmVkdWNlciBmdW5jdGlvblxuICogQHBhcmFtIHsqfSBpbml0aWFsIGluaXRpYWwgdmFsdWVcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIHRvIHNjYW5cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBzdWNjZXNzaXZlIHJlZHVjZSByZXN1bHRzXG4gKi9cbmZ1bmN0aW9uIHNjYW4oZiwgaW5pdGlhbCwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgU2NhbihmLCBpbml0aWFsLCBzdHJlYW0uc291cmNlKSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBTY2FuKGYsIHosIHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy52YWx1ZSA9IHo7XG59XG5cblNjYW4ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIGQxID0gc2NoZWR1bGVyLmFzYXAoX1Byb3BhZ2F0ZVRhc2syLmRlZmF1bHQuZXZlbnQodGhpcy52YWx1ZSwgc2luaykpO1xuICB2YXIgZDIgPSB0aGlzLnNvdXJjZS5ydW4obmV3IFNjYW5TaW5rKHRoaXMuZiwgdGhpcy52YWx1ZSwgc2luayksIHNjaGVkdWxlcik7XG4gIHJldHVybiBkaXNwb3NlLmFsbChbZDEsIGQyXSk7XG59O1xuXG5mdW5jdGlvbiBTY2FuU2luayhmLCB6LCBzaW5rKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMudmFsdWUgPSB6O1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5TY2FuU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgZiA9IHRoaXMuZjtcbiAgdGhpcy52YWx1ZSA9IGYodGhpcy52YWx1ZSwgeCk7XG4gIHRoaXMuc2luay5ldmVudCh0LCB0aGlzLnZhbHVlKTtcbn07XG5cblNjYW5TaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblNjYW5TaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuXG4vKipcbiogUmVkdWNlIGEgc3RyZWFtIHRvIHByb2R1Y2UgYSBzaW5nbGUgcmVzdWx0LiAgTm90ZSB0aGF0IHJlZHVjaW5nIGFuIGluZmluaXRlXG4qIHN0cmVhbSB3aWxsIHJldHVybiBhIFByb21pc2UgdGhhdCBuZXZlciBmdWxmaWxscywgYnV0IHRoYXQgbWF5IHJlamVjdCBpZiBhbiBlcnJvclxuKiBvY2N1cnMuXG4qIEBwYXJhbSB7ZnVuY3Rpb24ocmVzdWx0OiosIHg6Kik6Kn0gZiByZWR1Y2VyIGZ1bmN0aW9uXG4qIEBwYXJhbSB7Kn0gaW5pdGlhbCBpbml0aWFsIHZhbHVlXG4qIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gdG8gcmVkdWNlXG4qIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIGZvciB0aGUgZmlsZSByZXN1bHQgb2YgdGhlIHJlZHVjZVxuKi9cbmZ1bmN0aW9uIHJlZHVjZShmLCBpbml0aWFsLCBzdHJlYW0pIHtcbiAgcmV0dXJuICgwLCBfcnVuU291cmNlLndpdGhEZWZhdWx0U2NoZWR1bGVyKShuZXcgUmVkdWNlKGYsIGluaXRpYWwsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gUmVkdWNlKGYsIHosIHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy52YWx1ZSA9IHo7XG59XG5cblJlZHVjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gdGhpcy5zb3VyY2UucnVuKG5ldyBSZWR1Y2VTaW5rKHRoaXMuZiwgdGhpcy52YWx1ZSwgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBSZWR1Y2VTaW5rKGYsIHosIHNpbmspIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy52YWx1ZSA9IHo7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cblJlZHVjZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIGYgPSB0aGlzLmY7XG4gIHRoaXMudmFsdWUgPSBmKHRoaXMudmFsdWUsIHgpO1xuICB0aGlzLnNpbmsuZXZlbnQodCwgdGhpcy52YWx1ZSk7XG59O1xuXG5SZWR1Y2VTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuUmVkdWNlU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQpIHtcbiAgdGhpcy5zaW5rLmVuZCh0LCB0aGlzLnZhbHVlKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5hcCA9IGFwO1xuXG52YXIgX2NvbWJpbmUgPSByZXF1aXJlKCcuL2NvbWJpbmUnKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG4vKipcbiAqIEFzc3VtZSBmcyBpcyBhIHN0cmVhbSBjb250YWluaW5nIGZ1bmN0aW9ucywgYW5kIGFwcGx5IHRoZSBsYXRlc3QgZnVuY3Rpb25cbiAqIGluIGZzIHRvIHRoZSBsYXRlc3QgdmFsdWUgaW4geHMuXG4gKiBmczogICAgICAgICAtLWYtLS0tLS0tLS1nLS0tLS0tLS1oLS0tLS0tPlxuICogeHM6ICAgICAgICAgLWEtLS0tLS0tYi0tLS0tLS1jLS0tLS0tLWQtLT5cbiAqIGFwKGZzLCB4cyk6IC0tZmEtLS0tLWZiLWdiLS0tZ2MtLWhjLS1oZC0+XG4gKiBAcGFyYW0ge1N0cmVhbX0gZnMgc3RyZWFtIG9mIGZ1bmN0aW9ucyB0byBhcHBseSB0byB0aGUgbGF0ZXN0IHhcbiAqIEBwYXJhbSB7U3RyZWFtfSB4cyBzdHJlYW0gb2YgdmFsdWVzIHRvIHdoaWNoIHRvIGFwcGx5IGFsbCB0aGUgbGF0ZXN0IGZcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGFsbCB0aGUgYXBwbGljYXRpb25zIG9mIGZzIHRvIHhzXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBhcChmcywgeHMpIHtcbiAgcmV0dXJuICgwLCBfY29tYmluZS5jb21iaW5lKShfcHJlbHVkZS5hcHBseSwgZnMsIHhzKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmNvbnMgPSBjb25zO1xuZXhwb3J0cy5jb25jYXQgPSBjb25jYXQ7XG5cbnZhciBfY29yZSA9IHJlcXVpcmUoJy4uL3NvdXJjZS9jb3JlJyk7XG5cbnZhciBfY29udGludWVXaXRoID0gcmVxdWlyZSgnLi9jb250aW51ZVdpdGgnKTtcblxuLyoqXG4gKiBAcGFyYW0geyp9IHggdmFsdWUgdG8gcHJlcGVuZFxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aXRoIHggcHJlcGVuZGVkXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBjb25zKHgsIHN0cmVhbSkge1xuICByZXR1cm4gY29uY2F0KCgwLCBfY29yZS5vZikoeCksIHN0cmVhbSk7XG59XG5cbi8qKlxuKiBAcGFyYW0ge1N0cmVhbX0gbGVmdFxuKiBAcGFyYW0ge1N0cmVhbX0gcmlnaHRcbiogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIGFsbCBldmVudHMgaW4gbGVmdCBmb2xsb3dlZCBieSBhbGxcbiogIGV2ZW50cyBpbiByaWdodC4gIFRoaXMgKnRpbWVzaGlmdHMqIHJpZ2h0IHRvIHRoZSBlbmQgb2YgbGVmdC5cbiovXG5mdW5jdGlvbiBjb25jYXQobGVmdCwgcmlnaHQpIHtcbiAgcmV0dXJuICgwLCBfY29udGludWVXaXRoLmNvbnRpbnVlV2l0aCkoZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiByaWdodDtcbiAgfSwgbGVmdCk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5jb21iaW5lID0gY29tYmluZTtcbmV4cG9ydHMuY29tYmluZUFycmF5ID0gY29tYmluZUFycmF5O1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX3RyYW5zZm9ybSA9IHJlcXVpcmUoJy4vdHJhbnNmb3JtJyk7XG5cbnZhciB0cmFuc2Zvcm0gPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfdHJhbnNmb3JtKTtcblxudmFyIF9jb3JlID0gcmVxdWlyZSgnLi4vc291cmNlL2NvcmUnKTtcblxudmFyIGNvcmUgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfY29yZSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfSW5kZXhTaW5rID0gcmVxdWlyZSgnLi4vc2luay9JbmRleFNpbmsnKTtcblxudmFyIF9JbmRleFNpbmsyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfSW5kZXhTaW5rKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX3ByZWx1ZGUgPSByZXF1aXJlKCdAbW9zdC9wcmVsdWRlJyk7XG5cbnZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3ByZWx1ZGUpO1xuXG52YXIgX2ludm9rZSA9IHJlcXVpcmUoJy4uL2ludm9rZScpO1xuXG52YXIgX2ludm9rZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9pbnZva2UpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbnZhciBtYXAgPSBiYXNlLm1hcDtcbnZhciB0YWlsID0gYmFzZS50YWlsO1xuXG4vKipcbiAqIENvbWJpbmUgbGF0ZXN0IGV2ZW50cyBmcm9tIGFsbCBpbnB1dCBzdHJlYW1zXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKC4uLmV2ZW50cyk6Kn0gZiBmdW5jdGlvbiB0byBjb21iaW5lIG1vc3QgcmVjZW50IGV2ZW50c1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgdGhlIHJlc3VsdCBvZiBhcHBseWluZyBmIHRvIHRoZSBtb3N0IHJlY2VudFxuICogIGV2ZW50IG9mIGVhY2ggaW5wdXQgc3RyZWFtLCB3aGVuZXZlciBhIG5ldyBldmVudCBhcnJpdmVzIG9uIGFueSBzdHJlYW0uXG4gKi9cbmZ1bmN0aW9uIGNvbWJpbmUoZiAvKiwgLi4uc3RyZWFtcyAqLykge1xuICByZXR1cm4gY29tYmluZUFycmF5KGYsIHRhaWwoYXJndW1lbnRzKSk7XG59XG5cbi8qKlxuKiBDb21iaW5lIGxhdGVzdCBldmVudHMgZnJvbSBhbGwgaW5wdXQgc3RyZWFtc1xuKiBAcGFyYW0ge2Z1bmN0aW9uKC4uLmV2ZW50cyk6Kn0gZiBmdW5jdGlvbiB0byBjb21iaW5lIG1vc3QgcmVjZW50IGV2ZW50c1xuKiBAcGFyYW0ge1tTdHJlYW1dfSBzdHJlYW1zIG1vc3QgcmVjZW50IGV2ZW50c1xuKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyB0aGUgcmVzdWx0IG9mIGFwcGx5aW5nIGYgdG8gdGhlIG1vc3QgcmVjZW50XG4qICBldmVudCBvZiBlYWNoIGlucHV0IHN0cmVhbSwgd2hlbmV2ZXIgYSBuZXcgZXZlbnQgYXJyaXZlcyBvbiBhbnkgc3RyZWFtLlxuKi9cbmZ1bmN0aW9uIGNvbWJpbmVBcnJheShmLCBzdHJlYW1zKSB7XG4gIHZhciBsID0gc3RyZWFtcy5sZW5ndGg7XG4gIHJldHVybiBsID09PSAwID8gY29yZS5lbXB0eSgpIDogbCA9PT0gMSA/IHRyYW5zZm9ybS5tYXAoZiwgc3RyZWFtc1swXSkgOiBuZXcgX1N0cmVhbTIuZGVmYXVsdChjb21iaW5lU291cmNlcyhmLCBzdHJlYW1zKSk7XG59XG5cbmZ1bmN0aW9uIGNvbWJpbmVTb3VyY2VzKGYsIHN0cmVhbXMpIHtcbiAgcmV0dXJuIG5ldyBDb21iaW5lKGYsIG1hcChnZXRTb3VyY2UsIHN0cmVhbXMpKTtcbn1cblxuZnVuY3Rpb24gZ2V0U291cmNlKHN0cmVhbSkge1xuICByZXR1cm4gc3RyZWFtLnNvdXJjZTtcbn1cblxuZnVuY3Rpb24gQ29tYmluZShmLCBzb3VyY2VzKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc291cmNlcyA9IHNvdXJjZXM7XG59XG5cbkNvbWJpbmUucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgdmFyIGwgPSB0aGlzLnNvdXJjZXMubGVuZ3RoO1xuICB2YXIgZGlzcG9zYWJsZXMgPSBuZXcgQXJyYXkobCk7XG4gIHZhciBzaW5rcyA9IG5ldyBBcnJheShsKTtcblxuICB2YXIgbWVyZ2VTaW5rID0gbmV3IENvbWJpbmVTaW5rKGRpc3Bvc2FibGVzLCBzaW5rcywgc2luaywgdGhpcy5mKTtcblxuICBmb3IgKHZhciBpbmRleFNpbmssIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgaW5kZXhTaW5rID0gc2lua3NbaV0gPSBuZXcgX0luZGV4U2luazIuZGVmYXVsdChpLCBtZXJnZVNpbmspO1xuICAgIGRpc3Bvc2FibGVzW2ldID0gdGhpcyQxLnNvdXJjZXNbaV0ucnVuKGluZGV4U2luaywgc2NoZWR1bGVyKTtcbiAgfVxuXG4gIHJldHVybiBkaXNwb3NlLmFsbChkaXNwb3NhYmxlcyk7XG59O1xuXG5mdW5jdGlvbiBDb21iaW5lU2luayhkaXNwb3NhYmxlcywgc2lua3MsIHNpbmssIGYpIHtcbiAgdmFyIHRoaXMkMSA9IHRoaXM7XG5cbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5kaXNwb3NhYmxlcyA9IGRpc3Bvc2FibGVzO1xuICB0aGlzLnNpbmtzID0gc2lua3M7XG4gIHRoaXMuZiA9IGY7XG5cbiAgdmFyIGwgPSBzaW5rcy5sZW5ndGg7XG4gIHRoaXMuYXdhaXRpbmcgPSBsO1xuICB0aGlzLnZhbHVlcyA9IG5ldyBBcnJheShsKTtcbiAgdGhpcy5oYXNWYWx1ZSA9IG5ldyBBcnJheShsKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICB0aGlzJDEuaGFzVmFsdWVbaV0gPSBmYWxzZTtcbiAgfVxuXG4gIHRoaXMuYWN0aXZlQ291bnQgPSBzaW5rcy5sZW5ndGg7XG59XG5cbkNvbWJpbmVTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuQ29tYmluZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIGluZGV4ZWRWYWx1ZSkge1xuICB2YXIgaSA9IGluZGV4ZWRWYWx1ZS5pbmRleDtcbiAgdmFyIGF3YWl0aW5nID0gdGhpcy5fdXBkYXRlUmVhZHkoaSk7XG5cbiAgdGhpcy52YWx1ZXNbaV0gPSBpbmRleGVkVmFsdWUudmFsdWU7XG4gIGlmIChhd2FpdGluZyA9PT0gMCkge1xuICAgIHRoaXMuc2luay5ldmVudCh0LCAoMCwgX2ludm9rZTIuZGVmYXVsdCkodGhpcy5mLCB0aGlzLnZhbHVlcykpO1xuICB9XG59O1xuXG5Db21iaW5lU2luay5wcm90b3R5cGUuX3VwZGF0ZVJlYWR5ID0gZnVuY3Rpb24gKGluZGV4KSB7XG4gIGlmICh0aGlzLmF3YWl0aW5nID4gMCkge1xuICAgIGlmICghdGhpcy5oYXNWYWx1ZVtpbmRleF0pIHtcbiAgICAgIHRoaXMuaGFzVmFsdWVbaW5kZXhdID0gdHJ1ZTtcbiAgICAgIHRoaXMuYXdhaXRpbmcgLT0gMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRoaXMuYXdhaXRpbmc7XG59O1xuXG5Db21iaW5lU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIGluZGV4ZWRWYWx1ZSkge1xuICBkaXNwb3NlLnRyeURpc3Bvc2UodCwgdGhpcy5kaXNwb3NhYmxlc1tpbmRleGVkVmFsdWUuaW5kZXhdLCB0aGlzLnNpbmspO1xuICBpZiAoLS10aGlzLmFjdGl2ZUNvdW50ID09PSAwKSB7XG4gICAgdGhpcy5zaW5rLmVuZCh0LCBpbmRleGVkVmFsdWUudmFsdWUpO1xuICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuY29uY2F0TWFwID0gY29uY2F0TWFwO1xuXG52YXIgX21lcmdlQ29uY3VycmVudGx5ID0gcmVxdWlyZSgnLi9tZXJnZUNvbmN1cnJlbnRseScpO1xuXG4vKipcbiAqIE1hcCBlYWNoIHZhbHVlIGluIHN0cmVhbSB0byBhIG5ldyBzdHJlYW0sIGFuZCBjb25jYXRlbmF0ZSB0aGVtIGFsbFxuICogc3RyZWFtOiAgICAgICAgICAgICAgLWEtLS1iLS0tY1hcbiAqIGYoYSk6ICAgICAgICAgICAgICAgICAxLTEtMS0xWFxuICogZihiKTogICAgICAgICAgICAgICAgICAgICAgICAtMi0yLTItMlhcbiAqIGYoYyk6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAtMy0zLTMtM1hcbiAqIHN0cmVhbS5jb25jYXRNYXAoZik6IC0xLTEtMS0xLTItMi0yLTItMy0zLTMtM1hcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKTpTdHJlYW19IGYgZnVuY3Rpb24gdG8gbWFwIGVhY2ggdmFsdWUgdG8gYSBzdHJlYW1cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBhbGwgZXZlbnRzIGZyb20gZWFjaCBzdHJlYW0gcmV0dXJuZWQgYnkgZlxuICovXG5mdW5jdGlvbiBjb25jYXRNYXAoZiwgc3RyZWFtKSB7XG4gIHJldHVybiAoMCwgX21lcmdlQ29uY3VycmVudGx5Lm1lcmdlTWFwQ29uY3VycmVudGx5KShmLCAxLCBzdHJlYW0pO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmNvbnRpbnVlV2l0aCA9IGNvbnRpbnVlV2l0aDtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gY29udGludWVXaXRoKGYsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IENvbnRpbnVlV2l0aChmLCBzdHJlYW0uc291cmNlKSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBDb250aW51ZVdpdGgoZiwgc291cmNlKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5Db250aW51ZVdpdGgucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBDb250aW51ZVdpdGhTaW5rKHRoaXMuZiwgdGhpcy5zb3VyY2UsIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBDb250aW51ZVdpdGhTaW5rKGYsIHNvdXJjZSwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IGRpc3Bvc2Uub25jZShzb3VyY2UucnVuKHRoaXMsIHNjaGVkdWxlcikpO1xufVxuXG5Db250aW51ZVdpdGhTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuQ29udGludWVXaXRoU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbn07XG5cbkNvbnRpbnVlV2l0aFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICBkaXNwb3NlLnRyeURpc3Bvc2UodCwgdGhpcy5kaXNwb3NhYmxlLCB0aGlzLnNpbmspO1xuICB0aGlzLl9zdGFydE5leHQodCwgeCwgdGhpcy5zaW5rKTtcbn07XG5cbkNvbnRpbnVlV2l0aFNpbmsucHJvdG90eXBlLl9zdGFydE5leHQgPSBmdW5jdGlvbiAodCwgeCwgc2luaykge1xuICB0cnkge1xuICAgIHRoaXMuZGlzcG9zYWJsZSA9IHRoaXMuX2NvbnRpbnVlKHRoaXMuZiwgeCwgc2luayk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzaW5rLmVycm9yKHQsIGUpO1xuICB9XG59O1xuXG5Db250aW51ZVdpdGhTaW5rLnByb3RvdHlwZS5fY29udGludWUgPSBmdW5jdGlvbiAoZiwgeCwgc2luaykge1xuICByZXR1cm4gZih4KS5zb3VyY2UucnVuKHNpbmssIHRoaXMuc2NoZWR1bGVyKTtcbn07XG5cbkNvbnRpbnVlV2l0aFNpbmsucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIHJldHVybiB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlbGF5ID0gZGVsYXk7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrID0gcmVxdWlyZSgnLi4vc2NoZWR1bGVyL1Byb3BhZ2F0ZVRhc2snKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1Byb3BhZ2F0ZVRhc2spO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBAcGFyYW0ge051bWJlcn0gZGVsYXlUaW1lIG1pbGxpc2Vjb25kcyB0byBkZWxheSBlYWNoIGl0ZW1cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyB0aGUgc2FtZSBpdGVtcywgYnV0IGRlbGF5ZWQgYnkgbXNcbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGRlbGF5KGRlbGF5VGltZSwgc3RyZWFtKSB7XG4gIHJldHVybiBkZWxheVRpbWUgPD0gMCA/IHN0cmVhbSA6IG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBEZWxheShkZWxheVRpbWUsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gRGVsYXkoZHQsIHNvdXJjZSkge1xuICB0aGlzLmR0ID0gZHQ7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5EZWxheS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgZGVsYXlTaW5rID0gbmV3IERlbGF5U2luayh0aGlzLmR0LCBzaW5rLCBzY2hlZHVsZXIpO1xuICByZXR1cm4gZGlzcG9zZS5hbGwoW2RlbGF5U2luaywgdGhpcy5zb3VyY2UucnVuKGRlbGF5U2luaywgc2NoZWR1bGVyKV0pO1xufTtcblxuZnVuY3Rpb24gRGVsYXlTaW5rKGR0LCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5kdCA9IGR0O1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbn1cblxuRGVsYXlTaW5rLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMuc2NoZWR1bGVyLmNhbmNlbEFsbChmdW5jdGlvbiAodGFzaykge1xuICAgIHJldHVybiB0YXNrLnNpbmsgPT09IHNlbGYuc2luaztcbiAgfSk7XG59O1xuXG5EZWxheVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5zY2hlZHVsZXIuZGVsYXkodGhpcy5kdCwgX1Byb3BhZ2F0ZVRhc2syLmRlZmF1bHQuZXZlbnQoeCwgdGhpcy5zaW5rKSk7XG59O1xuXG5EZWxheVNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMuc2NoZWR1bGVyLmRlbGF5KHRoaXMuZHQsIF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0LmVuZCh4LCB0aGlzLnNpbmspKTtcbn07XG5cbkRlbGF5U2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5mbGF0TWFwRXJyb3IgPSB1bmRlZmluZWQ7XG5leHBvcnRzLnJlY292ZXJXaXRoID0gcmVjb3ZlcldpdGg7XG5leHBvcnRzLnRocm93RXJyb3IgPSB0aHJvd0Vycm9yO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1NhZmVTaW5rID0gcmVxdWlyZSgnLi4vc2luay9TYWZlU2luaycpO1xuXG52YXIgX1NhZmVTaW5rMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1NhZmVTaW5rKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX3RyeUV2ZW50ID0gcmVxdWlyZSgnLi4vc291cmNlL3RyeUV2ZW50Jyk7XG5cbnZhciB0cnlFdmVudCA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF90cnlFdmVudCk7XG5cbnZhciBfUHJvcGFnYXRlVGFzayA9IHJlcXVpcmUoJy4uL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogSWYgc3RyZWFtIGVuY291bnRlcnMgYW4gZXJyb3IsIHJlY292ZXIgYW5kIGNvbnRpbnVlIHdpdGggaXRlbXMgZnJvbSBzdHJlYW1cbiAqIHJldHVybmVkIGJ5IGYuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGVycm9yOiopOlN0cmVhbX0gZiBmdW5jdGlvbiB3aGljaCByZXR1cm5zIGEgbmV3IHN0cmVhbVxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aGljaCB3aWxsIHJlY292ZXIgZnJvbSBhbiBlcnJvciBieSBjYWxsaW5nIGZcbiAqL1xuZnVuY3Rpb24gcmVjb3ZlcldpdGgoZiwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgUmVjb3ZlcldpdGgoZiwgc3RyZWFtLnNvdXJjZSkpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxudmFyIGZsYXRNYXBFcnJvciA9IGV4cG9ydHMuZmxhdE1hcEVycm9yID0gcmVjb3ZlcldpdGg7XG5cbi8qKlxuICogQ3JlYXRlIGEgc3RyZWFtIGNvbnRhaW5pbmcgb25seSBhbiBlcnJvclxuICogQHBhcmFtIHsqfSBlIGVycm9yIHZhbHVlLCBwcmVmZXJhYmx5IGFuIEVycm9yIG9yIEVycm9yIHN1YnR5cGVcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBvbmx5IGFuIGVycm9yXG4gKi9cbmZ1bmN0aW9uIHRocm93RXJyb3IoZSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IEVycm9yU291cmNlKGUpKTtcbn1cblxuZnVuY3Rpb24gRXJyb3JTb3VyY2UoZSkge1xuICB0aGlzLnZhbHVlID0gZTtcbn1cblxuRXJyb3JTb3VyY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHNjaGVkdWxlci5hc2FwKG5ldyBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdChydW5FcnJvciwgdGhpcy52YWx1ZSwgc2luaykpO1xufTtcblxuZnVuY3Rpb24gcnVuRXJyb3IodCwgZSwgc2luaykge1xuICBzaW5rLmVycm9yKHQsIGUpO1xufVxuXG5mdW5jdGlvbiBSZWNvdmVyV2l0aChmLCBzb3VyY2UpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblJlY292ZXJXaXRoLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgUmVjb3ZlcldpdGhTaW5rKHRoaXMuZiwgdGhpcy5zb3VyY2UsIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBSZWNvdmVyV2l0aFNpbmsoZiwgc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zaW5rID0gbmV3IF9TYWZlU2luazIuZGVmYXVsdChzaW5rKTtcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IHNvdXJjZS5ydW4odGhpcywgc2NoZWR1bGVyKTtcbn1cblxuUmVjb3ZlcldpdGhTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRyeUV2ZW50LnRyeUV2ZW50KHQsIHgsIHRoaXMuc2luayk7XG59O1xuXG5SZWNvdmVyV2l0aFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRyeUV2ZW50LnRyeUVuZCh0LCB4LCB0aGlzLnNpbmspO1xufTtcblxuUmVjb3ZlcldpdGhTaW5rLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHZhciBuZXh0U2luayA9IHRoaXMuc2luay5kaXNhYmxlKCk7XG5cbiAgZGlzcG9zZS50cnlEaXNwb3NlKHQsIHRoaXMuZGlzcG9zYWJsZSwgdGhpcy5zaW5rKTtcbiAgdGhpcy5fc3RhcnROZXh0KHQsIGUsIG5leHRTaW5rKTtcbn07XG5cblJlY292ZXJXaXRoU2luay5wcm90b3R5cGUuX3N0YXJ0TmV4dCA9IGZ1bmN0aW9uICh0LCB4LCBzaW5rKSB7XG4gIHRyeSB7XG4gICAgdGhpcy5kaXNwb3NhYmxlID0gdGhpcy5fY29udGludWUodGhpcy5mLCB4LCBzaW5rKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNpbmsuZXJyb3IodCwgZSk7XG4gIH1cbn07XG5cblJlY292ZXJXaXRoU2luay5wcm90b3R5cGUuX2NvbnRpbnVlID0gZnVuY3Rpb24gKGYsIHgsIHNpbmspIHtcbiAgdmFyIHN0cmVhbSA9IGYoeCk7XG4gIHJldHVybiBzdHJlYW0uc291cmNlLnJ1bihzaW5rLCB0aGlzLnNjaGVkdWxlcik7XG59O1xuXG5SZWNvdmVyV2l0aFNpbmsucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZpbHRlciA9IGZpbHRlcjtcbmV4cG9ydHMuc2tpcFJlcGVhdHMgPSBza2lwUmVwZWF0cztcbmV4cG9ydHMuc2tpcFJlcGVhdHNXaXRoID0gc2tpcFJlcGVhdHNXaXRoO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX0ZpbHRlciA9IHJlcXVpcmUoJy4uL2Z1c2lvbi9GaWx0ZXInKTtcblxudmFyIF9GaWx0ZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfRmlsdGVyKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBSZXRhaW4gb25seSBpdGVtcyBtYXRjaGluZyBhIHByZWRpY2F0ZVxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOmJvb2xlYW59IHAgZmlsdGVyaW5nIHByZWRpY2F0ZSBjYWxsZWQgZm9yIGVhY2ggaXRlbVxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbSBzdHJlYW0gdG8gZmlsdGVyXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBvbmx5IGl0ZW1zIGZvciB3aGljaCBwcmVkaWNhdGUgcmV0dXJucyB0cnV0aHlcbiAqL1xuZnVuY3Rpb24gZmlsdGVyKHAsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQoX0ZpbHRlcjIuZGVmYXVsdC5jcmVhdGUocCwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG4vKipcbiAqIFNraXAgcmVwZWF0ZWQgZXZlbnRzLCB1c2luZyA9PT0gdG8gZGV0ZWN0IGR1cGxpY2F0ZXNcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIGZyb20gd2hpY2ggdG8gb21pdCByZXBlYXRlZCBldmVudHNcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSB3aXRob3V0IHJlcGVhdGVkIGV2ZW50c1xuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gc2tpcFJlcGVhdHMoc3RyZWFtKSB7XG4gIHJldHVybiBza2lwUmVwZWF0c1dpdGgoc2FtZSwgc3RyZWFtKTtcbn1cblxuLyoqXG4gKiBTa2lwIHJlcGVhdGVkIGV2ZW50cyB1c2luZyB0aGUgcHJvdmlkZWQgZXF1YWxzIGZ1bmN0aW9uIHRvIGRldGVjdCBkdXBsaWNhdGVzXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGE6KiwgYjoqKTpib29sZWFufSBlcXVhbHMgb3B0aW9uYWwgZnVuY3Rpb24gdG8gY29tcGFyZSBpdGVtc1xuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbSBzdHJlYW0gZnJvbSB3aGljaCB0byBvbWl0IHJlcGVhdGVkIGV2ZW50c1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIHdpdGhvdXQgcmVwZWF0ZWQgZXZlbnRzXG4gKi9cbmZ1bmN0aW9uIHNraXBSZXBlYXRzV2l0aChlcXVhbHMsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFNraXBSZXBlYXRzKGVxdWFscywgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBTa2lwUmVwZWF0cyhlcXVhbHMsIHNvdXJjZSkge1xuICB0aGlzLmVxdWFscyA9IGVxdWFscztcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblNraXBSZXBlYXRzLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IFNraXBSZXBlYXRzU2luayh0aGlzLmVxdWFscywgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBTa2lwUmVwZWF0c1NpbmsoZXF1YWxzLCBzaW5rKSB7XG4gIHRoaXMuZXF1YWxzID0gZXF1YWxzO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnZhbHVlID0gdm9pZCAwO1xuICB0aGlzLmluaXQgPSB0cnVlO1xufVxuXG5Ta2lwUmVwZWF0c1NpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5Ta2lwUmVwZWF0c1NpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5Ta2lwUmVwZWF0c1NpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHRoaXMuaW5pdCkge1xuICAgIHRoaXMuaW5pdCA9IGZhbHNlO1xuICAgIHRoaXMudmFsdWUgPSB4O1xuICAgIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbiAgfSBlbHNlIGlmICghdGhpcy5lcXVhbHModGhpcy52YWx1ZSwgeCkpIHtcbiAgICB0aGlzLnZhbHVlID0geDtcbiAgICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG4gIH1cbn07XG5cbmZ1bmN0aW9uIHNhbWUoYSwgYikge1xuICByZXR1cm4gYSA9PT0gYjtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZsYXRNYXAgPSBmbGF0TWFwO1xuZXhwb3J0cy5qb2luID0gam9pbjtcblxudmFyIF9tZXJnZUNvbmN1cnJlbnRseSA9IHJlcXVpcmUoJy4vbWVyZ2VDb25jdXJyZW50bHknKTtcblxuLyoqXG4gKiBNYXAgZWFjaCB2YWx1ZSBpbiB0aGUgc3RyZWFtIHRvIGEgbmV3IHN0cmVhbSwgYW5kIG1lcmdlIGl0IGludG8gdGhlXG4gKiByZXR1cm5lZCBvdXRlciBzdHJlYW0uIEV2ZW50IGFycml2YWwgdGltZXMgYXJlIHByZXNlcnZlZC5cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKTpTdHJlYW19IGYgY2hhaW5pbmcgZnVuY3Rpb24sIG11c3QgcmV0dXJuIGEgU3RyZWFtXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBmcm9tIGVhY2ggc3RyZWFtIHJldHVybmVkIGJ5IGZcbiAqL1xuZnVuY3Rpb24gZmxhdE1hcChmLCBzdHJlYW0pIHtcbiAgcmV0dXJuICgwLCBfbWVyZ2VDb25jdXJyZW50bHkubWVyZ2VNYXBDb25jdXJyZW50bHkpKGYsIEluZmluaXR5LCBzdHJlYW0pO1xufVxuXG4vKipcbiAqIE1vbmFkaWMgam9pbi4gRmxhdHRlbiBhIFN0cmVhbTxTdHJlYW08WD4+IHRvIFN0cmVhbTxYPiBieSBtZXJnaW5nIGlubmVyXG4gKiBzdHJlYW1zIHRvIHRoZSBvdXRlci4gRXZlbnQgYXJyaXZhbCB0aW1lcyBhcmUgcHJlc2VydmVkLlxuICogQHBhcmFtIHtTdHJlYW08U3RyZWFtPFg+Pn0gc3RyZWFtIHN0cmVhbSBvZiBzdHJlYW1zXG4gKiBAcmV0dXJucyB7U3RyZWFtPFg+fSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBvZiBhbGwgaW5uZXIgc3RyZWFtc1xuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gam9pbihzdHJlYW0pIHtcbiAgcmV0dXJuICgwLCBfbWVyZ2VDb25jdXJyZW50bHkubWVyZ2VDb25jdXJyZW50bHkpKEluZmluaXR5LCBzdHJlYW0pO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudGhyb3R0bGUgPSB0aHJvdHRsZTtcbmV4cG9ydHMuZGVib3VuY2UgPSBkZWJvdW5jZTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbnZhciBfTWFwID0gcmVxdWlyZSgnLi4vZnVzaW9uL01hcCcpO1xuXG52YXIgX01hcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9NYXApO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBMaW1pdCB0aGUgcmF0ZSBvZiBldmVudHMgYnkgc3VwcHJlc3NpbmcgZXZlbnRzIHRoYXQgb2NjdXIgdG9vIG9mdGVuXG4gKiBAcGFyYW0ge051bWJlcn0gcGVyaW9kIHRpbWUgdG8gc3VwcHJlc3MgZXZlbnRzXG4gKiBAcGFyYW0ge1N0cmVhbX0gc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfVxuICovXG5mdW5jdGlvbiB0aHJvdHRsZShwZXJpb2QsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQodGhyb3R0bGVTb3VyY2UocGVyaW9kLCBzdHJlYW0uc291cmNlKSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiB0aHJvdHRsZVNvdXJjZShwZXJpb2QsIHNvdXJjZSkge1xuICByZXR1cm4gc291cmNlIGluc3RhbmNlb2YgX01hcDIuZGVmYXVsdCA/IGNvbW11dGVNYXBUaHJvdHRsZShwZXJpb2QsIHNvdXJjZSkgOiBzb3VyY2UgaW5zdGFuY2VvZiBUaHJvdHRsZSA/IGZ1c2VUaHJvdHRsZShwZXJpb2QsIHNvdXJjZSkgOiBuZXcgVGhyb3R0bGUocGVyaW9kLCBzb3VyY2UpO1xufVxuXG5mdW5jdGlvbiBjb21tdXRlTWFwVGhyb3R0bGUocGVyaW9kLCBzb3VyY2UpIHtcbiAgcmV0dXJuIF9NYXAyLmRlZmF1bHQuY3JlYXRlKHNvdXJjZS5mLCB0aHJvdHRsZVNvdXJjZShwZXJpb2QsIHNvdXJjZS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gZnVzZVRocm90dGxlKHBlcmlvZCwgc291cmNlKSB7XG4gIHJldHVybiBuZXcgVGhyb3R0bGUoTWF0aC5tYXgocGVyaW9kLCBzb3VyY2UucGVyaW9kKSwgc291cmNlLnNvdXJjZSk7XG59XG5cbmZ1bmN0aW9uIFRocm90dGxlKHBlcmlvZCwgc291cmNlKSB7XG4gIHRoaXMucGVyaW9kID0gcGVyaW9kO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuVGhyb3R0bGUucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgVGhyb3R0bGVTaW5rKHRoaXMucGVyaW9kLCBzaW5rKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIFRocm90dGxlU2luayhwZXJpb2QsIHNpbmspIHtcbiAgdGhpcy50aW1lID0gMDtcbiAgdGhpcy5wZXJpb2QgPSBwZXJpb2Q7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cblRocm90dGxlU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAodCA+PSB0aGlzLnRpbWUpIHtcbiAgICB0aGlzLnRpbWUgPSB0ICsgdGhpcy5wZXJpb2Q7XG4gICAgdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xuICB9XG59O1xuXG5UaHJvdHRsZVNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5cblRocm90dGxlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbi8qKlxuICogV2FpdCBmb3IgYSBidXJzdCBvZiBldmVudHMgdG8gc3Vic2lkZSBhbmQgZW1pdCBvbmx5IHRoZSBsYXN0IGV2ZW50IGluIHRoZSBidXJzdFxuICogQHBhcmFtIHtOdW1iZXJ9IHBlcmlvZCBldmVudHMgb2NjdXJpbmcgbW9yZSBmcmVxdWVudGx5IHRoYW4gdGhpc1xuICogIHdpbGwgYmUgc3VwcHJlc3NlZFxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbSBzdHJlYW0gdG8gZGVib3VuY2VcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBkZWJvdW5jZWQgc3RyZWFtXG4gKi9cbmZ1bmN0aW9uIGRlYm91bmNlKHBlcmlvZCwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgRGVib3VuY2UocGVyaW9kLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIERlYm91bmNlKGR0LCBzb3VyY2UpIHtcbiAgdGhpcy5kdCA9IGR0O1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuRGVib3VuY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBEZWJvdW5jZVNpbmsodGhpcy5kdCwgdGhpcy5zb3VyY2UsIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBEZWJvdW5jZVNpbmsoZHQsIHNvdXJjZSwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZHQgPSBkdDtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMudmFsdWUgPSB2b2lkIDA7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuXG4gIHZhciBzb3VyY2VEaXNwb3NhYmxlID0gc291cmNlLnJ1bih0aGlzLCBzY2hlZHVsZXIpO1xuICB0aGlzLmRpc3Bvc2FibGUgPSBkaXNwb3NlLmFsbChbdGhpcywgc291cmNlRGlzcG9zYWJsZV0pO1xufVxuXG5EZWJvdW5jZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5fY2xlYXJUaW1lcigpO1xuICB0aGlzLnZhbHVlID0geDtcbiAgdGhpcy50aW1lciA9IHRoaXMuc2NoZWR1bGVyLmRlbGF5KHRoaXMuZHQsIF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0LmV2ZW50KHgsIHRoaXMuc2luaykpO1xufTtcblxuRGVib3VuY2VTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAodGhpcy5fY2xlYXJUaW1lcigpKSB7XG4gICAgdGhpcy5zaW5rLmV2ZW50KHQsIHRoaXMudmFsdWUpO1xuICAgIHRoaXMudmFsdWUgPSB2b2lkIDA7XG4gIH1cbiAgdGhpcy5zaW5rLmVuZCh0LCB4KTtcbn07XG5cbkRlYm91bmNlU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0aGlzLl9jbGVhclRpbWVyKCk7XG4gIHRoaXMuc2luay5lcnJvcih0LCB4KTtcbn07XG5cbkRlYm91bmNlU2luay5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgdGhpcy5fY2xlYXJUaW1lcigpO1xufTtcblxuRGVib3VuY2VTaW5rLnByb3RvdHlwZS5fY2xlYXJUaW1lciA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKHRoaXMudGltZXIgPT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgdGhpcy50aW1lci5kaXNwb3NlKCk7XG4gIHRoaXMudGltZXIgPSBudWxsO1xuICByZXR1cm4gdHJ1ZTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5sb29wID0gbG9vcDtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBHZW5lcmFsaXplZCBmZWVkYmFjayBsb29wLiBDYWxsIGEgc3RlcHBlciBmdW5jdGlvbiBmb3IgZWFjaCBldmVudC4gVGhlIHN0ZXBwZXJcbiAqIHdpbGwgYmUgY2FsbGVkIHdpdGggMiBwYXJhbXM6IHRoZSBjdXJyZW50IHNlZWQgYW5kIHRoZSBhbiBldmVudCB2YWx1ZS4gIEl0IG11c3RcbiAqIHJldHVybiBhIG5ldyB7IHNlZWQsIHZhbHVlIH0gcGFpci4gVGhlIGBzZWVkYCB3aWxsIGJlIGZlZCBiYWNrIGludG8gdGhlIG5leHRcbiAqIGludm9jYXRpb24gb2Ygc3RlcHBlciwgYW5kIHRoZSBgdmFsdWVgIHdpbGwgYmUgcHJvcGFnYXRlZCBhcyB0aGUgZXZlbnQgdmFsdWUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHNlZWQ6KiwgdmFsdWU6Kik6e3NlZWQ6KiwgdmFsdWU6Kn19IHN0ZXBwZXIgbG9vcCBzdGVwIGZ1bmN0aW9uXG4gKiBAcGFyYW0geyp9IHNlZWQgaW5pdGlhbCBzZWVkIHZhbHVlIHBhc3NlZCB0byBmaXJzdCBzdGVwcGVyIGNhbGxcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gZXZlbnQgc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHdob3NlIHZhbHVlcyBhcmUgdGhlIGB2YWx1ZWAgZmllbGQgb2YgdGhlIG9iamVjdHNcbiAqIHJldHVybmVkIGJ5IHRoZSBzdGVwcGVyXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBsb29wKHN0ZXBwZXIsIHNlZWQsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IExvb3Aoc3RlcHBlciwgc2VlZCwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBMb29wKHN0ZXBwZXIsIHNlZWQsIHNvdXJjZSkge1xuICB0aGlzLnN0ZXAgPSBzdGVwcGVyO1xuICB0aGlzLnNlZWQgPSBzZWVkO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuTG9vcC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gdGhpcy5zb3VyY2UucnVuKG5ldyBMb29wU2luayh0aGlzLnN0ZXAsIHRoaXMuc2VlZCwgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBMb29wU2luayhzdGVwcGVyLCBzZWVkLCBzaW5rKSB7XG4gIHRoaXMuc3RlcCA9IHN0ZXBwZXI7XG4gIHRoaXMuc2VlZCA9IHNlZWQ7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cbkxvb3BTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuTG9vcFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIHJlc3VsdCA9IHRoaXMuc3RlcCh0aGlzLnNlZWQsIHgpO1xuICB0aGlzLnNlZWQgPSByZXN1bHQuc2VlZDtcbiAgdGhpcy5zaW5rLmV2ZW50KHQsIHJlc3VsdC52YWx1ZSk7XG59O1xuXG5Mb29wU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQpIHtcbiAgdGhpcy5zaW5rLmVuZCh0LCB0aGlzLnNlZWQpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLm1lcmdlID0gbWVyZ2U7XG5leHBvcnRzLm1lcmdlQXJyYXkgPSBtZXJnZUFycmF5O1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX0luZGV4U2luayA9IHJlcXVpcmUoJy4uL3NpbmsvSW5kZXhTaW5rJyk7XG5cbnZhciBfSW5kZXhTaW5rMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0luZGV4U2luayk7XG5cbnZhciBfY29yZSA9IHJlcXVpcmUoJy4uL3NvdXJjZS9jb3JlJyk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG52YXIgY29weSA9IGJhc2UuY29weTtcbnZhciByZWR1Y2UgPSBiYXNlLnJlZHVjZTtcblxuLyoqXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBldmVudHMgZnJvbSBhbGwgc3RyZWFtcyBpbiB0aGUgYXJndW1lbnRcbiAqIGxpc3QgaW4gdGltZSBvcmRlci4gIElmIHR3byBldmVudHMgYXJlIHNpbXVsdGFuZW91cyB0aGV5IHdpbGwgYmUgbWVyZ2VkIGluXG4gKiBhcmJpdHJhcnkgb3JkZXIuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlKCkgLyogLi4uc3RyZWFtcyove1xuICByZXR1cm4gbWVyZ2VBcnJheShjb3B5KGFyZ3VtZW50cykpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXl9IHN0cmVhbXMgYXJyYXkgb2Ygc3RyZWFtIHRvIG1lcmdlXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBldmVudHMgZnJvbSBhbGwgaW5wdXQgb2JzZXJ2YWJsZXNcbiAqIGluIHRpbWUgb3JkZXIuICBJZiB0d28gZXZlbnRzIGFyZSBzaW11bHRhbmVvdXMgdGhleSB3aWxsIGJlIG1lcmdlZCBpblxuICogYXJiaXRyYXJ5IG9yZGVyLlxuICovXG5mdW5jdGlvbiBtZXJnZUFycmF5KHN0cmVhbXMpIHtcbiAgdmFyIGwgPSBzdHJlYW1zLmxlbmd0aDtcbiAgcmV0dXJuIGwgPT09IDAgPyAoMCwgX2NvcmUuZW1wdHkpKCkgOiBsID09PSAxID8gc3RyZWFtc1swXSA6IG5ldyBfU3RyZWFtMi5kZWZhdWx0KG1lcmdlU291cmNlcyhzdHJlYW1zKSk7XG59XG5cbi8qKlxuICogVGhpcyBpbXBsZW1lbnRzIGZ1c2lvbi9mbGF0dGVuaW5nIGZvciBtZXJnZS4gIEl0IHdpbGxcbiAqIGZ1c2UgYWRqYWNlbnQgbWVyZ2Ugb3BlcmF0aW9ucy4gIEZvciBleGFtcGxlOlxuICogLSBhLm1lcmdlKGIpLm1lcmdlKGMpIGVmZmVjdGl2ZWx5IGJlY29tZXMgbWVyZ2UoYSwgYiwgYylcbiAqIC0gbWVyZ2UoYSwgbWVyZ2UoYiwgYykpIGVmZmVjdGl2ZWx5IGJlY29tZXMgbWVyZ2UoYSwgYiwgYylcbiAqIEl0IGRvZXMgdGhpcyBieSBjb25jYXRlbmF0aW5nIHRoZSBzb3VyY2VzIGFycmF5cyBvZlxuICogYW55IG5lc3RlZCBNZXJnZSBzb3VyY2VzLCBpbiBlZmZlY3QgXCJmbGF0dGVuaW5nXCIgbmVzdGVkXG4gKiBtZXJnZSBvcGVyYXRpb25zIGludG8gYSBzaW5nbGUgbWVyZ2UuXG4gKi9cbmZ1bmN0aW9uIG1lcmdlU291cmNlcyhzdHJlYW1zKSB7XG4gIHJldHVybiBuZXcgTWVyZ2UocmVkdWNlKGFwcGVuZFNvdXJjZXMsIFtdLCBzdHJlYW1zKSk7XG59XG5cbmZ1bmN0aW9uIGFwcGVuZFNvdXJjZXMoc291cmNlcywgc3RyZWFtKSB7XG4gIHZhciBzb3VyY2UgPSBzdHJlYW0uc291cmNlO1xuICByZXR1cm4gc291cmNlIGluc3RhbmNlb2YgTWVyZ2UgPyBzb3VyY2VzLmNvbmNhdChzb3VyY2Uuc291cmNlcykgOiBzb3VyY2VzLmNvbmNhdChzb3VyY2UpO1xufVxuXG5mdW5jdGlvbiBNZXJnZShzb3VyY2VzKSB7XG4gIHRoaXMuc291cmNlcyA9IHNvdXJjZXM7XG59XG5cbk1lcmdlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIHZhciBsID0gdGhpcy5zb3VyY2VzLmxlbmd0aDtcbiAgdmFyIGRpc3Bvc2FibGVzID0gbmV3IEFycmF5KGwpO1xuICB2YXIgc2lua3MgPSBuZXcgQXJyYXkobCk7XG5cbiAgdmFyIG1lcmdlU2luayA9IG5ldyBNZXJnZVNpbmsoZGlzcG9zYWJsZXMsIHNpbmtzLCBzaW5rKTtcblxuICBmb3IgKHZhciBpbmRleFNpbmssIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgaW5kZXhTaW5rID0gc2lua3NbaV0gPSBuZXcgX0luZGV4U2luazIuZGVmYXVsdChpLCBtZXJnZVNpbmspO1xuICAgIGRpc3Bvc2FibGVzW2ldID0gdGhpcyQxLnNvdXJjZXNbaV0ucnVuKGluZGV4U2luaywgc2NoZWR1bGVyKTtcbiAgfVxuXG4gIHJldHVybiBkaXNwb3NlLmFsbChkaXNwb3NhYmxlcyk7XG59O1xuXG5mdW5jdGlvbiBNZXJnZVNpbmsoZGlzcG9zYWJsZXMsIHNpbmtzLCBzaW5rKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZGlzcG9zYWJsZXMgPSBkaXNwb3NhYmxlcztcbiAgdGhpcy5hY3RpdmVDb3VudCA9IHNpbmtzLmxlbmd0aDtcbn1cblxuTWVyZ2VTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuTWVyZ2VTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCBpbmRleFZhbHVlKSB7XG4gIHRoaXMuc2luay5ldmVudCh0LCBpbmRleFZhbHVlLnZhbHVlKTtcbn07XG5cbk1lcmdlU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIGluZGV4ZWRWYWx1ZSkge1xuICBkaXNwb3NlLnRyeURpc3Bvc2UodCwgdGhpcy5kaXNwb3NhYmxlc1tpbmRleGVkVmFsdWUuaW5kZXhdLCB0aGlzLnNpbmspO1xuICBpZiAoLS10aGlzLmFjdGl2ZUNvdW50ID09PSAwKSB7XG4gICAgdGhpcy5zaW5rLmVuZCh0LCBpbmRleGVkVmFsdWUudmFsdWUpO1xuICB9XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMubWVyZ2VDb25jdXJyZW50bHkgPSBtZXJnZUNvbmN1cnJlbnRseTtcbmV4cG9ydHMubWVyZ2VNYXBDb25jdXJyZW50bHkgPSBtZXJnZU1hcENvbmN1cnJlbnRseTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX0xpbmtlZExpc3QgPSByZXF1aXJlKCcuLi9MaW5rZWRMaXN0Jyk7XG5cbnZhciBfTGlua2VkTGlzdDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9MaW5rZWRMaXN0KTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIG1lcmdlQ29uY3VycmVudGx5KGNvbmN1cnJlbmN5LCBzdHJlYW0pIHtcbiAgcmV0dXJuIG1lcmdlTWFwQ29uY3VycmVudGx5KF9wcmVsdWRlLmlkLCBjb25jdXJyZW5jeSwgc3RyZWFtKTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VNYXBDb25jdXJyZW50bHkoZiwgY29uY3VycmVuY3ksIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IE1lcmdlQ29uY3VycmVudGx5KGYsIGNvbmN1cnJlbmN5LCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIE1lcmdlQ29uY3VycmVudGx5KGYsIGNvbmN1cnJlbmN5LCBzb3VyY2UpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5jb25jdXJyZW5jeSA9IGNvbmN1cnJlbmN5O1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuTWVyZ2VDb25jdXJyZW50bHkucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBPdXRlcih0aGlzLmYsIHRoaXMuY29uY3VycmVuY3ksIHRoaXMuc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gT3V0ZXIoZiwgY29uY3VycmVuY3ksIHNvdXJjZSwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuY29uY3VycmVuY3kgPSBjb25jdXJyZW5jeTtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMucGVuZGluZyA9IFtdO1xuICB0aGlzLmN1cnJlbnQgPSBuZXcgX0xpbmtlZExpc3QyLmRlZmF1bHQoKTtcbiAgdGhpcy5kaXNwb3NhYmxlID0gZGlzcG9zZS5vbmNlKHNvdXJjZS5ydW4odGhpcywgc2NoZWR1bGVyKSk7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbn1cblxuT3V0ZXIucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5fYWRkSW5uZXIodCwgeCk7XG59O1xuXG5PdXRlci5wcm90b3R5cGUuX2FkZElubmVyID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHRoaXMuY3VycmVudC5sZW5ndGggPCB0aGlzLmNvbmN1cnJlbmN5KSB7XG4gICAgdGhpcy5fc3RhcnRJbm5lcih0LCB4KTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLnBlbmRpbmcucHVzaCh4KTtcbiAgfVxufTtcblxuT3V0ZXIucHJvdG90eXBlLl9zdGFydElubmVyID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdHJ5IHtcbiAgICB0aGlzLl9pbml0SW5uZXIodCwgeCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICB0aGlzLmVycm9yKHQsIGUpO1xuICB9XG59O1xuXG5PdXRlci5wcm90b3R5cGUuX2luaXRJbm5lciA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHZhciBpbm5lclNpbmsgPSBuZXcgSW5uZXIodCwgdGhpcywgdGhpcy5zaW5rKTtcbiAgaW5uZXJTaW5rLmRpc3Bvc2FibGUgPSBtYXBBbmRSdW4odGhpcy5mLCB4LCBpbm5lclNpbmssIHRoaXMuc2NoZWR1bGVyKTtcbiAgdGhpcy5jdXJyZW50LmFkZChpbm5lclNpbmspO1xufTtcblxuZnVuY3Rpb24gbWFwQW5kUnVuKGYsIHgsIHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gZih4KS5zb3VyY2UucnVuKHNpbmssIHNjaGVkdWxlcik7XG59XG5cbk91dGVyLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICBkaXNwb3NlLnRyeURpc3Bvc2UodCwgdGhpcy5kaXNwb3NhYmxlLCB0aGlzLnNpbmspO1xuICB0aGlzLl9jaGVja0VuZCh0LCB4KTtcbn07XG5cbk91dGVyLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIHRoaXMuc2luay5lcnJvcih0LCBlKTtcbn07XG5cbk91dGVyLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICB0aGlzLnBlbmRpbmcubGVuZ3RoID0gMDtcbiAgcmV0dXJuIFByb21pc2UuYWxsKFt0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpLCB0aGlzLmN1cnJlbnQuZGlzcG9zZSgpXSk7XG59O1xuXG5PdXRlci5wcm90b3R5cGUuX2VuZElubmVyID0gZnVuY3Rpb24gKHQsIHgsIGlubmVyKSB7XG4gIHRoaXMuY3VycmVudC5yZW1vdmUoaW5uZXIpO1xuICBkaXNwb3NlLnRyeURpc3Bvc2UodCwgaW5uZXIsIHRoaXMpO1xuXG4gIGlmICh0aGlzLnBlbmRpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgdGhpcy5fY2hlY2tFbmQodCwgeCk7XG4gIH0gZWxzZSB7XG4gICAgdGhpcy5fc3RhcnRJbm5lcih0LCB0aGlzLnBlbmRpbmcuc2hpZnQoKSk7XG4gIH1cbn07XG5cbk91dGVyLnByb3RvdHlwZS5fY2hlY2tFbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlICYmIHRoaXMuY3VycmVudC5pc0VtcHR5KCkpIHtcbiAgICB0aGlzLnNpbmsuZW5kKHQsIHgpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBJbm5lcih0aW1lLCBvdXRlciwgc2luaykge1xuICB0aGlzLnByZXYgPSB0aGlzLm5leHQgPSBudWxsO1xuICB0aGlzLnRpbWUgPSB0aW1lO1xuICB0aGlzLm91dGVyID0gb3V0ZXI7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IHZvaWQgMDtcbn1cblxuSW5uZXIucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5zaW5rLmV2ZW50KE1hdGgubWF4KHQsIHRoaXMudGltZSksIHgpO1xufTtcblxuSW5uZXIucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMub3V0ZXIuX2VuZElubmVyKE1hdGgubWF4KHQsIHRoaXMudGltZSksIHgsIHRoaXMpO1xufTtcblxuSW5uZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgdGhpcy5vdXRlci5lcnJvcihNYXRoLm1heCh0LCB0aGlzLnRpbWUpLCBlKTtcbn07XG5cbklubmVyLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5vYnNlcnZlID0gb2JzZXJ2ZTtcbmV4cG9ydHMuZHJhaW4gPSBkcmFpbjtcblxudmFyIF9ydW5Tb3VyY2UgPSByZXF1aXJlKCcuLi9ydW5Tb3VyY2UnKTtcblxudmFyIF90cmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybScpO1xuXG4vKipcbiAqIE9ic2VydmUgYWxsIHRoZSBldmVudCB2YWx1ZXMgaW4gdGhlIHN0cmVhbSBpbiB0aW1lIG9yZGVyLiBUaGVcbiAqIHByb3ZpZGVkIGZ1bmN0aW9uIGBmYCB3aWxsIGJlIGNhbGxlZCBmb3IgZWFjaCBldmVudCB2YWx1ZVxuICogQHBhcmFtIHtmdW5jdGlvbih4OlQpOip9IGYgZnVuY3Rpb24gdG8gY2FsbCB3aXRoIGVhY2ggZXZlbnQgdmFsdWVcbiAqIEBwYXJhbSB7U3RyZWFtPFQ+fSBzdHJlYW0gc3RyZWFtIHRvIG9ic2VydmVcbiAqIEByZXR1cm4ge1Byb21pc2V9IHByb21pc2UgdGhhdCBmdWxmaWxscyBhZnRlciB0aGUgc3RyZWFtIGVuZHMgd2l0aG91dFxuICogIGFuIGVycm9yLCBvciByZWplY3RzIGlmIHRoZSBzdHJlYW0gZW5kcyB3aXRoIGFuIGVycm9yLlxuICovXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gb2JzZXJ2ZShmLCBzdHJlYW0pIHtcbiAgcmV0dXJuIGRyYWluKCgwLCBfdHJhbnNmb3JtLnRhcCkoZiwgc3RyZWFtKSk7XG59XG5cbi8qKlxuICogXCJSdW5cIiBhIHN0cmVhbSBieSBjcmVhdGluZyBkZW1hbmQgYW5kIGNvbnN1bWluZyBhbGwgZXZlbnRzXG4gKiBAcGFyYW0ge1N0cmVhbTxUPn0gc3RyZWFtIHN0cmVhbSB0byBkcmFpblxuICogQHJldHVybiB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIGFmdGVyIHRoZSBzdHJlYW0gZW5kcyB3aXRob3V0XG4gKiAgYW4gZXJyb3IsIG9yIHJlamVjdHMgaWYgdGhlIHN0cmVhbSBlbmRzIHdpdGggYW4gZXJyb3IuXG4gKi9cbmZ1bmN0aW9uIGRyYWluKHN0cmVhbSkge1xuICByZXR1cm4gKDAsIF9ydW5Tb3VyY2Uud2l0aERlZmF1bHRTY2hlZHVsZXIpKHN0cmVhbS5zb3VyY2UpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZnJvbVByb21pc2UgPSBmcm9tUHJvbWlzZTtcbmV4cG9ydHMuYXdhaXRQcm9taXNlcyA9IGF3YWl0UHJvbWlzZXM7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfZmF0YWxFcnJvciA9IHJlcXVpcmUoJy4uL2ZhdGFsRXJyb3InKTtcblxudmFyIF9mYXRhbEVycm9yMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2ZhdGFsRXJyb3IpO1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKCcuLi9zb3VyY2UvY29yZScpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmVhbSBjb250YWluaW5nIG9ubHkgdGhlIHByb21pc2UncyBmdWxmaWxsbWVudFxuICogdmFsdWUgYXQgdGhlIHRpbWUgaXQgZnVsZmlsbHMuXG4gKiBAcGFyYW0ge1Byb21pc2U8VD59IHAgcHJvbWlzZVxuICogQHJldHVybiB7U3RyZWFtPFQ+fSBzdHJlYW0gY29udGFpbmluZyBwcm9taXNlJ3MgZnVsZmlsbG1lbnQgdmFsdWUuXG4gKiAgSWYgdGhlIHByb21pc2UgcmVqZWN0cywgdGhlIHN0cmVhbSB3aWxsIGVycm9yXG4gKi9cbmZ1bmN0aW9uIGZyb21Qcm9taXNlKHApIHtcbiAgcmV0dXJuIGF3YWl0UHJvbWlzZXMoKDAsIF9jb3JlLm9mKShwKSk7XG59XG5cbi8qKlxuICogVHVybiBhIFN0cmVhbTxQcm9taXNlPFQ+PiBpbnRvIFN0cmVhbTxUPiBieSBhd2FpdGluZyBlYWNoIHByb21pc2UuXG4gKiBFdmVudCBvcmRlciBpcyBwcmVzZXJ2ZWQuXG4gKiBAcGFyYW0ge1N0cmVhbTxQcm9taXNlPFQ+Pn0gc3RyZWFtXG4gKiBAcmV0dXJuIHtTdHJlYW08VD59IHN0cmVhbSBvZiBmdWxmaWxsbWVudCB2YWx1ZXMuICBUaGUgc3RyZWFtIHdpbGxcbiAqIGVycm9yIGlmIGFueSBwcm9taXNlIHJlamVjdHMuXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBhd2FpdFByb21pc2VzKHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IEF3YWl0KHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gQXdhaXQoc291cmNlKSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5Bd2FpdC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gdGhpcy5zb3VyY2UucnVuKG5ldyBBd2FpdFNpbmsoc2luaywgc2NoZWR1bGVyKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIEF3YWl0U2luayhzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMucXVldWUgPSBQcm9taXNlLnJlc29sdmUoKTtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gIC8vIFByZS1jcmVhdGUgY2xvc3VyZXMsIHRvIGF2b2lkIGNyZWF0aW5nIHRoZW0gcGVyIGV2ZW50XG4gIHRoaXMuX2V2ZW50Qm91bmQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHNlbGYuc2luay5ldmVudChzZWxmLnNjaGVkdWxlci5ub3coKSwgeCk7XG4gIH07XG5cbiAgdGhpcy5fZW5kQm91bmQgPSBmdW5jdGlvbiAoeCkge1xuICAgIHNlbGYuc2luay5lbmQoc2VsZi5zY2hlZHVsZXIubm93KCksIHgpO1xuICB9O1xuXG4gIHRoaXMuX2Vycm9yQm91bmQgPSBmdW5jdGlvbiAoZSkge1xuICAgIHNlbGYuc2luay5lcnJvcihzZWxmLnNjaGVkdWxlci5ub3coKSwgZSk7XG4gIH07XG59XG5cbkF3YWl0U2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgcHJvbWlzZSkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzZWxmLl9ldmVudChwcm9taXNlKTtcbiAgfSkuY2F0Y2godGhpcy5fZXJyb3JCb3VuZCk7XG59O1xuXG5Bd2FpdFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5xdWV1ZSA9IHRoaXMucXVldWUudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHNlbGYuX2VuZCh4KTtcbiAgfSkuY2F0Y2godGhpcy5fZXJyb3JCb3VuZCk7XG59O1xuXG5Bd2FpdFNpbmsucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgdmFyIHNlbGYgPSB0aGlzO1xuICAvLyBEb24ndCByZXNvbHZlIGVycm9yIHZhbHVlcywgcHJvcGFnYXRlIGRpcmVjdGx5XG4gIHRoaXMucXVldWUgPSB0aGlzLnF1ZXVlLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBzZWxmLl9lcnJvckJvdW5kKGUpO1xuICB9KS5jYXRjaChfZmF0YWxFcnJvcjIuZGVmYXVsdCk7XG59O1xuXG5Bd2FpdFNpbmsucHJvdG90eXBlLl9ldmVudCA9IGZ1bmN0aW9uIChwcm9taXNlKSB7XG4gIHJldHVybiBwcm9taXNlLnRoZW4odGhpcy5fZXZlbnRCb3VuZCk7XG59O1xuXG5Bd2FpdFNpbmsucHJvdG90eXBlLl9lbmQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHgpLnRoZW4odGhpcy5fZW5kQm91bmQpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnNhbXBsZSA9IHNhbXBsZTtcbmV4cG9ydHMuc2FtcGxlV2l0aCA9IHNhbXBsZVdpdGg7XG5leHBvcnRzLnNhbXBsZUFycmF5ID0gc2FtcGxlQXJyYXk7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxudmFyIF9pbnZva2UgPSByZXF1aXJlKCcuLi9pbnZva2UnKTtcblxudmFyIF9pbnZva2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW52b2tlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogV2hlbiBhbiBldmVudCBhcnJpdmVzIG9uIHNhbXBsZXIsIGVtaXQgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGYgd2l0aCB0aGUgbGF0ZXN0XG4gKiB2YWx1ZXMgb2YgYWxsIHN0cmVhbXMgYmVpbmcgc2FtcGxlZFxuICogQHBhcmFtIHtmdW5jdGlvbiguLi52YWx1ZXMpOip9IGYgZnVuY3Rpb24gdG8gYXBwbHkgdG8gZWFjaCBzZXQgb2Ygc2FtcGxlZCB2YWx1ZXNcbiAqIEBwYXJhbSB7U3RyZWFtfSBzYW1wbGVyIHN0cmVhbXMgd2lsbCBiZSBzYW1wbGVkIHdoZW5ldmVyIGFuIGV2ZW50IGFycml2ZXNcbiAqICBvbiBzYW1wbGVyXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gb2Ygc2FtcGxlZCBhbmQgdHJhbnNmb3JtZWQgdmFsdWVzXG4gKi9cbmZ1bmN0aW9uIHNhbXBsZShmLCBzYW1wbGVyIC8qLCAuLi5zdHJlYW1zICovKSB7XG4gIHJldHVybiBzYW1wbGVBcnJheShmLCBzYW1wbGVyLCBiYXNlLmRyb3AoMiwgYXJndW1lbnRzKSk7XG59XG5cbi8qKlxuICogV2hlbiBhbiBldmVudCBhcnJpdmVzIG9uIHNhbXBsZXIsIGVtaXQgdGhlIGxhdGVzdCBldmVudCB2YWx1ZSBmcm9tIHN0cmVhbS5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzYW1wbGVyIHN0cmVhbSBvZiBldmVudHMgYXQgd2hvc2UgYXJyaXZhbCB0aW1lXG4gKiAgc3RyZWFtJ3MgbGF0ZXN0IHZhbHVlIHdpbGwgYmUgcHJvcGFnYXRlZFxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbSBzdHJlYW0gb2YgdmFsdWVzXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzYW1wbGVkIHN0cmVhbSBvZiB2YWx1ZXNcbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIHNhbXBsZVdpdGgoc2FtcGxlciwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgU2FtcGxlcihiYXNlLmlkLCBzYW1wbGVyLnNvdXJjZSwgW3N0cmVhbS5zb3VyY2VdKSk7XG59XG5cbmZ1bmN0aW9uIHNhbXBsZUFycmF5KGYsIHNhbXBsZXIsIHN0cmVhbXMpIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBTYW1wbGVyKGYsIHNhbXBsZXIuc291cmNlLCBiYXNlLm1hcChnZXRTb3VyY2UsIHN0cmVhbXMpKSk7XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZShzdHJlYW0pIHtcbiAgcmV0dXJuIHN0cmVhbS5zb3VyY2U7XG59XG5cbmZ1bmN0aW9uIFNhbXBsZXIoZiwgc2FtcGxlciwgc291cmNlcykge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNhbXBsZXIgPSBzYW1wbGVyO1xuICB0aGlzLnNvdXJjZXMgPSBzb3VyY2VzO1xufVxuXG5TYW1wbGVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciB0aGlzJDEgPSB0aGlzO1xuXG4gIHZhciBsID0gdGhpcy5zb3VyY2VzLmxlbmd0aDtcbiAgdmFyIGRpc3Bvc2FibGVzID0gbmV3IEFycmF5KGwgKyAxKTtcbiAgdmFyIHNpbmtzID0gbmV3IEFycmF5KGwpO1xuXG4gIHZhciBzYW1wbGVTaW5rID0gbmV3IFNhbXBsZVNpbmsodGhpcy5mLCBzaW5rcywgc2luayk7XG5cbiAgZm9yICh2YXIgaG9sZCwgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICBob2xkID0gc2lua3NbaV0gPSBuZXcgSG9sZChzYW1wbGVTaW5rKTtcbiAgICBkaXNwb3NhYmxlc1tpXSA9IHRoaXMkMS5zb3VyY2VzW2ldLnJ1bihob2xkLCBzY2hlZHVsZXIpO1xuICB9XG5cbiAgZGlzcG9zYWJsZXNbaV0gPSB0aGlzLnNhbXBsZXIucnVuKHNhbXBsZVNpbmssIHNjaGVkdWxlcik7XG5cbiAgcmV0dXJuIGRpc3Bvc2UuYWxsKGRpc3Bvc2FibGVzKTtcbn07XG5cbmZ1bmN0aW9uIEhvbGQoc2luaykge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmhhc1ZhbHVlID0gZmFsc2U7XG59XG5cbkhvbGQucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy52YWx1ZSA9IHg7XG4gIHRoaXMuaGFzVmFsdWUgPSB0cnVlO1xuICB0aGlzLnNpbmsuX25vdGlmeSh0aGlzKTtcbn07XG5cbkhvbGQucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICgpIHt9O1xuSG9sZC5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbmZ1bmN0aW9uIFNhbXBsZVNpbmsoZiwgc2lua3MsIHNpbmspIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zaW5rcyA9IHNpbmtzO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufVxuXG5TYW1wbGVTaW5rLnByb3RvdHlwZS5fbm90aWZ5ID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgdGhpcy5hY3RpdmUgPSB0aGlzLnNpbmtzLmV2ZXJ5KGhhc1ZhbHVlKTtcbiAgfVxufTtcblxuU2FtcGxlU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCkge1xuICBpZiAodGhpcy5hY3RpdmUpIHtcbiAgICB0aGlzLnNpbmsuZXZlbnQodCwgKDAsIF9pbnZva2UyLmRlZmF1bHQpKHRoaXMuZiwgYmFzZS5tYXAoZ2V0VmFsdWUsIHRoaXMuc2lua3MpKSk7XG4gIH1cbn07XG5cblNhbXBsZVNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5TYW1wbGVTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuZnVuY3Rpb24gaGFzVmFsdWUoaG9sZCkge1xuICByZXR1cm4gaG9sZC5oYXNWYWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0VmFsdWUoaG9sZCkge1xuICByZXR1cm4gaG9sZC52YWx1ZTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnRha2UgPSB0YWtlO1xuZXhwb3J0cy5za2lwID0gc2tpcDtcbmV4cG9ydHMuc2xpY2UgPSBzbGljZTtcbmV4cG9ydHMudGFrZVdoaWxlID0gdGFrZVdoaWxlO1xuZXhwb3J0cy5za2lwV2hpbGUgPSBza2lwV2hpbGU7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbnZhciBfY29yZSA9IHJlcXVpcmUoJy4uL3NvdXJjZS9jb3JlJyk7XG5cbnZhciBjb3JlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2NvcmUpO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfTWFwID0gcmVxdWlyZSgnLi4vZnVzaW9uL01hcCcpO1xuXG52YXIgX01hcDIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9NYXApO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBAcGFyYW0ge251bWJlcn0gblxuICogQHBhcmFtIHtTdHJlYW19IHN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIG9ubHkgdXAgdG8gdGhlIGZpcnN0IG4gaXRlbXMgZnJvbSBzdHJlYW1cbiAqL1xuZnVuY3Rpb24gdGFrZShuLCBzdHJlYW0pIHtcbiAgcmV0dXJuIHNsaWNlKDAsIG4sIHN0cmVhbSk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtudW1iZXJ9IG5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gd2l0aCB0aGUgZmlyc3QgbiBpdGVtcyByZW1vdmVkXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBza2lwKG4sIHN0cmVhbSkge1xuICByZXR1cm4gc2xpY2UobiwgSW5maW5pdHksIHN0cmVhbSk7XG59XG5cbi8qKlxuICogU2xpY2UgYSBzdHJlYW0gYnkgaW5kZXguIE5lZ2F0aXZlIHN0YXJ0L2VuZCBpbmRleGVzIGFyZSBub3Qgc3VwcG9ydGVkXG4gKiBAcGFyYW0ge251bWJlcn0gc3RhcnRcbiAqIEBwYXJhbSB7bnVtYmVyfSBlbmRcbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIGl0ZW1zIHdoZXJlIHN0YXJ0IDw9IGluZGV4IDwgZW5kXG4gKi9cbmZ1bmN0aW9uIHNsaWNlKHN0YXJ0LCBlbmQsIHN0cmVhbSkge1xuICByZXR1cm4gZW5kIDw9IHN0YXJ0ID8gY29yZS5lbXB0eSgpIDogbmV3IF9TdHJlYW0yLmRlZmF1bHQoc2xpY2VTb3VyY2Uoc3RhcnQsIGVuZCwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBzbGljZVNvdXJjZShzdGFydCwgZW5kLCBzb3VyY2UpIHtcbiAgcmV0dXJuIHNvdXJjZSBpbnN0YW5jZW9mIF9NYXAyLmRlZmF1bHQgPyBjb21tdXRlTWFwU2xpY2Uoc3RhcnQsIGVuZCwgc291cmNlKSA6IHNvdXJjZSBpbnN0YW5jZW9mIFNsaWNlID8gZnVzZVNsaWNlKHN0YXJ0LCBlbmQsIHNvdXJjZSkgOiBuZXcgU2xpY2Uoc3RhcnQsIGVuZCwgc291cmNlKTtcbn1cblxuZnVuY3Rpb24gY29tbXV0ZU1hcFNsaWNlKHN0YXJ0LCBlbmQsIHNvdXJjZSkge1xuICByZXR1cm4gX01hcDIuZGVmYXVsdC5jcmVhdGUoc291cmNlLmYsIHNsaWNlU291cmNlKHN0YXJ0LCBlbmQsIHNvdXJjZS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gZnVzZVNsaWNlKHN0YXJ0LCBlbmQsIHNvdXJjZSkge1xuICBzdGFydCArPSBzb3VyY2UubWluO1xuICBlbmQgPSBNYXRoLm1pbihlbmQgKyBzb3VyY2UubWluLCBzb3VyY2UubWF4KTtcbiAgcmV0dXJuIG5ldyBTbGljZShzdGFydCwgZW5kLCBzb3VyY2Uuc291cmNlKTtcbn1cblxuZnVuY3Rpb24gU2xpY2UobWluLCBtYXgsIHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbiAgdGhpcy5taW4gPSBtaW47XG4gIHRoaXMubWF4ID0gbWF4O1xufVxuXG5TbGljZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gbmV3IFNsaWNlU2luayh0aGlzLm1pbiwgdGhpcy5tYXggLSB0aGlzLm1pbiwgdGhpcy5zb3VyY2UsIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBTbGljZVNpbmsoc2tpcCwgdGFrZSwgc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5za2lwID0gc2tpcDtcbiAgdGhpcy50YWtlID0gdGFrZTtcbiAgdGhpcy5kaXNwb3NhYmxlID0gZGlzcG9zZS5vbmNlKHNvdXJjZS5ydW4odGhpcywgc2NoZWR1bGVyKSk7XG59XG5cblNsaWNlU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcblNsaWNlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cblNsaWNlU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbXBsZXhpdHlcbiAgaWYgKHRoaXMuc2tpcCA+IDApIHtcbiAgICB0aGlzLnNraXAgLT0gMTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy50YWtlID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhpcy50YWtlIC09IDE7XG4gIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbiAgaWYgKHRoaXMudGFrZSA9PT0gMCkge1xuICAgIHRoaXMuZGlzcG9zZSgpO1xuICAgIHRoaXMuc2luay5lbmQodCwgeCk7XG4gIH1cbn07XG5cblNsaWNlU2luay5wcm90b3R5cGUuZGlzcG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG59O1xuXG5mdW5jdGlvbiB0YWtlV2hpbGUocCwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgVGFrZVdoaWxlKHAsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gVGFrZVdoaWxlKHAsIHNvdXJjZSkge1xuICB0aGlzLnAgPSBwO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuVGFrZVdoaWxlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgVGFrZVdoaWxlU2luayh0aGlzLnAsIHRoaXMuc291cmNlLCBzaW5rLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gVGFrZVdoaWxlU2luayhwLCBzb3VyY2UsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLnAgPSBwO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IGRpc3Bvc2Uub25jZShzb3VyY2UucnVuKHRoaXMsIHNjaGVkdWxlcikpO1xufVxuXG5UYWtlV2hpbGVTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuVGFrZVdoaWxlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cblRha2VXaGlsZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBwID0gdGhpcy5wO1xuICB0aGlzLmFjdGl2ZSA9IHAoeCk7XG4gIGlmICh0aGlzLmFjdGl2ZSkge1xuICAgIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLmRpc3Bvc2UoKTtcbiAgICB0aGlzLnNpbmsuZW5kKHQsIHgpO1xuICB9XG59O1xuXG5UYWtlV2hpbGVTaW5rLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbn07XG5cbmZ1bmN0aW9uIHNraXBXaGlsZShwLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBTa2lwV2hpbGUocCwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBTa2lwV2hpbGUocCwgc291cmNlKSB7XG4gIHRoaXMucCA9IHA7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5Ta2lwV2hpbGUucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgU2tpcFdoaWxlU2luayh0aGlzLnAsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gU2tpcFdoaWxlU2luayhwLCBzaW5rKSB7XG4gIHRoaXMucCA9IHA7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2tpcHBpbmcgPSB0cnVlO1xufVxuXG5Ta2lwV2hpbGVTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuU2tpcFdoaWxlU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cblNraXBXaGlsZVNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKHRoaXMuc2tpcHBpbmcpIHtcbiAgICB2YXIgcCA9IHRoaXMucDtcbiAgICB0aGlzLnNraXBwaW5nID0gcCh4KTtcbiAgICBpZiAodGhpcy5za2lwcGluZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuc2luay5ldmVudCh0LCB4KTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5zd2l0Y2ggPSB1bmRlZmluZWQ7XG5leHBvcnRzLnN3aXRjaExhdGVzdCA9IHN3aXRjaExhdGVzdDtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBHaXZlbiBhIHN0cmVhbSBvZiBzdHJlYW1zLCByZXR1cm4gYSBuZXcgc3RyZWFtIHRoYXQgYWRvcHRzIHRoZSBiZWhhdmlvclxuICogb2YgdGhlIG1vc3QgcmVjZW50IGlubmVyIHN0cmVhbS5cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gb2Ygc3RyZWFtcyBvbiB3aGljaCB0byBzd2l0Y2hcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN3aXRjaGluZyBzdHJlYW1cbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIHN3aXRjaExhdGVzdChzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBTd2l0Y2goc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5leHBvcnRzLnN3aXRjaCA9IHN3aXRjaExhdGVzdDtcblxuXG5mdW5jdGlvbiBTd2l0Y2goc291cmNlKSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufVxuXG5Td2l0Y2gucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIHN3aXRjaFNpbmsgPSBuZXcgU3dpdGNoU2luayhzaW5rLCBzY2hlZHVsZXIpO1xuICByZXR1cm4gZGlzcG9zZS5hbGwoW3N3aXRjaFNpbmssIHRoaXMuc291cmNlLnJ1bihzd2l0Y2hTaW5rLCBzY2hlZHVsZXIpXSk7XG59O1xuXG5mdW5jdGlvbiBTd2l0Y2hTaW5rKHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbiAgdGhpcy5jdXJyZW50ID0gbnVsbDtcbiAgdGhpcy5lbmRlZCA9IGZhbHNlO1xufVxuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCBzdHJlYW0pIHtcbiAgdGhpcy5fZGlzcG9zZUN1cnJlbnQodCk7IC8vIFRPRE86IGNhcHR1cmUgdGhlIHJlc3VsdCBvZiB0aGlzIGRpc3Bvc2VcbiAgdGhpcy5jdXJyZW50ID0gbmV3IFNlZ21lbnQodCwgSW5maW5pdHksIHRoaXMsIHRoaXMuc2luayk7XG4gIHRoaXMuY3VycmVudC5kaXNwb3NhYmxlID0gc3RyZWFtLnNvdXJjZS5ydW4odGhpcy5jdXJyZW50LCB0aGlzLnNjaGVkdWxlcik7XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB0aGlzLmVuZGVkID0gdHJ1ZTtcbiAgdGhpcy5fY2hlY2tFbmQodCwgeCk7XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHRoaXMuZW5kZWQgPSB0cnVlO1xuICB0aGlzLnNpbmsuZXJyb3IodCwgZSk7XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5fZGlzcG9zZUN1cnJlbnQodGhpcy5zY2hlZHVsZXIubm93KCkpO1xufTtcblxuU3dpdGNoU2luay5wcm90b3R5cGUuX2Rpc3Bvc2VDdXJyZW50ID0gZnVuY3Rpb24gKHQpIHtcbiAgaWYgKHRoaXMuY3VycmVudCAhPT0gbnVsbCkge1xuICAgIHJldHVybiB0aGlzLmN1cnJlbnQuX2Rpc3Bvc2UodCk7XG4gIH1cbn07XG5cblN3aXRjaFNpbmsucHJvdG90eXBlLl9kaXNwb3NlSW5uZXIgPSBmdW5jdGlvbiAodCwgaW5uZXIpIHtcbiAgaW5uZXIuX2Rpc3Bvc2UodCk7IC8vIFRPRE86IGNhcHR1cmUgdGhlIHJlc3VsdCBvZiB0aGlzIGRpc3Bvc2VcbiAgaWYgKGlubmVyID09PSB0aGlzLmN1cnJlbnQpIHtcbiAgICB0aGlzLmN1cnJlbnQgPSBudWxsO1xuICB9XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5fY2hlY2tFbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAodGhpcy5lbmRlZCAmJiB0aGlzLmN1cnJlbnQgPT09IG51bGwpIHtcbiAgICB0aGlzLnNpbmsuZW5kKHQsIHgpO1xuICB9XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5fZW5kSW5uZXIgPSBmdW5jdGlvbiAodCwgeCwgaW5uZXIpIHtcbiAgdGhpcy5fZGlzcG9zZUlubmVyKHQsIGlubmVyKTtcbiAgdGhpcy5fY2hlY2tFbmQodCwgeCk7XG59O1xuXG5Td2l0Y2hTaW5rLnByb3RvdHlwZS5fZXJyb3JJbm5lciA9IGZ1bmN0aW9uICh0LCBlLCBpbm5lcikge1xuICB0aGlzLl9kaXNwb3NlSW5uZXIodCwgaW5uZXIpO1xuICB0aGlzLnNpbmsuZXJyb3IodCwgZSk7XG59O1xuXG5mdW5jdGlvbiBTZWdtZW50KG1pbiwgbWF4LCBvdXRlciwgc2luaykge1xuICB0aGlzLm1pbiA9IG1pbjtcbiAgdGhpcy5tYXggPSBtYXg7XG4gIHRoaXMub3V0ZXIgPSBvdXRlcjtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5kaXNwb3NhYmxlID0gZGlzcG9zZS5lbXB0eSgpO1xufVxuXG5TZWdtZW50LnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICh0IDwgdGhpcy5tYXgpIHtcbiAgICB0aGlzLnNpbmsuZXZlbnQoTWF0aC5tYXgodCwgdGhpcy5taW4pLCB4KTtcbiAgfVxufTtcblxuU2VnbWVudC5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdGhpcy5vdXRlci5fZW5kSW5uZXIoTWF0aC5tYXgodCwgdGhpcy5taW4pLCB4LCB0aGlzKTtcbn07XG5cblNlZ21lbnQucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgdGhpcy5vdXRlci5fZXJyb3JJbm5lcihNYXRoLm1heCh0LCB0aGlzLm1pbiksIGUsIHRoaXMpO1xufTtcblxuU2VnbWVudC5wcm90b3R5cGUuX2Rpc3Bvc2UgPSBmdW5jdGlvbiAodCkge1xuICB0aGlzLm1heCA9IHQ7XG4gIGRpc3Bvc2UudHJ5RGlzcG9zZSh0LCB0aGlzLmRpc3Bvc2FibGUsIHRoaXMuc2luayk7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50aHJ1ID0gdGhydTtcbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiB0aHJ1KGYsIHN0cmVhbSkge1xuICByZXR1cm4gZihzdHJlYW0pO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMudGFrZVVudGlsID0gdGFrZVVudGlsO1xuZXhwb3J0cy5za2lwVW50aWwgPSBza2lwVW50aWw7XG5leHBvcnRzLmR1cmluZyA9IGR1cmluZztcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9kaXNwb3NlID0gcmVxdWlyZSgnLi4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX2ZsYXRNYXAgPSByZXF1aXJlKCcuLi9jb21iaW5hdG9yL2ZsYXRNYXAnKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiB0YWtlVW50aWwoc2lnbmFsLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBVbnRpbChzaWduYWwuc291cmNlLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbmZ1bmN0aW9uIHNraXBVbnRpbChzaWduYWwsIHN0cmVhbSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFNpbmNlKHNpZ25hbC5zb3VyY2UsIHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gZHVyaW5nKHRpbWVXaW5kb3csIHN0cmVhbSkge1xuICByZXR1cm4gdGFrZVVudGlsKCgwLCBfZmxhdE1hcC5qb2luKSh0aW1lV2luZG93KSwgc2tpcFVudGlsKHRpbWVXaW5kb3csIHN0cmVhbSkpO1xufVxuXG5mdW5jdGlvbiBVbnRpbChtYXhTaWduYWwsIHNvdXJjZSkge1xuICB0aGlzLm1heFNpZ25hbCA9IG1heFNpZ25hbDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblVudGlsLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciBtaW4gPSBuZXcgQm91bmQoLUluZmluaXR5LCBzaW5rKTtcbiAgdmFyIG1heCA9IG5ldyBVcHBlckJvdW5kKHRoaXMubWF4U2lnbmFsLCBzaW5rLCBzY2hlZHVsZXIpO1xuICB2YXIgZGlzcG9zYWJsZSA9IHRoaXMuc291cmNlLnJ1bihuZXcgVGltZVdpbmRvd1NpbmsobWluLCBtYXgsIHNpbmspLCBzY2hlZHVsZXIpO1xuXG4gIHJldHVybiBkaXNwb3NlLmFsbChbbWluLCBtYXgsIGRpc3Bvc2FibGVdKTtcbn07XG5cbmZ1bmN0aW9uIFNpbmNlKG1pblNpZ25hbCwgc291cmNlKSB7XG4gIHRoaXMubWluU2lnbmFsID0gbWluU2lnbmFsO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuU2luY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIG1pbiA9IG5ldyBMb3dlckJvdW5kKHRoaXMubWluU2lnbmFsLCBzaW5rLCBzY2hlZHVsZXIpO1xuICB2YXIgbWF4ID0gbmV3IEJvdW5kKEluZmluaXR5LCBzaW5rKTtcbiAgdmFyIGRpc3Bvc2FibGUgPSB0aGlzLnNvdXJjZS5ydW4obmV3IFRpbWVXaW5kb3dTaW5rKG1pbiwgbWF4LCBzaW5rKSwgc2NoZWR1bGVyKTtcblxuICByZXR1cm4gZGlzcG9zZS5hbGwoW21pbiwgbWF4LCBkaXNwb3NhYmxlXSk7XG59O1xuXG5mdW5jdGlvbiBCb3VuZCh2YWx1ZSwgc2luaykge1xuICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cbkJvdW5kLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcbkJvdW5kLnByb3RvdHlwZS5ldmVudCA9IG5vb3A7XG5Cb3VuZC5wcm90b3R5cGUuZW5kID0gbm9vcDtcbkJvdW5kLnByb3RvdHlwZS5kaXNwb3NlID0gbm9vcDtcblxuZnVuY3Rpb24gVGltZVdpbmRvd1NpbmsobWluLCBtYXgsIHNpbmspIHtcbiAgdGhpcy5taW4gPSBtaW47XG4gIHRoaXMubWF4ID0gbWF4O1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5UaW1lV2luZG93U2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAodCA+PSB0aGlzLm1pbi52YWx1ZSAmJiB0IDwgdGhpcy5tYXgudmFsdWUpIHtcbiAgICB0aGlzLnNpbmsuZXZlbnQodCwgeCk7XG4gIH1cbn07XG5cblRpbWVXaW5kb3dTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblRpbWVXaW5kb3dTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuXG5mdW5jdGlvbiBMb3dlckJvdW5kKHNpZ25hbCwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMudmFsdWUgPSBJbmZpbml0eTtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5kaXNwb3NhYmxlID0gc2lnbmFsLnJ1bih0aGlzLCBzY2hlZHVsZXIpO1xufVxuXG5Mb3dlckJvdW5kLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0IC8qLCB4ICovKSB7XG4gIGlmICh0IDwgdGhpcy52YWx1ZSkge1xuICAgIHRoaXMudmFsdWUgPSB0O1xuICB9XG59O1xuXG5Mb3dlckJvdW5kLnByb3RvdHlwZS5lbmQgPSBub29wO1xuTG93ZXJCb3VuZC5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbkxvd2VyQm91bmQucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufTtcblxuZnVuY3Rpb24gVXBwZXJCb3VuZChzaWduYWwsIHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLnZhbHVlID0gSW5maW5pdHk7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZGlzcG9zYWJsZSA9IHNpZ25hbC5ydW4odGhpcywgc2NoZWR1bGVyKTtcbn1cblxuVXBwZXJCb3VuZC5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAodCA8IHRoaXMudmFsdWUpIHtcbiAgICB0aGlzLnZhbHVlID0gdDtcbiAgICB0aGlzLnNpbmsuZW5kKHQsIHgpO1xuICB9XG59O1xuXG5VcHBlckJvdW5kLnByb3RvdHlwZS5lbmQgPSBub29wO1xuVXBwZXJCb3VuZC5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cblVwcGVyQm91bmQucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50aW1lc3RhbXAgPSB0aW1lc3RhbXA7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiB0aW1lc3RhbXAoc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgVGltZXN0YW1wKHN0cmVhbS5zb3VyY2UpKTtcbn1cblxuZnVuY3Rpb24gVGltZXN0YW1wKHNvdXJjZSkge1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuVGltZXN0YW1wLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IFRpbWVzdGFtcFNpbmsoc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBUaW1lc3RhbXBTaW5rKHNpbmspIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuVGltZXN0YW1wU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcblRpbWVzdGFtcFNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yO1xuXG5UaW1lc3RhbXBTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHRoaXMuc2luay5ldmVudCh0LCB7IHRpbWU6IHQsIHZhbHVlOiB4IH0pO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnRyYW5zZHVjZSA9IHRyYW5zZHVjZTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gYSBzdHJlYW0gYnkgcGFzc2luZyBpdHMgZXZlbnRzIHRocm91Z2ggYSB0cmFuc2R1Y2VyLlxuICogQHBhcmFtICB7ZnVuY3Rpb259IHRyYW5zZHVjZXIgdHJhbnNkdWNlciBmdW5jdGlvblxuICogQHBhcmFtICB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIHdob3NlIGV2ZW50cyB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoIHRoZVxuICogIHRyYW5zZHVjZXJcbiAqIEByZXR1cm4ge1N0cmVhbX0gc3RyZWFtIG9mIGV2ZW50cyB0cmFuc2Zvcm1lZCBieSB0aGUgdHJhbnNkdWNlclxuICovXG5mdW5jdGlvbiB0cmFuc2R1Y2UodHJhbnNkdWNlciwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgVHJhbnNkdWNlKHRyYW5zZHVjZXIsIHN0cmVhbS5zb3VyY2UpKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFRyYW5zZHVjZSh0cmFuc2R1Y2VyLCBzb3VyY2UpIHtcbiAgdGhpcy50cmFuc2R1Y2VyID0gdHJhbnNkdWNlcjtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59XG5cblRyYW5zZHVjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgeGYgPSB0aGlzLnRyYW5zZHVjZXIobmV3IFRyYW5zZm9ybWVyKHNpbmspKTtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgVHJhbnNkdWNlU2luayhnZXRUeEhhbmRsZXIoeGYpLCBzaW5rKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIFRyYW5zZHVjZVNpbmsoYWRhcHRlciwgc2luaykge1xuICB0aGlzLnhmID0gYWRhcHRlcjtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuVHJhbnNkdWNlU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgbmV4dCA9IHRoaXMueGYuc3RlcCh0LCB4KTtcblxuICByZXR1cm4gdGhpcy54Zi5pc1JlZHVjZWQobmV4dCkgPyB0aGlzLnNpbmsuZW5kKHQsIHRoaXMueGYuZ2V0UmVzdWx0KG5leHQpKSA6IG5leHQ7XG59O1xuXG5UcmFuc2R1Y2VTaW5rLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiAodCwgeCkge1xuICByZXR1cm4gdGhpcy54Zi5yZXN1bHQoeCk7XG59O1xuXG5UcmFuc2R1Y2VTaW5rLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHJldHVybiB0aGlzLnNpbmsuZXJyb3IodCwgZSk7XG59O1xuXG5mdW5jdGlvbiBUcmFuc2Zvcm1lcihzaW5rKSB7XG4gIHRoaXMudGltZSA9IC1JbmZpbml0eTtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuVHJhbnNmb3JtZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvaW5pdCddID0gVHJhbnNmb3JtZXIucHJvdG90eXBlLmluaXQgPSBmdW5jdGlvbiAoKSB7fTtcblxuVHJhbnNmb3JtZXIucHJvdG90eXBlWydAQHRyYW5zZHVjZXIvc3RlcCddID0gVHJhbnNmb3JtZXIucHJvdG90eXBlLnN0ZXAgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIWlzTmFOKHQpKSB7XG4gICAgdGhpcy50aW1lID0gTWF0aC5tYXgodCwgdGhpcy50aW1lKTtcbiAgfVxuICByZXR1cm4gdGhpcy5zaW5rLmV2ZW50KHRoaXMudGltZSwgeCk7XG59O1xuXG5UcmFuc2Zvcm1lci5wcm90b3R5cGVbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSA9IFRyYW5zZm9ybWVyLnByb3RvdHlwZS5yZXN1bHQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gdGhpcy5zaW5rLmVuZCh0aGlzLnRpbWUsIHgpO1xufTtcblxuLyoqXG4qIEdpdmVuIGFuIG9iamVjdCBzdXBwb3J0aW5nIHRoZSBuZXcgb3IgbGVnYWN5IHRyYW5zZHVjZXIgcHJvdG9jb2wsXG4qIGNyZWF0ZSBhbiBhZGFwdGVyIGZvciBpdC5cbiogQHBhcmFtIHtvYmplY3R9IHR4IHRyYW5zZm9ybVxuKiBAcmV0dXJucyB7VHhBZGFwdGVyfExlZ2FjeVR4QWRhcHRlcn1cbiovXG5mdW5jdGlvbiBnZXRUeEhhbmRsZXIodHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB0eFsnQEB0cmFuc2R1Y2VyL3N0ZXAnXSA9PT0gJ2Z1bmN0aW9uJyA/IG5ldyBUeEFkYXB0ZXIodHgpIDogbmV3IExlZ2FjeVR4QWRhcHRlcih0eCk7XG59XG5cbi8qKlxuKiBBZGFwdGVyIGZvciBuZXcgb2ZmaWNpYWwgdHJhbnNkdWNlciBwcm90b2NvbFxuKiBAcGFyYW0ge29iamVjdH0gdHggdHJhbnNmb3JtXG4qIEBjb25zdHJ1Y3RvclxuKi9cbmZ1bmN0aW9uIFR4QWRhcHRlcih0eCkge1xuICB0aGlzLnR4ID0gdHg7XG59XG5cblR4QWRhcHRlci5wcm90b3R5cGUuc3RlcCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIHJldHVybiB0aGlzLnR4WydAQHRyYW5zZHVjZXIvc3RlcCddKHQsIHgpO1xufTtcblR4QWRhcHRlci5wcm90b3R5cGUucmVzdWx0ID0gZnVuY3Rpb24gKHgpIHtcbiAgcmV0dXJuIHRoaXMudHhbJ0BAdHJhbnNkdWNlci9yZXN1bHQnXSh4KTtcbn07XG5UeEFkYXB0ZXIucHJvdG90eXBlLmlzUmVkdWNlZCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiB4ICE9IG51bGwgJiYgeFsnQEB0cmFuc2R1Y2VyL3JlZHVjZWQnXTtcbn07XG5UeEFkYXB0ZXIucHJvdG90eXBlLmdldFJlc3VsdCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiB4WydAQHRyYW5zZHVjZXIvdmFsdWUnXTtcbn07XG5cbi8qKlxuKiBBZGFwdGVyIGZvciBvbGRlciB0cmFuc2R1Y2VyIHByb3RvY29sXG4qIEBwYXJhbSB7b2JqZWN0fSB0eCB0cmFuc2Zvcm1cbiogQGNvbnN0cnVjdG9yXG4qL1xuZnVuY3Rpb24gTGVnYWN5VHhBZGFwdGVyKHR4KSB7XG4gIHRoaXMudHggPSB0eDtcbn1cblxuTGVnYWN5VHhBZGFwdGVyLnByb3RvdHlwZS5zdGVwID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgcmV0dXJuIHRoaXMudHguc3RlcCh0LCB4KTtcbn07XG5MZWdhY3lUeEFkYXB0ZXIucHJvdG90eXBlLnJlc3VsdCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiB0aGlzLnR4LnJlc3VsdCh4KTtcbn07XG5MZWdhY3lUeEFkYXB0ZXIucHJvdG90eXBlLmlzUmVkdWNlZCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiB4ICE9IG51bGwgJiYgeC5fX3RyYW5zZHVjZXJzX3JlZHVjZWRfXztcbn07XG5MZWdhY3lUeEFkYXB0ZXIucHJvdG90eXBlLmdldFJlc3VsdCA9IGZ1bmN0aW9uICh4KSB7XG4gIHJldHVybiB4LnZhbHVlO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLm1hcCA9IG1hcDtcbmV4cG9ydHMuY29uc3RhbnQgPSBjb25zdGFudDtcbmV4cG9ydHMudGFwID0gdGFwO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX01hcCA9IHJlcXVpcmUoJy4uL2Z1c2lvbi9NYXAnKTtcblxudmFyIF9NYXAyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfTWFwKTtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBUcmFuc2Zvcm0gZWFjaCB2YWx1ZSBpbiB0aGUgc3RyZWFtIGJ5IGFwcGx5aW5nIGYgdG8gZWFjaFxuICogQHBhcmFtIHtmdW5jdGlvbigqKToqfSBmIG1hcHBpbmcgZnVuY3Rpb25cbiAqIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW0gc3RyZWFtIHRvIG1hcFxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgdHJhbnNmb3JtZWQgYnkgZlxuICovXG5mdW5jdGlvbiBtYXAoZiwgc3RyZWFtKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChfTWFwMi5kZWZhdWx0LmNyZWF0ZShmLCBzdHJlYW0uc291cmNlKSk7XG59XG5cbi8qKlxuKiBSZXBsYWNlIGVhY2ggdmFsdWUgaW4gdGhlIHN0cmVhbSB3aXRoIHhcbiogQHBhcmFtIHsqfSB4XG4qIEBwYXJhbSB7U3RyZWFtfSBzdHJlYW1cbiogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgcmVwbGFjZWQgd2l0aCB4XG4qL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGNvbnN0YW50KHgsIHN0cmVhbSkge1xuICByZXR1cm4gbWFwKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4geDtcbiAgfSwgc3RyZWFtKTtcbn1cblxuLyoqXG4qIFBlcmZvcm0gYSBzaWRlIGVmZmVjdCBmb3IgZWFjaCBpdGVtIGluIHRoZSBzdHJlYW1cbiogQHBhcmFtIHtmdW5jdGlvbih4OiopOip9IGYgc2lkZSBlZmZlY3QgdG8gZXhlY3V0ZSBmb3IgZWFjaCBpdGVtLiBUaGVcbiogIHJldHVybiB2YWx1ZSB3aWxsIGJlIGRpc2NhcmRlZC5cbiogQHBhcmFtIHtTdHJlYW19IHN0cmVhbSBzdHJlYW0gdG8gdGFwXG4qIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyB0aGUgc2FtZSBpdGVtcyBhcyB0aGlzIHN0cmVhbVxuKi9cbmZ1bmN0aW9uIHRhcChmLCBzdHJlYW0pIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBUYXAoZiwgc3RyZWFtLnNvdXJjZSkpO1xufVxuXG5mdW5jdGlvbiBUYXAoZiwgc291cmNlKSB7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xuICB0aGlzLmYgPSBmO1xufVxuXG5UYXAucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgVGFwU2luayh0aGlzLmYsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gVGFwU2luayhmLCBzaW5rKSB7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuZiA9IGY7XG59XG5cblRhcFNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5UYXBTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuVGFwU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgZiA9IHRoaXMuZjtcbiAgZih4KTtcbiAgdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnppcCA9IHppcDtcbmV4cG9ydHMuemlwQXJyYXkgPSB6aXBBcnJheTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF90cmFuc2Zvcm0gPSByZXF1aXJlKCcuL3RyYW5zZm9ybScpO1xuXG52YXIgdHJhbnNmb3JtID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3RyYW5zZm9ybSk7XG5cbnZhciBfY29yZSA9IHJlcXVpcmUoJy4uL3NvdXJjZS9jb3JlJyk7XG5cbnZhciBjb3JlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2NvcmUpO1xuXG52YXIgX1BpcGUgPSByZXF1aXJlKCcuLi9zaW5rL1BpcGUnKTtcblxudmFyIF9QaXBlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1BpcGUpO1xuXG52YXIgX0luZGV4U2luayA9IHJlcXVpcmUoJy4uL3NpbmsvSW5kZXhTaW5rJyk7XG5cbnZhciBfSW5kZXhTaW5rMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0luZGV4U2luayk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxudmFyIF9pbnZva2UgPSByZXF1aXJlKCcuLi9pbnZva2UnKTtcblxudmFyIF9pbnZva2UyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfaW52b2tlKTtcblxudmFyIF9RdWV1ZSA9IHJlcXVpcmUoJy4uL1F1ZXVlJyk7XG5cbnZhciBfUXVldWUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUXVldWUpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChvYmopIHsgaWYgKG9iaiAmJiBvYmouX19lc01vZHVsZSkgeyByZXR1cm4gb2JqOyB9IGVsc2UgeyB2YXIgbmV3T2JqID0ge307IGlmIChvYmogIT0gbnVsbCkgeyBmb3IgKHZhciBrZXkgaW4gb2JqKSB7IGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7IG5ld09ialtrZXldID0gb2JqW2tleV07IH0gfSB9IG5ld09iai5kZWZhdWx0ID0gb2JqOyByZXR1cm4gbmV3T2JqOyB9IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxudmFyIG1hcCA9IGJhc2UubWFwOyAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxudmFyIHRhaWwgPSBiYXNlLnRhaWw7XG5cbi8qKlxuICogQ29tYmluZSBzdHJlYW1zIHBhaXJ3aXNlIChvciB0dXBsZS13aXNlKSBieSBpbmRleCBieSBhcHBseWluZyBmIHRvIHZhbHVlc1xuICogYXQgY29ycmVzcG9uZGluZyBpbmRpY2VzLiAgVGhlIHJldHVybmVkIHN0cmVhbSBlbmRzIHdoZW4gYW55IG9mIHRoZSBpbnB1dFxuICogc3RyZWFtcyBlbmRzLlxuICogQHBhcmFtIHtmdW5jdGlvbn0gZiBmdW5jdGlvbiB0byBjb21iaW5lIHZhbHVlc1xuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB3aXRoIGl0ZW1zIGF0IGNvcnJlc3BvbmRpbmcgaW5kaWNlcyBjb21iaW5lZFxuICogIHVzaW5nIGZcbiAqL1xuZnVuY3Rpb24gemlwKGYgLyosIC4uLnN0cmVhbXMgKi8pIHtcbiAgcmV0dXJuIHppcEFycmF5KGYsIHRhaWwoYXJndW1lbnRzKSk7XG59XG5cbi8qKlxuKiBDb21iaW5lIHN0cmVhbXMgcGFpcndpc2UgKG9yIHR1cGxlLXdpc2UpIGJ5IGluZGV4IGJ5IGFwcGx5aW5nIGYgdG8gdmFsdWVzXG4qIGF0IGNvcnJlc3BvbmRpbmcgaW5kaWNlcy4gIFRoZSByZXR1cm5lZCBzdHJlYW0gZW5kcyB3aGVuIGFueSBvZiB0aGUgaW5wdXRcbiogc3RyZWFtcyBlbmRzLlxuKiBAcGFyYW0ge2Z1bmN0aW9ufSBmIGZ1bmN0aW9uIHRvIGNvbWJpbmUgdmFsdWVzXG4qIEBwYXJhbSB7W1N0cmVhbV19IHN0cmVhbXMgc3RyZWFtcyB0byB6aXAgdXNpbmcgZlxuKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHdpdGggaXRlbXMgYXQgY29ycmVzcG9uZGluZyBpbmRpY2VzIGNvbWJpbmVkXG4qICB1c2luZyBmXG4qL1xuZnVuY3Rpb24gemlwQXJyYXkoZiwgc3RyZWFtcykge1xuICByZXR1cm4gc3RyZWFtcy5sZW5ndGggPT09IDAgPyBjb3JlLmVtcHR5KCkgOiBzdHJlYW1zLmxlbmd0aCA9PT0gMSA/IHRyYW5zZm9ybS5tYXAoZiwgc3RyZWFtc1swXSkgOiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgWmlwKGYsIG1hcChnZXRTb3VyY2UsIHN0cmVhbXMpKSk7XG59XG5cbmZ1bmN0aW9uIGdldFNvdXJjZShzdHJlYW0pIHtcbiAgcmV0dXJuIHN0cmVhbS5zb3VyY2U7XG59XG5cbmZ1bmN0aW9uIFppcChmLCBzb3VyY2VzKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc291cmNlcyA9IHNvdXJjZXM7XG59XG5cblppcC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgbCA9IHRoaXMuc291cmNlcy5sZW5ndGg7XG4gIHZhciBkaXNwb3NhYmxlcyA9IG5ldyBBcnJheShsKTtcbiAgdmFyIHNpbmtzID0gbmV3IEFycmF5KGwpO1xuICB2YXIgYnVmZmVycyA9IG5ldyBBcnJheShsKTtcblxuICB2YXIgemlwU2luayA9IG5ldyBaaXBTaW5rKHRoaXMuZiwgYnVmZmVycywgc2lua3MsIHNpbmspO1xuXG4gIGZvciAodmFyIGluZGV4U2luaywgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICBidWZmZXJzW2ldID0gbmV3IF9RdWV1ZTIuZGVmYXVsdCgpO1xuICAgIGluZGV4U2luayA9IHNpbmtzW2ldID0gbmV3IF9JbmRleFNpbmsyLmRlZmF1bHQoaSwgemlwU2luayk7XG4gICAgZGlzcG9zYWJsZXNbaV0gPSB0aGlzJDEuc291cmNlc1tpXS5ydW4oaW5kZXhTaW5rLCBzY2hlZHVsZXIpO1xuICB9XG5cbiAgcmV0dXJuIGRpc3Bvc2UuYWxsKGRpc3Bvc2FibGVzKTtcbn07XG5cbmZ1bmN0aW9uIFppcFNpbmsoZiwgYnVmZmVycywgc2lua3MsIHNpbmspIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zaW5rcyA9IHNpbmtzO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmJ1ZmZlcnMgPSBidWZmZXJzO1xufVxuXG5aaXBTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCBpbmRleGVkVmFsdWUpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIHZhciBidWZmZXJzID0gdGhpcy5idWZmZXJzO1xuICB2YXIgYnVmZmVyID0gYnVmZmVyc1tpbmRleGVkVmFsdWUuaW5kZXhdO1xuXG4gIGJ1ZmZlci5wdXNoKGluZGV4ZWRWYWx1ZS52YWx1ZSk7XG5cbiAgaWYgKGJ1ZmZlci5sZW5ndGgoKSA9PT0gMSkge1xuICAgIGlmICghcmVhZHkodGhpcy5idWZmZXJzKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVtaXRaaXBwZWQodGhpcy5mLCB0LCBidWZmZXJzLCB0aGlzLnNpbmspO1xuXG4gICAgaWYgKGVuZGVkKHRoaXMuYnVmZmVycywgdGhpcy5zaW5rcykpIHtcbiAgICAgIHRoaXMuc2luay5lbmQodCwgdm9pZCAwKTtcbiAgICB9XG4gIH1cbn07XG5cblppcFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCBpbmRleGVkVmFsdWUpIHtcbiAgdmFyIGJ1ZmZlciA9IHRoaXMuYnVmZmVyc1tpbmRleGVkVmFsdWUuaW5kZXhdO1xuICBpZiAoYnVmZmVyLmlzRW1wdHkoKSkge1xuICAgIHRoaXMuc2luay5lbmQodCwgaW5kZXhlZFZhbHVlLnZhbHVlKTtcbiAgfVxufTtcblxuWmlwU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbmZ1bmN0aW9uIGVtaXRaaXBwZWQoZiwgdCwgYnVmZmVycywgc2luaykge1xuICBzaW5rLmV2ZW50KHQsICgwLCBfaW52b2tlMi5kZWZhdWx0KShmLCBtYXAoaGVhZCwgYnVmZmVycykpKTtcbn1cblxuZnVuY3Rpb24gaGVhZChidWZmZXIpIHtcbiAgcmV0dXJuIGJ1ZmZlci5zaGlmdCgpO1xufVxuXG5mdW5jdGlvbiBlbmRlZChidWZmZXJzLCBzaW5rcykge1xuICBmb3IgKHZhciBpID0gMCwgbCA9IGJ1ZmZlcnMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgaWYgKGJ1ZmZlcnNbaV0uaXNFbXB0eSgpICYmICFzaW5rc1tpXS5hY3RpdmUpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlYWR5KGJ1ZmZlcnMpIHtcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBidWZmZXJzLmxlbmd0aDsgaSA8IGw7ICsraSkge1xuICAgIGlmIChidWZmZXJzW2ldLmlzRW1wdHkoKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IERpc3Bvc2FibGU7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgRGlzcG9zYWJsZSB3aGljaCB3aWxsIGRpc3Bvc2UgaXRzIHVuZGVybHlpbmcgcmVzb3VyY2UuXG4gKiBAcGFyYW0ge2Z1bmN0aW9ufSBkaXNwb3NlIGZ1bmN0aW9uXG4gKiBAcGFyYW0geyo/fSBkYXRhIGFueSBkYXRhIHRvIGJlIHBhc3NlZCB0byBkaXNwb3NlciBmdW5jdGlvblxuICogQGNvbnN0cnVjdG9yXG4gKi9cbmZ1bmN0aW9uIERpc3Bvc2FibGUoZGlzcG9zZSwgZGF0YSkge1xuICB0aGlzLl9kaXNwb3NlID0gZGlzcG9zZTtcbiAgdGhpcy5fZGF0YSA9IGRhdGE7XG59XG5cbkRpc3Bvc2FibGUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLl9kaXNwb3NlKHRoaXMuX2RhdGEpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTZXR0YWJsZURpc3Bvc2FibGU7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gU2V0dGFibGVEaXNwb3NhYmxlKCkge1xuICB0aGlzLmRpc3Bvc2FibGUgPSB2b2lkIDA7XG4gIHRoaXMuZGlzcG9zZWQgPSBmYWxzZTtcbiAgdGhpcy5fcmVzb2x2ZSA9IHZvaWQgMDtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIHRoaXMucmVzdWx0ID0gbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUpIHtcbiAgICBzZWxmLl9yZXNvbHZlID0gcmVzb2x2ZTtcbiAgfSk7XG59XG5cblNldHRhYmxlRGlzcG9zYWJsZS5wcm90b3R5cGUuc2V0RGlzcG9zYWJsZSA9IGZ1bmN0aW9uIChkaXNwb3NhYmxlKSB7XG4gIGlmICh0aGlzLmRpc3Bvc2FibGUgIT09IHZvaWQgMCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0RGlzcG9zYWJsZSBjYWxsZWQgbW9yZSB0aGFuIG9uY2UnKTtcbiAgfVxuXG4gIHRoaXMuZGlzcG9zYWJsZSA9IGRpc3Bvc2FibGU7XG5cbiAgaWYgKHRoaXMuZGlzcG9zZWQpIHtcbiAgICB0aGlzLl9yZXNvbHZlKGRpc3Bvc2FibGUuZGlzcG9zZSgpKTtcbiAgfVxufTtcblxuU2V0dGFibGVEaXNwb3NhYmxlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICBpZiAodGhpcy5kaXNwb3NlZCkge1xuICAgIHJldHVybiB0aGlzLnJlc3VsdDtcbiAgfVxuXG4gIHRoaXMuZGlzcG9zZWQgPSB0cnVlO1xuXG4gIGlmICh0aGlzLmRpc3Bvc2FibGUgIT09IHZvaWQgMCkge1xuICAgIHRoaXMucmVzdWx0ID0gdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2UoKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzLnJlc3VsdDtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50cnlEaXNwb3NlID0gdHJ5RGlzcG9zZTtcbmV4cG9ydHMuY3JlYXRlID0gY3JlYXRlO1xuZXhwb3J0cy5lbXB0eSA9IGVtcHR5O1xuZXhwb3J0cy5hbGwgPSBhbGw7XG5leHBvcnRzLnByb21pc2VkID0gcHJvbWlzZWQ7XG5leHBvcnRzLnNldHRhYmxlID0gc2V0dGFibGU7XG5leHBvcnRzLm9uY2UgPSBvbmNlO1xuXG52YXIgX0Rpc3Bvc2FibGUgPSByZXF1aXJlKCcuL0Rpc3Bvc2FibGUnKTtcblxudmFyIF9EaXNwb3NhYmxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0Rpc3Bvc2FibGUpO1xuXG52YXIgX1NldHRhYmxlRGlzcG9zYWJsZSA9IHJlcXVpcmUoJy4vU2V0dGFibGVEaXNwb3NhYmxlJyk7XG5cbnZhciBfU2V0dGFibGVEaXNwb3NhYmxlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1NldHRhYmxlRGlzcG9zYWJsZSk7XG5cbnZhciBfUHJvbWlzZSA9IHJlcXVpcmUoJy4uL1Byb21pc2UnKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xudmFyIG1hcCA9IGJhc2UubWFwO1xudmFyIGlkZW50aXR5ID0gYmFzZS5pZDtcblxuLyoqXG4gKiBDYWxsIGRpc3Bvc2FibGUuZGlzcG9zZS4gIElmIGl0IHJldHVybnMgYSBwcm9taXNlLCBjYXRjaCBwcm9taXNlXG4gKiBlcnJvciBhbmQgZm9yd2FyZCBpdCB0aHJvdWdoIHRoZSBwcm92aWRlZCBzaW5rLlxuICogQHBhcmFtIHtudW1iZXJ9IHQgdGltZVxuICogQHBhcmFtIHt7ZGlzcG9zZTogZnVuY3Rpb259fSBkaXNwb3NhYmxlXG4gKiBAcGFyYW0ge3tlcnJvcjogZnVuY3Rpb259fSBzaW5rXG4gKiBAcmV0dXJuIHsqfSByZXN1bHQgb2YgZGlzcG9zYWJsZS5kaXNwb3NlXG4gKi9cbmZ1bmN0aW9uIHRyeURpc3Bvc2UodCwgZGlzcG9zYWJsZSwgc2luaykge1xuICB2YXIgcmVzdWx0ID0gZGlzcG9zZVNhZmVseShkaXNwb3NhYmxlKTtcbiAgcmV0dXJuICgwLCBfUHJvbWlzZS5pc1Byb21pc2UpKHJlc3VsdCkgPyByZXN1bHQuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICBzaW5rLmVycm9yKHQsIGUpO1xuICB9KSA6IHJlc3VsdDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgRGlzcG9zYWJsZSB3aGljaCB3aWxsIGRpc3Bvc2UgaXRzIHVuZGVybHlpbmcgcmVzb3VyY2VcbiAqIGF0IG1vc3Qgb25jZS5cbiAqIEBwYXJhbSB7ZnVuY3Rpb259IGRpc3Bvc2UgZnVuY3Rpb25cbiAqIEBwYXJhbSB7Kj99IGRhdGEgYW55IGRhdGEgdG8gYmUgcGFzc2VkIHRvIGRpc3Bvc2VyIGZ1bmN0aW9uXG4gKiBAcmV0dXJuIHtEaXNwb3NhYmxlfVxuICovXG5mdW5jdGlvbiBjcmVhdGUoZGlzcG9zZSwgZGF0YSkge1xuICByZXR1cm4gb25jZShuZXcgX0Rpc3Bvc2FibGUyLmRlZmF1bHQoZGlzcG9zZSwgZGF0YSkpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5vb3AgZGlzcG9zYWJsZS4gQ2FuIGJlIHVzZWQgdG8gc2F0aXNmeSBhIERpc3Bvc2FibGVcbiAqIHJlcXVpcmVtZW50IHdoZW4gbm8gYWN0dWFsIHJlc291cmNlIG5lZWRzIHRvIGJlIGRpc3Bvc2VkLlxuICogQHJldHVybiB7RGlzcG9zYWJsZXxleHBvcnRzfG1vZHVsZS5leHBvcnRzfVxuICovXG5mdW5jdGlvbiBlbXB0eSgpIHtcbiAgcmV0dXJuIG5ldyBfRGlzcG9zYWJsZTIuZGVmYXVsdChpZGVudGl0eSwgdm9pZCAwKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXNwb3NhYmxlIHRoYXQgd2lsbCBkaXNwb3NlIGFsbCBpbnB1dCBkaXNwb3NhYmxlcyBpbiBwYXJhbGxlbC5cbiAqIEBwYXJhbSB7QXJyYXk8RGlzcG9zYWJsZT59IGRpc3Bvc2FibGVzXG4gKiBAcmV0dXJuIHtEaXNwb3NhYmxlfVxuICovXG5mdW5jdGlvbiBhbGwoZGlzcG9zYWJsZXMpIHtcbiAgcmV0dXJuIGNyZWF0ZShkaXNwb3NlQWxsLCBkaXNwb3NhYmxlcyk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VBbGwoZGlzcG9zYWJsZXMpIHtcbiAgcmV0dXJuIFByb21pc2UuYWxsKG1hcChkaXNwb3NlU2FmZWx5LCBkaXNwb3NhYmxlcykpO1xufVxuXG5mdW5jdGlvbiBkaXNwb3NlU2FmZWx5KGRpc3Bvc2FibGUpIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXNwb3NhYmxlIGZyb20gYSBwcm9taXNlIGZvciBhbm90aGVyIGRpc3Bvc2FibGVcbiAqIEBwYXJhbSB7UHJvbWlzZTxEaXNwb3NhYmxlPn0gZGlzcG9zYWJsZVByb21pc2VcbiAqIEByZXR1cm4ge0Rpc3Bvc2FibGV9XG4gKi9cbmZ1bmN0aW9uIHByb21pc2VkKGRpc3Bvc2FibGVQcm9taXNlKSB7XG4gIHJldHVybiBjcmVhdGUoZGlzcG9zZVByb21pc2UsIGRpc3Bvc2FibGVQcm9taXNlKTtcbn1cblxuZnVuY3Rpb24gZGlzcG9zZVByb21pc2UoZGlzcG9zYWJsZVByb21pc2UpIHtcbiAgcmV0dXJuIGRpc3Bvc2FibGVQcm9taXNlLnRoZW4oZGlzcG9zZU9uZSk7XG59XG5cbmZ1bmN0aW9uIGRpc3Bvc2VPbmUoZGlzcG9zYWJsZSkge1xuICByZXR1cm4gZGlzcG9zYWJsZS5kaXNwb3NlKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgZGlzcG9zYWJsZSBwcm94eSB0aGF0IGFsbG93cyBpdHMgdW5kZXJseWluZyBkaXNwb3NhYmxlIHRvXG4gKiBiZSBzZXQgbGF0ZXIuXG4gKiBAcmV0dXJuIHtTZXR0YWJsZURpc3Bvc2FibGV9XG4gKi9cbmZ1bmN0aW9uIHNldHRhYmxlKCkge1xuICByZXR1cm4gbmV3IF9TZXR0YWJsZURpc3Bvc2FibGUyLmRlZmF1bHQoKTtcbn1cblxuLyoqXG4gKiBXcmFwIGFuIGV4aXN0aW5nIGRpc3Bvc2FibGUgKHdoaWNoIG1heSBub3QgYWxyZWFkeSBoYXZlIGJlZW4gb25jZSgpZClcbiAqIHNvIHRoYXQgaXQgd2lsbCBvbmx5IGRpc3Bvc2UgaXRzIHVuZGVybHlpbmcgcmVzb3VyY2UgYXQgbW9zdCBvbmNlLlxuICogQHBhcmFtIHt7IGRpc3Bvc2U6IGZ1bmN0aW9uKCkgfX0gZGlzcG9zYWJsZVxuICogQHJldHVybiB7RGlzcG9zYWJsZX0gd3JhcHBlZCBkaXNwb3NhYmxlXG4gKi9cbmZ1bmN0aW9uIG9uY2UoZGlzcG9zYWJsZSkge1xuICByZXR1cm4gbmV3IF9EaXNwb3NhYmxlMi5kZWZhdWx0KGRpc3Bvc2VNZW1vaXplZCwgbWVtb2l6ZWQoZGlzcG9zYWJsZSkpO1xufVxuXG5mdW5jdGlvbiBkaXNwb3NlTWVtb2l6ZWQobWVtb2l6ZWQpIHtcbiAgaWYgKCFtZW1vaXplZC5kaXNwb3NlZCkge1xuICAgIG1lbW9pemVkLmRpc3Bvc2VkID0gdHJ1ZTtcbiAgICBtZW1vaXplZC52YWx1ZSA9IGRpc3Bvc2VTYWZlbHkobWVtb2l6ZWQuZGlzcG9zYWJsZSk7XG4gICAgbWVtb2l6ZWQuZGlzcG9zYWJsZSA9IHZvaWQgMDtcbiAgfVxuXG4gIHJldHVybiBtZW1vaXplZC52YWx1ZTtcbn1cblxuZnVuY3Rpb24gbWVtb2l6ZWQoZGlzcG9zYWJsZSkge1xuICByZXR1cm4geyBkaXNwb3NlZDogZmFsc2UsIGRpc3Bvc2FibGU6IGRpc3Bvc2FibGUsIHZhbHVlOiB2b2lkIDAgfTtcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IGZhdGFsRXJyb3I7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gZmF0YWxFcnJvcihlKSB7XG4gIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIHRocm93IGU7XG4gIH0sIDApO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEZpbHRlcjtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gRmlsdGVyKHAsIHNvdXJjZSkge1xuICB0aGlzLnAgPSBwO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBmaWx0ZXJlZCBzb3VyY2UsIGZ1c2luZyBhZGphY2VudCBmaWx0ZXIuZmlsdGVyIGlmIHBvc3NpYmxlXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6Ym9vbGVhbn0gcCBmaWx0ZXJpbmcgcHJlZGljYXRlXG4gKiBAcGFyYW0ge3tydW46ZnVuY3Rpb259fSBzb3VyY2Ugc291cmNlIHRvIGZpbHRlclxuICogQHJldHVybnMge0ZpbHRlcn0gZmlsdGVyZWQgc291cmNlXG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5GaWx0ZXIuY3JlYXRlID0gZnVuY3Rpb24gY3JlYXRlRmlsdGVyKHAsIHNvdXJjZSkge1xuICBpZiAoc291cmNlIGluc3RhbmNlb2YgRmlsdGVyKSB7XG4gICAgcmV0dXJuIG5ldyBGaWx0ZXIoYW5kKHNvdXJjZS5wLCBwKSwgc291cmNlLnNvdXJjZSk7XG4gIH1cblxuICByZXR1cm4gbmV3IEZpbHRlcihwLCBzb3VyY2UpO1xufTtcblxuRmlsdGVyLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiB0aGlzLnNvdXJjZS5ydW4obmV3IEZpbHRlclNpbmsodGhpcy5wLCBzaW5rKSwgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIEZpbHRlclNpbmsocCwgc2luaykge1xuICB0aGlzLnAgPSBwO1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5GaWx0ZXJTaW5rLnByb3RvdHlwZS5lbmQgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZW5kO1xuRmlsdGVyU2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7XG5cbkZpbHRlclNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgdmFyIHAgPSB0aGlzLnA7XG4gIHAoeCkgJiYgdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xufTtcblxuZnVuY3Rpb24gYW5kKHAsIHEpIHtcbiAgcmV0dXJuIGZ1bmN0aW9uICh4KSB7XG4gICAgcmV0dXJuIHAoeCkgJiYgcSh4KTtcbiAgfTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBGaWx0ZXJNYXA7XG5cbnZhciBfUGlwZSA9IHJlcXVpcmUoJy4uL3NpbmsvUGlwZScpO1xuXG52YXIgX1BpcGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUGlwZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIEZpbHRlck1hcChwLCBmLCBzb3VyY2UpIHtcbiAgdGhpcy5wID0gcDtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5GaWx0ZXJNYXAucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgRmlsdGVyTWFwU2luayh0aGlzLnAsIHRoaXMuZiwgc2luayksIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBGaWx0ZXJNYXBTaW5rKHAsIGYsIHNpbmspIHtcbiAgdGhpcy5wID0gcDtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuRmlsdGVyTWFwU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgZiA9IHRoaXMuZjtcbiAgdmFyIHAgPSB0aGlzLnA7XG4gIHAoeCkgJiYgdGhpcy5zaW5rLmV2ZW50KHQsIGYoeCkpO1xufTtcblxuRmlsdGVyTWFwU2luay5wcm90b3R5cGUuZW5kID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVuZDtcbkZpbHRlck1hcFNpbmsucHJvdG90eXBlLmVycm9yID0gX1BpcGUyLmRlZmF1bHQucHJvdG90eXBlLmVycm9yOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IE1hcDtcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi4vc2luay9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxudmFyIF9GaWx0ZXIgPSByZXF1aXJlKCcuL0ZpbHRlcicpO1xuXG52YXIgX0ZpbHRlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9GaWx0ZXIpO1xuXG52YXIgX0ZpbHRlck1hcCA9IHJlcXVpcmUoJy4vRmlsdGVyTWFwJyk7XG5cbnZhciBfRmlsdGVyTWFwMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0ZpbHRlck1hcCk7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gTWFwKGYsIHNvdXJjZSkge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnNvdXJjZSA9IHNvdXJjZTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBtYXBwZWQgc291cmNlLCBmdXNpbmcgYWRqYWNlbnQgbWFwLm1hcCwgZmlsdGVyLm1hcCxcbiAqIGFuZCBmaWx0ZXIubWFwLm1hcCBpZiBwb3NzaWJsZVxuICogQHBhcmFtIHtmdW5jdGlvbigqKToqfSBmIG1hcHBpbmcgZnVuY3Rpb25cbiAqIEBwYXJhbSB7e3J1bjpmdW5jdGlvbn19IHNvdXJjZSBzb3VyY2UgdG8gbWFwXG4gKiBAcmV0dXJucyB7TWFwfEZpbHRlck1hcH0gbWFwcGVkIHNvdXJjZSwgcG9zc2libHkgZnVzZWRcbiAqL1xuTWFwLmNyZWF0ZSA9IGZ1bmN0aW9uIGNyZWF0ZU1hcChmLCBzb3VyY2UpIHtcbiAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIE1hcCkge1xuICAgIHJldHVybiBuZXcgTWFwKGJhc2UuY29tcG9zZShmLCBzb3VyY2UuZiksIHNvdXJjZS5zb3VyY2UpO1xuICB9XG5cbiAgaWYgKHNvdXJjZSBpbnN0YW5jZW9mIF9GaWx0ZXIyLmRlZmF1bHQpIHtcbiAgICByZXR1cm4gbmV3IF9GaWx0ZXJNYXAyLmRlZmF1bHQoc291cmNlLnAsIGYsIHNvdXJjZS5zb3VyY2UpO1xuICB9XG5cbiAgcmV0dXJuIG5ldyBNYXAoZiwgc291cmNlKTtcbn07XG5cbk1hcC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWV4dGVuZC1uYXRpdmVcbiAgcmV0dXJuIHRoaXMuc291cmNlLnJ1bihuZXcgTWFwU2luayh0aGlzLmYsIHNpbmspLCBzY2hlZHVsZXIpO1xufTtcblxuZnVuY3Rpb24gTWFwU2luayhmLCBzaW5rKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2luayA9IHNpbms7XG59XG5cbk1hcFNpbmsucHJvdG90eXBlLmVuZCA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lbmQ7XG5NYXBTaW5rLnByb3RvdHlwZS5lcnJvciA9IF9QaXBlMi5kZWZhdWx0LnByb3RvdHlwZS5lcnJvcjtcblxuTWFwU2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICB2YXIgZiA9IHRoaXMuZjtcbiAgdGhpcy5zaW5rLmV2ZW50KHQsIGYoeCkpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLlByb3BhZ2F0ZVRhc2sgPSBleHBvcnRzLmRlZmF1bHRTY2hlZHVsZXIgPSBleHBvcnRzLm11bHRpY2FzdCA9IGV4cG9ydHMudGhyb3dFcnJvciA9IGV4cG9ydHMuZmxhdE1hcEVycm9yID0gZXhwb3J0cy5yZWNvdmVyV2l0aCA9IGV4cG9ydHMuYXdhaXQgPSBleHBvcnRzLmF3YWl0UHJvbWlzZXMgPSBleHBvcnRzLmZyb21Qcm9taXNlID0gZXhwb3J0cy5kZWJvdW5jZSA9IGV4cG9ydHMudGhyb3R0bGUgPSBleHBvcnRzLnRpbWVzdGFtcCA9IGV4cG9ydHMuZGVsYXkgPSBleHBvcnRzLmR1cmluZyA9IGV4cG9ydHMuc2luY2UgPSBleHBvcnRzLnNraXBVbnRpbCA9IGV4cG9ydHMudW50aWwgPSBleHBvcnRzLnRha2VVbnRpbCA9IGV4cG9ydHMuc2tpcFdoaWxlID0gZXhwb3J0cy50YWtlV2hpbGUgPSBleHBvcnRzLnNsaWNlID0gZXhwb3J0cy5za2lwID0gZXhwb3J0cy50YWtlID0gZXhwb3J0cy5kaXN0aW5jdEJ5ID0gZXhwb3J0cy5za2lwUmVwZWF0c1dpdGggPSBleHBvcnRzLmRpc3RpbmN0ID0gZXhwb3J0cy5za2lwUmVwZWF0cyA9IGV4cG9ydHMuZmlsdGVyID0gZXhwb3J0cy5zd2l0Y2ggPSBleHBvcnRzLnN3aXRjaExhdGVzdCA9IGV4cG9ydHMuemlwQXJyYXkgPSBleHBvcnRzLnppcCA9IGV4cG9ydHMuc2FtcGxlV2l0aCA9IGV4cG9ydHMuc2FtcGxlQXJyYXkgPSBleHBvcnRzLnNhbXBsZSA9IGV4cG9ydHMuY29tYmluZUFycmF5ID0gZXhwb3J0cy5jb21iaW5lID0gZXhwb3J0cy5tZXJnZUFycmF5ID0gZXhwb3J0cy5tZXJnZSA9IGV4cG9ydHMubWVyZ2VDb25jdXJyZW50bHkgPSBleHBvcnRzLmNvbmNhdE1hcCA9IGV4cG9ydHMuZmxhdE1hcEVuZCA9IGV4cG9ydHMuY29udGludWVXaXRoID0gZXhwb3J0cy5qb2luID0gZXhwb3J0cy5jaGFpbiA9IGV4cG9ydHMuZmxhdE1hcCA9IGV4cG9ydHMudHJhbnNkdWNlID0gZXhwb3J0cy5hcCA9IGV4cG9ydHMudGFwID0gZXhwb3J0cy5jb25zdGFudCA9IGV4cG9ydHMubWFwID0gZXhwb3J0cy5zdGFydFdpdGggPSBleHBvcnRzLmNvbmNhdCA9IGV4cG9ydHMuZ2VuZXJhdGUgPSBleHBvcnRzLml0ZXJhdGUgPSBleHBvcnRzLnVuZm9sZCA9IGV4cG9ydHMucmVkdWNlID0gZXhwb3J0cy5zY2FuID0gZXhwb3J0cy5sb29wID0gZXhwb3J0cy5kcmFpbiA9IGV4cG9ydHMuZm9yRWFjaCA9IGV4cG9ydHMub2JzZXJ2ZSA9IGV4cG9ydHMuZnJvbUV2ZW50ID0gZXhwb3J0cy5wZXJpb2RpYyA9IGV4cG9ydHMuZnJvbSA9IGV4cG9ydHMubmV2ZXIgPSBleHBvcnRzLmVtcHR5ID0gZXhwb3J0cy5qdXN0ID0gZXhwb3J0cy5vZiA9IGV4cG9ydHMuU3RyZWFtID0gdW5kZWZpbmVkO1xuXG52YXIgX2Zyb21FdmVudCA9IHJlcXVpcmUoJy4vc291cmNlL2Zyb21FdmVudCcpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ2Zyb21FdmVudCcsIHtcbiAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIF9mcm9tRXZlbnQuZnJvbUV2ZW50O1xuICB9XG59KTtcblxudmFyIF91bmZvbGQgPSByZXF1aXJlKCcuL3NvdXJjZS91bmZvbGQnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICd1bmZvbGQnLCB7XG4gIGVudW1lcmFibGU6IHRydWUsXG4gIGdldDogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBfdW5mb2xkLnVuZm9sZDtcbiAgfVxufSk7XG5cbnZhciBfaXRlcmF0ZSA9IHJlcXVpcmUoJy4vc291cmNlL2l0ZXJhdGUnKTtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdpdGVyYXRlJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX2l0ZXJhdGUuaXRlcmF0ZTtcbiAgfVxufSk7XG5cbnZhciBfZ2VuZXJhdGUgPSByZXF1aXJlKCcuL3NvdXJjZS9nZW5lcmF0ZScpO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ2dlbmVyYXRlJywge1xuICBlbnVtZXJhYmxlOiB0cnVlLFxuICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gX2dlbmVyYXRlLmdlbmVyYXRlO1xuICB9XG59KTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX3ByZWx1ZGUgPSByZXF1aXJlKCdAbW9zdC9wcmVsdWRlJyk7XG5cbnZhciBiYXNlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3ByZWx1ZGUpO1xuXG52YXIgX2NvcmUgPSByZXF1aXJlKCcuL3NvdXJjZS9jb3JlJyk7XG5cbnZhciBfZnJvbSA9IHJlcXVpcmUoJy4vc291cmNlL2Zyb20nKTtcblxudmFyIF9wZXJpb2RpYyA9IHJlcXVpcmUoJy4vc291cmNlL3BlcmlvZGljJyk7XG5cbnZhciBfc3ltYm9sT2JzZXJ2YWJsZSA9IHJlcXVpcmUoJ3N5bWJvbC1vYnNlcnZhYmxlJyk7XG5cbnZhciBfc3ltYm9sT2JzZXJ2YWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9zeW1ib2xPYnNlcnZhYmxlKTtcblxudmFyIF9zdWJzY3JpYmUgPSByZXF1aXJlKCcuL29ic2VydmFibGUvc3Vic2NyaWJlJyk7XG5cbnZhciBfdGhydSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci90aHJ1Jyk7XG5cbnZhciBfb2JzZXJ2ZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9vYnNlcnZlJyk7XG5cbnZhciBfbG9vcCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9sb29wJyk7XG5cbnZhciBfYWNjdW11bGF0ZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9hY2N1bXVsYXRlJyk7XG5cbnZhciBfYnVpbGQgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvYnVpbGQnKTtcblxudmFyIF90cmFuc2Zvcm0gPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvdHJhbnNmb3JtJyk7XG5cbnZhciBfYXBwbGljYXRpdmUgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvYXBwbGljYXRpdmUnKTtcblxudmFyIF90cmFuc2R1Y2UgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvdHJhbnNkdWNlJyk7XG5cbnZhciBfZmxhdE1hcCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9mbGF0TWFwJyk7XG5cbnZhciBfY29udGludWVXaXRoID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2NvbnRpbnVlV2l0aCcpO1xuXG52YXIgX2NvbmNhdE1hcCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9jb25jYXRNYXAnKTtcblxudmFyIF9tZXJnZUNvbmN1cnJlbnRseSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9tZXJnZUNvbmN1cnJlbnRseScpO1xuXG52YXIgX21lcmdlID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL21lcmdlJyk7XG5cbnZhciBfY29tYmluZSA9IHJlcXVpcmUoJy4vY29tYmluYXRvci9jb21iaW5lJyk7XG5cbnZhciBfc2FtcGxlID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3NhbXBsZScpO1xuXG52YXIgX3ppcCA9IHJlcXVpcmUoJy4vY29tYmluYXRvci96aXAnKTtcblxudmFyIF9zd2l0Y2ggPSByZXF1aXJlKCcuL2NvbWJpbmF0b3Ivc3dpdGNoJyk7XG5cbnZhciBfZmlsdGVyID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2ZpbHRlcicpO1xuXG52YXIgX3NsaWNlID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3NsaWNlJyk7XG5cbnZhciBfdGltZXNsaWNlID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3RpbWVzbGljZScpO1xuXG52YXIgX2RlbGF5ID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2RlbGF5Jyk7XG5cbnZhciBfdGltZXN0YW1wID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL3RpbWVzdGFtcCcpO1xuXG52YXIgX2xpbWl0ID0gcmVxdWlyZSgnLi9jb21iaW5hdG9yL2xpbWl0Jyk7XG5cbnZhciBfcHJvbWlzZXMgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvcHJvbWlzZXMnKTtcblxudmFyIF9lcnJvcnMgPSByZXF1aXJlKCcuL2NvbWJpbmF0b3IvZXJyb3JzJyk7XG5cbnZhciBfbXVsdGljYXN0ID0gcmVxdWlyZSgnQG1vc3QvbXVsdGljYXN0Jyk7XG5cbnZhciBfbXVsdGljYXN0MiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX211bHRpY2FzdCk7XG5cbnZhciBfZGVmYXVsdFNjaGVkdWxlciA9IHJlcXVpcmUoJy4vc2NoZWR1bGVyL2RlZmF1bHRTY2hlZHVsZXInKTtcblxudmFyIF9kZWZhdWx0U2NoZWR1bGVyMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX2RlZmF1bHRTY2hlZHVsZXIpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQ29yZSBzdHJlYW0gdHlwZVxuICogQHR5cGUge1N0cmVhbX1cbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmV4cG9ydHMuU3RyZWFtID0gX1N0cmVhbTIuZGVmYXVsdDtcblxuLy8gQWRkIG9mIGFuZCBlbXB0eSB0byBjb25zdHJ1Y3RvciBmb3IgZmFudGFzeS1sYW5kIGNvbXBhdFxuXG5fU3RyZWFtMi5kZWZhdWx0Lm9mID0gX2NvcmUub2Y7XG5fU3RyZWFtMi5kZWZhdWx0LmVtcHR5ID0gX2NvcmUuZW1wdHk7XG4vLyBBZGQgZnJvbSB0byBjb25zdHJ1Y3RvciBmb3IgRVMgT2JzZXJ2YWJsZSBjb21wYXRcbl9TdHJlYW0yLmRlZmF1bHQuZnJvbSA9IF9mcm9tLmZyb207XG5leHBvcnRzLm9mID0gX2NvcmUub2Y7XG5leHBvcnRzLmp1c3QgPSBfY29yZS5vZjtcbmV4cG9ydHMuZW1wdHkgPSBfY29yZS5lbXB0eTtcbmV4cG9ydHMubmV2ZXIgPSBfY29yZS5uZXZlcjtcbmV4cG9ydHMuZnJvbSA9IF9mcm9tLmZyb207XG5leHBvcnRzLnBlcmlvZGljID0gX3BlcmlvZGljLnBlcmlvZGljO1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRHJhZnQgRVMgT2JzZXJ2YWJsZSBwcm9wb3NhbCBpbnRlcm9wXG4vLyBodHRwczovL2dpdGh1Yi5jb20vemVucGFyc2luZy9lcy1vYnNlcnZhYmxlXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uIChzdWJzY3JpYmVyKSB7XG4gIHJldHVybiAoMCwgX3N1YnNjcmliZS5zdWJzY3JpYmUpKHN1YnNjcmliZXIsIHRoaXMpO1xufTtcblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGVbX3N5bWJvbE9ic2VydmFibGUyLmRlZmF1bHRdID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBGbHVlbnQgYWRhcHRlclxuXG4vKipcbiAqIEFkYXB0IGEgZnVuY3Rpb25hbCBzdHJlYW0gdHJhbnNmb3JtIHRvIGZsdWVudCBzdHlsZS5cbiAqIEl0IGFwcGxpZXMgZiB0byB0aGUgdGhpcyBzdHJlYW0gb2JqZWN0XG4gKiBAcGFyYW0gIHtmdW5jdGlvbihzOiBTdHJlYW0pOiBTdHJlYW19IGYgZnVuY3Rpb24gdGhhdFxuICogcmVjZWl2ZXMgdGhlIHN0cmVhbSBpdHNlbGYgYW5kIG11c3QgcmV0dXJuIGEgbmV3IHN0cmVhbVxuICogQHJldHVybiB7U3RyZWFtfVxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS50aHJ1ID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfdGhydS50aHJ1KShmLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBBZGFwdGluZyBvdGhlciBzb3VyY2VzXG5cbi8qKlxuICogQ3JlYXRlIGEgc3RyZWFtIG9mIGV2ZW50cyBmcm9tIHRoZSBzdXBwbGllZCBFdmVudFRhcmdldCBvciBFdmVudEVtaXR0ZXJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCBuYW1lXG4gKiBAcGFyYW0ge0V2ZW50VGFyZ2V0fEV2ZW50RW1pdHRlcn0gc291cmNlIEV2ZW50VGFyZ2V0IG9yIEV2ZW50RW1pdHRlci4gVGhlIHNvdXJjZVxuICogIG11c3Qgc3VwcG9ydCBlaXRoZXIgYWRkRXZlbnRMaXN0ZW5lci9yZW1vdmVFdmVudExpc3RlbmVyICh3M2MgRXZlbnRUYXJnZXQ6XG4gKiAgaHR0cDovL3d3dy53My5vcmcvVFIvRE9NLUxldmVsLTItRXZlbnRzL2V2ZW50cy5odG1sI0V2ZW50cy1FdmVudFRhcmdldCksXG4gKiAgb3IgYWRkTGlzdGVuZXIvcmVtb3ZlTGlzdGVuZXIgKG5vZGUgRXZlbnRFbWl0dGVyOiBodHRwOi8vbm9kZWpzLm9yZy9hcGkvZXZlbnRzLmh0bWwpXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gb2YgZXZlbnRzIG9mIHRoZSBzcGVjaWZpZWQgdHlwZSBmcm9tIHRoZSBzb3VyY2VcbiAqL1xuXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBPYnNlcnZpbmdcblxuZXhwb3J0cy5vYnNlcnZlID0gX29ic2VydmUub2JzZXJ2ZTtcbmV4cG9ydHMuZm9yRWFjaCA9IF9vYnNlcnZlLm9ic2VydmU7XG5leHBvcnRzLmRyYWluID0gX29ic2VydmUuZHJhaW47XG5cbi8qKlxuICogUHJvY2VzcyBhbGwgdGhlIGV2ZW50cyBpbiB0aGUgc3RyZWFtXG4gKiBAcmV0dXJucyB7UHJvbWlzZX0gcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIHdoZW4gdGhlIHN0cmVhbSBlbmRzLCBvciByZWplY3RzXG4gKiAgaWYgdGhlIHN0cmVhbSBmYWlscyB3aXRoIGFuIHVuaGFuZGxlZCBlcnJvci5cbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5vYnNlcnZlID0gX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uIChmKSB7XG4gIHJldHVybiAoMCwgX29ic2VydmUub2JzZXJ2ZSkoZiwgdGhpcyk7XG59O1xuXG4vKipcbiAqIENvbnN1bWUgYWxsIGV2ZW50cyBpbiB0aGUgc3RyZWFtLCB3aXRob3V0IHByb3ZpZGluZyBhIGZ1bmN0aW9uIHRvIHByb2Nlc3MgZWFjaC5cbiAqIFRoaXMgY2F1c2VzIGEgc3RyZWFtIHRvIGJlY29tZSBhY3RpdmUgYW5kIGJlZ2luIGVtaXR0aW5nIGV2ZW50cywgYW5kIGlzIHVzZWZ1bFxuICogaW4gY2FzZXMgd2hlcmUgYWxsIHByb2Nlc3NpbmcgaGFzIGJlZW4gc2V0dXAgdXBzdHJlYW0gdmlhIG90aGVyIGNvbWJpbmF0b3JzLCBhbmRcbiAqIHRoZXJlIGlzIG5vIG5lZWQgdG8gcHJvY2VzcyB0aGUgdGVybWluYWwgZXZlbnRzLlxuICogQHJldHVybnMge1Byb21pc2V9IHByb21pc2UgdGhhdCBmdWxmaWxscyB3aGVuIHRoZSBzdHJlYW0gZW5kcywgb3IgcmVqZWN0c1xuICogIGlmIHRoZSBzdHJlYW0gZmFpbHMgd2l0aCBhbiB1bmhhbmRsZWQgZXJyb3IuXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmRyYWluID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gKDAsIF9vYnNlcnZlLmRyYWluKSh0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0cy5sb29wID0gX2xvb3AubG9vcDtcblxuLyoqXG4gKiBHZW5lcmFsaXplZCBmZWVkYmFjayBsb29wLiBDYWxsIGEgc3RlcHBlciBmdW5jdGlvbiBmb3IgZWFjaCBldmVudC4gVGhlIHN0ZXBwZXJcbiAqIHdpbGwgYmUgY2FsbGVkIHdpdGggMiBwYXJhbXM6IHRoZSBjdXJyZW50IHNlZWQgYW5kIHRoZSBhbiBldmVudCB2YWx1ZS4gIEl0IG11c3RcbiAqIHJldHVybiBhIG5ldyB7IHNlZWQsIHZhbHVlIH0gcGFpci4gVGhlIGBzZWVkYCB3aWxsIGJlIGZlZCBiYWNrIGludG8gdGhlIG5leHRcbiAqIGludm9jYXRpb24gb2Ygc3RlcHBlciwgYW5kIHRoZSBgdmFsdWVgIHdpbGwgYmUgcHJvcGFnYXRlZCBhcyB0aGUgZXZlbnQgdmFsdWUuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHNlZWQ6KiwgdmFsdWU6Kik6e3NlZWQ6KiwgdmFsdWU6Kn19IHN0ZXBwZXIgbG9vcCBzdGVwIGZ1bmN0aW9uXG4gKiBAcGFyYW0geyp9IHNlZWQgaW5pdGlhbCBzZWVkIHZhbHVlIHBhc3NlZCB0byBmaXJzdCBzdGVwcGVyIGNhbGxcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gd2hvc2UgdmFsdWVzIGFyZSB0aGUgYHZhbHVlYCBmaWVsZCBvZiB0aGUgb2JqZWN0c1xuICogcmV0dXJuZWQgYnkgdGhlIHN0ZXBwZXJcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5sb29wID0gZnVuY3Rpb24gKHN0ZXBwZXIsIHNlZWQpIHtcbiAgcmV0dXJuICgwLCBfbG9vcC5sb29wKShzdGVwcGVyLCBzZWVkLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZXhwb3J0cy5zY2FuID0gX2FjY3VtdWxhdGUuc2NhbjtcbmV4cG9ydHMucmVkdWNlID0gX2FjY3VtdWxhdGUucmVkdWNlO1xuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmVhbSBjb250YWluaW5nIHN1Y2Nlc3NpdmUgcmVkdWNlIHJlc3VsdHMgb2YgYXBwbHlpbmcgZiB0b1xuICogdGhlIHByZXZpb3VzIHJlZHVjZSByZXN1bHQgYW5kIHRoZSBjdXJyZW50IHN0cmVhbSBpdGVtLlxuICogQHBhcmFtIHtmdW5jdGlvbihyZXN1bHQ6KiwgeDoqKToqfSBmIHJlZHVjZXIgZnVuY3Rpb25cbiAqIEBwYXJhbSB7Kn0gaW5pdGlhbCBpbml0aWFsIHZhbHVlXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgc3VjY2Vzc2l2ZSByZWR1Y2UgcmVzdWx0c1xuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnNjYW4gPSBmdW5jdGlvbiAoZiwgaW5pdGlhbCkge1xuICByZXR1cm4gKDAsIF9hY2N1bXVsYXRlLnNjYW4pKGYsIGluaXRpYWwsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBSZWR1Y2UgdGhlIHN0cmVhbSB0byBwcm9kdWNlIGEgc2luZ2xlIHJlc3VsdC4gIE5vdGUgdGhhdCByZWR1Y2luZyBhbiBpbmZpbml0ZVxuICogc3RyZWFtIHdpbGwgcmV0dXJuIGEgUHJvbWlzZSB0aGF0IG5ldmVyIGZ1bGZpbGxzLCBidXQgdGhhdCBtYXkgcmVqZWN0IGlmIGFuIGVycm9yXG4gKiBvY2N1cnMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHJlc3VsdDoqLCB4OiopOip9IGYgcmVkdWNlciBmdW5jdGlvblxuICogQHBhcmFtIHsqfSBpbml0aWFsIG9wdGlvbmFsIGluaXRpYWwgdmFsdWVcbiAqIEByZXR1cm5zIHtQcm9taXNlfSBwcm9taXNlIGZvciB0aGUgZmlsZSByZXN1bHQgb2YgdGhlIHJlZHVjZVxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5yZWR1Y2UgPSBmdW5jdGlvbiAoZiwgaW5pdGlhbCkge1xuICByZXR1cm4gKDAsIF9hY2N1bXVsYXRlLnJlZHVjZSkoZiwgaW5pdGlhbCwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gQnVpbGRpbmcgYW5kIGV4dGVuZGluZ1xuXG5leHBvcnRzLmNvbmNhdCA9IF9idWlsZC5jb25jYXQ7XG5leHBvcnRzLnN0YXJ0V2l0aCA9IF9idWlsZC5jb25zO1xuXG4vKipcbiAqIEBwYXJhbSB7U3RyZWFtfSB0YWlsXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGl0ZW1zIGluIHRoaXMgZm9sbG93ZWQgYnlcbiAqICBhbGwgaXRlbXMgaW4gdGFpbFxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmNvbmNhdCA9IGZ1bmN0aW9uICh0YWlsKSB7XG4gIHJldHVybiAoMCwgX2J1aWxkLmNvbmNhdCkodGhpcywgdGFpbCk7XG59O1xuXG4vKipcbiAqIEBwYXJhbSB7Kn0geCB2YWx1ZSB0byBwcmVwZW5kXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBhIG5ldyBzdHJlYW0gd2l0aCB4IHByZXBlbmRlZFxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zdGFydFdpdGggPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gKDAsIF9idWlsZC5jb25zKSh4LCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBUcmFuc2Zvcm1pbmdcblxuZXhwb3J0cy5tYXAgPSBfdHJhbnNmb3JtLm1hcDtcbmV4cG9ydHMuY29uc3RhbnQgPSBfdHJhbnNmb3JtLmNvbnN0YW50O1xuZXhwb3J0cy50YXAgPSBfdHJhbnNmb3JtLnRhcDtcbmV4cG9ydHMuYXAgPSBfYXBwbGljYXRpdmUuYXA7XG5cbi8qKlxuICogVHJhbnNmb3JtIGVhY2ggdmFsdWUgaW4gdGhlIHN0cmVhbSBieSBhcHBseWluZyBmIHRvIGVhY2hcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oKik6Kn0gZiBtYXBwaW5nIGZ1bmN0aW9uXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBpdGVtcyB0cmFuc2Zvcm1lZCBieSBmXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUubWFwID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfdHJhbnNmb3JtLm1hcCkoZiwgdGhpcyk7XG59O1xuXG4vKipcbiAqIEFzc3VtZSB0aGlzIHN0cmVhbSBjb250YWlucyBmdW5jdGlvbnMsIGFuZCBhcHBseSBlYWNoIGZ1bmN0aW9uIHRvIGVhY2ggaXRlbVxuICogaW4gdGhlIHByb3ZpZGVkIHN0cmVhbS4gIFRoaXMgZ2VuZXJhdGVzLCBpbiBlZmZlY3QsIGEgY3Jvc3MgcHJvZHVjdC5cbiAqIEBwYXJhbSB7U3RyZWFtfSB4cyBzdHJlYW0gb2YgaXRlbXMgdG8gd2hpY2hcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIHRoZSBjcm9zcyBwcm9kdWN0IG9mIGl0ZW1zXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmFwID0gZnVuY3Rpb24gKHhzKSB7XG4gIHJldHVybiAoMCwgX2FwcGxpY2F0aXZlLmFwKSh0aGlzLCB4cyk7XG59O1xuXG4vKipcbiAqIFJlcGxhY2UgZWFjaCB2YWx1ZSBpbiB0aGUgc3RyZWFtIHdpdGggeFxuICogQHBhcmFtIHsqfSB4XG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBpdGVtcyByZXBsYWNlZCB3aXRoIHhcbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuY29uc3RhbnQgPSBmdW5jdGlvbiAoeCkge1xuICByZXR1cm4gKDAsIF90cmFuc2Zvcm0uY29uc3RhbnQpKHgsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBQZXJmb3JtIGEgc2lkZSBlZmZlY3QgZm9yIGVhY2ggaXRlbSBpbiB0aGUgc3RyZWFtXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6Kn0gZiBzaWRlIGVmZmVjdCB0byBleGVjdXRlIGZvciBlYWNoIGl0ZW0uIFRoZVxuICogIHJldHVybiB2YWx1ZSB3aWxsIGJlIGRpc2NhcmRlZC5cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyB0aGUgc2FtZSBpdGVtcyBhcyB0aGlzIHN0cmVhbVxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS50YXAgPSBmdW5jdGlvbiAoZikge1xuICByZXR1cm4gKDAsIF90cmFuc2Zvcm0udGFwKShmLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBUcmFuc2R1Y2VyIHN1cHBvcnRcblxuZXhwb3J0cy50cmFuc2R1Y2UgPSBfdHJhbnNkdWNlLnRyYW5zZHVjZTtcblxuLyoqXG4gKiBUcmFuc2Zvcm0gdGhpcyBzdHJlYW0gYnkgcGFzc2luZyBpdHMgZXZlbnRzIHRocm91Z2ggYSB0cmFuc2R1Y2VyLlxuICogQHBhcmFtICB7ZnVuY3Rpb259IHRyYW5zZHVjZXIgdHJhbnNkdWNlciBmdW5jdGlvblxuICogQHJldHVybiB7U3RyZWFtfSBzdHJlYW0gb2YgZXZlbnRzIHRyYW5zZm9ybWVkIGJ5IHRoZSB0cmFuc2R1Y2VyXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudHJhbnNkdWNlID0gZnVuY3Rpb24gKHRyYW5zZHVjZXIpIHtcbiAgcmV0dXJuICgwLCBfdHJhbnNkdWNlLnRyYW5zZHVjZSkodHJhbnNkdWNlciwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRmxhdE1hcHBpbmdcblxuLy8gQGRlcHJlY2F0ZWQgZmxhdE1hcCwgdXNlIGNoYWluIGluc3RlYWRcbmV4cG9ydHMuZmxhdE1hcCA9IF9mbGF0TWFwLmZsYXRNYXA7XG5leHBvcnRzLmNoYWluID0gX2ZsYXRNYXAuZmxhdE1hcDtcbmV4cG9ydHMuam9pbiA9IF9mbGF0TWFwLmpvaW47XG5cbi8qKlxuICogTWFwIGVhY2ggdmFsdWUgaW4gdGhlIHN0cmVhbSB0byBhIG5ldyBzdHJlYW0sIGFuZCBtZXJnZSBpdCBpbnRvIHRoZVxuICogcmV0dXJuZWQgb3V0ZXIgc3RyZWFtLiBFdmVudCBhcnJpdmFsIHRpbWVzIGFyZSBwcmVzZXJ2ZWQuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6U3RyZWFtfSBmIGNoYWluaW5nIGZ1bmN0aW9uLCBtdXN0IHJldHVybiBhIFN0cmVhbVxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIGFsbCBldmVudHMgZnJvbSBlYWNoIHN0cmVhbSByZXR1cm5lZCBieSBmXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuY2hhaW4gPSBmdW5jdGlvbiAoZikge1xuICByZXR1cm4gKDAsIF9mbGF0TWFwLmZsYXRNYXApKGYsIHRoaXMpO1xufTtcblxuLy8gQGRlcHJlY2F0ZWQgdXNlIGNoYWluIGluc3RlYWRcbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmZsYXRNYXAgPSBfU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5jaGFpbjtcblxuLyoqXG4qIE1vbmFkaWMgam9pbi4gRmxhdHRlbiBhIFN0cmVhbTxTdHJlYW08WD4+IHRvIFN0cmVhbTxYPiBieSBtZXJnaW5nIGlubmVyXG4qIHN0cmVhbXMgdG8gdGhlIG91dGVyLiBFdmVudCBhcnJpdmFsIHRpbWVzIGFyZSBwcmVzZXJ2ZWQuXG4qIEByZXR1cm5zIHtTdHJlYW08WD59IG5ldyBzdHJlYW0gY29udGFpbmluZyBhbGwgZXZlbnRzIG9mIGFsbCBpbm5lciBzdHJlYW1zXG4qL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuam9pbiA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICgwLCBfZmxhdE1hcC5qb2luKSh0aGlzKTtcbn07XG5cbi8vIEBkZXByZWNhdGVkIGZsYXRNYXBFbmQsIHVzZSBjb250aW51ZVdpdGggaW5zdGVhZFxuZXhwb3J0cy5jb250aW51ZVdpdGggPSBfY29udGludWVXaXRoLmNvbnRpbnVlV2l0aDtcbmV4cG9ydHMuZmxhdE1hcEVuZCA9IF9jb250aW51ZVdpdGguY29udGludWVXaXRoO1xuXG4vKipcbiAqIE1hcCB0aGUgZW5kIGV2ZW50IHRvIGEgbmV3IHN0cmVhbSwgYW5kIGJlZ2luIGVtaXR0aW5nIGl0cyB2YWx1ZXMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6U3RyZWFtfSBmIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgdGhlIGVuZCBldmVudCB2YWx1ZSxcbiAqIGFuZCAqbXVzdCogcmV0dXJuIGEgbmV3IFN0cmVhbSB0byBjb250aW51ZSB3aXRoLlxuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB0aGF0IGVtaXRzIGFsbCBldmVudHMgZnJvbSB0aGUgb3JpZ2luYWwgc3RyZWFtLFxuICogZm9sbG93ZWQgYnkgYWxsIGV2ZW50cyBmcm9tIHRoZSBzdHJlYW0gcmV0dXJuZWQgYnkgZi5cbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5jb250aW51ZVdpdGggPSBmdW5jdGlvbiAoZikge1xuICByZXR1cm4gKDAsIF9jb250aW51ZVdpdGguY29udGludWVXaXRoKShmLCB0aGlzKTtcbn07XG5cbi8vIEBkZXByZWNhdGVkIHVzZSBjb250aW51ZVdpdGggaW5zdGVhZFxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuZmxhdE1hcEVuZCA9IF9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmNvbnRpbnVlV2l0aDtcblxuZXhwb3J0cy5jb25jYXRNYXAgPSBfY29uY2F0TWFwLmNvbmNhdE1hcDtcblxuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5jb25jYXRNYXAgPSBmdW5jdGlvbiAoZikge1xuICByZXR1cm4gKDAsIF9jb25jYXRNYXAuY29uY2F0TWFwKShmLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBDb25jdXJyZW50IG1lcmdpbmdcblxuZXhwb3J0cy5tZXJnZUNvbmN1cnJlbnRseSA9IF9tZXJnZUNvbmN1cnJlbnRseS5tZXJnZUNvbmN1cnJlbnRseTtcblxuLyoqXG4gKiBGbGF0dGVuIGEgU3RyZWFtPFN0cmVhbTxYPj4gdG8gU3RyZWFtPFg+IGJ5IG1lcmdpbmcgaW5uZXJcbiAqIHN0cmVhbXMgdG8gdGhlIG91dGVyLCBsaW1pdGluZyB0aGUgbnVtYmVyIG9mIGlubmVyIHN0cmVhbXMgdGhhdCBtYXlcbiAqIGJlIGFjdGl2ZSBjb25jdXJyZW50bHkuXG4gKiBAcGFyYW0ge251bWJlcn0gY29uY3VycmVuY3kgYXQgbW9zdCB0aGlzIG1hbnkgaW5uZXIgc3RyZWFtcyB3aWxsIGJlXG4gKiAgYWxsb3dlZCB0byBiZSBhY3RpdmUgY29uY3VycmVudGx5LlxuICogQHJldHVybiB7U3RyZWFtPFg+fSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBvZiBhbGwgaW5uZXJcbiAqICBzdHJlYW1zLCB3aXRoIGxpbWl0ZWQgY29uY3VycmVuY3kuXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUubWVyZ2VDb25jdXJyZW50bHkgPSBmdW5jdGlvbiAoY29uY3VycmVuY3kpIHtcbiAgcmV0dXJuICgwLCBfbWVyZ2VDb25jdXJyZW50bHkubWVyZ2VDb25jdXJyZW50bHkpKGNvbmN1cnJlbmN5LCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBNZXJnaW5nXG5cbmV4cG9ydHMubWVyZ2UgPSBfbWVyZ2UubWVyZ2U7XG5leHBvcnRzLm1lcmdlQXJyYXkgPSBfbWVyZ2UubWVyZ2VBcnJheTtcblxuLyoqXG4gKiBNZXJnZSB0aGlzIHN0cmVhbSBhbmQgYWxsIHRoZSBwcm92aWRlZCBzdHJlYW1zXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBpdGVtcyBmcm9tIHRoaXMgc3RyZWFtIGFuZCBzIGluIHRpbWVcbiAqIG9yZGVyLiAgSWYgdHdvIGV2ZW50cyBhcmUgc2ltdWx0YW5lb3VzIHRoZXkgd2lsbCBiZSBtZXJnZWQgaW5cbiAqIGFyYml0cmFyeSBvcmRlci5cbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5tZXJnZSA9IGZ1bmN0aW9uICgpIC8qIC4uLnN0cmVhbXMqL3tcbiAgcmV0dXJuICgwLCBfbWVyZ2UubWVyZ2VBcnJheSkoYmFzZS5jb25zKHRoaXMsIGFyZ3VtZW50cykpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIENvbWJpbmluZ1xuXG5leHBvcnRzLmNvbWJpbmUgPSBfY29tYmluZS5jb21iaW5lO1xuZXhwb3J0cy5jb21iaW5lQXJyYXkgPSBfY29tYmluZS5jb21iaW5lQXJyYXk7XG5cbi8qKlxuICogQ29tYmluZSBsYXRlc3QgZXZlbnRzIGZyb20gYWxsIGlucHV0IHN0cmVhbXNcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oLi4uZXZlbnRzKToqfSBmIGZ1bmN0aW9uIHRvIGNvbWJpbmUgbW9zdCByZWNlbnQgZXZlbnRzXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyB0aGUgcmVzdWx0IG9mIGFwcGx5aW5nIGYgdG8gdGhlIG1vc3QgcmVjZW50XG4gKiAgZXZlbnQgb2YgZWFjaCBpbnB1dCBzdHJlYW0sIHdoZW5ldmVyIGEgbmV3IGV2ZW50IGFycml2ZXMgb24gYW55IHN0cmVhbS5cbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5jb21iaW5lID0gZnVuY3Rpb24gKGYgLyosIC4uLnN0cmVhbXMqLykge1xuICByZXR1cm4gKDAsIF9jb21iaW5lLmNvbWJpbmVBcnJheSkoZiwgYmFzZS5yZXBsYWNlKHRoaXMsIDAsIGFyZ3VtZW50cykpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFNhbXBsaW5nXG5cbmV4cG9ydHMuc2FtcGxlID0gX3NhbXBsZS5zYW1wbGU7XG5leHBvcnRzLnNhbXBsZUFycmF5ID0gX3NhbXBsZS5zYW1wbGVBcnJheTtcbmV4cG9ydHMuc2FtcGxlV2l0aCA9IF9zYW1wbGUuc2FtcGxlV2l0aDtcblxuLyoqXG4gKiBXaGVuIGFuIGV2ZW50IGFycml2ZXMgb24gc2FtcGxlciwgZW1pdCB0aGUgbGF0ZXN0IGV2ZW50IHZhbHVlIGZyb20gc3RyZWFtLlxuICogQHBhcmFtIHtTdHJlYW19IHNhbXBsZXIgc3RyZWFtIG9mIGV2ZW50cyBhdCB3aG9zZSBhcnJpdmFsIHRpbWVcbiAqICBzaWduYWwncyBsYXRlc3QgdmFsdWUgd2lsbCBiZSBwcm9wYWdhdGVkXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzYW1wbGVkIHN0cmVhbSBvZiB2YWx1ZXNcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zYW1wbGVXaXRoID0gZnVuY3Rpb24gKHNhbXBsZXIpIHtcbiAgcmV0dXJuICgwLCBfc2FtcGxlLnNhbXBsZVdpdGgpKHNhbXBsZXIsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBXaGVuIGFuIGV2ZW50IGFycml2ZXMgb24gdGhpcyBzdHJlYW0sIGVtaXQgdGhlIHJlc3VsdCBvZiBjYWxsaW5nIGYgd2l0aCB0aGUgbGF0ZXN0XG4gKiB2YWx1ZXMgb2YgYWxsIHN0cmVhbXMgYmVpbmcgc2FtcGxlZFxuICogQHBhcmFtIHtmdW5jdGlvbiguLi52YWx1ZXMpOip9IGYgZnVuY3Rpb24gdG8gYXBwbHkgdG8gZWFjaCBzZXQgb2Ygc2FtcGxlZCB2YWx1ZXNcbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBvZiBzYW1wbGVkIGFuZCB0cmFuc2Zvcm1lZCB2YWx1ZXNcbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2FtcGxlID0gZnVuY3Rpb24gKGYgLyogLi4uc3RyZWFtcyAqLykge1xuICByZXR1cm4gKDAsIF9zYW1wbGUuc2FtcGxlQXJyYXkpKGYsIHRoaXMsIGJhc2UudGFpbChhcmd1bWVudHMpKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBaaXBwaW5nXG5cbmV4cG9ydHMuemlwID0gX3ppcC56aXA7XG5leHBvcnRzLnppcEFycmF5ID0gX3ppcC56aXBBcnJheTtcblxuLyoqXG4gKiBQYWlyLXdpc2UgY29tYmluZSBpdGVtcyB3aXRoIHRob3NlIGluIHMuIEdpdmVuIDIgc3RyZWFtczpcbiAqIFsxLDIsM10gemlwV2l0aCBmIFs0LDUsNl0gLT4gW2YoMSw0KSxmKDIsNSksZigzLDYpXVxuICogTm90ZTogemlwIGNhdXNlcyBmYXN0IHN0cmVhbXMgdG8gYnVmZmVyIGFuZCB3YWl0IGZvciBzbG93IHN0cmVhbXMuXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGE6U3RyZWFtLCBiOlN0cmVhbSwgLi4uKToqfSBmIGZ1bmN0aW9uIHRvIGNvbWJpbmUgaXRlbXNcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBwYWlyc1xuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnppcCA9IGZ1bmN0aW9uIChmIC8qLCAuLi5zdHJlYW1zKi8pIHtcbiAgcmV0dXJuICgwLCBfemlwLnppcEFycmF5KShmLCBiYXNlLnJlcGxhY2UodGhpcywgMCwgYXJndW1lbnRzKSk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gU3dpdGNoaW5nXG5cbi8vIEBkZXByZWNhdGVkIHN3aXRjaCwgdXNlIHN3aXRjaExhdGVzdCBpbnN0ZWFkXG5leHBvcnRzLnN3aXRjaExhdGVzdCA9IF9zd2l0Y2guc3dpdGNoTGF0ZXN0O1xuZXhwb3J0cy5zd2l0Y2ggPSBfc3dpdGNoLnN3aXRjaExhdGVzdDtcblxuLyoqXG4gKiBHaXZlbiBhIHN0cmVhbSBvZiBzdHJlYW1zLCByZXR1cm4gYSBuZXcgc3RyZWFtIHRoYXQgYWRvcHRzIHRoZSBiZWhhdmlvclxuICogb2YgdGhlIG1vc3QgcmVjZW50IGlubmVyIHN0cmVhbS5cbiAqIEByZXR1cm5zIHtTdHJlYW19IHN3aXRjaGluZyBzdHJlYW1cbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zd2l0Y2hMYXRlc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoMCwgX3N3aXRjaC5zd2l0Y2hMYXRlc3QpKHRoaXMpO1xufTtcblxuLy8gQGRlcHJlY2F0ZWQgdXNlIHN3aXRjaExhdGVzdCBpbnN0ZWFkXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zd2l0Y2ggPSBfU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zd2l0Y2hMYXRlc3Q7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBGaWx0ZXJpbmdcblxuLy8gQGRlcHJlY2F0ZWQgZGlzdGluY3QsIHVzZSBza2lwUmVwZWF0cyBpbnN0ZWFkXG4vLyBAZGVwcmVjYXRlZCBkaXN0aW5jdEJ5LCB1c2Ugc2tpcFJlcGVhdHNXaXRoIGluc3RlYWRcbmV4cG9ydHMuZmlsdGVyID0gX2ZpbHRlci5maWx0ZXI7XG5leHBvcnRzLnNraXBSZXBlYXRzID0gX2ZpbHRlci5za2lwUmVwZWF0cztcbmV4cG9ydHMuZGlzdGluY3QgPSBfZmlsdGVyLnNraXBSZXBlYXRzO1xuZXhwb3J0cy5za2lwUmVwZWF0c1dpdGggPSBfZmlsdGVyLnNraXBSZXBlYXRzV2l0aDtcbmV4cG9ydHMuZGlzdGluY3RCeSA9IF9maWx0ZXIuc2tpcFJlcGVhdHNXaXRoO1xuXG4vKipcbiAqIFJldGFpbiBvbmx5IGl0ZW1zIG1hdGNoaW5nIGEgcHJlZGljYXRlXG4gKiBzdHJlYW06ICAgICAgICAgICAgICAgICAgICAgICAgICAgLTEyMzQ1Njc4LVxuICogZmlsdGVyKHggPT4geCAlIDIgPT09IDAsIHN0cmVhbSk6IC0tMi00LTYtOC1cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKTpib29sZWFufSBwIGZpbHRlcmluZyBwcmVkaWNhdGUgY2FsbGVkIGZvciBlYWNoIGl0ZW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSBjb250YWluaW5nIG9ubHkgaXRlbXMgZm9yIHdoaWNoIHByZWRpY2F0ZSByZXR1cm5zIHRydXRoeVxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmZpbHRlciA9IGZ1bmN0aW9uIChwKSB7XG4gIHJldHVybiAoMCwgX2ZpbHRlci5maWx0ZXIpKHAsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBTa2lwIHJlcGVhdGVkIGV2ZW50cywgdXNpbmcgPT09IHRvIGNvbXBhcmUgaXRlbXNcbiAqIHN0cmVhbTogICAgICAgICAgIC1hYmJjZC1cbiAqIGRpc3RpbmN0KHN0cmVhbSk6IC1hYi1jZC1cbiAqIEByZXR1cm5zIHtTdHJlYW19IHN0cmVhbSB3aXRoIG5vIHJlcGVhdGVkIGV2ZW50c1xuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5za2lwUmVwZWF0cyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICgwLCBfZmlsdGVyLnNraXBSZXBlYXRzKSh0aGlzKTtcbn07XG5cbi8qKlxuICogU2tpcCByZXBlYXRlZCBldmVudHMsIHVzaW5nIHN1cHBsaWVkIGVxdWFscyBmdW5jdGlvbiB0byBjb21wYXJlIGl0ZW1zXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKGE6KiwgYjoqKTpib29sZWFufSBlcXVhbHMgZnVuY3Rpb24gdG8gY29tcGFyZSBpdGVtc1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIHdpdGggbm8gcmVwZWF0ZWQgZXZlbnRzXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnNraXBSZXBlYXRzV2l0aCA9IGZ1bmN0aW9uIChlcXVhbHMpIHtcbiAgcmV0dXJuICgwLCBfZmlsdGVyLnNraXBSZXBlYXRzV2l0aCkoZXF1YWxzLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBTbGljaW5nXG5cbmV4cG9ydHMudGFrZSA9IF9zbGljZS50YWtlO1xuZXhwb3J0cy5za2lwID0gX3NsaWNlLnNraXA7XG5leHBvcnRzLnNsaWNlID0gX3NsaWNlLnNsaWNlO1xuZXhwb3J0cy50YWtlV2hpbGUgPSBfc2xpY2UudGFrZVdoaWxlO1xuZXhwb3J0cy5za2lwV2hpbGUgPSBfc2xpY2Uuc2tpcFdoaWxlO1xuXG4vKipcbiAqIHN0cmVhbTogICAgICAgICAgLWFiY2QtXG4gKiB0YWtlKDIsIHN0cmVhbSk6IC1hYnxcbiAqIEBwYXJhbSB7TnVtYmVyfSBuIHRha2UgdXAgdG8gdGhpcyBtYW55IGV2ZW50c1xuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgYXQgbW9zdCB0aGUgZmlyc3QgbiBpdGVtcyBmcm9tIHRoaXMgc3RyZWFtXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGFrZSA9IGZ1bmN0aW9uIChuKSB7XG4gIHJldHVybiAoMCwgX3NsaWNlLnRha2UpKG4sIHRoaXMpO1xufTtcblxuLyoqXG4gKiBzdHJlYW06ICAgICAgICAgIC1hYmNkLT5cbiAqIHNraXAoMiwgc3RyZWFtKTogLS0tY2QtPlxuICogQHBhcmFtIHtOdW1iZXJ9IG4gc2tpcCB0aGlzIG1hbnkgZXZlbnRzXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gbm90IGNvbnRhaW5pbmcgdGhlIGZpcnN0IG4gZXZlbnRzXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnNraXAgPSBmdW5jdGlvbiAobikge1xuICByZXR1cm4gKDAsIF9zbGljZS5za2lwKShuLCB0aGlzKTtcbn07XG5cbi8qKlxuICogU2xpY2UgYSBzdHJlYW0gYnkgZXZlbnQgaW5kZXguIEVxdWl2YWxlbnQgdG8sIGJ1dCBtb3JlIGVmZmljaWVudCB0aGFuXG4gKiBzdHJlYW0udGFrZShlbmQpLnNraXAoc3RhcnQpO1xuICogTk9URTogTmVnYXRpdmUgc3RhcnQgYW5kIGVuZCBhcmUgbm90IHN1cHBvcnRlZFxuICogQHBhcmFtIHtOdW1iZXJ9IHN0YXJ0IHNraXAgYWxsIGV2ZW50cyBiZWZvcmUgdGhlIHN0YXJ0IGluZGV4XG4gKiBAcGFyYW0ge051bWJlcn0gZW5kIGFsbG93IGFsbCBldmVudHMgZnJvbSB0aGUgc3RhcnQgaW5kZXggdG8gdGhlIGVuZCBpbmRleFxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgd2hlcmUgc3RhcnQgPD0gaW5kZXggPCBlbmRcbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuc2xpY2UgPSBmdW5jdGlvbiAoc3RhcnQsIGVuZCkge1xuICByZXR1cm4gKDAsIF9zbGljZS5zbGljZSkoc3RhcnQsIGVuZCwgdGhpcyk7XG59O1xuXG4vKipcbiAqIHN0cmVhbTogICAgICAgICAgICAgICAgICAgICAgICAtMTIzNDUxMjM0LT5cbiAqIHRha2VXaGlsZSh4ID0+IHggPCA1LCBzdHJlYW0pOiAtMTIzNHxcbiAqIEBwYXJhbSB7ZnVuY3Rpb24oeDoqKTpib29sZWFufSBwIHByZWRpY2F0ZVxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgaXRlbXMgdXAgdG8sIGJ1dCBub3QgaW5jbHVkaW5nLCB0aGVcbiAqIGZpcnN0IGl0ZW0gZm9yIHdoaWNoIHAgcmV0dXJucyBmYWxzeS5cbiAqL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGFrZVdoaWxlID0gZnVuY3Rpb24gKHApIHtcbiAgcmV0dXJuICgwLCBfc2xpY2UudGFrZVdoaWxlKShwLCB0aGlzKTtcbn07XG5cbi8qKlxuICogc3RyZWFtOiAgICAgICAgICAgICAgICAgICAgICAgIC0xMjM0NTEyMzQtPlxuICogc2tpcFdoaWxlKHggPT4geCA8IDUsIHN0cmVhbSk6IC0tLS0tNTEyMzQtPlxuICogQHBhcmFtIHtmdW5jdGlvbih4OiopOmJvb2xlYW59IHAgcHJlZGljYXRlXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBzdHJlYW0gY29udGFpbmluZyBpdGVtcyBmb2xsb3dpbmcgKmFuZCBpbmNsdWRpbmcqIHRoZVxuICogZmlyc3QgaXRlbSBmb3Igd2hpY2ggcCByZXR1cm5zIGZhbHN5LlxuICovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5za2lwV2hpbGUgPSBmdW5jdGlvbiAocCkge1xuICByZXR1cm4gKDAsIF9zbGljZS5za2lwV2hpbGUpKHAsIHRoaXMpO1xufTtcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbi8vIFRpbWUgc2xpY2luZ1xuXG4vLyBAZGVwcmVjYXRlZCB0YWtlVW50aWwsIHVzZSB1bnRpbCBpbnN0ZWFkXG4vLyBAZGVwcmVjYXRlZCBza2lwVW50aWwsIHVzZSBzaW5jZSBpbnN0ZWFkXG5leHBvcnRzLnRha2VVbnRpbCA9IF90aW1lc2xpY2UudGFrZVVudGlsO1xuZXhwb3J0cy51bnRpbCA9IF90aW1lc2xpY2UudGFrZVVudGlsO1xuZXhwb3J0cy5za2lwVW50aWwgPSBfdGltZXNsaWNlLnNraXBVbnRpbDtcbmV4cG9ydHMuc2luY2UgPSBfdGltZXNsaWNlLnNraXBVbnRpbDtcbmV4cG9ydHMuZHVyaW5nID0gX3RpbWVzbGljZS5kdXJpbmc7XG5cbi8qKlxuICogc3RyZWFtOiAgICAgICAgICAgICAgICAgICAgLWEtYi1jLWQtZS1mLWctPlxuICogc2lnbmFsOiAgICAgICAgICAgICAgICAgICAgLS0tLS0tLXhcbiAqIHRha2VVbnRpbChzaWduYWwsIHN0cmVhbSk6IC1hLWItYy18XG4gKiBAcGFyYW0ge1N0cmVhbX0gc2lnbmFsIHJldGFpbiBvbmx5IGV2ZW50cyBpbiBzdHJlYW0gYmVmb3JlIHRoZSBmaXJzdFxuICogZXZlbnQgaW4gc2lnbmFsXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIGNvbnRhaW5pbmcgb25seSBldmVudHMgdGhhdCBvY2N1ciBiZWZvcmVcbiAqIHRoZSBmaXJzdCBldmVudCBpbiBzaWduYWwuXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudW50aWwgPSBmdW5jdGlvbiAoc2lnbmFsKSB7XG4gIHJldHVybiAoMCwgX3RpbWVzbGljZS50YWtlVW50aWwpKHNpZ25hbCwgdGhpcyk7XG59O1xuXG4vLyBAZGVwcmVjYXRlZCB1c2UgdW50aWwgaW5zdGVhZFxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGFrZVVudGlsID0gX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudW50aWw7XG5cbi8qKlxuKiBzdHJlYW06ICAgICAgICAgICAgICAgICAgICAtYS1iLWMtZC1lLWYtZy0+XG4qIHNpZ25hbDogICAgICAgICAgICAgICAgICAgIC0tLS0tLS14XG4qIHRha2VVbnRpbChzaWduYWwsIHN0cmVhbSk6IC0tLS0tLS1kLWUtZi1nLT5cbiogQHBhcmFtIHtTdHJlYW19IHNpZ25hbCByZXRhaW4gb25seSBldmVudHMgaW4gc3RyZWFtIGF0IG9yIGFmdGVyIHRoZSBmaXJzdFxuKiBldmVudCBpbiBzaWduYWxcbiogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSBjb250YWluaW5nIG9ubHkgZXZlbnRzIHRoYXQgb2NjdXIgYWZ0ZXJcbiogdGhlIGZpcnN0IGV2ZW50IGluIHNpZ25hbC5cbiovXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zaW5jZSA9IGZ1bmN0aW9uIChzaWduYWwpIHtcbiAgcmV0dXJuICgwLCBfdGltZXNsaWNlLnNraXBVbnRpbCkoc2lnbmFsLCB0aGlzKTtcbn07XG5cbi8vIEBkZXByZWNhdGVkIHVzZSBzaW5jZSBpbnN0ZWFkXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5za2lwVW50aWwgPSBfU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5zaW5jZTtcblxuLyoqXG4qIHN0cmVhbTogICAgICAgICAgICAgICAgICAgIC1hLWItYy1kLWUtZi1nLT5cbiogdGltZVdpbmRvdzogICAgICAgICAgICAgICAgLS0tLS1zXG4qIHM6ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC0tLS0tdFxuKiBzdHJlYW0uZHVyaW5nKHRpbWVXaW5kb3cpOiAtLS0tLWMtZC1lLXxcbiogQHBhcmFtIHtTdHJlYW08U3RyZWFtPn0gdGltZVdpbmRvdyBhIHN0cmVhbSB3aG9zZSBmaXJzdCBldmVudCAocykgcmVwcmVzZW50c1xuKiAgdGhlIHdpbmRvdyBzdGFydCB0aW1lLiAgVGhhdCBldmVudCAocykgaXMgaXRzZWxmIGEgc3RyZWFtIHdob3NlIGZpcnN0IGV2ZW50ICh0KVxuKiAgcmVwcmVzZW50cyB0aGUgd2luZG93IGVuZCB0aW1lXG4qIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyBvbmx5IGV2ZW50cyB3aXRoaW4gdGhlIHByb3ZpZGVkIHRpbWVzcGFuXG4qL1xuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuZHVyaW5nID0gZnVuY3Rpb24gKHRpbWVXaW5kb3cpIHtcbiAgcmV0dXJuICgwLCBfdGltZXNsaWNlLmR1cmluZykodGltZVdpbmRvdywgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gRGVsYXlpbmdcblxuZXhwb3J0cy5kZWxheSA9IF9kZWxheS5kZWxheTtcblxuLyoqXG4gKiBAcGFyYW0ge051bWJlcn0gZGVsYXlUaW1lIG1pbGxpc2Vjb25kcyB0byBkZWxheSBlYWNoIGl0ZW1cbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBzdHJlYW0gY29udGFpbmluZyB0aGUgc2FtZSBpdGVtcywgYnV0IGRlbGF5ZWQgYnkgbXNcbiAqL1xuXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5kZWxheSA9IGZ1bmN0aW9uIChkZWxheVRpbWUpIHtcbiAgcmV0dXJuICgwLCBfZGVsYXkuZGVsYXkpKGRlbGF5VGltZSwgdGhpcyk7XG59O1xuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuLy8gR2V0dGluZyBldmVudCB0aW1lc3RhbXBcblxuZXhwb3J0cy50aW1lc3RhbXAgPSBfdGltZXN0YW1wLnRpbWVzdGFtcDtcblxuLyoqXG4gKiBFeHBvc2UgZXZlbnQgdGltZXN0YW1wcyBpbnRvIHRoZSBzdHJlYW0uIFR1cm5zIGEgU3RyZWFtPFg+IGludG9cbiAqIFN0cmVhbTx7dGltZTp0LCB2YWx1ZTpYfT5cbiAqIEByZXR1cm5zIHtTdHJlYW08e3RpbWU6bnVtYmVyLCB2YWx1ZToqfT59XG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGltZXN0YW1wID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gKDAsIF90aW1lc3RhbXAudGltZXN0YW1wKSh0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSYXRlIGxpbWl0aW5nXG5cbmV4cG9ydHMudGhyb3R0bGUgPSBfbGltaXQudGhyb3R0bGU7XG5leHBvcnRzLmRlYm91bmNlID0gX2xpbWl0LmRlYm91bmNlO1xuXG4vKipcbiAqIExpbWl0IHRoZSByYXRlIG9mIGV2ZW50c1xuICogc3RyZWFtOiAgICAgICAgICAgICAgYWJjZC0tLS1hYmNkLS0tLVxuICogdGhyb3R0bGUoMiwgc3RyZWFtKTogYS1jLS0tLS1hLWMtLS0tLVxuICogQHBhcmFtIHtOdW1iZXJ9IHBlcmlvZCB0aW1lIHRvIHN1cHByZXNzIGV2ZW50c1xuICogQHJldHVybnMge1N0cmVhbX0gbmV3IHN0cmVhbSB0aGF0IHNraXBzIGV2ZW50cyBmb3IgdGhyb3R0bGUgcGVyaW9kXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUudGhyb3R0bGUgPSBmdW5jdGlvbiAocGVyaW9kKSB7XG4gIHJldHVybiAoMCwgX2xpbWl0LnRocm90dGxlKShwZXJpb2QsIHRoaXMpO1xufTtcblxuLyoqXG4gKiBXYWl0IGZvciBhIGJ1cnN0IG9mIGV2ZW50cyB0byBzdWJzaWRlIGFuZCBlbWl0IG9ubHkgdGhlIGxhc3QgZXZlbnQgaW4gdGhlIGJ1cnN0XG4gKiBzdHJlYW06ICAgICAgICAgICAgICBhYmNkLS0tLWFiY2QtLS0tXG4gKiBkZWJvdW5jZSgyLCBzdHJlYW0pOiAtLS0tLWQtLS0tLS0tZC0tXG4gKiBAcGFyYW0ge051bWJlcn0gcGVyaW9kIGV2ZW50cyBvY2N1cmluZyBtb3JlIGZyZXF1ZW50bHkgdGhhbiB0aGlzXG4gKiAgb24gdGhlIHByb3ZpZGVkIHNjaGVkdWxlciB3aWxsIGJlIHN1cHByZXNzZWRcbiAqIEByZXR1cm5zIHtTdHJlYW19IG5ldyBkZWJvdW5jZWQgc3RyZWFtXG4gKi9cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmRlYm91bmNlID0gZnVuY3Rpb24gKHBlcmlvZCkge1xuICByZXR1cm4gKDAsIF9saW1pdC5kZWJvdW5jZSkocGVyaW9kLCB0aGlzKTtcbn07XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBBd2FpdGluZyBQcm9taXNlc1xuXG4vLyBAZGVwcmVjYXRlZCBhd2FpdCwgdXNlIGF3YWl0UHJvbWlzZXMgaW5zdGVhZFxuZXhwb3J0cy5mcm9tUHJvbWlzZSA9IF9wcm9taXNlcy5mcm9tUHJvbWlzZTtcbmV4cG9ydHMuYXdhaXRQcm9taXNlcyA9IF9wcm9taXNlcy5hd2FpdFByb21pc2VzO1xuZXhwb3J0cy5hd2FpdCA9IF9wcm9taXNlcy5hd2FpdFByb21pc2VzO1xuXG4vKipcbiAqIEF3YWl0IHByb21pc2VzLCB0dXJuaW5nIGEgU3RyZWFtPFByb21pc2U8WD4+IGludG8gU3RyZWFtPFg+LiAgUHJlc2VydmVzXG4gKiBldmVudCBvcmRlciwgYnV0IHRpbWVzaGlmdHMgZXZlbnRzIGJhc2VkIG9uIHByb21pc2UgcmVzb2x1dGlvbiB0aW1lLlxuICogQHJldHVybnMge1N0cmVhbTxYPn0gc3RyZWFtIGNvbnRhaW5pbmcgbm9uLXByb21pc2UgdmFsdWVzXG4gKi9cblxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuYXdhaXRQcm9taXNlcyA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICgwLCBfcHJvbWlzZXMuYXdhaXRQcm9taXNlcykodGhpcyk7XG59O1xuXG4vLyBAZGVwcmVjYXRlZCB1c2UgYXdhaXRQcm9taXNlcyBpbnN0ZWFkXG5fU3RyZWFtMi5kZWZhdWx0LnByb3RvdHlwZS5hd2FpdCA9IF9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLmF3YWl0UHJvbWlzZXM7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBFcnJvciBoYW5kbGluZ1xuXG4vLyBAZGVwcmVjYXRlZCBmbGF0TWFwRXJyb3IsIHVzZSByZWNvdmVyV2l0aCBpbnN0ZWFkXG5leHBvcnRzLnJlY292ZXJXaXRoID0gX2Vycm9ycy5yZWNvdmVyV2l0aDtcbmV4cG9ydHMuZmxhdE1hcEVycm9yID0gX2Vycm9ycy5mbGF0TWFwRXJyb3I7XG5leHBvcnRzLnRocm93RXJyb3IgPSBfZXJyb3JzLnRocm93RXJyb3I7XG5cbi8qKlxuICogSWYgdGhpcyBzdHJlYW0gZW5jb3VudGVycyBhbiBlcnJvciwgcmVjb3ZlciBhbmQgY29udGludWUgd2l0aCBpdGVtcyBmcm9tIHN0cmVhbVxuICogcmV0dXJuZWQgYnkgZi5cbiAqIHN0cmVhbTogICAgICAgICAgICAgICAgICAtYS1iLWMtWC1cbiAqIGYoWCk6ICAgICAgICAgICAgICAgICAgICAgICAgICAgZC1lLWYtZy1cbiAqIGZsYXRNYXBFcnJvcihmLCBzdHJlYW0pOiAtYS1iLWMtZC1lLWYtZy1cbiAqIEBwYXJhbSB7ZnVuY3Rpb24oZXJyb3I6Kik6U3RyZWFtfSBmIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSBuZXcgc3RyZWFtXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHdoaWNoIHdpbGwgcmVjb3ZlciBmcm9tIGFuIGVycm9yIGJ5IGNhbGxpbmcgZlxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLnJlY292ZXJXaXRoID0gZnVuY3Rpb24gKGYpIHtcbiAgcmV0dXJuICgwLCBfZXJyb3JzLmZsYXRNYXBFcnJvcikoZiwgdGhpcyk7XG59O1xuXG4vLyBAZGVwcmVjYXRlZCB1c2UgcmVjb3ZlcldpdGggaW5zdGVhZFxuX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUuZmxhdE1hcEVycm9yID0gX1N0cmVhbTIuZGVmYXVsdC5wcm90b3R5cGUucmVjb3ZlcldpdGg7XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBNdWx0aWNhc3RpbmdcblxuZXhwb3J0cy5tdWx0aWNhc3QgPSBfbXVsdGljYXN0Mi5kZWZhdWx0O1xuXG4vKipcbiAqIFRyYW5zZm9ybSB0aGUgc3RyZWFtIGludG8gbXVsdGljYXN0IHN0cmVhbS4gIFRoYXQgbWVhbnMgdGhhdCBtYW55IHN1YnNjcmliZXJzXG4gKiB0byB0aGUgc3RyZWFtIHdpbGwgbm90IGNhdXNlIG11bHRpcGxlIGludm9jYXRpb25zIG9mIHRoZSBpbnRlcm5hbCBtYWNoaW5lcnkuXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHdoaWNoIHdpbGwgbXVsdGljYXN0IGV2ZW50cyB0byBhbGwgb2JzZXJ2ZXJzLlxuICovXG5cbl9TdHJlYW0yLmRlZmF1bHQucHJvdG90eXBlLm11bHRpY2FzdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuICgwLCBfbXVsdGljYXN0Mi5kZWZhdWx0KSh0aGlzKTtcbn07XG5cbi8vIGV4cG9ydCB0aGUgaW5zdGFuY2Ugb2YgdGhlIGRlZmF1bHRTY2hlZHVsZXIgZm9yIHRoaXJkLXBhcnR5IGxpYnJhcmllc1xuZXhwb3J0cy5kZWZhdWx0U2NoZWR1bGVyID0gX2RlZmF1bHRTY2hlZHVsZXIyLmRlZmF1bHQ7XG5cbi8vIGV4cG9ydCBhbiBpbXBsZW1lbnRhdGlvbiBvZiBUYXNrIHVzZWQgaW50ZXJuYWxseSBmb3IgdGhpcmQtcGFydHkgbGlicmFyaWVzXG5cbmV4cG9ydHMuUHJvcGFnYXRlVGFzayA9IF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gaW52b2tlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIGludm9rZShmLCBhcmdzKSB7XG4gIC8qZXNsaW50IGNvbXBsZXhpdHk6IFsyLDddKi9cbiAgc3dpdGNoIChhcmdzLmxlbmd0aCkge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBmKCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGYoYXJnc1swXSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIGYoYXJnc1swXSwgYXJnc1sxXSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIGYoYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSk7XG4gICAgY2FzZSA0OlxuICAgICAgcmV0dXJuIGYoYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSwgYXJnc1szXSk7XG4gICAgY2FzZSA1OlxuICAgICAgcmV0dXJuIGYoYXJnc1swXSwgYXJnc1sxXSwgYXJnc1syXSwgYXJnc1szXSwgYXJnc1s0XSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBmLmFwcGx5KHZvaWQgMCwgYXJncyk7XG4gIH1cbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmlzSXRlcmFibGUgPSBpc0l0ZXJhYmxlO1xuZXhwb3J0cy5nZXRJdGVyYXRvciA9IGdldEl0ZXJhdG9yO1xuZXhwb3J0cy5tYWtlSXRlcmFibGUgPSBtYWtlSXRlcmFibGU7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuLypnbG9iYWwgU2V0LCBTeW1ib2wqL1xudmFyIGl0ZXJhdG9yU3ltYm9sO1xuLy8gRmlyZWZveCBzaGlwcyBhIHBhcnRpYWwgaW1wbGVtZW50YXRpb24gdXNpbmcgdGhlIG5hbWUgQEBpdGVyYXRvci5cbi8vIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTkwNzA3NyNjMTRcbmlmICh0eXBlb2YgU2V0ID09PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBuZXcgU2V0KClbJ0BAaXRlcmF0b3InXSA9PT0gJ2Z1bmN0aW9uJykge1xuICBpdGVyYXRvclN5bWJvbCA9ICdAQGl0ZXJhdG9yJztcbn0gZWxzZSB7XG4gIGl0ZXJhdG9yU3ltYm9sID0gdHlwZW9mIFN5bWJvbCA9PT0gJ2Z1bmN0aW9uJyAmJiBTeW1ib2wuaXRlcmF0b3IgfHwgJ19lczZzaGltX2l0ZXJhdG9yXyc7XG59XG5cbmZ1bmN0aW9uIGlzSXRlcmFibGUobykge1xuICByZXR1cm4gdHlwZW9mIG9baXRlcmF0b3JTeW1ib2xdID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBnZXRJdGVyYXRvcihvKSB7XG4gIHJldHVybiBvW2l0ZXJhdG9yU3ltYm9sXSgpO1xufVxuXG5mdW5jdGlvbiBtYWtlSXRlcmFibGUoZiwgbykge1xuICBvW2l0ZXJhdG9yU3ltYm9sXSA9IGY7XG4gIHJldHVybiBvO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZnJvbU9ic2VydmFibGUgPSBmcm9tT2JzZXJ2YWJsZTtcbmV4cG9ydHMuT2JzZXJ2YWJsZVNvdXJjZSA9IE9ic2VydmFibGVTb3VyY2U7XG5leHBvcnRzLlN1YnNjcmliZXJTaW5rID0gU3Vic2NyaWJlclNpbms7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBmcm9tT2JzZXJ2YWJsZShvYnNlcnZhYmxlKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgT2JzZXJ2YWJsZVNvdXJjZShvYnNlcnZhYmxlKSk7XG59XG5cbmZ1bmN0aW9uIE9ic2VydmFibGVTb3VyY2Uob2JzZXJ2YWJsZSkge1xuICB0aGlzLm9ic2VydmFibGUgPSBvYnNlcnZhYmxlO1xufVxuXG5PYnNlcnZhYmxlU291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHZhciBzdWIgPSB0aGlzLm9ic2VydmFibGUuc3Vic2NyaWJlKG5ldyBTdWJzY3JpYmVyU2luayhzaW5rLCBzY2hlZHVsZXIpKTtcbiAgaWYgKHR5cGVvZiBzdWIgPT09ICdmdW5jdGlvbicpIHtcbiAgICByZXR1cm4gZGlzcG9zZS5jcmVhdGUoc3ViKTtcbiAgfSBlbHNlIGlmIChzdWIgJiYgdHlwZW9mIHN1Yi51bnN1YnNjcmliZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHJldHVybiBkaXNwb3NlLmNyZWF0ZSh1bnN1YnNjcmliZSwgc3ViKTtcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ09ic2VydmFibGUgcmV0dXJuZWQgaW52YWxpZCBzdWJzY3JpcHRpb24gJyArIFN0cmluZyhzdWIpKTtcbn07XG5cbmZ1bmN0aW9uIFN1YnNjcmliZXJTaW5rKHNpbmssIHNjaGVkdWxlcikge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLnNjaGVkdWxlciA9IHNjaGVkdWxlcjtcbn1cblxuU3Vic2NyaWJlclNpbmsucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoeCkge1xuICB0aGlzLnNpbmsuZXZlbnQodGhpcy5zY2hlZHVsZXIubm93KCksIHgpO1xufTtcblxuU3Vic2NyaWJlclNpbmsucHJvdG90eXBlLmNvbXBsZXRlID0gZnVuY3Rpb24gKHgpIHtcbiAgdGhpcy5zaW5rLmVuZCh0aGlzLnNjaGVkdWxlci5ub3coKSwgeCk7XG59O1xuXG5TdWJzY3JpYmVyU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICB0aGlzLnNpbmsuZXJyb3IodGhpcy5zY2hlZHVsZXIubm93KCksIGUpO1xufTtcblxuZnVuY3Rpb24gdW5zdWJzY3JpYmUoc3Vic2NyaXB0aW9uKSB7XG4gIHJldHVybiBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUoKTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBnZXRPYnNlcnZhYmxlO1xuXG52YXIgX3N5bWJvbE9ic2VydmFibGUgPSByZXF1aXJlKCdzeW1ib2wtb2JzZXJ2YWJsZScpO1xuXG52YXIgX3N5bWJvbE9ic2VydmFibGUyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfc3ltYm9sT2JzZXJ2YWJsZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIGdldE9ic2VydmFibGUobykge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbXBsZXhpdHlcbiAgdmFyIG9icyA9IG51bGw7XG4gIGlmIChvKSB7XG4gICAgLy8gQWNjZXNzIGZvcmVpZ24gbWV0aG9kIG9ubHkgb25jZVxuICAgIHZhciBtZXRob2QgPSBvW19zeW1ib2xPYnNlcnZhYmxlMi5kZWZhdWx0XTtcbiAgICBpZiAodHlwZW9mIG1ldGhvZCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgb2JzID0gbWV0aG9kLmNhbGwobyk7XG4gICAgICBpZiAoIShvYnMgJiYgdHlwZW9mIG9icy5zdWJzY3JpYmUgPT09ICdmdW5jdGlvbicpKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ludmFsaWQgb2JzZXJ2YWJsZSAnICsgb2JzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gb2JzO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnN1YnNjcmliZSA9IHN1YnNjcmliZTtcbmV4cG9ydHMuU3Vic2NyaWJlT2JzZXJ2ZXIgPSBTdWJzY3JpYmVPYnNlcnZlcjtcbmV4cG9ydHMuU3Vic2NyaXB0aW9uID0gU3Vic2NyaXB0aW9uO1xuXG52YXIgX2RlZmF1bHRTY2hlZHVsZXIgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvZGVmYXVsdFNjaGVkdWxlcicpO1xuXG52YXIgX2RlZmF1bHRTY2hlZHVsZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZGVmYXVsdFNjaGVkdWxlcik7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF9mYXRhbEVycm9yID0gcmVxdWlyZSgnLi4vZmF0YWxFcnJvcicpO1xuXG52YXIgX2ZhdGFsRXJyb3IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZmF0YWxFcnJvcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBzdWJzY3JpYmUoc3Vic2NyaWJlciwgc3RyZWFtKSB7XG4gIGlmIChzdWJzY3JpYmVyID09IG51bGwgfHwgdHlwZW9mIHN1YnNjcmliZXIgIT09ICdvYmplY3QnKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignc3Vic2NyaWJlciBtdXN0IGJlIGFuIG9iamVjdCcpO1xuICB9XG5cbiAgdmFyIGRpc3Bvc2FibGUgPSBkaXNwb3NlLnNldHRhYmxlKCk7XG4gIHZhciBvYnNlcnZlciA9IG5ldyBTdWJzY3JpYmVPYnNlcnZlcihfZmF0YWxFcnJvcjIuZGVmYXVsdCwgc3Vic2NyaWJlciwgZGlzcG9zYWJsZSk7XG5cbiAgZGlzcG9zYWJsZS5zZXREaXNwb3NhYmxlKHN0cmVhbS5zb3VyY2UucnVuKG9ic2VydmVyLCBfZGVmYXVsdFNjaGVkdWxlcjIuZGVmYXVsdCkpO1xuXG4gIHJldHVybiBuZXcgU3Vic2NyaXB0aW9uKGRpc3Bvc2FibGUpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gU3Vic2NyaWJlT2JzZXJ2ZXIoZmF0YWxFcnJvciwgc3Vic2NyaWJlciwgZGlzcG9zYWJsZSkge1xuICB0aGlzLmZhdGFsRXJyb3IgPSBmYXRhbEVycm9yO1xuICB0aGlzLnN1YnNjcmliZXIgPSBzdWJzY3JpYmVyO1xuICB0aGlzLmRpc3Bvc2FibGUgPSBkaXNwb3NhYmxlO1xufVxuXG5TdWJzY3JpYmVPYnNlcnZlci5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuZGlzcG9zYWJsZS5kaXNwb3NlZCAmJiB0eXBlb2YgdGhpcy5zdWJzY3JpYmVyLm5leHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICB0aGlzLnN1YnNjcmliZXIubmV4dCh4KTtcbiAgfVxufTtcblxuU3Vic2NyaWJlT2JzZXJ2ZXIucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5kaXNwb3NhYmxlLmRpc3Bvc2VkKSB7XG4gICAgdmFyIHMgPSB0aGlzLnN1YnNjcmliZXI7XG4gICAgZG9EaXNwb3NlKHRoaXMuZmF0YWxFcnJvciwgcywgcy5jb21wbGV0ZSwgcy5lcnJvciwgdGhpcy5kaXNwb3NhYmxlLCB4KTtcbiAgfVxufTtcblxuU3Vic2NyaWJlT2JzZXJ2ZXIucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKHQsIGUpIHtcbiAgdmFyIHMgPSB0aGlzLnN1YnNjcmliZXI7XG4gIGRvRGlzcG9zZSh0aGlzLmZhdGFsRXJyb3IsIHMsIHMuZXJyb3IsIHMuZXJyb3IsIHRoaXMuZGlzcG9zYWJsZSwgZSk7XG59O1xuXG5mdW5jdGlvbiBTdWJzY3JpcHRpb24oZGlzcG9zYWJsZSkge1xuICB0aGlzLmRpc3Bvc2FibGUgPSBkaXNwb3NhYmxlO1xufVxuXG5TdWJzY3JpcHRpb24ucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmRpc3Bvc2FibGUuZGlzcG9zZSgpO1xufTtcblxuZnVuY3Rpb24gZG9EaXNwb3NlKGZhdGFsLCBzdWJzY3JpYmVyLCBjb21wbGV0ZSwgZXJyb3IsIGRpc3Bvc2FibGUsIHgpIHtcbiAgUHJvbWlzZS5yZXNvbHZlKGRpc3Bvc2FibGUuZGlzcG9zZSgpKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICBpZiAodHlwZW9mIGNvbXBsZXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBjb21wbGV0ZS5jYWxsKHN1YnNjcmliZXIsIHgpO1xuICAgIH1cbiAgfSkuY2F0Y2goZnVuY3Rpb24gKGUpIHtcbiAgICBpZiAodHlwZW9mIGVycm9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICBlcnJvci5jYWxsKHN1YnNjcmliZXIsIGUpO1xuICAgIH1cbiAgfSkuY2F0Y2goZmF0YWwpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMud2l0aERlZmF1bHRTY2hlZHVsZXIgPSB3aXRoRGVmYXVsdFNjaGVkdWxlcjtcbmV4cG9ydHMud2l0aFNjaGVkdWxlciA9IHdpdGhTY2hlZHVsZXI7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4vZGlzcG9zYWJsZS9kaXNwb3NlJyk7XG5cbnZhciBkaXNwb3NlID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX2Rpc3Bvc2UpO1xuXG52YXIgX2RlZmF1bHRTY2hlZHVsZXIgPSByZXF1aXJlKCcuL3NjaGVkdWxlci9kZWZhdWx0U2NoZWR1bGVyJyk7XG5cbnZhciBfZGVmYXVsdFNjaGVkdWxlcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9kZWZhdWx0U2NoZWR1bGVyKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiB3aXRoRGVmYXVsdFNjaGVkdWxlcihzb3VyY2UpIHtcbiAgcmV0dXJuIHdpdGhTY2hlZHVsZXIoc291cmNlLCBfZGVmYXVsdFNjaGVkdWxlcjIuZGVmYXVsdCk7XG59XG5cbmZ1bmN0aW9uIHdpdGhTY2hlZHVsZXIoc291cmNlLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICBydW5Tb3VyY2Uoc291cmNlLCBzY2hlZHVsZXIsIHJlc29sdmUsIHJlamVjdCk7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBydW5Tb3VyY2Uoc291cmNlLCBzY2hlZHVsZXIsIHJlc29sdmUsIHJlamVjdCkge1xuICB2YXIgZGlzcG9zYWJsZSA9IGRpc3Bvc2Uuc2V0dGFibGUoKTtcbiAgdmFyIG9ic2VydmVyID0gbmV3IERyYWluKHJlc29sdmUsIHJlamVjdCwgZGlzcG9zYWJsZSk7XG5cbiAgZGlzcG9zYWJsZS5zZXREaXNwb3NhYmxlKHNvdXJjZS5ydW4ob2JzZXJ2ZXIsIHNjaGVkdWxlcikpO1xufVxuXG5mdW5jdGlvbiBEcmFpbihlbmQsIGVycm9yLCBkaXNwb3NhYmxlKSB7XG4gIHRoaXMuX2VuZCA9IGVuZDtcbiAgdGhpcy5fZXJyb3IgPSBlcnJvcjtcbiAgdGhpcy5fZGlzcG9zYWJsZSA9IGRpc3Bvc2FibGU7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbn1cblxuRHJhaW4ucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHt9O1xuXG5EcmFpbi5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xuICBkaXNwb3NlVGhlbih0aGlzLl9lbmQsIHRoaXMuX2Vycm9yLCB0aGlzLl9kaXNwb3NhYmxlLCB4KTtcbn07XG5cbkRyYWluLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIGRpc3Bvc2VUaGVuKHRoaXMuX2Vycm9yLCB0aGlzLl9lcnJvciwgdGhpcy5fZGlzcG9zYWJsZSwgZSk7XG59O1xuXG5mdW5jdGlvbiBkaXNwb3NlVGhlbihlbmQsIGVycm9yLCBkaXNwb3NhYmxlLCB4KSB7XG4gIFByb21pc2UucmVzb2x2ZShkaXNwb3NhYmxlLmRpc3Bvc2UoKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgZW5kKHgpO1xuICB9LCBlcnJvcik7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gQ2xvY2tUaW1lcjtcblxudmFyIF90YXNrID0gcmVxdWlyZSgnLi4vdGFzaycpO1xuXG4vKmdsb2JhbCBzZXRUaW1lb3V0LCBjbGVhclRpbWVvdXQqL1xuXG5mdW5jdGlvbiBDbG9ja1RpbWVyKCkge30gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbkNsb2NrVGltZXIucHJvdG90eXBlLm5vdyA9IERhdGUubm93O1xuXG5DbG9ja1RpbWVyLnByb3RvdHlwZS5zZXRUaW1lciA9IGZ1bmN0aW9uIChmLCBkdCkge1xuICByZXR1cm4gZHQgPD0gMCA/IHJ1bkFzYXAoZikgOiBzZXRUaW1lb3V0KGYsIGR0KTtcbn07XG5cbkNsb2NrVGltZXIucHJvdG90eXBlLmNsZWFyVGltZXIgPSBmdW5jdGlvbiAodCkge1xuICByZXR1cm4gdCBpbnN0YW5jZW9mIEFzYXAgPyB0LmNhbmNlbCgpIDogY2xlYXJUaW1lb3V0KHQpO1xufTtcblxuZnVuY3Rpb24gQXNhcChmKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbn1cblxuQXNhcC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5hY3RpdmUgJiYgdGhpcy5mKCk7XG59O1xuXG5Bc2FwLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gIHRocm93IGU7XG59O1xuXG5Bc2FwLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG59O1xuXG5mdW5jdGlvbiBydW5Bc2FwKGYpIHtcbiAgdmFyIHRhc2sgPSBuZXcgQXNhcChmKTtcbiAgKDAsIF90YXNrLmRlZmVyKSh0YXNrKTtcbiAgcmV0dXJuIHRhc2s7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gUHJvcGFnYXRlVGFzaztcblxudmFyIF9mYXRhbEVycm9yID0gcmVxdWlyZSgnLi4vZmF0YWxFcnJvcicpO1xuXG52YXIgX2ZhdGFsRXJyb3IyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfZmF0YWxFcnJvcik7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIFByb3BhZ2F0ZVRhc2socnVuLCB2YWx1ZSwgc2luaykge1xuICB0aGlzLl9ydW4gPSBydW47XG4gIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5hY3RpdmUgPSB0cnVlO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuUHJvcGFnYXRlVGFzay5ldmVudCA9IGZ1bmN0aW9uICh2YWx1ZSwgc2luaykge1xuICByZXR1cm4gbmV3IFByb3BhZ2F0ZVRhc2soZW1pdCwgdmFsdWUsIHNpbmspO1xufTtcblxuUHJvcGFnYXRlVGFzay5lbmQgPSBmdW5jdGlvbiAodmFsdWUsIHNpbmspIHtcbiAgcmV0dXJuIG5ldyBQcm9wYWdhdGVUYXNrKGVuZCwgdmFsdWUsIHNpbmspO1xufTtcblxuUHJvcGFnYXRlVGFzay5lcnJvciA9IGZ1bmN0aW9uICh2YWx1ZSwgc2luaykge1xuICByZXR1cm4gbmV3IFByb3BhZ2F0ZVRhc2soZXJyb3IsIHZhbHVlLCBzaW5rKTtcbn07XG5cblByb3BhZ2F0ZVRhc2sucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG59O1xuXG5Qcm9wYWdhdGVUYXNrLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAodCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuX3J1bih0LCB0aGlzLnZhbHVlLCB0aGlzLnNpbmspO1xufTtcblxuUHJvcGFnYXRlVGFzay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuICgwLCBfZmF0YWxFcnJvcjIuZGVmYXVsdCkoZSk7XG4gIH1cbiAgdGhpcy5zaW5rLmVycm9yKHQsIGUpO1xufTtcblxuZnVuY3Rpb24gZXJyb3IodCwgZSwgc2luaykge1xuICBzaW5rLmVycm9yKHQsIGUpO1xufVxuXG5mdW5jdGlvbiBlbWl0KHQsIHgsIHNpbmspIHtcbiAgc2luay5ldmVudCh0LCB4KTtcbn1cblxuZnVuY3Rpb24gZW5kKHQsIHgsIHNpbmspIHtcbiAgc2luay5lbmQodCwgeCk7XG59IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTY2hlZHVsZWRUYXNrO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFNjaGVkdWxlZFRhc2soZGVsYXksIHBlcmlvZCwgdGFzaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMudGltZSA9IGRlbGF5O1xuICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgdGhpcy50YXNrID0gdGFzaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbn1cblxuU2NoZWR1bGVkVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy50YXNrLnJ1bih0aGlzLnRpbWUpO1xufTtcblxuU2NoZWR1bGVkVGFzay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xuICByZXR1cm4gdGhpcy50YXNrLmVycm9yKHRoaXMudGltZSwgZSk7XG59O1xuXG5TY2hlZHVsZWRUYXNrLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLnNjaGVkdWxlci5jYW5jZWwodGhpcyk7XG4gIHJldHVybiB0aGlzLnRhc2suZGlzcG9zZSgpO1xufTsiLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBTY2hlZHVsZXI7XG5cbnZhciBfU2NoZWR1bGVkVGFzayA9IHJlcXVpcmUoJy4vU2NoZWR1bGVkVGFzaycpO1xuXG52YXIgX1NjaGVkdWxlZFRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU2NoZWR1bGVkVGFzayk7XG5cbnZhciBfdGFzayA9IHJlcXVpcmUoJy4uL3Rhc2snKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIFNjaGVkdWxlcih0aW1lciwgdGltZWxpbmUpIHtcbiAgdGhpcy50aW1lciA9IHRpbWVyO1xuICB0aGlzLnRpbWVsaW5lID0gdGltZWxpbmU7XG5cbiAgdGhpcy5fdGltZXIgPSBudWxsO1xuICB0aGlzLl9uZXh0QXJyaXZhbCA9IEluZmluaXR5O1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgdGhpcy5fcnVuUmVhZHlUYXNrc0JvdW5kID0gZnVuY3Rpb24gKCkge1xuICAgIHNlbGYuX3J1blJlYWR5VGFza3Moc2VsZi5ub3coKSk7XG4gIH07XG59XG5cblNjaGVkdWxlci5wcm90b3R5cGUubm93ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy50aW1lci5ub3coKTtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuYXNhcCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gIHJldHVybiB0aGlzLnNjaGVkdWxlKDAsIC0xLCB0YXNrKTtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuZGVsYXkgPSBmdW5jdGlvbiAoZGVsYXksIHRhc2spIHtcbiAgcmV0dXJuIHRoaXMuc2NoZWR1bGUoZGVsYXksIC0xLCB0YXNrKTtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUucGVyaW9kaWMgPSBmdW5jdGlvbiAocGVyaW9kLCB0YXNrKSB7XG4gIHJldHVybiB0aGlzLnNjaGVkdWxlKDAsIHBlcmlvZCwgdGFzayk7XG59O1xuXG5TY2hlZHVsZXIucHJvdG90eXBlLnNjaGVkdWxlID0gZnVuY3Rpb24gKGRlbGF5LCBwZXJpb2QsIHRhc2spIHtcbiAgdmFyIG5vdyA9IHRoaXMubm93KCk7XG4gIHZhciBzdCA9IG5ldyBfU2NoZWR1bGVkVGFzazIuZGVmYXVsdChub3cgKyBNYXRoLm1heCgwLCBkZWxheSksIHBlcmlvZCwgdGFzaywgdGhpcyk7XG5cbiAgdGhpcy50aW1lbGluZS5hZGQoc3QpO1xuICB0aGlzLl9zY2hlZHVsZU5leHRSdW4obm93KTtcbiAgcmV0dXJuIHN0O1xufTtcblxuU2NoZWR1bGVyLnByb3RvdHlwZS5jYW5jZWwgPSBmdW5jdGlvbiAodGFzaykge1xuICB0YXNrLmFjdGl2ZSA9IGZhbHNlO1xuICBpZiAodGhpcy50aW1lbGluZS5yZW1vdmUodGFzaykpIHtcbiAgICB0aGlzLl9yZXNjaGVkdWxlKCk7XG4gIH1cbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuY2FuY2VsQWxsID0gZnVuY3Rpb24gKGYpIHtcbiAgdGhpcy50aW1lbGluZS5yZW1vdmVBbGwoZik7XG4gIHRoaXMuX3Jlc2NoZWR1bGUoKTtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuX3Jlc2NoZWR1bGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICh0aGlzLnRpbWVsaW5lLmlzRW1wdHkoKSkge1xuICAgIHRoaXMuX3Vuc2NoZWR1bGUoKTtcbiAgfSBlbHNlIHtcbiAgICB0aGlzLl9zY2hlZHVsZU5leHRSdW4odGhpcy5ub3coKSk7XG4gIH1cbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuX3Vuc2NoZWR1bGUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMudGltZXIuY2xlYXJUaW1lcih0aGlzLl90aW1lcik7XG4gIHRoaXMuX3RpbWVyID0gbnVsbDtcbn07XG5cblNjaGVkdWxlci5wcm90b3R5cGUuX3NjaGVkdWxlTmV4dFJ1biA9IGZ1bmN0aW9uIChub3cpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIGlmICh0aGlzLnRpbWVsaW5lLmlzRW1wdHkoKSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHZhciBuZXh0QXJyaXZhbCA9IHRoaXMudGltZWxpbmUubmV4dEFycml2YWwoKTtcblxuICBpZiAodGhpcy5fdGltZXIgPT09IG51bGwpIHtcbiAgICB0aGlzLl9zY2hlZHVsZU5leHRBcnJpdmFsKG5leHRBcnJpdmFsLCBub3cpO1xuICB9IGVsc2UgaWYgKG5leHRBcnJpdmFsIDwgdGhpcy5fbmV4dEFycml2YWwpIHtcbiAgICB0aGlzLl91bnNjaGVkdWxlKCk7XG4gICAgdGhpcy5fc2NoZWR1bGVOZXh0QXJyaXZhbChuZXh0QXJyaXZhbCwgbm93KTtcbiAgfVxufTtcblxuU2NoZWR1bGVyLnByb3RvdHlwZS5fc2NoZWR1bGVOZXh0QXJyaXZhbCA9IGZ1bmN0aW9uIChuZXh0QXJyaXZhbCwgbm93KSB7XG4gIHRoaXMuX25leHRBcnJpdmFsID0gbmV4dEFycml2YWw7XG4gIHZhciBkZWxheSA9IE1hdGgubWF4KDAsIG5leHRBcnJpdmFsIC0gbm93KTtcbiAgdGhpcy5fdGltZXIgPSB0aGlzLnRpbWVyLnNldFRpbWVyKHRoaXMuX3J1blJlYWR5VGFza3NCb3VuZCwgZGVsYXkpO1xufTtcblxuU2NoZWR1bGVyLnByb3RvdHlwZS5fcnVuUmVhZHlUYXNrcyA9IGZ1bmN0aW9uIChub3cpIHtcbiAgdGhpcy5fdGltZXIgPSBudWxsO1xuICB0aGlzLnRpbWVsaW5lLnJ1blRhc2tzKG5vdywgX3Rhc2sucnVuVGFzayk7XG4gIHRoaXMuX3NjaGVkdWxlTmV4dFJ1bih0aGlzLm5vdygpKTtcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gVGltZWxpbmU7XG5cbnZhciBfcHJlbHVkZSA9IHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKTtcblxudmFyIGJhc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfcHJlbHVkZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBUaW1lbGluZSgpIHtcbiAgdGhpcy50YXNrcyA9IFtdO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuVGltZWxpbmUucHJvdG90eXBlLm5leHRBcnJpdmFsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5pc0VtcHR5KCkgPyBJbmZpbml0eSA6IHRoaXMudGFza3NbMF0udGltZTtcbn07XG5cblRpbWVsaW5lLnByb3RvdHlwZS5pc0VtcHR5ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy50YXNrcy5sZW5ndGggPT09IDA7XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKHN0KSB7XG4gIGluc2VydEJ5VGltZShzdCwgdGhpcy50YXNrcyk7XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucmVtb3ZlID0gZnVuY3Rpb24gKHN0KSB7XG4gIHZhciBpID0gYmluYXJ5U2VhcmNoKHN0LnRpbWUsIHRoaXMudGFza3MpO1xuXG4gIGlmIChpID49IDAgJiYgaSA8IHRoaXMudGFza3MubGVuZ3RoKSB7XG4gICAgdmFyIGF0ID0gYmFzZS5maW5kSW5kZXgoc3QsIHRoaXMudGFza3NbaV0uZXZlbnRzKTtcbiAgICBpZiAoYXQgPj0gMCkge1xuICAgICAgdGhpcy50YXNrc1tpXS5ldmVudHMuc3BsaWNlKGF0LCAxKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn07XG5cblRpbWVsaW5lLnByb3RvdHlwZS5yZW1vdmVBbGwgPSBmdW5jdGlvbiAoZikge1xuICB2YXIgdGhpcyQxID0gdGhpcztcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHRoaXMudGFza3MubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgcmVtb3ZlQWxsRnJvbShmLCB0aGlzJDEudGFza3NbaV0pO1xuICB9XG59O1xuXG5UaW1lbGluZS5wcm90b3R5cGUucnVuVGFza3MgPSBmdW5jdGlvbiAodCwgcnVuVGFzaykge1xuICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgdGFza3MgPSB0aGlzLnRhc2tzO1xuICB2YXIgbCA9IHRhc2tzLmxlbmd0aDtcbiAgdmFyIGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgbCAmJiB0YXNrc1tpXS50aW1lIDw9IHQpIHtcbiAgICArK2k7XG4gIH1cblxuICB0aGlzLnRhc2tzID0gdGFza3Muc2xpY2UoaSk7XG5cbiAgLy8gUnVuIGFsbCByZWFkeSB0YXNrc1xuICBmb3IgKHZhciBqID0gMDsgaiA8IGk7ICsraikge1xuICAgIHRoaXMkMS50YXNrcyA9IHJ1blRhc2tzKHJ1blRhc2ssIHRhc2tzW2pdLCB0aGlzJDEudGFza3MpO1xuICB9XG59O1xuXG5mdW5jdGlvbiBydW5UYXNrcyhydW5UYXNrLCB0aW1lc2xvdCwgdGFza3MpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIHZhciBldmVudHMgPSB0aW1lc2xvdC5ldmVudHM7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZXZlbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIHRhc2sgPSBldmVudHNbaV07XG5cbiAgICBpZiAodGFzay5hY3RpdmUpIHtcbiAgICAgIHJ1blRhc2sodGFzayk7XG5cbiAgICAgIC8vIFJlc2NoZWR1bGUgcGVyaW9kaWMgcmVwZWF0aW5nIHRhc2tzXG4gICAgICAvLyBDaGVjayBhY3RpdmUgYWdhaW4sIHNpbmNlIGEgdGFzayBtYXkgaGF2ZSBjYW5jZWxlZCBpdHNlbGZcbiAgICAgIGlmICh0YXNrLnBlcmlvZCA+PSAwICYmIHRhc2suYWN0aXZlKSB7XG4gICAgICAgIHRhc2sudGltZSA9IHRhc2sudGltZSArIHRhc2sucGVyaW9kO1xuICAgICAgICBpbnNlcnRCeVRpbWUodGFzaywgdGFza3MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0YXNrcztcbn1cblxuZnVuY3Rpb24gaW5zZXJ0QnlUaW1lKHRhc2ssIHRpbWVzbG90cykge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbXBsZXhpdHlcbiAgdmFyIGwgPSB0aW1lc2xvdHMubGVuZ3RoO1xuXG4gIGlmIChsID09PSAwKSB7XG4gICAgdGltZXNsb3RzLnB1c2gobmV3VGltZXNsb3QodGFzay50aW1lLCBbdGFza10pKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgaSA9IGJpbmFyeVNlYXJjaCh0YXNrLnRpbWUsIHRpbWVzbG90cyk7XG5cbiAgaWYgKGkgPj0gbCkge1xuICAgIHRpbWVzbG90cy5wdXNoKG5ld1RpbWVzbG90KHRhc2sudGltZSwgW3Rhc2tdKSk7XG4gIH0gZWxzZSBpZiAodGFzay50aW1lID09PSB0aW1lc2xvdHNbaV0udGltZSkge1xuICAgIHRpbWVzbG90c1tpXS5ldmVudHMucHVzaCh0YXNrKTtcbiAgfSBlbHNlIHtcbiAgICB0aW1lc2xvdHMuc3BsaWNlKGksIDAsIG5ld1RpbWVzbG90KHRhc2sudGltZSwgW3Rhc2tdKSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVtb3ZlQWxsRnJvbShmLCB0aW1lc2xvdCkge1xuICB0aW1lc2xvdC5ldmVudHMgPSBiYXNlLnJlbW92ZUFsbChmLCB0aW1lc2xvdC5ldmVudHMpO1xufVxuXG5mdW5jdGlvbiBiaW5hcnlTZWFyY2godCwgc29ydGVkQXJyYXkpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIHZhciBsbyA9IDA7XG4gIHZhciBoaSA9IHNvcnRlZEFycmF5Lmxlbmd0aDtcbiAgdmFyIG1pZCwgeTtcblxuICB3aGlsZSAobG8gPCBoaSkge1xuICAgIG1pZCA9IE1hdGguZmxvb3IoKGxvICsgaGkpIC8gMik7XG4gICAgeSA9IHNvcnRlZEFycmF5W21pZF07XG5cbiAgICBpZiAodCA9PT0geS50aW1lKSB7XG4gICAgICByZXR1cm4gbWlkO1xuICAgIH0gZWxzZSBpZiAodCA8IHkudGltZSkge1xuICAgICAgaGkgPSBtaWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxvID0gbWlkICsgMTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGhpO1xufVxuXG5mdW5jdGlvbiBuZXdUaW1lc2xvdCh0LCBldmVudHMpIHtcbiAgcmV0dXJuIHsgdGltZTogdCwgZXZlbnRzOiBldmVudHMgfTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfU2NoZWR1bGVyID0gcmVxdWlyZSgnLi9TY2hlZHVsZXInKTtcblxudmFyIF9TY2hlZHVsZXIyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU2NoZWR1bGVyKTtcblxudmFyIF9DbG9ja1RpbWVyID0gcmVxdWlyZSgnLi9DbG9ja1RpbWVyJyk7XG5cbnZhciBfQ2xvY2tUaW1lcjIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9DbG9ja1RpbWVyKTtcblxudmFyIF9UaW1lbGluZSA9IHJlcXVpcmUoJy4vVGltZWxpbmUnKTtcblxudmFyIF9UaW1lbGluZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9UaW1lbGluZSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbnZhciBkZWZhdWx0U2NoZWR1bGVyID0gbmV3IF9TY2hlZHVsZXIyLmRlZmF1bHQobmV3IF9DbG9ja1RpbWVyMi5kZWZhdWx0KCksIG5ldyBfVGltZWxpbmUyLmRlZmF1bHQoKSk7IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5leHBvcnRzLmRlZmF1bHQgPSBkZWZhdWx0U2NoZWR1bGVyOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IERlZmVycmVkU2luaztcblxudmFyIF90YXNrID0gcmVxdWlyZSgnLi4vdGFzaycpO1xuXG5mdW5jdGlvbiBEZWZlcnJlZFNpbmsoc2luaykge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmV2ZW50cyA9IFtdO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5EZWZlcnJlZFNpbmsucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh0aGlzLmV2ZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAoMCwgX3Rhc2suZGVmZXIpKG5ldyBQcm9wYWdhdGVBbGxUYXNrKHRoaXMuc2luaywgdCwgdGhpcy5ldmVudHMpKTtcbiAgfVxuXG4gIHRoaXMuZXZlbnRzLnB1c2goeyB0aW1lOiB0LCB2YWx1ZTogeCB9KTtcbn07XG5cbkRlZmVycmVkU2luay5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgaWYgKCF0aGlzLmFjdGl2ZSkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX2VuZChuZXcgRW5kVGFzayh0LCB4LCB0aGlzLnNpbmspKTtcbn07XG5cbkRlZmVycmVkU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICB0aGlzLl9lbmQobmV3IEVycm9yVGFzayh0LCBlLCB0aGlzLnNpbmspKTtcbn07XG5cbkRlZmVycmVkU2luay5wcm90b3R5cGUuX2VuZCA9IGZ1bmN0aW9uICh0YXNrKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gICgwLCBfdGFzay5kZWZlcikodGFzayk7XG59O1xuXG5mdW5jdGlvbiBQcm9wYWdhdGVBbGxUYXNrKHNpbmssIHRpbWUsIGV2ZW50cykge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmV2ZW50cyA9IGV2ZW50cztcbiAgdGhpcy50aW1lID0gdGltZTtcbn1cblxuUHJvcGFnYXRlQWxsVGFzay5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGhpcyQxID0gdGhpcztcblxuICB2YXIgZXZlbnRzID0gdGhpcy5ldmVudHM7XG4gIHZhciBzaW5rID0gdGhpcy5zaW5rO1xuICB2YXIgZXZlbnQ7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBldmVudHMubGVuZ3RoOyBpIDwgbDsgKytpKSB7XG4gICAgZXZlbnQgPSBldmVudHNbaV07XG4gICAgdGhpcyQxLnRpbWUgPSBldmVudC50aW1lO1xuICAgIHNpbmsuZXZlbnQoZXZlbnQudGltZSwgZXZlbnQudmFsdWUpO1xuICB9XG5cbiAgZXZlbnRzLmxlbmd0aCA9IDA7XG59O1xuXG5Qcm9wYWdhdGVBbGxUYXNrLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gIHRoaXMuc2luay5lcnJvcih0aGlzLnRpbWUsIGUpO1xufTtcblxuZnVuY3Rpb24gRW5kVGFzayh0LCB4LCBzaW5rKSB7XG4gIHRoaXMudGltZSA9IHQ7XG4gIHRoaXMudmFsdWUgPSB4O1xuICB0aGlzLnNpbmsgPSBzaW5rO1xufVxuXG5FbmRUYXNrLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuc2luay5lbmQodGhpcy50aW1lLCB0aGlzLnZhbHVlKTtcbn07XG5cbkVuZFRhc2sucHJvdG90eXBlLmVycm9yID0gZnVuY3Rpb24gKGUpIHtcbiAgdGhpcy5zaW5rLmVycm9yKHRoaXMudGltZSwgZSk7XG59O1xuXG5mdW5jdGlvbiBFcnJvclRhc2sodCwgZSwgc2luaykge1xuICB0aGlzLnRpbWUgPSB0O1xuICB0aGlzLnZhbHVlID0gZTtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuRXJyb3JUYXNrLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuc2luay5lcnJvcih0aGlzLnRpbWUsIHRoaXMudmFsdWUpO1xufTtcblxuRXJyb3JUYXNrLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uIChlKSB7XG4gIHRocm93IGU7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEluZGV4U2luaztcblxudmFyIF9QaXBlID0gcmVxdWlyZSgnLi9QaXBlJyk7XG5cbnZhciBfUGlwZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9QaXBlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuZnVuY3Rpb24gSW5kZXhTaW5rKGksIHNpbmspIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5pbmRleCA9IGk7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcbiAgdGhpcy52YWx1ZSA9IHZvaWQgMDtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbkluZGV4U2luay5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICBpZiAoIXRoaXMuYWN0aXZlKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMudmFsdWUgPSB4O1xuICB0aGlzLnNpbmsuZXZlbnQodCwgdGhpcyk7XG59O1xuXG5JbmRleFNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5hY3RpdmUgPSBmYWxzZTtcbiAgdGhpcy5zaW5rLmVuZCh0LCB7IGluZGV4OiB0aGlzLmluZGV4LCB2YWx1ZTogeCB9KTtcbn07XG5cbkluZGV4U2luay5wcm90b3R5cGUuZXJyb3IgPSBfUGlwZTIuZGVmYXVsdC5wcm90b3R5cGUuZXJyb3I7IiwiXCJ1c2Ugc3RyaWN0XCI7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmRlZmF1bHQgPSBQaXBlO1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbi8qKlxuICogQSBzaW5rIG1peGluIHRoYXQgc2ltcGx5IGZvcndhcmRzIGV2ZW50LCBlbmQsIGFuZCBlcnJvciB0b1xuICogYW5vdGhlciBzaW5rLlxuICogQHBhcmFtIHNpbmtcbiAqIEBjb25zdHJ1Y3RvclxuICovXG5mdW5jdGlvbiBQaXBlKHNpbmspIHtcbiAgdGhpcy5zaW5rID0gc2luaztcbn1cblxuUGlwZS5wcm90b3R5cGUuZXZlbnQgPSBmdW5jdGlvbiAodCwgeCkge1xuICByZXR1cm4gdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xufTtcblxuUGlwZS5wcm90b3R5cGUuZW5kID0gZnVuY3Rpb24gKHQsIHgpIHtcbiAgcmV0dXJuIHRoaXMuc2luay5lbmQodCwgeCk7XG59O1xuXG5QaXBlLnByb3RvdHlwZS5lcnJvciA9IGZ1bmN0aW9uICh0LCBlKSB7XG4gIHJldHVybiB0aGlzLnNpbmsuZXJyb3IodCwgZSk7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gU2FmZVNpbms7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gU2FmZVNpbmsoc2luaykge1xuICB0aGlzLnNpbmsgPSBzaW5rO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG59XG5cblNhZmVTaW5rLnByb3RvdHlwZS5ldmVudCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5zaW5rLmV2ZW50KHQsIHgpO1xufTtcblxuU2FmZVNpbmsucHJvdG90eXBlLmVuZCA9IGZ1bmN0aW9uICh0LCB4KSB7XG4gIGlmICghdGhpcy5hY3RpdmUpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgdGhpcy5kaXNhYmxlKCk7XG4gIHRoaXMuc2luay5lbmQodCwgeCk7XG59O1xuXG5TYWZlU2luay5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiAodCwgZSkge1xuICB0aGlzLmRpc2FibGUoKTtcbiAgdGhpcy5zaW5rLmVycm9yKHQsIGUpO1xufTtcblxuU2FmZVNpbmsucHJvdG90eXBlLmRpc2FibGUgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG4gIHJldHVybiB0aGlzLnNpbms7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmYXVsdCA9IEV2ZW50RW1pdHRlclNvdXJjZTtcblxudmFyIF9EZWZlcnJlZFNpbmsgPSByZXF1aXJlKCcuLi9zaW5rL0RlZmVycmVkU2luaycpO1xuXG52YXIgX0RlZmVycmVkU2luazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9EZWZlcnJlZFNpbmspO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfdHJ5RXZlbnQgPSByZXF1aXJlKCcuL3RyeUV2ZW50Jyk7XG5cbnZhciB0cnlFdmVudCA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF90cnlFdmVudCk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKG9iaikgeyBpZiAob2JqICYmIG9iai5fX2VzTW9kdWxlKSB7IHJldHVybiBvYmo7IH0gZWxzZSB7IHZhciBuZXdPYmogPSB7fTsgaWYgKG9iaiAhPSBudWxsKSB7IGZvciAodmFyIGtleSBpbiBvYmopIHsgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIGtleSkpIHsgbmV3T2JqW2tleV0gPSBvYmpba2V5XTsgfSB9IH0gbmV3T2JqLmRlZmF1bHQgPSBvYmo7IHJldHVybiBuZXdPYmo7IH0gfVxuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXJTb3VyY2UoZXZlbnQsIHNvdXJjZSkge1xuICB0aGlzLmV2ZW50ID0gZXZlbnQ7XG4gIHRoaXMuc291cmNlID0gc291cmNlO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuRXZlbnRFbWl0dGVyU291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIC8vIE5PVEU6IEJlY2F1c2UgRXZlbnRFbWl0dGVyIGFsbG93cyBldmVudHMgaW4gdGhlIHNhbWUgY2FsbCBzdGFjayBhc1xuICAvLyBhIGxpc3RlbmVyIGlzIGFkZGVkLCB1c2UgYSBEZWZlcnJlZFNpbmsgdG8gYnVmZmVyIGV2ZW50c1xuICAvLyB1bnRpbCB0aGUgc3RhY2sgY2xlYXJzLCB0aGVuIHByb3BhZ2F0ZS4gIFRoaXMgbWFpbnRhaW5zIG1vc3QuanMnc1xuICAvLyBpbnZhcmlhbnQgdGhhdCBubyBldmVudCB3aWxsIGJlIGRlbGl2ZXJlZCBpbiB0aGUgc2FtZSBjYWxsIHN0YWNrXG4gIC8vIGFzIGFuIG9ic2VydmVyIGJlZ2lucyBvYnNlcnZpbmcuXG4gIHZhciBkc2luayA9IG5ldyBfRGVmZXJyZWRTaW5rMi5kZWZhdWx0KHNpbmspO1xuXG4gIGZ1bmN0aW9uIGFkZEV2ZW50VmFyaWFkaWMoYSkge1xuICAgIHZhciBhcmd1bWVudHMkMSA9IGFyZ3VtZW50cztcblxuICAgIHZhciBsID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICBpZiAobCA+IDEpIHtcbiAgICAgIHZhciBhcnIgPSBuZXcgQXJyYXkobCk7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgICAgICBhcnJbaV0gPSBhcmd1bWVudHMkMVtpXTtcbiAgICAgIH1cbiAgICAgIHRyeUV2ZW50LnRyeUV2ZW50KHNjaGVkdWxlci5ub3coKSwgYXJyLCBkc2luayk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeUV2ZW50LnRyeUV2ZW50KHNjaGVkdWxlci5ub3coKSwgYSwgZHNpbmspO1xuICAgIH1cbiAgfVxuXG4gIHRoaXMuc291cmNlLmFkZExpc3RlbmVyKHRoaXMuZXZlbnQsIGFkZEV2ZW50VmFyaWFkaWMpO1xuXG4gIHJldHVybiBkaXNwb3NlLmNyZWF0ZShkaXNwb3NlRXZlbnRFbWl0dGVyLCB7IHRhcmdldDogdGhpcywgYWRkRXZlbnQ6IGFkZEV2ZW50VmFyaWFkaWMgfSk7XG59O1xuXG5mdW5jdGlvbiBkaXNwb3NlRXZlbnRFbWl0dGVyKGluZm8pIHtcbiAgdmFyIHRhcmdldCA9IGluZm8udGFyZ2V0O1xuICB0YXJnZXQuc291cmNlLnJlbW92ZUxpc3RlbmVyKHRhcmdldC5ldmVudCwgaW5mby5hZGRFdmVudCk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5kZWZhdWx0ID0gRXZlbnRUYXJnZXRTb3VyY2U7XG5cbnZhciBfZGlzcG9zZSA9IHJlcXVpcmUoJy4uL2Rpc3Bvc2FibGUvZGlzcG9zZScpO1xuXG52YXIgZGlzcG9zZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9kaXNwb3NlKTtcblxudmFyIF90cnlFdmVudCA9IHJlcXVpcmUoJy4vdHJ5RXZlbnQnKTtcblxudmFyIHRyeUV2ZW50ID0gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQoX3RyeUV2ZW50KTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBFdmVudFRhcmdldFNvdXJjZShldmVudCwgc291cmNlLCBjYXB0dXJlKSB7XG4gIHRoaXMuZXZlbnQgPSBldmVudDtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2U7XG4gIHRoaXMuY2FwdHVyZSA9IGNhcHR1cmU7XG59XG5cbkV2ZW50VGFyZ2V0U291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIGZ1bmN0aW9uIGFkZEV2ZW50KGUpIHtcbiAgICB0cnlFdmVudC50cnlFdmVudChzY2hlZHVsZXIubm93KCksIGUsIHNpbmspO1xuICB9XG5cbiAgdGhpcy5zb3VyY2UuYWRkRXZlbnRMaXN0ZW5lcih0aGlzLmV2ZW50LCBhZGRFdmVudCwgdGhpcy5jYXB0dXJlKTtcblxuICByZXR1cm4gZGlzcG9zZS5jcmVhdGUoZGlzcG9zZUV2ZW50VGFyZ2V0LCB7IHRhcmdldDogdGhpcywgYWRkRXZlbnQ6IGFkZEV2ZW50IH0pO1xufTtcblxuZnVuY3Rpb24gZGlzcG9zZUV2ZW50VGFyZ2V0KGluZm8pIHtcbiAgdmFyIHRhcmdldCA9IGluZm8udGFyZ2V0O1xuICB0YXJnZXQuc291cmNlLnJlbW92ZUV2ZW50TGlzdGVuZXIodGFyZ2V0LmV2ZW50LCBpbmZvLmFkZEV2ZW50LCB0YXJnZXQuY2FwdHVyZSk7XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5vZiA9IG9mO1xuZXhwb3J0cy5lbXB0eSA9IGVtcHR5O1xuZXhwb3J0cy5uZXZlciA9IG5ldmVyO1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX2Rpc3Bvc2UgPSByZXF1aXJlKCcuLi9kaXNwb3NhYmxlL2Rpc3Bvc2UnKTtcblxudmFyIGRpc3Bvc2UgPSBfaW50ZXJvcFJlcXVpcmVXaWxkY2FyZChfZGlzcG9zZSk7XG5cbnZhciBfUHJvcGFnYXRlVGFzayA9IHJlcXVpcmUoJy4uL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogU3RyZWFtIGNvbnRhaW5pbmcgb25seSB4XG4gKiBAcGFyYW0geyp9IHhcbiAqIEByZXR1cm5zIHtTdHJlYW19XG4gKi9cbmZ1bmN0aW9uIG9mKHgpIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBKdXN0KHgpKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIEp1c3QoeCkge1xuICB0aGlzLnZhbHVlID0geDtcbn1cblxuSnVzdC5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gc2NoZWR1bGVyLmFzYXAobmV3IF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0KHJ1bkp1c3QsIHRoaXMudmFsdWUsIHNpbmspKTtcbn07XG5cbmZ1bmN0aW9uIHJ1bkp1c3QodCwgeCwgc2luaykge1xuICBzaW5rLmV2ZW50KHQsIHgpO1xuICBzaW5rLmVuZCh0LCB2b2lkIDApO1xufVxuXG4vKipcbiAqIFN0cmVhbSBjb250YWluaW5nIG5vIGV2ZW50cyBhbmQgZW5kcyBpbW1lZGlhdGVseVxuICogQHJldHVybnMge1N0cmVhbX1cbiAqL1xuZnVuY3Rpb24gZW1wdHkoKSB7XG4gIHJldHVybiBFTVBUWTtcbn1cblxuZnVuY3Rpb24gRW1wdHlTb3VyY2UoKSB7fVxuXG5FbXB0eVNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICB2YXIgdGFzayA9IF9Qcm9wYWdhdGVUYXNrMi5kZWZhdWx0LmVuZCh2b2lkIDAsIHNpbmspO1xuICBzY2hlZHVsZXIuYXNhcCh0YXNrKTtcblxuICByZXR1cm4gZGlzcG9zZS5jcmVhdGUoZGlzcG9zZUVtcHR5LCB0YXNrKTtcbn07XG5cbmZ1bmN0aW9uIGRpc3Bvc2VFbXB0eSh0YXNrKSB7XG4gIHJldHVybiB0YXNrLmRpc3Bvc2UoKTtcbn1cblxudmFyIEVNUFRZID0gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IEVtcHR5U291cmNlKCkpO1xuXG4vKipcbiAqIFN0cmVhbSBjb250YWluaW5nIG5vIGV2ZW50cyBhbmQgbmV2ZXIgZW5kc1xuICogQHJldHVybnMge1N0cmVhbX1cbiAqL1xuZnVuY3Rpb24gbmV2ZXIoKSB7XG4gIHJldHVybiBORVZFUjtcbn1cblxuZnVuY3Rpb24gTmV2ZXJTb3VyY2UoKSB7fVxuXG5OZXZlclNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZGlzcG9zZS5lbXB0eSgpO1xufTtcblxudmFyIE5FVkVSID0gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IE5ldmVyU291cmNlKCkpOyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZnJvbSA9IGZyb207XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfZnJvbUFycmF5ID0gcmVxdWlyZSgnLi9mcm9tQXJyYXknKTtcblxudmFyIF9pdGVyYWJsZSA9IHJlcXVpcmUoJy4uL2l0ZXJhYmxlJyk7XG5cbnZhciBfZnJvbUl0ZXJhYmxlID0gcmVxdWlyZSgnLi9mcm9tSXRlcmFibGUnKTtcblxudmFyIF9nZXRPYnNlcnZhYmxlID0gcmVxdWlyZSgnLi4vb2JzZXJ2YWJsZS9nZXRPYnNlcnZhYmxlJyk7XG5cbnZhciBfZ2V0T2JzZXJ2YWJsZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9nZXRPYnNlcnZhYmxlKTtcblxudmFyIF9mcm9tT2JzZXJ2YWJsZSA9IHJlcXVpcmUoJy4uL29ic2VydmFibGUvZnJvbU9ic2VydmFibGUnKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG5mdW5jdGlvbiBmcm9tKGEpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIGlmIChhIGluc3RhbmNlb2YgX1N0cmVhbTIuZGVmYXVsdCkge1xuICAgIHJldHVybiBhO1xuICB9XG5cbiAgdmFyIG9ic2VydmFibGUgPSAoMCwgX2dldE9ic2VydmFibGUyLmRlZmF1bHQpKGEpO1xuICBpZiAob2JzZXJ2YWJsZSAhPSBudWxsKSB7XG4gICAgcmV0dXJuICgwLCBfZnJvbU9ic2VydmFibGUuZnJvbU9ic2VydmFibGUpKG9ic2VydmFibGUpO1xuICB9XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkoYSkgfHwgKDAsIF9wcmVsdWRlLmlzQXJyYXlMaWtlKShhKSkge1xuICAgIHJldHVybiAoMCwgX2Zyb21BcnJheS5mcm9tQXJyYXkpKGEpO1xuICB9XG5cbiAgaWYgKCgwLCBfaXRlcmFibGUuaXNJdGVyYWJsZSkoYSkpIHtcbiAgICByZXR1cm4gKDAsIF9mcm9tSXRlcmFibGUuZnJvbUl0ZXJhYmxlKShhKTtcbiAgfVxuXG4gIHRocm93IG5ldyBUeXBlRXJyb3IoJ2Zyb20oeCkgbXVzdCBiZSBvYnNlcnZhYmxlLCBpdGVyYWJsZSwgb3IgYXJyYXktbGlrZTogJyArIGEpO1xufSAvKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi8iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLmZyb21BcnJheSA9IGZyb21BcnJheTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrID0gcmVxdWlyZSgnLi4vc2NoZWR1bGVyL1Byb3BhZ2F0ZVRhc2snKTtcblxudmFyIF9Qcm9wYWdhdGVUYXNrMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1Byb3BhZ2F0ZVRhc2spO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gZnJvbUFycmF5KGEpIHtcbiAgcmV0dXJuIG5ldyBfU3RyZWFtMi5kZWZhdWx0KG5ldyBBcnJheVNvdXJjZShhKSk7XG59XG5cbmZ1bmN0aW9uIEFycmF5U291cmNlKGEpIHtcbiAgdGhpcy5hcnJheSA9IGE7XG59XG5cbkFycmF5U291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBzY2hlZHVsZXIuYXNhcChuZXcgX1Byb3BhZ2F0ZVRhc2syLmRlZmF1bHQocnVuUHJvZHVjZXIsIHRoaXMuYXJyYXksIHNpbmspKTtcbn07XG5cbmZ1bmN0aW9uIHJ1blByb2R1Y2VyKHQsIGFycmF5LCBzaW5rKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gYXJyYXkubGVuZ3RoOyBpIDwgbCAmJiB0aGlzLmFjdGl2ZTsgKytpKSB7XG4gICAgc2luay5ldmVudCh0LCBhcnJheVtpXSk7XG4gIH1cblxuICB0aGlzLmFjdGl2ZSAmJiBlbmQodCk7XG5cbiAgZnVuY3Rpb24gZW5kKHQpIHtcbiAgICBzaW5rLmVuZCh0KTtcbiAgfVxufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZnJvbUV2ZW50ID0gZnJvbUV2ZW50O1xuXG52YXIgX1N0cmVhbSA9IHJlcXVpcmUoJy4uL1N0cmVhbScpO1xuXG52YXIgX1N0cmVhbTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9TdHJlYW0pO1xuXG52YXIgX0V2ZW50VGFyZ2V0U291cmNlID0gcmVxdWlyZSgnLi9FdmVudFRhcmdldFNvdXJjZScpO1xuXG52YXIgX0V2ZW50VGFyZ2V0U291cmNlMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX0V2ZW50VGFyZ2V0U291cmNlKTtcblxudmFyIF9FdmVudEVtaXR0ZXJTb3VyY2UgPSByZXF1aXJlKCcuL0V2ZW50RW1pdHRlclNvdXJjZScpO1xuXG52YXIgX0V2ZW50RW1pdHRlclNvdXJjZTIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9FdmVudEVtaXR0ZXJTb3VyY2UpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyBkZWZhdWx0OiBvYmogfTsgfVxuXG4vKipcbiAqIENyZWF0ZSBhIHN0cmVhbSBmcm9tIGFuIEV2ZW50VGFyZ2V0LCBzdWNoIGFzIGEgRE9NIE5vZGUsIG9yIEV2ZW50RW1pdHRlci5cbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBldmVudCB0eXBlIG5hbWUsIGUuZy4gJ2NsaWNrJ1xuICogQHBhcmFtIHtFdmVudFRhcmdldHxFdmVudEVtaXR0ZXJ9IHNvdXJjZSBFdmVudFRhcmdldCBvciBFdmVudEVtaXR0ZXJcbiAqIEBwYXJhbSB7Kj99IGNhcHR1cmUgZm9yIERPTSBldmVudHMsIHdoZXRoZXIgdG8gdXNlXG4gKiAgY2FwdHVyaW5nLS1wYXNzZWQgYXMgM3JkIHBhcmFtZXRlciB0byBhZGRFdmVudExpc3RlbmVyLlxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBvZiB0aGUgc3BlY2lmaWVkIHR5cGVcbiAqIGZyb20gdGhlIHNvdXJjZS5cbiAqL1xuZnVuY3Rpb24gZnJvbUV2ZW50KGV2ZW50LCBzb3VyY2UsIGNhcHR1cmUpIHtcbiAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIHZhciBzO1xuXG4gIGlmICh0eXBlb2Ygc291cmNlLmFkZEV2ZW50TGlzdGVuZXIgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIHNvdXJjZS5yZW1vdmVFdmVudExpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XG4gICAgICBjYXB0dXJlID0gZmFsc2U7XG4gICAgfVxuXG4gICAgcyA9IG5ldyBfRXZlbnRUYXJnZXRTb3VyY2UyLmRlZmF1bHQoZXZlbnQsIHNvdXJjZSwgY2FwdHVyZSk7XG4gIH0gZWxzZSBpZiAodHlwZW9mIHNvdXJjZS5hZGRMaXN0ZW5lciA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2Ygc291cmNlLnJlbW92ZUxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG4gICAgcyA9IG5ldyBfRXZlbnRFbWl0dGVyU291cmNlMi5kZWZhdWx0KGV2ZW50LCBzb3VyY2UpO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignc291cmNlIG11c3Qgc3VwcG9ydCBhZGRFdmVudExpc3RlbmVyL3JlbW92ZUV2ZW50TGlzdGVuZXIgb3IgYWRkTGlzdGVuZXIvcmVtb3ZlTGlzdGVuZXInKTtcbiAgfVxuXG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChzKTtcbn0gLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovIiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy5mcm9tSXRlcmFibGUgPSBmcm9tSXRlcmFibGU7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfaXRlcmFibGUgPSByZXF1aXJlKCcuLi9pdGVyYWJsZScpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2sgPSByZXF1aXJlKCcuLi9zY2hlZHVsZXIvUHJvcGFnYXRlVGFzaycpO1xuXG52YXIgX1Byb3BhZ2F0ZVRhc2syID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfUHJvcGFnYXRlVGFzayk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbmZ1bmN0aW9uIGZyb21JdGVyYWJsZShpdGVyYWJsZSkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IEl0ZXJhYmxlU291cmNlKGl0ZXJhYmxlKSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBJdGVyYWJsZVNvdXJjZShpdGVyYWJsZSkge1xuICB0aGlzLml0ZXJhYmxlID0gaXRlcmFibGU7XG59XG5cbkl0ZXJhYmxlU291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBzY2hlZHVsZXIuYXNhcChuZXcgX1Byb3BhZ2F0ZVRhc2syLmRlZmF1bHQocnVuUHJvZHVjZXIsICgwLCBfaXRlcmFibGUuZ2V0SXRlcmF0b3IpKHRoaXMuaXRlcmFibGUpLCBzaW5rKSk7XG59O1xuXG5mdW5jdGlvbiBydW5Qcm9kdWNlcih0LCBpdGVyYXRvciwgc2luaykge1xuICB2YXIgciA9IGl0ZXJhdG9yLm5leHQoKTtcblxuICB3aGlsZSAoIXIuZG9uZSAmJiB0aGlzLmFjdGl2ZSkge1xuICAgIHNpbmsuZXZlbnQodCwgci52YWx1ZSk7XG4gICAgciA9IGl0ZXJhdG9yLm5leHQoKTtcbiAgfVxuXG4gIHNpbmsuZW5kKHQsIHIudmFsdWUpO1xufSIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZ2VuZXJhdGUgPSBnZW5lcmF0ZTtcblxudmFyIF9TdHJlYW0gPSByZXF1aXJlKCcuLi9TdHJlYW0nKTtcblxudmFyIF9TdHJlYW0yID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfU3RyZWFtKTtcblxudmFyIF9wcmVsdWRlID0gcmVxdWlyZSgnQG1vc3QvcHJlbHVkZScpO1xuXG52YXIgYmFzZSA9IF9pbnRlcm9wUmVxdWlyZVdpbGRjYXJkKF9wcmVsdWRlKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQob2JqKSB7IGlmIChvYmogJiYgb2JqLl9fZXNNb2R1bGUpIHsgcmV0dXJuIG9iajsgfSBlbHNlIHsgdmFyIG5ld09iaiA9IHt9OyBpZiAob2JqICE9IG51bGwpIHsgZm9yICh2YXIga2V5IGluIG9iaikgeyBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkgeyBuZXdPYmpba2V5XSA9IG9ialtrZXldOyB9IH0gfSBuZXdPYmouZGVmYXVsdCA9IG9iajsgcmV0dXJuIG5ld09iajsgfSB9XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQ29tcHV0ZSBhIHN0cmVhbSB1c2luZyBhbiAqYXN5bmMqIGdlbmVyYXRvciwgd2hpY2ggeWllbGRzIHByb21pc2VzXG4gKiB0byBjb250cm9sIGV2ZW50IHRpbWVzLlxuICogQHBhcmFtIGZcbiAqIEByZXR1cm5zIHtTdHJlYW19XG4gKi9cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNCBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBnZW5lcmF0ZShmIC8qLCAuLi5hcmdzICovKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgR2VuZXJhdGVTb3VyY2UoZiwgYmFzZS50YWlsKGFyZ3VtZW50cykpKTtcbn1cblxuZnVuY3Rpb24gR2VuZXJhdGVTb3VyY2UoZiwgYXJncykge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLmFyZ3MgPSBhcmdzO1xufVxuXG5HZW5lcmF0ZVNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gbmV3IEdlbmVyYXRlKHRoaXMuZi5hcHBseSh2b2lkIDAsIHRoaXMuYXJncyksIHNpbmssIHNjaGVkdWxlcik7XG59O1xuXG5mdW5jdGlvbiBHZW5lcmF0ZShpdGVyYXRvciwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuaXRlcmF0b3IgPSBpdGVyYXRvcjtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGZ1bmN0aW9uIGVycihlKSB7XG4gICAgc2VsZi5zaW5rLmVycm9yKHNlbGYuc2NoZWR1bGVyLm5vdygpLCBlKTtcbiAgfVxuXG4gIFByb21pc2UucmVzb2x2ZSh0aGlzKS50aGVuKG5leHQpLmNhdGNoKGVycik7XG59XG5cbmZ1bmN0aW9uIG5leHQoZ2VuZXJhdGUsIHgpIHtcbiAgcmV0dXJuIGdlbmVyYXRlLmFjdGl2ZSA/IGhhbmRsZShnZW5lcmF0ZSwgZ2VuZXJhdGUuaXRlcmF0b3IubmV4dCh4KSkgOiB4O1xufVxuXG5mdW5jdGlvbiBoYW5kbGUoZ2VuZXJhdGUsIHJlc3VsdCkge1xuICBpZiAocmVzdWx0LmRvbmUpIHtcbiAgICByZXR1cm4gZ2VuZXJhdGUuc2luay5lbmQoZ2VuZXJhdGUuc2NoZWR1bGVyLm5vdygpLCByZXN1bHQudmFsdWUpO1xuICB9XG5cbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZXN1bHQudmFsdWUpLnRoZW4oZnVuY3Rpb24gKHgpIHtcbiAgICByZXR1cm4gZW1pdChnZW5lcmF0ZSwgeCk7XG4gIH0sIGZ1bmN0aW9uIChlKSB7XG4gICAgcmV0dXJuIGVycm9yKGdlbmVyYXRlLCBlKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGVtaXQoZ2VuZXJhdGUsIHgpIHtcbiAgZ2VuZXJhdGUuc2luay5ldmVudChnZW5lcmF0ZS5zY2hlZHVsZXIubm93KCksIHgpO1xuICByZXR1cm4gbmV4dChnZW5lcmF0ZSwgeCk7XG59XG5cbmZ1bmN0aW9uIGVycm9yKGdlbmVyYXRlLCBlKSB7XG4gIHJldHVybiBoYW5kbGUoZ2VuZXJhdGUsIGdlbmVyYXRlLml0ZXJhdG9yLnRocm93KGUpKTtcbn1cblxuR2VuZXJhdGUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuYWN0aXZlID0gZmFsc2U7XG59OyIsIid1c2Ugc3RyaWN0JztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuaXRlcmF0ZSA9IGl0ZXJhdGU7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQ29tcHV0ZSBhIHN0cmVhbSBieSBpdGVyYXRpdmVseSBjYWxsaW5nIGYgdG8gcHJvZHVjZSB2YWx1ZXNcbiAqIEV2ZW50IHRpbWVzIG1heSBiZSBjb250cm9sbGVkIGJ5IHJldHVybmluZyBhIFByb21pc2UgZnJvbSBmXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHg6Kik6KnxQcm9taXNlPCo+fSBmXG4gKiBAcGFyYW0geyp9IHggaW5pdGlhbCB2YWx1ZVxuICogQHJldHVybnMge1N0cmVhbX1cbiAqL1xuZnVuY3Rpb24gaXRlcmF0ZShmLCB4KSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgSXRlcmF0ZVNvdXJjZShmLCB4KSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBJdGVyYXRlU291cmNlKGYsIHgpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy52YWx1ZSA9IHg7XG59XG5cbkl0ZXJhdGVTb3VyY2UucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgcmV0dXJuIG5ldyBJdGVyYXRlKHRoaXMuZiwgdGhpcy52YWx1ZSwgc2luaywgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIEl0ZXJhdGUoZiwgaW5pdGlhbCwgc2luaywgc2NoZWR1bGVyKSB7XG4gIHRoaXMuZiA9IGY7XG4gIHRoaXMuc2luayA9IHNpbms7XG4gIHRoaXMuc2NoZWR1bGVyID0gc2NoZWR1bGVyO1xuICB0aGlzLmFjdGl2ZSA9IHRydWU7XG5cbiAgdmFyIHggPSBpbml0aWFsO1xuXG4gIHZhciBzZWxmID0gdGhpcztcbiAgZnVuY3Rpb24gZXJyKGUpIHtcbiAgICBzZWxmLnNpbmsuZXJyb3Ioc2VsZi5zY2hlZHVsZXIubm93KCksIGUpO1xuICB9XG5cbiAgZnVuY3Rpb24gc3RhcnQoaXRlcmF0ZSkge1xuICAgIHJldHVybiBzdGVwSXRlcmF0ZShpdGVyYXRlLCB4KTtcbiAgfVxuXG4gIFByb21pc2UucmVzb2x2ZSh0aGlzKS50aGVuKHN0YXJ0KS5jYXRjaChlcnIpO1xufVxuXG5JdGVyYXRlLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTtcblxuZnVuY3Rpb24gc3RlcEl0ZXJhdGUoaXRlcmF0ZSwgeCkge1xuICBpdGVyYXRlLnNpbmsuZXZlbnQoaXRlcmF0ZS5zY2hlZHVsZXIubm93KCksIHgpO1xuXG4gIGlmICghaXRlcmF0ZS5hY3RpdmUpIHtcbiAgICByZXR1cm4geDtcbiAgfVxuXG4gIHZhciBmID0gaXRlcmF0ZS5mO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGYoeCkpLnRoZW4oZnVuY3Rpb24gKHkpIHtcbiAgICByZXR1cm4gY29udGludWVJdGVyYXRlKGl0ZXJhdGUsIHkpO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gY29udGludWVJdGVyYXRlKGl0ZXJhdGUsIHgpIHtcbiAgcmV0dXJuICFpdGVyYXRlLmFjdGl2ZSA/IGl0ZXJhdGUudmFsdWUgOiBzdGVwSXRlcmF0ZShpdGVyYXRlLCB4KTtcbn0iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5leHBvcnRzLnBlcmlvZGljID0gcGVyaW9kaWM7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbnZhciBfUHJvcGFnYXRlVGFzayA9IHJlcXVpcmUoJy4uL3NjaGVkdWxlci9Qcm9wYWdhdGVUYXNrJyk7XG5cbnZhciBfUHJvcGFnYXRlVGFzazIgPSBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KF9Qcm9wYWdhdGVUYXNrKTtcblxuZnVuY3Rpb24gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChvYmopIHsgcmV0dXJuIG9iaiAmJiBvYmouX19lc01vZHVsZSA/IG9iaiA6IHsgZGVmYXVsdDogb2JqIH07IH1cblxuLyoqXG4gKiBDcmVhdGUgYSBzdHJlYW0gdGhhdCBlbWl0cyB0aGUgY3VycmVudCB0aW1lIHBlcmlvZGljYWxseVxuICogQHBhcmFtIHtOdW1iZXJ9IHBlcmlvZCBwZXJpb2RpY2l0eSBvZiBldmVudHMgaW4gbWlsbGlzXG4gKiBAcGFyYW0geyp9IGRlcHJlY2F0ZWRWYWx1ZSBAZGVwcmVjYXRlZCB2YWx1ZSB0byBlbWl0IGVhY2ggcGVyaW9kXG4gKiBAcmV0dXJucyB7U3RyZWFtfSBuZXcgc3RyZWFtIHRoYXQgZW1pdHMgdGhlIGN1cnJlbnQgdGltZSBldmVyeSBwZXJpb2RcbiAqL1xuLyoqIEBsaWNlbnNlIE1JVCBMaWNlbnNlIChjKSBjb3B5cmlnaHQgMjAxMC0yMDE2IG9yaWdpbmFsIGF1dGhvciBvciBhdXRob3JzICovXG4vKiogQGF1dGhvciBCcmlhbiBDYXZhbGllciAqL1xuLyoqIEBhdXRob3IgSm9obiBIYW5uICovXG5cbmZ1bmN0aW9uIHBlcmlvZGljKHBlcmlvZCwgZGVwcmVjYXRlZFZhbHVlKSB7XG4gIHJldHVybiBuZXcgX1N0cmVhbTIuZGVmYXVsdChuZXcgUGVyaW9kaWMocGVyaW9kLCBkZXByZWNhdGVkVmFsdWUpKTtcbn1cblxuZnVuY3Rpb24gUGVyaW9kaWMocGVyaW9kLCB2YWx1ZSkge1xuICB0aGlzLnBlcmlvZCA9IHBlcmlvZDtcbiAgdGhpcy52YWx1ZSA9IHZhbHVlO1xufVxuXG5QZXJpb2RpYy5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKHNpbmssIHNjaGVkdWxlcikge1xuICByZXR1cm4gc2NoZWR1bGVyLnBlcmlvZGljKHRoaXMucGVyaW9kLCBfUHJvcGFnYXRlVGFzazIuZGVmYXVsdC5ldmVudCh0aGlzLnZhbHVlLCBzaW5rKSk7XG59OyIsIlwidXNlIHN0cmljdFwiO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy50cnlFdmVudCA9IHRyeUV2ZW50O1xuZXhwb3J0cy50cnlFbmQgPSB0cnlFbmQ7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gdHJ5RXZlbnQodCwgeCwgc2luaykge1xuICB0cnkge1xuICAgIHNpbmsuZXZlbnQodCwgeCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzaW5rLmVycm9yKHQsIGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHRyeUVuZCh0LCB4LCBzaW5rKSB7XG4gIHRyeSB7XG4gICAgc2luay5lbmQodCwgeCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBzaW5rLmVycm9yKHQsIGUpO1xuICB9XG59IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcbiAgdmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0cy51bmZvbGQgPSB1bmZvbGQ7XG5cbnZhciBfU3RyZWFtID0gcmVxdWlyZSgnLi4vU3RyZWFtJyk7XG5cbnZhciBfU3RyZWFtMiA9IF9pbnRlcm9wUmVxdWlyZURlZmF1bHQoX1N0cmVhbSk7XG5cbmZ1bmN0aW9uIF9pbnRlcm9wUmVxdWlyZURlZmF1bHQob2JqKSB7IHJldHVybiBvYmogJiYgb2JqLl9fZXNNb2R1bGUgPyBvYmogOiB7IGRlZmF1bHQ6IG9iaiB9OyB9XG5cbi8qKlxuICogQ29tcHV0ZSBhIHN0cmVhbSBieSB1bmZvbGRpbmcgdHVwbGVzIG9mIGZ1dHVyZSB2YWx1ZXMgZnJvbSBhIHNlZWQgdmFsdWVcbiAqIEV2ZW50IHRpbWVzIG1heSBiZSBjb250cm9sbGVkIGJ5IHJldHVybmluZyBhIFByb21pc2UgZnJvbSBmXG4gKiBAcGFyYW0ge2Z1bmN0aW9uKHNlZWQ6Kik6e3ZhbHVlOiosIHNlZWQ6KiwgZG9uZTpib29sZWFufXxQcm9taXNlPHt2YWx1ZToqLCBzZWVkOiosIGRvbmU6Ym9vbGVhbn0+fSBmIHVuZm9sZGluZyBmdW5jdGlvbiBhY2NlcHRzXG4gKiAgYSBzZWVkIGFuZCByZXR1cm5zIGEgbmV3IHR1cGxlIHdpdGggYSB2YWx1ZSwgbmV3IHNlZWQsIGFuZCBib29sZWFuIGRvbmUgZmxhZy5cbiAqICBJZiB0dXBsZS5kb25lIGlzIHRydWUsIHRoZSBzdHJlYW0gd2lsbCBlbmQuXG4gKiBAcGFyYW0geyp9IHNlZWQgc2VlZCB2YWx1ZVxuICogQHJldHVybnMge1N0cmVhbX0gc3RyZWFtIGNvbnRhaW5pbmcgYWxsIHZhbHVlIG9mIGFsbCB0dXBsZXMgcHJvZHVjZWQgYnkgdGhlXG4gKiAgdW5mb2xkaW5nIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiB1bmZvbGQoZiwgc2VlZCkge1xuICByZXR1cm4gbmV3IF9TdHJlYW0yLmRlZmF1bHQobmV3IFVuZm9sZFNvdXJjZShmLCBzZWVkKSk7XG59IC8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuLyoqIEBhdXRob3IgQnJpYW4gQ2F2YWxpZXIgKi9cbi8qKiBAYXV0aG9yIEpvaG4gSGFubiAqL1xuXG5mdW5jdGlvbiBVbmZvbGRTb3VyY2UoZiwgc2VlZCkge1xuICB0aGlzLmYgPSBmO1xuICB0aGlzLnZhbHVlID0gc2VlZDtcbn1cblxuVW5mb2xkU291cmNlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoc2luaywgc2NoZWR1bGVyKSB7XG4gIHJldHVybiBuZXcgVW5mb2xkKHRoaXMuZiwgdGhpcy52YWx1ZSwgc2luaywgc2NoZWR1bGVyKTtcbn07XG5cbmZ1bmN0aW9uIFVuZm9sZChmLCB4LCBzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdGhpcy5mID0gZjtcbiAgdGhpcy5zaW5rID0gc2luaztcbiAgdGhpcy5zY2hlZHVsZXIgPSBzY2hlZHVsZXI7XG4gIHRoaXMuYWN0aXZlID0gdHJ1ZTtcblxuICB2YXIgc2VsZiA9IHRoaXM7XG4gIGZ1bmN0aW9uIGVycihlKSB7XG4gICAgc2VsZi5zaW5rLmVycm9yKHNlbGYuc2NoZWR1bGVyLm5vdygpLCBlKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHN0YXJ0KHVuZm9sZCkge1xuICAgIHJldHVybiBzdGVwVW5mb2xkKHVuZm9sZCwgeCk7XG4gIH1cblxuICBQcm9taXNlLnJlc29sdmUodGhpcykudGhlbihzdGFydCkuY2F0Y2goZXJyKTtcbn1cblxuVW5mb2xkLnByb3RvdHlwZS5kaXNwb3NlID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLmFjdGl2ZSA9IGZhbHNlO1xufTtcblxuZnVuY3Rpb24gc3RlcFVuZm9sZCh1bmZvbGQsIHgpIHtcbiAgdmFyIGYgPSB1bmZvbGQuZjtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShmKHgpKS50aGVuKGZ1bmN0aW9uICh0dXBsZSkge1xuICAgIHJldHVybiBjb250aW51ZVVuZm9sZCh1bmZvbGQsIHR1cGxlKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRpbnVlVW5mb2xkKHVuZm9sZCwgdHVwbGUpIHtcbiAgaWYgKHR1cGxlLmRvbmUpIHtcbiAgICB1bmZvbGQuc2luay5lbmQodW5mb2xkLnNjaGVkdWxlci5ub3coKSwgdHVwbGUudmFsdWUpO1xuICAgIHJldHVybiB0dXBsZS52YWx1ZTtcbiAgfVxuXG4gIHVuZm9sZC5zaW5rLmV2ZW50KHVuZm9sZC5zY2hlZHVsZXIubm93KCksIHR1cGxlLnZhbHVlKTtcblxuICBpZiAoIXVuZm9sZC5hY3RpdmUpIHtcbiAgICByZXR1cm4gdHVwbGUudmFsdWU7XG4gIH1cbiAgcmV0dXJuIHN0ZXBVbmZvbGQodW5mb2xkLCB0dXBsZS5zZWVkKTtcbn0iLCJcInVzZSBzdHJpY3RcIjtcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7XG4gIHZhbHVlOiB0cnVlXG59KTtcbmV4cG9ydHMuZGVmZXIgPSBkZWZlcjtcbmV4cG9ydHMucnVuVGFzayA9IHJ1blRhc2s7XG4vKiogQGxpY2Vuc2UgTUlUIExpY2Vuc2UgKGMpIGNvcHlyaWdodCAyMDEwLTIwMTYgb3JpZ2luYWwgYXV0aG9yIG9yIGF1dGhvcnMgKi9cbi8qKiBAYXV0aG9yIEJyaWFuIENhdmFsaWVyICovXG4vKiogQGF1dGhvciBKb2huIEhhbm4gKi9cblxuZnVuY3Rpb24gZGVmZXIodGFzaykge1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRhc2spLnRoZW4ocnVuVGFzayk7XG59XG5cbmZ1bmN0aW9uIHJ1blRhc2sodGFzaykge1xuICB0cnkge1xuICAgIHJldHVybiB0YXNrLnJ1bigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgcmV0dXJuIHRhc2suZXJyb3IoZSk7XG4gIH1cbn0iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMsIHJlcXVpcmUoJ0Btb3N0L3ByZWx1ZGUnKSkgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoWydleHBvcnRzJywgJ0Btb3N0L3ByZWx1ZGUnXSwgZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgoZ2xvYmFsLm1vc3RNdWx0aWNhc3QgPSBnbG9iYWwubW9zdE11bHRpY2FzdCB8fCB7fSksZ2xvYmFsLm1vc3RQcmVsdWRlKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cyxfbW9zdF9wcmVsdWRlKSB7ICd1c2Ugc3RyaWN0JztcblxudmFyIE11bHRpY2FzdERpc3Bvc2FibGUgPSBmdW5jdGlvbiBNdWx0aWNhc3REaXNwb3NhYmxlIChzb3VyY2UsIHNpbmspIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2VcbiAgdGhpcy5zaW5rID0gc2lua1xuICB0aGlzLmRpc3Bvc2VkID0gZmFsc2Vcbn07XG5cbk11bHRpY2FzdERpc3Bvc2FibGUucHJvdG90eXBlLmRpc3Bvc2UgPSBmdW5jdGlvbiBkaXNwb3NlICgpIHtcbiAgaWYgKHRoaXMuZGlzcG9zZWQpIHtcbiAgICByZXR1cm5cbiAgfVxuICB0aGlzLmRpc3Bvc2VkID0gdHJ1ZVxuICB2YXIgcmVtYWluaW5nID0gdGhpcy5zb3VyY2UucmVtb3ZlKHRoaXMuc2luaylcbiAgcmV0dXJuIHJlbWFpbmluZyA9PT0gMCAmJiB0aGlzLnNvdXJjZS5fZGlzcG9zZSgpXG59O1xuXG5mdW5jdGlvbiB0cnlFdmVudCAodCwgeCwgc2luaykge1xuICB0cnkge1xuICAgIHNpbmsuZXZlbnQodCwgeClcbiAgfSBjYXRjaCAoZSkge1xuICAgIHNpbmsuZXJyb3IodCwgZSlcbiAgfVxufVxuXG5mdW5jdGlvbiB0cnlFbmQgKHQsIHgsIHNpbmspIHtcbiAgdHJ5IHtcbiAgICBzaW5rLmVuZCh0LCB4KVxuICB9IGNhdGNoIChlKSB7XG4gICAgc2luay5lcnJvcih0LCBlKVxuICB9XG59XG5cbnZhciBkaXNwb3NlID0gZnVuY3Rpb24gKGRpc3Bvc2FibGUpIHsgcmV0dXJuIGRpc3Bvc2FibGUuZGlzcG9zZSgpOyB9XG5cbnZhciBlbXB0eURpc3Bvc2FibGUgPSB7XG4gIGRpc3Bvc2U6IGZ1bmN0aW9uIGRpc3Bvc2UkMSAoKSB7fVxufVxuXG52YXIgTXVsdGljYXN0U291cmNlID0gZnVuY3Rpb24gTXVsdGljYXN0U291cmNlIChzb3VyY2UpIHtcbiAgdGhpcy5zb3VyY2UgPSBzb3VyY2VcbiAgdGhpcy5zaW5rcyA9IFtdXG4gIHRoaXMuX2Rpc3Bvc2FibGUgPSBlbXB0eURpc3Bvc2FibGVcbn07XG5cbk11bHRpY2FzdFNvdXJjZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gcnVuIChzaW5rLCBzY2hlZHVsZXIpIHtcbiAgdmFyIG4gPSB0aGlzLmFkZChzaW5rKVxuICBpZiAobiA9PT0gMSkge1xuICAgIHRoaXMuX2Rpc3Bvc2FibGUgPSB0aGlzLnNvdXJjZS5ydW4odGhpcywgc2NoZWR1bGVyKVxuICB9XG4gIHJldHVybiBuZXcgTXVsdGljYXN0RGlzcG9zYWJsZSh0aGlzLCBzaW5rKVxufTtcblxuTXVsdGljYXN0U291cmNlLnByb3RvdHlwZS5fZGlzcG9zZSA9IGZ1bmN0aW9uIF9kaXNwb3NlICgpIHtcbiAgdmFyIGRpc3Bvc2FibGUgPSB0aGlzLl9kaXNwb3NhYmxlXG4gIHRoaXMuX2Rpc3Bvc2FibGUgPSBlbXB0eURpc3Bvc2FibGVcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShkaXNwb3NhYmxlKS50aGVuKGRpc3Bvc2UpXG59O1xuXG5NdWx0aWNhc3RTb3VyY2UucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIGFkZCAoc2luaykge1xuICB0aGlzLnNpbmtzID0gX21vc3RfcHJlbHVkZS5hcHBlbmQoc2luaywgdGhpcy5zaW5rcylcbiAgcmV0dXJuIHRoaXMuc2lua3MubGVuZ3RoXG59O1xuXG5NdWx0aWNhc3RTb3VyY2UucHJvdG90eXBlLnJlbW92ZSA9IGZ1bmN0aW9uIHJlbW92ZSQxIChzaW5rKSB7XG4gIHZhciBpID0gX21vc3RfcHJlbHVkZS5maW5kSW5kZXgoc2luaywgdGhpcy5zaW5rcylcbiAgLy8gaXN0YW5idWwgaWdub3JlIG5leHRcbiAgaWYgKGkgPj0gMCkge1xuICAgIHRoaXMuc2lua3MgPSBfbW9zdF9wcmVsdWRlLnJlbW92ZShpLCB0aGlzLnNpbmtzKVxuICB9XG5cbiAgcmV0dXJuIHRoaXMuc2lua3MubGVuZ3RoXG59O1xuXG5NdWx0aWNhc3RTb3VyY2UucHJvdG90eXBlLmV2ZW50ID0gZnVuY3Rpb24gZXZlbnQgKHRpbWUsIHZhbHVlKSB7XG4gIHZhciBzID0gdGhpcy5zaW5rc1xuICBpZiAocy5sZW5ndGggPT09IDEpIHtcbiAgICByZXR1cm4gc1swXS5ldmVudCh0aW1lLCB2YWx1ZSlcbiAgfVxuICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyArK2kpIHtcbiAgICB0cnlFdmVudCh0aW1lLCB2YWx1ZSwgc1tpXSlcbiAgfVxufTtcblxuTXVsdGljYXN0U291cmNlLnByb3RvdHlwZS5lbmQgPSBmdW5jdGlvbiBlbmQgKHRpbWUsIHZhbHVlKSB7XG4gIHZhciBzID0gdGhpcy5zaW5rc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyArK2kpIHtcbiAgICB0cnlFbmQodGltZSwgdmFsdWUsIHNbaV0pXG4gIH1cbn07XG5cbk11bHRpY2FzdFNvdXJjZS5wcm90b3R5cGUuZXJyb3IgPSBmdW5jdGlvbiBlcnJvciAodGltZSwgZXJyKSB7XG4gIHZhciBzID0gdGhpcy5zaW5rc1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyArK2kpIHtcbiAgICBzW2ldLmVycm9yKHRpbWUsIGVycilcbiAgfVxufTtcblxuZnVuY3Rpb24gbXVsdGljYXN0IChzdHJlYW0pIHtcbiAgdmFyIHNvdXJjZSA9IHN0cmVhbS5zb3VyY2VcbiAgcmV0dXJuIHNvdXJjZSBpbnN0YW5jZW9mIE11bHRpY2FzdFNvdXJjZVxuICAgID8gc3RyZWFtXG4gICAgOiBuZXcgc3RyZWFtLmNvbnN0cnVjdG9yKG5ldyBNdWx0aWNhc3RTb3VyY2Uoc291cmNlKSlcbn1cblxuZXhwb3J0c1snZGVmYXVsdCddID0gbXVsdGljYXN0O1xuZXhwb3J0cy5NdWx0aWNhc3RTb3VyY2UgPSBNdWx0aWNhc3RTb3VyY2U7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG5cbn0pKSk7XG4vLyMgc291cmNlTWFwcGluZ1VSTD1tdWx0aWNhc3QuanMubWFwXG4iLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KGV4cG9ydHMpIDpcbiAgdHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kID8gZGVmaW5lKFsnZXhwb3J0cyddLCBmYWN0b3J5KSA6XG4gIChmYWN0b3J5KChnbG9iYWwubW9zdFByZWx1ZGUgPSBnbG9iYWwubW9zdFByZWx1ZGUgfHwge30pKSk7XG59KHRoaXMsIChmdW5jdGlvbiAoZXhwb3J0cykgeyAndXNlIHN0cmljdCc7XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuXG4vLyBOb24tbXV0YXRpbmcgYXJyYXkgb3BlcmF0aW9uc1xuXG4vLyBjb25zIDo6IGEgLT4gW2FdIC0+IFthXVxuLy8gYSB3aXRoIHggcHJlcGVuZGVkXG5mdW5jdGlvbiBjb25zICh4LCBhKSB7XG4gIHZhciBsID0gYS5sZW5ndGhcbiAgdmFyIGIgPSBuZXcgQXJyYXkobCArIDEpXG4gIGJbMF0gPSB4XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbDsgKytpKSB7XG4gICAgYltpICsgMV0gPSBhW2ldXG4gIH1cbiAgcmV0dXJuIGJcbn1cblxuLy8gYXBwZW5kIDo6IGEgLT4gW2FdIC0+IFthXVxuLy8gYSB3aXRoIHggYXBwZW5kZWRcbmZ1bmN0aW9uIGFwcGVuZCAoeCwgYSkge1xuICB2YXIgbCA9IGEubGVuZ3RoXG4gIHZhciBiID0gbmV3IEFycmF5KGwgKyAxKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGJbaV0gPSBhW2ldXG4gIH1cblxuICBiW2xdID0geFxuICByZXR1cm4gYlxufVxuXG4vLyBkcm9wIDo6IEludCAtPiBbYV0gLT4gW2FdXG4vLyBkcm9wIGZpcnN0IG4gZWxlbWVudHNcbmZ1bmN0aW9uIGRyb3AgKG4sIGEpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIGlmIChuIDwgMCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ24gbXVzdCBiZSA+PSAwJylcbiAgfVxuXG4gIHZhciBsID0gYS5sZW5ndGhcbiAgaWYgKG4gPT09IDAgfHwgbCA9PT0gMCkge1xuICAgIHJldHVybiBhXG4gIH1cblxuICBpZiAobiA+PSBsKSB7XG4gICAgcmV0dXJuIFtdXG4gIH1cblxuICByZXR1cm4gdW5zYWZlRHJvcChuLCBhLCBsIC0gbilcbn1cblxuLy8gdW5zYWZlRHJvcCA6OiBJbnQgLT4gW2FdIC0+IEludCAtPiBbYV1cbi8vIEludGVybmFsIGhlbHBlciBmb3IgZHJvcFxuZnVuY3Rpb24gdW5zYWZlRHJvcCAobiwgYSwgbCkge1xuICB2YXIgYiA9IG5ldyBBcnJheShsKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGJbaV0gPSBhW24gKyBpXVxuICB9XG4gIHJldHVybiBiXG59XG5cbi8vIHRhaWwgOjogW2FdIC0+IFthXVxuLy8gZHJvcCBoZWFkIGVsZW1lbnRcbmZ1bmN0aW9uIHRhaWwgKGEpIHtcbiAgcmV0dXJuIGRyb3AoMSwgYSlcbn1cblxuLy8gY29weSA6OiBbYV0gLT4gW2FdXG4vLyBkdXBsaWNhdGUgYSAoc2hhbGxvdyBkdXBsaWNhdGlvbilcbmZ1bmN0aW9uIGNvcHkgKGEpIHtcbiAgdmFyIGwgPSBhLmxlbmd0aFxuICB2YXIgYiA9IG5ldyBBcnJheShsKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGJbaV0gPSBhW2ldXG4gIH1cbiAgcmV0dXJuIGJcbn1cblxuLy8gbWFwIDo6IChhIC0+IGIpIC0+IFthXSAtPiBbYl1cbi8vIHRyYW5zZm9ybSBlYWNoIGVsZW1lbnQgd2l0aCBmXG5mdW5jdGlvbiBtYXAgKGYsIGEpIHtcbiAgdmFyIGwgPSBhLmxlbmd0aFxuICB2YXIgYiA9IG5ldyBBcnJheShsKVxuICBmb3IgKHZhciBpID0gMDsgaSA8IGw7ICsraSkge1xuICAgIGJbaV0gPSBmKGFbaV0pXG4gIH1cbiAgcmV0dXJuIGJcbn1cblxuLy8gcmVkdWNlIDo6IChhIC0+IGIgLT4gYSkgLT4gYSAtPiBbYl0gLT4gYVxuLy8gYWNjdW11bGF0ZSB2aWEgbGVmdC1mb2xkXG5mdW5jdGlvbiByZWR1Y2UgKGYsIHosIGEpIHtcbiAgdmFyIHIgPSB6XG4gIGZvciAodmFyIGkgPSAwLCBsID0gYS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICByID0gZihyLCBhW2ldLCBpKVxuICB9XG4gIHJldHVybiByXG59XG5cbi8vIHJlcGxhY2UgOjogYSAtPiBJbnQgLT4gW2FdXG4vLyByZXBsYWNlIGVsZW1lbnQgYXQgaW5kZXhcbmZ1bmN0aW9uIHJlcGxhY2UgKHgsIGksIGEpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBjb21wbGV4aXR5XG4gIGlmIChpIDwgMCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2kgbXVzdCBiZSA+PSAwJylcbiAgfVxuXG4gIHZhciBsID0gYS5sZW5ndGhcbiAgdmFyIGIgPSBuZXcgQXJyYXkobClcbiAgZm9yICh2YXIgaiA9IDA7IGogPCBsOyArK2opIHtcbiAgICBiW2pdID0gaSA9PT0gaiA/IHggOiBhW2pdXG4gIH1cbiAgcmV0dXJuIGJcbn1cblxuLy8gcmVtb3ZlIDo6IEludCAtPiBbYV0gLT4gW2FdXG4vLyByZW1vdmUgZWxlbWVudCBhdCBpbmRleFxuZnVuY3Rpb24gcmVtb3ZlIChpLCBhKSB7ICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGNvbXBsZXhpdHlcbiAgaWYgKGkgPCAwKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignaSBtdXN0IGJlID49IDAnKVxuICB9XG5cbiAgdmFyIGwgPSBhLmxlbmd0aFxuICBpZiAobCA9PT0gMCB8fCBpID49IGwpIHsgLy8gZXhpdCBlYXJseSBpZiBpbmRleCBiZXlvbmQgZW5kIG9mIGFycmF5XG4gICAgcmV0dXJuIGFcbiAgfVxuXG4gIGlmIChsID09PSAxKSB7IC8vIGV4aXQgZWFybHkgaWYgaW5kZXggaW4gYm91bmRzIGFuZCBsZW5ndGggPT09IDFcbiAgICByZXR1cm4gW11cbiAgfVxuXG4gIHJldHVybiB1bnNhZmVSZW1vdmUoaSwgYSwgbCAtIDEpXG59XG5cbi8vIHVuc2FmZVJlbW92ZSA6OiBJbnQgLT4gW2FdIC0+IEludCAtPiBbYV1cbi8vIEludGVybmFsIGhlbHBlciB0byByZW1vdmUgZWxlbWVudCBhdCBpbmRleFxuZnVuY3Rpb24gdW5zYWZlUmVtb3ZlIChpLCBhLCBsKSB7XG4gIHZhciBiID0gbmV3IEFycmF5KGwpXG4gIHZhciBqXG4gIGZvciAoaiA9IDA7IGogPCBpOyArK2opIHtcbiAgICBiW2pdID0gYVtqXVxuICB9XG4gIGZvciAoaiA9IGk7IGogPCBsOyArK2opIHtcbiAgICBiW2pdID0gYVtqICsgMV1cbiAgfVxuXG4gIHJldHVybiBiXG59XG5cbi8vIHJlbW92ZUFsbCA6OiAoYSAtPiBib29sZWFuKSAtPiBbYV0gLT4gW2FdXG4vLyByZW1vdmUgYWxsIGVsZW1lbnRzIG1hdGNoaW5nIGEgcHJlZGljYXRlXG5mdW5jdGlvbiByZW1vdmVBbGwgKGYsIGEpIHtcbiAgdmFyIGwgPSBhLmxlbmd0aFxuICB2YXIgYiA9IG5ldyBBcnJheShsKVxuICB2YXIgaiA9IDBcbiAgZm9yICh2YXIgeCwgaSA9IDA7IGkgPCBsOyArK2kpIHtcbiAgICB4ID0gYVtpXVxuICAgIGlmICghZih4KSkge1xuICAgICAgYltqXSA9IHhcbiAgICAgICsralxuICAgIH1cbiAgfVxuXG4gIGIubGVuZ3RoID0galxuICByZXR1cm4gYlxufVxuXG4vLyBmaW5kSW5kZXggOjogYSAtPiBbYV0gLT4gSW50XG4vLyBmaW5kIGluZGV4IG9mIHggaW4gYSwgZnJvbSB0aGUgbGVmdFxuZnVuY3Rpb24gZmluZEluZGV4ICh4LCBhKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsID0gYS5sZW5ndGg7IGkgPCBsOyArK2kpIHtcbiAgICBpZiAoeCA9PT0gYVtpXSkge1xuICAgICAgcmV0dXJuIGlcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xXG59XG5cbi8vIGlzQXJyYXlMaWtlIDo6ICogLT4gYm9vbGVhblxuLy8gUmV0dXJuIHRydWUgaWZmIHggaXMgYXJyYXktbGlrZVxuZnVuY3Rpb24gaXNBcnJheUxpa2UgKHgpIHtcbiAgcmV0dXJuIHggIT0gbnVsbCAmJiB0eXBlb2YgeC5sZW5ndGggPT09ICdudW1iZXInICYmIHR5cGVvZiB4ICE9PSAnZnVuY3Rpb24nXG59XG5cbi8qKiBAbGljZW5zZSBNSVQgTGljZW5zZSAoYykgY29weXJpZ2h0IDIwMTAtMjAxNiBvcmlnaW5hbCBhdXRob3Igb3IgYXV0aG9ycyAqL1xuXG4vLyBpZCA6OiBhIC0+IGFcbnZhciBpZCA9IGZ1bmN0aW9uICh4KSB7IHJldHVybiB4OyB9XG5cbi8vIGNvbXBvc2UgOjogKGIgLT4gYykgLT4gKGEgLT4gYikgLT4gKGEgLT4gYylcbnZhciBjb21wb3NlID0gZnVuY3Rpb24gKGYsIGcpIHsgcmV0dXJuIGZ1bmN0aW9uICh4KSB7IHJldHVybiBmKGcoeCkpOyB9OyB9XG5cbi8vIGFwcGx5IDo6IChhIC0+IGIpIC0+IGEgLT4gYlxudmFyIGFwcGx5ID0gZnVuY3Rpb24gKGYsIHgpIHsgcmV0dXJuIGYoeCk7IH1cblxuLy8gY3VycnkyIDo6ICgoYSwgYikgLT4gYykgLT4gKGEgLT4gYiAtPiBjKVxuZnVuY3Rpb24gY3VycnkyIChmKSB7XG4gIGZ1bmN0aW9uIGN1cnJpZWQgKGEsIGIpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIGNhc2UgMDogcmV0dXJuIGN1cnJpZWRcbiAgICAgIGNhc2UgMTogcmV0dXJuIGZ1bmN0aW9uIChiKSB7IHJldHVybiBmKGEsIGIpOyB9XG4gICAgICBkZWZhdWx0OiByZXR1cm4gZihhLCBiKVxuICAgIH1cbiAgfVxuICByZXR1cm4gY3VycmllZFxufVxuXG4vLyBjdXJyeTMgOjogKChhLCBiLCBjKSAtPiBkKSAtPiAoYSAtPiBiIC0+IGMgLT4gZClcbmZ1bmN0aW9uIGN1cnJ5MyAoZikge1xuICBmdW5jdGlvbiBjdXJyaWVkIChhLCBiLCBjKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgY29tcGxleGl0eVxuICAgIHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuICAgICAgY2FzZSAwOiByZXR1cm4gY3VycmllZFxuICAgICAgY2FzZSAxOiByZXR1cm4gY3VycnkyKGZ1bmN0aW9uIChiLCBjKSB7IHJldHVybiBmKGEsIGIsIGMpOyB9KVxuICAgICAgY2FzZSAyOiByZXR1cm4gZnVuY3Rpb24gKGMpIHsgcmV0dXJuIGYoYSwgYiwgYyk7IH1cbiAgICAgIGRlZmF1bHQ6cmV0dXJuIGYoYSwgYiwgYylcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGN1cnJpZWRcbn1cblxuZXhwb3J0cy5jb25zID0gY29ucztcbmV4cG9ydHMuYXBwZW5kID0gYXBwZW5kO1xuZXhwb3J0cy5kcm9wID0gZHJvcDtcbmV4cG9ydHMudGFpbCA9IHRhaWw7XG5leHBvcnRzLmNvcHkgPSBjb3B5O1xuZXhwb3J0cy5tYXAgPSBtYXA7XG5leHBvcnRzLnJlZHVjZSA9IHJlZHVjZTtcbmV4cG9ydHMucmVwbGFjZSA9IHJlcGxhY2U7XG5leHBvcnRzLnJlbW92ZSA9IHJlbW92ZTtcbmV4cG9ydHMucmVtb3ZlQWxsID0gcmVtb3ZlQWxsO1xuZXhwb3J0cy5maW5kSW5kZXggPSBmaW5kSW5kZXg7XG5leHBvcnRzLmlzQXJyYXlMaWtlID0gaXNBcnJheUxpa2U7XG5leHBvcnRzLmlkID0gaWQ7XG5leHBvcnRzLmNvbXBvc2UgPSBjb21wb3NlO1xuZXhwb3J0cy5hcHBseSA9IGFwcGx5O1xuZXhwb3J0cy5jdXJyeTIgPSBjdXJyeTI7XG5leHBvcnRzLmN1cnJ5MyA9IGN1cnJ5MztcblxuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcblxufSkpKTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXByZWx1ZGUuanMubWFwXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vbGliL2luZGV4Jyk7XG4iLCIndXNlIHN0cmljdCc7XG5cbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwge1xuICB2YWx1ZTogdHJ1ZVxufSk7XG5cbnZhciBfcG9ueWZpbGwgPSByZXF1aXJlKCcuL3BvbnlmaWxsJyk7XG5cbnZhciBfcG9ueWZpbGwyID0gX2ludGVyb3BSZXF1aXJlRGVmYXVsdChfcG9ueWZpbGwpO1xuXG5mdW5jdGlvbiBfaW50ZXJvcFJlcXVpcmVEZWZhdWx0KG9iaikgeyByZXR1cm4gb2JqICYmIG9iai5fX2VzTW9kdWxlID8gb2JqIDogeyAnZGVmYXVsdCc6IG9iaiB9OyB9XG5cbnZhciByb290OyAvKiBnbG9iYWwgd2luZG93ICovXG5cblxuaWYgKHR5cGVvZiBzZWxmICE9PSAndW5kZWZpbmVkJykge1xuICByb290ID0gc2VsZjtcbn0gZWxzZSBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IHdpbmRvdztcbn0gZWxzZSBpZiAodHlwZW9mIGdsb2JhbCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IGdsb2JhbDtcbn0gZWxzZSBpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgcm9vdCA9IG1vZHVsZTtcbn0gZWxzZSB7XG4gIHJvb3QgPSBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xufVxuXG52YXIgcmVzdWx0ID0gKDAsIF9wb255ZmlsbDJbJ2RlZmF1bHQnXSkocm9vdCk7XG5leHBvcnRzWydkZWZhdWx0J10gPSByZXN1bHQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHtcblx0dmFsdWU6IHRydWVcbn0pO1xuZXhwb3J0c1snZGVmYXVsdCddID0gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsO1xuZnVuY3Rpb24gc3ltYm9sT2JzZXJ2YWJsZVBvbnlmaWxsKHJvb3QpIHtcblx0dmFyIHJlc3VsdDtcblx0dmFyIF9TeW1ib2wgPSByb290LlN5bWJvbDtcblxuXHRpZiAodHlwZW9mIF9TeW1ib2wgPT09ICdmdW5jdGlvbicpIHtcblx0XHRpZiAoX1N5bWJvbC5vYnNlcnZhYmxlKSB7XG5cdFx0XHRyZXN1bHQgPSBfU3ltYm9sLm9ic2VydmFibGU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3VsdCA9IF9TeW1ib2woJ29ic2VydmFibGUnKTtcblx0XHRcdF9TeW1ib2wub2JzZXJ2YWJsZSA9IHJlc3VsdDtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0cmVzdWx0ID0gJ0BAb2JzZXJ2YWJsZSc7XG5cdH1cblxuXHRyZXR1cm4gcmVzdWx0O1xufTsiLCJjb25zdCBFdmVudEVtaXR0ZXIgPSByZXF1aXJlKCdldmVudHMnKTtcblxuZ2xvYmFsLmJ1cyA9IGdsb2JhbC5idXMgfHwgbmV3IEV2ZW50RW1pdHRlcigpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgYnVzOiBnbG9iYWwuYnVzLFxuICBtYWtlRW1pdHRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBFdmVudEVtaXR0ZXIoKTtcbiAgfVxufTtcbiIsImltcG9ydCB7IGJ1cyB9IGZyb20gJ3BhcnR5YnVzJztcbmltcG9ydCB7IG11dGF0aW9uV2F0Y2ggfSBmcm9tICcuL211dGF0aW9ub2JzZXJ2ZXInO1xuaW1wb3J0ICogYXMgbW9zdCBmcm9tICdtb3N0JztcblxubXV0YXRpb25XYXRjaCgnW2xlYXJuaW5nLWVsZW1lbnRdOm5vdChbdHJhbnNmb3JtZWRdKScsICdsZWFybmluZ0VsZW1lbnRzOjpmb3VuZCcpO1xuXG5sZXQgY2FjaGUgPSB7fTtcblxuY29uc3QgbGVhcm5pbmdFbGVtZW50JCA9IG1vc3QuZnJvbUV2ZW50KCdsZWFybmluZ0VsZW1lbnRzOjpmb3VuZCcsIGJ1cylcbiAgLnRhcChlbHMgPT4geyBpZihlbHMubGVuZ3RoID09PSAwKXsgYnVzLmVtaXQoJ3dhdGNoZXI6OnRyYW5zZm9ybUNvbXBsZXRlJyk7IGNhY2hlID0ge30gfSB9KVxuICAuZmxhdE1hcChlbHMgPT4gbW9zdC5mcm9tKGVscykgKVxuICAuZmlsdGVyKGVsID0+IGNhY2hlW2VsLmdldEF0dHJpYnV0ZSgnbGVhcm5pbmctZWxlbWVudC1yZWYnKV0gIT09IHRydWUgKVxuICAudGFwKGVsID0+IGNhY2hlW2VsLmdldEF0dHJpYnV0ZSgnbGVhcm5pbmctZWxlbWVudC1yZWYnKV0gPSB0cnVlIClcbiAgLnRhcChlbCA9PiBlbC5zZXRBdHRyaWJ1dGUoJ3RyYW5zZm9ybWVkJywgdHJ1ZSkgKTtcblxuZXhwb3J0IHsgbGVhcm5pbmdFbGVtZW50JCB9O1xuXG4vLyBlbCBjb250cmFjdCBhdHRyczpcbi8vIGxlYXJuaW5nLWVsZW1lbnQ9XCJwb2xsXCJcbi8vIGxlYXJuaW5nLWVsZW1lbnQtcmVmPVwiaWRlbnRpZmllclwiIC8vVE9ETzogZGlzY3VzcyB1bmlxdWVuZXNzIG9mIGlkZW50aWZpZXIsIGhvdyBpcyB0aGlzIG1hbmFnZWQ/XG4vLyB0cmFuc2Zvcm1lZCAod2hlbiBlbGVtZW50IGlzIHNlbnQgZm9yIHRyYW5zZm9ybWF0aW9uKVxuXG4vLyBFWEFNUExFIElNUExFTUVOVEFUSU9OOlxuLy9sZWFybmluZ0VsZW1lbnRzJFxuLy8gIC5maWx0ZXIoZWwgPT4gZWwuZ2V0QXR0cmlidXRlKCdsZWFybmluZy1lbGVtZW50JykgPT09ICdwb2xsJylcbi8vICAudGFwKGVsID0+IGVsLmFwcGVuZCgnPGRpdiBjbGFzcz1cIm1vdW50XCI+PC9kaXY+JykgKVxuLy8uZHJhaW4oKSIsImltcG9ydCB7IGJ1cyB9IGZyb20gJ3BhcnR5YnVzJztcblxuY29uc3QgTXV0YXRpb25PYnNlcnZlciA9IHdpbmRvdy5NdXRhdGlvbk9ic2VydmVyIHx8IHdpbmRvdy5XZWJLaXRNdXRhdGlvbk9ic2VydmVyIHx8IHdpbmRvdy5Nb3pNdXRhdGlvbk9ic2VydmVyO1xuXG5sZXQgbXV0YXRpb25MaXN0ZW5lcnMgPSBbXTtcblxuY29uc3Qgb2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcihmdW5jdGlvbihtdXRhdGlvbnMpIHtcbiAgbXV0YXRpb25MaXN0ZW5lcnMuZm9yRWFjaChmdW5jdGlvbih7IHNlbGVjdG9yLCBlbWl0TWVzc2FnZSB9KXtcbiAgICAvL3NlbGVjdG9yOiAnW2xlYXJuaW5nLWVsZW1lbnRdOm5vdChbdHJhbnNmb3JtZWRdKSdcbiAgICAvL2VtaXRNZXNzYWdlOiBgbGVhcm5pbmdFbGVtZW50Ojpmb3VuZGBcbiAgICBjb25zdCB0cmFuc2Zvcm1hYmxlcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpO1xuICAgIGlmKHRyYW5zZm9ybWFibGVzLmxlbmd0aCA+IDApeyBidXMuZW1pdChlbWl0TWVzc2FnZSwgdHJhbnNmb3JtYWJsZXMpOyB9XG4gIH0pXG59KTtcblxub2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudCwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbmNvbnN0IG11dGF0aW9uV2F0Y2ggPSAoc2VsZWN0b3IsIGVtaXRNZXNzYWdlKSA9PiB7XG4gIG11dGF0aW9uTGlzdGVuZXJzLnB1c2goe3NlbGVjdG9yLCBlbWl0TWVzc2FnZX0pXG59O1xuXG5leHBvcnQgeyBtdXRhdGlvbldhdGNoIH07XG4iLCJpbXBvcnQgeyBtdXRhdGlvbldhdGNoIH0gZnJvbSAnLi9tdXRhdGlvbm9ic2VydmVyJztcbmltcG9ydCB7IGxlYXJuaW5nRWxlbWVudCQgfSBmcm9tICcuL2xlYXJuaW5nRWxlbWVudFdhdGNoJztcblxuZXhwb3J0IHtcbiAgbXV0YXRpb25XYXRjaCxcbiAgbGVhcm5pbmdFbGVtZW50JFxufTsiXX0=
