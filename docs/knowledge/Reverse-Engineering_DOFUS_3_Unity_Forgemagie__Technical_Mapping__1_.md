# Reverse-engineering de la Forgemagie DOFUS 3 / Unity — cartographie technique (noms internes, outils, fichiers)
 
## TL;DR
- **Le client DOFUS 3 / Unity est compilé en IL2CPP** (`GameAssembly.dll` + `global-metadata.dat`) et le protocole réseau est passé à **Protobuf** avec des paquets nommés `com.ankama.dofus.server.game.protocol.*` ; les anciens noms ActionScript de la forgemagie (`ExchangeCraftResultMagicWithObjectDescMessage`, `magicPoolStatus`) appartiennent à DOFUS 2.x et il n'est **pas confirmé** qu'ils survivent tels quels sous Unity (indices convergents pointant vers une famille `ExchangeCraft*`). Ankama a officialisé le passage à Unity : « DOFUS 2.0 is making way for DOFUS 3.0, which launches on Tuesday, December 3, after being ported to the Unity client! » (support.ankama.com).
- **La formule SC/SN/EC et l'algorithme de sélection de la ligne perdue ne sont retrouvés dans AUCUN dépôt public** (réponse : NON aux priorités 4 et 5). La seule donnée serveur directement observable est `magicPoolStatus` (puits monte/descend/stable), pas la valeur du reliquat.
- **L'extraction de données du client Unity est faisable et documentée** via des projets nommés : Dofus-Batteries-Included/DDC (BepInEx), bot4dofus/Datafus, dofusdude/doduda (AssetStudio + PyDofus), LuaxY/dofus-unity-protocol-builder, WolfDan/dofus_protodump, ModulX/dofus-unity-proto. DofusDB reste la source de données runes/effets la plus pratique.
---
 
## Key Findings
 
1. **Type de build (CLIENT).** Le client Unity de DOFUS est un binaire **IL2CPP** : un post RaGEZONE cherchant un reverse engineer précise explicitement « looking for a experienced Unity (IL2CPP) reverse engineer » pour Dofus, mentionne que le protocole est en **protobuf** et « wasn't obfuscated in the first versions of the game, but it was obfuscated later on ». [RaGEZONE](https://forum.ragezone.com/threads/dofus-looking-for-a-experienced-unity-il2cpp-reverse-engineer.1252623/) Preuve B/D.
2. **Protocole = Protobuf, packages `com.ankama.dofus.server.game.protocol.*`.** Confirmé par les fichiers descripteurs JSON du dépôt LuaxY/dofus-unity-protocol-builder (ex. `Com.Ankama.Dofus.Server.Game.Protocol.Admin.Console.json`, package `com.ankama.dofus.server.game.protocol.admin.console`, `syntax proto3`). [github](https://github.com/LuaxY/dofus-unity-protocol-builder/blob/main/proto_descriptor/Com.Ankama.Dofus.Server.Game.Protocol.Admin.Console.json) Preuve A (donnée issue d'un dump de descripteurs).
3. **`magicPoolStatus` (DOFUS 2.x, message `ExchangeCraftResultMagicWithObjectDescMessage`).** Signification issue d'une source communautaire (Cadernis, bot FM) : `1 = puits ne bouge pas, 2 = +reliquat, 3 = -reliquat` ; `craftResult 1 = échec, 2 = succès`. [Cadernis](https://cadernis.fr/index.php?threads/interpr%C3%A9tation-magicpool-lors-de-la-fm.2711/) Le même fil confirme que « le calcul et le stockage du reliquat se fait côté serveur » et que le client reçoit seulement l'information binaire de mouvement du puits. [Cadernis](https://cadernis.fr/index.php?threads/interpr%C3%A9tation-magicpool-lors-de-la-fm.2711/) Preuve D. **CLIENT reçoit / SERVEUR calcule.**
4. **Aucune formule SC/SN/EC ni sélection de perte dans le code public.** Les émulateurs 1.x/2.x trouvés (Stump, Symbioz, Desperion, Mambo, Giny, Ancestra) sont orientés combat/monde ; aucun ne publie une implémentation crédible de la probabilité de réussite d'un jet de rune ni de la loi de sélection de la statistique supprimée. Résultat négatif valide.
5. **Chaîne d'extraction Unity documentée.** DDC utilise BepInEx pour injecter un plugin lisant la classe `DataCenterModule` du client — « it is a BepInEx plugin that is injected to the unity application at startup. It reads data mainly from the DataCenterModule class of the client » — et « the data is extracted by a CI script whenever a new version of Dofus is released ». doduda utilise AssetStudio (+ port de PyDofus) dans des conteneurs Docker pour dépaqueter les asset bundles Unity (`.bundle`, `.imagebundle`, `.bin`).
---
 
## Details
 
### A. Noms internes et protocole
 
| Élément | Type | Version | Signification | Source / Nature |
|---|---|---|---|---|
| `ExchangeCraftResultMagicWithObjectDescMessage` | message réseau (ActionScript) | DOFUS 2.x | Résultat d'un craft magique (FM) avec description d'objet | Cadernis (D) ; correspond aux dumps protocole 2.x |
| `magicPoolStatus` | champ (uint) | DOFUS 2.x | 1 = puits stable, 2 = +reliquat, 3 = −reliquat | Cadernis (D) — SERVEUR calcule, CLIENT reçoit |
| `craftResult` | champ (uint) | DOFUS 2.x | 1 = échec, 2 = succès | Cadernis (D) |
| Package `com.ankama.dofus.server.game.protocol.*` | package protobuf | Unity (3.x) | Racine du protocole Unity | LuaxY (A) |
| `Com.Ankama.Dofus.Server.Game.Protocol.Admin.Console.json` | descripteur | Unity | Exemple concret : messages `ConsoleCommand`, `ConsoleMessage` avec enum `Type` = { TEXT:0, INFO:1, ERROR:2 } | LuaxY (A), verbatim du proto_descriptor |
| `ExchangeCraftCountRequest` | message réseau (protobuf) | Unity v3.6.10.11 | Message de la famille Exchange/Craft (forgemagie de masse) | mr-proto.com (D/E, source commerciale) |
| assemblies `Ankama.Dofus.Protocol.*` | assemblies .NET/IL2CPP | Unity | Contiennent les descripteurs protobuf ; extractibles par réflexion (« `!ass.FullName.StartsWith("Ankama.Dofus.Protocol")` », puis lecture des propriétés statiques `Descriptor`/`Proto`) | LuaxY builder README (A/B) |
 
**Réponse à la question `magicPoolStatus` :** ce n'est **pas** une trace directe de la valeur numérique du puits/reliquat. C'est un simple indicateur de sens de variation (monte / descend / stable). Le reliquat lui-même est calculé et stocké côté serveur et n'est pas exposé au client. [Cadernis](https://cadernis.fr/index.php?threads/interpr%C3%A9tation-magicpool-lors-de-la-fm.2711/) Un simulateur ne peut donc pas « lire » le reliquat via le protocole ; il ne peut qu'observer son sens de variation.
 
**Continuité 2.x → Unity :** les noms ActionScript ne sont **pas** garantis conservés. Le passage à Protobuf a renommé/restructuré les messages ; des indices (mr-proto.com : `ExchangeCraftCountRequest` en v3.6.10.11) [Mr. Proto](https://mr-proto.com/) suggèrent que la famille `ExchangeCraft*` persiste, mais les noms exacts des messages de résultat de FM sous Unity ne sont **pas confirmés** dans une source publique gratuite. Le dépôt LuaxY est par ailleurs marqué « The project is outdated and may not fully work with the current version of the game ».
 
### B. Client Unity : Mono ou IL2CPP, fichiers, outils, projets
 
**Build : IL2CPP** (confirmé indirectement, preuve B/D). Cible à extraire :
- `Dofus_Data/il2cpp_data/Metadata/global-metadata.dat` (noms de types/champs/méthodes)
- `GameAssembly.dll` (code compilé)
- `Dofus_Data/StreamingAssets/` (asset bundles : items, effets, langues `.bin`)
- assemblies `Ankama.Dofus.Protocol.*` (descripteurs protobuf via réflexion)
**Outils validés / documentés sur ce type de client :**
- **Il2CppDumper** (Perfare) — dump `dump.cs` + `il2cpp.h` + `script.json` depuis `GameAssembly.dll` + `global-metadata.dat`. [GitHub](https://github.com/Perfare/Il2CppDumper)
- **Il2CppInspector** (djkaty), **Cpp2IL**, **protodec** (arkadiyt), **IL2CppExtract** (AlpaGit) — cités dans le contexte Dofus (RaGEZONE, dofus_protodump).
- **AssetStudio** — utilisé par doduda pour les bundles Unity.
- **BepInEx** — utilisé par DDC pour injecter un plugin d'extraction runtime.
- **UnityPy / AssetRipper** — outils génériques standards pour bundles/addressables (non spécifiquement documentés sur Dofus mais applicables).
**Projets publics d'extraction DOFUS 3 / Unity :**
- **Dofus-Batteries-Included/DDC** — extrait les données via BepInEx en lisant `DataCenterModule` ; sortie JSON ; releases automatiques à chaque version du jeu [GitHub](https://github.com/Dofus-Batteries-Included/DDC) (CI) ; utilise cytrus-v6 pour télécharger le client. Actif ; expose une **API** (`api.dofusbatteriesincluded.fr/data-center/`) dont l'endpoint game-versions renvoie une version courante de type `2.73.38.36`.
- **bot4dofus/Datafus** — base de données + événements socket en JSON ; note explicitement que « Dofus 3 has been released on the 3rd of December 2024 [...] uses Unity Engine with a completely different file structure » [GitHub](https://github.com/bot4dofus/Datafus) et référence les équivalents Dofus 3. Dépôt archivé (dernières releases ~2.73.x).
- **dofusdude/doduda** — CLI Go de téléchargement/dépaquetage ; pipeline Dofus 2 (PyDofus) [GitHub](https://github.com/dofusdude/doduda) + Dofus 3 (AssetStudio, Docker) [GitHub](https://github.com/dofusdude/doduda) ; alimente l'API dofusdu.de.
- **LuaxY/dofus-unity-protocol-builder** — descripteurs protobuf Unity (dossier `proto_descriptor`) ; marqué « outdated ». [github](https://github.com/LuaxY/dofus-unity-protocol-builder/blob/main/README.md)
- **WolfDan/dofus_protodump** — dump automatique des .proto depuis le client (protodec + référence LuaxY). [GitHub](https://github.com/WolfDan/dofus_protodump/blob/main/README.md)
- **ModulX/dofus-unity-proto** — fichiers .proto Unity + `game_mappings.json`/`connection_mappings.json` (mapping noms obfusqués ↔ clairs) [github](https://github.com/ModulX/dofus-unity-proto) ; piste principale pour les noms actuels.
- **RuinedYourLife/dofus-deobfs** — déobfuscateur de protocole Dofus.
**Dumps publics de classes contenant `Smithmagic`/`Rune`/`MagicPool`/`Craft` :** aucun `dump.cs` complet exposant publiquement ces noms n'a été retrouvé. Piste principale : `game_mappings.json` de ModulX.
 
### C. Émulateurs (tableau comparatif)
 
| Émulateur | Dépôt | Version Dofus | Langage | FM implémentée ? | Intérêt |
|---|---|---|---|---|---|
| Stump | github.com/stump | 2.x | C# | Non retrouvée | Structures items/effets, protocole 2.x |
| Symbioz | Skinz3/Symbioz | 2.30 / 2.38 | C# | Non retrouvée | Constantes, D2I/D2O |
| Giny | Skinz3/Giny.NETCore | 2.x | C# | Non retrouvée | Protocole, sérialisation |
| Desperion | scalexm/desperion | 2.13.4 | C++11 | Non retrouvée | protocol_builder AS→C++ |
| Mambo | Emudofus/Mambo | 2.x | Scala | Non retrouvée | — |
| Ancestra / Shivas / gofus | divers | 1.29 | C#/Java/Go | Non retrouvée | Retro, non pertinent Unity |
 
Aucun de ces émulateurs n'est une preuve du comportement serveur officiel. Aucun n'expose une fonction crédible de calcul SC/SN/EC de forgemagie. À noter aussi un projet communautaire récent « Dofus Unity 3.6 Emulator » évoqué sur Cadernis (2026), non vérifié et hors preuve.
 
### D. SC / SN / EC — avons-nous une preuve technique ?
**NON.** Aucune implémentation publique (client, émulateur, bot) retrouvée ne permet de reconstruire la formule de probabilité de réussite critique/neutre/échec critique. Endroits fouillés : dépôts protocole 2.x/Unity, émulateurs C#/C++/Scala/Go, modules FM (DofMod/SmithMagic, hoboris/EasyFM), bots FM (SmithMagicBot, DofusMage), forums (Cadernis). Les modules FM communautaires (SmithMagic d'ExiTeD) sont des **surcouches d'affichage** au-dessus du module Ankama ; ils lisent le poids des runes/effets et calculent le puits, [GitHub](https://github.com/DofMod/SmithMagic) mais **ne contiennent pas** la formule de réussite serveur.
 
### E. Sélection de la ligne perdue — avons-nous une preuve technique ?
**NON.** Aucun code public ne contient de fonction de type `removeRandomStat`/`selectLoss` reconstruisant le modèle réel (uniforme / ∝ poids / ∝ valeur×poids / ∝ déficit). Le modèle reste une hypothèse (E). Le seul signal serveur observable est `magicPoolStatus` (sens de variation du puits).
 
### F. Données DofusDB et champs
 
DofusDB (api.dofusdb.fr, backend FeatherJS) expose sur les items des champs incluant `realWeight`, `weight`, `level`, `effects` (tableau d'objets `{from, to, characteristic, effectId}`). [RustJobs.dev](https://rustjobs.dev/blog/episode-3-fetching-data-from-an-external-api) Le client .NET DofusSharp confirme des propriétés `RealWeight`, `Name`, `Level`, `Usable`. [NuGet](https://www.nuget.org/packages/DofusSharp.DofusDb.ApiClients/0.13.1) Distinction des poids :
- **densité de forgemagie** (poids de ligne / puissance de la caractéristique) : combien de « puits » chaque point de stat représente ; c'est le poids utilisé dans la mécanique FM.
- **poids d'inventaire (`weight`)** : encombrement de l'objet dans le sac (sans rapport avec la FM).
- **`realWeight`** : poids « réel » utilisé pour le tri/économie (brisage), distinct du poids FM.
- **poids de rune** : coût en puits qu'une rune ajoute.
Les **poids unitaires des caractéristiques** (la table de densité FM) ne sont **pas** exposés clairement comme champ dédié dans DofusDB ; ils sont largement **dérivés/reconstruits** par la communauté (tables 1.29, Dofus Touch). À vérifier localement dans les données du client Unity. *(Exemple d'item concret avec valeurs exactes de chaque champ non capturé dans cette passe — voir Zones inconnues et Plan de datamining ; l'endpoint `api.dofusdb.fr/items` retourne bien la structure ci-dessus.)*
 
### G. Contradictions avec les rapports précédents
- **Formule SC/SN/EC secrète, aucun dépôt ne l'implémente** : CONFIRMÉ par cette recherche technique.
- **Purge du reliquat à l'équipement/HDV (JOL) classée inconnue** : cohérent ; le protocole n'expose pas la valeur du reliquat, donc invérifiable côté client. Aucune contradiction nouvelle.
- **Potions 50/65/80 %** : CONTRADICTION NON RÉSOLUE. Le Dofus Wiki (Fandom) indique que les potions intermédiaires (65 %) « were removed from the game in 3.1 » et que « weapons maged with these potions were converted to 85% », ce qui invaliderait le triplet 50/65/80. Mais un autre wiki (wiki-dofus.eu) liste toujours 50/65/80 %. **À trancher par datamining local** avant de coder le module potions ; ne pas présenter 50/65/80 comme un fait acquis pour la version actuelle.
- **KamelAkar / seuil d'exotisme** : pas de source technique A/B nouvelle ; hors périmètre.
### H. Zones inconnues (exhaustif)
1. Noms exacts des messages/champs protobuf de FM sous Unity (résultat de mage, statut du puits).
2. Valeurs d'enum du résultat de craft sous Unity.
3. Formule de probabilité SC/SN/EC (jamais publiée).
4. Loi de sélection de la statistique perdue.
5. Formule exacte de calcul du reliquat côté serveur.
6. Table des poids/densité unitaires stockée dans le client (emplacement et format).
7. Mécanique de purge du reliquat à l'équipement.
8. Taux actuels des potions élémentaires post-3.1 (contradiction wiki).
9. Exemple d'item rune DofusDB avec la valeur exacte de chaque champ (`density`/`realWeight`/`weight`).
### I. Plan de datamining local (ordonné)
1. Télécharger le client via **cytrus-v6** (sans launcher).
2. Sur `GameAssembly.dll` + `global-metadata.dat` : lancer **Il2CppDumper** → obtenir `dump.cs`. Chercher les chaînes : `Craft`, `Magic`, `MagicPool`, `Rune`, `Smithmagic`, `Forge`, `Exchange`, `Pool`, `Reliquat`, `Sink`.
3. Extraire les descripteurs protobuf via réflexion sur les assemblies `Ankama.Dofus.Protocol.*` (méthode LuaxY builder) → chercher les fichiers `...Exchange*` / `...Craft*`.
4. Croiser avec **ModulX/dofus-unity-proto** `game_mappings.json` pour résoudre les noms obfusqués.
5. Dépaqueter `StreamingAssets` avec **AssetStudio** (méthode doduda) → chercher les tables d'effets/caractéristiques et un éventuel poids/densité par caractéristique.
6. Utiliser **BepInEx** (méthode DDC, plugin lisant `DataCenterModule`) pour exporter les données en JSON à l'exécution.
7. Sniffer une session de FM et décoder les messages `ExchangeCraft*` pour capter `magicPoolStatus`/équivalent en conditions réelles.
### J. Sources principales
- LuaxY/dofus-unity-protocol-builder (descripteurs protobuf Unity, package `com.ankama...`, enum `ConsoleMessage.Type` verbatim ; extraction par réflexion des assemblies `Ankama.Dofus.Protocol.*`).
- WolfDan/dofus_protodump ; ModulX/dofus-unity-proto (mappings obfuscation) ; RuinedYourLife/dofus-deobfs.
- Dofus-Batteries-Included/DDC (BepInEx + `DataCenterModule`, CI par version, API) ; bot4dofus/Datafus (« Dofus 3 released 3 December 2024 [...] Unity Engine ») ; dofusdude/doduda (AssetStudio + PyDofus).
- Cadernis (interprétation `magicPoolStatus`).
- RaGEZONE (build IL2CPP + protocole protobuf obfusqué).
- Perfare/Il2CppDumper, djkaty/Il2CppInspector.
- DofusDB (api.dofusdb.fr) ; DofusSharp (NuGet).
- support.ankama.com (officialisation DOFUS 3.0 / Unity, 3 décembre) ; Dofus Wiki Fandom (potions retirées en 3.1) vs wiki-dofus.eu (50/65/80 % maintenus).
---
 
## Recommendations
1. **Commencer par le protocole, pas par la formule.** La formule SC/SN/EC n'existe nulle part publiquement ; ne pas perdre de temps à la chercher en ligne. La reconstruire empiriquement (dataset de jets, protocole reproductible, N documenté → preuve C).
2. **Prioriser ModulX/dofus-unity-proto + Il2CppDumper** pour obtenir les noms internes exacts avant tout sniffing ; c'est le chemin le plus court vers les identifiants `Craft`/`Magic`/`Rune` actuels.
3. **Traiter `magicPoolStatus` comme un signal de validation** (sens de variation du puits), pas comme la valeur du reliquat, qui reste côté serveur.
4. **Utiliser DofusDB/DDC/doduda comme source de données runes/effets/poids**, en marquant clairement que la densité unitaire est dérivée et non officielle tant qu'elle n'a pas été retrouvée dans le client.
5. **Résoudre la contradiction potions (50/65/80 vs 85 post-3.1) par datamining local** avant de coder le module potions.
**Seuils de décision :** si un `dump.cs` révèle une classe contenant une table de poids par caractéristique → passer la densité de « dérivée » (E) à preuve A. Si le sniffing révèle un champ numérique de reliquat dans un message `ExchangeCraft*` → réviser la conclusion « puits non exposé ». Si `game_mappings.json` (ModulX) fournit les noms clairs de messages de FM → mettre à jour le tableau A avec preuve A.
 
## Caveats
- Un comportement présent dans le client ou un émulateur n'est jamais une preuve du serveur officiel.
- Les dépôts protocole Unity (LuaxY) sont marqués « outdated » ; les numéros de champs peuvent être périmés.
- `ExchangeCraftCountRequest` provient d'une source commerciale (mr-proto.com), à considérer comme lead, non comme descripteur vérifié.
- Les noms ActionScript 2.x (`ExchangeCraftResultMagicWithObjectDescMessage`, `magicPoolStatus`) ne sont pas confirmés sous Unity.
- Contradiction non tranchée sur les taux de potions élémentaires (voir G).
- **Séparation stricte** : *ce que nous SAVONS* = build IL2CPP, protobuf `com.ankama.dofus.server.game.protocol.*`, sémantique de `magicPoolStatus` (sens de variation, 2.x), chaîne d'extraction (DDC/doduda/Il2CppDumper) ; *ce que nous PENSONS* = famille `ExchangeCraft*` conservée sous Unity, densité FM dérivable ; *ce que nous pouvons TESTER* = SC/SN/EC et loi de sélection de la perte par dataset reproductible, présence d'un champ reliquat par sniffing ; *ce que nous IGNORONS* = formule serveur SC/SN/EC, loi de sélection de la ligne perdue, formule/valeur du reliquat, emplacement de la table de poids dans le client, mécanique de purge, taux potions actuels.