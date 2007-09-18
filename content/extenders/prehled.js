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

const PREHLED_TOP = "Absolutní pořadí podle síly - Nejlepších 20";
const PREHLED_UMISTENI = "Relativní pořadí podle síly - Okolních 30";
const PREHLED_MOZNE_UTOKY = "Možné cíle - 30 nejslabších";
const PREHLED_PODLE_SLAVY = "Absolutní pořadí podle slávy - Nejlepších 30";
const PREHLED_PODLE_POZEMKU = "Podle pozemků";


pageExtenders.add(PageExtender.create({
    getName: function() { return "Prehled - "; },

    analyze: function(page, context) {
        context.table = $X('table[1]', page.content);
        if (context.table == null)
            return false;
        // Kontrola jestli tabulka obsahuje nejake zaznamy
        if (context.table.rows.length < 4)
            return false;

        context.typ = XPath.evalString('tbody/tr[1]/td[2]/font/b', context.table);
        context.columns = context.table.rows[2].cells.length;
        
        // Analyza radku
        for (var i = 2; i < context.table.rows.length - 1; i++) {
            var tr = context.table.rows[i];
            var cells = tr.cells;
            
            var data = ElementDataStore.get(tr);
            data.id = parseInt(cells[2].textContent);
            
            if (isNaN(data.id)) {
                data.id = null;
                continue;
            }
            
            // Analyzuj data
            switch (typ) {
                case PREHLED_UMISTENI:
                case PREHLED_TOP:
                case PREHLED_PODLE_POZEMKU:
                    data.regent = cells[3].textContent.replace(/\s+$/, "");
                    data.provincie = cells[6].textContent.replace(/\s+$/, "");
                    data.aliance = cells[7].textContent.replace(/\s+$/, "");
                    data.presvedceni = cells[8].textContent.replace(/^\s+/, "")[0];
 
                    if (data.aliance.match(/[.]{3}$/))
                        data.aliance = MaData.najdiJmenoAliance(data.aliance);
                    break;
                
                case PREHLED_MOZNE_UTOKY:
                    data.regent = cells[4].textContent.replace(/\s+$/, "");
                    data.provincie = cells[5].textContent.replace(/\s+$/, "");
                    data.aliance = cells[8].textContent.replace(/\s+$/, "");
                    data.presvedceni = cells[9].textContent.replace(/^\s+/, "")[0];
                    
                    if (data.aliance.match(/[.]{2}$/))
                        data.aliance = MaData.najdiJmenoAliance(data.aliance);
                    break;
                    
                case PREHLED_PODLE_SLAVY:
                    data.regent = cells[3].textContent.replace(/\s+$/, "");
                    data.provincie = cells[6].textContent.replace(/\s+$/, "");
                    data.presvedceni = cells[7].textContent.replace(/^\s+/, "")[0];
                    break;
                    
                default:
                    console.warning("Neznamy typ prehledu: %s", context.typ);
                    return false;
            }
            
            if (data.aliance == "")
                data.aliance = ZADNA_ALIANCE;
            
            // Aktualizuj data
            MaData.aktualizujProvincii(data.id, data.regent, data.provincie, null, data.presvedceni, data.aliance);
        }
        
        return true;
    },

    process: function(page, context) {
        // Pridej info sloupec do hlavicky
        context.table.rows[1].appendChild(Element.create("td", "&nbsp;"));
    
        // Zpracuj radky
        for (var i = 2; i < context.table.rows.length - 1; i++) {
            var tr = context.table.rows[i];
            var cells = tr.cells;

            // Kvuli separatoru
            if (cells.length == 1)
                cells[0].setAttribute("colspan", context.columns);
                
            var data = ElementDataStore.get(tr);
            
            // Kontrola zdali radek obsahuje data
            if (data.id == null)
                continue;
            
            // Pridej Info link
            var infoUrl = MaPlus.buildUrl(page, "setup.html", {setup: "spehovani", nolinks: 1, koho: data.id});
            var infoHtml = '<a href="' + infoUrl + '"><img src="' + CHROME_CONTENT_URL + '/html/img/info.png" alt="" style="border-width: 0px; padding-top: 1px;" /></a>';
            
            var tdInfo = Element.create("td", infoHtml, {align: "center", style: "white-space: nowrap;"});
            tr.appendChild(tdInfo);
        }
        
        // Oprav okraje
        $X('tbody/tr[1]/td[2]', context.table).setAttribute("colspan", context.columns - 2);
        $X('tbody/tr[last()]/td[2]', context.table).setAttribute("colspan", context.columns - 2);
    }
}));
