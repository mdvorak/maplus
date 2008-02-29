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

// Volani sou platna pouze z domeny MA
Marshal.registerUrlCallValidator("^" + MELIOR_ANNIS_URL);

var MaPlus = {
    getDataDirectory: function() {
        var path = Components.classes["@mozilla.org/file/directory_service;1"]
                         .getService(Components.interfaces.nsIProperties)
                         .get("ProfD", Components.interfaces.nsIFile);
                         
        path.append(EXTENSION_NAME);

        if(!path.exists() || !path.isDirectory()) {
           path.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0750);
        }
        
        return path;
    },
    
    getAgeName: function() {
        if (this._ageName == null) {
            this._ageName = WebExtenderPreferences.getBranch().getCharPref("age_name");
        }
        return this._ageName;
    }
};

var Clipboard = {
    MAX_TEXT_LENGTH: 128,

    _helper: Components.classes["@mozilla.org/widget/clipboardhelper;1"].getService(Components.interfaces.nsIClipboardHelper),
    
    copyId_PROXY: Marshal.BY_VALUE,
    copyId: function(id) {
        if (isNaN(parseInt(id)))
            throw new ArgumentException("id", id, "Not a number.");
        
        this._helper.copyString(id);
    },
    
    copyText_PROXY: Marshal.BY_VALUE,
    copyText: function(text) {
        if (text == null)
            throw new ArgumentNullException("text");
        text = String(text);
        if (text.length > this.MAX_TEXT_LENGTH)
            throw new ArgumentException("text", text, "Text cannot be longer than " + this.MAX_TEXT_LENGTH);
        
        this._helper.copyString(text);
    }
};

Marshal.registerObject("Clipboard", Clipboard);


// Ziskani rozmeru dokumentu v iframu
var FrameHelper = {
    getFrameContentSize_PROXY: Marshal.BY_VALUE,
    getFrameContentSize: function(doc, frameId) {
        var frame = doc.getElementById(frameId);
        if (frame == null)
            throw new ArgumentException("frame not found.", "frameId", frameId);
            
        return {
            width: frame.contentDocument.width,
            height: frame.contentDocument.height
        };
    }
};

Marshal.registerObject("FrameHelper", FrameHelper);
