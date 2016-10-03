/**
 * Created by dira on 10/3/16.
 */

'use strict';
const Promise = require("bluebird");
const retry = require('bluebird-retry');
const osmosis = require('osmosis');
const _ = require('lodash');

const KITAB_GAUL_RANDOM_ENDPOINT = 'https://kitabgaul.com/words/random';

class IndonesianScrapper {
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
        return new Promise(function (resolve, reject) {
            let quiz = [];
            osmosis.get(KITAB_GAUL_RANDOM_ENDPOINT)
                .find('.entryDetail')
                .set({
                    'word': '.word a',
                    'meaning': '.definition'
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
}

module.exports = IndonesianScrapper;
