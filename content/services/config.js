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

var CONFIG_ROOT_NAME = "prefs";

XmlConfigNode.XPath.useExtension();
XmlConfigNode.Extended.useExtension();

// Validace na vek
function ageValidator(root) {
    if (MaPlus.AgeName != null) {
        var vek = root.getAttribute("vek");
        if (vek != null && vek.length > 0 && vek != MaPlus.AgeName) {
            var q = "Byla detekovana zmena veku. Chcete smazat Vase nastaveni?";
            q += "\nTento dialog se jiz vickrat nezobrazi. Smazat nastaveni je mozne manualne v nastaveni.";
            
            var r = PromptService.confirm(q);
            
            if (r) {
                // Odstran veskera nastaveni
                while (root.firstChild != null)
                    root.removeChild(root.firstChild);
            }
        }
        root.setAttribute("vek", MaPlus.AgeName);
    }
    else {
        logger().warn("Upozorneni: Jmeno veku neni zname, nebude ulozeno v nastaveni.");
    }
}

// Vytvor a registruj sluzby
var configManager = new XmlConfigManager(MaPlus.DataDirectory, CONFIG_ROOT_NAME, ageValidator);
var localConfigManager = new XmlConfigManager(null, CONFIG_ROOT_NAME);

var plusConfigAutosave = PageExtender.create({
    SAVE_INTERVAL: 100,
    
    _hits: 0,
    
    analyze: function(page, context) {
        if (++this._hits > this.SAVE_INTERVAL) {
            this._hits = 0;
            configManager.saveAll();
        }
        
        return false;
    }
});

// Optimilizace rychlosti
var ConfigHelperService = {
    getLinkData_PROXY: Marshal.BY_VALUE,
    getLinkData: function(configNode) {
        if (configNode == null)
            throw new ArgumentNullException("configNode");
            
        return LinkData.fromConfig(configNode);
    },
    
    updateKouzla_PROXY: Marshal.BY_VALUE,
    updateKouzla: function(configNode, kouzla) {
        if (configNode == null)
            throw new ArgumentNullException("configNode");
            
        for (var i = 0; i < kouzla.length; i++) {
            if (configNode.evalPrefNode('kouzlo[id = "' + kouzla[i].id + '" and name]') != null)
                continue;
                
            var p = configNode.addPref("kouzlo");
            p.setPref("id", kouzla[i].id);
            p.setPref("name", kouzla[i].name);
        }
    },
    
    addHit_PROXY: Marshal.BY_VALUE,
    addHit: function(configNode) {
        var value = configNode.getNumber();
        if (isNaN(value) || value < 0)
            value = 0;
        
        configNode.setPref(null, ++value);
        
        var from = parseInt(configNode.getAttribute("from"));
        if (isNaN(from)) {
            from = new Date().getTime();
            configNode.setAttribute("from", from);
        }
        
        return value;
    }
};

// Register
Marshal.registerObject("configManager", configManager);
Marshal.registerObject("localConfigManager", localConfigManager);
Marshal.registerObject("ConfigHelperService", ConfigHelperService);
WebExtender.registerExtender(MELIOR_ANNIS_URL + "/*", plusConfigAutosave);
WebExtender.registerUnloadHandler(function() { configManager.saveAll(); });



// Heslo pro hlidku
var HlidkaHeslo = {
    _cache: new Object(),

    setPassword_PROXY: Marshal.BY_VALUE,
    setPassword: function(url, login, heslo) {
        PasswordManager.setPassword(url, "MaPlus Hlidka", login, heslo);
    },

    getPassword_PROXY: Marshal.BY_VALUE,
    getPassword: function(url, login) {
        return PasswordManager.getPassword(url, "MaPlus Hlidka", login);
    }
};

Marshal.registerObject("HlidkaHeslo", HlidkaHeslo);



// Import/Export
var ConfigExporter = {
    doexport_PROXY: Marshal.BY_VALUE,
    doexport: function(name) {
        // Get the xml
        var config = configManager.getConfig(name, true);

        if (config == null)
            throw new ArgumentException("Config " + name + " not found.");
        
        // Ask for path
        var file = FilePicker.saveFileDialog(null, null, FilePicker.filterXML);
        if (file == null)
            return false;
            
        if (!file.leafName.match(/[.]\w+$/)) {
            file.leafName += ".xml";
        }
        
        // Pri exportu odstran oznaceni veku
        var vek = config.getAttribute("vek");
        config.setAttribute("vek", "");
        
        // Uloz
        XmlConfig.save(file, config);
        
        // Znovu nastav vek
        config.setAttribute("vek", vek);
        
        PromptService.alert("Nastaveni exportovano do souboru " + file.path);
        return true;
    },
    
    doimport_PROXY: Marshal.BY_VALUE,
    doimport: function(name) {
        if (!PromptService.confirm("Prosim zavrete vsechny ostatni taby/okna s Melior Annis, nez budete pokracovat."))
            return false;
    
        // Ask for path
        var file = FilePicker.openFileDialog(null, null, FilePicker.filterAll);
        if (file == null)
            return false;
    
        if (!file.isFile())
            throw new Exception(file.path + " neni soubor.");
    
        // Odstran aktualne nactena data
        configManager.removeFromCache(name);
        var target = configManager.getConfigPath(name);
        
        // Smaz
        if (target.exists())
            target.remove(false);
        
        // Zkopiruj
        file.copyTo(target.parent, target.leafName);
        
        // Nacti nove nastaveni
        configManager.getConfig(name, false);
        
        PromptService.alert("Nastaveni importovano ze souboru " + file.path);
        return true;
    }
};

Marshal.registerObject("ConfigExporter", ConfigExporter);
