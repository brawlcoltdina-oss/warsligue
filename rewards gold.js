// ==========================================
// WARSLIGUE — SYSTÈME DE COFFRES & RÉCOMPENSES 💰
// VERSION ULTRA-NERFÉE + ANIMATION PROGRESSIVE
// ==========================================

// ✅ TYPES DE COFFRES (RÉCOMPENSES DRASTIQUEMENT RÉDUITES)
const CHEST_TYPES = {
    basic: {
        name: "Coffre Basique",
        emoji: "📦",
        cost: 0,
        minGold: 5,
        maxGold: 15,
        rarityWeights: {
            common: 99.5,
            rare: 0.45,
            epic: 0.04,
            legendary: 0.01
        }
    },
    silver: {
        name: "Coffre Argent",
        emoji: "🎁",
        cost: 100,
        minGold: 10,
        maxGold: 30,
        rarityWeights: {
            common: 98,
            rare: 1.8,
            epic: 0.18,
            legendary: 0.02
        }
    },
    gold: {
        name: "Coffre Or",
        emoji: "💎",
        cost: 250,
        minGold: 25,
        maxGold: 60,
        rarityWeights: {
            common: 95,
            rare: 4.5,
            epic: 0.45,
            legendary: 0.05
        }
    },
    mega: {
        name: "Méga Coffre",
        emoji: "🏆",
        cost: 500,
        minGold: 50,
        maxGold: 100,
        rarityWeights: {
            common: 88,
            rare: 10,
            epic: 1.8,
            legendary: 0.2
        }
    }
};

const RARITIES = {
    common: {
        name: "Commun",
        color: "#95a5a6",
        glowColor: "rgba(149,165,166,0.4)"
    },
    rare: {
        name: "Rare",
        color: "#3498db",
        glowColor: "rgba(52,152,219,0.5)"
    },
    epic: {
        name: "Épique",
        color: "#9b59b6",
        glowColor: "rgba(155,89,182,0.6)"
    },
    legendary: {
        name: "Légendaire",
        color: "#f39c12",
        glowColor: "rgba(243,156,18,0.7)"
    }
};

const ITEM_POOLS = {
    common: [
        { type: 'character', key: 'warrior' },
        { type: 'character', key: 'assassin' },
        { type: 'character', key: 'mage' }
    ],
    rare: [
        { type: 'character', key: 'tank' },
        { type: 'character', key: 'ninja' },
        { type: 'skin', key: 'warrior_red' },
        { type: 'skin', key: 'warrior_blue' },
        { type: 'skin', key: 'mage_emerald' },
        { type: 'skin', key: 'mage_purple' }
    ],
    epic: [
        { type: 'character', key: 'necromancer' },
        { type: 'character', key: 'paladin' },
        { type: 'skin', key: 'assassin_shadow' },
        { type: 'skin', key: 'assassin_gold' }
    ],
    legendary: []
};

function rollRarity(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (const [rarity, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) {
            return rarity;
        }
    }
    
    return 'common';
}

function rollItem(rarity) {
    const pool = ITEM_POOLS[rarity];
    
    if (!pool || pool.length === 0) {
        return null;
    }
    
    const itemData = pool[Math.floor(Math.random() * pool.length)];
    
    if (itemData.type === 'character') {
        const char = CHARACTERS[itemData.key];
        return {
            type: 'character',
            key: itemData.key,
            name: char.name,
            emoji: char.emoji
        };
    } else {
        const skin = SKINS[itemData.key];
        return {
            type: 'skin',
            key: itemData.key,
            name: skin.name,
            emoji: skin.emoji
        };
    }
}

function rollChestReward(chestType) {
    const chest = CHEST_TYPES[chestType];
    if (!chest) return null;
    
    const rarity = rollRarity(chest.rarityWeights);
    const item = rollItem(rarity);
    const gold = Math.floor(Math.random() * (chest.maxGold - chest.minGold + 1)) + chest.minGold;
    
    return {
        rarity,
        item,
        gold
    };
}

function playerOwnsItem(playerData, item) {
    if (!item) return false;
    
    if (item.type === 'character') {
        const ownedChars = playerData.ownedCharacters || [];
        return ownedChars.includes(item.key);
    } else {
        const ownedSkins = playerData.ownedSkins || [];
        return ownedSkins.includes(item.key);
    }
}

console.log('✅ REWARDS SYSTEM chargé (VERSION NERFÉE)');