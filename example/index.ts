import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GUI } from 'lil-gui';
import { EffectComposer, LUTCubeLoader, RenderPass } from 'postprocessing';
import { FilmicPass, View, Look, LUT1DCubeLoader } from '../dist/three-filmic.modern.js';
import { NoToneMapping, sRGBEncoding } from 'three';

const VIEW_OPTIONS = {
	NONE: View.NONE,
	FILMIC: View.FILMIC,
	FILMIC_LOG: View.FILMIC_LOG,
	FALSE_COLOR: View.FALSE_COLOR,
	GRAYSCALE: View.GRAYSCALE,
};

const LOOK_OPTIONS = {
	VERY_HIGH_CONTRAST: Look.VERY_HIGH_CONTRAST,
	HIGH_CONTRAST: Look.HIGH_CONTRAST,
	MEDIUM_HIGH_CONTRAST: Look.MEDIUM_HIGH_CONTRAST,
	MEDIUM_CONTRAST: Look.MEDIUM_CONTRAST,
	MEDIUM_LOW_CONTRAST: Look.MEDIUM_LOW_CONTRAST,
	LOW_CONTRAST: Look.LOW_CONTRAST,
	VERY_LOW_CONTRAST: Look.VERY_LOW_CONTRAST,
}

const params = {
	enabled: true,
	view: 'FILMIC',
	look: 'MEDIUM_CONTRAST',
	exposure: 0,
};

let gui;
let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: THREE.WebGLRenderer;
let composer: EffectComposer;
let filmicPass: FilmicPass;

init().then(render);

async function init() {

	const container = document.createElement( 'div' );
	document.body.appendChild( container );

	camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.25, 20 );
	camera.position.set( - 1.8, 0.6, 2.7 );

	scene = new THREE.Scene();

	new RGBELoader()
		.load( '/assets/royal_esplanade_1k.hdr', function ( texture ) {

			texture.mapping = THREE.EquirectangularReflectionMapping;

			scene.background = texture;
			scene.environment = texture;

			// model

			const loader = new GLTFLoader();
			loader.load( '/assets/DamagedHelmet.glb', function ( gltf ) {

				scene.add( gltf.scene );

			} );

		} );

	renderer = new THREE.WebGLRenderer();
	renderer.physicallyCorrectLights = true;
	renderer.outputEncoding = sRGBEncoding;
	renderer.toneMapping = NoToneMapping;
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	container.appendChild( renderer.domElement );

	const lut3DLoader = new LUTCubeLoader();
	const lut1DLoader = new LUT1DCubeLoader();

	filmicPass = new FilmicPass(camera);
	filmicPass.viewLUTs = {
		[View.FILMIC]: await lut3DLoader.loadAsync('/assets/luts/desat65cube.cube'),
		[View.FALSE_COLOR]: await lut3DLoader.loadAsync('/assets/luts/Filmic_False_Colour.cube'),
	};
	filmicPass.lookLUTs = {
		[Look.VERY_HIGH_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_1.20_1-00.cube'),
		[Look.HIGH_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_0.99_1-0075.cube'),
		[Look.MEDIUM_HIGH_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_0-85_1-011.cube'),
		[Look.MEDIUM_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_0-70_1-03.cube'),
		[Look.MEDIUM_LOW_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_0-60_1-04.cube'),
		[Look.LOW_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_0-48_1-09.cube'),
		[Look.VERY_LOW_CONTRAST]: await lut1DLoader.loadAsync('/assets/luts/Filmic_to_0-35_1-30.cube'),
	};
	filmicPass.build();

	composer = new EffectComposer(renderer, { frameBufferType: THREE.HalfFloatType });
	composer.setSize(window.innerWidth, window.innerHeight);
	composer.addPass(new RenderPass(scene, camera));
	composer.addPass(filmicPass);

	const controls = new OrbitControls(camera, renderer.domElement);
	controls.minDistance = 2;
	controls.maxDistance = 10;
	controls.target.set( 0, 0, - 0.2 );
	controls.update();

	gui = new GUI({width: 300});
	gui.add( params, 'enabled' ).onChange(() => (filmicPass.enabled = params.enabled));
	gui.add( params, 'view', Object.keys( VIEW_OPTIONS ) ).onChange(() => (filmicPass.view = (View as any)[params.view]));
	gui.add( params, 'look', Object.keys( LOOK_OPTIONS ) ).onChange(() => (filmicPass.look = (Look as any)[params.look]));
	gui.add( params, 'exposure' ).min( -10 ).max( 10 ).onChange(() => (filmicPass.exposure = params.exposure));

	// TODO(cleanup): Do without a build method?
	gui.onChange((obj) => {
		setTimeout(() => {
			if (obj.property !== 'exposure') {
				filmicPass.build();
			}
		});
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
