/**
 * Created by dira on 9/25/16.
 */
'use strict';

const unirest = require('unirest');

class FacebookHandler {
    constructor(_config) {
        this.config = _config;
    }

    handleMessage(req, res) {
        let messaging_events = req.body.entry[0].messaging;
        for (let i = 0; i < messaging_events.length; i++) {
            let event = req.body.entry[0].messaging[i];
            let sender = event.sender.id;
            if (event.message && event.message.text) {
                let text = event.message.text;
                this.sendTextMessage(sender, "Text received, echo: " + text.substring(0, 200))
            }
        }
        res.sendStatus(200)
    }

    sendTextMessage(sender, text) {
        let messageData = {text: text}
        unirest.post('https://graph.facebook.com/v2.6/me/messages')
            .query({
                access_token: this.config.token
            })
            .headers({
                'Content-type': 'application/json',
            })
            .send({
                recipient: {id: sender},
                message: messageData,
            })
            .end((response) => {
                console.log('sent', response);
            });
    }

    verify(req, res) {
        if (req.query['hub.verify_token'] === this.config.verify) {
            res.send(req.query['hub.challenge']);
        } else {
            res.send('Error, wrong validation token');
        }
    }
}
module.exports = FacebookHandler;
