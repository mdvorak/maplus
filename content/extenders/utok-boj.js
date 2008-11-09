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

var PERSISTENT_FIELDS_WARNING = "Pozn: Zelený okraj pole znamená, že hodnota pole byla načtena.<br/>" +
                                "Pokud je checkbox vedle pole zaškrtnutý, hodnota je uložena a bude načtena při příštím zobrazení stránky.<br/>" +
                                "Checkbox v neurčitém stavu značí, že pole má uloženou hodnotu jinou než je v něm aktuálně vyplněná.";

// Disabled flag
pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Disabled flag"; },

    analyze: function(page, context) {
        page.utokDisabled = page.config.getPrefNode("nastaveni", true).getPrefNode("utok", true).getBoolean("disabled", false);
        return true;
    },

    process: null
}));

// Utok
pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Stale nastaveni"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;

        // Neni tenhle extender vypnuty?
        if (page.utokDisabled)
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
        var upozorneni = Element.create("span", '<br/><br/>' + PERSISTENT_FIELDS_WARNING + '<br/>');
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

// Nastaveni readonly atributu polim ktere maji byt readonly
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

        context.table = $X('.//table/tbody[tr[1 and td = "Pomoc aliance"]]/tr[last()]/td//table', page.content);
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
        context.sily = $XL('tbody/tr[td[8]]', context.table);

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

        // Max sila tooltip
        context.sily.each(function(i) {
            var zkusenost = parseFloat(i.cells[5].textContent);
            var sila = parseInt(i.cells[7].textContent);

            if (!isNaN(zkusenost) && !isNaN(sila)) {
                var maxSila = Math.floor(100 * sila / zkusenost);
                i.cells[7].setAttribute("title", "Max síla stacku: " + maxSila);
            }
        });

        // Okraje
        TableHelper.thinBorders(context.table);

        // Center tabulku (nutne od veku 6.2)
        context.table.parentNode.setAttribute("align", "center");
    }
}));

// Timer na odklik utoku
pageExtenders.add(PageExtender.create({
    LIMIT: 8000,

    getName: function() { return "Utok - Timer"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;

        // Neni tenhle extender vypnuty?
        if (page.utokDisabled)
            return false;

        context.submit = $X('.//form[@name = "formular" and @action = "boj.html"]//input[@type = "submit"]', page.content);
        return (context.submit != null);
    },

    process: function(page, context) {
        var text = context.submit.value;
        var limit = this.LIMIT;

        var format = function(zbyva) {
            return " Prosím čekejte (" + Math.floor(zbyva / 1000) + "s)";
        };

        var i = window.setInterval(function() {
            var cas = new Date().getTime() - new Date(document.lastModified).getTime();

            if (cas < limit - 250) {
                context.submit.value = format(limit - cas);
            }
            else {
                context.submit.disabled = false;
                context.submit.value = text;
                window.clearInterval(i);
            }
        }, 500);

        context.submit.disabled = true;
        context.submit.value = " Prosím čekejte ";
    }
}));

// Upozorneni pri utoku prilis malou armadou
pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Mala Sila"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;

        var input = $X('.//input[@name = "celkove_procent_armady"]', page.content);
        var old = window.change_sum_of_power;

        if (input == null || old == null)
            return false;

        window.change_sum_of_power = function() {
            old();

            if (parseFloat(input.value) < 95)
                input.className = "nizkaSilaUtoku";
            else
                input.className = "";
        };
    },

    process: null
}));

// Utok - prepocet many pri zobrazeni
pageExtenders.add(PageExtender.create({
    getName: function() { return "Utok - Prepocet many"; },

    analyze: function(page, context) {
        if (page.name != "utok.html")
            return false;

        // Definovano MA
        context.cenyKouzel = window.ceny;
        context.sumInput = $X('//input[@name = "sum_price"]');

        context.kouzla = new Array();
        
        for (var i = 1; i < 5; i++) {
            var select = $X('//select[@name = "kouzlo_' + i + '"]');
            if (select == null)
                break;

            context.kouzla.push(select);
        }

        return context.cenyKouzel != null && context.sumInput != null && context.kouzla.length > 0;
    },

    process: function(page, context) {
        // Prepocitej
        var total = 0;
        
        context.kouzla.each(function(select) {
            total += context.cenyKouzel[select.value];
        });
        
        if (total > 0)
            context.sumInput.value = total;
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
        var upozorneni = Element.create("span", '<br/><br/>' + PERSISTENT_FIELDS_WARNING + '<br/>');
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
        var check = Checkbox.create();

        // Set current value
        if (value != null) {
            logger().debug("Setting field '%s' value to %o", name, value);

            check.setState(Checkbox.STATE_CHECKED);
            element.value = value;
            element.style.borderColor = "green";

            try {
                Event.dispatch(element, "change");
            }
            catch (ex) {
                logger().warn("Error invoking change event on control %o:\r\n%o", element, ex);
            }
        }

        // Event handlers
        Event.observe(element, "change", function() {
            if (check.getState() != Checkbox.STATE_UNCHECKED) {
                if (element.value == value)
                    check.setState(Checkbox.STATE_CHECKED);
                else
                    check.setState(Checkbox.STATE_UNKNOWN);
            }
        });

        Event.observe(check, "change", function() {
            if (check.getState() == Checkbox.STATE_CHECKED) {
                value = element.value;
                config.setPrefByName("pole", name, element.value);
                element.style.borderColor = "green";
            }
            else if (check.getState() == Checkbox.STATE_UNCHECKED) {
                value = null;
                config.setPrefByName("pole", name, null);
                element.style.borderColor = "";
            }
        });

        element.parentNode.insertBefore(check, element.nextSibling);
    },

    initializeList: function(list, config) {
        for (var i = 0; i < list.length; i++) {
            this.initialize(list[i], config);
        }
    }
};
