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

/*** XmlConfig class ***/
var XmlConfig = {
    DEFAULT_ROOT_NAME: "config",

    createEmpty: function(rootName) {
        var doc = DocumentHelper.createDocument();
        
        // Pridej xml direktivu
        doc.appendChild(doc.createProcessingInstruction("xml", 'version="1.0" encoding="utf-8"'));
        
        // Korenovy element
        var rootElem = doc.createElement(rootName);
        doc.appendChild(rootElem);

        return XmlConfig.createNode(rootElem);
    },

    createNode: function(domNode) {
        if (domNode == null)
            return null;

        var n = domNode._configNodeCached;

        if (n == null) {
            n = new XmlConfigNode(domNode);
            domNode._configNodeCached = n;
        }

        return n;
    },

    load: function(path, rootName, initCallback) {
        if (path == null)
            throw "path is null.";

        if (rootName == null)
            rootName = XmlConfig.DEFAULT_ROOT_NAME;

        var root = null;

        try {
            var doc = FileIO.loadXmlFile(path);

            var rootElem = XPath.evalSingle(rootName, doc);
            if (rootElem == null)
                throw new Error(String.format("Root node '{0}' not found in the file '{1}'.", rootName, path));

            root = XmlConfig.createNode(rootElem);
        }
        catch (e) {
            logger().error(String.format("Error loading file '{0}':\n{1}", path, e));
        }

        if (root == null) {
            // File not found, create new dom
            root = XmlConfig.createEmpty(rootName);
        }

        if (initCallback != null)
            initCallback(root);

        return root;
    },

    save: function(path, rootNode) {
        try {
            if (rootNode != null && rootNode.ownerDocument)
                FileIO.saveXmlFile(path, rootNode.ownerDocument);
        }
        catch (e) {
            logger().error(String.format("Error saving file '{0}':\n{1}", path, e));
        }
    }
};
 

/*** XmlConfigNode class ***/
var XmlConfigNode = Class.create({
    target: null,
    ownerDocument: null,

    initialize: function(target) {
        if (target == null)
            throw new ArgumentNullException("target");

        this.target = target;
        this.ownerDocument = target.ownerDocument;
    },

    getName_PROXY: Marshal.BY_VALUE,
    getName: function() {
        return this.target.tagName;
    },

    getAttribute_PROXY: Marshal.BY_VALUE,
    getAttribute: function(name) {
        return this.target.getAttribute(name);
    },

    setAttribute_PROXY: Marshal.BY_VALUE,
    setAttribute: function(name, value) {
        return this.target.setAttribute(name, value);
    },

    addPref_PROXY: Marshal.BY_REF,
    addPref: function(name, value) {
        var elem = this.ownerDocument.createElement(name);
        
        this.target.appendChild(elem);
        if (value != null)
            elem.textContent = value;
        
        return XmlConfig.createNode(elem);
    },

    getPrefNode_PROXY: Marshal.BY_REF,
    getPrefNode: function(name, create) {
        if (!name || !name.match(/^[\w_.:-]+$/))
            throw "Name contains invalid characters.";
        
        var elem = this.ownerDocument.evaluate(name, this.target, null, XPathResult.ANY_TYPE, null).iterateNext();

        if (elem == null && create) {
            return this.addPref(name);
        }
        else if (elem != null) {
            return XmlConfig.createNode(elem);
        }
        
        return null;
    },
    
    getPref_PROXY: Marshal.BY_VALUE,
    getPref: function(name, defaultValue) {
        // Use this when no name where specified
        var n = (name != null ? this.getPrefNode(name) : this);
        return n != null ? n.target.textContent : defaultValue;
    },
    
    setPref_PROXY: Marshal.BY_VALUE,
    setPref: function(name, value) {
        // Use this when no name where specified
        var n = (name ? this.getPrefNode(name) : this);
        if (n == null)
            n = this.addPref(name);
            
        if (value != null) {
            // Beztak bude ulozeny jako string...
            value = String(value);
        
            // Pokud string obsahuje neco nepekneho, ulozime ho jako CDATA
            if (value.match(/[\<\>\[\]\&]/) == null) {
                n.target.textContent = value;
            }
            else {
                n.clearChildNodes();
                n.target.appendChild(n.ownerDocument.createCDATASection(value));
            }
        }
        else {
            n.target.textContent = ""; // Lepsi prazdny string nez undefined
        }

        return value;
    },
    
    getBoolean_PROXY: Marshal.BY_VALUE,
    getBoolean: function(name, defaultValue) {
        var v = this.getPref(name, defaultValue);
        return Boolean(v) && (v.toLowerCase == null || v.toLowerCase() != "false");
    },
    
    getNumber_PROXY: Marshal.BY_VALUE,
    getNumber: function(name, defaultValue) {
        var v = Number(this.getPref(name, defaultValue));
        if (!isNaN(v)) return v;
        else return defaultValue;
    },
    
    removePrefNode_PROXY: Marshal.BY_REF,
    removePrefNode: function(prefNode) {
        return this.target.removeChild(prefNode);
    },

    clearChildNodes_PROXY: Marshal.BY_VALUE,
    clearChildNodes: function() {
        while (this.target.firstChild) {
            this.target.removeChild(this.target.firstChild);
        }
    }
});

XmlConfigNode.Extension = Class.create({
    initialize: function() {
        this.activated = false;
    },

    useExtension: function() {
        if (this.activated)
            return;
        
        Object.extend(XmlConfigNode.prototype, this.prototype);
        this.activated = true;
    }
});

/*** XmlConfigNode.XPath class ***/
XmlConfigNode.XPath = new XmlConfigNode.Extension();

XmlConfigNode.XPath.prototype = {
    evalPrefNode_PROXY: Marshal.BY_REF,
    evalPrefNode: function(xpath, namespaceResolver) {
        var elem = this.ownerDocument.evaluate(xpath, this.target, namespaceResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null).iterateNext();

        if (elem != null)
            return XmlConfig.createNode(elem);
        else
            return null;
    },

    evalPrefNodeList_PROXY: Marshal.BY_REF_ARRAY,
    evalPrefNodeList: function(xpath, namespaceResolver) {
        var result = this.ownerDocument.evaluate(xpath, this.target, namespaceResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var retval = new Array();

        if (result != null) {
            for (var i = result.iterateNext(); i != null; i = result.iterateNext()) {
                retval.push(XmlConfig.createNode(i));
            }
        }

        return retval;
    },

    getPrefByName_PROXY: Marshal.BY_VALUE,
    getPrefByName: function(tagName, name, defaultValue) {
        var n = this.evalPrefNode(tagName + '[@name = "' + name + '"]');
        return (n != null) ? n.target.textContent : defaultValue;
    },

    setPrefByName_PROXY: Marshal.BY_VALUE,
    setPrefByName: function(tagName, name, value) {
        var n = this.evalPrefNode(tagName + '[@name = "' + name + '"]');
        if (value != null) {
            if (n == null) {
                n = this.addPref(tagName, value);
                n.setAttribute("name", name);
            }
            else {
                n.target.textContent = value;
            }
        }
        else if (n != null) {
            this.target.removeChild(n.target);
        }
        return value;
    }
};

/*** XmlConfigNode.Extended class ***/
XmlConfigNode.Extended = new XmlConfigNode.Extension();
 
XmlConfigNode.Extended.prototype = {
    insertPref_PROXY: Marshal.BY_REF,
    insertPref: function(name, value, before) {
        var beforeElem = before.target;
        var elem = this.ownerDocument.createElement(name);
        
        this.target.insertBefore(elem, beforeElem);
        if (value != null)
            elem.textContent = value;
        
        return XmlConfig.createNode(elem);
    },
    
    getFirstChild_PROXY: Marshal.BY_REF,
    getFirstChild: function() {
        return XmlConfig.createNode(this.target.firstChild);
    },
    
    getLastChild_PROXY: Marshal.BY_REF,
    getLastChild: function() {
        return XmlConfig.createNode(this.target.lastChild);
    },
    
    getNextSibling_PROXY: Marshal.BY_REF,
    getNextSibling: function() {
        return XmlConfig.createNode(this.target.nextSibling);
    },
    
    getPreviousSibling_PROXY: Marshal.BY_REF,
    getPreviousSibling: function() {
        return XmlConfig.createNode(this.target.previousSibling);
    }
};


/*** XmlConfigManager class ***/

var XmlConfigManager = Class.create({
    initialize: function(directory, rootName, initCallback) {
        if (rootName == null)
            rootName = XmlConfig.DEFAULT_ROOT_NAME;
            
        this._cache = new Hash();
        this._directory = directory;
        this._rootName = rootName;
        this._initCallback = initCallback;
    },
    
    getConfigPath: function(name) {
        if (!name || name.empty())
            throw "name is null or empty.";
         if (!this._directory)
            throw "Invalid operation. Directory not set.";
    
        var path = FileIO.createFileObject();        
        path.initWithFile(this._directory);
        path.append(name);
        return path;
    },
    
    getConfig_PROXY: Marshal.BY_REF,
    getConfig: function(name, dontCreate) {
        name = String(name);
        var config = this._cache[name];
        
        if (config == null && !dontCreate) {
            if (this._directory != null) {
                var path = this.getConfigPath(name);
                config = XmlConfig.load(path, this._rootName, this._initCallback);
            }
            else {
                config = XmlConfig.createEmpty(this._rootName);
                
                if (this._initCallback != null)
                    this._initCallback(config);
            }
                
            this._cache[name] = config;
        }
        
        return config;
    },
    
    saveConfig_PROXY: Marshal.BY_VALUE,
    saveConfig: function(name) {
        name = String(name);
        var config = this._cache[name];
        
        if (config != null) {
            var path = this.getConfigPath(name);
            XmlConfig.save(path, config);
        }
    },
    
    saveAll_PROXY: Marshal.BY_VALUE,
    saveAll: function() {
        var _this = this;
        this._cache.keys().each(function(e) { _this.saveConfig(e); });
    },
    
    removeFromCache: function(name) {
        name = String(name);
        this._cache[name] = null;
    }
});
