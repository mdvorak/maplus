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
    
    _resolver: function(prefix) {
        if (prefix == "j")
            return "http://maplus.xf.cz/jednotky";
        else
            return null;
    },
    
    reload: function() {
        this.data = null;
    },
    
    load: function() {
        var root = null;
        
        try {
            var url = MaPlusInfo.jednotky();
            
            if (url == null) {
                // Info neni nacteno, no co se da delat...
                logger().error("MaPlusInfo neni nacteno nebo chyby udaj o jednotkach. Data nejsou nacteny.");
                return null;
            }
            
            var res = FileIO.loadCachedXml(url, MaPlus.DataDirectory, false);
            
            if (res.document != null) {
                root = $X("j:jednotky", res.document, Jednotky._resolver);
                
                if (root == null)
                    throw new Error("Nepodarilo se najit korenovy element.");
                
                logger().info("Jednotky uspesne nacteny z %s.", res.source);
            }
        }
        catch(ex) {
            logger().warn("Neocekavana chyba pri nacitani jednotek:\n" + ex + "\n\n" + ex.stack);
        }
        
        return root;
    },
    
    _loadIfNeeded: function() {
        if (this.data == null) {
            this.data = this.load() || this.NO_DATA;
        }
    },
    
    vyhledej_PROXY: Marshal.BY_VALUE,
    vyhledej_PROXY_CACHED: true,
    vyhledej: function(jmeno) {
        if (jmeno == null)
            return null;
        
        // Nacti data pokud se tak jeste nestalo
        this._loadIfNeeded();
        
        // Pokud data nejsou k dispozici vrat null
        if (this.data == this.NO_DATA) {        
            return null;
        }
    
        // Pokus se najit jednotku
        var jednotka = $X('j:jednotka[j:jmeno = "' + jmeno + '"]', this.data, Jednotky._resolver);

        if (jednotka) {
            return {
                jmeno: jmeno,
                pwr: XPath.evalNumber("j:pwr", jednotka, Jednotky._resolver),
                barva: XPath.evalString("j:barva", jednotka, Jednotky._resolver),
                typ: XPath.evalString("j:typ", jednotka, Jednotky._resolver),
                druh: XPath.evalString("j:druh", jednotka, Jednotky._resolver),
                phb: XPath.evalNumber("j:phb", jednotka, Jednotky._resolver),
                dmg: XPath.evalNumber("j:dmg", jednotka, Jednotky._resolver) || 0,
                brn: XPath.evalNumber("j:brn", jednotka, Jednotky._resolver) || 0,
                zvt: XPath.evalNumber("j:zvt", jednotka, Jednotky._resolver) || 0,
                ini: XPath.evalNumber("j:ini", jednotka, Jednotky._resolver) || 0,
                realIni: XPath.evalNumber("j:realIni", jednotka, Jednotky._resolver),
                zlataTU: XPath.evalNumber("j:zlataTU", jednotka, Jednotky._resolver) || 0,
                manyTU: XPath.evalNumber("j:manyTU", jednotka, Jednotky._resolver) || 0,
                popTU: XPath.evalNumber("j:popTU", jednotka, Jednotky._resolver) || 0
            };
        }
        
        return null;
    }
};

Marshal.registerObject("Jednotky", Jednotky);

// Vynut si znovunacteni jednotek
MaPlusInfo.registerReloadedListener(function() { Jednotky.reload(); });
