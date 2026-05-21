#!/usr/bin/env node
// Limpa test-results/ entre a rodada "fast" e a "human" para que o concat
// final não pegue vídeos antigos.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'test-results');
if (fs.existsSync(dir)) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('test-results/ limpo.');
}
