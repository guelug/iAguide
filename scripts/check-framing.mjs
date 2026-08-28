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

/** Same formula as CameraRig. Keep the two in sync by hand. */
function fitCamera(cam, box, aspect, fit, dirRaw) {
  const center = box.getCenter(new Vector3());
  const span = box.getSize(new Vector3());
  const vFov = MathUtils.degToRad(cam.fov);
  const halfV = Math.tan(vFov / 2);
  const halfH = halfV * aspect;
  const dist =
    Math.max(span.y / 2 / halfV, span.x / 2 / halfH) * fit + span.z / 2 + 0.2;

  const dir = dirRaw.clone();
  if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
  dir.normalize();

  cam.aspect = aspect;
  cam.position.copy(center).addScaledVector(dir, dist);
  cam.lookAt(center);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);
  return { center, span, dist };
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

console.log(
  failures === 0
    ? "\nall scenes fit at every aspect (worst NDC <= 1.00)"
    : `\n${failures} scene/aspect pairs overflow the frame`,
);
process.exit(failures === 0 ? 0 : 1);
