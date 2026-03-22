# Script para actualizar route handlers de Next.js 15
# Busca todos los archivos route.ts con parametros dinamicos

$rootPath = "src/app/api"
$count = 0
$updated = 0

# Buscar todos los archivos route.ts
$files = Get-ChildItem -Path $rootPath -Recurse -Filter "route.ts"

foreach ($file in $files) {
    # Solo procesar archivos en carpetas con corchetes [id], [slotId], etc.
    if ($file.DirectoryName -match '\[.*\]') {
        Write-Host "Procesando: $($file.FullName)" -ForegroundColor Cyan
        
        $content = Get-Content $file.FullName -Raw
        $originalContent = $content
        
        # Reemplazar firmas de función con params
        $content = $content -replace '\{ params \}: \{ params: \{ (\w+): string \} \}', '{ params }: { params: Promise<{ $1: string }> }'
        
        # Reemplazar destructuring de params
        $content = $content -replace 'const \{ (\w+) \} = params;', 'const { $1 } = await params;'
        
        if ($content -ne $originalContent) {
            Set-Content $file.FullName -Value $content -NoNewline
            $updated++
            Write-Host "  Actualizado" -ForegroundColor Green
        } else {
            Write-Host "  Sin cambios" -ForegroundColor Yellow
        }
        
        $count++
    }
}

Write-Host "`nCompletado: $updated de $count archivos actualizados" -ForegroundColor Green
