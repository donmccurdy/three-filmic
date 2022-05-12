import { Camera, DataTexture, DataTexture3D, LinearEncoding, Matrix4, Vector2 } from 'three';
import { Effect, EffectPass, LookupTexture, LUTEffect } from 'postprocessing';
import { View, DEFAULT_VIEW, Allocation, NEUTRAL_LUT_3D, NEUTRAL_LUT_1D } from './constants';
import { AllocationTransform, ExposureTransform, MatrixTransform, LUT1DEffect } from './effects';

// TODO(docs): API documentation.
export class FilmicPass extends EffectPass {
	private _view: View = DEFAULT_VIEW;

	private _filmicLUT: DataTexture3D | LookupTexture = NEUTRAL_LUT_3D;
	private _falseColorLUT: DataTexture3D | LookupTexture = NEUTRAL_LUT_3D;
	private _lookLUT: DataTexture = NEUTRAL_LUT_1D;

	private _prevEffects: Effect[];

	private _exposureTransform: ExposureTransform;

	constructor(camera: Camera, ...effects: Effect[]) {
		super(camera, ...effects);
		this._prevEffects = effects;
		this._exposureTransform = new ExposureTransform();
	}

	/**************************************************************************
	 * Configuration.
	 */

	get view(): View {
		return this._view;
	}

	set view(view: View) {
		this._view = view;
	}

	get exposure(): number {
		return this._exposureTransform.exposure;
	}

	set exposure(exposure: number) {
		this._exposureTransform.exposure = exposure;
	}

	/**************************************************************************
	 * LUTs.
	 */

	get filmicLUT(): DataTexture3D | LookupTexture {
		return this._filmicLUT;
	}

	set filmicLUT(lut: DataTexture3D | LookupTexture) {
		this._filmicLUT = lut;
	}

	get falseColorLUT(): DataTexture3D | LookupTexture {
		return this._falseColorLUT;
	}

	set falseColorLUT(lut: DataTexture3D | LookupTexture) {
		this._falseColorLUT = lut;
	}

	get lookLUT(): DataTexture {
		return this._lookLUT;
	}

	set lookLUT(lut: DataTexture) {
		this._lookLUT = lut;
	}

	/**************************************************************************
	 * Internal.
	 */

	// TODO(cleanup): Do without a build method?
	// TODO(cleanup): Why does every effect have a blend function?
	recompile() {
		// Reset previous filmic transform.
		this.effects.length = this._prevEffects.length;

		// 1. Exposure.
		this.effects.push(this._exposureTransform);

		if (this._view !== View.NONE) {
			// TODO(cleanup): Make 'inputEncoding' a parameter.
			const filmicEffect = new LUTEffect(this.filmicLUT);
			filmicEffect.inputEncoding = LinearEncoding;

			// 2. Scene Linear to Filmic Log
			this.effects.push(
				new AllocationTransform({
					allocation: Allocation.LG2,
					domain: new Vector2(-12.473931188, 12.526068812),
				}),
				filmicEffect,
				new AllocationTransform({
					allocation: Allocation.UNIFORM,
					domain: new Vector2(0, 0.66),
				})
			);

			// 3. Look Transform
			if (this._view === View.FILMIC || this._view === View.GRAYSCALE) {
				this.effects.push(new LUT1DEffect(this._lookLUT));
			}

			// 4. View Transform
			if (this._view === View.GRAYSCALE || this._view === View.FALSE_COLOR) {
				this.effects.push(
					new MatrixTransform(
						// prettier-ignore
						new Matrix4().fromArray([
							0.2126729, 0.7151521, 0.072175, 0,
							0.2126729, 0.7151521, 0.072175, 0,
							0.2126729, 0.7151521, 0.072175, 0,
							0, 0, 0, 1,
						])
					)
				);
			}
			if (this._view === View.FALSE_COLOR) {
				// TODO(perf): Couldn't this be a 1D LUT?
				// TODO(cleanup): Make 'inputEncoding' a parameter.
				const falseColorEffect = new LUTEffect(this._falseColorLUT);
				falseColorEffect.inputEncoding = LinearEncoding;
				this.effects.push(falseColorEffect);
			}
		}

		// Look Transforms output to sRGB. When no Look is applied, include the
		// default output encoding.
		this.fullscreenMaterial.encodeOutput = this._view === View.NONE;

		if (this.renderer) super.recompile();
	}
}
