// WarriorRotation - Full skill priority order, all skills included

class WarriorRotation {
    constructor(mod, options) {
        this.mod = mod;
        this.command = mod.command;
        this.castSkill = options.castSkill;
        this.isSkillOnCooldown = options.isSkillOnCooldown;
        this.setCooldown = options.setCooldown;
        this.pcid = options.pcid;

        // Warrior state
        this.assaultStanceActive = false;
        this.defensiveStanceActive = false;
        this.resolveActive = false;
        this.edgeCounter = 0;
        this.playerHp = 100;
        this.bossHp = 100;

        this.SKILLS = {
            // Core DPS
            RAIN_OF_BLOWS:     { id: 40500,   dur: 2550 }, // Rain of Blows
            RISING_FURY:       { id: 190200,  dur: 980  }, // Rising Fury
            COMBATIVE_STRIKE:  { id: 180200,  dur: 1100 }, // Combative Strike
            VORTEX_SLASH:      { id: 170200,  dur: 1600 }, // Vortex Slash
            COMBO_ATTACK:      { id: 10300,   dur: 845  }, // Combo Attack

            // Extra skills
            TRAVERSE_CUT:      { id: 280100,  dur: 900  }, // Traverse Cut
            BLADE_DRAW:        { id: 290100,  dur: 950  }, // Blade Draw
            DEATH_FROM_ABOVE:  { id: 100100,  dur: 1400 }, // Death from Above
        };

        // Buff tracking
        this.hookAbnormals();
        this.hookStats();
    }

    // Buff/abnormal tracking hooks
    hookAbnormals() {
        this.mod.hook('S_ABNORMALITY_BEGIN', 3, event => {
            if (event.target !== this.pcid) return;
            if (event.id === 100100) this.assaultStanceActive = true;
            if (event.id === 100101) this.defensiveStanceActive = true;
            if (event.id === 100400) this.resolveActive = true;
            if (event.id === 101300) this.edgeCounter = Math.min(event.stacks, 10);
        });
        this.mod.hook('S_ABNORMALITY_END', 1, event => {
            if (event.target !== this.pcid) return;
            if (event.id === 100100) this.assaultStanceActive = false;
            if (event.id === 100101) this.defensiveStanceActive = false;
            if (event.id === 100400) this.resolveActive = false;
            if (event.id === 101300) this.edgeCounter = 0;
        });
    }

    hookStats() {
        this.mod.hook('S_PLAYER_STAT_UPDATE', 11, event => {
            this.playerHp = Math.round((event.hp / event.maxHp) * 100);
        });
        this.mod.hook('S_BOSS_GAGE_INFO', 2, event => {
            if (event.templateId >= 1000) {
                this.bossHp = Math.round((event.curHp / event.maxHp) * 100);
            }
        });
    }

    execute(enabled) {
        if (!enabled) return;

        // --- PRIORITY ORDER (top = highest) ---
        if (!this.isSkillOnCooldown(this.SKILLS.RAIN_OF_BLOWS.id)) {
            this.castSkill(this.SKILLS.RAIN_OF_BLOWS.id, this.SKILLS.RAIN_OF_BLOWS.dur);
            return this.SKILLS.RAIN_OF_BLOWS.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.BLADE_DRAW.id)) {
            this.castSkill(this.SKILLS.BLADE_DRAW.id, this.SKILLS.BLADE_DRAW.dur);
            return this.SKILLS.BLADE_DRAW.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.RISING_FURY.id)) {
            this.castSkill(this.SKILLS.RISING_FURY.id, this.SKILLS.RISING_FURY.dur);
            return this.SKILLS.RISING_FURY.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.TRAVERSE_CUT.id)) {
            this.castSkill(this.SKILLS.TRAVERSE_CUT.id, this.SKILLS.TRAVERSE_CUT.dur);
            return this.SKILLS.TRAVERSE_CUT.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.COMBATIVE_STRIKE.id)) {
            this.castSkill(this.SKILLS.COMBATIVE_STRIKE.id, this.SKILLS.COMBATIVE_STRIKE.dur);
            return this.SKILLS.COMBATIVE_STRIKE.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.VORTEX_SLASH.id)) {
            this.castSkill(this.SKILLS.VORTEX_SLASH.id, this.SKILLS.VORTEX_SLASH.dur);
            return this.SKILLS.VORTEX_SLASH.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.DEATH_FROM_ABOVE.id)) {
            this.castSkill(this.SKILLS.DEATH_FROM_ABOVE.id, this.SKILLS.DEATH_FROM_ABOVE.dur);
            return this.SKILLS.DEATH_FROM_ABOVE.dur;
        }
        if (!this.isSkillOnCooldown(this.SKILLS.COMBO_ATTACK.id)) {
            this.castSkill(this.SKILLS.COMBO_ATTACK.id, this.SKILLS.COMBO_ATTACK.dur);
            return this.SKILLS.COMBO_ATTACK.dur;
        }
    }
}

module.exports = WarriorRotation;