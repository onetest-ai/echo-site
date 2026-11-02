# The site's slots as whole windows (menus and all, so the app reads as itself), from shoot.ps1's
# 1280x800 shots: shoot each view, then copy it to assets\screens\<slot>.png (+ -dark).
# Close-ups of one part, if a slot needs them, are crop.ps1's.
param([string]$Dest = (Join-Path $PSScriptRoot "..\..\assets\screens"), [switch]$NoShoot)
$slots = [ordered]@{
    "hero" = "board"; "capture" = "capture"; "minutes" = "minutes"; "board" = "changes"
    "tasks" = "tasks"; "people" = "verdant-people"; "brain" = "brain-graph"; "ask" = "ask"
}
$shots = Join-Path $PSScriptRoot "out\shots"
New-Item -ItemType Directory -Force $Dest | Out-Null
foreach ($slot in $slots.Keys) {
    if (-not $NoShoot) { & (Join-Path $PSScriptRoot "shoot.ps1") -Only $slots[$slot] -Width 1280 -Height 800 -Scale 2 -Tag "-w" 2>$null | Out-Null }
    Copy-Item (Join-Path $shots "$($slots[$slot])-w-light.png") (Join-Path $Dest "$slot.png") -Force
    Copy-Item (Join-Path $shots "$($slots[$slot])-w-dark.png") (Join-Path $Dest "$slot-dark.png") -Force
    Write-Output $slot
}
