import { Variants } from "framer-motion";

export const glassTransition: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    backdropFilter: "blur(0px)",
  },
  animate: {
    opacity: 1,
    scale: 1,
    backdropFilter: "blur(24px) saturate(180%)",
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    backdropFilter: "blur(0px)",
    transition: {
      type: "tween",
      duration: 0.2,
    },
  },
};

export const pillTransition: Variants = {
  initial: {
    opacity: 0,
    scale: 0.5,
    y: -20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
      mass: 0.7,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.5,
    y: -20,
    transition: {
      type: "tween",
      duration: 0.15,
    },
  },
};

export const expandTransition: Variants = {
  initial: {
    width: "48px",
    height: "48px",
    opacity: 0.8,
  },
  animate: {
    width: "360px",
    height: "120px",
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 320,
      damping: 28,
      mass: 0.75,
    },
  },
  collapse: {
    width: "48px",
    height: "48px",
    opacity: 0.8,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 30,
      mass: 0.8,
    },
  },
};

export const fadeSlideDown: Variants = {
  initial: {
    opacity: 0,
    y: -10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      type: "tween",
      duration: 0.2,
    },
  },
};

export const fadeSlideUp: Variants = {
  initial: {
    opacity: 0,
    y: 10,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "tween",
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      type: "tween",
      duration: 0.2,
    },
  },
};

export const progressBar: Variants = {
  initial: {
    width: "0%",
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      type: "tween",
      duration: 0.8,
      ease: "easeOut",
    },
  }),
};

export const contentReveal: Variants = {
  initial: {
    opacity: 0,
    x: 8,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      type: "tween",
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const imageReveal: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 25,
      mass: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      type: "tween",
      duration: 0.2,
    },
  },
};
