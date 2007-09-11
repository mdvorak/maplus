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

// Dummy objects for prototype, etc..
const HTMLElement = function() { }
HTMLElement.prototype = {
    appendChild: function() { return new HTMLElement(); }
};
const document = {
    createElement: function() { return new HTMLElement(); },
    createTextNode: function() { return new HTMLElement(); }
};
const window = { document: document };
const navigator = { userAgent: "Gecko" }

const nsIDOMXPathResult = Components.interfaces.nsIDOMXPathResult;
const XPathResult = nsIDOMXPathResult;

// Reads given xml file and returns list of files urls.
function loadJSListDefinition(definitionUrl, scriptsUrl) {
    if (scriptsUrl[scriptsUrl.length - 1] != '/')
        scriptsUrl += '/';

    // Load services xml
    var req = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
                        .createInstance()
                        .QueryInterface(Components.interfaces.nsIXMLHttpRequest);

    req.open("GET", definitionUrl, false);
    req.send(null);
    
    var def = req.responseXML;
    var list = def.evaluate('/files/script[@src]', def, null, nsIDOMXPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
    var result = new Array();
    
    if (list != null) {
        var jssubscriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                                          .getService(Components.interfaces.mozIJSSubScriptLoader);

        // Iterate thru services definition
        for (var i = list.iterateNext(); i != null; i = list.iterateNext()) {
            var src = scriptsUrl + i.getAttribute("src");
            result.push(src);
        }
    }
    
    return result;
}

/**
 * Examples:
 * loadJSfromDefinition("chrome://myextension/content/files.xml", "chrome://myextension/content/");
 * loadJSfromDefinition("chrome://myextension/content/otherFiles.xml", "chrome://myextension/content/other");
 */
function loadJSfromDefinition(definitionUrl, scriptsUrl) {
    var scripts = loadJSListDefinition(definitionUrl, scriptsUrl);
    
    var jssubscriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                                      .getService(Components.interfaces.mozIJSSubScriptLoader);
                                      
    for (var i = 0; i < scripts.length; i++) {
        // Load script
        jssubscriptLoader.loadSubScript(scripts[i]);
    }
}
