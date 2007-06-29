/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is WebExtender.
 *
 * The Initial Developer of the Original Code is
 * Michal Dvorak.
 * Portions created by the Initial Developer are Copyright (C) 2007
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */
 
// IMPORTANT: Find and replace all TODOs in project otherwise extension won't work properly.
const EXTENSION_NAME = "TODO_EXTENSION_NAME";
const EXTENSION_ID = "TODO_EXTENSION_ID"; // One of the ID formats is "EXTENSION_NAME@AUTHOR". for details see firefox website.
 
var ExtenderCollection = Class.create();

// Core extension class 
var WebExtender = {
    _extenders: new ExtenderCollection(),
    _unloadHandlers: new Array(),
    
    registerExtender: function(url, extender) {
        if (!url) throw "url is null.";
        if (!extender) throw "extender is null.";
        
        this._extenders.add(url, extender);
        return extender;
    },
    
    registerCallback: function(url, callback) {
        if (!url) throw "url is null.";
        if (!callback) throw "callback is null.";
    
        var extender = PageExtender.create({
                process: function(page) {
                    callback(page);
                }
            });
        this.registerExtender(extender);
    },
    
    registerUnloadHandler: function(callback) {
        if (!callback) return;
    
        this._unloadHandlers.push(callback);
    },
    
    getDirectory: function() {
        return Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(EXTENSION_ID)
                    .getItemLocation(EXTENSION_ID);
    },
    
    getChromeUrl: function() {
        return "chrome://" + EXTENSION_ID + "/";
    },
 
    /** Object implementation **/
    
    _init: function() {
        var appcontent = document.getElementById("appcontent");
        appcontent.addEventListener("load", function(eventSrc) { this._onPageLoad(eventSrc); }, true);
        
        window.addEventListener("unload", function() { this._onUnload(); }, false);
        
        this._init = null;
    },
    
    _onUnload: function() {
        for (var i = 0; i < this._unloadHandlers.length; i++) {
            this._unloadHandlers[i]();
        }
    },
    
    _onPageLoad: function(eventSrc) {
        var doc = eventSrc.originalTarget;

        if (doc && doc.nodeName == "#document" && doc.location.href.search("http://") == 0) {
            _callExtenders(doc);
        } 
    },
    
    _callExtenders: function(doc) {
        var extenders = this._extenders.getList(doc.location.href);
        if (extenders && extenders.length > 0) {
            var page = new Page(doc);
            
            this._initExtendedPage(page);            
            extenders.process(page);
            this._finalizeExtendedPage(page);
        }
    },
    
    _initExtendedPage: function(page) {
        if (InPageExtenders && InPageExtenders.finalizePage) {
            InPageExtenders.initPage(page);
        }
    },
    
    _finalizeExtendedPage: function(page) {
        if (InPageExtenders && InPageExtenders.finalizePage) {
            InPageExtenders.finalizePage(page);
        }
    }
};

ExtenderCollection.prototype = {
    _siteMap = new Hash(),
    _cache = new Hash(),
    
    _analyzeUrl: function(url) {
        if (!url) throw "url is null.";
    
        var m = url.match(/^http:\/\/([\w.]+)(\/[*\w%.~\/]+)?(?:[?].+)?$/);
        if (!m) throw "Invalid url format.";
        
        return {
            site: m[1],
            path: (m[2] != null) ? m[2] : "DEFAULT",
            address: (this.site + this.path)
        };
    },
    
    add: function(url, e) {
        if (!e) throw "extender is null.";
        
        var analyzedUrl = this._analyzeUrl(url);
    
        var site = this._siteMap[analyzedUrl.site];
        if (!site) {
            site = new Hash();
            _siteMap[analyzedUrl.site] = site;
        }
        
        var extenders = site[analyzedUrl.path];
        if (!extenders) {
            extenders = new Array();
            site[analyzedUrl.path] = extenders;
        }
        
        extenders.push(e);
        this._cache.clear();
        return e;
    },
    
    getList: function(url) {
        var analyzedUrl = this._analyzeUrl(url);
        var extenders = this._cache[analyzedUrl.address];
        
        if (!extenders) {  
            extenders = new Array();
          
            var site = this._siteMap[analyzedUrl.site];
            if (site) {
                // Find all suitable extenders
                site.keys().each(function(k) {
                        if (k == analyzedUrl.path) {
                            extenders.push(site[k]);
                        }
                        else if (k.endsWith("*")) {
                            var partPath = k.replace(/[*]$/, "");
                            if (k.startsWith(partPath)) {
                                extenders.push(site[k]);
                            }
                        }
                    });
            }
            
            this._cache[analyzedUrl.address] = extenders;
        }
        
        return extenders;
    }
};

// Initialize WebExtender after browser has been loaded.
window.addEventListener("load", function(e) { WebExtender._init(e); }, false);


/*** Script class ***/

var Script = Object.extend(Script || {}, {
    executeFile: function(src, type, doc) {
        if (!src) throw "src is null.";
        
        if (!type) type = "text/javascript";
        if (!doc) doc = document;
        
        var e = doc.createElement("script");
        e.setAttribute("type", type);
        e.setAttribute("src", src);
        
        doc.appendChild(e);
    },

    execute: function(code, type, doc) {
        if (!code) throw "code is null.";
        
        if (!type) type = "text/javascript";
        if (!doc) doc = document;
        
        var e = doc.createElement("script");
        e.setAttribute("type", type);
        e.innerHTML = code;
        
        doc.appendChild(e);
    }
};

/*** Xml class ***/

var Xml = Object.extend(Xml || {}, {
    load: function(url) {
        if (!url) throw "url is null.";
    
        var req = new XMLHttpRequest();
        req.open("GET", url, false); 
        req.send(null);
        
        return req.responseXML;
    },

    loadFile: function(file) {
        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var fileHandler = ios.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        var url = fileHandler.getURLSpecFromFile(file);

        return Xml.load(url);
    },

    saveFile: function(file, dom) {
        var serializer = new XMLSerializer();
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                       .createInstance(Components.interfaces.nsIFileOutputStream);
                       
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
        serializer.serializeToStream(dom, foStream, ""); 
        foStream.close();
    }
};
