'use strict';
const Promise = require("bluebird");
const Scrapper = require('./scrapper');
const ChatBottleHandler = require('./ChatBottleHandler');
const GameHandler = require('./GameHandler');
const Botan = require('botanio');

const TIMEOUT_IN_SECOND = 30;
const TIMEOUT_DURATION = TIMEOUT_IN_SECOND * 1000;
const quizStatement = "Guess the word by the following definition:";
const rateUrbanQuiz = "\nRate UrbanQuizBot on : https://telegram.me/storebot?start=urbanquizbot";

const botan = Botan(process.env.BOTAN_TOKEN);
const chatBottleHandler = new ChatBottleHandler();
const gameHandler = new GameHandler();

class Handler {
    constructor(bot) {
        this.bot = bot;
    }

    _sendMessage(chatId, content, options) {
        return this.bot.sendMessage(chatId, content, options);
    }

    startGameProcessor(message, language) {
        chatBottleHandler.incomingMessageProcessor(message);
        botan.track(message, 'start');
        return gameHandler.startGame(message.chat.id, language, (answer) => {
            this._quizTimeout(message.chat.id, answer);
        }).then((result) => {
            const firstClue = `${quizStatement}\n${result.hidden}\n(${result.index}/${result.total})\n${result.clue}`;
            this._sendMessage(message.chat.id, firstClue);
        }).catch((error) => {
            console.log(error);
        });
    }

    answerProcessor(message) {
        if (message.text && !message.text.startsWith('/')) {
            gameHandler.answerQuiz(message.chat.id, message.text.toLowerCase()).then((answer) => {
                const correctAnswer = `Great! The right answer is : ${answer}${rateUrbanQuiz}`;
                this._sendMessage(message.chat.id, correctAnswer).then((msg) => {
                    chatBottleHandler.outgoingMessageProcessor(msg.message_id, correctAnswer, message.chat.id);
                });
            }).catch((err) => {
                if (err.code === 1) {
                    this._sendMessage(message.chat.id, `Hi There! Welcome to Urban Quiz! To begin, please write /startgame to play in English language, or /startgameindonesia to play in Indonesian language`);
                }
            });
        }
    }

    getClueProcessor(message) {
        chatBottleHandler.incomingMessageProcessor(message);
        botan.track(message, 'newclue');
        gameHandler.requestNewClue(message.chat.id).then((quiz) => {
            const newClue = `${quizStatement}\n${quiz.hidden}\n(${quiz.index}/${quiz.total})\n${quiz.clue}`;
            this._sendMessage(message.chat.id, newClue);
        });
    }

    _quizTimeout(chatId, answer) {
        const timeoutMessage = `Timeout! The right answer for previous question is : ${answer}${rateUrbanQuiz}`;

        this._sendMessage(chatId, timeoutMessage).then((msg) => {
            chatBottleHandler.outgoingMessageProcessor(msg.message_id, timeoutMessage, chatId);
        });
    }
}

module.exports = Handler;
