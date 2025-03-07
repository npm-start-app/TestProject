import Database from '../db.js'

const isNumeric = (string) => { return /^\d+$/.test(string); }

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

            const result = await stats.updateOne({ eosID: user.eosID }, { $set: { playerKills: 0, playerDeaths: 0, playerTeamKills: 0, playerVehicleKills: 0, playerWounds: 0, playerWoundeds: 0, playerRevivePoints: 0, playerHealScore: 0, playerTeamWorkScore: 0, playerObjectiveScore: 0, playerCombatScore: 0, playerLevel: 1, playerName: null, playerExperience: 0, playerNeededExperience: 100, playerWins: 0, playerDefeats: 0, playerMatches: 0 } });
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

    static async end_game(req, res) {
        let updatedProfiles = 0;

        try {
            const match_result = req.body['match_result'];

            const stats = await Database.getDB().collection('Stats');

            for (const team in match_result['teams']) {
                const teams = match_result['teams']

                for (const squad in teams[team]['Squads']) {
                    const squads = teams[team]['Squads']

                    for (const player in squads[squad]['Players']) {
                        const players = squads[squad]['Players']

                        const userStats = await stats.findOne({ eosID: player });
                        if (!userStats) {
                            continue;
                        }

                        const getLevel = (e) => { return Math.ceil((1 + Math.sqrt(1 + (4*e)/100 - 4)) / 2) }
                        const getNeededExperience = (level) => { return 100 * level * level - 100 * level + 100 }

                        const result = await stats.updateOne({ eosID: player }, { $set: {
                            playerKills: userStats.playerKills + players[player]['Score']['Kills'],
                            playerDeaths: userStats.playerDeaths + players[player]['Score']['Deaths'],
                            playerTeamKills: userStats.playerTeamKills + players[player]['Score']['TeamKills'],
                            playerVehicleKills: userStats.playerVehicleKills + players[player]['Score']['VehicleKills'],
                            playerWounds: userStats.playerWounds + players[player]['Score']['Wounds'],
                            playerWoundeds: userStats.playerWoundeds + players[player]['Score']['Woundeds'],
                            playerRevivePoints: userStats.playerRevivePoints + players[player]['Score']['RevivePoints'],
                            playerHealScore: userStats.playerHealScore + players[player]['Score']['HealScore'],
                            playerTeamWorkScore: userStats.playerTeamWorkScore + players[player]['Score']['TeamWorkScore'],
                            playerObjectiveScore: userStats.playerObjectiveScore + players[player]['Score']['ObjectiveScore'],
                            playerCombatScore: userStats.playerCombatScore + players[player]['Score']['CombatScore'],
                            playerLevel: getLevel((userStats.playerExperience + players[player]['Score']['TeamWorkScore'] + players[player]['Score']['ObjectiveScore'] + players[player]['Score']['CombatScore']) / 3),
                            playerName: players[player]['Data']['UserName'],
                            playerExperience: userStats.playerExperience + players[player]['Score']['TeamWorkScore'] + players[player]['Score']['ObjectiveScore'] + players[player]['Score']['CombatScore'],
                            playerNeededExperience: getNeededExperience(getLevel((userStats.playerExperience + players[player]['Score']['TeamWorkScore'] + players[player]['Score']['ObjectiveScore'] + players[player]['Score']['CombatScore']) / 3))
                        } })

                        updatedProfiles++
                    }
                }
            }
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (end_game)'
            })
        }

        return res.status(200).json({
            message: 'Game ended!',
            updatedProfiles
        })
    }
}

export default Stats;