import Database from '../db.js'
import StatsScheme from '../Schemes/stats.js';

const isNumeric = (string) => { return /^\d+$/.test(string); }
const isNumber = (string) => { return /^-?\d+(\.\d+)?$/.test(string); }

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
                    if (typeof req.body.params[key] !== StatsScheme.getType(key)) {
                        if (StatsScheme.getType(key) === 'number' && isNumber(req.body.params[key])) {
                            req.body.params[key] = Number(req.body.params[key])
                        } else {
                            continue;
                        }
                    }

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

    static async wipe(req, res) {
        let wipedProfiles = 0;

        try {
            const stats = await Database.getDB().collection('Stats');

            let page = 0;
            let limit = 20;

            while (true) {
                const result = await stats.find().skip(limit * page).limit(limit).toArray();

                if (result.length === 0) {
                    break;
                }

                for (const record of result) {
                    await stats.updateOne({ eosID: record.eosID }, {
                        $set: {
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
                            playerExperience: 0,
                            playerNeededExperience: 100,
                            playerWins: 0,
                            playerDefeats: 0,
                            playerMatches: 0
                        }
                    })

                    wipedProfiles++
                }

                page++
            }
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (wipe)',
            })
        }

        return res.status(200).json({
            message: 'Profiles wiped!',
            wipedProfiles
        })
    }

    static async end_game(req, res) {
        let updatedProfiles = 0;

        try {
            const match_result = req.body['match_result'];

            const stats = await Database.getDB().collection('Stats');

            // Json parsing
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

                        // Check parameters` existance
                        if (players[player]['Score']['Kills'] === undefined || players[player]['Score']['Deaths'] === undefined || players[player]['Score']['TeamKills'] === undefined || players[player]['Score']['VehicleKills'] === undefined || players[player]['Score']['Wounds'] === undefined || players[player]['Score']['Woundeds'] === undefined || players[player]['Score']['RevivePoints'] === undefined || players[player]['Score']['HealScore'] === undefined || players[player]['Score']['TeamWorkScore'] === undefined || players[player]['Score']['ObjectiveScore'] === undefined || players[player]['Score']['CombatScore'] === undefined || players[player]['Data']['UserName'] === undefined) {
                            return res.status(400).json({
                                message: 'Invalid player stats! (0)' 
                            })
                        }

                        // Check parameters` type
                        if (!isNumber(players[player]['Score']['Kills']) || !isNumber(players[player]['Score']['Deaths']) || !isNumber(players[player]['Score']['TeamKills']) || !isNumber(players[player]['Score']['VehicleKills']) || !isNumber(players[player]['Score']['Wounds']) || !isNumber(players[player]['Score']['Woundeds']) || !isNumber(players[player]['Score']['RevivePoints']) || !isNumber(players[player]['Score']['HealScore']) || !isNumber(players[player]['Score']['TeamWorkScore']) || !isNumber(players[player]['Score']['ObjectiveScore']) || !isNumber(players[player]['Score']['CombatScore'])) {
                            return res.status(400).json({
                                message: 'Invalid player stats! (1)'
                            })
                        }
                        if (typeof players[player]['Data']['UserName'] !== 'string') {
                            return res.status(400).json({
                                message: 'Invalid player stats! (2)'
                            })
                        }

                        // Calculate the player level by formula
                        //          - a(n) = a(n-1) + d * (n-1), where d > 0, n > 0 | n - integer, a(1) = 100
                        const getLevel = (e, d) => { return Math.ceil((1 + Math.sqrt(1 + 8 * (e - 100) / d)) / 2) }
                        const getNeededExperience = (level, d) => { return 100 + d * (level - 1) * level / 2 }
                        const d = 50
                        const a1 = 100
                        const playerExperience = userStats.playerExperience + (Number(players[player]['Score']['TeamWorkScore']) + Number(players[player]['Score']['ObjectiveScore']) + Number(players[player]['Score']['CombatScore']) + Number(players[player]['Score']['HealScore'])) / 100

                        const result = await stats.updateOne({ eosID: player }, {
                            $set: {
                                playerKills: userStats.playerKills + Number(players[player]['Score']['Kills']),
                                playerDeaths: userStats.playerDeaths + Number(players[player]['Score']['Deaths']),
                                playerTeamKills: userStats.playerTeamKills + Number(players[player]['Score']['TeamKills']),
                                playerVehicleKills: userStats.playerVehicleKills + Number(players[player]['Score']['VehicleKills']),
                                playerWounds: userStats.playerWounds + Number(players[player]['Score']['Wounds']),
                                playerWoundeds: userStats.playerWoundeds + Number(players[player]['Score']['Woundeds']),
                                playerRevivePoints: userStats.playerRevivePoints + Number(players[player]['Score']['RevivePoints']),
                                playerHealScore: userStats.playerHealScore + Number(players[player]['Score']['HealScore']),
                                playerTeamWorkScore: userStats.playerTeamWorkScore + Number(players[player]['Score']['TeamWorkScore']),
                                playerObjectiveScore: userStats.playerObjectiveScore + Number(players[player]['Score']['ObjectiveScore']),
                                playerCombatScore: userStats.playerCombatScore + Number(players[player]['Score']['CombatScore']),
                                playerLevel: (playerExperience < a1) ? 1
                                    : (getNeededExperience(getLevel(playerExperience, d), d) === playerExperience) ? getLevel(playerExperience, d) + 1 : getLevel(playerExperience, d),
                                playerName: players[player]['Data']['UserName'],
                                playerExperience: playerExperience,
                                playerNeededExperience: getNeededExperience(
                                    (playerExperience < a1) ? 1
                                        : (getNeededExperience(getLevel(playerExperience, d), d) === playerExperience) ? getLevel(playerExperience, d) + 1 : getLevel(playerExperience, d),
                                    d)
                            }
                        })
                        if (result.matchedCount !== 0) {
                            updatedProfiles++
                        }
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