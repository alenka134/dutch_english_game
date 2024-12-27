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

let currentPhraseIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 30;
let gameStartTime;
let phrases = [];

fetch('data.json')
  .then(response => response.json())
  .then(data => {
    phrases = data.phrases;
    const shuffledPhrases = shuffle([...phrases]);

    function showPhrase() {
      resultDiv.textContent = '';
      nextBtn.style.display = 'none';

      const phrase = shuffledPhrases[currentPhraseIndex];
      questionDiv.textContent = `Translate this phrase: "${phrase.dutch}"`;

      const choices = [phrase.english];
      while (choices.length < 4) {
        const randomPhrase = shuffledPhrases[Math.floor(Math.random() * shuffledPhrases.length)].english;
        if (!choices.includes(randomPhrase)) choices.push(randomPhrase);
      }

      choices.sort(() => Math.random() - 0.5);
      choicesDiv.innerHTML = '';
      choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.addEventListener('click', () => checkAnswer(choice));
        choicesDiv.appendChild(button);
      });

      startTimer();
    }

    function startTimer() {
      timeLeft = 30;
      timerSpan.textContent = timeLeft;

      timerInterval = setInterval(() => {
        timeLeft--;
        timerSpan.textContent = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(timerInterval);
          resultDiv.textContent = 'Time is up!';
          resultDiv.style.color = 'red';
          nextBtn.style.display = 'inline';
        }
      }, 1000);
    }

    function checkAnswer(selected) {
      const correct = shuffledPhrases[currentPhraseIndex].english;
      const image = document.createElement('img');
      image.className = 'result-image';

      if (selected === correct) {
        resultDiv.textContent = 'Correct!';
        resultDiv.style.color = '#98FB98';
        score++;
        scoreSpan.textContent = score;
        image.src = 'img/pass.png';
      } else {
        resultDiv.textContent = `Wrong! The correct answer was "${correct}".`;
        resultDiv.style.color = 'red';
        image.src = 'img/fail.png';
      }

      const existingImage = document.querySelector('.result-image');
      if (existingImage) existingImage.remove();
      document.body.appendChild(image);

      clearInterval(timerInterval);
      nextBtn.style.display = 'inline';
    }

    nextBtn.addEventListener('click', () => {
      currentPhraseIndex++;
      if (currentPhraseIndex < shuffledPhrases.length) {
        showPhrase();
      } else {
        endGame();
      }
    });

    function endGame() {
      clearInterval(timerInterval);
      timerSpan.style.display = 'none';
      questionDiv.textContent = 'Game Over!';
      choicesDiv.innerHTML = '';
      resultDiv.textContent = `Final Score: ${score}`;
      resultDiv.style.color = '#98FB98';

      const totalQuestions = shuffledPhrases.length;
      resultDiv.innerHTML += `<br>Your total number of questions answered: ${totalQuestions}`;
      displayTotalTime();

      nextBtn.style.display = 'none';
    }

    function displayTotalTime() {
      const totalElapsed = Math.floor((Date.now() - gameStartTime) / 1000);
      const totalMinutes = Math.floor(totalElapsed / 60);
      const totalSeconds = totalElapsed % 60;
      resultDiv.innerHTML += `<br>Your total play time: ${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}`;
    }

    startBtn.addEventListener('click', () => {
      gameStartTime = Date.now();
      startBtn.style.display = 'none';
      gameDiv.style.display = 'block';
      showPhrase();
    });

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

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
