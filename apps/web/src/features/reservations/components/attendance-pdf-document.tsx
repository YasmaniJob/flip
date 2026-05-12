'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AttendancePDFDocumentProps {
    reservation: {
        id: string;
        title?: string | null;
        date: Date;
        startTime: string;
        endTime: string;
        classroomName?: string;
        purpose?: string;
    };
    attendees: Array<{
        id: string;
        staffName: string;
        staffRole: string;
        staffEmail?: string;
        status: 'presente' | 'ausente';
    }>;
    tasks?: Array<{
        id: string;
        description: string;
        status: 'pending' | 'completed';
    }>;
    institutionName?: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 10,
        backgroundColor: '#ffffff',
    },
    header: {
        marginBottom: 15,
        borderBottom: '2 solid #7c3aed',
        paddingBottom: 10,
    },
    title: {
        fontSize: 18,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 6,
        color: '#7c3aed',
    },
    subtitle: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 4,
    },
    section: {
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 12,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        backgroundColor: '#f1f5f9',
        padding: 6,
        letterSpacing: 0.5,
        color: '#7c3aed',
    },
    infoRow: {
        flexDirection: 'row',
        marginBottom: 4,
    },
    infoLabel: {
        width: 120,
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        textTransform: 'uppercase',
        color: '#666666',
    },
    infoValue: {
        flex: 1,
        fontSize: 10,
    },
    table: {
        marginTop: 6,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#7c3aed',
        padding: 6,
        fontFamily: 'Helvetica-Bold',
        fontSize: 9,
        color: '#ffffff',
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottom: '1 solid #e0e0e0',
        padding: 8,
        minHeight: 35,
        alignItems: 'center',
    },
    tableRowAlt: {
        backgroundColor: '#f9f9f9',
    },
    tableCell: {
        fontSize: 9,
    },
    checkbox: {
        width: 12,
        height: 12,
        border: '1.5 solid #7c3aed',
        marginRight: 8,
    },
    checkboxChecked: {
        backgroundColor: '#7c3aed',
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

export function AttendancePDFDocument({ 
    reservation, 
    attendees, 
    tasks = [],
    institutionName = 'Institución Educativa'
}: AttendancePDFDocumentProps) {
    const formattedDate = format(reservation.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
    
    // Generate human-readable reservation number from ID
    const reservationNumber = reservation.id.slice(0, 8).toUpperCase();

    return (
        <Document title={`Asistencia - ${reservation.title || 'Reserva'}`}>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>
                        {reservation.title || 'Registro de Asistencia'}
                    </Text>
                    <Text style={styles.subtitle}>{institutionName}</Text>
                </View>

                {/* Workshop Information */}
                <View style={styles.section}>
                    {reservation.classroomName && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Aula:</Text>
                            <Text style={styles.infoValue}>{reservation.classroomName}</Text>
                        </View>
                    )}
                    {reservation.purpose && (
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Propósito:</Text>
                            <Text style={styles.infoValue}>{reservation.purpose}</Text>
                        </View>
                    )}
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Fecha:</Text>
                        <Text style={styles.infoValue}>{formattedDate}</Text>
                    </View>
                </View>

                {/* Attendance List */}
                <View style={styles.section}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <Text style={styles.sectionTitle}>Lista de Asistencia</Text>
                        <Text style={{ fontSize: 9, color: '#64748b' }}>{attendees.length} registrados</Text>
                    </View>
                    <View style={styles.table}>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.tableCell, { width: 40 }]}>N°</Text>
                            <Text style={[styles.tableCell, { flex: 1 }]}>Nombre Completo</Text>
                            <Text style={[styles.tableCell, { width: 100 }]}>Cargo</Text>
                            <Text style={[styles.tableCell, { width: 150 }]}>Correo Electrónico</Text>
                        </View>
                        {attendees.map((attendee, index) => (
                            <View 
                                key={attendee.id} 
                                style={[
                                    styles.tableRow, 
                                    index % 2 === 1 && styles.tableRowAlt
                                ]}
                            >
                                <Text style={[styles.tableCell, { width: 40 }]}>
                                    {(index + 1).toString().padStart(2, '0')}
                                </Text>
                                <Text style={[styles.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>
                                    {attendee.staffName}
                                </Text>
                                <Text style={[styles.tableCell, { width: 100, fontSize: 8 }]}>
                                    {attendee.staffRole}
                                </Text>
                                <Text style={[styles.tableCell, { width: 150, fontSize: 8, color: '#64748b' }]}>
                                    {attendee.staffEmail || '-'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>
                        FLIP INNOVACIÓN • Sistema de Gestión Educativa • Reserva #{reservationNumber}
                    </Text>
                </View>
            </Page>
        </Document>
    );
}

