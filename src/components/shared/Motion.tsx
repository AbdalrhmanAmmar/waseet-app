import type { ComponentProps } from 'react';
import * as Animatable from 'react-native-animatable';
import { useReducedMotion } from '@/hooks/shared/use-reduced-motion';
export function View(props: ComponentProps<typeof Animatable.View>) {
  const reduced = useReducedMotion();
  return (
    <Animatable.View
      {...props}
      animation={reduced ? undefined : props.animation}
      transition={reduced ? undefined : props.transition}
    />
  );
}
export function Image(props: ComponentProps<typeof Animatable.Image>) {
  const reduced = useReducedMotion();
  return (
    <Animatable.Image
      {...props}
      animation={reduced ? undefined : props.animation}
      transition={reduced ? undefined : props.transition}
    />
  );
}
