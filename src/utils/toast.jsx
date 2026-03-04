import hotToast from 'react-hot-toast';

/**
 * Custom toast wrapper that adds a close (dismiss) button to every toast.
 * Drop-in replacement: import toast from '../utils/toast' instead of 'react-hot-toast'.
 */

const withClose = (message, opts = {}) =>
  hotToast(
    (t) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{message}</span>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
            color: '#888',
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </span>
    ),
    opts
  );

const toast = (message, opts) => withClose(message, opts);

toast.success = (message, opts = {}) =>
  hotToast.success(
    (t) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{message}</span>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
            color: '#888',
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </span>
    ),
    opts
  );

toast.error = (message, opts = {}) =>
  hotToast.error(
    (t) => (
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span>{message}</span>
        <button
          onClick={() => hotToast.dismiss(t.id)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '2px 4px',
            color: '#888',
            flexShrink: 0,
          }}
          aria-label="Close"
        >
          ✕
        </button>
      </span>
    ),
    opts
  );

toast.loading = (message, opts = {}) => hotToast.loading(message, opts);
toast.dismiss = hotToast.dismiss;
toast.remove = hotToast.remove;
toast.promise = hotToast.promise;
toast.custom = hotToast.custom;

export default toast;
