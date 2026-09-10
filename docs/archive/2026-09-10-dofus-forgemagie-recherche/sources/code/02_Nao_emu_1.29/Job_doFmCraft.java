		private void doFmCraft() {
			boolean isSigningRune = false;
			Objects objectFm = null, signingRune = null, runeOrPotion = null;
			int lvlElementRune = 0, statsID = -1, lvlQuaStatsRune = 0, statsAdd = 0, deleteID = -1, poid = 0;
			boolean bonusRune = false;
			String statsObjectFm = "-1";
			for (int idIngredient : _ingredients.keySet()) {
				Objects ing = World.getObjet(idIngredient);
				if (ing == null || !_P.hasItemGuid(idIngredient)) {
					SocketManager.GAME_SEND_Ec_PACKET(_P, "EI");
					SocketManager.GAME_SEND_IO_PACKET_TO_MAP(_P.get_curCarte(), _P.get_GUID(), "-");
					_ingredients.clear();
					return;
				}
				int templateID = ing.getTemplate().getID();
				switch (templateID) {
					case 1333 :
						statsID = 99;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1335 :
						statsID = 96;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1337 :
						statsID = 98;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1338 :
						statsID = 97;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1340 :
						statsID = 97;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1341 :
						statsID = 96;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1342 :
						statsID = 98;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1343 :
						statsID = 99;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1345 :
						statsID = 99;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1346 :
						statsID = 96;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1347 :
						statsID = 98;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1348 :
						statsID = 97;
						lvlElementRune = ing.getTemplate().getLevel();
						runeOrPotion = ing;
						break;
					case 1519 :
						runeOrPotion = ing;
						statsObjectFm = "76";
						statsAdd = 1;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1521 :
						runeOrPotion = ing;
						statsObjectFm = "7c";
						statsAdd = 1;
						poid = 6;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1522 :
						runeOrPotion = ing;
						statsObjectFm = "7e";
						statsAdd = 1;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1523 :
						runeOrPotion = ing;
						statsObjectFm = "7d";
						statsAdd = 3;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1524 :
						runeOrPotion = ing;
						statsObjectFm = "77";
						statsAdd = 1;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1525 :
						runeOrPotion = ing;
						statsObjectFm = "7b";
						statsAdd = 1;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1545 :
						runeOrPotion = ing;
						statsObjectFm = "76";
						statsAdd = 3;
						poid = 3;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1546 :
						runeOrPotion = ing;
						statsObjectFm = "7c";
						statsAdd = 3;
						poid = 18;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1547 :
						runeOrPotion = ing;
						statsObjectFm = "7e";
						statsAdd = 3;
						poid = 3;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1548 :
						runeOrPotion = ing;
						statsObjectFm = "7d";
						statsAdd = 10;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1549 :
						runeOrPotion = ing;
						statsObjectFm = "77";
						statsAdd = 3;
						poid = 3;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1550 :
						runeOrPotion = ing;
						statsObjectFm = "7b";
						statsAdd = 3;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1551 :
						runeOrPotion = ing;
						statsObjectFm = "76";
						statsAdd = 10;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1552 :
						runeOrPotion = ing;
						statsObjectFm = "7c";
						statsAdd = 10;
						poid = 50;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1553 :
						runeOrPotion = ing;
						statsObjectFm = "7e";
						statsAdd = 10;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1554 :
						runeOrPotion = ing;
						statsObjectFm = "7d";
						statsAdd = 30;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1555 :
						runeOrPotion = ing;
						statsObjectFm = "77";
						statsAdd = 10;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1556 :
						runeOrPotion = ing;
						statsObjectFm = "7b";
						statsAdd = 10;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1557 :
						runeOrPotion = ing;
						statsObjectFm = "6f";
						statsAdd = 1;
						poid = 100;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 1558 :
						runeOrPotion = ing;
						statsObjectFm = "80";
						statsAdd = 1;
						poid = 90;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7433 :
						runeOrPotion = ing;
						statsObjectFm = "73";
						statsAdd = 1;
						poid = 30;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7434 :
						runeOrPotion = ing;
						statsObjectFm = "b2";
						statsAdd = 1;
						poid = 20;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7435 :
						runeOrPotion = ing;
						statsObjectFm = "70";
						statsAdd = 1;
						poid = 20;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7436 :
						runeOrPotion = ing;
						statsObjectFm = "8a";
						statsAdd = 1;
						poid = 2;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7437 :
						runeOrPotion = ing;
						statsObjectFm = "dc";
						statsAdd = 1;
						poid = 2;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7438 :
						runeOrPotion = ing;
						statsObjectFm = "75";
						statsAdd = 1;
						poid = 50;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7442 :
						runeOrPotion = ing;
						statsObjectFm = "b6";
						statsAdd = 1;
						poid = 30;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7443 :
						runeOrPotion = ing;
						statsObjectFm = "9e";
						statsAdd = 10;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7444 :
						runeOrPotion = ing;
						statsObjectFm = "9e";
						statsAdd = 30;
						poid = 1; 
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7445 :
						runeOrPotion = ing;
						statsObjectFm = "9e";
						statsAdd = 100;
						poid = 1; 
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7446 :
						runeOrPotion = ing;
						statsObjectFm = "e1";
						statsAdd = 1;
						poid = 15;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7447 :
						runeOrPotion = ing;
						statsObjectFm = "e2";
						statsAdd = 1;
						poid = 2;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7448 :
						runeOrPotion = ing;
						statsObjectFm = "ae";
						statsAdd = 10;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7449 :
						runeOrPotion = ing;
						statsObjectFm = "ae";
						statsAdd = 30;
						poid = 3;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7450 :
						runeOrPotion = ing;
						statsObjectFm = "ae";
						statsAdd = 100;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7451 :
						runeOrPotion = ing;
						statsObjectFm = "b0";
						statsAdd = 1;
						poid = 5;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7452 :
						runeOrPotion = ing;
						statsObjectFm = "f3";
						statsAdd = 1;
						poid = 4;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7453 :
						runeOrPotion = ing;
						statsObjectFm = "f2";
						statsAdd = 1;
						poid = 4;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7454 :
						runeOrPotion = ing;
						statsObjectFm = "f1";
						statsAdd = 1;
						poid = 4;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7455 :
						runeOrPotion = ing;
						statsObjectFm = "f0";
						statsAdd = 1;
						poid = 4;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7456 :
						runeOrPotion = ing;
						statsObjectFm = "f4";
						statsAdd = 1;
						poid = 4;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7457 :
						runeOrPotion = ing;
						statsObjectFm = "d5";
						statsAdd = 1;
						poid = 5;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7458 :
						runeOrPotion = ing;
						statsObjectFm = "d4";
						statsAdd = 1;
						poid = 5;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7459 :
						runeOrPotion = ing;
						statsObjectFm = "d2";
						statsAdd = 1;
						poid = 5;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7460 :
						runeOrPotion = ing;
						statsObjectFm = "d6";
						statsAdd = 1;
						poid = 5;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7560 :
						runeOrPotion = ing;
						statsObjectFm = "d3";
						statsAdd = 1;
						poid = 5;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 8379 :
						runeOrPotion = ing;
						statsObjectFm = "7d";
						statsAdd = 10;
						poid = 10;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 10662 :
						runeOrPotion = ing;
						statsObjectFm = "b0";
						statsAdd = 3;
						poid = 15;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 7508 :
						isSigningRune = true;
						signingRune = ing;
						break;
					case 11118 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "76";
						statsAdd = 15;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11119 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "7c";
						statsAdd = 15;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11120 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "7e";
						statsAdd = 15;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11121 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "7d";
						statsAdd = 45;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11122 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "77";
						statsAdd = 15;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11123 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "7b";
						statsAdd = 15;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11124 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "b0";
						statsAdd = 10;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11125 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "73";
						statsAdd = 3;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11126 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "b2";
						statsAdd = 5;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11127 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "70";
						statsAdd = 5;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11128 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "8a";
						statsAdd = 10;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					case 11129 :
						bonusRune = true;
						runeOrPotion = ing;
						statsObjectFm = "dc";
						statsAdd = 5;
						poid = 1;
						lvlQuaStatsRune = ing.getTemplate().getLevel();
						break;
					default :
						int type = ing.getTemplate().getType();
						if ((type >= 1 && type <= 11) || (type >= 16 && type <= 22) || type == 81 || type == 102 || type == 114
						|| ing.getTemplate().getPACost() > 0) {
							objectFm = ing;
							SocketManager.GAME_SEND_EXCHANGE_OTHER_MOVE_OK_FM(_P.get_compte().getGameThread().get_out(), 'O',"+", objectFm.getGuid() + "|" + 1);
							deleteID = idIngredient;
							Objects newObj = Objects.getCloneObjet(objectFm, 1);
							if (objectFm.getQuantity() > 1) {
								int newQuant = objectFm.getQuantity() - 1;
								objectFm.setQuantity(newQuant);
								SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(_P, objectFm);
								break;
							} else {
								World.removeItem(idIngredient);
								_P.removeItem(idIngredient);
								SocketManager.GAME_SEND_DELETE_STATS_ITEM_FM(_P, idIngredient);
							}
							objectFm = newObj;
						}
				}
			}
			StatsMetier job = _P.getMetierBySkill(_skID);
			job.addXp(_P, (int) (Config.XP_METIER + 9.0 / 10.0) * 10);
			if (job == null || objectFm == null || runeOrPotion == null) {
				SocketManager.GAME_SEND_Ec_PACKET(_P, "EI");
				SocketManager.GAME_SEND_IO_PACKET_TO_MAP(_P.get_curCarte(), _P.get_GUID(), "-");
				_ingredients.clear();
				return;
			}
			if (deleteID != -1) {
				_ingredients.remove(deleteID);
			}
			ObjTemplate objTemplate = objectFm.getTemplate();
			int chance = 0;
			int lvlJob = job.get_lvl();
			int objTemaplateID = objTemplate.getID();
			String statStringObj = objectFm.parseStatsString();
			if (lvlElementRune > 0 && lvlQuaStatsRune == 0) {
				chance = Formulas.calculateChanceByElement(lvlJob, objTemplate.getLevel(), lvlElementRune);
				if (chance > 100 - (lvlJob / 20))
					chance = 100 - (lvlJob / 20);
				if (chance < (lvlJob / 20))
					chance = (lvlJob / 20);
			} else if (lvlQuaStatsRune > 0 && lvlElementRune == 0) {
				int currentWeightTotal = 1;
				int currentWeightStats = 1;
				if (!statStringObj.isEmpty()) {
					currentWeightTotal = currentTotalWeigthBase(statStringObj, objectFm);
					currentWeightStats = currentWeithStats(objectFm, statsObjectFm);
				}
				int currentTotalBase = WeithTotalBase(objTemaplateID);
				if (currentTotalBase < 0) {
					currentTotalBase = 0;
				}
				if (currentWeightStats < 0) {
					currentWeightStats = 0;
				}
				if (currentWeightTotal < 0) {
					currentWeightTotal = 0;
				}
				float coef = 1;
				int baseStats = ViewBaseStatsItem(objectFm, statsObjectFm);
				int currentStats = ViewActualStatsItem(objectFm, statsObjectFm);
				if (baseStats == 1 && currentStats == 1 || baseStats == 1 && currentStats == 0) {
					coef = 1.0f;
				} else if (baseStats == 2 && currentStats == 2) {
					coef = 0.50f;
				} else if (baseStats == 0 && currentStats == 0 || baseStats == 0 && currentStats == 1) {
					coef = 0.25f;
				}
				if (getActualJet(objectFm, statsObjectFm) >= getStatBaseMaxs(objectFm.getTemplate(), statsObjectFm))
					coef = 0.15f;
				int diff = (int) (currentTotalBase * 1.3f) - currentWeightTotal;
				chance = Formulas.chanceFM(currentTotalBase, currentWeightTotal, currentWeightStats, poid, diff, coef);
				if (bonusRune)
					chance += 20;
				if (chance < 1)
					chance = 1;
				else if (chance > 100)
					chance = 100;
				
				Logs.addToFmLog("Personnage "+_P.get_name()+": ObjectFM("+objectFm.getTemplate().getName()+"),Rune("+runeOrPotion.getTemplate().getName()+"), ChanceTotale("+chance+")");
			}
			int aleatoryChance = Formulas.getRandomValue(1, 100);
			boolean sucess = chance >= aleatoryChance;
			if (!sucess) { // Si il n'a pas réussi
				Logs.addToFmLog("Personnage "+_P.get_name()+": Object '"+objectFm.getTemplate().getName()+"' hasn't fm witch succes !");
				if (signingRune != null) {
					int newQua = signingRune.getQuantity() - 1;
					if (newQua <= 0) {
						_P.removeItem(signingRune.getGuid());
						World.removeItem(signingRune.getGuid());
						SocketManager.GAME_SEND_DELETE_STATS_ITEM_FM(_P, signingRune.getGuid());
					} else {
						signingRune.setQuantity(newQua);
						SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(_P, signingRune);
					}
				}
				if (runeOrPotion != null) {
					int newQua = runeOrPotion.getQuantity() - 1;
					if (newQua <= 0) {
						_P.removeItem(runeOrPotion.getGuid());
						World.removeItem(runeOrPotion.getGuid());
						SocketManager.GAME_SEND_DELETE_STATS_ITEM_FM(_P, runeOrPotion.getGuid());
					} else {
						runeOrPotion.setQuantity(newQua);
						SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(_P, runeOrPotion);
					}
				}
					World.addObjet(objectFm, true);
					_P.addObjet(objectFm);
					if (!statStringObj.isEmpty()) {
						String statsStr = objectFm.parseStringStatsEC_FM(objectFm, poid);
						objectFm.clearStats();
						objectFm.parseStringToStats(statsStr);
					}
					SocketManager.GAME_SEND_OAKO_PACKET(_P, objectFm);
					SocketManager.GAME_SEND_Ow_PACKET(_P);
					
					String data = objectFm.getGuid() + "|1|" + objectFm.getTemplate().getID() + "|" + objectFm.parseStatsString();
					if (!_isRepeat)
						_reConfigingRunes = -1;
					if (_reConfigingRunes != 0 || _broken)
						SocketManager.GAME_SEND_EXCHANGE_MOVE_OK_FM(_P, 'O', "+", data);
					_data = data;
				
				
				SocketManager.GAME_SEND_IO_PACKET_TO_MAP(_P.get_curCarte(), _P.get_GUID(), "-" + objTemaplateID);
				SocketManager.GAME_SEND_Ec_PACKET(_P, "EF");
				SocketManager.GAME_SEND_Im_PACKET(_P, "0183");
			} else {// Si réussite :)
				Logs.addToFmLog("Personnage "+_P.get_name()+":  +"+objectFm.getTemplate().getName()+" has fm witch succes !");
				int coef = 0;
				if (lvlElementRune == 1)
					coef = 50;
				else if (lvlElementRune == 25)
					coef = 65;
				else if (lvlElementRune == 50)
					coef = 85;
				if (isSigningRune) {
					objectFm.addTxtStat(985, _P.get_name());
				}
				if (lvlElementRune > 0 && lvlQuaStatsRune == 0) {
					for (SpellEffect effect : objectFm.getEffects()) {
						if (effect.getEffectID() != 100)
							continue;
						String[] infos = effect.getArgs().split(";");
						try {
							int min = Integer.parseInt(infos[0], 16);
							int max = Integer.parseInt(infos[1], 16);
							int newMin = (int) ((min * coef) / 100);
							int newMax = (int) ((max * coef) / 100);
							if (newMin == 0)
								newMin = 1;
							String newRange = "1d" + (newMax - newMin + 1) + "+" + (newMin - 1);
							String newArgs = Integer.toHexString(newMin) + ";" + Integer.toHexString(newMax) + ";-1;-1;0;"
							+ newRange;
							effect.setArgs(newArgs);
							effect.setEffectID(statsID);
						} catch (Exception e) {
							e.printStackTrace();
						}
					}
				} else if (lvlQuaStatsRune > 0 && lvlElementRune == 0) {
					boolean negative = false;
					int currentStats = ViewActualStatsItem(objectFm, statsObjectFm);
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
					if (currentStats == 1 || currentStats == 2) {
						String statsStr = objectFm.parseFMStatsString(statsObjectFm, objectFm, statsAdd, negative);
						objectFm.clearStats();
						objectFm.parseStringToStats(statsStr);
					} else {
						if (statStringObj.isEmpty()) {
							String statsStr = statsObjectFm + "#" + Integer.toHexString(statsAdd) + "#0#0#0d0+" + statsAdd;
							objectFm.clearStats();
							objectFm.parseStringToStats(statsStr);
						} else {
							String statsStr = objectFm.parseFMStatsString(statsObjectFm, objectFm, statsAdd, negative) + ","
							+ statsObjectFm + "#" + Integer.toHexString(statsAdd) + "#0#0#0d0+" + statsAdd;
							objectFm.clearStats();
							objectFm.parseStringToStats(statsStr);
						}
					}
				}
				if (signingRune != null) {
					int newQua = signingRune.getQuantity() - 1;
					if (newQua <= 0) {
						_P.removeItem(signingRune.getGuid());
						World.removeItem(signingRune.getGuid());
						SocketManager.GAME_SEND_REMOVE_ITEM_PACKET(_P, signingRune.getGuid());
					} else {
						signingRune.setQuantity(newQua);
						SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(_P, signingRune);
					}
				}
				if (runeOrPotion != null) {
					int newQua = runeOrPotion.getQuantity() - 1;
					if (newQua <= 0) {
						_P.removeItem(runeOrPotion.getGuid());
						World.removeItem(runeOrPotion.getGuid());
						SocketManager.GAME_SEND_REMOVE_ITEM_PACKET(_P, runeOrPotion.getGuid());
					} else {
						runeOrPotion.setQuantity(newQua);
						SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(_P, runeOrPotion);
					}
				}
				World.addObjet(objectFm, true);
				_P.addObjet(objectFm);
				SocketManager.GAME_SEND_Ow_PACKET(_P);
				SocketManager.GAME_SEND_OAKO_PACKET(_P, objectFm);
				
				String data = objectFm.getGuid() + "|1|" + objectFm.getTemplate().getID() + "|" + objectFm.parseStatsString();
				if (!_isRepeat)
					_reConfigingRunes = -1;
				if (_reConfigingRunes != 0 || _broken)
					SocketManager.GAME_SEND_EXCHANGE_MOVE_OK_FM(_P, 'O', "+", data);
				_data = data;
				SocketManager.GAME_SEND_IO_PACKET_TO_MAP(_P.get_curCarte(), _P.get_GUID(), "+" + objTemaplateID);
				SocketManager.GAME_SEND_Ec_PACKET(_P, "K;" + objTemaplateID);
			}
			_lastCraft.clear();
			_lastCraft.putAll(_ingredients);
			_lastCraft.put(objectFm.getGuid(), 1);
			_ingredients.clear();
			Logs.addToFmLog("Personnage "+_P.get_name()+": End fm to '"+objectFm.getTemplate().getName()+"' sucessfully !");
		}
		
	public static int getStatBaseMaxs(ObjTemplate objMod, String statsModif) {
		String[] split = objMod.getStrTemplate().split(",");
		for (String s : split) {
			String[] stats = s.split("#");
			if (stats[0].toLowerCase().compareTo(statsModif.toLowerCase()) > 0) {
				continue;
			} else if (stats[0].toLowerCase().compareTo(statsModif.toLowerCase()) == 0) {
				int max = Integer.parseInt(stats[2], 16);
				if (max == 0)
					max = Integer.parseInt(stats[1], 16);
				return max;
			}
		}
		return 0;
	}

	public static int WeithTotalBase(int objTemplateID) {
			int weight = 0;
			int alt = 0;
			String statsTemplate = "";
			statsTemplate = World.getObjTemplate(objTemplateID).getStrTemplate();
			if (statsTemplate == null || statsTemplate.isEmpty())
				return 0;
			String[] split = statsTemplate.split(",");
			for (String s : split) {
				String[] stats = s.split("#");
				int statID = Integer.parseInt(stats[0], 16);
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
					value = Formulas.getRandomJet(jet);
					try {
						int min = Integer.parseInt(stats[1], 16);
						int max = Integer.parseInt(stats[2], 16);
						value = min;
						if (max != 0)
							value = max;
					} catch (Exception e) {
						value = Formulas.getRandomJet(jet);
					}
				} catch (Exception e) {}
				int statX = 1;
				if (statID == 125 || statID == 158 || statID == 174)
				{
					statX = 1;
				} else if (statID == 118 || statID == 126 || statID == 119 || statID == 123)
				{
					statX = 2;
				} else if (statID == 138 || statID == 666 || statID == 226 || statID == 220)																																	// de
																																										// daños,Trampas %
				{
					statX = 3;
				} else if (statID == 124 || statID == 176)
				{
					statX = 5;
				} else if (statID == 240 || statID == 241 || statID == 242 || statID == 243 || statID == 244)
													
				{
					statX = 7;
				} else if (statID == 210 || statID == 211 || statID == 212 || statID == 213 || statID == 214)
				
				{
					statX = 8;
				} else if (statID == 225)
				{
					statX = 15;
				} else if (statID == 178 || statID == 112)
				{
					statX = 20;
				} else if (statID == 115 || statID == 182)
				{
					statX = 30;
				} else if (statID == 117)
				{
					statX = 50;
				} else if (statID == 128)
				{
					statX = 90;
				} else if (statID == 111)
				{
					statX = 100;
				}
				weight = value * statX; 
				alt += weight;
			}
			return alt;
		}

		public static int currentWeithStats(Objects obj, String statsModif) {
