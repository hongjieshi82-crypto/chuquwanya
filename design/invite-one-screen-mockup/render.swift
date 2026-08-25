import AppKit
import Foundation

let args = CommandLine.arguments
guard args.count >= 3 else {
  fputs("Usage: swift render.swift <source.png> <output.png>\n", stderr)
  exit(1)
}

let sourcePath = args[1]
let outputPath = args[2]

guard let source = NSImage(contentsOfFile: sourcePath) else {
  fputs("Unable to load source image\n", stderr)
  exit(1)
}

let canvasSize = NSSize(width: 836, height: 1586)

func rectTop(_ x: CGFloat, _ y: CGFloat, _ w: CGFloat, _ h: CGFloat) -> NSRect {
  NSRect(x: x, y: canvasSize.height - y - h, width: w, height: h)
}

func color(_ hex: String, alpha: CGFloat = 1) -> NSColor {
  var value = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
  if value.count == 3 {
    value = value.map { "\($0)\($0)" }.joined()
  }
  var rgb: UInt64 = 0
  Scanner(string: value).scanHexInt64(&rgb)
  return NSColor(
    calibratedRed: CGFloat((rgb >> 16) & 0xff) / 255,
    green: CGFloat((rgb >> 8) & 0xff) / 255,
    blue: CGFloat(rgb & 0xff) / 255,
    alpha: alpha
  )
}

func drawRoundedRect(_ rect: NSRect, radius: CGFloat, fill: NSColor, stroke: NSColor? = nil, lineWidth: CGFloat = 1, shadow: NSShadow? = nil) {
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  NSGraphicsContext.saveGraphicsState()
  if let shadow {
    shadow.set()
  }
  fill.setFill()
  path.fill()
  if let stroke {
    stroke.setStroke()
    path.lineWidth = lineWidth
    path.stroke()
  }
  NSGraphicsContext.restoreGraphicsState()
}

func drawSourceClipped(in target: NSRect, from sourceRect: NSRect, radius: CGFloat, stroke: NSColor? = nil, lineWidth: CGFloat = 1) {
  let path = NSBezierPath(roundedRect: target, xRadius: radius, yRadius: radius)
  NSGraphicsContext.saveGraphicsState()
  path.addClip()
  source.draw(in: target, from: sourceRect, operation: .copy, fraction: 1)
  NSGraphicsContext.restoreGraphicsState()
  if let stroke {
    stroke.setStroke()
    path.lineWidth = lineWidth
    path.stroke()
  }
}

func drawText(_ text: String, in rect: NSRect, size: CGFloat, weight: NSFont.Weight, fill: NSColor, alignment: NSTextAlignment = .center) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = alignment
  paragraph.lineBreakMode = .byTruncatingTail
  let attrs: [NSAttributedString.Key: Any] = [
    .font: NSFont.systemFont(ofSize: size, weight: weight),
    .foregroundColor: fill,
    .paragraphStyle: paragraph
  ]
  (text as NSString).draw(in: rect, withAttributes: attrs)
}

func drawTextTop(_ text: String, x: CGFloat, y: CGFloat, w: CGFloat, h: CGFloat, size: CGFloat, weight: NSFont.Weight, fill: NSColor, alignment: NSTextAlignment = .center) {
  drawText(text, in: rectTop(x, y, w, h), size: size, weight: weight, fill: fill, alignment: alignment)
}

func drawPillGradient(_ rect: NSRect) {
  let path = NSBezierPath(roundedRect: rect, xRadius: rect.height / 2, yRadius: rect.height / 2)
  let shadow = NSShadow()
  shadow.shadowColor = color("#7565F6", alpha: 0.18)
  shadow.shadowBlurRadius = 18
  shadow.shadowOffset = NSSize(width: 0, height: -6)
  NSGraphicsContext.saveGraphicsState()
  shadow.set()
  path.addClip()
  let gradient = NSGradient(colors: [color("#8170FF"), color("#6755EE")])
  gradient?.draw(in: rect, angle: 0)
  NSGraphicsContext.restoreGraphicsState()
}

func drawLinkIcon(centerX: CGFloat, centerYTop: CGFloat, size: CGFloat, stroke: NSColor) {
  let y = canvasSize.height - centerYTop
  NSGraphicsContext.saveGraphicsState()
  let transform = NSAffineTransform()
  transform.translateX(by: centerX, yBy: y)
  transform.rotate(byDegrees: -34)
  transform.concat()
  stroke.setStroke()
  for offset in [-5.8, 5.8] as [CGFloat] {
    let rect = NSRect(x: offset - size * 0.28, y: -size * 0.18, width: size * 0.56, height: size * 0.36)
    let path = NSBezierPath(roundedRect: rect, xRadius: size * 0.18, yRadius: size * 0.18)
    path.lineWidth = 3.6
    path.stroke()
  }
  let join = NSBezierPath()
  join.move(to: NSPoint(x: -4, y: 0))
  join.line(to: NSPoint(x: 4, y: 0))
  join.lineWidth = 3.6
  join.lineCapStyle = .round
  join.stroke()
  NSGraphicsContext.restoreGraphicsState()
}

func drawTabIconHome(centerX: CGFloat, centerYTop: CGFloat, color stroke: NSColor) {
  let y = canvasSize.height - centerYTop
  let path = NSBezierPath()
  path.move(to: NSPoint(x: centerX - 10, y: y - 1))
  path.line(to: NSPoint(x: centerX, y: y + 10))
  path.line(to: NSPoint(x: centerX + 10, y: y - 1))
  path.line(to: NSPoint(x: centerX + 8, y: y - 14))
  path.line(to: NSPoint(x: centerX - 8, y: y - 14))
  path.close()
  path.lineWidth = 3
  stroke.setStroke()
  path.stroke()
}

func drawTabIconCheck(centerX: CGFloat, centerYTop: CGFloat, color stroke: NSColor) {
  let y = canvasSize.height - centerYTop
  let path = NSBezierPath()
  path.move(to: NSPoint(x: centerX - 12, y: y + 1))
  path.line(to: NSPoint(x: centerX - 3, y: y - 11))
  path.line(to: NSPoint(x: centerX + 14, y: y + 14))
  path.lineWidth = 6
  path.lineCapStyle = .round
  path.lineJoinStyle = .round
  stroke.setStroke()
  path.stroke()
}

func drawTabIconPerson(centerX: CGFloat, centerYTop: CGFloat, color stroke: NSColor) {
  let y = canvasSize.height - centerYTop
  stroke.setStroke()
  let head = NSBezierPath(ovalIn: NSRect(x: centerX - 4, y: y + 4, width: 8, height: 8))
  head.lineWidth = 3
  head.stroke()
  let body = NSBezierPath()
  body.move(to: NSPoint(x: centerX - 9, y: y - 13))
  body.curve(to: NSPoint(x: centerX + 9, y: y - 13), controlPoint1: NSPoint(x: centerX - 8, y: y - 2), controlPoint2: NSPoint(x: centerX + 8, y: y - 2))
  body.lineWidth = 3
  body.stroke()
}

let output = NSImage(size: canvasSize)
output.lockFocus()

source.draw(in: NSRect(origin: .zero, size: canvasSize), from: .zero, operation: .copy, fraction: 1)

// Clean the scrollable content area while preserving the phone shell and top navigation.
let screenClip = NSBezierPath(roundedRect: rectTop(20, 10, 796, 1565), xRadius: 108, yRadius: 108)
screenClip.addClip()
color("#F2ECFF").setFill()
rectTop(22, 240, 792, 1288).fill()

// Soft background tint.
let bgGradient = NSGradient(colors: [color("#F5F0FF"), color("#EEE8FF"), color("#F7F5FF")])
bgGradient?.draw(in: rectTop(22, 240, 792, 1288), angle: -88)

// Smaller hero poster, reusing the original artwork and compressing the card height.
drawSourceClipped(
  in: rectTop(52, 258, 732, 390),
  from: rectTop(52, 260, 732, 584),
  radius: 58,
  stroke: color("#FFFFFF", alpha: 0.88),
  lineWidth: 1.4
)

// Reward cards moved up.
drawSourceClipped(in: rectTop(52, 672, 358, 128), from: rectTop(52, 868, 358, 128), radius: 28)
drawSourceClipped(in: rectTop(426, 672, 358, 128), from: rectTop(426, 868, 358, 128), radius: 28)

// Invite reward card moved up, preserving its original content.
drawSourceClipped(in: rectTop(52, 824, 732, 296), from: rectTop(52, 1018, 732, 296), radius: 52)

// Secondary action.
let secondary = rectTop(52, 1138, 732, 84)
let secondaryShadow = NSShadow()
secondaryShadow.shadowColor = color("#7565F6", alpha: 0.05)
secondaryShadow.shadowBlurRadius = 12
secondaryShadow.shadowOffset = NSSize(width: 0, height: -2)
drawRoundedRect(secondary, radius: 16, fill: color("#FFFFFF", alpha: 0.7), stroke: color("#D7CFFF"), lineWidth: 1.6, shadow: secondaryShadow)
drawTextTop("返回方案详情", x: 52, y: 1163, w: 732, h: 36, size: 27, weight: .bold, fill: color("#D0CCDA"))

// Primary action fully above the bottom tab.
let primary = rectTop(52, 1236, 732, 86)
drawPillGradient(primary)
drawLinkIcon(centerX: 298, centerYTop: 1279, size: 28, stroke: .white)
drawTextTop("复制链接去邀请", x: 52, y: 1255, w: 732, h: 48, size: 30, weight: .heavy, fill: .white)

// Bottom tab redrawn as a floating surface above the safe area.
let tab = rectTop(52, 1360, 732, 126)
let tabShadow = NSShadow()
tabShadow.shadowColor = color("#7565F6", alpha: 0.12)
tabShadow.shadowBlurRadius = 22
tabShadow.shadowOffset = NSSize(width: 0, height: -8)
drawRoundedRect(tab, radius: 50, fill: color("#FFFFFF", alpha: 0.94), shadow: tabShadow)
drawRoundedRect(rectTop(54, 1362, 728, 62), radius: 31, fill: color("#FFFFFF", alpha: 0.4))

let muted = color("#9E98C2")
let active = color("#7565F6")
drawTabIconHome(centerX: 176, centerYTop: 1416, color: muted)
drawTextTop("首页", x: 122, y: 1436, w: 108, h: 28, size: 21, weight: .bold, fill: muted)
drawTabIconCheck(centerX: 418, centerYTop: 1416, color: muted)
drawTextTop("本周约定", x: 347, y: 1436, w: 142, h: 28, size: 21, weight: .bold, fill: muted)
drawTabIconPerson(centerX: 660, centerYTop: 1416, color: active)
drawTextTop("我的", x: 606, y: 1436, w: 108, h: 28, size: 21, weight: .heavy, fill: active)

output.unlockFocus()

guard let tiff = output.tiffRepresentation,
      let bitmap = NSBitmapImageRep(data: tiff),
      let data = bitmap.representation(using: .png, properties: [:]) else {
  fputs("Unable to encode output\n", stderr)
  exit(1)
}

try data.write(to: URL(fileURLWithPath: outputPath))
print(outputPath)
