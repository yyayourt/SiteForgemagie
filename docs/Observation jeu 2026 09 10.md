# Observation directe en jeu — DOFUS 3, 10/09/2026
 
**Nature de la source : [OBS] observation directe du client DOFUS 3 par l'utilisateur**, capturée
en vidéo (42 s, 16 images). C'est la source la plus fiable de tout le corpus : elle prime sur
tout guide communautaire et sur tout code d'émulateur.
 
Contexte : atelier de forgemagie, personnage El-Faker, métier Costumage niv. 42.
Objet forgemagé : **Cape Bouffante**, 2 lignes.
 
| Ligne | Jet min | Jet max | Valeur au départ | Statut |
|---|---|---|---|---|
| Vitalité | 36 | 40 | 60 | **overmax** (+20 au-dessus du max naturel) |
| Initiative | 151 | 200 | 10 | très en-dessous du min (objet vidé) |
 
---
 
## DÉCOUVERTE 1 — Le reliquat EST affiché en jeu **[OBS]**
 
L'en-tête de la fenêtre de forgemagie affiche `reliquat : X`, **avec décimales**.
Valeurs relevées au fil de la session : `0` → `0,2` → `0,2` → `0` → `0,1` → `0`.
 
**Conséquence majeure : le puits n'est plus une variable cachée.** Tout le §12 du protocole
de calibration, qui supposait qu'il fallait le reconstituer par déduction, se simplifie
radicalement. On peut le lire, tentative par tentative.
 
Le corpus communautaire (wiki forgemagie.net, DevBlog 2.29) affirmait le contraire :
« le puits n'est pas visible sur l'objet, il est pour ainsi dire invisible ».
**C'était vrai en Dofus 2, ça ne l'est plus en Dofus 3.** Ankama a changé d'avis.
 
## DÉCOUVERTE 2 — « DENSITÉ » dans l'infobulle d'une rune = son poids de forgemagie **[OBS]**
 
Infobulles relevées :
 
| Rune | Effet affiché | POIDS (pods) | **DENSITÉ** | Poids FM calculé |
|---|---|---|---|---|
| Rune Pa Vi (niv. 5) | 15 Vitalité | 1 | **3** | 15 × 0,2 = **3** ✓ |
| Rune Ini (niv. 1) | 10 Initiative | 1 | **1** | 10 × 0,1 = **1** ✓ |
 
Deux correspondances exactes. `DENSITÉ = valeur_de_la_rune × coefficient_de_poids_de_la_stat`.
 
**Conséquences :**
* Le coefficient **Vitalité = 0,2** et **Initiative = 0,1** sont confirmés en Dofus 3
  (et non 0,25 / 0,1 comme en Rétro). La colonne `dofus2_3` de `stats_weights.json` est validée.
* **Toute la table de poids est lisible en jeu**, rune par rune, sans datamining ni
  rétro-ingénierie. Il suffit de survoler chaque rune. C'est la fin de la question des
  divergences entre tables communautaires.
* ⚠️ À ne pas confondre avec `POIDS`, qui est le poids en pods (encombrement d'inventaire).
**À vérifier pour verrouiller** (10 minutes en jeu) : Ra Vi doit afficher densité 10,
Rune Cri densité 10, Rune Sa densité 3, Ga Pa densité 100, Ga Pme 90, Rune PO 51.
 
## DÉCOUVERTE 3 — Le panneau d'historique est un journal de tentatives natif **[OBS]**
 
Colonne de gauche, persistante pendant toute la session, bouton « VIDER L'HISTORIQUE ».
Chaque tentative y est une entrée avec :
* l'icône de la rune utilisée,
* le détail des gains (`15 Vitalité`) et des pertes (`-5 Vitalité`, `-26 Initiative`),
* **la mention explicite `+ reliquat` ou `- reliquat`** quand le puits a été créé ou consommé,
* la mention `Échec` pour un échec.
C'est exactement le champ `magic_pool_status {NO_CHANGE, INCREASE, LOSS}` du protocole,
exposé à l'écran. **Une entrée d'historique = une ligne de dataset complète.**
 
---
 
## VÉRIFICATION DE LA FORMULE DU PUITS SUR DONNÉES RÉELLES
 
Formule testée : `puits_nouveau = (puits_actuel + poids_des_pertes) − poids_de_la_rune`
 
### Test 1 — succès neutre (t = 17,9 s) ✅
Rune Ini (poids 1). Gain +10 Initiative. Perte −6 Vitalité.
```
poids_pertes = 6 × 0,2 = 1,2
puits = (0 + 1,2) − 1 = 0,2
```
**Affiché en jeu : `reliquat : 0,2`.** Exact.
 
### Test 2 — échec critique (t = 30,0 s) ✅
Rune Pa Vi (poids 3). Perte −31 Initiative, aucun gain, mention `+ reliquat`.
```
poids_pertes = 31 × 0,1 = 3,1
puits = (0 + 3,1) − 3 = 0,1
```
**Affiché en jeu : `reliquat : 0,1`.** Exact.
 
> La formule du puits est désormais **[OBS]**, vérifiée deux fois sur deux régimes différents
> (SN et EC), avec les coefficients Dofus 3. Ce n'est plus un consensus communautaire.
 
---
 
## ANOMALIES RELEVÉES — à investiguer, ne pas expliquer trop vite
 
### A1 — Un EC n'a pas consommé le puits disponible (t ≈ 22,4 s) ⚠️
Puits = 0,2 avant. Rune Ini (poids 1). Résultat : −5 Vitalité (= 1,0 de poids), aucun gain,
**pas de mention `- reliquat`**, reliquat toujours affiché `0,2` après.
 
Le puits de 0,2 n'a pas servi d'amortisseur alors qu'il existait. Trois lectures possibles,
non tranchées :
1. la consommation du puits n'est pas systématique en EC ;
2. le puits ne s'applique que par tranches (0,2 trop petit pour épargner 1 point de Vitalité,
   qui coûte 0,2 — mais alors il aurait dû suffire) ;
3. la perte est calculée d'abord, le puits n'intervient que si la perte **dépasse** le poids
   de la rune (ici 1,0 = 1, pile).
La lecture 3 est la plus cohérente avec le DevBlog (« absorbera **en partie** les échecs
futurs »), mais **une seule observation ne tranche rien**.
### A2 — Un gain partiel : +6 Vitalité avec une Rune Pa Vi (t ≈ 32,0 s) ⚠️
La Rune Pa Vi vaut +15 Vitalité. L'entrée d'historique montre `6 Vitalité` / `-12 Initiative`.
Poids : gain 6 × 0,2 = 1,2 ; perte 12 × 0,1 = 1,2. **Exactement équilibré**, mais très
inférieur au poids de la rune (3).
 
Hypothèses non tranchées : le gain est plafonné par ce que l'objet peut céder ailleurs ?
un plafond d'overmax sur la Vitalité (60 → 44 après pertes, max naturel 40) ? un régime
de SN « à concurrence du possible » ?
**Si c'est confirmé, ça invalide l'hypothèse « le gain vaut toujours la valeur de la rune »
qui est câblée dans `fm_sim.py`.** C'est la question la plus importante à reproduire.
 
### A3 — Le libellé `Échec` apparaît seul, sans perte détaillée (t ≈ 32,0 s) ⚠️
À distinguer d'un EC avec pertes. Peut correspondre au cas « rien ne se passe »
(SN impossible sur un objet dont l'autre ligne est à 0 ?). À reproduire.
 
---
 
## CE QUE ÇA CHANGE POUR LA COLLECTE DE DONNÉES
 
Le problème est **résolu**, et sans zone grise réglementaire :
 
* Tout ce dont le simulateur a besoin est **affiché à l'écran par le jeu lui-même** :
  jets min/max, valeur courante de chaque ligne, rune utilisée, poids de la rune (densité),
  gains, pertes, sens du puits, valeur exacte du puits.
* L'historique **persiste** pendant toute la session → pas besoin de capturer chaque tentative
  en temps réel. Une capture d'écran tous les ~15 clics suffit à tout récupérer.
* Aucun sniffing, aucune automatisation, aucun logiciel tiers. Tu joues, tu screenshot,
  tu transcris (ou tu passes les captures à un modèle qui les transcrit).
### Protocole minimal recommandé
1. **Verrouiller la table de poids** : survoler chaque rune, noter la densité. ~30 min, gain énorme.
2. **Reproduire A1, A2, A3** : ce sont des questions de mécanique, elles se tranchent en
   quelques dizaines de tentatives ciblées, pas en milliers.
3. **Puis seulement** la collecte de masse pour les probabilités, sur objets simples
   (2 lignes comme cette Cape Bouffante = cas idéal : peu de variables libres).
⚠️ Biais à éviter dans la collecte : cette session mélange un objet en overmax (Vitalité)
et une ligne quasi vide (Initiative). Pour estimer des probabilités, il faut des séries
à conditions homogènes, pas une session de jeu normale.