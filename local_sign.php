<?php
/**
 * PassLok 2.6 - Local Build & Sign Script
 * Run this on your Mac Mini (macOS Tahoe) whenever you update the app.
 */

// 1. The Definitive File List (derived from your index.html order)
$files = [
    'app-config.json',
    'style.css',
    'app-ui.html',
    'js-head/license.js',
    'js-opensrc/secrets.js',
    'js-opensrc/nacl-fast.js',
    'js-opensrc/ed2curve.js',
    'js-opensrc/scrypt-async.js',
    'js-opensrc/lz-string.js',
    'js-opensrc/purify.js',
    'js-opensrc/jsstegencoder-1.0.js',
    'js-opensrc/jsstegdecoder-1.0.js',
    'js-opensrc/jssteg-1.0.js',
    'js-opensrc/jscolor.js',
    'js-opensrc/qrcode.js',
    'js-head/dictionary_en.js',
    'js-head/converters.js',
    'js-head/keylock.js',
    'js-head/crypto-main.js',
    'js-head/crypto-extra.js',
    'js-head/mail&chat.js',
    'js-head/SSSS.js',
    'js-head/textstego.js',
    'js-head/prng.js',
    'js-head/plstego.js',
    'js-head/imagestego.js',
    'js-head/localdir.js',
    'js-head/colors.js',
    'js-head/Chromestuff.js',
    'js-body/screens.js',
    'js-body/bodyscript.js',
    'js-body/filedrop.js',
    'js-body/initbuttons.js'
];

$manifest = [];

echo "--- PassLok Integrity Builder ---\n";

// 2. Hash each file using SHA-256
foreach ($files as $file) {
    if (file_exists($file)) {
        $manifest[$file] = hash_file('sha256', $file);
        echo "Hashed: $file\n";
    } else {
        die("CRITICAL ERROR: Missing file: $file\nRun the script again once the file is in place.\n");
    }
}

// 3. Create the JSON string
$manifestStr = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
file_put_contents('hashes.json', $manifestStr);

// 4. Sign the Manifest with your private key
$privateKeyPath = 'pb_private_key.pem'; // Ensure this matches your filename
if (!file_exists($privateKeyPath)) {
    die("ERROR: Private key ($privateKeyPath) not found in this folder.\n");
}

$privateKey = openssl_get_privatekey(file_get_contents($privateKeyPath));
if (!$privateKey) {
    die("ERROR: Could not read private key. Check if it's a valid RSA .pem file.\n");
}

// Sign using SHA-256 and PKCS#1 v1.5 padding
openssl_sign($manifestStr, $signature, $privateKey, OPENSSL_ALGO_SHA256);

// 5. Output the signature
file_put_contents('manifest.sig', $signature);

echo "-----------------------------------\n";
echo "SUCCESS: manifest.sig and hashes.json have been generated.\n";
echo "You can now upload these files along with your app modules.\n";
?>