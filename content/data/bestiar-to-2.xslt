<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="xml" indent="yes"/>

  <xsl:template match="/aukce">
    <aukce>
      <xsl:apply-templates />
    </aukce>
  </xsl:template>

  <xsl:template match="rulelist">
    <rulelist>
      <xsl:apply-templates />
    </rulelist>
  </xsl:template>

  <xsl:template match="rule">
    <rule>
      <xsl:attribute name="type">
        <xsl:value-of select="@type" />
      </xsl:attribute>
      <xsl:attribute name="text">
        <xsl:value-of select="text()" />
      </xsl:attribute>

      <xsl:text disable-output-escaping="yes">&lt;![CDATA[</xsl:text>
      <xsl:value-of disable-output-escaping="yes" select="@condition" />
      <xsl:text disable-output-escaping="yes">]]&gt;</xsl:text>
    </rule>
  </xsl:template>
</xsl:stylesheet>
