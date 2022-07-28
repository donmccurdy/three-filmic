import { resolve } from 'path';

export default {
	root: 'examples',
	publicDir: '../assets',
	resolve: { alias: { 'three-filmic': '../' } },
	build: {
		rollupOptions: {
			input: {
				main: resolve(__dirname, 'index.html'),
				exr: resolve(__dirname, 'exr.html'),
				gltf: resolve(__dirname, 'gltf.html'),
				reference: resolve(__dirname, 'reference.html'),
			},
		},
	},
};
