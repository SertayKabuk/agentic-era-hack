import React from "react";

export type ConnectionDrawerProps = {
  open: boolean;
  serverUrl: string;
  userId: string;
  onServerUrlChange: (value: string) => void;
  onUserIdChange: (value: string) => void;
  onClose: () => void;
};

export default function ConnectionDrawer({
  open,
  serverUrl,
  userId,
  onServerUrlChange,
  onUserIdChange,
  onClose,
}: ConnectionDrawerProps) {
  if (!open) {
    return null;
  }

  return (
    <>
      <div className="connection-scrim" onClick={onClose} />
      <aside className="connection-drawer open">
        <div className="drawer-header">
          <h3>Bağlantı Ayarları</h3>
          <button className="close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined filled">close</span>
          </button>
        </div>
        <div className="drawer-content">
          <div className="group">
            <label htmlFor="server-url">Server URL</label>
            <input
              id="server-url"
              type="text"
              value={serverUrl}
              onChange={(e) => onServerUrlChange(e.target.value)}
              placeholder="ws://localhost:8000/"
            />
          </div>
          <div className="group">
            <label htmlFor="user-id">User ID</label>
            <input
              id="user-id"
              type="text"
              value={userId}
              onChange={(e) => onUserIdChange(e.target.value)}
              placeholder="user123"
            />
          </div>
        </div>
      </aside>
    </>
  );
}

