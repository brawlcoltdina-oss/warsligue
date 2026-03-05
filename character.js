// ==========================================
// WARSLIGUE — CHARACTERS & SHOP DATA (AVEC IMAGES SVG)
// ==========================================

const CHARACTERS = {
    warrior: {
        name: "Warrior",
        emoji: "⚔️",
        image: "Group 1 (1).svg",
        hp: 100,
        speed: 5,
        attackDamage: 10,
        attackRange: 90,
        specialDamage: 22,
        specialRange: 140,
        attackCooldown: 900,
        specialCooldown: 4500,
        color: '#FF3366',
        glowColor: 'rgba(255,51,102,0.6)',
        radius: 24,
        locked: false,
        price: 0,
        rarity: 'common',
        upgrades: {
            hp: [
                { level: 1, cost: 50, increment: 15 },
                { level: 2, cost: 100, increment: 20 },
                { level: 3, cost: 150, increment: 25 }
            ],
            speed: [
                { level: 1, cost: 50, increment: 1 },
                { level: 2, cost: 100, increment: 1.5 },
                { level: 3, cost: 150, increment: 2 }
            ],
            attackDamage: [
                { level: 1, cost: 50, increment: 2 },
                { level: 2, cost: 100, increment: 3 },
                { level: 3, cost: 150, increment: 4 }
            ]
        }
    },
    assassin: {
        name: "Assassin",
        emoji: "🗡️",
        image: "Group 2.svg",
        hp: 75,
        speed: 8,
        attackDamage: 14,
        attackRange: 70,
        specialDamage: 28,
        specialRange: 110,
        attackCooldown: 650,
        specialCooldown: 3800,
        color: '#9B59B6',
        glowColor: 'rgba(155,89,182,0.6)',
        radius: 20,
        locked: false,
        price: 0,
        rarity: 'common',
        upgrades: {
            hp: [
                { level: 1, cost: 50, increment: 12 },
                { level: 2, cost: 100, increment: 15 },
                { level: 3, cost: 150, increment: 18 }
            ],
            speed: [
                { level: 1, cost: 50, increment: 1.5 },
                { level: 2, cost: 100, increment: 2 },
                { level: 3, cost: 150, increment: 2.5 }
            ],
            attackDamage: [
                { level: 1, cost: 50, increment: 2.5 },
                { level: 2, cost: 100, increment: 3.5 },
                { level: 3, cost: 150, increment: 4.5 }
            ]
        }
    },
    mage: {
        name: "Mage",
        emoji: "🔮",
        image: "Group 9.svg",
        hp: 80,
        speed: 4,
        attackDamage: 12,
        attackRange: 130,
        specialDamage: 26,
        specialRange: 180,
        attackCooldown: 1100,
        specialCooldown: 5200,
        color: '#F39C12',
        glowColor: 'rgba(243,156,18,0.6)',
        radius: 22,
        locked: false,
        price: 0,
        rarity: 'common',
        upgrades: {
            hp: [
                { level: 1, cost: 50, increment: 12 },
                { level: 2, cost: 100, increment: 16 },
                { level: 3, cost: 150, increment: 20 }
            ],
            speed: [
                { level: 1, cost: 50, increment: 0.8 },
                { level: 2, cost: 100, increment: 1 },
                { level: 3, cost: 150, increment: 1.2 }
            ],
            attackDamage: [
                { level: 1, cost: 50, increment: 2.2 },
                { level: 2, cost: 100, increment: 3 },
                { level: 3, cost: 150, increment: 4 }
            ]
        }
    },
    tank: {
        name: "Tank",
        emoji: "🛡️",
        image: "Group 5.svg",
        hp: 170,
        speed: 3,
        attackDamage: 8,
        attackRange: 70,
        specialDamage: 18,
        specialRange: 100,
        attackCooldown: 1200,
        specialCooldown: 6000,
        color: '#3498DB',
        glowColor: 'rgba(52,152,219,0.6)',
        radius: 28,
        locked: true,
        price: 500,
        description: "Résistant mais lent",
        rarity: 'rare',
        upgrades: {
            hp: [
                { level: 1, cost: 60, increment: 25 },
                { level: 2, cost: 120, increment: 30 },
                { level: 3, cost: 180, increment: 35 }
            ],
            speed: [
                { level: 1, cost: 60, increment: 0.5 },
                { level: 2, cost: 120, increment: 0.7 },
                { level: 3, cost: 180, increment: 1 }
            ],
            attackDamage: [
                { level: 1, cost: 60, increment: 1.5 },
                { level: 2, cost: 120, increment: 2 },
                { level: 3, cost: 180, increment: 2.5 }
            ]
        }
    },
    ninja: {
        name: "Ninja",
        emoji: "🥷",
        image: "Group 4.svg",
        hp: 65,
        speed: 10,
        attackDamage: 16,
        attackRange: 60,
        specialDamage: 32,
        specialRange: 90,
        attackCooldown: 500,
        specialCooldown: 3200,
        color: '#107c41',
        glowColor: 'rgba(12, 143, 110, 0.6)',
        radius: 18,
        locked: true,
        price: 750,
        description: "Ultra rapide et mortel",
        rarity: 'rare',
        upgrades: {
            hp: [
                { level: 1, cost: 60, increment: 10 },
                { level: 2, cost: 120, increment: 12 },
                { level: 3, cost: 180, increment: 15 }
            ],
            speed: [
                { level: 1, cost: 60, increment: 2 },
                { level: 2, cost: 120, increment: 2.5 },
                { level: 3, cost: 180, increment: 3 }
            ],
            attackDamage: [
                { level: 1, cost: 60, increment: 3 },
                { level: 2, cost: 120, increment: 4 },
                { level: 3, cost: 180, increment: 5 }
            ]
        }
    },
    necromancer: {
        name: "Necromancer",
        emoji: "💀",
        image: "Group 7.svg",
        hp: 70,
        speed: 4,
        attackDamage: 15,
        attackRange: 150,
        specialDamage: 30,
        specialRange: 200,
        attackCooldown: 1300,
        specialCooldown: 5500,
        color: '#8E44AD',
        glowColor: 'rgba(142,68,173,0.6)',
        radius: 23,
        locked: true,
        price: 1000,
        description: "Maître de la magie noire",
        rarity: 'epic',
        upgrades: {
            hp: [
                { level: 1, cost: 70, increment: 12 },
                { level: 2, cost: 140, increment: 16 },
                { level: 3, cost: 210, increment: 20 }
            ],
            speed: [
                { level: 1, cost: 70, increment: 0.8 },
                { level: 2, cost: 140, increment: 1.2 },
                { level: 3, cost: 210, increment: 1.5 }
            ],
            attackDamage: [
                { level: 1, cost: 70, increment: 2.5 },
                { level: 2, cost: 140, increment: 3.5 },
                { level: 3, cost: 210, increment: 4.5 }
            ]
        }
    },
    paladin: {
        name: "Paladin",
        emoji: "⚜️",
        image: "Group 8.svg",
        hp: 120,
        speed: 5,
        attackDamage: 12,
        attackRange: 85,
        specialDamage: 24,
        specialRange: 130,
        attackCooldown: 950,
        specialCooldown: 4800,
        color: '#F1C40F',
        glowColor: 'rgba(241,196,15,0.6)',
        radius: 25,
        locked: true,
        price: 1200,
        description: "Équilibré et puissant",
        rarity: 'epic',
        upgrades: {
            hp: [
                { level: 1, cost: 70, increment: 18 },
                { level: 2, cost: 140, increment: 22 },
                { level: 3, cost: 210, increment: 26 }
            ],
            speed: [
                { level: 1, cost: 70, increment: 1 },
                { level: 2, cost: 140, increment: 1.3 },
                { level: 3, cost: 210, increment: 1.6 }
            ],
            attackDamage: [
                { level: 1, cost: 70, increment: 2 },
                { level: 2, cost: 140, increment: 3 },
                { level: 3, cost: 210, increment: 4 }
            ]
        }
    },
    dragon: {
        name: "Dragon Knight",
        emoji: "🐉",
        image: "Group 10.svg",
        hp: 140,
        speed: 6,
        attackDamage: 18,
        attackRange: 110,
        specialDamage: 40,
        specialRange: 160,
        attackCooldown: 1000,
        specialCooldown: 4000,
        color: '#E74C3C',
        glowColor: 'rgba(231,76,60,0.6)',
        radius: 26,
        locked: true,
        price: 1500,
        description: "Puissance draconique",
        rarity: 'legendary',
        upgrades: {
            hp: [
                { level: 1, cost: 80, increment: 20 },
                { level: 2, cost: 160, increment: 25 },
                { level: 3, cost: 240, increment: 30 }
            ],
            speed: [
                { level: 1, cost: 80, increment: 1.2 },
                { level: 2, cost: 160, increment: 1.5 },
                { level: 3, cost: 240, increment: 1.8 }
            ],
            attackDamage: [
                { level: 1, cost: 80, increment: 3 },
                { level: 2, cost: 160, increment: 4 },
                { level: 3, cost: 240, increment: 5 }
            ]
        }
    }
};

const SKINS = {
    warrior_red: {
        name: "Warrior Crimson",
        characterBase: 'warrior',
        emoji: "⚔️",
        color: '#E74C3C',
        glowColor: 'rgba(231,76,60,0.6)',
        locked: true,
        price: 300,
        rarity: 'rare'
    },
    warrior_blue: {
        name: "Warrior Ice",
        characterBase: 'warrior',
        emoji: "⚔️",
        color: '#3498DB',
        glowColor: 'rgba(52,152,219,0.6)',
        locked: true,
        price: 300,
        rarity: 'rare'
    },
    assassin_shadow: {
        name: "Assassin Shadow",
        characterBase: 'assassin',
        emoji: "🗡️",
        color: '#2C3E50',
        glowColor: 'rgba(44,62,80,0.6)',
        locked: true,
        price: 400,
        rarity: 'epic'
    },
    assassin_gold: {
        name: "Assassin Gold",
        characterBase: 'assassin',
        emoji: "🗡️",
        color: '#F39C12',
        glowColor: 'rgba(243,156,18,0.6)',
        locked: true,
        price: 400,
        rarity: 'epic'
    },
    mage_emerald: {
        name: "Mage Emerald",
        characterBase: 'mage',
        emoji: "🔮",
        color: '#2ECC71',
        glowColor: 'rgba(46,204,113,0.6)',
        locked: true,
        price: 350,
        rarity: 'rare'
    },
    mage_purple: {
        name: "Mage Purple",
        characterBase: 'mage',
        emoji: "🔮",
        color: '#9B59B6',
        glowColor: 'rgba(155,89,182,0.6)',
        locked: true,
        price: 350,
        rarity: 'rare'
    }
};

console.log('✅ CHARACTERS & SKINS chargés');