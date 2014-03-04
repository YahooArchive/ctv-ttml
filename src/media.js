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
delete KONtx.media.Captions;
//
KONtx.media.Captions = function constructor_Captions(config) {
	
	this.entries = [];
	
	this.name = "MediaCaptions";
	
    if (config) {
common.debug.level[5] && common.debug.log("config", common.dump(config));
		
        if (config.parser && (common.typeOf(config.parser) == "function")) {
            // must follow pattern defined in Captions.parser
            this.parser = config.parser;
            
        }
        
    }
    
};
//
KONtx.media.Captions.prototype = {
    /**
     * @description adds multiple entries
     * @param {Array} entries
     */
    addEntries: function (entries) {
        
        this.entries = this.entries.concat(entries || []);
        
    },
    /**
     * @description adds a single entry
     * @param {Object[KONtx.media.CaptionsEntry]} entry 
     */
    addEntry: function (entry) {
        
        this.addEntries([entry]);
        
    },
    /**
     * @description Clears all entries
     */
    clearEntries: function () {
        
        this.entries = [];
        
    },
    /**
     * @description removes a single entry
     * @param {Integer} index ordinal position of item to remove from list
     */
    removeEntry: function (index) {
        
        this.entries.splice(index, 1);
        
    },
    /**
     * @description returns the default
     * @returns
     */
    getDefaultEntry: function () {
        
        return this.getEntryByIndex(0);
        
    },
    /**
     * @description get a captions entry by ordinal position in stack
     * @param {Integer} index 
     * @default 0
     */
    getEntryByIndex: function (index) {
        
        return this.entries[(typeof(index) !== "undefined") ? Number(index) : 0];
        
    },
    /**
     * @description takes a ttml url and returns a json result
     */
    parser: function (url, callback) {
common.debug.level[3] && KONtx.cc.log("Captions", "parser", "default parser");
        url = (!_PRODUCTION && KONtx.cc.config.debug_ttmlLocation) ? KONtx.cc.config.debug_ttmlLocation : url;
common.debug.level[2] && KONtx.cc.log("Captions", "parser", "url", url);
		
        KONtx.cc.fetch({
            url: KONtx.cc.config.yqlHost + "?format=json&q=" + KONtx.cc.config.yqlQuery.replace("%1", url),
            success: function (xhr) {
                var json = JSON.parse(xhr.responseText).query.results;
common.debug.level[4] && KONtx.cc.log("Captions", "parser", "fetch", "success", common.dump(json, 7));
                callback(json);
            }
        });
		
    }
	//
};
//
delete KONtx.media.CaptionsEntry;
//
KONtx.media.CaptionsEntry = function constructor_CaptionsEntry(config) {
    
    config = config || {};
	
	this.url = config.url || "";
    
    this.parser = (config.parser && (common.typeOf(config.parser) == "function")) ? config.parser : null;
    
};
//
KONtx.media.CaptionsEntry.prototype = {
    /**
     * @description
     * @param {String} url
     * @param {String} lang
     */
    addEntry: function (url, lang, parser) {
        
        if (url) {
            
            this.url = url || this.url;
            
            this.lang = lang || this.lang;
            
            this.parser = (parser && (common.typeOf(parser) == "function")) ? parser : null;
            
        }
        
    }
    //
};
//
