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
 
var InPageExtenders = {
    getExtendersLocation: function() {
        return WebExtender.getChromeUrl() + "extenders/";
    },
    
    getDefinition: function() {
        Xml.load(this.getExtendersLocation() + "extenders.xml");
    },
    
    // Called directly by WebExtender
    initPage: function(page) {
        Script.execute("var pageExtenders = new PageExtenderCollection();", page.document);
    },
    
    // Called directly by WebExtender
    finalizePage: function(page) {
        var transport = page.document.createElelement("WebExtenderTransport");
        transport.id = "id_WebExtenderTransport";
        transport.pageObject = page;
        page.document.appendChild(transport);
        
        Script.execute("var _extendPage = " +
            function() {
                var eTransport = XPath.evaluateSingle('\\WebExtenderTransport[@id = "id_WebExtenderTransport"]');
                if (!eTransport.pageObject)
                    throw "Unable to get page object.";
                if (eTransport.pageObject.document != document)
                    throw "Invalid page object.";
                
                pageExtenders.process(eTransport.pageObject);
            } + ";\n" +
            "_extendPage(); ", page.document);
    },
    
    _init: function() {
        var definition = this.getDefinition();
        if (definition) {
            // Read aliases definitions
            var aliasesDef = XPath.evaluateList('/webExtender/urls/alias', definition);
            var aliasesMap = Hash();
            aliasesDef.each(function(a) { aliasesMap[a.getAttribute("name")] = a.textContent; });
            
            // Process stylesheets
            var stylesheets = XPath.evaluateList('/webExtender/stylesheets/style', definition);
            stylesheets.each(function(s) {
                    var url = String.formatByMap(s.getAttribute("url"), aliasesMap);
                    var src = String.formatByMap(s.getAttribute("src"), aliasesMap);
                    
                    if (url && src) {                    
                        var extender = new StyleExtender(src);
                        WebExtender.registerExtender(url, extender);
                    }
                });
            
            // Process scripts
            var scripts = XPath.evaluateList('/webExtender/extenders/script', definition);
            scripts.each(function(s) {
                    var url = String.formatByMap(s.getAttribute("url"), aliasesMap);
                    var src = InPageExtenders.getExtendersLocation() + s.getAttribute("name");
                    var type = s.getAttribute("type");
                    
                    if (url && s.getAttribute("name")) {                    
                        var extender = new ScriptExtender(src, type);
                        WebExtender.registerExtender(url, extender);
                    }
                });
        }
        
        this._init = null;
    }
};

/** Helper classes **/
var StyleExtender = PageExtender.create({
    initialize: function(src) {
        if (!src)
            throw "src is null.";
        this._src = src;
    },

    analyze: function(page) {
        if (!page.document._head) {
            page.document._head = XPath.evaluateSingle('/html/head', page.document);
        }
        
        return (page.document._head) ? PageExtenderResult.OK : PageExtenderResult.CANCEL;
    },
    
    process: function(page) {
        var e = page.document.createElement("link");
        e.setAttribute("rel", "stylesheet");
        e.setAttribute("type", "text/css");
        e.setAttribute("href", this._src);
        page.document._head.appendChild(e);
    }
});

var ScriptExtender = PageExtender.create({
    DEFAULT_TYPE: "text/javascript",

    initialize: function(src, type) {
        if (!src)
            throw "src is null.";
        this._src = src;
        this._type = (type ? type : this.DEFAULT_TYPE);
    },

    process: function(page) {
        var e = page.document.createElement("script");
        e.setAttribute("type", this._type);
        e.setAttribute("src", this._src);
        page.document.body.appendChild(e);
    }
});

// Load defined extenders
InPageExtenders._init();

