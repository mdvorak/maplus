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

/*** LinkData class ***/
var LinkData = Class.create({
    initialize: function(url, text, title, externi, noveokno, editor, potvrzeni, barva) {
        this.url = url;
        this.text = (text == null || text.blank()) ? null : text.stripScripts();
        this.title = (title == null || title.blank()) ? null : title;
        this.externi = !!externi;
        this.noveokno = !!noveokno;
        this.editor = editor;
        this.potvrzeni = potvrzeni;
        this.barva = barva;
    }
});

Object.extend(LinkData, {
    fromConfig: function(configNode) {
        if (configNode == null)
            throw new ArgumentNullException("configNode");
            
        return new LinkData(configNode.getPref("link"),
                            configNode.getPref("text"),
                            configNode.getPref("title"),
                            parseBoolean(configNode.getAttribute("externi")),
                            parseBoolean(configNode.getAttribute("noveokno")),
                            configNode.getAttribute("editor"),
                            parseBoolean(configNode.getAttribute("potvrzeni")),
                            configNode.getAttribute("barva"));
    },
    
    toConfig: function(linkData, configNode) {
        if (linkData == null)
            throw new ArgumentNullException("linkData");
        if (configNode == null)
            throw new ArgumentNullException("configNode");
        if (linkData.text == null)
            throw new ArgumentNullException("linkData.text");
        
        configNode.setPref("link", linkData.url);
        configNode.setPref("text", linkData.text.stripScripts());
        configNode.setPref("title", linkData.title);
        configNode.setAttribute("externi", !!linkData.externi);
        configNode.setAttribute("noveokno", !!linkData.noveokno);
        configNode.setAttribute("editor", (linkData.editor != null) ? linkData.editor : null);
        configNode.setAttribute("potvrzeni", !!linkData.potvrzeni);
        configNode.setAttribute("barva", (linkData.barva != null) ? linkData.barva : null);
    }
});
