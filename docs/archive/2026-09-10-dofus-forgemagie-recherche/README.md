# Dossier de recherche — Forgemagie DOFUS (pour simulateur local)

Compilé le 09/09/2026. Objectif : rassembler tout ce qui est publiquement connu de
l'algorithme de forgemagie d'Ankama, pour construire un simulateur en local.

## ⚠️ Le constat qui structure tout

**Il n'existe aucun jeu de données brut public de tentatives de FM.** Pas de Google Sheet,
pas de CSV, pas de PDF de relevés. La communauté DOFUS n'a jamais produit de « recensement
de runes » exploitable, malgré ~20 ans de jeu et plusieurs tentatives (dont le fil forum que
tu as ouvert). Ankama a refusé publiquement de publier l'algo à deux reprises
(DevBlog 2.27 et 2.29).

**Le seul gros échantillon vérifié qui existe** : 10 000 tentatives d'exo PM → 111 exos
= 1,11 % (IC95 % [0,905 ; 1,315]) → le 1 % officiel n'est pas réfuté.

Ce qui EST disponible, et qui est dans ce dossier :
1. les **cinq triplets de probabilités officiels** publiés par Ankama au DevBlog 1.27
   (l'enveloppe du modèle) ;
2. les **tables de poids** complètes, extraites des serveurs et du module client ;
3. **trois implémentations serveur** de la FM, en code, réalisées par rétro-ingénierie ;
4. le **wiki de référence historique** de la communauté, récupéré d'archive.org ;
5. une **spécification consolidée + un simulateur Python** calibré sur les ancres officielles.

---

## Par où commencer

| Ordre | Fichier | Quoi |
|---|---|---|
| 1 | `ALGORITHME.md` | **Le document central** (1 514 lignes). Spec complète et implémentable. Chaque affirmation marquée `[OBS]` / `[CODE]` / `[CONS]` / `[SUPP]`. |
| 2 | `reference_impl/fm_sim.py` | Simulateur Python autonome (stdlib pure), paramètres regroupés dans `ModelParams`. 31 tests verts. |
| 3 | `reference_impl/test_fm_sim.py` | `python3 test_fm_sim.py` → vérifie les invariants et l'ajustement sur les 5 ancres. |
| 4 | `data/README_DATA.md` | Schéma et provenance des données. |
| 5 | `ALGORITHME.md` §12 | **Protocole de calibration** : quoi logger, combien de tentatives, comment estimer. |

---

## Contenu

### `data/` — données prêtes à consommer
| Fichier | Volume |
|---|---|
| `runes.json` | 105 runes Dofus 2/3 + 54 runes Rétro : stat, valeur, poids, poids unitaire, overmax, sources, conflits |
| `stats_weights.json` | 68 caractéristiques : coef de poids **bonus et malus**, overmax retenu + théorique `floor(101/coef)`, colonnes Dofus 2/3 et Rétro |
| `items_retro.json` | 6 078 objets 1.29/1.39 — 26 557 effets, dont 13 546 forgemageables (jet_min / jet_max) |
| `items_dofus2.json` | 3 465 objets — 19 664 effets, 99,6 % des lignes de stat mappées |
| `runes_weights_lilgallon.csv` | table brute scrapée des serveurs Ankama (audit croisé : 0 divergence sur 95 runes) |

### `sources/` — la recherche brute
| Fichier | Quoi |
|---|---|
| `mecaniques.md` | 889 lignes : toutes les formules et tables trouvées sur le web, avec URL, fiabilité et 21 contradictions arbitrées |
| `code-sources.md` + `code/` | les 5 sources de code exploitables, extraits d'algorithme recopiés |
| `datasets.md` | recherche exhaustive de données brutes — dont le verdict « ça n'existe pas », et les 5 Discord FM à démarcher |
| `createurs.md` | 18 créateurs à données chiffrées, 22 vidéos, 15 outils FM existants |
| `archive/forgemagie-net-wiki.md` | **le wiki de référence historique**, récupéré via Wayback Machine (site mort) |

### `repos/` — 12 dépôts clonés
Les trois qui comptent :
* **`StarLoco-Game`** (Java, 1.39) — la seule implémentation qui modélise les 3 issues
  SC/SN/EC, un puits persistant, les plafonds d'over et l'algo de perte en EC.
  Ses noms de variables sont ceux du DevBlog Ankama et ses clamps sont littéralement
  66 / 50 / 1-0-99. Base de travail recommandée. ⚠️ 3 bugs identifiés à ne pas recopier
  (cf. `ALGORITHME.md` §3.3).
* **`dmUtils` / `SmithMagic`** (ActionScript, module client Dofus 2) — `RuneWeightEnum.as` :
  table de poids bonus **et** malus, et la formule du puits vérifiée en jeu.
* **`Ancestra-Evolutive`**, **`Nao`** (1.29) — formules alternatives, utiles pour recouper.

---

## Les 5 ancres officielles (DevBlog Ankama 1.27)

| # | Situation | SC | SN | EC |
|---|---|---|---|---|
| 1 | Meilleur cas — `Pmax(PWRGmin & PWRmin)` | 66 | 34 | 0 |
| 2 | Jet parfait, bonus simples, objet simple | 34–43 ⚠️ | 50 | 7–16 ⚠️ |
| 3 | Minimum avec runes de puissance suffisante | 15 | 50 | 35 |
| 4 | Création d'effet (exo) **avec** puits | 1 | 22 | 77 |
| 5 | Création d'effet (exo) **sans** puits | 1 | 0 | 99 |

⚠️ L'ancre 2 est le seul point où les deux relais indépendants du DevBlog divergent
(43/50/7 chez ExiTeD, 34/50/16 chez Yin-Yang). Le modèle calibré donne 38/49/13.
Le DevBlog original n'a pas été retrouvé — à traiter comme un intervalle.

**État de l'ajustement** : `params_devblog_fit()` (exposant_taille = 0,4) fait passer
l'erreur sur les 5 ancres de **13 856 → 194**. Ancres 1, 4 et 5 exactes ; ancre 2 à 4 points ;
ancre 3 à 10 points (probablement le facteur « niveau de l'objet », absent de tous les
émulateurs — cf. §14.4).

---

## Ce qui manque, et comment l'obtenir

1. **Des données brutes.** La seule voie réaliste est d'en produire. Le protocole §12
   d'`ALGORITHME.md` chiffre les tailles d'échantillon (budget conseillé 2 000–3 000
   tentatives) et donne le schéma CSV à logger.
2. **`DofusFM` (Vicfou-dev)** revendique **12 000+ exos loggés** avec l'historique complet
   des tentatives, jamais publié. Discord : `discord.gg/GRV3hBcSr8`. Le demander est de loin
   le meilleur retour sur temps investi de tout ce dossier.
3. **L'applet GeoGebra « Probabilités FM 1.27 »** de forgemagie.net — courbes paramétrées par
   poids de rune et niveau d'objet. 404 sur tous les snapshots. À chercher auprès d'anciens
   du forum (sujet 566).
4. **`EasyFM.rar`** (simulateur de 2010, moteur de probas indépendant) est encore
   téléchargeable : `https://web.archive.org/web/20121226112220/http://www.forgemagie.net/EasyFM.rar`
   → à décompiler.

⚠️ Note pratique : automatiser le client DOFUS pour collecter des données est contraire aux
CGU d'Ankama et se termine par un bannissement. La collecte manuelle (ou le parsing d'un
journal de chat, à tes risques) est la voie sûre.
