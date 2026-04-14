const fs = require('fs');
const { execSync } = require('child_process');
// This is a hacky way since I don't have a library, but I'll try to use a command that works.
try {
    const output = execSync('powershell -Command "Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile(\'C:\\Users\\Ilav\\.gemini\\antigravity\\brain\\3a7f49fb-66d3-446e-a8d7-cc302a7b170b\\Rn2jh.png\'); Write-Host $img.Width x $img.Height"').toString();
    console.log(output);
} catch (e) {
    console.log('Error checking image');
}
