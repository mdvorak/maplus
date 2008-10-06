<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:t="http://maplus.xf.cz/transform">
  <xsl:output method="html" indent="yes"/>

  <xsl:template match="/">
    <xsl:variable name="stylesheet" select="*/@t:stylesheet" />

    <html>
      <head>
        <script src="prototype.js" type="text/javascript"></script>
        <script type="text/javascript">
          window.stylesheetUrl = '<xsl:value-of select="$stylesheet" />';
        </script>
        <script type="text/javascript">
          <![CDATA[
          function transformToHtml(xmlUrl, xslUrl, args) {
            // Mozilla-like
            if (window.XSLTProcessor != null) {
              var requestOptions = {
                contentType: "text/xml",
                method: "get",
                asynchronous: false
              };
              
              // Load XSL
              var xslRequest = new Ajax.Request(xslUrl, requestOptions);
              var xsl = xslRequest.transport.responseXML;

              // Load xml itself
              var xmlRequest = new Ajax.Request(xmlUrl, requestOptions);
              var xml = xmlRequest.transport.responseXML;
              
              // Prepare processor
              var processor = new XSLTProcessor();
              processor.importStylesheet(xsl);
              
              for (var name in args) {
                processor.setParameter(null, name, args[name]);
              }
              
              // Process
              var output = processor.transformToDocument(xml);
              
              // Special handling - Hide body
              var body = output.documentElement.getElementsByTagName("body")[0];
              body.style.visibility = 'hidden';
              
              // Show body after document is loaded
              // NOTE: onload handler is not executed!!!
              var onload = output.createElement("script");
              onload.setAttribute("type", "text/javascript");
              onload.textContent = "document.body.style.visibility = 'visible';";
              
              body.appendChild(onload);
              
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
          
          function transform() {
            try {
              var baseUrl = document.location.href.replace(document.location.search, "");
              
              // Validate
              if (baseUrl.length == 0)
                throw new Error("Unable to extract baseUrl.");
              if (window.stylesheetUrl == null || window.stylesheetUrl.length == 0)
                throw new Error("Stylesheet hasn't been specified.");

              // Extract url parameters
              var args = document.location.search.toQueryParams();

              args["href"] = document.location.href;
              args["baseUrl"] = baseUrl;
              
              // Process
              var html = transformToHtml(baseUrl, window.stylesheetUrl, args);
              
              // Generate new document contents
              document.open();
              document.writeln(html);
              document.close();
            }
            catch (ex) {
              document.body.appendChild(document.createTextNode("Error occured during dynamic xsl processing:"));
              document.body.appendChild(document.createElement("br"));
              document.body.appendChild(document.createTextNode(ex.message || ex));
            }
          }
          ]]>
        </script>
      </head>
      <body onload="transform();"></body>
    </html>
  </xsl:template>
</xsl:stylesheet>
