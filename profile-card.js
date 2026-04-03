// ==========================================
// WARSLIGUE — profile-card.js
// Système de carte de combat (Brawl Stars style)
// ==========================================

/* =============================================
   OPTIONS DE PP (Photo de profil)
   ============================================= */
const PP_OPTIONS = [
    // Emojis de base (toujours dispo)
    { id: 'pp_sword',    type: 'emoji', value: '⚔️',  label: 'Épée' },
    { id: 'pp_skull',    type: 'emoji', value: '💀',  label: 'Crâne' },
    { id: 'pp_fire',     type: 'emoji', value: '🔥',  label: 'Feu' },
    { id: 'pp_star',     type: 'emoji', value: '⭐',  label: 'Étoile' },
    { id: 'pp_diamond',  type: 'emoji', value: '💎',  label: 'Diamant' },
    { id: 'pp_lightning',type: 'emoji', value: '⚡',  label: 'Éclair' },
    { id: 'pp_trophy',   type: 'emoji', value: '🏆',  label: 'Trophée' },
    { id: 'pp_zombie',   type: 'emoji', value: '🧟',  label: 'Zombie' },
    { id: 'pp_dragon',   type: 'emoji', value: '🐉',  label: 'Dragon' },
    { id: 'pp_shield',   type: 'emoji', value: '🛡️',  label: 'Bouclier' },
    // PP de personnages (dispo si possédé)
    { id: 'pp_warrior',     type: 'char', charKey: 'warrior',     label: 'Warrior' },
    { id: 'pp_assassin',    type: 'char', charKey: 'assassin',    label: 'Assassin' },
    { id: 'pp_mage',        type: 'char', charKey: 'mage',        label: 'Mage' },
    { id: 'pp_tank',        type: 'char', charKey: 'tank',        label: 'Tank' },
    { id: 'pp_ninja',       type: 'char', charKey: 'ninja',       label: 'Ninja' },
    { id: 'pp_necromancer', type: 'char', charKey: 'necromancer', label: 'Necromancer' },
    { id: 'pp_paladin',     type: 'char', charKey: 'paladin',     label: 'Paladin' },
    { id: 'pp_dragon_k',    type: 'char', charKey: 'dragon',      label: 'Dragon Knight' },
];

/* =============================================
   ÉTAT LOCAL DE LA CARTE
   ============================================= */
let profileCardData = null;   // données du joueur affiché
let profileIsOwn    = false;  // true = c'est notre propre profil
let profileSelectedPP = null; // PP sélectionnée dans l'éditeur

/* =============================================
   INIT — Injecter le HTML du modal
   ============================================= */
function initProfileCard() {
    if (document.getElementById('profile-modal')) return; // déjà injecté

    document.body.insertAdjacentHTML('beforeend', `
        <!-- PROFILE MODAL -->
        <div id="profile-modal">
            <div class="profile-modal-overlay" id="profile-modal-overlay"></div>
            <div class="profile-modal-content" id="profile-modal-content">

                <!-- BANNER -->
                <div class="profile-banner" id="profile-banner">
                    <div class="profile-banner-pattern"></div>
                    <div class="profile-banner-glow" id="profile-banner-glow"></div>
                    <button class="profile-close-btn" id="profile-close-btn">✕</button>
                </div>

                <!-- AVATAR + NOM -->
                <div class="profile-avatar-section">
                    <div class="profile-avatar-wrap">
                        <div class="profile-avatar-ring" id="profile-avatar-ring">
                            <div class="profile-avatar-inner" id="profile-avatar-inner">?</div>
                            <div class="profile-avatar-edit" id="profile-avatar-edit-overlay">
                                <span class="profile-avatar-edit-icon">🎨</span>
                                <span>Modifier</span>
                            </div>
                        </div>
                        <div class="profile-league-badge" id="profile-league-badge">🥉</div>
                    </div>
                    <div class="profile-name-section">
                        <div class="profile-username" id="profile-username">Joueur</div>
                        <div class="profile-friend-code" id="profile-friend-code">#——</div>
                        <div class="profile-league-label" id="profile-league-label">Bronze</div>
                    </div>
                </div>

                <!-- STATS GRID -->
                <div class="profile-stats-grid">
                    <div class="profile-stat-card trophies">
                        <span class="profile-stat-icon">🏆</span>
                        <div class="profile-stat-info">
                            <div class="profile-stat-value" id="profile-stat-trophies">0</div>
                            <div class="profile-stat-label">Trophées</div>
                        </div>
                    </div>
                    <div class="profile-stat-card zombie">
                        <span class="profile-stat-icon">🧟</span>
                        <div class="profile-stat-info">
                            <div class="profile-stat-value" id="profile-stat-zombie">—</div>
                            <div class="profile-stat-label">Record Zombie</div>
                        </div>
                    </div>
                    <div class="profile-stat-card rank">
                        <span class="profile-stat-icon">📊</span>
                        <div class="profile-stat-info">
                            <div class="profile-stat-value" id="profile-stat-rank">#—</div>
                            <div class="profile-stat-label">Rang Classement</div>
                        </div>
                    </div>
                    <div class="profile-stat-card games">
                        <span class="profile-stat-icon">🎮</span>
                        <div class="profile-stat-info">
                            <div class="profile-stat-value" id="profile-stat-games">0</div>
                            <div class="profile-stat-label">Parties jouées</div>
                        </div>
                    </div>
                </div>

                <!-- PERSONNAGE ACTIF -->
                <div class="profile-char-section">
                    <div class="profile-section-title">Combattant actif</div>
                    <div class="profile-char-display" id="profile-char-display">
                        <div class="profile-char-avatar" id="profile-char-avatar">⚔️</div>
                        <div class="profile-char-info">
                            <div class="profile-char-name" id="profile-char-name">Warrior</div>
                            <div class="profile-char-rarity" id="profile-char-rarity">Commun</div>
                            <div class="profile-char-stats-mini">
                                <span class="profile-char-stat-mini">❤️ <span id="profile-char-hp">100</span></span>
                                <span class="profile-char-stat-mini">⚡ <span id="profile-char-spd">5</span></span>
                                <span class="profile-char-stat-mini">⚔️ <span id="profile-char-dmg">10</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ÉDITEUR PP (only own profile) -->
                <div class="profile-pp-edit-section" id="profile-pp-edit-section" style="display:none;">
                    <div class="profile-pp-title">Changer ma photo de profil</div>
                    <div class="profile-pp-grid" id="profile-pp-grid"></div>
                    <button class="profile-pp-save" id="profile-pp-save">💾 Sauvegarder</button>
                </div>

                <!-- ACTIONS (ami / classement) -->
                <div class="profile-actions" id="profile-actions" style="display:none;">
                    <button class="profile-action-btn primary" id="profile-add-friend-btn">
                        👥 Ajouter ami
                    </button>
                    <button class="profile-action-btn secondary" id="profile-challenge-btn">
                        ⚔️ Défier
                    </button>
                </div>

            </div>
        </div>

        <!-- TOAST -->
        <div class="profile-toast" id="profile-toast"></div>
    `);

    // Events
    document.getElementById('profile-modal-overlay').addEventListener('click', closeProfileCard);
    document.getElementById('profile-close-btn').addEventListener('click', closeProfileCard);

    document.getElementById('profile-avatar-ring').addEventListener('click', () => {
        if (profileIsOwn) togglePPEditor();
    });

    document.getElementById('profile-pp-save').addEventListener('click', saveProfilePP);

    document.getElementById('profile-add-friend-btn').addEventListener('click', async () => {
        if (!profileCardData) return;
        const code = profileCardData.friendCode;
        if (!code) { showProfileToast('❌ Code ami introuvable'); return; }
        // Simuler envoi demande d'ami via le système existant
        const input = document.getElementById('friend-code-input');
        if (input) input.value = code;
        if (typeof sendFriendRequest === 'function') {
            await sendFriendRequest();
            showProfileToast('📨 Demande envoyée !');
        }
    });
}

/* =============================================
   OUVRIR LA CARTE — propre profil
   ============================================= */
function openOwnProfileCard() {
    if (!G.playerData) return;
    profileIsOwn = true;

    const data = {
        ...G.playerData,
        uid: G.user?.uid
    };

    openProfileCard(data, true);
}

/* =============================================
   OUVRIR LA CARTE — autre joueur (uid ou data)
   ============================================= */
async function openProfileCardByUID(uid, preloadedData = null) {
    if (!uid) return;
    profileIsOwn = (G.user && uid === G.user.uid);

    let data = preloadedData;
    if (!data) {
        try {
            const doc = await FSDB.collection('players').doc(uid).get();
            if (!doc.exists) { showProfileToast('❌ Joueur introuvable'); return; }
            data = { uid, ...doc.data() };
        } catch (e) {
            console.error('openProfileCardByUID:', e);
            showProfileToast('❌ Erreur chargement profil');
            return;
        }
    }

    openProfileCard(data, profileIsOwn);
}

/* =============================================
   CORE — afficher le modal avec les données
   ============================================= */
async function openProfileCard(data, isOwn = false) {
    initProfileCard();
    profileCardData = data;
    profileIsOwn    = isOwn;

    const char = CHARACTERS[data.selectedCharacter || 'warrior'] || CHARACTERS.warrior;
    const league = typeof getLeague === 'function' ? getLeague(data.trophies || 0) : { name: 'Bronze', color: '#CD7F32', emoji: '🥉' };

    /* ---- BANNER couleur selon ligue ---- */
    const bannerEl = document.getElementById('profile-banner');
    const leagueBannerColors = {
        'Bronze':   'linear-gradient(135deg, #CD7F32, #8B4513)',
        'Argent':   'linear-gradient(135deg, #C0C0C0, #707070)',
        'Or':       'linear-gradient(135deg, #FFD700, #ff9800)',
        'Platine':  'linear-gradient(135deg, #E5E4E2, #6C5CE7)',
        'Diamant':  'linear-gradient(135deg, #B9F2FF, #6C5CE7)',
    };
    bannerEl.style.background = leagueBannerColors[league.name] || leagueBannerColors['Bronze'];

    /* ---- AVATAR ---- */
    const pp = data.profilePP || null;
    renderProfileAvatar(pp, data.username);

    /* ---- NOM + CODE + LIGUE ---- */
    document.getElementById('profile-username').textContent = data.username || 'Joueur';
    document.getElementById('profile-friend-code').textContent = data.friendCode ? '#' + data.friendCode : '#——';

    const leagueLabel = document.getElementById('profile-league-label');
    leagueLabel.textContent = league.name;
    leagueLabel.style.color = league.color;
    leagueLabel.style.borderColor = league.color + '55';
    leagueLabel.style.background = league.color + '18';

    /* Badge */
    const leagueBadgeEmojis = { Bronze: '🥉', Argent: '🥈', Or: '🥇', Platine: '💿', Diamant: '💎' };
    document.getElementById('profile-league-badge').textContent = leagueBadgeEmojis[league.name] || '🥉';

    /* ---- STATS ---- */
    document.getElementById('profile-stat-trophies').textContent = data.trophies || 0;
    document.getElementById('profile-stat-zombie').textContent =
        data.bestZombieTime ? data.bestZombieTime + 's' : '—';
    document.getElementById('profile-stat-games').textContent =
        (data.totalMatches || 0) + (data.zombieSessions || 0);

    /* Rang classement (on cherche dans le cache LB si dispo) */
    document.getElementById('profile-stat-rank').textContent = '#—';
    fetchPlayerRank(data.uid || data.id).then(rank => {
        document.getElementById('profile-stat-rank').textContent = rank ? '#' + rank : '#—';
    });

    /* ---- PERSONNAGE ---- */
    const charAvatarEl = document.getElementById('profile-char-avatar');
    charAvatarEl.style.background = char.color;
    charAvatarEl.style.boxShadow = '0 0 20px ' + char.glowColor;
    charAvatarEl.innerHTML = `<img src="${char.image}" alt="${char.name}" style="width:80%;height:80%;object-fit:contain;">`;

    document.getElementById('profile-char-name').textContent = char.name;
    document.getElementById('profile-char-rarity').textContent =
        char.rarity ? char.rarity.charAt(0).toUpperCase() + char.rarity.slice(1) : 'Commun';
    document.getElementById('profile-char-rarity').style.color =
        { common: '#95a5a6', rare: '#3498db', epic: '#9b59b6', legendary: '#f1c40f' }[char.rarity] || '#95a5a6';

    const upgChar = typeof getCharacterWithUpgrades === 'function'
        ? getCharacterWithUpgrades(data.selectedCharacter || 'warrior', data)
        : char;
    document.getElementById('profile-char-hp').textContent  = Math.round(upgChar.hp);
    document.getElementById('profile-char-spd').textContent = Math.round(upgChar.speed * 10) / 10;
    document.getElementById('profile-char-dmg').textContent = Math.round(upgChar.attackDamage * 10) / 10;

    /* ---- SECTIONS CONDITIONNELLES ---- */
    const ppSection      = document.getElementById('profile-pp-edit-section');
    const actionsSection = document.getElementById('profile-actions');
    const editOverlay    = document.getElementById('profile-avatar-edit-overlay');

    if (isOwn) {
        ppSection.style.display = 'block';
        actionsSection.style.display = 'none';
        editOverlay.style.display = 'flex';
        renderPPGrid(data);
    } else {
        ppSection.style.display = 'none';
        editOverlay.style.display = 'none';
        actionsSection.style.display = 'flex';

        // Vérifier si déjà ami
        if (G.user && data.uid) {
            try {
                const friendDoc = await FSDB.collection('players').doc(G.user.uid)
                    .collection('friends').doc(data.uid).get();
                const addBtn = document.getElementById('profile-add-friend-btn');
                if (friendDoc.exists) {
                    addBtn.textContent = '✅ Déjà ami';
                    addBtn.disabled = true;
                    addBtn.style.opacity = '0.6';
                } else {
                    addBtn.textContent = '👥 Ajouter ami';
                    addBtn.disabled = false;
                    addBtn.style.opacity = '1';
                }
            } catch (_) {}
        }
    }

    /* ---- AFFICHER ---- */
    const modal = document.getElementById('profile-modal');
    modal.style.display = 'flex';
    requestAnimationFrame(() => modal.classList.add('active'));
}

/* =============================================
   FERMER
   ============================================= */
function closeProfileCard() {
    const modal = document.getElementById('profile-modal');
    if (!modal) return;
    modal.classList.remove('active');
    setTimeout(() => { modal.style.display = 'none'; }, 300);
}

/* =============================================
   RENDU DE L'AVATAR (PP)
   ============================================= */
function renderProfileAvatar(pp, username) {
    const inner = document.getElementById('profile-avatar-inner');
    if (!inner) return;

    if (!pp) {
        // Lettre par défaut
        inner.textContent = (username || '?')[0].toUpperCase();
        inner.style.fontSize = '3rem';
        return;
    }

    const option = PP_OPTIONS.find(o => o.id === pp);
    if (!option) {
        inner.textContent = (username || '?')[0].toUpperCase();
        return;
    }

    if (option.type === 'emoji') {
        inner.textContent = option.value;
        inner.style.fontSize = '3rem';
    } else if (option.type === 'char') {
        const char = CHARACTERS[option.charKey];
        if (char) {
            inner.innerHTML = `<img src="${char.image}" alt="${char.name}" style="width:80%;height:80%;object-fit:contain;">`;
        } else {
            inner.textContent = (username || '?')[0].toUpperCase();
        }
    }
}

/* =============================================
   GRILLE PP
   ============================================= */
function renderPPGrid(playerData) {
    const grid = document.getElementById('profile-pp-grid');
    if (!grid) return;
    grid.innerHTML = '';

    profileSelectedPP = playerData.profilePP || null;
    const ownedChars = playerData.ownedCharacters || ['warrior', 'assassin', 'mage'];

    PP_OPTIONS.forEach(opt => {
        const el = document.createElement('div');
        el.className = 'profile-pp-option';
        el.dataset.ppId = opt.id;

        const isSelected = opt.id === profileSelectedPP;
        const isLocked = (opt.type === 'char') && !ownedChars.includes(opt.charKey);

        if (isLocked) el.classList.add('locked-pp');
        if (isSelected) el.classList.add('selected');

        if (opt.type === 'emoji') {
            el.textContent = opt.value;
        } else if (opt.type === 'char') {
            const char = CHARACTERS[opt.charKey];
            if (char) {
                el.classList.add('char-pp');
                el.style.background = char.color + '33';
                el.style.borderColor = isLocked ? 'transparent' : (char.color + '66');
                el.innerHTML = `<img src="${char.image}" alt="${char.name}" style="width:80%;height:80%;object-fit:contain;border-radius:50%;">`;
            }
        }

        el.title = opt.label + (isLocked ? ' (à débloquer)' : '');

        if (!isLocked) {
            el.addEventListener('click', () => selectPPOption(opt.id));
        }

        grid.appendChild(el);
    });
}

/* =============================================
   SÉLECTION PP
   ============================================= */
function selectPPOption(ppId) {
    profileSelectedPP = ppId;
    document.querySelectorAll('.profile-pp-option').forEach(el => {
        el.classList.toggle('selected', el.dataset.ppId === ppId);
    });
    // Preview immédiat
    renderProfileAvatar(ppId, profileCardData?.username);
}

/* =============================================
   TOGGLE ÉDITEUR PP
   ============================================= */
function togglePPEditor() {
    const section = document.getElementById('profile-pp-edit-section');
    if (!section) return;
    const visible = section.style.display !== 'none';
    section.style.display = visible ? 'none' : 'block';
    if (!visible && profileCardData) renderPPGrid(profileCardData);
}

/* =============================================
   SAUVEGARDER PP
   ============================================= */
async function saveProfilePP() {
    if (!G.user || !profileSelectedPP) { showProfileToast('Choisissez une photo !'); return; }
    try {
        await FSDB.collection('players').doc(G.user.uid).update({
            profilePP: profileSelectedPP
        });
        if (G.playerData) G.playerData.profilePP = profileSelectedPP;
        profileCardData.profilePP = profileSelectedPP;

        // Mettre à jour l'avatar du menu principal
        updateMainMenuAvatar();

        showProfileToast('✅ Photo de profil sauvegardée !');
    } catch (e) {
        console.error('saveProfilePP:', e);
        showProfileToast('❌ Erreur lors de la sauvegarde');
    }
}

/* =============================================
   METTRE À JOUR L'AVATAR DU MENU
   ============================================= */
function updateMainMenuAvatar() {
    const avatarEl = document.getElementById('player-avatar');
    if (!avatarEl || !G.playerData) return;

    const pp = G.playerData.profilePP;
    if (!pp) {
        avatarEl.textContent = (G.playerData.username || '?')[0].toUpperCase();
        avatarEl.style.fontSize = '';
        return;
    }

    const option = PP_OPTIONS.find(o => o.id === pp);
    if (!option) { avatarEl.textContent = (G.playerData.username || '?')[0].toUpperCase(); return; }

    if (option.type === 'emoji') {
        avatarEl.textContent = option.value;
        avatarEl.style.fontSize = '1.5rem';
    } else if (option.type === 'char') {
        const char = CHARACTERS[option.charKey];
        if (char) {
            avatarEl.innerHTML = `<img src="${char.image}" alt="${char.name}" style="width:85%;height:85%;object-fit:contain;">`;
        }
    }
}

/* =============================================
   RANG CLASSEMENT (depuis le cache LB ou Firestore)
   ============================================= */
async function fetchPlayerRank(uid) {
    if (!uid) return null;

    // Chercher dans le cache leaderboard existant
    if (typeof lbCache !== 'undefined' && lbCache.trophies) {
        const idx = lbCache.trophies.findIndex(p => p.id === uid);
        if (idx !== -1) return idx + 1;
    }

    // Sinon requête directe : compter combien ont plus de trophées
    try {
        const playerDoc = await FSDB.collection('players').doc(uid).get();
        if (!playerDoc.exists) return null;
        const trophies = playerDoc.data().trophies || 0;

        const above = await FSDB.collection('players')
            .where('trophies', '>', trophies)
            .get();
        return above.size + 1;
    } catch (e) {
        return null;
    }
}

/* =============================================
   TOAST
   ============================================= */
function showProfileToast(msg) {
    const toast = document.getElementById('profile-toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('show'), 2800);
}

/* =============================================
   PATCH LEADERBOARD — avatars cliquables
   ============================================= */
function patchLeaderboardClickable(players) {
    // Appeler après renderLB() pour ajouter les events sur les avatars
    setTimeout(() => {
        document.querySelectorAll('#leaderboard-list .lb-avatar').forEach((el, i) => {
            if (!players[i]) return;
            el.classList.add('clickable');
            el.title = 'Voir profil';
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                openProfileCardByUID(players[i].id, players[i]);
            });
        });
    }, 50);
}

/* =============================================
   PATCH FRIENDS LIST — avatars cliquables
   ============================================= */
function patchFriendsClickable() {
    setTimeout(() => {
        document.querySelectorAll('#friends-list .friend-avatar').forEach(el => {
            const uid = el.closest('.friend-card')?.querySelector('.btn-remove-friend')?.dataset?.uid;
            if (!uid) return;
            el.classList.add('clickable');
            el.title = 'Voir profil';
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                openProfileCardByUID(uid);
            });
        });
    }, 100);
}

/* =============================================
   INIT AU CHARGEMENT
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
    // Cliquer sur son propre avatar dans le menu
    const playerAvatarEl = document.getElementById('player-avatar');
    if (playerAvatarEl) {
        playerAvatarEl.style.cursor = 'pointer';
        playerAvatarEl.title = 'Mon profil';
        playerAvatarEl.addEventListener('click', openOwnProfileCard);
    }

    // Injecter le HTML dès que possible
    initProfileCard();
});

/* =============================================
   HOOKS — à appeler depuis java.js / friends.js
   Remplacer renderLB dans java.js par renderLBPatched
   ============================================= */

// Override de renderLB pour ajouter les events cliquables
const _originalRenderLB = typeof renderLB === 'function' ? renderLB : null;

function renderLBPatched(players, mode) {
    if (_originalRenderLB) _originalRenderLB(players, mode);
    patchLeaderboardClickable(players);
}

// Override de renderFriendsList pour ajouter les events cliquables
const _originalRenderFriendsList = typeof renderFriendsList === 'function' ? renderFriendsList : null;

async function renderFriendsListPatched(friends) {
    if (_originalRenderFriendsList) await _originalRenderFriendsList(friends);
    patchFriendsClickable();
}

// Auto-apply patches si les fonctions originales existent
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Appliquer l'avatar PP au menu si déjà chargé
        if (G.playerData) updateMainMenuAvatar();
    });
}

console.log('🃏 Profile Card System chargé !');