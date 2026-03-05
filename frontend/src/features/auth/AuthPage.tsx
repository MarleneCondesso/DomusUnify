
//import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query'
import { useState, useEffect, useMemo, useRef } from 'react'
import { domusApi, type AuthResponse } from '../../api/domusApi'
import { ApiError } from '../../api/http'
import { LoadingSpinner } from '../../ui/LoadingSpinner'
import { useI18n } from '../../i18n/i18n'

type AuthPageProps = {
  onAuthenticated: (auth: AuthResponse) => void
}

type GoogleCredentialResponse = {
    credential?: string
}

type GoogleRenderButtonOptions = {
    theme?: 'outline' | 'filled_blue' | 'filled_black'
    size?: 'large' | 'medium' | 'small'
    shape?: 'rectangular' | 'pill' | 'circle' | 'square'
    width?: number
}

type GoogleAccountsId = {
    initialize: (options: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void
    renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
}

type GoogleGlobal = {
    accounts?: {
        id?: GoogleAccountsId
    }
}

export function AuthPage({ onAuthenticated }: AuthPageProps) {

    const { t } = useI18n()

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [mode, setMode] = useState<'login' | 'register'>('register');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (mode === 'login') loginMutation.mutate()
        else registerMutation.mutate()

    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const [externalAuthError, setExternalAuthError] = useState<string | null>(null)
    const [isGoogleButtonReady, setIsGoogleButtonReady] = useState(false)

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

    const loginMutation = useMutation({
        mutationFn: () => domusApi.login({ email: formData.email, password: formData.password }),
        onSuccess: onAuthenticated,
        onMutate: () => setExternalAuthError(null),
    })

    const registerMutation = useMutation({
        mutationFn: () => domusApi.register({ name: formData.name, email: formData.email, password: formData.password }),
        onSuccess: onAuthenticated,
        onMutate: () => setExternalAuthError(null),
    })

    const googleMutation = useMutation({
        mutationFn: (idToken: string) => domusApi.loginWithGoogle({ idToken }),
        onSuccess: onAuthenticated,
        onMutate: () => setExternalAuthError(null),
    })

    const isBusy =
        loginMutation.isPending ||
        registerMutation.isPending ||
        googleMutation.isPending

    const error = loginMutation.error || registerMutation.error || googleMutation.error

    const errorMessage = useMemo(() => {
        if (externalAuthError) return externalAuthError
        if (!error) return null
        if (error instanceof ApiError) {
            // O backend por vezes devolve strings simples (ex.: "Credenciais inválidas.")
            return typeof error.body === 'string' ? error.body : JSON.stringify(error.body)
        }
        return t('common.unexpectedError')
    }, [error, externalAuthError, t])

    const googleButtonRef = useRef<HTMLDivElement | null>(null)
    const googleInitRef = useRef(false)

    useEffect(() => {
        if (!googleClientId) return
        if (!googleButtonRef.current) return
        if (googleInitRef.current) return

        let cancelled = false
        const startedAt = Date.now()

        const interval = window.setInterval(() => {
            if (cancelled) return

            const google = (window as unknown as { google?: GoogleGlobal }).google
            if (!google?.accounts?.id) {
                if (Date.now() - startedAt > 8000) {
                    window.clearInterval(interval)
                    setExternalAuthError(t('auth.google.loadFailed'))
                }
                return
            }

            window.clearInterval(interval)
            if (cancelled) return

            google.accounts.id.initialize({
                client_id: googleClientId,
                callback: (response) => {
                    const credential = response?.credential
                    if (!credential) {
                        setExternalAuthError(t('auth.google.noCredential'))
                        return
                    }
                    googleMutation.mutate(credential)
                },
            })

            // Evita render duplicado em re-mount/hot reload.
            googleButtonRef.current!.innerHTML = ''
            const width = Math.floor(googleButtonRef.current!.getBoundingClientRect().width)

            google.accounts.id.renderButton(googleButtonRef.current!, {
                theme: 'outline',
                size: 'large',
                shape: 'pill',
                width: width > 0 ? width : undefined,
            })

            googleInitRef.current = true
            setIsGoogleButtonReady(true)
        }, 200)

        return () => {
            cancelled = true
            window.clearInterval(interval)
        }
    }, [googleClientId, googleMutation, t])

    return (
        <div className="min-h-screen flex w-full bg-offwhite">
            <div className="w-full flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    <div className="mb-10">
                        <div className="inline-flex items-center gap-3 mb-8">
                            <img src="https://static.readdy.ai/image/db3a1baa272b7103d1d66e2499b34854/ea4cd7db0748495157154226b17ae713.png" alt="DomusUnify" className="w-10 h-10 object-contain" />
                            <span className="text-xl font-bold lg:hidden text-forest">DomusUnify</span>
                        </div>
                        <h2 className="text-5xl font-bold text-charcoal mb-3">{t('auth.welcome.title')}</h2>
                        <p className="text-base text-gray-600">{t('auth.welcome.subtitle')}</p>
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-black/20 p-1">
                        <button
                            className={[
                                'rounded-lg px-3 py-2 text-sm font-medium transition',
                                mode === 'login' ? 'bg-forest text-white' : 'text-white/70 hover:text-white',
                             ].join(' ')}
                            onClick={() => setMode('login')}
                            type="button"
                            disabled={isBusy}
                        >
                            {t('auth.mode.signIn')}
                        </button>
                        <button
                            className={[
                                'rounded-lg px-3 py-2 text-sm font-medium transition',
                                mode === 'register' ? 'bg-forest text-white' : 'text-white/70 hover:text-white',
                            ].join(' ')}
                            onClick={() => setMode('register')}
                            type="button"
                            disabled={isBusy}
                        >
                            {t('auth.mode.createAccount')}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                        {mode === 'register' && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
                                    {t('auth.field.fullName')}
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent text-base bg-white"
                                    placeholder={t('auth.placeholder.fullName')}
                                    autoComplete='name'
                                    required
                                />
                            </div>
                        )}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                                {t('auth.field.email')}
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                autoComplete='email'
                                onChange={handleChange}
                                className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent text-base bg-white"
                                placeholder={t('auth.placeholder.email')}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                                {t('auth.field.password')}
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                                    onChange={handleChange}
                                    className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent text-base pr-12 bg-white"
                                    placeholder={t('auth.placeholder.password')}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-charcoal transition-colors cursor-pointer"
                                >
                                    <i className={showPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <>
                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
                                        {t('auth.field.confirmPassword')}
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            autoComplete='confirm-new-password'
                                            className="w-full px-4 py-4 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber focus:border-transparent text-base pr-12 bg-white"
                                            placeholder={t('auth.placeholder.confirmPassword')}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-charcoal transition-colors cursor-pointer"
                                        >
                                            <i className={showConfirmPassword ? 'ri-eye-off-line text-xl' : 'ri-eye-line text-xl'}></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2">
                                    <input type="checkbox" id="terms" className="w-4 h-4 border-gray-300 text-amber focus:ring-0 mt-1" required />
                                    <label htmlFor="terms" className="text-sm text-gray-600">
                                        {t('auth.terms.prefix')}{' '}
                                        <a href="#" className="text-amber-dark hover:text-amber transition-colors cursor-pointer">
                                            {t('auth.terms.termsOfService')}
                                        </a>{' '}
                                        {t('auth.terms.and')}{' '}
                                        <a href="#" className="text-amber-dark hover:text-amber transition-colors cursor-pointer">
                                            {t('auth.terms.privacyPolicy')}
                                        </a>
                                    </label>
                                </div>
                            </>
                        )}
                        {errorMessage && (
                            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
                                {t('common.error')}: {errorMessage}
                            </div>
                        )}
                        <button
                            type="submit"
                              disabled={isBusy}
                            className={[
                              'px-4 w-full py-4 rounded-full text-base font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap border',
                              isBusy
                                ? 'bg-offwhite text-forest border-forest/20 cursor-wait'
                                : 'bg-forest text-white border-transparent hover:bg-emerald-700 cursor-pointer',
                              'disabled:opacity-70',
                            ].join(' ')}
                        >
                            {isBusy && <LoadingSpinner size="sm" />}
                            <span>{mode === 'login' ? t('auth.submit.signIn') : t('auth.submit.createAccount')}</span>
                            {!isBusy && <i className="ri-arrow-right-line"></i>}
                        </button>
                    </form>

                    <div className="mt-8">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-offwhite text-gray-500">{t('auth.continueWith')}</span>
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 text-charcoal">
                            {googleClientId ? (
                              <div className="relative min-h-12">
                                {!isGoogleButtonReady && !externalAuthError && (
                                  <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-gray-300 bg-white/60">
                                    <LoadingSpinner size="sm" />
                                  </div>
                                )}
                                <div
                                  ref={googleButtonRef}
                                  className="flex items-center justify-center min-h-12"
                                  style={isBusy ? { pointerEvents: 'none', opacity: 0.6 } : undefined}
                                />
                              </div>
                            ) : (
                              <button
                                className="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white/60 whitespace-nowrap"
                                type="button"
                                disabled
                              >
                                <i className="ri-google-fill text-xl"></i>
                                <span className="text-sm font-medium">{t('auth.google')}</span>
                              </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
