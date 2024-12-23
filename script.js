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
const timerSpan = document.getElementById('timer'); // Timer element

let currentPhraseIndex = 0;
let score = 0;
let timerInterval;
let timeLeft = 30; // Timer set to 30 seconds for each phrase
let gameStartTime; // Store the start time of the game

// Phrases
const phrases = [
    { dutch: "Goedemorgen", english: "Good morning" },
    { dutch: "Hoe gaat het met u?", english: "How are you?" },
    { dutch: "Fijn om te horen", english: "Happy to hear" },
    { dutch: "Het gaat wel", english: "I'm okay, so-so" },
    { dutch: "Met mij gaat het niet goed", english: "I'm not feeling good" },
    { dutch: "Met mij gaat het slecht", english: "I'm feeling really bad" },
    { dutch: "Vervelend om te horen", english: "Sorry to hear / I feel for you" },
    { dutch: "Dankjewel/Dankuwel", english: "Thank you (informal/formal)" },
    { dutch: "Waar is het station?", english: "Where is the station?" },
    { dutch: "Alsjeblieft / Alstublieft", english: "Please (informal/formal)" },
    { dutch: "Mag ik een vraag stellen?", english: "May I ask you a question?" },
    { dutch: ["Wie ben jij?", "Hoe heet jij?", "Wat is jouw naam?"], english: "What's your name?" },
    { dutch: "Begrijp je het?", english: "Do you understand?" },
    { dutch: "Nee, ik begrijp het niet", english: "I don’t understand." },
    { dutch: "Kan je dat herhalen?", english: "Can you repeat that?" },
    { dutch: "Kan je langzaam praten?", english: "Can you talk slowly?" },
    { dutch: "Wat zeg je?", english: "What do you say?" },
    { dutch: "Ik heb een vraag", english: "I have a question" },
    { dutch: "Ik heb geen vraag", english: "I don't have a question" },
    { dutch: "Mag ik je wat vragen?", english: "Can I ask you something?" },
    { dutch: "Ik spreek een beetje Nederlands", english: "I speak a little Dutch" },
    { dutch: "En jij?", english: "And you?" },
    { dutch: "Met mij gaat het (heel) goed, dankjewel", english: "I'm feeling good, thank you" }
];

// Shuffle the phrases array
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

const shuffledPhrases = shuffle([...phrases]);

// Show a phrase
function showPhrase() {
    resultDiv.textContent = '';
    nextBtn.style.display = 'none';

    const phrase = shuffledPhrases[currentPhraseIndex];
    questionDiv.textContent = `Translate this phrase: "${phrase.dutch}"`;

    const choices = [phrase.english];
    while (choices.length < 4) {
        const randomPhrase = shuffledPhrases[Math.floor(Math.random() * shuffledPhrases.length)].english;
        if (!choices.includes(randomPhrase)) {
            choices.push(randomPhrase);
        }
    }

    choices.sort(() => Math.random() - 0.5);
    choicesDiv.innerHTML = '';

    choices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.addEventListener('click', () => checkAnswer(choice, button));
        choicesDiv.appendChild(button);
    });

    startTimer();
}

// Start the timer
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

// Check the answer
function checkAnswer(selected) {
    const correct = shuffledPhrases[currentPhraseIndex].english;
    const image = document.createElement('img'); // Create the image element
    image.className = 'result-image'; // Assign the CSS class
    if (selected === correct) {
        // Correct answer
        resultDiv.textContent = "Correct!";
        resultDiv.style.fontWeight = 'bold';
        resultDiv.style.color = '#98FB98'; // Mint greenish lemon color
        score++;
        scoreSpan.textContent = score;
        image.src = 'img/pass.png'; // Path to the "pass" image
    } else {
        // Incorrect answer
        resultDiv.textContent = `Wrong! The correct answer was "${correct}".`;
        resultDiv.style.fontWeight = 'bold';
        resultDiv.style.color = 'red';
        image.src = 'img/fail.png'; // Path to the "fail" image
    }
 // Clear previous images
    const existingImage = document.querySelector('.result-image');
    if (existingImage) existingImage.remove();

    // Append the new image to the body
    document.body.appendChild(image);
    clearInterval(timerInterval); // Stop the timer when answer is given
    nextBtn.style.display = 'inline';
}

// Move to the next phrase
nextBtn.addEventListener('click', () => {
    currentPhraseIndex++;
    if (currentPhraseIndex < shuffledPhrases.length) {
        showPhrase();
    } else {
        // Hide the timer and result section when the game ends
        clearInterval(timerInterval);  // Ensure the timer is stopped

        // Hide the timer element completely
        timerSpan.style.display = 'none';  // Hides the timer
        timerSpan.textContent = ''; // Clears any residual content in timerSpan

        // Display the game over screen without the time left info
        questionDiv.textContent = "Game Over!";
        choicesDiv.innerHTML = '';

        // Display the final score
        resultDiv.textContent = `Final Score: ${score}`;
        resultDiv.style.fontWeight = 'bold';
        resultDiv.style.color = '#98FB98'; // Mint greenish lemon color for score

        // Add the total number of questions answered and display it on the next line
        const totalQuestions = shuffledPhrases.length;
        resultDiv.innerHTML += `<br>Your total number of questions answered: ${totalQuestions}`;

        // Call the function to display the total play time
        displayTotalTime();

        // Hide the next button after the game is over
        nextBtn.style.display = 'none';
    }
});

// Display total play time
function displayTotalTime() {
    const totalElapsed = Math.floor((Date.now() - gameStartTime) / 1000);  // Get total elapsed time in seconds
    const totalMinutes = Math.floor(totalElapsed / 60);
    const totalSeconds = totalElapsed % 60;
    resultDiv.innerHTML += `<br>Your total play time: ${totalMinutes}:${totalSeconds < 10 ? '0' + totalSeconds : totalSeconds}`;
}

// Make sure the timer starts hidden at the beginning of the game
startBtn.addEventListener('click', () => {
    gameStartTime = Date.now(); // Store the start time when the game begins
    startBtn.style.display = 'none';
    gameDiv.style.display = 'block';
    showPhrase();

    // Make sure the timer is hidden when game starts, for any re-entry
    timerSpan.style.display = 'block'; // Ensure it's visible at the start
    timerSpan.textContent = '30'; // Set the initial timer text (if needed)
});

// Handle entering the name
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

// Start the game
startBtn.addEventListener('click', () => {
    gameStartTime = Date.now(); // Store the start time when the game begins
    startBtn.style.display = 'none';
    gameDiv.style.display = 'block';
    showPhrase();
});
