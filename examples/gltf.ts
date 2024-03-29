import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { GUI } from 'lil-gui';
import { EffectComposer, LookupTexture, RenderPass } from 'postprocessing';
import { FilmicPass, View, Look } from 'three-filmic';
import { DataTexture } from 'three';

const ktx2Loader = new KTX2Loader();

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
	VERY_HIGH_CONTRAST: '/luts/Filmic_to_1.20_1-00.ktx2',
	HIGH_CONTRAST: '/luts/Filmic_to_0.99_1-0075.ktx2',
	MEDIUM_HIGH_CONTRAST: '/luts/Filmic_to_0-85_1-011.ktx2',
	MEDIUM_CONTRAST: '/luts/Filmic_to_0-70_1-03.ktx2',
	MEDIUM_LOW_CONTRAST: '/luts/Filmic_to_0-60_1-04.ktx2',
	LOW_CONTRAST: '/luts/Filmic_to_0-48_1-09.ktx2',
	VERY_LOW_CONTRAST: '/luts/Filmic_to_0-35_1-30.ktx2',
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

	new GLTFLoader().load('/DamagedHelmet.glb', (gltf) => {
		scene.add(gltf.scene);
	});

	// Environment.

	new RGBELoader().load('/royal_esplanade_1k.hdr', (texture) => {
		texture.mapping = THREE.EquirectangularReflectionMapping;
		scene.background = texture;
		scene.environment = texture;
	});

	// Renderer.

	renderer = new THREE.WebGLRenderer();
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	container.appendChild(renderer.domElement);

	ktx2Loader.detectSupport(renderer);

	// Post-processing.

	filmicPass = new FilmicPass(camera);
	filmicPass.filmicLUT = LookupTexture.from(await ktx2Loader.loadAsync('/luts/desat65cube.ktx2'));
	filmicPass.falseColorLUT = LookupTexture.from(
		await ktx2Loader.loadAsync('/luts/Filmic_False_Colour.ktx2')
	);
	filmicPass.lookLUT = (await ktx2Loader.loadAsync(
		LOOK_OPTIONS[params.look]
	)) as unknown as DataTexture;
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
		filmicPass.lookLUT = (await ktx2Loader.loadAsync(
			LOOK_OPTIONS[params.look]
		)) as unknown as DataTexture;
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
