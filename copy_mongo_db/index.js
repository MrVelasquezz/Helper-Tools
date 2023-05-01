const fs = require("fs").promises;
const mongo = require("mongodb");
require("dotenv").config();

async function run() {
  const client = await new mongo.MongoClient(process.env.MONGO_URL);
  await client.connect();
  const db = client.db("NAME_OF_DB");

  const get_collections = await db.listCollections().toArray();

  if (get_collections.length) {
    console.log("Parsing %d collections", get_collections.length);
    const collection_list = [];

    for (const collection of get_collections) {
      const insert_obj = {
        collName: collection.name,
        data: null,
      };

      const data = await db.collection(collection.name).find().toArray();

      insert_obj.data = data.map((item) => {
        item.title = decodeURIComponent(item.title);
        item.text = decodeURIComponent(item.text);
        return item;
      });

      collection_list.push(insert_obj);
    }

    await fs.writeFile("./data.json", JSON.stringify(collection_list), "utf-8");

  } else {
    console.log("No collections");
  }
}

async function display() {

  const text = await fs.readFile("./data.json", "utf-8");
  const parsed_json = JSON.parse(text);

  for (const item of parsed_json) {

    if (item.collName == "828793506") {

      for (const item_ of item.data) {

        console.log("========================================\n");
        console.log(`${item_.title}\n${item_.text}\n`);
        console.log("========================================\n");

      }
    }
  }
}

//display();
//run()
