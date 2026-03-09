// ==========================================
// WARSLIGUE — java.js  (VERSION CORRIGÉE - BUGS FIXES)
// ==========================================

/* =============================================
   FIREBASE INIT
   ============================================= */
const firebaseConfig = {
    apiKey:             "AIzaSyAigU1zwt8XzDmIZtddvxYstor-9QxDizw",
    authDomain:         "warsligue.firebaseapp.com",
    databaseURL:        "https://warsligue-default-rtdb.europe-west1.firebasedatabase.app",
    projectId:          "warsligue",
    storageBucket:      "warsligue.firebasestorage.app",
    messagingSenderId:  "66283382391",
    appId:              "1:66283382391:web:3d4d3dc5e51ff198870872",
    measurementId:      "G-84EWH821ED"
};
firebase.initializeApp(firebaseConfig);
const AUTH = firebase.auth();
const FSDB = firebase.firestore();
const RTDB = firebase.database();

/* =============================================
   ÉTAT GLOBAL
   ============================================= */
const G = {
    user: null,
    playerData: null,
    playerDataUnsub: null,

    myQueueKey: null,
    mmChildListener: null,
    mmChildListenerRef: null,
    mmChildQuery1: null,
    mmChildQuery2: null,
    mmSearchTimer: null,
    mmCountdownId: null,
    mmSeconds: 0,

    matchId: null,
    isPlayer1: false,
    matchListenerCb: null,
    matchListenerRef: null,

    rafId: null,
    timerIntervalId: null,

    selectedChar: 'warrior',

    keys: {},
    keydownFn: null,
    keyupFn: null,

    canvas: null,
    ctx: null,
    resizeFn: null,

    player: null,
    opponent: null,
    gameTime: 180,
    matchEnded: false,

    particles: [],
    projectiles: [],
    opponentProjectileIds: new Set(), // ✅ NOUVEAU : Set pour tracker les IDs des projectiles adverses
    walls: [], // ✅ NOUVEAU : Système de murs
    
    gameMode: null, // ✅ NOUVEAU : 'multiplayer' ou 'zombie'
    zombies: [], // ✅ NOUVEAU : Liste des zombies
    zombieSpawnTimer: 0,
    zombieWaveCount: 0,
    zombieSurvivalStart: 0,

    lastAtkTime: 0,
    lastSpeTime: 0,
    cdAtkInterval: null,
    cdSpeInterval: null,

    lastPosSend: 0,
    mobileInstalled: false,

    aimAngle: 0,
    aimDistance: 0,
    isAiming: false,
    aimStartX: 0,
    aimStartY: 0,
    mouseX: 0,
    mouseY: 0,
    touchAimId: null
};

/* =============================================
   UTILS
   ============================================= */
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._ht);
    el._ht = setTimeout(() => el.classList.remove('show'), 3200);
}

/* =============================================
   LOADING SCREEN
   ============================================= */
(function () {
    const bar  = document.getElementById('loading-bar');
    const txt  = document.getElementById('loading-text');
    const msgs = ['Initialisation...','Firebase...','Vérification session...','Prêt !'];
    let i = 0;
    const iv = setInterval(() => {
        if (i >= msgs.length) return clearInterval(iv);
        bar.style.width = ((i + 1) * 25) + '%';
        txt.textContent = msgs[i];
        i++;
    }, 450);
})();

/* =============================================
   AUTH
   ============================================= */
document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
});
document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
});

document.getElementById('register-btn').addEventListener('click', async () => {
    const username = document.getElementById('register-username').value.trim();
    const email    = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    if (!username || username.length < 2)  return showError('Pseudo : min 3 caractères');
    if (!email)                            return showError('Email requis');
    if (password.length < 6)               return showError('Mot de passe : min 6 caractères');
    try {
        const { user } = await AUTH.createUserWithEmailAndPassword(email, password);
        await FSDB.collection('players').doc(user.uid).set({
            username, email, 
            trophies: 0, 
            gold: 100, 
            wins: 0, 
            losses: 0, 
            totalMatches: 0,
            selectedCharacter: 'warrior',
            ownedCharacters: ['warrior', 'assassin', 'mage'],
            ownedSkins: [],
            powerPoints: {},
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin:  firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) {
        showError(e.code === 'auth/email-already-in-use' ? 'Email déjà utilisé' : e.message);
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email    = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) return showError('Remplissez tous les champs');
    try {
        await AUTH.signInWithEmailAndPassword(email, password);
    } catch (e) {
        showError('Email ou mot de passe incorrect');
    }
});

document.getElementById('logout-btn').addEventListener('click', () => {
    fullCleanup();
    AUTH.signOut();
});

// ==========================================
// CODE CORRIGÉ À COPIER-COLLER DANS java.js
// ==========================================

// ✅ CORRECTION 1 : AUTH.onAuthStateChanged (ligne ~89)
// Remplacer la fonction complète par celle-ci :

AUTH.onAuthStateChanged(async (user) => {
    await new Promise(r => setTimeout(r, 1800));
    if (user) {
        G.user = user;
        await ensurePlayerDoc(user);
        listenPlayerData(user.uid);
        initOnlineTracking(); // ✅ AJOUT
        showScreen('main-menu');
    } else {
        G.user = null;
        G.playerData = null;
        if (G.playerDataUnsub) { G.playerDataUnsub(); G.playerDataUnsub = null; }
        stopOnlineTracking(); // ✅ AJOUT
        showScreen('auth-screen');
    }
});

async function ensurePlayerDoc(user) {
    const doc = await FSDB.collection('players').doc(user.uid).get();
    if (!doc.exists) {
        await FSDB.collection('players').doc(user.uid).set({
            username: 'Joueur_' + user.uid.slice(0,6),
            email: user.email || '',
            trophies: 0,
            gold: 100,
            wins: 0,
            losses: 0,
            totalMatches: 0,
            selectedCharacter: 'warrior',
            ownedCharacters: ['warrior', 'assassin', 'mage'],
            ownedSkins: [],
            powerPoints: {},
            upgrades: {},
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        const data = doc.data();
        const updates = { lastLogin: firebase.firestore.FieldValue.serverTimestamp() };
        
        if (!data.ownedCharacters) {
            updates.ownedCharacters = ['warrior', 'assassin', 'mage'];
            updates.ownedSkins = [];
        }
        if (data.gold === undefined) {
            updates.gold = 100;
        }
        if (!data.powerPoints) {
            updates.powerPoints = {};
        }
        if (!data.upgrades) {
            updates.upgrades = {};
        }
        
        await FSDB.collection('players').doc(user.uid).update(updates);
    }
}


/* =============================================
   PLAYER DATA — listener unique
   ============================================= */
function listenPlayerData(uid) {
    if (G.playerDataUnsub) G.playerDataUnsub();
    G.playerDataUnsub = FSDB.collection('players').doc(uid).onSnapshot(doc => {
        if (!doc.exists) return;
        G.playerData = { id: doc.id, ...doc.data() };
        if (G.playerData.selectedCharacter) {
            G.selectedChar = G.playerData.selectedCharacter;
        }
        updateMenuUI();
        renderCharacterSelector();
    });
}

function updateMenuUI() {
    if (!G.playerData) return;
    document.getElementById('player-name').textContent     = G.playerData.username;
    document.getElementById('player-trophies').textContent = G.playerData.trophies || 0;
    document.getElementById('player-gold').textContent     = G.playerData.gold || 0;
    document.getElementById('player-avatar').textContent   = G.playerData.username[0].toUpperCase();
    
    // Update power points for selected character
    const selectedChar = G.selectedChar || 'warrior';
    const charPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    const ppElement = document.getElementById('player-powerpoints');
    if (ppElement) {
        ppElement.textContent = charPowerPoints;
    }
}

/* =============================================
   CHARACTER SELECTION (BRAWL STARS STYLE)
   ============================================= */
function renderCharacterSelector() {
    const container = document.getElementById('character-selector');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!G.playerData) return;
    
    const ownedChars = G.playerData.ownedCharacters || ['warrior', 'assassin', 'mage'];
    
    updateCharacterPreview(G.selectedChar);
    
    for (const [key, char] of Object.entries(CHARACTERS)) {
        const owned = ownedChars.includes(key);
        const isSelected = G.selectedChar === key;
        
        const card = document.createElement('div');
        card.className = `brawler-card ${isSelected ? 'selected' : ''} ${!owned ? 'locked' : ''}`;
        card.dataset.char = key;
        
        card.innerHTML = `
            <div class="brawler-card-inner">
                <div class="brawler-icon" style="background: ${char.color}; box-shadow: 0 0 20px ${char.glowColor};">
                    <img src="${char.image}" alt="${char.name}" style="width: 90%; height: 90%; object-fit: contain;">
                </div>
                <div class="brawler-name">${char.name}</div>
                ${!owned ? '<div class="brawler-lock">🔒</div>' : ''}
                ${char.rarity ? `<div class="brawler-rarity rarity-${char.rarity}">${char.rarity}</div>` : ''}
            </div>
        `;
        
        if (owned) {
            card.addEventListener('click', () => selectCharacter(key));
        }
        
        container.appendChild(card);
    }
}

function updateCharacterPreview(charKey) {
    const baseChar = CHARACTERS[charKey] || CHARACTERS.warrior;
    const char = getCharacterWithUpgrades(charKey, G.playerData);
    
    const previewIcon = document.getElementById('preview-icon');
    const previewName = document.getElementById('preview-name');
    const previewHp = document.getElementById('preview-hp');
    const previewSpeed = document.getElementById('preview-speed');
    const previewDamage = document.getElementById('preview-damage');
    
    if (previewIcon) {
        previewIcon.innerHTML = `<img src="${baseChar.image}" alt="${baseChar.name}" style="width: 80%; height: 80%; object-fit: contain;">`;
        previewIcon.style.background = baseChar.color;
        previewIcon.style.boxShadow = `0 0 40px ${baseChar.glowColor}`;
    }
    
    if (previewName) previewName.textContent = baseChar.name;
    if (previewHp) previewHp.textContent = Math.round(char.hp * 10) / 10;
    if (previewSpeed) previewSpeed.textContent = Math.round(char.speed * 10) / 10;
    if (previewDamage) previewDamage.textContent = Math.round(char.attackDamage * 10) / 10;
}

function selectCharacter(key) {
    if (!CHARACTERS[key]) return;
    
    const ownedChars = G.playerData?.ownedCharacters || ['warrior', 'assassin', 'mage'];
    if (!ownedChars.includes(key)) return;
    
    G.selectedChar = key;
    updateCharacterPreview(key);
    highlightChar(key);
    
    if (G.user) {
        FSDB.collection('players').doc(G.user.uid).update({ selectedCharacter: key });
    }
    
    setTimeout(() => {
        closeCharacterPanel();
    }, 500);
}

function highlightChar(key) {
    document.querySelectorAll('.brawler-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.char === key);
    });
}

/* =============================================
   CHARACTER PANEL
   ============================================= */
document.getElementById('select-character-btn').addEventListener('click', openCharacterPanel);
document.getElementById('close-character-panel').addEventListener('click', closeCharacterPanel);
document.getElementById('character-panel-overlay').addEventListener('click', closeCharacterPanel);

function openCharacterPanel() {
    document.getElementById('character-selection-panel').classList.add('active');
}

function closeCharacterPanel() {
    document.getElementById('character-selection-panel').classList.remove('active');
}

/* =============================================
   UPGRADES PANEL & SYSTEM
   ============================================= */
console.log('🔍 Initialisation des event listeners des améliorations...');

const upgradesBtn = document.getElementById('upgrades-btn');
console.log('🔘 Bouton upgrades trouvé:', upgradesBtn ? '✅ Oui' : '❌ Non');
if (upgradesBtn) {
    upgradesBtn.addEventListener('click', () => {
        console.log('🎯 Clic sur le bouton améliorations détecté');
        openUpgradesPanel();
    });
    console.log('✅ Event listener attaché au bouton upgrades');
}

const closeUpgradesBtn = document.getElementById('close-upgrades-panel');
console.log('🔘 Bouton fermer upgrades trouvé:', closeUpgradesBtn ? '✅ Oui' : '❌ Non');
if (closeUpgradesBtn) {
    closeUpgradesBtn.addEventListener('click', closeUpgradesPanel);
    console.log('✅ Event listener attaché au bouton fermer upgrades');
}

const upgradesPanelOverlay = document.getElementById('upgrades-panel-overlay');
console.log('🔘 Overlay upgrades trouvé:', upgradesPanelOverlay ? '✅ Oui' : '❌ Non');
if (upgradesPanelOverlay) {
    upgradesPanelOverlay.addEventListener('click', closeUpgradesPanel);
    console.log('✅ Event listener attaché à l\'overlay upgrades');
}

function openUpgradesPanel() {
    console.log('🔧 Ouverture du panel d\'améliorations');
    try {
        // Vérifier que les données nécessaires existent
        if (!CHARACTERS) {
            console.error('❌ CHARACTERS n\'est pas défini');
            return;
        }
        
        const selectedChar = G.selectedChar || 'warrior';
        console.log('📊 Personnage sélectionné:', selectedChar);
        
        const charPowerPoints = (G.playerData && G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
        const charUpgrades = (G.playerData && G.playerData.upgrades && G.playerData.upgrades[selectedChar]) || {};
        
        console.log('⚡ Points de pouvoir:', charPowerPoints);
        console.log('📈 Améliorations actuelles:', charUpgrades);
        
        // Update panel header with character name and power points
        const charNameEl = document.getElementById('upgrade-char-name');
        const powerPointsEl = document.getElementById('upgrade-powerpoints-display');
        
        if (charNameEl) {
            charNameEl.textContent = CHARACTERS[selectedChar].name;
            console.log('✅ Nom du personnage mis à jour');
        } else {
            console.warn('⚠️ Élément upgrade-char-name non trouvé');
        }
        
        if (powerPointsEl) {
            powerPointsEl.textContent = `⚡ ${charPowerPoints} points`;
            console.log('✅ Points de pouvoir affichés');
        } else {
            console.warn('⚠️ Élément upgrade-powerpoints-display non trouvé');
        }
        
        // Render upgrade levels for each stat
        console.log('🎨 Rendu des niveaux d\'amélioration...');
        renderUpgradeStatLevels('hp', selectedChar, charPowerPoints, charUpgrades);
        renderUpgradeStatLevels('speed', selectedChar, charPowerPoints, charUpgrades);
        renderUpgradeStatLevels('attackDamage', selectedChar, charPowerPoints, charUpgrades);
        
        const upgradesPanel = document.getElementById('upgrades-panel');
        if (upgradesPanel) {
            upgradesPanel.classList.add('active');
            console.log('✅ Panel d\'améliorations ouvert avec succès');
        } else {
            console.error('❌ Élément upgrades-panel non trouvé');
        }
    } catch (e) {
        console.error('❌ Erreur ouverture upgrades panel:', e);
        alert('Erreur: ' + e.message);
    }
}

function closeUpgradesPanel() {
    document.getElementById('upgrades-panel').classList.remove('active');
}

function renderUpgradeStatLevels(stat, charKey, powerPoints, charUpgrades) {
    try {
        const char = CHARACTERS[charKey];
        if (!char || !char.upgrades || !char.upgrades[stat]) {
            console.warn(`⚠️ Pas d'upgrades pour ${charKey}.${stat}`);
            return;
        }
        
        const upgrades = char.upgrades[stat] || [];
        const container = document.getElementById(`upgrade-${stat}-levels`);
        
        if (!container) {
            console.warn(`⚠️ Conteneur upgrade-${stat}-levels non trouvé`);
            return;
        }
        
        container.innerHTML = '';
        
        const currentLevel = (charUpgrades[stat] && charUpgrades[stat].level) || 0;
        
        upgrades.forEach((upgrade) => {
            const isMaxLevel = currentLevel >= upgrade.level;
            const isNextLevel = upgrade.level === currentLevel + 1;
            const canAfford = isNextLevel && powerPoints >= upgrade.cost;
            
            const card = document.createElement('div');
            card.className = `upgrade-card ${isMaxLevel ? 'maxed' : ''} ${canAfford ? 'available' : ''}`;
            card.style.cssText = `
                border: 2px solid ${isMaxLevel ? '#2ECC71' : canAfford ? '#FFD700' : '#666'};
                background: ${isMaxLevel ? 'rgba(46,204,113,0.1)' : canAfford ? 'rgba(255,215,0,0.1)' : 'rgba(100,100,100,0.1)'};
                padding: 12px;
                border-radius: 8px;
            margin-bottom: 8px;
            cursor: ${canAfford ? 'pointer' : 'not-allowed'};
            opacity: ${canAfford || isMaxLevel ? '1' : '0.6'};
        `;
        
        const baseValue = char[stat];
        const displayValue = baseValue + (upgrade.increment * upgrade.level);
        
        let statusText = '';
        if (isMaxLevel) {
            statusText = '✅ NIVEAU MAXIMAL';
        } else if (canAfford) {
            statusText = '🔓 ACHETER';
        } else if (!isNextLevel) {
            statusText = '🔒 Achetez le niveau précédent';
        } else {
            statusText = '🔒 Pas assez';
        }
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <div style="font-weight: bold; margin-bottom: 4px;">Niveau ${upgrade.level}</div>
                    <div style="font-size: 0.9em; color: #ccc;">
                        ${baseValue} → ${displayValue} (+${upgrade.increment})
                    </div>
                    <div style="font-size: 0.85em; color: #FFD700; margin-top: 4px;">⚡ Coût: ${upgrade.cost}</div>
                </div>
                <div style="text-align: right; font-size: 0.9em;">
                    ${statusText}
                </div>
            </div>
        `;
        
        if (canAfford && !isMaxLevel) {
            card.addEventListener('click', () => {
                applyUpgrade(charKey, stat, upgrade.level, upgrade.cost);
            });
            card.style.cursor = 'pointer';
            card.style.transition = 'all 0.3s ease';
            card.addEventListener('mouseover', () => {
                card.style.transform = 'translateY(-2px)';
                card.style.boxShadow = '0 4px 12px rgba(255,215,0,0.3)';
            });
            card.addEventListener('mouseout', () => {
                card.style.transform = 'translateY(0)';
                card.style.boxShadow = 'none';
            });
        }
        
        container.appendChild(card);
        });
    } catch (e) {
        console.error(`❌ Erreur rendu upgrades ${stat}:`, e);
    }
}

async function applyUpgrade(charKey, stat, level, cost) {
    if (!G.user || !G.playerData) return;
    
    const selectedChar = G.selectedChar || 'warrior';
    if (charKey !== selectedChar) {
        alert('Vous pouvez seulement améliorer le personnage sélectionné !');
        return;
    }
    
    const currentPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    
    if (currentPowerPoints < cost) {
        alert('Vous n\'avez pas assez de points de pouvoir !');
        return;
    }
    
    const currentLevel = (G.playerData.upgrades && G.playerData.upgrades[selectedChar] && G.playerData.upgrades[selectedChar][stat] && G.playerData.upgrades[selectedChar][stat].level) || 0;
    if (level !== currentLevel + 1) {
        alert('Vous devez acheter le niveau précédent avant de débloquer ce niveau.');
        return;
    }
    
    try {
        // Initialize upgrades structure if needed
        const upgrades = G.playerData.upgrades || {};
        if (!upgrades[selectedChar]) {
            upgrades[selectedChar] = {};
        }
        
        // Update upgrades and power points
        const updates = {};
        updates[`upgrades.${selectedChar}.${stat}`] = {
            level: level,
            appliedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        updates[`powerPoints.${selectedChar}`] = currentPowerPoints - cost;
        
        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        console.log(`✅ Amélioration appliquée: ${charKey} - ${stat} niveau ${level}`);
        
        // Refresh the upgrades panel
        setTimeout(() => {
            openUpgradesPanel();
        }, 300);
        
    } catch (e) {
        console.error('❌ Erreur amélioration:', e);
        alert('Erreur lors de l\'amélioration');
    }
}

/* =============================================
   CHESTS SYSTEM
   ============================================= */
document.getElementById('chests-btn').addEventListener('click', openChests);
document.getElementById('close-chests').addEventListener('click', () => showScreen('main-menu'));

async function openChests() {
    showScreen('chests-screen');
    document.getElementById('chests-gold').textContent = G.playerData ? (G.playerData.gold || 0) : 0;
    
    // Display power points for selected character in chests screen
    const selectedChar = G.selectedChar || 'warrior';
    const charPowerPoints = (G.playerData && G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    const chestsPPElement = document.getElementById('chests-powerpoints');
    if (chestsPPElement) {
        chestsPPElement.textContent = charPowerPoints;
    }
    
    renderChestsGrid();
}

function renderChestsGrid() {
    const grid = document.getElementById('chests-grid');
    grid.innerHTML = '';
    
    const playerGold = G.playerData?.gold || 0;
    
    for (const [key, chest] of Object.entries(CHEST_TYPES)) {
        const canAfford = playerGold >= chest.price;
        
        const card = document.createElement('div');
        card.className = `shop-item ${!canAfford ? 'locked' : ''}`;
        card.style.cssText = `
            border-color: ${chest.color}40;
            background: linear-gradient(135deg, ${chest.color}10, ${chest.color}05);
        `;
        
        card.innerHTML = `
            <div class="shop-item-icon" style="font-size: 4rem; filter: drop-shadow(0 0 15px ${chest.glowColor});">
                ${chest.emoji}
            </div>
            <div class="shop-item-name">${chest.name}</div>
            <div class="shop-item-desc">
                💰 ${chest.rewards.gold.min}-${chest.rewards.gold.max} pièces<br>
                ⚡ ${chest.rewards.powerPoints.min}-${chest.rewards.powerPoints.max} points<br>
                🎲 ${(chest.rewards.characterChance * 100).toFixed(0)}% personnage
            </div>
            <div class="shop-item-price">
                <span>💰</span>
                <span>${chest.price}</span>
            </div>
            <button class="shop-item-btn" data-chest="${key}" ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Acheter' : 'Pas assez de 💰'}
            </button>
        `;
        
        const btn = card.querySelector('.shop-item-btn');
        if (canAfford) {
            btn.addEventListener('click', () => {
                console.log('🎁 Clic sur coffre:', key);
                buyChest(key);
            });
        }
        
        grid.appendChild(card);
    }
}

async function buyChest(chestKey) {
    console.log('🛒 Tentative achat:', chestKey);
    
    if (!G.user || !G.playerData) {
        console.error('❌ Pas d\'utilisateur connecté');
        return;
    }
    
    const chest = CHEST_TYPES[chestKey];
    const currentGold = G.playerData.gold || 0;
    
    console.log('💰 Or actuel:', currentGold, '/ Prix:', chest.price);
    
    if (currentGold < chest.price) {
        showError('Pas assez de pièces !');
        return;
    }
    
    try {
        await FSDB.collection('players').doc(G.user.uid).update({
            gold: currentGold - chest.price
        });
        
        console.log('✅ Achat réussi, ouverture du coffre...');
        await openChestAnimation(chestKey);
        
    } catch (e) {
        console.error('❌ Achat coffre:', e);
        showError('Erreur lors de l\'achat');
    }
}

async function openChestAnimation(chestKey) {
    const chest = CHEST_TYPES[chestKey];
    const modal = document.getElementById('reward-modal');
    const opening = document.getElementById('chest-opening');
    const result = document.getElementById('reward-result');
    const chestIcon = document.getElementById('opening-chest-icon');
    
    modal.classList.add('active');
    opening.style.display = 'flex';
    result.style.display = 'none';
    
    chestIcon.textContent = chest.emoji;
    chestIcon.style.fontSize = '6rem';
    chestIcon.style.animation = 'chestShake 0.8s ease-in-out infinite';
    
    await new Promise(r => setTimeout(r, 2000));
    
    const reward = generateChestReward(chestKey, G.playerData);
    
    await applyChestReward(reward);
    
    displayChestReward(reward, chest);
}

async function applyChestReward(reward) {
    const updates = {
        gold: firebase.firestore.FieldValue.increment(reward.gold)
    };
    
    // Add power points - initialize powerPoints structure if needed
    if (!G.playerData.powerPoints) {
        G.playerData.powerPoints = {};
    }
    
    const selectedChar = G.selectedChar || 'warrior';
    const currentPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    
    // Update power points for selected character
    updates[`powerPoints.${selectedChar}`] = currentPowerPoints + reward.powerPoints;
    
    if (reward.character && reward.isNew) {
        updates.ownedCharacters = firebase.firestore.FieldValue.arrayUnion(reward.character);
    }
    
    await FSDB.collection('players').doc(G.user.uid).update(updates);
}

function displayChestReward(reward, chest) {
    const opening = document.getElementById('chest-opening');
    const result = document.getElementById('reward-result');
    const rewardItem = document.getElementById('reward-item');
    const goldDisplay = document.getElementById('reward-gold-display');
    
    opening.style.display = 'none';
    result.style.display = 'block';
    
    if (reward.character && reward.isNew) {
        const char = CHARACTERS[reward.character];
        rewardItem.style.display = 'block';
        
        document.getElementById('reward-rarity').textContent = char.rarity.toUpperCase();
        document.getElementById('reward-rarity').className = `reward-rarity-badge rarity-${char.rarity}`;
        
        document.getElementById('reward-icon').innerHTML = `<img src="${char.image}" alt="${char.name}" style="width: 80%; height: 80%; object-fit: contain;">`;
        document.getElementById('reward-icon').style.background = char.color;
        document.getElementById('reward-icon').style.boxShadow = `0 0 40px ${char.glowColor}`;
        
        document.getElementById('reward-name').textContent = char.name;
        document.getElementById('reward-status').textContent = 'NOUVEAU !';
        document.getElementById('reward-status').style.color = '#2ECC71';
    } else {
        rewardItem.style.display = 'none';
    }
    
    goldDisplay.textContent = `+${reward.gold} 💰 | +${reward.powerPoints} ⚡`;
}

document.getElementById('claim-reward-btn').addEventListener('click', () => {
    document.getElementById('reward-modal').classList.remove('active');
    renderChestsGrid();
});

document.getElementById('reward-overlay').addEventListener('click', () => {
    document.getElementById('reward-modal').classList.remove('active');
    renderChestsGrid();
});


/* =============================================
   CHARACTER STATS WITH UPGRADES
   ============================================= */
function getCharacterWithUpgrades(charKey, playerData) {
    const baseChar = CHARACTERS[charKey] || CHARACTERS.warrior;
    const charCopy = { ...baseChar };
    
    if (!playerData || !playerData.upgrades || !playerData.upgrades[charKey]) {
        return charCopy;
    }
    
    const upgrades = playerData.upgrades[charKey];
    
    // Apply HP upgrades
    if (upgrades.hp && upgrades.hp.level > 0) {
        const upgradeData = baseChar.upgrades.hp.find(u => u.level === upgrades.hp.level);
        if (upgradeData) {
            charCopy.hp = baseChar.hp + (upgradeData.increment * upgrades.hp.level);
        }
    }
    
    // Apply Speed upgrades
    if (upgrades.speed && upgrades.speed.level > 0) {
        const upgradeData = baseChar.upgrades.speed.find(u => u.level === upgrades.speed.level);
        if (upgradeData) {
            charCopy.speed = baseChar.speed + (upgradeData.increment * upgrades.speed.level);
        }
    }
    
    // Apply Attack Damage upgrades
    if (upgrades.attackDamage && upgrades.attackDamage.level > 0) {
        const upgradeData = baseChar.upgrades.attackDamage.find(u => u.level === upgrades.attackDamage.level);
        if (upgradeData) {
            charCopy.attackDamage = baseChar.attackDamage + (upgradeData.increment * upgrades.attackDamage.level);
        }
    }
    
    return charCopy;
}

/* =============================================
   MODE SELECTION
   ============================================= */
document.getElementById('play-btn').addEventListener('click', showModeSelection);
document.getElementById('cancel-mode-selection').addEventListener('click', () => showScreen('main-menu'));

function showModeSelection() {
    showScreen('mode-selection-screen');
}

document.getElementById('mode-multiplayer').addEventListener('click', () => {
    G.gameMode = 'multiplayer';
    startMatchmaking();
});

document.getElementById('mode-zombie').addEventListener('click', () => {
    G.gameMode = 'zombie';
    startZombieMode();
});

/* =============================================
   MATCHMAKING
   ============================================= */
document.getElementById('cancel-matchmaking').addEventListener('click', cancelMatchmaking);

async function startMatchmaking() {
    if (!G.playerData) return;
    showScreen('matchmaking-screen');
    document.getElementById('mm-trophies').textContent = G.playerData.trophies || 0;

    G.mmSeconds = 0;
    document.getElementById('mm-timer').textContent = '0s';
    G.mmCountdownId = setInterval(() => {
        G.mmSeconds++;
        document.getElementById('mm-timer').textContent = G.mmSeconds + 's';
    }, 1000);

    try {
        const ref = RTDB.ref('matchmaking_queue').push();
        G.myQueueKey = ref.key;
        await ref.set({
            uid: G.user.uid,
            username: G.playerData.username,
            trophies: G.playerData.trophies || 0,
            character: G.selectedChar,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        ref.onDisconnect().remove();

        console.log('🔍 Recherche adversaire... (Trophées:', G.playerData.trophies || 0, ')');

        // Listen for matches involving this user (player1 OR player2).
        G.mmChildListenerRef = RTDB.ref('active_matches');
        G.mmChildQuery1 = G.mmChildListenerRef.orderByChild('player1Uid').equalTo(G.user.uid);
        G.mmChildQuery2 = G.mmChildListenerRef.orderByChild('player2Uid').equalTo(G.user.uid);

        G.mmChildListener = (snap) => {
            const m = snap.val();
            if (!m) return;
            console.log('📢 Match détecté:', snap.key);
            stopMatchmaking();
            enterMatch(snap.key, m);
        };

        G.mmChildQuery1.on('child_added', G.mmChildListener);
        G.mmChildQuery1.on('child_changed', G.mmChildListener);
        G.mmChildQuery2.on('child_added', G.mmChildListener);
        G.mmChildQuery2.on('child_changed', G.mmChildListener);

        scheduleSearch();
    } catch (e) {
        console.error('❌ MM:', e);
        stopMatchmaking();
        showScreen('main-menu');
    }
}

function scheduleSearch() {
    if (!G.myQueueKey) return;
    G.mmSearchTimer = setTimeout(async () => {
        if (!G.myQueueKey) return;
        await tryPairMatch();
        scheduleSearch();
    }, 2000);
}

async function tryPairMatch() {
    if (!G.myQueueKey) return;
    
    try {
        const queueSnap = await RTDB.ref('matchmaking_queue').once('value');
        const queue = queueSnap.val();
        
        if (!queue || !queue[G.myQueueKey]) {
            console.log('⚠️ Plus dans la queue');
            return;
        }

        const myTrophies = G.playerData.trophies || 0;
        const maxDiff = 250 + Math.floor(G.mmSeconds / 5) * 250; // élargir le matchmaking au fil du temps
        
        let bestOpponent = null;
        let bestKey = null;
        let bestDiff = Infinity;
        
        for (const [key, player] of Object.entries(queue)) {
            if (key === G.myQueueKey) continue;
            if (!player || !player.uid) continue;
            
            const diff = Math.abs((player.trophies || 0) - myTrophies);
            if (diff <= maxDiff && diff < bestDiff) {
                bestDiff = diff;
                bestOpponent = player;
                bestKey = key;
            }
        }
        
        if (!bestOpponent || !bestKey) {
            console.log('🔍 Pas d\'adversaire (Δ trophées > 250)');
            return;
        }
        
        console.log('🎯 Adversaire trouvé:', bestOpponent.username, '| Δ', bestDiff, 'trophées');

        // Pour éviter que deux clients créent simultanément deux matches différents
        // pour les mêmes joueurs, on se base sur l'UID : seul le joueur avec l'UID
        // le plus petit crée réellement le match (l'autre attend de le détecter).
        if (G.user.uid > bestOpponent.uid) {
            console.log('⏳ Lâcher la création (attente de match créé par l\'autre joueur)');
            return;
        }

        // Réserver l'entrée de l'adversaire en marquant `matched: true` via une transaction.
        const opponentRef = RTDB.ref(`matchmaking_queue/${bestKey}`);
        const tx = await opponentRef.transaction((current) => {
            if (!current || current.matched) return; // déjà pris
            return { ...current, matched: true };
        });

        if (!tx.committed || !tx.snapshot.val()) {
            console.log('⚠️ La partie a déjà été prise par un autre joueur, on re-tente.');
            return;
        }

        const matchKey = RTDB.ref('active_matches').push().key;
        const myCharKey = G.selectedChar;
        const oppCharKey = bestOpponent.character || 'warrior';
        const myChar = CHARACTERS[myCharKey] || CHARACTERS.warrior;
        const oppChar = CHARACTERS[oppCharKey] || CHARACTERS.warrior;
        
        const updates = {};
        updates[`matchmaking_queue/${G.myQueueKey}`] = null;
        updates[`matchmaking_queue/${bestKey}`] = null;
        updates[`active_matches/${matchKey}`] = {
            player1Uid: G.user.uid,
            player2Uid: bestOpponent.uid,
            player1Username: G.playerData.username,
            player2Username: bestOpponent.username,
            player1Char: myCharKey,
            player2Char: oppCharKey,
            status: 'active',
            timeLeft: 180,
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            gameState: {
                player1: { x: 80, y: 400, hp: myChar.hp },
                player2: { x: 720, y: 400, hp: oppChar.hp }
            }
        };
        
        await RTDB.ref().update(updates);
        console.log('✅ Match créé:', matchKey);
        
    } catch (e) {
        console.error('❌ tryPairMatch:', e);
    }
}

function stopMatchmaking() {
    clearTimeout(G.mmSearchTimer);   G.mmSearchTimer  = null;
    clearInterval(G.mmCountdownId);  G.mmCountdownId  = null;
    if (G.mmChildQuery1 && G.mmChildListener) {
        G.mmChildQuery1.off('child_added', G.mmChildListener);
        G.mmChildQuery1.off('child_changed', G.mmChildListener);
    }
    if (G.mmChildQuery2 && G.mmChildListener) {
        G.mmChildQuery2.off('child_added', G.mmChildListener);
        G.mmChildQuery2.off('child_changed', G.mmChildListener);
    }
    if (G.mmChildListener) {
        console.log('🔌 Listener MM détaché');
    }

    G.mmChildListener    = null;
    G.mmChildListenerRef = null;
    G.mmChildQuery1      = null;
    G.mmChildQuery2      = null;
    G.myQueueKey         = null;
}

async function cancelMatchmaking() {
    const key = G.myQueueKey;
    stopMatchmaking();
    if (key) {
        try {
            await RTDB.ref('matchmaking_queue/' + key).remove();
            console.log('❌ Annulation MM');
        } catch (e) {
            console.error('Erreur annulation:', e);
        }
    }
    showScreen('main-menu');
}

/* =============================================
   ZOMBIE MODE
   ============================================= */
async function startZombieMode() {
    if (!G.playerData) return;
    showScreen('game-screen');
    
    // Initialiser le mode zombie
    G.matchEnded = false;
    G.gameTime = 0; // Compteur de temps survécu
    G.zombies = [];
    G.projectiles = [];
    G.particles = [];
    G.zombieWaveCount = 0;
    G.zombieSpawnTimer = 0;
    G.zombieSurvivalStart = Date.now();
    
    // Setup du joueur
    document.getElementById('player-game-name').textContent = '🧟 MONDE ZOMBIE';
    document.getElementById('opponent-game-name').textContent = 'Survivez !';
    
    // Créer une pseudo-partie pour le contexte du jeu
    G.matchId = 'zombie_' + Date.now();
    G.opponent = null;
    
    initGame(null);
    
    console.log('🧟 Mode Zombie démarré !');
}

/* =============================================
   ENTRER DANS LE MATCH   ============================================= */
function enterMatch(matchId, matchData) {
    console.log('🎮 Match:', matchId);
    G.matchId    = matchId;
    G.isPlayer1  = (matchData.player1Uid === G.user.uid);
    G.matchEnded = false;

    document.getElementById('player-game-name').textContent   = G.isPlayer1 ? matchData.player1Username : matchData.player2Username;
    document.getElementById('opponent-game-name').textContent = G.isPlayer1 ? matchData.player2Username : matchData.player1Username;

    showScreen('game-screen');
    initGame(matchData);

    RTDB.ref(`active_matches/${matchId}`).onDisconnect().remove();

    if (G.isPlayer1) startServerTimer();
}

/* =============================================
   INIT GAME
   ============================================= */
function initGame(matchData) {
    G.canvas = document.getElementById('game-canvas');
    G.ctx    = G.canvas.getContext('2d');
    resizeCanvas();

    if (G.resizeFn) window.removeEventListener('resize', G.resizeFn);
    G.resizeFn = resizeCanvas;
    window.addEventListener('resize', G.resizeFn);

    // En mode zombie, on n'a pas d'opponent
    if (G.gameMode === 'zombie') {
        const myKey = G.selectedChar || 'warrior';
        const myC = getCharacterWithUpgrades(myKey, G.playerData);

        G.player = {
            x: G.canvas.width / 2,
            y: G.canvas.height / 2,
            hp: myC.hp, maxHp: myC.hp,
            radius: myC.radius, color: myC.color, glowColor: myC.glowColor,
            speed: myC.speed,
            atkDmg: myC.attackDamage, atkRange: myC.attackRange, atkCd: myC.attackCooldown,
            speDmg: myC.specialDamage, speRange: myC.specialRange, speCd: myC.specialCooldown,
            emoji: myC.emoji,
            image: myC.image
        };

        // Charger image du joueur
        if (myC.image) {
            G.player.img = new Image();
            G.player.img.src = myC.image;
        }
    } else {
        // Mode multijoueur normal
        const myKey  = G.isPlayer1 ? matchData.player1Char : matchData.player2Char;
        const oppKey = G.isPlayer1 ? matchData.player2Char : matchData.player1Char;
        const myC    = getCharacterWithUpgrades(myKey, G.playerData);
        const oppC   = CHARACTERS[oppKey] || CHARACTERS.warrior;

        G.player = {
            x: G.isPlayer1 ? 80 : G.canvas.width - 80,
            y: G.canvas.height / 2,
            hp: myC.hp, maxHp: myC.hp,
            radius: myC.radius, color: myC.color, glowColor: myC.glowColor,
            speed: myC.speed,
            atkDmg: myC.attackDamage, atkRange: myC.attackRange, atkCd: myC.attackCooldown,
            speDmg: myC.specialDamage, speRange: myC.specialRange, speCd: myC.specialCooldown,
            emoji: myC.emoji,
            image: myC.image
        };

        G.opponent = {
            x: G.isPlayer1 ? G.canvas.width - 80 : 80,
            y: G.canvas.height / 2,
            targetX: G.isPlayer1 ? G.canvas.width - 80 : 80,
            targetY: G.canvas.height / 2,
            hp: oppC.hp, maxHp: oppC.hp,
            radius: oppC.radius, color: oppC.color, glowColor: oppC.glowColor,
            emoji: oppC.emoji,
            image: oppC.image
        };

        // Charger les images SVG
        if (myC.image) {
            G.player.img = new Image();
            G.player.img.src = myC.image;
        }
        if (oppC.image) {
            G.opponent.img = new Image();
            G.opponent.img.src = oppC.image;
        }
    }

    G.gameTime    = 180;
    G.matchEnded  = false;
    G.particles   = [];
    G.projectiles = [];
    G.opponentProjectileIds = new Set(); // ✅ RESET du Set
    initializeWalls(); // Les murs sont désactivés mais on garde l'appel
    G.lastAtkTime = 0;
    G.lastSpeTime = 0;
    G.lastPosSend = 0;

    G.isAiming = false;
    G.aimAngle = 0;
    G.aimDistance = 0;

    RTDB.ref(`active_matches/${G.matchId}/gameState/${G.isPlayer1 ? 'player1' : 'player2'}`).update({
        y: Math.round(G.canvas.height / 2)
    });

    if (G.matchListenerRef && G.matchListenerCb) {
        G.matchListenerRef.off('value', G.matchListenerCb);
    }
    G.matchListenerCb  = onMatchSnapshot;
    G.matchListenerRef = RTDB.ref(`active_matches/${G.matchId}`);
    G.matchListenerRef.on('value', G.matchListenerCb);

    installKeyboard();
    installMobile();
    installAimControls();

    if (G.rafId) cancelAnimationFrame(G.rafId);
    G.rafId = requestAnimationFrame(gameLoop);

    startCooldownUI();
    updateTimerUI();
    updateHpBars();
    console.log('🎯 Game init. P1:', G.isPlayer1);
}

function resizeCanvas() {
    if (!G.canvas) return;
    G.canvas.width  = window.innerWidth;
    G.canvas.height = window.innerHeight;
}

/* =============================================
   SYSTÈME DE MURS (DÉSACTIVÉ)
   ============================================= */
function initializeWalls() {
    G.walls = []; // Les murs sont désactivés pour laisser la place au mode zombie
}

function checkProjectileWallCollision(proj) {
    const projRadius = proj.size || 6;
    
    for (const wall of G.walls) {
        const closestX = Math.max(wall.x, Math.min(proj.x, wall.x + wall.w));
        const closestY = Math.max(wall.y, Math.min(proj.y, wall.y + wall.h));
        
        const distX = proj.x - closestX;
        const distY = proj.y - closestY;
        const distSquared = (distX * distX) + (distY * distY);
        
        if (distSquared < (projRadius * projRadius)) {
            return true; // Collision détectée
        }
    }
    
    return false; // Pas de collision
}

// ✅ NOUVEAU : Collision player avec les murs
function checkPlayerWallCollision(playerX, playerY) {
    const playerRadius = G.player.radius || 20;
    
    for (const wall of G.walls) {
        const closestX = Math.max(wall.x, Math.min(playerX, wall.x + wall.w));
        const closestY = Math.max(wall.y, Math.min(playerY, wall.y + wall.h));
        
        const distX = playerX - closestX;
        const distY = playerY - closestY;
        const distSquared = (distX * distX) + (distY * distY);
        
        if (distSquared < (playerRadius * playerRadius)) {
            return true; // Collision avec un mur
        }
    }
    
    return false; // Pas de collision
}

/* =============================================
   ZOMBIE MODE FUNCTIONS
   ============================================= */
function updateZombieMode() {
    // Compteur de survie
    G.gameTime = Math.floor((Date.now() - G.zombieSurvivalStart) / 1000);
    
    // Spawn de zombies par vagues
    G.zombieSpawnTimer++;
    const spawnInterval = Math.max(60, 180 - G.zombieWaveCount * 8); // Plus lent, spawn moins fréquent
    
    if (G.zombieSpawnTimer >= spawnInterval) {
        G.zombieSpawnTimer = 0;
        G.zombieWaveCount++;
        // Spawner 1-2 zombies MAX selon la vague (réduit drastiquement)
        const zombieCount = Math.min(1 + Math.floor(G.zombieWaveCount / 4), 2);
        for (let i = 0; i < zombieCount; i++) {
            spawnZombie();
        }
    }
    
    // Mouvement et comportement des zombies
    for (let i = G.zombies.length - 1; i >= 0; i--) {
        const zombie = G.zombies[i];
        
        // Bouger vers le joueur
        const dx = G.player.x - zombie.x;
        const dy = G.player.y - zombie.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            zombie.x += (dx / dist) * zombie.speed;
            zombie.y += (dy / dist) * zombie.speed;
        }
        
        // Vérifier collision avec le joueur
        if (dist < G.player.radius + zombie.radius) {
            // Le joueur prend des dégâts
            G.player.hp -= (zombie.damage * 0.016); // Par frame
            
            // Si le joueur est mort
            if (G.player.hp <= 0) {
                endZombieMode();
                return;
            }
        }
    }
    
    // Mettre à jour l'interface
    updateHpBars();
    updateTimerUI();
}

function spawnZombie() {
    // Spawn à un endroit aléatoire sur les bords
    let x, y;
    const side = Math.random();
    
    if (side < 0.25) { // Top
        x = Math.random() * G.canvas.width;
        y = -30;
    } else if (side < 0.5) { // Right
        x = G.canvas.width + 30;
        y = Math.random() * G.canvas.height;
    } else if (side < 0.75) { // Bottom
        x = Math.random() * G.canvas.width;
        y = G.canvas.height + 30;
    } else { // Left
        x = -30;
        y = Math.random() * G.canvas.height;
    }
    
    const zombie = {
        x: x,
        y: y,
        radius: 18,
        speed: 2 + (G.zombieWaveCount * 0.15),  // Augmente avec les vagues
        hp: 15 + (G.zombieWaveCount * 2),
        damage: 5 + (G.zombieWaveCount * 0.5),
        color: '#00aa00'
    };
    
    G.zombies.push(zombie);
}

function endZombieMode() {
    G.matchEnded = true;
    const survivalTime = G.gameTime;
    const goldReward = Math.floor(survivalTime * 2); // 2 pièces par seconde
    const trophyReward = Math.floor(survivalTime / 10); // 1 trophée tous les 10 secondes
    
    saveZombieResults(survivalTime, goldReward, trophyReward);
    
    // Afficher les résultats
    setTimeout(() => {
        showZombieResults(survivalTime, goldReward, trophyReward);
    }, 500);
}

async function saveZombieResults(survivalTime, gold, trophy) {
    if (!G.user || !G.playerData) return;
    
    try {
        const updates = {};
        updates.gold = (G.playerData.gold || 0) + gold;
        updates.trophies = (G.playerData.trophies || 0) + trophy;

        const currentBest = (G.playerData.bestZombieTime || 0);
        if (survivalTime > currentBest) {
            updates.bestZombieTime = survivalTime;
            G.playerData.bestZombieTime = survivalTime;
        }

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        
        // Sauvegarder dans un log des parties
        await FSDB.collection('players').doc(G.user.uid).collection('zombie_sessions').add({
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            survivalTime: survivalTime,
            goldEarned: gold,
            trophyEarned: trophy
        });
        
        console.log('🧟 Resultats sauvegardés:', { survivalTime, gold, trophy });
    } catch (e) {
        console.error('Erreur sauvegarde resultats:', e);
    }
}

function showZombieResults(survivalTime, gold, trophy) {
    // Utiliser le result-screen existant avec les IDs appropriés
    const resultTitle = document.getElementById('result-title');
    const resultStats = document.querySelector('#result-screen .result-stats');
    
    if (resultTitle) {
        resultTitle.textContent = `🧟 SURVIVANT! (${survivalTime}s)`;
    }
    
    if (resultStats) {
        resultStats.innerHTML = `
            <div class="stat-row">
                <span class="stat-label">Temps de survie</span>
                <span class="stat-value">${survivalTime}s</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Pièces gagnées</span>
                <span class="stat-value gold-change">+${gold} 💰</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">Trophées gagnés</span>
                <span class="stat-value trophy-change">+${trophy} 🏆</span>
            </div>
        `;
    }
    
    showScreen('result-screen');
}


/* =============================================
   SYSTÈME DE VISÉE (CORRIGÉ - PROPORTIONNEL À LA PORTÉE)
   ============================================= */
function installAimControls() {
    G.canvas.addEventListener('mousemove', (e) => {
        if (!G.player) return;
        const rect = G.canvas.getBoundingClientRect();
        G.mouseX = e.clientX - rect.left;
        G.mouseY = e.clientY - rect.top;
        
        const dx = G.mouseX - G.player.x;
        const dy = G.mouseY - G.player.y;
        G.aimAngle = Math.atan2(dy, dx);
        
        // ✅ CORRECTION : Limiter la distance au max de la portée d'attaque
        const maxRange = Math.max(G.player.atkRange, G.player.speRange);
        const rawDist = Math.sqrt(dx*dx + dy*dy);
        G.aimDistance = Math.min(rawDist, maxRange);
    });

    G.canvas.addEventListener('touchmove', (e) => {
        if (!G.player) return;
        e.preventDefault();
        const rect = G.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        G.mouseX = touch.clientX - rect.left;
        G.mouseY = touch.clientY - rect.top;
        
        const dx = G.mouseX - G.player.x;
        const dy = G.mouseY - G.player.y;
        G.aimAngle = Math.atan2(dy, dx);
        
        // ✅ CORRECTION : Limiter la distance au max de la portée d'attaque
        const maxRange = Math.max(G.player.atkRange, G.player.speRange);
        const rawDist = Math.sqrt(dx*dx + dy*dy);
        G.aimDistance = Math.min(rawDist, maxRange);
    }, { passive: false });
}

/* =============================================
   FIREBASE SNAPSHOT (CORRIGÉ - PROJECTILES SANS DOUBLONS)
   ============================================= */
function onMatchSnapshot(snap) {
    // En mode zombie, on n'a pas besoin de syncer avec Firebase
    if (G.gameMode === 'zombie') return;
    
    const data = snap.val();
    if (!data) return;
    if (data.status === 'finished' && !G.matchEnded) { handleMatchEnd(); return; }

    const gs = data.gameState;
    if (!gs) return;

    const oppK = G.isPlayer1 ? 'player2' : 'player1';
    const myK  = G.isPlayer1 ? 'player1' : 'player2';

    if (gs[oppK]) {
        G.opponent.targetX = gs[oppK].x || G.opponent.targetX;
        G.opponent.targetY = gs[oppK].y || G.opponent.targetY;
        G.opponent.hp      = gs[oppK].hp !== undefined ? gs[oppK].hp : G.opponent.hp;
    }
    if (gs[myK]) {
        G.player.hp = gs[myK].hp !== undefined ? gs[myK].hp : G.player.hp;
    }
    if (data.timeLeft !== undefined) {
        G.gameTime = data.timeLeft;
        updateTimerUI();
    }

    // ✅ CORRECTION : Synchroniser projectiles adverses SANS DOUBLONS
    if (gs[oppK] && gs[oppK].projectiles) {
        syncOpponentProjectiles(gs[oppK].projectiles);
    } else {
        // ✅ Si l'adversaire n'a plus de projectiles, on nettoie les anciens
        G.projectiles = G.projectiles.filter(p => p.isMine);
        G.opponentProjectileIds.clear();
    }

    updateHpBars();

    if ((G.player.hp <= 0 || G.opponent.hp <= 0) && !G.matchEnded) handleMatchEnd();
}

// ✅ CORRECTION COMPLÈTE : Fonction qui RECONSTRUIT proprement la liste des projectiles adverses SANS DOUBLONS
function syncOpponentProjectiles(oppProjs) {
    // Garder SEULEMENT les projectiles du joueur actuel
    const myProjs = G.projectiles.filter(p => p.isMine);
    
    if (!oppProjs || oppProjs.length === 0) {
        // Pas de projectiles adverses, on reset la liste
        G.projectiles = myProjs;
        G.opponentProjectileIds.clear();
        return;
    }
    
    // Reconstruire les projectiles adverses depuis Firebase - ZÉRO DOUBLON
    const syncedOpponentProjs = oppProjs.map(proj => ({
        id: proj.id,
        x: proj.x,
        y: proj.y,
        vx: proj.vx,
        vy: proj.vy,
        damage: proj.damage,
        type: proj.type,
        color: proj.color,
        size: proj.size,
        life: proj.life,
        isMine: false,
        isOpponent: true
    }));
    
    // Remplacer complètement la liste: nos projectiles + projectiles adverses synced
    G.projectiles = [...myProjs, ...syncedOpponentProjs];
    
    // Mettre à jour le Set des IDs
    G.opponentProjectileIds.clear();
    for (const proj of syncedOpponentProjs) {
        G.opponentProjectileIds.add(proj.id);
    }
}

/* =============================================
   SERVER TIMER
   ============================================= */
function startServerTimer() {
    if (G.timerIntervalId) return;
    G.timerIntervalId = setInterval(() => {
        if (G.matchEnded || !G.matchId) {
            clearInterval(G.timerIntervalId); G.timerIntervalId = null; return;
        }
        RTDB.ref(`active_matches/${G.matchId}/timeLeft`).transaction(val => {
            if (val === null) return null;
            const next = val - 1;
            if (next <= 0) {
                setTimeout(() => {
                    if (!G.matchEnded) RTDB.ref(`active_matches/${G.matchId}/status`).set('finished');
                }, 50);
                return 0;
            }
            return next;
        });
    }, 1000);
}

/* =============================================
   TIMER + HP UI
   ============================================= */
function updateTimerUI() {
    const m = Math.floor(G.gameTime / 60);
    const s = G.gameTime % 60;
    const el = document.getElementById('game-timer');
    el.textContent = m + ':' + String(s).padStart(2, '0');
    el.classList.toggle('warning', G.gameTime <= 20);
}

function updateHpBars() {
    setBar('player-hp', 'player-hp-text', G.player.hp, G.player.maxHp);
    if (G.opponent) {
        setBar('opponent-hp', 'opponent-hp-text', G.opponent.hp, G.opponent.maxHp);
    }
}

function setBar(fillId, txtId, hp, maxHp) {
    const pct  = Math.max(0, Math.min(100, (hp / maxHp) * 100));
    const fill = document.getElementById(fillId);
    fill.style.width = pct + '%';
    fill.classList.remove('warn', 'danger');
    if (pct <= 25)      fill.classList.add('danger');
    else if (pct <= 50) fill.classList.add('warn');
    const txt = document.getElementById(txtId);
    if (txt) txt.textContent = Math.max(0, Math.ceil(hp));
}

/* =============================================
   KEYBOARD
   ============================================= */
function installKeyboard() {
    if (G.keydownFn) return;
    G.keydownFn = (e) => {
        const k = e.key.toLowerCase();
        G.keys[k] = true;
        if (k === 'a') doAttack('normal');
        if (k === 'e') doAttack('special');
    };
    G.keyupFn = (e) => { G.keys[e.key.toLowerCase()] = false; };
    document.addEventListener('keydown', G.keydownFn);
    document.addEventListener('keyup',   G.keyupFn);
}

function removeKeyboard() {
    if (!G.keydownFn) return;
    document.removeEventListener('keydown', G.keydownFn);
    document.removeEventListener('keyup',   G.keyupFn);
    G.keydownFn = null;
    G.keyupFn   = null;
    G.keys      = {};
}

/* =============================================
   MOBILE CONTROLS
   ============================================= */
function installMobile() {
    if (G.mobileInstalled) return;
    G.mobileInstalled = true;

    const isMobile = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    const ctrl = document.querySelector('.mobile-controls');
    if (!isMobile) return;
    ctrl.classList.add('visible');

    const zone = document.getElementById('joystick-zone');
    const knob = document.getElementById('joystick-knob');
    let cx = 0, cy = 0, dragging = false;

    const jStart = (e) => {
        dragging = true;
        const r = zone.getBoundingClientRect();
        cx = r.left + r.width / 2;
        cy = r.top  + r.height / 2;
        jMove(e);
    };
    const jMove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        const t = e.touches[0];
        let dx = t.clientX - cx, dy = t.clientY - cy;
        const maxR = zone.offsetWidth / 2 - 10;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d > maxR) { dx *= maxR/d; dy *= maxR/d; }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        G.keys['z'] = dy < -12;
        G.keys['s'] = dy >  12;
        G.keys['q'] = dx < -12;
        G.keys['d'] = dx >  12;
    };
    const jEnd = () => {
        dragging = false;
        knob.style.transform = 'translate(-50%,-50%)';
        G.keys['z'] = G.keys['s'] = G.keys['q'] = G.keys['d'] = false;
    };

    zone.addEventListener('touchstart',  jStart,  { passive: false });
    zone.addEventListener('touchmove',   jMove,   { passive: false });
    zone.addEventListener('touchend',    jEnd);
    zone.addEventListener('touchcancel', jEnd);

    document.getElementById('btn-atk').addEventListener('touchstart', (e) => { e.preventDefault(); doAttack('normal');  });
    document.getElementById('btn-spe').addEventListener('touchstart', (e) => { e.preventDefault(); doAttack('special'); });
}

/* =============================================
   COOLDOWN UI
   ============================================= */
function startCooldownUI() {
    stopCooldownUI();
    G.cdAtkInterval = setInterval(() => {
        if (!G.player) return;
        const pct = Math.min(100, ((Date.now() - G.lastAtkTime) / G.player.atkCd) * 100);
        document.getElementById('cd-attack-fill').style.width = pct + '%';
        document.getElementById('btn-atk').classList.toggle('cooldown', pct < 98);
    }, 80);
    G.cdSpeInterval = setInterval(() => {
        if (!G.player) return;
        const pct = Math.min(100, ((Date.now() - G.lastSpeTime) / G.player.speCd) * 100);
        document.getElementById('cd-special-fill').style.width = pct + '%';
        document.getElementById('btn-spe').classList.toggle('cooldown', pct < 98);
    }, 80);
}
function stopCooldownUI() {
    clearInterval(G.cdAtkInterval); G.cdAtkInterval = null;
    clearInterval(G.cdSpeInterval); G.cdSpeInterval = null;
}

/* =============================================
   GAME LOOP
   ============================================= */
function gameLoop() {
    if (G.matchEnded) return;
    update();
    render();
    G.rafId = requestAnimationFrame(gameLoop);
}

/* =============================================
   UPDATE
   ============================================= */
function update() {
    if (!G.player || !G.canvas) return;
    const spd = G.player.speed;
    let vx = 0, vy = 0;
    if (G.keys['z']) vy -= spd;
    if (G.keys['s']) vy += spd;
    if (G.keys['q']) vx -= spd;
    if (G.keys['d']) vx += spd;
    if (vx !== 0 && vy !== 0) { vx *= 0.7071; vy *= 0.7071; }

    // Appliquer le mouvement
    let newX = G.player.x + vx;
    let newY = G.player.y + vy;
    
    // Contraintes limites du canvas
    newX = Math.max(G.player.radius, Math.min(G.canvas.width  - G.player.radius, newX));
    newY = Math.max(G.player.radius, Math.min(G.canvas.height - G.player.radius, newY));
    
    // Collision avec murs désactivée - mode zombie/multijoueur sans obstacles
    G.player.x = newX;
    G.player.y = newY;

    if (vx !== 0 || vy !== 0) {
        const now = Date.now();
        if (now - G.lastPosSend >= 50) {
            G.lastPosSend = now;
            if (G.opponent) { // Seulement en multijoueur
                RTDB.ref(`active_matches/${G.matchId}/gameState/${G.isPlayer1 ? 'player1' : 'player2'}`).update({
                    x: Math.round(G.player.x),
                    y: Math.round(G.player.y)
                });
            }
        }
    }

    if (G.opponent) {
        G.opponent.x += (G.opponent.targetX - G.opponent.x) * 0.2;
        G.opponent.y += (G.opponent.targetY - G.opponent.y) * 0.2;
    }
    
    // ✅ NOUVEAU : Gestion des zombies en mode zombie
    if (G.gameMode === 'zombie') {
        updateZombieMode();
    }

    for (let i = G.projectiles.length - 1; i >= 0; i--) {
        const proj = G.projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;

        if (proj.x < 0 || proj.x > G.canvas.width || proj.y < 0 || proj.y > G.canvas.height) {
            if (!proj.isMine) G.opponentProjectileIds.delete(proj.id);
            G.projectiles.splice(i, 1);
            continue;
        }

        if (proj.life <= 0) {
            if (!proj.isMine) G.opponentProjectileIds.delete(proj.id);
            G.projectiles.splice(i, 1);
            continue;
        }

        // ✅ Détection de collision avec les murs (DÉSACTIVÉ)
        // if (checkProjectileWallCollision(proj)) {
        //     spawnHitParticles(proj.x, proj.y, proj.type);
        //     if (!proj.isMine) G.opponentProjectileIds.delete(proj.id);
        //     G.projectiles.splice(i, 1);
        //     continue;
        // }

        if (proj.isMine) {
            if (G.gameMode === 'zombie') {
                // Collision avec les zombies
                for (let z = 0; z < G.zombies.length; z++) {
                    const zombie = G.zombies[z];
                    const dx = zombie.x - proj.x;
                    const dy = zombie.y - proj.y;
                    const dist = Math.sqrt(dx*dx + dy*dy);
                    
                    if (dist < zombie.radius + 5) {
                        zombie.hp -= proj.damage;
                        spawnHitParticles(proj.x, proj.y, proj.type);
                        flashHit(proj.type);
                        G.projectiles.splice(i, 1);
                        
                        if (zombie.hp <= 0) {
                            G.zombies.splice(z, 1);
                        }
                        return; // Sortir de la boucle des projectiles
                    }
                }
            } else if (G.opponent) {
                // Collision avec l'opponent (multijoueur)
                const dx = G.opponent.x - proj.x;
                const dy = G.opponent.y - proj.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                
                if (dist < G.opponent.radius + 5) {
                    console.log('💥 PROJECTILE HIT!', proj.damage + 'dmg');
                    spawnHitParticles(proj.x, proj.y, proj.type);
                    flashHit(proj.type);
                    
                    const oppK = G.isPlayer1 ? 'player2' : 'player1';
                    RTDB.ref(`active_matches/${G.matchId}/gameState/${oppK}/hp`).transaction(cur => {
                        if (cur === null) return 0;
                        return Math.max(0, cur - proj.damage);
                    });
                    
                    G.projectiles.splice(i, 1);
                    continue;
                }
            }
        }
    }

    for (let i = G.particles.length - 1; i >= 0; i--) {
        const p = G.particles[i];
        p.life--;
        if (p.life <= 0) { G.particles.splice(i, 1); continue; }
        p.x += p.vx; p.y += p.vy;
        p.vx *= 0.95; p.vy *= 0.95;
    }
}


/* =============================================
   ATTAQUE (AVEC PROJECTILES)
   ============================================= */
function doAttack(type) {
    if (G.matchEnded || !G.player) return;
    // En mode multijoueur, on a besoin d'un opponent
    if (G.gameMode !== 'zombie' && !G.opponent) return;
    
    const now = Date.now();
    // ✅ EN MODE ZOMBIE: TIRS INFINIS SANS COOLDOWN
    if (G.gameMode === 'zombie') {
        // Pas de cooldown en mode zombie - tirs infinis!
    } else {
        // Mode multijoueur: vérifier les cooldowns normaux
        if (type === 'normal') {
            if (now - G.lastAtkTime < G.player.atkCd) return;
            G.lastAtkTime = now;
        } else {
            if (now - G.lastSpeTime < G.player.speCd) return;
            G.lastSpeTime = now;
        }
    }

    const range  = type === 'normal' ? G.player.atkRange  : G.player.speRange;
    const damage = type === 'normal' ? G.player.atkDmg    : G.player.speDmg;

    const projSpeed = type === 'normal' ? 12 : 15;
    const projId = Date.now() + '_' + Math.random();
    
    const projectile = {
        id: projId,
        x: G.player.x,
        y: G.player.y,
        vx: Math.cos(G.aimAngle) * projSpeed,
        vy: Math.sin(G.aimAngle) * projSpeed,
        damage: damage,
        type: type,
        color: type === 'special' ? '#FDCB6E' : G.player.color,
        size: type === 'special' ? 8 : 6,
        life: Math.ceil(range / projSpeed) + 10,
        isMine: true
    };

    G.projectiles.push(projectile);

    spawnAtkParticles(G.player.x, G.player.y, 
        Math.cos(G.aimAngle), Math.sin(G.aimAngle), type);

    // Synchroniser seulement en multijoueur
    if (G.gameMode !== 'zombie') {
        syncProjectilesToFirebase();
    }

    console.log('🎯 PROJECTILE LANCÉ', type, '→', G.aimAngle);
}

function syncProjectilesToFirebase() {
    const myProjs = G.projectiles.filter(p => p.isMine).map(p => ({
        id: p.id,
        x: Math.round(p.x),
        y: Math.round(p.y),
        vx: p.vx,
        vy: p.vy,
        damage: p.damage,
        type: p.type,
        color: p.color,
        size: p.size,
        life: p.life
    }));

    RTDB.ref(`active_matches/${G.matchId}/gameState/${G.isPlayer1 ? 'player1' : 'player2'}/projectiles`).set(myProjs);
}

/* =============================================
   PARTICULES
   ============================================= */
function spawnAtkParticles(x, y, dx, dy, type) {
    const n = type === 'special' ? 7 : 3;
    const c = type === 'special' ? '#FDCB6E' : (G.player ? G.player.color : '#FF3366');
    for (let i = 0; i < n; i++) {
        const a = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.8;
        const s = 2 + Math.random() * 4;
        G.particles.push({ 
            x, y, 
            vx: Math.cos(a)*s, 
            vy: Math.sin(a)*s, 
            life: 12, maxLife: 12, 
            color: c, 
            size: 2 + Math.random()*2 
        });
    }
}

function spawnHitParticles(x, y, type) {
    const n = type === 'special' ? 16 : 8;
    const c = type === 'special' ? '#fff' : '#FFD700';
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 2 + Math.random() * 6;
        G.particles.push({ 
            x, y, 
            vx: Math.cos(a)*s, 
            vy: Math.sin(a)*s, 
            life: 20, maxLife: 20, 
            color: c, 
            size: 2 + Math.random()*4 
        });
    }
}

/* =============================================
   RENDU
   ============================================= */
function render() {
    if (!G.ctx || !G.canvas) return;
    const ctx = G.ctx, W = G.canvas.width, H = G.canvas.height;

    ctx.fillStyle = '#0F0F1E';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 48) { 
        ctx.beginPath(); 
        ctx.moveTo(x,0); 
        ctx.lineTo(x,H); 
        ctx.stroke(); 
    }
    for (let y = 0; y < H; y += 48) { 
        ctx.beginPath(); 
        ctx.moveTo(0,y); 
        ctx.lineTo(W,y); 
        ctx.stroke(); 
    }

    if (G.player) {
        drawAimIndicator(ctx);
    }

    if (G.opponent) drawEntity(ctx, G.opponent);
    if (G.player) drawEntity(ctx, G.player);

    // ✅ NOUVEAU : Dessiner les zombies en mode zombie
    for (const zombie of G.zombies) {
        ctx.save();
        ctx.fillStyle = zombie.color || '#00aa00';
        ctx.shadowBlur = 8;
        ctx.shadowColor = zombie.color || '#00aa00';
        ctx.beginPath();
        ctx.arc(zombie.x, zombie.y, zombie.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }

    for (const proj of G.projectiles) {
        ctx.save();
        ctx.shadowBlur = 12;
        ctx.shadowColor = proj.color;
        ctx.fillStyle = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(proj.x - proj.vx * 1.5, proj.y - proj.vy * 1.5, proj.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    for (const p of G.particles) {
        const alpha = p.life / p.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle   = p.color;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function drawAimIndicator(ctx) {
    if (!G.player) return;

    const range = Math.max(G.player.atkRange, G.player.speRange);
    
    // ✅ CORRECTION : Utiliser aimDistance qui est déjà limité à la portée
    const aimEndX = G.player.x + Math.cos(G.aimAngle) * G.aimDistance;
    const aimEndY = G.player.y + Math.sin(G.aimAngle) * G.aimDistance;
    
    // Ligne de visée
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(G.player.x, G.player.y);
    ctx.lineTo(aimEndX, aimEndY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Cercle de portée
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(G.player.x, G.player.y, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Réticule de visée
    ctx.save();
    ctx.fillStyle = 'rgba(255, 51, 102, 0.4)';
    ctx.strokeStyle = '#FF3366';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(aimEndX, aimEndY, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // Croix du réticule
    ctx.beginPath();
    ctx.moveTo(aimEndX - 12, aimEndY);
    ctx.lineTo(aimEndX - 4, aimEndY);
    ctx.moveTo(aimEndX + 4, aimEndY);
    ctx.lineTo(aimEndX + 12, aimEndY);
    ctx.moveTo(aimEndX, aimEndY - 12);
    ctx.lineTo(aimEndX, aimEndY - 4);
    ctx.moveTo(aimEndX, aimEndY + 4);
    ctx.lineTo(aimEndX, aimEndY + 12);
    ctx.stroke();
    ctx.restore();
}

function drawEntity(ctx, e) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + e.radius - 3, e.radius * 0.82, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.shadowBlur  = 28;
    ctx.shadowColor = e.glowColor || e.color;
    ctx.fillStyle   = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Affichage de l'image SVG à la place de l'emoji
    if (e.image && e.img && e.img.complete) {
        ctx.save();
        const size = e.radius * 1.6;
        ctx.drawImage(e.img, e.x - size/2, e.y - size/2, size, size);
        ctx.restore();
    } else if (e.emoji) {
        ctx.save();
        ctx.font = (e.radius * 1.2) + 'px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(e.emoji, e.x, e.y);
        ctx.restore();
    }
}

function flashHit(type) {
    G.ctx.save();
    G.ctx.globalAlpha = type === 'special' ? 0.15 : 0.1;
    G.ctx.fillStyle   = type === 'special' ? '#FDCB6E' : '#FF3366';
    G.ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
    G.ctx.restore();
}

/* =============================================
   FIN DE MATCH
   ============================================= */
function handleMatchEnd() {
    if (G.matchEnded) return;
    G.matchEnded = true;
    console.log('🏁 Fin');

    cleanupGame();

    const victory = G.player.hp > G.opponent.hp;
    console.log(victory ? '🎉 VICTOIRE' : '💔 DÉFAITE', `| ${G.player.hp} vs ${G.opponent.hp}`);

    RTDB.ref(`active_matches/${G.matchId}/status`).set('finished');

    const trophyChange = victory ? 10 : -5;
    const goldEarned = victory ? 50 : 20;
    updatePlayerStats(victory, trophyChange, goldEarned);

    const mid = G.matchId;
    setTimeout(() => RTDB.ref(`active_matches/${mid}`).remove(), 3000);

    showResult(victory, trophyChange, goldEarned);
}

async function updatePlayerStats(victory, trophyChange, goldEarned) {
    const curTr = G.playerData ? (G.playerData.trophies || 0) : 0;
    const newTr = Math.max(0, curTr + trophyChange);
    console.log(`🏆 ${curTr} → ${newTr}`);

    await FSDB.collection('players').doc(G.user.uid).update({
        trophies:     newTr,
        gold:         firebase.firestore.FieldValue.increment(goldEarned),
        totalMatches: firebase.firestore.FieldValue.increment(1),
        wins:         firebase.firestore.FieldValue.increment(victory ? 1 : 0),
        losses:       firebase.firestore.FieldValue.increment(victory ? 0 : 1)
    });
    lbCache = null;
}

/* =============================================
   RESULT SCREEN + CONFETTI
   ============================================= */
let confettiCanvas = null, confettiCtx = null, confettiList = [], confettiRaf = null;

function showResult(victory, trophyChange, goldEarned) {
    showScreen('result-screen');
    document.getElementById('result-title').textContent = victory ? 'VICTOIRE!' : 'DÉFAITE';
    document.getElementById('result-title').className   = 'result-title ' + (victory ? 'victory' : 'defeat');

    const sign = trophyChange >= 0 ? '+' : '';
    const trEl = document.getElementById('result-trophies');
    trEl.textContent = sign + trophyChange + ' 🏆';
    trEl.classList.toggle('negative', trophyChange < 0);
    
    document.getElementById('result-gold').textContent = '+' + goldEarned + ' 💰';

    setTimeout(() => {
        document.getElementById('result-total').textContent = (G.playerData ? G.playerData.trophies : 0) + ' 🏆';
    }, 800);

    if (victory) startConfetti(); else stopConfetti();
}

function startConfetti() {
    stopConfetti();
    const container = document.querySelector('.result-particles');
    confettiCanvas  = document.createElement('canvas');
    confettiCanvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;';
    container.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    confettiCanvas.width  = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    confettiList = Array.from({ length: 70 }, makeConfetti);
    (function loop() {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        for (const p of confettiList) {
            p.y += p.vy; p.vy += 0.07; p.x += p.vx; p.rot += p.rv;
            if (p.y > confettiCanvas.height) { p.y = -8; p.x = Math.random() * confettiCanvas.width; p.vy = 0.8; }
            confettiCtx.save();
            confettiCtx.translate(p.x, p.y);
            confettiCtx.rotate(p.rot);
            confettiCtx.fillStyle = p.c;
            confettiCtx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
            confettiCtx.restore();
        }
        confettiRaf = requestAnimationFrame(loop);
    })();
}
function stopConfetti() {
    if (confettiRaf) cancelAnimationFrame(confettiRaf);
    if (confettiCanvas && confettiCanvas.parentNode) confettiCanvas.parentNode.removeChild(confettiCanvas);
    confettiCanvas = null; confettiRaf = null;
}
function makeConfetti() {
    const colors = ['#FF3366','#FDCB6E','#6C5CE7','#00e676','#ff9800','#fff','#00bcd4'];
    return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight - 300,
        vx: (Math.random()-0.5) * 2.5,
        vy: 0.5 + Math.random() * 2,
        w: 5 + Math.random() * 6,
        h: 3 + Math.random() * 4,
        rot: Math.random() * Math.PI * 2,
        rv: (Math.random()-0.5) * 0.18,
        c: colors[Math.floor(Math.random() * colors.length)]
    };
}

document.getElementById('return-menu-btn').addEventListener('click', () => {
    stopConfetti();
    showScreen('main-menu');
});

/* =============================================
   LEADERBOARD
   ============================================= */
document.getElementById('leaderboard-btn').addEventListener('click', () => showLeaderboard('trophies'));
document.getElementById('close-leaderboard').addEventListener('click', () => showScreen('main-menu'));

const defaultLbMode = 'trophies';
let currentLbMode = defaultLbMode;
let lbCache = { trophies: null, zombie: null };
let lbCacheTime = { trophies: 0, zombie: 0 };
const LB_TTL = 120000;

async function showLeaderboard(mode = currentLbMode) {
    currentLbMode = mode;
    updateLeaderboardTabs();
    showScreen('leaderboard-screen');

    if (lbCache[mode] && (Date.now() - lbCacheTime[mode]) < LB_TTL) {
        renderLB(lbCache[mode], mode);
        return;
    }

    try {
        let snap;
        if (mode === 'zombie') {
            snap = await FSDB.collection('players').orderBy('bestZombieTime','desc').limit(50).get();
        } else {
            snap = await FSDB.collection('players').orderBy('trophies','desc').limit(50).get();
        }

        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        lbCache[mode]     = list;
        lbCacheTime[mode] = Date.now();
        renderLB(list, mode);
    } catch (e) {
        console.error('❌ LB:', e);
    }
}

function updateLeaderboardTabs() {
    const tabTrophies = document.getElementById('lb-tab-trophies');
    const tabZombie   = document.getElementById('lb-tab-zombie');
    if (tabTrophies) tabTrophies.classList.toggle('active', currentLbMode === 'trophies');
    if (tabZombie)   tabZombie.classList.toggle('active', currentLbMode === 'zombie');
}

// Tab event listeners (si les éléments sont disponibles)
const lbTabTrophies = document.getElementById('lb-tab-trophies');
const lbTabZombie   = document.getElementById('lb-tab-zombie');
if (lbTabTrophies) lbTabTrophies.addEventListener('click', () => showLeaderboard('trophies'));
if (lbTabZombie)   lbTabZombie.addEventListener('click', () => showLeaderboard('zombie'));

function renderLB(players, mode = 'trophies') {
    const ul = document.getElementById('leaderboard-list');
    ul.innerHTML = '';
    const rankCls = ['gold','silver','bronze'];
    players.forEach((p, i) => {
        const isMe = G.user && p.id === G.user.uid;
        const div  = document.createElement('div');
        div.className = 'leaderboard-item' + (isMe ? ' is-me' : '');

        const displayValue = mode === 'zombie'
            ? `${(p.bestZombieTime || 0)}s`
            : `🏆 ${p.trophies||0}`;

        div.innerHTML =
            `<span class="lb-rank ${rankCls[i]||''}">${i+1}</span>` +
            `<div class="lb-avatar">${(p.username||'?')[0].toUpperCase()}</div>` +
            `<span class="lb-name">${p.username||'Joueur'}${isMe?' (Vous)':''}</span>` +
            `<span class="lb-trophies">${displayValue}</span>`;
        ul.appendChild(div);
    });
}

/* =============================================
   CLEANUP
   ============================================= */
function cleanupGame() {
    if (G.rafId)           { cancelAnimationFrame(G.rafId); G.rafId = null; }
    if (G.timerIntervalId) { clearInterval(G.timerIntervalId); G.timerIntervalId = null; }
    if (G.matchListenerRef && G.matchListenerCb) {
        G.matchListenerRef.off('value', G.matchListenerCb);
        G.matchListenerRef = null;
        G.matchListenerCb  = null;
    }
    stopCooldownUI();
    G.keys = {};
    G.particles = [];
    G.projectiles = [];
    G.opponentProjectileIds.clear(); // ✅ RESET du Set
    G.walls = []; // ✅ RESET des murs
    G.zombies = []; // ✅ RESET des zombies
    G.gameMode = null; // ✅ RESET du mode
}

// ✅ CORRECTION 2 : fullCleanup (ligne ~640)
// Remplacer la fonction complète par celle-ci :

function fullCleanup() {
    cleanupGame();
    stopMatchmaking();
    removeKeyboard();
    stopConfetti();
    stopOnlineTracking(); // ✅ AJOUT
    if (G.matchId) {
        RTDB.ref(`active_matches/${G.matchId}`).remove();
        G.matchId = null;
    }
}

window.addEventListener('beforeunload', fullCleanup);

console.log('🎮 WARSLIGUE — Version corrigée chargée !');