/*******************************************************************************

*******************************************************************************/
//
delete KONtx.media.Captions;
//
KONtx.media.Captions = function constructor_Captions(config) {
	
	this.entries = [];
	
	this.name = "MediaCaptions";
	
    if (config) {
common.debug.level[5] && common.debug.log("config", common.dump(config));
        
        if (config.parser && (common.typeOf(config.parser) == "function")) {
            
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
     * @description tells if multiple caption languages are available
     * @returns {Boolean}
     */
    get isMultiLanguage() {
        
        return this.entries.length > 1;
        
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
     * @description get a captions entry by language
     * @param {String} lang
     * @default "en"
     */
    getEntryByLanguage: function (lang) {
        
        lang = (typeof(lang) !== "undefined") ? lang : KONtx.cc.config.defaultLanguage;
        
        var entries = this.entries.filter(function (entry) {
           return entry.lang == lang;
        });
        
        return entries.length ? entries[0] : null;
        
    },
    /**
     * @description takes a ttml url and returns a json result
     */
    parser: function (url, callback) {
common.debug.level[3] && common.debug.log("default parser");
        //var query = "select * from ctv.ttml.normalize where url='" + url + "'&env=http://datatables.org/alltables.env";
        var query = "select * from xml where url='" + url + "'";
        KONtx.cc.fetch({
            url: "http://query.yahooapis.com/v1/public/yql?format=json&q=" + query,
            success: function (xhr) {
                var json = JSON.parse(xhr.responseText).query.results;
common.debug.level[4] && KONtx.cc.log("CaptionsEntry", "fetchHead", "success", common.dump(json, 7));
                callback(json);
            }
        });
    }
	//
};
//
/*******************************************************************************

*******************************************************************************/
//
delete KONtx.media.CaptionsEntry;
//
KONtx.media.CaptionsEntry = function constructor_CaptionsEntry(config) {
    
    config = config || {};
	
	this.url = config.url || "";
    
    this.lang = config.lang || "en";
    
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
