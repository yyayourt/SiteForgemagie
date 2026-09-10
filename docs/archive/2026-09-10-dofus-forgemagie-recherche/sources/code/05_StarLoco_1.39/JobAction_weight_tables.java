                statX = 15;
            } else if (statID == 178 ) {
                statX = 20;
            } else if (statID == 115 || statID == 182) {
                statX = 30;
            } else if (statID == 117) {
                statX = 50;
            } else if (statID == 128) {
                statX = 90;
            } else if (statID == 111) {
                statX = 100;
            }
            weight = value * statX;
            alt += weight;
        }
        return alt;
    }

    public static int currentWeithStats(GameObject obj, String statsModif) {
        for (Entry<Integer, Integer> entry : obj.getStats().getEffects().entrySet()) {
            int statID = entry.getKey();
            if (Integer.toHexString(statID).toLowerCase().compareTo(statsModif.toLowerCase()) > 0) {
            } else if (Integer.toHexString(statID).toLowerCase().compareTo(statsModif.toLowerCase()) == 0) {
                int statX = 1;
                int coef = 1;
                int BaseStats = viewBaseStatsItem(obj, Integer.toHexString(statID));
                if (BaseStats == 2) {
                    coef = 3;
                } else if (BaseStats == 0) {
                    coef = 8;
                }
                if (statID == 125 || statID == 158 || statID == 174) {
                    statX = 1;
                } else if (statID == 118 || statID == 126 || statID == 119
                        || statID == 123)

                {
                    statX = 2;
                } else if (statID == 138 || statID == 666 || statID == 226
                        || statID == 220) // da�os,Trampas
                // %
                {
                    statX = 3;
                } else if (statID == 124 || statID == 176) {
                    statX = 5;
                } else if (statID == 240 || statID == 241 || statID == 242
                        || statID == 243 || statID == 244)

                {
                    statX = 7;
                } else if (statID == 210 || statID == 211 || statID == 212
                        || statID == 213 || statID == 214) {
                    statX = 8;
                } else if (statID == 225 || statID == 121) {
                    statX = 15;
                } else if (statID == 178 ) {
                    statX = 20;
                } else if (statID == 115 || statID == 182) {
                    statX = 30;
                } else if (statID == 117) {
                    statX = 50;
                } else if (statID == 128) {
                    statX = 90;
                } else if (statID == 111) {
                    statX = 100;
                }
                int Weight = entry.getValue() * statX * coef;
                return Weight;
            }
        }
        return 0;
    }

    public static int currentStats(GameObject obj, String statsModif) {
        for (Entry<Integer, Integer> entry : obj.getStats().getEffects().entrySet()) {
            int statID = entry.getKey();
            if (Integer.toHexString(statID).toLowerCase().compareTo(statsModif.toLowerCase()) > 0) {
            } else if (Integer.toHexString(statID).toLowerCase().compareTo(statsModif.toLowerCase()) == 0) {
                return entry.getValue();
            }
        }
        return 0;
    }

    public static int currentTotalWeigthBase(String statsModelo, GameObject obj) {
        if (statsModelo.equalsIgnoreCase(""))
            return 0;
        int Weigth = 0;
        int Alto = 0;
        String[] split = statsModelo.split(",");
        for (String s : split) {
            String[] stats = s.split("#");
            int statID = Integer.parseInt(stats[0], 16);
            if (statID == 985 || statID == 988)
                continue;
            boolean xy = false;
            for (int a : Constant.ARMES_EFFECT_IDS)
                if (a == statID)
                    xy = true;
            if (xy)
                continue;
            String jet;
            int qua;
            try {
                jet = stats[4];
                qua = Formulas.getRandomJet(null, null, jet);
                try {
                    int min = Integer.parseInt(stats[1], 16);
                    int max = Integer.parseInt(stats[2], 16);
                    qua = min;
                    if (max != 0)
                        qua = max;
                } catch (Exception e) {
                    e.printStackTrace();
                    qua = Formulas.getRandomJet(null, null, jet);
                }
            } catch (Exception e) {
                continue;
                // Ok :/
            }
            int statX = 1;
            int coef = 1;
            int statsBase = viewBaseStatsItem(obj, stats[0]);
            if (statsBase == 2) {
                coef = 3;
            } else if (statsBase == 0) {
                coef = 2;
            }
            if (statID == 125 || statID == 158 || statID == 174) {
                statX = 1;
            } else if (statID == 118 || statID == 126 || statID == 119
                    || statID == 123) {
                statX = 2;
            } else if (statID == 138 || statID == 666 || statID == 226
                    || statID == 220) // de
            // da�os,Trampas %
            {
                statX = 3;
            } else if (statID == 124 || statID == 176) {
                statX = 5;
            } else if (statID == 240 || statID == 241 || statID == 242
                    || statID == 243 || statID == 244) {
                statX = 7;
            } else if (statID == 210 || statID == 211 || statID == 212
                    || statID == 213 || statID == 214)

            {
                statX = 8;
            } else if (statID == 225|| statID == 121) {
                statX = 15;
            } else if (statID == 178 ) {
                statX = 20;
            } else if (statID == 115 || statID == 182) {
                statX = 30;
            } else if (statID == 117) {
                statX = 50;
            } else if (statID == 128) {
                statX = 90;
            } else if (statID == 111) {
                statX = 100;
            }
            Weigth = qua * statX * coef;
            Alto += Weigth;
        }
        return Alto;
    }

    public static int getBaseMaxJet(int templateID, String statsModif) {
        ObjectTemplate t = World.world.getObjTemplate(templateID);
        String[] splitted = t.getStrTemplate().split(",");
        for (String s : splitted) {
            String[] stats = s.split("#");
            if (stats[0].compareTo(statsModif) > 0)//Effets n'existe pas de base
            {
            } else if (stats[0].compareTo(statsModif) == 0)//L'effet existe bien !
            {
                int max = Integer.parseInt(stats[2], 16);
                if (max == 0)
                    max = Integer.parseInt(stats[1], 16);//Pas de jet maximum on prend le minimum
                return max;
            }
        }
        return 0;
    }

    public static int getActualJet(GameObject obj, String statsModif) {
        for (Entry<Integer, Integer> entry : obj.getStats().getEffects().entrySet()) {
            if (Integer.toHexString(entry.getKey()).compareTo(statsModif) > 0)//Effets inutiles
            {
            } else if (Integer.toHexString(entry.getKey()).compareTo(statsModif) == 0)//L'effet existe bien !
            {
                int JetActual = entry.getValue();
                return JetActual;
            }
        }
        return 0;
    }

    public static byte viewActualStatsItem(GameObject obj, String stats)//retourne vrai si le stats est actuellement sur l'item
    {
        if (!obj.encodeStats().isEmpty()) {
            for (Entry<Integer, Integer> entry : obj.getStats().getEffects().entrySet()) {
                if (Integer.toHexString(entry.getKey()).compareTo(stats) > 0)//Effets inutiles
                {
                    if (Integer.toHexString(entry.getKey()).compareTo("98") == 0
                            && stats.compareTo("7b") == 0) {
                        return 2;
                    } else if (Integer.toHexString(entry.getKey()).compareTo("9a") == 0
                            && stats.compareTo("77") == 0) {
                        return 2;
                    } else if (Integer.toHexString(entry.getKey()).compareTo("9b") == 0
                            && stats.compareTo("7e") == 0) {
                        return 2;
                    } else if (Integer.toHexString(entry.getKey()).compareTo("9d") == 0
                            && stats.compareTo("76") == 0) {
                        return 2;
                    } else if (Integer.toHexString(entry.getKey()).compareTo("74") == 0
                            && stats.compareTo("75") == 0) {
                        return 2;
                    } else if (Integer.toHexString(entry.getKey()).compareTo("99") == 0
                            && stats.compareTo("7d") == 0) {
                        return 2;
                    } else {
                    }
                } else if (Integer.toHexString(entry.getKey()).compareTo(stats) == 0)//L'effet existe bien !
                {
                    return 1;
                }
            }
            return 0;
        } else {
            return 0;
        }
    }

    public static byte viewBaseStatsItem(GameObject obj, String ItemStats)//retourne vrai si le stats existe de base sur l'item
    {

        String[] splitted = obj.getTemplate().getStrTemplate().split(",");
        for (String s : splitted) {
            String[] stats = s.split("#");
            if (stats[0].compareTo(ItemStats) > 0)//Effets n'existe pas de base
            {
                if (stats[0].compareTo("98") == 0
                        && ItemStats.compareTo("7b") == 0) {
                    return 2;
                } else if (stats[0].compareTo("9a") == 0
                        && ItemStats.compareTo("77") == 0) {
                    return 2;
                } else if (stats[0].compareTo("9b") == 0
                        && ItemStats.compareTo("7e") == 0) {
                    return 2;
                } else if (stats[0].compareTo("9d") == 0
                        && ItemStats.compareTo("76") == 0) {
                    return 2;
                } else if (stats[0].compareTo("74") == 0
                        && ItemStats.compareTo("75") == 0) {
                    return 2;
                } else if (stats[0].compareTo("99") == 0
                        && ItemStats.compareTo("7d") == 0) {
                    return 2;
                } else {
                }
            } else if (stats[0].compareTo(ItemStats) == 0)//L'effet existe bien !
            {
                return 1;
            }
        }
        return 0;
    }

    public static double getPwrPerEffet(int effect) {
        double r = 0.0;
        switch (effect) {
            case Constant.STATS_ADD_PA:
                r = 100.0;
                break;
            case Constant.STATS_ADD_PM2:
                r = 90.0;
                break;
            case Constant.STATS_ADD_VIE:
                r = 0.25;
                break;
            case Constant.STATS_MULTIPLY_DOMMAGE:
                r = 100.0;
                break;
            case Constant.STATS_ADD_CC:
                r = 30.0;
                break;
            case Constant.STATS_ADD_PO:
                r = 51.0;
                break;
            case Constant.STATS_ADD_FORC:
                r = 1.0;
                break;
            case Constant.STATS_ADD_AGIL:
                r = 1.0;
                break;
            case Constant.STATS_ADD_PA2:
                r = 100.0;
                break;
            case Constant.STATS_ADD_DOMA:
                r = 20.0;
                break;
            case Constant.STATS_ADD_EC:
                r = 1.0;
                break;
            case Constant.STATS_ADD_CHAN:
                r = 1.0;
                break;
            case Constant.STATS_ADD_SAGE:
                r = 3.0;
                break;
            case Constant.STATS_ADD_VITA:
                r = 0.25;
                break;
            case Constant.STATS_ADD_INTE:
                r = 1.0;
                break;
            case Constant.STATS_ADD_PM:
                r = 90.0;
                break;
            case Constant.STATS_ADD_PERDOM:
                r = 2.0;
                break;
            case Constant.STATS_ADD_PDOM:
                r = 2.0;
                break;
            case Constant.STATS_ADD_PODS:
                r = 0.25;
                break;
            case Constant.STATS_ADD_ADODGE:
                r = 1.0;
                break;
            case Constant.STATS_ADD_MDODGE:
                r = 1.0;
                break;
            case Constant.STATS_ADD_INIT:
                r = 0.1;
                break;
            case Constant.STATS_ADD_PROS:
                r = 3.0;
                break;
            case Constant.STATS_ADD_SOIN:
                r = 20.0;
                break;
            case Constant.STATS_SUMMON_COUNT:
                r = 30.0;
                break;
            case Constant.STATS_ADD_RP_TER:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_EAU:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_AIR:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_FEU:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_NEU:
                r = 6.0;
                break;
            case Constant.STATS_ADD_TRAP_DOM:
                r = 15.0;
                break;
            case Constant.STATS_ADD_TRAP_PERDOM:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_FEU:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_NEU:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_TER:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_EAU:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_AIR:
                r = 2.0;
                break;
            case Constant.STATS_ADD_RP_PVP_TER:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_PVP_EAU:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_PVP_AIR:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_PVP_FEU:
                r = 6.0;
                break;
            case Constant.STATS_ADD_RP_PVP_NEU:
                r = 6.0;
                break;
            case Constant.STATS_ADD_R_PVP_TER:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_PVP_EAU:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_PVP_AIR:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_PVP_FEU:
                r = 2.0;
                break;
            case Constant.STATS_ADD_R_PVP_NEU:
                r = 2.0;
                break;
        }
        return r;
    }

    public static double getOverPerEffet(int effect) {
        double r = 0.0;
        switch (effect) {
            case Constant.STATS_ADD_PA:
                r = 1.0;
                break;
            case Constant.STATS_ADD_PM2:
                r = 0.0;
                break;
            case Constant.STATS_ADD_VIE:
                r = 404.0;
                break;
            case Constant.STATS_MULTIPLY_DOMMAGE:
                r = 0.0;
                break;
            case Constant.STATS_ADD_CC:
                r = 3.0;
                break;
            case Constant.STATS_ADD_PO:
                r = 0.0;
                break;
            case Constant.STATS_ADD_FORC:
                r = 101.0;
                break;
            case Constant.STATS_ADD_AGIL:
                r = 101.0;
                break;
            case Constant.STATS_ADD_PA2:
                r = 0.0;
                break;
            case Constant.STATS_ADD_DOMA:
                r = 5.0;
                break;
            case Constant.STATS_ADD_EC:
                r = 0.0;
                break;
            case Constant.STATS_ADD_CHAN:
                r = 101.0;
                break;
            case Constant.STATS_ADD_SAGE:
                r = 33.0;
                break;
            case Constant.STATS_ADD_VITA:
                r = 404.0;
                break;
            case Constant.STATS_ADD_INTE:
                r = 101.0;
                break;
            case Constant.STATS_ADD_PM:
                r = 0.0;
                break;
            case Constant.STATS_ADD_PERDOM:
                r = 50.0;
                break;
            case Constant.STATS_ADD_PDOM:
                r = 50.0;
                break;
            case Constant.STATS_ADD_PODS:
                r = 404.0;
                break;
            case Constant.STATS_ADD_ADODGE:
                r = 0.0;
                break;
            case Constant.STATS_ADD_MDODGE:
                r = 0.0;
                break;
            case Constant.STATS_ADD_INIT:
                r = 1010.0;
                break;
            case Constant.STATS_ADD_PROS:
                r = 33.0;
                break;
            case Constant.STATS_ADD_SOIN:
                r = 5.0;
                break;
            case Constant.STATS_SUMMON_COUNT:
                r = 3.0;
                break;
            case Constant.STATS_ADD_RP_TER:
                r = 16.0;
                break;
            case Constant.STATS_ADD_RP_EAU:
                r = 16.0;
                break;
            case Constant.STATS_ADD_RP_AIR:
                r = 16.0;
                break;
            case Constant.STATS_ADD_RP_FEU:
                r = 16.0;
                break;
            case Constant.STATS_ADD_RP_NEU:
                r = 16.0;
                break;
            case Constant.STATS_ADD_TRAP_DOM:
                r = 6.0;
                break;
            case Constant.STATS_ADD_TRAP_PERDOM:
                r = 50.0;
                break;
            case Constant.STATS_ADD_R_FEU:
                r = 50.0;
                break;
