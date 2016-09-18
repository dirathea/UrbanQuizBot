'use strict';
const Promise = require("bluebird");
const Scrapper = require('./scrapper.js');

class Handler {
  constructor(bot) {
    this.bot = bot;
    this.listener = [];
  }

  _sendMessage(chatId, content, options) {
    this.bot.sendMessage(chatId, content, options);
  }

  startGameProcessor(message) {
    let scrapper = new Scrapper();
    Promise.bind(this).then(function () {
      return scrapper.getWord();
    }).then(function (result) {
      const quizStatement = "Guess the word by the following definition: \n\n"
      this._sendMessage(message.chat.id, quizStatement + result.meaning);
      this.listener[message.chat.id] = result.word;
    }).catch(function (error) {
      console.log(error);
    });
  }

  answerProcessor(message) {
    if(this.listener[message.chat.id]) {
      console.log('in listening state for', message.chat.id);
      if (this.listener[message.chat.id].toLowerCase() == message.text.toLowerCase().trim()) {
        const correctAnswer = "Great! The right answer is : ";
        this._sendMessage(message.chat.id, correctAnswer + this.listener[message.chat.id]);
        this.listener[message.chat.id] = undefined;
      }
    }
  }
}

module.exports = Handler;
