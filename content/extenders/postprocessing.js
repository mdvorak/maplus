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

// Rozsirit menu alianci
var alianceLinkExtender = PageExtender.create({
    analyze: function(page, context) {
        context.aliance = $XF('font/a[. = "Aliance"]', page.rightMenu); 
        return (context.aliance != null);
    },
    
    process: function(page, context) {
        // Linky na aliance
        if (context.aliance) {
        /* TODO
            var linky = "";
            
            var ids = elementEvaluate(page.prefs.aliance, 'id');
            
            for (var i = 0; i < ids.length; i++) {
                var id = parseInt(ids[i].textContent);
                if (!isNaN(id)) {
                    linky += '&nbsp;<a href="' + buildUrl(page, "aliance.html", "aliance=vypsat_" + id) + '">V' + (i+1) + '</a>';
                }
            }
            
            for (var i = 0; i < ids.length; i++) {
                var id = parseInt(ids[i].textContent);
                if (!isNaN(id)) {
                    linky += '&nbsp;<a href="' + buildUrl(page, "aliance.html", "aliance=nastavit_" + id) + '">N' + (i+1) + '</a>';
                }
            }
            
            if (ids.length > 0) {
                aliance.innerHTML = "Ali";
                page.addElement(aliance.parentNode, "span", linky, aliance.nextSibling);
            }
            */
        }
        
    }    
});

pageExtenders.add(alianceLinkExtender);

// Zabranit dvojklikum na linky
var SafeLink = {
    releaseLink: function() {
        if (this._last != null) {
            clearTimeout(this._timer);
        
            var _this = this;
            this._last.onclick = function() { _this.initReleaseTimer(this); };
            this._last.style.color = "";
            this._last = null;
        }
    },

    initReleaseTimer: function(elem) {
        this.releaseLink();
        
        this._last = elem;
        elem.onclick = function() { return false; };
        elem.style.color = "red";
        
        this._timer = setTimeout(function() { this.releaseLink(); }, 1500);
    }
};

var safeLinkExtender = PageExtender.create({
    analyze: function(page, context) {
        context.linky = $XL('//a[@href != "javascript://" and not(@onclick)]');    
        return context.linky.length > 0;
    },
    
    process: function(page, context) {
        context.linky.each(function(e)
            {
                e.onclick = function() { SafeLink.initReleaseTimer(this); };
            });
    }
});
    
pageExtenders.add(safeLinkExtender);
