"use client";

import { useState } from "react";

export default function TestMCPPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testMCP = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/test-mcp-client");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test MCP client");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">MCP Client Test</h1>

      <button
        onClick={testMCP}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
        {loading ? "Testing..." : "Test MCP Client"}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-800 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result:</h2>
          <pre className="p-4 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
