import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useParams } from "react-router-dom";
import { InlineSpinner } from "./Spinner";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function OverallSummaryDetail() {
  const { id } = useParams();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    setSummary(null);
    axios
      .get(`${BACKEND_URL}/api/overall-summary/${id}`)
      .then((res) => setSummary(res.data))
      .catch(() => setError("Failed to fetch summary."))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob(
      [
        typeof summary.finalSummary === "string"
          ? summary.finalSummary
          : JSON.stringify(summary, null, 2),
      ],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `overall-summary-${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Breadcrumbs
  const breadcrumbs = (
    <nav className="text-sm mb-4" aria-label="Breadcrumb">
      <ol className="list-reset flex text-[#7f5af0]">
        <li>
          <Link to="/" className="hover:underline">
            Home
          </Link>
        </li>
        <li>
          <span className="mx-2">&gt;</span>
        </li>
        <li className="text-[#2cb67d] font-semibold">OverallSummary-{id}</li>
      </ol>
    </nav>
  );

  if (!id) return null;
  if (loading) return <InlineSpinner text="Loading summary..." />;
  if (error) return <div className="p-8 text-red-400">{error}</div>;
  if (!summary) return null;

  return (
    <div className="p-8 flex-1 min-h-screen bg-gradient-to-br from-[#18181b] via-[#23272f] to-[#1e1b4b] text-[#e0e7ef]">
      <div className="max-w-2xl mx-auto bg-[#23272f] shadow-2xl rounded-xl px-10 pt-8 pb-10 border-2 border-[#7f5af0]">
        {breadcrumbs}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-extrabold" style={{ color: "#7f5af0" }}>
            {summary.caseId || summary._id}
          </h1>
          <button
            onClick={handleDownload}
            className="bg-[#7f5af0] hover:bg-[#2cb67d] text-white font-bold py-2 px-4 rounded-lg"
          >
            Download
          </button>
        </div>
        <pre className="whitespace-pre-wrap bg-[#18181b] p-4 rounded text-[#e0e7ef] border border-[#7f5af0] text-lg overflow-x-auto">
          {summary.finalSummary || JSON.stringify(summary, null, 2)}
        </pre>
        {summary.pros && summary.pros.length > 0 && (
          <section className="mt-4">
            <h3 className="font-bold text-green-400 text-lg mb-1">Pros</h3>
            <ul className="list-disc pl-6">
              {summary.pros.map((pro, i) => (
                <li key={i} className="text-green-300">
                  {pro}
                </li>
              ))}
            </ul>
          </section>
        )}
        {summary.cons && summary.cons.length > 0 && (
          <section className="mt-4">
            <h3 className="font-bold text-red-400 text-lg mb-1">Cons</h3>
            <ul className="list-disc pl-6">
              {summary.cons.map((con, i) => (
                <li key={i} className="text-red-300">
                  {con}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export default OverallSummaryDetail;
