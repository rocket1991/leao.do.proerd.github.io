const FPS_INTERVAL = 1000 / 144;

let speed = 1.25;
let paused = false;
let animationId;
let lastUpdate = performance.now();

const logoContainer = document.getElementById("logo-container");
const logoImg = document.getElementById("logo");
const settingsPanel = document.getElementById("settings");
const speedInput = document.getElementById("logo-speed");
speedInput.value = speed;
const bgColorInput = document.getElementById("bg-color-input");

let windowWidth = window.innerWidth;
let windowHeight = window.innerHeight;
let logoWidth = 0;
let logoHeight = 0;

let directionX = Math.random() < 0.5 ? "east" : "west";
let directionY = Math.random() < 0.5 ? "south" : "north";
let currentX = null;
let currentY = null;

let currentHueRotate = 0;
let logoSources = [];
let logoSourceIndex = 0;

function animate() {
    animationId = requestAnimationFrame(animate);

    const now = performance.now();
    const elapsed = now - lastUpdate;

    if (elapsed <= FPS_INTERVAL) {
        return;
    }

    const [maxX, maxY] = getMaxXY();

    if (currentX >= maxX || currentX <= 0) {
        directionX = currentX <= 0 ? "east" : "west";
        onBorderHit();
    }
    if (currentY >= maxY || currentY <= 0) {
        directionY = currentY <= 0 ? "south" : "north";
        onBorderHit();
    }

    currentX += directionX === "east" ? speed : -speed;
    currentY += directionY === "south" ? speed : -speed;
    setLogoPosition(currentX, currentY);

    // Get ready for next frame by setting lastUpdate=now, but also adjust for
    // FPS_INTERVAL not being a multiple of RAF's interval (16.7ms)
    lastUpdate = now - (elapsed % FPS_INTERVAL);
}

function setLogoPosition(x, y) {
    logoImg.animate(
        {
            transform: `translate(${x}px, ${y}px)`
        },
        {
            duration: 0,
            fill: "forwards",
            easing: "ease"
        }
    );
}

function onBorderHit() {
    //if (logoSources.length > 0) {
    //    setLogoHue(0, false);
    //    changeLogo(logoSources[++logoSourceIndex % logoSources.length]);
    //    return;
    //}

    //let newHueRotate = Math.random() * 360;
    // Ensure that new color is different enough from the last one
    //const hueOffset = Math.abs(currentHueRotate - newHueRotate);
    //if (hueOffset < 90) {
    //    newHueRotate = currentHueRotate + 180;
    //}
    //setLogoHue(newHueRotate);
    //currentHueRotate = newHueRotate;
}

function getMaxXY() {
    return [windowWidth - logoWidth, windowHeight - logoHeight];
}

function updateDimensions() {
    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;
    logoWidth = logoImg.clientWidth;
    logoHeight = logoImg.clientHeight;
}

function play(sendEvent = true) {
    animationId = requestAnimationFrame(animate);
    document.getElementById("pause-notification").style.visibility = "hidden";
    sendEvent && trackEvent("animation", "play");
}

function pause() {
    cancelAnimationFrame(animationId);
    document.getElementById("pause-notification").style.visibility = "visible";
    trackEvent("animation", "pause");
}

function logoUpload() {
    const logoFiles = Array.from(document.getElementById("logo-upload").files);
    logoSources = logoFiles.map(URL.createObjectURL);
    if (logoSources.length > 0) {
        changeLogo(logoSources[0]);
        //setLogoHue(0, true);
        trackEvent("logo", "upload", "logo_count=" + logoSources.length);
    }
}

function changeLogo(src) {
    if (logoImg.src === src) {
        return;
    }
    logoImg.src = src;
}

function setLogoHue(hue, customImage = false) {
    if (customImage) {
        //logoContainer.style.filter = `hue-rotate(${hue}deg)`;
    } else {
        //logoContainer.style.filter = `invert(42%) sepia(93%) saturate(1352%) hue-rotate(${hue}deg) brightness(199%) contrast(119%)`;
    }
}

function speedChange() {
    const newSpeed = speedInput.value;
    if (newSpeed) {
        speed = +newSpeed;
    }
}

function speedChangeEnd() {
    const newSpeed = speedInput.value;
    if (newSpeed) {
        trackEvent("logo", "speed", "speed=" + newSpeed);
    }
}

function bgColorChange() {
    const newColor = bgColorInput.value;
    if (newColor) {
        document.body.style.background = newColor;
    }
}

function bgColorChangeEnd() {
    const newColor = bgColorInput.value;
    if (newColor) {
        trackEvent("bg", "color", "color=" + newColor);
    }
}

function enterFullscreen() {
    document.documentElement.requestFullscreen();
    trackEvent("fullscreen", "request_fullscreen");
}

function githubClick() {
    trackEvent("link_click", "github");
}

function inactivityTime() {
    let timerId;
    window.onload = resetTimer;
    window.onmousemove = resetTimer;
    window.onmousedown = resetTimer; // catches touchscreen presses as well
    window.ontouchstart = resetTimer; // catches touchscreen swipes as well
    window.ontouchmove = resetTimer; // required by some devices
    window.onclick = resetTimer; // catches touchpad clicks as well
    window.onkeydown = resetTimer;
    window.addEventListener("scroll", resetTimer, true);

    function idle() {
        settingsPanel.style.visibility = "hidden";
        document.querySelector("html").style.cursor = "none";
    }

    function resetTimer() {
        settingsPanel.style.visibility = "visible";
        document.querySelector("html").style.cursor = "auto";
        clearTimeout(timerId);
        timerId = setTimeout(idle, 2000);
    }
}

function trackEvent(category, action, label, value) {
    if (typeof ga !== "function") {
        return;
    }
    ga("send", category, action, label, value);
}

// Event listeners

window.addEventListener("click", (e) => {
    if (
        e.target.tagName !== "HTML" &&
        e.target.id !== "logo" &&
        e.target.id !== "pause-notification"
    ) {
        return;
    }
    paused ? play() : pause();
    paused = !paused;
});

window.addEventListener("resize", updateDimensions);

logoImg.addEventListener("load", () => {
    updateDimensions();

    if (!currentX || !currentY) {
        const [maxX, maxY] = getMaxXY();
        currentX ??= Math.random() * maxX;
        currentY ??= Math.random() * maxY;
        setLogoPosition(currentX, currentY);
        //setLogoHue(180);
    }
});
logoImg.addEventListener("error", () => alert("Error loading image"));

inactivityTime();

if (typeof ga === "function") {
    ga("send", "pageview");
}

// Start animation
if (!paused) {
    play(false);
}
