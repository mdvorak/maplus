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
        
        var bestiar = {
            table: new ElementWrapper(tableData)
        };
        
        // Zpracuj hlavicku
        bestiar.table.header = new RowWrapper(tableData.rows[0], PUVODNI_SLOUPCE_HLAVICKA);
        bestiar.table.data = new Array();
        
        // Zpracuj jednotlive radky
        for (var i = 1; i < tableData.rows.length; i++) {
            var row = new RowWrapper(tableData.rows[i], PUVODNI_SLOUPCE);

            // Analyzuj data
            row.jmeno = row.columns["jmeno"].textContent.replace(/\s+(\[\s*\d+\s*\])?\s*$/, "");
            row.barva = row.columns["barva"].textContent;
            row.pocet = parseInt(row.columns["pocet"].textContent);
            row.zkusenost = parseFloat(row.columns["zkusenost"].textContent) / 100;
            row.silaJednotky = parseFloat(row.columns["silaJednotky"].textContent);
            row.druh = row.columns["druh"].textContent.replace(/\s+$/, "");
            row.typ = row.columns["typ"].textContent.replace(/\s+$/, "");
            row.cas = row.columns["cas"].textContent.replace(/\s+$/, "");
            row.nabidka = parseInt(row.columns["nabidka"].textContent);

            // Max sila stacku
            row.maxSilaStacku = parseInt(row.pocet * row.silaJednotky);
            // Sila stacku
            row.silaStacku = parseInt(row.maxSilaStacku * row.zkusenost);
            // Cena za 1 sily
            row.cenaZaSilu = parseFloat((row.nabidka / row.silaStacku).toFixed(1));
            
            // Dodatecne informace
            var stats = Jednotky.vyhledej(row.jmeno);
            if (stats) {
                row.phb = stats.phb;
                row.ini = stats.realIni;
                row.zlataTU = parseFloat((row.pocet * stats.zlataTU).toFixed(1));
                row.manyTU = parseFloat((row.pocet * stats.manyTU).toFixed(1));
                row.popTU = parseFloat((row.pocet * stats.popTU).toFixed(1));
            }
            else {
                console.warn("Nenalezeny informace o jednotce %s.", row.jmeno);
            }
            
            bestiar.table.data.push(row);
        }
        
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
        
        sloupce.push("phb");
        sloupce.push("ini");
        sloupce.push("silaJednotky");
        sloupce.push("silaStacku");
        sloupce.push("maxSilaStacku");
        sloupce.push("zlataTU");
        sloupce.push("manyTU");
        sloupce.push("popTU");
        sloupce.push("zkusenost");
        // Povinne
        sloupce.push("cas");
        sloupce.push("nabidka");
        
        bestiar.sloupce = sloupce;
        
        // Vse uloz do kontextu stranky
        page.bestiar = bestiar;
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
        if (!page.bestiar || !page.bestiar.table || !page.bestiar.sloupce)
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
        var table = page.bestiar.table;
        var sloupce = page.bestiar.sloupce;
        var rows = [table.header].concat(table.data);
    
        // Odeber skryte puvodni sloupce
        context.skryteSloupce.each(function(s) {
                rows.each(function(row) {
                        if (row.columns[s] != null) {
                            row.element.removeChild(row.columns[s]);
                            row.columns[s] = null;
                        }
                    });
            });
    
        // Pridej chybejici sloupce
        sloupce.each(function(s) {
                var text = '<span><b>&nbsp;' + NAZVY_SLOUPCU[s] + '&nbsp;</b></span>';
                
                // Pridavej pouze nove
                if (PUVODNI_SLOUPCE.indexOf(s) < 0) {
                    var td = Element.create("td", text);
                    table.header.element.appendChild(td);
                    
                    td.name = s;
                    table.header.columns[s] = td;
                }
                // Prejmenuj stare (preskoc smazane)
                else if (table.header.columns[s] != null) {
                    table.header.columns[s].innerHTML = text;
                }
            });
        
        table.data.each(function(row) {
                sloupce.each(function(s) {
                        // Pridavej pouze nove
                        if (PUVODNI_SLOUPCE.indexOf(s) < 0) {
                            var hodnota = row[s];
                            var td = Element.create("td", '<span>' + hodnota + '&nbsp;</span>', {align: "right"});
                            row.element.appendChild(td);
                                
                            td.name = s;
                            row.columns[s] = td;
                        }
                    });
            });
            
        // Seradit sloupce podle konfigurace
        rows.each(function(row) {
                sloupce.each(function(s) {
                        var td = row.columns[s];
                        if (td != null)
                            row.element.appendChild(td);
                    });
            });
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
