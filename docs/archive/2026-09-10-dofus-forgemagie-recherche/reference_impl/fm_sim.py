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
   et les triplets du DevBlog 1.27. Elles sont imposées comme invariants.

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
    sn_avec_puits: int = 22                  # [OBS] triplet 1/22/77
    cap_over: float = 101.0                  # [OBS] cap de poids over+exo par ligne

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

    # --- Règle du ×20 (U10, U11) — absente des émulateurs, ajoutée ici ------
    utiliser_regle_x20: bool = True
    seuil_x20_doux: float = 16.0
    seuil_x20_dur: float = 20.0
    penal_x20: float = 0.35
    exposant_x20: float = 2.0

    # --- Puits (U13, U20, U21, U22) -----------------------------------------
    puits_donne_sn: bool = True              # avec puits, le plancher devient 1/22/77
    puits_decremente_sur_sc: bool = True     # StarLoco: oui ; SmithMagic: non
    puits_augmente_p_sc: bool = False        # Ancestra: oui (+2*puits au numérateur)
    puits_bonus_starloco: bool = False       # puits >= rune.add -> 50 % de SC forcé
    p_fuite_puits: float = 0.0               # Rétro : pertes malgré un puits suffisant

    # --- Mécanique de perte (U16-U19) ---------------------------------------
    plancher_perte: float = 0.75             # jamais plus de -25 % d'une stat d'un coup
    mult_perte_over: float = 2.0             # double peine sur l'over
    ordre_pertes: str = "communaute"         # "communaute" | "devblog_1_27" | "aleatoire"
    epargner_ligne_ciblee: bool = True

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

    def overmax(self, stat: str) -> int:
        """Plafond d'over d'une stat, dérivé de floor(101 / coef).  [OBS]"""
        c = self.coef(stat)
        if c <= 0:
            return 0
        return int(math.floor(self.cap_over / c + 1e-9))

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
                 template_id: int = 0, name: str = "item"):
        self.name = name
        self.level = level
        self.template_id = template_id
        self.template: List[Effect] = [e.copy() for e in template]
        # état courant : par défaut, au jet minimum
        self.effects: List[Effect] = [e.copy() for e in template]
        for e in self.effects:
            e.value = e.jet_min
        self.puits: float = 0.0

    # -- construction ------------------------------------------------------
    def copy(self) -> "Item":
        it = Item(self.template, self.level, self.template_id, self.name)
        it.effects = [e.copy() for e in self.effects]
        it.puits = self.puits
        return it

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
    def pwr_g(self, p: ModelParams) -> float:
        """Poids courant de l'objet (PWRg), avec les pondérations native/négative/exo."""
        total = 0.0
        for e in self.effects:
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
        return 1.0 + w / p.cap_over
    if tpl.jet_max > tpl.jet_min:
        return (value_after - tpl.jet_min) / float(tpl.jet_max - tpl.jet_min)
    if tpl.jet_max > 0:                              # jet fixe (min == max)
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

    # cap 101 sur le poids over/exo de la ligne  [CONS]
    value_after = (cur.value if cur else 0) + rune.add
    w_max = tpl.weight_max(p) if tpl else 0.0
    over_after = value_after * p.coef(rune.stat) - w_max
    if over_after > p.cap_over:
        return False, f"cap_over_{int(p.cap_over)}"

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

    cur = item.get(rune.stat)
    on_neg = bool(cur and cur.is_negative)
    poids_rune = rune.weight(p, on_negative_line=on_neg)

    c = _facteur_c(fill_ratio(item, rune, p), p)

    moyenne = pwr_max - (pwr_max - pwr_min) / 2.0
    mstat = moyenne / max(1.0, pwr_g)
    mstat = min(p.plafond_mstat, mstat)
    if p.exposant_mstat != 1.0:
        mstat = mstat ** p.exposant_mstat

    coef = _coef_ligne(item, rune, p)

    e = item.get(rune.stat)
    tpl = item.template_of(rune.stat)
    x = p.penalite_over if (e and tpl and e.value > tpl.jet_max) else 1.0

    t = _facteur_x20(item, rune, p)

    diff = abs(pwr_max * p.facteur_diff - pwr_g)
    taille = pwr_max + diff
    if p.exposant_taille != 1.0:
        # normalisé autour de REF=100 pour découpler `exposant_taille` de `rate_fm`
        taille = 100.0 * (max(1e-9, taille) / 100.0) ** p.exposant_taille
    a = taille * coef * mstat * c * x * t * p.rate_fm
    if p.puits_augmente_p_sc:                        # hypothèse Ancestra (U21)
        a += 2.0 * item.puits
    b = math.sqrt(max(0.0, pwr_g + pwr_carac)) + poids_rune
    b = max(1.0, b)

    p_sc = math.floor(a / b)

    if p_sc <= p.p_sc_min:
        # Plancher officiel : 1/0/99 sans puits, 1/22/77 avec puits. [OBS]
        p_sc = p.p_sc_min
        if p.puits_donne_sn and item.puits > 0:
            p_sn = p.sn_avec_puits
        else:
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

    # (1) absorption par le puits
    fuite = p.p_fuite_puits > 0 and rng.random() < p.p_fuite_puits
    if not fuite and item.puits > 0:
        absorbe = min(item.puits, reste)
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
            # un malus s'AGGRAVE au lieu de baisser  [CODE] + [CONS]
            tpl = item.template_of(e.stat)
            delta = max(1, int(e.value * reste / 100.0))
            plafond = tpl.jet_max if tpl else e.value + delta
            e.value = min(e.value + delta, plafond)
            touchees.append(e.stat)
            continue

        mult = p.mult_perte_over if (e.is_over() or not item.is_native(e.stat)) else 1.0
        pct = min(reste * mult / 100.0, 1.0 - p.plancher_perte)   # plancher : -25 % max
        chute = math.floor(e.value * (1.0 - pct))
        chute = max(chute, math.floor(e.value * p.plancher_perte))
        chute = min(chute, e.value)
        if chute == e.value and e.value >= 1:
            chute = e.value - 1                       # garantir un progrès

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
    affichage: str                # "SC" | "SN" | "EC" | "ECHEC_NEUTRE"  (ce que voit le joueur)
    p_sc: float
    p_sn: float
    p_ec: float
    rune_passee: bool
    valeur_avant: int
    valeur_apres: int
    poids_perdu: float
    stats_touchees: List[str]
    puits_avant: float
    puits_apres: float
    bloquee: bool = False
    raison_blocage: str = ""


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
                       0.0, [], puits_avant, puits_avant, True, raison)

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

    if issue == "SC":
        ajouter_rune()
    elif issue == "SN":
        poids_perdu, touchees = appliquer_perte(item, poids_rune, rune.stat, p, rng)
        ajouter_rune()
    else:  # EC
        poids_perdu, touchees = appliquer_perte(item, poids_rune, None, p, rng)

    # Mise à jour du puits — une seule ligne pour les trois issues
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
                   poids_perdu, touchees, puits_avant, item.puits)


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
                       5.0, 8.0, 12.0, 20.0, 35.0, 60.0, 100.0],
    "exposant_taille": [0.2, 0.3, 0.4, 0.5, 0.7, 0.85, 1.0],
    "facteur_diff":   [0.8, 1.0, 1.1, 1.3, 1.5, 1.8, 2.2],
    "plafond_mstat":  [1.0, 1.2, 1.5, 2.0, 3.0, 5.0],
    "exposant_c":     [0.15, 0.25, 0.4, 0.6, 0.8, 1.0],
    "exposant_mstat": [0.2, 0.4, 0.6, 0.8, 1.0, 1.5],
    "penalite_over":  [0.5, 0.65, 0.8, 0.9, 1.0],
    "coef_exo":       [0.1, 0.25, 0.5],
    "seuil_x20_dur":  [16.0, 18.0, 20.0, 25.0, 30.0],
    "penal_x20":      [0.15, 0.25, 0.35, 0.5, 0.7],
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
# (nom, item, rune, triplet cible en %)
def ancres_devblog(p: ModelParams) -> List[Tuple[str, Item, Rune, Tuple[int, int, int]]]:
    """Scénarios reproduisant les situations décrites par le DevBlog Ankama 1.27.

    Ce sont les SEULES valeurs officielles de probabilité connues. Un modèle qui
    ne les reproduit pas approximativement est faux.
    """
    # Objet simple, 3 lignes, fourchettes larges
    simple_tpl = [Effect("force", 1, 30), Effect("vitalite", 1, 100), Effect("sagesse", 1, 15)]
    # Objet complexe : beaucoup de lignes lourdes
    complexe_tpl = [
        Effect("force", 1, 60), Effect("vitalite", 1, 300), Effect("sagesse", 1, 40),
        Effect("dommages", 1, 12), Effect("critiques", 1, 8),
        Effect("res_pct_feu", 1, 10), Effect("res_pct_terre", 1, 10),
        Effect("portee", 1, 1),
    ]
    rune_fo = Rune("Rune Fo", "force", 1)
    rune_pa_fo = Rune("Rune Pa Fo", "force", 3, 2)
    rune_do = Rune("Rune Do", "dommages", 1)
    rune_pm = Rune("Rune Ga Pme", "pm", 1)

    # #1 Pmax(PWRGmin & PWRmin) : objet simple au jet mini, ligne au mini, petite rune
    a1 = Item(simple_tpl, level=50, name="simple@min")

    # #2 Pmax(PWRGmax & PWRmax) : objet simple au jet parfait, petite rune
    a2 = Item(simple_tpl, level=50, name="simple@max").to_max()
    a2.set_values(force=27)                      # on tente les 3 derniers points (Pa Fo)

    # #3 Pmin(PWRGmax & PWRmax) : objet complexe au jet parfait, grosse rune
    a3 = Item(complexe_tpl, level=200, name="complexe@max").to_max()
    a3.set_values(dommages=11)

    # #5 Pmin(création d'effet) : exo PM sans puits
    a5 = Item(simple_tpl, level=50, name="exo_sans_puits").to_max()

    # #4 : exo PM AVEC puits
    a4 = Item(simple_tpl, level=50, name="exo_avec_puits").to_max()
    a4.puits = 95.0

    return [
        ("1 Pmax(PWRGmin&PWRmin)", a1, rune_fo, (66, 34, 0)),
        # "Pmax" => le forgemage utilise le palier de rune adapté : pas de pénalité ×20
        ("2 Pmax(PWRGmax&PWRmax)", a2, rune_pa_fo, (34, 50, 16)),
        ("3 Pmin(PWRGmax&PWRmax)", a3, rune_do, (15, 50, 35)),
        ("4 exo AVEC puits",       a4, rune_pm, (1, 22, 77)),
        ("5 exo SANS puits",       a5, rune_pm, (1, 0, 99)),
    ]


def score_ancres(p: ModelParams) -> float:
    """-somme des erreurs quadratiques sur les triplets officiels (à MAXIMISER)."""
    err = 0.0
    for _, item, rune, (tsc, tsn, tec) in ancres_devblog(p):
        psc, psn, pec = probabilites(item, rune, p)
        err += (psc * 100 - tsc) ** 2 + (psn * 100 - tsn) ** 2 + (pec * 100 - tec) ** 2
    return -err


# --- Préréglage recommandé ---------------------------------------------------
def params_devblog_fit(**kwargs) -> ModelParams:
    """Jeu de paramètres ajusté sur les 5 triplets officiels du DevBlog 1.27.

    Obtenu par `calibrate_multistart(score_ancres, ModelParams())`.
    Erreur quadratique totale : 13856 (StarLoco brut) -> 194 (ajusté).
    Reproduit les 5 ancres à ~10 points de pourcentage près au pire.

    C'est le préréglage RECOMMANDÉ par défaut pour un simulateur, en attendant
    une calibration sur des données réelles (ALGORITHME.md §12).
    ATTENTION : ajusté sur 5 points seulement. Il n'a aucune valeur prédictive
    démontrée en dehors de ces 5 situations.
    """
    base = dict(
        rate_fm=20.0,
        facteur_diff=1.0,
        plafond_mstat=1.2,
        exposant_c=1.0,
        exposant_mstat=1.0,
        exposant_taille=0.4,
        coef_exo=0.25,
    )
    base.update(kwargs)
    return ModelParams(**base)


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
    p = ModelParams()
    print("=== Ancres officielles DevBlog 1.27, paramètres PAR DÉFAUT (StarLoco brut) ===")
    for nom, item, rune, cible in ancres_devblog(p):
        psc, psn, pec = probabilites(item, rune, p)
        print(f"  {nom:26s} modèle {psc*100:5.1f}/{psn*100:5.1f}/{pec*100:5.1f}"
              f"   cible {cible[0]:3d}/{cible[1]:3d}/{cible[2]:3d}")
    print(f"  score = {score_ancres(p):.1f}\n")

    print("=== Après calibration sur les ancres (descente par coordonnées, multi-départ) ===")
    fitted, sc = calibrate_multistart(score_ancres, p, passes=4, verbose=True)
    for nom, item, rune, cible in ancres_devblog(fitted):
        psc, psn, pec = probabilites(item, rune, fitted)
        print(f"  {nom:26s} modèle {psc*100:5.1f}/{psn*100:5.1f}/{pec*100:5.1f}"
              f"   cible {cible[0]:3d}/{cible[1]:3d}/{cible[2]:3d}")
    print(f"  score = {sc:.1f}")
    print(f"  rate_fm={fitted.rate_fm} facteur_diff={fitted.facteur_diff} "
          f"plafond_mstat={fitted.plafond_mstat} exposant_c={fitted.exposant_c} "
          f"exposant_mstat={fitted.exposant_mstat} "
          f"exposant_taille={fitted.exposant_taille} coef_exo={fitted.coef_exo}")


if __name__ == "__main__":
    _demo()
