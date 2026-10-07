import type { Coordinate } from '@/types/models';

/** Hand-tuned demo route through Basra: depot → student's home → school. */

const depot: Coordinate = { latitude: 30.4932, longitude: 47.7712 };

function toHome(home: Coordinate): Coordinate[] {
  return [
    depot,
    { latitude: 30.4961, longitude: 47.7745 },
    { latitude: 30.4978, longitude: 47.7801 },
    { latitude: 30.5016, longitude: 47.7822 },
    { latitude: 30.5031, longitude: 47.7856 },
    home,
  ];
}

function toSchool(home: Coordinate, school: Coordinate): Coordinate[] {
  return [
    home,
    { latitude: 30.5072, longitude: 47.7903 },
    { latitude: 30.5088, longitude: 47.7968 },
    { latitude: 30.5121, longitude: 47.8019 },
    { latitude: 30.5139, longitude: 47.8077 },
    school,
  ];
}

/** Great-circle distance in metres (what `CLLocation.distance(from:)` returns). */
function distance(a: Coordinate, b: Coordinate): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Point at fraction `t` (0...1) along a polyline, by distance. */
function point(path: Coordinate[], t: number): Coordinate {
  const first = path[0];
  if (first == null || path.length <= 1) return first ?? depot;
  const clamped = Math.min(Math.max(t, 0), 1);
  const lengths: number[] = [];
  for (let i = 1; i < path.length; i += 1) lengths.push(distance(path[i - 1], path[i]));
  const total = lengths.reduce((s, l) => s + l, 0);
  if (total <= 0) return first;
  let target = total * clamped;
  for (let i = 0; i < lengths.length; i += 1) {
    const len = lengths[i];
    if (target <= len) {
      const f = len === 0 ? 0 : target / len;
      const a = path[i];
      const b = path[i + 1];
      return { latitude: a.latitude + (b.latitude - a.latitude) * f, longitude: a.longitude + (b.longitude - a.longitude) * f };
    }
    target -= len;
  }
  return path[path.length - 1] ?? first;
}

function length(path: Coordinate[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i += 1) total += distance(path[i - 1], path[i]);
  return total;
}

export const RouteGeometry = { depot, toHome, toSchool, point, length, distance };
