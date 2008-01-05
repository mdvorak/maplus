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
 
var PasswordManager = {
    setPassword: function(host, realm, user, password) {
        // > FF 3
        if ("@mozilla.org/login-manager;1" in Components.classes) {
            // Get Login Manager
            var loginManager = Components.classes["@mozilla.org/login-manager;1"]
                                            .getService(Components.interfaces.nsILoginManager);
                                            
            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                             Components.interfaces.nsILoginInfo, "init");
                                             
            var loginInfo = new nsLoginInfo(host, null, realm, user, password, null, null);
            
            try {
                loginManager.removeLogin(loginInfo);
            }
            catch (ex) { }
            if (password != null && password != "")
                loginManager.addLogin(loginInfo);
        }
        // <= FF 2
        else {
            // Get Password Manager
            var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
                                            .getService(Components.interfaces.nsIPasswordManager);
            
            try {
                passwordManager.removeUser(host, user);
            }
            catch (ex) { }
            
            if (password != null && password != "")
                passwordManager.addUser(host, user, password);                
        }
    },
    
    getPassword: function(host, realm, user) {
        var password = null;
    
        // > FF 3
        if ("@mozilla.org/login-manager;1" in Components.classes) {
            // Get Login Manager
            var loginManager = Components.classes["@mozilla.org/login-manager;1"]
                                            .getService(Components.interfaces.nsILoginManager);
                                            
            // Find users for the given parameters
            var logins = loginManager.findLogins({}, host, null, realm);                                 
            
            for (var i = 0; i < logins.length; i++) {
                if (logins[i].username == user) {
                    password = logins[i].password;
                    break;
                }
            }
        }
        // <= FF 2
        else {
            // Get Password Manager
            var passwordManager = Components.classes["@mozilla.org/passwordmanager;1"]
                                            .getService(Components.interfaces.nsIPasswordManager);
                                            
            // ask the password manager for an enumerator
            var e = passwordManager.enumerator;
            // step through each password in the password manager until we find the one we want
            while (e.hasMoreElements()) {
                try {
                    // get an nsIPassword object out of the password manager.
                    // This contains the actual password...
                    var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
                    if (pass.host == host && pass.user == user) {
                        password = pass.password;
                        break;
                    }
                } catch (ex) {
                    // Ignore errors
                }
            }
        }
        
        return password;
    }
};
