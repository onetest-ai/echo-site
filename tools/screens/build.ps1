# The demo for the site's screenshots, from scratch: made-up calls (make_demo.py), then clients,
# threads, the work ledger and people through echoctl itself, then the window exported as static
# files (out\export) for shoot.ps1. Fiction only; never touches the real data folder or config:
# ECHOCTL_HOME and ECHOCTL_CONFIG_DIR point into out\.
#   .\build.ps1 [-Echoctl <path to echoctl.exe>]
param([string]$Echoctl = "C:\echo-build\release\echoctl.exe")
$ErrorActionPreference = "Continue"
$here = $PSScriptRoot
$out = Join-Path $here "out"
$L = Join-Path $here "ledger"
$e = $Echoctl

python (Join-Path $here "make_demo.py") $out | Out-Null
if ($LASTEXITCODE -ne 0) { throw "make_demo.py failed" }
$env:ECHOCTL_HOME = "$out\home"
$env:ECHOCTL_CONFIG_DIR = "$out\config"

function Ok($what, $json) {
    $r = $json | ConvertFrom-Json
    $rej = @($r.rejected) | Where-Object { $_ }
    if ($rej) { $rej | ForEach-Object { Write-Warning "$what rejected #$($_.i): $($_.why)" } }
}

# Clients and threads (membership by people's mail domains).
& $e client add "Northlight Consulting" --domains northlight.example --internal | Out-Null
& $e client add "Harbor Logistics" --domains harborlogistics.example | Out-Null
& $e client add "Verdant Foods" --domains verdantfoods.example | Out-Null
& $e project create "Dispatch platform rollout" --client harbor-logistics --stage active | Out-Null
& $e project create "Supplier portal" --client verdant-foods --stage proposal | Out-Null
foreach ($id in "dispatch-platform-rollout", "supplier-portal") {
    & $e project rule $id --people | Out-Null
    & $e project set $id --since 2026-10-01 --brief (Join-Path $here "brief-$id.md") | Out-Null
}
# Priya is in both threads: the readiness check is Harbor's only ("Not this" on the suggestion).
& $e project exclude supplier-portal 2026-10-30_160012-pilot-readiness-check | Out-Null

# The work ledger: each call's proposals (quotes checked by echoctl), then every claim verified.
& $e project ledger dispatch-platform-rollout sync | Out-Null
& $e project ledger supplier-portal sync | Out-Null
$steps = @(
    @("dispatch-platform-rollout", "2026-10-20_100212", "harbor-1"),
    @("dispatch-platform-rollout", "2026-10-22_143005", "harbor-2"),
    @("dispatch-platform-rollout", "2026-10-27_100140", "harbor-3"),
    @("dispatch-platform-rollout", "2026-10-30_160012", "harbor-4"),
    @("supplier-portal", "2026-10-21_110305", "verdant-1"),
    @("supplier-portal", "2026-10-29_150120", "verdant-2")
)
foreach ($s in $steps) {
    Ok $s[2] (& $e project ledger $s[0] apply --evidence $s[1] --proposals "$L\$($s[2]).json")
    & $e project ledger $s[0] done --evidence $s[1] | Out-Null
}
foreach ($id in "dispatch-platform-rollout", "supplier-portal") {
    $v = & $e project ledger $id verify-prep | ConvertFrom-Json
    $f = "$out\verify-$id.json"
    ConvertTo-Json @(@($v) | Where-Object { $_ } | ForEach-Object { @{ mid = $_.mid; verdict = "supports"; reason = "the quoted words say it" } }) | Set-Content -Encoding ascii $f
    Ok "verify $id" (& $e project ledger $id verify-apply --file $f)
    $now = (Get-Date).ToString("o")
    @{ state = "done"; at = $now; message = "read its calls"; written = 0; processed = 0 } | ConvertTo-Json | Set-Content -Encoding ascii "$out\home\projects\$id\ledger\sync.json"
}
# What Alex handed over and tracks (About me: "I delegate and track").
foreach ($pair in @(@("dispatch-platform-rollout", "T001"), @("dispatch-platform-rollout", "T005"), @("dispatch-platform-rollout", "T006"),
                    @("dispatch-platform-rollout", "T008"), @("dispatch-platform-rollout", "T012"), @("dispatch-platform-rollout", "T013"), @("supplier-portal", "T001"), @("supplier-portal", "T004"))) {
    $body = @{ op = "edit"; node = $pair[1]; set = @{ delegated_by = "Me" } } | ConvertTo-Json -Compress
    # PowerShell 5.1 drops the quotes inside an argument to a native program unless escaped.
    & $e project ledger $pair[0] edit ($body -replace '"', '\"') | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Warning "delegation of $($pair[1]) failed" }
}

# People: the directory and each thread's map, then two proposals of the people pass (Needs you).
python (Join-Path $here "place_people.py") "$out\home" | Out-Null
Ok "people 1" (& $e project ledger supplier-portal people-apply --evidence 2026-10-21_110305 --file "$L\verdant-people.json")
Ok "people 2" (& $e project ledger supplier-portal people-apply --evidence 2026-10-21_110305 --file "$L\verdant-people-2.json")

# The window as static files, with the screenshot helper.
Remove-Item -Recurse -Force "$out\export" -ErrorAction SilentlyContinue
& $e window --export "$out\export" | Out-Null
Copy-Item (Join-Path $here "shot.js"), (Join-Path $here "ask.html") "$out\export\"
$index = "$out\export\index.html"
$html = [IO.File]::ReadAllText($index)
[IO.File]::WriteAllText($index, $html.Replace("</body>", "<script src=""shot.js""></script></body>"), (New-Object Text.UTF8Encoding($false)))
# Nothing of the real setup may reach the shots: words that only real data holds (your name, clients,
# your data folder's path), one regex per line, in leak-patterns.txt beside this script — kept out of
# git (.gitignore), so the check never publishes what it looks for.
$patterns = Join-Path $here "leak-patterns.txt"
if (Test-Path $patterns) {
    $words = @(Get-Content $patterns | Where-Object { $_.Trim() -and -not $_.StartsWith("#") })
    if ($words) {
        $leak = Select-String -Path (Get-ChildItem "$out\export" -Recurse -File).FullName -Pattern $words -List
        if ($leak) { $leak | ForEach-Object { Write-Warning "real data in $($_.Path)" }; throw "the export holds real data" }
    }
} else { Write-Warning "no leak-patterns.txt: the export was not checked for real data" }
Write-Output "$out\export"
