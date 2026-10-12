/**
 * solarQibla.ts
 *
 * Astronomical calculations for Qibla direction, Solar position (Solar Azimuth & Altitude),
 * and daily solar shadow calibration times (Daily Qibla by Shadow):
 * - 0° / 180° Shadow Alignment (سایہ عین قبلہ کے رخ یا مخالف)
 * - 90° Perpendicular Shadow (سایہ قبلہ پر 90 ڈگری کا زاویہ قائم کرے)
 * - 135° / 45° Intermediate Shadow (سایہ قبلہ سے 135 یا 45 ڈگری زاویہ بنائے)
 *
 * References:
 * 1. Jean Meeus, "Astronomical Algorithms", 2nd Ed.
 * 2. NOAA Solar Calculator equations.
 * 3. Classical Islamic Astrolabe & Qibla shadow tables (البیرونی، مولانا ادریس کاندھلوی، وعلماءِ فلکیات دیوبند).
 */

export interface SolarPosition {
  azimuth: number; // degrees from true North (0° = North, 90° = East, 180° = South, 270° = West)
  altitude: number; // degrees above horizon (-90° to +90°)
}

export interface ShadowAngleTime {
  angleName: string;
  angleDegrees: number; // Target angle between shadow and Qibla (0°, 45°, 90°, 135°, 180°)
  time: string | null;
  sunAzimuth: number;
  sunAltitude: number;
  descriptionUrdu: string;
  ruleUrdu: string;
}

export interface DailySolarQiblaReport {
  qiblaAzimuth: number;
  sunAzimuthNow: number;
  sunAltitudeNow: number;
  shadowAzimuthNow: number;
  angleDiffNow: number;
  alignments: ShadowAngleTime[];
  rasadAlQibla: {
    isToday: boolean;
    eventName?: string;
    timeUtc?: string;
  };
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
  const time = date.getTime();
  const julianDay = time / 86400000 + 2440587.5;
  const julianCentury = (julianDay - 2451545.0) / 36525.0;

  let geomMeanLongSun =
    (280.46646 + julianCentury * (36000.76983 + julianCentury * 0.0003032)) % 360;
  if (geomMeanLongSun < 0) geomMeanLongSun += 360;

  const geomMeanAnomSun = 357.52911 + julianCentury * (35999.05029 - 0.0001537 * julianCentury);
  const eccentEarthOrbit = 0.016708634 - julianCentury * (0.000042037 + 0.0000001267 * julianCentury);

  const sunEqCtr =
    Math.sin(geomMeanAnomSun * DEG2RAD) *
      (1.914602 - julianCentury * (0.004817 + 0.000014 * julianCentury)) +
    Math.sin(2 * geomMeanAnomSun * DEG2RAD) * (0.019993 - 0.000101 * julianCentury) +
    Math.sin(3 * geomMeanAnomSun * DEG2RAD) * 0.000289;

  const sunTrueLong = geomMeanLongSun + sunEqCtr;
  const sunAppLong = sunTrueLong - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * julianCentury) * DEG2RAD);

  const meanObliqEcliptic =
    23 +
    (26 +
      (21.448 -
        julianCentury * (46.815 + julianCentury * (0.00059 - julianCentury * 0.001813)))) /
      60 /
      60;

  const obliqCorr = meanObliqEcliptic + 0.00256 * Math.cos((125.04 - 1934.136 * julianCentury) * DEG2RAD);
  const sunDeclin = Math.asin(Math.sin(obliqCorr * DEG2RAD) * Math.sin(sunAppLong * DEG2RAD)) * RAD2DEG;

  const yVal = Math.tan((obliqCorr / 2) * DEG2RAD) * Math.tan((obliqCorr / 2) * DEG2RAD);
  const eqOfTime =
    4 *
    RAD2DEG *
    (yVal * Math.sin(2 * geomMeanLongSun * DEG2RAD) -
      2 * eccentEarthOrbit * Math.sin(geomMeanAnomSun * DEG2RAD) +
      4 * eccentEarthOrbit * yVal * Math.sin(geomMeanAnomSun * DEG2RAD) * Math.cos(2 * geomMeanLongSun * DEG2RAD) -
      0.5 * yVal * yVal * Math.sin(4 * geomMeanLongSun * DEG2RAD) -
      1.25 * eccentEarthOrbit * eccentEarthOrbit * Math.sin(2 * geomMeanAnomSun * DEG2RAD));

  const hours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const solarTimeFix = eqOfTime + 4 * lon;
  let trueSolarTime = (hours * 60 + solarTimeFix) % 1440;
  if (trueSolarTime < 0) trueSolarTime += 1440;

  let hourAngle = trueSolarTime / 4 - 180;
  if (hourAngle < -180) hourAngle += 360;

  const latRad = lat * DEG2RAD;
  const declinRad = sunDeclin * DEG2RAD;
  const hourAngleRad = hourAngle * DEG2RAD;

  const csz = Math.sin(latRad) * Math.sin(declinRad) + Math.cos(latRad) * Math.cos(declinRad) * Math.cos(hourAngleRad);
  const zenith = Math.acos(Math.max(-1, Math.min(1, csz))) * RAD2DEG;
  const altitude = 90 - zenith;

  let azimuth = 0;
  const cosAz = (Math.sin(declinRad) - Math.sin(latRad) * Math.cos(zenith * DEG2RAD)) /
    (Math.cos(latRad) * Math.sin(zenith * DEG2RAD));
  const clampedCosAz = Math.max(-1, Math.min(1, cosAz));
  azimuth = Math.acos(clampedCosAz) * RAD2DEG;
  if (hourAngle > 0) azimuth = (360 - azimuth) % 360;
  azimuth = (azimuth + 180) % 360;

  return { azimuth, altitude };
}

/**
 * Searches the entire day (from morning 05:30 to evening 18:30 in 1-minute steps)
 * to locate all key solar shadow angles with respect to the Qibla:
 * 1. 180° Shadow (سایہ قبلہ کی عین سمت): سورج قبلہ کے مخالف (Sun = Qibla + 180°) -> سائے کی سمت عین قبلہ
 * 2. 0° Direct Sun / Shadow (سایہ قبلہ کی مخالف سمت): سورج قبلہ پر (Sun = Qibla) -> سایہ الٹ، لکڑی کی جڑ سے سورج قبلہ
 * 3. 90° Perpendicular Shadow (قائمۃ الزاویہ): سایہ قبلہ کے رخ پر بالکل 90 ڈگری پر بنتا ہے
 * 4. 135° Intermediate Angle: سایہ قبلہ سے ٹھیک 135 ڈگری پر (45 ڈگری کا تکمیلی زاویہ)
 * 5. 45° Acute Angle: سایہ قبلہ سے 45 ڈگری پر
 */
export function calculateDailyShadowQiblaSchedule(
  date: Date,
  lat: number,
  lon: number
): ShadowAngleTime[] {
  const qiblaAz = calculateQiblaAzimuth(lat, lon);

  interface TargetSpec {
    angleName: string;
    angleDegrees: number;
    targetShadowAzimuths: number[]; // Can have morning and afternoon matches
    descriptionUrdu: string;
    ruleUrdu: string;
  }

  // Pre-calculate target shadow azimuths for each requested angle relative to Qibla:
  // Note: Shadow Azimuth = (Sun Azimuth + 180) % 360
  const targets: TargetSpec[] = [
    {
      angleName: "سایہ عین قبلہ پر (180° مخالفِ آفتاب)",
      angleDegrees: 180,
      targetShadowAzimuths: [qiblaAz], // Shadow matches Qibla direction exactly
      descriptionUrdu: "اس وقت لکڑی کا سایہ عین خانہ کعبہ کی سمت پڑتا ہے۔",
      ruleUrdu: "لکڑی سے سائے کے سرے کی طرف لکیر کھینچیں، یہی سیدھی قبلہ کی سمت ہے۔",
    },
    {
      angleName: "سایہ اور قبلہ 135° ڈگری پر",
      angleDegrees: 135,
      targetShadowAzimuths: [(qiblaAz + 135) % 360, (qiblaAz - 135 + 360) % 360],
      descriptionUrdu: "اس وقت سایہ قبلہ کی لائن سے ٹھیک 135 ڈگری کا زاویہ بناتا ہے۔",
      ruleUrdu: "سائے کی لائن سے 135° گھما کر سیدھی لکیر لگائیں، وہی قبلہ کا رخ ہوگا۔",
    },
    {
      angleName: "سایہ اور قبلہ 90° ڈگری پر (قائمہ)",
      angleDegrees: 90,
      targetShadowAzimuths: [(qiblaAz + 90) % 360, (qiblaAz - 90 + 360) % 360],
      descriptionUrdu: "اس وقت سائے کا رخ قبلہ سے ٹھیک 90 ڈگری (قائمۃ الزاویہ) پر ہوتا ہے۔",
      ruleUrdu: "سائے پر گنیا (Right Angle 90°) رکھ کر دائیں یا بائیں رخ کریں تو سیدھا قبلہ ملے گا۔",
    },
    {
      angleName: "سایہ اور قبلہ 45° ڈگری پر",
      angleDegrees: 45,
      targetShadowAzimuths: [(qiblaAz + 45) % 360, (qiblaAz - 45 + 360) % 360],
      descriptionUrdu: "اس وقت سایہ اور قبلہ کے درمیان صرف 45 ڈگری کا زاویہ ہوتا ہے۔",
      ruleUrdu: "سائے کے رخ سے 45 ڈگری موڑنے پر قبلہ کا قطعی زاویہ حاصل ہوتا ہے۔",
    },
    {
      angleName: "سورج عین قبلہ کی سمت (0° / سایہ الٹ)",
      angleDegrees: 0,
      targetShadowAzimuths: [(qiblaAz + 180) % 360], // Sun matches Qibla, shadow is opposite
      descriptionUrdu: "اس وقت سورج بذاتِ خود قبلہ کی سمت میں چمک رہا ہوتا ہے۔",
      ruleUrdu: "سائے کے سرے سے لکڑی کی بنیاد کی طرف دیکھیں، وہی سیدھا قبلہ ہے۔",
    },
  ];

  // We will scan across the daylight hours (05:30 to 18:45) in 1-minute steps
  const base = new Date(date);
  base.setHours(5, 0, 0, 0);

  const results: ShadowAngleTime[] = [];

  for (const t of targets) {
    let bestDiff = 999;
    let bestDate: Date | null = null;
    let bestSunAz = 0;
    let bestSunAlt = 0;

    for (let m = 30; m <= 800; m += 1) {
      const cur = new Date(base.getTime() + m * 60 * 1000);
      const { azimuth, altitude } = calculateSolarPosition(cur, lat, lon);

      // Must be visible above horizon (at least 2.5° altitude) for a clear sharp shadow
      if (altitude >= 2.5) {
        const shadowAz = (azimuth + 180) % 360;

        for (const targetAz of t.targetShadowAzimuths) {
          let diff = Math.abs(shadowAz - targetAz);
          if (diff > 180) diff = 360 - diff;

          if (diff < bestDiff) {
            bestDiff = diff;
            bestDate = cur;
            bestSunAz = azimuth;
            bestSunAlt = altitude;
          }
        }
      }
    }

    // Only accept if closest match is within 1.8 degrees
    const timeFormatted =
      bestDiff <= 1.8 && bestDate
        ? bestDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : null;

    results.push({
      angleName: t.angleName,
      angleDegrees: t.angleDegrees,
      time: timeFormatted,
      sunAzimuth: bestSunAz,
      sunAltitude: bestSunAlt,
      descriptionUrdu: t.descriptionUrdu,
      ruleUrdu: t.ruleUrdu,
    });
  }

  return results;
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
