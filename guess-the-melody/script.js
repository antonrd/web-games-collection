// Define melodies
const melodies = [
  // DJ Take me away
  [5, 8, 10, 8, 10, 13, 12, 8, 13, 13, 12, 8, 13, 12, 10, -1,
   5, 8, 10, 8, 10, 13, 12, 8, 12, 13, 15, 13, 15, 13, 10],
  // Twinke Twinkle Little Star
  // C, C, G, G, A, A, G, F, F, E, E, D, D, C
  // [0, 0, 7, 7, 9, 9, 7, 5, 5, 4, 4, 2, 2, 0],
  // Mary Had a Little Lamb
  // E, D, C, D, E, E, E, D, D, D, E, G, G, E, D, C, D, E, E, E, E, D, D, E, D, C
  // [4, 2, 0, 2, 4, 4, 4, 2, 2, 2, 4, 7, 7, 4, 2, 0, 2, 4, 4, 4, 4, 2, 2, 4, 2, 0],
  // Jingle Bells
  // E, E, E, E, E, E, E, G, C, D, E, F, F, F, F, F, E, E, E, E, D, D, E, D, G
  // [4, 4, 4, 4, 4, 4, 4, 7, 0, 2, 4, 5, 5, 5, 5, 5, 4, 4, 4, 4, 2, 2, 4, 2, 7],
  // Happy Birthday
  // C, C, D, C, F, E, C, C, D, C, G, F, C, C, C, A, F, E, D, A#, A#, A#, F, G, F
  // [0, 0, 2, 0, 5, 4, 0, 0, 2, 0, 7, 5, 0, 0, 0, 9, 5, 4, 2, 10, 10, 10, 5, 7, 5],
];

const melodiesIntervals = [
  [1, 1, 1, 0.5, 1, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 1, 0.5, 3,
   1, 1, 1, 0.5, 1, 0.5, 1, 1, 0.5, 0.5, 1, 1, 0.5, 1, 0.5],
]

// Define the reference frequency for C4
const referenceFrequency = 261.63; // Frequency of C4 in Hz

// Define the number of semitones between C4 and Eb5 (inclusive)
const numSemitones = 15;

// Calculate the frequencies for each note
const noteFrequencies = [];
// const noteLabels = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C^"];
// The sampled tone MP3 files are taken from https://github.com/fuhton/piano-mp3.
const noteLabels = ["C4", "Db4", "D4", "Eb4", "E4", "F4", "Gb4", "G4", "Ab4", "A4", "Bb4", "B4", "C5", "Db5", "D5", "Eb5"];

for (let i = 0; i <= numSemitones; i++) {
  const frequency = referenceFrequency * Math.pow(2, i / 12);
  noteFrequencies.push(frequency);
}

// Create the audio context
let audioContext;
function createAudioContext() {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
}

function noteToAudioFilePath(note) {
  return `notes/${noteLabels[note]}.mp3`;
}

function playPianoNote(note) {
  const sampledNotesToggle = document.getElementById('sampledNotesToggle');
  const generatedNotesToggle = document.getElementById('generatedNotesToggle');

  if (sampledNotesToggle.checked) {
    playSampledPianoNote(note);
  } else if (generatedNotesToggle.checked) {
    playGeneratedPianoNote(note);
  }
}

function playSampledPianoNote(note) {
  const mp3File = noteToAudioFilePath(note);

  if (mp3File) {
    fetch(mp3File)
      .then((response) => response.arrayBuffer())
      .then((buffer) => audioContext.decodeAudioData(buffer))
      .then((audioBuffer) => {
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
      })
      .catch((error) => {
        console.error('Error loading or playing the note:', error);
      });
  } else {
    console.error('Invalid piano note:', note);
  }
}

// Play a single piano note
function playGeneratedPianoNote(note) {
  if (!audioContext) {
    console.error('AudioContext not created. Make sure it is created after a user gesture.');
    return;
  }

  // Create the oscillator for the note
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.start();

  // Calculate the frequency for the note
  const frequency = noteFrequencies[note];

  // Set the frequency of the oscillator
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);

  // Apply envelope shaping
  const attackTime = 0.01; // Attack time in seconds
  const decayTime = 0.4; // Decay time in seconds
  const releaseTime = 0.3; // Release time in seconds
  const sustainLevel = 0.4; // Sustain level (between 0 and 1)

  const now = audioContext.currentTime;
  const endTime = now + attackTime + decayTime + releaseTime;

  // Set initial gain to 0
  gainNode.gain.setValueAtTime(0, now);

  // Ramp up to the sustain level
  gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime);

  // Maintain the sustain level
  gainNode.gain.setValueAtTime(sustainLevel, now + attackTime + decayTime);

  // Ramp down to 0 during release
  gainNode.gain.linearRampToValueAtTime(0, endTime);

  // Stop the oscillator at the end of the release phase
  oscillator.stop(endTime);
}

function generateRandomMelody(numTones) {
  const scaleType = document.getElementById('scale-select').value;

  let rootNote;
  let scale;
  let isMajor;

  if (scaleType === 'random') {
    // Generate a random number between 0 and 10, inclusive to determine the root note,
    // which can be between C and B inclusive.
    rootNote = getRandomInteger(numSemitones - 1);
    isMajor = Math.random() < 0.5; // Randomly determine if major or minor scale should be used
    scale = isMajor ? getMajorScale(rootNote) : getMinorScale(rootNote);
  } else {
    const [rootNoteIndex, scaleTypeStr] = scaleType.split('-');
    rootNote = parseInt(rootNoteIndex);
    isMajor = (scaleTypeStr === 'major');
    scale = (isMajor) ? getMajorScale(rootNote) : getMinorScale(rootNote);
  }

  console.log("Scale: " + noteLabels[rootNote] + " " + (isMajor ? "major" : "minor"));

  const melody = [];
  for (let i = 0; i < numTones; i++) {
    const randomIndex = getRandomInteger(scale.length);
    const tone = scale[randomIndex];
    melody.push(tone);
  }

  return melody;
}

function getRandomInteger(max) {
  return Math.floor(Math.random() * max);
}

function getMajorScale(rootNote) {
  const intervals = [0, 2, 4, 5, 7, 9, 11];
  return getScale(rootNote, intervals);
}

function getMinorScale(rootNote) {
  const intervals = [0, 2, 3, 5, 7, 8, 10];
  return getScale(rootNote, intervals);
}

function getScale(rootNote, intervals) {
  const scale = [];
  for (let i = 0; i < intervals.length; i++) {
    const note = (rootNote + intervals[i]) % 12;
    scale.push(note);
  }
  return scale;
}

let melody = [];
let melodyIntervals = [];
let melodyInProgress = false;
let currentIndex = 0;
// let melodyInterval;
const notesContainer = document.querySelector('.notes-container');
const generateBtn = document.getElementById('generateBtn');
const playBtn = document.getElementById('playBtn');
const revealBtn = document.getElementById('revealBtn');
// const melodyDisplay = document.getElementById('melodyDisplay');

function generateMelody() {
  const randomToggle = document.getElementById('randomToggle');
  const predefinedToggle = document.getElementById('predefinedToggle');

  if (randomToggle.checked) {
    var randomNotesInput = document.getElementById('randomNotes');
    melody = generateRandomMelody(randomNotesInput.value);
    melodyIntervals = [];
  } else if (predefinedToggle.checked) {
    const randomIndex = Math.floor(Math.random() * melodies.length);
    melody = melodies[randomIndex];
    if (randomIndex < melodiesIntervals.length) {
      melodyIntervals = melodiesIntervals[randomIndex];
    } else {
      melodyIntervals = []
    }
  }

  currentIndex = 0;
  console.log("Melody: ", melody);

  // Clear previous notes
  notesContainer.innerHTML = '';

  // Add new notes to the container
  melody.forEach((noteIndex, index) => {
    const noteElement = document.createElement('div');
    noteElement.classList.add('note');
    noteElement.id = `note${index + 1}`;
    noteElement.innerHTML = "<span>&#9835;</span>";
    notesContainer.appendChild(noteElement);
  });

  // generateBtn.disabled = true;
  playBtn.disabled = false;
  revealBtn.disabled = false;
}

function playMelody() {
  playBtn.disabled = true;
  revealBtn.disabled = true;
  currentIndex = 0;

  // Highlight the first note
  // highlightNote();

  melodyPlayer = function() {
    // currentIndex++;
    if (!melodyInProgress) return;
    if (currentIndex < melody.length) {
      highlightNote();
      noteLength = 500
      if (melodyIntervals.length > 0) {
        noteLength = melodyIntervals[currentIndex] * 500;
      }
      setTimeout(melodyPlayer, noteLength);
    } else {
      // clearInterval(melodyInterval);
      resetNoteHighlights();
      playBtn.disabled = false;
      revealBtn.disabled = false;
    }
    currentIndex++;
  }
  melodyInProgress = true;
  setTimeout(melodyPlayer, 500);

  return;
  // Play the melody
  // melodyInterval = setInterval(() => {
  //   currentIndex++;
  //   if (currentIndex < melody.length) {
  //     highlightNote();
  //   } else {
  //     clearInterval(melodyInterval);
  //     resetNoteHighlights();
  //     playBtn.disabled = false;
  //     revealBtn.disabled = false;
  //   }
  // }, 200); // Adjust the interval as needed
}

function stopMelody() {
  if (melodyInProgress) {
    melodyInProgress = false;
    currentIndex = 0;
    resetNoteHighlights();
    playBtn.disabled = false;
    revealBtn.disabled = false;
  }

  // Clear the timeout if it exists
  // if (melodyInterval) {
  //   clearTimeout(melodyInterval);
  //   melodyInterval = null;
  //   currentIndex = 0;
  //   resetNoteHighlights();
  //   playBtn.disabled = false;
  //   revealBtn.disabled = false;
  //   }
}

function highlightNote() {
  resetNoteHighlights();

  const currentNoteIndex = melody[currentIndex];
  const noteElement = document.getElementById(`note${currentIndex + 1}`);
  noteElement.classList.add('highlight');

  if (currentNoteIndex > -1) playPianoNote(currentNoteIndex);
}

function resetNoteHighlights() {
  const noteElements = document.querySelectorAll('.note');
  noteElements.forEach(noteElement => {
    noteElement.classList.remove('highlight');
  });
}

function revealMelody() {
  melody.forEach((note, index) => {
    console.log("Note index: ", note);
    const noteCode = getNoteCode(note);
    const noteElement = document.getElementById(`note${index + 1}`);
    noteElement.textContent = noteCode;
  });
}

function getNoteCode(noteIndex) {
  // ... (logic for getting note codes/names based on the note index)
  if (noteIndex == -1) return "-";
  return noteLabels[noteIndex];
}

function setupPage() {
  populateScaleOptions();
  generateMelody();
}

// Function to populate the select element with scale options
function populateScaleOptions() {
  const selectElement = document.getElementById('scale-select');

  // Clear any existing options
  selectElement.innerHTML = '';

  // Add the "Random" option
  const randomOption = document.createElement('option');
  randomOption.value = 'random';
  randomOption.textContent = 'Random';
  selectElement.appendChild(randomOption);

  // Generate scale options for all root notes and scale types
  const scaleTypes = ['major', 'minor'];

  for (let i = 0; i < noteLabels.length - 1; i++) {
    const rootNote = noteLabels[i];

    for (let j = 0; j < scaleTypes.length; j++) {
      const scaleType = scaleTypes[j];

      const option = document.createElement('option');
      option.value = `${i}-${scaleType}`;
      option.textContent = `${rootNote} ${scaleType.charAt(0).toUpperCase() + scaleType.slice(1)}`;
      selectElement.appendChild(option);
    }
  }
}

const melodyToggle = document.querySelectorAll('input[name="melodyToggle"]');
const scaleSelect = document.getElementById('scale-select');
const randomNotesInput = document.getElementById('randomNotes');

melodyToggle.forEach(function(toggle) {
  toggle.addEventListener('click', function() {
    if (this.value === 'predefined') {
      scaleSelect.disabled = true;
      randomNotesInput.disabled = true;
    } else {
      scaleSelect.disabled = false;
      randomNotesInput.disabled = false;
    }
  });
});

// Call the function to populate the select options when the page loads
window.addEventListener('load', setupPage);
document.addEventListener('click', createAudioContext);

// Handle the pop-up toggle functionality
document.addEventListener('DOMContentLoaded', function() {
  var infoIcon = document.getElementById('info-icon');
  var infoPopup = document.getElementById('info-popup');
  var popupVisible = false;

  infoIcon.addEventListener('click', function() {
    if (!popupVisible) {
      infoPopup.style.display = 'block';
      popupVisible = true;
    } else {
      infoPopup.style.display = 'none';
      popupVisible = false;
    }
  });

  infoPopup.addEventListener('click', function() {
    infoPopup.style.display = 'none';
    popupVisible = false;
  });
});
