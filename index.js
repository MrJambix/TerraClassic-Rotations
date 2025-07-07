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

    function castSkill(skillId, duration, target = {}) {
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

    /////// ROTATION LOOP ///////
    let rotationInterval;

    function startRotation() {
        if (rotationInterval) clearInterval(rotationInterval);

        rotationInterval = setInterval(() => {
            if (warriorRotation) {
                warriorRotation.execute(enabled);
            } else if (berserkerRotation) {
                berserkerRotation.execute(enabled);
            } else if (archerRotation) {
                archerRotation.execute(enabled);
            }
        }, 100);
    }

    function stopRotation() {
        if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = null;
        }
    }

    /////// COMBAT STATUS AUTO-TOGGLE ///////
    mod.hook('S_USER_STATUS', 3, event => {
        if (event.gameId !== pcid) return;

        if (event.status === 1 && auto && !rotationInterval) {
            enabled = true;
            startRotation();
        } else if (event.status === 0 && auto && rotationInterval) {
            stopRotation();
            enabled = false;
        }
    });

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
