#!/bin/bash

# Create fonts directory
mkdir -p public/fonts

# Download Raleway fonts (weights: 400, 600, 800)
echo "Downloading Raleway fonts..."

# Raleway 400
curl -L "https://fonts.gstatic.com/s/raleway/v34/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVvaorCIPrE.woff2" -o public/fonts/raleway-v34-latin-regular.woff2

# Raleway 600
curl -L "https://fonts.gstatic.com/s/raleway/v34/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVsEpbCIPrE.woff2" -o public/fonts/raleway-v34-latin-600.woff2

# Raleway 800
curl -L "https://fonts.gstatic.com/s/raleway/v34/1Ptxg8zYS_SKggPN4iEgvnHyvveLxVtapbCIPrE.woff2" -o public/fonts/raleway-v34-latin-800.woff2

# Download Source Serif 4 fonts (weights: 400, 700, with italic variants)
echo "Downloading Source Serif 4 fonts..."

# Source Serif 4 Regular 400
curl -L "https://fonts.gstatic.com/s/sourceserif4/v8/vEFy2_tTDB4M7-auWDN0ahZJW1ge6JXg.woff2" -o public/fonts/source-serif-4-v8-latin-regular.woff2

# Source Serif 4 Italic 400
curl -L "https://fonts.gstatic.com/s/sourceserif4/v8/vEF02_tTDB4M7-auWDN0ahZJW1gW8oWHaDY.woff2" -o public/fonts/source-serif-4-v8-latin-italic.woff2

# Source Serif 4 Bold 700
curl -L "https://fonts.gstatic.com/s/sourceserif4/v8/vEF22_tTDB4M7-auWDN0ahZJW1grSRhgB7mx.woff2" -o public/fonts/source-serif-4-v8-latin-700.woff2

# Source Serif 4 Bold Italic 700
curl -L "https://fonts.gstatic.com/s/sourceserif4/v8/vEFK2_tTDB4M7-auWDN0ahZJW1gW4kx6F7oLjOQ.woff2" -o public/fonts/source-serif-4-v8-latin-700italic.woff2

echo "Fonts downloaded successfully!"