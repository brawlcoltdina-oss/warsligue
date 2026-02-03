// ==========================================
// WARSLIGUE — CHARACTERS DATA
// Chargé avant java.js
// ==========================================

const CHARACTERS = {
    warrior: {
        name: "Warrior",
        emoji: "⚔️",
        hp: 100,
        speed: 5,
        attackDamage: 10,
        attackRange: 90,
        specialDamage: 22,
        specialRange: 140,
        attackCooldown: 900,    // ms
        specialCooldown: 4500,  // ms
        color: '#FF3366',
        glowColor: 'rgba(255,51,102,0.6)',
        radius: 24
    },
    assassin: {
        name: "Assassin",
        emoji: "🗡️",
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
        radius: 20
    },
    mage: {
        name: "Mage",
        emoji: "🔮",
        hp: 80,
        speed: 4,
        attackDamage: 12,
        attackRange: 130,       // portée plus longue
        specialDamage: 26,
        specialRange: 180,
        attackCooldown: 1100,
        specialCooldown: 5200,
        color: '#F39C12',
        glowColor: 'rgba(243,156,18,0.6)',
        radius: 22
    }
};