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

var PERSISTENT_FIELDS_WARNING = "Pozn: Pokud je checkbox vedle pole zatržen, hodnota bude uložena a použita při dalších zobrazeních.";

// Utok
pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Stale nastaveni"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;
    
        // Vytvor seznam persistent poli
        var tableJednotky = $X('.//table[tbody/tr[1]/td[1]/font/b = "Jednotky v boji"]', page.content);
        var tableKouzla = $X('.//table[tbody/tr[1]/td[1]/font/b = "Magie v boji"]', page.content);
        var tableAliance = $X('.//table[tbody/tr[1]/td[1]/font/b = "Pomoc aliance"]', page.content);
        
        var elements = new Array();
        elements = $XL('.//input[@name and @type = "text"]', tableJednotky).concat(elements);
        elements = $XL('.//select[@name]', tableJednotky).concat(elements);
        
        if (tableKouzla != null) {
            elements = $XL('.//input[@name and @type = "text"]', tableKouzla).concat(elements);
            elements = $XL('.//select[@name]', tableKouzla).concat(elements);
        }
        if (tableAliance != null) {
            elements = $XL('.//input[@name and @type = "text"]', tableAliance).concat(elements);
            elements = $XL('.//select[@name]', tableAliance).concat(elements);
        }
        
        context.elements = elements;
        context.config = page.config.getPrefNode("nastaveni", true).getPrefNode("utok", true);
        
        // Prepocet many
        context.count_sum = window.count_sum;

        return context.elements.length > 0;
    },

    process: function(page, context) {
        // Pridat hlasku
        var upozorneni = Element.create("span", '<br/><br/>' + PERSISTENT_FIELDS_WARNING);
        upozorneni.className = "small";
        page.content.appendChild(upozorneni);
    
        // Vypni prepocet many (kvuli upozorneni na nedostatek)
        window.count_sum = function() { };
    
        // Inicializace poli
        PersistentElements.initializeList(context.elements, context.config);
        
        // Obnov prepocitavani many
        window.count_sum = context.count_sum;
    }
}));

pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Readonly fix"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;
    
        // Pole ktera maji byt readonly
        context.readonlyElements = $XL('.//input[@type = "text" and (@name = "pocet_tu" or @name = "celkova_power_armady" or @name = "celkove_procent_armady" or @name = "sum_price" or @name = "znamenko")]');
        
        return context.readonlyElements.length > 0;
    },

    process: function(page, context) {
        // Disabluj readonly pole
        context.readonlyElements.each(function(e) {
                e.setAttribute("readonly", "readonly");
            });
    }
}));

// Uprava tabulky s podporama
pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Podpory"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;

        context.table = $X('.//table/tbody[tr[1 and td = "Pomoc aliance"]]/tr[2]/td/font/table', page.content);
        if (context.table == null)
            return false;

        // Vytvor seznam policek s id paktaru
        context.paktari = new Array();

        $XL('tbody/tr/td[1]/font', context.table).each(function(i) {
            var id = parseInt(i.textContent);
            if (!isNaN(id))
                context.paktari.push({ id: id, element: i });
        });

        // Jednotky
        context.jednotky = $XL('tbody/tr/td[3]/font', context.table);

        return true;
    },

    process: function(page, context) {
        // Aktivni id
        context.paktari.each(function(i) {
            var link = MaPlus.Tooltips.createActiveId(page, i.id);

            i.element.replaceChild(link, i.element.firstChild);
            new Insertion.After(link, '\xA0');
        });

        // Aktivni jednotky
        context.jednotky.each(function(i) {
            var link = MaPlus.Tooltips.createActiveUnit(page, i.textContent);

            if (link)
                i.replaceChild(link, i.firstChild);
        });

        // Okraje
        TableHelper.thinBorders(context.table);
    }
}));

// Boj
pageExtenders.add(PageExtender.create({
    getName: function() { return "Boj - Stale nastaveni"; },

    analyze: function(page, context) {
        if (page.name != "boj.html")
            return false;
    
        // Vytvor seznam persistent poli
        var tableNastaveni = $X('.//table[starts-with(tbody/tr[1]/td[1]/font, "Vzkaz:")]', page.content);
        if (tableNastaveni == null)
            return false;
        
        
        var elements = new Array();
        elements = $XL('.//input[@name and @type = "text"]', tableNastaveni).concat(elements);
        elements = $XL('.//textarea[@name]', tableNastaveni).concat(elements);
        
        context.elements = elements;
        context.config = page.config.getPrefNode("nastaveni", true).getPrefNode("boj", true);

        return context.elements.length > 0;
    },

    process: function(page, context) {
        // Pridat hlasku
        var upozorneni = Element.create("span", '<br/><br/>' + PERSISTENT_FIELDS_WARNING);
        upozorneni.className = "small";
        page.content.appendChild(upozorneni);
    
        // Inicializace poli
        PersistentElements.initializeList(context.elements, context.config);
    }
}));

/** PersistentElements class **/
var PersistentElements = {
    initialize: function(element, config) {
        var name = element.name;
        var value = config.getPrefByName("pole", name);
        
        // Create check element
        var check = Element.create("input", null, {type: "checkbox"});
        
        // Set current value
        if (value != null) {
            console.debug("Setting field '%s' value to %o", name, value);
        
            check.checked = true;
            element.value = value;
            element.style.borderColor = "green";
            element.style.borderWidth = "2px";
            
            try {
                Event.dispatch(element, "change");
            }
            catch (ex) {
                console.warn("Error invoking change event on control %o:\r\n%o", element, ex);
            }
        }
        
        var changeCallback = function() {
            if (check.checked)
                config.setPrefByName("pole", name, element.value);
            else
                config.setPrefByName("pole", name, null);
        };
        
        Event.observe(element, "change", changeCallback);
        Event.observe(check, "change", changeCallback);
        
        element.parentNode.insertBefore(check, element.nextSibling);
    },
    
    initializeList: function(list, config) {
        for (var i = 0; i < list.length; i++) {
            this.initialize(list[i], config);
        }
    }
}
