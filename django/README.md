Thumbnail a static asset
------------------------

An easy way to thumbnail a static image. 
Saves resizing it manually with an external editor, also eases handling of breakpoints.
Might already exist, but not that I'm aware of. Would be nice to have an easy_thumbnails esque API.
Need to handle caching + file invalidation.


Spritesheet generation
----------------------

Given a bunch of image assets, generate a sprite sheet.
Should probably use a cached manifest, lazily-loaded. Should expose a simple dict with name + sprite dimensions + sprite left/top offset pixels.
Need to handle caching + file invalidation.


SCSS compilation with source maps
---------------------------------

Django-compressor's a pain for anything with additional derivative assets, such as source maps. Also moves assets around, so relative urls are broken.
