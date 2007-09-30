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
 
 
var Checkbox = {
    STATE_UNCHECKED: 0,
    STATE_CHECKED: 1,
    STATE_UNKNOWN: -1,

    imagesPath: CHROME_CONTENT_URL + "html/img/checkbox/",

    create: function() {
        var root = Element.create("span", null, {style: "width: 13px; height: 13px; margin: 1px;", type: "checkbox"});
        return this.initialize(root);
    },
    
    initialize: function(root) {
        root = $(root);
        if (root == null)
            throw new ArgumentNullException("root");
    
        // Create img elements for each state
        var createImg = function(name) {
            return Element.create("img", null, {src: Checkbox.imagesPath + name, alt: "", style: "display: none"});
        };
        
        var normal = createImg("check_n.png");
        var checked = createImg("check_c.png");
        var unknown = createImg("check_u.png");
        var normalHover = createImg("check_nh.png");
        var checkedHover = createImg("check_ch.png");
        var unknownHover = createImg("check_uh.png");
        
        root.appendChild(normal);
        root.appendChild(checked);
        root.appendChild(unknown);
        root.appendChild(normalHover);
        root.appendChild(checkedHover);
        root.appendChild(unknownHover);
        
        // This method updates images visibility due to control state
        root._updateState = function(state) {
            normal.style.display = (state == Checkbox.STATE_UNCHECKED && !this._hovering) ? '' : 'none';
            checked.style.display = (state == Checkbox.STATE_CHECKED && !this._hovering) ? '' : 'none';
            unknown.style.display = (state == Checkbox.STATE_UNKNOWN && !this._hovering) ? '' : 'none';
            normalHover.style.display = (state == Checkbox.STATE_UNCHECKED && this._hovering) ? '' : 'none';
            checkedHover.style.display = (state == Checkbox.STATE_CHECKED && this._hovering) ? '' : 'none';
            unknownHover.style.display = (state == Checkbox.STATE_UNKNOWN && this._hovering) ? '' : 'none';
        }
        
        // Initialize control API
        Object.extend(root, Checkbox.Methods);
        
        // Setup events
        Event.observe(root, 'click', function() {
            this.toggle();
            Event.dispatch(this, 'change', true, true);
        });
        
        Event.observe(root, 'mouseover', function() {
            if (this._hovering) return;
            this._hovering = true;
            this._updateState(this.getState());
        });
        
        Event.observe(root, 'mouseout', function() {
            if (!this._hovering) return;
            this._hovering = false;
            this._updateState(this.getState());
        });
        
        // Set initial state
        root.setState(Checkbox.STATE_UNCHECKED);
        
        return root;
    },
    
    resolveState: function(state) {
        if (state == Checkbox.STATE_CHECKED || state == Checkbox.STATE_UNCHECKED)
           return state;
        else
            return Checkbox.STATE_UNKNOWN;
    }
};

Checkbox.Methods = {  
    getState: function() {
        return Checkbox.resolveState(parseInt(this.getAttribute("state")));
    },
    
    setState: function(state) {
        state = Checkbox.resolveState(state);
        this.setAttribute("state", state);
        
        // Defined during checkbox creation
        this._updateState(state);
    },
    
    isChecked: function() {
        return this.getState() != Checkbox.STATE_UNCHECKED;
    },
    
    setChecked: function(checked) {
        this.setState(checked ? Checkbox.STATE_CHECKED : Checkbox.STATE_UNCHECKED);
    },
    
    toggle: function() {
        this.setChecked(this.getState() != Checkbox.STATE_CHECKED);
    }
};
