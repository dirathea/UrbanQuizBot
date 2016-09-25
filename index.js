'use strict';

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const webApp = express();
webApp.use(bodyParser.json()); // for parsing application/json
webApp.use(bodyParser.urlencoded({
    extended: true
}));

const token = process.env.TELEGRAM_BOT_TOKEN;

// Setup polling way
const bot = new TelegramBot(token, {
    polling: true
});

const Handler = require('./handler.js');
const facebookBot = require('./FacebookHandler');

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

webApp.get('/webhook', (req, res) => {
    return facebookBot._verify(req, res);
});

webApp.post('/webhook', (req, res) => {
    facebookBot._handleMessage(req.body);
    res.end(JSON.stringify({status: 'ok'}));
});

// Heroku Handler for webapps
webApp.listen(process.env.PORT, function () {
    console.log('service is started');
});
