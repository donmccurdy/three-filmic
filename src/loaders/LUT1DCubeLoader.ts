import { ClampToEdgeWrapping, DataTexture, FloatType, LinearFilter, Loader, RedFormat, Texture, UVMapping } from 'three';

export class LUT1DCubeLoader extends Loader {
    load(path: string, onLoad: (texture: Texture) => void, onError: (e: Error) => void) {
        fetch(path)
            .then((res) => res.text())
            .then((text) => {
                const lines = text.split('\n');
                const length = Number(lines[0].split(' ').pop());
                // TODO(cleanup): HalfFloat maybe.
                const array = new Float32Array(length);
                for (let i = 1; i < lines.length; i++) {
                    array[i - 1] = Number(lines[i].slice(0, 8));
                }
                const texture = new DataTexture(array, length, 1, RedFormat, FloatType, UVMapping, ClampToEdgeWrapping, ClampToEdgeWrapping, LinearFilter, LinearFilter)
                onLoad(texture);
            })
            .catch(onError);
    }
}
