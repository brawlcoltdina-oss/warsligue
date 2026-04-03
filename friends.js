// ==========================================
// WARSLIGUE — friends.js
// Système de demandes d'amis par identifiant
// ==========================================

/* =============================================
   INIT — appelé après AUTH.onAuthStateChanged
   ============================================= */
function initFriendsSystem() {
    if (!G.user) return;
    generateFriendCode();
    listenFriendRequests();
    listenFriendsList();
}

function cleanupFriendsSystem() {
    if (G._friendReqUnsub)   { G._friendReqUnsub();   G._friendReqUnsub   = null; }
    if (G._friendsListUnsub) { G._friendsListUnsub();  G._friendsListUnsub = null; }
}

/* =============================================
   CODE AMI — identifiant unique 6 caractères
   Format : 3 lettres + 3 chiffres ex: WAR#4J2
   ============================================= */
async function generateFriendCode() {
    if (!G.user || !G.playerData) return;

    // Si le joueur a déjà un code, on l'affiche juste
    if (G.playerData.friendCode) {
        displayFriendCode(G.playerData.friendCode);
        return;
    }

    // Générer un code unique
    let code, exists = true;
    while (exists) {
        code = makeFriendCode();
        const snap = await FSDB.collection('players')
            .where('friendCode', '==', code).limit(1).get();
        exists = !snap.empty;
    }

    await FSDB.collection('players').doc(G.user.uid).update({ friendCode: code });
    G.playerData.friendCode = code;
    displayFriendCode(code);
}

function makeFriendCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sans I et O pour éviter confusion
    const digits  = '0123456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 4; i++) code += digits[Math.floor(Math.random() * digits.length)];
    return code;
}

function displayFriendCode(code) {
    const el = document.getElementById('my-friend-code');
    if (el) el.textContent = code;
}

/* =============================================
   ENVOYER UNE DEMANDE D'AMI
   ============================================= */
async function sendFriendRequest() {
    const input = document.getElementById('friend-code-input');
    if (!input) return;

    const code = input.value.trim().toUpperCase();
    input.value = '';

    if (!code || code.length < 4) {
        showFriendMsg('❌ Code invalide', 'error');
        return;
    }

    if (code === G.playerData?.friendCode) {
        showFriendMsg('😅 C\'est votre propre code !', 'error');
        return;
    }

    try {
        // Trouver le joueur par son code
        const snap = await FSDB.collection('players')
            .where('friendCode', '==', code).limit(1).get();

        if (snap.empty) {
            showFriendMsg('❌ Aucun joueur avec ce code', 'error');
            return;
        }

        const targetDoc  = snap.docs[0];
        const targetUid  = targetDoc.id;
        const targetData = targetDoc.data();

        // Vérifier si déjà amis
        const alreadyFriend = await FSDB.collection('players').doc(G.user.uid)
            .collection('friends').doc(targetUid).get();
        if (alreadyFriend.exists) {
            showFriendMsg(`✅ ${targetData.username} est déjà votre ami !`, 'success');
            return;
        }

        // Vérifier si demande déjà envoyée
        const alreadySent = await FSDB.collection('players').doc(targetUid)
            .collection('friendRequests').doc(G.user.uid).get();
        if (alreadySent.exists) {
            showFriendMsg('⏳ Demande déjà envoyée', 'error');
            return;
        }

        // Envoyer la demande dans la collection du destinataire
        await FSDB.collection('players').doc(targetUid)
            .collection('friendRequests').doc(G.user.uid).set({
                fromUid:      G.user.uid,
                fromUsername: G.playerData.username,
                fromCode:     G.playerData.friendCode || '',
                fromTrophies: G.playerData.trophies || 0,
                status:       'pending',
                sentAt:       firebase.firestore.FieldValue.serverTimestamp()
            });

        showFriendMsg(`📨 Demande envoyée à ${targetData.username} !`, 'success');

    } catch (e) {
        console.error('❌ sendFriendRequest:', e);
        showFriendMsg('❌ Erreur lors de l\'envoi', 'error');
    }
}

/* =============================================
   ÉCOUTER LES DEMANDES REÇUES (temps réel)
   ============================================= */
function listenFriendRequests() {
    if (!G.user) return;
    if (G._friendReqUnsub) G._friendReqUnsub();

    G._friendReqUnsub = FSDB.collection('players').doc(G.user.uid)
        .collection('friendRequests')
        .where('status', '==', 'pending')
        .onSnapshot(snap => {
            const requests = [];
            snap.forEach(doc => requests.push({ id: doc.id, ...doc.data() }));
            renderFriendRequests(requests);
            updateFriendBadge(requests.length);
        });
}

function renderFriendRequests(requests) {
    const container = document.getElementById('friend-requests-list');
    if (!container) return;

    container.innerHTML = '';

    if (requests.length === 0) {
        container.innerHTML = '<div class="friends-empty">Aucune demande en attente</div>';
        return;
    }

    requests.forEach(req => {
        const card = document.createElement('div');
        card.className = 'friend-request-card';
        card.innerHTML = `
            <div class="friend-request-avatar">${req.fromUsername[0].toUpperCase()}</div>
            <div class="friend-request-info">
                <div class="friend-request-name">${req.fromUsername}</div>
                <div class="friend-request-meta">🏆 ${req.fromTrophies || 0} trophées • Code: ${req.fromCode || '—'}</div>
            </div>
            <div class="friend-request-actions">
                <button class="btn-accept" data-uid="${req.fromUid}" data-name="${req.fromUsername}">✓</button>
                <button class="btn-decline" data-uid="${req.fromUid}">✕</button>
            </div>
        `;

        card.querySelector('.btn-accept').addEventListener('click', (e) => {
            acceptFriendRequest(e.currentTarget.dataset.uid, e.currentTarget.dataset.name);
        });
        card.querySelector('.btn-decline').addEventListener('click', (e) => {
            declineFriendRequest(e.currentTarget.dataset.uid);
        });

        container.appendChild(card);
    });
}

/* =============================================
   ACCEPTER / REFUSER UNE DEMANDE
   ============================================= */
async function acceptFriendRequest(fromUid, fromUsername) {
    if (!G.user || !G.playerData) return;
    try {
        const batch = FSDB.batch();

        // Supprimer la demande
        batch.delete(
            FSDB.collection('players').doc(G.user.uid)
                .collection('friendRequests').doc(fromUid)
        );

        // Ajouter dans les amis des deux côtés
        batch.set(
            FSDB.collection('players').doc(G.user.uid)
                .collection('friends').doc(fromUid),
            {
                uid:      fromUid,
                username: fromUsername,
                addedAt:  firebase.firestore.FieldValue.serverTimestamp()
            }
        );
        batch.set(
            FSDB.collection('players').doc(fromUid)
                .collection('friends').doc(G.user.uid),
            {
                uid:      G.user.uid,
                username: G.playerData.username,
                addedAt:  firebase.firestore.FieldValue.serverTimestamp()
            }
        );

        await batch.commit();
        showFriendMsg(`🎉 ${fromUsername} ajouté comme ami !`, 'success');

    } catch (e) {
        console.error('❌ acceptFriendRequest:', e);
        showFriendMsg('❌ Erreur lors de l\'acceptation', 'error');
    }
}

async function declineFriendRequest(fromUid) {
    if (!G.user) return;
    try {
        await FSDB.collection('players').doc(G.user.uid)
            .collection('friendRequests').doc(fromUid).delete();
        showFriendMsg('Demande refusée', 'info');
    } catch (e) {
        console.error('❌ declineFriendRequest:', e);
    }
}

/* =============================================
   LISTE D'AMIS (temps réel)
   ============================================= */
function listenFriendsList() {
    if (!G.user) return;
    if (G._friendsListUnsub) G._friendsListUnsub();

    G._friendsListUnsub = FSDB.collection('players').doc(G.user.uid)
        .collection('friends')
        .orderBy('addedAt', 'desc')
        .onSnapshot(snap => {
            const friends = [];
            snap.forEach(doc => friends.push({ id: doc.id, ...doc.data() }));
            renderFriendsList(friends);
        });
}

async function renderFriendsList(friends) {
    const container = document.getElementById('friends-list');
    if (!container) return;

    container.innerHTML = '';

    if (friends.length === 0) {
        container.innerHTML = '<div class="friends-empty">Vous n\'avez pas encore d\'amis.<br>Ajoutez-en avec leur code !</div>';
        return;
    }

    // Récupérer les données fraîches de chaque ami (trophées, etc.)
    for (const friend of friends) {
        let trophies = 0;
        let code = '—';
        let fullData = null;
        try {
            const doc = await FSDB.collection('players').doc(friend.uid).get();
            if (doc.exists) {
                fullData = { id: doc.id, ...doc.data() };
                trophies = fullData.trophies || 0;
                code     = fullData.friendCode || '—';
            }
        } catch (_) {}

        const card = document.createElement('div');
        card.className = 'friend-card';
        card.innerHTML = `
            <div class="friend-avatar clickable" data-uid="${friend.uid}" title="Voir profil">${friend.username[0].toUpperCase()}</div>
            <div class="friend-info">
                <div class="friend-name">${friend.username}</div>
                <div class="friend-meta">🏆 ${trophies} trophées • #${code}</div>
            </div>
            <button class="btn-remove-friend" data-uid="${friend.uid}" title="Retirer">🗑</button>
        `;

        // ✅ Clic sur avatar → ouvre la carte de profil
        const avatarEl = card.querySelector('.friend-avatar');
        avatarEl.style.cursor = 'pointer';
        avatarEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof openProfileCardByUID === 'function') {
                openProfileCardByUID(friend.uid, fullData);
            }
        });

        card.querySelector('.btn-remove-friend').addEventListener('click', (e) => {
            removeFriend(e.currentTarget.dataset.uid, friend.username);
        });

        container.appendChild(card);
    }
}

async function removeFriend(targetUid, targetUsername) {
    if (!G.user) return;
    if (!confirm(`Retirer ${targetUsername} de vos amis ?`)) return;

    try {
        const batch = FSDB.batch();
        batch.delete(FSDB.collection('players').doc(G.user.uid).collection('friends').doc(targetUid));
        batch.delete(FSDB.collection('players').doc(targetUid).collection('friends').doc(G.user.uid));
        await batch.commit();
        showFriendMsg(`${targetUsername} retiré de vos amis`, 'info');
    } catch (e) {
        console.error('❌ removeFriend:', e);
    }
}
/* =============================================
   BADGE NOTIFICATION
   ============================================= */
function updateFriendBadge(count) {
    // Badge icône header
    const badge = document.getElementById('friends-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
    // Badge onglet demandes
    const badgeTab = document.getElementById('friends-badge-tab');
    if (badgeTab) {
        badgeTab.textContent = count;
        badgeTab.classList.toggle('visible', count > 0);
    }
}

/* =============================================
   MESSAGES DE FEEDBACK
   ============================================= */
function showFriendMsg(msg, type = 'info') {
    const el = document.getElementById('friends-msg');
    if (!el) return;
    el.textContent = msg;
    el.className   = `friends-msg friends-msg-${type} show`;
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 3000);
}

/* =============================================
   COPIER SON CODE
   ============================================= */
function copyMyCode() {
    const code = document.getElementById('my-friend-code')?.textContent;
    if (!code || code === '—') return;
    navigator.clipboard.writeText(code).then(() => {
        showFriendMsg('📋 Code copié !', 'success');
    }).catch(() => {
        showFriendMsg('Code: ' + code, 'info');
    });
}

/* =============================================
   OUVRIR / FERMER LE PANNEAU
   ============================================= */
function openFriendsPanel() {
    document.getElementById('friends-panel').classList.add('active');
    // Refresh des données à l'ouverture
    generateFriendCode();
}
function closeFriendsPanel() {
    document.getElementById('friends-panel').classList.remove('active');
}

// Event listeners du panneau
document.addEventListener('DOMContentLoaded', () => {
    const openBtn   = document.getElementById('friends-btn');
    const closeBtn  = document.getElementById('close-friends-panel');
    const overlay   = document.getElementById('friends-panel-overlay');
    const sendBtn   = document.getElementById('send-friend-request-btn');
    const copyBtn   = document.getElementById('copy-code-btn');
    const codeInput = document.getElementById('friend-code-input');

    if (openBtn)   openBtn.addEventListener('click', openFriendsPanel);
    if (closeBtn)  closeBtn.addEventListener('click', closeFriendsPanel);
    if (overlay)   overlay.addEventListener('click', closeFriendsPanel);
    if (sendBtn)   sendBtn.addEventListener('click', sendFriendRequest);
    if (copyBtn)   copyBtn.addEventListener('click', copyMyCode);

    // Envoyer avec Entrée
    if (codeInput) {
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') sendFriendRequest();
        });
    }

    // Tabs du panneau
    document.querySelectorAll('.friends-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.friends-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.friends-tab-content').forEach(c => c.classList.remove('active'));
            tab.classList.add('active');
            const target = document.getElementById('friends-tab-' + tab.dataset.tab);
            if (target) target.classList.add('active');
        });
    });
});