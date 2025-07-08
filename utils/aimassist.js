function getNearestTarget(playerLoc, targets) {
    let nearest = null;
    let minDist = Infinity;

    for (const [id, loc] of (targets instanceof Map ? targets.entries() : Object.entries(targets))) {
        const dx = playerLoc.loc.x - loc.x;
        const dy = playerLoc.loc.y - loc.y;
        const dz = playerLoc.loc.z - loc.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (dist < minDist) {
            minDist = dist;
            nearest = { gameId: id, loc };
        }
    }

    return nearest;
}

function calculateAngle(from, to) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return Math.atan2(dy, dx);
}

// No notifications or rotation packets
function faceNearest(mod, playerLocation, targets) {
    const nearest = getNearestTarget(playerLocation, targets);
    if (!nearest) {
        // Optionally, keep an error/debug message if you want:
        // mod.command && mod.command.message("No valid targets found.");
        return;
    }

    const angle = calculateAngle(playerLocation.loc, nearest.loc);
    playerLocation.w = angle;

    // Do not notify or send any packet.
}

module.exports = { faceNearest, getNearestTarget, calculateAngle };