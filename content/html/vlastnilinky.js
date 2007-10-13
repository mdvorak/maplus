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
    reset: function(table) {
        table = $(table);
        
        // Vycisti tabulku
        while(table.firstChild != null)
            table.removeChild(table.firstChild);
    },
    
    onload: function(table, config) {
        table = $(table);
        this.reset(table);
            
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
                table.removeChild(record.element);
            });
            
            table.appendChild(record.element);
        });
    },
    
    onsave: function(table, config) {
        table = $(table);
        
        // Serad zaznamy podle poradi
        var rows = $A(table.rows);
        rows.sort(function(r1, r2) {
            var d1 = ElementDataStore.get(r1);
            var d2 = ElementDataStore.get(r2);
        
            return Object.compare(d1.getData().poradi, d2.getData().poradi);
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
            LinkData.toConfig(cfg);
        });
    },
    
    createRecord: function() {
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
    }
};








/*
var VlastniLinky = {
    predefined: function() {
        var list = new Array();
        
        list.push(new VlastniLink("rekrutovat.html?jednotka=1&kolik=0", "Zruš Rekrut", false, false));
        
        return list;
    }
};
*/