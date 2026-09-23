/**
 * Contenu de l'onglet « Comprendre » de la page Savoir.
 *
 * Seule source : docs/superpowers/specs/2026-09-23-savoir-faits.md (fiche de faits sourcés).
 * Règles de transcription :
 * - aucune affirmation, valeur, formule ou exemple qui ne soit dans la fiche ;
 * - statut = celui de la fiche ; puce à deux statuts → le plus faible
 *   (INCONNU < CONTRADICTION < HYPOTHÈSE COMMUNAUTAIRE < MODÈLE EMPIRIQUE < SOURCE PRIMAIRE),
 *   la nuance est dite dans le texte ; « POLITIQUE » n'est pas un statut → « choix de projet » ;
 * - une valeur de paramètre n'est jamais écrite en dur : `param` la fait lire en direct
 *   depuis empirical_params.json (constantes du moteur 15 % et 1 % exceptées) ;
 * - règles du DevBlog 2010 (v1.27) : statut gardé, « DevBlog 2010 » dans la source,
 *   « transposition à Unity non vérifiée » dans le texte.
 */
import type { EpistemicStatus } from '../data/params';

/** Une affirmation affichée : texte court + statut + source (chemin de fichier ou de paramètre). */
export interface KnowledgeItem {
  text: string;
  status: EpistemicStatus;
  source: string;
  /** Paramètre dont la valeur est affichée en direct après le texte (ex. 'densities.11') */
  param?: string;
}

export interface KnowledgeExample {
  title: string; // ex. « Cape Bouffante, 2026-09-08 »
  lines: string[]; // les données observées, telles que documentées
  status: EpistemicStatus;
  source: string; // ex. « data/observations/observations.json, captures 2026-09-08 »
  params?: string[]; // chemins de paramètres utilisés dans le calcul, lus en direct
}

export interface UnderstandSection {
  id: 'poids' | 'chances' | 'pertes' | 'over-exo' | 'transcendance' | 'craft-orbes' | 'brisage' | 'potions';
  title: string;
  brief: KnowledgeItem[]; // 2 à 4
  steps: KnowledgeItem[]; // 2 à 5
  example: KnowledgeExample | null; // null = « Aucun exemple documenté »
  certain: KnowledgeItem[];
  uncertain: KnowledgeItem[];
  /** Sections du registre (ParamDescriptor.section) à ouvrir dans le Dossier */
  dossierSections: string[];
}

export interface RunePathStep {
  label: string;
  detail: string;
  sectionId: UnderstandSection['id'];
}

const SP: EpistemicStatus = 'SOURCE PRIMAIRE';
const ME: EpistemicStatus = 'MODÈLE EMPIRIQUE';
const HC: EpistemicStatus = 'HYPOTHÈSE COMMUNAUTAIRE';
const CT: EpistemicStatus = 'CONTRADICTION';
const IN: EpistemicStatus = 'INCONNU';

export const UNDERSTAND_SECTIONS: UnderstandSection[] = [
  // ---------------------------------------------------------------- 1. Poids et densités
  {
    id: 'poids',
    title: 'Poids et densités',
    brief: [
      {
        text: 'Chaque caractéristique a une densité : un poids par point.',
        status: SP,
        source: 'infobulle « DENSITÉ » lue en jeu, 2026-09-10',
      },
      {
        text: 'Le poids d’une rune = ce qu’elle ajoute × la densité. Une Rune Pa Vi (+15 Vitalité) pèse 3.',
        status: SP,
        source: 'infobulle lue en jeu, 2026-09-10',
      },
      {
        text: 'Onze densités sont lues en jeu ou confirmées par le reliquat affiché ; les autres viennent de tables communautaires. Chaque densité a son propre statut dans le Dossier.',
        status: HC,
        source: 'empirical_params.json, section densities',
      },
      {
        text: 'La densité n’est ni le poids d’inventaire (pods) ni le poids du brisage : l’infobulle affiche les pods et la densité dans deux colonnes distinctes.',
        status: SP,
        source: 'infobulle lue en jeu, 2026-09-10',
      },
    ],
    steps: [
      {
        text: 'Le poids d’une ligne = valeur × densité de la caractéristique (calcul détaillé dans l’exemple ci-dessous).',
        status: SP,
        source: 'infobulles lues en jeu, 2026-09-10',
      },
      {
        text: 'Depuis la 2.58, le poids des runes est affiché dans l’infobulle.',
        status: SP,
        source: 'changelog 2.58 relayé par JeuxOnLine',
      },
      {
        text: 'Plusieurs valeurs des tables 2.x ont changé sur Unity sans changelog : % Rés. mêlée et distance lus 10 en jeu (et non 15), Renvoi lu 5 (et non 10). Le premier changement est établi, le second reste contesté.',
        status: CT,
        source: 'lectures en infobulle ; empirical_params.json densities.121, .124, .50',
      },
    ],
    example: {
      title: 'Infobulles lues en jeu, 2026-09-10',
      lines: [
        'Client 3.6.10.11, vidéo.',
        'Rune Pa Vi (niv. 5) : 15 Vitalité, POIDS (pods) 1, DENSITÉ 3 → 15 × densité Vitalité (0,2) = 3.',
        'Rune Ini (niv. 1) : 10 Initiative, POIDS (pods) 1, DENSITÉ 1 → 10 × densité Initiative (0,1) = 1.',
      ],
      status: SP,
      source: 'observation en jeu 2026-09-10 (docs/knowledge/sources/S2), lecture d’écran',
      params: ['densities.11', 'densities.44'],
    },
    certain: [
      {
        text: 'Vitalité, par point (confirmée par l’arithmétique du reliquat affiché, 2026-09-08) :',
        status: SP,
        source: 'observation en jeu 2026-09-08, errata',
        param: 'densities.11',
      },
      {
        text: 'Initiative, par point (confirmée par l’arithmétique du reliquat affiché, 2026-09-08) :',
        status: SP,
        source: 'observation en jeu 2026-09-08, errata',
        param: 'densities.44',
      },
      { text: 'Esquive PA, lue en infobulle le 2026-09-08 :', status: SP, source: 'data/observations/tooltips, 2026-09-08', param: 'densities.27' },
      { text: 'Esquive PM, lue en infobulle le 2026-09-08 :', status: SP, source: 'data/observations/tooltips, 2026-09-08', param: 'densities.28' },
      { text: 'Retrait PA, lu en infobulle le 2026-09-08 :', status: SP, source: 'data/observations/tooltips, 2026-09-08', param: 'densities.82' },
      { text: 'Retrait PM, lu en infobulle le 2026-09-08 :', status: SP, source: 'data/observations/tooltips, 2026-09-08', param: 'densities.83' },
      { text: 'Puissance pièges, lue en infobulle le 2026-09-08 :', status: SP, source: 'data/observations/tooltips, 2026-09-08', param: 'densities.69' },
      { text: 'Dommages pièges, lus en infobulle le 2026-09-08 :', status: SP, source: 'data/observations/tooltips, 2026-09-08', param: 'densities.70' },
      {
        text: '% Résistance mêlée, lue en infobulle (et non 15 comme dans les tables 2.x) :',
        status: SP,
        source: 'lecture en infobulle, errata',
        param: 'densities.121',
      },
      {
        text: '% Résistance distance, lue en infobulle (et non 15 comme dans les tables 2.x) :',
        status: SP,
        source: 'lecture en infobulle, errata',
        param: 'densities.124',
      },
      {
        text: '% Critique, par point (30 est la valeur Rétro, écart de version ; réserve : la lecture en jeu reste à consigner dans les observations) :',
        status: SP,
        source: 'lecture en jeu Unity, errata',
        param: 'densities.18',
      },
      {
        text: 'Le poids des runes est affiché en infobulle depuis la 2.58.',
        status: SP,
        source: 'changelog 2.58 relayé par JeuxOnLine',
      },
    ],
    uncertain: [
      {
        text: 'Les densités des autres caractéristiques (PA, PM, Portée, Invocations, Force, Agilité, Chance, Intelligence, Sagesse, Dommages, % Dommages…) viennent de tables 2.x convergentes, non revérifiées sur Unity.',
        status: HC,
        source: 'tables communautaires 2.x, errata',
      },
      {
        text: 'Pods, par point (les rapports divergent d’un facteur 10) :',
        status: CT,
        source: 'paramètre densities.40',
        param: 'densities.40',
      },
      {
        text: 'Renvoi de dommages : 5 lu en jeu, contre 10 dans les tables 2.x. Valeur retenue :',
        status: CT,
        source: 'paramètre densities.50 ; croisement densités/reliquat 2026-09-07',
        param: 'densities.50',
      },
      {
        text: 'Fuite : 4 contre 5 (5 est probablement la valeur Rétro 1.49). Valeur retenue :',
        status: CT,
        source: 'paramètre densities.78',
        param: 'densities.78',
      },
      {
        text: 'Tacle : 4 contre 5 (5 est probablement la valeur Rétro 1.49). Valeur retenue :',
        status: CT,
        source: 'paramètre densities.79',
        param: 'densities.79',
      },
      {
        text: 'L’API DofusDB expose-t-elle les densités ? Une analyse du 2026-09-23 dit oui (champ effectPowerRate, vérifié par appel API), la documentation du projet dit non. Extraction proposée, non validée.',
        status: CT,
        source: 'analyse simulateur 2026-09-23 ; empirical_params.json ; errata',
      },
      {
        text: 'La liste exacte des poids modifiés par le changelog 2.29.',
        status: IN,
        source: 'errata',
      },
      {
        text: 'Densité divisée par 2 pour les stats négatives : témoignage, non intégré au simulateur.',
        status: HC,
        source: 'témoignage relevé dans l’analyse simulateur 2026-09-23',
      },
    ],
    dossierSections: ['densities'],
  },

  // ---------------------------------------------------------------- 2. Chances : SC, SN, EC
  {
    id: 'chances',
    title: 'Chances : SC, SN, EC',
    brief: [
      {
        text: 'Trois issues : succès critique (SC), succès neutre (SN), échec critique (EC).',
        status: SP,
        source: 'tutoriel Ankama ; DevBlog 2010 (v1.27)',
      },
      {
        text: 'La formule du serveur n’est pas publiée : le simulateur utilise des modèles réglables, pas la vraie formule, et le modèle lui-même est inconnu.',
        status: IN,
        source: 'paramètre params.probability.model',
      },
      {
        text: 'En forgemagie normale, le SC ne descend jamais sous 15 %, hors over et exo.',
        status: SP,
        source: 'tutoriel Ankama (src/logic/probability/constraints.ts)',
      },
      {
        text: 'Ajouter un PA ou un PM exotique : le SC « peut descendre jusqu’à 1 % ».',
        status: SP,
        source: 'tutoriel Ankama, verbatim relayé (src/logic/probability/constraints.ts)',
      },
    ],
    steps: [
      {
        text: 'Le modèle choisi calcule une chance de SC à partir de la distance au jet max ; les autres facteurs sont câblés mais à pente nulle pour l’instant. Modèle actif :',
        status: IN,
        source: 'paramètres params.probability.model et officialFactorsLinear',
        param: 'params.probability.model',
      },
      {
        text: 'Le reste (1 − SC) va d’abord au SN, jusqu’à 50 % ; l’EC prend le reste. Modèle dérivé de quatre triplets du DevBlog 2010 et d’un relevé d’Alterya (2012).',
        status: ME,
        source: 'paramètre params.probability.snSplit ; DevBlog 2010 (v1.27)',
        param: 'params.probability.snSplit',
      },
      {
        text: 'Si la tentative crée ou étend un exo lourd, le SC est épinglé à 1 %, sans SN. Utiliser ce plancher comme valeur est un choix de projet.',
        status: HC,
        source: 'paramètres params.probability.heavyExoCharacteristics et heavyExoEcShare',
      },
      {
        text: 'Un exo léger n’a pas de chiffre : le simulateur affiche un intervalle entre 1/0/99 et 32/50/18, et le tirage utilise la borne haute (choix de projet).',
        status: IN,
        source: 'paramètre params.probability.unknownIntervalSampling',
        param: 'params.probability.unknownIntervalSampling',
      },
      {
        text: 'Enfin, les bornes officielles (15 % ; 1 %) sont appliquées par-dessus tout modèle.',
        status: SP,
        source: 'tutoriel Ankama (src/logic/probability/constraints.ts)',
      },
    ],
    example: {
      title: 'Exo PM sur Gelano',
      lines: [
        'Dasech (forum dofus.com, 25/11/2024, bêta Dofus 3) : 100 exos PM en 8 949 runes = 1,117 % (IC95 [0,89 % ; 1,34 %]).',
        'Fek (vidéo, 19/01/2023, Dofus 2) : 111 exos en 10 000 runes = 1,11 %.',
        'Poolé : 1,11 %, IC95 ≈ 0,96–1,26 %.',
        'Objet simple ; le forum n’a pas pu être relu directement (erreur 403).',
        'Le 1 % du moteur est une constante codée, pas un paramètre.',
      ],
      status: ME,
      source: 'relevés Dasech et Fek (N = 8 949 et 10 000), recherche 2026-09-23',
    },
    certain: [
      {
        text: 'Plancher de SC 15 % en forgemagie normale, « hors tentative d’overmax ou de forgemagie exotique ».',
        status: SP,
        source: 'tutoriel Ankama, errata',
      },
      {
        text: 'Ce plancher ne vaut que pour une ligne naturelle qui reste ≤ son jet max après la rune (lecture du tutoriel).',
        status: SP,
        source: 'tutoriel Ankama, errata',
      },
      {
        text: '1 % est atteignable pour un exo PA ou PM (verbatim recoupé par deux relais, pas lu sur dofus.com).',
        status: SP,
        source: 'tutoriel Ankama relayé, errata',
      },
      {
        text: 'Exo PM sur Gelano : 1,11 % mesuré (N = 8 949 et 10 000).',
        status: ME,
        source: 'relevés Dasech et Fek, errata',
      },
      {
        text: '2ᵉ point de % Dommages aux sorts (rune Do Per So) en exo : aucun SN, SC mesuré sur 10 000 à 15 000 runes (bêta 3.6) :',
        status: ME,
        source: 'paramètre params.probability.cumulativeRegimeSc',
        param: 'params.probability.cumulativeRegimeSc',
      },
      {
        text: 'Répartition SN = min(50 %, 1 − SC) : elle reproduit les triplets 66/34/0, 43/50/7, 15/50/35, 32/50/18 et Alterya 30/50/20.',
        status: ME,
        source: 'paramètre params.probability.snSplit (ajusté sur 4 triplets du DevBlog 2010 et un relevé d’Alterya)',
      },
      {
        text: 'Les cinq triplets Ankama : 66/34/0, 43/50/7, 15/50/35, 32/50/18, 1/0/99 (règle de 2010, transposition à Unity non vérifiée).',
        status: SP,
        source: 'DevBlog 2010 (v1.27)',
      },
      {
        text: 'Facteurs de difficulté, par importance : qualité globale de l’objet (hors ligne visée), puis qualité du jet modifié, puis niveau. Aussi : palier à 80 % de la fourchette, objets à un seul jet plus faciles, objets éthérés plus difficiles, plus d’over/exo = plus dur. Leur existence seulement (règle de 2010, transposition à Unity non vérifiée).',
        status: SP,
        source: 'DevBlog 2010 (v1.27)',
      },
      {
        text: 'Un jet fixe est exempté du palier de 80 % (règle de 2010, transposition à Unity non vérifiée) :',
        status: SP,
        source: 'DevBlog 2010 (v1.27) ; paramètre params.probability.structuralFactors.fixedRollExempt',
        param: 'params.probability.structuralFactors.fixedRollExempt',
      },
    ],
    uncertain: [
      {
        text: 'Le modèle actif et tous ses coefficients.',
        status: IN,
        source: 'paramètres params.probability.model et officialFactorsLinear',
      },
      {
        text: 'Que 1 % soit LA valeur d’un exo lourd : le tutoriel dit seulement « peut descendre jusqu’à ». L’appliquer comme valeur est un choix de projet.',
        status: HC,
        source: 'paramètre params.probability.heavyExoCharacteristics ; errata',
      },
      {
        text: 'Portée et Invocations dans la liste des exos lourds (Ankama ne les nomme pas).',
        status: HC,
        source: 'paramètre params.probability.heavyExoCharacteristics ; errata',
      },
      {
        text: 'Partage 0 % SN / 99 % EC en exo lourd.',
        status: HC,
        source: 'paramètre params.probability.heavyExoEcShare',
      },
      {
        text: 'Où tombe un exo léger entre 1/0/99 et 32/50/18.',
        status: IN,
        source: 'paramètre params.probability.unknownIntervalSampling',
      },
      {
        text: 'Le plancher de 15 % vaut-il sur un objet qui porte déjà un over ou un exo ? Trois témoignages 2.x (2021) parlent de « 2-3 % » ; proposition en attente.',
        status: HC,
        source: 'témoignages relevés dans l’analyse simulateur 2026-09-23',
      },
      {
        text: 'Les pentes des facteurs de 2010 (palier 80 %, un seul jet, éthéré, nombre d’over/exo, qualité globale).',
        status: IN,
        source: 'paramètres params.probability.structuralFactors et officialFactorsLinear.e',
      },
      {
        text: 'Le SC du régime « poids cumulé » dépend de la qualité de l’objet (0,8 % sur objet parfait, N = 1 000) : modèle partiel, non intégré au simulateur.',
        status: ME,
        source: 'paramètre params.probability.cumulativeRegimeSc (note)',
      },
      {
        text: 'Le reliquat influe-t-il sur la probabilité ? Aucune source ne l’affirme.',
        status: IN,
        source: 'note exo léger 2026-09-14 ; audit du PDF',
      },
      {
        text: 'Les triplets 34/50/16 et 1/22/77 sont réfutés par le billet original de 2010. Un doute (billet peut-être modifié entre 2009 et 2010) a été noté, puis la proposition de les rouvrir abandonnée.',
        status: SP,
        source: 'DevBlog 2010 (v1.27) ; errata ; analyse simulateur 2026-09-23',
      },
    ],
    dossierSections: ['probability'],
  },

  // ---------------------------------------------------------------- 3. Pertes et reliquat
  {
    id: 'pertes',
    title: 'Pertes et reliquat',
    brief: [
      { text: 'En SC : la rune passe, rien n’est perdu.', status: SP, source: 'moteur (src/logic/engine/applyRune.ts)' },
      {
        text: 'En SN : la rune passe, et l’objet perd un poids égal à celui de la rune, ligne visée comprise.',
        status: SP,
        source: 'observations en jeu 2026-09-09, errata',
      },
      {
        text: 'En EC : la rune ne passe pas, et l’objet perd exactement le poids de la rune.',
        status: SP,
        source: 'observations en jeu 2026-09-09, errata',
      },
      {
        text: 'Quand on perd plus que prévu, le surplus devient le reliquat, affiché en jeu.',
        status: SP,
        source: 'observation en jeu 2026-09-10 ; paramètre params.residualPool.visibleInClient',
      },
    ],
    steps: [
      {
        text: 'La perte à payer = poids de la rune (en SN comme en EC).',
        status: SP,
        source: 'moteur (src/logic/engine/applyRune.ts), errata',
      },
      {
        text: 'Le simulateur fait payer le reliquat d’abord ; la vraie règle est inconnue.',
        status: IN,
        source: 'paramètre params.residualPool.poolConsumptionRule',
        param: 'params.residualPool.poolConsumptionRule',
      },
      {
        text: 'Une loi choisit la ligne qui paie (loi supposée) ; la ligne visée peut payer, après son gain (observé en jeu). Loi active :',
        status: HC,
        source: 'paramètre params.lossSelection.strategy ; errata',
        param: 'params.lossSelection.strategy',
      },
      {
        text: 'On retire des points entiers : le plus petit nombre qui couvre la perte, parfois un point de plus quand le compte tombe juste (N = 6). Chance du point de plus :',
        status: ME,
        source: 'paramètres params.lossSelection.quantization et exactRatioExtraPointChance',
        param: 'params.lossSelection.exactRatioExtraPointChance',
      },
      {
        text: 'Nouveau reliquat = (reliquat + poids perdu) − poids de la rune (vérifié sur deux tentatives).',
        status: SP,
        source: 'observation en jeu 2026-09-10',
      },
    ],
    example: {
      title: 'Cape Bouffante, 2026-09-08',
      lines: [
        'Client 3.6.10.11. Objet : Vitalité 36–40, Initiative 151–200.',
        'Rune Vi (+5 Vitalité, poids 1 = 5 × densité Vitalité). Issue : SN.',
        'Avant (déduit, non lu) : Vitalité 37, Initiative 166, reliquat 0.',
        'Après : Vitalité 42 (en over), Initiative 155 (−11 = 1,1 de poids avec la densité Initiative), reliquat affiché 0,1.',
        '1,1 − 1 = 0,1 : le surplus devient le reliquat. Le minimum aurait été 10 Initiative ; le jeu en a retiré 11.',
        'Affichage du reliquat : SOURCE PRIMAIRE. Loi de quantité perdue : MODÈLE EMPIRIQUE.',
      ],
      status: ME,
      source: 'data/observations/observations.json, captures 2026-09-08',
      params: [
        'densities.11',
        'densities.44',
        'params.lossSelection.quantization',
        'params.lossSelection.exactRatioExtraPointChance',
      ],
    },
    certain: [
      {
        text: 'EC = poids de la rune exactement (10,0 sur deux Ra Vi), réparti sur plusieurs lignes si besoin.',
        status: SP,
        source: 'observations en jeu 2026-09-09, errata',
      },
      {
        text: 'EC impayable : il retire tout ce qui reste puis s’arrête (−30 vita = 6,0 pour 10 demandés). Sans aucune ligne ni reliquat : « Échec » sans effet, rune consommée.',
        status: SP,
        source: 'observations en jeu 2026-09-09, errata',
      },
      {
        text: 'La ligne visée perd après son gain (SN Ra Vi : +50 brut, −28 vita −44 ini = 10,0, net +22).',
        status: SP,
        source: 'observations en jeu 2026-09-09, errata',
      },
      {
        text: 'Le reliquat est affiché dans l’interface et dans l’historique (« + reliquat » / « − reliquat »).',
        status: SP,
        source: 'observations en jeu 2026-09-08 et 2026-09-10',
      },
      {
        text: 'Formule du reliquat vérifiée sur un SN (Ini → −6 Vita → 0,2) et un EC (Pa Vi → −31 Ini → 0,1).',
        status: SP,
        source: 'observation en jeu 2026-09-10',
      },
      {
        text: 'Un point de plus quand la perte est un multiple exact de la densité : 4 cas sur 6 (IC95 ≈ 0,30–0,90). Probabilité retenue :',
        status: ME,
        source: 'paramètre params.lossSelection.exactRatioExtraPointChance (N = 6)',
        param: 'params.lossSelection.exactRatioExtraPointChance',
      },
      {
        text: 'Un bonus peut redescendre à 0 ; un malus ne peut perdre que s’il est overmaxé, jamais au-delà du malus naturel (règle de 2010, transposition à Unity non vérifiée).',
        status: SP,
        source: 'DevBlog 2010 (v1.27), errata',
      },
    ],
    uncertain: [
      {
        text: 'Quelle ligne perd : la loi par défaut épargne les lignes trop lourdes (tendance tirée de témoignages) ; ses pentes et son plancher sont inventés pour respecter ces témoignages.',
        status: IN,
        source: 'paramètres params.lossSelection.strategy et deficitRatio ; errata',
      },
      {
        text: 'Priorité aux lignes over/exo lors des pertes. Indice contraire : dans la série de Dasech, l’exo PM n’a été perdu que 2 fois.',
        status: HC,
        source: 'paramètre params.lossSelection.prioritizeOverExo ; analyse simulateur 2026-09-23',
        param: 'params.lossSelection.prioritizeOverExo',
      },
      {
        text: 'Ordre reliquat / over-exo : le simulateur fait payer le reliquat d’abord, Tofus dit l’inverse.',
        status: IN,
        source: 'paramètre params.residualPool.poolConsumptionRule ; analyse simulateur 2026-09-23',
      },
      {
        text: 'Anomalie du 2026-09-10 : un EC avec un reliquat de 0,2 a laissé le reliquat inchangé ; la loi de quantité actuelle l’explique sans mécanisme nouveau (N = 1).',
        status: IN,
        source: 'observation en jeu 2026-09-10, errata',
      },
      {
        text: 'Le reliquat est-il purgé à l’équipement, en HDV ou à l’échange ?',
        status: HC,
        source: 'paramètre params.residualPool.resetOnEquipOrMarket',
        param: 'params.residualPool.resetOnEquipOrMarket',
      },
      {
        text: 'SN impayable : « rien ne se passe » selon le DevBlog 2010, jamais observé sur Unity ; ce que devient la rune est inconnu.',
        status: IN,
        source: 'DevBlog 2010 (v1.27) ; paramètre params.lossSelection.unpayableSn',
      },
      {
        text: '« Le reliquat absorbera en partie les échecs futurs » dit le DevBlog 2010 ; le simulateur, lui, l’absorbe en totalité.',
        status: CT,
        source: 'DevBlog 2010 (v1.27) contre le code du simulateur',
      },
      {
        text: 'Le mécanisme serveur réel de la quantité perdue (un arrondi en nombres flottants est plausible).',
        status: IN,
        source: 'paramètre params.lossSelection.quantization (note)',
      },
    ],
    dossierSections: ['lossSelection', 'residualPool'],
  },

  // ---------------------------------------------------------------- 4. Over et exo
  {
    id: 'over-exo',
    title: 'Over et exo',
    brief: [
      {
        text: 'Il existe un plafond par ligne (règle de 2010). Ankama donne l’exemple de 101 points de Force sur une base max de 60 ; que 101 soit la vraie valeur n’est pas confirmé.',
        status: HC,
        source: 'DevBlog 2010 (v1.27) ; paramètre params.overCapWeight',
      },
      {
        text: 'Il existe aussi un plafond pour tout l’objet (règle de 2010, il empêche PA + PM exo) ; sa valeur est inconnue.',
        status: IN,
        source: 'DevBlog 2010 (v1.27) ; paramètre params.objectNonNaturalCap',
      },
      {
        text: 'Une ligne qui dépasse son jet d’un poids supérieur ou égal au seuil (PA, PM, PO, Invocations dès le 1ᵉʳ point ; % Dommages au 2ᵉ) ne passe qu’en SC. Seuil :',
        status: HC,
        source: 'paramètres params.probability.heavyExoRule et heavyExoWeightThreshold',
        param: 'params.probability.heavyExoWeightThreshold',
      },
    ],
    steps: [
      {
        text: 'Sur une ligne, le simulateur borne la valeur totale × densité, pas seulement la part over (avec la borne actuelle, par exemple 505 vita ou 101 agilité). Borne par ligne :',
        status: HC,
        source: 'paramètres params.overCapLineBasis et params.overCapWeight',
        param: 'params.overCapWeight',
      },
      {
        text: 'Sur l’objet, il additionne les parts over (valeur − max) et les exos, face au plafond objet. Cette portée est supposée (les sources se contredisent, voir « Pas sûr ») et la valeur du plafond est inconnue. Plafond objet retenu :',
        status: IN,
        source: 'paramètres params.overCapScope et params.objectNonNaturalCap',
        param: 'params.objectNonNaturalCap',
      },
      {
        text: 'Une rune qui dépasserait la borne s’arrête à la borne (Ra Vi sur 480 vita → 505).',
        status: HC,
        source: 'paramètre params.overCapExcess.behaviour',
      },
      {
        text: 'Exo lourd (liste PA, PM, PO, Invocations) : SC épinglé à 1 %, pas de SN (choix de projet).',
        status: HC,
        source: 'paramètre params.probability.heavyExoCharacteristics',
      },
      {
        text: 'Exo atteint par poids cumulé (ex. 2ᵉ point de % Dommages) : pas de SN, SC mesuré :',
        status: ME,
        source: 'paramètre params.probability.cumulativeRegimeSc',
        param: 'params.probability.cumulativeRegimeSc',
      },
    ],
    example: {
      title: 'Cape du Wa Wabbit, vue en HDV le 2026-09-09',
      lines: [
        'Objet niveau 60 : Vitalité 233 pour un jet max de 100, autres lignes au max, aucune transcendance.',
        'Over classique de +133 vita = 26,6 de poids (133 × densité Vitalité), obtenu par succès critiques.',
        'Ce que l’exemple prouve : des over par SC existent, sans plafond lié au niveau.',
        'Ce qu’il ne prouve pas : la valeur de la borne ni sa portée.',
      ],
      status: SP,
      source: 'data/observations/item-snapshots.json, captures 2026-09-09 (objet vu)',
      params: ['densities.11'],
    },
    certain: [
      {
        text: 'Deux plafonds distincts : un par effet et un par objet (règle de 2010, transposition à Unity non vérifiée).',
        status: SP,
        source: 'DevBlog 2010 (v1.27) ; arbitrages 2026-09-10 ; errata',
      },
      {
        text: 'Le plafond par objet empêche d’ajouter PA et PM sur un objet qui n’a ni l’un ni l’autre ; Ankama ne donne pas sa valeur (règle de 2010, transposition à Unity non vérifiée).',
        status: SP,
        source: 'DevBlog 2010 (v1.27) ; paramètre params.objectNonNaturalCap',
      },
      {
        text: 'Over par SC possible, sans plafond lié au niveau (Cape du Wa Wabbit).',
        status: SP,
        source: 'objet vu en HDV 2026-09-09, errata',
      },
      {
        text: 'Les objets « 140 vita » / « 200 vita » vus en HDV sont des Rata Vi, pas la trace d’une limite d’over liée au niveau.',
        status: SP,
        source: 'recherche en HDV 2026-09-09, errata (hypothèse écartée)',
      },
      {
        text: '2ᵉ point de % Dommages aux sorts (rune Do Per So) en exo : aucun SN, SC mesuré :',
        status: ME,
        source: 'paramètre params.probability.cumulativeRegimeSc',
        param: 'params.probability.cumulativeRegimeSc',
      },
    ],
    uncertain: [
      {
        text: 'Valeur du plafond par effet (c’est l’exemple d’Ankama, pas une constante nommée) :',
        status: HC,
        source: 'paramètre params.overCapWeight',
        param: 'params.overCapWeight',
      },
      {
        text: 'Forme exacte du plafond par effet : Ankama borne une somme de deux termes, le simulateur un seul (trois lectures possibles).',
        status: CT,
        source: 'paramètre params.overCapWeight (note) ; errata',
      },
      {
        text: 'Valeur du plafond objet : encadrée entre 100 (inclus) et 190 (exclu) sous trois hypothèses. Valeur posée :',
        status: IN,
        source: 'paramètre params.objectNonNaturalCap',
        param: 'params.objectNonNaturalCap',
      },
      {
        text: 'Portée du plafond, globale ou par ligne : le statut du paramètre dit « hypothèse communautaire », sa note et l’analyse du 2026-09-23 disent « contradiction ». Portée retenue :',
        status: CT,
        source: 'paramètre params.overCapScope ; analyse simulateur 2026-09-23',
        param: 'params.overCapScope',
      },
      {
        text: 'Borne mesurée sur la valeur totale de la ligne :',
        status: HC,
        source: 'paramètre params.overCapLineBasis',
        param: 'params.overCapLineBasis',
      },
      {
        text: 'Arrêt de la rune à la borne (Ra Vi 480 → 505) : lecture d’un joueur, aucune source écrite. Comportement retenu :',
        status: HC,
        source: 'paramètre params.overCapExcess.behaviour ; errata',
        param: 'params.overCapExcess.behaviour',
      },
      {
        text: 'Poids retenu pour la perte d’une rune arrêtée à la borne (rune entière ou part appliquée) :',
        status: IN,
        source: 'paramètre params.overCapExcess.lossBasis',
        param: 'params.overCapExcess.lossBasis',
      },
      {
        text: 'Règle « poids cumulé au-delà du jet » (Fashionista + témoignage de Yanis, aucune source Ankama). Règle retenue :',
        status: HC,
        source: 'paramètre params.probability.heavyExoRule ; note exo léger 2026-09-14',
        param: 'params.probability.heavyExoRule',
      },
      {
        text: 'L’overmax d’une ligne naturelle au-delà du seuil passe-t-il aussi en régime 1 % ?',
        status: IN,
        source: 'paramètre params.probability.heavyExoIncludeOvermax',
        param: 'params.probability.heavyExoIncludeOvermax',
      },
      {
        text: 'Chances d’un exo léger (1ᵉʳ point de % Dommages, etc.).',
        status: IN,
        source: 'paramètre params.probability.unknownIntervalSampling ; note exo léger 2026-09-14',
      },
      {
        text: 'Exo Invocations : la borne par ligne en valeur totale autoriserait 3 invocations exo ; à vérifier en HDV.',
        status: IN,
        source: 'analyse simulateur 2026-09-23',
      },
    ],
    dossierSections: ['overCap', 'objectNonNaturalCap', 'probability'],
  },

  // ---------------------------------------------------------------- 5. Transcendance
  {
    id: 'transcendance',
    title: 'Transcendance',
    brief: [
      {
        text: 'Une rune de transcendance verrouille l’objet : plus de forgemagie, plus d’orbe (valable jusqu’à la 3.6).',
        status: SP,
        source: 'devblog 2.58',
      },
      {
        text: 'Chaque rune de transcendance porte l’effet « Empêche les futures forgemagies » dans les données client.',
        status: SP,
        source: 'données client via DofusDB, errata',
      },
      {
        text: 'Rangs Ta, Pata, Rata ; taux de réussite posé selon le wiki :',
        status: HC,
        source: 'paramètre params.transcendence.successRateByRank',
        param: 'params.transcendence.successRateByRank',
      },
      {
        text: 'Depuis la 3.6, les potions et gravures d’élément restent possibles après transcendance.',
        status: SP,
        source: 'patch note 3.6 du 23/06/2026',
      },
    ],
    steps: [
      {
        text: 'Le simulateur vérifie d’abord le verrou de l’objet.',
        status: SP,
        source: 'devblog 2.58 (src/logic/engine/transcendence.ts)',
      },
      {
        text: 'Il refuse la rune si l’objet a déjà un exo ou un over.',
        status: HC,
        source: 'paramètres params.transcendence.refuseIfExo et refuseIfOver',
      },
      {
        text: 'Il vérifie un seuil de valeur par rang ; aucun n’est renseigné, donc aucun seuil n’est appliqué.',
        status: IN,
        source: 'paramètre params.transcendence.maxCurrentValueByRank',
        param: 'params.transcendence.maxCurrentValueByRank',
      },
      {
        text: 'Il applique la rune comme un SC garanti tant que le taux vaut 100, puis vérifie la borne d’over/exo.',
        status: HC,
        source: 'paramètre params.transcendence.successRateByRank',
      },
    ],
    example: {
      title: 'Recherche en HDV, 2026-09-09',
      lines: [
        'Des objets « 140 vita » (Cape Bouffante, max 40) et « 200 vita » (Abracapa Ancestrale, max 100) sont des Rata Vi (+100 vita, rune 20569).',
        'Leur statut « Empêche les futures forgemagies » est affiché.',
        'Classé à l’errata « hypothèse écartée, tracée » : l’observation écarte l’idée d’une limite d’over liée au niveau.',
      ],
      status: SP,
      source: 'recherche en HDV (Yanis) consignée à l’errata',
    },
    certain: [
      {
        text: 'Objet transcendé : plus de forgemagie ni de réinitialisation par orbe (valable jusqu’à la 3.6).',
        status: SP,
        source: 'devblog 2.58, errata',
      },
      { text: 'Le verrou porte sur l’objet entier, pas sur une seule ligne.', status: SP, source: 'errata' },
      {
        text: 'Effet 2825 « Empêche les futures forgemagies » sur chaque rune ; l’effet 2827 « % de chances de réussite » est renvoyé à 0 par l’API.',
        status: SP,
        source: 'données client relayées par DofusDB, errata',
      },
      {
        text: 'Potions et gravures d’élément autorisées après transcendance depuis la 3.6.',
        status: SP,
        source: 'patch note 3.6 du 23/06/2026',
      },
    ],
    uncertain: [
      {
        text: 'Refus si un exo ou un over est déjà présent.',
        status: HC,
        source: 'paramètres params.transcendence.refuseIfExo et refuseIfOver',
      },
      {
        text: 'Seuils de valeur par rang (ex. Initiative 610 / 410 / 210 selon Gamosaurus).',
        status: IN,
        source: 'paramètre params.transcendence.maxCurrentValueByRank',
      },
      {
        text: 'Taux de réussite de 100 % par rang.',
        status: HC,
        source: 'paramètre params.transcendence.successRateByRank',
      },
      {
        text: '3.7 (patch note bêta du 17/09/2026) : l’orbe réinitialise un objet transcendé et retire la transcendance. Règle bêta, susceptible de changer, pas encore appliquée : le simulateur garde le verrou de la 2.58.',
        status: SP,
        source: 'patch note 3.7 bêta du 17/09/2026',
      },
    ],
    dossierSections: ['transcendence'],
  },

  // ---------------------------------------------------------------- 6. Jet de craft et orbes
  {
    id: 'craft-orbes',
    title: 'Jet de craft et orbes régénérants',
    brief: [
      {
        text: 'Un objet crafté reçoit sur chaque ligne une valeur tirée dans l’intervalle affiché.',
        status: SP,
        source: 'tutoriel Ankama relayé, cité par params.craft.rollDistribution',
      },
      {
        text: 'La loi de ce tirage n’est pas publique ; faute de mieux, le simulateur utilise :',
        status: IN,
        source: 'paramètre params.craft.rollDistribution',
        param: 'params.craft.rollDistribution',
      },
      {
        text: 'Un orbe remet l’objet à un jet de craft aléatoire et purge over, exo et reliquat.',
        status: HC,
        source: 'guides communautaires (src/logic/engine/orb.ts)',
      },
      {
        text: 'Pas d’orbe sur un objet transcendé (règle 2.58, remise en cause par la 3.7 bêta).',
        status: SP,
        source: 'devblog 2.58 ; patch note 3.7 bêta',
      },
    ],
    steps: [
      { text: 'L’orbe est refusé si l’objet est transcendé.', status: SP, source: 'devblog 2.58 (src/logic/engine/orb.ts)' },
      { text: 'Les lignes exotiques sont retirées.', status: HC, source: 'guides communautaires (src/logic/engine/orb.ts)' },
      {
        text: 'Chaque ligne naturelle est retirée dans son intervalle, selon la loi choisie.',
        status: IN,
        source: 'paramètre params.craft.rollDistribution',
      },
      { text: 'Le reliquat est remis à 0.', status: HC, source: 'guides communautaires (src/logic/engine/orb.ts)' },
    ],
    example: null,
    certain: [
      {
        text: 'Refus de l’orbe sur un objet transcendé (valable jusqu’à la 3.6).',
        status: SP,
        source: 'devblog 2.58, errata',
      },
    ],
    uncertain: [
      {
        text: 'Loi du jet de craft : uniforme ; une loi « triangulaire » est proposée sans source, pour test.',
        status: IN,
        source: 'paramètre params.craft.rollDistribution ; errata',
      },
      {
        text: 'Purge de l’over, de l’exo et du reliquat par l’orbe.',
        status: HC,
        source: 'guides communautaires (src/logic/engine/orb.ts)',
      },
      {
        text: '3.7 bêta : l’orbe réinitialise complètement un objet même transcendé et retire la transcendance (bêta, susceptible de changer).',
        status: SP,
        source: 'patch note 3.7 bêta du 17/09/2026',
      },
    ],
    dossierSections: ['craft'],
  },

  // ---------------------------------------------------------------- 7. Brisage
  {
    id: 'brisage',
    title: 'Brisage',
    brief: [
      {
        text: 'Le brisage transforme les lignes d’un objet en runes, selon le poids de chaque ligne, le niveau et un coefficient du serveur.',
        status: HC,
        source: 'calculateurs open source (src/logic/brisage/brisage.ts)',
      },
      {
        text: 'La formule vient de deux calculateurs open source et du forum officiel ; elle n’est pas exacte.',
        status: HC,
        source: 'paramètre params.brisage.levelFactor',
      },
      {
        text: 'Avec un focus, la ligne visée compte en entier, les autres pour une part :',
        status: HC,
        source: 'paramètre params.brisage.focusOtherLinesFactor',
        param: 'params.brisage.focusOtherLinesFactor',
      },
    ],
    steps: [
      {
        text: 'Pour chaque ligne : valeur × densité × niveau × un facteur de niveau, plus un terme constant. Facteur de niveau :',
        status: HC,
        source: 'paramètres params.brisage.levelFactor et constantOffset',
        param: 'params.brisage.levelFactor',
      },
      {
        text: 'Le résultat est multiplié par le coefficient du serveur / 100.',
        status: HC,
        source: 'calculateurs open source (empirical_params.json, section brisage)',
      },
      {
        text: 'Puis divisé par le poids d’une rune de la ligne pour obtenir un nombre de runes.',
        status: HC,
        source: 'calculateurs open source (src/logic/brisage/brisage.ts)',
      },
      {
        text: 'Pods : la valeur est d’abord divisée par un diviseur, sans justification écrite. Diviseur :',
        status: IN,
        source: 'paramètre params.brisage.podsDivisor',
        param: 'params.brisage.podsDivisor',
      },
      {
        text: 'PA, PM, PO et Invocations avec une valeur entre 0 et 1 sont comptés 1.',
        status: HC,
        source: 'paramètre params.brisage.forceOneForActionStats',
      },
    ],
    example: null,
    certain: [],
    uncertain: [
      {
        text: 'Facteur de niveau, soutenu par deux dépôts, le forum officiel et « Enpreur » :',
        status: HC,
        source: 'paramètre params.brisage.levelFactor ; analyse simulateur 2026-09-23',
        param: 'params.brisage.levelFactor',
      },
      {
        text: 'Terme constant ajouté par ligne, mêmes sources :',
        status: HC,
        source: 'paramètre params.brisage.constantOffset',
        param: 'params.brisage.constantOffset',
      },
      {
        text: 'Écart avec le jeu dans 34 cas sur 200 (erreur max 7 %), relevé de Papycha non vérifié.',
        status: HC,
        source: 'paramètre params.brisage.levelFactor (note)',
      },
      {
        text: 'Les formules KamelAkar et Next-Stage sont incompatibles (confiance faible).',
        status: HC,
        source: 'analyse simulateur 2026-09-23',
      },
      {
        text: 'Diviseur des Pods :',
        status: IN,
        source: 'paramètre params.brisage.podsDivisor',
        param: 'params.brisage.podsDivisor',
      },
      {
        text: 'Pods non focalisés divisés ou non (Icksir oui, KamelAkar non). Choix retenu :',
        status: CT,
        source: 'paramètre params.brisage.podsDivisorOnNonFocusLines',
        param: 'params.brisage.podsDivisorOnNonFocusLines',
      },
      {
        text: 'Lignes nulles ou négatives : ignorées (KamelAkar) ou comptées + 1 (Icksir). Choix retenu :',
        status: CT,
        source: 'paramètre params.brisage.nonPositiveLineContribution',
        param: 'params.brisage.nonPositiveLineContribution',
      },
      {
        text: 'Part des autres lignes en focus :',
        status: HC,
        source: 'paramètre params.brisage.focusOtherLinesFactor',
        param: 'params.brisage.focusOtherLinesFactor',
      },
    ],
    dossierSections: ['brisage'],
  },

  // ---------------------------------------------------------------- 8. Potions
  {
    id: 'potions',
    title: 'Potions',
    brief: [
      {
        text: 'Les potions changent l’élément des dommages neutres d’une arme, en gardant une part des dégâts (mécanisme décrit par les tables 2.x).',
        status: HC,
        source: 'paramètre params.potions.damageKeptPercentByLevel',
      },
      {
        text: 'Sur Unity : deux paliers seulement (niveau 20 et niveau 80), aucun taux affiché.',
        status: SP,
        source: 'observation en jeu 2026-09-08, errata',
      },
      {
        text: 'Le taux est contesté : le module potions reste désactivé.',
        status: CT,
        source: 'paramètre params.potions.damageKeptPercentByLevel',
      },
    ],
    steps: [
      {
        text: 'Aucune valeur n’est codée : le simulateur ne calcule rien pour les potions.',
        status: CT,
        source: 'paramètre params.potions.damageKeptPercentByLevel (note)',
      },
      {
        text: 'Anciennes tables : 50 / 65 / 80 % (Rétro / 2.x) ; « 65 % supprimé en 3.1, armes converties à 85 % » selon le wiki.',
        status: HC,
        source: 'tables Rétro / 2.x et wiki, cités par params.potions.damageKeptPercentByLevel',
      },
      {
        text: 'Patch note 3.7 bêta (17/09/2026) : les potions à 85 % passent à 100 %, celles à 50 % à 10 % (bêta, susceptible de changer).',
        status: SP,
        source: 'patch note 3.7 bêta du 17/09/2026',
      },
    ],
    example: {
      title: 'Observation en jeu, 2026-09-08',
      lines: [
        'Client 3.6.10.11 (Yanis). 8 potions dans le dataset, deux paliers.',
        'Niveau 20 : Étincelle, Crachin, Courant d’Air, Secousse.',
        'Niveau 80 : Incendie, Tsunami, Ouragan, Séisme.',
        'L’infobulle Unity n’affiche aucun taux, l’API non plus.',
      ],
      status: SP,
      source: 'observation en jeu 2026-09-08, captures data/observations/captures/2026-09-08',
      params: ['params.potions.damageKeptPercentByLevel'],
    },
    certain: [
      {
        text: 'Deux paliers (20 et 80) sur Unity ; le palier 50 des tables 2.x n’existe pas.',
        status: SP,
        source: 'observation en jeu 2026-09-08, errata',
      },
      { text: 'Aucun taux affiché dans l’infobulle Unity.', status: SP, source: 'observation en jeu 2026-09-08, errata' },
      {
        text: 'Potions utilisables après transcendance depuis la 3.6.',
        status: SP,
        source: 'patch note 3.6 du 23/06/2026',
      },
    ],
    uncertain: [
      {
        text: 'Pourcentage de dégâts conservés par palier :',
        status: CT,
        source: 'paramètre params.potions.damageKeptPercentByLevel',
        param: 'params.potions.damageKeptPercentByLevel',
      },
      {
        text: 'Les nombres 85 / 50 sont-ils des taux de conversion (et non de réussite) ? L’analyse du 2026-09-23 le lit ainsi d’après la 3.7 bêta ; un wiki de 2016 (confiance faible) parlait de « 50/65/80 = % de dégâts conservés pour 50/35/20 % de réussite ». Pas encore réconcilié avec les deux paliers 20/80.',
        status: CT,
        source: 'analyse simulateur 2026-09-23 ; wiki-dofus 2016',
      },
      {
        text: 'Règles 3.7 (100 % / 10 %) : bêta, proposition non validée.',
        status: SP,
        source: 'patch note 3.7 bêta du 17/09/2026',
      },
    ],
    dossierSections: ['potions'],
  },
];

/** Parcours d'une rune (fiche § « Parcours d'une rune », pipeline de référence de CLAUDE.md). */
export const RUNE_PATH: RunePathStep[] = [
  {
    label: 'Lire l’objet',
    detail: 'Le simulateur lit les lignes, leur valeur et le reliquat de l’objet.',
    sectionId: 'poids',
  },
  {
    label: 'Peser la rune et vérifier les limites',
    detail:
      'Il calcule le poids de la rune, refuse si l’objet est transcendé, et (hypothèse du simulateur) arrête la rune à la borne d’over/exo si besoin.',
    sectionId: 'over-exo',
  },
  {
    label: 'Tirer l’issue',
    detail: 'Un modèle donne les chances de SC, SN et EC, puis les bornes officielles (15 % ; 1 %) s’appliquent.',
    sectionId: 'chances',
  },
  {
    label: 'Appliquer le résultat',
    detail:
      'SC : la rune passe ; SN : la rune passe et une perte est due ; EC : la rune ne passe pas et une perte est due.',
    sectionId: 'chances',
  },
  {
    label: 'Choisir les pertes',
    detail: 'Dans le simulateur, le reliquat paie d’abord (ordre réel inconnu), puis une loi choisit les lignes qui perdent et combien de points.',
    sectionId: 'pertes',
  },
  {
    label: 'Mettre à jour',
    detail: 'Le surplus perdu devient le nouveau reliquat, et l’objet est enregistré.',
    sectionId: 'pertes',
  },
];

/**
 * Chemin de paramètre → « ce qu'il faudrait observer en jeu » (fiche § « Aide-nous à mesurer »).
 * Seuls les paramètres dont un protocole est documenté figurent ici ; pour les autres,
 * le composant affiche « protocole non documenté ».
 */
export const MEASUREMENTS: Record<string, string> = {
  'params.objectNonNaturalCap':
    'Un exo PA (100) et un exo PO (51) coexistent-ils sur un même objet ? Si oui, la borne basse remonte à 151 et 101 est réfuté. Test à mener en HDV.',
  'params.overCapExcess.lossBasis': 'À trancher par observation en jeu (protocole détaillé non documenté).',
  'params.lossSelection.deficitRatio.heavyExponent':
    'Objet Vi + Fo + PA, reliquat 0, runes de poids 1, au moins 300 pertes relevées : une loi uniforme toucherait le PA ≈ 33 % du temps, ce modèle ≈ 2 %.',
  'params.lossSelection.deficitRatio.lightExponent':
    'Même expérience : objet Vi + Fo + PA, reliquat 0, au moins 300 pertes relevées.',
  'params.lossSelection.deficitRatio.floor': 'Même expérience : objet Vi + Fo + PA, reliquat 0, au moins 300 pertes relevées.',
  'params.residualPool.poolConsumptionRule': 'Environ 20 EC sur un objet à reliquat non nul, avec relevé avant/après.',
  'params.transcendence.maxCurrentValueByRank':
    'À extraire des effets 2825/2826/2827 du client Unity (datamining, pas une observation en jeu).',
  'params.craft.rollDistribution': 'Un relevé de jets bruts (journal d’observations) pourrait trancher.',
  'params.probability.model':
    'Comparer le modèle avec des observations réelles (journal d’observations) ; protocole de collecte : lignes à 25/50/75/90/100 % du jet, 2 000 tentatives par état.',
  'params.probability.unknownIntervalSampling':
    'Au moins 100 tentatives par rang de point (1ᵉʳ, 2ᵉ, 3ᵉ), avec un décompte SC / SN / EC séparé, sur % Dommages distance ou sorts, objet bas niveau à une ou deux lignes, reliquat lu avant chaque tentative.',
  'params.probability.officialFactorsLinear.a': 'Lignes à 25/50/75/90/100 % du jet, 2 000 tentatives par état.',
  'params.probability.officialFactorsLinear.b': 'Lignes à 25/50/75/90/100 % du jet, 2 000 tentatives par état.',
  'params.probability.officialFactorsLinear.d':
    'À estimer par le journal d’observations (N documenté) : tentatives avec 0, 10, 50, 90 et 100 de poids non naturel sur l’objet.',
  'params.probability.structuralFactors.palier80':
    'Lignes à 25/50/75/90/100 % du jet, 2 000 tentatives par état, pour tester l’hypothèse d’un seuil à 80 %.',
  'params.brisage.podsDivisor': '100 brisages par configuration.',
  'params.brisage.podsDivisorOnNonFocusLines': '100 brisages par configuration, en faisant varier le focus.',
  'params.brisage.nonPositiveLineContribution': '100 brisages par configuration, en faisant varier les malus.',
  'params.potions.damageKeptPercentByLevel':
    'Dégâts d’une arme avant et après potion, pour chaque palier (20 et 80), sur deux armes de fourchettes différentes. Deux mesures par palier suffisent.',
  'densities.40': 'Lecture en infobulle consignée dans les observations ; extraction depuis l’API (effectPowerRate) proposée, non validée.',
  'densities.50': 'EC ou SN contrôlé sur une ligne Renvoi : lire la densité perdue (déjà 5 côté joueur), à confirmer sur N tentatives.',
  'densities.78': 'Lecture en infobulle, à consigner dans les observations avant de changer le statut.',
  'densities.79': 'Lecture en infobulle, à consigner dans les observations avant de changer le statut.',
};
