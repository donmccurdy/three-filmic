import * as THREE from 'three';
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { GUI } from 'lil-gui';
import { EffectComposer, LUTCubeLoader, RenderPass } from 'postprocessing';
import { FilmicPass, View, Look, LUT1DCubeLoader } from 'three-filmic';

const lut3DLoader = new LUTCubeLoader();
const lut1DLoader = new LUT1DCubeLoader();

const params = {
	view: 'FILMIC',
	look: 'MEDIUM_CONTRAST',
	exposure: 0,
};

const VIEW_OPTIONS: Record<keyof View, View> = {
	NONE: View.NONE,
	FILMIC: View.FILMIC,
	FILMIC_LOG: View.FILMIC_LOG,
	FALSE_COLOR: View.FALSE_COLOR,
	GRAYSCALE: View.GRAYSCALE,
};

const LOOK_OPTIONS: Record<keyof Look, string> = {
	VERY_HIGH_CONTRAST: '/luts/Filmic_to_1.20_1-00.cube',
	HIGH_CONTRAST: '/luts/Filmic_to_0.99_1-0075.cube',
	MEDIUM_HIGH_CONTRAST: '/luts/Filmic_to_0-85_1-011.cube',
	MEDIUM_CONTRAST: '/luts/Filmic_to_0-70_1-03.cube',
	MEDIUM_LOW_CONTRAST: '/luts/Filmic_to_0-60_1-04.cube',
	LOW_CONTRAST: '/luts/Filmic_to_0-48_1-09.cube',
	VERY_LOW_CONTRAST: '/luts/Filmic_to_0-35_1-30.cube',
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

	new EXRLoader().load('/reference/cornell_box.exr', (texture: THREE.DataTexture) => {
		texture.encoding = THREE.LinearEncoding;

		const aspect = texture.image.width / texture.image.height;
		mesh.scale.x = aspect > 1 ? 1 : 1 / aspect;
		mesh.scale.y = aspect > 1 ? 1 / aspect : 1;

		mesh.material.map = texture;
	});

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

	renderer.domElement.style.alignSelf = 'center';
	document.body.appendChild(renderer.domElement);

	// Post-processing.

	filmicPass = new FilmicPass(camera);
	filmicPass.view = View[params.view];
	filmicPass.filmicLUT = await lut3DLoader.loadAsync('/luts/desat65cube.cube');
	filmicPass.filmicLUT.encoding = THREE.LinearEncoding;
	filmicPass.falseColorLUT = await lut3DLoader.loadAsync('/luts/Filmic_False_Colour.cube');
	filmicPass.falseColorLUT.encoding = THREE.sRGBEncoding;
	filmicPass.lookLUT = await lut1DLoader.loadAsync(LOOK_OPTIONS[params.look]);
	filmicPass.recompile();

	composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
	composer.setSize(size, size);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(filmicPass);

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
}

//

function render() {
	requestAnimationFrame(render);
	composer.render();
}
