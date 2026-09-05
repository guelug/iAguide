/**
 * Headless check of the camera rig's fit maths.
 *
 * The rig in components/three/Stage.tsx picks a camera distance so the
 * measured content fills the frame. This script reproduces that formula
 * against the real bounding boxes of the course's scenes, then projects
 * the eight corners of each box through the resulting camera and asserts
 * every corner lands inside the view frustum.
 *
 * It is the only way to verify framing while the browser pane is hidden,
 * and it is a better test anyway: it covers every aspect ratio at once.
 *
 *   node scripts/check-framing.mjs
 */
import { Box3, MathUtils, PerspectiveCamera, Vector3 } from "three";

/** Same exact solve as CameraRig. Keep the two in sync by hand. */
function fitCamera(cam, box, aspect, fit, dirRaw) {
  const center = box.getCenter(new Vector3());
  const zAxis = dirRaw.clone().normalize();
  const up = Math.abs(zAxis.dot(new Vector3(0, 1, 0))) > 0.999
    ? new Vector3(0, 0, 1)
    : new Vector3(0, 1, 0);
  const xAxis = up.clone().cross(zAxis).normalize();
  const yAxis = zAxis.clone().cross(xAxis).normalize();

  const tanV = Math.tan(MathUtils.degToRad(cam.fov) / 2);
  const tanH = tanV * aspect;

  let dist = 0;
  const c = new Vector3();
  for (let i = 0; i < 8; i++) {
    c.set(
      i & 1 ? box.max.x : box.min.x,
      i & 2 ? box.max.y : box.min.y,
      i & 4 ? box.max.z : box.min.z,
    ).sub(center);
    const qx = c.dot(xAxis);
    const qy = c.dot(yAxis);
    const qz = c.dot(zAxis);
    dist = Math.max(dist, qz + Math.max((Math.abs(qx) * fit) / tanH, (Math.abs(qy) * fit) / tanV));
  }
  dist += 0.15;

  cam.aspect = aspect;
  cam.position.copy(center).addScaledVector(zAxis, dist);
  cam.lookAt(center);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return { center, dist };
}

/**
 * Projected pixel position of a world point under the fitted camera.
 * Labels are screen-space, so their collisions have to be judged in
 * pixels rather than world units — two anchors a unit apart are far
 * apart in a close scene and touching in a wide one.
 */
function toPixels(cam, p, width, height) {
  const v = new Vector3(...p).project(cam);
  return { x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height };
}

/**
 * Do any two labels overlap once drawn?
 *
 * This is the check the harness figure needed and did not have: six
 * fixed-size names around a ring collided the moment the rig pulled the
 * camera back. Width is estimated from the text at the mono size the Tag
 * component uses, which is close enough to catch a real pile-up.
 */
function labelCollisions(cam, labels, width, height) {
  const CH = 5.2; // px per character at the 0.56rem mono size
  const H = 15; // px line box, including the chip padding
  const rects = labels.map((l) => {
    const p = toPixels(cam, l.at, width, height);
    const w = l.text.length * CH + 12;
    return {
      text: l.text,
      l: l.center === false ? p.x : p.x - w / 2,
      r: l.center === false ? p.x + w : p.x + w / 2,
      t: p.y - H / 2,
      b: p.y + H / 2,
    };
  });

  const hits = [];
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i];
      const b = rects[j];
      const ox = Math.min(a.r, b.r) - Math.max(a.l, b.l);
      const oy = Math.min(a.b, b.b) - Math.max(a.t, b.t);
      if (ox > 2 && oy > 2) hits.push(`${a.text}|${b.text}`);
    }
  }
  return hits;
}

/** Worst-case NDC magnitude across the box's eight corners. */
function worstNdc(cam, box) {
  let worst = 0;
  const v = new Vector3();
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        v.set(x, y, z).project(cam);
        worst = Math.max(worst, Math.abs(v.x), Math.abs(v.y));
      }
    }
  }
  return worst;
}

/**
 * Bounding boxes taken from the extreme coordinates each scene actually
 * places geometry and label anchors at, including the captions that hang
 * below the diagram — the part that used to get cropped.
 */
const SCENES = [
  { name: "the-harness", fov: 40, dir: [0, 2.6, 6.4], min: [-3.4, -2.8, -1.6], max: [3.4, 1.4, 1.6] },
  { name: "calls-cache-threads", fov: 40, dir: [0, 0.9, 6.6], min: [-3.9, -2.6, -0.4], max: [3.9, 1.1, 0.4] },
  { name: "tools-and-mcp", fov: 40, dir: [0, 1.1, 7.2], min: [-3.5, -2.3, -1.6], max: [3.6, 1.6, 1.8] },
  { name: "agent-patterns", fov: 40, dir: [0, 0.3, 7.4], min: [-3.4, -2.3, -0.4], max: [3.4, 1.7, 0.5] },
  { name: "field-guide", fov: 40, dir: [0, 0.7, 7.6], min: [-3.5, -2.2, -1.2], max: [3.3, 1.7, 1.2] },
  { name: "quantization", fov: 40, dir: [0, 0.5, 6.8], min: [-3.4, -3.0, -0.3], max: [3.4, 1.7, 0.3] },
  { name: "serving-and-throughput", fov: 40, dir: [0, 0.6, 7.2], min: [-3.6, -3.2, -0.3], max: [3.6, 1.9, 0.3] },
  { name: "cost-and-economics", fov: 40, dir: [0, 0.35, 6.9], min: [-3.1, -2.5, -0.3], max: [3.2, 1.6, 0.3] },
  { name: "evaluation", fov: 40, dir: [0, 0.9, 7.0], min: [-3.1, -2.3, -0.8], max: [3.2, 1.4, 0.9] },
  { name: "observability", fov: 40, dir: [0, 0.5, 6.9], min: [-3.7, -3.1, -0.3], max: [3.8, 2.4, 0.3] },
  { name: "training:4 landscape", fov: 38, dir: [3.4, 4.6, 6.2], min: [-4.2, -3.5, -3.1], max: [4.2, 1.6, 3.1] },
  { name: "embeddings:3 cones", fov: 42, dir: [3.2, 2.2, 4.4], min: [-2.8, -3.5, -2.8], max: [2.8, 2.6, 2.8] },
  { name: "memory:3 budget", fov: 38, dir: [3.6, 2.4, 5.4], min: [-2.0, -2.7, -1.0], max: [3.6, 2.4, 1.0] },
  // Union of the three failure modes, so the tallest one (the 15 GB
  // column, which is the point) has to fit alongside the widest.
  { name: "attnres:6 failures", fov: 40, dir: [9, 7.4, 9], min: [-6.5, 0, -5.0], max: [6.5, 4.9, 5.0] },
];

/**
 * Scenes whose labels are dense enough to be worth checking. Anchors are
 * the world positions the visual places its Tags at; keep them in step
 * with the component by hand, the same bargain the boxes above make.
 */
const LABELLED = [
  {
    name: "the-harness ring",
    fov: 40,
    ortho: true,
    dir: [9, 7.4, 9],
    fit: 1.16,
    min: [-4.7, 0, -4.7],
    max: [4.7, 2.6, 4.7],
    labels: Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 2 + (i / 6) * Math.PI * 2;
      const R = 3.15 + 1.5;
      return {
        text: ["usuario", "montaje", "prefill", "decode", "actuar", "respuesta"][i],
        at: [Math.cos(a) * R, 0.95, Math.sin(a) * R],
        center: true,
      };
    }),
  },
  {
    // The requirement bolts carry a numeral each; the names moved to the
    // caption precisely because six of them collided here.
    name: "tailscale requirements",
    fov: 40,
    dir: [9, 7.4, 9],
    fit: 1.16,
    min: [-5.2, 0, -3.6],
    max: [5.2, 2.4, 3.6],
    labels: [1, 2, 3, 4, 5, 6].map((n, i) => ({
      text: String(n),
      at: [-4.2, 0.42, -2.6 + i * 1.05],
      center: true,
    })),
  },
  {
    // The densest state the scene can be in: tensor parallel at P = 8.
    // Labelling each column collided at every width, so the row carries
    // one label and the columns carry none. This entry keeps it that way.
    name: "attnres:6 sharded devices",
    fov: 40,
    dir: [9, 7.4, 9],
    fit: 1.16,
    min: [-6.5, 0, -5.0],
    max: [6.5, 4.9, 5.0],
    labels: [
      { text: "8 × 1.9 GB", at: [0, 1.28, 0], center: true },
      { text: "8 × dispositivo", at: [0, 0.2, 2.9], center: true },
      { text: "el arreglo", at: [0, 4.9, -3.4], center: true },
    ],
  },
];

/** Canvas shapes the figures are actually rendered at. */
const ASPECTS = [
  ["phone", 340 / 360],
  ["tablet", 700 / 420],
  ["laptop", 950 / 460],
  ["wide", 1200 / 440],
];

const FIT = 1.12;
let failures = 0;

for (const scene of SCENES) {
  const box = new Box3(new Vector3(...scene.min), new Vector3(...scene.max));
  const row = [];
  for (const [label, aspect] of ASPECTS) {
    const cam = new PerspectiveCamera(scene.fov, aspect, 0.1, 200);
    const { dist } = fitCamera(cam, box, aspect, FIT, new Vector3(...scene.dir));
    const worst = worstNdc(cam, box);
    const fits = worst <= 1.0001;
    if (!fits) failures++;
    row.push(`${label} ${worst.toFixed(2)}${fits ? "" : " ✗"} @${dist.toFixed(1)}`);
  }
  console.log(`${scene.name.padEnd(24)}  ${row.join("   ")}`);
}

/* Label crowding, for the scenes that carry a lot of names. */
let collisions = 0;
for (const scene of LABELLED) {
  const box = new Box3(new Vector3(...scene.min), new Vector3(...scene.max));
  for (const [label, aspect] of ASPECTS) {
    const height = 460;
    const width = Math.round(height * aspect);
    const cam = new PerspectiveCamera(scene.fov, aspect, 0.1, 200);
    fitCamera(cam, box, aspect, scene.fit ?? FIT, new Vector3(...scene.dir));
    const hits = labelCollisions(cam, scene.labels, width, height);
    if (hits.length) {
      collisions += hits.length;
      console.log(`  ${scene.name} @ ${label}: ${hits.length} overlapping — ${hits.slice(0, 3).join("  ")}`);
    }
  }
}

console.log(
  failures === 0
    ? "\nall scenes fit at every aspect (worst NDC <= 1.00)"
    : `\n${failures} scene/aspect pairs overflow the frame`,
);
console.log(
  collisions === 0
    ? "no labels overlap in the scenes that were checked"
    : `${collisions} label pairs overlap`,
);
process.exit(failures === 0 && collisions === 0 ? 0 : 1);
