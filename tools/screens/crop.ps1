# Readable details for the site: one region of a 2x shot (out\shots, from shoot.ps1 -Scale 2) per
# slot, in CSS px of the 1600x1000 window, cut at 16:10 and saved to the site's assets\screens
# (plus -dark). A whole window shrunk into a page column can't be read; a region can.
param([string]$Dest = (Join-Path $PSScriptRoot "..\..\assets\screens"))
Add-Type -AssemblyName System.Drawing
$shots = Join-Path $PSScriptRoot "out\shots"
# slot = shot, x, y, width (height = width / 1.6)
$crops = [ordered]@{
    "hero"    = @("board", 320, 40, 1280)          # the board and the task with its quoted history
    "capture" = @("capture", 384, 196, 880)        # transcript + live notes
    "minutes" = @("minutes", 384, 340, 864)        # minutes with the user's notes inline
    "board"   = @("changes", 384, 206, 848)        # what this call changed, with quotes
    "task"    = @("board", 1240, 40, 360)          # the task alone (narrow; 16:10 cut from its top)
    "tasks"   = @("tasks", 76, 56, 620)            # I owe / Owed to me (late dates in red)
    "people"  = @("verdant-people", 320, 222, 904) # proposals to answer + the map
    "org"     = @("org", 320, 255, 1272)           # the org chart
    "ask"     = @("ask", 68, 418, 920)             # Claude in the window, asked about this call
    "brain"   = @("brain-graph", 360, 190, 1150)    # the Brain: topics of both clients, the calls between them
}
New-Item -ItemType Directory -Force $Dest | Out-Null
foreach ($slot in $crops.Keys) {
    $src, $x, $y, $w = $crops[$slot]
    $h = [int]($w / 1.6)
    foreach ($theme in "light", "dark") {
        $img = [System.Drawing.Image]::FromFile((Join-Path $shots "$src-$theme.png"))
        $s = $img.Width / 1600
        $rect = New-Object System.Drawing.Rectangle ([int]($x * $s)), ([int]($y * $s)), ([int]($w * $s)), ([int]($h * $s))
        $rect.Height = [Math]::Min($rect.Height, $img.Height - $rect.Y)
        $bmp = New-Object System.Drawing.Bitmap $rect.Width, $rect.Height
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $rect.Width, $rect.Height), $rect, [System.Drawing.GraphicsUnit]::Pixel)
        $suffix = $(if ($theme -eq "dark") { "-dark" } else { "" })
        $file = Join-Path $Dest "$slot$suffix.png"
        $bmp.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
        $g.Dispose(); $bmp.Dispose(); $img.Dispose()
        Write-Output "$file $($rect.Width)x$($rect.Height)"
    }
}
