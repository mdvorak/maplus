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


/** Styl jednotlivych sloupcu **/
var BestiarColumnStyle = {
    pocet: function(td, data) {
        td.innerHTML = '<span>&nbsp;' + data.pocet + '&nbsp;</span>';
        td.style.color = Color.fromRange(data.pocet, 20, 5000, Color.Pickers.grayWhite);
    },
    zkusenost: function(td, data) {
        td.innerHTML = '<span>&nbsp;' + (data.zkusenost * 100).toFixed(2) + '%&nbsp;</span>';
        td.style.color = Color.fromRange(data.zkusenost, 0.20, 0.60, Color.Pickers.redGreen);
    },
    silaJednotky: function(td, data) {
        td.innerHTML = '<span>&nbsp;' + data.silaJednotky.toFixed(2) + '&nbsp;</span>';
        td.style.color = Color.fromRange(data.silaJednotky, 1, 220, Color.Pickers.grayWhite);
    },
    druh: function(td, data) {
        td.innerHTML = '<span>&nbsp;' + data.druh + '</span>';
        td.className = (data.druh == "Let.") ? "druhLet" : "druhPoz"
    },
    typ: function(td, data) {
        td.innerHTML = '<span>&nbsp;' + data.typ + '</span>';
        td.className = (data.typ == "Str.") ? "typStr" : "typBoj"
    },
    cas: function(td, data) {
        if (!isNaN(data.cas))
            td.innerHTML = '<span>&nbsp;' + formatTime(data.cas) + '&nbsp;</span>';
        else
            td.innerHTML = '<span>&nbsp;Žádná nabídka&nbsp;</span>';
    },
    phb: function(td, data) {
        td.className = "phb" + data.phb;
    },
    typKratce: function(td, data) {
        var druhClass = (data.druh == "Let.") ? "druhLet" : "druhPoz";
        var typClass = (data.typ == "Str.") ? "typStr" : "typBoj"
        
        var html = '<span class="' + druhClass + '">&nbsp;' + data.druh[0] + '</span>';
        html += '<span class="' + typClass + '">' + data.typ[0] + '</span>';
        if (data.typ != "Str.")
            html += '<span class="phb' + data.phb + '">' + data.phb + '</span>';
        
        td.innerHTML = html;
        td.setAttribute("align", "left");
    },
    ini: function(td, data) {
        td.style.color = Color.fromRange(data.ini, 5, 35, Color.Pickers.redGreen);
    },
    silaStacku: function(td, data) {
        td.style.color = Color.fromRange(data.silaStacku, 500, 12000, Color.Pickers.grayWhite);
    },
    maxSilaStacku: function(td, data) {
        td.style.color = Color.fromRange(data.maxSilaStacku, 1000, 25000, Color.Pickers.grayWhite);
    },
    cenaZaSilu: function(td, data) {
        td.style.color = Color.fromRange(data.cenaZaSilu, 30, 5, Color.Pickers.redGreen);
    },
    zlataTU: function(td, data) {
        td.style.color = Color.fromRange(data.zlataTU, 100, 3000, Color.Pickers.grayGold);
    },
    manyTU: function(td, data) {
        td.style.color = Color.fromRange(data.manyTU, 3000, 100, Color.Pickers.blueWhite);
    },
    popTU: function(td, data) {
        td.style.color = Color.fromRange(data.popTU, 400, 5, Color.Pickers.grayBrown);
    }
};
