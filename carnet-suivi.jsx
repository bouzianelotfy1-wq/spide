import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Home, Dumbbell, Activity, Sparkles, Plus, X, Check, Trash2, ChevronRight,
  ArrowLeft, Play, Flame, Settings,
  AlertTriangle, Moon, Zap, Ruler, Smile, ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Illustrations d'exercices (RepDB)                                   */
/* ------------------------------------------------------------------ */
/* Images d'exercices : jeu de données RepDB (repdb.co), libre d'usage  */
/* en appli sous réserve d'attribution visible — voir SettingsSheet.    */
/* Si une image ne charge pas (site externe indisponible), on retombe   */
/* sur un pictogramme bonhomme-bâton dessiné en local (Stickman).       */
const REPDB_BASE = "https://exercise-dataset.com/";
const REPDB_ATTRIBUTION_URL = "https://repdb.co";

const PICTOGRAMS = {
  stretch: {
    head: [50, 18, 7],
    lines: [[50, 25, 50, 55], [50, 30, 30, 12], [50, 30, 70, 12], [50, 55, 38, 85], [50, 55, 62, 85]],
  },
  pull: {
    head: [50, 22, 7],
    lines: [[50, 29, 50, 58], [50, 34, 30, 20], [50, 34, 70, 20], [50, 58, 42, 88], [50, 58, 58, 88]],
  },
  push: {
    head: [24, 45, 7],
    lines: [[30, 48, 70, 55], [38, 46, 30, 30], [55, 52, 55, 68], [70, 55, 85, 40], [70, 55, 85, 68]],
  },
  raise: {
    head: [50, 20, 7],
    lines: [[50, 27, 50, 58], [50, 33, 25, 33], [50, 33, 75, 33], [50, 58, 38, 88], [50, 58, 62, 88]],
  },
  squat: {
    head: [50, 18, 7],
    lines: [[50, 25, 50, 50], [50, 30, 32, 45], [50, 30, 68, 45], [50, 50, 32, 65], [32, 65, 38, 85], [50, 50, 68, 65], [68, 65, 62, 85]],
  },
  plank: {
    head: [18, 40, 7],
    lines: [[24, 42, 80, 55], [30, 44, 30, 60], [80, 55, 90, 40]],
  },
  core: {
    head: [26, 55, 7],
    lines: [[32, 58, 60, 42], [60, 42, 82, 42], [32, 58, 40, 85], [40, 85, 55, 85]],
  },
};

function Stickman({ pose, size = 72, color }) {
  const p = PICTOGRAMS[pose] || PICTOGRAMS.stretch;
  const stroke = color || COLORS.signal;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block" }}>
      <circle cx={p.head[0]} cy={p.head[1]} r={p.head[2]} fill="none" stroke={stroke} strokeWidth={4} />
      {p.lines.map((l, i) => (
        <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={stroke} strokeWidth={4} strokeLinecap="round" />
      ))}
    </svg>
  );
}

function ExerciseVisual({ exercise, size = 72 }) {
  const [failed, setFailed] = useState(false);
  if (!exercise.image || failed) {
    return (
      <div className="flex-shrink-0 rounded-xl flex items-center justify-center" style={{ width: size, height: size, background: "rgba(255,255,255,0.05)" }}>
        <Stickman pose={exercise.pictogram} size={size * 0.8} />
      </div>
    );
  }
  return (
    <img
      src={`${REPDB_BASE}${exercise.image}`}
      alt={exercise.name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
      className="flex-shrink-0 rounded-xl"
      style={{ width: size, height: size, objectFit: "cover", background: "rgba(255,255,255,0.05)" }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */
/* Palette pensée pour un carnet de suivi personnel, pas pour une      */
/* landing page : fond papier chaud et neutre, encre profonde pour la  */
/* lecture, un seul accent fort (signal) réservé aux actions et à la   */
/* séance guidée, deux accents secondaires pour distinguer les deux    */
/* familles de données (corps / esthétique) dans les graphiques.       */
const COLORS = {
  paper: "#F2EEE4",
  paperRaised: "#E8E2D2",
  ink: "#1E2530",
  inkSoft: "#5C6270",
  inkFaint: "#8A8F99",
  line: "#D9D1BC",
  surface: "#FBFAF6",
  signal: "#E8531F",
  signalSoft: "#FBD9C8",
  moss: "#3E6753",
  mossSoft: "#DCE7DE",
  denim: "#33546E",
  denimSoft: "#DCE4EA",
  danger: "#A32F22",
  dark: "#1B2129",
  darkRaised: "#262E3A",
};

/* Rôles typographiques : la police système "sans" porte la lecture     */
/* (titres, phrases, consignes) ; la police "mono" porte tout ce qui    */
/* est chiffré (dates, durées, poids, chrono) — un repère visuel        */
/* constant pour distinguer une donnée d'une intention.                 */
const FONT_SANS = "font-sans";
const FONT_MONO = "font-mono";

const STORAGE_DATA_KEY = "carnet-tracker-data";
const STORAGE_SESSION_KEY = "carnet-session-progress";

const EMPTY_DATA = { sport: [], corps: [], esthetique: [] };

const WORKOUTS = {
  A: {
    id: "A",
    label: "Séance A",
    focus: "Dos, épaules, largeur",
    tagline: "Construire la largeur du dos, stabiliser les épaules.",
    exercises: [
      { name: "Échauffement", sets: 1, target: "90 secondes", note: "Mobilité épaules et dos, monte progressivement en intensité.", pictogram: "stretch" },
      { name: "Tractions assistées", sets: 3, target: "6 répétitions", note: "Utilise l'assistance nécessaire pour contrôler la descente, dos gainé sans cambrer.", pictogram: "pull", image: "images/flat/assisted-pull-ups-peak.webp" },
      { name: "Rows australiens", sets: 3, target: "10 répétitions", note: "Corps aligné des pieds à la tête, tire la poitrine vers la barre sans creuser le bas du dos.", pictogram: "pull", image: "images/flat/inverted-row-peak.webp" },
      { name: "Élévations latérales", sets: 3, target: "15 répétitions", note: "Charge très légère (1 à 2 kg), mouvement contrôlé, sans élan.", pictogram: "raise", image: "images/flat/lateral-raise-peak.webp" },
      { name: "Reverse fly", sets: 3, target: "12 répétitions", note: "Buste incliné et stable, charge légère, focus sur les omoplates.", pictogram: "raise", image: "images/flat/dumbbell-reverse-fly-peak.webp" },
      { name: "Ab wheel régressé", sets: 2, target: "6 répétitions", note: "Depuis les genoux, amplitude très courte et contrôlée. Arrête-toi bien avant toute tension abdominale — ce n'est pas un exercice à forcer.", pictogram: "core", image: "images/flat/ab-wheel-rollout-start.webp", caution: true },
      { name: "Gainage doux", sets: 3, target: "20 secondes", note: "Dos droit, pas de creux ni de rond. Sors de la position à la moindre gêne au niveau de la cicatrice.", pictogram: "plank", image: "images/flat/plank-main.webp", caution: true },
      { name: "Retour au calme", sets: 1, target: "60 secondes", note: "Respiration profonde, étirements doux.", pictogram: "stretch" },
    ],
  },
  B: {
    id: "B",
    label: "Séance B",
    focus: "Bras, poitrine, jambes arrière",
    tagline: "Renforcer bras et poitrine, travailler les jambes.",
    exercises: [
      { name: "Échauffement", sets: 1, target: "90 secondes", note: "Mobilité épaules, hanches et chevilles avant l'effort.", pictogram: "stretch" },
      { name: "Dips assistés", sets: 3, target: "8 répétitions", note: "Assistance suffisante pour rester fluide, amplitude courte en cas de tension à l'épaule ou au buste.", pictogram: "push", image: "images/flat/assisted-dips-peak.webp" },
      { name: "Pompes inclinées", sets: 3, target: "10 répétitions", note: "Mains surélevées (table, canapé), buste gainé sans cambrer.", pictogram: "push", image: "images/flat/incline-push-ups-peak.webp" },
      { name: "Pompes diamant", sets: 3, target: "8 répétitions", note: "Version exigeante pour les triceps : réduis l'amplitude ou remonte les mains si besoin.", pictogram: "push", image: "images/flat/diamond-push-ups-peak.webp" },
      { name: "Fentes bulgares", sets: 3, target: "10 par jambe", note: "Appui arrière stable, descente lente, sans à-coup.", pictogram: "squat", image: "images/flat/bulgarian-split-squat-peak.webp" },
      { name: "Squats au poids du corps", sets: 3, target: "15 répétitions", note: "Descente contrôlée, talons au sol, genoux dans l'axe des pieds.", pictogram: "squat", image: "images/flat/bodyweight-squat-peak.webp" },
      { name: "Retour au calme", sets: 1, target: "60 secondes", note: "Respiration profonde, étirements doux.", pictogram: "stretch" },
    ],
  },
};

const INTENSITIES = ["Légère", "Modérée", "Intense"];

/* ------------------------------------------------------------------ */
/* Utilitaires                                                         */
/* ------------------------------------------------------------------ */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function toISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayISO() {
  return toISO(new Date());
}

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toISO(d);
}

function fmtDateShort(iso) {
  try {
    return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  } catch (e) {
    return iso;
  }
}

function fmtWeekday(iso) {
  try {
    const d = new Date(iso + "T00:00:00");
    const label = d.toLocaleDateString("fr-FR", { weekday: "long" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch (e) {
    return "";
  }
}

function fmtDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m}` : `${h} h`;
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function fmtElapsed(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Encore debout ?";
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

/* ------------------------------------------------------------------ */
/* Stockage (window.storage uniquement, jamais localStorage)           */
/* ------------------------------------------------------------------ */
async function storageGet(key, fallback) {
  if (!window.storage) return fallback;
  try {
    const v = await window.storage.get(key, false);
    return v === undefined || v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

async function storageSet(key, value) {
  if (!window.storage) return;
  try {
    await window.storage.set(key, value, false);
  } catch (e) {
    /* silencieux : la donnée reste au moins en mémoire pour la session */
  }
}

async function storageDelete(key) {
  if (!window.storage) return;
  try {
    await window.storage.delete(key, false);
  } catch (e) {
    /* rien à faire */
  }
}

/* ------------------------------------------------------------------ */
/* Calculs dérivés                                                     */
/* ------------------------------------------------------------------ */
function computeWeekSessions(sport) {
  const since = isoDaysAgo(6);
  return sport.filter((e) => e.date >= since).length;
}

function computeLastWeight(corps) {
  if (!corps.length) return null;
  const sorted = [...corps].sort((a, b) => (a.date < b.date ? -1 : 1));
  const last = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  return { value: last.weight, delta: prev ? +(last.weight - prev.weight).toFixed(1) : null };
}

function computeEstheticStreak(esthetique) {
  const done = new Set(esthetique.filter((e) => e.routine).map((e) => e.date));
  let cursor = new Date();
  if (!done.has(todayISO())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (done.has(toISO(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function last14Days() {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toISO(d));
  }
  return days;
}

/* ------------------------------------------------------------------ */
/* Petits composants réutilisables                                     */
/* ------------------------------------------------------------------ */
function GlobalStyle() {
  return (
    <style>{`
      .cc-scroll::-webkit-scrollbar { display: none; }
      .cc-scroll { scrollbar-width: none; -ms-overflow-style: none; }
      .cc-focus:focus-visible { outline: 2px solid ${COLORS.signal}; outline-offset: 2px; border-radius: 6px; }
      @keyframes cc-toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }
      @keyframes cc-sheet-in { from { transform: translateY(100%); } to { transform: translateY(0); } }
      @keyframes cc-fade-in { from { opacity: 0; } to { opacity: 1; } }
      input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.6; }
    `}</style>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-3">
      <h2 className={`${FONT_SANS} text-lg font-semibold`} style={{ color: COLORS.ink }}>{title}</h2>
      {subtitle ? (
        <p className={`${FONT_SANS} text-sm mt-0.5`} style={{ color: COLORS.inkSoft }}>{subtitle}</p>
      ) : null}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <p className={`${FONT_SANS} text-sm py-6 text-center`} style={{ color: COLORS.inkFaint }}>{text}</p>
  );
}

function CategoryIcon({ type, size = 16, color }) {
  const props = { size, color: color || COLORS.ink, strokeWidth: 2 };
  if (type === "sport") return <Dumbbell {...props} />;
  if (type === "corps") return <Activity {...props} />;
  return <Sparkles {...props} />;
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div
      className={`${FONT_SANS} fixed left-1/2 z-50 text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg`}
      style={{
        bottom: "88px",
        transform: "translateX(-50%)",
        background: COLORS.ink,
        color: COLORS.surface,
        animation: "cc-toast-in 0.2s ease-out",
      }}
      role="status"
    >
      {message}
    </div>
  );
}

function DeleteButton({ active, onFirstTap, onConfirm, label }) {
  if (active) {
    return (
      <button
        type="button"
        onClick={onConfirm}
        className={`${FONT_SANS} cc-focus text-xs font-semibold px-2.5 py-1.5 rounded-md flex items-center gap-1`}
        style={{ background: COLORS.danger, color: COLORS.surface }}
        aria-label={`Confirmer la suppression de ${label}`}
      >
        <Trash2 size={13} /> Confirmer
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onFirstTap}
      className="cc-focus p-1.5 rounded-md"
      style={{ color: COLORS.inkFaint }}
      aria-label={`Supprimer ${label}`}
    >
      <Trash2 size={15} />
    </button>
  );
}

function ScaleSelector({ value, onChange, count = 5, labelFor }) {
  return (
    <div className="flex gap-2" role="radiogroup">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
        const isActive = value === n;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={labelFor ? labelFor(n) : String(n)}
            onClick={() => onChange(n)}
            className={`${FONT_MONO} cc-focus flex-1 h-10 rounded-lg text-sm font-semibold border`}
            style={{
              background: isActive ? COLORS.ink : COLORS.surface,
              color: isActive ? COLORS.surface : COLORS.inkSoft,
              borderColor: isActive ? COLORS.ink : COLORS.line,
            }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

function ChipGroup({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const isActive = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`${FONT_SANS} cc-focus text-sm font-medium px-3.5 py-2 rounded-full border`}
            style={{
              background: isActive ? COLORS.ink : COLORS.surface,
              color: isActive ? COLORS.surface : COLORS.inkSoft,
              borderColor: isActive ? COLORS.ink : COLORS.line,
            }}
            aria-pressed={isActive}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={`${FONT_SANS} text-sm font-medium block mb-1.5`} style={{ color: COLORS.ink }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  background: COLORS.surface,
  borderColor: COLORS.line,
  color: COLORS.ink,
};

function TextInput(props) {
  return (
    <input
      {...props}
      className={`${FONT_MONO} cc-focus w-full border rounded-lg px-3 py-2.5 text-sm`}
      style={inputStyle}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Bottom sheet générique                                              */
/* ------------------------------------------------------------------ */
function BottomSheet({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="absolute inset-0"
        style={{ background: "rgba(30,37,48,0.45)", animation: "cc-fade-in 0.15s ease-out" }}
        onClick={onClose}
      />
      <div
        className={`${FONT_SANS} relative w-full max-w-md rounded-t-2xl px-5 pt-4 pb-6 max-h-[85vh] overflow-y-auto`}
        style={{ background: COLORS.surface, animation: "cc-sheet-in 0.22s cubic-bezier(0.22,1,0.36,1)" }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold" style={{ color: COLORS.ink }}>{title}</h3>
          <button type="button" onClick={onClose} className="cc-focus p-1.5 rounded-full" style={{ color: COLORS.inkSoft }} aria-label="Fermer">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulaires d'ajout                                                 */
/* ------------------------------------------------------------------ */
function SportForm({ values, setValues, onSubmit }) {
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
      className="space-y-4"
    >
      <Field label="Date">
        <TextInput type="date" value={values.date} max={todayISO()} onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))} required />
      </Field>
      <Field label="Type de séance">
        <ChipGroup options={["Séance A", "Séance B", "Autre activité"]} value={values.type} onChange={(v) => setValues((s) => ({ ...s, type: v }))} />
      </Field>
      <Field label="Durée (minutes)">
        <TextInput type="number" min="1" inputMode="numeric" value={values.duration} onChange={(e) => setValues((v) => ({ ...v, duration: e.target.value }))} required />
      </Field>
      <Field label="Intensité">
        <ChipGroup options={INTENSITIES} value={values.intensity} onChange={(v) => setValues((s) => ({ ...s, intensity: v }))} />
      </Field>
      <Field label="Notes (facultatif)">
        <textarea
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          className={`${FONT_SANS} cc-focus w-full border rounded-lg px-3 py-2.5 text-sm`}
          style={inputStyle}
          rows={2}
        />
      </Field>
      <SubmitButton />
    </form>
  );
}

function CorpsForm({ values, setValues, onSubmit }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <Field label="Date">
        <TextInput type="date" value={values.date} max={todayISO()} onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))} required />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Poids (kg)">
          <TextInput type="number" step="0.1" inputMode="decimal" value={values.weight} onChange={(e) => setValues((v) => ({ ...v, weight: e.target.value }))} required />
        </Field>
        <Field label="Tour de taille (cm)">
          <TextInput type="number" step="0.5" inputMode="decimal" value={values.waist} onChange={(e) => setValues((v) => ({ ...v, waist: e.target.value }))} />
        </Field>
      </div>
      <Field label="Sommeil (heures)">
        <TextInput type="number" step="0.5" inputMode="decimal" value={values.sleep} onChange={(e) => setValues((v) => ({ ...v, sleep: e.target.value }))} />
      </Field>
      <Field label="Énergie ressentie">
        <ScaleSelector value={values.energy} onChange={(n) => setValues((v) => ({ ...v, energy: n }))} labelFor={(n) => `Énergie ${n} sur 5`} />
      </Field>
      <SubmitButton />
    </form>
  );
}

function EsthetiqueForm({ values, setValues, onSubmit }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <Field label="Date">
        <TextInput type="date" value={values.date} max={todayISO()} onChange={(e) => setValues((v) => ({ ...v, date: e.target.value }))} required />
      </Field>
      <Field label="Routine faite">
        <div className="flex gap-2">
          <ChipGroup options={["Oui", "Non"]} value={values.routine ? "Oui" : "Non"} onChange={(v) => setValues((s) => ({ ...s, routine: v === "Oui" }))} />
        </div>
      </Field>
      <Field label="Confiance du jour">
        <ScaleSelector value={values.mood} onChange={(n) => setValues((v) => ({ ...v, mood: n }))} labelFor={(n) => `Confiance ${n} sur 5`} />
      </Field>
      <Field label="Notes (facultatif)">
        <textarea
          value={values.notes}
          onChange={(e) => setValues((v) => ({ ...v, notes: e.target.value }))}
          className={`${FONT_SANS} cc-focus w-full border rounded-lg px-3 py-2.5 text-sm`}
          style={inputStyle}
          rows={2}
        />
      </Field>
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  return (
    <button
      type="submit"
      className={`${FONT_SANS} cc-focus w-full py-3 rounded-lg text-sm font-semibold mt-2`}
      style={{ background: COLORS.ink, color: COLORS.surface }}
    >
      Enregistrer
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Écran d'accueil                                                     */
/* ------------------------------------------------------------------ */
function StatCard({ icon, label, value, sub, subColor }) {
  return (
    <div
      className="flex-shrink-0 rounded-xl px-4 py-3.5 flex flex-col justify-between"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, minWidth: "148px" }}
    >
      <div className="flex items-center gap-1.5 mb-2" style={{ color: COLORS.inkSoft }}>
        {icon}
        <span className={`${FONT_SANS} text-xs font-medium`}>{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`${FONT_MONO} text-2xl font-semibold`} style={{ color: COLORS.ink }}>{value}</span>
        {sub ? <span className={`${FONT_MONO} text-xs font-medium`} style={{ color: subColor || COLORS.inkSoft }}>{sub}</span> : null}
      </div>
    </div>
  );
}

function HomeView({ data }) {
  const weekSessions = computeWeekSessions(data.sport);
  const lastWeight = computeLastWeight(data.corps);
  const streak = computeEstheticStreak(data.esthetique);

  const timeline = useMemo(() => {
    const items = [
      ...data.sport.map((e) => ({ ...e, category: "sport", text: `${e.type} · ${fmtDuration(e.duration)}` })),
      ...data.corps.map((e) => ({ ...e, category: "corps", text: `${e.weight} kg` })),
      ...data.esthetique.map((e) => ({ ...e, category: "esthetique", text: e.routine ? "Routine faite" : "Routine non faite" })),
    ];
    return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 10);
  }, [data]);

  return (
    <div className="px-5 pt-6 pb-4">
      <p className={`${FONT_SANS} text-sm`} style={{ color: COLORS.inkSoft }}>{greeting()}, Lotfy</p>
      <p className={`${FONT_MONO} text-xs mt-0.5 mb-5`} style={{ color: COLORS.inkFaint }}>{fmtWeekday(todayISO())} · {fmtDateShort(todayISO())}</p>

      <div className="flex gap-3 overflow-x-auto cc-scroll -mx-5 px-5 pb-1 mb-7">
        <StatCard
          icon={<Dumbbell size={14} />}
          label="7 derniers jours"
          value={weekSessions}
          sub={weekSessions > 1 ? "séances" : "séance"}
        />
        <StatCard
          icon={<Activity size={14} />}
          label="Dernier poids"
          value={lastWeight ? lastWeight.value : "—"}
          sub={lastWeight && lastWeight.delta !== null ? `${lastWeight.delta > 0 ? "+" : ""}${lastWeight.delta} kg` : lastWeight ? "kg" : null}
          subColor={lastWeight && lastWeight.delta < 0 ? COLORS.moss : lastWeight && lastWeight.delta > 0 ? COLORS.signal : COLORS.inkSoft}
        />
        <StatCard
          icon={<Flame size={14} />}
          label="Streak esthétique"
          value={streak}
          sub={streak > 1 ? "jours" : "jour"}
          subColor={COLORS.moss}
        />
      </div>

      <SectionHeader title="Dernières entrées" />
      {timeline.length === 0 ? (
        <EmptyState text="Rien d'enregistré pour l'instant. Ajoute ta première entrée depuis un onglet." />
      ) : (
        <ul>
          {timeline.map((item) => (
            <li key={`${item.category}-${item.id}`} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
              <div
                className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: item.category === "sport" ? COLORS.signalSoft : item.category === "corps" ? COLORS.denimSoft : COLORS.mossSoft }}
              >
                <CategoryIcon
                  type={item.category}
                  color={item.category === "sport" ? COLORS.signal : item.category === "corps" ? COLORS.denim : COLORS.moss}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`${FONT_SANS} text-sm font-medium truncate`} style={{ color: COLORS.ink }}>{item.text}</p>
              </div>
              <span className={`${FONT_MONO} text-xs flex-shrink-0`} style={{ color: COLORS.inkFaint }}>{fmtDateShort(item.date)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Écran Sport                                                         */
/* ------------------------------------------------------------------ */
function WorkoutTile({ workout, onStart }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="cc-focus w-full text-left rounded-xl p-4 flex items-center gap-4"
      style={{ background: COLORS.surface, border: `1px solid ${COLORS.line}` }}
    >
      <div
        className="flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
        style={{ background: COLORS.ink }}
      >
        <Play size={16} color={COLORS.surface} fill={COLORS.surface} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${FONT_SANS} text-sm font-semibold`} style={{ color: COLORS.ink }}>{workout.label} — {workout.focus}</p>
        <p className={`${FONT_SANS} text-xs mt-0.5`} style={{ color: COLORS.inkSoft }}>{workout.tagline}</p>
      </div>
      <ChevronRight size={18} style={{ color: COLORS.inkFaint }} />
    </button>
  );
}

function ResumeBanner({ workout, elapsed, onResume, onAbandon }) {
  return (
    <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ background: COLORS.dark }}>
      <div className="flex-1 min-w-0">
        <p className={`${FONT_SANS} text-sm font-semibold`} style={{ color: COLORS.surface }}>Séance {workout} en cours</p>
        <p className={`${FONT_MONO} text-xs mt-0.5`} style={{ color: COLORS.signal }}>{fmtElapsed(elapsed)} écoulées</p>
      </div>
      <button type="button" onClick={onAbandon} className={`${FONT_SANS} cc-focus text-xs font-medium px-3 py-2 rounded-md`} style={{ color: COLORS.inkFaint }}>
        Abandonner
      </button>
      <button type="button" onClick={onResume} className={`${FONT_SANS} cc-focus text-xs font-semibold px-3.5 py-2 rounded-md`} style={{ background: COLORS.signal, color: COLORS.surface }}>
        Reprendre
      </button>
    </div>
  );
}

function SportView({ data, sessionProgress, onStartWorkout, onResumeSession, onAbandonSession, pendingDelete, onDeleteFirst, onDeleteConfirm, tick }) {
  const history = useMemo(() => [...data.sport].sort((a, b) => (a.date < b.date ? 1 : -1)), [data.sport]);
  const chartData = useMemo(
    () => [...data.sport].sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-10).map((e) => ({ date: fmtDateShort(e.date), duration: e.duration, type: e.type })),
    [data.sport]
  );
  const elapsed = sessionProgress ? Date.now() - sessionProgress.startedAt : 0;

  return (
    <div className="px-5 pt-6 pb-4">
      <SectionHeader title="Sport" subtitle="Deux séances guidées, à ton rythme." />

      {sessionProgress ? (
        <ResumeBanner workout={sessionProgress.workout} elapsed={elapsed} onResume={onResumeSession} onAbandon={onAbandonSession} />
      ) : null}

      <div className="space-y-3 mb-7">
        <WorkoutTile workout={WORKOUTS.A} onStart={() => onStartWorkout("A")} />
        <WorkoutTile workout={WORKOUTS.B} onStart={() => onStartWorkout("B")} />
      </div>

      <SectionHeader title="Historique" />
      {history.length === 0 ? (
        <EmptyState text="Aucune séance enregistrée pour l'instant." />
      ) : (
        <>
          <ul className="mb-6">
            {history.map((e) => {
              const key = `sport-${e.id}`;
              return (
                <li key={e.id} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                  <div className="flex-1 min-w-0">
                    <p className={`${FONT_SANS} text-sm font-medium`} style={{ color: COLORS.ink }}>{e.type}</p>
                    <p className={`${FONT_MONO} text-xs mt-0.5`} style={{ color: COLORS.inkSoft }}>
                      {fmtDateShort(e.date)} · {fmtDuration(e.duration)}{e.intensity ? ` · ${e.intensity}` : ""}
                    </p>
                  </div>
                  <DeleteButton active={pendingDelete === key} onFirstTap={() => onDeleteFirst(key)} onConfirm={() => onDeleteConfirm("sport", e.id)} label={`la séance du ${fmtDateShort(e.date)}`} />
                </li>
              );
            })}
          </ul>
          <SectionHeader title="Volume par séance" />
          <div style={{ height: 160 }} className="-ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} min`, "Durée"]} />
                <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.type === "Séance B" ? COLORS.denim : COLORS.signal} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Séance guidée (l'élément visuel fort de l'app)                      */
/* ------------------------------------------------------------------ */
function SessionRunner({ workout, sessionProgress, onToggleSet, onAbandon, onOpenFinish }) {
  const w = WORKOUTS[workout];
  const elapsed = Date.now() - sessionProgress.startedAt;
  const totalSets = w.exercises.reduce((s, ex) => s + ex.sets, 0);
  const doneSets = Object.values(sessionProgress.progress).reduce((s, arr) => s + arr.filter(Boolean).length, 0);
  const pct = totalSets ? Math.round((doneSets / totalSets) * 100) : 0;

  return (
    <div className="fixed inset-0 z-30 flex flex-col" style={{ background: COLORS.dark }}>
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button type="button" onClick={onAbandon} className="cc-focus p-2 -ml-2 rounded-full" style={{ color: COLORS.surface }} aria-label="Quitter la séance">
          <ArrowLeft size={20} />
        </button>
        <p className={`${FONT_SANS} text-sm font-medium`} style={{ color: COLORS.surface }}>{w.label} · {w.focus}</p>
        <div style={{ width: 36 }} />
      </div>

      <div className="px-5 pb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className={`${FONT_MONO} text-4xl font-semibold`} style={{ color: COLORS.surface }}>{fmtElapsed(elapsed)}</span>
          <span className={`${FONT_MONO} text-sm`} style={{ color: COLORS.signal }}>{doneSets}/{totalSets} séries</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: COLORS.darkRaised }}>
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS.signal, transition: "width 0.3s ease" }} />
        </div>
      </div>

      <div className="mx-5 mb-4 rounded-xl p-3.5 flex gap-2.5" style={{ background: COLORS.darkRaised }}>
        <AlertTriangle size={16} style={{ color: COLORS.signal, flexShrink: 0, marginTop: 2 }} />
        <p className={`${FONT_SANS} text-xs leading-relaxed`} style={{ color: "#C7CCD6" }}>
          Progression crescendo, aucun à-coup. Arrête immédiatement en cas de douleur ou de tension au niveau du ventre.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {w.exercises.map((ex, exIdx) => {
          const setsDone = sessionProgress.progress[exIdx] || Array(ex.sets).fill(false);
          const complete = setsDone.every(Boolean);
          return (
            <div
              key={exIdx}
              className="mb-3 rounded-xl p-4"
              style={{
                background: COLORS.darkRaised,
                opacity: complete ? 0.6 : 1,
                borderLeft: ex.caution ? `3px solid ${COLORS.signal}` : "3px solid transparent",
              }}
            >
              <div className="flex gap-3 mb-3">
                <ExerciseVisual exercise={ex} size={64} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`${FONT_SANS} text-sm font-semibold`} style={{ color: COLORS.surface }}>{ex.name}</p>
                    <span className={`${FONT_MONO} text-xs flex-shrink-0 ml-2`} style={{ color: "#9AA1AE" }}>{ex.target}</span>
                  </div>
                  {ex.caution ? (
                    <div className="flex items-center gap-1 mb-1">
                      <AlertTriangle size={11} style={{ color: COLORS.signal }} />
                      <span className={`${FONT_SANS} text-[11px] font-medium`} style={{ color: COLORS.signal }}>Vigilance abdominale</span>
                    </div>
                  ) : null}
                  <p className={`${FONT_SANS} text-xs leading-relaxed`} style={{ color: "#9AA1AE" }}>{ex.note}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {setsDone.map((done, setIdx) => (
                  <button
                    key={setIdx}
                    type="button"
                    onClick={() => onToggleSet(exIdx, setIdx, ex.sets)}
                    className="cc-focus flex-1 h-11 rounded-lg flex items-center justify-center"
                    style={{ background: done ? COLORS.signal : "rgba(255,255,255,0.06)", border: done ? "none" : `1px solid rgba(255,255,255,0.12)` }}
                    aria-pressed={done}
                    aria-label={`Série ${setIdx + 1} de ${ex.name}`}
                  >
                    {done ? <Check size={17} color={COLORS.surface} /> : <span className={`${FONT_MONO} text-xs`} style={{ color: "#9AA1AE" }}>{setIdx + 1}</span>}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-5 pb-6 pt-2">
        <button
          type="button"
          onClick={onOpenFinish}
          className={`${FONT_SANS} cc-focus w-full py-3.5 rounded-xl text-sm font-semibold`}
          style={{ background: COLORS.signal, color: COLORS.surface }}
        >
          Terminer la séance
        </button>
      </div>
    </div>
  );
}

function FinishSessionSheet({ open, workout, onClose, onSave }) {
  const [intensity, setIntensity] = useState("Modérée");
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (open) { setIntensity("Modérée"); setNotes(""); }
  }, [open]);
  if (!open) return null;
  return (
    <BottomSheet open={open} onClose={onClose} title={`Séance ${workout} terminée`}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(intensity, notes); }} className="space-y-4">
        <Field label="Intensité ressentie">
          <ChipGroup options={INTENSITIES} value={intensity} onChange={setIntensity} />
        </Field>
        <Field label="Notes (facultatif)">
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`${FONT_SANS} cc-focus w-full border rounded-lg px-3 py-2.5 text-sm`} style={inputStyle} rows={2} />
        </Field>
        <SubmitButton />
      </form>
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* Écran Corps                                                         */
/* ------------------------------------------------------------------ */
function CorpsView({ data, pendingDelete, onDeleteFirst, onDeleteConfirm }) {
  const sorted = useMemo(() => [...data.corps].sort((a, b) => (a.date < b.date ? -1 : 1)), [data.corps]);
  const chartData = sorted.slice(-14).map((e) => ({ date: fmtDateShort(e.date), weight: e.weight }));
  const history = [...sorted].reverse();

  return (
    <div className="px-5 pt-6 pb-4">
      <SectionHeader title="Corps" subtitle="Poids, tour de taille, sommeil, énergie." />

      {chartData.length > 1 ? (
        <div style={{ height: 170 }} className="-ml-2 mb-7">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.denim} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={COLORS.denim} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: COLORS.inkSoft }} axisLine={false} tickLine={false} width={36} />
              <Tooltip contentStyle={{ background: COLORS.surface, border: `1px solid ${COLORS.line}`, borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v} kg`, "Poids"]} />
              <Area type="monotone" dataKey="weight" stroke={COLORS.denim} strokeWidth={2} fill="url(#weightGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <SectionHeader title="Historique" />
      {history.length === 0 ? (
        <EmptyState text="Aucune mesure enregistrée pour l'instant." />
      ) : (
        <ul>
          {history.map((e) => {
            const key = `corps-${e.id}`;
            return (
              <li key={e.id} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                <div className="flex-1 min-w-0">
                  <p className={`${FONT_MONO} text-sm font-semibold`} style={{ color: COLORS.ink }}>{e.weight} kg</p>
                  <div className={`${FONT_SANS} text-xs mt-0.5 flex items-center gap-2 flex-wrap`} style={{ color: COLORS.inkSoft }}>
                    <span>{fmtDateShort(e.date)}</span>
                    {e.waist ? <span className="inline-flex items-center gap-1"><Ruler size={11} />{e.waist} cm</span> : null}
                    {e.sleep ? <span className="inline-flex items-center gap-1"><Moon size={11} />{e.sleep} h</span> : null}
                    {e.energy ? <span className="inline-flex items-center gap-1"><Zap size={11} />{e.energy}/5</span> : null}
                  </div>
                </div>
                <DeleteButton active={pendingDelete === key} onFirstTap={() => onDeleteFirst(key)} onConfirm={() => onDeleteConfirm("corps", e.id)} label={`la mesure du ${fmtDateShort(e.date)}`} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Écran Esthétique                                                    */
/* ------------------------------------------------------------------ */
function StreakGrid({ esthetique }) {
  const days = last14Days();
  const done = new Set(esthetique.filter((e) => e.routine).map((e) => e.date));
  return (
    <div className="grid grid-cols-7 gap-2 mb-7">
      {days.map((iso) => {
        const isDone = done.has(iso);
        const isToday = iso === todayISO();
        return (
          <div key={iso} className="flex flex-col items-center gap-1">
            <div
              className="w-full aspect-square rounded-lg flex items-center justify-center"
              style={{
                background: isDone ? COLORS.moss : COLORS.surface,
                border: `1px solid ${isDone ? COLORS.moss : COLORS.line}`,
                outline: isToday ? `2px solid ${COLORS.ink}` : "none",
                outlineOffset: "1.5px",
              }}
              title={fmtDateShort(iso)}
            >
              {isDone ? <Check size={13} color={COLORS.surface} /> : null}
            </div>
            <span className={`${FONT_MONO} text-[10px]`} style={{ color: COLORS.inkFaint }}>{fmtDateShort(iso).split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}

function EstheticView({ data, pendingDelete, onDeleteFirst, onDeleteConfirm }) {
  const history = useMemo(() => [...data.esthetique].sort((a, b) => (a.date < b.date ? 1 : -1)), [data.esthetique]);
  const streak = computeEstheticStreak(data.esthetique);

  return (
    <div className="px-5 pt-6 pb-4">
      <SectionHeader title="Esthétique" subtitle="Routine, confiance, régularité." />

      <div className="flex items-center gap-2 mb-4">
        <Flame size={16} color={COLORS.moss} />
        <span className={`${FONT_SANS} text-sm`} style={{ color: COLORS.ink }}>
          <span className={FONT_MONO} style={{ fontWeight: 600 }}>{streak}</span> {streak > 1 ? "jours" : "jour"} de suite
        </span>
      </div>

      <StreakGrid esthetique={data.esthetique} />

      <SectionHeader title="Historique" />
      {history.length === 0 ? (
        <EmptyState text="Aucune entrée pour l'instant." />
      ) : (
        <ul>
          {history.map((e) => {
            const key = `esthetique-${e.id}`;
            return (
              <li key={e.id} className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid ${COLORS.line}` }}>
                <div className="flex-1 min-w-0">
                  <p className={`${FONT_SANS} text-sm font-medium`} style={{ color: COLORS.ink }}>{e.routine ? "Routine faite" : "Routine non faite"}</p>
                  <div className={`${FONT_SANS} text-xs mt-0.5 flex items-center gap-2 flex-wrap`} style={{ color: COLORS.inkSoft }}>
                    <span className={FONT_MONO}>{fmtDateShort(e.date)}</span>
                    {e.mood ? <span className="inline-flex items-center gap-1"><Smile size={11} />{e.mood}/5</span> : null}
                  </div>
                  {e.notes ? <p className={`${FONT_SANS} text-xs mt-1`} style={{ color: COLORS.inkFaint }}>{e.notes}</p> : null}
                </div>
                <DeleteButton active={pendingDelete === key} onFirstTap={() => onDeleteFirst(key)} onConfirm={() => onDeleteConfirm("esthetique", e.id)} label={`l'entrée du ${fmtDateShort(e.date)}`} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Navigation basse                                                    */
/* ------------------------------------------------------------------ */
const TABS = [
  { id: "accueil", label: "Accueil", icon: Home },
  { id: "sport", label: "Sport", icon: Dumbbell },
  { id: "corps", label: "Corps", icon: Activity },
  { id: "esthetique", label: "Esthétique", icon: Sparkles },
];

function BottomNav({ active, onChange }) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 flex justify-center z-20"
      style={{ background: COLORS.surface, borderTop: `1px solid ${COLORS.line}` }}
    >
      <div className="w-full max-w-md flex">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="cc-focus flex-1 flex flex-col items-center gap-1 py-2.5"
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={20} color={isActive ? COLORS.ink : COLORS.inkFaint} strokeWidth={isActive ? 2.4 : 2} />
              <span className={`${FONT_SANS} text-[11px] font-medium`} style={{ color: isActive ? COLORS.ink : COLORS.inkFaint }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Fab({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cc-focus fixed z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
      style={{ background: COLORS.signal, right: "max(20px, calc(50% - 224px + 20px))", bottom: "84px" }}
      aria-label={label}
    >
      <Plus size={24} color={COLORS.surface} />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Réglages / réinitialisation                                         */
/* ------------------------------------------------------------------ */
function SettingsSheet({ open, onClose, onReset }) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => { if (!open) setConfirming(false); }, [open]);
  return (
    <BottomSheet open={open} onClose={onClose} title="Réglages">
      <p className={`${FONT_SANS} text-sm mb-3`} style={{ color: COLORS.inkSoft }}>
        Carnet — suivi personnel sport, corps et esthétique. Toutes les données restent stockées localement.
      </p>
      <a
        href={REPDB_ATTRIBUTION_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`${FONT_SANS} cc-focus text-sm inline-flex items-center gap-1.5`}
        style={{ color: COLORS.inkSoft }}
      >
        Illustrations d'exercices par RepDB (repdb.co)
        <ExternalLink size={13} />
      </a>
      <div style={{ height: "1px", background: COLORS.line, margin: "4px 0 20px" }} />
      <button
        type="button"
        onClick={() => (confirming ? onReset() : setConfirming(true))}
        className={`${FONT_SANS} cc-focus w-full py-3 rounded-lg text-sm font-semibold`}
        style={{ background: confirming ? COLORS.danger : COLORS.surface, color: confirming ? COLORS.surface : COLORS.danger, border: `1px solid ${COLORS.danger}` }}
      >
        {confirming ? "Confirmer la réinitialisation" : "Réinitialiser toutes les données"}
      </button>
      {confirming ? (
        <p className={`${FONT_SANS} text-xs mt-2 text-center`} style={{ color: COLORS.inkFaint }}>Cette action est définitive.</p>
      ) : null}
    </BottomSheet>
  );
}

/* ------------------------------------------------------------------ */
/* App                                                                  */
/* ------------------------------------------------------------------ */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [data, setData] = useState(EMPTY_DATA);
  const [sessionProgress, setSessionProgress] = useState(null);
  const [tab, setTab] = useState("accueil");
  const [view, setView] = useState("main"); // "main" | "session"
  const [finishOpen, setFinishOpen] = useState(false);
  const [addSheet, setAddSheet] = useState(null); // "sport" | "corps" | "esthetique" | null
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [, setTick] = useState(0);

  const deleteTimer = useRef(null);
  const toastTimer = useRef(null);

  const [sportForm, setSportForm] = useState({ date: todayISO(), type: "Séance A", duration: "", intensity: "Modérée", notes: "" });
  const [corpsForm, setCorpsForm] = useState({ date: todayISO(), weight: "", waist: "", sleep: "", energy: 3 });
  const [esthForm, setEsthForm] = useState({ date: todayISO(), routine: true, mood: 3, notes: "" });

  useEffect(() => {
    (async () => {
      const [d, s] = await Promise.all([
        storageGet(STORAGE_DATA_KEY, EMPTY_DATA),
        storageGet(STORAGE_SESSION_KEY, null),
      ]);
      setData({ sport: d.sport || [], corps: d.corps || [], esthetique: d.esthetique || [] });
      setSessionProgress(s);
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) storageSet(STORAGE_DATA_KEY, data); }, [data, loaded]);
  useEffect(() => {
    if (!loaded) return;
    if (sessionProgress) storageSet(STORAGE_SESSION_KEY, sessionProgress);
    else storageDelete(STORAGE_SESSION_KEY);
  }, [sessionProgress, loaded]);

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === "hidden" && sessionProgress) storageSet(STORAGE_SESSION_KEY, sessionProgress);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [sessionProgress]);

  useEffect(() => {
    if (view !== "session") return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [view]);

  function showToast(msg) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2500);
  }

  function requestDelete(key) {
    setPendingDelete(key);
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    deleteTimer.current = setTimeout(() => setPendingDelete(null), 3000);
  }

  function confirmDelete(category, id) {
    setData((d) => ({ ...d, [category]: d[category].filter((e) => e.id !== id) }));
    setPendingDelete(null);
    showToast("Entrée supprimée");
  }

  function startWorkout(letter) {
    if (sessionProgress && sessionProgress.workout !== letter) {
      showToast(`Termine ou abandonne la séance ${sessionProgress.workout} d'abord`);
      return;
    }
    if (!sessionProgress) {
      const exercises = WORKOUTS[letter].exercises;
      const progress = {};
      exercises.forEach((ex, i) => { progress[i] = Array(ex.sets).fill(false); });
      setSessionProgress({ workout: letter, startedAt: Date.now(), progress });
    }
    setView("session");
  }

  function toggleSet(exIdx, setIdx) {
    setSessionProgress((sp) => {
      if (!sp) return sp;
      const current = sp.progress[exIdx] || [];
      const updated = [...current];
      updated[setIdx] = !updated[setIdx];
      return { ...sp, progress: { ...sp.progress, [exIdx]: updated } };
    });
  }

  function abandonSession() {
    setSessionProgress(null);
    setView("main");
  }

  function finishSession(intensity, notes) {
    if (!sessionProgress) return;
    const durationMin = Math.max(1, Math.round((Date.now() - sessionProgress.startedAt) / 60000));
    const entry = {
      id: uid(),
      date: todayISO(),
      type: `Séance ${sessionProgress.workout}`,
      duration: durationMin,
      intensity,
      notes,
    };
    setData((d) => ({ ...d, sport: [...d.sport, entry] }));
    setSessionProgress(null);
    setFinishOpen(false);
    setView("main");
    setTab("sport");
    showToast(`Séance enregistrée · ${fmtDuration(durationMin)}`);
  }

  function submitSport() {
    const duration = parseInt(sportForm.duration, 10);
    if (!duration || duration <= 0) return;
    const entry = { id: uid(), date: sportForm.date, type: sportForm.type, duration, intensity: sportForm.intensity, notes: sportForm.notes };
    setData((d) => ({ ...d, sport: [...d.sport, entry] }));
    setAddSheet(null);
    setSportForm({ date: todayISO(), type: "Séance A", duration: "", intensity: "Modérée", notes: "" });
    showToast("Séance ajoutée");
  }

  function submitCorps() {
    const weight = parseFloat(corpsForm.weight);
    if (!weight) return;
    const entry = {
      id: uid(),
      date: corpsForm.date,
      weight,
      waist: corpsForm.waist ? parseFloat(corpsForm.waist) : null,
      sleep: corpsForm.sleep ? parseFloat(corpsForm.sleep) : null,
      energy: corpsForm.energy,
    };
    setData((d) => ({ ...d, corps: [...d.corps, entry] }));
    setAddSheet(null);
    setCorpsForm({ date: todayISO(), weight: "", waist: "", sleep: "", energy: 3 });
    showToast("Mesure ajoutée");
  }

  function submitEsth() {
    const entry = { id: uid(), date: esthForm.date, routine: esthForm.routine, mood: esthForm.mood, notes: esthForm.notes };
    setData((d) => ({ ...d, esthetique: [...d.esthetique, entry] }));
    setAddSheet(null);
    setEsthForm({ date: todayISO(), routine: true, mood: 3, notes: "" });
    showToast("Entrée ajoutée");
  }

  function handleReset() {
    setData(EMPTY_DATA);
    setSessionProgress(null);
    setSettingsOpen(false);
    showToast("Données réinitialisées");
  }

  const addLabels = { sport: "une séance", corps: "une mesure", esthetique: "une entrée" };

  return (
    <div className="min-h-screen w-full flex justify-center" style={{ background: COLORS.paperRaised }}>
      <GlobalStyle />
      <div className="w-full max-w-md relative" style={{ background: COLORS.paper, minHeight: "100vh" }}>
        {view === "session" && sessionProgress ? (
          <SessionRunner
            workout={sessionProgress.workout}
            sessionProgress={sessionProgress}
            onToggleSet={toggleSet}
            onAbandon={abandonSession}
            onOpenFinish={() => setFinishOpen(true)}
          />
        ) : (
          <>
            {tab === "accueil" ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  className="cc-focus absolute top-6 right-5 p-2 rounded-full"
                  style={{ color: COLORS.inkFaint }}
                  aria-label="Réglages"
                >
                  <Settings size={19} />
                </button>
                <HomeView data={data} />
              </div>
            ) : null}
            {tab === "sport" ? (
              <SportView
                data={data}
                sessionProgress={sessionProgress}
                onStartWorkout={startWorkout}
                onResumeSession={() => setView("session")}
                onAbandonSession={abandonSession}
                pendingDelete={pendingDelete}
                onDeleteFirst={requestDelete}
                onDeleteConfirm={confirmDelete}
              />
            ) : null}
            {tab === "corps" ? (
              <CorpsView data={data} pendingDelete={pendingDelete} onDeleteFirst={requestDelete} onDeleteConfirm={confirmDelete} />
            ) : null}
            {tab === "esthetique" ? (
              <EstheticView data={data} pendingDelete={pendingDelete} onDeleteFirst={requestDelete} onDeleteConfirm={confirmDelete} />
            ) : null}

            <div style={{ height: "80px" }} />

            {tab !== "accueil" ? (
              <Fab onClick={() => setAddSheet(tab)} label={`Ajouter ${addLabels[tab]}`} />
            ) : null}

            <BottomNav active={tab} onChange={setTab} />
          </>
        )}

        <FinishSessionSheet
          open={finishOpen && !!sessionProgress}
          workout={sessionProgress ? sessionProgress.workout : ""}
          onClose={() => setFinishOpen(false)}
          onSave={finishSession}
        />

        <BottomSheet open={addSheet === "sport"} onClose={() => setAddSheet(null)} title="Ajouter une séance">
          <SportForm values={sportForm} setValues={setSportForm} onSubmit={submitSport} />
        </BottomSheet>
        <BottomSheet open={addSheet === "corps"} onClose={() => setAddSheet(null)} title="Ajouter une mesure">
          <CorpsForm values={corpsForm} setValues={setCorpsForm} onSubmit={submitCorps} />
        </BottomSheet>
        <BottomSheet open={addSheet === "esthetique"} onClose={() => setAddSheet(null)} title="Ajouter une entrée">
          <EsthetiqueForm values={esthForm} setValues={setEsthForm} onSubmit={submitEsth} />
        </BottomSheet>

        <SettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} onReset={handleReset} />

        <Toast message={toast} />
      </div>
    </div>
  );
}
