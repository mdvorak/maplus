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

var TabManager = Class.create();

TabManager.prototype = {
    initialize: function(container) {
    	container = $(container);
    	if (container == null)
    		throw new ArgumentNullException("container");
    		
    	this.container = container;
    	
    	// Root table
    	var tableRoot = Element.create("table");
    	var tbodyRoot = tableRoot.appendChild(Element.create("tbody"));
    	
    	// Create header element
    	var tdHeaderRoot = tbodyRoot.appendChild(Element.create("tr")).appendChild(Element.create("td"));
    	
    	var tableHeader = Element.create("table", null, {cellpadding: 0, cellspacing: 0});
    	var tbodyHeader = tableHeader.appendChild(Element.create("tbody"));
    	
    	var headerContainer = tbodyHeader.appendChild(Element.create("tr"));
    	
    	tdHeaderRoot.appendChild(tableHeader);
    	
    	// Create body element
    	var bodyContainer = tbodyRoot.appendChild(Element.create("tr")).appendChild(Element.create("td"));
    	
    	// Add table to the container
    	container.appendChild(tableRoot);
    	
    	this.headerContainer = headerContainer;
    	this.bodyContainer = bodyContainer;
    	this.tabs = new Array();    	
    },
    
    addTab: function(title, body) {
       if (title == null)
            throw new ArgumentNulLException("title");
        body = $(body);
        if (body == null)
            throw new ArgumentNulLException("body");
        
        var tabs = this.tabs;
        
        // Create header
        var td = Element.create("td", null, {class: "tabHeader"});
        var header = Element.create("a", '<span>\xA0' + title + '\xA0</span>', {href: "javascript://", class: "tabInactive"});
        td.appendChild(header);
        
        if (tabs.length > 0) {
            td.style.borderLeftWidth = "2px";
            header.className = "tabInactive";
            body.style.display = "none";
        }
        else {
            header.className = "tabActive";
            body.style.display = "";
            header.setAttribute("active", true);
        }
        
        // Tab change handler
        Event.observe(header, 'click', function() {
            if (header.getAttribute("active") == "true")
                return;
        
            // Reset status
            tabs.each(function(t) {
                t.header.className = "tabInactive";
                t.header.setAttribute("active", false);
                t.body.style.display = "none";
            });
            
            header.className = "tabActive";
            body.style.display = "";
            header.setAttribute("active", true);
            console.debug("Switched to tab '%s'", title);
        });

        tabs.push({
            title: title,
            header: header,
            body: body
        });
    
        this.headerContainer.appendChild(td);
        this.bodyContainer.appendChild(body);
    }
};
