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
    getName: function() { return "Blacklist"; },

    analyze: function(page, context) {
        context.table = $X('.//table[tbody/tr[1]/td[2]/font/b = "Odměna"]', page.content);
        if (!context.table)
            return false;
            
        for (var i = 1; i < context.table.rows.length; i++) {
            var row = context.table.rows[i];
            
            var data = {
                odmena: parseInt(row.cells[1].textContent),
                presvedceni: row.cells[2].textContent,
                jmeno: row.cells[3].textContent,
                id: parseInt(row.cells[4].textContent.match(/\((\d+)\)/)[1]),
                sila: parseInt(row.cells[5].textContent),
                uroven: parseFloat(row.cells[6].textContent),
                kdo: parseInt(row.cells[10].textContent.match(/\((\d+)\)/)[1])
            };
            
            data.silaUtoku = data.sila * 1.25;
            
            if (!data.id || isNaN(data.id))
                continue;
                
            row.data = data;
        }
        
        return true;
    },
    
    process: function(page, context) {
        // Hlavicka
        new Insertion.Before(context.table.rows[0].cells[5], '<td align="right><span><b>Síla útoku&nbsp;</b></span></td>');
        
        for (var i = 1; i < context.table.rows.length; i++) {
            var row = context.table.rows[i];
            if (!row.data)
                continue;
            
            // Aktivni id
            this._setActiveId(page, row.cells[4], row.data.id);
            this._setActiveId(page, row.cells[10], row.data.kdo);
            
            // Sila k utoku
            new Insertion.Before(row.cells[6], '<td align="right"><span>' + row.data.silaUtoku.toFixed(0) + '&nbsp;&nbsp;</span></td>');
        }      
    },
    
    _setActiveId: function(page, td, id) {
        var link = MaPlus.Tooltips.createActiveId(page, id);
        
        var span = document.createElement("span");
        span.innerHTML = "(";
        span.appendChild(link);
        span.appendChild(document.createTextNode(")\xA0\xA0"));
        
        td.innerHTML = "";
        td.appendChild(span);
    }
}));
