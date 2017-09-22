/* global navigator */

const _noop = function () {};
const IS_ANDROID = typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Android') !== -1;

// https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation
// https://developer.mozilla.org/es/docs/Web/API/ValidityState
function getValidityError (validity) {
  for( var key in validity ) {
    if( validity[key] ) return key.replace(/([a-z])([A-Z])/g, function (_matched, a, b) {
      return a + '_' + b.toLowerCase();
    });
  }
  return 'invalid';
}

export default function inputBind (input, options) {
  options = options || {};

  var previous_value = input.value,
      mask_filled = null,
      customError = options.customError || _noop,
      validation_message = '';

  var _inputMask = options.mask instanceof Function ? options.mask : null;

  var applyMask = _inputMask ? function () {
    var result = _inputMask(input.value, previous_value);

    if( !result ) return;

    input.value = result.value;
    mask_filled = result.filled;
  } : _noop;

  function getErrorKey () {
    input.setCustomValidity('');
    validation_message = input.validationMessage;
    if( !input.value && input.getAttribute('required') !== null ) return 'required';
    if( _inputMask && !mask_filled ) return 'uncomplete';
    if( input.validity && !input.validity.valid ) return getValidityError(input.validity);

    return customError(input.value, mask_filled);
  }

  function checkValidity () {
    onChange.apply(input, [input.value, previous_value, mask_filled, getErrorKey(), validation_message ]);
  }

  var onChange = options.onChange || _noop;

  function onInput (_e) {
    applyMask();
    previous_value = input.value;
    checkValidity();
  }

  function onBlur (e) {
    if(input.value !== previous_value) onInput(e);
  }

  input.addEventListener( IS_ANDROID ? 'keyup' : 'input' , onInput, options.useCapture );
  input.addEventListener('blur' , onBlur, options.useCapture );

  return {
    checkValidity: checkValidity,
    unbind: function () {
      input.removeEventListener( IS_ANDROID ? 'keyup' : 'input' , onInput, options.useCapture );
      input.removeEventListener('blur' , onBlur, options.useCapture );
    }
  };
}
