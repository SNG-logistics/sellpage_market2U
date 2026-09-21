type Props = { reason: 'missing' | 'corrupted' | 'incompatible' }

const copy: Record<Props['reason'], string> = {
  missing: 'This page has not been published yet.',
  corrupted: 'This page could not be loaded right now.',
  incompatible: 'This page needs to be updated in the editor before it can be shown.',
}

/**
 * Shown instead of a blank page whenever publishedConfig is missing,
 * corrupted, or on an incompatible schema version.
 */
export function FallbackPage({ reason }: Props) {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
      <div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>Page unavailable</h1>
        <p style={{ color: '#6b6a63' }}>{copy[reason]}</p>
      </div>
    </div>
  )
}
