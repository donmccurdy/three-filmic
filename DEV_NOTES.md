## Generating LUTs

To do:

- [ ] Compare LUT results
- [ ] Compare to Blender LUTs (False Color differs, desat is the same)
- [ ] three.js and pmndrs support only 3D LUTs

Examples:

```shell
ociobakelut --lut ~/Desktop/filmic-blender-master/luts/desat65cube.spi3d --format resolve_cube assets/desat65cube.cube --cubesize 65
ociobakelut --lut ~/Desktop/filmic-blender-master/luts/Filmic_False_Colour.spi3d --format resolve_cube assets/Filmic_False_Colour.cube --cubesize 65

ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-35_1-30.spi1d --format resolve_cube assets/Filmic_to_0-35_1-30.cube --shapersize 4096
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-48_1-09.spi1d --format resolve_cube assets/Filmic_to_0-48_1-09.cube --shapersize 4096
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-60_1-04.spi1d --format resolve_cube assets/Filmic_to_0-60_1-04.cube --shapersize 4096
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-70_1-03.spi1d --format resolve_cube assets/Filmic_to_0-70_1-03.cube --shapersize 4096
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0-85_1-011.spi1d --format resolve_cube assets/Filmic_to_0-85_1-011.cube --shapersize 4096
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_0.99_1-0075.spi1d --format resolve_cube assets/Filmic_to_0.99_1-0075.cube --shapersize 4096
ociobakelut --lut ~/Desktop/filmic-blender-master/looks/Filmic_to_1.20_1-00.spi1d --format resolve_cube assets/Filmic_to_1.20_1-00.cube --shapersize 4096
```

```
################################
### Filmic sRGB Medium Contrast

# Exposure
!<AllocationTransform> {allocation: uniform, vars: [0, 1, 0, $EXPOSURE]}

{#if VIEW != View.NONE}

  # Reference to Filmic Log
  !<AllocationTransform> {allocation: lg2, vars: [-12.473931188, 12.526068812]}
  !<FileTransform> {src: filmic_desat65cube.spi3d, interpolation: best}
  !<AllocationTransform> {allocation: uniform, vars: [0, 0.66]}

  # Look Transform
  !<FileTransform> {src: filmic_to_0-70_1-03.spi1d, interpolation: linear}
  {#if LOOK != Look.MEDIUM_CONTRAST}
    !<FileTransform> {src: filmic_to_0-???????.spi1d, interpolation: linear}
    !<FileTransform> {src: filmic_to_0-70_1-03.spi1d, interpolation: linear, direction: inverse}
  {#endif

  # View Transform
  {#if VIEW == View.FALSE_COLOR}
    !<MatrixTransform> {matrix: [0.2126729, 0.7151521, 0.0721750, 0, 0.2126729, 0.7151521, 0.0721750, 0, 0.2126729, 0.7151521, 0.0721750, 0, 0, 0, 0, 1]}
    !<FileTransform> {src: filmic_false_color.spi3d, interpolation: best}
  {#elif VIEW == View.FILMIC}
    !<AllocationTransform> {allocation: lg2, vars: [-12.473931188, 4.026068812], direction: inverse}
  {#endif}

{#endif}

################################
### Filmic Log Medium Contrast

# Exposure
!<AllocationTransform> {allocation: uniform, vars: [0, 1, 0, $EXPOSURE]}

# Reference to Filmic Log
!<AllocationTransform> {allocation: lg2, vars: [-12.473931188, 12.526068812]}
!<FileTransform> {src: filmic_desat65cube.spi3d, interpolation: best}
!<AllocationTransform> {allocation: uniform, vars: [0, 0.66]}

# Filmic Log to Reference
!<AllocationTransform> {allocation: lg2, vars: [-12.473931188, 4.026068812], direction: inverse}

```
