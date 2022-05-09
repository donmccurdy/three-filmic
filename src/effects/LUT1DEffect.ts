import { BlendFunction, Effect } from 'postprocessing';
import { DataTexture, Uniform } from 'three';
import { Defines, Uniforms } from '../constants';

export class LUT1DEffect extends Effect {
	static readonly FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH

	uniform highp sampler2D ${Uniforms.LUT};

#else

	uniform mediump sampler2D ${Uniforms.LUT};

#endif

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	outputColor = vec4(
		texture2D(${Uniforms.LUT}, vec2(inputColor.r, 0.5)).r,
		texture2D(${Uniforms.LUT}, vec2(inputColor.g, 0.5)).r,
		texture2D(${Uniforms.LUT}, vec2(inputColor.b, 0.5)).r,
		inputColor.a
	);

}
	`.trim();

	constructor(lut: DataTexture) {
		super('LUT1DEffect', LUT1DEffect.FRAG, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([[Uniforms.LUT, new Uniform(lut)]]),
		});
	}

	get lut(): DataTexture {
		return this.uniforms.get(Uniforms.LUT)!.value as DataTexture;
	}

	set lut(lut: DataTexture) {
		this.uniforms.get(Uniforms.LUT)!.value = lut;
		this.setChanged();
	}
}
