/*******************************************************************************
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
*******************************************************************************/

/***********************************************************************************************************************

Testing widevine playlist entry support
	KONtx.media.PlaylistEntry.prototype.initialize
	p=new KONtx.media.WidevinePlaylistEntry()
	KONtx.media.WidevinePlaylistEntry.prototype.initialize
	s=p._streamsGetter()
	
	// check addURL method
	p=new KONtx.media.WidevinePlaylistEntry()
	p.addURL
	
	KONtx.mediaplayer.playlist.currentEntry.getCaptions()
	
***********************************************************************************************************************/
// protect the framework playlist
(function kontx_media_playlist_singleton_protector() {
    
    var playlist = KONtx.media.Playlist;
    
    if (!("__getter" in playlist)) {
        
        delete KONtx.media.Playlist;
        
        KONtx.media.__defineGetter__("Playlist", function () {
            return playlist;
        });
        
        KONtx.media.__defineSetter__("Playlist", function () {
			common.fire("onWarning", {
				name: "Attempted overload",
				message: "someone is trying to overload the KONtx.media.Playlist object from within the CC module"
			});
        });
        
    }
    
})();
// 
KONtx.media.Playlist.implement({
    //
    addEntryByURL: function (url, bitrate, startIndex, captions) {
		
        captions = captions || null;
        
        this._isFiltered = false;
        
        var entry = new KONtx.media.PlaylistEntry({
            url: url,
            bitrate: bitrate,
            startIndex: startIndex,
            captions: captions
        });
        
        this.addEntries([entry]);
        
        return this;
    }
    //
});
// protect the framework playlistEntry
(function kontx_media_playlistEntry_singleton_protector() {
    
    var playlistEntry = KONtx.media.PlaylistEntry;
    
    if (!("__getter" in playlistEntry)) {
        
        delete KONtx.media.PlaylistEntry;
        
        KONtx.media.__defineGetter__("PlaylistEntry", function () {
            return playlistEntry;
        });
        
        KONtx.media.__defineSetter__("PlaylistEntry", function () {
			common.fire("onWarning", {
				name: "Attempted overload",
				message: "someone is trying to overload the KONtx.media.PlaylistEntry object from within the CC module"
			});
        });
        
    }
    
})();
//
KONtx.media.PlaylistEntry.implement({
    //
    initialize: function () {
        
        this.__startIndex = this.config.startIndex;
        
        this.__defineGetter__("startIndex", function () {
            return this.__startIndex;
        });
        
        this.__defineSetter__("startIndex", function (value) {
            this.__startIndex = Number(value);
        });
        
        this._streams = [];
        
common.debug.level[3] && KONtx.cc.log("PlaylistEntry config", common.dump(this.config));
        
        if (this.config.url) {
            
            this._streams.push({ url: this.config.url, bitrate: this.config.bitrate, captions: (this.config.captions || null) });
            
        }
        
        if (this.config.streams instanceof Array) {
            
            this.config.streams.forEach(function (stream) {
                
                if (stream.url) {
                    
                    this._streams.push({ url: stream.url, bitrate: (stream.bitrate || this.config.bitrate), captions: (stream.captions || null) });
                    
                } else {
                    
                    throw new Error("Invalid stream: must at minimum provide a URL");
                    
                }
                
            }, this);
            
        }
        
        this._isSorted = false;
        
        // intentionally no setter here, use helpers below
        this.__defineGetter__("streams", this._streamsGetter);
        
    },
    //
	addURL: function (url, bitrate, captions) {
        
        captions = captions || null;
        
        if (url) {
            
            this._isSorted = false;
            
            this._streams.push({ url: url, bitrate: bitrate, captions: captions });
            
        } else {
            
            throw new Error("Invalid stream: must at minimum provide a URL");
            
        }
        
        return this;
        
    },
    //
    getCaptions: function () {
        
        var captions = null;
        
        if (("captions" in this._streams[0]) && this._streams[0].captions) {
            
            captions = this._streams[0].captions;
            
        }
        
        return captions;
        
    }
    //
});
// check for widevine support and update methods
if ("WidevinePlaylistEntry" in KONtx.media) {	
	
	(function kontx_media_widevinePlaylistEntry_singleton_protector() {
		
		var playlistEntry = KONtx.media.WidevinePlaylistEntry;
		
		if (!("__getter" in playlistEntry)) {
			
			delete KONtx.media.WidevinePlaylistEntry;
			
			KONtx.media.__defineGetter__("WidevinePlaylistEntry", function () {
				
				return playlistEntry;
				
			});
			
			KONtx.media.__defineSetter__("WidevinePlaylistEntry", function () {
				
common.fire("onWarning", {
	name: "Attempted overload",
	message: "someone is trying to overload the KONtx.media.WidevinePlaylistEntry object from within the CC module"
});
				
			});
			
		}
		
	})();
	//
	KONtx.media.WidevinePlaylistEntry.implement({
		//
		initialize: function () {
			
			this.__startIndex = this.config.startIndex;
			
			this.__defineGetter__("startIndex", function () {
				return this.__startIndex;
			});
			
			this.__defineSetter__("startIndex", function (value) {
				this.__startIndex = Number(value);
			});
			
			this._streams = [];
			
common.debug.level[3] && KONtx.cc.log("WidevinePlaylistEntry config", common.dump(this.config));
			
			if (this.config.url) {
				
				this._streams.push({ url: this.config.url, bitrate: this.config.bitrate, captions: (this.config.captions || null) });
				
			}
			
			if (this.config.streams instanceof Array) {
				
				this.config.streams.forEach(function (stream) {
					
					if (stream.url) {
						
						this._streams.push({ url: stream.url, bitrate: (stream.bitrate || this.config.bitrate), captions: (stream.captions || null) });
						
					} else {
						
						throw new Error("Invalid stream: must at minimum provide a URL");
						
					}
					
				}, this);
				
			}
			
			this._isSorted = false;
			
			// intentionally no setter here, use helpers below
			this.__defineGetter__("streams", this._streamsGetter);
	  
			// above this comment should be identical to standard playlistEntry
	
			this.url = this.config.url;
	
			this.__defineGetter__('options', function() {
				return this.__options;
			});
	
			this.__defineSetter__('options', function(value) {
				if(!value || value instanceof KONtx.media.drm.WidevineOptions) {
					this.__options = value;
				} else {
					throw new Error("Invalid options value. Must be an instance of KONtx.media.drm.WidevineOptions");
				}
			});
	
			this.options = this.config.options;
		},
		//
		addURL: function (url, bitrate, captions) {
			
			captions = captions || null;
			
			if (url) {
				
				this._isSorted = false;
				
				this._streams.push({ url: url, bitrate: bitrate, captions: captions });
				
			} else {
				
				throw new Error("Invalid stream: must at minimum provide a URL");
				
			}
			
			return this;
			
		},
		//
		getCaptions: function () {
			
			var captions = null;
			
			if (("captions" in this._streams[0]) && this._streams[0].captions) {
				
				captions = this._streams[0].captions;
				
			}
			
			return captions;
			
		},
		//
		_streamsGetter: function () {
			return [{url: this.url, bitrate: -1, captions: this.getCaptions()}];
		},
		//
	});
	//
}
//
/***********************************************************************************************************************

***********************************************************************************************************************/
// 
KONtx.control.MediaTransportOverlay.implement({
    //
    config: {
        captionsButton: true
    },
    //
    initialize: function () {
        
        this.parent();
        
        this._overlay = {};
        
        Theme.storage.add(this.ClassName + "CaptionsButtonImage", {
            normalSrc: common.manifest.get("cc-asset-button-caption-normal").file,
            activeSrc: common.manifest.get("cc-asset-button-caption-active").file
        });
        
		this._onAppendedCC.subscribeTo(this, "onAppend", this);
		
    },
	//
	_onAppendedCC: function () {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "_onAppendedCC");
		
		this._registerViewHandlersCC();
		
	},
	//
	_registerViewHandlersCC: function () {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "_registerViewHandlersCC");
		
		if (!this._boundViewHandlerCC) {
			
			this._boundViewHandlerCC = this._viewEventHandlerCC.subscribeTo(this.getView(), ["onUpdateView", "onSelectView", "onUnselectView", "onHideView"], this);
			
		}
		
	},
	//
	_unregisterViewHandlersCC: function () {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "_unregisterViewHandlersCC");
		
		if (this._boundViewHandlerCC) {
			
			this._boundViewHandlerCC.unsubscribeFrom(this.getView(), ["onUpdateView", "onSelectView", "onUnselectView", "onHideView"], this);
			
			this._boundViewHandlerCC = false;
			
		}
		
	},
	//
	_registerHardwareChangeHandler: function () {
common.debug.level[3] && KONtx.cc.log("MediaTransportOverlay", "_registerHardwareChangeHandler");
		
		var engineInterface = KONtx.cc.engineInterface;
		
		if (engineInterface) {
			
			engineInterface.onStateChanged = common.bind(function () {
				
				var button = ("captionsbutton" in this._controls) ? this._controls.captionsbutton : null;
				
				var engineInterface = KONtx.cc.engineInterface;
				
				if (engineInterface && button) {
					
					if (engineInterface.status == true) {
						
						if (!button.activated) {
							
							if ("currentEntry" in KONtx.mediaplayer.playlist) {
								
								button.fire("onActivate", {
									captions: KONtx.mediaplayer.playlist.currentEntry.getCaptions(),
									lang: KONtx.cc.getLanguage(),
								});
								
							}
							
						}
						
					} else {
						
						if (button.activated) {
							
							button.fire("onDeactivate");
							
						}
						
					}
					
				}
				
			}, this);
			
		}
		
	},
	//
	_unregisterHardwareChangeHandler: function () {
common.debug.level[3] && KONtx.cc.log("MediaTransportOverlay", "_unregisterHardwareChangeHandler");
		
		var engineInterface = KONtx.cc.engineInterface;
		
		if (engineInterface) {
			
			engineInterface.onStateChanged = null;
			
		}
		
	},
    //
	_viewEventHandlerCC: function (event) {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "_viewEventHandlerCC", "event.type", event.type);
		
		switch (event.type) {
			
			case "onUpdateView":
				
				this._registerHardwareChangeHandler();
				
				break;
				
			case "onSelectView":
				
				if ("currentEntry" in KONtx.mediaplayer.playlist) {
					
					this._overlayActivate(KONtx.mediaplayer.playlist.currentEntry.getCaptions(), KONtx.cc.getLanguage());
					
				}
				
				break;
				
			case "onUnselectView":
				
				this._overlayDeactivate();
				
				break;
				
			case "onHideView":
				
				this._unregisterHardwareChangeHandler();
				
				this._overlayDeactivate(true);
				
				break;
				
		}
		
	},
	//
	_overlayActivate: function (captions, lang) {
		
		if (KONtx.cc.enabled) {
			
			if (captions && lang) {
				
				// setup CaptionsOverlay
				if (!("captions" in this._overlay)) {
					
					this._overlay.captions = new KONtx.control.CaptionsOverlay().appendTo(this.getView());
					
				}
				
				if ("captions" in this._overlay) {
					
					this._overlay.captions.fire("onActivate", {
						url: captions.getEntryByLanguage(lang).url,
						lang: lang
					});
					
				}
				
			}
			
		}
		
	},
	//
	_overlayDeactivate: function (purge) {
		
		if ("captions" in this._overlay) {
			
			this._overlay.captions.fire("onDeactivate");
			
			if (purge) {
				
				// remove node
				this._overlay.captions.element.removeFromParentNode();
				
				// remove pointer
				delete this._overlay.captions;
				
			}
			
		}
		
	},
	//
    _onSourceUpdated: function (event) {
        
        this.parent(event);
        
        switch (event.type) {
            
            case "onPlayPlaylistEntry":
common.debug.level[5] && KONtx.cc.log("MediaTransportOverlay", "onSourceUpdated", "onPlayPlaylistEntry", "event.payload", common.dump(event.payload, 3));
                
                if (this.config.captionsButton && this._controls.captionsbutton) {
					
                    var captions = event.payload.player.media.currentEntry.getCaptions();
					
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "onSourceUpdated", "onPlayPlaylistEntry", "captions " + (captions ? "" : "not ") + "found in playlist, " + (captions ? "en" : "dis") + "abling the CC button");
                    
					var button = this._controls.captionsbutton;
					
                    if (captions) {
						
						button.setDisabled(false);
						
						if (KONtx.cc.enabled) {
							
							button.fire("onActivate", {
								captions: captions,
								lang: KONtx.cc.getLanguage(),
							});
							
						}
						
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "onSourceUpdated", "onPlayPlaylistEntry", "profile user has " + (KONtx.cc.enabled ? "" : "not ") + "activated cc");
                        
                    } else {
						
						button.setDisabled(true);
						
                    }
					
                }
                
                break;
                
        }
        
    },
    //
    _createButtons: function () {
        
        this.parent();
        
        if (this.config.captionsButton) {
            
            // account for any already loaded CC module
            // if it exists then we need to unload that control to add this new one
            if ("captionsbutton" in this._controls) {
                
                this._controls.captionsbutton.suicide();
                
                this._leftButtonCount--;
                
            }
            
            this._createCaptionsButton();
            
            this._leftButtonCount++;
            
        }
        
    },
    //
    _createCaptionsButton: function () {
common.debug.level[3] && KONtx.cc.log("MediaTransportOverlay", "_createCaptionsButton");
        
        var themeButton = this.ClassName + "Button";
        
        this._controls.captionsbutton = new KONtx.control.Button({
            ClassName: themeButton,
            disabled: true,
            styles: {
                hOffset: this._leftButtonCount * (Theme.storage.get(themeButton).styles.width + 1)
            },
            initialize: function () {
                
                this.activated = false;
                
                this.sources = Theme.storage.get(KONtx.control.MediaTransportOverlay.prototype.ClassName + "CaptionsButtonImage");
                
                this.content = new KONtx.element.Image({
                    src: this.sources[KONtx.cc.enabled ? "activeSrc" : "normalSrc"]
                }).appendTo(this);
				
            },
            events: {
				// button press capture to toggle on/off cc
                onSelect: function onSelect(event) {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "captionsbutton", "selecting captions button");
                    
                    var captions = KONtx.mediaplayer.playlist.currentEntry.getCaptions();
                    
                    var lang = KONtx.cc.getLanguage();
                    
                    if (captions) {
                        
                        var buttonPressResult = this.owner.fire("onTransportButtonPress", {
                            button: "captions",
                            action: "select",
                            payload: {
                                captions: captions,
                                buttonActivated: !this.activated,
                                buttonDisabled: !this.disabled,
                                multiLanguage: captions.isMultiLanguage,
                                lang: lang
                            }
                        });
                        
                        if (buttonPressResult) {
                            
                            if (captions.isMultiLanguage) {
                                // multiple language entry
                                
                                this.fire("onCaptionListRequest", {
                                    captions: captions,
                                    buttonActivated: !this.activated,
                                    buttonDisabled: !this.disabled,
                                    multiLanguage: captions.isMultiLanguage,
                                    lang: lang
                                });
                                
                            } else {
                                // single language entry
                                
                                this.fire((this.activated ? "onDeactivate" : "onActivate"), {
                                    captions: captions,
                                    lang: lang
                                });
                                
                            }
                            
                        }
                        
                    }
                    
                },
				onActivate: function onActivate(event) {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "captionsbutton", "onActivate");
                    
					this.activated = true;
                    
                    KONtx.cc.enabled = this.activated;
                    
                    this.content.setSource(this.sources.activeSrc);
                    
					var captions = event.payload.captions;
					
					var lang = event.payload.lang;
					
					var owner = this.owner;
					
					var view = this.getView();
					
					if (captions) {
						
						owner._overlayActivate(captions, lang);
						
					} else {
						
						// cc is activated but the video does not have cc
						owner._overlayDeactivate(true);
						
					}
                    
                }, 
				onDeactivate: function onDeactivate(event) {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "captionsbutton", "onDeactivate");
                    
                    this.activated = false;
                    
                    KONtx.cc.enabled = this.activated;
                    
                    this.content.setSource(this.sources.normalSrc);
                    
					var owner = this.owner;
					
					owner._overlayDeactivate(true);
					
                },
                onCaptionListRequest: function onCaptionListRequest(event) {
                    
                    // phase 2 implementation
                    
                },
            }
        }).appendTo(this);
		
    }
    //
});    
