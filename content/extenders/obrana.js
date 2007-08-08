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

// Najdi tabulku obrana
pageExtenders.add(PageExtender.create({
    getName: function() { return "Obrana - Tabulka"; },

    analyze: function(page, context) {
        page.tableObrana = $X('form/font/table/tbody/tr[9]/td/table', page.content);
    },
    
    process: null
}));
 
// Aktivni id paktaru + Napsat vsem link
pageExtenders.add(PageExtender.create({
    getName: function() { return "Obrana - Aktivni id, Napsat vsem"; },

    analyze: function(page, context) {
        if (page.arguments["setup"] != "obrana")
            return false;
        
        // Definovano vyse
        if (!page.tableObrana)
            return false;
        
        context.paktari = new Array();
        
        $XL('tbody/tr/td[1]/font', page.tableObrana).each(function(i) {
                var id = parseInt(i.textContent);
                if (!isNaN(id))
                    context.paktari.push({ id: id, element: i });
            });
        
        return context.paktari.length > 0;
    },

    process: function(page, context) {
        // Aktivni id
        context.paktari.each(function(i) {        
                var link = MaPlus.Tooltips.createActiveId(page, i.id);
                
                i.element.replaceChild(link, i.element.firstChild);
                new Insertion.After(link, '&nbsp;');
            });
            
        // Napsat vsem
        var idStr = "";
        context.paktari.each(function(i) {
                if (idStr != "") idStr += ",";
                idStr += i.id;
            });
        
        var url = MaPlus.buildUrl(page, "posta.html", {posta: "napsat", komu: idStr});
        var napsatVsem = '<tr><td><a href="' + url + '"><span>Napsat všem</span></a></td></tr>';
        
        new Insertion.After(page.tableObrana, napsatVsem);
    }
}));

// Aktivni nazvy jednotek
pageExtenders.add(PageExtender.create({
    getName: function() { return "Obrana - Jednotky"; },

    analyze: function(page, context) {
        if (page.arguments["setup"] != "obrana")
            return false;
        
        // Definovano vyse
        if (!page.tableObrana)
            return false;
       
        context.jednotky = $XL('tbody/tr/td[3]/font', page.tableObrana);
        return context.jednotky.length > 0;
    },

    process: function(page, context) {
        context.jednotky.each(function(i) {
                var link = MaPlus.Tooltips.createActiveUnit(i.textContent);
                
                if (link) {
                    i.replaceChild(link, i.firstChild);
                }
            });
    }
}));

// Okraje tabulky
pageExtenders.add(PageExtender.create({
    getName: function() { return "Obrana - Okraje"; },

    analyze: function(page, context) {
        if (page.arguments["setup"] != "obrana")
            return false;
        
        return (page.tableObrana != null);
    },

    process: function(page, context) {
        TableHelper.thinBorders(page.tableObrana);
    }
}));
