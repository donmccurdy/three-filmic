import * as THREE from 'three';
import { EffectComposer, LUTCubeLoader, RenderPass } from 'postprocessing';
import { FilmicPass, View, Look, LUT1DCubeLoader } from '../dist/three-filmic.modern.js';
import { EXRLoader } from './EXRLoader.js';

/******************************************************************************
 * Reference images.
 */

const WIDTH = 960;
const HEIGHT = 540;

const LOOK_OPTIONS: Record<Look, string> = {
	[Look.VERY_HIGH_CONTRAST]: '/assets/luts/Filmic_to_1.20_1-00.cube',
	[Look.HIGH_CONTRAST]: '/assets/luts/Filmic_to_0.99_1-0075.cube',
	[Look.MEDIUM_HIGH_CONTRAST]: '/assets/luts/Filmic_to_0-85_1-011.cube',
	[Look.MEDIUM_CONTRAST]: '/assets/luts/Filmic_to_0-70_1-03.cube',
	[Look.MEDIUM_LOW_CONTRAST]: '/assets/luts/Filmic_to_0-60_1-04.cube',
	[Look.LOW_CONTRAST]: '/assets/luts/Filmic_to_0-48_1-09.cube',
	[Look.VERY_LOW_CONTRAST]: '/assets/luts/Filmic_to_0-35_1-30.cube',
};

const IMAGES = [
	{
		id: 'very_high',
		name: 'Very High',
		view: View.FILMIC,
		look: Look.VERY_HIGH_CONTRAST,
	},
	{
		id: 'high',
		name: 'High',
		view: View.FILMIC,
		look: Look.HIGH_CONTRAST,
	},
	{
		id: 'medium_high',
		name: 'Medium High',
		view: View.FILMIC,
		look: Look.MEDIUM_HIGH_CONTRAST,
	},
	{
		id: 'medium',
		name: 'Medium',
		view: View.FILMIC,
		look: Look.MEDIUM_CONTRAST,
	},
	{
		id: 'medium_low',
		name: 'Medium Low',
		view: View.FILMIC,
		look: Look.MEDIUM_LOW_CONTRAST,
	},
	{
		id: 'low',
		name: 'Low',
		view: View.FILMIC,
		look: Look.LOW_CONTRAST,
	},
	{
		id: 'very_low',
		name: 'Very Low',
		view: View.FILMIC,
		look: Look.VERY_LOW_CONTRAST,
	},
	{
		id: 'false_color',
		name: 'False Color',
		view: View.FALSE_COLOR,
		look: Look.NONE,
	},
];

/******************************************************************************
 * Setup.
 */

const lut3DLoader = new LUTCubeLoader();
const lut1DLoader = new LUT1DCubeLoader();
const exrLoader = new EXRLoader();

let renderer: THREE.WebGLRenderer;
let scene: THREE.Scene;
let camera: THREE.Camera;

let composer: EffectComposer;
let filmicPass: FilmicPass;

async function init() {
	camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.25, 20);
	camera.position.set(0, 0, 1);

	// Scene.

	scene = new THREE.Scene();
	scene.add(camera);
	scene.background = await exrLoader.loadAsync('/assets/reference/cornell_box.exr');
	(scene.background as THREE.Texture).encoding = THREE.LinearEncoding;

	// Renderer.

	renderer = new THREE.WebGLRenderer();
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(1);
	renderer.setSize(WIDTH, HEIGHT);
	renderer.setClearColor(0x4285f4);

	// Post-processing.

	filmicPass = new FilmicPass(camera);
	filmicPass.filmicLUT = await lut3DLoader.loadAsync('/assets/luts/desat65cube.cube');
	filmicPass.filmicLUT.encoding = THREE.LinearEncoding;
	filmicPass.falseColorLUT = await lut3DLoader.loadAsync('/assets/luts/Filmic_False_Colour.cube');
	filmicPass.falseColorLUT.encoding = THREE.sRGBEncoding;
	filmicPass.recompile();

	composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
	composer.setSize(WIDTH, HEIGHT);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(filmicPass);
}

async function renderImage(canvasEl: HTMLCanvasElement, view: View, look: Look) {
	filmicPass.view = view;
	filmicPass.lookLUT = await lut1DLoader.loadAsync(LOOK_OPTIONS[look]);
	filmicPass.lookLUT.encoding = THREE.sRGBEncoding;
	filmicPass.recompile();

	composer.render();

	const ctx = canvasEl.getContext('2d') as CanvasRenderingContext2D;
	ctx.drawImage(renderer.domElement, 0, 0);
}

/******************************************************************************
 * Render.
 */

main();

async function main() {
	await init();

	const mainEl = document.querySelector('main')!;

	for (const image of IMAGES) {
		const sectionEl = document.createElement('section');
		mainEl.appendChild(sectionEl);
		sectionEl.innerHTML = `
<h2>${image.name}</h2>
<figure>
	<img src="/assets/reference/out/${image.id}.png" alt="">
	<canvas id="${image.id}" width=960 height=540></canvas>
	<figcaption>
		<div class="caption -left">OpenImageIO</div>
		<div class="caption -right">three-filmic</div>
	</figcaption>
</figure>
		`.trim();

		const canvasEl = sectionEl.querySelector('canvas') as HTMLCanvasElement;

		await renderImage(canvasEl, image.view, image.look);
	}
}
