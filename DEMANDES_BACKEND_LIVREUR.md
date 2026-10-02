# Demandes d'évolution backend — Application Livreur

Ce document liste les évolutions backend nécessaires pour que l'application livreur couvre le **cahier des charges v2** (section 5 « Application Livreur » et workflows 8.3, 8.4, 8.6). Chaque demande décrit l'existant, le besoin, une proposition de contrat d'API et les critères d'acceptation.

- **Date** : 2 octobre 2026
- **Émetteur** : équipe application livreur
- **État analysé** : `PARCOURS_LIVREUR_API.md` et `MARKETPLACE_ET_ABONNEMENT_API.md` (sections 7 à 9), comparés au code de `livreur-app`
- **Conventions reprises de l'existant** : token Sanctum, enveloppe `{ "success": bool, ... }`, identifiants UUID, erreurs de validation Laravel en 422, événement WebSocket unique `model.updated` filtré sur `model` / `action`

Les routes, champs et noms d'événements proposés ici sont des **propositions** : l'équipe backend reste libre de les adapter, tant que le besoin fonctionnel et les critères d'acceptation sont respectés. Merci de documenter le contrat final dans `PARCOURS_LIVREUR_API.md`.

---

## Sommaire

| # | Demande | Exigence du cahier | Priorité |
|---|---|---|---|
| [B1](#b1--adresses-contacts-et-contenu-des-livraisons-marketplace) | Adresses, contacts et contenu des livraisons marketplace | §5 « demandes marketplace », §8.4 étapes 7 et 10 | **P0** |
| [B2](#b2--accepter-ou-refuser-une-mission-assignée) | Accepter ou refuser une mission assignée | §5 « Acceptation ou refus d'une mission », §7.4, §8.4 étape 6bis | **P0** |
| [B3](#b3--filtrage-géographique-des-missions-disponibles-et-diffusion-ciblée) | Filtrage géographique des missions disponibles et diffusion ciblée | §5 « disponibles dans sa ville », §8.3 étape 1 | P1 |
| [B4](#b4--preuve-complète-en-marketplace-récupération-et-remise) | Preuve complète en marketplace (récupération et remise) | §5 « preuve (photo, signature, heure) », « horodatage et géolocalisation » | P1 |
| [B5](#b5--coordonnées-gps-dans-les-réponses-missions) | Coordonnées GPS dans les réponses missions | §5 « Navigation GPS intégrée » | P1 |
| [B6](#b6--notes-et-instructions-sur-un-colis) | Notes et instructions sur un colis | §5 « Ajout de notes et instructions sur un colis » | P1 |
| [B7](#b7--solde-marketplace-informatif-accessible-au-livreur) | Solde marketplace informatif accessible au livreur | §5 « Consultation des commissions et paiements » | P2 |
| [B8](#b8--statistiques-personnelles-du-livreur) | Statistiques personnelles du livreur | §5 « Statistiques personnelles » | P2 |
| [B9](#b9--paiement-de-labonnement-par-mobile-money) | Paiement de l'abonnement par mobile money | §5 « commission périodique via mobile money », §8.6 étape 3, §7.12 | P2 |
| [B10](#b10--historique-des-notifications-du-livreur) | Historique des notifications du livreur | §5 « Notifications de nouvelles missions », §7.8 | P3 |
| [Q1](#q1--bascule-interville-dune-livraison-marketplace) | Question : bascule interville d'une livraison marketplace | §8.4 étape 8 | À clarifier |

**Priorités**
- **P0** : bloque l'exécution d'une livraison ou une exigence explicite du cahier sur le cœur du métier.
- **P1** : exigence du cahier, contournable aujourd'hui mais au prix de la qualité de service.
- **P2** : exigence du cahier à faible risque opérationnel.
- **P3** : confort ou fiabilité, recommandé.

---

## B1 — Adresses, contacts et contenu des livraisons marketplace

**Priorité** : P0 · **Exigence** : §5 « Consultation des demandes de livraison marketplace », §8.4 étape 7 (« Récupère le produit chez le fournisseur ») et étape 10 (« Valide la livraison »).

### Constat

Les routes livreur marketplace ne renvoient que des identifiants :

- `GET /marketplace/livreur/livraisons-disponibles` → `commande: { id, vendeur_id, montant_articles }`
- `GET /marketplace/livreur/livraisons/mes-livraisons` → `commande: { id, vendeur_id, acheteur_id, montant_articles }`

Le livreur ne connaît donc **ni l'adresse de retrait chez le vendeur, ni l'adresse de livraison de l'acheteur, ni leurs numéros, ni les articles à récupérer**. De plus, `POST /marketplace/acheteur/panier/valider` ne collecte aucune adresse de livraison. L'app livreur ne peut aujourd'hui afficher qu'un numéro de commande et des montants.

### Besoin

1. **À la commande** (côté application client) : collecter l'adresse de livraison de l'acheteur.
2. **Côté livreur** : pour une livraison disponible, la ville de retrait et la ville de livraison, afin de décider s'il propose un prix.
3. **Pour une livraison assignée** : les adresses complètes, les contacts et la liste des articles.

### Proposition

**1. Adresse de livraison à la validation du panier** — `POST /marketplace/acheteur/panier/valider`, nouveaux champs :

| Champ | Type | Requis | Détail |
|---|---|---|---|
| `adresse_livraison.adresse` | string | oui | max 255 |
| `adresse_livraison.quartier` | string | non | max 100 |
| `adresse_livraison.ville` | string | oui | max 100 |
| `adresse_livraison.telephone` | string | non | par défaut, téléphone de l'acheteur |
| `adresse_livraison.latitude` / `longitude` | numérique | non | voir B5 |
| `adresse_livraison.instructions` | string | non | max 500, voir B6 |

Stockage proposé : colonnes `livraison_*` sur `commandes_marketplace`, copiées au moment de la commande (snapshot, insensible à une modification ultérieure du profil).

**2. Adresse de retrait côté vendeur** : une adresse de retrait par défaut sur le profil vendeur (ou sur chaque annonce), avec les mêmes champs. Elle est copiée sur la commande au moment du choix du mode de livraison (`livraison/reseau` ou `livraison/direct`).

**3. Réponses livreur enrichies.**

Livraison **disponible** (avant attribution — données minimales, sans téléphone ni adresse exacte) :

```json
{
  "id": "uuid",
  "mode": "reseau",
  "statut": "en_attente",
  "retrait": { "ville": "Abidjan", "quartier": "Cocody" },
  "livraison": { "ville": "Abidjan", "quartier": "Marcory" },
  "commande": { "id": "uuid", "montant_articles": 150000, "nombre_articles": 2 }
}
```

Livraison **assignée au livreur** (`mes-livraisons`, et une route de détail recommandée `GET /marketplace/livreur/livraisons/{id}`) :

```json
{
  "id": "uuid",
  "statut": "assignee",
  "montant_final": 1500,
  "retrait": {
    "nom": "Boutique Awa", "telephone": "0701020304",
    "adresse": "Rue des Jardins", "quartier": "Cocody", "ville": "Abidjan",
    "latitude": 5.3599, "longitude": -3.9870, "instructions": null
  },
  "livraison": {
    "nom": "Paul Yao", "telephone": "0705060708",
    "adresse": "Rue du Docteur Blanchard", "quartier": "Zone 4", "ville": "Abidjan",
    "latitude": 5.2970, "longitude": -3.9960, "instructions": "Sonner au portail bleu"
  },
  "commande": {
    "id": "uuid", "montant_articles": 150000,
    "items": [{ "titre_snapshot": "Canapé 3 places", "quantite": 1 }]
  }
}
```

### Règles

- Téléphone et adresse exacte visibles **uniquement par le livreur assigné** (pas dans `livraisons-disponibles`), pour protéger les données personnelles.
- Ces données ne sont plus visibles par le livreur une fois la livraison `terminee` ou `annulee`, sauf la ville (historique).

### Critères d'acceptation

- [ ] Un panier ne peut pas être validé sans adresse de livraison (422 sinon).
- [ ] Une livraison disponible expose ville et quartier de retrait et de livraison, sans téléphone ni adresse exacte.
- [ ] Une livraison assignée expose adresses, contacts et articles au seul livreur assigné (403 ou 404 pour un autre livreur).
- [ ] La route de détail renvoie 404 si la livraison n'est pas assignée au livreur connecté.

---

## B2 — Accepter ou refuser une mission assignée

**Priorité** : P0 · **Exigence** : §5 « Acceptation ou refus d'une mission », §7.4 (back-office : « visibilité sur l'acceptation/le refus des missions »), §8.4 étape 6bis (« Reçoit la mission avec le tarif défini par le fournisseur ; accepte ou refuse la mission »).

### Constat

- Mode **groupage** : `assigner` passe directement la mission en `assignee` et génère le code de validation (§4.1, §4.4).
- Marketplace **direct** : `POST /marketplace/vendeur/ventes/{id}/livraison/direct` passe la livraison en `assignee` et démarre l'abonnement du livreur.

Le livreur ne peut ni accepter ni refuser : une mission qu'il ne peut pas faire (indisponible, trop loin, véhicule inadapté) reste bloquée sur lui jusqu'à une intervention manuelle.

### Périmètre

Seules les **assignations sans accord préalable du livreur** sont concernées :

| Flux | Accord du livreur | Concerné par B2 |
|---|---|---|
| Expédition, mode groupage (assignation back-office) | Non | **Oui** |
| Marketplace, affectation directe par le vendeur | Non | **Oui** |
| Expédition, mode express (offre acceptée par le client) | Oui, via son offre | Non |
| Marketplace, mode réseau (offre acceptée par le vendeur) | Oui, via son offre | Non |

### Proposition

**Nouveau statut `proposee`** sur `Mission` et `LivraisonMarketplace`, entre l'assignation et `assignee` :

```
(back-office assigne / vendeur affecte)
        → proposee ──accepter──> assignee → … (workflow actuel inchangé)
                   ──refuser───> refusee (mission rendue à l'émetteur)
                   ──délai écoulé──> expiree (traité comme un refus)
```

Nouveaux champs : `proposee_le`, `expire_le`, `acceptee_le`, `refusee_le`, `motif_refus` (nullable).

**Délai d'acceptation** : paramètre configurable par le back-office (proposition : 15 minutes par défaut), appliqué par une tâche planifiée qui passe les propositions échues en `expiree`.

**Routes livreur**

| Méthode | Route | Corps |
|---|---|---|
| POST | `/expedition/livreur/missions/{missionId}/accepter` | — |
| POST | `/expedition/livreur/missions/{missionId}/refuser` | `{ "motif": "string, optionnel, max 255" }` |
| POST | `/marketplace/livreur/livraisons/{id}/accepter` | — |
| POST | `/marketplace/livreur/livraisons/{id}/refuser` | `{ "motif": "..." }` |

**Réponse 200 (accepter)** : `{ "success": true, "message": "Mission acceptée.", "mission": { "...": "...", "statut": "assignee", "acceptee_le": "..." } }`

**Réponse 200 (refuser)** : `{ "success": true, "message": "Mission refusée." }`

**Listes** : `GET /expedition/livreur/missions?statut=proposee` doit fonctionner, et les missions `proposee` doivent apparaître dans la liste sans filtre, avec `expire_le`. Même chose pour `mes-livraisons` côté marketplace.

### Règles métier

- **Code de validation** (livraison à domicile) et **démarrage de l'abonnement marketplace** : générés à l'**acceptation**, et non plus à l'assignation.
- **Accepter** vérifie, dans l'ordre :
  1. la mission est `proposee` à ce livreur → sinon 404 ;
  2. elle n'est pas échue → sinon 422 `"Cette proposition a expiré."` ;
  3. `users.disponible = true` → sinon 422 `"Vous devez être disponible pour accepter une mission."` ;
  4. aucune autre mission active (`Livreur::estDisponible()`) → sinon 422 `"Vous avez déjà une mission en cours."`.
- **Refus d'une mission groupage** : la mission redevient non assignée (`en_attente`, `livreur_id = null`) et réapparaît dans la file du back-office. Voir la question ouverte ci-dessous.
- **Refus d'une livraison marketplace directe** : la livraison passe `refusee` et la commande revient à l'état qui permet au vendeur de choisir à nouveau un mode de livraison (`payee`).
- Un livreur qui a refusé une mission ne doit pas se la voir reproposer automatiquement.
- Historiser chaque proposition (livreur, date, issue, motif) pour la visibilité back-office du §7.4.

### Temps réel et notifications

| Déclencheur | `model` | `action` | Canal | Push |
|---|---|---|---|---|
| Mission proposée au livreur | `Mission` | `proposee` (remplace `assignee` pour ce flux) | `livreur.{id}` | « Nouvelle mission proposée — à accepter avant HH:MM » |
| Livraison marketplace proposée | `LivraisonMarketplace` | `proposee` | `livreur.{id}` | idem |
| Acceptée | `Mission` / `LivraisonMarketplace` | `acceptee` | canal back-office / vendeur concerné | vendeur : « Votre livreur a accepté » |
| Refusée ou expirée | idem | `refusee` / `expiree` | canal back-office / vendeur concerné | vendeur : « Le livreur a décliné, choisissez un autre mode » |

### Impact app livreur

Nouvelle carte « Mission proposée » avec compte à rebours et boutons **Refuser / Accepter** ; feuille de motif au refus ; mise à jour du flux temps réel.

### Critères d'acceptation

- [ ] Une assignation groupage ou marketplace directe crée une mission `proposee`, visible par le livreur avec `expire_le`.
- [ ] Accepter passe la mission en `assignee`, génère le code de validation et (marketplace) démarre l'abonnement.
- [ ] Refuser ou laisser expirer rend la mission à l'émetteur, qui est notifié en temps réel.
- [ ] Les quatre cas d'erreur de l'acceptation renvoient les codes et messages ci-dessus.
- [ ] Le back-office voit l'historique des propositions et des refus.

### Question ouverte

- Une mission groupage refusée doit-elle revenir dans la file du back-office, ou pouvoir être publiée automatiquement en **express** sur le réseau ?

---

## B3 — Filtrage géographique des missions disponibles et diffusion ciblée

**Priorité** : P1 · **Exigence** : §5 « Consultation des livraisons à domicile disponibles dans sa ville », §8.3 étape 1 (« visible par les livreurs de la ville concernée »).

### Constat

- `GET /expedition/livreur/missions-disponibles` renvoie toutes les missions express ouvertes, sans filtre.
- L'événement `Mission/nouvelle_disponible` est diffusé sur `livreurs.reseau` (tous les livreurs connectés), et le push part vers **tous** les livreurs `disponible = true`.
- La fiche livreur n'a pas de ville : seulement `code_pays` (à l'inscription) et `zone_de_livraison_km`.

Conséquence : un livreur d'Abidjan est notifié et sollicité pour des missions d'autres villes, voire d'autres pays (mode Extraville).

### Proposition

**1. Ville d'exercice du livreur**

- Nouveau champ `ville` (et optionnellement `commune`) sur `Livreur`.
- Requis à `POST /register-livreur`, modifiable via `PUT /livreur/vehicule` (ou une route profil dédiée), renvoyé par `GET /livreur/profil`.
- Pour les comptes existants : valeur nulle tolérée, avec repli sur le pays du back-office de rattachement.

**2. Filtrage serveur par défaut** sur `GET /expedition/livreur/missions-disponibles` et `GET /marketplace/livreur/livraisons-disponibles` :

| Type de mission | Point de référence comparé à la ville du livreur |
|---|---|
| Enlèvement | Ville de l'expéditeur |
| Livraison à domicile | Ville du destinataire (ou de l'agence d'arrivée) |
| Livraison marketplace | Ville de retrait (voir B1) |

Paramètres optionnels :

| Paramètre | Type | Effet |
|---|---|---|
| `latitude`, `longitude` | numérique | Calcule `distance_km` jusqu'au point de départ, filtre sur `zone_de_livraison_km` et trie par distance croissante |
| `ville` | string | Remplace la ville du profil (livreur en déplacement) |

Champ ajouté à chaque élément : `distance_km` (nullable, si une position est fournie).

**3. Diffusion ciblée**

- Remplacer le canal global par un canal par zone, par exemple `livreurs.reseau.{code_pays}.{ville_slug}` (autorisé si le livreur appartient à cette zone), ou garder `livreurs.reseau` en ne diffusant que l'identifiant et laisser l'app filtrer (moins fiable).
- Le push `MissionExpressDisponiblePushNotification` ne part qu'aux livreurs disponibles de la zone concernée.

### Critères d'acceptation

- [ ] Un livreur ne reçoit dans `missions-disponibles` que les missions de sa ville (ou de son rayon si une position est fournie).
- [ ] Aucune mission d'un autre pays n'est listée ni notifiée.
- [ ] Le push et l'événement temps réel « nouvelle mission » ne ciblent que les livreurs concernés.
- [ ] `distance_km` est renvoyé et la liste triée quand une position est envoyée.

### Question ouverte

- Le filtre se fait-il par ville déclarée, par rayon autour de la position, ou les deux (ville par défaut, rayon si la position est disponible) ? Notre recommandation : les deux.

---

## B4 — Preuve complète en marketplace (récupération et remise)

**Priorité** : P1 · **Exigence** : §5 « Validation de la récupération et de la livraison avec preuve (photo, signature, heure) » et « Horodatage et géolocalisation enregistrés à chaque preuve de livraison », §8.4 étape 10.

### Constat

| Étape | Expéditions (§4.3, §4.4) | Marketplace (§7) |
|---|---|---|
| Récupération | `enlevement/confirm` : photo, signature, latitude, longitude, horodatage | `demarrer` : **aucune preuve** |
| Remise | `livraison/validate` : code + photo, signature, latitude, longitude | `valider` : code + `preuve` (photo seule) |

### Proposition

Aligner la marketplace sur le modèle `PreuveMission` des expéditions (idéalement une table de preuves polymorphe partagée).

**`POST /marketplace/livreur/livraisons/{id}/demarrer`** — corps optionnel, `multipart/form-data` :

| Champ | Type | Requis |
|---|---|---|
| `photo` | image jpeg/png/jpg/webp, max 5 Mo | non |
| `signature` | string base64 | non |
| `latitude` | numérique (-90 à 90) | non |
| `longitude` | numérique (-180 à 180) | non |

**`POST /marketplace/livreur/livraisons/{id}/valider`** — en plus de `code` :

| Champ | Type | Requis |
|---|---|---|
| `photo` (alias de `preuve`, conservé pour compatibilité) | image, max 5 Mo | non |
| `signature` | string base64 | non |
| `latitude` / `longitude` | numérique | non |

Horodatage serveur (`horodatage = now()`) à chaque preuve, comme pour les expéditions. Les preuves sont exposées au vendeur et à l'acheteur sur le détail de la commande.

### Critères d'acceptation

- [ ] `demarrer` et `valider` acceptent photo, signature et position, toutes facultatives.
- [ ] Chaque preuve est horodatée côté serveur et rattachée à l'étape (récupération ou remise).
- [ ] L'ancien champ `preuve` continue de fonctionner.
- [ ] Le vendeur voit les preuves de récupération et de remise de sa vente.

---

## B5 — Coordonnées GPS dans les réponses missions

**Priorité** : P1 · **Exigence** : §5 « Navigation GPS intégrée avec itinéraire vers les lieux de collecte et de livraison », §4.5 et §7.12 « Géolocalisation ».

### Constat

L'app sait déjà afficher une carte du trajet et ouvrir un itinéraire au point exact, mais les réponses de mission contiennent rarement `latitude` / `longitude` pour l'expéditeur, le destinataire et l'agence. Sans coordonnées, l'itinéraire repose sur une recherche d'adresse textuelle, peu fiable dans de nombreux quartiers.

### Proposition

1. **Collecter les positions à la source** :
   - application client : position facultative de l'adresse d'enlèvement et de livraison à la création d'une expédition (le cahier prévoit la géolocalisation au §4.5) ;
   - agences : coordonnées sur la fiche agence (le §6.1 prévoit déjà une carte de zone de couverture) ;
   - marketplace : voir B1.
2. **Les renvoyer dans les réponses livreur**, dans les objets déjà présents :

```json
"expediteur":   { "...": "...", "latitude": 5.3599, "longitude": -3.9870 },
"destinataire": { "...": "...", "latitude": 5.2970, "longitude": -3.9960 },
"agence":       { "...": "...", "latitude": 5.3200, "longitude": -4.0170 }
```

Routes concernées : `GET /expedition/livreur/missions`, `GET /expedition/livreur/missions-disponibles` (agence et ville seulement, voir B1 pour la confidentialité) et les routes marketplace de B1.

### Critères d'acceptation

- [ ] `latitude` / `longitude` (nullable) sont présents sur expéditeur, destinataire et agence dans les réponses missions.
- [ ] Toute agence active a des coordonnées renseignées.

---

## B6 — Notes et instructions sur un colis

**Priorité** : P1 · **Exigence** : §5 « Ajout de notes et instructions sur un colis ».

### Constat

Aucun champ ni aucune route ne permet de transmettre ou de saisir une instruction sur un colis ou une mission.

### Proposition

Deux besoins distincts :

**1. Instructions reçues par le livreur** (lecture seule pour lui)

- Champs texte sur l'expédition : `instructions_enlevement` et `instructions_livraison` (max 500), saisis par l'expéditeur ou le destinataire (application client) ou par l'agence.
- Renvoyés dans les réponses missions du livreur. Pour la marketplace : `retrait.instructions` et `livraison.instructions` (B1).

**2. Notes saisies par le livreur**

Nouvelle table `notes_mission` : `id`, `mission_id` (ou relation polymorphe pour la marketplace), `auteur_id`, `contenu` (max 1000), `photo_url` (optionnelle), `created_at`.

| Méthode | Route | Corps |
|---|---|---|
| GET | `/expedition/livreur/missions/{missionId}/notes` | — |
| POST | `/expedition/livreur/missions/{missionId}/notes` | `{ "contenu": "Client absent, rappelé à 14 h" }` (+ `photo` optionnelle) |
| GET / POST | `/marketplace/livreur/livraisons/{id}/notes` | idem |

**Réponse 201** : `{ "success": true, "note": { "id": "uuid", "contenu": "...", "created_at": "..." } }`

### Règles

- Ajout autorisé tant que la mission est `assignee` (ou `en_cours` en marketplace). Lecture seule ensuite.
- Notes visibles par le back-office et l'agence concernée (et le vendeur en marketplace).

### Critères d'acceptation

- [ ] Les instructions saisies à la création d'une expédition apparaissent dans la mission du livreur.
- [ ] Le livreur peut ajouter et relire ses notes sur une mission en cours, et non sur une mission terminée (422).
- [ ] Les notes sont visibles côté back-office.

### Question ouverte

- Une nouvelle note du livreur doit-elle notifier l'agence ou le back-office (push ou temps réel) ?

---

## B7 — Solde marketplace informatif accessible au livreur

**Priorité** : P2 · **Exigence** : §5 « Consultation des commissions et paiements ».

### Constat

`PARCOURS_LIVREUR_API.md` §5 indique que le livreur a un solde marketplace informatif (`solde_marketplace`). Mais `GET /marketplace/solde` et `GET /marketplace/solde/historique` sont **réservés au type CLIENT** (`MARKETPLACE_ET_ABONNEMENT_API.md` §8). Le livreur ne peut donc pas consulter ses courses marketplace cumulées.

### Proposition

Ouvrir ces deux routes au type `LIVREUR` (hors middleware d'abonnement, comme pour le vendeur), ou créer `GET /marketplace/livreur/solde` et `/marketplace/livreur/solde/historique` avec le même format : chaque ligne d'historique = une livraison terminée, son montant et sa date.

### Critères d'acceptation

- [ ] Un livreur obtient son `solde_marketplace` et l'historique de ses courses marketplace.
- [ ] La route reste accessible quand le livreur est bloqué pour abonnement.

---

## B8 — Statistiques personnelles du livreur

**Priorité** : P2 · **Exigence** : §5 « Statistiques personnelles (colis livrés, etc.) ».

### Constat

L'app peut calculer quelques indicateurs depuis `GET /livreur/solde/historique`, mais l'historique des missions est paginé (20 par page) : des statistiques sur toute la période demanderaient de charger toutes les pages.

### Proposition

`GET /livreur/statistiques?periode=7j|30j|tout` (défaut `30j`) :

```json
{
  "success": true,
  "periode": { "debut": "2026-09-02", "fin": "2026-10-02" },
  "missions": { "terminees": 42, "enlevements": 18, "livraisons": 24, "annulees": 1 },
  "marketplace": { "terminees": 6 },
  "offres": { "proposees": 31, "acceptees": 12, "taux_acceptation": 0.39 },
  "gains": { "total": 105000, "moyenne_par_mission": 2500 },
  "par_jour": [ { "date": "2026-10-01", "missions": 3, "gains": 7500 } ]
}
```

### Critères d'acceptation

- [ ] Les totaux correspondent aux missions `terminee` et aux crédits de la période.
- [ ] `par_jour` couvre chaque jour de la période, y compris les jours à zéro.

---

## B9 — Paiement de l'abonnement par mobile money

**Priorité** : P2 · **Exigence** : §5 « Paiement de la commission périodique (abonnement) via mobile money », §8.6 étape 3 (« Règle la commission via mobile money, directement dans l'application »), §7.12 « Passerelles de paiement mobile money (Orange, Moov, MTN, Wave) ».

### Constat

L'abonnement se règle aujourd'hui **hors application**, puis le livreur le déclare (`POST /abonnement/{echeanceId}/declarer-paiement`) et attend une validation manuelle du back-office. L'app livreur couvre déjà ce flux déclaratif. Il n'y a aucune passerelle de paiement, et aucun événement ne prévient l'app quand le back-office valide (elle doit interroger `GET /abonnement/statut`).

### Proposition

Ce chantier est **commun à toute la plateforme** (paiement client §4.2, marketplace §4.4, abonnements vendeur et livreur). Côté livreur, le besoin minimal est :

| Méthode | Route | Effet |
|---|---|---|
| POST | `/abonnement/{echeanceId}/payer` | Corps `{ "operateur": "orange|mtn|moov|wave", "telephone": "07..." }`. Initie le paiement auprès de l'agrégateur et renvoie `{ "paiement_id", "statut": "en_cours", "url_redirection"? }` |
| GET | `/abonnement/paiements/{id}` | Statut du paiement : `en_cours`, `reussi`, `echoue` |
| (webhook) | route agrégateur → backend | Confirme le paiement, solde l'échéance et lève le blocage **sans intervention manuelle** |

Temps réel : événement `PaiementAbonnement` / `valide` (ou `rejete`) sur `livreur.{id}`, émis aussi lors d'une validation manuelle du back-office, pour que l'app débloque la marketplace sans attendre un rafraîchissement.

La déclaration manuelle actuelle reste disponible en solution de repli.

### Critères d'acceptation

- [ ] Un paiement réussi solde l'échéance et débloque l'accès en moins d'une minute, sans action du back-office.
- [ ] Un paiement échoué laisse l'échéance inchangée et renvoie un motif.
- [ ] L'app reçoit un événement temps réel lors de la validation (automatique ou manuelle).

### Question ouverte

- Quel agrégateur (CinetPay, PayDunya, intégration directe des opérateurs…) et quels pays au lancement ?

---

## B10 — Historique des notifications du livreur

**Priorité** : P3 · **Exigence** : §5 « Notifications de nouvelles missions », §7.8 « Historique des notifications envoyées ».

### Constat

`PARCOURS_LIVREUR_API.md` §7.4 : aucun historique de notifications n'existe pour le livreur. L'app tient un fil d'activité **local**, alimenté seulement pendant que le WebSocket est connecté. Une assignation ou une réponse à une offre reçue app fermée n'y apparaît pas, et le fil est perdu en changeant d'appareil.

### Proposition

Enregistrer les notifications livreur déjà émises (push et temps réel, §7.2 et §7.3) dans une table, et les exposer :

| Méthode | Route | Effet |
|---|---|---|
| GET | `/livreur/notifications?page=1` | Liste paginée : `id`, `type` (`mission_disponible`, `mission_assignee`, `offre_acceptee`, `offre_refusee`, `abonnement_rappel`…), `titre`, `message`, `cible` (`{ "type": "mission", "id": "uuid" }`), `lue`, `created_at` |
| POST | `/livreur/notifications/{id}/lue` | Marque une notification lue |
| POST | `/livreur/notifications/tout-lire` | Marque tout lu |

Rétention proposée : 90 jours.

### Critères d'acceptation

- [ ] Chaque push ou événement livreur du §7.2 et du §7.3 crée une entrée d'historique.
- [ ] L'état lu ou non lu est partagé entre les appareils du livreur.

---

## Q1 — Bascule interville d'une livraison marketplace

**Exigence** : §8.4 étape 8 — « Si le trajet est intervilles, bascule vers le Workflow 8.1, puis vers le Workflow 8.3 pour le dernier segment si livraison à domicile. »

Ce comportement n'apparaît dans aucune des deux documentations API. Merci de préciser :

1. Est-il implémenté ? Si oui, quel événement ou quel statut le signale ?
2. Quel est alors le rôle du livreur marketplace : il dépose l'article à l'agence de départ (comme un enlèvement), puis un second livreur fait le dernier segment ?
3. Comment la livraison marketplace et la ou les missions d'expédition créées sont-elles reliées, pour que l'app affiche un parcours cohérent ?

---

## Récapitulatif des impacts sur les autres applications

| Demande | Application client | Back-office | Agences |
|---|---|---|---|
| B1 | Saisie de l'adresse de livraison (panier) et de l'adresse de retrait (vendeur) | — | — |
| B2 | Vendeur : notification d'acceptation ou de refus, nouveau choix de mode | Délai d'acceptation configurable, file des refus, historique | — |
| B3 | — | — | — |
| B4 | Vendeur et acheteur : consultation des preuves | — | — |
| B5 | Position facultative à la création d'une expédition | — | Coordonnées de l'agence |
| B6 | Saisie des instructions à la création d'une expédition | Consultation des notes | Consultation des notes |
| B9 | Même passerelle pour les paiements client | Suivi des paiements automatiques | — |
