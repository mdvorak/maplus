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
 * Portions created by the Initial Developer are Copyright (C) 2008
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

pageExtenders.add(PageExtender.create({
    getName: function() { return "Help - Data Jednotek"; },

    analyze: function(page, context) {
        if (page.arguments["typ_helpu"] != "jednotky")
            return false;
        
        // Tag s popiskem
        context.before = ($X('b[1]', page.content) || {}).nextSibling;
        if (context.before == null)
            return false;
        
        context.url = Marshal.callMethod("MaPlusInfo", "jednotky", []);
        context.target = "_blank";
        context.local = MaPlus.buildUrl(page, "main.html", {plus: "openurl", url: "jednotky"});
        
        if (context.url == null || context.local == null)
            return false;
        
        return true;
    },
    
    process: function(page, context) {
        var elem = Element.create("a", '<span>Informace o jednotkách podle MA+</span>', {href: context.url, target: context.target});
    
        page.content.insertBefore(Element.create("br"), context.before);
        page.content.insertBefore(elem, context.before);
        
        Event.observe(elem, "click", function(event) {
            if (event.ctrlKey)
                return;
                
            document.location.href = context.local;
            Event.stop(event);
        });
    }
}));

