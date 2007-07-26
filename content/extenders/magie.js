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
        return (context.tableKouzla != null && context.tableKouzla.rows.length > 3);
    },
    
    process: function(page, context) {
        context.tableKouzla.id = "id_kouzlaTable";
    
        for (var i = 2; i < context.tableKouzla.rows.length - 1; i++) {
            var row = context.tableKouzla.rows[i];
            
            // Radek s popiskem nebo meziradek, skryt oba
            if (row.bgColor == "#303030" || row.bgColor == "") {
                row.style.display = 'none';
            }
            else {
                if (i % 2) row.bgColor = "#000000";
                else row.bgColor = "#1b1b1b";
            }
        }
        
        var zobrazPopiskyScript = "var t = document.getElementById('id_kouzlaTable');";
        zobrazPopiskyScript += " for (var i = 0; i < t.rows.length; i++)";
        zobrazPopiskyScript += "   t.rows[i].style.display = '';";
        zobrazPopiskyScript += " this.style.display = 'none';";
        zobrazPopiskyScript += " t.style.overflowX = 'scroll';"; // Tohle donuti preklesleni tabulky takze se roztahne
        
        var lastRow = context.tableKouzla.rows[context.tableKouzla.rows.length - 1];
        lastRow.cells[1].innerHTML = '<a href="javascript://" onclick="' + zobrazPopiskyScript + '"><font size="1">Zobrazit popisky</font></a>';
    }
}));

// Aktivni id v cilech kouzel
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        context.tablePredkouzleno = $XF('//table[tbody/tr[2]/td[4]/font/b = "Název"]');
        
        if (context.tablePredkouzleno) {
            context.naProvincii = $XL('tbody/tr/td[5]/font', context.tablePredkouzleno);
        }
        
        return (context.naProvincii != null && context.naProvincii.length > 0);
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
