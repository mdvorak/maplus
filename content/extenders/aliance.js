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

// Analyza alianci kde sem clenem
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Moje"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];

        if (!typStranky) {
            var table = $X('table[2]', page.content);
            
            if (table != null) {
                var aliConfig = page.config.getRegent().getPrefNode("aliance", true);
                var aliance = new Array();
                aliConfig.clearChildNodes();
            
                for (var i = 0; i < table.rows.length; i++) {
                    var tr = table.rows[i];
                    var nastavit = $X('a[starts-with(@href, "aliance.html") and font = "Nastavit"]', tr.cells[3]);
                    
                    var m = nastavit.href.match(/&aliance=nastavit_(\d+)/);
                    var id = (m != null) ? m[1] : null;
                    
                    // Id nenalezeno, tohle by sice nemelo nastat ale..
                    if (id == null)
                        continue;
                    
                    var jmeno = tr.cells[0].textContent.replace(/\s+$/, "");
                    var presvedceni = tr.cells[2].textContent[0];
                    
                    aliConfig.addPref("id", m[1]);
                    aliance.push(Number(m[1]));
                    
                    // Aktualizuj alianci
                    MaData.aktualizujAlianci(jmeno, id, presvedceni);
                }
                
                console.debug("Jsem clenem alianci: %o", aliance);
            }
            else {
                var nejsemClenem = $X('font[starts-with(., "Momentálně") and contains(., "nejste")]', page.content);
                
                if (nejsemClenem != null) {
                    page.config.getRegent().getPrefNode("aliance", true).clearChildNodes();
                    console.debug("Nejsem clenem zadne aliance.");
                }
            }
        }
    },
    
    process: null
}));

// Analyza seznamu alianci
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Seznam"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (typStranky != "vypis_alianci")
            return false;
        
        var tableAliance = $X('font[2]/table', page.content);
        if (tableAliance == null)
            return false;
        
        for (var i = 2; i < tableAliance.rows.length - 1; i++) {
            var tr = tableAliance.rows[i];
            var aVypis = $X('td[1]/font/a', tr);
            if (aVypis == null)
                continue;
            
            var id = aVypis.getAttribute("href");
            if (id) id = id.match(/&aliance=vypis_clenu_v_ally_(\d+)\b/);
            if (id) id = parseInt(id[1]);
            
            if (id && !isNaN(id)) {
                var jmeno = tr.cells[1].textContent.replace(/\s+$/, "");
                var presvedceni = tr.cells[4].textContent.replace(/\s/g, "")[0];
                
                MaData.aktualizujAlianci(jmeno, id, presvedceni);
            }
        }
        
        MaData.seznamAlianciUpdatovan();
    },
    
    process: null
}));

// Analyza clenu aliance + aktivni id
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Clenove"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("vypis_clenu_v_ally_") != 0)
            return false;
        
        var tableClenove = XPath.evalSingle('table[2]', page.content);
        if (tableClenove == null)
            return false;
        
        var jmenoAliance = XPath.evalString('font/i', page.content);
        var idAliance = page.arguments["aliance"].match(/vypis_clenu_v_ally_(\d+)$/);
        if (idAliance) idAliance = parseInt(idAliance[1]);
        
        if (!jmenoAliance || !idAliance || isNaN(idAliance))
            return false;
            
        // Prvne aktualizuj samotnou ali
        MaData.aktualizujAlianci(jmenoAliance, idAliance, null);
        
        // Zjisti presvedceni
        var aliance = MaData.najdiAlianci(jmenoAliance);
        var presvedceni = (aliance && aliance.presvedceni != "") ? aliance.presvedceni : null;
        
        // Pak ji nastav clenum (a zrus tem co uz tam nejsou)
        var clenovePuvodni = MaData.clenoveAliance(jmenoAliance);
        context.idClenu = new Array();
        
        for (var i = 1; i < tableClenove.rows.length - 2; i++) {
            var tr = tableClenove.rows[i];
            
            var id = parseInt(tr.cells[0].textContent.replace(/\s+$/, ""));
            var regent = tr.cells[1].textContent.replace(/\s+$/, "");
            var provincie = tr.cells[2].textContent.replace(/\s+$/, "");
            
            if (!isNaN(id)) {
                MaData.aktualizujProvincii(id, regent, provincie, null, presvedceni, jmenoAliance);
                clenovePuvodni = clenovePuvodni.without(id);
                
                // Pro aktivni id
                context.idClenu.push({ 
                        id: id,
                        element: tr.cells[0].childNodes[0]
                    });
            }
        }
        
        // Zrus ji provinciim ktere uz tam nejsou
        clenovePuvodni.each(function(id) {
            MaData.aktualizujProvincii(id, null, null, null, null, ZADNA_ALIANCE);
        });
            
        return (context.idClenu.length > 0);
    },
    
    process: function(page, context) {
        // Aktivni id
        context.idClenu.each(function(i) {
            var a = MaPlus.Tooltips.createActiveId(page, i.id)
            
            i.element.innerHTML = "&nbsp;&nbsp;&nbsp;&nbsp;";
            i.element.insertBefore(a, i.element.firstChild);
        });
    }
}));

// Analyza clenu vypisu moji aliance
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Vypis aliance"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("vypsat_") != 0)
            return false;
        
        var table = $X('font[3]/table', page.content);
        if (table == null)
            return false;
        
        // Analyza
        var jmenoAliance = XPath.evalString('font[1]', page.content);
        var idAliance = parseInt(typStranky.match(/(?:vypsat_(\d+))?/)[1]);
        
        if (jmenoAliance == null || jmenoAliance.blank())
            return false;
        
        // Uloz id aliance
        if (!isNaN(idAliance)) {
            MaData.aktualizujAlianci(jmenoAliance, idAliance, null);
        }
        
        // Ignoruj tajnou
        var tajna = MaData.najdiAlianci(jmenoAliance).tajna;
        if (tajna) {
            jmenoAliance = null;
            idAliance = null;
        }
        
        // Zkus ziskat svoje presvedceni
        var presvedceni = null;
        var provincie = MaData.najdiProvincii(page.id);
        if (provincie != null) {
            presvedceni = provincie.presvedceni;
        }
        
        // Projdi cleny
        var clenovePuvodni = MaData.clenoveAliance(jmenoAliance);
        context.idClenu = new Array();
        
        for (var i = 0; i < table.rows.length; i++) {
            var tr = table.rows[i];
            
            var id = parseInt(tr.cells[0].textContent);
            var regent = tr.cells[1].textContent.replace(/\s+$/, "");
            var provincie = tr.cells[2].textContent.replace(/\s+$/, "");
            
            if (isNaN(id))
                continue;
            
            clenovePuvodni = clenovePuvodni.without(id);
            MaData.aktualizujProvincii(id, regent, provincie, null, presvedceni, jmenoAliance);
            
            // Pro aktivni id
            context.idClenu.push({ element: tr.cells[0], id: id});
        }
        
        // Zrus ji provinciim ktere uz tam nejsou
        clenovePuvodni.each(function(id) {
            MaData.aktualizujProvincii(id, null, null, null, null, ZADNA_ALIANCE);
        });
        
        context.table = table;
        return true;
    },
    
    process: function(page, context) {
        // Aktivni id
        context.idClenu.each(function(i) {
            var a = MaPlus.Tooltips.createActiveId(page, i.id)
            a.innerHTML = '<span>' + i.id + '</span>';
            
            i.element.innerHTML = "<span>&nbsp;&nbsp;</span>";
            i.element.insertBefore(a, i.element.firstChild);
        });
    }
}));

// TODO rozdelit tohle na Hromadne zpravy a analyzu samotnou
// Hromadne zpravy - Nastaveni aliance
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Nastaveni"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("nastavit_") != 0)
            return false;
        
        // Zjisit jaka aliance to je
        var jmenoAliance = null;
        var presvedceni = null;
        var idAliance = parseInt(typStranky.match(/(?:nastavit_(\d+))?/)[1]);
        
        if (!isNaN(idAliance)) {
            var aliance = MaData.najdiAlianci(null, idAliance);
            
            // Ignoruj tajnou
            if (aliance && !aliance.tajna) {
                jmenoAliance = aliance.jmeno;
                presvedceni = aliance.presvedceni;
            }
            
            // Zkuz najit presvedceni pokud ho nema aliance
            if (presvedceni == null) {
                var provincie = MaData.najdiProvincii(page.id);
                if (provincie != null)
                    presvedceni = provincie.presvedceni;
            }
        }
        
        // Analyza
        var clenovePuvodni = MaData.clenoveAliance(jmenoAliance);
        context.clenove = new Array();
        
        // Vytvor seznam radku se clenama
        var rows = $XL('table[2]/tbody/tr[position() > 1 and count(td) >= 7]', page.content);
        rows.each(function(tr) {
            var link = $X('td[3]/font/a', tr);
            var id = parseInt(link.textContent);
            if (isNaN(id))
                return; // continue;

            context.clenove.push({element: tr, id: id, link: link});
            
            // Analyza radku
            var regent = tr.cells[3].textContent.replace(/\s+$/, "");
            var provincie = tr.cells[4].textContent.replace(/\s+$/, "");
            var povolani = tr.cells[5].textContent.replace(/\s+$/, "");
            
            clenovePuvodni = clenovePuvodni.without(id);
            MaData.aktualizujProvincii(id, regent, provincie, povolani, presvedceni, jmenoAliance);
        });
        
        // Zrus ji provinciim ktere uz tam nejsou
        clenovePuvodni.each(function(id) {
            MaData.aktualizujProvincii(id, null, null, null, null, ZADNA_ALIANCE);
        });
        
        // Nepokracuj pokud nenalezeny zadni clenove
        if (context.clenove.length == 0)
            return false;
        
        context.tbody = context.clenove[0].element.parentNode;
        context.trComment = $X('table[2]/tbody/tr[last() - 1]', page.content);
        return true;
    },
    
    process: function(page, context) {
        var checks = new Array();
    
        // Pridej checkboxy k jednotlivym clenum
        context.clenove.each(function(row) {
            var fontId = row.link.parentNode;
            var tdJmeno = row.element.cells[3];
        
            // Napsat checkbox
            var check = Element.create("input", null, {type: "checkbox", style: "margin-top: 0px; margin-bottom: 1px"});
            tdJmeno.insertBefore(check, tdJmeno.firstChild);
            checks.push({element: check, id: row.id});
            
            // Aktivni id
            var idLink = MaPlus.Tooltips.createActiveId(page, row.id);
            fontId.replaceChild(idLink, row.link);
            row.link = idLink;
        });
        
        // Novy radek
        var tr = context.tbody.insertBefore(Element.create("tr"), context.trComment);
        tr.appendChild(Element.create("td", null, {colspan: 3}));
        
        var spanNapsat = tr.appendChild(Element.create("td", null, {colspan: 4}))
                           .appendChild(Element.create("span"));
        
        // Pridej Napsat vsem checkbox
        var checkNapsatVsem = spanNapsat.appendChild(Element.create("input", null, {type: "checkbox", style: "margin-top: 0px; margin-bottom: 1px"}));
        Event.observe(checkNapsatVsem, 'change', function() {
            var v = checkNapsatVsem.checked;
            checks.each(function(i) { i.element.checked = v; });
        });
        
        spanNapsat.appendChild(document.createTextNode(" "));
        
        // Pridej Napsat oznacenym link
        var linkNapsatOznacenym = spanNapsat.appendChild(Element.create("a", '<span>Napsat označeným</span>', {href: "#"}));
        Event.observe(linkNapsatOznacenym, 'click', function(event) {
            var ids = new Array();
            checks.each(function(i) {
                if (i.element.checked)
                    ids.push(i.id);
            });
            
            // Redirect
            document.location.href = MaPlus.buildUrl(page, "posta.html", {posta: "napsat", komu: ids.join(",")});
            event.returnValue = true;
        });
    }
}));
