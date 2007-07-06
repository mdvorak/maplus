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

var ExtenderCollection = Class.create();

ExtenderCollection.prototype = {
    initialize: function() {
        this._generic = new Array();
        this._siteMap = new Hash();
        this._cache = new Hash();
    },
    
    _analyzeUrl: function(url) {
        if (!url) throw "url is null.";

        var m = url.match(/^http:\/\/([\w.]+)(\/[*\w%.~\/]+)?(?:[?].+)?$/);
        if (!m) return null;
        
        var site = m[1];
        var path = (m[2] != null) ? m[2] : "DEFAULT";
        
        return {
            site: site,
            path: path,
            address: (site + path)
        };
    },
    
    add: function(url, e) {
        if (!e) throw "extender is null.";
        
        // Clear cache
        this._cache.remove();
        
        // Special case - generic extender
        if (url == "*") {
            this._generic.push(e);
            return e;
        }
        
        var analyzedUrl = this._analyzeUrl(url);
        if (!analyzedUrl)
            throw "Invalid url format.";
    
        var site = this._siteMap[analyzedUrl.site];
        if (!site) {
            site = new Hash();
            this._siteMap[analyzedUrl.site] = site;
        }
        
        var extenders = site[analyzedUrl.path];
        if (!extenders) {
            extenders = new Array();
            site[analyzedUrl.path] = extenders;
        }
        
        extenders.push(e);
        return e;
    },
    
    getList: function(url) {
        var analyzedUrl = this._analyzeUrl(url);
        if (!analyzedUrl)
            return null;
        
        var extenders = this._cache[analyzedUrl.address];
        
        if (!extenders) {  
            var site = this._siteMap[analyzedUrl.site];
            if (site) {
                extenders = new PageExtenderCollection();
                
                // Add generic extenders
                this._generic.each(function(e) { extenders.add(e); });
            
                // Find all suitable extenders
                site.keys().each(function(k) {
                        var add = false;
                        
                        if (k == analyzedUrl.path) {
                            add = true;
                        }
                        else if (k.endsWith("*")) {
                            var partPath = k.replace(/[*]$/, "");
                            if (k.startsWith(partPath)) {
                                add = true;
                            }
                        }
                        
                        if (add)
                            site[k].each(function(e) { extenders.add(e); });
                    });
                    
                this._cache[analyzedUrl.address] = extenders;
            }
        }
        
        return extenders;
    }
};

// Core extension class 
var WebExtender = {
    _extenders: new ExtenderCollection(),
    _unloadHandlers: new Array(),
    _staticContent: new Object(),
    
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
    
    getStaticContent: function() {
        return this._staticContent;
    },
    
    getDirectory: function() {
        return Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(EXTENSION_ID)
                    .getItemLocation(EXTENSION_ID);
    },
    
    getChromeUrl: function() {
        return "chrome://" + EXTENSION_NAME + "/";
    },
    
    getContentUrl: function() {
        return this.getChromeUrl() + "content/";
    },
 
    /** Object implementation **/
    
    _init: function() {
        var _this = this;
    
        var appcontent = document.getElementById("appcontent");        
        appcontent.addEventListener("load", function(event) { _this._onPageLoad(event); }, true);
        
        window.addEventListener("unload", function() { _this._onUnload(); }, false);
        
        this._init = null;
    },
    
    _onUnload: function() {
        for (var i = 0; i < this._unloadHandlers.length; i++) {
            this._unloadHandlers[i]();
        }
    },
    
    _onPageLoad: function(event) {
        var doc = event.originalTarget;

        if (doc && doc.nodeName == "#document" && doc.location.href.search("http://") == 0) {
            this._callExtenders(doc);
        } 
    },
    
    _callExtenders: function(doc) {
        var extenders = this._extenders.getList(doc.location.href);
        if (extenders && extenders.significantSize() > 0) {
            var page = new Page(doc);
            
            this._initExtendedPage(page);            
            extenders.process(page, this.getStaticContent());
            this._finalizeExtendedPage(page);
        }
    },
    
    _initExtendedPage: function(page) { 
        if (ExtenderManager && ExtenderManager.initPage) {
            ExtenderManager.initPage(page);
        }
    },
    
    _finalizeExtendedPage: function(page) {
        if (ExtenderManager && ExtenderManager.finalizePage) {
            ExtenderManager.finalizePage(page);
        }
    }
};

// Initialize WebExtender after browser has been loaded.
window.addEventListener("load", function(e) { WebExtender._init(e); }, false);


/*** Script class ***/

var Script = Object.extend(Script || {}, {
    executeFile: function(doc, src, type) {
        if (!doc) throw "doc is null.";
        if (!src) throw "src is null.";
        if (!type) type = "text/javascript";
        
        var e = doc.createElement("script");
        e.setAttribute("type", type);
        e.setAttribute("src", src);
        
        doc.body.appendChild(e);
    },

    execute: function(doc, code, type) {
        if (!doc) throw "doc is null.";
        if (!code) throw "code is null.";
        if (!type) type = "text/javascript";
        
        var e = doc.createElement("script");
        e.setAttribute("type", type);
        e.innerHTML = code;
        
        doc.body.appendChild(e);
    },
    
    // This will execute function in the dom of doc
    executeJavascriptFunction: function(doc, func) {
        if (!doc) throw "doc is null.";
        if (!func) throw "func is null.";
        
        this.execute(doc, "(" + func.toString() + ")();", "text/javascript");
    }
});

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
});


/*** ExtenderManager class ***/

var ExtenderManager = {    
    load: function(definitionUrl) {
        if (!definitionUrl) throw "definitionUrl is null.";
        
        var definition = Xml.load(definitionUrl);
        if (definition) {
            var extendersLocationUrl = definitionUrl.replace(/\/[^\/]+$/, "/");
            var _this = this;
        
            // Read aliases definitions
            var aliasesDef = XPath.evaluateList('/webExtender/urls/alias', definition);
            var aliasesMap = new Hash();
            aliasesDef.each(function(a) { aliasesMap[a.getAttribute("name")] = a.textContent; });
            
            // Process stylesheets
            var stylesheets = XPath.evaluateList('/webExtender/stylesheets/style', definition);
            stylesheets.each(function(s) { _this._processStyle(aliasesMap, s); });

            // Process scripts
            var scripts = XPath.evaluateList('/webExtender/extenders/script', definition);
            scripts.each(function(s) { _this._processScript(extendersLocationUrl, aliasesMap, s); });
        }
        
        this._init = null;
    },
    
    // Called directly by WebExtender
    initPage: function(page) {
        Script.executeFile(page.document, WebExtender.getContentUrl() + "prototype.js");
        Script.executeFile(page.document, WebExtender.getContentUrl() + "webExtenderLib.js");
        Script.executeFile(page.document, WebExtender.getContentUrl() + "constants.js");
    
        Script.execute(page.document, "var pageExtenders = new PageExtenderCollection();");
    },
    
    // Called directly by WebExtender
    finalizePage: function(page) {
        var transport = page.document.createElement("WebExtenderTransport");
        transport.setAttribute("id", "id_WebExtenderTransport");
        transport.pageObject = page;
        transport.staticContent = WebExtender.getStaticContent();
        page.document.body.appendChild(transport);
        
        Script.executeJavascriptFunction(page.document, function() {
                var eTransport = $XF('\\WebExtenderTransport[@id = "id_WebExtenderTransport"]');
                if (!eTransport.pageObject)
                    throw "Unable to get page object.";
                if (eTransport.pageObject.document != document)
                    throw "Invalid page object.";
                if (!eTransport.staticContent)
                    throw "Unable to get static content.";
                
                pageExtenders.process(eTransport.pageObject, eTransport.staticContent);
            });
    },
    
    _processStyle: function(aliasesMap, s) {
        var url = new Template(s.getAttribute("url")).evaluate(aliasesMap);
        var src = new Template(s.getAttribute("src")).evaluate(aliasesMap);
        var weak = s.getAttribute("weak");
        
        if (url && src) {                    
            var extender = new StyleExtender(src);
            extender.weak = (weak != null && (weak.toLowerCase() == "true" || parseInt(weak) > 0));
            WebExtender.registerExtender(url, extender);
        }
    },
    
    _processScript: function(extendersLocationUrl, aliasesMap, s) {
        var url = new Template(s.getAttribute("url")).evaluate(aliasesMap);
        var name = s.getAttribute("name");
        var weak = s.getAttribute("weak");
        var scope = s.getAttribute("scope");
        
        if (url && name) {
            var src = extendersLocationUrl + name;
            
            switch (scope) {
                case "extension":
                    var js = loadText(src);
                    if (js) {
                        eval(js);
                    }
                    break;
                
                case "page":
                case null:
                    var extender = new ScriptExtender(src, "text/javascript");
                    extender.weak = (weak != null && (weak.toLowerCase() == "true" || parseInt(weak) > 0));
                    WebExtender.registerExtender(url, extender);
                    break;
                
                default:
                    throw String.format("Invalid scope ({0}).", scope);
            }
        }
    }
};
