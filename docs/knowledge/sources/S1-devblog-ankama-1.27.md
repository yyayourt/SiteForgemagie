# S1 — DevBlog Ankama « La nouvelle forgemagie »

## Identité

| Champ | Valeur |
|---|---|
| **Nature** | Billet de développement officiel Ankama (texte de l'éditeur) |
| **Statut de base** | `SOURCE PRIMAIRE — v1.27` |
| **Date de publication** | 2010 (postérieure à la sortie de la 1.27, après passage sur le serveur de test) |
| **Version de jeu couverte** | **DOFUS 1.27 uniquement** |
| **URL d'origine** | `http://devblog.dofus.com/fr/billets/61-nouvelle-forgemagie.html` (mort) |
| **Copie consultée** | `web.archive.org/web/20101118084715/…` — l'horodatage `20101118` **date la capture de novembre 2010** |
| **Traduction DE** | `/de/beitragen/11-neue-schmiedmagie.html`, déclarée identique |
| **Méthode d'obtention** | Récupération d'archive web, retranscription verbatim le 10/09/2026 |
| **Copie dans le dépôt** | `docs/Devblog ankama source primaire.md` (non suivi par git) |
| **Rang de fiabilité** | **R3** — source officielle Ankama antérieure à Unity |

## Ce que la fiche couvre et ne couvre pas

Le fichier `docs/Devblog ankama source primaire.md` contient **deux couches à ne pas
confondre** :

1. **§ « TEXTE INTÉGRAL (FR, verbatim) »** → `SOURCE PRIMAIRE — v1.27`.
   C'est la seule partie citable comme preuve.
2. **§ « CE QUE ÇA CORRIGE DANS LE CORPUS COMMUNAUTAIRE » (Corrections 1 à 7)** →
   **commentaire d'analyse rédigé le 10/09/2026**, non écrit par Ankama.
   Statut : `HYPOTHÈSE` (lecture) sauf là où il ne fait que constater une divergence de
   citation entre relais, ce qui est vérifiable et vaut `SOURCE PRIMAIRE — v1.27` par
   comparaison de textes.

Le texte verbatim n'a pas été revérifié contre l'archive dans cette passe : la
retranscription est prise pour fidèle. **À vérifier** (ouverture directe de l'URL
web.archive.org) avant tout usage en calibration — c'est un préalable, pas une formalité.

## Les cinq ancres de probabilités

Le texte donne cinq situations chiffrées (SC / N / EC) :

| # | Situation (formulation Ankama) | SC | N | EC |
|---|---|---|---|---|
| 1 | Meilleures probabilités atteignables (remontage d'un effet simple, objet normal, maître forgemage) | 66 | 34 | 0 |
| 2 | Meilleures probabilités (bonus simples sur objets simples) pour **atteindre un jet parfait** | 43 | 50 | 7 |
| 3 | Probabilités **minimums** (bonus maximums, objets complexes haut-niveau) en remontage, runes de puissance suffisante | 15 | 50 | 35 |
| 4 | Probabilités **maximums en création d'effet** pour un maître | 32 | 50 | 18 |
| 5 | Probabilités **minimums en création d'effet** pour un maître | 1 | 0 | 99 |

### Statut épistémique de ces cinq chiffres — règle (a)

> **Ces cinq ancres sont des chiffres de 2010, valides pour la 1.27.**
> Leur valeur numérique est `SOURCE PRIMAIRE — v1.27`.
> **Leur transposition à DOFUS 3 / Unity 3.6.10.11 est une `HYPOTHÈSE`**, jamais une source
> primaire pour la version courante.

Cette hypothèse n'est pas gratuite, et l'argument doit être cité chaque fois qu'on s'en sert :

- **Argument POUR** : la borne basse de l'ancre 3 (**SC = 15 %** en remontage normal) est
  **identique** dans le tutoriel officiel Ankama actuel
  (`dofus.com/fr/mmorpg/tutoriels/420190-forgemagie`, `SOURCE PRIMAIRE — Unity`) :
  « le taux de Succès Critique le plus faible lors de l'utilisation d'une rune, hors
  tentative d'overmax ou de forgemagie exotique, est de 15 % ». Une constante structurelle
  du système de 2010 a donc traversé 16 ans et le portage Unity sans changer.
  De même, l'ancre 5 (**SC = 1 %**) correspond au « peut descendre jusqu'à 1 % » du même
  tutoriel actuel. **Deux des cinq bornes sont reconduites à l'identique en Unity.**
- **Argument CONTRE** : deux bornes reconduites ne prouvent rien sur les trois autres
  (66, 43, 32), ni sur la **forme** de la courbe entre elles. Entre 1.27 et 3.6, les poids
  de plusieurs caractéristiques ont changé (2.29), l'interface a été refondue (2.58), le
  moteur a été porté (3.0) ; aucun changelog ne dit que la fonction de probabilité est
  restée la même, ni le contraire.

**Conséquence opérationnelle** : les ancres 1, 2 et 4 sont des **cibles de calibration
plausibles**, à déclarer comme telles (`HYPOTHÈSE — transposition v1.27 → Unity`), jamais
comme des valeurs mesurées sur la version courante. Une mesure en jeu (S2 et suivantes)
les réfute ou les confirme ; elle ne les remplace pas tant que N est trop petit.

## Affirmations structurelles du texte (hors chiffres)

Ces affirmations décrivent la **mécanique**, pas des valeurs. Elles sont plus robustes au
changement de version que les chiffres, mais restent `SOURCE PRIMAIRE — v1.27`.

| Affirmation | Formulation d'origine |
|---|---|
| Facteurs de difficulté, par importance décroissante | qualité globale de l'objet > qualité du jet modifié > niveau de l'objet |
| Le jet en cours de modification est **exclu** du calcul de qualité globale | « le jet en cours de modification n'est pas pris en compte dans le calcul de la qualité » |
| … mais **inclus** pour le facteur over/exo | « en prenant en compte celui en cours de modification » |
| Palier à 80 % de la fourchette du jet | « Il s'agit d'un pallier, la difficulté augmente brutalement à 80 % du jet » |
| Jet fixe → le palier ne s'applique pas | « Si le bonus a un jet fixe, ce facteur n'est pas pris en compte » |
| Objets **éthérés** plus difficiles | verbatim |
| Objets à **un seul jet naturel** plus faciles | verbatim |
| **Deux** plafonds distincts (par effet / par objet) | voir `../arbitrages-2026-09-10.md` §4.1 |
| Perte en échec = puissance de la rune | « l'objet perd l'équivalent en puissance de la rune qu'on a utilisé » |
| Bonus plancher 0 ; malus bornés au malus naturel maximum | verbatim |
| Choix des lignes perdues **aléatoire**, ligne trop puissante « a une chance d'être épargnée, mais ce n'est pas systématique » | verbatim |
| Le reliquat naît **exactement** quand on perd plus que prévu, et « absorbera **en partie** les échecs futurs » | verbatim |
| Impossible de puiser dans les malus **non overmaxés** | verbatim |
| SN plafonné à **50 %**, « proche de ce maximum dans la majorité des cas » | verbatim |
| SN impossible (objet mono-jet) → **rien ne se passe** | verbatim |

## Rôle dans la hiérarchie

R3 : cède devant toute observation Unity (R1) et devant le tutoriel Ankama actuel (R2), mais
**prime sur tous les guides communautaires** (R5), y compris ceux qui prétendent le citer —
c'est tout l'objet de la [généalogie](genealogie.md).
