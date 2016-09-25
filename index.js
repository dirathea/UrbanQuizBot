'use strict';

const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const bodyParser = require('body-parser');

const webApp = express();
webApp.use(bodyParser.json()); // for parsing application/json

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

webApp.get('/webhook', (req, res) => {
    console.log(req.body);
    // Verify webhook
    if (req.query['hub.verify_token'] === 'URBAN_QUIZ_VERIFY') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Error, wrong validation token');
    }

    //  Something else
    console.log(req.body);
});

//EAACirKiZCWvwBAE1IpBwmCgLGMH5m8f3NJ2GpkzTD0q1xB4egb5zuii5N9CQDfnINF4Igwe4rtkOESq0VGRVhIaZBIFCsKuQuTSk3kneDZC6cJkHZARwNlAhlTtsT5QG4Vs7lVdnvFY7CSAwXHDntGQ6MXfAmXuis3wn4S5sSAZDZD

// Heroku Handler for webapps
webApp.listen(process.env.PORT, function () {
    console.log('service is started');
});
