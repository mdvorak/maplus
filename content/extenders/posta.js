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

var Posta = {
    ODDELOVAC: "____________",
    LINK_CONFIRM_TEXT: "Tento odkaz může vést na stránku s nebezpečným obsahem. Opravdu chcete pokračovat?",
    DULEZITOST_REGEX: /^:\W*(\w+)\W*\s*/
}

// Psani nove zpravy
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Psat"; },

    analyze: function(page, context) {
        if (page.arguments["posta"] != "napsat" && page.arguments["posta"] != "posta_v_ally" && page.arguments["posta"] != "predat")
            return false;
        
        var controls = {
            textareaZprava: $X('.//textarea[@name = "text"]', page.content),
            inputAliance: $X('.//select[@name = "aliancni_posta"]', page.content),
            inputKomu: $X('.//input[@name = "komu" and @type = "text"]', page.content),
            inputPodpis: $X('.//input[@name = "podpis" and @type = "checkbox"]', page.content),
            inputOdeslat: $X('.//input[@type = "submit"]', page.content)
        };
        
        if (controls.textareaZprava == null || controls.inputPodpis == null || controls.inputOdeslat == null)
            return false;
        if (page.arguments["posta"] == "posta_v_ally") {
            if (controls.inputAliance == null)
                return false;
        }
        else if (controls.inputKomu == null) {
            return false;
        }
        
        controls.form = controls.textareaZprava.form;
        
        context.controls = controls;
        return true;
    },
    
    process: function(page, context) {
        var controls = context.controls;
    
        // Klaves. zkratky
        Event.observe(controls.textareaZprava, 'keypress', function(event) {
            if (event.keyCode == Event.KEY_ESC)
                this.value = '';
            else if (event.ctrlKey && event.keyCode == Event.KEY_RETURN)
                this.form.submit();                    
        });
        
        new Insertion.Bottom(controls.form, '<br/><span class="small" style="color: gray;">Pozn.: Esc - vymaže napsaný text, Ctrl+Enter - odešle zprávu</span>');
        
        // Osetreni "Odpovedet vsem"
        if (page.arguments["posta"] == "posta_v_ally" && page.arguments["odpoved"] != null) {
            var odpoved = DataCache.retrieve("posta_" + page.arguments["odpoved"]);
        
            if (odpoved != null) {
                // Nastav text
                controls.textareaZprava.defaultValue = odpoved.text;
                controls.textareaZprava.value = odpoved.text;
                // Nastav alianci
                controls.inputAliance.value = odpoved.aliance;
            }
            else {
                console.log("Nenalezena zprava %s v cache.", page.arguments["odpoved"]);
            }
        }
        
        // Oddelovac stare posty
        var psal = page.arguments["psal"];
        if (psal != null) {
            var newText = "\n" + Posta.ODDELOVAC + "\n";
            newText += "Psal " + unescape(psal) + ":\n\n";
            newText += controls.textareaZprava.defaultValue.replace(/\n{2}/g, "\n");
            
            controls.textareaZprava.value = newText;
            
            // Odskrtni prilozeni podpisu
            if (controls.inputPodpis != null)
                controls.inputPodpis.checked = false;
        }
        
        // Odstraneni newline na konci textu pri odeslani
        Event.observe(controls.form, "submit", function() {
            controls.textareaZprava.value = controls.textareaZprava.value.replace(/\n{2,}$/, "");
        });
        
        // Focus
        controls.textareaZprava.selectionStart = 0;
        controls.textareaZprava.selectionEnd = 0;
        controls.textareaZprava.focus();
    }
}));

// Analyza zprav
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Analyza zprav"; },

    analyze: function(page, context) {
        if (page.arguments["posta"] != null && page.arguments["posta"] != "nova")
            return false;
            
        var tableZpravyList = $XL('form/table[@bgcolor = "#202020"]', page.content);
        var zpravy = new Array();
        
        // Analyzuj jednotlive zpravy
        for (var i = 0; i < tableZpravyList.length; i++) {
            var zprava = ElementDataStore.get(tableZpravyList[i]);
            
            // Zjisti informace o zprave
            var trHeader = zprava.element.rows[0];
            
            zprava.trHeader = trHeader;
            zprava.linkOd = $X('td[1]//a', trHeader);
            zprava.linkOdpovedet = $X('td//a[. = "Odpovědět"]', trHeader);
            zprava.linkPredat = $X('td//a[. = "Předat"]', trHeader);
            zprava.fontCas = $X('td[2]/font[2]', trHeader);
            zprava.fontText = $X('tbody/tr[2]/td/p/font', zprava.element);
            
            zprava.typ = trHeader.className.match(/(?:_([a-zA-Z]+))?$/)[1];
            zprava.od = (zprava.linkOd != null) ? zprava.linkOd.textContent : null;
            zprava.psal = trHeader.cells[0].textContent.replace(/\s+\(/g, " (");
            zprava.id = parseInt(zprava.linkPredat.href.match(/\bpredat=(\d+)\b/)[1]);
            zprava.cas = this._parseDate(zprava.fontCas.textContent);
            zprava.text = zprava.fontText.innerHTML.replace(/<br\/?>/g, "\n").stripTags();
            
            var m = zprava.text.match(Posta.DULEZITOST_REGEX);
			if (m != null) {		
			    zprava.dulezitost = m[1].toLowerCase();
			    zprava.text = zprava.text.replace(Posta.DULEZITOST_REGEX, "").replace(/^\s*?\n/, "");
			}
             
            console.info("Zprava %d: od=%d typ=%s dulezitost=%s, delka=%d cas=%s", zprava.id, zprava.od, zprava.typ, zprava.dulezitost, zprava.text.length, zprava.cas.toLocaleString());
            
            zpravy.push(zprava);
        }
        
        page.posta = {
            zpravy: zpravy,
            config: page.config.getPrefNode("posta", true)
        };
        
        return true;
    },
    
    process: null,
    
    _parseDate: function(text) {
        if (text == null)
            return null;
        
        text = text.replace(/^\s*(\d{1,2})[.]\s*(\d{1,2})[.]/, "$2/$1/"); // Nova
        text = text.replace(/-(\d{1,2})-(\d{1,2})/, "/$1/$2").replace(/^\s+/, ""); // Stara
        return new Date(Date.parse(text));
    }
}));


// Zpravy - uprava linku v hlavicce
pageExtenders.add(PageExtender.create({
    POSTA_V_RAMCI_ALIANCE_REGEX: new RegExp("(?:pošta v rámci aliance (.*))?$"),

    getName: function() { return "Posta - Linky"; },

    analyze: function(page, context) {
        if (page.posta == null || page.posta.zpravy == null)
            return false;

        return page.posta.zpravy.length > 0;
    },
    
    process: function(page, context) {
        var _this = this;
    
        // Uprava linku
        page.posta.zpravy.each(function(zprava) {
            var psal = "&psal=" + escape(zprava.psal);
            
            // Odpovedet vsem
            if (zprava.typ == "verejna" || zprava.typ == "tajna") {
                // Data
                var jmenoAliance = zprava.text.match(_this.POSTA_V_RAMCI_ALIANCE_REGEX)[1];
                if (!jmenoAliance) {
	                console.log("text:\n", zprava.text);
                }
                
                var aliance = MaData.najdiAlianci(jmenoAliance);
                
                var data = {
                    aliance: (aliance != null) ? aliance.id : null,
                    text: zprava.text.replace(_this.POSTA_V_RAMCI_ALIANCE_REGEX, "")
                };
                
                if (data.aliance != null) {           
                    // Vytvor link
                    var linkOdpovedetVsem = Element.create("a", "Odpovědět všem");
                    linkOdpovedetVsem.href = MaPlus.buildUrl(page, "posta.html", { posta: "posta_v_ally", odpoved: zprava.id });
                    linkOdpovedetVsem.href += psal;
                    
                    // Ulozeni zpravy
                    Event.observe(linkOdpovedetVsem, "click", function() {
                        DataCache.store("posta_" + zprava.id, data, true); 
                    });
                    
                    // Zobraz link
                    var root = zprava.linkPredat.parentNode;
                    root.insertBefore(document.createTextNode(" "), root.firstChild);
                    root.insertBefore(linkOdpovedetVsem, root.firstChild);
                    zprava.linkOdpovedetVsem = linkOdpovedetVsem;
                }
                else {
                    console.debug("Nenalezeno id aliance %o", jmenoAliance);
                }
            }
            
            // Psal
            if (zprava.linkOdpovedet != null)
                zprava.linkOdpovedet.href += psal;
            zprava.linkPredat.href += psal;
            
            // Aktivni id
            if (zprava.linkOd != null && zprava.od != null) {
                var aktivniId = MaPlus.Tooltips.createActiveId(page, zprava.od);
                zprava.linkOd.parentNode.replaceChild(aktivniId, zprava.linkOd);
                zprava.linkOd = aktivniId;
            }
            
            // Oprav datum ve stare poste
            if (page.arguments["posta"] != "nova") {
            	var c = zprava.cas;
            	zprava.fontCas.innerHTML = String.format("&nbsp;&nbsp;{0}.{1}.{2} {3}:{4}:{5}", c.getDate(), c.getMonth(), c.getFullYear(), c.getHours().toPaddedString(2), c.getMinutes().toPaddedString(2), c.getSeconds().toPaddedString(2));
            }
        });
    }
}));

// Aktivni linky
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Aktivni url"; },

    analyze: function(page, context) {
        if (page.posta == null || page.posta.zpravy == null)
            return false;

        return page.posta.config.getBoolean("linky", true);
    },
    
    process: function(page, context) {
        page.posta.zpravy.each(function(zprava) {
            if (zprava.typ == "posel")
                return;
            
            var newHTML = zprava.fontText.innerHTML.replace(/http(?:s?):\/\/\S+?(?=\s|$|<)/g, '<a href="$&" target="_blank" onclick="return confirm(\'' + Posta.LINK_CONFIRM_TEXT + '\');">$&</a>');
            zprava.fontText.innerHTML = newHTML;
        });
    }
}));

// Roztahovani posty
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Roztahovani zprav"; },

    analyze: function(page, context) {
    	if (page.posta == null || page.posta.zpravy == null)
            return false;
            
        if (!page.posta.config.getBoolean("roztahovani", true))
        	return false;
    
    	// Vytvor seznam zprav ktere jsou siroke a mohou potencionalne roztahovat stranku
    	context.sirokeZpravy = new Array();
    	
    	page.posta.zpravy.each(function(zprava) {
    		zprava.jeSiroka = (zprava.fontText.offsetWidth > window.innerWidth * 0.81);
    		if (zprava.jeSiroka)
    			context.sirokeZpravy.push(zprava);
    	});
    	
    	return context.sirokeZpravy.length > 0;
    },
    
    process: function(page, context) {
    	// Nastav vsem scroll
    	context.sirokeZpravy.each(function(zprava) {
    		var newHTML = '<div style="overflow-x: scroll;">' + zprava.fontText.innerHTML + '</div>'
    		zprava.fontText.innerHTML = newHTML;
    		zprava.divText = zprava.fontText.firstChild;
    	});
    	
    	// Pak auto
    	context.sirokeZpravy.each(function(zprava) {
    		zprava.divText.style.overflowX = 'auto';
    	});
    	
    	// Dodatek: Tenhle postup donuti FF prekreslit dane elementy, a zobrazi scrollbary pouze
    	// u opravdu sirokych zprav
    }
}));

// Dulezitost zpravy (odstrani text dulezitosti ze zpravy a upravi hlavicku)
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Dulezitost zpravy"; },

    analyze: function(page, context) {
    	if (page.posta == null || page.posta.zpravy == null)
            return false;
            
		return true;
    },
    
    process: function(page, context) {
		page.posta.zpravy.each(function(zprava) {
			if (zprava.dulezitost != null) {
				switch (zprava.dulezitost) {
					case "dulezite":
						
						break;

					case "spam":
						// TODO
						break;

					case "bestiar":
						// TODO
						break;
				
					default:
						console.log("Neznama dulezitost zpravy %d: %s", zprava.id, zprava.dulezitost);
						return;
				}
				
				// Najdi textovy element ktery obsahuje dulezitost
				var textNode = zprava.fontText;
				while (textNode != null && textNode.nodeType != 3)
				    textNode = textNode.firstChild;
				
				// Odstran popisek dulezitosti
				if (textNode != null) {
                    textNode.nodeValue = textNode.nodeValue.replace(Posta.DULEZITOST_REGEX, "");
                    
                    // Odstran prebytecne newline
                    if (textNode.nodeValue == "") {
                        var parent = textNode.parentNode;
                        parent.removeChild(textNode);
                        while (parent.firstChild != null && parent.firstChild.tagName == "BR")
                            parent.removeChild(parent.firstChild);
                    }
                }
			}
		});
    }
}));

// Sbaleni dlouhych zprav
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Sbaleni"; },

    analyze: function(page, context) {
        if (page.posta == null || page.posta.zpravy == null)
            return false;
        
        context.maxRadku = page.posta.config.getNumber("maxRadku", MAX_RADKU_DEFAULT);
        if (!(context.maxRadku > 0))
            return false;
    	
    	context.zobrazRadku = Math.max(context.maxRadku - 5, 1);
    	context.dlouheZpravy = new Array();
    	
    	// Najdi zpravy s velkym poctem radku
    	page.posta.zpravy.each(function(zprava) {
    		// Preskoc nove zpravy od posla
    		if (zprava.typ == "posel" && page.arguments["posta"] == "nova")
    			return; // continue
    	
    		var html = zprava.fontText.innerHTML;
    	
    	    // Zjisti pocet radku
    	    var radku = 0;
    	    var zlomIndex = -1;  
    	    
    	    var r = /<br\/?>/g;
    	    var m;
    	    
    	    while (radku < context.maxRadku && (m = r.exec(html)) != null) {
    	    	++radku;
    	    	if (radku > context.zobrazRadku && zlomIndex < 0)
    	    		zlomIndex = r.lastIndex;
    	    }
    	    
    	    if (zlomIndex > 0 && radku >= context.maxRadku) {
     	    	context.dlouheZpravy.push({
    	    		zprava: zprava,
    	    		zlomIndex: zlomIndex
    	    	});
    	    	
    	    	console.log("Zprava %d je dlouha.", zprava.id);
    	    }
    	});
    	
    	// Najdi spravy s dulezitosti SPAM ktere uz vyprseli
    	var maxStariSpamu = page.posta.config.getNumber("maxStariSpamu", 30*60); // default=30min

    	if (maxStariSpamu > 0) {
    	    var aktualniCas = new Date();
        	
    	    page.posta.zpravy.each(function(zprava) {
                var stari = (aktualniCas.getTime() - zprava.cas.getTime()) / 1000;
    	        
                if (zprava.dulezitost == "spam" && stari > maxStariSpamu) {
    		        var r = /<br\/?>/g;
    		        
    		        if (r.exec(zprava.fontText.innerHTML) != null) {
    		            context.dlouheZpravy.push({
    	    		        zprava: zprava,
    	    		        zlomIndex: r.lastIndex
    	    	        });
    		        }
    		    
    		        console.log("Zprava %d je prosly spam (stari %ds)", zprava.id, stari);
    		    }
    	    });
    	}
    	
    	return context.dlouheZpravy.length > 0;
    },
    
    process: function(page, context) {
    	context.dlouheZpravy.each(function(i) {
    		var zprava = i.zprava;
    		var zlomIndex = i.zlomIndex;
    		var html = zprava.fontText.innerHTML;
    		
    		// Pozn: u posla se najde vetsinou zlom nekde uvnitr <font>, cimz se
    		// rozesere html, nicmene FF to zvladne a udela zlom az ten tag skonci
    		// (coz muze byt o dost niz, ale opravit to by byl dost horor takze na to zatim kaslu)
    		
    		// TODO: Prochazet to nikoliv podle html ale podle child nodu a az u tech zkoumat innerHTML
    		
    		// Link v hlavicce
    		var linkHeaderRozbalit = Element.create("a", "Rozbalit", {href: "javascript://"});
			
    		// Telo zpravy
    		var divZacatek = Element.create("div", html.substring(0, zlomIndex));
    		var divZbytek = Element.create("div", html.substring(zlomIndex));
    		divZbytek.style.display = "none";
    		
    		// Link Rozbalit pod zpravou
    		var divRozbalit = Element.create("div", '...........&nbsp;&nbsp;');
    		var linkRozbalit = Element.create("a", '<i style="color: yellow;">Zobrazit celou zprávu</i></a>', {href: "javascript://"});
    		divRozbalit.appendChild(linkRozbalit);
    		
    		// Eventy
    		var toggle = function(event) {
    			if (divZbytek.style.display == "none") {
    				// Zobrazit
    				divZbytek.style.display = "";
    				divRozbalit.style.display = "none";
    				linkHeaderRozbalit.innerHTML = "Sbalit";
    			}
    			else {
    				// Skryt
    				divZbytek.style.display = "none";
    				divRozbalit.style.display = "";
    				linkHeaderRozbalit.innerHTML = "Rozbalit";
    			}
    		};
    		
    		Event.observe(linkHeaderRozbalit, 'click', toggle);
    		Event.observe(linkRozbalit, 'click', toggle);
    		
    		// Zobraz
    		zprava.fontText.innerHTML = "";
    		zprava.fontText.appendChild(divZacatek);
    		zprava.fontText.appendChild(divZbytek);
    		zprava.fontText.appendChild(divRozbalit);
    		
    		var header = zprava.linkPredat.parentNode;
			header.insertBefore(document.createTextNode(" "), header.firstChild);
			header.insertBefore(linkHeaderRozbalit, header.firstChild);
    	});
    }
}));

