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

const nsISupports = Components.interfaces.nsISupports;

const CLASS_ID = Components.ID("8edb4553-cfa1-4ded-8d2c-efb7e70dbc2b");
const CLASS_NAME = "Private Javascript Namespace";
const CONTRACT_ID = "@michal.dvorak/privatespace_maplus;1";

const CONTENT_URL = "chrome://maplus/content/";

function PrivateSpace() {
  this.wrappedJSObject = this;
}

var alert = function() { }

// This is the implementation of your component.
PrivateSpace.prototype = {
    initialize: function(win)
    {
        if (this._initialized)
            return;

        // Only for debugging
        alert = function() { win.alert.apply(win, arguments); };
        
        var jssubscriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                                          .getService(Components.interfaces.mozIJSSubScriptLoader);

        // Loads helper script with methods for loading JS files and
        // setup in XPCOM environment
        jssubscriptLoader.loadSubScript(CONTENT_URL + "componentHelper.js");
         
        // Load services from definition (method defined in componentHelper.js)
        var services = loadFileListDefinition(CONTENT_URL + "services.xml", CONTENT_URL);
        for (var i = 0; i < services.length; i++) {
            jssubscriptLoader.loadSubScript(services[i]);
        }
        
        // Load includes
        var libraries = loadFileListDefinition(CONTENT_URL + "includes.xml", CONTENT_URL);
        for (var i = 0; i < libraries.length; i++) {
            ExtenderManager.include(libraries[i]);
        }
        
        this._initialized = true;
    },
    
    registerWindow: function(win) {
        if (!this._initialized)
            return;
    
        // Must be loaded by services.xml
        WebExtender.init(win);
    },

    // for nsISupports
    QueryInterface: function(aIID)
    {
        // add any other interfaces you support here
        if (!aIID.equals(nsISupports))
            throw Components.results.NS_ERROR_NO_INTERFACE;
        return this;
    }
}

//=================================================
// Note: You probably don't want to edit anything
// below this unless you know what you're doing.
//
// Factory
var PrivateSpaceFactory = {
  singleton: null,
  createInstance: function (aOuter, aIID)
  {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    if (this.singleton == null)
      this.singleton = new PrivateSpace();
    return this.singleton.QueryInterface(aIID);
  }
};

// Module
var PrivateSpaceModule = {
  registerSelf: function(aCompMgr, aFileSpec, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
  },

  unregisterSelf: function(aCompMgr, aLocation, aType)
  {
    aCompMgr = aCompMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
    aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
  },
  
  getClassObject: function(aCompMgr, aCID, aIID)
  {
    if (!aIID.equals(Components.interfaces.nsIFactory))
      throw Components.results.NS_ERROR_NOT_IMPLEMENTED;

    if (aCID.equals(CLASS_ID))
      return PrivateSpaceFactory;

    throw Components.results.NS_ERROR_NO_INTERFACE;
  },

  canUnload: function(aCompMgr) { return true; }
};

//module initialization
function NSGetModule(aCompMgr, aFileSpec) { return PrivateSpaceModule; }
