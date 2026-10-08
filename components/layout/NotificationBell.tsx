'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { colors } from '@/lib/theme';
import { useRestockAlertsContext } from '@/components/layout/RestockAlertsContext';
import { FiBell, FiPackage, FiArrowRight, FiRefreshCw, FiCheckCircle } from 'react-icons/fi';

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

const PANEL_WIDTH = 320;

export function NotificationBell() {
  const router = useRouter();
  const { alerts, refetch } = useRestockAlertsContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Wait for client mount before using portals
  useEffect(() => { setMounted(true); }, []);

  // Calculate position of dropdown relative to bell button in viewport
  const updatePos = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const gap = 8;
    const panelW = Math.min(PANEL_WIDTH, window.innerWidth - 16);

    // If button is on the left side (e.g. sidebar header), open aligned to button left
    let left: number;
    if (rect.left < PANEL_WIDTH) {
      left = Math.max(8, rect.left);
    } else {
      left = rect.right - panelW;
    }

    // Keep within horizontal screen bounds
    if (left + panelW > window.innerWidth - 8) {
      left = window.innerWidth - 8 - panelW;
    }
    if (left < 8) left = 8;

    // Check vertical bounds: avoid overflowing bottom of screen
    let top = rect.bottom + gap;
    if (top + 280 > window.innerHeight && rect.top > 280) {
      top = Math.max(8, rect.top - gap - 280);
    }

    setPanelPos({ top, left });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updatePos();
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    window.addEventListener('orientationchange', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('orientationchange', updatePos);
    };
  }, [isOpen, updatePos]);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        bellRef.current && !bellRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleGoToInventory = () => {
    setIsOpen(false);
    router.push('/inventory');
  };

  const count = alerts.length;

  const dropdownPanel = mounted && isOpen ? createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: panelPos.top,
        left: panelPos.left,
        width: Math.min(PANEL_WIDTH, typeof window !== 'undefined' ? window.innerWidth - 16 : PANEL_WIDTH),
        maxHeight: 'calc(100dvh - 32px)',
        backgroundColor: colors.neutral.card,
        borderRadius: '14px',
        border: `1px solid ${colors.neutral.border}`,
        boxShadow: '0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.08)',
        zIndex: 9999,
        overflow: 'hidden',
        animation: 'notifDropdownIn 0.2s cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: '13px 15px 11px',
          borderBottom: `1px solid ${colors.neutral.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: count > 0 ? 'linear-gradient(135deg, #EFF6FF, #DBEAFE)' : '#F9FAFB',
        }}
      >
        <div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: colors.neutral.textStrong }}>
            Peringatan Restock
          </div>
          <div style={{ fontSize: '10px', color: count > 0 ? colors.brand[700] : colors.neutral.textMuted, marginTop: '1px' }}>
            {count > 0 ? `${count} item perlu direstok` : 'Semua stok aman'}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          aria-label="Refresh notifikasi"
          style={{
            width: '26px',
            height: '26px',
            borderRadius: '7px',
            border: `1px solid ${colors.neutral.border}`,
            backgroundColor: 'white',
            color: colors.neutral.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiRefreshCw size={11} style={{ animation: isRefreshing ? 'notifSpin 0.8s linear infinite' : 'none' }} />
        </button>
      </div>

      {/* Items List */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {count === 0 ? (
          <div
            style={{
              padding: '28px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FiCheckCircle size={26} color={colors.semantic.green} />
            <div style={{ fontSize: '12px', fontWeight: '600', color: colors.semantic.green }}>
              Semua stok aman!
            </div>
            <div style={{ fontSize: '11px', color: colors.neutral.textMuted, textAlign: 'center' }}>
              Tidak ada item yang perlu direstok.
            </div>
          </div>
        ) : (
          alerts.map((item) => {
            const ratio = item.stockMin > 0 ? item.stockAkhir / item.stockMin : 0;
            const pct = Math.round(ratio * 100);
            const isCritical = item.stockAkhir <= 0;

            return (
              <button
                key={item.id}
                id={`notif-item-${item.id}`}
                onClick={handleGoToInventory}
                style={{
                  width: '100%',
                  padding: '10px 15px',
                  border: 'none',
                  borderBottom: `1px solid ${colors.neutral.border}`,
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'background-color 0.12s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = isCritical ? '#FFF5F5' : '#EFF6FF'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    border: `1.5px solid ${typeColors[item.type] || colors.brand[500]}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    backgroundColor: `${typeColors[item.type] || colors.brand[500]}15`,
                  }}
                >
                  <FiPackage size={13} color={typeColors[item.type] || colors.brand[500]} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <span
                      style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: 'white',
                        backgroundColor: typeColors[item.type] || colors.brand[500],
                        padding: '1px 5px',
                        borderRadius: '20px',
                      }}
                    >
                      {typeLabels[item.type] || item.type}
                    </span>
                    <span style={{ fontSize: '9px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                      {item.code}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: colors.neutral.textStrong,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      marginBottom: '4px',
                    }}
                  >
                    {item.name}
                  </div>
                  <div
                    style={{
                      height: '3px',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '99px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        backgroundColor: isCritical ? colors.semantic.red : colors.brand[500],
                        borderRadius: '99px',
                      }}
                    />
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: isCritical ? colors.semantic.red : colors.brand[700],
                    }}
                  >
                    {item.stockAkhir <= 0 ? '🚨 Habis' : `${item.stockAkhir}/${item.stockMin}`}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      {count > 0 && (
        <button
          id="notif-go-inventory-btn"
          onClick={handleGoToInventory}
          style={{
            width: '100%',
            padding: '11px 15px',
            border: 'none',
            borderTop: `1px solid ${colors.neutral.border}`,
            background: colors.brand.gradient,
            color: 'white',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          Lihat Semua di Halaman Inventory
          <FiArrowRight size={12} />
        </button>
      )}
    </div>,
    document.body
  ) : null;

  return (
    <>
      {/* Bell Button */}
      <button
        ref={bellRef}
        id="notification-bell-btn"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={`Notifikasi restock${count > 0 ? ` - ${count} item` : ''}`}
        style={{
          position: 'relative',
          width: '34px',
          height: '34px',
          borderRadius: '9px',
          border: isOpen
            ? `1.5px solid ${colors.brand[500]}`
            : count > 0
            ? `1.5px solid ${colors.brand[400]}`
            : `1.5px solid ${colors.neutral.border}`,
          backgroundColor: isOpen ? '#EFF6FF' : count > 0 ? '#EFF6FF' : 'white',
          color: count > 0 ? colors.brand[500] : colors.neutral.textMuted,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          boxShadow: count > 0
            ? '0 2px 8px rgba(30,136,229,0.18)'
            : '0 1px 3px rgba(0,0,0,0.06)',
          animation: count > 0 && !isOpen ? 'notifBellPulse 2.5s ease-in-out infinite' : 'none',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = count > 0 ? '#DBEAFE' : '#F9FAFB';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.backgroundColor = count > 0 ? '#EFF6FF' : 'white';
            e.currentTarget.style.transform = 'translateY(0)';
          }
        }}
      >
        <FiBell
          size={16}
          style={{
            animation: count > 0 && !isOpen ? 'notifBellShake 3s ease-in-out infinite' : 'none',
            flexShrink: 0,
          }}
        />
        {/* Badge */}
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              minWidth: '17px',
              height: '17px',
              borderRadius: '99px',
              background: `linear-gradient(135deg, ${colors.semantic.red}, #DC2626)`,
              color: 'white',
              fontSize: '9px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              border: '2px solid white',
              boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
              lineHeight: 1,
            }}
          >
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown rendered via portal — never clipped by parent overflow */}
      {dropdownPanel}

      <style>{`
        @keyframes notifBellShake {
          0%, 60%, 100% { transform: rotate(0deg); }
          62% { transform: rotate(-10deg); }
          66% { transform: rotate(10deg); }
          70% { transform: rotate(-7deg); }
          74% { transform: rotate(7deg); }
          78% { transform: rotate(-3deg); }
          82% { transform: rotate(3deg); }
          86% { transform: rotate(0deg); }
        }
        @keyframes notifBellPulse {
          0%, 100% { box-shadow: 0 2px 8px rgba(30,136,229,0.18); }
          50% { box-shadow: 0 2px 16px rgba(30,136,229,0.40); }
        }
        @keyframes notifDropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
