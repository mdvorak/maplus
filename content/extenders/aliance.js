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
            var nastavit = $XL('.//a[starts-with(@href, "aliance.html") and font = "Nastavit"]', page.content);
            
            if (nastavit.length > 0) {
                var aliConfig = page.config.getRegent().getPrefNode("aliance", true);
                var aliance = new Array();
                aliConfig.clearChildNodes();
                
                nastavit.each(function(a) {
                        var m = a.href.match(/&aliance=nastavit_(\d+)/);
                        if (m && m[1]) {
                            aliConfig.addPref("id", m[1]);
                            aliance.push(Number(m[1]));
                        }
                    });
                    
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
    },
    
    process: null
}));

// Hromadne zpravy - Nastaveni aliance
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Hromadne zpravy"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("nastavit_") != 0)
            return false;
        
        return true;
    },
    
    process: function(page, context) {
    }
}));









/*

    if (typStranky && typStranky.search("nastavit_") == 0) {
        // Hromadne zpravy
        var clenoveRows = page.evaluate('table[2]/tbody/tr[position() > 1 and count(td) >= 7]', page.content);
        var jeKomu = false;
        
        for (var i in clenoveRows) {
            var id = parseInt(page.evaluateSingle('td[3]/font', clenoveRows[i]).textContent);
            if (isNaN(id))
                continue;
            
            var jmenoCell = page.evaluateSingle('td[4]', clenoveRows[i]);
            page.addElement(jmenoCell, "span", '<input name="napsatHromadna" playerid="' + id + '" type="checkbox" style="margin-top: 0px; margin-bottom: 1px" />', jmenoCell.firstChild, [["size", "2"]]);
            jeKomu = true;
        }

        if (jeKomu) {
            var napsatOznacenym = "var komu = '';";
            napsatOznacenym += "var checks = document.getElementsByName('napsatHromadna');";
            napsatOznacenym += "for (var i =0; i < checks.length; i++) {";
            napsatOznacenym += "  if (checks[i].checked)";
            napsatOznacenym += "    komu += Number(checks[i].getAttribute('playerid')) + ',';";
            napsatOznacenym += "}";
            napsatOznacenym += "komu = komu.replace(/,$/, '');";
            napsatOznacenym += "if (komu.length > 0) {";
            napsatOznacenym += "  this.setAttribute('onclick', '');";
            napsatOznacenym += "  document.location.href = '" + buildUrl(page, "posta.html", "posta=napsat&komu=") + "' + komu;";
            napsatOznacenym += "}";
            
            var napsat = '<td colspan="3"></td><td colspan="4">';
            napsat += '<a href="javascript://" onclick="' + napsatOznacenym + '"><font size="2">Napsat označeným</font></a></td>';
            
            var link = page.addElement(clenoveRows[0].parentNode, "tr", "", clenoveRows[clenoveRows.length - 1].nextSibling);
            link.innerHTML = napsat;
        }
    }
    
    */