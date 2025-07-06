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
        this.inventory = {};

        mod.hook('U19MT0dJTg==', Buffer.from('12').toString('base64'), () => { this.inventory = {}; });
        mod.hook('U19JTlZFTg==', Buffer.from('18').toString('base64'), event => {
            for (const item of event.items) {
                if (this.HP_POTION_IDS.includes(item.id) && item.amount > 0) {
                    this.inventory[item.id] = item.dbid;
                }
            }
        });

        mod.hook('U19QTEFZRVJfU1RBVF9VUERBVEU=', Buffer.from('11').toString('base64'), event => {
            this.curHp = Number(event.curHp);
            this.maxHp = Number(event.maxHp);
        });

        mod.hook('U19TWVNURU1fTUVTU0FHRQ==', Buffer.from('1').toString('base64'), event => {
            if (event.message.includes('@1013') || event.message.includes('@36')) {
                mod.send('Q19DSEVDS19WRVJTSU9O', Buffer.from('1').toString('base64'), {});
            }
        });
    }

    checkAndUsePotion() {
        if (this.usingPotion) return;
        if (Date.now() - this.lastPotionTime < this.cooldown) return;
        if (this.curHp / this.maxHp <= 0.6) {
            for (let id of this.HP_POTION_IDS.slice().reverse()) {
                if (this.inventory[id]) {
                    this.usePotion(id, this.inventory[id]);
                    break;
                }
            }
        }
    }

    usePotion(itemId, dbid) {
        this.usingPotion = true;
        this.lastPotionTime = Date.now();
        this.mod.toServer('Q19VU0VfSVRFTQ==', Buffer.from('3').toString('base64'), {
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

    destructor() {}
}

module.exports = AutoPot;
