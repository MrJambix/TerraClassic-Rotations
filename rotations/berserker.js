module.exports = class BerserkerRotation {
    constructor(mod, helpers) {
        this.mod = mod;
        this.pcid = helpers.pcid;
        this.playerLocation = helpers.playerLocation;
        this.isSkillOnCooldown = helpers.isSkillOnCooldown;
        this.setCooldown = helpers.setCooldown;
        this.castSkill = helpers.castSkill;

        this.availableSkills = new Set();

        // In-game skill IDs mapped from skills.js[3]
        this.skills = {
            thunderstrike: 100202,     // skills[3][3]
            flatten: 100203,           // skills[3][4]
            cyclone: 100200,           // skills[3][10]
            vampiricBlow: 100201,      // skills[3][15]
            lethalStrike: 100204,      // skills[3][18]
            staggeringStrike: 100207,  // skills[3][6]
            punishingStrike: 100206,   // skills[3][32]
            raze: 100205,              // skills[3][25]
            leapingStrike: 100208      // skills[3][11]
        };

        mod.hook('S_SKILL_LIST', 2, event => {
            for (const skill of event.skills) {
                this.availableSkills.add(skill.id);
            }
        });
    }

    canCast(skillId) {
        return (
            !this.isSkillOnCooldown(skillId) &&
            this.availableSkills.has(skillId)
        );
    }

    async chargeAndCast(baseId, releaseSubId, chargeTime, castDuration) {
        this.mod.send('C_PRESS_SKILL', 4, {
            skill: { id: baseId, type: 0 },
            press: true,
            loc: this.playerLocation.loc,
            w: this.playerLocation.w,
            target: 0
        });

        await new Promise(res => setTimeout(res, chargeTime));

        this.castSkill({ id: baseId, type: releaseSubId }, castDuration);
    }

    async execute(enabled) {
        if (!enabled) return;

        const s = this.skills;

        // Skill priority rotation
        const priority = [
            s.thunderstrike,
            s.flatten,
            s.cyclone,
            s.vampiricBlow,
            s.lethalStrike,
            s.staggeringStrike,
            s.punishingStrike,
            s.raze,
            s.leapingStrike
        ];

        for (let skill of priority) {
            if (!this.canCast(skill)) continue;

            if (
                skill === s.thunderstrike ||
                skill === s.cyclone ||
                skill === s.vampiricBlow ||
                skill === s.lethalStrike
            ) {
                await this.chargeAndCast(skill, 13, 1950, 1000);
            } else if (skill === s.leapingStrike) {
                this.castSkill(skill, 2175);
            } else if (skill === s.flatten) {
                this.castSkill(skill, 3100);
            } else if (skill === s.staggeringStrike) {
                this.castSkill(skill, 1265);
            } else if (skill === s.punishingStrike) {
                this.castSkill(skill, 1400);
            } else if (skill === s.raze) {
                this.castSkill(skill, 1200);
            }

            break; // Only cast one skill per tick
        }
    }
};
