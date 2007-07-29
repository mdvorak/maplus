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

// Analyza alianci kde sem clenem
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];

        if (!typStranky) {
            var nastavit = $XL('//a[starts-with(@href, "aliance.html") and font = "Nastavit"]');
            
            if (nastavit.length > 0) {
                // page.prefs.aliance.clearChildNodes();
                
                nastavit.each(function(a) {
                        var m = a.href.match(/&aliance=nastavit_(\d+)/);
                        var id = m ? m[1] : null;
                        
                        if (id) {
                           // TODO 
                        }
                    });
            }
        }
    
        return false;
    }
}));

// Analyza clenu aliance
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        return (typStranky && typStranky.search("vypis_clenu_v_ally_") == 0);
    },
    
    process: function(page, context) {
    }
}));

// Analyza seznamu alianci
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        return (typStranky == "vypis_alianci");
    },
    
    process: function(page, context) {
    }
}));

// Hromadne zpravy - Nastaveni aliance
pageExtenders.add(PageExtender.create({
    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        return (typStranky && typStranky.search("nastavit_") == 0);
    },
    
    process: function(page, context) {
    }
}));
