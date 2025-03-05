import Database from '../db.js'

class Stats {
    static async getProfile(req, res) {
        let userStats = {};

        try {
            const users = await Database.getClient().db('testdb').collection('Users');
            const stats = await Database.getClient().db('testdb').collection('Stats');

            // Find the user
            const user = await users.findOne({ discordID: req.query.discordID });
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
            return res.status(500).json({
                message: 'Internal server error (getProfile)'
            })
        }

        return res.status(200).json({
            ...userStats
        })
    }

    static async wipeProfile(req, res) {
        try {
            const users = await Database.getClient().db('testdb').collection('Users');
            const stats = await Database.getClient().db('testdb').collection('Stats');

            // Find the user
            const user = await users.findOne({ discordID: req.body.discordID });
            if (!user) {
                return res.status(400).json({
                    message: 'User not found!'
                })
            }

            const result = await stats.updateOne({ eosID: user.eosID }, { $set: { playerKills: 0, playerDeaths: 0, playerTeamKills: 0, playerVehicleKills: 0, playerWounds: 0, playerWoundeds: 0, playerRevivePoints: 0, playerHealScore: 0, playerTeamWorkScore: 0, playerObjectiveScore: 0, playerCombatScore: 0, playerLevel: 1, playerName: 'Player' } });
            if (result.matchedCount === 0) {
                return res.status(400).json({
                    message: 'Stats not found!'
                })
            }
        } catch (error) {
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