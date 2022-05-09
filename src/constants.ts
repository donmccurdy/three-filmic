import { LookupTexture } from 'postprocessing';
import { ClampToEdgeWrapping, DataTexture, FloatType, LinearFilter, RedFormat, UVMapping } from 'three';

export enum View {
	NONE = 5000,
	FILMIC = 5001,
	FILMIC_LOG = 5002,
	FALSE_COLOR = 5003,
	GRAYSCALE = 5004,
}

export enum Look {
	NONE = 5100,
	VERY_HIGH_CONTRAST = 5101,
	HIGH_CONTRAST = 5102,
	MEDIUM_HIGH_CONTRAST = 5103,
	MEDIUM_CONTRAST = 5100,
	MEDIUM_LOW_CONTRAST = 5104,
	LOW_CONTRAST = 5105,
	VERY_LOW_CONTRAST = 5106,
}

export enum Allocation {
	UNIFORM = 5200,
	LG2 = 5201,
}

export const DEFAULT_VIEW = View.FILMIC;
export const DEFAULT_EXPOSURE = 0;

export enum Defines {
	ALLOCATION = 'FILMIC_ALLOCATION',
	INVERSE = 'FILMIC_INVERSE',
}

export enum Uniforms {
	EXPOSURE = 'exposure',
	MATRIX = 'matrix',
	LUT = 'lut',
	DOMAIN = 'domain',
	RANGE = 'range',
}

export const NEUTRAL_LUT_1D = new DataTexture(
	new Float32Array([0, 0.25, 0.5, 0.75, 1]),
	5,
	1,
	RedFormat,
	FloatType,
	UVMapping,
	ClampToEdgeWrapping,
	ClampToEdgeWrapping,
	LinearFilter,
	LinearFilter
);
NEUTRAL_LUT_1D.name = 'neutral1D';
NEUTRAL_LUT_1D.needsUpdate = true;

export const NEUTRAL_LUT_3D = LookupTexture.createNeutral(8);
NEUTRAL_LUT_3D.name = 'neutral3D';
