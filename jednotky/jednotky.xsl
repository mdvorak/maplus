<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:config="http://maplus.xf.cz/jednotky-transform"
                xmlns:j="http://maplus.xf.cz/jednotky"
                exclude-result-prefixes="config">
  <xsl:output method="html" indent="yes" />

  <xsl:param name="baseUrl" />
  <xsl:param name="sort">none</xsl:param>
  <xsl:param name="order">ascending</xsl:param>

  <xsl:variable name="tabulka" select="document('')/xsl:stylesheet/config:tabulka" />

  <config:tabulka>
    <config:sloupec name="jmeno" title="Jméno" data-type="text" />
    <config:sloupec name="pwr" title="Pwr" data-type="number" />
    <config:sloupec name="barva" title="Barva" data-type="text" />
    <config:sloupec name="typ" title="Typ" data-type="text" />
    <config:sloupec name="druh" title="Druh" data-type="text" />
    <config:sloupec name="phb" title="Phb" data-type="number" />
    <config:sloupec name="dmg" title="Dmg" data-type="number" />
    <config:sloupec name="brn" title="Brn" data-type="number" />
    <config:sloupec name="zvt" title="Zvt" data-type="number" />
    <config:sloupec name="ini" title="Ini" data-type="number" />
    <config:sloupec name="realIni" title="Abs Ini" data-type="number" />
    <config:sloupec name="zlataTU" title="Zlata/TU" data-type="number" />
    <config:sloupec name="manyTU" title="Many/TU" data-type="number" />
    <config:sloupec name="popTU" title="Pop/TU" data-type="number" />
  </config:tabulka>

  <xsl:template match="j:jednotky">
    <html>
      <head>
        <title>Melior Annis Plus - Jednotky</title>

        <!-- Pozn: Barva tady specifikovana se prepise *.css, ale aby nam tam neproblikavala bila... -->
        <style type="text/css">
          <![CDATA[
          body {
            background-color: black;
          }
          ]]>
        </style>
        <link rel="stylesheet" href="jednotky.css" type="text/css" />
      </head>
      <body>
        <xsl:call-template name="summary" />
        <br />
        <table class="thinBorders" cellspacing="0">
          <thead>
            <xsl:call-template name="header" />
          </thead>
          <tbody>
            <!-- Ziskej datovy typ -->
            <xsl:variable name="sort-type" select="$tabulka/config:sloupec[@name = $sort]/@data-type" />

            <!-- Pokud neni znam datovy typ, sloupec neumime seradit... -->
            <xsl:choose>
              <xsl:when test="boolean($sort-type)">
                <!-- Razeni -->
                <xsl:apply-templates select="j:jednotka">
                  <xsl:sort select="j:*[local-name() = $sort]" lang="cs" order="{$order}" data-type="{$sort-type}" />
                </xsl:apply-templates>
              </xsl:when>
              <xsl:otherwise>
                <!-- Bez razeni -->
                <xsl:apply-templates select="j:jednotka" />
              </xsl:otherwise>
            </xsl:choose>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="summary">
    <h3>Melior Annis Plus</h3>
    <div>Souhrnné informace o jednotkách. Jakékoliv chyby hlašte správci Melior Annis Plus.</div>
  </xsl:template>

  <xsl:template name="header">
    <tr>
      <xsl:for-each select="$tabulka/config:sloupec">
        <th>
          <xsl:call-template name="title">
            <xsl:with-param name="name" select="@name" />
            <xsl:with-param name="text" select="@title" />
            <xsl:with-param name="sortable" select="boolean(@data-type)" />
          </xsl:call-template>
        </th>
      </xsl:for-each>
    </tr>
  </xsl:template>

  <xsl:template name="title">
    <xsl:param name="name" />
    <xsl:param name="text" />
    <xsl:param name="sortable" />

    <span>
      <xsl:choose>
        <xsl:when test="$sortable">
          <a>
            <xsl:attribute name="href">
              <xsl:value-of select="$baseUrl" />
              <xsl:text>?sort=</xsl:text>
              <xsl:value-of select="$name" />
              <xsl:text>&amp;order=</xsl:text>

              <xsl:choose>
                <xsl:when test="$order = 'ascending' and $sort = $name">
                  <xsl:text>descending</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>ascending</xsl:text>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>

            <xsl:if test="$sort = $name">
              <xsl:attribute name="class">sorted</xsl:attribute>
            </xsl:if>

            <xsl:value-of select="$text" />
          </a>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$text" />
        </xsl:otherwise>
      </xsl:choose>
    </span>
  </xsl:template>

  <xsl:template match="j:jednotka">
    <tr>
      <xsl:variable name="jednotka" select="." />

      <xsl:for-each select="$tabulka/config:sloupec">
        <xsl:variable name="config" select="." />

        <td>
          <xsl:apply-templates select="$jednotka/j:*[local-name() = $config/@name]" />
        </td>
      </xsl:for-each>
    </tr>
  </xsl:template>


  <xsl:template match="j:jmeno">
    <span>
      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="j:pwr">
    <span>
      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="j:barva">
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

  <xsl:template match="j:typ">
    <span>
      <xsl:attribute name="class">
        <xsl:text>typ</xsl:text>
        <xsl:value-of select="substring(., 1, 3)" />
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="j:druh">
    <span>
      <xsl:attribute name="class">
        <xsl:text>druh</xsl:text>
        <xsl:value-of select="substring(., 1, 3)" />
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="j:phb">
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

  <xsl:template match="j:dmg">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="j:brn">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="j:zvt">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="j:ini">
    <xsl:call-template name="attr" />
  </xsl:template>

  <xsl:template match="j:realIni">
    <xsl:attribute name="class">realIni</xsl:attribute>

    <span>
      <xsl:attribute name="style">
        <xsl:variable name="koeficient" select="(. - 5) div 30" />
        <xsl:variable name="r" select="floor(225 * (1 - $koeficient) * 2)" />
        <xsl:variable name="g" select="floor(220 * $koeficient * 2)" />

        <xsl:text>color: rgb(</xsl:text>
        <xsl:call-template name="between">
          <xsl:with-param name="value" select="$r" />
          <xsl:with-param name="min" select="0" />
          <xsl:with-param name="max" select="250" />
        </xsl:call-template>
        <xsl:text>, </xsl:text>
        <xsl:call-template name="between">
          <xsl:with-param name="value" select="$g" />
          <xsl:with-param name="min" select="0" />
          <xsl:with-param name="max" select="240" />
        </xsl:call-template>
        <xsl:text>, </xsl:text>
        <xsl:value-of select="30"/>
        <xsl:text>);</xsl:text>
      </xsl:attribute>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template name="between">
    <xsl:param name="value" />
    <xsl:param name="min" />
    <xsl:param name="max" />

    <xsl:variable name="tmp" select="($value &lt; $max) * $value + ($value &gt; $max) * $max" />
    <xsl:value-of select="($value &gt; $min) * $value + ($value &lt; $min) * $min" />
  </xsl:template>

  <xsl:template name="upkeep">
    <span>
      <xsl:if test=". = 0">
        <xsl:attribute name="style">color: grey;</xsl:attribute>
      </xsl:if>

      <xsl:value-of select="." />
    </span>
  </xsl:template>

  <xsl:template match="j:zlataTU">
    <xsl:call-template name="upkeep" />
  </xsl:template>

  <xsl:template match="j:manyTU">
    <xsl:call-template name="upkeep" />
  </xsl:template>

  <xsl:template match="j:popTU">
    <xsl:call-template name="upkeep" />
  </xsl:template>

  <xsl:template name="upkeepNaSilu">
    <xsl:param name="pwr" />
    <xsl:param name="upkeep" />

    <span>
      <xsl:value-of select="format-number($upkeep div $pwr, '0.###')" />
    </span>
  </xsl:template>
</xsl:stylesheet>
