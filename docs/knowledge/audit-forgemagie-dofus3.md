# Audit contradictoire de l’algorithme de Forgemagie de DOFUS 3
 
## 1. Résumé exécutif
 
Le document audité mélange trois niveaux de connaissance : des règles anciennes bien connues de la forgemagie, des tables communautaires plausibles, et des équations présentées comme « confirmées » sans fournir les journaux, scripts, captures ou références primaires permettant de les reproduire. Le point méthodologique principal est donc négatif : aucune preuve publique retrouvée ne permet d’établir les formules fermées proposées pour les probabilités SC/SN/EC, la sélection de la ligne perdue, la densité, ni la plupart des statistiques expérimentales revendiquées dans le PDF.[^1]
 
Les éléments les plus solides sont plus modestes : la définition opérationnelle du reliquat comme différence entre le poids perdu et le poids de la rune, l’existence des trois issues SC/SN/EC, les poids classiques de nombreuses runes, et l’existence d’une règle d’exotisme PA/PM/PO généralement décrite comme un succès critique d’environ 1%. Ces éléments sont documentés par des sources officielles ou communautaires, mais la continuité exacte jusqu’à DOFUS Unity actuel doit être distinguée de l’origine historique de la règle.[^2][^3][^4]
 
Le PDF doit être réfuté comme spécification du serveur. Ses affirmations les plus problématiques sont les équations numériques de probabilité, le seuil exact de 80%, le plancher universel de 1%, la règle « poids > 50 », la limite globale « over + exo ≤ 101 », la priorité algorithmique détaillée des pertes, la purge du reliquat à l’équipement/HDV et les prétendues campagnes de 5 000 à 42 150 essais. Ces résultats ne sont pas accompagnés de données brutes auditables et certaines formulations sont incompatibles avec la manière dont les sources décrivent la mécanique.[^1][^5][^6]
 
Conclusion pratique : un simulateur sérieux peut implémenter une couche déterministe de poids et de reliquat, mais doit laisser paramétrables les probabilités et la sélection des pertes. Il ne faut pas coder les formules du PDF comme des faits du moteur réel.
 
## 2. Sources principales et hiérarchie
 
| Source | Date/version | Ce qu’elle permet d’établir | Niveau |
|---|---|---|---|
| Devblog Ankama sur la mise à jour 2.72 | 2024-06-18 | Modifications officielles de 2.72, dont les runes de transcendance et les règles annoncées dans le devblog | Primaire, mais historique 2.72[^2][^7] |
| Tutoriel officiel Ankama | page officielle, date non extraite | Table et présentation officielle de la forgemagie | Primaire, version à vérifier[^4] |
| Forum officiel sur les probabilités | sujet communautaire hébergé par Ankama | Discussion expérimentale et modèles proposés, pas code serveur | Secondaire[^8] |
| Forum officiel sur l’exotisme PA/PM/PO | sujet historique | Mention d’un taux officiellement annoncé de 1% | Secondaire citant une information officielle non reproduite[^6] |
| Forum officiel sur la formule de génération des runes | sujet communautaire | Formule couramment utilisée pour le brisage | Secondaire[^9] |
| DofusDB / données d’objets | données de base | Métadonnées d’objets et runes, à utiliser pour vérifier les identifiants et valeurs | Donnée communautaire structurée[^10] |
| Guides communautaires récents | 2025-2026 | Tables, pratiques et observations sous Unity | Secondaire, qualité variable[^11][^12][^13] |
| PDF audité | fourni par l’utilisateur | Hypothèses et affirmations à tester, pas preuve indépendante | Document à auditer[^1] |
 
Aucune source publique retrouvée ne donne le code serveur Ankama. Les dépôts open source identifiés sont des calculateurs ou simulateurs : ils peuvent révéler les conventions communautaires, mais leur présence dans plusieurs projets ne constitue pas une validation indépendante du moteur.[^14][^15]
 
## 3. Audit des poids des runes
 
### 3.1 Table de base utilisable
 
Le tableau suivant indique les valeurs qui disposent d’une convergence communautaire raisonnable. « Forte » signifie que plusieurs tables concordent ; cela ne signifie pas qu’une table serveur Unity complète a été publiée.
 
| Stat | Rune | Valeur typique | Poids unitaire / total | Confiance DOFUS 3 |
|---|---:|---:|---:|---|
| Vitalité | Vi / Pa Vi / Ra Vi | +5 / +15 / +50 | 0,2 par point ; 1 / 3 / 10 | B, à vérifier par données actuelles[^16][^17] |
| Force, Intelligence, Chance, Agilité | simple / Pa / Ra | +1 / +3 / +10 | 1 par point ; 1 / 3 / 10 | B[^17][^18] |
| Initiative | Ini / Pa Ini / Ra Ini | +10 / +30 / +100 | 0,1 par point ; 1 / 3 / 10 | B[^18] |
| Pods | Pod / Pa Pod / Ra Pod | +10 / +30 / +100 | 0,25 par point ; 2,5 / 7,5 / 25 | C-B ; désaccords historiques[^16][^18] |
| Sagesse | Sa / Pa Sa / Ra Sa | +1 / +3 / +10 | 3 par point ; 3 / 9 / 30 | B[^17][^19] |
| Prospection | Prospe / Pa Prospe | +1 / +3 | 3 par point ; 3 / 9 | B[^17] |
| Puissance | Pui / Pa Pui / Ra Pui | +1 / +3 / +10 | 2 par point ; 2 / 6 / 20 | B[^17][^19] |
| Tacle, Fuite | Tac / Fui | +1 | 4 par point | B[^17][^19] |
| Retrait et esquive PA/PM | Ret / Ré | +1 / +3 | 7 par point ; 7 / 21 | B[^17][^19] |
| Dommages élémentaires, poussée, critiques, pièges | Do / Do Pou / Do Cri / Pi | +1 / +3 | généralement 5 par point ; 5 / 15 | B, vérifier les lignes exactes[^17][^18] |
| Dommages fixes génériques | Do | +1 | 20 par point | B[^17][^18] |
| Résistances fixes | Ré élémentaire, Ré Cri, Ré Pou | +1 / +3 | généralement 2 par point ; 2 / 6 | B, tables historiques divergentes[^19] |
| Résistances en pourcentage élémentaires | Ré % | +1 | 6 par point | B[^17][^19] |
| Critiques | Cri | +1 | 10 par point dans les tables récentes | C-B ; certaines tables anciennes divergent[^17][^19] |
| Soins | So | +1 / +3 | 10 par point ; 10 / 30 dans les tables récentes | C-B[^17] |
| Dommages/résistances catégoriels | sorts, armes, distance, mêlée | +1 | 15 par point | C ; confirmation Unity nécessaire[^17] |
| Invocation | Invo | +1 | 30 par point | B[^17][^19] |
| Portée | PO | +1 | 51 | B, convergence forte[^12][^13][^18] |
| PM | Ga Pme | +1 | 90 | B, convergence forte[^12][^13] |
| PA | Ga Pa | +1 | 100 | B, convergence forte[^12][^13] |
| Chasse | Chasse | +1 | 5 | C-B[^17] |
 
### 3.2 Ce que le PDF fait mal
 
Le PDF transforme une table communautaire en « données affichées dans les infobulles officielles du client DOFUS 3 ». La recherche n’a pas retrouvé de publication Ankama exposant une table complète des poids unitaires dans DOFUS 3 Unity. Une donnée client dataminée pourrait être utile, mais il faudrait fournir le fichier, le chemin, la version, le hash et la méthode d’extraction ; aucun de ces éléments n’est fourni.[^1]
 
Le PDF contient aussi des incohérences internes. Il annonce notamment une réduction de moitié du poids lors de la résorption d’un malus, puis l’applique comme règle générale ; le devblog 2.72 doit être cité directement pour déterminer le périmètre exact, car un changement de version ne peut pas être extrapolé à toutes les opérations de FM.[^7]
 
## 4. Puits / reliquat
 
### 4.1 Ce qui est bien étayé
 
La convention opérationnelle est : reliquat = poids des pertes - poids de la rune utilisée. Cette formulation apparaît dans plusieurs guides et outils communautaires, dont Tofus, Gamosaurus et des calculateurs historiques.[^20][^21][^22] Exemple : une perte de 20 de poids provoquée par une rune de poids 1 laisse environ 19 unités de reliquat.
 
Le reliquat est utilisé pour absorber des pertes ultérieures ; lorsque la réserve est insuffisante, une perte matérielle peut apparaître. Cette description est cohérente entre les guides, mais elle ne suffit pas à établir la séquence serveur exacte lorsque plusieurs lignes peuvent être dégradées.[^20][^23][^24]
 
### 4.2 Ce qui reste inconnu
 
La formule comptable élémentaire ne démontre pas les détails du PDF : stockage continu ou discret, ordre exact des arrondis, sélection de plusieurs lignes, traitement de la ligne ciblée, ordre entre over/exotique et naturel, et comportement des reliquats fractionnaires. Le PDF affirme que chacun de ces points est « confirmé » sans publier de journaux ou de protocole reproductible.[^1]
 
La prétendue purge systématique du reliquat lors de l’équipement ou du dépôt en Hôtel de Vente est classée D — inconnu — pour DOFUS 3 actuel. Aucune source primaire retrouvée ne l’établit ; elle ne doit pas être codée sans expérience contrôlée.
 
## 5. SC, SN et EC
 
Les trois issues — succès critique, succès neutre et échec critique — sont bien décrites dans les guides de forgemagie. Le SC applique la rune sans perte associée, le SN applique la rune avec une compensation, et l’EC n’applique pas le bonus et peut provoquer une perte.[^25][^4]
 
En revanche, aucune source publique retrouvée n’établit les équations du PDF :
 
- P(SC) = 0,66 × (1,15 - 0,70D) / φ(L) / Ω(W) × (1 - P_rune/150) ;
- P(SN) = 0,50 × (1 - P_rune/100) / (1 + exp(...)) ;
- le facteur quadratique activé à 80% ;
- le facteur exponentiel exp(W/35) ;
- le plafond de SC à 1% dans toutes les situations.
Ces équations sont donc C — hypothèses — au mieux, et non des formules officielles. Le sujet officiel sur les probabilités montre précisément que la loi du passage fait l’objet d’une investigation communautaire, ce qui est incompatible avec la présentation du PDF comme spécification déjà établie.[^8]
 
L’affirmation selon laquelle le reliquat n’influence jamais les probabilités est plausible dans le modèle traditionnel — il modifie surtout les conséquences d’une issue — mais elle reste à tester séparément avec deux lots identiques, reliquat nul et reliquat supérieur au poids de la rune. Le PDF cite un test de 12 500 fusions sans données brutes, identifiant les conditions, ni intervalle reproductible.[^1]
 
## 6. Sélection des pertes
 
La proposition P(ligne i) ∝ masse magique de la ligne i n’est pas démontrée par les sources retrouvées. Les guides disent souvent qu’une perte peut toucher une caractéristique de poids équivalent ou supérieur, ou qu’une ligne lourde est fréquemment concernée ; cela ne permet pas de distinguer une pondération par masse, une sélection par seuil, une sélection par liste aléatoire ou une logique de priorité.[^26][^25]
 
Le pseudo-code du PDF se contredit lui-même : la prose évoque une sélection pondérée par masse, mais le code sélectionne uniformément une ligne parmi les lignes éligibles avec `Math.random()`. Il ne peut donc pas servir simultanément de preuve de la masse magique et de modèle implémentable fidèle.[^1]
 
Les hypothèses suivantes doivent rester concurrentes :
 
| Modèle | Description | Statut |
|---|---|---|
| A | Sélection pondérée par masse totale de la ligne | Hypothèse communautaire, C |
| B | Sélection par poids unitaire ou seuil de couverture | Hypothèse, C |
| C | Sélection pondérée par déficit relatif au jet maximal | Hypothèse, C |
| D | Choix pseudo-aléatoire uniforme parmi les lignes admissibles | Compatible avec le code du PDF, non démontré, C |
| E | Priorité déterministe over/exo puis règle serveur cachée | Plausible partiellement, C |
 
## 7. Limite des 101 de poids
 
La valeur 101 est très présente dans les tableaux et guides récents : les exemples donnés sont 101 points de Force, 505 Vitalité à 0,2 par point, 1 PO à 51, 1 PM à 90 et 1 PA à 100.[^12][^13][^26] Cela établit une règle pratique de plafond de poids additionnel, pas nécessairement la formule exacte de validation côté serveur.
 
La formulation du PDF — somme globale des over et exotiques ≤ 101 — est insuffisamment qualifiée. Les sources récentes parlent tantôt de bonus supplémentaire total, tantôt de limite par ligne, et les discussions communautaires ne constituent pas une spécification. Il faut donc classer « existence d’une borne pratique de 101 » en B, mais « nature globale, partage entre lignes, comportement exact à 101/102 et interaction avec le reliquat » en C-D.[^12][^27]
 
Le PDF invente un comportement précis « rejet de la tentative, SC = 0, EC obligatoire avec dégradation immédiate de l’over ». Une borne de validation ne prouve pas ce résultat de transition. Cette séquence doit être testée en jeu ; elle est D tant que les observations ne sont pas publiées.
 
## 8. Runes lourdes
 
Les poids 51, 90 et 100 pour PO, PM et PA sont cohérents entre plusieurs tables récentes.[^12][^13] L’affirmation plus forte « poids > 50 implique SC = 1%, SN = 0%, EC = 99% » n’est pas établie par les sources retrouvées. Les sources disent surtout qu’un exo PA/PM/PO ne passe qu’en succès critique et que le taux annoncé est de 1% ; elles ne démontrent ni l’universalité de la condition `poids > 50`, ni son application aux runes lourdes sur une ligne naturelle, ni une distribution exacte dans tous les états.[^6][^25]
 
Le PDF inclut PO dans les runes de poids supérieur à 50, mais sa formulation mélange « rune lourde », « exotisme » et « toute tentative ». Ces domaines doivent être séparés : exo PA, exo PM, exo PO, augmentation d’une ligne naturelle, tentative après over, et tentative avec reliquat.
 
## 9. Overmax
 
Un overmax est bien une valeur supérieure au maximum naturel de la ligne ; une caractéristique absente du patron est un exotique. Ces définitions sont stables dans les sources communautaires récentes.[^11][^25]
 
La formule de poids de l’over, (valeur actuelle - maximum naturel) × poids unitaire, est une représentation comptable raisonnable. Elle ne suffit pas à prouver une règle serveur universelle de 101, ni l’ordre d’effacement déclaré par le PDF. Les maxima théoriques dérivés par division de 101 par le poids unitaire sont des plafonds arithmétiques, pas toujours des limites de gameplay distinctes.
 
La « règle des 20 fois la valeur de la rune » est explicitement décrite dans un forum comme une limite ressentie, non absolue, notamment pour les caractéristiques classiques.[^5] Le PDF a raison de ne pas la considérer comme une borne binaire, mais il remplace cette prudence par d’autres formules non démontrées.
 
## 10. Exotiques
 
Le taux de 1% pour l’exotisme PA/PM/PO est une information historique largement répétée et attribuée à une information officielle, mais les résultats expérimentaux complets recherchés n’ont pas été retrouvés sous une forme auditable dans les sources publiques consultées.[^6] Les guides 2026 reprennent encore un taux fixe de 1% pour l’exo PA/PM/PO, mais un guide n’est pas une preuve du code serveur actuel.[^12]
 
Le tableau expérimental du PDF est irrecevable en l’état : il donne 42 150 tentatives, 426 succès et un intervalle, mais aucun auteur, fichier de données, date exacte, serveur, définition de l’essai, méthode de collecte, traitement des changements de version, ni script d’analyse. Il faut le classer C au maximum, et non A/B.[^1]
 
Pour une vraie campagne, publier au minimum : nombre de tentatives valides, succès, essais interrompus, version et serveur, état précis de l’objet à chaque essai, présence de reliquat, type de rune, horodatage, et intervalle binomial exact ou Wilson. À titre de méthode, 100 succès observés donnent une précision bien meilleure que quelques dizaines, mais aucun seuil d’échantillon ne transforme une mesure mal contrôlée en preuve.
 
## 11. Brisage / concassage
 
La génération de runes dépend historiquement du niveau de l’objet, du poids de la ligne, du poids de la rune ciblée et d’un coefficient dynamique. Le coefficient économique n’est plus fixe depuis une modification historique et évolue avec l’économie du serveur ; plusieurs guides l’indiquent explicitement.[^28]
 
La formule couramment rapportée par le forum officiel est de la forme (((3 × jet × poids × niveau / 200) + 1) / poids de la rune) × coefficient.[^9] Cette source établit l’origine communautaire de la formule, pas une garantie qu’elle est inchangée dans DOFUS 3 Unity.
 
Le PDF commet une erreur de présentation en appelant « poids de brisage unitaire » la quantité (3 × Jet × P_unit × Niveau / 200) + 1, puis en traitant directement cette quantité comme une réserve universelle. Le calcul de production doit distinguer : poids économique de la ligne, transformation en runes de différents paliers, coefficient de serveur, arrondissement, reliquat probabiliste, focus et éventuels changements de version.
 
Les informations sur le focus sont principalement communautaires : une règle de réduction de moitié des autres lignes est rapportée par des utilisateurs et des calculateurs, mais aucune documentation primaire actuelle n’a été retrouvée pour confirmer tous les cas limites.[^29] La formule exacte du PDF, notamment la gestion des malus à 1/10 puis division par deux, est donc C-D.
 
## 12. Différences de versions
 
| Donnée | Version la plus directement documentée | Utilisation pour DOFUS 3 actuel |
|---|---|---|
| Poids classiques des runes | DOFUS 2.x et tables communautaires ; certaines pages mises à jour | B pour les valeurs convergentes, validation Unity recommandée |
| Reliquat/puits | Mécanique historique DOFUS | B pour le principe, C pour les détails du moteur |
| Taux exo PA/PM/PO de 1% | Règle historique et guides récents | B comme règle pratique, D pour une preuve statistique actuelle publiée |
| Brisage et formule niveau/poids | Changements historiques, formule communautaire | C tant que non vérifié dans la version ciblée |
| Dofus Touch / Retro / 1.29 | Versions distinctes | Ne jamais utiliser comme preuve directe |
| DOFUS Unity 3.x | Sources récentes et guides 2025-2026 | Priorité, mais absence de documentation serveur publique |
 
Le document audité affirme que les règles 2.x sont « intégralement reconduites » dans Unity. Cette phrase est une hypothèse de continuité, non une démonstration. La seule présence de pages intitulées DOFUS 3, ou la date récente d’un guide, ne prouve pas que chaque détail de 2.x est identique.[^1][^11][^12]
 
## 13. Contre-exemples et contradictions
 
| Affirmation du PDF | Élément contradictoire ou insuffisant | Verdict |
|---|---|---|
| « Toutes les formules sont confirmées » | Le PDF reconnaît lui-même que plusieurs formules serveur sont inconnues et fournit des approximations | E — contradiction interne[^1] |
| SC exact donné par une équation continue | Aucun document Ankama ou jeu de données auditable retrouvé | D |
| Seuil non linéaire exact à 80% | Le forum parle d’une limite ressentie et non absolue | E pour la précision du seuil[^5] |
| Sélection pondérée par masse | Le pseudo-code choisi uniformément les lignes | E — contradiction interne[^1] |
| Puits purgé à l’équipement/HDV | Aucune source primaire retrouvée | D |
| Poids > 50 ⇒ 1%/0%/99% pour toute situation | Les sources documentent surtout les exos PA/PM/PO, pas toutes les runes lourdes | C-D[^6][^12] |
| Over + exo global ≤ 101 avec rejet EC déterministe | Les guides confirment une borne pratique mais pas la transition serveur détaillée | B pour la borne pratique, D pour la séquence[^12][^13] |
| Brisage confirmé par R² = 0,9999 | Aucun fichier expérimental ni dataset fourni | C au maximum[^1] |
| Formule de brisage toujours valide | Une formule historique et communautaire ne suffit pas à établir la version Unity | C-D[^9][^28] |
| Rune de transcendance verrouille définitivement toute FM | Le devblog 2.72 documente des comportements spécifiques, mais la formulation complète du PDF doit être vérifiée dans le texte officiel | C-D[^7] |
 
## 14. Tableau final de confiance
 
| Mécanique | Règle/formule auditée | Preuve | Version | Confiance |
|---|---|---|---|---|
| Poids | Beaucoup de poids unitaires classiques concordent entre tables | Tables communautaires multiples | 2.x à Unity, à vérifier | B |
| Poids | Table exhaustive et officielle DOFUS 3 fournie par le PDF | Aucune référence technique vérifiable dans le PDF | Unity | D |
| Reliquat | Poids perdu - poids de rune | Guides convergents | Historique, probablement actuel | B |
| Reliquat | Séquence exacte, arrondis et stockage | Aucun log serveur publié | Unity | D |
| Probabilités | Trois issues SC/SN/EC | Tutoriels et guides | Historique et actuel pratique | B |
| Probabilités | Équations D, L, φ, Ω du PDF | Pas de source primaire/dataset | Prétendu 2.x-Unity | E/C |
| Puits et probabilité | Puits sans influence intrinsèque | Hypothèse cohérente mais test PDF non auditable | Unity | C |
| Sélection pertes | Priorité over/exo puis masse magique | Observations qualitatives בלבד | Unity | C |
| Sélection pertes | Proportionnelle à la masse magique | Pas de test discriminant | Unity | C |
| Limite 101 | Borne pratique de poids supplémentaire | Tables et guides récents | Unity pratique | B |
| Limite 101 | Somme globale exacte over + exo | Discussions ambiguës | Unity | C-D |
| Exo PA/PM/PO | Succès critique uniquement, taux annoncé autour de 1% | Forum et guides | Historique, repris récemment | B |
| Exo lourd | Exactement 1/0/99 dans tous les cas | Non démontré | Unity | C-D |
| Brisage | Dépend du niveau, poids et coefficient | Guides/formule communautaire | Historique | B |
| Brisage | Formule exacte du PDF et focus complet | Sources secondaires contradictoires/incomplètes | Unity | C-D |
| Purge reliquat | Équipement ou HDV purge toujours | Non trouvé | Unity | D |
 
## 15. Algorithme reconstructible
 
### 15.1 Peut être implémenté avec certitude raisonnable
 
- Modèle d’objet avec lignes, maximum naturel, valeur actuelle, marque naturelle/exotique et version.
- Catalogue de runes avec valeur et poids, séparé par version et par source.
- Calcul comptable du poids d’une rune.
- Distinction SC, SN et EC.
- Reliquat comme réserve consommable par une pénalité, avec journal de chaque transition.
- Overmax comme dépassement du maximum naturel et exotique comme ligne absente du patron.
- Brisage paramétré par niveau, poids de ligne, poids de rune, coefficient et règle d’arrondi.
### 15.2 Bonne approximation, à signaler comme telle
 
- Taux pratique de 1% pour les exos PA/PM/PO.
- Modèle simple où le reliquat réduit uniquement la perte matérielle après un SN/EC.
- Modèle de perte donnant priorité aux excédents, puis sélection pondérée par masse.
- Modèle de brisage dérivé de la formule communautaire, avec coefficient configurable.
### 15.3 À laisser paramétrable
 
```ts
interface ForgemagieRules {
  version: string;
  runeWeights: Record<string, number>;
  overCap: number | null;
  exoCap: number | null;
  heavyRuneThreshold: number | null;
  exoCriticalRate: number | null;
  successModel: 'fixed' | 'table' | 'density' | 'custom';
  lossModel: 'uniform' | 'mass' | 'unitWeight' | 'deficit' | 'custom';
  overLossPriority: 'none' | 'first' | 'custom';
  malusReductionFactor: number | null;
  sinkPersistence: 'unknown' | 'persist' | 'purge_on_equip' | 'custom';
  crushingFormula: 'community_3x' | 'alternative' | 'custom';
}
```
 
Le simulateur doit enregistrer le modèle utilisé dans chaque résultat. Une sortie « 8,4% » doit être accompagnée de « modèle empirique X, version Y », et non présentée comme le taux réel du serveur.
 
## 16. Incertitudes restantes
 
Les inconnues prioritaires sont : la loi exacte SC/SN/EC hors exo, la dépendance au poids et au jet, l’influence éventuelle de la densité, le rôle exact du reliquat dans la probabilité, la sélection des lignes perdues, le statut précis de la borne 101, la persistence du reliquat hors atelier, les traitements des malus, et le brisage Unity.
 
Les plus grandes erreurs de modèle viendront probablement de la confusion entre résultat d’une tentative et conséquence d’un résultat. Toute expérience doit donc enregistrer séparément : rune appliquée, issue affichée, gain, perte par ligne, variation du reliquat, over/exo avant et après, et événement de changement d’inventaire.
 
## 17. Protocole expérimental
 
### Expérience A — Puits contre probabilité
 
- Objet : deux copies identiques, même jet et même version.
- Rune : même rune légère, puis rune lourde séparément.
- État : lot 1 reliquat 0 ; lot 2 reliquat supérieur au poids de la rune.
- Nombre minimal : 5 000 tentatives par condition ; idéalement 20 000.
- Variables : SC, SN, EC ; pertes matérielles séparées.
- Hypothèses : reliquat sans influence probabiliste contre influence du reliquat.
- Critère : comparer des intervalles binomiaux et un test de proportions, sans conclure à l’égalité par simple proximité.
### Expérience B — Densité et jet ciblé
 
- Objet : même patron avec plusieurs états contrôlés : 25%, 50%, 75%, 90%, 100% de la ligne.
- Rune : même poids, même ligne, sans over.
- Nombre minimal : 2 000 par état ; idéalement 10 000.
- Variables : taux SC/SN/EC.
- Hypothèses : taux constant, dépendance monotone, seuil à 80%, autre loi.
- Critère : ajuster plusieurs modèles préenregistrés et comparer leur vraisemblance hors échantillon.
### Expérience C — Sélection de ligne
 
- Objet : trois lignes de masses très différentes, mais avec suffisamment d’unités disponibles.
- Rune : poids connu et déficit contrôlé.
- Nombre minimal : 10 000 pertes observables par configuration.
- Variables : ligne touchée, quantité perdue, poids effectivement libéré.
- Hypothèses : uniforme, masse, poids unitaire, déficit relatif.
- Critère : chaque modèle doit produire des fréquences attendues distinctes ; éliminer les configurations où les modèles prédisent la même chose.
### Expérience D — Over et exotique
 
- Objet : même objet avec 0, 10, 50, 90 et 100 unités de poids non naturel.
- Rune : over d’une ligne existante puis exo d’une ligne absente, séparément.
- Nombre minimal : 5 000 par état pour une borne ; davantage pour un taux proche de 1%.
- Variables : acceptation, issue, perte de l’over, perte des lignes naturelles.
- Hypothèses : cap global, cap par ligne, rejet déterministe, EC avec perte.
- Critère : publier chaque tentative et les transitions, pas seulement le nombre final de SC.
### Expérience E — Runes PA/PM/PO
 
- Objet : anneaux et objets sans puis avec ligne naturelle correspondante.
- Rune : Ga Pa, Ga Pme, PO.
- Nombre minimal : 10 000 tentatives par famille si possible.
- Variables : SC/SN/EC, présence du reliquat, jet de l’objet, ligne naturelle ou exo.
- Hypothèses : 1% uniquement en exo, 1% sur toute rune lourde, autre règle.
- Critère : séparer strictement exo, over et amélioration naturelle.
### Expérience F — Brisage
 
- Objet : séries d’objets identiques, puis objets dont un seul paramètre change.
- Variables : niveau, jet, coefficient, focus, malus, nombre d’objets.
- Nombre minimal : 100 brisages par point de configuration, répétés sur plusieurs coefficients.
- Hypothèses : formule 3×jet×poids×niveau/200 + 1, formule modifiée, arrondis alternatifs.
- Critère : stocker le résultat brut par rune et comparer les résidus, sans mélanger les changements de coefficient.
### Expérience G — Persistance du reliquat
 
- Objet : une pièce avec reliquat mesuré et journal de création.
- Actions : fermer atelier, changer carte, déconnecter, échanger, équiper, déposer en HDV, retirer.
- Nombre minimal : 30 répétitions par action et plusieurs comptes si possible.
- Variable : reliquat observable via une rune test ou perte contrôlée.
- Hypothèses : persistance universelle, purge par certaines actions, reliquat non observable mais conservé.
- Critère : ne pas déduire la purge d’une seule tentative aléatoire.
## 18. Liste des sources avec URL
 
Les liens ci-dessous sont les sources retrouvées pendant l’audit ; leur niveau de preuve est indiqué dans les sections précédentes.
 
- [Devblog Ankama — Mise à jour 2.72](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1713137-devblog-mise-jour-2-72)[^7]
- [Détails de la mise à jour 2.72](https://www.dofus.com/fr/mmorpg/actualites/maj/1713574-mise-jour-2-72/details)[^2]
- [Devblog — Amélioration des interfaces Forgemagie](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/435452-amelioration-interfaces-forgemagie)[^3]
- [Tutoriel officiel Ankama — La forgemagie](https://www.dofus.com/fr/mmorpg/tutoriels/420190-forgemagie)[^4]
- [Forum officiel — Loi de probabilité du passage de runes](https://www.dofus.com/fr/forum/1067-artisanat/2214849-forgemagie-maths-loi-probabilite-passa)[^8]
- [Forum officiel — Forgemagie exo PA/PM/PO](https://www.dofus.com/fr/forum/1067-artisanat/2166785-forgemagie-exo-pa-pm-po)[^6]
- [Forum officiel — Formule exacte de génération des runes](https://www.dofus.com/fr/forum/1782-dofus/2389064-formule-exacte-generation-runes)[^9]
- [Forum officiel — Guide Forgemagie](https://www.dofus.com/fr/forum/1778-artisanat/2382087-guide-forgemagie)[^5]
- [Dofus pour les Noobs — Guide Forgemagie](https://www.dofuspourlesnoobs.com/guide-forgemagie.html)[^17]
- [DofusTool — Poids des runes](https://www.dofustool.com/poids-runes-dofus/)[^13]
- [Dafous.app — Poids des runes et limites](https://dafous.app/guides/poids-runes-fm.html)[^12]
- [Tofus — Fonctionnement de la forgemagie](https://www.tofus.fr/fiches/forge)[^20]
- [Huzounet — Forgemagie](https://huzounet.fr/guides/forgemagie)[^24]
- [Guide communautaire — Formule de brisage et coefficient](https://papycha.fr/taux-de-brisage/)[^28]
- [Forum officiel — Génération des runes](https://www.dofus.com/fr/forum/1782-dofus/2389064-formule-exacte-generation-runes)[^9]
- [GitHub — Dofus tools forgemagie](https://github.com/lilgallon/dofus-tools/blob/master/forgemagie.html)[^14]
- [GitHub — Dofus Crushing Calculator Unity](https://github.com/Icksir/crushing-calculator)[^15]
- [DofusDB — Rune Pa Do Ren](https://www.dofusdb.fr/database/item/30942)[^10]
- [PDF audité fourni dans le projet](file:1)[^1]
---
 
## References
 
1. [Algorithme-Forgemagie-DOFUS-3.pdf](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/104520563/d774f38d-df23-4122-8ee8-af0f871a97ec/Algorithme-Forgemagie-DOFUS-3.pdf) - Spécification Algorithmique et 
Modélisation Mathématique de la 
Forgemagie dans DOFUS 3 (DOFUS 
Uni...
2. [Détails - Mise à jour 2.72 - Mises à jour - DOFUS, le MMORPG stratégique.](https://www.dofus.com/fr/mmorpg/actualites/maj/1713574-mise-jour-2-72/details)
3. [Amélioration des interfaces Forgemagie - Devblog DOFUS](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/435452-amelioration-interfaces-forgemagie) - Reliquat et probabilités. La question d'afficher les valeurs de reliquat et les probabilités de réus...
4. [La forgemagie - Les tutoriels DOFUS - Apprendre à jouer - DOFUS, le MMORPG stratégique.](https://www.dofus.com/fr/mmorpg/tutoriels/420190-forgemagie) - Lorsqu'un personnage atteint le niveau 65 dans un métier de confection d'armes ou d'équipements, cel...
5. [Guide de la forgemagie - Forum - DOFUS, le MMORPG stratégique.](https://www.dofus.com/fr/forum/1778-artisanat-elevage/2382087-guide-forgemagie) - Plusieurs milliers de joueurs dans le monde. DOFUS est un jeu de rôle massivement multijoueur où le ...
6. [Forgemagie : exo PA/PM/PO - Forum - Dofus](https://www.dofus.com/fr/forum/1067-artisanat/2166785-forgemagie-exo-pa-pm-po) - Je me permets de créer un sujet ayant pour thème l'exo d'items PA/PM/PO. Officiellement, il y a une ...
7. [Mise à jour 2.72 - Devblog DOFUS - DOFUS, le MMORPG stratégique.](https://www.dofus.com/fr/mmorpg/actualites/devblog/billets/1713137-devblog-mise-jour-2-72) - si la rune de transcendance apporte un over sur une stat : le over sera retiré pour remettre la stat...
8. [[Forgemagie][Maths] Loi de probabilité du passage de runes - Dofus](https://www.dofus.com/fr/forum/1067-artisanat/2214849-forgemagie-maths-loi-probabilite-passage-runes) - Deuxième question, la plus importante : quelle est la loi de probabilité de ce poids X apporté ? La ...
9. [Formule exacte de génération des runes - Forum - Dofus](https://www.dofus.com/fr/forum/1782-dofus/2389064-formule-exacte-generation-runes) - C'est ( ((3*jet*niveau*poids/200)+1)/poids)*coefficient. Donc 6.97/5 = 1.4 soit 1 rune avec 40% de c...
10. [Rune Pa Do Ren - DofusDB](https://www.dofusdb.fr/database/item/30942) - Poids 1 pod. Prix Tavernier 1 K. Densité 15. Cette rune permet de renvoyer plus facilement les domma...
11. [Exos and Forgemagie - Dofus Builds](https://dofusbuilds.com/guides/exos-and-forgemagie) - What an exo actually is, the AP/MP/Range caps it runs into, why you only ever get one of each, and h...
12. [Forgemagie 2026 : poids des runes, priorités et erreurs à éviter](https://dafous.app/guides/poids-runes-fm.html) - Tout savoir sur la forgemagie (FM) dans Dofus Unity. Tableau complet du poids des runes (Ga PA, PM, ...
13. [Tableau Poids Rune Dofus (2025)](https://www.dofustool.com/poids-runes-dofus/) - Tableau Poids Rune Dofus (à jour) ➤ Tous les outils & guides sur Dofustool.com ! ✚ Fan Site Dofus ✓ ...
14. [dofus-tools/forgemagie.html at master - GitHub](https://github.com/lilgallon/dofus-tools/blob/master/forgemagie.html) - Tout d'abord, il faut définir le PUIT. Pour ceci, allez dans la partie <b>"Rune qui a sauté"</b>, pu...
15. [️ Dofus Crushing Calculator (Unity 3.4) - GitHub](https://github.com/Icksir/crushing-calculator) - This project is a comprehensive tool for the forging and crushing system. It allows calculating the ...
16. [Tableau poids des runes Dofus forgemagie](https://www.dofastuces.fr/pages/dossiers/tableau-poids-des-runes.html) - Non blue, 5 vita = 1 de poids, ça s'est aligné sur les autres runes caractéristiques depuis qu'elles...
17. [Guide Forgemagie - Dofus pour les Noobs](https://www.dofuspourlesnoobs.com/guide-forgemagie.html) - Poids des runes de forgemagie et Over maximum. Visuel, Runes, Poids des runes, Over max. Simples, Pa...
18. [Les runes - Dofus](https://laforgemagiedofus.blogspot.com/p/les-runes.html) - Mis à jour le 05 juin 2017 Les runes Caractéristiques Les runes intel force chance et agilité ont un...
19. [Les runes - Dofus Touch](https://laforgemagiedofus.blogspot.com/p/les-runes-dofus-touch.html) - Dofus Touch Mis à jour le 05 juin 2017 Les runes Caractéristiques Les runes intel force chance et ag...
20. [La forgemagie dans Dofus, comment ça marche](https://www.tofus.fr/fiches/forge) - Tofus, encyclopédie Dofus MMORPG,recherches d
21. [Apprendre la Forgemagie - Eclypsia](https://www.eclypsia.com/home/dofus/guides/dofus-guide-forgemagie-72756.html) - La forgemagie, ou l’art de perfectionner vos items, est un travail long et fastidieux. Découvrez ici...
22. [Forgemagie, le guide complet - DOFUS](https://www.gamosaurus.com/jeux/dofus/forgemagie-le-guide-complet-dofus) - Être Forgemage sur DOFUS, c'est tout un métier. Apprenez à FM, Exo et Over vos items avec notre guid...
23. [Learn-dofus: Forgemagie](https://learn-dofus.blogspot.com/p/forgemagie.html) - G u i d e F M Tout ce qui se trouve dedans n'est qu'une interprétation personnelle lorsqu'il ne s'ag...
24. [La FORGEMAGIE | Huzounet - La référence du mode online](https://huzounet.fr/guides/forgemagie) - Le succès critique: la rune passe sans piocher dans les statistiques de l'item · L'échec: la rune ne...
25. [Dofus : Guide Forgemagie](https://www.millenium.org/guide/282643.html) - La Forgemagie est une approche scientifique de l'optimisation qui repose sur l'idée que la maitrise ...
26. [Poids des runes Dofus : guide complet pour optimiser vos équipements et booster votre personnage - Rezo Actif](https://www.rezoactif.com/poids-runes-dofus-guide-complet-optimiser-vos-equipements-booster-votre-personnage/) - Idées principales Détails Concept fondamental Comprendre le système de poids des runes pour optimise...
27. [Question over max forgemagie](https://www.reddit.com/r/DOFUS_FRANCE/comments/1hdn6io/question_over_max_forgemagie/) - Question over max forgemagie
28. [[Métier] Taux de brisage – Le Bazar de Papycha](https://papycha.fr/taux-de-brisage/)
29. [Formule de brisage avec FOCUS](https://www.reddit.com/r/DOFUS_FRANCE/comments/1jkoem3/formule_de_brisage_avec_focus/) - Formule de brisage avec FOCUS
