// ==========================================
// WARSLIGUE - VERSION CORRIGÉE QUI MARCHE
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyAigU1zwt8XzDmIZtddvxYstor-9QxDizw",
  authDomain: "warsligue.firebaseapp.com",
  databaseURL: "https://warsligue-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "warsligue",
  storageBucket: "warsligue.firebasestorage.app",
  messagingSenderId: "66283382391",
  appId: "1:66283382391:web:3d4d3dc5e51ff198870872",
  measurementId: "G-84EWH821ED"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

const GameState = {
    currentUser: null,
    playerData: null,
    currentMatch: null,
    gameLoop: null,
    matchmakingListener: null,
    matchStateListener: null,
    gameTimerInterval: null,
    cache: {
        leaderboard: null,
        leaderboardTimestamp: 0,
        playerStats: {},
        CACHE_DURATION: 300000
    }
};

// ==========================================
// GESTION DES ÉCRANS
// ==========================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showError(message) {
    const errorEl = document.getElementById('auth-error');
    errorEl.textContent = message;
    errorEl.classList.add('show');
    setTimeout(() => errorEl.classList.remove('show'), 3000);
}

// ==========================================
// AUTHENTIFICATION
// ==========================================

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
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;

    if (!username || username.length < 3) {
        showError('Le nom d\'utilisateur doit contenir au moins 3 caractères');
        return;
    }

    if (password.length < 6) {
        showError('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        await db.collection('players').doc(user.uid).set({
            username: username,
            email: email,
            trophies: 100,
            wins: 0,
            losses: 0,
            totalMatches: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Compte créé avec succès');
    } catch (error) {
        console.error('❌ Erreur inscription:', error);
        showError(error.message);
    }
});

document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        console.log('✅ Connexion réussie');
    } catch (error) {
        console.error('❌ Erreur connexion:', error);
        showError('Email ou mot de passe incorrect');
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error);
    }
});

auth.onAuthStateChanged(async (user) => {
    if (user) {
        GameState.currentUser = user;
        await loadPlayerData();
        showScreen('main-menu');
    } else {
        GameState.currentUser = null;
        GameState.playerData = null;
        showScreen('auth-screen');
    }
});

// ==========================================
// CHARGEMENT DES DONNÉES JOUEUR
// ==========================================

async function loadPlayerData() {
    try {
        await db.collection('players').doc(GameState.currentUser.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        db.collection('players').doc(GameState.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    GameState.playerData = { id: doc.id, ...doc.data() };
                    updatePlayerUI();
                }
            });
    } catch (error) {
        console.error('❌ Erreur chargement données:', error);
    }
}

function updatePlayerUI() {
    if (!GameState.playerData) return;

    document.getElementById('player-name').textContent = GameState.playerData.username;
    document.getElementById('player-trophies').textContent = GameState.playerData.trophies || 0;
    
    const avatar = document.getElementById('player-avatar');
    avatar.textContent = GameState.playerData.username.charAt(0).toUpperCase();
}

// ==========================================
// MATCHMAKING
// ==========================================

document.getElementById('play-btn').addEventListener('click', startMatchmaking);
document.getElementById('cancel-matchmaking').addEventListener('click', cancelMatchmaking);

async function startMatchmaking() {
    console.log('🔍 Recherche de match...');
    showScreen('matchmaking-screen');
    document.getElementById('mm-trophies').textContent = GameState.playerData.trophies || 0;

    try {
        const queueRef = rtdb.ref('matchmaking_queue');
        const playerQueueRef = queueRef.push();

        await playerQueueRef.set({
            uid: GameState.currentUser.uid,
            username: GameState.playerData.username,
            trophies: GameState.playerData.trophies || 0,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        const matchRef = rtdb.ref(`active_matches`);
        GameState.matchmakingListener = matchRef.on('child_added', async (snapshot) => {
            const match = snapshot.val();
            
            if (match.player1 === GameState.currentUser.uid || 
                match.player2 === GameState.currentUser.uid) {
                
                console.log('✅ Match trouvé!', snapshot.key);
                await playerQueueRef.remove();
                matchRef.off('child_added', GameState.matchmakingListener);
                startMatch(snapshot.key, match);
            }
        });

        findOpponent(playerQueueRef);

    } catch (error) {
        console.error('❌ Erreur matchmaking:', error);
        showScreen('main-menu');
    }
}

async function findOpponent(playerQueueRef) {
    const queueRef = rtdb.ref('matchmaking_queue');
    const queueSnapshot = await queueRef.once('value');
    const queue = queueSnapshot.val();

    if (!queue) {
        setTimeout(() => findOpponent(playerQueueRef), 2000);
        return;
    }

    const players = Object.entries(queue).filter(([key, player]) => 
        player.uid !== GameState.currentUser.uid &&
        Math.abs(player.trophies - (GameState.playerData.trophies || 0)) <= 200
    );

    if (players.length > 0) {
        const [opponentKey, opponent] = players[0];
        
        const matchRef = rtdb.ref('active_matches').push();
        await matchRef.set({
            player1: GameState.currentUser.uid,
            player2: opponent.uid,
            player1Username: GameState.playerData.username,
            player2Username: opponent.username,
            startTime: firebase.database.ServerValue.TIMESTAMP,
            status: 'active',
            gameState: {
                player1: { x: 100, y: 300, hp: 100 },
                player2: { x: 700, y: 300, hp: 100 },
                timeLeft: 180
            }
        });

        await playerQueueRef.remove();
        await rtdb.ref(`matchmaking_queue/${opponentKey}`).remove();
    } else {
        setTimeout(() => findOpponent(playerQueueRef), 2000);
    }
}

async function cancelMatchmaking() {
    console.log('❌ Matchmaking annulé');
    if (GameState.matchmakingListener) {
        rtdb.ref('active_matches').off('child_added', GameState.matchmakingListener);
    }
    
    const queueRef = rtdb.ref('matchmaking_queue');
    const snapshot = await queueRef.orderByChild('uid').equalTo(GameState.currentUser.uid).once('value');
    snapshot.forEach(child => child.ref.remove());
    
    showScreen('main-menu');
}

// ==========================================
// JEU - VARIABLES GLOBALES
// ==========================================

let canvas, ctx, player, opponent, gameTime, isPlayer1;
let keys = {};
let lastAttackTime = 0;
let lastSpecialTime = 0;
let matchEnded = false;

const ATTACK_COOLDOWN = 1000;
const SPECIAL_COOLDOWN = 5000;

// ==========================================
// DÉMARRAGE DU MATCH
// ==========================================

function startMatch(matchId, matchData) {
    console.log('🎮 Démarrage du match', matchId);
    GameState.currentMatch = { id: matchId, ...matchData };
    showScreen('game-screen');
    
    isPlayer1 = matchData.player1 === GameState.currentUser.uid;
    
    document.getElementById('player-game-name').textContent = isPlayer1 ? matchData.player1Username : matchData.player2Username;
    document.getElementById('opponent-game-name').textContent = isPlayer1 ? matchData.player2Username : matchData.player1Username;
    
    matchEnded = false;
    initGame(matchId, isPlayer1);
}

// ==========================================
// INITIALISATION DU JEU
// ==========================================

function initGame(matchId, isP1) {
    console.log('🎯 Initialisation du jeu, isPlayer1:', isP1);
    isPlayer1 = isP1;
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 200;
    
    // Position initiale
    player = {
        x: isPlayer1 ? 100 : canvas.width - 100,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
        hp: 100,
        radius: 25,
        color: '#FF3366',
        speed: 5
    };
    
    opponent = {
        x: isPlayer1 ? canvas.width - 100 : 100,
        y: canvas.height / 2,
        hp: 100,
        radius: 25,
        color: '#6C5CE7'
    };
    
    gameTime = 180;
    
    // ÉCOUTER LES CHANGEMENTS DE L'ADVERSAIRE
    const matchRef = rtdb.ref(`active_matches/${matchId}/gameState`);
    GameState.matchStateListener = matchRef.on('value', (snapshot) => {
        const state = snapshot.val();
        if (state) {
            updateGameState(state, isPlayer1);
        }
    });
    
    // CONTRÔLES CLAVIER
    setupKeyboardControls(matchId);
    
    // BOUCLE DE JEU
    GameState.gameLoop = setInterval(() => {
        updateGame();
        renderGame();
    }, 1000 / 60);
    
    // TIMER
    updateTimerDisplay();
    GameState.gameTimerInterval = setInterval(() => {
        gameTime--;
        updateTimerDisplay();
        
        if (gameTime <= 0) {
            console.log('⏰ Temps écoulé!');
            endMatch(matchId);
        }
    }, 1000);
}

function updateTimerDisplay() {
    const mins = Math.floor(gameTime / 60);
    const secs = gameTime % 60;
    document.getElementById('game-timer').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================
// MISE À JOUR DE L'ÉTAT DU JEU
// ==========================================

function updateGameState(state, isPlayer1) {
    if (!state) return;
    
    const playerState = isPlayer1 ? state.player1 : state.player2;
    const opponentState = isPlayer1 ? state.player2 : state.player1;
    
    // Mise à jour de l'adversaire
    if (opponentState) {
        opponent.x += (opponentState.x - opponent.x) * 0.3;
        opponent.y += (opponentState.y - opponent.y) * 0.3;
        opponent.hp = opponentState.hp || 0;
    }
    
    // Mise à jour de notre HP
    if (playerState) {
        player.hp = playerState.hp || 0;
    }
    
    // Mise à jour de l'affichage des HP
    const playerPercent = Math.max(0, Math.min(100, player.hp));
    const opponentPercent = Math.max(0, Math.min(100, opponent.hp));
    
    document.getElementById('player-hp').style.width = playerPercent + '%';
    document.getElementById('opponent-hp').style.width = opponentPercent + '%';
    
    // VÉRIFIER SI QUELQU'UN EST MORT
    if (player.hp <= 0 || opponent.hp <= 0) {
        console.log('💀 Quelqu\'un est mort! Player HP:', player.hp, 'Opponent HP:', opponent.hp);
        if (!matchEnded) {
            endMatch(GameState.currentMatch.id);
        }
    }
}

// ==========================================
// CONTRÔLES CLAVIER - ZQSD + AE
// ==========================================

function setupKeyboardControls(matchId) {
    console.log('⌨️ Contrôles clavier activés: ZQSD pour bouger, A pour attaquer, E pour spécial');
    
    // DÉTECTION DES TOUCHES
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        keys[key] = true;
        
        // ATTAQUE NORMALE (A)
        if (key === 'a') {
            performAttack(matchId, isPlayer1, 'normal');
        }
        
        // ATTAQUE SPÉCIALE (E)
        if (key === 'e') {
            performAttack(matchId, isPlayer1, 'special');
        }
    });
    
    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });
}

// ==========================================
// MISE À JOUR DU JEU
// ==========================================

function updateGame() {
    const speed = player.speed;
    
    // DÉPLACEMENTS ZQSD
    player.vx = 0;
    player.vy = 0;
    
    if (keys['z']) player.vy = -speed;
    if (keys['s']) player.vy = speed;
    if (keys['q']) player.vx = -speed;
    if (keys['d']) player.vx = speed;
    
    // APPLIQUER LE MOUVEMENT
    player.x += player.vx;
    player.y += player.vy;
    
    // LIMITES DU CANVAS
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
    
    // ENVOYER LA POSITION À FIREBASE
    if (player.vx !== 0 || player.vy !== 0) {
        updatePlayerPosition(GameState.currentMatch.id, isPlayer1);
    }
}

let lastPositionUpdate = 0;
function updatePlayerPosition(matchId, isPlayer1) {
    const now = Date.now();
    if (now - lastPositionUpdate < 50) return;
    lastPositionUpdate = now;
    
    const playerKey = isPlayer1 ? 'player1' : 'player2';
    rtdb.ref(`active_matches/${matchId}/gameState/${playerKey}`).update({
        x: Math.round(player.x),
        y: Math.round(player.y)
    });
}

// ==========================================
// ATTAQUES
// ==========================================

function performAttack(matchId, isPlayer1, type) {
    const now = Date.now();
    
    // COOLDOWN
    if (type === 'normal') {
        if (now - lastAttackTime < ATTACK_COOLDOWN) {
            console.log('⏳ Attaque normale en cooldown');
            return;
        }
        lastAttackTime = now;
    } else {
        if (now - lastSpecialTime < SPECIAL_COOLDOWN) {
            console.log('⏳ Attaque spéciale en cooldown');
            return;
        }
        lastSpecialTime = now;
    }
    
    // CALCULER LA DISTANCE
    const distance = Math.sqrt(
        Math.pow(player.x - opponent.x, 2) + 
        Math.pow(player.y - opponent.y, 2)
    );
    
    const attackRange = type === 'special' ? 150 : 100;
    const damage = type === 'special' ? 20 : 10;
    
    console.log(`⚔️ Attaque ${type}! Distance:`, distance, 'Portée:', attackRange);
    
    if (distance <= attackRange) {
        console.log(`💥 TOUCHÉ! Dégâts: ${damage}`);
        
        // EFFET VISUEL
        flashScreen(type === 'special' ? '#FDCB6E' : '#FF3366');
        
        // INFLIGER DES DÉGÂTS
        const opponentKey = isPlayer1 ? 'player2' : 'player1';
        
        rtdb.ref(`active_matches/${matchId}/gameState/${opponentKey}/hp`)
            .transaction((currentHP) => {
                if (currentHP === null) currentHP = 100;
                const newHP = Math.max(0, currentHP - damage);
                console.log(`❤️ HP adversaire: ${currentHP} → ${newHP}`);
                return newHP;
            });
    } else {
        console.log('❌ Trop loin pour toucher!');
    }
}

function flashScreen(color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// ==========================================
// RENDU DU JEU
// ==========================================

function renderGame() {
    // FOND
    ctx.fillStyle = '#0F0F1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // GRILLE
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // ADVERSAIRE
    ctx.fillStyle = opponent.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = opponent.color;
    ctx.beginPath();
    ctx.arc(opponent.x, opponent.y, opponent.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // JOUEUR
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ==========================================
// FIN DU MATCH
// ==========================================

async function endMatch(matchId) {
    if (matchEnded) {
        console.log('⚠️ Match déjà terminé');
        return;
    }
    matchEnded = true;
    
    console.log('🏁 Fin du match!');
    
    cleanupGame();
    
    // MARQUER COMME TERMINÉ
    await rtdb.ref(`active_matches/${matchId}/status`).set('finished');
    
    // DÉTERMINER LE GAGNANT
    const victory = player.hp > opponent.hp;
    console.log(victory ? '🎉 VICTOIRE!' : '💔 DÉFAITE', `(${player.hp} HP vs ${opponent.hp} HP)`);
    
    // CALCUL DES TROPHÉES
    const trophyChange = victory ? 10 : -5;
    
    // MISE À JOUR DES STATS
    await updatePlayerStats(victory, trophyChange);
    
    // SUPPRIMER LE MATCH
    setTimeout(async () => {
        await rtdb.ref(`active_matches/${matchId}`).remove();
    }, 2000);
    
    // AFFICHER LE RÉSULTAT
    showResult(victory, trophyChange);
}

function cleanupGame() {
    console.log('🧹 Nettoyage du jeu');
    
    if (GameState.gameLoop) {
        clearInterval(GameState.gameLoop);
        GameState.gameLoop = null;
    }
    
    if (GameState.gameTimerInterval) {
        clearInterval(GameState.gameTimerInterval);
        GameState.gameTimerInterval = null;
    }
    
    if (GameState.matchStateListener && GameState.currentMatch) {
        rtdb.ref(`active_matches/${GameState.currentMatch.id}/gameState`).off('value', GameState.matchStateListener);
        GameState.matchStateListener = null;
    }
    
    keys = {};
}

async function updatePlayerStats(victory, trophyChange) {
    const playerRef = db.collection('players').doc(GameState.currentUser.uid);
    
    const currentTrophies = GameState.playerData.trophies || 0;
    const newTrophies = Math.max(0, currentTrophies + trophyChange);
    
    console.log(`🏆 Trophées: ${currentTrophies} ${trophyChange > 0 ? '+' : ''}${trophyChange} = ${newTrophies}`);
    
    await playerRef.update({
        trophies: newTrophies,
        totalMatches: firebase.firestore.FieldValue.increment(1),
        wins: victory ? firebase.firestore.FieldValue.increment(1) : firebase.firestore.FieldValue.increment(0),
        losses: !victory ? firebase.firestore.FieldValue.increment(1) : firebase.firestore.FieldValue.increment(0)
    });
}

function showResult(victory, trophyChange) {
    showScreen('result-screen');
    
    const title = document.getElementById('result-title');
    title.textContent = victory ? 'VICTOIRE!' : 'DÉFAITE';
    title.className = victory ? 'result-title victory' : 'result-title defeat';
    
    const trophyChangeText = trophyChange > 0 ? `+${trophyChange}` : trophyChange;
    const newTotal = Math.max(0, (GameState.playerData.trophies || 0) + trophyChange);
    
    document.getElementById('result-trophies').textContent = `${trophyChangeText} 🏆`;
    document.getElementById('result-total').textContent = `${newTotal} 🏆`;
}

document.getElementById('return-menu-btn').addEventListener('click', () => {
    showScreen('main-menu');
});

// ==========================================
// CLASSEMENT
// ==========================================

document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
document.getElementById('close-leaderboard').addEventListener('click', () => {
    showScreen('main-menu');
});

async function showLeaderboard() {
    showScreen('leaderboard-screen');
    
    const now = Date.now();
    if (GameState.cache.leaderboard && 
        (now - GameState.cache.leaderboardTimestamp) < GameState.cache.CACHE_DURATION) {
        renderLeaderboard(GameState.cache.leaderboard);
        return;
    }
    
    try {
        const snapshot = await db.collection('players')
            .orderBy('trophies', 'desc')
            .limit(50)
            .get();
        
        const leaderboard = [];
        snapshot.forEach(doc => {
            leaderboard.push({ id: doc.id, ...doc.data() });
        });
        
        GameState.cache.leaderboard = leaderboard;
        GameState.cache.leaderboardTimestamp = now;
        
        renderLeaderboard(leaderboard);
    } catch (error) {
        console.error('❌ Erreur classement:', error);
    }
}

function renderLeaderboard(players) {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    
    players.forEach((player, index) => {
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        
        const isCurrentPlayer = player.id === GameState.currentUser.uid;
        if (isCurrentPlayer) {
            item.style.background = 'rgba(255, 51, 102, 0.2)';
        }
        
        item.innerHTML = `
            <span class="leaderboard-rank ${index < 3 ? 'top3' : ''}">${index + 1}</span>
            <span class="leaderboard-player">${player.username}${isCurrentPlayer ? ' (Vous)' : ''}</span>
            <span class="leaderboard-trophies">🏆 ${player.trophies || 0}</span>
        `;
        
        list.appendChild(item);
    });
}

// ==========================================
// PROFIL
// ==========================================

document.getElementById('profile-btn').addEventListener('click', () => {
    alert('Profil - Fonctionnalité à venir!');
});

// ==========================================
// INITIALISATION
// ==========================================

window.addEventListener('load', () => {
    console.log('🎮 WARSLIGUE chargé!');
    showScreen('loading-screen');
    
    setTimeout(() => {
        if (auth.currentUser) {
            showScreen('main-menu');
        } else {
            showScreen('auth-screen');
        }
    }, 1500);
});

window.addEventListener('beforeunload', () => {
    cleanupGame();
    if (GameState.currentMatch) {
        rtdb.ref(`active_matches/${GameState.currentMatch.id}`).remove();
    }
});