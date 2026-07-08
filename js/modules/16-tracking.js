// ============================================================
// DEVICE & LOCATION TRACKING LOGIC
// ============================================================
window.getDeviceDetails = function () {
    const ua = navigator.userAgent;
    let deviceType = "Desktop/Laptop";
    if (/Mobile|Android|iP(hone|od|ad)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        deviceType = "Smartphone/Tablet";
    }

    let os = "Unknown OS";
    if (ua.indexOf("Win") !== -1) os = "Windows";
    if (ua.indexOf("Mac") !== -1) os = "MacOS";
    if (ua.indexOf("X11") !== -1) os = "UNIX";
    if (ua.indexOf("Linux") !== -1) os = "Linux";
    if (/Android/.test(ua)) os = "Android";
    if (/iP(hone|od|ad)/.test(ua)) os = "iOS";

    let browser = "Unknown Browser";
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Internet";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "IE";
    else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    return `${deviceType} (${os} - ${browser})`;
}

window.getIpAndLocation = async function () {
    try {
        const response = await fetch('https://ipapi.co/json/');
        if (!response.ok) throw new Error("Network response was not ok");
        const data = await response.json();
        return {
            ip: data.org || data.ip || 'Unknown IP',
            location: `${data.city || 'Unknown City'}, ${data.country_name || 'Unknown Country'}`
        };
    } catch (e) {
        console.error("Gagal mendapatkan IP/Lokasi:", e);
        return { ip: 'Tidak terdeteksi', location: 'Tidak terdeteksi' };
    }
}

