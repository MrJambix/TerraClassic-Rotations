// Warrior Rotation - Refactored with skills.js integration

const warriorSkills = require('../skills.js')[0]; // Class ID 0 = Warrior

class WarriorRotation {
    constructor(mod, options) {
        this.mod = mod;
        this.command = mod.command;
        this.isSkillOnCooldown = options.isSkillOnCooldown;
        this.setCooldown = options.setCooldown;
        this.pcid = options.pcid;
        this.playerLocation = options.playerLocation;
        this.castSkill = options.castSkill;
        this.skills = warriorSkills;

        this.tankMode = false;
        this.assaultStanceActive = false;
        this.defensiveStanceActive = false;
        this.resolveActive = false;
        this.lastAggroTime = 0;
        this.edgeCounter = 0;
        this.playerHp = 100;
        this.bossHp = 100;

        this.hookAbnormals();
        this.hookStats();
        this.hookAggro();
    }

    ///////// STANCE MANAGEMENT /////////
    tryCastStance() {
        const stance = this.tankMode ? 'defensive' : 'assault';
        const stanceSkill = stance === 'assault' ? 80100 : 90100;
        if (!this.isSkillOnCooldown(stanceSkill)) {
            this.castSkill(stanceSkill, 575);
            this.command.message(`Switched to ${stance} stance.`);
            return true;
        }
        return false;
    }

    setTankMode(enabled) {
        this.tankMode = enabled;
        this.tryCastStance();
    }

    ///////// BUFF / ABNORMAL HANDLERS /////////
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

    hookAggro() {
        this.mod.hook('S_NPC_TARGET_USER', 1, event => {
            if (event.target === this.pcid) this.lastAggroTime = Date.now();
        });
    }

    ///////// EXECUTE ROTATION /////////
    execute(enabled) {
        if (!enabled) return;

        this.tryCastStance();

        const now = Date.now();
        const aggroLost = now - this.lastAggroTime > 5000;

        const priority = [
            [40300, 2550], // Rain of Blows
            [190200, 980], // Rising Fury
            [180200, 1100], // Combative Strike
            [170200, 1600], // Vortex Slash
            [10300, 845],   // Combo Attack
        ];

        if (aggroLost && this.defensiveStanceActive && !this.isSkillOnCooldown(50100)) {
            this.castSkill(50100, 715); // Battle Cry
            return;
        }

        for (const [skillId, duration] of priority) {
            if (!this.isSkillOnCooldown(skillId)) {
                this.castSkill(skillId, duration);
                return;
            }
        }

        if (this.resolveActive && !this.isSkillOnCooldown(20100)) {
            this.castSkill(20100, 825); // Evasive Roll
        }
    }

    toggleStance() {
        this.setTankMode(!this.tankMode);
    }
}

module.exports = WarriorRotation;
