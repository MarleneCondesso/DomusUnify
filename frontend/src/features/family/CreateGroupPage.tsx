import { useMemo, useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { domusApi, type FamilyResponse } from '../../api/domusApi'
import { queryKeys } from '../../api/queryKeys'

type Props = {
  token: string
}

export function CreateGroupPage({ token }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const fileRef = useRef<HTMLInputElement | null>(null)

  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [name, setName] = useState('')

  const canCreate = Boolean(name.trim())

  const createMutation = useMutation({
    mutationFn: () => domusApi.createFamily(token, { name: name.trim() }),
    onSuccess: (family) => {
      queryClient.clear()
      queryClient.setQueryData<FamilyResponse>(queryKeys.familyMe, family)

      const id = family.id
      if (id) {
        navigate(`/groups/invite/${id}`, { replace: true })
      } else {
        navigate('/', { replace: true })
      }
    },
  })

  const submit = () => {
    if (!canCreate || createMutation.isPending) return
    createMutation.mutate()
  }

  const pickCover = async (file: File | null) => {
    if (!file) return
    try {
      const dataUrl = await fileToDataUrl(file)
      setCoverUrl(dataUrl)
    } catch {
      // ignore
    }
  }

  const errorMessage = useMemo(() => {
    const err = createMutation.error
    if (!err) return null
    return typeof err === 'string' ? err : String(err)
  }, [createMutation.error])

  return (
    <div className="min-h-screen bg-offwhite w-full">
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-full hover:bg-sand-light"
            aria-label="Fechar"
            onClick={() => navigate(-1)}
            disabled={createMutation.isPending}
          >
            <i className="ri-close-line text-2xl leading-none text-sage-dark" />
          </button>

          <div className="text-lg font-bold text-charcoal">Novo Grupo</div>

          <div className="h-12 w-12" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 space-y-6">
        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 whitespace-pre-wrap">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          className="relative w-full overflow-hidden rounded-3xl bg-sand-light"
          onClick={() => fileRef.current?.click()}
          disabled={createMutation.isPending}
        >
          <div className="aspect-[16/7] w-full">
            {coverUrl ? (
              <img src={coverUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-linear-to-br from-sage-light to-sand" />
            )}
          </div>

          <div className="absolute inset-0 grid place-items-center">
            <div className="flex items-center gap-3 rounded-full bg-black/30 px-5 py-3 text-white">
              <i className="ri-camera-line text-2xl" />
              <span className="text-base font-semibold">Adicionar foto de capa</span>
            </div>
          </div>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null
            void pickCover(file)
            e.target.value = ''
          }}
        />

        <div className="rounded-2xl bg-white shadow-sm px-4 py-3 flex items-center gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nomeie o seu Grupo"
            className="w-full bg-transparent py-2 text-lg text-charcoal outline-none placeholder:text-gray-400"
            disabled={createMutation.isPending}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return
              e.preventDefault()
              submit()
            }}
          />
          {name.trim() ? (
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
              aria-label="Limpar"
              onClick={() => setName('')}
              disabled={createMutation.isPending}
            >
              <i className="ri-close-line text-xl leading-none" />
            </button>
          ) : null}
        </div>

        <button
          type="button"
          className="w-full rounded-full bg-blue-500 px-6 py-4 text-center text-lg font-extrabold text-white shadow-lg hover:bg-blue-600 disabled:opacity-60"
          onClick={submit}
          disabled={!canCreate || createMutation.isPending}
        >
          {createMutation.isPending ? 'Criando...' : 'CRIAR'}
        </button>
      </main>
    </div>
  )
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Erro a ler ficheiro.'))
    reader.onload = () => resolve(String(reader.result ?? ''))
    reader.readAsDataURL(file)
  })
}

