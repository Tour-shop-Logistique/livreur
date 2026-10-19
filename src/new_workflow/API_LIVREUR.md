# API Livreur — Tour Shop

Documentation complète des endpoints disponibles pour l'application mobile livreur.

**Base URL :** `https://<domaine>/api`  
**Authentification :** Bearer token Sanctum — `Authorization: Bearer <token>`  
**Format :** JSON (`Content-Type: application/json`), sauf les uploads (multipart/form-data)

---

## Sommaire

1. [Authentification](#1-authentification)
2. [Profil & véhicule](#2-profil--véhicule)
3. [Missions assignées](#3-missions-assignées)
4. [Suivi d'une mission — Enlèvement](#4-suivi-dune-mission--enlèvement)
5. [Suivi d'une mission — Livraison](#5-suivi-dune-mission--livraison)
6. [Propositions de mission (groupage)](#6-propositions-de-mission-groupage)
7. [Notes de mission](#7-notes-de-mission)
8. [Marketplace — missions express ouvertes](#8-marketplace--missions-express-ouvertes)
9. [Solde & retraits](#9-solde--retraits)
10. [Notifications persistées](#10-notifications-persistées)
11. [Marketplace produit (livraisons de commandes)](#11-marketplace-produit-livraisons-de-commandes)
12. [Structures de données](#12-structures-de-données)

---

## 1. Authentification

### Inscription livreur (self-service KYC)

```
POST /register-livreur
```

**Body :** `multipart/form-data`

| Champ | Type | Obligatoire | Détail |
|---|---|---|---|
| `nom` | string | ✅ | |
| `prenoms` | string | — | |
| `telephone` | string | ✅ | Unique |
| `indicatif_telephone` | string | ✅ | Format `+XXX` (ex. `+225`) |
| `whatsapp_number` | string | — | Format E.164. Défaut : indicatif + téléphone |
| `email` | string | ✅ | Unique |
| `password` | string | ✅ | Min 8 caractères |
| `password_confirmation` | string | ✅ | Identique à `password` |
| `code_pays` | string | ✅ | Code ISO 3166-1 alpha-2 (ex. `CI`, `FR`) |
| `type_piece_identite` | string | ✅ | `cni` / `passeport` / `permis_conduire` |
| `numero_piece_identite` | string | ✅ | |
| `piece_identite` | file image | ✅ | JPEG/PNG/WEBP, max 5 Mo |
| `photo_profil` | file image | — | JPEG/PNG/WEBP, max 5 Mo |
| `type_vehicule` | string | ✅ | `moto` / `voiture` |
| `numero_vehicule` | string | — | |
| `permis_de_conduire` | string | — | Numéro de permis |
| `zone_de_livraison_km` | number | — | Rayon de livraison en km |
| `ville` | string | ✅ | Ville d'opération (filtre missions) |

> ⚠️ **Important :** Le compte est créé **inactif**. Le backoffice doit valider les documents KYC avant que le livreur puisse se connecter et recevoir des missions.

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Compte créé, en attente de validation.",
  "user": { "id": "...", "nom": "...", "actif": false }
}
```

---

### Connexion

```
POST /login
```

```json
{ "email": "livreur@example.com", "password": "motdepasse" }
```

**Réponse 200 :**
```json
{
  "success": true,
  "token": "<sanctum_token>",
  "user": { "id": "...", "nom": "...", "type": "livreur" }
}
```

---

### Déconnexion

```
POST /logout
```
*(Requiert le token Bearer)*

---

## 2. Profil & véhicule

### Lire son profil

```
GET /livreur/profil
```

**Réponse 200 :**
```json
{
  "success": true,
  "user": {
    "id": "...",
    "nom": "Kouassi",
    "prenoms": "Jean",
    "telephone": "0700000000",
    "indicatif_telephone": "+225",
    "whatsapp_number": "+2250700000000",
    "email": "...",
    "solde_livreur": 15000.00,
    "disponible": true,
    "livreur": {
      "id": "...",
      "type_vehicule": "moto",
      "numero_vehicule": "CI-12345",
      "ville": "Abidjan",
      "zone_de_livraison_km": 20,
      "statut": "disponible",
      "statut_kyc": "valide"
    }
  }
}
```

---

### Mettre à jour son véhicule / zone

```
PUT /livreur/vehicule
```

```json
{
  "type_vehicule": "moto",
  "numero_vehicule": "CI-12345",
  "permis_de_conduire": "12345678",
  "zone_de_livraison_km": 25,
  "ville": "Abidjan"
}
```

> Tous les champs sont optionnels — envoyer seulement ce qui change.

---

## 3. Missions assignées

### Lister ses missions

```
GET /expedition/livreur/missions
GET /expedition/livreur/missions?statut=assignee
GET /expedition/livreur/missions?page=2
```

| Paramètre | Valeurs | Détail |
|---|---|---|
| `statut` | `proposee` / `assignee` / `terminee` / `annulee` | Filtre optionnel |
| `page` | entier | Pagination (20 par page) |

**Réponse 200 :**
```json
{
  "success": true,
  "missions": {
    "data": [
      {
        "id": "...",
        "type": "enlevement",
        "statut": "assignee",
        "mode": "express",
        "montant_final": 2500.00,
        "expedition": {
          "id": "...",
          "reference": "EXP-2026-00123",
          "type_expedition": "Simple",
          "pays_depart": "CI",
          "pays_destination": "FR",
          "expediteur": {
            "nom": "Konan Yves",
            "telephone": "0700000001",
            "adresse": "Cocody, Abidjan",
            "ville": "Abidjan",
            "latitude": 5.3599,
            "longitude": -4.0083
          },
          "destinataire": {
            "nom": "Dupont Marie",
            "telephone": "+33600000001",
            "adresse": "12 rue de la Paix, Paris",
            "ville": "Paris"
          },
          "colis": [
            {
              "id": "...",
              "code_colis": "COL-001",
              "designation": "Vêtements",
              "poids": "3.50",
              "longueur": "40.00",
              "largeur": "30.00",
              "hauteur": "20.00",
              "volume": "24000.00",
              "montant_colis_total": 12000.00,
              "format_colis": {
                "id": 1,
                "nom": "Moyen",
                "poids_max": 5,
                "volume_max": 30000
              },
              "category": {
                "id": 3,
                "nom": "Textile"
              }
            }
          ]
        }
      }
    ],
    "current_page": 1,
    "last_page": 3,
    "total": 47
  }
}
```

---

## 4. Suivi d'une mission — Enlèvement

Flux : **Démarrer** → **Confirmer (colis récupéré)** → **Déclarer le dépôt à l'agence** → *(l'agence confirme la réception)*

> Le dépôt se fait en **2 étapes**. Le livreur ne fait que *déclarer* qu'il a déposé le colis ; la mission n'est clôturée et payée que lorsque **l'agence confirme la réception** depuis son interface.

### Démarrer l'enlèvement

```
POST /expedition/livreur/enlevement/{id}/start
```
*(id = ID de l'expédition)*

**Réponse 200 :**
```json
{ "success": true, "message": "Enlèvement démarré", "expedition": { ... } }
```

---

### Confirmer la récupération du colis

```
POST /expedition/livreur/enlevement/{id}/confirm
```

**Body :** `multipart/form-data` (tous optionnels)

| Champ | Type | Détail |
|---|---|---|
| `photo` | file image | Photo du colis récupéré (JPEG/PNG/WEBP, max 5 Mo) |
| `signature` | string | Signature base64 |
| `latitude` | number | Coordonnée GPS |
| `longitude` | number | Coordonnée GPS |

---

### Déclarer le dépôt à l'agence

```
POST /expedition/livreur/reception-agence/{id}/confirm
```

Pas de body. **Préalable :** la récupération du colis doit avoir été confirmée (`/enlevement/{id}/confirm`).

> **Ne crédite plus le solde et ne clôture plus la mission.** L'appel enregistre seulement le dépôt déclaré (`date_depot_livreur_agence`) : la confirmation est **en attente**. La mission reste `assignee` jusqu'à ce que l'agence marque le colis comme réceptionné ; à ce moment la mission passe `terminee`, est payée, et le **solde livreur est crédité** (le livreur peut alors enchaîner ses autres demandes).

**Réponse 200 :**
```json
{ "success": true, "message": "Dépôt déclaré, en attente de confirmation par l'agence", "expedition": { ... } }
```
Un second appel renvoie 200 avec le message « Dépôt déjà déclaré, en attente de confirmation par l'agence. » (idempotent).

**Erreur 422 :** récupération non confirmée.
```json
{ "success": false, "message": "Confirmez d'abord la récupération du colis avant de le déposer à l'agence." }
```

**Côté application :** après cet appel, afficher la mission comme « Dépôt déclaré — en attente de confirmation agence » (statut mission toujours `assignee`). Le passage à `terminee` et le crédit du solde arrivent via la notification / le rafraîchissement de la mission une fois l'agence ayant confirmé.

---

## 5. Suivi d'une mission — Livraison

Flux : **Démarrer** → **Valider avec code**

### Démarrer la livraison au destinataire

```
POST /expedition/livreur/livraison/{id}/start
```

---

### Valider la livraison (code destinataire)

```
POST /expedition/livreur/livraison/{id}/validate
```

**Body :** `multipart/form-data`

| Champ | Type | Obligatoire | Détail |
|---|---|---|---|
| `code_validation` | string | ✅ | Code communiqué au destinataire |
| `photo` | file image | — | Preuve de livraison |
| `signature` | string | — | Signature base64 |
| `latitude` | number | — | |
| `longitude` | number | — | |

> **Déclenche le crédit du solde livreur** et clôture l'expédition (`TERMINED`).

---

## 6. Propositions de mission (groupage)

En mode groupage, le backoffice **propose** une mission au livreur. Ce dernier doit explicitement l'accepter ou la refuser (contrairement au mode express où son offre vaut accord).

### Accepter une mission proposée

```
POST /expedition/livreur/missions/{missionId}/accepter
```

**Réponse 200 :**
```json
{ "success": true, "message": "Mission acceptée.", "mission": { ... } }
```

---

### Refuser une mission proposée

```
POST /expedition/livreur/missions/{missionId}/refuser
```

```json
{ "motif": "Zone trop éloignée" }
```

---

## 7. Notes de mission

### Lire les notes d'une mission

```
GET /expedition/livreur/missions/{missionId}/notes
```

### Ajouter une note

```
POST /expedition/livreur/missions/{missionId}/notes
```

```json
{ "contenu": "Client absent, rappel prévu à 15h." }
```

---

## 8. Marketplace — missions express ouvertes

Missions sans livreur rattaché, ouvertes à tous les livreurs disponibles. Le livreur propose un prix ; le client accepte l'offre de son choix.

### Lister les missions disponibles

```
GET /expedition/livreur/missions-disponibles
GET /expedition/livreur/missions-disponibles?ville=Abidjan
GET /expedition/livreur/missions-disponibles?latitude=5.36&longitude=-4.01
```

| Paramètre | Détail |
|---|---|
| `ville` | Filtre par ville (priorité sur la ville du profil) |
| `latitude` / `longitude` | Calcule la distance et filtre selon `zone_de_livraison_km` du profil |

**Réponse 200 :**
```json
{
  "success": true,
  "missions": [
    {
      "id": "...",
      "type": "enlevement",
      "statut": "en_attente",
      "mode": "express",
      "distance_km": 3.2,
      "expedition": {
        "id": "...",
        "reference": "EXP-2026-00124",
        "type_expedition": "Simple",
        "expediteur": { "ville": "Abidjan", "latitude": 5.36, "longitude": -4.01 },
        "destinataire": { "ville": "Cocody" },
        "colis": [
          {
            "code_colis": "COL-001",
            "poids": "2.00",
            "designation": "Électronique",
            "format_colis": { "nom": "Petit", "poids_max": 2 },
            "category": { "nom": "Électronique" }
          }
        ]
      }
    }
  ]
}
```

---

### Proposer un prix sur une mission

```
POST /expedition/livreur/missions/{missionId}/proposer
```

```json
{ "montant_propose": 3000 }
```

> Le livreur doit être `disponible: true` sur son profil pour pouvoir proposer.  
> Une re-proposition **remplace** l'offre existante au lieu d'en créer une nouvelle.

**Réponse 201 :**
```json
{ "success": true, "message": "Offre enregistrée.", "offre": { ... } }
```

---

### Retirer son offre

```
DELETE /expedition/livreur/missions/{missionId}/offre
```

> Possible uniquement tant que l'offre n'a pas été acceptée par le client.

---

## 9. Solde & retraits

### Lire son solde

```
GET /livreur/solde
```

```json
{ "success": true, "solde_livreur": 47500.00 }
```

---

### Historique des mouvements (paginé, 20/page)

```
GET /livreur/solde/historique
GET /livreur/solde/historique?page=2
```

**Réponse 200 :**
```json
{
  "success": true,
  "historique": {
    "data": [
      {
        "type": "credit",
        "montant": 2500.00,
        "date": "2026-10-15T14:30:00Z",
        "detail": { "mission_id": "...", ... }
      },
      {
        "type": "retrait",
        "montant": -10000.00,
        "date": "2026-10-12T09:00:00Z",
        "detail": { "statut": "confirme", ... }
      }
    ],
    "total": 38,
    "current_page": 1,
    "last_page": 2
  }
}
```

---

### Statistiques de performance

```
GET /livreur/statistiques
GET /livreur/statistiques?periode=7j
GET /livreur/statistiques?periode=tout
```

| `periode` | Fenêtre |
|---|---|
| `30j` (défaut) | 30 derniers jours |
| `7j` | 7 derniers jours |
| `tout` | Depuis le début |

**Réponse 200 :**
```json
{
  "success": true,
  "periode": { "debut": "2026-09-18", "fin": "2026-10-18" },
  "missions": {
    "terminees": 24,
    "enlevements": 10,
    "livraisons": 14,
    "annulees": 1
  },
  "marketplace": { "terminees": 3 },
  "offres": {
    "proposees": 8,
    "acceptees": 3,
    "taux_acceptation": 0.375
  },
  "gains": {
    "total": 47500.00,
    "moyenne_par_mission": 1979.17
  },
  "par_jour": [
    { "date": "2026-10-17", "missions": 2, "gains": 5000.00 }
  ]
}
```

---

### Demander un retrait

```
POST /livreur/solde/demander-retrait
```

```json
{ "montant": 15000, "notes": "Virement mobile money" }
```

> Le solde n'est **pas** débité immédiatement. Le backoffice confirme la demande avant décrémentation.

**Réponse 201 :**
```json
{
  "success": true,
  "message": "Demande de retrait enregistrée.",
  "retrait": { "id": "...", "montant": 15000, "statut": "en_attente" }
}
```

---

## 10. Notifications persistées

Les notifications sont stockées côté serveur (état lu/non-lu partagé entre appareils).

### Lister ses notifications (paginé, 20/page)

```
GET /livreur/notifications
GET /livreur/notifications?page=2
```

**Réponse 200 :**
```json
{
  "success": true,
  "notifications": {
    "data": [
      {
        "id": "uuid-...",
        "type": "App\\Notifications\\MissionAssigneePushNotification",
        "data": {
          "titre": "Nouvelle mission",
          "corps": "Enlèvement à Cocody",
          "mission_id": "..."
        },
        "read_at": null,
        "created_at": "2026-10-18T01:00:00Z"
      }
    ],
    "total": 12,
    "current_page": 1
  }
}
```

---

### Marquer une notification comme lue

```
POST /livreur/notifications/{id}/lue
```

### Tout marquer comme lu

```
POST /livreur/notifications/tout-lire
```

---

## 11. Marketplace produit (livraisons de commandes)

Livraison de commandes passées sur la marketplace produit (acheteur → vendeur → livreur).

### Livraisons disponibles (mode réseau)

```
GET /marketplace/livraisons-disponibles
GET /marketplace/livraisons-disponibles?ville=Abidjan
GET /marketplace/livraisons-disponibles?latitude=5.36&longitude=-4.01
```

**Réponse 200 :**
```json
{
  "success": true,
  "livraisons": [
    {
      "id": "...",
      "mode": "reseau",
      "statut": "en_attente",
      "distance_km": 1.8,
      "retrait": { "ville": "Cocody", "quartier": "Riviera" },
      "livraison": { "ville": "Plateau", "quartier": "Centre" },
      "commande": {
        "id": "...",
        "montant_articles": 45000.00,
        "nombre_articles": 2,
        "items": [
          {
            "id": "...",
            "quantite": 1,
            "prix_unitaire": 30000.00,
            "titre_snapshot": "Sac en cuir noir",
            "annonce": {
              "id": "...",
              "titre": "Sac en cuir noir",
              "prix": 30000.00
            }
          }
        ]
      }
    }
  ]
}
```

---

### Proposer un prix sur une livraison

```
POST /marketplace/livraisons/{id}/proposer
```

```json
{ "montant_propose": 2000 }
```

---

### Retirer son offre

```
DELETE /marketplace/livraisons/{id}/offre
```

---

### Mes livraisons assignées

```
GET /marketplace/livraisons/mes-livraisons
```

**Réponse 200 :**
```json
{
  "success": true,
  "livraisons": [
    {
      "id": "...",
      "mode": "reseau",
      "statut": "en_cours",
      "montant_final": 2000.00,
      "retrait": {
        "nom": "Konan Brice",
        "telephone": "0700000002",
        "adresse": "Cocody Riviera 3",
        "quartier": "Riviera 3",
        "ville": "Abidjan",
        "latitude": 5.38,
        "longitude": -3.97
      },
      "livraison": {
        "nom": "Aya Boni",
        "telephone": "0500000003",
        "adresse": "Plateau avenue Houphouët",
        "quartier": "Plateau",
        "ville": "Abidjan",
        "latitude": 5.32,
        "longitude": -4.02,
        "instructions": "Appeler avant d'arriver"
      },
      "commande": {
        "id": "...",
        "montant_articles": 45000.00,
        "items": [
          {
            "id": "...",
            "quantite": 1,
            "prix_unitaire": 30000.00,
            "titre_snapshot": "Sac en cuir noir",
            "annonce": { "id": "...", "titre": "Sac en cuir noir", "prix": 30000.00 }
          }
        ]
      }
    }
  ]
}
```

---

### Détail d'une livraison assignée

```
GET /marketplace/livraisons/{id}
```

*(Même structure que ci-dessus, pour une seule livraison)*

---

### Démarrer une livraison marketplace

```
POST /marketplace/livraisons/{id}/demarrer
```

---

### Valider une livraison marketplace

```
POST /marketplace/livraisons/{id}/valider
```

**Body :** `multipart/form-data`

| Champ | Type | Obligatoire | Détail |
|---|---|---|---|
| `code_validation` | string | ✅ | Code remis à l'acheteur |
| `photo` | file image | — | Preuve de livraison |
| `signature` | string | — | Signature base64 |
| `latitude` | number | — | |
| `longitude` | number | — | |

---

## 12. Structures de données

### Statuts de mission (`statut`)

| Valeur | Signification |
|---|---|
| `en_attente` | Pas encore assignée (visible en marketplace) |
| `proposee` | Le backoffice a proposé au livreur (mode groupage) |
| `assignee` | Livreur assigné, mission en cours |
| `terminee` | Mission complétée |
| `annulee` | Mission annulée |

### Types de mission (`type`)

| Valeur | Signification |
|---|---|
| `enlevement` | Récupérer le colis chez l'expéditeur |
| `livraison` | Livrer le colis au destinataire |

### Modes (`mode`)

| Valeur | Signification |
|---|---|
| `express` | Le livreur répond à une offre ouverte |
| `groupage` | Le backoffice assigne directement |

### Statuts de livraison marketplace (`statut`)

| Valeur | Signification |
|---|---|
| `en_attente` | En attente d'un livreur |
| `assignee` | Livreur accepté |
| `en_cours` | Livraison démarrée |
| `terminee` | Livrée et validée |

---

## Notes d'implémentation

- **Toutes les routes** (sauf `/register-livreur` et `/login`) requièrent le token Bearer.
- Les coordonnées GPS des expéditeurs/destinataires peuvent être `null` si non renseignées.
- Le champ `disponible` sur le profil livreur doit être `true` pour proposer une offre marketplace.
- Préférer **WebSocket (Pusher/Reverb)** pour les mises à jour en temps réel plutôt que le polling.
- Le montant demandé en retrait ne peut pas dépasser `solde_livreur` — le backend rejette avec 422 sinon.
