// src/pages/ViewPoll.tsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "qrcode";
import { Poll, PollOption } from "../types/poll";

export default function ViewPoll() {
  const { id } = useParams<{ id: string }>();
  const API_BASE = import.meta.env.VITE_API_URL || "https://pollapp-backend-production.up.railway.app";
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [voteStatus, setVoteStatus] = useState("");
  const [votedPolls, setVotedPolls] = useState<{ [pollId: string]: number }>({});
  const [expired, setExpired] = useState(false);
  const [autoInsight, setAutoInsight] = useState("");
  const [hideResultsUntilVoted, setHideResultsUntilVoted] = useState(false);

  // Fetch poll data
  const fetchPoll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/poll/${id}`);
      if (!res.ok) throw new Error("Poll not found");

      const data = await res.json();
      const pollData: Poll = {
        _id: data.poll._id,
        question: data.poll.question,
        options: data.poll.options?.map((o: PollOption) => ({
          text: o.text,
          votes: o.votes ?? 0,
        })) || [],
        createdAt: data.poll.createdAt,
        ttl: data.poll.ttl,
      };

      setPoll(pollData);

      // Check expiration
      const ttlMs = (pollData.ttl ?? 24) * 60 * 60 * 1000;
      const now = new Date();
      const created = new Date(pollData.createdAt ?? now.toISOString());
      setExpired(now.getTime() - created.getTime() > ttlMs);

      // Generate QR code
      const qr = await QRCode.toDataURL(`${window.location.origin}/poll/${pollData._id}`);
      setQrCodeData(qr);

      setAutoInsight(data.autoInsight || "");
      setHideResultsUntilVoted(!!data.hideResultsUntilVoted);
      setLoading(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error fetching poll");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoll();

    // Live results via SSE - FIXED URL
    if (!id) return;
    const evtSource = new EventSource(`${API_BASE}/api/poll/${id}/results-stream`);
    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPoll((prev) =>
        prev ? { ...prev, options: data.options?.map((o: PollOption) => ({
          text: o.text,
          votes: o.votes ?? 0,
        })) || [] } : prev
      );
    };
    evtSource.onerror = () => evtSource.close();

    return () => evtSource.close();
  }, [id]);

  const vote = async (optionIndex: number) => {
    if (!poll) return;
    try {
      // Ensure per-poll idempotency key in localStorage
      const storageKey = `poll:idempotency:${poll._id}`;
      let idem = localStorage.getItem(storageKey);
      if (!idem) {
        const generated = (typeof crypto !== "undefined" && (crypto as any).randomUUID)
          ? (crypto as any).randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(storageKey, generated);
        idem = generated;
      }
      
      // FIXED URL
      const res = await fetch(`${API_BASE}/api/poll/${poll._id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: optionIndex, idempotencyKey: idem }),
      });

      if (res.ok) {
        setVoteStatus("Vote submitted successfully!");
        setVotedPolls((prev) => {
          const next = { ...prev, [poll._id]: optionIndex };
          localStorage.setItem("poll:votedIndex", JSON.stringify(next));
          return next;
        });
      } else {
        setVoteStatus("You've already voted or poll expired.");
      }

      fetchPoll(); // refresh poll data
    } catch (err) {
      console.error(err);
      setVoteStatus("Error submitting vote.");
    }
  };

  useEffect(() => {
    // load voted indexes from localStorage to persist highlight
    try {
      const raw = localStorage.getItem("poll:votedIndex");
      if (raw) setVotedPolls(JSON.parse(raw));
    } catch {}
  }, []);

  if (loading) return <p>Loading poll...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!poll) return <p style={{ color: "red" }}>Poll not found</p>;

  const totalVotes = poll.options?.reduce((sum, o) => sum + (o.votes ?? 0), 0) ?? 0;
  const maxVotes = Math.max(...(poll.options?.map(o => o.votes ?? 0) ?? [0]));

  const votingDisabled = expired || votedPolls[poll._id] !== undefined;
  const hasVoted = votedPolls[poll._id] !== undefined;

  return (
    <div className="poll-preview-container">
      <h1>{poll.question}</h1>

      {!votingDisabled ? (
        <div className="mb-6">
          {poll.options?.map((opt, i) => (
            <label key={i} className="poll-option-label">
              <input type="radio" name={`poll-${poll._id}`} onChange={() => vote(i)} />
              {opt.text}
            </label>
          ))}
          {voteStatus && <p className="poll-status mt-2">{voteStatus}</p>}
        </div>
      ) : expired ? (
        <p className="poll-status text-red-600">Poll has expired. Voting closed.</p>
      ) : (
        <p className="poll-status text-green-600">You've already voted in this poll!</p>
      )}

      <h3>Live Results</h3>
      {autoInsight && (
        <p className="mt-2 font-semibold" style={{ color: "#4caf50" }}>{autoInsight}</p>
      )}
      {hideResultsUntilVoted && !hasVoted ? (
        <p className="poll-status">Results are hidden until you vote.</p>
      ) : poll.options?.map((opt, i) => {
        const percent = totalVotes ? ((opt.votes ?? 0) / totalVotes) * 100 : 0;
        const isLeader = (opt.votes ?? 0) === maxVotes && maxVotes > 0;
        return (
          <div key={i} className="mb-2">
            <span>{opt.text}</span>
            <div className="poll-result-bar">
              <div
                className={`poll-result-fill ${isLeader ? "poll-result-leader" : ""}`}
                style={{ width: percent + "%" }}
              />
            </div>
            <div className="poll-result-text">
              <span>{opt.votes ?? 0} votes</span>
              <span>{percent.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
      <p className="mt-2 font-semibold">Total votes: {totalVotes}</p>

      <h3 className="mt-6">Share this poll</h3>
      <p className="poll-share-link">{`${window.location.origin}/poll/${poll._id}`}</p>
      {qrCodeData && <img src={qrCodeData} alt={`QR Code for poll: ${poll.question}`} className="poll-qr-code" />}
    </div>
  );
}
