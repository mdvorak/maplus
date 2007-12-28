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
 
window.NastaveniHlidka = {
    events: new Hash(),

    init: function(rootConfig) {
        if (this._initialized)
            return;
        this._initialized = true;
    
        // Ziskej seznam alianci kde jsem clenem (ALIANCE_ID se plni v extenders/nastaveni.js)
        if (window.ALIANCE_ID && ALIANCE_ID.length == 0) 
            return;
        
        // Html hlidky pro jednu alianci
        var hlidkaHtml = Chrome.loadText("html/nastavenihlidka.html");
        
        // Vytvor kod pro vsechny aliance
        ALIANCE_ID.each(function(id) {
            // Zjisti jmeno aliance
            var data = MaData.najdiAlianci(null, id);
            if (data == null || data.jmeno == null || data.jmeno.length == 0)
                return; // continue;
            
            var aliance = data.jmeno;
                    
            // Vytvor html
            var tbody = Element.create("tbody", hlidkaHtml);
            $('n_hlidka').appendChild(tbody);
            
            // Inicializuj alianci
            var spanAliance = $X('.//span[@id = "n_hlidka_aliance"]', tbody);
            var selectHlidka = $X('.//select[@id = "n_hlidka_hlidka"]', tbody);
            var inputAdresa = $X('.//input[@id = "n_hlidka_adresa"]', tbody);
            var inputLogin = $X('.//input[@id = "n_hlidka_login"]', tbody);
            var inputHeslo = $X('.//input[@id = "n_hlidka_heslo"]', tbody);
            var inputVypis = $X('.//input[@id = "n_hlidka_vypis"]', tbody);
            var inputNastaveni = $X('.//input[@id = "n_hlidka_nastaveni"]', tbody);
            var configRows = $XL('.//tr[@class = "hlidka_config"]', tbody);
            
            // Pomocna funkce pro zobrazovani detailni konfigurace
            var showConfigElements = function(visible) {
                if (visible)
                    configRows.each(function(i) { i.show(); });
                else
                    configRows.each(function(i) { i.hide(); });
            }
            showConfigElements(false);
            
            // Nazev aliance
            spanAliance.innerHTML = aliance;
            
            // Konfigurace hlidky
            selectHlidka.options.add(new Option("- Vyberte -", ""));
            selectHlidka.options.add(new Option("Savannah Toolshop", "toolshop"));
            selectHlidka.options.add(new Option("Vlastní", "custom"));
            
            Event.observe(selectHlidka, "change", function(event) {
                if (selectHlidka.value == "toolshop") {
                    inputAdresa.value = HLIDKA_TOOLSHOP;
                    inputAdresa.readonly = true;
                }
                else {
                    inputAdresa.value = "";
                    inputAdresa.readonly = false;
                }
                    
                inputLogin.value = window.PAGE_ID;
                inputHeslo.value = "";
                    
                showConfigElements(selectHlidka.value != "");
            });
            
            // onload a onsave funkce
            NastaveniHlidka.events[aliance] = new Object();
            
            NastaveniHlidka.events[aliance].onload = function(config) {
                var adresa = config.getPref("url");
                
                if (adresa != null && adresa.length > 0) {
                    if (adresa == HLIDKA_TOOLSHOP) {
                        selectHlidka.value = "toolshop";
                        inputAdresa.readonly = true;
                    }
                    else {
                        selectHlidka.value = "custom";
                        inputAdresa.readonly = false;
                    }
                    
                    inputAdresa.value = adresa;
                    inputLogin.value = config.getPref("login");
                    inputHeslo.value = config.getPref("heslo");
                    inputVypis.checked = config.getBoolean("zobrazitVypis");
                    inputNastaveni.checked = config.getBoolean("zobrazitNastaveni");
                    
                    showConfigElements(true);
                }
                else {
                    showConfigElements(false);
                
                    selectHlidka.value = "";
                    inputAdresa.value = "";
                    inputAdresa.readonly = false;
                    inputLogin.value = "";
                    inputHeslo.value = "";
                    inputVypis.checked = true;
                    inputNastaveni.checked = true;
                }
            };
            
            NastaveniHlidka.events[aliance].onsave = function(config) {
                if (inputAdresa.value.length > 0) {
                    config.setPref("url", inputAdresa.value);
                    config.setPref("login", inputLogin.value);
                    config.setPref("heslo", inputHeslo.value);
                    config.setPref("zobrazitVypis", inputVypis.checked);
                    config.setPref("zobrazitNastaveni", inputNastaveni.checked);
                }
                else {
                    config.setPref("url", null);
                    config.setPref("login", null);
                    config.setPref("heslo", null);
                    config.setPref("zobrazitVypis", null);
                    config.setPref("zobrazitNastaveni", null);
                }
                
                console.debug('Hlidka "%s": url=%o login=%o', aliance, inputAdresa.value, inputLogin.value);
            };
        });
    },
    
    onload: function(rootConfig) {
        NastaveniHlidka.init(rootConfig);
    
        NastaveniHlidka.events.each(function([aliance, e]) {
            var config = NastaveniHlidka.getConfigAliance(rootConfig, aliance);
            e.onload(config);
        });
    },
    
    onsave: function(rootConfig) {
        NastaveniHlidka.events.each(function([aliance, e]) {
            var config = NastaveniHlidka.getConfigAliance(rootConfig, aliance);
            e.onsave(config);
        });
    },
    
    getConfigAliance: function(root, aliance) {
        root = root.getPrefNode("hlidka", true);
        
        var cfg = root.evalPrefNode('aliance[@jmeno = "' + aliance + '"]');
        if (cfg == null) {
            cfg = root.addPref("aliance");
            cfg.setAttribute("jmeno", aliance);
        }
        
        return cfg;
    }
}
