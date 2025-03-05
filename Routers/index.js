import Router from 'express'
import ParamsChecker from '../Middlewares/paramsChecker.js'
import Users from '../Controllers/users.js'
import Stats from '../Controllers/stats.js'
import Database from '../db.js'

const router = new Router()

// Required parameters { query: [], body: [] }
const registerParams = { body: ['discordID', 'eosID'] }
const profileParams = { query: ['discordID'] }
const wipeParams = { body: ['discordID'] }

// Routes
router.post('/register',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, registerParams), Users.register)

router.get('/profile',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, profileParams), Stats.getProfile)

router.post('/wipe',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, wipeParams), Stats.wipeProfile)

// Clear Database route
router.get('/clearDB', async (req, res) => {
    await Database.getClient().db('testdb').dropDatabase();

    await Database.getClient().db('testdb').createCollection("Users");
    await Database.getClient().db('testdb').createCollection("Stats");

    return res.status(200).json({
        message: 'Database cleared!'
    })
})

// Ping route
router.get('/ping', async (req, res) => {
    return res.status(200).json({
        message: 'pong'
    })
})

export default router