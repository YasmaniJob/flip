# Script para corregir llamadas a requireAuth() sin parametro

$files = @(
    "src/app/api/meetings/[id]/route.ts",
    "src/app/api/meetings/[id]/tasks/route.ts",
    "src/app/api/meetings/tasks/[taskId]/route.ts",
    "src/app/api/meetings/route.ts",
    "src/app/api/meetings/[id]/attendance/route.ts",
    "src/app/api/meetings/attendance/[attendanceId]/route.ts",
    "src/app/api/classroom-reservations/tasks/[taskId]/route.ts",
    "src/app/api/classroom-reservations/slots/[slotId]/route.ts",
    "src/app/api/classroom-reservations/slots/[slotId]/reschedule/route.ts",
    "src/app/api/classroom-reservations/[id]/tasks/route.ts",
    "src/app/api/classroom-reservations/[id]/reschedule-block/route.ts",
    "src/app/api/classroom-reservations/slots/[slotId]/attendance/route.ts",
    "src/app/api/classroom-reservations/[id]/cancel/route.ts",
    "src/app/api/classroom-reservations/[id]/attendance/route.ts",
    "src/app/api/classroom-reservations/attendance/[attendanceId]/route.ts",
    "src/app/api/classroom-reservations/route.ts",
    "src/app/api/classroom-reservations/[id]/attendance/bulk/route.ts",
    "src/app/api/classroom-reservations/my-today/route.ts"
)

$count = 0

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Procesando: $file"
        
        $lines = Get-Content $file
        $newLines = @()
        
        foreach ($line in $lines) {
            $newLine = $line -replace 'const user = await requireAuth\(\);', 'const { user } = await requireAuth(request);'
            $newLine = $newLine -replace 'const \{ user \} = await requireAuth\(\);', 'const { user } = await requireAuth(request);'
            $newLines += $newLine
        }
        
        $newLines | Set-Content $file
        $count++
        Write-Host "  Actualizado"
    }
}

Write-Host "`nCompletado: $count archivos actualizados"
