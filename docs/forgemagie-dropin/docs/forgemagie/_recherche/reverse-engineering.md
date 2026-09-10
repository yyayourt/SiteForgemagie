# Reverse engineering de la forgemagie Dofus 3 — ce que ça peut donner, ce que ça ne donnera jamais

Date : 2026-09-10. Complément de `ALGORITHME.md` (§3, §9, §11.4) et `sources/code-sources.md`.
Artefacts récupérés : `sources/code/06_Dofus3_Unity_protocol/`.

---

## VERDICT EN UNE LIGNE

**Le reverse engineering du client Dofus 3 ne donnera JAMAIS la formule de probabilité — c'est
prouvé, pas supposé, par le protocole réseau lui-même. Tout le budget RE doit aller ailleurs.**

---

# 0. LA PREUVE, D'ABORD

C'est le résultat central de cette mission, et il est **factuel**, pas déductif.

Le protocole Dofus 3 (Unity) a été extrait par la communauté et est public :
[LuaxY/dofus-unity-protocol-builder](https://github.com/LuaxY/dofus-unity-protocol-builder).
Méthode d'extraction documentée : BepInEx-Unity.**IL2CPP** + CinematicUnityExplorer, réflexion sur
les assemblies `Ankama.Dofus.Protocol.*`, récupération des `Descriptor.Proto` protobuf
(copie : `sources/code/06_Dofus3_Unity_protocol/EXTRACTION_METHOD.md`).

**Toute la surface FM du protocole tient en 4 messages.**

### Client → serveur (ce que ton client envoie quand tu tentes une rune)
```protobuf
message ExchangeObjectMoveRequest   { int32 object_uid = 1; int32 quantity = 2; }
message ExchangeFocusedReadyRequest { bool ready = 1; int32 step = 2; int32 focus_action_id = 3; }
```
`focus_action_id` = la ligne visée. **C'est tout.** Le client n'envoie ni tirage, ni probabilité,
ni état calculé. Il envoie une *intention*.

### Serveur → client (ce que tu reçois)
```protobuf
message ExchangeCraftResultEvent {
  CraftResult result = 1;                    // IMPOSSIBLE | FAILED | SUCCESS | NEUTRAL | FORBIDDEN
  oneof complement {
    int32 object_gid = 2;
    ExchangeCraftResultWithObjectDescription object = 3;
  }
  message ExchangeCraftResultWithObjectDescription {
    ObjectItem object = 1;                   // l'objet ENTIER après le jet
    int32 fm_power = 3;
    optional MagicPoolStatus magic_pool_status = 2;   // NO_CHANGE | INCREASE | LOSS
  }
}
```

**Ce que le serveur envoie :** le résultat (SC/SN/EC → `SUCCESS`/`NEUTRAL`/`FAILED`), l'objet
complet recalculé, un `fm_power` entier, et une **direction** qualitative du puits.

**Ce que le serveur n'envoie PAS :** aucune probabilité, aucun seed, aucun `p_sc`/`p_sn`,
aucun intermédiaire de calcul. J'ai grepé les 79 fichiers de descripteurs protobuf sur
`probabilit|chance|seed|random|rate` : **zéro occurrence** dans tout le namespace Exchange.
La seule `probability` du protocole est dans `job.proto` (`SkillAction.Craft.probability`,
c'est le taux de craft d'artisanat, pas la FM).

➡️ **Le calcul est intégralement serveur.** Le client Dofus 3, décompilé jusqu'au dernier octet,
ne contient pas la formule, parce que la formule n'y a jamais été. Ce n'est pas une question
d'obfuscation ou de difficulté : c'est une question d'architecture.

Confirmation croisée par la génération précédente : en Dofus 2.62, le message équivalent
`ExchangeCraftResultMagicWithObjectDescMessage` ne portait que
`{craftResult: sbyte, objectInfo, magicPoolStatus: sbyte}`
([Scheduler2000/Dofus](https://github.com/Scheduler2000/Dofus), StumpR.Protocol). Même conclusion,
depuis 2.0. Le `fm_power` est le **seul ajout** de Dofus 3.

---

# PISTE 1 — Décompiler le client Dofus 3 pour trouver la formule

**Architecture établie.** Unity **6000.1.17f1**, **IL2CPP : oui**
([BepInEx issue #1188](https://github.com/BepInEx/BepInEx/issues/1188), 07/10/2025).
Donc : pas d'assemblies .NET, pas de dnSpy, pas d'ILSpy. Il faut
Il2CppDumper / Il2CppInspector / Ghidra sur du natif, ou de l'instrumentation runtime
(BepInEx.Unity.IL2CPP, frida-il2cpp-bridge). Le protocole protobuf, **non obfusqué aux premières
versions 3.x, l'est devenu depuis** — d'où l'existence de
[RuinedYourLife/dofus-deobfs](https://github.com/RuinedYourLife/dofus-deobfs), qui remappe les
protos obfusqués sur les protos clairs de LuaxY. Le repo de LuaxY se déclare lui-même
« outdated and may not fully work with the current version », et BepInEx fait crasher le client
depuis octobre 2025.

| | |
|---|---|
| **Ce que ça donne** | La table de poids / « densité de rune » exacte 3.x (elle est côté client, l'infobulle l'affiche depuis la 2.58). Les plafonds d'over. Les règles d'affichage (SN jaune, exo bleu, over vert). Le format exact des 4 messages FM. Le mapping `focus_action_id` → effet. |
| **Ce que ça ne donne pas** | **La fonction de probabilité. Le puits (calcul). L'ordre des pertes. Le tirage.** Rien de tout ça n'est dans le client. |
| **Coût** | Élevé et récurrent : IL2CPP + obfuscation + BepInEx cassé + re-travail à chaque patch. Compter des jours, pas des heures, pour un premier dump exploitable. |
| **Risque** | **Le plus élevé de toutes les pistes.** Le protocole contient `security.proto` : `FileCheckEvent {file_name, check_type ∈ {LENGTH, HASH_SUM}}` — **le serveur peut demander à ton client le hash d'un fichier nommé** — et `TrustStatusEvent {certified: bool}`. Plus `client_verification.proto` : handshake challenge/proof. Injecter BepInEx, c'est modifier le client sous le nez d'un mécanisme conçu pour le détecter. |
| **VERDICT** | **NO-GO.** Coût élevé, risque maximal, et l'unique livrable réel (la table de poids) s'obtient en 15 minutes à la souris en survolant les runes en jeu (`ALGORITHME.md` §12.1). On paierait le prix fort pour une donnée gratuite. |

---

# PISTE 2 — La ligne de partage client / serveur

Établie précisément, avec preuve protocolaire.

| Élément | Où | Preuve |
|---|---|---|
| Fonction de probabilité (P_SC / P_SN / P_EC) | **100 % serveur** | absente du protocole et du client ; le client n'envoie qu'une intention |
| Tirage aléatoire | **100 % serveur** | aucun seed transmis |
| Calcul du puits (reliquat) | **100 % serveur** | le client ne reçoit qu'une **direction** (`NO_CHANGE`/`INCREASE`/`LOSS`) |
| Choix des lignes perdues sur EC | **100 % serveur** | le client reçoit l'objet déjà recalculé |
| Plafonds d'over / cap 101 / règle ×20 | **serveur** (application), **client** (grisage préventif de l'UI) | l'UI empêche des tentatives, mais `FORBIDDEN` existe côté serveur |
| Table de poids / densité de rune | **client** (données d'affichage) | infobulle native depuis 2.58 |
| `fm_power` de l'objet | **serveur → client** | envoyé dans `ExchangeObjectsAddedEvent` *et* dans le résultat |

**Corollaire dur** : ce que la 2.29 a décidé de ne pas afficher (devblog 25/05/2015 : reliquat et
probabilités volontairement masqués) n'est pas masqué *dans l'UI* — c'est **absent du flux réseau**.
Ankama n'a pas caché l'information au joueur, elle ne la lui envoie pas. Il n'y a rien à
« démasquer ».

### La seule anomalie intéressante : `fm_power`
`int32 fm_power` est **nouveau en Dofus 3** (rien d'équivalent en 2.62). Il arrive à deux moments :
quand tu poses l'objet dans l'atelier (`ExchangeObjectsAddedEvent`, champ optionnel) et à chaque
résultat de jet. Un entier, attaché à l'objet, mis à jour à chaque tentative, transmis en clair.

Sa sémantique n'est **pas** établie par le RE seul : ce peut être le puits numérique, le poids
total FM de l'objet (`PWRg`), ou un « potentiel » d'affichage. Les trois hypothèses sont
distinguables par **une seule observation triviale** : poser un objet neuf (puits = 0 par
définition) et lire `fm_power`. S'il vaut 0 → c'est le puits, et alors **la variable cachée la
plus importante du modèle est lisible directement**. S'il vaut le poids de l'objet → c'est `PWRg`,
et c'est quand même une mesure gratuite de la variable dominante de la formule (§3.2, facteur n°1).

**Dans les deux cas c'est utile. Dans un cas c'est décisif.** C'est le seul résultat de cette
mission qui justifie une vérification.

| | |
|---|---|
| **VERDICT** | **GO, mais pas par le RE.** Ne dumpe pas le client pour lire `fm_power`. Le champ est déjà documenté ici. Ce qu'il faut, c'est **une** observation en jeu pour fixer sa sémantique — et si elle se confirme comme puits, ça change le plan de collecte de §12 (variable observée au lieu d'inférée). |

---

# PISTE 3 — Le protocole réseau et un proxy d'observation

**Documentation du protocole : elle existe et elle est publique.** Voir Piste 1. Tu n'as rien à
reverser toi-même : les 79 fichiers `.proto` sont dans le dépôt de LuaxY, les 4 qui comptent sont
recopiés dans `sources/code/06_Dofus3_Unity_protocol/`.

**Ce qu'un proxy passif donnerait, concrètement** : un journal de tentatives **parfaitement
labellisé**, automatiquement, sans saisie manuelle — état complet de l'objet avant et après,
issue mécanique brute (`SUCCESS`/`NEUTRAL`/`FAILED`, donc **sans le biais de l'« échec neutre »**
qui pollue toute observation humaine, cf. §10), direction du puits, `fm_power`. C'est exactement
le schéma de `ALGORITHME.md` §12.2, rempli tout seul. C'est le rêve méthodologique.

| | |
|---|---|
| **Ce que ça donne** | Le journal de calibration idéal, à coût marginal nul une fois branché. Pas de biais de saisie, pas de biais d'affichage. |
| **Ce que ça ne donne pas** | **Toujours pas la formule.** Un proxy observe des tirages, il ne lit pas la loi. Tu restes dans l'inférence statistique — sauf que tes données deviennent propres. |
| **Coût** | Moyen-élevé et instable : le protocole est obfusqué depuis les premières 3.x et remappé à chaque patch. Le handshake `client_verification` (challenge/proof) et la couche de connexion certifiée rendent l'interposition non triviale ; je n'ai pas pu établir si le flux de jeu Dofus 3 est chiffré (la thèse UPC ne couvre que 2.x, où il ne l'était pas). |
| **Risque** | **Le point dur, et il n'est pas technique.** Voir Piste 6. |
| **VERDICT** | **NO-GO en l'état.** Techniquement séduisant, mais : (a) le rapport coût/instabilité est mauvais, (b) le gain est un *confort de collecte*, pas une *information nouvelle*, (c) c'est la piste où la question réglementaire cesse d'être théorique. Reste la meilleure option **si et seulement si** tu décides plus tard qu'il te faut 50 000 lignes propres. Pas maintenant. |

---

# PISTE 4 — D'où vient VRAIMENT la formule des émulateurs

C'est la question la plus importante de la mission, parce qu'elle fixe le crédit qu'on peut
accorder à la formule sur laquelle repose tout le modèle actuel (§3.3). **J'ai vérifié
l'historique git complet des trois dépôts. Le résultat est mauvais.**

| Dépôt | Historique | La formule FM y apparaît |
|---|---|---|
| [StarLoco-Game](https://github.com/StarLoco/StarLoco-Game) | 914 commits, mais le premier est un **import massif** daté du 13/02/2023, intitulé « First commit » | **dans le premier commit, telle quelle** |
| [Romain-P/Ancestra-Evolutive](https://github.com/Romain-P/Ancestra-Evolutive) | **10 commits.** « Initial commit » (21/03/2014) puis « Uploading project » (22/03/2014) | dans l'import |
| [Dysta/Nao](https://github.com/Dysta/Nao) | **9 commits.** « first commit » (29/08/2017) | dans l'import |

Recherche sur l'intégralité des messages de commit des trois dépôts pour
`forgemagie|smithmagic|chanceFM|puit` : **une seule correspondance, et c'est un faux positif**
(un fix de téléportation Iop). Aucun commit ne touche `chanceFM`. Aucun ne l'ajuste. Aucun ne
l'explique. Aucun commentaire de code n'en donne la provenance.

**Conclusion, et elle est sévère :** la formule des émulateurs n'a **aucune provenance traçable**.
Elle a été déposée d'un bloc dans le dépôt le plus ancien de la lignée (Ancestra, ~2010-2012,
antérieur à tout ce qui est sur GitHub) et **recopiée sans jamais être rediscutée** pendant quinze
ans, à travers Ancestra → AncestraRemake → Ancestra-Evolutive → Nao → StarLoco. Ce n'est pas cinq
sources indépendantes qui convergent : **c'est une source unique, copiée quatre fois.**

**Alors pourquoi y accorder du crédit ?** Pour une raison, une seule, mais elle est solide et elle
est déjà dans `ALGORITHME.md` §3.1 : le code de StarLoco reproduit **littéralement** les bornes
publiées par Ankama dans le DevBlog 1.27 — `if (p1 > 66) p1 = 66`, `if (p2 > 50) p2 = 50`,
`if (p1 < 1) { p1 = 1; p2 = 0; p3 = 99; }` qui est mot pour mot le triplet #5 (1/0/99). Et les
variables portent **les notations du DevBlog** (`PWRg`, `PWRmin`, `PWRmax`). L'auteur d'origine
avait le DevBlog sous les yeux et a écrit du code pour le satisfaire.

➡️ **Verdict de fiabilité, à inscrire dans le modèle :** la formule StarLoco est une
**réimplémentation de la description publique d'Ankama par un anonyme vers 2010**, pas une fuite,
pas une observation statistique documentée, pas du code Ankama. Sa **structure** mérite confiance
(elle respecte les invariants officiels). Ses **constantes internes** (1.3, 1.2, 0.8, 0.5, 25, 20)
ne méritent **aucune** confiance a priori — elles sont l'ajustement à l'œil d'une personne dont on
ne connaît ni le nom ni la méthode. Le classement `[SUPP]` de §11.1 est correct, et je le
durcirais : ces constantes doivent être traitées comme des **valeurs d'initialisation**, pas
comme des estimations.

Aucune trace de fuite de code serveur Ankama pour la FM. Aucune trace de campagne statistique
publiée. Les études communautaires trouvées (JOL, forums dofus.com) sont qualitatives.

| | |
|---|---|
| **VERDICT** | **GO — c'est fait, et c'est le résultat le plus utile de cette mission.** Rien de plus à chercher de ce côté : l'historique git est épuisé. Action concrète : ne jamais présenter les constantes StarLoco comme « la formule », et faire du calibrage un prérequis, pas une amélioration. |

---

# PISTE 5 — Passer par Dofus Retro d'abord

L'idée : Retro (1.29/1.39) est plus simple, les émulateurs y sont complets, l'algo est mieux
documenté. Est-ce un raccourci vers Dofus 3 ?

**Réponse en deux temps, parce que la question en cache deux.**

### 5a. Transposer les paramètres Retro → Dofus 3 : NON

`ALGORITHME.md` §9 recense déjà les divergences, et elles sont structurelles, pas cosmétiques :
tables de poids différentes (Vita 1 vs 0.25, CC 30 vs 10, Rés.% 5 vs 6), overmax différents
(Vita 404 vs 505), le niveau du métier compte en Retro et pas en 3.x, les runes de transcendance
n'existent qu'en 3.x, le brisage a été entièrement refondu en 2.27. Ancestra (1.29) ne modélise
même pas le succès neutre — deux issues au lieu de trois. Ce sont **deux bases de code Ankama
différentes**, séparées par la réécriture 1.x → 2.0. Un paramètre calibré sur Retro n'a aucune
raison d'être valide en 3.x, et tu n'aurais aucun moyen de le savoir.

### 5b. Utiliser Retro comme banc d'essai à vérité terrain : OUI, et c'est fort

Voici l'argument, et c'est le seul de ce document qui débloque quelque chose immédiatement.

Le problème que tu n'as pas encore résolu n'est pas « quelle est la formule ». C'est :
**« mon pipeline d'estimation est-il capable de retrouver une formule à partir de N observations,
et combien vaut N ? »** `ALGORITHME.md` §12.3 pose la question du plan d'expérience ; §11.1 liste
une dizaine de constantes libres. Personne ne sait aujourd'hui si ces constantes sont seulement
**identifiables** — plusieurs jeux de paramètres peuvent produire les mêmes taux observés, et tu
collecterais des mois pour rien.

Un émulateur Retro monté en local répond à ça **gratuitement**, parce que tu y connais la formule
exacte : c'est toi qui l'exécutes. Tu génères 10⁶ tentatives, tu jettes la formule, tu fais tourner
ton estimateur sur les seules observations, et tu regardes s'il retrouve les constantes que tu
avais mises. Tu obtiens : le N nécessaire par cellule du plan d'expérience, la liste des paramètres
non identifiables (à figer plutôt qu'à estimer), et la validation de bout en bout de ta chaîne
logging → estimation.

C'est du **test d'un estimateur contre une vérité connue**. Ça ne dépend pas du tout de la
question de savoir si la formule Retro ressemble à celle de Dofus 3 — elle n'a pas besoin d'y
ressembler pour valider l'outillage.

| | |
|---|---|
| **Ce que ça donne** | Le dimensionnement du plan d'expérience §12.3. L'analyse d'identifiabilité (§11.1). La validation du pipeline. Un jeu de tests de non-régression pour `fm_sim.py`. |
| **Ce que ça ne donne pas** | Aucune constante utilisable en Dofus 3. Zéro. Ne jamais reporter un chiffre de Retro vers 3.x. |
| **Coût** | Faible. StarLoco-Game est en Java, buildable, déjà cloné dans `repos/`. Tu n'as même pas besoin de faire tourner le serveur complet : `Formulas.chanceFM` + `JobAction` + `GameObject.parseStringStatsEC_FM` peuvent être extraits et exécutés comme générateur autonome. Une journée. |
| **Risque** | **Nul.** Aucun compte Ankama impliqué, aucun client, aucun réseau. |
| **VERDICT** | **GO, et c'est la première chose à faire.** Pas comme raccourci vers la formule de Dofus 3 — comme banc d'essai qui te dit si ton programme de collecte a une chance d'aboutir avant que tu ne le lances. |

---

# PISTE 6 — Collecte instrumentée : où passe la ligne chez Ankama

**Avertissement de méthode.** Les textes de référence (règlement Dofus, CGU Ankama) sont sur
`dofus.com`, **inaccessible depuis cet environnement** (robots.txt + politique d'egress ; miroirs
archive.org également bloqués). Je n'ai **pas pu lire ni citer le règlement lui-même**. Ce que je
donne ci-dessous vient des articles du support Ankama, qui sont accessibles, et de l'analyse du
protocole. **Va lire le règlement toi-même avant toute décision** — je ne complète pas les trous
par des suppositions.

### Ce qui est établi, textuellement

**Automatisation — interdiction explicite, sanction maximale.** Ankama définit un bot comme
« *a computer program that automates actions in the game* » et précise : « *Any player found using
bots will be permanently banned from all of their accounts* »
([support Ankama, « What is a bot? »](https://support.ankama.com/hc/en-us/articles/203692596-What-is-a-bot)).
Bannissement définitif, **tous** les comptes. Ce n'est pas gradué.

**Logiciels tiers prohibés.** Le support range parmi les cas qu'il ne traite pas lui-même
« *the use of in-game action automation tools (bots and auto clickers, in particular) or use of
prohibited third-party software (emulators, for example)* »
([support Ankama](https://support.ankama.com/hc/en-us/articles/360015168678-What-prohibited-behaviors-should-be-reported-to-Support)).
Deux enseignements : la catégorie « logiciel tiers prohibé » existe formellement, et les
émulateurs y sont nommés.

**Observation passive : non traitée.** Aucun des articles de support accessibles n'aborde la
lecture de mémoire, le sniffing réseau ou la lecture de logs sans automatisation. Le critère
retenu par les textes que j'ai pu lire est **l'automatisation d'actions**, pas l'observation.
Je ne peux pas en conclure que l'observation est autorisée : le règlement et les CGU, que je n'ai
pas pu lire, contiennent très probablement des clauses distinctes sur la modification du client et
la rétro-ingénierie. **Zone non documentée, pas zone verte.**

### Ce que dit le protocole sur les intentions d'Ankama

`security.proto` (extrait du client, copie locale) :
```protobuf
enum CheckType { LENGTH = 0; HASH_SUM = 1; }
message FileCheckEvent  { string file_name = 1; CheckType check_type = 2; }
message TrustStatusEvent { bool certified = 1; }
```
`client_verification.proto` : `ClientChallengeInitRequest` / `ServerChallengeEvent` /
`ClientChallengeProofRequest`.

**Le serveur peut à tout moment demander au client le hash ou la taille d'un fichier qu'il nomme,
et maintient un booléen « client certifié ».** Autrement dit : Ankama a construit, dans le
protocole, un mécanisme dont la fonction unique est de détecter un client modifié. Injecter
BepInEx dans le client, c'est se placer exactement dans la ligne de mire de ce mécanisme.
(La chaîne complète est cohérente avec ce que documente la thèse UPC pour 2.x : empreinte
matérielle — hash MAC, cœurs CPU, modèle CPU, OS, RAM — intégrée à la génération des clés.)

### La ligne, telle qu'on peut honnêtement la tracer

| | Statut | Base |
|---|---|---|
| Outils compagnons en lecture seule, hors client (DofusBook, dofusdude, Ganymède) | **Tolérés en pratique** — écosystème public, ancien, non inquiété. Toléré ≠ autorisé par écrit. | observation de l'écosystème |
| Saisie manuelle de tes propres tentatives dans un tableur | **Aucun problème.** Tu notes ce que tu vois. | — |
| Lecture passive de la mémoire du client | **Non couvert** par les textes accessibles. Pas d'automatisation, mais pas d'autorisation. | — |
| Proxy / sniffer réseau passif | **Non couvert**, même remarque. Techniquement ni détecté ni couvert par `FileCheckEvent` (rien n'est modifié côté client). | analyse protocole |
| **Modifier / injecter dans le client (BepInEx, patch binaire)** | **Du mauvais côté.** Détection prévue par conception. | `security.proto` |
| **Automatiser les tentatives de FM** | **Interdit, ban définitif de tous les comptes.** | texte Ankama cité |

**Un fait qui vaut tous les commentaires :** `krm35/dofus-multi` (~209 ★, maintenu, le plus gros
outil Dofus public de GitHub) propose un « Bot FM » — et son manifeste interne le déclare
`["fm","Bot FM",10,["retro"]]` : **tag `retro` uniquement**. Sur Dofus 3 le même projet ne propose
que chasse et HDV. L'outil communautaire le plus avancé qui existe n'automatise pas la FM sur
Dofus 3. Que ce soit par difficulté technique ou par prudence, le signal est le même.

| | |
|---|---|
| **VERDICT** | **NO-GO sur toute instrumentation du client Dofus 3.** L'automatisation est explicitement et lourdement sanctionnée ; la modification du client est détectable par conception ; l'observation passive est dans un flou que je n'ai pas pu lever et que tu ne dois pas franchir sur la foi de ce document. **GO** sur la saisie manuelle assistée : un formulaire local qui te fait saisir en 5 secondes l'état avant/après et l'issue. Lent, mais propre, gratuit et sans risque. |

---

# RÉCAPITULATIF

| Piste | Coût | Risque | Verdict |
|---|---|---|---|
| 1. Décompiler le client Dofus 3 (IL2CPP) | Élevé, récurrent | Élevé (`FileCheckEvent`) | **NO-GO** |
| 2. Ligne client/serveur — la formule est-elle atteignable ? | — | — | **Tranché : NON. Définitivement.** |
| 2bis. Sémantique de `fm_power` | 1 observation | Nul | **GO** |
| 3. Proxy réseau d'observation | Moyen-élevé, instable | Zone grise | **NO-GO maintenant** |
| 4. Provenance des formules d'émulateurs | Fait | Nul | **GO — fait. Résultat : source unique, non tracée.** |
| 5a. Transposer les paramètres Retro → Dofus 3 | — | — | **NO-GO** |
| 5b. Retro/StarLoco local comme banc d'essai | ~1 jour | Nul | **GO — priorité 1** |
| 6. Instrumentation du client Dofus 3 | — | Ban définitif | **NO-GO** |

---

# RECOMMANDATION UNIQUE

**Arrête de chercher la formule. Elle n'est pas trouvable, et ce n'est plus une hypothèse :
le protocole prouve qu'elle n'a jamais quitté les serveurs d'Ankama. Ni la décompilation, ni le
sniffing, ni les émulateurs ne te la donneront — les émulateurs eux-mêmes ne l'ont pas, ils ont
recopié pendant quinze ans la reconstruction anonyme d'un DevBlog public.**

**Le vrai objectif atteignable est un modèle qui reproduit les taux observés. Donc la question
n'est plus « quelle formule », c'est « combien de données me faut-il, et mes paramètres sont-ils
seulement identifiables ». Réponds à celle-là d'abord, et réponds-y gratuitement : extrais
`chanceFM` + `JobAction` + `parseStringStatsEC_FM` de StarLoco (déjà dans `repos/`), fais-en un
générateur autonome, et vérifie que ton estimateur retrouve des constantes que tu connais. Une
journée de travail qui te dira si ton programme de collecte a un sens — avant de le lancer.**

**Deux mesures gratuites à prendre en jeu dans la foulée, à la souris, sans aucun outil :
la table de densité des runes (§12.1, 15 min) et la valeur de `fm_power` sur un objet neuf.
Si `fm_power` vaut 0 sur un objet vierge, tu viens de rendre observable la variable cachée
la plus lourde de ton modèle, et tout le plan de collecte du §12 doit être réécrit autour.**

Tout le reste du budget va à la collecte de données, pas au reverse engineering.

---

## Artefacts déposés

`sources/code/06_Dofus3_Unity_protocol/`
- `ExchangeCraftResultEvent.proto` — la réponse serveur FM (Dofus 3, protobuf)
- `ExchangeReadyRequest.proto` — la requête client FM + `ExchangeObjectsAddedEvent`
- `security.proto`, `client_verification.proto` — vérification d'intégrité du client
- `DecraftResultEvent.proto` — brisage (runes obtenues), pour §8
- `EXTRACTION_METHOD.md` — méthode BepInEx-IL2CPP de LuaxY

## Sources

- [LuaxY/dofus-unity-protocol-builder](https://github.com/LuaxY/dofus-unity-protocol-builder) — protocole Dofus 3 protobuf, 79 descripteurs
- [RuinedYourLife/dofus-deobfs](https://github.com/RuinedYourLife/dofus-deobfs) — déobfuscation du protocole Unity
- [BepInEx issue #1188](https://github.com/BepInEx/BepInEx/issues/1188) — Unity 6000.1.17f1, IL2CPP confirmé, injection cassée (10/2025)
- [RaGEZONE — Dofus IL2CPP reverse engineer](https://forum.ragezone.com/threads/dofus-looking-for-a-experienced-unity-il2cpp-reverse-engineer.1252623/) — protocole non obfusqué au départ, obfusqué ensuite
- [Scheduler2000/Dofus (StumpR)](https://github.com/Scheduler2000/Dofus) — protocole Dofus 2.62, `ExchangeCraftResultMagicWithObjectDescMessage`
- [StarLoco-Game](https://github.com/StarLoco/StarLoco-Game), [Ancestra-Evolutive](https://github.com/Romain-P/Ancestra-Evolutive), [Nao](https://github.com/Dysta/Nao) — historiques git vérifiés
- [krm35/dofus-multi](https://github.com/krm35/dofus-multi) — Bot FM tagué `retro` uniquement
- [Ankama — What is a bot?](https://support.ankama.com/hc/en-us/articles/203692596-What-is-a-bot)
- [Ankama — What prohibited behaviors should be reported to Support?](https://support.ankama.com/hc/en-us/articles/360015168678-What-prohibited-behaviors-should-be-reported-to-Support)
- [UPC — Game Hacking: Reverse engineering Dofus (thèse, Dofus 2.x)](https://upcommons.upc.edu/entities/publication/fa38e52a-250e-47d0-b2b4-d3540026e61f)
- [Gamosaurus — Dofus 2.58, poids de rune dans l'infobulle](https://www.gamosaurus.com/jeux/dofus/dofus-2-58-refonte-de-la-forgemagie-premiers-details)
- [dofusdude/doduda](https://github.com/dofusdude/doduda) — unpacking natif des bundles Unity Dofus 3
