import AppKit

let size = NSSize(width: 32, height: 32)
let image = NSImage(size: size)

image.lockFocus()

// Clear with transparent background
NSColor.clear.set()
let rect = NSRect(origin: .zero, size: size)
NSBezierPath.fill(rect)

// Set gold color (#C5A059)
let goldColor = NSColor(red: 197/255.0, green: 160/255.0, blue: 89/255.0, alpha: 1.0)
goldColor.setStroke()
goldColor.setFill()

// 1. Outer Ring
let outerPath = NSBezierPath(ovalIn: NSRect(x: 2, y: 2, width: 28, height: 28))
outerPath.lineWidth = 1.25
outerPath.stroke()

// 2. Inner Dashed Ring
let innerPath = NSBezierPath(ovalIn: NSRect(x: 5, y: 5, width: 22, height: 22))
innerPath.lineWidth = 0.75
let pattern: [CGFloat] = [1.5, 1.5]
innerPath.setLineDash(pattern, count: 2, phase: 0.0)
innerPath.stroke()

// 3. Monogram W (drawing from top to bottom in Cocoa coordinate system)
let wPath = NSBezierPath()
wPath.move(to: NSPoint(x: 8.5, y: 19))
wPath.line(to: NSPoint(x: 12.5, y: 11))
wPath.line(to: NSPoint(x: 16, y: 18))
wPath.line(to: NSPoint(x: 19.5, y: 11))
wPath.line(to: NSPoint(x: 23.5, y: 19))
wPath.lineWidth = 1.5
wPath.lineCapStyle = .round
wPath.lineJoinStyle = .round
wPath.stroke()

// 4. Accent Dot at the top
let dotPath = NSBezierPath(ovalIn: NSRect(x: 14.5, y: 21.5, width: 3, height: 3))
dotPath.fill()

image.unlockFocus()

// Save to PNG
if let tiffData = image.tiffRepresentation,
   let bitmap = NSBitmapImageRep(data: tiffData),
   let pngData = bitmap.representation(using: .png, properties: [:]) {
    do {
        try pngData.write(to: URL(fileURLWithPath: "/Users/hello/Documents/wealth-whisper-tracker/public/favicon.png"))
        print("SUCCESS")
    } catch {
        print("WRITE_FAILED")
    }
} else {
    print("CONVERSION_FAILED")
}
