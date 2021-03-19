"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = require('ws')
const events_1 = require("events");
const axios_1 = require("axios");
const API_URL = "https://glimesh.tv/api";
class GlimeshChat extends events_1.EventEmitter {
    constructor(auth) {
        super();
        this.auth = auth;
        this._connected = false;
        this.readOnly = false;
        this.token = auth.token;
        this.clientId = auth.clientId;
		this.debug = auth.debug;
        this.channelId = 0;
    }
    getChannelId(username) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = `
                query { channel(username: "${username}") { id } }`;
            try {
                const response = yield this.client.post("", {
                    query: data
                });
                return +response.data.data.channel.id;
            }
            catch (e) {
                //console.error(e);
            }
            return 0;
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            clearInterval(this.heartbeatTimer);
            this.socket.close();
        });
    }
    connect(channel) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let suffix = null;
                let readOnly = false;
                let headers = {
                    "Content-Type": "application/json"
                };
                if (this.token) {
                    suffix = `token=${this.token}`;
                    headers["Authorization"] = `Bearer ${this.token}`;
                }
                else if (this.clientId) {
                    suffix = `client_id=${this.clientId}`;
                    headers["Authorization"] = `Client-ID ${this.clientId}`;
                    readOnly = true;
                }
                this.readOnly = readOnly;
                if (!suffix) {
                    return resolve({
                        connected: false,
                        readOnly
                    });
                }
                this.client = axios_1.default.create({
                    baseURL: API_URL,
                    headers
                });
                this.channelId = yield this.getChannelId(channel);
                this.socket = new WebSocket(`wss://glimesh.tv/api/socket/websocket?vsn=2.0.0&${suffix}`);
                this.socket.on("open", () => __awaiter(this, void 0, void 0, function* () {
                    this._connected = true;
                    const packet = [
                        "1",
                        "1",
                        "__absinthe__:control",
                        "phx_join",
                        {}
                    ];
                    yield this.send(packet) && console.log("Connected to Glimesh WSS Server.");
                    this.heartbeatTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () { return yield this.send(["1", "1", "phoenix", "heartbeat", {}]); }), 29 * 1000);
                    const joinQuery = `
                    subscription{
                        chatMessage(channelId: ${this.channelId}) {
							id,
                            message,
                            user {
                                id,
                                username
                            },
                            tokens {
                                text,
                                type,
								...on EmoteToken {
									src,
									text,
									type,
									url
								}
								...on TextToken {
									text,
									type
								}
								...on UrlToken {
									text,
									type,
									url
								}
                            }
                        }
                    }`;
                    yield this.send(
						this.buildPacket(joinQuery))
						console.log(`Joined: ${channel}`)
                    return resolve({
                        connected: true,
                        readOnly: this.readOnly
                    });
                }));
                this.socket.on("message", (message) => {
					const packet = JSON.parse(message.toString());
                    if(message == `["1","1","__absinthe__:control","phx_reply",{"response":{},"status":"ok"}]`){
						
                    }
                    if(message == `[null,"1","phoenix","phx_reply",{"response":{},"status":"ok"}]`){ // Heart beat response.
                        if(this.debug == true){
							console.log("Heart beat.")
						}
                    }
                    else{
                        if (packet.length != 5 || packet[3] !== "subscription:data") {
                            return;
                        }
                        if (!packet[4].result.data || !packet[4].result.data.chatMessage) {
                            return;
                        }
                        const chatMessage = packet[4].result.data.chatMessage;
                        if (!chatMessage.message || !chatMessage.user.username) {
                            return;
                        }
                        this.emit("message", chatMessage);
                    }
                });
                this.socket.on("close", (event) => {
					this._connected = false;
					console.log("Disconnected from Glimesh server.")
					try{
						this.emit("close", event) && console.log("Attempting to reconnect.");
					}
					catch(error){
						console.error("Failed to reconnect.\n" + error)
					}
                })
                this.socket.on("error", (event) => {
                    if(event.message.includes("Unexpected server response: 403")){
                        console.error("Access Token is expired")
                    }
                })
            }));
        });
    }
    sendMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            const messageQuery = `
				mutation {
					createChatMessage(channelId: ${this.channelId}, message: {message: "${message}"}) {
						message,
						insertedAt,
						user {
							username
						}
					}
				}`;
            yield this.send(this.buildPacket(messageQuery));
        });
    }
    buildPacket(query) {
        return [
            "1",
            "1",
            "__absinthe__:control",
            "doc",
            {
                query,
                variables: {}
            }
        ];
    }
    send(packet) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.socket.send(JSON.stringify(packet), err => {
                    if (err) {
                        return reject(err);
                    }
                    return resolve();
                });
            });
        });
    }
    get connected() {
        return this._connected;
    }
}
exports.GlimeshChat = GlimeshChat;
//# sourceMappingURL=chat.js.map
