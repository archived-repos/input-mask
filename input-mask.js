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

  mask.bindTo = function (input, options) {
    options = options || {};

    var previousValue = input.value,
        errorMessages = options.errorMessages,
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

    var validityEmit = function (result, validationMessage) {
      input.setCustomValidity(validationMessage);
      emit('change', [result.value, result.filled]);
    };

    var updateInput = function (result) {
      var validationError;

      previousValue = result.value;
      input.value = result.value;

      if( !errorMessages ) return emit('change');

      if( options.preValidator ) {
        validationError = options.preValidator(result.value, result.filled, input, mask);

        if( validationError !== undefined ) return validityEmit(result, errorMessages[validationError]);
      }

      if( input.getAttribute('required') !== null && !input.value ) {
        return validityEmit(result, errorMessages.required);
      }

      if( options.validators ) {
        for( var key in options.validators ) {
          validationError = !options.validators[key](result.value, result.filled, input, mask);
          if( validationError ) return validityEmit(result, errorMessages[key]);
        }
      }

      validityEmit(result, result.filled ? '' : ( errorMessages.uncomplete || errorMessages.pattern ) );
    };

    var handler = function (_e) {
      var result = options.preMask ? options.preMask(input.value, previousValue) : null;

      if( result ) return updateInput(result);

      result = mask(input.value, previousValue);

      if( !options.postMask ) return updateInput( result );

      result = { value: options.postMask(result.value, previousValue) };
      result.filled = mask(result.value).filled;

      return updateInput(result);
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
