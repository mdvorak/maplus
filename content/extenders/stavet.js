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
    getName: function() { return "Stavet - Rozsireni"; },

    analyze: function(page, context) {
        if (page.arguments["akce"] != "stavet" || XPath.evalString('b[1]', page.content) != "Tyto stavby můžete nyní zadat stavitelům ke stavění")
            return false;
            
        var table = $X('table[1]', page.content);
        var form = $X('.//form[@action = "stavet.html"]', page.content);
        var selectBudova = $X('.//select[@name = "budova"]', form);
        var inputKolik = $X('.//input[@name = "kolik"]', form);
        
        if (table == null || selectBudova == null || inputKolik == null)
            return;
        
        // Vytvor seznam budov ktere jsou k dispozici
        var budovy = new Hash();
        
        for (var i = 2; i < table.rows.length - 1; i++) {
            var tr = table.rows[i];
            if (tr.cells.length < 8)
                continue;
            
            var data = ElementDataStore.get(tr);
            
            Object.extend(data, {
                jmeno: tr.cells[0].textContent.replace(/\s+$/, ""),
                zlata: parseInt(tr.cells[3].textContent),
                many: parseInt(tr.cells[4].textContent),
                pop: parseInt(tr.cells[5].textContent),
                haru: parseInt(tr.cells[6].textContent),
                tahu: parseFloat(tr.cells[7].textContent)
            });
            
            budovy[data.jmeno] = data;
        }
        
        // Projdi select a prirad id budovam
        var textRegex = /^(.*?)\s+\((\w+)\)\s*$/;
        for (var i = 0; i < selectBudova.options.length; i++) {
            var o = selectBudova.options[i];
            
            // Analyzuj popisek budovy
            var m = o.text.match(textRegex);
            if (m == null)
                continue;
                
            var jmeno = m[1];
            var data = budovy[jmeno];
            
            if (data == null) {
                console.warn("Nenalezen radek pro budovu %o.", jmeno);
                continue;
            }
            
            data.id = o.value;          
            
            data.maxPocet = parseInt(m[2]);
            // Pokud je max neomezene, nastav nekonecno
            if (isNaN(data.maxPocet))
                data.maxPocet = Number.POSITIVE_INFINITY;
            
            // Spocitej pocet, ktery si muzu dovolit
            data.pocet = data.maxPocet;
            if (page.provincie != null) {
                if (data.haru > 0)
                    data.pocet = Math.min(data.pocet, Math.floor(page.provincie.volnych / data.haru));
                if (data.zlata > 0)
                    data.pocet = Math.min(data.pocet, Math.floor(page.provincie.zlato / data.zlata));
                if (data.many > 0)
                    data.pocet = Math.min(data.pocet, Math.floor(page.provincie.mana / data.many));
                if (data.pop > 0)
                    data.pocet = Math.min(data.pocet, Math.floor(page.provincie.populace / data.pop));
            }
            
            console.debug("%s: id=%d, pocet=%d", data.jmeno, data.id, data.pocet);
        }
        
        context.table = table;
        context.form = form;
        context.selectBudova = selectBudova;
        context.inputKolik = inputKolik;
        
        if (page.config.getBarevnyText()) {
            context.plusText = '<img src="' + CHROME_CONTENT_URL + 'html/img/plus.png" class="link" alt="" />';
            context.plusplusText = '<img src="' + CHROME_CONTENT_URL + 'html/img/plusplus.png" class="link" alt="" />';
            context.vseText = '<img src="' + CHROME_CONTENT_URL + 'html/img/vse.png" class="link" alt="" />';
        }
        else {
            context.plusText = "+";
            context.plusplusText = "++";
            context.vseText = "*";
        }
        
        return budovy.size() > 0;
    },

    process: function(page, context) {
        var pridejSloupec = this._pridejSloupec;
    
        var table = context.table;
        var form = context.form;
        var selectBudova = context.selectBudova;
        var inputKolik = context.inputKolik;
        
        const NOVYCH_SLOUPCU = 4;
        
        var columns = table.rows[2].cells.length + NOVYCH_SLOUPCU;
    
        // Pridej nove sloupce do hlavicky
        table.rows[1].appendChild(Element.create("td", '<span>&nbsp;</span>', {colspan: NOVYCH_SLOUPCU}));
    
        for (let i = 2; i < table.rows.length - 1; i++) {
            let data = ElementDataStore.get(table.rows[i]);
            
            if (isNaN(data.id)) {
                // Radky s popiskem
                if (data.element.cells.length == 1) {
                    data.element.cells[0].setAttribute("colspan", columns);
                }
                continue;
            }
            
            // Vybrat
            var linkVybrat = Element.create("a", '<span>' + data.jmeno + '</span>', {href: "javascript://", class: "idlink"});
            Event.observe(linkVybrat, "click", function() {
                if (selectBudova.value != data.id) {
                    selectBudova.value = data.id;
                    inputKolik.value = 1;
                }
                inputKolik.select();
            });
            data.element.cells[0].innerHTML = '<span>&nbsp;&nbsp;</span>';
            data.element.cells[0].insertBefore(linkVybrat, data.element.cells[0].firstChild);
            
            // Pridat na poctu
            let multiplier = (data.maxPocet < Number.POSITIVE_INFINITY) ? 1 : 10;
            
            let vybratCallback = function(kolik) {
                if (selectBudova.value != data.id) {
                    selectBudova.value = data.id;
                    inputKolik.value = kolik;
                }
                else {
                    let pocet = parseInt(inputKolik.value);
                    if (!isNaN(pocet))
                        kolik += pocet;
                }
                inputKolik.value = Math.min(kolik, data.pocet);
                context.inputKolik.select();
            };
            
            var linkPlus = Element.create("a", context.plusText, {href: "javascript://"});
            var linkPlusPlus = Element.create("a", context.plusplusText, {href: "javascript://"});
            
            Event.observe(linkPlus, "click", function() { vybratCallback(1 * multiplier); });
            Event.observe(linkPlusPlus, "click", function() { vybratCallback(5 * multiplier); });
            
            pridejSloupec(data.element, linkPlus).style.width = 15;
            pridejSloupec(data.element, linkPlusPlus).style.width = 15;
            
            // Vse
            var linkVse = Element.create("a", context.vseText, {href: "javascript://"});
            Event.observe(linkVse, "click", function() { vybratCallback(Number.POSITIVE_INFINITY); });
            pridejSloupec(data.element, linkVse).style.width = 15;
            
            pridejSloupec(data.element, Element.create("span", "\xA0(" + data.pocet + ")", {class: "small"}));
        }
        
        table.rows[0].cells[1].setAttribute("colspan", columns - 2);
        table.rows[table.rows.length - 1].cells[1].setAttribute("colspan", columns - 2);
    },
    
    _pridejSloupec: function(tr, innerElement) {
        var td = Element.create("td");
        var span = Element.create("span");
        
        span.appendChild(innerElement);
        td.appendChild(span);
        tr.appendChild(td);
        
        return td;
    }
}));
