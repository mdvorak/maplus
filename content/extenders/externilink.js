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

pageExtenders.add(PageExtender.create({
    getName: function() { return "MaPlus - Externi link"; },

    analyze: function(page, context) {
        if (page.arguments["plus"] != "openurl" || page.arguments["url"] == null)
            return false;
        
        context.url = unescape(page.arguments["url"]);
        if (context.url.search("http://") != 0) {
            logger().error("Nepovolena adresa: %s", context.url);
            return false;
        }
        
        return true;
    },

    process: function(page, context) {
        // Uprav rozlozeni obrazovky
        page.content.setAttribute("width", null);
        page.content.style.textAlign = "center";
        page.leftMenu.setAttribute("width", 160);
        page.rightMenu.setAttribute("width", 160);
        
        // Zobraz link v iframu
        var iframe = Element.create("iframe", null, {id: "plus_content", src: context.url, style: "width: 100%; height: 100%; border: 0px;"});
        var div = Element.create("div", null, {style: "width: 100%; min-height: 100%;"});
        div.appendChild(iframe);
        
        Event.observe(iframe, "load", function(event) {
            try {
                var docref = Marshal.getDocumentReference();
                var size = Marshal.callMethod("FrameHelper", "getFrameContentSize", [docref, iframe.id]);
                if (size.height > 0)
                    div.style.height = (size.height + 15) + "px";
            }
            catch (ex) {
                logger().warn("Nepodarilo se ziskat velikost dokumentu v iframu: %o", ex);
            }
        });
        
        page.content.innerHTML = '';
        page.content.appendChild(div);   
    }
}));