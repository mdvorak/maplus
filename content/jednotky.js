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
    load: function() {
        try { 
            var req = new XMLHttpRequest();
            req.open("GET", "chrome://maplus/content/jednotky.xml", false); 
            req.send(null);
            this.root = req.responseXML;
            
            /*
            var path = maplus.getDirectory();
            path.append("content");
            path.append("jednotky.xml");
            this.root = loadXmlFile(path);
            */
        }
        catch(e) {
        }
        
        if (!this.root) {
            this.root = document.implementation.createDocument("", "", null);
        }
        
        this.data = elementEvaluateSingle(this.root, '/jednotky')
        if (this.data == null) {
            this.data = this.root.createElement("jednotky");
            this.root.appendChild(this.data);
        }
        
        // Definovano v config.js
        initPrefNode(this.data);
    },
    
    save: function() {
        /* 
        try {
            var path = maplus.getDirectory();
            path.append("content");
            path.append("jednotky.xml");
            saveXmlFile(path, this.root);
        }
        catch(e) {
        }
        */
    },
    
    vyhledej_PROXY: Marshal.BY_VALUE,
    vyhledej: function(jmeno) {
        if (jmeno == null)
            return null;
            
        if (!this.data)
            this.load();
    
        var jednotka = this.data.getPrefNodeByXPath('jednotka[jmeno = "' + jmeno + '"]');
        
        if (jednotka) {
            return {
                jmeno: jmeno,
                pwr: jednotka.getNumber("pwr"),
                barva: jednotka.getPref("barva"),
                typ: jednotka.getPref("typ"),
                druh: jednotka.getPref("druh"),
                phb: jednotka.getNumber("phb"),
                dmg: jednotka.getNumber("dmg"),
                brn: jednotka.getNumber("brn"),
                zvt: jednotka.getNumber("zvt"),
                ini: jednotka.getNumber("ini"),
                realIni: jednotka.getNumber("realIni"),
                zlataTU: jednotka.getNumber("zlataTU"),
                manyTU: jednotka.getNumber("manyTU"),
                popTU: jednotka.getNumber("popTU")
            };
        }
        
        return null;
    },
    /*
    aktualizuj_PROXY: Marshal.BY_VALUE,
    aktualizuj: function(data) {
        // jmeno, pwr, barva, typ, druh, phb, dmg, brn, zvt, ini, realIni, zlataTU, manyTU, popTU

        if (data.jmeno == null)
            return null;
    
        var jednotka = this.data.getPrefNodeByXPath('jednotka[jmeno = "' + data.jmeno + '"]');
        
        if (!jednotka) {
            jednotka = this.data.addPref("jednotka");
            jednotka.setPref("jmeno", data.jmeno);
        }
        
        if (data.pwr) jednotka.setPref("pwr", data.pwr.toString());
        if (data.barva) jednotka.setPref("barva", data.barva);
        if (data.typ) jednotka.setPref("typ", data.typ);
        if (data.druh) jednotka.setPref("druh", data.druh);
        if (data.phb) jednotka.setPref("phb", data.phb.toString());
        if (data.dmg) jednotka.setPref("dmg", data.dmg.toString());
        if (data.brn) jednotka.setPref("brn", data.brn.toString());
        if (data.zvt) jednotka.setPref("zvt", data.zvt.toString());
        if (data.ini) jednotka.setPref("ini", data.ini.toString());
        if (data.realIni) jednotka.setPref("realIni", data.realIni.toString());
        if (data.zlataTU) jednotka.setPref("zlataTU", data.zlataTU.toString());
        if (data.manyTU) jednotka.setPref("manyTU", data.manyTU.toString());
        if (data.popTU) jednotka.setPref("popTU", data.popTU.toString());
    }*/
};

Marshal.registerObject("Jednotky", Jednotky);
