# Reconstruction de l'algorithme de Forgemagie — DOFUS 3 / DOFUS Unity (2026)
 
## TL;DR
- **Le cœur du système est partiellement reconstituable** : les poids/densités des runes sont des données PRIMAIRES (affichées en jeu depuis la refonte de l'interface 2.58 : l'information de densité/poids de rune a été ajoutée dans l'infobulle des runes), la mécanique reliquat/puits (perte − rune) est solidement documentée, et la formule de brisage est implémentée dans du code open-source. En revanche, **la formule exacte des probabilités SC/SN/EC n'existe dans AUCUNE source publique** : Ankama la garde secrète et aucun dépôt open-source ne l'implémente. [DOFUS](https://www.dofus.com/fr/forum/1103-discussions-generales/2234825-probabilites-fm)
- **Toutes les équations « confirmées » du premier PDF (φ, Ω, densité D, exp(−5(D−0,5)), plancher lié à ≤101, division par 2 du malus présentée comme formule, etc.) sont NON DÉMONTRÉES ou INVENTÉES** : elles ne correspondent à aucune source primaire ni à aucune expérimentation publiée. Les « données expérimentales » du PDF (42 150 tentatives, R²=0,9999…) n'ont ni dataset, ni auteur, ni date vérifiables → à traiter comme fictives jusqu'à preuve.
- **Recommandation pour le simulateur** : implémenter en dur les couches CERTAINES (poids, reliquat, plafond 101, brisage, exo≈1 %, transcendance 100 %, orbes, potions 50/65/80 %) et exposer la couche probabiliste SC/SN/EC comme un **modèle empirique paramétrable** (curseurs calibrés sur les bornes primaires 15 %–66 % en normal, 1 % en exo), jamais comme une reproduction fidèle du serveur.
## Key Findings
 
1. **Poids des runes = donnée primaire, lisible en jeu.** Avec la refonte de l'interface de forgemagie de la MAJ 2.58, l'information de densité de rune (poids de rune) a été ajoutée dans l'infobulle des runes (rapporté par Gamosaurus, « DOFUS 2.58 : Refonte de la forgemagie, premiers détails » ; à confirmer sur le devblog officiel 2.58). Depuis, chaque rune affiche sa « Densité » au survol. [Gamosaurus](https://www.gamosaurus.com/jeux/dofus/forgemagie-le-guide-complet-dofus) Les valeurs de base (PA 100, PM 90, PO 51, Sagesse 3, Dommages 20, Force/Intel/Agi/Chance 1, Vitalité 0,2) sont convergentes entre sources et confirmées par le comportement en jeu. C'est la partie la plus fiable de tout l'édifice.
2. **Reliquat/puits : formule perte − rune SOLIDE, purge à l'équipement/HDV documentée.** De nombreuses sources indépendantes et un guide Unity récent confirment : reliquat = (poids des stats sortantes) − (poids de la rune posée) ; consommé en priorité avant les stats ; conserve les décimales ; ne peut être négatif ; persiste à la déconnexion et au changement de carte mais **est purgé à l'équipement de l'objet ou à sa mise en HDV/échange**. JeuxOnLine (« La forgemagie ») le confirme nommément : « Attention toutefois, ce puits disparaît s'il est entreposé dans un hôtel de vente. »
3. **SC/SN/EC existent bien, mais la formule est secrète.** Le tutoriel officiel Ankama « La forgemagie » (dofus.com/mmorpg/tutorials/420190) confirme les trois issues et donne DEUX bornes primaires, verbatim : « le taux de Succès Critique le plus faible lors de l'utilisation d'une rune, hors tentative d'overmax ou de forgemagie exotique, est de 15 % » et « Le taux de réussite des forgemagies exotiques est en revanche automatiquement très faible et peut descendre jusqu'à 1 % si l'on souhaite ajouter un PA… ». Aucune formule mathématique n'est publiée par Ankama, et le forum officiel confirme à plusieurs reprises que « la formule est secrète ».
4. **La règle des 101 de poids est réelle et globale pour over+exo.** Confirmée par le tutoriel officiel : une caractéristique ne peut avoir une densité totale d'over/exo supérieure à 101. C'est ce qui interdit un 2ᵉ PO (51×2=102>101).
5. **Exo PA/PM/PO ≈ 1 % : valeur primaire (tutoriel Ankama), mais « 1/0/99 exact » non prouvé.** Le taux de 1 % est cité par Ankama comme plancher pour ces exos ; le détail « SN=0, EC=99 exact » est communautaire.
6. **Brisage : formule implémentée en open-source.** La formule communautaire (Niveau × Poids_ligne × Coefficient)/(100 × Poids_rune) et sa variante code `(valeur_stat × poids_rune × level × 0,0150) + 1` sont cohérentes. Le focus fait contribuer les autres stats à 50 %. La partie fractionnaire est convertie en probabilité d'une rune supplémentaire. Coefficient serveur variant de 1 % à 4000 %, effet linéaire.
7. **Transcendance : règles primaires (devblog 2.72 + wiki).** Le Dofus Wiki (Fandom) résume, verbatim : « Transcendence Runes have a 100% success rate, which means that they are guaranteed to land without removing any other stats. However, they render the item unable to be maged again… Transcendence Runes cannot be used on an item that has already been overmaged or exomaged in any capacity. » Le devblog 2.72 confirme le comportement rétroactif via le « migrateur d'objets ».
## Details
 
### PARTIE 1 — Table des poids (densités)
 
| Caractéristique | Poids unitaire | Confiance | Source |
|---|---|---|---|
| Initiative | 0,1 | Élevée | Millenium/dofastuces, cohérent en jeu |
| Vitalité | 0,2 (0,25 débattu) | Moyenne | Débat communautaire ; « 5 vita = 1 densité » |
| Pods | 2,5 (par pod) | Élevée | Millenium (2,5 base) |
| Force/Intel/Agi/Chance | 1 | Élevée | Convergent |
| Puissance | 2 | Moyenne | Communautaire |
| Sagesse | 3 | Élevée | Confirmé par exemples de puits |
| Prospection | 3 | Élevée | dofastuces |
| Tacle/Fuite | 4 (ou 5 selon sources) | Moyenne | Divergence entre sources |
| Dommages élémentaires | 5 | Moyenne | Communautaire |
| Rés critiques/poussée | 2 | Moyenne | Correction communautaire (pas 5) |
| Coup critique | 10 (auparavant 30) | Élevée | Changelog 2.29 : cri/soin passés à 10 |
| Soins | 10 (auparavant 20/15) | Élevée | Changelog 2.29 |
| Dommages fixes (Do) | 20 | Élevée | Convergent |
| % Dommages/Résistance mêlée-distance-sorts-armes | 15 (auparavant 30) | Élevée | Forum officiel : « 30 => 15 » |
| Invocation | 30 | Élevée | Convergent |
| Portée (PO) | 51 | Élevée | Convergent, confirmé « 51 et non 50 » |
| PM | 90 | Élevée | Convergent |
| PA | 100 | Élevée | Convergent |
 
**Point critique** : la « table officielle Unity » exacte du PDF est un assemblage plausible mais **non vérifié ligne par ligne** ; plusieurs valeurs (Ré crit/poussée, Tacle/Fuite) sont débattues même entre forgemages. Les runes moyennes (Pa) = ×3, majeures (Ra) = ×10 de la valeur de base.
 
Sources code : le dépôt `KamelAkar/Calculateur_Brisage_Dofus` (Python, interroge l'API dofusdb.fr, ère Unity) contient un dict `POIDS_RUNES` avec Vitalité=0.2, Force=1.0, PA=100.0. [GitHub](https://github.com/KamelAkar/Calculateur_Brisage_Dofus) Le dépôt `Icksir/crushing-calculator` (« Dofus Crushing Calculator Unity 3.4 », FastAPI+Next.js, MIT, 157 commits, app live kamaskope.icksir.com) contient la table et la formule côté backend. [GitHub](https://github.com/Icksir/crushing-calculator) Le champ `realWeight` de DofusDB est le poids d'inventaire, **différent** de la densité de forgemagie. `lilgallon/dofus-tools` (js/runes.js) est utile mais ère Dofus 2.x/Touch.
 
### PARTIE 2 — Reliquat / puits
- **Création** : SN ou EC faisant sauter une stat de poids > rune posée → reliquat = différence.
- **Consommation** : le puits est consommé en priorité avant les stats de l'objet.
- **Arrondi** : conserve les décimales (règle communautaire convergente, non contredite).
- **Persistance** : survit à la déconnexion, au changement de carte, à l'achat de runes ; **purgé à l'équipement, à la mise en HDV/entrepôt (confirmé JeuxOnLine), à l'échange** (Tofus, gamosaurus, JOL).
- **Influence sur les probabilités** : les guides indiquent que le puits ne change pas la probabilité de passage — il ne change QUE la conséquence d'un SN/EC (pas de perte de stat tant que le puits absorbe). **HYPOTHÈSE COMMUNAUTAIRE forte, non prouvée expérimentalement de façon publiée.**
### PARTIE 3 — SC/SN/EC
Bornes PRIMAIRES (tutoriel Ankama, verbatim ci-dessus) : SC min 15 % en FM normale ; exo PA/PM jusqu'à 1 %. Facteurs cités par Ankama : niveau de l'objet, jet actuel (proximité du max). Le palier « 80 % du jet » est une HYPOTHÈSE COMMUNAUTAIRE répétée partout mais sans source primaire. Les probabilités « du DevBlog » (SC 66/N 34/EC 0 ; 43/50/7 ; 15/50/35 ; 1/0/99) circulent depuis un vieux guide (Alterya citant forgemagie.net d'ExiTeD) — **une seule source d'origine, recopiée**, à traiter comme un exemple ancien et non comme la loi complète.
 
### PARTIE 4 — Densité
« Densité » = terme officiel d'Ankama pour le **poids** de la rune, affiché en jeu. Ce n'est PAS la variable composite D = Σ(jet×poids)/Σ(jetmax×poids) inventée par le PDF. La densité en jeu = poids unitaire × valeur. Le champ « Densité » de DofusDB sur une rune correspond au poids de génération de rune. **La variable « D » du PDF n'existe pas dans le moteur** ; c'est au mieux une reformulation communautaire de « proximité du jet max ».
 
### PARTIE 5 — Sélection de la ligne qui perd
Ordre documenté (Tofus, learn-dofus) : **over/exo d'abord, puis puits, puis lignes naturelles**. Parmi les lignes naturelles, la sélection est décrite comme « aléatoire » avec une nuance : une ligne dont le poids/1 est supérieur à celui de la rune a une chance d'être épargnée. **Modèles concurrents non départagés** : (A) uniforme, (B) pondéré par poids, (C) pondéré par masse magique, (D) dépendant du déficit. Aucune expérience publique ne tranche. Le PDF se contredit lui-même (prose « masse magique » vs pseudo-code Math.random() uniforme).
 
### PARTIE 6 — Overmax
Limite 101 de densité par ligne (sauf si le poids naturel dépasse déjà 101). Over max théorique = floor(101/poids_unitaire). Over+exo cumulés ≤ 101 global. Confirmé par tutoriel officiel + forum (exemple « over chance poids 1 + over vita 0,2 → 1,2 »). Priorité de suppression : les lignes over/exo sont retirées en premier.
 
### PARTIE 7 & 8 — Exotique et runes lourdes
Exo PA/PM/PO : 1 % (primaire). Limite : 1 seul PA, 1 PM, 1 PO exo comptabilisés par personnage. **La généralisation « tout poids > 50 ⇒ 1 % » n'est PAS démontrée** ; Huzounet indique un seuil différent : « densité > 20/stat sur une stat absente ⇒ pas de SN, SC = 1 % (exotisme) ». Donc le seuil d'exotisme documenté est ~20, pas 50. Le « poids > 50 » du PDF est une confusion, et la « déclaration officielle du Lead Game Designer » n'a été retrouvée nulle part.
 
### PARTIE 9 — Brisage
Formule communautaire : Runes = (Niveau × Poids_ligne × Coefficient)/(100 × Poids_rune), Poids_ligne = valeur × poids_unitaire. Variante code (KamelAkar) : `(valeur_stat × poids_rune × level × 0,0150) + 1`. Focus : stat ciblée à 100 %, autres à 50 %. Fraction → probabilité d'une rune de plus (ex. 10,2 runes = 80 % d'avoir 10, 20 % d'avoir 11). Coefficient serveur 1–4000 %, linéaire, propre à chaque objet, baisse quand l'objet est brisé en masse (depuis MAJ 1.65). Papycha note que sa formule donne un résultat faux 34/200 fois (erreur max 7 %) → **MODÈLE EMPIRIQUE, pas exact**.
 
### PARTIE 10 — Mécaniques spéciales
- **Transcendance** : 100 % SC, verrouille l'objet, interdite si over/exo, soumise au plafond 101 (devblog 2.72, wiki, guides Unity 2026). Exception armes : rune d'arme de chasse posable avant.
- **Potions de changement d'élément** : convertit dégâts Neutre → élément ; **3 qualités : 50 %, 65 % et 80 %** (% de dégâts conservés) — confirmé verbatim par Dofus Pages : « Les trois qualités possibles sont 50%, 65% et 80%. » Toutes les lignes Neutre (et vol de vie Neutre) sont converties simultanément ; la potion n'est pas garantie (peut échouer, générer du reliquat). Le « 100 % / majeures 85 % / mineures 50 % » du PDF est FAUX.
- **Orbes régénérants** : réinitialisent le jet à un jet de craft aléatoire, purgent tout (over/exo/reliquat). 4 niveaux (60/120/180/200). [Millenium](https://www.millenium.org/guide/282643.html)
### PARTIE 11 — GitHub / datamining
| Dépôt | Contenu | Version | Réutilisable |
|---|---|---|---|
| `KamelAkar/Calculateur_Brisage_Dofus` | dict `POIDS_RUNES` (Vita 0.2, Force 1.0, PA 100.0…) + formule brisage `(valeur_stat*poids_rune*level*0.0150)+1` + coef + focus ; interroge API dofusdb | Unity | Table de poids + formule brisage |
| `Icksir/crushing-calculator` (Kamaskope) | Backend FastAPI, table poids + formule brisage, coef ajustable, runes Pa/Ra/Sa | **Unity 3.4** | Oui (MIT) |
| `lilgallon/dofus-tools` | Calcul de puits uniquement (js/runes.js : PA100/PM90/PO51/Sa3/Do20) | Dofus 2.x/Touch | Poids historiques |
| `Vicfou-dev/dofus-fm-server` | README marketing seul, bot propriétaire | Dofus 3.0 | Non (pas de code) |
| API DofusDB | `realWeight` (≠ densité FM), champ densité rune distinct | Dofus 3 (maj 2026) | Données objets brutes |
 
**Aucun dépôt n'implémente une formule de probabilité SC/SN/EC** — cohérent avec le consensus « formule secrète ». Toute reconstitution nécessiterait un reverse-engineering du client Unity, non couvert par les repos publics.
 
### PARTIE 12 — Changements Unity
| Version | Modification | Impact FM | Source |
|---|---|---|---|
| 2.29 | Refonte interface + poids cri/soin 30→10, %dom/res 30→15 | Poids modifiés | Changelog/forum officiel |
| 2.58 | Densité/poids ajoutés dans l'infobulle des runes | Rend les poids « primaires » | Gamosaurus (à confirmer devblog 2.58) |
| 2.72 | Migrateur d'objets (modif rétroactive de tous les exemplaires), règles transcendance | Over ajusté au jet théorique, exo supprimé | Devblog 2.72 + Next Stage |
| 3.0 (mai 2026) | Passage Unity, refonte boucliers/trophées | Calculs FM inchangés selon guides | Guides Unity 2026 |
| 3.1 (avr. 2026) | Changements mineurs (recettes, XP runes/familiers) | Marginal sur FM | GUIDACTIK |
 
### PARTIE 13 — Vérification du PDF (A→N)
| Aff. | Verdict | Justification |
|---|---|---|
| A (table « lisible en jeu ») | PLAUSIBLE/partiel | Densité affichée en jeu (2.58) ; valeurs exactes non vérifiées ligne à ligne |
| B (malus ÷2) | TRÈS PROBABLE | Confirmé (gamosaurus + forum) : poids ÷2 sur stat en malus (sauf −1→0) |
| C (reliquat, purge) | TRÈS PROBABLE | Formule et purge HDV/équipement convergentes (JOL confirme HDV) ; « persiste après déco » confirmé |
| D (formule P(SC) complète) | FAUX/INVENTÉ | Aucune source ; Ankama = secret |
| E (Échec Simple distinct) | NON DÉMONTRÉ | Aucune source ne décrit un 4ᵉ résultat |
| F (algo pertes) | NON DÉMONTRÉ | Ordre over/puits/naturel ok ; sélection interne inconnue |
| G (101 global, over max) | TRÈS PROBABLE | Confirmé ; « SC=0 au-delà » plausible |
| H (poids>50 ⇒1/0/99, « lead GD ») | FAUX/CONTREDIT | Seuil exotisme ~20 pas 50 ; aucune déclaration lead GD retrouvée |
| I (potions 100/85/50) | FAUX | Qualités réelles 50/65/80 % (Dofus Pages) |
| J (orbes) | TRÈS PROBABLE | Réinit jet + purge confirmés |
| K (transcendance) | CONFIRMÉ | Devblog 2.72 + wiki + tutoriels |
| L (brisage + focus) | PARTIEL | Dépendance niveau/poids/coef + focus 50 % ok ; formule exacte = empirique |
| M (données expérimentales) | NON DÉMONTRÉ | Aucun dataset/auteur/date ; à considérer fictif |
| N (règle des 20) | PLAUSIBLE | Classée « ressentie non absolue » par forum officiel |
 
### PARTIE 15 — Données expérimentales trouvées
Aucune étude à grand échantillon publiée et reproductible n'a été retrouvée. Les seuls chiffres publics sont des témoignages qualitatifs (exos rés % observés à 3-5 % sur masques Koutoulou ; ~1 % pour PA/PM sur jet parfait ; ≥15 % de repassage sur jet « claqué »). Qualité D (témoignages). Les chiffres du PDF sont de qualité INCONNUE (invérifiables).
 
### PARTIE 16 — Modèles concurrents (sélection de la perte)
- A uniforme : chaque ligne naturelle équiprobable.
- B pondéré poids : P(ligne) ∝ poids de la ligne.
- C pondéré masse magique : P ∝ valeur×poids.
- D déficit : P ∝ (max − actuel).
**Expérience discriminante** : sur un objet contrôlé à 2 lignes de poids très différents et jets connus, faire sauter 500+ fois une même stat et compter la répartition des pertes. Aucun tel dataset public n'existe.
## Recommendations
 
**Architecture simulateur (Item → État → Poids → Reliquat → Action rune → SC/SN/EC → Application → Sélection pertes → MAJ reliquat → MAJ objet), par niveaux de confiance :**
 
1. **RÈGLES CERTAINES (coder en dur)** : table de poids (paramétrable/éditable), reliquat = perte − rune, priorité de consommation du puits, plafond 101 (over+exo), purge du reliquat à l'équipement/HDV/échange, transcendance 100 % + verrouillage, orbes = reset jet + purge, potions = 50/65/80 % conservation + conversion simultanée des lignes Neutre, formule de brisage avec focus 50 % et fraction probabiliste.
2. **RÈGLES TRÈS PROBABLES** : ordre de sélection des pertes (over/exo → puits → naturelles), exo PA/PM/PO ≈ 1 %, seuil d'exotisme ~20 de densité sur stat absente, malus ÷2.
3. **MODÈLES EMPIRIQUES (curseurs exposés)** : P(SC/SN/EC) en fonction de (niveau objet, ratio jet/jetmax, poids rune). Proposer une fonction paramétrable calibrée sur les bornes primaires (SC∈[15 %,66 %] en normal ; 1 % en exo) SANS prétendre reproduire le serveur. Sélection de la ligne perdante = modèle A/B/C/D configurable.
4. **INCONNU (marquer explicitement)** : formule exacte des probabilités, existence d'un « Échec Simple », influence numérique précise du puits sur les probas, poids exacts des stats débattues (Ré crit/poussée, Tacle/Fuite).
**Tableau final synthétique :**
| Mécanique | Règle | Source principale | Sources indép. | Version | Confiance | Implémentable ? |
|---|---|---|---|---|---|---|
| Poids/densité | Affichée en jeu, PA100/PM90/PO51/Sa3/Do20 | Tutoriel + infobulle 2.58 | Multiples | 2.29→Unity | Élevée | Oui (en dur) |
| Reliquat | perte − rune, prio conso, purge HDV/équip | Tofus/JOL/Huzounet | Multiples | Unity | Élevée | Oui |
| Plafond 101 | over+exo ≤ 101 | Tutoriel officiel | Forum | Unity | Élevée | Oui |
| Exo PA/PM/PO | ≈1 % SC | Tutoriel officiel | Forum | Unity | Élevée | Oui (constante) |
| Transcendance | 100 %, verrou, pas over/exo | Devblog 2.72 + wiki | Guides | 2.72+ | Élevée | Oui |
| Potions élément | 50/65/80 % conservés | Dofus Pages | Tutoriel | Unity | Élevée | Oui |
| Brisage | (Niv×Poids_ligne×Coef)/(100×Poids_rune) | Code KamelAkar/Icksir | Papycha/DoFocus | Unity 3.4 | Moyenne-élevée | Oui (empirique) |
| P(SC/SN/EC) | Secrète | — | — | — | Nulle | Non (modèle param.) |
| Sélection perte | Aléatoire pondérée ? | — | — | — | Faible | Modèle configurable |
 
**Seuils qui changeraient les recommandations** : si un dataset ≥5 000 tentatives contrôlées était publié avec conditions complètes, ou si un reverse-engineering du client Unity exposait la fonction serveur, alors les couches 3 et 4 pourraient migrer vers 1/2. Tant que ce n'est pas le cas, ne jamais présenter le simulateur comme « fidèle au serveur » sur la couche probabiliste.
 
## Caveats
- **Aucune formule de probabilité SC/SN/EC n'est publique.** Toute équation prétendant le contraire (dont celles du premier PDF) est inventée ou empirique.
- **Une seule source d'origine recopiée ≠ plusieurs confirmations** : les probabilités « 66/34/0 », le palier 80 %, une partie de la table de poids circulent depuis 1-2 guides anciens (ExiTeD/forgemagie.net, Alterya). Compter comme 1 source (PARTIE 14).
- **Distinguer les versions** : beaucoup de sources sont Dofus 2.x / Retro / Touch. Les poids ont changé (2.29). Unity (3.0+) conserve les calculs selon les guides mais aucune source primaire ne le certifie explicitement pour chaque valeur.
- **Les « données expérimentales » du PDF sont invérifiables** et doivent être écartées de toute calibration.
- **À confirmer par l'utilisateur en ouvrant directement les fichiers** : le devblog officiel 2.58 (formulation exacte sur l'infobulle), les fichiers de constantes de `KamelAkar` et `Icksir/crushing-calculator` (table complète + nom de fonction de brisage), et la valeur exacte du champ densité de l'API DofusDB pour un item rune donné.