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

Object.extend(Function, {
    bind: function(object, method) {
        return function() { return method.apply(object, arguments); };
    }
});

Object.extend(Class, {
    _createMethodWithBase: function(__owner, base /*, method */) {
        // Redeclaring method is nescessary because then it automaticly takes local variable base.
        var __method = eval("(" + arguments[2] + ")");
        // Return new method called in the context of object instance
        return function() {
                return __method.apply(__owner, arguments);
            };
    },
    
    inherit: function(baseClass) {
        if (baseClass == null)
            throw "baseClass is null.";
            
        var cls = function() {
            // Object is not completed - it's prototype is created right now
            if (arguments.callee.__baseClass == null)
                return;
        
            // Create base object
            var base = new Class.BaseObject(this, baseClass);
            // Override local methods so they will support base variable
            for (var p in this) {
                var v = this[p];
                if (typeof v == "function")
                    this[p] = Class._createMethodWithBase(this, base, v);
            }
            
            // Call initialize method
            this.initialize.apply(this, arguments);
        };
        
        // copy "static" methods (this will also copy parent prototype object)
        Object.extend(cls, baseClass);
        // copy "instance" methods (and set proper constructor reference)
        cls.prototype = Object.extend(new cls(), baseClass.prototype);
        
        // Set baseClass property
        cls.__baseClass = baseClass;
        
        return cls;
    }
});

// Helper class
Class.BaseObject = function(owner, clazz) {
    var base = null;
    if (clazz.__baseClass != null) {
        base = new Class.BaseObject(owner, clazz.__baseClass);
    }

    for (var p in clazz.prototype) {
        var v = clazz.prototype[p];
        
        if (typeof v == "function") {
            if (base != null)
                this[p] = Class._createMethodWithBase(owner, base, v);
            else
                this[p] = Function.bind(owner, v);
        }
    }
};

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
        if (str == null) return null;
        
        for (var i = 1; i < arguments.length; i++) {
            var val = arguments[i] != null ? arguments[i] : "";
            str = str.replace("{" + String(i - 1) + "}", val);
        }
        
        // Kontrola zdali existuje neprirazeny vyraz
        var m = str.match(/\{(\d+)\}/);
        if (m != null) throw "Argument index (" + m[1] + ") is out of range.";
        
        return str;
    },
    
    compare: function(str1, str2, ignoreCase) {
        str1 = "" + str1;
        str2 = "" + str2;
    
        if (ignoreCase) {
            str1 = str1.toLowerCase();
            str2 = str2.toLowerCase();
        }
        
        if (str1 == str2)
            return 0;
        else if (str1 < str2)
            return -1;
        else if (str1 > str2)
            return 1;
    },
    
    equals: function(str1, str2, ignoreCase) {
        str1 = "" + str1;
        str2 = "" + str2;
    
        if (ignoreCase) {
            str1 = str1.toLowerCase();
            str2 = str2.toLowerCase();
        }
        
        return (str1 == str2);
    }
});

Object.extend(Element, {
    create: function(tagName, innerHtml, attributes, doc) {
        if (tagName == null)
            throw new ArgumentNullException("tagName");
    
        if (doc == null) doc = document;
        var e = doc.createElement(tagName);
        
        if (attributes != null) {
            for (var i in attributes) {
                e.setAttribute(i, (attributes[i] != null) ? attributes[i] : "");
            }
        }
        
        if (innerHtml != null) {
            e.innerHTML = innerHtml;
        }
        
        return e;
    }
});

/*** Exception class ***/
var Exception = Class.create();

Exception.prototype = {
    initialize: function(message, innerException) {
        this.message = message;
        this.innerException = innerException;
        this.caller = arguments.callee.caller; 
    },
    
    getType: function() {
        return "Exception";
    },
        
    getDescription: function() {
        var str = this.getType();
        
        if (this.message != null)
            str += ": " + this.message;
            
        return str;
    },
    
    toString: function() {
        var str = this.getDescription();
        
        if (this.innerException != null)
            str += "\n>>" + this.innerException.toString().replace(/\n/g, "\n>>");
            
        return str;
    }
};

Object.extend(Exception, {
    getExceptionType: function(ex) {
        return (ex != null && ex.getType != null) ? ex.getType() : null;
    }
});

/*** ArgumentException class ***/
var ArgumentException = Class.inherit(Exception);

Object.extend(ArgumentException.prototype, {
    initialize: function(argName, argValue, message, innerException) {
        base.initialize(message, innerException);
        
        this.name = argName;
        this.value = argValue;
    },

    getType: function() {
        return "ArgumentException";
    },

    getDescription: function() {
        var str = base.getDescription();
        
        if (this.name != null)
            str += String.format("\nargument name='{0}' value='{1}'", this.name, String(this.value));
    }
});

/*** ArgumentNullException ***/
var ArgumentNullException = Class.inherit(ArgumentException);

ArgumentNullException.MESSAGE = "Argument is null.";

Object.extend(ArgumentNullException.prototype, {
    initialize: function(argName, innerException) {
        base.initialize(argName, null, ArgumentNullException.MESSAGE, innerException);
    },
    
    getType: function() {
        return "ArgumentNullException";
    }
});

/*** InvalidOperationException ***/
var InvalidOperationException = Class.inherit(Exception);

Object.extend(InvalidOperationException.prototype, {
    getType: function() {
        return "InvalidOperationException";
    }
});

/*** XPathException class ***/
var XPathException = Class.inherit(Exception);

XPathException.DEFAULT_MESSAGE = "Error evaluating XPath expression.";

Object.extend(XPathException.prototype, {
    initialize: function(message, expression, innerException) {
        base.initialize(message || XPathException.DEFAULT_MESSAGE, innerException);
        
        this.expression = expression;
    },
    
    getType: function() {
        return "XPathException";
    },
    
    getDescription: function() {
        var str = base.getDescription();
        
        if (this.expression != null)
            str += "\nexpression: '" + this.expression + "'";

        return str;
    }
});

/*** XPath class ***/
var XPath = {
    evaluate: function(xpath, context, resultType, noLog) {
        var retval;
        try {
            if (xpath == null) return null;
            if (resultType == null) resultType = XPathResult.ANY_TYPE;
            if (context == null) 
                context = document;
            else
                context = $(context);
            
            var doc = (context.ownerDocument != null) ? context.ownerDocument : context;
            retval = doc.evaluate(xpath, context, null, resultType, null);
            return retval;
        }
        catch (ex) {
            retval = new XPathException(null, xpath, ex);
            throw retval;
        }
        finally {
            if (XPATH_DEBUG && !noLog)
                console.debug("XPath.evaluate('%s', %o, %d): %o", xpath, context, resultType, retval);
        }
    },
    
    evalList: function(xpath, context) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, XPathResult.ORDERED_NODE_ITERATOR_TYPE, true);
            retval = new Array();
            
            if (result != null) {
                for (var i = result.iterateNext(); i != null; i = result.iterateNext()) {
                    retval.push($(i));
                }
            }
            
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (XPATH_DEBUG)
                console.debug("XPath.evalList('%s', %o): %o", xpath, context, retval);
        }
    },
    
    evalSingle: function(xpath, context) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, XPathResult.ORDERED_NODE_ITERATOR_TYPE, true);
            retval = (result != null) ? $(result.iterateNext()) : null;
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (XPATH_DEBUG)
                console.debug("XPath.evalSingle('%s', %o): %o", xpath, context, retval);
        }
    },
    
    evalString: function(xpath, context) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, XPathResult.STRING_TYPE, true);
            retval = (result != null) ? result.stringValue : null;
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (XPATH_DEBUG)
                console.debug("XPath.evalString('%s', %o): %o", xpath, context, retval);
        }
    },
    
    evalNumber: function(xpath, context) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, XPathResult.NUMBER_TYPE, true);
            retval = (result != null) ? result.numberValue : null;
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (XPATH_DEBUG)
                console.debug("XPath.evalNumber('%s', %o): %o", xpath, context, retval);
        }
    }
};

function $X(xpath, context) {
    return XPath.evalSingle(xpath, context);
}

function $XL(xpath, context) {
    return XPath.evalList(xpath, context);
}

/*** Page class ***/
var Page = Class.create();

Page.prototype = {
    initialize: function(doc) {
        // Note: when you use other than default document, you can't use some prototype methods, like $('abc').
        if (doc == null) doc = document;
    
        this.document = $(doc);
        this.url = this.document.location.href.replace(/#.*$/, "");;
        this.name = this.url.match(/\/([\w.]+?)([?].+?)?$/)[1];
        
        // Analyze url encoded arguments
        this.arguments = new Hash();
        
        var argsIndex = this.url.indexOf("?");
        if (argsIndex > -1) {
            var _this = this;
            
            $A(this.url.substring(argsIndex + 1).match(/[^&=]+=[^&=]+/g)).each(function(a) {
                var pair = a.split("=");
                _this.arguments[pair[0]] = pair[1];
            });
        }
    }
};

/*** PageExtender class ***/
var PageExtender = Class.create();

PageExtender.prototype = {
    initialize: function() {
    },
    
    // Override this for better debugging
    getName: function() {
        return "(anonymous)";
    },

    analyze: function(page, context) {
        return true;
    },
    
    // Set process to null if extender does only analyzes
    process: function(page, context) {
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

/*** AbortException class ***/
var AbortException = Class.inherit(Exception);

Object.extend(AbortException.prototype, {
    getType: function() {
        return "AbortException";
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

    add: function(extender, library) {
        if (extender == null) return;
        
        this._extenders.push(extender);
        
        if (!library)
            this._significantSize++;
    },
    
    run: function(page) {
        try {
            console.group("Running %d extenders..", this._extenders.length);
            console.time("Extenders finished in");

            var processList = new Array();

            // Analyze
            this._extenders.each(function(e)
                {
                    try {
                        console.group("Analyze '%s'...", e.getName());
                        
                        var context = new Object();
                        if (e.analyze(page, context)) {
                            if (e.process) {
                                processList.push([e, context]);
                                console.info("OK");
                            }
                            else {
                                console.info("NoProcess");
                            }
                        }
                        else 
                            console.info("Failed");
                    }
                    catch (ex) {
                        console.warn("Error");
                        throw ex;
                    }
                    finally {
                        console.groupEnd();
                    }
                });
                
            // Process
            processList.each(function(entry)
                {
                    var extender = entry[0];
                    var context = entry[1];
                    
                    try {
                        console.group("Process '%s'...", extender.getName());
                        
                        extender.process(page, context);
                        console.info("OK");
                    }
                    catch (ex) {
                        console.warn("Error");
                        throw ex;
                    }
                    finally {
                        console.groupEnd();
                    }
                });
                
            return true;
        }
        catch (ex) {
            if (ex instanceof AbortException) {
                console.debug(ex.toString());
            }
            else {
                if (!console.firebug) {
                    // This is for development
                    // alert(ex.toString());
                }
                else {
                    console.error("Unhandled exception occured during extenders execution:\n", ex.toString());
                }
            }
            return false;
        }
        finally {
            console.timeEnd("Extenders finished in");
            console.groupEnd();
        }
    }
};


/*** Custom extender classes ***/

var ScriptExtender = PageExtender.createClass({
    DEFAULT_TYPE: "text/javascript",
    DEFAULT_CHARSET: "UTF-8",

    initialize: function(src, type, charset) {
        base.initialize();
    
        if (src == null)
            throw new ArgumentNullException("src");
        this._src = src;
        this._type = (type != null ? type : this.DEFAULT_TYPE);
        this._charset = (charset != null) ? charset : this.DEFAULT_CHARSET;
    },
    
    getName: function() {
        return String.format("ScriptExtender[{0}, {1}]", this._src, this._type);
    },
    
    process: function(page, context) {
        var e = page.document.createElement("script");
        e.setAttribute("type", this._type);
        e.setAttribute("src", this._src);
        e.setAttribute("charset", this._charset);
        page.document.body.appendChild(e);
    }
});

var StyleExtender = PageExtender.createClass({
    initialize: function(src) {
        base.initialize();
        
        if (src == null)
            throw new ArgumentNullException("src");
        this._src = src;
    },

    getName: function() {
        return String.format("StyleExtender[{0}]", this._src);
    },

    analyze: function(page, context) {
        context.head = XPath.evalSingle('/html/head', page.document);
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

/*** MarshalException ***/
var MarshalException = Class.inherit(Exception);

Object.extend(MarshalException.prototype, {
    initialize: function(message, objectName, methodName, innerException) {
        base.initialize(message, innerException);
        
        this.objectName = objectName;
        this.methodName = methodName;
    },

    getType: function() {
        return "MarshalException";
    },
    
    getDescription: function() {
        var str = base.getDescription();
        
        if (this.objectName)
            str += "\nobject name='" + this.objectName + "'";
            
        if (this.methodName)
            str += "\nmethod name='" + this.methodName + "'";
            
        return str;
    }
});

/*** Logging ***/

// Firebug console properties for version "1.05"
const _FIREBUG_METHODS = ["log","debug","info","warn","error","assert","dir","dirxml","trace","group","groupEnd","time","timeEnd","profile","profileEnd","count"];

if (!window.console || !console.firebug) {
    // Dummy object
    var console = new Object();
    
    _FIREBUG_METHODS.each(function(p) {
            console[p] = function() { };
        });
}
