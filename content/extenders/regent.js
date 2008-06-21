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

pageExtenders.add(PageExtender.create({
    getName: function() { return "Analyza - Regent"; },

    analyze: function(page, context) {
        var provincie = XPath.evalString('tbody/tr/td/font[1]', page.playerTable);
        var jmeno = XPath.evalString('tbody/tr/td/font[2]', page.playerTable);
        var info = XPath.evalString('tbody/tr/td/font[3]', page.playerTable);
        
        if (!provincie || !jmeno || !info)
            return false;
        
        var m = info.match(/\((.+?),\s+ID\s+(\d+)\)/);
        if (!m)
            return false;
            
        page.regent = {
            jmeno: jmeno,
            provincie: provincie,
            povolani: m[1],
            id: Number(m[2]),
            barva: BARVY_POVOLANI[m[1]]
        };
        
        if (!isNaN(page.regent.id) && page.regent.id != page.id)
            console.error("Id z analyzy stranky (%d) a regenta (%d) se nerovnaji!", page.id, page.regent.id);
        
        console.info("%s, %s (%d) [%s, %s]", page.regent.jmeno, page.regent.provincie, page.regent.id, page.regent.povolani, page.regent.barva);
        return true;
    },
    
    process: null
}));


pageExtenders.add(PageExtender.create({
    getName: function() { return "Analyza - Provincie"; },

    analyze: function(page, context) {
        var table = $X('table[tbody/tr[1]/td[1] = "Zlato:"]', page.leftMenu);
        if (table == null)
            return false;
        
        page.tableProvincie = table;
        
        var data = -1;
        
        // Forma callbacku byla vytvorena z vykonovych duvodu, nicmene ted uz se stejne zavola vzdy..
        page.provincie = function() {
            if (data != -1)
                return data;
        
            console.group("Zjistovani dat o provincii..");
            try {
                // Analyzuj
                var p = {
                    zlato: parseInt(XPath.evalString('tbody/tr[td[1] = "Zlato:"]/td[2]', table)),
                    mana: Number.NaN,
                    maxMana: Number.NaN,
                    populace: parseInt(XPath.evalString('tbody/tr[td[1] = "Populace:"]/td[2]', table)),
                    rozloha: parseInt(XPath.evalString('tbody/tr[td[1] = "Rozloha:"]/td[2]', table)),
                    volnych: parseInt(XPath.evalString('tbody/tr[td[1] = "Volných:"]/td[2]', table)),
                    zbyva: parseInt(XPath.evalString('tbody/tr[td[1] = "zbývá:"]/td[2]', table)),
                    sila: parseInt(XPath.evalString('tbody/tr[td[1] = "Síla\xA0P.:"]/td[2]', table)),
                    protV: parseInt(XPath.evalString('tbody/tr[td[1] = "Prot.\xA0V:"]/td[2]', table)),
                    protM: parseInt(XPath.evalString('tbody/tr[td[1] = "Prot.\xA0M:"]/td[2]', table))
                };
                
                var manaStr = XPath.evalString('tbody/tr[td[1] = "Mana:"]/td[2]', table);
                if (manaStr != null) {
                    var m = manaStr.match(/^\s*(\d+)\s+\((\d+)%\)\s*$/);
                    if (m != null) {
                        p.mana = parseInt(m[1]);
                        p.maxMana = Math.floor(100 * p.mana / parseInt(m[2]));
                    }
                }
                
                // Zmen vsechny NaN na 0
                for (var i in p) {
                    if (isNaN(p[i]))
                        p[i] = 0;
                }
                
                // Debug hlaska
                data = p;
                console.info("Provincie zlato=%d, mana=%d/%d, populace=%d, rozloha=%d/%d, sila=%d, prot=%o", p.zlato, p.mana, p.maxMana, p.populace, p.volnych, p.rozloha, p.sila, p.protV > 0);
                return p;
            }
            catch (ex) {
                console.error(ex);
                data = null;
                return null;
            }
            finally {
                console.groupEnd();
            }
        }
        
        console.debug("Informace o provincii budou zjisteny az budou potreba.");
        return true;
    },
    
    process: null
}));


pageExtenders.add(PageExtender.create({
    getName: function() { return "Provincie - Stav"; },

    analyze: function(page, context) {
        if (!page.config.getMenu().getBoolean("obravitStav", true))
            return false;
        if (page.tableProvincie == null)
            return false;

        context.tableProvincie = page.tableProvincie;

        var limit = {
            zlato: (page.provincie().rozloha * 10),
            populace: Math.floor(Math.log(0.1 + page.provincie().rozloha / 500) * 50000),
            mana: 0.35,
            tahy: 60
        };

        // Koeficienty kolik chyby do ocekavaneho mnozstvi, 0 pokud nechyby nic
        context.zbyva = Math.max(limit.tahy - page.provincie().zbyva, 0) / limit.tahy;
        context.zlato = Math.max(limit.zlato - page.provincie().zlato, 0) / limit.zlato;
        context.populace = Math.max(limit.populace - page.provincie().populace, 0) / limit.populace;
        context.mana = page.provincie().mana / page.provincie().maxMana; // mana je specialni, tam jsou proste procenta

        context.limit = limit;

        return context.zbyva > 0 || context.zlato > 0 || context.populace > 0;
    },

    process: function(page, context) {
        if (context.zbyva > 0) {
            var c = Color.fromRange(context.zbyva, 0, 0.7, Color.Pickers.grayRed);
            $X('tbody/tr[td[1] = "zbývá:"]/td[2]', context.tableProvincie).style.color = c;
        }
        if (context.zlato > 0) {
            var c = Color.fromRange(context.zlato, 0, 0.8, Color.Pickers.grayRed);
            $X('tbody/tr[td[1] = "Zlato:"]/td[2]', context.tableProvincie).style.color = c;
        }
        if (context.populace > 0) {
            var c = Color.fromRange(context.populace, 0, 0.8, Color.Pickers.grayRed);
            $X('tbody/tr[td[1] = "Populace:"]/td[2]', context.tableProvincie).style.color = c;
        }
        if (context.mana < context.limit.mana) {
            var c = Color.fromRange(context.mana, context.limit.mana, 0.1, Color.Pickers.grayRed);
            $X('tbody/tr[td[1] = "Mana:"]/td[2]', context.tableProvincie).style.color = c;
        }
    }
}));
