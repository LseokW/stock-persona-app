import { useState } from "react";

const SUGGESTED = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "WMT"];

export default function TickerInput({ onSubmit, disabled }) {
  const [value, setValue] = useState("AAPL");

  const submit = () => {
    if (!value.trim()) return;
    onSubmit(value.trim().toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        종목 티커 입력
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="AAPL"
          disabled={disabled}
        />
        <button
          onClick={submit}
          disabled={disabled}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
        >
          백테스트 실행
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-gray-500">추천:</span>
        {SUGGESTED.map((t) => (
          <button
            key={t}
            onClick={() => setValue(t)}
            disabled={disabled}
            className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
