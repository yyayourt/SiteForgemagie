		public static int currentWeithStats(Objects obj, String statsModif) {
			for (Entry<Integer, Integer> entry : obj.getStats().getMap().entrySet()) {
				int statID = entry.getKey();
				if (Integer.toHexString(statID).toLowerCase().compareTo(statsModif.toLowerCase()) > 0) {
					continue;
				} else if (Integer.toHexString(statID).toLowerCase().compareTo(statsModif.toLowerCase()) == 0) {
					int statX = 1;
					int coef = 1;
					int BaseStats = ViewBaseStatsItem(obj, Integer.toHexString(statID));
					if (BaseStats == 2) {
						coef = 3;
					} else if (BaseStats == 0) {
						coef = 8;
					}
					if (statID == 125 || statID == 158 || statID == 174)
					{
						statX = 1;
					} else if (statID == 118 || statID == 126 || statID == 119 || statID == 123)
				
					{
						statX = 2;
					} else if (statID == 138 || statID == 666 || statID == 226 || statID == 220)																																					// daños,Trampas
																																											// %
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
					int Weight = entry.getValue() * statX * coef;
					return Weight;
				}
			}
			return 0;
		}

	public static int currentTotalWeigthBase(String statsModelo, Objects obj) {
			int Weigth = 0;
			int Alto = 0;
			String[] split = statsModelo.split(",");
			for (String s : split) {
				String[] stats = s.split("#");
				int statID = Integer.parseInt(stats[0], 16);
				boolean xy = false;
				for (int a : Constant.ARMES_EFFECT_IDS)
					if (a == statID)
						xy = true;
				if (xy)
					continue;
				String jet = "";
				int qua = 1;
				try {
					jet = stats[4];
					qua = Formulas.getRandomJet(jet);
					try {
						int min = Integer.parseInt(stats[1], 16);
						int max = Integer.parseInt(stats[2], 16);
						qua = min;
						if (max != 0)
							qua = max;
					} catch (Exception e) {
						qua = Formulas.getRandomJet(jet);
					}
				} catch (Exception e) {}
				int statX = 1;
				int coef = 1;
				int statsBase = ViewBaseStatsItem(obj, stats[0]);
				if (statsBase == 2) {
					coef = 3;
				} else if (statsBase == 0) {
					coef = 8;
				}
				if (statID == 125 || statID == 158 || statID == 174)
				{
					statX = 1;
				} else if (statID == 118 || statID == 126 || statID == 119 || statID == 123)
				{
					statX = 2;
				} else if (statID == 138 || statID == 666 || statID == 226 || statID == 220)																															// de
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
				Weigth = qua * statX * coef;
				Alto += Weigth;
			}
			return Alto;
		}
	public void startRepeat(int time, Characters P){ //Skryn & Return Enjoy :D
		_P = P;
		if (_skID != 1 && _skID != 113	&& _skID != 115	&& _skID != 116	&& _skID != 117	&& _skID != 118	&& _skID != 119	&& _skID != 120	&& _skID != 163	&& _skID != 164	&& _skID != 165	&& _skID != 166	&& _skID != 167	&& _skID != 168	&& _skID != 169){
			repeat(time, P);
			return;
		}
		_reConfigingRunes = time;
		_craftTimer.stop();
		_lastCraft.clear();
		_lastCraft.putAll(_ingredients);
		
		TimerTask temp = new TimerTask(){
			  public void run(){
				  _isRepeat = true;
				  _ingredients.clear();
				  if (_reConfigingRunes <= 0){
						SocketManager.GAME_SEND_Ea_PACKET(_P, "1");
						sendObject(_data, _P);
						_isRepeat = false;
						_broken = false;
						_break = false;
						Logs.addToFmLog("Personnage "+_P.get_name()+" has finished fmRepeat.");
						this.cancel();
						return;
				  }
			      if(_break || _broken ){
				    	  SocketManager.GAME_SEND_Ea_PACKET(_P, _broken ? "2" : "4");
				    	  sendObject(_data, _P);
						  _isRepeat = false;
						  _broken = false;
						  _break = false;
				    	  this.cancel();
				    	  return;
			      }else {
				    	  _reConfigingRunes -= 1;
				    	  SocketManager.GAME_SEND_EA_PACKET(_P, _reConfigingRunes + "");
						  _ingredients.putAll(_lastCraft);
				    	  doFmCraft();
			      }
			 }
		};
		_P.setActTimerTask(temp);
		Config.repeatFmTimer.schedule(temp, 100, 1000);
	}
	
	
	public void repeat(int time, Characters P) {//Skryn /Return
		_P = P;
		_isRepeat = true;
		_craftTimer.stop();
		_lastCraft.clear();
		_lastCraft.putAll(_ingredients);
		for (int craftRunes = time; craftRunes >= 0; craftRunes--) {
			_ingredients.clear();
			if (_break || _broken) {
				SocketManager.GAME_SEND_Ea_PACKET(_P, _broken ? "2" : "4");
				return;
			}
			SocketManager.GAME_SEND_EA_PACKET(_P, craftRunes + "");
			_ingredients.putAll(_lastCraft);
			craft();
			try {
				Thread.sleep(300);
			} catch (InterruptedException e) {}
		}
		SocketManager.GAME_SEND_Ea_PACKET(_P, "1");
		sendObject(_data, P);
		_isRepeat = false;
	}
	public void breakFM() {
		_broken = true;
	}
	
	private void sendObject(String str, Characters P) {
		if (!str.isEmpty())
			SocketManager.GAME_SEND_EXCHANGE_MOVE_OK_FM(_P, 'O', "+", str);
	}
	
	
/********************************* END FM SYSTEM ****************************************/

		public void startCraft(Characters P) {
