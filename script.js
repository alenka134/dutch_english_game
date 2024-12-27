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

    // Start the timer
    function startTimer() {
      const timerDuration = 30;
      timeLeft = timerDuration;
      timerSpan.textContent = timeLeft;

      clearInterval(timerInterval); // Ensure the timer is reset
      barFill.style.width = '100%'; // Reset progress bar to 100%

      timerInterval = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;

        // Update progress bar
        const progress = (timeLeft / timerDuration) * 100;
        barFill.style.width = `${progress}%`;
        updateProgressBarColor(progress);

        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          resultDiv.textContent = 'Time is up!';
          resultDiv.style.color = 'red';
          nextBtn.style.display = 'inline';
        }
      }, 1000);
    }

    // Update progress bar color based on time left
    function updateProgressBarColor(progress) {
      if (progress > 50) {
        barFill.style.background = "linear-gradient(to right, #003366, #0066cc)";
      } else if (progress > 25) {
        barFill.style.background = "linear-gradient(to right, #0066cc, #3399ff)";
      } else {
        barFill.style.background = "linear-gradient(to right, #3399ff, #66ccff)";
      }
    }

    // Display the current phrase and choices
    function showPhrase() {
      resultDiv.textContent = '';
      nextBtn.style.display = 'none';

      const phrase = phrases[currentPhraseIndex];
      questionDiv.textContent = `Translate this phrase: "${phrase.dutch}"`;

      const choices = generateChoices(phrase);
      renderChoices(choices);

      startTimer();
    }

    // Generate random choices for the user
    function generateChoices(phrase) {
      const choices = [phrase.english];
      while (choices.length < 4) {
        const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)].english;
        if (!choices.includes(randomPhrase)) choices.push(randomPhrase);
      }
      return choices.sort(() => Math.random() - 0.5);
    }

    // Render choices as buttons
    function renderChoices(choices) {
      choicesDiv.innerHTML = '';
      choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.addEventListener('click', () => checkAnswer(choice));
        choicesDiv.appendChild(button);
      });
    }

    // Check the answer and display the result
    function checkAnswer(selected) {
      const correctAnswer = phrases[currentPhraseIndex].english;
      displayResult(selected === correctAnswer, correctAnswer);
      clearInterval(timerInterval); // Stop timer when answer is selected
      nextBtn.style.display = 'inline';
    }

    // Display result after answer selection
    function displayResult(isCorrect, correctAnswer) {
      const image = document.createElement('img');
      image.className = 'result-image';
      if (isCorrect) {
        resultDiv.textContent = 'Correct!';
        resultDiv.style.color = '#98FB98';
        score++;
        scoreSpan.textContent = score;
        image.src = 'img/pass.png';
      } else {
        resultDiv.textContent = `Wrong! The correct answer was "${correctAnswer}".`;
        resultDiv.style.color = 'red';
        image.src = 'img/fail.png';
      }

      const existingImage = document.querySelector('.result-image');
      if (existingImage) existingImage.remove();
      document.body.appendChild(image);
    }

    // Handle next button click to move to the next phrase or end the game
    nextBtn.addEventListener('click', () => {
      currentPhraseIndex++;
      if (currentPhraseIndex < phrases.length) {
        showPhrase();
      } else {
        endGame();
      }
    });

    // End the game and display final score
    function endGame() {
      clearInterval(timerInterval);
      timerSpan.style.display = 'none';
      questionDiv.textContent = 'Game Over!';
      choicesDiv.innerHTML = '';
      resultDiv.textContent = `Final Score: ${score}`;
      resultDiv.style.color = '#98FB98';

      const totalQuestions = phrases.length;
      resultDiv.innerHTML += `<br>Your total number of questions answered: ${totalQuestions}`;
      displayTotalTime();

      nextBtn.style.display = 'none';
    }

    // Display total time elapsed
    function displayTotalTime() {
      const totalElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const totalMinutes = Math.floor(totalElapsed / 60);
      const totalSeconds = totalElapsed % 60;
      resultDiv.innerHTML += `<br>Your total play time: ${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}`;
    }

    // Start game when the start button is clicked
    startBtn.addEventListener('click', () => {
      gameStartTime = Date.now();
      startBtn.style.display = 'none';
      gameDiv.style.display = 'block';
      showPhrase();
    });

    // Handle name entry and start game button visibility
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
  })
  .catch(error => {
    console.error('Error loading the data file:', error);
  });

// Shuffle function to randomize the phrases array
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
