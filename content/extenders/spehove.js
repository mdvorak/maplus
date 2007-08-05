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

// Analyze spehu
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        // Spehove (pokud je stranka zobrazena pres POST tak argument samozrejme neni)
        if (page.arguments["setup"] && page.arguments["setup"] != "spehovani")
            return false;
        
        // Najdi tabulku spehu, pokud neni je zobrazeny jiny typ stranky
        context.borderTable = $X('tbody/tr/td[2][starts-with(b, "Špehům")]/table', page.contentTable);
        if (!context.borderTable)
            return false;
        
        context.table = $X('tbody/tr/td/table', context.borderTable);
        if (!context.table)
            return false;
            
        // Najdi id, pokud nenalezeno neco neni v poradku
        var id = XPath.evalString('tbody/tr[2]/td[2]/font/b/b/sup', context.table);
        if (id) id = parseInt(id.match(/\d+/)[0]);
        if (!id || isNaN(id))
            return false;
        
        // Nacti ostatni data
        var data = {
            id: id,
            regent: XPath.evalString('tbody/tr[starts-with(td[1], "Regent")]/td[2]/font/b', context.table),
            provincie: $X('tbody/tr[starts-with(td[1], "Provincie")]/td[2]/font/b', context.table).firstChild.textContent,
            povolani: XPath.evalString('tbody/tr[starts-with(td[1], "Povolání")]/td[2]/font', context.table),
            presvedceni: XPath.evalString('tbody/tr[starts-with(td[1], "Přesvědčení")]/td[2]/font', context.table)[0],
            sila: XPath.evalNumber('tbody/tr[starts-with(td[1], "Síla")]/td[2]/font', context.table)
        };
        data.idealniSila = data.sila * 1.25;
        
        // Najdi alianci
        var fontAliance = $X('tbody/tr[starts-with(td[1], "Aliance")]/td[2]/font', context.table);
        if (fontAliance) {
            data.aliance = fontAliance.textContent;
            context.aliance = MaData.najdiAlianci(data.aliance);
        }
        
        // Aktualizuj data
        MaData.aktualizujProvincii(data.id, data.regent, data.provincie, data.povolani, data.presvedceni, data.aliance);
        
        context.data = data;
        context.fontAliance = fontAliance;
        
        return true;
    },

    process: function(page, context) {
        // Link na alianci
        if (context.aliance) {
            var link = MaPlus.buildUrl(page, "aliance.html", {aliance: "vypis_clenu_v_ally_" + context.aliance.id});
            context.fontAliance.innerHTML = '<a href="' + link + '">' + context.aliance.jmeno + '</a>';
        }
        
        // Zobrazeni idelani sily
        new Insertion.Bottom(context.table, '<tr><td><span>Síla na útok&nbsp;&nbsp;</span></td><td><span>' + Math.floor(context.data.idealniSila) + '</span></td></tr>');
        
        // Zautocit
        var zautocitUrl = MaPlus.buildUrl(page, "utok.html", {koho: context.data.id});
        new Insertion.After(context.borderTable, '<a href="' + zautocitUrl + '"><span>Zaútočit</span></a><br/>');
        
        // Napsat zpravu
        var napsatUrl = MaPlus.buildUrl(page, "posta.html", {posta: "napsat", komu: context.data.id});
        new Insertion.After(context.borderTable, '<a href="' + napsatUrl + '"><span>Napsat Zprávu</span></a><br/>');
    }
}));
