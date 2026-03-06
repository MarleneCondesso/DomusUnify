import { useI18n } from '../i18n/i18n'

type Props = {
  /**
   * Tamanho do spinner.
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * Texto opcional ao lado do spinner.
   */
  label?: string

  /**
   * Classes para o container.
   */
  className?: string

  /**
   * Classes para o loader (para ajustar layout/cores via CSS vars, etc.).
   */
  spinnerClassName?: string

  /**
   * Classes para o texto (label).
   */
  labelClassName?: string
}

export function LoadingSpinner({ size = 'md', label, className, spinnerClassName, labelClassName }: Props) {
  const { t } = useI18n()
  const ariaLabel = label ?? t('common.loading')

  const dotSize = size === 'sm' ? '4px' : size === 'lg' ? '12px' : '8px'
  const loaderStyle = { ['--domus-loader-dot' as never]: dotSize } as React.CSSProperties

  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={['inline-flex items-center justify-center gap-2', className].filter(Boolean).join(' ')}
    >
      <div
        className={['domus-loading-bubbles', spinnerClassName].filter(Boolean).join(' ')}
        style={loaderStyle}
        aria-hidden="true"
      >
        <span className="domus-loading-bubbles__dot" />
        <span className="domus-loading-bubbles__dot" />
        <span className="domus-loading-bubbles__dot" />
        <span className="domus-loading-bubbles__dot" />
      </div>
      {label ? (
        <span className={labelClassName ?? 'text-sm text-gray-600'}>{label}</span>
      ) : (
        <span className="sr-only">{ariaLabel}</span>
      )}
    </div>
  )
}
