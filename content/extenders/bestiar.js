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
    getName: function() { return "Bestiar - Analyza"; },

    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;

        var tableData = $X('.//table[tbody/tr/td[contains(font/b, "prodeje")]]', page.content);
        if (!tableData)
            return false;
            
            
        
        // TODO
        
        page.bestiar = { tableData: tableData };
        return true;
    },

    process: null
}));

function aukce_process(page) {
    // Najdi tabulku bestiare
    var eDataTable = page.evaluateSingle('//table[tbody/tr/td[contains(font/b, "prodeje")]]');
    
    if (eDataTable) {
        eDataTable.setAttribute("id", "id_aukce");
        var eHeaderRow = page.evaluateSingle('tbody/tr[1]', eDataTable);

        // Pridej data do jednotlivych radku
        for (var i = 1; i < eDataTable.rows.length; i++) {
            var eRow = eDataTable.rows[i];
    
            var info = new Object();         
            info.jmeno = eRow.cells[0].textContent.replace(/\s+(\[\s*\d+\s*\])?\s*$/, "");
            info.barva = eRow.cells[1].textContent;
            info.pocet = parseInt(eRow.cells[2].textContent);
            info.zkusenost = parseFloat(eRow.cells[3].textContent) / 100;
            info.silaJednotky = parseFloat(eRow.cells[4].textContent);
            info.druh = eRow.cells[5].textContent.replace(/\s+$/, "");
            info.typ = eRow.cells[6].textContent.replace(/\s+$/, "");
            info.cas = eRow.cells[7].textContent.replace(/\s+$/, "");
            info.nabidka = parseInt(eRow.cells[8].textContent);
            
            // Sila stacku
            info.silaStacku = info.pocet * info.silaJednotky * info.zkusenost;
            // Max sila stacku
            info.maxSilaStacku = info.pocet * info.silaJednotky;
            // Cena za 1 sily
            info.cenaZaSilu = info.nabidka / info.silaStacku;
            
            var stats = ma_jednotky.vyhledej(info.jmeno);
            if (stats) {
                info.phb = stats.phb;
                info.ini = stats.realIni;
                info.zlataTU = info.pocet * stats.zlataTU;
                info.manyTU = info.pocet * stats.manyTU;
                info.popTU = info.pocet * stats.popTU;
            }
            else {
                // alert(":" + info.jmeno + ":");
            }
            
            // Zmen barvy
            eRow.cells[5].className = (info.druh == "Let.") ? "druhLet" : "druhPoz";
            eRow.cells[6].className = (info.typ == "Str.") ? "typStr" : "typBoj";
            eRow.cells[3].style.color = colorByRange(info.zkusenost, 0.20, 0.60, redGreenColorPicker);
            eRow.cells[2].style.color = colorByRange(info.pocet, 20, 5000, grayWhiteColorPicker);
            eRow.cells[4].style.color = colorByRange(info.silaJednotky, 1, 220, grayWhiteColorPicker);

            // Pridej nove sloupce
            var eCas = eRow.cells[7];
            var eSilaStacku = addTableCell(page, eRow, "td", info.silaStacku.toFixed(0) + "&nbsp;", "right", eCas);
            var eCenaZaSilu = addTableCell(page, eRow, "td", info.cenaZaSilu.toFixed(1) + "&nbsp;", "right", eCas);            
            addTableCell(page, eRow, "td", "&nbsp;", null, eCas);
            var eIni = addTableCell(page, eRow, "td", (info.ini ? info.ini : "") + "&nbsp;", "right", eRow.cells[5]);
            
            eSilaStacku.style.color = colorByRange(info.silaStacku, 500, 12000, grayWhiteColorPicker);
            eCenaZaSilu.style.color = colorByRange(info.cenaZaSilu, 30, 5, redGreenColorPicker);
            eIni.style.color = colorByRange(info.ini, 5, 35, redGreenColorPicker);
            
            // Zaktivni jednotku
            var eNameLink = createActiveUnit(page, info.jmeno);
            if (eNameLink) {
                var eName = eRow.cells[0].firstChild;
                eName.replaceChild(eNameLink, eName.firstChild);
            }
            
            // Zaktivni link prebidnutych jednotek
            var idLabel = page.evaluateSingle('font/font[@color = "#603030"]', eRow.cells[0]);
            if (idLabel) {
                var id = idLabel.textContent.match(/\d+/)[0];
                if (id && !isNaN(id)) {
                    var idLink = createActiveId(page, id);
                    idLink.style.color = idLabel.color;
                    idLabel.innerHTML = '&nbsp;[&nbsp;<span></span>&nbsp;]';
                    idLabel.childNodes[1].appendChild(idLink);
                }
            }
            
            // Pro razeni a filtrovani
            info.casSekundy = parseTime(info.cas);
            if (isNaN(info.casSekundy))
                info.casSekundy = Number.MAX_VALUE; // Nebidnute radit nakonec
                
            eRow.stack = info;
        }
        
         // Uprav stavajici hlavicky
        page.evaluateSingle('td[4]/font/b', eHeaderRow).innerHTML = "Síla J.";
        page.evaluateSingle('td[6]/font/b', eHeaderRow).innerHTML = "Typ&nbsp;&nbsp;";
        page.evaluateSingle('td[8]/font/b', eHeaderRow).innerHTML = "Nabídka&nbsp;";
        
        // Pridej nadpisy novych radku
        addTableCell(page, eHeaderRow, "td", "<b>Ini&nbsp;</b>", null, eHeaderRow.cells[4]);
        addTableCell(page, eHeaderRow, "td", "<b>Síla&nbsp;</b>");
        addTableCell(page, eHeaderRow, "td", "<b>Za 1 síly</b>");
        addTableCell(page, eHeaderRow, "td", "&nbsp;&nbsp;");
        eHeaderRow.appendChild(page.evaluateSingle('td[contains(., "Čas")]', eHeaderRow));
        eHeaderRow.appendChild(page.evaluateSingle('td[contains(., "Nabídka")]', eHeaderRow));
        
        // Tohle zpusti timer
        injectJavascriptFile(eDataTable, "chrome://maplus/content/html/aukce.js");
        
        aukce_razeni_init(page, eDataTable);
        
        var nastaveniFiltru = page.evaluateSingle('//font/table/tbody/tr[2]/td[1 and contains(font, "Prosím")]');
        var nastaveniHtml = '';
        nastaveniHtml += '<font size="2"><a href="javascript://" onclick="raiseEvent(this, \'AukceFilterClear\');" />Zruš filtrování a řazení</a></font><br/>';
        // nastaveniHtml += '<div id="id_filterNotice" style="color: yellow; display: none;"><font size="1">(Filtr aktivován)</font></div>'
        nastaveniHtml += '<br/>'
        
        nastaveniFiltru.innerHTML = nastaveniHtml;
    }
}




// Vzhled
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Vzhled"; },

    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;
            
        // Konfigurace
        context.config = page.config.getAukce().getPrefNode("vzhled", true);
        
        // TODO
        
        return false;
    },

    process: function(page, context) {
        // TODO
    }
}));

// Razeni a filtrovani
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Filtry"; },

    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;
            
        // Konfigurace
        context.config = page.config.getAukce().getPrefNode("filtry", true);
        Object.extend(context.config, PlusConfig.Aukce.prototype);           

        // TODO
        
        return false;
    },

    process: function(page, context) {
        // TODO
    }
}));
