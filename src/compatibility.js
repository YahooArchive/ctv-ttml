/*******************************************************************************
EJF: 2013-04-01:
    
    This is a backport of the minimum required functionality to support certain
    features of closed captioning
    
	* KONtx.media.Captions
	* KONtx.media.CaptionsEntry
	* KONtx.media.Playlist
	* KONtx.media.PlaylistEntry
	* KONtx.control.CaptionsOverlay
	* KONtx.control.MediaTransportOverlay
    
*******************************************************************************/
// < 1.6
_production = (typeof(_production) === "undefined") ? _PRODUCTION : _production;
// < 1.5
if (typeof(common) === "undefined") {
	// 
	common = {};
	// adding this null check because old widgets could be including a platform package that would not load due to
    // security issues(yahooSettings not available to non-yahoo-signed apps) and produce a global platform var which is
    // the object null
	platform = ((typeof(platform) === "undefined") || (platform === null)) ? {} : platform;
	//
	(function common_compatibility_singleton() {
		// 
		platform.config = ("config" in platform) ? platform.config : {};
		//
		common.dump = KONtx.Class.helpers.dump;
		//
		common.merge = KONtx.Class.helpers.merge;
		//
		common.clone = KONtx.Class.helpers.unlink;
		//
		common.bind = function common_bind(source, target) {
			
			return Function.bindTo(target, source);
			
		};
		//
		common.debug = {
			//
			log: (function common_debug_log_singleton() {
				//
				var tag = "[" + (widget.name || "") + "]";
				//
				var method = function common_debug_log() {
					
					!_production && log(tag + " {" + String(this) + "} " + Array.slice(arguments).join(", "));
					
				};
				//
				return method;
				//
			})()
			//
		};
		//
		common.toString = function common_toString() {
			
			var result = ""; 
			
			if (arguments[0]) {
				
				result = String(arguments[0]);
				
			} else {
				
				result = this.ClassName || this.Name || (this.config && this.config.name) || this.name || "Nameless Class Definition";
				
			}
			
			return result;
			
		};
        //
		common.typeOf = function common_typeOf(source) {
			
			if (source == undefined) {
				
				return false;
				
			}
			
			switch (source.constructor) {
				
				case Object:
					
					return "object";
				
				case Array:
					
					return "array";
				
				case Number:
					
					return isFinite(source) ? "number" : false;
				
				case Glow:
					
					return "glow";
				
				case Date:
					
					return "date";
				
				case Function:
					
					return "function";
				
				default:
					
					if (typeof(source.length) === "number") {
						
						if (source.callee) {
							
							return "arguments";
							
						} else if (source.item) {
							
							return "collection";
							
						}
						
					}
					
					if (source.__instanceID || source._ktxID) {
						
						return "instance";
						
					}
					
					if (source.nodeName) {
						
						return source.nodeName;
						
					}
					
			}
			
			return typeof(source);
			
		};
		//
		common.isEmpty = function common_isEmpty(source) {
			
			if (source == null) {
				
				return true;
				
			}
			
			var type = common.typeOf(source);
			
			switch (type) {
				
				case "string":
					
					return (source.length > 0) ? false : true;
				
				case "number":
					
					return false;
				
				case "object":
					
					for (var property in source) {
						
						if (source.hasOwnProperty(property)) {
							
							return false;
							
						}
						
					}
					
					return true;
				
				default:
					
					return type ? false : true;
				
			}
			
		};
        //
        common.String = {};
        //
        common.String.trim = function common_String_trim(source) {
            
            return source.replace(/^\s+|\s+$/g, "");
            
        };
        //
        common.String.cleanWhitespace = function common_String_cleanWhitespace(source) {
            
            return common.String.trim(source.replace(/\s{2,}/g, " "));
            
        };
        //
        common.Object = {};
        //
        common.Object.keys = function common_Object_keys(source) {
            
            var list = [];
            
            for (var key in source) {
                
                list.push(key);
                
            }
            
            return list;
            
        };
        //
        common.Object.from = function common_Object_from(source) {
            
            var item = {};
            
            if (common.isObject(source)) {
                
                item = source;
                
            } else {
                
                item[source] = arguments[1];
                
            }
            
            return item;
            
        };
        //
        common.isObject = function common_isObject(source) {
            
            return common.typeOf(source) === "object";
            
        };
        //
        common.toObject = function common_toObject() {
            
            return common.Object.from.apply(false, arguments);
            
        };
        //
        common.manifest = (function common_manifest_singleton() {
            //
            var instance = {
                //
                stack: {},
                //
                add: function common_manifest_add() {
                    
                    var run = 1;
                    
                    switch (run) {
                        
                        case 0:
                            
                            if (typeof(arguments[0]) === "string") {
                                
                                arguments[0] = common.toObject(arguments[0], arguments[1]);
                                
                                arguments[1] = "";
                                
                            }
                            
                            for (var key in arguments[0]) {
                                
                                var result = null;
                                
                                var file = null;
                                
                                var value = arguments[0][key];
                                
                                var path = arguments[1];
                                
                                if (value) {
                                    
                                    if (typeof(value) === "string") {
                                        
                                        // filename, normal path/use-case
                                        result = (path || "") + value;
                                        
                                    } else {
                                        
                                        // config
                                        if ("file" in value) {
                                            
                                            file = value.file;
                                            
                                            value.file = (path || "") + file;
                                            
                                        }
                                        
                                        result = value;
                                        
                                    }
                                    
                                    if (result) {
                                        
                                        this.stack[key] = result;
                                        
                                    }
                                    
                                }
                                
                            }
                            
                            break;
                        
                        case 1:
                            
                            if (typeof(arguments[0]) === "string") {
                                
                                this.stack[arguments[0]] = arguments[1];
                                
                            } else {
                                
                                for (var i in arguments[0]) {
                                    
                                    if (arguments.length > 1) {
                                        
                                        if (typeof(arguments[0][i]) === "string") {
                                            
                                            arguments[0][i] = arguments[1] + arguments[0][i];
                                            
                                        } else {
                                            
                                            arguments[0][i].file = arguments[1] + arguments[0][i].file;
                                            
                                        }
                                        
                                    }
                                    
                                    this.stack[i] = arguments[0][i];
                                    
                                }
                                
                            }
                            
                            break;
                        
                    }
                    
                },
                //
                get: function common_manifest_get(entry) {
                    
                    return (entry && (entry in this.stack)) ? this.stack[entry] : false;
                    
                }
                //
            };
            //
            return instance;
        })();
        //
	})();
	//
}
// < 1.7
if (!("level" in common.debug)) {
    
    (function common_debug_level() {
        
        var logLevel = [_production ? false : true];
        
        common.debug.__defineSetter__("level", function (level) {
            
            logLevel = [];
            
            for (var i = 0; i <= Number(level); i++) {
                logLevel[i] = true;
            }
            
        });
        
        common.debug.__defineGetter__("level", function () {
            
            return logLevel;
            
        });
        
    })();
    
    common.debug.level = 2;
    
}
// < 1.6
if (!("Element" in common)) {
	//
	common.Element = {};
	//
	common.Element.getBounds = function (source, absolute) {
		
		var convertor = absolute ? "convertPointToWindow" : "convertPointToParent";
		
		var element = source.element;
		
		var upper = element[convertor](0, 0);
		
		var lower = element[convertor](element.width, element.height);
		
		return {
			width: element.width,
			height: element.height,
			top: upper.y,
			right: lower.x,
			bottom: lower.y,
			left: upper.x
		};
		
	};
	//
}
// < 1.5
if (!("getViewConfig" in KONtx.application)) {
	//
	KONtx.application.getViewConfig = function () {
		
		return false;
		
	}
	//
}
// < 1.5
if (!("viewTypes" in KONtx.application)) {
	//
	KONtx.application.viewTypes = {
		"SNIPPETS": "snippet",
		"SNIPPET": "snippet",
		"SNIPPET-ANCHOR": "snippet",
		"SIDEBAR": "sidebar",
		"SIDEBAR-ENTRY": "sidebar",
		"SIDE_BAR": "sidebar",
		"FULLSCREEN": "fullscreen",
		"FULL_SCREEN": "fullscreen",
		"FAT_TRAY": "fat-tray",
		"SKINNY_TRAY": "skinny-tray"
	};
	//
}
// < 1.4
if (!("isPhysicalNetworkDown" in KONtx.application)) {
    
    KONtx.application.isPhysicalNetworkDown = function () {
        
        return (typeof(KONtx.application.getNetworkDownStatus) == "function") ? KONtx.application.getNetworkDownStatus() : KONtx.application.getNetworkDownStatus;
        
    };
    
}
// < 1.3.10
if (!("getDefaultViewportBounds" in KONtx.mediaplayer)) {
	//
	KONtx.mediaplayer.getDefaultViewportBounds = function () {
		return {
			x: 0,
			y: 0,
			width: 1920,
			height: 1080
		};
	};
	//
}
