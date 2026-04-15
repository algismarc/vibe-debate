import { useParams } from 'react-router-dom'

export default function Join() {
  const { joinCode } = useParams<{ joinCode: string }>()

  return (
    <main className="flex flex-col items-center justify-center min-h-svh p-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Join Debate</h1>
        <p className="text-gray-400">Code: <span className="font-mono text-purple-400">{joinCode}</span></p>
        <p className="text-gray-500 text-sm mt-4">Join UI coming in Phase 3</p>
      </div>
    </main>
  )
}
