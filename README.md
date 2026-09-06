# PxP Flip — OS Emulator

A browser emulator for the PxP Flip, a small 4G flip phone with no browser and
no app store. It runs the real OS against a simulated hardware layer, so the
whole phone can be built and used before any of it physically exists.

No install, no build step, no dependencies.

**Try it: https://icet33.github.io/pxp-flip-emulator/**

Then hold the red hangup key for 3 seconds to switch the phone on.

---

## Files

| File | What it is |
|---|---|
| `index.html` | Landing page |
| `emulator.html` | The hardware emulator — screens, keys, battery, hinge, modem, SD |
| `pxp_os.js` | The operating system — every app, all drawing, all state |

The split is deliberate. `emulator.html` pretends to be the physical device and
holds no application logic. `pxp_os.js` is a port of the firmware that runs on
the ESP32-S3.

To run it from your own machine, download all three and open `emulator.html`.
If the OS does not load itself, click **Load**, pick `pxp_os.js`, and click
**Restart** — browsers block local file reads, so that path still works offline.

---

## Controls

| Control | Does |
|---|---|
| Hold red hangup 3s | Power on and off |
| **Close Flip** | Opens and shuts the hinge |
| **+** / **−** | Volume, down through vibrate to silent. Wakes the outer screen when shut |
| Number keys | Start dialling from the home screen |
| ◄ ► | Move through the menu, move the dialer cursor |
| Green circle | Select |
| LEFT / RIGHT softkeys | Options menu, back |
| **⚡ Charge** | Toggles the charger |

The hardware panel on the right simulates the things a phone has done to it:
incoming calls, incoming SMS, pulling the SIM, network loss, a flat battery.

The console is colour coded. Blue is hardware, green is the OS, red is an error.

---

## What is in it

**Working**

Home screen with clock and notification badges · dialer · multi-tap text input
with accent folding · contacts, with add, delete, call and message · messages,
threaded, send and receive · call log with icons, durations and delete ·
incoming calls, with ring, answer, decline, missed, ringtone picker and
silence-on-volume · outgoing calls with dialing state and answer detection ·
volume with vibrate and silent · voice memos, record, pause, play, seek ·
camera with live preview and shutter · gallery · SIM PIN and PUK entry ·
settings · screen dim, sleep and outer-screen fade · Apps and Games submenus

**Coming soon, on the phone as well as here**

Calendar · notes · calculator · alarms · file explorer · music · wallet ·
Snake, Tetris, Blackjack, Starfall and Doom

---

## Architecture

The hardware layer and the OS talk through a deliberately narrow API. The
hardware knows nothing about apps. The OS knows nothing about canvases. That is
what lets the same code run here and on real silicon.

**The OS asks the hardware for:**

```
getBatteryPercent()      isFlipOpen()
getInnerBrightness()     getOuterBrightness()
setInnerBrightness(n)    setOuterBrightness(n)
requestInnerFrame()      requestOuterFrame()
```

plus `modem`, `audio`, `storage`, `camera` and `sd`.

**The hardware tells the OS when something happens:**

```
onPowerOn()        onPowerOff()       onButtonPress(btn)
onButtonRelease()  onFlipChange()     onBatteryChange()
onVolumePress()    onIncomingCall()   onCallConnected()
onCallEnded()      onSMSReceived()
```

Brightness changes are instant at the hardware level. Every animation, fade and
timeout lives in the OS, which just calls `setBrightness` repeatedly. All state,
all timers and all decisions belong to the OS.

The display is drawn with a hand-built pixel font. Digits are 3×5 grids of
blocks with a one-block gap, so spacing scales with size automatically.

---

## The phone this is for

- ESP32-S3-WROOM-1, 16 MB flash, 8 MB octal PSRAM
- 2.4" TFT LCD, 320×240, ILI9341, inside
- 1.5" OLED, 128×128, SSD1351, outside
- A7670 4G modem — calls and SMS only, no data
- DVP camera on a flat flex
- microSD, removable battery, backlit keypad, USB-C, 3.5 mm jack

The OS runs on a breadboard today and makes real 4G calls with a real SIM. What
does not exist yet is a PCB, a hinge or a shell.

**Known missing on real hardware**

- **Call audio, both directions.** The modem breakout does not bring out its PCM
  pins, so calls connect, ring and time correctly in complete silence
- Battery percentage is hardcoded to 100. No divider, no gauge, no charger
- No real-time clock. Time comes from NTP over WiFi, so with no WiFi the phone
  does not know what time it is
- No vibration motor, and no headphone jack circuit
