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

// Skryti popisku kouzel
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        context.tableKouzla = $XF('//table[contains(tbody/tr[2]/td[4]/font, "seslání")]');
        if (!context.tableKouzla)
            return false;
            
        if (XPath.evaluateNumber('count(tbody/tr[@bgColor = "#303030"])', context.tableKouzla) == 0)
            return false;
            
        context.tdBottom = $XF('tbody/tr[last()]/td[2]', context.tableKouzla);
        
        return (context.tdBottom != null);
    },
    
    process: function(page, context) {
        var tableKouzla = context.tableKouzla;
        var hiddenRows = new Array();
    
        for (var i = 2; i < tableKouzla.rows.length - 1; i++) {
            var row = tableKouzla.rows[i];
            
            // Radek s popiskem nebo meziradek, skryt oba
            if (row.bgColor == "#303030" || row.bgColor == "") {
                $(row).hide();
                hiddenRows.push(row);
            }
            else {
                if (i % 2) row.bgColor = "#000000";
                else row.bgColor = "#1b1b1b";
            }
        }
        
        // Link na zobrazeni popisku
        var aZobrazPopisky = document.createElement("a");
        aZobrazPopisky.innerHTML = '<span class="small">Zobrazit popisky</small>';
        aZobrazPopisky.href = "javascript://";
        context.tdBottom.appendChild(aZobrazPopisky);

        Event.observe(aZobrazPopisky, 'click', function(event) {
                hiddenRows.each(function(e) { $(e).show(); });
                $(this).hide();
                // Tohle donuti preklesleni tabulky takze se roztahne
                tableKouzla.style.overflowX = "scroll"; 
            }, false);
    }
}));

// Aktivni id v cilech kouzel
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        context.tablePredkouzleno = $XF('//table[tbody/tr[2]/td[4]/font/b = "Název"]');
        if (!context.tablePredkouzleno)
            return false;
        
        context.naProvincii = $XL('tbody/tr/td[5]/font', context.tablePredkouzleno);
        
        return (context.naProvincii.length > 0);
    },
    
    process: function(page, context) {
        context.naProvincii.each(function(e) {
                var m = e.innerHTML.match(/^\((\d+)\)(.*)/);
                var id = (m ? parseInt(m[1]) : null);
                var provincie = (m ? m[2].replace(/&nbsp;/g, " ") : null);
                
                if (id && !isNaN(id)) {
                    e.innerHTML = "";
                    e.appendChild(document.createTextNode("("));
                    e.appendChild(MaPlus.createActiveId(page, id));
                    e.appendChild(document.createTextNode(")"));
                    e.appendChild(document.createTextNode(provincie));
                }
            });      
    }
}));
