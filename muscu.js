(() => {
  const pageKey = document.body.dataset.pageKey;
  if (!pageKey) return;

  const timerDisplay = document.querySelector("[data-timer-display]");
  const minutesInput = document.querySelector("[data-timer-minutes]");
  const secondsInput = document.querySelector("[data-timer-seconds]");
  const startButton = document.querySelector("[data-timer-start]");
  const pauseButton = document.querySelector("[data-timer-pause]");
  const resetButton = document.querySelector("[data-timer-reset]");
  const presetButtons = document.querySelectorAll("[data-timer-preset]");
  const restButtons = document.querySelectorAll("[data-rest-seconds]");
  const notesField = document.querySelector("[data-notes-field]");
  const notesStatus = document.querySelector("[data-notes-status]");
  const workoutCards = document.querySelectorAll(".workout-card");

  const notesStorageKey = `muscu-notes-${pageKey}`;
  const timerStorageKey = `muscu-timer-${pageKey}`;

  let totalSeconds = 0;
  let remainingSeconds = 0;
  let intervalId = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const renderTime = (value) => {
    const minutes = Math.floor(value / 60).toString().padStart(2, "0");
    const seconds = (value % 60).toString().padStart(2, "0");
    if (timerDisplay) timerDisplay.textContent = `${minutes}:${seconds}`;
  };

  const persistTimerInputs = () => {
    localStorage.setItem(
      timerStorageKey,
      JSON.stringify({
        minutes: minutesInput ? minutesInput.value : "0",
        seconds: secondsInput ? secondsInput.value : "0",
      }),
    );
  };

  const normalizeTimerInputs = () => {
    const rawMinutes = parseInt(minutesInput?.value || "0", 10) || 0;
    const rawSeconds = parseInt(secondsInput?.value || "0", 10) || 0;
    const safeMinutes = clamp(rawMinutes, 0, 59);
    const safeSeconds = clamp(rawSeconds, 0, 59);

    if (minutesInput) minutesInput.value = String(safeMinutes);
    if (secondsInput) secondsInput.value = String(safeSeconds);

    return { safeMinutes, safeSeconds };
  };

  const syncTimerFromInputs = () => {
    const { safeMinutes, safeSeconds } = normalizeTimerInputs();
    totalSeconds = (safeMinutes * 60) + safeSeconds;
    remainingSeconds = totalSeconds;
    renderTime(remainingSeconds);
    persistTimerInputs();
  };

  const stopTimer = () => {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
  };

  const playEndSound = () => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const context = new AudioContextClass();
      const duration = 0.18;

      [0, 0.22, 0.44].forEach((offset, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = index === 1 ? 880 : 660;
        gain.gain.value = 0.0001;

        oscillator.connect(gain);
        gain.connect(context.destination);

        const start = context.currentTime + offset;
        gain.gain.exponentialRampToValueAtTime(0.2, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

        oscillator.start(start);
        oscillator.stop(start + duration);
      });
    } catch (error) {
      console.error("Impossible de jouer le son du minuteur.", error);
    }
  };

  const finishTimer = () => {
    stopTimer();
    remainingSeconds = 0;
    renderTime(0);
    playEndSound();

    if ("vibrate" in navigator) {
      navigator.vibrate([180, 100, 180]);
    }
  };

  const startTimer = () => {
    if (remainingSeconds <= 0) syncTimerFromInputs();
    if (remainingSeconds <= 0) return;

    stopTimer();
    intervalId = window.setInterval(() => {
      remainingSeconds -= 1;
      renderTime(remainingSeconds);

      if (remainingSeconds <= 0) {
        finishTimer();
      }
    }, 1000);
  };

  const setTimer = (seconds) => {
    const safeSeconds = Math.max(0, seconds);
    totalSeconds = safeSeconds;
    remainingSeconds = safeSeconds;

    if (minutesInput) minutesInput.value = String(Math.floor(safeSeconds / 60));
    if (secondsInput) secondsInput.value = String(safeSeconds % 60);

    renderTime(remainingSeconds);
    persistTimerInputs();
  };

  const saveNotes = () => {
    if (!notesField) return;

    localStorage.setItem(notesStorageKey, notesField.value);

    if (notesStatus) {
      notesStatus.textContent = "Notes enregistr\u00e9es";
      window.clearTimeout(saveNotes.timeoutId);
      saveNotes.timeoutId = window.setTimeout(() => {
        notesStatus.textContent = "Les notes se sauvegardent automatiquement";
      }, 1400);
    }
  };

  const loadSavedState = () => {
    const savedNotes = localStorage.getItem(notesStorageKey);
    if (notesField && savedNotes) {
      notesField.value = savedNotes;
    }

    const savedTimer = localStorage.getItem(timerStorageKey);
    if (savedTimer) {
      try {
        const parsed = JSON.parse(savedTimer);
        if (minutesInput) minutesInput.value = parsed.minutes ?? "1";
        if (secondsInput) secondsInput.value = parsed.seconds ?? "0";
      } catch (_error) {
        // Ignore invalid timer state.
      }
    }

    syncTimerFromInputs();
  };

  workoutCards.forEach((workoutCard, index) => {
    const form = workoutCard.querySelector("[data-load-form]");
    const toggle = workoutCard.querySelector("[data-adjust-toggle]");
    const panel = workoutCard.querySelector("[data-adjust-panel]");

    if (panel) {
      const panelId = `${pageKey}-adjust-panel-${index + 1}`;
      panel.id = panelId;
      panel.setAttribute("aria-live", "polite");
    }

    if (toggle && panel) {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", panel.id);
      toggle.addEventListener("click", () => {
        const isHidden = panel.hidden;
        panel.hidden = !isHidden;
        toggle.setAttribute("aria-expanded", String(isHidden));
      });
    }

    if (!form) return;

    const exerciseId = form.dataset.exerciseId;
    const loadInput = form.querySelector("[data-load-input]");
    const repsInput = form.querySelector("[data-reps-input]");
    const loadOutput = workoutCard.querySelector("[data-load-output]");
    const repsOutput = workoutCard.querySelector("[data-reps-output]");
    const saveButton = form.querySelector("[data-load-save]");
    const saveFeedback = form.querySelector("[data-save-feedback]");

    if (!exerciseId || !panel || !repsInput || !saveButton) return;

    const loadKey = `muscu-load-${pageKey}-${exerciseId}`;
    const repsKey = `muscu-reps-${pageKey}-${exerciseId}`;
    const defaultLoad = loadInput ? loadInput.value.trim() : "";
    const defaultReps = repsInput.value.trim();
    const savedLoad = localStorage.getItem(loadKey) ?? defaultLoad;
    const savedReps = localStorage.getItem(repsKey) ?? defaultReps;

    if (loadInput) loadInput.value = savedLoad;
    repsInput.value = savedReps;

    if (loadOutput) {
      loadOutput.textContent = savedLoad ? `${savedLoad} kg` : "Sans charge";
    }

    if (repsOutput) {
      repsOutput.textContent = savedReps || defaultReps;
    }

    saveButton.addEventListener("click", () => {
      const nextLoad = loadInput ? loadInput.value.trim() : "";
      const nextReps = repsInput.value.trim();

      if (loadInput) {
        if (nextLoad) {
          localStorage.setItem(loadKey, nextLoad);
          if (loadOutput) loadOutput.textContent = `${nextLoad} kg`;
        } else {
          localStorage.removeItem(loadKey);
          if (loadOutput) loadOutput.textContent = "Sans charge";
        }
      }

      if (nextReps) {
        localStorage.setItem(repsKey, nextReps);
        if (repsOutput) repsOutput.textContent = nextReps;
      } else {
        localStorage.removeItem(repsKey);
        if (repsOutput) repsOutput.textContent = defaultReps;
      }

      if (saveFeedback) {
        saveFeedback.textContent = "Enregistr\u00e9";
        saveFeedback.hidden = false;
        window.clearTimeout(saveFeedback.timeoutId);
        saveFeedback.timeoutId = window.setTimeout(() => {
          saveFeedback.hidden = true;
        }, 1600);
      }
      window.clearTimeout(panel.closeTimeoutId);
      panel.closeTimeoutId = window.setTimeout(() => {
        panel.hidden = true;
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
        }
      }, 900);
    });
  });

  presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const seconds = parseInt(button.dataset.timerPreset || "0", 10) || 0;
      setTimer(seconds);
    });
  });

  restButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const seconds = parseInt(button.dataset.restSeconds || "0", 10) || 0;
      setTimer(seconds);
      startTimer();
    });
  });

  if (minutesInput) minutesInput.addEventListener("input", syncTimerFromInputs);
  if (secondsInput) secondsInput.addEventListener("input", syncTimerFromInputs);
  if (startButton) startButton.addEventListener("click", startTimer);
  if (pauseButton) pauseButton.addEventListener("click", stopTimer);

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      stopTimer();
      syncTimerFromInputs();
    });
  }

  if (notesField) notesField.addEventListener("input", saveNotes);

  loadSavedState();
})();
