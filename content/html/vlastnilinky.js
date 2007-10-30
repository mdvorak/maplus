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

/*** NastaveniVlastniLinky class ***/

window.NastaveniVlastniLinky = {
    init: function(content, pridat) {
        this.content =  $(content);
        if (this.content == null)
            throw new ArgumentNullException("content");
            
        this.linkPridat = $(pridat);
        if (this.linkPridat == null)
            throw new ArgumentNullException("pridat");
        
        // Handler pro pridani zaznamu
        var addLink = this.addLink.bind(this);
        Event.observe(this.linkPridat, "click", function(event) {
            addLink();
        });
    },
    
    // Tahle funkce je volana extenderem
    initPage: function(page) {
        if (page == null)
            throw new ArgumentNullException("page");
            
        this.localConfig = page.localConfig;
    },

    reset: function() {
        // Vycisti tabulku
        while(this.content.firstChild != null)
            this.content.removeChild(this.content.firstChild);
    },
    
    onload: function(config) {
        var content = this.content;
        this.reset();
            
        // Nacti data
        var links = config.evalPrefNodeList('url[text]');
        var poradi = 0;
        var barvaRadku = $('n_barvaRadku').getAttribute("bgcolor");
        var createRecord = this.createRecord.bind(this);
        
        links.each(function(i) {
            // Optimilizace rychlosti
            var data = Marshal.callMethod("ConfigMenuHelper", "getLinkData", [i]);
            
            // Vytvor novy radek
            var record = createRecord();
            record.setPoradi(++poradi);
            record.setData(data);
            
            if ((poradi % 2) == 0)
                record.element.setAttribute("bgcolor", barvaRadku);
            
            content.appendChild(record.element);
        });
    },
    
    onsave: function(config) {
        var content = this.content;
        
        // Serad zaznamy podle poradi
        var rows = $A(content.rows);
        rows.sort(function(r1, r2) {
            var d1 = ElementDataStore.get(r1);
            var d2 = ElementDataStore.get(r2);
        
            return Object.compare(d1.getPoradi(), d2.getPoradi());
        });
        
        // Uloz zaznamy do configu
        config.clearChildNodes();
        
        rows.each(function(tr) {
            var row = ElementDataStore.get(tr);
            if (typeof row.getData != "function")
                return; // continue;
            
            var data = row.getData();
            if (data.text == null || data.text.blank())
                return; // continue;
            
            var cfg = config.addPref("url");
            LinkData.toConfig(data, cfg);
        });
    },
    
    addLink: function() {
        var content = this.content;
        var createRecord = this.createRecord.bind(this);
        var editRecord = this.editRecord.bind(this);
        var barvaRadku = $('n_barvaRadku').getAttribute("bgcolor");
        
        // Zjisti nejvetsi poradi
        var poradi = 0;
        var rows = $A(content.rows);
        rows.each(function(tr) {
            poradi = Math.max(poradi, ElementDataStore.get(tr).getPoradi());
        });
        ++poradi;
        
        // Zobraz dialog pro vyber typu linku
        var vyberDialog = new SelectLinkDialog();
        vyberDialog.show(function(editorName) {
            if (editorName == null || editorName.blank())
                return;
        
            // Zobraz novy zaznam
            var record = createRecord();
            record.setPoradi(poradi);
            record.setData({editor: editorName});
            
            if ((poradi % 2) == 0)
                record.element.setAttribute("bgcolor", barvaRadku);
            
            // Zobraz dialog pro editaci dat
            editRecord(record, function() {
                content.appendChild(record.element);
            });
        });
    },
    
    editRecord: function(record, callback) {
        var data = record.getData();
        var dialog = new LinkEditorDialog(data.editor, this.localConfig);
        dialog.create();
        
        // Set previous data
        dialog.setData(data);
        
        // Show dialog
        dialog.show(function(returnValue) {
            if (returnValue) {
                record.setData(dialog.getData());
                if (callback != null)
                    callback();
            }
            
            dialog.close();
        });
    },
    
    createRecord: function() {
        var tr = Element.create("tr");
        var record = ElementDataStore.get(tr);
        
        // Vytvor datove elementy
        record.poradi = Element.create("input", null, {type: "text", style: "width: 30px; text-align: center;", title: "Pořadí"});
        record.text = Element.create("input", null, {type: "text", style: "width: 200px; text-align: center;", title: "Text"});
        record.externi = Element.create("input", null, {type: "checkbox", title: "Externí link", disabled: "disabled"});
        record.noveokno = Element.create("input", null, {type: "checkbox", title: "Otevřít v novém okně"});
        record.upravit = Element.create("a", '<img src="' + CHROME_CONTENT_URL + 'html/img/copy.png" alt="" class="link" />', {href: "javascript://", title: "Upravit"});
        record.odstranit = Element.create("a", '<img src="' + CHROME_CONTENT_URL + 'html/img/remove.png" alt="" class="link" />', {href: "javascript://", title: "Odstranit"});
        
        // Pridej je do sloupcu
        tr.appendChild(Element.create("td")).appendChild(record.poradi);
        tr.appendChild(Element.create("td")).appendChild(record.text);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.externi);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.noveokno);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.upravit);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.odstranit);
        
        // Event handlery
        var editRecord = this.editRecord.bind(this);
        Event.observe(record.upravit, "click", function(event) {
            editRecord(record);
        });
        
        Event.observe(record.odstranit, "click", function(event) {
            tr.parentNode.removeChild(tr);
        });

        // Vlastnosti        
        record.setPoradi = function(poradi) {
            record.poradi.value = poradi;
        };
        record.getPoradi = function() {
            return parseFloat(record.poradi.value);
        };

        record.setData = function(linkData) {
            record._url = linkData.url;
            record.text.value = linkData.text || "";
            record.externi.checked = linkData.externi;
            record.noveokno.checked = linkData.noveokno;
            record._title = linkData.title;
            record._editor = linkData.editor;
        };
        record.getData = function() {
            return new LinkData(record._url, record.text.value, record._title, record.externi.checked,
                                record.noveokno.checked, record._editor);
        };
        
        return record;
    }
};


/*** SelectLinkDialog class ***/
var SelectLinkDialog = Class.inherit(Dialog);

Object.extend(SelectLinkDialog.prototype, {
    _createContentElement: function() {
        var html = Chrome.loadText("html/newlinkdialog.html", true);
        var root = Element.create("div", html, {class: "linkDialog"});
        
        var dialog = this;
        var select = $X('.//select[@id = "d_typOdkazu"]', root);
        var inputZrusit = $X('.//input[@id = "d_zrusit"]', root);
        var inputVytvorit = $X('.//input[@id = "d_vytvorit"]', root);
        
        // Napln select
        for (var i in LinkEditors) {
            select.options.add(new Option(LinkEditors[i].title, i));
        }
        
        // Event handlery
        Event.observe(inputZrusit, "click", function() {
            dialog.close(null);
        });
        
        Event.observe(inputVytvorit, "click", function() {
            dialog.close(select.value);
        });
        
        return root;
    },
    
    validate: function(returnValue) {
        if (returnValue != null && returnValue.blank())
            throw "Prosím vyberte typ odkazu.";
    }
});


/*** LinkEditorDialog class ***/
var LinkEditorDialog = Class.inherit(Dialog);

Object.extend(LinkEditorDialog.prototype, {
    initialize: function(editorName, localConfig) {
        if (LinkEditors[editorName] == null)
            editorName = "default";
        if (localConfig == null)
            throw new ArgumentNullException("localConfig");
        
        this._localConfig = localConfig;
        this._editorName = editorName;
        this._editor = LinkEditors[editorName];
    },
    
    getData: function() { throw new InvalidOperationException("Dialog is not created."); },
    setData: function(data) { throw new InvalidOperationException("Dialog is not created."); },
    validate: function(returnValue) { },
    
    _createContentElement: function() {
        var _this = this;
    
        var html = Chrome.loadText("html/linkeditor.html", true);
        var root = Element.create("div", html, {class: "linkDialog", style: "width: 465px;"});
    
        // Ziskej elementy
        var spanEditor = $X('.//span[@id = "d_editor"]', root);
        var inputText = $X('.//input[@id = "d_text"]', root);
        var inputPopisek = $X('.//input[@id = "d_popisek"]', root);
        var inputNoveokno = $X('.//input[@id = "d_noveokno"]', root);
        var inputExterni = $X('.//input[@id = "d_externi"]', root);
        
        // Nastav popisek editoru
        spanEditor.innerHTML = this._editor.title;
        // Nastav vychozi text
        inputText.value = this._editor.defaultText || "";
        // Zobraz externi check
        if (this._editorName == "default") {
            $XL('.//*[@class = "externi"]', root).each(function(i) { i.style.display = ""; });
            inputExterni.checked = true;
        }
        
        // Custom content
        var tdCustomContent = $X('.//td[@id = "d_customcontent"]', root);
        var editorData = this._editor.create(tdCustomContent, this._localConfig);
    
        // Ulozit/Zrusit
        var inputZrusit = $X('.//input[@id = "d_zrusit"]', root);
        var inputUlozit = $X('.//input[@id = "d_ulozit"]', root);
    
        Event.observe(inputZrusit, "click", function() {
            _this.hide(false);
        });
        
        Event.observe(inputUlozit, "click", function() {            
            _this.hide(true);
        });
        
        // Pokud danemu editoru neco chyby, vrati null
        if (editorData != null) {
            this.getData = function() {
                // Odstran pripadne z url bordel
                var str = editorData.get();
                if (!inputExterni.checked && str.substring(0, MELIOR_ANNIS_URL.length) == MELIOR_ANNIS_URL) {
                    var url = parseUrl(str);
                    
                    // Sestav znovu url
                    str = url.name;
                    var and = "?";
                    url.arguments.each(function([key, value]) {
                        if (value == null || value == "")
                            return;
                        if (key == "id" || key == "ftc" || key == "code")
                            return;
                    
                        str += and + key + "=" + value;
                        and = "&";
                    });
                }
            
                return new LinkData(str,
                                    inputText.value,
                                    inputPopisek.value,
                                    inputExterni.checked,
                                    inputNoveokno.checked,
                                    _this._editorName);
            };
            
            this.setData = function(data) {
                editorData.set(data.url);
                if (data.text != null) inputText.value = data.text;
                if (data.title != null) inputPopisek.value = data.title;
                inputNoveokno.checked = !!data.noveokno;
                inputExterni.checked = !!data.externi;
            };
            this.validate = function(returnValue) { 
                if (returnValue) {
                    if (inputText.value.blank())
                        throw 'Text linku musí být vyplněn.';
                    
                    editorData.validate();
                }
            };
        }
        else {
            this.getData = function() { };
            this.setData = function(data) { };
            this.validate = function(returnValue) { 
                if (returnValue) throw new Exception("Odkaz nelze vytvořit.");
            };
            inputUlozit.disabled = true;
        }
        
        return root;
    },
        
    destroy: function() {
        base.destroy();
    
        this.getData = function() { throw new InvalidOperationException("Dialog is not created."); };
        this.setData = function(data) { throw new InvalidOperationException("Dialog is not created."); };
        this.validate = function(returnValue) { };
    }
});


var LinkEditors = {
    "text": {
        title: "Text",
        defaultText: "-",
        
        create: function(parent, localConfig) {
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
        
        create: function(parent, localConfig) {
            var kouzla = localConfig.evalPrefNodeList('magie/kouzlo[id and name]');
            
            if (kouzla.length == 0) {
                parent.innerHTML = '<span style="color: orange;">Prosím navštivte prvně menu Kouzla.</span>' +
                                   '<br/>' +
                                   '<span class="small">(Aby se dané kouzlo objevilo v seznamu, musíte na něj mít manu.)</span>';
                return null;
            }
        
            var html = '<input id="d_kolikrat" type="text" name="kolikrat" value="1" size="3"/>' +
                       '<span>&nbsp;x&nbsp;<span>' +
                       '<select id="d_kouzlo" name="seslat_kouzlo">' +
	                   '    <option value=""> - kouzlo - </option>' +
	                   '</select>' +
	                   '&nbsp;seslat na ID #&nbsp;' +
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
                    selectKouzlo.value = args["seslat_kouzlo"] || "";
                    inputKoho.value = args["koho"] || "";
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
        
        create: function(parent, localConfig) {
            var jednotky = localConfig.evalPrefNodeList('armada/jednotka[id and name]');
            
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
        
        create: function(parent, localConfig) {
            return {
                get: function() { return "rekrutovat.html?jednotka=1&kolik=0"; },
                set: function(url) { },
                validate: function() { }
            };
        }
    },
    
    
    // Vychozi
    "default": {
        title: "Vlastní",
        defaultText: "",
        
        create: function(parent, localConfig) {
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

