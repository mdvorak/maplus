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

/*** Marshal client component class ***/
var Marshal = {
    _proxyCache: new Hash(),
    
    callMethod: function(objectName, methodName, args) {
        if (!objectName)
            throw new ArgumentNullException("objectName");
        if (!methodName)
            throw new ArgumentNullException("methodName");
        if (args && !(args instanceof Array))
            throw new ArgumentException("args", args, "Arguments must be an array.");
        
        var transportArgs = new Array();
        if (args) {
            for (var i = 0; i < args.length; i++) {
                if (this.isProxy(args[i]))
                    transportArgs.push({ reference: args[i].__proxy });
                else
                    transportArgs.push({ value: args[i] });
            }
        }
        
        var elem = document.createElement("marshal");
        document.body.appendChild(elem);
        
        try {
            this._group("Marshal: Calling method %s.%s(%s)", objectName, methodName, args.join(", "));
            
            elem.setAttribute("objectName", objectName);
            elem.setAttribute("methodName", methodName);
            elem.setAttribute("arguments", Object.toJSON(transportArgs));
            
            Event.dispatch(elem, "MarshalMethodCall", true);
            this._debug("%o", elem);
            
            // Exception
            if (elem.getAttribute("exception")) {
                var ex = elem.getAttribute("exception").evalJSON();
                this._debug("Exception=%o", ex);
                throw new RemoteException(objectName, methodName, ex);
            }
            // Simple type
            else if (elem.getAttribute("retval")) {
                var retval = elem.getAttribute("retval").evalJSON();
                this._debug("Return value=%o", retval);
                return retval;
            }
            // Single object reference
            else if (elem.getAttribute("reference")) {
                // Create proxy object
                var reference = elem.getAttribute("reference").evalJSON();
                
                if (!reference.objectId)
                    throw new MarshalException("Unable to find returned reference id.", objectName, methodName);
                if (!reference.proxyDefinition)
                    throw new MarshalException("Unable to find returned reference proxy definition.", objectName, methodName);

                var proxy = this._proxyCache[reference.objectId];
                if (!proxy) {
                    proxy = this._createProxyFromDefinition(reference.objectId, reference.proxyDefinition);
                    this._proxyCache[reference.objectId] = proxy;
                }
                
                this._debug("Reference=%o", proxy);
                return proxy;
            }
            // Object reference list
            else if (elem.getAttribute("list")) {
                var list = elem.getAttribute("list").evalJSON();
                var proxies = new Array();
                
                // Create list of proxy objects
                for (var i = 0; i < list.length; i++) {
                    var reference = list[i];
                    
                    if (!reference.objectId)
                        throw new MarshalException("Unable to find returned reference id.", objectName, methodName);
                    if (!reference.proxyDefinition)
                        throw new MarshalException("Unable to find returned reference proxy definition.", objectName, methodName);

                    var proxy = this._proxyCache[reference.objectId];
                    if (!proxy) {
                        proxy = this._createProxyFromDefinition(reference.objectId, reference.proxyDefinition);
                        this._proxyCache[reference.objectId] = proxy;
                    }
                    
                    proxies[i] = proxy;
                }
                
                this._debug("ReferenceList=%o", proxies);
                return proxies;
            }
            // No return value
            else {
                return;
            }
        }
        finally {
            // Comment this for easier debugging
            document.body.removeChild(elem);
            this._groupEnd();
        }
    },
    
    getObjectProxy: function(objectName) {
        if (!objectName)
            throw new ArgumentNullException("objectName");
  
        var proxy = this._proxyCache[objectName];
        
        if (!proxy) {
            var elem = document.createElement("marshal");
            document.body.appendChild(elem);
            
            try {
                this._group("Marshal: Creating proxy object '%s'", objectName);
            
                elem.setAttribute("objectName", objectName);
                Event.dispatch(elem, "MarshalGetProxyDefinition", true);
                
                if (elem.getAttribute("exception")) {
                    var ex = elem.getAttribute("exception").evalJSON();
                    throw new RemoteException(objectName, null, ex);
                }
                
                var defJSON = elem.getAttribute("proxyDefinition");
                if (!defJSON || defJSON.empty())
                    throw new MarshalException("Unable to get proxy definition.", objectName);
                
                var def = defJSON.evalJSON();
                this._debug("%o", def);
                
                proxy = this._createProxyFromDefinition(objectName, def);
            }
            finally {
                // Comment this for easier debugging
                document.body.removeChild(elem);
                this._groupEnd();
            }
        }
        
        return proxy;
    },
    
    isProxy: function(object) {
        if (object == null)
            return new ArgumentNullException("object");
        return (typeof object == "object" && object.__proxy && typeof object.__proxy == "string");
    },
    
    _createProxyFromDefinition: function(objectName, def) {
        if (!objectName)
            throw new ArgumentNullException("objectName");
        if (!def)
            throw new ArgumentNullException("def");
    
        objectName = objectName.toString();
    
        var proxy = new Object();
        var proxyMethods = $A(def.methods);
        
        var _this = this;
        proxyMethods.each(
            function(method) {
                proxy[method.name] = function() { return _this.callMethod(objectName, method.name, $A(arguments)); };
            });
            
        proxy.__proxy = objectName;
            
        return proxy;
    },
    
    _debug: function() {
        if (MARSHAL_DEBUG >= 2)
            console.debug.apply(console, arguments);
    },
    
    _group: function() {
        if (MARSHAL_DEBUG >= 2)
            console.group.apply(console, arguments);
        else if (MARSHAL_DEBUG >= 1)
            console.debug.apply(console, arguments);
    },
    
    _groupEnd: function() {
        if (MARSHAL_DEBUG >= 2)
            console.groupEnd.apply(console, arguments);
    }
};


/*** RemoteExceptionWrapper class ***/
var RemoteExceptionWrapper = Class.create();

RemoteExceptionWrapper.prototype = {
    initialize: function(remoteException) {  
        this.remoteException = remoteException;
        
        var str = "";
        for (var i in remoteException) {
            if (str) str += "\n";
            str += i + ": " + remoteException[i];
        }
        
        this.string = str;
    },
    
    toString: function() {
        return this.string;
    }
};

/*** RemoteException class ***/
var RemoteException = Class.inherit(MarshalException);

RemoteException.MESSAGE = "Service returned an exception.";

Object.extend(RemoteException.prototype, {
    initialize: function(objectName, methodName, remoteException) {
        base.initialize(RemoteException.MESSAGE, objectName, methodName, new RemoteExceptionWrapper(remoteException));
    }
});

