Add-Type -AssemblyName System.Drawing

$src = "c:\Users\am252\Downloads\Knowledge-Hub\Knowledge-Hub\artifacts\islamic-app\assets\images\icon.png"
$resDir = "c:\Users\am252\Downloads\Knowledge-Hub\Knowledge-Hub\artifacts\islamic-app\android\app\src\main\res"

$densities = @(
    @{ Name = "mipmap-mdpi"; Size = 48; FgSize = 108 },
    @{ Name = "mipmap-hdpi"; Size = 72; FgSize = 162 },
    @{ Name = "mipmap-xhdpi"; Size = 96; FgSize = 216 },
    @{ Name = "mipmap-xxhdpi"; Size = 144; FgSize = 324 },
    @{ Name = "mipmap-xxxhdpi"; Size = 192; FgSize = 432 }
)

$srcImg = [System.Drawing.Image]::FromFile($src)

foreach ($d in $densities) {
    $dir = Join-Path $resDir $d.Name
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # 1. Standard ic_launcher.png
    $bmp = New-Object System.Drawing.Bitmap($d.Size, $d.Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.DrawImage($srcImg, 0, 0, $d.Size, $d.Size)
    $g.Dispose()
    $bmp.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()

    # 2. Adaptive ic_launcher_foreground.png
    $fgBmp = New-Object System.Drawing.Bitmap($d.FgSize, $d.FgSize)
    $fgG = [System.Drawing.Graphics]::FromImage($fgBmp)
    $fgG.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $fgG.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    # Draw centered
    $fgG.DrawImage($srcImg, 0, 0, $d.FgSize, $d.FgSize)
    $fgG.Dispose()
    $fgBmp.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fgBmp.Dispose()

    Write-Output "Generated icons for $($d.Name)"
}

$srcImg.Dispose()
Write-Output "ALL_ANDROID_ICONS_GENERATED_SUCCESSFULLY"
