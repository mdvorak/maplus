<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" />

  <xsl:template match="/jednotky">
    <html>
      <head>
        <title>Melior Annis Plus - Jednotky</title>
        <link rel="stylesheet" href="jednotky.css" type="text/css" />
      </head>
      <body style="text-align: center;">
        <xsl:call-template name="summary" />
        <br />
        <table class="thinBorders" align="center" style="text-align: left;" cellspacing="0">
          <thead>
            <xsl:call-template name="hlavicka" />
          </thead>
          <tbody>
            <xsl:apply-templates />
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="summary">
    <h3>Melior Annis Plus</h3>
    <div>Souhrnné informace o jednotkách. Jakékoliv chyby hlašte správci Melior Annis Plus.</div>
  </xsl:template>

  <xsl:template name="hlavicka">
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
        <span>Phb</span>
      </th>
      <th>
        <span>Dmg</span>
      </th>
      <th>
        <span>Brn</span>
      </th>
      <th>
        <span>Zvt</span>
      </th>
      <th>
        <span>Ini</span>
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
        <span>Pop/TU</span>
      </th>
    </tr>
  </xsl:template>

  <xsl:template match="jednotka">
    <tr>
      <td>
        <xsl:apply-templates select="jmeno" />
      </td>
      <td>
        <xsl:apply-templates select="pwr" />
      </td>
      <td>
        <xsl:apply-templates select="barva" />
      </td>
      <td>
        <xsl:apply-templates select="typ" />
      </td>
      <td>
        <xsl:apply-templates select="druh" />
      </td>
      <td>
        <xsl:apply-templates select="phb" />
      </td>
      <td>
        <xsl:apply-templates select="dmg" />
      </td>
      <td>
        <xsl:apply-templates select="brn" />
      </td>
      <td>
        <xsl:apply-templates select="zvt" />
      </td>
      <td>
        <xsl:apply-templates select="ini" />
      </td>
      <td>
        <xsl:apply-templates select="realIni" />
      </td>
      <td>
        <xsl:apply-templates select="zlataTU" />
      </td>
      <td>
        <xsl:apply-templates select="manyTU" />
      </td>
      <td>
        <xsl:apply-templates select="popTU" />
      </td>
    </tr>
  </xsl:template>


  <xsl:template match="jmeno">
    <span>
      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="pwr">
    <span>
      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="barva">
    <xsl:attribute name="class">barva</xsl:attribute>

    <span>
      <xsl:attribute name="class">
        <xsl:text>c_</xsl:text>
        <xsl:value-of select="." />
      </xsl:attribute>

      <xsl:text>&#xA0;</xsl:text>
      <xsl:value-of select="." />
      <xsl:text>&#xA0;</xsl:text>
    </span>
  </xsl:template>

  <xsl:template match="typ">
    <span>
      <xsl:attribute name="class">
        <xsl:text>typ</xsl:text>
        <xsl:value-of select="substring(., 1, 3)" />
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="druh">
    <span>
      <xsl:attribute name="class">
        <xsl:text>druh</xsl:text>
        <xsl:value-of select="substring(., 1, 3)" />
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="phb">
    <xsl:attribute name="class">phb</xsl:attribute>

    <span>
      <xsl:attribute name="class">
        <xsl:text>phb</xsl:text>
        <xsl:value-of select="." />
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template name="attr">
    <xsl:attribute name="class">
      <xsl:text>attr </xsl:text>
      <xsl:text>attr</xsl:text>
      <xsl:value-of select="." />
    </xsl:attribute>

    <span>
      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="dmg">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="brn">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="zvt">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="ini">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="realIni">
    <xsl:attribute name="class">realIni</xsl:attribute>

    <span>
      <xsl:attribute name="style">
        <xsl:variable name="koeficient" select="(. - 5) div 30" />
        <xsl:variable name="r" select="floor(225 * (1 - $koeficient) * 2)" />
        <xsl:variable name="g" select="floor(220 * $koeficient * 2)" />

        <xsl:text>color: rgb(</xsl:text>
        <xsl:value-of select="($r &lt; 250) * $r + ($r &gt; 250) * 250"/>
        <xsl:text>, </xsl:text>
        <xsl:value-of select="($g &lt; 240) * $g + ($g &gt; 240) * 240"/>
        <xsl:text>, </xsl:text>
        <xsl:value-of select="30"/>
        <xsl:text>);</xsl:text>
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template name="upkeep">
    <span>
      <xsl:if test=". = 0">
        <xsl:attribute name="style">color: grey;</xsl:attribute>
      </xsl:if>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="zlataTU">
    <xsl:call-template name="upkeep" />
  </xsl:template>

  <xsl:template match="manyTU">
    <xsl:call-template name="upkeep" />
  </xsl:template>

  <xsl:template match="popTU">
    <xsl:call-template name="upkeep" />
  </xsl:template>
</xsl:stylesheet>
