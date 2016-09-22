'use strict';
const Promise = require("bluebird");
const Scrapper = require('./scrapper.js');
const TIMEOUT_IN_SECOND = 30;
const TIMEOUT_DURATION = TIMEOUT_IN_SECOND * 1000;
const quizStatement = "Guess the word by the following definition: \n\n";

class Handler {
    constructor(bot) {
        this.bot = bot;
        this.listener = [];
        this.timeout = [];
    }

    _sendMessage(chatId, content, options) {
        return this.bot.sendMessage(chatId, content, options);
    }

    startGameProcessor(message) {
        if (!this.listener[message.chat.id]) {
            let scrapper = new Scrapper();
            return Promise.resolve().then(() => {
                if (this.listener[message.chat.id]) {
                    return Promise.reject('Game Already Running');
                }
                return scrapper.getWord();
            }).then((result) => {
                Promise.join(this._sendMessage(message.chat.id, `${quizStatement}(1/${result.length})\n${result[0].meaning}`),
                    Promise.resolve(result),
                    function (sent, quiz) {
                        this.listener[message.chat.id] = {
                            index: 1,
                            clues: quiz,
                        };
                        this.timeout[message.chat.id] = {
                            time: Date.now(),
                            id: setTimeout(this._quizTimeout.bind(this, message.chat.id), TIMEOUT_DURATION),
                        };
                    }.bind(this));
            }).catch((error) => {
                console.log(error);
            });
        }
    }

    answerProcessor(message) {
        if (this.listener[message.chat.id] && !message.text.startsWith('/')) {
            console.log('in listening state for', message.chat.id);
            if (this.listener[message.chat.id].clues[0].word.toLowerCase() == message.text.toLowerCase().trim()) {
                clearTimeout(this.timeout[message.chat.id].id);
                const correctAnswer = "Great! The right answer is : ";
                this._sendMessage(message.chat.id, `${correctAnswer}${this.listener[message.chat.id].clues[0].word}`);
                this.listener[message.chat.id] = undefined;
                this.timeout[message.chat.id] = undefined;
            }
        }
    }

    getClueProcessor(message) {
        if (this.listener[message.chat.id] && this.listener[message.chat.id].index < this.listener[message.chat.id].clues.length) {
            clearTimeout(this.timeout[message.chat.id].id);
            const timeRemaining = TIMEOUT_DURATION - (Date.now() - this.timeout[message.chat.id].time);
            const quiz = this.listener[message.chat.id];
            this._sendMessage(message.chat.id, `${quizStatement}(${quiz.index + 1}/${quiz.clues.length})\n${quiz.clues[quiz.index].meaning}`).then(() => {
                this.listener[message.chat.id].index += 1;
                this.timeout[message.chat.id].id = setTimeout(this._quizTimeout.bind(this, message.chat.id), Math.max(timeRemaining, 0));
            });
        }
    }

    _quizTimeout(chatId) {
        this._sendMessage(chatId, `Timeout! The right answer for previous question is : ${this.listener[chatId].clues[0].word}`);
        this.listener[chatId] = undefined;
        this.timeout[chatId] = undefined;
    }
}

module.exports = Handler;
