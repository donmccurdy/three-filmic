## Generating LUTs

Examples:

```shell
ociobakelut --lut ~/Desktop/filmic-blender-master/luts/desat65cube.spi3d --format resolve_cube assets/desat65cube.cube --cubesize 65
ociobakelut --lut ~/Desktop/filmic-blender-master/luts/Filmic_False_Colour.spi3d --format resolve_cube assets/Filmic_False_Colour.cube --cubesize 65
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-70_1-03.spi1d --format resolve_cube assets/Filmic_to_0-70_1-03.cube --shapersize 4096
```

As of September 2022, the optimal ZSTD level seems to be around 18, reducing filesize about as far as its going to go with higher levels.

```shell
ktxsc --zcmp 16 assets/luts/desat65cube.ktx2
```