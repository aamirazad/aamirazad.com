/**
 * Liquid-glass refraction for `backdrop-filter`.
 *
 * Each element gets its own SVG filter whose displacement map is drawn for its exact size, so the
 * rim bends the scene behind it like a thick pane of glass while the middle stays clear. Only
 * Chromium renders SVG filters in `backdrop-filter`; elsewhere the element keeps its CSS frosted
 * fallback. Styles are set through the CSSOM, which the site's `style-src 'self'` CSP allows.
 */

export type LiquidGlassOptions = {
  /** Corner radius in px; should match the element's border-radius. */
  radius: number;
  /** Width of the curved rim in px. */
  bezel?: number;
  /** Maximum displacement at the very edge, in px. */
  refraction?: number;
  /** Frost applied before refracting, in px. */
  blur?: number;
  /**
   * Refract on touch devices too. Large panes are costly to re-filter on every scrolled frame on
   * phones, so they can opt out and keep the CSS frost there.
   */
  touch?: boolean;
};

const SVG_NS = "http://www.w3.org/2000/svg";
let defs: SVGDefsElement | null = null;
let nextId = 0;

function supportsBackdropSvgFilters(): boolean {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } })
    .userAgentData?.brands;
  return Boolean(brands?.some(({ brand }) => brand === "Chromium"));
}

function filterDefs(): SVGDefsElement {
  if (defs?.isConnected) return defs;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("width", "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";
  svg.style.pointerEvents = "none";
  defs = document.createElementNS(SVG_NS, "defs");
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return defs;
}

/** Encodes, per pixel, which way to pull the backdrop: inward along the rim, nothing in the middle. */
function displacementMap(width: number, height: number, radius: number, bezel: number): string {
  const resolution = 0.5;
  const w = Math.max(1, Math.ceil(width * resolution));
  const h = Math.max(1, Math.ceil(height * resolution));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const context = canvas.getContext("2d");
  if (!context) return "";
  const image = context.createImageData(w, h);
  const halfW = width / 2;
  const halfH = height / 2;
  // The lens follows the element's own corner so the refracted shape lines up with its clip...
  const r = Math.min(radius, halfW, halfH);
  // ...but bends along a wider curve, at least as round as the rim is wide, so the pull turns
  // smoothly around tight corners instead of creasing on the diagonal.
  const bend = Math.min(Math.max(radius, bezel), halfW, halfH);

  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const px = (col + 0.5) / resolution - halfW;
      const py = (row + 0.5) / resolution - halfH;
      const qx = Math.abs(px) - (halfW - r);
      const qy = Math.abs(py) - (halfH - r);
      // Signed distance to the rounded rectangle, positive inside.
      const depth =
        r - Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - Math.min(Math.max(qx, qy), 0);
      let dx = 0;
      let dy = 0;
      if (depth < bezel) {
        const bx = Math.abs(px) - (halfW - bend);
        const by = Math.abs(py) - (halfH - bend);
        let nx: number;
        let ny: number;
        if (bx > 0 && by > 0) {
          const length = Math.hypot(bx, by) || 1;
          nx = bx / length;
          ny = by / length;
        } else if (bx > by) {
          nx = 1;
          ny = 0;
        } else {
          nx = 0;
          ny = 1;
        }
        // Smooth convex lens profile: strongest at the edge, easing flat where the rim meets the
        // face. Pixels past the edge keep the full pull, so the anti-aliased clip never reveals an
        // unrefracted sliver.
        const t = Math.min(1 - depth / bezel, 1);
        const strength = t * t * (3 - 2 * t);
        dx = -Math.sign(px) * nx * strength;
        dy = -Math.sign(py) * ny * strength;
      }
      const index = (row * w + col) * 4;
      image.data[index] = Math.round(128 + dx * 127);
      image.data[index + 1] = Math.round(128 + dy * 127);
      image.data[index + 2] = 128;
      image.data[index + 3] = 255;
    }
  }

  context.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}

function setAttributes(element: Element, attributes: Record<string, string | number>): void {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
}

function buildFilter(
  filter: SVGFilterElement,
  width: number,
  height: number,
  options: Required<LiquidGlassOptions>,
): void {
  const { radius, bezel, refraction, blur } = options;
  setAttributes(filter, {
    x: 0,
    y: 0,
    width,
    height,
    filterUnits: "userSpaceOnUse",
    "color-interpolation-filters": "sRGB",
  });

  const primitives: Element[] = [];
  const add = (tag: string, attributes: Record<string, string | number>) => {
    const element = document.createElementNS(SVG_NS, tag);
    setAttributes(element, attributes);
    primitives.push(element);
  };

  // Kept to a single displacement pass: the backdrop is re-filtered on every frame the scene
  // behind it moves, so each extra full-size pass (like a per-channel colour fringe) costs scroll
  // smoothness.
  add("feGaussianBlur", { in: "SourceGraphic", stdDeviation: blur, result: "frost" });
  add("feImage", {
    href: displacementMap(width, height, radius, bezel),
    x: 0,
    y: 0,
    width,
    height,
    preserveAspectRatio: "none",
    result: "map",
  });
  add("feDisplacementMap", {
    in: "frost",
    in2: "map",
    scale: refraction,
    xChannelSelector: "R",
    yChannelSelector: "G",
    result: "glass",
  });
  add("feColorMatrix", { in: "glass", type: "saturate", values: 1.35 });

  filter.replaceChildren(...primitives);
}

export function liquidGlass(node: HTMLElement, initial: LiquidGlassOptions) {
  if (!supportsBackdropSvgFilters()) return {};
  if (initial.touch === false && matchMedia("(pointer: coarse)").matches) return {};

  let options: Required<LiquidGlassOptions> = {
    bezel: 34,
    refraction: 100,
    blur: 3,
    touch: true,
    ...initial,
  };
  const filter = document.createElementNS(SVG_NS, "filter");
  filter.id = `liquid-glass-${nextId++}`;
  filterDefs().appendChild(filter);

  let width = 0;
  let height = 0;
  let frame = 0;

  const render = () => {
    frame = 0;
    // Layout size, not the transformed box, so the tilted hero card keeps a stable map.
    const nextWidth = node.offsetWidth;
    const nextHeight = node.offsetHeight;
    if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
    width = nextWidth;
    height = nextHeight;
    buildFilter(filter, width, height, options);
    node.style.backdropFilter = `url(#${filter.id})`;
  };

  const observer = new ResizeObserver(() => {
    if (!frame) frame = requestAnimationFrame(render);
  });
  observer.observe(node);
  render();

  return {
    update(next: LiquidGlassOptions) {
      options = { ...options, ...next };
      width = height = 0;
      render();
    },
    destroy() {
      cancelAnimationFrame(frame);
      observer.disconnect();
      filter.remove();
      node.style.backdropFilter = "";
    },
  };
}
