﻿/* ***** BEGIN LICENSE BLOCK *****
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

var MaData = {
    load: function() {
        var path = MaPlus.getDataDirectory();
        path.append("data.xml");
        this.data = XmlConfig.load(path, "data");
        
        this.seznamProvincii = this.data.getPrefNode("seznamProvincii", true);
        this.seznamAlianci = this.data.getPrefNode("seznamAlianci", true);
    },
    
    save: function() {
        if (!this.data)
            return;
    
        var path = MaPlus.getDataDirectory();
        path.append("data.xml");
        XmlConfig.save(path, this.data);
    },
    
    najdiProvincii: function(id) {
        if (id == null || isNaN(id))
            return null;
            
        if (!this.root)
            this.load();
    
        var provi = this.seznamProvincii.getPrefNodeByXPath('provincie[@id = "' + id + '"]');
        
        if (provi) {
          return {
                id: id,
                regent: provi.getPref("regent"),
                provincie: provi.getPref("provincie"),
                povolani: provi.getPref("povolani"),
                presvedceni: provi.getPref("presvedceni"),
                aliance: provi.getPref("aliance")
            };
        }
        
        return null;
    },
    
    aktualizujProvincii: function(id, regent, provincie, povolani, presvedceni, aliance) {
        if (id == null || isNaN(id))
            return;
            
        if (!this.root)
            this.load();
    
        var provi = this.seznamProvincii.getPrefNodeByXPath('provincie[@id = "' + id + '"]');
        
        if (!provi) {
            provi = this.seznamProvincii.addPref("provincie");
            provi.setAttribute("id", id);
        }
        
        if (regent && regent != "") provi.setPref("regent", regent);
        if (provincie && provincie != "") provi.setPref("provincie", provincie);
        if (povolani && povolani != "") provi.setPref("povolani", povolani);
        if (presvedceni && presvedceni != "") provi.setPref("presvedceni", presvedceni);
        if (aliance && aliance != "") provi.setPref("aliance", (aliance != ZADNA_ALIANCE) ? aliance : null);
    },
    
    najdiAlianci: function(jmeno) {
        if (jmeno == null || jmeno == ZADNA_ALIANCE)
            return null;
    
        if (!this.root)
            this.load();
    
        var ali = this.seznamAlianci.getPrefNodeByXPath('aliance[jmeno = "' + jmeno + '"]');
        
        if (ali) {
            return {
                id: ali.getPref("id"),
                jmeno: jmeno,
                presvedceni: ali.getPref("presvedceni")
            };
        }
        
        return null;
    },
    
    najdiJmenoAliance: function(zacatekJmena) {
        if (zacatekJmena == null || zacatekJmena == ZADNA_ALIANCE)
            return null;
            
        if (!this.root)
            this.load();
            
        zacatekJmena = zacatekJmena.replace(/[.]{2,3}$/, "");
        
        var mozneAliance = elementEvaluate(this.seznamAlianci, 'aliance[starts-with(jmeno, "' + zacatekJmena + '")]');
        if (mozneAliance.length == 1) {
            initPrefNode(mozneAliance[0]);
            return mozneAliance[0].getPref("jmeno");
        }
        else
            return null;
    },
    
    aktualizujAlianci: function(jmeno, id, presvedceni) {
        if (jmeno == null || jmeno == ZADNA_ALIANCE)
            return;
            
        if (!this.root)
            this.load();
        
        var ali = this.seznamAlianci.getPrefNodeByXPath('aliance[jmeno = "' + jmeno + '"]');
        
        if (!ali) {
            ali = this.seznamAlianci.addPref("aliance");
            ali.setPref("jmeno", jmeno);
        }
        
        if (id && !isNaN(id)) ali.setPref("id", id);
        if (presvedceni && presvedceni != "") ali.setPref("presvedceni", presvedceni);
    }
};

var maDataAutosave = PageExtender.create({
    SAVE_INTERVAL: 100,
    
    _hits: 0,
    
    analyze: function(page, context) {
        if (++this._hits > this.SAVE_INTERVAL) {
            this._hits = 0;
            MaData.save();
        }
        
        return false;
    }
});

Marshal.registerObject("MaData", MaData);
WebExtender.registerExtender(MELIOR_ANNIS_URL + "/*", maDataAutosave);
WebExtender.registerUnloadHandler(function() { MaData.save(); });