module.exports = class ArcherRotation {
    constructor(mod, helpers) {
        this.mod = mod;
        this.isSkillOnCooldown = helpers.isSkillOnCooldown;
        this.setCooldown = helpers.setCooldown;
        this.pcid = helpers.pcid;
        this.playerLocation = helpers.playerLocation;
        this.castSkill = helpers.castSkill;
        this.skills = helpers.skills;

        this.availableSkills = new Set();
        this.activeBuffs = new Set();

        // Track available skills
        mod.hook('S_SKILL_LIST', 2, event => {
            for (const skill of event.skills) {
                this.availableSkills.add(skill.id);
            }
        });

        // Track active abnormalities (buffs)
        mod.hook('S_ABNORMALITY_BEGIN', 3, event => {
            if (event.target === this.pcid) {
                this.activeBuffs.add(event.id);
            }
        });

        mod.hook('S_ABNORMALITY_END', 1, event => {
            if (event.target === this.pcid) {
                this.activeBuffs.delete(event.id);
            }
        });
    }

    canCast(skillId) {
        return (
            !this.isSkillOnCooldown(skillId) &&
            this.availableSkills.has(skillId)
        );
    }

    hasBuff(buffId) {
        return this.activeBuffs.has(buffId);
    }

    async execute(enabled) {
        if (!enabled) return;

        const priority = [
            this.skills.radiantArrow,
            this.skills.penetratingArrow,
            this.skills.arrowVolley,
            this.skills.thunderbolt,
            this.skills.rainOfArrows,
            this.skills.poisonArrow,
            this.skills.sequentialFire,
            this.skills.arrow // Filler
        ];

        for (let skillId of priority) {
            if (!this.canCast(skillId)) continue;

            // Buff check for Sequential Fire
            if (skillId === this.skills.sequentialFire && !this.hasBuff(this.skills.sequentialFireBuff)) continue;

            // Handle skill types
            if (skillId === this.skills.radiantArrow || skillId === this.skills.penetratingArrow) {
                await this.chargeAndCast(skillId, 13, 1800, 1000);
            } else {
                this.castSkill(skillId, 1000);
            }
            break;
        }
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
};
