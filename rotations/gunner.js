class GunnerRotation {
    constructor(mod, options) {
        this.mod = mod;
        this.command = mod.command;
        this.castSkill = options.castSkill;
        this.isSkillOnCooldown = options.isSkillOnCooldown;
        this.setCooldown = options.setCooldown;
        this.pcid = options.pcid;
        this.SKILLS = {};
    }

    execute(enabled) {
        if (!enabled) return;
        return 200;
    }
}
module.exports = GunnerRotation;