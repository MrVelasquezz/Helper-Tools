const {
    Api,
    TelegramClient
} = require('telegram')
const {
    StringSession
} = require('telegram/sessions')
const input = require('input')
const fs = require('fs').promises
require("dotenv").config()

const api_id = parseInt(process.env.API_ID)
const api_hash = process.env.API_HASH
const session = new StringSession(process.env.SESSION);

async function connect() {
    try {
        console.log('Starting connection')
        const client = new TelegramClient(session, api_id, api_hash, {
            connectionRetries: 5
        })

        if (!process.env.SESSION) {
            const phone_number = process.env.PHONE

            await client.start({
                phoneNumber: phone_number,
                phoneCode: async () => await input.text("Enter your code"),
                onError: (e) => console.log(e.message)
            })

            console.log("Session key: ", client.session.save())
        } else {
            await client.connect()
            console.log("We are connected")

            const action = await input.text("Select action: ")

            if (action == "chats" || action == "messages" || action == "chat_users") {
                const chats = await client.invoke(
                    new Api.messages.GetDialogs({
                        offsetPeer: "@ads_team_bot", // first in dialogs
                        limit: 100,
                        excludePinned: true
                    })
                )

                if (action == "chats") {
                    console.log(chats.chats.map(item => {
                        if (item.className != 'ChatForbidden') {
                            return `${item.firstName?item.firstName:item.title}, ${item.id}, ${item.className}`
                        }
                    }).filter(r => r != undefined))
                }

                if (action == "chat_users") {
                    const chat_id = parseInt(await input.text("Enter chat id: "))
                    const users = await client.invoke(
                        new Api.messages.GetHistory({
                            peer: parseInt(chat_id),
                            limit: 100
                        })
                    )
                    console.log(users.users.map(item => {
                        return `${item.firstName} ${item.username}:${item.id} ${item.bot}`
                    }))
                }

                if (action == "messages") {

                    let max_id = -1
                    let last_max_id = 2
                    const chat_id = parseInt(await input.text("Enter chat id: "))
                    const participant_id = parseInt(await input.text("Enter participant id: "))
                    const what_to_search = await input.text("Enter string to search: ")

                    const list = new Set()
                    await fs.writeFile('./output.txt', '')
                    while (true) {
                        if (max_id != last_max_id && (last_max_id > 0 || last_max_id == -1)) {

                            const messages = await client.invoke(
                                new Api.messages.GetHistory({
                                    peer: parseInt(chat_id),
                                    offsetId: max_id,
                                    limit: 100
                                })
                            )
                            
                            try {
                                console.log(messages.messages.reverse().map(item => {
                                    last_max_id = max_id
                                    if (item.fromId && item.fromId.userId == participant_id && item.message && item.message.includes(what_to_search)) {
    
                                        // was made to collect user membership cards. not to scrap credit cards!!!!
                                        
                                        /*const card = item.message.match(/Карта: [0-9|/]+ /g)[0].replace('Карта:', '').replace('/', '|').trim()
                                        const name = item.message.match(/Имя: ([A-Z]+( +)?)+/g)[0].replace('Имя:', '').trim()
                                        list.add(`${card} ${name}`)*/
    
                                        return `[${new Date(item.date).toUTCString()}] ${item.fromId.userId}:${item.id} ${item.message}`
                                    }
                                }).filter(r => r != undefined))  

                                await fs.appendFile('./output.txt', Array.from(list).join('\n')+'\n')
                                list.clear()
                            } catch (e) {
                                console.log(e.message)
                            }

                            max_id = messages.messages.find(r => r.id != undefined).id
                        } else {
                            console.log("Stopped")
                            break
                        }
                    }
                    
                }
            } else {
                console.log(`Wrong action ${action}`)
            }
        }
    } catch (e) {
        console.log(e)
    }
}

connect()