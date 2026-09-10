"""
test_fm_sim.py — Tests d'acceptation du simulateur de forgemagie.

Correspond aux tests T1-T9 de ALGORITHME.md §12.5.
Aucune dépendance externe : `python3 test_fm_sim.py`.

⚠️ Mis à jour après la découverte de la SOURCE PRIMAIRE
   `sources/archive/DEVBLOG-ANKAMA-ORIGINAL.md` :
   - ancre 2 = 43/50/7 (et non 34/50/16) ;
   - le triplet « 1/22/77 exo avec puits » N'EXISTE PAS -> tests supprimés ;
   - nouvelle ancre 4 « création d'effet AU MIEUX » = 32/50/18 -> l'exo n'est
     PAS toujours à 1 %, le 1 % est un PLANCHER ;
   - SN sur objet mono-jet = no-op ;
   - malus non overmaxés non « puisables », malus plafonnés au max naturel ;
   - deux plafonds distincts (par effet = 101, par objet = inconnu).
"""

import math
import random
import statistics
import sys
import unittest

from fm_sim import (
    COEF_BONUS_DOFUS2, COEF_BONUS_RETRO, RUNES, RUNES_RETRO,
    Effect, Item, ModelParams, Rune,
    ancres_devblog, appliquer_perte, attempt, calibrate_multistart,
    cas_exo_pa_pm_po, controle_exo, ecarts_ancres,
    monte_carlo_exo, monte_carlo_remontage, monte_carlo_tentatives,
    params_devblog_fit, params_devblog_fit_complet,
    probabilites, score_ancres, tentative_possible, wilson_ci,
)


# --- objets de test ----------------------------------------------------------

def amulette() -> Item:
    """Objet simple : 3 lignes, fourchettes larges."""
    return Item([Effect("force", 1, 30),
                 Effect("vitalite", 1, 100),
                 Effect("sagesse", 1, 15)], level=50, name="amulette")


def gelano() -> Item:
    """Objet type 'support d'exo' : petit, peu de poids, aucun PA/PM natif."""
    return Item([Effect("vitalite", 1, 30),
                 Effect("sagesse", 1, 5)], level=60, name="gelano")


class T1_ExoTaux(unittest.TestCase):
    """T1 — la PORTE DE SORTIE communautaire.

    La communauté est unanime : exo PA/PM/PO = 1 % SC, 99 % EC, jamais de SN.
    Mesure réelle : 111/10 000 = 1.11 %, IC95 [0.905 % ; 1.315 %].
    Le modèle doit y retomber **naturellement** (le plancher officiel 1/0/99 de
    l'ancre 5 est atteint parce que le poids de rune est énorme et la ligne non
    naturelle), et **non** par un câblage « exo = 1 % ».
    """

    def test_exo_pm_1_pourcent(self):
        p = params_devblog_fit()
        item = gelano().to_max()
        rune = RUNES["ga_pme"]

        psc, psn, pec = probabilites(item, rune, p)
        self.assertAlmostEqual(psc, 0.01, places=9, msg="le plancher exo doit être 1 %")
        self.assertEqual(psn, 0.0, "pas de succès neutre sur un exo sans puits")

        n = 100_000
        res = monte_carlo_tentatives(item, rune, n, p, seed=1234, reset_item=True)
        lo, hi = wilson_ci(res.sc, n)
        print(f"\n  [T1] exo PM : {res.sc}/{n} = {res.p_sc:.4%} "
              f"(IC95 Wilson [{lo:.4%}, {hi:.4%}])")
        self.assertGreater(res.p_sc, 0.009, "taux d'exo trop bas")
        self.assertLess(res.p_sc, 0.011, "taux d'exo trop haut")
        self.assertEqual(res.sn, 0, "aucun SN attendu sur un exo sans puits")
        # la vraie valeur 1 % doit être dans l'IC
        self.assertLessEqual(lo, 0.01)
        self.assertGreaterEqual(hi, 0.01)

    def test_exo_pa_pm_po_au_plancher_sur_tous_les_supports(self):
        """Sur 3 supports très différents (léger nv60 -> complexe nv200), les 9
        combinaisons PA/PM/PO doivent donner 1/0/99 SANS câblage."""
        p = params_devblog_fit()
        for nom, triplet in controle_exo(p):
            self.assertEqual(triplet, (1, 0, 99), f"{nom} doit être au plancher")
        print(f"  [T1] 9 cas exo PA/PM/PO -> tous 1/0/99, atteints par le plancher "
              f"officiel (aucun `if exo: return 0.01` dans le code)")

    def test_le_1_pourcent_nest_PAS_cable(self):
        """Preuve que le 1 % n'est pas une constante : la MÊME fonction, sur une
        création d'effet facile (ancre 4), rend ~32 % — pas 1 %."""
        p = params_devblog_fit()
        _, item, rune, cible = ancres_devblog(p)[3]
        psc, psn, pec = probabilites(item, rune, p)
        self.assertGreater(psc, 0.25, "une création d'effet facile doit dépasser 25 %")
        self.assertGreater(psn, 0.30, "et le SN existe bien en création d'effet")
        print(f"  [T1] même code, création d'effet facile : {psc:.0%}/{psn:.0%}/{pec:.0%} "
              f"(cible {cible[0]}/{cible[1]}/{cible[2]}) -> « l'exo c'est 1 % » est FAUX "
              f"en général")

    def test_continuum_creation_deffet(self):
        """La création d'effet doit couvrir tout l'intervalle 32/50/18 -> 1/0/99
        de façon monotone quand la difficulté augmente, sans discontinuité autre
        que le plancher officiel."""
        p = params_devblog_fit()
        courbe = []
        for lourdeur in (0, 1, 2, 4, 8, 16, 32):
            it = Item([Effect("vitalite", 1, 30), Effect("sagesse", 1, 5)], level=20)
            it.set_values(vitalite=1 + lourdeur, sagesse=max(1, lourdeur // 4))
            psc, psn, _ = probabilites(it, RUNES["fo"], p)   # exo Force
            courbe.append((lourdeur, psc, psn))
        print("  [T1] création d'effet Force, difficulté croissante : " +
              " ".join(f"{l}:{a:.0%}/{b:.0%}" for l, a, b in courbe))
        scs = [a for _, a, _ in courbe]
        self.assertTrue(all(x >= y - 1e-9 for x, y in zip(scs, scs[1:])),
                        "P_SC doit décroître de façon monotone")
        self.assertGreater(scs[0], 0.25)
        self.assertLessEqual(scs[-1], scs[0])


class T2_PlancherOfficiel(unittest.TestCase):
    """T2 — le plancher officiel est 1/0/99, et RIEN d'autre.

    Le triplet « 1/22/77 exo avec puits » colporté par le relais Yin-Yang
    N'EXISTE PAS dans le DevBlog original : le puits ne crée pas de SN.
    """

    def test_le_puits_ne_change_pas_le_triplet(self):
        p = params_devblog_fit()
        sans = gelano().to_max()
        avec = gelano().to_max()
        avec.puits = 95.0

        s_sc, s_sn, s_ec = probabilites(sans, RUNES["ga_pme"], p)
        a_sc, a_sn, a_ec = probabilites(avec, RUNES["ga_pme"], p)
        print(f"\n  [T2] sans puits {s_sc:.0%}/{s_sn:.0%}/{s_ec:.0%}  "
              f"avec puits {a_sc:.0%}/{a_sn:.0%}/{a_ec:.0%}")
        self.assertEqual((round(s_sc*100), round(s_sn*100), round(s_ec*100)), (1, 0, 99))
        self.assertEqual((round(a_sc*100), round(a_sn*100), round(a_ec*100)), (1, 0, 99),
                         "le triplet 1/22/77 n'existe pas : le puits ne crée pas de SN")

    def test_aucun_parametre_1_22_77_ne_subsiste(self):
        p = ModelParams()
        self.assertFalse(hasattr(p, "sn_avec_puits"))
        self.assertFalse(hasattr(p, "puits_donne_sn"))
        print("  [T2] paramètres `sn_avec_puits` / `puits_donne_sn` bien supprimés")

    def test_le_puits_absorbe_en_partie(self):
        """« de la magie résiduelle […] absorbera EN PARTIE les échecs futurs »."""
        p = params_devblog_fit(puits_absorption=0.5)
        rng = random.Random(0)
        it = amulette().to_max()
        it.puits = 100.0
        appliquer_perte(it, 40.0, None, p, rng)
        self.assertAlmostEqual(it.puits, 80.0, places=6,
                               msg="avec absorption 0.5, 40 de perte consomme 20 de puits")
        print("  [T2] absorption partielle du puits paramétrable (`puits_absorption`)")


class T3_LoiGeometrique(unittest.TestCase):
    """T3/T4 — nb de runes par exo : moyenne ≈ 100, médiane ≈ 69, P(<=n) = 1 - 0.99^n."""

    def test_moyenne_et_mediane(self):
        p = params_devblog_fit()
        runs = monte_carlo_exo(gelano().to_max(), RUNES["ga_pme"], 3000, p, seed=7)
        moy = statistics.mean(runs)
        med = statistics.median(runs)
        print(f"\n  [T3] {len(runs)} campagnes d'exo : moyenne={moy:.1f} runes, "
              f"médiane={med:.0f} (théorie : 100 et 69)")
        self.assertGreater(moy, 90)
        self.assertLess(moy, 112)
        self.assertGreater(med, 58)
        self.assertLess(med, 82)

    def test_fonction_de_repartition(self):
        p = params_devblog_fit()
        runs = monte_carlo_exo(gelano().to_max(), RUNES["ga_pme"], 4000, p, seed=99)
        for n_essais, attendu in ((69, 0.5005), (100, 0.6340), (300, 0.9510)):
            obs = sum(1 for k in runs if k <= n_essais) / len(runs)
            print(f"  [T4] P(X<={n_essais}) observé={obs:.3f} théorie={attendu:.3f}")
            self.assertLess(abs(obs - attendu), 0.035)


class T5_Invariants(unittest.TestCase):
    """T5 — les bornes OFFICIELLES doivent tenir sur tout l'espace d'état."""

    def test_invariants_sur_echantillon_aleatoire(self):
        rng = random.Random(42)
        for preset in (ModelParams(), params_devblog_fit(),
                       params_devblog_fit_complet(), ModelParams.retro()):
            for _ in range(4000):
                tpl = [Effect("force", 1, rng.randint(5, 80)),
                       Effect("vitalite", 1, rng.randint(20, 400)),
                       Effect("sagesse", 1, rng.randint(3, 40))]
                it = Item(tpl, level=rng.randint(1, 200))
                for e in it.effects:
                    e.value = rng.randint(0, int(e.jet_max * 1.3) + 1)
                it.effects = [e for e in it.effects if e.value >= 1]
                it.puits = rng.choice([0.0, 0.0, 5.0, 40.0, 95.0])
                it.ethere = rng.random() < 0.2
                rune = rng.choice(list(RUNES.values()))
                psc, psn, pec = probabilites(it, rune, preset)

                self.assertAlmostEqual(psc + psn + pec, 1.0, places=9)
                self.assertGreaterEqual(psc, 0.0)
                self.assertGreaterEqual(psn, 0.0)
                self.assertGreaterEqual(pec, -1e-12)
                self.assertLessEqual(psn, 0.50 + 1e-12, "INV-2 : P_SN <= 50 %")
                self.assertLessEqual(psc, 0.66 + 1e-12, "INV-3 : P_SC <= 66 %")
                # INV-1 : P_SC >= 1 %, sauf tentative structurellement impossible
                possible = pec < 1.0 or psc > 0
                if possible and (psc, psn, pec) != (0.0, 0.0, 1.0):
                    self.assertGreaterEqual(psc, 0.01 - 1e-12, "INV-1 : P_SC >= 1 %")
        print("\n  [T5] invariants 1 % / 50 % / 66 % vérifiés sur 16 000 états aléatoires")


class T6_Plafonds(unittest.TestCase):
    """T6 — les DEUX plafonds, qu'il ne faut pas confondre.

    (a) PAR EFFET : PWR non-naturel + PWR actuel de l'effet <= 101.
        C'est lui qui donne overmax = floor(101 / coef).            [OBS]
    (b) PAR OBJET : « une limite fixe de puissance d'effets non-naturels, pour
        l'intégralité des objets » — celle qui interdit PA + PM. VALEUR INCONNUE,
        donc désactivée par défaut (`cap_objet_non_naturel = None`).  [OBS]
    """

    def test_cap_jamais_franchi(self):
        p = params_devblog_fit()
        rng = random.Random(3)
        it = Item([Effect("force", 1, 20), Effect("sagesse", 1, 10)], level=100)
        it.to_max()
        for _ in range(20000):
            attempt(it, RUNES["ra_fo"], p, rng)
            e = it.get("force")
            if e:
                over = e.value * p.coef("force") - 20 * p.coef("force")
                self.assertLessEqual(over, p.cap_effet_non_naturel + 1e-9)
        e = it.get("force")
        print(f"\n  [T6] force finale = {e.value if e else 0} "
              f"(cap théorique = 20 + {p.overmax('force')} = {20 + p.overmax('force')})")

    def test_overmax_derives_de_101(self):
        p = ModelParams()
        attendus = {"force": 101, "sagesse": 33, "initiative": 1010, "pa": 1, "pm": 1,
                    "portee": 1, "dommages": 5, "dom_neutre": 20, "res_pct_feu": 16,
                    "invocations": 3, "esquive_pa": 14, "res_feu": 50}
        for stat, cap in attendus.items():
            self.assertEqual(p.overmax(stat), cap, f"overmax {stat}")
        # Rétro : CC coef 30 -> overmax 3 ; Vitalité coef 0.25 -> 404
        pr = ModelParams.retro()
        self.assertEqual(pr.overmax("critiques"), 3)
        self.assertEqual(pr.overmax("vitalite"), 404)
        self.assertEqual(p.overmax("vitalite"), 505)      # Dofus 2.x, coef 0.2
        print("  [T6] tous les overmax se dérivent bien de floor(101/coef)")

    def test_les_deux_plafonds_sont_distincts(self):
        p = ModelParams()
        self.assertEqual(p.cap_effet_non_naturel, 101.0)
        self.assertIsNone(p.cap_objet_non_naturel,
                          "la valeur du plafond PAR OBJET n'est pas connue")
        self.assertEqual(p.cap_over, p.cap_effet_non_naturel, "alias historique")
        print("  [T6] plafond par effet = 101 [OBS] ; plafond par objet = inconnu [OBS]")

    def test_plafond_par_objet_interdit_pa_plus_pm(self):
        """Le seul comportement documenté du plafond PAR OBJET : sur un objet
        sans PA ni PM natifs, on peut créer l'un OU l'autre, pas les deux.
        L'exemple d'Ankama encadre sa valeur dans [100 ; 190)."""
        for cap in (100.0, 150.0, 189.0):
            p = params_devblog_fit(cap_objet_non_naturel=cap)
            it = gelano().to_max()
            ok, _ = tentative_possible(it, RUNES["ga_pa"], p)
            self.assertTrue(ok, f"un PA seul (poids 100) doit passer avec cap={cap}")
            it.set_values(pa=1)
            ok2, raison = tentative_possible(it, RUNES["ga_pme"], p)
            self.assertFalse(ok2, f"PA+PM (poids 190) doit être refusé avec cap={cap}")
        print("  [T6] plafond par objet : PA seul OK, PA+PM refusé pour tout cap "
              "dans [100 ; 190)")

    def test_exos_uniques_limites(self):
        p = params_devblog_fit()
        it = gelano().to_max()
        it.set_values(pa=1, pm=1, portee=1)
        self.assertEqual(it.nb_exos_uniques(), 3)
        ok, raison = tentative_possible(it, RUNES["ga_pa"], p)
        # la 2e Ga Pa est bloquée par le plafond PAR EFFET (100*2 - 0 > 101)
        self.assertFalse(ok)
        print(f"  [T6] 2e PA exo refusée ({raison})")


class T7_Puits(unittest.TestCase):
    """T7 — conservation du puits : puits += poids_perdu - poids_rune, borné à 0."""

    def test_formule_du_puits_pas_a_pas(self):
        p = params_devblog_fit()
        rng = random.Random(11)
        it = amulette().to_max()
        for _ in range(3000):
            avant = it.puits
            o = attempt(it, RUNES["sa"], p, rng)
            poids_rune = RUNES["sa"].add * p.coef("sagesse")
            if o.bloquee or o.affichage == "SN_NUL":
                continue
            # bilan complet : le puits déjà consommé pour amortir la perte
            # (`absorbe_puits`) ne peut pas être recrédité
            attendu = max(0.0, avant - o.absorbe_puits + o.poids_perdu - poids_rune)
            self.assertAlmostEqual(o.puits_apres, attendu, places=6)
            self.assertGreaterEqual(o.puits_apres, 0.0)
        print("\n  [T7] bilan du puits (puits - absorbé + pertes - rune) vérifié "
              "sur 3 000 tentatives")

    def test_puits_absorbe_les_pertes(self):
        p = params_devblog_fit()
        rng = random.Random(5)
        it = amulette().to_max()
        it.puits = 500.0
        avant = {e.stat: e.value for e in it.effects}
        for _ in range(30):
            appliquer_perte(it, 10.0, None, p, rng)
        apres = {e.stat: e.value for e in it.effects}
        self.assertEqual(avant, apres, "avec 500 de puits, aucune stat ne doit bouger")
        self.assertLess(it.puits, 500.0, "le puits doit avoir été consommé")
        print(f"  [T7] puits 500 -> {it.puits:.0f}, aucune stat perdue")

    def test_puits_genere_par_une_grosse_perte(self):
        p = params_devblog_fit()
        rng = random.Random(2)
        it = Item([Effect("pa", 1, 1), Effect("force", 1, 50)], level=100).to_max()
        it.puits = 0.0
        # on force un EC massif en tentant une rune Fo (poids 1) : si le PA saute,
        # le puits doit valoir ~100 - 1 = 99
        perdu, _ = appliquer_perte(it, 200.0, None, p, rng)
        self.assertGreater(perdu, 50.0)
        print(f"  [T7] perte massive : {perdu:.0f} de poids retiré de l'objet")


class T8_T9_Ancres(unittest.TestCase):
    """T8/T9 — les triplets officiels du DevBlog 1.27."""

    def test_le_jeu_dancres_est_bien_le_jeu_corrige(self):
        p = params_devblog_fit()
        cibles = [c for _, _, _, c in ancres_devblog(p)]
        self.assertEqual(cibles, [(66, 34, 0), (43, 50, 7), (15, 50, 35),
                                  (32, 50, 18), (1, 0, 99)])
        self.assertNotIn((34, 50, 16), cibles, "ancre 2 tranchée : 43/50/7")
        self.assertNotIn((1, 22, 77), cibles, "le triplet 1/22/77 n'existe pas")
        print("\n  [T8] jeu d'ancres = 66/34/0 · 43/50/7 · 15/50/35 · 32/50/18 · 1/0/99")

    def test_ancre_meilleur_cas(self):
        p = params_devblog_fit()
        nom, item, rune, cible = ancres_devblog(p)[0]
        psc, psn, pec = probabilites(item, rune, p)
        print(f"  [T8] {nom} : {psc:.0%}/{psn:.0%}/{pec:.0%} (cible 66/34/0)")
        self.assertEqual((round(psc*100), round(psn*100), round(pec*100)), (66, 34, 0))

    def test_toutes_les_ancres_a_moins_de_3_points(self):
        p = params_devblog_fit()
        print("  [T9] écart aux 5 triplets officiels :")
        for nom, mod, cible, emax in ecarts_ancres(p):
            print(f"        {nom:28s} {mod[0]:3d}/{mod[1]:3d}/{mod[2]:3d}"
                  f"  vs {cible[0]:3d}/{cible[1]:3d}/{cible[2]:3d}   ecart max {emax} pts")
            self.assertLessEqual(emax, 3,
                                 f"{nom} : le modèle ajusté doit rester à <=3 pts")

    def test_ancre_3_est_structurellement_contrainte(self):
        """RÉSULTAT : dans la famille StarLoco, P_SN/P_SC = 1 + w/sqrt(PWRg+PWRcarac)
        tant que P_SN < 50. L'ancre 3 (15/50) exige w/sqrt(S) >= 35/15 = 2.33.
        Avec une rune de remontage ordinaire sur un objet complexe, c'est
        MATHÉMATIQUEMENT impossible : aucun paramètre ne peut le corriger."""
        p = params_devblog_fit()
        complexe = Item([Effect("force", 1, 60), Effect("vitalite", 1, 300),
                         Effect("sagesse", 1, 40), Effect("dommages", 1, 12),
                         Effect("critiques", 1, 8), Effect("res_pct_feu", 1, 10),
                         Effect("res_pct_terre", 1, 10), Effect("portee", 1, 1)],
                        level=200).to_max()
        complexe.set_values(dommages=11)
        S = complexe.pwr_g(p) + complexe.pwr_carac(p, "dommages")
        ratio = RUNES["do"].weight(p) / math.sqrt(S)
        self.assertLess(ratio, 2.33,
                        "avec une rune Do sur cet objet, 15/50/35 est hors d'atteinte")
        # ...alors que la reconstruction retenue (Ga Pa sur objet THL) le permet
        _, a3, r3, _ = ancres_devblog(p)[2]
        S3 = a3.pwr_g(p) + a3.pwr_carac(p, r3.stat)
        ratio3 = r3.weight(p) / math.sqrt(S3)
        self.assertGreaterEqual(ratio3, 2.33)
        print(f"  [T9] contrainte structurelle w/sqrt(S) >= 2.33 pour l'ancre 3 : "
              f"rune Do -> {ratio:.2f} (impossible), rune Ga Pa -> {ratio3:.2f} (OK)")

    def test_la_calibration_ameliore_bien_le_score(self):
        brut = score_ancres(ModelParams())
        ancien = score_ancres(ModelParams(rate_fm=20.0, facteur_diff=1.0,
                                          plafond_mstat=1.2, exposant_c=1.0,
                                          exposant_mstat=1.0, exposant_taille=0.4,
                                          coef_exo=0.25))
        fit = score_ancres(params_devblog_fit())
        print(f"  [T9] score : StarLoco brut {brut:.0f} -> ancien préréglage "
              f"(calibré sur les ancres FAUSSES) {ancien:.0f} -> nouveau {fit:.0f}")
        self.assertGreater(fit, ancien)
        self.assertGreater(fit, -50.0)

    def test_le_calibrateur_retrouve_le_prereglage(self):
        fitted, sc = calibrate_multistart(score_ancres, ModelParams(), passes=4)
        print(f"  [T9] calibrate_multistart -> score {sc:.0f} "
              f"(exposant_taille={fitted.exposant_taille}, rate_fm={fitted.rate_fm})")
        self.assertGreaterEqual(sc, score_ancres(ModelParams()))
        self.assertGreater(sc, -50.0)


class T10_Remontage(unittest.TestCase):
    """Simulation d'un remontage complet d'objet simple."""

    def test_remontage_amulette_jet_max(self):
        p = params_devblog_fit()
        plan = [(RUNES["pa_fo"], 30), (RUNES["ra_vi"], 100), (RUNES["sa"], 15)]
        couts = []
        succes = 0
        for seed in range(200):
            it = amulette()               # part du jet minimum
            ok, used, final = monte_carlo_remontage(it, plan, p, seed=seed, max_runes=4000)
            if ok:
                succes += 1
                couts.append(used)
        print(f"\n  [T10] remontage amulette au jet max : {succes}/200 réussis, "
              f"médiane {statistics.median(couts) if couts else float('nan'):.0f} runes, "
              f"moyenne {statistics.mean(couts) if couts else float('nan'):.0f}")
        self.assertGreater(succes, 150, "un objet simple doit se remonter la plupart du temps")
        self.assertGreater(statistics.median(couts), 5,
                           "un remontage doit coûter plus que quelques runes")

    def test_remontage_plus_dur_sur_objet_lourd(self):
        p = params_devblog_fit()
        leger = Item([Effect("force", 1, 20)], level=30)
        lourd = Item([Effect("force", 1, 20), Effect("vitalite", 1, 400),
                      Effect("dommages", 1, 15), Effect("critiques", 1, 5),
                      Effect("portee", 1, 1)], level=200)
        n = 4000
        r_leger = monte_carlo_tentatives(leger, RUNES["fo"], n, p, seed=1)
        r_lourd = monte_carlo_tentatives(lourd, RUNES["fo"], n, p, seed=1)
        print(f"  [T10] même rune, même ligne au jet mini : "
              f"objet léger P_SC={r_leger.p_sc:.1%}, objet lourd P_SC={r_lourd.p_sc:.1%}")
        self.assertGreaterEqual(r_leger.p_sc, r_lourd.p_sc - 0.02,
                                "un objet lourd ne doit pas être PLUS facile")


class T11_Mecanique(unittest.TestCase):
    """Vérifications déterministes du modèle d'état."""

    def test_poids_de_ligne_et_objet(self):
        p = ModelParams()
        it = amulette().set_values(force=10, vitalite=50, sagesse=5)
        self.assertAlmostEqual(it.pwr_g(p), 10*1 + 50*0.2 + 5*3)      # 35
        self.assertAlmostEqual(it.pwr_max(p), 30*1 + 100*0.2 + 15*3)  # 95
        self.assertAlmostEqual(it.pwr_min(p), 1*1 + 1*0.2 + 1*3)      # 4.2
        self.assertAlmostEqual(it.pwr_carac(p, "force"), 10.0)

    def test_poids_de_rune(self):
        p = ModelParams()
        self.assertEqual(RUNES["ga_pa"].weight(p), 100)
        self.assertEqual(RUNES["ga_pme"].weight(p), 90)
        self.assertEqual(RUNES["po"].weight(p), 51)
        self.assertEqual(RUNES["do"].weight(p), 20)
        self.assertEqual(RUNES["sa"].weight(p), 3)
        self.assertEqual(RUNES["pa_fo"].weight(p), 3)
        self.assertEqual(RUNES["ra_fo"].weight(p), 10)
        self.assertAlmostEqual(RUNES["vi"].weight(p), 1.0)     # +5 vita x 0.2
        self.assertAlmostEqual(RUNES["ra_vi"].weight(p), 10.0)  # +50 vita x 0.2
        # Rétro : Rune Vi = +3 vita, coef 0.25 -> 0.75 (arrondi a 1 en jeu)
        pr = ModelParams.retro()
        self.assertAlmostEqual(RUNES_RETRO["vi"].weight(pr), 0.75)
        self.assertAlmostEqual(RUNES_RETRO["ra_vi"].weight(pr), 7.5)
        print("\n  [T11] poids de runes conformes aux tables (Ga Pa 100, Ga Pme 90, Po 51...)")

    def test_poids_des_malus_est_asymetrique(self):
        p = ModelParams()
        self.assertEqual(p.coef("sagesse"), 3.0)
        self.assertEqual(p.coef("sagesse", negative=True), 2.0)
        self.assertEqual(p.coef("dom_neutre"), 5.0)
        self.assertEqual(p.coef("dom_neutre", negative=True), 2.5)
        self.assertEqual(p.coef("pa"), p.coef("pa", negative=True))

    def test_sc_ajoute_exactement_la_valeur_de_la_rune(self):
        p = params_devblog_fit()
        it = amulette().set_values(force=5, vitalite=5, sagesse=1)
        rng = random.Random(0)
        vus = 0
        for _ in range(500):
            avant = it.get("force").value if it.get("force") else 0
            o = attempt(it, RUNES["pa_fo"], p, rng)
            if o.issue == "SC":
                self.assertEqual(o.valeur_apres, avant + 3)
                self.assertEqual(o.poids_perdu, 0.0, "aucune perte sur un SC")
                vus += 1
            if it.get("force") and it.get("force").value > 25:
                it = amulette().set_values(force=5, vitalite=5, sagesse=1)
        self.assertGreater(vus, 50)
        print("  [T11] SC : +rune.add exact, aucune perte")

    def test_ligne_disparait_sous_1(self):
        p = params_devblog_fit()
        rng = random.Random(1)
        it = Item([Effect("force", 1, 30), Effect("sagesse", 1, 10)], level=100)
        it.set_values(force=2, sagesse=10)
        for _ in range(80):
            appliquer_perte(it, 60.0, None, p, rng)
        stats = {e.stat for e in it.effects}
        self.assertNotIn("force", stats, "la ligne force doit avoir sauté")
        self.assertIsNotNone(it.template_of("force"),
                             "une ligne qui saute reste dans le template (non exotique)")
        print("  [T11] une ligne tombée sous 1 disparaît mais reste native")

    def test_over_saute_en_priorite(self):
        p = params_devblog_fit()
        rng = random.Random(4)
        n_over, n_autre = 0, 0
        for seed in range(400):
            rng = random.Random(seed)
            it = Item([Effect("force", 1, 20), Effect("sagesse", 1, 20)], level=100)
            it.set_values(force=40, sagesse=20)      # force en OVER
            _, touchees = appliquer_perte(it, 10.0, None, p, rng)
            if touchees:
                if touchees[0] == "force":
                    n_over += 1
                else:
                    n_autre += 1
        print(f"  [T11] perte : ligne over touchée en 1er {n_over}x, autre ligne {n_autre}x")
        self.assertGreater(n_over, n_autre * 5, "l'over doit sauter en priorité")

    def test_impossible_de_puiser_dans_un_malus_non_overmaxe(self):
        """« Il est impossible de "puiser" dans les malus […] à moins que ceux-ci
        ne soient overmaxés, car ils joueraient souvent le rôle de puits sans
        fonds. »  [OBS] DevBlog original."""
        p = params_devblog_fit()
        rng = random.Random(6)
        # malus naturel entre 10 et 40 ; valeur courante 20 = DANS la fourchette
        it = Item([Effect("initiative", 10, 40, is_negative=True),
                   Effect("force", 1, 20)], level=100)
        it.set_values(initiative=20, force=20)
        avant = it.get("initiative").value
        for _ in range(20):
            appliquer_perte(it, 30.0, None, p, rng)
        self.assertEqual(it.get("initiative").value, avant,
                         "un malus NON overmaxé ne doit jamais absorber de perte")
        print(f"\n  [T11] malus non overmaxé : {avant} -> {it.get('initiative').value} "
              f"(intouchable, pas de puits sans fond)")

    def test_on_peut_puiser_dans_un_malus_overmaxe(self):
        """Un malus AMÉLIORÉ au-delà de son meilleur état naturel (value < jet_min)
        est « overmaxé » : il redevient une réserve de perte, plafonnée au retour
        à l'état naturel."""
        p = params_devblog_fit()
        rng = random.Random(6)
        it = Item([Effect("initiative", 10, 40, is_negative=True),
                   Effect("force", 1, 20)], level=100)
        it.set_values(initiative=2, force=20)        # 2 < jet_min 10 -> overmaxé
        for _ in range(20):
            appliquer_perte(it, 30.0, None, p, rng)
        v = it.get("initiative").value
        self.assertGreater(v, 2, "un malus overmaxé doit pouvoir se dégrader")
        self.assertLessEqual(v, 10, "et jamais au-delà de son meilleur état naturel")
        print(f"  [T11] malus overmaxé : 2 -> {v} (dégradation bornée au naturel)")

    def test_malus_plafonne_au_malus_max_naturel(self):
        """« les malus ne peuvent dépasser le malus maximum naturel »  [OBS]"""
        p = params_devblog_fit()
        rng = random.Random(6)
        for _ in range(200):
            it = Item([Effect("initiative", 10, 40, is_negative=True),
                       Effect("force", 1, 20)], level=100)
            it.set_values(initiative=random.Random(_).choice([1, 5, 9]), force=20)
            for _k in range(10):
                appliquer_perte(it, 200.0, None, p, rng)
            e = it.get("initiative")
            if e:
                self.assertLessEqual(e.value, 40)
        print("  [T11] malus jamais au-delà du malus maximum naturel")

    def test_bonus_plancher_a_zero(self):
        """« les bonus d'un objet peuvent redescendre jusqu'à 0 au minimum »"""
        p = params_devblog_fit()
        rng = random.Random(9)
        it = Item([Effect("force", 1, 30), Effect("sagesse", 1, 10)], level=100).to_max()
        for _ in range(200):
            appliquer_perte(it, 300.0, None, p, rng)
            for e in it.effects:
                self.assertGreaterEqual(e.value, 0)
        print("  [T11] aucun bonus ne passe sous 0")

    def test_retrait_pa_pm_jamais_perdus(self):
        p = params_devblog_fit()
        rng = random.Random(8)
        it = Item([Effect("retrait_pa", 1, 5), Effect("force", 1, 20)], level=100).to_max()
        for _ in range(50):
            appliquer_perte(it, 40.0, None, p, rng)
        self.assertEqual(it.get("retrait_pa").value, 5)
        print("  [T11] retrait PA/PM jamais touché par une perte")

    def test_degressivite_a_80_pourcent(self):
        """La difficulté doit chuter brutalement au passage des 80 % du jet."""
        p = params_devblog_fit()
        tpl = [Effect("force", 0, 100), Effect("sagesse", 1, 10)]
        courbe = []
        for f in (0.5, 0.7, 0.79, 0.81, 0.9, 1.0, 1.05):
            it = Item(tpl, level=100)
            it.set_values(force=max(1, int(f * 100) - 1), sagesse=5)
            psc, _, _ = probabilites(it, RUNES["fo"], p)
            courbe.append((f, psc))
        print("  [T11] P_SC vs remplissage du jet : " +
              " ".join(f"{f:.2f}->{v:.0%}" for f, v in courbe))
        avant = [v for f, v in courbe if f <= 0.79]
        apres = [v for f, v in courbe if f >= 0.81]
        self.assertGreater(min(avant), max(apres),
                           "P_SC doit chuter au passage des 80 %")

    def test_regle_x20_facteur(self):
        """Le facteur t doit valoir 1 sous 16x puis décroître strictement."""
        from fm_sim import _facteur_x20
        p = params_devblog_fit()
        tpl = [Effect("vitalite", 0, 4000)]
        vals = []
        for ratio in (2, 8, 15, 16, 18, 20, 25, 40, 100):
            it = Item(tpl, level=100).set_values(vitalite=ratio * 5)
            vals.append((ratio, _facteur_x20(it, RUNES["vi"], p)))   # Rune Vi = +5
        print("\n  [T11] facteur x20 : " + " ".join(f"x{r}->{t:.2f}" for r, t in vals))
        for ratio, t in vals:
            if ratio <= 16:
                self.assertEqual(t, 1.0, f"pas de pénalité à x{ratio}")
        seq = [t for r, t in vals if r >= 16]
        self.assertTrue(all(a >= b for a, b in zip(seq, seq[1:])), "t doit décroître")
        self.assertLess(vals[-1][1], 0.05, "à x100 la rune doit être quasi morte")

    def test_regle_x20_effet_sur_p_sc(self):
        """Désactiver la règle du x20 doit remonter P_SC là où elle mord."""
        p_avec = params_devblog_fit()
        p_sans = params_devblog_fit(utiliser_regle_x20=False)
        # objet suffisamment lourd pour que P_SC ne sature pas à 66 %
        tpl = [Effect("vitalite", 0, 4000), Effect("dommages", 1, 20),
               Effect("sagesse", 1, 40), Effect("critiques", 1, 10)]
        courbe = []
        strictement_inferieur = 0
        for v in (25, 50, 100, 200, 400, 800):
            it = Item(tpl, level=200).set_values(vitalite=v, dommages=20,
                                                 sagesse=40, critiques=10)
            a, _, _ = probabilites(it, RUNES["vi"], p_avec)
            s, _, _ = probabilites(it, RUNES["vi"], p_sans)
            courbe.append((v / 5.0, a, s))
            if a < s:
                strictement_inferieur += 1
        print("  [T11] P_SC avec/sans regle x20 : " +
              " ".join(f"x{r:.0f}:{a:.0%}/{s:.0%}" for r, a, s in courbe))
        self.assertGreater(strictement_inferieur, 0,
                           "la règle x20 doit abaisser P_SC quelque part")
        avecs = [a for _, a, _ in courbe]
        self.assertTrue(all(x >= y for x, y in zip(avecs, avecs[1:])),
                        "P_SC doit décroître quand le ratio stat/rune augmente")

    def test_versions_retro_vs_dofus2(self):
        p2, pr = ModelParams(), ModelParams.retro()
        self.assertEqual(p2.coef("critiques"), 10.0)
        self.assertEqual(pr.coef("critiques"), 30.0)
        self.assertEqual(p2.coef("vitalite"), 0.2)
        self.assertEqual(pr.coef("vitalite"), 0.25)
        self.assertFalse(p2.metier_influe)
        self.assertTrue(pr.metier_influe)
        # Rétro : métier trop bas -> tentative impossible
        pr.niveau_metier = 10
        it = Item([Effect("force", 1, 20)], level=100).to_max()
        psc, psn, pec = probabilites(it, RUNES["fo"], pr)
        self.assertEqual((psc, psn, pec), (0.0, 0.0, 1.0))
        print("  [T11] tables Rétro / Dofus 2 distinctes, métier bloquant en Rétro seulement")

    def test_sn_sur_objet_mono_jet_est_un_no_op(self):
        """« Si ce résultat n'est pas possible (objet qui ne dispose que d'un seul
        jet par exemple), RIEN NE SE PASSE en cas de succès partiel. »  [OBS]"""
        p = params_devblog_fit()
        rng = random.Random(3)
        mono = Item([Effect("force", 1, 30)], level=30)
        mono.set_values(force=10)
        n_sn, n_noop = 0, 0
        for _ in range(3000):
            avant = mono.get("force").value if mono.get("force") else 0
            o = attempt(mono, RUNES["fo"], p, rng)
            if o.issue == "SN":
                n_sn += 1
                if o.affichage == "SN_NUL":
                    n_noop += 1
                    self.assertEqual(o.valeur_apres, avant, "no-op : la valeur ne bouge pas")
                    self.assertFalse(o.rune_passee, "no-op : la rune ne passe pas")
                    self.assertEqual(o.poids_perdu, 0.0)
                    self.assertEqual(o.puits_apres, o.puits_avant)
            if mono.get("force") and mono.get("force").value > 25:
                mono.set_values(force=10)
        self.assertGreater(n_sn, 50, "il faut des SN pour tester")
        self.assertEqual(n_noop, n_sn, "sur un mono-jet SANS puits, tout SN est un no-op")
        print(f"\n  [T11] objet mono-jet : {n_noop}/{n_sn} succès partiels -> no-op complet")

    def test_sn_reste_effectif_des_qu_une_autre_ligne_existe(self):
        p = params_devblog_fit()
        rng = random.Random(3)
        it = Item([Effect("force", 1, 30), Effect("sagesse", 1, 10)], level=30)
        it.set_values(force=10, sagesse=10)
        vus = 0
        for _ in range(2000):
            o = attempt(it, RUNES["fo"], p, rng)
            if o.issue == "SN" and o.affichage != "SN_NUL":
                vus += 1
            if it.get("force") and it.get("force").value > 25:
                it.set_values(force=10, sagesse=10)
        self.assertGreater(vus, 20, "avec 2 lignes, le SN doit s'appliquer normalement")
        print(f"  [T11] objet à 2 lignes : {vus} succès partiels effectifs")

    def test_facteur_ethere_rend_plus_difficile(self):
        p = params_devblog_fit_complet()
        # objet assez lourd pour que P_SC ne sature pas au clamp de 66 %
        tpl = [Effect("force", 1, 60), Effect("vitalite", 1, 300),
               Effect("sagesse", 1, 40), Effect("dommages", 1, 12)]
        normal = Item(tpl, level=180).to_max().set_values(force=20)
        ether = Item(tpl, level=180, ethere=True).to_max().set_values(force=20)
        a, _, _ = probabilites(normal, RUNES["fo"], p)
        b, _, _ = probabilites(ether, RUNES["fo"], p)
        self.assertLess(b, a, "un objet éthéré doit être STRICTEMENT plus difficile")
        print(f"  [T11] éthéré : P_SC {a:.0%} -> {b:.0%} (plus difficile) [OBS]")

    def test_facteur_mono_jet_rend_plus_facile(self):
        p = params_devblog_fit_complet()
        mono = Item([Effect("force", 1, 30)], level=100).set_values(force=25)
        duo = Item([Effect("force", 1, 30), Effect("sagesse", 1, 1)],
                   level=100).set_values(force=25, sagesse=1)
        a, _, _ = probabilites(mono, RUNES["fo"], p)
        b, _, _ = probabilites(duo, RUNES["fo"], p)
        self.assertGreaterEqual(a, b)
        print(f"  [T11] mono-jet : P_SC {b:.0%} -> {a:.0%} (plus facile) [OBS]")

    def test_nombre_dover_exo_compte_le_jet_cible(self):
        """« Plus l'objet dispose d'overmax/bonus exotiques (EN PRENANT EN COMPTE
        CELUI EN COURS DE MODIFICATION), plus la difficulté augmente. »  [OBS]
        C'est le SEUL endroit où le jet ciblé est compté : il est au contraire
        EXCLU de la qualité globale."""
        it = Item([Effect("force", 1, 20), Effect("sagesse", 1, 10)], level=100)
        it.set_values(force=20, sagesse=5)
        # aucune ligne over pour l'instant, mais on VISE un over sur la force
        self.assertEqual(it.nb_over_exo("force", 1), 1,
                         "le jet ciblé, over après la tentative, doit être compté")
        self.assertEqual(it.nb_over_exo("sagesse", 1), 0,
                         "sagesse 5+1 <= 10 : pas d'over, et rien d'autre n'est over")
        it.set_values(force=25)                       # force désormais over
        self.assertEqual(it.nb_over_exo("sagesse", 1), 1, "la force over est comptée")
        self.assertEqual(it.nb_over_exo("force", 1), 1)
        # et la qualité globale l'EXCLUT
        p = ModelParams()
        self.assertAlmostEqual(it.pwr_g(p, exclure="force"),
                               it.pwr_g(p) - 25 * p.coef("force"))
        print("  [T11] jet ciblé : COMPTÉ dans nb_over_exo, EXCLU de la qualité globale")

    def test_penalite_par_over_exo_est_decroissante(self):
        p = params_devblog_fit()
        vals = []
        for n_over in range(0, 4):
            tpl = [Effect("force", 1, 20), Effect("sagesse", 1, 10),
                   Effect("vitalite", 1, 100), Effect("critiques", 1, 5)]
            it = Item(tpl, level=100).set_values(force=20, sagesse=10,
                                                 vitalite=100, critiques=5)
            for stat, base in list(zip(("sagesse", "vitalite", "critiques"),
                                       (10, 100, 5)))[:n_over]:
                it.set_values(**{stat: base + 1})     # rendre over
            a, _, _ = probabilites(it, RUNES["fo"], p)
            vals.append((n_over, a))
        print("  [T11] P_SC vs nb d'over sur l'objet : " +
              " ".join(f"{n}:{v:.0%}" for n, v in vals))
        seq = [v for _, v in vals]
        self.assertTrue(all(x >= y - 1e-9 for x, y in zip(seq, seq[1:])),
                        "plus d'over/exo => plus difficile")

    def test_jet_fixe_ignore_le_palier_des_80_pourcent(self):
        """« Si le bonus a un jet fixe, ce facteur n'est pas pris en compte. »"""
        from fm_sim import fill_ratio, _facteur_c
        p = params_devblog_fit()
        it = Item([Effect("pa", 1, 1), Effect("force", 1, 50)], level=100)
        it.set_values(force=50, pa=0)                 # PA naturel tombé à 0
        f = fill_ratio(it, RUNES["ga_pa"], p)
        self.assertEqual(_facteur_c(f, p), 1.0, "jet fixe : pas de palier 80 %")
        p2 = params_devblog_fit(jet_fixe_ignore_palier=False)
        self.assertLess(_facteur_c(fill_ratio(it, RUNES["ga_pa"], p2), p2), 1.0)
        print("  [T11] jet fixe (PA/PM/PO) : palier des 80 % désactivé [OBS]")

    def test_wilson(self):
        lo, hi = wilson_ci(111, 10000)
        print(f"  [T11] IC95 Wilson de 111/10000 = [{lo:.4%}, {hi:.4%}] "
              f"(littérature : [0.905 %, 1.315 %])")
        self.assertLess(lo, 0.01)
        self.assertGreater(hi, 0.01)
        self.assertLess(abs(lo - 0.0092), 0.002)
        self.assertLess(abs(hi - 0.0134), 0.002)


if __name__ == "__main__":
    print("=" * 78)
    print("TESTS D'ACCEPTATION — simulateur de forgemagie (ALGORITHME.md §12.5)")
    print("=" * 78)
    unittest.main(verbosity=2)
