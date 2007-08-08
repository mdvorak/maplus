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
    getName: function() { return "Hospodarstvi - Analyza"; },

    analyze: function(page, context) {
        var hospodarstvi = {
            tableStavby: $X('table[1]', page.content),
            tableJednotky: $X('table[2]', page.content),
            tablePrijem: $X('table[3]', page.content),
        };
        
        if (!hospodarstvi.tableStavby || !hospodarstvi.tableJednotky || !hospodarstvi.tablePrijem)
            return false;
        
        page.hospodarstvi = hospodarstvi;
    },

    process: null
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Hospodarstvi - Pomer farem"; },

    analyze: function(page, context) {
        if (!page.hospodarstvi)
            return false;
    
        // Pomer farmy/mesta
        var farmyPocet = parseInt(XPath.evalString('tbody/tr[3]/td[2]/font', page.hospodarstvi.tableStavby));
        var mestaPocet = parseInt(XPath.evalString('tbody/tr[4]/td[2]/font', page.hospodarstvi.tableStavby));
        context.pomer = farmyPocet / mestaPocet;
        
        console.debug("farmy=%d, mesta=%d, pomer=%f", farmyPocet, mestaPocet, context.pomer);
        return !isNaN(context.pomer);
    },

    process: function(page, context) {
        var html = '<tr bgcolor="#303030"><td><span>Farem na město</span></td><td align="center"><span>' + context.pomer.toFixed(1) + '</span></td><td colspan="2"/><tr>';
        new Insertion.After(page.hospodarstvi.tableStavby.rows[4], html);
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Hospodarstvi - Barvy"; },

    analyze: function(page, context) {
        if (!page.hospodarstvi)
            return false;
    
        var rows = page.hospodarstvi.tableJednotky.rows;
        
        context.trCelkem = rows[rows.length - 1];
        
        context.pocetJednotek = rows.length - 2;
        if (context.pocetJednotek == 0)
            return false;
        
        context.zlataCelkem = parseFloat(XPath.evalString('td[5]/font', context.trCelkem));
        context.manyCelkem = parseFloat(XPath.evalString('td[6]/font', context.trCelkem));
        context.popCelkem = parseFloat(XPath.evalString('td[7]/font', context.trCelkem));
        
        context.jednotky = new Array();
        
        for (var i = 0; i < rows.length; i++) {
            if (rows[i].cells.length < 10)
                continue;
                
            rows[i].cells.zkusenost = rows[i].cells[1];
            rows[i].cells.druh = rows[i].cells[3];
            rows[i].cells.typ = rows[i].cells[4];
            
            rows[i].cells.zlata = rows[i].cells[7];
            rows[i].cells.many = rows[i].cells[8];
            rows[i].cells.pop = rows[i].cells[9];
            
            rows[i].data = {
                zkusenost: parseFloat(rows[i].cells.zkusenost.textContent),
                druh: rows[i].cells.druh.textContent,
                typ: rows[i].cells.typ.textContent,
                
                zlata: parseFloat(rows[i].cells.zlata.textContent),
                many: parseFloat(rows[i].cells.many.textContent),
                pop: parseFloat(rows[i].cells.pop.textContent)
            };
            
            context.jednotky.push(rows[i]);
        }
        
        return context.jednotky.length > 0;
    },

    process: function(page, context) {
        var rows = page.hospodarstvi.tableJednotky.rows;
        
        context.jednotky.each(function(r) {
                r.cells.zkusenost.style.color = Color.fromRange(r.data.zkusenost / 100, 0.30, 0.95, Color.Pickers.redGreen);
                r.cells.druh.className = (r.data.druh == "Let." ? "druhLet" : "druhPoz");
                r.cells.typ.className = (r.data.typ == "Str." ? "typStr" : "typBoj");
                
                var zlataKoef = r.data.zlata / (context.zlataCelkem / context.pocetJednotek);
                var manyKoef = r.data.many / (context.manyCelkem / context.pocetJednotek);
                var popKoef = r.data.pop / (context.popCelkem / context.pocetJednotek);
                
                r.cells.zlata.style.color = Color.fromRange(zlataKoef, 0.2, 2.0, Color.Pickers.grayGold);
                r.cells.many.style.color = Color.fromRange(manyKoef, 2.0, 0.2, Color.Pickers.blueWhite);
                r.cells.pop.style.color = Color.fromRange(popKoef, 2.0, 0.2, Color.Pickers.whiteBrown);
            });
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Hospodarstvi - Sirka tabulek"; },

    analyze: function(page, context) {
        return (page.hospodarstvi != null);
    },

    process: function(page, context) {
        // Aby se dali lip oznacovat jednotky
        page.leftMenu.width = "17%";
        page.rightMenu.width = "17%";
        page.content.width = "67%";
        
        page.hospodarstvi.tableStavby.width = "98%";
        page.hospodarstvi.tableJednotky.width = "98%";
        page.hospodarstvi.tablePrijem.width = "98%";
    }
}));

/*

function status_process(page) {
    var tableStavby = page.evaluateSingle('table[1]', page.content);
    var tableJednotky = page.evaluateSingle('table[2]', page.content);
    var tablePrijem = page.evaluateSingle('table[3]', page.content);
    
    if (!tableStavby || !tableJednotky || !tablePrijem)
        return;
        
    // Aby se dali lip oznacovat jednotky
    page.leftMenu.width = "17%";
    page.rightMenu.width = "17%";
    page.content.width = "67%";
    
    tableStavby.width = "98%";
    tableJednotky.width = "98%";
    tablePrijem.width = "98%";
    
    // Pomer farmy/mesta
    var farmyPocet = parseInt(page.evaluateString('tbody/tr[3]/td[2]/font', tableStavby));
    var mestaPocet = parseInt(page.evaluateString('tbody/tr[4]/td[2]/font', tableStavby));
    var pomer = farmyPocet / mestaPocet;
    
    if (!isNaN(pomer)) {
        var html = '<td><font size="2">Farem na město</font></td><td align="center"><font size="2">' + pomer.toFixed(1) + '</font></td><td colspan="2"/>';
        var row = page.addElementByXPath(tableStavby, 'tbody', "tr", "", 'tbody/tr[5]', [["bgcolor", "#303030"]]);
        row.innerHTML = html;
    }
    
    // Obravit ceny jednotek
    var jednotkyRows = page.evaluate('tbody/tr', tableJednotky);
    var celkemRow = jednotkyRows[jednotkyRows.length - 1];
    
    var jednotek = jednotkyRows.length - 2;
    var zlataCelkem = parseFloat(page.evaluateSingle('td[5]/font', celkemRow).textContent);
    var manyCelkem = parseFloat(page.evaluateSingle('td[6]/font', celkemRow).textContent);
    var popCelkem = parseFloat(page.evaluateSingle('td[7]/font', celkemRow).textContent);
    
    for (var i in jednotkyRows) {
        if (page.evaluateNumber('count(td)', jednotkyRows[i]) < 10)
            continue;
            
        // Aktivni jednotka
        var eJednotka = page.evaluateSingle('td[1]/font', jednotkyRows[i]);
        
        var eTooltip = createActiveUnit(page, eJednotka.textContent);
        if (eTooltip) {
            eJednotka.replaceChild(eTooltip, eJednotka.firstChild);
        }
    
        // Obarvy zkusenost a druh
        var zkusenostElem = page.evaluateSingle('td[2]/font', jednotkyRows[i]);
        var druhElem = page.evaluateSingle('td[4]/font', jednotkyRows[i]);
        var typElem = page.evaluateSingle('td[5]/font', jednotkyRows[i]);
        
        zkusenostElem.style.color = colorByRange(parseFloat(zkusenostElem.textContent) / 100, 0.30, 0.95, redGreenColorPicker);
        
        if (druhElem.textContent == "Let.")
            druhElem.className = "druhLet";
        else
            druhElem.className = "druhPoz";
            
        if (typElem.textContent == "Str.")
            typElem.className = "typStr";
        else
            typElem.className = "typBoj";
            
        // Obarvy vydaje
        var zlataElem = page.evaluateSingle('td[8]/font', jednotkyRows[i]);
        var manyElem = page.evaluateSingle('td[9]/font', jednotkyRows[i]);
        var popElem = page.evaluateSingle('td[10]/font', jednotkyRows[i]);
        
        var zlatoKoef = parseFloat(zlataElem.textContent) / (zlataCelkem / jednotek);
        zlataElem.style.color = colorByRange(zlatoKoef, 0.2, 2.0, grayGoldColorPicker);
        
        var manaKoef = parseFloat(manyElem.textContent) / (manyCelkem / jednotek);
        manyElem.style.color = colorByRange(manaKoef, 2.0, 0.2, blueWhiteColorPicker);
        
        var popKoef = parseFloat(popElem.textContent) / (popCelkem / jednotek);
        popElem.style.color = colorByRange(popKoef, 2.0, 0.2,
            function (colors) {
                // Color picker 
                colors.red = Math.max(167, Math.min(240, 240 * colors.koeficient));
                colors.green = Math.max(118, Math.min(240, 240 * colors.koeficient));
                colors.blue = Math.max(109, Math.min(240, 240 * colors.koeficient)); 
            });
            
        // Cena za 1 sily
        
       // var sila = parseFloat(page.evaluateSingle('td[6]/font', jednotkyRows[i]).textContent);
       // var cenaZaTisicSily = -parseFloat(zlataElem.textContent) / sila * 1000;
        
     //   var cenaZaSileElem = page.addElement(jednotkyRows[i], "td", '<font size="2">' + cenaZaTisicSily.toFixed(1) + '</font>');
     //   cenaZaSileElem.style.color = colorByRange(cenaZaTisicSily, 125, 30, redGreenColorPicker);
        
    }
    
    // Zcervenej zaporne zisky
    var zlataZaTahElem = page.evaluateSingle('tbody/tr[5]/td[2]/font', tablePrijem);
    var manyZaTahElem = page.evaluateSingle('tbody/tr[5]/td[3]/font', tablePrijem);
    var popZaTahElem = page.evaluateSingle('tbody/tr[5]/td[4]/font', tablePrijem);
    
    if (parseFloat(zlataZaTahElem.textContent) < 0)
        zlataZaTahElem.style.color = 'red';
    if (parseFloat(manyZaTahElem.textContent) < 0)
        manyZaTahElem.style.color = 'red';
    if (parseFloat(popZaTahElem.textContent) < 0)
        popZaTahElem.style.color = 'red';
}
*/
