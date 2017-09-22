

var inputMask = require('./mask'),
    inputBind = require('./bind');

module.exports = function inputService (_service) {

  var formats = {},
      service = _service || {},
      error_messages = {};

  service.defineFormat = function (format_name, format_options) {
    var new_format = Object.create( typeof format_options === 'string' ? { mask: format_options } : format_options );

    if( typeof new_format.mask === 'string' ) new_format.mask = inputMask(format_options.mask);
    else if( new_format.mask instanceof Function ) new_format.mask = format_options.mask;
    else if( new_format.mask ) throw new Error('mask should be a string or a function');

    formats[format_name] = new_format;
  };

  service.setErrorMessages = function (format_name, messages) {
    if( messages === undefined ) error_messages = format_name;
    else error_messages[format_name] = messages;
  };

  service.getErrorMessages = function (name) {
    return error_messages[name] || error_messages.default || null;
  };

  service.getFormat = function (format_name) {
    return formats[format_name];
  };

  service.mask = inputMask;

  service.bindTo = inputBind;

  return service;
};
