import express, { json, urlencoded } from 'express';
import cors from 'cors';
import mainRouter from './Routers/index.js';
import Config from './config.js';
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
const port = 1111

// Middlewares
server.use(cors())
server.use(json())
server.use(urlencoded({ extended: true }));

server.use(async (req, res, next) => { // Check for the access key
  if (!req.headers['key']) {
    return res.status(401).json({
      message: 'Unauthorized request!'
    })
  }

  if (req.headers['key'] !== Config.get().ACCESS_KEY) {
    return res.status(401).json({
      message: 'Unauthorized request!'
    })
  }

  next()
})

// Routes
server.use('/', mainRouter)

server.listen(port, () => {
  console.log(`Started on ${port}`)
})