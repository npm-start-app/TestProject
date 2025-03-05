import Database from '../db.js'

class Users {
    static async register(req, res) {
        try {
            const users = await Database.getDB().collection('Users');
            const stats = await Database.getDB().collection('Stats');

            // Find if the user already exists
            const userByDiscordID = await users.findOne({ discordID: req.body.discordID });
            if (userByDiscordID) {
                return res.status(400).json({
                    message: 'User already exists!'
                })
            }

            const userByEosdID = await users.findOne({ eosID: req.body.eosID });
            if (userByEosdID) {
                return res.status(400).json({
                    message: 'User already exists!'
                })
            }

            // Register the user
            await users.insertOne({
                discordID: req.body.discordID,
                eosID: req.body.eosID
            })

            // Register the user in the stats collection
            await stats.insertOne({
                eosID: req.body.eosID,
                playerKills: 0,
                playerDeaths: 0,
                playerTeamKills: 0,
                playerVehicleKills: 0,
                playerWounds: 0,
                playerWoundeds: 0,
                playerRevivePoints: 0,
                playerHealScore: 0,
                playerTeamWorkScore: 0,
                playerObjectiveScore: 0,
                playerCombatScore: 0,
                playerLevel: 1,
                playerName: 'Player'
            })
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (register)'
            })
        }

        return res.status(200).json({
            message: 'User registered!'
        })
    }
}

export default Users;