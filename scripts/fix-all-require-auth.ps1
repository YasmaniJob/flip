# Script para corregir todas las llamadas a requireAuth() sin parametro

$rootPath = "src/app/api"
$count = 0

# Buscar todos los archivos route.ts
$files = Get-ChildItem -Path $rootPath -Recurse -Filter "route.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName
    $modified = $false
    $newContent = @()
    
    foreach ($line in $content) {
        $newLine = $line
        
        # Reemplazar requireAuth sin parametro
        if ($line -match 'const user = await requireAuth\(\);') {
            $newLine = $line -replace 'const user = await requireAuth\(\);', 'const { user } = await requireAuth(request);'
            $modified = $true
        }
        elseif ($line -match 'const \{ user \} = await requireAuth\(\);') {
            $newLine = $line -replace 'const \{ user \} = await requireAuth\(\);', 'const { user } = await requireAuth(request);'
            $modified = $true
        }
        
        $newContent += $newLine
    }
    
    if ($modified) {
        $newContent | Set-Content $file.FullName
        Write-Host "Actualizado: $($file.FullName)"
        $count++
    }
}

Write-Host "`nCompletado: $count archivos actualizados"
