// public/js/manage.js
// Full-featured manager with proper edit layout and working Back navigation

function showManageSets() {
    /* --- make sure the <section> exists --- */
    let section = document.getElementById('manage');
    if (!section) {
        section = document.createElement('section');
        section.id = 'manage';
        section.classList.add('glass');
        section.style.padding = '2em';
        document.body.appendChild(section);
    }

    renderManageView();

    /* ---------------- MAIN MANAGE VIEW ---------------- */
    async function renderManageView() {
        section.innerHTML = `
            <h2 style="margin-bottom:1em; text-align:center;">Manage Study Sets</h2>

            <div id="manageGrid" style="display:flex; flex-wrap:wrap; gap:2em;">
                <!-- LEFT: Create New Set -->
                <div id="createColumn" style="flex:1 1 350px; min-width:320px;">
                    <form id="createSetForm" class="glass" style="padding:1.5em;">
                        <h3>Create New Set</h3>
                        <input class="input glass" type="text" name="title" placeholder="Set Title" required>
                        <input class="input glass" type="text" name="description" placeholder="Description" required>

                        <div id="termContainer"></div>
                        <button type="button" id="addTermBtn" class="btn small" style="margin-top:6px;">Add Term</button>
                        <button type="submit" class="btn primary" style="margin-top:10px;">Create Study Set</button>
                    </form>
                </div>

                <!-- RIGHT: List existing -->
                <div id="listColumn" style="flex:2 1 600px; min-width:400px;">
                    <h3>Select Study Set to Edit/Delete</h3>
                    <div id="studySetsList"></div>
                </div>
            </div>

            <div style="margin-top:30px;">
                <button id="backHome" class="btn">Back Home</button>
            </div>
        `;

        const form         = section.querySelector("#createSetForm");
        const termContainer = section.querySelector("#termContainer");
        const addTermBtn    = section.querySelector("#addTermBtn");
        const listContainer = section.querySelector("#studySetsList");
        const backBtn       = section.querySelector("#backHome");

        /* ---- Add term rows ---- */
        function addTermRow(front = "", back = "") {
            const div = document.createElement("div");
            div.classList.add("term-row");
            div.style.marginBottom = "10px";
            div.innerHTML = `
                <input class="input glass term-front" placeholder="Front (Term)" value="${front}">
                <textarea class="input glass term-back" placeholder="Back (Formula)">${back}</textarea>
                <button type="button" class="btn small danger remove-term">Remove</button>
            `;
            termContainer.appendChild(div);
        }

        addTermRow();          // one empty row
        addTermBtn.onclick = () => addTermRow();

        termContainer.addEventListener("click", e => {
            if (e.target.classList.contains("remove-term")) {
                e.target.closest(".term-row").remove();
            }
        });

        /* ---- Back button: full page navigation ---- */
        backBtn.onclick = () => {
            window.location.href = "index.html";
        };

        /* ---- Load existing sets ---- */
        async function loadStudySets() {
            const res = await fetch("/api/studySets");
            const sets = await res.json();

            if (sets.length === 0) {
                listContainer.innerHTML = `<p style="opacity:.6;">No study sets yet. Create one above.</p>`;
                return;
            }

            listContainer.innerHTML = sets.map(set => `
                <div class="study-set-card glass" style="padding:1em; margin-bottom:1em; cursor:pointer;" data-id="${set.id}">
                    <div style="display:flex; justify-content:space-between; gap:1rem; align-items:start;">
                        <div class="set-main" style="flex:1 1 auto;">
                            <h4 style="margin:0;">${set.title}</h4>
                            <p style="opacity:.7; margin-top:4px;">${set.description}</p>
                        </div>
                        <div class="set-actions" style="display:flex; gap:.5rem; flex-wrap:wrap;">
                            <button type="button" class="btn small set-active" data-id="${set.id}">Set Active</button>
                            <button type="button" class="btn small secondary play-set" data-id="${set.id}">Play</button>
                        </div>
                    </div>
                </div>
            `).join("");

            /* Card body opens editor */
            listContainer.querySelectorAll('.study-set-card .set-main').forEach(el => {
                el.addEventListener('click', (e) => {
                    const card = e.currentTarget.closest('.study-set-card');
                    openEditPage(card.dataset.id);
                });
            });

            /* Set active */
            listContainer.querySelectorAll('.set-active').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    localStorage.setItem('selectedSetId', id);
                    alert('Active set updated.');
                });
            });

            /* Play */
            listContainer.querySelectorAll('.play-set').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const id = btn.getAttribute('data-id');
                    localStorage.setItem('selectedSetId', id);
                    window.location.href = 'flashcards.html';
                });
            });
        }

        loadStudySets();   // run once on page load

        /* ---- Handle create form ---- */
        form.addEventListener('submit', async e => {
            e.preventDefault();

            const title       = form.title.value.trim();
            const description = form.description.value.trim();
            const termRows    = [...form.querySelectorAll('.term-row')];

            const cards = termRows.map(row => ({
                front : row.querySelector('.term-front').value.trim(),
                back  : row.querySelector('.term-back').value.trim()
            })).filter(c => c.front && c.back);

            if (!title || !description || !cards.length) {
                alert('Please fill out all terms and both header fields.');
                return;
            }

            try {
                await fetch("/api/studySets", {
                    method : "POST",
                    headers: { "Content-Type": "application/json" },
                    body   : JSON.stringify({ title, description, cards })
                });
                alert("Study set created!");
                form.reset();
                termContainer.innerHTML = "";      // clear terms
                addTermRow();                      // add blank row again
                loadStudySets();                   // refresh list
            } catch (err) {
                alert("Failed to create study set.");
            }
        });
    }

    /* ---------------- EDIT VIEW ---------------- */
    async function openEditPage(id) {
        const res = await fetch("/api/studySets");
        const sets = await res.json();
        const set  = sets.find(s => s.id === id);
        if (!set) return alert("Study set not found.");

        section.innerHTML = `
            <div class="glass" style="padding:1.5em;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <h2 contenteditable="true" id="editTitle" class="editable-title" style="font-weight:700; margin:0;">
                        ${set.title}
                    </h2>
                    <span class="edit-icon" title="Edit title">✏️</span>
                </div>

                <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
                    <p contenteditable="true" id="editDesc" class="editable-desc" style="opacity:.9; margin:0;">
                        ${set.description}
                    </p>
                    <span class="edit-icon" title="Edit description">✏️</span>
                </div>

                <hr style="margin:1em 0; border-color:rgba(255,255,255,.1);">
                <div id="editTerms"></div>
                <button type="button" id="addEditTerm" class="btn small" style="margin-top:10px;">Add Term</button>

                <div style="margin-top:20px;">
                    <button id="saveSet" class="btn primary">Save Changes</button>
                    <button id="deleteSet" class="btn danger">Delete Set</button>
                    <button id="backToManage" class="btn">Back to Manage</button>
                </div>
            </div>
        `;

        const editTerms = document.getElementById("editTerms");

        function addEditTerm(front = "", back = "") {
            const div = document.createElement("div");
            div.classList.add("term-row");
            div.style.marginBottom = "10px";
            div.innerHTML = `
                <input class="input glass term-front" value="${front}" placeholder="Term">
                <textarea class="input glass term-back" placeholder="Formula">${back}</textarea>
                <button type="button" class="btn small danger remove-term">Remove</button>
            `;
            editTerms.appendChild(div);
        }

        /* Populate terms */
        set.cards.forEach(c => addEditTerm(c.front, c.back));
        document.getElementById("addEditTerm").onclick = () => addEditTerm();

        editTerms.addEventListener("click", e => {
            if (e.target.classList.contains("remove-term")) {
                e.target.closest(".term-row").remove();
            }
        });

        /* Save */
        document.getElementById("saveSet").onclick = async () => {
            const title       = document.getElementById("editTitle").textContent.trim();
            const description = document.getElementById("editDesc").textContent.trim();
            const termElems   = editTerms.querySelectorAll(".term-row");

            const cards = [...termElems]
                .map(div => ({
                    front : div.querySelector(".term-front").value.trim(),
                    back  : div.querySelector(".term-back").value.trim()
                }))
                .filter(c => c.front && c.back);

            if (!cards.length) {
                alert("At least one term is required.");
                return;
            }

            await fetch(`/api/studySets/${id}`, {
                method : "PUT",
                headers: { "Content-Type": "application/json" },
                body   : JSON.stringify({ title, description, cards })
            });
            alert("Study set saved!");
            renderManageView();
        };

        /* Delete */
        document.getElementById("deleteSet").onclick = async () => {
            if (confirm("Delete this study set?")) {
                await fetch(`/api/studySets/${id}`, { method: "DELETE" });
                renderManageView();
            }
        };

        /* Back button */
        document.getElementById("backToManage").onclick = () => renderManageView();
    }
}

/* ---------- router helpers ---------- */
const routes = { home: '#home', flip: '#game', identify: '#identify', order: '#order' };
function show(screen) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.querySelector(screen).classList.remove('hidden');
}

/* ---------- Active-set helpers ---------- */
function getSelectedSetId() {
    return localStorage.getItem('selectedSetId');
}
function setSelectedSetId(idOrNull) {
    if (idOrNull) localStorage.setItem('selectedSetId', idOrNull);
    else localStorage.removeItem('selectedSetId');
}

/* ---------- Build & wire the Home-page picker ---------- */
async function initSetPicker() {
    const box = document.getElementById('activeSetBox');
    if (!box) return;

    const select = document.getElementById('setPicker');
    const hint   = document.getElementById('activeSetHint');
    const useBtn = document.getElementById('activateSetBtn');
    const clrBtn = document.getElementById('clearSetBtn');

    const sets = await listStudySets();
    select.innerHTML = '<option value="">— Select a set —</option>' +
        sets.map(s => `<option value="${s.id}">${s.title}</option>`).join('');

    const current = getSelectedSetId();
    if (current) {
        select.value = current;
        const cur = sets.find(s => s.id === current);
        hint.textContent = cur ? `Active: ${cur.title}` : `Active set selected`;
    } else {
        hint.textContent = 'No active set (using sample deck by default).';
    }

    useBtn.onclick = () => {
        const id = select.value;
        if (id) {
            setSelectedSetId(id);
            const cur = sets.find(s => s.id === id);
            hint.textContent = `Active: ${cur ? cur.title : id}`;
            alert('Active set updated. Open a game to use it.');
        }
    };

    clrBtn.onclick = () => {
        setSelectedSetId(null);
        select.value = '';
        hint.textContent = 'No active set (using sample deck by default).';
    };
}

/* ---------- Load data / fallback ---------- */
async function loadData() {
    const flashcardResponse = await fetch('flashcard.json');
    let deck = await flashcardResponse.json();

    const orderResponse = await fetch('orderquestion.json');
    const orderQsDefault = await orderResponse.json();

    const identifyResponse = await fetch('formulaidentify.json');
    const identifyQsDefault = await identifyResponse.json();

    try {
        const id = getSelectedSetId();
        if (id) {
            const res  = await fetch('/api/studySets');
            const sets = await res.json();
            const s    = sets.find(x => x.id === id);
            if (s && Array.isArray(s.cards) && s.cards.length) {
                deck = s.cards;
            }
        }
    } catch (e) {
        console.warn('Active set override failed; using default deck', e);
    }

    return { deck, orderQsDefault, identifyQsDefault };
}

/* ---------- Initialize the app ---------- */
async function init() {
    const { deck, orderQs, identifyQs } = await loadData();

    /* ---- HOME binding ---- */
    document.querySelectorAll('[data-route]').forEach(card => {
        card.addEventListener('click', async () => {
            const route = card.dataset.route;
            if (route === 'flip') {
                const { deck: currentDeck } = await loadData();
                initFlashGame(currentDeck);
            }
            if (route === 'identify') showIdentifyStart();
            if (route === 'order') showOrderStart();
            if (route === 'manage') {
                window.location.href = 'manage.html';
                return;
            }
        });
    });

    /* ---- FLASH GAME ---- */
    function initFlashGame(deck) {
        show(routes.flip);
        let flashIdx = 0;

        function renderFlash() {
            const card = deck[flashIdx];
            document.getElementById('flashFront').innerHTML =
                `<div style="font-size:1.35rem;font-weight:600;">${card.front}</div>`;
            document.getElementById('flashBack').innerHTML =
                `<div style="font-size:0.95rem;line-height:1.4;">${card.back}</div>`;
            document.getElementById('gameCounter').textContent = `Card ${flashIdx + 1} / ${deck.length}`;
            document.getElementById('progressBar').style.width = ((flashIdx + 1) / deck.length * 100) + '%';
            setTimeout(() => window.MathJax.typeset(), 0);
        }

        document.getElementById('btnNext').onclick = () => {
            flashIdx = (flashIdx + 1) % deck.length; renderFlash();
        };
        document.getElementById('btnPrev').onclick = () => {
            flashIdx = (flashIdx - 1 + deck.length) % deck.length; renderFlash();
        };
        document.getElementById('btnFlip').onclick = () => document.getElementById('flashCard').classList.toggle('flipped');
        document.getElementById('btnShuffle').onclick = () => {
            for (let i = deck.length - 1; i > 0; i--) {
                const j = ~~(Math.random() * (i + 1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
            flashIdx = 0; renderFlash();
        };
        document.getElementById('btnHome').onclick = () => show(routes.home);
        document.getElementById('flashCard').onclick = () => document.getElementById('flashCard').classList.toggle('flipped');

        renderFlash();
    }

    function sample(arr, k) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a.slice(0, k);
    }

    function buildIdentifyQuestionsFromDeck(deck, count = 5, choices = 4) {
        if (!Array.isArray(deck) || deck.length < choices) return [];
        const picked = sample(deck, Math.min(count, deck.length));
        return picked.map(card => {
            const distractors = sample(deck.filter(c => c !== card), choices - 1).map(c => c.back);
            const answers = sample([card.back, ...distractors], choices);
            const correctIdx = answers.indexOf(card.back);
            return { prompt: card.front, choices: answers, correct: correctIdx };
        });
    }

    /* ---------- IDENTIFY mode ---------- */
    let identifyDifficulty = null;
    let identifyScore = 0;
    let identifyRound = 1;
    let identifyQuestions = [];
    let currentIdentifyQuestionIndex = 0;

    function showIdentifyStart() {
        (async () => {
            const { deck } = await loadData();
            identifyDifficulty = null;
            identifyScore = 0;
            identifyRound = 1;

            identifyQuestions = buildIdentifyQuestionsFromDeck(deck, 5, 4);
            if (!identifyQuestions.length) {
                alert('Not enough cards in the active set to build Identify questions.');
                show(routes.home);
                return;
            }

            show(routes.identify);
            document.getElementById('identifyStartScreen').classList.add('hidden');
            document.getElementById('identifyGameScreen').classList.remove('hidden');
            currentIdentifyQuestionIndex = 0;
            identifyScore = 0;
            displayIdentifyQuestion();
        })();
    }

    function startIdentifyGame() {
        identifyScore = 0;
        identifyRound = 1;
        identifyQuestions = [...identifyQs[identifyDifficulty]];
        shuffleArray(identifyQuestions);
        identifyQuestions = identifyQuestions.slice(0, 5);
        currentIdentifyQuestionIndex = 0;

        show(routes.identify);
        document.getElementById('identifyStartScreen').classList.add('hidden');
        document.getElementById('identifyGameScreen').classList.remove('hidden');
        displayIdentifyQuestion();
    }

    function displayIdentifyQuestion() {
        if (currentIdentifyQuestionIndex >= identifyQuestions.length) {
            if (identifyScore === identifyQuestions.length) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                alert(`Perfect round! You got all ${identifyQuestions.length} correct!`);
            } else {
                alert(`Round completed! Score: ${identifyScore}/${identifyQuestions.length}`);
            }
            startIdentifyGame();
            return;
        }

        const q = identifyQuestions[currentIdentifyQuestionIndex];
        document.getElementById('identifyScore').textContent   = `Score: ${identifyScore}/${identifyQuestions.length}`;
        document.getElementById('identifyRound').textContent  = `Question: ${currentIdentifyQuestionIndex + 1}/${identifyQuestions.length}`;
        document.getElementById('identifyQuestion').innerHTML = `<div>${q.prompt}</div>`;

        const box = document.getElementById('identifyChoices');
        box.innerHTML = '';

        const shuffled = [...q.choices].sort(() => Math.random() - .5);
        shuffled.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = 'choice';
            btn.textContent = choice;
            btn.onclick = function() {
                if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;
                btn.classList.add(choice === q.choices[q.correct] ? 'correct' : 'wrong');
                if (choice === q.choices[q.correct]) identifyScore++;
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
        document.querySelectorAll('#order .difficulty-btn').forEach(btn => btn.classList.remove('selected'));
        document.getElementById('orderPlay').style.display = 'none';

        document.querySelectorAll('#order .difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                orderDifficulty = btn.dataset.level;
                document.querySelectorAll('#order .difficulty-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                document.getElementById('orderPlay').style.display = 'inline-flex';
            });
        });

        document.getElementById('orderPlay').addEventListener('click', startOrderGame);
        document.getElementById('orderBack').addEventListener('click', () => show(routes.home));
    }

    function startOrderGame() {
        orderScore = 0;
        orderRound = 1;
        orderQuestions = [...orderQs[orderDifficulty]];
        shuffleArray(orderQuestions);
        orderQuestions = orderQuestions.slice(0, 5);
        currentOrderQuestionIndex = 0;

        show(routes.order);
        document.getElementById('orderStartScreen').classList.add('hidden');
        document.getElementById('orderGameScreen').classList.remove('hidden');
        displayOrderQuestion();
    }

    function displayOrderQuestion() {
        if (currentOrderQuestionIndex >= orderQuestions.length) {
            if (orderScore === orderQuestions.length) {
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                alert(`Perfect round! You got all ${orderQuestions.length} correct!`);
            } else {
                alert(`Round completed! Score: ${orderScore}/${orderQuestions.length}`);
            }
            startOrderGame();
            return;
        }

        const q = orderQuestions[currentOrderQuestionIndex];
        document.getElementById('orderScore').textContent  = `Score: ${orderScore}/${orderQuestions.length}`;
        document.getElementById('orderRound').textContent = `Question: ${currentOrderQuestionIndex + 1}/${orderQuestions.length}`;
        document.getElementById('orderScenario').innerHTML = `<div>${q.scenario}</div>`;

        const list = document.getElementById('orderSteps');
        list.innerHTML = '';
        document.getElementById('orderMsg').textContent = '';

        const shuffledSteps = [...q.steps].sort(() => Math.random() - .5);
        shuffledSteps.forEach((s, i) => {
            const li = document.createElement('li');
            li.className = 'step';
            li.textContent = s;
            li.draggable = true;
            li.setAttribute('data-index', i);
            list.appendChild(li);
        });

        /* drag & drop */
        list.querySelectorAll('.step').forEach(step => {
            step.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', step.getAttribute('data-index'));
                step.classList.add('dragging');
            });
            step.addEventListener('dragend', () => step.classList.remove('dragging'));
            step.addEventListener('dragover', e => e.preventDefault());
            step.addEventListener('drop', e => {
                e.preventDefault();
                const dragIndex = e.dataTransfer.getData('text/plain');
                const dragElement = list.querySelector(`[data-index="${dragIndex}"]`);
                const targetElement = e.currentTarget;
                if (dragElement !== targetElement) {
                    const after = (e.clientY - targetElement.getBoundingClientRect().top) / targetElement.getBoundingClientRect().height < .5;
                    targetElement.parentNode.insertBefore(dragElement, after ? targetElement.nextSibling : targetElement);
                    [...list.children].forEach((s, idx) => s.setAttribute('data-index', idx));
                }
            });
        });

        setTimeout(() => window.MathJax.typeset(), 0);
    }

    /* ---- Check order button ---- */
    document.getElementById('orderCheck').addEventListener('click', () => {
        const list = document.getElementById('orderSteps');
        const actualOrder = [...list.children].map(li => li.textContent);
        const currentQ = orderQuestions[currentOrderQuestionIndex];
        let isCorrect = true;
        for (let i = 0; i < actualOrder.length; i++) {
            if (actualOrder[i] !== currentQ.steps[currentQ.correct[i]]) {
                isCorrect = false; break;
            }
        }
        document.getElementById('orderMsg').textContent = isCorrect ? '✅ Correct!' : '❌ Try again next time';
        document.getElementById('orderMsg').style.color = isCorrect ? '#22c55e' : '#ef4444';
        setTimeout(() => {
            currentOrderQuestionIndex++;
            displayOrderQuestion();
        }, 1500);
    });

    /* ---------- Utility functions ---------- */
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    /* INIT */
    show(routes.home);

    await initSetPicker();
}

/* ---------- Event: DOM ready ---------- */
document.addEventListener('DOMContentLoaded', showManageSets);