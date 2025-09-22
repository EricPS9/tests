import React, { useEffect, useState, useRef } from "react";

// --- Aplicación de Test Oposiciones ---

// Preguntas de ejemplo (en caso de que no se cargue el JSON externo)
const sampleQuestions = [
  {
    numero: 1,
    bloque: "I",
    enunciado:
      "La ley 34/2002, de servicios de la sociedad de la información y comercio electrónico, en su artículo 45 trata la prescripción. Señale la respuesta correcta respecto a las infracciones:",
    opciones: {
      A: "Las muy graves prescribirán a los tres años, las graves a los dos años y las leves al año.",
      B: "Las muy graves prescribirán a los cinco años, las graves a los dos años y las leves a los seis meses.",
      C: "Las muy graves prescribirán a los tres años, las graves a los dos años y las leves a los seis meses.",
      D: "Las muy graves prescribirán a los cinco años, las graves a los tres años y las leves al año."
    },
    respuesta_correcta: "C"
  }
];

function formatTimeLeft(seconds) {
  const mm = Math.floor(seconds / 60).toString().padStart(2, "0");
  const ss = (seconds % 60).toString().padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function App() {
  const [screen, setScreen] = useState("home"); // home | quiz | results
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const timerRef = useRef(null);

  useEffect(() => {
    // Cargar JSON desde /public/examen_2014.json
    fetch(process.env.PUBLIC_URL + "/examen_2014.json")
      .then((r) => {
        if (!r.ok) throw new Error("No hay JSON en /public/");
        return r.json();
      })
      .then((data) => setQuestions(data))
      .catch(() => setQuestions(sampleQuestions));
  }, []);

  useEffect(() => {
    if (screen === "quiz") {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            finishExam();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen]);

  function startExam() {
    setAnswers({});
    setCurrentIndex(0);
    setTimeLeft(90 * 60);
    setScreen("quiz");
  }

  function selectOption(numero, option) {
    setAnswers((prev) => ({ ...prev, [numero]: option }));
  }

  function next() {
    setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
  }
  function prev() {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }

  function finishExam() {
    setScreen("results");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function computeScore() {
    let correct = 0;
    questions.forEach((q) => {
      const sel = answers[q.numero];
      if (sel && sel.toUpperCase() === (q.respuesta_correcta || "").toUpperCase())
        correct++;
    });
    return { correct, total: questions.length };
  }

  // ---- PANTALLAS ----
  if (screen === "home") {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h1>App Test — Oposiciones</h1>
          <button style={styles.button} onClick={startExam}>
            Empezar examen
          </button>
        </div>
      </div>
    );
  }

  if (screen === "quiz") {
    const q = questions[currentIndex];
    if (!q) return <div style={styles.page}>Cargando preguntas...</div>;
    const selected = answers[q.numero];
    const progress = `${currentIndex + 1} / ${questions.length}`;

    return (
      <div style={styles.page}>
        <div style={styles.cardLarge}>
          <div>
            <strong>{progress}</strong> | ⏱ {formatTimeLeft(timeLeft)}
          </div>
          <h2>{q.enunciado}</h2>
          <div>
            {["A", "B", "C", "D"].map((opt) => (
              <label key={opt} style={styles.option}>
                <input
                  type="radio"
                  name={`q-${q.numero}`}
                  checked={selected === opt}
                  onChange={() => selectOption(q.numero, opt)}
                />
                {opt}) {q.opciones[opt]}
              </label>
            ))}
          </div>
          <div style={styles.controls}>
            <button onClick={prev} disabled={currentIndex === 0}>
              ← Anterior
            </button>
            <button onClick={finishExam}>Entregar</button>
            <button
              onClick={next}
              disabled={currentIndex === questions.length - 1}
            >
              Siguiente →
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "results") {
    const { correct, total } = computeScore();
    const pct = Math.round((correct / total) * 100);
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <h2>Resultados</h2>
          <p>
            Correctas: {correct} / {total}
          </p>
          <p>Nota final: {pct}%</p>
          <button style={styles.button} onClick={() => setScreen("home")}>
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ---- ESTILOS ----
const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f4f6f8"
  },
  card: {
    background: "#fff",
    padding: 20,
    borderRadius: 8,
    textAlign: "center"
  },
  cardLarge: {
    background: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "70%"
  },
  button: {
    background: "#0b74de",
    color: "#fff",
    border: "none",
    padding: "10px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14
  },
  option: { display: "block", margin: "8px 0" },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: 20
  }
};
