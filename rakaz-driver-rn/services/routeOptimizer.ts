import { type Coordinate, type RouteStop, type Student, distanceTo } from '@/types/models';

/** Produces stop order for a route. Swap in a server-side solver without touching UI. */
export interface RouteOptimizer {
  order(stops: RouteStop[], students: Student[], start: Coordinate, end: Coordinate): RouteStop[];
}

export const ManualRouteOptimizer: RouteOptimizer = {
  order: (stops) => stops,
};

/** Greedy nearest-neighbour heuristic used as a local placeholder for future optimization. */
export const NearestNeighborOptimizer: RouteOptimizer = {
  order(stops, students, start) {
    const lookup = new Map(students.map((s) => [s.id, s.home] as const));
    const remaining = [...stops];
    const result: RouteStop[] = [];
    let current = start;
    while (remaining.length > 0) {
      let bestIndex = 0;
      let bestDistance = Number.MAX_VALUE;
      remaining.forEach((stop, index) => {
        const home = lookup.get(stop.studentId);
        const d = home ? distanceTo(home, current) : Number.MAX_VALUE;
        if (d < bestDistance) {
          bestDistance = d;
          bestIndex = index;
        }
      });
      const [next] = remaining.splice(bestIndex, 1);
      if (!next) break;
      current = lookup.get(next.studentId) ?? current;
      result.push(next);
    }
    return result;
  },
};
