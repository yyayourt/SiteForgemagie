	public String parseFMEchecStatsString(Objet obj, double poid)
	{
		StringBuilder stats = new StringBuilder();
		boolean isFirst = true;
		for(SpellEffect SE : obj.Effects)
		{
			if(!isFirst)
				stats.append(",");
			
			String[] infos = SE.getArgs().split(";");
			try
			{
				stats.append(Integer.toHexString(SE.getEffectID())).append("#").append(infos[0]).append("#").append(infos[1]).append("#0#").append(infos[5]);
			}catch(Exception e)
			{
				e.printStackTrace();
				continue;
			};
			
			isFirst = false;
		}
		
		for(Entry<Integer,Integer> entry : obj.Stats.getMap().entrySet())
		{
				//En cas d'echec les stats négatives Chance,Agi,Intel,Force,Portee,Vita augmentes
				int newstats = 0;
				
				if(entry.getKey() == 152 ||
				   entry.getKey() == 154 ||
				   entry.getKey() == 155 ||
				   entry.getKey() == 157 ||
				   entry.getKey() == 116 ||
				   entry.getKey() == 153)
				{
					float a = (float)((entry.getValue()*poid)/100);
					if(a < 1) a = 1;
					float chute = (float)(entry.getValue()+a);
					newstats = (int)Math.floor(chute);
					//On limite la chute du négatif a sont maximum
					if(newstats > Job.getBaseMaxJet(obj.getTemplate().getID(), Integer.toHexString(entry.getKey())))
					{
						newstats = Job.getBaseMaxJet(obj.getTemplate().getID(), Integer.toHexString(entry.getKey()));
					}
				}else
				{
				if(entry.getKey() == 127 || entry.getKey() == 101) continue;//PM, pas de négatif ainsi que PA
				
					float chute = (float)(entry.getValue()-((entry.getValue()*poid)/100));
					newstats = (int)Math.floor(chute);
				}
				if(newstats < 1) continue;
				String jet = "0d0+"+newstats;
				if(!isFirst)stats.append(",");
				stats.append(Integer.toHexString(entry.getKey())).append("#").append(Integer.toHexString(newstats)).append("#0#0#").append(jet);
				isFirst = false;
		}
		
		for(Entry<Integer,String> entry : obj.txtStats.entrySet())
		{
			if(!isFirst)stats.append(",");
			stats.append(Integer.toHexString(entry.getKey())).append("#0#0#0#").append(entry.getValue());
			isFirst = false;
		}
		return stats.toString();
	}
	
	public Stats generateNewStatsFromTemplate(String statsTemplate,boolean useMax)
	{
		Stats itemStats = new Stats(false, null);
		//Si stats Vides
		if(statsTemplate.equals("") || statsTemplate == null) return itemStats;

		String[] splitted = statsTemplate.split(",");
		for(String s : splitted)
		{	
			String[] stats = s.split("#");
			int statID = Integer.parseInt(stats[0],16);
			boolean follow = true;
			
			for(int a : Constants.ARMES_EFFECT_IDS)//Si c'est un Effet Actif
				if(a == statID)
					follow = false;
			if(!follow)continue;//Si c'était un effet Actif d'arme
			
			String jet = "";
			int value  = 1;
			try
			{
				jet = stats[4];
				value = Formulas.getRandomJet(jet);
				if(useMax)
				{
					try
					{
						//on prend le jet max
						int min = Integer.parseInt(stats[1],16);
						int max = Integer.parseInt(stats[2],16);
						value = min;
						if(max != 0)value = max;
					}catch(Exception e){value = Formulas.getRandomJet(jet);};			
				}
			}catch(Exception e){};
			itemStats.addOneStat(statID, value);
		}
		return itemStats;
	}
	
	public void setStats (Stats SS)
	{
		Stats = SS;
	}
	
	public static int getPoidOfActualItem(String statsTemplate)//Donne le poid de l'item actuel
	{
		int poid = 0;
		int somme = 0;
		String[] splitted = statsTemplate.split(",");
		for(String s : splitted)
		{
			String[] stats = s.split("#");
			int statID = Integer.parseInt(stats[0],16);
			boolean follow = true;
			
			for(int a : Constants.ARMES_EFFECT_IDS)//Si c'est un Effet Actif
				if(a == statID)
					follow = false;
			if(!follow)continue;//Si c'était un effet Actif d'arme
			
			String jet = "";
			int value  = 1;
			try
			{
				jet = stats[4];
				value = Formulas.getRandomJet(jet);
					try
					{
						//on prend le jet max
						int min = Integer.parseInt(stats[1],16);
						int max = Integer.parseInt(stats[2],16);
						value = min;
						if(max != 0)value = max;
					}catch(Exception e){value = Formulas.getRandomJet(jet);};			
			}catch(Exception e){};
			
			int multi = 1;
			if(statID == 118 || statID == 126 || statID == 125 || statID == 119 || statID == 123 || statID == 158 || statID == 174)//Force,Intel,Vita,Agi,Chance,Pod,Initiative
			{
				multi = 1;
			}
			else if(statID == 138 || statID == 666 || statID == 226 || statID == 220)//Domages %,Domage renvoyé,Piège %
			{
				multi = 2;
			}	
			else if(statID == 124 || statID == 176)//Sagesse,Prospec
			{
				multi = 3;
			}
			else if(statID == 240 || statID == 241 || statID == 242 || statID == 243 || statID == 244)//Ré Feu, Air, Eau, Terre, Neutre
			{
				multi = 4;
			}
			else if(statID == 210 || statID == 211 || statID == 212 || statID == 213 || statID == 214)//Ré % Feu, Air, Eau, Terre, Neutre
			{
				multi = 5;
			}
			else if(statID == 225)//Piège
			{
				multi = 15;
			}
			else if(statID == 178 || statID == 112)//Soins,Dommage
			{
				multi = 20;
			}
			else if(statID == 115 || statID == 182)//Cri,Invoc
			{
				multi = 30;
			}
			else if(statID == 117)//PO
			{
				multi = 50;
			}
			else if(statID == 128)//PM
			{
				multi = 90;
			}
			else if(statID == 111)//PA
			{
				multi = 100;
			}
				poid = value*multi; //poid de la carac
				somme += poid;
		}
		return somme;
	}

	public static int getPoidOfBaseItem(int i)//Donne le poid de l'item actuel
	{
		int poid = 0;
		int somme = 0;
		String NaturalStatsItem = World.database.getOtherData().getNaturalStats(i);

		if(NaturalStatsItem == null || NaturalStatsItem.isEmpty()) return 0;
		String[] splitted = NaturalStatsItem.split(",");
		for(String s : splitted)
		{
			String[] stats = s.split("#");
			int statID = Integer.parseInt(stats[0],16);
			boolean follow = true;
			
			for(int a : Constants.ARMES_EFFECT_IDS)//Si c'est un Effet Actif
				if(a == statID)
					follow = false;
			if(!follow)continue;//Si c'était un effet Actif d'arme
			
			String jet = "";
			int value  = 1;
			try
			{
				jet = stats[4];
				value = Formulas.getRandomJet(jet);
					try
					{
						//on prend le jet max
						int min = Integer.parseInt(stats[1],16);
						int max = Integer.parseInt(stats[2],16);
						value = min;
						if(max != 0)value = max;
					}catch(Exception e){value = Formulas.getRandomJet(jet);};			
			}catch(Exception e){};
			
			int multi = 1;
			if(statID == 118 || statID == 126 || statID == 125 || statID == 119 || statID == 123 || statID == 158 || statID == 174)//Force,Intel,Vita,Agi,Chance,Pod,Initiative
			{
				multi = 1;
			}
			else if(statID == 138 || statID == 666 || statID == 226 || statID == 220)//Domages %,Domage renvoyé,Piège %
			{
				multi = 2;
			}	
			else if(statID == 124 || statID == 176)//Sagesse,Prospec
			{
				multi = 3;
			}
			else if(statID == 240 || statID == 241 || statID == 242 || statID == 243 || statID == 244)//Ré Feu, Air, Eau, Terre, Neutre
			{
				multi = 4;
			}
			else if(statID == 210 || statID == 211 || statID == 212 || statID == 213 || statID == 214)//Ré % Feu, Air, Eau, Terre, Neutre
			{
				multi = 5;
			}
			else if(statID == 225)//Piège
			{
				multi = 15;
			}
			else if(statID == 178 || statID == 112)//Soins,Dommage
			{
				multi = 20;
			}
			else if(statID == 115 || statID == 182)//Cri,Invoc
			{
				multi = 30;
			}
			else if(statID == 117)//PO
			{
				multi = 50;
			}
			else if(statID == 128)//PM
			{
				multi = 90;
			}
			else if(statID == 111)//PA
			{
				multi = 100;
			}
			poid = value*multi; //poid de la carac
			somme +=poid;
		}
		return somme;
	}
	/* *********FM SYSTEM********* */

	public ArrayList<SpellEffect> getEffects()
	{
		return Effects;
	}

	public ArrayList<SpellEffect> getCritEffects()
	{
		ArrayList<SpellEffect> effets = new ArrayList<SpellEffect>();
		for(SpellEffect SE : Effects)
		{
			try
