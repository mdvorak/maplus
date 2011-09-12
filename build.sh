# Directory
rm -rf target/
mkdir target

# Contents
mkdir -p target/maplus/chrome

zip -rq -9 target/maplus/chrome/maplus.jar content skin
cp -R components target/maplus/
cp -R defaults target/maplus/
cp jar-chrome.manifest target/maplus/chrome.manifest
cp install.rdf target/maplus/install.rdf

# XPI
cd target/maplus
zip -r -9 ../maplus.xpi *
cd ../..

# Hash
HASH=$(sha1sum < target/maplus.xpi | sed -e 's/\s*\*-//g')
echo "SHA1: $HASH"

# Update
cp update.rdf target/maplus.rdf
sed -i "s/HASH_PLACEHOLDER/sha1:$HASH/g" target/maplus.rdf

# Done
echo "Done"
