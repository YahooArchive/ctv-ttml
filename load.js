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
