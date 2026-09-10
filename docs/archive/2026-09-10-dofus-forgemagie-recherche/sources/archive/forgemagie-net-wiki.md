# Wiki Forgemagie V2.0 — forgemagie.net (ExiTeD)

Source : https://web.archive.org/web/20160113025641/http://www.forgemagie.net/wiki
(site mort ; récupéré via Wayback Machine. Dernière MAJ du wiki : 28 décembre 2015.
91 snapshots entre 2009-11-10 et 2025-01-21.)

C'est LA référence historique de la communauté FM francophone. Tout le vocabulaire
(PWR, PWRG, puits, overmax, exotique) vient de là.

## Acronymes
- PWR : Power-Rate (poids) — PWRG : Power-Rate Global (somme des PWR de l'objet)
- SC : Succès Critique — SN : Succès Neutre — EC : Échec Critique

## Table des poids (PWR) — état ~2015

Poids d'une rune de rang supérieur = EFFET de la Pa/Ra x PWR/EFFET de la rune simple.
Ex : Ra Vi (+30 vita) -> 30 * 0.25 = 7.5 ; Pa Do Per (+3 %) -> 3 * 2 = 6

### Caractéristiques
| Nom | EFFET | PWR | PWR/EFFET | OVER |
|---|---|---|---|---|
| Fo / Ine / Cha / Age | +1 | 1 | 1 | 101 |
| Vi | +3 | 0,75 | 0,25 | 404 |
| Sa | +1 | 3 | 3 | 33 |
| Ini | +10 | 1 | 0,1 | 1010 |
| Prospe | +1 | 3 | 3 | 33 |
| Pui | +1 | 2 | 2 | 50 |

### Résistances
| Nom | EFFET | PWR | PWR/EFFET | OVER |
|---|---|---|---|---|
| Ré Terre / Feu / Neutre / Air / Eau | +1 | 2 | 2 | 50 |
| Ré Per Terre / Feu / Neutre / Air / Eau | +1 | 6 | 6 | 16 |
| Ré Pou | +1 | 2 | 2 | 50 |
| Ré Cri | +1 | 2 | 2 | 50 |
| Ré Pa | +1 | 7 | 7 | 14 |
| Ré Pme | +1 | 7 | 7 | 14 |

### Bonus
| Nom | EFFET | PWR | PWR/EFFET | OVER |
|---|---|---|---|---|
| Rune de Chasse | - | 5 | - | - |
| Pod | +10 | 2,5 | 0,25 | 404 |
| Pi Per | +1 | 2 | 2 | 50 |
| Pi | +1 | 5 | 5 | 20 |
| Tac | +1 | 4 | 4 | 25 |
| Fui | +1 | 4 | 4 | 25 |
| Ret Pa | +1 | 7 | 7 | 14 |
| Ret Pme | +1 | 7 | 7 | 14 |
| So | +1 | 10 | 10 | 5 |
| Cri | +1 | 10 | 10 | 5 |
| Invo | +1 | 30 | 30 | 3 |
| Do Ren | +1 | 5 | 5 | 20 |
| PO | +1 | 51 | 51 | - |
| Ga Pme | +1 | 90 | 90 | - |
| Ga Pa | +1 | 100 | 100 | - |

### Dommages
| Nom | EFFET | PWR | PWR/EFFET | OVER |
|---|---|---|---|---|
| Do | +1 | 20 | 20 | 5 |
| Do Terre / Neutre / Feu / Air / Eau | +1 | 5 | 5 | 20 |
| Do Pou | +1 | 5 | 5 | 20 |
| Do Cri | +1 | 5 | 5 | 20 |

/!\ INCOHÉRENCE INTERNE relevée : dans l'exemple de calcul du PWRG, le wiki utilise
"PWRCoups critiques = 30*4 = 120" (coef 4) alors que sa propre table donne Cri = 10.
À trancher.

## Limite d'utilisation d'une rune (« règle du x20 »)
- ~20 x l'effet de la rune : le passage devient récalcitrant
- ~25 x l'effet de la rune : quasi impossible sans puits
- Exemples : Pa Vi ne passe plus après 250 Vita ; Pa Cha après 75 Chance ;
  Ine après 25 Intell ; Do Per après 25 % Dommages.
  La proba chute déjà nettement à 200 Vita / 60 Cha / 20 Intell / 20 % Do.

## PWRG
PWRG = somme des PWR des jets. PWRGmax = somme des PWRmax, PWRGmin = somme des PWRmin.
Exemple 1 : Cha 6*1=6 ; CC 30*4=120 ; %Do 6*2=12 ; Ini 50*0.1=5 ; %ResEau 3*6=18 -> PWRG = 161
Exemple 2 : PWRGmin = (101*0.1)+(16*1)+(3*2)+(3*2)+(3*6) = 56,1 -> 57
            PWRGmax = (150*0.1)+(30*1)+(5*2)+(5*2)+(5*6) = 95

## Les 3 résultats
- SC : au minimum toujours 1 %. Augmente un jet sans contrepartie. NE MODIFIE PAS LE PUITS.
- SN : augmente une carac en contrepartie d'une baisse équivalente ailleurs.
  Chances de SN plafonnées à 50 %, souvent proches de 50 sauf FM très difficile ou très facile.
- EC : baisse de caractéristiques équivalente au PWR de la rune utilisée. Un EC ne peut que réduire un puits.

## Puits (formule canonique)
    Puits_nouveau = (Puits_actuel + PWR_Pertes) - PWR_Rune
- Le puits n'est pas visible en jeu.
- Il ne change qu'en SN ou EC (jamais en SC).
- Exemple 1 : rune Do (PWR 20) en SN, perte d'une Invo (PWR 30) -> (0+30)-20 = puits 10
- Exemple 2 : puits 4, rune Ré Per Terre (PWR 6), pertes 19 Vita + 1 Invo
  PWR_Pertes = (30*1)+(19*0.25) = 34,75 -> (4+34,75)-6 = 32,75
- Le puits est PERDU si l'objet est équipé, échangé, ou mis en HDV.
  Il est CONSERVÉ à la déconnexion et lors d'un passage banque/maison/dinde.

## Chances de réussite — 3 critères, par ordre d'importance
1. **Qualité globale de l'objet (PWRG)** : au-dessus de la moyenne, la difficulté augmente
   rapidement jusqu'au max quand l'objet est jet parfait.
   /!\ Le jet en cours de modification N'EST PAS compté dans le PWRG.
   Les caracs exotiques et overmax, elles, comptent dans le PWRG.
2. **Qualité du jet modifié** : au-dessus de 80 % de la fourchette du jet, la difficulté
   augmente brutalement (palier). Si le jet est fixe, ce facteur n'est pas pris en compte.
   Si exo ou overmax, difficulté arbitrairement augmentée.
3. **Niveau de l'objet** : intervient dans une moindre mesure. La réussite diminue quand
   le niveau de l'objet augmente.
   >>> Ce 3e facteur est ABSENT de tous les émulateurs étudiés. <<<

### Probabilités citées du DevBlog Ankama (version wiki forgemagie.net)
- Meilleures probas atteignables (bonus simples)                 : SC 66 / SN 34 / EC 0
- Meilleures probas pour un jet parfait (bonus simples, objet simple) : SC 43 / SN 50 / EC 7
- Pmin (création d'effet / exo)                                   : SC 1  / SN 0  / EC 99
- Probas minimum pour un mage utilisant des runes de puissance suffisante : SC 15 / SN 50 / EC 35

/!\ CONTRADICTION avec le relais yin-yang (blog Guilde Yin-Yang, article 1.27) qui donne
pour le jet parfait : SC 34 / SN 50 / EC 16, et qui ajoute un 5e triplet absent ici :
« création d'effet AVEC puits : SC 1 / SN 22 / EC 77 ».
Source : https://yin-yang.over-blog.com/article-29549211.html

## Détail des pertes — ordre de priorité (SN et EC)
1. Le jet en Overmax (s'il y en a)
2. Le jet en Exotique (s'il y en a)
3. Le Puits (s'il y en a)
4. Une ou plusieurs caractéristiques sélectionnées ALÉATOIREMENT

Exception : si l'objet a un overmax/exo ET un puits, et que la rune utilisée n'est pas
différente de ladite carac, alors le PUITS est prioritaire sur l'overmax/exo.

Si le PWR/1 d'un jet est plus élevé que celui de la rune utilisée, ce jet a une chance
d'être épargné, mais pas systématiquement.
Hypothèse d'ExiTeD (NON confirmée) :
    P(le jet baisse quand même) = (PWR_Rune * 100) / PWR_Jet_qui_baisse   [%]
Exemple : rune PWR 6, l'algo tombe sur CC (PWR 30) -> 6*100/30 = 20 % de perdre le CC,
80 % que l'algo se tourne vers d'autres caracs.

## Limite du système : 101
- Si le PWR de la carac overmax OU exotique dépasse 101, le succès est IMPOSSIBLE.
- C'est pourquoi ajouter un PA (100+100 > 101), un PM (90+90 > 101) ou une PO (51+51 > 101)
  sur un objet qui en a déjà un de base est impossible.
- L'OVER de la table se déduit de là : OVER = floor(101 / (PWR/EFFET)).

## FAQ (réponses d'ExiTeD, valeur = consensus communautaire)
- Un malus peut devenir bonus (compté comme de l'overmax). Un bonus ne peut pas devenir malus.
- Les runes de signature n'influencent RIEN.
- PA/PM non exotique : la proba dépend du PWRG global de l'objet (jet unitaire +1).
- Exo PA/PM/PO : probas ARBITRAIREMENT fixées à 1 % SC / 99 % EC.
  -> le puits n'améliore PAS la réussite de ce type de FM (il compense seulement les pertes en EC).
  -> le SN est ABSOLUMENT IMPOSSIBLE sur ce type d'exo.
  -> la proba ne dépend NI de l'objet, NI de ses jets, NI de son niveau
     (« autant de chance de passer un PA sur une Cape Piou que sur un Kralano »).
- La FM élémentaire (Eau/Feu/Terre/Air) n'influence pas les probas.
- Un objet ne devient PAS plus dur à FM à mesure qu'il est FM (légende) : à jet égal,
  un objet fraîchement crafté et un objet passé 500 fois à la FM ont les mêmes chances.
- « Plus gros puits exploitable » = différence entre le plus gros PWR/1 et le plus petit
  parmi les caracs de l'objet. Amulette : 99 (100-1). Bottes avec PM : 89.
  En pratique 97 au mieux (100 - PWR Cha/Prospe), 70 au pire (100 - PWR CC) sur un puits de PA.
  Rasboulaire : 50 (grâce à la PO) vs Chapignon : 29 -> le Chapignon jet parfait est plus dur.

## Autres ressources du site (archivées)
- Logiciel EasyFM (simulateur FM hors-ligne, 2010, gère overmax + 1 exo + calcul des probas) :
  https://web.archive.org/web/20121226112220/http://www.forgemagie.net/EasyFM.rar
- Applet Java/GeoGebra « Probabilités Forgemagie Dofus 1.27 » (courbes de proba paramétrées
  par PoidsRune et Niveau de l'objet) : /easyfmproject/probabilites_2.html
  -> NON ARCHIVÉE (404 sur tous les snapshots testés). Perdue.
  Article de présentation :
  https://web.archive.org/web/20121222131617/http://forgemagie.net/news/123-probabilites-forgemagie-dofus-127
