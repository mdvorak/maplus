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
        
        // Zpracuj hlavicku (chyby v ni sloupec barva)
        bestiar.table.header = new RowWrapper(tableData.rows[0], PUVODNI_SLOUPCE.without("barva"));
        bestiar.table.data = new Array();
        
        // Zpracuj jednotlive radky
        for (var i = 1; i < tableData.rows.length; i++) {
            var row = new RowWrapper(tableData.rows[i], PUVODNI_SLOUPCE);

            // Analyzuj data
            row.data = new Hash();
            row.data.jmeno = row.columns["jmeno"].textContent.replace(/\s+(\[\s*\d+\s*\])?\s*$/, "");
            row.data.barva = row.columns["barva"].textContent.replace(/\s/g, "");
            row.data.pocet = parseInt(row.columns["pocet"].textContent);
            row.data.zkusenost = parseFloat(row.columns["zkusenost"].textContent) / 100;
            row.data.silaJednotky = parseFloat(row.columns["silaJednotky"].textContent);
            row.data.druh = row.columns["druh"].textContent.replace(/\s+$/, "");
            row.data.typ = row.columns["typ"].textContent.replace(/\s+$/, "");
            row.data.cas = parseTime(row.columns["cas"].textContent.replace(/\s+$/, ""));
            row.data.nabidka = parseInt(row.columns["nabidka"].textContent);

            // Max sila stacku
            row.data.maxSilaStacku = parseInt(row.data.pocet * row.data.silaJednotky);
            // Sila stacku
            row.data.silaStacku = parseInt(row.data.maxSilaStacku * row.data.zkusenost);
            // Cena za 1 sily
            row.data.cenaZaSilu = parseFloat((row.data.nabidka / row.data.silaStacku).toFixed(1));
            
            // Dodatecne informace
            var stats = Jednotky.vyhledej(row.data.jmeno);
            if (stats) {
                row.data.phb = stats.phb;
                row.data.ini = stats.realIni;
                
                // Vezmi v uvahu barvu
                var koef = (row.data.barva == page.regent.barva) ? 1.5 : 1.0;
                row.data.zlataTU = parseFloat((row.data.pocet * (stats.zlataTU / koef)).toFixed(1));
                row.data.manyTU = parseFloat((row.data.pocet * (stats.manyTU / koef)).toFixed(1));
                row.data.popTU = parseFloat((row.data.pocet * (stats.popTU / koef)).toFixed(1));
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
        
        //FIXME
        sloupce = sloupce.concat(["pocet", "zkusenost", "silaJednotky", "druh", "typ"]); 
                
        page.config.getAukce().evalPrefNodeList('sloupce/sloupec').each(function(e) {
                // Duplicita by sice vzniknout nemela, ale lepsi to osetrit
                if (sloupce.indexOf(e.getPref()))
                    sloupce.push(e.getPref());
            });
        
        // FIXME
        sloupce.push("phb");
        sloupce.push("ini");
        sloupce.push("silaStacku");
        //sloupce.push("maxSilaStacku");
        sloupce.push("zlataTU");
        sloupce.push("manyTU");
        sloupce.push("popTU");
        sloupce.push("cenaZaSilu");
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
        
        // Vytvor seznam chybejicich sloupcu
        var chybejiciSloupce = new Array();
        NAZVY_SLOUPCU.keys().each(function(s) {
                if (sloupce.indexOf(s) < 0)
                    chybejiciSloupce.push(s);
            });
        context.chybejiciSloupce = chybejiciSloupce;
        
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
                            var hodnota = (row.data[s] != null ? row.data[s] : "");
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

// Barvy
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Barvy"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table)
            return false;    
       
       return true;
    },
    
    process: function(page, context) {
        page.bestiar.table.data.each(function(row) {
                row.columns.each(function(e) {
                        var sloupec = e[0];
                        var td = e[1];
                        var hodnota = row.data[sloupec];
                        var format = BestiarCellStyles[sloupec];
                        
                        if (hodnota != null && format != null) {
                            format(td, hodnota);
                        }
                    });
            });
    }
}));

var BestiarCellStyles = {
    pocet: function(td, hodnota) {
        td.innerHTML = '<span>&nbsp;' + hodnota + '&nbsp;</span>';
        td.style.color = Color.fromRange(hodnota, 20, 5000, Color.Pickers.grayWhite);
    },
    zkusenost: function(td, hodnota) {
        td.innerHTML = '<span>&nbsp;' + (hodnota * 100).toFixed(2) + '%&nbsp;</span>';
        td.style.color = Color.fromRange(hodnota, 0.20, 0.60, Color.Pickers.redGreen);
    },
    silaJednotky: function(td, hodnota) {
        td.innerHTML = '<span>&nbsp;' + hodnota.toFixed(2) + '&nbsp;</span>';
        td.style.color = Color.fromRange(hodnota, 1, 220, Color.Pickers.grayWhite);
    },
    druh: function(td, hodnota) {
        td.innerHTML = '<span>&nbsp;' + hodnota + '</span>';
        td.className = (hodnota == "Let.") ? "druhLet" : "druhPoz"
    },
    typ: function(td, hodnota) {
        td.innerHTML = '<span>&nbsp;' + hodnota + '</span>';
        td.className = (hodnota == "Str.") ? "typStr" : "typBoj"
    },
    cas: function(td, hodnota) {
        if (!isNaN(hodnota))
            td.innerHTML = '<span>&nbsp;' + formatTime(hodnota) + '&nbsp;</span>';
        else
            td.innerHTML = '<span>&nbsp;Žádná nabídka&nbsp;</span>';
    },
    phb: function(td, hodnota) {
        td.className = "phb" + hodnota;
    },
    ini: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 5, 35, Color.Pickers.redGreen);
    },
    silaStacku: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 500, 12000, Color.Pickers.grayWhite);
    },
    maxSilaStacku: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 1000, 25000, Color.Pickers.grayWhite);
    },
    cenaZaSilu: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 30, 5, Color.Pickers.redGreen);
    },
    zlataTU: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 100, 3000, Color.Pickers.grayGold);
    },
    manyTU: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 3000, 100, Color.Pickers.blueWhite);
    },
    popTU: function(td, hodnota) {
        td.style.color = Color.fromRange(hodnota, 400, 5, Color.Pickers.grayBrown);
    }
}





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
