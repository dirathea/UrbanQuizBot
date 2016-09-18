'use strict';

const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_BOT_TOKEN;

// Setup polling way
const bot = new TelegramBot(token, {
    polling: true
});

const Handler = require('./handler.js');

let handler = new Handler(bot);

bot.onText(/\/startgame/, function responseStartMessage(message) {
    handler.startGameProcessor(message);
});

bot.on('message', function allMessage(message) {
  handler.answerProcessor(message);
});
