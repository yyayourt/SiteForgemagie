# Pistes de DONNÉES BRUTES de forgemagie — traque des outils qui logguent

Recherche du 2026-09-10. Suite directe de `datasets.md` et `createurs.md`.
Objectif : trouver des **milliers de tentatives de FM enregistrées**, ou le moyen le plus court d'en obtenir.

> **Limites d'accès de cette session** (important pour interpréter les « non vérifié ») :
> `curl` passe par une allowlist d'egress → **seuls github.com et raw.githubusercontent.com sont joignables**.
> `web.dofus-fm.cloud`, `forgetracker.com`, `dofzel.fr`, `geneka.net`, `huggingface.co`, `kaggle.com`,
> `zenodo.org` → **403 CONNECT**. `dofus.com` et `inkybot.me` → robots.txt bloque WebFetch.
> `github.com/search` → robots.txt, **mais `api.github.com/search/...` passe via WebFetch** (c'est comme ça
> que les dépôts ci-dessous ont été trouvés). `git clone` fonctionne sur tout dépôt public.

---

## VERDICT EN UNE PAGE

1. **Aucun outil FM ne publie de dataset.** Zéro dump, zéro seed, zéro endpoint de stats, zéro leaderboard
   exploitable. Vérifié un par un.
2. **Tous les outils qui logguent stockent en LOCAL** (fichier / localStorage / base sur le disque de
   l'utilisateur). Deux exceptions à base serveur : **Dofzel** (compte obligatoire) et **DofusFM** (serveur
   de licence uniquement, pas de logs de jeu).
   → **Les données existent, mais éclatées sur des centaines de disques durs.** Il faut les *demander*.
3. **La découverte la plus utile de cette session n'est pas un dataset, c'est le SCHÉMA DE VÉRITÉ TERRAIN** :
   le serveur Dofus renvoie au client, à chaque passage de rune, un paquet
   `ExchangeCraftResultMagicWithObjectDescMessage` qui contient **le résultat exact (SC/SN/EC) + l'état
   complet de l'objet après coup + le sens de variation du puits**. §3.
   → N'importe qui avec un sniffer produit un dataset **parfaitement labellisé, sans OCR, sans ambiguïté**.
   C'est la voie la plus rapide vers « des milliers de lignes », et elle ne dépend de personne.
4. **Un dépôt fait déjà exactement ça** : `Kaz-ookid/auto-forgemagie` (§2.7). Il ne publie pas ses données,
   mais il publie **le code de décodage** — récupéré et copié en local.
5. Hugging Face / Kaggle / Zenodo / OSF / data.world / GitHub topics : **rien**. §5.

---

## §1 — PRIORITÉ 1 : DofusFM / Vicfou-dev (12 000+ exos)

| | |
|---|---|
| Dépôt | https://github.com/Vicfou-dev/dofus-fm-server — **cloné intégralement** |
| Site | https://web.dofus-fm.cloud (+ `/fr/guide`) — **injoignable depuis cette session (403 egress)**, SPA |
| Discord | **https://discord.gg/GRV3hBcSr8** ← le seul canal de contact |
| Binaires | `https://release.dofus-fm.cloud/DofusFM_Setup.exe` · `https://release.dofus-fm.cloud/DofusFM-Server.pkg` |
| Volume revendiqué | **12 000+ exos**, « des centaines d'exos chaque semaine » |
| Accessibilité des données | **PRIVÉ** (à demander) |
| **Valeur pour le simulateur** | **5/5 si obtenu, 0/5 en l'état** |

### Autopsie du dépôt (fait, pas supposé)
`git clone` + `git log` complet : **25 commits, tous des éditions de README**, plus un `Add files via upload`
qui n'ajoute que `dofus-fm.png`. `git log --diff-filter=D` : **aucun fichier supprimé de l'historique**.
Contenu total du dépôt = `README.md` + `dofus-fm.png`.
→ **Pas de code, pas de schéma, pas de seed, pas de migration, pas de dump. Rien à extraire.**

### Dépôts frères : il n'y en a pas
`api.github.com/users/Vicfou-dev/repos` et `github.com/Vicfou-dev?tab=repositories` sont bloqués (403 proxy),
mais **`api.github.com/search/repositories?q=forgemagie` via WebFetch** ne renvoie qu'un seul dépôt sous ce
compte, et le topic `dofus-unity` idem. Aucun `dofus-fm`, `DofusFM`, `dofus-fm-client` public.
Ce n'est pas une preuve absolue d'absence (un dépôt privé n'apparaît pas), mais rien de public n'existe.

### Où sont les logs, alors ?
Le README est explicite et se retourne contre nous :
> « Le code est local. L'outil **ne stocke pas tes données de jeu**, ne parle pas à des serveurs tiers
> **sauf pour vérifier ta licence Discord**. »

→ Architecture : **client lourd local + serveur de licence centralisé**. Le « historique complet des
tentatives » de la feature *Statistiques détaillées* vit donc **sur le disque de chaque utilisateur**.
Les 12 000 exos sont un **cumul revendiqué par les deux devs**, probablement issu de leur propre usage +
retours Discord, pas d'une base agrégée.

### Schéma loggé : INCONNU — et c'est la question à poser en premier
Impossible à déterminer sans le binaire. **Le point critique de ta mission est exactement là** : si l'outil
ne logue que « exo réussi / nombre de runes consommées », ça ne vaut presque rien pour calibrer un modèle
de probabilité (pas de poids courant, pas de jet, pas de puits, pas de SN vs EC). S'il logue au niveau
tentative, ça vaut de l'or.
**Indice défavorable** : DofusFM est un bot **OCR + clics** (comme Inkybot), pas un bot réseau. Un bot OCR
voit *l'écran*, donc il peut lire les jets et le résultat affiché — mais il n'a aucune raison de stocker
le poids de l'objet ou le puits, qui ne sont pas affichés par l'interface Ankama.
→ **Probabilité que le schéma soit riche : moyenne-faible.** À vérifier avant d'investir.

### Actions concrètes
1. **Rejoindre https://discord.gg/GRV3hBcSr8** et poser LA question de qualification, pas la question de
   volume (message prêt en §8).
2. Ouvrir `https://web.dofus-fm.cloud/fr/guide` **depuis ton navigateur** (bloqué ici) : la page guide
   montre en général des captures de l'écran de statistiques → **tu liras le schéma sur la capture**,
   sans rien demander à personne. **À faire en premier, c'est gratuit et immédiat.**
3. ⚠️ Je **n'ai pas téléchargé** `DofusFM_Setup.exe` / `.pkg` : télécharger et déballer un binaire d'un
   éditeur inconnu n'est pas quelque chose que je fais sans ton feu vert. Si tu veux le faire toi-même,
   le `.pkg` macOS se déballe sans exécution (`xar -xf` puis `cpio`) et une app Electron/Python y expose
   sa base SQLite ou son schéma en clair. C'est la voie la plus sûre pour lire le schéma sans demander.

---

## §2 — TOUS LES AUTRES OUTILS QUI LOGGUENT

### Tableau de synthèse

| Outil | Logue ? | Où | Exposé ? | Valeur |
|---|---|---|---|---|
| **Kaz-ookid/auto-forgemagie** | ✅ par **paquets réseau** | mémoire (objet `Action`) | code public, données non | **5/5** |
| **Dofus Fashionista — Smithmagic Lab** | ✅ mode « Real Maging » | **localStorage navigateur** | non | 4/5 |
| **Dofzel** (`dofzel.fr/forgemagie`) | ✅ FM + coûts | **serveur, compte obligatoire** | non | 4/5 |
| **ForgeTracker** (`forgetracker.com/plays`) | ✅ probable (« plays ») | serveur ? | SPA, non lisible ici | 4/5 |
| **Inkybot** | ✅ « statistics session » + logs de scripts | client local | « Hall of Fame » seulement | 3/5 |
| **Pousset/dofusToolForgemagie** | ✅ **export CSV d'historique** | fichier local | schéma public, données non | 3/5 |
| **DofusFM** (Vicfou) | ✅ revendiqué | client local | non | 5/5 si riche |
| **ExoFast** (`exofast.dev`) | ? | ? | 403, non vérifiable | 2/5 |
| **DofForge** (`dofforge.com`) | ✅ « statistiques en temps réel » | ? | non | 2/5 |
| **Geneka** (`geneka.net/forgemagie`) | ❌ Monte-Carlo pur, 5 000 runs | — | non | 1/5 |
| **Dafous** (`dafous.app`) | ❌ guide + simulateur | — | non | 1/5 |
| **forgemage.net / Blitzkrieg** | ❌ **« Lecture seule »** explicite | — | non | 1/5 |
| **DofMod/SmithMagic** (ExiTeD) | ❌ affichage seul | — | code public | 1/5 |
| **Metamob** | ❌ hors sujet (chasse aux archis) | — | API publique | 0/5 |
| **DofusBook** | ❌ builds, pas de FM | — | — | 0/5 |

### 2.1 Dofus Fashionista — Smithmagic Lab — **la meilleure cible « communauté »**
- URL : https://dofusfashionista.gg/forgemagie/
- Deux modes. Le mode **« Real Maging »** : *« record your in-game results: the sink, the losses and the
  runes used are tracked automatically »*. **Le puits (sink) EST loggé.** C'est exactement le champ qui
  manque partout ailleurs.
- Stockage : *« The session is saved in your browser »* → **localStorage, rien côté serveur.**
- Le code étant du JS client, **le modèle de probabilité utilisé par le simulateur est lisible dans le
  bundle** — bonus non négligeable pour comparer à ton implémentation.
- Discords : https://discord.gg/a7b4a4dnVU · https://discord.gg/J842fFxU7r
- Dépôt lié : `Trameur/DofusFashionistaVanced` (Python, 27 ★) — c'est le revival du Fashionista original.
- **Valeur 4/5.** Grosse communauté anglophone + FR, outil gratuit, auteur identifiable, et les données
  existent déjà chez les utilisateurs sous forme structurée (sink + losses + runes).
- **Action** : demander sur leur Discord un export localStorage (`JSON.stringify(localStorage)`), et
  demander à l'auteur d'ajouter un bouton « Exporter ma session en CSV » — c'est 20 lignes de JS et ça
  transforme leur base d'utilisateurs en collecteurs.

### 2.2 Dofzel — https://www.dofzel.fr/forgemagie
- *« Encodez vos FM et leurs caractéristiques, suivez leurs coûts et leur rentabilité »*, dashboard,
  stats de craft personnalisables. **Compte obligatoire → base de données côté serveur.**
- C'est **le seul outil de la liste avec une base centralisée de sessions de FM réelles.**
- Granularité probable : **par objet FM, pas par tentative de rune** (orientation rentabilité). À confirmer.
- Contact : pas d'email affiché, mais **Ko-fi de l'auteur : https://ko-fi.com/kryzer** → canal direct.
- **Valeur 4/5** si la granularité est à la tentative, **2/5** si elle est à l'objet.
- **Action** : créer un compte, regarder le formulaire de saisie (il révèle le schéma), puis écrire à Kryzer.

### 2.3 ForgeTracker — https://forgetracker.com/plays
- « Outil pour joueurs Dofus », la route `/plays` suggère un **journal de parties/sessions**.
- SPA pure : WebFetch ne renvoie que le `<meta viewport>`, curl bloqué par l'egress. **Non qualifié.**
- **Valeur 4/5 potentielle, 0 preuve.** **Action** : l'ouvrir dans ton navigateur, onglet Réseau, repérer
  les appels XHR — s'il y a un `/api/plays`, tu as peut-être un feed public.

### 2.4 Inkybot — https://inkybot.me
- Bot FM OCR + Win32, commercial. Release notes v2 : *« Added reset statistics buttons »*, *« auto start a
  new statistics session upon successful exo mage »*, *« custom maging scripts — added logging »*.
  → **il y a bien des sessions de stats et des logs, côté client.**
- Une page **« Hall of Fame »** existe (« success stories ») — c'est le seul agrégat public, mais
  `inkybot.me` est bloqué par robots.txt ici, **non lu**.
- L'article technique Medium (https://medium.com/@inkybot.me/building-inkybot-...-212d4bb2611d) ne
  mentionne **aucun** stockage de données. Heuristique `TargetResolve` = « stat la plus éloignée de son max
  d'abord, car le taux de réussite y est supérieur » — utile pour ton modèle, pas pour tes données.
- **Valeur 3/5.** **Action** : lire la Hall of Fame dans ton navigateur (elle peut contenir
  « exo X en N runes » ×N entrées = un mini-dataset gratuit), puis demander sur leur Discord.

### 2.5 ExoFast / DofForge — bots concurrents
- `exofast.dev` → **403** pour WebFetch. `dofforge.com` → SPA, meta seulement, revendique
  « statistiques en temps réel ». Ni l'un ni l'autre n'expose quoi que ce soit.
- **Valeur 2/5.** Même logique que DofusFM : demander sur Discord.

### 2.6 Geneka / Dafous / Blitzkrieg — **écartés, ne logguent pas**
- **Geneka** (https://geneka.net/forgemagie) : Monte-Carlo **5 000 runs**, sorties P10/P50/P90. C'est un
  **simulateur qui consomme un modèle**, il n'en produit pas. Aucune source publiée. Compte utilisateur
  présent mais pour la sauvegarde de configs. **1/5** — utile seulement pour **comparer tes sorties aux
  siennes** (benchmark croisé).
- **Dafous** : guide + simulateur de craft. Les chiffres du guide (marge 290k–870k) sont **anecdotiques,
  issus des sessions perso de l'auteur**, non sourcés. Contact : https://dafous.app/contact.html. **1/5**.
- **forgemage.net / overlay Blitzkrieg** : dit noir sur blanc *« Lecture seule : aucune action n'est
  envoyée au jeu »*, calcule le coût d'une session, **ne conserve rien**. 200+ utilisateurs, 70+ forgemages.
  **1/5 en données**, mais **le Discord https://discord.gg/SyF9bmSK3f est une population de forgemages
  professionnels** — c'est le meilleur endroit où recruter des collecteurs.

### 2.7 ⭐ Kaz-ookid/auto-forgemagie — LE dépôt à connaître
- URL : https://github.com/Kaz-ookid/auto-forgemagie — *« Automatic Forgemagie counter and tools, using
  packet sniffing »*, Python. **Cloné, complet, fonctionnel dans sa logique.**
- **Copié en local** → `/home/claude/fm-research/sources/code/auto-forgemagie/`
- Ce qu'il fait, exactement (lu dans `Helper.py`) :
  - écoute les paquets, filtre sur `OPEN_WORKBENCH=3319`, `ITEM_PLACED=3145`, **`FUSION_RESULT=5388`** ;
  - à chaque `ITEM_PLACED`, si c'est une rune → mémorise `{effectId, value, name}` ; si c'est l'objet →
    reconstruit **toutes les stats de l'objet** (`effects[]`, avec les malus convertis en bonus × −1) ;
  - à chaque `FUSION_RESULT`, lit `craftResult` ∈ {IMPOSSIBLE 0, **FAILED 1, SUCCESS 2, NEUTRAL 3**,
    FORBIDDEN 4} et construit un objet
    **`Action(rune_used, outcome, residual_prefix ∈ {"+","-",""}, stats_delta)`** ;
  - **recalcule le puits (`residual`) analytiquement** via `calculate_residual()`, en gérant les trois cas
    (stat en positif, en négatif, à cheval sur 0 — la moitié du poids en négatif) et le cas « la rune n'a
    pas donné toute sa valeur ».
- **Pas de dataset publié**, et l'historique (`item.historical`) reste en mémoire — mais **c'est une base
  de collecte à 90 % écrite** : ajouter un `csv.writer` dans `craft_result()` suffit.
- **Valeur 5/5** — pas comme source de données, comme **machine à en fabriquer**.
- Fichiers de données récupérés au passage (voir §7) : `Characteristics.json` (poids par point, y compris
  « Arme de Chasse » = **5.0**, ce qui tranche la divergence −1 / +5 de `datasets.md` §3.1),
  `RunesClear.json` (GID → effectId/valeur), `Effects.json`, **`Items.json` (18 405 objets avec
  `possibleEffects[].diceNum/diceSide` = jets min/max)**.

### 2.8 Pousset/dofusToolForgemagie — **le schéma CSV tout prêt**
- URL : https://github.com/Pousset/dofusToolForgemagie — copié dans `sources/code/dofusToolForgemagie/`
- Pas de données, mais `src/services/csv_export.py` définit un en-tête d'historique directement réutilisable :
  ```
  attempt_number, rune_name, rune_stat_type, rune_value, rune_weight,
  result, reliquat_before, reliquat_after, lost_stat_type, lost_stat_value, duration_seconds
  ```
- **Manque par rapport à ce dont ton simulateur a besoin** : poids courant / min / max de l'objet, jet
  courant / min / max de la ligne visée, nombre de lignes. À compléter avec le schéma d'`Issiraaa#5196`
  (`datasets.md` §6) et §3 ci-dessous.
- **Valeur 3/5** (gain de temps sur la spec, zéro donnée).

### 2.9 Autres dépôts balayés (aucune donnée)
`zoezenKebab/gdFM` (simulateur Godot, a un « historique » d'affichage) · `Slycex13/FMSimulator` ·
`LittleTatsumi/fm-bot` (un seul `bot.py`) · `Firzus/forgemagie-tool` · `Tenmalexis/forgemagie-optimizer` ·
`Yamashi284/forgemagie-calculateur` · `Androlax2/DofusReliquat` · `MaugrimEP/DofusAutoforgemagie` ·
`frochelle/Forgemagie` · `Gguignard/dofus-management` · `EISAWESOME/magipack` · `Yazdingue/Forgemagie-Dofus-3-`.
**Correctif à `datasets.md` §8** : `hoboris/EasyFM` **existe toujours** mais `git clone` demande une
authentification → dépôt **passé en privé** (ce n'est pas un 404). Impossible à récupérer sans son accord.
`DofMod/SmithMagic` (module d'ExiTeD) est **vivant et cloné** : affichage du poids, du puits, des jets
disparus — **aucune probabilité, aucun log**. Confirme que forgemagie.net n'a jamais publié de modèle.

---

## §3 — ⭐ LE SCHÉMA DE VÉRITÉ TERRAIN (protocole Dofus) — la vraie découverte

Source : `bot4dofus/Datafus` (dépôt cloné, 601 Mo, décompilation de `DofusInvoker`).
Fichiers copiés dans `/home/claude/fm-research/data/collectees/protocole-dofus/`.

À **chaque** passage de rune, le serveur envoie au client :

```
ExchangeCraftResultMagicWithObjectDescMessage (protocolId 95)
 ├── craftResult : uint          ← CraftResultEnum
 │      0 CRAFT_IMPOSSIBLE | 1 CRAFT_FAILED (EC) | 2 CRAFT_SUCCESS (SC)
 │      3 CRAFT_NEUTRAL (SN)    | 4 CRAFT_FORBIDDEN
 ├── objectInfo : ObjectItemNotInContainer   ← l'objet COMPLET après la tentative
 │      (objectGID, objectUID, effects[] = toutes les lignes et leurs valeurs)
 └── magicPoolStatus : int       ← variation du PUITS sur cette tentative
        2 → puits GAGNÉ   (le client affiche "+" residual magic)
        3 → puits CONSOMMÉ (le client affiche "-")
        autre → inchangé
```
(vérifié dans `CraftFrame.as` lignes 680–686 : `magicPoolStatus == 2` → `"+"`, `== 3` → `"-"`.)

**Pourquoi c'est décisif :**
- Le **label est donné par le serveur**, pas déduit d'un OCR : `craftResult` distingue nativement
  **SC / SN / EC**, ce qu'aucun relevé manuel de `datasets.md` ne fait proprement.
- `objectInfo.effects[]` **avant** (paquet précédent) et **après** donne le `stats_delta` exact → on
  reconstruit le poids courant de l'objet à chaque tentative, sans hypothèse.
- `magicPoolStatus` donne le **signe** de la variation du puits, et `calculate_residual()` de
  `auto-forgemagie` (§2.7) en donne la **valeur**.
- Combiné à `Items.json` (`diceNum`/`diceSide` = jets min/max de chaque ligne, 18 405 objets), on obtient
  **exactement les 9 features du schéma d'Issiraaa** (`datasets.md` §6) : poids min / max / courant de
  l'objet, poids de la rune, jet min / courant / max de la ligne — plus le puits et le label SC/SN/EC.

⚠️ **Datafus est marqué DEPRECATED** (Dofus 3 = Unity, structure différente). Les protocolIds ci-dessus
sont ceux de Dofus 2. Les équivalents Dofus 3 : **`dofusdude/doduda`** et
**`Dofus-Batteries-Included/DDC`** + **`Dofus-Batteries-Included/DBI.Plugins`** (framework de plugins
Dofus 3 Unity — c'est là qu'un logger FM Dofus 3 devrait être écrit ; aucun plugin FM n'existe encore).

**Valeur pour le simulateur : 5/5.** C'est la seule voie qui produit des données **propres, labellisées,
au volume voulu, sans dépendre de la bonne volonté d'un tiers.**

---

## §4 — SERVEURS PRIVÉS / ÉMULATEURS

⚠️ **Avertissement à conserver** : un émulateur **réimplémente** la forgemagie. Ses logs reflètent
**l'algorithme du développeur de l'émulateur**, pas celui d'Ankama. **Ne jamais calibrer un modèle
dessus.** Utilité réelle : **valider une implémentation** (tests de non-régression, cas limites) et
comparer des choix de modélisation.

- **Aucun dump de base de serveur privé contenant un historique de forgemagie n'a été trouvé.** Les
  émulateurs publics ne logguent pas les actions de craft en table (ils logguent les connexions et les
  échanges de kamas). Recherche menée sur : `Arakne/Araknemu` (cloné, 21 Mo : **une seule occurrence de
  « forgemagie », dans un fichier de test** → la FM n'est pas implémentée), `Emudofus/Shivas`,
  `Romain-P/Jumbo`, `Romain-P/Ancestra-Evolutive`, `nicopetit95/sundofus`, `BotanAtomic/GDCore`,
  `hussein-aitlahcen/codebreak`, `Chnossos/Naia`, `CaquevelleLudovic/DofusProject` (`dofus.sql`).
- Ces émulateurs sont **tous en 1.29** → forgemagie **Rétro**, mécaniques différentes de Dofus 3
  (cf. poids Vi 0,2 / Ini 0,1 en Rétro, `datasets.md` §3.3). Double décalage.
- **Valeur : 1/5.** Ne pas y investir de temps. Ton `sources/code/03_AncestraEvolutive_1.29` et
  `05_StarLoco_1.39` couvrent déjà ce besoin.

---

## §5 — DÉPÔTS DE DATASETS : HUGGING FACE, KAGGLE, ZENODO, OSF, DATA.WORLD, GITHUB TOPICS

| Plateforme | Requêtes | Résultat |
|---|---|---|
| **Hugging Face** | `search hf://datasets dofus`, `forgemagie`, `ankama`, `crafting rng mmorpg` | **0 dataset.** Modèles : `anaelb90/dofus`, `edereure/dofus` (vides, 0 dl). Spaces : `Kwarth/dofus-ocre-tracker`, `astariul/dofus-retro-maps-key-cracker`, `Medimou/lumberjack-dofus-bot` — **aucun lien FM**. |
| **Kaggle** | dofus / forgemagie / crafting | Seulement **`pstmrtem/dofus-dabase`** (base d'objets, pas de tentatives) et le notebook `matthieudelmont/analyse-des-quipements-de-dofus` (analyse d'équipements). **Rien sur la FM.** |
| **Zenodo / OSF / figshare / data.world** | dofus, forgemagie, MMORPG crafting/enchanting RNG | **0 résultat pertinent.** Aucune publication académique n'a pris Dofus comme terrain. |
| **GitHub topics** | `forgemagie` (2 dépôts : `EISAWESOME/magipack`, `lilgallon/dofus-tools`), `dofus-unity` (5), `dofus-bot`, `dofus` | **Aucun dépôt de données.** Que des outils. |

**Valeur : 0/5.** Cette piste est close ; inutile d'y revenir.

---

## §6 — PROJETS DE MACHINE LEARNING SUR LA FM

1. **Forum officiel, `Issiraaa#5196`, 02/06/2020** — https://www.dofus.com/fr/forum/1003-divers/2333498-forgemagie-machine-learning
   Déjà documenté (`datasets.md` §6). **Jamais abouti.** Sa liste de features reste la meilleure spec de
   collecte existante — à croiser avec §3.
2. **jeuxvideo.com, `Foxyorki20`, 13/03/2022** — https://www.jeuxvideo.com/forums/42-51-69210521-1-0-1-0-machime-learning-sur-la-forgemagie-de-dofus.htm
   **NOUVEAU (pas dans `datasets.md`).** Étudiant cherchant un sujet de projet ML. **Jamais commencé**
   (« clairement en plus j'ai 0 runes dans le jeu »). Serveur Temporis envisagé pour des runes pas chères.
   ★ **Le seul apport exploitable** : un intervenant, `PirateDter`, **a proposé un script Python de
   déchiffrement des paquets réseau d'une session de forgemagie** — c'est-à-dire, indépendamment,
   exactement la méthode du §3. Le script n'a pas été publié dans le fil.
   Le consensus du fil (« problème purement algorithmique, pas un problème de ML ») est d'ailleurs
   pertinent pour toi : **tu cherches à estimer les paramètres d'une loi connue, pas à apprendre une
   fonction inconnue.** Quelques milliers de tentatives bien choisies suffisent ; il n'en faut pas 30 000.
3. **Aucun mémoire, article, blog « j'ai analysé N tentatives » n'existe** au-delà de ce qui est déjà
   dans `datasets.md` (les 10 000 tentatives filmées de Fek, et le PDF théorique de Karias).
4. `Papycha` (https://papycha.fr/taux-de-brisage/) reste **le seul à avoir validé un modèle contre un
   échantillon réel** (« faux 34 fois sur 200 tentatives ») — mais c'est du **brisage**, et l'échantillon
   n'est pas publié. **Action à faible coût : lui demander son échantillon de 200 tentatives.**

**Valeur globale de la piste ML : 1/5** en données, **4/5** en spec de collecte.

---

## §7 — DONNÉES RÉELLEMENT TÉLÉCHARGÉES

Dans `/home/claude/fm-research/data/collectees/` :

| Fichier | Taille | Contenu | Source |
|---|---|---|---|
| `auto-forgemagie-res/Items.json` | **59 Mo** | **18 405 objets** avec `possibleEffects[]` → `diceNum`/`diceSide` = **jets min/max de chaque ligne** | `Kaz-ookid/auto-forgemagie` |
| `auto-forgemagie-res/Characteristics.json` | 5,5 ko | **Poids par point** de chaque caractéristique (Agilité 1.0, Critique 10.0, Dommage 20.0, Dommage Armes 15.0, **Arme de Chasse 5.0**…) | idem |
| `auto-forgemagie-res/RunesClear.json` | 16 ko | Table **GID de rune → `effectId`, valeur, nom** (Rune Fo → effect 118 val 1, etc.) | idem |
| `auto-forgemagie-res/RunesBrute.json` | 15 ko | Version brute | idem |
| `auto-forgemagie-res/Effects.json` | 11 ko | `actionId` → nom de caractéristique + **coefficient** (gestion bonus/malus) | idem |
| `auto-forgemagie-res/ItemTypes.json` | 74 ko | Types d'objets | idem |
| `protocole-dofus/*.as` | 12 ko | Définitions **exactes** des paquets `ExchangeCraftResult*` + `CraftResultEnum` | `bot4dofus/Datafus` |
| `protocole-dofus/auto-forgemagie_Helper.py` | 10 ko | Décodage des paquets + **calcul du puits** | `Kaz-ookid/auto-forgemagie` |
| `protocole-dofus/schema_csv_dofusToolForgemagie.py` | 1,4 ko | Schéma CSV d'historique de tentatives | `Pousset/dofusToolForgemagie` |

Code source complet copié dans `/home/claude/fm-research/sources/code/` :
`auto-forgemagie/` et `dofusToolForgemagie/`.

⚠️ Ces données sont **Dofus 2**. Pour Dofus 3, régénérer avec `dofusdude/doduda` ou
`Dofus-Batteries-Included/DDC`. Elles restent valables pour les poids (inchangés) et comme référence
de structure.

**Toujours zéro ligne de tentative réelle téléchargée.** Aucune n'est publique. C'est le constat central.

---

## §8 — CLASSEMENT : LES 5 MEILLEURES PISTES PAR RETOUR SUR EFFORT

### 🥇 1. Écrire ton propre logger réseau — **effort moyen, rendement illimité, 5/5**
La seule piste qui ne dépend de personne et qui produit **des données propres et labellisées par le
serveur du jeu lui-même**. Tu génères 1 000 tentatives par soirée de FM normale, et surtout tu contrôles
le schéma.
**Action** :
```bash
git clone https://github.com/Kaz-ookid/auto-forgemagie   # déjà dans sources/code/auto-forgemagie/
```
Partir de `Helper.py::craft_result()`, y brancher un `csv.writer`, et logger par tentative :
`ts, item_gid, item_uid, poids_min, poids_max, poids_courant, nb_lignes, rune_gid, rune_poids,
stat_ciblee, jet_min, jet_courant, jet_max, puits_avant, craft_result(1/2/3), magic_pool_status(2/3),
stats_delta_json, puits_apres`.
Pour Dofus 3 : refaire la même chose comme plugin **`Dofus-Batteries-Included/DBI.Plugins`**
(aucun plugin FM n'existe → utile à toute la communauté, et c'est ton meilleur ticket d'entrée pour
demander leurs données aux autres ensuite).

### 🥈 2. Le guide DofusFM + son Discord — **effort quasi nul, 5/5 si le schéma est riche**
**Deux actions, dans cet ordre :**
1. Ouvrir **https://web.dofus-fm.cloud/fr/guide** dans ton navigateur (bloqué depuis ici) et regarder les
   **captures de l'écran « Statistiques détaillées »**. Elles répondent gratuitement à la question
   « le schéma vaut-il de l'or ou rien ? ».
2. Sur **https://discord.gg/GRV3hBcSr8**, poser la question de **qualification**, pas de volume :
   > « Salut ! Je construis un simulateur de FM open source (calcul de proba SC/SN/EC, puits, over).
   > Votre outil logue l'historique complet des tentatives — est-ce que vous stockez, par tentative,
   > le poids courant de l'objet, le poids de la rune, le jet de la ligne visée et le résultat
   > SC/SN/EC séparément (pas juste réussi/raté) ? Si oui, est-ce exportable en CSV ?
   > Je cherche à calibrer un modèle, et je publierais évidemment les résultats + le code.
   > Je peux aussi vous fournir en retour la courbe de proba calibrée, ça améliorerait votre IA de
   > choix de rune. »
   L'échange gagnant-gagnant (leur donner le modèle contre leurs logs) est l'angle qui fonctionne avec
   des devs de bot.

### 🥉 3. Dofus Fashionista — Smithmagic Lab — **effort faible, 4/5**
Le seul outil grand public qui logue explicitement **le puits**, avec une grosse communauté.
**Action** : sur https://discord.gg/a7b4a4dnVU, demander (a) que des joueurs collent leur
`JSON.stringify(localStorage)` après une session, (b) à l'auteur d'ajouter un export CSV. Un post bien
tourné dans un serveur de 1 000 personnes peut ramener plusieurs milliers de tentatives en une semaine.
Bonus : lire son bundle JS pour comparer son modèle de proba au tien.

### 4. Dofzel + ForgeTracker — **effort faible, 4/5 potentiel, à qualifier d'abord**
Les deux seuls trackers à **base centralisée**. Un seul « oui » = un dataset multi-utilisateurs d'un coup.
**Action** : créer un compte sur https://www.dofzel.fr/forgemagie (le formulaire de saisie révèle le
schéma), ouvrir https://forgetracker.com/plays avec l'onglet Réseau pour repérer un éventuel `/api/plays`,
puis écrire à l'auteur de Dofzel via https://ko-fi.com/kryzer.

### 5. Le Discord forgemage.net — **effort faible, 3/5**
Pas de données stockées, mais **la plus forte concentration de forgemages professionnels** (70+ forgemages,
200+ utilisateurs) : c'est la population qui fait le plus de tentatives par jour.
**Action** : sur https://discord.gg/SyF9bmSK3f, proposer un **modèle de collecte** — soit ton logger réseau
(§1) packagé en .exe simple, soit un Google Sheet à colonnes fixes reprenant le schéma du §3. Proposer une
contrepartie concrète : accès au simulateur calibré, ou un calculateur de rentabilité par item.
À faire **après** avoir un outil de collecte prêt, sinon la demande tombe à plat (c'est exactement ce qui a
tué le projet d'`Issiraaa` en 2020 : il demandait de remplir un Excel à la main).

---

### Ce qu'il ne faut PAS faire
- Chercher encore sur HF / Kaggle / Zenodo / OSF / data.world : **close, 0 résultat**, §5.
- Chercher un dump de serveur privé : **inexistant**, et les données seraient de toute façon celles d'un
  émulateur 1.29, pas d'Ankama, §4.
- Attendre 30 000 lignes avant de commencer. Pour **estimer les paramètres d'une loi connue**, quelques
  milliers de tentatives bien réparties (plusieurs poids d'objet, plusieurs poids de rune, avec et sans
  puits) valent mieux que 30 000 tentatives toutes identiques.
