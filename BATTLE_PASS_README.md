# 📊 Système Passe Brawl - Documentation

## 🎯 Vue d'ensemble

Le Passe Brawl est un système de progression par niveaux avec **50 niveaux max**, où:
- Chaque niveau demande **150 XP**
- **Chaque niveau** débloque une récompense
- **Tous les 10 niveaux** (10, 20, 30, 40, 50) → récompenses **Premium** (10000 🪙)

---

## 📈 Progression & XP

### Où gagne-t-on de l'XP ?

1. **Combats Zombie** : `survivalTime * 2 + 10 XP`
   - 10s = 30 XP
   - 30s = 70 XP  
   - 60s = 130 XP

2. **Quêtes** (disponibles dans le panneau) : 50-500 XP

### Bonus Premium
- Achat du Passe Premium : **10000 pièces d'or**
- Débloque : **+50% XP supplémentaire** + accès aux récompenses Premium

---

## 🎁 Types de Récompenses

| Niveau | Récompense | XP | Type |
|--------|-----------|-----|------|
| 1      | 💰 50 pièces | 150 | Gratuit |
| 2      | ⚡ +5 PP | 150 | Gratuit |
| 10     | 🎁 Coffre Rare | 150 | **Premium** |
| 20     | 💎 Coffre Épique | 150 | **Premium** |
| 30     | 💎 Coffre Épique | 150 | **Premium** |
| 40     | 👑 Coffre Légendaire | 150 | **Premium** |
| 50     | 👑 Coffre Légendaire | 150 | **Premium** |

---

## 📋 Quêtes du Passe

```
🎟️ Première victoire    → 50 XP   (1 victoire)
🎟️ Guerrier             → 150 XP  (5 victoires)
🎟️ Champion             → 250 XP  (10 victoires)
🎟️ Collecteur           → 100 XP  (1000 pièces)
🎟️ Puissant             → 150 XP  (100 points pouvoir)
🎟️ Ouvreur de coffres   → 200 XP  (3 coffres ouverts)
🎟️ Légende              → 500 XP  (Niveau 50)
```

---

## 🔄 Données Firebase

### Collection `players` - Champs Passe Brawl

```js
{
  battlePassLevel: 1,          // Niveau actuel (1-50)
  battlePassXP: 0,             // XP du niveau actuel (0-149)
  battlePassPremium: false,    // A-t-il acheté le premium ?
  battlePassClaimedRewards: [], // Récompenses reclamées [1, 2, 3...]
  battlePassQuestsClaimed: [],  // Quêtes réclamées ['quest_1', ...]
  battlePassQuests: {           // Progression des quêtes
    quest_1: 0,
    quest_2: 0,
    quest_3: 0,
    // ...
  },
  battlePassChests: []         // Coffres à ouvrir
}
```

---

## 🎮 Intégration dans le Code

### Fonctions Principales

```js
// Ajouter de l'XP quand le joueur gagne un combat
onCombatWon(xpAmount)

// Progresser une quête
onQuestProgress(questId, amount)

// Ouvrir le panneau du passe
openBattlePassPanel()
closeBattlePassPanel()
```

### Appels Automatiques

- **`onCombatWon()`** : appelé dans `saveZombieResults()` après chaque combat
- **`onQuestProgress()`** : appelé dans `saveZombieResults()` pour progresser les quêtes

---

## 🎨 UI - Panneau du Passe

### Localisation

Bouton dans le **header** (icône 🎟️) à côté des paramètres

### Onglets

1. **Récompenses** : Grille 3x17 des 50 niveaux
   - Carte grisée = verrouillée
   - Carte verte = débloquée/réclamable
   - Carte or = Premium
   - Carte avec ✓ = déjà réclamée

2. **Quêtes** : Liste des 7 quêtes
   - Barre de progression pour chaque
   - Bouton "Réclamer" si terminée
   - Affiche le gain XP

### Barre de Progression

- Affiche le **niveau actuel**
- Progression graphique **XP/150**
- Bouton **Premium** (ou badge "⭐ Actif")

---

## 🚀 Fonctionnement Détaillé

### 1. Login du joueur

```
Login → ensurePlayerDoc() → listenPlayerData()
  ↓
initBattlePassSystem() 
  ↓
injectBattlePassUI() (bouton 🎟️ ajouté)
```

### 2. Combat gagné

```
endZombieMode()
  ↓
saveZombieResults()
  ├→ Update Firebase (gold, trophies)
  ├→ onCombatWon(xpGained) ✅
  └→ onQuestProgress() ✅
  ↓
showZombieResults() 
  └→ Affiche +XP dans les stats
```

### 3. Level Up

```
addBattlePassXP(amount)
  ├→ Calcule nouveaux XP/Level
  ├→ Si Level += 1 :
  │   ├→ awardLevelReward() (auto-octroyé)
  │   └→ showLevelUpNotification() (popup)
  ├→ Update Firebase
  └→ updateBattlePassUI()
```

### 4. Réclamer une récompense manuelle

```
claimLevelReward(level)
  ├→ Vérifie si déjà réclamée
  ├→ Vérifie si niveau accessible
  ├→ Vérifie si premium (si récompense premium)
  ├→ Update Firebase + octroyé récompense
  └→ Affiche notification
```

---

## ⚙️ Configuration

Fichier : `battle-pass.js`

```js
const BATTLE_PASS_CONFIG = {
    MAX_LEVELS: 50,
    XP_PER_LEVEL: 150,
    PREMIUM_PRICE: 10000,      // pièces d'or
    PREMIUM_MULTIPLIER: 1.5,   // +50% XP
};
```

---

## 🐛 Dépannage

### Le passe ne se charge pas
- Vérifier que `battle-pass.js` est chargé après `java.js`
- Vérifier la console pour les erreurs Firebase

### XP n'augmente pas
- Vérifier que `onCombatWon()` est appelée après chaque combat
- Vérifier les données Firebase du joueur

### Les récompenses n'apparaissent pas
- Vérifier que `BATTLE_PASS_REWARDS` contient le niveau
- Vérifier les permissions Firestore

---

## 📝 Notes

- ✅ Coffres à utiliser débloquent automatiquement en `battlePassChests`
- ✅ Les récompenses premium seront auto-octroyées si le passe est acheté
- ✅ UI responsive (mobile-friendly)
- ✅ Animations fluides avec CSS
- ✅ Notification de level-up spectaculaire

---

*Créé : Mars 2026*
*État : ✅ Fonctionnel et testé*
