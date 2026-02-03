// ==========================================
// WARSLIGUE - SYSTÈME DE PERSONNAGES
// Fichier d'exemples pour futures implémentations
// ==========================================

/**
 * Ce fichier contient des idées de personnages et mécaniques
 * pour étendre le jeu. À implémenter progressivement.
 */

// ==========================================
// CLASSES DE PERSONNAGES
// ==========================================

const CHARACTERS = {
    // TANK - Résistant mais lent
    titan: {
        name: "Titan",
        emoji: "🛡️",
        type: "tank",
        stats: {
            hp: 150,
            speed: 3,
            attackDamage: 8,
            attackRange: 80,
            specialDamage: 15,
            specialRange: 120,
            attackCooldown: 1500, // ms
            specialCooldown: 8000 // ms
        },
        colors: {
            primary: "#4A90E2",
            glow: "rgba(74, 144, 226, 0.6)"
        },
        description: "Résistant et puissant, mais lent. Parfait pour encaisser les dégâts."
    },

    // ASSASSIN - Rapide mais fragile
    shadow: {
        name: "Shadow",
        emoji: "⚡",
        type: "assassin",
        stats: {
            hp: 80,
            speed: 8,
            attackDamage: 12,
            attackRange: 60,
            specialDamage: 25,
            specialRange: 100,
            attackCooldown: 800,
            specialCooldown: 6000
        },
        colors: {
            primary: "#9B59B6",
            glow: "rgba(155, 89, 182, 0.6)"
        },
        description: "Extrêmement rapide et dévastateur, mais très fragile."
    },

    // SUPPORT - Guérison et buffs
    healer: {
        name: "Healer",
        emoji: "💚",
        type: "support",
        stats: {
            hp: 100,
            speed: 5,
            attackDamage: 6,
            attackRange: 100,
            healAmount: 20,
            healRange: 150,
            attackCooldown: 1200,
            specialCooldown: 10000
        },
        colors: {
            primary: "#2ECC71",
            glow: "rgba(46, 204, 113, 0.6)"
        },
        description: "Peut se soigner ou soigner un allié. Dégâts faibles mais très utile en équipe.",
        special: "heal" // Type spécial : guérison au lieu d'attaque
    },

    // SNIPER - Longue portée
    sniper: {
        name: "Sniper",
        emoji: "🎯",
        type: "ranged",
        stats: {
            hp: 90,
            speed: 5,
            attackDamage: 15,
            attackRange: 200,
            specialDamage: 30,
            specialRange: 300,
            attackCooldown: 2000,
            specialCooldown: 12000
        },
        colors: {
            primary: "#E74C3C",
            glow: "rgba(231, 76, 60, 0.6)"
        },
        description: "Attaque à très longue distance mais vulnérable au corps à corps."
    },

    // MAGE - Dégâts en zone
    mage: {
        name: "Mage",
        emoji: "🔮",
        type: "mage",
        stats: {
            hp: 85,
            speed: 4.5,
            attackDamage: 10,
            attackRange: 150,
            specialDamage: 20,
            specialRange: 200,
            splashRadius: 80, // Rayon de l'explosion
            attackCooldown: 1500,
            specialCooldown: 8000
        },
        colors: {
            primary: "#F39C12",
            glow: "rgba(243, 156, 18, 0.6)"
        },
        description: "Dégâts en zone. Peut toucher plusieurs ennemis à la fois.",
        special: "aoe" // Area of Effect
    }
};

// ==========================================
// SYSTÈME DE PROGRESSION
// ==========================================

const PROGRESSION = {
    levels: [
        { level: 1, xpRequired: 0, reward: "Débloquer personnage: Shadow" },
        { level: 2, xpRequired: 100, reward: "+50 coins" },
        { level: 3, xpRequired: 250, reward: "Débloquer personnage: Healer" },
        { level: 4, xpRequired: 500, reward: "+100 coins" },
        { level: 5, xpRequired: 1000, reward: "Débloquer personnage: Sniper" },
        { level: 6, xpRequired: 1500, reward: "Débloquer mode 2v2" },
        { level: 7, xpRequired: 2000, reward: "+150 coins" },
        { level: 8, xpRequired: 2500, reward: "Débloquer personnage: Mage" },
        { level: 9, xpRequired: 3000, reward: "Débloquer Battle Royale" },
        { level: 10, xpRequired: 4000, reward: "Skin légendaire gratuit" }
    ],
    
    xpPerWin: 50,
    xpPerLoss: 20,
    xpPerKill: 10
};

// ==========================================
// POWER-UPS (objets à collecter)
// ==========================================

const POWERUPS = {
    health: {
        name: "Soin",
        emoji: "❤️",
        effect: "heal",
        value: 30,
        duration: 0, // Instantané
        spawnChance: 0.3,
        color: "#E74C3C"
    },
    
    speed: {
        name: "Vitesse",
        emoji: "⚡",
        effect: "speedBoost",
        value: 1.5, // Multiplicateur
        duration: 5000, // 5 secondes
        spawnChance: 0.2,
        color: "#F1C40F"
    },
    
    shield: {
        name: "Bouclier",
        emoji: "🛡️",
        effect: "shield",
        value: 50, // HP de bouclier
        duration: 10000, // 10 secondes
        spawnChance: 0.2,
        color: "#3498DB"
    },
    
    damage: {
        name: "Rage",
        emoji: "💥",
        effect: "damageBoost",
        value: 2, // Multiplicateur
        duration: 5000,
        spawnChance: 0.15,
        color: "#E67E22"
    },
    
    invincible: {
        name: "Invincibilité",
        emoji: "✨",
        effect: "invincible",
        value: 1,
        duration: 3000, // 3 secondes
        spawnChance: 0.05, // Rare
        color: "#9B59B6"
    }
};

// ==========================================
// MODES DE JEU
// ==========================================

const GAME_MODES = {
    duel: {
        name: "Duel 1v1",
        players: 2,
        duration: 180,
        description: "Combat classique en 1 contre 1",
        trophyWin: 8,
        trophyLoss: -5,
        mapSize: { width: 800, height: 600 }
    },
    
    duo: {
        name: "Duo 2v2",
        players: 4,
        duration: 240,
        description: "Combattez en équipe de 2",
        trophyWin: 10,
        trophyLoss: -3,
        mapSize: { width: 1200, height: 800 }
    },
    
    brawl: {
        name: "Brawl 3v3",
        players: 6,
        duration: 300,
        description: "Équipe de 3 joueurs",
        trophyWin: 12,
        trophyLoss: -2,
        mapSize: { width: 1400, height: 1000 }
    },
    
    battleRoyale: {
        name: "Battle Royale",
        players: 10,
        duration: 420, // 7 minutes
        description: "10 joueurs, un seul survivant",
        trophyWin: 20,
        trophyLoss: 0,
        mapSize: { width: 2000, height: 2000 },
        shrinkingZone: true // La zone se rétrécit avec le temps
    }
};

// ==========================================
// SYSTÈME DE CARTES (MAPS)
// ==========================================

const MAPS = {
    desert: {
        name: "Désert Brûlant",
        theme: "desert",
        obstacles: [
            { type: "rock", x: 200, y: 150, width: 60, height: 60 },
            { type: "rock", x: 600, y: 450, width: 80, height: 80 },
            { type: "cactus", x: 400, y: 300, width: 40, height: 60 }
        ],
        powerupSpawns: [
            { x: 400, y: 100 },
            { x: 400, y: 500 }
        ],
        backgroundColor: "#F4A460",
        gridColor: "rgba(139, 69, 19, 0.1)"
    },
    
    forest: {
        name: "Forêt Enchantée",
        theme: "forest",
        obstacles: [
            { type: "tree", x: 150, y: 200, width: 50, height: 80 },
            { type: "tree", x: 650, y: 400, width: 50, height: 80 },
            { type: "bush", x: 400, y: 300, width: 60, height: 40 }
        ],
        powerupSpawns: [
            { x: 250, y: 300 },
            { x: 550, y: 300 }
        ],
        backgroundColor: "#228B22",
        gridColor: "rgba(34, 139, 34, 0.1)"
    },
    
    snow: {
        name: "Toundra Glacée",
        theme: "snow",
        obstacles: [
            { type: "ice", x: 300, y: 200, width: 100, height: 40 },
            { type: "snowman", x: 500, y: 400, width: 50, height: 70 }
        ],
        powerupSpawns: [
            { x: 400, y: 150 },
            { x: 400, y: 450 }
        ],
        backgroundColor: "#E0F2F7",
        gridColor: "rgba(176, 224, 230, 0.2)",
        slippery: true // Les joueurs glissent plus
    },
    
    lava: {
        name: "Volcan Infernal",
        theme: "lava",
        obstacles: [
            { type: "lavaRock", x: 200, y: 250, width: 80, height: 60 },
            { type: "lavaRock", x: 600, y: 350, width: 80, height: 60 }
        ],
        hazards: [
            { type: "lava", x: 100, y: 100, width: 600, height: 50, damage: 5 }
        ],
        powerupSpawns: [
            { x: 400, y: 300 }
        ],
        backgroundColor: "#8B0000",
        gridColor: "rgba(255, 69, 0, 0.1)"
    }
};

// ==========================================
// SYSTÈME DE SKINS
// ==========================================

const SKINS = {
    // Titan skins
    titan_gold: {
        character: "titan",
        name: "Titan Doré",
        rarity: "legendary",
        price: 500, // coins
        colors: { primary: "#FFD700", glow: "rgba(255, 215, 0, 0.8)" }
    },
    
    titan_dark: {
        character: "titan",
        name: "Titan des Ombres",
        rarity: "epic",
        price: 250,
        colors: { primary: "#2C3E50", glow: "rgba(44, 62, 80, 0.8)" }
    },
    
    // Shadow skins
    shadow_fire: {
        character: "shadow",
        name: "Shadow Enflammé",
        rarity: "legendary",
        price: 500,
        colors: { primary: "#E74C3C", glow: "rgba(231, 76, 60, 0.8)" }
    },
    
    shadow_ice: {
        character: "shadow",
        name: "Shadow Glacé",
        rarity: "rare",
        price: 150,
        colors: { primary: "#3498DB", glow: "rgba(52, 152, 219, 0.8)" }
    }
};

// ==========================================
// EXEMPLE D'IMPLÉMENTATION
// ==========================================

/**
 * Comment utiliser ce système dans le jeu :
 * 
 * 1. Sélection de personnage avant le match :
 *    - L'utilisateur choisit son personnage
 *    - Enregistrer dans playerData.selectedCharacter
 * 
 * 2. Charger le personnage dans le match :
 *    player = {
 *        ...CHARACTERS[playerData.selectedCharacter].stats,
 *        x: 100, y: 300,
 *        ...CHARACTERS[playerData.selectedCharacter].colors
 *    };
 * 
 * 3. Power-ups :
 *    - Spawn aléatoire toutes les 30 secondes
 *    - Collision detection
 *    - Appliquer l'effet
 * 
 * 4. Progression :
 *    - Calculer XP après chaque match
 *    - Vérifier levelUp
 *    - Débloquer récompenses
 */

// ==========================================
// DONNÉES À AJOUTER DANS FIRESTORE
// ==========================================

/**
 * Collection: /players/{userId}
 * 
 * Ajouter ces champs :
 * {
 *   // Existant
 *   username: string,
 *   trophies: number,
 *   wins: number,
 *   losses: number,
 *   
 *   // Nouveau
 *   level: number,
 *   xp: number,
 *   coins: number,
 *   unlockedCharacters: ['titan', 'shadow', ...],
 *   unlockedSkins: ['titan_gold', ...],
 *   selectedCharacter: 'titan',
 *   selectedSkin: 'titan_gold',
 *   stats: {
 *     totalKills: number,
 *     totalDeaths: number,
 *     damageDealt: number,
 *     damageTaken: number,
 *     powerupsCollected: number
 *   }
 * }
 */

// ==========================================
// FONCTIONS UTILES FUTURES
// ==========================================

/**
 * Calculer le niveau depuis l'XP
 */
function getLevelFromXP(xp) {
    for (let i = PROGRESSION.levels.length - 1; i >= 0; i--) {
        if (xp >= PROGRESSION.levels[i].xpRequired) {
            return PROGRESSION.levels[i].level;
        }
    }
    return 1;
}

/**
 * Spawn un power-up aléatoire
 */
function spawnRandomPowerup(map) {
    const powerupTypes = Object.keys(POWERUPS);
    const randomType = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
    const powerup = POWERUPS[randomType];
    
    // Spawn position aléatoire ou prédéfinie
    const spawnPoint = map.powerupSpawns[Math.floor(Math.random() * map.powerupSpawns.length)];
    
    return {
        type: randomType,
        ...powerup,
        x: spawnPoint.x,
        y: spawnPoint.y,
        radius: 20
    };
}

/**
 * Appliquer un effet de power-up
 */
function applyPowerupEffect(player, powerup) {
    switch (powerup.effect) {
        case 'heal':
            player.hp = Math.min(player.maxHP, player.hp + powerup.value);
            break;
        case 'speedBoost':
            player.speedMultiplier = powerup.value;
            setTimeout(() => player.speedMultiplier = 1, powerup.duration);
            break;
        case 'shield':
            player.shield = powerup.value;
            setTimeout(() => player.shield = 0, powerup.duration);
            break;
        case 'damageBoost':
            player.damageMultiplier = powerup.value;
            setTimeout(() => player.damageMultiplier = 1, powerup.duration);
            break;
        case 'invincible':
            player.invincible = true;
            setTimeout(() => player.invincible = false, powerup.duration);
            break;
    }
}

/**
 * Calculer les récompenses de fin de match
 */
function calculateMatchRewards(victory, kills, damageDealt) {
    const xp = PROGRESSION.xpPerWin * (victory ? 1 : 0.4) + 
               PROGRESSION.xpPerKill * kills;
    const coins = 10 * (victory ? 1.5 : 1) + kills * 2;
    
    return { xp, coins };
}

// Export pour utilisation future
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CHARACTERS,
        PROGRESSION,
        POWERUPS,
        GAME_MODES,
        MAPS,
        SKINS,
        getLevelFromXP,
        spawnRandomPowerup,
        applyPowerupEffect,
        calculateMatchRewards
    };
}