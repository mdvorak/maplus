<?xml version="1.0" encoding="utf-8"?>
<!-- ***** BEGIN LICENSE BLOCK *****
  -   Version: MPL 1.1/GPL 2.0/LGPL 2.1
  -
  - The contents of this file are subject to the Mozilla Public License Version
  - 1.1 (the "License"); you may not use this file except in compliance with
  - the License. You may obtain a copy of the License at
  - http://www.mozilla.org/MPL/
  - 
  - Software distributed under the License is distributed on an "AS IS" basis,
  - WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
  - for the specific language governing rights and limitations under the
  - License.
  -
  - The Original Code is Melior Annis Plus.
  -
  - The Initial Developer of the Original Code is
  - Michal Dvorak.
  - Portions created by the Initial Developer are Copyright (C) 2008
  - the Initial Developer. All Rights Reserved.
  -
  - Contributor(s):
  -
  - Alternatively, the contents of this file may be used under the terms of
  - either the GNU General Public License Version 2 or later (the "GPL"), or
  - the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
  - in which case the provisions of the GPL or the LGPL are applicable instead
  - of those above. If you wish to allow use of your version of this file only
  - under the terms of either the GPL or the LGPL, and not to allow others to
  - use your version of this file under the terms of the MPL, indicate your
  - decision by deleting the provisions above and replace them with the notice
  - and other provisions required by the GPL or the LGPL. If you do not delete
  - the provisions above, a recipient may use your version of this file under
  - the terms of any one of the MPL, the GPL or the LGPL.
  - 
  - ***** END LICENSE BLOCK ***** -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes"/>

  <!-- 
  Note: The target stylesheet is read from the processing instruction:
  <?transform-stylesheet href="XSLT URL" ?>
  -->
  
  <xsl:template match="/">
    <html>
      <head>
        <script type="text/javascript">
          // It's easier to match it in javascript than xsl
          var instruction = '<xsl:value-of select="processing-instruction('transform-stylesheet')"/>';
          window.stylesheetUrl = (instruction.match(/\bhref="([^"]+)"/) || [])[1];
        </script>
        <script type="text/javascript">
          <![CDATA[
          function transform() {
            try {
              var baseUrl = document.location.href.replace(document.location.search, "");
              
              // Validate
              if (baseUrl.length == 0)
                throw new Error("Unable to extract baseUrl.");
              if (window.stylesheetUrl == null || window.stylesheetUrl.length == 0)
                throw new Error("Stylesheet hasn't been specified.");

              // Extract url parameters
              var args = parseParameters(document.location.search);
              
              args["href"] = document.location.href;
              args["baseUrl"] = baseUrl;
              
              // Process
              var html = transformToHtml(baseUrl, window.stylesheetUrl, args);
              
              // Generate new document contents
              // IMPORTANT: Some of the events, like body.onload, aren't executed on Mozilla!!!
              // Don't use them!
              document.open();
              document.writeln(html);    
              document.close();
            }
            catch (ex) {
              document.body.style.color = 'red';
              document.body.appendChild(document.createTextNode("Error occured during dynamic xsl processing:"));
              document.body.appendChild(document.createElement("br"));
              document.body.appendChild(document.createTextNode(ex.message || ex));
            }
          }
          
          function transformToHtml(xmlUrl, xslUrl, args) {
            // Mozilla-like
            if (window.XSLTProcessor != null) {
              var loadDoc = function(url) {
                var req = new XMLHttpRequest();
                req.open("GET", url, false);
                
                req.send(null);
                return req.responseXML;
              };
              
              // Load XSL and XML
              var xsl = loadDoc(xslUrl);
              var xml = loadDoc(xmlUrl);
              
              // Prepare processor
              var processor = new XSLTProcessor();
              processor.importStylesheet(xsl);
              
              for (var name in args) {
                processor.setParameter(null, name, args[name]);
              }
              
              // Process
              var output = processor.transformToDocument(xml);
              
              // Special handling - Hide body
              // Note: Reason for this is that FF showed page content before css was loaded,
              // and therefore ugly screen redrawing occured
              var body = output.documentElement.getElementsByTagName("body")[0];
              body.style.visibility = 'hidden';
              
              // Show body again, after document is loaded
              var show = "document.body.style.visibility = 'visible';";
              body.appendChild(createElement("script", show, {type: "text/javascript"}, output));
              
              // Convert to html
              return "<html>" + output.documentElement.innerHTML + "</html>";
            }
            // IE
            else if (window.ActiveXObject != null) {
              // Helper method
              var loadDoc = function(url, docType) {
                var doc = new ActiveXObject(docType);
                doc.async = false;
                doc.resolveExternals = false;
                doc.load(url);
                return doc;
              };
              
              // Load xml and xsl
              var xsl = loadDoc(xslUrl, "Msxml2.FreeThreadedDOMDocument.3.0");
              var xml = loadDoc(xmlUrl, "Msxml2.DOMDocument.3.0");
            
              // Prepare processor
              var xslt = new ActiveXObject("Msxml2.XSLTemplate.3.0");
              xslt.stylesheet = xsl;
              
              var processor = xslt.createProcessor();
              processor.input = xml;
              
              for (var name in args) {
                processor.addParameter(name, args[name]);
              }
              
              // Process
              processor.transform();

              return processor.output;
            }
            // Error
            else {
              throw new Error("No XSLT processor is available on your system.");
            }
          }
          
          function createElement(tagName, innerHtml, attributes, doc) {
              if (tagName == null)
                  throw new ArgumentNullException("tagName");
          
              if (doc == null) doc = document;
              var e = doc.createElement(tagName);
              
              if (attributes != null) {
                  for (var i in attributes) {
                      e.setAttribute(i, (attributes[i] != null) ? attributes[i] : "");
                  }
              }
              
              if (innerHtml != null) {
                  e.innerHTML = innerHtml;
              }
              
              return e;
          }
          
          function parseParameters(search) {
            // Split them - this is needed beacuse of javascript regexp api limitations
            var pairs = search.match(/[/?&][^=&]+=[^=&]*/g) || [];
            
            var args = {};
            
            // Parse single parameter pairs
            for (var i = 0; i < pairs.length; i++) {
              var m = decodeURI(pairs[i]).match(/^[/?&]([^=&]+)=([^=&]*)$/) || [];
              
              args[m[1]] = m[2];
            }
            
            return args;
          }
          ]]>
        </script>
      </head>
      <body onload="transform();"></body>
    </html>
  </xsl:template>
</xsl:stylesheet>
