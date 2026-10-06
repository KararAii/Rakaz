import type { StyleProp, ViewStyle } from 'react-native';

import { Rakaz } from '@/constants/theme';
import type { DriverDerived, DriverState } from '@/store/driverState';
import { type Coordinate, type LegStop, StopStatus, TripLeg, bearingTo, isDone } from '@/types/models';

export interface RouteMapProps {
  focus?: Coordinate | null;
  zoom?: number;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapPin {
  key: string;
  index: number;
  coordinate: Coordinate;
  isNext: boolean;
  size: number;
  fill: string;
  foreground: string;
  border: string;
}

export interface RouteMapModel {
  path: Coordinate[];
  pins: MapPin[];
  school: Coordinate | null;
  bus: Coordinate;
  heading: number;
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number };
}

function pinFor(stop: LegStop, index: number, nextId: string | undefined): MapPin {
  const isNext = stop.student.id === nextId;
  const status = stop.record.status;
  const fill = isNext
    ? Rakaz.Navy
    : status === StopStatus.ABSENT
      ? Rakaz.Red
      : isDone(status)
        ? Rakaz.Green
        : Rakaz.White;
  return {
    key: stop.student.id,
    index,
    coordinate: stop.student.home,
    isNext,
    size: isNext ? 32 : 26,
    fill,
    foreground: isNext || isDone(status) ? Rakaz.White : Rakaz.Ink,
    border: isNext ? Rakaz.Gold : Rakaz.White,
  };
}

/** Everything the map draws: gold route, numbered stops, school (morning only) and the bus heading. */
export function buildRouteMapModel(state: DriverState, derived: DriverDerived): RouteMapModel {
  const school = state.route.school.coordinate;
  const bus = derived.currentPosition;
  const next = derived.nextStop;
  const all = [...derived.legStops.map((s) => s.student.home), school, bus];
  const lats = all.map((c) => c.latitude);
  const lngs = all.map((c) => c.longitude);
  return {
    path: derived.remainingPath,
    pins: derived.legStops.map((stop, i) => pinFor(stop, i, next?.student.id)),
    school: derived.currentLeg === TripLeg.MORNING ? school : null,
    bus,
    heading: bearingTo(bus, next?.student.home ?? school),
    bounds: { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) },
  };
}

/** Fits all points (or centres on [focus]) and applies the zoom factor used by the Android map. */
export function regionFor(model: RouteMapModel, focus: Coordinate | null | undefined, zoom: number): MapRegion {
  const { minLat, maxLat, minLng, maxLng } = model.bounds;
  const latitudeDelta = (Math.max(maxLat - minLat, 0.004) * 1.5) / zoom;
  const longitudeDelta = (Math.max(maxLng - minLng, 0.004) * 1.5) / zoom;
  const center = focus ?? { latitude: (minLat + maxLat) / 2, longitude: (minLng + maxLng) / 2 };
  return { latitude: center.latitude, longitude: center.longitude, latitudeDelta, longitudeDelta };
}
