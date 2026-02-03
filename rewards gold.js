// ==========================================
// WARSLIGUE — SYSTÈME DE COFFRES & RÉCOMPENSES 💰
// ==========================================

// ✅ TYPES DE COFFRES
const CHEST_TYPES = {
    basic: {
        name: "Coffre Basique",
        emoji: "📦",
        cost: 0, // GRATUIT (cooldown 4h)
        minGold: 50,
        maxGold: 150,
        rarityWeights: {
            common: 80,
            rare: 15,
            epic: 4,
            legendary: 1
        }
    },
    silver: {
        name: "Coffre Argent",
        emoji: "🎁",
        cost: 100, // 100 OR
        minGold: 100,
        maxGold: 250,
        rarityWeights: {
            common: 60,
            rare: 30,
            epic: 8,
            legendary: 2
        }
    },
    gold: {
        name: "Coffre Or",
        emoji: "💎",
        cost: 250, // 250 OR
        minGold: 200,
        maxGold: 400,
        rarityWeights: {
            common: 40,
            rare: 40,
            epic: 15,
            legendary: 5
        }
    },
    mega: {
        name: "Méga Coffre",
        emoji: "🏆",
        cost: 500, // 500 OR
        minGold: 350,
        maxGold: 600,
        rarityWeights: {
            common: 20,
            rare: 45,
            epic: 25,
            legendary: 10
        }
    }
};

// ✅ RARETÉS
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

// ✅ POOL D'ITEMS PAR RARETÉ
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
    legendary: [
        // Futurs contenus légendaires
    ]
};

// ✅ TIRAGE DE RARETÉ
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

// ✅ TIRAGE D'ITEM
function rollItem(rarity) {
    const pool = ITEM_POOLS[rarity];
    
    if (!pool || pool.length === 0) {
        return null; // Pas d'item de cette rareté
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

// ✅ TIRAGE COMPLET D'UN COFFRE
function rollChestReward(chestType) {
    const chest = CHEST_TYPES[chestType];
    if (!chest) return null;
    
    // 1. Tirer la rareté
    const rarity = rollRarity(chest.rarityWeights);
    
    // 2. Tirer un item de cette rareté
    const item = rollItem(rarity);
    
    // 3. Tirer l'or
    const gold = Math.floor(Math.random() * (chest.maxGold - chest.minGold + 1)) + chest.minGold;
    
    return {
        rarity,
        item,
        gold
    };
}

// ✅ VÉRIFIER SI LE JOUEUR POSSÈDE L'ITEM
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

console.log('✅ REWARDS SYSTEM chargé');