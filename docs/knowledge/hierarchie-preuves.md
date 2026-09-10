# Hiérarchie des preuves — ordre de préséance

**Créé le 2026-09-10.** Complète les statuts épistémiques de `CLAUDE.md` (`SOURCE PRIMAIRE`,
`MODÈLE EMPIRIQUE`, `HYPOTHÈSE COMMUNAUTAIRE`, `CONTRADICTION`, `INCONNU`), qui disent
*à quel point* une affirmation est établie, mais **pas laquelle gagne** quand deux
affirmations bien étiquetées se contredisent.

> **Règle d'usage — obligatoire.**
> Toute résolution de contradiction, dans `docs/knowledge/`, dans `errata.md`, dans une note
> d'`empirical_params.json` ou dans un commentaire de code, **doit citer le rang des deux
> sources en présence et le présent document**. Une contradiction tranchée sans citation de
> rang n'est pas tranchée : elle est arbitraire.

## L'ordre

| Rang | Catégorie | Exemples | Ce qu'il faut pour l'invoquer |
|---|---|---|---|
| **R1** | **Observation directe du client Unity courant** | S2 (10/09/2026, Unity 3.6.10.11), observations du 2026-09-08 et 2026-09-09, `data/observations/` | Capture versionnée + version du client + date. Sans capture, la lecture n'est pas auditable et **n'a aucun rang** |
| **R2** | **Source officielle Ankama, ère Unity** | tutoriel `dofus.com/fr/mmorpg/tutoriels/420190-forgemagie` ; devblog 2.58 (transcendance) ; changelogs 2.29 / 2.58 relayés par jeuxonline | Citation verbatim + URL |
| **R3** | **Source officielle Ankama antérieure à Unity** | S1 — DevBlog 1.27 (2010) | Citation verbatim + archive datée. **Valeur structurelle** : voir ci-dessous |
| **R4** | **Code open-source de l'ère Unity, et cartographie technique** | `KamelAkar/Calculateur_Brisage_Dofus`, `Icksir/crushing-calculator` (Unity 3.4), DDC, doduda, S4 | Lien vers le fichier et la constante précise |
| **R5** | **Guides communautaires 2.x et wikis** | Huzounet, Millenium, dofastuces, JeuxOnLine, Gamosaurus, forgemagie.net, Alterya, Yin-Yang, Fandom, wiki-dofus.eu | Doit être **dé-doublonné** : voir `sources/genealogie.md` |
| **R6** | **Sources réfutées ou périmées** | `Algorithme_Forgemagie_DOFUS_3.pdf` ; tables 1.29 / Retro / Touch ; conclusions 2.x que Unity a invalidées | **Ne justifie jamais une valeur.** Conservé pour tracer d'où vient une erreur |

## Comment appliquer l'ordre

### Règle 1 — le rang supérieur tranche, sur son périmètre

R1 bat R2 bat R3 bat R4 bat R5 bat R6. Mais **seulement sur ce que la source couvre
réellement**. Une observation Unity de la densité d'une rune ne tranche rien sur les
probabilités ; un devblog sur la transcendance ne tranche rien sur le brisage.

Avant d'invoquer un rang, écrire ce que la source dit **littéralement**. Si elle ne dit pas
la chose contestée, elle ne tranche pas.

### Règle 2 — le rang ne remplace pas l'échantillon

Un rang élevé qualifie la **provenance**, pas la **généralité**. Une observation R1 unique
d'un comportement dynamique établit qu'un événement s'est produit ; elle n'établit pas de
règle. Elle **suffit en revanche à réfuter** une règle qui prédisait autre chose : elle fait
passer cette règle en `INCONNU` ou `CONTRADICTION`, sans pour autant installer sa propre
lecture à la place.

Application : les anomalies A1, A2, A3 de S2 sont R1 et restent `INCONNU`.

### Règle 3 — un rang supérieur périmé perd contre un rang inférieur actuel

Une source officielle Ankama de 2010 (R3) est battue par une observation Unity (R1) ; c'est
l'ordre. Mais elle est aussi battue, sur les points de **valeur numérique**, par une source
officielle Unity (R2) — c'est encore l'ordre. Le cas subtil est celui d'une source R4/R5
**récente** contre une source R3 **ancienne** : l'ordre dit R3 gagne. Cela reste vrai pour
la **mécanique**, et devient discutable pour les **chiffres**.

D'où la distinction imposée sur R3 :

> **R3 — valeur structurelle vs valeur numérique.**
> Les **mécaniques** décrites par le DevBlog 1.27 (existence du SN, plafond de SN à 50 %,
> perte = puissance de la rune, création du reliquat sur surperte, deux plafonds distincts,
> facteurs de difficulté) se transposent à Unity par défaut : `HYPOTHÈSE` forte, réfutable.
> Les **valeurs numériques** (43, 66, 32, 34, 7, 18…) sont datées de 2010 : leur
> transposition est une `HYPOTHÈSE` simple, à réévaluer dès qu'une mesure Unity existe.
>
> Argument en faveur de la transposition, à citer : le plancher **15 %** de l'ancre 3 et le
> **1 %** de l'ancre 5 sont repris **à l'identique** dans le tutoriel Ankama actuel (R2).
> Deux des cinq bornes ont donc survécu à 16 ans et au portage Unity.
> Argument contre, à citer aussi : deux bornes reconduites ne disent rien des trois autres,
> ni de la forme de la courbe entre elles.

### Règle 4 — dé-doublonner avant de compter

Trois guides qui recopient la même racine font **une** source, pas trois. La convergence
n'est une preuve que si les sources sont **indépendantes**. Avant d'invoquer « plusieurs
sources concordantes » en R5, remonter l'arbre : `sources/genealogie.md`.

Corollaire démontré : le relais Yin-Yang donne `34/50/16` là où l'original Ankama donne
`43/50/7`. Une valeur dont **la seule origine est un relais** est suspecte par construction.

### Règle 5 — un émulateur, un bot, un client ne prouvent pas le serveur

Reprise de `CLAUDE.md`, inchangée. Un comportement observé dans un émulateur ou un bot n'est
jamais une preuve du serveur officiel — c'est pourquoi les émulateurs ne figurent pas dans
l'échelle. Le client Unity fait exception **pour ce qu'il affiche** (le serveur lui a envoyé
la valeur), pas pour ce qu'il calcule.

### Règle 6 — le rang d'un compilateur est celui de sa source

S3 et S4 sont des rapports de compilation : ils n'ont **pas de rang propre**. Chaque
affirmation hérite du rang de la source qu'elle cite. Citer « R PARTIE 3 » comme autorité est
une faute de méthode ; il faut citer ce que R PARTIE 3 cite.

## Journal des arbitrages rendus sous cet ordre

| Date | Question | Rangs en présence | Verdict | Détail |
|---|---|---|---|---|
| 2026-09-10 | Ancre « jet parfait » : `43/50/7` ou `34/50/16` ? | R3 (S1, original) vs R5 (Yin-Yang, relais) | **43/50/7**, v1.27 | `arbitrages-2026-09-10.md` §4.2 |
| 2026-09-10 | Le triplet `1/22/77` existe-t-il ? | R3 (absent du texte FR et DE) vs R5 | **N'existe pas.** Toute calibration dessus est invalide | §4.2 |
| 2026-09-10 | « L'exo, c'est 1 % » : constante ou plancher ? | R3 (ancres 4 et 5) + R2 (« peut descendre jusqu'à 1 % ») vs R5 | **Plancher**, pas constante | §4.3 |
| 2026-09-10 | Un plafond ou deux ? | R3 (deux plafonds explicites) vs R5 (« cap 101 » unique) | **Deux**, dont un de valeur inconnue | §4.1 |
| 2026-09-10 | Le reliquat est-il exposé au client ? | R1 (S2, affiché avec décimales) vs R6 (S4, conclusion 2.x) | **Affiché en Unity** ; S4 re-scopé à 2.x | §4.4 |
| 2026-09-10 | Taux des potions | R1 (aucun taux affiché, 2 paliers) vs R5 (50/65/80) vs R5 (85 % post-3.1) | **`CONTRADICTION NON RÉSOLUE`**, aucune valeur codée | §4.5 |
