/**
 * solarQibla.ts
 *
 * Astronomical calculations for Qibla direction, Solar position (Solar Azimuth & Altitude),
 * and the exact daily time when the Sun or its shadow aligns directly with the Qibla (Zill al-Qibla).
 *
 * References & Authorities:
 * 1. Jean Meeus, "Astronomical Algorithms", 2nd Ed.
 * 2. NOAA Solar Calculator equations.
 * 3. Classical Islamic Astronomy (البيروني، ابن الشاطر، وأعلام الفلك الشرعي).
 */

export interface SolarPosition {
  azimuth: number; // degrees from true North (0° = North, 90° = East, 180° = South, 270° = West)
  altitude: number; // degrees above horizon (-90° to +90°)
}

export interface DailySolarQiblaAlignment {
  qiblaAngle: number; // Qibla azimuth from True North
  sunAzimuthNow: number; // Current Sun azimuth
  sunAltitudeNow: number; // Current Sun altitude
  angleDifference: number; // Current difference between Sun and Qibla
  isDirectAlignment: boolean; // Is sun currently within +/- 1 degree of Qibla?
  isShadowAlignment: boolean; // Is shadow currently within +/- 1 degree of Qibla?
  alignmentTimeToday: string | null; // HH:MM time when Sun azimuth matches Qibla
  shadowAlignmentTimeToday: string | null; // HH:MM time when Shadow points towards Qibla (Sun is Qibla + 180°)
  isRasadAlQiblaDay: boolean; // May 27/28 or July 15/16 when Sun is directly above Kaaba at noon
  rasadAlQiblaUtcTime?: string;
}

const KAABA_LAT = 21.4225;
const KAABA_LON = 39.8262;

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

/**
 * Calculates Great-Circle Qibla Direction (Azimuth from True North)
 */
export function calculateQiblaAzimuth(lat: number, lon: number): number {
  const dLon = (KAABA_LON - lon) * DEG2RAD;
  const latRad = lat * DEG2RAD;
  const kaabaLatRad = KAABA_LAT * DEG2RAD;

  const y = Math.sin(dLon) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(latRad) * Math.sin(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(dLon);

  const bearing = Math.atan2(y, x) * RAD2DEG;
  return (bearing + 360) % 360;
}

/**
 * Calculates Solar Azimuth and Altitude for a given date and coordinates.
 */
export function calculateSolarPosition(date: Date, lat: number, lon: number): SolarPosition {
  // Julian Day
  const time = date.getTime();
  const julianDay = time / 86400000 + 2440587.5;
  const julianCentury = (julianDay - 2451545.0) / 36525.0;

  // Geometric Mean Longitude of the Sun (degrees)
  let geomMeanLongSun =
    (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
  if (geomMeanLongSun < 0) geomMeanLongSun += 360;

  // Geometric Mean Anomaly of the Sun (degrees)
  const geomMeanAnomSun = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);

  // Eccentricity of Earth's Orbit
  const eccentEarthOrbit = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);

  // Sun's Equation of the Center
  const sunEqCtr =
    Math.sin(geomMeanAnomSun * DEG2RAD) *
      (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) +
    Math.sin(2 * geomMeanAnomSun * DEG2RAD) * (0.019993 - 0.000101 * julianCentury) +
    Math.sin(3 * geomMeanAnomSun * DEG2RAD) * 0.000289;

  // Sun's True Longitude
  const sunTrueLong = geomMeanLongSun + sunEqCtr;

  // Sun's Apparent Longitude
  const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * julianCentury) * DEG2RAD);

  // Mean Obliquity of the Ecliptic
  const meanObliqEcliptic =
    23 +
    (26 +
      (21.448 -
        julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813)))) /
      60 /
      60;

  // Obliquity Correction
  const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos((125.04 - 1934.136 * julianCentury) * DEG2RAD);

  // Sun Declination
  const sunDeclin = Math.asin(Math.sin(obliqCorr * DEG2RAD) * Math.sin(sunAppLong * DEG2RAD)) * RAD2DEG;

  // Equation of Time (minutes)
  const yVal = Math.tan((obliqCorr / 2) * DEG2RAD) * Math.tan((obliqCorr / 2) * DEG2RAD);
  const eqOfTime =
    4 *
    RAD2DEG *
    (yVal * Math.sin(2 * geomMeanLongSun * DEG2RAD) -
      2 * eccentEarthOrbit * Math.sin(geomMeanAnomSun * DEG2RAD) +
      4 * eccentEarthOrbit * yVal * Math.sin(geomMeanAnomSun * DEG2RAD) * Math.cos(2 * geomMeanLongSun * DEG2RAD) -
      0.5 * yVal * yVal * Math.sin(4 * geomMeanLongSun * DEG2RAD) -
      1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2 * geomMeanAnomSun * DEG2RAD));

  // True Solar Time
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTimeFix = eqOfTime + 4 * lon;
  let trueSolarTime = (hours * 60 + solarTimeFix) % 1440;
  if (trueSolarTime < 0) trueSolarTime += 1440;

  // Solar Hour Angle
  let hourAngle = trueSolarTime / 4 - 180;
  if (hourAngle < -180) hourAngle += 360;

  // Solar Zenith & Altitude
  const latRad = lat * DEG2RAD;
  const declinRad = sunDeclin * DEG2RAD;
  const hourAngleRad = hourAngle * DEG2RAD;

  const csz = Math.sin(latRad) * Math.sin(declinRad) + Math.cos(latRad) * Math.cos(declinRad) * Math.cos(hourAngleRad);
  const zenith = Math.acos(Math.max(-1, Math.min(1, csz))) * RAD2DEG;
  const altitude = 90 - zenith;

  // Solar Azimuth
  let azimuth = 0;
  const cosAz = (Math.sin(declinRad) - Math.sin(latRad) * Math.cos(zenith * DEG2RAD)) /
    (Math.cos(latRad) * Math.sin(zenith * DEG2RAD));
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  azimuth = Math.acos(clampedCosAz) * RAD2DEG;
  if (hourAngle > 0) azimuth = (360 - azimuth) % 360;
  azimuth = (azimuth + 180) % 360; // Azimuth from North (0° = North)

  return { azimuth, altitude };
}

/**
 * Finds the exact minutes during the current day when:
 * 1. The Sun's azimuth matches the Qibla azimuth directly (Sun in direction of Qibla).
 * 2. The Sun's shadow aligns with the Qibla (Sun is opposite to Qibla: Qibla + 180°).
 * At this moment, the shadow of any straight vertical pole points EXACTLY to Qibla!
 */
export function findSolarQiblaAlignmentTimes(
  date: Date,
  lat: number,
  lon: number
): {
  directTime: string | null;
  shadowTime: string | null;
} {
  const qiblaAz = calculateQiblaAzimuth(lat, lon);
  const oppositeQibla = (qiblaAz + 180) % 360;

  let bestDirectDiff = 999;
  let bestDirectDate: Date | null = null;

  let bestShadowDiff = 999;
  let bestShadowDate: Date | null = null;

  // Scan through the current day in 2-minute increments from 05:00 to 19:30 local
  const base = new Date(date);
  base.setHours(4, 0, 0, 0);

  for (let m = 0; m < 960; m += 2) {
    const current = new Date(base.getTime() + m * 60 * 1000);
    const { azimuth, altitude } = calculateSolarPosition(current, lat, lon);

    // Sun must be above horizon (altitude >= 2°) for shadows to be clear and visible
    if (altitude >= 2) {
      // 1. Direct Sun alignment (Facing the Sun gives Qibla)
      let dDiff = Math.abs(azimuth - qiblaAz);
      if (dDiff > 180) dDiff = 360 - dDiff;
      if (dDiff < bestDirectDiff && dDiff <= 1.5) {
        bestDirectDiff = dDiff;
        bestDirectDate = current;
      }

      // 2. Shadow Alignment (Opposite: Shadow points towards Qibla!)
      // When Sun is opposite to Qibla, the shadow thrown by a stick points directly to Kaaba!
      let sDiff = Math.abs(azimuth - oppositeQibla);
      if (sDiff > 180) sDiff = 360 - sDiff;
      if (sDiff < bestShadowDiff && sDiff <= 1.5) {
        bestShadowDiff = sDiff;
        bestShadowDate = current;
      }
    }
  }

  const formatHM = (d: Date | null) => {
    if (!d) return null;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return {
    directTime: formatHM(bestDirectDate),
    shadowTime: formatHM(bestShadowDate),
  };
}

/**
 * Checks if current date corresponds to Rasad al-Qibla (رصد القبلة)
 * when the sun is directly zenith over the Kaaba (27/28 May at 09:18 UTC, 15/16 July at 09:27 UTC).
 */
export function checkRasadAlQibla(date: Date): { isToday: boolean; eventName?: string; timeUtc?: string } {
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  if (m === 5 && (d === 27 || d === 28)) {
    return {
      isToday: true,
      eventName: "رصد القبلة الأول (May 27/28)",
      timeUtc: "09:18 UTC (12:18 Makkah Time)",
    };
  }
  if (m === 7 && (d === 15 || d === 16)) {
    return {
      isToday: true,
      eventName: "رصد القبلة الثاني (July 15/16)",
      timeUtc: "09:27 UTC (12:27 Makkah Time)",
    };
  }

  return { isToday: false };
}
