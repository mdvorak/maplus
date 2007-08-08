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
    getName: function() { return "Vypis Utoku - TODO"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
            
        // TODO
        
        return false;
    },

    process: function(page, context) {
        // TODO
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Vypis Utoku - TODO"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;
            
        // TODO
        
        return false;
    },

    process: function(page, context) {
        // TODO
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Vypis Utoku - Okraje"; },

    analyze: function(page, context) {
        if (page.arguments["vypis"] != "utoky_detailne")
            return false;

        context.tableRozdane = $X('table[tbody/tr[1]/td[1]/font/b = "Rozdané útoky"]', page.content);
        context.tableBranene = $X('table[tbody/tr[1]/td[1]/font/b = "Bráněné útoky"]', page.content);
        if (!context.tableRozdane || !context.tableBranene)
            return false;

        return true;
    },

    process: function(page, context) {
        TableHelper.thinBorders(context.tableRozdane);
        TableHelper.thinBorders(context.tableBranene);
    }
}));



/*

function vypis_process(page) {
    var rozdaneTable = page.evaluateSingle('table[tbody/tr[1]/td[1]/font/b = "Rozdané útoky"]', page.content);
    var braneneTable = page.evaluateSingle('table[tbody/tr[1]/td[1]/font/b = "Bráněné útoky"]', page.content);
    
    if (!rozdaneTable || !braneneTable)
        return;
        
    // Obecne zpracovani tabulek
    var rozdaneUtoky = vypis_zpracujTabulku(page, rozdaneTable);
    var braneneUtoky = vypis_zpracujTabulku(page, braneneTable);
    
    // Vypocitej statistiky
    var utokuZaPosledniDen = 0;
    var nevracenoPrv = 0;
    var posledniBojMinuty = null;
    
    for (var i in rozdaneUtoky) {
        var utok = rozdaneUtoky[i];
        
        if (utok.dobaMinuty < 24*60)
            utokuZaPosledniDen++;
        if (utok.typ.search("nevráceno") > -1)
            nevracenoPrv++;
        if (posledniBojMinuty == null || utok.dobaMinuty < posledniBojMinuty)
            posledniBojMinuty = utok.dobaMinuty;
    }
    
    var nevracenoCsek = 0;
    var prvDoProtu = 3;
    for (var i in braneneUtoky) {
        var utok = braneneUtoky[i];

        if (utok.typ.search("nevráceno") > -1)
            nevracenoCsek++; 
        if (utok.typ.search("prvoútok") > -1 && utok.status == "prošel" && (posledniBojMinuty == null || utok.dobaMinuty < posledniBojMinuty))
            prvDoProtu--;
    }
    prvDoProtu = Math.max(0, prvDoProtu);
    
    // Zobraz statistky
    
    // Utok
    var utokyStats = "<i>" + nevracenoPrv + "</i> ";
    if (nevracenoPrv == 1)
       utokyStats += "csko se ještě nevrátilo.";
    else if (nevracenoPrv > 1 && nevracenoPrv < 5)
        utokyStats += "cska se ještě nevrátila.";
    else
        utokyStats += "csek se ještě nevrátilo.";
        
    utokyStats += "<br/>";
    utokyStats += "Za posledních 24 hodin ";
    if (utokuZaPosledniDen == 1)
        utokyStats += "rozdán <i>" + utokuZaPosledniDen + "</i> útok.";
    else if (utokuZaPosledniDen > 1 && utokuZaPosledniDen < 5)
        utokyStats += "rozdány <i>" + utokuZaPosledniDen + "</i> útoky.";
    else
        utokyStats += "rozdáno <i>" + utokuZaPosledniDen + "</i> útoků.";
    
    page.evaluateSingle('tbody/tr[last()]/td[1]', rozdaneTable).innerHTML = '<font size="1">' + utokyStats + '</font>';
    
    // Obrana
    orbanaStats = "Zbývá vrátit <i>" + nevracenoCsek + "</i> ";
    if (nevracenoCsek == 1)
        orbanaStats += "csko.";
    else if (nevracenoCsek > 1 && nevracenoCsek < 5)
        orbanaStats += "cska.";
    else
        orbanaStats += "csek.";
        
    if (prvDoProtu && prvDoProtu > 0) {
        if (prvDoProtu == 1)
            orbanaStats += "<br/>Zbývá <i>1</i> prvoútok do protu.";
        else
            orbanaStats += "<br/>Zbývají <i>" + prvDoProtu + "</i> prvoútoky do protu.";
    }
    
    page.evaluateSingle('tbody/tr[last()]/td[1]', braneneTable).innerHTML = '<font size="1">' + orbanaStats + '</font>';
    
    // Zestihli okraje
    var cells = page.evaluate('tbody/tr/td', rozdaneTable).concat(page.evaluate('tbody/tr/td', braneneTable));
    for (var i = 0; i < cells.length; i++) {
        cells[i].style.borderRight = "0px";
        cells[i].style.borderBottom = "0px";
    }
    
    cells = page.evaluate('tbody/tr[1]/td', rozdaneTable).concat(page.evaluate('tbody/tr[1]/td', braneneTable));
    for (var i = 0; i < cells.length; i++) {
        cells[i].style.borderTop = "0px";
    }
    
    cells = page.evaluate('tbody/tr/td[1]', rozdaneTable).concat(page.evaluate('tbody/tr/td[1]', braneneTable));
    for (var i = 0; i < cells.length; i++) {
        cells[i].style.borderLeft = "0px";
    }
}

function vypis_zpracujTabulku(page, table) {
    var utokyRows = page.evaluate('tbody/tr[position() > 2]', table);
    var utoky = new Array();
    
    for (var i in utokyRows) {
        var idElem = page.evaluateSingle('td[3]/font', utokyRows[i]);
        var id = idElem ? parseInt(idElem.innerHTML) : Number.NaN;

        if (isNaN(id))
            continue;
        
        var eCas = page.evaluateSingle('td[6]/font', utokyRows[i]);
        var eUroven = page.evaluateSingle('td[8]/font', utokyRows[i]);
        
        // Data
        var utok = new Object();
        utok.id = id;
        
        var dobaMinutyMatch = eCas.textContent.match(/(\d+):(\d+)/);
        utok.dobaMinuty = dobaMinutyMatch ? parseInt(dobaMinutyMatch[1]) * 60 + parseInt(dobaMinutyMatch[2]) : Number.NaN;
        
        utok.regent = page.evaluateSingle('td[4]/font', utokyRows[i]).textContent;
        utok.presvedceni = page.evaluateSingle('td[5]/font', utokyRows[i]).textContent;
        utok.uroven = parseFloat(eUroven.textContent);
        utok.typ = page.evaluateSingle('td[9]/font', utokyRows[i]).textContent;
        utok.status = page.evaluateSingle('td[10]/font', utokyRows[i]).textContent;
        
        // Obarvy uroven
        eUroven.style.color = colorByRange(utok.uroven, 125, 50, redGreenColorPicker);
        
        // Linky
        var eId = createActiveId(page, utok.id);
        idElem.innerHTML = '<font size="2"></font>';
        idElem.valign = "middle";
        idElem.childNodes[0].appendChild(eId);
        
        // Nahrad v typu newline mezerou 
        var eTyp = page.evaluateSingle('td[9]/font', utokyRows[i]);
        eTyp.innerHTML = eTyp.innerHTML.replace('<br>', ' ');
        
        // Tooltip kdy vyprsi utok
        var casUtoku = new Date().getTime() - utok.dobaMinuty * 60 * 1000;
        var vyprsi = new Date(casUtoku + 72 * 3600 * 1000);
        vyprsi.setSeconds(0, 0);
        
        eCas.setAttribute("title", "Vyprší: " + vyprsi.toLocaleString());
        
        utoky.push(utok);
    }
    
    return utoky;
}
*/
