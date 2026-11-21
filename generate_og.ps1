Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 630

$bmp = New-Object System.Drawing.Bitmap($width, $height)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

function Get-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($x, $y, $diameter, $diameter, 180, 90)
    $path.AddArc($x + $w - $diameter, $y, $diameter, $diameter, 270, 90)
    $path.AddArc($x + $w - $diameter, $y + $h - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($x, $y + $h - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

# 1. Background Fill (#04060a)
$bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(4, 6, 10))
$g.FillRectangle($bgBrush, 0, 0, $width, $height)

# 2. Subtle Tech Grid
$gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(14, 255, 255, 255), 1)
for ($x = 0; $x -lt $width; $x += 40) {
    $g.DrawLine($gridPen, $x, 0, $x, $height)
}
for ($y = 0; $y -lt $height; $y += 40) {
    $g.DrawLine($gridPen, 0, $y, $width, $y)
}

# 3. Ambient Glowing Lights
$pathGlow1 = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathGlow1.AddEllipse(-100, -100, 750, 750)
$pbg1 = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGlow1)
$pbg1.CenterColor = [System.Drawing.Color]::FromArgb(80, 99, 102, 241) # Brand Accent Indigo
$pbg1.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 4, 6, 10))
$g.FillPath($pbg1, $pathGlow1)

$pathGlow2 = New-Object System.Drawing.Drawing2D.GraphicsPath
$pathGlow2.AddEllipse(650, 100, 700, 600)
$pbg2 = New-Object System.Drawing.Drawing2D.PathGradientBrush($pathGlow2)
$pbg2.CenterColor = [System.Drawing.Color]::FromArgb(70, 139, 92, 246) # Purple Violet
$pbg2.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 4, 6, 10))
$g.FillPath($pbg2, $pathGlow2)

$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(99, 102, 241))
$emeraldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))

# 4. Brand Logo Badge (Left Top)
$badgeX = 75.0
$badgeY = 65.0
$badgeW = 280.0
$badgeH = 50.0
$badgePath = Get-RoundedRectPath $badgeX $badgeY $badgeW $badgeH 16.0
$badgeBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 12, 16, 29))
$badgeBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 99, 102, 241), 1.5)
$g.FillPath($badgeBgBrush, $badgePath)
$g.DrawPath($badgeBorderPen, $badgePath)

# Icon Box (Gradient)
$iconBox = Get-RoundedRectPath ($badgeX + 8) ($badgeY + 8) 34.0 34.0 10.0
$iconRect = New-Object System.Drawing.Rectangle([int]($badgeX + 8), [int]($badgeY + 8), 34, 34)
$iconBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($iconRect, [System.Drawing.Color]::FromArgb(99, 102, 241), [System.Drawing.Color]::FromArgb(139, 92, 246), [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal)
$g.FillPath($iconBrush, $iconBox)

# Sparkle text icon
$sparkleFont = New-Object System.Drawing.Font("Segoe UI Symbol", [float]14, [System.Drawing.FontStyle]::Bold)
$g.DrawString([char]0x2728, $sparkleFont, $whiteBrush, [float]($badgeX + 13), [float]($badgeY + 11))

# Brand Text: Lumina Commerce AI
$brandFont = New-Object System.Drawing.Font("Arial", [float]13, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Lumina Commerce", $brandFont, $whiteBrush, [float]($badgeX + 50), [float]($badgeY + 15))

$aiTagBox = Get-RoundedRectPath ($badgeX + 215) ($badgeY + 13) 52.0 24.0 6.0
$aiTagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(99, 102, 241))
$g.FillPath($aiTagBrush, $aiTagBox)
$aiTagFont = New-Object System.Drawing.Font("Arial", [float]9, [System.Drawing.FontStyle]::Bold)
$g.DrawString("STUDIO", $aiTagFont, $whiteBrush, [float]($badgeX + 220), [float]($badgeY + 17))

# 5. Main Headline
$h1Font = New-Object System.Drawing.Font("Arial Black", [float]38, [System.Drawing.FontStyle]::Bold)
$g.DrawString("High-Converting", $h1Font, $accentBrush, [float]$badgeX, [float]($badgeY + 75))
$g.DrawString("AI Model Photoshoots", $h1Font, $whiteBrush, [float]$badgeX, [float]($badgeY + 135))
$g.DrawString("in 3 Seconds", $h1Font, $whiteBrush, [float]$badgeX, [float]($badgeY + 195))

# 6. Subtitle
$subFont = New-Object System.Drawing.Font("Segoe UI", [float]16, [System.Drawing.FontStyle]::Bold)
$subBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(200, 203, 213, 225))
$g.DrawString("Turn Flat Product Shots into Luxury On-Model Editorial Photos", $subFont, $subBrush, [float]$badgeX, [float]($badgeY + 275))
$g.DrawString("Eliminate $3,000 Studio Costs for Amazon, Shopify & TikTok Shop", $subFont, $subBrush, [float]$badgeX, [float]($badgeY + 305))

# 7. Feature Pills
$features = @("1-Sec Auto Background Removal", "99.9% Uptime Cloud", "8K Commercial Resolution", "100% Royalty-Free Rights")
$pillX = [float]$badgeX
$pillY = [float]($badgeY + 365)
$pillFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold)
$pillBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(210, 15, 23, 42))
$pillBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(80, 255, 255, 255), 1)
$pillTextBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(241, 245, 249))
$dotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))

$count = 0
foreach ($f in $features) {
    $size = $g.MeasureString($f, $pillFont)
    $pw = [float]($size.Width + 36)
    $ph = 36.0
    $pPath = Get-RoundedRectPath $pillX $pillY $pw $ph 10.0
    $g.FillPath($pillBgBrush, $pPath)
    $g.DrawPath($pillBorderPen, $pPath)
    $g.FillEllipse($dotBrush, [float]($pillX + 12), [float]($pillY + 14), 8.0, 8.0)
    $g.DrawString($f, $pillFont, $pillTextBrush, [float]($pillX + 26), [float]($pillY + 8))
    $pillX += $pw + 12
    $count++
    if ($count -eq 2) {
        $pillX = [float]$badgeX
        $pillY += 46.0
    }
}

# 8. Live Status Badge (Bottom Left)
$domY = 535.0
$liveDotBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(16, 185, 129))
$g.FillEllipse($liveDotBrush, [float]$badgeX, [float]($domY + 7), 10.0, 10.0)
$domFont = New-Object System.Drawing.Font("Segoe UI", [float]15, [System.Drawing.FontStyle]::Bold)
$domBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(165, 180, 252))
$g.DrawString("Powered by fal.ai Serverless Cloud Engine", $domFont, $domBrush, [float]($badgeX + 18), [float]$domY)

# ==========================================
# RIGHT SIDE: LUXURY COMPARISON MOCKUP CARD
# ==========================================
$mockX = 720.0
$mockY = 85.0
$mockW = 420.0
$mockH = 460.0

$mockPath = Get-RoundedRectPath $mockX $mockY $mockW $mockH 24.0
$mockBgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 12, 16, 29))
$mockBorderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(120, 99, 102, 241), 2)
$g.FillPath($mockBgBrush, $mockPath)
$g.DrawPath($mockBorderPen, $mockPath)

# Top Header of Mockup
$mockHeaderFont = New-Object System.Drawing.Font("Segoe UI", [float]13, [System.Drawing.FontStyle]::Bold)
$g.DrawString("AI Model Photoshoot Preview", $mockHeaderFont, $whiteBrush, [float]($mockX + 24), [float]($mockY + 20))

$tagLivePath = Get-RoundedRectPath ($mockX + 300) ($mockY + 18) 95.0 28.0 8.0
$tagLiveBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(30, 16, 185, 129))
$tagLivePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(16, 185, 129), 1)
$g.FillPath($tagLiveBrush, $tagLivePath)
$g.DrawPath($tagLivePen, $tagLivePath)
$tagLiveFont = New-Object System.Drawing.Font("Segoe UI", [float]10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("8K ULTRA HD", $tagLiveFont, $emeraldBrush, [float]($mockX + 310), [float]($mockY + 23))

# Left Box: Flat Product (Before)
$box1X = $mockX + 20.0
$box1Y = $mockY + 65.0
$boxW = 180.0
$boxH = 310.0
$b1Path = Get-RoundedRectPath $box1X $box1Y $boxW $boxH 16.0
$b1Brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 7, 10, 18))
$b1Pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(60, 255, 255, 255), 1.5)
$g.FillPath($b1Brush, $b1Path)
$g.DrawPath($b1Pen, $b1Path)

$lblFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold)
$dimBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(150, 148, 163, 184))
$g.DrawString("RAW FLAT LAY", $lblFont, $dimBrush, [float]($box1X + 30), [float]($box1Y + 25))

# Dress silhouette simple drawing
$dressPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$dressPath.AddLine([float]($box1X + 70), [float]($box1Y + 70), [float]($box1X + 110), [float]($box1Y + 70))
$dressPath.AddLine([float]($box1X + 110), [float]($box1Y + 70), [float]($box1X + 130), [float]($box1Y + 140))
$dressPath.AddLine([float]($box1X + 130), [float]($box1Y + 140), [float]($box1X + 150), [float]($box1Y + 250))
$dressPath.AddLine([float]($box1X + 150), [float]($box1Y + 250), [float]($box1X + 30), [float]($box1Y + 250))
$dressPath.AddLine([float]($box1X + 30), [float]($box1Y + 250), [float]($box1X + 50), [float]($box1Y + 140))
$dressPath.CloseFigure()
$dressBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(100, 148, 163, 184))
$g.FillPath($dressBrush, $dressPath)

$status1Font = New-Object System.Drawing.Font("Segoe UI", [float]10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("Low CTR (0.8%)", $status1Font, [System.Drawing.Brushes]::IndianRed, [float]($box1X + 35), [float]($box1Y + 270))

# Right Box: AI Model (After)
$box2X = $mockX + 215.0
$box2Y = $mockY + 65.0
$b2Path = Get-RoundedRectPath $box2X $box2Y $boxW $boxH 16.0
$b2Brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Rectangle([int]$box2X, [int]$box2Y, [int]$boxW, [int]$boxH)), [System.Drawing.Color]::FromArgb(25, 99, 102, 241), [System.Drawing.Color]::FromArgb(40, 139, 92, 246), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$b2Pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 99, 102, 241), 2)
$g.FillPath($b2Brush, $b2Path)
$g.DrawPath($b2Pen, $b2Path)

$g.DrawString("AI MODEL SHOT", $lblFont, $accentBrush, [float]($box2X + 28), [float]($box2Y + 25))

# Luxury Model silhouette
$modelPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$modelPath.AddEllipse([float]($box2X + 75), [float]($box2Y + 65), 30.0, 30.0)
$modelPath.AddLine([float]($box2X + 70), [float]($box2Y + 105), [float]($box2X + 110), [float]($box2Y + 105))
$modelPath.AddLine([float]($box2X + 125), [float]($box2Y + 160), [float]($box2X + 145), [float]($box2Y + 250))
$modelPath.AddLine([float]($box2X + 145), [float]($box2Y + 250), [float]($box2X + 35), [float]($box2Y + 250))
$modelPath.AddLine([float]($box2X + 35), [float]($box2Y + 250), [float]($box2X + 55), [float]($box2Y + 160))
$modelBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Rectangle([int]$box2X, [int]$box2Y, [int]$boxW, [int]$boxH)), [System.Drawing.Color]::FromArgb(220, 99, 102, 241), [System.Drawing.Color]::FromArgb(220, 192, 132, 252), [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
$g.FillPath($modelBrush, $modelPath)

$status2Font = New-Object System.Drawing.Font("Segoe UI", [float]10, [System.Drawing.FontStyle]::Bold)
$g.DrawString("+340% Higher CTR", $status2Font, $emeraldBrush, [float]($box2X + 28), [float]($box2Y + 270))

# Bottom Metric of Mockup
$statBox = Get-RoundedRectPath ($mockX + 20) ($mockY + 390) 375.0 50.0 12.0
$statBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 7, 10, 18))
$statPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(40, 255, 255, 255), 1)
$g.FillPath($statBrush, $statBox)
$g.DrawPath($statPen, $statBox)

$statTextFont = New-Object System.Drawing.Font("Segoe UI", [float]11, [System.Drawing.FontStyle]::Bold)
$g.DrawString("⚡ Generation Speed: ~2.8s   |   💰 Savings: 97%", $statTextFont, $whiteBrush, [float]($mockX + 35), [float]($mockY + 405))

# Save Image
$bmp.Save("og-image.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Write-Host "SUCCESS: og-image.png generated successfully (1200x630)"
