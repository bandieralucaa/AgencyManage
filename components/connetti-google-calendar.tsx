'use client'

export default function ConnettiGoogleCalendar() {
  function handleConnetti() {
    window.location.href = '/api/google/connect'
  }

  return (
    <button
      onClick={handleConnetti}
      className="bg-white hover:bg-slate-100 text-slate-900 font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
    >
      🔗 Connetti Google Calendar
    </button>
  )
}