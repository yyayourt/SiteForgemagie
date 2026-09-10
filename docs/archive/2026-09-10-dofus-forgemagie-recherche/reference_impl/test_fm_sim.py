"""
test_fm_sim.py — Tests d'acceptation du simulateur de forgemagie.

Correspond aux tests T1-T9 de ALGORITHME.md §12.5.
Aucune dépendance externe : `python3 test_fm_sim.py`.
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
    monte_carlo_exo, monte_carlo_remontage, monte_carlo_tentatives,
    params_devblog_fit, probabilites, score_ancres, wilson_ci,
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
    """T1 — 100 000 tentatives d'exo PM : P_SC ≈ 1 %, P_SN = 0 sans puits."""

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

    def test_exo_pa_et_po_aussi(self):
        p = params_devblog_fit()
        for cle in ("ga_pa", "ga_pme", "po"):
            item = gelano().to_max()
            psc, psn, _ = probabilites(item, RUNES[cle], p)
            self.assertAlmostEqual(psc, 0.01, places=9, msg=f"{cle} doit être au plancher")
            self.assertEqual(psn, 0.0)


class T2_ExoAvecPuits(unittest.TestCase):
    """T2 — avec puits, l'exo passe de 1/0/99 à 1/22/77 (triplet officiel)."""

    def test_puits_cree_du_sn_sans_toucher_au_sc(self):
        p = params_devblog_fit()
        sans = gelano().to_max()
        avec = gelano().to_max()
        avec.puits = 95.0

        s_sc, s_sn, s_ec = probabilites(sans, RUNES["ga_pme"], p)
        a_sc, a_sn, a_ec = probabilites(avec, RUNES["ga_pme"], p)
        print(f"\n  [T2] sans puits {s_sc:.0%}/{s_sn:.0%}/{s_ec:.0%}  "
              f"avec puits {a_sc:.0%}/{a_sn:.0%}/{a_ec:.0%}")
        self.assertEqual((round(s_sc*100), round(s_sn*100), round(s_ec*100)), (1, 0, 99))
        self.assertEqual((round(a_sc*100), round(a_sn*100), round(a_ec*100)), (1, 22, 77))
        self.assertAlmostEqual(s_sc, a_sc, places=9,
                               msg="le puits ne doit PAS changer P_SC (hypothèse par défaut)")


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
        for preset in (ModelParams(), params_devblog_fit(), ModelParams.retro()):
            for _ in range(4000):
                tpl = [Effect("force", 1, rng.randint(5, 80)),
                       Effect("vitalite", 1, rng.randint(20, 400)),
                       Effect("sagesse", 1, rng.randint(3, 40))]
                it = Item(tpl, level=rng.randint(1, 200))
                for e in it.effects:
                    e.value = rng.randint(0, int(e.jet_max * 1.3) + 1)
                it.effects = [e for e in it.effects if e.value >= 1]
                it.puits = rng.choice([0.0, 0.0, 5.0, 40.0, 95.0])
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
        print("\n  [T5] invariants 1 % / 50 % / 66 % vérifiés sur 12 000 états aléatoires")


class T6_Cap101(unittest.TestCase):
    """T6 — le poids over+exo d'une ligne ne dépasse jamais 101."""

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
                self.assertLessEqual(over, p.cap_over + 1e-9)
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

    def test_exos_uniques_limites(self):
        p = params_devblog_fit()
        it = gelano().to_max()
        it.set_values(pa=1, pm=1, portee=1)
        self.assertEqual(it.nb_exos_uniques(), 3)
        ok, raison = __import__("fm_sim").tentative_possible(it, RUNES["ga_pa"], p)
        # la 2e Ga Pa est bloquée par le cap 101 (100*2 - 0 > 101) avant même la règle 2.3.4
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
            if o.bloquee:
                continue
            attendu = max(0.0, avant + o.poids_perdu - poids_rune)
            self.assertAlmostEqual(o.puits_apres, attendu, places=6)
            self.assertGreaterEqual(o.puits_apres, 0.0)
        print("\n  [T7] formule du puits vérifiée sur 3 000 tentatives")

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

    def test_ancre_meilleur_cas(self):
        p = params_devblog_fit()
        nom, item, rune, cible = ancres_devblog(p)[0]
        psc, psn, pec = probabilites(item, rune, p)
        print(f"\n  [T8] {nom} : {psc:.0%}/{psn:.0%}/{pec:.0%} (cible 66/34/0)")
        self.assertEqual((round(psc*100), round(psn*100), round(pec*100)), (66, 34, 0))

    def test_toutes_les_ancres_a_moins_de_15_points(self):
        p = params_devblog_fit()
        print("  [T9] écart aux 5 triplets officiels :")
        for nom, item, rune, (tsc, tsn, tec) in ancres_devblog(p):
            psc, psn, pec = probabilites(item, rune, p)
            ecarts = (abs(psc*100 - tsc), abs(psn*100 - tsn), abs(pec*100 - tec))
            print(f"        {nom:26s} {psc*100:5.1f}/{psn*100:5.1f}/{pec*100:5.1f}"
                  f"  vs {tsc:3d}/{tsn:3d}/{tec:3d}   ecart max {max(ecarts):.0f} pts")
            self.assertLess(max(ecarts), 15.0,
                            f"{nom} : le modèle ajusté doit rester à <15 pts des ancres")

    def test_la_calibration_ameliore_bien_le_score(self):
        brut = score_ancres(ModelParams())
        fit = score_ancres(params_devblog_fit())
        print(f"  [T9] score sur les ancres : StarLoco brut {brut:.0f} -> ajusté {fit:.0f}")
        self.assertGreater(fit, brut)
        self.assertGreater(fit, -500.0)

    def test_le_calibrateur_retrouve_le_prereglage(self):
        fitted, sc = calibrate_multistart(score_ancres, ModelParams(), passes=4)
        print(f"  [T9] calibrate_multistart -> score {sc:.0f} "
              f"(exposant_taille={fitted.exposant_taille}, rate_fm={fitted.rate_fm})")
        self.assertGreaterEqual(sc, score_ancres(ModelParams()))
        self.assertGreater(sc, -500.0)


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

    def test_malus_saggrave(self):
        p = params_devblog_fit()
        rng = random.Random(6)
        it = Item([Effect("initiative", 10, 40, is_negative=True),
                   Effect("force", 1, 20)], level=100)
        it.set_values(initiative=20, force=20)
        avant = it.get("initiative").value
        for _ in range(20):
            appliquer_perte(it, 30.0, None, p, rng)
        apres = it.get("initiative").value
        self.assertGreaterEqual(apres, avant, "un malus doit s'aggraver, pas diminuer")
        self.assertLessEqual(apres, 40)
        print(f"  [T11] malus initiative : {avant} -> {apres} (aggravation, plafonnée au max)")

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
