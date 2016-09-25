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

    bot.getProfile(payload.sender.id, (err, profile) => {
        if (err) {
            console.log('GET_PROFILE_ERROR', err);
        }

        reply({text}, (err) => {
            if (err) {
                console.log('REPLY_ERROR', err);
            }

            console.log(`Echoed back to ${profile.first_name} ${profile.last_name}: ${text}`)
        })
    })
});

module.exports = bot;
