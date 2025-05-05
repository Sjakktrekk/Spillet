export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center items-center">
      <div className="bg-yellow-400 p-8 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Tailwind CSS Test
        </h1>
        <p className="text-gray-800 mb-4">
          Hvis du kan se denne boksen med gul bakgrunn og svart tekst, fungerer Tailwind CSS!
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Test Knapp
        </button>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="bg-red-500 p-4 rounded text-white font-bold">Rød</div>
        <div className="bg-green-500 p-4 rounded text-white font-bold">Grønn</div>
        <div className="bg-blue-500 p-4 rounded text-white font-bold">Blå</div>
      </div>
    </div>
  )
} 