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

var StaticArgument = Class.create();
StaticArgument.prototype = {
    initialize: function(name, value) {
        this.name = name;
        this.value = value;
    },
    
    toString: function() {
        return this.name + "=" + this.value;
    }
};

var DynamicArgument = Class.create();
DynamicArgument.prototype = {
    initialize: function(name) {
        this.name = name;
    },
    
    createElement: function() {
        throw new Exception("Not implemented.");
    },
    
    getValue: function(element) {
        return element.value;
    },
    
    setValue: function(element, value) {
        element.value = value;
    },
    
    toString: function() {
        return this.name + "=<dynamic>";
    }
};

var TextDynamicArgument = Class.inherit(DynamicArgument);
Object.extend(TextDynamicArgument.prototype, {
    createElement: function() {
        return Element.create("input", null, {type: "text"});
    }
});

var SelectDynamicArgument = Class.inherit(DynamicArgument);
Object.extend(SelectDynamicArgument.prototype, {
    // options = { value: text }
    initialize: function(name, options) {
        base.initialize(name);
        this.options = $H(options);
    },
    
    createElement: function() {
        var select = Element.create("select");
        this.options.each(function(i) {
            select.options.add(new Option(i[1], i[0]));
        });
    }
});

var LinkDefinition = Class.create();
LinkDefinition.prototype = {
    initialize: function(text, pageName, staticArguments, dynamicArguments) {
        this.text = text;
        this.pageName = pageName;
        this.staticArguments = staticArguments;
        this.dynamicArguments = dynamicArguments;
    }
};

var LinkEditDialog = Class.create();
LinkEditDialog.prototype = {
};








var VlastniLink = Class.create();
VlastniLink.prototype = {
    initialize: function(link, text, externi, noveokno) {
        this.link = (link == null || link.blank()) ? null : link;
        this.text = text;
        this.externi = !!externi;
        this.noveokno = !!noveokno;
    }
};


var VlastniLinky = {
    predefined: function() {
        var list = new Array();
        
        list.push(new VlastniLink("rekrutovat.html?jednotka=1&kolik=0", "Zruš Rekrut", false, false));
        
        return list;
    }
};

var NastaveniVlastniLinky = {
    reset: function(table) {
    },
    
    load: function(table, config) {
        
    },
    
    save: function(table, config) {
        // Serad zaznamy podle poradi
        var rows = $A(table.rows);
        rows.sort(function(r1, r2) {
            return Object.compare(ElementDataStore.get(r1).getData().poradi, ElementDataStore.get(r2).getData().poradi);
        });
        
        // Uloz zaznamy do configu
        config.clearChildNodes();
        
        rows.each(function(tr) {
            var row = ElementDataStore.get(tr);
            var data = row.getData();
            
            var cfg = config.addPref("url");
            cfg.setPref("link", data.url);
            cfg.setPref("text", data.text);
            cfg.setAttribute("externi", data.externi);
            cfg.setAttribute("noveokno", data.noveokno);
        });
    },
    
    createRecord: function() {
        var tr = Element.create("tr");
        var record = ElementDataStore.get(tr);
        
        // Vytvor datove elementy
        record.poradi = Element.create("input", null, {type: "text"});
        record.url = Element.create("input", null, {type: "text"});
        record.text = Element.create("input", null, {type: "text"});
        record.externi = Element.create("input", null, {type: "checkbox"});
        record.noveokno = Element.create("input", null, {type: "checkbox"});
        record.odstranit = Element.create("a", '<img src="' + CHROME_CONTENT_URL + 'html/img/remove.png" alt="" class="link" />', {href: "javascript://"});
        
        // Pridej je do sloupcu
        tr.appendChild(Element.create("td")).appendChild(record.poradi);
        tr.appendChild(Element.create("td")).appendChild(record.url);
        tr.appendChild(Element.create("td")).appendChild(record.text);
        tr.appendChild(Element.create("td")).appendChild(record.externi);
        tr.appendChild(Element.create("td")).appendChild(record.noveokno);
        tr.appendChild(Element.create("td")).appendChild(record.odstranit);
        
        // Definuj getData a setData metody
        record.setData = function(poradi, url, text, externi, noveokno) {
            record.poradi.value = poradi;
            record.url.value = url;
            record.text.value = text;
            record.externi.checked = externi;
            record.noveokno.checked = noveokno;
        };
        
        record.getData = function() {
            return {
                poradi: parseInt(record.poradi.value),
                url: record.url.value,
                text: record.text.value,
                externi: record.externi.checked,
                noveokno: record.noveokno.checked
            };
        };
        
        return record;
    }
};
