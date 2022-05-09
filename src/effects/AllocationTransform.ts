import { BlendFunction, Effect } from 'postprocessing';
import { Uniform, Vector2 } from 'three';
import { Allocation, Defines, Uniforms } from '../constants';

interface AllocationOptions {
	allocation: Allocation;
	domain: Vector2;
	range: Vector2;
	inverse: boolean;
}

const DEFAULTS: AllocationOptions = {
	allocation: Allocation.UNIFORM,
	domain: new Vector2(0, 1),
	range: new Vector2(0, 1),
	inverse: false,
};

export class AllocationTransform extends Effect {
	static readonly FRAG = `
uniform vec2 ${Uniforms.DOMAIN};
uniform vec2 ${Uniforms.RANGE};

vec3 remap(vec3 value, vec2 domain, vec2 range) {
	return range.x + ( value - domain.x ) * ( range.y - range.x ) / ( domain.y - domain.x );
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {

	vec3 color = inputColor.rgb;

	#ifndef ${Defines.INVERSE}

		#if ${Defines.ALLOCATION} == ${Allocation.LG2}

			color = log2(color);

		#endif

		color = remap(color, domain, range);

	#else

		color = remap(color, range, domain);

		#if ${Defines.ALLOCATION} == ${Allocation.LG2}

			color.r = pow(2.0, color.r);
			color.g = pow(2.0, color.g);
			color.b = pow(2.0, color.b);

		#endif

	#endif

	outputColor = vec4(color, inputColor.a);

}
	`.trim();

	constructor(options = {} as Partial<AllocationOptions>) {
		const _options = { ...DEFAULTS, ...options } as Required<AllocationOptions>;
		super('AllocationTransform', AllocationTransform.FRAG, {
			blendFunction: BlendFunction.NORMAL,
			uniforms: new Map([
				[Uniforms.DOMAIN, new Uniform(_options.domain)],
				[Uniforms.RANGE, new Uniform(_options.range)],
			]),
			defines: new Map([[Defines.ALLOCATION, _options.allocation.toFixed(0)]]),
		});
		if (_options.inverse) {
			this.defines.set(Defines.INVERSE, '');
		}
	}
}
