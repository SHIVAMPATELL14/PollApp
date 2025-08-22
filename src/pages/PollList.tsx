// src/pages/PollList.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { Poll } from "../types/poll";

export default function PollList() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [qrCodes, setQrCodes] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const res = await fetch("/api/");
        if (!res.ok) throw new Error("Failed to fetch polls.");
        const data: Poll[] = await res.json();

        // Normalize options votes
        const normalized = data.map((poll) => ({
          ...poll,
          options: poll.options?.map((o) => ({ text: o.text, votes: o.votes ?? 0 })) || [],
        }));
        setPolls(normalized);

        // Generate QR codes for each poll
        const qrMap: { [id: string]: string } = {};
        for (const poll of normalized) {
          qrMap[poll._id] = await QRCode.toDataURL(`${window.location.origin}/poll/${poll._id}`);
        }
        setQrCodes(qrMap);

        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Error fetching polls.");
        setLoading(false);
      }
    };

    fetchPolls();
  }, []);

  if (loading) return <p>Loading polls...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (polls.length === 0) return <p>No polls found.</p>;

  return (
    <div className="poll-list-container">
      <h2 className="poll-list-title">All Polls</h2>

      {polls.map((poll) => {
        const ttlMs = (poll.ttl ?? 24) * 60 * 60 * 1000;
        const now = new Date();
        const created = poll.createdAt ? new Date(poll.createdAt) : new Date();
        const expired = now.getTime() - created.getTime() > ttlMs;

        return (
          <Link
            key={poll._id}
            to={`/poll/${poll._id}`}
            className={`poll-card ${expired ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <h3 className="poll-card-title">{poll.question}</h3>
            <p className="poll-card-desc">{poll.options?.map((o) => o.text).join(", ")}</p>
          </Link>
        );
      })}
    </div>
  );
}

