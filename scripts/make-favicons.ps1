# Gera os PNGs do favicon (favicon-32.png e apple-touch-icon.png) a partir
# do mesmo grid pixel art do public/favicon.svg. Rodar 1x (Windows):
#   powershell -File scripts/make-favicons.ps1
Add-Type -AssemblyName System.Drawing

# Grid 16x16 (y2..y13): X corpo, D nadadeiras/cauda, L barriga, E olho
$grid = @(
  '......DDDD......',
  '.D...DDDDDD.....',
  '.DD..XXXXXXXXX..',
  'DDD.XXXXXXXEEXX.',
  'DDDXXXXXXXXEEXX.',
  'DDDDXXXXXXXXXXX.',
  'DDDDXXXDDXXXXXX.',
  'DDDXXXXDDXXXXXX.',
  '.DD.LLLLLLLLLXX.',
  '.D...LLLLLLLLX..',
  '......DDDD......',
  '.......DD.......'
)

$colors = @{
  'X' = [System.Drawing.Color]::FromArgb(0xFF, 0x7E, 0xC8, 0x50)
  'D' = [System.Drawing.Color]::FromArgb(0xFF, 0x5A, 0xA0, 0x32)
  'L' = [System.Drawing.Color]::FromArgb(0xFF, 0xA9, 0xD9, 0x7A)
  'E' = [System.Drawing.Color]::FromArgb(0xFF, 0x14, 0x14, 0x14)
}

function Draw-Favicon([string]$path, [int]$size) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.Clear([System.Drawing.Color]::FromArgb(0xFF, 0x1B, 0x2A, 0x1B))
  $scale = $size / 16.0
  for ($y = 2; $y -le 13; $y++) {
    $row = $grid[$y - 2]
    for ($x = 0; $x -lt 16; $x++) {
      $c = [string]$row[$x]
      if ($colors.ContainsKey($c)) {
        $brush = New-Object System.Drawing.SolidBrush($colors[$c])
        $g.FillRectangle($brush, [float]($x * $scale), [float]($y * $scale), [float]$scale, [float]$scale)
        $brush.Dispose()
      }
    }
  }
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "gerado: $path ($size x $size)"
}

$outDir = Join-Path $PSScriptRoot '..\public'
Draw-Favicon (Join-Path $outDir 'favicon-32.png') 32
Draw-Favicon (Join-Path $outDir 'apple-touch-icon.png') 180
