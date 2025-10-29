// public/js/manage.js
// Full-featured manager with proper edit layout and working Back navigation

function showManageSets() {
    // Standalone page: don't hide sections on this page

    let section = document.getElementById("manage");
    if (!section) {
        section = document.createElement("section");
        section.id = "manage";
        section.classList.add("glass");
        section.style.padding = "2em";
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

        const form = section.querySelector("#createSetForm");
        const termContainer = section.querySelector("#termContainer");
        const addTermBtn = section.querySelector("#addTermBtn");
        const listContainer = section.querySelector("#studySetsList");
        const backBtn = section.querySelector("#backHome");

        // === Add term rows ===
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

        addTermRow();

        addTermBtn.onclick = () => addTermRow();
        termContainer.addEventListener("click", e => {
            if (e.target.classList.contains("remove-term")) {
                e.target.closest(".term-row").remove();
            }
        });

        // Standalone page: actually navigate home
        backBtn.onclick = () => {
            window.location.href = "index.html";
        };

        // === Load sets list ===
        async function loadStudySets() {
            const res = await fetch("/api/studySets");
            const sets = await res.json();

            if (sets.length === 0) {
                listContainer.innerHTML = `<p style="opacity:0.6;">No study sets yet. Create one above.</p>`;
                return;
            }

            listContainer.innerHTML = sets.map(set => `
                <div class="study-set-card glass" style="padding:1em; margin-bottom:1em; cursor:pointer;" data-id="${set.id}">
                    <h4 style="margin:0;">${set.title}</h4>
                    <p style="opacity:0.7; margin-top:4px;">${set.description}</p>
                </div>
            `).join("");
        }

        // === Create set ===
        form.onsubmit = async e => {
            e.preventDefault();
            const title = form.title.value.trim();
            const description = form.description.value.trim();
            const termElems = termContainer.querySelectorAll(".term-row");
            const cards = [...termElems].map(div => ({
                front: div.querySelector(".term-front").value.trim(),
                back: div.querySelector(".term-back").value.trim()
            })).filter(c => c.front && c.back);

            if (!title || cards.length === 0) {
                alert("Please provide a title and at least one term.");
                return;
            }

            const res = await fetch("/api/studySets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, cards })
            });

            if (res.ok) {
                form.reset();
                termContainer.innerHTML = "";
                addTermRow();
                loadStudySets();
            } else {
                alert("Error creating study set.");
            }
        };

        // === Click to open editor ===
        listContainer.onclick = e => {
            const card = e.target.closest(".study-set-card");
            if (!card) return;
            openEditPage(card.dataset.id);
        };

        loadStudySets();
    }

    /* ---------------- EDIT VIEW ---------------- */
    async function openEditPage(id) {
        const res = await fetch("/api/studySets");
        const sets = await res.json();
        const set = sets.find(s => s.id === id);
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
                    <p contenteditable="true" id="editDesc" class="editable-desc" style="opacity:0.9; margin:0;">
                        ${set.description}
                    </p>
                    <span class="edit-icon" title="Edit description">✏️</span>
                </div>

                <hr style="margin:1em 0; border-color:rgba(255,255,255,0.1);">
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

        // Populate terms
        set.cards.forEach(c => addEditTerm(c.front, c.back));
        document.getElementById("addEditTerm").onclick = () => addEditTerm();

        // Remove term
        editTerms.onclick = e => {
            if (e.target.classList.contains("remove-term")) {
                e.target.closest(".term-row").remove();
            }
        };

        // Save
        document.getElementById("saveSet").onclick = async () => {
            const title = document.getElementById("editTitle").textContent.trim();
            const description = document.getElementById("editDesc").textContent.trim();
            const termElems = editTerms.querySelectorAll(".term-row");

            const cards = [...termElems].map(div => ({
                front: div.querySelector(".term-front").value.trim(),
                back: div.querySelector(".term-back").value.trim()
            })).filter(c => c.front && c.back);

            await fetch(`/api/studySets/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, cards })
            });
            alert("Study set saved!");
            renderManageView();
        };

        // Delete
        document.getElementById("deleteSet").onclick = async () => {
            if (confirm("Delete this study set?")) {
                await fetch(`/api/studySets/${id}`, { method: "DELETE" });
                renderManageView();
            }
        };

        // Back button
        document.getElementById("backToManage").onclick = () => renderManageView();
    }
}

// IMPORTANT: fire on page load (listener OUTSIDE the function)
document.addEventListener("DOMContentLoaded", showManageSets);
