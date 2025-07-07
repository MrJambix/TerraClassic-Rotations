
function getNearestTarget(playerLoc, targets) {
    let nearest = null;
    let minDist = Infinity;

    for (const [id, loc] of targets.entries()) {
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

function faceNearest(mod, playerLocation, targets) {
    const nearest = getNearestTarget(playerLocation, targets);
    if (!nearest) return;

    const angle = calculateAngle(playerLocation.loc, nearest.loc);
    playerLocation.w = angle;

    mod.send('C_PLAYER_ROTATION', 1, {
        gameId: mod.game.me.gameId,
        w: angle
    });
}

module.exports = { faceNearest };
