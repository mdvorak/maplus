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
        this._position = 0;
        this._generic = new Array();
        this._siteMap = new Hash();
        this._cache = new Hash();
        this._validSites = new Array();
    },
    
    _analyzeUrl: function(url) {
        if (url == null) throw new ArgumentNullException("url");

        var m = url.match(/^http:\/\/([\w.]+)(\/[*\w%.~\/]+)?(?:[?](.+))?$/);
        if (m == null) return null;
        
        var site = m[1];
        var path = (m[2] != null) ? m[2] : "DEFAULT";
        var args = new Hash();
        
        if (m[3] != null) {
            $A(m[3].match(/[^&=]+=[^&=]+/g)).each(function(a) {
                var pair = a.split("=");
                args[pair[0]] = pair[1];
            });
        }
     
        return {
            site: site,
            path: path,
            address: (site + path),
            args: args
        };
    },
    
    add: function(url, extender, asLibrary) {
        if (extender == null) throw new ArgumentNullException("extender");
        
        // Clear cache
        this._cache.remove();
        
        // Because generic extenders are in different list, we needs to track the real order
        extender._ExtenderCollection_position = this._position++;
        extender._ExtenderCollection_library = asLibrary;
        
        // Special case - generic extender
        if (url == "*") {
            this._generic.push(extender);
            this._validSites = null;
            return extender;
        }
        
        var analyzedUrl = this._analyzeUrl(url);
        if (analyzedUrl == null)
            throw new ArgumentException("url", url, "Invalid url format.");
    
        // Speed optimization
        if (this._validSites != null && this._validSites.indexOf(analyzedUrl.site) < 0) {
            this._validSites.push(analyzedUrl.site);
        }
    
        // Add extender to the collection
        var site = this._siteMap[analyzedUrl.site];
        if (site == null) {
            site = new Hash();
            this._siteMap[analyzedUrl.site] = site;
        }
        
        var extenders = site[analyzedUrl.path];
        if (extenders == null) {
            extenders = new Array();
            site[analyzedUrl.path] = extenders;
        }
        
        extenders.push(extender);
        return extender;
    },
    
    getList: function(url) {
        var analyzedUrl = this._analyzeUrl(url);
        if (analyzedUrl == null)
            return null;
        
        // Speed optimization
        if (this._validSites != null && this._validSites.indexOf(analyzedUrl.site) < 0)
            return null;
        
        var extenders = this._cache[analyzedUrl.address];
        
        if (extenders == null) {  
            var site = this._siteMap[analyzedUrl.site];
            if (site != null) {
                // We need to sort extenders
                var tmpList = new Array();
                
                // Add generic extenders
                this._generic.each(function(e) { tmpList.add(e); });
            
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
                            site[k].each(function(e) { tmpList.push(e); });
                    });
                    
                // Sort them
                tmpList.sort(function(a, b) { return a._ExtenderCollection_position - b._ExtenderCollection_position; });
                
                // Create collection
                extenders = new PageExtenderCollection();
                tmpList.each(function(e) { extenders.add(e, e._ExtenderCollection_library); });
                    
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
    
    registerExtender: function(url, extender, asLibrary) {
        if (url == null) throw new ArgumentNullException("url");
        if (extender == null) throw new ArgumentNullException("extender");
        
        this._extenders.add(url, extender, asLibrary);
        return extender;
    },
    
    registerCallback: function(url, callback) {
        if (url == null) throw new ArgumentNullException("url");
        if (callback == null) throw new ArgumentNullException("callback");
    
        var extender = PageExtender.create({
                process: function(page) {
                    callback(page);
                }
            });
        this.registerExtender(extender);
    },
    
    registerUnloadHandler: function(callback) {
        if (callback == null) return;
    
        this._unloadHandlers.push(callback);
    },
 
    getDirectory: function() {
        return Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(EXTENSION_ID)
                    .getItemLocation(EXTENSION_ID);
    },
     
    /** Object implementation **/
    init: function(win) {
        var _this = this;
    
        var appcontent = win.document.getElementById("appcontent");        
        appcontent.addEventListener("load", function(event) { _this._onPageLoad(event); }, true);
        
        win.addEventListener("unload", function() { _this._onUnload(); }, false);
        
        this._init = null;
    },
    
    _onUnload: function() {
        for (var i = 0; i < this._unloadHandlers.length; i++) {
            this._unloadHandlers[i]();
        }
    },
    
    _onPageLoad: function(event) {
        var doc = event.originalTarget;

        if (doc && doc.nodeName == "#document" 
                && doc.location 
                && doc.location.href 
                && doc.location.href.search("http://") == 0) {
            this._callExtenders(doc);
        } 
    },
    
    _callExtenders: function(doc) {
        var extenders = this._extenders.getList(doc.location.href);
        if (extenders && extenders.needsExecution()) {
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

/*** DocumentHelper class ***/
var DocumentHelper = {
    createDocument: function(namespaceURI, qualifiedName, doctype) {
        if (namespaceURI == null) namespaceURI = "";
        if (qualifiedName == null) qualifiedName = "";
    
        var doc = Components.classes["@mozilla.org/xul/xul-document;1"]
                            .createInstance()
                            .implementation
                            .createDocument(namespaceURI, qualifiedName, doctype);
        return doc;
    }
};

/*** Script class ***/
var Script = Object.extend(Script || {}, {
    DEFAULT_CHARSET: "UTF-8",

    executeFile: function(doc, src, type, charset) {
        if (doc == null) throw new ArgumentNullException("doc");
        if (src == null) throw new ArgumentNullException("src");
        if (type == null) type = "text/javascript";
        if (charset == null) charset = Script.DEFAULT_CHARSET;
        
        var e = doc.createElement("script");
        e.setAttribute("type", type);
        e.setAttribute("src", src);
        e.setAttribute("charset", charset);
        
        doc.body.appendChild(e);
    },

    execute: function(doc, code, type, charset) {
        if (doc == null) throw new ArgumentNullException("doc");
        if (code == null) throw new ArgumentNullException("code");
        if (type == null) type = "text/javascript";
        if (charset == null) charset = Script.DEFAULT_CHARSET;
        
        var e = doc.createElement("script");
        e.setAttribute("type", type);
        e.setAttribute("charset", charset);
        e.innerHTML = code;
        
        doc.body.appendChild(e);
    },
    
    // This will execute function in the dom of doc
    executeJavascriptFunction: function(doc, func, charset) {
        if (doc == null) throw new ArgumentNullException("doc");
        if (func == null) throw new ArgumentNullException("func");
        
        this.execute(doc, "(" + func.toString() + ")();", "text/javascript", charset);
    }
});

/*** FileIO class ***/
var FileIO = {
    loadText: function(url) {
        if (url == null) throw new ArgumentNullException("url");
        
        var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .createInstance()
                            .QueryInterface(Components.interfaces.nsIXMLHttpRequest);
        req.open("GET", url, false); 
        req.send(null);
        
        return req.responseText;
    },
    
    loadTextFile: function(file) {
        if (file == null) throw new ArgumentNullException("file");
        
        var url = this._getFileUrl(file);
        return this.loadText(url);
    },

    loadXml: function(url) {
        if (url == null) throw new ArgumentNullException("url");
    
        var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                            .createInstance()
                            .QueryInterface(Components.interfaces.nsIXMLHttpRequest);
        req.open("GET", url, false); 
        req.send(null);
        
        return req.responseXML;
    },

    loadXmlFile: function(file) {
        if (file == null) throw new ArgumentNullException("file");
        
        var url = this._getFileUrl(file);
        return this.loadXml(url);
    },

    saveXmlFile: function(file, dom) {
        if (file == null) throw new ArgumentNullException("file");
        if (dom == null) throw new ArgumentNullException("dom");
        
        var serializer = new XMLSerializer();
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                       .createInstance(Components.interfaces.nsIFileOutputStream);
                       
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
        serializer.serializeToStream(dom, foStream, ""); 
        foStream.close();
    },
    
    _getFileUrl: function(file) {
        if (file == null) throw new ArgumentNullException("file");
        
        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var fileHandler = ios.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        var url = fileHandler.getURLSpecFromFile(file);
        
        return url;
    }
};


/*** Marshal server component class ***/
var Marshal = new Object();

Marshal.ObjectCollection = Class.create();

Marshal.ObjectCollection.prototype = {
    initialize: function() {
        this._list = new Hash();
        this._lastId = 0;
    },
    
    register: function(name, obj) {
        if (name == null) throw new ArgumentNullException("name");
        if (obj == null) throw new ArgumentNullException("obj");
        
        name = String(name);
        if (this._list[name] != null)
            throw new ArgumentException("name", name, "Object of that name already exists.");
        
        this._list[name] = obj;
    },
    
    
    findName: function(doc, obj) {
        var name = null;

        var objects = this._list;

        objects.keys().each(function(n) {
                if (objects[n] == obj) {
                    name = n;
                    throw $break;
                }
            });
            
        if (name == null && doc._marshalObjects != null) {
            objects = doc._marshalObjects;
            
            objects.keys().each(function(n) {
                    if (objects[n] == obj) {
                        name = n;
                        throw $break;
                    }
                });
        }
            
        return name;
    },
    
    getName: function(doc, obj) {
        // Find existing name
        var objectName = this.findName(doc, obj);
        
        if (objectName == null) {
            var marshalObjects = doc._marshalObjects;
            if (marshalObjects == null) {
                marshalObjects = new Hash();
                doc._marshalObjects = marshalObjects;
            }
        
            // Create new one (bound to the current document)
            objectName = ++this._lastId;
            marshalObjects[objectName] = obj;
        }
            
        return objectName;
    },
    
    getObject: function(doc, name, throwOnError) {
        var obj = this._list[name];

        if (doc._marshalObjects != null)
            obj = doc._marshalObjects[name] || obj;
        
        if (obj == null && throwOnError)
            throw new MarshalException("Object is not registered.", name);
        
        return obj;
    }
};

Object.extend(Marshal, {
    // Constants
    NONE: 0,
    BY_VALUE: 1,
    BY_REF: 2,
    // Method must return either null or array of objects
    BY_REF_ARRAY: 3,
    // Change with care
    DEFAULT: 0,

    PROXY_SUFFIX: "_PROXY",

    // Private members
    _objects: new Marshal.ObjectCollection(),
    _validators: new Array(),

    initPage: function(page) {
        var _this = this;
        
        page.document.addEventListener("MarshalMethodCall", function(event) { _this._methodCallHandler(event); }, false);
        page.document.addEventListener("MarshalGetProxyDefinition", function(event) { _this._getProxyDefinitionHandler(event); }, false);
        
        Script.executeFile(page.document, CHROME_CONTENT_URL + "interopClient.js");
    },
    
    // Callback must be function(document, objectName) which must throw exception when call is invalid
    registerCallValidator: function(callback) {
        if (callback == null) 
            throw new ArgumentNullException("callback");
        if (typeof callback != "function")
            throw new ArgumentException("callback", callback, "Argument is not a function.");
            
        this._validators.push(callback);
    },
    
    registerUrlCallValidator: function(pattern) {
        if (pattern == null)
            throw new ArgumentNullException("pattern");
            
        this.registerCallValidator(function(doc) {
                if (!doc.location.href.match(pattern))
                    throw new InvalidOperationException("This call is not enabled by the host security.");
            });
    },
    
    registerObject: function(name, obj) {
        if (obj == this)
            throw new ArgumentException("obj", null, "Invalid operation.");
        
        this._objects.register(name, obj);
    },
    
    _methodCallHandler: function(event) {
        var elem = event.originalTarget;
        
        try {
            var objectName = elem.getAttribute("objectName");
            var methodName = elem.getAttribute("methodName");
            var resultName = elem.getAttribute("resultName");
            var argsStr = elem.getAttribute("arguments");
            
            if (objectName == null)
                throw new MarshalException("Missing object name.", objectName, methodName);
            if (!/^[\w_$]+$/.test(methodName))
                throw new MarshalException("Invalid method name.", objectName, methodName);
            
            this._validateCall(elem.ownerDocument, objectName);
            
            var obj = this._objects.getObject(elem.ownerDocument, objectName, false);
            if (obj == null)
                throw new MarshalException("Object is not registered.", objectName, methodName);
            
            var method = obj[methodName];
            if (method == null || typeof method != "function")
                throw new MarshalException("Method not found.", objectName, methodName);
                
            var methodType = this._getMethodType(obj, methodName);
            if (methodType == 0)
                throw new MarshalException("Method cannot be marshaled.", objectName, methodName);
            
            // Create argument array
            var args = new Array();
            if (argsStr != null && !argsStr.empty()) {
                var objects = this._objects;
            
                var transportArgs = argsStr.evalJSON();
                transportArgs.each(function(a) {
                        if (a.reference != null)
                            args.push(objects.getObject(elem.ownerDocument, a.reference, true));
                        else
                            args.push(a.value);
                    });
            }
  
            // Call method
            var retval = method.apply(obj, args);
            
            if (retval != null) {
                // Process result
                switch (methodType) {
                    case Marshal.BY_VALUE:
                        elem.setAttribute("retval", Object.toJSON(retval));
                        break;
                    
                    case Marshal.BY_REF:
                        var objectId = this._objects.getName(elem.ownerDocument, retval);
                        var def = this._createProxyDefinition(retval);
                        
                        var reference = {
                            objectId: objectId,
                            proxyDefinition: def
                        };
                        
                        elem.setAttribute("reference", Object.toJSON(reference));
                        break;
                        
                    case Marshal.BY_REF_ARRAY:
                        if (!(retval instanceof Array))
                            throw new MarshalException("Returned object is not an array.", objectName, methodName);
                    
                        var objects = new Array();
                    
                        for (var i = 0; i < retval.length; i++) {
                            var obj = retval[i];
                            var objectId = this._objects.getName(elem.ownerDocument, obj);
                            var def = this._createProxyDefinition(obj);
                            
                            var reference = {
                                objectId: objectId,
                                proxyDefinition: def
                            };
                            
                            objects.push(reference);
                        }
                    
                        elem.setAttribute("list", Object.toJSON(objects));
                        break;
                        
                    default:
                        throw new MarshalException(String.format("Invalid method marshal type ({0}).", methodType), objectName, methodName);
                }
            }
        }
        catch (e) {
            elem.setAttribute("exception", Object.toJSON(e));
        }
    },
    
    _getProxyDefinitionHandler: function(event) {
        try {
            var elem = event.originalTarget;
            var objectName = elem.getAttribute("objectName");
            
            if (objectName == null)
                throw new MarshalException("Missing object name.");
                
            this._validateCall(elem.ownerDocument, objectName);

            var obj = this._objects.getObject(elem.ownerDocument, objectName, true);
            
            var def = this._createProxyDefinition(obj);
            elem.setAttribute("proxyDefinition", Object.toJSON(def));
        }
        catch (e) {
            elem.setAttribute("exception", Object.toJSON(e));
        }
    },
    
    _validateCall: function(doc, objectName) {
        // No validators means disabled validation
         
        this._validators.each(function(v) {
                v.call(null, doc, objectName);
            });
    },
    
    _createProxyDefinition: function(obj) {
        var def = {
            methods: new Array()
        };
        
        for (var f in obj) {
            if (typeof obj[f] == "function") {
                var type = this._getMethodType(obj, f);
            
                if (type != Marshal.NONE) {
                    def.methods.push({ 
                        name: f,
                        type: type
                    });
                }
            }
        }
        
        return def;
    },

    _getMethodType: function(obj, methodName) {
        var attr = obj[methodName + this.PROXY_SUFFIX];
        
        switch (attr) {
            case null:
                return Marshal.DEFAULT;
            
            case Marshal.BY_VALUE:
                return Marshal.BY_VALUE;
                
            case Marshal.BY_REF:
                return Marshal.BY_REF;
                
            case Marshal.BY_REF_ARRAY:
                return Marshal.BY_REF_ARRAY;
                
            default:
                return Marshal.NONE;
        }
    }
});


/*** ExtenderManager class ***/
var ExtenderManager = {
    _libraries: new Array(),

    include: function(url) {
        if (url == null)
            throw new ArgumentNullException("url");
        if (url.search(CHROME_CONTENT_URL) != 0)
            throw new ArgumentException("url", url, "Url must be within this extension content.");
            
        this._libraries.push(url);
    },

    load: function(definitionUrl) {
        if (definitionUrl == null) throw new ArgumentNullException("definitionUrl");
        
        var definition = FileIO.loadXml(definitionUrl);
        if (definition != null) {
            var data = {
                location: definitionUrl.replace(/\/[^\/]+$/, "/"),
                aliases: new Hash()
            }
        
            // Read aliases definitions
            var aliasesDef = XPath.evalList('/webExtender/urls/alias', definition);
            aliasesDef.each(function(a) {
                    var name = a.getAttribute("name");
                    if (name == null || !/^[\w._-~]+$/.test(name))
                        throw String.format("Invalid or missing alias name ('{0}')", name);
                        
                    data.aliases[name] = a.textContent; 
                });
            
            // Register extenders
            var scripts = XPath.evalList('/webExtender/extenders/*', definition);
            scripts.each(function(def) {
                    var url = new Template(def.getAttribute("url")).evaluate(data.aliases);
                    var parser = ExtenderManager.Extenders[def.tagName];
                    
                    var libraryAttr = String(def.getAttribute("library"));
                    var library = (libraryAttr.toLowerCase() == "true" || parseInt(libraryAttr) > 0);
                    
                    if (url == null || url.empty())
                        throw "url not set.";
                    
                    if (parser == null || typeof parser != "function")
                        throw String.format("Unsupported extender type ('{0}').", def.tagName);
                    
                    var extender = parser(def, data);
                    WebExtender.registerExtender(url, extender, library);
                });
        }
    },
    
    // Called directly by WebExtender
    initPage: function(page) {
        for (var i = 0; i < this._libraries.length; i++) {
            var src = this._libraries[i];
            Script.executeFile(page.document, src);
        }
        
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
    script: function(def, data) {
        var name = def.getAttribute("name");
        var type = def.getAttribute("type");
        var charset = def.getAttribute("charset");
        
        if (name == null || !new RegExp("^[\\w./_~-]+$").test(name))
            throw new Exception(String.format("Invalid script name ('{0}').", name));
        
        var src = data.location + name;
        var extender = new ScriptExtender(src, "text/javascript", charset);
        return extender;
    },
    
    style: function(def, data) {
        var src = new Template(def.getAttribute("src")).evaluate(data.aliases);
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
