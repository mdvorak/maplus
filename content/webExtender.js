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
 
 const EXTENSION_NAME = "TODO";
 const EXTENSION_ID = "TODO@TODO";
 
 var WebExtender = {
    _siteMap: new Hash(),
    _unloadHandlers: new Array(),

    getExtenders: function(url, create) {
        if (!callback) throw "url is null.";
    
        var m = url.match(/^http:\/\/([\w.]+)(\/[\w%.~\/]+)?(?:[?].+)?$/);
        if (!m) throw "Invalid url format.";
        
        var site = m[1];
        var path = (m[2] != null) ? m[2] : "DEFAULT";
    
        var site = _siteMap[site];
        if (!site) {
            if (!create) return null;
        
            site = new Hash();
            _siteMap[site] = site;
        }
        
        var urlExtenders = site[pageName];
        if (!urlExtenders) {
            if (!create) return null;
            
            urlExtenders = new Array();
            site[pageName] = urlExtenders;
        }
        
        return urlExtenders;
    },
    
    registerExtender: function(url, extender) {
        if (!extender) throw "extender is null.";
    
        var extenders = this.getExtenders(url, true);
        extenders.push(extender);
        return extender;
    },
    
    registerCallback: function(url, callback) {
        if (!callback) throw "callback is null.";
    
        var extender = Object.extend(new PageExtender(), {
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
    
    init: function() {
        var appcontent = document.getElementById("appcontent");
        appcontent.addEventListener("load", this.onPageLoad, true);
        
        window.addEventListener("unload", function() { this.onUnload(); }, false);
        
        this.init = null;
    },
    
    onUnload: function() {
        for (var i = 0; i < this._unloadHandlers.length; i++) {
            this._unloadHandlers[i]();
        }
    },
    
    onPageLoad: function(eventSrc) {
        var doc = eventSrc.originalTarget;

        if (doc && doc.nodeName == "#document" && doc.location.href.search("http://") == 0) {
            callExtenders(doc);
        } 
    },
    
    callExtenders: function(doc) {
        var extenders = this.getExtenders(doc.location.href, false);
        if (extenders) {
            var page = new Page(doc);
            
            extenders.process(page);
        }
    }
};

window.addEventListener("load", function(e) { WebExtender.init(e); }, false);

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
