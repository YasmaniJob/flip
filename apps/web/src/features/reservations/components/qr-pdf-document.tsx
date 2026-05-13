'use client';

import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface QRPDFDocumentProps {
    qrDataUrl: string;
    title?: string;
    date?: Date;
    attendanceUrl: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#ffffff',
        alignItems: 'center',
    },
    header: {
        width: '100%',
        marginBottom: 24,
        borderBottom: '2 solid #7c3aed',
        paddingBottom: 12,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        color: '#7c3aed',
        textAlign: 'center',
        marginBottom: 6,
    },
    dateText: {
        fontSize: 11,
        color: '#64748b',
        textAlign: 'center',
    },
    qrContainer: {
        padding: 20,
        border: '2 solid #e2e8f0',
        borderRadius: 8,
        backgroundColor: '#ffffff',
        marginBottom: 24,
    },
    qrImage: {
        width: 240,
        height: 240,
    },
    urlLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        color: '#94a3b8',
        marginBottom: 6,
        textAlign: 'center',
    },
    urlText: {
        fontSize: 9,
        color: '#475569',
        textAlign: 'center',
        fontFamily: 'Helvetica',
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 8,
        color: '#999999',
        borderTop: '1 solid #e0e0e0',
        paddingTop: 10,
    },
});

export function QRPDFDocument({ qrDataUrl, title, date, attendanceUrl }: QRPDFDocumentProps) {
    const formattedDate = date
        ? format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
        : null;

    return (
        <Document title={`QR Asistencia - ${title || 'Taller'}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {title || 'Código QR de Asistencia'}
                    </Text>
                    {formattedDate && (
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    )}
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                    <Image src={qrDataUrl} style={styles.qrImage} />
                </View>

                {/* URL */}
                <Text style={styles.urlLabel}>Enlace de asistencia</Text>
                <Text style={styles.urlText}>{attendanceUrl}</Text>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>FLIP INNOVACIÓN • Sistema de Gestión Educativa</Text>
                </View>
            </Page>
        </Document>
    );
}
