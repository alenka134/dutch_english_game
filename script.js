// Elements
const nameInputDiv = document.querySelector('.name-input');
const enterBtn = document.getElementById('enter-btn');
const startBtn = document.getElementById('start-btn');
const gameDiv = document.querySelector('.game');
const questionDiv = document.querySelector('.question');
const choicesDiv = document.querySelector('.choices');
const resultDiv = document.querySelector('.result');
const scoreSpan = document.getElementById('score');
const nextBtn = document.getElementById('next-btn');
const nameField = document.getElementById('name');
const timerSpan = document.getElementById('timer');
const barFill = document.getElementById("bar-fill");

let currentPhraseIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 30;
let gameStartTime;
let phrases = [];

// Fetch phrases from data.json
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    phrases = shuffle([...data.phrases]);
    showPhrase();
    startTimer();
  })
  .catch(error => console.error('Error loading the data file:', error));

// Start Timer
function startTimer() {
  const timerDuration = 30;
  timeLeft = timerDuration;
  timerSpan.textContent = timeLeft;
  barFill.style.width = '100%';

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
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
  resultDiv.textContent = 'Time is up!';
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

  const phrase = phrases[currentPhraseIndex];
  questionDiv.textContent = `Translate this phrase: "${phrase.dutch}"`;

  const choices = generateChoices(phrase);
  renderChoices(choices);

  startTimer();
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

// Check Answer after selecting a choice
function checkAnswer(selected) {
  const correctAnswer = phrases[currentPhraseIndex].english;
  const isCorrect = selected === correctAnswer;
  displayResult(isCorrect, correctAnswer);

  clearInterval(timerInterval);
  nextBtn.style.display = 'inline';
}
// Display Result with image (pass or fail)
function displayResult(isCorrect, correctAnswer) {
  // Clear any previous result content
  resultDiv.innerHTML = '';

  // Create the image element for pass or fail
  const image = createResultImage(isCorrect ? 'img/pass.png' : 'img/fail.png');

  // Check if image was loaded properly
  image.onload = function() {
    // Image loaded successfully
    console.log('Image loaded successfully');
    resultDiv.appendChild(image); // Append the result image after it's loaded
  };

  image.onerror = function() {
    // Handle image loading error
    console.error('Error loading image:', image.src);
  };

  // Show result text after image
  resultDiv.textContent = isCorrect ? 'Correct!' : `Wrong! The correct answer was "${correctAnswer}".`;
  resultDiv.style.color = isCorrect ? '#98FB98' : 'red';

  // Update score if the answer is correct
  if (isCorrect) {
    score++;
    scoreSpan.textContent = score;
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
    showPhrase();
  } else {
    endGame();
  }
});

// End Game
function endGame() {
  clearInterval(timerInterval);
  hideGameUI();

  questionDiv.textContent = 'Game Over!';
  resultDiv.textContent = `Final Score: ${score}`;
  resultDiv.style.color = '#98FB98';

  const totalQuestions = phrases.length;
  resultDiv.innerHTML += `<br>Your total number of questions answered: ${totalQuestions}`;
  displayTotalTime();

  nextBtn.style.display = 'none';

  // Show "Dino" image for Game Over
  const image = createResultImage('img/dino.png');
  resultDiv.appendChild(image); // Append to resultDiv instead of body

  // Hide the "Hear Phrase" button on game over
  const hearPhraseBtn = document.getElementById('hear-phrase-btn');
  hearPhraseBtn.style.display = 'none';  // Hide the button
}


// Hide Game UI Elements
function hideGameUI() {
  document.querySelector('.timer').style.display = 'none';
  barFill.style.display = 'none';
}

// Display Total Play Time
function displayTotalTime() {
  const totalElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
  const totalMinutes = Math.floor(totalElapsed / 60);
  const totalSeconds = totalElapsed % 60;
  resultDiv.innerHTML += `<br>Your total play time: ${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}`;
}

// Start the Game
startBtn.addEventListener('click', () => {
  gameStartTime = Date.now();
  startBtn.style.display = 'none';
  gameDiv.style.display = 'block';
  showPhrase();
});

// Handle Name Entry
enterBtn.addEventListener('click', () => {
  const name = nameField.value.trim();
  if (name) {
    alert(`Welcome, ${name}! Click "Start Game" to begin.`);
    nameInputDiv.style.display = 'none';
    startBtn.style.display = 'block';
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
  playPhrase(phrase.dutch); // Play Dutch phrase
});

// Function to Play Phrase Using SpeechSynthesis API
function playPhrase(phrase) {
  const utterance = new SpeechSynthesisUtterance(phrase);
  utterance.lang = 'nl-NL'; // Dutch language
  utterance.rate = 0.8;      // Speed of speech
  utterance.pitch = 1;       // Pitch of the voice

  speechSynthesis.speak(utterance); // Speak the phrase
}
