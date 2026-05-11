document.addEventListener("DOMContentLoaded", function () {
    const notesContainer = document.getElementById("notesContainer");
    const addNoteBtn = document.getElementById("addNoteBtn");
    const importNotesBtn = document.getElementById("importNotesBtn");
    const exportNotesBtn = document.getElementById("exportNotesBtn");
    const importNotesInput = document.getElementById("importNotesInput");
    const addNoteModal = document.getElementById("addNoteModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const noteForm = document.getElementById("noteForm");
    const modalTitle = document.getElementById("modalTitle");
    const submitNoteBtn = document.getElementById("submitNoteBtn");
    const noteTitleInput = document.getElementById("noteTitle");
    const noteContentInput = document.getElementById("noteContent");
    const searchInput = document.getElementById("searchInput");
    const filterSelect = document.getElementById("filterSelect");
    const emptyState = document.getElementById("emptyState");
    const emptyStateTitle = emptyState.querySelector("h3");
    const emptyStateText = emptyState.querySelector("p");
    const confirmModal = document.getElementById("confirmModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    let notes = loadNotes();
    let noteToDeleteId = null;
    let noteToEditId = null;

    renderNotes();
    updateEmptyState();

    addNoteBtn.addEventListener("click", openAddNoteModal);
    importNotesBtn.addEventListener("click", () => importNotesInput.click());
    exportNotesBtn.addEventListener("click", exportNotes);
    importNotesInput.addEventListener("change", handleImportNotes);
    closeModalBtn.addEventListener("click", closeAddNoteModal);
    noteForm.addEventListener("submit", handleNoteSubmit);
    searchInput.addEventListener("input", filterNotes);
    filterSelect.addEventListener("change", filterNotes);
    cancelDeleteBtn.addEventListener("click", closeConfirmModal);
    confirmDeleteBtn.addEventListener("click", confirmDeleteNote);
    addNoteModal.addEventListener("click", handleModalOverlayClick);
    confirmModal.addEventListener("click", handleConfirmOverlayClick);
    document.addEventListener("keydown", handleDocumentKeydown);

    function createNoteId() {
        if (window.crypto && typeof window.crypto.randomUUID === "function") {
            return window.crypto.randomUUID();
        }

        return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function normalizeNote(note) {
        return {
            id: note.id || createNoteId(),
            title: note.title || "",
            content: note.content || "",
            tag: note.tag || "ideas",
            date: note.date || new Date().toISOString(),
            updatedAt: note.updatedAt || note.date || new Date().toISOString(),
        };
    }

    function loadNotes() {
        try {
            const storedNotes = JSON.parse(localStorage.getItem("notes"));
            if (!Array.isArray(storedNotes)) {
                return [];
            }

            return storedNotes.map(normalizeNote);
        } catch (error) {
            return [];
        }
    }

    function renderNotes(notesToRender = notes) {
        notesContainer.innerHTML = "";

        notesToRender.forEach((note, index) => {
            const noteElement = document.createElement("div");
            noteElement.className = "note-card fade-in";
            noteElement.innerHTML = `
                <div class="note-content">
                    <div class="note-header">
                        <div class="note-title-wrap">
                            <span class="note-number">#${index + 1}</span>
                            <h3 class="note-title">${note.title}</h3>
                        </div>
                        <div class="note-actions">
                            <button class="edit-btn" data-id="${note.id}" aria-label="Edit note">
                                <i class="fas fa-pen"></i>
                            </button>
                            <button class="delete-btn" data-id="${note.id}" aria-label="Delete note">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <p class="note-text">${note.content}</p>
                    <div class="note-footer">
                        <span class="note-tag ${getTagClass(note.tag)}">
                            ${getTagIcon(note.tag)} ${getTagName(note.tag)}
                        </span>
                        <span class="note-date">${formatDate(note.updatedAt || note.date)}</span>
                    </div>
                </div>`;
            notesContainer.appendChild(noteElement);
        });

        document.querySelectorAll(".edit-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                openEditNoteModal(this.getAttribute("data-id"));
            });
        });

        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.addEventListener("click", function () {
                noteToDeleteId = this.getAttribute("data-id");
                openConfirmModal();
            });
        });
    }

    function getTagClass(tag) {
        const classes = {
            work: "tag-work",
            personal: "tag-personal",
            ideas: "tag-ideas",
            reminders: "tag-reminders",
            alarms: "tag-alarms",
        };
        return classes[tag] || "";
    }

    function getTagIcon(tag) {
        const icons = {
            work: '<i class="fas fa-briefcase"></i>',
            personal: '<i class="fas fa-user"></i>',
            ideas: '<i class="fas fa-lightbulb"></i>',
            reminders: '<i class="fas fa-bell"></i>',
            alarms: '<i class="fas fa-clock"></i>',
        };
        return icons[tag] || "";
    }

    function getTagName(tag) {
        const names = {
            work: "Work",
            personal: "Personal",
            ideas: "Ideas",
            reminders: "Reminders",
            alarms: "Alarms",
        };
        return names[tag] || tag;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    function openNoteModal(mode = "add", note = null) {
        addNoteModal.classList.add("active");
        document.body.style.overflow = "hidden";

        if (mode === "edit" && note) {
            modalTitle.textContent = "Edit Note";
            submitNoteBtn.textContent = "Update Note";
            noteToEditId = note.id;
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;

            const tagInput = document.querySelector(`input[name="noteTag"][value="${note.tag}"]`);
            if (tagInput) {
                tagInput.checked = true;
            }
        } else {
            modalTitle.textContent = "New Note";
            submitNoteBtn.textContent = "Save Note";
            noteToEditId = null;
            noteForm.reset();
            setDefaultTag();
        }
    }

    function openAddNoteModal() {
        openNoteModal("add");
    }

    function closeAddNoteModal() {
        addNoteModal.classList.remove("active");
        document.body.style.overflow = "auto";
        noteForm.reset();
        noteToEditId = null;
        modalTitle.textContent = "New Note";
        submitNoteBtn.textContent = "Save Note";
        setDefaultTag();
    }

    function openEditNoteModal(noteId) {
        const note = notes.find((currentNote) => currentNote.id === noteId);
        if (!note) {
            return;
        }

        openNoteModal("edit", note);
    }

    function openConfirmModal() {
        confirmModal.classList.add("active");
        document.body.style.overflow = "hidden";
    }

    function closeConfirmModal() {
        confirmModal.classList.remove("active");
        document.body.style.overflow = "auto";
        noteToDeleteId = null;
    }

    function setDefaultTag() {
        const defaultTag = document.querySelector('input[name="noteTag"][value="ideas"]');
        if (defaultTag) {
            defaultTag.checked = true;
        }
    }

    function handleNoteSubmit(e) {
        e.preventDefault();

        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();
        const tagInput = document.querySelector('input[name="noteTag"]:checked');
        const tag = tagInput ? tagInput.value : "ideas";

        if (!title || !content) {
            window.alert("Please enter a title and note content.");
            return;
        }

        const existingNoteIndex = notes.findIndex((note) => note.id === noteToEditId);
        const notePayload = {
            id: noteToEditId || createNoteId(),
            title,
            content,
            tag,
            date: existingNoteIndex >= 0 ? notes[existingNoteIndex].date : new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (existingNoteIndex >= 0) {
            notes[existingNoteIndex] = notePayload;
        } else {
            notes.unshift(notePayload);
        }

        saveNotes();
        renderNotes();
        closeAddNoteModal();
        updateEmptyState();
        filterNotes();
    }

    function confirmDeleteNote() {
        if (noteToDeleteId !== null) {
            notes = notes.filter((note) => note.id !== noteToDeleteId);
            saveNotes();
            renderNotes();
            updateEmptyState();
            filterNotes();
            closeConfirmModal();
        }
    }

    function saveNotes() {
        localStorage.setItem("notes", JSON.stringify(notes));
    }

    function filterNotes() {
        const searchTerm = searchInput.value.toLowerCase();
        const filterValue = filterSelect.value;

        let filteredNotes = notes;

        if (searchTerm) {
            filteredNotes = filteredNotes.filter(
                (note) =>
                    note.title.toLowerCase().includes(searchTerm) ||
                    note.content.toLowerCase().includes(searchTerm)
            );
        }

        if (filterValue !== "all") {
            filteredNotes = filteredNotes.filter((note) => note.tag === filterValue);
        }

        renderNotes(filteredNotes);
        updateEmptyState(filteredNotes, {
            hasSearch: Boolean(searchTerm),
            hasFilter: filterValue !== "all",
        });
    }

    function updateEmptyState(notesToCheck = notes, state = {}) {
        const hasSearch = state.hasSearch || false;
        const hasFilter = state.hasFilter || false;

        if (notesToCheck.length === 0) {
            emptyState.style.display = "block";

            if (hasSearch || hasFilter) {
                emptyStateTitle.textContent = "No matching notes";
                emptyStateText.textContent = "Try a different search term or filter.";
            } else {
                emptyStateTitle.textContent = "No Notes";
                emptyStateText.textContent = "Add your first note by clicking the \"Add\" button";
            }
        } else {
            emptyState.style.display = "none";
        }
    }

    function exportNotes() {
        const notesBlob = new Blob([JSON.stringify(notes, null, 2)], {
            type: "application/json",
        });
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(notesBlob);
        downloadLink.download = "notes-backup.json";
        downloadLink.click();
        setTimeout(() => URL.revokeObjectURL(downloadLink.href), 0);
    }

    function handleImportNotes(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            try {
                const parsed = JSON.parse(reader.result);
                const importedNotes = Array.isArray(parsed)
                    ? parsed
                    : Array.isArray(parsed.notes)
                        ? parsed.notes
                        : null;

                if (!importedNotes) {
                    throw new Error("Invalid note format");
                }

                notes = importedNotes.map((note) => normalizeNote(note));
                saveNotes();
                renderNotes();
                updateEmptyState();
                filterNotes();
            } catch (error) {
                window.alert("That file could not be imported. Please use a valid notes JSON file.");
            } finally {
                importNotesInput.value = "";
            }
        };

        reader.readAsText(file);
    }

    function handleDocumentKeydown(event) {
        if (event.key !== "Escape") {
            return;
        }

        if (addNoteModal.classList.contains("active")) {
            closeAddNoteModal();
        }

        if (confirmModal.classList.contains("active")) {
            closeConfirmModal();
        }
    }

    function handleModalOverlayClick(e) {
        if (e.target === addNoteModal) {
            closeAddNoteModal();
        }
    }

    function handleConfirmOverlayClick(e) {
        if (e.target === confirmModal) {
            closeConfirmModal();
        }
    }
});
