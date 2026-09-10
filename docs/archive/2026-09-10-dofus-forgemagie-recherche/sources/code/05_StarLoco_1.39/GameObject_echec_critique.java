            try {
                jet = stats[4];
                value = Formulas.getRandomJet(null, null, jet);
            } catch (Exception e) {
                e.printStackTrace();
                return 0;
            }
        }
        return value;
    }

    /** FM TOUT POURRI **/
    public String parseStringStatsEC_FM(GameObject obj, double poid, int carac) {
        String stats = "";
        boolean first = false;
        double perte = 0.0;
        for (SpellEffect EH : obj.Effects) {
            if (first)
                stats += ",";
            String[] infos = EH.getArgs().split(";");
            try {
                stats += Integer.toHexString(EH.getEffectID()) + "#" + infos[0]
                        + "#" + infos[1] + "#0#" + infos[5];
            } catch (Exception e) {
                e.printStackTrace();
                continue;
            }
            first = true;
        }
        java.util.Map<Integer, Integer> statsObj = new java.util.HashMap<Integer, Integer>(obj.Stats.getEffects());
        java.util.ArrayList<Integer> keys = new ArrayList<Integer>(obj.Stats.getEffects().keySet());
        Collections.shuffle(keys);
        int p = 0;
        int key = 0;
        if (keys.size() > 1) {
            for (Integer i : keys) // On cherche un OverFM
            {
                int value = statsObj.get(i);
                if (this.isOverFm(i, value)) {
                    key = i;
                    break;
                }
                p++;
            }
            if (key > 0) // On place l'OverFm en t�te de liste pour �tre niqu�
            {
                keys.remove(p);
                keys.add(p, keys.get(0));
                keys.remove(0);
                keys.add(0, key);
            }
        }
        for (Integer i : keys) {
            int newstats = 0;
            int statID = i;
            int value = statsObj.get(i);
            if (perte > poid || statID == carac) {
                newstats = value;
            } else if ((statID == 152) || (statID == 154) || (statID == 155)
                    || (statID == 157) || (statID == 116) || (statID == 153)) {
                float a = (float) (value * poid / 100.0D);
                if (a < 1.0F)
                    a = 1.0F;
                float chute = value + a;
                newstats = (int) Math.floor(chute);
                if (newstats > JobAction.getBaseMaxJet(obj.getTemplate().getId(), Integer.toHexString(i)))
                    newstats = JobAction.getBaseMaxJet(obj.getTemplate().getId(), Integer.toHexString(i));

            } else {
                if ((statID == 127) || (statID == 101))
                    continue;

                float chute;
                if (this.isOverFm(statID, value)) // Gros kick dans la gueulle de l'over FM
                    chute = (float) (value - value
                            * (poid - (int) Math.floor(perte)) * 2 / 100.0D);
                else
                    chute = (float) (value - value
                            * (poid - (int) Math.floor(perte)) / 100.0D);
                if ((chute / (float) value) < 0.75)
                    chute = ((float) value) * 0.75F; // On ne peut pas perdre plus de 25% d'une stat d'un coup

                double chutePwr = (value - chute)
                        * JobAction.getPwrPerEffet(statID);
                //int chutePwrFixe = (int) Math.floor(chutePwr);

                perte += chutePwr;

				/*
				 * if (obj.getPuit() > 0 && chutePwrFixe <= obj.getPuit()) //
				 * S'il y a un puit positif, on annule la baisse { perte +=
				 * chutePwr; chute = value; // On r�initialise
				 * obj.setPuit(obj.getPuit() - chutePwrFixe); // On descend le
				 * puit } else if (obj.getPuit() > 0) // Si le puit est positif,
				 * mais pas suffisant pour annuler { double pwr =
				 * obj.getPuit()/World.getPwrPerEffet(statID); // On calcule
				 * l'annulation possible de la chute chute += (int)
				 * Math.floor(pwr); // On l'a r�ajoute perte +=
				 * (value-chute)*World.getPwrPerEffet(statID); obj.setPuit(0);
				 * // On fixe le puit � 0 } else { perte += chutePwr; }
				 */

                newstats = (int) Math.floor(chute);
            }
            if (newstats < 1)
                continue;
            String jet = "0d0+" + newstats;
            if (first)
                stats += ",";
            stats += Integer.toHexString(statID) + "#"
                    + Integer.toHexString(newstats) + "#0#0#" + jet;
            first = true;
        }
        for (Entry<Integer, String> entry : obj.txtStats.entrySet()) {
            if (first)
                stats += ",";
            stats += Integer.toHexString((entry.getKey())) + "#0#0#0#"
                    + entry.getValue();
            first = true;
        }
        return stats;
    }


    public String parseFMStatsString(String statsstr, GameObject obj, int add,
                                     boolean negatif) {
        String stats = "";
        boolean isFirst = true;
        for (SpellEffect SE : obj.Effects) {
            if (!isFirst)
                stats += ",";

            String[] infos = SE.getArgs().split(";");
            try {
                stats += Integer.toHexString(SE.getEffectID()) + "#" + infos[0]
                        + "#" + infos[1] + "#0#" + infos[5];
            } catch (Exception e) {
                e.printStackTrace();
                continue;
            }
            isFirst = false;
        }

        for (Entry<Integer, Integer> entry : obj.Stats.getEffects().entrySet()) {
            if (!isFirst)
                stats += ",";
            if (Integer.toHexString(entry.getKey()).compareTo(statsstr) == 0) {
                int newstats = 0;
                if (negatif) {
                    newstats = entry.getValue() - add;
                    if (newstats < 1)
                        continue;
                } else {
                    newstats = entry.getValue() + add;
                }
                String jet = "0d0+" + newstats;
                stats += Integer.toHexString(entry.getKey()) + "#"
                        + Integer.toHexString(entry.getValue() + add) + "#0#0#"
                        + jet;
            } else {
                String jet = "0d0+" + entry.getValue();
                stats += Integer.toHexString(entry.getKey()) + "#"
                        + Integer.toHexString(entry.getValue()) + "#0#0#" + jet;
            }
            isFirst = false;
        }

        for (Entry<Integer, String> entry : obj.txtStats.entrySet()) {
            if (!isFirst)
                stats += ",";
            stats += Integer.toHexString(entry.getKey()) + "#0#0#0#"
                    + entry.getValue();
            isFirst = false;
        }

        return stats;
    }

    public boolean isOverFm(int stat, int val) {
        boolean trouve = false;
        String statsTemplate = "";
        statsTemplate = this.template.getStrTemplate();
        if (statsTemplate == null || statsTemplate.isEmpty())
            return false;
        String[] split = statsTemplate.split(",");
        for (String s : split) {
            String[] stats = s.split("#");
            int statID = Integer.parseInt(stats[0], 16);
            if (statID != stat)
                continue;

            trouve = true;
            boolean sig = true;
            for (int a : Constant.ARMES_EFFECT_IDS)
                if (a == statID)
                    sig = false;
            if (!sig)
                continue;
            String jet = "";
            int value = 1;
            try {
                jet = stats[4];
                value = Formulas.getRandomJet(null, null, jet);
                try {
                    int min = Integer.parseInt(stats[1], 16);
                    int max = Integer.parseInt(stats[2], 16);
                    value = min;
                    if (max != 0)
                        value = max;
                } catch (Exception e) {
                    e.printStackTrace();
                    value = Formulas.getRandomJet(null, null, jet);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
            if (val > value)
                return true;
        }
        return !trouve;
    }
