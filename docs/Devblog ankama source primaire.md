# ⭐ SOURCE PRIMAIRE — DevBlog Ankama « La nouvelle forgemagie »
 
**Retrouvé le 10/09/2026.** C'est le texte ORIGINAL d'Ankama, jamais cité intégralement
dans aucun guide communautaire. Tous les guides FM francophones en dérivent de seconde main,
et **plusieurs le citent faux**.
 
* Original FR : `http://devblog.dofus.com/fr/billets/61-nouvelle-forgemagie.html`
  → https://web.archive.org/web/20101118084715/http://devblog.dofus.com/fr/billets/61-nouvelle-forgemagie.html
* Traduction DE (identique) : `/de/beitragen/11-neue-schmiedmagie.html`
* Publié à la suite de la 1.27, après passage sur le serveur de test.
---
 
## TEXTE INTÉGRAL (FR, verbatim)
 
Après quelques déboires à sa sortie, la nouvelle forgemagie est enfin là, après quelques semaines passées à mijoter sur le serveur de test. Depuis la version brièvement présentée à la sortie de la 1.27, quelques évolutions importantes ont eu lieu, une occasion idéale pour représenter l'ensemble !
 
Les objectifs du système restent le même qu'auparavant, à savoir :
- homogénéiser la difficulté de la forgemagie : l'ancienne forgemagie (celle présente dans la 1.26) était parfois très facile ou très difficile sans raison particulière, ce qui rendait certaines transformations trop faciles ou au contraire trop difficiles, par rapport au résultat obtenu.
- baisser l'importance de la chance dans la forgemagie, notamment pour toutes les transformations communes, comme le remontage d'objet jusqu'à un jet correct.
Le nouveau système modifie principalement 3 aspects :
- Les chances de réussites
- Les échecs ne retirent plus 10% à tous les jets d'un objet, mais une puissance équivalente à ce qui est ajouté.
- Entre le succès et l'échec, il est possible de faire un succès partiel : le jet modifié augmente, mais un autre diminue
### Chances de réussites
 
La formule de calcul des chances de réussite a été entièrement refaite. Elle dépend désormais, par ordre décroissant d'importance :
- **de la qualité globale de l'objet** : plus les jets de l'objet sont proches du maximum, plus l'objet a une bonne qualité, et la forgemagie est difficile. Si l'objet dispose de bonus overmaxés (bonus qui dépassent le maximum normal de l'objet) ou de bonus exotique (c'est à dire des bonus qui n'existent pas normalement sur un objet), ils sont pris en compte dans la qualité de l'objet. Cependant, **le jet en cours de modification n'est pas pris en compte dans le calcul de la qualité**, afin de limiter l'impact de ce facteur sur les objets bas-niveau ou avec un seul jet.
- **de la qualité du jet modifié** : plus le jet modifié est proche du parfait, plus la forgemagie est difficile. Il y a un malus supplémentaire lorsque l'on dépasse le jet parfait (overmax).
- **du niveau de l'objet** : plus l'objet est haut-niveau, plus la forgemagie est difficile
Voici, dans les détails, l'impact de chacun de ces points :
- Si la qualité globale de l'objet est au-dessus de la moyenne, la difficulté augmente progressivement jusqu'au maximum possible lorsque l'objet atteint des jets parfaits dans tous les jets (excepté celui modifié qui n'est pas pris en compte). Si l'objet a des bonus exotiques ou overmax, ils interviennent sur le calcul de la qualité de l'objet.
- Si le jet que l'on modifie est au-delà de 80% du jet max naturel (plus précisément à 80% de la fourchette du jet), la difficulté augmente. **Il s'agit d'un pallier**, la difficulté augmente brutalement à 80% du jet. **Si le bonus a un jet fixe, ce facteur n'est pas pris en compte.**
- Si le jet que l'on modifie est un overmax, ou n'est pas un bonus existant naturellement sur l'objet, la difficulté augmente encore davantage. **Plus l'objet dispose d'overmax/bonus exotiques (en prenant en compte celui en cours de modification), plus la difficulté augmente.**
- La difficulté augmente **faiblement** avec le niveau de l'objet forgemagé.
- Il est plus difficile de forgemager un jet jusqu'à une valeur élevée sans utiliser des runes puissantes.
- **La forgemagie des objets disposant naturellement d'un seul jet est plus facile.**
- **La forgemagie des objets éthérés est plus difficile.**
- Comme auparavant, certaines tentatives de forgemagies sont impossibles à réussir :
  - Il est impossible de dépasser **une limite fixe de puissance d'effets non-naturels, pour l'intégralité des objets** (cette limite empêche par exemple d'ajouter à la fois un PA et un PM aux objets qui ne possèdent ni l'un ni l'autre de base).
  - Il est impossible de dépasser un jet naturel maximum si **la somme du power-rate non-naturel et du power-rate actuel de l'effet** dépasse une limite fixe. Il est par exemple impossible de dépasser **101 points de force** sur un objet dont le jet maximum de base est de 60.
### Gestion des échecs
 
En forgemagie 1.26, un échec se soldait par la perte de 10% sur tous les jets de l'objet. De ce fait, les bonus puissants étaient rarement menacés (+1PA, +1PM), alors que les bonus très peu puissants descendaient en flèche (+vitalité, +initiative).
 
Dans le nouveau système, lors d'un échec, l'objet perd l'équivalent en puissance de la rune qu'on a utilisé. Par exemple, si on a utilisé une rune Ine (+intelligence) de puissance 3, on perdra, dans la majorité des cas, l'équivalent de 3 point d'intelligence en cas d'échec.
 
Après un échec, **les bonus d'un objet peuvent redescendre jusqu'à 0 au minimum, alors que les malus ne peuvent dépasser le malus maximum naturel.**
 
**Le choix des bonus qui sont perdus est aléatoire. Si un bonus est trop puissant par rapport à ce qui doit être enlevé, il a une chance d'être épargné par la baisse, mais ce n'est pas systématique.** Lorsque ça arrive, il est possible que l'on perde plus que ce qu'on a tenté d'ajouter (comme par exemple en perdant 1 PA en tentant d'ajouter une rune Ine). **En compensation, lorsque ça arrive, de la magie résiduelle est créée sur l'objet, qui absorbera en partie les échecs futurs.** En pratique, cela signifie que si lors d'une transformation ratée l'objet perd trop de bonus, les échecs suivants (s'il y en a) auront moins de conséquences.
 
### Succès neutre
 
Lors d'une tentative de forgemagie, il est désormais possible d'obtenir un succès partiel (ou résultat neutre). Il ne s'agit ni d'un succès (critique), ni d'un échec (critique) : le jet modifié augmente, et un autre jet diminue. **Si ce résultat n'est pas possible (objet qui ne dispose que d'un seul jet par exemple), rien ne se passe en cas de succès partiel.**
 
**Les chances d'obtenir un succès partiel sont au maximum de 50%. Elles sont proches de ce maximum dans la majorité des cas** : elles diminuent si la transformation est très facile, au profit du succès critique, ou si la transformation est très difficile, au profit de l'échec critique.
 
On peut noter qu'**il est impossible de « puiser » dans les malus**, c'est-à-dire les effets négatifs de l'objet, **à moins que ceux-ci ne soient overmaxés**, car ils joueraient souvent le rôle de puits sans fonds.
 
### Quelques probabilités
 
| # | Situation (formulation Ankama exacte) | SC | N | EC |
|---|---|---|---|---|
| 1 | Les meilleures probabilités atteignables (remontage d'un effet simple comme la vitalité sur un objet normal pour un maître forgemage) | **66** | **34** | **0** |
| 2 | Les meilleures probabilités (bonus simples sur objets simples) pour tenter d'atteindre un jet parfait | **43** | **50** | **7** |
| 3 | Les probabilités minimums (bonus maximums sur objets complexes haut-niveau) en remontage d'effets pour un maître qui utilise des runes de puissance suffisante | **15** | **50** | **35** |
| 4 | Les probabilités **maximums en création d'effet** pour un maître | **32** | **50** | **18** |
| 5 | Les probabilités **minimums en création d'effet** pour un maître | **1** | **0** | **99** |
 
---
 
## CE QUE ÇA CORRIGE DANS LE CORPUS COMMUNAUTAIRE
 
### ❌ Correction 1 — l'ancre « jet parfait » est bien **43/50/7**
Le blog Guilde Yin-Yang donnait **34/50/16**. C'est FAUX. ExiTeD (forgemagie.net) avait
raison. L'intervalle `[34;43]` qu'on gardait ouvert se referme sur **43**.
 
### ❌ Correction 2 — le triplet « **1/22/77** exo avec puits » N'EXISTE PAS
Il ne figure ni dans l'original FR ni dans la traduction DE. C'est une invention (ou une
déformation) du relais Yin-Yang. **Toute calibration faite dessus est à refaire.**
 
### ✅ Correction 3 — une 6e ancre inédite : **création d'effet AU MIEUX = 32/50/18**
Jamais reprise par AUCUN guide communautaire en 15 ans. C'est la découverte majeure.
 
**Conséquence : « l'exo, c'est 1 % » est FAUX en général.** La création d'effet couvre
tout l'intervalle **32/50/18 → 1/0/99** selon la difficulté. Le 1 % que la communauté
connaît est le **plancher**, atteint sur les cas extrêmes (PA poids 100, PM 90, PO 51,
sur objet déjà chargé). Créer une ligne de Force sur un objet simple peut monter à 32 %.
Et le SN **existe** en création d'effet (jusqu'à 50 %) — il n'est nul qu'au plancher.
 
### ✅ Correction 4 — trois facteurs de difficulté jamais documentés ailleurs
* **Les objets éthérés sont plus difficiles à FM.**
* **Les objets à un seul jet naturel sont plus faciles à FM.**
* **Le nombre d'over/exo présents sur l'objet augmente la difficulté**, et pour CE facteur
  précis, **le jet en cours de modification EST compté** — alors qu'il est exclu du calcul
  de la qualité globale. Deux traitements différents du même jet dans la même formule.
### ✅ Correction 5 — il y a DEUX plafonds distincts, pas un
1. **Plafond par effet** : `power-rate non-naturel + power-rate actuel de l'effet ≤ limite fixe`.
   Exemple d'Ankama : impossible de dépasser **101 points de Force** sur un objet dont le jet
   max de base est 60. → c'est de là que sort `overmax = floor(101 / coef)`.
2. **Plafond par objet** : « une limite fixe de puissance d'effets non-naturels, pour
   l'intégralité des objets » — c'est celui qui empêche d'ajouter à la fois un PA ET un PM
   sur un objet qui n'a ni l'un ni l'autre. Sa valeur n'est **pas donnée**.
Le corpus communautaire confondait les deux sous un unique « cap 101 ».
 
### ✅ Correction 6 — règles de perte, formulation d'origine
* Bonus : plancher à **0**. Malus : ne peuvent **pas dépasser le malus maximum naturel**.
* Le choix des bonus perdus est **aléatoire** ; un bonus trop puissant « a une chance d'être
  épargné, mais ce n'est pas systématique » → l'hypothèse d'ExiTeD
  (`P = PWR_rune × 100 / PWR_jet`) est cohérente avec le texte mais reste **[SUPP]** :
  Ankama ne donne aucun chiffre.
* La magie résiduelle (puits) est créée **exactement quand on perd plus que prévu**, et elle
  « absorbera en partie les échecs futurs » — « en partie », pas totalement.
* **Impossible de puiser dans les malus non-overmaxés** (sinon puits sans fond).
### ✅ Correction 7 — le SN sur objet mono-jet
« Si ce résultat n'est pas possible (objet qui ne dispose que d'un seul jet), **rien ne se
passe** en cas de succès partiel. » → un SN sur mono-jet est un no-op, pas un gain.