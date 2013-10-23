/*******************************************************************************
This file handles fulfilling any compatibility requirements and dependencies and
then loading either the package, if the common.packager is available, or lazily
loading each required file manually using namespace getters. The revision can be
found in actuator.js as instanceVersion.
*******************************************************************************/
/** TODO ***********************************************************************

* verify that the payload goes through (onTransportButtonPress)
*   currently not required
* create option list for languages (onCaptionListRequest)
*   decide on visual terminology
*   decide on back/cancel behavior
*   decide on initial select behavior

*******************************************************************************/
/** Release Notes **************************************************************

0.0.1
    This version is the initial release.
    Compliance (TTML 1.0)
        Not referencing an ICS which means we cannot "claim" to be compliant
        Support for parsing TTML 1.0 documents which meet content compliance
            Our library does not imply content conformance since we are not supplying the content
        In the process of determining minimum processor conformance based on DFXP Transformation Profile
    Features
        State
            Provides a new button on the MediaPlayer Transport Overlay for toggling the activation state
                On activation the MediaPlayer is paused until the TTML is downloaded, parsed, and starts sequencing
                On deactivation the MediaPlayer is not paused
                On reactivation the MediaPlayer follows the same path as a new activation
            Support for persisting the activation state of closed captioning per user profile
        Localization
            Supoprt for "en" language only
            No support for multi-language
            No visual implementation of pop-up menu for selecting alternative languages
        TTML Specification
            Support for TTML "region" property (box model elements)
            Support for TTML "content" property (text to be displayed)
            Support for TTML "span" property (single nested content layer; essentially a span within a paragraph)
            Support for TTML "style" property (limited support for style properties based on technical limitations, ie no formal CSS support)
            Support for TTML "origin" property (position of element)
            Support for TTML "extent" property (geometry of element)
            Support for TTML "begin" property (start time of content display)
            Support for TTML "end" property (end time of content display)
            No support for inline content styling (a word inside a phrase which is graphically represeted differently than the rest of the phrase)
        Transport Controls
            Support for "play" control
                On play of the MediaPlayer the Caption Controller is loaded, Caption Sequencer is started
            Support for "pause" control
                On pause of the MediaPlayer the Caption Sequencer pauses
            Support for "stop" control
                On stop of the MediaPlayer the Caption Controller is unloaded, Caption Sequencer is stopped, content is removed from screen
            
0.0.2
    Fixed bug with default language setting
    Updated documentation
    Improved legacy framework compatibility
    Removed common.String call in CaptionsOverlay
    Added isPhysicalNetworkDown call for 1.3.10 frameworks
    
0.0.3
    Fixed bug where sequencer could get off track when toggling cc on/off
    Caching ttml data during state changes to improve performance
    No longer generating all DOM regions at start up but instead doing it as needed to improve performance
    Abstracting shared routines to KONtx.cc namespace to improve performance

0.0.4
    Fixed bug in PAUSE and STOP handlers which could freeze the sequence interval in the future
    Removed lots of log statements to improve performance
    Refined logging mechanism to improve performance
    Cleaned up code
    Abstracted shared routines to KONtx.cc namespace to improve performance
    Merged single use methods
    Added more ttml preprocessing to improve performance
    
0.0.5
    Consolidated code paths in the captions overlay which reduces codesize and improves performance
    Added hide view handler for removing region nodes from the view
    Moved data normalization into subscription model to allow 3rd party implementers to have a shot at the data before it's used by the captions controller
    Moved the "wait" logic for the player(which happens if we are in play mode but have not received data yet) into subscription model to allow 3rd party implementers to listen
    Consolidated player handlers
    Added defaults for the data property in the config for the overlay
    Renamed some methods on the CC Controller
    Fixed bug when leaving the player view which sometimes did not tear down the region nodes
    Added payloads to the onActivate/onDeactivate publishers
    Added payloads to the onTransportButtonPress publisher
    
0.0.6
    Fixed bug where 3rd parties could overload the Playlist and PlaylistEntry objects if loading a mediaplayer patch file
    
0.0.7
    Fixed bug where multiple CC buttons could be rendered in the transport overlay control
    
0.0.8
    Fixed bug where previous state of CC would not be reflected in CC button in transport overlay if the button did not get enable(due to missing captions)
    
0.0.9
    ** Didn't increment the actuator version up to 0.0.8 during last commit
    Added publishers for onActivateClosedCaption and onDeactivateClosedCaption to the transport overlay
    Replaced plublish on the cc button with a publish on the transport overlay
    Replaced onViewStateChanged subscriber with a publish to onDeactivate
    Added onPlayerKeyPress subscriber which listens to onControlStop from the mediaplayer and publishes onDeactivate
    Fixed bug with cc overlay sticking on screen after the fullscreen view was hidden
    Fixed bug with different behaviors between rc-stop, key stop, rc-back, and key back
    Added legacy compatibility for < 1.6 mediaplayer events
    
0.0.10
    Fixed bug where time index chunks were being incorrectly cast as strings resulting in improper timing
    
0.0.11
    Based on a recomendation from operations we are now calculating the 4th timing segment and are rounding up(ceiling) which will cause some captions to delay by less than a second but will prevent the pre-emptive approach from showing captions too early possibly exposing spoilers
    Removed delay in player when fetching ttml data
    Fixed incorrect storage key name for activating CC
    
0.0.12
    Updated controls to provide default region, layout, style, geometry for ttml documents that do not provide them
    Adjusted default container element size to match the screensize
    
0.0.13
    adding a null check when setting up the platform var because old widgets could be including a platform package that
    would not load due to security issues(yahooSettings not available to non-yahoo-signed apps) and produce a global
    platform var which is the object null

0.0.14
    removed a check which was preventing app level CC modules from overloading the transport control
    added hooks to the transport control which allow it to update its state during a showview and respond to external
        activation and deactivation of CC
    fixed bug when activating/deactivating CC before the mediaplayer has a playlist entry
    adding default values for the captions object during the setup of the playlist. this was causing certain playlist
        setups to fail
    added redundant checks when performing lookups on the internal _streams table in the mediaplayer

0.0.15
    changing platform.currentProfileData => currentProfileData to support CC module in unsigned apps on old samsung TVs
    
0.0.16
    changed the Captions interface. now requires a parser to be implemented by the author. this parser must fetch and
        format ttml data into a well-defined JSON structure before sending that data, as an argument, through the
        execution of the provided callback function. if this is not implemented by the author the renderer will not be
        sent data nor will it be notified that there is data to display and will subsequently not display any captions.
    
*******************************************************************************/
/** Implementation Documentation ***********************************************

ClosedCaptioning is supplied as an add-on module that will initially be embedded
within a given application. The module itself will also be committed to the
framework. When a framework which contains the cc module is published the
embedded module will self-deprecate in favor of the framework provided module.

Structure of the ClosedCaptioning module
    
    cc
    |-- assets
    |   `-- 960x540
    |       |-- captions-42x33.png
    |       `-- captions-active-42x33.png
    |-- load.js
    `-- src
        |-- actuator.js
        |-- compatibility.js
        |-- controls.js
        |-- implements.js
        |-- manifest.js
        `-- media.js
        
Setting up the filesystem
    
    1) Add the ClosedCaptioning module
        // this can be put anywhere inside the Contents directory of an app
        Contents/Javascript/cc
    
    2) Specify the local application path to the CC module
        KONtx.config.ccModulePath = "Javascript/cc";
    
    3) Load the CC module
        // typically this is loaded in the init.js
        include("Framework/kontx/[REVISION]/src/all.js");
        // this must be loaded after the framework is loaded
        include("Javascript/cc/load.js");
    
Wiring up the code
    * an apps Playlist will need modified to include a new Captions object
    * a unique CaptionsEntry object can be added to each Captions object
    * a unique Captions object can be added to each PlaylistEntry object
    * ttml data will need formatted to meet a specific schema
    
    example:
    
    captions = new KONtx.media.Captions({
        // @method parser
        // @param url String
        //  refers to the specific ttml url provided by each playlist entry
        // @param callback Function
        //  execute this with a json payload to send render data back to captions controller
        //  must be executed or the renderer will never be called
        parser: function (url, callback) {
            // Now we are going to take the url representing the xml formatted ttml document and send it through
            // some processing to normalize the structure.
            //
            // This platform cannot support nested paragraph content so we need to flatten the 'p' tags into single
            // entry nodes that contain only string text. The first thought would be to convert the XML to JSON but
            // simply doing this will cause us to loose the hierarchy of the tag structure. This is an inate problem
            // when converting XML to JSON. To overcome this we can process the XML and build our own JSON structure
            // using ODT(Open Data Tables) and YQL(Yahoo Query Language).
            //
            // You could also do this transformation on the client using XMLDOM and Xpath, but this approach is not
            // recommended due to performance constraints on the platform especially during media playback which is the
            // only supported use case for this module. If no server based solution can be provided then you will need
            // to use this approach regardless
            
            // This is an example ODT that can be used to perform the requirements defined above
            //
            // The ODT below CAN NOT be used in production by your app and the app will be flagged and disallowed from
            // publication is the following ODT store is referenced within your app. In order to use this solution you
            // will need to copy the provided ODT to your own data table and use that to publish with. This is due to
            // the rate limits that are applied to each ODT
            var dataTable = "store://jMeilBMpXMGUqhpSTUtrzf";
            var query = "use '" + dataTable + "' as normalizedTTML; select * from normalizedTTML where url='" + url + "'";
            
            KONtx.cc.fetch({
                url: "http://query.yahooapis.com/v1/public/yql?q=" + query + "&format=json",
                success: function (xhr) {
                    var json = JSON.parse(xhr.responseText).query.results;
                    if (json.tt) {
                        callback(json);
                    }
                }
            });
            
        }
    });
    captionsEntry = new KONtx.media.CaptionsEntry({
        url: <location of ttml xml document>,
        lang: <language for ttml>
    });
    captions.addEntry(captionsEntry);

    playlist = new KONtx.media.Playlist(); 
    playlistEntry = new KONtx.media.PlaylistEntry({
        url: <location of the video>,
        bitrate: <bitrate for video>,
        captions: captions
    });
    playlist.addEntry(playlistEntry);
    
*******************************************************************************/
/** Example Implementation *****************************************************



*******************************************************************************/
/** Reference Documentation ****************************************************

TTML spec: http://www.w3.org/TR/2010/REC-ttaf1-dfxp-20101118/
TTML note: http://www.w3.org/TR/2013/NOTE-ttml10-sdp-us-20130205/
TTML framerate proposal: http://www.w3.org/wiki/TTML/changeProposal004
https://www.federalregister.gov/articles/2012/03/30/2012-7247/closed-captioning-of-internet-protocol-delivered-video-programming-implementation-of-the#p-249
https://www.federalregister.gov/articles/2013/07/02/2013-15718/closed-captioning-of-internet-protocol-delivered-video-programming-implementation-of-the

*******************************************************************************/
/** TTML JSON SCHEMA ***********************************************************

The following JSON structure is the schema that the built in interpreter understands. Not adhering to this schema will
result in the non-displayal of TTML data. Items that are enclosed in square brackets( [optional item] ) are considered
optional unless specified.

This structure follows the TTML standard semantically until the paragraph section is reached. The reason for flattening
the paragraph nodes is due to rendering constraints on the supported devices.

Styles are supported but not in a cascade style format as suggested by the standard. This again, is due to rendering
constraints imposed by the platform itself. In addition to this the renderer does not support nested paragraph nodes. So
any styles associated with nested span tags included within a paragraph tag will be ignored as the renderer must recieve
a flattened structure for each paragraph including only a string. In order to accomodate this we apply the following
rules to paragraph entries.
1) apply any style declared on the body tag
2) apply any style declared on a default region declared by the body tag
3) apply any style declared on a region declared by the paragraph tag
4) apply any style declared on a paragraph
5) apply any inline style properties declared on a paragraph tag

// The root entry must be a "tt" node
"tt": {
    // At this level we look for attributes from the "tt" node
    ["lang": "en",]
    // The "tt" node must provide a "frameRate" property if and only if a frame-based time signature is provided in the
    // paragraph entries
    ["frameRate": "30",]
    // The "tt" node must provide a "head" node
    "head": {
        // The "head" node must provide a "styling" node
        "styling": {
            // The "styling" node must provide a "style" node.
            // The "style" node should be an object if only a single entry or a list if multiple styles are provided.
            // Below are examples of both approaches:
            
            // single style entry format
            "style": {
                // The following styles are supported
                "backgroundColor": "transparent",
                "color": "#FFCC00",
                "extent": "80% 15%",
                // no monospace font is provided by the platform
                "fontFamily": ""
                "fontStyle": "normal",
                "fontSize": "80%",
                "fontWeight": "",
                "id": "DefaultStyle",
                "paddingTop": "2px",
                "paddingRight": "2px",
                "paddingBottom": "2px",
                "paddingLeft": "2px",
                "opacity": "1.00",
                "origin": "10% 80%",
                "textAlign": "center",
                "textOutline": "#000000 2px",
            },
            
            // multiple style entry format
            "style": [
                {
                    "backgroundColor": "transparent",
                    "id": "DefaultStyle",
                },
                {
                    "backgroundColor": "black",
                    "id": "AnotherStyle",
                }
                [...]
            ],

        },
        // The "head" node must provide a "layout" node
        "layout": {
            // The "layout" node must provide a "region" node.
            // The "region" node should be an object if only a single entry or a list if multiple regions are provided.
            // Below are examples of both approaches:
            
            // single region entry format
            "region": {
                "id": "DefaultRegion",
                "style": "DefaultStyle",
            },
            
            // multiple region entry format
            "region": [
                {
                    "id": "DefaultRegion",
                    "style": "DefaultStyle",
                },
                {
                    "backgroundColor": "yellow",
                    "id": "AnotherRegion",
                },
                [...]
            ],
            
        },
    },
    // The "tt" node must provide a "body" node
    "body": {
        // If a "region" property is provided then this region and its associated styles are applied to each entry
        // before the entrys styles are calculated
        ["region": "DefaultRegion",]
        // If a "style" property is provided the associated styles are applied to each entry before the entrys styles
        // are calculated
        ["style": "DefaultStyle",]
        // The "body" node must provide a "div" node
        "div": {
            // The "div" node must provide a "p" node
            "p": [
                {
                    // The "p" node must provide a "content" property
                    // The contents of an entry must be flattened. The interpretor does not understand nested entries
                    // and will only display the "content" property as a string. This string could contain a "<br>" tag
                    // which will be replaced by a line-feed during rendering.
                    "content": "Line 1<br/>Line 2",
                    
                    // The "p" node must provide a "begin" property.
                    // The time signature can be in HH:MM:SS:MS(Milliseconds) or HH:MM:SS:FBT(Frame Based Time)
                    // Below are examples of both approaches:
                    
                    // Milliseconds
                    "begin": "00:00:22:28",
                    
                    // Frame Based Time
                    // This format requires a "frameRate" property to be provided at the root "tt" node
                    "begin": "00:00:01.034",
                    
                    // The "p" node must provide an "end" property.
                    // The time signature can be in HH:MM:SS:MS(Milliseconds) or HH:MM:SS:FBT(Frame Based Time)
                    "end": "00:00:27:07",
                    
                    // The "p" node can provide an "extent" property
                    // The "extent" property is used to determine how much space is consumed by this container.
                    // If this property is not provided a default is provided.
                    ["extent": "67.5% 5.33%",]
                    
                    // The "p" node can provide an "origin" property
                    // The "origin" property is used to determine where this container is placed.
                    // If this property is not provided a default is provided.
                    ["origin": "15% 79.33%",]
                    
                    // The "p" node can provide an "region" property
                    // If a "region" property is provided the region is looked up in "head.layout.region". If the
                    // region supplies styles they are applied to the entry before any entry specific styles are
                    // calculated.
                    ["region": "region1",]
                    
                    // The "p" node can provide an "style" property
                    // If a "style" property is provided the style is looked up in "head.styling.style". If styles are
                    // supplied they are applied to the entry before any entry specific styles are calculated.
                    ["style": "AnotherStyle",]
                },
                [...]
            ],
        },
    },
};
*******************************************************************************/
// 
(function kontx_cc_loader_singleton() {
	//
	var moduleLoaded = false;
    
    // verify the module path and load status
    (function kontx_cc_loader_verification_singleton() {
        
        var staticFrameworkPath = "Framework/kontx/modules/cc/";
        
        if ("cc" in KONtx) {
            
            moduleLoaded = true;
            
        }
        
        // if author is overloading
        if ("ccModulePath" in KONtx.config) {
            
            if (KONtx.config.ccModulePath != staticFrameworkPath) {
                
                moduleLoaded = false;
                
            }
            
        } else {
            // otherwise reset path back to default
            
            KONtx.config.ccModulePath = staticFrameworkPath;
            
        }
        
    })();
	
	if (!moduleLoaded) {
		
		var modulePath = KONtx.config.ccModulePath;
		
		include(modulePath + "src/compatibility.js");
		
		if (("packager" in common) && ("link" in common.packager)) {
			
			common.packager.initialize({
				namespace: "KONtx.cc",
				actuator: modulePath + "src/actuator.js",
				manifest: modulePath + "src/manifest.js"
			});
			
		} else {
			//
			include(modulePath + "src/actuator.js");
            //
            include(modulePath + "src/manifest.js");
            // 
			include(modulePath + "src/implements.js");
			//
			KONtx.control.__defineGetter__("CaptionsOverlay", function () {
				
				delete KONtx.control.CaptionsOverlay;
				
				include(modulePath + "src/controls.js");
				
				return KONtx.control.CaptionsOverlay;
				
			});
			//
			KONtx.media.__defineGetter__("Captions", function () {
				
				delete KONtx.media.Captions;
				
				include(modulePath + "src/media.js");
				
				return KONtx.media.Captions;
				
			});
			//
			KONtx.media.__defineGetter__("CaptionsEntry", function () {
				
				delete KONtx.media.CaptionsEntry;
				
				include(modulePath + "src/media.js");
				
				return KONtx.media.CaptionsEntry;
				
			});
			//
		}
		
	}
	//	
})();
//
