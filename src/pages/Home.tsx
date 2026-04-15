export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-6 gap-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold tracking-tight text-white mb-2">
          Vibe<span className="text-purple-400">Debate</span>
        </h1>
        <p className="text-gray-400 text-lg">AI-powered debate battles between friends</p>
      </div>

      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Start a Debate */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-xl mb-4">Start a Debate</h2>
          <p className="text-gray-500 text-sm">Coming soon — session creation</p>
        </section>

        {/* Join a Debate */}
        <section className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-xl mb-4">Join a Debate</h2>
          <p className="text-gray-500 text-sm">Coming soon — join by code</p>
        </section>
      </div>
    </main>
  )
}
