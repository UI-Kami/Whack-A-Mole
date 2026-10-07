# scratch/update_bg_b64.ps1
$src = "assets\BG_NEW\Background_Seamless_Grid.jpg"
$dst = "assets\BG_NEW\Background_Seamless.jpg"
Copy-Item $src $dst -Force

$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path $dst))
$b64 = "data:image/jpeg;base64," + [Convert]::ToBase64String($bytes)

$jsonPath = Resolve-Path "assets\clean_sprites\assets_base64.json"
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json
$json.bg = $b64
$updatedJson = $json | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($jsonPath, $updatedJson, [System.Text.UTF8Encoding]::new($false))
Write-Output "Successfully updated assets_base64.json with Background_Seamless.jpg ($($bytes.Length) bytes)"
