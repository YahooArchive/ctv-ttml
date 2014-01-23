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
delete KONtx.control.CaptionsOverlay;
/*
This object does a few things.
1) it responds to global activate/deactivate commands
2) it responds to keys on the transport control
3) it responds to timeindex changes on the mediaplayer
4) it consumes the ttml json payload
5) it renders the ttml content

onDataReceived
onPlayerTimeIndexChange

*/
//
KONtx.control.CaptionsOverlay = new KONtx.Class({
    ClassName: "CaptionsOverlay",
	Extends: KONtx.element.Core,
    // defaults
    config: {
        //
        styles: {
            width: screen.width,
            height: screen.height
        },
        // initial(default) fontSize based on TTML spec = 6.67% of video height
        fontSize: Math.floor(screen.height * 0.0667),
        //
        defaultRegionId: "anonymous",
        // all new state vars need to be added here
        state: {
            nextInterval: 0,
            nextCaptionIndex: 0,
            regionsActive: [],
			hardwareStateSet: false,
        },
        data: {
            // used as an id to determine if we need to reparse
            // is the url passed in when activating captions
            id: "",
            // flag for determining if the parser routine has completed
            // is set after the onDataReceived routine completes
            fulfilled: false,
            // a pointer to the caption object for the current entry in the current playlist
            captions: {},
            // the normalized head of the ttml document
            head: {},
            // the normalized body of the ttml document
            body: [],
            // the normailzed settings which live on the root tt node
            config: {}
        }
    },
    // runtime
    state: {},
	//
	useHardware: null,
    // storage
    data: {},
    // nodes
    regions: {},
    // 
    /******************************************************************************************************************/
    // 
	initialize: function () {
        
		this.parent();
        
        // events we want to fire but are not wired up to this object
        this.onActivate.subscribeTo(this, "onActivate", this);
        
        this.onDeactivate.subscribeTo(this, "onDeactivate", this);
        
		// this wires up the handler to receive messages when other controls call...
		// co = new KONtx.cc.CaptionsOverlay
		// co.fire("onDataReceived")
        this.onDataReceived.subscribeTo(this, "onDataReceived", this);
        
		// defaults applied to containing frame
		this.element.style.fontSize = this.config.fontSize;
		this.element.style.color = "#FFF";
		
	},
    //
	//-- preprocessing -------------------------------------------------------------------------------------------------
	//
    processConfig: function (data) {
        
        var config = {};
        
        if (data) {
            
            config.frameRate = (("frameRate" in data) && Number(data.frameRate)) ? Number(data.frameRate) : -1;
            
        } else {
            
            config = {};
            
        }
        
        return config;
        
    },
    //
    processHead: function (data) {
        
        var head = {styling: {style: {}}, layout: {region: {}}};
        
        head.styling.style = this.structureList(data.head, "styling.style");
        
        head.layout.region = this.structureList(data.head, "layout.region");
        
        if (common.isEmpty(head.layout.region)) {
            
            head.layout.region[this.config.defaultRegionId] = {};
            
        }
        
        return head;
        
    },
    //
    processBody: function (data) {
        
        var body = [];
        
        if (data && data.body && data.body.div && data.body.div.p && data.body.div.p.length) {
            
            var container = data.body;
            
            var content = container.div.p;
            
            var defaultRegion = ("region" in container) ? container.region : this.config.defaultRegionId;
            
            var defaultStyle = ("style" in container) ? container.style : null;
            
            var index = 0;
            
            var entry = null;
            
            var entries = [];
            
            for (index = 0; index < content.length; index++) {
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "processBody", "processing entry " + (index + 1) + " of " + content.length);
                
                entry = content[index];
                
                entry.begin = this.convertTimeSignature(entry.begin);
                
                entry.end = this.convertTimeSignature(entry.end);
                
                // if no region is specified, supply a default
                entry.region = ("region" in entry) ? entry.region : defaultRegion;
                
                entry.styles = this.populateEntryStyles(entry, defaultStyle);
                
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "processBody", "entry[" + index + "]", common.dump(entry,5));
                
                entries.push(entry);
                
            }
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "processBody", "completed processing all " + content.length + " entries");
                
            body = entries;
            
        }  
        
        return body;
        
    },
	//
	//-- preprocessing helpers -----------------------------------------------------------------------------------------
	//
    structureList: function (data, namespace) {
        
        var result = {};
        
        if (data) {
            
            var list = namespace.split(".");
            var parent = data[list[0]];
            var node = {};
            var entry = [];
            var index = 0;
            var item = {};
            var items = {};
            
            if (parent) {
                node = parent[list[1]];
                if (node) {
                    // we know we only get a list or a single object
                    entry = (common.typeOf(node) ==  "array") ? node : [node];
                    index = 0;
                    item = {};
                    items = {};
                    
                    for (index = 0; index < entry.length; index++) {
                        item = entry[index];
                        items[item.id] = item;
                        delete item.id;
                    }
                    
                    result = items;
                }
            }
        }
        
        return result;
        
    },
    //
    populateEntryStyles: function (entry, defaultStyle) {
        
        var styles = {};
        
        var regionStyles = {};
        
        var headStyles = {};
        
        var bodyStyles = {};
        
        var originSplit = [];
        
        var extentSplit = [];
        
        // we should also pick up styles from the p tag itself
        
        // pick up styles from the region
        if ("region" in entry) {
            
            if (this.data.head.layout.region) {
                
                if (entry.region in this.data.head.layout.region) {
                    
                    if (this.data.head.styling.style) {
                        
                        if ("style" in this.data.head.layout.region[entry.region]) {
                            
                            if (this.data.head.layout.region[entry.region].style in this.data.head.styling.style) {
                                
                                regionStyles = this.data.head.styling.style[this.data.head.layout.region[entry.region].style];
                                
                            }
                            
                        } else {
                            
                            regionStyles = this.data.head.layout.region[entry.region];
                            
                        }
                        
                    }
                    
                }
                
            }
            
        }
        styles = regionStyles;
        
        // default style coming from the body tag
        if (defaultStyle) {
            
            if (this.data.head.styling.style) {
                
                if (defaultStyle in this.data.head.styling.style) {
                    
                    bodyStyles = this.data.head.styling.style[defaultStyle];
                    
                }
                
            }
            
        }
        styles = common.merge(styles, bodyStyles);
        
        // pick up styles from the document this.data.head
        // if there is a style reference supplied check with the document this.data.head and see if there are any matching
        // styles to merge with this entry
        if ("style" in entry) {
            
            if (this.data.head.styling.style) {
                
                if (entry.style in this.data.head.styling.style) {
                    
                    headStyles = this.data.head.styling.style[entry.style];
                    
                }
                
            }
            
        }
        styles = common.merge(styles, headStyles);
        
        delete entry.style;
        
        // position
        if ("origin" in entry) {
            
            // specific position information
            
            originSplit = entry.origin.split(" ");
            
            styles.hOffset = Math.floor(screen.width * (parseFloat(originSplit[0]) / 100));
            
            styles.vOffset = Math.floor(screen.height * (parseFloat(originSplit[1]) / 100));
            
        } else if ("origin" in styles) {
            
            // specific position information
            
            originSplit = styles.origin.split(" ");
            
            styles.hOffset = Math.floor(screen.width * (parseFloat(originSplit[0]) / 100));
            
            styles.vOffset = Math.floor(screen.height * (parseFloat(originSplit[1]) / 100));
            
            delete styles.origin;
            
        } else {
            
            // no position information provided
            // we can do whatever we want
            
            styles.hAlign = "center";
            
            styles.vAlign = "bottom";
            
            // TODO: this is something we should really adjust dynamically based on visible UI elements that may
            // collide with our text
            styles.vOffset = screen.height - 30;
            
        }
        
        delete entry.origin;
        
        // dimensions
        if ("extent" in entry) {
            
            // specific dimension information
            
            extentSplit = entry.extent.split(" ");
            
            // due to missing support for monospace fonts we end up having a lot
            // of empty space on the right side of every text element. in order
            // to counter this effect we will not set the width specified by the
            // ttml
            //styles.width = Math.ceil(screen.width * (parseFloat(extentSplit[0]) / 100));
            styles.height = Math.ceil(screen.height * (parseFloat(extentSplit[1]) / 100));
            
        } else if ("extent" in styles) {
            
            // specific dimension information
            
            extentSplit = styles.extent.split(" ");
            
            // due to missing support for monospace fonts we end up having a lot
            // of empty space on the right side of every text element. in order
            // to counter this effect we will not set the width specified by the
            // ttml
            //styles.width = Math.ceil(screen.width * (parseFloat(extentSplit[0]) / 100));
            
            styles.height = Math.ceil(screen.height * (parseFloat(extentSplit[1]) / 100));
            
            delete styles.extent;
            
        } else {
            
            // no dimension information provided
            // we can do whatever we want
            
            // x% screen width from left of xOrigin
            // ideally we wouldn't need to set this...
            // however, in cases where the ttml incorrectly uses break tags within the paragraph we cannot
            // correctly determine where the wrap should take place. setting the width keeps long text from
            // clipping and provides a more middle-based interface for the text making it easier for our brains
            // to scan quickly
            styles.width = Math.ceil(screen.width * 0.80);
            
            // y% screen height from top of yOrigin
            // 20% of fontSize gives us a relatively effective lineHeight
            // not setting this allows for scaling multiline text up to N lines
            //styles.height = Math.ceil((styles.fontSize + (styles.fontSize * 0.22)) * 2);
            
            styles.textAlign = "center";
            
            styles.wrap = true;
            
        }
        
        delete entry.extent;
        
        // we need to calculate the fontSize since most styles are supplied in %, which we don't support
        // we will use the base fontSize applied to the containing frame(this.config.fontSize)
        if ("fontSize" in styles) {
            
            if (styles.fontSize[styles.fontSize.length - 1] == "%") {
                
                // this is the best way to accomodate the messed up font %
                // more notes please
                if (("wrapOption" in styles) || !styles.height) {
                    
                    styles.fontSize = Math.floor(this.config.fontSize * (parseFloat(styles.fontSize) / 100));
                    
                } else {
                    
                    styles.fontSize = Math.floor(styles.height * (parseFloat(styles.fontSize) / 100));
                    
                }
                
            }
            
        } else {
            
            styles.fontSize = this.config.fontSize;
            
        }
        
        //
        styles.fontStyle = ("fontStyle" in styles) ? styles.fontStyle : "normal";
		
        // with no padding elements with background colors look akward since they have default top and bottom padding
        // this makes text blocks "look" more consistent and less jarring
        styles.paddingLeft = styles.paddingLeft || 3;
        styles.paddingRight = styles.paddingRight || 3;
        
        return styles;
        
    },
    //
    convertTimeSignature: function (clock) {
        
        var split = clock.split(":");
        
        /*
        to deal with fractional timing...
        because we cannot provide a granular timing interval to the millisecond the policy will be to delay
            rather than pre-empt
        we will check to see if a frameRate is supplied in the TTML
            if so then we will assume that frame-rate timing is supplied
            if not then we will assume that clock-time timing is supplied
        for converting frame-rate to fractional timing we will...
            first devide the segment by the frameRate
            next round the result up to the next whole number
            in this way the following time:
                00:15:43:09
            ... with a frameRate modifier of 30 would yield a value of:
                00:15:44
            Basically any value other than "00" would cause the timing to be delayed by:
                (1 - (FR / FRM))seconds
        for converting clock-time to fractional timing we will...
            round the segment up to the next whole number
            in this way the following time:
                00:15:43:017
            ... would yield a value of:
                00:15:44
            Basically any value other than "00" would cause the timing to be delayed by:
                (1 - (MSS / 1000))seconds
            
        */
        
        if (split[2].indexOf(".") != -1) {
            secondSplit = split[2].split(".");
            split[2] = secondSplit[0];
            split[3] = secondSplit[1];
        }
        
        var fraction = 0;
        if (split[3]) {
            // we have a 4th timing segment
            if (this.data.config && (this.data.config.frameRate > -1)) {
                fraction = Math.ceil(split[3] / this.data.config.frameRate);
            } else {
                fraction = (split[3] > 0) ? 1 : 0;
            }
        }
        
        var modifier = 0;
        if (!_PRODUCTION && KONtx.cc.config.debug_timeSignatureOffset && (common.typeOf(KONtx.cc.config.debug_timeSignatureOffset) == "number")) {
            // setting this will shave off the specified number of minutes from the begin and end times
            // this will allow the testing of content that is 30 minutes in at the 5 minute mark
            // this is to be used to test ttml for long form content
            modifier = KONtx.cc.config.debug_timeSignatureOffset;
common.debug.level[2] && KONtx.cc.log("convertTimeSignature","modifier",modifier);
		}
        
        return ((60 * 60) * Number(split[0])) + (60 * Number(split[1])) + Number(split[2]) + Number(fraction) - modifier;
        
    },
	//
	//-- activation/deactivation ---------------------------------------------------------------------------------------
	//
	setHardwareState: function (state) {
		
		var engineInterface = KONtx.cc.engineInterface;
		
		if (engineInterface) {
			
			if (state) {
				// activate
				
				if (KONtx.cc.playerActive) {
					
					if (!this.state.hardwareStateSet) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "setHardwareState", "sending cc urls to firmware");
						var entry = this.data.captions.getDefaultEntry();
						
						var urls = [entry.url];
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "setHardwareState", common.dump(urls));
						
						engineInterface.setClosedCaptionUrls(urls);
						
					}
					
					this.state.hardwareStateSet = true;
					
					if (!engineInterface.state) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "setHardwareState", "sending activate message to firmware");
						
						engineInterface.state = true;
						
					}
					
				}
				
			} else {
				// deactivate
				
				if (engineInterface.state) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "setHardwareState", "sending deactivate message to firmware");
					
					engineInterface.state = false;
					
				}
				
			}
			
		}
		
	},
	//
	setSoftwareState: function (state) {
		
		if (state) {
			// active
			
			if (!this.data.fulfilled) {
				
				var captions = this.data.captions;
				
				var parser = captions.parser;
				
				var entry = captions.getDefaultEntry();
				
				if (entry) {
					
					if (entry.parser && (common.typeOf(entry.parser) == "function")) {
						
						parser = entry.parser;
						
					}
					
					parser(entry.url, common.bind(function (result) {
						
						this.fire("onDataReceived", result);
						
					}, this));
					
				}
				
			}
			
		} else {
			// deactive
			
			var regions = this.regions;
			
			var index = null;
			
			for (index in regions) {
				
				regions[index].visible = false;
				
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "setSoftwareState", "region", index);
				
			}
		}
		
	},
	//
	//-- message bindings ----------------------------------------------------------------------------------------------
	//
	bindControlStop: function () {
		
		if (!this._boundControlStop) {
			
			this._boundControlStop = this.onControlStop.subscribeTo(KONtx.mediaplayer, "onControlStop", this);
			
		}
		
	},
	//
	unbindControlStop: function () {
		
        if (this._boundControlStop) {
            
            this._boundControlStop.unsubscribeFrom(KONtx.mediaplayer, "onControlStop", this);
            
            this._boundControlStop = null;
            
        }
	},
	//
	bindStateChange: function () {
		
		if (!this._boundOnStateChange) {
			
			this._boundOnStateChange = this.onPlayerStateChange.subscribeTo(KONtx.mediaplayer, "onStateChange", this);
			
		}
		
	},
	//
	unbindStateChange: function () {
		
        if (this._boundOnStateChange) {
            
            this._boundOnStateChange.unsubscribeFrom(KONtx.mediaplayer, "onStateChange", this);
            
            this._boundOnStateChange = null;
            
        }
		
	},
	//
	bindTimeIndexChange: function () {
		
		if (!this._boundOnTimeIndexChange) {
			
			this._boundOnTimeIndexChange = this.onPlayerTimeIndexChange.subscribeTo(KONtx.mediaplayer, "onTimeIndexChanged", this);
			
		}
		
	},
    //
	unbindTimeIndexChange: function () {
		
		if (this._boundOnTimeIndexChange) {
			
			this._boundOnTimeIndexChange.unsubscribeFrom(KONtx.mediaplayer, "onTimeIndexChanged", this);
			
			this._boundOnTimeIndexChange = null;
			
		}
		
	},
	//
	//-- renderer ------------------------------------------------------------------------------------------------------
	//
	processEntries: function (currentInterval) {
		
		var addEntriesResponse = null;
		
		var regionsActive = this.state.regionsActive;
		
		var nextInterval = this.state.nextInterval;
		
		var nextCaptionIndex = this.state.nextCaptionIndex;
		
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "processEntries[" + currentInterval + "]", "currentInterval:" + currentInterval, "nextInterval:" + nextInterval, "nextCaptionIndex:" + nextCaptionIndex, "regionsActive:" + (regionsActive.length ? String(regionsActive.length) : "0"));
		
		// do we have open regions to check for removal
		if (regionsActive.length) {
			
			this.removeEntries(currentInterval);
			
		}
		
		// check if we have a previously recorded interval to start at or if
		// not then we must assume this is our first loop
		if ((nextInterval <= currentInterval) || (nextInterval == 0)) {
			
			// is our next check point behind the current interval
			if (common.debug.level[2]) {
				
				if (currentInterval > nextInterval) {
					
KONtx.cc.log("CaptionsOverlay", "processEntries[" + currentInterval + "]", "the sequencer got off track", "currentInterval:" + currentInterval, "nextInterval:" + nextInterval);
					
				}
				
			}
			
			this.addEntries(currentInterval);
			
		}
		
	},
	//
	addEntries: function (currentInterval) {
		
		var captionIndex = 0;
		
		var captionEntry = null;
		
		var captionsBody = this.data.body;
		
		var regionNode = null;
		
		var regionNodes = this.regions;
		
		var regionsActive = this.state.regionsActive;
		
		var nextInterval = this.state.nextInterval;
		
		var nextCaptionIndex = this.state.nextCaptionIndex;
		
		// start looking at entries based on the last recorded index of
		// the previous loop which was ahead of that last loops current
		// interval
		for (captionIndex = nextCaptionIndex; captionIndex < captionsBody.length; captionIndex++) {
			
			captionEntry = captionsBody[captionIndex];
			
			// skip items that have matching start and end times
			// this will happen for us in cases were single words are displayed for less than 1 second
			// since we cannot insure accuracy below 1000ms we cannot currently handle these entries
			if (captionEntry.begin == captionEntry.end) {
				
				// if the end time is the same...
				// we could add 1 second to the end time and stick on the node
				// if we do this we introduce the possibility of buffer overflow on the node to counter this we would
				// need to scroll content, ahhhh
				continue;
				
			}
			
			// if time of entry is at the current interval then add the region
			if (captionEntry.begin == currentInterval) {
				
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "addEntries[" + currentInterval + "]", "region:" + captionEntry.region, "index:" + captionIndex, "time:(b):" + captionEntry.begin + ",(e)" + captionEntry.end, "content:" + (captionEntry.content || (captionEntry.span && captionEntry.span.content) || "EMPTY"));
				regionNode = this.createEntryNode(regionNodes, captionEntry);
				
				this.applyEntryStyles(regionNode, captionEntry);
				
				this.applyEntryText(regionNode, captionEntry);
				
				regionNode.visible = true;
				
				regionsActive.push(captionIndex);
				
			}
			
			// if time of entry is ahead of current interval then queue the entry for the next loop
			if (captionEntry.begin > currentInterval) {
				
				nextInterval = captionEntry.begin;
				
				nextCaptionIndex = captionIndex;
				
				break;
				
			}
			
		}
		
		this.state.nextInterval = nextInterval;
		
		this.state.nextCaptionIndex = nextCaptionIndex;
		
		this.state.regionsActive = regionsActive;
		
	},
	//
	removeEntries: function (currentInterval) {
		
		var index = 0;
		
		var captionIndex = 0;
		
		var captionEntry = null;
		
		var captionsBody = this.data.body;
		
		var regionNodes = this.regions;
		
		var regionsActive = this.state.regionsActive;
		
		var regionsStillActive = [];
		
		if (common.debug.level[5]) {
			
			for (index = 0; index < regionsActive.length; index++) {
				
				captionIndex = regionsActive[index];
				
				captionEntry = captionsBody[captionIndex];
				
KONtx.cc.log("CaptionsOverlay", "removeEntries[" + currentInterval + "]", "OPEN   -> region:" + captionEntry.region, "index:" + captionIndex, "time:(b):" + captionEntry.begin + ",(e)" + captionEntry.end, "content:" + captionEntry.content);
				
			}
			
		}
		
		// start looking at any recorded open regions to see if they
		// need removed based on their specified end time
		for (index = 0; index < regionsActive.length; index++) {
			
			captionIndex = regionsActive[index];
			
			captionEntry = captionsBody[captionIndex];
			
			// if time of entry is at or ahead of the current interval
			// then remove the region
			if (captionEntry.end <= currentInterval) {
				
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "removeEntries[" + currentInterval + "]", "region:" + captionEntry.region, "index:" + captionIndex, "time:(b):" + captionEntry.begin + ",(e)" + captionEntry.end, "content:" + captionEntry.content);
				
				// turn off visibility
				regionNodes[captionEntry.region].visible = false;
				
				// remove the active region
				regionsActive.splice(index, 1);
				
				// only do this when we expand the model and need to start collecting nodes
				//this.destroyEntryNode(regionNodes, captionEntry);
				
			} else {
				
				regionsStillActive.push(captionIndex);
				
			}
			
		}
		
		this.state.regionsActive = regionsStillActive;
		
	},
	//
	destroyEntryNode: function (regionNodes, captionEntry) {
		
		// careful, we don't want to remove it if it is being reused by another entry
		
		var regionNode = regionNodes[captionEntry.region];
		
		if (regionNode) {
			
			regionNode.removeFromParentNode();
			
		}
		
	},
	//
	createEntryNode: function (regionNodes, captionEntry) {
		
		var parentElement = this.element;
		
		var regionNode = regionNodes[captionEntry.region];
		
		if (regionNode) {
			
			// clear out latent styles that may be lingering from previous use of the node
			regionNode.setStyle("", true);
			
			// e=$("CaptionsOverlay-79.element").element.childNodes.item(0)
			// e.removeEffect(0)
			if (regionNode.effect) {
				
				regionNode.removeEffect(regionNode.effect);
				
			}
			
		} else {
			
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "createEntryNode", "creating region", captionEntry.region);
			
			// create region node
			regionNode = new Text();
			
			// add region node to parent container
			parentElement.appendChild(regionNode);
			
			// add pointer to local stack
			regionNodes[captionEntry.region] = regionNode;
			
			// decoupled nodes
			//regionNode = new Frame();
			//parentElement.appendChild(regionNode);
			//regionNodes[captionEntry.region] = regionNode;
			//var textNode = new Text();
			//regionNode.appendChild(textNode);
			
		}
		
		return regionNode;
		
	},
	//
	applyEntryStyles: function (regionNode, captionEntry) {
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange", "entry styles", common.dump(captionEntry.styles));
		
		if ("styles" in captionEntry) {
			
			regionNode.setStyle(captionEntry.styles, true);
			
			// decoupled nodes
			//regionNode.childNodes.item(0).setStyle(captionEntry.styles, true);
			
			// we do not support text-outline properties but we do support the outline
			// since the css standard contradicts what the ttml standard states we will default to a black 1px outline
			if ("textOutline" in captionEntry.styles) {
				
				regionNode.effect = new Glow(0, 0, 1, 'black', 100);
				
				regionNode.applyEffect(regionNode.effect);
				
			}
			
		}
		
	},
	//
	applyEntryText: function (regionNode, captionEntry) {
common.debug.level[5] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange", "captionEntry", common.dump(captionEntry));
		
		if ("content" in captionEntry) {
			// auto adjust
			//regionNode.width = null;
			//regionNode.height = null;
			//regionNode.wrap = true;
			//regionNode.style.backgroundColor = "blue";
			//regionNode.text = captionEntry.content + "\nnow is the time for all good men\nto come to the aid of their country";
			
			regionNode.text = captionEntry.content;
			
			// decoupled nodes
			//regionNode.childNodes.item(0).text = captionEntry.content;
			
		}
		
	},
	//
	//-- message handlers ----------------------------------------------------------------------------------------------
    //
    // fired when the CC button is selected on the transport control
    onActivate: function (event) {
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "onActivate");
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onActivate", common.dump(event.payload));
        
		if (this.state.active) {
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "onActivate", "already active");
			
		} else {
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "onActivate", "not active yet");
			
			var activeUrl = event.payload.url;
			
			var activeInput = null;
			
			this.bindControlStop();
			
			this.bindStateChange();
			
			this.bindTimeIndexChange();
			
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "onActivate", "clearing state");
			this.state = common.clone(this.config.state);
			
			this.state.active = true;
			
			// check to see if we came back to the same url
			if (activeUrl != this.data.id) {
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "clearing data (ids don't match)");
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "   old id: " + this.data.id);
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "   new id: " + activeUrl);
				
				// get a fresh copy of the data object
				this.data = common.clone(this.config.data);
				
				// assign an id for tracking
				this.data.id = activeUrl;
				
				// populate any captions that exist in the current entry of the mediaplayer
				this.data.captions = KONtx.mediaplayer.playlist.currentEntry.getCaptions();
				
			}
			
			if (this.data.captions) {
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "found captions");
common.debug.level[5] && KONtx.cc.log(common.dump(this.data.captions));
				
				this[KONtx.cc.useHardware ? "setHardwareState" : "setSoftwareState"](true);
				
			} else {
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "no captions found");
				
			}
			
		}
		
    },
    // fired when the CC button is selected on the transport control
    onDeactivate: function (event) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "onDeactivate");
        
		this.state.active = false;
		
		this[KONtx.cc.useHardware ? "setHardwareState" : "setSoftwareState"](false);
		
		this.unbindTimeIndexChange();
		
		this.unbindStateChange();
		
		this.unbindControlStop();
		
    },
    // this routine further normalizes the incoming data so we have a standard payload for the renderer to work with
    onDataReceived: function (event) {
        
        if (event.type == "onDataReceived") {
common.debug.level[3] && KONtx.cc.log("onDataReceived", "event", common.dump(event.payload));
            
			if (("payload" in event) && ("tt" in event.payload)) {
				
				var data = event.payload.tt;
				
				this.data.config = this.processConfig(data);
				
				this.data.head = this.processHead(data);
				
				this.data.body = this.processBody(data);
				
				// if we have entries then we have fulfilled our data requirements
				// this is used in the timeindexchange handler to determine if we should process anything
				this.data.fulfilled = this.data.body.length ? true : false;
				
			} else {
				
				this.data.fulfilled = false;
				
			}
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onDataReceived", common.dump(this.data,5));
            
        }
        
    },
    // fired when the state of the mediaplayer changes
    onPlayerStateChange: function (event) {
        
        var playerStates = KONtx.cc.playerStates;
        
        switch (event.payload.newState) {
            
			case playerStates.BUFFERING:
			case playerStates.PLAY:
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onPlayerStateChange", KONtx.cc.playerStatesLegend[event.payload.newState]);
				
				// trigger this once, there is a check in the handler to remove the listener for the index change
				this.fire("onPlayerTimeIndexChange");
				
				break;
				
            case playerStates.STOP:
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onPlayerStateChange", KONtx.cc.playerStatesLegend[event.payload.newState]);                
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onPlayerStateChange", "stopping video");
                
                this.fire("onDeactivate");
                
                break;
                
        }
        
    },
    // fired when the stop button is selected on the transport control
    onControlStop: function (event) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "onControlStop");
        
        this.fire("onDeactivate");
        
    },
    // fired when the time index of the mediaplayer changes
    onPlayerTimeIndexChange: function (event) {
		
		if (KONtx.cc.useHardware) {
			
			this.setHardwareState(true);
			
			this.unbindTimeIndexChange();
			
		} else {
			
			if (this.data.fulfilled) {
				
				this.processEntries(event.payload.timeIndex);
				
			}
			
		}
        
    },
	//
});
