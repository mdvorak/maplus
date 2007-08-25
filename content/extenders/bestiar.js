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

// Analyza
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Analyza"; },
    
    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;

        var tableData = $X('.//table[tbody/tr/td[contains(font/b, "prodeje")]]', page.content);
        if (!tableData || tableData.rows.length < 1)
            return false;
            
        var dataRows = new Array();
        
        // Zpracuj jednotlive radky
        for (var i = 0; i < tableData.rows.length; i++) {
            var tr = tableData.rows[i];
            
            // Oznac hlavicku
            if (i == 0)
                tr.header = true;
            
            // Nastav jmena bunkam
            for (var pos = 0; pos < tr.cells.length; pos++) {
                var sloupec = PUVODNI_SLOUPCE[pos];
                tr.cells[pos].name = sloupec;
                tr.cells[sloupec] = tr.cells[pos];
            }
            
            if (tr.header)
                continue;
                
            // Analyzuj data
            var data = {
                jmeno: tr.cells.jmeno.textContent.replace(/\s+(\[\s*\d+\s*\])?\s*$/, ""),
                barva: tr.cells.barva.textContent,
                pocet: parseInt(tr.cells.pocet.textContent),
                zkusenost: parseFloat(tr.cells.zkusenost.textContent) / 100,
                silaJednotky: parseFloat(tr.cells.silaJednotky.textContent),
                druh: tr.cells.druh.textContent.replace(/\s+$/, ""),
                typ: tr.cells.typ.textContent.replace(/\s+$/, ""),
                cas: tr.cells.cas.textContent.replace(/\s+$/, ""),
                nabidka: parseInt(tr.cells.nabidka.textContent)
            };

            // Max sila stacku
            data.maxSilaStacku = parseInt(data.pocet * data.silaJednotky);
            // Sila stacku
            data.silaStacku = parseInt(data.maxSilaStacku * data.zkusenost);
            // Cena za 1 sily
            data.cenaZaSilu = parseFloat((data.nabidka / data.silaStacku).toFixed(1));
            
            // Dodatecne informace
            var stats = Jednotky.vyhledej(data.jmeno);
            if (stats) {
                data.phb = stats.phb;
                data.ini = stats.realIni;
                data.zlataTU = parseFloat((data.pocet * stats.zlataTU).toFixed(1));
                data.manyTU = parseFloat((data.pocet * stats.manyTU).toFixed(1));
                data.popTU = parseFloat((data.pocet * stats.popTU).toFixed(1));
            }
            else {
                console.warn("Nenalezeny informace o jednotce %s.", data.jmeno);
            }
            
            tr.data = data;
            
            dataRows.push(tr);
        }
        
        tableData.rows.header = tableData.rows[0];
        tableData.rows.data = dataRows;
        
        // Vytvor seznam sloupcu ktere maji byt zobrazeny
        var sloupce = new Array();
        // Povinne
        sloupce.push("jmeno");
        sloupce.push("barva");
                
        page.config.getAukce().evalPrefNodeList('sloupce/sloupec').each(function(e) {
                // Duplicita by sice vzniknout nemela, ale lepsi to osetrit
                if (sloupce.indexOf(e.getPref()))
                    sloupce.push(e.getPref());
            });
        
        sloupce.push("silaStacku");
        // Povinne
        sloupce.push("cas");
        sloupce.push("nabidka");
        
        // Vse uloz do kontextu stranky
        page.bestiar = { 
            tableData: tableData,
            sloupce: sloupce
        };
        
        return true;
    },

    process: null
}));


// Sloupce
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Sloupce"; },

    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;
        if (!page.bestiar || !page.bestiar.tableData || !page.bestiar.sloupce)
            return false;    
       
        var sloupce = page.bestiar.sloupce;
        
        // Pokud neni nic nastaveno, nic nemen (4 jsou povinne)
        if (sloupce.length <= 4)
            return false;
        
        // Skryte puvodni sloupce
        var skryteSloupce = new Array();
        PUVODNI_SLOUPCE.each(function(s) {
                if (sloupce.indexOf(s) < 0)
                    skryteSloupce.push(s);
            });
        
        context.skryteSloupce = skryteSloupce;
        
        return true;
    },

    process: function(page, context) {
        var tableData = page.bestiar.tableData;
        var sloupce = page.bestiar.sloupce;
    
        // Odeber skryte puvodni sloupce
        context.skryteSloupce.each(function(s) {
                for (var i = 0; i < tableData.rows.length; i++) {
                    var tr = tableData.rows[i];
                    
                    if (tr.cells[s] != null)
                        tr.removeChild(tr.cells[s]);
                }
            });
    
        // Pridej chybejici sloupce
        var trHlavicka = tableData.rows.header;
        sloupce.each(function(s) {
                // Pridavej pouze nove
                if (PUVODNI_SLOUPCE.indexOf(s) < 0) {
                    var td = Element.create("td", '<span><b>' + NAZVY_SLOUPCU[s] + '</b></span>');
                    trHlavicka.appendChild(td);
                    
                    td.name = s;
                    trHlavicka.cells[s] = td;
                }
            });
        
        tableData.rows.data.each(function(tr) {
                sloupce.each(function(s) {
                        // Pridavej pouze nove
                        if (PUVODNI_SLOUPCE.indexOf(s) < 0) {
                            var hodnota = tr.data[s];
                            var td = Element.create("td", '<span>' + hodnota + '</span>', {align: "right"});
                            tr.appendChild(td);
                                
                            td.name = s;
                            tr.cells[s] = td;
                        }    
                    });
            });
            
        // Seradit sloupce podle konfigurace
        for (var i = 0; i < tableData.rows.length; i++) {
            var tr = tableData.rows[i];
            sloupce.each(function(s) {
                var td = tr.cells[s];
                if (td != null)
                    tr.appendChild(td);
            });
        }
    }
}));






// Razeni a filtrovani
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Filtry"; },

    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;
            
        // Konfigurace
        context.config = page.config.getAukce().getPrefNode("filtry", true);
        Object.extend(context.config, PlusConfig.Aukce.prototype);           

        // TODO
        
        return true;
    },

    process: function(page, context) {
        // TODO
    }
}));
