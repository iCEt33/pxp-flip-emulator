// PxP Flip OS v6 - Pixel Perfect Layout System

// States
const OFF = 0;
const BOOT = 1;
const HOME = 2;
const MENU = 3;
const APP = 4;
const DIALER_INPUT = 5;
const DIALER_OPTIONS = 6;

// Screen states
const SCREEN_NORMAL = 0;
const SCREEN_DIMMED = 1;
const SCREEN_SLEEP = 2;

// Global OS state
let state = OFF;
let menuIdx = 0;
let appIdx = 0;
let screenState = SCREEN_NORMAL;

// Debug mode
let debugMode = false;
let debugPressCount = 0;
let debugPressTimer = null;

// Timers
let dimTimer = null;
let sleepTimer = null;
let outerTimer = null;
let outerFadeTimer = null;

// Dialer state
let dialerDigits = [];
let dialerCursor = 0;
let dialerCursorVisible = true;
let dialerCursorTimer = null;
let dialerBlinkTimer = null;
let dialerStarPressTime = 0;
let dialerClearTimer = null;

// Display config
const DIGIT_SIZES = {
    LARGE: 8,
    MEDIUM: 4,
    SMALL: 2
};

const menuNames = ["Messages", "Contacts", "Calendar", "Wallet"];

// Pixel digit definitions
const digits = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[1,1,1],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[1,1,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,1,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,1,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,1,0],[1,0,0],[1,0,0]],
    '8': [[1,1,1],[1,0,1],[1,1,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,1,1],[0,0,1],[1,1,1]],
    ':': [[0],[1],[0],[1],[0]],
    '.': [[0],[0],[0],[0],[1]],
    '%': [[1,0,1],[0,0,1],[0,1,0],[1,0,0],[1,0,1]],
    '+': [[0,0,0],[0,1,0],[1,1,1],[0,1,0],[0,0,0]],
    '*': [[1,0,1],[0,1,0],[1,1,1],[0,1,0],[1,0,1]],
    '#': [[0,1,0],[1,1,1],[0,1,0],[1,1,1],[0,1,0]]
};

const signalBars = [
    [[0],[0],[0],[1],[1]],
    [[0],[0],[1],[1],[1]],
    [[0],[1],[1],[1],[1]],
    [[1],[1],[1],[1],[1]]
];

// ==================== LAYOUT SYSTEM ====================

const Layout = {
    measure: {
        digit: (char, pixelSize) => {
            let grid = digits[char];
            if (!grid) return { width: 0, height: 0 };
            return {
                width: grid[0].length * pixelSize,
                height: grid.length * pixelSize
            };
        },
        
        digitString: (str, pixelSize) => {
            let width = 0;
            let maxHeight = 0;
            
            for (let i = 0; i < str.length; i++) {
                let grid = digits[str[i]];
                if (grid) {
                    width += grid[0].length * pixelSize;
                    if (i < str.length - 1) width += pixelSize;
                    maxHeight = Math.max(maxHeight, grid.length * pixelSize);
                }
            }
            
            return { width, height: maxHeight };
        },
        
        signalBars: (pixelSize) => {
            return {
                width: 4 * pixelSize + 3 * pixelSize,
                height: 5 * pixelSize
            };
        }
    },
    
    centerX: (screenWidth, elementWidth) => (screenWidth - elementWidth) / 2,
    centerY: (screenHeight, elementHeight) => (screenHeight - elementHeight) / 2,
    alignRight: (screenWidth, elementWidth, margin = 0) => screenWidth - elementWidth - margin,
    alignBottom: (screenHeight, elementHeight, margin = 0) => screenHeight - elementHeight - margin
};

// ==================== DRAWING PRIMITIVES ====================

function drawText(ctx, x, y, text, size, color) {
    ctx.fillStyle = color;
    ctx.font = size + "px monospace";
    ctx.fillText(text, x, y);
}

function drawRect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawDebugBox(ctx, bounds, color = '#ff0000') {
    if (!debugMode) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
}

// ==================== DRAWING FUNCTIONS WITH BOUNDS ====================

function drawPixelDigit(ctx, x, y, digit, pixelSize, color) {
    let grid = digits[digit];
    if (!grid) return { x, y, width: 0, height: 0 };
    
    for (let row = 0; row < grid.length; row++) {
        for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] === 1) {
                drawRect(ctx, x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize, color);
            }
        }
    }
    
    let bounds = {
        x: x,
        y: y,
        width: grid[0].length * pixelSize,
        height: grid.length * pixelSize
    };
    
    drawDebugBox(ctx, bounds, '#00ff00');
    return bounds;
}

function drawDigitString(ctx, x, y, str, pixelSize, color) {
    let startX = x;
    let currentX = x;
    let maxHeight = 0;
    
    for (let i = 0; i < str.length; i++) {
        let bounds = drawPixelDigit(ctx, currentX, y, str[i], pixelSize, color);
        currentX += bounds.width + pixelSize;
        maxHeight = Math.max(maxHeight, bounds.height);
    }
    
    let totalBounds = {
        x: startX,
        y: y,
        width: currentX - startX - pixelSize,
        height: maxHeight
    };
    
    drawDebugBox(ctx, totalBounds, '#ffff00');
    return totalBounds;
}

function drawSignalBars(ctx, x, y, pixelSize, color) {
    let strength = 3;
    
    for (let barIdx = 0; barIdx < 4; barIdx++) {
        let barGrid = signalBars[barIdx];
        let barX = x + barIdx * (pixelSize + pixelSize);
        
        for (let row = 0; row < barGrid.length; row++) {
            if (barGrid[row][0] === 1) {
                drawRect(ctx, barX, y + row * pixelSize, pixelSize, pixelSize, color);
            }
        }
    }
    
    let bounds = {
        x: x,
        y: y,
        width: 4 * pixelSize + 3 * pixelSize,
        height: 5 * pixelSize
    };
    
    drawDebugBox(ctx, bounds, '#0000ff');
    return bounds;
}

function drawStatus(ctx, screenWidth) {
    drawRect(ctx, 0, 0, screenWidth, 36, "#111");
    
    let signalX = 10;
    let signalY = 8;
    let signalBounds = drawSignalBars(ctx, signalX, signalY, 4, "#0f0");
    
    let batteryStr = String(hardwareAPI.getBatteryPercent()) + '%';
    let batterySize = Layout.measure.digitString(batteryStr, 4);
    let batteryX = Layout.alignRight(screenWidth, batterySize.width, 10);
    let batteryY = 8;
    let batteryBounds = drawDigitString(ctx, batteryX, batteryY, batteryStr, 4, "#0f0");
    
    return {
        x: 0,
        y: 0,
        width: screenWidth,
        height: 36,
        signal: signalBounds,
        battery: batteryBounds
    };
}

// ==================== DIALER FUNCTIONS ====================

function startDialerCursorBlink() {
    if (dialerBlinkTimer) {
        clearInterval(dialerBlinkTimer);
    }
    
    dialerCursorVisible = true;
    hardwareAPI.requestInnerFrame();
    
    dialerBlinkTimer = setInterval(function() {
        dialerCursorVisible = !dialerCursorVisible;
        hardwareAPI.requestInnerFrame();
    }, 1000);
}

function resetDialerCursorBlink() {
    if (dialerBlinkTimer) {
        clearInterval(dialerBlinkTimer);
    }
    if (dialerCursorTimer) {
        clearTimeout(dialerCursorTimer);
    }
    
    // Hide cursor for 0.25s
    dialerCursorVisible = false;
    hardwareAPI.requestInnerFrame();
    
    dialerCursorTimer = setTimeout(function() {
        startDialerCursorBlink();
    }, 250);
}

function enterDialer() {
    state = DIALER_INPUT;
    dialerDigits = [];
    dialerCursor = 0;
    dialerCursorVisible = true;
    startDialerCursorBlink();
    hardwareAPI.requestInnerFrame();
    printf("Dialer opened");
}

function exitDialer() {
    if (dialerBlinkTimer) {
        clearInterval(dialerBlinkTimer);
        dialerBlinkTimer = null;
    }
    if (dialerCursorTimer) {
        clearTimeout(dialerCursorTimer);
        dialerCursorTimer = null;
    }
    if (dialerClearTimer) {
        clearTimeout(dialerClearTimer);
        dialerClearTimer = null;
    }
    
    state = HOME;
    hardwareAPI.requestInnerFrame();
    printf("Dialer closed");
}

function insertDialerDigit(digit) {
    dialerDigits.splice(dialerCursor, 0, digit);
    dialerCursor++;
    resetDialerCursorBlink();
    
    // Clear the auto-exit timer if it was running
    if (dialerClearTimer) {
        clearTimeout(dialerClearTimer);
        dialerClearTimer = null;
    }
}

function deleteDialerDigit() {
    if (dialerCursor > 0) {
        dialerDigits.splice(dialerCursor - 1, 1);
        dialerCursor--;
        resetDialerCursorBlink();
    }
    
    // If no digits left, exit after 0.5s
    if (dialerDigits.length === 0) {
        if (dialerClearTimer) {
            clearTimeout(dialerClearTimer);
        }
        dialerClearTimer = setTimeout(function() {
            exitDialer();
        }, 500);
    }
}

function moveDialerCursor(direction) {
    let pixelSize = dialerDigits.length >= 14 ? DIGIT_SIZES.MEDIUM : DIGIT_SIZES.LARGE;
    let digitsPerLine = (pixelSize === DIGIT_SIZES.LARGE) ? 7 : 13;
    
    if (direction === 'LEFT') {
        if (dialerCursor > 0) {
            dialerCursor--;
            resetDialerCursorBlink();
        }
    } else if (direction === 'RIGHT') {
        if (dialerCursor < dialerDigits.length) {
            dialerCursor++;
            resetDialerCursorBlink();
        }
    } else if (direction === 'UP') {
        // Move up digitsPerLine positions
        if (dialerCursor >= digitsPerLine) {
            dialerCursor -= digitsPerLine;
            resetDialerCursorBlink();
        }
    } else if (direction === 'DOWN') {
        // Move down digitsPerLine positions
        if (dialerCursor + digitsPerLine <= dialerDigits.length) {
            dialerCursor += digitsPerLine;
            resetDialerCursorBlink();
        }
    }
}

// ==================== SCREEN DRAW FUNCTIONS ====================

function drawInnerScreen(ctx) {
    drawRect(ctx, 0, 0, 240, 320, "#000");
    
    if (state === BOOT) {
        drawText(ctx, 90, 160, "PxP", 48, "#0f0");
        
        if (debugMode) {
            drawText(ctx, 70, 200, "[DEBUG]", 14, "#ff0000");
        }
    }
    else if (state === HOME) {
        let statusBounds = drawStatus(ctx, 240);
        
        let d = new Date();
        let h = String(d.getHours()).padStart(2, '0');
        let m = String(d.getMinutes()).padStart(2, '0');
        let s = String(d.getSeconds()).padStart(2, '0');
        
// Gap between clock and the day/seconds column - CHANGE THIS ONE NUMBER
        let clockGap = 8;
        
        // Main clock - centered, then shifted left so the whole cluster stays centered
        let clockStr = h[0] + h[1] + ':' + m[0] + m[1];
        let clockSize = Layout.measure.digitString(clockStr, DIGIT_SIZES.LARGE);
        let clockX = Layout.centerX(240, clockSize.width) - Math.round(14 + clockGap / 2);
        let clockY = 120;
        let clockBounds = drawDigitString(ctx, clockX, clockY, clockStr, DIGIT_SIZES.LARGE, "#0f0");
        
        // Day name
        let days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
        let dayStr = days[d.getDay()];
        drawText(ctx, clockBounds.x + clockBounds.width + clockGap, clockY + 12, dayStr, 16, "#0f0");
        
        // Seconds
        let secStr = s[0] + s[1];
        let secY = clockY + 20;
        let secX = clockBounds.x + clockBounds.width + clockGap;
        drawDigitString(ctx, secX, secY, secStr, DIGIT_SIZES.MEDIUM, "#0f0");
        
        // Date
        let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        let monthStr = months[d.getMonth()];
        let dateY = clockBounds.y + clockBounds.height + DIGIT_SIZES.LARGE;
        
        drawText(ctx, clockBounds.x, dateY + 10, monthStr, 12, "#0f0");
        
        let day = String(d.getDate()).padStart(2, '0');
        let year = String(d.getFullYear());
        
        let firstHourDigitSize = Layout.measure.digit(h[0], DIGIT_SIZES.LARGE);
        let dayStartX = clockBounds.x + firstHourDigitSize.width;
        
        let dayBounds = drawDigitString(ctx, dayStartX, dateY, day, DIGIT_SIZES.SMALL, "#0f0");
        
        let dotX = dayBounds.x + dayBounds.width + DIGIT_SIZES.SMALL;
        let dotBounds = drawPixelDigit(ctx, dotX, dateY, '.', DIGIT_SIZES.SMALL, "#0f0");
        
        let yearX = dotBounds.x + dotBounds.width + DIGIT_SIZES.LARGE;
        drawDigitString(ctx, yearX, dateY, year, DIGIT_SIZES.SMALL, "#0f0");
        
        if (debugMode) {
            drawText(ctx, 5, 315, "[DEBUG MODE]", 10, "#ff0000");
        }
    }
    else if (state === MENU) {
        let statusBounds = drawStatus(ctx, 240);
        
        drawText(ctx, 50, 80, menuNames[menuIdx], 24, "#fff");
        drawText(ctx, 40, 200, "<", 20, "#666");
        drawText(ctx, 200, 200, ">", 20, "#666");
        
        for (let i = 0; i < menuNames.length; i++) {
            let dotX = 80 + i * 25;
            ctx.beginPath();
            ctx.arc(dotX, 195, i === menuIdx ? 5 : 3, 0, 2 * Math.PI);
            ctx.fillStyle = i === menuIdx ? "#fff" : "#666";
            ctx.fill();
        }
        
        drawRect(ctx, 0, 285, 240, 35, "#0a0a0a");
        drawText(ctx, 10, 308, "Select", 14, "#888");
        drawText(ctx, 180, 308, "Back", 14, "#888");
    }
    else if (state === APP) {
        let statusBounds = drawStatus(ctx, 240);
        
        drawText(ctx, 40, 130, menuNames[appIdx], 24, "#fff");
        drawText(ctx, 50, 170, "Coming soon", 16, "#888");
        drawText(ctx, 45, 195, "RIGHT to exit", 14, "#888");
    }
    else if (state === DIALER_INPUT) {
        drawRect(ctx, 0, 0, 240, 320, "#000");
        
        // Determine font size and line capacity
        let pixelSize = dialerDigits.length >= 14 ? DIGIT_SIZES.MEDIUM : DIGIT_SIZES.LARGE;
        let digitWidth = 3 * pixelSize;
        let digitHeight = 5 * pixelSize;
        let gapSize = pixelSize;
        
        // Line capacity depends on font size
        let digitsPerLine = (pixelSize === DIGIT_SIZES.LARGE) ? 7 : 13;
        
        // Soft key labels at bottom
        let softKeyY = 285;
        drawRect(ctx, 0, softKeyY, 240, 35, "#0a0a0a");
        drawText(ctx, 10, softKeyY + 23, "Options", 14, "#888");
        drawText(ctx, 180, softKeyY + 23, "Clear", 14, "#888");
        
        // Calculate available height for digits
        let maxY = softKeyY - 10;
        let lineHeight = digitHeight + gapSize;
        
        let totalDigits = dialerDigits.length;
        
        if (totalDigits === 0) {
            // Show empty cursor at starting position (bottom right)
            if (dialerCursorVisible) {
                let cursorWidth = Math.max(1, Math.floor(pixelSize / 5));
                let cursorX = 240 - 10 - Math.floor(gapSize / 2);
                let cursorY = maxY - digitHeight;
                drawRect(ctx, cursorX, cursorY, cursorWidth, digitHeight, "#0f0");
            }
        } else {
            // ALL digits flow continuously from right to left
            // Line 1 (bottom) shows rightmost digitsPerLine digits
            // Line 2 shows previous digitsPerLine digits
            // etc.
            
            let bottomY = maxY - digitHeight;
            let totalLines = Math.ceil(totalDigits / digitsPerLine);
            
            // Draw each line from bottom to top
            for (let lineNum = 0; lineNum < totalLines; lineNum++) {
                // Line numbering: 0 = bottom (Line 1), 1 = above (Line 2), etc.
                let lineY = bottomY - lineNum * lineHeight;
                
                // Which digits are on this line?
                // Line 0 (bottom) gets the LAST digitsPerLine digits
                // Line 1 gets the previous digitsPerLine digits, etc.
                let startFromEnd = (lineNum + 1) * digitsPerLine;
                let endFromEnd = lineNum * digitsPerLine;
                
                let lineStart = Math.max(0, totalDigits - startFromEnd);
                let lineEnd = totalDigits - endFromEnd;
                let lineDigitCount = lineEnd - lineStart;
                
                // Calculate line width and starting X (right-aligned)
                let lineWidth = lineDigitCount * digitWidth + (lineDigitCount > 0 ? (lineDigitCount - 1) * gapSize : 0);
                let lineStartX = 240 - lineWidth - 10;
                
                let currentX = lineStartX;
                
                // Draw gaps and digits for this line
                for (let i = 0; i <= lineDigitCount; i++) {
                    let globalIdx = lineStart + i;
                    
                    // Draw cursor
                    if (dialerCursor === globalIdx && dialerCursorVisible) {
                        let cursorWidth = Math.max(1, Math.floor(pixelSize / 5));
                        let cursorX = currentX - Math.floor(gapSize / 2);
                        drawRect(ctx, cursorX, lineY, cursorWidth, digitHeight, "#0f0");
                    }
                    
                    // Draw digit
                    if (i < lineDigitCount) {
                        drawPixelDigit(ctx, currentX, lineY, dialerDigits[lineStart + i], pixelSize, "#0f0");
                        currentX += digitWidth + gapSize;
                    }
                }
            }
        }
    }
}

function drawOuterScreen(ctx) {
    drawRect(ctx, 0, 0, 128, 128, "#000");
    
    if (state === OFF) return;
    
    let signalBounds = drawSignalBars(ctx, 4, 4, 2, "#0f0");
    
    let batteryStr = String(hardwareAPI.getBatteryPercent()) + '%';
    let batterySize = Layout.measure.digitString(batteryStr, 2);
    let batteryX = Layout.alignRight(128, batterySize.width, 4);
    let batteryY = 4;
    drawDigitString(ctx, batteryX, batteryY, batteryStr, 2, "#0f0");
    
    let d = new Date();
    let h = String(d.getHours()).padStart(2, '0');
    let m = String(d.getMinutes()).padStart(2, '0');
    
    let clockStr = h[0] + h[1] + ':' + m[0] + m[1];
    let clockSize = Layout.measure.digitString(clockStr, 6);
    let clockX = Layout.centerX(128, clockSize.width);
    let clockY = 35;
    let clockBounds = drawDigitString(ctx, clockX, clockY, clockStr, 6, "#0f0");
    
    let months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    let day = String(d.getDate()).padStart(2, '0');
    let year = String(d.getFullYear());
    
    let monthStr = months[d.getMonth()];
    let dateY = clockBounds.y + clockBounds.height + 6;
    
    let monthX = clockBounds.x;
    drawText(ctx, monthX, dateY + 10, monthStr, 9, "#0f0");
    
    let firstHourDigitSize = Layout.measure.digit(h[0], 6);
    let dayStartX = clockBounds.x + firstHourDigitSize.width;
    
    let dayBounds = drawDigitString(ctx, dayStartX, dateY, day, 2, "#0f0");
    
    let dotX = dayBounds.x + dayBounds.width + 2;
    let dotBounds = drawPixelDigit(ctx, dotX, dateY, '.', 2, "#0f0");
    
    let yearX = dotBounds.x + dotBounds.width + 6;
    drawDigitString(ctx, yearX, dateY, year, 2, "#0f0");
}

// ==================== OS FADE ANIMATIONS ====================

function fadeInOuterScreen() {
    if (outerFadeTimer) clearInterval(outerFadeTimer);
    
    const startBrightness = 0;
    const targetBrightness = 100;
    const duration = 1000;
    const steps = duration / 30;
    let currentStep = 0;
    
    outerFadeTimer = setInterval(function() {
        currentStep++;
        const progress = currentStep / steps;
        const brightness = startBrightness + (targetBrightness - startBrightness) * progress;
        
        hardwareAPI.setOuterBrightness(brightness);
        
        if (currentStep >= steps) {
            clearInterval(outerFadeTimer);
            outerFadeTimer = null;
            hardwareAPI.setOuterBrightness(targetBrightness);
        }
    }, 30);
}

function fadeOutOuterScreen() {
    if (outerFadeTimer) clearInterval(outerFadeTimer);
    
    const startBrightness = 100;
    const targetBrightness = 0;
    const duration = 1000;
    const steps = duration / 30;
    let currentStep = 0;
    
    outerFadeTimer = setInterval(function() {
        currentStep++;
        const progress = currentStep / steps;
        const brightness = startBrightness + (targetBrightness - startBrightness) * progress;
        
        hardwareAPI.setOuterBrightness(brightness);
        
        if (currentStep >= steps) {
            clearInterval(outerFadeTimer);
            outerFadeTimer = null;
            hardwareAPI.setOuterBrightness(targetBrightness);
        }
    }, 30);
}

// ==================== TIMER MANAGEMENT ====================

function clearScreenTimers() {
    if (dimTimer) clearTimeout(dimTimer);
    if (sleepTimer) clearTimeout(sleepTimer);
    dimTimer = null;
    sleepTimer = null;
}

function clearOuterTimer() {
    if (outerTimer) clearTimeout(outerTimer);
    outerTimer = null;
}

function clearOuterFadeTimer() {
    if (outerFadeTimer) clearInterval(outerFadeTimer);
    outerFadeTimer = null;
}

function startScreenTimers() {
    clearScreenTimers();
    screenState = SCREEN_NORMAL;
    hardwareAPI.setInnerBrightness(100);
    
    dimTimer = setTimeout(function() {
        printf("Dim");
        screenState = SCREEN_DIMMED;
        hardwareAPI.setInnerBrightness(50);
    }, 20000);
    
    sleepTimer = setTimeout(function() {
        printf("Sleep");
        screenState = SCREEN_SLEEP;
        hardwareAPI.setInnerBrightness(0);
    }, 30000);
}

function startOuterTimer() {
    clearOuterTimer();
    
    outerTimer = setTimeout(function() {
        printf("Outer timeout");
        fadeOutOuterScreen();
    }, 5000);
}

setInterval(function() {
    if (hardwareAPI.isFlipOpen() && state !== OFF && screenState !== SCREEN_SLEEP) {
        hardwareAPI.requestInnerFrame();
    }
    if (!hardwareAPI.isFlipOpen() && state !== OFF) {
        hardwareAPI.requestOuterFrame();
    }
}, 1000);

// ==================== DEBUG MODE ====================

function handleDebugToggle() {
    debugPressCount++;
    
    if (debugPressTimer) clearTimeout(debugPressTimer);
    
    if (debugPressCount >= 3) {
        debugMode = !debugMode;
        printf(debugMode ? "Debug mode ON" : "Debug mode OFF");
        debugPressCount = 0;
        hardwareAPI.requestInnerFrame();
        return true;
    }
    
    debugPressTimer = setTimeout(function() {
        debugPressCount = 0;
    }, 1000);
    
    return false;
}

// ==================== HARDWARE CALLBACKS ====================

function onPowerOn() {
    printf("Power ON");
    state = BOOT;
    screenState = SCREEN_NORMAL;
    hardwareAPI.setInnerBrightness(100);
    hardwareAPI.requestInnerFrame();
    
    setTimeout(function() {
        state = HOME;
        hardwareAPI.requestInnerFrame();
        startScreenTimers();
    }, 2000);
}

function onPowerOff() {
    printf("Power OFF");
    state = OFF;
    screenState = SCREEN_NORMAL;
    debugMode = false;
    debugPressCount = 0;
    clearScreenTimers();
    clearOuterTimer();
    clearOuterFadeTimer();
}

function onButtonPress(btn) {
    if (state === OFF) return;
    
    if (btn === 'VOL_UP') {
        if (handleDebugToggle()) return;
    }
    
    if (screenState === SCREEN_SLEEP) {
        printf("Wake from sleep");
        screenState = SCREEN_NORMAL;
        hardwareAPI.setInnerBrightness(100);
        hardwareAPI.requestInnerFrame();
        startScreenTimers();
        return;
    }
    
    if (screenState === SCREEN_DIMMED) {
        printf("Wake from dim");
        screenState = SCREEN_NORMAL;
        hardwareAPI.setInnerBrightness(100);
        hardwareAPI.requestInnerFrame();
        startScreenTimers();
    }
    
    if (screenState === SCREEN_NORMAL) {
        startScreenTimers();
    }
    
    // ==================== DIALER_INPUT STATE ====================
    if (state === DIALER_INPUT) {
        // Number keys
        if (btn.startsWith('NUM_')) {
            let digit = btn.replace('NUM_', '');
            if (digit === 'STAR') {
                // Check if we should convert * to +
                let now = Date.now();
                if (now - dialerStarPressTime < 1000 && dialerDigits[dialerCursor - 1] === '*') {
                    // Replace last * with +
                    dialerDigits[dialerCursor - 1] = '+';
                    resetDialerCursorBlink();
                } else {
                    insertDialerDigit('*');
                    dialerStarPressTime = now;
                }
            } else if (digit === 'HASH') {
                insertDialerDigit('#');
            } else {
                insertDialerDigit(digit);
            }
        }
        // Arrow keys for cursor movement
        else if (btn === 'ARROW_LEFT') {
            moveDialerCursor('LEFT');
        }
        else if (btn === 'ARROW_RIGHT') {
            moveDialerCursor('RIGHT');
        }
        else if (btn === 'ARROW_UP') {
            moveDialerCursor('UP');
        }
        else if (btn === 'ARROW_DOWN') {
            moveDialerCursor('DOWN');
        }
        // BTN_RIGHT is delete/clear
        else if (btn === 'BTN_RIGHT') {
            deleteDialerDigit();
        }
        // BTN_LEFT opens options (not implemented yet)
        else if (btn === 'BTN_LEFT') {
            printf("Options menu - not implemented");
        }
        // BTN_OK and BTN_CALL both call (not implemented yet)
        else if (btn === 'BTN_OK' || btn === 'BTN_CALL') {
            printf("Call - not implemented");
        }
        return;
    }
    
    // ==================== HOME STATE ====================
    // From HOME, number keys enter dialer
    if (state === HOME && btn.startsWith('NUM_')) {
        enterDialer();
        // Process this digit
        let digit = btn.replace('NUM_', '');
        if (digit === 'STAR') {
            insertDialerDigit('*');
            dialerStarPressTime = Date.now();
        } else if (digit === 'HASH') {
            insertDialerDigit('#');
        } else {
            insertDialerDigit(digit);
        }
        return;
    }
    
    if (btn === "BTN_OK") {
        if (state === HOME) {
            printf("Menu");
            state = MENU;
            menuIdx = 0;
            hardwareAPI.requestInnerFrame();
        } else if (state === MENU) {
            printf("App: " + menuNames[menuIdx]);
            state = APP;
            appIdx = menuIdx;
            hardwareAPI.requestInnerFrame();
        }
    }
    else if (btn === "BTN_LEFT") {
        if (state === MENU) {
            printf("Select: " + menuNames[menuIdx]);
            state = APP;
            appIdx = menuIdx;
            hardwareAPI.requestInnerFrame();
        }
    }
    else if (btn === "BTN_RIGHT") {
        if (state === APP) {
            printf("Back to menu");
            state = MENU;
            hardwareAPI.requestInnerFrame();
        } else if (state === MENU) {
            printf("Back to home");
            state = HOME;
            hardwareAPI.requestInnerFrame();
        }
    }
    else if (btn === "ARROW_LEFT") {
        if (state === MENU) {
            menuIdx = menuIdx - 1;
            if (menuIdx < 0) menuIdx = menuNames.length - 1;
            printf(menuNames[menuIdx]);
            hardwareAPI.requestInnerFrame();
        }
    }
    else if (btn === "ARROW_RIGHT") {
        if (state === MENU) {
            menuIdx = menuIdx + 1;
            if (menuIdx >= menuNames.length) menuIdx = 0;
            printf(menuNames[menuIdx]);
            hardwareAPI.requestInnerFrame();
        }
    }
}

function onButtonRelease(btn) {
    // Not used
}

function onFlipChange(open) {
    printf(open ? "Flip open" : "Flip closed");
    
    if (open) {
        clearOuterTimer();
        clearOuterFadeTimer();
        hardwareAPI.setOuterBrightness(0);
        
        if (state !== OFF) {
            screenState = SCREEN_NORMAL;
            hardwareAPI.setInnerBrightness(100);
            hardwareAPI.requestInnerFrame();
            startScreenTimers();
        }
    } else {
        clearScreenTimers();
        hardwareAPI.setInnerBrightness(0);
        
        if (state !== OFF) {
            hardwareAPI.requestOuterFrame();
            fadeInOuterScreen();
            startOuterTimer();
        }
    }
}

function onVolumePress() {
    if (!hardwareAPI.isFlipOpen() && state !== OFF) {
        const currentBrightness = hardwareAPI.getOuterBrightness();
        
        if (outerFadeTimer || currentBrightness > 0) {
            printf("Outer screen active - reset timer");
            startOuterTimer();
            return;
        }
        
        hardwareAPI.requestOuterFrame();
        fadeInOuterScreen();
        startOuterTimer();
    }
}

function onBatteryChange(percent) {
    if (hardwareAPI.isFlipOpen() && state !== OFF && screenState !== SCREEN_SLEEP) {
        hardwareAPI.requestInnerFrame();
    }
    if (!hardwareAPI.isFlipOpen() && state !== OFF) {
        hardwareAPI.requestOuterFrame();
    }
}

function osInit() {
    state = OFF;
    menuIdx = 0;
    appIdx = 0;
    screenState = SCREEN_NORMAL;
    debugMode = false;
    debugPressCount = 0;
    clearScreenTimers();
    clearOuterTimer();
    clearOuterFadeTimer();
    
    // Clear dialer timers
    dialerDigits = [];
    dialerCursor = 0;
    if (dialerBlinkTimer) {
        clearInterval(dialerBlinkTimer);
        dialerBlinkTimer = null;
    }
    if (dialerCursorTimer) {
        clearTimeout(dialerCursorTimer);
        dialerCursorTimer = null;
    }
    if (dialerClearTimer) {
        clearTimeout(dialerClearTimer);
        dialerClearTimer = null;
    }
    
    printf("OS Ready - Hold HANGUP 3s to power on");
    printf("Press VOL_UP 3x in 1s for debug mode");
}