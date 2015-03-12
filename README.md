PassLok Privacy
===============

PassLok is a toolkit to implement public key cryptography functions on a browser.

These are the principles guiding the design of PassLok:
o	Perfect portability. Runs on any computer or mobile device.
o	Completely self-contained so it runs offline. No servers.
o	Nothing should be installed. No required secrets saved.
o	Highest-level security at every step. No compromises.
o	Easy to understand and use by novices. Graphical interface,
	as clean and simple as possible. No cryptographic jargon.

Because of this, PassLok is pure html code consisting mostly of javascript instructions. Its cryptography code is based on the SJCL code, also on Github. It uses AES for symmetric encryption and elliptic curves (NIST-p521 curve) for public-key functions.

PassLok was started as URSA, also by F. Ruiz, and developed privately up to version 1.3.03, made on 8/15/13. Commits on Github began seriously with this version.

These are the open source libraries used in PassLok, which can be found in the js-opensrc directory:
* Shamir Secret Sharing Scheme. Edited so SJCL RNG is used instead of built-in RNG: https://github.com/amper5and/secrets.js
* For hiding data in images: https://github.com/petereigenschink/steganography.js
* FastClick, used only in mobile devices: https://github.com/ftlabs/fastclick
* SJCL original libraries (many files): https://github.com/bitwiseshiftleft/sjcl
* SCRYPT key stretching: https://github.com/joe-invincible/sjcl-scrypt
* Reed-Solomon error correction: https://github.com/louismullie/erc-js
* lz-string compression algorithm: https://github.com/pieroxy/lz-string
* Markov chain text steganography. Edited RegEx: https://github.com/jthuraisamy/markovTextStego.js

The PassLok original code is in directories js-head and js-body:
* this only loads two word arrays: wordlist and blacklist: dictionary_en.js
* Key and Lock functions: KeyLock.js
* cryptographic functions: crypto.js
* extra functions for mail, etc.: extra.js
* error correction functions: errorCorrection.js
* Shamir Secret Sharing Scheme: SSSS.js
* text and image steganograghy: stego.js
* local Directory functions: localdir.js
* functions for switching screens, etc.: switching.js
* special functions that work only with Chrome apps and extensions: Chromestuff.js
* window reformatting, special functions: bodyscript.js
* initialization, button connections: initbuttons.js

Full documentation can be found at: <http://passlok.weebly.com/>

License

  Copyright (C) 2015 Francisco Ruiz

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU General Public License as published by
  the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
  GNU General Public License for more details.

  You should have received a copy of the GNU General Public License
  along with this program. If not, see <http://www.gnu.org/licenses/>.

Acknowledgements

  PassLok contains and/or links to code from a number of open source
  projects on GitHub, including the Stanford JavaScript
  Cryptography Library (SJCL), and others.

Cryptography Notice

  This distribution includes cryptographic software. The country in
  which you currently reside may have restrictions on the import,
  possession, use, and/or re-export to another country, of encryption
  software. BEFORE using any encryption software, please check your
  country's laws, regulations and policies concerning the import,
  possession, or use, and re-export of encryption software, to see if
  this is permitted. See <http://www.wassenaar.org/> for more
  information.

  The U.S. Government Department of Commerce, Bureau of Industry and
  Security (BIS), has classified this software as Export Commodity
  Control Number (ECCN) 5D002.C.1, which includes information security
  software using or performing cryptographic functions with asymmetric
  algorithms. The form and manner of this distribution makes it
  eligible for export under the License Exception ENC Technology
  Software Unrestricted (TSU) exception (see the BIS Export
  Administration Regulations, Section 740.13) for both object code and
  source code.