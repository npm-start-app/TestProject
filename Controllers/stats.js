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
            // Check if stats has been requested, if has not, warn user

            const dbConfig = await Database.getDB().collection('Config');
            const wipe = await dbConfig.findOne({ name: 'Wipe' })
            if (!wipe.wasStatsRequested) {
                const createWarning = async () => {
                    await dbConfig.updateOne({ name: 'Wipe' }, {
                        $set: {
                            wasWarned: true,
                            timeOfGivenWarning: Date.now()
                        }
                    })
                }

                if (!wipe.wasWarned) {
                    await createWarning()

                    return res.status(409).json({
                        message: 'Stats has not been requested, to do wipe, add body param "wipe: true"',
                    })
                } else {
                    if (!req.body.wipe || req.body.wipe !== 'true') {
                        return res.status(409).json({
                            message: 'Needs body param "wipe: true" to wipe',
                        })
                    }

                    if (Date.now() - wipe.timeOfGivenWarning > 1 * 60 * 3600 * 1000) {
                        await createWarning()

                        return res.status(409).json({
                            message: 'Wipe request was time out (1 hour), to do wipe, add body param "wipe: true"',
                        })
                    }
                }
            }
            await dbConfig.updateOne({ name: 'Wipe' }, {
                $set: {
                    wasWarned: false,
                    wasStatsRequested: false,
                    timeOfGivenWarning: null
                }
            })

            // Do wipe

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
                            playerMatches: 0,
                            playerSquadLeaderScore: 0,
                            playerDamage: 0
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

            if (match_result['win_team'] === undefined) {
                return res.status(400).json({
                    message: 'Invalid player stats! (-1)'
                })
            }

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
                        if (players[player]['Score']['Kills'] === undefined || players[player]['Score']['Deaths'] === undefined || players[player]['Score']['TeamKills'] === undefined || players[player]['Score']['VehicleKills'] === undefined || players[player]['Score']['Wounds'] === undefined || players[player]['Score']['Woundeds'] === undefined || players[player]['Score']['RevivePoints'] === undefined || players[player]['Score']['HealScore'] === undefined || players[player]['Score']['TeamWorkScore'] === undefined || players[player]['Score']['ObjectiveScore'] === undefined || players[player]['Score']['CombatScore'] === undefined || players[player]['Data']['UserName'] === undefined || squads[squad]['Score']['CombatScore'] === undefined || squads[squad]['Score']['TeamWorkScore'] === undefined || squads[squad]['Score']['ObjectiveScore'] === undefined || players[player]['Score']['Damage'] === undefined) {
                            return res.status(400).json({
                                message: 'Invalid player stats! (0)'
                            })
                        }

                        // Check parameters` type
                        if (!isNumber(players[player]['Score']['Kills']) || !isNumber(players[player]['Score']['Deaths']) || !isNumber(players[player]['Score']['TeamKills']) || !isNumber(players[player]['Score']['VehicleKills']) || !isNumber(players[player]['Score']['Wounds']) || !isNumber(players[player]['Score']['Woundeds']) || !isNumber(players[player]['Score']['RevivePoints']) || !isNumber(players[player]['Score']['HealScore']) || !isNumber(players[player]['Score']['TeamWorkScore']) || !isNumber(players[player]['Score']['ObjectiveScore']) || !isNumber(players[player]['Score']['CombatScore']) || !isNumber(squads[squad]['Score']['CombatScore']) || !isNumber(squads[squad]['Score']['TeamWorkScore']) || !isNumber(squads[squad]['Score']['ObjectiveScore']) || !isNumber(players[player]['Score']['Damage'])) {
                            return res.status(400).json({
                                message: 'Invalid player stats! (1)'
                            })
                        }
                        if (typeof players[player]['Data']['UserName'] !== 'string') {
                            return res.status(400).json({
                                message: 'Invalid player stats! (2)'
                            })
                        }

                        // Calculate player level by formula
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
                                    d),
                                playerSquadLeaderScore: (squads[squad]['Leader']['id'] === player) ? userStats.playerSquadLeaderScore + (Number(squads[squad]['Score']['CombatScore']) + Number(squads[squad]['Score']['ObjectiveScore']) + Number(squads[squad]['Score']['TeamWorkScore'])) / 500 : userStats.playerSquadLeaderScore,
                                playerDefeats: (match_result['win_team'] === team) ? userStats.playerDefeats : userStats.playerDefeats + 1,
                                playerMatches: userStats.playerMatches + 1,
                                playerWins: (match_result['win_team'] === team) ? userStats.playerWins + 1 : userStats.playerWins,
                                playerDamage: userStats.playerDamage + Number(players[player]['Score']['Damage'])
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

    static async getStats(req, res) {
        let bestKillers = []
        let bestMedics = []
        let bestVehicleKillers = []
        let bestWinners = []
        let bestScorePlayers = []
        let bestDamagers = []

        try {
            const stats = await Database.getDB().collection('Stats');

            let page = 0;
            let limit = 20;

            while (true) {
                const result = await stats.find().skip(limit * page).limit(limit).toArray();

                if (result.length === 0) {
                    break;
                }

                // Best Killers
                const bestKillersNotSorted = [...result, ...bestKillers]

                bestKillers = bestKillersNotSorted
                    .sort((a, b) => b.playerKills - a.playerKills)
                    .slice(0, 15);

                // Best Medics
                const bestMedicsNotSorted = [...result, ...bestMedics]

                bestMedics = bestMedicsNotSorted
                    .sort((a, b) => b.playerWoundeds - a.playerWoundeds)
                    .slice(0, 5);

                // Best Vehicle Killers
                const bestVehicleKillersNotSorted = [...result, ...bestVehicleKillers]

                bestVehicleKillers = bestVehicleKillersNotSorted
                    .sort((a, b) => b.playerVehicleKills - a.playerVehicleKills)
                    .slice(0, 5);

                // Best Winners
                const bestWinnersNotSorted = [...result, ...bestWinners]

                bestWinners = bestWinnersNotSorted
                    .sort((a, b) => b.playerWins - a.playerWins)
                    .slice(0, 3);

                // Best Score Players
                const bestScorePlayersNotSorted = [...result, ...bestScorePlayers]

                bestScorePlayers = bestScorePlayersNotSorted
                    .sort((a, b) => (b.playerCombatScore + b.playerHealScore + b.playerObjectiveScore + b.playerTeamWorkScore) - (a.playerCombatScore + a.playerHealScore + a.playerObjectiveScore + a.playerTeamWorkScore))
                    .slice(0, 3);

                // Best Damagers
                const bestDamagersNotSorted = [...result, ...bestDamagers]

                bestDamagers = bestDamagersNotSorted
                    .sort((a, b) => b.playerDamage - a.playerDamage)
                    .slice(0, 3);

                page++
            }

            // Best Killers
            for (let i = 0; i < bestKillers.length; i++) {
                bestKillers[i] = {
                    name: bestKillers[i].playerName,
                    value: bestKillers[i].playerKills
                }
            }

            // Best Medics
            for (let i = 0; i < bestMedics.length; i++) {
                bestMedics[i] = {
                    name: bestMedics[i].playerName,
                    value: bestMedics[i].playerWoundeds
                }
            }

            // Best Vehicle Killers
            for (let i = 0; i < bestVehicleKillers.length; i++) {
                bestVehicleKillers[i] = {
                    name: bestVehicleKillers[i].playerName,
                    value: bestVehicleKillers[i].playerVehicleKills
                }
            }

            // Best Winners
            for (let i = 0; i < bestWinners.length; i++) {
                bestWinners[i] = {
                    name: bestWinners[i].playerName,
                    value: bestWinners[i].playerWins
                }
            }

            // Best Score Players
            for (let i = 0; i < bestScorePlayers.length; i++) {
                bestScorePlayers[i] = {
                    name: bestScorePlayers[i].playerName,
                    value: bestScorePlayers[i].playerCombatScore + bestScorePlayers[i].playerHealScore + bestScorePlayers[i].playerObjectiveScore + bestScorePlayers[i].playerTeamWorkScore
                }
            }

            // Best Damagers
            for (let i = 0; i < bestDamagers.length; i++) {
                bestDamagers[i] = {
                    name: bestDamagers[i].playerName,
                    value: bestDamagers[i].playerDamage
                }
            }
        } catch (error) {
            console.log(error)

            return res.status(500).json({
                message: 'Internal server error (getStats)'
            })
        }

        return res.status(200).json({
            bestKillers,
            bestMedics,
            bestVehicleKillers,
            bestWinners,
            bestScorePlayers,
            bestDamagers
        })
    }
}

export default Stats;