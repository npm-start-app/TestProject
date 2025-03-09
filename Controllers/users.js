import Database from '../db.js'

const isNumeric = (string) => { return /^\d+$/.test(string); }

class Users {
    static async register(req, res) {
        try {
            const users = await Database.getDB().collection('Users');
            const stats = await Database.getDB().collection('Stats');

            // Check if the discordID and eosID are correct
            if (!isNumeric(req.body.discordID) || !(typeof req.body.eosID === 'string')) {
                return res.status(402).json({
                    message: 'Invalid discordID or eosID!'
                })
            }

            // Find if the user already exists
            const userByDiscordID = await users.findOne({ discordID: parseInt(req.body.discordID) });
            if (userByDiscordID) {
                return res.status(400).json({
                    message: 'User already exists!'
                })
            }

            const userByEosdID = await users.findOne({ eosID: req.body.eosID });
            if (userByEosdID) {
                return res.status(401).json({
                    message: 'User already exists!'
                })
            }

            // Register the user
            await users.insertOne({
                discordID: parseInt(req.body.discordID),
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
                playerName: null,
                playerExperience: 0,
                playerNeededExperience: 100,
                playerWins: 0,
                playerDefeats: 0,
                playerMatches: 0
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

    static async getUsers(req, res) {
        let records = [];

        const limit = 20;
        const page = parseInt(req.query.page) || 0;

        try {
            const users = await Database.getDB().collection('Users');

            records = await users.find().skip(limit * page).limit(limit).toArray();
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (getUsers)'
            })
        }

        return res.status(200).json({
            records
        })
    }

    static async deleteUser(req, res) {
        try {
            const users = await Database.getDB().collection('Users');
            const stats = await Database.getDB().collection('Stats');

            if (!req.body.eosID) {
                if (!req.body.discordID) {
                    return res.status(400).json({
                        message: 'Invalid parameters!'
                    })
                } else {
                    if (!isNumeric(req.body.discordID)) {
                        return res.status(400).json({
                            message: 'Invalid discordID or eosID!'
                        })
                    }

                    const result = await users.deleteOne({ discordID: parseInt(req.body.discordID) });
                    if (result.deletedCount === 0) {
                        return res.status(400).json({
                            message: 'User not found!'
                        })
                    }

                    const result_0 = await stats.deleteOne({ eosID: result.eosID });
                    if (result_0.deletedCount === 0) {
                        await users.deleteOne({ discordID: parseInt(req.body.discordID) })
                    }
                }
            } else {
                const result = await users.deleteOne({ eosID: req.body.eosID });
                if (result.deletedCount === 0) {
                    return res.status(400).json({
                        message: 'User not found!'
                    })
                }

                const result_0 = await stats.deleteOne({ eosID: req.body.eosID });
                if (result_0.deletedCount === 0) {
                    await users.deleteOne({ eosID: req.body.eosID })
                }
            }
        } catch (error) {
            return res.status(500).json({
                message: 'Internal server error (deleteUser)'
            })
        }

        return res.status(200).json({
            message: 'User deleted!'
        })
    }
}

export default Users;