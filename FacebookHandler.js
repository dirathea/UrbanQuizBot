/**
 * Created by dira on 9/25/16.
 */
'use strict';

const facebookBot = require('messenger-bot');

const bot = new facebookBot({
    token: process.env.FACEBOOK_BOT_TOKEN,
    verify: process.env.FACEBOOK_VERIFY_TOKEN,
});

bot.on('error', (err) => {
    console.log(err);
});

bot.on('message', (payload, reply) => {

    let text = payload.message.text;
    reply({text}, (err) => {
        console.log('replying is error', err);
    });
});

module.exports = bot;
