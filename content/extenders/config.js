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
 * The Original Code is Melior Annis Plus.
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

var PlusConfigTemplate = {
    getPrefNode: function() {
        throw "Not supported.";
    },
    getPrefNodeByXPath: function() {
        throw "Not supported.";
    },

    getEnabled: function() { 
        return this.getBoolean("enabled", true);
    },
    
    getMaxTahu: function() { 
        return this.getNumber("maxTahu", 30); 
    },
    
    getTemneBarvy: function() { 
        return this.getBoolean("temneBarvy", true); 
    },

    getAliance: function() {
        throw "Not implemented.";
    },
    
    getNastaveni: function() {
        throw "Not implemented.";
    }
};

var PlusConfigNastaveniTemplate = {
};


// TODO jako extender, special metodu na proxy configu
var PlusConfig = {
    _configCache: new Hash(),
    
    getConfig: function(id) {
        if (!id || isNaN(parseInt(id)))
            throw "id is invalid.";
        id = String(id);
        
        var cfg = this._configCache[id];
        if (!cfg) {
            var configName = "config." + id;
            Marshal.registerMethodCall(configName, "configManager", "getConfig", [id]);
            cfg = Marshal.createObjectProxy(configName);
            this._configCache[id] = cfg;
            
            Object.extend(cfg, PlusConfigTemplate);
            cfg.addPref = function() { cfg.addPref.apply(cfg, arguments); }; // odstrani navratovou hodnotu
            
            Marshal.registerMethodCall(configName + ".aliance", configName, "getPrefNode", ["aliance", true]);
            var aliance = Marshal.createObjectProxy(configName + ".aliance");
            cfg.getAliance = function() { return aliance; };
            
            var nastaveniName = configName + ".nastaveni";
            Marshal.registerMethodCall(nastaveniName, configName, "getPrefNode", ["nastaveni", true]);
            Marshal.registerMethodCall(nastaveniName + ".utok", nastaveniName, "getPrefNode", ["utok", true]);
            Marshal.registerMethodCall(nastaveniName + ".boj", nastaveniName, "getPrefNode", ["boj", true]);
            
            
        }
        
        return cfg;
    },
};
