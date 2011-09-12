# Config
VERSION_PLACEHOLDER=1.4.2
MIN_PLACEHOLDER=4.0.x
MAX_PLACEHOLDER=7.x

# Directory
rm -rf target/
mkdir target

if [ $? -ne 0 ]; then
  echo "Unable to delete target"
  exit 1
fi

# Content.jar
cp -R skin target/
cp -R content target/
sed -i "s/VERSION_PLACEHOLDER/$VERSION_PLACEHOLDER/g" target/content/libraries/constants.js

# XPI Contents
mkdir -p target/maplus/chrome

pushd target
zip -rq -9 maplus/chrome/maplus.jar content skin
popd

cp -R components target/maplus/
cp -R defaults target/maplus/
cp jar-chrome.manifest target/maplus/chrome.manifest
cp install.rdf target/maplus/install.rdf

sed -i "s/VERSION_PLACEHOLDER/$VERSION_PLACEHOLDER/g" target/maplus/install.rdf
sed -i "s/MIN_PLACEHOLDER/$MIN_PLACEHOLDER/g" target/maplus/install.rdf
sed -i "s/MAX_PLACEHOLDER/$MAX_PLACEHOLDER/g" target/maplus/install.rdf

# XPI
pushd target/maplus
zip -r -9 ../maplus.xpi *
popd

# Hash
HASH=$(sha1sum < target/maplus.xpi | sed -e 's/\s*\*-//g')
echo "SHA1: $HASH"

# Update
cp update.rdf target/maplus.rdf

sed -i "s/HASH_PLACEHOLDER/sha1:$HASH/g" target/maplus.rdf
sed -i "s/VERSION_PLACEHOLDER/$VERSION_PLACEHOLDER/g" target/maplus.rdf
sed -i "s/MIN_PLACEHOLDER/$MIN_PLACEHOLDER/g" target/maplus.rdf
sed -i "s/MAX_PLACEHOLDER/$MAX_PLACEHOLDER/g" target/maplus.rdf

# Done
echo "Done"
