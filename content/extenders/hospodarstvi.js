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
        page.hospodarstvi = {
            tableStavby: $X('table[1]', page.content),
            tableJednotky: $X('table[2]', page.content),
            tablePrijem: $X('table[3]', page.content),
        };
        
        if (!page.hospodarstvi.tableStavby 
                || !page.hospodarstvi.tableJednotky 
                || !page.hospodarstvi.tablePrijem) {
            return false;
        }
        
        var jednotkyRows = page.hospodarstvi.tableJednotky.rows;
        if (jednotkyRows.length < 2)
            return false;
            
        var trJednotkyCelkem = jednotkyRows[jednotkyRows.length - 1];
        
        var jednotky = new Array();
        
        jednotky.silaCelkem = parseInt(XPath.evalString('td[3]/font', trJednotkyCelkem));
        jednotky.pocetCelkem = parseInt(XPath.evalString('td[4]/font', trJednotkyCelkem));
        jednotky.zlataCelkem = parseFloat(XPath.evalString('td[5]/font', trJednotkyCelkem));
        jednotky.manyCelkem = parseFloat(XPath.evalString('td[6]/font', trJednotkyCelkem));
        jednotky.popCelkem = parseFloat(XPath.evalString('td[7]/font', trJednotkyCelkem));
        
        console.debug("Jednotky za tah: sila=%d pocet=%d zlata=%f many=%f pop=%f", jednotky.silaCelkem, jednotky.pocetCelkem, jednotky.zlataCelkem, jednotky.manyCelkem, jednotky.popCelkem);
        
        for (var i = 1; i < jednotkyRows.length; i++) {
            if (jednotkyRows[i].cells.length < 10)
                continue;
            
            // Najdi bunky
            jednotkyRows[i].cells.jmeno = jednotkyRows[i].cells[0];
            jednotkyRows[i].cells.zkusenost = jednotkyRows[i].cells[1];
            jednotkyRows[i].cells.phb = jednotkyRows[i].cells[2];
            jednotkyRows[i].cells.druh = jednotkyRows[i].cells[3];
            jednotkyRows[i].cells.typ = jednotkyRows[i].cells[4];
            jednotkyRows[i].cells.sila = jednotkyRows[i].cells[5];
            jednotkyRows[i].cells.pocet = jednotkyRows[i].cells[6];
            jednotkyRows[i].cells.zlata = jednotkyRows[i].cells[7];
            jednotkyRows[i].cells.many = jednotkyRows[i].cells[8];
            jednotkyRows[i].cells.pop = jednotkyRows[i].cells[9];
            
            // Vytvor informace o jednotce
            jednotkyRows[i].data = {
                jmeno: jednotkyRows[i].cells.jmeno.textContent,
                zkusenost: parseFloat(jednotkyRows[i].cells.zkusenost.textContent),
                phb: parseInt(jednotkyRows[i].cells.phb.textContent),
                druh: jednotkyRows[i].cells.druh.textContent,
                typ: jednotkyRows[i].cells.typ.textContent,
                sila: parseInt(jednotkyRows[i].cells.zlata.textContent),
                pocet: parseInt(jednotkyRows[i].cells.zlata.textContent),
                zlata: parseFloat(jednotkyRows[i].cells.zlata.textContent),
                many: parseFloat(jednotkyRows[i].cells.many.textContent),
                pop: parseFloat(jednotkyRows[i].cells.pop.textContent),
            };
            
            jednotkyRows[i].data.cenaZaSilu = -parseFloat(jednotkyRows[i].data.zlata) / jednotkyRows[i].data.sila * 1000
            
            jednotky.push(jednotkyRows[i]);
        }
        
        page.hospodarstvi.jednotky = jednotky;
        console.debug("Pocet stacku: %d", jednotky.length);
        
        return true;
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
        new Insertion.After(page.hospodarstvi.tableStavby.rows[3], html);
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Hospodarstvi - Barvy"; },

    analyze: function(page, context) {
        if (!page.hospodarstvi)
            return false;
            
        if (!page.config.getBarevnyText())
            return false;
    
        context.zaTah = {
            tdZlata: $X('tbody/tr[5]/td[2]', page.hospodarstvi.tablePrijem),
            tdMany: $X('tbody/tr[5]/td[3]', page.hospodarstvi.tablePrijem),
            tdPop: $X('tbody/tr[5]/td[4]', page.hospodarstvi.tablePrijem)
        };
        
        if (!context.zaTah.tdZlata || !context.zaTah.tdMany || !context.zaTah.tdPop)
            return false;
        
        context.zaTah.zlata = parseFloat(context.zaTah.tdZlata.textContent);
        context.zaTah.many = parseFloat(context.zaTah.tdMany.textContent);
        context.zaTah.pop = parseFloat(context.zaTah.tdPop.textContent);
    
        return true;
    },

    process: function(page, context) {
        // Obarvy jednotky
        var jednotky = page.hospodarstvi.jednotky;
        
        jednotky.each(function(r) {
                r.cells.zkusenost.style.color = Color.fromRange(r.data.zkusenost / 100, 0.30, 0.95, Color.Pickers.redGreen);
                r.cells.druh.className = (r.data.druh == "Let." ? "druhLet" : "druhPoz");
                r.cells.typ.className = (r.data.typ == "Str." ? "typStr" : "typBoj");
                
                var zlataKoef = r.data.zlata / (jednotky.zlataCelkem / jednotky.length);
                var manyKoef = r.data.many / (jednotky.manyCelkem / jednotky.length);
                var popKoef = r.data.pop / (jednotky.popCelkem / jednotky.length);
                
                r.cells.zlata.style.color = Color.fromRange(zlataKoef, 0.2, 2.0, Color.Pickers.grayGold);
                r.cells.many.style.color = Color.fromRange(manyKoef, 2.0, 0.2, Color.Pickers.blueWhite);
                r.cells.pop.style.color = Color.fromRange(popKoef, 2.0, 0.2, Color.Pickers.grayBrown);
                
                r.cells.phb.className = "phb" + r.data.phb;
            });
            
        // Zcervenej zaporne zisky
        if (context.zaTah.zlata < 0)
            context.zaTah.tdZlata.style.color = "red";
        if (context.zaTah.many < 0)
            context.zaTah.tdMany.style.color = "red";
        if (context.zaTah.pop < 0)
            context.zaTah.tdPop.style.color = "red";
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Hospodarstvi - Jednotky"; },

    analyze: function(page, context) {
        return page.hospodarstvi && page.hospodarstvi.jednotky.length > 0;
    },

    process: function(page, context) {
        page.hospodarstvi.jednotky.each(function(r) {
                var link = MaPlus.Tooltips.createActiveUnit(page, r.data.jmeno);
                if (link) {
                    var font = r.cells.jmeno.firstChild;
                    font.replaceChild(link, font.firstChild);
                    // Pokud to tam je tak to nesezere savannah
                    // font.insertBefore(document.createTextNode("\xA0"), font.firstChild);
                }
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
