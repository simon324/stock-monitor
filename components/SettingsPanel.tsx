"use client";

import { useState } from "react";

export const MODEL_PRESETS = [
  { id: "openai/gpt-4o-mini", label: "GPT-4o mini — cheap & fast" },
  { id: "openai/gpt-4o", label: "GPT-4o" },
  { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { id: "google/gemini-flash-1.5", label: "Gemini 1.5 Flash" },
  { id: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
];

const PRESET_IDS = MODEL_PRESETS.map((m) => m.id);

export default function SettingsPanel({
  apiKey,
  model,
  onSave,
  onClose,
}: {
  apiKey: string;
  model: string;
  onSave: (key: string, model: string) => void;
  onClose: () => void;
}) {
  const startsCustom = !!model && !PRESET_IDS.includes(model);
  const [key, setKey] = useState(apiKey);
  const [sel, setSel] = useState(
    startsCustom ? "custom" : model || "openai/gpt-4o-mini",
  );
  const [custom, setCustom] = useState(startsCustom ? model : "");

  function handleSave() {
    const chosen = sel === "custom" ? custom.trim() : sel;
    onSave(key.trim(), chosen || "openai/gpt-4o-mini");
    onClose();
  }

  return (
    <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
          AI research settings
        </h3>
        <button
          onClick={onClose}
          className="rounded-md px-1.5 text-neutral-400 hover:text-neutral-700"
        >
          ✕
        </button>
      </div>

      <label className="mb-1 block text-xs font-medium text-neutral-600">
        OpenRouter API key
      </label>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-or-v1-…"
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5"
      />
      <p className="mt-1 text-[11px] text-neutral-400">
        Stored only in your browser. Get a key at{" "}
        <a
          href="https://openrouter.ai/keys"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-600 underline hover:text-neutral-900"
        >
          openrouter.ai/keys
        </a>
        .
      </p>

      <label className="mb-1 mt-4 block text-xs font-medium text-neutral-600">
        Model
      </label>
      <select
        value={sel}
        onChange={(e) => setSel(e.target.value)}
        className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5"
      >
        {MODEL_PRESETS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
        <option value="custom">Custom model ID…</option>
      </select>
      {sel === "custom" && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="e.g. mistralai/mistral-large"
          className="mt-2 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-neutral-400 focus:ring-4 focus:ring-neutral-900/5"
        />
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 rounded-lg bg-neutral-900 py-2 text-sm font-medium text-white transition hover:bg-neutral-700"
        >
          Save
        </button>
        <button
          onClick={() => {
            setKey("");
            onSave("", sel === "custom" ? custom.trim() : sel);
          }}
          className="rounded-lg border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50"
        >
          Clear key
        </button>
      </div>
    </div>
  );
}
