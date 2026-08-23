export const springPresets = {
  default: {
    type: "spring" as const,
    stiffness: 300,
    damping: 30,
    mass: 0.8,
  },
  bouncy: {
    type: "spring" as const,
    stiffness: 400,
    damping: 20,
    mass: 0.7,
  },
  gentle: {
    type: "spring" as const,
    stiffness: 200,
    damping: 40,
    mass: 1,
  },
  snappy: {
    type: "spring" as const,
    stiffness: 500,
    damping: 25,
    mass: 0.6,
  },
  overshoot: {
    type: "spring" as const,
    stiffness: 350,
    damping: 18,
    mass: 0.8,
  },
  smooth: {
    type: "spring" as const,
    stiffness: 250,
    damping: 35,
    mass: 0.9,
  },
  expand: {
    type: "spring" as const,
    stiffness: 350,
    damping: 28,
    mass: 0.7,
  },
  collapse: {
    type: "spring" as const,
    stiffness: 400,
    damping: 35,
    mass: 0.8,
  },
  notificationIn: {
    type: "spring" as const,
    stiffness: 400,
    damping: 22,
    mass: 0.6,
  },
  notificationOut: {
    type: "spring" as const,
    stiffness: 300,
    damping: 35,
    mass: 0.9,
  },
  mediaTransition: {
    type: "spring" as const,
    stiffness: 320,
    damping: 28,
    mass: 0.75,
  },
  volumeKnob: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    mass: 0.5,
  },
  batteryCharge: {
    type: "spring" as const,
    stiffness: 300,
    damping: 20,
    mass: 0.8,
  },
  aiAppear: {
    type: "spring" as const,
    stiffness: 280,
    damping: 25,
    mass: 0.85,
  },
  quick: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },
  stiff: {
    type: "spring" as const,
    stiffness: 500,
    damping: 35,
    mass: 0.6,
  },
} as const;

export interface SpringConfig {
  type: "spring" | "tween" | "keyframes";
  stiffness?: number;
  damping?: number;
  mass?: number;
  duration?: number;
  ease?: string | number[];
}
