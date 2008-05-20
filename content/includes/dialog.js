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

/*** Dialog class ***/
var Dialog = Class.create({
    initialize: function() {
        // Use this object for storing data
        this.data = new Object();
    },
    
    getContent: function() {
        if (!this._created)
            throw new Error("Dialog is not created.");
        
        return this._content;
    },
    
    setReturnValue: function(value) {
        this._returnValue = value;
    },
    
    getReturnValue: function() {
        // Return last value
        return this._returnValue;
    },
    
    create: function() {
        if (this._created)
            this.destroy();
        
        console.debug("Creating dialog %o...", this);
        
        var destructors = new Array();
        
        // Create and initialize modal backround
        var background = this._createModalBackground();
        background.style.display = 'none';
        background.style.zIndex = 1;
        background.style.position = 'absolute';
        background.style.left = '0px';
        background.style.top = '0px';
        
        var resizeBackground = function() {
            var scrollbarX = (window.scrollMaxX > 0) ? ScrollbarHelper.getWidth() : 0;
            var scrollbarY = (window.scrollMaxY > 0) ? ScrollbarHelper.getWidth() : 0;
            
            background.style.width = '0px';
            background.style.height = '0px';
            background.style.width = (window.innerWidth - scrollbarY + window.scrollMaxX) + "px";
            background.style.height =  (window.innerHeight - scrollbarX + window.scrollMaxY) + "px";
        };
        
        resizeBackground();
        Event.observe(window, 'resize', resizeBackground);
        
        destructors.push(function() {
            Event.stopObserving(window, 'resize', resizeBackground);
            
            background.style.display = 'none';
            if (background.parentNode != null)
                background.parentNode.removeChild(background);
        });        
        
        // Create and initialize content element
        var content = this._createContentElement();
        content.style.display = 'none';
        content.style.position = 'absolute';
        content.style.zIndex = 100000;
        content.style.left = '-1000px';
        content.style.top = '-1000px';
        
        var centerContent = function() {
            content.style.left = (window.scrollX + (window.innerWidth - content.offsetWidth) / 2) + "px";
            content.style.top = (window.scrollY + (window.innerHeight - content.offsetHeight) / 2) + "px";
        };
        
        Event.observe(window, 'resize', centerContent);
        
        destructors.push(function() {
            Event.stopObserving(window, 'resize', centerContent);
            
            content.style.display = 'none';
            if (content.parentNode != null)
                content.parentNode.removeChild(content);
        });
        
        // Show content
        document.body.appendChild(background);
        document.body.appendChild(content);
        
        // Store references
        this._destructor = function() {
            for (var i = 0; i < destructors.length; i++)
                destructors[i].call();
        };
        this._producer = function(visible) {
            if (visible) {
                background.style.display = 'block';
                content.style.display = 'block';
                centerContent();
            }
            else {
                background.style.display = 'none';
                content.style.display = 'none';
                content.style.left = '-1000px';
                content.style.top = '-1000px';
            }
        };
        this._content = content;
        
        // Dialog created
        this._created = true;
    },
    
    destroy: function() {
        if (!this._created)
            return;
        if (this._visible)
            throw new Error("Visible dialog cannot be destroyed.");
            
        console.debug("Destroying dialog %o...", this);
        
        this._created = false;
        
        // Destroy it
        this._destructor();
        
        // Remove references
        this._destructor = null;
        this._producer = null;
        this._content = null;
    },

    show: function(callback) {
        if (callback != null && typeof callback != "function")
            throw new Error("callback must be a function.");
        if (this._visible)
            throw new Error("Dialog is already visible.");
        
        if (!this._created)
            this.create();
        
        console.debug("Showing dialog %o...", this);
        
        // Show content
        this._producer(true);
        this.setReturnValue(null);
        this._callback = callback;
        
        this._visible = true;
    },
    
    hide: function(returnValue) {
        if (!this._visible)
            return;
            
        try {
            console.debug("Validating dialog %o with return value %o...", this, returnValue);
            this.validate(returnValue);
        }
        catch (ex) {
            console.log("Dialog %o validation with return value %o failed: %o", this, returnValue, ex);
            this._onValidationError(ex);
            return false;
        }
        
        console.debug("Hiding dialog %o with return value %o...", this, returnValue);
        
        // Hide content
        this._producer(false);
        this._visible = false;
        
        // Call callback function
        var callback = this._callback;
        this._callback = null;
        
        this.setReturnValue(returnValue);
        if (callback != null)
            callback.call(this, returnValue);
            
        return true;
    },
    
    close: function(returnValue) {
        if (this.hide(returnValue))
            this.destroy();
    },
    
    validate: function(returnValue) {
    },
    
    _onValidationError: function(err) {
        if (err != null)
            alert("" + err);
    },
    
    _createContentElement: function() {
        throw new Error("Not implemented.");
    },
    
    _createModalBackground: function() {
        var divBackround = document.createElement("div");
        divBackround.style.background = 'grey';
        divBackround.style.opacity = '0.4';
        return divBackround;
    },
    
    isCreated: function() {
        return this._created;
    },
    
    isVisible: function() {
        return this._visible;
    }
});



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
