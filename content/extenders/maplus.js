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
  
 // Plus menu
 var plusMenuExtender = PageExtender.create({
    analyze: function(page, context) {
        context.html = Chrome.loadText("html/maplus.html");
        return (context.html != null);
    },
    
    process: function(page, context) {
        var div = document.createElement("div");
        div.innerHTML = context.html;
        div.style.left = "10px";
        div.style.top = "10px";
        div.style.display = 'block';
        div.style.position = "absolute";
        
        document.body.appendChild(div);
        
        var link = $XF('//a[@id = "plus_enable"]');
        if (!link) 
            throw String.format("Unable to find 'plus_enable' link.");
        
        Event.observe(link, "click", function(event) 
            {
                var value = !page.config.getEnabled();
                page.config.setPref("enabled", value);
                link.updateText(value); // Defined in 'maplus.htm'
            });
            
        var enabled = page.config.getEnabled();
        link.updateText(enabled);
        
        // Stop execution
        if (!enabled)
            throw new AbortException("MaPlus is disabled.");
    }
});

pageExtenders.add(plusMenuExtender);


// Obecne pomucky
var plusExtender = PageExtender.create({
    analyze: function(page, context) {
        context.koho = XPath.evaluateList('//input[@type = "text" and @name = "koho"]');

        if (page.config.getMaxTahu() > 0) {        
            context.kolikwait = XPath.evaluateList('//input[@type = "text" and @name = "kolikwait"]');
        }
    
        return true;
    },
    
    process: function(page, context) {
        // Aby se nesralo formatovani
        if (page.content)
            page.content.setAttribute("valign", "top");
            
        // Oprava idcek
        context.koho.each(function(e) 
            {
                Event.observe(e, 'blur', function() { this.value = this.value.replace(/^\\s+|\\s+$/g, ''); }, true);
            });
            
        // Limit TU
        if (context.kolikwait) {        
            var maxTahu = page.config.getMaxTahu();
            var zprava = "Opravdu chcete odehrát více jak " + maxTahu + " tahů?";
            var buttons = XPath.evaluateList('//input[@type = "submit"]');
            
            context.kolikwait.each(function(e)
                {
                    buttons.each(function(i)
                        {
                            if (i.form == e.form) {
                                Event.observe(i, 'click', function()
                                    {
                                        return (parseInt(e.value) < maxTahu) || confirm(zprava);
                                    }, true);
                                    
                                i.setAttribute("plus", true); // Debug
                            }
                        });
                });
                
            // Pridej kontrolu i na objevovat
            if (context.kolikwait.length > 0 && parseInt(context.kolikwait[0].value) > maxTahu) {
                var cekat = $XF('//a[starts-with(@href, "wait.html")]');
                var objevovat = $XF('//a[starts-with(@href, "explore.html")]');
                
                var zprava2 = "Je možné, že odehrajete více jak " + maxTahu + " tahů, chcete pokračovat?";
                
                if (cekat) {
                    Event.observe(cekat, "click", function() { return confirm(zprava2); }, true);
                    cekat.setAttribute("plus", true); // Debug
                }
                if (objevovat) {
                    Event.observe(objevovat, "click", function() { return confirm(zprava2); }, true);
                    objevovat.setAttribute("plus", true); // Debug
                }
            }
        }
    }    
});

pageExtenders.add(plusExtender);
