'use strict';
const Promise = require("bluebird");
const Scrapper = require('./scrapper.js');
const TIMEOUT_IN_SECOND = 30;

class Handler {
  constructor(bot) {
    this.bot = bot;
    this.listener = [];
    this.timeout = [];
  }

  _sendMessage(chatId, content, options) {
    this.bot.sendMessage(chatId, content, options);
  }

  startGameProcessor(message) {
    let scrapper = new Scrapper();
    Promise.bind(this).then(function() {
      if (this.listener[message.chat.id]) {
        return Promise.reject('Game Already Running');
      }
      return scrapper.getWord();
    }).then(function(result) {
      const quizStatement = "Guess the word by the following definition: \n\n"
      Promise.join(this._sendMessage(message.chat.id, quizStatement + result.meaning),
        Promise.resolve(result),
        function(sent, quiz) {
          this.listener[message.chat.id] = quiz.word;
          this.timeout[message.chat.id] = setTimeout(this._quizTimeout.bind(this, message.chat.id), TIMEOUT_IN_SECOND * 1000);
        }.bind(this));
    }).catch(function(error) {
      console.log(error);
    });
  }

  answerProcessor(message) {
    if (this.listener[message.chat.id]) {
      console.log('in listening state for', message.chat.id);
      if (this.listener[message.chat.id].toLowerCase() == message.text.toLowerCase().trim()) {
        const correctAnswer = "Great! The right answer is : ";
        this._sendMessage(message.chat.id, correctAnswer + this.listener[message.chat.id]);
        this.listener[message.chat.id] = undefined;
        clearTimeout(this.timeout[message.chat.id]);
      }
    }
  }

  _quizTimeout(chatId) {
    this._sendMessage(chatId, 'Timeout! The right answer for previous question is : ' + this.listener[chatId]);
    this.listener[chatId] = undefined;
  }
}

module.exports = Handler;
