/***********************************************************************************************************************
This file handles fulfilling any compatibility requirements and dependencies and then loading either the package, if the
common.packager is available, or lazily loading each required file manually using namespace getters. The revision can be
found in actuator.js as instanceVersion.
***********************************************************************************************************************/

/** TODO ***************************************************************************************************************

verify that the payload goes through (onTransportButtonPress)
    currently not required
create option list for languages (onCaptionListRequest)
    decide on visual terminology
    decide on back/cancel behavior
    decide on initial select behavior

***********************************************************************************************************************/

/** NOTES **************************************************************************************************************

Under "KONtx.media.CaptionsEntry" remove the first line containing "KONtx.mediaplayer.initialize();"

***********************************************************************************************************************/

/** Reference Documentation ********************************************************************************************

TTML spec: http://www.w3.org/TR/2010/REC-ttaf1-dfxp-20101118/
TTML note: http://www.w3.org/TR/2013/NOTE-ttml10-sdp-us-20130205/
TTML framerate proposal: http://www.w3.org/wiki/TTML/changeProposal004
https://www.federalregister.gov/articles/2012/03/30/2012-7247/closed-captioning-of-internet-protocol-delivered-video-programming-implementation-of-the#p-249
https://www.federalregister.gov/articles/2013/07/02/2013-15718/closed-captioning-of-internet-protocol-delivered-video-programming-implementation-of-the

***********************************************************************************************************************/
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
