import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

const isConnected = (state: NetInfoState): boolean =>
  state.isConnected === true && state.isInternetReachable !== false;

/** Observes connectivity so queued actions flush automatically on reconnect. */
export class NetworkMonitor {
  private unsubscribe: (() => void) | null = null;

  async isConnectedNow(): Promise<boolean> {
    try {
      return isConnected(await NetInfo.fetch());
    } catch {
      return false;
    }
  }

  start(onChange: (connected: boolean) => void): void {
    this.stop();
    this.unsubscribe = NetInfo.addEventListener((state) => onChange(isConnected(state)));
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
}
