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
        
        // Uloz do nastaveni
        /*
        var cfg = page.config.getRegent();
        cfg.setPref("jmeno", page.regent.jmeno);
        cfg.setPref("provincie", page.regent.provincie);
        cfg.setPref("povolani", page.regent.povolani);
        cfg.setPref("id", page.regent.id);
        cfg.setPref("barva", page.regent.barva);
        */
        
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
        
        // Analyzuj  
        page.provincie = {
            zlato: parseInt(XPath.evalString('tbody/tr[td[1] = "Zlato:"]/td[2]', table)),
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
                page.provincie.mana = parseInt(m[1]);
                page.provincie.maxMana = Math.floor(100 * page.provincie.mana / parseInt(m[2]));
                
                console.debug("Mana: %d, Max Many: %d", page.provincie.mana, page.provincie.maxMana);
            }
        }
        
        return true;
    },
    
    process: null
}));
