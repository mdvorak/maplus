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