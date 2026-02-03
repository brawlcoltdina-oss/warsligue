// ==========================================
// WARSLIGUE - CONFIGURATION & INITIALISATION
// ==========================================

// CONFIGURATION FIREBASE
// Remplacez ces valeurs par votre configuration Firebase
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

// Initialisation Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const rtdb = firebase.database();

// ==========================================
// GESTION DE L'ÉTAT DU JEU
// ==========================================

const GameState = {
    currentUser: null,
    playerData: null,
    currentMatch: null,
    gameLoop: null,
    matchmakingListener: null,
    
    // Cache local pour réduire les requêtes
    cache: {
        leaderboard: null,
        leaderboardTimestamp: 0,
        playerStats: {},
        CACHE_DURATION: 300000 // 5 minutes
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

// Basculer entre connexion et inscription
document.getElementById('show-register').addEventListener('click', () => {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('register-form').classList.add('active');
});

document.getElementById('show-login').addEventListener('click', () => {
    document.getElementById('register-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
});

// Inscription
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
        // Créer le compte
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Créer le profil utilisateur dans Firestore
        await db.collection('players').doc(user.uid).set({
            username: username,
            email: email,
            trophies: 0,
            wins: 0,
            losses: 0,
            totalMatches: 0,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('Compte créé avec succès');
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        showError(error.message);
    }
});

// Connexion
document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        console.error('Erreur de connexion:', error);
        showError('Email ou mot de passe incorrect');
    }
});

// Déconnexion
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error('Erreur de déconnexion:', error);
    }
});

// Observateur d'état d'authentification
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
        // Mise à jour de la dernière connexion
        await db.collection('players').doc(GameState.currentUser.uid).update({
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Écouter les changements du profil joueur en temps réel
        db.collection('players').doc(GameState.currentUser.uid)
            .onSnapshot((doc) => {
                if (doc.exists) {
                    GameState.playerData = { id: doc.id, ...doc.data() };
                    updatePlayerUI();
                }
            });
    } catch (error) {
        console.error('Erreur de chargement des données:', error);
    }
}

function updatePlayerUI() {
    if (!GameState.playerData) return;

    document.getElementById('player-name').textContent = GameState.playerData.username;
    document.getElementById('player-trophies').textContent = GameState.playerData.trophies;
    
    // Avatar avec initiale
    const avatar = document.getElementById('player-avatar');
    avatar.textContent = GameState.playerData.username.charAt(0).toUpperCase();
}

// ==========================================
// MATCHMAKING
// ==========================================

document.getElementById('play-btn').addEventListener('click', startMatchmaking);
document.getElementById('cancel-matchmaking').addEventListener('click', cancelMatchmaking);

async function startMatchmaking() {
    showScreen('matchmaking-screen');
    document.getElementById('mm-trophies').textContent = GameState.playerData.trophies;

    try {
        // Ajouter le joueur à la file d'attente
        const queueRef = rtdb.ref('matchmaking_queue');
        const playerQueueRef = queueRef.push();

        await playerQueueRef.set({
            uid: GameState.currentUser.uid,
            username: GameState.playerData.username,
            trophies: GameState.playerData.trophies,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });

        // Écouter les matchs créés
        const matchRef = rtdb.ref(`active_matches`);
        GameState.matchmakingListener = matchRef.on('child_added', async (snapshot) => {
            const match = snapshot.val();
            
            // Vérifier si ce match concerne ce joueur
            if (match.player1 === GameState.currentUser.uid || 
                match.player2 === GameState.currentUser.uid) {
                
                // Supprimer de la queue
                await playerQueueRef.remove();
                
                // Arrêter l'écoute
                matchRef.off('child_added', GameState.matchmakingListener);
                
                // Démarrer le match
                startMatch(snapshot.key, match);
            }
        });

        // Chercher un adversaire
        findOpponent(playerQueueRef);

    } catch (error) {
        console.error('Erreur matchmaking:', error);
        showScreen('main-menu');
    }
}

async function findOpponent(playerQueueRef) {
    const queueRef = rtdb.ref('matchmaking_queue');
    const queueSnapshot = await queueRef.once('value');
    const queue = queueSnapshot.val();

    if (!queue) return;

    const players = Object.entries(queue).filter(([key, player]) => 
        player.uid !== GameState.currentUser.uid &&
        Math.abs(player.trophies - GameState.playerData.trophies) <= 100
    );

    if (players.length > 0) {
        // Adversaire trouvé !
        const [opponentKey, opponent] = players[0];
        
        // Créer le match
        const matchRef = rtdb.ref('active_matches').push();
        await matchRef.set({
            player1: GameState.currentUser.uid,
            player2: opponent.uid,
            player1Username: GameState.playerData.username,
            player2Username: opponent.username,
            startTime: firebase.database.ServerValue.TIMESTAMP,
            status: 'active',
            gameState: {
                player1: { x: 100, y: 300, hp: 100, score: 0 },
                player2: { x: 700, y: 300, hp: 100, score: 0 },
                timeLeft: 180
            }
        });

        // Supprimer les deux joueurs de la queue
        await playerQueueRef.remove();
        await rtdb.ref(`matchmaking_queue/${opponentKey}`).remove();
    } else {
        // Réessayer dans 2 secondes
        setTimeout(() => findOpponent(playerQueueRef), 2000);
    }
}

async function cancelMatchmaking() {
    if (GameState.matchmakingListener) {
        rtdb.ref('active_matches').off('child_added', GameState.matchmakingListener);
    }
    
    // Supprimer de la queue
    const queueRef = rtdb.ref('matchmaking_queue');
    const snapshot = await queueRef.orderByChild('uid').equalTo(GameState.currentUser.uid).once('value');
    snapshot.forEach(child => child.ref.remove());
    
    showScreen('main-menu');
}

// ==========================================
// JEU
// ==========================================

function startMatch(matchId, matchData) {
    GameState.currentMatch = { id: matchId, ...matchData };
    showScreen('game-screen');
    
    // Déterminer si on est player1 ou player2
    const isPlayer1 = matchData.player1 === GameState.currentUser.uid;
    
    // Afficher les noms
    document.getElementById('player-game-name').textContent = isPlayer1 ? matchData.player1Username : matchData.player2Username;
    document.getElementById('opponent-game-name').textContent = isPlayer1 ? matchData.player2Username : matchData.player1Username;
    
    // Initialiser le canvas
    initGame(matchId, isPlayer1);
}

// ==========================================
// MOTEUR DE JEU (CANVAS)
// ==========================================

let canvas, ctx, player, opponent, gameTime;

function initGame(matchId, isPlayer1) {
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // Adapter le canvas à la fenêtre
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight - 200; // Espace pour HUD et contrôles
    
    // Position initiale
    player = {
        x: isPlayer1 ? 100 : canvas.width - 100,
        y: canvas.height / 2,
        vx: 0,
        vy: 0,
        hp: 100,
        radius: 25,
        color: '#FF3366'
    };
    
    opponent = {
        x: isPlayer1 ? canvas.width - 100 : 100,
        y: canvas.height / 2,
        hp: 100,
        radius: 25,
        color: '#6C5CE7'
    };
    
    gameTime = 180; // 3 minutes
    
    // Écouter les mises à jour du match
    const matchRef = rtdb.ref(`active_matches/${matchId}/gameState`);
    matchRef.on('value', (snapshot) => {
        const state = snapshot.val();
        if (state) {
            updateGameState(state, isPlayer1);
        }
    });
    
    // Contrôles
    setupControls(matchId, isPlayer1);
    
    // Démarrer la boucle de jeu
    GameState.gameLoop = setInterval(() => {
        updateGame();
        renderGame();
    }, 1000 / 60); // 60 FPS
    
    // Timer du match
    const timerInterval = setInterval(() => {
        gameTime--;
        document.getElementById('game-timer').textContent = formatTime(gameTime);
        
        if (gameTime <= 0) {
            clearInterval(timerInterval);
            endMatch(matchId);
        }
    }, 1000);
}

function updateGameState(state, isPlayer1) {
    const playerState = isPlayer1 ? state.player1 : state.player2;
    const opponentState = isPlayer1 ? state.player2 : state.player1;
    
    // Mise à jour de l'adversaire (interpolation douce)
    opponent.x += (opponentState.x - opponent.x) * 0.2;
    opponent.y += (opponentState.y - opponent.y) * 0.2;
    opponent.hp = opponentState.hp;
    
    // Mise à jour HP
    updateHP(playerState.hp, opponentState.hp);
}

function updateHP(playerHP, opponentHP) {
    document.getElementById('player-hp').style.width = playerHP + '%';
    document.getElementById('opponent-hp').style.width = opponentHP + '%';
}

function updateGame() {
    // Physique simple
    player.x += player.vx;
    player.y += player.vy;
    
    // Friction
    player.vx *= 0.9;
    player.vy *= 0.9;
    
    // Limites du canvas
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
}

function renderGame() {
    // Effacer le canvas
    ctx.fillStyle = '#0F0F1E';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessiner la grille
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
    
    // Dessiner l'adversaire
    ctx.fillStyle = opponent.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = opponent.color;
    ctx.beginPath();
    ctx.arc(opponent.x, opponent.y, opponent.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Dessiner le joueur
    ctx.fillStyle = player.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
}

// ==========================================
// CONTRÔLES
// ==========================================

function setupControls(matchId, isPlayer1) {
    const joystick = document.getElementById('joystick');
    const knob = joystick.querySelector('.joystick-knob');
    
    let isDragging = false;
    let joystickCenter = { x: 0, y: 0 };
    
    function startDrag(e) {
        isDragging = true;
        const rect = joystick.getBoundingClientRect();
        joystickCenter = {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }
    
    function drag(e) {
        if (!isDragging) return;
        
        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - joystickCenter.x;
        const dy = touch.clientY - joystickCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 35;
        
        const angle = Math.atan2(dy, dx);
        const clampedDistance = Math.min(distance, maxDistance);
        
        knob.style.transform = `translate(-50%, -50%) translate(${Math.cos(angle) * clampedDistance}px, ${Math.sin(angle) * clampedDistance}px)`;
        
        // Déplacer le joueur
        const speed = 5;
        player.vx = Math.cos(angle) * (clampedDistance / maxDistance) * speed;
        player.vy = Math.sin(angle) * (clampedDistance / maxDistance) * speed;
        
        // Envoyer la position au serveur (throttled)
        updatePlayerPosition(matchId, isPlayer1);
    }
    
    function endDrag() {
        isDragging = false;
        knob.style.transform = 'translate(-50%, -50%)';
        player.vx = 0;
        player.vy = 0;
    }
    
    joystick.addEventListener('mousedown', startDrag);
    joystick.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);
    
    // Boutons d'action
    document.getElementById('attack-btn').addEventListener('click', () => {
        performAttack(matchId, isPlayer1, 'normal');
    });
    
    document.getElementById('special-btn').addEventListener('click', () => {
        performAttack(matchId, isPlayer1, 'special');
    });
}

// Throttle pour limiter les mises à jour
let lastPositionUpdate = 0;
function updatePlayerPosition(matchId, isPlayer1) {
    const now = Date.now();
    if (now - lastPositionUpdate < 50) return; // Max 20 updates/sec
    lastPositionUpdate = now;
    
    const playerKey = isPlayer1 ? 'player1' : 'player2';
    rtdb.ref(`active_matches/${matchId}/gameState/${playerKey}`).update({
        x: Math.round(player.x),
        y: Math.round(player.y)
    });
}

function performAttack(matchId, isPlayer1, type) {
    const distance = Math.sqrt(
        Math.pow(player.x - opponent.x, 2) + 
        Math.pow(player.y - opponent.y, 2)
    );
    
    const attackRange = type === 'special' ? 150 : 100;
    
    if (distance <= attackRange) {
        const damage = type === 'special' ? 15 : 10;
        const opponentKey = isPlayer1 ? 'player2' : 'player1';
        
        rtdb.ref(`active_matches/${matchId}/gameState/${opponentKey}/hp`)
            .transaction((currentHP) => {
                return Math.max(0, (currentHP || 100) - damage);
            });
    }
}

// ==========================================
// FIN DE MATCH
// ==========================================

async function endMatch(matchId) {
    // Arrêter la boucle de jeu
    if (GameState.gameLoop) {
        clearInterval(GameState.gameLoop);
    }
    
    // Déterminer le gagnant
    const isPlayer1 = GameState.currentMatch.player1 === GameState.currentUser.uid;
    const playerHP = isPlayer1 ? 
        document.getElementById('player-hp').style.width : 
        document.getElementById('opponent-hp').style.width;
    const opponentHP = isPlayer1 ? 
        document.getElementById('opponent-hp').style.width : 
        document.getElementById('player-hp').style.width;
    
    const playerHPValue = parseInt(playerHP);
    const opponentHPValue = parseInt(opponentHP);
    
    const victory = playerHPValue > opponentHPValue;
    const trophyChange = victory ? 8 : -5;
    
    // Mettre à jour les stats
    await updatePlayerStats(victory, trophyChange);
    
    // Supprimer le match
    await rtdb.ref(`active_matches/${matchId}`).remove();
    
    // Afficher le résultat
    showResult(victory, trophyChange);
}

async function updatePlayerStats(victory, trophyChange) {
    const playerRef = db.collection('players').doc(GameState.currentUser.uid);
    
    await playerRef.update({
        trophies: firebase.firestore.FieldValue.increment(trophyChange),
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
    document.getElementById('result-trophies').textContent = `${trophyChangeText} 🏆`;
    document.getElementById('result-total').textContent = `${GameState.playerData.trophies + trophyChange} 🏆`;
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
    
    // Vérifier le cache
    const now = Date.now();
    if (GameState.cache.leaderboard && 
        (now - GameState.cache.leaderboardTimestamp) < GameState.cache.CACHE_DURATION) {
        renderLeaderboard(GameState.cache.leaderboard);
        return;
    }
    
    // Charger depuis Firestore
    try {
        const snapshot = await db.collection('players')
            .orderBy('trophies', 'desc')
            .limit(50)
            .get();
        
        const leaderboard = [];
        snapshot.forEach(doc => {
            leaderboard.push({ id: doc.id, ...doc.data() });
        });
        
        // Mettre en cache
        GameState.cache.leaderboard = leaderboard;
        GameState.cache.leaderboardTimestamp = now;
        
        renderLeaderboard(leaderboard);
    } catch (error) {
        console.error('Erreur chargement classement:', error);
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
            <span class="leaderboard-trophies">🏆 ${player.trophies}</span>
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
// UTILITAIRES
// ==========================================

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// ==========================================
// INITIALISATION
// ==========================================

window.addEventListener('load', () => {
    showScreen('loading-screen');
    
    // Simuler le chargement
    setTimeout(() => {
        if (auth.currentUser) {
            showScreen('main-menu');
        } else {
            showScreen('auth-screen');
        }
    }, 1500);
});

// Nettoyer les listeners à la fermeture
window.addEventListener('beforeunload', () => {
    if (GameState.currentMatch) {
        rtdb.ref(`active_matches/${GameState.currentMatch.id}`).remove();
    }
});