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
            if (jednotkyRows[i].cells.length < 10 || jednotkyRows[i].cells[0].textContent == "Jednotka")
                continue;
            
            var row = ElementDataStore.get(jednotkyRows[i]);
            
            // Najdi bunky
            row.cells = {
                jmeno: jednotkyRows[i].cells[0],
                zkusenost: jednotkyRows[i].cells[1],
                phb: jednotkyRows[i].cells[2],
                druh: jednotkyRows[i].cells[3],
                typ: jednotkyRows[i].cells[4],
                sila: jednotkyRows[i].cells[5],
                pocet: jednotkyRows[i].cells[6],
                zlata: jednotkyRows[i].cells[7],
                many: jednotkyRows[i].cells[8],
                pop: jednotkyRows[i].cells[9]
            };
            
            // Vytvor informace o jednotce
            row.data = {
                jmeno: row.cells.jmeno.textContent,
                zkusenost: parseFloat(row.cells.zkusenost.textContent),
                phb: parseInt(row.cells.phb.textContent),
                druh: row.cells.druh.textContent,
                typ: row.cells.typ.textContent,
                sila: parseInt(row.cells.sila.textContent),
                pocet: parseInt(row.cells.pocet.textContent),
                zlata: parseFloat(row.cells.zlata.textContent),
                many: parseFloat(row.cells.many.textContent),
                pop: parseFloat(row.cells.pop.textContent)
            };
            
            row.data.cenaZaSilu = -parseFloat(row.data.zlata) / row.data.sila * 1000
            row.data.maxSila = Math.floor(100 * row.data.sila / row.data.zkusenost);
            
            jednotky.push(row);
            console.log("Stack jmeno=%s zkusenost=%f\% phb=%d druh=%s typ=%s sila=%d pocet=%d zlata=%d many=%d pop=%d", row.data.jmeno, row.data.zkusenost, row.data.phb, row.data.druh, row.data.typ, row.data.sila, row.data.pocet, row.data.zlata, row.data.many, row.data.pop);
        }
        
        page.hospodarstvi.jednotky = jednotky;
        console.debug("Pocet stacku: %d", jednotky.length);
        
        return true;
    },

    process: function(page, context) {
        // Pridani tooltipu s max silou stacku
        page.hospodarstvi.jednotky.each(function(row) {
            row.cells.sila.setAttribute("title", "Max síla stacku: " + row.data.maxSila);
        }); 
    }
}));


// Pomer farem
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


// Barvy
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

// Aktivni jednotky
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

// Sirka tabulky
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

// Slozeni armady
pageExtenders.add(PageExtender.create({
    getName: function() { return "Hospodarstvi - Slozeni armady"; },

    analyze: function(page, context) {
        if (page.hospodarstvi == null || page.hospodarstvi.jednotky.length == 0)
            return false;
        
        context.zobrazPred = $X('br[last()]', page.content);
        if (context.zobrazPred == null)
            return false;
        
        return true;
    },

    process: function(page, context) {
        var createDialog = this._createDialog.bind(this);
        
        var linkZobrazit = Element.create("a", '<span>Složení Armády</span>', {href: "javascript://"});
        Event.observe(linkZobrazit, "click", function(event) {
            // Vytvor dialog
            if (context.dialog == null) {
                context.dialog = createDialog(page.hospodarstvi.jednotky);
            }
            
            // Zobraz dialog
            context.dialog.show();
        });
        
        // Zobraz link
        page.content.insertBefore(linkZobrazit, context.zobrazPred);
    },
    
    _createDialog: function(jednotky) {
        var slozeni = {
            celkem: 0,
            
            pb1: 0,
            pb2: 0,
            pb3: 0,
            lb1: 0,
            lb2: 0,
            lb3: 0,
            ps: 0,
            ls: 0
        };
        
        var poradi = new Array();
        
        // Spocitej slozeni
        jednotky.each(function(jednotka) {
            var parametry = Jednotky.vyhledej(jednotka.data.jmeno);
            if (parametry == null)
                return; // continue;
            
            var oznaceni = String(parametry.druh[0] + parametry.typ[0]).toLowerCase();
            if (parametry.typ == "Boj.")
                oznaceni += parametry.phb;
            
            slozeni.celkem += jednotka.data.sila;
            slozeni[oznaceni] += jednotka.data.sila;
            
            poradi.push(parametry);
        });
        
        poradi.sort(function(a, b) { return b.realIni - a.realIni; });
        
        // Vytvor dialog
        var dialog = new SlozeniArmadyDialog(slozeni, poradi);
        return dialog;
    }
}));


var SlozeniArmadyDialog = Class.inherit(Dialog);
Object.extend(SlozeniArmadyDialog.prototype, {
    initialize: function(slozeni, poradi) {
        this._slozeni = slozeni;
        this._poradi = poradi;
    },
    
    _createContentElement: function() {
        var dialog = this;
        var s = this._slozeni;
        
        var html = Chrome.loadText("html/slozeniarmady.html");
        var root = Element.create("div", html, {class: "dialog"});
        
        // Zobraz data
        var format = function(value) {
            return (100 * value / s.celkem).toFixed(2) + "%";
        };
        var remove = function(rowId) {
            var tr = $X('.//tr[@id = "' + rowId + '"]', root);
            tr.parentNode.removeChild(tr);
        };
        
        $X('.//span[@id = "d_bojove"]', root).innerHTML = format(s.pb1 + s.pb2 + s.pb3 + s.lb1 + s.lb2 + s.lb3);
        $X('.//span[@id = "d_strelecke"]', root).innerHTML = format(s.ps + s.ls);
        $X('.//span[@id = "d_pozemni"]', root).innerHTML = format(s.pb1 + s.pb2 + s.pb3 + s.ps);
        $X('.//span[@id = "d_letecke"]', root).innerHTML = format(s.lb1 + s.lb2 + s.lb3 + s.ls);
        
        // Strelci
        if (s.ps + s.ls > 0) {
            $X('.//span[@id = "d_ps"]', root).innerHTML = format(s.ps);
            $X('.//span[@id = "d_ls"]', root).innerHTML = format(s.ls);
        }
        else {
            remove("d_str_row");
        }
        // Phb 1
        if (s.pb1 + s.lb1 > 0) {
            $X('.//span[@id = "d_pb1"]', root).innerHTML = format(s.pb1);
            $X('.//span[@id = "d_lb1"]', root).innerHTML = format(s.lb1);
        }
        else {
            remove("d_phb1_row");
        }
        // Phb 2
        if (s.pb2 + s.lb2 > 0) {
            $X('.//span[@id = "d_pb2"]', root).innerHTML = format(s.pb2);
            $X('.//span[@id = "d_lb2"]', root).innerHTML = format(s.lb2);
        }
        else {
            remove("d_phb2_row");
        }
        // Phb 3
        if (s.pb3 + s.lb3 > 0) {
            $X('.//span[@id = "d_pb3"]', root).innerHTML = format(s.pb3);
            $X('.//span[@id = "d_lb3"]', root).innerHTML = format(s.lb3);
        }
        else {
            remove("d_phb3_row");
        }
        
        // Poradi utoku
        var tbodyPoradiUtoku = $X('.//tbody[@id = "d_poradiUtoku"]', root);
        this._poradi.each(function(i) {
            var tr = Element.create("tr");
            tr.appendChild(Element.create("td", '<span>' + i.jmeno + '\xA0\xA0</span>'));
            tr.appendChild(Element.create("td", '<span>' + i.realIni + '\xA0\xA0</span>'));
            
            tbodyPoradiUtoku.appendChild(tr);
        });
        
        // Zavrit event handler
        var inputZavrit = $X('.//input[@id = "d_zavrit"]', root);
        Event.observe(inputZavrit, "click", function(event) {
            dialog.hide();
        });
        
        return root;
    }
});
