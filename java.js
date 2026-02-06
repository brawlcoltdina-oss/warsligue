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
    const char = CHARACTERS[charKey] || CHARACTERS.warrior;
    
    const previewIcon = document.getElementById('preview-icon');
    const previewName = document.getElementById('preview-name');
    const previewHp = document.getElementById('preview-hp');
    const previewSpeed = document.getElementById('preview-speed');
    const previewDamage = document.getElementById('preview-damage');
    
    if (previewIcon) {
        previewIcon.innerHTML = `<img src="${char.image}" alt="${char.name}" style="width: 80%; height: 80%; object-fit: contain;">`;
        previewIcon.style.background = char.color;
        previewIcon.style.boxShadow = `0 0 40px ${char.glowColor}`;
    }
    
    if (previewName) previewName.textContent = char.name;
    if (previewHp) previewHp.textContent = char.hp;
    if (previewSpeed) previewSpeed.textContent = char.speed;
    if (previewDamage) previewDamage.textContent = char.attackDamage;
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
   CHESTS SYSTEM
   ============================================= */
document.getElementById('chests-btn').addEventListener('click', openChests);
document.getElementById('close-chests').addEventListener('click', () => showScreen('main-menu'));

async function openChests() {
    showScreen('chests-screen');
    document.getElementById('chests-gold').textContent = G.playerData ? (G.playerData.gold || 0) : 0;
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
   MATCHMAKING
   ============================================= */
document.getElementById('play-btn').addEventListener('click', startMatchmaking);
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

        G.mmChildListenerRef = RTDB.ref('active_matches');
        G.mmChildListener = (snap) => {
            const m = snap.val();
            if (!m) return;
            console.log('📢 Match détecté:', snap.key);
            if (m.player1Uid === G.user.uid || m.player2Uid === G.user.uid) {
                console.log('✅ C\'est notre match !');
                stopMatchmaking();
                enterMatch(snap.key, m);
            }
        };
        G.mmChildListenerRef.limitToLast(1).on('child_added', G.mmChildListener);

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
        
        let bestOpponent = null;
        let bestKey = null;
        let bestDiff = Infinity;
        
        for (const [key, player] of Object.entries(queue)) {
            if (key === G.myQueueKey) continue;
            if (!player || !player.uid) continue;
            
            const diff = Math.abs((player.trophies || 0) - myTrophies);
            if (diff <= 250 && diff < bestDiff) {
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
    if (G.mmChildListenerRef && G.mmChildListener) {
        G.mmChildListenerRef.off('child_added', G.mmChildListener);
        console.log('🔌 Listener MM détaché');
    }
    G.mmChildListener    = null;
    G.mmChildListenerRef = null;
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
   ENTRER DANS LE MATCH
   ============================================= */
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

    const myKey  = G.isPlayer1 ? matchData.player1Char : matchData.player2Char;
    const oppKey = G.isPlayer1 ? matchData.player2Char : matchData.player1Char;
    const myC    = CHARACTERS[myKey]  || CHARACTERS.warrior;
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

    G.gameTime    = 180;
    G.matchEnded  = false;
    G.particles   = [];
    G.projectiles = [];
    G.opponentProjectileIds = new Set(); // ✅ RESET du Set
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

// ✅ CORRECTION : Fonction qui évite les doublons de projectiles
function syncOpponentProjectiles(oppProjs) {
    if (!oppProjs || oppProjs.length === 0) {
        // Nettoyer les projectiles adverses qui ne sont plus dans Firebase
        G.projectiles = G.projectiles.filter(p => p.isMine);
        G.opponentProjectileIds.clear();
        return;
    }
    
    const currentOppIds = new Set(oppProjs.map(p => p.id));
    
    // Supprimer les projectiles adverses qui n'existent plus dans Firebase
    G.projectiles = G.projectiles.filter(p => {
        if (p.isMine) return true; // Garder nos propres projectiles
        return currentOppIds.has(p.id); // Garder seulement les projectiles adverses encore dans Firebase
    });
    
    // Ajouter les nouveaux projectiles adverses
    for (const proj of oppProjs) {
        if (!G.opponentProjectileIds.has(proj.id)) {
            G.projectiles.push({
                ...proj,
                isMine: false,
                isOpponent: true
            });
            G.opponentProjectileIds.add(proj.id);
        }
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
    setBar('opponent-hp', 'opponent-hp-text', G.opponent.hp, G.opponent.maxHp);
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

    G.player.x = Math.max(G.player.radius, Math.min(G.canvas.width  - G.player.radius, G.player.x + vx));
    G.player.y = Math.max(G.player.radius, Math.min(G.canvas.height - G.player.radius, G.player.y + vy));

    if (vx !== 0 || vy !== 0) {
        const now = Date.now();
        if (now - G.lastPosSend >= 50) {
            G.lastPosSend = now;
            RTDB.ref(`active_matches/${G.matchId}/gameState/${G.isPlayer1 ? 'player1' : 'player2'}`).update({
                x: Math.round(G.player.x),
                y: Math.round(G.player.y)
            });
        }
    }

    G.opponent.x += (G.opponent.targetX - G.opponent.x) * 0.2;
    G.opponent.y += (G.opponent.targetY - G.opponent.y) * 0.2;

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

        if (proj.isMine) {
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
    if (G.matchEnded || !G.player || !G.opponent) return;
    const now = Date.now();
    if (type === 'normal') {
        if (now - G.lastAtkTime < G.player.atkCd) return;
        G.lastAtkTime = now;
    } else {
        if (now - G.lastSpeTime < G.player.speCd) return;
        G.lastSpeTime = now;
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

    syncProjectilesToFirebase();

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
document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('close-leaderboard').addEventListener('click', () => showScreen('main-menu'));

let lbCache = null, lbCacheTime = 0;
const LB_TTL = 120000;

async function showLeaderboard() {
    showScreen('leaderboard-screen');
    if (lbCache && (Date.now() - lbCacheTime) < LB_TTL) { renderLB(lbCache); return; }
    try {
        const snap = await FSDB.collection('players').orderBy('trophies','desc').limit(50).get();
        const list = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() }));
        lbCache     = list;
        lbCacheTime = Date.now();
        renderLB(list);
    } catch (e) { console.error('❌ LB:', e); }
}

function renderLB(players) {
    const ul = document.getElementById('leaderboard-list');
    ul.innerHTML = '';
    const rankCls = ['gold','silver','bronze'];
    players.forEach((p, i) => {
        const isMe = G.user && p.id === G.user.uid;
        const div  = document.createElement('div');
        div.className = 'leaderboard-item' + (isMe ? ' is-me' : '');
        div.innerHTML =
            `<span class="lb-rank ${rankCls[i]||''}">${i+1}</span>` +
            `<div class="lb-avatar">${(p.username||'?')[0].toUpperCase()}</div>` +
            `<span class="lb-name">${p.username||'Joueur'}${isMe?' (Vous)':''}</span>` +
            `<span class="lb-trophies">🏆 ${p.trophies||0}</span>`;
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