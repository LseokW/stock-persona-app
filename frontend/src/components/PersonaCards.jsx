import { PERSONAS, PERSONA_ORDER } from "../constants/personas";

export default function PersonaCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {PERSONA_ORDER.map((id) => {
        const p = PERSONAS[id];
        return (
          <div
            key={id}
            className="bg-white rounded-lg shadow-sm border p-4 border-l-4"
            style={{ borderLeftColor: p.color }}
          >
            <h3 className="font-bold text-gray-900">{p.name}</h3>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{p.description}</p>
          </div>
        );
      })}
    </div>
  );
}
