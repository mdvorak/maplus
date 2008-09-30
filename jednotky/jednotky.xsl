<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" />

  <xsl:template match="jednotky">
    <html>
      <head>
        <title>Melior Annis Plus - Jednotky</title>
      </head>
      <body>
        <div>Tohle bude dodelano casem :) Mikee</div>
        <br />
        <table border="1" cellspacing="0">
          <thead>
            <tr>
              <th>Jméno</th>
              <th>Pwr</th>
              <th>Barva</th>
              <th>Typ</th>
              <th>Druh</th>
              <th>Pohyb</th>
              <th>Damage</th>
              <th>Brnění</th>
              <th>Životy</th>
              <th>Iniciativa</th>
              <th>Reálná Ini</th>
              <th>Zlata/TU</th>
              <th>Many/TU</th>
              <th>Populace/TU</th>
            </tr>
          </thead>
          <tbody>
            <xsl:apply-templates />
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="jednotka">
    <tr>
      <td>
        <xsl:value-of select="jmeno" />
      </td>
      <td>
        <xsl:value-of select="pwr" />
      </td>
      <td>
        <xsl:value-of select="barva" />
      </td>
      <td>
        <xsl:value-of select="typ" />
      </td>
      <td>
        <xsl:value-of select="druh" />
      </td>
      <td>
        <xsl:value-of select="phb" />
      </td>
      <td>
        <xsl:value-of select="dmg" />
      </td>
      <td>
        <xsl:value-of select="brn" />
      </td>
      <td>
        <xsl:value-of select="zvt" />
      </td>
      <td>
        <xsl:value-of select="ini" />
      </td>
      <td>
        <xsl:value-of select="realIni" />
      </td>
      <td>
        <xsl:value-of select="zlataTU" />
      </td>
      <td>
        <xsl:value-of select="manyTU" />
      </td>
      <td>
        <xsl:value-of select="popTU" />
      </td>
    </tr>
  </xsl:template>
</xsl:stylesheet>
