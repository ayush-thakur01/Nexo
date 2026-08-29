Write-Host "=== Testing alternative API approaches ==="

Write-Host "`n--- Volume via winmm.dll P/Invoke ---"
try {
    $csharpVol = @"
using System;
using System.Runtime.InteropServices;
public class AudioVol {
    [DllImport("winmm.dll")]
    public static extern int waveOutGetVolume(IntPtr hwo, out uint dwVolume);
    public static float GetVolume() {
        uint vol;
        waveOutGetVolume(IntPtr.Zero, out vol);
        uint left = vol & 0xFFFF;
        uint right = (vol >> 16) & 0xFFFF;
        return (left + right) / 2f / 65535f;
    }
}
"@
    Add-Type -TypeDefinition $csharpVol -ErrorAction Stop
    $v = [AudioVol]::GetVolume()
    Write-Host "VOLUME: $v (via winmm.dll)"
} catch { Write-Host "VOLUME P/Invoke failed: $($_.Exception.Message)" }

Write-Host "`n--- Volume via WMI ---"
try {
    $volQuery = Get-WmiObject -Namespace "root\cimv2" -Class Win32_PerfFormattedData_Counters_AudioEndpoint -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($volQuery) { Write-Host "VOLUME WMI: $($volQuery.VolumeLevel)" } else { Write-Host "VOLUME WMI: no data" }
} catch { Write-Host "VOLUME WMI: $($_.Exception.Message)" }

Write-Host "`n--- Media via C# WinRT ---"
try {
    $csharpMedia = @"
using System;
using Windows.Media.Control;
public class MediaCtrl {
    public static string GetNowPlaying() {
        try {
            var task = GlobalSystemMediaTransportControlsSessionManager.RequestAsync().AsTask();
            if (task.Wait(3000)) {
                var mgr = task.Result;
                if (mgr != null) {
                    var sessions = mgr.GetSessions();
                    if (sessions.Count > 0) {
                        var ptask = sessions[0].TryGetMediaPropertiesAsync().AsTask();
                        if (ptask.Wait(3000)) {
                            var props = ptask.Result;
                            return props.Title + "|" + props.Artist;
                        }
                    }
                }
            }
        } catch { }
        return null;
    }
}
"@
    Add-Type -TypeDefinition $csharpMedia -ReferencedAssemblies "Windows.Media.Control" -ErrorAction SilentlyContinue
    if ($?) {
        $result = [MediaCtrl]::GetNowPlaying()
        Write-Host "MEDIA: result='$result'"
    } else { Write-Host "MEDIA: C# WinRT add-type failed" }
}
catch { Write-Host "MEDIA ERROR: $($_.Exception.Message)" }

Write-Host "`n--- Media via WinRT PowerShell syntax ---"
try {
    Add-Type -AssemblyName System.Runtime.WindowsRuntime -ErrorAction SilentlyContinue
    $found = $false
    try { [Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager,Windows.Media.Control,ContentType=WindowsRuntime] | Out-Null; $found = $true; Write-Host "GSMTC type loaded!" } catch { Write-Host "GSMTC PS syntax failed: $($_.Exception.Message)" }
} catch { Write-Host "GSMTC PS error: $($_.Exception.Message)" }

Write-Host "`n--- MMDeviceEnumerator via CLSID ---"
try {
    $clsid = [Guid]"{BCDE0395-E52F-467C-8E3D-C4579291692E}"
    $type = [Type]::GetTypeFromCLSID($clsid)
    if ($type) {
        $mme = [Activator]::CreateInstance($type)
        Write-Host "MMDeviceEnumerator CREATED via CLSID!"
        try {
            $device = $mme.GetDefaultAudioEndpoint(0, 1)
            Write-Host "  Default endpoint: $($device)"
        } catch { Write-Host "  GetDefaultAudioEndpoint failed: $($_.Exception.Message)" }
    } else { Write-Host "MMDeviceEnumerator CLSID not registered" }
} catch { Write-Host "MMDeviceEnumerator CLSID error: $($_.Exception.Message)" }

Write-Host "`n=== Done ==="
