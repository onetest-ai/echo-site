# Screenshots of the exported Echo window (out\export, from build.ps1) in headless Chrome: each view
# by its hash, with its right panel (the layout the page reads) and clicks (shot.js), light and dark,
# 1600x1000 CSS px at -Scale (2 = 3200x2000).   .\shoot.ps1 [-Only name] [-Scale 2]
param([string]$Only = "", [int]$Scale = 2, [int]$Port = 8799, [int]$Width = 1280, [int]$Height = 800, [string]$Tag = "")
# Continue: Chrome reports "N bytes written" on stderr, which PowerShell 5.1 turns into an error.
$ErrorActionPreference = "Continue"
$here = $PSScriptRoot
$export = Join-Path $here "out\export"
$shots = Join-Path $here "out\shots"
New-Item -ItemType Directory -Force $shots | Out-Null
$chrome = "$env:ProgramFiles\Google\Chrome\Application\chrome.exe"
$q = [uri]::EscapeDataString

# name = hash, right panel (none = closed), clicks (CSS selectors, in order)
$views = [ordered]@{
    "minutes" = @("call/2026-10-30_160012-pilot-readiness-check/minutes", "", @())
    "capture" = @("call/2026-10-30_160012-pilot-readiness-check/transcript", "", @())
    "steering" = @("call/2026-10-27_100140-harbor-weekly-steering/minutes", "notes", @())
    "changes" = @("call/2026-10-27_100140-harbor-weekly-steering/actions", "", @())
    "board"   = @("project/dispatch-platform-rollout/work", "work-item", @('[data-pj="node"][data-node="T005"]'))
    "tree"    = @("project/dispatch-platform-rollout/work", "work-item", @('[data-pj="node"][data-node="T001"]'))
    "people"  = @("project/dispatch-platform-rollout/people", "", @())
    "org"     = @("project/dispatch-platform-rollout/people", "", @('[data-pp="view"][data-v="org"]'))
    "verdant-people" = @("project/supplier-portal/people", "", @())
    "tasks"   = @("tasks", "asks", @())
    "client"  = @("client/harbor-logistics/overview", "needs", @())
    "brain-graph"  = @("brain/graph", "", @())
    "brain-topics" = @("brain/topics", "", @())
    "ask"     = @("call/2026-10-30_160012-pilot-readiness-check/minutes", "claude-call", @("inject=ask"))
}
$layoutFile = Join-Path $export "api\layout"
$layoutKept = [IO.File]::ReadAllText($layoutFile)
$srv = Start-Process python -ArgumentList "-m", "http.server", "$Port", "--bind", "127.0.0.1", "--directory", $export -PassThru -WindowStyle Hidden
Start-Sleep 2
try {
    foreach ($name in $views.Keys) {
        if ($Only -and $name -ne $Only) { continue }
        $hash, $panel, $clicks = $views[$name]
        $bottom = $(if ($panel -like "claude-*") { $panel } else { $null }); $right = $(if ($panel -and -not $bottom) { $panel } else { $null })
        $layout = @{ right = @{ open = [bool]$right; size = 330; active = $right }; bottom = @{ open = [bool]$bottom; size = 440; active = $bottom }; views = @{} }
        [IO.File]::WriteAllText($layoutFile, ($layout | ConvertTo-Json -Compress))
        $query = ($clicks | ForEach-Object { if ($_ -like "inject=*") { $_ } else { "click=" + $q.Invoke($_) } }) -join "&"
        $url = "http://127.0.0.1:$Port/" + $(if ($query) { "?$query" } else { "" }) + "#$hash"
        foreach ($theme in @(@("light", 1), @("dark", 0))) {
            $file = Join-Path $shots "$name$Tag-$($theme[0]).png"
            & $chrome --headless=new --disable-gpu --hide-scrollbars "--window-size=$Width,$Height" "--force-device-scale-factor=$Scale" `
                "--blink-settings=preferredColorScheme=$($theme[1])" --virtual-time-budget=10000 `
                "--screenshot=$file" $url 2>$null | Out-Null
            Write-Output $file
        }
    }
} finally {
    Stop-Process $srv.Id -ErrorAction SilentlyContinue
    [IO.File]::WriteAllText($layoutFile, $layoutKept)
}
