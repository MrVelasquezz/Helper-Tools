const mongo = require("mongodb").MongoClient
require("dotenv").config()

class CopyEndToEnd {
    constructor(coll_name, db_name) {
        this.from = process.env.FROM_DB
        this.to = process.env.TO_DB
        this.collection = coll_name
        this.db = db_name
        this.data = null
        this.client = null
    }

    async insertTo() {
        try {
            console.log("Connecting to 'to' database")
            this.client = new mongo(this.to)
            await this.client.connect()
            const mongoClient = this.client.db(this.db)
            /*const inserted = await mongoClient.collection(this.collection)
                .insertMany(this.data)
            if (inserted && inserted.insertedCount) {
                console.log("Inserted %d of %d elements", inserted.insertedCount, this.data.length)
            } else {
                throw new NoElementsInDb("No elements were inserted")
            }*/
            /*let updated_c = 0 
            for(const data of this.data){
                const updated = await mongoClient.collection(this.collection)
                    .updateOne({land_code: data.land_code}, {$set: data}, {upsert: true})
                
                if(updated && updated.modifiedCount){
                    updated_c++
                }
            }
            console.log("Updated %d of %d elements", updated_c, this.data.length)*/
            const existing = await mongoClient.collection(this.collection)
                .find({}).toArray()
            let inserted_c = 0
            for(let i = 0; i < this.data.length; i++){
                if(!existing.find(r => r.land_code == this.data[i].land_code)){
                    const inserted = await mongoClient.collection(this.collection)
                        .insertOne(this.data[i]) 
                    if(inserted && inserted.acknowledged){
                        inserted_c++
                    }
                }
            }
            console.log("Inserted %d of %d elements", inserted_c, this.data.length)
        } catch (e) {
            console.dir(e)
        } finally {
            if (this.client) {
                console.log("Closing connection")
                await this.client.close()
                console.log("Connection closed")
            } else {
                console.log("No connection was established")
            }
        }
    }

    async copyFrom() {
        try {
            console.log("Connecting to 'from' database")
            this.client = new mongo(this.from)
            await this.client.connect()
            const mongoClient = this.client.db(this.db)
            const result = await mongoClient.collection(this.collection)
                .find({}, {projection: {_id: 0}}).toArray()
            if (result && result.length) {
                console.log("Found %d elements", result.length)
                this.data = result
                this.insertTo()
            } else {
                throw new NoElementsInDb("No elements in database")
            }
        } catch (e) {
            console.dir(e)
        } finally {
            if (this.client) {
                console.log("Closing connection")
                await this.client.close()
                console.log("Connection closed")
            } else {
                console.log("No connection was established")
            }
        }
    }
}

const init = new CopyEndToEnd("lands", "private")
init.copyFrom()