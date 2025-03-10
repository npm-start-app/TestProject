
class StatsScheme {
    static scheme = {
        eosID: 'string',
        playerKills: 'number',
        playerDeaths: 'number',
        playerTeamKills: 'number',
        playerVehicleKills: 'number',
        playerWounds: 'number',
        playerWoundeds: 'number',
        playerRevivePoints: 'number',
        playerHealScore: 'number',
        playerTeamWorkScore: 'number',
        playerObjectiveScore: 'number',
        playerCombatScore: 'number',
        playerLevel: 'number',
        playerName: 'string',
        playerExperience: 'number',
        playerNeededExperience: 'number',
        playerWins: 'number',
        playerDefeats: 'number',
        playerMatches: 'number'
    }

    static getType(key) {
        return this.scheme[key]
    }
}

export default StatsScheme