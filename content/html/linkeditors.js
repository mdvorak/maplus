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
 
var LinkEditors = {
    "text": {
        title: "Text",
        defaultText: "-",
        
        create: function(parent, dataConfig) {
            parent.innerHTML = '<span class="small">Pro prázdný řádek použijte "-" (bez uvozovek).</span>';
        
            return {
                get: function() { return null; },
                set: function(url) { },
                validate: function() { }
            };
        }
    },
    
    
    "seslaniKouzla": {
        title: "Seslání kouzla",
        defaultText: "",
        
        create: function(parent, dataConfig) {
            var kouzla = dataConfig.evalPrefNodeList('magie/kouzlo[id and name]');
            
            if (kouzla.length == 0) {
                parent.innerHTML = '<span style="color: orange;">Prosím navštivte prvně menu Kouzla.</span>' +
                                   '<br/>' +
                                   '<span class="small">(Aby se dané kouzlo objevilo v seznamu, musíte na něj mít manu.)</span>';
                return null;
            }
        
            var html = '<input id="d_kolikrat" type="text" name="kolikrat" value="1" size="3"/>' +
                       '<span>&#xA0;x&#xA0;<span>' +
                       '<select id="d_kouzlo" name="seslat_kouzlo">' +
	                   '    <option value=""> - kouzlo - </option>' +
	                   '</select>' +
	                   '&#xA0;seslat na ID #&#xA0;' +
	                   '<input id="d_koho" type="text" name="koho" maxlength="8" size="5"/>' +
	                   '<br/>' + 
	                   '<span class="small">(Pokud kouzlo není uvedeno v seznamu, znamená to že jste na něj neměli manu v době sbíraní dat v menu Kouzla.)</span>';	                   
            
            parent.innerHTML = html;
        
            var inputKolikrat = $X('.//input[@id = "d_kolikrat"]', parent);
            var selectKouzlo = $X('.//select[@id = "d_kouzlo"]', parent);
            var inputKoho = $X('.//input[@id = "d_koho"]', parent);
        
            // napln select
            kouzla.each(function(i) {
                var o = new Option(i.getPref("name"), i.getNumber("id"));
                selectKouzlo.options.add(o);
            });
            
            return {
                get: function() {
                    return "magie.html?kolikrat=" + inputKolikrat.value + "&seslat_kouzlo=" + selectKouzlo.value + "&koho=" + inputKoho.value;
                },
                set: function(url) {
                    var args = parseUrl(url).arguments;
                    inputKolikrat.value = args["kolikrat"] || "1";
                    inputKoho.value = args["koho"] || "";
                    
                    // Zjisti jestli je kouzlo v selectu
                    var kouzlo = args["seslat_kouzlo"];
                    var nalezeno = false;
                    for (var i = 0; i < selectKouzlo.options.length; i++)
                        nalezeno |= (selectKouzlo.options[i].value == kouzlo);
                    
                    if (!nalezeno)
                        selectKouzlo.options.add(new Option("<aktuální " + kouzlo + ">", kouzlo));
                    
                    selectKouzlo.value = kouzlo || "";
                },
                validate: function() {
                    if (selectKouzlo.value.length == 0)
                        throw new Exception("Prosím vyberte kouzlo.");
                    if (!(parseInt(inputKolikrat.value) > 0))
                        throw new Exception("Počet seslání kouzla musí být číslo > 0.");
                    if (inputKoho.value.length > 0 && isNaN(parseInt(inputKoho.value)))
                        throw new Exception("Cíl kouzla musí být ID hráče.");
                }
            };
        }
    },
    
        
    "rekrutJednotky": {
        title: "Rekrut jednotky",
        defaultText: "",
        
        create: function(parent, dataConfig) {
            var jednotky = dataConfig.evalPrefNodeList('armada/jednotka[id and name]');
            
            if (jednotky.length == 0) {
                parent.innerHTML = '<span style="color: orange;">Prosím navštivte prvně menu Armáda.</span>';
                return null;
            }
        
            var html = '<table cellpadding="0" cellspacing="0" style="width: 100%;">' +
                       '<colgroup>' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '    <col width="10" />' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '</colgroup>' +
                       '<tbody>' +
                       '<tr>' +
                       '    <td><span>Jednotka: </span></td>' +
                       '    <td>' +
                       '        <select id="d_jednotka" type="text" maxlength="200">' +
                       '            <option value="0"> - Rekrutovat - </option>' +
                       '        </select>' + 
                       '    </td>' +
                       '</tr>' +
                       '<tr><td><img height="5" src="chrome://maplus/content/html/img/empty.bmp" alt="" /></td></tr>' +
                       '<tr>' +
                       '    <td><span>Počet: </span></td>' +
                       '    <td><input id="d_pocet" type="text" maxlength="7" /></td>' +
                       '' +
                       '    <td><img width="10" src="chrome://maplus/content/html/img/empty.bmp" alt="" /></td>' +
                       '' +
                       '    <td><span>Tahů: </span></td>' +
                       '    <td><input id="d_tahy" type="text" maxlength="5" /></td>' +
                       '</tr>' +
                       '<tr><td><img height="10" src="chrome://maplus/content/html/img/empty.bmp" alt="" /></td></tr>' +
                       '<tr>' +
                       '    <td colspan="5" style="text-align: center;">' +
                       '        <span class="small">Upozornění: Počet rekrutovaných jednotek nesouvisí s počtem tahů přednastavených na formuláři.</span>' + 
                       '    </td>' +
                       '</tr>' +
                       '</tbody>' +
                       '</table>';
            
            parent.innerHTML = html;
        
            var selectJednotka = $X('.//select[@id = "d_jednotka"]', parent);
            var inputPocet = $X('.//input[@id = "d_pocet"]', parent);
            var inputTahy = $X('.//input[@id = "d_tahy"]', parent);
        
            // napln select
            jednotky.each(function(i) {
                var o = new Option(i.getPref("name"), i.getNumber("id"));
                selectJednotka.options.add(o);
            });
            
            return {
                get: function() {
                    return "rekrutovat.html?jednotka=" + selectJednotka.value + "&tahy=" + inputTahy.value + "&kolik=" + inputPocet.value;
                },
                set: function(url) {
                    var args = parseUrl(url).arguments;
                    selectJednotka.value = args["jednotka"] || "0";
                    inputPocet.value = args["kolik"] || "";
                    inputTahy.value = args["tahy"] || "";
                },
                validate: function() {
                    if (!(parseInt(selectJednotka.value) > 0))
                        throw new Exception("Prosím vyberte jednotku ze seznamu.");
                    if (!(parseInt(inputPocet.value) >= 0))
                        throw new Exception("Počet rekrutovaných jednotek musí být větší než nula.");
                    if (!(parseInt(inputTahy.value) >= 0))
                        throw new Exception("Počet tahů rekrutu musí být větší než nula.");
                }
            };
        }
    },
    
    
    "zrusRekrut": {
        title: "Zruš Rekrut",
        defaultText: "Zruš Rekrut",
        
        create: function(parent, dataConfig) {
            return {
                get: function() { return "rekrutovat.html?jednotka=1&kolik=0"; },
                set: function(url) { },
                validate: function() { }
            };
        }
    },
    
    
    "prehled": {
        title: "Přehled",
        defaultText: "Možné cíle",
        
        create: function(parent, dataConfig) {
            var html = '<table cellpadding="0" cellspacing="0" style="width: 100%;">' +
                       '<colgroup>' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '    <col width="10" />' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '</colgroup>' +
                       '<tbody>' +
                       '<tr>' +
                       '    <td><span>Typ přehledu: </span></td>' +
                       '    <td>' +
                       '        <select id="d_typ" type="text" maxlength="200">' +
                       '            <option value="">Top 20</option>' +
                       '            <option value="vase_umisteni">Vaše umístění</option>' +
                       '            <option value="mozne_cile" selected="true">Možné cíle</option>' +
                       '            <option value="podle_slavy">Podle slávy</option>' +
                       '            <option value="podle_pozemku">Podle pozemků</option>' +
                       '        </select>' + 
                       '    </td>' +
                       '</tr>' +
                       '</tbody>' +
                       '</table>';
            
            parent.innerHTML = html;
            
            var selectTyp = $X('.//select[@id = "d_typ"]', parent);
        
            return {
                get: function() { return "prehled.html?prehled=" + selectTyp.value; },
                set: function(url) {
                    var args = parseUrl(url).arguments;
                    selectTyp.value = args["prehled"] || "";
                },
                validate: function() { }
            };
        }
    },
    
    "hlidka": {
        title: "Hlídka",
        defaultText: "Hlídka ",
        
        create: function(parent, dataConfig) {
            // Vytvor seznam alianci kde jsem clenem
            var aliance = new Array();
        
            // ALIANCE_ID se plni v extenders/nastaveni.js
            ALIANCE_ID.each(function(id) {
                var data = MaData.najdiAlianci(null, id);
                
                if (data != null && data.jmeno != null)
                    aliance.push([id, data.jmeno]);
                else
                    aliance.push([id, id]);
            });
            
            // Pokud nejsem v zadne alianci nemuzu mit hlidku
            if (aliance.length == 0) {
                var html = '<span style="color: orange;">Nejste v žádné alianci.</span>';
                parent.innerHTML = html;
                return null;
            }
            
            parent.innerHTML = '';
            parent.appendChild(Element.create("span", "Hlídka pro alianci:&#xA0;"));
            
            // Select s aliancema
            var select = parent.appendChild(Element.create("select"));
            select.options.add(new Option("", "- Vyberte -"));
            aliance.each(function(i) {
                select.options.add(new Option(i[1], i[0]));
            });
        
            // Upozorneni
            parent.appendChild(Element.create("br"));
            parent.appendChild(Element.create("br"));
            parent.appendChild(Element.create("span", "Upozornění: Pokud nemáte nastavenou hlídku pro danou alianci, zobrazí se pouze výpis aliance.", {"class": "small"}));
        
            return {
                get: function() {
                    return "aliance.html?aliance=vypsat_" + select.value + "&hlidka=true";
                },
                set: function(url) {
                    var data = parseUrl(url);
                    if (data.arguments["aliance"] != null)
                        select.value = data.arguments["aliance"].replace(/vypsat_/, "");
                    else
                        select.value = "";
                },
                validate: function() {
                    if (select.value == "")
                        throw new new Exception("Prosím vyberte alianci ze seznamu.");
                }
            };
        }        
    },
    
    "odehrat": {
        title: "Odehrát",
        defaultText: "",
        
        create: function(parent, dataConfig) {
            var html = '<table cellpadding="0" cellspacing="0" style="width: 100%;">' +
                       '<colgroup>' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '    <col width="10" />' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '</colgroup>' +
                       '<tbody>' +
                       '<tr>' +
                       '    <td><span>Tahů: </span></td>' +
                       '    <td><input id="d_tahu" type="text" maxlength="2" size="3" value="1" /></td>' +
                       '' +
                       '    <td><img width="10" src="chrome://maplus/content/html/img/empty.bmp" alt="" /></td>' +
                       '' +
                       '    <td><span>Objevovat: </span></td>' +
                       '    <td><input id="d_objevovat" type="checkbox" /></td>' +
                       '</tr>' +
                       '<tr><td><img height="10" src="chrome://maplus/content/html/img/empty.bmp" alt="" /></td></tr>' +
                       '<tr>' +
                       '    <td colspan="5" style="text-align: center;">' +
                       '        <span class="small">Upozornění: Tento odkaz přímo odtáhne stanovený počet TU.</span>' + 
                       '    </td>' +
                       '</tr>' +
                       '</tbody>' +
                       '</table>';
            
            parent.innerHTML = html;
            
            var inputTahu = $X('.//input[@id = "d_tahu"]', parent);
            var inputObjevovat = $X('.//input[@id = "d_objevovat"]', parent);
        
            return {
                get: function() {
                    if (inputObjevovat.checked)
                        return "explore.html?kolikwait=" + inputTahu.value;
                    else
                        return "cekat.html?kolikwait=" + inputTahu.value;
                },
                set: function(url) {
                    var data = parseUrl(url);
                    inputObjevovat.checked = String.equals(data.name, "explore.html", true);
                    inputTahu.value = data.arguments["kolikwait"] || 1;
                },
                validate: function() {
                    var tahu = parseInt(inputTahu.value);
                    if (!(tahu > 0))
                        throw "Počet tahů musí být větší než nula.";
                    
                    if (tahu > MAX_TAHU_DEFAULT) {
                        var r = confirm("Opravdu chcete mít odkaz na odehrání " + tahu + " tahů?");
                        if (!r) throw null;
                    }
                }
            };
        }
    },
    
    
    // Vychozi
    "default": {
        title: "Vlastní",
        defaultText: "",
        
        create: function(parent, dataConfig) {
            var html = '<table cellpadding="0" cellspacing="0" style="width: 100%;">' +
                       '<colgroup>' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '    <col width="10" />' +
                       '    <col width="75" />' +
                       '    <col width="145" />' +
                       '</colgroup>' +
                       '<tbody>' +
                       '<tr>' +
                       '    <td><span>Adresa: </span></td>' +
                       '    <td colspan="4"><input id="d_url" type="text" maxlength="200" style="width: 100%; text-align: left;" /></td>' +
                       '</tr>' +
                       '</tbody></table>';
            
            parent.innerHTML = html;
            var inputUrl = $X('.//input[@id = "d_url"]', parent);
        
            return {
                get: function() { return inputUrl.value; },
                set: function(url) { inputUrl.value = url || ""; },
                validate: function() { }
            };
        }
    }
};

