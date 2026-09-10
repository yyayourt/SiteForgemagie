# Forgemagie DOFUS — Mécaniques & Formules (compilation de recherche)

> Document de recherche pour la construction d'un **simulateur de forgemagie**.
> Date de collecte : 2026-09-09. Toutes les valeurs sont **recopiées telles quelles** depuis les sources citées.
> Légende de fiabilité :
> - 🟢 **CONFIRMÉ ANKAMA** — provient d'une source officielle (devblog, patch note, données client/serveur).
> - 🔵 **DONNÉES JEU** — extrait de données de jeu (API DofusDB, dump serveur), non commenté par Ankama mais vérifiable.
> - 🟡 **CONSENSUS COMMUNAUTAIRE** — répété de façon cohérente par plusieurs sources indépendantes et anciennes.
> - 🟠 **HYPOTHÈSE / RESSENTI** — témoignage individuel, non vérifié statistiquement.
> - 🔴 **DOUTEUX / CONTREDIT** — contredit par d'autres sources ou par les données de jeu (souvent contenu SEO généré).

---

## 0. TL;DR — ce qu'Ankama a officiellement dit (et pas dit)

| Fait | Statut | Source |
|---|---|---|
| Ankama **refuse de publier** les formules de forgemagie et les probabilités | 🟢 | [Devblog 2.29 "Amélioration des interfaces Forgemagie" (25/05/2015)](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/435452-amelioration-interfaces-forgemagie) |
| Ankama refuse aussi de publier les formules de **génération de runes (brisage)** | 🟢 | [Devblog "Obtention des runes de Forgemagie" (02/02/2015)](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/429609-obtention-runes-forgemagie) |
| Le **reliquat (puits)** et les **probabilités** ne sont volontairement **pas affichés** en jeu | 🟢 | Devblog 2.29 (idem) |
| Le **poids de rune** s'appelle officiellement **« densité de rune »** et est affiché dans l'infobulle depuis la **2.58** (déc. 2020) | 🟢 | [Devblog 2.58 (10/11/2020)](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1255546-devblog-2-58-modifications-approche) |
| L'interface affiche au maximum **19 lignes d'effets** (2.29), puis 14 lignes dans le module SmithMagic | 🟢 | Devblog 2.29 |
| Max **1 PA exo, 1 PM exo, 1 PO exo** par objet (depuis MàJ 2.3.4, 29/03/2011) ; caps perso : 12 PA / 6 PM / 9 PO | 🟢 | [JOL — Devblog Nouvelles restrictions PA/PM/PO](https://dofus.jeuxonline.info/actualite/30454/devblog-nouvelles-restrictions-pa-pm-po) |
| Ankama ne souhaite **pas** rendre la FM totalement déterministe | 🟢 | Devblog 2015 (Q/R finale) |

Citation clé (Devblog 2.29) :
> « La question d'afficher les valeurs de reliquat et les probabilités de réussite s'est posée à plusieurs reprises. Nous avons décidé de ne pas afficher ces deux informations afin de laisser une place importante et suffisante à l'expérience et à l'expertise accumulées par les joueurs qui maîtrisent le système. »

Citation clé (Devblog 2015, brisage) :
> « **Pouvez-vous nous donner les formules exactes pour la génération des runes ?** Nous ne voulons pas dévoiler ces formules, mais vous pourrez essayer de les déterminer de façon empirique en jouant. »

**Conclusion pour le simulateur : l'algorithme de taux de passage n'existe nulle part publiquement. Toute implémentation sera un modèle empirique.**

---

## 1. LE POIDS (DENSITÉ) DES RUNES

### 1.1 Principe fondamental

```
poids_d_une_rune = valeur_ajoutée_par_la_rune × coefficient_de_poids_de_la_caractéristique
poids_d_une_ligne = valeur_actuelle_de_la_stat × coefficient_de_poids_de_la_caractéristique
poids_de_l_objet  = Σ (poids de chaque ligne)
```
🟡 Consensus universel. Source de la formulation : [Pousset/dofusToolForgemagie — AGENTS.md](https://github.com/Pousset/dofusToolForgemagie) :
> « Le poids d'une rune est le poids normal de sa caractéristique multiplié par la valeur effectivement ajoutée par la rune. Par exemple, `Pa Do Neutre` ajoute 3 dommages élémentaires et pèse `3 × 5 = 15` »

Hiérarchie des runes : **Rune simple → Pa (×3 en valeur) → Ra (×10 en valeur)** 🔵 (vérifié sur DofusDB, cf. §1.3).
⚠️ Attention : **1 Ra ≠ 3 Pa en valeur** (1 Ra = 10 unités, 1 Pa = 3 unités). Huzounet écrit « 1x RA INE = 3x PA INE, 1x PA INE = 3x INE » 🔴 — c'est **faux** en valeur de stat (mais peut refléter un ratio de fusion/craft). Le ratio de **fabrication** cité par Tofus est « 10 runes normales → 1 rune Pa ; 10 Pa → 1 Ra » 🟠 (non vérifié).

### 1.2 TABLE DE RÉFÉRENCE — poids par rune (DOFUS 2.x/3.x)
**🔵 SOURCE LA PLUS FIABLE TROUVÉE** : `lilgallon/dofus-tools`, fichier `js/runes.js`, dont l'en-tête indique :
> « Check the script "py/download_all_runes" to download all the runes from the Dofus servers. »

URL brute : https://raw.githubusercontent.com/lilgallon/dofus-tools/master/js/runes.js
(Le poids est aussi encodé dans le nom du fichier d'icône, ex. `Rune Ga Pa (100).png`.)

**Recopie intégrale (label → poids) :**

| Rune | Catégorie | Poids |
|---|---|---:|
| Rune Age | simple | 1 |
| Rune Cha | simple | 1 |
| Rune Cri | simple | **10** |
| Rune de chasse | simple | **-1** |
| Rune Do | simple | 20 |
| Rune Do Air | simple | 5 |
| Rune Do Cri | simple | 5 |
| Rune Do Eau | simple | 5 |
| Rune Do Feu | simple | 5 |
| Rune Do Neutre | simple | 5 |
| Rune Do Per Ar | simple | 15 |
| Rune Do Per Di | simple | 15 |
| Rune Do Per Mé | simple | 15 |
| Rune Do Per So | simple | 15 |
| Rune Do Pou | simple | 5 |
| Rune Do Ren | simple | 10 |
| Rune Do Terre | simple | 5 |
| Rune Fo | simple | 1 |
| Rune Fui | simple | 4 |
| Rune Ga Pa | simple | **100** |
| Rune Ga Pme | simple | **90** |
| Rune Ine | simple | 1 |
| Rune Ini | simple | 1 |
| Rune Invo | simple | 30 |
| Rune Pa Age | Pa | 3 |
| Rune Pa Cha | Pa | 3 |
| Rune Pa Do Air | Pa | 15 |
| Rune Pa Do Cri | Pa | 15 |
| Rune Pa Do Eau | Pa | 15 |
| Rune Pa Do Feu | Pa | 15 |
| Rune Pa Do Neutre | Pa | 15 |
| Rune Pa Do Pou | Pa | 15 |
| Rune Pa Do Terre | Pa | 15 |
| Rune Pa Fo | Pa | 3 |
| Rune Pa Fui | Pa | 12 |
| Rune Pa Ine | Pa | 3 |
| Rune Pa Ini | Pa | 3 |
| Rune Pa Pi | Pa | 15 |
| Rune Pa Pi Per | Pa | 6 |
| Rune Pa Pod | Pa | 7.5 |
| Rune Pa Prospe | Pa | 9 |
| Rune Pa Pui | Pa | 6 |
| Rune Pa Ret Pa | Pa | 21 |
| Rune Pa Ret Pme | Pa | 21 |
| Rune Pa Ré Air | Pa | 6 |
| Rune Pa Ré Cri | Pa | 6 |
| Rune Pa Ré Eau | Pa | 6 |
| Rune Pa Ré Feu | Pa | 6 |
| Rune Pa Ré Neutre | Pa | 6 |
| Rune Pa Ré Pa | Pa | 21 |
| Rune Pa Ré Pme | Pa | 21 |
| Rune Pa Ré Pou | Pa | 6 |
| Rune Pa Ré Terre | Pa | 6 |
| Rune Pa Sa | Pa | 9 |
| Rune Pa So | Pa | 30 |
| Rune Pa Tac | Pa | 12 |
| Rune Pa Vi | Pa | 3 |
| Rune Pi | simple | 5 |
| Rune Pi Per | simple | 2 |
| Rune Po | simple | **51** |
| Rune Pod | simple | 2.5 |
| Rune Prospe | simple | 3 |
| Rune Pui | simple | 2 |
| Rune Ra Age | Ra | 10 |
| Rune Ra Cha | Ra | 10 |
| Rune Ra Fo | Ra | 10 |
| Rune Ra Ine | Ra | 10 |
| Rune Ra Ini | Ra | 10 |
| Rune Ra Pi Per | Ra | 20 |
| Rune Ra Pod | Ra | 25.0 |
| Rune Ra Pui | Ra | 20 |
| Rune Ra Sa | Ra | 30 |
| Rune Ra Vi | Ra | 10 |
| Rune Ret Pa | simple | 7 |
| Rune Ret Pme | simple | 7 |
| Rune Ré Air | simple | 2 |
| Rune Ré Cri | simple | 2 |
| Rune Ré Eau | simple | 2 |
| Rune Ré Feu | simple | 2 |
| Rune Ré Neutre | simple | 2 |
| Rune Ré Pa | simple | 7 |
| Rune Ré Per Air | simple | 6 |
| Rune Ré Per Di | simple | 15 |
| Rune Ré Per Eau | simple | 6 |
| Rune Ré Per Feu | simple | 6 |
| Rune Ré Per Mé | simple | 15 |
| Rune Ré Per Neutre | simple | 6 |
| Rune Ré Per Terre | simple | 6 |
| Rune Ré Pme | simple | 7 |
| Rune Ré Pou | simple | 2 |
| Rune Ré Terre | simple | 2 |
| Rune Sa | simple | 3 |
| Rune So | simple | 10 |
| Rune Tac | simple | 4 |
| Rune Vi | simple | 1 |

### 1.3 VALEUR AJOUTÉE PAR CHAQUE RUNE — 🔵 données de jeu (API DofusDB, `typeId=78`)

Requête utilisée : `https://api.dofusdb.fr/items?typeId=78&$limit=50&$select[]=name.fr&$select[]=id&$select[]=effects&$sort=id`
(105 runes au total dans la base ; `effects[0].from` = valeur ajoutée)

| id | Rune | Valeur (+) | Carac (id) |
|---:|---|---:|---:|
| 1519 | Rune Fo | 1 | 10 |
| 1521 | Rune Sa | 1 | 12 |
| 1522 | Rune Ine | 1 | 15 |
| 1523 | **Rune Vi** | **5** | 11 |
| 1524 | Rune Age | 1 | 14 |
| 1525 | Rune Cha | 1 | 13 |
| 1545 | Rune Pa Fo | 3 | 10 |
| 1546 | Rune Pa Sa | 3 | 12 |
| 1547 | Rune Pa Ine | 3 | 15 |
| 1548 | **Rune Pa Vi** | **15** | 11 |
| 1549 | Rune Pa Age | 3 | 14 |
| 1550 | Rune Pa Cha | 3 | 13 |
| 1551 | Rune Ra Fo | 10 | 10 |
| 1552 | Rune Ra Sa | 10 | 12 |
| 1553 | Rune Ra Ine | 10 | 15 |
| 1554 | **Rune Ra Vi** | **50** | 11 |
| 1555 | Rune Ra Age | 10 | 14 |
| 1556 | Rune Ra Cha | 10 | 13 |
| 1557 | Rune Ga Pa | 1 | 1 (PA) |
| 1558 | Rune Ga Pme | 1 | 23 (PM) |
| 7433 | Rune Cri | 1 | 18 |
| 7434 | Rune So | 1 | 49 |
| 7435 | Rune Do | 1 | 16 |
| 7436 | Rune Pui | 1 | 25 |
| 7437 | Rune Do Ren | 1 | 50 |
| 7438 | Rune Po | 1 | 19 |
| 7442 | Rune Invo | 1 | 26 |
| 7443 | **Rune Pod** | **10** | 40 |
| 7444 | Rune Pa Pod | 30 | 40 |
| 7445 | Rune Ra Pod | 100 | 40 |
| 7446 | Rune Do Pi | 1 | 70 |
| 7447 | Rune Per Pi | 1 | 69 |
| 7448 | **Rune Ini** | **10** | 44 |
| 7449 | Rune Pa Ini | 30 | 44 |
| 7450 | Rune Ra Ini | 100 | 44 |
| 7451 | Rune Prospe | 1 | 48 |
| 7452–7456 | Rune Ré Feu/Air/Eau/Terre/Neutre | 1 | 55/57/56/54/58 |
| 7457–7460, 7560 | Rune Ré Per Feu/Air/Terre/Neutre/Eau | 1 | 34/36/33/37/35 |
| 7508 | Rune de Signature | (aucun effet) | — |
| 10057 | Rune de chasse | 0 | effectId 795 |
| 10613 | Rune Pa Do Pi | 3 | 70 |
| 10615 | Rune Pa Per Pi | 3 | 69 |
| 10616 | Rune Ra Per Pi | 10 | 69 |
| 10618 | Rune Pa Pui | 3 | 25 |
| 10619 | Rune Ra Pui | 10 | 25 |
| 10662 | Rune Pa Prospe | 3 | 48 |
| 11637 | Rune Fui | 1 | 78 |
| 11638 | Rune Pa Fui | 3 | 78 |
| 11639 | Rune Tac | 1 | 79 |
| 11640 | Rune Pa Tac | 3 | 79 |
| 11641 | Rune Ré Pa | 1 | 27 |
| 11642 | Rune Pa Ré Pa | 3 | 27 |
| 11643 | Rune Ré Pme | 1 | 28 |
| 11644 | Rune Pa Ré Pme | 3 | 28 |
| 11645 | Rune Ret Pa | 1 | 82 |
| 11646 | Rune Pa Ret Pa | 3 | 82 |
| 11647 | Rune Ret Pme | 1 | 83 |
| 11648 | Rune Pa Ret Pme | 3 | 83 |
| 11649 | Rune Do Pou | 1 | 84 |
| 11650 | Rune Pa Do Pou | 3 | 84 |
| 11651 | Rune Ré Pou | 1 | 85 |
| 11652 | Rune Pa Ré Pou | 3 | 85 |
| 11653 | Rune Do Cri | 1 | 86 |
| 11654 | Rune Pa Do Cri | 3 | 86 |
| 11655 | Rune Ré Cri | 1 | 87 |
| 11656 | Rune Pa Ré Cri | 3 | 87 |
| 11657–11666 | Rune (Pa) Do Terre/Feu/Eau/Air/Neutre | 1 / 3 | 88–92 |
| 18719 | Rune Do Per Mé | 1 | 125 |
| 18720 | Rune Do Per Di | 1 | 120 |
| 18721 | Rune Do Per Ar | 1 | 122 |
| 18722 | Rune Do Per So | 1 | 123 |
| 18723 | Rune Ré Per Mé | 1 | 124 |
| 18724 | Rune Ré Per Di | 1 | 121 |
| 19337 | Rune Pa So | 3 | 49 |
| 19338–19342 | Rune Pa Ré Air/Eau/Feu/Neutre/Terre | 3 | 57/56/55/58/54 |
| 29683 | Rune Ra Ré Pou | 10 | 85 |
| 29684 | Rune Ra Do Pou | 10 | 84 |
| 30695–30700 | Rune Ra Ré Terre/Neutre/Feu/Eau/Cri/Air | 10 | 54/58/55/56/87/57 |
| 30942 | Rune Pa Do Ren | 3 | 50 |

### 1.4 COEFFICIENT DE POIDS PAR STAT (dérivé : poids_rune ÷ valeur_rune) — DOFUS 2.x/3.x

| Caractéristique | Coefficient (poids par point) | Vérification (Overmax = ⌊101/coef⌋) |
|---|---:|---|
| Force / Intelligence / Chance / Agilité | **1** | 101 |
| Vitalité | **0,2** (Rune Vi = +5 → poids 1) | 505 |
| Initiative | **0,1** (Rune Ini = +10 → poids 1) | 1010 |
| Pods | **0,25** (Rune Pod = +10 → poids 2,5) | 404 |
| Sagesse | **3** | 33 |
| Prospection | **3** | 33 |
| Puissance | **2** | 50 |
| Dommages (Do générique) | **20** | 5 |
| Dommages élémentaires (Terre/Feu/Eau/Air/Neutre) | **5** | 20 |
| Dommages Poussée | **5** | 20 |
| Dommages Critiques | **5** | 20 |
| Dommages Pièges | **5** (rune Pi=5) — cf. contradiction §6 | 20 |
| % Dommages Pièges (Pi Per) | **2** | 50 |
| Renvoi de dommages (Do Ren) | **10** | 10 |
| % Coups Critiques (Cri) | **10** (2.x) / **30** (1.29) | 10 / 3 |
| Soins (So) | **10** | 10 |
| Fuite / Tacle | **4** | 25 |
| Retrait PA / Retrait PM | **7** | 14 |
| Esquive PA / Esquive PM (Ré Pa / Ré Pme) | **7** | 14 |
| Résistances fixes élémentaires / Poussée / Critique | **2** | 50 |
| % Résistances élémentaires | **6** | 16 |
| % Dommages Mêlée / Distance / Armes / Sorts | **15** | 6 |
| % Résistances Mêlée / Distance | **15** | 6 |
| Invocations | **30** | 3 |
| Portée (PO) | **51** | 1 |
| PM | **90** | 1 |
| PA | **100** | 1 |
| Rune de chasse | **-1** (poids négatif !) | — |

### 1.5 TABLE 1.29 / DOFUS RÉTRO (valeurs DIFFÉRENTES)

**Xixou.io — « Poids des runes Dofus Rétro 1.49 »** (https://xixou.io/guides/poids-des-runes/) 🟡 :

| Stat | Poids |
|---|---:|
| PA | 100 |
| PM | 90 |
| Portée | 51 |
| Coup Critique | **30** |
| Invocation | 30 |
| Renvoi de Sort | 30 |
| Dommages | 20 |
| Soins | **15** |
| Fuite | 5 |
| Tacle | 5 |
| Sagesse | 3 |
| Prospection | 3 |
| Force / Chance / Intelligence / Agilité | 1 |
| Vitalité | **0.2** |
| Initiative | 0.1 |

Règles 1.29 données par la même source :
- « Tous les poids utilisent la fonction floor() (arrondi inférieur) »
- « Le CC pèse 30 (différent de la version 2.0) »
- « En succès critique, le puits diminue aussi » ⚠️ (contredit, cf. §6)
- « **Ga Po n'existe pas en 1.29** »

**Contre-source RÉTRO sur la vitalité — 🟡 (plus crédible pour 1.29)** :
Post de `Schoup#6591` sur le forum officiel ([Fonctionnement du puit sur DOFUS Retro ?](https://www.dofus.com/fr/forum/1780-dofus-retro/2319341-question-fonctionnement-puit-dofus-retro)) :
> « Sinon tu as bien en compte le poids des runes vi. La stat est de **0.25** de poid mais sur les runes c'est **arrondi**.
> Rune vi **1** de poid au lieu de 0.75
> rune pa vi **3** de poids au lieu de 2.5
> et rune ra vi **8** au lieu de 7.5 »

→ En 1.29 : **Rune Vi = +3 vita, Pa Vi = +10 vita, Ra Vi = +30 vita, coefficient 0,25**, avec **arrondi supérieur** des poids de rune (0,75→1 ; 2,5→3 ; 7,5→8).
Corroboré par [Alterya — « Tout sur la Forgemagie en 1.29 »](https://alterya.over-blog.com/2017/11/tout-sur-la-forgemagie-en-1.29.html) :
> « Vitalité (VI) : 0,25 par point […] Les calculs s'arrondissent systématiquement, créant des pertes (exemple : rune VI simple pèse 1 au lieu de 0,75 théorique). »
> « La limite absolue est **101** de poids total par caractéristique en over/exo. Vita : 101 ÷ 0,25 = **404** ; Sagesse : 101 ÷ 3 = **33** ; Intelligence : 101 ÷ 1 = **101** ; Initiative : 101 ÷ 0,10 = **1010**. »

**Table JeuxOnLine (article 235, ancienne, plutôt 1.29/début 2.0)** — https://dofus.jeuxonline.info/article/235/forgemagie 🟡 :

| Caractéristique | Rune | Puissance | Poids |
|---|---|---:|---:|
| Vitalité | Vi | +5 | 1 |
| | Pa Vi | +15 | 3 |
| | Ra Vi | +50 | 10 |
| Sagesse | Sa | +1 | 3 |
| | Pa Sa | +3 | 9 |
| | Ra Sa | +10 | 30 |
| Force/Chance/Intelligence | Fo/Cha/Ine | +1 | 1 |
| | Pa … | +3 | 3 |
| | Ra … | +10 | 10 |
| Agilité | Age | +1 | 1 |
| | Pa Age | +3 | 3 |
| | Ra Age | +10 | 10 |
| Dommage | Do | +1 | 20 |
| | Do Per | +1 % | 2 |
| Portée | Po | +1 | **50** |
| PM | Ga Pme | +1 | 90 |
| PA | Ga Pa | +1 | 100 |
| Coup Critique | Cri | +1 | 30 |
| Initiative | Ini | +10 | 1 / Pa +30 → 3 / Ra +100 → 10 |
| Pods | Pod | +10 | 2,5 / Pa +30 → 7,5 / Ra +100 → 25 |
| Puissance | Pui | +1 | 2 / Pa +3 → 6 / Ra +10 → **30** ⚠️ (20 ailleurs) |

**Autre table communautaire (Tofus)** — https://www.tofus.fr/fiches/forgemagie 🟡 :

| Rune | Bonus | Poids | Maximum |
|---|---|---:|---:|
| Age/Cha/Fo/Ine | +1 stat | 1 | 19 |
| Sa | +1 sagesse | 3 | 19 |
| Vi | +5 vitalité | 1 | 95 |
| Do | +1 dommage | 20 | 19 |
| Do Élémentaire | +1 dégât élém. | 5 | 19 |
| Cri | +1 % critique | 30 | ∞ |
| Po | +1 portée | 51 | ∞ |

⚠️ La colonne « Maximum » à **19** (et 95 = 19×5) est la seule trace d'une « règle des 19 » trouvée dans les sources (cf. §4).

Autres tables secondaires (moins fiables, contenu SEO probablement généré) :
- [dofastuces.fr](https://www.dofastuces.fr/pages/dossiers/tableau-poids-des-runes.html) (table en image uniquement)
- [console-retro.net](https://console-retro.net/poid-rune-forgemagie/) : Vitalité 1 / 3 / 10 ; Sagesse 3 / 9 / 30 ; Fo-Age-Ine-Cha 1 / 3 / 10 ; Puissance 2 / 6 / 20 ; Do fixe 20 ; PA 100 ; PM 90 ; PO 51 ; Invocation 30 ; Initiative 0.1
- [kcscottishgames.org](https://www.kcscottishgames.org/poid-rune-forgemagie-dofus/) 🔴 : prétend « Force/Int/Agi/Cha : **poids 1 jusqu'à 100, puis 2** » et « le poids double subitement quand la stat dépasse 100 » — **non corroboré ailleurs**, à traiter comme hypothèse exotique. Donne aussi Vitalité 0,25 / overmax 505 (incohérent : 101/0,25 = 404).
- [dafous.app](https://dafous.app/guides/poids-runes-fm.html) : caps « Vitalité 505, stats de base 101, Sagesse 33, Initiative 1010, résistance fixe 50, résistance % 16 % ».
- [Pousset/dofusToolForgemagie AGENTS.md](https://github.com/Pousset/dofusToolForgemagie) 🔴 partiellement : donne **Vitalité 1/3/10 avec « Ra Vi ajoute 10 vitalité »** (faux : +50) et **PA = 90** (faux : 100). Le reste de la table est cohérente.
- [Hildreya/roue-de-gamma — forgemagie/runes.js](https://raw.githubusercontent.com/Hildreya/roue-de-gamma/main/forgemagie/runes.js) : structure `{density, effect}` très utile (densité = coefficient, effect = valeur de la rune simple) mais **`vi: {density: 1, effect: 3}` est faux pour Dofus 2.x** (correct : density 0.2, effect 5 — ou valeurs rétro 0.25 / 3). Donne aussi `% Do Mêlée/Distance/Armes/Sorts : density 2` ⚠️ (15 chez lilgallon).

---

## 2. LE PUITS / RELIQUAT

### 2.1 Formule
```
Puits (reliquat) = Σ(poids des stats perdues) − poids de la rune tentée
Reliquat_total = max(0, Reliquat_précédent + (poids_perte − poids_rune_utilisée))
```
🟡 Consensus total. Formulations rencontrées :
- [Papycha — Le Métier la forgemagie](https://papycha.fr/guide-la-forgemagie/) : « **Reliquat total = Reliquat précédent + (Poids de la perte – Poids de la rune utilisée)** » et « le reliquat absorbe les pertes en priorité et **ne descend jamais en dessous de 0** ».
- [Xixou.io](https://xixou.io/forgemagie/) : « **Puits = Poids perdu − Poids rune**. Ex. : rune Sa (w3) tentée, le Do (w20) saute → 17 de puits. »
- [Huzounet](https://huzounet.fr/guides/forgemagie) : « densité des stats sortantes moins densité de la rune placée ».
- [lilgallon/dofus-tools — forgemagie.js](https://raw.githubusercontent.com/lilgallon/dofus-tools/master/js/forgemagie.js) : `puit = rune_removed_puit - rune_added_puit;` (implémentation littérale).
- [Pousset AGENTS.md] : « une invocation (30) perdue lors d'une tentative `Pa Ine` (3) crée un reliquat de **27**. »
- Tutoriel Dofus-Touch : « Reliquat = Poids de la caractéristique perdue - Poids de la rune passée ».
- [1kamas](https://1kamas.com/blog/tutorial-fm-dofus-guide-complet-sur-la-forgemagie/) : « si une rune retire un poids de 51 et une rune de poids 5 est appliquée, cela donne un puits de **46** ».

### 2.2 Consommation du puits par type de résultat
[Pousset/dofusToolForgemagie — AGENTS.md] 🟡 (formulation la plus explicite trouvée) :
> - « Un **succès critique** ajoute la rune **sans puiser dans le reliquat** ni dans les statistiques de l'objet. »
> - « Un **succès neutre** ajoute la rune et **absorbe sa densité depuis le reliquat** si un reliquat est disponible ; autrement, il retire des statistiques. »
> - « Un **échec** n'ajoute pas la rune et **absorbe sa densité depuis le reliquat** si un reliquat est disponible ; autrement, il retire des statistiques. »

Corroboré par `Alpha-Rush#5676` (forum officiel, thread puits Retro) :
> « en succès simple le pui est comblé alors qu'en succès critique le pui est conservé »

⚠️ **CONTRADICTION** : Xixou.io affirme pour la 1.29 « le puits diminue **aussi** lors d'un SC ». Non corroboré. **Question ouverte et non résolue publiquement** : voir le thread JOL de nov. 2024 [Calcul du puits sur Dofus rétro](https://forums.jeuxonline.info/sujet/1438434/forgemagie-calcul-du-puits-sur-dofus-retro) où GuiTeK pose exactement cette question — **restée sans réponse**.

### 2.3 Ordre de priorité des pertes (🟡 source la plus précise)
[Tutoriel FM de F à E — forum DOFUS Touch](https://www.dofus-touch.com/fr/forum/57-tutoriels/20917-tutoriel-forgemagie-f) :
> 1. Overjets / Exos (sauf la caractéristique ciblée)
> 2. Le puits
> 3. Overjets / Exos (même si caractéristique ciblée)
> 4. Caractéristiques absorbant le poids restant

Corroboré par `dayseique#1094` (forum officiel, Retro) : « l'over sera prioritaire à sauter par rapport au puit (sauf si c'est la stat que tu es en train de monter) ».

### 2.4 Durée de vie du puits
🟡 : Le puits est **invisible** et **disparaît** si l'objet change d'inventaire, est équipé, échangé, vendu, mis en banque, ou en cas de déconnexion.
Sources : [JOL art. 235](https://dofus.jeuxonline.info/article/235/forgemagie), [1kamas](https://1kamas.com/blog/tutorial-fm-dofus-guide-complet-sur-la-forgemagie/), [Xixou](https://xixou.io/forgemagie/) (« Les objets déplacés perdent leur puits »).
⚠️ En Dofus 3.x, [Pousset AGENTS.md] affirme « Le reliquat est **affiché directement par l'interface de forgemagie** » — 🟠 à vérifier, cela contredirait le devblog 2.29.

### 2.5 Puits maximum théorique
🟠 `podompodompom#6940` (forum officiel) :
> « le puits maximal théoriquement atteignable est un puits de **99** si on considère qu'un Pa saute grâce à une rune de poids 1 » (100 − 1).
`Kamen-Ecudor#8173` évoque « un puit de **94** » (Ga Pa sautée sur une % rés : 100 − 6).

### 2.6 Bug connu (RÉTRO)
🟢/🟠 Thread officiel [Fonctionnement du puit sur DOFUS Retro ?](https://www.dofus.com/fr/forum/1780-dofus-retro/2319341-question-fonctionnement-puit-dofus-retro) (fév. 2020, réponse Ankama le 04/02/2020, bug **toujours signalé en juillet 2024**) :
> `miaaahhh#6368` : « le puit 1.29 **ne garantit pas** que d'autres stats ne puissent baisser, en particulier les **runes VI** ont une forte tendance à "taper" dans d'autres stats même avec du puit. Les pa vi peuvent aussi avoir le même comportement. »
→ **Pour le simulateur : en 1.29, le puits n'est pas un bouclier absolu.**

---

## 3. LES RÈGLES D'OVER / EXO ET LA LIMITE 101

### 3.1 La règle du poids 101
🟡 **Règle la plus universellement citée après le puits.**
[helleria.wordpress.com — Overmax et Exotique](https://helleria.wordpress.com/about/forgemagie/overmax-et-exotique/) :
> « aucune Overmax (et ça vaut aussi pour l'exo), ne peut au total, en comptant la caractéristique de départ, avoir un poids de plus de **101**. »

[Tutoriel Dofus-Touch] : « On ne peut pas avoir un total de poids Overjet/Exo supérieur à **101**. »
[Huzounet] : « Densité maximale de **101** sur statistiques en over/exo. »

**Table des overmax maximaux — helleria (ancienne, coef Vi = 0,25 et CC = 30)** :

| Caractéristique | Maximum |
|---|---:|
| Vitalité | 404 |
| Force/Agilité/Intelligence/Chance | 101 |
| Sagesse/Prospection | 33 |
| Coup Critique | 3 |
| PA/PM/PO | 1 |
| Initiative | 1010 |
| Résistance % | 16 |
| Dommages élémentaires | 20 |
| Puissance | 50 |

**Table des overmax — dafous.app (moderne, coef Vi = 0,2)** :
Vitalité **505**, stats de base 101, Sagesse 33, Initiative 1010, résistance fixe 50, résistance % 16 %.

⚠️ **CONTRADICTION 404 vs 505** : résolue par l'évolution du coefficient de vitalité (0,25 → 0,2). Voir §6.

**Table Huzounet/dofuspourlesnoobs (colonne « Over max »)** : valeurs allant de 1 à 1010, cohérentes avec ⌊101/coef⌋.

### 3.2 Règles d'over supplémentaires (helleria) 🟠
- « Quand on applique des runes sur un objet avec de l'overmax, les jets ratés/neutres **puisent d'abord dans la caractéristique overmaxée avant d'utiliser le puits**. »
- « Impossible d'atteindre un double overmax sur le même objet (sauf par chaînes de succès critiques). »

### 3.3 Runes sur jets négatifs
🟡 [Tutoriel FM de F à E — DOFUS Touch] :
> « **Les runes pèsent 2 fois moins sur les jets négatifs.** Par exemple, une rune pesant 30 ne pèsera que 15 pour améliorer un malus de -2 à -1. »
**Élément important et rarement documenté — à implémenter dans le simulateur.**

---

## 4. TAUX DE PASSAGE — CE QU'ON SAIT (ET LA « RÈGLE DES 19/20 »)

### 4.1 Les trois (ou quatre) issues
🟡 Universel : **Succès Critique (SC)**, **Succès Neutre (SN)**, **Échec Critique (EC)**.
Codes couleurs officiels depuis la 2.58 🟢 : succès neutres en **jaune**, succès d'effets exotiques en **bleu**, over en **vert plus clair**, effets à 0 en **gris**.

Nuance importante, `kankhun#3768` (forum officiel, 2023) 🟠 :
> « Tu as bien 3 résultats pour une tenta donnée (SC/SN/EC), mais en terme d'affichage c'est un poil plus compliqué. Si la rune tentée passe en SN, mais fait sauter la stat en question en même temps, tu peux te retrouver avec un cas d'**échec neutre**. Si tu as un EC, mais qu'il n'y a plus assez de stats sur l'item, ça peut aussi devenir un échec neutre. »

### 4.2 LA « RÈGLE DU ×20 » (seule heuristique quantitative consensuelle)
🟡 Répétée par presque toutes les sources :
- [Alterya] : « Multipliez la stat de votre rune par **20** environ » pour connaître le seuil de difficulté.
- [Gamosaurus] : « **Effets de la rune × 20 = Maximum avant de changer de palier de runes** ».
- [Tofus] : « un malus s'applique lorsqu'une caractéristique atteint **20× le poids d'une rune** ».
- [Papycha] : « Il est couramment admis qu'une rune ne passe plus à environ **20 fois son bonus**. »
- [DofusFashionista] : « a rune passes reliably while the stat is below ~20x the rune's bonus (+1 runes up to ~20, +3 up to ~60, +10 up to ~200). »
- [1kamas] : Rune Fo (+1) → seuil 20 ; Pa Fo (+3) → seuil 60 ; au-delà → Ra Fo.
- `kankhun#3768` (forum officiel) 🟠 précise : « la rune tentée est trop petite (**ça commence à merder vers 16 × la valeur de la rune**, et passé **20 fois** bon courage) ».

**Recherche « condition icosagonale » / « loi du 19 » / « règle du 1/19 » : AUCUNE SOURCE TROUVÉE** ❗
Aucun des ~40 sites, forums et dépôts consultés n'emploie ce vocabulaire. Les seules occurrences du nombre 19 dans le corpus sont :
1. La colonne « Maximum = 19 » de la table Tofus (19 runes de +1, 19 × 5 = 95 pour la vita) — **cohérent avec « ×20 − 1 »**, donc la « règle des 19 » est très probablement une reformulation de la règle du ×20 : *une rune passe tant que la stat < 20 × valeur_rune, soit au plus 19 runes de ce palier*.
2. L'interface de forgemagie affiche **19 lignes d'effets maximum** (Devblog 2.29) 🟢 — sans lien avec les probabilités.
3. L'exemple « rune Sa (3) fait sauter Do (20) → puits de **19** » (chez GuiTeK / Xixou : 20−1 = 19).
👉 **À traiter comme un terme non standard ; demander la source à l'utilisateur.**

### 4.3 Variables identifiées comme influençant le taux (aucune formule publique)
🟠 Liste la plus complète, `JohnButlerBlood#4794`, [thread « [Forgemagie][Maths] Loi de probabilité du passage de runes »](https://www.dofus.com/fr/forum/1067-artisanat/2214849-forgemagie-maths-loi-probabilite-passage-runes) (05/01/2023) — **recopiée intégralement** :
> - poid max naturel de l'item : agit comme une baisse de probabilité lorsqu'on s'en rapproche
> - poid minimum naturel de l'item : agit comme une baisse de probabilité lorsqu'on passe en dessous
> - poid réel de l'item : agit comme une baisse de probabilité (Ln?) plus il est haut
> - poid max naturel de la ligne : agit comme une baisse de probabilité quand on tente de la dépasser ou au dessus
> - poid minimum naturel de la ligne : agit comme une baisse de probabilité quand on est en dessous
> - poid réel de la ligne : agit comme une probabilité (Ln?) d'echec
> - poid max de 101 en over : barrière infranchissable, agit comme une baisse de probabilité exponentielle quand on s'en rapproche
> - poid minimum (zero ou proche de zero) : barrière infranchissable
> - relicat de l'item : agit comme une probabilité (exponentielle ou Ln?) de succès
> - poid de la rune : optimisée pour une valeur qui dépend à la fois du poid maximum naturel de l'item et du poid total de la ligne
> - nombre de lignes? : A déterminer si celà joue sur la proba
>
> « A priori le taux de Succes Critique ne passe jamais en dessous de 1%. Les runes avec plus de 50 de poid ont 0% de chances de faire un Succès Neutre. »

Réponse de `kankhun#3768` (20/03/2023), **importante méthodologiquement** 🟠 :
> « Ne t'embête pas trop avec des logarithmes et autres exponentielles : ce n'est pas un phénomène physique régi par des équations différentielles […] mais un algorithme codé par un dev Ankama il y a genre 15 ans. Les fonctions les plus probables, c'est **des constantes qui s'ajoutent ou se multiplient, et des relations linéaires**. Et vraiment si besoin, un carré ou une racine carrée sont probablement suffisants […] »
> Grosso modo :
> - « la qualité de l'objet : le poids des lignes actuelles comparé à la plage min et max du jet. Plus c'est haut plus tu galères, effet "Near Perf" à 100 %. »
> - « si la rune tentée est **au-dessus de 80 % de la plage max du jet** (= malus) »
> - « la rune tentée est trop petite (ça commence à merder vers **16×** la valeur de la rune, et passé **20×** bon courage) »
> - « tentative, ou présence d'over ou d'exo (plus dur plus le poids exotique est élevé) »
> - « le type de rune tentée ? […] d'expérience j'ai pas senti de différence notable. »
> - **« Pour ce qui est du reliquat, ça ne change rien en terme de probabilité, ça vient juste amortir tes pertes. »**
> - « La barre des 101 en over (ou exo), c'est un **seuil** oui, mais **pas d'autres effets avant le seuil**. »

Corroboration `LPBA#1394` (Karias) :
> « Je pense aussi (et même presque convaincu) que la présence ou l'absence de puits sur l'objet **n'affecte pas les probabilités de SC**. D'après mes observations, le puits permet seulement d'annuler les probabilités de succès neutre (SN). »

### 4.4 Effet du poids TOTAL de l'objet
🟠 `podompodompom#6940` (2017) :
> « la possibilité qu'une rune, exo ou pas, passe **dépend aussi du poids général de l'objet** : un item ayant 3 lignes de stats à 20 (Intel, chance, agi) aura un poids maximal de 60 ; plus tu t'approches du poids général maximum, moins les runes ont de chances de passer et vice versa. »
> « exemple concret : quand tu veux exo un item % res, quand l'item possède un Pa, Po ou Pm et qu'il saute, on préfère exo l'item en % res avant de remettre le Pa car **sans le Pa l'item perd directement 100 de poids général**, les % de rés exo seront donc plus simples à passer. »

🟠 `killer-eca66613#5482` ([thread densité totale, 2022](https://www.dofus.com/fr/forum/1782-dofus/2373054-forgemagie-lien-probabilite-passage-rune-densite-total-item)) — **relation au jet MAX de la ligne** :
> « une rune cha simple passera facilement jusqu'à ~30 chance, pareil pour la pa cha qui passera jusqu'à environ ~70 chance MAIS ces chances de passer sont aussi influencées par la **valeur maximale de la ligne**. Par exemple, sur un item qui va jusqu'à 100 chance, la pa cha passera plutôt bien jusqu'à 70 voire 80 alors que **sur un item à 80 chance max, tu auras plus de mal à aller à 70** avec une pa cha. »

⚠️ Noter la tension avec la règle du ×20 : ici « rune cha simple jusqu'à ~30 » (et non 20), « pa cha jusqu'à ~70 » (et non 60).

### 4.5 Système avec ou sans mémoire ?
🟠 Question ouverte posée par `QuestionableRengar#5674` ([Révéler l'algo de la forgemagie à la commu ?](https://www.dofus.com/fr/forum/1782-dofus/2368107-reveler-algo-forgemagie-commu)) :
> « est-ce que le passage de runes fonctionne avec des probabilités qui ne dépendent que de l'état actuel de l'item ? (c'est-à-dire, un système sans mémoire). Personnellement j'ai l'impression que non. Le fait de crit une ligne dans un état donné plusieurs fois de suite, a l'air d'amener des échecs sur cette ligne par la suite, quand bien même cette ligne et les autres lignes de l'item seraient redescendues aux valeurs de l'état en question. »
> « est-ce qu'une ligne trop basse peut diminuer le taux de passage des runes sur les autres lignes ? (impression que oui). »
**Non résolu. Aucune donnée.**

### 4.6 Le niveau du métier influence-t-il le taux ?
- 🟡 **NON en Dofus 2.x/3.x** : [thread officiel « Taux de réussite influencé par le niveau du métier ? » (2020)](https://www.dofus.com/fr/forum/1067-artisanat/2326160-taux-reussite-influence-niveau-metier-forgemagie) — `kodeux#7055` : « Peu importe le niveau du métier, tu as autant de chance de passer les runes. Je crois que c'était différent bien avant mais ils ont supprimé ça. » Le niveau ne sert qu'à autoriser les objets de haut niveau.
- 🔴 **Sources anciennes/obsolètes** disant l'inverse : [wiki-dofus.eu](https://wiki-dofus.eu/w/Forgemagie), [JOL art. 235] (« Niveau du métier (plus élevé = meilleur taux), Niveau de l'objet (plus élevé = taux réduit) »), [dofux.org](https://www.dofux.org/articles-186-la-forgemagie.dx) (« La probabilité de réussite de fusion dépend de nombreux facteurs dont le niveau du forgemage, la rune, les bonus de l'objet et les bonus maximum de l'objet »). **Vrai en 1.29 / Rétro, faux en 2.x+.**
→ **Pour le simulateur : paramétrer par version.**

---

## 5. LES EXOS

### 5.1 Taux
| Affirmation | Statut | Source |
|---|---|---|
| Exo PA/PM/PO/Invo : **1 %** de chance, uniquement en **succès critique**, **jamais de succès neutre** | 🟡 | helleria, tofus, gamosaurus, papycha, 1kamas, dofus-touch tuto |
| « Les exos ont **au moins** 1 % de chance de passer, quel que soit l'item et la rune, mais rien ne dit qu'il y a 1 % pile pour les exos PA » | 🟠 | `DA-Team-1#9475`, [thread exo PA/PM/PO](https://www.dofus.com/fr/forum/1067-artisanat/2166785-forgemagie-exo-pa-pm-po) |
| Étude YouTube : **111 exos PM sur 10 000 tentatives = 1,11 %** | 🟠 | vidéo https://youtu.be/n1r8-DIPQQg, relayée dans le thread officiel |
| Intervalle de confiance à 95 % sur ces 10 000 essais : **[0,905 % ; 1,315 %]** — donc « loin de pouvoir affirmer 1,11 % » | 🟠 | `kankhun#3768`, calcul recopié : `p = 1.11% ± 1.96 × (1.11% × (1 − 1.11%)/10000)^0.5 = 1.11% ± 0.2053%` |
| Hypothèse « proba de SC = **1 / poids de la rune** » (1/90 pour PM, 1/100 pour PA, 1/51 pour PO) | 🔴 réfutée | `Le-skimboarder#7558` : « C'est 1/100 pour PA PM PO. J'ai dix ans d'expérience dans la fm, je l'aurais remarqué si le PO passait 2 fois plus souvent que le PA. […] Sinon toutes les runes de poids 1 passeraient en SC à chaque coup. » |
| Postulat de travail proposé : `(SC/SN/EC) = 1 % / 0 % / 99 %` comme **plancher** | 🟠 | `kankhun#3768` |
| Pour les exos de **petit poids** (Do Per So, Invo…), le taux de SC reste ~1 % mais **le taux de SN augmente** ; quand SN dépasse ~50 %, alors SC commence à monter | 🟠 | `kankhun#3768` |
| Over ≫ exo en facilité : « en over ça passe mieux, je suis déjà monté à 10 % [rés] sur une amu torquistik (7 % feu) » | 🟠 | `Le-skimboarder#7558` |
| Premier % de rés en over : « même avec du puits on est en-dessous de **1 chance sur 6** » | 🟠 | `Le-skimboarder#7558` |
| Nombre moyen de tentatives pour un exo à 1 % : ~100 ; **médiane ≈ 69** ; « avec **63** runes, tu as une chance sur deux d'avoir l'exo » | 🟡 (maths) | `lahealeusedelitch76#7458` ; formule `P(X ≤ n) = 1 − q^n` avec `q = 0.99` |

### 5.2 Étude statistique complète (référence)
🟠 **Document PDF de `LPBA#1394` (Karias)** : analyse statistique quasi-complète de l'exo +1 PM d'un Gelano (calculs, graphes, rentabilité).
→ https://drive.google.com/file/d/1uK1L4H2_GLToVXONsyhWzZ2QEtpgJUKZ/view
Thread associé : https://www.dofus.com/fr/forum/1067-artisanat-elevage/2352725-optimisation-forgemagie-exotique-1pm-gelano
Formule de gain simplifiée proposée par `SXD#8177` dans le thread :
```
γ = (π_PA/PM − π_gelano) − π_runePM × n × (1 − q^n)
P(X ≤ n) = 1 − q^n
```

### 5.3 Restrictions officielles 🟢
- MàJ **2.3.4** (29/03/2011) : maximum **1 PA + 1 PM + 1 PO** issus de la forgemagie exotique **par objet**.
- Caps personnage : **12 PA**, **6 PM**, **9 PO** (équipements + consommables, hors sorts).
- Source : https://dofus.jeuxonline.info/actualite/30454/devblog-nouvelles-restrictions-pa-pm-po

---

## 6. TAUX DE BRISAGE (obtention des runes)

> ⚠️ **Ne pas confondre avec la « casse » d'un objet en cours de FM** — un objet ne se détruit **jamais** pendant une forgemagie ; « casser » = briser au concasseur pour obtenir des runes, ou (familièrement) voir une ligne tomber à 0.

### 6.1 Formule communautaire de poids de ligne au brisage
🟠 Implémentée dans [Hildreya/roue-de-gamma — forgemagie/calculator.js](https://raw.githubusercontent.com/Hildreya/roue-de-gamma/main/forgemagie/calculator.js) — **recopiée telle quelle** :
```js
/**
 * Calcule le poids d'une ligne de statistique
 * Formule: poids = (quantité_stat × densité_rune × niveau_item × 3) / (200 × effet_rune) + 1
 */
function calculateStatWeight(statValue, runeKey, itemLevel) {
    const rune = RUNES_DATA[runeKey];
    if (!rune) return 1;
    const weight = (statValue * rune.density * itemLevel * 3) / (200 * rune.effect) + 1;
    return weight;
}
// statValue utilisé = (min + max) / 2
```
Autres formules du même module (rentabilité de brisage, focus) :
```
rentabilité_i           = ratio_i × [poids_i + 0.5 × (Σ poids − poids_i)]
ratio_rune              = prix_rune / densité_rune
% limite AVEC focus     = (prix_item × 100) / rentabilité_focus
rentabilité SANS focus  = Σ (poids_x × ratio_x)
% limite SANS focus     = (prix_item × 100) / rentabilité_sans_focus
```

### 6.2 Formule Papycha
[papycha.fr/taux-de-brisage/](https://papycha.fr/taux-de-brisage/) 🟠 — composants (la formule elle-même est une image non transcriptible) :
> - **LVL** : niveau de l'objet brisé
> - **Poids ligne** = Stat × Poids_u (ex. : 10 % rés feu → 10 × 6 = 60)
> - **PoidRune** : poids de la rune obtenue
> - **Coeff** : coefficient de brisage
>
> Fiabilité annoncée par l'auteur : « sur 200 tentatives testées, le calculateur donne un résultat faux 34 fois » (~17 % d'erreur, erreur max 7 %). « Les formules doivent être utilisées avec beaucoup de précautions. »

### 6.3 Modèle historique JOL (1.29 / début 2.0) — 🟡 le plus détaillé
[Wiki JOL — Les taux de brisage](https://forums.jeuxonline.info/sujet/1045383/les-taux-de-brisage) — **recopié intégralement** :

**Puissance intermédiaire (jet à partir duquel la rune devient possible) :**
> - Rune Fo : « Taux d'obtention variable suivant le niveau de l'objet. (Pour des items +1 : 4 % au lvl 1, 66,66 % au lvl 9. 66,66 % à partir d'un jet à +2 sur tout item.) »
> - Rune Pa Fo : « Taux d'obtention intermédiaire = 2×1 + 1×3 = **+5** en force »
> - Rune Ra Fo : « Taux d'obtention intermédiaire = 2×2×1 + 2×3 + 1×10 = **+20** en force »
> - « Pour les paliers des runes Ra Ini et Ra Pod il suffit de **multiplier par 10** les paliers des runes Ra Cha, Ra Ine, Ra Age ou Ra Fo. »

**Formule de seuil 100 % :**
```
100 % de la rune X = [taux d'obtention intermédiaire de la rune X / (2/3)] / 0,9
```
> - 100 % de Pa Fo = [5/(2/3)]/0,9 = 8,3333 → **+9 force**
> - 100 % de Ra Fo = [20/(2/3)]/0,9 = 33,3333 → **+34 force**
> - Vi (min Pa Vi = 16, min Ra Vi = 62) : 100 % de Pa Vi = [16/(2/3)]/0,9 = 26,6666 → **+27 vita** ; 100 % de Ra Vi = [62/(2/3)]/0,9 = 103,3333 → **+104 vita**
> - Ini (min Pa Ini = 50, min Ra Ini = 200) : 100 % Pa Ini → **+84 ini** ; 100 % Ra Ini → **+334 ini**
> - « Ces taux sont additifs. Ainsi, avec +668 en initiative, vous obtiendrez bien 2 Ra Ini. »

**Note de synthèse du wiki :**
> « formules retenues, **jet × (2/3) × 0,9 = puissance réelle pour sortir des runes** ; **4×Ba + 2×Pa + 1×Ra** »

**Tableau théorique des jets minima pour obtenir à 100 % une rune :**

| Rune | Vi | Sa | Fo | Ine | Cha | Age | Ini | Pod |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Ba | 005 | 02 | 02 | 02 | 02 | 02 | 017 | 017 |
| Pa | 027 | 09 | 09 | 09 | 09 | 09 | 084 | 084 |
| Ra | 104 | 34 | 34 | 34 | 34 | 34 | 334 | 334 |

**Algorithme de répartition aléatoire des runes (ShosuroPhil) — recopié :**
> * on prend la puissance, et on la multiplie par **2/3**
> * on multiplie ça par un nombre aléatoire pris **uniformément dans l'intervalle [0.9, 1.1]**
>
> Ça nous donne un nombre x, qui en général n'est pas entier. Ce x, je le décompose en sa partie entière n, plus sa partie fractionnaire y (x = n + y, n entier, 0 ≤ y < 1).
> On convertirait le n en runes (avec une règle qui ferait que si n = 5, on obtient 1 Pa Ine et 2 Ine ; si n = 4, c'est 4 Ine).
> Et le y serait transformé en une **probabilité d'obtenir une rune supplémentaire**.
> Par exemple, avec x = 4.68, on aurait 4 runes Ine sûres, plus 68 % de chances d'une cinquième Ine.

**Courbes de taux par poids de rune (Orphi) :**
> « La courbe jaune est celle des Ga Pa (Poids = 100), la verte celle des Ga Pme (Poids = 90), la violette les PO (Poids = 51), la rouge les Cri/Invo/Do Ren (Poids = 30), la marron les Do/So (Poids = 20), la rose les Do Pou/Ré Pou/Ré Cri (Poids = 10), la turquoise les Do Neutre/Terre/Feu/Eau/Air/runes Chasse (Poids = 5), la grise les runes Sa/Prospec (Poids = 3), et enfin la noire pour les runes Age/Fo/Ine/Cha (Poids = 1) »
> « le taux d'obtention est **bridé** selon une valeur obtenue expérimentalement, qui est celle de **66,66 % (2/3)** » pour les runes sans palier Pa/Ra (Ga Pa, Ga Pme, Po).

⚠️ **Note : cette table de poids « historique » diffère de la table 2.x** (Cri = 30, So = 20, Do Ren = 30, Do Pou / Ré Pou / Ré Cri = 10). Elle date de ~2009-2011.

**Tables de pourcentages par jet (brisage) :**

| Jet | 6 | 7 | 8 | 9 |
|---|---|---|---|---|
| % obtention Pa Fo/Age/Cha/Ine/Sa/Do élém./Pui/Prospe | 0 % | 14,3 % | 81,25 % | 100 % |

| Jet | 27 | 28 | 29 | 30 | 31 | 32 | 33 | 34 |
|---|---|---|---|---|---|---|---|---|
| % obtention Ra Fo/Age/Cha/Ine | 0 % | 14,3 % | 32,76 % | 50 % | 66,13 % | 81,25 % | 95,56 % | 100 % |

| Jet | 21 | 22 | 23 | 24 | 25 | 26 | 27 |
|---|---|---|---|---|---|---|---|
| % obtention Pa Vi | 0 % | 4,54 % | 21,74 % | 50 % | 70 % | 88,44 % | 100 % |

| Jet | 84 | 85 | 86 | 87 | 88 | 89 | 90 | 91 | 92 | 93 | 94 | 95 | 96 | 97 | 98 | 99 | 100 | 101 | 102 | 103 | 104 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| % obtention Ra Vi | 0 % | 2,94 % | 9,3 % | 15,52 % | 21,6 % | 27,53 % | 33,33 % | 39 % | 44,56 % | 50 % | 55,2 % | 60,53 % | 65,625 % | 70,62 % | 75,51 % | 80,3 % | 85 % | 89,6 % | 94,11 % | 98,54 % | 100 % |

> « Pour les runes Ini et autres du même poids, il suffit de **multiplier les jets par 10**. »

Version reprise sur le forum officiel : [Sujet unique — Runes : le taux de brisage](https://www.dofus.com/fr/forum/1067-artisanat/401099-sujet-unique-runes-taux-brisage) — mentionne « Pour avoir **100 %** de chance d'obtenir une rune Ra Vi il faut que l'objet brisé ait au moins **109 de Vitalité** » (⚠️ 109 vs 104 dans le wiki JOL — contradiction).

### 6.4 Refonte du brisage 🟢 (MàJ 2.27, 02/02/2015)
[Devblog « Obtention des runes de Forgemagie »](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/429609-obtention-runes-forgemagie) :
- « Nous avons modifié la formule actuelle de génération de runes pour **augmenter de façon significative le nombre de runes obtenues pour les objets de haut niveau**. Les objets peuvent désormais générer **plus de runes que la valeur de leurs effets**. »
- Nouveau système « **formule méta** » : bonus de génération aux objets les moins brisés, malus aux plus brisés ; calculés **en temps réel après chaque destruction**, **indépendamment par serveur**, connus **seulement après avoir brisé**.
- « Les bonus et malus peuvent atteindre des valeurs très importantes […] génération de runes **multipliée par plus de 100** […] ou **divisée par plus de 100**. »
- Objets **sans recette** : **malus fixe de 50 %** de génération de runes.
- Les runes ne sont plus générées dans des fragments : directement dans l'inventaire.
👉 **Toutes les tables de taux de brisage antérieures à 2015 sont obsolètes pour Dofus 2.x/3.x.** Elles restent valides pour **DOFUS Rétro**.

Voir aussi : [Système de focus pour la génération des runes de forgemagie](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/587171-systeme-focus-generation-runes-forgemagie) (mécanique de « focus » sur une rune).

---

## 7. FM ÉLÉMENTAIRE (POTIONS) ET AUTRES RUNES SPÉCIALES

### 7.1 Potions de changement d'élément (armes)
🟡 [wiki-dofus.eu](https://wiki-dofus.eu/w/Forgemagie) — table recopiée :

| Potion | Dégâts conservés | Taux de réussite |
|---|---|---|
| Étincelle / Secousse / Crachin / Courant d'Air | 50 % | **50 %** |
| Flambée / Éboulement / Averse / Rafale | 65 % | **35 %** |
| Incendie / Séisme / Tsunami / Ouragan | 80 % | **20 %** |

Variante 1.29 / Rétro ([JOL art. 235](https://dofus.jeuxonline.info/article/235/forgemagie), [JOL Rétro](https://dofusretro.jeuxonline.info/article/14787/specialisations-metiers-craft-forgemagie)) :
> Niveau 1 : −50 % dégâts (meilleur taux) · Niveau 25 : −35 % dégâts (taux moyen) · Niveau 50 : −15 % dégâts (taux bas)

⚠️ Contradiction sur le 3e palier : « 80 % conservés / taux 20 % » (wiki-dofus) vs « −15 % de dégâts » (JOL) = 85 % conservés. Et 1kamas/dofuspourlesnoobs mentionnent « la réussite de cette transformation n'est pas garantie ». `dwardoum#9349` (forum officiel) parle de « la forgemagie des armes, la chance de succès est de **1/4** ».

### 7.2 Runes de transcendance / signature / astrales / corruption
🟢 Devblog 2.58 :
> « Lorsqu'une **rune de transcendance** est passée sur un équipement, celui-ci **ne peut plus être forgemagé ni réinitialisé avec un orbe de forgemagie**. » (+ pop-up de confirmation côté client)
> « Ajout de la catégorie « **Rune de signature** » et « **Rune astrale** » dans l'Hôtel de Vente des Runes. »
🔵 La « Rune de Signature » existe dans DofusDB (id **7508**, typeId 78, `effects: []`).

🟡 [Millenium — Runes de transcendance et de corruption](https://www.millenium.org/guide/316947.html) (MàJ **2.49**, donjon « Les Songes Infinis ») :
> - Runes de transcendance : « appliquent un bonus similaire à ceux de la forgemagie »
> - Runes de corruption : « appliquent à la fois un bonus **et** un malus »
> - « **100 % de chance de passer** »
> - « Elles empêchent tout FM à l'avenir de l'objet »
> - Prérequis : l'équipement **ne doit pas avoir atteint son jet maximal** avant application

⚠️ Les **runes de corruption ont été supprimées** à une MàJ ultérieure (mentionné par `HmmmInteressant#6616` dans le [thread « Ankama, avez-vous changé les taux ? » (déc. 2019)](https://www.dofus.com/fr/forum/1782-dofus/2315861-ankama-avez-change-taux-reussite-forgemagie)).
🟡 [1kamas] : « Les runes de transcendance ont une probabilité de **100 %** de réussite. »

### 7.3 Orbes de forgemagie (reset)
🟡 [dafous.app] : « Quatre orbes de reset existent pour des tranches de niveau (60/120/180/200), remettant les stats aux valeurs de craft et **supprimant tous les gains/pertes de puits**. »
🟢 Devblog 2.58 confirme l'existence de « l'orbe de forgemagie » comme outil de réinitialisation.

### 7.4 « Ga » / « Ma » / Bricoleur / Insolent
- **« Ga »** = préfixe des runes **Ga Pa** (PA) et **Ga Pme** (PM) 🔵 confirmé DofusDB. Il n'existe **pas** de « Ga Po » (la rune de portée s'appelle simplement **Rune Po**) — et selon Xixou, **pas de Ga Po du tout en 1.29**.
- **« Ma »** : ❗ **aucune rune « Ma … » trouvée** dans les 105 runes de DofusDB ni dans le dump `dofus-tools`. Ni « Galet » comme rune. Terme non identifié — probablement une confusion.
- **« Bricoleur » / « Insolent »** : ❗ **aucune occurrence** dans les sources FM consultées. Non identifiés comme mécaniques de forgemagie. À faire préciser par l'utilisateur.

---

## 8. DIFFÉRENCES DOFUS RÉTRO (1.29/1.49) ↔ DOFUS 2.x/3.x

| Élément | DOFUS RÉTRO (1.29 / 1.49) | DOFUS 2.x / 3.x | Fiabilité |
|---|---|---|---|
| Coefficient **Vitalité** | **0,25** (Rune Vi = +3, Pa Vi = +10, Ra Vi = +30) | **0,2** (Rune Vi = +5, Pa Vi = +15, Ra Vi = +50) | 🟡 / 🔵 |
| Poids de rune Vi | Arrondis : 1 / 3 / **8** | Exacts : 1 / 3 / 10 | 🟡 |
| Overmax Vitalité | **404** (101/0,25) | **505** (101/0,2) | 🟡 |
| Coefficient **Coup Critique** | **30** | **10** | 🟡 / 🔵 |
| Overmax CC | 3 | 10 | 🟡 |
| Coefficient **Soins** | **15** | **10** | 🟡 / 🔵 |
| Arrondis | « floor() » systématique (Xixou) / arrondi supérieur pour Vi (Schoup) ⚠️ contradictoire | non documenté | 🟠 |
| Niveau du métier influence le taux | **OUI** | **NON** (supprimé lors de la refonte des métiers) | 🟡 |
| Rune **Ga Po** | n'existe pas | n'existe pas (mais Rune Po existe) | 🟡 |
| Puits protège intégralement | **NON** — les runes Vi/Pa Vi « tapent » dans les stats malgré le puits (bug reconnu, non corrigé depuis 2020) | Oui (aux priorités over/exo près) | 🟠/🟢 |
| Taux de brisage | tables JOL 2009-2011 valides | **obsolètes** depuis 2.27 (formule méta dynamique par serveur) | 🟢 |
| Runes de transcendance/signature/astrales | n'existent pas | existent (2.49+) | 🟡 |
| Restriction 1 exo PA + 1 PM + 1 PO | non (antérieure à 2011) | oui (2.3.4) | 🟢 |

---

## 9. CHRONOLOGIE DES CHANGEMENTS D'ALGORITHME / DE SYSTÈME

| Date | Version | Changement | Source |
|---|---|---|---|
| 26/03/2009 | 1.2x | « La mise à jour de la forgemagie » (référencée par le wiki JOL, contenu non retrouvé) | JOL wiki taux de brisage |
| 29/03/2011 | **2.3.4** | Restrictions exo : max 1 PA / 1 PM / 1 PO par objet ; caps perso 12 PA / 6 PM / 9 PO | 🟢 JOL |
| 02/02/2015 | **2.27** | **Refonte totale du brisage** : nouvelle formule, « formule méta » dynamique par serveur (×100 / ÷100), malus 50 % pour objets sans recette, fin des fragments | 🟢 Devblog |
| 25/05/2015 | **2.29** | Refonte de l'interface FM (inspirée du module SmithMagic d'ExiTeD/Relena) ; **19 lignes d'effets max** ; historique in-interface ; **refus explicite d'afficher reliquat et probabilités** | 🟢 Devblog |
| 2018 | **2.49** | Introduction des **runes de transcendance et de corruption** (donjon Les Songes Infinis) | 🟡 Millenium |
| ~2019 | ? | **Suppression des runes de corruption** — plusieurs joueurs rapportent une dégradation ressentie des taux à cette occasion (jamais confirmée) | 🟠 forum |
| 10/11/2020 → 15/12/2020 | **2.58** | Mode avancé, masquage de lignes, historique enrichi (SN jaune, exo bleu), **affichage de la densité de rune dans l'infobulle**, over en vert clair, effets à 0 en gris, +3 ateliers FM (Frigost/Sufokia/Pandala), +3 HDV de runes, blocage FM après rune de transcendance | 🟢 Devblog |
| ? | ? | **Système de focus** pour la génération de runes | 🟢 [Devblog focus](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/587171-systeme-focus-generation-runes-forgemagie) |
| 2024-2026 | **3.x (Unity)** | Aucun changement d'algorithme FM identifié dans les patch notes consultés. Le reliquat serait affiché par l'interface selon un projet communautaire 🟠 — **à vérifier** | — |

---

## 10. CONTRADICTIONS ENTRE SOURCES (récapitulatif)

| # | Sujet | Source A | Source B | Résolution proposée |
|---|---|---|---|---|
| 1 | Coefficient Vitalité | 0,2 (lilgallon + DofusDB + dafous) | 0,25 (Alterya, Schoup, helleria, kcscottishgames) | **Différence de version** : 0,25 = 1.29/Rétro (Rune Vi = +3), 0,2 = 2.x (Rune Vi = +5). 🔵 vérifié sur DofusDB pour la 2.x |
| 2 | Overmax Vitalité | 404 (helleria) | 505 (dafous, 1kamas) | Idem : 404 = Rétro, 505 = 2.x |
| 3 | Poids Rune Ra Vi | 10 (lilgallon, JOL) | 8 (Schoup, Rétro) | 8 = Rétro (7,5 arrondi), 10 = 2.x |
| 4 | Poids Coup Critique | 10 (lilgallon, roue-de-gamma, papycha, kcscottish) | 30 (Xixou Rétro, JOL, tofus, helleria) | 30 = 1.29/Rétro et ancien Dofus 2, 10 = Dofus 2 moderne/3.x |
| 5 | Poids Soins | 10 (lilgallon, roue-de-gamma, papycha) | 15 (Xixou Rétro) | 15 = Rétro, 10 = 2.x |
| 6 | Poids Portée | **51** (lilgallon, Xixou, papycha, la majorité) | **50** (JOL art. 235) | 51 est la valeur consensuelle ; 50 semble être une erreur/arrondi |
| 7 | Poids Ra Pui | 20 (lilgallon, console-retro, Pousset) | 30 (JOL art. 235) | 20 (coef 2 × 10) est cohérent ; 30 est une erreur |
| 8 | Poids % Dommages Mêlée/Distance/Armes/Sorts | **15** (lilgallon, Pousset) | **2** (roue-de-gamma) | 15 semble correct (⌊101/15⌋ = 6, cohérent avec les caps observés) |
| 9 | Poids Fuite/Tacle | **4** (lilgallon, Pousset) | **5** (Xixou Rétro) | 4 = 2.x, 5 = Rétro (ou erreur) |
| 10 | Rune Vi = +5 ou +3 | +5 (DofusDB 🔵, JOL, tofus, gamosaurus) | +3 (roue-de-gamma `effect: 3`, Rétro) | +5 en 2.x (**données de jeu**), +3 en Rétro |
| 11 | Ra Vi = +50 ou +10 | +50 (DofusDB 🔵, JOL) | +10 (Pousset AGENTS.md) | +50. AGENTS.md est erroné |
| 12 | Poids PA | 100 (partout) | 90 (Pousset AGENTS.md) | 100. Erreur évidente dans AGENTS.md |
| 13 | Le puits est-il consommé en SC ? | Non (Pousset, Alpha-Rush, Karias) | Oui en 1.29 (Xixou) | **Non résolu** — question posée sur JOL en 11/2024 sans réponse |
| 14 | Le reliquat influence-t-il les probas ? | Non, il amortit seulement (kankhun, Karias) | Oui, « agit comme une probabilité de succès » (JohnButlerBlood) ; « ça passe mieux quand on a du puits » (Le-skimboarder) | **Non résolu** |
| 15 | Seuil de passage d'une rune | ×20 (majorité) | ×16 « ça commence à merder », ×20 « bon courage » (kankhun) ; « cha simple jusqu'à ~30, pa cha jusqu'à ~70 » (killer-eca) | Zone floue [16×, 30×] selon le jet max de la ligne |
| 16 | Taux exo PA/PM/PO | 1 % pile (jejebast, consensus) | ≥ 1 % mais pas forcément pile (DA-Team-1) ; 1,11 % (étude 10 000 essais) | IC 95 % = [0,905 % ; 1,315 %] — **1 % reste l'hypothèse de travail** |
| 17 | Proba exo = 1/poids de rune | Postulat de Karias & d'un YouTubeur | Réfuté par Le-skimboarder et kankhun | **Réfuté** |
| 18 | Niveau du métier influe sur le taux | Oui (wiki-dofus, JOL, dofux — anciennes) | Non (forum officiel 2020) | Oui en Rétro, non en 2.x+ |
| 19 | Ra Vi 100 % au brisage | 104 vita (wiki JOL) | 109 vita (forum officiel 2010) | Non résolu (marge d'incertitude du modèle) |
| 20 | 3e potion élémentaire | 80 % dégâts conservés / 20 % réussite (wiki-dofus) | −15 % de dégâts (JOL) | Non résolu |
| 21 | Poids double au-delà de 100 en stat primaire | kcscottishgames | Aucune autre source | 🔴 **Non corroboré, à ignorer sauf preuve** |

---

## 11. IMPLÉMENTATION SUGGÉRÉE POUR LE SIMULATEUR (synthèse)

Modèle minimal cohérent avec le consensus (à calibrer empiriquement — **il n'existe pas de formule officielle**) :

```
# 1. Données statiques
COEF[stat]                      # cf. §1.4 (paramétrable par version : RETRO / DOFUS2)
RUNE[nom] = (stat, valeur)      # cf. §1.3
poids_rune = valeur × COEF[stat]                  (× 0.5 si la ligne est négative)

# 2. État de l'objet
poids_ligne(L)      = valeur(L) × COEF[stat(L)]
poids_min_objet     = Σ poids_ligne(jet_min)
poids_max_objet     = Σ poids_ligne(jet_max)
poids_actuel_objet  = Σ poids_ligne(valeur_actuelle)
reliquat            ≥ 0
poids_over_exo      = Σ max(0, poids_ligne − poids_ligne(jet_max))    # ≤ 101 STRICT

# 3. Tirage d'une tentative de rune r sur la ligne L (modèle empirique)
q_objet = poids_actuel_objet / poids_max_objet              ∈ [0,1]
q_ligne = valeur(L) / jet_max(L)                            ∈ [0,1+]
ratio_palier = valeur(L) / valeur_rune(r)                   # règle du ×20
# P(SC) décroît avec q_objet, q_ligne et ratio_palier ; plancher 1 %
# P(SN) = 0 si poids_rune > 50 (hypothèse JohnButlerBlood) ; sinon complément
# Exo (ligne absente du jet natif) : P(SC) = 1 %, P(SN) = 0, P(EC) = 99 %
# Over : bloqué si poids_over_exo + poids_rune > 101

# 4. Application du résultat
SC : ligne += valeur_rune ; reliquat inchangé
SN : ligne += valeur_rune ; absorber poids_rune dans reliquat sinon retirer des stats
EC : rien ajouté ; absorber poids_rune dans reliquat sinon retirer des stats
# Ordre de retrait : over/exo (hors ligne ciblée) → reliquat → over/exo ciblé → autres lignes
# Gain de reliquat quand une (des) stat(s) saute(nt) : Σ poids sortants − poids_rune
```

---

## 12. URLs À CREUSER DAVANTAGE

### Priorité haute (contenu probablement riche, non extrait)
1. **https://drive.google.com/file/d/1uK1L4H2_GLToVXONsyhWzZ2QEtpgJUKZ/view** — PDF d'analyse statistique complète de l'exo Gelano +1 PM (Karias/LPBA). **Le document le plus rigoureux référencé.**
2. **https://youtu.be/n1r8-DIPQQg** — vidéo des 10 000 tentatives d'exo PM (111 succès). Méthodologie + données brutes à récupérer.
3. **https://github.com/DofMod/SmithMagic** — code ActionScript du module d'ExiTeD (auteur de forgemagie.net), dossier `src/`. **Contient nécessairement la table de poids et le calcul du puits utilisés par la référence historique.** (Le listing de `/tree/` est bloqué par robots.txt ; codeload et l'API GitHub sont bloqués par le proxy — à récupérer via un navigateur ou un clone git.)
4. **https://papycha.fr/taux-de-brisage/** — la formule de brisage est dans une image (`image-3.png`) non transcrite. À lire visuellement.
5. **https://www.dofastuces.fr/medias/images/tableau-poids-des-runes.jpg** et **https://huzounet.fr/images/tableau-poid-runes.png** — tables de poids en image (non téléchargeables via le proxy).
6. **https://forums.jeuxonline.info/sujet/1438434/forgemagie-calcul-du-puits-sur-dofus-retro** — thread nov. 2024 sur la question SN vs EC pour le puits (voir si des réponses ont été postées depuis).
7. **https://forums.jeuxonline.info/sujet/1045383-6/les-taux-de-brisage** (pages 2 à 6) — suite du wiki JOL.
8. Wiki JOL « **Taux de passage des différentes armes à la forgemagie** » (lié depuis le wiki taux de brisage, catégorie Artisanat).
9. Wiki JOL « **La Forgemagie** » (article de catégorie Artisanat, distinct de l'article 235).

### Priorité moyenne
10. https://www.dofus.com/fr/forum/1067-artisanat/283429-forgemagie — **[Sujet Unique] La Forgemagie : Générale** (91+ pages !)
11. https://www.dofus.com/fr/forum/1067-artisanat/2284702-besoin-explication-situation-forgemagie
12. https://www.dofus.com/fr/forum/1103-discussions-generales/2081762-forgemagie-puits
13. https://www.dofus.com/fr/forum/1003-divers/2083808-taux-reussite-forgemagie
14. https://www.dofus.com/fr/forum/1003-divers/1698594-palier-rune-pa-vi-ra-vie
15. https://www.dofus.com/fr/forum/1069-dofus/2351146-forgemagie-end-game-runes-signature-transcendantale
16. https://www.dofus.com/fr/forum/1067-artisanat-elevage/2351393-forgemagie-placer-runes-transcendance
17. https://www.dofus-touch.com/fr/forum/10-divers/23634-taux-reussite-forgemagie (bloqué robots.txt)
18. https://www.jeuxvideo.com/forums/1-9655-2202519-1-0-1-0-limite-de-la-forgemagie-exotique.htm
19. https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/587171-systeme-focus-generation-runes-forgemagie
20. https://www.youtube.com/watch?v=1PFgt8UQsLk — « TUTO FORGEMAGIE : LE RELIQUAT (avec exemples d'optimisation) »
21. https://www.youtube.com/watch?v=LIHRzH27Cgk — « GUIDE COMPLET de la FORGEMAGIE sur DOFUS »
22. https://www.youtube.com/watch?v=ZccMe5gZXVg — « DOFUS RETRO : LA FORGEMAGIE FACILE »
23. Tutoriel « **de Nozada** » (cité sur le forum officiel comme référence puits/poids) — à retrouver.
24. https://huzounet.fr/guides/forgemagie — tables de transcendance en images.
25. https://lightcroft.itch.io/forgemagiedofus — simulateur ForgeMagix (« mécaniques encore en cours d'ajustement »).

### Dépôts de code à explorer
26. https://github.com/zoezenKebab/gdFM — « simulateur de forgemagie de Dofus » (GDScript)
27. https://github.com/Slycex13/FMSimulator
28. https://github.com/Kaz-ookid/auto-forgemagie — packet sniffing (donne les vraies valeurs serveur !)
29. https://github.com/JustNao/DofusHelper — `modules/nomanslandSniffer.py` contient un dict `runes[id]['poids']`
30. https://github.com/Vicfou-dev/dofus-fm-server — bot FM (conditions de déclenchement d'exos)
31. https://github.com/Pousset/dofusToolForgemagie — `src/domain/constants.py` (`STAT_BASE_WEIGHTS`)
32. https://github.com/Hildreya/roue-de-gamma — `forgemagie/calculator.js` + `forgemagie/runes.js`
33. https://raw.githubusercontent.com/lilgallon/dofus-tools/master/js/runes.js — **table de poids de référence (dump serveur)**
34. https://github.com/Sackeys/dofensive-old — `DoMage/index.html`, « Encyclopédie des runes de forgemagie » (poids, overmax, puits)
35. Émulateurs **StarLoco-Game** (https://github.com/StarLoco/StarLoco-Game) — code serveur 1.29 en Java, `src/org/starloco/locos/` ; chercher la logique de forgemagie (`ITEM_TYPE_RUNE_FORGEMAGIE = 78` dans `kernel/Constant.java`). **Piste la plus prometteuse pour l'algorithme exact 1.29.**

### API de données
36. `https://api.dofusdb.fr/items?typeId=78&$limit=50&$select[]=name.fr&$select[]=effects&$sort=id` — 105 runes avec leurs effets exacts (accessible depuis un navigateur ; bloqué par le proxy en CLI).
37. `https://api.dofusdb.fr/items?...` — jets min/max des équipements (nécessaires pour calculer poids_min/poids_max d'un objet).

---

## 13. NOTES D'ACCÈS (pour reproduire la collecte)
- `www.dofus.com`, `forums.jeuxonline.info`, `papycha.fr`, `huzounet.fr` (images), `api.dofusdb.fr`, `r.jina.ai`, `codeload.github.com`, `data.jsdelivr.com` : **bloqués par le proxy sortant en CLI** (CONNECT 403).
- `www.dofus.com` et `dofus-touch.com` : **bloqués par robots.txt** pour l'outil de fetch automatique.
- ✅ Ces sites restent accessibles via un **navigateur** (outils Chrome) — c'est ainsi que les threads officiels et l'API DofusDB ont été extraits.
- ✅ `raw.githubusercontent.com` fonctionne en CLI (mais pas l'API GitHub ni codeload).
