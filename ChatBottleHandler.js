'use strict';

const unirest = require('unirest');
const CHATBOTTLE_BOT_ID = process.env.CHATBOTTLE_BOT_ID;
const CHATBOTTLE_ENDPOINT = `https://api.chatbottle.co/v1/updates/${CHATBOTTLE_BOT_ID}/`;
const CHATBOTTLE_TOKEN = process.env.CHATBOTTLE_TOKEN;

class ChatBottleHandler {
    constructor() {

    }

    incomingMessageProcessor(message) {
        // Parse telegram incoming message for chatbottle
        const _id = message.message_id,
            _text = message.text,
            _userid = message.chat.id;

        this._sendAnalytics({
            'Id': _id,
            'Text': _text,
            'UserId': _userid,
            'Direction': 'In',
        });
    }

    outgoingMessageProcessor(_id, _text, _userid) {
        this._sendAnalytics({
            'Id': _id,
            'Text': _text,
            'UserId': _userid,
            'Direction': 'Out',
        });
    }

    _sendAnalytics(data) {
        let body = {
            Messaging: [
                data
            ]
        };
        unirest.post(CHATBOTTLE_ENDPOINT)
            .query({
                token: CHATBOTTLE_TOKEN
            })
            .headers({
                'Content-Type': 'application/json'
            })
            .send(JSON.stringify(body))
            .end();
    }
}


module.exports = ChatBottleHandler;
