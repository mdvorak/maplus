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

// Linky na aliance
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        context.aliance1 = page.config.getAliance().getNumber("aliance1");
        context.aliance2 = page.config.getAliance().getNumber("aliance2");
        
        if (context.aliance1 == null || isNaN(context.aliance1))
            return false;
    
        context.alianceLink = $XF('font/a[. = "Aliance"]', page.rightMenu); 
        
        return (context.alianceLink != null);
    },
    
    process: function(page, context) {
        // Prejmenovani puvodniho linku
        context.alianceLink.innerHTML = "Ali";
    
        // Vytvoreni elementu
        var elems = new Array();
        
        elems.push(document.createTextNode("&nbsp;"));
        elems.push(this._createLink(page, "vypsat", context.aliance1, "V1"));
        
        if (context.aliance2) {
            elems.push(document.createTextNode("&nbsp;"));
            elems.push(this._createLink(page, "vypsat", context.aliance2, "V2"));
        }
        
        elems.push(document.createTextNode("&nbsp;"));
        elems.push(this._createLink(page, "nastavit", context.aliance1, "N1"));
        
        if (context.aliance2) {
            elems.push(document.createTextNode("&nbsp;"));
            elems.push(this._createLink(page, "nastavit", context.aliance2, "N2"));
        }
        
        // Vlozeni elementu
        var parent = context.alianceLink.parentNode;
        var insertionPoint = context.alianceLink.nextSibling;
        
        elems.each(function(e) {
                parent.insertBefore(e, insertionPoint);
            });
    },
    
    _createLink: function(page, akce, id, text) {
        var e = document.createElement("a");
        e.href = MaPlus.buildUrl(page, "aliance.html", {aliance: akce + "_" + id});
        e.innerHTML = text;        
        return e;
    }
}));

// Zabranit dvojklikum na linky
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        context.list = $XL('//a[@href != "javascript://" and not(@onclick)]');    
        return context.list.length > 0;
    },
    
    process: function(page, context) {
        context.list.each(function(e) { SafeLink.initLink(e); });
    }
}));
