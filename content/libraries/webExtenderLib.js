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

/*** parse functions ***/
function parseBoolean(str) {
    if (str == null)
        return false;
    
    str = ("" + str).toLowerCase();
    if (str == "true")
        return true;
    
    var n = parseInt(str);
    return !isNaN(n) && (n != 0);
}

function parseUrl(href) {
    var url = String(href).replace(/#.*$/, "");
    var m = url.match(/\/?([\w.]+?)([?].+?)?$/);
    var name = (m != null) ? m[1] : null;
    // url encoded arguments
    var args = href.toQueryParams();
    
    return {
        href: href,
        url: url,
        name: name,
        arguments: $H(args)
    };
}

/*** Extender object model ***/
Object.extend(Function, {
    bind: function(object, method) {
        return function() { return method.apply(object, arguments); };
    }
});

/*** Misc objects extension ***/
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
        
        if (innerHtml instanceof Node) {
            e.appendChild(innerHtml);
        }
        else if (innerHtml != null) {
            e.innerHTML = innerHtml;
        }
        
        return e;
    }
});

/*** Exception class ***/
var Exception = Class.create({
    initialize: function(message, innerException) {
        this.message = message;
        this.innerException = innerException;
        // This will contain also stack trace of exception constructors, however better then nothing.
        this.stack = new Error().stack;
    },
    
    getStack: function() {
        return this.stack;
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
            
        return "" + str;
    }
});

Object.extend(Exception, {
    getExceptionType: function(ex) {
        return (ex != null && ex.getType != null) ? ex.getType() : null;
    }
});

/*** ArgumentException class ***/
var ArgumentException = Class.create(Exception, {
    initialize: function($super, argName, argValue, message, innerException) {
        $super(message, innerException);
        
        this.name = argName;
        this.value = argValue;
    },

    getType: function() {
        return "ArgumentException";
    },

    getDescription: function($super) {
        var str = $super();
        
        if (this.name != null)
            str += String.format("\nargument name='{0}' value='{1}'", this.name, String(this.value));
            
        return str;
    }
});

/*** ArgumentNullException ***/
var ArgumentNullException = Class.create(ArgumentException, {
    initialize: function($super, argName, innerException) {
        $super(argName, null, ArgumentNullException.MESSAGE, innerException);
    },
    
    getType: function() {
        return "ArgumentNullException";
    }
});

ArgumentNullException.MESSAGE = "Argument is null.";

/*** InvalidOperationException ***/
var InvalidOperationException = Class.create(Exception, {
    getType: function() {
        return "InvalidOperationException";
    }
});

/*** XPathException class ***/
var XPathException = Class.create(Exception, {
    initialize: function($super, message, expression, innerException) {
        $super(message || XPathException.DEFAULT_MESSAGE, innerException);
        
        this.expression = expression;
    },
    
    getType: function() {
        return "XPathException";
    },
    
    getDescription: function($super) {
        var str = $super();
        
        if (this.expression != null)
            str += "\nexpression: '" + this.expression + "'";

        return str;
    }
});

XPathException.DEFAULT_MESSAGE = "Error evaluating XPath expression.";

/*** XPath class ***/
var XPath = {
    evaluate: function(xpath, context, namespaceResolver, resultType, noLog) {
        var retval;
        try {
            if (xpath == null) return null;
            if (resultType == null) resultType = XPathResult.ANY_TYPE;
            if (context == null) 
                context = document;
            else
                context = $(context);
            
            var doc = (context.ownerDocument != null) ? context.ownerDocument : context;
            retval = doc.evaluate(xpath, context, namespaceResolver, resultType, null);
            return retval;
        }
        catch (ex) {
            retval = new XPathException(null, xpath, ex);
            throw retval;
        }
        finally {
            if (window.XPATH_DEBUG && !noLog)
                logger().debug("XPath.evaluate('%s', %o, %o, %d): %o", xpath, context, namespaceResolver, resultType, retval);
        }
    },
    
    evalList: function(xpath, context, namespaceResolver) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, namespaceResolver, XPathResult.ORDERED_NODE_ITERATOR_TYPE, true);
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
            if (window.XPATH_DEBUG)
                logger().debug("XPath.evalList('%s', %o, %o): %o", xpath, context, namespaceResolver, retval);
        }
    },
    
    evalSingle: function(xpath, context, namespaceResolver) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, namespaceResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, true);
            retval = (result != null) ? $(result.singleNodeValue) : null;
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (window.XPATH_DEBUG)
                logger().debug("XPath.evalSingle('%s', %o, %o): %o", xpath, context, namespaceResolver, retval);
        }
    },
    
    evalString: function(xpath, context, namespaceResolver) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, namespaceResolver, XPathResult.STRING_TYPE, true);
            retval = (result != null) ? result.stringValue : null;
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (window.XPATH_DEBUG)
                logger().debug("XPath.evalString('%s', %o, %o): %o", xpath, context, namespaceResolver, retval);
        }
    },
    
    evalNumber: function(xpath, context, namespaceResolver) {
        var retval;
        try {
            var result = this.evaluate(xpath, context, namespaceResolver, XPathResult.NUMBER_TYPE, true);
            retval = (result != null) ? result.numberValue : null;
            return retval;
        }
        catch (ex) {
            retval = ex;
            throw ex;
        }
        finally {
            if (window.XPATH_DEBUG)
                logger().debug("XPath.evalNumber('%s', %o, %o): %o", xpath, context, namespaceResolver, retval);
        }
    }
};

function $X(xpath, context, namespaceResolver) {
    return XPath.evalSingle(xpath, context, namespaceResolver);
}

function $XL(xpath, context, namespaceResolver) {
    return XPath.evalList(xpath, context, namespaceResolver);
}

/*** Page class ***/
var Page = Class.create({
    initialize: function(doc) {
        // Note: when you use other than default document, you can't use some prototype methods, like $('abc').
        if (doc == null) doc = document;
    
        this.document = $(doc);
        
        var urlData = parseUrl(this.document.location.href);
        this.url = urlData.url;
        this.name = urlData.name;
        this.arguments = urlData.arguments; // Url encoded arguments
    }
});

/*** PageExtender class ***/
var PageExtender = Class.create({
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
});

Object.extend(PageExtender, {
    create: function(definition) {
        return Object.extend(new PageExtender(), definition);
    }
});

/*** AbortException class ***/
var AbortException = Class.create(Exception, {
    getType: function() {
        return "AbortException";
    }
});

/*** PageExtenderCollection class ***/
var PageExtenderCollection = Class.create({
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
            logger().group("Running %d extenders..", this._extenders.length);
            logger().time("Extenders finished in");

            var processList = new Array();

            // Analyze
            this._extenders.each(function(e) {
                try {
                    logger().group("Analyze '%s'...", e.getName());

                    var context = new Object();
                    if (e.analyze(page, context)) {
                        if (e.process) {
                            processList.push([e, context]);
                            logger().info("OK");
                        }
                        else {
                            logger().info("NoProcess");
                        }
                    }
                    else
                        logger().info("Failed");
                }
                catch (ex) {
                    logger().warn("Error");
                    throw ex;
                }
                finally {
                    logger().groupEnd();
                }
            });

            // Process
            processList.each(function(entry) {
                var extender = entry[0];
                var context = entry[1];

                try {
                    logger().group("Process '%s'...", extender.getName());

                    extender.process(page, context);
                    logger().info("OK");
                }
                catch (ex) {
                    logger().warn("Error");
                    throw ex;
                }
                finally {
                    logger().groupEnd();
                }
            });

            return true;
        }
        catch (ex) {
            if (ex instanceof AbortException) {
                logger().debug(ex.toString());
            }
            else {
                var str = "Unhandled exception occured during extenders execution:\n" + ex.toString() + "\n\n" + ex.stack;
            
                if (!logger().firebug) {
                    // Pouze pro vyvoj
                    // Ne ze by bylo spatny nevedet o chybe, ale bezne uzivatele to bude akorat otravovat...
                    alert(str);
                }
                else {
                    logger().error(str);
                }
            }
            return false;
        }
        finally {
            logger().timeEnd("Extenders finished in");
            logger().groupEnd();
        }
    }
});

/*** MarshalException ***/
var MarshalException = Class.create(Exception, {
    initialize: function($super, message, objectName, methodName, innerException) {
        $super(message, innerException);
        
        this.objectName = objectName;
        this.methodName = methodName;
    },

    getType: function() {
        return "MarshalException";
    },
    
    getDescription: function($super) {
        var str = $super();
        
        if (this.objectName)
            str += "\nobject name='" + this.objectName + "'";
            
        if (this.methodName)
            str += "\nmethod name='" + this.methodName + "'";
            
        return str;
    }
});

