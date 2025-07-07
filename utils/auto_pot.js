// autopot.js - AutoPot using new inventory submodule (mod.game.inventory)
// Requires: mod.game.initialize("inventory");

class AutoPot {
    constructor(mod) {
        this.mod = mod;
        this.HP_POTION_IDS = [
            6550, 6560, 6561, 6562, 6563, 6564,
            6565, 6566, 169011, 169013, 169014
        ];
        this.curHp = 0;
        this.maxHp = 1;
        this.usingPotion = false;
        this.lastPotionTime = 0;
        this.cooldown = 8000;

        // Ensure inventory submodule is initialized!
        mod.game.initialize && mod.game.initialize("inventory");

        // Track HP
        mod.hook('S_PLAYER_STAT_UPDATE', 11, event => {
            this.curHp = Number(event.curHp);
            this.maxHp = Number(event.maxHp);
        });

        // Listen for inventory updates (optional: can log or trigger actions)
        // mod.game.inventory.on('update', () => { ... });
    }

    checkAndUsePotion() {
        if (this.usingPotion) return;
        if (Date.now() - this.lastPotionTime < this.cooldown) return;
        if (this.curHp / this.maxHp <= 0.6) {
            // Find the best available potion in inventory (bag or any pocket)
            for (let id of this.HP_POTION_IDS.slice().reverse()) {
                const item = this.mod.game.inventory.findInBagOrPockets(id);
                if (item && item.amount > 0) {
                    this.usePotion(id, item.dbid);
                    break;
                }
            }
        }
    }

    usePotion(itemId, dbid) {
        this.usingPotion = true;
        this.lastPotionTime = Date.now();
        this.mod.toServer('C_USE_ITEM', 3, {
            gameId: this.mod.game.me.gameId,
            id: itemId,
            dbid: dbid,
            target: 0n,
            amount: 1,
            dest: this.mod.game.me.loc,
            loc: this.mod.game.me.loc,
            w: this.mod.game.me.w,
            unk1: 0,
            unk2: 0,
            unk3: 0,
            unk4: false
        });
        setTimeout(() => this.usingPotion = false, this.cooldown);
    }

    destructor() {
        // No intervals/timers used; nothing to clean up
    }
}

module.exports = AutoPot;