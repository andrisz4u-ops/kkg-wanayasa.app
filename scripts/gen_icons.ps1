Add-Type -AssemblyName System.Drawing

$sourcePath = "public/static/img/logo-kkg.png"
$iconsDir = "public/static/icons"
$screenshotsDir = "public/static/screenshots"

if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}
if (-not (Test-Path $screenshotsDir)) {
    New-Item -ItemType Directory -Path $screenshotsDir -Force | Out-Null
}

$sourceImg = [System.Drawing.Image]::FromFile($sourcePath)
Write-Host ("Source image loaded: " + $sourceImg.Width + "x" + $sourceImg.Height)

$sizes = @(72, 96, 128, 144, 152, 192, 384, 512)

foreach ($size in $sizes) {
    $destBitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    
    $graphics.Clear([System.Drawing.Color]::Transparent)
    
    $ratioX = [double]$size / [double]$sourceImg.Width
    $ratioY = [double]$size / [double]$sourceImg.Height
    $ratio = [Math]::Min($ratioX, $ratioY)
    
    $newWidth = [int]($sourceImg.Width * $ratio)
    $newHeight = [int]($sourceImg.Height * $ratio)
    $posX = [int](($size - $newWidth) / 2)
    $posY = [int](($size - $newHeight) / 2)
    
    $graphics.DrawImage($sourceImg, $posX, $posY, $newWidth, $newHeight)
    
    $outFile = Join-Path $iconsDir ("icon-" + $size + "x" + $size + ".png")
    $destBitmap.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host ("Generated: icon-" + $size + "x" + $size + ".png")
    
    $graphics.Dispose()
    $destBitmap.Dispose()
}

$shortcutNames = @("shortcut-surat.png", "shortcut-proker.png", "shortcut-absensi.png")
foreach ($name in $shortcutNames) {
    $destBitmap = New-Object System.Drawing.Bitmap(96, 96)
    $graphics = [System.Drawing.Graphics]::FromImage($destBitmap)
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($sourceImg, 0, 0, 96, 96)
    $outFile = Join-Path $iconsDir $name
    $destBitmap.Save($outFile, [System.Drawing.Imaging.ImageFormat]::Png)
    Write-Host ("Generated: " + $name)
    $graphics.Dispose()
    $destBitmap.Dispose()
}

$desktopWidth = 1280
$desktopHeight = 720
$desktopBitmap = New-Object System.Drawing.Bitmap($desktopWidth, $desktopHeight)
$gDesk = [System.Drawing.Graphics]::FromImage($desktopBitmap)
$gDesk.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gDesk.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$brushDesk = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($desktopWidth, $desktopHeight)),
    [System.Drawing.Color]::FromArgb(248, 253, 253),
    [System.Drawing.Color]::FromArgb(224, 242, 241)
)
$gDesk.FillRectangle($brushDesk, 0, 0, $desktopWidth, $desktopHeight)

$cardX = 140
$cardY = 80
$cardW = $desktopWidth - 280
$cardH = $desktopHeight - 160
$cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gDesk.FillRectangle($cardBrush, $cardX, $cardY, $cardW, $cardH)

$penTeal = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(38, 148, 148), 4)
$gDesk.DrawRectangle($penTeal, $cardX, $cardY, $cardW, $cardH)

$logoSize = 160
$gDesk.DrawImage($sourceImg, ($desktopWidth / 2) - ($logoSize / 2), $cardY + 50, $logoSize, $logoSize)

$fontTitle = New-Object System.Drawing.Font("Arial", 24, [System.Drawing.FontStyle]::Bold)
$fontSub = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Regular)
$textBrushDark = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(15, 23, 42))
$textBrushTeal = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(38, 148, 148))
$format = New-Object System.Drawing.StringFormat
$format.Alignment = [System.Drawing.StringAlignment]::Center

$gDesk.DrawString("PORTAL DIGITAL KKG GUGUS 3 WANAYASA", $fontTitle, $textBrushDark, [float]($desktopWidth / 2), [float]($cardY + 230), $format)
$gDesk.DrawString("Platform Kolaborasi, Perangkat Ajar & Presensi Guru", $fontSub, $textBrushTeal, [float]($desktopWidth / 2), [float]($cardY + 280), $format)

$deskPath = Join-Path $screenshotsDir "home-desktop.png"
$desktopBitmap.Save($deskPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Generated screenshot: home-desktop.png"
$gDesk.Dispose()
$desktopBitmap.Dispose()

$mobW = 750
$mobH = 1334
$mobBitmap = New-Object System.Drawing.Bitmap($mobW, $mobH)
$gMob = [System.Drawing.Graphics]::FromImage($mobBitmap)
$gMob.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gMob.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

$brushMob = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point($mobW, $mobH)),
    [System.Drawing.Color]::FromArgb(248, 253, 253),
    [System.Drawing.Color]::FromArgb(204, 251, 241)
)
$gMob.FillRectangle($brushMob, 0, 0, $mobW, $mobH)

$mLogoSize = 180
$gMob.DrawImage($sourceImg, ($mobW / 2) - ($mLogoSize / 2), 200, $mLogoSize, $mLogoSize)

$fontMobTitle = New-Object System.Drawing.Font("Arial", 22, [System.Drawing.FontStyle]::Bold)
$fontMobSub = New-Object System.Drawing.Font("Arial", 16, [System.Drawing.FontStyle]::Regular)
$gMob.DrawString("KKG GUGUS 3 WANAYASA", $fontMobTitle, $textBrushDark, [float]($mobW / 2), 420, $format)
$gMob.DrawString("Aplikasi Pendidik & Perangkat Ajar", $fontMobSub, $textBrushTeal, [float]($mobW / 2), 470, $format)

$barBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$gMob.FillRectangle($barBrush, 0, $mobH - 120, $mobW, 120)
$barPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(226, 232, 240), 2)
$gMob.DrawLine($barPen, 0, $mobH - 120, $mobW, $mobH - 120)

$mobPath = Join-Path $screenshotsDir "home-mobile.png"
$mobBitmap.Save($mobPath, [System.Drawing.Imaging.ImageFormat]::Png)
Write-Host "Generated screenshot: home-mobile.png"

$gMob.Dispose()
$mobBitmap.Dispose()
$sourceImg.Dispose()

Write-Host "All PWA assets generated successfully!"
