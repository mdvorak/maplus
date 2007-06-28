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

function loadText(url) {
    var req = new XMLHttpRequest();
    req.open("GET", url, false); 
    req.send(null);
    
    return req.responseText;
}

Object.extend(Event, {
    dispatch: function(element, eventName, bubbles, cancelable) {
        var evt = document.createEvent('Events');
        evt.initEvent(eventName, bubbles, cancelable);
        $(element).dispatchEvent(evt);
    }
});

Object.extend(Object, {
    compare: function(obj1, obj2) {
        if (obj1 == obj2)
            return 0;
        else if (obj1 < obj2)
            return -1;
        else if (obj1 > obj2)
            return 1;
        else if (isNaN(obj1)) {
            if (isNaN(obj2))
                return 0;
            else
                return 1;
        }
        else // obj2 == NaN, obj1 == Number
            return -1;
    }
});

Object.extend(String, {
    format: function(str, args) {
        if (!str) return null;
        
        for (var i = 0; i < arguments.length; i++) {
            str = str.replace("\{" + i + "\}", arguments[i]);
        } 
        return str;
    },
    
    formatByMap: function(str, map) {
        if (!str) return null;
        if (!map) return str;
        
        map.keys().each(function(k) {
                str = str.replace("\{" + k + "\}", map[k]);
            });
        return str;
    }
});

/*** XPath class ***/

var XPath = Class.create();

Object.extend(XPath, {
    evaluate: function(xpath, context, resultType) {
        if (!xpath) return null;
        if (!context) context = document;
        if (!resultType) resultType = XPathResult.ANY_TYPE;
        
        var doc = context.ownerDocument ? context.ownerDocument : context;
        return doc.evaluate(xpath, context, null, resultType, null);
    },
    
    evaluateList: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.ANY_TYPE);
        var list = new Array();
        
        if (result) {
            for (var i = result.iterateNext(); i != null; i = result.iterateNext()) {
                list.push(i);
            }
        }
        
        return list;
    },
    
    evaluateSingle: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.ANY_TYPE);
        return result ? result.iterateNext() : null;
    },
    
    evaluateString: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.STRING_TYPE);
        return result ? result.stringValue : null;
    },
    
    evaluateNumber: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.NUMBER_TYPE);
        return result ? result.numberValue : null;
    }
});

/*** Page class ***/
var Page = Class.create();

Page.prototype = {
    initialize: function(doc) {
        // Note: when you use other than default document, you can't use prototype methods, like $('abc').
        if (doc == null) doc = document;
    
        this.document = doc;
        this.url = this.document.location.href;
        this.name = this.url.match(/\/([\w.]+?)([?].+?)?$/)[1];
        
        // Analyze url encoded arguments
        this.arguments = new Hash();
        
        var args = this.url.match(/\b\w+=.+?(?=&|$)/g);
        for (var i in args) {
            var pair = args[i].split("=");
            this.arguments[pair[0]] = pair[1];
        }
    }
};

/*** PageExtender class ***/
var PageExtenderResult = {
    OK: 0,
    CANCEL: 1,
    ABORT: -1
};

var PageExtender = Class.create();

PageExtender.prototype = {
    analyze: function(page) {
        return PageExtenderResult.OK;
    },
    
    process: function(page) {
    }
};

Object.extend(PageExtender, {
    create: function(definition) {
        return Object.extend(new PageExtender(), definition);
    }
});

/* PageExtender example

var myPageExtender = PageExtender.create({
    analyze: function(page) {
        // Use page for data used in other extenders, and this for local.
        page.something = $('something');
        this.else = $('else');
        
        if (!Page.something || !this.else)
            return PageExtenderResult.CANCEL;
        
        return PageExtenderResult.OK;
    },
    
    process: function(page) {
        this.else.hide();
        page.something.style.width = "10px";
    }
});

// Register extender

*/


/*** PageExtenderCollection class ***/
var PageExtenderCollection = Class.create();

PageExtenderCollection.prototype = {
    _extenders: new Array(),

    register: function(extender) {
        if (!extender) return;
        this._extenders.push(extender);
    },

    process: function() {
        var abort = false;
        var processList = new Array();
        
        // Analyze 
        this._extenders.each(function(e) {
                var r = e.analyze();
            
                if (r == PageExtenderResult.OK)
                    processList.push(e);
                abort |= (r == PageExtenderResult.ABORT);
            });

        if (abort)
            return false;

        // Process
        this.processList.each(function(e) {
                e.process();
            });

        return true;
    }
};

