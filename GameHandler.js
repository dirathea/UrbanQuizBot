/**
 * Created by dira on 9/25/16.
 */
'use strict';

const Promise = require("bluebird");
const Scrapper = require('./scrapper');

const TIMEOUT_IN_SECOND = 30;
const TIMEOUT_DURATION = TIMEOUT_IN_SECOND * 1000;
const quizStatement = "Guess the word by the following definition: \n\n";

class GameHandler {
    constructor() {
        this.listener = [];
        this.timeout = [];
    }

    startGame(playerId, timeoutAction) {
        return new Promise((resolve, reject) => {
            if (this.listener[playerId]) {
                // Game Already running
                reject({
                    code: 0,
                    message: `Game for ${playerId} is already running`,
                });
            } else {
                const scrapper = new Scrapper();
                scrapper.getWord().then((result) => {
                    this.listener[playerId] = {
                        index: 1,
                        clues: result
                    };
                    this.timeout[playerId] = setTimeout(timeoutAction, TIMEOUT_DURATION);
                    resolve({
                        index: 1,
                        total: result.length,
                        word: result[0].word,
                        clue: result[0].meaning,
                    });
                });
            }
        });
    };
}

module.exports = GameHandler;
