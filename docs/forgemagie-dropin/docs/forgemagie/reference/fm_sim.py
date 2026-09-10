"""
fm_sim.py — Simulateur de forgemagie DOFUS (implémentation de référence).

Spécification complète : ../ALGORITHME.md
Stdlib uniquement. Python >= 3.8.

Principes de conception
-----------------------
1. Le MODÈLE D'ÉTAT (poids, puits, over/exo, pertes) est solide et testable :
   il est codé de façon déterministe et vérifiable.
2. La FONCTION DE PROBABILITÉ est un modèle empirique. Ankama n'a jamais publié
   la sienne. TOUTES ses constantes vivent dans `ModelParams` et sont faites pour
   être recalibrées (cf. §12 de ALGORITHME.md).
3. Les seules valeurs réellement officielles sont les bornes 1 % / 50 % / 66 %
   et les 5 triplets du DevBlog 1.27. Elles sont imposées comme invariants.

SOURCE PRIMAIRE (10/09/2026)
----------------------------
`DEVBLOG-ANKAMA-ORIGINAL.md` (dans `sources/archive/` côté recherche, à la racine de
`docs/forgemagie/` côté projet) — texte intégral du DevBlog Ankama
« La nouvelle forgemagie », retrouvé sur web.archive.org. C'est la SEULE source
primaire. Les guides communautaires (Yin-Yang, Alterya, forgemagie.net/ExiTeD…)
en dérivent de seconde main et sont parfois FAUTIFS. Corrections imposées :

  * l'ancre « jet parfait » vaut 43/50/7 (et non 34/50/16, relais Yin-Yang) ;
  * le triplet 1/22/77 « exo avec puits » N'EXISTE PAS — invention d'un relais ;
  * 6e ancre inédite : création d'effet AU MIEUX = 32/50/18. La création d'effet
    n'est donc PAS toujours à 1 % : elle couvre 32/50/18 -> 1/0/99. Le 1 % est le
    PLANCHER, pas une constante ;
  * 3 facteurs jamais modélisés : éthéré (plus dur), mono-jet naturel (plus
    facile), nombre d'over/exo sur l'objet (plus dur) — et pour ce dernier le jet
    en cours de modification EST compté, alors qu'il est EXCLU de la qualité ;
  * DEUX plafonds distincts : par effet (PWR non-naturel + PWR actuel <= 101) et
    par objet (« limite fixe de puissance d'effets non-naturels », valeur inconnue) ;
  * SN sur objet mono-jet = rien ne se passe (no-op).

Vocabulaire (notation du DevBlog Ankama 1.27, reprise par les émulateurs) :
    PWRg      poids courant de l'objet
    PWRmax    poids de l'objet à son jet maximal naturel
    PWRmin    poids de l'objet à son jet minimal naturel
    PWRcarac  poids de la ligne visée
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field, replace
from typing import Dict, List, Optional, Sequence, Tuple

# =============================================================================
# 1. TABLES DE POIDS  (coefficient de poids par POINT de stat)
# =============================================================================
# [OBS] dmUtils/RuneWeightEnum.as (module client SmithMagic) + dump serveur
# (lilgallon/dofus-tools). Voir ALGORITHME.md §2.

COEF_BONUS_DOFUS2: Dict[str, float] = {
    "initiative": 0.1,
    "vitalite": 0.2,          # [OBS] Rune Vi = +5 pour un poids 1  (SmithMagic ancien : 0.25)
    "pods": 0.25,
    "force": 1.0, "intelligence": 1.0, "chance": 1.0, "agilite": 1.0,
    "puissance": 2.0,
    "dom_pct": 2.0, "dom_pieges_pct": 2.0,
    "res_air": 2.0, "res_eau": 2.0, "res_feu": 2.0, "res_terre": 2.0,
    "res_neutre": 2.0, "res_poussee": 2.0, "res_critique": 2.0,
    "sagesse": 3.0, "prospection": 3.0,
    "tacle": 4.0, "fuite": 4.0,
    "dom_neutre": 5.0, "dom_feu": 5.0, "dom_air": 5.0, "dom_terre": 5.0,
    "dom_eau": 5.0, "dom_poussee": 5.0, "dom_critique": 5.0,
    "res_pct_air": 6.0, "res_pct_eau": 6.0, "res_pct_feu": 6.0,
    "res_pct_terre": 6.0, "res_pct_neutre": 6.0,
    "esquive_pa": 7.0, "esquive_pm": 7.0, "retrait_pa": 7.0, "retrait_pm": 7.0,
    "dom_pieges": 15.0,
    "dom_pct_melee": 15.0, "dom_pct_distance": 15.0,
    "dom_pct_armes": 15.0, "dom_pct_sorts": 15.0,
    "res_pct_melee": 15.0, "res_pct_distance": 15.0,
    "soins": 10.0,            # [OBS] 10 en 2.x moderne, 15-20 en Rétro/ancien
    "critiques": 10.0,        # [OBS] 10 en 2.x moderne, 30 en Rétro
    "renvoi": 10.0,           # [OBS] 10 en 2.x moderne, 30 en Rétro
    "dommages": 20.0,
    "invocations": 30.0,
    "portee": 51.0,
    "pm": 90.0,
    "pa": 100.0,
    "chasse": -1.0,           # poids NÉGATIF (contradictoire selon les sources : -1 ou +5)
}

# [OBS] Table des MALUS — asymétrique. ~la moitié du bonus, sauf PA/PM/PO et Fo/Int/Cha/Agi.
COEF_MALUS_DOFUS2: Dict[str, float] = {
    "initiative": 0.05,
    "vitalite": 0.2,
    "force": 1.0, "intelligence": 1.0, "chance": 1.0, "agilite": 1.0,
    "res_critique": 1.0,
    "sagesse": 2.0, "prospection": 2.0, "tacle": 2.0, "fuite": 2.0,
    "dom_neutre": 2.5, "dom_feu": 2.5, "dom_air": 2.5, "dom_terre": 2.5, "dom_eau": 2.5,
    "dom_poussee": 3.0,
    "res_pct_air": 3.0, "res_pct_eau": 3.0, "res_pct_feu": 3.0,
    "res_pct_terre": 3.0, "res_pct_neutre": 3.0,
    "esquive_pa": 4.0, "esquive_pm": 4.0, "retrait_pa": 4.0, "retrait_pm": 4.0,
    "res_poussee": 5.0,
    "portee": 51.0, "pm": 90.0, "pa": 100.0,
}

# [CONS] Rétro 1.29 / 1.49 : deltas par rapport à la table Dofus 2.
COEF_BONUS_RETRO: Dict[str, float] = dict(COEF_BONUS_DOFUS2)
COEF_BONUS_RETRO.update({
    "vitalite": 0.25,      # Rune Vi = +3 vita  [CODE] StarLoco/Nao
    "pods": 0.25,
    "critiques": 30.0,
    "soins": 15.0,
    "renvoi": 30.0,
    "tacle": 5.0, "fuite": 5.0,
})

# Stats qui ne peuvent jamais devenir négatives → jamais touchées par une perte. [CODE]
STATS_JAMAIS_PERDUES = frozenset({"retrait_pa", "retrait_pm"})

# Stats exotiques limitées à un exemplaire par objet. [OBS] MàJ 2.3.4
EXO_UNIQUES = frozenset({"pa", "pm", "portee"})


# =============================================================================
# 2. PARAMÈTRES DU MODÈLE  — tout ce qui est incertain vit ici
# =============================================================================

@dataclass
class ModelParams:
    """Tous les paramètres calibrables. Voir ALGORITHME.md §11 (INCERTITUDES)."""

    # --- Tables de poids -----------------------------------------------------
    coef_bonus: Dict[str, float] = field(default_factory=lambda: dict(COEF_BONUS_DOFUS2))
    coef_malus: Dict[str, float] = field(default_factory=lambda: dict(COEF_MALUS_DOFUS2))
    version: str = "dofus2"                  # "dofus2" | "retro"

    # --- Bornes OFFICIELLES (DevBlog 1.27) — ne PAS calibrer -----------------
    p_sc_min: int = 1                        # [OBS] INV-1
    p_sc_max: int = 66                       # [OBS] INV-3
    p_sn_max: int = 50                       # [OBS] INV-2

    # --- Les DEUX plafonds, distincts (DevBlog, §7.1) -----------------------
    # (a) PAR EFFET : « impossible de dépasser un jet naturel maximum si la somme
    #     du power-rate non-naturel et du power-rate actuel de l'effet dépasse une
    #     limite fixe » — ex. 101 points de Force sur un objet dont le max est 60.
    #     C'est de là que sort overmax = floor(101 / coef).            [OBS]
    cap_effet_non_naturel: float = 101.0
    # (b) PAR OBJET : « une limite fixe de puissance d'effets non-naturels, pour
    #     l'intégralité des objets » — celle qui interdit PA + PM sur un objet qui
    #     n'a ni l'un ni l'autre. ⚠️ ANKAMA NE DONNE PAS SA VALEUR.
    #     None = contrainte désactivée (état des connaissances). Un encadrement
    #     grossier se déduit du seul exemple donné : elle laisse passer un PA seul
    #     (poids 100) mais pas PA+PM (poids 190) -> valeur dans [100 ; 190).
    cap_objet_non_naturel: Optional[float] = None

    # --- Formule de probabilité (structure StarLoco) — tout est [SUPP] -------
    facteur_diff: float = 1.3                # U1
    plafond_mstat: float = 1.2               # U2
    seuil_degressif: float = 0.80            # U3 [OBS pour la valeur, SUPP pour la forme]
    penalite_over: float = 0.8               # U5
    coef_exo: float = 0.25                   # U6
    coef_negatif: float = 0.50               # U7  (Ancestra donne 0.75)
    rate_fm: float = 1.0                     # multiplicateur global de difficulté
    exposant_c: float = 1.0                  # exposant appliqué à c   (1.0 = StarLoco pur)
    exposant_mstat: float = 1.0              # exposant appliqué à mStat
    exposant_taille: float = 1.0             # U31 : exposant sur (PWRmax + diff).
                                             # 1.0 = StarLoco brut, qui rend les GROS objets
                                             # plus faciles (a ~ PWRmax, b ~ sqrt(PWRg)) —
                                             # contraire au DevBlog. < 0.5 inverse la tendance.

    # Pondérations du poids de la ligne visée / du poids total  (U8, U9)
    poids_carac_mult_native: float = 1.0
    poids_carac_mult_negative: float = 3.0
    poids_carac_mult_exo: float = 8.0
    poids_objet_mult_native: float = 1.0
    poids_objet_mult_negative: float = 3.0
    poids_objet_mult_exo: float = 2.0

    # --- Facteurs de difficulté du DevBlog jamais modélisés ailleurs --------
    # Tous multiplicatifs sur le numérateur `a`. <1 = plus difficile.
    # [OBS] pour l'EXISTENCE et le SIGNE, [SUPP] pour les valeurs.
    exclure_jet_cible_de_qualite: bool = True
    jet_fixe_ignore_palier: bool = True
    # « Si le bonus a un jet fixe, ce facteur [le palier des 80 %] n'est pas pris
    #   en compte. »                                                       [OBS]
    # « le jet en cours de modification n'est pas pris en compte dans le calcul
    #   de la qualité [globale] »                                        [OBS]
    coef_niveau_objet: float = 0.0           # U32 : a *= (1 - k*niveau/200).
                                             # « La difficulté augmente FAIBLEMENT
                                             #   avec le niveau de l'objet. »  [OBS]
    malus_ethere: float = 1.0                # « les objets éthérés sont plus
                                             #   difficiles » -> < 1            [OBS]
    bonus_mono_jet: float = 1.0              # « les objets disposant naturellement
                                             #   d'un seul jet sont plus faciles »
                                             #   -> > 1                          [OBS]
    penalite_par_over_exo: float = 1.0       # a *= f ** n_over_exo, f <= 1.
                                             # « Plus l'objet dispose d'overmax/
                                             #   bonus exotiques (EN PRENANT EN
                                             #   COMPTE CELUI EN COURS DE
                                             #   MODIFICATION), plus la difficulté
                                             #   augmente. »                     [OBS]

    # --- Règle du ×20 (U10, U11) — absente des émulateurs, ajoutée ici ------
    utiliser_regle_x20: bool = True
    seuil_x20_doux: float = 16.0
    seuil_x20_dur: float = 20.0
    penal_x20: float = 0.35
    exposant_x20: float = 2.0

    # --- Puits (U20, U21, U22) ----------------------------------------------
    # ⚠️ `puits_donne_sn` / `sn_avec_puits` ont été SUPPRIMÉS : le triplet
    #    « 1/22/77 exo avec puits » sur lequel ils reposaient N'EXISTE PAS dans le
    #    DevBlog original. Le puits absorbe « en partie » les échecs futurs ; rien
    #    ne dit qu'il modifie le triplet de probabilité.
    puits_absorption: float = 1.0            # fraction de la perte absorbable par le
                                             # puits (« en partie ») ; 1.0 = totale
    puits_decremente_sur_sc: bool = True     # StarLoco: oui ; SmithMagic: non
    puits_augmente_p_sc: bool = False        # Ancestra: oui (+2*puits au numérateur)
    puits_bonus_starloco: bool = False       # puits >= rune.add -> 50 % de SC forcé
    p_fuite_puits: float = 0.0               # Rétro : pertes malgré un puits suffisant

    # --- Mécanique de perte (U16-U19) ---------------------------------------
    plancher_perte: float = 0.75             # jamais plus de -25 % d'une stat d'un coup
    mult_perte_over: float = 2.0             # double peine sur l'over
    ordre_pertes: str = "communaute"         # "communaute" | "devblog_1_27" | "aleatoire"
    epargner_ligne_ciblee: bool = True
    # « Il est impossible de "puiser" dans les malus […] à moins que ceux-ci ne
    #   soient overmaxés, car ils joueraient souvent le rôle de puits sans fonds. »
    puiser_malus_overmax_seulement: bool = True                        # [OBS]
    # « les malus ne peuvent dépasser le malus maximum naturel »        [OBS]
    plafonner_malus_au_max_naturel: bool = True

    # --- Divers --------------------------------------------------------------
    niveau_metier: int = 100
    metier_influe: bool = False              # True en Rétro uniquement
    starloco_dual_table: bool = False        # reproduire l'incohérence StarLoco (§2.5)

    # ---------------------------------------------------------------------
    def coef(self, stat: str, negative: bool = False) -> float:
        table = self.coef_malus if negative else self.coef_bonus
        if stat in table:
            return table[stat]
        return self.coef_bonus.get(stat, 1.0)

    @property
    def cap_over(self) -> float:
        """Alias historique du plafond PAR EFFET. Ne pas confondre avec le plafond
        PAR OBJET (`cap_objet_non_naturel`), de valeur inconnue."""
        return self.cap_effet_non_naturel

    def overmax(self, stat: str) -> int:
        """Plafond d'over d'une stat, dérivé de floor(101 / coef).  [OBS]

        Découle du plafond PAR EFFET uniquement.
        """
        c = self.coef(stat)
        if c <= 0:
            return 0
        return int(math.floor(self.cap_effet_non_naturel / c + 1e-9))

    @staticmethod
    def retro(**kwargs) -> "ModelParams":
        p = ModelParams(
            coef_bonus=dict(COEF_BONUS_RETRO),
            version="retro",
            metier_influe=True,
            **kwargs,
        )
        return p


# =============================================================================
# 3. MODÈLE D'ÉTAT
# =============================================================================

@dataclass
class Effect:
    """Une ligne d'effet. `jet_max == 0` => la ligne n'existe pas nativement (EXO)."""
    stat: str
    jet_min: int = 0
    jet_max: int = 0
    value: int = 0
    is_negative: bool = False

    def copy(self) -> "Effect":
        return replace(self)

    @property
    def is_exo(self) -> bool:
        return self.jet_max <= 0

    def weight(self, p: ModelParams) -> float:
        return self.value * p.coef(self.stat, self.is_negative)

    def weight_max(self, p: ModelParams) -> float:
        return self.jet_max * p.coef(self.stat, self.is_negative)

    def weight_min(self, p: ModelParams) -> float:
        return self.jet_min * p.coef(self.stat, self.is_negative)

    def over_weight(self, p: ModelParams) -> float:
        """Poids over/exo de la ligne (0 si la ligne est dans sa fourchette naturelle)."""
        return max(0.0, self.weight(p) - self.weight_max(p))

    def is_over(self) -> bool:
        """Sur-jet. Pour un MALUS, « overmaxé » veut dire amélioré au-delà du
        meilleur malus naturel (value < jet_min), pas aggravé au-delà du pire."""
        if self.is_negative:
            return self.value < self.jet_min
        return self.value > self.jet_max


@dataclass
class Rune:
    name: str
    stat: str
    add: int
    tier: int = 1            # 1 = simple, 2 = Pa, 3 = Ra  (informatif)

    def weight(self, p: ModelParams, on_negative_line: bool = False) -> float:
        return self.add * p.coef(self.stat, on_negative_line)


class Item:
    """Un objet forgemageable. `template` porte les jets naturels, `effects` l'état courant."""

    def __init__(self, template: Sequence[Effect], level: int = 100,
                 template_id: int = 0, name: str = "item", ethere: bool = False):
        self.name = name
        self.level = level
        self.ethere = ethere          # « les objets éthérés sont plus difficiles » [OBS]
        self.template_id = template_id
        self.template: List[Effect] = [e.copy() for e in template]
        # état courant : par défaut, au jet minimum
        self.effects: List[Effect] = [e.copy() for e in template]
        for e in self.effects:
            e.value = e.jet_min
        self.puits: float = 0.0

    # -- construction ------------------------------------------------------
    def copy(self) -> "Item":
        it = Item(self.template, self.level, self.template_id, self.name, self.ethere)
        it.effects = [e.copy() for e in self.effects]
        it.puits = self.puits
        return it

    @property
    def mono_jet(self) -> bool:
        """Objet ne disposant NATURELLEMENT que d'un seul jet.  [OBS]"""
        return len(self.template) == 1

    def set_values(self, **values: int) -> "Item":
        for stat, v in values.items():
            e = self.get(stat)
            if e is None:
                tpl = self.template_of(stat)
                e = Effect(stat, tpl.jet_min if tpl else 0, tpl.jet_max if tpl else 0,
                           0, tpl.is_negative if tpl else False)
                self.effects.append(e)
            e.value = v
        self.effects = [e for e in self.effects if e.value >= 1]
        return self

    def to_max(self) -> "Item":
        for e in self.effects:
            e.value = e.jet_max
        return self

    # -- accès -------------------------------------------------------------
    def get(self, stat: str) -> Optional[Effect]:
        for e in self.effects:
            if e.stat == stat:
                return e
        return None

    def template_of(self, stat: str) -> Optional[Effect]:
        for e in self.template:
            if e.stat == stat:
                return e
        return None

    def is_native(self, stat: str) -> bool:
        return self.template_of(stat) is not None

    # -- poids -------------------------------------------------------------
    def pwr_g(self, p: ModelParams, exclure: Optional[str] = None) -> float:
        """Poids courant de l'objet (PWRg), avec les pondérations native/négative/exo.

        `exclure` retire une ligne du total : sert au calcul de la QUALITÉ GLOBALE,
        dont « le jet en cours de modification n'est pas pris en compte ».  [OBS]
        """
        total = 0.0
        for e in self.effects:
            if exclure is not None and e.stat == exclure:
                continue
            if e.is_negative:
                m = p.poids_objet_mult_negative
            elif not self.is_native(e.stat):
                m = p.poids_objet_mult_exo
            else:
                m = p.poids_objet_mult_native
            total += e.weight(p) * m
        return total

    def pwr_max(self, p: ModelParams) -> float:
        return sum(e.weight_max(p) for e in self.template)

    def pwr_min(self, p: ModelParams) -> float:
        return sum(e.weight_min(p) for e in self.template)

    def pwr_carac(self, p: ModelParams, stat: str) -> float:
        e = self.get(stat)
        if e is None:
            return 0.0
        if e.is_negative:
            m = p.poids_carac_mult_negative
        elif not self.is_native(stat):
            m = p.poids_carac_mult_exo
        else:
            m = p.poids_carac_mult_native
        return e.weight(p) * m

    def total_over_weight(self, p: ModelParams) -> float:
        return sum(e.over_weight(p) for e in self.effects)

    def nb_over_exo(self, stat_ciblee: Optional[str] = None, rune_add: int = 0) -> int:
        """Nombre de lignes over ou exotiques, **jet ciblé COMPTÉ** (dans son état
        APRÈS la tentative). C'est le seul endroit où le jet ciblé est inclus :
        il est au contraire EXCLU de la qualité globale (`pwr_g(exclure=…)`).  [OBS]
        """
        n = 0
        for e in self.effects:
            if stat_ciblee is not None and e.stat == stat_ciblee:
                continue
            if e.is_over() or not self.is_native(e.stat):
                n += 1
        if stat_ciblee is not None:
            tpl = self.template_of(stat_ciblee)
            cur = self.get(stat_ciblee)
            apres = (cur.value if cur else 0) + rune_add
            if tpl is None or apres > tpl.jet_max:
                n += 1
        return n

    def poids_non_naturel(self, p: ModelParams) -> float:
        """Puissance totale d'effets NON NATURELS sur l'objet (over + exo).
        C'est la grandeur que borne le plafond PAR OBJET (valeur inconnue)."""
        return sum(e.over_weight(p) if self.is_native(e.stat) else abs(e.weight(p))
                   for e in self.effects)

    def nb_exos_uniques(self) -> int:
        return sum(1 for e in self.effects
                   if e.stat in EXO_UNIQUES and not self.is_native(e.stat))

    def reset_puits(self) -> None:
        """Le puits disparaît si l'objet est équipé / banqué / échangé / à la déco. [CONS]"""
        self.puits = 0.0

    def __repr__(self) -> str:
        lignes = ", ".join(f"{e.stat}={e.value}" for e in self.effects)
        return f"<Item {self.name} [{lignes}] puits={self.puits:.1f}>"


# =============================================================================
# 4. FONCTION DE PROBABILITÉ
# =============================================================================

def fill_ratio(item: Item, rune: Rune, p: ModelParams) -> float:
    """Taux de remplissage `f` du jet visé APRÈS la tentative.

    f <= 0.80  : aucune pénalité
    f  > 0.80  : la difficulté augmente brutalement  [OBS] DevBlog
    f  > 1.00  : over
    """
    tpl = item.template_of(rune.stat)
    cur = item.get(rune.stat)
    value_after = (cur.value if cur else 0) + rune.add

    if tpl is None:                                  # ligne EXOTIQUE
        w = value_after * p.coef(rune.stat)
        return 1.0 + w / p.cap_effet_non_naturel
    if tpl.jet_max > tpl.jet_min:
        return (value_after - tpl.jet_min) / float(tpl.jet_max - tpl.jet_min)
    if tpl.jet_max > 0:                              # JET FIXE (min == max)
        if p.jet_fixe_ignore_palier and value_after <= tpl.jet_max:
            return 0.0            # palier des 80 % non applicable  [OBS]
        return value_after / float(tpl.jet_max)
    return 1.0


def _facteur_c(f: float, p: ModelParams) -> float:
    """Dégressivité au-delà de 80 % du jet. Recopié de StarLoco Formulas.chanceFM. [CODE]"""
    if f > 1.0:
        c = (1.0 - (f - 1.0) / 2.0) / 2.0
    elif f > p.seuil_degressif:
        c = 1.0 - f / 2.0
    else:
        c = 1.0
    c = max(0.0, c)
    return c ** p.exposant_c if p.exposant_c != 1.0 else c


def _facteur_x20(item: Item, rune: Rune, p: ModelParams) -> float:
    """Règle du ×20 : une rune décroche quand la stat dépasse ~20x sa valeur. [CONS]

    Absent de tous les émulateurs. Désactivable via `utiliser_regle_x20`.
    """
    if not p.utiliser_regle_x20 or rune.add <= 0:
        return 1.0
    cur = item.get(rune.stat)
    ratio = (cur.value if cur else 0) / float(rune.add)
    if ratio <= p.seuil_x20_doux:
        return 1.0
    if ratio <= p.seuil_x20_dur:
        span = max(1e-9, p.seuil_x20_dur - p.seuil_x20_doux)
        frac = (ratio - p.seuil_x20_doux) / span
        return 1.0 - frac * (1.0 - p.penal_x20)
    return p.penal_x20 * (p.seuil_x20_dur / ratio) ** p.exposant_x20


def _coef_ligne(item: Item, rune: Rune, p: ModelParams) -> float:
    """coef : 1.00 native positive | 0.50 native négative | 0.25 exotique. [CODE]"""
    tpl = item.template_of(rune.stat)
    if tpl is None:
        return p.coef_exo
    cur = item.get(rune.stat)
    if tpl.is_negative and (cur is None or cur.is_negative):
        return p.coef_negatif
    return 1.0


def tentative_possible(item: Item, rune: Rune, p: ModelParams) -> Tuple[bool, str]:
    """Blocages durs. Retourne (possible, raison)."""
    cur = item.get(rune.stat)
    tpl = item.template_of(rune.stat)

    # (a) PLAFOND PAR EFFET — « la somme du power-rate non-naturel et du
    #     power-rate actuel de l'effet » ne peut dépasser une limite fixe (101).
    #     Ex. Ankama : impossible de dépasser 101 points de Force sur un objet
    #     dont le jet max de base est 60.                                  [OBS]
    value_after = (cur.value if cur else 0) + rune.add
    w_max = tpl.weight_max(p) if tpl else 0.0
    over_after = value_after * p.coef(rune.stat) - w_max
    if over_after > p.cap_effet_non_naturel:
        return False, f"cap_effet_{int(p.cap_effet_non_naturel)}"

    # (b) PLAFOND PAR OBJET — « une limite fixe de puissance d'effets non-naturels,
    #     pour l'intégralité des objets ». VALEUR INCONNUE : désactivé par défaut.
    #     C'est lui (et non le plafond par effet) qui interdit PA + PM sur un objet
    #     qui ne possède ni l'un ni l'autre de base.                       [OBS]
    if p.cap_objet_non_naturel is not None:
        futur = item.poids_non_naturel(p) - max(0.0, (cur.value if cur else 0)
                                                * p.coef(rune.stat) - w_max)
        futur += max(0.0, over_after)
        if futur > p.cap_objet_non_naturel:
            return False, f"cap_objet_{int(p.cap_objet_non_naturel)}"

    # 1 PA + 1 PM + 1 PO exotiques maximum par objet  [OBS] MàJ 2.3.4
    if tpl is None and rune.stat in EXO_UNIQUES and cur is None:
        if item.nb_exos_uniques() >= 3:
            return False, "trop_d_exos_uniques"

    # niveau de métier (Rétro uniquement)  [CODE]
    if p.metier_influe and p.niveau_metier < item.level // 2:
        return False, "niveau_metier_insuffisant"

    return True, ""


def probabilites(item: Item, rune: Rune, p: ModelParams) -> Tuple[float, float, float]:
    """(P_SC, P_SN, P_EC), sommant à 1.

    Structure : StarLoco `Formulas.chanceFM` (l.945), constantes sorties dans ModelParams,
    plus un facteur `t` pour la règle du ×20.  Voir ALGORITHME.md §3.6.
    """
    ok, _ = tentative_possible(item, rune, p)
    if not ok:
        return 0.0, 0.0, 1.0

    pwr_g = item.pwr_g(p)
    pwr_max = item.pwr_max(p)
    pwr_min = item.pwr_min(p)
    pwr_carac = item.pwr_carac(p, rune.stat)

    # QUALITÉ GLOBALE : « le jet en cours de modification n'est pas pris en
    # compte dans le calcul de la qualité ».                              [OBS]
    pwr_g_qualite = (item.pwr_g(p, exclure=rune.stat)
                     if p.exclure_jet_cible_de_qualite else pwr_g)

    cur = item.get(rune.stat)
    on_neg = bool(cur and cur.is_negative)
    poids_rune = rune.weight(p, on_negative_line=on_neg)

    c = _facteur_c(fill_ratio(item, rune, p), p)

    moyenne = pwr_max - (pwr_max - pwr_min) / 2.0
    mstat = moyenne / max(1.0, pwr_g_qualite)
    mstat = min(p.plafond_mstat, mstat)
    if p.exposant_mstat != 1.0:
        mstat = mstat ** p.exposant_mstat

    coef = _coef_ligne(item, rune, p)

    e = item.get(rune.stat)
    tpl = item.template_of(rune.stat)
    x = p.penalite_over if (e and tpl and e.value > tpl.jet_max) else 1.0

    t = _facteur_x20(item, rune, p)

    # --- facteurs du DevBlog jamais modélisés ailleurs ---------------------
    # niveau de l'objet : « la difficulté augmente FAIBLEMENT avec le niveau »
    f_niveau = max(0.05, 1.0 - p.coef_niveau_objet * item.level / 200.0)
    # objet éthéré : plus difficile
    f_ethere = p.malus_ethere if item.ethere else 1.0
    # objet à un seul jet naturel : plus facile
    f_mono = p.bonus_mono_jet if item.mono_jet else 1.0
    # nombre d'over/exo, JET CIBLÉ COMPTÉ
    n_oe = item.nb_over_exo(rune.stat, rune.add)
    f_oe = p.penalite_par_over_exo ** n_oe if n_oe else 1.0

    diff = abs(pwr_max * p.facteur_diff - pwr_g)
    taille = pwr_max + diff
    if p.exposant_taille != 1.0:
        # normalisé autour de REF=100 pour découpler `exposant_taille` de `rate_fm`
        taille = 100.0 * (max(1e-9, taille) / 100.0) ** p.exposant_taille
    a = (taille * coef * mstat * c * x * t
         * f_niveau * f_ethere * f_mono * f_oe * p.rate_fm)
    if p.puits_augmente_p_sc:                        # hypothèse Ancestra (U21)
        a += 2.0 * item.puits
    b = math.sqrt(max(0.0, pwr_g + pwr_carac)) + poids_rune
    b = max(1.0, b)

    p_sc = math.floor(a / b)

    if p_sc <= p.p_sc_min:
        # PLANCHER OFFICIEL, ancre 5 : 1/0/99. C'est un invariant de borne, PAS un
        # câblage « l'exo vaut 1 % » : n'importe quelle transformation assez dure y
        # tombe, et une création d'effet facile peut atteindre 32/50/18 (ancre 4).
        p_sc = p.p_sc_min
        p_sn = 0
    else:
        p_sc = min(p_sc, p.p_sc_max)                                  # INV-3
        denom = max(1e-9, math.sqrt(max(0.0, pwr_g + pwr_carac)))
        p_sn = math.floor(a / denom)
        p_sn = min(p_sn, 100 - p_sc, p.p_sn_max)                      # INV-2
        p_sn = max(0, p_sn)

    p_ec = 100 - p_sc - p_sn
    return p_sc / 100.0, p_sn / 100.0, p_ec / 100.0


# =============================================================================
# 5. MÉCANIQUE DE PERTE
# =============================================================================

def _ordre_pertes(item: Item, stat_ciblee: str, p: ModelParams,
                  rng: random.Random) -> List[Effect]:
    lignes = list(item.effects)
    rng.shuffle(lignes)                              # départage aléatoire à priorité égale

    if p.ordre_pertes == "aleatoire":                # StarLoco brut
        over = [e for e in lignes if e.is_over() or not item.is_native(e.stat)]
        if over:
            first = over[0]
            lignes.remove(first)
            lignes.insert(0, first)
        return lignes

    def rang(e: Effect) -> Tuple[int, float]:
        est_over = e.is_over() or not item.is_native(e.stat)
        if p.ordre_pertes == "devblog_1_27":
            # 1) puits (géré en amont) 2) over/exo 3) PWR faible 4) PWR fort
            r = 0 if est_over else 1
        else:                                        # "communaute"
            # over/exo hors cible > over/exo cible > lignes normales
            if est_over and e.stat != stat_ciblee:
                r = 0
            elif est_over:
                r = 1
            else:
                r = 2
        return (r, e.weight(p))

    lignes.sort(key=rang)
    return lignes


def appliquer_perte(item: Item, poids_a_perdre: float, stat_ciblee: Optional[str],
                    p: ModelParams, rng: random.Random) -> Tuple[float, List[str]]:
    """Applique une perte de `poids_a_perdre` (unités de POIDS). Voir ALGORITHME.md §6.2.

    Retourne (poids réellement perdu sur les STATS, liste des stats touchées).
    Le puits est consommé en premier (ou après l'over selon `ordre_pertes`) et
    n'est PAS compté dans le poids perdu retourné.
    """
    reste = float(poids_a_perdre)
    touchees: List[str] = []

    # (1) absorption par le puits — « la magie résiduelle absorbera EN PARTIE les
    #     échecs futurs » : `puits_absorption` < 1 rend l'absorption partielle. [OBS]
    fuite = p.p_fuite_puits > 0 and rng.random() < p.p_fuite_puits
    if not fuite and item.puits > 0:
        absorbe = min(item.puits, reste * p.puits_absorption)
        item.puits -= absorbe
        reste -= absorbe
    if reste <= 1e-9:
        return 0.0, touchees

    perdu_total = 0.0
    for e in _ordre_pertes(item, stat_ciblee or "", p, rng):
        if reste <= 1e-9:
            break
        if e.stat in STATS_JAMAIS_PERDUES:
            continue
        if stat_ciblee is not None and e.stat == stat_ciblee and p.epargner_ligne_ciblee:
            continue
        if e.value < 1:
            continue

        if e.is_negative:
            # « Il est impossible de "puiser" dans les malus […] à moins que
            #   ceux-ci ne soient overmaxés, car ils joueraient souvent le rôle
            #   de puits sans fonds. »                                     [OBS]
            if p.puiser_malus_overmax_seulement and not e.is_over():
                continue
            # un malus s'AGGRAVE au lieu de baisser  [CODE] + [CONS]
            tpl = item.template_of(e.stat)
            delta = max(1, int(e.value * reste / 100.0))
            # « les malus ne peuvent dépasser le malus maximum naturel »   [OBS]
            if p.plafonner_malus_au_max_naturel and tpl is not None:
                # on ne peut le ramener au mieux qu'à son meilleur état naturel,
                # et jamais au-delà du pire état naturel
                plafond = min(tpl.jet_min, tpl.jet_max)
            else:
                plafond = tpl.jet_max if tpl else e.value + delta
            nouveau = min(e.value + delta, plafond)
            if nouveau <= e.value:
                continue
            # le poids récupéré est réel : un malus overmaxé qui se dégrade
            # restitue du poids non-naturel
            perdu_malus = (nouveau - e.value) * p.coef(e.stat, True)
            e.value = nouveau
            touchees.append(e.stat)
            perdu_total += perdu_malus
            reste -= perdu_malus
            continue

        mult = p.mult_perte_over if (e.is_over() or not item.is_native(e.stat)) else 1.0
        pct = min(reste * mult / 100.0, 1.0 - p.plancher_perte)   # plancher : -25 % max
        chute = math.floor(e.value * (1.0 - pct))
        chute = max(chute, math.floor(e.value * p.plancher_perte))
        chute = min(chute, e.value)
        if chute == e.value and e.value >= 1:
            chute = e.value - 1                       # garantir un progrès
        chute = max(0, chute)                         # « les bonus peuvent
                                                      #   redescendre jusqu'à 0 » [OBS]

        perdu = (e.value - chute) * p.coef(e.stat, e.is_negative)
        e.value = int(chute)
        touchees.append(e.stat)
        perdu_total += perdu
        reste -= perdu

    item.effects = [e for e in item.effects if e.value >= 1]
    return perdu_total, touchees


# =============================================================================
# 6. RÉSOLUTION D'UNE TENTATIVE
# =============================================================================

@dataclass
class Outcome:
    issue: str                    # "SC" | "SN" | "EC"  (mécanique)
    affichage: str                # "SC" | "SN" | "EC" | "ECHEC_NEUTRE" | "SN_NUL"
                                  # ("SN_NUL" : succès partiel impossible -> no-op,
                                  #  cas de l'objet à un seul jet)
    p_sc: float
    p_sn: float
    p_ec: float
    rune_passee: bool
    valeur_avant: int
    valeur_apres: int
    poids_perdu: float            # poids réellement retiré des STATS
    stats_touchees: List[str]
    puits_avant: float
    puits_apres: float
    absorbe_puits: float = 0.0    # part de la perte encaissée par la magie résiduelle
    bloquee: bool = False
    raison_blocage: str = ""


def _sn_realisable(item: Item, rune: Rune, p: ModelParams) -> bool:
    """Un succès neutre exige qu'un AUTRE jet puisse diminuer.

    « Si ce résultat n'est pas possible (objet qui ne dispose que d'un seul jet
    par exemple), rien ne se passe en cas de succès partiel. »            [OBS]
    """
    if item.puits > 0:
        return True                      # le puits peut encaisser à la place
    for e in item.effects:
        if e.stat == rune.stat:
            continue
        if e.stat in STATS_JAMAIS_PERDUES:
            continue
        if e.is_negative:
            if p.puiser_malus_overmax_seulement and not e.is_over():
                continue
            tpl = item.template_of(e.stat)
            plafond = min(tpl.jet_min, tpl.jet_max) if tpl else e.value + 1
            if e.value >= plafond:
                continue
            return True
        if e.value >= 1:
            return True
    return False


def attempt(item: Item, rune: Rune, p: Optional[ModelParams] = None,
            rng: Optional[random.Random] = None) -> Outcome:
    """Une tentative de forgemagie. MUTE `item`. Voir ALGORITHME.md §4."""
    p = p or ModelParams()
    rng = rng or random.Random()

    puits_avant = item.puits
    cur = item.get(rune.stat)
    valeur_avant = cur.value if cur else 0

    ok, raison = tentative_possible(item, rune, p)
    if not ok:
        return Outcome("EC", "EC", 0.0, 0.0, 1.0, False, valeur_avant, valeur_avant,
                       0.0, [], puits_avant, puits_avant, 0.0, True, raison)

    p_sc, p_sn, p_ec = probabilites(item, rune, p)
    on_neg = bool(cur and cur.is_negative)
    poids_rune = rune.weight(p, on_negative_line=on_neg)

    r = rng.random()
    if r < p_sc:
        issue = "SC"
    elif r < p_sc + p_sn:
        issue = "SN"
    else:
        issue = "EC"

    # Bonus puits de StarLoco (désactivé par défaut — probablement un ajout d'émulateur)
    if p.puits_bonus_starloco and item.puits >= rune.add and rune.stat not in EXO_UNIQUES:
        if rng.randint(1, 2) == 1:
            issue = "SC"

    poids_perdu = 0.0
    touchees: List[str] = []
    rune_passee = False

    def ajouter_rune() -> None:
        nonlocal rune_passee
        e = item.get(rune.stat)
        if e is None:
            tpl = item.template_of(rune.stat)
            e = Effect(rune.stat,
                       tpl.jet_min if tpl else 0,
                       tpl.jet_max if tpl else 0,
                       0,
                       tpl.is_negative if tpl else False)
            item.effects.append(e)
        if e.is_negative:
            e.value = max(0, e.value - rune.add)     # on réduit le malus
        else:
            e.value += rune.add
        rune_passee = True

    # « Si ce résultat n'est pas possible (objet qui ne dispose que d'un seul jet
    #   par exemple), RIEN NE SE PASSE en cas de succès partiel. »          [OBS]
    sn_impossible = issue == "SN" and not _sn_realisable(item, rune, p)

    if sn_impossible:
        # no-op complet : pas de rune, pas de perte, pas de mouvement de puits
        return Outcome("SN", "SN_NUL", p_sc, p_sn, p_ec, False,
                       valeur_avant, valeur_avant, 0.0, [],
                       puits_avant, puits_avant)

    if issue == "SC":
        ajouter_rune()
    elif issue == "SN":
        poids_perdu, touchees = appliquer_perte(item, poids_rune, rune.stat, p, rng)
        ajouter_rune()
    else:  # EC
        poids_perdu, touchees = appliquer_perte(item, poids_rune, None, p, rng)

    # Ce que la magie résiduelle a encaissé pendant `appliquer_perte`.
    absorbe = max(0.0, puits_avant - item.puits)

    # Mise à jour du puits — une seule ligne pour les trois issues.
    # Bilan complet : puits' = max(0, puits - absorbé + pertes_stats - poids_rune)
    if issue == "SC" and not p.puits_decremente_sur_sc:
        item.puits = max(0.0, item.puits + poids_perdu)
    else:
        item.puits = max(0.0, item.puits + poids_perdu - poids_rune)

    item.effects = [e for e in item.effects if e.value >= 1]

    # Affichage tel que perçu par le joueur (§10)
    affichage = issue
    if issue == "SN" and rune.stat in touchees:
        affichage = "ECHEC_NEUTRE"
    elif issue == "EC" and not touchees:
        affichage = "ECHEC_NEUTRE"

    e = item.get(rune.stat)
    return Outcome(issue, affichage, p_sc, p_sn, p_ec, rune_passee,
                   valeur_avant, e.value if e else 0,
                   poids_perdu, touchees, puits_avant, item.puits, absorbe)


# =============================================================================
# 7. MONTE-CARLO
# =============================================================================

@dataclass
class MCResult:
    n: int
    sc: int
    sn: int
    ec: int
    echecs_neutres: int
    runes_utilisees: int
    poids_perdu_total: float

    @property
    def p_sc(self) -> float: return self.sc / self.n if self.n else 0.0
    @property
    def p_sn(self) -> float: return self.sn / self.n if self.n else 0.0
    @property
    def p_ec(self) -> float: return self.ec / self.n if self.n else 0.0

    def __repr__(self) -> str:
        return (f"MC(n={self.n} SC={self.p_sc:.4%} SN={self.p_sn:.4%} "
                f"EC={self.p_ec:.4%} echecs_neutres={self.echecs_neutres})")


def monte_carlo_tentatives(item: Item, rune: Rune, n: int,
                           p: Optional[ModelParams] = None,
                           seed: int = 0, reset_item: bool = True) -> MCResult:
    """n tentatives. `reset_item=True` => chaque tentative repart de l'état initial
    (utile pour mesurer un triplet de probabilité en un point donné de l'espace d'état)."""
    p = p or ModelParams()
    rng = random.Random(seed)
    base = item.copy()
    res = MCResult(0, 0, 0, 0, 0, 0, 0.0)
    work = base.copy()
    for _ in range(n):
        if reset_item:
            work = base.copy()
        o = attempt(work, rune, p, rng)
        res.n += 1
        res.runes_utilisees += 1
        res.poids_perdu_total += o.poids_perdu
        if o.issue == "SC":
            res.sc += 1
        elif o.issue == "SN":
            res.sn += 1
        else:
            res.ec += 1
        if o.affichage == "ECHEC_NEUTRE":
            res.echecs_neutres += 1
    return res


def monte_carlo_exo(item: Item, rune: Rune, n_essais: int,
                    p: Optional[ModelParams] = None, seed: int = 0,
                    max_runes: int = 2000) -> List[int]:
    """Simule `n_essais` campagnes d'exo. Retourne le nb de runes consommées par campagne.

    Chaque tentative repart d'un objet neuf (l'exo ne modifie pas l'objet en cas d'EC
    au-delà des pertes, et le joueur remonte l'objet entre deux tentatives)."""
    p = p or ModelParams()
    rng = random.Random(seed)
    base = item.copy()
    resultats: List[int] = []
    for _ in range(n_essais):
        k = 0
        while k < max_runes:
            work = base.copy()
            k += 1
            o = attempt(work, rune, p, rng)
            if o.issue == "SC":
                break
        resultats.append(k)
    return resultats


def monte_carlo_remontage(item: Item, plan: Sequence[Tuple[Rune, int]],
                          p: Optional[ModelParams] = None, seed: int = 0,
                          max_runes: int = 20000) -> Tuple[bool, int, Item]:
    """Remonte un objet selon un plan [(rune, valeur_cible), ...].

    Stratégie : à chaque étape, viser la ligne la plus éloignée de sa cible
    (heuristique confirmée par les bots de FM : les stats les plus éloignées de leur
    plafond ont le meilleur taux de réussite).
    Retourne (objectif_atteint, runes_consommées, objet_final).
    """
    p = p or ModelParams()
    rng = random.Random(seed)
    work = item.copy()
    used = 0
    while used < max_runes:
        restants = []
        for rune, cible in plan:
            e = work.get(rune.stat)
            v = e.value if e else 0
            if v < cible:
                restants.append((cible - v, rune, cible))
        if not restants:
            return True, used, work
        restants.sort(key=lambda t: -t[0])
        _, rune, _ = restants[0]
        attempt(work, rune, p, rng)
        used += 1
    return False, used, work


# =============================================================================
# 8. OUTILS DE CALIBRATION  (§12 de ALGORITHME.md)
# =============================================================================

def wilson_ci(succes: int, n: int, z: float = 1.96) -> Tuple[float, float]:
    """Intervalle de confiance de Wilson (préférable à Wald près de 0 ou 1)."""
    if n == 0:
        return 0.0, 1.0
    ph = succes / n
    d = 1.0 + z * z / n
    centre = (ph + z * z / (2 * n)) / d
    demi = z * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / d
    return max(0.0, centre - demi), min(1.0, centre + demi)


@dataclass
class Observation:
    """Une tentative observée en jeu (une ligne du journal, cf. ALGORITHME.md §12.2)."""
    item: Item
    rune: Rune
    issue: str                       # "SC" | "SN" | "EC"


def log_likelihood(obs: Sequence[Observation], p: ModelParams) -> float:
    """Log-vraisemblance multinomiale du modèle sur un journal de tentatives."""
    eps = 1e-9
    total = 0.0
    for o in obs:
        psc, psn, pec = probabilites(o.item, o.rune, p)
        q = {"SC": psc, "SN": psn, "EC": pec}[o.issue]
        total += math.log(max(eps, q))
    return total


# Paramètres calibrables par défaut, avec leurs grilles de recherche.
GRILLES_DEFAUT: Dict[str, Sequence[float]] = {
    "rate_fm":        [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 1.0, 1.5, 2.0, 3.0,
                       5.0, 8.0, 12.0, 20.0, 35.0, 60.0, 100.0, 200.0],
    "exposant_taille": [0.1, 0.2, 0.3, 0.4, 0.5, 0.7, 0.85, 1.0],
    "facteur_diff":   [0.8, 1.0, 1.1, 1.3, 1.5, 1.8, 2.2],
    "plafond_mstat":  [1.0, 1.2, 1.5, 2.0, 3.0, 5.0],
    "exposant_c":     [0.15, 0.25, 0.4, 0.6, 0.8, 1.0, 1.5],
    "exposant_mstat": [0.2, 0.4, 0.6, 0.8, 1.0, 1.5],
    "penalite_over":  [0.5, 0.65, 0.8, 0.9, 1.0],
    "coef_exo":       [0.05, 0.1, 0.15, 0.25, 0.4, 0.5, 0.75],
    "seuil_x20_dur":  [16.0, 18.0, 20.0, 25.0, 30.0],
    "penal_x20":      [0.15, 0.25, 0.35, 0.5, 0.7],
    # --- facteurs nouveaux (DevBlog original) ---
    "coef_niveau_objet":     [0.0, 0.05, 0.1, 0.2, 0.3, 0.5, 0.8],
    "penalite_par_over_exo": [1.0, 0.95, 0.9, 0.8, 0.7, 0.6, 0.5, 0.35],
    "bonus_mono_jet":        [1.0, 1.2, 1.5, 2.0, 3.0],
    "malus_ethere":          [1.0, 0.85, 0.7, 0.5],
}


def calibrate_coordinate_descent(score_fn, p0: ModelParams,
                                 grilles: Optional[Dict[str, Sequence[float]]] = None,
                                 passes: int = 3, verbose: bool = False
                                 ) -> Tuple[ModelParams, float]:
    """Descente par coordonnées sur grille — stdlib pure, pas de scipy.

    `score_fn(params) -> float` est MAXIMISÉ (log-vraisemblance, ou -erreur).
    Suffisant pour ~10 paramètres et quelques milliers d'observations, et robuste
    aux non-différentiabilités du modèle (floor, clamps, discontinuité en f=0.80).
    """
    grilles = grilles or GRILLES_DEFAUT
    best = replace(p0)
    best_score = score_fn(best)
    for it in range(passes):
        for nom, valeurs in grilles.items():
            courant = getattr(best, nom)
            local_best, local_score = courant, best_score
            for v in valeurs:
                cand = replace(best, **{nom: v})
                s = score_fn(cand)
                if s > local_score:
                    local_best, local_score = v, s
            if local_best != courant:
                best = replace(best, **{nom: local_best})
                best_score = local_score
                if verbose:
                    print(f"  passe {it+1}: {nom} {courant} -> {local_best} "
                          f"(score {best_score:.4f})")
    return best, best_score


def calibrate_multistart(score_fn, p0: ModelParams,
                         starts: Optional[Dict[str, Sequence[float]]] = None,
                         grilles: Optional[Dict[str, Sequence[float]]] = None,
                         passes: int = 4, verbose: bool = False
                         ) -> Tuple[ModelParams, float]:
    """Descente par coordonnées relancée depuis plusieurs points de départ.

    La descente par coordonnées reste bloquée dans les optima locaux quand deux
    paramètres sont couplés (typiquement `exposant_taille` et `rate_fm`). Le
    multi-départ règle ce problème à peu de frais.
    """
    starts = starts or {"exposant_taille": [1.0, 0.7, 0.5, 0.35, 0.2],
                        "rate_fm": [0.5, 2.0, 8.0, 30.0]}
    best, best_score = replace(p0), score_fn(p0)
    combos: List[ModelParams] = [replace(p0)]
    for nom, valeurs in starts.items():
        nouveaux = []
        for base in combos:
            for v in valeurs:
                nouveaux.append(replace(base, **{nom: v}))
        combos = nouveaux
    for start in combos:
        cand, sc = calibrate_coordinate_descent(score_fn, start, grilles, passes, False)
        if sc > best_score:
            best, best_score = cand, sc
            if verbose:
                print(f"  nouveau meilleur depart -> score {sc:.1f}")
    return best, best_score


# --- Ancres officielles du DevBlog 1.27 (§3.1) -------------------------------
# SOURCE PRIMAIRE : sources/archive/DEVBLOG-ANKAMA-ORIGINAL.md (texte intégral).
# (nom, item, rune, triplet cible en %)
def ancres_devblog(p: ModelParams) -> List[Tuple[str, Item, Rune, Tuple[int, int, int]]]:
    """Les 5 SEULS triplets officiels de probabilité connus (DevBlog 1.27).

    | # | Situation (formulation Ankama)                                 | SC | N  | EC |
    |---|----------------------------------------------------------------|----|----|----|
    | 1 | meilleures probas atteignables : remontage d'un effet simple    | 66 | 34 |  0 |
    |   | (vitalité) sur un objet normal, pour un maître forgemage        |    |    |    |
    | 2 | meilleures probas (bonus simples sur objets simples) pour        | 43 | 50 |  7 |
    |   | tenter d'atteindre un JET PARFAIT                               |    |    |    |
    | 3 | probas MINIMUM (bonus maximums sur objets complexes haut-niveau) | 15 | 50 | 35 |
    |   | en REMONTAGE, pour un maître utilisant des runes suffisantes    |    |    |    |
    | 4 | probas MAXIMUM en CRÉATION D'EFFET, pour un maître               | 32 | 50 | 18 |
    | 5 | probas MINIMUM en CRÉATION D'EFFET, pour un maître               |  1 |  0 | 99 |

    ⚠️ Le triplet « 1/22/77 exo avec puits » que colportent les guides
       communautaires N'EXISTE PAS dans le texte d'Ankama. Il a été retiré.

    ⚠️ 1-2-3 encadrent le REMONTAGE, 4-5 encadrent la CRÉATION D'EFFET. Ce sont
       deux régimes distincts du même continuum : rien dans le texte d'Ankama ne
       les sépare formellement, seule la valeur de `coef` (ligne native vs
       exotique) et le poids de la rune font la différence. Le modèle les traite
       donc comme un continuum unique, et c'est bien ce que produit la formule :
       la création d'effet couvre 32/50/18 -> 1/0/99 sans aucun câblage.

    NOTE STRUCTURELLE — ce que les 5 ancres imposent à la FORME de la formule
    ---------------------------------------------------------------------------
    Dans la famille StarLoco, avec S = PWRg + PWRcarac et w = poids de la rune :
        P_SC = a / (sqrt(S) + w)        P_SN = min(a / sqrt(S), 100 - P_SC, 50)
    donc                P_SN / P_SC = 1 + w / sqrt(S)   tant que P_SN < 50.
    Le rapport SN/SC ne dépend donc **que** de w/sqrt(S) : AUCUN paramètre
    calibrable ne peut le modifier. Les ancres exigent :
        ancre 2 (43/50) : w/sqrt(S) >= 0.16      (facile)
        ancre 4 (32/50) : w/sqrt(S) >= 0.56      (rune légère sur objet léger : ok)
        ancre 3 (15/50) : w/sqrt(S) >= 2.33      <-- CONTRAIGNANT
    Sur un « objet complexe haut-niveau » (PWRg ~ 700 a 1900, sqrt(S) ~ 27 a 44),
    w >= 2.33*sqrt(S) impose une rune de poids >= 63 a 100 : seules les runes
    Ga Pa (100), Ga Pme (90) et, marginalement, Po (51) qualifient. Avec une rune
    de remontage ordinaire (Do = 20, Ra Fo = 10, Pa Sa = 9) l'ancre 3 est
    MATHÉMATIQUEMENT INATTEIGNABLE : le modèle plafonne vers 24/41/35.
    ➡️ La formule nous dit donc comment lire Ankama : « bonus maximums » = les
       bonus les plus LOURDS (PA/PM), pas « les jets à leur maximum ». Et
       « runes de puissance suffisante » = Ga Pa / Ga Pme. L'ancre 3 est
       reconstruite ainsi, et devient reproductible.
    """
    # Objet SIMPLE : 3 lignes, fourchettes larges, bas niveau
    simple_tpl = [Effect("force", 1, 30), Effect("vitalite", 1, 100), Effect("sagesse", 1, 15)]
    # Objet COMPLEXE : beaucoup de lignes lourdes, haut niveau
    complexe_tpl = [
        Effect("force", 1, 60), Effect("vitalite", 1, 300), Effect("sagesse", 1, 40),
        Effect("dommages", 1, 12), Effect("critiques", 1, 8),
        Effect("res_pct_feu", 1, 10), Effect("res_pct_terre", 1, 10),
        Effect("portee", 1, 1),
    ]
    # Objet LÉGER bas niveau : le meilleur support de création d'effet
    leger_tpl = [Effect("vitalite", 1, 30), Effect("sagesse", 1, 5)]
    # Objet THL très chargé, disposant d'un PA naturel : support de l'ancre 3.
    # cf. NOTE STRUCTURELLE ci-dessous — c'est la seule lecture de l'ancre 3 que
    # la forme fonctionnelle héritée de StarLoco puisse reproduire.
    thl_tpl = [
        Effect("force", 1, 80), Effect("vitalite", 1, 400), Effect("sagesse", 1, 50),
        Effect("dommages", 1, 15), Effect("critiques", 1, 10),
        Effect("res_pct_feu", 1, 10), Effect("res_pct_terre", 1, 10),
        Effect("pa", 1, 1), Effect("portee", 1, 1),
    ]

    rune_fo = Rune("Rune Fo", "force", 1)
    rune_pa_fo = Rune("Rune Pa Fo", "force", 3, 2)
    rune_ga_pa = Rune("Rune Ga Pa", "pa", 1)
    rune_pm = Rune("Rune Ga Pme", "pm", 1)

    # #1 remontage d'un effet simple sur objet normal, jets bas
    a1 = Item(simple_tpl, level=50, name="simple@min")

    # #2 bonus simples sur objet simple, on vise le JET PARFAIT
    a2 = Item(simple_tpl, level=50, name="simple@parfait").to_max()
    a2.set_values(force=27)                      # les 3 derniers points, rune Pa Fo

    # #3 « bonus maximums sur objets complexes haut-niveau […] runes de puissance
    #    suffisante » : objet THL au jet parfait partout SAUF la ligne PA, qu'on
    #    remonte à la Ga Pa (poids 100). Voir NOTE STRUCTURELLE.
    a3 = Item(thl_tpl, level=200, name="thl@parfait_sauf_PA").to_max()
    a3.set_values(pa=0)

    # #4 CRÉATION D'EFFET AU MIEUX : objet léger bas niveau, jets bas, rune légère,
    #    aucun over/exo préexistant. C'est le cas le plus favorable possible.
    a4 = Item(leger_tpl, level=20, name="leger@min_exo_force")

    # #5 CRÉATION D'EFFET AU PIRE : exo PM (poids de rune 90) sur objet complexe
    #    haut-niveau au jet parfait, déjà chargé.
    a5 = Item(complexe_tpl, level=200, name="complexe@parfait_exo_pm").to_max()

    return [
        ("1 remontage, meilleur cas",  a1, rune_fo,    (66, 34, 0)),
        ("2 vers le jet parfait",      a2, rune_pa_fo, (43, 50, 7)),
        ("3 remontage, plancher",      a3, rune_ga_pa, (15, 50, 35)),
        ("4 creation d'effet AU MIEUX", a4, rune_fo,   (32, 50, 18)),
        ("5 creation d'effet AU PIRE",  a5, rune_pm,   (1, 0, 99)),
    ]


def score_ancres(p: ModelParams) -> float:
    """-somme des erreurs quadratiques sur les 5 triplets officiels (à MAXIMISER)."""
    err = 0.0
    for _, item, rune, (tsc, tsn, tec) in ancres_devblog(p):
        psc, psn, pec = probabilites(item, rune, p)
        err += (psc * 100 - tsc) ** 2 + (psn * 100 - tsn) ** 2 + (pec * 100 - tec) ** 2
    return -err


def ecarts_ancres(p: ModelParams) -> List[Tuple[str, Tuple[int, int, int],
                                                Tuple[int, int, int], float]]:
    """(nom, modèle, cible, écart max en points) pour chaque ancre."""
    out = []
    for nom, item, rune, cible in ancres_devblog(p):
        psc, psn, pec = probabilites(item, rune, p)
        mod = (round(psc * 100), round(psn * 100), round(pec * 100))
        emax = max(abs(m - c) for m, c in zip(mod, cible))
        out.append((nom, mod, cible, emax))
    return out


# --- Cas de contrôle communautaire : exo PA / PM / PO ------------------------
# La communauté est UNANIME : 1 % SC, 99 % EC, jamais de SN. Mesure réelle :
# 111/10 000 = 1.11 %, IC95 [0.905 % ; 1.315 %]. Le modèle doit y retomber
# NATURELLEMENT (plancher atteint), sans câblage « exo = 1 % ».
def cas_exo_pa_pm_po(p: ModelParams) -> List[Tuple[str, Item, Rune]]:
    supports = [
        ("gelano (2 lignes, nv60)",
         Item([Effect("vitalite", 1, 30), Effect("sagesse", 1, 5)], level=60).to_max()),
        ("amulette simple (3 lignes, nv50)",
         Item([Effect("force", 1, 30), Effect("vitalite", 1, 100),
               Effect("sagesse", 1, 15)], level=50).to_max()),
        # (pas de PA/PM/PO natif : ce sont bien des CRÉATIONS d'effet)
        ("objet complexe (8 lignes, nv200)",
         Item([Effect("force", 1, 60), Effect("vitalite", 1, 300),
               Effect("sagesse", 1, 40), Effect("dommages", 1, 12),
               Effect("critiques", 1, 8), Effect("res_pct_feu", 1, 10),
               Effect("res_pct_terre", 1, 10), Effect("res_pct_air", 1, 10)],
              level=200).to_max()),
    ]
    cas = []
    for nom, it in supports:
        for cle in ("ga_pa", "ga_pme", "po"):
            cas.append((f"{cle} sur {nom}", it.copy(), RUNES[cle]))
    return cas


def controle_exo(p: ModelParams) -> List[Tuple[str, Tuple[int, int, int]]]:
    return [(nom, tuple(round(v * 100) for v in probabilites(it, r, p)))
            for nom, it, r in cas_exo_pa_pm_po(p)]


# --- Préréglage recommandé ---------------------------------------------------
def params_devblog_fit(**kwargs) -> ModelParams:
    """Jeu de paramètres ajusté sur les 5 triplets officiels du DevBlog 1.27.

    Obtenu par `calibrate_multistart(score_ancres, ModelParams())` sur les ancres
    CORRIGÉES (43/50/7 ; 32/50/18 ; plus de 1/22/77).
    Erreur quadratique totale : 23 504 (StarLoco brut) -> 10. Les 5 ancres sont
    reproduites à 2 points de pourcentage près au pire.

    ⚠️ NON IDENTIFIABLES par les ancres : `malus_ethere` et `bonus_mono_jet`
    restent à 1.0 (= neutre) parce qu'AUCUNE des 5 situations d'Ankama ne met en
    jeu un objet éthéré ni un objet mono-jet. C'est un artefact d'identifiabilité,
    pas une réfutation : Ankama affirme [OBS] que ces deux facteurs existent.
    Pour un simulateur, préférer `params_devblog_fit_complet()`, qui y injecte
    les valeurs suggérées `malus_ethere=0.7` / `bonus_mono_jet=1.5` **[SUPP]**.

    C'est le préréglage RECOMMANDÉ par défaut pour un simulateur, en attendant
    une calibration sur des données réelles (ALGORITHME.md §12).
    ATTENTION : ajusté sur 5 points seulement. Il n'a aucune valeur prédictive
    démontrée en dehors de ces 5 situations.
    """
    base = dict(
        rate_fm=20.0,
        facteur_diff=0.8,
        plafond_mstat=1.0,
        exposant_c=1.5,
        exposant_mstat=0.4,
        exposant_taille=0.2,
        coef_exo=0.25,
        coef_niveau_objet=0.3,
        penalite_par_over_exo=0.7,
        bonus_mono_jet=1.0,          # non identifiable sur les ancres
        malus_ethere=1.0,            # non identifiable sur les ancres
    )
    base.update(kwargs)
    return ModelParams(**base)


# Valeurs suggérées pour les deux facteurs que les ancres ne contraignent pas.
SUGGESTION_MALUS_ETHERE = 0.7        # [SUPP] — signe [OBS], amplitude inventée
SUGGESTION_BONUS_MONO_JET = 1.5      # [SUPP] — signe [OBS], amplitude inventée


def params_devblog_fit_complet(**kwargs) -> ModelParams:
    """`params_devblog_fit()` + les deux facteurs [OBS] mais non identifiables.

    À préférer pour SIMULER (le modèle doit refléter tout ce qu'Ankama affirme) ;
    utiliser `params_devblog_fit()` pour REPRODUIRE l'ajustement sur les ancres.
    """
    base = dict(malus_ethere=SUGGESTION_MALUS_ETHERE,
                bonus_mono_jet=SUGGESTION_BONUS_MONO_JET)
    base.update(kwargs)
    return params_devblog_fit(**base)


# =============================================================================
# 9. CATALOGUE DE RUNES (exemples)  — poids déduits de COEF × add
# =============================================================================

RUNES: Dict[str, Rune] = {
    "fo":      Rune("Rune Fo", "force", 1, 1),
    "pa_fo":   Rune("Rune Pa Fo", "force", 3, 2),
    "ra_fo":   Rune("Rune Ra Fo", "force", 10, 3),
    "ine":     Rune("Rune Ine", "intelligence", 1, 1),
    "pa_ine":  Rune("Rune Pa Ine", "intelligence", 3, 2),
    "ra_ine":  Rune("Rune Ra Ine", "intelligence", 10, 3),
    "vi":      Rune("Rune Vi", "vitalite", 5, 1),          # +3 en Rétro
    "pa_vi":   Rune("Rune Pa Vi", "vitalite", 15, 2),      # +10 en Rétro
    "ra_vi":   Rune("Rune Ra Vi", "vitalite", 50, 3),      # +30 en Rétro
    "sa":      Rune("Rune Sa", "sagesse", 1, 1),
    "pa_sa":   Rune("Rune Pa Sa", "sagesse", 3, 2),
    "do":      Rune("Rune Do", "dommages", 1, 1),
    "cri":     Rune("Rune Cri", "critiques", 1, 1),
    "ga_pa":   Rune("Rune Ga Pa", "pa", 1, 1),
    "ga_pme":  Rune("Rune Ga Pme", "pm", 1, 1),
    "po":      Rune("Rune Po", "portee", 1, 1),
    "invo":    Rune("Rune Invo", "invocations", 1, 1),
}

RUNES_RETRO: Dict[str, Rune] = dict(RUNES)
RUNES_RETRO.update({
    "vi":    Rune("Rune Vi", "vitalite", 3, 1),
    "pa_vi": Rune("Rune Pa Vi", "vitalite", 10, 2),
    "ra_vi": Rune("Rune Ra Vi", "vitalite", 30, 3),
})


# =============================================================================
# 10. DÉMO
# =============================================================================

def _demo() -> None:
    print("=" * 78)
    print("ANCRES DU DEVBLOG ANKAMA ORIGINAL (sources/archive/DEVBLOG-ANKAMA-ORIGINAL.md)")
    print("  66/34/0  remontage effet simple, objet normal, maitre")
    print("  43/50/7  bonus simples sur objets simples, vers le jet parfait")
    print("  15/50/35 bonus maximums sur objets complexes haut-niveau (plancher remontage)")
    print("  32/50/18 creation d'effet, AU MIEUX          <- ancre inedite")
    print("   1/0/99  creation d'effet, AU PIRE           <- plancher absolu")
    print("=" * 78)

    for titre, p in (("StarLoco brut (ModelParams())", ModelParams()),
                     ("ANCIEN prereglage (calibre sur les ancres FAUSSES)",
                      ModelParams(rate_fm=20.0, facteur_diff=1.0, plafond_mstat=1.2,
                                  exposant_c=1.0, exposant_mstat=1.0,
                                  exposant_taille=0.4, coef_exo=0.25)),
                     ("NOUVEAU prereglage params_devblog_fit()", params_devblog_fit())):
        print(f"\n=== {titre} ===")
        for nom, mod, cible, emax in ecarts_ancres(p):
            print(f"  {nom:28s} {mod[0]:3d}/{mod[1]:3d}/{mod[2]:3d}"
                  f"   cible {cible[0]:3d}/{cible[1]:3d}/{cible[2]:3d}"
                  f"   ecart {emax:2d} pts")
        print(f"  erreur quadratique = {-score_ancres(p):.0f}")

    print("\n=== PORTE DE SORTIE : exo PA/PM/PO doit retomber sur 1/0/99 sans cablage ===")
    for nom, t in controle_exo(params_devblog_fit()):
        print(f"  {nom:44s} {t[0]:3d}/{t[1]:3d}/{t[2]:3d}")

    print("\n=== Recalibration multi-depart (reproductible) ===")
    fitted, sc = calibrate_multistart(
        score_ancres, ModelParams(), passes=5,
        starts={"exposant_taille": [1.0, 0.7, 0.5, 0.35, 0.2],
                "rate_fm": [0.5, 2.0, 8.0, 30.0, 100.0],
                "coef_exo": [0.05, 0.25],
                "penalite_par_over_exo": [1.0, 0.7]})
    print(f"  score = {sc:.1f}")
    for nom in ("rate_fm", "facteur_diff", "plafond_mstat", "exposant_c",
                "exposant_mstat", "exposant_taille", "coef_exo",
                "coef_niveau_objet", "penalite_par_over_exo",
                "bonus_mono_jet", "malus_ethere"):
        print(f"    {nom:24s} = {getattr(fitted, nom)}")
    print("  ⚠️ `bonus_mono_jet` et `malus_ethere` restent a 1.0 : AUCUNE des 5 ancres")
    print("     ne met en jeu un objet ethere ni un objet mono-jet -> non identifiables.")


if __name__ == "__main__":
    _demo()
