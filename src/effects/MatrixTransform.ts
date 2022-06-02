import { BlendFunction, Effect } from 'postprocessing';
import { Matrix4, Uniform } from 'three';
import { Uniforms } from '../constants';

export class MatrixTransform extends Effect {
	static readonly FRAG = `
uniform mat4 ${Uniforms.MATRIX};

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	outputColor = inputColor * ${Uniforms.MATRIX};

}
	`.trim();

	readonly matrix: Matrix4;

	constructor(matrix: Matrix4) {
		super('MatrixTransform', MatrixTransform.FRAG, {
			blendFunction: BlendFunction.SET,
			uniforms: new Map([[Uniforms.MATRIX, new Uniform(matrix)]]),
		});
		this.matrix = matrix;
	}
}
