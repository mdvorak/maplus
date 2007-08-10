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

// Plus menu (zobrazit vzdy)
pageExtenders.add(PageExtender.create({
    getName: function() { return "MaPlus menu"; },

    analyze: function(page, context) {
        // Tohle je vyjimka: aby se neprovadela zbytecne analyza pro vsechny extendery
        // a pritom se vzdy zobrazilo menu, je jeho zobrani uz v analyze, kde je taky
        // vyhozena vyjimka AbortException pokud je plus zakazano.
    
        context.html = Chrome.loadText("html/maplus.html");
        if (!context.html)
            throw new Exception("Unable to load maplus.html");
        
        var div = document.createElement("div");
        div.innerHTML = context.html;
        div.style.left = "10px";
        div.style.top = "10px";
        div.style.display = 'block';
        div.style.position = "absolute";
        
        document.body.appendChild(div);
        
        var link = $X('//a[@id = "plus_enable"]');
        if (!link) 
            throw new Exception(String.format("Unable to find 'plus_enable' link."));
        
        Event.observe(link, "click", function(event) 
            {
                var value = !page.config.getEnabled();
                page.config.setPref("enabled", value);
                link.updateText(value); // Defined in 'maplus.htm'
            });
            
        var enabled = page.config.getEnabled();
        link.updateText(enabled);
        
        var aNastaveni = $X('//a[@id = "plus_nastaveni"]');
        if (!aNastaveni) 
            throw new Exception(String.format("Unable to find 'plus_nastaveni' link."));
        aNastaveni.href = MaPlus.buildUrl(page, "main.html", { plus: "nastaveni" });
        
        // Stop execution
        if (!enabled)
            throw new AbortException("MaPlus is disabled.");
            
        return true;
    },
    
    process: function(page, context) {
        // Aby se nesralo v urcitych mistech formatovani
        if (page.content)
            page.content.setAttribute("valign", "top");
    }
}));

// Vyhledavani podle id (@name="koho")
pageExtenders.add(PageExtender.create({
    getName: function() { return "Kontrola - ID"; },

    analyze: function(page, context) {
        context.list = $XL('//input[@type = "text" and @name = "koho"]');
        return context.list.length > 0;
    },
    
    process: function(page, context) {
        context.list.each(function(e) {
                Event.observe(e, 'blur', function() { this.value = this.value.replace(/^\\s+|\\s+$/g, ''); }, false);
            });
    }
}));

// Upozorneni pri odkliku vice nez X tahu
pageExtenders.add(PageExtender.create({
    getName: function() { return "Kontrola - Tahy"; },

    analyze: function(page, context) {
        if (page.config.getNumber("maxTahu", MAX_TAHU_DEFAULT) > 0) {
            context.fields = $XL('//input[@type = "text" and @name = "kolikwait"]');
            context.buttons = $XL('//input[@type = "submit"]');
            return context.fields.length > 0;
        }
        return false;
    },
    
    process: function(page, context) {
        var maxTahu = page.config.getNumber("maxTahu", MAX_TAHU_DEFAULT);
        var zprava = "Opravdu chcete odehrát více jak " + maxTahu + " tahù?";
        
        context.fields.each(function(e) {
                context.buttons.each(function(i) {
                        // Prasacky ale funkcni reseni (bohuzel '//' neuznava kontext :-( )
                        if (i.form == e.form) {
                            i.onclick = function() { return (parseInt(e.value) < maxTahu) || confirm(zprava); };
                            i.setAttribute("plus", true); // Debug
                        }
                    });
            });
            
        // Pridej kontrolu i na objevovat
        if (context.fields.length > 0 && parseInt(context.fields[0].value) > maxTahu) {
            var cekat = $X('//a[starts-with(@href, "wait.html")]');
            var objevovat = $X('//a[starts-with(@href, "explore.html")]');
            
            var zprava2 = "Je možné, že odehrajete více jak " + maxTahu + " tahù, chcete pokraèovat?";
            
            if (cekat) {
                cekat.onclick = function() { return confirm(zprava2); };
                cekat.setAttribute("plus", true); // Debug
            }
            if (objevovat) {
                objevovat.onclick = function() { return confirm(zprava2); };
                objevovat.setAttribute("plus", true); // Debug
            }
        }
    }
}));
