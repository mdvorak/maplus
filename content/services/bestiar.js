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

/*** BestiarFiltry class ***/
var BestiarFiltry = {
    _load: function() {
        try {
            this.data = FileIO.loadXml(CHROME_CONTENT_URL + "data/bestiar-2.xml");
        }
        catch (e) {
            logger().error("Nepodarilo se nacist filtry bestiare:\n" + e);
        }
    },
    
    getRules_PROXY: Marshal.BY_VALUE,
    getRules: function(name, type) {
        if (name == null)
            throw new ArgumentNullException("name");
    
        if (!this.data)
            this._load();
        if (!this.data)
            return null;
    
        var path = '/aukce/rulelist[@name = "' + name + '"]/rule';
        if (type) path += '[@type = "' + type + '"]';
        
        var rules = this.data.evaluate(path, this.data, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var i;
        var arr = new Array();
        
        while((i = rules.iterateNext()) != null) {
            var rule = {
                name: name,
                type: i.getAttribute("type"),
                condition: i.textContent,
                title: i.getAttribute("text")
            };
            arr.push(rule);
        }
        
        return arr;
    },
    
    getAllRulesJSON_PROXY: Marshal.BY_VALUE,
    getAllRulesJSON: function(type) {
        if (!this.data)
            this._load();
        if (!this.data)
            return null;
        
        var cacheName = "_all_" + type;
        var json = this[cacheName];
        
        if (json == null) {
            var path = '/aukce/rulelist[@name]';
            
            var rulelists = this.data.evaluate(path, this.data, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
            var i;
            var arr = new Array();
            
            while((i = rulelists.iterateNext()) != null) {
                var name = i.getAttribute("name");
                arr = arr.concat(this.getRules(name, type));
            }
            
            json = Object.toJSON(arr);
            this[cacheName] = json;
        }
        
        return json;
    }
};

Marshal.registerObject("BestiarFiltry", BestiarFiltry);


/*** VybraneJednotkyCollection class ***/
var VybraneJednotkyCollection = Class.create();

VybraneJednotkyCollection.prototype = {
    initialize: function() {
        this._list = new Array();
        this._map = new Object();
    },
    
    getList_PROXY: Marshal.BY_VALUE,
    getList: function() {
        return this._list;
    },
    
    add_PROXY: Marshal.BY_VALUE,
    add: function(jednotka, text) {
        var old = this._map[jednotka.id];
        if (old == null) {
            jednotka = {
                id: jednotka.id,
                jmeno: jednotka.jmeno,
                pocet: jednotka.pocet,
                zkusenost: jednotka.zkusenost,
                text: text
            };
        
            // Novy stack
            this._map[jednotka.id] = jednotka;
            this._list.push(jednotka);
        }
        else {
            // Stary stack - updatuj text (kvuli cene casu atp - budme co nejpresnejsi)
            old.text = text;
        }
    },
    
    remove_PROXY: Marshal.BY_VALUE,
    remove: function(idList) {
        if (idList == null)
            throw new ArgumentNullException("idList");
        
        var removeList = new Array();
        
        var _this = this;
        idList.each(function(id) {
            var j = _this._map[id];
            if (j == null)
                return; // continue;
                
            removeList.push(j);
            delete _this._map[id];
        });
        
        this._list = this._list.without.apply(this._list, removeList);
    },

    clear_PROXY: Marshal.BY_VALUE,
    clear: function() {
        this._list = new Array();
        this._map = new Object();
    }
};


/*** VybraneJednotky class ***/
var VybraneJednotky = {
    _map: new Hash(),

    get_PROXY: Marshal.BY_REF,
    get_PROXY_CACHED: true,
    get: function(id) {
        var list = this._map[id];
        
        if (list == null) {
            list = new VybraneJednotkyCollection();
            this._map[id] = list;
        }
        
        return list;
    }
};

Marshal.registerObject("VybraneJednotky", VybraneJednotky);
