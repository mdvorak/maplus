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
 
/*** Xml class ***/
var Xml = Object.extend(Xml || {}, {
    loadFile: function(file) {
        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var fileHandler = ios.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        var url = fileHandler.getURLSpecFromFile(file);

        var req = new XMLHttpRequest();
        req.open("GET", url, false); 
        req.send(null);
        
        return req.responseXML;
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
 
/*** XmlConfig class ***/
var XmlConfig = {
    DEFAULT_ROOT_NAME: "config",
 
    createEmpty: function(rootName) {
        var doc = document.implementation.createDocument("", "", null);
        var root = doc.createElement(rootName);
        doc.appendChild(root);
        
        XmlConfig.extendNode(root);
        return root;
    },

    extendNode: function(node) {
        if (!node || node._configNodeInitialized)
            return;

        Object.extend(node, XmlConfigNode.prototype);
           
        node._configNodeInitialized = true;
        return node;
    },
    
    load: function(path, rootName, initCallback) {
        if (!path) 
            throw "path is null.";
    
        if (!rootName)
            rootName = XmlConfig.DEFAULT_ROOT_NAME;
    
        var root = null;
        
        try {
            var doc = Xml.loadFile(path);
            
            root = XPath.evaluateSingle(rootName, doc);
            // if (!root)
            //    TODO Log error            
            
            XmlConfig.extendNode(root);
        }
        catch (e) {
            // TODO Log error
        }
    
        if (!root) {
            // File not found, create new dom
            root = XmlConfig.createEmpty(rootName);
        }
        
        if (initCallback)
            initCallback(root);
            
        return root;
    },
    
    save: function(path, rootNode) {
        try {
            if (rootNode && rootNode.ownerDocument)
                Xml.saveFile(path, rootNode.ownerDocument);
        }
        catch (e) {
            // TODO Log error
        }
    },
};
 

/*** XmlConfigNode class ***/
var XmlConfigNode = Class.create();
 
XmlConfigNode.prototype = {
    addPref: function(name, value) {
        var elem = this.ownerDocument.createElement(name);
        
        this.appendChild(elem);
        if (value)
            elem.textContent = value;
        
        XmlConfig.extendNode(elem);
        return elem;
    },

    getPrefNode: function(name, create) {
        if (!name || !name.match(/^[\w_-.:]+$/))
            throw "Name contains invalid characters.";
        
        var elem = this.ownerDocument.evaluate(name, this, null, XPathResult.ANY_TYPE, null).iterateNext();

        if (!elem && create) {
            elem = this.addPref(name);
        }
        else if (elem) {
            XmlConfig.extendNode(elem);
        }
        
        return elem;
    },
    
    getPref: function(name, defaultValue) {
        var elem = this.getPrefNode(name);
        return elem ? elem.textContent : defaultValue;
    },
    
    setPref: function(name, value) {
        var elem = this.getPrefNode(name);
        if (!elem)
            elem = this.addPref(name);
        elem.textContent = (value ? value : ""); // Lepsi prazdny string nez undefined
        return value;
    },
    
    getBoolean: function(name, defaultValue) {
        var v = this.getPref(name, defaultValue);
        return Boolean(v) && (v.toLowerCase == null || v.toLowerCase() != "false");
    },
    
    getNumber: function(name, defaultValue) {
        var v = Number(this.getPref(name, defaultValue));
        if (!isNaN(v)) return v;
        else return defaultValue;
    },
       
    getPrefNodeByXPath: function(xpath) {
        var elem = this.ownerDocument.evaluate(xpath, this, null, XPathResult.ANY_TYPE, null).iterateNext();
        if (elem) {
            XmlConfig.extendNode(elem);
        }
        return elem;
    },
    
    getPrefByName: function(tagName, name, defaultValue) {
        var elem = this.getPrefNodeByXPath(tagName + '[@name = "' + name + '"]');
        return elem ? elem.textContent : defaultValue;
    },
    
    setPrefByName: function(tagName, name, value) {
        var elem = this.getPrefNodeByXPath(tagName + '[@name = "' + name + '"]');
        if (value) {
            if (!elem) {
                elem = this.addPref(tagName, value);
                elem.setAttribute("name", name);
            }
            else {
                elem.textContent = value;
            }
        }
        else if (elem) {
            this.removeChild(elem);
        }
        return value;
    },

    clearChildNodes: function() {
        while (this.firstChild) {
            this.removeChild(this.firstChild);
        }
    }
};

/*** XmlConfigManager class ***/

var XmlConfigManager = Class.create();

XmlConfigManager.prototype = {
    _cache: new Hash(),

    initialize: function(directory, rootName, initCallback) {
        if (!directory)
            throw "directory is null.";
            
        if (!rootName)
            rootName = XmlConfig.DEFAULT_ROOT_NAME;
            
        this._directory = directory;
        this._rootName = rootName;
        this._initCallback = initCallback;
    },
    
    getConfigPath: function(name) {
        var path = Components.classes["@mozilla.org/file/local;1"]
                             .createInstance(Components.interfaces.nsILocalFile);
        
        path.initWithFile(this._directory);
        path.append(name);
        return path;
    },
    
    getConfig: function(name, dontCreate) {
        name = String(name);
        var config = _cache[name];
        
        if (!config && !dontCreate) {
            var path = getConfigPath(name);
            config = XmlConfig.load(path, this._rootName, this._initCallback);
            _cache[name] = config;
        }
        
        return config;
    },
    
    saveConfig: function(name) {
        name = String(name);
        var config = _cache[name];
        
        if (config) {
            var path = getConfigPath(name);
            XmlConfig.save(path, config);
        }
    },
    
    saveAll: function(name) {
        this._cache.keys().each(saveConfig);
    }
};
