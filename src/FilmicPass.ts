import { Camera, DataTexture, Data3DTexture, LinearEncoding, Matrix4, Vector2 } from 'three';
import {
	BlendFunction,
	Effect,
	EffectPass,
	LookupTexture,
	LUT1DEffect,
	LUT3DEffect,
} from 'postprocessing';
import { View, DEFAULT_VIEW, Allocation, NEUTRAL_LUT_3D, NEUTRAL_LUT_1D, $TODO } from './constants';
import { AllocationTransform, ExposureTransform, MatrixTransform } from './effects';

// TODO(docs): API documentation.
export class FilmicPass extends EffectPass {
	private _view: View = DEFAULT_VIEW;

	private _filmicLUT: Data3DTexture | LookupTexture = NEUTRAL_LUT_3D;
	private _falseColorLUT: Data3DTexture | LookupTexture = NEUTRAL_LUT_3D;
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

	get filmicLUT(): Data3DTexture | LookupTexture {
		return this._filmicLUT;
	}

	set filmicLUT(lut: Data3DTexture | LookupTexture) {
		this._filmicLUT = lut;
	}

	get falseColorLUT(): Data3DTexture | LookupTexture {
		return this._falseColorLUT;
	}

	set falseColorLUT(lut: Data3DTexture | LookupTexture) {
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
		const effects = [...this._prevEffects];

		// 1. Exposure.
		effects.push(this._exposureTransform);

		if (this._view !== View.NONE) {
			// 2. Scene Linear to Filmic Log
			effects.push(
				new AllocationTransform({
					allocation: Allocation.LG2,
					domain: new Vector2(-12.473931188, 12.526068812),
				}),
				new LUT3DEffect(this.filmicLUT, {
					blendFunction: BlendFunction.SET,
					inputEncoding: LinearEncoding,
				} as $TODO),
				new AllocationTransform({
					allocation: Allocation.UNIFORM,
					domain: new Vector2(0, 0.66),
				})
			);

			// 3. Look Transform
			if (this._view === View.FILMIC || this._view === View.GRAYSCALE) {
				effects.push(
					new LUT1DEffect(this._lookLUT, {
						blendFunction: BlendFunction.SET,
					})
				);
			}

			// 4. View Transform
			if (this._view === View.GRAYSCALE || this._view === View.FALSE_COLOR) {
				effects.push(
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
				effects.push(
					new LUT3DEffect(this._falseColorLUT, {
						blendFunction: BlendFunction.SET,
						inputEncoding: LinearEncoding,
					} as $TODO)
				);
			}
		}

		// Look Transforms output to sRGB. When no Look is applied, include the
		// default output encoding.
		this.fullscreenMaterial.encodeOutput = this._view === View.NONE;

		this.setEffects(effects);

		super.recompile();
	}
}
