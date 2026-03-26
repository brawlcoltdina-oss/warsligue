// ==========================================
// WARSLIGUE — SYSTÈME DE CODES DE COMBAT
// ==========================================

/* =============================================
   CONFIGURATION DES CODES
   ============================================= */
const COMBAT_CODES = {
    // ── COFFRES PETITS ──────────────────────────
    'WARSLIGUE':  { type: 'chest', chest: 'basic',      label: '📦 Coffre Basique',      oneTime: false },
    'WARRIOR':    { type: 'chest', chest: 'basic',      label: '📦 Coffre Basique',      oneTime: false },
    'BATTLE':     { type: 'chest', chest: 'basic',      label: '📦 Coffre Basique',      oneTime: false },
    'DEBUT':      { type: 'chest', chest: 'rare',       label: '🎁 Coffre Rare',         oneTime: true  },
    'SURVIVOR':   { type: 'chest', chest: 'rare',       label: '🎁 Coffre Rare',         oneTime: false },
    'ZOMBIE':     { type: 'chest', chest: 'rare',       label: '🎁 Coffre Rare',         oneTime: false },

    // ── COFFRES MOYENS ───────────────────────────
    'EPICWAR':    { type: 'chest', chest: 'epic',       label: '💎 Coffre Épique',       oneTime: true  },
    'CHAMPION':   { type: 'chest', chest: 'epic',       label: '💎 Coffre Épique',       oneTime: true  },
    'WARSMASTER': { type: 'chest', chest: 'epic',       label: '💎 Coffre Épique',       oneTime: true  },

    // ── COFFRES GROS ─────────────────────────────
    'LEGENDARY':  { type: 'chest', chest: 'legendary',  label: '👑 Coffre Légendaire',   oneTime: true  },
    'WARSLORD':   { type: 'chest', chest: 'legendary',  label: '👑 Coffre Légendaire',   oneTime: true  },
    'GODOFWAR':   { type: 'chest', chest: 'legendary',  label: '👑 Coffre Légendaire',   oneTime: true  },

    // ── POINTS DE POUVOIR ─────────────────────────
    'POWER10':    { type: 'powerpoints', amount: 10,    label: '⚡ +10 Points de Pouvoir', oneTime: false },
    'POWER50':    { type: 'powerpoints', amount: 50,    label: '⚡ +50 Points de Pouvoir', oneTime: true  },
    'POWERMAX':   { type: 'powerpoints', amount: 200,   label: '⚡ +200 Points de Pouvoir',oneTime: true  },

    // ── OR ────────────────────────────────────────
    'GOLD100':    { type: 'gold', amount: 100,          label: '💰 +100 Pièces d\'or',   oneTime: false },
    'RICHMAN':    { type: 'gold', amount: 500,          label: '💰 +500 Pièces d\'or',   oneTime: true  },
};

/* =============================================
   LOGIQUE D'APPLICATION DU CODE
   ============================================= */
async function applyCombatCode(code) {
    if (!G.user || !G.playerData) return { success: false, msg: 'Connectez-vous d\'abord !' };

    const key = code.trim().toUpperCase();
    const config = COMBAT_CODES[key];

    if (!config) return { success: false, msg: '❌ Code invalide ou expiré.' };

    // Vérifie si déjà utilisé (codes oneTime)
    const usedCodes = G.playerData.usedCodes || [];
    if (config.oneTime && usedCodes.includes(key)) {
        return { success: false, msg: '⚠️ Tu as déjà utilisé ce code !' };
    }

    try {
        const updates = {};

        if (config.type === 'chest') {
            // Déclencher directement l'ouverture du coffre (sans le payer)
            if (config.oneTime) updates['usedCodes'] = firebase.firestore.FieldValue.arrayUnion(key);
            await FSDB.collection('players').doc(G.user.uid).update(updates);
            // Lancer l'animation de coffre
            return { success: true, msg: config.label, openChest: config.chest };
        }

        if (config.type === 'powerpoints') {
            const selectedChar = G.selectedChar || 'warrior';
            const currentPP = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
            updates[`powerPoints.${selectedChar}`] = currentPP + config.amount;
            if (config.oneTime) updates['usedCodes'] = firebase.firestore.FieldValue.arrayUnion(key);
            await FSDB.collection('players').doc(G.user.uid).update(updates);
            return { success: true, msg: `${config.label} pour ${(CHARACTERS[selectedChar] || {}).name || selectedChar} !` };
        }

        if (config.type === 'gold') {
            updates['gold'] = firebase.firestore.FieldValue.increment(config.amount);
            if (config.oneTime) updates['usedCodes'] = firebase.firestore.FieldValue.arrayUnion(key);
            await FSDB.collection('players').doc(G.user.uid).update(updates);
            return { success: true, msg: config.label };
        }

        return { success: false, msg: 'Type de récompense inconnu.' };
    } catch (e) {
        console.error('❌ Erreur code combat:', e);
        return { success: false, msg: 'Erreur serveur, réessayez.' };
    }
}

/* =============================================
   INJECTION UI — PANNEAU CODES DE COMBAT
   ============================================= */
function injectCombatCodesUI() {
    // Ajouter le bouton dans le header du menu principal
    const headerRight = document.querySelector('.header-right');
    if (headerRight && !document.getElementById('combat-code-btn')) {
        const btn = document.createElement('button');
        btn.id = 'combat-code-btn';
        btn.className = 'btn-icon-header';
        btn.title = 'Codes de Combat';
        btn.textContent = '🎟️';
        btn.style.cssText = `
            animation: codeBtnPulse 3s ease-in-out infinite;
        `;
        // Insérer avant le bouton settings
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) headerRight.insertBefore(btn, settingsBtn);
        else headerRight.appendChild(btn);

        btn.addEventListener('click', openCombatCodePanel);
    }

    // Créer le panneau s'il n'existe pas
    if (!document.getElementById('combat-code-panel')) {
        const panel = document.createElement('div');
        panel.id = 'combat-code-panel';
        panel.className = 'side-panel';
        panel.innerHTML = `
            <div class="panel-overlay" id="combat-code-overlay"></div>
            <div class="panel-content combat-code-panel-content">
                <div class="panel-header">
                    <h2 class="panel-title">🎟️ CODES DE COMBAT</h2>
                    <button id="close-combat-code-panel" class="btn-close">✕</button>
                </div>

                <div class="combat-code-body">
                    <!-- Description -->
                    <div class="combat-code-desc">
                        <span class="combat-code-desc-icon">🔑</span>
                        <span>Entre un code spécial pour obtenir des coffres, de l'or ou des points de pouvoir&nbsp;!</span>
                    </div>

                    <!-- Input -->
                    <div class="combat-code-input-wrap">
                        <input
                            id="combat-code-input"
                            type="text"
                            placeholder="Ex : WARSLIGUE"
                            maxlength="20"
                            autocomplete="off"
                            autocorrect="off"
                            spellcheck="false"
                            style="text-transform:uppercase;"
                        >
                        <button id="combat-code-submit" class="btn-primary combat-code-submit-btn">
                            Valider
                        </button>
                    </div>

                    <!-- Message retour -->
                    <div id="combat-code-msg" class="combat-code-msg"></div>

                    <!-- Aperçu des récompenses possibles -->
                    <div class="combat-code-rewards-preview">
                        <div class="rewards-preview-title">🎁 Récompenses possibles</div>
                        <div class="rewards-preview-grid">
                            <div class="reward-preview-item">
                                <span class="rp-icon">📦</span>
                                <span class="rp-label">Coffres<br><small>Basique → Légendaire</small></span>
                            </div>
                            <div class="reward-preview-item">
                                <span class="rp-icon">⚡</span>
                                <span class="rp-label">Points<br><small>de Pouvoir</small></span>
                            </div>
                            <div class="reward-preview-item">
                                <span class="rp-icon">💰</span>
                                <span class="rp-label">Pièces<br><small>d'Or</small></span>
                            </div>
                            <div class="reward-preview-item">
                                <span class="rp-icon">👑</span>
                                <span class="rp-label">Coffre<br><small>Légendaire</small></span>
                            </div>
                        </div>
                    </div>

                    <!-- Liste codes déjà utilisés -->
                    <div class="combat-code-used-section">
                        <div class="used-codes-title">✅ Codes utilisés (à usage unique)</div>
                        <div id="combat-code-used-list" class="used-codes-list">
                            <span class="used-codes-empty">Aucun code à usage unique utilisé</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(panel);

        // Events
        document.getElementById('close-combat-code-panel').addEventListener('click', closeCombatCodePanel);
        document.getElementById('combat-code-overlay').addEventListener('click', closeCombatCodePanel);

        document.getElementById('combat-code-submit').addEventListener('click', handleCombatCodeSubmit);
        document.getElementById('combat-code-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleCombatCodeSubmit();
        });
        document.getElementById('combat-code-input').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });
    }
}

function openCombatCodePanel() {
    const panel = document.getElementById('combat-code-panel');
    if (panel) {
        panel.classList.add('active');
        refreshUsedCodesList();
        setTimeout(() => document.getElementById('combat-code-input')?.focus(), 400);
    }
}

function closeCombatCodePanel() {
    const panel = document.getElementById('combat-code-panel');
    if (panel) panel.classList.remove('active');
}

function refreshUsedCodesList() {
    const list = document.getElementById('combat-code-used-list');
    if (!list || !G.playerData) return;
    const usedCodes = G.playerData.usedCodes || [];
    const oneTimeCodes = usedCodes.filter(c => COMBAT_CODES[c] && COMBAT_CODES[c].oneTime);
    if (oneTimeCodes.length === 0) {
        list.innerHTML = '<span class="used-codes-empty">Aucun code à usage unique utilisé</span>';
    } else {
        list.innerHTML = oneTimeCodes.map(c => {
            const cfg = COMBAT_CODES[c];
            return `<div class="used-code-tag">
                <span class="used-code-name">${c}</span>
                <span class="used-code-reward">${cfg ? cfg.label : ''}</span>
            </div>`;
        }).join('');
    }
}

async function handleCombatCodeSubmit() {
    const input = document.getElementById('combat-code-input');
    const msgEl = document.getElementById('combat-code-msg');
    const btn   = document.getElementById('combat-code-submit');
    if (!input || !msgEl) return;

    const code = input.value.trim();
    if (!code) return;

    btn.disabled = true;
    btn.textContent = '...';
    msgEl.className = 'combat-code-msg';
    msgEl.textContent = '';

    const result = await applyCombatCode(code);

    btn.disabled = false;
    btn.textContent = 'Valider';

    if (result.success) {
        msgEl.className = 'combat-code-msg success';
        msgEl.textContent = '🎉 ' + result.msg;
        input.value = '';
        refreshUsedCodesList();

        // Ouvrir un coffre si nécessaire
        if (result.openChest) {
            setTimeout(async () => {
                closeCombatCodePanel();
                // Aller sur l'écran des coffres si pas déjà dessus
                if (!document.getElementById('chests-screen').classList.contains('active')) {
                    showScreen('chests-screen');
                }
                await openChestAnimation(result.openChest);
            }, 900);
        }
    } else {
        msgEl.className = 'combat-code-msg error';
        msgEl.textContent = result.msg;
        // Shake l'input
        input.classList.add('shake-anim');
        setTimeout(() => input.classList.remove('shake-anim'), 500);
    }
}

/* =============================================
   INIT — appelé depuis java.js après login
   ============================================= */
function initCombatCodesSystem() {
    injectCombatCodesUI();
    console.log('🎟️ Système de codes de combat chargé !');
}

// Auto-init si G est déjà prêt, sinon attendre
if (typeof G !== 'undefined' && G.user) {
    initCombatCodesSystem();
} else {
    // Sera appelé manuellement depuis java.js dans onAuthStateChanged
    console.log('🎟️ Combat codes en attente d\'initialisation...');
}