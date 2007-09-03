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
    LINK_CONFIRM_TEXT: "Tento odkaz může vést na stránku s nebezpečným obsahem. Opravdu chcete pokračovat?"
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
        
        // Odpovedet vsem
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
            
            zprava.linkOd = $X('td[1]//a', trHeader);
            zprava.linkOdpovedet = $X('td//a[. = "Odpovědět"]', trHeader);
            zprava.linkPredat = $X('td//a[. = "Předat"]', trHeader);
            zprava.tdText = zprava.element.rows[1].cells[0];
            
            zprava.typ = trHeader.className.match(/(?:_([a-zA-Z]+))?$/)[1];
            zprava.od = (zprava.linkOd != null) ? zprava.linkOd.textContent : null;
            zprava.psal = trHeader.cells[0].textContent.replace(/\s+\(/g, " (");
            zprava.id = parseInt(zprava.linkPredat.href.match(/\bpredat=(\d+)\b/)[1]);
       
            var casText = XPath.evalString('td[2]/font[2]', trHeader);
            zprava.cas = this._parseDate(casText);
            zprava.text = zprava.tdText.innerHTML.replace(/<br\/?>/g, "\n").stripTags();
             
            console.info("Zprava %d: od=%d typ=%s delka=%d", zprava.id, zprava.od, zprava.typ, zprava.text.length);
            
            zpravy.push(zprava);
        }
        
        page.posta = {
            zpravy: zpravy
        };
        
        return true;
    },
    
    process: null,
    
    _parseDate: function(text) {
        if (text == null)
            return null;
        
        text = text.replace(/^\s*(\d{1,2})[.]\s*(\d{1,2})[.]\s*/, "$2/$1/");
        return new Date(Date.parse(text));
    }
}));


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
        });
    }
}));











pageExtenders.add(PageExtender.create({
    getName: function() { return "Posta - "; },

    analyze: function(page, context) {
    },
    
    process: function(page, context) {
    }
}));