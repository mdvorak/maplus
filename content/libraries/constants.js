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

const VERSION = "1.3.13"; // Pozn: Tahle verze je pouzivana pouze pro zobrazovani novinek

const EXTENSION_NAME = "maplus";
const EXTENSION_ID = "maplus@michal.dvorak";
const MELIOR_ANNIS_URL = "http://meliorannis.idnes.cz";

const CHROME_URL = "chrome://" + EXTENSION_NAME + "/";
const CHROME_CONTENT_URL = CHROME_URL + "content/";

// Firebug console properties for version "1.05", logger must implement 'em
const FIREBUG_METHODS = ["log","debug","info","warn","error","assert","dir","dirxml","trace","group","groupEnd","time","timeEnd","profile","profileEnd","count"];

// Custom constants
const MAPLUS_INFO_FILENAME = "maplus-info.xml";
const MAPLUS_INFO_URL = "http://maplus.xf.cz/" + MAPLUS_INFO_FILENAME;

const ZADNA_ALIANCE = "##ZADNA_ALIANCE##";

const DEN_MINUT = 24 * 60; // Den ma celkem minut..
