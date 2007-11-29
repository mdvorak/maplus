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
    ODESLANI_DLOUHE_ZPRAVY_CONFIRM_TEXT: "Odesíláte velmi dlouhou zprávu ({0} řádků). Opravdu ji chcete odeslat?",
    POSTA_V_RAMCI_ALIANCE_REGEX: new RegExp("(?:pošta v rámci aliance (.*))?$"),
    DULEZITOST_REGEX: /^:\W*(\w{4,12})\W*\s*/,
    
    zjistiDulezitost: function(zprava) {
        var m = zprava.text.match(Posta.DULEZITOST_REGEX);
	    if (m != null) {		
	        zprava.dulezitost = m[1].toLowerCase();
	        zprava.text = zprava.text.replace(Posta.DULEZITOST_REGEX, "").replace(/^\s*?\n/, "");
	    }
    }
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
        
        controls.form = controls.textareaZprava.form        
        context.controls = controls;
        
        context.extendHtml = Chrome.loadText("html/postapsat.html");
        return true;
    },
    
    process: function(page, context) {
        var controls = context.controls;
        
        // Zjisti dulezitost zpravy
        var dulezitost = page.arguments["dulezitost"];
        if (dulezitost == null) {
            // Pozn: Dulezitost se umyslne ignoruje pri Odpovedet vsem
            var zprava = {
                text: controls.textareaZprava.defaultValue
            };
            Posta.zjistiDulezitost(zprava);
            
            if (zprava.dulezitost != null) {
                controls.textareaZprava.defaultValue = zprava.text;
                controls.textareaZprava.value = zprava.text;
                dulezitost = zprava.dulezitost;
            }
        }
        
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
        
        // Psani zpravy bestiare
        if (parseBoolean(page.arguments["zamluvene_jednotky"])) {
            var vybraneJednotky = Marshal.callMethod("VybraneJednotky", "get", [page.id]).getList();
            console.debug("Vybranych jednotek: %d", vybraneJednotky.length);
            
            // Sestav text
            var text = "";
            vybraneJednotky.each(function(i) {
                text += "\n" + i.text;
            });
            
            controls.textareaZprava.defaultValue = text;
            controls.textareaZprava.value = text;
            controls.inputPodpis.checked = false;
        }
        
        // Klaves. zkratky
        Event.observe(controls.textareaZprava, 'keypress', function(event) {
            if (event.keyCode == Event.KEY_ESC)
                this.value = '';
            else if (event.ctrlKey && event.keyCode == Event.KEY_RETURN)
                this.form.submit();                    
        });
        
        new Insertion.Bottom(controls.form, '<div><span class="small" style="color: gray;">Pozn.: Esc - vymaže napsaný text, Ctrl+Enter - odešle zprávu</span></div>');
        
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
        
        // Dulezitost
        var vybranaDulezitost = function() { return null; }
        
        if (context.extendHtml != null) {
            // Pridej na spravne misto
            var spanDulezitost = Element.create("span", context.extendHtml);
            
            var elem = controls.inputOdeslat.nextSibling;
            if (elem != null) {
                if (elem.tagName == "BR")
                    elem.style.display = "none";
                controls.inputOdeslat.parentNode.insertBefore(spanDulezitost, elem);
            }
            else {
                controls.inputOdeslat.parentNode.appendChild(spanDulezitost);
            }
            
            // Nadefinuj funcknost
            window.DulezitostZpravy.set(dulezitost);
            
            vybranaDulezitost = function() {
                var d = window.DulezitostZpravy.get();
                if (d == "dulezite") d = "!!!DULEZITE!!!";
                else if (d == "normalni") d = null;
                return d;
            }
        }
        
        // Odeslani posty
        Event.observe(controls.form, "submit", function(event) {
            // Odstraneni newline na zacatku a konci textu pri odeslani
            var text = controls.textareaZprava.value.replace(/^\n+|\n{2,}$/g, "");
            
            // Upozorneni pri odesilani dlouhe zpravy
            var m = text.match(/\n/g);
            if (m != null && m.length > MAX_RADKU_DEFAULT) {
                if (!confirm(String.format(Posta.ODESLANI_DLOUHE_ZPRAVY_CONFIRM_TEXT, m.length))) {
                    Event.stop(event);
                    return;
                }
            }
            
            // Pridani dulezitosti
            var d = vybranaDulezitost();
            if (d != null) {
                text = ":" + d + "\n" + text;
            }
            
            controls.textareaZprava.value = text;
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
        
        var tajnaOznacena = false;
        var verejnaOznacena = false;
        
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
            zprava.inputSmazat = $X('td[2]/font/input[starts-with(@name, "smazat_") and @type = "checkbox"]', trHeader);
            zprava.fontText = $X('tbody/tr[2]/td/p/font', zprava.element);
            
            zprava.typ = trHeader.className.match(/(?:_([a-zA-Z]+))?$/)[1];
            zprava.od = (zprava.linkOd != null) ? zprava.linkOd.textContent : null;
            zprava.psal = trHeader.cells[0].textContent.replace(/\s+\(/g, " (");
            zprava.id = (zprava.linkPredat != null) ? parseInt(zprava.linkPredat.href.match(/\bpredat=(\d+)\b/)[1]) : null;
            zprava.cas = this._parseDate(zprava.fontCas.textContent);
            zprava.text = zprava.fontText.innerHTML.replace(/<br\/?>/g, "\n").stripTags();
            
            if (zprava.typ != "posel") {
                Posta.zjistiDulezitost(zprava);
            }
            
            console.info("Zprava %d: od=%d typ=%s dulezitost=%s, delka=%d cas=%s", zprava.id, zprava.od, zprava.typ, zprava.dulezitost, zprava.text.length, zprava.cas.toLocaleString());
            
            zpravy.push(zprava);
            
            // Uloz typ aliance
            if (!tajnaOznacena && zprava.typ == "tajna") {
                var jmenoAliance = zprava.text.match(Posta.POSTA_V_RAMCI_ALIANCE_REGEX)[1];
                if (jmenoAliance != null) {
                    MaData.aktualizujAlianci(jmenoAliance, null, null, "tajna");
                }
                tajnaOznacena = true;
            }
            if (!verejnaOznacena && zprava.typ == "verejna") {
                var jmenoAliance = zprava.text.match(Posta.POSTA_V_RAMCI_ALIANCE_REGEX)[1];
                if (jmenoAliance != null) {
                    MaData.aktualizujAlianci(jmenoAliance, null, null, "verejna");
                }
                verejnaOznacena = true;
            }
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
        
        var alianceCache = new Hash();

        // Uprava linku
        page.posta.zpravy.each(function(zprava) {
            var psal = "&psal=" + encodeURIComponent(zprava.psal);
            
            // Odpovedet vsem
            if (zprava.typ == "verejna" || zprava.typ == "tajna") {
                // Data
                var jmenoAliance = zprava.text.match(Posta.POSTA_V_RAMCI_ALIANCE_REGEX)[1];
                if (!jmenoAliance) {
	                // console.debug("text:\n", zprava.text);
                }
                
                var aliance = alianceCache[jmenoAliance];
                if (aliance == null) {
                    aliance = MaData.najdiAlianci(jmenoAliance);
                    alianceCache[jmenoAliance] = aliance;
                }
                
                var data = {
                    aliance: (aliance != null) ? aliance.id : null,
                    text: zprava.text.replace(Posta.POSTA_V_RAMCI_ALIANCE_REGEX, "")
                };
                
                if (data.aliance != null) {           
                    // Vytvor link
                    var linkOdpovedetVsem = Element.create("a", "Odpovědět všem");
                    linkOdpovedetVsem.href = MaPlus.buildUrl(page, "posta.html", { posta: "posta_v_ally", odpoved: zprava.id, dulezitost: zprava.dulezitost });
                    linkOdpovedetVsem.href += psal;
                    
                    // Ulozeni zpravy
                    Event.observe(linkOdpovedetVsem, "click", function() {
                        DataCache.store("posta_" + zprava.id, data, true); 
                    });
                    
                    // Zobraz link
                    var root = zprava.linkPredat.parentNode;
                    root.insertBefore(document.createTextNode("\xA0\xA0"), root.firstChild);
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
            if (zprava.linkPredat != null)
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
            	zprava.fontCas.innerHTML = String.format("\xA0\xA0{0}.\xA0{1}.\xA0{2} {3}:{4}:{5}", c.getDate(), c.getMonth() + 1, c.getFullYear(), c.getHours().toPaddedString(2), c.getMinutes().toPaddedString(2), c.getSeconds().toPaddedString(2));
            }
        });
        
        // Oprav tlacitko Smazat oznacenou :)
        var tdSo = $X('.//td[font/input[@type = "submit" and @name = "so"]]', page.content);
        if (tdSo != null) {
            tdSo.style.verticalAlign = 'top';
        }
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
        var linkRegex = /http(?:s?):\/\/\S+?(?=\s|$|<)/g;
        var idRegex = /\((\d{4,6})\)|\b(ID|[FBMCZS])\s*(\d{4,6})\b/g;
        
        var found = false;
        var linkReplacer = function(str) {
            found = true;
            return '<a href="' + str + '" target="_blank" onclick="return confirm(\'' + Posta.LINK_CONFIRM_TEXT + '\');">' + str + '</a>';
        };
        var idReplacer = function(str, p1, p2, p3) {
            found = true;
            if (p1.length > 0)
                return '(<a href="javascript://" playerid="' + p1 + '">' + p1 + '</a>)'
            else 
                return p2 + ' <a href="javascript://" playerid="' + p3 + '">' + p3 + '</a>'
        };
    
        page.posta.zpravy.each(function(zprava) {
            // Needituj zpravy z bestiare
            if (zprava.dulezitost == "bestiar")
                return; //continue;
        
            var test = false;
            
            // Neloguj to
            var snapshot = XPath.evaluate('.//text()', zprava.fontText, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, true);
            
            for (var i = 0; i < snapshot.snapshotLength; i++) {
                var element = snapshot.snapshotItem(i);
                
                // Mensi workaround (found se nasetuje replacerem)
                found = false;
                var text = element.nodeValue;
                
                // Linky
                text = text.replace(linkRegex, linkReplacer);
                // Aktivni id ve zpravach 
                text = text.replace(idRegex, idReplacer);
            
                if (found) {
                    var font = Element.create("font", text);
                    element.parentNode.replaceChild(font, element);
                    test = true;
                }
            }
            
            if (test) {
                // Pridej handler linkum
                $XL('.//a[@playerid]', zprava.fontText).each(function(link) {
                    var id = parseInt(link.getAttribute("playerid"));
                    MaPlus.Tooltips.createActiveId(page, id, link);
                });
            }
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
    	    var container = zprava.fontText.parentNode;
    	    var div = Element.create("div", null, {style: "overflow-x: scroll;"});
    	    
    	    div.appendChild(zprava.fontText);
    	    container.appendChild(div);
    	    
    		zprava.divText = div;
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
						zprava.trHeader.className += " zprava_dulezita";
						break;

					case "spam":
						zprava.trHeader.className += " zprava_spam_" + zprava.typ;
						zprava.element.className += " zprava_spam";
						if (zprava.linkOd != null) zprava.linkOd.className += " zprava_spam";
						if (zprava.linkOdpovedet != null) zprava.linkOdpovedet.className += " zprava_spam";
						if (zprava.linkPredat != null) zprava.linkPredat.className += " zprava_spam";
						if (zprava.linkOdpovedetVsem != null) zprava.linkOdpovedetVsem.className += " zprava_spam";
						break;

					case "bestiar":
						zprava.trHeader.className += " zprava_bestiar";
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


// Analyza dlouhych zprav
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Analyza dlouhych zprav"; },

    analyze: function(page, context) {
        if (page.posta == null || page.posta.zpravy == null)
            return false;
        
        context.maxRadku = page.posta.config.getNumber("maxRadku", MAX_RADKU_DEFAULT);
        if (!(context.maxRadku > 0))
            return false;
    	
    	var zobrazRadku = Math.max(context.maxRadku - 5, 1);
    	var nebalitZpravyOdPosla = page.posta.config.getBoolean("nebalitPosla", false);
    	
    	// Najdi zpravy s velkym poctem radku
    	page.posta.zpravy.each(function(zprava) {
    		// Preskoc nove zpravy od posla
    		if (zprava.typ == "posel" && (nebalitZpravyOdPosla || page.arguments["posta"] == "nova"))
    			return; // continue
    	
    	    zprava.radku = 0;
    	    var zlom = null;
    	
    	    for (var i = 0; i < zprava.fontText.childNodes.length; i++) {
    	        var element = zprava.fontText.childNodes[i];
    	        
    	        // Pripocti radky
    	        if (String.equals(element.tagName, "br", true))
    	            zprava.radku++;
    	        else if (element.firstChild != null)
    	            zprava.radku += XPath.evalNumber('count(.//br)', element);
    	        
    	        // Oznac zlomovy element
    	        if (zlom == null && zprava.radku > zobrazRadku)
                    zlom = element;
    	        
    	        // Nepokracuj v analyze pokud je zprava dlouha
    	        if (zprava.radku > context.maxRadku)
    	            break;
    	    }
    	
    	    if (zlom != null && zprava.radku > context.maxRadku) {
    	        zprava.dlouha = true;
    	        zprava.zlom = zlom;
    	    
    	    	console.log("Zprava %d je dlouha (%d radku).", zprava.id, zprava.radku);
    	    }
    	});
    },
    
    process: null
}));


// Skryj/sbal zpravy
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - Skryt/sbalit neaktualni zpravy"; },

    analyze: function(page, context) {
    	if (page.posta == null || page.posta.zpravy == null)
            return false;
        if (page.posta.zpravy.length == 0)
            return false;
        
        var aktualniCas = new Date().getTime();
        var maxStariSpamu = page.posta.config.getNumber("maxStariSpamu", 60*60) * 1000; // default=60min
        var maxStariBestiar = page.posta.config.getNumber("maxStariBestiar", 30*60) * 1000; // default=30min
        
        context.skryt = new Array();
        context.sbalit = new Array();
        
        var predchoziZprava = null;
        
        page.posta.zpravy.each(function(zprava) {
            var stari = (aktualniCas - zprava.cas.getTime());
            
            if (zprava.dulezitost == "bestiar") {
                if (stari < maxStariBestiar)
                    return; // continue;
                
                console.log("Zprava %d vyprsela a bude skryta.", zprava.id);
                
                zprava.skryta = true;
                context.skryt.push(zprava);
            }
            else if (zprava.dulezitost == "spam") {
                if (stari < maxStariSpamu || zprava.radku < 4)
                    return;
                
                zprava.zlom = $X('br[2]');
                if (zprava.zlom == null)
                    return;
                
                console.log("Zprava %d vyprsela a bude sbalena.", zprava.id);
                zprava.balici = true;
                context.sbalit.push(zprava);
            }
            else if (zprava.dlouha) {
                console.log("Zprava %d je prilis dlouha a bude sbalena.", zprava.id);
                
                zprava.balici = true;
                context.sbalit.push(zprava);
            }
            
            // TODO sblizit zpravy spamu
            
            predchoziZprava = zprava;
        });
        
		return true;
    },
    
    process: function(page, context) {
        var skryteElementy = new Array();
    
        context.skryt.each(function(zprava) {
            var parent = zprava.element.parentNode;
            
            // Odstran volne radky za zpravou
            var elem = zprava.element.nextSibling;
            while (elem != null && elem.tagName == "BR") {
                skryteElementy.push(elem);
                elem.style.display = "none";
                elem = elem.nextSibling;
            }
            
            // Odstran samotnou zpravu
            skryteElementy.push(zprava.element);
            zprava.element.style.display = "none";
            
            console.log("Skryta zprava %d", zprava.id);
        });
        
        context.sbalit.each(function(zprava) {
    		var zlom = zprava.zlom;
    		
    		// Link v hlavicce
    		var linkHeaderRozbalit = Element.create("a", "Rozbalit", {href: "javascript://"});
			
    		// Rozdel telo zpravy
    		var divZbytek = Element.create("div", null, {style: "display: none;"});
    		while(zlom.nextSibling) {
    		    divZbytek.appendChild(zlom.nextSibling);
    		}    		
    		
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
    		zprava.fontText.appendChild(divZbytek);
    		zprava.fontText.appendChild(divRozbalit);
    		
    		var header = zprava.linkPredat.parentNode;
			header.insertBefore(document.createTextNode("\xA0"), header.firstChild);
			header.insertBefore(linkHeaderRozbalit, header.firstChild);
			
            console.log("Sbalena zprava %d", zprava.id);
    	});
    	
    	if (skryteElementy.length > 0) {
    	    var text = 'Některým zprávám (' + skryteElementy.length + ') vypršela platnost a byly skryty.'
    	             + ' Klikněte <a id="plus_zobrazitZpravy" href="javascript://">zde</a> pro jejich zobrazení.';
    	    var upozorneni = MaPlusMenu.zobrazUpozorneni(text);
    	    
    	    var linkZobrazit = $('plus_zobrazitZpravy');
    	    Event.observe(linkZobrazit, "click", function(event) {
    	        skryteElementy.each(function(i) { i.style.display = ""; });
    	        upozorneni.style.display = "none";
    	        console.log("Skryté zprávy byly zobrazeny.");
    	    });
        }
    }
}));


// Smazat specificke typy zprav
pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta -  Smazat zpravy podle typu"; },

    analyze: function(page, context) {
    	if (page.posta == null || page.posta.zpravy == null)
            return false;
        if (page.posta.zpravy.length == 0)
            return false;
        
        context.ovladaniHtml = Chrome.loadText("html/postaovladani.html");
        if (context.ovladaniHtml == null)
            return false;
        
		return true;
    },
    
    process: function(page, context) {    
        // Pomocna funkce
		window.plus_oznacZpravy = function(filter) {
		    page.posta.zpravy.each(function(zprava) {
		        if (zprava.inputSmazat != null) {
		            zprava.inputSmazat.checked = (filter.typy == null || filter.typy.indexOf(zprava.typ) > -1)
		                                         && (filter.dulezitosti == null || filter.dulezitosti.indexOf(zprava.dulezitost) > -1);
		        }
		    });
		};
		
        // TODO
        
        page.content.appendChild(Element.create("div", context.ovladaniHtml));
    }
}));
