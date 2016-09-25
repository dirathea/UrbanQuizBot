/**
 * Created by dira on 9/25/16.
 */
'use strict';

const Promise = require("bluebird");
const Scrapper = require('./scrapper');

const TIMEOUT_IN_SECOND = 30;
const TIMEOUT_DURATION = TIMEOUT_IN_SECOND * 1000;

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
                        index: 0,
                        clues: result
                    };
                    this.timeout[playerId] = {
                        time: Date.now(),
                        id: setTimeout(this._timeoutAction(timeoutAction), TIMEOUT_DURATION),
                        action: timeoutAction,
                    };
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

    requestNewClue(playerId) {
        return new Promise((resolve, reject) => {
            if (!this.listener[playerId]) {
                reject({
                    code: 1,
                    message: `No game running for ${playerId}`,
                });
            } else if (!(this.listener[playerId].index < this.listener[playerId].clues.length)) {
                reject({
                    code: 2,
                    message: `Run out of clues for ${playerId}`,
                });
            } else {
                clearTimeout(this.timeout[playerId].id);
                const timeRemaining = TIMEOUT_DURATION - (Date.now() - this.timeout[playerId].time);
                const quiz = this.listener[playerId];
                this.listener[playerId].index += 1;
                this.timeout[playerId].id = setTimeout(this._timeoutAction(this.timeout[playerId].action), timeRemaining);
                resolve({
                    index: quiz.index + 1,
                    total: quiz.clues.length,
                    word: quiz.clues[0].word,
                    clue: quiz.clues[quiz.index].meaning,
                });
            }
        });
    }

    _timeoutAction(playerId, actions) {
        this.listener[playerId] = undefined;
        this.timeout[playerId] = undefined;
        actions();
    }
}

module.exports = GameHandler;
