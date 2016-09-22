'use strict';

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');

const webApp = express();

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

bot.onText(/\/getnewclue/, function responseStartMessage(message) {
    handler.getClueProcessor(message);
});

bot.on('message', function allMessage(message) {
    handler.answerProcessor(message);
});


// Heroku Handler for webapps
webApp.listen(process.env.PORT, function () {
    console.log('service is started');
});