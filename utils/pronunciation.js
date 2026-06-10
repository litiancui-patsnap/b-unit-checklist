function normalizePronunciationText(text = '') {
  return String(text)
    .replace(/\.{3,}|…/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAudioSrc(audioSrc = '') {
  return String(audioSrc).trim();
}

function getPronunciationAudioSource(audioSrc = '') {
  return normalizeAudioSrc(audioSrc);
}

module.exports = {
  getPronunciationAudioSource,
  normalizeAudioSrc,
  normalizePronunciationText
};
