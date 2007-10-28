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

var Jednotky = {
    NO_DATA: "NO_DATA",

    load: function() {
        try { 
            var doc = FileIO.loadXml(CHROME_CONTENT_URL + "data/jednotky.xml");
            return XmlConfig.extendNode($X("jednotky", doc));
        }
        catch(e) {
        }
    },
    
    vyhledej_PROXY: Marshal.BY_VALUE,
    vyhledej_PROXY_CACHED: true,
    vyhledej: function(jmeno) {
        if (jmeno == null)
            return null;
        
        // Nacti data pokud se tak jeste nestalo
        if (!this.data) {
            this.data = this.load() || this.NO_DATA;
        }
        
        // Pokud data nejsou k dispozici vrat null
        if (this.data == this.NO_DATA)
            return null;
    
        // Pokus se najit jednotku
        var jednotka = this.data.evalPrefNode('jednotka[jmeno = "' + jmeno + '"]');

        if (jednotka) {
            return {
                jmeno: jmeno,
                pwr: jednotka.getNumber("pwr"),
                barva: jednotka.getPref("barva"),
                typ: jednotka.getPref("typ"),
                druh: jednotka.getPref("druh"),
                phb: jednotka.getNumber("phb"),
                dmg: jednotka.getNumber("dmg", 0),
                brn: jednotka.getNumber("brn", 0),
                zvt: jednotka.getNumber("zvt", 0),
                ini: jednotka.getNumber("ini", 0),
                realIni: jednotka.getNumber("realIni"),
                zlataTU: jednotka.getNumber("zlataTU", 0),
                manyTU: jednotka.getNumber("manyTU", 0),
                popTU: jednotka.getNumber("popTU", 0)
            };
        }
        
        return null;
    }
};

Marshal.registerObject("Jednotky", Jednotky);
