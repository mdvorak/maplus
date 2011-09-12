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
    _callCache: new Hash(),
    
    callMethod: function(objectName, methodName, args, isAnonymousReference) {
        if (objectName == null)
            throw new ArgumentNullException("objectName");
        if (methodName == null)
            throw new ArgumentNullException("methodName");
        if (args != null && !(args instanceof Array))
            throw new ArgumentException("args", args, "Arguments must be an array.");
        
        var transportArgs = new Array();
        if (args != null) {
            for (var i = 0; i < args.length; i++) {
                if (Marshal.isProxy(args[i]))
                    transportArgs.push({ reference: args[i].__proxy, toString: function() { return "<ref " + this.reference + ">"; } });
                else
                    transportArgs.push({ value: args[i], toString: function() { return "" + this.value; } });
            }
        }
        
        var elem = document.createElement("marshal");
        document.body.appendChild(elem);
        
        try {
            var objectDescription = (!isAnonymousReference ? objectName : "<ref " + objectName + ">");
            Marshal._group("Marshal: Calling method %s.%s(%s)", objectDescription, methodName, transportArgs.join(", "));
            
            elem.setAttribute("objectName", objectName);
            elem.setAttribute("methodName", methodName);
            elem.setAttribute("arguments", Object.toJSON(transportArgs));
            
            Event.dispatch(elem, "MarshalMethodCall", true);
            Marshal._debug("%o", elem);
            
            // Exception
            if (elem.getAttribute("exception") != null) {
                var ex = elem.getAttribute("exception").evalJSON();
                Marshal._debug("Exception=%o", ex);
                throw new RemoteException(objectName, methodName, ex);
            }
            // Simple type
            else if (elem.getAttribute("retval") != null) {
                var retval = elem.getAttribute("retval").evalJSON();
                Marshal._debug("Return value=%o", retval);
                return retval;
            }
            // Single object reference
            else if (elem.getAttribute("reference") != null) {
                // Create proxy object
                var reference = elem.getAttribute("reference").evalJSON();
                
                if (reference.objectId == null)
                    throw new MarshalException("Unable to find returned reference id.", objectName, methodName);
                if (reference.proxyDefinition == null)
                    throw new MarshalException("Unable to find returned reference proxy definition.", objectName, methodName);

                var proxy = Marshal._proxyCache[reference.objectId];
                if (proxy == null) {
                    proxy = Marshal._createProxyFromDefinition(reference.objectId, reference.proxyDefinition, true);
                    Marshal._proxyCache[reference.objectId] = proxy;
                }
                
                Marshal._debug("Reference=%o", proxy);
                return proxy;
            }
            // Object reference list
            else if (elem.getAttribute("list") != null) {
                var list = elem.getAttribute("list").evalJSON();
                var proxies = new Array();
                
                // Create list of proxy objects
                for (var i = 0; i < list.length; i++) {
                    var reference = list[i];
                    
                    if (reference.objectId == null)
                        throw new MarshalException("Unable to find returned reference id.", objectName, methodName);
                    if (reference.proxyDefinition == null)
                        throw new MarshalException("Unable to find returned reference proxy definition.", objectName, methodName);

                    var proxy = Marshal._proxyCache[reference.objectId];
                    if (proxy == null) {
                        proxy = Marshal._createProxyFromDefinition(reference.objectId, reference.proxyDefinition, true);
                        Marshal._proxyCache[reference.objectId] = proxy;
                    }
                    
                    proxies[i] = proxy;
                }
                
                Marshal._debug("ReferenceList=%o", proxies);
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
            Marshal._groupEnd();
        }
    },
    
    getObjectProxy: function(objectName) {
        if (objectName == null)
            throw new ArgumentNullException("objectName");
  
        var proxy = Marshal._proxyCache[objectName];
        
        if (proxy == null) {
            var elem = document.createElement("marshal");
            document.body.appendChild(elem);
            
            try {
                Marshal._group("Marshal: Creating proxy object '%s'", objectName);
            
                elem.setAttribute("objectName", objectName);
                Event.dispatch(elem, "MarshalGetProxyDefinition", true);
                
                if (elem.getAttribute("exception") != null) {
                    var ex = elem.getAttribute("exception").evalJSON();
                    throw new RemoteException(objectName, null, ex);
                }
                
                var defJSON = elem.getAttribute("proxyDefinition");
                if (defJSON == null || defJSON.empty())
                    throw new MarshalException("Unable to get proxy definition.", objectName);
                
                var def = defJSON.evalJSON();
                Marshal._debug("%o", def);
                
                proxy = Marshal._createProxyFromDefinition(objectName, def);
            }
            finally {
                // Comment this for easier debugging
                document.body.removeChild(elem);
                Marshal._groupEnd();
            }
        }
        
        return proxy;
    },
    
    isProxy: function(object) {
        return (object != null 
                && typeof object == "object" 
                && object.__proxy != null 
                && typeof object.__proxy == "string");
    },
    
    callCachedMethod: function(objectName, methodName, args, isAnonymousReference) {
        if (objectName == null)
            throw new ArgumentNullException("objectName");
        if (methodName == null)
            throw new ArgumentNullException("methodName");
        if (args != null && !(args instanceof Array))
            throw new ArgumentException("args", args, "Arguments must be an array.");
            
        var callID = objectName + "." + methodName + "(" + args.join(", ") + ")";
        logger().log("Marshal: Calling cached method %s", callID);
        
        var result = Marshal._callCache[callID];
        if (result == null) {
            // Call original method and cache result
            result = {
                id: callID,
                value: Marshal.callMethod(objectName, methodName, args, isAnonymousReference)
            };
            Marshal._callCache[callID] = result;
        }
        
        return result.value;
    },
    
    // Returns remote reference to the current document
    getDocumentReference: function() {
        return Marshal.callMethod("Marshal", "getDocumentReference");
    },
    
    _createProxyFromDefinition: function(objectName, def, isAnonymousReference) {
        if (objectName == null)
            throw new ArgumentNullException("objectName");
        if (def == null)
            throw new ArgumentNullException("def");
    
        objectName = objectName.toString();
    
        var proxy = new Object();
        var proxyMethods = $A(def.methods);
        
        proxyMethods.each(
            function(method) {
                var transport = (method.cached ? Marshal.callCachedMethod : Marshal.callMethod);
                proxy[method.name] = function() { return transport.call(Marshal, objectName, method.name, $A(arguments), isAnonymousReference); };
            });
            
        proxy.__proxy = objectName;
            
        return proxy;
    },
    
    _debug: function() {
        if (window.MARSHAL_DEBUG >= 2)
            logger().debug.apply(logger(), arguments);
    },
    
    _group: function() {
        if (window.MARSHAL_DEBUG >= 2)
            logger().group.apply(logger(), arguments);
        else if (window.MARSHAL_DEBUG >= 1)
            logger().debug.apply(logger(), arguments);
    },
    
    _groupEnd: function() {
        if (window.MARSHAL_DEBUG >= 2)
            logger().groupEnd.apply(logger(), arguments);
    }
};


/*** RemoteExceptionWrapper class ***/
var RemoteExceptionWrapper = Class.create({
    initialize: function(remoteException) {  
        this.remoteException = remoteException;
        
        var str = "";
        for (var i in remoteException) {
            if (str != "") str += "\n";
            str += i + ": " + remoteException[i];
        }
        
        this.string = str;
    },
    
    toString: function() {
        return this.string;
    }
});

/*** RemoteException class ***/
var RemoteException = Class.create(MarshalException, {
    initialize: function($super, objectName, methodName, remoteException) {
        $super(RemoteException.MESSAGE, objectName, methodName, new RemoteExceptionWrapper(remoteException));
    }
});

RemoteException.MESSAGE = "Service returned an exception.";

