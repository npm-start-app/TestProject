import Database from '../db.js'

const isNumeric = (string) => {return /^\d+$/.test(string);}

class Stats {
    static async getProfile(req, res) {
        let userStats = {};

        try {
            const users = await Database.getDB().collection('Users');
            const stats = await Database.getDB().collection('Stats');

            // Check if the discordID and eosID are numbers
            if (!isNumeric(req.query.discordID)) {
                return res.status(400).json({
                    message: 'Invalid discordID or eosID!'
                })
            }

            // Find the user
            const user = await users.findOne({ discordID: parseInt(req.query.discordID) });
            if (!user) {
                return res.status(400).json({
                    message: 'User not found!'
                })
            }

            // Get the user stats
            userStats = await stats.findOne({ eosID: user.eosID });
            if (!userStats) {
                return res.status(400).json({
                    message: 'Stats not found!'
                })
            }

            delete userStats._id;
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (getProfile)'
            })
        }

        return res.status(200).json({
            ...userStats
        })
    }

    static async updateProfile(req, res) {
        let updatedParams = [];

        try {
            const users = await Database.getDB().collection('Users');
            const stats = await Database.getDB().collection('Stats');

            // Check if the discordID and eosID are numbers
            if (!isNumeric(req.body.discordID)) {
                return res.status(400).json({
                    message: 'Invalid discordID or eosID!'
                })
            }

            // Find the user
            const user = await users.findOne({ discordID: parseInt(req.body.discordID) });
            if (!user) {
                return res.status(400).json({
                    message: 'User not found!'
                })
            }

            // Find the user stats
            const userStats = await stats.findOne({ eosID: user.eosID });
            if (!userStats) {
                return res.status(400).json({
                    message: 'Stats not found!'
                })
            }

            // Update the user stats
            // req.body.params = JSON.parse(req.body.params);
            for (const key in req.body.params) {
                if (userStats.hasOwnProperty(key)) {
                    const result = await stats.updateOne({ eosID: user.eosID }, { $set: { [key]: req.body.params[key] } });
                    if (result.matchedCount !== 0) {
                        updatedParams.push(key);
                    }
                }
            }
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (updateProfile)'
            })
        }

        return res.status(200).json({
            message: 'Profile updated!',
            updatedParams
        })
    }

    static async wipeProfile(req, res) {
        try {
            const users = await Database.getDB().collection('Users');
            const stats = await Database.getDB().collection('Stats');

            // Check if the discordID and eosID are numbers
            if (!isNumeric(req.body.discordID)) {
                return res.status(400).json({
                    message: 'Invalid discordID or eosID!'
                })
            }

            // Find the user
            const user = await users.findOne({ discordID: parseInt(req.body.discordID) });
            if (!user) {
                return res.status(400).json({
                    message: 'User not found!'
                })
            }

            const result = await stats.updateOne({ eosID: user.eosID }, { $set: { playerKills: 0, playerDeaths: 0, playerTeamKills: 0, playerVehicleKills: 0, playerWounds: 0, playerWoundeds: 0, playerRevivePoints: 0, playerHealScore: 0, playerTeamWorkScore: 0, playerObjectiveScore: 0, playerCombatScore: 0, playerLevel: 1, playerName: 'Player', playerExperience: 0, playerNeededExperience: 100, playerWins: 0, playerDefeats: 0, playerDraws: 0, playerMatches: 0 } });
            if (result.matchedCount === 0) {
                return res.status(400).json({
                    message: 'Stats not found!'
                })
            }
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (wipeProfile)'
            })
        }

        return res.status(200).json({
            message: 'Profile wiped!'
        })
    }
}

export default Stats;