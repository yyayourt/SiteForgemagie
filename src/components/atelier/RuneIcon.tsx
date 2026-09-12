import { getStatCategory } from '../../data/statCaps';
import { getStatColorClasses } from '../../data/statColors';
import { RuneGlyph } from './RuneGlyph';

interface Props {
  characteristicId: number;
  /** Icône DofusDB de la rune (RuneOption.img / RuneTierInfo.img) */
  img?: string;
  size?: number;
  title?: string;
  className?: string;
}

/**
 * Icône d'une rune : image DofusDB (api.dofusdb.fr, mêmes données tierces que les icônes
 * d'objets) dans un médaillon teinté par famille de caractéristique — voir statColors.ts
 * pour le statut de cette teinte. Si l'icône est absente du dataset, retombe sur le glyphe
 * SVG original de secours (RuneGlyph) plutôt que de laisser un vide.
 */
export function RuneIcon({ characteristicId, img, size = 30, title, className = '' }: Props) {
  const { border, bgSoft } = getStatColorClasses(characteristicId);
  return (
    <span
      className={`relative inline-grid place-items-center rounded-[9px] border overflow-hidden shrink-0 ${border} ${bgSoft} ${className}`}
      style={{ width: size, height: size }}
      title={title}
      role={title ? 'img' : undefined}
      aria-label={title}
    >
      {img ? (
        <img
          src={img}
          alt=""
          width={size}
          height={size}
          className="w-full h-full object-contain p-[3px]"
          loading="lazy"
        />
      ) : (
        <RuneGlyph category={getStatCategory(characteristicId)} size={Math.round(size * 0.62)} />
      )}
    </span>
  );
}
