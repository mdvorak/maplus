/* ***** BEGIN LICENSE BLOCK *****
 *   Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of DataCache file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use DataCache file except in compliance with
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
 * Alternatively, the contents of DataCache file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of DataCache file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of DataCache file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of DataCache file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 * 
 * ***** END LICENSE BLOCK ***** */
 
 var DataCache = {
    _lastUid: 0,
    _data: new Hash(),
    _removeCandidates: new Array(),
    
    generateUid_PROXY: Marshal.BY_VALUE,
    generateUid: function() {
        var uid;
        do {
            uid = "gen_" + (++DataCache._lastUid);
        } while (uid in DataCache._data)
        return uid;
    },
    
    store_PROXY: Marshal.BY_VALUE,
    store: function(uid, data, overwrite) {
        // Procisteni
        DataCache._removeCandidates.each(function(uid) {
            delete DataCache._data[uid];
        });
        DataCache._removeCandidates = new Array();
        
        // Samotne ulozeni
        if (uid == null)
            uid = DataCache.generateUid();
        else
            uid = String(uid);
            
        if (!overwrite && (uid in DataCache._data) && DataCache._removeCandidates.indexOf(uid) < 0)
            throw new ArgumentException("uid", uid, "This identifier is already registered.");
        
        DataCache._data[uid] = data;
        DataCache._removeCandidates = DataCache._removeCandidates.without(uid);
        
        return uid;
    },
    
    retrieve_PROXY: Marshal.BY_VALUE,
    retrieve: function(uid, doNotRemove) {
        if (uid == null)
            return null;
            
        uid = String(uid);
        var data = DataCache._data[uid];
        
        // Remove record
        if (!doNotRemove)
            DataCache._removeCandidates.push(uid);
            
        return data;
    }
 }
 
 // Register for proxy
 Marshal.registerObject("DataCache", DataCache);
 