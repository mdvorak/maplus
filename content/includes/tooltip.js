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

/*
// Example:
Tooltip.register('example', function() { return Tooltip.create('<span>Example</span>'); });
*/

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
        tooltip.style.left = '-500px';
        tooltip.style.top = '-500px';

        if (html) {
            if (Object.isElement(html))
                tooltip.appendChild(html);
            else
                tooltip.innerHTML = html;
        }

        var tracker = 0;

        Event.observe(tooltip, 'mouseout', function(e) {
            if (e.pageX < this.offsetLeft || e.pageX >= (this.offsetLeft + this.offsetWidth)
                    || e.pageY < this.offsetTop || e.pageY >= (this.offsetTop + this.offsetHeight)) {
                // Hide tooltip after some amount of time
                var id = ++tracker;
                setTimeout(function() {
                    // Don't hide tooltip when mouse has returned into tooltip area
                    if (tracker == id)
                        tooltip.hideTooltip();
                }, 250);
            }
        });

        Event.observe(tooltip, 'mouseover', function(e) {
            ++tracker;
        });

        if (hideOnClick)
            Event.observe(tooltip, 'click', function() { this.hideTooltip(); }, false);

        Element.extend(tooltip);
        Object.extend(tooltip, Tooltip.Methods);

        document.body.appendChild(tooltip);
        return tooltip;
    },

    getTooltip: function(tooltip) {
        if (!tooltip)
            throw new ArgumentNullException("tooltip");

        if (!Object.isElement(tooltip)) {
            var name = String(tooltip);
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

        Tooltip.hide();

        var _this = this;
        tooltip.onHide = function() {
            _this._currentTooltip = null;
        };

        this._currentTooltip = tooltip;
        tooltip.showHandler(event);
    },

    hide: function() {
        if (this._currentTooltip) {
            this._currentTooltip.hideTooltip();
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
    showTooltip: function(x, y) {
        var windowWidth = window.innerWidth - (window.scrollMaxY > 0 ? ScrollbarHelper.getWidth() : 0);
        var windowHeight = window.innerHeight - (window.scrollMaxX > 0 ? ScrollbarHelper.getWidth() : 0);
        
        this.style.display = 'block';
        
        var dims = this.getDimensions();
        var width = Math.min(dims.width, windowWidth);
        var height = Math.min(dims.height, windowHeight);
        
        logger().debug("Tooltip windowWidth=%d windowHeight=%d width=%d height=%d window.scrollX=%d window.scrollY=%d", windowWidth, windowHeight, width, height, window.scrollX, window.scrollY);
        
        this.style.maxWidth = windowWidth;
        this.style.maxHeight = windowHeight;
        this.style.left = Math.min(x - 5, window.scrollX + windowWidth - width) + 'px';
        this.style.top = Math.min(y - 5, window.scrollY + windowHeight - height) + 'px';
    }, 
    
    hideTooltip: function() {
        this.style.display = 'none';
        this.style.left = '-500px';
        this.style.top = '-500px';
        
        if (this.onHide)
            this.onHide();
    },
    
    isVisible: function() {
        return this.style.display != 'none';
    },
    
    showHandler: function(e) {
        this.showTooltip(e.pageX, e.pageY);
    }
};
