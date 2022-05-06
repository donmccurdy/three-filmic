import { Camera, DataTexture, DataTexture3D, Matrix4, Vector2 } from 'three';
import { Effect, EffectPass, LUTEffect } from 'postprocessing';
import { View, Look, DEFAULT_VIEW, DEFAULT_LOOK, Allocation, } from './constants';
import { AllocationTransform, ExposureTransform, MatrixTransform, LUT1DEffect } from './effects';

export interface ViewLUTTextures {
	[View.NONE]?: null,
	[View.FILMIC]?: DataTexture3D,
	[View.FILMIC_LOG]?: DataTexture3D,
	[View.FALSE_COLOR]?: DataTexture3D,
}

export interface LookLUTTextures {
	[Look.VERY_HIGH_CONTRAST]?: DataTexture,
	[Look.HIGH_CONTRAST]?: DataTexture,
	[Look.MEDIUM_HIGH_CONTRAST]?: DataTexture,
	[Look.MEDIUM_CONTRAST]?: DataTexture,
	[Look.MEDIUM_LOW_CONTRAST]?: DataTexture,
	[Look.LOW_CONTRAST]?: DataTexture,
	[Look.VERY_LOW_CONTRAST]?: DataTexture,
}

export class FilmicPass extends EffectPass {
	private _view: View = DEFAULT_VIEW;
	private _look: Look = DEFAULT_LOOK;

	private _viewLUTs: ViewLUTTextures = {};
	private _lookLUTs: LookLUTTextures = {};

	private _prevEffects: Effect[];

	private _exposureTransform: ExposureTransform;

	constructor(camera: Camera, ...effects: Effect[]) {
		super(camera, ...effects);
		this._prevEffects = effects;
		this._exposureTransform = new ExposureTransform();
	}

	get view(): View {
		return this._view;
	}

	set view(view: View) {
		this._view = view;
	}

	get look(): Look {
		return this._look;
	}

	set look(look: Look) {
		this._look = look;
	}

	get exposure(): number {
		return this._exposureTransform.exposure;
	}

	set exposure(exposure: number) {
		this._exposureTransform.exposure = exposure;
	}

	get viewLUTs(): ViewLUTTextures {
		return this._viewLUTs;
	}

	set viewLUTs(luts: ViewLUTTextures) {
		this._viewLUTs = {...this._viewLUTs, ...luts};
	}

	get lookLUTs(): LookLUTTextures {
		return this._lookLUTs;
	}

	set lookLUTs(luts: LookLUTTextures) {
		this._lookLUTs = {...this._lookLUTs, ...luts};
	}

	// TODO(cleanup): Do without a build method?
	build() {
		this.effects.length = this._prevEffects.length;

		this.effects.push(this._exposureTransform);

		if (this._view !== View.NONE) {

			// # Scene Linear to Filmic Log
			this.effects.push(
				new AllocationTransform({
					allocation: Allocation.LG2,
					domain: new Vector2(-12.473931188, 12.526068812)
				}),
				new LUTEffect(this._viewLUTs[View.FILMIC]!),
				new AllocationTransform({
					allocation: Allocation.UNIFORM,
					domain: new Vector2(0, 0.66)
				}),
			);

			// # Look Transform
			// !<FileTransform> {src: filmic_to_0-70_1-03.spi1d, interpolation: linear}
			// {#if LOOK != Look.MEDIUM_CONTRAST}
			//   !<FileTransform> {src: filmic_to_0-???????.spi1d, interpolation: linear}
			//   !<FileTransform> {src: filmic_to_0-70_1-03.spi1d, interpolation: linear, direction: inverse}
			// {#endif
			// TODO(bug): This line isn't in the right place, I think.
			// this.effects.push(
			// 	new LUT1DEffect(this._lookLUTs[this._look]!),
			// );

			// # View Transform
			if (this._view === View.FILMIC) {
				this.effects.push(
					new AllocationTransform({
						allocation: Allocation.LG2,
						domain: new Vector2(-12.473931188, 4.026068812),
						inverse: true,
					}),
				);
			} else if (this._view === View.FALSE_COLOR) {
				this.effects.push(
					new MatrixTransform(new Matrix4().fromArray([
						0.2126729, 0.7151521, 0.0721750, 0,
						0.2126729, 0.7151521, 0.0721750, 0,
						0.2126729, 0.7151521, 0.0721750, 0,
						0, 0, 0, 1
					])),
					new LUTEffect(this._viewLUTs[View.FALSE_COLOR]!),
				);
			}

		}

		if (this.renderer) this.recompile();
	}
}
