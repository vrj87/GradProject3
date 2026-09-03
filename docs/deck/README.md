# Reprint the 10-slide PDF

NextLeap 16:9 template with Myntra chrome (navy `#282C3F`, pink `#FF3F6C`). Body ≥ 14pt. System Calibri.

```powershell
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edge)) { $edge = "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe" }
$html = (Resolve-Path "docs/deck/10-slides.html").Path
$pdf  = (Resolve-Path "docs").Path + "\myntra-w2p-30d-deck.pdf"
$uri  = "file:///" + ($html -replace "\\", "/")
& $edge --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdf" $uri
```
