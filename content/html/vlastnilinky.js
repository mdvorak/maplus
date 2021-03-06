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
        this.dataConfig = page.config.getData();
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
            var data = Marshal.callMethod("ConfigHelperService", "getLinkData", [i]);
            
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
            }, true);
        });
    },
    
    editRecord: function(record, callback, isNew) {
        var data = record.getData();
        var dialog = new LinkEditorDialog(data.editor, this.dataConfig);
        dialog.create();
        
        // Set previous data
        if (!isNew)
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
            record._potvrzeni = linkData.potvrzeni;
            record._barva = linkData.barva;
        };
        record.getData = function() {
            return new LinkData(record._url, record.text.value, record._title, record.externi.checked,
                                record.noveokno.checked, record._editor, record._potvrzeni, record._barva);
        };
        
        return record;
    }
};


/*** SelectLinkDialog class ***/
var SelectLinkDialog = Class.create(Dialog, {
    _createContentElement: function() {
        var html = Chrome.loadHtml("html/newlinkdialog.html", true);
        var root = Element.create("div", html, {class: "dialog"});
        
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
var LinkEditorDialog = Class.create(Dialog, {
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
    
        var html = Chrome.loadHtml("html/linkeditor.html", true);
        var root = Element.create("div", html, {class: "dialog", style: "width: 465px;"});
    
        // Ziskej elementy
        var spanEditor = $X('.//span[@id = "d_editor"]', root);
        var inputText = $X('.//input[@id = "d_text"]', root);
        var inputPopisek = $X('.//input[@id = "d_popisek"]', root);
        var inputNoveokno = $X('.//input[@id = "d_noveokno"]', root);
        var inputExterni = $X('.//input[@id = "d_externi"]', root);
        var inputBarva = $X('.//input[@id = "d_barva"]', root);
        var inputPotvrzeni = $X('.//input[@id = "d_potvrzeni"]', root);
        
        spanEditor.innerHTML = this._editor.title;
        // Nastav vychozi text
        inputText.value = this._editor.defaultText || "";
        // Zobraz specificke veci
        if (this._editor.showExternal) {
            $XL('.//*[@class = "externi"]', root).each(function(i) { i.style.display = ""; });
        }
        if (this._editor.external) {
            inputExterni.checked = true;
        }
        if (this._editor.disableConfirm) {
            $XL('.//*[@class = "nourl"]', root).each(function(i) { i.style.display = "none"; });
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
                if (str != null && !inputExterni.checked && str.substring(0, MELIOR_ANNIS_URL.length) == MELIOR_ANNIS_URL) {
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
                                    _this._editorName,
                                    inputPotvrzeni.checked,
                                    inputBarva.value);
            };
            
            this.setData = function(data) {
                editorData.set(data.url);
                if (data.text != null) inputText.value = data.text;
                if (data.title != null) inputPopisek.value = data.title;
                inputNoveokno.checked = !!data.noveokno;
                inputExterni.checked = !!data.externi;
                inputPotvrzeni.checked = !!data.potvrzeni;
                if (data.barva != null) inputBarva.value = data.barva;
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
        
    destroy: function($super) {
        $super();
    
        this.getData = function() { throw new InvalidOperationException("Dialog is not created."); };
        this.setData = function(data) { throw new InvalidOperationException("Dialog is not created."); };
        this.validate = function(returnValue) { };
    }
});

