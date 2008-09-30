<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" />

  <xsl:template match="jednotky">
    <html>
      <head>
        <title>Melior Annis Plus - Jednotky</title>
        <link rel="stylesheet" href="jednotky.css" type="text/css" />
      </head>
      <body>
        <div>Tohle bude dodelano casem :) Mikee</div>
        <br />
        <table class="thinBorders" cellspacing="0" border="1">
          <thead>
            <tr>
              <th>
                <span>Jméno</span>
              </th>
              <th>
                <span>Pwr</span>
              </th>
              <th>
                <span>Barva</span>
              </th>
              <th>
                <span>Typ</span>
              </th>
              <th>
                <span>Druh</span>
              </th>
              <th>
                <span>Pohyb</span>
              </th>
              <th>
                <span>Damage</span>
              </th>
              <th>
                <span>Brnění</span>
              </th>
              <th>
                <span>Životy</span>
              </th>
              <th>
                <span>Iniciativa</span>
              </th>
              <th>
                <span>Abs Ini</span>
              </th>
              <th>
                <span>Zlata/TU</span>
              </th>
              <th>
                <span>Many/TU</span>
              </th>
              <th>
                <span>Populace/TU</span>
              </th>
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
        <span>
          <xsl:value-of select="jmeno" />
        </span>
      </td>
      <td>
        <span>
          <xsl:value-of select="pwr" />
        </span>
      </td>
      <td style="text-align: center;">
        <xsl:variable name="barva" select="barva"/>
        <span class="c_{$barva}">
          <xsl:text>&#xA0;</xsl:text>
          <xsl:value-of select="barva" />
          <xsl:text>&#xA0;</xsl:text>
        </span>
      </td>
      <td>
        <xsl:variable name="typ" select="substring(typ, 1, 3)"/>
        <span class="typ{$typ}">
          <xsl:value-of select="typ" />
        </span>
      </td>
      <td>
        <xsl:variable name="druh" select="substring(druh, 1, 3)"/>
        <span class="druh{$druh}">
          <xsl:value-of select="druh" />
        </span>
      </td>
      <td>
        <xsl:variable name="phb" select="phb"/>
        <span class="phb{$phb}">
          <xsl:value-of select="phb" />
        </span>
      </td>
      <xsl:variable name="dmg" select="dmg"/>
      <td class="attr attr{$dmg}">
        <span>
          <xsl:value-of select="dmg" />
        </span>
      </td>
      <xsl:variable name="brn" select="brn"/>
      <td class="attr attr{$brn}">
        <span>
          <xsl:value-of select="brn" />
        </span>
      </td>
      <xsl:variable name="zvt" select="zvt"/>
      <td class="attr attr{$zvt}">
        <span>
          <xsl:value-of select="zvt" />
        </span>
      </td>
      <xsl:variable name="ini" select="ini"/>
      <td class="attr attr{$ini}">
        <span>
          <xsl:value-of select="ini" />
        </span>
      </td>
      <td style="text-align: center;">
        <span>
          <xsl:value-of select="realIni" />
        </span>
      </td>
      <td>
        <span>
          <xsl:value-of select="zlataTU" />
        </span>
      </td>
      <td>
        <span>
          <xsl:value-of select="manyTU" />
        </span>
      </td>
      <td>
        <span>
          <xsl:value-of select="popTU" />
        </span>
      </td>
    </tr>
  </xsl:template>
</xsl:stylesheet>
