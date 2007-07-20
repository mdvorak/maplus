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

Object.extend(Class, {
    inherit: function(baseType) {
        var cls = Class.create();
        // copy "static" methods
        Object.extend(cls, baseType);
        // copy "instance" methods and set base type
        cls.prototype = Object.extend({ base: baseType.prototype }, baseType.prototype);
        return cls;
    }
});

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
        
        for (var i = 1; i < arguments.length; i++) {
            var val = arguments[i] ? arguments[i] : "";
            str = str.replace("{" + String(i - 1) + "}", val);
        }
        
        var m = str.match(/\{(\d+)\}/);
        if (m) throw "Argument index (" + m[1] + ") is out of range.";
        
        return str;
    }
});

/*** XPath class ***/

var XPath = {
    evaluate: function(xpath, context, resultType) {
        if (!xpath) return null;
        if (!context) context = document;
        if (!resultType) resultType = XPathResult.ANY_TYPE;
        
        var doc = context.ownerDocument ? context.ownerDocument : context;
        return doc.evaluate(xpath, context, null, resultType, null);
    },
    
    evaluateList: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        var list = new Array();
        
        if (result) {
            for (var i = result.iterateNext(); i != null; i = result.iterateNext()) {
                list.push($X(i));
            }
        }
        
        return list;
    },
    
    evaluateSingle: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.ORDERED_NODE_ITERATOR_TYPE);
        return result ? $X(result.iterateNext()) : null;
    },
    
    evaluateString: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.STRING_TYPE);
        return result ? result.stringValue : null;
    },
    
    evaluateNumber: function(xpath, context) {
        var result = this.evaluate(xpath, context, XPathResult.NUMBER_TYPE);
        return result ? result.numberValue : null;
    }
};

XPath.Methods = {
    evaluateList: function(xpath) {
        return XPath.evaluateList(xpath, this);
    },
    
    evaluateSingle: function(xpath) {
        return XPath.evaluateSingle(xpath, this);
    },
    
    evaluateString: function(xpath) {
        return XPath.evaluateString(xpath, this);
    },
    
    evaluateNumber: function(xpath) {
        return XPath.evaluateNumber(xpath, this);
    }
};

Object.extend(XPath, {
    extend: function(element) {
        element = $(element);
    
        if (element._xpathExtended)
            return element;
    
        for (var property in XPath.Methods) {
            var value = XPath.Methods[property];
            if (typeof value == 'function' && !(property in element)) 
                element[property] = value;
        }
        
        element._xpathExtended = true;
        return element;
    }
});

function $X(element) {
    return XPath.extend(element);
}

function $XF(xpath, context) {
    return XPath.evaluateSingle(xpath, context);
}

/*** Page class ***/
var Page = Class.create();

Page.prototype = {
    initialize: function(doc) {
        // Note: when you use other than default document, you can't use some prototype methods, like $('abc').
        if (doc == null) doc = document;
    
        this.document = $(doc);
        this.url = this.document.location.href;
        this.name = this.url.match(/\/([\w.]+?)([?].+?)?$/)[1];
        
        // Analyze url encoded arguments
        this.arguments = new Hash();
        
        var args = this.url.match(/\b\w+=.+?(?=&|$)/g);
        if (args) {
            var _this = this;
            
            args.each(function(arg) {
                var pair = arg.split("=");
                _this.arguments[pair[0]] = pair[1];
            });
        }
    }
};

/*** PageExtender class ***/
var PageExtender = Class.create();

PageExtender.prototype = {
    initialize: function() {
        this.supporting = false;
    },

    analyze: function(page, context) {
        return true;
    },
    
    process: function(page, context) {
    },
    
    isSignificant: function() {
        return !this.supporting;
    }
};

Object.extend(PageExtender, {
    create: function(definition) {
        return Object.extend(new PageExtender(), definition);
    },
    
    createClass: function(definition) {
        var cls = Class.inherit(PageExtender);
        Object.extend(cls.prototype, definition);
        return cls;
    }
});

/*** PageExtenderCollection class ***/
var PageExtenderCollection = Class.create();

PageExtenderCollection.prototype = {
    initialize: function() {
        this._extenders = new Array();
        this._significantSize = 0;
    },
    
    size: function() {
        return this._extenders.length;
    },
    
    needsExecution: function() {
        return this._significantSize > 0;
    },

    add: function(extender) {
        if (!extender) return;
        
        this._extenders.push(extender);
            
        if (extender.isSignificant())
            this._significantSize++;
    },
    
    run: function(page) {
        try {
            var processList = new Array();

            // Analyze
            this._extenders.each(function(e)
                {
                    var context = new Object();
                    if (e.analyze(page, context))
                        processList.push([e, context]);
                });
                
            // Process
            processList.each(function(entry)
                {
                    var extender = entry[0];
                    var context = entry[1];
                    extender.process(page, context);
                });
        }
        catch (ex) {
            // TODO: log error
            alert(ex);
            return false;
        }
    }
};


/*** Custom extender classes ***/

var ScriptExtender = PageExtender.createClass({
    DEFAULT_TYPE: "text/javascript",

    initialize: function(src, type) {
        this.base.initialize();
    
        if (!src)
            throw "src is null.";
        this._src = src;
        this._type = (type ? type : this.DEFAULT_TYPE);
    },

    process: function(page, context) {
        var e = page.document.createElement("script");
        e.setAttribute("type", this._type);
        e.setAttribute("src", this._src);
        page.document.body.appendChild(e);
    }
});

var StyleExtender = PageExtender.createClass({
    initialize: function(src) {
        this.base.initialize();
        
        if (!src)
            throw "src is null.";
        this._src = src;
    },

    analyze: function(page, context) {
        context.head = XPath.evaluateSingle('/html/head', page.document);
        return (context.head != null);
    },
    
    process: function(page, context) {
        var e = page.document.createElement("link");
        e.setAttribute("rel", "stylesheet");
        e.setAttribute("type", "text/css");
        e.setAttribute("href", this._src);
        context.head.appendChild(e);
    }
});
