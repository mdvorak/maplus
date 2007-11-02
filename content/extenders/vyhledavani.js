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

// Aktivni id
pageExtenders.add(PageExtender.create({
    getName: function() { return "Vyhledavani - Aktivni Id"; },

    analyze: function(page, context) {
        if ($X('font[starts-with(b, "Výsledky hledání")]', page.content) == null)
            return false;
        
        // Najdi tabulku vysledku    
        var tableVysledky = $X('.//font/table[1]', page.content);
        if (tableVysledky == null)
            return false;
        
        // Vytvor seznam elementu s id
        context.list = new Array();
        
        for (var i = 2; i < tableVysledky.rows.length - 1; i++) {
            var tdId = tableVysledky.rows[i].cells[0];
            
            var id = parseInt(tdId.textContent);
            if (isNaN(id))
                continue;
                
            context.list.push({
                element: tdId,
                id: id
            });
        }
        
        return context.list.length > 0;
    },
    
    process: function(page, context) {
        context.list.each(function(i) {
            var linkId = MaPlus.Tooltips.createActiveId(page, i.id);
            
            i.element.innerHTML = '';
            i.element.appendChild(linkId);
            i.element.appendChild(Element.create("span", "\xA0\xA0"));
        });
    }
}));


// Pokud se vyhladava pro spehy, zobraz vyhledavaci form
pageExtenders.add(PageExtender.create({
    getName: function() { return "Vyhledavani - Vyslat spehy"; },

    analyze: function(page, context) {
        if (page.arguments["setup"] != "spehovani")
            return false;
        
        return true;
    },
    
    process: function(page, context) {
        // Pridej form na dalsi vyhledavani
        var form = Element.create("form", null, {action: "setup.html", method: "post"});
        
        // Skryte nalezitosti stranky
        form.appendChild(Element.create("input", null, {name: "id", value: page.id, type: "hidden"}));
        form.appendChild(Element.create("input", null, {name: "code", value: page.code, type: "hidden"}));
        form.appendChild(Element.create("input", null, {name: "ftc", value: page.ftc, type: "hidden"}));
        form.appendChild(Element.create("input", null, {name: "setup", value: "spehovani", type: "hidden"}));
        form.appendChild(Element.create("input", null, {name: "nolinks", value: "1", type: "hidden"}));
        
        // UI
        form.appendChild(Element.create("input", null, {value: " Vyslat špehy ", type: "submit"}));
        form.appendChild(Element.create("span", "\xA0k\xA0ID#\xA0"));
        form.appendChild(Element.create("input", null, {name: "koho", value: "", type: "text", maxlength: "6", size: "4"}));
        
        // Zobrazit
        page.content.appendChild(Element.create("br"));
        page.content.appendChild(form);
    }
}));
