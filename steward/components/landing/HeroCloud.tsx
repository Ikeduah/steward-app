import Image from "next/image";
import Link from "next/link";
import { useRef, useSyncExternalStore } from "react";
import {
  motion,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { REQUEST_ACCESS_MAILTO } from "../../lib/marketing";
import { LandingNav } from "./LandingNav";
import {
  BAND_OPACITY,
  BAND_SCALE,
  BAND_WIDTH,
  BAND_Z,
  CORRIDOR_LEFT,
  CORRIDOR_RIGHT,
  driftStyle,
  FADE_IN_END,
  FADE_OUT_START,
  HERO_ITEMS,
  STILL_ITEMS,
  type HeroItem,
} from "./heroItems";

/** Length of the pin. The cloud travels through 2 extra screens of scroll. */
const PIN_HEIGHT_VH = 200;

/**
 * A single floating item.
 *
 * Only transform and opacity are animated, composed into one string so the
 * compositor gets a single property to interpolate. will-change is derived from
 * opacity rather than set permanently, so it applies only to items actually in
 * flight: leaving it on all eleven would keep eleven layers promoted for the
 * whole page.
 */
function HeroItemInFlight({
  item,
  index,
  progress,
}: {
  item: HeroItem;
  index: number;
  progress: MotionValue<number>;
}) {
  const { enter, exit, band } = item;
  const span = exit - enter;

  // Local progress, 0 to 1, over this item's own window.
  const t = useTransform(progress, [enter, exit], [0, 1], { clamp: true });

  const x = useTransform(t, [0, 1], item.x);
  const y = useTransform(t, [0, 1], item.y);
  const rotate = useTransform(t, [0, 1], item.rotate);
  const scale = useTransform(t, [0, 1], BAND_SCALE[band]);

  // Fades in from the far distance, holds, then fades out as it passes the
  // camera. Both ramps are expressed in local progress so they stay
  // proportional however long the item's window is.
  const peak = BAND_OPACITY[band];
  const opacity = useTransform(
    t,
    [0, FADE_IN_END, FADE_OUT_START, 1],
    [0, peak, peak, 0],
  );

  const transform = useMotionTemplate`translate3d(-50%, -50%, 0) scale(${scale}) rotate(${rotate}deg)`;
  const left = useMotionTemplate`${x}vw`;
  const top = useMotionTemplate`${y}vh`;
  const willChange = useTransform(opacity, (value) =>
    value > 0.01 ? "transform, opacity" : "auto",
  );

  const width = BAND_WIDTH[band];
  const aspect = item.intrinsic[1] / item.intrinsic[0];

  return (
    <motion.div
      aria-hidden={span <= 0}
      className="pointer-events-none absolute"
      style={{
        left,
        top,
        opacity,
        transform,
        willChange,
        zIndex: BAND_Z[band],
        width: `${width}vw`,
      }}
    >
      {/* The drift sits on this inner element rather than on the motion.div
          above, so the scroll-driven transform stays a pure function of scroll
          progress and scrubbing back up retraces the exact same path. A label
          is inside here too, so it sways with its item instead of detaching
          from the end of its leader line. */}
      <div className="stw-drift relative" style={driftStyle(band, index)}>
        <Image
          src={item.src}
          alt={item.alt}
          width={item.intrinsic[0]}
          height={item.intrinsic[1]}
          sizes={`${Math.ceil(width * 2.2)}vw`}
          priority
          className={
            // Far-band softness is a static class, never an animated filter.
            // Animating a CSS blur across the scroll drops frames on mid-range
            // laptops, and the softness does not need to change anyway.
            band === "far" ? "h-auto w-full blur-[1.5px]" : "h-auto w-full"
          }
          style={{ aspectRatio: `${item.intrinsic[0]} / ${item.intrinsic[1]}` }}
        />
        {item.label ? <ItemLabel item={item} t={t} aspect={aspect} /> : null}
      </div>
    </motion.div>
  );
}

/**
 * The mono caption on a hairline leader line.
 *
 * This is the moment the animation stops being decoration and starts explaining
 * the product, so it is deliberately rationed to three items. The label is only
 * legible while its item is mid-depth and sharp, so its opacity follows a bell
 * over local progress rather than tracking the item's own fade.
 */
function ItemLabel({
  item,
  t,
  aspect,
}: {
  item: HeroItem;
  t: MotionValue<number>;
  aspect: number;
}) {
  const label = item.label!;
  const opacity = useTransform(t, [0.28, 0.42, 0.62, 0.76], [0, 1, 1, 0]);
  const onLeft = label.side === "left";

  return (
    <motion.div
      data-hero-label
      style={{ opacity, top: `${aspect * 42}%` }}
      className={`absolute flex items-center gap-0 ${
        onLeft ? "right-[88%] flex-row-reverse" : "left-[88%]"
      }`}
    >
      <span className="h-px w-[4vw] shrink-0 bg-white/45" />
      <span
        className={`whitespace-nowrap font-mono leading-tight ${
          onLeft ? "text-right" : "text-left"
        }`}
      >
        <span className="block text-[0.62vw] tracking-[0.18em] text-stw-emerald">
          {label.id}
        </span>
        <span className="block text-[0.72vw] text-white/85">{label.name}</span>
      </span>
    </motion.div>
  );
}

/** The fixed arrangement shown on mobile and under reduced motion. */
function StillCloud() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {STILL_ITEMS.map((item, index) => {
        const still = item.still!;
        const width = BAND_WIDTH[item.band] * still.scale;
        return (
          <div
            key={item.name}
            className="absolute"
            style={{
              left: `${still.x}%`,
              top: `${still.y}%`,
              width: `${width}vw`,
              minWidth: 86,
              opacity: BAND_OPACITY[item.band],
              zIndex: BAND_Z[item.band],
              transform: `translate(-50%, -50%) rotate(${still.rotate}deg)`,
            }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              width={item.intrinsic[0]}
              height={item.intrinsic[1]}
              sizes="(max-width: 768px) 30vw, 20vw"
              priority
              // The still arrangement has no inner wrapper and carries no
              // labels, so the drift goes straight on the image. It matters
              // most here: this is what phones and reduced-motion visitors get,
              // and with no scroll binding the drift is the only life the hero
              // has.
              className={`stw-drift ${
                item.band === "far" ? "h-auto w-full blur-[1.5px]" : "h-auto w-full"
              }`}
              style={{
                ...driftStyle(item.band, index),
                aspectRatio: `${item.intrinsic[0]} / ${item.intrinsic[1]}`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}

/**
 * Headline, supporting line and calls to action.
 *
 * Four text elements, no more. The entrance is tied to mount rather than to
 * scroll: tying it to scroll means it replays every time somebody scrubs back
 * up, which reads as a glitch.
 */
function HeroType({ lift }: { lift?: MotionValue<number> }) {
  return (
    <motion.div
      className="relative z-10 flex min-h-[100dvh] flex-col justify-center px-6 md:px-0"
      style={lift ? { opacity: lift } : undefined}
    >
      {/* The type occupies the corridor, and the corridor is defined in viewport
          units in heroItems.ts. These two have to agree: position the type with
          a centred max-width container instead and the left-channel items land
          on the headline, because they are only cleared of 28vw to 68vw. */}
      <motion.div
        style={
          {
            "--corridor-left": `${CORRIDOR_LEFT}vw`,
            "--corridor-right": `${100 - CORRIDOR_RIGHT}vw`,
          } as React.CSSProperties
        }
        className="md:ml-[var(--corridor-left)] md:mr-[var(--corridor-right)]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <h1 className="font-display text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
          Where&rsquo;s that camera?
        </h1>
        <p className="mt-6 max-w-[26rem] text-base leading-relaxed text-[color:var(--stw-muted)] md:text-lg">
          Every item gets a tag. Every movement gets a record. Nobody has to
          guess where the gear went.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-x-7 gap-y-4">
          <a
            href={REQUEST_ACCESS_MAILTO}
            className="stw-focus inline-flex items-center rounded-full bg-stw-emerald px-7 py-3.5 font-medium text-stw-ink transition-transform active:scale-[0.98]"
          >
            Request access
          </a>
          <Link
            href="#how-it-works"
            className="stw-focus inline-flex items-center gap-2 text-[color:var(--stw-muted)] transition-colors hover:text-[color:var(--stw-on-surface)]"
          >
            See how it works
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

const WIDE_VIEWPORT = "(min-width: 768px)";

/**
 * Whether the viewport is wide enough for the scroll build.
 *
 * Subscribed rather than read in an effect, so the server snapshot is false and
 * hydration matches: the first client paint is the still arrangement, exactly
 * what the server sent, and React swaps in the scroll build on the following
 * render. Reading matchMedia in an effect instead would either flash or
 * mismatch, and would set state synchronously during the effect body.
 */
function useWideViewport() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(WIDE_VIEWPORT);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(WIDE_VIEWPORT).matches,
    () => false,
  );
}

/** The scroll-driven build. Only mounted once we know motion is wanted. */
function ScrollHero() {
  const pinRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: pinRef,
    offset: ["start start", "end end"],
  });

  // Past roughly 85% the type lifts and hands off to the section below.
  const lift = useTransform(scrollYProgress, [0.82, 0.96], [1, 0]);

  return (
    <div ref={pinRef} style={{ height: `${PIN_HEIGHT_VH}vh` }}>
      <div className="sticky top-0 min-h-[100dvh] overflow-hidden">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {HERO_ITEMS.map((item, index) => (
            <HeroItemInFlight
              key={item.name}
              item={item}
              index={index}
              progress={scrollYProgress}
            />
          ))}
        </div>
        <HeroType lift={lift} />
      </div>
    </div>
  );
}

/**
 * Section 1.
 *
 * Renders the still arrangement on the server and on the first client paint,
 * then upgrades to the scroll build only once mounted and only when motion is
 * both wanted and worth it. That ordering is what keeps the page complete with
 * JavaScript disabled and free of hydration mismatch, and it means the hero
 * never depends on motion to make sense.
 */
export function HeroCloud() {
  const prefersReducedMotion = useReducedMotion();
  const wideViewport = useWideViewport();
  const canAnimate = wideViewport && !prefersReducedMotion;

  return (
    <section
      data-surface="ink"
      className="stw-surface relative font-display"
      aria-label="Steward, equipment tracking"
    >
      <LandingNav />
      {canAnimate ? (
        <ScrollHero />
      ) : (
        <div className="relative min-h-[100dvh] overflow-hidden">
          <StillCloud />
          {/* On a phone the type runs the full width, so it has to sit over the
              items rather than beside them. This keeps it at AA. Above md the
              corridor does that job and the scrim is not needed. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-stw-ink/60 md:bg-transparent"
          />
          <HeroType />
        </div>
      )}
    </section>
  );
}
