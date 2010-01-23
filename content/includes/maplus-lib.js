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

Object.extend(Boolean, {
    parse: function(str) {
        if (str == null)
            return false;
        
        if (String.equals(str, "true", true))
            return true;
        var n = parseInt(str);
        return !isNaN(n) && (n != 0);
    }
});

var MaPlus = {
    buildUrl: function(page, pageName, args) {
        if (!page || !pageName)
            throw new Exception("Missing argument.");
            
        var url = pageName + "?id=" + page.id + "&code=" + page.code;
        if (page.ftc) url += "&ftc=" + page.ftc;
        
        if (args) {
            if (args instanceof Hash) {
                args.keys().each(function(k) {
                    var v = args[k];
                    if (v != null)
                        url += "&" + k + "=" + v; 
                });
            }
            else {
                for (var k in args) {
                    var v = args[k];
                    if (v != null)
                        url += "&" + k + "=" + v; 
                }
            }
        }
        
        return url;
    }
};

/*** Colors ***/
var Color = {
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

Color.Pickers = {
    redGreen: function(colors) {
        colors.red = Math.max(0, Math.min(250, 225 * (1 - colors.koeficient) * 2));
        colors.green = Math.max(0, Math.min(240, 220 * colors.koeficient * 2));
        colors.blue = 30; 
    },

    blueWhite: function(colors) {
        colors.red = Math.max(0, Math.min(240, 240 * colors.koeficient));
        colors.green = Math.max(0, Math.max(40, Math.min(240, 240 * colors.koeficient)));
        colors.blue = 240; 
    },
  
    grayGold: function(colors) {
        colors.red = Math.max(0, 200 + Math.min(55, 55 * colors.koeficient)); 
        colors.green = Math.max(0, 200 + Math.min(15, 15 * colors.koeficient)); ;
        colors.blue = Math.max(0, Math.min(200, 200 * (1 - colors.koeficient))); 
    },
    
    whiteBrown: function(colors) {
        colors.red = Math.max(167, Math.min(240, 240 * colors.koeficient));
        colors.green = Math.max(118, Math.min(240, 240 * colors.koeficient));
        colors.blue = Math.max(109, Math.min(240, 240 * colors.koeficient)); 
    },
    
    grayBrown: function(colors) {
        colors.red = Math.max(167, Math.min(180, 180 * colors.koeficient));
        colors.green = Math.max(118, Math.min(180, 180 * colors.koeficient));
        colors.blue = Math.max(109, Math.min(180, 180 * colors.koeficient)); 
    },
    
    grayWhite: function(colors) {
        colors.blue = colors.green = colors.red = 160 + 60 * colors.koeficient; 
    },
    
    grayRed: function(colors) {
        colors.red = Math.max(192, Math.min(240, 240 * colors.koeficient));
        colors.green = Math.max(20, Math.min(192, 245 * (1 - colors.koeficient)));
        colors.blue = Math.max(20, Math.min(192, 210 * (1 - colors.koeficient))); 
    }
};

/*** SafeLink class ***/

// Brani dvojklikum na linky
var SafeLink = {
    TIMEOUT: 2000,
    
    initLink: function(link) {
        if (!link)
            throw new ArgumentNullException("link");
            
        link.onclick = function() { SafeLink._startTimer(this); };
    },

    _releaseLink: function() {
        if (this._last != null) {
            clearTimeout(this._timer);
        
            this._last.onclick = function() { SafeLink._startTimer(this); };
            this._last.style.color = "";
            this._last = null;
        }
    },

    _startTimer: function(elem) {
        this._releaseLink();
        
        this._last = elem;
        elem.onclick = function() { return false; };
        elem.style.color = "red";
        
        this._timer = setTimeout(function() { SafeLink._releaseLink(); }, SafeLink.TIMEOUT);
    }
};

/*** MaPlus.Tooltips ***/

MaPlus.Tooltips = {
    createActiveId: function(page, id, /* optional */ link) {
        id = parseInt(id);
        if (isNaN(id))
            return null;
    
        // Vytvoreni linku (pokud neexistuje)
        if (link == null) {
            link = document.createElement("a");
            link.className = "idLink";
            link.href = "javascript://";
            link.innerHTML = id;
        }
            
        var tooltipName = "id_" + id;
        
        if (!Tooltip.isRegistered(tooltipName)) {
            var _this = this;
            Tooltip.register(tooltipName, function() { return _this._createActiveIdTooltip(page, id); });
        }
                
        Tooltip.attach(link, tooltipName);
        return link;
    },
    
    createActiveUnit: function(page, jmeno, /* optional */ link) {
        var jednotka = Jednotky.vyhledej(jmeno);
        if (!jednotka)
            return null;
            
        // Vytvoreni linku (pokud neexistuje)
        if (link == null) {
            link = document.createElement("a");
            link.className = "idLink";
            link.href = "javascript://";
            link.innerHTML = jmeno;
        }
            
        var tooltipName = "jednotka_" + jmeno;
        
        if (!Tooltip.isRegistered(tooltipName)) {
            var _this = this;
            Tooltip.register(tooltipName, function() { return _this._createActiveUnitTooltip(page, jednotka); });
        }
                
        Tooltip.attach(link, tooltipName);
        return link;
    },
    
    createHelp: function(page, text, /* optional */ link) {
        // Vytvoreni linku (pokud neexistuje)
        if (link == null) {
            link = document.createElement("a");
            link.className = "helpLink";
            link.href = "javascript://";
            link.innerHTML = "?";
        }
        
        var tooltipName = "help_" + text.substring(0, 5) + "_" + Math.random(); // Pravdepodobnost ze bych se sesli stejna id je minimalni
        
        if (!Tooltip.isRegistered(tooltipName)) {
            var _this = this;
            Tooltip.register(tooltipName, function() { return Tooltip.create('<span>' + text + '</span>', 'helpTooltip'); });
        }
                
        Tooltip.attach(link, tooltipName);
        return link;
    },

    _createActiveIdTooltip: function(page, id) {
        // Najdi informace o hraci
        var provincie = MaData.najdiProvincii(id);
        
        var html = '<table>';
        html += '<tr>';
        html += '  <td colspan="2"><span><b>' + id + '</b>&#xA0;</span>';
        html += '  <sup><span class="small"><a href="javascript://">(zkopírovat)</a></span></sup></td>';
        html += '</tr>';
        html += '<tr><td colspan="2"><a href="' + MaPlus.buildUrl(page, "setup.html", {setup: "spehovani", nolinks: 1, koho: id}) + '"><span>Vyslat špehy</span></a></td></tr>';
        html += '<tr><td colspan="2"><a href="' + MaPlus.buildUrl(page, "posta.html", {posta: "napsat", komu: id}) + '"><span>Napsat zprávu</span></a></td></tr>';

        // Dalsi info
        if (provincie) {
            var pridejRadek = function(jmeno, hodnota) {
                if (hodnota && hodnota != "")
                    html += '<tr><td><span class="small">' + jmeno + '&#xA0;&#xA0;</span></td><td><span class="small">' + hodnota + '</span></td></tr>'
            };
        
            html += '<tr><td height="5"></td></tr>';
            pridejRadek("Regent", provincie.regent);
            pridejRadek("Provincie", provincie.provincie);
            pridejRadek("Přesvědčení", JMENA_PRESVEDCENI[provincie.presvedceni]);
            pridejRadek("Povolání", provincie.povolani);

            if (provincie.alianceZnama) {
                var aliance = MaData.najdiAlianci(provincie.aliance);
                
                if (aliance) {
                    var url = MaPlus.buildUrl(page, "aliance.html", {aliance: "vypis_clenu_v_ally_" + aliance.id});
                    pridejRadek("Aliance", '<a href="' + url + '">' + provincie.aliance + '</a>');
                }
                else {
                    pridejRadek("Aliance", provincie.aliance || '<span class="alianceNeznama small">Žádná</span>');
                }
            }
        }
        
        html += '</table>';
        
        var tooltip = Tooltip.create(html, "tooltip", false);
        
        var copyLink = $X('table/tbody/tr/td/a', tooltip);
        if (!copyLink)
            throw new Exception("Internal error. Copy link not found.");
        
        Event.observe(copyLink, 'click', function() {
            Clipboard.copyId(id);
        }, false);
            
        return tooltip;
    },
    
    _createActiveUnitTooltip: function(page, jednotka) {
        // Sestav html tooltipu
        if (!page.jednotkaTemplate) {
            // Je zbytecne text cachovat kdyz se stejne vytvori template pro vsechny extendery
            var template = Chrome.loadText("html/jednotka.html", false); 
            if (!template)
                throw new Exception("Nepodarilo se nacist html template jednotky.");
        
            page.jednotkaTemplate = new Template(template);
        }
        
        // Uprav data o jednotce pro zobrazeni
        jednotka.iniColor = Color.fromRange(jednotka.realIni, 5, 35, Color.Pickers.redGreen);
        jednotka.phb = (jednotka.typ != "Str.") ? jednotka.phb : "";
        jednotka.druh = jednotka.druh.replace(/[.]$/, "");
        jednotka.typ = jednotka.typ.replace(/[.]$/, "");
        
        var html = page.jednotkaTemplate.evaluate(jednotka);
        var tooltip = Tooltip.create(html, "tooltip", false);
        
        return tooltip;
    }
};

/** ElementDataStore class **/

// FF ztraci JS objekty naveseny na elementy pri manipulaci s nima
var ElementDataStore = {
    _lastId: 0,
    _data: new Hash(),
    
    _getElementId: function(element) {
        var id = element.getAttribute("datastoreid");
        
        if (id == null) {
            id = String(++this._lastId);
            element.setAttribute("datastoreid", id);
        }
        
        return id;
    },
    
    get: function(element) {
        var id = this._getElementId(element);
        var data = this._data[id];
        
        if (data == null) {
            data = { element: element };
            this._data[id] = data;
        }
        
        return data;
    }
};

/** TableHelper class **/

var TableHelper = {
    filter: function(table, callback) {
        if (table == null) throw new ArgumentNullException("table");
        if (callback == null) throw new ArgumentNullException("callback");
        if (!String.equals(table.tagName, "table", true))
            throw new ArgumentException("table", table, "Argument must be a table element.");
    
        for (var i = 0; i < table.rows.length; i++) {
            var row = ElementDataStore.get(table.rows[i]);
            var show = callback(row, i);
            table.rows[i].style.display = show ? '' : 'none';
        }
    },

    sort: function(table, callback) {
        if (table == null) throw new ArgumentNullException("table");
        if (callback == null) throw new ArgumentNullException("callback");
        if (!String.equals(table.tagName, "table", true))
            throw new ArgumentException("table", table, "Argument must be a table element.");
    
        if (table.rows.length == 0)
            return;
            
        var data = ElementDataStore.get(table);
        var tbody = table.tBodies[0];
        var sortArr = new Array();

        for (var i = 0; i < table.rows.length; i++) {
            if (table.rows[i] != data.sortRow) {
                var row = ElementDataStore.get(table.rows[i]);
                sortArr.push(row);
            }
        }
        
        sortArr.sort(callback);
        
        if (data.sortRow == null) {
            data.sortRow = table.ownerDocument.createElement("tr");
            data.sortRow.style.display = 'none';
        }
        if (data.sortRow != table.rows[0]) {
            tbody.insertBefore(data.sortRow, table.rows[0]);
        }
        
        for (var i = 0; i < sortArr.length; i++) {
            tbody.insertBefore(sortArr[i].element, data.sortRow);
        }
    },

    thinBorders: function(table) {
        // Zestihli okraje (urceno primo pro tabulky MA s tlustejma okrajema)
        table.className += "thinBorders";
    }
};

function timeFromNow(presnyCas, vlozSekundy) {
    const NAZVY_DNU = ["v pondělí", "v úterý", "ve středu", "ve čtvrtek", "v pátek", "v sobotu", "v neděli"];

    // Pomocne promenne
    var now = new Date();
    var dnesZbyvaMinut = DEN_MINUT - (now.getHours() * 60 + now.getMinutes());

    if (now.getTime() > presnyCas.getTime())
        return presnyCas.toLocaleString().replace(/:00$/, "");
    
    // Cas kdy k tomu dojde
    var pocetMinut = (presnyCas.getTime() - now.getTime()) / 60000;
    
    // Vytvor text podle doby
    var text = "";
    
    if (pocetMinut < dnesZbyvaMinut)
        text += "dnes ";
    else if (pocetMinut < dnesZbyvaMinut + DEN_MINUT)
        text += "zítra ";
    else if (pocetMinut < dnesZbyvaMinut + 2 * DEN_MINUT)
        text += NAZVY_DNU[(now.getDay() + 1) % 7] + " ";
    else if (pocetMinut < dnesZbyvaMinut + 3 * DEN_MINUT)
        text += NAZVY_DNU[(now.getDay() + 2) % 7] + " ";
    else {
        // Tohle by nemelo nastat ale lepsi mit to pojistene
        text += presnyCas.toLocaleString().replace(/:00$/, "");
        return text;
    }
    
    // Pridej cas v den utoku
    text += "v " + presnyCas.getHours() + ":" + presnyCas.getMinutes().toPaddedString(2);
    
    if (vlozSekundy)
        text += ":" + presnyCas.getSeconds().toPaddedString(2);
    
    text += " (" + presnyCas.toLocaleString().replace(/\s+\d+:\d+:\d+$/, "") + ")";
    
    return text;
}




/*** ScrollbarHelper class ***/
var ScrollbarHelper = {
    getWidth: function() {
        if (DataCache != null && isNaN(this._width))
            this._width = DataCache.retrieve("scrollbarWidth", true);
          
        if (isNaN(this._width)) {
            this._width = this._getScrollerWidth();
            if (DataCache != null)
                DataCache.store("scrollbarWidth", this._width, true);
        }
        
        return this._width;
    },

    _getScrollerWidth: function() {
        // taken from: http://www.fleegix.org/articles/2006/05/30/getting-the-scrollbar-width-in-pixels
        
        var scr = null;
        var inn = null;
        var wNoScroll = 0;
        var wScroll = 0;

        // Outer scrolling div
        scr = document.createElement('div');
        scr.style.position = 'absolute';
        scr.style.top = '-1000px';
        scr.style.left = '-1000px';
        scr.style.width = '100px';
        scr.style.height = '50px';
        // Start with no scrollbar
        scr.style.overflow = 'hidden';

        // Inner content div
        inn = document.createElement('div');
        inn.style.width = '100%';
        inn.style.height = '200px';

        // Put the inner div in the scrolling div
        scr.appendChild(inn);
        // Append the scrolling div to the doc
        document.body.appendChild(scr);

        // Width of the inner div sans scrollbar
        wNoScroll = inn.offsetWidth;
        // Add the scrollbar
        scr.style.overflow = 'auto';
        // Width of the inner div width scrollbar
        wScroll = inn.offsetWidth;

        // Remove the scrolling div from the doc
        document.body.removeChild(scr);

        // Pixel width of the scroller
        return (wNoScroll - wScroll);
    }
};
