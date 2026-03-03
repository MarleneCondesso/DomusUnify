import { useNavigate } from 'react-router-dom'

export function InviteChildAccountPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Voltar"
            onClick={() => navigate(-1)}
          >
            <i className="ri-arrow-left-line text-2xl leading-none text-sage-dark" />
          </button>
          <div className="text-lg font-bold text-charcoal">Conta para uma criança</div>
          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-12">
        <div className="rounded-3xl bg-white p-6 shadow-sm text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-amber/10 text-amber-dark">
            <i className="ri-emotion-happy-line text-3xl" />
          </div>
          <h1 className="text-3xl font-extrabold text-charcoal mb-3">Conta para uma criança</h1>
          <p className="text-sm text-gray-600">
            Este fluxo (senha, ID FamilyWall, aniversário e nome) será implementado em seguida.
          </p>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600"
            onClick={() => navigate(-1)}
          >
            Voltar <i className="ri-arrow-right-line text-lg leading-none" />
          </button>
        </div>
      </main>
    </div>
  )
}

