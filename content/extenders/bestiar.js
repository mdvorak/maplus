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

var BestiarFiltry = Marshal.getObjectProxy("BestiarFiltry");

// Razeni a filtrovani
pageExtenders.add(PageExtender.create({
    getName: function() { return "Bestiar - Filtry"; },

    analyze: function(page, context) {
        // Bestiar
        if (page.arguments["obchod"] != "jedn_new")
            return false;
            
        // TODO
        
        return false;
    },

    process: function(page, context) {
        // TODO
    }
}));


/*** Implementace pravidel ***/
var Rules = {
    sort: function(rules) {
        if (!rules) return null;
        
        return function(row1, row2) {
            var stack1 = row1.stack;
            var stack2 = row2.stack;
            
            if (stack1 == stack2)
                return 0;
            else if (stack1 == null)
                return -1;
            else if (stack2 == null)
                return 1;
         
            for (var i = 0; i < rules.length; i++) {
                if (!rules[i]) continue;
                
                var r = eval(rules[i]);
                if (r != null && r != 0) return r;
            }
        };
    },

    filter: function(rules) {
        if (!rules) return null;
        
        return function(row) {
            var stack = row.stack;
            
            if (stack == null)
                return true;

            for (var i = 0; i < rules.length; i++) {
                if (!rules[i]) continue;
                
                var r = eval(rules[i]);
                if (!r) return false;
            }
            
            return true;
        };
    }
};

/*** Konfigurace ***/
PlusConfig.Aukce = new Object();

PlusConfig.Aukce.prototype = {
    setRule: function(name, type, condition) {
        if (name == null) throw new ArgumentNullException("name");
        if (type == null) throw new ArgumentNullException("type");
    
        var f = this.evalPrefNode('filter[@name = "' + name + '" and @type = "' + type + '"]');
        if (f) {
            f.setPref(null, condition);
        }
        else {
            var first = this.evalPrefNode('filter[first()]');
            (first ? this.insertPref : this.addPref)("filter", condition, first);
            
            f.setAttribute("name", name);
            f.setAttribute("type", type);
        }

        return f;
    },

    removeRule: function(name, type) {
        if (name == null) throw new ArgumentNullException("name");
        if (type == null) throw new ArgumentNullException("type");
    
        var path = 'filter[@name = "' + name + '"';
        if (type) path += ' and @type = "' + type + '"';
        path += ']';
        
        var list = this.evalPrefNodeList('filter[@name = "' + name + '" and @type = "' + type + '"]');
        for (var i = 0; i < list.length; i++) {
            this.removePrefNode(list[i]);
        }
    },

    clearRules: function() {
        this.clearChildNodes();
    },

    createRuleSet: function(type) {
        if (type == null) throw new ArgumentNullException("type");
    
        var list = this.evalPrefNodeList('filter[@type = "' + type + '"]');
        var rules = new Array();
        
        for (var i = 0; i < list.length; i++) {
            rules.push(list[i].getPref());
        }
        
        return rules;
    },

    hasRules: function(type) {
        var path = 'filter';
        if (type) path += '[@type = "' + type + '"]';
        var count = this.evalPrefNodeList('count(' + path + ')').length;
        return count > 0;
    }
};
