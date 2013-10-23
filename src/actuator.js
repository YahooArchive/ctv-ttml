/*******************************************************************************
this file is the main starting point for the cc module. it sets up the namespace
and defines any shared variables. it also creates lazy pointers for files that
are not required at startup and auto includes files that are required.
*******************************************************************************/
// 
KONtx.cc = (function kontx_cc_singleton() {
	//
	Theme.keys.rootRaw = Theme.keys.root.replace("script://", "");
	//
	KONtx.config.basePath = KONtx.config.basePath.replace("script://", "");
	// TODO: validate this path
	var modulePath = KONtx.config.ccModulePath || (KONtx.config.basePath + "src/cc/");
    // a 2 produces no dumps but more than function calls
    common.debug.level = _production ? 0 : 2;
    // this is handy so we can view more verobse messages from the mediaplayer
    common.debug.MEDIA = (_production && common.debug.level[3]) ? true : false;
	//
	/**************************************************************************/
	//
	var instance = {
		//
		name: "CC",
		//
		version: "0.0.16",
		//
		log: common.debug.log,
		//
		toString: common.toString,
		//
		config: {
            //
            defaultLanguage: "en",
            languageStorageKey: "captionsLanguage",
            activatedStorageKey: "captionsActivated",
            //
			modulePath: modulePath,
			assetPath: modulePath + "assets/" + (screen.width + "x" + screen.height) + "/",
            // this will be auto-included during the load of the actuator file
            // not available in current frameworks
            include: [
                "cc-source-implements"
            ],
            // these will be set up as lazy links during load of the actuator
            // not available in current frameworks
			links: [
				{
					pointer: ["KONtx.media.Captions", "KONtx.media.CaptionsEntry"],
					location: "ads-source-media"
				},
				{
					pointer: ["KONtx.control.CaptionsOverlay"],
					location: "ads-source-controls"
				},
			]
		},
        //
        playerStatesLegend: (function () {
            
            var result = {};
            
            var states = KONtx.mediaplayer.constants.states;
            
            for (var name in states) {
                
                value = states[name];
                
                if (!(value in result)) {
                    
                    result[value] = name;
                    
                }
                
            }
            
            return result;
            
        })(),
        //
        /**********************************************************************/
        // 
        get enabled() {
            
            var state = Boolean(Number(currentProfileData.get(this.config.activatedStorageKey)));
            
common.debug.level[0] && this.log("enabled", "getting cc button activation state: " + state);
            
            return state;
            
        },
        //
        set enabled(bool) {
            
            var state = String(Number(bool));
            
common.debug.level[0] && this.log("enabled", "setting cc button activation state: " + state);
            
            currentProfileData.set(this.config.activatedStorageKey, state);
            
        },
        //
        /**********************************************************************/
        //
        getLanguage: function () {
            
            var lang = currentProfileData.get(this.config.languageStorageKey);
            
common.debug.level[0] && this.log("getLanguage", "getting profile selected captions language: " + lang);
            
            if (!lang) {
                
common.debug.level[0] && this.log("getLanguage", "no captions language found, saving now as: " + lang);
                
                lang = this.config.defaultLanguage;
                
                this.setLanguage(lang);
                
            }
            
            return lang;
            
        },
        //
        setLanguage: function (lang) {
            
common.debug.level[0] && this.log("setLanguage", "setting profile selected captions language: " + lang);
            
            currentProfileData.set(this.config.languageStorageKey, lang);
            
        },
        // 
        getPlayerState: function () {
            
            var playerTVAPI = KONtx.mediaplayer.tvapi;
            
            return playerTVAPI.currentPlayerStatus ? playerTVAPI.currentPlayerStatus : playerTVAPI.currentPlayerState;
            
        },
        //
        getPlayerStates: function () {
            
            return KONtx.mediaplayer.constants.states;
            
        },
        /**
         * @description fetches JSON formatted XML via YQL
         */
        fetch: function (config) {
            
            var xhr;
            
            var url;
            
            if (KONtx.application.isPhysicalNetworkDown()) {
                
                return false;
                
            } else {
                
                url = config.url;
                
                xhr = new XMLHttpRequest();
                
                xhr.open("GET", url, true);
                
                xhr.setRequestHeader("Content-type", "application/xml");
                
                xhr.onreadystatechange = function () {
                    
                    if (xhr.readyState === 4) {
                        
                        KONtx.utility.LoadingOverlay.off();
                        
                        if (xhr.status === 200) {
                            
                            KONtx.application.setNetworkRequestFailed(false);
                            
                            if ("success" in config) {
                                
                                config.success(xhr);
                                
                            }
                            
                        } else {
                            
                            KONtx.application.setNetworkRequestFailed(true);
                            
                            if ("error" in config) {
                                
                                config.error(xhr);
                                
                            }
                            
                        }
                        
                    }
                    
                };
                
                KONtx.utility.LoadingOverlay.on();
                
                xhr.send(null);
                
                return true;
                
            }
            
        }
		//
	};
	//
	return instance;
	// 
})();
