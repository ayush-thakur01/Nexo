Write-Host "=== Testing Windows APIs ==="

# Test 1: Volume via Core Audio COM
try {
    $devices = New-Object -ComObject "MMDeviceEnumerator.MMDeviceEnumerator" 2>$null
    if ($devices) {
        $device = $devices.GetDefaultAudioEndpoint(0, 1)
        if ($device) {
            $vol = $device.AudioEndpointVolume.MasterVolumeLevelScalar
            $muted = $device.AudioEndpointVolume.Mute
            Write-Host "VOLUME: level=$vol muted=$muted"
        } else { Write-Host "VOLUME: no default endpoint" }
    } else { Write-Host "VOLUME: MMDeviceEnumerator not available" }
} catch { Write-Host "VOLUME ERROR: " + $_.Exception.Message }

# Test 2: WinRT Media GSMTC
try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction SilentlyContinue
    $manager = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
    if ($manager) {
        $sessions = $manager.GetSessions()
        Write-Host "MEDIA: $($sessions.Count) active sessions"
        if ($sessions.Count -gt 0) {
            $props = $sessions[0].TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
            Write-Host "MEDIA: title='$($props.Title)' artist='$($props.Artist)'"
        }
    } else { Write-Host "MEDIA: manager not available" }
} catch { Write-Host "MEDIA ERROR: " + $_.Exception.Message }

# Test 3: Battery via WMI
try {
    $battery = Get-WmiObject -Class Win32_Battery -ErrorAction SilentlyContinue
    if ($battery) {
        Write-Host "BATTERY: level=$($battery.EstimatedChargeRemaining)% status=$($battery.BatteryStatus)"
    } else { Write-Host "BATTERY: no battery found" }
} catch { Write-Host "BATTERY ERROR: " + $_.Exception.Message }

# Test 4: Network adapters
try {
    $adapters = Get-WmiObject -Class Win32_NetworkAdapter | Where-Object { $_.NetEnabled -eq $true }
    Write-Host "NETWORK: $($adapters.Count) enabled adapters"
    foreach ($ad in $adapters) {
        $pnpClass = if ($ad.PNPClass) { $ad.PNPClass } else { "unknown" }
        Write-Host "  - $($ad.Name) [$pnpClass]"
    }
} catch { Write-Host "NETWORK ERROR: " + $_.Exception.Message }

# Test 5: Audio devices for mic
try {
    $audDevices = Get-WmiObject -Class Win32_PnPEntity | Where-Object { $_.PNPClass -eq "Camera" -or $_.PNPClass -eq "AudioEndpoint" } | Select-Object Name, PNPClass, Status
    Write-Host "DEVICES: $($audDevices.Count) audio/camera devices"
    foreach ($d in $audDevices) {
        Write-Host "  - $($d.Name) [$($d.PNPClass)] status=$($d.Status)"
    }
} catch { Write-Host "DEVICES ERROR: " + $_.Exception.Message }

Write-Host "=== Done ==="
