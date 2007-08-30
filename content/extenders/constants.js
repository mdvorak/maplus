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

const TIMERS_DISABLED = true;

const MAX_TAHU_DEFAULT = 30;

const ZADNA_ALIANCE = "##ZADNA_ALIANCE##";

const JMENA_PRESVEDCENI = new Hash();
JMENA_PRESVEDCENI["D"] = "Dobré";
JMENA_PRESVEDCENI["N"] = "Neutrální";
JMENA_PRESVEDCENI["Z"] = "Zlé";

const BARVY_POVOLANI = new Hash();
BARVY_POVOLANI["Mág"] = "M";
BARVY_POVOLANI["Alchymista"] = "M";
BARVY_POVOLANI["Válečník"] = "B";
BARVY_POVOLANI["Klerik"] = "B";
BARVY_POVOLANI["Hraničář"] = "Z";
BARVY_POVOLANI["Druid"] = "Z";
BARVY_POVOLANI["Nekromant"] = "C";
BARVY_POVOLANI["Theurg"] = "C";
BARVY_POVOLANI["Iluzionista"] = "S";
BARVY_POVOLANI["Barbar"] = "S";
BARVY_POVOLANI["Vědma"] = "F";
BARVY_POVOLANI["Amazonka"] = "F";
BARVY_POVOLANI["Neutrální"] = "N";

const JMENA_BAREV = new Hash();
JMENA_BAREV["M"] = "Modrá";
JMENA_BAREV["B"] = "Bílá";
JMENA_BAREV["Z"] = "Zelená";
JMENA_BAREV["C"] = "Černá";
JMENA_BAREV["S"] = "Šedá";
JMENA_BAREV["F"] = "Fialová";
JMENA_BAREV["N"] = "Neutrální";

const PREHLED_TOP = "Absolutní pořadí podle síly - Nejlepších 20";
const PREHLED_UMISTENI = "Relativní pořadí podle síly - Okolních 30";
const PREHLED_MOZNE_UTOKY = "Možné cíle - 30 nejslabších";
const PREHLED_PODLE_SLAVY = "Absolutní pořadí podle slávy - Nejlepších 30";
const PREHLED_PODLE_POZEMKU = "Podle pozemků";

// Bestiar
var BESTIAR_PUVODNI_SLOUPCE = ["jmeno", "barva", "pocet", "zkusenost", "silaJednotky", "druh", "typ", "cas", "nabidka"];

var BESTIAR_NAZVY_SLOUPCU = new Hash();
// Puvodni
BESTIAR_NAZVY_SLOUPCU["jmeno"] = "Jednotka";
BESTIAR_NAZVY_SLOUPCU["barva"] = "";
BESTIAR_NAZVY_SLOUPCU["pocet"] = "Počet";
BESTIAR_NAZVY_SLOUPCU["zkusenost"] = "Zkušenost";
BESTIAR_NAZVY_SLOUPCU["silaJednotky"] = "Síla J.";
BESTIAR_NAZVY_SLOUPCU["druh"] = "Druh";
BESTIAR_NAZVY_SLOUPCU["typ"] = "Typ";
BESTIAR_NAZVY_SLOUPCU["cas"] = "Čas prodeje";
BESTIAR_NAZVY_SLOUPCU["nabidka"] = "Nabídka";
// Nove
BESTIAR_NAZVY_SLOUPCU["typKratce"] = "Povaha";
BESTIAR_NAZVY_SLOUPCU["phb"] = "Phb";
BESTIAR_NAZVY_SLOUPCU["ini"] = "Ini";
BESTIAR_NAZVY_SLOUPCU["maxSilaStacku"] = "Max síla";
BESTIAR_NAZVY_SLOUPCU["silaStacku"] = "Síla";
BESTIAR_NAZVY_SLOUPCU["cenaZaSilu"] = "Za 1 síly";
BESTIAR_NAZVY_SLOUPCU["zlataTU"] = "zl/TU";
BESTIAR_NAZVY_SLOUPCU["manyTU"] = "mn/TU";
BESTIAR_NAZVY_SLOUPCU["popTU"] = "pop/TU";

// Vychozi poradi sloupcu
var BESTIAR_PORADI_SLOUPCU = ["jmeno", "barva", "pocet", "zkusenost", "silaJednotky", "ini", "typKratce", "druh", "typ", "phb", "maxSilaStacku", "silaStacku", "cenaZaSilu", "zlataTU", "manyTU", "popTU", "cas", "nabidka"];
