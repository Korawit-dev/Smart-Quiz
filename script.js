// === Cookie Utility ===
const CookieStore = {
    set(name, value, days = 365) {
        const d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        document.cookie = `${name}=${value};path=/;expires=${d.toUTCString()}`;
    },
    get(name) {
        const cookies = document.cookie.split(';').map(c => c.trim());
        for (let c of cookies) {
            if (c.startsWith(name + '=')) return c.substring(name.length + 1);
        }
        return null;
    }
};

function setCookie(name, value) {
    CookieStore.set(name, value);
}
function callCookie(name) {
    return CookieStore.get(name);
}

// === Config ===
const operatorScores = {
    easy:   { '+': 11, '-': 11, '×': 15, '÷': 14 },
    medium: { '+': 15, '-': 16, '×': 21, '÷': 20 },
    hard:   { '+': 20, '-': 22, '×': 28, '÷': 27 }
};
const operators = ['+', '-', '×', '÷'];
const difficulties = ['easy', 'medium', 'hard'];

// === Main DOM Elements ===
const toggleBtn = document.querySelector('.toggle-theme');
const body = document.body;
const input = document.getElementById('quizInput');
const sizer = document.getElementById('sizer');
const feedback = document.getElementById('feedback');
const mathExp = document.querySelector('.math-expression');
const scoreDisplay = document.getElementById('scoreDisplay');
const question = document.getElementById('question');

// === Game State ===
let currentAnswer = null;
let currentBaseScore = 0;
let totalScore = parseInt(callCookie('totalScore')) || 0;
let tmode = callCookie('mode') || 0;
let inputLocked = false;
let startTime = Date.now();

// === Theme Toggle ===
toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark');
    toggleBtn.textContent = body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
    setCookie('mode', body.classList.contains('dark') ? 1 : 0);
});
if (tmode == 1) {
    body.classList.add('dark');
    toggleBtn.textContent = 'Dark Mode';
}

// === Input ===
function updateInputWidth() {
    sizer.textContent = input.value || "?";
    input.style.width = sizer.offsetWidth + 10 + "px";
}
function addDigit(digit) {
    if (!inputLocked) {
        input.value += digit;
        updateInputWidth();
    }
}
function addDigitO(digit) {
    if (!inputLocked && input.value.length === 0) {
        input.value += digit;
        updateInputWidth();
    }
}
function clearInput() {
    input.value = '';
    feedback.textContent = '\u200B';
    mathExp.classList.remove('correct', 'incorrect', 'error');
    updateInputWidth();
}
function skipQuestion() {
    if (!inputLocked) {
        clearInput();
        showNewQuestion();
    }
}

// === Score Display ===
function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${totalScore}`;
}

// === Question Log ===
const questionLog = [];
function logQuestionResult({ questionText, userAnswer, correctAnswer, difficulty, baseScore, timeTaken }) {
    const isCorrect = userAnswer === correctAnswer;
    const score = isCorrect ? baseScore : -baseScore; // If wrong, subtract base score

    const entry = {
        question: questionText,
        userAnswer,
        correctAnswer,
        isCorrect,
        difficulty,
        baseScore,
        scoreGiven: score,
        timeTakenInSeconds: timeTaken,
        timestamp: new Date().toISOString()
    };

    questionLog.push(entry);
    console.log("📝 Question Log:", entry);
}

// === Answer Check ===
function checkAnswer() {
    if (inputLocked) return;
    const answerStr = input.value.trim();
    const answer = parseInt(answerStr);

    mathExp.classList.remove('correct', 'incorrect', 'error');
    feedback.textContent = '\u200B';

    if (answerStr === '' || isNaN(answer)) {
        feedback.textContent = '⚠️ Please enter number!';
        feedback.style.color = 'orange';
        mathExp.classList.add('error');
        return;
    }

    input.disabled = true;
    inputLocked = true;

    let awarded = 0;
    if (answer === currentAnswer) {
        awarded = currentBaseScore;
        totalScore += awarded;
        feedback.textContent = `✅ Correct! +${awarded}`;
        feedback.style.color = 'green';
        mathExp.classList.add('correct');
    } else {
        awarded = -currentBaseScore;
        totalScore += awarded;
        feedback.textContent = `❌ Wrong! -${currentBaseScore}`;
        feedback.style.color = 'red';
        mathExp.classList.add('incorrect');
    }

    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    logQuestionResult({
        questionText: question.textContent.replace(" = ", ""),
        userAnswer: answer,
        correctAnswer: currentAnswer,
        difficulty: currentDifficulty,
        baseScore: currentBaseScore,
        timeTaken
    });

    setCookie('totalScore', totalScore);
    updateScoreDisplay();
    setTimeout(showNewQuestion, 1500);
}

// === Generate Question ===
let currentDifficulty = '';
function generateMathQuestion() {
    currentDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    const baseScore = operatorScores[currentDifficulty][operator];

    let num1, num2;
    let answer;
    switch (operator) {
        case '+':
        case '-':
            num1 = Math.floor(Math.random() * 50);
            num2 = Math.floor(Math.random() * 50);
            answer = operator === '+' ? num1 + num2 : num1 - num2;
            break;
        case '×':
            num1 = Math.floor(Math.random() * 20);
            num2 = Math.floor(Math.random() * 10);
            answer = num1 * num2;
            break;
        case '÷':
            num2 = Math.floor(Math.random() * 9) + 1;
            const mult = Math.floor(Math.random() * 10) + 1;
            num1 = num2 * mult;
            answer = num1 / num2;
            break;
    }

    return {
        question: `${num1} ${operator} ${num2}`,
        answer,
        baseScore,
        operator,
        difficulty: currentDifficulty
    };
}

// === Show Question ===
function showNewQuestion() {
    const q = generateMathQuestion();
    question.textContent = q.question + " = ";
    currentAnswer = q.answer;
    currentBaseScore = q.baseScore;

    input.disabled = false;
    inputLocked = false;
    clearInput();
    updateScoreDisplay();
    startTime = Date.now();
}

// === Init ===
showNewQuestion();
updateInputWidth();
updateScoreDisplay();

// === Keyboard Events ===
document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (inputLocked) return;

    if (/^\d$/.test(key)) {
        addDigit(key);
    } else if ((key === '-' || key === '+') && input.value.length === 0) {
        addDigit(key);
    } else if (key === 'Backspace') {
        clearInput();
        updateInputWidth();
    } else if (key === 'Enter') {
        checkAnswer();
    } else if (key === ' ') {
        e.preventDefault();
        skipQuestion();
    }
});
