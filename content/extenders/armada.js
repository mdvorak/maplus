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

// Aktivni jednotky
pageExtenders.add(PageExtender.create({
    getName: function() { return "Armada - Jednotky"; },

    analyze: function(page, context) {
        context.cells = $XL('form/table[1]/tbody/tr/td[1]/font', page.content);
        return context.cells.length > 0;
    },
    
    process: function(page, context) {
        context.cells.each(function(e) {
                var jmeno = e.textContent.replace(/^\s+/, "").replace(/\s+$/, "");
                var link = MaPlus.Tooltips.createActiveUnit(page, jmeno);

                if (link) {
                    e.innerHTML = "&nbsp;";
                    e.appendChild(link);
                }
            });
    }
}));

// confirm na tlacitko Cekat
pageExtenders.add(PageExtender.create({
    MESSAGE: "Jste si jisti že chcete odehrát potřebný počet tahů pro dokončení rekrutu?",

    getName: function() { return "Armada - Cekat"; },

    analyze: function(page, context) {
        context.button = $X('.//input[@type="submit" and contains(@value, "Čekat")]', page.content);
        return (context.button != null);
    },
    
    process: function(page, context) {
        var _this = this;
        context.button.onclick = function() { return confirm(_this.MESSAGE); };
    }
}));

// Prepocitavat pocet tahu/jednotek pri kazdem zmacknuti klavesy
pageExtenders.add(PageExtender.create({
    getName: function() { return "Armada - Prepocitavani"; },

    analyze: function(page, context) {
        // Funkce definovane v MA
        if (!spocitat_pocet || typeof spocitat_pocet != "function"
                || !spocitat_tahy || typeof spocitat_tahy != "function")
            return false;
    
        context.tahy = $X('//input[@name = "tahy"]');
        if (!context.tahy)
            return false;
            
        // Najdi 'kolik' pole pro stejny formular jako je pocet tahu (nutne kvuli formulari pro propousteni)
        context.kolik = $X('.//input[@name = "kolik"]', context.tahy.form);    
        context.jednotka = $X('.//select[@name = "jednotka"]', context.tahy.form);    
        return (context.kolik != null && context.jednotka != null);
    },
    
    process: function(page, context) {
        context.jednotka.setAttribute("onchange", null);
    
        Event.observe(context.kolik, "keyup", function() { spocitat_tahy(); }, false);
        Event.observe(context.tahy, "keyup", function() { spocitat_pocet(); }, false);
        
        var jednotkaChange = function() {
            if (context.tahy.value == '')
                context.tahy.value = "1";
            spocitat_pocet();
        };
        Event.observe(context.jednotka, "keyup", jednotkaChange, false);
        Event.observe(context.jednotka, "change", jednotkaChange, false);
    }
}));

// bezpecnostni pojistka pro propousteni Propustit
pageExtenders.add(PageExtender.create({
    NOTES: "(Pro propusteni jednotky stisknete tlacitko 'Propustit' 2x)",

    getName: function() { return "Armada - Propustit"; },

    analyze: function(page, context) {
        if (!page.config.getBoolean("propustitPotvrzeni", false))
            return false;
    
        context.propustit = $X('//input[@type="submit" and contains(@value, "Propustit")]', page.content);
        if (!context.propustit)
            return false;
            
        context.jednotka = $X('.//select[@name="jednotka"]', context.propustit.form);
        context.kolik = $X('.//input[@name="kolik"]', context.propustit.form);
        
        return (context.jednotka != null && context.kolik != null);
    },
    
    process: function(page, context) {
        var reset = function() {
                context.propustit.style.color = '';
                context.propustit.potvrzeno = false; 
            };
    
        // Reset pri zmene jednotky nebo poctu
        Event.observe(context.jednotka, 'change', reset, false);
        Event.observe(context.kolik, 'change', reset, false);
    
        // Potvrzovaci mechanismus
        context.propustit.onclick = function() { 
                if (!this.potvrzeno) {
                    this.style.color = 'red';
                    this.potvrzeno = true;
                    return false;
                }
            };
            
        // Komentar
        var notes = document.createElement("span");
        notes.innerHTML = "<br/>" + this.NOTES;
        notes.className = "small";
        
        context.propustit.parentNode.appendChild(notes);
    }
}));
