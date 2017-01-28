
var matchValues = /{([a-z]+\:)?[\w\-]+}/g,
    matchParts = /{(([a-z]+)\:)?([\w\-]+)}/;

module.exports = valueMask;

var transformers = {
  up: function (value) { return value.toUpperCase(); },
  lo: function (value) { return value.toLowerCase(); }
};

function valueMask (pattern) {
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

  return function (value, previousValue) {
    var separators = markSeparators.slice(),
        result = '',
        letters = value.split(''),
        i, n, letter,
        p = 0;

    for( i = 0, n = letters.length; i < n ; i++ ) {
      letter = patterns[p].transform ? patterns[p].transform(letters[i]) : letters[i];

      if( !patterns[p] ) return { value: result, filled: true };
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

    return {
      value: previousValue && value.length < previousValue.length ? result.substr(0, result.length - 1) : result + separators[p],
      filled: p = patterns.length
    };
  };
}
