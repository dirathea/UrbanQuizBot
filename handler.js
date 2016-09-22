'use strict';
const Promise = require("bluebird");
const Scrapper = require('./scrapper');
const ChatBottleHandler = require('./ChatBottleHandler');
const Botan = require('botanio');

const TIMEOUT_IN_SECOND = 30;
const TIMEOUT_DURATION = TIMEOUT_IN_SECOND * 1000;
const quizStatement = "Guess the word by the following definition: \n\n";

const botan = Botan(process.env.BOTAN_TOKEN);
const chatBottleHandler = new ChatBottleHandler();

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
        chatBottleHandler.incomingMessageProcessor(message);
        botan.track(message, 'start');
        if (!this.listener[message.chat.id]) {
            let scrapper = new Scrapper();
            return Promise.resolve().then(() => {
                if (this.listener[message.chat.id]) {
                    return Promise.reject('Game Already Running');
                }
                return scrapper.getWord();
            }).then((result) => {
                const firstClue = `${quizStatement}(1/${result.length})\n${result[0].meaning}`;
                Promise.join(this._sendMessage(message.chat.id, firstClue),
                    Promise.resolve(result),
                    (sent, quiz) => {
                        chatBottleHandler.outgoingMessageProcessor(sent.message_id, firstClue, message.chat.id);
                        this.listener[message.chat.id] = {
                            index: 1,
                            clues: quiz,
                        };
                        this.timeout[message.chat.id] = {
                            time: Date.now(),
                            id: setTimeout(this._quizTimeout.bind(this, message.chat.id), TIMEOUT_DURATION),
                        };
                    }
                )
                ;
            }).catch((error) => {
                console.log(error);
            });
        }
    }

    answerProcessor(message) {
        if (this.listener[message.chat.id] && !message.text.startsWith('/')) {
            if (this.listener[message.chat.id].clues[0].word.toLowerCase() == message.text.toLowerCase().trim()) {
                clearTimeout(this.timeout[message.chat.id].id);

                const correctAnswer = `Great! The right answer is : ${this.listener[message.chat.id].clues[0].word}`;

                this._sendMessage(message.chat.id, correctAnswer).then((msg) => {
                    chatBottleHandler.outgoingMessageProcessor(msg.message_id, correctAnswer, message.chat.id);
                });
                this.listener[message.chat.id] = undefined;
                this.timeout[message.chat.id] = undefined;
            }
        }
    }

    getClueProcessor(message) {
        chatBottleHandler.incomingMessageProcessor(message);
        botan.track(message, 'newclue');
        if (this.listener[message.chat.id] && this.listener[message.chat.id].index < this.listener[message.chat.id].clues.length) {
            clearTimeout(this.timeout[message.chat.id].id);

            const timeRemaining = TIMEOUT_DURATION - (Date.now() - this.timeout[message.chat.id].time);
            const quiz = this.listener[message.chat.id];
            const newClue = `${quizStatement}(${quiz.index + 1}/${quiz.clues.length})\n${quiz.clues[quiz.index].meaning}`;

            this._sendMessage(message.chat.id, newClue).then((msg) => {
                chatBottleHandler.outgoingMessageProcessor(msg.message_id, newClue, message.chat.id);
                this.listener[message.chat.id].index += 1;
                this.timeout[message.chat.id].id = setTimeout(this._quizTimeout.bind(this, message.chat.id), Math.max(timeRemaining, 0));
            });
        }
    }

    _quizTimeout(chatId) {
        const timeoutMessage = `Timeout! The right answer for previous question is : ${this.listener[chatId].clues[0].word}`;

        this._sendMessage(chatId, timeoutMessage).then((msg) => {
            chatBottleHandler.outgoingMessageProcessor(msg.message_id, timeoutMessage, chatId);
        });
        this.listener[chatId] = undefined;
        this.timeout[chatId] = undefined;
    }
}

module.exports = Handler;
