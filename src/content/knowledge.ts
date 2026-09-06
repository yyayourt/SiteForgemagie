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
    paramSections: ['residualPool', 'lossSelection', 'ecLoss'],
    prose: [
      "Quand une rune passe en succès neutre, l'objet perd un poids égal à celui de la rune. Quand elle échoue, il perd du poids sans recevoir la rune. Une perte est d'abord absorbée par le reliquat, puis retirée sur une ligne par points entiers ; le surplus retiré au-delà de la perte demandée devient le nouveau reliquat, qui n'est jamais négatif.",
      "Le reliquat est un état du serveur, invisible ou non selon les sources, et distinct du budget de poids que calcule l'atelier à partir des lignes visibles. Sa purge lorsque l'objet quitte l'atelier est rapportée par des guides, sans preuve directe.",
      "Quelle ligne perd ? Aucune expérience publiée ne le dit. Le simulateur propose plusieurs lois interchangeables, avec ou sans priorité aux lignes en over et aux exotiques, et le tirage est reproductible par graine. La quantité perdue lors d'un échec critique n'est documentée nulle part : c'est un paramètre posé pour faire tourner la simulation.",
    ],
    certain: [
      "Trois issues existent : succès critique, succès neutre, échec critique (tutoriel officiel).",
      "Un succès critique applique la rune sans perte.",
    ],
  },
  {
    id: 'over',
    title: 'Over, exotique et plafond',
    paramSections: ['overCap'],
    prose: [
      "Une ligne au-dessus de son jet maximal est un over ; une ligne absente du patron de l'objet est un exotique. Une borne pratique de poids ajouté est largement attestée par les guides récents, mais sa nature exacte, par ligne ou en cumul sur l'objet, n'est pas tranchée : le simulateur l'expose comme un paramètre et refuse toute tentative qui la dépasserait.",
      "Les plafonds par caractéristique affichés dans l'atelier sont de simples divisions de cette borne par la densité : des maxima arithmétiques, pas nécessairement des limites de jeu.",
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
      "Deux bornes sont officielles et appliquées après tout modèle : un plancher de succès critique en forgemagie normale, et un plancher bien plus bas pour les exotiques PA, PM et PO. Les seuls facteurs cités par Ankama sont le niveau de l'objet et la proximité du jet maximal ; le modèle par défaut n'utilise que ces deux facteurs.",
      "Le journal d'observations en jeu est la seule voie pour faire passer un paramètre au statut de modèle empirique.",
    ],
    certain: [
      "Plancher officiel de succès critique en forgemagie normale, hors over et exotique (tutoriel officiel).",
      "Plancher officiel plus bas pour les exotiques PA, PM et PO (tutoriel officiel).",
    ],
  },
  {
    id: 'potions',
    title: 'Potions de forgemagie',
    paramSections: [],
    prose: [
      "Les potions changent l'élément des dommages neutres d'une arme en conservant une part des dégâts. Les sources se contredisent sur cette part depuis une mise à jour récente, et l'API ne la fournit pas : le module n'est pas modélisé tant qu'un datamining ne l'aura pas tranchée. Le dataset liste les potions existantes.",
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
