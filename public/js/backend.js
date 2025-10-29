/* ---------- router helpers ---------- */
const routes = {home: '#home', flip:'#game', identify:'#identify', order:'#order'};
function show(screen){
    document.querySelectorAll('section').forEach(s=>s.classList.add('hidden'));
    document.querySelector(screen).classList.remove('hidden');
}

/* ---------- Load data from JSON files ---------- */
async function loadData() {
    const flashcardResponse = await fetch('flashcard.json');
    const deck = await flashcardResponse.json();
    
    const orderResponse = await fetch('orderquestion.json');
    const orderQs = await orderResponse.json();
    
    const identifyResponse = await fetch('formulaidentify.json');
    const identifyQs = await identifyResponse.json();
    
    return { deck, orderQs, identifyQs };
}

/* ---------- Initialize the app ---------- */
async function init() {
    const { deck, orderQs, identifyQs } = await loadData();
    
    /* ---------- HOME binding ---------- */
    document.querySelectorAll('[data-route]').forEach(card=>{
        card.addEventListener('click', async ()=>{
            const route=card.dataset.route;
            if(route==='flip') initFlashGame(deck);
            if(route==='identify') showIdentifyStart();
            if(route==='order') showOrderStart();
            if (route === 'manage') {
                // Dynamically import manage.js only when needed
                const { showManageSets } = await import('./manage.js');
                showManageSets();
            }
        });
    });
    
    /* ---------- FLASH GAME ---------- */
    function initFlashGame(deck) {
        show(routes.flip);
        let flashIdx=0;
        
        function renderFlash(){
            const card = deck[flashIdx];
            document.getElementById('flashFront').innerHTML = `<div style="font-size:1.35rem;font-weight:600;">${card.front}</div>`;
            document.getElementById('flashBack').innerHTML = `<div style="font-size:0.95rem;line-height:1.4;">${card.back}</div>`;
            document.getElementById('gameCounter').textContent = `Card ${flashIdx+1} / ${deck.length}`;
            document.getElementById('progressBar').style.width = ((flashIdx+1)/deck.length*100)+'%';
            setTimeout(()=>window.MathJax.typeset(),0);
        }
        
        document.getElementById('btnNext').onclick = () => {flashIdx = (flashIdx+1)%deck.length; renderFlash();};
        document.getElementById('btnPrev').onclick = () => {flashIdx=(flashIdx-1+deck.length)%deck.length; renderFlash();};
        document.getElementById('btnFlip').onclick = () => document.getElementById('flashCard').classList.toggle('flipped');
        document.getElementById('btnShuffle').onclick = () => {
            for(let i=deck.length-1;i>0;i--){const j=~~(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
            flashIdx=0;renderFlash();
        };
        document.getElementById('btnHome').onclick = () => show(routes.home);
        document.getElementById('flashCard').onclick = () => document.getElementById('flashCard').classList.toggle('flipped');
        
        renderFlash();
    }
    
    /* ---------- IDENTIFY mode ---------- */
    let identifyDifficulty = null;
    let identifyScore = 0;
    let identifyRound = 1;
    let identifyQuestions = [];
    let currentIdentifyQuestionIndex = 0;
    
    function showIdentifyStart() {
        show(routes.identify);
        document.getElementById('identifyStartScreen').classList.remove('hidden');
        document.getElementById('identifyGameScreen').classList.add('hidden');
        
        // Reset difficulty buttons
        document.querySelectorAll('#identify .difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('identifyPlay').style.display = 'none';
        
        // Difficulty button listeners
        document.querySelectorAll('#identify .difficulty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                identifyDifficulty = this.dataset.level;
                document.querySelectorAll('#identify .difficulty-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('identifyPlay').style.display = 'inline-flex';
            });
        });
        
        // Play button listener
        document.getElementById('identifyPlay').addEventListener('click', startIdentifyGame);
        
        // Back button listener
        document.getElementById('identifyBack').addEventListener('click', () => show(routes.home));
    }
    
    function startIdentifyGame() {
        identifyScore = 0;
        identifyRound = 1;
        identifyQuestions = [...identifyQs[identifyDifficulty]];
        shuffleArray(identifyQuestions);
        identifyQuestions = identifyQuestions.slice(0, 5); // Take 5 questions
        currentIdentifyQuestionIndex = 0;
        
        document.getElementById('identifyStartScreen').classList.add('hidden');
        document.getElementById('identifyGameScreen').classList.remove('hidden');
        
        displayIdentifyQuestion();
    }
    
    function displayIdentifyQuestion() {
        if (currentIdentifyQuestionIndex >= identifyQuestions.length) {
            // Round completed
            if (identifyScore === identifyQuestions.length) {
                // Perfect score - show confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                setTimeout(() => {
                    alert(`Perfect round! You got all ${identifyQuestions.length} correct!`);
                    startIdentifyGame(); // Start new round
                }, 1000);
            } else {
                alert(`Round completed! Score: ${identifyScore}/${identifyQuestions.length}`);
                startIdentifyGame(); // Start new round
            }
            return;
        }
        
        const q = identifyQuestions[currentIdentifyQuestionIndex];
        document.getElementById('identifyScore').textContent = `Score: ${identifyScore}/${identifyQuestions.length}`;
        document.getElementById('identifyRound').textContent = `Question: ${currentIdentifyQuestionIndex + 1}/${identifyQuestions.length}`;
        document.getElementById('identifyQuestion').innerHTML = `<div>${q.prompt}</div>`;
        
        const box = document.getElementById('identifyChoices');
        box.innerHTML = '';
        
        // Shuffle choices
        const shuffledChoices = [...q.choices];
        shuffleArray(shuffledChoices);
        
        shuffledChoices.forEach((choiceText, i) => {
            const choiceIndex = q.choices.indexOf(choiceText);
            const btn = document.createElement('button');
            btn.className = 'choice';
            btn.innerHTML = choiceText;
            btn.onclick = function() {
                if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;
                
                const correct = choiceIndex === q.correct;
                btn.className = correct ? 'choice correct' : 'choice wrong';
                
                if (correct) identifyScore++;
                
                setTimeout(() => {
                    currentIdentifyQuestionIndex++;
                    displayIdentifyQuestion();
                }, 1200);
            };
            box.appendChild(btn);
        });
        
        setTimeout(() => window.MathJax.typeset(), 0);
    }
    
    /* ---------- ORDER mode ---------- */
    let orderDifficulty = null;
    let orderScore = 0;
    let orderRound = 1;
    let orderQuestions = [];
    let currentOrderQuestionIndex = 0;
    
    function showOrderStart() {
        show(routes.order);
        document.getElementById('orderStartScreen').classList.remove('hidden');
        document.getElementById('orderGameScreen').classList.add('hidden');
        
        // Reset difficulty buttons
        document.querySelectorAll('#order .difficulty-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.getElementById('orderPlay').style.display = 'none';
        
        // Difficulty button listeners
        document.querySelectorAll('#order .difficulty-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                orderDifficulty = this.dataset.level;
                document.querySelectorAll('#order .difficulty-btn').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                document.getElementById('orderPlay').style.display = 'inline-flex';
            });
        });
        
        // Play button listener
        document.getElementById('orderPlay').addEventListener('click', startOrderGame);
        
        // Back button listener
        document.getElementById('orderBack').addEventListener('click', () => show(routes.home));
    }
    
    function startOrderGame() {
        orderScore = 0;
        orderRound = 1;
        orderQuestions = [...orderQs[orderDifficulty]];
        shuffleArray(orderQuestions);
        orderQuestions = orderQuestions.slice(0, 5); // Take 5 questions
        currentOrderQuestionIndex = 0;
        
        document.getElementById('orderStartScreen').classList.add('hidden');
        document.getElementById('orderGameScreen').classList.remove('hidden');
        
        displayOrderQuestion();
    }
    
    function displayOrderQuestion() {
        if (currentOrderQuestionIndex >= orderQuestions.length) {
            // Round completed
            if (orderScore === orderQuestions.length) {
                // Perfect score - show confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 }
                });
                setTimeout(() => {
                    alert(`Perfect round! You got all ${orderQuestions.length} correct!`);
                    startOrderGame(); // Start new round
                }, 1000);
            } else {
                alert(`Round completed! Score: ${orderScore}/${orderQuestions.length}`);
                startOrderGame(); // Start new round
            }
            return;
        }
        
        const q = orderQuestions[currentOrderQuestionIndex];
        document.getElementById('orderScore').textContent = `Score: ${orderScore}/${orderQuestions.length}`;
        document.getElementById('orderRound').textContent = `Question: ${currentOrderQuestionIndex + 1}/${orderQuestions.length}`;
        document.getElementById('orderScenario').innerHTML = `<div>${q.scenario}</div>`;
        
        const list = document.getElementById('orderSteps');
        list.innerHTML = '';
        document.getElementById('orderMsg').textContent = '';
        
        const shuffledSteps = [...q.steps];
        shuffleArray(shuffledSteps);
        
        shuffledSteps.forEach((s, i) => {
            const li = document.createElement('li');
            li.className = 'step';
            li.textContent = s;
            li.draggable = true;
            li.setAttribute('data-index', i);
            list.appendChild(li);
        });
        
        // Add drag and drop functionality
        list.querySelectorAll('.step').forEach((step) => {
            step.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', step.getAttribute('data-index'));
                step.classList.add('dragging');
            });
            
            step.addEventListener('dragend', () => {
                step.classList.remove('dragging');
            });
            
            step.addEventListener('dragover', e => {
                e.preventDefault();
            });
            
            step.addEventListener('drop', e => {
                e.preventDefault();
                const dragIndex = e.dataTransfer.getData('text/plain');
                const dragElement = list.querySelector(`[data-index="${dragIndex}"]`);
                const targetElement = e.currentTarget;
                
                if (dragElement !== targetElement) {
                    const rect = targetElement.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.height / 2) < 1;
                    
                    if (next && targetElement.parentNode) {
                        targetElement.parentNode.insertBefore(dragElement, targetElement);
                    } else if (targetElement.parentNode) {
                        targetElement.parentNode.insertBefore(dragElement, targetElement.nextSibling);
                    }
                    
                    // Update indices
                    list.querySelectorAll('.step').forEach((s, idx) => {
                        s.setAttribute('data-index', idx);
                    });
                }
            });
        });
        
        setTimeout(() => window.MathJax.typeset(), 0);
    }
    
    // Check order button
    document.getElementById('orderCheck').addEventListener('click', () => {
        const list = document.getElementById('orderSteps');
        const actualOrder = [...list.children].map(li => li.textContent);
        const currentQ = orderQuestions[currentOrderQuestionIndex];
        
        let isCorrect = true;
        for (let i = 0; i < actualOrder.length; i++) {
            if (actualOrder[i] !== currentQ.steps[currentQ.correct[i]]) {
                isCorrect = false;
                break;
            }
        }
        
        if (isCorrect) {
            document.getElementById('orderMsg').textContent = '✅ Correct!';
            document.getElementById('orderMsg').style.color = '#22c55e';
            orderScore++;
        } else {
            document.getElementById('orderMsg').textContent = '❌ Try again next time';
            document.getElementById('orderMsg').style.color = '#ef4444';
        }
        
        // Move to next question after a short delay
        setTimeout(() => {
            currentOrderQuestionIndex++;
            displayOrderQuestion();
        }, 1500);
    });
    
    /* ---------- Utility functions ---------- */
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    /* INIT */
    show(routes.home);
}

// Start the app
init();