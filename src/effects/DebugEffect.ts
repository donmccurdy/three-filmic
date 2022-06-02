import { BlendFunction, Effect } from 'postprocessing';

export class DebugEffect extends Effect {
	static readonly FRAG = `
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	vec4 c = inputColor;

	if (isinf(c.r) || isinf(c.g) || isinf(c.b)) {
		outputColor.rgba = vec4(1., 0., 0., 1.);
	} else if (isnan(c.r) || isnan(c.g) || isnan(c.b)) {
		outputColor.rgba = vec4(0., 1., 0., 1.);
	} else {
		outputColor.rgba = vec4(0.5, 0.5, 0.5, 1.0);
	}

}
	`.trim();

	constructor() {
		super('DebugEffect', DebugEffect.FRAG, { blendFunction: BlendFunction.SET });
	}
}
