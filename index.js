'use strict';

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'localhost';
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
const bot = new TelegramBot(token);

const Handler = require('./handler.js');
const FacebookHandler = require('./FacebookHandler');

let handler = new Handler(bot);
const facebookHandler = new FacebookHandler({
    token: process.env.FACEBOOK_BOT_TOKEN,
    verify: process.env.FACEBOOK_VERIFY_TOKEN,
});

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
    facebookHandler.verify(req, res);
});

webApp.post('/webhook', (req, res) => {
    facebookHandler.handleMessage(req, res);
    res.end(JSON.stringify({status: 'ok'}));
});

webApp.post(`/${token}`, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
});

// Heroku Handler for webapps
webApp.listen(process.env.PORT, function () {
    console.log('service is started');
    facebookHandler.initializeThreadSettings();
});

bot.setWebHook(`${WEBHOOK_URL}/${token}`);
