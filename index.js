// index.js - Main module file
module.exports = function PVE(mod) {
    /////// MODULE DEPENDENCIES ///////
    const { command } = mod.require;
    const skillData = require('./skills.js');
    const aimAssist = require('./utils/aimassist.js');

    /////// ROTATION IMPORTS ///////
    const WarriorRotation = require('./rotations/warrior');
    const BerserkerRotation = require('./rotations/berserker');
    const ArcherRotation = require('./rotations/archer');

    /////// GLOBAL STATE ///////
    let enabled = false;
    let auto = true;
    let useAimAssist = true;
    let skillsOnCooldown = {};
    let pcid, name, w, x, y, z;

    let warriorRotation = null;
    let berserkerRotation = null;
    let archerRotation = null;

    const playerLocation = { w: 0, loc: { x: 0, y: 0, z: 0 } };
    const knownTargets = new Map();
    let lastDumpTime = Date.now();
    const dumpInterval = 5000;

    // PLAYER RESOURCE STATE
    let playerMP = 0;
    let playerMaxMP = 0;

    /////// UTILITY FUNCTIONS ///////
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

    // Skill mana check helper
    function getSkillManaCost(skillId) {
        // Try to get from skillData (for current class)
        // skillData[classId][skillId][0]?.mpCost
        if (!mod.game.me) return 0;
        const classId = (mod.game.me.templateId - 10101) % 100;
        const skillClassData = skillData[classId] || {};
        // Skill data can have multiple stages, we use stage 0 for cost
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
        if (!hasEnoughMana(skillId)) return; // Not enough MP
        const targetLoc = target.loc || playerLocation.loc;
        const distance = checkDistance(playerLocation.loc, targetLoc);

        if (distance > 1000) return; // Abort if target is too far

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

    /////// LOGIN & CLASS SETUP ///////
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
                case 3:
                    berserkerRotation = new BerserkerRotation(mod, commonOptions);
                    command.message(`Berserker rotation loaded.`);
                    break;
                case 5:
                    archerRotation = new ArcherRotation(mod, commonOptions);
                    command.message(`Archer rotation loaded.`);
                    break;
                default:
                    command.message(`Logged in as ${name}. Unsupported class ID ${classId}.`);
            }
        } catch (e) {
            command.message('Error in login hook: ' + e.message);
        }
    });

    /////// LOCATION TRACKING ///////
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

    /////// PLAYER MP TRACKING ///////
    mod.hook('S_PLAYER_STAT_UPDATE', 11, event => {
        if (event.gameId === pcid) {
            playerMP = event.mp;
            playerMaxMP = event.maxMp;
        }
    });

    /////// COMMANDS ///////
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
        if (warriorRotation) {
            warriorRotation.toggleTankMode();
            command.message(`Warrior tank mode toggled.`);
        } else {
            command.message('Warrior rotation not loaded.');
        }
    });

    /////// CONFIG LOAD ///////
    try {
        const config = require('./config.json');
        auto = config.auto?.auto ?? true;
    } catch (e) {
        auto = true;
    }

    /////// COOLDOWN HANDLING ///////
    function isSkillOnCooldown(skillId) {
        return skillsOnCooldown[skillId] && Date.now() < skillsOnCooldown[skillId];
    }

    function setCooldown(skillId, duration) {
        skillsOnCooldown[skillId] = Date.now() + duration;
    }

    /////// ROTATION LOOP (dynamic, based on skill duration) ///////
    let rotationTimeout = null;

    function startRotation() {
        stopRotation();

        function runRotation() {
            if (!enabled) return;

            let delay = 200; // fallback if no skill is cast

            // Warrior
            if (warriorRotation && typeof warriorRotation.execute === "function") {
                const skillDelay = warriorRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            // Berserker
            else if (berserkerRotation && typeof berserkerRotation.executeWithDelay === "function") {
                const skillDelay = berserkerRotation.executeWithDelay(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            } else if (berserkerRotation && typeof berserkerRotation.execute === "function") {
                // fallback for legacy .execute
                const skillDelay = berserkerRotation.execute(enabled);
                if (skillDelay && typeof skillDelay === "number") delay = skillDelay;
            }
            // Archer
            else if (archerRotation && typeof archerRotation.execute === "function") {
                const skillDelay = archerRotation.execute(enabled);
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

    /////// COMBAT STATUS AUTO-TOGGLE (using mod.game.me events) ///////
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

    /////// MODULE CLEANUP ///////
    this.destructor = () => {
        stopRotation();
        command.remove('on');
        command.remove('off');
        command.remove('auto');
        command.remove('aimassist');
        command.remove('tank');
    };
}