# PxP Flip — OS Emulator

A browser-based emulator for the PxP Flip, a flip phone with an air-gapped
hardware wallet built in. Runs the real OS code against a simulated
hardware layer, so the whole interface can be built and tested before any
physical hardware exists.

No install, no build step, no dependencies. Open the HTML file and it runs.

---

## Files

| File | What it is |
|---|---|
| `emulator.html` | The hardware emulator — screens, buttons, battery, flip hinge |
| `pxp_os.js` | The operating system — all app logic, drawing, and state |

The split is deliberate. `emulator.html` pretends to be the physical device
and contains no application logic. `pxp_os.js` is the code that will
eventually be translated to C and flashed to an ESP32-S3.

---

## Running it

1. Open `emulator.html` in any browser (double-click it).
2. Click **Load** and pick `pxp_os.js`.
3. Click **Restart**.
4. Press and hold the red hangup button for 3 seconds to power on.

The left panel is a live code editor. Edit the OS there, hit **Restart**, and
the change is running immediately. **Save** downloads whatever is in the
editor back out as `pxp_os.js`.

The console at the bottom is colour-coded: blue is hardware, green is the OS,
red is an error.

---

## Controls

Everything is clicked with the mouse.

| Control | Does |
|---|---|
| Hold red hangup 3s | Power on / power off |
| **Close Flip** button | Opens and closes the hinge |
| **+** / **−** | Volume — wakes the outer screen when the flip is shut |
| Number keys | Start dialling from the home screen |
| ◄ ► | Move through the menu, or move the dialer cursor |
| Green circle (OK) | Select |
| LEFT / RIGHT | Context menu / back |
| **⚡ Charge** | Toggles the charger on and off |

---

## Architecture

The hardware layer and the OS talk through a deliberately narrow API. The
hardware knows nothing about apps; the OS knows nothing about canvases.

**The OS can ask the hardware for:**

```
getBatteryPercent()      isFlipOpen()
getInnerBrightness()     getOuterBrightness()
setInnerBrightness(n)    setOuterBrightness(n)
requestInnerFrame()      requestOuterFrame()
```

**The hardware tells the OS when something happens:**

```
onPowerOn()        onPowerOff()      onButtonPress(btn)
onButtonRelease()  onFlipChange()    onBatteryChange()
onVolumePress()
```

Brightness changes are instant at the hardware level. Every animation, fade,
and timeout lives in the OS, which just calls `setBrightness` repeatedly. All
state, all timers, and all decisions belong to the OS.

The display is drawn with a hand-built pixel font — digits are 3×5 grids of
blocks, and the gap between digits is one block wide, so spacing scales
automatically with size.

---

## Status

**Working**

- Hardware / OS separation
- Power on and off, boot screen
- Home screen with clock, date, battery, signal
- Screen dim at 20s, sleep at 30s, wake on any button
- Outer screen fade in and out on flip close
- Menu navigation
- Dialer with multi-line number entry and a blinking cursor
- Debug overlay

**Next**

- T9 text input
- Settings app
- Call and SMS simulation
- Phonebook, messages, call history

**Later**

- Alarm, stopwatch, notes, calendar, calculator
- Camera, music player
- Wallet — QR scan, offline signing, QR display

---

## Target hardware

The device this is being built for:

- ESP32-S3
- 2.4" TFT LCD, 320×240 (ILI9341) inside
- 1.5" OLED, 128×128 (SSD1351) outside
- A7670 4G modem — calls and SMS only, no data plan
- 3MP fixed-focus camera for QR scanning
- Removable ~1000mAh battery
