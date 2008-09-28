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


pageExtenders.add(PageExtender.create({
    getName: function() { return "Banka - Splatka"; },

    analyze: function(page, context) {
        context.splatka = $X('.//input[@type="text" and @name="splatka"]', page.content);
        if (!context.splatka)
            return false;
            
        var popis = XPath.evalString('font/table/tbody/tr[2]/td[2]/table/tbody/tr/td[2]/font', page.content);
        var m;
        if ((m = popis.match(/\s(\d+)\szl/)) != null) {
            context.castka = parseInt(m[1]);
            logger().debug("castka=%d", context.castka);
        }
        
        var pujceno = !isNaN(context.castka);
        
        if (pujceno) {
            // Set bit
            logger().log("Mame pujceno!");
            page.config.getRegent().setPref("dluh", true);
        }
        
        return pujceno;
    },

    process: function(page, context) {
        Event.observe(context.splatka, 'blur', function() {
            if (parseInt(this.value) > context.castka)
                this.value = context.castka;
        });
    }
}));


pageExtenders.add(PageExtender.create({
    getName: function() { return "Banka - Pujcka"; },

    analyze: function(page, context) {
        var formPujcit = $X('.//form[@action="banka.html" and .//input[@type="text" and @name="pujcka"]]', page.content);

        if (formPujcit != null) {
            // Nemame pujceno, reset bit
            logger().log("Zadna pujcka");
            page.config.getRegent().setPref("dluh", false);

            // Pridej handler na pujceni
            var inputPujcka = $X('.//input[@type="text" and @name="pujcka"]', formPujcit);

            Event.observe(formPujcit, 'submit', function(event) {
                logger().debug("pujcka=%d", parseInt(inputPujcka.value));

                if (parseInt(inputPujcka.value) > 0) {
                    // Set bit
                    page.config.getRegent().setPref("dluh", true);
                }
                else {
                    // Neodesilej ani formular, nemuze to stejne projit
                    Event.stop(event);
                    inputPujcka.addClassName("validationError");
                    inputPujcka.focus();
                }
            });

            return false;
        }

        if ($X('.//font[contains(., "Vaše půjčka je splacena")]', page.content) != null) {
            // Reset bit, pujcka vracena
            logger().log("Pujcka vracena!");
            page.config.getRegent().setPref("dluh", false);

            context.redirect = true;
        }
        else if ($X('.//font[contains(., "část půjčky byla splacena")]', page.content) != null) {
            context.redirect = true;
        }
        
        return context.redirect;
    },

    process: function(page, context) {
        // Redirect, at se zamezi refreshi (byt omylem, muze to stat docela dost)
        setTimeout(function() {
            document.location.href = MaPlus.buildUrl(page, "banka.html");
        }, 3000);
    }
}));
