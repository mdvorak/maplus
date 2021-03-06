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
    getName: function() { return "Hlavni stranka - Plne tahy"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != null || page.arguments["plus"] != null || page.arguments["url"] != null)
            return false;
        
        // Font tag
        context.font = $X('center/font', page.content);
        if (context.font == null)
            return false;
        
        // Pomocna funkce
        function parseRegexInt(text, pattern) {
            var m = text.match(pattern);
            if (m == null || m[1] == null) 
                return Number.NaN;
            return parseInt(m[1]);
        }
        
        var now = new Date();
        var dnesZbyvaMinut = DEN_MINUT - (now.getHours() * 60 + now.getMinutes());
        var dnesPribudeTahu = Math.floor(dnesZbyvaMinut / 12);
        
        // Zjisti za jak dlouho bude 360 TU (tecky nahrazuji pismena s diakritikou, nevim proc to blbnulo..)
        var zbyva = parseRegexInt(context.font.textContent, /\bzb.v.\s+(\d+)\s+TU\b/);
        var tahZaSec = parseRegexInt(context.font.textContent, /\bDo\sdal..ho\stahu:\s+(\d+)\s+sec\b/);
        
        if (isNaN(zbyva) || isNaN(tahZaSec))
            return false;
                    
        var chyby = 360 - zbyva;
        
        // Odecist puloncni bonusy
        if (chyby > dnesPribudeTahu) {
            chyby -= 10; // Za prvni pulnoc
            chyby -= Math.floor((chyby - dnesPribudeTahu) / 120) * 10; // Za kazdou dalsi pulnoc
        }
        
        // pokud mame plno taky nepokracovat
        chyby = Math.max(chyby, 0);
        
        logger().debug("dnesPribudeTahu=%d zbyva=%d tahZaSec=%d chyby=%d", dnesPribudeTahu, zbyva, tahZaSec, chyby);        
        
        // Vypocet
        var plnoZaSec = (chyby - 1) * 720 + tahZaSec; // 720s = 12m
        context.cas = new Date(new Date().getTime() + plnoZaSec * 1000);
        
        return true;
    },
    
    process: function(page, context) {
        var text = 'Plné tahy budete mít ' + timeFromNow(context.cas) + ' ';
        var upozorneni = "Upozornění: Do času jsou započítány půlnoční bonusy. "
                       + "Jestliže je po půlnoci, ale ještě jste bonus nedostali, údaj je nepřesný.<br />"
                       + "(Bonus dostanete první přihlášení za den, tzn musíte se odhlásit a zas přihlásit aby jste ho dostali okamžitě)";
        
        context.font.appendChild(Element.create("span", text));
        context.font.appendChild(MaPlus.Tooltips.createHelp(page, upozorneni));
        context.font.appendChild(Element.create("br"));
    }
}));

