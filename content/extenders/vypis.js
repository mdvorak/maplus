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
            
        vypis.rozdaneUtoky = this._zpracujTabulku(vypis.tableRozdane);
        vypis.braneneUtoky = this._zpracujTabulku(vypis.tableBranene);
        
        console.debug("Utoky rozdane=%d branene=%d", vypis.rozdaneUtoky.length, vypis.braneneUtoky.length);
        
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
            
            row.utok = {
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
            
            utoky.push(row.utok);
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
        context.nevracenoPrv = 0;
        context.posledniBojMinuty = null;
        
        page.vypis.rozdaneUtoky.each(function(utok) {
            if (utok.cas < 24*60)
                context.utokuZaPosledniDen++;
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
        if (page.provincie.protV > 0)
            context.prvDoProtu = 0;
        else
            context.prvDoProtu = Math.max(0, context.prvDoProtu);
        
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
            utokyStats += "rozdán <i>" + context.utokuZaPosledniDen + "</i> útok.";
        else if (context.utokuZaPosledniDen > 1 && context.utokuZaPosledniDen < 5)
            utokyStats += "rozdány <i>" + context.utokuZaPosledniDen + "</i> útoky.";
        else
            utokyStats += "rozdáno <i>" + context.utokuZaPosledniDen + "</i> útoků.";
            
        context.tdRozdaneStats.innerHTML = '<font size="1">' + utokyStats + '</font>';
        
        // Obrana
        obranaStats = "Zbývá vrátit <i>" + context.nevracenoCsek + "</i> ";
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
        
        context.vsechnyUtoky = page.vypis.rozdaneUtoky.concat(page.vypis.braneneUtoky);
        return context.vsechnyUtoky.length > 0;
    },

    process: function(page, context) {
        context.vsechnyUtoky.each(function(utok) {
            var row = ElementDataStore.get(utok.tr);
    
            // Obarvy uroven
            if (context.barvy) {
                row.cells.uroven.style.color = Color.fromRange(utok.uroven, 125, 50, Color.Pickers.redGreen);
            }
            
            // Linky
            var link = MaPlus.Tooltips.createActiveId(page, utok.id);
            row.cells.id.innerHTML = "<span></span>";
            row.cells.id.valign = "middle";
            row.cells.id.firstChild.appendChild(link);

            // Nahrad v typu newline mezerou 
            row.cells.typ.innerHTML = row.cells.typ.innerHTML.replace('<br>', ' ');
            
            // Tooltip kdy vyprsi utok
            var casUtoku = new Date().getTime() - utok.cas * 60 * 1000;
            var vyprsi = new Date(casUtoku + 72 * 3600 * 1000);
            vyprsi.setSeconds(0, 0);
            
            row.cells.cas.setAttribute("title", "Vyprší: " + vyprsi.toLocaleString().replace(/:00$/, ""));
        });
    }
}));
