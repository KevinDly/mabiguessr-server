const TWITCH_EVENTSUB_URL = process.env.TWITCH_EVENTSUB
const CHATBOT_ID = process.env.CHATBOT_ID
const TWITCH_OAUTH = process.env.TWITCH_OAUTH_URL
const TWITCH_USERS_URL = process.env.TWITCH_USERS_URL
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const BOT_REFRESH_TOKEN = process.env.CHATBOT_REFRESH_TOKEN

export async function refreshToken(refresh_token) {
    const GRANT_TYPE = 'refresh_token'

    let twitchParams = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'grant_type': GRANT_TYPE,
        'refresh_token': refresh_token
    }

    return fetch(
        TWITCH_OAUTH, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: (new URLSearchParams(twitchParams)).toString()
        }
    )
    .then(response => response.json())
    .then(response => {
        console.log(response)
        return response
    })
}

export async function generateIDFromAuthorization(authorization_token) {
    console.log(authorization_token)
    return fetch(TWITCH_USERS_URL, {
        headers: {
            'Authorization': 'Bearer ' + authorization_token,
            'Client-Id': CLIENT_ID,
        }
    })   
    .then(response => response.json())
    .then(response => {
        console.log(response)
        return response
    })
}

export async function generateEventSubSubscription(authorization_token, client_id, user_id, session_id, CONTENT_TYPE = 'application/json', method = "websocket") {

    //TODO: Replace callback and secret with the appropriate information.
    //https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage
    console.log(`authtoken: ${authorization_token}`)
    console.log(`clientid: ${client_id}`)
    console.log(`userid: ${user_id}`)
    console.log(`chatbod: ${CHATBOT_ID}`)

    console.log(typeof(user_id))
    console.log(typeof(CHATBOT_ID))
    let body = {
        type: "channel.chat.message",
        version: "1",
        condition: {
            "broadcaster_user_id": user_id,
            "user_id": CHATBOT_ID
        },
        transport: {
            method: "websocket",
            session_id: session_id
        }
    }

    return fetch(TWITCH_EVENTSUB_URL, {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + authorization_token,
            'Client-Id': client_id,
            'Content-Type': CONTENT_TYPE
        },
        body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(response => {
        console.log(response)
        return response
    })
}

//TODO: Setup the authorization on the frontend.
//https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#authorization-code-grant-flow

export async function connectTwitch(id, secret, authorization_code, redirect_uri, additional_parameters = {}, dev_mode = false) {

    const GRANT_TYPE = 'authorization_code'

    let twitchSearchParams = {
        'client_id': id,
        'client_secret': secret,
        'code': authorization_code,
        'grant_type': GRANT_TYPE,
        'redirect_uri': redirect_uri
    }

    Object.keys(additional_parameters).map(key => {
        twitchSearchParams[key] = additional_parameters[key]
    })

    if(!dev_mode) {
        twitchSearchParams = new URLSearchParams(twitchSearchParams)
    }
    else {
        //TODO: Check usefulness.
        console.log("Dev mode")
        let formattedString = ""
        Object.keys(twitchSearchParams).map(key => {
            formattedString = formattedString.concat(`${key}=${twitchSearchParams[key]}&`)
        })
        formattedString = formattedString.substring(0, formattedString.length - 1)
        return fetch(TWITCH_OAUTH + "?" + formattedString, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        })
        .then(response => response.json())
        .then(response => {
            console.log(response)
            return response
        })
    }

    return fetch(TWITCH_OAUTH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: twitchSearchParams
    })
    .then(response => response.json())
    .then(response => {
        console.log(response)
        return response
    })
}