// ==========================================
// WARSLIGUE — league.js (MODE LIGUE PvP)
// ==========================================

/* =============================================
   LIGUES
   ============================================= */
const LEAGUES = {
    bronze: { name: 'Bronze', min: 0, max: 500, color: '#CD7F32' },
    silver: { name: 'Argent', min: 500, max: 1000, color: '#C0C0C0' },
    gold: { name: 'Or', min: 1000, max: 2500, color: '#FFD700' },
    platinum: { name: 'Platine', min: 2500, max: 5000, color: '#E5E4E2' },
    diamond: { name: 'Diamant', min: 5000, max: Infinity, color: '#B9F2FF' }
};

function getLeague(trophies) {
    for (const [key, league] of Object.entries(LEAGUES)) {
        if (trophies >= league.min && trophies <= league.max) {
            return league;
        }
    }
    return LEAGUES.bronze;
}

function updateLeagueDisplay() {
    if (!G.playerData) return;
    const league = getLeague(G.playerData.trophies || 0);
    document.getElementById('player-league').textContent = league.name;
    document.getElementById('player-league').style.color = league.color;
}

/* =============================================
   MATCHMAKING
   ============================================= */
let matchmakingRef = null;
let currentMatchRef = null;
let opponentData = null;
let isHost = false;
let matchmakingTimer = null;
let matchmakingStartTime = 0;

function startLeagueMatchmaking() {
    if (!G.user) return;

    // Afficher écran de matchmaking
    showScreen('matchmaking-screen');

    // Démarrer le timer
    matchmakingStartTime = Date.now();
    matchmakingTimer = setInterval(updateMatchmakingTimer, 1000);
    updateMatchmakingTimer();

    // Calculer ligue
    const league = getLeague(G.playerData.trophies || 0);

    // Chercher une room disponible dans la même ligue
    const leagueRoomsRef = RTDB.ref(`league/${league.name.toLowerCase()}/rooms`);
    leagueRoomsRef.once('value', (snapshot) => {
        const rooms = snapshot.val();
        let joined = false;

        if (rooms) {
            // Rejoindre une room existante
            for (const roomId in rooms) {
                const room = rooms[roomId];
                if (room.status === 'waiting' && room.host !== G.user.uid) {
                    joinRoom(roomId, league.name.toLowerCase());
                    joined = true;
                    break;
                }
            }
        }

        if (!joined) {
            // Créer une nouvelle room
            createRoom(league.name.toLowerCase());
        }
    });
}

function updateMatchmakingTimer() {
    const elapsed = Math.floor((Date.now() - matchmakingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('matchmaking-timer').textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function cancelMatchmaking() {
    if (matchmakingRef) {
        matchmakingRef.off();
        if (isHost) {
            matchmakingRef.remove();
        } else {
            matchmakingRef.update({ status: 'cancelled' });
        }
        matchmakingRef = null;
    }
    clearInterval(matchmakingTimer);
    showScreen('main-menu');
}

function createRoom(league) {
    const roomId = RTDB.ref().push().key;
    const roomRef = RTDB.ref(`league/${league}/rooms/${roomId}`);
    roomRef.set({
        host: G.user.uid,
        hostName: G.playerData.username,
        hostChar: G.selectedChar,
        status: 'waiting',
        createdAt: Date.now()
    });

    matchmakingRef = roomRef;
    isHost = true;

    // Écouter pour un joueur rejoignant
    roomRef.on('value', (snapshot) => {
        const room = snapshot.val();
        if (room && room.guest) {
            // Match trouvé
            clearInterval(matchmakingTimer);
            startLeagueMatch(roomId, league, true);
        }
    });
}

function joinRoom(roomId, league) {
    const roomRef = RTDB.ref(`league/${league}/rooms/${roomId}`);
    roomRef.update({
        guest: G.user.uid,
        guestName: G.playerData.username,
        guestChar: G.selectedChar,
        status: 'starting'
    });

    matchmakingRef = roomRef;
    isHost = false;

    // Match trouvé
    clearInterval(matchmakingTimer);
    startLeagueMatch(roomId, league, false);
}

function startLeagueMatch(roomId, league, host) {
    // Masquer matchmaking
    showScreen('game-screen');

    // Initialiser le match PvP
    currentMatchRef = RTDB.ref(`league/${league}/matches/${roomId}`);
    G.gameMode = 'league';

    // Récupérer les données de l'adversaire depuis la room
    const roomRef = RTDB.ref(`league/${league}/rooms/${roomId}`);
    roomRef.once('value', (snapshot) => {
        const room = snapshot.val();
        if (room) {
            if (host) {
                opponentData = {
                    name: room.guestName,
                    char: room.guestChar,
                    uid: room.guest
                };
            } else {
                opponentData = {
                    name: room.hostName,
                    char: room.hostChar,
                    uid: room.host
                };
            }
        }
        // Démarrer le mode Ligue
        startLeagueMode(host);
    });
}

function startLeagueMode(isHost) {
    if (!G.playerData) return;

    G.matchEnded         = false;
    G.gameTime           = 0;
    G.zombies            = []; // Pas de zombies en PvP
    G.projectiles        = [];
    G.particles          = [];

    document.getElementById('player-game-name').textContent   = G.playerData.username;
    document.getElementById('opponent-game-name').textContent = opponentData ? opponentData.name : 'Adversaire';

    // Montrer le HUD adversaire en mode Ligue
    document.querySelector('.hud-opponent').style.visibility = 'visible';
    document.querySelector('.hud-center .timer-label').textContent = 'LIGUE';

    G.matchId = 'league_' + Date.now();

    initLeagueGame(isHost);
    console.log('🏆 Mode Ligue démarré !');
}

function initLeagueGame(isHost) {
    G.canvas = document.getElementById('game-canvas');
    G.ctx    = G.canvas.getContext('2d');
    resizeCanvas();

    if (G.resizeFn) window.removeEventListener('resize', G.resizeFn);
    G.resizeFn = resizeCanvas;
    window.addEventListener('resize', G.resizeFn);

    const myKey = G.selectedChar || 'warrior';
    const myC   = getCharacterWithUpgrades(myKey, G.playerData);

    G.player = {
        x: isHost ? 100 : 700,
        y: 300,
        hp: myC.hp, maxHp: myC.hp,
        radius: myC.radius, color: myC.color, glowColor: myC.glowColor,
        speed: myC.speed,
        damage: myC.damage,
        lastAtk: 0, lastSpe: 0,
        cdAtk: myC.cdAtk, cdSpe: myC.cdSpe,
        char: myKey
    };

    // Adversaire
    const oppKey = opponentData.char || 'warrior';
    const oppC   = getCharacterWithUpgrades(oppKey, { powerPoints: {} }); // Pas d'upgrades pour l'adversaire pour simplifier

    G.opponent = {
        x: isHost ? 700 : 100,
        y: 300,
        hp: oppC.hp, maxHp: oppC.hp,
        radius: oppC.radius, color: oppC.color, glowColor: oppC.glowColor,
        speed: oppC.speed,
        damage: oppC.damage,
        lastAtk: 0, lastSpe: 0,
        cdAtk: oppC.cdAtk, cdSpe: oppC.cdSpe,
        char: oppKey
    };

    // Initialiser les contrôles
    initControls();

    // Démarrer la boucle de jeu
    if (G.rafId) cancelAnimationFrame(G.rafId);
    G.rafId = requestAnimationFrame(gameLoop);
}

function initLeaguePlayers(isHost) {
    // Les joueurs sont initialisés dans initLeagueGame
}

function updateOpponent(match) {
    if (!match) return;
    if (isHost) {
        if (match.guestData) {
            G.opponent.x = match.guestData.x;
            G.opponent.y = match.guestData.y;
            G.opponent.hp = match.guestData.hp;
        }
    } else {
        if (match.hostData) {
            G.opponent.x = match.hostData.x;
            G.opponent.y = match.hostData.y;
            G.opponent.hp = match.hostData.hp;
        }
    }
}

function sendPlayerData() {
    if (!currentMatchRef || !G.player) return;

    const playerData = {
        x: G.player.x,
        y: G.player.y,
        hp: G.player.hp,
        char: G.player.char
    };

    if (isHost) {
        currentMatchRef.update({ hostData: playerData });
    } else {
        currentMatchRef.update({ guestData: playerData });
    }
}

function updateLeagueMode() {
    // Envoyer les données du joueur toutes les frames (ou moins fréquemment pour optimiser)
    sendPlayerData();

    // Recevoir les données de l'adversaire
    if (currentMatchRef) {
        currentMatchRef.on('value', (snapshot) => {
            const match = snapshot.val();
            if (match) {
                updateOpponent(match);
            }
        });
    }

    // Gérer les collisions entre joueurs
    if (G.player && G.opponent) {
        const dx = G.opponent.x - G.player.x;
        const dy = G.opponent.y - G.player.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // Si collision, attaquer
        if (dist < G.player.radius + G.opponent.radius) {
            if (Date.now() - G.player.lastAtk > G.player.cdAtk) {
                G.opponent.hp -= G.player.damage;
                G.player.lastAtk = Date.now();
                // Ajouter des particules ou effets
                spawnHitParticles(G.opponent.x, G.opponent.y, 'normal');
            }
        }
    }

    // Mettre à jour la barre de vie de l'adversaire
    if (G.opponent) {
        setBar('opponent-hp', 'opponent-hp-text', G.opponent.hp, G.opponent.maxHp);
    }

    // Vérifier la fin du match
    if (G.opponent && G.opponent.hp <= 0) {
        endLeagueMatch(true); // Victoire
    } else if (G.player.hp <= 0) {
        endLeagueMatch(false); // Défaite
    }
}

function endLeagueMatch(victory) {
    G.matchEnded = true;
    // Calculer les récompenses
    const trophyChange = victory ? 10 : -5;
    const goldReward = victory ? 50 : 10;

    // Mettre à jour les données du joueur
    const newTrophies = (G.playerData.trophies || 0) + trophyChange;
    const newGold = (G.playerData.gold || 0) + goldReward;

    FSDB.collection('players').doc(G.user.uid).update({
        trophies: newTrophies,
        gold: newGold
    });

    // Afficher l'écran de résultat
    showResultScreen(victory, trophyChange, goldReward, newTrophies);
}

function showResultScreen(victory, trophyChange, goldReward, newTrophies) {
    // Masquer le jeu
    showScreen('result-screen');

    // Mettre à jour le titre
    const title = victory ? 'VICTOIRE !' : 'DÉFAITE';
    document.getElementById('result-title').textContent = title;
    document.getElementById('result-title').style.color = victory ? '#FFD700' : '#FF3366';

    // Mettre à jour les stats
    document.getElementById('result-trophies').textContent = (trophyChange > 0 ? '+' : '') + trophyChange + ' 🏆';
    document.getElementById('result-trophies').className = 'stat-value ' + (trophyChange > 0 ? 'trophy-gain' : 'trophy-loss');
    
    document.getElementById('result-gold').textContent = '+' + goldReward + ' 💰';
    document.getElementById('result-total').textContent = newTrophies + ' 🏆';

    // Mettre à jour les données globales
    G.playerData.trophies = newTrophies;
    G.playerData.gold = (G.playerData.gold || 0) + goldReward;
    updateLeagueDisplay();
}

/* =============================================
   ÉVÉNEMENTS
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    const leagueBtn = document.getElementById('league-btn');
    if (leagueBtn) {
        leagueBtn.addEventListener('click', startLeagueMatchmaking);
    }

    const cancelBtn = document.getElementById('cancel-matchmaking');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelMatchmaking);
    }
});

// Mettre à jour la ligue quand les données du joueur changent
// (Appelé depuis java.js ou autre)