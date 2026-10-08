'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import { FiBell, FiX, FiPackage, FiArrowRight } from 'react-icons/fi';

interface RestockItem {
  id: string;
  code: string;
  name: string;
  type: string;
  stockAkhir: number;
  stockMin: number;
  deficit: number;
}

interface RestockAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: RestockItem[];
}

const typeColors: Record<string, string> = {
  RAW: '#4FC3F7',
  PRODUCT: '#F97316',
  PACKAGE: '#1E88E5',
};

const typeLabels: Record<string, string> = {
  RAW: 'Raw',
  PRODUCT: 'Product',
  PACKAGE: 'Package',
};

export function RestockAlertModal({ isOpen, onClose, alerts }: RestockAlertModalProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  const handleGoToInventory = () => {
    onClose();
    router.push('/inventory');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: `rgba(0,0,0,${isAnimating ? 0.45 : 0})`,
        backdropFilter: `blur(${isAnimating ? 4 : 0}px)`,
        transition: 'background-color 0.3s ease, backdrop-filter 0.3s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          backgroundColor: colors.neutral.card,
          borderRadius: '18px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.18), 0 0 0 1px rgba(30,136,229,0.1)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: isAnimating ? 'scale(1) translateY(0)' : 'scale(0.93) translateY(20px)',
          opacity: isAnimating ? 1 : 0,
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s ease',
        }}
      >
        {/* Header — biru */}
        <div
          style={{
            background: colors.brand.gradient,
            padding: '22px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '13px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backdropFilter: 'blur(4px)',
            }}
          >
            <FiBell size={22} color="white" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: '17px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '4px',
                letterSpacing: '-0.01em',
              }}
            >
              Peringatan Stok Menipis!
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
              {alerts.length} item perlu segera direstok sebelum kehabisan stok.
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1.5px solid rgba(255,255,255,0.3)',
              backgroundColor: 'rgba(255,255,255,0.15)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'; }}
          >
            <FiX size={15} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
            {alerts.map((item, index) => {
              const ratio = item.stockMin > 0 ? item.stockAkhir / item.stockMin : 0;
              const pct = Math.round(ratio * 100);
              const isCritical = item.stockAkhir <= 0;
              // bar: merah jika kritis, biru tua jika < 30%, biru sedang lainnya
              const barColor = isCritical
                ? colors.semantic.red
                : ratio < 0.3
                ? colors.brand[700]
                : colors.brand[500];

              return (
                <div
                  key={item.id}
                  style={{
                    border: `1px solid ${isCritical ? '#FECACA' : '#BFDBFE'}`,
                    borderRadius: '10px',
                    padding: '12px 14px',
                    backgroundColor: isCritical ? '#FFF5F5' : '#F0F7FF',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    animation: `slideInItem 0.3s ease both`,
                    animationDelay: `${index * 0.05}s`,
                  }}
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '9px',
                      border: `1.5px solid ${typeColors[item.type] || colors.brand[500]}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      backgroundColor: `${typeColors[item.type] || colors.brand[500]}18`,
                    }}
                  >
                    <FiPackage size={15} color={typeColors[item.type] || colors.brand[500]} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '700',
                          color: 'white',
                          backgroundColor: typeColors[item.type] || colors.brand[500],
                          padding: '1px 7px',
                          borderRadius: '20px',
                          lineHeight: 1.6,
                        }}
                      >
                        {typeLabels[item.type] || item.type}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: '600',
                          color: '#9CA3AF',
                          fontFamily: 'monospace',
                        }}
                      >
                        {item.code}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: colors.neutral.textStrong,
                        marginBottom: '7px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {item.name}
                    </div>
                    {/* Progress bar */}
                    <div
                      style={{
                        height: '5px',
                        backgroundColor: '#DBEAFE',
                        borderRadius: '99px',
                        overflow: 'hidden',
                        marginBottom: '5px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: barColor,
                          borderRadius: '99px',
                          transition: 'width 0.6s ease',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', gap: '10px' }}>
                      <span>
                        Stok:{' '}
                        <b style={{ color: isCritical ? colors.semantic.red : colors.brand[700] }}>
                          {item.stockAkhir}
                        </b>
                      </span>
                      <span>
                        Min: <b>{item.stockMin}</b>
                      </span>
                      <span style={{ color: isCritical ? colors.semantic.red : colors.brand[700], fontWeight: '600' }}>
                        {isCritical ? '🚨 Habis!' : `−${item.deficit} kurang`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            borderTop: `1px solid ${colors.neutral.border}`,
            padding: '14px 20px',
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            flexShrink: 0,
            backgroundColor: '#F8FAFF',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: `1px solid ${colors.neutral.border}`,
              backgroundColor: 'white',
              color: colors.neutral.textMuted,
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
          >
            Nanti
          </button>
          <button
            id="restock-modal-go-inventory-btn"
            onClick={handleGoToInventory}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              border: 'none',
              background: colors.brand.gradient,
              color: 'white',
              fontSize: '13px',
              fontWeight: '700',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 12px rgba(30,136,229,0.35)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 7px 18px rgba(30,136,229,0.45)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(30,136,229,0.35)';
            }}
          >
            Ke Halaman Inventory
            <FiArrowRight size={14} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInItem {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
