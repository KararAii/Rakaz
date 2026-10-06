import { type ComponentProps, createElement, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/**
 * react-native-web resolves `start`/`end` and other logical styles from the nearest View with a `dir` prop
 * (not from `document.dir`), so the whole tree is wrapped in an RTL root.
 */
export function RTLRoot({ children }: { children: ReactNode }) {
  const props: ComponentProps<typeof View> & { dir: 'rtl' } = { style: styles.root, dir: 'rtl', children };
  return createElement(View, props);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
