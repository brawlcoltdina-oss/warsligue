// ==========================================
// WARSLIGUE — SYSTÈME DE PASSE BRAWL
// ==========================================

/* =============================================
   CONFIGURATION DU PASSE BRAWL
   ============================================= */

const BATTLE_PASS_CONFIG = {
    MAX_LEVELS: 50,
    XP_PER_LEVEL: 150,
    PREMIUM_PRICE: 10000, // pièces d'or
    PREMIUM_MULTIPLIER: 1.5, // bonus XP pour premium (50% de plus)
};

// Structure des récompenses par niveau
const BATTLE_PASS_REWARDS = {
    // ── NIVEAUX GRATUITS (impairs) ──
    1:  { type: 'gold',        amount: 50,      tier: 'free',    label: '💰 50 pièces' },
    2:  { type: 'powerpoints', amount: 5,       tier: 'free',    label: '⚡ +5 PP' },
    3:  { type: 'gold',        amount: 75,      tier: 'free',    label: '💰 75 pièces' },
    4:  { type: 'powerpoints', amount: 8,       tier: 'free',    label: '⚡ +8 PP' },
    5:  { type: 'gold',        amount: 100,     tier: 'free',    label: '💰 100 pièces' },
    6:  { type: 'chest',       chest: 'basic',  tier: 'free',    label: '📦 Coffre Basique' },
    7:  { type: 'gold',        amount: 150,     tier: 'free',    label: '💰 150 pièces' },
    8:  { type: 'powerpoints', amount: 12,      tier: 'free',    label: '⚡ +12 PP' },
    9:  { type: 'gold',        amount: 200,     tier: 'free',    label: '💰 200 pièces' },
    
    // ── NIVEAU 10 — RÉCOMPENSE PREMIUM ──
    10: { type: 'chest',       chest: 'rare',   tier: 'premium', label: '🎁 Coffre Rare (Premium)' },
    
    11: { type: 'gold',        amount: 100,     tier: 'free',    label: '💰 100 pièces' },
    12: { type: 'powerpoints', amount: 10,      tier: 'free',    label: '⚡ +10 PP' },
    13: { type: 'gold',        amount: 125,     tier: 'free',    label: '💰 125 pièces' },
    14: { type: 'chest',       chest: 'basic',  tier: 'free',    label: '📦 Coffre Basique' },
    15: { type: 'gold',        amount: 150,     tier: 'free',    label: '💰 150 pièces' },
    16: { type: 'powerpoints', amount: 15,      tier: 'free',    label: '⚡ +15 PP' },
    17: { type: 'gold',        amount: 175,     tier: 'free',    label: '💰 175 pièces' },
    18: { type: 'powerpoints', amount: 12,      tier: 'free',    label: '⚡ +12 PP' },
    19: { type: 'gold',        amount: 200,     tier: 'free',    label: '💰 200 pièces' },
    
    // ── NIVEAU 20 — RÉCOMPENSE PREMIUM ──
    20: { type: 'chest',       chest: 'epic',   tier: 'premium', label: '💎 Coffre Épique (Premium)' },
    
    21: { type: 'gold',        amount: 150,     tier: 'free',    label: '💰 150 pièces' },
    22: { type: 'powerpoints', amount: 18,      tier: 'free',    label: '⚡ +18 PP' },
    23: { type: 'gold',        amount: 200,     tier: 'free',    label: '💰 200 pièces' },
    24: { type: 'chest',       chest: 'basic',  tier: 'free',    label: '📦 Coffre Basique' },
    25: { type: 'gold',        amount: 250,     tier: 'free',    label: '💰 250 pièces' },
    26: { type: 'powerpoints', amount: 20,      tier: 'free',    label: '⚡ +20 PP' },
    27: { type: 'gold',        amount: 275,     tier: 'free',    label: '💰 275 pièces' },
    28: { type: 'powerpoints', amount: 15,      tier: 'free',    label: '⚡ +15 PP' },
    29: { type: 'gold',        amount: 300,     tier: 'free',    label: '💰 300 pièces' },
    
    // ── NIVEAU 30 — RÉCOMPENSE PREMIUM ──
    30: { type: 'chest',       chest: 'epic',   tier: 'premium', label: '💎 Coffre Épique (Premium)' },
    
    31: { type: 'gold',        amount: 200,     tier: 'free',    label: '💰 200 pièces' },
    32: { type: 'powerpoints', amount: 25,      tier: 'free',    label: '⚡ +25 PP' },
    33: { type: 'gold',        amount: 250,     tier: 'free',    label: '💰 250 pièces' },
    34: { type: 'chest',       chest: 'rare',   tier: 'free',    label: '🎁 Coffre Rare' },
    35: { type: 'gold',        amount: 300,     tier: 'free',    label: '💰 300 pièces' },
    36: { type: 'powerpoints', amount: 30,      tier: 'free',    label: '⚡ +30 PP' },
    37: { type: 'gold',        amount: 350,     tier: 'free',    label: '💰 350 pièces' },
    38: { type: 'powerpoints', amount: 20,      tier: 'free',    label: '⚡ +20 PP' },
    39: { type: 'gold',        amount: 400,     tier: 'free',    label: '💰 400 pièces' },
    
    // ── NIVEAU 40 — RÉCOMPENSE PREMIUM ──
    40: { type: 'chest',       chest: 'legendary', tier: 'premium', label: '👑 Coffre Légendaire (Premium)' },
    
    41: { type: 'gold',        amount: 300,     tier: 'free',    label: '💰 300 pièces' },
    42: { type: 'powerpoints', amount: 35,      tier: 'free',    label: '⚡ +35 PP' },
    43: { type: 'gold',        amount: 350,     tier: 'free',    label: '💰 350 pièces' },
    44: { type: 'chest',       chest: 'epic',   tier: 'free',    label: '💎 Coffre Épique' },
    45: { type: 'gold',        amount: 400,     tier: 'free',    label: '💰 400 pièces' },
    46: { type: 'powerpoints', amount: 40,      tier: 'free',    label: '⚡ +40 PP' },
    47: { type: 'gold',        amount: 450,     tier: 'free',    label: '💰 450 pièces' },
    48: { type: 'powerpoints', amount: 30,      tier: 'free',    label: '⚡ +30 PP' },
    49: { type: 'gold',        amount: 500,     tier: 'free',    label: '💰 500 pièces' },
    
    // ── NIVEAU 50 — RÉCOMPENSE PREMIUM FINALE ──
    50: { type: 'chest',       chest: 'legendary', tier: 'premium', label: '👑 Coffre Légendaire (Premium)' },
};

/* =============================================
   QUÊTES DU PASSE BRAWL
   ============================================= */
const BATTLE_PASS_QUESTS = [
    { id: 'quest_1',  name: 'Première victoire',      desc: 'Remporte 1 combat',           xp: 50,  target: 1,  type: 'win',    reward: '50 XP' },
    { id: 'quest_2',  name: 'Guerrier',               desc: 'Remporte 5 combats',          xp: 150, target: 5,  type: 'win',    reward: '150 XP' },
    { id: 'quest_3',  name: 'Champion',               desc: 'Remporte 10 combats',         xp: 250, target: 10, type: 'win',    reward: '250 XP' },
    { id: 'quest_4',  name: 'Collecteur',             desc: 'Collecte 1000 pièces',        xp: 100, target: 1000, type: 'gold', reward: '100 XP' },
    { id: 'quest_5',  name: 'Puissant',               desc: 'Gagne 100 points de pouvoir', xp: 150, target: 100, type: 'power', reward: '150 XP' },
    { id: 'quest_6',  name: 'Ouvreur de coffres',     desc: 'Ouvre 3 coffres',             xp: 200, target: 3,  type: 'chest', reward: '200 XP' },
    { id: 'quest_7',  name: 'Légende',                desc: 'Atteins le niveau 50',        xp: 500, target: 50, type: 'level', reward: '500 XP' },
];

/* =============================================
   LOGIQUE PRINCIPALE DU PASSE
   ============================================= */

async function addBattlePassXP(amount, source = 'combat') {
    if (!G.user || !G.playerData) return false;

    try {
        let xpToAdd = amount;
        
        // Si premium, bonus XP 50%
        if (G.playerData.battlePassPremium) {
            xpToAdd = Math.floor(amount * BATTLE_PASS_CONFIG.PREMIUM_MULTIPLIER);
        }

        const currentXP = G.playerData.battlePassXP || 0;
        const currentLevel = G.playerData.battlePassLevel || 1;
        const xpPerLevel = BATTLE_PASS_CONFIG.XP_PER_LEVEL;
        
        let newXP = currentXP + xpToAdd;
        let newLevel = currentLevel;

        // Boucle pour les level-ups
        while (newXP >= xpPerLevel && newLevel < BATTLE_PASS_CONFIG.MAX_LEVELS) {
            newXP -= xpPerLevel;
            newLevel++;
            
            // Déclencher la récompense de niveau
            await awardLevelReward(newLevel);
            
            // Notifier et afficher
            showLevelUpNotification(newLevel);
        }

        // Mettre à jour en base de données
        const updates = {
            'battlePassXP': newXP,
            'battlePassLevel': newLevel,
        };
        
        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        // Mettre à jour l'UI
        updateBattlePassUI();
        
        return true;
    } catch (e) {
        console.error('❌ Erreur XP passe brawl:', e);
        return false;
    }
}

async function awardLevelReward(level) {
    if (!G.user || !G.playerData) return;

    const reward = BATTLE_PASS_REWARDS[level];
    if (!reward) return;

    // Vérifie si c'est une récompense premium et si le joueur ne l'a pas payée
    if (reward.tier === 'premium' && !G.playerData.battlePassPremium) {
        // Marquer : accessible après paiement premium
        return;
    }

    try {
        const updates = {};

        if (reward.type === 'gold') {
            updates['gold'] = firebase.firestore.FieldValue.increment(reward.amount);
        } else if (reward.type === 'powerpoints') {
            const selectedChar = G.selectedChar || 'warrior';
            const currentPP = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
            updates[`powerPoints.${selectedChar}`] = currentPP + reward.amount;
        } else if (reward.type === 'chest') {
            // Ajouter à une queue de coffres à ouvrir
            const chests = G.playerData.battlePassChests || [];
            chests.push(reward.chest);
            updates['battlePassChests'] = chests;
        }

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        console.log(`✅ Récompense niveau ${level}: ${reward.label}`);
    } catch (e) {
        console.error('❌ Erreur attribution récompense:', e);
    }
}

function showLevelUpNotification(level) {
    const reward = BATTLE_PASS_REWARDS[level];
    if (!reward) return;

    // Créer une notification visuelle
    const notif = document.createElement('div');
    notif.className = 'battle-pass-level-up-notif';
    notif.innerHTML = `
        <div class="level-up-content">
            <div class="level-up-text">NIVEAU ${level} !</div>
            <div class="reward-text">${reward.label}</div>
        </div>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('show');
    }, 100);

    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 300);
    }, 3000);
}

/* =============================================
   UI DU PASSE BRAWL
   ============================================= */
function injectBattlePassUI() {
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !document.getElementById('battle-pass-btn')) {
        const btn = document.createElement('button');
        btn.id = 'battle-pass-btn';
        btn.className = 'btn-icon-header';
        btn.title = 'Passe Brawl';
        btn.textContent = '🎟️';
        btn.style.cssText = `animation: codeBtnPulse 3s ease-in-out infinite;`;
        
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) headerRight.insertBefore(btn, settingsBtn);
        else headerRight.appendChild(btn);

        btn.addEventListener('click', openBattlePassPanel);
    }

    // Créer le panneau s'il n'existe pas
    if (!document.getElementById('battle-pass-panel')) {
        const panel = document.createElement('div');
        panel.id = 'battle-pass-panel';
        panel.className = 'side-panel';
        panel.innerHTML = `
            <div class="panel-overlay" id="battle-pass-overlay"></div>
            <div class="panel-content battle-pass-panel-content">
                <div class="panel-header">
                    <h2 class="panel-title">🎟️ PASSE BRAWL</h2>
                    <button id="close-battle-pass-panel" class="btn-close">✕</button>
                </div>

                <div class="battle-pass-body">
                    <!-- Barre de progression principale -->
                    <div class="battle-pass-progress-section">
                        <div class="battle-pass-header-info">
                            <div class="level-display">
                                <div class="level-number" id="bp-level-display">1</div>
                                <div class="level-label">Niveau</div>
                            </div>
                            <div class="progress-details">
                                <div class="progress-bar-container">
                                    <div class="progress-bar-fill" id="bp-progress-bar" style="width: 0%"></div>
                                </div>
                                <div class="progress-text" id="bp-progress-text">0 / 150 XP</div>
                            </div>
                            <div class="premium-badge" id="bp-premium-badge">
                                <span id="bp-premium-btn" class="premium-btn-unlock">🔓 Premium</span>
                            </div>
                        </div>
                    </div>

                    <!-- Onglets -->
                    <div class="battle-pass-tabs">
                        <button class="bp-tab active" data-tab="rewards">Récompenses</button>
                        <button class="bp-tab" data-tab="quests">Quêtes</button>
                    </div>

                    <!-- TAB 1 : Récompenses -->
                    <div id="bp-tab-rewards" class="battle-pass-tab-content active">
                        <div class="rewards-grid" id="bp-rewards-grid">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>

                    <!-- TAB 2 : Quêtes -->
                    <div id="bp-tab-quests" class="battle-pass-tab-content">
                        <div class="quests-list" id="bp-quests-list">
                            <!-- Rempli dynamiquement -->
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Events
        document.getElementById('close-battle-pass-panel').addEventListener('click', closeBattlePassPanel);
        document.getElementById('battle-pass-overlay').addEventListener('click', closeBattlePassPanel);

        // Onglets
        document.querySelectorAll('.bp-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.bp-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.battle-pass-tab-content').forEach(c => c.classList.remove('active'));
                
                e.target.classList.add('active');
                document.getElementById(`bp-tab-${e.target.dataset.tab}`).classList.add('active');
            });
        });

        // Premium button
        document.getElementById('bp-premium-btn').addEventListener('click', handlePremiumPurchase);
    }
}

function openBattlePassPanel() {
    const panel = document.getElementById('battle-pass-panel');
    if (panel) {
        panel.classList.add('active');
        updateBattlePassUI();
        setTimeout(() => {
            renderBattlePassRewards();
            renderBattlePassQuests();
        }, 100);
    }
}

function closeBattlePassPanel() {
    const panel = document.getElementById('battle-pass-panel');
    if (panel) panel.classList.remove('active');
}

function updateBattlePassUI() {
    if (!G.playerData) return;

    const level = G.playerData.battlePassLevel || 1;
    const xp = G.playerData.battlePassXP || 0;
    const xpPerLevel = BATTLE_PASS_CONFIG.XP_PER_LEVEL;
    const progressPercent = ((xp / xpPerLevel) * 100).toFixed(1);

    document.getElementById('bp-level-display').textContent = level;
    const progressBar = document.getElementById('bp-progress-bar');
    if (progressBar) progressBar.style.width = progressPercent + '%';
    
    const progressText = document.getElementById('bp-progress-text');
    if (progressText) progressText.textContent = `${xp} / ${xpPerLevel} XP`;

    // Afficher status premium
    const badge = document.getElementById('bp-premium-badge');
    const btn = document.getElementById('bp-premium-btn');
    if (G.playerData.battlePassPremium) {
        badge.classList.add('premium-active');
        btn.textContent = '⭐ Premium Actif';
        btn.disabled = true;
    } else {
        badge.classList.remove('premium-active');
        btn.textContent = `🔓 Premium (${BATTLE_PASS_CONFIG.PREMIUM_PRICE} 💰)`;
        btn.disabled = false;
    }
}

function renderBattlePassRewards() {
    const grid = document.getElementById('bp-rewards-grid');
    if (!grid) return;

    const level = G.playerData.battlePassLevel || 1;
    let html = '';

    for (let i = 1; i <= BATTLE_PASS_CONFIG.MAX_LEVELS; i++) {
        const reward = BATTLE_PASS_REWARDS[i];
        if (!reward) continue;

        const isUnlocked = i <= level;
        const isPremium = reward.tier === 'premium';
        const isClaimed = G.playerData.battlePassClaimedRewards && G.playerData.battlePassClaimedRewards.includes(i);
        const canClaim = isUnlocked && (!isPremium || G.playerData.battlePassPremium) && !isClaimed;

        const cardClass = [
            'reward-card',
            isUnlocked ? 'unlocked' : 'locked',
            isPremium ? 'premium' : '',
            isClaimed ? 'claimed' : ''
        ].filter(Boolean).join(' ');

        html += `
            <div class="${cardClass}" ${canClaim ? `onclick="claimLevelReward(${i})"` : ''}>
                ${!isUnlocked ? '<div class="reward-lock">🔒</div>' : ''}
                <div class="reward-card-content">
                    <div class="reward-level">LVL ${i}</div>
                    <div class="reward-icon">${getRewardIcon(reward)}</div>
                    <div class="reward-label">${reward.label.split(' (')[0]}</div>
                </div>
                <div class="claimed-badge">✓</div>
            </div>
        `;
    }

    grid.innerHTML = html;

    // Ajouter event listeners aux cartes cliquables
    grid.querySelectorAll('.reward-card.unlocked:not(.claimed)').forEach((card) => {
        card.style.cursor = 'pointer';
    });
}

function renderBattlePassQuests() {
    const list = document.getElementById('bp-quests-list');
    if (!list) return;

    const playerQuests = G.playerData.battlePassQuests || {};

    let html = '';
    BATTLE_PASS_QUESTS.forEach(quest => {
        const progress = playerQuests[quest.id] || 0;
        const isCompleted = progress >= quest.target;
        const isClaimed = G.playerData.battlePassQuestsClaimed && G.playerData.battlePassQuestsClaimed.includes(quest.id);

        const progressPercent = isCompleted ? 100 : ((progress / quest.target) * 100).toFixed(0);

        const questClass = ['quest-item', isCompleted && 'completed', isClaimed && 'claimed'].filter(Boolean).join(' ');

        html += `
            <div class="${questClass}">
                <div class="quest-header">
                    <div class="quest-info">
                        <div class="quest-name">🎯 ${quest.name}</div>
                        <div class="quest-desc">${quest.desc}</div>
                    </div>
                    <div class="quest-reward-badge">
                        <div class="quest-xp-value">${quest.xp}</div>
                        <div class="quest-xp-label">XP</div>
                    </div>
                </div>
                
                <div class="quest-progress-container">
                    <div class="quest-progress-bar">
                        <div class="quest-progress-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="quest-progress-text">${progress} / ${quest.target}</div>
                </div>

                <div>
                    ${isCompleted && !isClaimed ? `<button class="btn-claim-quest" data-quest-id="${quest.id}">Réclamer</button>` : ''}
                    ${isClaimed ? `<div class="quest-claimed-badge">✓ Réclamée</div>` : ''}
                </div>
            </div>
        `;
    });

    list.innerHTML = html;

    // Events
    list.querySelectorAll('.btn-claim-quest').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const questId = e.target.dataset.questId;
            claimQuestReward(questId);
        });
    });
}

function getRewardIcon(reward) {
    if (reward.type === 'gold') return '💰';
    if (reward.type === 'powerpoints') return '⚡';
    if (reward.type === 'chest') {
        if (reward.chest === 'basic') return '📦';
        if (reward.chest === 'rare') return '🎁';
        if (reward.chest === 'epic') return '💎';
        if (reward.chest === 'legendary') return '👑';
    }
    return '?';
}

async function claimLevelReward(level) {
    if (!G.user || !G.playerData) return;

    const reward = BATTLE_PASS_REWARDS[level];
    if (!reward) return;

    // Vérif : déjà réclamé ?
    const claimed = G.playerData.battlePassClaimedRewards || [];
    if (claimed.includes(level)) {
        alert('Récompense déjà réclamée !');
        return;
    }

    // Vérif : niveau accessible ?
    const currentLevel = G.playerData.battlePassLevel || 1;
    if (level > currentLevel) {
        alert('Niveau non accessible !');
        return;
    }

    // Vérif : récompense premium
    if (reward.tier === 'premium' && !G.playerData.battlePassPremium) {
        alert('Achetez le Passe Brawl Premium pour accéder à cette récompense !');
        return;
    }

    try {
        const updates = {
            'battlePassClaimedRewards': firebase.firestore.FieldValue.arrayUnion(level),
        };

        if (reward.type === 'gold') {
            updates['gold'] = firebase.firestore.FieldValue.increment(reward.amount);
        } else if (reward.type === 'powerpoints') {
            const selectedChar = G.selectedChar || 'warrior';
            const currentPP = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
            updates[`powerPoints.${selectedChar}`] = currentPP + reward.amount;
        } else if (reward.type === 'chest') {
            const chests = G.playerData.battlePassChests || [];
            chests.push(reward.chest);
            updates['battlePassChests'] = chests;
        }

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        // Notification
        const notif = document.createElement('div');
        notif.className = 'reward-claimed-notif';
        notif.textContent = `🎉 ${reward.label} réclamé !`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 100);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 2000);

        renderBattlePassRewards();
    } catch (e) {
        console.error('❌ Erreur réclamation récompense:', e);
        alert('Erreur! Réessayez.');
    }
}

async function claimQuestReward(questId) {
    if (!G.user || !G.playerData) return;

    try {
        const quest = BATTLE_PASS_QUESTS.find(q => q.id === questId);
        if (!quest) return;

        const updates = {
            'battlePassQuestsClaimed': firebase.firestore.FieldValue.arrayUnion(questId),
        };

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        // Ajouter XP de la quête
        await addBattlePassXP(quest.xp, 'quest');

        renderBattlePassQuests();
    } catch (e) {
        console.error('❌ Erreur réclamation quête:', e);
        alert('Erreur! Réessayez.');
    }
}

async function handlePremiumPurchase() {
    if (!G.user || !G.playerData) return;

    if (G.playerData.battlePassPremium) {
        alert('Tu as déjà le Passe Premium !');
        return;
    }

    const gold = G.playerData.gold || 0;
    const price = BATTLE_PASS_CONFIG.PREMIUM_PRICE;

    if (gold < price) {
        alert(`Tu as besoin de ${price - gold} pièces d'or de plus !`);
        return;
    }

    const confirm = window.confirm(`Acheter le Passe Brawl Premium pour ${price} 💰 ?`);
    if (!confirm) return;

    try {
        const updates = {
            'gold': firebase.firestore.FieldValue.increment(-price),
            'battlePassPremium': true,
        };

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        alert('🎉 Passe Premium débloqué !');
        updateBattlePassUI();
        renderBattlePassRewards();
    } catch (e) {
        console.error('❌ Erreur achat premium:', e);
        alert('Erreur achat. Réessayez.');
    }
}

/* =============================================
   INIT & INTÉGRATION COMBATS
   ============================================= */
function initBattlePassSystem() {
    injectBattlePassUI();
    console.log('🎟️ Système Passe Brawl chargé !');
}

// Auto-init
if (typeof G !== 'undefined' && G.user) {
    initBattlePassSystem();
}

// ✅ Cette fonction DOIT être appelée après chaque combat gagné
function onCombatWon(xpReward = 50) {
    addBattlePassXP(xpReward, 'combat');
}

// ✅ Cette fonction DOIT être appelée après des quêtes complétées
function onQuestProgress(questId, amount = 1) {
    if (!G.user || !G.playerData) return;

    const quest = BATTLE_PASS_QUESTS.find(q => q.id === questId);
    if (!quest) return;

    try {
        const current = G.playerData.battlePassQuests && G.playerData.battlePassQuests[questId] || 0;
        const newProgress = current + amount;

        const updates = {
            [`battlePassQuests.${questId}`]: newProgress,
        };

        FSDB.collection('players').doc(G.user.uid).update(updates);
    } catch (e) {
        console.error('❌ Erreur progression quête:', e);
    }
}
