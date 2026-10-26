<script lang="ts">
  import { onMount } from "svelte";
  import back1280 from "$lib/assets/twilight/twilight-back-1280.webp";
  import back1920 from "$lib/assets/twilight/twilight-back-1920.webp";
  import back2560 from "$lib/assets/twilight/twilight-back-2560.webp";
  import front1280 from "$lib/assets/twilight/twilight-front-1280.webp";
  import front1920 from "$lib/assets/twilight/twilight-front-1920.webp";
  import front2560 from "$lib/assets/twilight/twilight-front-2560.webp";

  // Both layers are cut from the same painting at the same size, so identical boxes keep them
  // registered at rest; only the motion below separates them.
  const backSrcset = `${back1280} 1280w, ${back1920} 1920w, ${back2560} 2560w`;
  const frontSrcset = `${front1280} 1280w, ${front1920} 1920w, ${front2560} 2560w`;

  // "hero" (homepage) lets the sky darken and the trees drift away as the hero scrolls off.
  // "backdrop" (reading pages) holds that calmer, dimmed state from the start and needs no script.
  let { variant = "hero" }: { variant?: "hero" | "backdrop" } = $props();

  let sceneBack: HTMLDivElement;
  let back: HTMLDivElement;
  let front: HTMLDivElement;
  let duskBack: HTMLDivElement;
  let duskFront: HTMLDivElement;

  onMount(() => {
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = matchMedia("(hover: hover) and (pointer: fine)");
    const tilted = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let frame = 0;

    const render = () => {
      frame = 0;
      x += (targetX - x) * 0.07;
      y += (targetY - y) * 0.07;
      const hero = variant === "hero";
      // The scene's own height is stable on mobile (see .scene), unlike window.innerHeight.
      const stage = sceneBack.offsetHeight || window.innerHeight;
      const progress = hero ? Math.min(Math.max(window.scrollY / stage, 0), 1) : 1;
      const lift = hero && !reducedMotion.matches ? progress : 0;

      back.style.transform =
        `translate3d(${x * 12}px, ${y * 8 - lift * 24}px, 0) ` +
        `rotateX(${-y * 0.8}deg) rotateY(${x * 1.2}deg) scale(${1 + lift * 0.04})`;
      front.style.transform =
        `translate3d(${-x * 22}px, ${-y * 12 + lift * stage * 0.3}px, 0) ` +
        `rotateX(${-y * 1.4}deg) rotateY(${x * 2.2}deg) scale(${1 + lift * 0.18})`;
      duskBack.style.opacity = duskFront.style.opacity = String(progress);
      for (const element of tilted) {
        element.style.transform =
          `rotateX(${-y * 4}deg) rotateY(${x * 5}deg) ` + `translate3d(${x * 6}px, ${y * 4}px, 0)`;
      }

      if (Math.abs(targetX - x) > 0.0005 || Math.abs(targetY - y) > 0.0005) schedule();
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches || event.pointerType !== "mouse") return;
      targetX = (event.clientX / window.innerWidth) * 2 - 1;
      targetY = (event.clientY / window.innerHeight) * 2 - 1;
      schedule();
    };

    // Touch screens have no cursor, so tilting the phone stands in for it. Readings are measured
    // from however the phone is being held: the neutral pose snaps along when tilted past the
    // range and drifts after the reading otherwise, so a new grip settles back to centre.
    const TILT_RANGE = 18;
    let neutral: { x: number; y: number } | null = null;

    // Euler angles flip by 180° near the poles (e.g. an upright phone in landscape); folding the
    // difference back into ±90° keeps the motion continuous across that seam.
    const tiltDelta = (degrees: number) => ((((degrees + 90) % 180) + 180) % 180) - 90;

    const settle = (axis: "x" | "y", reading: number) => {
      const delta = tiltDelta(reading - neutral![axis]);
      const clamped = Math.max(-TILT_RANGE, Math.min(TILT_RANGE, delta));
      neutral![axis] += delta - clamped + clamped * 0.002;
      return clamped / TILT_RANGE;
    };

    const onOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (reducedMotion.matches || finePointer.matches || beta === null || gamma === null) return;
      // gamma tips the device's right edge down and beta its bottom edge; turn those into screen
      // axes so the motion follows the screen when the phone is held sideways.
      const angle = screen.orientation?.angle ?? 0;
      const [readingX, readingY] =
        angle === 90
          ? [beta, -gamma]
          : angle === 180
            ? [-gamma, -beta]
            : angle === 270
              ? [-beta, gamma]
              : [gamma, beta];
      neutral ??= { x: readingX, y: readingY };
      targetX = settle("x", readingX);
      targetY = settle("y", readingY);
      schedule();
    };

    // iOS withholds orientation until the visitor allows it, and will only ask from inside a tap.
    // A touch that turns out to be a scroll doesn't count, so keep offering until there's an answer.
    const Orientation = window.DeviceOrientationEvent as unknown as
      { requestPermission?: () => Promise<PermissionState> } | undefined;
    const needsPermission = typeof Orientation?.requestPermission === "function";
    const requestTilt = () => {
      if (reducedMotion.matches) return;
      Orientation!.requestPermission!().then(
        () => window.removeEventListener("touchend", requestTilt),
        () => {},
      );
    };

    const recenter = () => {
      targetX = 0;
      targetY = 0;
      neutral = null;
      schedule();
    };

    window.addEventListener("deviceorientation", onOrientation);
    if (needsPermission && !finePointer.matches) {
      window.addEventListener("touchend", requestTilt, { passive: true });
    }
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", recenter);
    window.addEventListener("blur", recenter);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    reducedMotion.addEventListener("change", recenter);
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("touchend", requestTilt);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", recenter);
      window.removeEventListener("blur", recenter);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      reducedMotion.removeEventListener("change", recenter);
    };
  });
</script>

<!-- The shade lives inside each layer (masked to the trees on the front one) so both layers are
     darkened identically and the cut-out never shows a seam. -->
<div
  class="scene scene-back"
  class:backdrop={variant === "backdrop"}
  aria-hidden="true"
  bind:this={sceneBack}
>
  <div class="layer" bind:this={back}>
    <img srcset={backSrcset} sizes="110vw" src={back1920} alt="" fetchpriority="high" />
    <div class="shade">
      <div class="veil"></div>
      <div class="dusk" bind:this={duskBack}></div>
    </div>
  </div>
</div>

<div class="scene scene-front" class:backdrop={variant === "backdrop"} aria-hidden="true">
  <div class="layer layer-front" bind:this={front}>
    <img srcset={frontSrcset} sizes="110vw" src={front1920} alt="" />
    <div class="shade shade-front">
      <div class="veil"></div>
      <div class="dusk" bind:this={duskFront}></div>
    </div>
  </div>
</div>

<style>
  /* Sized to the *largest* viewport (mobile toolbars hidden) rather than the visible one, so the
     painting keeps one fixed size and never re-crops or jumps as the address bar slides away. */
  .scene {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    height: 100lvh;
    overflow: hidden;
    perspective: 1400px;
    pointer-events: none;
  }

  .scene-back {
    z-index: 0;
    /* Painted-sky stand-in while the image loads. */
    background:
      radial-gradient(ellipse 60% 22% at 50% 64%, rgb(196 168 82 / 55%), transparent 70%),
      linear-gradient(180deg, #2a1915 0%, #3b1c16 38%, #5e4a26 62%, #16130c 74%, #0d0b07 100%);
  }

  .scene-front {
    z-index: 20;
  }

  .layer {
    position: absolute;
    inset: -3.5vmax;
    inset: -3.5lvmax;
    will-change: transform;
  }

  .layer-front {
    transform-origin: 62% 100%;
  }

  .layer img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: 50% 52%;
  }

  .shade,
  .veil,
  .dusk {
    position: absolute;
    inset: 0;
  }

  .shade-front {
    mask-image: url("$lib/assets/twilight/twilight-front-1920.webp");
    mask-size: cover;
    mask-position: 50% 52%;
    mask-repeat: no-repeat;
  }

  /* Keeps the sky calm and the type legible without repainting the image. */
  .veil {
    background:
      linear-gradient(180deg, rgb(10 7 6 / 62%) 0%, rgb(10 7 6 / 8%) 26%, transparent 46%),
      linear-gradient(90deg, rgb(12 8 7 / 58%) 0%, rgb(12 8 7 / 22%) 42%, transparent 64%),
      linear-gradient(0deg, rgb(8 7 5 / 55%) 0%, transparent 30%), rgb(20 10 12 / 18%);
  }

  .dusk {
    background: rgb(9 7 7 / 26%);
    opacity: 0;
  }

  .backdrop .dusk {
    opacity: 1;
  }

  @media (max-aspect-ratio: 1/1) {
    .layer img {
      object-position: 78% 50%;
    }

    .shade-front {
      mask-position: 78% 50%;
    }
  }
</style>
