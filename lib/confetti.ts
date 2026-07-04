import confetti from "canvas-confetti";

/** Fires a small, strictly grayscale confetti burst. Used to celebrate a
 * completed task or a fully completed day, without breaking the monochrome
 * design language. */
export function fireConfetti(): void {
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.7 },
    colors: ["#000000", "#4b4b4b", "#9a9a9a", "#e5e5e5"],
  });
}
