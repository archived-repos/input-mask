/* global define */

(function (root) {

var isAndroid = root.navigator && root.navigator.userAgent.indexOf('Android') !== -1;

var matchValues = /{([a-z]+\:)?[\w\-]+}/g,
    matchParts = /{(([a-z]+)\:)?([\w\-]+)}/;

var transformers = {
  up: function (value) { return value.toUpperCase(); },
  lo: function (value) { return value.toLowerCase(); }
};

function inputMask (pattern) {
  var matchDigit = /\d/,
      markSeparators = pattern.split(matchValues).filter(function (v, i) { return !(i%2); }),
      patterns = pattern.match(matchValues).map(function (brackets) {
        if( brackets === '{9}' ) return matchDigit;
        var matches = brackets.match(matchParts);
        var pat = new RegExp('[' + matches[3] + ']');
        if( matches[2] ) {
          return {
            transform: transformers[matches[2]],
            test: pat.test.bind(pat)
          };
        }

        return pat;
      });

  function mask (value, previousValue) {
    var separators = markSeparators.slice(),
        result = '',
        letters = value.split(''),
        i, n, letter,
        p = 0;

    for( i = 0, n = letters.length; i < n ; i++ ) {
      if( !patterns[p] ) return { value: result, filled: true };
      letter = patterns[p].transform ? patterns[p].transform(letters[i]) : letters[i];

      if( patterns[p].test(letter) ) {
        result += separators[p] + letter;
        p++;
      } else if( letter === separators[p][0] ) {
        result += separators[p][0];
        separators[p] = separators[p].substr(1);
      } else {
        return { value: result, filled: false };
      }
    }

    if( previousValue && value.length < previousValue.length ) {
      return {
        value: previousValue.substr(-1) === separators[p][0] ? result.substr(0, result.length - 1) : result,
        filled: p === patterns.length
      };
    }

    return {
      value: result + separators[p],
      filled: p === patterns.length
    };
  }

  var noop = function (value) { return value; };

  function processValidators (input, result, validators) {
    var validationErrors = {};

    for( var key in validators ) validationErrors[key] = validators[key](input, result);
    return validationErrors;
  }

  mask.bindTo = function (input, options) {
    options = options || {};

    var previousValue = input.value,
        preMask = options.preMask || noop,
        postMask = options.postMask || noop,
        eventNames = [isAndroid ? 'keyup' : 'input', 'blur'],
        listeners = {};

    var on = function (eventName, handler) {
      if( typeof handler !== 'function' ) throw new Error('handler should be a function');
      listeners[eventName] = listeners[eventName] || [];
      listeners[eventName].push(handler);
    };

    var emit = function (eventName, args) {
      (listeners[eventName] || []).forEach(function (listener) {
        listener.apply(input, args || []);
      });
    };

    var handler = function (_e) {
      var newValue = preMask(input.value, previousValue),
          result = postMask( mask(newValue === undefined ? input.value : newValue, previousValue), previousValue ),
          validationResult;

      input.value = result.value;

      if( options.preValidator ) {
        validationResult = options.preValidator(input, result);
        if( validationResult !== undefined ) {
          input.setCustomValidity( validationResult ? (options.errorMessages[validationResult] || validationResult) : '' );
          return;
        }
      }

      if( options.validators ) {
        validationResult = processValidators(input, result, options.validators);
        if( Object.keys(validationResult).length ) {
          input.setCustomValidity(
            options.errorMessages ?
            options.errorMessages[ validationResult[Object.keys(validationResult)[0]] ] :
            validationResult[Object.keys(validationResult)[0]]
          );
          return;
        } else {
          input.setCustomValidity('');
        }
      }

      emit('change');
    };

    eventNames.forEach(function (eventName) {
      input.addEventListener(eventName, handler, options.useCapture );
    });

    return {
      on: on,
      emit: emit,
      unbind: function ( _eventNames ) {
        ( _eventNames || eventNames ).forEach(function (eventName) {
          input.removeEventListener(eventName, handler, options.useCapture );
        });
      }
    };

  };

  return mask;
}


if( typeof exports === 'object' && typeof module !== 'undefined' ) {
    // CommonJS
    module.exports = inputMask;
} else if( typeof define === 'function' && define.amd ) {
    // AMD. Register as an anonymous module.
    define([], function () { return inputMask; });
} else {
    // Browser globals
    root.mask = inputMask;
}

})(this);
