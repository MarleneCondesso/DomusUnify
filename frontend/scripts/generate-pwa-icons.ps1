param(
  [string]$OutDir = (Join-Path $PSScriptRoot '..\\public')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Drawing

$bg1 = [System.Drawing.ColorTranslator]::FromHtml('#070510')
$bg2 = [System.Drawing.ColorTranslator]::FromHtml('#7c3aed')

function Write-Icon {
  param(
    [string]$Path,
    [int]$Size,
    [double]$TextScale,
    [double]$InnerScale = 0
  )

  $bmp = New-Object System.Drawing.Bitmap $Size, $Size
  $g = [System.Drawing.Graphics]::FromImage($bmp)

  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $rect = New-Object System.Drawing.Rectangle 0, 0, $Size, $Size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $bg1, $bg2, 45)
  $g.FillRectangle($brush, $rect)

  if ($InnerScale -gt 0) {
    $innerSize = [int]($Size * $InnerScale)
    $innerX = [int](($Size - $innerSize) / 2)
    $alpha = 28
    $glowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
    $g.FillEllipse($glowBrush, $innerX, $innerX, $innerSize, $innerSize)
    $glowBrush.Dispose()
  }

  $fontSize = [single]($Size * $TextScale)
  $font = New-Object System.Drawing.Font('Segoe UI', $fontSize, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center

  $x = [single]($Size / 2)
  $y = [single]($Size * 0.52)

  $shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(80, 0, 0, 0))
  $g.DrawString('DU', $font, $shadowBrush, $x + ($Size * 0.01), $y + ($Size * 0.012), $format)
  $shadowBrush.Dispose()

  $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.DrawString('DU', $font, $textBrush, $x, $y, $format)
  $textBrush.Dispose()

  $format.Dispose()
  $font.Dispose()
  $brush.Dispose()
  $g.Dispose()

  $directory = Split-Path -Parent $Path
  if ($directory -and -not (Test-Path $directory)) {
    New-Item -ItemType Directory -Path $directory | Out-Null
  }

  $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Write-Icon -Path (Join-Path $OutDir 'pwa-192x192.png') -Size 192 -TextScale 0.55
Write-Icon -Path (Join-Path $OutDir 'pwa-512x512.png') -Size 512 -TextScale 0.52
Write-Icon -Path (Join-Path $OutDir 'pwa-maskable-192x192.png') -Size 192 -TextScale 0.45 -InnerScale 0.78
Write-Icon -Path (Join-Path $OutDir 'pwa-maskable-512x512.png') -Size 512 -TextScale 0.42 -InnerScale 0.78
Write-Icon -Path (Join-Path $OutDir 'apple-touch-icon.png') -Size 180 -TextScale 0.55

Write-Host "Generated PWA icons in $OutDir"
