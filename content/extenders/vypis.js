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
    getName: function() { return "Vypis Utoku - Analyza"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
        
        var vypis = page.vypis = new Object();
        
        vypis.tableRozdane = $X('table[tbody/tr[1]/td[1]/font/b = "Rozdané útoky"]', page.content);
        vypis.tableBranene = $X('table[tbody/tr[1]/td[1]/font/b = "Bráněné útoky"]', page.content);
        if (!vypis.tableRozdane || !vypis.tableBranene)
            return false;
        
        try {
            logger().group("Rozdane utoky");
            vypis.rozdaneUtoky = this._zpracujTabulku(vypis.tableRozdane);
        } 
        finally { logger().groupEnd(); }
        try {
            logger().group("Branene utoky");
            vypis.braneneUtoky = this._zpracujTabulku(vypis.tableBranene);
        } 
        finally { logger().groupEnd(); }
        
        logger().debug("Utoky rozdane=%d branene=%d", vypis.rozdaneUtoky.length, vypis.braneneUtoky.length);
        
        return true;
    },

    process: null,
    
    _zpracujTabulku: function(table) {
        var utoky = new Array();
        
        for (var i = 0; i < table.rows.length; i++) {
            var tr = table.rows[i];
            if (tr.cells.length < 14)
                continue;
            
            var tdId = tr.cells[2];
            var id = parseInt(tdId.textContent);
            
            if (isNaN(id))
                continue;
                
            var row = ElementDataStore.get(tr);
            
            // Bunky
            row.cells = {
                barva: tr.cells[1],
                id: tr.cells[2],
                regent: tr.cells[3],
                presvedceni: tr.cells[4],
                cas: tr.cells[5],
                sila: tr.cells[6],
                uroven: tr.cells[7],
                typ: tr.cells[8],
                status: tr.cells[9],
                utok: tr.cells[10],
                ztratyUtocnik: tr.cells[11],
                ztratyObrance: tr.cells[13]
            }
            
            // Data
            var m = row.cells.cas.textContent.match(/(\d+):(\d+)/);
            var cas = m ? parseInt(m[1]) * 60 + parseInt(m[2]) : Number.NaN;
            
            var utok = {
                tr: tr,
            
                barva: row.cells.barva.textContent[0],
                id: id,
                regent: row.cells.regent.textContent,
                presvedceni: row.cells.presvedceni.textContent[0],
                cas: cas, // Cas od utoku v minutach
                sila: parseInt(row.cells.sila.textContent),
                uroven: parseFloat(row.cells.uroven.textContent),
                typ: row.cells.typ.textContent,
                status: row.cells.status.textContent,
                ztratyUtocnik: parseFloat(row.cells.ztratyUtocnik.textContent),
                ztratyObrance: parseFloat(row.cells.ztratyObrance.textContent)
            };
            
            row.utok = utok;
            utoky.push(utok);
            
            logger().log("Utok id=%d cas=%d sila=%d uroven=%f\% typ=%s status=%s vysledek=%f:%f", utok.id, utok.cas, utok.sila, utok.uroven, utok.typ, utok.status, utok.ztratyUtocnik, utok.ztratyObrance);
        }
        
        return utoky;
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Vypis Utoku - Statistiky"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
        if (page.vypis == null)
            return false;
            
        context.tdRozdaneStats = $X('tbody/tr[last()]/td[1]', page.vypis.tableRozdane);
        context.tdBraneneStats = $X('tbody/tr[last()]/td[1]', page.vypis.tableBranene);
        
        if (context.tdRozdaneStats == null || context.tdBraneneStats == null)
            return false;
        
        // Vypocitej statistiky
        context.utokuZaPosledniDen = 0;
        context.prvoutokuZaPosledniDen = 0;
        context.nevracenoPrv = 0;
        context.posledniBojMinuty = null;
        
        page.vypis.rozdaneUtoky.each(function(utok) {
            if (utok.cas < 24*60)
                context.utokuZaPosledniDen++;
            if (utok.cas < 24*60 && utok.typ.search("prvoútok") > -1)
                context.prvoutokuZaPosledniDen++;
            if (utok.typ.search("nevráceno") > -1)
                context.nevracenoPrv++;
            if (context.posledniBojMinuty == null || utok.cas < context.posledniBojMinuty)
                context.posledniBojMinuty = utok.cas;
        });
        
        context.nevracenoCsek = 0;
        context.prvDoProtu = 3;
        
        page.vypis.braneneUtoky.each(function(utok) {
            if (utok.typ.search("nevráceno") > -1)
                context.nevracenoCsek++; 
            if (utok.typ.search("prvoútok") > -1 
                    && utok.status == "prošel" 
                    && (context.posledniBojMinuty == null || utok.cas < context.posledniBojMinuty))
                context.prvDoProtu--;
        });
        
        // Nejsem uz v protu?
        if (page.provincie().protV > 0) {
            context.prvDoProtu = 0;
        }
        else if (context.prvDoProtu == 0) {
            // Vylezl jsem z protu sam
            context.prvDoProtu = 3; 
        }
        
        return true;
    },

    process: function(page, context) {
        // Utok
        var utokyStats = "<i>" + context.nevracenoPrv + "</i> ";
        if (context.nevracenoPrv == 1)
           utokyStats += "csko se ještě nevrátilo.";
        else if (context.nevracenoPrv > 1 && context.nevracenoPrv < 5)
            utokyStats += "cska se ještě nevrátila.";
        else
            utokyStats += "csek se ještě nevrátilo.";
            
        utokyStats += "<br/>";
        utokyStats += "Za posledních 24 hodin ";
        
        if (context.utokuZaPosledniDen == 1)
            utokyStats += "rozdán <i>" + context.utokuZaPosledniDen + "</i> útok, ";
        else if (context.utokuZaPosledniDen > 1 && context.utokuZaPosledniDen < 5)
            utokyStats += "rozdány <i>" + context.utokuZaPosledniDen + "</i> útoky, ";
        else
            utokyStats += "rozdáno <i>" + context.utokuZaPosledniDen + "</i> útoků, ";
            
        utokyStats += "z toho <i>" + context.prvoutokuZaPosledniDen + "</i> ";
        if (context.prvoutokuZaPosledniDen == 1)
            utokyStats += "prvoútok."
        else if (context.prvoutokuZaPosledniDen > 1 && context.prvoutokuZaPosledniDen < 5)
            utokyStats += "prvoútoky."
        else
            utokyStats += "prvoútoků."
        
        context.tdRozdaneStats.innerHTML = '<font size="1">' + utokyStats + '</font>';
        
        // Obrana
        var obranaStats = "Zbývá vrátit <i>" + context.nevracenoCsek + "</i> ";
        if (context.nevracenoCsek == 1)
            obranaStats += "csko.";
        else if (context.nevracenoCsek > 1 && context.nevracenoCsek < 5)
            obranaStats += "cska.";
        else
            obranaStats += "csek.";
            
        if (context.prvDoProtu && context.prvDoProtu > 0) {
            if (context.prvDoProtu == 1)
                obranaStats += "<br/>Zbývá <i>1</i> prvoútok do protu.";
            else
                obranaStats += "<br/>Zbývají <i>" + context.prvDoProtu + "</i> prvoútoky do protu.";
        }
        
        context.tdBraneneStats.innerHTML = '<font size="1">' + obranaStats + '</font>';
        
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Vypis Utoku - Okraje"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
        if (page.vypis == null)
            return false;
        return true;
    },

    process: function(page, context) {
        TableHelper.thinBorders(page.vypis.tableRozdane);
        TableHelper.thinBorders(page.vypis.tableBranene);
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Vypis Utoku - Vzhled"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
        if (page.vypis == null)
            return false;
            
        context.barvy = page.config.getBarevnyText();
        context.obarvovatVse = page.config.getPrefNode("vypis", true).getBoolean("obarvovatVse", false);
        context.zobrazitAlianci = page.config.getPrefNode("vypis", true).getBoolean("aliance", true);
        context.roztahnoutObsah = page.config.getPrefNode("vypis", true).getBoolean("roztahnout", true);
        
        context.vsechnyUtoky = page.vypis.rozdaneUtoky.concat(page.vypis.braneneUtoky);
        
        context.hlavickaRozdane = $X('tbody/tr[2]', page.vypis.tableRozdane);
        context.hlavickaBranene = $X('tbody/tr[2]', page.vypis.tableBranene);
        
        return context.vsechnyUtoky.length > 0;
    },

    process: function(page, context) {
    
        const ALIANCE_INDEX = 4;
        const HELP_TEXT = 'Pokud je aliance <i>Neznámá</i> nebo neodpovídá aktuálnímu stavu, vyšlete do provnicie své špehy.';
        
        function pridatSloupec(tr, index, content) {
            var td = document.createElement("td");
            td.appendChild(content);
            
            tr.insertBefore(td, tr.cells[index + 1]);
            return td;
        }
        
        // Uprava hlavicek
        if (context.zobrazitAlianci) {
            function vytvorHlavickuAliance() {
                var content = Element.create("span", "<b>Aliance</b>\xA0");
                
                var help = MaPlus.Tooltips.createHelp(page, HELP_TEXT);
                content.appendChild(help);
                
                return content;
            }
        
            pridatSloupec(context.hlavickaRozdane, ALIANCE_INDEX, vytvorHlavickuAliance());
            pridatSloupec(context.hlavickaBranene, ALIANCE_INDEX, vytvorHlavickuAliance());
        }
        
        context.hlavickaRozdane.className += " noLinkUnderstrike";
        context.hlavickaBranene.className += " noLinkUnderstrike";
        
        // Uprav rozlozeni stranky
        if (context.roztahnoutObsah) {
            page.content.setAttribute("width", "60%");
            page.leftMenu.setAttribute("width", "20%");
            page.rightMenu.setAttribute("width", "20%");
        }
        
        // Uprava samontych utok
        context.vsechnyUtoky.each(function(utok) {
            var row = ElementDataStore.get(utok.tr);
    
            // Obarvy uroven
            if (context.barvy && (context.obarvovatVse || utok.typ.search("nevráceno") > 0)) {
                row.cells.uroven.style.color = Color.fromRange(utok.uroven, 125, 50, Color.Pickers.redGreen);
            }
            
            // Linky
            var link = MaPlus.Tooltips.createActiveId(page, utok.id);
            row.cells.id.innerHTML = "<span></span>";
            row.cells.id.valign = "middle";
            row.cells.id.firstChild.appendChild(link);

            // Nahrad v typu newline mezerou 
            row.cells.typ.innerHTML = row.cells.typ.innerHTML.replace('<br>', ' ');
            row.cells.typ.style.maxWidth = "4em";
            
            // Tooltip kdy vyprsi utok
            var vyprsiZaMinut = DEN_MINUT * 3 - utok.cas;
            var presnyCas = new Date(new Date().getTime() + vyprsiZaMinut * 60 * 1000);
            presnyCas.setSeconds(0, 0);
            
            logger().debug("cas=%d, vyprsi=%d, presny cas=%o", utok.cas, vyprsiZaMinut, presnyCas);
            
            // Vytvor text podle doby
            var text = "Útok vyprší " + timeFromNow(presnyCas);
            row.cells.cas.setAttribute("title", text);
            
            // Pridej sloupec s alianci
            if (context.zobrazitAlianci) {
                var provincie = MaData.najdiProvincii(utok.id);
                var spanAliance;
                
                if (provincie != null && provincie.alianceZnama) 
                    spanAliance = Element.create("span", provincie.aliance || "")
                else 
                    spanAliance = Element.create("span", "Neznámá", {"class": "alianceNeznama"});
                
                pridatSloupec(utok.tr, ALIANCE_INDEX, spanAliance);
            }
        });
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Vypis Utoku - Vracene utoky"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
        if (page.vypis == null)
            return false;
        
        var cfg = page.config.getPrefNode("vypis", true);
        var skrytPrva = cfg.getBoolean("skrytVraceneUtoky", false);
        var skrytCska = cfg.getBoolean("skrytCska", false);
        
        if (!skrytPrva && !skrytCska)
            return false;
        
        context.tableTop = $X('table[1 and count(tbody/tr) = 1]', page.content);
        if (context.tableTop == null)
            return false;
        
        // Vytvor seznam vracench utoku
        context.skrytRadky = new Array();
        
        page.vypis.rozdaneUtoky.concat(page.vypis.braneneUtoky).each(function(utok) {
            if ((skrytPrva && utok.typ == "prvoútokvráceno") || (skrytCska && utok.typ == "csko")) {
                context.skrytRadky.push(utok.tr);
            }
        });
        
        return context.skrytRadky.length > 0;
    },

    process: function(page, context) {
        // Skryj radky
        context.skrytRadky.each(function(tr) {
            tr.style.display = 'none';
        });
        
        // Zobraz skryte utoky
        var spanUpozorneni = Element.create("span", "Některé útoky byly skryty.\xA0");
        var linkZobrazit = spanUpozorneni.appendChild(Element.create("a", "Zobrazit", {href: "javascript://"}));
        
        Event.observe(linkZobrazit, 'click', function() {
            context.skrytRadky.each(function(tr) {
                tr.style.display = '';
            });
            
            spanUpozorneni.innerHTML = '\xA0';
        });
        
        page.content.insertBefore(spanUpozorneni, context.tableTop.nextSibling);
        page.content.insertBefore(Element.create("br"), context.tableTop.nextSibling);
    }
}));
