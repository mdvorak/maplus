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
    getName: function() { return "Aliance - Moje"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];

        if (!typStranky) {
            // Proved analyzu
            var table = $X('table[2]', page.content);

            if (table != null) {
                var aliConfig = page.config.getRegent().getPrefNode("aliance", true);
                var aliance = new Array();

                for (var i = 0; i < table.rows.length; i++) {
                    var tr = table.rows[i];
                    var nastavit = $X('a[starts-with(@href, "aliance.html") and font = "Nastavit"]', tr.cells[3]);

                    // Pokud v nejakym radku neni link nastavit sme na spatne obrazovce! (nastane pri nabidce paktu napr)
                    if (nastavit == null)
                        return false;

                    var m = nastavit.href.match(/&aliance=nastavit_(-?\d+)/);
                    var id = (m != null) ? m[1] : null;

                    // Id nenalezeno, tohle by sice nemelo nastat ale..
                    if (id == null)
                        continue;

                    var jmeno = tr.cells[0].textContent.replace(/\s+$/, "");
                    var presvedceni = tr.cells[2].textContent[0];

                    aliance.push(Number(m[1]));

                    // Aktualizuj alianci
                    MaData.aktualizujAlianci(jmeno, id, presvedceni);
                }

                logger().debug("Jsem clenem alianci: %o", aliance);
                aliConfig.clearChildNodes();
                aliance.each(function(id) {
                    aliConfig.addPref("id", id);
                });

                // Uloz jejich typ pokud se da odvodit a neni jiz znam
                if (aliance.length == 2) {
                    var a1 = MaData.najdiAlianci(null, aliance[0]);
                    var a2 = MaData.najdiAlianci(null, aliance[1]);

                    if (a1.typ == "tajna" && a2.typ != "verejna") {
                        MaData.aktualizujAlianci(a2.jmeno, null, null, "verejna");
                    }
                    else if (a1.typ == "verejna" && a2.typ != "tajna") {
                        MaData.aktualizujAlianci(a2.jmeno, null, null, "tajna");
                    }
                    else if (a2.typ == "tajna" && a1.typ != "verejna") {
                        MaData.aktualizujAlianci(a1.jmeno, null, null, "verejna");
                    }
                    else if (a2.typ == "verejna" && a1.typ != "tajna") {
                        MaData.aktualizujAlianci(a1.jmeno, null, null, "tajna");
                    }
                }
            }
            else {
                var nejsemClenem = $X('font[starts-with(., "Momentálně") and contains(., "nejste")]', page.content);

                if (nejsemClenem != null) {
                    page.config.getRegent().getPrefNode("aliance", true).clearChildNodes();
                    logger().debug("Nejsem clenem zadne aliance.");
                }
            }
        }

        return true;
    },

    process: null
}));

// Analyza seznamu alianci
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Seznam"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (typStranky != "vypis_alianci")
            return false;

        var tableAliance = $X('font[contains(b, "Výpis")]/table', page.content);
        if (tableAliance == null)
            return false;

        for (var i = 2; i < tableAliance.rows.length - 1; i++) {
            var tr = tableAliance.rows[i];
            var aVypis = $X('td[1]/font/a', tr);
            if (aVypis == null)
                continue;

            var id = aVypis.getAttribute("href");
            if (id) id = id.match(/&aliance=vypis_clenu_v_ally_(-?\d+)\b/);
            if (id) id = parseInt(id[1]);

            if (id && !isNaN(id)) {
                var jmeno = tr.cells[1].textContent.replace(/\s+$/, "");
                var presvedceni = tr.cells[4].textContent.replace(/\s/g, "")[0];

                MaData.aktualizujAlianci(jmeno, id, presvedceni);
            }
        }

        if (page.arguments["prehled"] != "top") {
            MaData.seznamAlianciUpdatovan();
        }
        return true;
    },

    process: null
}));

// Analyza clenu aliance + aktivni id
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Clenove"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("vypis_clenu_v_ally_") != 0)
            return false;

        var tableClenove = XPath.evalSingle('table[2]', page.content);
        if (tableClenove == null)
            return false;

        var jmenoAliance = XPath.evalString('font/i', page.content);
        var idAliance = page.arguments["aliance"].match(/vypis_clenu_v_ally_(-?\d+)$/);
        if (idAliance) idAliance = parseInt(idAliance[1]);

        if (!jmenoAliance || !idAliance || isNaN(idAliance))
            return false;

        // Prvne aktualizuj samotnou ali
        MaData.aktualizujAlianci(jmenoAliance, idAliance, null, "verejna");

        // Zjisti presvedceni
        var aliance = MaData.najdiAlianci(jmenoAliance);
        var presvedceni = (aliance && aliance.presvedceni != "") ? aliance.presvedceni : null;

        // Pak ji nastav clenum (a zrus tem co uz tam nejsou)
        var clenovePuvodni = MaData.clenoveAliance(jmenoAliance);
        context.idClenu = new Array();

        for (var i = 1; i < tableClenove.rows.length - 2; i++) {
            var tr = tableClenove.rows[i];

            var id = parseInt(tr.cells[0].textContent.replace(/\s+$/, ""));
            var regent = tr.cells[1].textContent.replace(/\s+$/, "");
            var provincie = tr.cells[2].textContent.replace(/\s+$/, "");

            if (!isNaN(id)) {
                MaData.aktualizujProvincii(id, regent, provincie, null, presvedceni, jmenoAliance);
                clenovePuvodni = clenovePuvodni.without(id);

                // Pro aktivni id
                context.idClenu.push({
                    id: id,
                    element: tr.cells[0].childNodes[0]
                });
            }
        }

        // Zrus ji provinciim ktere uz tam nejsou
        clenovePuvodni.each(function(id) {
            MaData.aktualizujProvincii(id, null, null, null, null, ZADNA_ALIANCE);
        });

        return (context.idClenu.length > 0);
    },

    process: function(page, context) {
        // Aktivni id
        context.idClenu.each(function(i) {
            var a = MaPlus.Tooltips.createActiveId(page, i.id)

            i.element.innerHTML = "&#xA0;&#xA0;&#xA0;&#xA0;";
            i.element.insertBefore(a, i.element.firstChild);
        });
    }
}));

// Analyza clenu vypisu moji aliance
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Vypis aliance"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("vypsat_") != 0)
            return false;

        var table = $X('font[3]/table', page.content);
        if (table == null)
            return false;

        // Analyza
        var jmenoAliance = XPath.evalString('font[1]', page.content);
        var idAliance = parseInt(typStranky.match(/(?:vypsat_(-?\d+))?/)[1]);

        if (jmenoAliance == null || jmenoAliance.blank())
            return false;

        if (isNaN(idAliance))
            idAliance = null;

        // Pouze tajna aliance ma vice nez 25 clenu
        var typAliance = null;
        if (table.rows.length > MAX_CLENU_VEREJNE_ALIANCE) {
            typAliance = "tajna";
        }

        // Uloz id nebo typ aliance
        if (typAliance != null || idAliance != null) {
            MaData.aktualizujAlianci(jmenoAliance, idAliance, null, typAliance);
        }

        // Zkus ziskat svoje presvedceni
        var presvedceni = null;
        var provincie = MaData.najdiProvincii(page.id);
        if (provincie != null) {
            presvedceni = provincie.presvedceni;
        }

        // Shromazdeni dat o alianci
        page.aliance = {
            id: idAliance,
            jmeno: jmenoAliance,
            clenove: new Array(),
            novackovska: (idAliance < 0)
        }

        // Projdi cleny
        var clenovePuvodni = MaData.clenoveAliance(jmenoAliance);
        context.idClenu = new Array();

        for (var i = 0; i < table.rows.length; i++) {
            var tr = table.rows[i];

            var id = parseInt(tr.cells[0].textContent);
            var regent = tr.cells[1].textContent.replace(/\s+$/, "");
            var jmenoProvincie = tr.cells[2].textContent.replace(/\s+$/, "");

            if (isNaN(id))
                continue;

            clenovePuvodni = clenovePuvodni.without(id);
            MaData.aktualizujProvincii(id, regent, jmenoProvincie, null, presvedceni, jmenoAliance);

            // Pro aktivni id
            context.idClenu.push({ element: tr.cells[0], id: id });

            // Pro hlidku
            var sila = parseInt(tr.cells[3].textContent.replace(/^\s*Síla\s+P.s*/, ""));

            logger().log("Clen aliance: id=%d regent=%s provincie=%s sila=%d", id, regent, provincie, sila);
            page.aliance.clenove.push({
                id: id,
                regent: regent,
                provincie: jmenoProvincie,
                sila: sila
            });
        }

        // Zrus ji provinciim ktere uz tam nejsou
        clenovePuvodni.each(function(id) {
            MaData.aktualizujProvincii(id, null, null, null, null, ZADNA_ALIANCE);
        });

        context.table = table;
        return true;
    },

    process: function(page, context) {
        // Aktivni id
        context.idClenu.each(function(i) {
            var a = MaPlus.Tooltips.createActiveId(page, i.id)
            a.innerHTML = '<span>' + i.id + '</span>';

            i.element.innerHTML = "<span>&#xA0;&#xA0;</span>";
            i.element.insertBefore(a, i.element.firstChild);
        });
    }
}));


// Analyza clenu - Nastaveni aliance
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Analyza Nastaveni"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("nastavit_") != 0)
            return false;

        // Seznam radku se clenama
        var rows = $XL('table[2]/tbody/tr[position() > 1 and count(td) >= 7]', page.content);

        // Zjisit jaka aliance to je
        var jmenoAliance = null;
        var presvedceni = null;
        var idAliance = parseInt(typStranky.match(/(?:nastavit_(-?\d+))?/)[1]);

        if (!isNaN(idAliance)) {
            var aliance = MaData.najdiAlianci(null, idAliance);

            if (aliance != null && aliance.typ != "tajna") {
                // Pokud je pocet clenu vetsi nez max u verejky, oznac ji jako tajnou
                if (rows.length > MAX_CLENU_VEREJNE_ALIANCE) {
                    aliance.typ = "tajna";
                    MaData.aktualizujAlianci(aliance.jmenoAliance, null, null, aliance.typ);
                }
            }

            if (aliance != null) {
                // Pokud je aliance tajna bude automaticky jako tajna nastavena
                jmenoAliance = aliance.jmeno;
                presvedceni = aliance.presvedceni;
            }
            else {
                idAliance = null;
            }
        }

        // Analyza
        var clenovePuvodni = MaData.clenoveAliance(jmenoAliance);

        // Shromazdeni dat o alianci
        page.aliance = {
            id: idAliance,
            jmeno: jmenoAliance,
            clenove: new Array(),
            novackovska: (idAliance < 0)
        }

        // Vytvor seznam radku se clenama
        rows.each(function(tr) {
            var offset = tr.cells[0].className == 'online_status' ? 1 : 0;
        
            var link = $X('td[' + (offset + 3) + ']/font/a', tr);
            var id = parseInt(link.textContent);
            if (isNaN(id))
                return; // continue;

            var regent = tr.cells[offset + 3].textContent.replace(/\s+$/, "");
            var provincie = tr.cells[offset + 4].textContent.replace(/\s+$/, "");
            var povolani = tr.cells[offset + 5].textContent.replace(/\s+$/, "");

            clenovePuvodni = clenovePuvodni.without(id);
            MaData.aktualizujProvincii(id, regent, provincie, povolani, presvedceni, jmenoAliance);

            // Pro hlidku
            var sila = parseInt(tr.cells[offset + 6].textContent);

            logger().log("Clen aliance: id=%d regent=%s provincie=%s sila=%d povolani=%d", id, regent, provincie, sila, povolani);
            page.aliance.clenove.push({
                id: id,
                regent: regent,
                provincie: provincie,
                povolani: povolani,
                sila: sila
            });
        });

        // Zrus ji provinciim ktere uz tam nejsou
        clenovePuvodni.each(function(id) {
            MaData.aktualizujProvincii(id, null, null, null, null, ZADNA_ALIANCE);
        });

        return true;
    },

    process: null
}));


// Hromadne zpravy - Nastaveni aliance
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Hromadne Zpravy"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("nastavit_") != 0)
            return false;


        // Vytvor seznam radku se clenama
        context.clenove = new Array();
        var rows = $XL('table[2]/tbody/tr[position() > 1 and count(td) >= 7]', page.content);

        context.offset = (rows.length > 0 && rows[0].cells[0].className == 'online_status') ? 1 : 0;

        rows.each(function(tr) {
            var link = $X('td[' + (context.offset + 3) + ']/font/a', tr);
            var id = parseInt(link.textContent);
            if (isNaN(id))
                return; // continue;

            context.clenove.push({ element: tr, id: id, link: link });
        });

        // Nepokracuj pokud nenalezeny zadni clenove
        if (context.clenove.length == 0)
            return false;

        context.tbody = context.clenove[0].element.parentNode;
        context.trComment = $X('table[2]/tbody/tr[last() - 1]', page.content);
        return true;
    },

    process: function(page, context) {
        var checks = new Array();

        // Pridej checkboxy k jednotlivym clenum
        context.clenove.each(function(row) {
            var fontId = row.link.parentNode;
            var tdJmeno = row.element.cells[context.offset + 3];

            // Napsat checkbox
            var check = Element.create("input", null, { type: "checkbox", style: "margin-top: 0px; margin-bottom: 1px" });
            tdJmeno.insertBefore(check, tdJmeno.firstChild);
            checks.push({ element: check, id: row.id });

            // Aktivni id
            var idLink = MaPlus.Tooltips.createActiveId(page, row.id);
            fontId.replaceChild(idLink, row.link);
            row.link = idLink;
        });

        // Novy radek
        var tr = context.tbody.insertBefore(Element.create("tr"), context.trComment);
        tr.appendChild(Element.create("td", null, { colspan: context.offset + 3 }));

        var spanNapsat = tr.appendChild(Element.create("td", null, { colspan: 4 }))
                           .appendChild(Element.create("span"));

        // Pridej Napsat vsem checkbox
        var checkNapsatVsem = spanNapsat.appendChild(Element.create("input", null, { type: "checkbox", style: "margin-top: 0px; margin-bottom: 1px" }));
        Event.observe(checkNapsatVsem, 'change', function() {
            var v = checkNapsatVsem.checked;
            checks.each(function(i) { i.element.checked = v; });
        });

        spanNapsat.appendChild(document.createTextNode("\xA0"));

        // Pridej Napsat oznacenym link
        var linkNapsatOznacenym = spanNapsat.appendChild(Element.create("a", '<span>Napsat označeným</span>', { href: "javascript://" }));
        Event.observe(linkNapsatOznacenym, 'click', function(event) {
            var ids = new Array();
            checks.each(function(i) {
                if (i.element.checked)
                    ids.push(i.id);
            });

            // Redirect
            document.location.href = MaPlus.buildUrl(page, "posta.html", { posta: "napsat", komu: ids.join(",") });
            event.returnValue = true;
        });
    }
}));

// Cerpani
pageExtenders.add(PageExtender.create({
    CERPAT: 10000000,

    getName: function() { return "Aliance - Cerpani"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (!typStranky || typStranky.search("cerpani_") != 0)
            return false;

        context.form = $X('.//form[@action = "aliance.html"]', page.content);
        context.inputKolik = $X('.//input[@name = "kolik"]', context.form);
        context.fontSubmit = $X('.//font[input[@type = "submit"]]', context.form);

        if (context.form == null || context.inputKolik == null || context.fontSubmit == null)
            return false;

        return true;
    },

    process: function(page, context) {
        var _this = this;
        var btn = Element.create("input", null, { type: "button", value: "\xA0Čerpat maximum\xA0", title: "Pokusí se čerpat 1000000" });

        Event.observe(btn, 'click', function() {
            context.inputKolik.value = _this.CERPAT;
            context.form.submit();
        });

        context.fontSubmit.appendChild(document.createTextNode('\xA0'));
        context.fontSubmit.appendChild(btn);
    }
}));

// Linky na dalsi cerpani
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Cerpano"; },

    analyze: function(page, context) {
        var typStranky = page.arguments["aliance"];
        if (typStranky != null) // Cerpa se vzdy pres POST
            return false;

        // Zjisti jestli opravdu bylo cerpano    
        var fontZprava = $X('font[starts-with(., "ID ")]', page.content);
        if (fontZprava == null || !fontZprava.textContent.match(/^ID\s.*?\sposlal\(a\)\s\d+\s\w+$/))
            return false;

        // Najdi moje aliance a jejich jmena
        var moje = page.config.getRegent().getPrefNode("aliance", true).evalPrefNodeList("id");
        if (moje.length == 0)
            return false;

        context.aliance = new Array();
        moje.each(function(cfg) {
            var id = cfg.getNumber();
            var a = MaData.najdiAlianci(null, id);

            context.aliance.push({
                id: id,
                jmeno: (a != null ? a.jmeno : id)
            });
        });

        return context.aliance.length > 0;
    },

    process: function(page, context) {
        page.content.appendChild(Element.create("br"));

        context.aliance.each(function(i) {
            page.content.appendChild(Element.create("br"));

            var url = MaPlus.buildUrl(page, "aliance.html", { aliance: "cerpani_" + i.id });
            var link = Element.create("a", '<span>Znovu čerpat v alianci ' + i.jmeno + '</span>', { href: url });
            page.content.appendChild(link);
        });
    }
}));


var HlidkaHeslo = Marshal.getObjectProxy("HlidkaHeslo");

// Hlidka
pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Hlidka"; },

    analyze: function(page, context) {
        if (page.aliance == null || page.aliance.clenove.length == 0)
            return false;
        if (isNaN(page.cas)) {
            logger().error("Neni znam cas MA.");
            return false;
        }

        // Zjisti url hlidky
        var cfg = page.config.getPrefNode("hlidka", true).evalPrefNode('aliance[@id = "' + page.aliance.id + '"]');
        if (cfg == null)
            return false;

        context.url = cfg.getPref("url");
        if (context.url == null || context.url.length < 10)
            return false;

        context.login = cfg.getPref("login");

        // Zpetna kompatibilita k verzi 1.2.2 (odstranit po rekneme 1.3.2008)
        /*
        var password = cfg.getPref("heslo");
        if (password != null) {
        if (HlidkaHeslo.getPassword(context.url, context.login) == null)
        HlidkaHeslo.setPassword(context.url, context.login, password);
        cfg.setPref("heslo", null);
        }
        */

        // Odeslat hlidku automaticky?
        context.odeslat = String.equals(page.arguments["hlidka"], "true", true);

        // Zobrazit tlacitko?
        var typStranky = page.arguments["aliance"];
        if (typStranky.search("vypsat_") == 0 && cfg.getBoolean("zobrazitVypis"))
            context.tlacitko = true;
        else if (typStranky.search("nastavit_") == 0 && cfg.getBoolean("zobrazitNastaveni"))
            context.tlacitko = true;
        else
            context.tlacitko = false;

        return true;
    },

    process: function(page, context) {
        var odeslatHlidku = this.odeslatHlidku.bind(this);

        // Element kam vlozit tlacitko/info
        var spanInfo = Element.create("span", null, { "class": "message" });
        page.content.insertBefore(spanInfo, $X('table[1]', page.content).nextSibling);

        // iframe pro vysledek hlidky
        var divVysledek = Element.create("div", null, { style: "display: none;" });

        var iframe = Element.create("iframe", null, { id: "plus_hlidka", name: "plus_hlidka", style: "width: 100%; max-width: 700px; min-height: 150px; border-color: gray;" });
        divVysledek.appendChild(Element.create("span", "Výsledek hlídky:"));
        divVysledek.appendChild(Element.create("br"));
        divVysledek.appendChild(iframe);

        Event.observe(iframe, "load", function(event) {
            try {
                var docref = Marshal.getDocumentReference();
                var size = Marshal.callMethod("FrameHelper", "getFrameContentSize", [docref, iframe.id]);
                if (size.height > 0)
                    iframe.style.height = (size.height + 15) + "px";
            }
            catch (ex) {
                logger().warn("Nepodarilo se ziskat velikost dokumentu v iframu: %o", ex);
            }
        });

        page.content.appendChild(divVysledek);

        // Odesli hlidku pokud to bylo vyzadano
        if (context.odeslat) {
            // Skryt form "Vystoupit z aliance"
            var formVystoupit = $X('//form[@action = "aliance.html" and .//input[contains(@value, "Vystoupit z aliance")]]');
            if (formVystoupit) formVystoupit.parentNode.removeChild(formVystoupit);

            // Odesli hlidku
            var scroll = String.equals(page.arguments["scroll"], "true", true);
            divVysledek.style.display = "";
            odeslatHlidku(page, context.url, context.login, iframe, spanInfo, scroll);
            return;
        }

        // Vytvor tlacitko pro odeslani
        if (!context.tlacitko)
            return;

        var odeslat = Element.create("input", null, { value: "Odeslat hlídku", type: "button", style: "height: 20px;" });
        spanInfo.appendChild(odeslat);

        // Event handler
        Event.observe(odeslat, "click", function(event) {
            Event.stop(event);

            odeslat.blur();
            odeslat.style.display = "none";

            divVysledek.style.display = "";
            odeslatHlidku(page, context.url, context.login, iframe, spanInfo, true);
        });
    },

    odeslatHlidku: function(page, url, login, targetFrame, progressElement, scroll) {
        // Neodesilej hlidku 2x
        if (page.aliance.hlidka > 0) {
            logger().warn("Hlidka jiz odeslana (stav=%d)", page.aliance.hlidka);
            return;
        }
        
        // Pokud je stranka starsi nez minutu, udelej rovnou refresh
        if (new Date().getTime() - Date.parse(document.lastModified) > 60000) {
            progressElement.innerHTML = "Probíhá obnovení stránky. Čekejte...";

            var args = $H(page.arguments);
            delete args["id"];
            delete args["code"];
            delete args["ftc"];
            args["hlidka"] = "true";
            args["scroll"] = scroll;

            document.location.href = MaPlus.buildUrl(page, "aliance.html", args);
            return;
        }
        
        // Validuj cas (je to +/- 5 minut)
        // TODO co casove zony?
        var drift = (Date.parse(document.lastModified) - page.cas) / 1000; // v sec
        if (drift > 300 || drift < -300) {
            var override = confirm("Buďto se pokoušíte odeslat neaktuální hlídku, nebo vám jdou špatně hodiny.\nChcete přesto pokračovat?");
            if (!override) {
                progressElement.innerHTML = "Odesílání hlídky přerušeno.";
            
                return;
            }
        }

        page.aliance.hlidka = 1;
        logger().debug("Vytvareni formulare hlidky..");

        progressElement.innerHTML = "Probíhá odesílání hlídky. Čekejte..."

        // Ziskej heslo
        var heslo = HlidkaHeslo.getPassword(url, login);

        // Vytvor form
        var form = Element.create("form", null, { action: url, target: targetFrame.name, method: "post" });
        form.appendChild(Element.create("input", null, { name: "login", value: login || "", type: "hidden" }));
        form.appendChild(Element.create("input", null, { name: "heslo", value: heslo || "", type: "hidden" }));

        form.appendChild(Element.create("input", null, { name: "kdo", value: page.id, type: "hidden" }));
        form.appendChild(Element.create("input", null, { name: "cas", value: page.cas, type: "hidden" }));
        form.appendChild(Element.create("input", null, { name: "aliance", value: page.aliance.jmeno, type: "hidden" }));
        form.appendChild(Element.create("input", null, { name: "zlato", value: page.provincie().zlato || "", type: "hidden" }));

        // Sily clenu
        for (var i = 0; i < page.aliance.clenove.length; i++) {
            var data = page.aliance.clenove[i];
            if (isNaN(data.id) || isNaN(data.sila)) {
                logger().warn("Pozor: nepouzitelny zaznam (id=%d sila=%d)", data.id, data.sila);
                continue;
            }

            form.appendChild(Element.create("input", null, { name: "hraci[" + data.id + "]", value: data.sila, type: "hidden" }));
        }

        page.content.appendChild(form);

        // Reakce na nacteni framu
        Event.observe(targetFrame, "load", function(event) {
            page.aliance.hlidka = 2;
            logger().info("Hlidka dokoncena");

            if (progressElement != null)
                progressElement.innerHTML = "Hlídka dokončena";

            if (scroll)
                window.scrollBy(0, document.height);
        });

        // Odesli form
        logger().info("Odesilani hlidky..");
        form.submit();
    }
}));


pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Potvrzeni pri vystoupeni z aliance"; },

    analyze: function(page, context) {
        context.form = $X('//form[@action = "aliance.html" and .//input[contains(@value, "Vystoupit z aliance")]]');
        return (context.form != null);
    },

    process: function(page, context) {
        Event.observe(context.form, "submit", function(event) {
            if (!confirm('Opravdu chcete opustit alianci?'))
                Event.stop(event);
        });
    }
}));


pageExtenders.add(PageExtender.create({
    getName: function() { return "Aliance - Formatovani formularu s pakty"; },

    analyze: function(page, context) {
        context.forms = $XL('.//form[@action = "aliance.html"]', page.content);
        return context.forms.length > 0;
    },

    process: function(page, context) {
        context.forms.each(function(f) {
            f.style.margin = '0px';
        });
    }
}));
