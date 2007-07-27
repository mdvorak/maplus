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

var Tooltip = {
    _callbacks: new Hash(),
    _library: new Hash(),

    // Creates tooltip element
    create: function(html, className, hideOnClick) {    
        var tooltip = document.createElement('div');

        if (className)
            tooltip.className = className;
        
        tooltip.style.display = 'none';
        tooltip.style.position = 'absolute';
        tooltip.style.left = '0px';
        tooltip.style.top = '0px';

        if (html)
            tooltip.innerHTML = html;
        
        Event.observe(tooltip, 'mouseout', function(e)
            {
                if (e.pageX < this.offsetLeft || e.pageX >= (this.offsetLeft + this.offsetWidth)
                        || e.pageY < this.offsetTop || e.pageY >= (this.offsetTop + this.offsetHeight)) {
                    this.hide();
                }
            }, false);
            
        if (hideOnClick) 
            Event.observe(tooltip, 'click', function() { this.hide(); }, false);
            
        Element.extend(tooltip);
        Object.extend(tooltip, Tooltip.Methods);
        
        document.body.appendChild(tooltip);
        return tooltip;
    },
    
    getTooltip: function(tooltip) {
        if (!tooltip) 
            throw new ArgumentNullException("tooltip");
            
        if (typeof tooltip == "string") {
            var name = tooltip;
            tooltip = this._library[name];
            
            if (!tooltip) {
                var callback = this._callbacks[name];
                if (!callback)
                    throw new ArgumentException("tooltip", tooltip, "No tooltip of that name registered.");
                    
                tooltip = callback();
                if (!tooltip || !tooltip.ownerDocument)
                    throw new Exception(String.format("Callback for tooltip '{0}' did not returned element.", name));
                
                tooltip.setAttribute("tooltipName", name); //Debug
                this._library[name] = tooltip;
            }
        }
        
        return tooltip;
    },

    register: function(name, createCallback) {
        if (!name || name.empty())
            throw new ArgumentNullException("name");
        if (!createCallback)
            throw new ArgumentNullException("createCallback");
        if (typeof createCallback != "function")
            throw new ArgumentException("createCallback", createCallback, "Callback must be a function.");
        if (this._callbacks[name])
            throw new ArgumentException("name", name, "Callback of that name is already registered.");
            
        this._callbacks[name] = createCallback;
    },
    
    isRegistered: function(name) {
        if (!name || name.empty())
            throw new ArgumentNullException("name");
            
        return (this._callbacks[name] != null);
    },
    
    // Shows tooltip and prevents showing multiple tooltips at one time.
    show: function(event, tooltip) {
        tooltip = this.getTooltip(tooltip);
        
        this.hide();
        
        var _this = this;
        tooltip.onHide = function() {
                _this._currentTooltip = null;
            };
            
        this._currentTooltip = tooltip;
        tooltip.showHandler(event);
    },
    
    hide: function() {
        if (this._currentTooltip) {
            this._currentTooltip.hide();
            this._currentTooltip = null;
        }
    },
    
    attach: function(link, tooltip) {
        if (!link) throw new ArgumentNullException("link");
        if (!tooltip) throw new ArgumentNullException("tooltip");
        
        Event.observe(link, "click", function(event) { 
                Tooltip.show(event, tooltip); 
            }, false);
    }
};

Tooltip.Methods = {
    show: function(x, y) {
        this.style.left = (x - 5) + 'px';
        this.style.top = (y - 5) + 'px';
        this.style.display = '';
    }, 
    
    hide: function() {
        this.style.display = 'none';
        
        if (this.onHide)
            this.onHide();
    },
    
    isVisible: function() {
        return this.style.display != 'none';
    },
    
    showHandler: function(e) {
        this.show(e.pageX, e.pageY);
    }
};
