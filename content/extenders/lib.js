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
 
var MaPlus = {
    buildUrl: function(page, pageName, args) {
        if (!page || !pageName)
            throw new Exception("Missing argument.");
            
        var url = pageName + "?id=" + page.id + "&code=" + page.code;
        if (page.ftc) url += "&ftc=" + page.ftc;
        
        args.each(function(k) { url += "&" + k + "=" + args[k]; });
        
        return url;
    }
};

function parseTime(str) {
    if (!str) return Number.NaN;
    var m = str.match(/(\d+):(\d+)/);
    return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : Number.NaN;
}

/*** TableHelper ***/

var TableHelper = {
    filter: function(table, callback) {
        for (var i = 0; i < table.rows.length; i++) {
            var show = callback(table.rows[i], i);
            table.rows[i].style.display = show ? '' : 'none';
        }
    },

    sort: function(table, callback) {
        if (table.rows.length == 0)
            return;
            
        var tbody = table.rows[0].parentNode;
        var sortArr = new Array();

        for (var i = 0; i < table.rows.length; i++) {
            if (table.rows[i] != table.sortRow)
                sortArr.push(table.rows[i]);
        }
        
        sortArr.sort(callback);
        
        if(!table.sortRow) {
            table.sortRow = table.ownerDocument.createElement("tr");
            table.sortRow.style.display = 'none';
        }
        if (table.sortRow != table.rows[0]) {
            tbody.insertBefore(table.sortRow, table.rows[0]);
        }
        
        for (var i = 0; i < sortArr.length; i++) {
            tbody.insertBefore(sortArr[i], table.sortRow);
        }
    }
};

/*** Colors ***/

var Colors = {
    fromRange: function(value, min, max, colorPicker) {
        if (isNaN(value) || isNaN(min) || isNaN(max))
            return null;
            
        var inverse = false;
        if (min > max) {
            var tmp = max;
            max = min;
            min = tmp;
            inverse = true;
        }

        if (value > max) value = max;
        if (value < min) value = min;
        
        var percent = (value - min) / (max - min);
        if (inverse) percent = (1 - percent);

        var colors = { koeficient: percent };
        colorPicker(colors);
        
        return "rgb(" + colors.red.toFixed(0) + ", " + colors.green.toFixed(0) + ", " + colors.blue.toFixed(0) + ")";
    }
};

Colors.Picker = {
    redGreen: function(colors) {
        colors.red = Math.min(250, 225 * (1 - colors.koeficient) * 2);
        colors.green = Math.min(240, 220 * colors.koeficient * 2);
        colors.blue = 30; 
    }

    blueWhite: function(colors) {
        colors.red = Math.min(240, 240 * colors.koeficient);
        colors.green = Math.max(40, Math.min(240, 240 * colors.koeficient));
        colors.blue = 240; 
    }


    grayGold: function(colors) {
        colors.red = 200 + Math.min(55, 55 * colors.koeficient); 
        colors.green = 200 + Math.min(15, 15 * colors.koeficient); ;
        colors.blue = Math.min(200, 200 * (1 - colors.koeficient)); 
    }
};

