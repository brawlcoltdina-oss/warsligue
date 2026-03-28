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

// Structure des récompenses par niveau (Gratuit et Premium séparés)
const BATTLE_PASS_REWARDS = {
    // NIVEAU 1
    1:  { 
        free:    { type: 'gold',        amount: 50,      label: '💰 50 pièces' },
        premium: { type: 'gold',        amount: 150,     label: '💰 150 pièces' }
    },
    2:  { 
        free:    { type: 'powerpoints', amount: 5,       label: '⚡ +5 PP' },
        premium: { type: 'gold',        amount: 100,     label: '💰 100 pièces' }
    },
    3:  { 
        free:    { type: 'gold',        amount: 75,      label: '💰 75 pièces' },
        premium: { type: 'chest',       chest: 'rare',   label: '🎁 Coffre Rare' }
    },
    4:  { 
        free:    { type: 'powerpoints', amount: 8,       label: '⚡ +8 PP' },
        premium: { type: 'gold',        amount: 200,     label: '💰 200 pièces' }
    },
    5:  { 
        free:    { type: 'gold',        amount: 100,     label: '💰 100 pièces' },
        premium: { type: 'prestige',    amount: 5,       label: '👑 Prestige x5' }
    },
    6:  { 
        free:    { type: 'chest',       chest: 'basic',  label: '📦 Coffre Basique' },
        premium: { type: 'gold',        amount: 250,     label: '💰 250 pièces' }
    },
    7:  { 
        free:    { type: 'gold',        amount: 150,     label: '💰 150 pièces' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    8:  { 
        free:    { type: 'powerpoints', amount: 12,      label: '⚡ +12 PP' },
        premium: { type: 'prestige',    amount: 10,      label: '👑 Prestige x10' }
    },
    9:  { 
        free:    { type: 'gold',        amount: 200,     label: '💰 200 pièces' },
        premium: { type: 'gold',        amount: 300,     label: '💰 300 pièces' }
    },
    10: { 
        free:    { type: 'powerpoints', amount: 15,      label: '⚡ +15 PP' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    11: { 
        free:    { type: 'gold',        amount: 100,     label: '💰 100 pièces' },
        premium: { type: 'gold',        amount: 350,     label: '💰 350 pièces' }
    },
    12: { 
        free:    { type: 'powerpoints', amount: 10,      label: '⚡ +10 PP' },
        premium: { type: 'prestige',    amount: 15,      label: '👑 Prestige x15' }
    },
    13: { 
        free:    { type: 'gold',        amount: 125,     label: '💰 125 pièces' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    14: { 
        free:    { type: 'chest',       chest: 'basic',  label: '📦 Coffre Basique' },
        premium: { type: 'gold',        amount: 400,     label: '💰 400 pièces' }
    },
    15: { 
        free:    { type: 'gold',        amount: 150,     label: '💰 150 pièces' },
        premium: { type: 'prestige',    amount: 20,      label: '👑 Prestige x20' }
    },
    16: { 
        free:    { type: 'powerpoints', amount: 15,      label: '⚡ +15 PP' },
        premium: { type: 'gold',        amount: 450,     label: '💰 450 pièces' }
    },
    17: { 
        free:    { type: 'gold',        amount: 175,     label: '💰 175 pièces' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    18: { 
        free:    { type: 'powerpoints', amount: 12,      label: '⚡ +12 PP' },
        premium: { type: 'prestige',    amount: 25,      label: '👑 Prestige x25' }
    },
    19: { 
        free:    { type: 'gold',        amount: 200,     label: '💰 200 pièces' },
        premium: { type: 'gold',        amount: 500,     label: '💰 500 pièces' }
    },
    20: { 
        free:    { type: 'chest',       chest: 'rare',   label: '🎁 Coffre Rare' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    21: { 
        free:    { type: 'gold',        amount: 150,     label: '💰 150 pièces' },
        premium: { type: 'prestige',    amount: 30,      label: '👑 Prestige x30' }
    },
    22: { 
        free:    { type: 'powerpoints', amount: 18,      label: '⚡ +18 PP' },
        premium: { type: 'gold',        amount: 550,     label: '💰 550 pièces' }
    },
    23: { 
        free:    { type: 'gold',        amount: 200,     label: '💰 200 pièces' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    24: { 
        free:    { type: 'chest',       chest: 'basic',  label: '📦 Coffre Basique' },
        premium: { type: 'prestige',    amount: 35,      label: '👑 Prestige x35' }
    },
    25: { 
        free:    { type: 'gold',        amount: 250,     label: '💰 250 pièces' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    26: { 
        free:    { type: 'powerpoints', amount: 20,      label: '⚡ +20 PP' },
        premium: { type: 'gold',        amount: 600,     label: '💰 600 pièces' }
    },
    27: { 
        free:    { type: 'gold',        amount: 275,     label: '💰 275 pièces' },
        premium: { type: 'prestige',    amount: 40,      label: '👑 Prestige x40' }
    },
    28: { 
        free:    { type: 'powerpoints', amount: 15,      label: '⚡ +15 PP' },
        premium: { type: 'gold',        amount: 650,     label: '💰 650 pièces' }
    },
    29: { 
        free:    { type: 'gold',        amount: 300,     label: '💰 300 pièces' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    30: { 
        free:    { type: 'chest',       chest: 'rare',   label: '🎁 Coffre Rare' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    31: { 
        free:    { type: 'gold',        amount: 200,     label: '💰 200 pièces' },
        premium: { type: 'prestige',    amount: 50,      label: '👑 Prestige x50' }
    },
    32: { 
        free:    { type: 'powerpoints', amount: 25,      label: '⚡ +25 PP' },
        premium: { type: 'gold',        amount: 700,     label: '💰 700 pièces' }
    },
    33: { 
        free:    { type: 'gold',        amount: 250,     label: '💰 250 pièces' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    34: { 
        free:    { type: 'chest',       chest: 'rare',   label: '🎁 Coffre Rare' },
        premium: { type: 'prestige',    amount: 55,      label: '👑 Prestige x55' }
    },
    35: { 
        free:    { type: 'gold',        amount: 300,     label: '💰 300 pièces' },
        premium: { type: 'gold',        amount: 750,     label: '💰 750 pièces' }
    },
    36: { 
        free:    { type: 'powerpoints', amount: 30,      label: '⚡ +30 PP' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    37: { 
        free:    { type: 'gold',        amount: 350,     label: '💰 350 pièces' },
        premium: { type: 'prestige',    amount: 60,      label: '👑 Prestige x60' }
    },
    38: { 
        free:    { type: 'powerpoints', amount: 20,      label: '⚡ +20 PP' },
        premium: { type: 'gold',        amount: 800,     label: '💰 800 pièces' }
    },
    39: { 
        free:    { type: 'gold',        amount: 400,     label: '💰 400 pièces' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    40: { 
        free:    { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' },
        premium: { type: 'prestige',    amount: 75,      label: '👑 Prestige x75' }
    },
    41: { 
        free:    { type: 'gold',        amount: 300,     label: '💰 300 pièces' },
        premium: { type: 'gold',        amount: 850,     label: '💰 850 pièces' }
    },
    42: { 
        free:    { type: 'powerpoints', amount: 35,      label: '⚡ +35 PP' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    43: { 
        free:    { type: 'gold',        amount: 350,     label: '💰 350 pièces' },
        premium: { type: 'prestige',    amount: 80,      label: '👑 Prestige x80' }
    },
    44: { 
        free:    { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' },
        premium: { type: 'gold',        amount: 900,     label: '💰 900 pièces' }
    },
    45: { 
        free:    { type: 'gold',        amount: 400,     label: '💰 400 pièces' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
    46: { 
        free:    { type: 'powerpoints', amount: 40,      label: '⚡ +40 PP' },
        premium: { type: 'prestige',    amount: 100,     label: '👑 Prestige x100' }
    },
    47: { 
        free:    { type: 'gold',        amount: 450,     label: '💰 450 pièces' },
        premium: { type: 'gold',        amount: 1000,    label: '💰 1000 pièces' }
    },
    48: { 
        free:    { type: 'powerpoints', amount: 30,      label: '⚡ +30 PP' },
        premium: { type: 'chest',       chest: 'epic',   label: '💎 Coffre Épique' }
    },
    49: { 
        free:    { type: 'gold',        amount: 500,     label: '💰 500 pièces' },
        premium: { type: 'prestige',    amount: 150,     label: '👑 Prestige x150' }
    },
    50: { 
        free:    { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' },
        premium: { type: 'chest',       chest: 'legendary', label: '👑 Coffre Légendaire' }
    },
};

/* =============================================
   UTILITAIRES PASSE BRAWL
   ============================================= */
function getClaimedRewards() {
    if (!G.playerData) return { free: [], premium: [] };

    const claimed = G.playerData.battlePassClaimedRewards;
    if (!claimed) return { free: [], premium: [] };

    if (Array.isArray(claimed)) {
        return { free: claimed, premium: [] };
    }

    return {
        free: Array.isArray(claimed.free) ? claimed.free : [],
        premium: Array.isArray(claimed.premium) ? claimed.premium : [],
    };
}

function getAutoAppliedRewards() {
    if (!G.playerData) return { free: [], premium: [] };

    const autoApplied = G.playerData.battlePassAutoApplied;
    if (!autoApplied) return { free: [], premium: [] };

    return {
        free: Array.isArray(autoApplied.free) ? autoApplied.free : [],
        premium: Array.isArray(autoApplied.premium) ? autoApplied.premium : [],
    };
}

function getClaimedArrayField(isPremium) {
    return isPremium ? 'battlePassClaimedRewards.premium' : 'battlePassClaimedRewards.free';
}

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
    { id: 'quest_7',  name: 'Légende',                desc: 'Atteins le niveau 50',        xp: 500, target: 25, type: 'level', reward: '500 XP' },
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

    const rewardData = BATTLE_PASS_REWARDS[level];
    if (!rewardData) return;

    try {
        const isPremiumOwned = G.playerData.battlePassPremium;

        let goldToAdd = 0;
        let powerPointsToAdd = 0;
        let prestigeToAdd = 0;
        const selectedChar = G.selectedChar || 'warrior';
        const chestRewards = [];

        const accumulateReward = (reward) => {
            if (!reward || !reward.type) return;
            if (reward.type === 'gold') {
                goldToAdd += reward.amount;
            } else if (reward.type === 'powerpoints') {
                powerPointsToAdd += reward.amount;
            } else if (reward.type === 'prestige') {
                prestigeToAdd += reward.amount;
            } else if (reward.type === 'chest') {
                chestRewards.push(reward.chest);
            }
        };

        accumulateReward(rewardData.free);
        if (isPremiumOwned) {
            accumulateReward(rewardData.premium);
        }

        const updates = {};
        // Marquer que les récompenses ont été appliquées automatiquement
        updates['battlePassAutoApplied.free'] = firebase.firestore.FieldValue.arrayUnion(level);
        if (isPremiumOwned) {
            updates['battlePassAutoApplied.premium'] = firebase.firestore.FieldValue.arrayUnion(level);
        }

        if (goldToAdd > 0) updates['gold'] = firebase.firestore.FieldValue.increment(goldToAdd);
        if (powerPointsToAdd > 0) updates[`powerPoints.${selectedChar}`] = firebase.firestore.FieldValue.increment(powerPointsToAdd);
        if (prestigeToAdd > 0) updates['prestigePoints'] = firebase.firestore.FieldValue.increment(prestigeToAdd);
        if (chestRewards.length > 0) updates['battlePassChests'] = firebase.firestore.FieldValue.arrayUnion(...new Set(chestRewards));

        await FSDB.collection('players').doc(G.user.uid).update(updates);

        const logReward = isPremiumOwned ? `${rewardData.free.label} et ${rewardData.premium.label}` : rewardData.free.label;
        console.log(`✅ Récompense niveau ${level}: ${logReward}`);

        // Ouvrir automatiquement les coffres récompensés
        if (chestRewards.length > 0) {
            for (const chestType of chestRewards) {
                await openBattlePassChest(chestType);
            }
        }
    } catch (e) {
        console.error('❌ Erreur attribution récompense:', e);
    }
}

function showLevelUpNotification(level) {
    const rewardData = BATTLE_PASS_REWARDS[level];
    if (!rewardData) return;

    const isPremiumOwned = G.playerData && G.playerData.battlePassPremium;
    const reward = isPremiumOwned ? rewardData.premium : rewardData.free;

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
                        <div class="rewards-track-container">
                            <!-- Chaîne gauche (gratuit) -->
                            <div class="rewards-chain left-chain">
                                <div class="chain-link" id="bp-chain-left"></div>
                            </div>

                            <!-- Colonne GRATUIT -->
                            <div class="rewards-column free-column">
                                <div class="column-header">
                                    <span class="column-title">🎁 GRATUIT</span>
                                </div>
                                <div class="rewards-list" id="bp-rewards-free"></div>
                            </div>

                            <!-- Chaîne du milieu (connecteur) -->
                            <div class="rewards-chain-middle"></div>

                            <!-- Colonne PREMIUM -->
                            <div class="rewards-column premium-column">
                                <div class="column-header premium-header">
                                    <span class="column-title">⭐ PREMIUM</span>
                                </div>
                                <div class="rewards-list" id="bp-rewards-premium"></div>
                            </div>

                            <!-- Chaîne droite (premium) -->
                            <div class="rewards-chain right-chain">
                                <div class="chain-link" id="bp-chain-right"></div>
                            </div>
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
    const freeList = document.getElementById('bp-rewards-free');
    const premiumList = document.getElementById('bp-rewards-premium');
    if (!freeList || !premiumList) return;

    const level = G.playerData.battlePassLevel || 1;
    const isPremiumOwned = G.playerData.battlePassPremium;
    const claimedRewards = getClaimedRewards();
    let freeHtml = '';
    let premiumHtml = '';

    for (let i = 1; i <= BATTLE_PASS_CONFIG.MAX_LEVELS; i++) {
        const rewardData = BATTLE_PASS_REWARDS[i];
        if (!rewardData) continue;

        const isUnlocked = i <= level;
        const isFreeClaimed = claimedRewards.free.includes(i);
        const isPremiumClaimed = claimedRewards.premium.includes(i);

        // CÔTÉ GRATUIT
        const freeReward = rewardData.free;
        const freeCardClass = [
            'reward-item',
            isUnlocked ? 'unlocked' : 'locked',
            isFreeClaimed ? 'claimed' : ''
        ].filter(Boolean).join(' ');

        freeHtml += `
            <div class="${freeCardClass}" ${isUnlocked && !isFreeClaimed ? `onclick="claimLevelReward(${i})"` : ''}>
                <div class="reward-item-inner">
                    ${!isUnlocked ? '<div class="item-lock">🔒</div>' : ''}
                    <div class="item-icon">${getRewardIcon(freeReward)}</div>
                    <div class="item-label">${freeReward.label}</div>
                    ${isFreeClaimed ? '<div class="item-claimed">✓</div>' : ''}
                </div>
                <div class="level-badge">${i}</div>
            </div>
        `;

        // CÔTÉ PREMIUM
        const premiumReward = rewardData.premium;
        const canClaimPremium = isUnlocked && isPremiumOwned && !isPremiumClaimed;
        const premiumCardClass = [
            'reward-item',
            'premium-item',
            isUnlocked ? 'unlocked' : 'locked',
            isPremiumClaimed ? 'claimed' : '',
            !isPremiumOwned && isUnlocked ? 'locked-premium' : ''
        ].filter(Boolean).join(' ');

        premiumHtml += `
            <div class="${premiumCardClass}" ${canClaimPremium ? `onclick="claimLevelReward(${i})"` : ''}>
                <div class="reward-item-inner">
                    ${!isUnlocked ? '<div class="item-lock">🔒</div>' : ''}
                    ${isUnlocked && !isPremiumOwned ? '<div class="item-premium-lock">⭐</div>' : ''}
                    <div class="item-icon">${getRewardIcon(premiumReward)}</div>
                    <div class="item-label">${premiumReward.label}</div>
                    ${isPremiumClaimed ? '<div class="item-claimed">✓</div>' : ''}
                </div>
                <div class="level-badge premium-badge">${i}</div>
            </div>
        `;
    }

    freeList.innerHTML = freeHtml;
    premiumList.innerHTML = premiumHtml;
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
    if (reward.type === 'prestige') return '👑';
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

    const rewardData = BATTLE_PASS_REWARDS[level];
    if (!rewardData) return;

    // Vérif : déjà réclamé ?
    const claimedRewards = getClaimedRewards();
    const autoAppliedRewards = getAutoAppliedRewards();
    const isFreeClaimed = claimedRewards.free.includes(level);
    const isPremiumClaimed = claimedRewards.premium.includes(level);
    const isFreeAutoApplied = autoAppliedRewards.free.includes(level);
    const isPremiumAutoApplied = autoAppliedRewards.premium.includes(level);
    const isPremiumOwned = G.playerData.battlePassPremium;

    if (isFreeClaimed && (!isPremiumOwned || isPremiumClaimed)) {
        alert('Récompense déjà réclamée !');
        return;
    }

    // Vérif : niveau accessible ?
    const currentLevel = G.playerData.battlePassLevel || 1;
    if (level > currentLevel) {
        alert('Niveau non accessible !');
        return;
    }

    try {
        const isPremiumOwned = G.playerData.battlePassPremium;
        const freeReward = rewardData.free;
        const premiumReward = rewardData.premium;

        let goldToAdd = 0;
        let powerPointsToAdd = 0;
        let prestigeToAdd = 0;
        const selectedChar = G.selectedChar || 'warrior';
        const chestRewards = [];

        const accumulateReward = (reward) => {
            if (!reward || !reward.type) return;
            if (reward.type === 'gold') {
                goldToAdd += reward.amount;
            } else if (reward.type === 'powerpoints') {
                powerPointsToAdd += reward.amount;
            } else if (reward.type === 'prestige') {
                prestigeToAdd += reward.amount;
            } else if (reward.type === 'chest') {
                chestRewards.push(reward.chest);
            }
        };

        let claimFreeNow = false;
        let claimPremiumNow = false;

        // Appliquer seulement si pas déjà appliqué automatiquement
        if (!isFreeAutoApplied) {
            accumulateReward(freeReward);
            claimFreeNow = true;
        }

        if (isPremiumOwned && !isPremiumAutoApplied) {
            accumulateReward(premiumReward);
            claimPremiumNow = true;
        }

        // Toujours permettre la réclamation pour marquer visuellement comme réclamé
        // même si les récompenses ont déjà été appliquées automatiquement
        const canClaimFree = !isFreeClaimed;
        const canClaimPremium = isPremiumOwned && !isPremiumClaimed;

        if (!canClaimFree && !canClaimPremium) {
            alert('Récompense déjà réclamée !');
            return;
        }

        const updates = {};
        if (canClaimFree) {
            updates['battlePassClaimedRewards.free'] = firebase.firestore.FieldValue.arrayUnion(level);
        }
        if (canClaimPremium) {
            updates['battlePassClaimedRewards.premium'] = firebase.firestore.FieldValue.arrayUnion(level);
        }

        // Appliquer les récompenses seulement si elles n'ont pas été appliquées automatiquement
        if (goldToAdd > 0) updates['gold'] = firebase.firestore.FieldValue.increment(goldToAdd);
        if (powerPointsToAdd > 0) updates[`powerPoints.${selectedChar}`] = firebase.firestore.FieldValue.increment(powerPointsToAdd);
        if (prestigeToAdd > 0) updates['prestigePoints'] = firebase.firestore.FieldValue.increment(prestigeToAdd);
        if (chestRewards.length > 0) updates['battlePassChests'] = firebase.firestore.FieldValue.arrayUnion(...new Set(chestRewards));

        await FSDB.collection('players').doc(G.user.uid).update(updates);

        let notifLabel = [];
        if (canClaimFree) notifLabel.push(freeReward.label);
        if (canClaimPremium) notifLabel.push(premiumReward.label);
        notifLabel = notifLabel.join(' + ');

        const notif = document.createElement('div');
        notif.className = 'reward-claimed-notif';
        notif.textContent = `🎉 ${notifLabel} réclamé !`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 100);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 2000);

        // Ouvrir automatiquement les coffres récompensés
        if (chestRewards.length > 0) {
            for (const chestType of chestRewards) {
                await openBattlePassChest(chestType);
            }
        }

        setTimeout(() => renderBattlePassRewards(), 100);
    } catch (e) {
        console.error('❌ Erreur réclamation récompense:', e);
        alert('Erreur! Réessayez.');
    }
}

async function openBattlePassChest(chestType) {
    if (!G.user || !G.playerData) return;

    try {
        console.log(`🎁 Ouverture automatique du coffre ${chestType} du passe brawl...`);

        // Générer la récompense
        const reward = generateChestReward(chestType, G.playerData);

        // Appliquer la récompense
        const updates = { gold: firebase.firestore.FieldValue.increment(reward.gold) };
        if (!G.playerData.powerPoints) G.playerData.powerPoints = {};

        const selectedChar = G.selectedChar || 'warrior';
        const currentPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
        updates[`powerPoints.${selectedChar}`] = currentPowerPoints + reward.powerPoints;

        if (reward.character && reward.isNew) {
            updates.ownedCharacters = firebase.firestore.FieldValue.arrayUnion(reward.character);
        }

        await FSDB.collection('players').doc(G.user.uid).update(updates);

        // Afficher la notification de récompense
        const chest = CHEST_TYPES[chestType];
        let rewardText = `+${reward.gold} 💰 +${reward.powerPoints} ⚡`;
        if (reward.character && reward.isNew) {
            const char = CHARACTERS[reward.character];
            rewardText += ` + ${char.name} !`;
        }

        const notif = document.createElement('div');
        notif.className = 'reward-claimed-notif';
        notif.textContent = `🎁 ${chest.name} ouvert : ${rewardText}`;
        document.body.appendChild(notif);
        setTimeout(() => notif.classList.add('show'), 100);
        setTimeout(() => {
            notif.classList.remove('show');
            setTimeout(() => notif.remove(), 300);
        }, 4000);

        console.log(`✅ Coffre ${chestType} ouvert avec succès:`, reward);
    } catch (e) {
        console.error('❌ Erreur ouverture coffre passe brawl:', e);
    }
}

async function claimQuestReward(questId) {
    if (!G.user || !G.playerData) return;

    try {
        const quest = BATTLE_PASS_QUESTS.find(q => q.id === questId);
        if (!quest) return;

        // Vérif: déjà réclamé?
        const claimed = G.playerData.battlePassQuestsClaimed || [];
        if (claimed.includes(questId)) {
            alert('Quête déjà réclamée!');
            return;
        }

        const updates = {
            'battlePassQuestsClaimed': firebase.firestore.FieldValue.arrayUnion(questId),
        };

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        // Ajouter XP de la quête
        await addBattlePassXP(quest.xp, 'quest');

        // Re-render (les données se mettent à jour automatiquement via le listener)
        setTimeout(() => renderBattlePassQuests(), 100);
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
        // Les données se mettent à jour automatiquement via le listener
        setTimeout(() => {
            updateBattlePassUI();
            renderBattlePassRewards();
        }, 100);
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
async function onQuestProgress(questId, amount = 1) {
    if (!G.user || !G.playerData) return;

    const quest = BATTLE_PASS_QUESTS.find(q => q.id === questId);
    if (!quest) return;

    try {
        const updates = {
            [`battlePassQuests.${questId}`]: firebase.firestore.FieldValue.increment(amount),
        };

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        // Les données se mettent à jour automatiquement via le listener
    } catch (e) {
        console.error('❌ Erreur progression quête:', e);
    }
}
