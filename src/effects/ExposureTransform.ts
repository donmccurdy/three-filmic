import { BlendFunction, Effect } from 'postprocessing';
import { Uniform } from 'three';
import { DEFAULT_EXPOSURE, DEFAULT_VIEW, Defines, Uniforms } from '../constants';

export class ExposureTransform extends Effect {
	static readonly FRAG = `
uniform float ${Uniforms.EXPOSURE};

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	// TODO(test): Multiply, or 2^exposure?
	outputColor = vec4(inputColor.rgb * pow(2.0, ${Uniforms.EXPOSURE}), inputColor.a);

}
	`.trim();

	constructor(exposure = DEFAULT_EXPOSURE) {
		super('ExposureTransform', ExposureTransform.FRAG, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([[Uniforms.EXPOSURE, new Uniform(exposure)]]),
		});
	}

	get exposure(): number {
		return this.uniforms.get(Uniforms.EXPOSURE)!.value;
	}

	set exposure(exposure: number) {
		this.uniforms.get(Uniforms.EXPOSURE)!.value = exposure;
	}
}
