import { useState, useRef } from 'react';

const PALETTES = [
  ['#0a0a0a', '#fff'], ['#1f3a8a', '#fff'], ['#0f766e', '#fff'],
  ['#7c2d12', '#fff'], ['#581c87', '#fff'], ['#831843', '#fff'],
  ['#0c4a6e', '#fff'], ['#365314', '#fff'],
];

function hash(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name) {
  return (name || 'U').trim().split(/\s+/).map(s => s[0]).slice(0, 2).join('').toUpperCase();
}

export default function Avatar({ name, id, size = 32, fontSize, editable = false, onImageChange }) {
  const [bg, fg] = PALETTES[hash(id || name) % PALETTES.length];
  const [imageUrl, setImageUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target.result;
        setImageUrl(url);
        if (onImageChange) onImageChange(url);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClick = () => {
    if (editable && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        cursor: editable ? 'pointer' : 'default',
        position: 'relative',
        flexShrink: 0,
        boxShadow: editable ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
        border: editable ? '3px solid var(--primary)' : 'none',
      }}
      title={editable ? 'Click to change profile picture' : undefined}
    >
      {imageUrl || (typeof window !== 'undefined' && localStorage.getItem('profileImage')) ? (
        <img
          src={imageUrl || localStorage.getItem('profileImage')}
          alt="Profile"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: bg,
            color: fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize || Math.round(size * 0.38),
            fontWeight: 600,
          }}
        >
          {initials(name)}
        </div>
      )}
      
      {editable && (
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            fontSize: size * 0.2,
            textAlign: 'center',
            padding: '2px 0',
            opacity: 0,
            transition: 'opacity 0.2s',
          }}
          className="avatar-edit-overlay"
        >
          <i className="fas fa-camera" style={{ fontSize: size * 0.25 }}></i>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        style={{ display: 'none' }}
      />
      
      <style>{`
        div:hover .avatar-edit-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}
