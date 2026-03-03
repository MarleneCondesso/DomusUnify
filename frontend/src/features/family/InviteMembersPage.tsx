import { useNavigate, useParams } from 'react-router-dom'
import type { FamilyResponse } from '../../api/domusApi'

type Props = {
  family: FamilyResponse
}

export function InviteMembersPage({ family }: Props) {
  const navigate = useNavigate()
  const { familyId } = useParams<{ familyId: string }>()

  const familyName = (family.name ?? '').trim() || 'Grupo'

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Fechar"
            onClick={() => navigate('/')}
          >
            <i className="ri-close-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-charcoal">Convidar membro</div>

          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Concluir"
            onClick={() => navigate('/')}
          >
            <i className="ri-check-line text-2xl leading-none text-sage-dark" />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6">
        <div className="mb-5 rounded-2xl bg-white px-4 py-3 shadow-sm flex items-center gap-2">
          <i className="ri-search-line text-xl text-gray-400" />
          <input
            placeholder="Busca"
            className="w-full bg-transparent py-2 text-base text-charcoal outline-none placeholder:text-gray-400"
          />
        </div>

        <section className="rounded-2xl bg-white shadow-sm divide-y divide-gray-100">
          <OptionRow
            iconWrap="bg-rose-500/10 text-rose-500"
            icon="ri-mail-line"
            title="Convidar novo membro"
            subtitle="Convidar por e-mail ou SMS"
            onClick={() => navigate(`/groups/invite/${familyId}/direct`)}
          />

          <OptionRow
            iconWrap="bg-amber/15 text-amber-dark"
            icon="ri-emotion-happy-line"
            title="Criar uma Conta para uma criança"
            subtitle="Para crianças sem e-mail ou celular"
            onClick={() => navigate(`/groups/invite/${familyId}/child`)}
          />

          <OptionRow
            iconWrap="bg-sky-500/10 text-sky-600"
            icon="ri-group-line"
            title="Membros de outros círculos"
            subtitle="Convide membros de seus outros grupos"
            onClick={() => navigate(`/groups/invite/${familyId}/others`)}
          />

          <OptionRow
            iconWrap="bg-emerald-500/10 text-emerald-600"
            icon="ri-link"
            title="Convidar com um link"
            subtitle="Compartilhe seu link de convite"
            onClick={() => navigate(`/groups/invite/${familyId}/link`)}
          />
        </section>

        <div className="mt-6 text-sm text-gray-500">
          Você está convidando membros para <span className="font-semibold text-charcoal">{familyName}</span>.
        </div>
      </main>
    </div>
  )
}

function OptionRow({
  icon,
  title,
  subtitle,
  onClick,
  iconWrap,
}: {
  icon: string
  title: string
  subtitle: string
  onClick: () => void
  iconWrap: string
}) {
  return (
    <button type="button" className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-sand-light" onClick={onClick}>
      <div className={`grid h-12 w-12 place-items-center rounded-full ${iconWrap}`}>
        <i className={`${icon} text-2xl`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold text-charcoal">{title}</div>
        <div className="text-sm text-gray-500 truncate">{subtitle}</div>
      </div>
      <i className="ri-arrow-right-s-line text-2xl leading-none text-gray-300" />
    </button>
  )
}

