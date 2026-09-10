# Extraction d'un dataset de forgemagie depuis des VOD — étude de faisabilité

Date : 2026-09-10. Recherche menée sans navigateur (WebSearch/WebFetch + clone git).

---

## VERDICT EN UNE LIGNE

**Techniquement viable — l'interface FM montre assez — mais ce n'est PAS le meilleur
gisement.** Deux sources battent la VOD d'un facteur 10 en coût et en qualité :
(a) le paquet réseau `ExchangeCraftResultEvent` de Dofus 3, qui contient *littéralement*
une ligne de dataset parfaite ; (b) les historiques déjà accumulés par les bots FM
communautaires (ExoFast, Dofus FM). Fais la VOD seulement si (a) et (b) échouent.

Et un piège qui tue le projet s'il est ignoré : **les vidéos « BEST-OF FORGEMAGIE »
sont sélectionnées sur le résultat.** Les inclure biaise l'estimation de façon
irrécupérable. Seuls les lives intégraux non montés sont exploitables.

---

## 1. Ce que la recherche a établi sur l'interface FM (point décisif)

Source faisant autorité : le devblog Ankama de la refonte 2.29, plus le devblog
« Amélioration des interfaces Forgemagie » (2.58) et les guides communautaires.

Affiché à l'écran, en continu, dans l'atelier :

| Élément | Affiché ? | Source |
|---|---|---|
| Valeur actuelle de chaque effet de l'item | **Oui** | devblog 2.29 |
| Min / max théorique de chaque effet | **Oui** — « minimum and maximum values provide better visibility on forgemagie advancement and theoretical limits » | devblog 2.29 |
| Delta appliqué par la tentative | **Oui**, dans une colonne dédiée ; effets touchés surlignés | devblog 2.29 |
| **Panneau d'historique des tentatives** | **Oui** — dans l'interface elle-même (plus dans le chat), **19 lignes visibles**, **persiste toute la session** même en rouvrant l'atelier ailleurs, jusqu'à déconnexion | devblog 2.29 |
| Résultat codé par couleur dans l'historique | **Oui** — succès neutre en jaune, succès exo en bleu | devblog 2.58 |
| Rune posée dans l'historique | **Oui, mais en icône** (plus en texte) depuis 2.58 | devblog 2.58 |
| Poids de la rune | **Oui**, dans l'infobulle de la rune | devblog 2.58 |
| Sur-max (overmax) | **Oui**, vert plus clair ; effet tombé à 0 grisé | devblog 2.58 |
| **Reliquat / puits** | **Contesté — à vérifier toi-même en 30 s en jeu** | voir ci-dessous |
| Pourcentage de réussite | **Non.** Aucune source ne le mentionne | — |

### Le point litigieux : le reliquat

- Devblog **2.29** : explicitement **non affiché**, choix de design assumé — « we decided
  not to display these two pieces of information to preserve […] expertise accumulated
  by players who master the system ».
- Guide **huzounet.fr** (récent) : « L'interface affiche désormais le reliquat
  directement ; le calcul manuel est obsolète. »
- Guide **dafous.app** (2026) : toujours caché, il faut « lire le canal combat pour
  savoir combien de puits il reste ».
- Un fil de forum récent s'intitule « Affichage du reliquat dans la nouvelle interface
  de forgemagie » (dofus.com, thread 2413497) — inaccessible (robots.txt).

**Ça a probablement changé avec l'interface Unity. Vérifie en jeu, c'est 30 secondes,
et ça conditionne la difficulté du pipeline.**

**Bonne nouvelle dans tous les cas : le reliquat est *dérivable*, pas besoin qu'il soit
affiché.** C'est de l'arithmétique pure, pas du hasard :

```
reliquat += densité_des_stats_perdues − densité_de_la_rune_posée
```

(confirmé par huzounet et par l'existence de gallon.dev/dofus-tools/forgemagie, un outil
qui ne fait *que* ce calcul). Donc si tu observes une séquence **complète depuis un item
vierge**, tu reconstruis le reliquat exactement. Si la VOD démarre en cours d'item, le
reliquat initial est une inconnue latente → **jette ce segment**, ne l'estime pas.

### Verdict point 2 : l'interface montre-t-elle assez pour une ligne de dataset ?

**Oui.** `(jets avant, rune, résultat, delta)` est intégralement à l'écran. Le panneau
d'historique 19 lignes persistant est même un cadeau : il transforme le problème d'un
échantillonnage image-par-image en un problème de lecture périodique.

---

## 2. Le journal de chat — verdict : impasse (point 3)

- L'historique FM a été **déplacé du chat vers l'interface** en 2.29. Le chat n'est donc
  même plus la bonne cible.
- Aucune option native « enregistrer les conversations dans un fichier » dans Dofus 2/3.
  Les fils de forum sur le sujet sont des demandes de fonctionnalité restées sans suite.
- Les logs présents sur disque sont des logs **techniques**, pas du gameplay :
  - Dofus 2 : `%AppData%\Dofus 2\logs` → `.log` (texte) et `.d2l` (encodé)
  - Dofus 3 : `application.log`, accessible via Paramètres du jeu > répertoire du jeu >
    « ouvrir le dossier des logs » (support Ankama art. 203790076)
  - Contenu documenté : erreurs client, infos PC/compte/carte. **Rien sur la forgemagie.**
- Aucun outil communautaire de parsing de logs de chat Dofus trouvé.

**Conclusion : l'idée du log de chat, qui aurait été la plus propre, ne marche pas.**

---

## 3. La vraie meilleure source : le protocole Dofus 3 (trouvaille majeure)

Les descripteurs protobuf de Dofus 3 (Unity) sont **publics** :
`https://github.com/LuaxY/dofus-unity-protocol-builder` (cloné et inspecté).

Dans `Com.Ankama.Dofus.Server.Game.Protocol.Exchange`, le message
`ExchangeCraftResultEvent` :

```
ExchangeCraftResultEvent
  result : enum CraftResult { IMPOSSIBLE, FAILED, SUCCESS, NEUTRAL, FORBIDDEN }
  object : ExchangeCraftResultWithObjectDescription
      object            : common.ObjectItem
                            uid, quantity, gid,
                            effects[] : ObjectEffect { action, value_int,
                                                       min_max{min,max}, dice, ... }
      magic_pool_status : enum { NO_CHANGE, INCREASE, LOSS }   ← le puits !
      fm_power          : int32
```

Autrement dit **le serveur t'envoie, à chaque tentative** : le résultat exact
(SUCCESS / NEUTRAL / FAILED = SC / SN / EC), **l'item complet avec tous ses effets et
leurs min/max**, la direction de variation du puits, et une puissance FM. C'est
exactement une ligne de dataset, sans OCR, sans erreur de lecture.

Sniffers Dofus 3 existants : `AlpaGit/bubble-sniffer-zig`, `Scheduler2000/Dofus`,
`RuinedYourLife/dofus-deobfs`, `AstrubTools/dofus-protocol`.

⚠️ Sniffer le client est contraire aux CGU d'Ankama et te fait risquer le compte. Et ça
ne résout pas le problème économique : il faut quand même *payer* les runes. À toi de
juger. Je le signale parce que c'est la vérité technique, pas parce que je le recommande.

---

## 4. La source la moins chère de toutes (recommandation n°1)

Des bots de FM tiennent déjà un **historique complet des tentatives**, sur des milliers
de sessions et des centaines d'utilisateurs :

- **ExoFast** — `https://doc.exofast.dev` — page « Statistiques » : nombre de runes,
  nombre de réussites, taux de réussite, kamas dépensés. Supporte Dofus 3 / Retro / Touch.
- **Dofus FM (Vicfou-dev)** — `https://github.com/Vicfou-dev/dofus-fm-server` — annonce
  un « historique complet des tentatives » et des stats par session. Lit l'écran
  (« simule des clics souris réels et lit l'écran »). Dépôt public = README seulement.
- **Inkybot** — `https://medium.com/@inkybot.me/building-inkybot-a-dofus-maging-bot-with-ocr-win32-api-and-a-rule-based-ai-212d4bb2611d`

**Un message poli à ces auteurs demandant un dump anonymisé coûte 10 minutes et peut
rapporter 100× ce qu'une VOD te donnera.** Ils ont déjà résolu l'OCR, et ils ont le
volume. C'est de loin le meilleur rapport effort/données du projet. Commence par là.

---

## 5. VOD candidates

⚠️ **Limite honnête de cette recherche** : depuis cet environnement, `youtube.com` est
bloqué au niveau du proxy (403 sur CONNECT) pour `curl` **et** pour `yt-dlp`, et les
pages `watch` renvoient 429 via WebFetch. J'ai pu confirmer titre et chaîne via l'API
oEmbed, **mais pas les durées**. Les durées sont à récupérer chez toi (commandes fournies
au §7). Les chaînes ci-dessous sont les bonnes pistes ; la liste n'est pas exhaustive.

### Le filon principal : Gryfox

De loin le créateur le plus associé à la FM en français.

| Titre (confirmé via oEmbed) | URL | Type |
|---|---|---|
| LIVE FORGEMAGIE - Gryfox [DOFUS] | `youtube.com/watch?v=7hJZUfUkviQ` | **Live intégral — cible prioritaire** |
| Forgemagie : nouvelle version, nouvelle interface ! - KIDIBONNET OVER VITALITÉ | `youtube.com/watch?v=3sQojz5NN2E` | Session, interface récente |
| FIN de la FORGEMAGIE sur DOFUS 2 | `youtube.com/watch?v=XJvcXo1g5to` | Session |
| DÉBAT FORGEMAGIE : POWERRATE, VARIANCE, CHOIX DES RUNES | `youtube.com/watch?v=Ch1ny68Cgqg` | Discussion — utile pour le modèle, pas pour les données |

Chaîne : `youtube.com/channel/UC8pjsWskCi56zDIEv225b7w` · `youtube.com/c/Gryfox/videos`
Twitch : `twitch.tv/gryfoxgaming`

🚫 **À EXCLURE absolument** — sélectionnés sur le résultat :
`AoE1cmDAqMY`, `chpRZPPq5fQ`, `0rkqyNppOMA`, `b5jBHWclPpw`, `uyjBX-lWsHM`
(tous des « BEST-OF FORGEMAGIE » / « plus belles réalisations » / « réactions exos »).

### Autres pistes

| Source | URL | Note |
|---|---|---|
| Playlist « FORGEMAGIE \| DOFUS » (Elito) | `youtube.com/playlist?list=PL-lvDBELoTErNHYjvGluBSSZcjAnCZeOS` | Playlist entière à énumérer |
| Huz REPLAY | `youtube.com/@HuzREPLAY` | Chaîne de *replays* de live → format long, bon candidat |
| VOD Twitch « Dofus 3 - PVP LVL 200 - FORGEMAGIE NOUVEAU STUFF » | `twitch.tv/videos/2360413212` | Interface Dofus 3 |
| VOD Twitch « DUEL FORGEMAGIE » (série) | `twitch.tv/videos/2199362942`, `.../2198417616`, `.../2197579895` | Duels FM = densité élevée |
| Répertoire Twitch Dofus | `twitch.tv/directory/game/Dofus/videos/all` | À surveiller en direct |
| Naiko_Dofus | `twitch.tv/naiko_dofus` | Chaîne Dofus active |

⚠️ **Les VOD Twitch expirent** (7 / 14 / 60 jours selon le statut de la chaîne). Les IDs
ci-dessus datent de 2024-2025 et sont probablement **déjà morts**. Sur Twitch il faut
capturer au fil de l'eau ou se rabattre sur les Highlights (qui sont, eux, montés → même
biais de sélection que les best-of). **YouTube est la seule source durable.**

---

## 6. Le pipeline, s'il faut le faire

L'insight qui rend la chose abordable : **ne cherche pas à capter l'instant de la
tentative.** Le panneau d'historique garde 19 lignes et persiste toute la session. Il
suffit de l'échantillonner périodiquement et de recoller les fenêtres.

À 25 runes/min, 19 lignes se remplissent en ~45 s → **1 frame toutes les 10-15 s suffit**,
avec un large recouvrement. Une VOD de 3 h = **~1 100 frames à analyser**, pas 650 000.
C'est la différence entre un week-end et un trimestre.

```
1. yt-dlp -f "bv*[height>=1080]" → mp4          (1080p minimum ; 1440p si dispo)
2. ffmpeg -vf fps=1/12 → PNG                     (~1 100 frames pour 3 h)
3. Calibration MANUELLE par VOD                  ← le vrai coût, non réutilisable
      repérage des ROI : panneau historique, panneau des effets, colonne delta
      dépend de la résolution, de l'échelle UI, et de l'overlay du streamer
4. Détection "interface FM ouverte ?"            (template matching sur le cadre)
5. Panneau historique :
      - rune  → template matching sur icônes (~60 icônes, PAS d'OCR)
      - résultat → classification par couleur (jaune=SN, bleu=exo, etc.)
6. Panneau des effets :
      - valeurs / min / max → PAS Tesseract.
        La police de l'UI Dofus est fixe → template matching de chiffres, ~100 %.
        Sinon PaddleOCR. (Inkybot rapporte avec Tesseract : « a "3" easily becomes
        an "8", a "1" disappears entirely ».)
7. Déduplication + recollage des fenêtres d'historique  (LCS sur les séquences)
8. Machine à états : détection des ruptures de session
      (changement d'item, alt-tab, alerte/overlay, scène OBS, coupure)
      → tout segment ambigu est JETÉ, jamais interpolé
9. Rejeu avant : à partir d'un état d'item observé + la séquence de runes,
      recalcul du reliquat et des jets à chaque pas
10. Validation humaine sur un échantillon de 5 % → mesure du taux d'erreur réel
```

---

## 7. Commandes pour énumérer les durées (à lancer chez toi)

```bash
pip install yt-dlp

# Toutes les vidéos d'une chaîne, avec durée, triées — sans rien télécharger
yt-dlp --flat-playlist --dump-json "https://www.youtube.com/c/Gryfox/videos" \
  | jq -r '[.duration, .title, .id] | @tsv' | sort -rn | head -50

# Ne garder que les vidéos de plus d'une heure
yt-dlp --flat-playlist --dump-json "https://www.youtube.com/@HuzREPLAY/videos" \
  | jq -r 'select(.duration > 3600) | [.duration, .title, .id] | @tsv' | sort -rn

# Idem sur la playlist FM d'Elito
yt-dlp --flat-playlist --dump-json \
  "https://www.youtube.com/playlist?list=PL-lvDBELoTErNHYjvGluBSSZcjAnCZeOS" \
  | jq -r '[.duration, .title, .id] | @tsv' | sort -rn

# Récupérer la meilleure qualité disponible (la lisibilité de l'UI en dépend)
yt-dlp -F "https://www.youtube.com/watch?v=7hJZUfUkviQ"
```

---

## 8. Estimation de l'effort pour 3 000 tentatives

**Rendement.** Un live FM intégral passe en spam actif ~50-60 % du temps (le reste :
banque, changement d'item, discussion, pauses). À 20-30 runes/min en phase active :

- 3 h de live dense → **1 000 à 2 500 tentatives exploitables**
- Objectif 3 000 → **4 à 8 h de VOD réellement dense**, soit ~10-15 h de stream brut
  à ratisser pour en isoler 6 bonnes heures

Le volume de vidéo n'est donc **pas** le facteur limitant. L'ingénierie l'est.

| Poste | Coût |
|---|---|
| Sélection + téléchargement des VOD | 3-5 h |
| Constitution des templates d'icônes de runes (~60) | 4-6 h |
| Template matching des chiffres de la police Dofus | 6-10 h |
| Calibration ROI, **par VOD/streamer/résolution** | **2-4 h × chaque source** ← le tueur |
| Machine à états + recollage d'historique | 10-15 h |
| Rejeu du reliquat + validation | 6-8 h |
| Validation humaine sur 5 % (150 lignes) | 4-6 h |
| **Total pour la première source** | **35-55 h** |
| Chaque source supplémentaire | +5-10 h (la calibration ne se réutilise pas) |

**Taux d'erreur attendus** (avec template matching, pas Tesseract) :
icône de rune ~1-2 % · couleur de résultat ~0,5 % (sauf color grading ou overlay agressif)
· chiffres ~1-3 % · **erreurs de recollage/continuité : 5-15 %, c'est la source dominante
et la plus insidieuse** car elle produit des lignes plausibles mais fausses.
Compte **10-20 % de segments jetés**, et vise un dataset final propre plutôt que gros.

---

## 9. Les limites scientifiques (plus graves que les limites techniques)

Ce dataset, même parfaitement extrait, sera **biaisé** :

1. **Biais de sélection sur le contenu.** Les best-of / highlights sont conditionnés sur
   le résultat. Tout mélange avec du live intégral corrompt l'estimation. Non négociable.
2. **Biais de population.** Quelques streamers = métier 200, items haut niveau, bonus
   maximisés. Aucune couverture des bas niveaux de métier ni des items bon marché.
3. **Biais de stratégie.** Les streamers font des runs « exo » (événements à ~1 %) et des
   poussées en sur-max. La queue de distribution est massivement sur-représentée par
   rapport à une FM ordinaire.
4. **Biais de version.** Les mécaniques ont bougé (2.29, 2.49, 2.58, passage à Dofus 3).
   Il **faut** dater chaque VOD et ne jamais mélanger les versions.
5. **Reliquat inconnu en début de segment** → seuls les items suivis depuis l'état vierge
   donnent un état latent fiable.

**Ce que la donnée peut réellement servir :** valider/calibrer un modèle dont tu poses la
forme a priori. Elle ne suffira pas à *découvrir* la loi sans hypothèse structurelle.

Note utile : aucune source publique ne documente la formule de taux de réussite de la FM
Dofus. Les guides restent qualitatifs (« plus l'item est lourd, plus les runes ont du mal
à passer », saturation vers le max, seuils selon la densité de rune) et les outils
existants (gallon.dev, xixou.io, forgemage.net, ForgeMagix) ne calculent que le **puits**,
qui est déterministe. **Ton besoin de données est donc réel** — le trou est bien là où
tu le penses.

---

## 10. Ordre d'attaque recommandé

1. **Vérifie en jeu, en 30 secondes, si le reliquat est affiché** dans l'interface
   Dofus 3. Ça change tout le reste.
2. **Écris aux auteurs d'ExoFast et de Dofus FM** pour un dump anonymisé d'historiques.
   10 minutes d'effort, potentiellement des dizaines de milliers de lignes. Fais-le
   aujourd'hui, la réponse arrivera pendant que tu travailles sur le reste.
3. **Pose d'abord la forme du modèle** à partir des guides (poids de rune, niveau d'item,
   sur-max, reliquat). Tu as peut-être besoin de 300 points de validation, pas de 3 000
   points d'apprentissage.
4. **Instrumente tes propres sessions** — même 200 tentatives proprement enregistrées,
   avec l'état complet et sans biais de sélection, valent mieux que 3 000 lignes
   d'OCR bruitées et biaisées issues de best-of.
5. **La VOD en dernier recours**, et alors : uniquement des lives intégraux, une seule
   version du jeu, échantillonnage du panneau d'historique à 1 frame/12 s.

---

## Sources

Protocole : github.com/LuaxY/dofus-unity-protocol-builder · github.com/AlpaGit/bubble-sniffer-zig ·
github.com/Scheduler2000/Dofus · github.com/RuinedYourLife/dofus-deobfs · github.com/AstrubTools/dofus-protocol
Interface : dofus.com devblog 435452 (2.58) · dofus.jeuxonline.info/actualite/48173 (2.29) ·
gamosaurus.com (2.58)
Mécaniques : huzounet.fr/guides/forgemagie · dafous.app/guides/poids-runes-fm.html ·
tofus.fr/fiches/forgemagie · wiki-dofus.eu/w/Forgemagie · gallon.dev/dofus-tools/forgemagie ·
xixou.io/forgemagie
Bots / OCR : doc.exofast.dev · github.com/Vicfou-dev/dofus-fm-server · Inkybot (Medium) ·
github.com/WildPasta/dofus-price-bot · github.com/Mathis-L/dofus-bot
Logs : support.ankama.com art. 203790076 · github.com/LuaxY/OpenDofus (Systeme-de-log.md)
