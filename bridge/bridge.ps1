$ErrorActionPreference = 'SilentlyContinue'

function Write-Event($channel, $data) {
    $msg = @{ type = "event"; channel = $channel; data = $data } | ConvertTo-Json -Compress -Depth 8
    try { [Console]::Out.WriteLine($msg) } catch {}
}
function Write-Log($tag, $m) { try { [Console]::Error.WriteLine("[$tag] $m") } catch {} }
function Write-Error($m) { $msg = @{ type = "error"; message = $m } | ConvertTo-Json -Compress; try { [Console]::Out.WriteLine($msg) } catch {} }
function Write-Ready { $msg = @{ type = "ready" } | ConvertTo-Json -Compress; try { [Console]::Out.WriteLine($msg) } catch {} }

# ==============================
# VOLUME - Master volume via Core Audio (IAudioEndpointVolume)
# ==============================
$volCode = @"
using System;
using System.Runtime.InteropServices;
namespace VolNative {
    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")] public class MMDeviceEnumerator { }
    [ComImport, Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDeviceEnumerator {
        int EnumAudioEndpoints(int dataFlow, int stateMask, out IntPtr devices);
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endPoint);
    }
[ComImport, Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IMMDevice {
        int Activate(ref Guid iid, int clsCtx, IntPtr activationParams, [MarshalAs(UnmanagedType.IUnknown)] out object instance);
        int OpenPropertyStore(int access, out IntPtr props);
        int GetId([MarshalAs(UnmanagedType.LPWStr)] out string id);
        int GetState(out int state);
    }
    [ComImport, Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    public interface IAudioEndpointVolume {
        int RegisterControlChangeNotify(IntPtr p);
        int UnregisterControlChangeNotify(IntPtr p);
        int GetChannelCount(out uint count);
        int SetMasterVolumeLevel(float level, ref Guid ctx);
        int SetMasterVolumeLevelScalar(float level, ref Guid ctx);
        int GetMasterVolumeLevel(out float level);
        int GetMasterVolumeLevelScalar(out float level);
        int SetChannelVolumeLevel(uint channel, float level, ref Guid ctx);
        int SetChannelVolumeLevelScalar(uint channel, float level, ref Guid ctx);
        int GetChannelVolumeLevel(uint channel, out float level);
        int GetChannelVolumeLevelScalar(out uint channel, out float level);
        int SetMute(bool mute, ref Guid ctx);
        int GetMute(out bool mute);
        int GetVolumeStepInfo(out uint step, out uint stepCount);
        int VolumeStepUp(ref Guid ctx);
        int VolumeStepDown(ref Guid ctx);
        int QueryHardwareSupport(out uint mask);
        int GetVolumeRange(out float min, out float max, out float increment);
    }
public static class MasterVolume {
        private static IAudioEndpointVolume Endpoint() {
            var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumerator();
            IMMDevice dev;
            int hr = enumerator.GetDefaultAudioEndpoint(0, 1, out dev);
            if (hr != 0) throw new Exception("GetDefaultAudioEndpoint failed: " + hr);
            object o;
            Guid iid = new Guid("5CDF2C82-841E-4546-9722-0CF74078229A");
            hr = dev.Activate(ref iid, 1, IntPtr.Zero, out o);
            if (hr != 0) throw new Exception("Activate failed: " + hr);
            return (IAudioEndpointVolume)o;
        }
        public static float GetLevel() { float f; Endpoint().GetMasterVolumeLevelScalar(out f); return f; }
        public static bool GetMute() { bool m; Endpoint().GetMute(out m); return m; }
        public static void SetLevel(float f) { Guid g = Guid.Empty; Endpoint().SetMasterVolumeLevelScalar(Math.Max(0f, Math.Min(1f, f)), ref g); }
        public static void SetMute(bool m) { Guid g = Guid.Empty; Endpoint().SetMute(m, ref g); }
    }
}
"@
Add-Type -TypeDefinition $volCode -ErrorAction SilentlyContinue

$waveCode = @"
using System;
using System.Runtime.InteropServices;
public class AudioVolFallback {
    [DllImport("winmm.dll")] public static extern int waveOutGetVolume(IntPtr hwo, out uint dwVolume);
    [DllImport("winmm.dll")] public static extern int waveOutSetVolume(IntPtr hwo, uint dwVolume);
    public static float GetVolume() {
        uint vol; waveOutGetVolume(IntPtr.Zero, out vol);
        uint left = vol & 0xFFFF; uint right = (vol >> 16) & 0xFFFF;
        return (left + right) / 2f / 65535f;
    }
    public static void SetVolume(float level) {
        uint v = (uint)(Math.Max(0, Math.Min(1, level)) * 65535);
        uint combined = (v & 0xFFFF) | ((v & 0xFFFF) << 16);
        waveOutSetVolume(IntPtr.Zero, combined);
    }
}
"@
Add-Type -TypeDefinition $waveCode -ErrorAction SilentlyContinue

$script:useMasterVolume = $false
try { $null = [VolNative.MasterVolume]::GetLevel(); $script:useMasterVolume = $true } catch {}

$script:lastVolumeRounded = -1
$script:lastMuted = $null
$script:lastVolumeBeforeMute = -1

$script:lastPingCheckedAt = 0
$script:lastPingTime = -1
$script:lastSystemStatsCheckedAt = 0

function Update-Volume {
    try {
        if ($script:useMasterVolume) {
            $muted = [VolNative.MasterVolume]::GetMute()
            $vol = [Math]::Round([VolNative.MasterVolume]::GetLevel(), 2)
            if ($vol -ne $script:lastVolumeRounded -or $muted -ne $script:lastMuted) {
                if (-not $muted -and $vol -gt 0.02) { $script:lastVolumeBeforeMute = $vol }
                $script:lastVolumeRounded = $vol; $script:lastMuted = $muted
                Write-Event "volume:changed" @{ level = $vol; muted = $muted; previousLevel = $script:lastVolumeBeforeMute }
            }
        } else {
            $vol = [Math]::Round([AudioVolFallback]::GetVolume(), 2)
            if ($vol -ne $script:lastVolumeRounded) {
                $script:lastVolumeRounded = $vol; $script:lastMuted = ($vol -eq 0)
                Write-Event "volume:changed" @{ level = $vol; muted = ($vol -eq 0); previousLevel = $vol }
            }
        }
    } catch {}
}

function Set-Volume($level) {
    try {
        if ($script:useMasterVolume) {
            [VolNative.MasterVolume]::SetLevel([float]$level)
            [VolNative.MasterVolume]::SetMute([bool]([float]$level -eq 0))
        } else { [AudioVolFallback]::SetVolume([float]$level) }
    } catch {}
    Start-Sleep -Milliseconds 100; Update-Volume
}

function Toggle-Mute {
    try {
        if ($script:useMasterVolume) {
            $currentMute = [VolNative.MasterVolume]::GetMute()
            if ($currentMute) {
                $restore = if ($script:lastVolumeBeforeMute -ge 0.05) { $script:lastVolumeBeforeMute } else { 0.5 }
                [VolNative.MasterVolume]::SetMute($false)
                [VolNative.MasterVolume]::SetLevel([float]$restore)
            } else {
                $script:lastVolumeBeforeMute = [VolNative.MasterVolume]::GetLevel()
                [VolNative.MasterVolume]::SetMute($true)
            }
        } else {
            $current = [AudioVolFallback]::GetVolume()
            if ($current -eq 0) { [AudioVolFallback]::SetVolume(0.5) } else { [AudioVolFallback]::SetVolume(0) }
        }
    } catch {}
    Start-Sleep -Milliseconds 100; Update-Volume
}

# ==============================
# MEDIA - Windows Global System Media Transport Controls (SMTC)
# ==============================
$script:smtcLoaded = $false
try {
    [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows.Media.Control, ContentType = WindowsRuntime] | Out-Null
    $script:smtcLoaded = $true
} catch {}

$mediaCode = @"
using System;
using System.Runtime.InteropServices;
public class MediaWin {
    [DllImport("user32.dll")] public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);
public const byte VK_MEDIA_PLAY_PAUSE = 0xB3;
    public const byte VK_MEDIA_NEXT_TRACK = 0xB0;
    public const byte VK_MEDIA_PREV_TRACK = 0xB1;
    public const byte VK_MEDIA_STOP = 0xB2;
    public static void SendPlayPause() { keybd_event(VK_MEDIA_PLAY_PAUSE, 0, 0, UIntPtr.Zero); }
    public static void SendNext() { keybd_event(VK_MEDIA_NEXT_TRACK, 0, 0, UIntPtr.Zero); }
    public static void SendPrev() { keybd_event(VK_MEDIA_PREV_TRACK, 0, 0, UIntPtr.Zero); }
    public static void SendStop() { keybd_event(VK_MEDIA_STOP, 0, 0, UIntPtr.Zero); }
}
"@
Add-Type -TypeDefinition $mediaCode -ErrorAction SilentlyContinue

$script:artworkCache = @{}
$script:artworkOrder = [System.Collections.Generic.List[object]]::new()

function Get-SmtcMedia {
    try {
        if (-not $script:smtcLoaded) { return $null }
        $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
        if ($null -eq $mgr) { return $null }
        $sess = $mgr.GetCurrentSession()
        if ($null -eq $sess) { return $null }
        $props = $sess.TryGetMediaPropertiesAsync().GetAwaiter().GetResult()
        $status = $sess.GetPlaybackInfo().PlaybackStatus.ToString().ToLower()
        $tl = $sess.GetTimelineProperties()
        $state = if ($status -eq "paused") { "paused" } elseif ($status -eq "stopped") { "stopped" } elseif ($status -eq "changing") { "loading" } else { "playing" }
        $title = if ($props.Title) { $props.Title.ToString() } else { "" }
        $artist = if ($props.Artist) { $props.Artist.ToString() } else { "" }
        $album = if ($props.AlbumTitle) { $props.AlbumTitle.ToString() } else { "" }
        if ([string]::IsNullOrWhiteSpace($title)) { return $null }
        $endSec = 0.0; $posSec = 0.0
        try { $endSec = $tl.EndTime.TotalSeconds } catch {}
        try { $posSec = $tl.Position.TotalSeconds } catch {}

        # Cache artwork keyed by track identity so the (expensive) thumbnail
        # stream is only decoded once per track, never on the position heartbeat.
        $artKey = "$title|$artist|$album"
        $artwork = $script:artworkCache[$artKey]
        if ($null -eq $artwork -and $props.Thumbnail) {
            try {
                $stream = $props.Thumbnail.OpenReadAsync().GetAwaiter().GetResult()
                if ($stream) {
                    $reader = New-Object Windows.Storage.Streams.DataReader($stream)
                    $size = $stream.Size
                    if ($size -gt 0 -and $size -lt 5MB) {
                        $null = $reader.LoadAsync($size).GetAwaiter().GetResult()
                        $bytes = [byte[]]::CreateInstance([byte], $size)
                        $reader.ReadBytes($bytes)
                        $base64 = [Convert]::ToBase64String($bytes)
                        $artwork = "data:image/jpeg;base64,$base64"
                    }
                }
            } catch {}
            if (-not $artwork) { $artwork = "" }
            $script:artworkCache[$artKey] = $artwork
            $script:artworkOrder.Add($artKey)
            if ($script:artworkOrder.Count -gt 16) {
                $evict = $script:artworkOrder[0]
                $script:artworkOrder.RemoveAt(0)
                $script:artworkCache.Remove($evict)
            }
        }
        if ($null -eq $artwork) { $artwork = "" }

        return @{
            title = $title; artist = $artist; album = $album; artwork = $artwork
            state = $state
            duration = [int]$endSec; position = [int]$posSec; playbackRate = [double]1.0
            source = $sess.SourceAppUserModelId
        }
    } catch { return $null }
}

function Media-Stop {
    try {
        if ($script:smtcLoaded) {
            $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
            $sess = $mgr.GetCurrentSession()
            if ($sess) {
                $res = $sess.TryStopAsync().GetAwaiter().GetResult()
                if ($res.Status.ToString() -eq "Success") { return }
            }
        }
    } catch {}
    try { [MediaWin]::SendStop() } catch {}
}

function Media-PlayPause {
    try {
        if ($script:smtcLoaded) {
            $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
            $sess = $mgr.GetCurrentSession()
            if ($sess) { $sess.TryTogglePlayPauseAsync().GetAwaiter().GetResult() | Out-Null; return }
        }
    } catch {}
    try { [MediaWin]::SendPlayPause() } catch {}
}
function Media-Next {
    try {
        if ($script:smtcLoaded) {
            $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
            $sess = $mgr.GetCurrentSession()
            if ($sess) { $sess.TrySkipNextAsync().GetAwaiter().GetResult() | Out-Null; return }
        }
    } catch {}
    try { [MediaWin]::SendNext() } catch {}
}
function Media-Previous {
    try {
        if ($script:smtcLoaded) {
            $mgr = [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager]::RequestAsync().GetAwaiter().GetResult()
            $sess = $mgr.GetCurrentSession()
            if ($sess) { $sess.TrySkipPreviousAsync().GetAwaiter().GetResult() | Out-Null; return }
        }
    } catch {}
    try { [MediaWin]::SendPrev() } catch {}
}

$script:lastMediaData = $null
$script:mediaClearCount = 0

# SAFE MUSIC ALLOWLIST (spec Â§5): only genuine music players may surface as
# media. Browser/Chromium video sessions (YouTube, Netflix, Instagram, ...) are
# deliberately excluded. If a Windows media session can't be proven to be a
# music app, we treat it as browser media and ignore it.
$script:MUSIC_SOURCES = @(
    "spotify", "music.ui", "windowsmediaplayer", "wmplayer", "vlc",
    "groove", "zune", "apple", "mediaplayer", "foobar", "audirvana",
    "deezer", "tidal", "amazonmusic", "pandora", "iheartradio"
)
$script:BROWSER_SOURCES = @(
    "chrome", "msedge", "edge", "brave", "firefox", "opera", "vivaldi",
    "arc", "360se"
)

function Test-IsMusicSource($source) {
    if ([string]::IsNullOrWhiteSpace($source)) { return $true } # unknown -> allow
    $s = $source.ToLower()
    foreach ($m in $script:MUSIC_SOURCES) {
        if ($s -match [regex]::Escape($m)) { return $true }
    }
    foreach ($b in $script:BROWSER_SOURCES) {
        if ($s -match [regex]::Escape($b)) { return $false }
    }
    # Neutral apps without an explicit mapping: allow only when they expose a
    # full media session (SMTC) rather than a bare browser tab.
    return $true
}

$script:lastLoggedMediaSource = $null

function Update-Media {
    try {
        $data = Get-SmtcMedia
        if ($data) {
            $source = "$($data.source)"
            if (-not (Test-IsMusicSource $source)) { $data = $null }
        }
        if (-not $data) {
            # Fallback: legacy window-title detection for DEDICATED music apps
            # only. Browsers are excluded so YouTube/Netflix never show as music.
            $players = @("Spotify", "wmplayer", "Music", "vlc", "Groove Music")
            foreach ($p in (Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne "" -and $_.ProcessName -in $players })) {
                $t = $p.MainWindowTitle
                if ($t -match "(.+) - (.+)") { $m = $matches
                    $data = @{ title = $m[2].Trim(); artist = $m[1].Trim(); album = ""; artwork = ""
                        state = "playing"; duration = 0; position = 0; playbackRate = 1; source = $p.ProcessName }
                    break
                }
            }
        }

        if ($data -eq $null -and $script:lastMediaData -ne $null) {
            $script:mediaClearCount++
            if ($script:mediaClearCount -ge 3) {
                Write-Log "MEDIA" "Session ended ($($script:lastMediaData.source))"
                Write-Event "media:changed" $null
                $script:lastMediaData = $null
                $script:mediaClearCount = 0
            }
        } else {
            $script:mediaClearCount = 0
            $json1 = if ($data) { $data | ConvertTo-Json -Compress -Depth 5 } else { $null }
            $json2 = if ($script:lastMediaData) { $script:lastMediaData | ConvertTo-Json -Compress -Depth 5 } else { $null }
            if ($json1 -ne $json2) {
                $src = if ($data) { "$($data.source)" } else { "" }
                if ($data -and $src -ne $script:lastLoggedMediaSource -and $data.title) {
                    Write-Log "MEDIA" "Session detected: $($data.title) [$src]"
                    $script:lastLoggedMediaSource = $src
                }
                $script:lastMediaData = $data
                Write-Event "media:changed" $data
            }
        }
    } catch {}
}

# ==============================
# NOTIFICATIONS via UserNotificationListener
# ==============================
$lastNotifIds = @{}
$notifAvailable = $false
try {
    $null = [Windows.UI.Notifications.Management.UserNotificationListener,Windows.UI.Notifications.Management,ContentType=WindowsRuntime]
    $notifAvailable = $true
} catch {}

function Update-Notifications {
    if (-not $script:notifAvailable) { return }
    try {
        $listener = [Windows.UI.Notifications.Management.UserNotificationListener]::Current
        if ($listener) {
            $notifs = $listener.GetNotificationsAsync([Windows.UI.Notifications.NotificationKinds]::Toast).GetAwaiter().GetResult()
            $seen = @{}
            foreach ($n in $notifs) {
                $seen[$n.Id] = $true
                if (-not $script:lastNotifIds.ContainsKey($n.Id)) {
                    $appInfo = $n.AppInfo
                    $visual = $n.Notification.Visual
                    $texts = @()
                    try {
                        $bindings = $visual.GetBindings()
                        if ($bindings) { foreach ($b in $bindings) { $items = $b.GetTextElements(); if ($items) { foreach ($t in $items) { $texts += $t.Text } } } }
                    } catch {}
                    Write-Event "notification:received" @{
                        id = "$($n.Id)"
                        appName = if ($appInfo.DisplayInfo.DisplayName) { $appInfo.DisplayInfo.DisplayName } else { "" }
                        title = if ($texts.Length -gt 0) { $texts[0] } else { "" }
                        body = if ($texts.Length -gt 1) { $texts[1] } else { "" }
                        timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
                    }
                }
            }
            $removeKeys = @(); foreach ($k in $script:lastNotifIds.Keys) { if (-not $seen.ContainsKey($k)) { $removeKeys += $k } }
            foreach ($k in $removeKeys) { $script:lastNotifIds.Remove($k) }
            $script:lastNotifIds = $seen
        }
    } catch {}
}

# ==============================
# BATTERY via WMI
# ==============================
$lastBatteryLevel = -1
$lastCharging = $null
$lastBatteryTime = -1

function Update-Battery {
    try {
        $b = Get-WmiObject -Class Win32_Battery -ErrorAction SilentlyContinue
        if ($b) {
            $level = $b.EstimatedChargeRemaining
            $charging = ($b.BatteryStatus -eq 2 -or $b.BatteryStatus -eq 6)
            $minutes = -1
            try { $minutes = [int]$b.EstimatedRunTime } catch {}
            if ($minutes -lt 0 -or $minutes -gt 525600) { $minutes = -1 }
            if ($level -ne $script:lastBatteryLevel -or $charging -ne $script:lastCharging -or $minutes -ne $script:lastBatteryTime) {
                $script:lastBatteryLevel = $level; $script:lastCharging = $charging; $script:lastBatteryTime = $minutes
                $status = if ($b.BatteryStatus -eq 3) { "full" } elseif ($charging) { "charging" } else { "discharging" }
                Write-Event "battery:changed" @{ level = $level; charging = $charging; status = $status; minutesRemaining = $minutes }
            }
        }
    } catch {}
}

# ==============================
# DEVICES (Mic/Camera) via Registry Active Status
# ==============================
function Get-MicActive {
    try {
        $regPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\microphone"
        if (Test-Path $regPath) {
            $subkeys = Get-ChildItem $regPath -ErrorAction SilentlyContinue
            foreach ($key in $subkeys) {
                $stopTime = (Get-ItemProperty $key.PsPath -ErrorAction SilentlyContinue).LastUsedTimeStop
                if ($null -ne $stopTime -and $stopTime -eq 0) { return $true }
                if ($key.Name -match "NonPackaged") {
                    $desktopKeys = Get-ChildItem $key.PsPath -ErrorAction SilentlyContinue
                    foreach ($dkey in $desktopKeys) {
                        $dstop = (Get-ItemProperty $dkey.PsPath -ErrorAction SilentlyContinue).LastUsedTimeStop
                        if ($null -ne $dstop -and $dstop -eq 0) { return $true }
                    }
                }
            }
        }
    } catch {}
    return $false
}

function Get-CameraActive {
    try {
        $regPath = "HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\CapabilityAccessManager\ConsentStore\webcam"
        if (Test-Path $regPath) {
            $subkeys = Get-ChildItem $regPath -ErrorAction SilentlyContinue
            foreach ($key in $subkeys) {
                $stopTime = (Get-ItemProperty $key.PsPath -ErrorAction SilentlyContinue).LastUsedTimeStop
                if ($null -ne $stopTime -and $stopTime -eq 0) { return $true }
                if ($key.Name -match "NonPackaged") {
                    $desktopKeys = Get-ChildItem $key.PsPath -ErrorAction SilentlyContinue
                    foreach ($dkey in $desktopKeys) {
                        $dstop = (Get-ItemProperty $dkey.PsPath -ErrorAction SilentlyContinue).LastUsedTimeStop
                        if ($null -ne $dstop -and $dstop -eq 0) { return $true }
                    }
                }
            }
        }
    } catch {}
    return $false
}

$lastMic = $null; $lastCam = $null

function Update-Devices {
    try {
        $mic = Get-MicActive
        $cam = Get-CameraActive
        if ($mic -ne $script:lastMic -or $cam -ne $script:lastCam) {
            $script:lastMic = $mic; $script:lastCam = $cam
            Write-Event "devices:changed" @{ micActive = $mic; cameraActive = $cam }
        }
    } catch {}
}

# ==============================
# NETWORK via WMI
# ==============================
$lastNetwork = $null

function Update-Network {
    $net = @{ wifiConnected = $false; wifiSSID = ""; wifiSignal = 0; wifiEnabled = $false; bluetooth = $false; bluetoothEnabled = $false; airplaneMode = $false; vpnConnected = $false; internetAvailable = $false; connectionType = "none"; ipv4 = ""; ipv6 = ""; latencyMs = -1 }
    try {
        $adapters = Get-WmiObject -Class Win32_NetworkAdapter | Where-Object { $_.NetEnabled -eq $true }
        foreach ($ad in $adapters) {
            $name = "$($ad.Name)"; $desc = "$($ad.Description)"
            if ($name -match "Wi-Fi|Wireless|802\.11|WLAN") { $net.wifiConnected = $true; $net.wifiEnabled = $true; $net.wifiSSID = if ($ad.NetConnectionID) { $ad.NetConnectionID } else { "" }; $net.connectionType = "wifi" }
            elseif ($name -match "Ethernet|Gigabit|Local Area") { $net.connectionType = "ethernet"; $net.wifiConnected = $true }
            if ($name -match "Bluetooth") { $net.bluetooth = $true; $net.bluetoothEnabled = $true }
            if ($name -match "VPN|Virtual" -or $desc -match "VPN") { $net.vpnConnected = $true; $net.connectionType = "vpn" }
        }
        Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "Wi-Fi|Wireless|802\.11|WLAN" } | ForEach-Object {
            $net.wifiEnabled = ($_.Status -eq "Up")
        }
        try {
            Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "Bluetooth" } | ForEach-Object {
                $net.bluetoothEnabled = ($_.MediaConnectionState -eq "Connected" -and $_.Status -eq "Up")
            }
        } catch {}
    } catch {}

    # Get active adapter IPs
    try {
        $active = Get-ActiveAdapter
        if ($active) {
            $net.ipv4 = (Get-NetIPAddress -InterfaceIndex $active.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPAddress -First 1)
            $net.ipv6 = (Get-NetIPAddress -InterfaceIndex $active.InterfaceIndex -AddressFamily IPv6 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike "fe80*" } | Select-Object -ExpandProperty IPAddress -First 1)
        }
    } catch {}

    # Check latency
    $now = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    if ($now - $script:lastPingCheckedAt -ge 5000) {
        $script:lastPingCheckedAt = $now
        try {
            $ping = Test-Connection -ComputerName 8.8.8.8 -Count 1 -TimeoutSeconds 1 -ErrorAction SilentlyContinue
            if ($ping) { $script:lastPingTime = $ping.ResponseTime } else { $script:lastPingTime = -1 }
        } catch {
            $script:lastPingTime = -1
        }
    }
    $net.latencyMs = $script:lastPingTime
    $net.internetAvailable = ($script:lastPingTime -ge 0)

    try { $net.airplaneMode = (((Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\RadioManagement\SystemRadioState" -ErrorAction SilentlyContinue)."0") -eq 0) } catch {}

    $json = $net | ConvertTo-Json -Compress
    if ($json -ne ($script:lastNetwork | ConvertTo-Json -Compress)) {
        Write-Event "network:changed" $net; $script:lastNetwork = $net
    }
}

# ==============================
# AIRPLANE MODE via System Radio State
# ==============================
function Set-AirplaneMode($enable) {
    if (-not $script:isAdmin) {
        Write-Event "network:changed" @{ error = "Administrator privileges are required for this operation." }
        return
    }
    try {
        $state = if ($enable) { 1 } else { 0 }
        # System-wide radio state (HKLM -> requires administrator).
        Set-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\RadioManagement\SystemRadioState" -Name "0" -Value $state -ErrorAction Stop
        # Also flip each physical adapter's software radio state.
        Get-NetAdapter -Physical -ErrorAction SilentlyContinue | ForEach-Object {
            try { $_ | Set-NetAdapter -RadioState ([bool](-not $enable)) -ErrorAction SilentlyContinue } catch {}
        }
        Start-Sleep -Milliseconds 600
        Update-Network
    } catch {
        Write-Event "network:changed" @{ error = "Administrator privileges are required for this operation." }
    }
}

# ==============================
# NETWORK SPEEDS via Win32_PerfRawData_Tcpip_NetworkInterface
# Real bytes/sec on the active interface (down + up).
# ==============================
$script:lastSpeedSample = $null
$script:lastSpeedAt = 0
$script:lastSpeedEmit = 0
$script:lastDownBps = 0
$script:lastUpBps = 0
$script:activeAdapter = $null

function Get-ActiveAdapter {
    if ($script:activeAdapter -and $script:activeAdapter.IPv4Address) { return $script:activeAdapter }
    try {
        $a = Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Up" } | Select-Object -First 1
        if ($a) {
            $ip = Get-NetIPAddress -InterfaceAlias $a.Name -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -and $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1
            if ($ip) { $script:activeAdapter = [pscustomobject]@{ Name = $a.Name; InterfaceIndex = $a.ifIndex; IPv4Address = $ip.IPAddress; InterfaceDescription = $a.InterfaceDescription }; return $script:activeAdapter }
        }
    } catch {}
    return $null
}

function Get-AdapterBytes {
    $adapter = Get-ActiveAdapter
    if (-not $adapter) { return $null }
    $name = $adapter.InterfaceDescription
    if (-not $name) { $name = $adapter.Name }
    $rec = $null
    foreach ($candidate in (Get-WmiObject -Class Win32_PerfRawData_Tcpip_NetworkInterface -ErrorAction SilentlyContinue)) {
        if ($candidate.Name -eq $name) { $rec = $candidate; break }
    }
    if (-not $rec) { return $null }
    [int64]$downTotal = 0; [int64]$upTotal = 0
    try { $downTotal = [int64]$rec.BytesReceivedPersec } catch {}
    try { $upTotal   = [int64]$rec.BytesSentPersec } catch {}
    
    [int64]$totalDownBytes = 0; [int64]$totalUpBytes = 0
    try {
        $stats = Get-NetAdapterStatistics -Name $adapter.Name -ErrorAction SilentlyContinue
        if ($stats) {
            $totalDownBytes = [int64]$stats.ReceivedBytes
            $totalUpBytes = [int64]$stats.SentBytes
        }
    } catch {}

    return @{ 
        name = $adapter.Name; ipv4 = $adapter.IPv4Address; description = $adapter.InterfaceDescription
        downTotal = $downTotal; upTotal = $upTotal
        totalDownBytes = $totalDownBytes; totalUpBytes = $totalUpBytes
    }
}

function Update-NetworkSpeed {
    $now = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    $sample = Get-AdapterBytes
    if (-not $sample) { return }
    if ($script:lastSpeedSample -ne $null -and $script:lastSpeedAt -gt 0) {
        $dt = ($now - $script:lastSpeedAt) / 1000.0
        if ($dt -gt 0.05) {
            $downDelta = [int64]$sample.downTotal - [int64]$script:lastSpeedSample.downTotal
            $upDelta   = [int64]$sample.upTotal   - [int64]$script:lastSpeedSample.upTotal
            if ($downDelta -lt 0) { $downDelta = 0 }
            if ($upDelta   -lt 0) { $upDelta   = 0 }
            $downBps = [int64]([math]::Round($downDelta / $dt))
            $upBps   = [int64]([math]::Round($upDelta   / $dt))
            if ($now - $script:lastSpeedEmit -ge 950 -or [math]::Abs($downBps - $script:lastDownBps) -gt 4096 -or [math]::Abs($upBps - $script:lastUpBps) -gt 4096) {
                $script:lastSpeedEmit = $now
                $script:lastDownBps = $downBps; $script:lastUpBps = $upBps
                Write-Event "network:speed" @{
                    downBps = $downBps
                    upBps   = $upBps
                    adapter = $sample.name
                    ipv4    = $sample.ipv4
                    totalDownBytes = $sample.totalDownBytes
                    totalUpBytes = $sample.totalUpBytes
                }
            }
        }
    }
    $script:lastSpeedSample = $sample
    $script:lastSpeedAt = $now
}

# ==============================
# SYSTEM HEALTH - CPU, RAM, Disk, Uptime
# ==============================
$script:lastCpuPct = -1
$script:lastMemUsedPct = -1
$script:lastMemUsedGB = -1
$script:lastMemTotalGB = -1
$script:lastDiskFreeGB = -1
$script:lastDiskTotalGB = -1
$script:lastDiskPct = -1
$script:lastUptimeMin = -1
$script:lastHealthEmit = 0
$script:lastGpuPct = -1
$script:lastBatteryPercent = -1
$script:lastBatteryHealth = -1

function Update-SystemHealth {
    $now = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
    $gpuPct = Get-GPUUtilization
    $batInfo = Get-BatteryInfo
    $cpuSample = Get-Counter "\\Processor(_Total)\% Processor Time" -SampleInterval 1 -ErrorAction SilentlyContinue
    $cpu = if ($cpuSample -and $cpuSample.CounterSamples) { [double]$cpuSample.CounterSamples[0].CookedValue } else { 0 }
    $os = Get-CimInstance Win32_OperatingSystem
    $total = [double]$os.TotalVisibleMemorySize
    $free  = [double]$os.FreePhysicalMemory
    $memPct = if ($total -gt 0) { [int][math]::Round((($total - $free) / $total) * 100) } else { 0 }
    $disk = Get-PSDrive C -ErrorAction SilentlyContinue
    $diskUsedBytes = 0; $diskFreeBytes = 0
    if ($disk) { $diskUsedBytes = [double]$disk.Used; $diskFreeBytes = [double]$disk.Free }
    $diskTotalBytes = $diskUsedBytes + $diskFreeBytes
    $diskPct = if ($diskTotalBytes -gt 0) { [int][math]::Round(($diskUsedBytes / $diskTotalBytes) * 100) } else { 0 }
    $diskFreeGB = [math]::Round($diskFreeBytes / 1GB, 1)
    $diskTotalGB = [math]::Round($diskTotalBytes / 1GB, 1)
    $uptime = [int][math]::Round(((New-TimeSpan -Start $os.LastBootUpTime -End (Get-Date)).TotalMinutes))

    $changed = $false
    if ([math]::Abs($cpu - $script:lastCpuPct) -ge 1) { $changed = $true }
    if ($memPct -ne $script:lastMemUsedPct) { $changed = $true }
    if ([math]::Abs($diskPct - $script:lastDiskPct) -ge 1) { $changed = $true }
    if ($uptime -ne $script:lastUptimeMin) { $changed = $true }
    if ($gpuPct -ne $script:lastGpuPct) { $changed = $true }
    if ($batInfo.charge -ne $script:lastBatteryPercent) { $changed = $true }
    if ($batInfo.health -ne $script:lastBatteryHealth) { $changed = $true }

    if ($changed -or ($now - $script:lastHealthEmit -ge 4000)) {
        $script:lastCpuPct = [int][math]::Round($cpu)
        $script:lastMemUsedPct = $memPct
        $script:lastMemUsedGB = [math]::Round(($total - $free) / 1MB, 1)
        $script:lastMemTotalGB = [math]::Round($total / 1MB, 1)
        $script:lastDiskFreeGB = $diskFreeGB
        $script:lastDiskTotalGB = $diskTotalGB
        $script:lastDiskPct = $diskPct
        $script:lastUptimeMin = $uptime
        $script:lastHealthEmit = $now
        $script:lastGpuPct = $gpuPct
        $script:lastBatteryPercent = $batInfo.charge
        $script:lastBatteryHealth = $batInfo.health
        Write-Event "system:health" @{
            cpuPercent    = $script:lastCpuPct
            memPercent    = $memPct
            memUsedGB     = $script:lastMemUsedGB
            memTotalGB    = $script:lastMemTotalGB
            diskFreeGB    = $diskFreeGB
            diskTotalGB   = $diskTotalGB
            diskPercent   = $diskPct
            uptimeMinutes = $uptime
            gpuPercent    = $gpuPct
            batteryPercent = $batInfo.charge
            batteryHealth  = $batInfo.health
        }
    }
}
function Get-GPUUtilization {
    try {
        $counters = Get-Counter "\\GPU Engine(*)\\Utilization Percentage" -ErrorAction SilentlyContinue
        if ($counters.CounterSamples) {
            $total = 0; $count = 0
            foreach ($sample in $counters.CounterSamples) {
                $total += [double]$sample.CookedValue
                $count++
            }
            if ($count -gt 0) {
                return [int][math]::Round($total / $count)
            }
        }
    } catch {}
    return $null
}

function Get-BatteryInfo {
    $b = Get-WmiObject Win32_Battery -ErrorAction SilentlyContinue
    if (-not $b) { return $null }
    $charge = $b.EstimatedChargeRemaining
    $design = $b.DesignCapacity
    $full = $b.FullChargeCapacity
    $health = $null
    if ($design -and $full) {
        $health = [int][math]::Round(($full / $design) * 100)
    }
    return @{ charge = $charge; health = $health }
}

# ==============================
# SYSTEM CAPABILITIES
# ==============================
$script:capabilities = $null
$script:isAdmin = $false
$script:radioLoaded = $false

function Test-IsAdmin {
    try {
        $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object Security.Principal.WindowsPrincipal($identity)
        return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch { return $false }
}

function Update-Capabilities {
    $script:isAdmin = Test-IsAdmin
    $brightnessOk = $false
    try { $brightnessOk = (Get-WmiObject -Namespace root\WMI -Class WmiMonitorBrightness -ErrorAction SilentlyContinue) -ne $null } catch {}

    try {
        [Windows.Devices.Radios.Radio,Windows.Devices.Radios,ContentType=WindowsRuntime] | Out-Null
        $script:radioLoaded = $true
    } catch { $script:radioLoaded = $false }

    $caps = @{
        isAdmin = $script:isAdmin
        brightnessSupported = $brightnessOk
        nightLightSupported = $false
        focusAssistSupported = $false
        airplaneToggleSupported = $true
        wifiToggleSupported = $script:isAdmin
        bluetoothToggleSupported = $script:radioLoaded
        note = if ($script:isAdmin) { "elevated" } else { "run as administrator for wifi toggle" }
    }
    Write-Event "system:capabilities" $caps
    $script:capabilities = $caps
}

# ==============================
# BRIGHTNESS via WMI
# ==============================
$script:lastBrightness = -1
$script:brightnessSupported = $false
$script:brightnessUnsupportedEmitted = $false
$script:brightnessLastError = ""

function Update-Brightness {
    try {
        $b = Get-WmiObject -Namespace root\WMI -Class WmiMonitorBrightness -ErrorAction SilentlyContinue
        if ($b) {
            $script:brightnessSupported = $true
            $script:brightnessUnsupportedEmitted = $false
            $level = [int]$b.CurrentBrightness
            if ($level -ne $script:lastBrightness) {
                $script:lastBrightness = $level
                Write-Event "brightness:changed" @{ level = $level; supported = $true }
            }
        } else {
            if (-not $script:brightnessUnsupportedEmitted) {
                $script:brightnessUnsupportedEmitted = $true
                $script:lastBrightness = -1
                Write-Event "brightness:changed" @{ level = -1; supported = $false; error = "This display does not support software brightness control." }
            }
        }
    } catch {}
}

function Set-Brightness($level) {
    if (-not $script:brightnessSupported) {
        Write-Event "brightness:changed" @{ level = -1; supported = $false; error = "This display does not support software brightness control." }
        return
    }
    try {
        $clamped = [Math]::Max(0, [Math]::Min(100, [int]$level))
        $methods = Get-WmiObject -Namespace root\WMI -Class WmiMonitorBrightnessMethods -ErrorAction SilentlyContinue
        if ($methods) {
            $methods.WmiSetBrightness(1, $clamped) | Out-Null
            Start-Sleep -Milliseconds 150
            Update-Brightness
        }
    } catch {}
}

# ==============================
# WIFI - real adapter toggle + scan
# ==============================
function Get-WifiAdapterName {
    try {
        $a = Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "Wi-Fi|Wireless|802\.11|WLAN" } | Select-Object -First 1
        if ($a) { return $a.Name }
    } catch {}
    return $null
}

function Wifi-Toggle {
    $name = Get-WifiAdapterName
    if (-not $name) { Write-Event "network:changed" @{ error = "No Wi-Fi adapter found." }; return }
    if (-not $script:isAdmin) { Write-Event "network:changed" @{ error = "requires administrator" }; return }
    try {
        $adapter = Get-NetAdapter -Name $name -ErrorAction SilentlyContinue
        $target = if ($adapter -and $adapter.Status -eq "Up") { "disabled" } else { "enabled" }
        netsh interface set interface name="$name" admin=$target | Out-Null
        Start-Sleep -Milliseconds 800
        Update-Network
    } catch {}
}

function Get-AvailableNetworks {
    $networks = @()
    try {
        $output = netsh wlan show networks mode=bssid 2>$null
        $current = $null
        foreach ($line in $output) {
            if ($line -match '^\s*SSID \d+\s*:\s*(.+)$') { $current = @{ ssid = $matches[1].Trim(); signal = 0; security = "" }; $networks += $current }
            elseif ($current -and $line -match 'Signal\s*:\s*(\d+)%') { $current.signal = [int]$matches[1] }
            elseif ($current -and $line -match 'Authentication\s*:\s*(.+)') { $current.security = $matches[1].Trim() }
        }
    } catch {}
    return $networks
}

function Wifi-Disconnect { try { netsh wlan disconnect 2>$null | Out-Null; Start-Sleep -Milliseconds 300; Update-Network } catch {} }

# ==============================
# BLUETOOTH
# ==============================
$script:lastBluetoothDevices = $null

function Set-BluetoothEnabled($enable) {
    if (-not $script:radioLoaded) { Write-Event "network:changed" @{ error = "Bluetooth radio API unavailable on this system." }; return }
    try {
        $radios = [Windows.Devices.Radios.Radio]::GetRadiosAsync().GetAwaiter().GetResult()
        foreach ($r in $radios) {
            if ([int]$r.Kind -eq 2) {
                $target = if ($enable) { [Windows.Devices.Radios.RadioState]::On } else { [Windows.Devices.Radios.RadioState]::Off }
                $r.SetStateAsync($target).GetAwaiter().GetResult() | Out-Null
                break
            }
        }
        Start-Sleep -Milliseconds 600
        Update-Network
    } catch {
        Write-Event "network:changed" @{ error = "Bluetooth toggle failed: $($_.Exception.Message)" }
    }
}

function Get-BluetoothEnabled {
    try {
        $a = Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Where-Object { $_.Name -match "Bluetooth" } | Select-Object -First 1
        if ($a) { return ($a.Status -eq "Up") }
    } catch {}
    return $false
}

function Get-BluetoothDevices {
    $result = @()
    try {
        $null = [Windows.Devices.Bluetooth.BluetoothDevice,Windows.Devices.Bluetooth,ContentType=WindowsRuntime] | Out-Null
        $null = [Windows.Devices.Enumeration.DeviceInformation,Windows.Devices.Enumeration,ContentType=WindowsRuntime] | Out-Null
        $null = [Windows.Devices.Enumeration.DeviceInformationKind,Windows.Devices.Enumeration,ContentType=WindowsRuntime] | Out-Null
        $selector = [Windows.Devices.Bluetooth.BluetoothDevice]::GetDeviceSelectorFromPairingState($true)
        $infos = $null
        try { $infos = [Windows.Devices.Enumeration.DeviceInformation]::FindAllAsync($selector).GetResults() } catch {}
        if ($null -eq $infos -or $infos.Count -eq 0) {
            # PowerShell 5.1 cannot await DeviceInformation's IAsyncOperation on
            # some machines; fall through to the honest PnP pair list.
            throw "winrt not awaitable"
        }
        foreach ($info in $infos) {
            $name = "$($info.Name)".Trim()
            if (-not $name) { continue }
            $connected = $false
            try {
                $bt = [Windows.Devices.Bluetooth.BluetoothDevice]::FromIdAsync($info.Id).GetResults()
                if ($bt) { $connected = ($bt.ConnectionStatus.ToString() -eq "Connected") }
            } catch {}
            if (-not ($result | Where-Object { $_.name -eq $name })) {
                $result += @{ id = "$($info.Id)"; name = $name; connected = $connected }
            }
        }
        if ($result.Count -gt 0) { return @{ devices = $result; source = "winrt" } }
        throw "no winrt devices"
    } catch {}

    # Fallback: paired devices via PnP. Connection state cannot be verified
    # synchronously here, so never fabricate it — the chip just means "paired".
    $list = @()
    try {
        $devices = Get-PnpDevice -Class Bluetooth -ErrorAction SilentlyContinue | Where-Object {
            $_.Status -eq "OK" -and $_.FriendlyName -and $_.FriendlyName -notmatch "Adapter|Enumerator|Avrcp|RFCOMM|A2DP|LE"
        }
        $seen = @{}
        foreach ($d in $devices) {
            $name = "$($d.FriendlyName)".Trim()
            if ($name -and -not $seen.ContainsKey($name)) {
                $seen[$name] = $true
                $list += @{ id = "$($d.InstanceId)"; name = $name }
            }
        }
    } catch {}
    return @{ devices = $list; source = "pnp" }
}

function Update-BluetoothDevices {
    $res = Get-BluetoothDevices
    if (-not $res) { return }
    $list = $res.devices
    $json1 = $list | ConvertTo-Json -Compress
    $json2 = if ($script:lastBluetoothDevices) { $script:lastBluetoothDevices | ConvertTo-Json -Compress } else { "[]" }
    if ($json1 -ne $json2) {
        $script:lastBluetoothDevices = $list
        Write-Log "BLUETOOTH" "Devices refresh ($($res.source)): $($list.Count) found"
        Write-Event "bluetooth:devices" $list
    }
}

# ==============================
# CLIPBOARD via WinRT
# ==============================
$script:lastClipboard = $null
$script:clipboardAvailable = $false
try {
    [Windows.ApplicationModel.DataTransfer.Clipboard,Windows.ApplicationModel.DataTransfer,ContentType=WindowsRuntime] | Out-Null
    $script:clipboardAvailable = $true
} catch {}

function Update-Clipboard {
    if (-not $script:clipboardAvailable) { return }
    try {
        $content = [Windows.ApplicationModel.DataTransfer.Clipboard]::GetContent()
        $text = ""
        try { $text = $content.GetTextAsync().GetAwaiter().GetResult() } catch {}
        if ($text -and $text -ne $script:lastClipboard) {
            $script:lastClipboard = $text
            $preview = if ($text.Length -gt 80) { $text.Substring(0, 77) + "..." } else { $text }
            Write-Event "clipboard:changed" @{ type = "text"; preview = $preview; timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds() }
        }
    } catch {}
}

# ==============================
# MAIN LOOP
# ==============================
Write-Ready
Update-Capabilities
Update-Volume; Update-Battery; Update-Devices; Update-Network; Update-Media; Update-Notifications
Update-Brightness; Update-BluetoothDevices; Update-SystemHealth

$tick = 0
# Commands arrive as JSON lines on stdin (piped by the Electron main process).
# $host.UI.ReadLine only reads the console, so we read via an async StreamReader
# and poll IsCompleted once per tick — non-blocking, works with piped input.
$script:stdinReader = New-Object System.IO.StreamReader([Console]::OpenStandardInput())
$script:stdinPending = $script:stdinReader.ReadLineAsync()

while ($true) {
    Start-Sleep -Milliseconds 1000; $tick++
    Update-Volume
    Update-NetworkSpeed
    if ($tick % 2 -eq 0) { Update-Media }
    if ($tick % 3 -eq 0) { Update-Brightness }
    if ($tick % 5 -eq 0) { Update-Notifications; Update-BluetoothDevices; Update-Clipboard }
    if ($tick % 6 -eq 0) { Update-SystemHealth }
    if ($tick % 10 -eq 0) { Update-Battery; Update-Devices }
    if ($tick % 15 -eq 0) { Update-Network }

    $cmdCount = 0
    while ($script:stdinPending -and $script:stdinPending.IsCompleted -and $cmdCount -lt 20) {
        $cmdCount++
        $line = $script:stdinPending.Result
        $script:stdinPending = $script:stdinReader.ReadLineAsync()
        if ($null -eq $line) { break }
        try {
            $cmd = $line | ConvertFrom-Json
            switch ($cmd.command) {
                "media:play-pause" { Write-Log "MEDIA" "Play/Pause command sent"; Media-PlayPause }
                "media:next" { Write-Log "MEDIA" "Next command sent"; Media-Next }
                "media:previous" { Write-Log "MEDIA" "Previous command sent"; Media-Previous }
                "media:stop" { Write-Log "MEDIA" "Stop command sent"; Media-Stop }
                "volume:set" { Write-Log "VOLUME" "Set to $([float]$cmd.data.level)"; Set-Volume [float]$cmd.data.level }
                "volume:toggle-mute" { Write-Log "VOLUME" "Toggle mute"; Toggle-Mute }
                "brightness:set" { Write-Log "BRIGHTNESS" "Set to $([int]$cmd.data.level)"; Set-Brightness [int]$cmd.data.level }
                "wifi:disconnect" { Write-Log "WIFI" "Disconnect requested"; Wifi-Disconnect }
                "wifi:scan" { Write-Log "WIFI" "Scan requested"; Write-Event "wifi:networks" (Get-AvailableNetworks) }
                "wifi:toggle" { Write-Log "WIFI" "Toggle requested"; Wifi-Toggle }
                "bluetooth:devices:refresh" { Update-BluetoothDevices }
                "bluetooth:toggle" { Write-Log "BLUETOOTH" "Toggle requested"; Set-BluetoothEnabled (-not (Get-BluetoothEnabled)) }
                "nightlight:set" { Write-Log "QUICKCONTROL" "Night light not programmatically exposed"; Write-Event "nightlight:changed" @{ enabled = [bool]$cmd.data.enabled; supported = $false; error = "Night light can only be toggled in Windows Settings; not exposed programmatically." } }
                "focus:set" { Write-Log "QUICKCONTROL" "Focus assist not programmatically exposed"; Write-Event "focus:changed" @{ enabled = [bool]$cmd.data.enabled; supported = $false; error = "Focus assist is not exposed by a stable native API." } }
                "airplane:toggle" { Write-Log "QUICKCONTROL" "Airplane mode toggle requested"; $cur = (Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\RadioManagement\SystemRadioState" -ErrorAction SilentlyContinue)."0"; Set-AirplaneMode ($cur -ne 1) }
                "clipboard:get" { Update-Clipboard }
"ping" { Write-Event "pong" @{ ts = [DateTimeOffset]::Now.ToUnixTimeMilliseconds() } }
            }
        } catch {}
    }
}
