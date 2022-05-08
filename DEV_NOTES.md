## Generating LUTs

To do:

- [ ] Compare LUT results
- [ ] Compare to Blender LUTs (False Color differs, desat is the same)
- [ ] three.js and pmndrs support only 3D LUTs

Examples:

```shell
ociobakelut --lut ~/Desktop/filmic-blender-master/luts/desat65cube.spi3d --format resolve_cube assets/desat65cube.cube --cubesize 65
ociobakelut --lut ~/Desktop/filmic-blender-master/luts/Filmic_False_Colour.spi3d --format resolve_cube assets/Filmic_False_Colour.cube --cubesize 65
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-70_1-03.spi1d --format resolve_cube assets/Filmic_to_0-70_1-03.cube --shapersize 4096
```
