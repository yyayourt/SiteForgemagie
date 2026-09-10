/**
 * Prose de la page « État des connaissances ». Règle d'écriture : expliquer le mécanisme
 * sans citer de chiffre non tagué ; toute valeur vient des tableaux générés depuis
 * empirical_params.json, avec son statut.
 */

export interface KnowledgeSection {
  id: string;
  title: string;
  /** Sections du registre de paramètres affichées sous la prose */
  paramSections: string[];
  prose: string[];
  /** Ce qui est certain (SOURCE PRIMAIRE), codé en dur et testé */
  certain?: string[];
}

export const KNOWLEDGE_SECTIONS: KnowledgeSection[] = [
  {
    id: 'poids',
    title: 'Le poids des lignes',
    paramSections: ['densities'],
    prose: [
      "Chaque caractéristique d'un objet porte une densité : un poids par point. Le poids d'une ligne est sa valeur multipliée par cette densité, et le poids d'une rune est ce qu'elle ajoute multiplié par la même densité.",
      "Les densités sont affichées dans l'infobulle des runes du client depuis la refonte de l'interface, ce qui en fait en principe une donnée primaire. Elles n'ont pas encore été réextraites du client : le tableau ci-dessous vient de tables communautaires convergentes, et quelques valeurs se contredisent entre sources.",
      "L'API DofusDB, dont vient le dataset local, n'expose aucune densité : ne pas confondre avec le poids d'inventaire ni avec le poids économique du brisage.",
    ],
  },
  {
    id: 'reliquat',
    title: 'Le reliquat et les pertes',
    paramSections: ['residualPool', 'lossSelection'],
    prose: [
      "Quand une rune passe en succès neutre, l'objet perd un poids égal à celui de la rune. Quand elle échoue, il perd du poids sans recevoir la rune. Une perte est d'abord absorbée par le reliquat, puis retirée sur une ligne par points entiers ; le surplus retiré au-delà de la perte demandée devient le nouveau reliquat, qui n'est jamais négatif.",
      "Le reliquat est un état du serveur, affiché par le client Unity dans l'interface de forgemagie et son historique, observation datée à l'appui, et distinct du budget de poids que calcule l'atelier à partir des lignes visibles. Sa purge lorsque l'objet quitte l'atelier est rapportée par des guides, sans preuve directe.",
      "Quelle ligne perd ? Aucune expérience publiée ne le dit. Le simulateur propose plusieurs lois interchangeables, avec ou sans priorité aux lignes en over et aux exotiques, et le tirage est reproductible par graine. Deux choses sont en revanche observées en jeu : la ligne visée par la rune peut elle-même perdre, une fois son gain appliqué, et un échec critique retire exactement le poids de la rune, sur plusieurs lignes si besoin, ou tout ce qui reste quand l'objet ne peut plus payer. La quantité retirée sur une ligne en succès neutre, elle, dépasse parfois le minimum nécessaire sans loi connue.",
      "Le plancher officiel de succès critique ne vaut que pour une ligne naturelle qui reste sous son jet maximal : une tentative d'over ou un exotique n'ont aucun plancher connu, et le modèle peut y descendre à zéro.",
    ],
    certain: [
      "Trois issues existent : succès critique, succès neutre, échec critique (tutoriel officiel).",
      "Un succès critique applique la rune sans perte.",
      "Un échec critique retire exactement le poids de la rune, ligne visée comprise (observations en jeu du 2026-09-09).",
      "La ligne visée par la rune est candidate à la perte après application de son gain (observations en jeu du 2026-09-09).",
    ],
  },
  {
    id: 'over',
    title: 'Over, exotique et plafond',
    paramSections: ['overCap'],
    prose: [
      "Une ligne au-dessus de son jet maximal est un over ; une ligne absente du patron de l'objet est un exotique. Une borne pratique de poids ajouté est largement attestée par les guides récents. Sa portée est un paramètre : par défaut, le simulateur additionne la part over de chaque ligne (valeur moins jet maximal, fois densité) et le poids des exotiques sur tout l'objet, lecture cumulée que suggèrent les exemples d'un guide récent où deux lignes se partagent la borne et où l'on conseille de lisser un over avant de tenter un exotique. La lecture par ligne reste disponible ; un objet observé avec un exotique PA et un over de deux points de poids sur une autre ligne réfuterait la lecture cumulée.",
      "Sur une ligne, la borne s'applique à la valeur totale de la ligne en over, pas seulement à ce qui dépasse le jet maximal : une vitalité plafonne au même total quelle que soit la base de l'objet, et une ligne dont le jet naturel pèse déjà plus que la borne ne peut plus être montée en over. C'est la lecture d'un joueur expérimenté de la phrase du guide, l'autre lecture reste disponible en paramètre. Quand une rune amènerait la ligne au-delà de la borne, le simulateur l'arrête à la borne au lieu de la refuser, lecture d'un joueur expérimenté, avec l'excédent perdu ; le poids retenu pour la perte d'une rune ainsi tronquée, rune entière ou part appliquée, reste inconnu et paramétré. Les plafonds affichés dans l'atelier en découlent, diminués de ce que les autres lignes consomment déjà : des maxima arithmétiques, pas nécessairement des limites de jeu. La jauge « over/exo utilisé » de la balance montre le cumul face à la borne.",
    ],
  },
  {
    id: 'transcendance',
    title: 'Runes de transcendance',
    paramSections: ['transcendence'],
    prose: [
      "Une rune de transcendance se pose sans perte et verrouille l'objet : plus aucune forgemagie, plus aucune réinitialisation par orbe. Ce verrou vient du devblog officiel et est codé en dur.",
      "Le refus lorsqu'un exotique ou un over est déjà présent, les seuils de valeur par rang et le taux de réussite par rang restent des hypothèses ou des inconnues : les runes portent bien dans le client un effet de chances de réussite, mais l'API renvoie une valeur vide.",
    ],
    certain: [
      "Objet transcendé : plus de forgemagie ni d'orbe (devblog de la mise à jour 2.58).",
      "Chaque rune de transcendance porte l'effet « Empêche les futures forgemagies » dans les données client.",
    ],
  },
  {
    id: 'brisage',
    title: 'Brisage',
    paramSections: ['brisage'],
    prose: [
      "Le brisage convertit chaque ligne en runes selon son poids, le niveau de l'objet et un coefficient propre au serveur. La formule utilisée est celle de deux calculateurs open source, cohérente avec la formule du forum officiel ; un auteur communautaire rapporte des écarts avec le jeu, ce qui en fait un modèle empirique et non une règle.",
      "Avec un focus, la ligne visée compte en entier et les autres pour une fraction. Les deux dépôts divergent sur le traitement des lignes nulles et des pods : ces écarts sont exposés comme des paramètres plutôt que tranchés en silence.",
    ],
  },
  {
    id: 'probabilite',
    title: 'La probabilité de réussite',
    paramSections: ['probability'],
    prose: [
      "La formule du serveur est secrète et n'existe dans aucun dépôt public. Le simulateur ne la reproduit pas : il propose des modèles paramétrés, tous marqués inconnus, et affiche chaque estimation avec le badge « modèle empirique » et le nom du modèle actif.",
      "Deux valeurs sont officielles et appliquées après tout modèle : un plancher de succès critique en forgemagie normale, et un taux bien plus bas pour les exotiques PA, PM et PO, auquel le simulateur se tient sans jamais proposer mieux. Le devblog de deux mille dix énumère six facteurs de difficulté, dans un ordre d'importance explicite : la qualité globale de l'objet d'abord, hors ligne visée, puis la proximité du jet maximal, puis le niveau de l'objet, avec un palier franc à quatre-vingts pour cent de la fourchette, une exemption pour les jets fixes, un bonus de facilité aux objets à un seul jet, une pénalité aux objets éthérés, et le nombre d'over et d'exotiques déjà présents, ligne visée comprise cette fois. Le modèle porte tous ces facteurs, avec des pentes nulles : rien ne bouge tant qu'un relevé ne les aura pas mesurées, et les facteurs structurels sont tenus à l'écart des paramètres ajustés pour qu'un ajustement ne les emporte pas avec lui.",
      "Le facteur le plus important selon Ankama, la qualité globale de l'objet, manquait au modèle jusqu'au dix septembre. C'est lui, et non un mauvais réglage, qui explique l'écart entre ce que le simulateur annonce sur une ligne presque au maximum et le chiffre publié par Ankama : le modèle ne pouvait pas distinguer une ligne parfaite sur un objet simple d'une ligne parfaite sur un objet entièrement parfait, alors que le devblog leur donne des chances très différentes.",
      "Une création d'effet ne reçoit plus d'estimation ponctuelle. Pour un exotique PA, PM ou PO, le taux officiel s'applique tel quel. Pour tout autre exotique, le simulateur affiche un intervalle et le dit inconnu : le devblog donne la meilleure et la pire création d'effet possibles, mais rien ne dit où se place une tentative donnée entre les deux, et inventer cette position produirait un chiffre faussement précis sur l'opération la plus coûteuse du jeu.",
      "Le journal d'observations en jeu est la seule voie pour faire passer un paramètre au statut de modèle empirique.",
    ],
    certain: [
      "Plancher officiel de succès critique en forgemagie normale, hors over et exotique (tutoriel officiel).",
      "Taux officiel bien plus bas pour les exotiques PA, PM et PO, appliqué comme plafond autant que comme plancher (tutoriel officiel).",
      "Le succès neutre ne dépasse jamais la moitié des chances (devblog 1.27).",
      "Un succès neutre impossible ne fait rien : ni gain, ni perte, ni reliquat (devblog 1.27).",
    ],
  },
  {
    id: 'potions',
    title: 'Potions de forgemagie',
    paramSections: ['potions'],
    prose: [
      "Les potions changent l'élément des dommages neutres d'une arme en conservant une part des dégâts. Sur Unity, l'infobulle des potions ne montre aucun taux et l'API n'en fournit pas ; le dataset ne compte que deux paliers, alors que les tables anciennes en décrivaient trois avec des pourcentages qui divergent selon la version. Aucune valeur n'est donc posée par défaut : le module reste désactivé tant qu'une mesure en jeu, dommages avant et après potion, n'aura pas fixé le taux de chaque palier.",
    ],
  },
  {
    id: 'orbes',
    title: 'Jet de craft et orbes régénérants',
    paramSections: ['craft'],
    prose: [
      "Un objet crafté reçoit sur chaque ligne une valeur tirée dans l'intervalle affiché par le jeu. La loi de ce tirage n'est pas publique : le simulateur l'expose comme un paramètre, uniforme par défaut faute de mieux, avec une loi de rechange sans source pour tester une hypothèse. La même fonction sert au bouton « Jet aléatoire » de l'enclume, qui ne touche pas au reliquat, et l'indicateur de qualité du jet mesure la position pondérée par densité dans ces intervalles.",
      "Un orbe remet l'objet à un jet de craft aléatoire et purge over, exotiques et reliquat, selon les guides. Le refus sur un objet transcendé est, lui, une règle officielle.",
    ],
    certain: [
      "Objet transcendé : aucune réinitialisation par orbe (devblog de la mise à jour 2.58).",
    ],
  },
];
