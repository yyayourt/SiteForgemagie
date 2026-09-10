					add = 1;
					poid = 5;
					isStatsChanging = ing.getTemplate().getLevel();
					break;
				case 7460://Ré % neutre
					mod=ing;
					stats ="d6";
					add = 1;
					poid = 5;
					isStatsChanging = ing.getTemplate().getLevel();
					break;
				case 7560://Ré % Eau
					mod=ing;
					stats ="d3";
					add = 1;
					poid = 5;
					isStatsChanging = ing.getTemplate().getLevel();
					break;
				case 8379:// Rune Vie
					mod=ing;
					//TODO : N'existe plus.
					isStatsChanging = ing.getTemplate().getLevel();
					break;
				case 7508://Rune de signature
					signed = true;
					sign = ing;
				break;
				default://Si pas runes ou popo, et qu'il a un cout en PA, alors c'est une arme (une vérification du type serait préférable)
					if(ing.getTemplate().getPACost()>0)obj = ing;
					if(ing.getTemplate().getType() == 1
							|| ing.getTemplate().getType() == 2
							|| ing.getTemplate().getType() == 3
							|| ing.getTemplate().getType() == 4
							|| ing.getTemplate().getType() == 5
							|| ing.getTemplate().getType() == 6
							|| ing.getTemplate().getType() == 7
							|| ing.getTemplate().getType() == 8
							|| ing.getTemplate().getType() == 9
							|| ing.getTemplate().getType() == 10
							|| ing.getTemplate().getType() == 11
							|| ing.getTemplate().getType() == 16
							|| ing.getTemplate().getType() == 17
							|| ing.getTemplate().getType() == 19
							|| ing.getTemplate().getType() == 20
							|| ing.getTemplate().getType() == 21
							|| ing.getTemplate().getType() == 22
							|| ing.getTemplate().getType() == 81
							|| ing.getTemplate().getType() == 102
							|| ing.getTemplate().getType() == 114) obj = ing;
				break;
				}
			}
			StatsMetier SM = _P.getMetierBySkill(_skID);
			
			if(SM == null || obj == null || mod == null)
			{
				SocketManager.GAME_SEND_Ec_PACKET(_P,"EI");
				SocketManager.GAME_SEND_IO_PACKET_TO_MAP(_P.get_curCarte(),_P.get_GUID(),"-");
				_ingredients.clear();
				return;
			}
			if(((SM._lvl)*2) < obj.getTemplate().getLevel())
			{
				isElementChanging = 0;
				isStatsChanging = 0;
			}

			int chan = 0;

			/* DEBUG
			Console.instance.println("ElmChg: "+isElementChanging);//Si > 0 changement d'éléments
			Console.instance.println("StatsChg: "+isStatsChanging);//Si > 0 changement de stats
			Console.instance.println("LevelMetier: "+SM.get_lvl());
			Console.instance.println("LevelArme: "+obj.getTemplate().getLevel());
			///*/
			

			if(isElementChanging > 0 && isStatsChanging == 0)//Si changement d'élément
			{
				chan = Formulas.calculElementChangeChance(SM.get_lvl(), obj.getTemplate().getLevel(), isElementChanging);
				//Min/max de 5% /95%
				if(chan > 100-(SM.get_lvl()/20))chan =100-(SM.get_lvl()/20);
				if(chan < (SM.get_lvl()/20))chan = (SM.get_lvl()/20);
			}
			else if(isStatsChanging > 0 && isElementChanging == 0)//Si changement de stats
			{
				int poidActual = 1;
				int ActualJet = 1;
				if(!obj.parseStatsString().isEmpty())
				{
					poidActual = Objet.getPoidOfActualItem(obj.parseStatsString().replace(";","#"));//Poid de l'item actuel
					ActualJet = getActualJet(obj, stats);//Jet actuel de l'item
				}
				int poidBase = Objet.getPoidOfBaseItem(obj.getTemplate().getID());//Poid de base de l'item
				int BaseMaxJet = getBaseMaxJet(obj.getTemplate().getID(), stats);
				int Puis = poidBase-poidActual;
				
				if(poidBase <= 0)
				{
					poidBase = 0;
				}
				if(BaseMaxJet <= 0)
				{
					BaseMaxJet = 0;
				}
				if(ActualJet <= 0)
				{
					ActualJet = 0;
				}
				if(poidActual <= 0)
				{
					poidActual = 0;
				}
				if(poid <= 0)
				{
					poid = 0;
				}
				
				double Coef = 1;
				if(ViewBaseStatsItem(obj, stats) == 1 && ViewActualStatsItem(obj, stats) == 1 || ViewBaseStatsItem(obj, stats) == 1 && ViewActualStatsItem(obj, stats) == 0)//Existe sur l'arme de base
				{
					Coef = 1;
				}else if(ViewBaseStatsItem(obj, stats) == 2 && ViewActualStatsItem(obj, stats) == 2)//Existe en négatif de base && négatif sur l'arme
				{
					Coef = 0.75;
				}else if(ViewBaseStatsItem(obj, stats) == 0 && ViewActualStatsItem(obj, stats) == 0 || ViewBaseStatsItem(obj, stats) == 0 && ViewActualStatsItem(obj, stats) == 1)//N'existe pas sur l'arme de base
				{
					Coef = 0.25;
				}
				
				//OverMax
				double JetMax = BaseMaxJet*(2-(obj.getTemplate().getLevel()/100));
				if(JetMax <=0) JetMax = 1;
				//int JetMax = (int) (BaseMaxJet+(BaseMaxJet+(100-(poid*BaseMaxJet)) / (2*poid)));
				Coef = Coef*((JetMax - (double)(ActualJet))/25);
				if(Coef <= 0) Coef = 0;
				chan = Formulas.ChanceFM(poidBase, poidActual, BaseMaxJet, ActualJet, poid, Puis, Coef);

				//DEBUG :
				Console.instance.println("-OverMax : "+JetMax);
				Console.instance.println("-poidBase : "+poidBase);
				Console.instance.println("-BaseMaxJet : "+BaseMaxJet);
				Console.instance.println("-ActualJet : "+ActualJet);
				Console.instance.println("-poidActual : "+poidActual);
				Console.instance.println("-poid : "+poid);
				Console.instance.println("-Puis : "+Puis);
				Console.instance.println("-Coef : "+Coef);
				Console.instance.println("-chan : "+chan);
				if(chan <= 0)chan = 1;
				if(chan >= 100)chan = 100;
				Console.instance.println("--chance : "+chan);
				
				// 2 cas : Réussite Totale
				// ou échec total : la FM n'a pas réussi et les bonus de toutes les caractéristiques diminuent proportionnellement à la puissance à la puissance de la rune. Utiliser de grosses runes est donc risqué.
				//chan = chan-(106-SM.get_lvl());
			}
			
			int jet = Formulas.getRandomValue(1, 100);
			boolean success = chan >= jet;
			int tID = obj.getTemplate().getID();
			if(!success)//Si echec
			{
				//Baisse des stats ?
				//OQ82995355|2 Si echec renvoi les runes (une sorte de mise a jour de l'inventaire)
				//SocketManager.GAME_SEND_OBJECT_QUANTITY_PACKET(_P, mod);
				
				
				//Echec en fonction des stats, négatif ou positif.
				String statsnegatif = "";
				if(ViewBaseStatsItem(obj, "98") == 1)
				{
					if(ViewActualStatsItem(obj, "98") == 0 && ViewActualStatsItem(obj, "7b") == 0)
					{
						statsnegatif += ",98#"+Integer.toHexString(1)+"#0#0#0d0+1";	
					}
				}
				if(ViewBaseStatsItem(obj, "9a") == 1)
				{
					if(ViewActualStatsItem(obj, "9a") == 0 && ViewActualStatsItem(obj, "77") == 0)
					{
						statsnegatif += ",9a#"+Integer.toHexString(1)+"#0#0#0d0+1";	
					}
				}
				if(ViewBaseStatsItem(obj, "9b") == 1)
				{
					if(ViewActualStatsItem(obj, "9b") == 0 && ViewActualStatsItem(obj, "7e") == 0)
					{
						statsnegatif += ",9b#"+Integer.toHexString(1)+"#0#0#0d0+1";	
					}
				}
				if(ViewBaseStatsItem(obj, "9d") == 1)
				{
					if(ViewActualStatsItem(obj, "9d") == 0 && ViewActualStatsItem(obj, "76") == 0)
					{
						statsnegatif += ",9d#"+Integer.toHexString(1)+"#0#0#0d0+1";	
					}
				}
				if(ViewBaseStatsItem(obj, "74") == 1)
				{
					if(ViewActualStatsItem(obj, "74") == 0 && ViewActualStatsItem(obj, "75") == 0)
					{
						statsnegatif += ",74#"+Integer.toHexString(1)+"#0#0#0d0+1";	
					}
				}
				if(ViewBaseStatsItem(obj, "99") == 1)
				{
					if(ViewActualStatsItem(obj, "99") == 0 && ViewActualStatsItem(obj, "7d") == 0)
					{
						statsnegatif += ",99#"+Integer.toHexString(1)+"#0#0#0d0+1";	
					}
				}
				if(obj.parseStatsString().isEmpty() && !statsnegatif.isEmpty())//Si l'item est vide et que l'on a l'ajout de stats négatifs
				{
					obj.setStats(obj.generateNewStatsFromTemplate((statsnegatif.substring(1)), false));	
				}
				else if(!obj.parseStatsString().isEmpty())//Si l'item possède déjà des stats
				{	
					obj.setStats(obj.generateNewStatsFromTemplate((obj.parseFMEchecStatsString(obj, poid).replace(";","#")+statsnegatif), false));
				}
				SocketManager.GAME_SEND_REMOVE_ITEM_PACKET(_P, obj.getGuid());//Supprime l'ancien affichage de l'item
				SocketManager.GAME_SEND_Ow_PACKET(_P);
				SocketManager.GAME_SEND_OAKO_PACKET(_P, obj);
				SocketManager.GAME_SEND_Em_PACKET(_P,"EC+"+obj.getGuid()+"|1|"+tID+"|"+obj.parseStatsString().replace(";","#"));//On replace l'item dans l'inventaire
				SocketManager.GAME_SEND_Ec_PACKET(_P,"EF");
				SocketManager.GAME_SEND_IO_PACKET_TO_MAP(_P.get_curCarte(),_P.get_GUID(),"-"+tID);
				SocketManager.GAME_SEND_Im_PACKET(_P, "0183");
				World.database.getItemData().update(obj);
			}else
			{
				int coef = 0;
				if(isElementChanging == 1)coef = 50;
				if(isElementChanging == 25)coef = 65;
				if(isElementChanging == 50)coef = 85;
				//Si signé on ajoute la ligne de Stat "Modifié par: "
				if(signed)obj.addTxtStat(985, _P.get_name());
				
				if(isElementChanging > 0  && isStatsChanging == 0)//Si on modifier l'élément
				{
					for(SpellEffect SE : obj.getEffects())
					{
						//Si pas un effet Dom Neutre, on continue
						if(SE.getEffectID() != 100)continue;
						String[] infos = SE.getArgs().split(";");
						try
						{
							//on calcule les nouvelles stats
							int min = Integer.parseInt(infos[0],16);
							int max = Integer.parseInt(infos[1],16);
							int newMin = (int)((min * coef) /100);
							int newMax = (int)((max * coef) /100);
	
							if(newMin == 0) newMin = 1;
							String newJet = "1d"+(newMax-newMin+1)+"+"+(newMin-1);
							String newArgs = Integer.toHexString(newMin)+";"+Integer.toHexString(newMax)+";-1;-1;0;"+newJet;
							
							SE.setArgs(newArgs);//on modifie les propriétés du SpellEffect
							SE.setEffectID(stat);//On change l'élement d'attaque
							
						}catch(Exception e){e.printStackTrace();};
					}
				}
				else if(isStatsChanging > 0 && isElementChanging == 0)//Si on modifier les stats (rune)
				{
					Console.instance.println("Changement de STATS");
					Console.instance.println("Chance : "+chan);
					Console.instance.println("Element a modifier : "+stats);
					
					boolean negatif = false;
					
					if(ViewActualStatsItem(obj, stats) == 2)//Le stats existe actuellement en négatif
					{
						//Réduit les stats négatifs si réussit jusqu'a leur disparitions
						if(stats.compareTo("7b") == 0){
							stats = "98";
							negatif = true;
						}
						if(stats.compareTo("77") == 0){
							stats = "9a";
							negatif = true;
						}
						if(stats.compareTo("7e") == 0){
							stats = "9b";
							negatif = true;
						}
						if(stats.compareTo("76") == 0){
							stats = "9d";
							negatif = true;
						}
						if(stats.compareTo("75") == 0){
							stats = "74";
							negatif = true;
						}
						if(stats.compareTo("7d") == 0){
							stats = "99";
							negatif = true;
						}
						//On change la valeur du stats a modifier
					}
					
					if(ViewActualStatsItem(obj, stats) == 1 || ViewActualStatsItem(obj, stats) == 2)//L'item possède le stats négatif ou positif
					{
