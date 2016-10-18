/**
 * Created by dira on 9/25/16.
 */
'use strict';

const unirest = require('unirest');
const EventEmitter = require('events');
const _ = require('lodash');
const ChatBottle = require('./ChatBottleHandler');
const GameHandler = require('./GameHandler');
const gameHandler = new GameHandler();
const chatBottleHandler = new ChatBottle();


const quizStatement = "Guess the word by the following definition:";
const BASE_FACEBOOK_ENDPOINT = "https://graph.facebook.com/v2.6/me";

const LANGUAGES = ['id', 'en'];

class FacebookHandler extends EventEmitter {
    constructor(_config) {
        super();
        this.config = _config;

    }

    handleMessage(req, res) {
        let messaging_events = req.body.entry[0].messaging;
        for (let i = 0; i < messaging_events.length; i++) {
            const event = req.body.entry[0].messaging[i];
            const sender = event.sender.id;

            const message = {
                chat: {
                    id: sender,
                },
                text: event.message.text,
                message_id: event.id,
            };
            chatBottleHandler.incomingMessageProcessor(message);

            if (event.message && event.message.text) {
                const text = event.message.text;
                switch (text.toLowerCase()) {
                    case 'start game' :
                        this.emit('startgame', sender);
                        break;
                    case 'get new clue' :
                        this.emit('getnewclue', sender);
                        break;
                    default:
                        this.emit('answer', sender, text);
                        break;
                }
            } else if (event.postback) {
                //    Handle all postback actions
                console.log('POSTBACK_EVENT', event.postback);
                const payload = event.postback.payload;
                this.emit('postback', sender, payload);
            }
        }
        res.sendStatus(200)
    }

    sendMessage(sender, messageData) {
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
                console.log('FACEBOOK_TEXT_MESSAGE', `Sent Status ${response.code}`);
                console.log('FACEBOOK_TEXT_MESSAGE', response.body);
                const sentContent = response.body;
                if (sentContent.message) {
                    chatBottleHandler.outgoingMessageProcessor(sentContent.message_id, sentContent.message, sender);
                } else {
                    chatBottleHandler.outgoingMessageProcessor(sentContent.message_id, sentContent.attachment.payload.text, sender);
                }
            });
    }

    askForLanguage(sender) {
        const messageData = {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'button',
                    text: 'Choose the language',
                    buttons: [
                        {
                            type: 'postback',
                            title: 'Indonesia',
                            payload: 'id',
                        },
                        {
                            type: 'postback',
                            title: 'English',
                            payload: 'en',
                        },
                    ],
                },
            },
        };
        this.sendMessage(sender, messageData);
    }

    sendTextMessage(sender, text) {
        let messageData = {text: text};
        this.sendMessage(sender, messageData);
    }

    initializeThreadSettings() {
        this.setGreetingText(`Hi {{user_full_name}}! Let's play Urban Quiz!`);
        this.setMenuButton();
        this.setEventHandler();
    }

    setEventHandler() {
        this.on('startgame', (sender) => {
            this.askForLanguage(sender);
        });

        this.on('getnewclue', (sender) => {
            gameHandler.requestNewClue(sender).then((quiz) => {
                this.sendTextMessage(sender, `${quizStatement}\n${quiz.word.length} letters : ${quiz.hidden}\n(${quiz.index}/${quiz.total})\n${quiz.clue}`);
            }).catch((err) => {
                console.log('NEW_CLUE_LOG', err);
            });
        });

        this.on('answer', (sender, text) => {
            gameHandler.answerQuiz(sender, text).then((answer) => {
                this.sendTextMessage(sender, `Great! The right answer is : ${answer}`);
            }).catch((err) => {
                if (err.code == 1) {
                    this.sendTextMessage(sender, `Hi There! Welcome to Urban Quiz! To begin, please type start game, or click start game on the button on your left bottom.`);
                }
            });
        });

        this.on('postback', (sender, data) => {
            if (LANGUAGES.indexOf(data) > -1) {
                gameHandler.startGame(sender, data, (rightAnswer) => {
                    this.sendTextMessage(sender, `Sorry, you're running out of time. The right answer is ${rightAnswer}.`);
                }).then((quiz) => {
                    this.sendTextMessage(sender, `${quizStatement}\n${quiz.word.length} letters : ${quiz.hidden}\n(${quiz.index}/${quiz.total})\n${quiz.clue}`);
                });
            } else {
                this.emit(data, sender);
            }
        })
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
                console.log('Greeting Text set');
            });
    }

    setMenuButton() {
        unirest.post(`${BASE_FACEBOOK_ENDPOINT}/thread_settings`)
            .query({
                access_token: this.config.token
            })
            .headers({
                'Content-type': 'application/json',
            })
            .send({
                setting_type: 'call_to_actions',
                thread_state: 'existing_thread',
                call_to_actions: [
                    {
                        type: 'postback',
                        title: 'Start Game',
                        payload: 'startgame',
                    },
                    {
                        type: 'postback',
                        title: 'Get New Clue',
                        payload: 'getnewclue',
                    },
                ]
            })
            .end((response) => {
                console.log('Persistent Menu set');
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
