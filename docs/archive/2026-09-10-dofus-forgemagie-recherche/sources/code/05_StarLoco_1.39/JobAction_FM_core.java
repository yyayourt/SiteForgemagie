                case 11129:
                    bonusRune = true;
                    runeOrPotion = object;
                    statsObjectFm = "dc";
                    statsAdd = 5;
                    poid = 1;
                    lvlQuaStatsRune = object.getTemplate().getLevel();
                    break;
                case 10057:
                    bonusRune = true;
                    runeOrPotion = object;
                    statsObjectFm = "31b";
                    statsAdd = 1;
                    poid = 0;
                    lvlQuaStatsRune = object.getTemplate().getLevel();
                    break;
                //endregion
                default:
                    int type = object.getTemplate().getType();
                    if ((type >= 1 && type <= 11) || (type >= 16 && type <= 22) || type == 81 || type == 102 || type == 114 || object.getTemplate().getPACost() > 0) {
                        final Player player = this.player.hasItemGuid(object.getGuid()) ? this.player : receiver;
                        objectFm = object;
                        SocketManager.GAME_SEND_EXCHANGE_OTHER_MOVE_OK_FM(player.getGameClient(), 'O', "+", objectFm.getGuid() + "|" + 1);
                        deleteID = id;
                        GameObject newObj = objectFm.getClone(1, true); // Cr�ation d'un clone avec un nouveau identifiant

                        if (objectFm.getQuantity() > 1) { // S'il y avait plus d'un objet
                            int newQuant = objectFm.getQuantity() - 1; // On supprime celui que l'on a ajout�
                            objectFm.setQuantity(newQuant);
                            SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(player, objectFm);
                        } else {
                            World.world.removeGameObject(id);

                            player.removeItem(id);
                            SocketManager.GAME_SEND_DELETE_STATS_ITEM_FM(player, id);
                        }
                        objectFm = newObj; // Tout neuf avec un nouveau identifiant
                        break;
                    }
            }
            //endregion
        }

        //region Calcul formule
        double poid2 = getPwrPerEffet(Integer.parseInt(statsObjectFm, 16));
        if (poid2 > 0.0)
            poid = statsAdd * ((int) poid2);

        if (SM == null || objectFm == null || runeOrPotion == null) {
            if (objectFm != null) {
                World.world.addGameObject(objectFm);
                this.player.addItem(objectFm, true);
            }

            if(receiver != null)
                SocketManager.GAME_SEND_Ec_PACKET(receiver, "EI");
            SocketManager.GAME_SEND_Ec_PACKET(this.player, "EI");
            SocketManager.GAME_SEND_IO_PACKET_TO_MAP(this.player.getCurMap(), this.player.getId(), "-");

            ingredients.clear();
            return false;
        }
        if (deleteID != -1) {
            this.ingredients.remove(deleteID);
        }

        final ObjectTemplate template = objectFm.getTemplate();
        ArrayList<Integer> chances = new ArrayList<>();

        int chance, lvlJob = SM.get_lvl(), currentWeightTotal = 1, pwrPerte;
        int objTemplateID = template.getId();
        String statStringObj = objectFm.encodeStats();

        if (lvlElementRune > 0 && lvlQuaStatsRune == 0) {
            chance = Formulas.calculChanceByElement(lvlJob, template.getLevel(), lvlElementRune);
            if (chance > 100 - (lvlJob / 20))
                chance = 100 - (lvlJob / 20);
            if (chance < (lvlJob / 20))
                chance = (lvlJob / 20);
            chances.add(0, chance);
            chances.add(1, 0);
            chances.add(2, 100 - chance);
        } else if (lvlQuaStatsRune > 0 && lvlElementRune == 0) {
            int currentWeightStats = 1;
            if (!statStringObj.isEmpty()) {
                currentWeightTotal = currentTotalWeigthBase(statStringObj, objectFm); // Poids total de l'objet : PWRg
                currentWeightStats = currentWeithStats(objectFm, statsObjectFm); // Poids � ajouter : PWRcarac
            }

            int currentTotalBase = WeithTotalBase(objTemplateID); // Poids maximum de l'objet : PWRmax
            int currentMinBase = WeithTotalBaseMin(objTemplateID);

            if (currentTotalBase < 0)
                currentTotalBase = 0;
            if (currentWeightStats < 0)
                currentWeightStats = 0;
            if (currentWeightTotal < 0)
                currentWeightTotal = 0;

            float coef = 1;
            int baseStats = viewBaseStatsItem(objectFm, statsObjectFm), currentStats = viewActualStatsItem(objectFm, statsObjectFm);

            if (baseStats == 1 && currentStats == 1 || baseStats == 1 && currentStats == 0) {
                coef = 1.0f;
            } else if (baseStats == 2 && currentStats == 2) {
                coef = 0.50f;
            } else if (baseStats == 0 && currentStats == 0 || baseStats == 0 && currentStats == 1) {
                coef = coefExo;
            }

            float x = 1;
            boolean canFM = true;
            int statMax = getStatBaseMaxs(objectFm.getTemplate(), statsObjectFm), actualJet = getActualJet(objectFm, statsObjectFm);

            if (actualJet > statMax) {
                x = 0.8F;
                int overPerEffect = (int) getOverPerEffet(Integer.parseInt(statsObjectFm, 16));
                //if (statMax == 0)
                if (actualJet >= (statMax + overPerEffect))
                    canFM = false;
                if(Integer.parseInt(statsObjectFm, 16) == 111) {
                    if(objectFm.isOverFm2(111, 1))
                        if(!canFM)
                            canFM = true;
                } else if(Integer.parseInt(statsObjectFm, 16) == 128) {
                    if(objectFm.isOverFm2(128, 1))
                        if(!canFM)
                            canFM = true;
                }
            }
            if (lvlJob < (int) Math.floor(template.getLevel() / 2))
                canFM = false; // On rate le FM si le m�tier n'est pas suffidant

            int diff = (int) Math.abs((currentTotalBase * 1.3f) - currentWeightTotal);

            if (canFM) {
                chances = Formulas.chanceFM(currentTotalBase, currentMinBase, currentWeightTotal, currentWeightStats, poid, diff, coef, statMax, getStatBaseMins(objectFm.getTemplate(), statsObjectFm), currentStats(objectFm, statsObjectFm), x, bonusRune, statsAdd);
            } else {// Si l'objet est au dessus de l'over (impossible statistiquement ... mais evite un gelano 2 PA :p)
                chances.add(0, 0);
                chances.add(1, 0);
            }
        }

        int aleatoryChance = Formulas.getRandomValue(1, 100), SC = chances.get(0), SN = chances.get(1);
        boolean successC = (aleatoryChance <= SC), successN = (aleatoryChance <= (SC + SN));

        if(objectFm.getPuit() >= statsAdd) {
            if(runeOrPotion.getTemplate().getId() != 1558 && runeOrPotion.getTemplate().getId() != 1557 && runeOrPotion.getTemplate().getId() != 7438) {
                if(Formulas.getRandomValue(1, 2) == 1)
                    successC = true;
            }
        }

        if(runeOrPotion.getTemplate().getId() == 1558 || runeOrPotion.getTemplate().getId() == 1557)
            if(Formulas.getRandomValue(0, 100) == 1)
                successC = true;

        if (successC || successN) {
            int winXP = Formulas.calculXpWinFm(objectFm.getTemplate().getLevel(), poid) * Config.rateJob;
            if (winXP > 0) {
                SM.addXp(this.player, winXP);
                ArrayList<JobStat> SMs = new ArrayList<>();
                SMs.add(SM);
                SocketManager.GAME_SEND_JX_PACKET(this.player, SMs);
            }
        }
        //endregion

        //region succès critique
        if (successC) {
            int coef = 0;
            pwrPerte = 0;

            if (lvlElementRune == 1) coef = 50;
            else if (lvlElementRune == 25) coef = 65;
            else if (lvlElementRune == 50) coef = 85;
            if (isSigningRune)
                objectFm.addTxtStat(985, this.player.getName());

            if (lvlElementRune > 0 && lvlQuaStatsRune == 0) {
                for (SpellEffect effect : objectFm.getEffects()) {
                    if (effect.getEffectID() != 100)
                        continue;
                    String[] infos = effect.getArgs().split(";");
                    try {
                        int min = Integer.parseInt(infos[0], 16);
                        int max = Integer.parseInt(infos[1], 16);
                        int newMin = (min * coef) / 100;
                        int newMax = (max * coef) / 100;
                        if (newMin == 0)
                            newMin = 1;
                        String newRange = "1d" + (newMax - newMin + 1) + "+" + (newMin - 1);
                        String newArgs = Integer.toHexString(newMin) + ";" + Integer.toHexString(newMax) + ";-1;-1;0;" + newRange;
                        effect.setArgs(newArgs);
                        effect.setEffectID(statId);
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
            } else if (lvlQuaStatsRune > 0 && lvlElementRune == 0) {
                boolean negative = false;
                int currentStats = viewActualStatsItem(objectFm, statsObjectFm);

                if (currentStats == 2) {
                    if (statsObjectFm.compareTo("7b") == 0) {
                        statsObjectFm = "98";
                        negative = true;
                    }
                    if (statsObjectFm.compareTo("77") == 0) {
                        statsObjectFm = "9a";
                        negative = true;
                    }
                    if (statsObjectFm.compareTo("7e") == 0) {
                        statsObjectFm = "9b";
                        negative = true;
                    }
                    if (statsObjectFm.compareTo("76") == 0) {
                        statsObjectFm = "9d";
                        negative = true;
                    }
                    if (statsObjectFm.compareTo("7c") == 0) {
                        statsObjectFm = "9c";
                        negative = true;
                    }
                    if (statsObjectFm.compareTo("7d") == 0) {
                        statsObjectFm = "99";
                        negative = true;
                    }
                }

                if (statStringObj.isEmpty()) {
                    String statsStr = statsObjectFm + "#" + Integer.toHexString(statsAdd) + "#0#0#0d0+" + statsAdd;
                    objectFm.clearStats();
                    objectFm.parseStringToStats(statsStr);
                } else {
                    String statsStr;
                    if (currentStats == 1 || currentStats == 2)
                        statsStr = objectFm.parseFMStatsString(statsObjectFm, objectFm, statsAdd, negative);
                    else
                        statsStr = objectFm.parseFMStatsString(statsObjectFm, objectFm, statsAdd, negative) + "," + statsObjectFm + "#" + Integer.toHexString(statsAdd) + "#0#0#0d0+" + statsAdd;

                    objectFm.clearStats();
                    objectFm.parseStringToStats(statsStr);
                }
            }

            String data = objectFm.getGuid() + "|1|" + objectFm.getTemplate().getId() + "|" + objectFm.encodeStats();

            if (!this.isRepeat)
                this.reConfigingRunes = -1;
            if (this.reConfigingRunes != 0 || this.broken)
                if(receiver == null)
                    SocketManager.GAME_SEND_EXCHANGE_MOVE_OK_FM(this.player, 'O', "+", data);

            this.data = data;
            SocketManager.GAME_SEND_IO_PACKET_TO_MAP(this.player.getCurMap(), this.player.getId(), "+" + objTemplateID);
            if(!secure) {
                SocketManager.GAME_SEND_Ec_PACKET(this.player, "K;" + objTemplateID);
            }
        }
        //endregion
        //region Succès neutre
        else if (successN) {
            pwrPerte = 0;
            if (isSigningRune) {
                objectFm.addTxtStat(985, this.player.getName());
            }

            boolean negative = false;
            int currentStats = viewActualStatsItem(objectFm, statsObjectFm);

            if (currentStats == 2) {
                if (statsObjectFm.compareTo("7b") == 0) {
                    statsObjectFm = "98";
                    negative = true;
                }
                if (statsObjectFm.compareTo("77") == 0) {
                    statsObjectFm = "9a";
                    negative = true;
                }
                if (statsObjectFm.compareTo("7e") == 0) {
                    statsObjectFm = "9b";
                    negative = true;
                }
                if (statsObjectFm.compareTo("76") == 0) {
                    statsObjectFm = "9d";
                    negative = true;
                }
                if (statsObjectFm.compareTo("7c") == 0) {
                    statsObjectFm = "9c";
                    negative = true;
                }
                if (statsObjectFm.compareTo("7d") == 0) {
                    statsObjectFm = "99";
                    negative = true;
                }
            }
            if (statStringObj.isEmpty()) {
                String statsStr = statsObjectFm + "#" + Integer.toHexString(statsAdd) + "#0#0#0d0+" + statsAdd;
                objectFm.clearStats();
                objectFm.parseStringToStats(statsStr);
            } else {
                String statsStr;

                if (objectFm.getPuit() <= 0) {// EC en premier s'il n'y a pas de puits
                    statsStr = objectFm.parseStringStatsEC_FM(objectFm, statsAdd, runeOrPotion.getTemplate().getId());
                    objectFm.clearStats();
                    objectFm.parseStringToStats(statsStr);
                    pwrPerte = currentWeightTotal - currentTotalWeigthBase(statsStr, objectFm);
                }
                if (currentStats == 1 || currentStats == 2)
                    statsStr = objectFm.parseFMStatsString(statsObjectFm, objectFm, statsAdd, negative);
                else
                    statsStr = objectFm.parseFMStatsString(statsObjectFm, objectFm, statsAdd, negative) + "," + statsObjectFm + "#" + Integer.toHexString(statsAdd) + "#0#0#0d0+" + statsAdd;
                objectFm.clearStats();
                objectFm.parseStringToStats(statsStr);
            }

            String data = objectFm.getGuid() + "|1|" + objectFm.getTemplate().getId() + "|" + objectFm.encodeStats();
            if (!this.isRepeat)
                this.reConfigingRunes = -1;
            if (this.reConfigingRunes != 0 || this.broken)
                if(receiver == null)
                    SocketManager.GAME_SEND_EXCHANGE_MOVE_OK_FM(this.player, 'O', "+", data);

            this.data = data;
            SocketManager.GAME_SEND_IO_PACKET_TO_MAP(this.player.getCurMap(), this.player.getId(), "+" + objTemplateID);

            if (pwrPerte > 0) {
                SocketManager.GAME_SEND_Ec_PACKET(this.player, "EF");
                SocketManager.GAME_SEND_Im_PACKET(this.player, "0194");
            } else {
                SocketManager.GAME_SEND_Ec_PACKET(this.player, "K;" + objTemplateID);
            }
        }
        //endregion
        //region Echec critique
        else {// EC
            pwrPerte = 0;

            if (!statStringObj.isEmpty()) {
                String statsStr = objectFm.parseStringStatsEC_FM(objectFm, statsAdd, -1);
                objectFm.clearStats();
                objectFm.parseStringToStats(statsStr);
                pwrPerte = currentWeightTotal - currentTotalWeigthBase(statsStr, objectFm);
            }

            String data = objectFm.getGuid() + "|1|" + objectFm.getTemplate().getId() + "|" + objectFm.encodeStats();
            if (!this.isRepeat)
                this.reConfigingRunes = -1;
            if (this.reConfigingRunes != 0 || this.broken)
                if(receiver == null)
                    SocketManager.GAME_SEND_EXCHANGE_MOVE_OK_FM(this.player, 'O', "+", data);

            this.data = data;
            SocketManager.GAME_SEND_IO_PACKET_TO_MAP(this.player.getCurMap(), this.player.getId(), "-" + objTemplateID);
            SocketManager.GAME_SEND_Ec_PACKET(this.player, "EF");

            if (pwrPerte > 0)
                SocketManager.GAME_SEND_Im_PACKET(this.player, "0117");
            else
                SocketManager.GAME_SEND_Im_PACKET(this.player, "0183");
        }
        //endregion

        objectFm.setPuit((objectFm.getPuit() + pwrPerte) - poid);
        int newQuantity = ingredients.get(idRune) == null ? 0 : ingredients.get(idRune) - 1;

        if (objectFm != null) {
            World.world.addGameObject(objectFm);
            if(receiver == null) {
                this.player.addItem(objectFm, true);
            } else {
                receiver.addItem(objectFm, true);
            }
        }

        if(receiver == null) {
            this.decrementObjectQuantity(this.player, signingRune);
            this.decrementObjectQuantity(this.player, runeOrPotion);
            this.player.send("EmKO-" + objectFm.getGuid() + "|1|");
            this.ingredients.clear();
            this.player.send("EMKO+" + objectFm.getGuid() + "|1");
            this.ingredients.put(objectFm.getGuid(), 1);

            if (newQuantity >= 1) {
                this.player.send("EMKO+" + idRune + "|" + newQuantity);
                this.ingredients.put(idRune, newQuantity);
            } else {
                this.player.send("EMKO-" + idRune);
            }
        } else {
            if(items != null) {
                for(Entry<Player, ArrayList<Couple<Integer, Integer>>> entry : items.entrySet()) {
                    final Player player = entry.getKey();
                    for(Couple<Integer, Integer> couple : entry.getValue()) {
                        if(signingRune != null && signingRune.getGuid() == couple.first)
                            this.decrementObjectQuantity(player, signingRune);
                        if(runeOrPotion.getGuid() == couple.first)
                            this.decrementObjectQuantity(player, runeOrPotion);
                        //player.send("EMKO-" + couple.first);

                    }
                }
            }

            String stats = objectFm.encodeStats();
            this.player.send("ErKO+" + objectFm.getGuid() + "|1|" + template + "|" + stats);
            receiver.send("ErKO+" + objectFm.getGuid() + "|1|" + template + "|" + stats);
            this.player.send("EcK;" + template + ";T" + receiver.getName() + ";" + stats);
            receiver.send("EcK;" + template + ";B" + this.player.getName() + ";" + stats);

            if(!successC) {
                receiver.send("EcEF");
            }
        }

        this.lastCraft.clear();
        this.lastCraft.putAll(this.ingredients);

        SocketManager.GAME_SEND_Ow_PACKET(this.player);
