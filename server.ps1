param(
  [int]$Port = 8080
)

$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$MimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".txt"  = "text/plain; charset=utf-8"
  ".md"   = "text/markdown; charset=utf-8"
  ".svg"  = "image/svg+xml"
  ".png"  = "image/png"
  ".ico"  = "image/x-icon"
}

$Listener = New-Object System.Net.HttpListener
$Prefix = "http://localhost:$Port/"
$Listener.Prefixes.Add($Prefix)
$Listener.Start()

Write-Host "=============================================================" -ForegroundColor Cyan
Write-Host " DAI THANH AI AGENT SERVER IS RUNNING ON LOCALHOST" -ForegroundColor Green
Write-Host " URL: $Prefix" -ForegroundColor Yellow
Write-Host " Workspace: $RootDir" -ForegroundColor Gray
Write-Host "=============================================================" -ForegroundColor Cyan

try {
  while ($Listener.IsListening) {
    try {
      $Context = $Listener.GetContext()
      $Request = $Context.Request
      $Response = $Context.Response

      $UrlPath = $Request.Url.LocalPath
      if ($UrlPath -eq "/" -or [string]::IsNullOrWhiteSpace($UrlPath)) {
        $UrlPath = "/index.html"
      }

      if ($UrlPath -eq "/api/health") {
        $HealthJson = '{"status":"ok","service":"Dai Thanh Multi-Agent Hub","port":' + $Port + '}'
        $Buffer = [System.Text.Encoding]::UTF8.GetBytes($HealthJson)
        $Response.ContentType = "application/json; charset=utf-8"
        $Response.StatusCode = 200
        $Response.ContentLength64 = $Buffer.Length
        $Response.OutputStream.Write($Buffer, 0, $Buffer.Length)
        $Response.OutputStream.Close()
        continue
      }

      $RelativePath = $UrlPath.TrimStart('/').Replace('/', '\')
      $FilePath = Join-Path $RootDir $RelativePath

      if (Test-Path $FilePath -PathType Leaf) {
        $Ext = [System.IO.Path]::GetExtension($FilePath).ToLowerInvariant()
        $ContentType = if ($MimeTypes.ContainsKey($Ext)) { $MimeTypes[$Ext] } else { "application/octet-stream" }
        $Bytes = [System.IO.File]::ReadAllBytes($FilePath)

        $Response.ContentType = $ContentType
        $Response.StatusCode = 200
        $Response.AddHeader("Cache-Control", "no-cache")
        $Response.ContentLength64 = $Bytes.Length
        $Response.OutputStream.Write($Bytes, 0, $Bytes.Length)
      } else {
        $NotFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $UrlPath")
        $Response.StatusCode = 404
        $Response.ContentType = "text/plain; charset=utf-8"
        $Response.ContentLength64 = $NotFoundMsg.Length
        $Response.OutputStream.Write($NotFoundMsg, 0, $NotFoundMsg.Length)
      }

      $Response.OutputStream.Close()
      Write-Host "[$(Get-Date -Format 'HH:mm:ss')] 200 GET $UrlPath"
    } catch {
      Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Request warning: $($_.Exception.Message)"
    }
  }
} finally {
  $Listener.Stop()
  $Listener.Close()
}
