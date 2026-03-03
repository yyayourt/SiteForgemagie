type AppTab = 'simulator' | 'theory';

interface Props {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
}

export function Header({ activeTab, onTabChange }: Props) {
  return (
    <header className="bg-dofus-panel border-b border-dofus-gold/30 px-6 pt-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-dofus-gold">
          Simulateur de Forgemagie Dofus
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Calcul de puits par item &mdash; Modifie les stats et visualise les overs / exos
        </p>

        {/* Navigation tabs */}
        <div className="flex gap-1 mt-4">
          <TabButton
            label="Simulateur"
            active={activeTab === 'simulator'}
            onClick={() => onTabChange('simulator')}
          />
          <TabButton
            label="Guide Théorique"
            active={activeTab === 'theory'}
            onClick={() => onTabChange('theory')}
          />
        </div>
      </div>
    </header>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors border-t border-x ${
        active
          ? 'bg-dofus-dark border-dofus-gold/30 text-dofus-gold -mb-px'
          : 'bg-transparent border-transparent text-gray-400 hover:text-gray-200'
      }`}
    >
      {label}
    </button>
  );
}
