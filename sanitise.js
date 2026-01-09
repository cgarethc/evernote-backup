const emojiStrip = require('emoji-strip');
const accents = require('remove-accents');
const wanakana = require('wanakana');

const macronMap = {
  'ā': 'aa',
  'ē': 'ee',
  'ī': 'ii',
  'ō': 'oo',
  'ū': 'uu',
  'Ā': 'AA',
  'Ē': 'EE',
  'Ī': 'II',
  'Ō': 'OO',
  'Ū': 'UU'
};

/*
< (less than)
> (greater than)
: (colon)
" (double quote)
/ (forward slash)
\ (backslash)
| (vertical bar or pipe)
? (question mark)
* (asterisk)
*/
const OEMreservedMap = {
  '<': '[lt]',
  '>': '[gt]',
  ':': ' ',
  '"': `'`,
  '/': ' ',
  '\\': ' ',
  '|': ' ',
  '?': ' ',
  '*': ' '
};

exports.sanitiseMacrons = (text) => {
  return text.replace(/[āēīōūĀĒĪŌŪ]/g, (match) => {
    return macronMap[match];
  });
}

exports.sanitiseOEMReserved = (text) => {
  return text.replace(/[<>:"/\\|?*]/g, (match) => {
    return OEMreservedMap[match];
  });
}

exports.sanitiseSmartQuotes = (text) => {
  return text.replace(/['']/g, "'").replace(/[""]/g, '"');
};

exports.sanitiseJapanese = (text) => {
  // Convert hiragana and katakana to romaji
  let result = wanakana.toRomaji(text);
  // Remove any remaining kanji (CJK Unified Ideographs ranges)
  result = result.replace(/[\u4e00-\u9faf\u3400-\u4dbf\uf900-\ufaff]/g, '');
  return result;
};

exports.sanitise = (text) => {
  let sanitised = text;
  sanitised = exports.sanitiseMacrons(sanitised);
  sanitised = exports.sanitiseJapanese(sanitised);
  sanitised = emojiStrip(sanitised);
  sanitised = accents.remove(sanitised);
  sanitised = exports.sanitiseSmartQuotes(sanitised);
  sanitised = exports.sanitiseOEMReserved(sanitised);
  return sanitised;
};