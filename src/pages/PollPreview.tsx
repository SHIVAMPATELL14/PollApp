import { useEffect, useState } from "react";
import { Poll, PollOption } from "../types/poll";

interface PollPreviewProps {
  poll: Poll;
  pollUrl: string;
  qrCodeData?: string;
  expired: boolean;
  votedIndex: number | null;
  onVote: (optionIndex: number) => void;
}

export default function PollPreview({
  poll,
  pollUrl,
  qrCodeData,
  expired,
  votedIndex,
  onVote,
}: PollPreviewProps) {
  const options = poll.options || [];
  const [selected, setSelected] = useState<number | null>(null);
  const [voteStatus, setVoteStatus] = useState("");
  const [results, setResults] = useState<PollOption[]>(options);
  const [totalVotes, setTotalVotes] = useState(
    options.reduce((sum, o) => sum + o.votes, 0)
  );

  // Live results via SSE
  useEffect(() => {
    if (!poll._id) return;
    const evtSource = new EventSource(`/api/poll/${poll._id}/results-stream`);
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const updatedOptions: PollOption[] = data.options || [];
      setResults(updatedOptions);
      setTotalVotes(data.totalVotes || 0);
    };
    evtSource.onerror = () => evtSource.close();
    return () => evtSource.close();
  }, [poll._id]);

  const handleVote = (e: React.FormEvent) => {
    e.preventDefault();
    if (selected === null) return;
    onVote(selected);
    setVoteStatus("Vote submitted!");
  };

  const maxVotes = Math.max(...results.map((o) => o.votes));

  return (
    <div className="poll-preview-container">
      <h1>{poll.question}</h1>

      {!expired && votedIndex === null ? (
        <form onSubmit={handleVote}>
          {options.map((opt, i) => (
            <label key={i} className="poll-option-label">
              <input
                type="radio"
                name={`option-${poll._id}`}
                value={i}
                onChange={() => setSelected(i)}
                required
              />
              {opt.text}
            </label>
          ))}
          <button type="submit" className="vote-button" disabled={votedIndex !== null}>
            Vote
          </button>
          {voteStatus && <p className="poll-result-text">{voteStatus}</p>}
        </form>
      ) : expired ? (
        <p className="poll-result-text" style={{ color: "#ff4d4f" }}>Poll has expired.</p>
      ) : (
        <p className="poll-result-text" style={{ color: "#4caf50" }}>You’ve already voted!</p>
      )}

      {/* Live Results */}
      <h3>Live Results</h3>
      {results.map((opt, i) => {
        const percent = totalVotes ? ((opt.votes / totalVotes) * 100).toFixed(1) : 0;
        const isLeader = opt.votes === maxVotes && maxVotes > 0;
        return (
          <div key={i} className="mb-2">
            <span>{opt.text}</span>
            <div className="poll-result-bar">
              <div
                className="poll-result-fill"
                style={{ width: percent + "%", backgroundColor: isLeader ? "#646cff" : "#666" }}
              />
            </div>
            <span className="poll-result-text">{opt.votes} votes</span>
          </div>
        );
      })}
      <p className="poll-result-text">Total votes: {totalVotes}</p>

      {/* Share Section */}
      <h3>Share this poll</h3>
      <p>
        Link: <a className="poll-share-link" href={pollUrl}>{pollUrl}</a>
      </p>
      {qrCodeData && <img src={qrCodeData} alt={`QR Code for ${poll.question}`} className="poll-qr-code" />}
    </div>
  );
}
