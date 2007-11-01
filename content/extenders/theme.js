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

function updateImgs(origSrc, newSrc) {
    $XL('//img[@src = "' + origSrc + '"]').each(function(e) { e.src = newSrc; });
}

// Barvy povolani
pageExtenders.add(PageExtender.create({
    getName: function() { return "Barvy povolani"; },

    process: function(page, context) {
        // Zmena obrazku
        updateImgs(MELIOR_ANNIS_URL + "/html/img/barvy/fialova.jpg", CHROME_CONTENT_URL + "html/img/barvy/fialova2.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/barvy/seda.gif", CHROME_CONTENT_URL + "html/img/barvy/seda.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/barvy/bila.gif", CHROME_CONTENT_URL + "html/img/barvy/bila.png");
    }
}));

// Temne barvy
pageExtenders.add(PageExtender.create({
    getName: function() { return "Temne barvy"; },

    analyze: function(page, context) {
        return page.config.getBoolean("temneBarvy", true);
    },
    
    process: function(page, context) {
        // Barvy tabulek
        $XL('//tr[@bgcolor = "#303030"]').each(function(e) { e.bgColor = "#1b1b1b" }); // Tohle musi byt prvni
        $XL('//table[@bgcolor = "#505050"]').each(function(e) { e.bgColor = "#303030" });
        $XL('//tr[@bgcolor = "#505050"]').each(function(e) { e.bgColor = "#303030" });
        $XL('//td[@bgcolor = "#505050"]').each(function(e) { e.bgColor = "#303030" });
        $XL('//tr[@bgcolor = "#404040"]').each(function(e) { e.bgColor = "#2b2b2b" });

        // Rohy tabulek
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/ld.jpg", CHROME_CONTENT_URL + "html/img/rohy/ld.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/levdolroh.jpg", CHROME_CONTENT_URL + "html/img/rohy/levdolroh.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/levhorroh.jpg", CHROME_CONTENT_URL + "html/img/rohy/levhorroh.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/lh.jpg", CHROME_CONTENT_URL + "html/img/rohy/lh.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/pd.jpg", CHROME_CONTENT_URL + "html/img/rohy/pd.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/ph.jpg", CHROME_CONTENT_URL + "html/img/rohy/ph.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/pravdolroh.jpg", CHROME_CONTENT_URL + "html/img/rohy/pravdolroh.png");
        updateImgs(MELIOR_ANNIS_URL + "/html/img/rohy/pravhorroh.jpg", CHROME_CONTENT_URL + "html/img/rohy/pravhorroh.png");
    }    
}));
