import { useState } from 'react';
import {
  STAT_CAPS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type StatCapCategory,
} from '../data/statCaps';

// ─── Petits composants utilitaires ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-dofus-panel border border-dofus-gold/20 rounded-xl p-5 space-y-3">
      <h2 className="text-lg font-bold text-dofus-gold border-b border-dofus-gold/20 pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

function RuleBox({
  type,
  children,
}: {
  type: 'info' | 'warning' | 'danger' | 'success';
  children: React.ReactNode;
}) {
  const styles = {
    info: 'bg-blue-900/20 border-blue-500/30 text-blue-200',
    warning: 'bg-yellow-900/20 border-yellow-500/30 text-yellow-200',
    danger: 'bg-red-900/20 border-red-500/30 text-red-200',
    success: 'bg-green-900/20 border-green-500/30 text-green-200',
  };
  return (
    <div className={`border rounded-lg px-4 py-3 text-sm leading-relaxed ${styles[type]}`}>
      {children}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{label}</span>
  );
}

// ─── Tableau des caps par catégorie ──────────────────────────────────────────

function CapsTable({ category }: { category: StatCapCategory }) {
  const entries = Object.entries(STAT_CAPS).filter(
    ([, cap]) => cap.category === category
  );

  if (entries.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-dofus-gold/15">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-dofus-dark text-gray-400 text-left">
            <th className="px-4 py-2 font-medium">Caractéristique</th>
            <th className="px-4 py-2 font-medium text-center">Poids / pt</th>
            <th className="px-4 py-2 font-medium text-center">Max over/exo</th>
            <th className="px-4 py-2 font-medium text-center">Statut</th>
            <th className="px-4 py-2 font-medium hidden md:table-cell">Note</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([effectId, cap]) => {
            const isAbsoluteCap = cap.hardCapOne || cap.absoluteMax !== undefined;
            return (
              <tr
                key={effectId}
                className="border-t border-dofus-gold/10 hover:bg-dofus-dark/50 transition-colors"
              >
                <td className="px-4 py-2.5 font-medium text-white">{cap.statName}</td>
                <td className="px-4 py-2.5 text-center font-mono text-gray-300">
                  {cap.weightPerPoint}
                </td>
                <td className="px-4 py-2.5 text-center font-mono font-bold">
                  {cap.hardCapOne ? (
                    <span className="text-red-400">+1 max absolu</span>
                  ) : (
                    <span className="text-over">+{cap.maxOverOrExo}</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-center">
                  {cap.hardCapOne ? (
                    <Badge label="IMPOSSIBLE ×2" color="bg-red-900/40 text-red-300" />
                  ) : isAbsoluteCap ? (
                    <Badge label="Cap absolu" color="bg-yellow-900/40 text-yellow-300" />
                  ) : (
                    <Badge label="Règle 101" color="bg-dofus-dark text-gray-400" />
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-gray-500 hidden md:table-cell max-w-xs">
                  {cap.absoluteMaxReason ?? cap.note ?? '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function TheoryGuide() {
  const [openCategory, setOpenCategory] = useState<StatCapCategory | null>('special');

  return (
    <div className="space-y-5">

      {/* ── Introduction ── */}
      <Section title="Qu'est-ce que la Forgemagie ?">
        <p className="text-sm text-gray-300 leading-relaxed">
          La Forgemagie de Dofus est un système semi‑aléatoire d'optimisation d'objets.
          Elle repose sur trois piliers : le <span className="text-dofus-gold font-medium">poids des caractéristiques</span>,
          le <span className="text-dofus-gold font-medium">puits (reliquat)</span> et les
          <span className="text-dofus-gold font-medium"> types de jets</span>.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {[
            { label: 'Classique', desc: 'Monter les stats vers le jet parfait', color: 'border-gray-500/40 text-gray-300' },
            { label: 'Overmage', desc: 'Dépasser le jet parfait (ex. 220/200 vita)', color: 'border-over/40 text-over' },
            { label: 'Exotique (Exo)', desc: 'Ajouter une stat absente de l\'item (PA, PM, PO…)', color: 'border-exo/40 text-exo' },
            { label: 'Transcendance', desc: 'Bonus puissants — requiert 0 over/exo pré-existant', color: 'border-dofus-gold/40 text-dofus-gold' },
          ].map(({ label, desc, color }) => (
            <div key={label} className={`bg-dofus-dark rounded-lg p-3 border ${color}`}>
              <div className="font-bold text-sm mb-1">{label}</div>
              <div className="text-xs text-gray-400">{desc}</div>
            </div>
          ))}
        </div>
        <RuleBox type="info">
          <strong>Sources :</strong> Les règles ci-dessous sont empiriques — Ankama ne publie pas
          les formules internes. Ces valeurs proviennent de milliers de tests communautaires
          (Dofus 2.x / Unity).
        </RuleBox>
      </Section>

      {/* ── Règle des 101 ── */}
      <Section title="La Règle Fondamentale : les 101 poids (par ligne)">
        <RuleBox type="warning">
          <strong>⚠ Important :</strong> Le cap des 101 s'applique <strong>par ligne de stat</strong>,
          pas en cumul sur tout l'item. Chaque ligne over ou exo est <strong>indépendante</strong> des autres.
        </RuleBox>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            Au-delà du jet parfait, chaque point de stat supplémentaire consomme du <em>poids de densité</em>.
            Une ligne ne peut pas accumuler plus de <strong className="text-dofus-gold">101 poids</strong> au-delà de son maximum naturel.
          </p>
          <div className="bg-dofus-dark rounded-lg p-4 font-mono text-sm">
            <div className="text-gray-400 mb-2">// Formule :</div>
            <div className="text-green-300">Max over ou exo = floor(101 ÷ poids_par_point)</div>
            <div className="mt-3 text-gray-400">// Exemples :</div>
            <div className="text-blue-300">Vitalité  : floor(101 ÷ 0.2) = <span className="text-white font-bold">505 vita</span> max over</div>
            <div className="text-blue-300">Sagesse   : floor(101 ÷ 3  ) = <span className="text-white font-bold">33 sag</span>  max over</div>
            <div className="text-blue-300">% Rés.    : floor(101 ÷ 6  ) = <span className="text-white font-bold">16%</span>    max over</div>
            <div className="text-blue-300">CC        : floor(101 ÷ 10 ) = <span className="text-white font-bold">10 CC</span>  max over</div>
            <div className="text-red-300">PA        : floor(101 ÷ 100) = <span className="text-white font-bold">1 PA</span>   → 2 PA = 200 &gt; 101 ❌</div>
            <div className="text-red-300">PO        : floor(101 ÷ 51 ) = <span className="text-white font-bold">1 PO</span>   → 2 PO = 102 &gt; 101 ❌</div>
          </div>
          <div className="grid md:grid-cols-2 gap-3 pt-2">
            <RuleBox type="success">
              <strong>✅ Possible :</strong> PA (native, 100p) + exo PM (90p) + over vita (+50 vita = 10p)
              <br /><span className="text-xs opacity-75">3 lignes séparées, chacune &lt; 101</span>
            </RuleBox>
            <RuleBox type="danger">
              <strong>❌ Impossible :</strong> 2 PA sur un même item (100 + 100 = 200 &gt; 101)
              <br /><strong>❌ Impossible :</strong> 2 PO sur un même item (51 + 51 = 102 &gt; 101)
            </RuleBox>
          </div>
        </div>
      </Section>

      {/* ── Limites par stat (tableaux) ── */}
      <Section title="Limites Absolues par Caractéristique">
        <p className="text-sm text-gray-400">
          Clique sur une catégorie pour voir les détails. Le <span className="text-over font-bold">+X max</span> représente
          le maximum pouvant être ajouté <strong>au-dessus</strong> du jet parfait de l'item (over ou exo).
        </p>
        <div className="space-y-2">
          {CATEGORY_ORDER.map((cat) => {
            const count = Object.values(STAT_CAPS).filter((c) => c.category === cat).length;
            const isOpen = openCategory === cat;
            return (
              <div key={cat} className="border border-dofus-gold/15 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenCategory(isOpen ? null : cat)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-dofus-dark hover:bg-dofus-panel-light transition-colors text-left"
                >
                  <span className="font-semibold text-white">
                    {CATEGORY_LABELS[cat]}
                    <span className="ml-2 text-xs text-gray-500 font-normal">({count} stats)</span>
                  </span>
                  <span className="text-gray-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="p-3">
                    <CapsTable category={cat} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Over vs Exo ── */}
      <Section title="Over vs Exo — Quelle différence ?">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-dofus-dark rounded-lg p-4 border border-over/20">
            <h3 className="font-bold text-over mb-2">OVER (Overmage)</h3>
            <ul className="text-sm text-gray-300 space-y-1.5 list-disc list-inside">
              <li>La stat <strong>existe déjà</strong> sur l'item</li>
              <li>On la pousse <strong>au-delà de son max théorique</strong></li>
              <li>Exemple : item avec 200 vita max → monter à 220 vita</li>
              <li>Probabilités normales SC/SN/EC (dépend du puits)</li>
              <li><span className="text-yellow-300">⚠ Saute en premier</span> en cas de recul (SN/EC)</li>
            </ul>
          </div>
          <div className="bg-dofus-dark rounded-lg p-4 border border-exo/20">
            <h3 className="font-bold text-exo mb-2">EXO (Exotique)</h3>
            <ul className="text-sm text-gray-300 space-y-1.5 list-disc list-inside">
              <li>La stat <strong>n'existe pas</strong> sur l'item nativement</li>
              <li>On <strong>ajoute une ligne entière</strong></li>
              <li>Exemple : ajouter +1 PA à une amulette sans PA</li>
              <li>Pour PA/PM/PO/Invocations : <span className="text-red-300 font-bold">1% SC, 0% SN, 99% EC</span></li>
              <li><span className="text-yellow-300">⚠ Saute en premier</span> en cas de recul</li>
            </ul>
          </div>
        </div>
        <RuleBox type="info">
          <strong>Pourquoi les overs et exos sautent en premier ?</strong><br />
          Lors d'un SN ou d'un EC, le jeu choisit la ligne qui "recule" en prioritisant les lignes
          dépassant leur maximum théorique. C'est un mécanisme pensé pour rendre la forgemagie
          avancée intrinsèquement instable.
        </RuleBox>
      </Section>

      {/* ── Puits ── */}
      <Section title="Le Puits (Reliquat)">
        <p className="text-sm text-gray-300 leading-relaxed">
          Le puits est une <strong className="text-dofus-gold">réserve de densité invisible</strong> stockée sur l'item.
          Il se crée quand une stat chute en dessous de son maximum, et se consomme quand on passe des runes.
        </p>
        <div className="bg-dofus-dark rounded-lg p-4 font-mono text-sm space-y-2">
          <div className="text-gray-400">// Création du puits :</div>
          <div className="text-green-300">Puits gagné = Σ (densité perdue sur chaque ligne)</div>
          <div className="mt-2 text-gray-400">// Exemple :</div>
          <div className="text-blue-300">PO qui saute (-51 densité) → +51 puits</div>
          <div className="text-blue-300">20 Vita perdus (20 × 0.2 = -4 densité) → +4 puits</div>
        </div>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {[
            {
              title: 'Puits positif',
              desc: 'Runes passent plus facilement. SC élevé, EC faible.',
              color: 'text-green-400 border-green-400/20',
            },
            {
              title: 'Puits nul',
              desc: 'Probabilités équilibrées (~50% SC). Risque de recul.',
              color: 'text-yellow-400 border-yellow-400/20',
            },
            {
              title: 'Puits négatif',
              desc: 'Runes passent moins. SC bas, EC élevé. Normal et réaliste en jeu.',
              color: 'text-red-400 border-red-400/20',
            },
          ].map(({ title, desc, color }) => (
            <div key={title} className={`bg-dofus-dark rounded-lg p-3 border ${color}`}>
              <div className={`font-bold mb-1 ${color.split(' ')[0]}`}>{title}</div>
              <div className="text-gray-400 text-xs">{desc}</div>
            </div>
          ))}
        </div>
        <RuleBox type="info">
          Le puits n'est <strong>pas permanent</strong> : il disparaît si l'item est échangé,
          vendu ou remis en stockage. Les stats over "flottent" au-dessus du puits et sont
          consommées en priorité lors des reculs.
        </RuleBox>
      </Section>

      {/* ── Poids des runes ── */}
      <Section title="Poids des Runes — Référence Rapide">
        <p className="text-sm text-gray-400 mb-3">
          Chaque rune a un poids fixe. Une rune normale = 1 poids, Pa = 3 poids, Ra = 10 poids.
          Le poids par <em>point</em> de stat varie selon la caractéristique.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-dofus-gold/15 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-dofus-dark text-gray-400 text-left">
                <th className="px-3 py-2">Stat</th>
                <th className="px-3 py-2 text-center">Poids/pt</th>
                <th className="px-3 py-2 text-center">Rune normale</th>
                <th className="px-3 py-2 text-center">Pa rune</th>
                <th className="px-3 py-2 text-center">Ra rune</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dofus-gold/10">
              {[
                ['PA', 100, '+1 (100p)', '—', '—'],
                ['PM', 90, '+1 (90p)', '—', '—'],
                ['PO', 51, '+1 (51p)', '—', '—'],
                ['Invocations', 30, '+1 (30p)', '—', '—'],
                ['Vitalité', '0.2', '+5 vita (1p)', '+15 vita (3p)', '+50 vita (10p)'],
                ['Force / Int / Agi / Chance', 1, '+1 (1p)', '+3 (3p)', '+10 (10p)'],
                ['Sagesse', 3, '+1 (3p)', '+3 (9p)', '+10 (30p)'],
                ['Prospection', 3, '+1 (3p)', '+3 (9p)', '—'],
                ['Puissance', 2, '+1 (2p)', '+3 (6p)', '+10 (20p)'],
                ['Dommages élémentaires', 5, '+1 (5p)', '+3 (15p)', '—'],
                ['Dommages génériques (Do)', 20, '+1 (20p)', '—', '—'],
                ['% Résistance / élément', 6, '+1 (6p)', '—', '—'],
                ['Résistance fixe / élément', 2, '+1 (2p)', '+3 (6p)', '—'],
                ['Soins / CC / Renvoi', 10, '+1 (10p)', '—', '—'],
                ['Esquive/Retrait PA·PM', 7, '+1 (7p)', '+3 (21p)', '—'],
                ['Tacle / Fuite', 4, '+1 (4p)', '+3 (12p)', '—'],
                ['Initiative', '0.1', '+10 (1p)', '+30 (3p)', '+100 (10p)'],
                ['Pods', '0.25', '+10 (2.5p)', '+30 (7.5p)', '+100 (25p)'],
              ].map(([stat, weight, norm, pa, ra]) => (
                <tr key={stat as string} className="hover:bg-dofus-dark/50 transition-colors">
                  <td className="px-3 py-2 text-white">{stat}</td>
                  <td className="px-3 py-2 text-center font-mono text-gray-300">{weight}</td>
                  <td className="px-3 py-2 text-center font-mono text-gray-300">{norm}</td>
                  <td className="px-3 py-2 text-center font-mono text-gray-400">{pa}</td>
                  <td className="px-3 py-2 text-center font-mono text-gray-500">{ra}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* ── Règles importantes ── */}
      <Section title="Règles Importantes à Connaître">
        <div className="space-y-3 text-sm text-gray-300">
          <RuleBox type="danger">
            <strong>❌ Impossible — Double PA / PM / PO sur un item</strong><br />
            Un item ne peut jamais avoir 2 PA, 2 PM, ou 2 PO. Même si l'item a 1 PA natif,
            ajouter un 2e PA en exo est impossible (100 + 100 = 200 &gt; 101).
            Le PO à 51 a été fixé délibérément par Ankama pour que 51 + 51 = 102 &gt; 101.
          </RuleBox>
          <RuleBox type="success">
            <strong>✅ Possible — PA natif + exo PM sur le même item</strong><br />
            Ce sont deux lignes séparées. PA sur sa ligne (100p) + PM sur sa ligne (90p) =
            deux lignes indépendantes, chacune sous 101. Un Gelano avec PA natif + exo PM
            existe en jeu.
          </RuleBox>
          <RuleBox type="warning">
            <strong>⚠ Transcendance — Contrainte stricte</strong><br />
            Une rune de transcendance ne peut pas être posée sur un item qui a déjà un over
            ou un exo. Elle doit être la première modification "exceptionnelle" de l'item.
          </RuleBox>
          <RuleBox type="info">
            <strong>ℹ % Résistance — Cap à +16% par élément</strong><br />
            16% = 96 poids (ok). 17% = 102 poids &gt; 101 → impossible. Ce cap s'applique
            indépendamment pour chaque élément (Terre, Feu, Eau, Air, Neutre).
          </RuleBox>
          <RuleBox type="info">
            <strong>ℹ Même stat sur deux lignes</strong><br />
            Il est impossible d'avoir 2 lignes séparées de la même stat (ex. 2 lignes "Force")
            sur un item. Le système traite chaque type de caractéristique comme une ligne unique.
          </RuleBox>
        </div>
      </Section>

      {/* ── Disclaimer ── */}
      <div className="text-xs text-gray-600 text-center px-4 pb-2">
        Ces informations sont basées sur des tests communautaires empiriques (Dofus 2.x / Unity).
        Ankama ne publie pas les formules internes. Certaines valeurs peuvent varier légèrement
        selon la version du jeu.
      </div>
    </div>
  );
}
