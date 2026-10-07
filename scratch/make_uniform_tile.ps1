# scratch/make_uniform_tile.ps1
Add-Type -AssemblyName System.Drawing

$srcPath = Resolve-Path "assets\BG_NEW\Background_New.jpg"
$src = [System.Drawing.Bitmap]::FromFile($srcPath)
$W = 1024

# We want the unit slice around Row 1 (center Y = 730).
# Let's test slice heights around 190 to 205 to find the exact period of the pattern.
$bestPeriod = 196
$minDiff = 999999999

for ($p = 188; $p -le 206; $p++) {
    $half = [int]($p / 2)
    $topY = 730 - $half
    $botY = $topY + $p
    
    $diff = 0
    for ($x = 0; $x -lt $W; $x += 4) {
        $c1 = $src.GetPixel($x, $topY)
        $c2 = $src.GetPixel($x, $botY)
        $dr = [int]$c1.R - [int]$c2.R
        $dg = [int]$c1.G - [int]$c2.G
        $db = [int]$c1.B - [int]$c2.B
        $diff += [Math]::Abs($dr) + [Math]::Abs($dg) + [Math]::Abs($db)
    }
    if ($diff -lt $minDiff) {
        $minDiff = $diff
        $bestPeriod = $p
    }
}

Write-Host "Best vertical period found: $bestPeriod px (diff score = $minDiff)"

# Now build a 6-row tile of height = 6 * bestPeriod
$rowCount = 6
$sliceH = $bestPeriod
$totalH = $rowCount * $sliceH
$half = [int]($sliceH / 2)
$topY = 730 - $half

# Extract unit slice
$unit = New-Object System.Drawing.Bitmap($W, $sliceH)
$ug = [System.Drawing.Graphics]::FromImage($unit)
$ug.DrawImage($src, [System.Drawing.Rectangle]::new(0, 0, $W, $sliceH), [System.Drawing.Rectangle]::new(0, $topY, $W, $sliceH), [System.Drawing.GraphicsUnit]::Pixel)
$ug.Dispose()

# Make unit slice vertically seamless by applying smooth cosine cross-fade on top/bottom 24px
$blendH = 24
for ($y = 0; $y -lt $blendH; $y++) {
    $t = (1 - [Math]::Cos(($y / $blendH) * [Math]::PI)) * 0.5 # 0 at y=0, 1 at y=blendH
    $botY = $sliceH - $blendH + $y
    for ($x = 0; $x -lt $W; $x++) {
        $pTop = $unit.GetPixel($x, $y)
        $pBot = $unit.GetPixel($x, $botY)
        
        # Linear blend between top and bottom
        $r = [int]($pTop.R * $t + $pBot.R * (1 - $t))
        $g = [int]($pTop.G * $t + $pBot.G * (1 - $t))
        $b = [int]($pTop.B * $t + $pBot.B * (1 - $t))
        $unit.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($r, $g, $b))
        
        $r2 = [int]($pBot.R * $t + $pTop.R * (1 - $t))
        $g2 = [int]($pBot.G * $t + $pTop.G * (1 - $t))
        $b2 = [int]($pBot.B * $t + $pTop.B * (1 - $t))
        $unit.SetPixel($x, $botY, [System.Drawing.Color]::FromArgb($r2, $g2, $b2))
    }
}

# Now compose the full uniform tile (6 rows)
$out = New-Object System.Drawing.Bitmap($W, $totalH)
$og = [System.Drawing.Graphics]::FromImage($out)
for ($r = 0; $r -lt $rowCount; $r++) {
    $og.DrawImage($unit, 0, $r * $sliceH)
}
$og.Dispose()
$unit.Dispose()
$src.Dispose()

$dstPath = Join-Path (Get-Location) "assets\BG_NEW\Background_Uniform.jpg"
$out.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$out.Dispose()

Write-Host "Created Background_Uniform.jpg: ${W}x${totalH}"
