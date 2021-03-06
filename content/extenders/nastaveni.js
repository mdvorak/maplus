﻿/* ***** BEGIN LICENSE BLOCK *****
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
 
var MaPlusInfo = Marshal.getObjectProxy("MaPlusInfo");

pageExtenders.add(PageExtender.create({
    getName: function() { return "MaPlus - Nastaveni"; },

    analyze: function(page, context) {
        if (page.arguments["plus"] != "nastaveni")
            return false;
            
        context.htmlElem = Chrome.loadHtml("html/nastaveni.html");   
        if (!context.htmlElem)
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

        // Nacteme pozadovane JS
        [
            "html/linkeditors.js",
            "html/vlastnilinky.js",
            "html/nastavenihlidka.js"
        ].each(function(path) {
            var js = Chrome.loadText(path);
            document.head.appendChild(Element.create("script", js, {type: "text/javascript", charset: "UTF-8"}));
        });
        
        var dialogNovinky = new NovinkyDialog();
        
        // Na konci html se vyvola funkce window.initNastaveni(); kde se provede vlastni inicializace
        window.initNastaveni = function() {
            window.initNastaveni = null;
            
            // Zobraz kontakt na admina
            var admin = MaPlusInfo.admin();
            var kontantNastaven = false;
            
            if (admin.id != null) {
                var adminLink = Element.create("a", admin.id, {href: MaPlus.buildUrl(page, "posta.html", {posta: "napsat", komu: admin.id, dulezitost: "bug"})});
                $('plus_kontakt').appendChild(adminLink);
                
                if (admin.jmeno != null)
                    $('plus_kontakt').appendChild(document.createTextNode(" (" + admin.jmeno + ")"));
                    
                kontantNastaven = true;
            }
            if (admin.email != null) {
                if (kontantNastaven)
                    $('plus_kontakt').appendChild(document.createTextNode(" nebo na "));
            
                var adminLink = Element.create("a", admin.email, {href: "mailto:" + admin.email});
                $('plus_kontakt').appendChild(adminLink);
                kontantNastaven = true;
            }
            
            if (!kontantNastaven) {
                $('plus_kontakt').appendChild(Element.create("i", "[došlo k chybě]"));
            }
            
            // Zobraz oznaceni veku
            $('plus_vekId').innerHTML = MaPlusInfo.vek();
            
            // Inicializace vlastnich linku
            window.NastaveniVlastniLinky.initPage(page);
        
            // Vyhledej vsechny konfiguracni elementy
            var list = $XL('.//*[@onload and @onsave]', page.content);
            var inputLoad = $X('.//input[@id="plus_loadConfig" and @type="button"]', page.content);
            var inputSave = $X('.//input[@id="plus_saveConfig" and @type="button"]', page.content);
            var inputClear = $X('.//input[@id="plus_clearConfig" and @type="button"]', page.content);
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
	                logger().group("Nacita se nastaveni do ovladacich prvku..");
			        list.each(function(e) { e.onload(); });
	                logger().info("Nacitani dokonceno");
                }
                catch (ex) {
                    alert(ex);
                }
                finally {   
                    logger().groupEnd();
	            }
		    };
    			
		    var save = function() {
	            try {
	                logger().group("Uklada se nastaveni..");
			        list.each(function(e) { e.onsave(); });
			        page.config.save();
			        logger().info("Ulozeni probehlo uspesne.");
			    }
                finally {   
                    logger().groupEnd();
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
		    
		    Event.observe(inputClear, "click", function(event) {
		        if (!confirm('Opravdu chcete tato nastavení smazat?'))
		            return;
		    
		        logger().info("Vymazavam nastaveni...");
		        
		        if ($('cpd_maplus').checked) {
		            page.localConfig.clearChildNodes();
		            page.config.clearChildNodes();
		        }
		        else if ($('cpd_utok').checked) {
		            page.config.getPrefNode("nastaveni", true).getPrefNode("utok", true).clearChildNodes();
		            page.config.getPrefNode("nastaveni", true).getPrefNode("boj", true).clearChildNodes();		            
		        }
		        
		        if ($('cpd_data').checked) {
		            MaData.clear(); // Vymaze data a ulozi soubor
		        }
		        
		        logger().log("Nastaveni vymazano.");
		        page.config.save();
		        
		        // Nacti nove hodnoty
		        document.location.href = MaPlus.buildUrl(page, "main.html", {"plus": "nastaveni"});
		    });
        };
        
        // Zobraz html (cimz se spusti i vyse definovana funkce)
        page.content.innerHTML = '';
        page.content.appendChild(context.htmlElem);
    }
}));
