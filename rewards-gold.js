// ==========================================
// WARSLIGUE — REWARDS & CHESTS SYSTEM
// ==========================================

const CHEST_TYPES = {
    common: {
        name: "Coffre Commun",
        emoji: "📦",
        price: 100,
        color: "#95a5a6",
        glowColor: "rgba(149, 165, 166, 0.6)",
        rewards: {
            gold: { min: 50, max: 150 },
            powerPoints: { min: 5, max: 15 },
            characterChance: 0.05  // 5%
        }
    },
    rare: {
        name: "Coffre Rare",
        emoji: "💎",
        price: 250,
        color: "#3498db",
        glowColor: "rgba(52, 152, 219, 0.6)",
        rewards: {
            gold: { min: 150, max: 350 },
            powerPoints: { min: 15, max: 35 },
            characterChance: 0.15  // 15%
        }
    },
    epic: {
        name: "Coffre Épique",
        emoji: "🎁",
        price: 500,
        color: "#9b59b6",
        glowColor: "rgba(155, 89, 182, 0.6)",
        rewards: {
            gold: { min: 350, max: 750 },
            powerPoints: { min: 35, max: 75 },
            characterChance: 0.30  // 30%
        }
    },
    legendary: {
        name: "Coffre Légendaire",
        emoji: "👑",
        price: 1000,
        color: "#f1c40f",
        glowColor: "rgba(241, 196, 15, 0.6)",
        rewards: {
            gold: { min: 750, max: 1500 },
            powerPoints: { min: 75, max: 150 },
            characterChance: 0.60  // 60%
        }
    },
    mega: {
        name: "Méga Coffre",
        emoji: "🏆",
        price: 2000,
        color: "#e74c3c",
        glowColor: "rgba(231, 76, 60, 0.6)",
        rewards: {
            gold: { min: 1500, max: 3000 },
            powerPoints: { min: 150, max: 300 },
            characterChance: 0.90  // 90%
        }
    }
};

function generateChestReward(chestType, playerData) {
    const chest = CHEST_TYPES[chestType];
    if (!chest) return null;

    const reward = {
        gold: randomInt(chest.rewards.gold.min, chest.rewards.gold.max),
        powerPoints: randomInt(chest.rewards.powerPoints.min, chest.rewards.powerPoints.max),
        character: null,
        isNew: false
    };

    // Chance de gagner un personnage
    if (Math.random() < chest.rewards.characterChance) {
        const ownedChars = playerData?.ownedCharacters || ['warrior', 'assassin', 'mage'];
        const lockedChars = Object.keys(CHARACTERS).filter(key => {
            const char = CHARACTERS[key];
            return char.locked && !ownedChars.includes(key);
        });

        if (lockedChars.length > 0) {
            // Choisir un personnage aléatoire parmi les verrouillés
            const randomChar = lockedChars[Math.floor(Math.random() * lockedChars.length)];
            reward.character = randomChar;
            reward.isNew = true;
        }
    }

    return reward;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log('✅ REWARDS SYSTEM chargé');