import express, { json, urlencoded } from 'express';
import cors from 'cors';
import mainRouter from './Routers/index.js';
import config from './config.json' with { type: "json" };
import Database from './db.js';

// Start MongoDB
console.log("Starting Mongo... \n");
await Database.ini();

// Close MongoDB connection when the process exits
process.on('SIGINT', async () => {
    console.log("Closing MongoDB connection...");
    await Database.close();
    process.exit(0);
})
process.on('exit', async (code) => {
    console.log("\nServer exited with code: " + code);
})

// Start Express
const server = express()
const port = config.PORT || 3333

// Middlewares
server.use(cors())
server.use(json())
server.use(urlencoded({ extended: true }));

// Routes
server.use('/', mainRouter)

server.listen(port, () => {
  console.log(`Started on ${port}`)
})
