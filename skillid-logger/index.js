"use strict";
const SkillID = require("./skillid.js");

module.exports = function skillidLogger(mod) {
    mod.hook('C_START_SKILL', 7, event => {
        let skill = SkillID.fromUint32(event.skill.id);
        mod.command.message(
            `Skill Used: ${skill.toString()} | id: ${skill.id} | type: ${skill.type} | npc: ${skill.npc} | huntingZoneId: ${skill.huntingZoneId}`
        );
    });
};