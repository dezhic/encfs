npx browserify ./browser/main.js -o ./public/javascripts/main.bundle.js;
npx browserify ./browser/workers/aes-enc.js -o ./public/javascripts/workers/aes-enc.bundle.js;
npx browserify ./browser/workers/aes-dec.js -o ./public/javascripts/workers/aes-dec.bundle.js;
npx browserify ./browser/workers/rsa-dec.js -o ./public/javascripts/workers/rsa-dec.bundle.js;
