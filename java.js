// ==========================================
// WARSLIGUE — java.js  (MODE SOLO / ZOMBIE ONLY)
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

    matchId: null,

    rafId: null,

    selectedChar: 'warrior',

    keys: {},
    keydownFn: null,
    keyupFn: null,

    canvas: null,
    ctx: null,
    resizeFn: null,

    player: null,
    gameTime: 0,
    matchEnded: false,

    particles: [],
    projectiles: [],
    walls: [],

    gameMode: null, // 'zombie' (multijoueur désactivé)
    zombies: [],
    zombieSpawnTimer: 0,
    zombieWaveCount: 0,
    zombieSurvivalStart: 0,

    lastAtkTime: 0,
    lastSpeTime: 0,
    cdAtkInterval: null,
    cdSpeInterval: null,

    mobileInstalled: false,

    aimAngle: 0,
    aimDistance: 0,
    mouseX: 0,
    mouseY: 0,
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

AUTH.onAuthStateChanged(async (user) => {
    await new Promise(r => setTimeout(r, 1800));
    if (user) {
        G.user = user;
        await ensurePlayerDoc(user);
        listenPlayerData(user.uid);
        if (typeof initOnlineTracking === 'function') initOnlineTracking();
        if (typeof initFriendsSystem  === 'function') initFriendsSystem();
        showScreen('main-menu');
    } else {
        G.user = null;
        G.playerData = null;
        if (G.playerDataUnsub) { G.playerDataUnsub(); G.playerDataUnsub = null; }
        if (typeof stopOnlineTracking  === 'function') stopOnlineTracking();
        if (typeof cleanupFriendsSystem === 'function') cleanupFriendsSystem();
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
        if (data.gold === undefined) updates.gold = 100;
        if (!data.powerPoints) updates.powerPoints = {};
        if (!data.upgrades) updates.upgrades = {};
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

    const selectedChar = G.selectedChar || 'warrior';
    const charPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    const ppElement = document.getElementById('player-powerpoints');
    if (ppElement) ppElement.textContent = charPowerPoints;
}

/* =============================================
   CHARACTER SELECTION
   ============================================= */
function renderCharacterSelector() {
    const container = document.getElementById('character-selector');
    if (!container || !G.playerData) return;
    container.innerHTML = '';

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

        if (owned) card.addEventListener('click', () => selectCharacter(key));
        container.appendChild(card);
    }
}

function updateCharacterPreview(charKey) {
    const baseChar = CHARACTERS[charKey] || CHARACTERS.warrior;
    const char = getCharacterWithUpgrades(charKey, G.playerData);

    const previewIcon   = document.getElementById('preview-icon');
    const previewName   = document.getElementById('preview-name');
    const previewHp     = document.getElementById('preview-hp');
    const previewSpeed  = document.getElementById('preview-speed');
    const previewDamage = document.getElementById('preview-damage');

    if (previewIcon) {
        previewIcon.innerHTML = `<img src="${baseChar.image}" alt="${baseChar.name}" style="width: 80%; height: 80%; object-fit: contain;">`;
        previewIcon.style.background = baseChar.color;
        previewIcon.style.boxShadow = `0 0 40px ${baseChar.glowColor}`;
    }
    if (previewName)   previewName.textContent   = baseChar.name;
    if (previewHp)     previewHp.textContent     = Math.round(char.hp * 10) / 10;
    if (previewSpeed)  previewSpeed.textContent  = Math.round(char.speed * 10) / 10;
    if (previewDamage) previewDamage.textContent = Math.round(char.attackDamage * 10) / 10;
}

function selectCharacter(key) {
    if (!CHARACTERS[key]) return;
    const ownedChars = G.playerData?.ownedCharacters || ['warrior', 'assassin', 'mage'];
    if (!ownedChars.includes(key)) return;

    G.selectedChar = key;
    updateCharacterPreview(key);
    highlightChar(key);
    if (G.user) FSDB.collection('players').doc(G.user.uid).update({ selectedCharacter: key });
    setTimeout(() => closeCharacterPanel(), 500);
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
const upgradesBtn = document.getElementById('upgrades-btn');
if (upgradesBtn) upgradesBtn.addEventListener('click', openUpgradesPanel);

const closeUpgradesBtn = document.getElementById('close-upgrades-panel');
if (closeUpgradesBtn) closeUpgradesBtn.addEventListener('click', closeUpgradesPanel);

const upgradesPanelOverlay = document.getElementById('upgrades-panel-overlay');
if (upgradesPanelOverlay) upgradesPanelOverlay.addEventListener('click', closeUpgradesPanel);

function openUpgradesPanel() {
    try {
        const selectedChar = G.selectedChar || 'warrior';
        const charPowerPoints = (G.playerData && G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
        const charUpgrades = (G.playerData && G.playerData.upgrades && G.playerData.upgrades[selectedChar]) || {};

        const charNameEl = document.getElementById('upgrade-char-name');
        const powerPointsEl = document.getElementById('upgrade-powerpoints-display');

        if (charNameEl) charNameEl.textContent = CHARACTERS[selectedChar].name;
        if (powerPointsEl) powerPointsEl.textContent = `⚡ ${charPowerPoints} points`;

        renderUpgradeStatLevels('hp', selectedChar, charPowerPoints, charUpgrades);
        renderUpgradeStatLevels('speed', selectedChar, charPowerPoints, charUpgrades);
        renderUpgradeStatLevels('attackDamage', selectedChar, charPowerPoints, charUpgrades);

        const upgradesPanel = document.getElementById('upgrades-panel');
        if (upgradesPanel) upgradesPanel.classList.add('active');
    } catch (e) {
        console.error('❌ Erreur ouverture upgrades panel:', e);
    }
}

function closeUpgradesPanel() {
    document.getElementById('upgrades-panel').classList.remove('active');
}

function renderUpgradeStatLevels(stat, charKey, powerPoints, charUpgrades) {
    try {
        const char = CHARACTERS[charKey];
        if (!char || !char.upgrades || !char.upgrades[stat]) return;

        const upgrades = char.upgrades[stat] || [];
        const container = document.getElementById(`upgrade-${stat}-levels`);
        if (!container) return;

        container.innerHTML = '';
        const currentLevel = (charUpgrades[stat] && charUpgrades[stat].level) || 0;

        upgrades.forEach((upgrade) => {
            const isMaxLevel  = currentLevel >= upgrade.level;
            const isNextLevel = upgrade.level === currentLevel + 1;
            const canAfford   = isNextLevel && powerPoints >= upgrade.cost;

            const card = document.createElement('div');
            card.className = `upgrade-card ${isMaxLevel ? 'maxed' : ''} ${canAfford ? 'available' : ''}`;
            card.style.cssText = `
                border: 2px solid ${isMaxLevel ? '#2ECC71' : canAfford ? '#FFD700' : '#666'};
                background: ${isMaxLevel ? 'rgba(46,204,113,0.1)' : canAfford ? 'rgba(255,215,0,0.1)' : 'rgba(100,100,100,0.1)'};
                padding: 12px; border-radius: 8px; margin-bottom: 8px;
                cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                opacity: ${canAfford || isMaxLevel ? '1' : '0.6'};
            `;

            const baseValue    = char[stat];
            const displayValue = baseValue + (upgrade.increment * upgrade.level);
            let statusText = '';
            if (isMaxLevel)        statusText = '✅ NIVEAU MAXIMAL';
            else if (canAfford)    statusText = '🔓 ACHETER';
            else if (!isNextLevel) statusText = '🔒 Achetez le niveau précédent';
            else                   statusText = '🔒 Pas assez';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-weight: bold; margin-bottom: 4px;">Niveau ${upgrade.level}</div>
                        <div style="font-size: 0.9em; color: #ccc;">${baseValue} → ${displayValue} (+${upgrade.increment})</div>
                        <div style="font-size: 0.85em; color: #FFD700; margin-top: 4px;">⚡ Coût: ${upgrade.cost}</div>
                    </div>
                    <div style="text-align: right; font-size: 0.9em;">${statusText}</div>
                </div>
            `;

            if (canAfford && !isMaxLevel) {
                card.addEventListener('click', () => applyUpgrade(charKey, stat, upgrade.level, upgrade.cost));
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
    if (charKey !== selectedChar) { alert('Vous pouvez seulement améliorer le personnage sélectionné !'); return; }

    const currentPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    if (currentPowerPoints < cost) { alert('Vous n\'avez pas assez de points de pouvoir !'); return; }

    const currentLevel = (G.playerData.upgrades && G.playerData.upgrades[selectedChar] && G.playerData.upgrades[selectedChar][stat] && G.playerData.upgrades[selectedChar][stat].level) || 0;
    if (level !== currentLevel + 1) { alert('Vous devez acheter le niveau précédent avant de débloquer ce niveau.'); return; }

    try {
        const updates = {};
        updates[`upgrades.${selectedChar}.${stat}`] = { level, appliedAt: firebase.firestore.FieldValue.serverTimestamp() };
        updates[`powerPoints.${selectedChar}`] = currentPowerPoints - cost;
        await FSDB.collection('players').doc(G.user.uid).update(updates);
        setTimeout(() => openUpgradesPanel(), 300);
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

    const selectedChar = G.selectedChar || 'warrior';
    const charPowerPoints = (G.playerData && G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    const chestsPPElement = document.getElementById('chests-powerpoints');
    if (chestsPPElement) chestsPPElement.textContent = charPowerPoints;

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
        card.style.cssText = `border-color: ${chest.color}40; background: linear-gradient(135deg, ${chest.color}10, ${chest.color}05);`;

        card.innerHTML = `
            <div class="shop-item-icon" style="font-size: 4rem; filter: drop-shadow(0 0 15px ${chest.glowColor});">${chest.emoji}</div>
            <div class="shop-item-name">${chest.name}</div>
            <div class="shop-item-desc">
                💰 ${chest.rewards.gold.min}-${chest.rewards.gold.max} pièces<br>
                ⚡ ${chest.rewards.powerPoints.min}-${chest.rewards.powerPoints.max} points<br>
                🎲 ${(chest.rewards.characterChance * 100).toFixed(0)}% personnage
            </div>
            <div class="shop-item-price"><span>💰</span><span>${chest.price}</span></div>
            <button class="shop-item-btn" data-chest="${key}" ${!canAfford ? 'disabled' : ''}>${canAfford ? 'Acheter' : 'Pas assez de 💰'}</button>
        `;

        const btn = card.querySelector('.shop-item-btn');
        if (canAfford) btn.addEventListener('click', () => buyChest(key));
        grid.appendChild(card);
    }
}

async function buyChest(chestKey) {
    if (!G.user || !G.playerData) return;
    const chest = CHEST_TYPES[chestKey];
    const currentGold = G.playerData.gold || 0;
    if (currentGold < chest.price) { showError('Pas assez de pièces !'); return; }

    try {
        await FSDB.collection('players').doc(G.user.uid).update({ gold: currentGold - chest.price });
        await openChestAnimation(chestKey);
    } catch (e) {
        console.error('❌ Achat coffre:', e);
        showError('Erreur lors de l\'achat');
    }
}

async function openChestAnimation(chestKey) {
    const chest    = CHEST_TYPES[chestKey];
    const modal    = document.getElementById('reward-modal');
    const opening  = document.getElementById('chest-opening');
    const result   = document.getElementById('reward-result');
    const chestIcon = document.getElementById('opening-chest-icon');

    modal.classList.add('active');
    opening.style.display = 'flex';
    result.style.display  = 'none';
    chestIcon.textContent  = chest.emoji;
    chestIcon.style.fontSize = '6rem';
    chestIcon.style.animation = 'chestShake 0.8s ease-in-out infinite';

    await new Promise(r => setTimeout(r, 2000));

    const reward = generateChestReward(chestKey, G.playerData);
    await applyChestReward(reward);
    displayChestReward(reward, chest);
}

async function applyChestReward(reward) {
    const updates = { gold: firebase.firestore.FieldValue.increment(reward.gold) };
    if (!G.playerData.powerPoints) G.playerData.powerPoints = {};

    const selectedChar = G.selectedChar || 'warrior';
    const currentPowerPoints = (G.playerData.powerPoints && G.playerData.powerPoints[selectedChar]) || 0;
    updates[`powerPoints.${selectedChar}`] = currentPowerPoints + reward.powerPoints;

    if (reward.character && reward.isNew) {
        updates.ownedCharacters = firebase.firestore.FieldValue.arrayUnion(reward.character);
    }

    await FSDB.collection('players').doc(G.user.uid).update(updates);
}

function displayChestReward(reward, chest) {
    const opening     = document.getElementById('chest-opening');
    const result      = document.getElementById('reward-result');
    const rewardItem  = document.getElementById('reward-item');
    const goldDisplay = document.getElementById('reward-gold-display');

    opening.style.display = 'none';
    result.style.display  = 'block';

    if (reward.character && reward.isNew) {
        const char = CHARACTERS[reward.character];
        rewardItem.style.display = 'block';
        document.getElementById('reward-rarity').textContent  = char.rarity.toUpperCase();
        document.getElementById('reward-rarity').className    = `reward-rarity-badge rarity-${char.rarity}`;
        document.getElementById('reward-icon').innerHTML      = `<img src="${char.image}" alt="${char.name}" style="width: 80%; height: 80%; object-fit: contain;">`;
        document.getElementById('reward-icon').style.background  = char.color;
        document.getElementById('reward-icon').style.boxShadow   = `0 0 40px ${char.glowColor}`;
        document.getElementById('reward-name').textContent   = char.name;
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
    if (!playerData || !playerData.upgrades || !playerData.upgrades[charKey]) return charCopy;

    const upgrades = playerData.upgrades[charKey];
    if (upgrades.hp && upgrades.hp.level > 0) {
        const upgradeData = baseChar.upgrades.hp.find(u => u.level === upgrades.hp.level);
        if (upgradeData) charCopy.hp = baseChar.hp + (upgradeData.increment * upgrades.hp.level);
    }
    if (upgrades.speed && upgrades.speed.level > 0) {
        const upgradeData = baseChar.upgrades.speed.find(u => u.level === upgrades.speed.level);
        if (upgradeData) charCopy.speed = baseChar.speed + (upgradeData.increment * upgrades.speed.level);
    }
    if (upgrades.attackDamage && upgrades.attackDamage.level > 0) {
        const upgradeData = baseChar.upgrades.attackDamage.find(u => u.level === upgrades.attackDamage.level);
        if (upgradeData) charCopy.attackDamage = baseChar.attackDamage + (upgradeData.increment * upgrades.attackDamage.level);
    }
    return charCopy;
}

/* =============================================
   LANCEMENT DU JEU (DIRECT → ZOMBIE)
   ============================================= */
document.getElementById('play-btn').addEventListener('click', () => {
    G.gameMode = 'zombie';
    startZombieMode();
});

/* =============================================
   ZOMBIE MODE
   ============================================= */
async function startZombieMode() {
    if (!G.playerData) return;
    showScreen('game-screen');

    G.matchEnded         = false;
    G.gameTime           = 0;
    G.zombies            = [];
    G.projectiles        = [];
    G.particles          = [];
    G.zombieWaveCount    = 0;
    G.zombieSpawnTimer   = 0;
    G.zombieSurvivalStart = Date.now();

    document.getElementById('player-game-name').textContent   = '🧟 MODE ZOMBIE';
    document.getElementById('opponent-game-name').textContent = 'Survivez !';

    G.matchId = 'zombie_' + Date.now();

    initGame();
    console.log('🧟 Mode Zombie démarré !');
}

/* =============================================
   INIT GAME
   ============================================= */
function initGame() {
    G.canvas = document.getElementById('game-canvas');
    G.ctx    = G.canvas.getContext('2d');
    resizeCanvas();

    if (G.resizeFn) window.removeEventListener('resize', G.resizeFn);
    G.resizeFn = resizeCanvas;
    window.addEventListener('resize', G.resizeFn);

    const myKey = G.selectedChar || 'warrior';
    const myC   = getCharacterWithUpgrades(myKey, G.playerData);

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

    if (myC.image) {
        G.player.img = new Image();
        G.player.img.src = myC.image;
    }

    G.gameTime    = 0;
    G.matchEnded  = false;
    G.particles   = [];
    G.projectiles = [];
    G.walls       = [];
    G.lastAtkTime = 0;
    G.lastSpeTime = 0;

    G.isAiming    = false;
    G.aimAngle    = 0;
    G.aimDistance = 0;

    installKeyboard();
    installMobile();
    installAimControls();

    if (G.rafId) cancelAnimationFrame(G.rafId);
    G.rafId = requestAnimationFrame(gameLoop);

    startCooldownUI();
    updateTimerUI();
    updateHpBars();
    console.log('🎯 Game init. Mode:', G.gameMode);
}

function resizeCanvas() {
    if (!G.canvas) return;
    G.canvas.width  = window.innerWidth;
    G.canvas.height = window.innerHeight;
}

/* =============================================
   ZOMBIE MODE FUNCTIONS
   ============================================= */
function updateZombieMode() {
    G.gameTime = Math.floor((Date.now() - G.zombieSurvivalStart) / 1000);

    G.zombieSpawnTimer++;
    const spawnInterval = Math.max(60, 180 - G.zombieWaveCount * 8);

    if (G.zombieSpawnTimer >= spawnInterval) {
        G.zombieSpawnTimer = 0;
        G.zombieWaveCount++;
        const zombieCount = Math.min(1 + Math.floor(G.zombieWaveCount / 4), 2);
        for (let i = 0; i < zombieCount; i++) spawnZombie();
    }

    for (let i = G.zombies.length - 1; i >= 0; i--) {
        const zombie = G.zombies[i];
        const dx = G.player.x - zombie.x;
        const dy = G.player.y - zombie.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist > 0) {
            zombie.x += (dx / dist) * zombie.speed;
            zombie.y += (dy / dist) * zombie.speed;
        }

        if (dist < G.player.radius + zombie.radius) {
            G.player.hp -= (zombie.damage * 0.016);
            if (G.player.hp <= 0) {
                endZombieMode();
                return;
            }
        }
    }

    updateHpBars();
    updateTimerUI();
}

function spawnZombie() {
    let x, y;
    const side = Math.random();
    if      (side < 0.25) { x = Math.random() * G.canvas.width;  y = -30; }
    else if (side < 0.5)  { x = G.canvas.width + 30;             y = Math.random() * G.canvas.height; }
    else if (side < 0.75) { x = Math.random() * G.canvas.width;  y = G.canvas.height + 30; }
    else                  { x = -30;                              y = Math.random() * G.canvas.height; }

    G.zombies.push({
        x, y,
        radius: 18,
        speed: 2 + (G.zombieWaveCount * 0.15),
        hp: 15 + (G.zombieWaveCount * 2),
        damage: 5 + (G.zombieWaveCount * 0.5),
        color: '#00aa00'
    });
}

function endZombieMode() {
    G.matchEnded = true;
    const survivalTime = G.gameTime;
    const goldReward   = Math.floor(survivalTime * 2);
    const trophyReward = Math.floor(survivalTime / 10);

    saveZombieResults(survivalTime, goldReward, trophyReward);
    setTimeout(() => showZombieResults(survivalTime, goldReward, trophyReward), 500);
}

async function saveZombieResults(survivalTime, gold, trophy) {
    if (!G.user || !G.playerData) return;
    try {
        const updates = {
            gold:     (G.playerData.gold || 0) + gold,
            trophies: (G.playerData.trophies || 0) + trophy
        };

        const currentBest = G.playerData.bestZombieTime || 0;
        if (survivalTime > currentBest) {
            updates.bestZombieTime = survivalTime;
            G.playerData.bestZombieTime = survivalTime;
        }

        await FSDB.collection('players').doc(G.user.uid).update(updates);
        await FSDB.collection('players').doc(G.user.uid).collection('zombie_sessions').add({
            timestamp:    firebase.firestore.FieldValue.serverTimestamp(),
            survivalTime, goldEarned: gold, trophyEarned: trophy
        });
    } catch (e) {
        console.error('Erreur sauvegarde résultats:', e);
    }
}

function showZombieResults(survivalTime, gold, trophy) {
    const resultTitle = document.getElementById('result-title');
    const resultStats = document.querySelector('#result-screen .result-stats');

    if (resultTitle) resultTitle.textContent = `🧟 SURVIVANT! (${survivalTime}s)`;
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
   SYSTÈME DE VISÉE
   ============================================= */
function installAimControls() {
    // --- Visée souris ---
    G.canvas.addEventListener('mousemove', (e) => {
        if (!G.player) return;
        const rect = G.canvas.getBoundingClientRect();
        G.mouseX = e.clientX - rect.left;
        G.mouseY = e.clientY - rect.top;
        const dx = G.mouseX - G.player.x;
        const dy = G.mouseY - G.player.y;
        G.aimAngle = Math.atan2(dy, dx);
        const maxRange = Math.max(G.player.atkRange, G.player.speRange);
        G.aimDistance = Math.min(Math.sqrt(dx*dx + dy*dy), maxRange);
    });

    // --- Clic gauche = attaque normale ---
    G.canvas.addEventListener('mousedown', (e) => {
        if (e.button === 0) { e.preventDefault(); doAttack('normal');  }
        if (e.button === 2) { e.preventDefault(); doAttack('special'); }
    });

    // Empêcher le menu contextuel sur le canvas
    G.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // --- Touch ---
    G.canvas.addEventListener('touchmove', (e) => {
        if (!G.player) return;
        e.preventDefault();
        const rect  = G.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        G.mouseX = touch.clientX - rect.left;
        G.mouseY = touch.clientY - rect.top;
        const dx = G.mouseX - G.player.x;
        const dy = G.mouseY - G.player.y;
        G.aimAngle = Math.atan2(dy, dx);
        const maxRange = Math.max(G.player.atkRange, G.player.speRange);
        G.aimDistance = Math.min(Math.sqrt(dx*dx + dy*dy), maxRange);
    }, { passive: false });
}

/* =============================================
   TIMER + HP UI
   ============================================= */
function updateTimerUI() {
    const m  = Math.floor(G.gameTime / 60);
    const s  = G.gameTime % 60;
    const el = document.getElementById('game-timer');
    el.textContent = m + ':' + String(s).padStart(2, '0');
}

function updateHpBars() {
    setBar('player-hp', 'player-hp-text', G.player.hp, G.player.maxHp);
    // Barre adversaire masquée en mode zombie
    const oppHp = document.getElementById('opponent-hp');
    if (oppHp) oppHp.style.width = '0%';
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

    let newX = G.player.x + vx;
    let newY = G.player.y + vy;
    newX = Math.max(G.player.radius, Math.min(G.canvas.width  - G.player.radius, newX));
    newY = Math.max(G.player.radius, Math.min(G.canvas.height - G.player.radius, newY));
    G.player.x = newX;
    G.player.y = newY;

    updateZombieMode();

    for (let i = G.projectiles.length - 1; i >= 0; i--) {
        const proj = G.projectiles[i];
        proj.x += proj.vx;
        proj.y += proj.vy;
        proj.life--;

        if (proj.x < 0 || proj.x > G.canvas.width || proj.y < 0 || proj.y > G.canvas.height || proj.life <= 0) {
            G.projectiles.splice(i, 1);
            continue;
        }

        // Collision avec les zombies
        for (let z = G.zombies.length - 1; z >= 0; z--) {
            const zombie = G.zombies[z];
            const dx = zombie.x - proj.x;
            const dy = zombie.y - proj.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < zombie.radius + 5) {
                zombie.hp -= proj.damage;
                spawnHitParticles(proj.x, proj.y, proj.type);
                flashHit(proj.type);
                G.projectiles.splice(i, 1);
                if (zombie.hp <= 0) G.zombies.splice(z, 1);
                break;
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
   ATTAQUE
   ============================================= */
function doAttack(type) {
    if (G.matchEnded || !G.player) return;

    // Pas de cooldown en mode zombie = tirs libres
    // (optionnel : décommentez les lignes suivantes pour activer les cooldowns)
    // const now = Date.now();
    // if (type === 'normal') {
    //     if (now - G.lastAtkTime < G.player.atkCd) return;
    //     G.lastAtkTime = now;
    // } else {
    //     if (now - G.lastSpeTime < G.player.speCd) return;
    //     G.lastSpeTime = now;
    // }

    const projSpeed = type === 'normal' ? 12 : 15;
    const damage    = type === 'normal' ? G.player.atkDmg : G.player.speDmg;
    const range     = type === 'normal' ? G.player.atkRange : G.player.speRange;

    const projectile = {
        id:     Date.now() + '_' + Math.random(),
        x:      G.player.x,
        y:      G.player.y,
        vx:     Math.cos(G.aimAngle) * projSpeed,
        vy:     Math.sin(G.aimAngle) * projSpeed,
        damage,
        type,
        color:  type === 'special' ? '#FDCB6E' : G.player.color,
        size:   type === 'special' ? 8 : 6,
        life:   Math.ceil(range / projSpeed) + 10,
        isMine: true
    };

    G.projectiles.push(projectile);
    spawnAtkParticles(G.player.x, G.player.y, Math.cos(G.aimAngle), Math.sin(G.aimAngle), type);
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
        G.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 12, maxLife: 12, color: c, size: 2 + Math.random()*2 });
    }
}

function spawnHitParticles(x, y, type) {
    const n = type === 'special' ? 16 : 8;
    const c = type === 'special' ? '#fff' : '#FFD700';
    for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const s = 2 + Math.random() * 6;
        G.particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 20, maxLife: 20, color: c, size: 2 + Math.random()*4 });
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
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    if (G.player) drawAimIndicator(ctx);
    if (G.player) drawEntity(ctx, G.player);

    // Zombies
    for (const zombie of G.zombies) {
        ctx.save();
        ctx.fillStyle  = zombie.color || '#00aa00';
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

    // Projectiles
    for (const proj of G.projectiles) {
        ctx.save();
        ctx.shadowBlur  = 12;
        ctx.shadowColor = proj.color;
        ctx.fillStyle   = proj.color;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(proj.x - proj.vx * 1.5, proj.y - proj.vy * 1.5, proj.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // Particules
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

    // Compteur de vague et temps
    ctx.save();
    ctx.fillStyle    = 'rgba(255,255,255,0.5)';
    ctx.font         = 'bold 14px Outfit';
    ctx.textAlign    = 'left';
    ctx.fillText(`Vague ${G.zombieWaveCount} | Zombies: ${G.zombies.length}`, 12, G.canvas.height - 12);
    ctx.restore();
}

function drawAimIndicator(ctx) {
    if (!G.player) return;
    const range   = Math.max(G.player.atkRange, G.player.speRange);
    const aimEndX = G.player.x + Math.cos(G.aimAngle) * G.aimDistance;
    const aimEndY = G.player.y + Math.sin(G.aimAngle) * G.aimDistance;

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(G.player.x, G.player.y); ctx.lineTo(aimEndX, aimEndY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(G.player.x, G.player.y, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle   = 'rgba(255, 51, 102, 0.4)';
    ctx.strokeStyle = '#FF3366';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(aimEndX, aimEndY, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(aimEndX - 12, aimEndY); ctx.lineTo(aimEndX - 4, aimEndY);
    ctx.moveTo(aimEndX + 4, aimEndY);  ctx.lineTo(aimEndX + 12, aimEndY);
    ctx.moveTo(aimEndX, aimEndY - 12); ctx.lineTo(aimEndX, aimEndY - 4);
    ctx.moveTo(aimEndX, aimEndY + 4);  ctx.lineTo(aimEndX, aimEndY + 12);
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
   RESULT SCREEN + CONFETTI
   ============================================= */
let confettiCanvas = null, confettiCtx = null, confettiList = [], confettiRaf = null;

document.getElementById('return-menu-btn').addEventListener('click', () => {
    stopConfetti();
    showScreen('main-menu');
});

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

/* =============================================
   LEADERBOARD
   ============================================= */
document.getElementById('leaderboard-btn').addEventListener('click', () => showLeaderboard('trophies'));
document.getElementById('close-leaderboard').addEventListener('click', () => showScreen('main-menu'));

let currentLbMode = 'trophies';
let lbCache     = { trophies: null, zombie: null };
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

const lbTabTrophies = document.getElementById('lb-tab-trophies');
const lbTabZombie   = document.getElementById('lb-tab-zombie');
if (lbTabTrophies) lbTabTrophies.addEventListener('click', () => showLeaderboard('trophies'));
if (lbTabZombie)   lbTabZombie.addEventListener('click', () => showLeaderboard('zombie'));

function renderLB(players, mode = 'trophies') {
    const ul = document.getElementById('leaderboard-list');
    ul.innerHTML = '';
    const rankCls = ['gold','silver','bronze'];
    players.forEach((p, i) => {
        const isMe  = G.user && p.id === G.user.uid;
        const div   = document.createElement('div');
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
    if (G.rafId) { cancelAnimationFrame(G.rafId); G.rafId = null; }
    stopCooldownUI();
    G.keys        = {};
    G.particles   = [];
    G.projectiles = [];
    G.walls       = [];
    G.zombies     = [];
    G.gameMode    = null;
}

function fullCleanup() {
    cleanupGame();
    removeKeyboard();
    stopConfetti();
    if (typeof stopOnlineTracking   === 'function') stopOnlineTracking();
    if (typeof cleanupFriendsSystem  === 'function') cleanupFriendsSystem();
}

window.addEventListener('beforeunload', fullCleanup);

console.log('🎮 WARSLIGUE — Mode Solo/Zombie chargé !');