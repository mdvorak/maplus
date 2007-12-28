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
    getName: function() { return "MaPlus - Nastaveni"; },

    analyze: function(page, context) {
        if (page.arguments["plus"] != "nastaveni")
            return false;
            
        context.html = Chrome.loadText("html/nastaveni.html");   
        if (!context.html)
        	throw new Exception("Nepodarilo se nacist 'nastaveni.html'.");
        
        return true;
    },

    process: function(page, context) {    
        // Uprav rozlozeni obrazovky
        page.content.setAttribute("width", null);
        page.leftMenu.setAttribute("width", "29%");
        page.rightMenu.setAttribute("width", "29%");
        
        // Pomocne promenne pouzite poruznu v nastaveni
        window.PAGE_ID = page.id;
        
        window.ALIANCE_ID = new Array();
        page.config.evalPrefNodeList('regent/aliance/id').each(function(i) {
            window.ALIANCE_ID.push(i.getNumber());
        });     
        
        var dialogNovinky = new NovinkyDialog();
        
        // Na konci html se vyvola funkce window.initNastaveni(); kde se provede vlastni inicializace
        window.initNastaveni = function() {
            window.initNastaveni = null;
            
            // Zobraz id admina
            if (ADMIN_ID != null) {
                adminLink = Element.create("a", ADMIN_ID, {href: MaPlus.buildUrl(page, "posta.html", {posta: "napsat", komu: ADMIN_ID})});
                $('plus_mikeeId').appendChild(adminLink);
                $('plus_vek').innerHTML = ADMIN_ID_AGE;
            }
            
            // Inicializace vlastnich linku
            window.NastaveniVlastniLinky.initPage(page);
        
            // Vyhledej vsechny konfiguracni elementy
            var list = $XL('.//*[@onload and @onsave]', page.content);
            var inputLoad = $X('.//input[@id="plus_loadConfig" and @type="button"]', page.content);
            var inputSave = $X('.//input[@id="plus_saveConfig" and @type="button"]', page.content);
            var spanZprava = $X('.//span[@id="plus_nastaveniZprava"]', page.content);
            var linkNovinky = $X('.//a[@id="plus_novinky"]', page.content);
            
            if (!inputLoad || !inputSave || !spanZprava)
                throw new Exception("Nepodarilo se najit nektery dulezity prvek.");
            
            // Inicializuj vsechny konfiguracni elementy
            list.each(function(e) {
			    e.config = page.config;
			    e.onload = new Function(e.getAttribute("onload"));
			    e.onsave = new Function(e.getAttribute("onsave"));
		    });
    	
		    // Load a save funkce ktere nactou/ulozi vsechny elementy
		    var load = function() {
	            try {
	                console.group("Nacita se nastaveni do ovladacich prvku..");
			        list.each(function(e) { e.onload(); });
	                console.info("Nacitani dokonceno");
                }
                finally {   
                    console.groupEnd();
	            }
		    };
    			
		    var save = function() {
	            try {
	                console.group("Uklada se nastaveni..");
			        list.each(function(e) { e.onsave(); });
			        page.config.save();
			        console.info("Ulozeni probehlo uspesne.");
			    }
                finally {   
                    console.groupEnd();
	            }
		    };
    			
    			
		    // Nacti aktualni hodnoty
		    load();
    		
		    const NOTICE_TIMEOUT = 5000;
    		
		    // Nastav funkce tlacitkum
		    Event.observe(inputLoad, "click", function(event) {
	            spanZprava.update("\xA0"); 
	            load();
	            spanZprava.update("Nastavení načteno");
		        
	            var tracker = new Object();
	            spanZprava.tracker = tracker;
	            setTimeout(function() { if (spanZprava.tracker == tracker) spanZprava.update("\xA0"); }, NOTICE_TIMEOUT);
	        });
    		    
		    Event.observe(inputSave, "click", function(event) {
	            spanZprava.update("\xA0"); 
	            save();
	            spanZprava.update("Nastavení uloženo");
		        
	            var tracker = new Object();
	            spanZprava.tracker = tracker;
	            setTimeout(function() { if (spanZprava.tracker == tracker) spanZprava.update("\xA0"); }, NOTICE_TIMEOUT);
	        });
		    Event.observe(linkNovinky, "click", function(event) {
		        dialogNovinky.show();
		    });
        };
        
        // Zobraz html (cimz se spusti i vyse definovana funkce)
        var div = Element.create("div", context.html);
        page.content.innerHTML = '';
        page.content.appendChild(div);
    }
}));
