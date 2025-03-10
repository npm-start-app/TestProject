import Router from 'express'
import ParamsChecker from '../Middlewares/paramsChecker.js'
import Users from '../Controllers/users.js'
import Stats from '../Controllers/stats.js'
import Database from '../db.js'

const router = new Router()

// Required parameters { query: [], body: [] }
const registerParams = { body: ['discordID', 'eosID'] }
const profileParams = { query: ['discordID'] }
const updateProfileParams = { body: ['discordID', 'params'] }
const endGameParams = { body: ['match_result'] }
const feedbackParams = { query: ['code'] }

// Routes
router.post('/register',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, registerParams), Users.register)

router.get('/profile',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, profileParams), Stats.getProfile)

router.get('/users', Users.getUsers)

router.post('/wipe',
    Stats.wipe)

router.post('/updateProfile',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, updateProfileParams), Stats.updateProfile)

router.post('/end_game',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, endGameParams), Stats.end_game)

router.delete('/deleteUser',
    Users.deleteUser)

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
    res.header('X-Powered-By', 'Ruslan op op op');

    return res.status(200).json({
        message: 'pong'
    })
})

// feedback route
router.get('/feedback',
    async (req, res, next) => await ParamsChecker.checkExistance(req, res, next, feedbackParams),
    async (req, res) => {
        try {
            return res.status(parseInt(req.query.code)).json({
                message: (parseInt(req.query.code) >= 500) ? 'Server error responses' : (parseInt(req.query.code) >= 400) ? 'Client error responses' : (parseInt(req.query.code) >= 300) ? 'Redirection messages' : (parseInt(req.query.code) >= 200) ? 'Success messages' : 'Informational messages'
            })
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (feedback)'
            })
        }
    })

// 404 route
router.use((req, res) => {
    return res.status(404).json({
        message: `[${req.method}] ${req.url} not found!`
    })
})

export default router