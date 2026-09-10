1121-	}
1122-	
1123:	public static int chanceFM(int WeightTotalBase, int currentWeithTotal, int currentWeightStats, int weight, int diff,
1124-			float coef) {
1125-				float chance = 0.0F;
1126-				float a = ((WeightTotalBase + diff) * coef * Config.RATE_FM);
1127-				float b = (float) (Math.sqrt(currentWeithTotal + currentWeightStats) + weight);
1128-				if (b < 1.0)
1129-					b = 1.0F;
1130-				chance = a / b;
1131-				return (int) chance;
1132-			}
1133-	
1134-	public static int getTraqueXP(int lvl)
1135-	{
1136-		if (lvl < 50)
1137-			return 10000 * Config.XP_PVM;
1138-		if (lvl < 60)
1139-			return 65000 * Config.XP_PVM;
1140-		if (lvl < 70)
1141-			return 90000 * Config.XP_PVM;
1142-		if (lvl < 80)
1143-			return 120000 * Config.XP_PVM;
--
1519-        return TheWinner;
1520-	}
1521:	public static int calculateChanceByElement(int lvlJob, int lvlObject, int lvlRune) {
1522-		int K = 1;
1523-		if (lvlRune == 1)
1524-			K = 100;
1525-		else if (lvlRune == 25)
1526-			K = 175;
1527-		else if (lvlRune == 50)
1528-			K = 350;
1529-		return lvlJob * 100 / (K + lvlObject);
1530-	}
1531-	
1532-}
