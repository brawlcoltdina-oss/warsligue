// ==========================================
// ONLINE TRACKING & SETTINGS - WARSLIGUE
// ==========================================

/* =============================================
   ONLINE PRESENCE TRACKING
   ============================================= */
let onlinePresenceRef = null;
let onlineCountListener = null;

function initOnlineTracking() {
    if (!G.user) return;
    
    // Créer une référence pour la présence de l'utilisateur
    onlinePresenceRef = RTDB.ref(`online_users/${G.user.uid}`);
    
    // Marquer l'utilisateur comme en ligne
    onlinePresenceRef.set({
        username: G.playerData?.username || 'Joueur',
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        status: 'online'
    });
    
    // Supprimer la présence lors de la déconnexion
    onlinePresenceRef.onDisconnect().remove();
    
    // Écouter le nombre de joueurs en ligne
    const onlineUsersRef = RTDB.ref('online_users');
    onlineCountListener = onlineUsersRef.on('value', (snapshot) => {
        const count = snapshot.numChildren();
        updateOnlineCount(count);
    });
    
    console.log('🟢 Tracking en ligne activé');
}

function updateOnlineCount(count) {
    const el = document.getElementById('online-count');
    if (el) {
        el.textContent = count;
        
        // Animation de mise à jour
        el.style.transform = 'scale(1.2)';
        setTimeout(() => {
            el.style.transform = 'scale(1)';
        }, 200);
    }
}

function stopOnlineTracking() {
    if (onlinePresenceRef) {
        onlinePresenceRef.remove();
        onlinePresenceRef = null;
    }
    
    if (onlineCountListener) {
        RTDB.ref('online_users').off('value', onlineCountListener);
        onlineCountListener = null;
    }
    
    console.log('🔴 Tracking en ligne désactivé');
}

/* =============================================
   SETTINGS PANEL
   ============================================= */
const SETTINGS = {
    showKeyHints: true,
    enableVibration: true,
    showParticles: true,
    enableFlash: true
};

function loadSettings() {
    const saved = localStorage.getItem('warsligue_settings');
    if (saved) {
        try {
            Object.assign(SETTINGS, JSON.parse(saved));
            applySettings();
        } catch (e) {
            console.error('Erreur chargement paramètres:', e);
        }
    }
}

function saveSettings() {
    localStorage.setItem('warsligue_settings', JSON.stringify(SETTINGS));
    applySettings();
}

function applySettings() {
    // Afficher/masquer les touches
    const keyHints = document.getElementById('key-hints');
    if (keyHints) {
        keyHints.style.display = SETTINGS.showKeyHints ? 'flex' : 'none';
    }
    
    // Mettre à jour les toggles
    document.getElementById('toggle-key-hints').checked = SETTINGS.showKeyHints;
    document.getElementById('toggle-vibration').checked = SETTINGS.enableVibration;
    document.getElementById('toggle-particles').checked = SETTINGS.showParticles;
    document.getElementById('toggle-flash').checked = SETTINGS.enableFlash;
}

function openSettingsPanel() {
    document.getElementById('settings-panel').classList.add('active');
    
    // Afficher les infos utilisateur
    if (G.user) {
        document.getElementById('player-uid').textContent = G.user.uid.slice(0, 12) + '...';
        
        if (G.playerData?.createdAt) {
            const date = G.playerData.createdAt.toDate ? 
                         G.playerData.createdAt.toDate() : 
                         new Date(G.playerData.createdAt);
            document.getElementById('account-created').textContent = 
                date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    }
}

function closeSettingsPanel() {
    document.getElementById('settings-panel').classList.remove('active');
}

// Event listeners pour les paramètres
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    
    // Bouton paramètres
    const settingsBtn = document.getElementById('settings-btn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', openSettingsPanel);
    }
    
    // Boutons de fermeture
    const closeSettingsBtn = document.getElementById('close-settings-panel');
    if (closeSettingsBtn) {
        closeSettingsBtn.addEventListener('click', closeSettingsPanel);
    }
    
    const settingsOverlay = document.getElementById('settings-panel-overlay');
    if (settingsOverlay) {
        settingsOverlay.addEventListener('click', closeSettingsPanel);
    }
    
    // Toggles de paramètres
    document.getElementById('toggle-key-hints')?.addEventListener('change', (e) => {
        SETTINGS.showKeyHints = e.target.checked;
        saveSettings();
    });
    
    document.getElementById('toggle-vibration')?.addEventListener('change', (e) => {
        SETTINGS.enableVibration = e.target.checked;
        saveSettings();
    });
    
    document.getElementById('toggle-particles')?.addEventListener('change', (e) => {
        SETTINGS.showParticles = e.target.checked;
        saveSettings();
    });
    
    document.getElementById('toggle-flash')?.addEventListener('change', (e) => {
        SETTINGS.enableFlash = e.target.checked;
        saveSettings();
    });
});

// Fonction pour la vibration mobile
function triggerVibration(pattern = 50) {
    if (SETTINGS.enableVibration && navigator.vibrate) {
        navigator.vibrate(pattern);
    }
}

console.log('⚙️ Module Online Tracking & Settings chargé');