CC Module
========

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
    * a parsing routine can be used for format the ttml data
    
    captions = new KONtx.media.Captions();
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

