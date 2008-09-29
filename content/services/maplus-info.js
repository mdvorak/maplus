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
* Portions created by the Initial Developer are Copyright (C) 2008
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

var MaPlusInfo = {
    _nextRefresh: null,
    _userWarned: false,

    _vek: null,
    _admin: {
        id: null,
        jmeno: null,
        email: null
    },
    _jednotky: null,
    
    _readData: function(doc) {
        var evalStringNonEmpty = function(xpath) {
            var str = XPath.evalString(xpath, doc);
            return (str != null && str.length > 0) ? str : null;
        };
    
        MaPlusInfo._vek = evalStringNonEmpty('/maplus/config/vek');
        MaPlusInfo._jednotky = evalStringNonEmpty('/maplus/config/jednotky');
        MaPlusInfo._admin.email = evalStringNonEmpty('/maplus/config/admin/email');
        
        // Vem v uvahu ID a jmeno admina jen pokud jsou aktualni
        var adminVek = evalStringNonEmpty('/maplus/config/admin/id/@proVek');
        
        if (adminVek == MaPlusInfo._vek) {
            MaPlusInfo._admin.id = evalStringNonEmpty('/maplus/config/admin/id');
            MaPlusInfo._admin.jmeno = evalStringNonEmpty('/maplus/config/admin/jmeno');
        }       
    },

    load: function() {
        try {
            var doc = FileIO.loadXml(MAPLUS_INFO_URL);
            if (doc == null)
                throw new Error("File not found.");

            // Nacti data
            MaPlusInfo._readData(doc);
            
            // Refresh za 24 hod (udaj je v ms)
            MaPlusInfo._nextRefresh = new Date().getTime() + DEN_MINUT * 60000;

            logger().info("Nacteno " + MAPLUS_INFO_FILENAME + ": vek=%s admin.id=%s admin.email=%s jednotky=%s", MaPlusInfo._vek, MaPlusInfo._admin.id, MaPlusInfo._admin.email, MaPlusInfo._jednotky);
            
            // Uloz lokalni kopii, ktera se pouzije pri selhani
            try {
                var dataPath = MaPlus.DataDirectory;
                dataPath.append(MAPLUS_INFO_FILENAME);
                
                FileIO.saveXmlFile(dataPath, doc);
                logger().log("Vytvorena lokalni kopie " + dataPath.path);
            }
            catch (ex) {
                logger().warn("Nepodarilo se vytvorit lokalni kopii " + MAPLUS_INFO_FILENAME + ":\n" + ex);
            }
        }
        catch (ex) {
            // Refresh za 2 hod (udaj je v ms)
            MaPlusInfo._nextRefresh = new Date().getTime() + 120 * 60000;

            var err = "Nepodarilo se ziskat " + MAPLUS_INFO_FILENAME +":\n" + ex;
            logger().error(err);
            
            // Otravuj uzivatele jen jednou za otevreni okna
            if (!MaPlusInfo._userWarned) {
                alert(err);
                MaPlusInfo._userWarned = true;
            }
            
            // Pokus se nacist lokalni kopii
            try {
                var dataPath = MaPlus.DataDirectory;
                dataPath.append(MAPLUS_INFO_FILENAME);
                
                var doc = FileIO.loadXmlFile(dataPath);
                if (doc == null)
                    throw new Error("File not found.");
                    
                // Nacti data
                MaPlusInfo._readData(doc);
                
                logger().info("Nactena lokalni kopie " + dataPath.path);
            }
            catch (ex) {
                logger().warn("Nepodarilo se nacist lokalni kopii " + MAPLUS_INFO_FILENAME + ":\n" + ex);
            }
        }
    },

    _loadIfNeeded: function() {
        if (MaPlusInfo._nextRefresh == null || MaPlusInfo._nextRefresh < new Date().getTime()) {
            MaPlusInfo.load();
        }
    },

    vek_PROXY: Marshal.BY_VALUE,
    vek: function() {
        MaPlusInfo._loadIfNeeded();

        return MaPlusInfo._vek;
    },

    admin_PROXY: Marshal.BY_VALUE,
    admin: function() {
        MaPlusInfo._loadIfNeeded();

        return {
            id: MaPlusInfo._admin.id,
            jmeno: MaPlusInfo._admin.jmeno,
            email: MaPlusInfo._admin.email
        };
    },

    jednotky_PROXY: Marshal.BY_VALUE,
    jednotky: function() {
        MaPlusInfo._loadIfNeeded();

        return MaPlusInfo._jednotky;
    }
};

Marshal.registerObject("MaPlusInfo", MaPlusInfo);
