CC Module
========

ClosedCaptioning is supplied as an add-on module that will be embedded within a given application. It will provide the
ability to display TTML captions over streaming video.

See the full documentation here:
http://developer.yahoo.com/connectedtv/kontxapiref/YCTV_KONTX_CC.html

------------------------------------------------------------------------------------------------------------------------
Structure of the module
------------------------------------------------------------------------------------------------------------------------
    
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

------------------------------------------------------------------------------------------------------------------------
Obtaining the module
------------------------------------------------------------------------------------------------------------------------
You will need to grab a copy of the module source. You can download it from github at the following location:
[https://github.com/yahoo/ctv-ttml](https://github.com/yahoo/ctv-ttml)

------------------------------------------------------------------------------------------------------------------------
Integrating the module
------------------------------------------------------------------------------------------------------------------------    
    1. Add the ClosedCaptioning module
        // this can be put anywhere inside the Contents directory of an app
        Contents/Javascript/cc
    
    2. Specify the local application path to the CC module
        KONtx.config.ccModulePath = "Javascript/cc";
    
    3. Load the CC module
        // typically this is loaded in the init.js
        include("Framework/kontx/[REVISION]/src/all.js");
        // this must be loaded after the framework is loaded
        include("Javascript/cc/load.js");

------------------------------------------------------------------------------------------------------------------------
Optional debugging tools
------------------------------------------------------------------------------------------------------------------------    
    /*
    setting this will shave off the specified number of seconds from the begin and end times which allows for the
    arbitrary testing of content from any point in the time sequence
    example: to test entries that start at 20 minutes use (60 * 20)
    note: common.debug.level must be set to >= 2, common.debug.level = 2; if (common.debug.level[2]) { [...] }
    */
    KONtx.cc.config.debug_timeSignatureOffset = Integer;
    
    /*
    a ttml document uri that will be force loaded instead of the uri provided by the video
    note: common.debug.level must be set to >= 2, common.debug.level = 2; if (common.debug.level[2]) { [...] }
    */
    KONtx.cc.config.debug_ttmlLocation: String,

------------------------------------------------------------------------------------------------------------------------
Wiring up the code
------------------------------------------------------------------------------------------------------------------------
A few changes will need made to your app to get captions integrated

    1. A "Captions" object will need added to each "PlaylistEntry" object
    2. A "CaptionsEntry" object will need added to each "Captions" object
    3. TTML data may need formatted to meet a specific schema

------------------------------------------------------------------------------------------------------------------------    
Wiring up the code - Method 1
------------------------------------------------------------------------------------------------------------------------
    var captions = new KONtx.media.Captions();
    var captionsEntries = [];
    captionsEntries.push(new KONtx.media.CaptionsEntry({ url: "http://my.video.com/cnt5.ttml", lang: "en-US" }));
    captionsEntries.push(new KONtx.media.CaptionsEntry({ url: "http://my.video.com/cnt6.ttml", lang: "es-MX" }));
    captions.addEntries(captionsEntries);
    
    var playlist = new KONtx.media.Playlist();
    var playlistEntries = [];
    playlistEntries.push(new KONtx.media.PlaylistEntry({ url: "http://my.video.com/content3.mp4", bitrate: 300, captions: captions }));
    playlist.addEntries(playlistEntries);

------------------------------------------------------------------------------------------------------------------------    
Wiring up the code - Method 2
------------------------------------------------------------------------------------------------------------------------
    var playlist = new KONtx.media.Playlist({
        entries: [
            new KONtx.media.PlaylistEntry({
                url: "http://my.video.com/content3.mp4",
                bitrate: 300,
                captions = new KONtx.media.Captions({
                    entries: [
                        new KONtx.media.CaptionsEntry({ url: "http://my.video.com/cnt5.ttml", lang: "en-US" }),
                        new KONtx.media.CaptionsEntry({ url: "http://my.video.com/cnt6.ttml", lang: "es-MX" }),
                    ],
                })
            }),
        ],
    });

------------------------------------------------------------------------------------------------------------------------
Using the default parser
------------------------------------------------------------------------------------------------------------------------
If your ttml does not contain any nested nodes under the paragraphs then test the default.

    new KONtx.media.Captions();


The below performs the same as the above.

    new KONtx.media.Captions({
        parser: function (url, callback) {
            var query = "select * from ctv.ttml.normalize where url='" + url + "'";
            KONtx.cc.fetch({
                url: "http://ctv.yql.yahooapis.com/v1/public/yql?q=" + query + "&format=json",
                success: function (xhr) {
                    var json = JSON.parse(xhr.responseText).query.results;
                    callback(json);
                }
            });
        },
    });

------------------------------------------------------------------------------------------------------------------------
Using a custom parser
------------------------------------------------------------------------------------------------------------------------
If your ttml contains any nested nodes under the paragraphs you will need to process the document to conform to the
renderer scheme.

This platform cannot support nested paragraph content so we need to flatten the "paragraph" tags into single entry nodes
that contain only string text. The first thought would be to convert the XML to JSON but simply doing this will cause us
to loose the hierarchy of the tag structure. This is an inate problem when converting XML to JSON. To overcome this we
can process the XML and build our own JSON structure using ODT(Open Data Tables) and YQL(Yahoo Query Language).

The following ODT is a reference to demonstrate how to perform the requirements defined above.

The following ODT can not be used in production by your app and the app will be flagged and disallowed from publication
if the following ODT store is referenced within your app. In order to use this solution you will need to copy the
provided ODT to your own data table and use that to publish with. This is due to the rate limits that are applied to
each ODT.

    new KONtx.media.Captions({
        parser: function (url, callback) {
            // add your custom data table location (http://your table, store://your table)
            var dataTable = "http://datatables.org/ctv/ttml/normalize/ctv.ttml.normalize.xml";
            var query = "use '" + dataTable + "' as ttml; select * from ttml where url='" + url + "'";  
              
            KONtx.cc.fetch({  
                url: "http://query.yahooapis.com/v1/public/yql?q=" + query + "&format=json",  
                success: function (xhr) {  
                    var json = JSON.parse(xhr.responseText).query.results;  
                    if (json.tt) {  
                        callback(json);  
                    }  
                }  
            }); 
        },
    })

The ODT can be tested using the YQL console by inserting your ttml location. All of these give the same results and are provided to showcase different approaches.
    
	[http://developer.yahoo.com/yql/console/?q=use 'http://datatables.org/ctv/ttml/normalize/ctv.ttml.normalize.xml'; select * from ctv.ttml.normalize where url='<TTML LOCATION>'](http://developer.yahoo.com/yql/console/?q=use%20'http%3A%2F%2Fdatatables.org%2Fctv%2Fttml%2Fnormalize%2Fctv.ttml.normalize.xml'%3B%20select%20*%20from%20ctv.ttml.normalize%20where%20url%3D'%3CTTML%20LOCATION%3E')
	
	[http://developer.yahoo.com/yql/console/?q=use 'http://datatables.org/ctv/ttml/normalize/ctv.ttml.normalize.xml' as ttml; select * from ttml where url='<TTML LOCATION>'](http://developer.yahoo.com/yql/console/?q=use%20'http%3A%2F%2Fdatatables.org%2Fctv%2Fttml%2Fnormalize%2Fctv.ttml.normalize.xml'%20as%20ttml%3B%20select%20*%20from%20ttml%20where%20url%3D'%3CTTML%20LOCATION%3E')
	
	[http://developer.yahoo.com/yql/console/?q=select * from ctv.ttml.normalize where url='<TTML LOCATION>'&env=store://datatables.org/alltableswithkeys](http://developer.yahoo.com/yql/console/?q=select%20*%20from%20ctv.ttml.normalize%20where%20url%3D'%3CTTML%20LOCATION%3E'&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys)


------------------------------------------------------------------------------------------------------------------------
TTML Styling
------------------------------------------------------------------------------------------------------------------------
Styles are supported but not in a cascade style format as suggested by the standard. This again, is due to rendering
constraints imposed by the platform itself. In addition to this the renderer does not support nested paragraph nodes. So
any styles associated with nested span tags included within a paragraph tag will be ignored as the renderer must receive
a flattened structure for each paragraph including only a string. In order to accommodate this we apply the following
rules to paragraph entries.

    1. apply any style declared on the body tag
    2. apply any style declared on a default region declared by the body tag
    3. apply any style declared on a region declared by the paragraph tag
    4. apply any style declared on a paragraph
    5. apply any inline style properties declared on a paragraph tag

------------------------------------------------------------------------------------------------------------------------
TTML Time signatures
------------------------------------------------------------------------------------------------------------------------
Each paragraph object must provide a "begin" and an "end" property. The properties must provide a time signature to
determine when to show and hide the content. The time signature can be in HH:MM:SS:MSS(Milliseconds) or
HH:MM:SS:FR(Framerate). Note that if a time signature is provided the document root must provide a "frameRate" property.
Below are examples of both approaches:
    
    // Framerate
    // This format requires a "frameRate" property to be provided at the root "tt" object
    "begin": "00:00:22:28",
    "end": "00:00:27:07",
    
    // Milliseconds
    "begin": "00:00:01.034",
    "end": "00:00:02:340",

------------------------------------------------------------------------------------------------------------------------
Description of the required JSON Schema
------------------------------------------------------------------------------------------------------------------------
    * The root entry must be a "tt" object.
    * The "tt" object can provide a "frameRate" string.
    * The "tt" object must provide a "head" object.
    * The "head" object must provide a "styling" object.
    * The "styling" object must provide a "style" node.
    * The "style" node can be an object.
    * The "style" node can be an array.
    * The "style" object can contain
    * The "style" object can contain a "backgroundColor" string.
    * The "style" object can contain a "color" string.
    * The "style" object can contain a "extent" string.
    * The "extent" string can accept "width% height%"
    * The "style" object can contain a "fontFamily" string.
    * The "fontFamily" string will be matched to the closest system font.
    * The "style" object can contain a "fontStyle" string.
    * The "style" object can contain a "fontSize" string.
    * The "fontSize" string can accept "80%", "80px".
    * The "style" object can contain a "fontWeight" string.
    * The "style" object can contain a "id" string.
    * The "style" object can contain a "paddingTop" string.
    * The "paddingTop" string can accept "2px".
    * The "style" object can contain a "paddingRight" string.
    * The "paddingRight" string can accept "2px".
    * The "style" object can contain a "paddingBottom" string.
    * The "paddingBottom" string can accept "2px".
    * The "style" object can contain a "paddingLeft" string.
    * The "paddingLeft" string can accept "2px".
    * The "style" object can contain a "opacity" string.
    * The "opacity" string can accept "0.0" - "1.0".
    * The "style" object can contain a "origin" string.
    * The "origin" string can accept "horizontal% vertical%".
    * The "style" object can contain a "textAlign" string.
    * The "style" object can contain a "textOutline" string.
    * The "textOutline" string can accept "#000000 2px".
    * The "head" object must provide a "layout" object.
    * The "layout" object must provide a "region" node.
    * The "region" node can be an object.
    * The "region" node can be an array.
    * The "tt" object must provide a "body" object.
    * The "body" object can provide a "style" string.
    * The "body" object can provide a "region" string.
    * The "body" object must provide a "div" object.
    * The "div" object must provide a "p" array.
    * The "p" array must provide array entries.
    * The array entry must be an object.
    * The array entry must contain a "content" string.
    * The "content" string can contain newline character(\n).
    * The array entry must provide a "begin" property.
    * The "begin" string can accept millisecond signatures "HH:MM:SS:MSS".
    * The "begin" string can accept framerate signatures "HH:MM:SS:FR".
    * The framerate signature must use tt.frameRate.
    * The array entry must provide an "end" property.
    * The "end" string can accept millisecond signature "HH:MM:SS:MSS".
    * The "end" string can accept framerate signatures "HH:MM:SS:FR".
    * The framerate signature must use tt.frameRate.
    * The array entry can provide an "extent" property.
    * The "extent" string can accept "width% height%".
    * The array entry can provide an "origin" property.
    * The "origin" string can accept "horizontal% vertical%".
    * The array entry can provide an "region" property.
    * The array entry can provide an "style" property.

------------------------------------------------------------------------------------------------------------------------
JSON Schema
------------------------------------------------------------------------------------------------------------------------
The following JSON structure is the schema that the interpreter understands. Not adhering to this schema will result in
the non-displayal of TTML data.

    {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "description": "TTML as JSON for Yahoo Connected TV",
        "type": "object",
        "required": [
            "tt"
        ],
        "properties": {
            "tt": {
                "type": "object",
                "required": ["head", "body"],
                "properties": {
                    "lang": {
                        "type": "string"
                    },
                    "frameRate": {
                        "type": "number"
                    },
                    "head": {
                        "type": "object",
                        "required": ["layout", "styling"],
                        "properties": {
                            "styling": {
                                "type": "object",
                                "required": ["style"],
                                "properties": {
                                    "style": {
                                        "type": ["object", "array"],
                                        "oneOf": [
                                            {
                                                "$ref": "#/definitions/singleEntryStyle"
                                            },
                                            {
                                                "$ref": "#/definitions/multiEntryStyle"
                                            }
                                        ]
                                    }
                                }
                            },
                            "layout": {
                                "type": "object",
                                "required": ["region"],
                                "properties": {
                                    "region": {
                                        "type": ["object", "array"],
                                        "oneOf": [
                                            {
                                                "$ref": "#/definitions/singleEntryRegion"
                                            },
                                            {
                                                "$ref": "#/definitions/multiEntryRegion"
                                            }
                                        ]
                                    }
                                }
                            }
                        }
                    }
                },
                "body": {
                    "type": "object",
                    "required": ["div"],
                    "properties": {
                        "region": {
                            "type": "string"
                        },
                        "style": {
                            "type": "string"
                        },
                        "div": {
                            "type": "object",
                            "required": ["p"],
                            "properties": {
                                "p": {
                                    "type": "array",
                                    "items": {
                                        "type": "object",
                                        "required": ["content", "begin", "end"],
                                        "properties": {
                                            "content": {
                                                "type": "string"
                                            },
                                            "begin": {
                                                "type": "string"
                                            },
                                            "end": {
                                                "type": "string"
                                            },
                                            "extent": {
                                                "type": "string"
                                            },
                                            "origin": {
                                                "type": "string"
                                            },
                                            "region": {
                                                "type": "string"
                                            },
                                            "style": {
                                                "type": "string"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "definitions": {
            "singleEntryStyle": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "backgroundColor": {
                        "type": "string"
                    },
                    "color": {
                        "type": "string"
                    },
                    "extent": {
                        "type": "string"
                    },
                    "fontFamily": {
                        "type": "string"
                    },
                    "fontStyle": {
                        "type": "string"
                    },
                    "fontSize": {
                        "type": "string"
                    },
                    "fontWeight": {
                        "type": "string"
                    },
                    "paddingTop": {
                        "type": "string"
                    },
                    "paddingRight": {
                        "type": "string"
                    },
                    "paddingBottom": {
                        "type": "string"
                    },
                    "paddingLeft": {
                        "type": "string"
                    },
                    "opacity": {
                        "type": "string"
                    },
                    "origin": {
                        "type": "string"
                    },
                    "textAlign": {
                        "type": "string"
                    },
                    "textOutline": {
                        "type": "string"
                    }
                }
            },
            "multiEntryStyle": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/singleEntryStyle"
                }
            },
            "singleEntryRegion": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string"
                    },
                    "backgroundColor": {
                        "type": "string"
                    },
                    "color": {
                        "type": "string"
                    },
                    "extent": {
                        "type": "string"
                    },
                    "fontFamily": {
                        "type": "string"
                    },
                    "fontStyle": {
                        "type": "string"
                    },
                    "fontSize": {
                        "type": "string"
                    },
                    "fontWeight": {
                        "type": "string"
                    },
                    "paddingTop": {
                        "type": "string"
                    },
                    "paddingRight": {
                        "type": "string"
                    },
                    "paddingBottom": {
                        "type": "string"
                    },
                    "paddingLeft": {
                        "type": "string"
                    },
                    "opacity": {
                        "type": "string"
                    },
                    "origin": {
                        "type": "string"
                    },
                    "textAlign": {
                        "type": "string"
                    },
                    "textOutline": {
                        "type": "string"
                    },
                    "style": {
                        "type": "string"
                    }
                }
            },
            "multiEntryRegion": {
                "type": "array",
                "items": {
                    "$ref": "#/definitions/singleEntryRegion"
                }
            }
        }
    }

------------------------------------------------------------------------------------------------------------------------
JSON Structure
------------------------------------------------------------------------------------------------------------------------
    "tt": {
        "lang": "en",
        "frameRate": "30",
        "head": {
            "styling": {
                "style": [
                    {
                        "backgroundColor": "transparent",
                        "color": "#FFCC00",
                        "extent": "80% 15%",
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
                    {
                        "backgroundColor": "black",
                        "id": "AnotherStyle",
                    },
                ],
            },
            "layout": {
                "region": [
                    {
                        "id": "DefaultRegion",
                        "style": "DefaultStyle",
                    },
                    {
                        "backgroundColor": "yellow",
                        "id": "AnotherRegion",
                    },
                ],
                
            },
        },
        "body": {
            "region": "DefaultRegion",
            "style": "DefaultStyle",
            "div": {
                "p": [
                    {
                        "content": "Line 1\nLine 2",
                        "begin": "00:00:01.034",
                        "end": "00:00:02:340",
                        "extent": "67.5% 5.33%",
                        "origin": "15% 79.33%",
                        "region": "DefaultRegion",
                        "style": "AnotherStyle",
                    },
                ],
            },
        },
    };

------------------------------------------------------------------------------------------------------------------------
License
------------------------------------------------------------------------------------------------------------------------
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
