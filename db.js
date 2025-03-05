import { MongoClient } from 'mongodb';
import config from './config.json' assert { type: "json" };

class Database {
    static client = null;
    static db = null;

    static async connect() {
        this.client = new MongoClient(config.DB.mongo_URI);
        await this.client.connect();
    }

    static async close() {
        await this.client.close();
    }

    static async ini() {
        // Connect to MongoDB
        console.log("Connecting to MongoDB...");
        await this.connect();
        console.log("Connected to MongoDB!");

        this.db = this.client.db(config.DB.dbName);

        // Check if the database exists, if not, warn the user
        const dbName = config.DB.dbName;
        const adminDb = this.client.db().admin();
        const dbList = await adminDb.listDatabases();
        if (!dbList.databases.some(database => database.name === dbName)) {
            console.log(`Database '${dbName}' does not exist. It will be created automatically on the first write.`);
        }

        // Check if the collections exist, if not, create them
        const collections = await this.db.listCollections().toArray();
        const collectionNames = collections.map(col => col.name);

        if (!collectionNames.includes("Users")) {
            await this.db.createCollection("Users");
            console.log("Collection 'Users' created.");
        }

        if (!collectionNames.includes("Stats")) {
            await this.db.createCollection("Stats");
            console.log("Collection 'Stats' created.");
        }

        console.log("\nDatabase initialized! \n");
    }

    static getClient() {
        return this.client;
    }
}

export default Database;