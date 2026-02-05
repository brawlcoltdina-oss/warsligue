// ==========================================
// WARSLIGUE — MATCHMAKING SYSTEM (RÉPARATION COMPLÈTE)
// ==========================================

console.log('🚀 MATCHMAKING.JS CHARGÉ !');
console.log('G existe ?', typeof G !== 'undefined');
console.log('RTDB existe ?', typeof RTDB !== 'undefined');

/* =============================================
   BOUTON PLAY — LANCER LE MATCHMAKING
   ============================================= */
document.getElementById('play-btn').addEventListener('click', startMatchmaking);

function startMatchmaking() {
    console.log('🎮 MATCHMAKING DÉMARRÉ');
    
    if (!G.user || !G.playerData) {
        showError('Vous devez être connecté');
        return;
    }

    // Nettoyer tout état précédent SAUF les notifications
    if (G.myQueueKey) {
        RTDB.ref('matchmaking_queue/' + G.myQueueKey).remove();
        G.myQueueKey = null;
    }
    
    if (G.mmChildListenerRef && G.mmChildListener) {
        G.mmChildListenerRef.off('child_added', G.mmChildListener);
        G.mmChildListenerRef = null;
        G.mmChildListener = null;
    }
    
    clearTimeout(G.mmSearchTimer);
    clearInterval(G.mmCountdownId);
    
    // Afficher l'écran de matchmaking
    showScreen('matchmaking-screen');
    
    // Afficher les trophées du joueur
    document.getElementById('mm-trophies').textContent = G.playerData.trophies || 0;
    
    // Démarrer le timer visuel
    G.mmSeconds = 0;
    startMatchmakingTimer();
    
    // Écouter les notifications de match (pour le joueur 2)
    listenForMatchNotification();
    
    // Créer une entrée dans la queue
    const queueData = {
        userId: G.user.uid,
        username: G.playerData.username || 'Joueur',
        trophies: G.playerData.trophies || 0,
        selectedCharacter: G.selectedChar,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        inMatch: false  // Drapeau pour éviter les doubles matchs
    };
    
    // Ajouter à la queue de matchmaking
    const queueRef = RTDB.ref('matchmaking_queue').push();
    G.myQueueKey = queueRef.key;
    
    queueRef.set(queueData).then(() => {
        console.log('✅ Ajouté à la queue:', G.myQueueKey);
        
        // Chercher un adversaire (joueur 1 uniquement)
        searchForOpponent();
        
    }).catch(err => {
        console.error('❌ Erreur queue:', err);
        showError('Erreur de connexion');
        stopMatchmaking();
    });
}

/* =============================================
   ÉCOUTER LES NOTIFICATIONS DE MATCH (JOUEUR 2)
   ============================================= */
function listenForMatchNotification() {
    if (!G.user) return;
    
    const notifRef = RTDB.ref('match_notifications/' + G.user.uid);
    
    G.matchNotificationListener = notifRef.on('value', async (snapshot) => {
        const notif = snapshot.val();
        
        if (!notif || !notif.matchId) return;
        
        console.log('🔔 NOTIFICATION DE MATCH REÇUE:', notif.matchId);
        
        // Arrêter le matchmaking
        stopMatchmaking();
        
        // Définir l'ID du match et que je suis le joueur 2
        G.matchId = notif.matchId;
        G.isPlayer1 = false;
        
        // Supprimer la notification
        notifRef.remove();
        
        // Rejoindre le match
        console.log('🎮 Rejoindre le match en tant que joueur 2');
        initGame();
    });
}

/* =============================================
   RECHERCHE D'ADVERSAIRE
   ============================================= */
function searchForOpponent() {
    console.log('🔍 Recherche adversaire...');
    
    const queueRef = RTDB.ref('matchmaking_queue');
    
    // Écouter les nouveaux joueurs dans la queue
    G.mmChildListenerRef = queueRef;
    G.mmChildListener = queueRef.on('child_added', async (snapshot) => {
        const opponentKey = snapshot.key;
        const opponentData = snapshot.val();
        
        // Ne pas se matcher avec soi-même
        if (opponentKey === G.myQueueKey) return;
        
        // Vérifier si l'adversaire est déjà en match
        if (opponentData.inMatch) {
            console.log('⚠️ Adversaire déjà en match, skip');
            return;
        }
        
        console.log('👀 Adversaire potentiel trouvé:', opponentData.username);
        
        // Vérifier si l'adversaire est dans une plage acceptable de trophées
        const myTrophies = G.playerData.trophies || 0;
        const oppTrophies = opponentData.trophies || 0;
        const trophyDiff = Math.abs(myTrophies - oppTrophies);
        
        // Accepter si différence < 200 trophées (ou après 10s, accepter n'importe qui)
        if (trophyDiff < 200 || G.mmSeconds > 10) {
            console.log('✅ MATCH TROUVÉ!');
            
            // Déterminer qui crée le match (celui avec le key le plus petit)
            const amICreator = G.myQueueKey < opponentKey;
            
            if (amICreator) {
                // Vérifier une dernière fois que personne n'a déjà créé de match
                const myCheck = await RTDB.ref('matchmaking_queue/' + G.myQueueKey).once('value');
                const oppCheck = await RTDB.ref('matchmaking_queue/' + opponentKey).once('value');
                
                if (!myCheck.exists() || !oppCheck.exists()) {
                    console.log('⚠️ Un des joueurs n\'est plus dans la queue');
                    return;
                }
                
                const myData = myCheck.val();
                const oppData = oppCheck.val();
                
                if (myData.inMatch || oppData.inMatch) {
                    console.log('⚠️ Un des joueurs est déjà en match');
                    return;
                }
                
                // Marquer les deux joueurs comme "en match" AVANT de créer le match
                await Promise.all([
                    RTDB.ref('matchmaking_queue/' + G.myQueueKey).update({ inMatch: true }),
                    RTDB.ref('matchmaking_queue/' + opponentKey).update({ inMatch: true })
                ]);
                
                console.log('🔒 Joueurs verrouillés, création du match...');
                
                // Créer le match
                await createMatch(opponentKey, opponentData);
            }
        }
    });
    
    // Timeout après 30 secondes
    G.mmSearchTimer = setTimeout(() => {
        console.log('⏰ Timeout matchmaking');
        stopMatchmaking();
        showError('Aucun adversaire trouvé');
        showScreen('main-menu');
    }, 30000);
}

/* =============================================
   CRÉER UN MATCH
   ============================================= */
async function createMatch(opponentKey, opponentData) {
    console.log('🎮 Création du match...');
    
    try {
        // Arrêter la recherche IMMÉDIATEMENT
        if (G.mmChildListenerRef && G.mmChildListener) {
            G.mmChildListenerRef.off('child_added', G.mmChildListener);
            G.mmChildListenerRef = null;
            G.mmChildListener = null;
        }
        clearTimeout(G.mmSearchTimer);
        clearInterval(G.mmCountdownId);
        
        // Créer le match dans Firebase AVANT de retirer de la queue
        const matchRef = RTDB.ref('active_matches').push();
        G.matchId = matchRef.key;
        G.isPlayer1 = true;
        
        const myChar = CHARACTERS[G.selectedChar] || CHARACTERS.warrior;
        const oppChar = CHARACTERS[opponentData.selectedCharacter] || CHARACTERS.warrior;
        
        const matchData = {
            player1: {
                uid: G.user.uid,
                username: G.playerData.username || 'Joueur',
                character: G.selectedChar,
                hp: myChar.hp,
                x: 200,
                y: 300,
                projectiles: []
            },
            player2: {
                uid: opponentData.userId,
                username: opponentData.username,
                character: opponentData.selectedCharacter,
                hp: oppChar.hp,
                x: 600,
                y: 300,
                projectiles: []
            },
            status: 'active',
            startTime: firebase.database.ServerValue.TIMESTAMP,
            timeRemaining: 180,
            createdBy: G.user.uid
        };
        
        await matchRef.set(matchData);
        
        console.log('✅ Match créé:', G.matchId);
        
        // MAINTENANT retirer les deux joueurs de la queue
        await Promise.all([
            RTDB.ref('matchmaking_queue/' + G.myQueueKey).remove(),
            RTDB.ref('matchmaking_queue/' + opponentKey).remove()
        ]);
        
        console.log('✅ Joueurs retirés de la queue');
        
        // Notifier le joueur 2 du match créé
        await RTDB.ref('match_notifications/' + opponentData.userId).set({
            matchId: G.matchId,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        console.log('✅ Notification envoyée au joueur 2');
        
        // Lancer le jeu pour le joueur 1
        initGame();
        
    } catch (error) {
        console.error('❌ Erreur création match:', error);
        showError('Erreur lors de la création du match');
        stopMatchmaking();
        showScreen('main-menu');
    }
}

/* =============================================
   TIMER VISUEL DU MATCHMAKING
   ============================================= */
function startMatchmakingTimer() {
    G.mmSeconds = 0;
    G.mmCountdownId = setInterval(() => {
        G.mmSeconds++;
        document.getElementById('mm-timer').textContent = G.mmSeconds + 's';
    }, 1000);
}

/* =============================================
   ANNULER LE MATCHMAKING
   ============================================= */
document.getElementById('cancel-matchmaking').addEventListener('click', () => {
    console.log('❌ Matchmaking annulé');
    stopMatchmaking();
    showScreen('main-menu');
});

function stopMatchmaking() {
    console.log('🛑 Arrêt matchmaking');
    
    // Retirer de la queue
    if (G.myQueueKey) {
        RTDB.ref('matchmaking_queue/' + G.myQueueKey).remove().catch(err => {
            console.warn('Erreur suppression queue:', err);
        });
        G.myQueueKey = null;
    }
    
    // Arrêter le listener de notification
    if (G.matchNotificationListener) {
        if (G.user) {
            RTDB.ref('match_notifications/' + G.user.uid).off('value', G.matchNotificationListener);
        }
        G.matchNotificationListener = null;
    }
    
    // Arrêter les listeners
    if (G.mmChildListenerRef && G.mmChildListener) {
        G.mmChildListenerRef.off('child_added', G.mmChildListener);
        G.mmChildListenerRef = null;
        G.mmChildListener = null;
    }
    
    // Arrêter les timers
    if (G.mmSearchTimer) {
        clearTimeout(G.mmSearchTimer);
        G.mmSearchTimer = null;
    }
    
    if (G.mmCountdownId) {
        clearInterval(G.mmCountdownId);
        G.mmCountdownId = null;
    }
    
    G.mmSeconds = 0;
}

/* =============================================
   INITIALISER LE JEU
   ============================================= */
function initGame() {
    console.log('🎮 INITIALISATION DU JEU');
    
    showScreen('game-screen');
    
    // Créer le canvas
    if (!G.canvas) {
        G.canvas = document.getElementById('game-canvas');
        G.ctx = G.canvas.getContext('2d');
    }
    
    // Resize canvas
    resizeCanvas();
    if (!G.resizeFn) {
        G.resizeFn = resizeCanvas;
        window.addEventListener('resize', G.resizeFn);
    }
    
    // Charger les données du personnage
    const myChar = CHARACTERS[G.selectedChar] || CHARACTERS.warrior;
    
    // Créer le joueur
    G.player = {
        x: G.isPlayer1 ? 200 : G.canvas.width - 200,
        y: G.canvas.height / 2,
        hp: myChar.hp,
        maxHp: myChar.hp,
        speed: myChar.speed,
        radius: myChar.radius,
        color: myChar.color,
        glowColor: myChar.glowColor,
        emoji: myChar.emoji,
        atkDmg: myChar.attackDamage,
        atkRange: myChar.attackRange,
        atkCd: myChar.attackCooldown,
        speDmg: myChar.specialDamage,
        speRange: myChar.specialRange,
        speCd: myChar.specialCooldown
    };
    
    // Créer l'adversaire (position initiale)
    const oppChar = CHARACTERS.warrior; // Sera mis à jour par Firebase
    G.opponent = {
        x: G.isPlayer1 ? G.canvas.width - 200 : 200,
        y: G.canvas.height / 2,
        targetX: G.isPlayer1 ? G.canvas.width - 200 : 200,
        targetY: G.canvas.height / 2,
        hp: oppChar.hp,
        maxHp: oppChar.hp,
        radius: oppChar.radius,
        color: oppChar.color,
        glowColor: oppChar.glowColor,
        emoji: oppChar.emoji
    };
    
    // Afficher les noms
    const myKey = G.isPlayer1 ? 'player1' : 'player2';
    const oppKey = G.isPlayer1 ? 'player2' : 'player1';
    
    RTDB.ref(`active_matches/${G.matchId}/${myKey}`).once('value', snap => {
        const data = snap.val();
        if (data) document.getElementById('player-game-name').textContent = data.username;
    });
    
    RTDB.ref(`active_matches/${G.matchId}/${oppKey}`).once('value', snap => {
        const data = snap.val();
        if (data) {
            document.getElementById('opponent-game-name').textContent = data.username;
            
            // Mettre à jour le personnage adverse
            const oppCharData = CHARACTERS[data.character] || CHARACTERS.warrior;
            G.opponent.color = oppCharData.color;
            G.opponent.glowColor = oppCharData.glowColor;
            G.opponent.emoji = oppCharData.emoji;
            G.opponent.radius = oppCharData.radius;
            G.opponent.maxHp = oppCharData.hp;
            G.opponent.hp = data.hp;
        }
    });
    
    // Écouter les changements du match
    listenToMatch();
    
    // Démarrer le timer du jeu
    G.gameTime = 180;
    updateTimerUI();
    G.timerIntervalId = setInterval(() => {
        G.gameTime--;
        updateTimerUI();
        if (G.gameTime <= 0) handleMatchEnd();
    }, 1000);
    
    // Installer les contrôles
    installKeyboard();
    installMobile();
    installMouseAim();
    startCooldownUI();
    
    // Réinitialiser l'état
    G.matchEnded = false;
    G.particles = [];
    G.projectiles = [];
    G.lastAtkTime = 0;
    G.lastSpeTime = 0;
    G.lastPosSend = 0;
    
    // Démarrer la game loop
    updateHpBars();
    gameLoop();
    
    console.log('✅ Jeu prêt!');
}

/* =============================================
   ÉCOUTER LES CHANGEMENTS DU MATCH
   ============================================= */
function listenToMatch() {
    const oppKey = G.isPlayer1 ? 'player2' : 'player1';
    const matchRef = RTDB.ref(`active_matches/${G.matchId}/gameState/${oppKey}`);
    
    G.matchListenerRef = matchRef;
    G.matchListenerCb = matchRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // Mettre à jour la position de l'adversaire
        if (data.x !== undefined) G.opponent.targetX = data.x;
        if (data.y !== undefined) G.opponent.targetY = data.y;
        
        // Mettre à jour les HP
        if (data.hp !== undefined) {
            G.opponent.hp = data.hp;
            updateHpBars();
            
            if (G.opponent.hp <= 0 && !G.matchEnded) {
                handleMatchEnd();
            }
        }
        
        // Mettre à jour les projectiles adverses
        if (data.projectiles && Array.isArray(data.projectiles)) {
            // Retirer les anciens projectiles adverses
            G.projectiles = G.projectiles.filter(p => p.isMine);
            
            // Ajouter les nouveaux projectiles adverses
            data.projectiles.forEach(proj => {
                if (!G.projectiles.find(p => p.id === proj.id)) {
                    G.projectiles.push({
                        ...proj,
                        isMine: false
                    });
                }
            });
        }
    });
}

/* =============================================
   VISÉE À LA SOURIS
   ============================================= */
function installMouseAim() {
    G.canvas.addEventListener('mousemove', (e) => {
        const rect = G.canvas.getBoundingClientRect();
        G.mouseX = e.clientX - rect.left;
        G.mouseY = e.clientY - rect.top;
        
        if (G.player) {
            const dx = G.mouseX - G.player.x;
            const dy = G.mouseY - G.player.y;
            G.aimAngle = Math.atan2(dy, dx);
            G.aimDistance = Math.sqrt(dx * dx + dy * dy);
        }
    });
    
    // Touch pour mobile
    G.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = G.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        G.mouseX = touch.clientX - rect.left;
        G.mouseY = touch.clientY - rect.top;
        
        if (G.player) {
            const dx = G.mouseX - G.player.x;
            const dy = G.mouseY - G.player.y;
            G.aimAngle = Math.atan2(dy, dx);
            G.aimDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }, { passive: false });
}

/* =============================================
   RESIZE CANVAS
   ============================================= */
function resizeCanvas() {
    if (!G.canvas) return;
    G.canvas.width = window.innerWidth;
    G.canvas.height = window.innerHeight;
}

console.log('✅ MATCHMAKING SYSTEM CHARGÉ');