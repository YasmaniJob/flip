'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { LEVEL_LABELS, LEVEL_ICONS } from '../types';
import type { DiagnosticLevel } from '../types';
import { RadarChartSVG } from './radar-chart-svg';

// Estilos para el PDF - Diseño moderno compacto (una sola página)
const styles = StyleSheet.create({
  page: {
    padding: 25,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  institutionInfo: {
    gap: 3,
    maxWidth: 220,
  },
  institutionName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#3b82f6',
    lineHeight: 1.2,
  },
  institutionSubtitle: {
    fontSize: 7,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  reportTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  reportSubtitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#3b82f6',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  infoCard: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
  },
  infoLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  infoValueSmall: {
    fontSize: 9,
    color: '#475569',
  },
  scoreSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scoreHeader: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 10,
  },
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  levelBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  levelLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  levelIcon: {
    fontSize: 20,
  },
  progressBar: {
    height: 6,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  chartSection: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    width: '48%',
  },
  metricLabel: {
    fontSize: 7,
    color: '#475569',
    flex: 1,
  },
  metricValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#3b82f6',
    minWidth: 35,
    textAlign: 'right',
  },
  conclusionBox: {
    padding: 12,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    marginBottom: 12,
  },
  conclusionTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#3b82f6',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  conclusionText: {
    fontSize: 8,
    color: '#334155',
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flipBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  flipText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  footerNote: {
    fontSize: 6,
    color: '#94a3b8',
  },
  footerRight: {
    fontSize: 6,
    color: '#cbd5e1',
  },
});

interface DiagnosticPDFDocumentProps {
  userName: string;
  institutionName: string;
  institutionLogo?: string | null;
  educationalLevel?: string;
  province?: string;
  level: DiagnosticLevel;
  overallScore: number;
  completedAt: string;
  categoryScores: Record<string, number>;
  categoryNames: Record<string, string>;
  year?: number;
}

export function DiagnosticPDFDocument({
  userName,
  institutionName,
  institutionLogo,
  educationalLevel,
  province,
  level,
  overallScore,
  completedAt,
  categoryScores,
  categoryNames,
  year,
}: DiagnosticPDFDocumentProps) {
  const currentYear = year || new Date().getFullYear();
  const formattedDate = new Date(completedAt).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const reportCode = `FLIP-REP-${completedAt.substring(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`;

  // Preparar datos para el radar chart
  const radarData = Object.entries(categoryScores).map(([id, score]) => ({
    category: categoryNames[id] || 'Dimensión',
    score,
  }));

  // Validar si el logo es una URL válida
  const hasValidLogo = institutionLogo && institutionLogo.startsWith('http');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {hasValidLogo && (
               <Image src={institutionLogo} style={styles.logo} />
            )}
            <View style={styles.institutionInfo}>
              <Text style={styles.institutionSubtitle}>
                Institución Educativa {educationalLevel || 'Secundaria'}
              </Text>
              <Text style={styles.institutionName}>
                {institutionName} {province ? `- ${province}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.reportTitle}>INFORME</Text>
            <Text style={styles.reportSubtitle}>Diagnóstico Digital {currentYear}</Text>
          </View>
        </View>

        {/* Info Cards Grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Nombre del Evaluado</Text>
            <Text style={styles.infoValue}>{userName}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Fecha de Evaluación</Text>
            <Text style={styles.infoValueSmall}>{formattedDate} - Año {currentYear}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Código de Informe</Text>
            <Text style={styles.infoValueSmall}>{reportCode}</Text>
          </View>
        </View>

        {/* Score Section */}
        <View style={styles.scoreSection}>
          <Text style={styles.scoreHeader}>Resultado Global</Text>
          <View style={styles.scoreDisplay}>
            <View style={styles.scoreLeft}>
              <Text style={styles.scoreNumber}>{overallScore}%</Text>
              <View style={styles.levelBadge}>
                <Text style={styles.levelLabel}>{LEVEL_LABELS[level]}</Text>
              </View>
              <Text style={styles.levelIcon}>{LEVEL_ICONS[level]}</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallScore}%` }]} />
          </View>
        </View>

        {/* Radar Chart - Tamaño equilibrado para evitar cortes de labels */}
        <View style={styles.chartSection}>
          <RadarChartSVG data={radarData} size={300} />
        </View>

        {/* Metrics Grid - Leyenda debajo del gráfico */}
        <Text style={styles.sectionTitle}>Métricas por Dimensión</Text>
        <View style={styles.metricsGrid}>
          {Object.entries(categoryScores).map(([id, score]) => (
            <View key={id} style={styles.metricRow}>
              <Text style={styles.metricLabel}>{categoryNames[id] || 'Dimensión'}</Text>
              <Text style={styles.metricValue}>{score}%</Text>
            </View>
          ))}
        </View>

        {/* Conclusion */}
        <View style={styles.conclusionBox}>
          <Text style={styles.conclusionTitle}>Conclusión del Diagnóstico</Text>
          <Text style={styles.conclusionText}>
            El evaluado ha demostrado un dominio del {overallScore}% en competencias digitales, 
            situándose en el nivel de {LEVEL_LABELS[level]}. Se recomienda continuar con planes 
            de capacitación enfocados en las áreas con menor desempeño para fortalecer la madurez 
            digital institucional.
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.flipBadge}>
              <Text style={styles.flipText}>FLIP</Text>
            </View>
            <Text style={styles.footerNote}>
              Documento generado automáticamente{'\n'}por el sistema de analítica Flip
            </Text>
          </View>
          <Text style={styles.footerRight}>
            {formattedDate}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
