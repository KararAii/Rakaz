import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { Coordinate } from '@/types/models';

export interface MapRegion extends Coordinate {
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  coordinate: Coordinate;
  /** `bottom` pins the bottom-center of the view to the coordinate (SwiftUI `anchor: .bottom`). */
  anchor?: 'center' | 'bottom';
  /** Animated markers need live view tracking on Android. */
  animated?: boolean;
  view: ReactNode;
}

export interface MapLine {
  id: string;
  coordinates: Coordinate[];
  color: string;
  width: number;
  dash?: number[];
}

export interface RakazMapProps {
  /** Desired camera; the map animates whenever its values change. */
  region: MapRegion;
  markers?: MapMarker[];
  lines?: MapLine[];
  interactive?: boolean;
  /** Called when the user starts dragging the map. */
  onPanStart?: () => void;
  onRegionChangeComplete?: (region: MapRegion) => void;
  style?: StyleProp<ViewStyle>;
}

export function regionAround(center: Coordinate, delta: number): MapRegion {
  return { ...center, latitudeDelta: delta, longitudeDelta: delta };
}
