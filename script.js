// Elements
const nameInputDiv = document.querySelector('.name-input');
const enterBtn = document.getElementById('enter-btn');
const startBtn = document.getElementById('start-btn');
const viewResultsBtn = document.getElementById('view-results-btn');
const categorySelectionDiv = document.querySelector('.category-selection');
const categorySelector = document.getElementById('category-selector');
const gameDiv = document.querySelector('.game');
const questionDiv = document.querySelector('.question');
const choicesDiv = document.querySelector('.choices');
const resultDiv = document.querySelector('.result');
const roundProgressBtn = document.getElementById('round-progress-btn');
const nextBtn = document.getElementById('next-btn');
const nameField = document.getElementById('name');
const timerSpan = document.getElementById('timer');
const barFill = document.getElementById("bar-fill");
const pauseBtn = document.getElementById('pause-btn');
const stopBtn = document.getElementById('stop-btn');
const stopModal = document.getElementById('stop-modal');
const stopBackBtn = document.getElementById('stop-back-btn');
const stopEndBtn = document.getElementById('stop-end-btn');
const playAgainBtn = document.getElementById('play-again-btn');
const backBtn = document.getElementById('back-btn');

let currentPhraseIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 30;
let gameStartTime;
let roundStartTime = 0;
let pausedMs = 0;
let pauseStartedAt = 0;
let phrases = [];
let phrasesLoaded = false;
let isPaused = false;
let playerName = '';
let selectedCategoryKey = 'simple_phrases';
let categories = {};
let selectedCategoryLabel = 'Simple phrases';
let roundPhraseCount = 0;
let currentRunEntry = null;
let nextTimerOverrideSeconds = null;

// Fallback phrase list so the game works from file:// (where fetch('data.json') is often blocked).
// Keep this in sync with data.json when you add new phrases.
const FALLBACK_PHRASES = [
  { dutch: 'Goedemorgen', english: 'Good morning' },
  { dutch: 'Hoe gaat het met u?', english: 'How are you?' },
  { dutch: 'Fijn om te horen', english: 'Happy to hear' },
  { dutch: 'Het gaat wel', english: "I'm okay, so-so" },
  { dutch: 'Met mij gaat het niet goed', english: "I'm not feeling good" },
  { dutch: 'Met mij gaat het slecht', english: "I'm feeling really bad" },
  { dutch: 'Vervelend om te horen', english: 'Sorry to hear / I feel for you' },
  { dutch: 'Dankjewel/Dankuwel', english: 'Thank you (informal/formal)' },
  { dutch: 'Waar is het station?', english: 'Where is the station?' },
  { dutch: 'Alsjeblieft / Alstublieft', english: 'Please (informal/formal)' },
  { dutch: 'Mag ik een vraag stellen?', english: 'May I ask you a question?' },
  { dutch: ['Wie ben jij?', 'Hoe heet jij?', 'Wat is jouw naam?'], english: "What's your name?" },
  { dutch: 'Begrijp je het?', english: 'Do you understand?' },
  { dutch: 'Nee, ik begrijp het niet', english: "I don’t understand." },
  { dutch: 'Kan je dat herhalen?', english: 'Can you repeat that?' },
  { dutch: 'Kan je langzaam praten?', english: 'Can you talk slowly?' },
  { dutch: 'Wat zeg je?', english: 'What do you say?' },
  { dutch: 'Ik heb een vraag', english: 'I have a question' },
  { dutch: 'Ik heb geen vraag', english: "I don't have a question" },
  { dutch: 'Mag ik je wat vragen?', english: 'Can I ask you something?' },
  { dutch: 'Ik spreek een beetje Nederlands', english: 'I speak a little Dutch' },
  { dutch: 'En jij?', english: 'And you?' },
  { dutch: 'Ik heb een goede dag', english: "I'm having a good day" },
  { dutch: 'Hoe laat is het?', english: 'What time is it?' },
  { dutch: 'Welke dag is het vandaag?', english: 'What day is it today?' },
  { dutch: 'Met mij gaat het (heel) goed, dankjewel', english: "I'm feeling good, thank you" },
];

const FALLBACK_CATEGORIES = {
  simple_phrases: FALLBACK_PHRASES,
  interview_phrases: [
    { dutch: 'Kunt u mij iets vertellen over uzelf?', english: 'Can you tell me something about yourself?' },
    { dutch: 'Wat zijn uw sterke punten?', english: 'What are your strengths?' },
    { dutch: 'Wat zijn uw zwakke punten?', english: 'What are your weaknesses?' },
    { dutch: 'Waarom wilt u deze functie?', english: 'Why do you want this position?' },
    { dutch: 'Waar ziet u uzelf over vijf jaar?', english: 'Where do you see yourself in five years?' },
    { dutch: 'Kunt u een voorbeeld geven?', english: 'Can you give an example?' },
  ],
  professional_phrases: [
    { dutch: 'Volgens mijn ervaring...', english: 'In my experience...' },
    { dutch: 'Ik ben van mening dat...', english: 'I believe that...' },
    { dutch: 'Het lijkt mij belangrijk om...', english: 'It seems important to me to...' },
    { dutch: 'Ik zou graag willen voorstellen...', english: 'I would like to propose...' },
    { dutch: 'Zullen we dit afstemmen?', english: 'Shall we align on this?' },
    { dutch: 'Ik zal hierop terugkomen.', english: 'I will get back to you on this.' },
  ],
};

function normalizeDutch(dutch) {
  if (Array.isArray(dutch)) {
    return dutch[Math.floor(Math.random() * dutch.length)] ?? '';
  }
  return dutch ?? '';
}

function setPhrases(nextPhrases) {
  phrases = shuffle([...(nextPhrases || [])]);
  phrasesLoaded = phrases.length > 0;
}

function setPhrasesExact(nextPhrases) {
  phrases = [...(nextPhrases || [])];
  phrasesLoaded = phrases.length > 0;
}

function getCategoryCounts() {
  const keys = Object.keys(categories || {});
  const pairs = keys.map(k => [k, Array.isArray(categories[k]) ? categories[k].length : 0]);
  pairs.sort((a, b) => a[0].localeCompare(b[0]));
  return pairs;
}

function showRoundInfoAlert() {
  const counts = getCategoryCounts();
  const countsText = counts.map(([k, n]) => `${categoryLabel(k)}: ${n}`).join('\n');
  alert(`Each round has about 7–8 phrases (or fewer if a category has less).\n\nPhrases available right now:\n${countsText}`);
}

function progressKey(name, categoryKey) {
  return `progress:${String(name || '').toLowerCase()}:${String(categoryKey || '')}`;
}

function saveProgress() {
  if (!playerName || !selectedCategoryKey) return;
  if (!Array.isArray(phrases) || !phrases.length) return;
  try {
    const payload = {
      version: 1,
      name: playerName,
      categoryKey: selectedCategoryKey,
      phrases,
      currentPhraseIndex,
      score,
      timeLeft,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(progressKey(playerName, selectedCategoryKey), JSON.stringify(payload));
    // (Resume button removed; progress still saved)
  } catch {
    // ignore
  }
}

function loadProgress(name, categoryKey) {
  try {
    const raw = localStorage.getItem(progressKey(name, categoryKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.phrases)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearProgressForCurrent() {
  if (!playerName || !selectedCategoryKey) return;
  try {
    localStorage.removeItem(progressKey(playerName, selectedCategoryKey));
    // (Resume button removed; nothing to update)
  } catch {
    // ignore
  }
}

function updateResumeButton() {
  // Resume button removed; keep this function for existing callers.
  if (viewResultsBtn) viewResultsBtn.style.display = playerName ? 'inline-flex' : 'none';
}

function updateRoundProgressButton() {
  if (!roundProgressBtn) return;
  if (!Array.isArray(phrases) || !phrases.length || gameDiv.style.display === 'none') {
    roundProgressBtn.style.display = 'none';
    return;
  }
  const current = Math.min(currentPhraseIndex + 1, phrases.length);
  roundProgressBtn.innerHTML = `<i class="fas fa-circle-play"></i> Resume (${current}/${phrases.length})`;
  roundProgressBtn.style.display = 'inline-flex';
}

function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r < 10 ? '0' + r : r}`;
}

function getRoundElapsedSeconds() {
  if (!roundStartTime) return 0;
  const extraPaused = isPaused && pauseStartedAt ? (Date.now() - pauseStartedAt) : 0;
  const elapsedMs = Date.now() - roundStartTime - pausedMs - extraPaused;
  return Math.max(0, Math.floor(elapsedMs / 1000));
}

function openStopModal() {
  if (!stopModal) return;
  stopModal.style.display = 'flex';
  stopModal.setAttribute('aria-hidden', 'false');
}

function closeStopModal() {
  if (!stopModal) return;
  stopModal.style.display = 'none';
  stopModal.setAttribute('aria-hidden', 'true');
}

function categoryLabel(categoryKey) {
  const labels = {
    simple_phrases: 'Simple phrases',
    professional_phrases: 'Professional phrases',
    interview_phrases: 'Interview phrases',
  };
  return labels[categoryKey] ?? categoryKey.replace(/_/g, ' ');
}

function populateCategorySelector() {
  const keys = Object.keys(categories);
  categorySelector.innerHTML = '';
  keys.forEach(key => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = categoryLabel(key);
    categorySelector.appendChild(option);
  });
  if (keys.includes(selectedCategoryKey)) {
    categorySelector.value = selectedCategoryKey;
  } else if (keys.length) {
    selectedCategoryKey = keys[0];
    categorySelector.value = selectedCategoryKey;
  }
  updateResumeButton();
}

function loadCategories() {
  fetch('data.json')
    .then(response => response.json())
    .then(data => {
      categories = data?.categories || (data?.phrases ? { simple_phrases: data.phrases } : {});
      if (!Object.keys(categories).length) categories = FALLBACK_CATEGORIES;
      populateCategorySelector();
      phrasesLoaded = true;
    })
    .catch(error => {
      console.warn('Error loading the data file; using fallback categories.', error);
      categories = FALLBACK_CATEGORIES;
      populateCategorySelector();
      phrasesLoaded = true;
    });
}

loadCategories();

// Start Timer
function startTimer(seconds = 30) {
  const timerDuration = 30;
  timeLeft = Math.max(0, Math.floor(seconds));
  timerSpan.textContent = timeLeft;
  barFill.style.width = '100%';

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (isPaused) return;
    timeLeft--;
    timerSpan.textContent = timeLeft;
    updateProgressBarColor((timeLeft / timerDuration) * 100);
    barFill.style.width = `${(timeLeft / timerDuration) * 100}%`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      handleTimeout();
    }
  }, 1000);
}

// Handle Timeout (when timer reaches zero)
function handleTimeout() {
  resultDiv.textContent = "Time's up!";
  resultDiv.style.color = 'red';
  nextBtn.style.display = 'inline';

  // Show the fail image for timeout
  const image = createResultImage('img/fail.png');
  resultDiv.appendChild(image); // Append the fail image

  nextBtn.disabled = false; // Enable the next button
}

// Update Progress Bar Color
function updateProgressBarColor(progress) {
  const color = progress > 50 ? '#003366' : progress > 25 ? '#0066cc' : '#3399ff';
  barFill.style.background = `linear-gradient(to right, ${color}, #66ccff)`;
}

// Display Phrase and Choices
function showPhrase() {
  resultDiv.textContent = '';
  nextBtn.style.display = 'none';
  questionDiv.classList.remove('game-over-title');
  resultDiv.classList.remove('end-screen');
  updateRoundProgressButton();

  const phrase = phrases[currentPhraseIndex];
  if (!phrase) {
    endGame();
    return;
  }
  const dutchText = normalizeDutch(phrase.dutch);
  questionDiv.innerHTML = `
    <span class="instruction">Pick the correct English translation</span>
    <span class="prompt">"${escapeHtml(dutchText)}"</span>
  `;

  const choices = generateChoices(phrase);
  renderChoices(choices);

  const seconds = nextTimerOverrideSeconds ?? 30;
  nextTimerOverrideSeconds = null;
  startTimer(seconds);
}

// Generate Choices for multiple choice answers
function generateChoices(phrase) {
  const choices = [phrase.english];
  while (choices.length < 4) {
    const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)].english;
    if (!choices.includes(randomPhrase)) choices.push(randomPhrase);
  }
  return choices.sort(() => Math.random() - 0.5);
}

// Render Choices as buttons
function renderChoices(choices) {
  choicesDiv.innerHTML = ''; // Clear previous choices
  choices.forEach(choice => {
    const button = document.createElement('button');
    button.textContent = choice;
    button.addEventListener('click', () => checkAnswer(choice));
    choicesDiv.appendChild(button);
  });
}

function setChoicesDisabled(disabled) {
  const buttons = choicesDiv.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.disabled = disabled;
  });
}

// Check Answer after selecting a choice
function checkAnswer(selected) {
  if (isPaused) return;
  const correctAnswer = phrases[currentPhraseIndex].english;
  const isCorrect = selected === correctAnswer;
  displayResult(isCorrect, correctAnswer);

  clearInterval(timerInterval);
  nextBtn.style.display = 'inline';
  saveProgress();
  updateRoundProgressButton();
}
// Display Result with image (pass or fail)
function displayResult(isCorrect, correctAnswer) {
  // Clear any previous result content
  resultDiv.innerHTML = '';

  // Create the image element for pass or fail
  const image = createResultImage(isCorrect ? 'img/pass.png' : 'img/fail.png');

  // Show result text and image together (avoid wiping DOM with textContent)
  const message = isCorrect ? 'Correct!' : `Not quite. Correct answer: "${correctAnswer}".`;
  const textEl = document.createElement('div');
  textEl.textContent = message;
  resultDiv.appendChild(textEl);
  resultDiv.appendChild(image);
  resultDiv.style.color = isCorrect ? '#98FB98' : 'red';

  // Update score if the answer is correct
  if (isCorrect) {
    score++;
  }
}

// Create Result Image
function createResultImage(src) {
  const image = document.createElement('img');
  image.className = 'result-image';
  image.src = src;  // Set image source dynamically
  image.alt = 'Result Image';
  return image;
}



// Handle Next Button
nextBtn.addEventListener('click', () => {
  currentPhraseIndex++;
  if (currentPhraseIndex < phrases.length) {
    saveProgress();
    showPhrase();
    updateRoundProgressButton();
  } else {
    endGame();
  }
});

// End Game
function endGame({ earlyExit = false } = {}) {
  clearInterval(timerInterval);
  hideGameUI();

  questionDiv.textContent = '🏁 Session Complete! Well done!';
  questionDiv.classList.add('game-over-title');
  resultDiv.classList.add('end-screen');
  const roundSeconds = getRoundElapsedSeconds();
  resultDiv.textContent = earlyExit ? 'Game ended.' : '';
  resultDiv.style.color = '#ffffff';

  // Hide the last question UI so only the end screen is visible
  choicesDiv.innerHTML = '';
  choicesDiv.style.display = 'none';
  if (roundProgressBtn) roundProgressBtn.style.display = 'none';

  const totalQuestions = phrases.length;
  currentRunEntry = saveScoreEntry({
    name: playerName || 'Player',
    score,
    category: selectedCategoryLabel,
    totalQuestions,
    durationSeconds: roundSeconds,
  });
  clearProgressForCurrent();
  // End screen: show only last attempt + top 3 best
  renderEndResults({ lastAttemptEntry: currentRunEntry });

  nextBtn.style.display = 'none';
  setChoicesDisabled(true);

  // Show "Dino" image for Game Over
  const image = createResultImage('img/dino.png');
  resultDiv.appendChild(image); // Append to resultDiv instead of body

  // Keep end screen visible; user can choose to play again
  document.getElementById('hear-phrase-btn').style.display = 'none';
  pauseBtn.style.display = 'none';
  stopBtn.style.display = 'none';
  playAgainBtn.style.display = 'inline-flex';

  // Hide start controls while showing end screen
  categorySelectionDiv.style.display = 'none';
  startBtn.style.display = 'none';
  if (viewResultsBtn) viewResultsBtn.style.display = 'none';
}


// Hide Game UI Elements
function hideGameUI() {
  document.querySelector('.timer').style.display = 'none';
  barFill.style.display = 'none';
  const progressContainer = document.getElementById('progress-container');
  if (progressContainer) progressContainer.style.display = 'none';
}

function showGameUI() {
  document.querySelector('.timer').style.display = 'block';
  barFill.style.display = 'block';
  const progressContainer = document.getElementById('progress-container');
  if (progressContainer) progressContainer.style.display = 'block';

  // When the game is visible, hide pre-game controls (they live outside `.game`)
  if (startBtn) startBtn.style.display = 'none';
  if (categorySelectionDiv) categorySelectionDiv.style.display = 'none';
}

// Start the Game
startBtn.addEventListener('click', () => {
  if (!phrasesLoaded) {
    alert('Phrases are still loading. Please try again in a moment.');
    return;
  }
  selectedCategoryKey = categorySelector?.value || selectedCategoryKey;
  selectedCategoryLabel = categoryLabel(selectedCategoryKey);
  const pool = categories[selectedCategoryKey] || [];
  const roundSize = Math.min(pool.length, 7 + Math.floor(Math.random() * 2)); // 7-8
  const roundPhrases = shuffle([...(pool || [])]).slice(0, roundSize);
  setPhrases(roundPhrases);
  if (!phrases.length) {
    alert('No phrases found for this category.');
    return;
  }

  roundPhraseCount = phrases.length;
  alert(`Round: ${roundPhraseCount} ${selectedCategoryLabel.toLowerCase()}. Pick the correct English translation before time runs out.`);

  // Reset game state
  currentPhraseIndex = 0;
  score = 0;
  isPaused = false;
  nextBtn.disabled = false;
  pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
  pausedMs = 0;
  pauseStartedAt = 0;
  playAgainBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-flex';
  stopBtn.style.display = 'inline-flex';

  gameStartTime = Date.now();
  roundStartTime = gameStartTime;
  showGameUI();
  startBtn.style.display = 'none';
  categorySelectionDiv.style.display = 'none';
  gameDiv.style.display = 'block';
  nextBtn.style.display = 'none';
  document.getElementById('hear-phrase-btn').style.display = 'inline-flex';
  setChoicesDisabled(false);
  choicesDiv.style.display = 'block';
  updateRoundProgressButton();
  showPhrase();
  saveProgress();
});

// Handle Name Entry
enterBtn.addEventListener('click', () => {
  const name = nameField.value.trim();
  if (name) {
    playerName = name;
    alert(`Welcome, ${name}!`);
    nameInputDiv.style.display = 'none';
    categorySelectionDiv.style.display = 'block';
    startBtn.style.display = 'block';
    if (viewResultsBtn) viewResultsBtn.style.display = 'inline-flex';
    showRoundInfoAlert();
    updateResumeButton();
  } else {
    alert('Please enter your name.');
  }
});

// Shuffle Array Function
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Add event listener for the "Hear Phrase" button
const hearPhraseBtn = document.getElementById('hear-phrase-btn');
hearPhraseBtn.addEventListener('click', () => {
  const phrase = phrases[currentPhraseIndex];
  playPhrase(normalizeDutch(phrase?.dutch)); // Play Dutch phrase
});

pauseBtn.addEventListener('click', () => {
  if (!gameDiv || gameDiv.style.display === 'none') return;
  isPaused = !isPaused;
  if (isPaused) {
    clearInterval(timerInterval);
    pauseStartedAt = Date.now();
    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continue';
    setChoicesDisabled(true);
    nextBtn.disabled = true;
  } else {
    if (pauseStartedAt) pausedMs += Date.now() - pauseStartedAt;
    pauseStartedAt = 0;
    pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
    setChoicesDisabled(false);
    nextBtn.disabled = false;
    startTimer(timeLeft);
  }
});

stopBtn.addEventListener('click', () => {
  if (!gameDiv || gameDiv.style.display === 'none') return;
  if (!isPaused) {
    isPaused = true;
    clearInterval(timerInterval);
    pauseStartedAt = Date.now();
    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continue';
    setChoicesDisabled(true);
    nextBtn.disabled = true;
  }
  openStopModal();
});

function getScoreboard() {
  try {
    const raw = localStorage.getItem('scoreboard');
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setScoreboard(entries) {
  try {
    localStorage.setItem('scoreboard', JSON.stringify(entries));
  } catch {
    // ignore storage errors
  }
}

function saveScoreEntry({ name, score, category, totalQuestions, durationSeconds }) {
  const entry = {
    name,
    score,
    category,
    totalQuestions,
    durationSeconds: Number.isFinite(durationSeconds) ? durationSeconds : undefined,
    date: new Date().toISOString(),
  };
  const entries = getScoreboard();
  entries.unshift(entry);
  setScoreboard(entries.slice(0, 20));
  return entry;
}

function findPreviousEntry(currentEntry) {
  const entries = getScoreboard();
  for (const e of entries) {
    if (!e || e === currentEntry) continue;
    if (e?.date === currentEntry?.date) continue;
    if ((e?.name || '') === (currentEntry?.name || '') && (e?.category || '') === (currentEntry?.category || '')) {
      return e;
    }
  }
  return null;
}

function renderEndSummary(entry) {
  if (!entry) return;
  const prev = findPreviousEntry(entry);

  const scoreText = `${entry.score}/${entry.totalQuestions}`;
  const timeText = Number.isFinite(entry.durationSeconds) ? formatDuration(entry.durationSeconds) : '';

  const heading = `<div style="font-weight: 600; margin-top: 10px;">Round summary</div>`;

  if (!prev) {
    resultDiv.innerHTML = `
      ${heading}
      <table class="scoreboard">
        <tbody>
          <tr><th>Player</th><td><strong>${escapeHtml(entry.name)}</strong></td></tr>
          <tr><th>Category</th><td>${escapeHtml(entry.category || '')}</td></tr>
          <tr><th>Score</th><td><strong>${escapeHtml(scoreText)}</strong></td></tr>
          <tr><th>Time</th><td><strong>${escapeHtml(timeText)}</strong></td></tr>
        </tbody>
      </table>
    `;
    return;
  }

  const prevScore = Number(prev.score);
  const prevTotal = Number(prev.totalQuestions);
  const prevScoreText = Number.isFinite(prevScore) && Number.isFinite(prevTotal) ? `${prevScore}/${prevTotal}` : '';
  const prevTimeText = Number.isFinite(prev.durationSeconds) ? formatDuration(prev.durationSeconds) : '';

  const scoreDelta = Number.isFinite(prevScore) ? entry.score - prevScore : null;
  const deltaScoreText = scoreDelta === null ? '—' : (scoreDelta === 0 ? '0' : (scoreDelta > 0 ? `+${scoreDelta}` : `${scoreDelta}`));

  const timeDelta = Number.isFinite(entry.durationSeconds) && Number.isFinite(prev.durationSeconds)
    ? entry.durationSeconds - prev.durationSeconds
    : null;
  let deltaTimeText = '—';
  if (timeDelta !== null) {
    const sign = timeDelta > 0 ? '+' : timeDelta < 0 ? '-' : '';
    deltaTimeText = timeDelta === 0 ? '0:00' : `${sign}${formatDuration(Math.abs(timeDelta))}`;
  }

  resultDiv.innerHTML = `
    ${heading}
    <table class="scoreboard">
      <thead>
        <tr>
          <th>Item</th>
          <th>Result</th>
          <th class="muted">Previous</th>
          <th class="muted">Change</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Player</td><td><strong>${escapeHtml(entry.name)}</strong></td><td class="muted">—</td><td class="muted">—</td></tr>
        <tr><td>Category</td><td>${escapeHtml(entry.category || '')}</td><td class="muted">—</td><td class="muted">—</td></tr>
        <tr><td>Score</td><td><strong>${escapeHtml(scoreText)}</strong></td><td class="muted">${escapeHtml(prevScoreText)}</td><td class="muted">${escapeHtml(deltaScoreText)}</td></tr>
        <tr><td>Time</td><td><strong>${escapeHtml(timeText)}</strong></td><td class="muted">${escapeHtml(prevTimeText)}</td><td class="muted">${escapeHtml(deltaTimeText)}</td></tr>
      </tbody>
    </table>
  `;
}

function scoreRatio(entry) {
  const total = Number(entry?.totalQuestions);
  const s = Number(entry?.score);
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(s)) return 0;
  return s / total;
}

function getTopBestEntries(limit = 3) {
  const entries = getScoreboard();
  const sorted = [...entries].sort((a, b) => {
    // Higher score ratio first
    const r = scoreRatio(b) - scoreRatio(a);
    if (r !== 0) return r;
    // Higher raw score next
    const sd = Number(b?.score) - Number(a?.score);
    if (sd !== 0) return sd;
    // Faster time wins if available
    const ta = Number(a?.durationSeconds);
    const tb = Number(b?.durationSeconds);
    const aHas = Number.isFinite(ta);
    const bHas = Number.isFinite(tb);
    if (aHas && bHas && ta !== tb) return ta - tb;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    // Newer first
    return String(b?.date || '').localeCompare(String(a?.date || ''));
  });
  return sorted.slice(0, limit);
}

function getLeaderboardEntries({ limit = 5, category } = {}) {
  // Competitive ranking: best score first, ties -> faster time.
  const entries = getScoreboard();
  const filtered = category ? entries.filter(e => String(e?.category || '') === String(category)) : entries;
  const sorted = [...filtered].sort((a, b) => {
    const r = scoreRatio(b) - scoreRatio(a);
    if (r !== 0) return r;
    const sd = Number(b?.score) - Number(a?.score);
    if (sd !== 0) return sd;
    const ta = Number(a?.durationSeconds);
    const tb = Number(b?.durationSeconds);
    const aHas = Number.isFinite(ta);
    const bHas = Number.isFinite(tb);
    if (aHas && bHas && ta !== tb) return ta - tb;
    if (aHas && !bHas) return -1;
    if (!aHas && bHas) return 1;
    return String(b?.date || '').localeCompare(String(a?.date || ''));
  });
  return sorted.slice(0, limit);
}

function aggregatePlayerByCategory(player) {
  const entries = getScoreboard().filter(e => (e?.name || '') === (player || ''));
  const byCat = new Map();
  for (const e of entries) {
    const cat = String(e?.category || 'Unknown');
    const cur = byCat.get(cat) || { games: 0, correct: 0, total: 0, bestTime: null };
    cur.games += 1;
    cur.correct += Number(e?.score) || 0;
    cur.total += Number(e?.totalQuestions) || 0;
    const t = Number(e?.durationSeconds);
    if (Number.isFinite(t)) cur.bestTime = cur.bestTime === null ? t : Math.min(cur.bestTime, t);
    byCat.set(cat, cur);
  }
  return [...byCat.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

function getAllCategoryLabels() {
  const labels = new Set();
  try {
    for (const key of Object.keys(categories || {})) labels.add(categoryLabel(key));
  } catch {
    // ignore
  }
  for (const e of getScoreboard()) {
    if (e?.category) labels.add(String(e.category));
  }
  return [...labels].filter(Boolean).sort((a, b) => a.localeCompare(b));
}

function buildLeaderboardRows(categoryLabelFilter) {
  const leaderboard = getLeaderboardEntries({ limit: 5, category: categoryLabelFilter || null });
  if (!leaderboard.length) return `<tr><td colspan="5" class="muted">No results yet.</td></tr>`;
  return leaderboard
    .map((e, idx) => {
      const durationText = Number.isFinite(e.durationSeconds) ? formatDuration(e.durationSeconds) : '—';
      return `<tr>
        <td class="rank">${idx + 1}</td>
        <td><strong>${escapeHtml(e.name)}</strong></td>
        <td>${escapeHtml(String(e.category || ''))}</td>
        <td><strong>${escapeHtml(String(e.score))}</strong> <span class="muted">/ ${escapeHtml(String(e.totalQuestions ?? ''))}</span></td>
        <td class="muted">${escapeHtml(durationText)}</td>
      </tr>`;
    })
    .join('');
}

function leaderboardCategorySelectHtml(defaultCategoryLabel) {
  const options = getAllCategoryLabels();
  const safeDefault = defaultCategoryLabel && options.includes(defaultCategoryLabel) ? defaultCategoryLabel : (options[0] || '');
  const optsHtml = options
    .map(l => `<option value="${escapeHtml(l)}"${l === safeDefault ? ' selected' : ''}>${escapeHtml(l)}</option>`)
    .join('');
  return `
    <label style="display:flex; align-items:center; gap:10px; justify-content:center; margin-top:10px;">
      <span class="muted">Category</span>
      <select class="leaderboard-category-select">${optsHtml}</select>
    </label>
  `;
}

function renderResultsDashboardForPlayer(name) {
  const entries = getScoreboard().filter(e => (e?.name || '') === (name || ''));
  const latest = entries[0] || null;

  if (latest) {
    renderEndResults({ lastAttemptEntry: latest });
    return;
  }

  const summaryRows = aggregatePlayerByCategory(name)
    .map(([cat, agg]) => {
      const bestTimeText = agg.bestTime === null ? '—' : formatDuration(agg.bestTime);
      return `<tr>
        <td>${escapeHtml(cat)}</td>
        <td><strong>${escapeHtml(String(agg.correct))}</strong><span class="muted">/${escapeHtml(String(agg.total))}</span></td>
        <td class="muted">${escapeHtml(String(agg.games))}</td>
        <td class="muted">${escapeHtml(bestTimeText)}</td>
      </tr>`;
    })
    .join('') || `<tr><td colspan="4" class="muted">No results yet. Play a round first!</td></tr>`;

  const selectedCategory = categorySelector?.value ? categoryLabel(categorySelector.value) : null;
  const leaderboardRows = buildLeaderboardRows(selectedCategory);

  resultDiv.innerHTML += `
    <div class="leaderboard-title section-title">📊 Player Summary (total score per category)</div>
    <table class="scoreboard player-summary-table" style="margin-top: 10px;">
      <thead>
        <tr>
          <th>Category</th>
          <th>Total</th>
          <th>Games</th>
          <th>Best time</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
      </tbody>
    </table>

    <div class="collapsible">
      <details>
        <summary class="leaderboard-title section-title">
          <span class="leaderboard-title-text">🏆 Leaderboard${selectedCategory ? ` (${escapeHtml(selectedCategory)})` : ''}</span>
          <i class="fas fa-chevron-down chevron" aria-hidden="true"></i>
        </summary>
        <div class="details-body">
          ${leaderboardCategorySelectHtml(selectedCategory)}
          <div class="lb-scroll-area" style="margin-top: 10px;">
            <table class="scoreboard leaderboard-table" style="margin-top: 0;">
              <thead>
                <tr>
                  <th class="rank">#</th>
                  <th>Player</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody class="leaderboard-body">${leaderboardRows}</tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  `;
}

function renderEndResults({ lastAttemptEntry }) {
  if (!lastAttemptEntry) return;
  const last = lastAttemptEntry;
  const lastDurationText = Number.isFinite(last.durationSeconds) ? formatDuration(last.durationSeconds) : '—';

  const summaryRows = aggregatePlayerByCategory(last.name)
    .map(([cat, agg]) => {
      const bestTimeText = agg.bestTime === null ? '—' : formatDuration(agg.bestTime);
      return `<tr>
        <td>${escapeHtml(cat)}</td>
        <td><strong>${escapeHtml(String(agg.correct))}</strong><span class="muted">/${escapeHtml(String(agg.total))}</span></td>
        <td class="muted">${escapeHtml(String(agg.games))}</td>
        <td class="muted">${escapeHtml(bestTimeText)}</td>
      </tr>`;
    })
    .join('') || `<tr><td colspan="4" class="muted">No history yet.</td></tr>`;

  const leaderboardCategory = String(last.category || '');
  const leaderboardRows = buildLeaderboardRows(leaderboardCategory);

  const lastLine = `${last.name} • ${String(last.category || '')} • ${last.score}/${last.totalQuestions}`;

  resultDiv.innerHTML += `
    <div class="leaderboard-title section-title"><i class="fas fa-arrow-trend-up"></i> Last Game Result</div>
    <div class="top-result" style="margin-top: 10px;">
      <div class="top-result-lines">
        <div><strong>${escapeHtml(lastLine)}</strong></div>
        <div class="muted">⏱ ${escapeHtml(lastDurationText)}</div>
      </div>
    </div>

    <div class="leaderboard-title section-title">📊 Player Summary (total score per category)</div>
    <table class="scoreboard player-summary-table" style="margin-top: 10px;">
      <thead>
        <tr>
          <th>Category</th>
          <th>Total</th>
          <th>Games</th>
          <th>Best time</th>
        </tr>
      </thead>
      <tbody>
        ${summaryRows}
      </tbody>
    </table>

    <div class="collapsible">
      <details>
        <summary class="leaderboard-title section-title">
          <span class="leaderboard-title-text">🏆 Leaderboard (${escapeHtml(leaderboardCategory)})</span>
          <i class="fas fa-chevron-down chevron" aria-hidden="true"></i>
        </summary>
        <div class="details-body">
          ${leaderboardCategorySelectHtml(leaderboardCategory)}
          <div class="lb-scroll-area" style="margin-top: 10px;">
            <table class="scoreboard leaderboard-table" style="margin-top: 0;">
              <thead>
                <tr>
                  <th class="rank">#</th>
                  <th>Player</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody class="leaderboard-body">${leaderboardRows}</tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Stop modal actions
stopBackBtn?.addEventListener('click', () => {
  closeStopModal();
  // stay paused; user can press Continue
});

stopEndBtn?.addEventListener('click', () => {
  closeStopModal();
  endGame({ earlyExit: true });
});

playAgainBtn?.addEventListener('click', () => {
  // Go back to category selection screen
  gameDiv.style.display = 'none';
  categorySelectionDiv.style.display = 'block';
  startBtn.style.display = 'inline-flex';
  if (viewResultsBtn) viewResultsBtn.style.display = 'inline-flex';

  // Reset UI bits for next run
  questionDiv.textContent = '';
  questionDiv.classList.remove('game-over-title');
  choicesDiv.innerHTML = '';
  choicesDiv.style.display = 'block';
  resultDiv.textContent = '';
  resultDiv.classList.remove('end-screen');
  nextBtn.style.display = 'none';
  playAgainBtn.style.display = 'none';
  pauseBtn.style.display = 'inline-flex';
  stopBtn.style.display = 'inline-flex';
  updateResumeButton();
});

viewResultsBtn?.addEventListener('click', () => {
  if (!playerName) return;

  clearInterval(timerInterval);
  hideGameUI();

  questionDiv.textContent = 'RESULTS';
  questionDiv.classList.add('game-over-title');
  resultDiv.classList.add('end-screen');
  resultDiv.style.color = '#ffffff';

  // Hide gameplay UI
  choicesDiv.innerHTML = '';
  choicesDiv.style.display = 'none';
  nextBtn.style.display = 'none';
  document.getElementById('hear-phrase-btn').style.display = 'none';
  pauseBtn.style.display = 'none';
  stopBtn.style.display = 'none';
  playAgainBtn.style.display = 'none';

  // Show screen
  categorySelectionDiv.style.display = 'none';
  startBtn.style.display = 'none';
  viewResultsBtn.style.display = 'none';
  gameDiv.style.display = 'block';
  if (backBtn) backBtn.style.display = 'inline-flex';

  resultDiv.textContent = '';
  renderResultsDashboardForPlayer(playerName);
});

backBtn?.addEventListener('click', () => {
  if (backBtn) backBtn.style.display = 'none';
  questionDiv.textContent = '';
  questionDiv.classList.remove('game-over-title');
  resultDiv.textContent = '';
  resultDiv.classList.remove('end-screen');
  gameDiv.style.display = 'none';
  categorySelectionDiv.style.display = 'block';
  startBtn.style.display = 'inline-flex';
  if (viewResultsBtn) viewResultsBtn.style.display = 'inline-flex';
  updateResumeButton();
});

// Leaderboard scroll buttons (works on both end screen and results screen)
// (Leaderboard uses native scrolling inside .lb-scroll-area)

// Leaderboard category selector (works on end/results screens)
document.addEventListener('change', (e) => {
  const select = e.target?.closest?.('.leaderboard-category-select');
  if (!select) return;
  const container = select.closest('.collapsible');
  if (!container) return;

  const category = select.value;
  const body = container.querySelector('.leaderboard-body');
  if (body) body.innerHTML = buildLeaderboardRows(category);

  const title = container.querySelector('.leaderboard-title-text');
  if (title) title.textContent = `🏆 Leaderboard (${category})`;
});

categorySelector?.addEventListener('change', () => {
  updateResumeButton();
});

// Resume button removed (progress still saved to localStorage).

roundProgressBtn?.addEventListener('click', () => {
  // Treat this as a quick “pause/options” entry point
  if (!gameDiv || gameDiv.style.display === 'none') return;
  if (!isPaused) {
    isPaused = true;
    clearInterval(timerInterval);
    pauseStartedAt = Date.now();
    pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continue';
    setChoicesDisabled(true);
    nextBtn.disabled = true;
  }
  openStopModal();
});

// Prefer clearer Dutch voices when the browser exposes several (Chrome often has "Google … Nederlands").
let cachedDutchVoice = null;

function scoreDutchVoice(v) {
  let s = 0;
  const n = (v.name || '').toLowerCase();
  const lang = (v.lang || '').toLowerCase();
  if (lang === 'nl-nl' || lang === 'nl_nl') s += 15;
  else if (lang.startsWith('nl')) s += 8;
  if (n.includes('google')) s += 45;
  if (n.includes('natural') || n.includes('neural') || n.includes('enhanced') || n.includes('premium')) s += 35;
  if (n.includes('microsoft')) s += 28;
  if (n.includes('samantha') || n.includes('xander')) s += 5; // macOS bundled names vary
  if (v.default) s += 2;
  return s;
}

function pickBestDutchVoice() {
  try {
    const voices = speechSynthesis.getVoices();
    const dutch = voices.filter(
      v =>
        (v.lang && v.lang.toLowerCase().startsWith('nl')) ||
        /dutch|nederlands/i.test(v.name || '')
    );
    if (!dutch.length) return null;
    return [...dutch].sort((a, b) => scoreDutchVoice(b) - scoreDutchVoice(a))[0];
  } catch {
    return null;
  }
}

function refreshDutchVoiceCache() {
  cachedDutchVoice = pickBestDutchVoice();
}

if (typeof speechSynthesis !== 'undefined') {
  refreshDutchVoiceCache();
  if (typeof speechSynthesis.addEventListener === 'function') {
    speechSynthesis.addEventListener('voiceschanged', refreshDutchVoiceCache);
  } else {
    speechSynthesis.onvoiceschanged = refreshDutchVoiceCache;
  }
}

// Function to Play Phrase Using SpeechSynthesis API
function playPhrase(phrase) {
  if (!phrase || !String(phrase).trim()) return;
  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(String(phrase).trim());
  const voice = cachedDutchVoice || pickBestDutchVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'nl-NL';
  } else {
    utterance.lang = 'nl-NL';
  }
  utterance.rate = 0.88;
  utterance.pitch = 1;
  utterance.volume = 1;

  speechSynthesis.speak(utterance);
}
