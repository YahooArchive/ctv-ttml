/*******************************************************************************

*******************************************************************************/
//
delete KONtx.control.CaptionsOverlay;
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
            regionsActive: []
        },
        data: {
            // used as an id to determine if we need to reparse
            // is the url passed in when activating captions
            id: "",
            // flag for determining if the parser routine has completed
            // is set after the onDataReceived routine completes
            fulfilled: true,
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
    // storage
    data: {},
    // nodes
    regions: {},
    //
    /**************************************************************************/
    // 
	initialize: function () {
        
		this.parent();
        
        // events the framework wires up on this object
        this.onAppended.subscribeTo(this, "onAppend", this);
        
        // events we want to fire but are not wired up to this object
        this.onActivate.subscribeTo(this, "onActivate", this);
        
        this.onDeactivate.subscribeTo(this, "onDeactivate", this);
        
        this.onDataReceived.subscribeTo(this, "onDataReceived", this);
        
	},
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
                
                entry.begin = this.convertClockToFractionalSeconds(entry.begin);
                
                entry.end = this.convertClockToFractionalSeconds(entry.end);
                
                // if no region is specified, supply a default
                entry.region = ("region" in entry) ? entry.region : defaultRegion;
                
                entry.styles = this.populateEntryStyles(entry, defaultStyle);
                
                entry.content = this.flattenEntryContent(entry);
                
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "processBody", "entry[" + index + "]", common.dump(entry,5));
                
                entries.push(entry);
                
            }
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "processBody", "completed processing all " + content.length + " entries");
                
            body = entries;
            
        }  
        
        return body;
        
    },
    //
    structureList: function (data, namespace) {
        var list = namespace.split(".");
        var parent = data[list[0]];
        var result = {};
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
        
        return result;
    },
    //
    flattenEntryContent: function (entry) {
        var content = "";
        
        if ("span" in entry) {
            
            if ("content" in entry.span) {
                
                entry.content = entry.span.content;
                
            }
            
            delete entry.span;
            
        }
        
        if ("br" in entry) {
            
            delete entry.br;
            
        }
        
        if ("content" in entry) {
            
            content = entry.content.replace(/<br\/?>/g, "\n");
            
        }
        
        return content;
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
            
            styles.hOffset = Math.floor(screen.width * (parseInt(originSplit[0]) / 100));
            
            styles.vOffset = Math.floor(screen.height * (parseInt(originSplit[1]) / 100));
            
        } else if ("origin" in styles) {
            
            // specific position information
            
            originSplit = styles.origin.split(" ");
            
            styles.hOffset = Math.floor(screen.width * (parseInt(originSplit[0]) / 100));
            
            styles.vOffset = Math.floor(screen.height * (parseInt(originSplit[1]) / 100));
            
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
            //styles.width = Math.ceil(screen.width * (parseInt(extentSplit[0]) / 100));
            
            styles.height = Math.ceil(screen.height * (parseInt(extentSplit[1]) / 100));
            
        } else if ("extent" in styles) {
            
            // specific dimension information
            
            extentSplit = styles.extent.split(" ");
            
            // due to missing support for monospace fonts we end up having a lot
            // of empty space on the right side of every text element. in order
            // to counter this effect we will not set the width specified by the
            // ttml
            //styles.width = Math.ceil(screen.width * (parseInt(extentSplit[0]) / 100));
            
            styles.height = Math.ceil(screen.height * (parseInt(extentSplit[1]) / 100));
            
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
                    
                    styles.fontSize = Math.floor(this.config.fontSize * (parseInt(styles.fontSize) / 100));
                    
                } else {
                    
                    styles.fontSize = Math.floor(styles.height * (parseInt(styles.fontSize) / 100));
                    
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
    convertClockToFractionalSeconds: function (clock) {
        
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
        
        return ((60 * 2) * Number(split[0])) + (60 * Number(split[1])) + Number(split[2]) + Number(fraction);
        
    },
    //
    /**************************************************************************/
    //
    onAppended: function (event) {
        
        this.onDeactivate.subscribeTo(this.getView(), "onHideView", this);
        
    },
    //
    onActivate: function (event) {
        
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "onActivate");
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onActivate", common.dump(event.payload));
        
        var dataId = event.payload.url;
        
        if (!this._boundPlayerKeyPress) {
            
            this._boundPlayerKeyPress = this.onPlayerKeyPress.subscribeTo(KONtx.mediaplayer, "onControlStop", this);
            
        }
        
        if (!this._boundMessageBroadcast) {
            
            this._boundMessageBroadcast = this.onDataReceived.subscribeTo(KONtx.messages, "onBroadcast", this);
            
        }
        
        if (!this._boundOnStateChange) {
            
            this._boundOnStateChange = this.onPlayerStateChange.subscribeTo(KONtx.mediaplayer, "onStateChange", this);
            
        }
        
        if (!this._boundOnTimeIndexChange) {
            
            this._boundOnTimeIndexChange = this.onPlayerTimeIndexChange.subscribeTo(KONtx.mediaplayer, "onTimeIndexChanged", this);
            
        }
        
common.debug.level[2] && KONtx.cc.log("CaptionsOverlay", "onActivate", "cleaning up state object");
        
        this.state = common.clone(this.config.state);
        
        if (dataId != this.data.id) {
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "data ids don't match, resetting");
            
            this.data = common.clone(this.config.data);
            
            this.data.id = dataId;
            
            this.data.captions = KONtx.mediaplayer.playlist.currentEntry.getCaptions();
            
            if (this.data.captions) {
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "this.data.captions", "found captions");
common.debug.level[5] && KONtx.cc.log(common.dump(this.data.captions));
                
                this.data.fulfilled = false;
                
                var self = this;
                
                var callback = function (result) {
                    
                    self.fire("onDataReceived", result);
                    
                    self.data.fulfilled = true;
                    
                };
                
                var parser = this.data.captions.parser;
                
                var entry = this.data.captions.getDefaultEntry();
                
                if (entry.parser && (common.typeOf(entry.parser) == "function")) {
                    
                    parser = entry.parser;
                    
                }
                
                parser(entry.url, callback);
                
            } else {
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onActivate", "this.data.captions", "no captions found");
                
            }
            
        }
        
    },
    //
    onDeactivate: function (event) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "onDeactivate");
        
        var regions = this.regions;
        
        var index = null;
        
        for (index in regions) {
            
            regions[index].visible = false;
            
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onDeactivate", "region", index);
            
        }
        
        if (this._boundPlayerKeyPress) {
            
            this._boundPlayerKeyPress.unsubscribeFrom(KONtx.mediaplayer, "onControlStop", this);
            
            this._boundPlayerKeyPress = null;
            
        }
        
        if (this._boundOnStateChange) {
            
            this._boundOnStateChange.unsubscribeFrom(KONtx.mediaplayer, "onStateChange", this);
            
            this._boundOnStateChange = null;
            
        }
        
        if (this._boundOnTimeIndexChange) {
            
            this._boundOnTimeIndexChange.unsubscribeFrom(KONtx.mediaplayer, "onTimeIndexChanged", this);
            
            this._boundOnTimeIndexChange = null;
            
        }
        
        if (this._boundMessageBroadcast) {
            
            this._boundMessageBroadcast.unsubscribeFrom(KONtx.messages, "onBroadcast", this);
            
            this._boundMessageBroadcast = null;
            
        }
        
    },
    // this routine further normalizes the incoming data so we have a standard payload for the renderer to work with
    onDataReceived: function (event) {
        
        if (event.type == "onDataReceived") {
common.debug.level[1] && common.debug.log("onDataReceived","event",common.dump(event.payload));
            
            var data = event.payload.tt;
            
            this.data.config = this.processConfig(data);
            
            this.data.head = this.processHead(data);
            
            this.data.body = this.processBody(data);
            
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onDataReceived", common.dump(this.data,5));
            
        }
        
    },
    //
    onPlayerKeyPress: function (event) {
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "onPlayerKeyPress");
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerKeyPress", common.dump(event,3));
        
        this.fire("onDeactivate");
        
    },
    //
    onPlayerStateChange: function (event) {
        
        var playerStates = KONtx.cc.getPlayerStates();
        
common.debug.level[3] && KONtx.cc.log("CaptionsOverlay", "onPlayerStateChange", KONtx.cc.playerStatesLegend[event.payload.newState]);
        
        switch (event.payload.newState) {
            
            case playerStates.STOP:
                
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerStateChange", "stopping video");
                
                this.fire("onDeactivate");
                
                break;
                
        }
        
    },
    // 
    onPlayerTimeIndexChange: function (event) {
        
        if (this.data.fulfilled && this.data.body.length) {
            
            var index = 0;
            
            var captionIndex = 0;
            
            var nextCaptionIndex = this.state.nextCaptionIndex;
            
            var currentInterval = event.payload.timeIndex;
            
            var nextInterval = this.state.nextInterval;
            
            var parentElement = this.element;
            
            var captionEntry = null;
            
            var captionsBody = this.data.body;
            
            var regionNode = null;
            
            var regionNodes = this.regions;
            
            var regionModel = {};
            
            var regionModels = null;
            
            // defaults applied to containing frame
            this.element.style.fontSize = this.config.fontSize;
            this.element.style.color = "#FFF";
            
            regionModels = this.data.head.layout.region;
            
            var regionsActive = this.state.regionsActive;
            
            var regionsStillActive = [];
            
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange[" + currentInterval + "]", "currentInterval:" + currentInterval, "nextInterval:" + nextInterval, "nextCaptionIndex:" + nextCaptionIndex, "regionsActive:" + (regionsActive.length ? regionsActive.toString() : "none"));
            
            // do we have open regions to check for removal
            if (regionsActive.length) {
                
                if (common.debug.level[5]) {
                    
                    for (index = 0; index < regionsActive.length; index++) {
                        
                        captionIndex = regionsActive[index];
                        
                        captionEntry = captionsBody[captionIndex];
                        
KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange[" + currentInterval + "]", "OPEN   -> region:" + captionEntry.region, "index:" + captionIndex, "time:(b):" + captionEntry.begin + ",(e)" + captionEntry.end, "content:" + captionEntry.content);
                        
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
                        
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange[" + currentInterval + "]", "REMOVE -> region:" + captionEntry.region, "index:" + captionIndex, "time:(b):" + captionEntry.begin + ",(e)" + captionEntry.end, "content:" + captionEntry.content);
                        
                        regionNodes[captionEntry.region].visible = false;
                        
                    } else {
                        
                        regionsStillActive.push(captionIndex);
                        
                    }
                    
                }
                
                regionsActive = regionsStillActive;
                
            }
            
            // check if we have a previously recorded interval to start at or if
            // not then we must assume this is our first loop
            if ((nextInterval == currentInterval) || (nextInterval < currentInterval) || (nextInterval == 0)) {
                
                // is our next check point behind the current interval
                if (currentInterval > nextInterval) {
                    
common.debug.level[1] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange[" + currentInterval + "]", "the sequencer got off track", "currentInterval:" + currentInterval, "nextInterval:" + nextInterval);
                    
                }
                
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
                        // if we do this we introduce the possibility of buffer overflow on the node
                        // to counter this we would need to scroll content, ahhhh
                        continue;
                        
                    }
                    
                    // if time of entry is at the current interval then add the
                    // region
                    if (captionEntry.begin == currentInterval) {
                        
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange[" + currentInterval + "]", "ADD    -> region:" + captionEntry.region, "index:" + captionIndex, "time:(b):" + captionEntry.begin + ",(e)" + captionEntry.end, "content:" + (captionEntry.content || (captionEntry.span && captionEntry.span.content) || "EMPTY"));
                        
                        regionNode = regionNodes[captionEntry.region];
                        
                        if (regionNode) {
                            
                            // clear out latent styles that may be lingering from previous use of the node
                            regionNode.setStyle("", true);
                            
                            // e=$("CaptionsOverlay-79.element").element.childNodes.item(0)
                            // e.removeEffect(0)
                            if (regionNode.effect) {
                                log("effect found");
                                regionNode.removeEffect(regionNode.effect);
                                
                            }
                            
                        } else {
                            
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange", "creating region", captionEntry.region);
                            
                            // create node
                            regionNode = new Text();
                            
                            // add node to parent container
                            parentElement.appendChild(regionNode);
                            
                            // add pointer to local stack
                            regionNodes[captionEntry.region] = regionNode;
                            
                        }
                        
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange", "entry styles", common.dump(captionEntry.styles));
                        
                        if ("styles" in captionEntry) {
                            
                            regionNode.setStyle(captionEntry.styles, true);
                            
                            // we do not support text-outline properties but we do support the outline
                            // since the css standard contradicts what the ttml standard states we will default to a black 1px outline
                            if ("textOutline" in captionEntry.styles) {
                                
                                regionNode.effect = new Glow(0, 0, 1, 'black', 100);
                                
                                regionNode.applyEffect(regionNode.effect);
                                
                            }
                            
                        }
                        
common.debug.level[5] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange", "captionEntry", common.dump(captionEntry));
                        if ("content" in captionEntry) {
                            
                            regionNode.text = captionEntry.content;
                            
                        }
                        
                        // break this down
                        // TODO: we don't want to support this
                        // ??? right ???
                        if ("span" in captionEntry) {
                            
                            regionNode.setStyle(captionEntry.span, true);
                            
                            var captionEntrySpanType = common.typeOf(captionEntry.span);
                            
common.debug.level[4] && KONtx.cc.log("CaptionsOverlay", "onPlayerTimeIndexChange", "captionEntrySpanType", captionEntrySpanType);
                            
                            switch (captionEntrySpanType) {
                                
                                case "string":
                                    
                                    regionNode.text = captionEntry.span;
                                    
                                    break;
                                
                                case "array":
                                    
                                    regionNode.text = captionEntry.span.join("\n");
                                    
                                    break;
                                
                                case "object":
                                    
                                    if ("content" in captionEntry.span) {
                                        
                                        regionNode.text = captionEntry.span.content;
                                        
                                    }
                                    
                                    break;
                                
                            }
                            
                        }
                        
                        regionNode.visible = true;
                        
                        regionsActive.push(captionIndex);
                        
                    }
                    
                    // if time of entry is ahead of current interval then queue
                    // the entry for the next loop
                    if (captionEntry.begin > currentInterval) {
                        
                        nextInterval = captionEntry.begin;
                        
                        nextCaptionIndex = captionIndex;
                        
                        break;
                        
                    }
                    
                }
                
            }
            
            this.state.nextInterval = nextInterval;
            
            this.state.nextCaptionIndex = nextCaptionIndex;
            
            this.state.regionsActive = regionsActive;
            
        }
        
    }
    //
});
//
