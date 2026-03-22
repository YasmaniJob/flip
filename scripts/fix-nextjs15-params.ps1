# Script para actualizar route handlers de Next.js 15
# Convierte params de { id: string } a Promise<{ id: string }>

$files = @(
    "src/app/api/categories/[id]/route.ts",
    "src/app/api/classroom-reservations/[id]/attendance/bulk/route.ts",
    "src/app/api/classroom-reservations/[id]/attendance/route.ts",
    "src/app/api/classroom-reservations/[id]/cancel/route.ts",
    "src/app/api/classroom-reservations/[id]/reschedule-block/route.ts",
    "src/app/api/classroom-reservations/[id]/tasks/route.ts",
    "src/app/api/classroom-reservations/attendance/[attendanceId]/route.ts",
    "src/app/api/classroom-reservations/slots/[slotId]/attendance/route.ts",
    "src/app/api/classroom-reservations/slots/[slotId]/reschedule/route.ts",
    "src/app/api/classroom-reservations/slots/[slotId]/route.ts",
    "src/app/api/classroom-reservations/tasks/[taskId]/route.ts",
    "src/app/api/classrooms/[id]/route.ts",
    "src/app/api/curricular-areas/[id]/route.ts",
    "src/app/api/grades/[id]/route.ts",
    "src/app/api/loans/[id]/reject/route.ts",
    "src/app/api/loans/[id]/return/route.ts",
    "src/app/api/meetings/[id]/attendance/route.ts",
    "src/app/api/meetings/[id]/route.ts",
    "src/app/api/meetings/[id]/tasks/route.ts",
    "src/app/api/meetings/attendance/[attendanceId]/route.ts",
    "src/app/api/meetings/tasks/[taskId]/route.ts",
    "src/app/api/pedagogical-hours/[id]/route.ts",
    "src/app/api/resource-templates/[id]/route.ts",
    "src/app/api/resources/[id]/last-damage-report/route.ts",
    "src/app/api/resources/[id]/route.ts",
    "src/app/api/sections/[id]/route.ts",
    "src/app/api/staff/[id]/route.ts",
    "src/app/api/users/[id]/toggle-super-admin/route.ts"
)

$count = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file" -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw
        
        # Patrón 1: { params }: { params: { id: string } } → { params }: { params: Promise<{ id: string }> }
        $content = $content -replace '\{ params \}: \{ params: \{ id: string \} \}', '{ params }: { params: Promise<{ id: string }> }'
        
        # Patrón 2: { params }: { params: { slotId: string } } → { params }: { params: Promise<{ slotId: string }> }
        $content = $content -replace '\{ params \}: \{ params: \{ slotId: string \} \}', '{ params }: { params: Promise<{ slotId: string }> }'
        
        # Patrón 3: { params }: { params: { taskId: string } } → { params }: { params: Promise<{ taskId: string }> }
        $content = $content -replace '\{ params \}: \{ params: \{ taskId: string \} \}', '{ params }: { params: Promise<{ taskId: string }> }'
        
        # Patrón 4: { params }: { params: { attendanceId: string } } → { params }: { params: Promise<{ attendanceId: string }> }
        $content = $content -replace '\{ params \}: \{ params: \{ attendanceId: string \} \}', '{ params }: { params: Promise<{ attendanceId: string }> }'
        
        # Patrón 5: const { id } = params; → const { id } = await params;
        $content = $content -replace 'const \{ id \} = params;', 'const { id } = await params;'
        
        # Patrón 6: const { slotId } = params; → const { slotId } = await params;
        $content = $content -replace 'const \{ slotId \} = params;', 'const { slotId } = await params;'
        
        # Patrón 7: const { taskId } = params; → const { taskId } = await params;
        $content = $content -replace 'const \{ taskId \} = params;', 'const { taskId } = await params;'
        
        # Patrón 8: const { attendanceId } = params; → const { attendanceId } = await params;
        $content = $content -replace 'const \{ attendanceId \} = params;', 'const { attendanceId } = await params;'
        
        Set-Content $file -Value $content -NoNewline
        $count++
        Write-Host "  Actualizado" -ForegroundColor Green
    } else {
        Write-Host "  No encontrado: $file" -ForegroundColor Red
    }
}

Write-Host "`nCompletado: $count archivos actualizados" -ForegroundColor Green
