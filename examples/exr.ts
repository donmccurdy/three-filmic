import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { GUI } from 'lil-gui';
import { EffectComposer, RenderPass, LookupTexture } from 'postprocessing';
import { FilmicPass, View, Look } from 'three-filmic';
import { DataTexture } from 'three';

const exrLoader = new EXRLoader();
const ktx2Loader = new KTX2Loader();

const IMAGE_OPTIONS: Record<string, string> = {
	CORNELL_BOX: '/reference/cornell_box.exr',
	STEPCHART: '/reference/stepchart.exr',
};

const VIEW_OPTIONS: Record<keyof View, View> = {
	NONE: View.NONE,
	FILMIC: View.FILMIC,
	FILMIC_LOG: View.FILMIC_LOG,
	FALSE_COLOR: View.FALSE_COLOR,
	GRAYSCALE: View.GRAYSCALE,
};

const LOOK_OPTIONS: Record<keyof Look, string> = {
	VERY_HIGH_CONTRAST: '/luts/Filmic_to_1.20_1-00.ktx2',
	HIGH_CONTRAST: '/luts/Filmic_to_0.99_1-0075.ktx2',
	MEDIUM_HIGH_CONTRAST: '/luts/Filmic_to_0-85_1-011.ktx2',
	MEDIUM_CONTRAST: '/luts/Filmic_to_0-70_1-03.ktx2',
	MEDIUM_LOW_CONTRAST: '/luts/Filmic_to_0-60_1-04.ktx2',
	LOW_CONTRAST: '/luts/Filmic_to_0-48_1-09.ktx2',
	VERY_LOW_CONTRAST: '/luts/Filmic_to_0-35_1-30.ktx2',
};

const params = {
	image: 'CORNELL_BOX',
	view: 'FILMIC',
	look: 'MEDIUM_CONTRAST',
	exposure: 0,
};

let gui;
let camera: THREE.OrthographicCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let filmicPass: FilmicPass;
let mesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;

const CANVAS_SIZE = 1024;

init().then(render);

async function init() {
	camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.25, 20);
	camera.position.set(0, 0, 1);

	// EXR.

	mesh = new THREE.Mesh(
		new THREE.PlaneBufferGeometry(),
		new THREE.MeshBasicMaterial({ color: 0xffffff })
	);

	await loadImage(IMAGE_OPTIONS.CORNELL_BOX);

	// Scene.

	scene = new THREE.Scene();
	scene.add(mesh);
	scene.add(camera);

	// Renderer.

	renderer = new THREE.WebGLRenderer();
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = THREE.sRGBEncoding;
	renderer.toneMapping = THREE.NoToneMapping;
	renderer.setPixelRatio(window.devicePixelRatio);
	const size = Math.min(window.innerWidth, CANVAS_SIZE);
	renderer.setSize(size, size);

	ktx2Loader.detectSupport(renderer);

	renderer.domElement.style.alignSelf = 'center';
	document.body.appendChild(renderer.domElement);

	// Post-processing.

	filmicPass = new FilmicPass(camera);
	filmicPass.view = View[params.view];
	filmicPass.filmicLUT = LookupTexture.from(await ktx2Loader.loadAsync('/luts/desat65cube.ktx2'));
	filmicPass.filmicLUT.encoding = THREE.LinearEncoding;
	filmicPass.falseColorLUT = LookupTexture.from(
		await ktx2Loader.loadAsync('/luts/Filmic_False_Colour.ktx2')
	);
	filmicPass.falseColorLUT.encoding = THREE.sRGBEncoding;
	filmicPass.lookLUT = (await ktx2Loader.loadAsync(
		LOOK_OPTIONS[params.look]
	)) as unknown as DataTexture;
	filmicPass.recompile();

	composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
	composer.setSize(size, size);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(filmicPass);

	// GUI.

	gui = new GUI({ width: 250 });
	gui.add(params, 'image', Object.keys(IMAGE_OPTIONS)).onChange(() => {
		loadImage(IMAGE_OPTIONS[params.image]);
	});
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
}

async function loadImage(imageURL: string) {
	const texture = (await exrLoader.loadAsync(imageURL)) as THREE.DataTexture;

	texture.encoding = THREE.LinearEncoding;

	const aspect = texture.image.width / texture.image.height;
	mesh.scale.x = aspect > 1 ? 1 : 1 / aspect;
	mesh.scale.y = aspect > 1 ? 1 / aspect : 1;

	// TODO: cache
	if (mesh.material.map) {
		mesh.material.map.dispose();
	}

	mesh.material.map = texture;
}

//

function render() {
	requestAnimationFrame(render);
	composer.render();
}
