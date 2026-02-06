// ==========================================
// WARSLIGUE — SYSTÈME DE COFFRES SIMPLIFIÉ
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
            characterChance: 0.03  // 3% de chance seulement !
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
            characterChance: 0.05  // 5% de chance
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
            characterChance: 0.088  // 8.8% de chance
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
            characterChance: 0.16  // 16% de chance
        }
    }
};

// Fonction simple pour nombre aléatoire
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Trouve les personnages disponibles à débloquer
function getAvailableCharactersForUnlock(ownedChars) {
    const allChars = Object.keys(CHARACTERS);
    return allChars.filter(key => {
        const char = CHARACTERS[key];
        // On ne peut obtenir QUE les persos verrouillés
        return !ownedChars.includes(key) && char.locked === true;
    });
}

// Génère les récompenses du coffre
function generateChestReward(chestType, playerData) {
    console.log('🎲 Génération récompense pour:', chestType);
    
    const chest = CHEST_TYPES[chestType];
    const reward = {
        gold: getRandomInt(chest.rewards.gold.min, chest.rewards.gold.max),
        powerPoints: getRandomInt(chest.rewards.powerPoints.min, chest.rewards.powerPoints.max),
        character: null,
        isNew: false
    };

    // Vérifier si on peut obtenir un personnage
    const ownedChars = playerData.ownedCharacters || ['warrior', 'assassin', 'mage'];
    const availableChars = getAvailableCharactersForUnlock(ownedChars);
    
    console.log('📊 Persos possédés:', ownedChars.length);
    console.log('📊 Persos disponibles:', availableChars.length);
    
    if (availableChars.length > 0) {
        const roll = Math.random();
        console.log('🎰 Jet de dés:', (roll * 100).toFixed(2) + '%', '/ Chance:', (chest.rewards.characterChance * 100) + '%');
        
        if (roll < chest.rewards.characterChance) {
            const randomChar = availableChars[Math.floor(Math.random() * availableChars.length)];
            reward.character = randomChar;
            reward.isNew = true;
            console.log('🎉 PERSONNAGE DÉBLOQUÉ:', randomChar);
        } else {
            console.log('💔 Pas de personnage cette fois...');
        }
    } else {
        console.log('⚠️ Tous les personnages sont déjà débloqués !');
    }

    console.log('💰 Or:', reward.gold, '| ⚡ Points:', reward.powerPoints);
    return reward;
}

console.log('✅ Système de coffres chargé !');