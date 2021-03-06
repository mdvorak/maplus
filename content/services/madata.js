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

var MaData = {
    load: function() {
        var path = MaPlus.DataDirectory;
        path.append("data.xml");
        this.data = XmlConfig.load(path, "data");
        
        // Zkontroluj vek
        this.vek = this.data.getPref("vek");
        
        // Pozn: Kasli na to pokud neni vek znamy, kvuli chybe prece vse nezahodime ne?
        // Zahodit to muzeme pozdeji... :)
        if (MaPlus.AgeName != null && this.vek != MaPlus.AgeName) {
            // Pokud vek nesouhlasi, smazej ulozena data
            this.data = XmlConfig.createEmpty("data");
            this.data.setPref("vek", MaPlus.AgeName);
        }
        
        this.seznamProvincii = this.data.getPrefNode("seznamProvincii", true);
        this.seznamAlianci = this.data.getPrefNode("seznamAlianci", true);
    },
        
    save: function() {
        if (!this.data)
            return;
    
        var path = MaPlus.DataDirectory;
        path.append("data.xml");
        XmlConfig.save(path, this.data);
    },
    
    clear_PROXY: Marshal.BY_VALUE,
    clear: function() {
        this.data = XmlConfig.createEmpty("data");
        this.data.setPref("vek", MaPlus.AgeName);
        
        this.seznamProvincii = this.data.getPrefNode("seznamProvincii", true);
        this.seznamAlianci = this.data.getPrefNode("seznamAlianci", true);
         
        this.save();
    },
    
    _ensureDataAreLoaded: function() {
        if (!this.data)
            this.load();
    },
    
    najdiProvincii_PROXY: Marshal.BY_VALUE,
    najdiProvincii: function(id) {
        if (id == null || isNaN(id))
            return null;
            
        this._ensureDataAreLoaded();
    
        var provi = this.seznamProvincii.evalPrefNode('provincie[@id = "' + id + '"]');
        
        if (provi) {
            var aliance = provi.getPref("aliance");
  
            return {
                id: id,
                regent: provi.getPref("regent"),
                provincie: provi.getPref("provincie"),
                povolani: provi.getPref("povolani"),
                presvedceni: provi.getPref("presvedceni"),
                aliance: (aliance != ZADNA_ALIANCE ? aliance : null),
                alianceZnama: (aliance != null),
                update: new Date(parseInt(provi.getAttribute("update")))
            };
        }
        
        return null;
    },
    
    aktualizujProvincii_PROXY: Marshal.BY_VALUE,
    aktualizujProvincii: function(id, regent, provincie, povolani, presvedceni, aliance) {
        if (id == null || isNaN(id))
            return;
            
        this._ensureDataAreLoaded();
    
        var provi = this.seznamProvincii.evalPrefNode('provincie[@id = "' + id + '"]');
        
        if (!provi) {
            provi = this.seznamProvincii.addPref("provincie");
            provi.setAttribute("id", id);
        }
        
        if (regent && regent != "") provi.setPref("regent", regent);
        if (provincie && provincie != "") provi.setPref("provincie", provincie);
        if (povolani && povolani != "") provi.setPref("povolani", povolani);
        if (presvedceni && presvedceni != "") provi.setPref("presvedceni", presvedceni);
        
        if (aliance != null && aliance.length > 0) {
            // Zjisti jestli je aliance tajna
            var tajna = false;
            if (aliance != null)
                tajna = (this.seznamAlianci.evalPrefNode('aliance[jmeno = "' + aliance + '" and typ = "tajna"]') != null);
            
            if (!tajna)
                provi.setPref("aliance", aliance);
            else
                provi.setPref("tajna", aliance);
        }
        
        provi.setAttribute("update", new Date().getTime());
    },
    
    // Vraci array id
    clenoveAliance_PROXY: Marshal.BY_VALUE,
    clenoveAliance: function(jmenoAliance, idAliance) {
        // Najdi jmeno aliance podle id pokud je k dispozici
        if (jmenoAliance == null && idAliance != null) {
            var aliance = this.najdiAlianci(null, idAliance);
            if (aliance != null)
                jmenoAliance = aliance.jmeno;
        }
    
        // Pokud neni zname jmeno aliance, vrat prazdnou array
        if (jmenoAliance == null)
            return new Array();
    
        this._ensureDataAreLoaded();
    
        // Vytvor seznam clenu
        var list = new Array();
        var provincie = this.seznamProvincii.evalPrefNodeList('provincie[aliance = "' + jmenoAliance + '" or tajna= "' + jmenoAliance + '"]');
        
        provincie.each(function(provi) {
            var id = parseInt(provi.getAttribute("id"));
            if (!isNaN(id))
                list.push(id);
        });
            
        return list;
    },
    
    najdiAlianci_PROXY: Marshal.BY_VALUE,
    najdiAlianci: function(jmeno, id) {
        if (id == null && (jmeno == null || jmeno == ZADNA_ALIANCE))
            return null;
    
        this._ensureDataAreLoaded();
    
        var ali;
        if (jmeno != null)
            ali = this.seznamAlianci.evalPrefNode('aliance[jmeno = "' + jmeno + '"]');
        else
            ali = this.seznamAlianci.evalPrefNode('aliance[@id = "' + id + '"]');
        
        if (ali) {
            return {
                id: ali.getAttribute("id"),
                jmeno: ali.getPref("jmeno"),
                presvedceni: ali.getPref("presvedceni"),
                typ: ali.getPref("typ"),
                update: new Date(parseInt(ali.getAttribute("update")))
            };
        }
        
        return null;
    },
    
    najdiJmenoAliance_PROXY: Marshal.BY_VALUE,
    najdiJmenoAliance: function(zacatekJmena) {
        if (zacatekJmena == null || zacatekJmena == ZADNA_ALIANCE)
            return null;
            
        this._ensureDataAreLoaded();
            
        zacatekJmena = zacatekJmena.replace(/[.]{2,3}$/, "");
        
        var mozneAliance = this.seznamAlianci.evalPrefNodeList('aliance[starts-with(jmeno, "' + zacatekJmena + '")]');
        if (mozneAliance.length == 1)
            return mozneAliance[0].getPref("jmeno");
        else
            return null;
    },
    
    aktualizujAlianci_PROXY: Marshal.BY_VALUE,
    aktualizujAlianci: function(jmeno, id, presvedceni, typ) {
        if (jmeno == null || jmeno == ZADNA_ALIANCE)
            return;
            
        this._ensureDataAreLoaded();
        
        var ali = this.seznamAlianci.evalPrefNode('aliance[jmeno = "' + jmeno + '"]');
        
        if (!ali) {
            ali = this.seznamAlianci.addPref("aliance");
            ali.setPref("jmeno", jmeno);
        }
        
        if (id && !isNaN(id)) ali.setAttribute("id", id);
        if (presvedceni && presvedceni != "") ali.setPref("presvedceni", presvedceni);
        if (typ != null) ali.setPref("typ", typ);
        
        ali.setAttribute("update", new Date().getTime());
    },
    
    // Pro moznost upozorneni ze je seznam zastaraly
    seznamAlianciUpdatovan_PROXY: Marshal.BY_VALUE,
    seznamAlianciUpdatovan: function() {
        this._ensureDataAreLoaded();
            
        this.seznamAlianci.setAttribute("update", new Date().getTime());
    },
    
    getStariSeznamuAlianci_PROXY: Marshal.BY_VALUE,
    getStariSeznamuAlianci: function() {
        this._ensureDataAreLoaded();
    
        var s = this.seznamAlianci.getAttribute("update");
        if (s == null || s.blank())
            return Number.MAX_VALUE;
            
        var stari = new Date().getTime() - parseInt(s);
        return isNaN(stari) ? Number.MAX_VALUE : stari;
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
