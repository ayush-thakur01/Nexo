Add-Type @"
using System;
using System.Runtime.InteropServices;
public class MU {
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int dx, int dy, uint d, int e);
  [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(int x, int y);
  [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint ga);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
}
"@

$cx=768; $cy=82
function Get-RootRect {
  $hw = [MU]::WindowFromPoint($cx,$cy)
  $root = [MU]::GetAncestor($hw, 2)
  $r = New-Object MU+RECT
  [MU]::GetWindowRect($root, [ref]$r) | Out-Null
  return $r
}

$r = Get-RootRect
$w=$r.R-$r.L; $hgt=$r.B-$r.T
Write-Output ("BEFORE w="+ $w + " h=" + $hgt)
[MU]::SetCursorPos($cx,$cy)
Start-Sleep -Milliseconds 60
[MU]::mouse_event(0x0002,0,0,0,0)
[MU]::mouse_event(0x0004,0,0,0,0)
Start-Sleep -Milliseconds 700
$r2 = Get-RootRect
$w2=$r2.R-$r2.L; $h2=$r2.B-$r2.T
Write-Output ("AFTER w="+ $w2 + " h=" + $h2)
if ($w2 -ne $w -or $h2 -ne $hgt) { Write-Output "CLICK_WORKED_RESIZE" } else { Write-Output "CLICK_NO_EFFECT" }
