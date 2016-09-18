'use strict';
const Promise = require("bluebird");
const url = require('url');

const osmosis = require('osmosis');

let URBAN_DICTIONARY_BASE_URL = 'http://www.urbandictionary.com/';
let URBAN_DICTIONARY_RANDOM_URL = [URBAN_DICTIONARY_BASE_URL, 'random.php'].join('/');
let URBAN_DICTIONARY_DEFINITIONS = url.resolve(URBAN_DICTIONARY_BASE_URL, 'define.php');

class Scrapper {
  constructor() {

  }

  getWord() {
    return new Promise(function(resolve, reject) {
      let quiz;
      osmosis.get(URBAN_DICTIONARY_RANDOM_URL)
        .set({
          'word': '.def-panel .word',
          'meaning': '.def-panel .meaning'
        })
        .data(function (result) {
          quiz = result;
        })
        .done(function () {
          resolve(quiz);
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log);
    });
  }

  findWord(word) {
    return new Promise(function(resolve, reject) {
      const queryword = word.split(' ').join('+'),
        definitionUrl = URBAN_DICTIONARY_DEFINITIONS + '?term=' + queryword;
      let meaning;
      osmosis.get(definitionUrl)
        .set({
          'word': '.def-panel .word',
          'meaning': '.def-panel .meaning'
        })
        .data(function (result) {
          meaning = result;
        })
        .done(function () {
          resolve(meaning)
        })
        .log(console.log)
        .error(console.log)
        .debug(console.log)
    });
  }
}

module.exports = Scrapper;
