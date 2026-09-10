	}
	
	public static int calculElementChangeChance(int lvlM,int lvlA,int lvlP)
	{
		int K = 350;
		if(lvlP == 1)K = 100;
		else if (lvlP == 25)K = 175;
		else if (lvlP == 50)K = 350;
		return (int)((lvlM*100)/(K + lvlA));
	}

		}
		
		return total;
	}
	
	public static int ChanceFM(int poidItemBase, int poidItemActual, int poidBaseJet, int poidActualJet, double poidRune, int Puis, double Coef)
	{
		int Chance = 0;
		int a = (poidItemBase+poidBaseJet+(Puis*2));
		int b = (int) (Math.sqrt(poidItemActual+poidActualJet+poidRune));
		if(b <= 0) b = 1;
		Chance = (int) Math.floor((a/b)*Coef);
		
		//DEBUG :
		Console.instance.println("A : "+a);
		Console.instance.println("B : "+b);
		return Chance;
	}
	
	public static int getTraqueXP(int lvl)
	{
