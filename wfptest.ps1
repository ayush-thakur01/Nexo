Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WF2 {
  [DllImport("user32.dll")] public static extern IntPtr WindowFromPoint(int x, int y);
  [DllImport("user32.dll")] public static extern IntPtr GetAncestor(IntPtr h, uint ga);
  [DllImport("user32.dll")] public static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L,T,R,B; }
}
"@
$cx=768; $cy=82
$top = [WF2]::WindowFromPoint($cx,$cy)
$sb = New-Object System.Text.StringBuilder(256)
[WF2]::GetClassName($top, $sb, 256) | Out-Null
$cls = $sb.ToString()
$root = [WF2]::GetAncestor($top, 2)
$r = New-Object WF2+RECT
[WF2]::GetWindowRect($root, [ref]$r) | Out-Null
Write-Output ("Point ($cx,$cy) -> child h=$top class='$cls'")
Write-Output ("Top-level root rect: ($($r.L),$($r.T),$($r.R),$($r.B)) size=$(($r.R-$r.L))x$(($r.B-$r.T))")
