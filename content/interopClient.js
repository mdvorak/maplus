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
        
        var argsStr = args ? Object.toJSON(args) : null;
        
        var elem = document.createElement("marshal");
        document.body.appendChild(elem);
        
        try {
            elem.setAttribute("objectName", objectName);
            elem.setAttribute("methodName", methodName);
            elem.setAttribute("arguments", argsStr);
            
            Event.dispatch(elem, "MarshalMethodCall", true);
            
            if (elem.getAttribute("exception")) {
                var ex = elem.getAttribute("exception").evalJSON();
                throw new RemoteException(objectName, methodName, ex);
            }
            else if (elem.getAttribute("retval"))
                return elem.getAttribute("retval").evalJSON();
            else if (elem.getAttribute("objectId")) {
                // Create proxy object
                var objectId = elem.getAttribute("objectId");
                var proxyDefinition = elem.getAttribute("proxyDefinition");
                
                if (!proxyDefinition)
                    throw new MarshalException("Unable to find proxy definition.", objectName, methodName);

                var proxy = this._proxyCache[objectId];
                if (!proxy) {
                    proxy = this._createProxyFromDefinition(objectId, proxyDefinition.evalJSON());
                }
                
                return proxy;
            }
            else {
                return;
            }
        }
        finally {
            // Comment this for easier debugging
            document.body.removeChild(elem);
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
                proxy = this._createProxyFromDefinition(objectName, def);
            }
            finally {
                // Comment this for easier debugging
                document.body.removeChild(elem);
            }
        }
        
        return proxy;
    },
    
    _createProxyFromDefinition: function(objectName, def) {
        if (!objectName)
            throw new ArgumentNullException("objectName");
        if (!def)
            throw new ArgumentNullException("def");
    
        var proxy = new Object();
        var proxyMethods = $A(def.methods);
        
        var _this = this;
        proxyMethods.each(
            function(method) {
                proxy[method.name] = function() { return _this.callMethod(objectName, method.name, $A(arguments)); };
            });
            
        return proxy;
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
