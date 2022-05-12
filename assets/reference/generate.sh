OCIO=/Users/donmccurdy/Desktop/filmic-blender-master/config.ocio
INPUT_FILE=assets/reference/cornell_box.exr
OUTPUT_DIR=assets/reference/out/

if [ -n "$OCIO" ]; then
  echo "Using OpenColorIO config, '$OCIO'."
else
  echo "Missing OCIO env variable."
fi

rm "$OUTPUT_DIR"*.png

echo "Generating..."

oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "Very High Contrast" -o "$OUTPUT_DIR/very_high.png"
oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "High Contrast" -o "$OUTPUT_DIR/high.png"
oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "Medium High Contrast" -o "$OUTPUT_DIR/medium_high.png"
oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "Base Contrast" -o "$OUTPUT_DIR/medium.png"
oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "Medium Low Contrast" -o "$OUTPUT_DIR/medium_low.png"
oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "Low Contrast" -o "$OUTPUT_DIR/low.png"
oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --colorconvert linear "Filmic Log Encoding" --ociolook "Very Low Contrast" -o "$OUTPUT_DIR/very_low.png"

oiiotool --colorconfig "$OCIO" -i "$INPUT_FILE" --ociolook "False Colour" -o "$OUTPUT_DIR/false_color.png"

echo "🍻 Done!"
