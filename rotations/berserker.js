// Berserker Rotation: Only casts cyclone, flatten, and combo attack (auto attack), supporting multiple skill IDs for each (as requested)

const berserkerSkills = {
    // Combo Attack ("auto attack"): support all known skill ids for combo
    comboAttack: [
        { id: 10100, index: 1,     unlock: 1 },     // default Combo Attack
        { id: 10101, index: 1,     unlock: 1 },
        { id: 10102, index: 1,     unlock: 1 },
        { id: 10103, index: 1,     unlock: 1 }
    ],
    // Cyclone: support classic and new skill id
    cyclone: [
        { id: 320400,  index: 10,   unlock: 6 },
        { id: 100111,  index: 10,   unlock: 6 }
    ],
    // Flatten: support classic and new skill id
    flatten: [
        { id: 320200,  index: 4,    unlock: 2 },
        { id: 40100,   index: 4,    unlock: 2 }
    ],
    // The rest remain defined for future reference, but are not cast in the rotation (single id only)
    thunderstrike:      [{ id: 320100, index: 3, unlock: 1 }],
    staggeringStrike:   [{ id: 320300, index: 6, unlock: 4 }],
    leapingStrike:      [{ id: 320500, index: 11, unlock: 12 }],
    vampiricBlow:       [{ id: 320600, index: 15, unlock: 20 }],
    lethalStrike:       [{ id: 320700, index: 18, unlock: 32 }],
    raze:               [{ id: 321000, index: 25, unlock: 40 }],
    punishingStrike:    [{ id: 321100, index: 32, unlock: 58 }],
    cyclone_10:         [{ id: 320410, index: "10-10", unlock: 6 }],
    cyclone_11:         [{ id: 320411, index: "10-11", unlock: 6 }],
    cyclone_12:         [{ id: 320412, index: "10-12", unlock: 6 }],
    cyclone_13:         [{ id: 320413, index: "10-13", unlock: 6 }],
    thunderstrike_10:   [{ id: 320110, index: "3-10", unlock: 1 }],
    thunderstrike_11:   [{ id: 320111, index: "3-11", unlock: 1 }],
    thunderstrike_12:   [{ id: 320112, index: "3-12", unlock: 1 }],
    thunderstrike_13:   [{ id: 320113, index: "3-13", unlock: 1 }],
    vampiricBlow_10:    [{ id: 320610, index: "15-10", unlock: 20 }],
    vampiricBlow_11:    [{ id: 320611, index: "15-11", unlock: 20 }],
    vampiricBlow_12:    [{ id: 320612, index: "15-12", unlock: 20 }],
    vampiricBlow_13:    [{ id: 320613, index: "15-13", unlock: 20 }],
    lethalStrike_10:    [{ id: 320710, index: "18-10", unlock: 32 }],
    lethalStrike_11:    [{ id: 320711, index: "18-11", unlock: 32 }],
    lethalStrike_12:    [{ id: 320712, index: "18-12", unlock: 32 }],
    lethalStrike_13:    [{ id: 320713, index: "18-13", unlock: 32 }],
    raze_31:            [{ id: 321031, index: "25-31", unlock: 40 }],
    punishingStrike_1:  [{ id: 321101, index: "32-1", unlock: 58 }]
};

const skillDurations = {
    // Combo Attack
    1: 1125,
    10100: 1125,
    10101: 1125,
    10102: 1125,
    10103: 1125,
    // Cyclone
    320400: 1500,
    100111: 1500,
    // Flatten
    320200: 1200,
    40100: 1200,
    // ...other durations as before
    320100: 1500, 320110: 1200, 320111: 1200, 320112: 1200, 320113: 1200,
    320300: 900,
    320410: 1200, 320411: 1200, 320412: 1200, 320413: 1200,
    320500: 1000,
    320600: 1200, 320610: 1200, 320611: 1200, 320612: 1200, 320613: 1200,
    320700: 1200, 320710: 1200, 320711: 1200, 320712: 1200, 320713: 1200,
    321000: 900, 321031: 800,
    321100: 800, 321101: 700
};

// Priority: cyclone, flatten, comboAttack
const skillCastList = [
    "cyclone",
    "flatten",
    "comboAttack"
];

class BerserkerRotation {
    constructor(mod, options) {
        this.mod = mod;
        this.command = mod.command;
        this.isSkillOnCooldown = options.isSkillOnCooldown;
        this.setCooldown = options.setCooldown;
        this.pcid = options.pcid;
        this.playerLocation = options.playerLocation;
        this.castSkill = options.castSkill;
        this.skills = berserkerSkills;
        this.hpPercent = 100;

        this.buildAvailableSkills();

        if (this.mod.game?.me?.on) {
            this.mod.game.me.on('change_level', () => this.buildAvailableSkills());
        }
        this.mod.hook('S_PLAYER_STAT_UPDATE', 11, () => this.buildAvailableSkills());
    }

    buildAvailableSkills() {
        const level = this.mod.game.me?.level || 1;
        // Only cast from skillCastList, but support all defined skill ids for each
        this.availableSkills = [];
        for (const skillKey of skillCastList) {
            const skillArr = this.skills[skillKey];
            for (const skillObj of skillArr) {
                if (skillObj && level >= (skillObj.unlock || 1)) {
                    this.availableSkills.push(skillObj);
                }
            }
        }
    }

    // Try all available skills in cast priority order, using all supported ids for each
    executeWithDelay(enabled) {
        if (!enabled) return 200;
        for (const skill of this.availableSkills) {
            if (!this.isSkillOnCooldown(skill.id)) {
                const duration = skillDurations[skill.id] || 1200;
                this.castSkill(skill.id, duration);
                return duration + 50;
            }
        }
        return 200;
    }

    // For backward compatibility (if index.js uses legacy .execute)
    execute(enabled) {
        return this.executeWithDelay(enabled);
    }
}

module.exports = BerserkerRotation;