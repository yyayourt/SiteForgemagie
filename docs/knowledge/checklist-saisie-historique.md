# Checklist de saisie — panneau d'historique natif

**Créée le 2026-09-10.** À utiliser telle quelle pendant une session de forge.
Schéma correspondant : [`data/observations/history-import.schema.json`](../../data/observations/history-import.schema.json).

> **Pourquoi cette checklist existe.** `data/observations/observations.json` ne contient
> **qu'une seule tentative**. Toutes les stratégies posées dans le moteur — loi de sélection
> des pertes, pentes des six facteurs du DevBlog, consommation du reliquat, position d'un
> exotique dans son intervalle — sont aujourd'hui **libres de toute contrainte empirique**.
> Aucune ne pourra bouger avant que ce fichier ne se remplisse.

---

## Avant de commencer — 2 minutes

- [ ] **Version du client** relevée (ex. `3.6.10.11`). Comparer avec
      `data/dataset.json → meta.gameVersion` : si elles divergent, le noter, c'est une
      information et pas un obstacle.
- [ ] **Dossier de captures créé** : `data/observations/captures/AAAA-MM-JJ/`.
      Sans capture, la lecture n'est pas auditable — **aucune exception**, pas même pour une
      observation directe. C'est la règle du schéma, et elle ne se négocie pas.
- [ ] **Historique vidé** (bouton « VIDER L'HISTORIQUE ») : on part d'une page blanche, sinon
      l'ordre des entrées devient indémêlable.
- [ ] **Objet choisi en connaissance de cause.** Pour estimer des probabilités, il faut des
      séries à **conditions homogènes**. Un objet qui mélange une ligne en over et une ligne
      vide — la Cape Bouffante du 10/09 — est excellent pour observer une *mécanique* et
      mauvais pour mesurer un *taux*.

## L'ancrage — une seule fois, dans le panneau d'objet

C'est la partie que l'historique ne donne pas et sans laquelle rien ne se reconstitue.

- [ ] **Toutes les lignes**, y compris **celles à 0**, les **malus** et les **exos**.
      Une ligne omise fausse toute la chaîne.
- [ ] Pour chaque ligne : **valeur affichée**, **jet min** et **jet max** (infobulle).
      `jet min = jet max` signale un **jet fixe**, que le DevBlog exempte du palier de 80 % :
      c'est une donnée, pas un détail.
- [ ] **Reliquat affiché dans l'en-tête** au moment de l'ancrage.
- [ ] Noter si l'ancrage est pris **au début** ou **à la fin** de la session (`anchor.at`).
      À la fin est souvent plus commode : on ne sait pas toujours d'avance qu'on va forger.
- [ ] **Capture d'écran du panneau d'objet**, pas seulement de l'historique.

## Par tentative — ce que le panneau donne réellement

| Champ | Où le lire | Piège |
|---|---|---|
| **rune** | icône de l'entrée | relever aussi la **valeur** et la **DENSITÉ** de son infobulle, une fois par type de rune |
| **gains** | détail de l'entrée (« 15 Vitalité ») | ⚠️ **variation NETTE**, voir ci-dessous |
| **pertes** | détail de l'entrée (« -26 Initiative ») | idem |
| **± reliquat** | mention `+ reliquat` / `- reliquat` | c'est un **sens**, pas une valeur |
| **Échec** | libellé de l'entrée | transcrire **le mot du client**, jamais « SC / SN / EC » |
| **valeur du reliquat** | **en-tête de la fenêtre**, pas l'entrée | exige une capture par tentative |

- [ ] **Transcrire ce qui est écrit, pas ce qu'on reconstitue.** Le champ `outcomeLabel`
      n'accepte que `Échec` ou rien. Écrire « SN » dedans, c'est injecter une interprétation
      dans une donnée brute — exactement ce qui a rendu l'anomalie A3 inexploitable.
- [ ] **Un horodatage par entrée** (position dans la vidéo). Deux entrées au même horodatage
      = erreur de transcription, et les **deux** deviennent inexploitables. C'est ce qui est
      arrivé à A2/A3 le 10/09.
- [ ] **Ordre** : le client affiche en général la plus récente en haut. Le schéma attend
      l'ordre **chronologique**. Inverser, puis le vérifier sur un cas dont on connaît l'ordre.
- [ ] Marquer `uncertain: true` toute entrée douteuse. Une entrée douteuse ne sert **ni à
      calibrer, ni à trancher une règle**. Mieux vaut dix entrées sûres que trente tièdes.

### La règle des trois états — `[]` n'est pas `null`

Pour `changes` et `residualMention`, **le champ n'est jamais absent**, et il porte trois
valeurs qu'il ne faut pas confondre :

| Valeur | Sens | C'est |
|---|---|---|
| `changes: [ … ]` · `residualMention: "gain"` / `"loss"` | ce que l'entrée montrait | une **lecture** |
| `changes: []` · `residualMention: "none"` | l'entrée ne montrait **rien** | une **constatation**, aussi informative qu'une lecture |
| `changes: null` · `residualMention: "unrecorded"` | **je n'ai pas regardé** | un **aveu** |

- [ ] Ne jamais écrire `[]` ou `"none"` par défaut quand on n'a pas regardé. `[]` affirme
      quelque chose ; `null` n'affirme rien. Les confondre transforme une ignorance en donnée.

**Pourquoi cette règle vaut son poids.** Depuis que le succès neutre impossible et l'échec
critique avec pertes portent **tous deux le libellé « Échec »**, l'**absence explicite de
delta** est le seul discriminant entre les deux :

| Ce qu'on voit | Ce que c'est |
|---|---|
| `Échec` + `changes: []` | tentative **sans effet** — l'objet ressort identique |
| `Échec` + `changes: [pertes]` | **échec critique** qui a coûté |
| `Échec` + `changes: null` | **rien du tout** : l'entrée ne tranche pas |

C'est exactement ce qui a fait sortir l'anomalie A3 du corpus exploitable. Bien remplie,
cette colonne permet de **lever A3 rétrospectivement sur des captures déjà prises**, sans
retourner en jeu — il suffit de rouvrir la vidéo et de constater, pour chaque entrée
« Échec », s'il y avait ou non un détail de pertes.

### ⚠️ Le piège central : l'affichage est NET

L'historique semble additionner, sur une même ligne, le gain de la rune et la reprise qui
suit. Une Rune Pa Vi (+15) dont la ligne reprend 9 s'affiche **« 6 Vitalité »**.

- N'écrivez **jamais** un `delta` comme s'il était le gain brut de la rune.
- Le contrôle qui trahit le net : **le poids total perdu doit égaler le poids de la rune**
  quand le reliquat ne bouge pas. Si vos deltas ne le vérifient pas, c'est du net.

Cette lecture est elle-même `INCONNU`, N = 1 — voir
[`deltas-2026-09-10.md`](deltas-2026-09-10.md) § B.bis. **La confirmer ou la réfuter est
l'une des trois mesures prioritaires.**

## Après la session

- [ ] Captures versées dans le dossier daté, **nommées par index d'entrée**.
- [ ] Session transcrite au format `history-import.schema.json`.
- [ ] `anchor.read` mis à `false` si l'état d'ancrage a été **déduit** et non lu.
- [ ] Les tentatives converties au format `observations/v1` conservent
      `lineStateBeforeDeduced: true` dès que leur état initial vient de la chaîne et non
      d'une lecture directe.

---

## Les trois mesures prioritaires

Dans cet ordre : elles se tranchent en **dizaines** de tentatives, pas en milliers, et
chacune débloque une décision aujourd'hui arbitraire.

### 1. Verrouiller la table de densités — ~30 minutes, aucun risque

Survoler chaque rune, noter le champ **DENSITÉ**. C'est la seule voie pour faire passer une
entrée de `empirical_params.json → densities` en `SOURCE PRIMAIRE` : aucune API de
datamining n'expose cette valeur. Format : `data/observations/tooltips/`.

À vérifier en priorité, parce que le moteur en dépend partout : **Ra Vi → 10, Rune Cri → 10,
Rune Sa → 3, Ga Pa → 100, Ga Pme → 90, Rune PO → 51**.

### 2. Reproduire les anomalies — quelques dizaines de tentatives ciblées

| Anomalie | Protocole | Ce que ça débloque |
|---|---|---|
| **A1** — le puits n'a pas absorbé | ~20 EC sur un objet à **puits non nul**, reliquat relevé avant/après chaque tentative | la règle de consommation du reliquat (`poolConsumptionRule`, une seule implémentation aujourd'hui) |
| **A2** — affichage net ou gain plafonné | une tentative à **reliquat nul avant ET après** dont le poids total perdu **diffère** du poids de la rune réfute la lecture « net » | l'invariant « poids perdu = poids de la rune » |
| **mono-jet à puits non nul** | objet dont **toutes les lignes sauf la cible sont à 0**, puits préexistant non nul, attendre un SN | tranche la divergence 1.27 / Unity ; **une seule occurrence propre suffit**, les deux prédictions étant qualitativement opposées (voir `deltas-2026-09-10.md` § A.bis) |

### 3. Seulement ensuite, la collecte de masse

Sur objets **simples** — deux lignes, conditions homogènes — pour estimer des taux. Ne pas
commencer par là : un dataset hétérogène ne mesure rien, et il coûte le même temps.

---

## Ce qu'aucune de ces mesures ne donnera

Ni le taux des potions (mesure séparée : dégâts d'une arme avant/après, par palier, sur deux
armes de fourchettes différentes), ni la valeur du plafond par objet (observation en HDV :
un exo PA coexiste-t-il avec un exo PO ?), ni la forme du plafond par effet (`CONTRADICTION`
L1/L2/L3, arbitrage 4.1). Ces trois-là se tranchent **hors atelier**.
