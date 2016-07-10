'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = tryDefer;

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function tryDefer() {
  var condition = arguments.length <= 0 || arguments[0] === undefined ? function () {
    return true;
  } : arguments[0];

  var _queue = void 0;
  var enqueue = function enqueue(fn, args, errors, attempt) {
    return _queue.push({ fn: fn, args: args, errors: errors, attempt: attempt });
  };

  function replay() {
    var queue = _queue;
    _queue = [];
    while (queue.length > 0) {
      attempt(queue.shift());
    }
  }

  function attempt(_ref) {
    var fn = _ref.fn;
    var args = _ref.args;
    var _ref$errors = _ref.errors;
    var errors = _ref$errors === undefined ? [] : _ref$errors;
    var _ref$attempt = _ref.attempt;
    var attempt = _ref$attempt === undefined ? 0 : _ref$attempt;

    try {
      if (condition()) return fn.apply(undefined, _toConsumableArray(args));
      enqueue(fn, args, errors, attempt + 1);
      return { deferred: true, attempt: attempt };
    } catch (err) {
      enqueue(fn, args, [].concat(_toConsumableArray(errors), [err]), attempt + 1);
      return { deferred: false, err: err, attempt: attempt };
    }
  }

  function serialize() {
    var serialized = require('serialize-javascript')({ replay: replay });
    return '\nif(typeof window === \'object\') {\n  var defer = JSON.parse(' + serialized + ');\n  defer.replay();\n}';
  }

  function reactReplay(React) {
    var serialized = serialize();
    return function (props) {
      return React.createElement('script', { dangerouslySetInnerHTML: { __html: serialized } });
    };
  }

  var defer = { replay: replay, serialize: serialize, reactReplay: reactReplay };

  /** Returns a 2 item array of [ thunk, defer ] that wraps a function and functions for replaying in various scenarios. */
  return [function (fn) {
    return function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return attempt({ fn: fn, args: args });
    };
  }, defer];
}
