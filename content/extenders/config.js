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
    
    getMaxTahu: function() {
        return this.getNumber("maxTahu", 30); 
    },
    
    getTemneBarvy: function() {
        return this.getBoolean("temneBarvy", true);
    },
    
    getAliance: function() {
        if (!this._aliance) {
            this._aliance = this.getPrefNode("aliance", true);
        }
        return this._aliance;
    },
    
    getNastaveni: function() {
        if (!this._nastaveni) {
            this._nastaveni = this.getPrefNode("nastaveni", true);
            Object.extend(this._nastaveni, PlusConfig.Nastaveni.prototype);
        }
        return this._nastaveni;
    },
};
 
PlusConfig.Nastaveni = new Object();
PlusConfig.Nastaveni.prototype = {
    getUtok: function() {
        if (!this._utok) {
            this._utok = this.getPrefNode("utok", true);
        }
        return this._utok;
    },
    
    getBoj: function() {
        if (!this._boj) {
            this._boj= this.getPrefNode("boj", true);
        }
        return this._boj;
    }
};

Object.extend(PlusConfig, {
    getConfig: function(id) {
        if (!id || isNaN(parseInt(id)))
            throw String.format("id '{0}' is invalid.", id);
        
        // Note: cfg should be proxy
        var cfg = Marshal.callMethod("configManager", "getConfig", [id]);
        if (!cfg)
            throw String.format("Unable to find config for id '{0}'.", id);
        
        return Object.extend(cfg, PlusConfig.prototype);
    },
});

// Extender
var configExtender = PageExtender.create({
    weak: true,

    analyze: function(page) {
        page.config = PlusConfig.getConfig(page.id);
        
        if (!page.config)
            throw String.format("Unable to get config for id '{0}'.", page.id);
        
        return true;
    }
});

pageExtenders.add(configExtender);
