/**
 * Glossaire de la page Savoir. Source unique : docs/superpowers/specs/2026-09-23-savoir-faits.md
 * (§ Glossaire). Terme à statuts mêlés → statut le plus faible, nuance dans la définition.
 * Pas de statut pour une simple définition ou un outil du projet.
 */
import type { EpistemicStatus } from '../data/params';

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  status?: EpistemicStatus;
}

export const GLOSSARY: GlossaryEntry[] = [
  {
    id: 'densite',
    term: 'Densité',
    definition:
      'Poids d’un point d’une caractéristique (ex. Vitalité 0,2, Initiative 0,1). Affichée en jeu dans l’infobulle des runes ; chaque valeur a son propre statut dans le Dossier.',
    status: 'SOURCE PRIMAIRE',
  },
  {
    id: 'poids-ligne',
    term: 'Poids d’une ligne',
    definition: 'Valeur de la ligne × sa densité.',
    status: 'SOURCE PRIMAIRE',
  },
  {
    id: 'poids-rune',
    term: 'Poids d’une rune',
    definition:
      'Ce que la rune ajoute × la densité (Rune Pa Vi +15 = 3). C’est aussi la perte à payer en SN ou en EC.',
    status: 'SOURCE PRIMAIRE',
  },
  {
    id: 'poids-inventaire',
    term: 'Poids d’inventaire (weight / realWeight)',
    definition:
      'Le poids en pods d’un objet dans l’inventaire, sans rapport avec la densité de forgemagie. Les documents du projet ne s’accordent pas sur le sens exact de realWeight (pods d’inventaire ou poids brisage/économie). Ne jamais l’utiliser comme densité.',
    status: 'CONTRADICTION',
  },
  {
    id: 'jet',
    term: 'Jet (min, max, jet parfait)',
    definition:
      'Intervalle [min, max] d’une ligne ; le jet parfait = la ligne à son max. Le jet de craft est la valeur tirée dans cet intervalle à la fabrication ; la loi de ce tirage est inconnue.',
    status: 'INCONNU',
  },
  {
    id: 'over',
    term: 'Over (overmax)',
    definition: 'Ligne naturelle au-dessus de son jet max.',
  },
  {
    id: 'exo',
    term: 'Exo (exotique)',
    definition: 'Ligne absente du patron de l’objet, ajoutée par forgemagie.',
  },
  {
    id: 'exo-lourd',
    term: 'Exo lourd',
    definition:
      'Exo qui ne passe qu’en SC : PA, PM, PO, Invocations, ou toute ligne dont la part au-delà du jet pèse 30 ou plus après la rune. 1 % pour la liste (atteignable pour PA/PM selon le tutoriel), 3,4 % mesuré pour le poids cumulé ; la règle elle-même est une hypothèse communautaire.',
    status: 'HYPOTHÈSE COMMUNAUTAIRE',
  },
  {
    id: 'exo-leger',
    term: 'Exo léger',
    definition:
      'Exo sous le seuil de 30 (ex. 1ᵉʳ point de % Dommages). Chances entre 1/0/99 et 32/50/18 ; le simulateur tire à 32/50/18.',
    status: 'INCONNU',
  },
  {
    id: 'borne-101',
    term: 'Borne des 101 (plafond par effet)',
    definition:
      'Limite du poids d’une ligne en over ou en exo. Son existence vient du DevBlog 2010, qui donne l’exemple de 101 Force sur une base 60 ; la valeur 101 et la base de mesure sont supposées. Le simulateur borne la valeur totale × densité (505 vita).',
    status: 'HYPOTHÈSE COMMUNAUTAIRE',
  },
  {
    id: 'plafond-objet',
    term: 'Plafond par objet',
    definition:
      'Limite du total over + exo sur tout l’objet ; il empêche PA + PM exo. Valeur non donnée par Ankama.',
    status: 'INCONNU',
  },
  {
    id: 'reliquat',
    term: 'Reliquat (puits serveur)',
    definition:
      'Poids perdu en trop lors d’une perte, gardé par le serveur et affiché en jeu ; il paie une partie des pertes suivantes. Existence, affichage et formule de création : observés en jeu ; façon dont il est consommé : inconnue.',
    status: 'INCONNU',
  },
  {
    id: 'budget-poids',
    term: 'Budget de poids (planification)',
    definition:
      'Calcul de l’atelier à partir des lignes visibles (« combien je libère, combien je consomme »). Ce n’est pas le reliquat serveur : c’est un outil du projet.',
  },
  {
    id: 'sc',
    term: 'SC (succès critique)',
    definition: 'La rune passe, sans perte.',
    status: 'SOURCE PRIMAIRE',
  },
  {
    id: 'sn',
    term: 'SN (succès neutre)',
    definition:
      'La rune passe, et l’objet perd le poids de la rune, ligne visée comprise. Au plus 50 % de chances selon le DevBlog 2010 (règle de 2010, transposition à Unity non vérifiée).',
    status: 'SOURCE PRIMAIRE',
  },
  {
    id: 'ec',
    term: 'EC (échec critique)',
    definition: 'La rune ne passe pas, et l’objet perd exactement le poids de la rune.',
    status: 'SOURCE PRIMAIRE',
  },
  {
    id: 'transcendance',
    term: 'Transcendance',
    definition:
      'Rune (Ta, Pata, Rata) qui ajoute des points et verrouille l’objet : plus de forgemagie ni d’orbe (jusqu’à la 3.6, devblog 2.58). Le refus sur objet over/exo et le taux de 100 % sont des hypothèses communautaires.',
    status: 'HYPOTHÈSE COMMUNAUTAIRE',
  },
  {
    id: 'orbe',
    term: 'Orbe régénérant',
    definition:
      'Objet qui remet un équipement à un jet de craft aléatoire ; refusé sur un objet transcendé (jusqu’à la 3.6, règle officielle). La purge over/exo/reliquat est une hypothèse communautaire.',
    status: 'HYPOTHÈSE COMMUNAUTAIRE',
  },
  {
    id: 'brisage',
    term: 'Brisage',
    definition: 'Destruction d’un objet pour obtenir des runes, selon le poids des lignes, le niveau et un coefficient du serveur.',
    status: 'HYPOTHÈSE COMMUNAUTAIRE',
  },
  {
    id: 'focus',
    term: 'Focus',
    definition: 'Option du brisage : la ligne choisie compte en entier, les autres pour une fraction (réglable dans le Dossier).',
    status: 'HYPOTHÈSE COMMUNAUTAIRE',
  },
];
