import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

export default function AddPoll() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]); // start with 2 empty options
  const [ttl, setTtl] = useState(24);
  const [error, setError] = useState("");
  const [hideResultsUntilVoted, setHideResultsUntilVoted] = useState(false);
  const navigate = useNavigate();

  // Add a new option field (max 4)
  const addOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  // Remove an option field (min 2)
  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (value: string, index: number) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (question.length > 120) {
      setError("Question cannot exceed 120 characters.");
      return;
    }

    const filledOptions = options.map(o => o.trim()).filter(o => o.length > 0);
    if (filledOptions.length < 2) {
      setError("Please provide at least 2 options.");
      return;
    }

    if (ttl <= 0 || ttl > 24) {
      setError("TTL must be between 1 and 24 hours.");
      return;
    }

    const optionsPayload = filledOptions.map(text => ({ text }));

    const res = await fetch("/api/poll/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        options: optionsPayload,
        ttl: ttl * 60 * 60 * 1000,
        hideResultsUntilVoted
      })
    });

    if (res.ok) {
      const data = await res.json();
      navigate(`/poll/${data.poll._id}`);
    } else {
      setError("Failed to create poll. Please try again.");
    }
  };

  return (
    <div className="addPoll-container">
      <h1 style={{ color: "#fff" }}>Add Poll</h1>
      <form className="addPoll-form" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="question">Question:</label>
          <input
            id="question"
            type="text"
            value={question}
            maxLength={120}
            onChange={e => setQuestion(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Options:</label>
          {options.map((option, index) => (
            <div key={index} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <input
                type="text"
                value={option}
                onChange={e => handleOptionChange(e.target.value, index)}
                required
                placeholder={`Option ${index + 1}`}
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  style={{ background: "#ff4d4f", color: "#fff", borderRadius: "4px", padding: "0 0.5rem" }}
                >
                  X
                </button>
              )}
            </div>
          ))}
          {options.length < 4 && (
            <button type="button" onClick={addOption} className="add-option-btn">
              + Add Option
            </button>
          )}
        </div>

        <div>
          <label htmlFor="ttl">TTL (hours, 1-24):</label>
          <input
            id="ttl"
            type="number"
            value={ttl}
            min={1}
            max={24}
            onChange={e => setTtl(Number(e.target.value))}
            required
          />
        </div>

        <div style={{ marginTop: "0.5rem" }}>
          <label>
            <input
              type="checkbox"
              checked={hideResultsUntilVoted}
              onChange={e => setHideResultsUntilVoted(e.target.checked)}
            />{" "}
            Hide results until a user has voted
          </label>
        </div>

        {error && <p className="addPoll-error">{error}</p>}

        <Button type="submit">Create Poll</Button>
      </form>
    </div>
  );
}
