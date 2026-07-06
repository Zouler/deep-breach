# Visual Phase B.1 — P0 asset preparation (Windows / System.Drawing)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$BgColor = [System.Drawing.Color]::FromArgb(255, 3, 7, 18)

function Ensure-Dir($path) {
  if (-not (Test-Path $path)) { New-Item -ItemType Directory -Path $path -Force | Out-Null }
}

function Load-Image($path) {
  return [System.Drawing.Image]::FromFile((Resolve-Path $path))
}

function Save-Png($bitmap, $path) {
  $dir = Split-Path $path -Parent
  Ensure-Dir $dir
  if (Test-Path $path) { Remove-Item $path -Force }
  $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

function Resize-Image($source, $maxW, $maxH) {
  $ratio = [Math]::Min($maxW / $source.Width, $maxH / $source.Height)
  $w = [Math]::Max(1, [int][Math]::Round($source.Width * $ratio))
  $h = [Math]::Max(1, [int][Math]::Round($source.Height * $ratio))
  $fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap $w, $h, $fmt
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $g.DrawImage($source, 0, 0, $w, $h)
  $g.Dispose()
  return $bmp
}

function Composite-Centered($canvasW, $canvasH, $logo, $background) {
  $fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap $canvasW, $canvasH, $fmt
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.Clear($background)
  $x = [int](($canvasW - $logo.Width) / 2)
  $y = [int](($canvasH - $logo.Height) / 2)
  $g.DrawImage($logo, $x, $y, $logo.Width, $logo.Height)
  $g.Dispose()
  return $bmp
}

function Create-ExpoAppIcon($iconMaster, $outPath) {
  $src = Load-Image $iconMaster
  try {
    $max = [int](1024 * (1 - 0.12 * 2))
    $logo = Resize-Image $src $max $max
    try {
      $bmp = Composite-Centered 1024 1024 $logo $BgColor
      try { Save-Png $bmp $outPath } finally { $bmp.Dispose() }
    } finally { $logo.Dispose() }
  } finally { $src.Dispose() }
}

function Create-ExpoAdaptiveIcon($iconMaster, $outPath) {
  $src = Load-Image $iconMaster
  try {
    $max = [int](1024 * 0.66)
    $logo = Resize-Image $src $max $max
    try {
      $bmp = Composite-Centered 1024 1024 $logo ([System.Drawing.Color]::Transparent)
      try { Save-Png $bmp $outPath } finally { $bmp.Dispose() }
    } finally { $logo.Dispose() }
  } finally { $src.Dispose() }
}

function Create-ExpoSplashPortrait($logoMaster, $outPath) {
  $src = Load-Image $logoMaster
  try {
    $maxW = [int](1284 * 0.62)
    $logo = Resize-Image $src $maxW $maxW
    try {
      $fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
      $bmp = New-Object System.Drawing.Bitmap 1284, 2778, $fmt
      $g = [System.Drawing.Graphics]::FromImage($bmp)
      $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $g.Clear($BgColor)
      $x = [int]((1284 - $logo.Width) / 2)
      $y = [int](2778 * 0.22 - $logo.Height / 2)
      $g.DrawImage($logo, $x, $y, $logo.Width, $logo.Height)
      $g.Dispose()
      try { Save-Png $bmp $outPath } finally { $bmp.Dispose() }
    } finally { $logo.Dispose() }
  } finally { $src.Dispose() }
}

function Create-Favicon($iconMaster, $outPath) {
  $src = Load-Image $iconMaster
  try {
    $logo = Resize-Image $src 64 64
    try { Save-Png $logo $outPath } finally { $logo.Dispose() }
  } finally { $src.Dispose() }
}

function Create-ScanlineOverlay($outPath) {
  $w = 512
  $h = 512
  $fmt = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap $w, $h, $fmt
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, $bmp.PixelFormat)
  $bytes = New-Object byte[] ($data.Stride * $h)
  $rng = New-Object System.Random 900007
  for ($y = 0; $y -lt $h; $y++) {
    $lineAlpha = if ($y % 4 -eq 0) { if ($y % 8 -eq 0) { 14 } else { 10 } } else { 0 }
    for ($x = 0; $x -lt $w; $x++) {
      $alpha = $lineAlpha
      $n = $rng.NextDouble()
      if ($n -lt 0.0015) { $alpha = [Math]::Max($alpha, 6 + $rng.Next(10)) }
      if ($n -gt 0.9992) { $alpha = [Math]::Max($alpha, 4 + $rng.Next(6)) }
      $idx = $y * $data.Stride + $x * 4
      $bytes[$idx] = 192
      $bytes[$idx + 1] = 186
      $bytes[$idx + 2] = 176
      $bytes[$idx + 3] = $alpha
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $bmp.UnlockBits($data)
  try { Save-Png $bmp $outPath } finally { $bmp.Dispose() }
}

function Optimize-ItemIcon($srcPath, $outPath) {
  $src = Load-Image $srcPath
  try {
    $logo = Resize-Image $src 256 256
    try { Save-Png $logo $outPath } finally { $logo.Dispose() }
  } finally { $src.Dispose() }
}

$iconMaster = Join-Path $Root 'assets/branding/logo-deep-breach-icon.png'
$logoMaster = Join-Path $Root 'assets/images/logo-deep-breach.png'

$dirs = @(
  'assets/branding',
  'assets/images/overlays',
  'assets/images/backgrounds',
  'assets/images/rooms',
  'assets/images/portraits',
  'assets/icons/items-optimized',
  'assets/stamps'
)
foreach ($d in $dirs) { Ensure-Dir (Join-Path $Root $d) }

Create-ExpoAppIcon $iconMaster (Join-Path $Root 'assets/branding/expo-app-icon.png')
Create-ExpoAdaptiveIcon $iconMaster (Join-Path $Root 'assets/branding/expo-adaptive-icon.png')
Create-ExpoSplashPortrait $logoMaster (Join-Path $Root 'assets/branding/expo-splash-portrait.png')
Create-Favicon $iconMaster (Join-Path $Root 'assets/images/favicon.png')
Create-ScanlineOverlay (Join-Path $Root 'assets/images/overlays/overlay-scanline-noise.png')

$itemIcons = @(
  'icon-scrap','icon-research-data','icon-hull-patch-kit','icon-pressure-sealant',
  'icon-oxygen-canister','icon-artifact','icon-scan-area','icon-crack'
)
$manifest = @()
foreach ($name in $itemIcons) {
  $src = Join-Path $Root "assets/icons/$name.png"
  $out = Join-Path $Root "assets/icons/items-optimized/$name.png"
  $srcImg = Load-Image $src
  $srcW = $srcImg.Width
  $srcH = $srcImg.Height
  $srcImg.Dispose()
  Optimize-ItemIcon $src (Join-Path $Root "assets/icons/items-optimized/$name.png")
  $manifest += [ordered]@{
    name = "$name.png"
    source = "assets/icons/$name.png"
    sourceDimensions = "${srcW}x${srcH}"
    outputDimensions = '256x256'
    format = 'png'
    note = 'WebP deferred — run scripts/prepare-phase-b-p0-assets.mjs with sharp for .webp'
  }
}

$manifestPath = Join-Path $Root 'assets/icons/items-optimized/MANIFEST.json'
$manifestObj = @{ generated = (Get-Date).ToUniversalTime().ToString('o'); icons = $manifest }
$manifestObj | ConvertTo-Json -Depth 5 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Output 'Phase B P0 assets generated.'
