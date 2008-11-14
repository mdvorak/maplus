<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" indent="yes" />

  <xsl:param name="sorting" />
  <xsl:param name="sort" />
  <xsl:param name="order" />
  <xsl:param name="baseUrl" />

  <xsl:template match="/jednotky">
    <html>
      <head>
        <title>Melior Annis Plus - Jednotky</title>
        <link rel="stylesheet" href="jednotky.css" type="text/css" />
      </head>
      <body style="text-align: center;">
        <xsl:call-template name="summary" />
        <br />
        <xsl:if test="$sorting = 'true'">
          <div style="text-align: right;">Vychozí řazení</div>
        </xsl:if>
        <table class="thinBorders" align="center" style="text-align: left;" cellspacing="0">
          <thead>
            <xsl:call-template name="hlavicka" />
          </thead>
          <tbody>
            <xsl:choose>
              <!-- Jmeno -->
              <xsl:when test="$sort = 'jmeno'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="jmeno" order="{$order}" lang="cs" case-order="upper-first" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Pwr -->
              <xsl:when test="$sort = 'pwr'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="pwr" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Barva -->
              <xsl:when test="$sort = 'barva'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="barva" order="{$order}" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Typ -->
              <xsl:when test="$sort = 'typ'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="typ" order="{$order}" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Druh -->
              <xsl:when test="$sort = 'druh'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="druh" order="{$order}" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Phb -->
              <xsl:when test="$sort = 'phb'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="phb" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Dmg -->
              <xsl:when test="$sort = 'dmg'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="dmg" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Brn -->
              <xsl:when test="$sort = 'brn'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="brn" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Zvt -->
              <xsl:when test="$sort = 'zvt'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="zvt" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Ini -->
              <xsl:when test="$sort = 'ini'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="ini" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Abs Ini -->
              <xsl:when test="$sort = 'realIni'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="realIni" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- ZlataTU -->
              <xsl:when test="$sort = 'zlataTU'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="zlataTU" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- ManaTU -->
              <xsl:when test="$sort = 'manyTU'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="manyTU" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- popTU -->
              <xsl:when test="$sort = 'popTU'">
                <xsl:apply-templates select="jednotka">
                  <xsl:sort select="popTU" order="{$order}" data-type="number" />
                </xsl:apply-templates>
              </xsl:when>
              <!-- Bez razeni -->
              <xsl:otherwise>
                <xsl:apply-templates select="jednotka" />
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

  <xsl:template name="hlavicka">
    <tr>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">jmeno</xsl:with-param>
          <xsl:with-param name="text">Jméno</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">pwr</xsl:with-param>
          <xsl:with-param name="text">Pwr</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">barva</xsl:with-param>
          <xsl:with-param name="text">Barva</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">typ</xsl:with-param>
          <xsl:with-param name="text">Typ</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">druh</xsl:with-param>
          <xsl:with-param name="text">Druh</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">phb</xsl:with-param>
          <xsl:with-param name="text">Phb</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">dmg</xsl:with-param>
          <xsl:with-param name="text">Dmg</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">brn</xsl:with-param>
          <xsl:with-param name="text">Brn</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">zvt</xsl:with-param>
          <xsl:with-param name="text">Zvt</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">ini</xsl:with-param>
          <xsl:with-param name="text">Ini</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">realIni</xsl:with-param>
          <xsl:with-param name="text">Abs Ini</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">zlataTU</xsl:with-param>
          <xsl:with-param name="text">Zlata/TU</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">manyTU</xsl:with-param>
          <xsl:with-param name="text">Many/TU</xsl:with-param>
        </xsl:call-template>
      </th>
      <th>
        <xsl:call-template name="sloupec">
          <xsl:with-param name="name">popTU</xsl:with-param>
          <xsl:with-param name="text">Pop/TU</xsl:with-param>
        </xsl:call-template>
      </th>
    </tr>
  </xsl:template>

  <xsl:template name="sloupec">
    <xsl:param name="name" />
    <xsl:param name="text" />

    <span>
      <xsl:choose>
        <xsl:when test="$sorting = 'true'">
          <a>
            <xsl:attribute name="href">
              <xsl:value-of select="$baseUrl" />
              <xsl:text>&amp;sort=</xsl:text>
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

            <xsl:value-of select="$text" />
          </a>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$text" />
        </xsl:otherwise>
      </xsl:choose>
    </span>
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
      <!--
      <td>
        <xsl:call-template name="upkeepNaSilu">
          <xsl:with-param name="pwr" select="pwr" />
          <xsl:with-param name="upkeep" select="zlataTU" />
        </xsl:call-template>
      </td>
      -->
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

  <xsl:template name="upkeepNaSilu">
    <xsl:param name="pwr" />
    <xsl:param name="upkeep" />

    <span>
      <xsl:value-of select="format-number($upkeep div $pwr, '0.###')" />
    </span>
  </xsl:template>
</xsl:stylesheet>
