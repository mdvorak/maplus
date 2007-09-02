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
 
var PlusConfig = new Object();
PlusConfig.prototype = {
    getEnabled: function() { 
        return this.getBoolean("enabled", true); 
    },
    
    getBarevnyText: function() {
        return this.getBoolean('barevnyText', true);
    },
    
    getRegent: function() {
        if (!this._regent) {
            this._regent = this.getPrefNode("regent", true);
        }
        return this._regent;
    },
        
    getMenu: function() {
        if (!this._menu) {
            this._menu = this.getPrefNode("menu", true);
        }
        return this._menu;
    },
    
    getAukce: function() {
        if (!this._aukce) {
            this._aukce = this.getPrefNode("aukce", true);
        }
        return this._aukce;
    }
};
 
Object.extend(PlusConfig, {
    EXTENSION: ".xml",
    
    getConfigName: function(id) {
        if (!id || isNaN(parseInt(id)))
            throw new ArgumentException("id", id, "Id is invalid.");
        
        return id + this.EXTENSION;
    },

    getConfig: function(id) {
        var name = this.getConfigName(id);
        
        var cfg = Marshal.callMethod("configManager", "getConfig", [name]);
        cfg = Object.extend(cfg, PlusConfig.prototype);
        
        cfg.save = function() { PlusConfig.saveConfig(name); };
        
        return cfg;
    },
    
    getLocalConfig: function(id) {
        var name = this.getConfigName(id);
        
        var cfg = Marshal.callMethod("localConfigManager", "getConfig", [name]);
        return cfg;
    },
    
    saveConfig: function(id) {
        var name = this.getConfigName(id);
        Marshal.callMethod("configManager", "saveConfig", [name]);
    }
});

// Config extender
pageExtenders.add(PageExtender.create({
    getName: function() { return "Konfigurace"; },

    analyze: function(page) {
        page.config = PlusConfig.getConfig(page.id);
        page.localConfig = PlusConfig.getLocalConfig(page.id);
        
        if (!page.config)
            throw new Exception(String.format("Unable to get config for id '{0}'.", page.id));
        if (!page.localConfig)
            throw new Exception(String.format("Unable to get config for id '{0}'.", page.id));
        
        return true;
    },
    
    process: null
}));
