// ==========================================
// WARSLIGUE — SYSTÈME DE COFFRES & RÉCOMPENSES
// ==========================================

const CHEST_TYPES = {
    basic: {
        name: "Coffre Basique",
        emoji: "📦",
        price: 100,
        color: '#95a5a6',
        glowColor: 'rgba(149, 165, 166, 0.6)',
        rewards: {
            gold: { min: 20, max: 50 },
            powerPoints: { min: 5, max: 15 },
            characterChance: 0.01 // 1% chance
        }
    },
    rare: {
        name: "Coffre Rare",
        emoji: "🎁",
        price: 250,
        color: '#3498db',
        glowColor: 'rgba(52, 152, 219, 0.6)',
        rewards: {
            gold: { min: 50, max: 120 },
            powerPoints: { min: 15, max: 35 },
            characterChance: 0.02 // 2% chance
        }
    },
    epic: {
        name: "Coffre Épique",
        emoji: "💎",
        price: 500,
        color: '#9b59b6',
        glowColor: 'rgba(155, 89, 182, 0.6)',
        rewards: {
            gold: { min: 100, max: 250 },
            powerPoints: { min: 30, max: 70 },
            characterChance: 0.5 // 5% chance
        }
    },
    legendary: {
        name: "Coffre Légendaire",
        emoji: "👑",
        price: 1000,
        color: '#f1c40f',
        glowColor: 'rgba(241, 196, 15, 0.6)',
        rewards: {
            gold: { min: 200, max: 500 },
            powerPoints: { min: 60, max: 150 },
            characterChance: 0.15 // 15% chance
        }
    }
};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getAvailableCharactersForUnlock(ownedChars) {
    const allChars = Object.keys(CHARACTERS);
    return allChars.filter(key => {
        const char = CHARACTERS[key];
        return !ownedChars.includes(key) && char.locked && char.price > 0;
    });
}

function generateChestReward(chestType, playerData) {
    const chest = CHEST_TYPES[chestType];
    const reward = {
        gold: getRandomInt(chest.rewards.gold.min, chest.rewards.gold.max),
        powerPoints: getRandomInt(chest.rewards.powerPoints.min, chest.rewards.powerPoints.max),
        character: null,
        isNew: false
    };

    // Chance de débloquer un personnage
    const ownedChars = playerData.ownedCharacters || ['warrior', 'assassin', 'mage'];
    const availableChars = getAvailableCharactersForUnlock(ownedChars);
    
    if (availableChars.length > 0 && Math.random() < chest.rewards.characterChance) {
        const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
        reward.character = randomChar;
        reward.isNew = true;
    }

    return reward;
}

console.log('✅ Chest & Rewards system loaded');