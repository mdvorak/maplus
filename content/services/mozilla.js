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
        
        var serializer = Components.classes["@mozilla.org/xmlextras/xmlserializer;1"]
                                   .createInstance(Components.interfaces.nsIDOMSerializer);
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"]
                                 .createInstance(Components.interfaces.nsIFileOutputStream);
                       
        foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);   // write, create, truncate
        serializer.serializeToStream(dom, foStream, ""); 
        foStream.close();
    },
    
    getExtensionDirectory: function() {
        return Components.classes["@mozilla.org/extensions/manager;1"]
                    .getService(Components.interfaces.nsIExtensionManager)
                    .getInstallLocation(EXTENSION_ID)
                    .getItemLocation(EXTENSION_ID);
    },
    
    createFileObject: function() {
        return Components.classes["@mozilla.org/file/local;1"]
                         .createInstance(Components.interfaces.nsILocalFile);
    },
    
    _getFileUrl: function(file) {
        if (file == null) throw new ArgumentNullException("file");
        
        var ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
        var fileHandler = ios.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
        var url = fileHandler.getURLSpecFromFile(file);
        
        return url;
    }
};


/*** WebExtenderPreferences class ***/
var WebExtenderPreferences = {
    getBranch: function() {
        if (this._branch == null) {
            this._branch = Components.classes["@mozilla.org/preferences-service;1"]
                                     .getService(Components.interfaces.nsIPrefService)
                                     .getBranch("extensions.maplus.");
        }
        return this._branch;
    },

    getMarshalDebug: function() {
        return this.getBranch().getIntPref("debug_marshal");
    },

    getXPathDebug: function() {
        return this.getBranch().getIntPref("debug_xpath");
    }
};