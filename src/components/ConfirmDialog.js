'use client'
import Modal from './Modal'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirm'}>
      <p className="text-blue-100/70 mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-ghost">Cancel</button>
        <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-gold'}>Confirm</button>
      </div>
    </Modal>
  )
}
