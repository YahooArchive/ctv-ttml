/***********************************************************************************************************************
Copyright (c) 2013, Yahoo.
All rights reserved.

Redistribution and use of this software in source and binary forms,
with or without modification, are permitted provided that the following
conditions are met:

* Redistributions of source code must retain the above
  copyright notice, this list of conditions and the
  following disclaimer.

* Redistributions in binary form must reproduce the above
  copyright notice, this list of conditions and the
  following disclaimer in the documentation and/or other
  materials provided with the distribution.

* Neither the name of Yahoo nor the names of its
  contributors may be used to endorse or promote products
  derived from this software without specific prior
  written permission of Yahoo.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
***********************************************************************************************************************/
// 
KONtx.cc = (function kontx_cc_singleton() {
	//
	Theme.keys.rootRaw = Theme.keys.root.replace("script://", "");
	//
	KONtx.config.basePath = KONtx.config.basePath.replace("script://", "");
    // a 2 produces no dumps but more than function calls
    common.debug.level = _production ? 0 : 1;
    // this is handy so we can view more verobse messages from the mediaplayer
    common.debug.MEDIA = (_production && common.debug.level[3]) ? true : false;
	//
	/******************************************************************************************************************/
	//
	var rendererType = "";
	//
	var languageStorageKey = "captionsLanguage";
	//
	var activatedStorageKey = "captionsActivated";
	//
	var instance = {
		//
		name: "CC",
		//
		version: "0.0.26",
		//
		log: common.debug.log,
		//
		toString: common.toString,
		//
		config: {
            // this is a constant that we need to keep track of because it is not exposed by the engine
			// it is currently handing off the TVInput class
			SUPPORT_CC: 2,
            // default language
            defaultLanguage: "en",
            // used to determine if the module is being loaded locally from an app or globally from the framework
			modulePath: KONtx.config.ccModulePath,
            // location of module images
			assetPath: KONtx.config.ccModulePath + "assets/" + (screen.width + "x" + screen.height) + "/",
			// these values determine if the hardware fork for the renderer is used or not
			rendererTypes: ["auto", "yahoo"],
			// the default renderer path
			rendererDefaultIndex: 0,
            // the yql entry point
			yqlHost: "http://ctv.yql.yahooapis.com/v1/public/yql",
            // the query used to normalize the ttml document
			yqlQuery: "select * from ctv.ttml.normalize where url='%1'",
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
			],
            // setting this will shave off the specified number of seconds from the begin and end times
            // this will allow the arbitrary testing of content from any point in time
            // example: to test entries that start at 20 minutes use (60 * 20)
            // common.debug.level must be >= 2
            debug_timeSignatureOffset: common.debug.level[2] ? 60 : null,
            // a ttml document uri that will be force loaded instead of the uri provided by the video
            // common.debug.level must be >= 2
            debug_ttmlLocation: common.debug.level[2] ? "" : null,
			//
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
        /**************************************************************************************************************/
        //
		get renderer() {
			
			var type = rendererType;
			
			// check for SDK/ADK/WDK builds and force "yahoo"
			if (platform.build.type == "sim") {
				
				type = this.config.rendererTypes[1];
				
common.debug.level[2] && this.log("renderer", "detected build type \"" + platform.build.type + "\" so forcing (KONtx.cc.renderer == " + type + ")");
				
			}
			
			return type;
			
		},
		//
		set renderer(type) {
			
			rendererType = (type && (this.config.rendererTypes.indexOf(type) != -1)) ? type : this.config.rendererTypes[this.config.rendererDefaultIndex];
			
		},
		//
		useHardware: function () {
			
			var hardwareSupportAvailable = false;
			
			var activeInput = this.getActiveInput();
			
			if (activeInput) {
				
				if ("doesSupport" in activeInput) {
					
					hardwareSupportAvailable = activeInput.doesSupport(this.config.SUPPORT_CC);
					
				}
				
			}
common.debug.level[3] && this.log("CaptionsOverlay", "useHardware", "hardwareSupportAvailable", String(hardwareSupportAvailable));
			
			var useHardwareRenderer = (this.renderer == "auto") ? true : false;
common.debug.level[3] && this.log("CaptionsOverlay", "useHardware", "useHardwareRenderer", String(useHardwareRenderer));
			
			if (hardwareSupportAvailable && useHardwareRenderer) {
				
				return true;
				
			} else {
				
				return false;
				
			}
			
		},
		//
		getActiveInput: function () {
			
			return KONtx.mediaplayer.tvapi.activeInput;
			
		},
		// 
        get enabled() {
            
            var state = Boolean(Number(currentProfileData.get(activatedStorageKey)));
            
//common.debug.level[3] && this.log("enabled", "getting cc button activation state: " + state);
            
            return state;
            
        },
        //
        set enabled(bool) {
            
            var state = String(Number(bool));
            
//common.debug.level[3] && this.log("enabled", "setting cc button activation state: " + state);
            
            currentProfileData.set(activatedStorageKey, state);
            
        },
        //
        /**************************************************************************************************************/
        //
        getLanguage: function () {
            
            var lang = currentProfileData.get(languageStorageKey);
            
common.debug.level[0] && this.log("getLanguage", "getting profile selected captions language: " + lang);
            
            if (!lang) {
                
                lang = this.config.defaultLanguage;
                
common.debug.level[0] && this.log("getLanguage", "no captions language found, saving now as: " + lang);
                
                this.setLanguage(lang);
                
            }
            
            return lang;
            
        },
        //
        setLanguage: function (lang) {
            
common.debug.level[0] && this.log("setLanguage", "setting profile selected captions language: " + lang);
            
            currentProfileData.set(languageStorageKey, lang);
            
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
	/******************************************************************************************************************/
	// set default renderer path based on a global
	instance.renderer = KONtx.config.ccRendererType;
	//
	return instance;
	// 
})();
