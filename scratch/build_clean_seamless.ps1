# scratch/build_clean_seamless.ps1
Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "assets\BG_NEW\Background_New.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$W = 1024

# 6 rows of holes, period = 200px -> total height = 1200px
$rowSpacing = 200
$rowCount = 6
$totalH = $rowCount * $rowSpacing

$canvas = New-Object System.Drawing.Bitmap($W, $totalH)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Fill base floor with natural cream stone floor color from Background_New.jpg
$floorColor = [System.Drawing.Color]::FromArgb(234, 230, 222)
$g.Clear($floorColor)

# Helper: Extract elliptical patch from src with soft feathered alpha mask
function Extract-EllipticalPatch($centerX, $centerY, $radX, $radY) {
    $boxW = [int]($radX * 2 + 10)
    $boxH = [int]($radY * 2 + 10)
    $patch = New-Object System.Drawing.Bitmap($boxW, $boxH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    
    $srcLeft = $centerX - [int]($boxW / 2)
    $srcTop = $centerY - [int]($boxH / 2)
    
    for ($py = 0; $py -lt $boxH; $py++) {
        $sy = $srcTop + $py
        if ($sy -lt 0 -or $sy -ge $src.Height) { continue }
        
        $dy = ($py - [int]($boxH / 2)) / $radY
        $dySq = $dy * $dy
        
        for ($px = 0; $px -lt $boxW; $px++) {
            $sx = $srcLeft + $px
            if ($sx -lt 0 -or $sx -ge $src.Width) { continue }
            
            $dx = ($px - [int]($boxW / 2)) / $radX
            $distSq = $dx * $dx + $dySq
            
            if ($distSq -lt 1.0) {
                $alpha = 1.0
                if ($distSq -gt 0.80) {
                    $alpha = (1.0 - $distSq) / (1.0 - 0.80)
                }
                $pixel = $src.GetPixel($sx, $sy)
                $a = [int]($pixel.A * $alpha)
                $patch.SetPixel($px, $py, [System.Drawing.Color]::FromArgb($a, $pixel.R, $pixel.G, $pixel.B))
            }
        }
    }
    return $patch
}

Write-Host "Extracting stone pads..."
# 1. Hole Pad: Center (511, 730), stone radius 148x95
$holePad = Extract-EllipticalPatch 511 730 148 95

# 2. Solid Pad (without hole): Center (511, 356), stone radius 148x95
$solidPad = Extract-EllipticalPatch 511 356 148 95

Write-Host "Compositing repeating staggered grid..."

# Layer 1: Solid pads on Row B (at Y = 0, 200, 400, 600, 800, 1000, 1200)
# Notice: Y=0 and Y=1200 are the exact same phase, splitting the solid stone row cleanly!
$staggerCols = @(-153, 51, 358, 665, 972, 1177)
for ($r = -1; $r -le ($rowCount + 1); $r++) {
    $rowY = [int]($r * $rowSpacing)
    foreach ($colX in $staggerCols) {
        $destX = [int]($colX - $solidPad.Width / 2)
        $destY = [int]($rowY - $solidPad.Height / 2)
        $g.DrawImage($solidPad, $destX, $destY)
    }
}

# Layer 2: Hole pads on Row A (at Y = 100, 300, 500, 700, 900, 1100)
# Holes are completely centered inside their rows, away from top and bottom edges!
$holeCols = @(205, 512, 819)
for ($r = 0; $r -lt $rowCount; $r++) {
    $rowY = [int]($r * $rowSpacing + $rowSpacing * 0.5)
    foreach ($colX in $holeCols) {
        $destX = [int]($colX - $holePad.Width / 2)
        $destY = [int]($rowY - $holePad.Height / 2)
        $g.DrawImage($holePad, $destX, $destY)
    }
}

# Soft cosine blend at top/bottom 18px (in the solid stone row) to guarantee 100% seam-free wrap
$blendH = 18
for ($y = 0; $y -lt $blendH; $y++) {
    $t = (1 - [Math]::Cos(($y / $blendH) * [Math]::PI)) * 0.5
    $botY = $totalH - $blendH + $y
    for ($x = 0; $x -lt $W; $x++) {
        $pTop = $canvas.GetPixel($x, $y)
        $pBot = $canvas.GetPixel($x, $botY)
        $r = [int]($pTop.R * $t + $pBot.R * (1 - $t))
        $gCol = [int]($pTop.G * $t + $pBot.G * (1 - $t))
        $b = [int]($pTop.B * $t + $pBot.B * (1 - $t))
        $canvas.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($r, $gCol, $b))
        $canvas.SetPixel($x, $botY, [System.Drawing.Color]::FromArgb($r, $gCol, $b))
    }
}

$g.Dispose()
$holePad.Dispose()
$solidPad.Dispose()
$src.Dispose()

$dstPath = Join-Path (Get-Location) "assets\BG_NEW\Background_Seamless_Grid.jpg"
$canvas.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$canvas.Dispose()

Write-Host "Created Background_Seamless_Grid.jpg: ${W}x${totalH}"
