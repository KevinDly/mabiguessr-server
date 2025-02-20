//TODO: Big reminder, that refresh tokens for the chatter need to be done manually.
//TODO: Remove some of this to it's own files.

import { WebSocketServer } from 'ws'
import { WebSocket } from 'ws'
import './src/env.js'
import { refreshToken, connectTwitch, generateEventSubSubscription, generateIDFromAuthorization } from './src/apis/twitch.js'

const SERVER_PORT = Number(process.env.SERVER_PORT)
const server = new WebSocketServer({ port: SERVER_PORT })

const TWITCH_CLIENT = process.env.CLIENT_ID
const TWITCH_SECRET = process.env.CLIENT_SECRET


//TODO: Move these consts to a new file.
const SOCKET_LIVESTREAMER = 0
const SOCKET_LIVESTREAM_VIEW = 1

const EVENT_TWITCH_CLIENT_AUTHENTICATION = 0 

//File IO
const DATA_FOLDER = process.env.DATA_FOLDER
const DATA_FILENAME = process.env.DATA_FILENAME
const fileLocation = DATA_FOLDER + '/' + DATA_FILENAME

let currentStreamer, currentView
let refresh_tokens

initializeServer() 

async function createTwitchWebsocket(authorization_token, userID) {
    let websocket = new WebSocket(process.env.TWITCH_WS)

    websocket.on('message', async (data) => {
        const msg = JSON.parse(data.toString())
       
        const type = msg.metadata.message_type

        console.log("Twitch Message")
        console.log(msg)
        
        switch(type) {
            case 'session_welcome':
                let websocketSessionID = msg.payload.session.id;

                let eventsubResponse = await generateEventSubSubscription(authorization_token, TWITCH_CLIENT, userID, websocketSessionID)
                console.log("response")
                console.log(eventsubResponse)
                break;

            case 'notification':
                console.log(msg)
                handleTwitchPayloadTypes(msg)
                break;

            //TODO: HANDLE KEEPALIVE (reconnect to twitch if keepalive dies)
            case 'session_keepalive':
                break;

            //TODO: Handle addition reconnect messages: https://dev.twitch.tv/docs/eventsub/handling-websocket-events/#keepalive-message
        }
    })

    return websocket
}

function handleTwitchPayloadTypes(msg) {
    const metadata = msg.metadata
    const payload = msg.payload

    switch(payload.subscription.type) {
        case 'channel.chat.message':
            //Payload related objects
            const event = payload.event
            const subscription = payload.subscription

            //Underlying message data
            const chatterUsername = event.chatter_user_name
            const messageTiming = subscription.created_at
            const messageContent = event.message
            const messageText = messageContent.text

            console.log(`User ${chatterUsername} said: ${messageText} @ ${messageTiming}`)
            console.log(messageContent)
            break;
    }
}

//TODO: Call when authorization is available
async function initializeTwitch(authorization_code) {
    if(process.env.NODE_ENV == 'development') additional_parameters = {grant_type: "client_credentials"}
    //TODO: Catch twitch connection failure or refusal
    //TODO: Make sure we dont need a second app for this particular URI, might need multiple?
    let twitchAccess = await connectTwitch(TWITCH_CLIENT, TWITCH_SECRET, authorization_code, "http://localhost:3000")
    console.log("Access")
    console.log(twitchAccess)

    let broadcaster_authorization_token = twitchAccess.access_token
    let broadcaster_refresh_token = twitchAccess.refresh_token

    console.log(broadcaster_authorization_token)
    let userData = await generateIDFromAuthorization(broadcaster_authorization_token)
    const broadcasterID = userData.data[0].id

    let bot_authorization_token
    try {
        let bot_refresh_token = process.env.CHATBOT_REFRESH_TOKEN
        bot_authorization_token = (await refreshToken(bot_refresh_token)).access_token
        await createTwitchWebsocket(bot_authorization_token, broadcasterID)
    }
    catch(e){
        console.log(e)
    }
    //let eventSubResponse = await generateEventSubSubscription(authorization_token, TWITCH_CLIENT, userID)

    //console.log(eventSubResponse)
}

async function initializeServer() {

    //let twitchConnection = await initializeTwitch()

    server.on('connection', (socket) => {
        //TODO: Check if the client already connected to twitch.
        console.log("Received Connection.")

        console.log(socket.protocol)
        socket.send(JSON.stringify({'protocol': 'test'}))
        switch(Number(socket.protocol)) {
            case(SOCKET_LIVESTREAMER):
                //TODO: Implement functionality if client is already connected to Twitch.
                currentStreamer = socket
                createLivestreamerSocketHandlers(currentStreamer)
                break;
            case(SOCKET_LIVESTREAM_VIEW):
                currentView = socket
                break;
        }
    })
}

async function createLivestreamerSocketHandlers(socket) {
    console.log("Activated Handler for Livestreamer")
    socket.on('message', (message) => {
        const parsedMessage = JSON.parse(message)

        console.log(`Recieved message: ${parsedMessage}`)
        console.log(parsedMessage)

        let protocol, data
        try {
            protocol = parsedMessage.protocol
            data = parsedMessage.data
        }
        catch {
            console.log(`Recieved unknown message: ${parsedMessage}`)
            return
        }

        handleLivestreamerMessageEvents(socket, protocol, data)
    })
}

async function handleLivestreamerMessageEvents(socket, protocol, data) {
    switch(protocol) {
        //TODO: Implement events.
        case EVENT_TWITCH_CLIENT_AUTHENTICATION:
            //TODO: Breakdown the data so the authorization code is correct.
            initializeTwitch(data.code)
            break;
    }
}