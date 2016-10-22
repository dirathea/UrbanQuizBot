'use strict';
const Promise = require("bluebird");
const retry = require('bluebird-retry');
const url = require('url');
const _ = require('lodash');

const osmosis = require('osmosis');

const URBAN_DICTIONARY_BASE_URL = 'http://www.urbandictionary.com/';
const URBAN_DICTIONARY_RANDOM_URL = [URBAN_DICTIONARY_BASE_URL, 'random.php'].join('/');
const URBAN_DICTIONARY_DEFINITIONS = url.resolve(URBAN_DICTIONARY_BASE_URL, 'define.php');

class Scrapper {
    constructor() {

    }

    getWord() {
        return new Promise((resolve, reject) => {
            retry(this._getWord).done((result) => {
                return resolve(result);
            });
        });
    }

    _getWord() {
        return new Promise((resolve, reject) => {
            let quiz = [];
            osmosis.get(URBAN_DICTIONARY_RANDOM_URL)
                .find('.def-panel')
                .set({
                    'word': '.word',
                    'meaning': '.meaning'
                })
                .data(function (result) {
                    if (!_.isEmpty(result) && result.meaning.length < 200) {
                        quiz.push(result);
                    }
                })
                .done(function () {
                    console.log('total of clue', quiz.length);

                    if (quiz.length > 0) {
                        resolve(quiz.slice(0, 3).map((clue) => {
                            clue.meaning = clue.meaning.replace(new RegExp(clue.word, 'g'), '_____');
                            return clue;
                        }));
                    } else {
                        reject('Failed to get clue');
                    }
                })
                .log(console.log)
                .error(console.log)
                .debug(console.log);
        });
    }

    findWord(word) {
        return new Promise((resolve, reject) => {
            const queryword = word.split(' ').join('+'),
                definitionUrl = `${URBAN_DICTIONARY_DEFINITIONS}?term=${queryword}`;
            const meaning = [];
            osmosis.get(definitionUrl)
                .find('.def-panel')
                .set({
                    'word': '.word',
                    'meaning': '.meaning'
                })
                .data(function (result) {
                    if (!_.isEmpty(result)) {
                        meaning.push(result);
                    }
                })
                .done(function () {
                    resolve(meaning);
                })
                .log(console.log)
                .error(console.log)
                .debug(console.log)
        });
    }
}

module.exports = Scrapper;
