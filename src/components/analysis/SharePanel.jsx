import ShareButtons from '../shared/ShareButtons'

export default function SharePanel({ track }) {
  return (
    <div style={{ padding: '24px' }}>
      <ShareButtons track={track} />
      <div style={{ height: 'calc(env(safe-area-inset-bottom) + 24px)' }} />
    </div>
  )
}
