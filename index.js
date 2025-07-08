// index.js - Main module file for SkillRotation (Toolbox/manifest compatible)
module.exports = function SkillRotation(mod) {
    const { command } = mod.require;
    const skillData = require('./skills.js');
    const aimAssist = require('./utils/aimassist.js');

    // ROTATION IMPORTS
    const WarriorRotation = require('./rotations/warrior');
    const BerserkerRotation = require('./rotations/berserker');
    const ArcherRotation = require('./rotations/archer');
    const GunnerRotation = require('./rotations/gunner');
    const PriestRotation = require('./rotations/priest');
    const MysticRotation = require('./rotations/mystic');
    const SlayerRotation = require('./rotations/slayer');

    // GLOBAL STATE
    let enabled = false;
    let auto = true;
    let useAimAssist = true;
    let skillsOnCooldown = {};
    let pcid, name, w, x, y, z;

    let warriorRotation = null;
    let berserkerRotation = null;
    let archerRotation = null;
    let gunnerRotation = null;
    let priestRotation = null;
    let mysticRotation = null;
    let slayerRotation = null;

    const playerLocation = { w: 0, loc: { x: 0, y: 0, z: 0 } };
    const knownTargets = new Map();
    let lastDumpTime = Date.now();
    const dumpInterval = 5000;

    // PLAYER RESOURCE STATE
    let playerMP = 0;
    let playerMaxMP = 0;

    // UTILITY FUNCTIONS
    function checkDistance(loc1, loc2) {
        const dx = loc1.x - loc2.x;
        const dy = loc1.y - loc2.y;
        const dz = loc1.z - loc2.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    function storeTargetLocation(gameId, loc) {
        knownTargets.set(gameId, loc);
        const now = Date.now();
        if (now - lastDumpTime > dumpInterval) {
            lastDumpTime = now;
            for (const [id, location] of knownTargets.entries()) {
                if (Date.now() - lastDumpTime > dumpInterval) break;
            }
        }
    }

    function getSkillManaCost(skillId) {
        if (!mod.game.me) return 0;
        const classId = (mod.game.me.templateId - 10101) % 100;
        const skillClassData = skillData[classId] || {};
        if (skillClassData[skillId] && skillClassData[skillId][0] && typeof skillClassData[skillId][0].mpCost !== 'undefined') {
            return skillClassData[skillId][0].mpCost;
        }
        return 0;
    }

    function hasEnoughMana(skillId) {
        const cost = getSkillManaCost(skillId);
        return playerMP >= cost;
    }

    function castSkill(skillId, duration, target = {}) {
        if (!hasEnoughMana(skillId)) return;
        const targetLoc = target.loc || playerLocation.loc;
        const distance = checkDistance(playerLocation.loc, targetLoc);

        if (distance > 1000) return;

        if (useAimAssist) {
            aimAssist.faceNearest(mod, playerLocation, knownTargets);
        }

        mod.send('C_START_SKILL', 7, {
            skill: skillId,
            w: playerLocation.w,
            loc: playerLocation.loc,
            dest: targetLoc,
            unk: true,
            moving: false,
            continue: false,
            target: target.gameId || 0
        });

        if (setCooldown) setCooldown(skillId, duration);
    }

    // LOGIN & CLASS SETUP
    mod.hook('S_LOGIN', 12, event => {
        try {
            name = event.name;
            pcid = event.gameId;

            enabled = false;
            skillsOnCooldown = {};

            const classId = (event.templateId - 10101) % 100;
            const commonOptions = {
                isSkillOnCooldown,
                setCooldown,
                pcid,
                playerLocation,
                castSkill,
                skills: skillData[classId] || {}
            };

            switch (classId) {
                case 0:
                    warriorRotation = new WarriorRotation(mod, commonOptions);
                    command.message(`Warrior rotation loaded.`);
                    break;
                case 1:
                    slayerRotation = new SlayerRotation(mod, commonOptions);
                    command.message(`Slayer rotation loaded.`);
                    break;
                case 3:
                    berserkerRotation = new BerserkerRotation(mod, commonOptions);
                    command.message(`Berserker rotation loaded.`);
                    break;
                case 4:
                    command.message(`Sorcerer not supported yet.`);
                    break;
                case 5:
                    archerRotation = new ArcherRotation(mod, commonOptions);
                    command.message(`Archer rotation loaded.`);
                    break;
                case 6:
                    priestRotation = new PriestRotation(mod, commonOptions);
                    command.message(`Priest rotation loaded.`);
                    break;
                case 7:
                    mysticRotation = new MysticRotation(mod, commonOptions);
                    command.message(`Mystic rotation loaded.`);
                    break;
                case 8:
                    command.message(`Lancer not supported yet.`);
                    break;
                case 9:
                    gunnerRotation = new GunnerRotation(mod, commonOptions);
                    command.message(`Gunner rotation loaded.`);
                    break;
                default:
                    command.message(`Logged in as ${name}. Unsupported class ID ${classId}.`);
            }
        } catch (e) {
            command.message('Error in login hook: ' + e.message);
        }
    });

    // LOCATION TRACKING
    mod.hook('C_PLAYER_LOCATION', 5, event => {
        w = event.w;
        x = event.loc.x;
        y = event.loc.y;
        z = event.loc.z;
        playerLocation.w = w;
        playerLocation.loc = { x, y, z };
    });

    mod.hook('S_NPC_LOCATION', 3, event => {
        storeTargetLocation(event.gameId, event.loc);
    });

    mod.hook('S_USER_LOCATION', 5, event => {
        storeTargetLocation(event.gameId, event.loc);
    });

    // PLAYER MP TRACKING
    mod.hook('S_PLAYER_STAT_UPDATE', 11, event => {
        if (event.gameId === pcid) {
            playerMP = event.mp;
            playerMaxMP = event.maxMp;
        }
    });

    // COMMANDS
    command.add('on', () => {
        enabled = true;
        command.message('Rotations enabled.');
    });

    command.add('off', () => {
        enabled = false;
        command.message('Rotations disabled.');
    });

    command.add('auto', () => {
        auto = !auto;
        command.message(`Auto ${auto ? 'enabled' : 'disabled'}.`);
    });

    command.add('aimassist', () => {
        useAimAssist = !useAimAssist;
        command.message(`AimAssist ${useAimAssist ? 'enabled' : 'disabled'}.`);
    });

    command.add('tank', () => {
        if (warriorRotation && typeof warriorRotation.toggleTankMode === "function") {
            warriorRotation.toggleTankMode();
            command.message(`Warrior tank mode toggled.`);
        } else {
            command.message('Warrior rotation not loaded or does not support tank mode.');
        }
    });

    command.add('rotationinfo', () => {
        command.message('SkillRotation module by MrJambix | https://github.com/MrJambix/TerraClassic-Rotations');
    });

    // CONFIG LOAD
    try {
        const config = require('./config.json');
        auto = config.auto?.auto ?? true;
    } catch (e) {
        auto = true;
    }

    // COOLDOWN HANDLING
    function isSkillOnCooldown(skillId) {
        return skillsOnCooldown[skillId] && Date.now() < skillsOnCooldown[skillId];
    }

    function setCooldown(skillId, duration) {
        skillsOnCooldown[skillId] = Date.now() + duration;
    }

    // ROTATION LOOP
    let rotationTimeout = null;

    function startRotation() {
        stopRotation();

        function runRotation() {
            if (!enabled) return;

            let delay = 200;

            if (warriorRotation && typeof warriorRotation.execute === "function") {
                const skillDelay = warriorRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            else if (berserkerRotation && typeof berserkerRotation.executeWithDelay === "function") {
                const skillDelay = berserkerRotation.executeWithDelay(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            } else if (berserkerRotation && typeof berserkerRotation.execute === "function") {
                const skillDelay = berserkerRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            else if (archerRotation && typeof archerRotation.execute === "function") {
                const skillDelay = archerRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            else if (gunnerRotation && typeof gunnerRotation.execute === "function") {
                const skillDelay = gunnerRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            else if (priestRotation && typeof priestRotation.execute === "function") {
                const skillDelay = priestRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            else if (mysticRotation && typeof mysticRotation.execute === "function") {
                const skillDelay = mysticRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            else if (slayerRotation && typeof slayerRotation.execute === "function") {
                const skillDelay = slayerRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }

            rotationTimeout = setTimeout(runRotation, delay);
        }
        runRotation();
    }

    function stopRotation() {
        if (rotationTimeout) {
            clearTimeout(rotationTimeout);
            rotationTimeout = null;
        }
    }

    // COMBAT STATUS AUTO-TOGGLE
    if (mod.game && mod.game.me) {
        mod.game.me.on('enter_combat', () => {
            if (auto && !rotationTimeout) {
                enabled = true;
                startRotation();
                command.message('Combat started: Rotation enabled.');
            }
        });

        mod.game.me.on('leave_combat', () => {
            if (auto && rotationTimeout) {
                stopRotation();
                enabled = false;
                command.message('Combat ended: Rotation disabled.');
            }
        });
    }

    // MODULE CLEANUP
    this.destructor = () => {
        stopRotation();
        command.remove('on');
        command.remove('off');
        command.remove('auto');
        command.remove('aimassist');
        command.remove('tank');
        command.remove('rotationinfo');
    };
}