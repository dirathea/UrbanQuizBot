/**
 * Created by dira on 10/3/16.
 */
'use strict';

const unirest = require('unirest');
const EventEmitter = require('events');
const _ = require('lodash');

const GameHandler = require('./GameHandler');
const gameHandler = new GameHandler();

const LINE_MESSAGE_EVENT = 'message';
const LINE_REPLY_ENDPOINT = 'https://api.line.me/v2/bot/message/reply';
const LINE_PUSH_ENDPOINT = 'https://api.line.me/v2/bot/message/push';

const LINE_START_GAME_COMMAND = 'start game';
const LINE_GET_NEW_CLUE_COMMAND = 'get new clue';

const LINE_SOURCE_TYPE_USER = 'user';
const LINE_SOURCE_TYPE_GROUP = 'group';
const LINE_SOURCE_TYPE_ROOM = 'room';

const quizStatement = "Guess the word by the following definition:";

class LineHandler extends EventEmitter {
    constructor(_token) {
        super();
        this.token = _token;
        this.initEventHandler();
    }

    initEventHandler() {
        this.on(LINE_MESSAGE_EVENT, this.messageEventHandler);
    }

    messageEventHandler(source, replyToken, content) {
        switch (content.text.toLowerCase()) {
            case LINE_START_GAME_COMMAND:
                gameHandler.startGame(this._getUserId(source), (rightAnswer) => {
                    this.sendPushMessage(this._getUserId(source), `Sorry, you're running out of time. The right answer is ${rightAnswer}.`);
                }).then((quiz) => {
                    this.sendReplyMessage(replyToken, `${quizStatement}\n${quiz.hidden}\n(${quiz.index}/${quiz.total})\n${quiz.clue}`);
                });
                break;
            case LINE_GET_NEW_CLUE_COMMAND:
                gameHandler.requestNewClue(this._getUserId(source)).then((quiz) => {
                    this.sendReplyMessage(replyToken, `${quizStatement}\n${quiz.hidden}\n(${quiz.index}/${quiz.total})\n${quiz.clue}`);
                }).catch((err) => {
                    console.log('NEW_CLUE_LOG', err);
                });
                break;
            default:
                gameHandler.answerQuiz(this._getUserId(source), content.text).then((answer) => {
                    this.sendReplyMessage(replyToken, `Great! The right answer is : ${answer}`);
                }).catch((err) => {

                });
                break;
        }
    }

    sendPushMessage(to, text) {
        unirest.post(LINE_PUSH_ENDPOINT)
            .headers({
                'Content-type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            })
            .send({
                to,
                messages: [{
                    type: 'text',
                    text
                }
                ]
            })
            .end(() => {
                console.log('Push Message is sent');
            });
    }

    sendReplyMessage(replyToken, text) {
        unirest.post(LINE_REPLY_ENDPOINT)
            .headers({
                'Content-type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            })
            .send({
                replyToken,
                messages: [{
                    type: 'text',
                    text
                }
                ]
            })
            .end(() => {
                console.log('Reply Message is sent');
            });
    }

    _getUserId(source) {
        switch (source.type) {
            case LINE_SOURCE_TYPE_USER :
                return source.userId;
            case LINE_SOURCE_TYPE_GROUP:
                return source.groupId;
            case LINE_SOURCE_TYPE_ROOM:
                return source.roomId;
        }
    }

    handleMessage(data) {
        if (!_.isEmpty(data)) {
            for (let i = 0; i < data.events.length; i++) {
                const event = data.events[i];
                switch (event.type) {
                    case LINE_MESSAGE_EVENT:
                        if (event.message.type === 'text') {
                            this.emit(LINE_MESSAGE_EVENT, event.source, event.replyToken, event.message);
                        }
                        break;
                    default:
                        console.log('Unhandled LINE event', event.type);
                        break;
                }
            }
        }
    }
}

module.exports = LineHandler;
