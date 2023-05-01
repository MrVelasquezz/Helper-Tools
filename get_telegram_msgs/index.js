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

class ScrapTelegramChatData {
    client = null
    //
    /// messages.getChat is very important, because without it anything will work
    /// must to initalise it, to parse message history
    getChats() {
        return new Promise(async (res, rej) => {
            try {
                const chats = await this.client.invoke(
                    new Api.messages.GetDialogs({
                        offsetPeer: process.env.CHAT_OFFSET, // first chat in dialogs
                        limit: 100, // max limit
                        excludePinned: true
                    })
                )

                res(chats.chats.map(item => {
                    // removing chats, which has migrated from group to supergroup
                    if (item.className != 'ChatForbidden') {
                        return `${item.firstName?item.firstName:item.title}, ${item.id}, ${item.className}`
                    }
                }).filter(r => r != undefined))

            } catch (e) {
                rej(e)
            }
        })
    }

    getParticipants() {
        return new Promise(async (res, rej) => {
            try {
                const chat_id = parseInt(await input.text("Enter chat id: "))

                const users = await this.client.invoke(
                    new Api.messages.GetHistory({
                        peer: chat_id,
                        limit: 100
                    })
                )

                res(users.users.map(item => {
                    return `${item.firstName} ${item.username}:${item.id} ${item.bot}`
                }))
            } catch (e) {
                rej(e)
            }
        })
    }

    async getMessages() {
        let max_id = -1
        let last_max_id = 2

        const chat_id = parseInt(await input.text("Enter chat id: "))
        const participant_id = parseInt(await input.text("Enter participant id: "))
        const what_to_search = await input.text("Enter string to search: ")

        const list = new Set()
        await fs.writeFile('./output.txt', '')

        while (true) {
            if (max_id != last_max_id && (last_max_id > 0 || last_max_id == -1)) {

                const messages = await this.client.invoke(
                    new Api.messages.GetHistory({
                        peer: chat_id,
                        offsetId: max_id,
                        limit: 100
                    })
                )

                console.log(messages.messages.reverse().map(item => {
                    last_max_id = max_id
                    // searching all messages from given user with given text. text canbe setted ""
                    if (item.fromId && item.fromId.userId == participant_id && item.message && item.message.includes(what_to_search)) {

                        // was made to collect user membership cards. not to scrap credit cards!!!!

                        const card = item.message.match(/Карта: [0-9|/]+ /g)
                        card = card?card[0].replace('Карта:', '').replace('/', '|').trim():""
                        const name = item.message.match(/Имя: ([A-Z]+( +)?)+/g)
                        name = name?name[0].replace('Имя:', '').trim():""
                        list.add(`${card} ${name}`)

                        // if want messages, add ${item.message}
                        return `[${new Date(item.date).toUTCString()}] ${item.fromId.userId}:${item.id}`
                    }
                }).filter(r => r != undefined))

                await fs.appendFile('./output.txt', Array.from(list).join('\n') + '\n')
                list.clear()

                const max_id_ = messages.messages.find(r => r.id != undefined)
                if (max_id_) {
                    max_id = max_id_.id
                } else {
                    last_max_id = 0
                }
            } else {
                console.log("Stopped")
                break
            }
        }
    }

    async init() {
        try {
            console.log('Starting connection')
            const client = new TelegramClient(session, api_id, api_hash, {
                connectionRetries: 5
            })

            this.client = client

            // if we have any session yet
            if (!process.env.SESSION) {
                const phone_number = process.env.PHONE

                await this.client.start({
                    phoneNumber: phone_number,
                    phoneCode: async () => await input.text("Enter your code"),
                    onError: (e) => console.log(e.message)
                })

                // after getting it, just insert it in .env
                console.log("Session key: ", this.client.session.save())
            } else {
                await this.client.connect()
                console.log("We are connected!")

                const chats = await this.getChats()

                while (true) {
                    const action = await input.text("Select action: ")
                    if (action == "chats") {
                        console.log(chats.join('\n'))
                    } else if (action == "chat_users") {
                        console.log(await(await this.getParticipants()).join('\n'))
                    } else if (action == "messages") {
                        this.getMessages()
                    }
                }

            }
        } catch (e) {
            console.log(e)
        }
    }
}

const scraper = new ScrapTelegramChatData()
scraper.init()