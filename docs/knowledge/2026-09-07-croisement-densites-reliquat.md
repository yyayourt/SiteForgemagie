# Forgemagie DOFUS 3 / Unity — Croisement systématique des tables de densité et de la comptabilité du reliquat

> Périmètre : croisement par version des tables de poids et des implémentations du puits. La formule SC/SN/EC est hors périmètre (rappel : bornes officielles SC ≥ 15 % en FM normale, ~1 % exo — tutoriel Ankama /420190). Chaque affirmation porte son statut épistémique et sa version documentée. Aucune valeur non sourcée.

---

## 1. Tableau d'inventaire des sources

| Source (URL) | Auteur | Dates | Version documentée | Format | Indépendance présumée |
|---|---|---|---|---|---|
| github.com/N3ROO/dofus-tools (miroir lilgallon) + gallon.dev/dofus-tools/forgemagie.html | Lilian Gallon | 2018–2021 | Dofus 2.x (déduit, non versionné) | Table codée en dur + carnet manuel | Racine déjà analysée |
| github.com/KamelAkar/Calculateur_Brisage_Dofus | KamelAkar | v1.4 26/04/2025 | Dofus 3 (API dofusdb, non versionné) | Dict. Python `POIDS_RUNES` codé en dur + formule brisage | Indépendante (brisage) |
| github.com/Icksir/crushing-calculator (kamaskope.icksir.com) | Icksir | 157 commits, actif 2025–2026 | **Dofus Unity 3.4 (explicite dans le README)** | Backend FastAPI + OCR prix | Indépendante (brisage) |
| huzounet.fr/guides/forgemagie | Huzounet | publié 09/03/2025, màj 21/01/2026 | **Dofus 3 (explicite)** | Guide + image tableau densités | Semi-indépendante |
| millenium.org/guide/282643 (p.2) | Flammi | 20/02/2018 | Dofus 2.x | Tableau illustré complet (icônes) | Racine 2.x |
| dofastuces.fr (Asfax) | Asfax | ~2016, comm. jusqu'en 2020 | Dofus 2.x | Image + commentaires correctifs | Racine 2.x |
| laforgemagiedofus.blogspot.com | anonyme | ~2013–2015 | Dofus 2.0 / Touch | Liste texte | Racine 2.0 |
| tofus.fr/fiches/forgemagie | Tofus | non daté | Dofus 2.x | Guide texte + comptabilité puits | Dérivée |
| xixou.io/guides/poids-des-runes + /forgemagie | Xixou | 2024–2025 | **Dofus Rétro 1.49 (explicite)** | Table + calculateur | Racine 1.29/Rétro |
| gamosaurus.com/…/forgemagie-le-guide-complet | Gamosaurus | récent | Dofus (transcendance) | Guide | Dérivée |
| dofus-portals.fr/forgemagie | Dofus Portals | 2025 | Dofus 3 (105 runes) | Table + recherche | Dérivée |
| dafous.app/guides/poids-runes-fm.html | Dafous | 2026 | Dofus Unity | Table | Dérivée |
| DofMod/SmithMagic (ExiTeD / Relena) | ExiTeD | ~2.x | Dofus 2.x | Module client (lit le poids affiché) | Indépendante (lecture live) |
| Androlax2/DofusReliquat | Androlax2 | v1.0.2 13/10/2023 | Dofus 2.x | Carnet reliquat JS | Dérivée conceptuelle lilgallon |
| reilcuob.fr/forgemagie | Reilcuob | non daté | Dofus 2.x | Calcul puits | Indépendante |
| dofus.com tutoriel officiel /420190 | Ankama | courant | Dofus (toutes) | **SOURCE PRIMAIRE** (bornes 15 %/1 %) | Racine officielle |
| jeuxonline.info actualités 48173 (2.29) / 58753 (2.58) | Ankama (relayé) | 2012 / plus tard | Dofus 2.x | **SOURCE PRIMAIRE** (changelog) | Officielle |
| wiki-dofus.eu/w/Forgemagie | Wiki Dofus | — | Dofus 2.x / Rétro | Guide potions | Dérivée |

**Résultats négatifs (aucun champ de densité par point exploitable) :** api.dofusdb.fr, dofusdude/doduapi (api.dofusdu.de), Dofus-Batteries-Included/DDC, bot4dofus/Datafus — détail au §6.

---

## 2. Matrice caractéristique × source (densité par point) + valeur retenue

| Caractéristique | Millenium 2.x | dofastuces 2.x | lilgallon 2.x | KamelAkar brisage | Icksir U3.4 | Huz D3 | Xixou Rétro 1.49 | Vérifié en jeu Unity (utilisateur) | **Valeur retenue Unity** | Statut épistémique / justification |
|---|---|---|---|---|---|---|---|---|---|---|
| PA | 100 | 100 | 100 | 100.0 | (implicite brisage) | 100 | 100 | — | **100** | SOURCE PRIMAIRE indirecte (borne over 505 vita = 101 ↔ 1 PA = 100) |
| PM | 90 | 90 | 90 | 90 | — | 90 | 90 | — | **90** | Convergence large |
| Portée | 51 | 51 | 51 | — | — | (tableau img) | 51 | — | **51** | Convergence ; test en jeu « PO = 51 » (≠ 50) |
| Invocation | 30 | 30 | 30 | — | — | 30 | 30 | — | **30** | Convergence ; test dora « invoc = 30 » |
| Sagesse | 3 | 3 | 3 | 3 | — | — | 3 | — | **3** | Convergence |
| Prospection | 3 | 3 | 3 | — | — | — | 3 | — | **3** | Convergence |
| Dommages (Do générique) | 20 | 20 | 20 | — | — | 20 | 20 | — | **20** | Convergence |
| % Critiques | 10 | (comm. erroné) | — | 10 | — | — | **30** (Rétro) | **10/pt** | **10** | CONTRADICTION de version résolue (voir §3) |
| Renvoi de dommages | **10** | — | **10** | — | — | — | 30 (Rfx Rétro) | **5/pt** | **5** | CONTRADICTION non résolue par changelog (§3) — jeu prime |
| Soins | 10 | (comm. « 30 avant ») | — | — | — | — | 15 (Rétro) | — | **10** | Divergence de version (30→10 en 2.x) |
| Do élém./poussée/cri/piège | 5 | 5 | — | — | — | — | 5 | — | **5** | Convergence |
| Tacle / Fuite | 4 | 4 | — | — | — | — | 5 (Rétro) | **4/pt** | **4** | SOURCE PRIMAIRE Unity |
| Esquive PA/PM ; Retrait PA/PM | 7 | 7 | — | — | — | — | — | — | **7** | 2.x uniquement, non revérifié Unity |
| % Résistance élémentaire | 6 | 6 | — | — | — | — | — | — | **6** | 2.x |
| % Dommages (dist/armes/sorts/mêlée) | 15 | 15 | — | — | — | — | — | — | **15** | 2.x |
| % Résistance mêlée/distance | 15 | 15 | — | — | — | — | — | — | **15** | 2.x, INCONNU si conservé |
| Résistance fixe élém/pou/cri | 2 | 2 (corrigé de 5) | — | — | — | — | — | — | **2** | 2.x (correction communautaire documentée) |
| Puissance | 2 | — | — | — | — | — | — | — | **2** | 2.x |
| Puissance pièges | 2 | — | — | — | — | — | — | — | **2** | **INCONNU** (aucun test) |
| Force / Intel / Chance / Agilité | 1 | 1 | 1 (×3 Pa, ×10 Ra) | 1.0 | — | 1 | 1 | — | **1** | Convergence forte |
| Vitalité | 0,2/pt (rune=1) | 0,2 (« 0,25 » débattu) | — | **0,2** | — | 0,2 (505=101) | 0,2 | — | **0,2** | Convergence ; borne 505×0,2≈101 (§3) |
| Initiative | 0,1/pt (rune=1) | — | — | — | — | — | 0,1 | — | **0,1** | Convergence |
| Pods | 0,25/pt (rune=2,5) | 0,25 | Ra ×10 | (0,2 ?) | — | 2,5 (rune +10) | — | **0,25/pt** | **0,25** | SOURCE PRIMAIRE Unity (rune Pod +10 = 2,5) |

**Note d'erreur typographique :** la page Millenium affiche « Ga pa : Poids normal 90 » (au lieu de 100) — coquille manifeste contredite par toutes les autres sources et par la borne over. Ne pas la propager.

---

## 3. Divergences expliquées vs inexpliquées

### Expliquées par la version (changelog ou attestation datée)
- **% Critiques 30 (Rétro/1.29) vs 10 (2.x / Dofus 3).** Attesté verbatim par le blog Alterya : « sur 2.0 les runes critique ont un poids de 10 alors que sur 1.29 c'est 30 !! ». Vérifié **10/pt en jeu Unity** par l'utilisateur. La valeur 30 des tables Xixou est **correcte pour Rétro 1.49 uniquement**.
- **Soins 30 → 10.** Forum officiel Ankama (proposition 2283049) : « avant son poids était même de 30, et quand il est passé à 10 la ceinture strigide est devenue beaucoup plus dure à exo ré cri ». Baisse actée en 2.x. Xixou (Rétro) affiche 15 ; Millenium (2.x) affiche 10.
- **Résistance critique/poussée 5 → 2.** Commentaires correctifs datés sur dofastuces (2016) : « Res crit et poussée = 2 » ; « les re pou/crit ont un poids de 2 aussi ». Millenium confirme 2.
- **Vitalité alignée à 0,2/pt.** Commentaire dofastuces : « 5 vita = 1 de poids, ça s'est aligné sur les autres runes depuis qu'elles ont changé, en gros 1 de vita c'est 0,2 de poids ». La valeur « 0,25 » est une **confusion avec le poids des Pods** (0,25/pt). La borne over 505 vita = 101 densité (Huz, Dofus 3) confirme arithmétiquement 0,2 (505 × 0,2 = 101).

### Inexpliquées / non tranchées
- **Renvoi de dommages : 10 (Millenium + lilgallon, 2.x) vs 5 (vérifié en jeu Unity).** Divergence réelle. Deux hypothèses : (a) changement 2.x→3 non documenté par un changelog trouvable ; (b) erreur historique recopiée. La convergence 10/10 entre Millenium et lilgallon **ne constitue pas une preuve** (recopie probable, voir §4). **La valeur 5 en jeu Unity prime (SOURCE PRIMAIRE).**
- **Portée 50 vs 51.** Aucune source sérieuse ne donne 50 ; 51 est confirmé par test en jeu (blog laforgemagiedofus : « -3 Fo, -48 Ine → PO vaut bel et bien 51 »). Le « 50 » n'apparaît que dans des vulgarisations approximatives (arrondi mental).
- **Puissance pièges = 2 : INCONNU** — aucune source récente ni test reproductible.

### Chronologie officielle des changements de poids (changelogs Ankama)
- **2.29** (2012 ; jeuxonline actualité 48173) — SOURCE PRIMAIRE d'un changement de densité, verbatim : « Le poids en forgemagie de certains effets est modifié ». La liste détaillée des effets touchés n'est **pas** reproduite dans l'extrait accessible → reste INCONNU. Refonte de l'interface FM la même version (inspirée du module ExiTeD).
- **2.58** (jeuxonline 58753) — verbatim : « Le "poids" des runes est désormais affiché dans l'infobulle de l'objet, pour aider les forgemages à compter les reliquats. »
- **Aucun changelog 3.x** modifiant une densité n'a été trouvé.

---

## 4. Généalogie des sources

- **Racine 1.29 / Rétro :** Alterya, Xixou (1.49). Valeurs distinctes (% Crit 30, Soins 15, Tacle/Fuite 5). **Ne jamais mélanger avec 2.x/3.**
- **Racine 2.x illustrée :** Millenium (Flammi, 2018) = table la plus complète (icônes) ; dofastuces (Asfax) = image concurrente, corrigée par ses commentaires. Elles partagent l'ordre et les libellés mais portent des **erreurs différentes** (Millenium : « Ga pa 90 » ; dofastuces : Ré cri 5 corrigé en 2) → **origine commune plus ancienne recopiée séparément**, pas copie directe l'une de l'autre.
- **lilgallon / Androlax2 :** lilgallon (2018) valeurs 2.x codées en dur ; Androlax2/DofusReliquat (2023) reprend la logique de carnet manuel → dérivé conceptuel.
- **Lecture live (réellement indépendantes) :** DofMod/SmithMagic (ExiTeD) lit le poids affiché par le client 2.x → non recopié. Ce module a inspiré l'interface officielle 2.29 (crédité par Ankama).
- **Brisage indépendant :** KamelAkar et Icksir dérivent leurs poids de la formule de brisage `poids = (valeur × poids_rune × niveau × 0,015) + 1`, pas des tables FM. Convergence PA=100 / Vita=0,2 → **corroboration réelle mais partielle** (ils n'exposent pas toutes les caractéristiques).
- **Conclusion de généalogie :** les seules sources non recopiées sont (a) l'infobulle en jeu (2.58+), (b) les tests en jeu de l'utilisateur, (c) les modules de lecture live. **Toute convergence entre guides web doit être tenue pour suspecte de recopie** tant qu'une origine indépendante n'est pas établie.

---

## 5. Tableau comparatif des implémentations du puits

| Implémentation | Mode de calcul | Arrondi / décimales | Malus | Exo / over | Borne 101 | Purge | Négatif |
|---|---|---|---|---|---|---|---|
| lilgallon (2.x) | (a) carnet manuel « rune sautée − rune passée » | non géré | non | non | non | non | interdit (implicite) |
| Androlax2/DofusReliquat | (a) carnet manuel | non | non | non | non | non | non |
| reilcuob.fr | (a) carnet + liste des runes plaçables | — | TODO (annoncé non fait) | overmax TODO | non | non | non |
| DofMod/SmithMagic | (b) dérivé de l'état visible (Σ poids lignes, lecture live) | oui (lit le jeu) | oui (affiche) | affiche over | non explicite | — | — |
| KamelAkar (brisage) | formule brisage — **PAS un simulateur de reliquat** | décimales conservées | gère effets négatifs | force max PA/PM/PO/Invo | s.o. | s.o. | s.o. |
| Icksir (Unity 3.4) | brisage + OCR prix + rentabilité — **pas de reliquat** | — | — | — | s.o. | s.o. | s.o. |

**Constat :** aucune implémentation open-source trouvée n'implémente la borne 101 (par ligne vs globale), ni la purge du reliquat, ni le reliquat fractionnaire de façon documentée dans son code. La **formule communautaire du reliquat** est unanime et non contredite : reliquat = densité sortante − densité rune ; exemple chiffré nommé (tofus.fr) : « on a perdu 1 Coup Critique donc 30 et on a utilisé une rune de poids 10 donc : 30 − 10 = 20. On aura donc 20 de puits ». tofus précise : décimales conservées (« le reliquat compte les décimales et n'arrondit pas »), jamais négatif, et **purge** : « le reliquat sera perdu si l'objet est équipé ou mis en HdV ». Huz (Dofus 3) reformule identiquement avec l'exemple PA INE (densité 3) faisant chuter INVOCATION (densité 30) → reliquat 27.

---

## 6. Ce qui a changé / n'a pas changé sur Unity (sources primaires citées)

- **Reliquat affiché en jeu — CONTRADICTION résolue.** Le tutoriel Ankama justifiait le non-affichage : « Nous avons décidé de ne pas afficher ces deux informations [reliquat et probabilités] afin de laisser une place importante à l'expérience […] des joueurs ». MAIS la 2.58 a mis le **poids** dans l'infobulle, et Huz (Dofus 3, màj 2026) écrit verbatim : « Aujourd'hui, nous n'avons plus besoin de calculer ce Reliquat, il s'affiche directement sur l'onglet de forgemagie » (capture reliquat.png). **Statut : reliquat affiché sur Unity 3**, contrairement à l'ancien état « invisible » de la 2.x.
- **Borne 101 (over + exo) — confirmée Dofus 3.** Huz verbatim : « L'over maximal d'un item ne peut excéder 101 de densité sur une statistique (Ex: 505 vita, 101 agilité...) » ; « Les statistiques en exo ne peuvent excéder 101 de densité (Ex: 10 ini et 1 PA, 55 vita 1 PM...) ». Portée : **par ligne/statistique**. La **base de mesure** (valeur totale de la ligne vs part au-dessus du jet max) et le **cumul global** restent NON tranchés par source primaire.
- **Runes de transcendance — introduites en 2.49.** Millenium (guide 316947) verbatim : « Les runes de transcendance […] arrivent sur Dofus avec la mise à jour 2.49 […] Ces runes ont 100 % de chance de passer. Elles empêchent tout FM à l'avenir de l'objet. Pour appliquer une de ces runes l'objet ne doit pas dépasser son jet maximal au moment de l'application. » Règles Unity (Huz) : ni over ni exo avant pose, règle densité ≤ 100/101 si la trans fait office d'over. Rangs Ta/Pata/Rata avec seuils de ligne max avant pose (Gamosaurus, ex. Ta Ini +100 si item ≤ 610 ini ; Pata Ini +150 si ≤ 410 ; Rata Ini +200 si ≤ 210). Depuis 2.58 (jeuxonline 58753), verbatim : « la fusion d'une rune de transcendance doit désormais être validée par le client » et « Les objets modifiés par une rune de transcendance ne peuvent plus être modifiés par l'utilisation d'un orbe de forgemagie ».
- **Migrateur d'objets (2.72, nov. 2024).** next-stage.fr (mars 2026) verbatim : « Cet outil, introduit avec la mise à jour 2.72, reste inaccessible aux joueurs mais permet à Ankama de modifier rétroactivement les valeurs d'un équipement. » Une modification sur un item transcendé fait sauter over/exo/restriction FM (guidactik 2.72).
- **Potions de forgemagie élémentaire — CONTRADICTION toujours ouverte, désormais localisée par version.** wiki-dofus.eu (Rétro/2.x) donne **50 % / 65 % / 80 %** de dégâts conservés (Étincelle/Flambée/Incendie ; les paliers « supérieurs » conservant le plus de dégâts). jeuxonline (Rétro, article 14787) : la potion de niveau 50 (Incendie/Séisme/Tsunami/Ouragan) « ne réduit les dégâts que de 15 % » → **85 % conservés** en Rétro. L'écart 80 % (wiki 2.x) vs 85 % (Rétro) et l'existence répandue de la valeur « 85 % » relèvent donc probablement d'une **différence Rétro ↔ Dofus 2/3**, mais **aucun changelog 3.x** n'a pu l'acter. Statut : CONTRADICTION non résolue pour Unity.
- **Densités sur Unity — pas de changement documenté.** Aucun changelog 3.x ne modifie une densité. Les valeurs 2.x sont présumées conservées, **sauf Renvoi de dommages** (5 en jeu Unity vs 10 en tables 2.x), qui suggère soit un changement silencieux soit une erreur historique recopiée.

---

## 7. Données du client (datamining)

- **Aucun dépôt de datamining Unity n'expose de champ de densité/poids de forgemagie par caractéristique ou par rune.** Le seul champ « weight » présent est **`realWeight`** sur les items dofusdb = **poids d'inventaire en pods**, sémantiquement distinct de la densité FM. (Confirmé via le modèle DofusSharp.DofusDb.ApiClients : propriété `RealWeight`, tri `sort[realWeight]`.)
- **KamelAkar** consomme l'API dofusdb pour les `effects` (champs `from`, `to`, `characteristic`, `effectId`) mais **code en dur** son dictionnaire `POIDS_RUNES` (Vitalité = 0.2, Force = 1.0, PA = 100.0), avec l'avertissement de le mettre à jour manuellement → **preuve directe** que l'API ne fournit pas la densité.
- **DDC (Dofus-Batteries-Included)** extrait les datasheets du client Unity (BepInEx, version documentée récente 3.1.12.15) ; aucun champ densité identifié dans la doc ni chez les consommateurs, mais le JSON brut n'a pas pu être inspecté exhaustivement → **non exclu à 100 %** (voir §8).
- **dofusdude/doduapi** (OpenAPI 3.0, DOFUS 3, `/dofus3`) : effets décrits par `int_minimum`/`int_maximum` ; **aucun** champ de poids/coefficient FM ; pas d'endpoint « rune weight ».
- Le poids FM est caractérisé par Ankama/communauté (jeuxonline) comme **« une donnée non visible »**, non exposée en datasheet publique — lisible seulement via l'infobulle en jeu (2.58+). C'est cohérent avec le fait que tous les outils l'embarquent en dur.

---

## 8. INCONNUS et CONTRADICTIONS restantes + observation qui trancherait

| Point | Statut | Observation en jeu qui trancherait |
|---|---|---|
| Renvoi de dommages 5 vs 10 | CONTRADICTION | EC/SN contrôlé sur une ligne renvoi, lire la densité perdue (déjà 5 côté utilisateur — confirmer sur N tentatives) |
| Puissance pièges = 2 | INCONNU | EC contrôlé sur item à puissance pièges, lire la ligne perdue |
| % Résistance mêlée/distance = 15 conservé sur Unity | INCONNU | Test EC Unity sur item portant ces stats |
| Esquive/Retrait PA/PM = 7 sur Unity | INCONNU (2.x seulement) | Test EC Unity |
| Borne 101 : base de mesure (ligne totale vs part > jet max) | NON TRANCHÉ | Over contrôlé jusqu'au refus, comparer densité totale de la ligne vs densité de la seule part au-dessus du jet max |
| Borne 101 : par ligne vs cumul global sur l'objet | Par ligne (Huz) ; cumul non testé | Tenter deux over simultanés proches de 101 chacun sur le même objet |
| Potions FM : 50/65/80 % (2.x/wiki) vs 85 % (Rétro) sur Unity | CONTRADICTION | Lire l'infobulle de chaque potion élémentaire en jeu Unity |
| Changelog 2.29 : liste exacte des poids modifiés | INCONNU | Retrouver le changelog 2.29 complet (archive forum Ankama) |
| Champ densité dans le JSON brut DDC | NON EXCLU | Télécharger `data.zip` DDC (v ≥ 3.x) et `grep -i "weight\|density\|coef"` sur Items/Effects/Runes |

---

## Annexe — URL consultées (y compris résultats négatifs préservés)

**Calculateurs / dépôts :** github.com/N3ROO/dofus-tools ; github.com/lilgallon/dofus-tools ; gallon.dev/dofus-tools/forgemagie.html ; github.com/KamelAkar/Calculateur_Brisage_Dofus ; github.com/Icksir/crushing-calculator ; kamaskope.icksir.com ; github.com/Androlax2/DofusReliquat ; github.com/DofMod/SmithMagic ; reilcuob.fr/forgemagie ; shadowlabs.eklablog.fr (Magic Forgemagie Tool) ; github.com/Weedel/dofusbrisage.
**Guides / tables :** huzounet.fr/guides/forgemagie ; millenium.org/guide/282643 (p.1 et p.2) ; dofastuces.fr/pages/dossiers/tableau-poids-des-runes.html ; laforgemagiedofus.blogspot.com (Dofus + Dofus Touch) ; tofus.fr/fiches/forgemagie ; xixou.io/forgemagie et /guides/poids-des-runes ; gamosaurus.com/jeux/dofus/forgemagie-le-guide-complet ; dofus-portals.fr/forgemagie et /outils/calculateur-brisage ; dafous.app/guides/poids-runes-fm.html ; console-retro.net/poid-rune-forgemagie ; next-stage.fr (brisage 08/2025 + transcendance 03/2026) ; guidactik.com (2.72) ; dofustool.com/poids-runes-dofus ; alterya.over-blog.com ; yin-yang.over-blog.com.
**Officiel / encyclopédies :** dofus.com tutoriel /420190 ; dofus.com forums 2283049, 2315861, 2366805, 2407242, 2413497, 2316917, 2351393 ; jeuxonline.info actualités 48173 (2.29), 58753 (2.58), articles 235 / 3736 / 14787 ; wiki-dofus.eu/w/Forgemagie ; dofuswiki.fandom.com/wiki/Transcendence_Rune ; astra-dofus.fandom.com.
**Datamining (résultats négatifs sur la densité) :** github.com/dofusdude (doduda, doduapi) ; api.dofusdu.de ; github.com/Dofus-Batteries-Included/DDC + DBI.Api ; api.dofusbatteriesincluded.fr ; github.com/bot4dofus/Datafus ; github.com/balciseri/PyDofus ; dofusdb.fr / api.dofusdb.fr ; DofusSharp.DofusDb.ApiClients (NuGet) ; dofocus.fr/about ; papycha.fr/taux-de-brisage ; calculatricepro.com (brisage) ; kamamaster.fr.