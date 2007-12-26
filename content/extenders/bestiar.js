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
 
var VybraneJednotky = Marshal.getObjectProxy("VybraneJednotky");

// Mala optimilizace rychlosti
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Cache"; },
    
    analyze: function(page, context) {
        if (page.arguments["obchod"] != null && page.arguments["obchod"] != "jedn_new")
            return false;
            
        return true;
    },
    
    process: function(page, context) {
        var div = Element.create("div", null, {style: "top: -500px; left: -500px;"});
        
        var img1 = Element.create("img", null, {src: "chrome://maplus/content/html/img/copy.png", alt: ""});
        div.appendChild(img1);
        var img2 = Element.create("img", null, {src: "chrome://maplus/content/html/img/questionmark.png", alt: ""});
        div.appendChild(img2);
        
        document.body.appendChild(div);
        div.style.display = 'none';
    }
}));
    
// Analyza
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Analyza"; },
    
    _createColumnsMap: function(row, sloupce) {
        var columns = new Hash();
    
        for (var i = 0; i < row.cells.length && i < sloupce.length; i++) {
            var td = row.cells[i];
            var column = String(sloupce[i]);
            
            td.setAttribute("name", column);
            columns[column] = td;
        }
        
        return columns;
    },
    
    analyze: function(page, context) {
        // Bestiar (mysli i na POST)
        if (page.arguments["obchod"] != null && page.arguments["obchod"] != "jedn_new")
            return false;
            
        var tableNakup = $X('.//table[tbody/tr[3]/td/table/tbody/tr/td[contains(font/b, "prodeje")]]', page.content);
        if (tableNakup == null)
            return false;
    
        var tableData = $X('tbody/tr[3]/td/table', tableNakup);
        if (!tableData || tableData.rows.length < 1)
            return false;
        
        var bestiar = {
            vybraneJednotky: VybraneJednotky.get(page.id),
            table: ElementDataStore.get(tableData),
            elements: {
                tableNakup: tableNakup,
                tableData: tableData
            }
        };
        
        // Zpracuj hlavicku (chyby v ni sloupec barva)
        var header = ElementDataStore.get(tableData.rows[0]);
        header.columns = this._createColumnsMap(header.element, BestiarSloupce.puvodni.without("barva"));
        
        bestiar.table.header = header;
        bestiar.table.data = new Array();
        bestiar.table.bidnute = new Array();
        
        // Zpracuj jednotlive radky
        for (var i = 1; i < tableData.rows.length; i++) {
            var row = ElementDataStore.get(tableData.rows[i]);
            row.columns = this._createColumnsMap(row.element, BestiarSloupce.puvodni);
            
            // Nabidnout link
            row.linkNabidka = $X('.//a', row.columns["nabidka"]);
            
              // Puvodni text
            row.description = row.element.textContent.replace(/\n|\s+$/g, ""); 

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
            
            // Id stacku (da se zjistit pouze u nebidnutych jednotek)
            if (row.linkNabidka != null) {
                let onclick = row.linkNabidka.getAttribute("onclick");
                let m = onclick.match(/^set_as_selected[(](\d+)[)]$/);
                if (m != null)
                    row.data.id = parseInt(m[1]);
            }

            // Max sila stacku
            row.data.maxSilaStacku = parseInt(row.data.pocet * row.data.silaJednotky);
            // Sila stacku
            row.data.silaStacku = parseInt(row.data.maxSilaStacku * row.data.zkusenost);
            // Cena za 1 sily
            row.data.cenaZaSilu = (row.data.silaStacku > 0) ? parseFloat((row.data.nabidka / row.data.silaStacku).toFixed(1)) : 0;
             
            // Dodatecne informace
            var stats = Jednotky.vyhledej(row.data.jmeno);
            if (stats) {
                row.data.phb = stats.phb;
                row.data.ini = stats.realIni;
                // Typ zkracene
                row.data.typKratce = row.data.druh[0] + row.data.typ[0] + (row.data.typ != "Str." ? row.data.phb : "");
                
                // Vezmi v uvahu barvu
                var koef = (row.data.barva == page.regent.barva) ? 1.5 : 1.0;
                row.data.zlataTU = parseFloat((row.data.pocet * (stats.zlataTU / koef)).toFixed(1));
                row.data.manyTU = parseFloat((row.data.pocet * (stats.manyTU / koef)).toFixed(1));
                row.data.popTU = parseFloat((row.data.pocet * (stats.popTU / koef)).toFixed(1));
            }
            else {
                console.warn("Nenalezeny informace o jednotce %s.", row.jmeno);
            }
            
            // Je stack bidnuty?
            row.bidnuto = (row.element.getAttribute("bgcolor") == BESTIAR_BARVA_BID);
            
            console.log("stack id=%d jmeno=%o pocet=%d zkusenost=%f bidnuto=%o", row.data.id, row.data.jmeno, row.data.pocet, row.data.zkusenost, row.bidnuto);
            bestiar.table.data.push(row);
            
            if (row.bidnuto) {
                bestiar.table.bidnute.push(row);
            }
        }
        
        // Vytvor seznam sloupcu ktere maji byt zobrazeny
        var zobrazitSloupce = new Array();
        page.config.getAukce().evalPrefNodeList('sloupce/sloupec[@hidden != "true"]').each(function(e) {
                zobrazitSloupce.push(e.getAttribute("jmeno"));
            });
        
        var sloupce = new Array();
        
        if (zobrazitSloupce.length > 0) {
            BestiarSloupce.getAll().each(function(s) {
        		    if (sloupce.indexOf(s.jmeno) > -1)
        			    return; // continue
            			
        		    if (s.povinny || zobrazitSloupce.indexOf(s.jmeno) > -1)
        			    sloupce.push(s.jmeno);
        	    });
        }
        else {
            // Pouzij vychozi nastaveni
            BestiarSloupce.getAll().each(function(s) {
                    if (s.vychozi)
                        sloupce.push(s.jmeno);
                });
        }

        bestiar.sloupce = sloupce;
        
        // Vse uloz do kontextu stranky
        page.bestiar = bestiar;
        return true;
    },

    process: null
}));

// Zvetsit sirku tabulky bestiare
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Rozlozeni stranky"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table || !page.bestiar.sloupce)
            return false;    
       
        return page.config.getAukce().getBoolean("sirokaTabulka", false);
    },

    process: function(page, context) {
        // Uprav rozlozeni stranky
        page.content.setAttribute("width", null);
        page.leftMenu.setAttribute("width", 160);
        page.rightMenu.setAttribute("width", 160);
    }
}));

// Sloupce
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Sloupce"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table || !page.bestiar.sloupce)
            return false;    
       
        var sloupce = page.bestiar.sloupce;
        
        console.debug("Zobrazene sloupce: %o", sloupce);
        
        // Skryte puvodni sloupce
        var skryteSloupce = new Array();
        BestiarSloupce.puvodni.each(function(s) {
                if (sloupce.indexOf(s) < 0)
                    skryteSloupce.push(s);
            });
        
        context.skryteSloupce = skryteSloupce;
        console.debug("Skryte sloupce: %o", skryteSloupce);
        
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
                            delete row.columns[s];
                            // row.columns[s] = null;
                        }
                    });
            });
    
        // Pridej chybejici sloupce
        sloupce.without("barva").each(function(s) {
                var text = '<span><b>&nbsp;' + BestiarSloupce.getData(s).nazev + '&nbsp;</b></span>';
                
                // Pridavej pouze nove
                if (!BestiarSloupce.jePuvodni(s)) {
                    var td = Element.create("td", text);
                    table.header.element.appendChild(td);
                    
                    td.setAttribute("name", s);
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
                        if (!BestiarSloupce.jePuvodni(s)) {
                            var hodnota = (row.data[s] != null ? row.data[s] : "");
                            var td = Element.create("td", '<span>' + hodnota + '&nbsp;</span>', {align: "right"});
                            row.element.appendChild(td);
                                
                            td.setAttribute("name", s);
                            row.columns[s] = td;
                            
                            // Tohle je sice trosku osklivy ale funkcni ;)
                            if (s == "typKratce")
                                td.setAttribute("align", "left");
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

// Rozsireni
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Rozsireni"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table || !page.bestiar.sloupce)
            return false;    
       
        if (page.bestiar.sloupce.indexOf("rozsireni") < 0)
            return false;
            
        var sloupce = page.bestiar.sloupce;

        // Vytvor seznam chybejicich sloupcu
        var chybejiciSloupce = new Array();
        BestiarSloupce.getAll().each(function(s) {
                if (sloupce.indexOf(s.jmeno) < 0)
                    chybejiciSloupce.push(s.jmeno);
            });
        context.chybejiciSloupce = chybejiciSloupce;
        console.debug("Chybejici sloupce: %o", chybejiciSloupce);
        
        // Vytvor tooltip pouze pokud nejaka informace chyby
        if (context.chybejiciSloupce.length > 0 
                && context.chybejiciSloupce.without("typKratce").length > 0
                && context.chybejiciSloupce.without("typ", "druh", "phb").length > 0) {
            // Vytvor template pro chybejici sloupce
            var html = '<table cellspacing="0" cellpadding="0" border="0">';
            html += '<tr><td colspan="2"><span><b>#{jmeno}</b></span></td></tr>';
            chybejiciSloupce.each(function(s) {
                    var nazev = BestiarSloupce.getData(s).nazev;
                    html += '<tr><td><span>' + nazev + '&nbsp;&nbsp;</span></td>';
                    html += '<td><span>#{' + s + '}</span></td></tr>';
                });
            html += '</table>';
            // console.debug("Chybejici sloupce template:\n", html);
            
            context.chybejiciTemplate = new Template(html);
        }
        
        return true;
    },
    
    process: function(page, context) {
        var vybrane = page.bestiar.vybraneJednotky;
        
        // Zpracuj tabulku
        for (let i = 0; i < page.bestiar.table.data.length; i++) {
            let row = page.bestiar.table.data[i];
        
            let td = row.columns["rozsireni"];
            if (td == null)
                continue;
        
            td.style.width = "32px";
            td.innerHTML = "";
            
            if (!row.bidnuto && row.linkNabidka != null && row.data.id != null) {
                // Zamluvit jednotku pri kliknuti na cenu
                row.linkNabidka.setAttribute("title", "Vybrat/Zamluvit jednotku");
                
                // Tohle ma za nasledek ze se vybrana jednotka odstrani az pri druhem kliknuti (po cerstvem refreshi)
                // coz sice nebyl zamer ale je to tak lepsi, takze zachovat
                let zamluveno = false; 
                Event.observe(row.linkNabidka, 'click', function() {
                    if (!zamluveno) {
                        vybrane.add(row.data, row.description);
                        console.log("Jednotka pridana mezi vybrane: %d", row.data.id);
                        
                        row.element.setAttribute("bgcolor", BESTIAR_BARVA_ZAMLUVENO);
                        zamluveno = true;
                    }
                    else {
                        console.log("Jednotka odstranena z vybranych: %d", row.data.id);
                        vybrane.remove([row.data.id]);
                        
                        row.element.setAttribute("bgcolor", "black");
                        zamluveno = false;
                    }
                });
            }
            
            // Kopiruj popis
            let copy = Element.create("a", '<img class="link" src="chrome://maplus/content/html/img/copy.png" alt="" />', {href: "javascript://"});
            copy.setAttribute("title", "Zkopíruje popis stacku do schránky");
            Event.observe(copy, 'click', function() { Clipboard.copyText(row.description); });
            td.appendChild(copy);
           
            // Zobraz chybejici sloupce
            if (context.chybejiciTemplate != null) {
                let chybejici = this._createMissingTooltip(context.chybejiciTemplate, i, row.data);
                td.appendChild(Element.create("span", "&nbsp;"));
                td.appendChild(chybejici);
            }
        }
    },
    
    _createMissingTooltip: function(template, index, data) {
        var link = Element.create("a", '<img class="link" src="chrome://maplus/content/html/img/questionmark.png" alt="" />', {href: "javascript://"});
        link.setAttribute("title", "Zobrazí skryté informace o stacku.");
        
        var tooltipName = "missing_" + index;
        if (!Tooltip.isRegistered(tooltipName)) {
            Tooltip.register(tooltipName, function() {
                    var html = template.evaluate(data); 
                    var tooltip = Tooltip.create(html, "tooltip", false);
                    tooltip.style.padding = '4px';
                    return tooltip;
                });
        }
     
        Tooltip.attach(link, tooltipName);
        return link; 
    }
}));

// Styl
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Styl"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table)
            return false;
       
       return page.config.getBarevnyText();
    },
    
    process: function(page, context) {
        // Pozn: styly sou definovany v bestiar-style.js
        page.bestiar.table.data.each(function(row) {
                row.columns.each(function(e) {
                        var sloupec = e[0];
                        var td = e[1];
                        var format = BestiarColumnStyle[sloupec];
                        
                        if (td != null && format != null) {
                            format(td, row.data);
                        }
                    });
            });
    }
}));

// Aktivni jmena jednotek a id
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Jednotky"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table)
            return false;    
       
       return true;
    },
    
    process: function(page, context) {
        // Pozn: styly sou definovany v bestiar-style.js
        page.bestiar.table.data.each(function(row) {
                var td = row.columns["jmeno"];
                var jmeno = row.data["jmeno"];
                var id = parseInt(td.textContent.match(/(?:.*?\s+\[\s+(\d+)\s+\])?/)[1]);
                
                var link = MaPlus.Tooltips.createActiveUnit(page, jmeno);
                if (link != null) {
                    link.innerHTML = '<span>' + jmeno + '</span>';
                    
                    td.innerHTML = '<span>&nbsp;</span>';
                    td.appendChild(link);
                }
                else {
                    td.innerHTML = '<span>&nbsp;</span>' + td.innerHTML;
                }
                
                if (!isNaN(id)) {
                	link = MaPlus.Tooltips.createActiveId(page, id);
                    link.innerHTML = '<span class="bestiarBid">[&nbsp;' + id + '&nbsp;]</span>';
                    
                	var spanId = Element.create("span", '&nbsp;');
                	spanId.appendChild(link);
                	spanId.appendChild(document.createTextNode(' '));
                	td.appendChild(spanId);
                }
            });
    }
}));

// Odpocet casu
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Odpocet"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table)
            return false;
        if (window.TIMERS_DISABLED)
            return false;
       
        // Sestav list bunek s casem
        var list = new Array();
           
        page.bestiar.table.data.each(function(row) {
                if (isNaN(row.data.cas))
                    return;
                    
                list.push({cell: row.columns["cas"], time: row.data.cas});
            });
       
       context.list = list;
       context.barvy = page.config.getBarevnyText();
       return context.list.length > 0;
    },
    
    process: function(page, context) {
        // Start timer
        var _this = this;
        context.timer = setInterval(function() { _this._updateTime(context); }, 1000);
    },
    
    _updateTime: function(context) {
        var casZobrazeni = new Date(document.lastModified);
        var aktualniCas = new Date();
        var rozdil = (aktualniCas.getTime() - casZobrazeni.getTime()) / 1000;
        var aktivni = 0;

        for (var i = 0; i < context.list.length; i++) {
            var td = context.list[i].cell;
            var pocatecniCas = context.list[i].time;
            
            var first = false;
            var spanAktualni = context.list[i].aktualni;
            
            if (spanAktualni == null) {
                td.innerHTML = '';
                // Aktualni
                spanAktualni = Element.create("span");
                td.appendChild(spanAktualni);
                // Puvodni
                td.appendChild(Element.create("span", '&nbsp;(' + formatTime(pocatecniCas) + ')&nbsp;', {style: "color: gray;"}));
                
                context.list[i].aktualni = spanAktualni;
                first = true;
            }
        
        
            var cas = Math.max(0, pocatecniCas - rozdil);
            spanAktualni.innerHTML = '&nbsp;' + formatTime(cas);

            if (context.barvy && (parseInt(rozdil) % 5 == 0 || first)) // Neupdatuj barvy zbytecne kazdou vterinu
                spanAktualni.style.color = Color.fromRange(cas, 60, 180, Color.Pickers.redGreen);
                
            if (cas > 0)
                ++aktivni;
        }
        
        // Stop timer pokud jiz neni zadny stack aktivni
        if (aktivni == 0) {
            clearInterval(context.timer);
        }
    }
}));


// Oznac vybrane jednotky
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Vybrane jednotky"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table)
            return false;
        
        // Ziskej vybrane jednotky
        var jednotky = page.bestiar.vybraneJednotky;
        var vybrane = jednotky.getList();
        
        var bidnuteJednotky = page.bestiar.table.bidnute.length > 0;
        
        var vybraneMap = new Hash();
        vybrane.each(function(j) {
            vybraneMap[j.id] = j;
        });
        
        // Vytvor seznam vybranych radku
        context.list = new Array();
        var descriptors = new Array();
        
        page.bestiar.table.data.each(function(row) {
            if (bidnuteJednotky)
                descriptors.push(BestiarStack.getDescriptor(row.data));
        
            if (row.data.id == null)
                return; // continue;
        
            if (row.data.id in vybraneMap) {
                jednotky.add(row.data, row.description);
            
                console.log("Vybrana jednotka: %d", row.data.id);
                context.list.push(row);
                
                // Odstran ze seznamu
                delete vybraneMap[row.data.id];
            }
        });
        
        // Zjisti jestli bidnute vybrane jednotky jeste muzou existovat
        if (bidnuteJednotky) {
            vybraneMap.each(function([id, j]) {
                var desc = BestiarStack.getDescriptor(j);
                // Pokud jednotka se stejnym deskriptorem jeste muze existovat, odstran ji ze seznamu
                // aby nebyla odstranena z vybranych jednotek..
                if (descriptors.indexOf(desc) > -1)
                    delete vybraneMap[id];
            });
        }
        
        // Odstran neexistujici jednotky
        if (vybraneMap.length > 0) {
            console.debug("Odstranuji se: %o", vybraneMap.keys());
            jednotky.remove(vybraneMap.keys());
        }
        
        context.fontKomentar = $X('tbody/tr[4]/td/font[2]', page.bestiar.elements.tableNakup);
        if (context.fontKomentar == null)
            return false;
            
        context.form = $X('.//input[@type = "submit"]', page.bestiar.elements.tableNakup).form;
        context.selectJednotka = $X('.//select[@name = "nabidnout"]', page.bestiar.elements.tableNakup);
        if (context.form == null || context.selectJednotka == null)
            return false;
        
        return true;
     },
     
     process: function(page, context) {
        // Pridej komentar
        context.fontKomentar.appendChild(Element.create("br"));
        context.fontKomentar.appendChild(Element.create("span", "\xA0Zelené pozadí znamená, že jste o jednotku projevili zájem, ale nemáte ji bidnutou.\xA0", {"class": "small", style: "background-color: #013500;"}));
     
        // Pridej handler ktery vzdy prida jednotu do seznamu pri bidnuti
        Event.observe(context.form, "submit", function(event) {
            var id = parseInt(context.selectJednotka.value);
            if (id > 0) {
                // Musime najit informace o jednotce
                var rows = page.bestiar.table.data;
                for (var i = 0; i < rows.length; i++) {
                    if (id == rows[i].data.id) {
                        // Uloz a return
                        page.bestiar.vybraneJednotky.add(rows[i].data, rows[i].description);
                        return;
                    }
                }
            }
        });
     
        // Uprav pozadi
        context.list.each(function(row) {
            if (!row.bidnuto)
                row.element.setAttribute("bgcolor", BESTIAR_BARVA_ZAMLUVENO);
        });
        
        // Link pro odeslani zamluvenych jednotek
        var trLast = $X('tbody/tr[last()]', page.bestiar.elements.tableNakup);
        
        var trOdeslat = Element.create("tr", null, {bgcolor: "#505050"});
        var tdOdeslat = trOdeslat.appendChild(Element.create("td", null, {colspan: "3", style: "text-align: center;"}));
        var spanOdeslat = tdOdeslat.appendChild(Element.create("span", '<br />'));
        
        var odeslatHref = MaPlus.buildUrl(page, "posta.html", {zamluvene_jednotky: true, dulezitost: "bestiar", posta: "posta_v_ally"});
        var linkOdeslat = spanOdeslat.appendChild(Element.create("a", 'Odeslat poštou vybrané jednotky', {href: odeslatHref}));
        
        trLast.parentNode.insertBefore(trOdeslat, trLast);
     }
}));


// Razeni a filtrovani
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Filtry"; },

    analyze: function(page, context) {
        // Bestiar
        if (!page.bestiar || !page.bestiar.table)
            return false;
        if (!page.config.getAukce().getBoolean("filtrovani", true))
            return false;
            
        // Konfigurace
        context.config = PlusConfig.Aukce.extend(page.config.getAukce().getPrefNode("filtry", true));

        // Optimilizace (lepsi to vzit najednou nez po jedne)
        context.rules = new Hash();
        
        var allRules = BestiarFiltry.getAllRulesJSON().evalJSON();
        allRules.each(function(i) {
            var list = context.rules[i.name];
            if (list == null) {
                list = new Array();
                context.rules[i.name] = list;
            }
        
            list.push(i);
        });        
        
        console.debug("Rules: %o", context.rules);
        
        return true;
    },

    process: function(page, context) {
        // Vytvor seznam hlavicek (hlavicky se upravujou az v process takze to musi byt tady)
        context.headers = new Array();        
        var table = page.bestiar.table.element;
        var header = page.bestiar.table.header;
        
        header.columns.values().each(function(td) {
            var name = td.getAttribute("name");
            if (name == null)
                return; // continue;
            
            // Get available rules for this column
            var rules = context.rules[name];
            
            if (rules != null && rules.length > 0) {
                // Najdi jestli sloupec podporuje filtrovani
                var filterable = false;
                for (var i = 0; i < rules.length; i++) {
                    if (rules[i].type == "filter") {
                        filterable = true;
                        break;
                    }
                }
                
                // Vloz moznost vypnuti filtru
                if (filterable) {
                    rules.push({ name: name, type: "filter", condition: "", title: "Vše" });
                }
                
                // Vloz do seznamu
                context.headers.push({
                    cell: td,
                    name: name,
                    rules: rules,
                    filterable: filterable,
                    title: BestiarSloupce.getData(name).nazev
                });
            }
        });
    
    	// Zpracovani hlavicky
    	var createRulesTooltipHtml = this._createRulesTooltipHtml;
    
        context.headers.each(function(h) {
            // Vytvor tooltip
            var linkTooltip = createRulesTooltipHtml(table, context.config, h, page.regent, page.provincie());
            
            // Uprav hlavicku
            var b = $X('span/b', h.cell);
            b.innerHTML = '';
            
            b.appendChild(document.createTextNode("\xA0"));
            b.appendChild(linkTooltip);
            b.appendChild(document.createTextNode("\xA0"));
        });
        
        // Link "Zrus filtrovani" nad tabulkou
        var tdNastaveniFiltru = $X('tbody/tr[2]/td[1 and contains(font, "Prosím")]', page.bestiar.elements.tableNakup);
        tdNastaveniFiltru.innerHTML = '';
        
        var spanFilterAktivovan = Element.create("span", '&nbsp;<span id="plus_filterAktivovan" class="small" style="display: none; color: yellow;">(filter aktivován)</span>&nbsp;', {class: "small"});
        
        var linkZrusFiltry = Element.create("a", '<span>Zruš filtrování a řazení</span>', {href: "javascript://"});
        Event.observe(linkZrusFiltry, 'click', function(event) {
            context.config.clearRules();
            $('plus_filterAktivovan').style.display = 'none';
            // Reset tabulky
            for (let i in Rules) {
                Rules[i](table, null, page.regent, page.provincie());
            }
        });
        
        tdNastaveniFiltru.appendChild(linkZrusFiltry);
        tdNastaveniFiltru.appendChild(Element.create("br"));
        tdNastaveniFiltru.appendChild(spanFilterAktivovan);
        tdNastaveniFiltru.appendChild(Element.create("br"));
        
        // Aplikuj aktualni filtry
        for (let i in Rules) {
            if (typeof Rules[i] == "function" && context.config.hasRules(i))
                Rules[i](table, context.config.createRuleSet(i), page.regent, page.provincie());
        }
        
        if (context.config.hasRules("filter"))
            $('plus_filterAktivovan').style.display = '';
    },
    
    _createRulesTooltipHtml: function(table, config, header, regent, provincie) {
        var link = Element.create("a", header.title, {href: "javascript://"});
        
        var tooltipName = "header_" + header.name;
        if (!Tooltip.isRegistered(tooltipName)) {
        	// Registruj tooltip
            Tooltip.register(tooltipName, function() {
        			var tooltip = Tooltip.create('<span><b>' + header.title + '&nbsp;&nbsp;&nbsp;</b></span>', "tooltip", true); 
        			tooltip.style.padding = '4px';
                    var span = tooltip.appendChild(Element.create("span"));
                    
                    // Pridej pravidla
                    header.rules.each(function(r) {
                    	// Newline
                        span.appendChild(Element.create("br"));
                        
                        // Link pravidla
                        var filter = span.appendChild(Element.create("a", r.title, {href: "javascript://", style: "text-decoration: none;"}));
                        
                        // Event handler pravidla
                        Event.observe(filter, 'click', function() {
                        	// Uloz pravidlo
                            if (r.condition != "") {
                                // Vychozi razeni vloz na zacatek retezce
                                if (r.type == "sort" && !config.hasRules("sort")) {
                                    config.setRule("id", "sort", "stack1.id - stack2.id");
                                    config.setRule(DEFAULT_SORT_NAME, "sort", DEFAULT_SORT_CONDITION);
                                }
                                
                                config.setRule(r.name, r.type, r.condition);
                            }
                            else {
                                config.removeRule(r.name, r.type);
                            }
                            
                            // Updatuj tabulku
                            var rules = config.createRuleSet(r.type);
                            Rules[r.type](table, rules, regent, provincie);
                            
                            if (r.type == "filter")
                                $('plus_filterAktivovan').style.display = (rules.length > 0) ? '' : 'none';
                        });
                        
                        // Mezera
                        span.appendChild(document.createTextNode("\xA0\xA0"));
                    });
                    
                    return tooltip;
                });
        }
     
        Tooltip.attach(link, tooltipName);
        return link; 
    }
}));
