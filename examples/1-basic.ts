import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GUI } from 'lil-gui';
import { EffectComposer, LUTCubeLoader, RenderPass } from 'postprocessing';
import { FilmicPass, View, Look, LUT1DCubeLoader } from '../dist/three-filmic.modern.js';
import { NoToneMapping, sRGBEncoding } from 'three';

const lut3DLoader = new LUTCubeLoader();
const lut1DLoader = new LUT1DCubeLoader();

const params = {
	view: 'FILMIC',
	look: 'MEDIUM_CONTRAST',
	exposure: 0,
};

const VIEW_OPTIONS: Record<View, View> = {
	NONE: View.NONE,
	FILMIC: View.FILMIC,
	FILMIC_LOG: View.FILMIC_LOG,
	FALSE_COLOR: View.FALSE_COLOR,
	GRAYSCALE: View.GRAYSCALE,
};

const LOOK_OPTIONS: Record<Look, string> = {
	VERY_HIGH_CONTRAST: '/assets/luts/Filmic_to_1.20_1-00.cube',
	HIGH_CONTRAST: '/assets/luts/Filmic_to_0.99_1-0075.cube',
	MEDIUM_HIGH_CONTRAST: '/assets/luts/Filmic_to_0-85_1-011.cube',
	MEDIUM_CONTRAST: '/assets/luts/Filmic_to_0-70_1-03.cube',
	MEDIUM_LOW_CONTRAST: '/assets/luts/Filmic_to_0-60_1-04.cube',
	LOW_CONTRAST: '/assets/luts/Filmic_to_0-48_1-09.cube',
	VERY_LOW_CONTRAST: '/assets/luts/Filmic_to_0-35_1-30.cube',
};

let gui;
let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let filmicPass: FilmicPass;

init().then(render);

async function init() {
	const container = document.createElement('div');
	document.body.appendChild(container);

	camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.25, 20);
	camera.position.set(-1.8, 0.6, 2.7);

	scene = new THREE.Scene();

	// Model.

	new GLTFLoader().load('/assets/DamagedHelmet.glb', (gltf) => {
		scene.add(gltf.scene);
	});

	// Environment.

	new RGBELoader().load('/assets/royal_esplanade_1k.hdr', (texture) => {
		texture.mapping = THREE.EquirectangularReflectionMapping;
		scene.background = texture;
		scene.environment = texture;
	});

	// Renderer.

	renderer = new THREE.WebGLRenderer();
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = sRGBEncoding;
	renderer.toneMapping = NoToneMapping;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	// Post-processing.

	filmicPass = new FilmicPass(camera);
	filmicPass.filmicLUT = await lut3DLoader.loadAsync('/assets/luts/desat65cube.cube');
	filmicPass.falseColorLUT = await lut3DLoader.loadAsync('/assets/luts/Filmic_False_Colour.cube');
	filmicPass.lookLUT = await lut1DLoader.loadAsync(LOOK_OPTIONS[params.look]);
	filmicPass.recompile();

	composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
	composer.setSize(window.innerWidth, window.innerHeight);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(filmicPass);

	// Controls.

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.target.set(0, 0, -0.2);
	controls.update();

	// GUI.

	gui = new GUI({ width: 250 });
	gui.add(params, 'view', Object.keys(VIEW_OPTIONS)).onChange(() => {
		filmicPass.view = VIEW_OPTIONS[params.view];
		filmicPass.recompile();
	});
	gui.add(params, 'look', Object.keys(LOOK_OPTIONS)).onChange(async () => {
		filmicPass.lookLUT = await lut1DLoader.loadAsync(LOOK_OPTIONS[params.look]);
		filmicPass.recompile();
	});
	gui.add(params, 'exposure')
		.min(-10)
		.max(10)
		.onChange(() => {
			filmicPass.exposure = params.exposure;
		});

	window.addEventListener('resize', onWindowResize);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	composer.setSize(window.innerWidth, window.innerHeight);
}

//

function render() {
	requestAnimationFrame(render);
	composer.render();
}
