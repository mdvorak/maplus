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
 
// Analyzuj rozlozeni stranky
pageExtenders.add(PageExtender.create({
    getName: function() { return "Analyza stranky"; },

    analyze: function(page, context) {
        if (page.name == null || page.name == "" || page.name == "login.html")
            throw new AbortException("Unsupported page name.");
            
        // Najdi id
        page.id = parseInt(this._findParameter(page, "id"));
        page.code = this._findParameter(page, "code");
        page.ftc = this._findParameter(page, "ftc");

        if (!page.id || isNaN(page.id))
            throw new AbortException("Id nenalezeno.");
            
        console.info("page id=%d, code=%s, ftc=%s", page.id, page.code, page.ftc);
        
        // Najdi zakladni strukturu stranky
        page.topTable = XPath.evalSingle('/html/body/center/table[1]', page.document);
        page.playerTable = XPath.evalSingle('/html/body/center/table[2]', page.document);
        page.contentTable = XPath.evalSingle('/html/body/center/table[3]', page.document);
        
        if (!page.topTable || !page.playerTable || !page.contentTable)
            throw new AbortException("Nepodarilo se najit zakladni strukturu stranky.");
        
        page.leftMenu = XPath.evalSingle('tbody/tr/td[1]', page.contentTable);
        page.rightMenu = XPath.evalSingle('tbody/tr/td[last()]', page.contentTable);
        page.content = XPath.evalSingle('tbody/tr/td[2]', page.contentTable);
        
        return true;
    },
    
    process: null,
    
    _findParameter: function(page, name) {
        var value;
        
        // Link
        var e = XPath.evalSingle('//a[contains(@href, "&' + name + '=") or contains(@href, "?' + name + '=")]', page.document);
        if (e) {
            var m = e.href.match("[?&]" + name + "=(.+?)(?:&|$)");
            value = (m ? m[1] : null);
        }
        
        // Form input (toto by nemelo byt nikdy potreba ale proc to tu nenechat?)
        if (!value) {
            var e = XPath.evalSingle('//input[@name = "' + name + '"]', page.document);
            if (e)
                value = elem.value;
        }
        
        return value;
    }
}));
