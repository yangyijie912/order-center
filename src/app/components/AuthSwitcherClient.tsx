'use client';

import React, { useState, useEffect } from 'react';
import { Button, Modal, Toast } from 'beaver-ui';
import { useAuthRole } from '@/features/auth/useAuthRole';
import type { Role } from '@/features/auth/roles';

function setRoleCookieAndStorage(role: Role) {
  // 设置 cookie（demo 用，path=/ 以便服务器能读取）
  try {
    document.cookie = `oc_role=${role}; path=/`;
  } catch {
    // ignore
  }
  try {
    localStorage.setItem('oc_role', role);
  } catch {
    // ignore
  }
}

export default function AuthSwitcherClient({ inline }: { inline?: boolean }) {
  const current = useAuthRole('viewer');
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<Role | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {inline ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {mounted ? <div style={{ fontSize: 13, color: '#333' }}>{current}</div> : null}
          <Button size="small" variant="ghost" onClick={() => setOpen(true)}>
            切换角色
          </Button>
        </div>
      ) : (
        <div style={{ position: 'fixed', right: 12, top: 12, zIndex: 9999 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {mounted ? <div style={{ fontSize: 13, color: '#333' }}>{current}</div> : null}
            <Button size="small" variant="ghost" onClick={() => setOpen(true)}>
              切换角色
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={open}
        title="选择角色"
        onClose={() => setOpen(false)}
        footer={
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!pick) {
                  Toast.info('请选择一个角色');
                  return;
                }
                setRoleCookieAndStorage(pick);
                Toast.success(`已切换为 ${pick}，页面将刷新`);
                setTimeout(() => {
                  // reload to let server-side read cookie
                  window.location.reload();
                }, 300);
              }}
            >
              确认
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 8 }}>
          {(['admin', 'operator', 'viewer'] as Role[]).map((r) => (
            <div
              key={r}
              onClick={() => setPick(r)}
              style={{
                padding: 10,
                border: pick === r ? '1px solid #1677ff' : '1px solid #eee',
                borderRadius: 6,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: 14 }}>{r}</div>
              {pick === r ? <div style={{ color: '#1677ff' }}>已选</div> : null}
            </div>
          ))}
          <div style={{ fontSize: 12, color: '#666' }}>切换后将在当前页面刷新，服务器端会读取 cookie 以决定权限。</div>
        </div>
      </Modal>
    </>
  );
}
