/** India's civil clock: IST, sunrise/sunset at New Delhi. */
export const INDIA_TZ = "Asia/Kolkata";
export const INDIA_LAT = 28.6139;
export const INDIA_LNG = 77.209;
const ZENITH = 90.833;
const RAD = Math.PI / 180;

export type IndiaTheme = "day" | "night";

export function indiaParts(at: Date = new Date()) {
  const bag: Record<string, string> = {};
  new Intl.DateTimeFormat("en-GB", {
    timeZone: INDIA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(at)
    .forEach((p) => {
      if (p.type !== "literal") bag[p.type] = p.value;
    });
  return {
    y: Number(bag.year),
    m: Number(bag.month),
    d: Number(bag.day),
    h: Number(bag.hour),
    min: Number(bag.minute),
    s: Number(bag.second),
  };
}

function dayOfYear(y: number, m: number, d: number) {
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 86400000);
}

/** UTC minutes past 00:00 UTC for official sunrise/sunset on the IST calendar day. */
function utcMinutes(y: number, m: number, d: number, rising: boolean) {
  const N = dayOfYear(y, m, d);
  const lngHour = INDIA_LNG / 15;
  const t = N + ((rising ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  let L = M + 1.916 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 282.634;
  L = ((L % 360) + 360) % 360;
  let RA = Math.atan(0.91764 * Math.tan(L * RAD)) / RAD;
  RA = ((RA % 360) + 360) % 360;
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
  RA /= 15;
  const sinDec = 0.39782 * Math.sin(L * RAD);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(ZENITH * RAD) - sinDec * Math.sin(INDIA_LAT * RAD)) / (cosDec * Math.cos(INDIA_LAT * RAD));
  if (cosH > 1) return (rising ? 1 : 11) * 60;
  if (cosH < -1) return (rising ? 0 : 12) * 60;
  const H = (rising ? 360 - Math.acos(cosH) / RAD : Math.acos(cosH) / RAD) / 15;
  const T = H + RA - 0.06571 * t - 6.622;
  let UT = T - lngHour;
  UT = ((UT % 24) + 24) % 24;
  return UT * 60;
}

function wrapDay(min: number) {
  return ((min % 1440) + 1440) % 1440;
}

export function indiaSunMinutes(at: Date = new Date()) {
  const p = indiaParts(at);
  return {
    sunrise: wrapDay(utcMinutes(p.y, p.m, p.d, true) + 330),
    sunset: wrapDay(utcMinutes(p.y, p.m, p.d, false) + 330),
    now: p.h * 60 + p.min + p.s / 60,
    parts: p,
  };
}

export function isNightInIndia(at: Date = new Date()) {
  const { sunrise, sunset, now } = indiaSunMinutes(at);
  return now < sunrise || now >= sunset;
}

export function indiaThemeAt(at: Date = new Date()): IndiaTheme {
  return isNightInIndia(at) ? "night" : "day";
}

export function msUntilIndiaThemeFlip(at: Date = new Date()) {
  const { sunrise, sunset, now } = indiaSunMinutes(at);
  const next = now < sunrise ? sunrise : now < sunset ? sunset : sunrise + 1440;
  return Math.max(5_000, (next - now) * 60_000 + 400);
}

export function applyIndiaTheme(root: HTMLElement = document.documentElement) {
  const night = isNightInIndia();
  root.dataset.theme = night ? "night" : "day";
  root.style.colorScheme = night ? "dark" : "light";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", night ? "#070A16" : "#1E2761");
}

/** Blocking boot — keep in sync with indiaSunMinutes (New Delhi, IST). */
export const INDIA_THEME_BOOT = `(function(){try{var LAT=28.6139,LNG=77.209,Z=90.833,R=Math.PI/180;function P(d){var o={};new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"}).formatToParts(d).forEach(function(p){if(p.type!=="literal")o[p.type]=p.value});return{y:+o.year,m:+o.month,d:+o.day,h:+o.hour,min:+o.minute,s:+o.second}}function D(y,m,d){return Math.floor((Date.UTC(y,m-1,d)-Date.UTC(y,0,0))/864e5)}function U(y,m,d,up){var N=D(y,m,d),lh=LNG/15,t=N+((up?6:18)-lh)/24,M=0.9856*t-3.289,L=M+1.916*Math.sin(M*R)+0.02*Math.sin(2*M*R)+282.634;L=(L%360+360)%360;var RA=Math.atan(0.91764*Math.tan(L*R))/R;RA=(RA%360+360)%360;RA+=Math.floor(L/90)*90-Math.floor(RA/90)*90;RA/=15;var sd=0.39782*Math.sin(L*R),cd=Math.cos(Math.asin(sd)),ch=(Math.cos(Z*R)-(sd*Math.sin(LAT*R)))/(cd*Math.cos(LAT*R));if(ch>1||ch<-1)return(up?6:18)*60;var H=(up?360-Math.acos(ch)/R:Math.acos(ch)/R)/15,T=H+RA-0.06571*t-6.622,UT=T-lh;UT=(UT%24+24)%24;return UT*60}var p=P(new Date()),rise=((U(p.y,p.m,p.d,true)+330)%1440+1440)%1440,set=((U(p.y,p.m,p.d,false)+330)%1440+1440)%1440,now=p.h*60+p.min+p.s/60,n=now<rise||now>=set,r=document.documentElement;r.setAttribute("data-theme",n?"night":"day");r.style.colorScheme=n?"dark":"light"}catch(e){}})();`;
