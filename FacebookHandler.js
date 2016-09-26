/**
 * Created by dira on 9/25/16.
 */
'use strict';

const unirest = require('unirest');
const GameHandler = require('./GameHandler');
const gameHandler = new GameHandler();

const quizStatement = "Guess the word by the following definition: \n\n";
const BASE_FACEBOOK_ENDPOINT = "https://graph.facebook.com/v2.6/me";

class FacebookHandler {
    constructor(_config) {
        this.config = _config;
    }

    handleMessage(req, res) {
        let messaging_events = req.body.entry[0].messaging;
        for (let i = 0; i < messaging_events.length; i++) {
            const event = req.body.entry[0].messaging[i];
            const sender = event.sender.id;
            if (event.message && event.message.text) {
                const text = event.message.text;
                switch (text.toLowerCase()) {
                    case 'start game' :
                        gameHandler.startGame(sender, () => {
                            this.sendTextMessage(sender, `Sorry, you're running out of time. Just type start game to begin..`);
                        }).then((quiz) => {
                            this.sendTextMessage(sender, `${quizStatement}(${quiz.index}/${quiz.total})\n${quiz.clue}`);
                        });
                        break;
                    case 'new clue' :
                        gameHandler.requestNewClue(sender).then((quiz) => {
                            this.sendTextMessage(sender, `${quizStatement}(${quiz.index}/${quiz.total})\n${quiz.clue}`);
                        }).catch((err) => {
                            console.log('NEW_CLUE_LOG', err);
                        });
                        break;
                    default:
                        gameHandler.anaswerQuiz(sender, text).then((answer) => {
                            this.sendTextMessage(sender, `Great! The right answer is : ${answer}`);
                        }).catch((err) => {

                        });
                        break;
                }
            }
        }
        res.sendStatus(200)
    }

    sendTextMessage(sender, text) {
        let messageData = {text: text};
        unirest.post(`${BASE_FACEBOOK_ENDPOINT}/messages`)
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
            });
    }

    setGreetingText(message) {
        unirest.post(`${BASE_FACEBOOK_ENDPOINT}/thread_settings`)
            .query({
                access_token: this.config.token
            })
            .headers({
                'Content-type': 'application/json',
            })
            .send({
                setting_type: 'greeting',
                greeting: {
                    text: message
                },
            })
            .end((response) => {
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
