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

// Novinky
pageExtenders.add(PageExtender.create({
    getName: function() { return "MaPlus - Novinky"; },

    analyze: function(page, context) {
        var last = page.config.getAttribute("posledniVerzeNovinek");

        if (last != VERSION) {
            page.config.setAttribute("posledniVerzeNovinek", VERSION);
            return true;
        }
        else {
            return false;
        }
    },

    process: function(page, context) {
        // Zobraz dialog s novinkama
        var dialog = new NovinkyDialog();
        dialog.show(function() {
            dialog.close();
        });
    }
}));


// Hitcounter
pageExtenders.add(PageExtender.create({
    getName: function() { return "MaPlus - Hitcounter"; },

    analyze: function(page, context) {
        var cfg = page.config.getPrefNode("hits", true);
        var hits = Marshal.callMethod("ConfigHelperService", "addHit", [cfg]);
        logger().log("Hits: %d", hits); 
        return true;
    },
    
    process: null
}));

// Plus menu (zobrazit vzdy)
pageExtenders.add(PageExtender.create({
    getName: function() { return "MaPlus - Menu"; },

    analyze: function(page, context) {
        // Tohle je vyjimka: aby se neprovadela zbytecne analyza pro vsechny extendery
        // a pritom se vzdy zobrazilo menu, je jeho zobrazeni uz v analyze, kde je taky
        // vyhozena vyjimka AbortException pokud je plus zakazano.

        var htmlElem = Chrome.loadHtml("html/maplus.html");
        if (!htmlElem)
            throw new Exception("Unable to load maplus.html");

        var div = document.createElement("div");
        div.style.left = "10px";
        div.style.top = "10px";
        div.style.display = 'block';
        div.style.position = "absolute";
        div.appendChild(htmlElem);

        document.body.appendChild(div);

        var link = $X('.//a[@id = "plus_enable"]', div);
        if (!link)
            throw new Exception(String.format("Unable to find 'plus_enable' link."));

        var aNastaveni = $X('.//a[@id = "plus_nastaveni"]', div);
        if (aNastaveni == null)
            throw new Exception(String.format("Unable to find 'plus_nastaveni' link."));

        Event.observe(link, "click", function(event) {
            var value = !page.config.getEnabled();
            page.config.setPref("enabled", value);
            link.updateText(value); // Defined in 'maplus.htm'
            aNastaveni.style.display = (value ? '' : 'none');
        });

        var enabled = page.config.getEnabled();
        //link.updateText(enabled);
        aNastaveni.style.display = (enabled ? '' : 'none');

        aNastaveni.href = MaPlus.buildUrl(page, "main.html", { plus: "nastaveni" });

        // Stop execution
        if (!enabled)
            throw new AbortException("MaPlus is disabled.");

        // Zobraz upozorneni na vypis seznamu alianci
        if (page.name != "aliance.html" && page.arguments["aliance"] != "vypis_alianci") {
            if (MaData.getStariSeznamuAlianci() > MAX_STARI_SEZNAMU_ALIANCI) {
                var text = '<span class="maplusUpozorneni">Prosím navštivte <a href="' + MaPlus.buildUrl(page, "aliance.html", { aliance: "vypis_alianci" }) + '" class="maplusUpozorneni">výpis aliancí</a></span>';
                MaPlusMenu.zobrazUpozorneni(text);
            }
        }

        return true;
    },

    process: function(page, context) {
        // Aby se nesralo v urcitych mistech formatovani
        if (page.content)
            page.content.setAttribute("valign", "top");
    }
}));



/*** NovinkyDialog class ***/
var NovinkyDialog = Class.create(Dialog, {
    _createContentElement: function() {
        var dialog = this;
        var elem = Chrome.loadHtml("html/novinky.html");
        var root = Element.create("div", elem, {"class": "dialog"});
        
        var inputZavrit = $X('.//input[@id = "d_zavritNovinky"]', root);
        Event.observe(inputZavrit, "click", function(event) {
            dialog.hide();
        });
        
        return root;
    }
});
