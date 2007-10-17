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

var NastaveniVlastniLinky = {
    init: function(content, pridat) {
        this.content = $(content);
        if (this.content == null)
            throw new ArgumentNullException("content");
            
        this.linkPridat = $(pridat);
        if (this.linkPridat == null)
            throw new ArgumentNullException("pridat");
            
        Event.observe(this.linkPridat, 'click', function() {
            alert("Not implemented.");
        });
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
        var createRecord = this.createRecord;
        
        links.each(function(i) {
            // Optimilizace rychlosti
            var data = Marshal.callMethod("ConfigMenuHelper", "getLinkData", [i]);
            
            // Vytvor novy radek
            var record = createRecord();
            record.setPoradi(++poradi);
            record.setData(data);
            
            // Odstranit event handler
            Event.observe(record.odstranit, "click", function() {
                content.removeChild(record.element);
            });
            
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
            if (row.getData == null)
                return; // continue;
            
            var data = row.getData();
            if (data.text == null || data.text.blank())
                return; // continue;
            
            var cfg = config.addPref("url");
            LinkData.toConfig(data, cfg);
        });
    },
    
    createRecord: function() {
        var tr = Element.create("tr");
        var record = ElementDataStore.get(tr);
        
        // Vytvor datove elementy
        record.poradi = Element.create("input", null, {type: "text", style: "width: 30px; text-align: center;", title: "Pořadí"});
        record.text = Element.create("input", null, {type: "text", style: "width: 100px; text-align: center;", title: "Text"});
        record.url = Element.create("input", null, {type: "text", style: "width: 170px; text-align: left;", title: "Adresa"});
        record.externi = Element.create("input", null, {type: "checkbox", title: "Externí link", disabled: "disabled"});
        record.noveokno = Element.create("input", null, {type: "checkbox", title: "Otevřít v novém okně"});
        record.upravit = Element.create("a", '<img src="' + CHROME_CONTENT_URL + 'html/img/remove.png" alt="" class="link" />', {href: "javascript://", title: "Upravit"});
        record.odstranit = Element.create("a", '<img src="' + CHROME_CONTENT_URL + 'html/img/remove.png" alt="" class="link" />', {href: "javascript://", title: "Odstranit"});
        
        // Pridej je do sloupcu
        tr.appendChild(Element.create("td")).appendChild(record.poradi);
        tr.appendChild(Element.create("td")).appendChild(record.text);
        tr.appendChild(Element.create("td")).appendChild(record.url);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.externi);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.noveokno);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.odstranit);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.upravit);
        
        record.setPoradi = function(poradi) {
            record.poradi.value = poradi;
        };
        record.getPoradi = function() {
            return parseInt(record.poradi.value);
        };
        
        // Definuj getData a setData metody
        record.setData = function(linkData) {
            record.url.value = linkData.url || "";
            record.text.value = linkData.text || "";
            record.externi.checked = linkData.externi;
            record.noveokno.checked = linkData.noveokno;
        };
        
        record.getData = function() {
            return new LinkData(record.url.value, 
                                record.text.value,
                                record.externi.checked,
                                record.noveokno.checked);
        };
        
        return record;
    }
};


var LinkEditorDialog = Class.inherit(Dialog);

Object.extend(LinkEditorDialog.prototype, {
    initialize: function(editorName) {
        this._editorName = editorName;
        this._editor = LinkEditors[editorName];
    },
    
    getData: function() {
    },
    
    setData: function(linkData) {
        this._data = linkData;
    },
        
    _createContentElement: function() {
        var _this = this;
    
        var root = Element.create("div", null, {class: "linkDialog"});
    
        // Zakladni struktura
        const columns = 4;
        var tableLayout = Element.create("table", null, {cellspacing: 0, cellpadding: 0});
        var tbodyLayout = tableLayout.appendChild(Element.create("tbody"));
        
        // Hlavicka
        var tdHeader = tbodyLayout.appendChild(Element.create("tr", null, {style: "vertical-align: top;"})).appendChild(Element.create("td", null, {colspan: columns, style: "border-bottom: solid 1px gray;"}));
        tdHeader.innerHTML = "<b>Upravit odkaz</b>"; // TODO


        // Typ
        var trType = tbodyLayout.appendChild(Element.create("tr"));
        // TODO
        trType.innerHTML = '<td><span>TODO</span></td>';
        
        // Obecny obsah
        var tdDescription = tbodyLayout.appendChild(Element.create("tr"));
        // TODO
        tdDescription.innerHTML = '<td><span>TODO</span></td>';
        
        if (this._editor != null) {
            // Specificky obsah
            var tdContent = tbodyLayout.appendChild(Element.create("tr")).appendChild(Element.create("td", null, {colspan: columns}));
            // TODO
        }
            
        // Ulozit/Zrusit
        var tdFooter = tbodyLayout.appendChild(Element.create("tr")).appendChild(Element.create("td", null, {colspan: columns, style: "text-align: center;"}));
        
        var inputZrusit = tdFooter.appendChild(Element.create("input", null, {value: "Zrušit", type: "button", style: "margin: 3px;"}));
        var inputUlozit = tdFooter.appendChild(Element.create("input", null, {value: "Uložit", type: "button", style: "margin: 3px;"}));
        
        Event.observe(inputZrusit, "click", function() {
            _this.hide();
        });
        
        Event.observe(inputUlozit, "click", function() {
            // TODO nacist data
            _this.hide();
        });
        
        root.appendChild(tableLayout);
        return root;
    }
});

 
var LinkEditors = {
    "default": {
        title: "Vlastní",
        width: 300,
        height: 100,
        
        create: function() {
        }
    }
};









/*
function() {
        var tr = Element.create("tr");
        var record = ElementDataStore.get(tr);
        
        // Vytvor datove elementy
        record.poradi = Element.create("input", null, {type: "text", style: "width: 25px; text-align: center;", title: "Pořadí"});
        record.text = Element.create("input", null, {type: "text", style: "width: 90px; text-align: center;", title: "Text"});
        record.title = Element.create("input", null, {type: "text", style: "width: 90px; text-align: left;", title: "Popisek (tooltip)"});
        record.url = Element.create("input", null, {type: "text", style: "width: 140px; text-align: left;", title: "Adresa"});
        record.externi = Element.create("input", null, {type: "checkbox", title: "Externí link"});
        record.noveokno = Element.create("input", null, {type: "checkbox", title: "Otevřít v novém okně"});
        record.odstranit = Element.create("a", '<img src="' + CHROME_CONTENT_URL + 'html/img/remove.png" alt="" class="link" />', {href: "javascript://", title: "Odstranit"});
        
        // Pridej je do sloupcu
        tr.appendChild(Element.create("td")).appendChild(record.poradi);
        tr.appendChild(Element.create("td")).appendChild(record.text);
        tr.appendChild(Element.create("td")).appendChild(record.title);
        tr.appendChild(Element.create("td")).appendChild(record.url);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.externi);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.noveokno);
        tr.appendChild(Element.create("td", null, {style: "text-align: center;"})).appendChild(record.odstranit);
        
        record.setPoradi = function(poradi) {
            record.poradi.value = poradi;
        };
        record.getPoradi = function() {
            return parseInt(record.poradi.value);
        };
        
        // Definuj getData a setData metody
        record.setData = function(linkData) {
            record.url.value = linkData.url || "";
            record.text.value = linkData.text || "";
            record.title.value = linkData.title || "";
            record.externi.checked = linkData.externi;
            record.noveokno.checked = linkData.noveokno;
        };
        
        record.getData = function() {
            return new LinkData(record.url.value, 
                                record.text.value,
                                record.title.value,
                                record.externi.checked,
                                record.noveokno.checked);
        };
        
        return record;
    },


var VlastniLinky = {
    predefined: function() {
        var list = new Array();
        
        list.push(new VlastniLink("rekrutovat.html?jednotka=1&kolik=0", "Zruš Rekrut", false, false));
        
        return list;
    }
};
*/