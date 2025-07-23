{
    // === Main DOM varible ===
    const toggleBtn = document.querySelector('.toggle-theme');
    const body = document.body;
    const input = document.getElementById('quizInput');
    const sizer = document.getElementById('sizer');
    const feedback = document.getElementById('feedback');
    const mathExp = document.querySelector('.math-expression');
    const scoreDisplay = document.getElementById('scoreDisplay');

    // === Cookie Module ===
    const CookieStore = {
        set(variableName, value, days = 365) {
            const d = new Date();
            d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
            document.cookie = `${variableName}=${value};path=/;expires=${d.toUTCString()}`;
        },

        get(variableName) {
            const cookies = document.cookie.split(';').map(c => c.trim());
            for (let c of cookies) {
                if (c.startsWith(variableName + '=')) {
                    return c.substring(variableName.length + 1);
                }
            }
            return null;
        }
    };

    function setCookie(variableName, value) {
        CookieStore.set(variableName, value);
    }

    function callCookie(variableName) {
        return CookieStore.get(variableName);
    }

    // === Score Variable ===
    let currentAnswer = null;
    let currentBaseScore = 0;
    let totalScore = parseInt(callCookie('totalScore')) || 0;
    let tmode = callCookie('mode') || 0;

    // === Theme Toggle ===
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark');
        toggleBtn.textContent = body.classList.contains('dark') ? 'Light Mode' : 'Dark Mode';
        let nummode = body.classList.contains('dark') ? 1 : 0;
        setCookie('mode', nummode);
    });
    if (tmode == 1) {
        body.classList.add('dark');
        toggleBtn.textContent = 'Dark Mode';
    }

    // === Input and Feedback ===
    function updateInputWidth() {
        sizer.textContent = input.value || "?";
        input.style.width = sizer.offsetWidth + 10 + "px";
    }

    function addDigit(digit) {
        input.value += digit;
        updateInputWidth();
    }

    function clearInput() {
        input.value = '';
        feedback.textContent = '\u200B';
        mathExp.classList.remove('correct', 'incorrect', 'error');
        updateInputWidth();
    }

    function skipQuestion() {
        clearInput();
        showNewQuestion();
    }

    // === Oupput  ===
    function updateScoreDisplay() {
        scoreDisplay.textContent = `Score: ${totalScore}`;
    }

    // === Check answers ===
    function checkAnswer() {
        const answerStr = input.value.trim();
        const answer = parseInt(answerStr);

        mathExp.classList.remove('correct', 'incorrect', 'error');
        feedback.textContent = '\u200B';

        if (answerStr === '') {
            feedback.textContent = '⚠️ Please enter a number! \u200B';
            feedback.style.color = 'orange';
            mathExp.classList.add('error');
            return;
        }

        if (isNaN(answer)) {
            feedback.textContent = '⚠️ not the correct number! \u200B';
            feedback.style.color = 'orange';
            mathExp.classList.add('error');
            return;
        }

        if (answer === currentAnswer) {
            console.log("question: ", question.textContent, "\ncurrentAnswer: ", currentAnswer, "\nanswer: ", answer);
            totalScore += currentBaseScore;
            feedback.textContent = `✅ Correct! +${currentBaseScore} \u200B`;
            feedback.style.color = 'green';
            mathExp.classList.add('correct');
        } else {
            const diff = Math.abs(answer - currentAnswer);
            const partialScore = Math.max(0, currentBaseScore - diff);
            totalScore += partialScore;
            console.log("question: ", question.textContent, "\ncurrentAnswer: ", currentAnswer, "\nanswer: ", answer);
            feedback.textContent = `❌ Wrong! +${partialScore} \u200B`;
            feedback.style.color = 'red';
            mathExp.classList.add('incorrect');
        }

        setCookie('totalScore', totalScore);
        updateScoreDisplay();
        setTimeout(showNewQuestion, 1500);
    }

    // === Generate random math problems ===
    function generateMathQuestion() {
        const difficulties = ['easy', 'medium', 'hard'];
        const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

        let maxNum, baseScore;
        switch (difficulty) {
            case 'easy': maxNum = 20; baseScore = 10; break;
            case 'medium': maxNum = 50; baseScore = 20; break;
            case 'hard': maxNum = 100; baseScore = 30; break;
        }

        const operators = ['+', '-', '*', '/'];
        const operator = operators[Math.floor(Math.random() * operators.length)];

        let num1, num2;

        if (operator === '/') {
            num2 = Math.floor(Math.random() * (maxNum / 10)) + 1;
            const multiplier = Math.floor(Math.random() * 10) + 1;
            num1 = num2 * multiplier;
        } else {
            num1 = Math.floor(Math.random() * maxNum);
            num2 = Math.floor(Math.random() * maxNum);
        }

        const question = `${num1} ${operator} ${num2}`;
        let answer;

        switch (operator) {
            case '+': answer = num1 + num2; break;
            case '-': answer = num1 - num2; break;
            case '*': answer = num1 * num2; break;
            case '/': answer = num1 / num2; break;
        }

        return { question, answer, difficulty, baseScore };
    }

    // === Next question ===
    function showNewQuestion() {
        const q = generateMathQuestion();
        document.getElementById('question').textContent = q.question + " = ";
        currentAnswer = q.answer;
        currentBaseScore = q.baseScore;
        clearInput();
    }

    // === begin ===
    showNewQuestion();
    updateInputWidth();
    updateScoreDisplay();
    // === input by keybrond ===
    document.addEventListener('keydown', (e) => {
        const key = e.key;

        // Int
        if (/^\d$/.test(key)) {
            addDigit(key);
        }

        // - and +
        else if ((key === '-' || key === '+') && input.value.length === 0) {
            addDigit(key);
        }

        // Backspace for delete
        else if (key === 'Backspace') {
            input.value = input.value.slice(0, -1);
            updateInputWidth();
        }

        // Enter check answer
        else if (key === 'Enter') {
            checkAnswer();
        }

        // Spacebar skip
        else if (key === ' ') {
            e.preventDefault();  // กันไม่ให้ scroll ลง
            skipQuestion();
        }
    });

}