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

// Skryti popisku kouzel
pageExtenders.add(PageExtender.create({
    getName: function() { return "Magie - Popisky"; },

    analyze: function(page, context) {
        context.tableKouzla = $X('.//table[contains(tbody/tr[2]/td[4]/font, "seslání")]', page.content);
        if (!context.tableKouzla)
            return false;
            
        if (XPath.evalNumber('count(tbody/tr[@bgColor = "#303030"])', context.tableKouzla) == 0)
            return false;
            
        context.tdBottom = $X('tbody/tr[last()]/td[2]', context.tableKouzla);
        
        return (context.tdBottom != null);
    },
    
    process: function(page, context) {
        var tableKouzla = context.tableKouzla;
        var hiddenRows = new Array();
    
        for (var i = 2; i < tableKouzla.rows.length - 1; i++) {
            var row = tableKouzla.rows[i];
            
            // Radek s popiskem nebo meziradek, skryt oba
            if (row.bgColor == "#303030" || row.bgColor == "") {
                $(row).hide();
                hiddenRows.push(row);
            }
            else {
                if (i % 2) row.bgColor = "#000000";
                else row.bgColor = "#1b1b1b";
            }
        }
        
        // Link na zobrazeni popisku
        var aZobrazPopisky = document.createElement("a");
        aZobrazPopisky.innerHTML = '<span class="small">Zobrazit popisky</small>';
        aZobrazPopisky.href = "javascript://";
        context.tdBottom.appendChild(aZobrazPopisky);

        Event.observe(aZobrazPopisky, 'click', function(event) {
                hiddenRows.each(function(e) { $(e).show(); });
                $(this).hide();
                // Tohle donuti preklesleni tabulky takze se roztahne
                tableKouzla.style.overflowX = "scroll"; 
            }, false);
    }
}));

// Aktivni id v cilech kouzel
pageExtenders.add(PageExtender.create({
    getName: function() { return "Magie - Aktivni id"; },

    analyze: function(page, context) {
        context.tablePredkouzleno = $X('.//table[tbody/tr[2]/td[4]/font/b = "Název"]', page.content);
        if (!context.tablePredkouzleno)
            return false;
        
        context.naProvincii = $XL('tbody/tr/td[5]/font', context.tablePredkouzleno);
        
        return (context.naProvincii.length > 0);
    },
    
    process: function(page, context) {
        context.naProvincii.each(function(e) {
                var m = e.innerHTML.match(/^\((\d+)\)(.*)/);
                var id = (m ? parseInt(m[1]) : null);
                var provincie = (m ? m[2].replace(/&nbsp;/g, "\xA0") : null);
                
                if (id && !isNaN(id)) {
                    e.innerHTML = "";
                    e.appendChild(document.createTextNode("("));
                    e.appendChild(MaPlus.Tooltips.createActiveId(page, id));
                    e.appendChild(document.createTextNode(")"));
                    e.appendChild(document.createTextNode(provincie));
                }
            });
    }
}));

// Zobrazit hlasku pokud bylo kouzlo seslano pres url
pageExtenders.add(PageExtender.create({
    getName: function() { return "Magie - Upozorneni"; },

    analyze: function(page, context) {
        return (page.name == "magie.html" 
             && parseInt(page.arguments["kolikrat"]) > 0 
             && parseInt(page.arguments["seslat_kouzlo"]) > 0);
    },
    
    process: function(page, context) {
        var upozorneni = Element.create("span", 'Kouzlo sesláno<br/><br/>', {"class": "message"});
        page.content.insertBefore(upozorneni, page.content.firstChild);
    }
}));


// Confirm na form vynalezani kouzel
pageExtenders.add(PageExtender.create({
    getName: function() { return "Magie - Potvrzeni vynalezani"; },

    analyze: function(page, context) {
        var formVynalezani = $X('//form[contains(font, "Vaši mágové právě pracují na kouzlu")]');
        if (formVynalezani == null)
            return false;
            
        context.inputZrusit = $X('.//input[@type = "submit" and contains(@value, "Zrušit")]', formVynalezani);
        context.links = $XL('.//a[@href and @href != "javascript://"]', formVynalezani);
        
        return (context.inputZrusit != null) && (context.links.length > 0);
    },
    
    process: function(page, context) {
        Event.observe(context.inputZrusit, "click", function(event) {
            if (!confirm("Opravdu chcete zrušit vynalézání kouzla?"))
                Event.stop(event);
        });
        
        context.links.each(function(i) {
            Event.observe(i, "click", function(event) {
                if (!confirm("Opravdu chcete odehrát potřebný počet tahů pro vynalezení kouzla?"))
                    Event.stop(event);
            });
        });
    }
}));

// Analyza ID kouzel pro vlastni linky
pageExtenders.add(PageExtender.create({
    getName: function() { return "Magie - ID kouzel"; },

    analyze: function(page, context) {
        var select = $X('.//form[@action = "/magie.html"]//select[@name = "seslat_kouzlo"]', page.content);
        if (select == null)
            return false;
        
        // Vytvor seznam kouzel
        var kouzla = new Array();
        for (var i = 0; i < select.options.length; i++) {
            var id = parseInt(select.options[i].value);
            
            if (id > 0) {
                kouzla.push({id: id, name: select.options[i].text});
            }
        }
        
        // Updatuj kouzla
        var config = page.config.getData().getPrefNode("magie", true);
        Marshal.callMethod("ConfigHelper", "updateKouzla", [config, kouzla]);
        
        return true;
    },
    
    process: null
}));