/*******************************************************************************

*******************************************************************************/
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
//
/*******************************************************************************

*******************************************************************************/
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
        
        this.onActivateClosedCaption.subscribeTo(this, "onActivateClosedCaption", this);
        
        this.onDeactivateClosedCaption.subscribeTo(this, "onDeactivateClosedCaption", this);
        
        this.onAppendClosedCaption.subscribeTo(this, "onAppend", this);
        
    },
    //
    onAppendClosedCaption: function (event) {
        
        this.onUpdateClosedCaption.subscribeTo(this.getView(), "onUpdateView", this);
        
    },
    //
    onUpdateClosedCaption: function (event) {
        
        this.fire(KONtx.cc.enabled ? "onActivateClosedCaption" : "onDeactivateClosedCaption");
        
    },
    //
    onActivateClosedCaption: function (event) {
        
        if (this.config.captionsButton && this._controls.captionsbutton) {
            
            if (KONtx.cc.enabled) {
                
                this._controls.captionsbutton.fire("onActivate");
                
            }
            
        }
        
    },
    //
    onDeactivateClosedCaption: function (event) {
        
        if (this.config.captionsButton && this._controls.captionsbutton) {
            
            this._controls.captionsbutton.fire("onDeactivate");
            
        }
        
    },
    //
    _onSourceUpdated: function (event) {
        
        this.parent(event);
        
        switch (event.type) {
            
            case "onPlayPlaylistEntry":
common.debug.level[5] && KONtx.cc.log("MediaTransportOverlay", "onSourceUpdated", "onPlayPlaylistEntry", "event.payload", common.dump(event.payload, 3));
                
                if (this.config.captionsButton && this._controls.captionsbutton) {
                    
                    var captionsFound = event.payload.player.media.currentEntry.getCaptions();
                    
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "onSourceUpdated", "onPlayPlaylistEntry", "captions " + (captionsFound ? "" : "not ") + "found in playlist, " + (captionsFound ? "en" : "dis") + "abling the CC button");
                    
                    if (captionsFound) {
                        
                        this._controls.captionsbutton.setDisabled(false);
                        
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "onSourceUpdated", "onPlayPlaylistEntry", "profile user has " + (KONtx.cc.enabled ? "" : "not ") + "activated cc");
                          
                    } else {
                        
                        this._controls.captionsbutton.setDisabled(true);
                       
                    }
                    //need to fire it even if there are no captions, otherwise overlay may have old captions
                    if (KONtx.cc.enabled) {
                        this.fire("onActivateClosedCaption");   
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
                onCaptionListRequest: function onCaptionListRequest(event) {
                    
                    // phase 2 implementation
                    
                },
                onDeactivate: function onDeactivate(event) {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "captionsbutton", "deactivating captions");
                    
                    this.activated = false;
                    
                    KONtx.cc.enabled = this.activated;
                    
                    this.content.setSource(this.sources.normalSrc);
                    
                    if (KONtx.mediaplayer.playlist.currentEntry) {
                        
                        var captions = event.payload.captions || KONtx.mediaplayer.playlist.currentEntry.getCaptions();
                        
                        var lang = event.payload.lang || KONtx.cc.getLanguage();
                        
                        if (("_overlay" in this.owner) && ("captions" in this.owner._overlay)) {
                            
                            this.owner._overlay.captions.fire("onDeactivate", {
                                url: captions ? captions.getEntryByLanguage(lang).url : null,
                                lang: lang
                            });
                            
                        }
                        
                    }
                    
                },
                onActivate: function onActivate(event) {
common.debug.level[1] && KONtx.cc.log("MediaTransportOverlay", "captionsbutton", "activating captions");
                    
                    this.activated = true;
                    
                    KONtx.cc.enabled = this.activated;
                    
                    this.content.setSource(this.sources.activeSrc);
                    
                    if (KONtx.mediaplayer.playlist.currentEntry) {
                        
                        var captions = event.payload.captions || KONtx.mediaplayer.playlist.currentEntry.getCaptions();
                        
                        var lang = event.payload.lang || KONtx.cc.getLanguage();
                        
                        if (captions) {
                            
                            // setup CaptionsOverlay
                            if (!("captions" in this.owner._overlay)) {
                                
                                this.owner._overlay.captions = new KONtx.control.CaptionsOverlay().appendTo(this.getView());
                                
                            }
                            
                            this.owner._overlay.captions.fire("onActivate", {
                                url: captions.getEntryByLanguage(lang).url,
                                lang: lang
                            });
                            
                        } else {
                        	//cc is activated but the video does not have cc
                        	if("captions" in this.owner._overlay) {
                        		this.owner._overlay.captions.fire("onDeactivate");
                        		delete this.owner._overlay.captions;
                        	}
                        }
                        
                    }
                    
                }, 
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
                    
                }
            }
        }).appendTo(this);
        
    }
    //
});    
//
