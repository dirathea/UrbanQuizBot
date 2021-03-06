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
const bot = new TelegramBot(token, {
    request: {
        timeout: 65000,
    }
});

const Handler = require('./handler.js');
const FacebookHandler = require('./FacebookHandler');
const LineHandler = require('./LineHandler');

let handler = new Handler(bot);
const facebookHandler = new FacebookHandler({
    token: process.env.FACEBOOK_BOT_TOKEN,
    verify: process.env.FACEBOOK_VERIFY_TOKEN,
});

const lineHandler = new LineHandler(process.env.LINE_CHANNEL_TOKEN);

bot.onText(/\/startgame|\/start/, (message) => {
    handler.askForLanguage(message);
});

bot.onText(/\/getnewclue/, (message) => {
    handler.getClueProcessor(message);
});

bot.on('inline_query', (inlineQuery) => {
    handler.inlineQuery(inlineQuery);
});

bot.on('callback_query', (query) => {
    const selectedLanguage = (query.data === 'id') ? 'Indonesia' : 'English';
    bot.answerCallbackQuery(query.id, `Starting game in ${selectedLanguage} language`, false).then(() => {
        handler.startGameProcessor(query.message, query.data);
    });
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

webApp.post('/line', (req, res) => {
    lineHandler.handleMessage(req.body);
    res.sendStatus(200);
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
