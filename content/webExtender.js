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
        if (extenders && extenders.needsExecution() > 0) {
            var page = new Page(doc);
            
            this._initExtendedPage(page);            
            extenders.run(page);
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

/*** FileIO class ***/
var FileIO = {
    loadText: function(url) {
        var req = new XMLHttpRequest();
        req.open("GET", url, false); 
        req.send(null);
        
        return req.responseText;
    },
    
    loadTextFile: function(file) {
        var url = this._getFileUrl(file);
        return this.loadText(url);
    },

    loadXml: function(url) {
        if (!url) throw "url is null.";
    
        var req = new XMLHttpRequest();
        req.open("GET", url, false); 
        req.send(null);
        
        return req.responseXML;
    },

    loadXmlFile: function(file) {
        var url = this._getFileUrl(file);
        return this.loadXml(url);
    },

    saveXmlFile: function(file, dom) {
        var serializer = new XMLSerializer();
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                       .createInstance(Components.interfaces.nsIFileOutputStream);
                       
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
        serializer.serializeToStream(dom, foStream, ""); 
        foStream.close();
    },
    
    _getFileUrl: function(file) {
        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var fileHandler = ios.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        var url = fileHandler.getURLSpecFromFile(file);
        
        return url;
    }
};


/*** Marshal server component class ***/
var Marshal = {
    // Constants
    NONE: 0,
    BY_VALUE: 1,
    BY_REF: 2,
    // Change with care
    DEFAULT: 0,

    PROXY_SUFFIX: "_PROXY",

    // Private members
    _objects: new Hash(),
    _objectId: 0,

    initPage: function(page) {
        var _this = this;
        
        page.document.addEventListener("MarshalMethodCall", function(event) { _this._methodCallHandler(event); }, false);
        page.document.addEventListener("MarshalGetProxyDefinition", function(event) { _this._getProxyDefinitionHandler(event); }, false);
        
        Script.executeFile(page.document, CHROME_CONTENT_URL + "interopClient.js");
    },
    
    registerObject: function(name, obj) {
        if (!name)
            throw "name is null.";
        if (!obj)
            throw "obj is null.";
        if (obj == this)
            throw "Invalid operation.";
        
        name = String(name);
        if (this._objects[name])
            throw String.format("Object '{0}' already exists.", name);
        
        this._objects[name] = obj;
    },
    
    _methodCallHandler: function(event) {
        var elem = event.originalTarget;
        
        try {
            var objectName = elem.getAttribute("objectName");
            var methodName = elem.getAttribute("methodName");
            var resultName = elem.getAttribute("resultName");
            var argsStr = elem.getAttribute("arguments");
            
            if (!objectName)
                throw "Missing object name.";
            if (!/^[\w_$]+$/.test(methodName))
                throw "Invalid method name.";
                
            var obj = this._objects[objectName];
            
            if (!obj && elem.ownerDocument._marshalObjects)
                obj = elem.ownerDocument._marshalObjects[objectName];
            
            if (!obj)
                throw String.format("Object '{0}' is not registered.", objectName);
            
            var method = obj[methodName];
            if (!method || typeof method != "function")
                throw String.format("Method '{0}' not found.", methodName);
                
            var methodType = this._getMethodType(obj, methodName);
            if (methodType == 0)
                throw String.format("Method '{0}' cannot be marshaled.", methodName);
            
            var args = !argsStr.empty() ? argsStr.evalJSON() : null;
  
            // Call method
            var retval = method.apply(obj, args);
            
            if (retval) {
                // Process result
                switch (methodType) {
                    case Marshal.BY_VALUE:
                        elem.setAttribute("retval", Object.toJSON(retval));
                        break;
                    
                    case Marshal.BY_REF:
                        // TODO optimize code so same objects will have same id
                        var objectId = ++this._objectId;
                    
                        // Create list of methods
                        var marshalObjects = elem.ownerDocument._marshalObjects;
                        if (!marshalObjects) {
                            marshalObjects = new Hash();
                            elem.ownerDocument._marshalObjects = marshalObjects;
                        }
                        
                        var def = this._createProxyDefinition(retval);
                        
                        marshalObjects[objectId] = retval;
                        elem.setAttribute("objectId", objectId);
                        elem.setAttribute("proxyDefinition", Object.toJSON(def));
                        break;
                        
                    default:
                        throw String.format("Invalid method marshal type ({0}).", methodType);
                }
            }
        }
        catch (e) {
            elem.setAttribute("exception", Object.toJSON(e));
        }
    },
    
    _getProxyDefinitionHandler: function(event) {
        var elem = event.originalTarget;
        var objectName = elem.originalTarget.getAttribute("objectName");
        
        if (!objectName)
            throw "Missing object name.";
            
        var obj = this._objects[objectName];
        if (!obj)
            throw String.format("Object '{0}' not found.", objectName);
        
        var def = this._createProxyDefinition(obj);
        
        elem.setAttribute("proxyDefinition", Object.toJSON(def));
    },
    
    _createProxyDefinition: function(obj) {
        var def = {
            methods: new Array()
        };
        
        for (var f in obj) {
            if (typeof obj[f] == "function") {
                var type = this._getMethodType(obj, f);
            
                def.methods.push({ 
                    name: f,
                    type: type
                });
            }
        }
        
        return def;
    },

    _getMethodType: function(obj, methodName) {
        var attr = obj[methodName + this.PROXY_SUFFIX];
        
        switch (attr) {
            case null:
                return MARSHAL_DEFAULT;
            
            case Marshal.BY_VALUE:
                return Marshal.BY_VALUE;
                
            case Marshal.BY_REF:
                return Marshal.BY_REF;
                
            default:
                return Marshal.NONE;
        }
    }
};


/*** ExtenderManager class ***/
var ExtenderManager = {    
    load: function(definitionUrl) {
        if (!definitionUrl) throw "definitionUrl is null.";
        
        var definition = FileIO.loadXml(definitionUrl);
        if (definition) {
            var extendersLocationUrl = definitionUrl.replace(/\/[^\/]+$/, "/");
        
            // Read aliases definitions
            var aliasesDef = XPath.evaluateList('/webExtender/urls/alias', definition);
            var aliasesMap = new Hash();
            aliasesDef.each(function(a) { aliasesMap[a.getAttribute("name")] = a.textContent; });
            
            // Register extenders
            var scripts = XPath.evaluateList('/webExtender/extenders/*', definition);
            scripts.each(function(def) {
                    var url = new Template(def.getAttribute("url")).evaluate(aliasesMap);
                    var parser = ExtenderManager.Extenders[def.tagName];
                    
                    if (!url || url.empty())
                        throw "url not set.";
                    
                    if (!parser || typeof parser != "function")
                        throw String.format("Unsupported extender type ('{0}').", def.tagName);
                    
                    var extender = parser(def, aliasesMap);
                    WebExtender.registerExtender(url, extender);
                });
        }
    },
    
    // Called directly by WebExtender
    initPage: function(page) {
        Script.executeFile(page.document, CHROME_CONTENT_URL + "prototype.js");
        Script.executeFile(page.document, CHROME_CONTENT_URL + "webExtenderLib.js");
        Script.executeFile(page.document, CHROME_CONTENT_URL + "constants.js");
        
        Marshal.initPage(page);
    
        Script.execute(page.document, "var pageExtenders = new PageExtenderCollection();");
    },
    
    // Called directly by WebExtender
    finalizePage: function(page) {
        Script.executeJavascriptFunction(page.document, function() {
                var page = new Page();
                pageExtenders.run(page);
            });
    }
}

ExtenderManager.Extenders = {
    script: function(def, aliases) {
        var name = def.getAttribute("name");
        var type = def.getAttribute("type");
        
        if (!name || !/^[\w.\/_-~]+$/.test(name))
            throw String.format("Invalid script name ('{0}').", name);
        
        var src = extendersLocationUrl + name;
        var extender = new ScriptExtender(src, "text/javascript");
        return extender;
    },
    
    style: function(def, aliases) {
        var src = new Template(def.getAttribute("src")).evaluate(aliases);
        var extender = new StyleExtender(src);
        return extender;
    }
};

// Methods available to the client via proxy
var Chrome = {
    loadText_PROXY: Marshal.BY_VALUE,
    loadText: function(path) {
        return FileIO.loadText(CHROME_CONTENT_URL + path);
    }
};

Marshal.registerObject("Chrome", Chrome);
