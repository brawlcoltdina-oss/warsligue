/* =============================================
   SHOP SYSTEM — À AJOUTER DANS JAVA.JS
   Ajouter après la section LEADERBOARD
   ============================================= */

// SHOP NAVIGATION
document.getElementById('shop-btn').addEventListener('click', openShop);
document.getElementById('close-shop').addEventListener('click', () => showScreen('main-menu'));

// Shop tabs
document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.shop-content').forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`shop-tab-${targetTab}`).classList.add('active');
    });
});

async function openShop() {
    showScreen('shop-screen');
    document.getElementById('shop-trophies').textContent = G.playerData ? G.playerData.trophies : 0;
    await renderShop();
}

async function renderShop() {
    const playerDoc = await FSDB.collection('players').doc(G.user.uid).get();
    const playerData = playerDoc.data();
    const ownedChars = playerData.ownedCharacters || ['warrior', 'assassin', 'mage'];
    const ownedSkins = playerData.ownedSkins || [];

    // RENDER CHARACTERS
    const charsGrid = document.getElementById('characters-grid');
    charsGrid.innerHTML = '';
    
    for (const [key, char] of Object.entries(CHARACTERS)) {
        const owned = ownedChars.includes(key);
        const canAfford = (G.playerData?.trophies || 0) >= (char.price || 0);
        
        const card = document.createElement('div');
        card.className = `shop-item ${owned ? 'owned' : ''} ${!owned && !canAfford ? 'locked' : ''}`;
        
        card.innerHTML = `
            <div class="shop-item-icon">${char.emoji}</div>
            <div class="shop-item-name">${char.name}</div>
            <div class="shop-item-desc">${char.description || 'Personnage de base'}</div>
            <div class="shop-item-stats">
                <span class="shop-stat">❤️ ${char.hp}</span>
                <span class="shop-stat">💨 ${char.speed}</span>
                <span class="shop-stat">⚔️ ${char.attackDamage}</span>
            </div>
            ${!owned ? `
                <div class="shop-item-price">
                    <span>🏆</span>
                    <span>${char.price}</span>
                </div>
                <button class="shop-item-btn" ${!canAfford ? 'disabled' : ''} onclick="buyCharacter('${key}', ${char.price})">
                    ${canAfford ? 'Acheter' : 'Pas assez de 🏆'}
                </button>
            ` : `
                <button class="shop-item-btn owned-btn" disabled>Possédé ✓</button>
            `}
        `;
        
        charsGrid.appendChild(card);
    }

    // RENDER SKINS
    const skinsGrid = document.getElementById('skins-grid');
    skinsGrid.innerHTML = '';
    
    for (const [key, skin] of Object.entries(SKINS)) {
        const baseOwned = ownedChars.includes(skin.characterBase);
        const skinOwned = ownedSkins.includes(key);
        const canAfford = (G.playerData?.trophies || 0) >= (skin.price || 0);
        
        const card = document.createElement('div');
        card.className = `shop-item ${skinOwned ? 'owned' : ''} ${!baseOwned || (!skinOwned && !canAfford) ? 'locked' : ''}`;
        
        card.innerHTML = `
            <div class="shop-item-icon">${skin.emoji}</div>
            <div class="shop-item-name">${skin.name}</div>
            <div class="shop-item-desc">
                ${!baseOwned ? `🔒 Nécessite ${CHARACTERS[skin.characterBase].name}` : 'Skin cosmétique'}
            </div>
            <div style="width:30px; height:30px; border-radius:50%; background:${skin.color}; margin:0.5rem auto; box-shadow:0 0 15px ${skin.glowColor};"></div>
            ${!skinOwned ? `
                <div class="shop-item-price">
                    <span>🏆</span>
                    <span>${skin.price}</span>
                </div>
                <button class="shop-item-btn" ${!baseOwned || !canAfford ? 'disabled' : ''} onclick="buySkin('${key}', ${skin.price})">
                    ${!baseOwned ? 'Perso requis' : canAfford ? 'Acheter' : 'Pas assez de 🏆'}
                </button>
            ` : `
                <button class="shop-item-btn owned-btn" disabled>Possédé ✓</button>
            `}
        `;
        
        skinsGrid.appendChild(card);
    }
}

async function buyCharacter(charKey, price) {
    if (!G.user || !G.playerData) return;
    
    const currentTrophies = G.playerData.trophies || 0;
    if (currentTrophies < price) {
        showError('Pas assez de trophées !');
        return;
    }
    
    try {
        const playerRef = FSDB.collection('players').doc(G.user.uid);
        const doc = await playerRef.get();
        const data = doc.data();
        const owned = data.ownedCharacters || ['warrior', 'assassin', 'mage'];
        
        if (owned.includes(charKey)) {
            showError('Vous possédez déjà ce personnage !');
            return;
        }
        
        await playerRef.update({
            trophies: currentTrophies - price,
            ownedCharacters: firebase.firestore.FieldValue.arrayUnion(charKey)
        });
        
        console.log('✅ Personnage acheté:', charKey);
        await new Promise(r => setTimeout(r, 500)); // Attendre la mise à jour
        openShop(); // Refresh
        
    } catch (e) {
        console.error('❌ Achat:', e);
        showError('Erreur lors de l\'achat');
    }
}

async function buySkin(skinKey, price) {
    if (!G.user || !G.playerData) return;
    
    const currentTrophies = G.playerData.trophies || 0;
    if (currentTrophies < price) {
        showError('Pas assez de trophées !');
        return;
    }
    
    try {
        const playerRef = FSDB.collection('players').doc(G.user.uid);
        const doc = await playerRef.get();
        const data = doc.data();
        const ownedSkins = data.ownedSkins || [];
        
        if (ownedSkins.includes(skinKey)) {
            showError('Vous possédez déjà ce skin !');
            return;
        }
        
        await playerRef.update({
            trophies: currentTrophies - price,
            ownedSkins: firebase.firestore.FieldValue.arrayUnion(skinKey)
        });
        
        console.log('✅ Skin acheté:', skinKey);
        await new Promise(r => setTimeout(r, 500));
        openShop(); // Refresh
        
    } catch (e) {
        console.error('❌ Achat:', e);
        showError('Erreur lors de l\'achat');
    }
}

/* =============================================
   MISE À JOUR DE ensurePlayerDoc
   Ajouter les champs ownedCharacters et ownedSkins
   ============================================= */
// REMPLACER la fonction ensurePlayerDoc existante par :
async function ensurePlayerDoc(user) {
    const doc = await FSDB.collection('players').doc(user.uid).get();
    if (!doc.exists) {
        await FSDB.collection('players').doc(user.uid).set({
            username: 'Joueur_' + user.uid.slice(0,6),
            email: user.email || '',
            trophies: 100,
            wins: 0,
            losses: 0,
            totalMatches: 0,
            selectedCharacter: 'warrior',
            ownedCharacters: ['warrior', 'assassin', 'mage'], // ✅ AJOUTÉ
            ownedSkins: [], // ✅ AJOUTÉ
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        });
    } else {
        // Migrer les anciens comptes
        const data = doc.data();
        if (!data.ownedCharacters) {
            await FSDB.collection('players').doc(user.uid).update({
                ownedCharacters: ['warrior', 'assassin', 'mage'],
                ownedSkins: [],
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            FSDB.collection('players').doc(user.uid).update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    }
}