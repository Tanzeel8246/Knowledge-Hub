Add-Type -AssemblyName System.Drawing
$sourcePath = "C:\Users\am252\.gemini\antigravity\brain\7dd0a1e1-dbf5-4632-9e71-72abe91213b6\islamic_research_app_icon_1792113878951.jpg"
$destLogo = "c:\Users\am252\Downloads\Knowledge-Hub\Knowledge-Hub\artifacts\islamic-app\assets\images\app-logo.png"
$destIcon = "c:\Users\am252\Downloads\Knowledge-Hub\Knowledge-Hub\artifacts\islamic-app\assets\images\icon.png"
$destAdaptive = "c:\Users\am252\Downloads\Knowledge-Hub\Knowledge-Hub\artifacts\islamic-app\assets\images\adaptive-icon.png"

$image = [System.Drawing.Image]::FromFile($sourcePath)
$image.Save($destLogo, [System.Drawing.Imaging.ImageFormat]::Png)
$image.Save($destIcon, [System.Drawing.Imaging.ImageFormat]::Png)
$image.Save($destAdaptive, [System.Drawing.Imaging.ImageFormat]::Png)
$image.Dispose()
Write-Output "PNG conversion completed successfully."
